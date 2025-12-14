#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AwsBackendStack } from '../lib/aws-backend-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ApiStack } from '../lib/api-stack';
import { TodoAppWebdeplStack } from '../lib/webdevpl-stack';

const app = new cdk.App();
new AwsBackendStack(app, 'TodoAwsBackendStack', {
  env: { account: '587639714793', region: 'ca-central-1' },
});
const dbStack = new DatabaseStack(app, 'TodoDatabaseStack', {
  env: { account: '587639714793', region: 'ca-central-1' },
});
new ApiStack(app, 'TodoApiStack', {
  dbStack: dbStack,
  env: { account: '587639714793', region: 'ca-central-1' },
});
new TodoAppWebdeplStack(app, 'TodoAppWebDeploymentStack', {
  env: { account: '587639714793', region: 'ca-central-1' },
});