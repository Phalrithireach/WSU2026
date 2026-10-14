import urllib.request
import time
import json
import boto3
import os

cloudwatch = boto3.client("cloudwatch")

websites = [
    "https://google.com",
    "https://github.com",
    "https://amazon.com"
]


def get_websites():
    """Load enabled crawler targets; preserve original defaults for empty tables."""
    table_name = os.environ.get("TABLE_NAME")
    if not table_name:
        return websites

    table = boto3.resource("dynamodb").Table(table_name)
    urls = []
    total_records = 0
    scan_kwargs = {}
    try:
        while True:
            result = table.scan(**scan_kwargs)
            total_records += len(result.get("Items", []))
            urls.extend(
                item["url"] for item in result.get("Items", [])
                if item.get("enabled", True) is True
                and isinstance(item.get("url"), str)
                and item["url"].startswith(("https://", "http://"))
            )
            last_key = result.get("LastEvaluatedKey")
            if not last_key:
                break
            scan_kwargs["ExclusiveStartKey"] = last_key
    except Exception:
        # Preserve availability monitoring if DynamoDB is temporarily unreachable.
        print("Unable to retrieve crawler targets; using default websites")
        return websites

    return list(dict.fromkeys(urls)) if total_records else websites


def lambda_handler(event, context):
    results = []

    for website in get_websites():
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