import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';

export interface HelloLambdaCdkStackProps extends cdk.StackProps {
  environmentName?: string;
}

export class HelloLambdaCdkStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: HelloLambdaCdkStackProps
  ) {
    super(scope, id, props);

const environmentName = props?.environmentName;
const resourcePrefix = environmentName
  ? `WSU2026-${environmentName}`
  : 'WSU2026';

const alarmPrefix = environmentName
  ? `${environmentName}-`
  : '';

    // ------------------------------------------------------------
    // Lambda Function
    // ------------------------------------------------------------

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
// ------------------------------------------------------------
// Week 11 - Production Lambda Alias for Canary Deployment
// ------------------------------------------------------------

let monitorTarget: lambda.IFunction = websiteMonitor;
let prodAlias: lambda.Alias | undefined;

if (environmentName === 'Prod') {
  prodAlias = new lambda.Alias(
    this,
    'ProdAlias',
    {
      aliasName: 'live',
      version: websiteMonitor.currentVersion,
    }
  );

  monitorTarget = prodAlias;
}
// ------------------------------------------------------------
// Week 11 - Operational CloudWatch Metrics and Alarms
// ------------------------------------------------------------

let prodErrorAlarm: cloudwatch.Alarm | undefined;
let prodDurationAlarm: cloudwatch.Alarm | undefined;
let prodInvocationAlarm: cloudwatch.Alarm | undefined;

if (environmentName === 'Prod' && prodAlias) {

  // Lambda invocation count
  const invocationMetric = prodAlias.metricInvocations({
    period: cdk.Duration.minutes(5),
    statistic: 'Sum',
  });

  // Lambda execution duration
  const durationMetric = prodAlias.metricDuration({
    period: cdk.Duration.minutes(5),
    statistic: 'Average',
  });

  // Lambda execution errors
  const errorMetric = prodAlias.metricErrors({
    period: cdk.Duration.minutes(5),
    statistic: 'Sum',
  });

  // Alarm if there are no invocations for 1 hour
  prodInvocationAlarm = new cloudwatch.Alarm(
    this,
    'ProdInvocationAlarm',
    {
      alarmName: 'Prod-WebHealth-No-Invocations',
      metric: invocationMetric,
      threshold: 1,
      evaluationPeriods: 12,
      datapointsToAlarm: 12,
      comparisonOperator:
        cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData:
        cloudwatch.TreatMissingData.BREACHING,
      alarmDescription:
        'Alarm when the Production Lambda receives no invocations for one hour',
    }
  );

  // Alarm when average processing time exceeds 10 seconds
  prodDurationAlarm = new cloudwatch.Alarm(
    this,
    'ProdDurationAlarm',
    {
      alarmName: 'Prod-WebHealth-High-Duration',
      metric: durationMetric,
      threshold: 10000,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData:
        cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alarm when Production Lambda average duration exceeds 10 seconds',
    }
  );

  // Alarm if the Lambda produces any execution error
  prodErrorAlarm = new cloudwatch.Alarm(
    this,
    'ProdErrorAlarm',
    {
      alarmName: 'Prod-WebHealth-Lambda-Errors',
      metric: errorMetric,
      threshold: 1,
      evaluationPeriods: 1,
      datapointsToAlarm: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData:
        cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription:
        'Alarm when the Production Lambda produces an execution error',
    }
  );
}
// ------------------------------------------------------------
// Week 11 - CodeDeploy Canary Deployment and Auto Rollback
// ------------------------------------------------------------

if (
  environmentName === 'Prod' &&
  prodAlias &&
  prodErrorAlarm &&
  prodDurationAlarm
) {
  new codedeploy.LambdaDeploymentGroup(
    this,
    'ProdCanaryDeploymentGroup',
    {
      alias: prodAlias,

      // Send 10% of traffic to the new version,
      // wait 5 minutes, then move the remaining 90%.
      deploymentConfig:
        codedeploy.LambdaDeploymentConfig.CANARY_10PERCENT_5MINUTES,

      // These alarms can trigger automatic rollback.
      alarms: [
        prodErrorAlarm,
        prodDurationAlarm,
      ],

      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
        deploymentInAlarm: true,
      },
    }
  );
}
    // ------------------------------------------------------------
    // IAM Permission
    // Allow Lambda to publish custom CloudWatch metrics
    // ------------------------------------------------------------

    websiteMonitor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // ------------------------------------------------------------
    // EventBridge Schedule
    // Run Lambda every 30 minutes
    // ------------------------------------------------------------

    const scheduleRule = new events.Rule(
      this,
      'WebHealthSchedule',
      {
        schedule: events.Schedule.rate(
          cdk.Duration.minutes(30)
        ),
      }
    );

    scheduleRule.addTarget(
      new targets.LambdaFunction(websiteMonitor)
    );

    // ------------------------------------------------------------
    // Websites
    // ------------------------------------------------------------

    const websites = [
      {
        name: 'Google',
        url: 'https://google.com',
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
      },
      {
        name: 'Amazon',
        url: 'https://amazon.com',
      },
    ];

    // ------------------------------------------------------------
    // CloudWatch Metrics
    // ------------------------------------------------------------

    const availabilityMetrics = websites.map((website) =>
      new cloudwatch.Metric({
        namespace: 'WSU2026/WebHealth',
        metricName: 'Availability',
        dimensionsMap: {
          Website: website.url,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(30),
      })
    );

    const latencyMetrics = websites.map((website) =>
      new cloudwatch.Metric({
        namespace: 'WSU2026/WebHealth',
        metricName: 'Latency',
        dimensionsMap: {
          Website: website.url,
        },
        statistic: 'Average',
        unit: cloudwatch.Unit.MILLISECONDS,
        period: cdk.Duration.minutes(30),
      })
    );

    // ------------------------------------------------------------
    // CloudWatch Dashboard
    // ------------------------------------------------------------

    const dashboard = new cloudwatch.Dashboard(
      this,
      'WebHealthDashboard',
      {
  dashboardName: `${resourcePrefix}-WebHealth-Dashboard-CDK`,
      }
    );

    const availabilityWidget = new cloudwatch.GraphWidget({
      title: 'Website Availability',
      left: availabilityMetrics,
      width: 24,
      height: 8,
      leftYAxis: {
        min: 0,
        max: 1,
      },
    });

    const latencyWidget = new cloudwatch.GraphWidget({
      title: 'Website Latency',
      left: latencyMetrics,
      width: 24,
      height: 8,
    });

    dashboard.addWidgets(
      availabilityWidget,
      latencyWidget
    );

    // ------------------------------------------------------------
    // SNS Topic
    // Used by CloudWatch alarms for notifications
    // ------------------------------------------------------------

    const alarmTopic = new sns.Topic(
      this,
      'WebHealthAlarmTopic',
      {
topicName: `${resourcePrefix}-WebHealth-Alarms`,
displayName: `${resourcePrefix} Web Health Alarm Notifications`,
      }
    );

    alarmTopic.addSubscription(
  new subscriptions.EmailSubscription('22222784@student.westernsydney.edu.au')
);


// ------------------------------------------------------------
// DynamoDB Table for Alarm Logs
// ------------------------------------------------------------

const alarmLogTable = new dynamodb.Table(
  this,
  'WebHealthAlarmLogTable',
  {
tableName: `${resourcePrefix}-WebHealth-AlarmLogs`,

    partitionKey: {
      name: 'alarmId',
      type: dynamodb.AttributeType.STRING,
    },

    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,

    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }
);

// ------------------------------------------------------------
// Lambda Function for Logging Alarm State Changes
// ------------------------------------------------------------

const alarmLogger = new lambda.Function(
  this,
  'AlarmLoggerFunction',
  {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'index.lambda_handler',
    code: lambda.Code.fromAsset('alarm-logger'),
    environment: {
      TABLE_NAME: alarmLogTable.tableName,
    },
  }
);

alarmLogTable.grantWriteData(alarmLogger);

// ------------------------------------------------------------
// EventBridge Rule for CloudWatch Alarm State Changes
// ------------------------------------------------------------

const alarmStateChangeRule = new events.Rule(
  this,
  'AlarmStateChangeRule',
  {
    eventPattern: {
      source: ['aws.cloudwatch'],
      detailType: ['CloudWatch Alarm State Change'],
    },
  }
);

alarmStateChangeRule.addTarget(
  new targets.LambdaFunction(alarmLogger)
);
    // ------------------------------------------------------------
    // Availability Alarms
    // Alarm when Availability < 1
    // ------------------------------------------------------------

    websites.forEach((website, index) => {
      const availabilityAlarm = new cloudwatch.Alarm(
        this,
        `${website.name}AvailabilityAlarm`,
        {
          metric: availabilityMetrics[index],

          threshold: 1,

          evaluationPeriods: 1,

          datapointsToAlarm: 1,

          comparisonOperator:
            cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,

          treatMissingData:
            cloudwatch.TreatMissingData.MISSING,

          alarmName:
  `${alarmPrefix}${website.name}-Availability-Alarm-CDK`,

          alarmDescription:
            `Alarm when ${website.name} availability falls below 1`,
        }
      );

      // Send alarm notification to SNS
      availabilityAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );
    });

    // ------------------------------------------------------------
    // Latency Alarms
    // Alarm when Latency > 1000 milliseconds
    // ------------------------------------------------------------

    websites.forEach((website, index) => {
      const latencyAlarm = new cloudwatch.Alarm(
        this,
        `${website.name}LatencyAlarm`,
        {
          metric: latencyMetrics[index],

          threshold: 1000,

          evaluationPeriods: 1,

          datapointsToAlarm: 1,

          comparisonOperator:
            cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,

          treatMissingData:
            cloudwatch.TreatMissingData.MISSING,

alarmName:
  `${alarmPrefix}${website.name}-Latency-Alarm-CDK`,

          alarmDescription:
            `Alarm when ${website.name} latency exceeds 1000 milliseconds`,
        }
      );

      // Send alarm notification to SNS
      latencyAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );
    });
  }
}