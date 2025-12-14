import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { DatabaseStack } from "./database-stack";
import { AuthStack } from "./auth-stack";
import { ApiGateway } from "aws-cdk-lib/aws-events-targets";
import { 
  CognitoUserPoolsAuthorizer, 
  LambdaIntegration, 
  RestApi,
  Cors,
  MethodOptions,
  ThrottleSettings,
  UsagePlan,
  Period,
  ApiKey,
  ApiKeySourceType,
  AuthorizationType,
  MethodLoggingLevel,
} from "aws-cdk-lib/aws-apigateway";

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: StackProps & { dbStack: DatabaseStack; authStack: AuthStack }
  ) {
    super(scope, id, props);

    const createTaskLambda = new lambda.NodejsFunction(
      this,
      "CreateTaskLambda",
      {
        entry: path.join(__dirname, "../lambdas/create-tasks.ts/handler.ts"),
        runtime: Runtime.NODEJS_18_X,
        environment: {
          TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
        },
      }
    );
    const getTasksLambda = new lambda.NodejsFunction(this, "GetTasksLambda", {
      entry: path.join(__dirname, "../lambdas/get-tasks/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
      },
    });
    const updateTaskLambda = new lambda.NodejsFunction(this, "UpdateTaskLambda", {
      entry: path.join(__dirname, "../lambdas/update-task/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
      },
    });
    const deleteTaskLambda = new lambda.NodejsFunction(this, "DeleteTaskLambda", {
      entry: path.join(__dirname, "../lambdas/delete-task/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
      },
    });
    const markTaskDoneLambda = new lambda.NodejsFunction(this, "MarkTaskDoneLambda", {
      entry: path.join(__dirname, "../lambdas/mark-task-done/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
      },
    });

    // Grant permissions
    props?.dbStack.tasksTable.grantWriteData(createTaskLambda);
    props?.dbStack.tasksTable.grantReadData(getTasksLambda);
    props?.dbStack.tasksTable.grantWriteData(updateTaskLambda);
    props?.dbStack.tasksTable.grantWriteData(deleteTaskLambda);
    props?.dbStack.tasksTable.grantWriteData(markTaskDoneLambda);

    // Create API Gateway with CORS and security headers
    const api = new RestApi(this, "TodoAppApi", {
      restApiName: "TodoApp API",
      description: "REST API for Todo Application",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // In production, specify exact origins
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
        maxAge: Duration.seconds(3600), // Cache preflight for 1 hour
      },
      defaultMethodOptions: {
        // Security headers applied to all methods
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.X-Content-Type-Options': true,
              'method.response.header.X-Frame-Options': true,
              'method.response.header.X-XSS-Protection': true,
              'method.response.header.Strict-Transport-Security': true,
            },
          },
        ],
      },
      // Enable API Gateway logging
      deployOptions: {
        stageName: 'prod',
        loggingLevel: MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 100, // Burst limit: 100 requests
        throttlingRateLimit: 50, // Steady-state rate: 50 requests/second (number is correct for this property)
      },
    });

    // Create Cognito Authorizer
    const authorizer = new CognitoUserPoolsAuthorizer(this, "CognitoAuthorizer", {
      cognitoUserPools: [props?.authStack.userPool!],
      identitySource: "method.request.header.Authorization",
    });

    // Common method options with authorizer and security headers
    const methodOptions: MethodOptions = {
      authorizer: authorizer,
      authorizationType: AuthorizationType.COGNITO,
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.X-Content-Type-Options': true,
            'method.response.header.X-Frame-Options': true,
            'method.response.header.X-XSS-Protection': true,
            'method.response.header.Strict-Transport-Security': true,
          },
        },
        {
          statusCode: '400',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '401',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
        {
          statusCode: '500',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
          },
        },
      ],
    };
    
    const todoResource = api.root.addResource("todo", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });
    
    // POST /todo - Create task
    const todoCreateLambdaIntegration = new LambdaIntegration(createTaskLambda, {
      proxy: true,
      integrationResponses: [
        {
          statusCode: '201',
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
    todoResource.addMethod("POST", todoCreateLambdaIntegration, methodOptions);
    
    // GET /todo - Get all tasks
    const todoGetLambdaIntegration = new LambdaIntegration(getTasksLambda, {
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
    todoResource.addMethod("GET", todoGetLambdaIntegration, methodOptions);
    
    // PUT /todo/{taskId} - Update task
    const todoTaskResource = todoResource.addResource("{taskId}", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });
    const todoUpdateLambdaIntegration = new LambdaIntegration(updateTaskLambda, {
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
    todoTaskResource.addMethod("PUT", todoUpdateLambdaIntegration, methodOptions);
    
    // DELETE /todo/{taskId} - Delete task
    const todoDeleteLambdaIntegration = new LambdaIntegration(deleteTaskLambda, {
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
    todoTaskResource.addMethod("DELETE", todoDeleteLambdaIntegration, methodOptions);
    
    // PATCH /todo/{taskId}/done - Mark task as done
    const todoDoneResource = todoTaskResource.addResource("done", {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        allowCredentials: true,
      },
    });
    const todoMarkDoneLambdaIntegration = new LambdaIntegration(markTaskDoneLambda, {
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
    todoDoneResource.addMethod("PATCH", todoMarkDoneLambdaIntegration, methodOptions);

    // Create API Key for additional rate limiting (optional)
    const apiKey = new ApiKey(this, "TodoAppApiKey", {
      description: "API Key for Todo App",
    });

    // Create Usage Plan with rate limiting
    const usagePlan = new UsagePlan(this, "TodoAppUsagePlan", {
      name: "TodoAppUsagePlan",
      description: "Usage plan for Todo App API",
      throttle: {
        rateLimit: 50, // Steady-state rate: 50 requests/second
        burstLimit: 100, // Burst limit: 100 requests
      },
      quota: {
        limit: 10000, // Monthly quota: 10,000 requests
        period: Period.MONTH,
      },
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
    });

    // Associate API Key with Usage Plan
    usagePlan.addApiKey(apiKey);

    // Output API Gateway URL
    new CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: 'TodoAppApiUrl',
    });

    // Output API Key ID
    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for rate limiting',
    });
  }
}
