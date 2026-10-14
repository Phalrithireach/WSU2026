
# WSU2026 DevOps Web Health Monitoring Project

**Unit:** COMP2029 – DevOps (Spring 2026)  
**University:** Western Sydney University  
**Project:** Web Health Monitoring and Web Crawler CRUD API  
**AWS Region:** Asia Pacific (Sydney) – `ap-southeast-2`  
**Technology:** AWS CDK, TypeScript, Python, AWS Lambda, API Gateway, DynamoDB, CloudWatch and CodePipeline

**GitHub Repository:** https://github.com/Phalrithireach/WSU2026

---

## 1. Project Overview

The WSU2026 DevOps Web Health Monitoring Project is a serverless AWS application designed to monitor website availability, measure response latency, manage crawler targets, and automate software delivery through a CI/CD pipeline.

The project began as a web health monitoring application and was extended to include a public RESTful API for managing website targets stored in Amazon DynamoDB.

The application supports:

- Automated website availability monitoring
- HTTP response status and latency measurement
- CloudWatch custom metrics and dashboards
- CloudWatch availability and latency alarms
- EventBridge scheduling
- SNS email notifications
- DynamoDB alarm event logging
- RESTful CRUD operations using API Gateway
- DynamoDB target management
- DynamoDB read/write performance measurement
- Automated unit, functional and integration tests
- Multi-stage CI/CD deployment
- BetaGamma and Production environments
- Manual Production deployment approval
- Production Lambda aliases and rollback logic
- GitHub documentation and project management

AWS CDK is used to define and manage the cloud infrastructure using TypeScript.

---

## 2. Project Objectives

The main objectives are to:

1. Monitor website availability automatically.
2. Measure website response latency in milliseconds.
3. Publish monitoring metrics to Amazon CloudWatch.
4. Visualise website health using dashboards.
5. Generate alerts when websites become unavailable or respond slowly.
6. Record alarm state changes in DynamoDB.
7. Manage website targets through a public REST API.
8. Implement CRUD business logic using Python AWS Lambda functions.
9. Measure DynamoDB read and write operation durations.
10. Automate testing and deployment using CI/CD.
11. Separate pre-production and production environments.
12. Improve software reliability through automated verification and controlled releases.

---

## 3. AWS Services and Technologies

| Service / Technology | Purpose |
|---|---|
| AWS Lambda | Executes website checks, CRUD logic, alarm logging and rollback logic |
| Amazon API Gateway | Exposes RESTful CRUD endpoints |
| Amazon DynamoDB | Stores crawler targets and alarm event records |
| Amazon CloudWatch | Collects metrics, displays dashboards and evaluates alarms |
| Amazon EventBridge | Schedules website checks and routes alarm events |
| Amazon SNS | Sends alarm notifications by email |
| AWS IAM | Controls Lambda access to AWS resources |
| AWS CDK | Defines infrastructure using TypeScript |
| AWS CloudFormation | Provisions and updates cloud resources |
| AWS CodePipeline | Orchestrates CI/CD delivery |
| AWS CodeBuild | Executes build and automated test commands |
| GitHub | Stores source code and project issues |
| Python 3.12 | Implements serverless application logic |
| TypeScript | Defines infrastructure using AWS CDK |
| PyTest | Executes Python automated tests |
| Jest | Executes CDK infrastructure tests |

---

## 4. System Architecture

The application has three main components: website monitoring, crawler target management, and CI/CD delivery.

### 4.1 Website Monitoring Architecture

```text
Amazon EventBridge
   |
   | Every 30 minutes
   v
Web Health Lambda
   |
   +----> DynamoDB Target Table
   |          |
   |          v
   |      Enabled URLs
   |
   v
Website HTTP Checks
   |
   +----> Availability
   +----> Response Latency
   +----> HTTP Status
   |
   v
Amazon CloudWatch Metrics
   |
   +----> CloudWatch Dashboard
   |
   +----> CloudWatch Alarms
               |
               +----> Amazon SNS
               |          |
               |          v
               |     Email Notification
               |
               +----> EventBridge
                          |
                          v
                     Alarm Logger
                          |
                          v
                       DynamoDB
```

The monitoring Lambda reads enabled targets from DynamoDB when target records are available.

When the table is empty or cannot be read, the current implementation falls back to the original default website list.

This target-selection enhancement is implemented on the project quality-review branch and requires deployment verification.

