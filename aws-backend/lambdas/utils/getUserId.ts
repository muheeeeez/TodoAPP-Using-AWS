import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { verifyToken } from './auth';
import { AppError } from './errorHandler';

/**
 * Extracts the user ID from the JWT token in Authorization header
 * Throws an error if token is invalid or missing
 */
export function getUserId(event: APIGatewayProxyEventV2): string {
  try {
    // First, try to get from API Gateway authorizer context (when using Lambda authorizer)
    const authorizerContext = (event.requestContext as any)?.authorizer?.lambda;
    if (authorizerContext?.userId) {
      return authorizerContext.userId;
    }

    // Fallback: Get the Authorization header and verify JWT
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader) {
      throw new AppError(401, 'Authorization header is missing', 'Unauthorized');
    }

    // Extract the JWT token (format: "Bearer <token>")
    const token = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      throw new AppError(401, 'Token is missing from Authorization header', 'Unauthorized');
    }

    // Verify and decode the JWT token
    const payload = verifyToken(token);
    
    if (!payload || !payload.userId) {
      throw new AppError(401, 'Invalid or expired token', 'Unauthorized');
    }

    return payload.userId;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error extracting user ID from token:', error);
    throw new AppError(401, 'Authentication failed', 'Unauthorized');
  }
}

