import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { verifyPassword, generateToken, isValidEmail } from '../utils/auth';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';
import { addCorsHeaders } from '../utils/corsHeaders';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);
  
  try {
    logger.info('User login request');

    // Validate environment variable
    if (!process.env.USERS_TABLE_NAME) {
      throw new AppError(500, 'USERS_TABLE_NAME environment variable is not set', 'Configuration Error');
    }

    // Parse request body
    let body;
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch (parseError) {
      logger.error('Invalid JSON in request body', parseError as Error);
      throw new AppError(400, 'Invalid JSON in request body', 'Bad Request');
    }

    const { email, password } = body;

    // Validate input
    if (!email || !isValidEmail(email)) {
      throw new AppError(400, 'Valid email is required', 'Validation Error');
    }

    if (!password) {
      throw new AppError(400, 'Password is required', 'Validation Error');
    }

    logger.info('Fetching user', { email });

    // Get user from database
    const result = await ddbDocClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { email: email.toLowerCase() },
    }));

    if (!result.Item) {
      // Use generic error message to prevent email enumeration
      throw new AppError(401, 'Invalid email or password', 'Unauthorized');
    }

    const user = result.Item;

    // Verify password
    const isPasswordValid = verifyPassword(
      password,
      user.passwordHash,
      user.passwordSalt
    );

    if (!isPasswordValid) {
      logger.warn('Invalid password attempt', { email });
      throw new AppError(401, 'Invalid email or password', 'Unauthorized');
    }

    // Update last login time
    await ddbDocClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { email: email.toLowerCase() },
      UpdateExpression: 'SET lastLoginAt = :now',
      ExpressionAttributeValues: {
        ':now': new Date().toISOString(),
      },
    }));

    // Generate JWT token
    const token = generateToken({
      userId: user.userId,
      email: user.email,
    });

    logger.info('User logged in successfully', { userId: user.userId, email });

    return {
      statusCode: 200,
      headers: addCorsHeaders({
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      }),
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          userId: user.userId,
          email: user.email,
          username: user.username,
        },
      }),
    };
  } catch (error) {
    logger.error('Error during login', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};

