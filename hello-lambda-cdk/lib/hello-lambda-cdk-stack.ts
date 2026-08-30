import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class HelloLambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function for website health monitoring
    const websiteMonitor = new lambda.Function(
      this,
      'HelloLambdaFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        timeout: cdk.Duration.seconds(30),
        code: lambda.Code.fromAsset('lambda'),
      }
    );

    // Allow Lambda to publish custom CloudWatch metrics
    websiteMonitor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Run the Lambda automatically every 30 minutes
    const scheduleRule = new events.Rule(this, 'WebHealthSchedule', {
      schedule: events.Schedule.rate(
        cdk.Duration.minutes(30)
      ),
    });

    // Set Lambda as the target of the EventBridge rule
    scheduleRule.addTarget(
      new targets.LambdaFunction(websiteMonitor)
    );
  }
}