### 4.2 CRUD API Architecture

```text
User / API Client
       |
       | HTTP Request
       v
Amazon API Gateway
       |
       v
Web Crawler CRUD Lambda
       |
       | Read / Write
       v
Amazon DynamoDB
       |
       v
Target Data / Operation Result
       |
       v
API Gateway HTTP Response
       |
       v
User / API Client
```

### 4.3 CI/CD Architecture

```text
GitHub Repository
       |
       v
Source
       |
       v
Build, Jest Test and CDK Synth
       |
       v
UpdatePipeline
       |
       v
Assets
       |
       v
Unit and Functional Tests
       |
       v
BetaGamma Deployment
       |
       v
Integration Tests
       |
       v
Manual Production Approval
       |
       v
Production Deployment
       |
       v
CloudWatch Monitoring
```

The CI/CD pipeline separates automated verification from manual Production approval.

---

## 5. Web Health Monitoring

### 5.1 Default Websites

The original monitoring configuration contains:

| Website | URL |
|---|---|
| Google | https://google.com |
| GitHub | https://github.com |
| Amazon | https://amazon.com |

These websites are also the fallback monitoring targets.

The updated monitoring implementation supports enabled URLs loaded from the DynamoDB target table.

### 5.2 Monitoring Process

For each selected website, the monitoring Lambda:

1. Creates an HTTP request.
2. Sends the request using Python `urllib.request`.
3. Measures elapsed time.
4. Records the HTTP status or request error.
5. Assigns an availability value.
6. Publishes metrics to CloudWatch.
7. Returns the monitoring results.

### 5.3 Website Availability

Availability indicates whether a website request completed successfully.

```text
1 = Website available
0 = Website unavailable
```

A failed HTTP request is reported with availability `0`.

### 5.4 Website Latency

Latency measures the time taken for a website to respond.

The application records latency in milliseconds:

```text
latency_ms
```

A higher latency value indicates a slower response.

### 5.5 Example Monitoring Result

```json
{
  "website": "https://google.com",
  "status": 200,
  "availability": 1,
  "latency_ms": 125.5
}
```

The values above are illustrative. Actual response times vary with network conditions.

---

## 6. CloudWatch Monitoring

### 6.1 Custom Metric Namespace

The application publishes custom metrics under:

```text
WSU2026/WebHealth
```

The two monitoring metrics are:

| Metric | Unit | Description |
|---|---|---|
| Availability | Count | Indicates whether a website request succeeded |
| Latency | Milliseconds | Measures website response duration |

The `Website` dimension identifies the monitored URL.

### 6.2 CloudWatch Dashboard

The project includes dashboards for viewing availability and latency.

The original monitoring dashboard is:

```text
WSU2026-WebHealth-Dashboard
```

CDK also creates environment-specific dashboards using the resource prefix:

```text
WSU2026-BetaGamma-WebHealth-Dashboard-CDK
WSU2026-Prod-WebHealth-Dashboard-CDK
```

The CDK dashboard graphs are configured for Google, GitHub and Amazon.

Newly added DynamoDB targets can publish metrics, but the predefined graphs are not automatically extended for each new target.

### 6.3 EventBridge Schedule

Amazon EventBridge invokes the monitoring Lambda every 30 minutes.

```text
rate(30 minutes)
```

In the updated Production configuration, the scheduled invocation uses the Production `live` Lambda alias.

This allows alias changes to affect subsequent scheduled executions.

---

## 7. CloudWatch Alarms

The application defines six website monitoring alarms.

### 7.1 Availability Alarms

- Google Availability Alarm
- GitHub Availability Alarm
- Amazon Availability Alarm

Alarm condition:

```text
Availability < 1
```

Configuration:

| Setting | Value |
|---|---|
| Statistic | Average |
| Period | 30 minutes |
| Evaluation | 1 out of 1 datapoint |
| Missing data | Missing |

### 7.2 Latency Alarms

- Google Latency Alarm
- GitHub Latency Alarm
- Amazon Latency Alarm

Alarm condition:

```text
Latency > 1000 milliseconds
```

Configuration:

| Setting | Value |
|---|---|
| Statistic | Average |
| Period | 30 minutes |
| Evaluation | 1 out of 1 datapoint |
| Missing data | Missing |

### 7.3 Alarm States

CloudWatch alarms can report:

