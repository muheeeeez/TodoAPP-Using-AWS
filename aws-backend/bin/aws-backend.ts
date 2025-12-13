#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AwsBackendStack } from '../lib/aws-backend-stack';

const app = new cdk.App();
new AwsBackendStack(app, 'TodoAwsBackendStack', {
  env: { account: '587639714793', region: 'ca-central-1' },
});
