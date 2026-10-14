
import os
import json
import time
import boto3
from urllib.parse import urlsplit


# --------------------------------------------------
# DynamoDB Configuration
# --------------------------------------------------

dynamodb = boto3.resource("dynamodb")

TABLE_NAME = os.environ.get("TABLE_NAME")
table = dynamodb.Table(TABLE_NAME)


# --------------------------------------------------
# API Response Helper
# --------------------------------------------------

def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body)
    }


# --------------------------------------------------
# Approved Website Domains
# --------------------------------------------------

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


# --------------------------------------------------
# URL Validation
# --------------------------------------------------

def valid_target_url(url):
    if not isinstance(url, str):
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


# --------------------------------------------------
# Main AWS Lambda Handler
# --------------------------------------------------

def lambda_handler(event, context):
    method = event.get("httpMethod", "")
    path_parameters = event.get("pathParameters") or {}
    target_id = path_parameters.get("id")

    try:

        # --------------------------------------------------
        # CREATE - POST /targets
        # --------------------------------------------------

        if method == "POST":
            body = json.loads(event.get("body") or "{}")

            target_id = body.get("id")
            url = body.get("url")
            enabled = body.get("enabled", True)

            if not target_id or not url:
                return response(
                    400,
                    {
                        "message": "id and url are required"
                    }
                )

            # Validate URL before saving to DynamoDB
            if not valid_target_url(url):
                return response(
                    400,
                    {
                        "message": "Invalid or unapproved URL"
                    }
                )

            item = {
                "id": target_id,
                "url": url,
                "enabled": enabled
            }

            start = time.perf_counter()

            table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(id)"
            )

            dynamodb_ms = round(
                (time.perf_counter() - start) * 1000,
                2
            )

            return response(
                201,
                {
                    "message": "Target created",
                    "item": item,
                    "dynamodb_write_ms": dynamodb_ms
                }
            )

        # --------------------------------------------------
        # READ ONE - GET /targets/{id}
        # --------------------------------------------------

        if method == "GET" and target_id:
            start = time.perf_counter()

            result = table.get_item(
                Key={
                    "id": target_id
                }
            )

            dynamodb_ms = round(
                (time.perf_counter() - start) * 1000,
                2
            )

            item = result.get("Item")

            if not item:
                return response(
                    404,
                    {
                        "message": "Target not found",
                        "dynamodb_read_ms": dynamodb_ms
                    }
                )

            return response(
                200,
                {
                    "item": item,
                    "dynamodb_read_ms": dynamodb_ms
                }
            )

        # --------------------------------------------------
        # READ ALL - GET /targets
        # --------------------------------------------------

        if method == "GET":
            start = time.perf_counter()

            result = table.scan()

            dynamodb_ms = round(
                (time.perf_counter() - start) * 1000,
                2
            )

            return response(
                200,
                {
                    "count": result.get("Count", 0),
                    "items": result.get("Items", []),
                    "dynamodb_read_ms": dynamodb_ms
                }
            )

        # --------------------------------------------------
        # UPDATE - PUT /targets/{id}
        # --------------------------------------------------

        if method == "PUT":
            if not target_id:
                return response(
                    400,
                    {
                        "message": "Target id is required"
                    }
                )

            body = json.loads(event.get("body") or "{}")

            url = body.get("url")
            enabled = body.get("enabled")

            # Validate URL only when it is being updated
            if url is not None and not valid_target_url(url):
                return response(
                    400,
                    {
                        "message": "Invalid or unapproved URL"
                    }
                )

            if url is None and enabled is None:
                return response(
                    400,
                    {
                        "message": "Provide url or enabled to update"
                    }
                )

            update_parts = []
            expression_values = {}
            expression_names = {}

            if url is not None:
                update_parts.append("#url = :url")
                expression_names["#url"] = "url"
                expression_values[":url"] = url

            if enabled is not None:
                update_parts.append("#enabled = :enabled")
                expression_names["#enabled"] = "enabled"
                expression_values[":enabled"] = enabled

            start = time.perf_counter()

            try:
                result = table.update_item(
                    Key={
                        "id": target_id
                    },
                    UpdateExpression="SET " + ", ".join(update_parts),
                    ExpressionAttributeNames=expression_names,
                    ExpressionAttributeValues=expression_values,
                    ConditionExpression="attribute_exists(id)",
                    ReturnValues="ALL_NEW"
                )

            except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
                return response(
                    404,
                    {
                        "message": "Target not found"
                    }
                )

            dynamodb_ms = round(
                (time.perf_counter() - start) * 1000,
                2
            )

            return response(
                200,
                {
                    "message": "Target updated",
                    "item": result.get("Attributes", {}),
                    "dynamodb_write_ms": dynamodb_ms
                }
            )

        # --------------------------------------------------
        # DELETE - DELETE /targets/{id}
        # --------------------------------------------------

        if method == "DELETE":
            if not target_id:
                return response(
                    400,
                    {
                        "message": "Target id is required"
                    }
                )

            start = time.perf_counter()

            result = table.delete_item(
                Key={
                    "id": target_id
                },
                ReturnValues="ALL_OLD"
            )

            dynamodb_ms = round(
                (time.perf_counter() - start) * 1000,
                2
            )

            deleted_item = result.get("Attributes")

            if not deleted_item:
                return response(
                    404,
                    {
                        "message": "Target not found",
                        "dynamodb_write_ms": dynamodb_ms
                    }
                )

            return response(
                200,
                {
                    "message": "Target deleted",
                    "item": deleted_item,
                    "dynamodb_write_ms": dynamodb_ms
                }
            )

        # --------------------------------------------------
        # Unsupported HTTP Method
        # --------------------------------------------------

        return response(
            405,
            {
                "message": "Method not allowed"
            }
        )

    # --------------------------------------------------
    # Handle Duplicate Target Creation
    # --------------------------------------------------

    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        return response(
            409,
            {
                "message": "Target already exists"
            }
        )

    # --------------------------------------------------
    # Handle Unexpected Errors
    # --------------------------------------------------

    except Exception as error:
        print(str(error))

        return response(
            500,
            {
                "message": "Internal server error"
            }
        )
