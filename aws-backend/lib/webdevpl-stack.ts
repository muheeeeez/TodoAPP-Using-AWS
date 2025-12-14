import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Distribution, OriginAccessIdentity, ResponseHeadersPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { existsSync } from 'fs';
import { join } from 'path';

export class TodoAppWebdeplStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const deploymentBucket = new Bucket(this, 'TodoAppWebDeploymentBucket')

    // Nuxt 4 outputs to .output/public, not dist
    const uiDir = join(__dirname, '..','..', 'frontend', '.output', 'public');
    if (!existsSync(uiDir)) {
      console.warn('Frontend build dir not found: ' + uiDir);
      console.warn('Please run "npm run build" in the frontend directory first');
      return;
    }

    const originIdentity = new OriginAccessIdentity(this, 'OriginAccessIdentity');
    deploymentBucket.grantRead(originIdentity);

    // Create Response Headers Policy with CORS headers
    const responseHeadersPolicy = new ResponseHeadersPolicy(this, 'ResponseHeadersPolicy', {
      responseHeadersPolicyName: 'TodoAppCorsPolicy',
      corsBehavior: {
        accessControlAllowCredentials: true,
        accessControlAllowHeaders: ['*'],
        accessControlAllowMethods: ['GET', 'HEAD', 'OPTIONS'],
        accessControlAllowOrigins: [
          'http://localhost:3000',
          'https://localhost:3000',
          'https://d26sbga84c89mx.cloudfront.net',
        ],
        accessControlExposeHeaders: ['*'],
        accessControlMaxAge: Duration.seconds(3600),
        originOverride: false,
      },
      securityHeadersBehavior: {
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: 'DENY', override: true },
        xssProtection: { protection: true, modeBlock: true, override: true },
      },
    });

    const distribution = new Distribution(this, 'WebDeploymentDistribution', {
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(deploymentBucket, {
          originAccessIdentity: originIdentity,
        }),
        responseHeadersPolicy: responseHeadersPolicy,
      },      
    });

    new BucketDeployment(this, 'WebDeployment', {
      destinationBucket: deploymentBucket,
      sources: [Source.asset(uiDir)],
      distribution: distribution
    });

    new cdk.CfnOutput(this, 'TsAppUrl', {
      value: distribution.distributionDomainName
    })







  }
}