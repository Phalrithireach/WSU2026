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

The email subscription was confirmed using the student email account.

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

Completed work:

- Created the Web Health Lambda
- Monitored Google, GitHub, and Amazon
- Collected availability metrics
- Collected latency metrics
- Published custom metrics to CloudWatch
- Created the CloudWatch Dashboard
- Configured EventBridge scheduling
- Deployed infrastructure using AWS CDK

---

# Week 4 - CloudWatch Alarms

Week 4 focused on monitoring thresholds and alerting.

Completed work:

- Created three Availability alarms
- Created three Latency alarms
- Configured availability threshold `< 1`
- Configured latency threshold `> 1000 ms`
- Configured 30-minute evaluation periods
- Verified CloudWatch alarm states

---

# Week 5 - Documentation and Project Management

Week 5 focused on documentation and project organisation.

Completed work:

- Documented the monitoring solution
- Created `RUNBOOK.md`
- Created the GitHub Project dashboard
- Added completed project tasks
- Organised monitoring and troubleshooting procedures

---

# Week 6 - SNS and Alarm Logging

Week 6 focused on notification and persistent alarm logging.

Completed work:

- Created the SNS alarm topic
- Configured email notifications
- Confirmed the SNS email subscription
- Created the DynamoDB alarm log table
- Created the Alarm Logger Lambda
- Created the EventBridge alarm state-change rule
- Connected EventBridge to the Alarm Logger
- Tested DynamoDB alarm logging successfully

---

# Week 7 - Project Finalisation

Week 7 introduced no new project components.

The focus was on completing and verifying all previous project requirements.

Completed checks:

- Web Health Lambda verified
- Availability and Latency metrics verified
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

```bash
npm run build
```

## Synthesize CloudFormation

```bash
npx cdk synth
```

## Check Infrastructure Changes

```bash
npx cdk diff
```

## Deploy

```bash
npx cdk deploy
```

---

# Git Commands

Check repository status:

```bash
git status
```

Stage changes:

```bash
git add README.md
```

Commit changes:

```bash
git commit -m "Complete Week 7 README documentation"
```

Push to GitHub:

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

This project demonstrates Infrastructure as Code, automated monitoring, telemetry, alerting, notification, persistent alarm logging, operational documentation, and project management using AWS and GitHub.