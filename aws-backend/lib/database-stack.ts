import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';

export class DatabaseStack extends Stack {
  public readonly tasksTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create KMS key for DynamoDB encryption
    const encryptionKey = new kms.Key(this, 'TasksTableEncryptionKey', {
      description: 'KMS key for encrypting TasksTable',
      enableKeyRotation: true, // Enable automatic key rotation
      removalPolicy: RemovalPolicy.DESTROY, // Change to RETAIN in production
    });

    // Add alias for easier key management
    new kms.Alias(this, 'TasksTableEncryptionKeyAlias', {
      aliasName: 'alias/tasks-table-encryption',
      targetKey: encryptionKey,
    });

    this.tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: 'TasksTable',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // Change to RETAIN in production
      
      // Enable encryption at rest
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
    });

    // Output table name
    new CfnOutput(this, 'TasksTableName', {
      value: this.tasksTable.tableName,
      description: 'DynamoDB Tasks Table Name',
    });

    // Output table ARN
    new CfnOutput(this, 'TasksTableArn', {
      value: this.tasksTable.tableArn,
      description: 'DynamoDB Tasks Table ARN',
    });
  }
}
