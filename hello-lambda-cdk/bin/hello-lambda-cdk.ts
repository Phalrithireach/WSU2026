#!/usr/bin/env node

import * as cdk from 'aws-cdk-lib';
import { HelloLambdaCdkStack } from '../lib/hello-lambda-cdk-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Existing monitoring stack
new HelloLambdaCdkStack(
  app,
  'HelloLambdaCdkStack'
);

// Week 9 CI/CD pipeline
new PipelineStack(
  app,
  'PipelineStack',
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);