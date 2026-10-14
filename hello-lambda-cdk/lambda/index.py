
import urllib.request
import urllib.error
from urllib.parse import urlsplit
import time
import json
import boto3
import os


# ---------------------------------------------------------
# AWS CloudWatch Configuration
# ---------------------------------------------------------

cloudwatch = boto3.client("cloudwatch")

METRIC_NAMESPACE = "WSU2026/WebHealth"


# ---------------------------------------------------------
# Default Websites
# ---------------------------------------------------------

websites = [
    "https://google.com",
    "https://github.com",
    "https://amazon.com"
]


# ---------------------------------------------------------
# Approved Monitoring Domains
# ---------------------------------------------------------

ALLOWED_TARGET_HOSTS = {
    "google.com",
    "www.google.com",
    "github.com",
    "www.github.com",
    "amazon.com",
    "www.amazon.com",
    "example.com",
    "www.example.com",
}


# ---------------------------------------------------------
# URL Security Validation
# ---------------------------------------------------------

def valid_target_url(url):
    """
    Allow only approved HTTPS destinations.

    Reject unsupported protocols, user credentials,
    unapproved hosts, and unexpected ports.
    """

    if not isinstance(url, str):
        return False

    if not url or url != url.strip():
        return False

    if any(ord(char) < 32 for char in url):
        return False

    try:
        parsed = urlsplit(url)

        return (
            parsed.scheme == "https"
            and parsed.hostname in ALLOWED_TARGET_HOSTS
            and parsed.username is None
            and parsed.password is None
            and parsed.port in (None, 443)
        )

    except ValueError:
        return False


# ---------------------------------------------------------
# Safe HTTP Redirect Handler
# ---------------------------------------------------------

class SafeRedirectHandler(urllib.request.HTTPRedirectHandler):
    """
    Follow redirects only when the destination
    is another approved HTTPS URL.

    Unsafe redirects are rejected before the
    next HTTP request is sent.
    """

    def redirect_request(
        self,
        req,
        fp,
        code,
        msg,
        headers,
        newurl
    ):

        if not valid_target_url(newurl):
            raise urllib.error.HTTPError(
                newurl,
                code,
                "Blocked unsafe HTTP redirect",
                headers,
                fp
            )

        return super().redirect_request(
            req,
            fp,
            code,
            msg,
            headers,
            newurl
        )


# Install the restricted redirect handler for this
# isolated monitoring Lambda runtime.
#
# Existing tests mock urllib.request.urlopen,
# so their request mocking remains compatible.

urllib.request.install_opener(
    urllib.request.build_opener(
        SafeRedirectHandler()
    )
)


# ---------------------------------------------------------
# Load Website Targets from DynamoDB
# ---------------------------------------------------------

def get_websites():
    """
    Load enabled and approved website targets
    from DynamoDB.

    Preserve original defaults when no target
    records exist or DynamoDB is unavailable.
    """

    table_name = os.environ.get("TABLE_NAME")

    if not table_name:
        return websites

    urls = []
    total_records = 0
    scan_kwargs = {}

    try:
        table = boto3.resource("dynamodb").Table(
            table_name
        )

        while True:
            result = table.scan(**scan_kwargs)

            items = result.get("Items", [])

            total_records += len(items)

            for item in items:
                url = item.get("url")

                if item.get("enabled", True) is not True:
                    continue

                # Reject unsafe or previously stored
                # unapproved URLs.
                if not valid_target_url(url):
                    print(
                        "Skipping invalid or "
                        "unapproved monitoring target"
                    )
                    continue

                urls.append(url)

            last_key = result.get(
                "LastEvaluatedKey"
            )

            if not last_key:
                break

            scan_kwargs[
                "ExclusiveStartKey"
            ] = last_key

    except Exception as error:
        print(
            "Unable to retrieve crawler targets; "
            "using default websites"
        )

        print(type(error).__name__)

        return websites

    # Remove duplicate URLs while preserving order.
    approved_urls = list(dict.fromkeys(urls))

    # If records exist but none are enabled and
    # approved, return an empty monitoring list.
    # Do not silently override user-disabled targets.
    if total_records:
        return approved_urls

    return websites


# ---------------------------------------------------------
# Website Monitoring Lambda Handler
# ---------------------------------------------------------

def lambda_handler(event, context):
    results = []

    target_websites = get_websites()

    for website in target_websites:
        start = time.time()

        availability = 0

        # -------------------------------------------------
        # Validate URL before any network request
        # -------------------------------------------------

        try:
            if not valid_target_url(website):
                raise ValueError(
                    "Invalid or unapproved monitoring URL"
                )

            # ---------------------------------------------
            # Create HTTP Request
            # ---------------------------------------------

            request = urllib.request.Request(
                website,
                headers={
                    "User-Agent": "Mozilla/5.0"
                }
            )

            # The installed SafeRedirectHandler
            # restricts redirect destinations.
            response = urllib.request.urlopen(
                request,
                timeout=5
            )

            # ---------------------------------------------
            # Calculate Response Latency
            # ---------------------------------------------

            latency = round(
                (time.time() - start) * 1000,
                2
            )

            availability = 1

            # ---------------------------------------------
            # Successful Monitoring Result
            # ---------------------------------------------

            results.append({
                "website": website,
                "status": response.status,
                "availability": availability,
                "latency_ms": latency
            })

            # Release the HTTP response connection.
            if hasattr(response, "close"):
                response.close()

        # -------------------------------------------------
        # Failed Request or Unsafe Redirect
        # -------------------------------------------------

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

        # -------------------------------------------------
        # Publish Custom CloudWatch Metrics
        # -------------------------------------------------

        cloudwatch.put_metric_data(
            Namespace=METRIC_NAMESPACE,
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

    # -----------------------------------------------------
    # Return Monitoring Results
    # -----------------------------------------------------

    return {
        "statusCode": 200,
        "body": json.dumps(results)
    }
