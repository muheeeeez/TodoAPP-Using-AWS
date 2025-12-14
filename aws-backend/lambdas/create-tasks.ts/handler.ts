import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { getUserId } from '../utils/getUserId';
import { validateCreateTaskInput, ValidationError } from '../utils/validation';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';
import { addCorsHeaders } from '../utils/corsHeaders';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);
  
  try {
    logger.info('Creating new task', { body: event.body });

    // Validate environment variable
    if (!process.env.TASKS_TABLE_NAME) {
      throw new AppError(500, 'TASKS_TABLE_NAME environment variable is not set', 'Configuration Error');
    }

    // Get and validate user ID
    const userId = getUserId(event);
    logger.setUserId(userId);
    logger.info('User authenticated', { userId });

    // Parse and validate request body
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
      validatedInput = validateCreateTaskInput(body);
    } catch (validationError) {
      if (validationError instanceof ValidationError) {
        logger.warn('Validation failed', { errors: validationError.errors });
        throw new AppError(400, validationError.errors.join('; '), 'Validation Error');
      }
      throw validationError;
    }

    // Create task object
    const taskId = randomUUID();
    const createdAt = new Date().toISOString();
    const task = {
      userId,
      taskId,
      title: validatedInput.title,
      description: validatedInput.description,
      status: 'pending' as const,
      createdAt,
    };

    logger.debug('Saving task to DynamoDB', { taskId, userId });

    // Save to DynamoDB
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.TASKS_TABLE_NAME,
      Item: task,
    }));

    logger.info('Task created successfully', { taskId, userId });

    return {
      statusCode: 201,
      headers: addCorsHeaders({
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      }),
      body: JSON.stringify(task),
    };
  } catch (error) {
    logger.error('Error creating task', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};