- `OK` – metric is within the configured threshold
- `ALARM` – metric breaches the configured threshold
- `INSUFFICIENT_DATA` – insufficient data is available for evaluation

The website-specific alarms are predefined for the original three websites.

---

## 8. SNS Alarm Notifications

Amazon SNS provides email notifications for website alarms.

The application creates an SNS topic using an environment-specific name.

Example:

```text
WSU2026-Prod-WebHealth-Alarms
```

Notification flow:

```text
CloudWatch Alarm
       |
       v
Amazon SNS
       |
       v
Email Notification
```

SNS email subscriptions must be confirmed by the recipient before notifications can be delivered.

---

## 9. DynamoDB Alarm Logging

The project uses a separate DynamoDB table to store CloudWatch alarm state changes.

Environment-specific examples include:

```text
WSU2026-BetaGamma-WebHealth-AlarmLogs
WSU2026-Prod-WebHealth-AlarmLogs
```

An EventBridge rule detects CloudWatch alarm state-change events and invokes the Alarm Logger Lambda.

The alarm logging component records information including:

- Alarm identifier
- Alarm name
- Alarm state
- Reason
- Timestamp

A simulated alarm event was previously used to verify the alarm logging workflow.

Operational troubleshooting instructions are available in [RUNBOOK.md](RUNBOOK.md).

---

## 10. Applied Project – Web Crawler CRUD API

The Applied Project extends the monitoring application with a public RESTful API for managing websites and webpages to crawl.

The implementation uses:

- Amazon API Gateway
- Python AWS Lambda
- Amazon DynamoDB
- AWS CDK
- Automated tests
- AWS CodePipeline

### 10.1 DynamoDB Target Table

Crawler targets are stored in an environment-specific DynamoDB table.

Examples:

```text
WSU2026-BetaGamma-WebCrawler-Targets
WSU2026-Prod-WebCrawler-Targets
```

Each record contains:

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique target identifier and partition key |
| `url` | String | Website or webpage URL |
| `enabled` | Boolean | Indicates whether the target is enabled |

Example target:

```json
{
  "id": "google",
  "url": "https://google.com",
  "enabled": true
}
```

DynamoDB uses on-demand billing with the `PAY_PER_REQUEST` configuration.

### 10.2 REST API Endpoints

| Method | Endpoint | Operation |
|---|---|---|
| POST | `/targets` | Create a website target |
| GET | `/targets` | Read the target list |
| GET | `/targets/{id}` | Read an individual target |
| PUT | `/targets/{id}` | Update an existing target |
| DELETE | `/targets/{id}` | Delete a target |

API Gateway forwards requests to the CRUD Lambda.

### 10.3 Create Target

```http
POST /targets
```

Example request:

```json
{
  "id": "example",
  "url": "https://example.com",
  "enabled": true
}
```

A successful creation returns HTTP `201 Created`.

Creating a target with an existing identifier returns HTTP `409 Conflict`.

### 10.4 Read All Targets

```http
GET /targets
```

Returns target records from DynamoDB.

The response includes:

```text
count
items
dynamodb_read_ms
```

### 10.5 Read Individual Target

```http
GET /targets/{id}
```

Example:

```http
GET /targets/example
```

A successful request returns the selected target record.

A missing target returns HTTP `404 Not Found`.

### 10.6 Update Target

```http
PUT /targets/{id}
```

Example request:

```json
{
  "url": "https://www.example.com",
  "enabled": false
}
```

The API can update the target URL, enabled state, or both.

The reviewed implementation uses a DynamoDB condition to prevent updates from accidentally creating missing records.

A missing target returns HTTP `404 Not Found`.

### 10.7 Delete Target

```http
DELETE /targets/{id}
```

The API deletes the selected DynamoDB record.

A successful deletion returns HTTP `200 OK`.

A missing record returns HTTP `404 Not Found`.

### 10.8 CRUD HTTP Response Codes

| Code | Meaning |
|---|---|
| 200 | Successful read, update or delete |
| 201 | Target created |
| 400 | Invalid or missing required input |
| 404 | Target not found |
| 405 | Unsupported HTTP method |
| 409 | Target already exists |
| 500 | Internal server error |

