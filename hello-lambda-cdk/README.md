# WSU2026 DevOps Web Health Monitor

## Project Overview

This project uses AWS CDK and AWS Lambda to monitor the health of multiple websites.

The Lambda function checks each website and collects:

- Website availability
- HTTP status
- Response latency

The collected metrics are sent to Amazon CloudWatch and displayed on a CloudWatch Dashboard.

## Websites Monitored

- https://google.com
- https://github.com
- https://amazon.com

## AWS Services Used

- AWS Lambda
- AWS CDK
- AWS CloudFormation
- AWS IAM
- Amazon CloudWatch
- Amazon EventBridge

## Architecture

EventBridge runs the Lambda function every 30 minutes.

```text
EventBridge
    ↓
AWS Lambda
    ↓
Website Health Checks
    ↓
Availability and Latency Metrics
    ↓
Amazon CloudWatch
    ↓
CloudWatch Dashboard
```

## CloudWatch Metrics

Custom namespace:

```text
WSU2026/WebHealth
```

### Availability

The Availability metric indicates whether a website is accessible.

```text
1 = Website available
0 = Website unavailable
```

### Latency

The Latency metric records the website response time in milliseconds.

## CloudWatch Dashboard

Dashboard name:

```text
WSU2026-WebHealth-Dashboard
```

The dashboard contains:

- Availability graph
- Latency graph

The dashboard monitors Google, GitHub, and Amazon.

## Schedule

The website health monitor runs automatically every 30 minutes using Amazon EventBridge.

Schedule:

```text
rate(30 minutes)
```

## Build

```bash
npm run build
```

## Deploy

```bash
npx cdk deploy
```

## Test

The Lambda function can also be tested manually from the AWS Lambda Console.

Example result:

```json
{
  "website": "https://google.com",
  "status": 200,
  "availability": 1,
  "latency_ms": 120.5
}
```

## Week 3 - Web Health Monitoring

During Week 3, the Lambda function was extended to monitor multiple websites and publish custom metrics to Amazon CloudWatch.

### Week 3 Tasks Completed

- Extended the AWS Lambda function
- Monitored multiple websites
- Measured website availability
- Measured website latency
- Published custom metrics to CloudWatch
- Added CloudWatch IAM permissions
- Created a CloudWatch Dashboard
- Added Availability and Latency graphs
- Configured Amazon EventBridge
- Scheduled the Lambda function to run every 30 minutes

### Week 3 Learning Outcomes

During Week 3 I learned how to:

- Monitor multiple websites using AWS Lambda
- Measure website availability
- Measure website latency
- Publish custom CloudWatch metrics using Boto3
- Configure IAM permissions for CloudWatch
- Build a CloudWatch Dashboard
- Schedule Lambda execution using EventBridge
- Deploy infrastructure using AWS CDK

## Week 4 - CloudWatch Alarms

During Week 4, CloudWatch alarms were added to monitor website availability and latency.

### Availability Alarms

The following availability alarms were created:

- Google-Availability-Alarm
- GitHub-Availability-Alarm
- Amazon-Availability-Alarm

Alarm condition:

```text
Availability < 1
```

Configuration:

- Statistic: Average
- Period: 30 minutes
- Datapoints to alarm: 1 out of 1
- Missing data: Treat missing data as missing

If the Availability metric becomes `0`, the CloudWatch alarm can enter the ALARM state.

### Latency Alarms

The following latency alarms were created:

- Google-Latency-Alarm
- GitHub-Latency-Alarm
- Amazon-Latency-Alarm

Alarm condition:

```text
Latency > 1000 milliseconds
```

Configuration:

- Statistic: Average
- Period: 30 minutes
- Datapoints to alarm: 1 out of 1
- Missing data: Treat missing data as missing

If website latency exceeds 1000 milliseconds, the CloudWatch alarm can enter the ALARM state.

### CloudWatch Alarm States

The alarms can have the following states:

- OK - The metric is within the configured threshold
- ALARM - The metric has crossed the configured threshold
- INSUFFICIENT_DATA - CloudWatch does not currently have enough data to evaluate the alarm

### Week 4 Learning Outcomes

During Week 4 I learned how to:

- Create CloudWatch alarms
- Monitor website availability
- Monitor website latency
- Configure alarm thresholds
- Configure alarm evaluation periods
- Configure missing data treatment
- Understand OK, ALARM, and INSUFFICIENT_DATA states
- Use CloudWatch alarms with custom Lambda metrics

- ## Week 5 - Monitoring Documentation and Project Management

During Week 5, the monitoring solution was documented and its completed work was organised using a GitHub Project dashboard.

### CloudWatch Dashboard

The `WSU2026-WebHealth-Dashboard` displays Availability and Latency metrics for:

- Google
- GitHub
- Amazon

### CloudWatch Alarms

Six CloudWatch alarms monitor website health:

- Three Availability alarms trigger when `Availability < 1`
- Three Latency alarms trigger when `Latency > 1000 milliseconds`

Alarm configuration and states are documented in the [Week 4 - CloudWatch Alarms](#week-4---cloudwatch-alarms) section above.

### Operational Runbook

Operational monitoring and troubleshooting procedures are documented in [RUNBOOK.md](RUNBOOK.md).

The runbook explains how to:

- Check the CloudWatch dashboard and alarms
- Investigate website availability failures
- Investigate high latency
- Review Lambda logs
- Run a manual Lambda test
- Redeploy the application
- Escalate unresolved problems

### GitHub Project Dashboard

Completed monitoring work is tracked in the **WSU2026 Web Health Project** GitHub Project dashboard.

The project is linked to the `WSU2026` repository and contains the following completed items:

- Web Health Lambda
- Availability and Latency Metrics
- Publish Metrics to CloudWatch
- CloudWatch Dashboard
- CloudWatch Alarms
- README Documentation
- Runbook Documentation

Repository Projects page: [WSU2026 Projects](https://github.com/Phalrithireach/WSU2026/projects)

### Week 5 Tasks Completed

- [x] CloudWatch Dashboard configured
- [x] Availability and Latency alarms configured
- [x] README documentation completed
- [x] Operational runbook created
- [x] GitHub Project dashboard created
- [x] Completed tasks recorded on the project board
- [x] GitHub Project linked to the repository
