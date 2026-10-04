import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { HelloLambdaCdkStack } from '../lib/hello-lambda-cdk-stack';

test('Web Health monitoring infrastructure is created', () => {
  const app = new cdk.App();

  const stack = new HelloLambdaCdkStack(
    app,
    'TestHelloLambdaCdkStack'
  );

  const template = Template.fromStack(stack);

  // Two Lambda functions:
  // 1. Web Health Lambda
  // 2. Alarm Logger Lambda
  template.resourceCountIs('AWS::Lambda::Function', 2);

  // DynamoDB alarm log table
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'WSU2026-WebHealth-AlarmLogs',
  });

  // Six CloudWatch alarms:
  // 3 availability + 3 latency
  template.resourceCountIs('AWS::CloudWatch::Alarm', 6);

  // SNS alarm notification topic
  template.hasResourceProperties('AWS::SNS::Topic', {
    TopicName: 'WSU2026-WebHealth-Alarms',
  });

  // CloudWatch dashboard
  template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
    DashboardName: 'WSU2026-WebHealth-Dashboard-CDK',
  });
});