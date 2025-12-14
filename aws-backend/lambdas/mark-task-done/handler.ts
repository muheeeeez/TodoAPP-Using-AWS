import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getUserId } from '../utils/getUserId';
import { validateTaskId, ValidationError } from '../utils/validation';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);

  try {
    logger.info('Marking task as done', { taskId: event.pathParameters?.taskId });

    // Validate environment variable
    if (!process.env.TASKS_TABLE_NAME) {
      throw new AppError(500, 'TASKS_TABLE_NAME environment variable is not set', 'Configuration Error');
    }

    // Get and validate user ID
    const userId = getUserId(event);
    logger.setUserId(userId);

    // Validate task ID
    let taskId: string;
    try {
      taskId = validateTaskId(event.pathParameters?.taskId);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        logger.warn('Task ID validation failed', { errors: validationError.errors });
        throw new AppError(400, validationError.errors.join('; '), 'Validation Error');
      }
      throw validationError;
    }

    logger.debug('Updating task status in DynamoDB', { taskId, userId });

    const result = await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.TASKS_TABLE_NAME,
      Key: {
        userId,
        taskId,
      },
      UpdateExpression: "SET #status = :status, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#status": "status",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":status": "completed",
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(userId) AND attribute_exists(taskId)",
    }));

    if (!result.Attributes) {
      logger.warn('Task not found', { taskId, userId });
      throw new AppError(404, 'Task not found', 'Not Found');
    }

    logger.info('Task marked as done successfully', { taskId, userId });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
      body: JSON.stringify(result.Attributes),
    };
  } catch (error) {
    logger.error('Error marking task as done', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};

