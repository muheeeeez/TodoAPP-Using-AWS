import { Stack, StackProps, CfnOutput, Duration } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { DatabaseStack } from "./database-stack";
import { 
  LambdaIntegration, 
  RestApi,
  Cors,
  MethodOptions,
  UsagePlan,
  Period,
  ApiKey,
  AuthorizationType,
  RequestAuthorizer,
  IdentitySource,
} from "aws-cdk-lib/aws-apigateway";

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: StackProps & { dbStack: DatabaseStack }
  ) {
    super(scope, id, props);

    // JWT Secret for token generation/verification
    // Auto-generate a cryptographically secure secret if not provided
    const jwtSecret = process.env.JWT_SECRET || (() => {
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('base64');
    })();

    // Auth Lambda Functions
    const signupLambda = new lambda.NodejsFunction(this, "SignupLambda", {
      entry: path.join(__dirname, "../lambdas/auth-signup/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        USERS_TABLE_NAME: props?.dbStack.usersTable.tableName!,
        JWT_SECRET: jwtSecret,
      },
    });

    const loginLambda = new lambda.NodejsFunction(this, "LoginLambda", {
      entry: path.join(__dirname, "../lambdas/auth-login/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        USERS_TABLE_NAME: props?.dbStack.usersTable.tableName!,
        JWT_SECRET: jwtSecret,
      },
    });

    // Task Lambda Functions
    const createTaskLambda = new lambda.NodejsFunction(
      this,
      "CreateTaskLambda",
      {
        entry: path.join(__dirname, "../lambdas/create-tasks.ts/handler.ts"),
        runtime: Runtime.NODEJS_18_X,
        environment: {
          TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
          JWT_SECRET: jwtSecret,
        },
      }
    );
    const getTasksLambda = new lambda.NodejsFunction(this, "GetTasksLambda", {
      entry: path.join(__dirname, "../lambdas/get-tasks/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
        JWT_SECRET: jwtSecret,
      },
    });
    const updateTaskLambda = new lambda.NodejsFunction(this, "UpdateTaskLambda", {
      entry: path.join(__dirname, "../lambdas/update-task/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
        JWT_SECRET: jwtSecret,
      },
    });
    const deleteTaskLambda = new lambda.NodejsFunction(this, "DeleteTaskLambda", {
      entry: path.join(__dirname, "../lambdas/delete-task/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
        JWT_SECRET: jwtSecret,
      },
    });
    const markTaskDoneLambda = new lambda.NodejsFunction(this, "MarkTaskDoneLambda", {
      entry: path.join(__dirname, "../lambdas/mark-task-done/handler.ts"),
      runtime: Runtime.NODEJS_18_X,
      environment: {
        TASKS_TABLE_NAME: props?.dbStack.tasksTable.tableName!,
        JWT_SECRET: jwtSecret,
      },
    });

    // Grant permissions for auth lambdas
    props?.dbStack.usersTable.grantWriteData(signupLambda);
    props?.dbStack.usersTable.grantReadWriteData(loginLambda);

    // Grant permissions for task lambdas
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
        allowOrigins: Cors.ALL_ORIGINS, // Use wildcard to avoid multiple origins issue
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false, // Must be false when using wildcard
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
      // Deploy options
      deployOptions: {
        stageName: 'prod',
        // Note: API Gateway logging disabled - requires CloudWatch Logs role setup
        // Enable metrics for monitoring (doesn't require CloudWatch Logs role)
        metricsEnabled: true,
        throttlingBurstLimit: 100, // Burst limit: 100 requests
        throttlingRateLimit: 50, // Steady-state rate: 50 requests/second
      },
    });

    // Common method options with security headers (no auth for public endpoints)
    const publicMethodOptions: MethodOptions = {
      authorizationType: AuthorizationType.NONE,
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

    // Method options for protected endpoints (require authentication via JWT in handler)
    const protectedMethodOptions: MethodOptions = {
      authorizationType: AuthorizationType.NONE, // Auth checked in Lambda handler
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

    // Auth endpoints (public)
    const authResource = api.root.addResource("auth");
    
    // POST /auth/signup
    const signupIntegration = new LambdaIntegration(signupLambda, {
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
    authResource.addResource("signup").addMethod("POST", signupIntegration, publicMethodOptions);

    // POST /auth/login
    const loginIntegration = new LambdaIntegration(loginLambda, {
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
    authResource.addResource("login").addMethod("POST", loginIntegration, publicMethodOptions);
    
    const todoResource = api.root.addResource("todo");
    
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
    todoResource.addMethod("POST", todoCreateLambdaIntegration, protectedMethodOptions);
    
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
    todoResource.addMethod("GET", todoGetLambdaIntegration, protectedMethodOptions);
    
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
    todoTaskResource.addMethod("PUT", todoUpdateLambdaIntegration, protectedMethodOptions);
    
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
    todoTaskResource.addMethod("DELETE", todoDeleteLambdaIntegration, protectedMethodOptions);
    
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
    todoDoneResource.addMethod("PATCH", todoMarkDoneLambdaIntegration, protectedMethodOptions);

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
