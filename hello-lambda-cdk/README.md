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

# Week 9 - Multi-Stage CI/CD Pipeline

Week 9 focused on implementing a multi-stage CI/CD pipeline for the Web Health Monitoring application using AWS CDK, AWS CodePipeline, and AWS CodeBuild.

## CI/CD Pipeline

Pipeline name:

```text
WSU2026-WebHealth-Pipeline
```

Region:

```text
Asia Pacific (Sydney)
ap-southeast-2
```

The CI/CD pipeline automatically retrieves the project source code from GitHub, builds and tests the application, synthesizes the AWS CDK infrastructure, and deploys the application through BetaGamma and Production environments.

---

## Pipeline Flow

```text
GitHub
   |
   v
Source
   |
   v
Build / Test / Synth
   |
   v
UpdatePipeline
(Self-Mutation)
   |
   v
Assets
   |
   v
BetaGamma
   |
   v
Manual Approval
   |
   v
Prod
```

---

## Pipeline Stages

### Source

The Source stage retrieves the latest project code from GitHub.

Repository:

```text
Phalrithireach/WSU2026
```

Branch:

```text
main
```

The GitHub repository is connected to AWS CodePipeline so that source code changes can trigger the CI/CD process.

---

### Build

AWS CodeBuild automatically builds, tests, and synthesizes the AWS CDK application.

The build process includes:

```text
npm install
npm run build
npm test
npx cdk synth
```

The infrastructure unit test verifies that the required AWS resources can be created correctly.

---

### UpdatePipeline

The UpdatePipeline stage uses AWS CDK self-mutation.

Self-mutation allows changes made to the pipeline infrastructure code to automatically update the AWS CodePipeline configuration.

This means changes to the pipeline itself can be managed using Infrastructure as Code.

---

### Assets

The Assets stage prepares and publishes the Lambda deployment packages required by the application.

The assets include:

```text
HelloLambdaFunction_Code
AlarmLoggerFunction_Code
```

These Lambda assets are prepared before deployment to the application environments.

---

### BetaGamma

The application is first deployed to the BetaGamma environment.

This environment is used before Production so that the deployment can be verified before releasing changes to the Production environment.

The BetaGamma deployment completed successfully.

---

### Manual Production Approval

Before the application can be deployed to Production, the pipeline requires manual approval.

Approval action:

```text
ApproveProductionDeployment
```

The pipeline stops at this stage until the deployment is manually approved.

This prevents application changes from automatically reaching Production without review.

---

### Production

After the manual approval is completed, the pipeline continues to the Production environment.

The Production stage performs:

```text
WebHealthStack.Prepare
WebHealthStack.Deploy
```

The Production deployment completed successfully.

---

## Deployment Environments

The pipeline contains two application deployment environments:

```text
BetaGamma
Prod
```

AWS CDK stages are used to separate the environments.

Environment-specific resource names are used to prevent resource naming conflicts between BetaGamma and Production.

---

## Week 9 Files

The following project files are used for the Week 9 CI/CD pipeline:

```text
bin/hello-lambda-cdk.ts
lib/hello-lambda-cdk-stack.ts
lib/web-health-stage.ts
lib/pipeline-stack.ts
test/hello-lambda-cdk.test.ts
```

### pipeline-stack.ts

Defines the AWS CodePipeline configuration, including:

- GitHub source
- CodeBuild
- CDK synthesis
- Self-mutation
- BetaGamma deployment
- Manual Production approval
- Production deployment

### web-health-stage.ts

Defines a reusable AWS CDK Stage for deploying the Web Health Monitoring stack into different environments.

### hello-lambda-cdk-stack.ts

Defines the main Web Health Monitoring infrastructure, including:

- Web Health Lambda
- CloudWatch metrics
- CloudWatch Dashboard
- CloudWatch alarms
- SNS notifications
- DynamoDB alarm logging
- Alarm Logger Lambda
- EventBridge rules

### hello-lambda-cdk.test.ts

Contains infrastructure unit tests used during the CI/CD build process.

---

## Week 9 Verification