Complete API request and response examples are available in [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## 11. DynamoDB Performance Measurement

The CRUD Lambda uses Python's `time.perf_counter()` to measure operation duration.

### 11.1 Read Performance

Read operations return:

```text
dynamodb_read_ms
```

### 11.2 Write Performance

Create, update and delete operations return:

```text
dynamodb_write_ms
```

Example:

```json
{
  "message": "Target created",
  "item": {
    "id": "example",
    "url": "https://example.com",
    "enabled": true
  },
  "dynamodb_write_ms": 25.4
}
```

The reported durations are observations from individual operations, not guaranteed performance thresholds.

---

## 12. API Testing with PowerShell

The following examples demonstrate how to interact with the deployed API.

Use the appropriate environment URL obtained from AWS CloudFormation.

### 12.1 Configure API URL

```powershell
$baseUrl = "https://YOUR-API-ID.execute-api.ap-southeast-2.amazonaws.com/prod"
```

For the BetaGamma environment, obtain the correct endpoint from:

```text
AWS CloudFormation
  -> BetaGamma-WebHealthStack
  -> Outputs
  -> WebCrawlerCrudApiUrl
```

The API Gateway path segment `/prod` is the gateway stage name and does not necessarily indicate the application's Production environment.

### 12.2 Create a Target

```powershell
$body = @{
    id = "demo-example"
    url = "https://example.com"
    enabled = $true
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$baseUrl/targets" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 12.3 Read All Targets

```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/targets" `
    -Method GET
```

### 12.4 Read One Target

```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/targets/demo-example" `
    -Method GET
```

### 12.5 Update a Target

```powershell
$updateBody = @{
    url = "https://www.example.com"
    enabled = $false
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$baseUrl/targets/demo-example" `
    -Method PUT `
    -ContentType "application/json" `
    -Body $updateBody
```

### 12.6 Delete a Target

```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/targets/demo-example" `
    -Method DELETE
```

These examples should be run against an authorised test environment.

---

## 13. Automated Testing

The application uses Jest for CDK infrastructure tests and PyTest for Python functionality.

### 13.1 Unit Tests

Located in:

```text
python-tests/test_unit.py
```

The unit tests cover:

- Website configuration
- Lambda response handling
- Successful and failed website requests
- Availability and latency values
- CloudWatch metric publishing
- CRUD target creation
- CRUD target retrieval
- DynamoDB-backed target selection
- Fallback target behaviour
- Missing-target update handling

External dependencies are mocked where appropriate.

### 13.2 Functional Tests

Located in:

```text
python-tests/test_functional.py
```

The functional tests cover:

- Monitoring result structure
- Website availability and failure scenarios
- CloudWatch publishing behaviour
- HTTP request parameters
- CRUD create-and-read workflow
- DynamoDB timing information

### 13.3 Integration Tests

Located in:

```text
python-tests/test_integration.py
```

The integration tests cover:

- Website HTTP requests
- Monitoring results and metric publishing behaviour
- Deployed API Gateway CRUD operations
- DynamoDB create, read, update and delete operations
- DynamoDB timing response fields

The CRUD integration test uses an environment-supplied API URL.

The API test creates a temporary target and removes it during cleanup.

The first two integration tests execute the monitoring handler locally with test fixtures; the CRUD integration test calls the deployed API.

### 13.4 Latest Verified Test Results

The latest locally verified results are:

| Test category | Number passed |
|---|---:|
| Python unit tests | 15 |
| Python functional tests | 9 |
| Python integration tests | 3 |
| **Total Python tests** | **27** |
| Jest CDK infrastructure tests | 1 |

Latest Python test result:

```text
27 passed in 4.50s
```

The unit and functional test group produced:

```text
24 passed
```

The CDK infrastructure test produced:

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

These are development verification results. The updated deployment requires separate AWS verification.

---

## 14. Running Tests Locally

### 14.1 Install Dependencies

Run from the `hello-lambda-cdk` directory:

```powershell
npm ci
py -m pip install -r requirements-dev.txt
```

Use a supported Node.js version compatible with the installed AWS CDK dependencies. Node.js 20 or newer is required by the project dependencies.

### 14.2 Build TypeScript

```powershell
npm run build
```

### 14.3 Run CDK Infrastructure Tests

```powershell
npm test
```

### 14.4 Run Python Unit Tests

```powershell
py -m pytest python-tests/test_unit.py -v
```

### 14.5 Run Python Functional Tests

```powershell
py -m pytest python-tests/test_functional.py -v
```

### 14.6 Run Python Integration Tests

First configure the endpoint for the intended test environment:

```powershell
$env:API_TARGETS_URL = "https://YOUR-API-ID.execute-api.ap-southeast-2.amazonaws.com/prod/targets"
```

Then run:

```powershell
py -m pytest python-tests/test_integration.py -v
```

### 14.7 Run All Python Tests

```powershell
py -m pytest python-tests -v
```

### 14.8 Synthesize Infrastructure

```powershell
npx cdk synth
```

### 14.9 Inspect Infrastructure Changes

```powershell
npx cdk diff
```

These validation commands do not deploy changes.

---

## 15. CI/CD Pipeline

### 15.1 Pipeline Overview

Pipeline name:

```text
WSU2026-WebHealth-Pipeline
```

Region:

```text
ap-southeast-2
```

Source repository:

```text
Phalrithireach/WSU2026
```

Source branch:

```text
main
```

### 15.2 Pipeline Stages

**Source**

Retrieves application source code from GitHub.

**Build**

Installs dependencies, compiles TypeScript, runs CDK tests and synthesizes CloudFormation.

**UpdatePipeline**

Updates the pipeline itself through CDK self-mutation.

**Assets**

Prepares and publishes assets required for the AWS deployment.

**BetaGamma**

Runs the unit and functional quality gate and deploys the pre-production application.

**Integration Test Blocker**

Runs integration tests using the BetaGamma CRUD API URL supplied from CloudFormation outputs in the updated configuration.

**Manual Production Approval**

Requires an authorised approval before deployment to Production.

**Production**

Deploys the application to the Production CloudFormation stack.

### 15.3 Quality Gates

The pipeline uses automated tests to prevent known failures from proceeding through deployment.

Unit and functional tests are executed before BetaGamma deployment.

Integration tests are executed after BetaGamma deployment and before Production approval.

If a required test command exits unsuccessfully, the relevant pipeline action fails.

### 15.4 Deployment Status

Earlier application versions were successfully deployed to BetaGamma and Production, and the existing API was verified through live integration testing.

The latest project quality-review changes have passed local compilation, testing and synthesis.

Those changes are pending merge and post-deployment verification.

---

## 16. Production Monitoring and Rollback

The project includes additional Production operational monitoring.

### 16.1 Production Lambda Alias

Production uses an alias named:

```text
live
```

The updated EventBridge schedule invokes the alias rather than bypassing it.

### 16.2 Operational Alarms

Production operational alarms include:

```text
Prod-WebHealth-No-Invocations
Prod-WebHealth-High-Duration
Prod-WebHealth-Lambda-Errors
```

These detect missing invocations, high execution duration and Lambda execution errors.

### 16.3 Automatic Rollback Logic

The rollback Lambda is designed to:

1. Receive a qualifying CloudWatch alarm state-change event.
2. Identify the Production Lambda and `live` alias.
3. Retrieve published Lambda versions.
4. Find an earlier published version.
5. Update the alias to that version.

The current implementation selects the highest published version number below the current version. It does not independently verify that the selected previous version is healthy.

The rollback process and scheduled invocation routing must be tested after deployment before being considered fully validated.

---

## 17. Quality Characteristics

The following characteristics explain the application's reliability, security, performance, maintainability and usability.

### 17.1 Functionality

The application supports automated website monitoring and public CRUD operations for crawler targets.

The target list is stored in DynamoDB.

The updated monitoring Lambda can select enabled targets from the database.

HTTP responses and DynamoDB operation durations are returned to API clients.

### 17.2 Reliability

- Automated tests check application behaviour.
- CloudWatch alarms detect monitoring failures.
- EventBridge provides scheduled invocations.
- CI/CD quality gates block failed tests.
- BetaGamma provides a pre-production environment.
- Manual approval controls Production releases.
- Production alias routing supports rollback operations.
- Fallback targets support monitoring when the target database is empty or unavailable.

### 17.3 Performance

- Website response latency is measured in milliseconds.
- DynamoDB read/write durations are measured.
- Lambda provides serverless execution.
- DynamoDB uses on-demand request billing.
- CloudWatch provides metric storage and graphing.

Operation timing depends on workload, network conditions and AWS service response time.

### 17.4 Security

- IAM grants control Lambda permissions.
- The CRUD Lambda has DynamoDB read/write access.
- The monitoring Lambda has DynamoDB read access.
- CloudWatch publishing is controlled through IAM permissions.
- Production deployment requires manual approval.

The API is intentionally public for the coursework demonstration.

Important security limitations:

- API authentication is not enabled.
- API requests require stronger input validation.
- User-supplied URLs should be validated and restricted before use in a real crawler.
- A public crawler can be vulnerable to server-side request forgery (SSRF) if arbitrary URLs are allowed.
- Error responses should avoid exposing internal implementation details.
- API throttling and additional abuse protection should be configured before real-world use.

### 17.5 Maintainability

- AWS CDK defines cloud infrastructure as code.
- TypeScript infrastructure files separate deployment responsibilities.
- Python Lambda files separate monitoring and CRUD logic.
- Automated tests help detect regressions.
- GitHub provides source control.
- GitHub Pull Requests support code review.
- README and API documentation support future maintenance.

### 17.6 Usability

- RESTful endpoints use standard HTTP methods.
- JSON request and response formats are supported.
- API documentation provides examples.
- PowerShell commands can test the API.
- CloudWatch dashboards present monitoring results visually.
- GitHub Project tracks completed work.

### 17.7 Known Limitations

- Dashboard widgets and website alarms are predefined for the original three websites.
- Dynamic website targets do not automatically receive dedicated dashboard widgets or alarms.
- The `GET /targets` CRUD operation currently uses a single DynamoDB scan without full pagination.
- Public API input validation and authentication require further hardening.
- The DynamoDB tables use a `DESTROY` removal policy, which is suitable only for disposable coursework resources.
- Rollback operation requires post-deployment verification.
- Local tests and CDK synthesis do not prove that the latest code is deployed successfully.

---

## 18. GitHub Project Dashboard

Project dashboard:

https://github.com/users/Phalrithireach/projects/1/views/1

The GitHub Project tracks tasks using these statuses:

- Todo
- In Progress
- Done

Tracked work includes:

- Web Health Lambda
- Availability and latency metrics
- CloudWatch dashboard
- CloudWatch alarms
- README documentation
- Operational runbook
- SNS notifications
- DynamoDB alarm logging
- CI/CD implementation
- BetaGamma deployment
- Production deployment
- Automated testing
- DynamoDB crawler target table
- CRUD Lambda functionality
- API Gateway endpoints
- CRUD integration testing
- API documentation

The Applied Project also contains repository-backed GitHub issues associated with the CRUD implementation and testing work.

Project status is maintained in GitHub rather than relying on a fixed count in this README.

---

## 19. Project Structure

```text
WSU2026/
|
+-- hello-lambda-cdk/
    |
    +-- alarm-logger/
    |   +-- index.py
    |
    +-- bin/
    |   +-- hello-lambda-cdk.ts
    |
    +-- lambda/
    |   +-- index.py
    |   +-- crud.py
    |
    +-- lib/
    |   +-- hello-lambda-cdk-stack.ts
    |   +-- web-health-stage.ts
    |   +-- pipeline-stack.ts
    |
    +-- python-tests/
    |   +-- conftest.py
    |   +-- test_unit.py
    |   +-- test_functional.py
    |   +-- test_integration.py
    |
    +-- test/
    |   +-- hello-lambda-cdk.test.ts
    |
    +-- API_DOCUMENTATION.md
    +-- RUNBOOK.md
    +-- README.md
    +-- requirements-dev.txt
    +-- package.json
    +-- package-lock.json
    +-- cdk.json
    +-- tsconfig.json
```

Generated directories such as `node_modules/`, `cdk.out/` and Python caches are not part of the source deliverables.

---

## 20. Weekly Development Progress

### Week 3 – Website Health Monitoring

- Implemented the Web Health Lambda.
- Configured the initial three websites.
- Measured availability and latency.
- Published custom CloudWatch metrics.
- Configured automated EventBridge execution.

### Week 4 – CloudWatch Alarms

- Created availability alarms.
- Created latency alarms.
- Configured thresholds and evaluation periods.
- Verified the alarm configuration.

### Week 5 – Documentation and Project Management

- Improved README documentation.
- Created operational documentation.
- Organised project tasks.
- Maintained source code through GitHub.

### Week 6 – SNS and Alarm Logging

- Integrated Amazon SNS.
- Added email notification functionality.
- Created a DynamoDB alarm log table.
- Implemented an Alarm Logger Lambda.
- Tested the alarm logging workflow.

### Week 7 – Project Verification

- Reviewed the monitoring components.
- Verified configured AWS services.
- Updated project documentation.
- Prepared the application for further development.

### Week 9 – Multi-Stage CI/CD

- Created AWS CodePipeline using CDK.
- Connected the GitHub repository.
- Added build, synthesis and asset publishing stages.
- Created BetaGamma and Production environments.
- Added manual Production approval.

### Week 10 – Automated Testing

- Created Python unit tests.
- Created Python functional tests.
- Created Python integration tests.
- Added automated quality gates.
- Verified BetaGamma and Production pipeline operation.

### Week 11 – Operational Monitoring and Rollback

- Added Production Lambda alias support.
- Added operational CloudWatch alarms.
- Implemented rollback Lambda logic.
- Configured EventBridge alarm-triggered rollback.
- Updated project documentation.

### Applied Project – CRUD API

- Created a DynamoDB target table.
- Implemented CRUD business logic.
- Created API Gateway endpoints.
- Measured DynamoDB read/write time.
- Added CRUD unit, functional and integration tests.
- Integrated testing into CI/CD.
- Created API documentation.
- Created GitHub issues to record completed work.
- Prepared improvements for DynamoDB-driven monitoring and Production alias routing.

---

## 21. Verification Summary

| Requirement | Evidence |
|---|---|
| Website monitoring | Lambda source and monitoring results |
| Availability and latency | CloudWatch custom metrics |
| Dashboard | CloudWatch dashboard |
| Alarm notifications | CloudWatch alarms and SNS |
| Alarm logging | EventBridge, Lambda and DynamoDB |
| CRUD API | API Gateway methods and Python Lambda |
| Database target list | DynamoDB target table |
| Read/write performance | CRUD response timing fields |
| Unit testing | PyTest results |
| Functional testing | PyTest results |
| Integration testing | BetaGamma API test results |
| Infrastructure testing | Jest test results |
| Infrastructure as Code | AWS CDK source |
| Automated deployment | AWS CodePipeline |
| Production approval | Manual approval action |
| Documentation | README, API documentation and runbook |
| Project management | GitHub Project dashboard and issues |

The latest reviewed development branch passed 27 Python tests, one CDK Jest test, the TypeScript build and CDK synthesis.

The updated changes must still be deployed and checked in AWS before final deployment verification is complete.

---

## 22. Documentation

Additional documentation:

- [API Documentation](API_DOCUMENTATION.md) – CRUD endpoints, request bodies, responses and testing examples
- [Operational Runbook](RUNBOOK.md) – Monitoring, troubleshooting and operational procedures
- [GitHub Project Dashboard](https://github.com/users/Phalrithireach/projects/1/views/1) – Project tasks and progress
- [Pull Request #8](https://github.com/Phalrithireach/WSU2026/pull/8) – Applied Project quality improvements under review

---

## 23. Learning Outcomes

Through this project, I learned how to:

- Build a serverless application using AWS Lambda.
- Define cloud infrastructure using AWS CDK.
- Monitor website availability and response latency.
- Publish CloudWatch custom metrics.
- Configure CloudWatch alarms and SNS notifications.
- Use EventBridge for scheduled tasks and event routing.
- Store operational data in DynamoDB.
- Build RESTful APIs using Amazon API Gateway.
- Implement CRUD logic with Python.
- Measure DynamoDB operation performance.
- Write unit, functional and integration tests.
- Automate build and deployment stages through AWS CodePipeline.
- Manage BetaGamma and Production environments.
- Apply CI/CD quality gates and manual approval.
- Implement Lambda alias-based rollback logic.
- Use GitHub for code review, project management and documentation.

---

## 24. Conclusion

The WSU2026 DevOps Web Health Monitoring Project demonstrates the integration of cloud-native monitoring, serverless development, Infrastructure as Code, automated testing and CI/CD.

The Applied Project extends the original monitoring application with a RESTful CRUD API backed by DynamoDB.

The solution provides website availability and latency monitoring, target management, CloudWatch alerting, automated verification and controlled deployment to BetaGamma and Production environments.

The latest improvements focus on ensuring that the monitoring Lambda uses the DynamoDB target list, integration tests validate BetaGamma before Production approval, and Production scheduling correctly uses the Lambda alias.

These improvements have passed local tests and infrastructure synthesis. Final verification will be completed after controlled AWS deployment.

---

**COMP2029 – DevOps | Western Sydney University | Spring 2026**