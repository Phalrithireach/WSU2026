# Web Crawler CRUD API Documentation

## Overview

The Web Crawler CRUD API provides a public REST interface for managing the list of websites used by the web crawler.

The API uses:

- Amazon API Gateway
- AWS Lambda
- Amazon DynamoDB
- AWS CDK

The CRUD Lambda performs Create, Read, Update, and Delete operations against the DynamoDB target table.

---

## Production API

Base URL:

```text
https://wuyes58ng1.execute-api.ap-southeast-2.amazonaws.com/prod
```

Main resource:

```text
/targets
```

---

## Target Object

A crawler target contains:

```json
{
  "id": "google",
  "url": "https://google.com",
  "enabled": true
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `id` | String | Unique identifier for the target |
| `url` | String | Website or webpage to crawl |
| `enabled` | Boolean | Determines whether the target is enabled |

---

# API Operations

## 1. Create Target

### Request

```http
POST /targets
```

Example request body:

```json
{
  "id": "google",
  "url": "https://google.com",
  "enabled": true
}
```

### Success Response

HTTP status:

```text
201 Created
```

Example:

```json
{
  "message": "Target created",
  "item": {
    "id": "google",
    "url": "https://google.com",
    "enabled": true
  },
  "dynamodb_write_ms": 25.4
}
```

`dynamodb_write_ms` records the time required for the DynamoDB write operation.

### Possible Errors

```text
400 - id and url are required
409 - Target already exists
500 - Internal server error
```

---

## 2. Read All Targets

### Request

```http
GET /targets
```

### Success Response

HTTP status:

```text
200 OK
```

Example:

```json
{
  "count": 1,
  "items": [
    {
      "id": "google",
      "url": "https://google.com",
      "enabled": true
    }
  ],
  "dynamodb_read_ms": 15.2
}
```

`dynamodb_read_ms` records the DynamoDB read time.

---

## 3. Read One Target

### Request

```http
GET /targets/{id}
```

Example:

```text
GET /targets/google
```

### Success Response

HTTP status:

```text
200 OK
```

Example:

```json
{
  "item": {
    "id": "google",
    "url": "https://google.com",
    "enabled": true
  },
  "dynamodb_read_ms": 6.0
}
```

### Target Not Found

HTTP status:

```text
404 Not Found
```

Example:

```json
{
  "message": "Target not found",
  "dynamodb_read_ms": 4.2
}
```

---

## 4. Update Target

### Request

```http
PUT /targets/{id}
```

Example:

```text
PUT /targets/google
```

Example request body:

```json
{
  "url": "https://www.google.com",
  "enabled": false
}
```

The request can update `url`, `enabled`, or both.

### Success Response

HTTP status:

```text
200 OK
```

Example:

```json
{
  "message": "Target updated",
  "item": {
    "id": "google",
    "url": "https://www.google.com",
    "enabled": false
  },
  "dynamodb_write_ms": 20.5
}
```

### Invalid Request

If neither `url` nor `enabled` is supplied:

```text
400 Bad Request
```

Example:

```json
{
  "message": "Provide url or enabled to update"
}
```

---

## 5. Delete Target

### Request

```http
DELETE /targets/{id}
```

Example:

```text
DELETE /targets/google
```

### Success Response

HTTP status:

```text
200 OK
```

Example:

```json
{
  "message": "Target deleted",
  "item": {
    "id": "google",
    "url": "https://www.google.com",
    "enabled": false
  },
  "dynamodb_write_ms": 18.7
}
```

### Target Not Found

HTTP status:

```text
404 Not Found
```

Example:

```json
{
  "message": "Target not found",
  "dynamodb_write_ms": 5.1
}
```

---

# PowerShell Examples

## Create

```powershell
$baseUrl = "https://wuyes58ng1.execute-api.ap-southeast-2.amazonaws.com/prod"

$body = @{
    id = "google"
    url = "https://google.com"
    enabled = $true
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$baseUrl/targets" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## Read All

```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/targets" `
    -Method GET
```

## Read One

```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/targets/google" `
    -Method GET
```

## Update

```powershell
$updateBody = @{
    url = "https://www.google.com"
    enabled = $false
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$baseUrl/targets/google" `
    -Method PUT `
    -ContentType "application/json" `
    -Body $updateBody
```

## Delete

```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/targets/google" `
    -Method DELETE
```

---

# DynamoDB Performance Measurement

The CRUD Lambda measures DynamoDB operation time using Python performance timers.

Read operations return:

```text
dynamodb_read_ms
```

Write operations return:

```text
dynamodb_write_ms
```

This allows DynamoDB read and write performance to be tested as required by the Applied Project.

---

# Testing

The CRUD implementation is covered by automated PyTest tests.

```text
Unit tests:        2 CRUD-specific tests
Functional tests:  1 CRUD-specific test
Integration tests: 1 CRUD-specific test
```

The complete Python test suite currently contains:

```text
24 tests
```

Run all tests:

```bash
py -m pytest python-tests -v
```

Expected result:

```text
24 passed
```

---

# CI/CD Integration

The automated tests are integrated with AWS CodePipeline.

Pipeline:

```text
WSU2026-WebHealth-Pipeline
```

Deployment flow:

```text
GitHub
   |
   v
Build / Test
   |
   v
BetaGamma
   |
   v
Integration Tests
   |
   v
Manual Approval
   |
   v
Production
```

Failed automated tests prevent changes from progressing through the deployment pipeline.

---

# Security and Access

The API is intentionally deployed as a public endpoint for the Applied Project.

Current configuration:

```text
Authentication: None
API Key: Not required
CORS: Enabled
```

For a production system containing sensitive data, authentication and authorization should be added before public use.

---

# Architecture

```text
User / Client
      |
      v
Amazon API Gateway
      |
      v
CRUD Lambda
      |
      v
Amazon DynamoDB
```

---

# Summary

The Web Crawler CRUD API provides:

- Create target
- Read all targets
- Read individual target
- Update target
- Delete target
- DynamoDB read-time measurement
- DynamoDB write-time measurement
- Automated unit testing
- Automated functional testing
- Automated integration testing
- CI/CD deployment through BetaGamma and Production