The following checks were completed successfully:

- AWS CDK TypeScript build passed
- Infrastructure unit test passed
- AWS CDK synthesis completed successfully
- PipelineStack deployed successfully
- GitHub Source stage succeeded
- AWS CodeBuild stage succeeded
- CDK self-mutation succeeded
- Lambda assets were published successfully
- BetaGamma Prepare succeeded
- BetaGamma Deploy succeeded
- Manual Production approval succeeded
- Production Prepare succeeded
- Production Deploy succeeded

The complete CI/CD pipeline successfully deployed the Web Health Monitoring application from GitHub through BetaGamma and into Production.

---

## Week 9 Tasks Completed

- Created a multi-stage CI/CD pipeline using AWS CDK
- Created the PipelineStack
- Integrated GitHub with AWS CodePipeline
- Added automated build and testing
- Added AWS CDK synthesis
- Added infrastructure unit testing
- Configured CDK self-mutation
- Configured Lambda asset publishing
- Created the BetaGamma deployment environment
- Created the Production deployment environment
- Added a manual approval gate before Production
- Successfully deployed the application to BetaGamma
- Successfully approved the Production deployment
- Successfully deployed the application to Production

---

## Week 9 Learning Outcomes

During Week 9 I learned how to:

- Understand Continuous Integration and Continuous Deployment
- Create CI/CD pipelines using AWS CodePipeline
- Integrate GitHub with AWS CodePipeline
- Use AWS CodeBuild for automated builds and tests
- Use AWS CDK Pipelines
- Use Infrastructure as Code for CI/CD
- Create multiple deployment environments
- Use CDK self-mutation
- Publish Lambda deployment assets
- Deploy infrastructure to BetaGamma before Production
- Configure manual Production approval
- Deploy infrastructure automatically through a CI/CD pipeline

---

# Final CI/CD Pipeline

```text
GitHub Repository
        |
        v
      Source
        |
        v
 Build / Test / Synth
        |
        v
  UpdatePipeline
  (Self-Mutation)
        |
        v
      Assets
        |
        v
    BetaGamma
        |
        v
 Manual Approval
        |
        v
       Prod
```

---

# Conclusion

The WSU2026 DevOps Web Health Monitor provides automated monitoring for Google, GitHub, and Amazon.

The project collects availability and latency telemetry, publishes metrics to Amazon CloudWatch, displays the metrics on a CloudWatch Dashboard, evaluates alarm thresholds, sends SNS email notifications, and records CloudWatch alarm state changes in Amazon DynamoDB.

Amazon EventBridge automatically runs the Web Health Lambda every 30 minutes. CloudWatch alarms monitor website availability and latency, while SNS provides email notifications when alarm thresholds are breached.

An Alarm Logger Lambda receives CloudWatch alarm state-change events through EventBridge and stores the alarm name, state, reason, and timestamp in DynamoDB.

AWS CDK is used to manage the infrastructure as code, while GitHub is used for source control, documentation, and project tracking.

A multi-stage CI/CD pipeline was implemented using AWS CodePipeline and AWS CodeBuild. The pipeline automatically retrieves the source code from GitHub, builds and tests the application, synthesizes the AWS CDK infrastructure, publishes the deployment assets, and deploys the application first to the BetaGamma environment.

Before Production deployment, the pipeline requires manual approval. After approval, the Web Health Monitoring infrastructure is automatically deployed to the Production environment.

The completed project demonstrates Infrastructure as Code, automated monitoring, telemetry, alerting, notification, persistent alarm logging, automated testing, CI/CD automation, multi-stage deployment, environment separation, production approval controls, operational documentation, and GitHub project management.

---

# Week 10 - Automated Testing and Pipeline Test Blockers

Week 10 focused on integrating automated testing into the Web Health Monitoring CI/CD pipeline.

The project uses PyTest to run unit, functional, and integration tests before deployment.

## Week 10 Testing Requirements

The following automated tests were implemented:

```text
10 Unit Tests
8 Functional Tests
2 Integration Tests
```

Total:

```text
20 Automated Tests
```

All 20 tests passed successfully.

## Unit Tests

Ten unit tests were created for the Web Health Lambda.

The unit tests verify:

- Three websites are configured
- Google is configured
- GitHub is configured
- Amazon is configured
- Lambda handler returns HTTP 200
- Successful websites return Availability = 1
- Successful websites return HTTP status 200
- Failed websites return Availability = 0
- Failed websites return error information
- CloudWatch Availability and Latency metrics are published correctly

External network and CloudWatch dependencies are mocked during unit testing.

## Functional Tests

Eight functional tests were created to verify the behaviour of the Web Health Lambda as a complete function.

The functional tests verify:

- Three website results are returned
- All configured websites are included
- Successful websites are marked available
- A failed website is detected correctly
- Failed website error details are returned
- CloudWatch is called for every website
- Each CloudWatch request contains Availability and Latency metrics
- HTTP requests use the configured timeout and User-Agent

## Integration Tests

Two integration tests were created.

The integration tests perform real HTTP checks against:

```text
https://google.com
https://github.com
https://amazon.com
```

The integration tests verify:

- Live websites can be checked successfully
- Website checks generate the expected CloudWatch metric data

## PyTest

The Python automated tests are located in:

```text
python-tests/
├── conftest.py
├── test_unit.py
├── test_functional.py
└── test_integration.py
```

Development dependencies are defined in:

```text
requirements-dev.txt
```

The test suite can be executed using:

```bash
py -m pytest python-tests -v
```

Final local test result:

```text
20 passed
```

## CI/CD Test Blockers

Automated tests were added to the AWS CodePipeline as deployment blockers.

The pipeline now follows this flow:

```text
GitHub
   |
   v
Source
   |
   v
Build / Test / Synth
   |
   v
UpdatePipeline
   |
   v
Assets
   |
   v
UnitFunctionalTestBlocker
   |
   v
BetaGamma
   |
   v
IntegrationTestBlocker
   |
   v
Manual Production Approval
   |
   v
Prod
```

## Unit and Functional Test Blocker

Pipeline action:

```text
UnitFunctionalTestBlocker
```

This action runs:

```text
10 Unit Tests
8 Functional Tests
```

The BetaGamma environment cannot be deployed if these tests fail.

The Week 10 pipeline execution successfully passed the UnitFunctionalTestBlocker before deploying to BetaGamma.

## Integration Test Blocker

Pipeline action:

```text
IntegrationTestBlocker
```

This action runs:

```text
2 Integration Tests
```

Production deployment cannot continue if the integration tests fail.

The Week 10 pipeline execution successfully passed the IntegrationTestBlocker before the Production approval stage.

## Production Approval

After all automated tests passed, the pipeline stopped at:

```text
ApproveProductionDeployment
```

The Production deployment was manually approved.

After approval:

```text
WebHealthStack.Prepare
WebHealthStack.Deploy
```

completed successfully.

## Week 10 Completed Work

Week 10 completed the following:

- Created 10 unit tests
- Created 8 functional tests
- Created 2 integration tests
- Installed and configured PyTest
- Added reusable PyTest fixtures
- Verified all 20 tests locally
- Added UnitFunctionalTestBlocker to AWS CodePipeline
- Added IntegrationTestBlocker to AWS CodePipeline
- Prevented BetaGamma deployment when unit or functional tests fail
- Prevented Production progression when integration tests fail
- Retained manual Production approval
- Successfully deployed to BetaGamma
- Successfully deployed to Production
- Verified the complete CI/CD pipeline

## Week 10 Learning Outcomes

During Week 10 I learned how to:

- Use PyTest for automated testing
- Create unit tests
- Create functional tests
- Create integration tests
- Mock external dependencies during testing
- Integrate automated testing with AWS CodePipeline
- Use automated tests as deployment blockers
- Prevent failed builds from reaching deployment environments
- Test before BetaGamma deployment
- Test before Production deployment
- Use manual approval together with automated quality gates
- Apply continuous testing practices in a CI/CD pipeline