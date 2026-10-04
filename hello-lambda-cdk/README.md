# WSU2026 DevOps Web Health Monitor

## Project Overview

This project uses AWS CDK and AWS Lambda to monitor the health of multiple websites.

The Web Health Lambda checks each website and collects:

- Website availability
- HTTP status
- Response latency

The collected metrics are published to Amazon CloudWatch. CloudWatch dashboards display the metrics, while CloudWatch alarms monitor availability and latency thresholds.

SNS is used for email notifications, and CloudWatch alarm state changes are logged into Amazon DynamoDB using an Alarm Logger Lambda.

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