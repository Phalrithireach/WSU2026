
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
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface HelloLambdaCdkStackProps extends cdk.StackProps {
  environmentName?: string;
}

export class HelloLambdaCdkStack extends cdk.Stack {
  public readonly crudApiUrlOutput: cdk.CfnOutput;

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

    const isProduction = environmentName === 'Prod';

    const dataRemovalPolicy = isProduction
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // ============================================================
    // 1. DYNAMODB - WEBSITE TARGETS
    // ============================================================

    const targetTable = new dynamodb.Table(
      this,
      'WebCrawlerTargetTable',
      {
        tableName: `${resourcePrefix}-WebCrawler-Targets`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: dataRemovalPolicy,
      }
    );

    // ============================================================
    // 2. CRUD LAMBDA
    // ============================================================

    const crudFunction = new lambda.Function(
      this,
      'WebCrawlerCrudFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'crud.lambda_handler',
        code: lambda.Code.fromAsset('lambda'),
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: targetTable.tableName,
        },
      }
    );

    targetTable.grantReadWriteData(crudFunction);

    // ============================================================
    // 3. API GATEWAY ACCESS LOGGING
    // ============================================================

    const apiAccessLogs = new logs.LogGroup(
      this,
      'WebCrawlerApiAccessLogs',
      {
        logGroupName: `${resourcePrefix}-WebCrawler-ApiAccess`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: dataRemovalPolicy,
      }
    );

    // ============================================================
    // 4. API GATEWAY
    // ============================================================

    const crudApi = new apigateway.RestApi(
      this,
      'WebCrawlerCrudApi',
      {
        restApiName: `${resourcePrefix}-WebCrawler-API`,
        description: 'REST API for Web Health crawler targets',

        endpointTypes: [
          apigateway.EndpointType.REGIONAL,
        ],

        // GET endpoints remain public.
        defaultMethodOptions: {
          authorizationType: apigateway.AuthorizationType.NONE,
        },

        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,

          allowMethods: [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'OPTIONS',
          ],

          allowHeaders: [
            'Content-Type',
            'Authorization',
            'X-Amz-Date',
            'X-Amz-Security-Token',
            'X-Amz-Content-Sha256',
          ],
        },

        deployOptions: {
          stageName: 'prod',

          throttlingRateLimit: 5,
          throttlingBurstLimit: 10,

          metricsEnabled: true,

          accessLogDestination:
            new apigateway.LogGroupLogDestination(
              apiAccessLogs
            ),

          accessLogFormat:
            apigateway.AccessLogFormat.jsonWithStandardFields(),
        },
      }
    );

    // ============================================================
    // 5. API GATEWAY SECURITY
    // ============================================================

    // Production write operations require AWS IAM authorization.
    //
    // BetaGamma temporarily allows unauthenticated writes because
    // the existing CodePipeline integration tests use urllib
    // without AWS SigV4 request signing.
    //
    // TODO: Update integration tests with SigV4 signing and grant
    // execute-api:Invoke to the test role, then enable IAM for
    // BetaGamma as well.
    //
    // AWS_IAM requires the caller to sign requests and possess
    // execute-api:Invoke permission. It is not an API key.

    const writeAuthorization = isProduction
      ? apigateway.AuthorizationType.IAM
      : apigateway.AuthorizationType.NONE;

    const writeMethodOptions: apigateway.MethodOptions = {
      authorizationType: writeAuthorization,
      apiKeyRequired: false,
    };

    // ============================================================
    // 6. LAMBDA INTEGRATION
    // ============================================================

    const crudIntegration = new apigateway.LambdaIntegration(
      crudFunction
    );

    // ============================================================
    // 7. CRUD REST ENDPOINTS
    // ============================================================

    const targetsResource = crudApi.root.addResource('targets');

    // POST /targets
    targetsResource.addMethod(
      'POST',
      crudIntegration,
      writeMethodOptions
    );

    // GET /targets
    targetsResource.addMethod(
      'GET',
      crudIntegration
    );

    const targetByIdResource =
      targetsResource.addResource('{id}');

    // GET /targets/{id}
    targetByIdResource.addMethod(
      'GET',
      crudIntegration
    );

    // PUT /targets/{id}
    targetByIdResource.addMethod(
      'PUT',
      crudIntegration,
      writeMethodOptions
    );

    // DELETE /targets/{id}
    targetByIdResource.addMethod(
      'DELETE',
      crudIntegration,
      writeMethodOptions
    );

    // ============================================================
    // 8. API GATEWAY OUTPUT
    // ============================================================

    this.crudApiUrlOutput = new cdk.CfnOutput(
      this,
      'WebCrawlerCrudApiUrl',
      {
        value: `${crudApi.url}targets`,
        description: 'Web Crawler CRUD API endpoint',
      }
    );

    // ============================================================
    // 9. WEBSITE MONITORING LAMBDA
    // ============================================================

    const websiteMonitor = new lambda.Function(
      this,
      'HelloLambdaFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',
        timeout: cdk.Duration.seconds(30),
        code: lambda.Code.fromAsset('lambda'),

        environment: {
          TABLE_NAME: targetTable.tableName,
        },
      }
    );

    targetTable.grantReadData(websiteMonitor);

    // ============================================================
    // 10. PRODUCTION LAMBDA ALIAS
    // ============================================================

    let monitorTarget: lambda.IFunction = websiteMonitor;
    let prodAlias: lambda.Alias | undefined;

    if (isProduction) {
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

    // ============================================================
    // 11. PRODUCTION OPERATIONAL ALARMS
    // ============================================================

    let prodErrorAlarm: cloudwatch.Alarm | undefined;
    let prodDurationAlarm: cloudwatch.Alarm | undefined;

    if (isProduction && prodAlias) {
      const invocationMetric = prodAlias.metricInvocations({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      });

      const durationMetric = prodAlias.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      });

      const errorMetric = prodAlias.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      });

      // Detect missing Lambda invocations.
      new cloudwatch.Alarm(
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
            'Production Lambda received no invocations for one hour',
        }
      );

      // Detect excessive execution time.
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
            'Production Lambda average duration exceeds 10 seconds',
        }
      );

      // Detect Lambda execution errors.
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
            'Production Lambda execution error detected',
        }
      );
    }

    // ============================================================
    // 12. AUTOMATIC LAMBDA ROLLBACK
    // ============================================================

    if (
      isProduction &&
      prodAlias &&
      prodErrorAlarm &&
      prodDurationAlarm
    ) {
      const rollbackFunction = new lambda.Function(
        this,
        'ProdRollbackFunction',
        {
          runtime: lambda.Runtime.PYTHON_3_12,
          handler: 'index.lambda_handler',
          timeout: cdk.Duration.seconds(30),

          environment: {
            FUNCTION_NAME: websiteMonitor.functionName,
            ALIAS_NAME: 'live',
          },

          code: lambda.Code.fromInline(`
import os
import boto3

lambda_client = boto3.client("lambda")


def lambda_handler(event, context):
    function_name = os.environ["FUNCTION_NAME"]
    alias_name = os.environ["ALIAS_NAME"]

    alarm_state = (
        event
        .get("detail", {})
        .get("state", {})
        .get("value")
    )

    if alarm_state != "ALARM":
        return {
            "rolled_back": False,
            "reason": "Alarm is not in ALARM state"
        }

    alias = lambda_client.get_alias(
        FunctionName=function_name,
        Name=alias_name
    )

    current_version = int(alias["FunctionVersion"])

    response = lambda_client.list_versions_by_function(
        FunctionName=function_name
    )

    published_versions = sorted(
        int(version["Version"])
        for version in response["Versions"]
        if version["Version"] != "$LATEST"
    )

    previous_versions = [
        version
        for version in published_versions
        if version < current_version
    ]

    if not previous_versions:
        return {
            "rolled_back": False,
            "reason": "No previous Lambda version exists"
        }

    previous_version = str(max(previous_versions))

    lambda_client.update_alias(
        FunctionName=function_name,
        Name=alias_name,
        FunctionVersion=previous_version,
        RoutingConfig={}
    )

    return {
        "rolled_back": True,
        "from_version": str(current_version),
        "to_version": previous_version
    }
`),
        }
      );

      rollbackFunction.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'lambda:GetAlias',
            'lambda:ListVersionsByFunction',
            'lambda:UpdateAlias',
          ],

          resources: [
            websiteMonitor.functionArn,
            `${websiteMonitor.functionArn}:*`,
          ],
        })
      );

      const rollbackRule = new events.Rule(
        this,
        'ProdAutomaticRollbackRule',
        {
          eventPattern: {
            source: [
              'aws.cloudwatch',
            ],

            detailType: [
              'CloudWatch Alarm State Change',
            ],

            detail: {
              alarmName: [
                prodErrorAlarm.alarmName,
                prodDurationAlarm.alarmName,
              ],

              state: {
                value: ['ALARM'],
              },
            },
          },
        }
      );

      rollbackRule.addTarget(
        new targets.LambdaFunction(rollbackFunction)
      );
    }

    // ============================================================
    // 13. CLOUDWATCH METRIC PERMISSIONS
    // ============================================================

    websiteMonitor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cloudwatch:PutMetricData',
        ],

        resources: ['*'],
      })
    );

    // ============================================================
    // 14. EVENTBRIDGE - EVERY 30 MINUTES
    // ============================================================

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
      new targets.LambdaFunction(monitorTarget)
    );

    // ============================================================
    // 15. MONITORED WEBSITES
    // ============================================================

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

    // ============================================================
    // 16. AVAILABILITY METRICS
    // ============================================================

    const availabilityMetrics = websites.map(
      (website) =>
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

    // ============================================================
    // 17. LATENCY METRICS
    // ============================================================

    const latencyMetrics = websites.map(
      (website) =>
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

    // ============================================================
    // 18. CLOUDWATCH DASHBOARD
    // ============================================================

    const dashboard = new cloudwatch.Dashboard(
      this,
      'WebHealthDashboard',
      {
        dashboardName:
          `${resourcePrefix}-WebHealth-Dashboard-CDK`,
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

    // ============================================================
    // 19. SNS NOTIFICATIONS
    // ============================================================

    const alarmTopic = new sns.Topic(
      this,
      'WebHealthAlarmTopic',
      {
        topicName:
          `${resourcePrefix}-WebHealth-Alarms`,

        displayName:
          `${resourcePrefix} Web Health Alarm Notifications`,
      }
    );

    alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(
        '22222784@student.westernsydney.edu.au'
      )
    );

    // ============================================================
    // 20. DYNAMODB - ALARM LOGGING
    // ============================================================

    const alarmLogTable = new dynamodb.Table(
      this,
      'WebHealthAlarmLogTable',
      {
        tableName:
          `${resourcePrefix}-WebHealth-AlarmLogs`,

        partitionKey: {
          name: 'alarmId',
          type: dynamodb.AttributeType.STRING,
        },

        billingMode:
          dynamodb.BillingMode.PAY_PER_REQUEST,

        removalPolicy: dataRemovalPolicy,
      }
    );

    // ============================================================
    // 21. ALARM LOGGER LAMBDA
    // ============================================================

    const alarmLogger = new lambda.Function(
      this,
      'AlarmLoggerFunction',
      {
        runtime: lambda.Runtime.PYTHON_3_12,
        handler: 'index.lambda_handler',

        code: lambda.Code.fromAsset(
          'alarm-logger'
        ),

        environment: {
          TABLE_NAME: alarmLogTable.tableName,
        },
      }
    );

    alarmLogTable.grantWriteData(alarmLogger);

    // ============================================================
    // 22. ALARM STATE CHANGE EVENTS
    // ============================================================

    const alarmStateChangeRule = new events.Rule(
      this,
      'AlarmStateChangeRule',
      {
        eventPattern: {
          source: ['aws.cloudwatch'],

          detailType: [
            'CloudWatch Alarm State Change',
          ],
        },
      }
    );

    alarmStateChangeRule.addTarget(
      new targets.LambdaFunction(alarmLogger)
    );

    // ============================================================
    // 23. WEBSITE AVAILABILITY ALARMS
    // ============================================================

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

      availabilityAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );
    });

    // ============================================================
    // 24. WEBSITE LATENCY ALARMS
    // ============================================================

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

      latencyAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );
    });
  }
}
