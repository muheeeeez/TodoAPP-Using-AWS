import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public error: string = 'Application Error'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Handles errors and returns standardized API Gateway response
 */
export function handleError(
  error: unknown,
  event: Parameters<APIGatewayProxyHandlerV2>[0]
): APIGatewayProxyResultV2 {
  console.error('Error occurred:', {
    error: error instanceof Error ? error.stack : error,
    path: event.requestContext?.http?.path,
    method: event.requestContext?.http?.method,
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
      body: JSON.stringify({
        error: error.error,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: new Date().toISOString(),
        path: event.requestContext?.http?.path,
      } as ErrorResponse),
    };
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
      body: JSON.stringify({
        error: 'Invalid JSON',
        message: 'Request body contains invalid JSON',
        statusCode: 400,
        timestamp: new Date().toISOString(),
        path: event.requestContext?.http?.path,
      } as ErrorResponse),
    };
  }

  // Handle DynamoDB errors
  if (error && typeof error === 'object' && 'name' in error) {
    const dbError = error as { name: string; message: string };
    
    if (dbError.name === 'ResourceNotFoundException') {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
        body: JSON.stringify({
          error: 'Resource Not Found',
          message: 'The requested resource was not found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: event.requestContext?.http?.path,
        } as ErrorResponse),
      };
    }

    if (dbError.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
        body: JSON.stringify({
          error: 'Conflict',
          message: 'The operation conflicts with the current state',
          statusCode: 409,
          timestamp: new Date().toISOString(),
          path: event.requestContext?.http?.path,
        } as ErrorResponse),
      };
    }

    if (dbError.name === 'ProvisionedThroughputExceededException') {
      return {
        statusCode: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        },
        body: JSON.stringify({
          error: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
          statusCode: 503,
          timestamp: new Date().toISOString(),
          path: event.requestContext?.http?.path,
        } as ErrorResponse),
      };
    }
  }

  // Handle generic errors
  return {
    statusCode: 500,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
    body: JSON.stringify({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error instanceof Error ? error.message : 'Unknown error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: event.requestContext?.http?.path,
    } as ErrorResponse),
  };
}

/**
 * Wraps a Lambda handler with error handling
 * Note: This function is not currently used - handlers use try-catch directly
 * Keeping for potential future use
 */
// export function withErrorHandling(
//   handler: APIGatewayProxyHandlerV2
// ): APIGatewayProxyHandlerV2 {
//   return async (event, context) => {
//     try {
//       const result = await handler(event, context);
//       return result || handleError(new Error('Handler returned undefined'), event);
//     } catch (error) {
//       return handleError(error, event);
//     }
//   };
// }

