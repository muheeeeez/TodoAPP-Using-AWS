import { RemovalPolicy, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as kms from 'aws-cdk-lib/aws-kms';

export class DatabaseStack extends Stack {
  public readonly tasksTable: dynamodb.Table;
  public readonly usersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create KMS key for DynamoDB encryption
    const encryptionKey = new kms.Key(this, 'TasksTableEncryptionKey', {
      description: 'KMS key for encrypting DynamoDB tables',
      enableKeyRotation: true, // Enable automatic key rotation
      removalPolicy: RemovalPolicy.DESTROY, // Change to RETAIN in production
    });

    // Add alias for easier key management
    new kms.Alias(this, 'TasksTableEncryptionKeyAlias', {
      aliasName: 'alias/dynamodb-tables-encryption',
      targetKey: encryptionKey,
    });

    // Tasks Table
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

    // Users Table for authentication
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'UsersTable',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // Change to RETAIN in production
      
      // Enable encryption at rest
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: encryptionKey,
    });

    // Add GSI for userId lookups
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'UserIdIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Output table names
    new CfnOutput(this, 'TasksTableName', {
      value: this.tasksTable.tableName,
      description: 'DynamoDB Tasks Table Name',
    });

    new CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'DynamoDB Users Table Name',
    });

    // Output table ARNs
    new CfnOutput(this, 'TasksTableArn', {
      value: this.tasksTable.tableArn,
      description: 'DynamoDB Tasks Table ARN',
    });

    new CfnOutput(this, 'UsersTableArn', {
      value: this.usersTable.tableArn,
      description: 'DynamoDB Users Table ARN',
    });
  }
}
