/**
 * CORS headers for API Gateway responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Merges CORS headers with existing headers
 */
export function addCorsHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...corsHeaders,
    ...headers,
  };
}

