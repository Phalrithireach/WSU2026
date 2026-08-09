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

## CloudWatch Metrics

Custom namespace:

WSU2026/WebHealth

Metrics:

- Availability
  - 1 = Website available
  - 0 = Website unavailable

- Latency
  - Response time measured in milliseconds

## CloudWatch Dashboard

Dashboard name:

WSU2026-WebHealth-Dashboard

The dashboard contains:

- Availability graph
- Latency graph

for Google, GitHub, and Amazon.

## Schedule

The website health monitor runs automatically every 30 minutes using Amazon EventBridge.

Schedule:

rate(30 minutes)

## Build

```bash
npm run build