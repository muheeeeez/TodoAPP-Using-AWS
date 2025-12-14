/**
 * CORS headers for API Gateway responses
 * Note: API Gateway is configured to handle CORS, these are backup/explicit headers
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  // Removed Allow-Credentials since we're using wildcard origin
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

