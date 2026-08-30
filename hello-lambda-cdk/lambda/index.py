import urllib.request
import time
import json
import boto3

cloudwatch = boto3.client("cloudwatch")

websites = [
    "https://google.com",
    "https://github.com",
    "https://amazon.com"
]


def lambda_handler(event, context):
    results = []

    for website in websites:
        start = time.time()

        try:
            request = urllib.request.Request(
                website,
                headers={"User-Agent": "Mozilla/5.0"}
            )

            response = urllib.request.urlopen(
                request,
                timeout=5
            )

            latency = round(
                (time.time() - start) * 1000,
                2
            )

            availability = 1

            results.append({
                "website": website,
                "status": response.status,
                "availability": availability,
                "latency_ms": latency
            })

        except Exception as error:
            latency = round(
                (time.time() - start) * 1000,
                2
            )

            availability = 0

            results.append({
                "website": website,
                "status": "DOWN",
                "availability": availability,
                "latency_ms": latency,
                "error": str(error)
            })

        cloudwatch.put_metric_data(
            Namespace="WSU2026/WebHealth",
            MetricData=[
                {
                    "MetricName": "Availability",
                    "Dimensions": [
                        {
                            "Name": "Website",
                            "Value": website
                        }
                    ],
                    "Value": availability,
                    "Unit": "Count"
                },
                {
                    "MetricName": "Latency",
                    "Dimensions": [
                        {
                            "Name": "Website",
                            "Value": website
                        }
                    ],
                    "Value": latency,
                    "Unit": "Milliseconds"
                }
            ]
        )

    return {
        "statusCode": 200,
        "body": json.dumps(results)
    }