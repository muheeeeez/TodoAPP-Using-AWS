import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  console.log("EVENT:", event);
  const userId = "mock-user-id";
  const body = event.body ? JSON.parse(event.body) : {};
  const {title, description} = body;
  const taskId = randomUUID();
  const createdAt = new Date().toISOString();
  const task = {
    userId, taskId, title, description, status: 'pending', createdAt
  };
  await ddbDocClient.send(new PutCommand({
    TableName: process.env.TASKS_TABLE_NAME!,
    Item: task, 
  }));
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  };
};
