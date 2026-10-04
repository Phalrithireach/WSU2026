# WSU2026 DevOps Web Health Monitor

## Project Overview

This project uses AWS CDK and AWS Lambda to monitor the health of multiple websites.

The Web Health Lambda checks each website and collects:

- Website availability
- HTTP status
- Response latency

The collected metrics are published to Amazon CloudWatch. CloudWatch dashboards display the metrics, while CloudWatch alarms monitor availability and latency thresholds.

Amazon SNS is used for email notifications, and CloudWatch alarm state changes are logged into Amazon DynamoDB using an Alarm Logger Lambda.

---

## Websites Monitored

- https://google.com
- https://github.com
- https://amazon.com

---

## AWS Services Used

- AWS Lambda
- AWS CDK
- AWS CloudFormation
- AWS IAM
- Amazon CloudWatch
- Amazon EventBridge
- Amazon SNS
- Amazon DynamoDB

---

# Architecture

## Web Health Monitoring Flow

```text
EventBridge Schedule
        |
        v
Web Health Lambda
        |
        v
Website Health Checks
        |
        v
Availability + Latency Metrics
        |
        v
Amazon CloudWatch
        |
        +----------------------+
        |                      |
        v                      v
CloudWatch Dashboard     CloudWatch Alarms
                               |
                    +----------+----------+
                    |                     |
                    v                     v
                   SNS              EventBridge
                    |                     |
                    v                     v
             Email Notification    Alarm Logger Lambda
                                          |
                                          v
                                      DynamoDB
```

---

# CloudWatch Metrics

## Custom Namespace

```text
WSU2026/WebHealth
```

Two custom metrics are collected for each monitored website.

### Availability

The Availability metric shows whether the website is reachable.

```text
1 = Website available
0 = Website unavailable
```

### Latency

The Latency metric records website response time in milliseconds.

---

# CloudWatch Dashboard

Dashboard name:

```text
WSU2026-WebHealth-Dashboard
```

The dashboard displays:

- Availability for Google, GitHub, and Amazon
- Latency for Google, GitHub, and Amazon

This provides a central view of website health and performance.

---

# EventBridge Schedule

Amazon EventBridge automatically runs the Web Health Lambda every 30 minutes.

```text
rate(30 minutes)
```

Flow:

```text
EventBridge Schedule
        |
        v
Web Health Lambda
```

---

# CloudWatch Alarms

Six CloudWatch alarms monitor the three websites.

## Availability Alarms

```text
Google-Availability-Alarm-CDK
GitHub-Availability-Alarm-CDK
Amazon-Availability-Alarm-CDK
```

Condition:

```text
Availability < 1
```

Configuration:

```text
Statistic: Average
Period: 30 minutes
Datapoints to Alarm: 1 out of 1
Missing Data: Missing
```

If Availability becomes `0`, the alarm can enter the `ALARM` state.

## Latency Alarms

```text
Google-Latency-Alarm-CDK
GitHub-Latency-Alarm-CDK
Amazon-Latency-Alarm-CDK
```

Condition:

```text
Latency > 1000 milliseconds
```

Configuration:

```text
Statistic: Average
Period: 30 minutes
Datapoints to Alarm: 1 out of 1
Missing Data: Missing
```

If latency exceeds 1000 milliseconds, the alarm can enter the `ALARM` state.

## Alarm States

CloudWatch alarms can have the following states:

- `OK` - metric is within the configured threshold
- `ALARM` - metric has crossed the configured threshold
- `INSUFFICIENT_DATA` - CloudWatch does not have enough data to evaluate the alarm

---

# SNS Alarm Notifications

Amazon SNS is used to send email notifications when CloudWatch alarms enter the ALARM state.

SNS topic:

```text
WSU2026-WebHealth-Alarms
```

Notification flow:

```text
CloudWatch Alarm
       |
       v
      SNS
       |
       v
Email Notification
```

The SNS email subscription was confirmed using the student email account.

---

# DynamoDB Alarm Logging

CloudWatch alarm state changes are logged into Amazon DynamoDB.

DynamoDB table:

```text
WSU2026-WebHealth-AlarmLogs
```

Alarm logging flow:

```text
CloudWatch Alarm State Change
            |
            v
       EventBridge
            |
            v
    Alarm Logger Lambda
            |
            v
        DynamoDB
```

The DynamoDB table stores:

- Alarm ID
- Alarm name
- Alarm state
- Reason
- Timestamp

---

# Alarm Logger Lambda

The Alarm Logger Lambda receives CloudWatch alarm state-change events from EventBridge.

The function reads:

```text
alarmName
state.value
state.reason
time
```

The information is then written into DynamoDB.

---

