import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { hashPassword, isValidEmail, isValidPassword } from '../utils/auth';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';
import { addCorsHeaders } from '../utils/corsHeaders';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);
  
  try {
    logger.info('User signup request');

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

    const { email, password, username } = body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      throw new AppError(400, 'Valid email is required', 'Validation Error');
    }

    // Validate password
    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.valid) {
      throw new AppError(400, passwordValidation.message || 'Invalid password', 'Validation Error');
    }

    // Validate username (optional)
    const displayName = username?.trim() || email.split('@')[0];

    logger.info('Checking if user exists', { email });

    // Check if user already exists
    const existingUser = await ddbDocClient.send(new GetCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { email: email.toLowerCase() },
    }));

    if (existingUser.Item) {
      throw new AppError(409, 'An account with this email already exists', 'Conflict');
    }

    // Hash password
    const { hash, salt } = hashPassword(password);

    // Create user
    const userId = randomUUID();
    const createdAt = new Date().toISOString();
    
    const user = {
      email: email.toLowerCase(),
      userId,
      username: displayName,
      passwordHash: hash,
      passwordSalt: salt,
      createdAt,
      updatedAt: createdAt,
    };

    logger.debug('Creating user account', { userId, email });

    await ddbDocClient.send(new PutCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Item: user,
      ConditionExpression: 'attribute_not_exists(email)', // Extra safety check
    }));

    logger.info('User account created successfully', { userId, email });

    // Return user data (without password hash/salt)
    return {
      statusCode: 201,
      headers: addCorsHeaders({
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      }),
      body: JSON.stringify({
        message: 'Account created successfully',
        user: {
          userId: user.userId,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
      }),
    };
  } catch (error) {
    logger.error('Error creating user account', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};

