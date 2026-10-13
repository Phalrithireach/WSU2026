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

  // Three Lambda functions:
  // 1. Web Health Lambda
  // 2. Alarm Logger Lambda
  // 3. Web Crawler CRUD Lambda
  template.resourceCountIs('AWS::Lambda::Function', 3);

  // DynamoDB alarm log table
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'WSU2026-WebHealth-AlarmLogs',
  });

  // Applied Project - DynamoDB crawler target table
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'WSU2026-WebCrawler-Targets',
  });

  // Applied Project - API Gateway
  template.hasResourceProperties('AWS::ApiGateway::RestApi', {
    Name: 'WSU2026-WebCrawler-API',
  });

  // CRUD API methods
  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'POST',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'GET',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'PUT',
  });

  template.hasResourceProperties('AWS::ApiGateway::Method', {
    HttpMethod: 'DELETE',
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