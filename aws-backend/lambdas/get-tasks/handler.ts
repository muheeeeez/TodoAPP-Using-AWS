import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getUserId } from '../utils/getUserId';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);

  try {
    logger.info('Fetching user tasks');

    // Validate environment variable
    if (!process.env.TASKS_TABLE_NAME) {
      throw new AppError(500, 'TASKS_TABLE_NAME environment variable is not set', 'Configuration Error');
    }

    // Get and validate user ID
    const userId = getUserId(event);
    logger.setUserId(userId);
    logger.info('User authenticated', { userId });

    logger.debug('Querying DynamoDB for user tasks', { userId });

    const result = await ddbDocClient.send(new QueryCommand({
      TableName: process.env.TASKS_TABLE_NAME,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: {
        ':uid': userId,
      },
    }));

    logger.info('Tasks fetched successfully', { 
      userId, 
      count: result.Items?.length || 0 
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    logger.error('Error fetching tasks', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};
