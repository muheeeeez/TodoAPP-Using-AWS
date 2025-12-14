import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { DatabaseStack } from "./database-stack";
import { ApiGateway } from "aws-cdk-lib/aws-events-targets";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";

export class ApiStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: StackProps & { dbStack: DatabaseStack }
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
    props?.dbStack.tasksTable.grantWriteData(createTaskLambda);

    const api = new RestApi(this, "TodoAppApi");
    const todoResource = api.root.addResource("todo");
    const todoLambdaIntegration = new LambdaIntegration(createTaskLambda);
    todoResource.addMethod("POST", todoLambdaIntegration);
  }
}