# Alarm Logging Verification

The alarm logging solution was tested using a simulated CloudWatch alarm state-change event.

Test event:

```text
Alarm Name: Week6-Test-Alarm
State: ALARM
Reason: Manual Week 6 DynamoDB logging test
Timestamp: 2026-10-04T22:20:00Z
```

The Alarm Logger Lambda returned:

```json
{
  "statusCode": 200,
  "message": "Alarm state change logged"
}
```

The DynamoDB table was then checked using the AWS CLI.

The following record was successfully found:

```text
Week6-Test-Alarm
ALARM
Manual Week 6 DynamoDB logging test
2026-10-04T22:20:00Z
```

This confirmed that the Alarm Logger Lambda successfully writes CloudWatch alarm state-change information into DynamoDB.

---

# Operational Runbook

Operational monitoring and troubleshooting procedures are documented in:

```text
RUNBOOK.md
```

The runbook explains how to:

- Check the CloudWatch Dashboard
- Check CloudWatch alarms
- Investigate website availability failures
- Investigate high latency
- Review Lambda errors
- Check IAM permissions
- Check EventBridge scheduling
- Verify CloudWatch metrics
- Redeploy the infrastructure
- Escalate unresolved problems

---

# GitHub Project Dashboard

GitHub Project:

```text
WSU2026 Web Health Project
```

The project dashboard tracks all completed project components.

Current status:

```text
Todo: 0
In Progress: 0
Done: 9
```

Completed items:

1. Web Health Lambda
2. Availability and Latency Metrics
3. Publish Metrics to CloudWatch
4. CloudWatch Dashboard
5. CloudWatch Alarms
6. README Documentation
7. Runbook Documentation
8. SNS Alarm Notifications
9. DynamoDB Alarm Logging

---

# Week 3 - Web Health Monitoring

Week 3 focused on creating the website health monitoring solution.

## Completed Work

- Created the Web Health Lambda
- Monitored Google, GitHub, and Amazon
- Collected website availability
- Collected website latency
- Published custom metrics to CloudWatch
- Added IAM permission for CloudWatch metrics
- Created a CloudWatch Dashboard
- Added Availability and Latency graphs
- Configured EventBridge scheduling
- Scheduled the Lambda every 30 minutes
- Deployed infrastructure using AWS CDK

## Learning Outcomes

During Week 3 I learned how to:

- Monitor websites using AWS Lambda
- Measure website availability
- Measure website latency
- Publish custom CloudWatch metrics
- Configure IAM permissions
- Create a CloudWatch Dashboard
- Schedule Lambda execution using EventBridge
- Deploy infrastructure using AWS CDK

---

# Week 4 - CloudWatch Alarms

Week 4 focused on monitoring thresholds and alerting.

## Completed Work

- Created three Availability alarms
- Created three Latency alarms
- Configured availability threshold `< 1`
- Configured latency threshold `> 1000 ms`
- Configured 30-minute evaluation periods
- Configured missing-data treatment
- Verified CloudWatch alarm states

## Learning Outcomes

During Week 4 I learned how to:

- Create CloudWatch alarms
- Configure alarm thresholds
- Configure evaluation periods
- Monitor availability
- Monitor latency
- Understand `OK`, `ALARM`, and `INSUFFICIENT_DATA` states
- Use CloudWatch alarms with custom metrics

---

# Week 5 - Documentation and Project Management

Week 5 focused on documentation and project organisation.

## Completed Work

- Documented the monitoring solution
- Created `RUNBOOK.md`
- Created the GitHub Project dashboard
- Added completed project tasks
- Organised monitoring procedures
- Organised troubleshooting procedures
- Linked project work to GitHub

---

# Week 6 - SNS and Alarm Logging

Week 6 focused on notifications and persistent alarm logging.

## Completed Work

- Created the SNS alarm topic
- Configured alarm email notifications
- Confirmed the SNS email subscription
- Connected CloudWatch alarms to SNS
- Created the DynamoDB alarm log table
- Created the Alarm Logger Lambda
- Created the EventBridge alarm state-change rule
- Connected EventBridge to the Alarm Logger Lambda
- Granted the Lambda permission to write to DynamoDB
- Tested the Alarm Logger Lambda
- Verified alarm data in DynamoDB

---

# Week 7 - Project Finalisation

Week 7 introduced no new project components.

The focus was on completing, reviewing, and verifying all previous project requirements.

## Completed Checks

- Web Health Lambda verified
- Availability metrics verified
- Latency metrics verified
- CloudWatch custom metrics verified
- CloudWatch Dashboard verified
- CloudWatch alarms verified
- SNS email notifications verified
- DynamoDB alarm logging verified
- README finalised
- Runbook finalised
- GitHub Project dashboard completed

