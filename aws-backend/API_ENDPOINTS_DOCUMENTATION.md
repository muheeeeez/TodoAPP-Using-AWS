# Todo App API Endpoints Documentation

## Overview

This document provides a comprehensive list of all API endpoints in the Todo App backend, their implementations, request/response formats, and how to implement them.

**Base URL**: The API Gateway URL is output after deployment (see `ApiUrl` output in CDK stack)

**Authentication**: All endpoints require Cognito JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

**Content-Type**: `application/json`

---

## Database Schema

### DynamoDB Table: `TasksTable`

**Partition Key**: `userId` (String)  
**Sort Key**: `taskId` (String)  
**Billing Mode**: Pay-per-request

**Item Structure**:
```typescript
{
  userId: string,           // Cognito user ID (from JWT token)
  taskId: string,           // UUID v4
  title: string,            // Max 200 characters
  description: string,      // Max 1000 characters (optional)
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled',
  createdAt: string,        // ISO 8601 timestamp
  updatedAt?: string        // ISO 8601 timestamp (added on updates)
}
```

---

## Endpoints

### 1. POST /todo - Create Task

**Description**: Creates a new task for the authenticated user.

**Method**: `POST`  
**Path**: `/todo`  
**Authentication**: Required (Cognito JWT)

**Request Body**:
```json
{
  "title": "Task title (required, max 200 chars)",
  "description": "Task description (optional, max 1000 chars)"
}
```

**Request Example**:
```bash
curl -X POST https://<api-gateway-url>/prod/todo \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation"
  }'
```

**Response** (201 Created):
```json
{
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input (missing title, invalid format, etc.)
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

**Implementation Details**:
- **Handler**: `lambdas/create-tasks.ts/handler.ts`
- **Validation**: 
  - `title`: Required, non-empty string, max 200 characters
  - `description`: Optional, max 1000 characters if provided
- **Auto-generated fields**:
  - `taskId`: Generated using `crypto.randomUUID()`
  - `status`: Always set to `'pending'`
  - `createdAt`: Current ISO timestamp
- **DynamoDB Operation**: `PutCommand`

---

### 2. GET /todo - Get All Tasks

**Description**: Retrieves all tasks for the authenticated user.

**Method**: `GET`  
**Path**: `/todo`  
**Authentication**: Required (Cognito JWT)

**Query Parameters**: None

**Request Example**:
```bash
curl -X GET https://<api-gateway-url>/prod/todo \
  -H "Authorization: Bearer <jwt-token>"
