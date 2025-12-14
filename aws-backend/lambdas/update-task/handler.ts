import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getUserId } from '../utils/getUserId';
import { validateUpdateTaskInput, validateTaskId, ValidationError } from '../utils/validation';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);

  try {
    logger.info('Updating task', { 
      taskId: event.pathParameters?.taskId,
      body: event.body 
    });

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

    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      logger.error('Invalid JSON in request body', parseError as Error);
      throw new AppError(400, 'Invalid JSON in request body', 'Bad Request');
    }

    // Validate input
    let validatedInput;
    try {
      validatedInput = validateUpdateTaskInput(body);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        logger.warn('Input validation failed', { errors: validationError.errors });
        throw new AppError(400, validationError.errors.join('; '), 'Validation Error');
      }
      throw validationError;
    }

    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (validatedInput.title !== undefined) {
      updateExpressions.push("#title = :title");
      expressionAttributeNames["#title"] = "title";
      expressionAttributeValues[":title"] = validatedInput.title;
    }

    if (validatedInput.description !== undefined) {
      updateExpressions.push("#description = :description");
      expressionAttributeNames["#description"] = "description";
      expressionAttributeValues[":description"] = validatedInput.description;
    }

    if (validatedInput.status !== undefined) {
      updateExpressions.push("#status = :status");
      expressionAttributeNames["#status"] = "status";
      expressionAttributeValues[":status"] = validatedInput.status;
    }

    // Add updatedAt timestamp
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    logger.debug('Updating task in DynamoDB', { taskId, userId, updates: Object.keys(validatedInput) });

    const result = await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.TASKS_TABLE_NAME,
      Key: {
        userId,
        taskId,
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(userId) AND attribute_exists(taskId)",
    }));

    if (!result.Attributes) {
      logger.warn('Task not found', { taskId, userId });
      throw new AppError(404, 'Task not found', 'Not Found');
    }

    logger.info('Task updated successfully', { taskId, userId });

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
    logger.error('Error updating task', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};

