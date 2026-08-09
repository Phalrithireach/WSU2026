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
    const websiteMonitor = new lambda.Function(this, 'HelloLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.lambda_handler',
      timeout: cdk.Duration.seconds(30),

      code: lambda.Code.fromInline(`
import urllib.request
import time
import json
import boto3

cloudwatch = boto3.client("cloudwatch")

websites = [
    "https://google.com",
    "https://github.com",
    "https://amazon.com"
]

def lambda_handler(event, context):
    results = []

    for website in websites:
        start = time.time()

        try:
            request = urllib.request.Request(
                website,
                headers={"User-Agent": "Mozilla/5.0"}
            )

            response = urllib.request.urlopen(
                request,
                timeout=5
            )

            latency = round(
                (time.time() - start) * 1000,
                2
            )

            availability = 1

            results.append({
                "website": website,
                "status": response.status,
                "availability": availability,
                "latency_ms": latency
            })

        except Exception as e:
            latency = round(
                (time.time() - start) * 1000,
                2
            )

            availability = 0

            results.append({
                "website": website,
                "status": "DOWN",
                "availability": availability,
                "latency_ms": latency,
                "error": str(e)
            })

        cloudwatch.put_metric_data(
            Namespace="WSU2026/WebHealth",
            MetricData=[
                {
                    "MetricName": "Availability",
                    "Dimensions": [
                        {
                            "Name": "Website",
                            "Value": website
                        }
                    ],
                    "Value": availability,
                    "Unit": "Count"
                },
                {
                    "MetricName": "Latency",
                    "Dimensions": [
                        {
                            "Name": "Website",
                            "Value": website
                        }
                    ],
                    "Value": latency,
                    "Unit": "Milliseconds"
                }
            ]
        )

    return {
        "statusCode": 200,
        "body": json.dumps(results)
    }
      `),
    });

    // Allow Lambda to publish custom CloudWatch metrics
    websiteMonitor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudwatch:PutMetricData'
        ],
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