```

**Response** (200 OK):
```json
[
  {
    "userId": "user-uuid",
    "taskId": "task-uuid-1",
    "title": "Task 1",
    "description": "Description 1",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "userId": "user-uuid",
    "taskId": "task-uuid-2",
    "title": "Task 2",
    "description": "Description 2",
    "status": "completed",
    "createdAt": "2024-01-14T09:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
]
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `500 Internal Server Error`: Server error

**Implementation Details**:
- **Handler**: `lambdas/get-tasks/handler.ts`
- **DynamoDB Operation**: `QueryCommand` with `KeyConditionExpression: 'userId = :uid'`
- **Returns**: Array of all tasks for the authenticated user (empty array if no tasks)

---

### 3. PUT /todo/{taskId} - Update Task

**Description**: Updates an existing task. All fields are optional, but at least one must be provided.

**Method**: `PUT`  
**Path**: `/todo/{taskId}`  
**Authentication**: Required (Cognito JWT)

**Path Parameters**:
- `taskId` (required): UUID of the task to update

**Request Body** (all fields optional, but at least one required):
```json
{
  "title": "Updated title (optional, max 200 chars)",
  "description": "Updated description (optional, max 1000 chars)",
  "status": "in-progress" | "completed" | "cancelled" | "pending"
}
```

**Request Example**:
```bash
curl -X PUT https://<api-gateway-url>/prod/todo/<task-uuid> \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated task title",
    "status": "in-progress"
  }'
```

**Response** (200 OK):
```json
{
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "title": "Updated task title",
  "description": "Original description",
  "status": "in-progress",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input or task ID format
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Server error

**Implementation Details**:
- **Handler**: `lambdas/update-task/handler.ts`
- **Validation**:
  - `taskId`: Must be a valid UUID
  - `title`: Optional, max 200 characters if provided
  - `description`: Optional, max 1000 characters if provided
  - `status`: Optional, must be one of: `'pending'`, `'in-progress'`, `'completed'`, `'cancelled'`
  - At least one field must be provided
- **Auto-updated fields**:
  - `updatedAt`: Always set to current ISO timestamp
- **DynamoDB Operation**: `UpdateCommand` with:
  - Dynamic `UpdateExpression` based on provided fields
  - `ConditionExpression`: Ensures task exists and belongs to user
- **Returns**: Updated task object

---

### 4. DELETE /todo/{taskId} - Delete Task

**Description**: Deletes a task by ID.

**Method**: `DELETE`  
**Path**: `/todo/{taskId}`  
**Authentication**: Required (Cognito JWT)

**Path Parameters**:
- `taskId` (required): UUID of the task to delete

**Request Example**:
```bash
curl -X DELETE https://<api-gateway-url>/prod/todo/<task-uuid> \
  -H "Authorization: Bearer <jwt-token>"
```

**Response** (200 OK):
```json
{
  "message": "Task deleted successfully",
  "taskId": "task-uuid"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid task ID format
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Server error

**Implementation Details**:
- **Handler**: `lambdas/delete-task/handler.ts`
- **Validation**:
  - `taskId`: Must be a valid UUID
- **DynamoDB Operation**: `DeleteCommand` with:
  - `ConditionExpression`: Ensures task exists and belongs to user before deletion
- **Returns**: Success message with task ID

---

### 5. PATCH /todo/{taskId}/done - Mark Task as Done

**Description**: Marks a task as completed. This is a convenience endpoint that sets the status to `'completed'`.

**Method**: `PATCH`  
**Path**: `/todo/{taskId}/done`  
**Authentication**: Required (Cognito JWT)

**Path Parameters**:
- `taskId` (required): UUID of the task to mark as done

**Request Body**: None

**Request Example**:
```bash
curl -X PATCH https://<api-gateway-url>/prod/todo/<task-uuid>/done \
  -H "Authorization: Bearer <jwt-token>"
```

**Response** (200 OK):
```json
{
  "userId": "user-uuid",
  "taskId": "task-uuid",
  "title": "Task title",
  "description": "Task description",
  "status": "completed",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T13:00:00.000Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid task ID format
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Task not found or doesn't belong to user
- `500 Internal Server Error`: Server error

**Implementation Details**:
- **Handler**: `lambdas/mark-task-done/handler.ts`
- **Validation**:
  - `taskId`: Must be a valid UUID
- **DynamoDB Operation**: `UpdateCommand` that:
  - Sets `status` to `'completed'`
  - Sets `updatedAt` to current ISO timestamp
  - Uses `ConditionExpression` to ensure task exists and belongs to user
- **Returns**: Updated task object with `status: 'completed'`

---

## Common Features

### Authentication

All endpoints use **AWS Cognito User Pool** authentication:
1. User authenticates with Cognito and receives a JWT token
2. Token is sent in the `Authorization` header: `Bearer <token>`
3. API Gateway validates the token using `CognitoUserPoolsAuthorizer`
4. User ID is extracted from the token claims (`sub` field)

**User ID Extraction** (`lambdas/utils/getUserId.ts`):
- First tries to get from API Gateway authorizer claims
- Falls back to decoding JWT token from Authorization header
- Falls back to `'mock-user-id'` for development/testing

### CORS

All endpoints support CORS with:
- **Allowed Origins**: `*` (all origins)
- **Allowed Methods**: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- **Allowed Headers**: `Content-Type, X-Amz-Date, Authorization, X-Api-Key, X-Amz-Security-Token`
- **Credentials**: Not allowed (due to wildcard origin)

### Security Headers

All responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

### Rate Limiting

API Gateway is configured with:
- **Burst Limit**: 100 requests
- **Rate Limit**: 50 requests/second
- **Monthly Quota**: 10,000 requests (via Usage Plan)

### Error Handling

All endpoints use standardized error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/todo"
}
```

**Error Types**:
- `400 Bad Request`: Validation errors, invalid input
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `409 Conflict`: Conditional check failed (e.g., task doesn't exist)
- `500 Internal Server Error`: Server errors
- `503 Service Unavailable`: DynamoDB throttling

### Logging

All handlers use a `Logger` utility (`lambdas/utils/logger.ts`) that:
- Logs request information
- Tracks user ID
- Logs errors with stack traces
- Provides debug, info, warn, and error log levels

---

## Validation Rules

### Task Title
- **Required**: Yes (for create)
- **Type**: String
- **Min Length**: 1 character (after trimming)
- **Max Length**: 200 characters
- **Cannot be**: Empty or whitespace only

### Task Description
- **Required**: No
- **Type**: String
- **Max Length**: 1000 characters (if provided)
- **Can be**: Empty string or omitted

### Task Status
- **Valid Values**: `'pending'`, `'in-progress'`, `'completed'`, `'cancelled'`
- **Default**: `'pending'` (on create)
- **Case Sensitive**: Yes

### Task ID
- **Format**: UUID v4
- **Required**: Yes (for update/delete operations)
- **Validation**: Must match UUID regex pattern

---

## How to Implement New Endpoints

### Step 1: Create Lambda Handler

Create a new handler file in `lambdas/<endpoint-name>/handler.ts`:

```typescript
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, <Operation>Command } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { getUserId } from '../utils/getUserId';
import { validate<Input>, ValidationError } from '../utils/validation';
import { handleError, AppError } from '../utils/errorHandler';
import { Logger } from '../utils/logger';
import { addCorsHeaders } from '../utils/corsHeaders';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const logger = new Logger(event);
  
  try {
    // 1. Validate environment variables
    if (!process.env.TASKS_TABLE_NAME) {
      throw new AppError(500, 'TASKS_TABLE_NAME environment variable is not set', 'Configuration Error');
    }

    // 2. Get and validate user ID
    const userId = getUserId(event);
    logger.setUserId(userId);

    // 3. Parse and validate request body/path parameters
    // ... validation logic ...

    // 4. Perform DynamoDB operation
    // ... DynamoDB logic ...

    // 5. Return success response
    return {
      statusCode: 200,
      headers: addCorsHeaders({
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      }),
      body: JSON.stringify(result),
    };
  } catch (error) {
    logger.error('Error description', error instanceof Error ? error : new Error(String(error)));
    return handleError(error, event);
  }
};
```

### Step 2: Add Validation (if needed)

Add validation functions to `lambdas/utils/validation.ts`:

```typescript
export function validate<YourInput>(body: any): <YourInputType> {
  const errors: string[] = [];
  // ... validation logic ...
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
  return validatedInput;
}
```

### Step 3: Add Lambda to API Stack

In `lib/api-stack.ts`, add the Lambda function:

```typescript
const <endpointName>Lambda = new lambda.NodejsFunction(this, "<EndpointName>Lambda", {
  entry: path.join(__dirname, "../lambdas/<endpoint-name>/handler.ts"),
  runtime: Runtime.NODEJS_18_X,
  environment: {
    TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
  },
});

// Grant permissions
props?.dbStack.tasksTable.grant<Read|Write>Data(<endpointName>Lambda);
```

### Step 4: Add API Gateway Route

In `lib/api-stack.ts`, add the route:

```typescript
const <endpointName>LambdaIntegration = new LambdaIntegration(<endpointName>Lambda, {
  proxy: true,
  integrationResponses: [
    {
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.X-Content-Type-Options': "'nosniff'",
        'method.response.header.X-Frame-Options': "'DENY'",
        'method.response.header.X-XSS-Protection': "'1; mode=block'",
        'method.response.header.Strict-Transport-Security': "'max-age=31536000; includeSubDomains'",
      },
    },
  ],
});

// Add to appropriate resource
<resource>.addMethod("<HTTP_METHOD>", <endpointName>LambdaIntegration, methodOptions);
```

### Step 5: Deploy

```bash
cd aws-backend
npm run build
cdk deploy TodoApiStack
```

---

## Testing Endpoints

### Using cURL

1. **Get JWT Token** (from Cognito):
   ```bash
   # Use AWS CLI or Cognito SDK to authenticate and get token
   TOKEN="<your-jwt-token>"
   API_URL="https://<api-gateway-url>/prod"
   ```

2. **Test Create Task**:
   ```bash
   curl -X POST "$API_URL/todo" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test task", "description": "Test description"}'
   ```

3. **Test Get Tasks**:
   ```bash
   curl -X GET "$API_URL/todo" \
     -H "Authorization: Bearer $TOKEN"
   ```

### Using Postman

1. Create a new request
2. Set method and URL
3. Add header: `Authorization: Bearer <token>`
4. Add header: `Content-Type: application/json`
5. Add body (for POST/PUT/PATCH) in JSON format
6. Send request

---

## Architecture Overview

```
┌─────────────┐
│   Client    │
│  (Frontend) │
└──────┬──────┘
       │ HTTPS
       │ JWT Token
       ▼
┌─────────────────┐
│  API Gateway     │
│  (REST API)      │
│  - CORS          │
│  - Auth          │
│  - Rate Limiting │
└──────┬───────────┘
       │
       ▼
┌─────────────────┐
│  Lambda         │
│  Functions      │
│  - Validation   │
│  - Business     │
│    Logic        │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  DynamoDB       │
│  TasksTable     │
│  - Encrypted    │
│  - Pay-per-req  │
└─────────────────┘
```

---

## Environment Variables

### Lambda Functions
- `TASKS_TABLE_NAME`: DynamoDB table name (set automatically by CDK)

### API Gateway
- Configured via CDK stack
- Stage: `prod`
- Region: `ca-central-1` (as configured in `bin/aws-backend.ts`)

---

## CDK Stack Structure

The backend consists of multiple CDK stacks:

1. **TodoDatabaseStack**: DynamoDB table with KMS encryption
2. **TodoAuthStack**: Cognito User Pool and Client
3. **TodoApiStack**: API Gateway, Lambda functions, and routes
4. **TodoAwsBackendStack**: Additional backend resources
5. **TodoAppWebDeploymentStack**: Frontend deployment

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Task IDs are UUID v4 format
- User isolation: Users can only access their own tasks (enforced by `userId` partition key)
- All endpoints are protected by Cognito authentication
- CORS is configured to allow all origins (adjust for production)
- Rate limiting is configured at API Gateway level
- DynamoDB uses pay-per-request billing mode

---

## Support

For issues or questions:
1. Check CloudWatch Logs for Lambda function errors
2. Verify API Gateway logs for request/response details
3. Ensure JWT token is valid and not expired
4. Verify DynamoDB table exists and has correct permissions

