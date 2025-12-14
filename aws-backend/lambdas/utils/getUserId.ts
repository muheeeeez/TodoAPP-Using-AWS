import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Extracts the user ID from the Cognito JWT token
 * First tries to get it from API Gateway authorizer claims (when using Cognito authorizer)
 * Falls back to decoding the JWT token from Authorization header
 * Falls back to mock-user-id if not found (for development/testing)
 */
export function getUserId(event: APIGatewayProxyEventV2): string {
  try {
    // First, try to get from API Gateway authorizer claims (when using Cognito authorizer)
    // The authorizer puts claims in requestContext.authorizer.claims
    const claims = (event.requestContext as any)?.authorizer?.claims;
    if (claims) {
      const userId = claims.sub || claims['cognito:username'] || claims.username;
      if (userId) {
        return userId;
      }
    }

    // Fallback: Get the Authorization header and decode JWT
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    
    if (!authHeader) {
      console.warn('No Authorization header found, using mock-user-id');
      return 'mock-user-id';
    }

    // Extract the JWT token (format: "Bearer <token>")
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      console.warn('No token found in Authorization header, using mock-user-id');
      return 'mock-user-id';
    }

    // Decode the JWT token (base64 decode the payload)
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT token format, using mock-user-id');
      return 'mock-user-id';
    }

    // Decode the payload (second part)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    // Extract the 'sub' claim which is the Cognito user ID
    const userId = payload.sub || payload['cognito:username'] || payload.username;
    
    if (!userId) {
      console.warn('No user ID found in token, using mock-user-id');
      return 'mock-user-id';
    }

    return userId;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return 'mock-user-id';
  }
}

