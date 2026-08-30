# Web Health Monitoring Runbook

## Purpose

This runbook provides basic operational steps for monitoring and troubleshooting the Web Health Monitoring application.

The application checks the availability and latency of:

- Google
- GitHub
- Amazon

The monitoring solution uses AWS Lambda, EventBridge, and Amazon CloudWatch.

---

## Normal Operation

The Lambda function runs every 30 minutes using Amazon EventBridge.

For each website, the Lambda function records:

- Availability
- Latency

Availability values:

- `1` = Website is available
- `0` = Website is unavailable

Latency is measured in milliseconds.

---

## Check CloudWatch Dashboard

1. Sign in to the AWS Management Console.
2. Open **CloudWatch**.
3. Go to **Dashboards**.
4. Open:

`WSU2026-WebHealth-Dashboard`

5. Check the Availability and Latency graphs for Google, GitHub, and Amazon.

---

## Check CloudWatch Alarms

1. Open **CloudWatch**.
2. Go to **Alarms**.
3. Check the status of the six website alarms.

Availability alarms:

- Google-Availability-Alarm
- GitHub-Availability-Alarm
- Amazon-Availability-Alarm

Latency alarms:

- Google-Latency-Alarm
- GitHub-Latency-Alarm
- Amazon-Latency-Alarm

---

## If a Website is Unavailable

If Availability becomes `0`:

1. Check the CloudWatch Availability graph.
2. Check which website is affected.
3. Open the website manually in a browser.
4. Check the Lambda execution logs in CloudWatch Logs.
5. Confirm whether the issue is with the website or the Lambda function.
6. Run the Lambda function manually if further testing is required.

---

## If Latency is High

If latency exceeds the configured threshold:

1. Open the CloudWatch Latency graph.
2. Identify the affected website.
3. Check whether the high latency is temporary or repeated.
4. Test the website manually.
5. Review the Lambda logs for errors or timeouts.
6. Continue monitoring the website until latency returns to normal.

---

## Check Lambda Logs

1. Open the AWS Lambda console.
2. Select the Web Health Lambda function.
3. Open the **Monitor** tab.
4. Open the related CloudWatch logs.
5. Review recent execution results and errors.

---

## Manual Lambda Test

1. Open the Lambda function.
2. Click **Test**.
3. Run the configured test event.
4. Confirm the execution completes successfully.
5. Check CloudWatch Metrics to confirm new Availability and Latency data is published.

---

## Deployment

From the project directory, run:

```bash
npm run build
npx cdk synth
npx cdk deploy
```

---

## Useful AWS Services

- AWS Lambda
- Amazon EventBridge
- Amazon CloudWatch
- AWS CloudFormation
- AWS IAM
- AWS CDK

---

## Escalation

If the monitoring system continues to fail after troubleshooting:

1. Review Lambda errors.
2. Check IAM permissions.
3. Check EventBridge scheduling.
4. Verify CloudWatch metric configuration.
5. Review recent code or infrastructure changes.