---

# Final Project Architecture

```text
                    EventBridge Schedule
                            |
                            v
                    Web Health Lambda
                            |
                            v
                 Google / GitHub / Amazon
                            |
                            v
              Availability + Latency Metrics
                            |
                            v
                     Amazon CloudWatch
                            |
                +-----------+-----------+
                |                       |
                v                       v
       CloudWatch Dashboard      CloudWatch Alarms
                                        |
                              +---------+---------+
                              |                   |
                              v                   v
                             SNS             EventBridge
                              |                   |
                              v                   v
                     Email Notification   Alarm Logger Lambda
                                                  |
                                                  v
                                               DynamoDB
```

---

# Project Structure

```text
hello-lambda-cdk/
│
├── alarm-logger/
│   └── index.py
│
├── lambda/
│   └── index.py
│
├── bin/
│   └── hello-lambda-cdk.ts
│
├── lib/
│   └── hello-lambda-cdk-stack.ts
│
├── test/
│   └── hello-lambda-cdk.test.ts
│
├── README.md
├── RUNBOOK.md
├── cdk.json
├── package.json
└── tsconfig.json
```

---

# Build and Deployment

## Build

Compile the TypeScript project:

```bash
npm run build
```

## Synthesize CloudFormation

Generate the CloudFormation template:

```bash
npx cdk synth
```

## Check Infrastructure Changes

Compare the local CDK code with the deployed infrastructure:

```bash
npx cdk diff
```

## Deploy

Deploy the infrastructure:

```bash
npx cdk deploy
```

---

# Testing

## Test Web Health Lambda

The Web Health Lambda checks:

```text
https://google.com
https://github.com
https://amazon.com
```

Example result:

```json
{
  "website": "https://google.com",
  "status": 200,
  "availability": 1,
  "latency_ms": 120.5
}
```

## Test Alarm Logger Lambda

The Alarm Logger was tested with a simulated CloudWatch alarm event.

Example successful response:

```json
{
  "statusCode": 200,
  "message": "Alarm state change logged"
}
```

The DynamoDB table was then checked to confirm the alarm record was stored.

---

# Infrastructure as Code

The AWS infrastructure is defined using AWS CDK.

The CDK stack creates and configures components including:

- Lambda functions
- IAM permissions
- EventBridge rules
- CloudWatch metrics
- CloudWatch dashboard
- CloudWatch alarms
- SNS topic
- SNS email subscription
- DynamoDB table
- Alarm logging integration

Using Infrastructure as Code makes the environment repeatable and easier to manage.

---

# Monitoring and Telemetry

The project uses telemetry to understand the health and performance of monitored websites.

Telemetry includes:

- Website availability
- Website latency
- CloudWatch metrics
- CloudWatch dashboards
- CloudWatch alarms
- SNS notifications
- DynamoDB alarm history

This helps identify problems and provides operational feedback about the monitored services.

---

# Git Commands

Check repository status:

```bash
git status
```

Stage README changes:

```bash
git add README.md
```

Commit changes:

```bash
git commit -m "Finalize Week 7 README"
```

Push changes:

```bash
git push origin main
```

---

# Final Project Components

The completed project includes:

- Web Health Lambda
- Website availability monitoring
- Website latency monitoring
- Custom CloudWatch metrics
- CloudWatch Dashboard
- Six CloudWatch alarms
- EventBridge scheduling
- SNS email notifications
- Alarm Logger Lambda
- DynamoDB alarm logging
- AWS CDK Infrastructure as Code
- Operational Runbook
- README documentation
- GitHub Project dashboard

---

# Final Monitoring Flow

```text
Websites
   |
   v
Web Health Lambda
   |
   v
CloudWatch Metrics
   |
   +-----------------------+
   |                       |
   v                       v
Dashboard               Alarms
                           |
             +-------------+-------------+
             |                           |
             v                           v
            SNS                    EventBridge
             |                           |
             v                           v
      Email Notification         Alarm Logger Lambda
                                         |
                                         v
                                      DynamoDB
```

---

# Conclusion

The WSU2026 DevOps Web Health Monitor provides automated monitoring for Google, GitHub, and Amazon.

The project collects availability and latency telemetry, publishes metrics to CloudWatch, displays them on a dashboard, evaluates alarm thresholds, sends SNS email notifications, and records alarm state changes in DynamoDB.

AWS CDK is used to manage the infrastructure as code, while GitHub is used for source control, documentation, and project tracking.

The completed project demonstrates Infrastructure as Code, automated monitoring, telemetry, alerting, notification, persistent alarm logging, operational documentation, and GitHub project management.