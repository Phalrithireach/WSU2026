
import json
import types
from unittest.mock import MagicMock


# ---------------------------------------------------------
# TEST HELPERS
# ---------------------------------------------------------

class FakeResponse:
    def __init__(self, status=200):
        self.status = status


def run_successful_handler(module, monkeypatch):
    fake_response = FakeResponse(200)

    mock_urlopen = MagicMock(return_value=fake_response)

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        mock_urlopen
    )

    fake_time = types.SimpleNamespace(
        time=MagicMock(
            side_effect=[
                1.0, 1.1,
                2.0, 2.1,
                3.0, 3.1
            ]
        )
    )

    monkeypatch.setattr(module, "time", fake_time)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    return response, body


def run_failed_handler(module, monkeypatch):
    mock_urlopen = MagicMock(
        side_effect=Exception("Network unavailable")
    )

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        mock_urlopen
    )

    fake_time = types.SimpleNamespace(
        time=MagicMock(
            side_effect=[
                1.0, 1.1,
                2.0, 2.1,
                3.0, 3.1
            ]
        )
    )

    monkeypatch.setattr(module, "time", fake_time)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    return response, body


# ---------------------------------------------------------
# UNIT TEST 1
# Verify three websites are configured
# ---------------------------------------------------------

def test_three_websites_are_configured(lambda_module):
    module, _ = lambda_module

    assert len(module.websites) == 3


# ---------------------------------------------------------
# UNIT TEST 2
# Verify Google is configured
# ---------------------------------------------------------

def test_google_is_configured(lambda_module):
    module, _ = lambda_module

    assert "https://google.com" in module.websites


# ---------------------------------------------------------
# UNIT TEST 3
# Verify GitHub is configured
# ---------------------------------------------------------

def test_github_is_configured(lambda_module):
    module, _ = lambda_module

    assert "https://github.com" in module.websites


# ---------------------------------------------------------
# UNIT TEST 4
# Verify Amazon is configured
# ---------------------------------------------------------

def test_amazon_is_configured(lambda_module):
    module, _ = lambda_module

    assert "https://amazon.com" in module.websites


# ---------------------------------------------------------
# UNIT TEST 5
# Successful handler returns HTTP 200
# ---------------------------------------------------------

def test_lambda_handler_returns_200(lambda_module, monkeypatch):
    module, _ = lambda_module

    response, _ = run_successful_handler(
        module,
        monkeypatch
    )

    assert response["statusCode"] == 200


# ---------------------------------------------------------
# UNIT TEST 6
# Successful website has availability = 1
# ---------------------------------------------------------

def test_successful_website_is_available(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    _, body = run_successful_handler(
        module,
        monkeypatch
    )

    assert body[0]["availability"] == 1


# ---------------------------------------------------------
# UNIT TEST 7
# Successful website reports HTTP 200
# ---------------------------------------------------------

def test_successful_website_status_is_200(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    _, body = run_successful_handler(
        module,
        monkeypatch
    )

    assert body[0]["status"] == 200


# ---------------------------------------------------------
# UNIT TEST 8
# Failed website has availability = 0
# ---------------------------------------------------------

def test_failed_website_is_unavailable(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    _, body = run_failed_handler(
        module,
        monkeypatch
    )

    assert body[0]["availability"] == 0


# ---------------------------------------------------------
# UNIT TEST 9
# Failed website reports DOWN and an error
# ---------------------------------------------------------

def test_failed_website_reports_error(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    _, body = run_failed_handler(
        module,
        monkeypatch
    )

    assert body[0]["status"] == "DOWN"
    assert "error" in body[0]
    assert "Network unavailable" in body[0]["error"]


# ---------------------------------------------------------
# UNIT TEST 10
# CloudWatch receives correct metrics
# ---------------------------------------------------------

def test_cloudwatch_metrics_are_published(
    lambda_module,
    monkeypatch
):
    module, fake_cloudwatch = lambda_module

    run_successful_handler(
        module,
        monkeypatch
    )

    assert fake_cloudwatch.put_metric_data.call_count == 3

    first_call = (
        fake_cloudwatch
        .put_metric_data
        .call_args_list[0]
        .kwargs
    )

    assert first_call["Namespace"] == "WSU2026/WebHealth"

    metrics = first_call["MetricData"]

    assert len(metrics) == 2

    availability_metric = metrics[0]
    latency_metric = metrics[1]

    assert availability_metric["MetricName"] == "Availability"
    assert availability_metric["Value"] == 1
    assert availability_metric["Unit"] == "Count"

    assert latency_metric["MetricName"] == "Latency"
    assert latency_metric["Unit"] == "Milliseconds"

    assert availability_metric["Dimensions"] == [
        {
            "Name": "Website",
            "Value": "https://google.com"
        }
    ]


# ---------------------------------------------------------
# UNIT TEST 11
# Verify POST creates a crawler target
# ---------------------------------------------------------

def test_crud_post_creates_target(crud_module):
    module, fake_table = crud_module

    event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "id": "google",
            "url": "https://google.com",
            "enabled": True
        })
    }

    response = module.lambda_handler(event, None)
    body = json.loads(response["body"])

    assert response["statusCode"] == 201
    assert body["message"] == "Target created"
    assert body["item"]["id"] == "google"
    assert body["item"]["url"] == "https://google.com"
    assert "dynamodb_write_ms" in body

    fake_table.put_item.assert_called_once()


# ---------------------------------------------------------
# UNIT TEST 12
# Verify GET returns an individual crawler target
# ---------------------------------------------------------

def test_crud_get_returns_target(crud_module):
    module, fake_table = crud_module

    fake_table.get_item.return_value = {
        "Item": {
            "id": "google",
            "url": "https://google.com",
            "enabled": True
        }
    }

    event = {
        "httpMethod": "GET",
        "pathParameters": {
            "id": "google"
        }
    }

    response = module.lambda_handler(event, None)
    body = json.loads(response["body"])

    assert response["statusCode"] == 200
    assert body["item"]["id"] == "google"
    assert body["item"]["url"] == "https://google.com"
    assert "dynamodb_read_ms" in body

    fake_table.get_item.assert_called_once_with(
        Key={
            "id": "google"
        }
    )


# ---------------------------------------------------------
# UNIT TEST 13
# Monitor loads enabled targets from DynamoDB
# ---------------------------------------------------------

def test_monitor_loads_enabled_targets_from_dynamodb(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    monkeypatch.setenv(
        "TABLE_NAME",
        "TestWebCrawlerTargets"
    )

    table = MagicMock()

    table.scan.return_value = {
        "Items": [
            {
                "id": "example",
                "url": "https://example.com",
                "enabled": True
            },
            {
                "id": "disabled",
                "url": "https://disabled.example",
                "enabled": False
            }
        ]
    }

    module.boto3.resource = MagicMock()
    module.boto3.resource.return_value.Table.return_value = table

    assert module.get_websites() == [
        "https://example.com"
    ]


# ---------------------------------------------------------
# UNIT TEST 14
# Monitor defaults when DynamoDB target table is empty
# ---------------------------------------------------------

def test_monitor_defaults_when_target_table_is_empty(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    monkeypatch.setenv(
        "TABLE_NAME",
        "TestWebCrawlerTargets"
    )

    table = MagicMock()

    table.scan.return_value = {
        "Items": []
    }

    module.boto3.resource = MagicMock()
    module.boto3.resource.return_value.Table.return_value = table

    assert module.get_websites() == module.websites


# ---------------------------------------------------------
# UNIT TEST 15
# PUT returns HTTP 404 if target does not exist
# ---------------------------------------------------------

def test_crud_put_missing_target_returns_404(crud_module):
    module, fake_table = crud_module

    error_type = (
        module.dynamodb.meta.client.exceptions
        .ConditionalCheckFailedException
    )

    fake_table.update_item.side_effect = error_type()

    event = {
        "httpMethod": "PUT",
        "pathParameters": {
            "id": "missing"
        },
        "body": json.dumps({
            "enabled": False
        })
    }

    result = module.lambda_handler(event, None)

    assert result["statusCode"] == 404

    assert (
        json.loads(result["body"])["message"]
        == "Target not found"
    )

    assert (
        fake_table.update_item
        .call_args.kwargs["ConditionExpression"]
        == "attribute_exists(id)"
    )


# ---------------------------------------------------------
# UNIT TEST 16
# Verify URL security validation and enforcement
# ---------------------------------------------------------

def test_crud_url_validation(crud_module):
    module, fake_table = crud_module

    # Approved HTTPS URLs
    approved_urls = [
        "https://google.com",
        "https://github.com",
        "https://amazon.com",
        "https://example.com",
        "https://www.google.com",
        "https://www.github.com",
        "https://www.amazon.com",
        "https://www.example.com"
    ]

    for url in approved_urls:
        assert module.valid_target_url(url), (
            f"Approved URL rejected: {url}"
        )

    # Invalid or unapproved URLs
    invalid_urls = [
        "http://google.com",
        "https://localhost",
        "https://127.0.0.1",
        "https://169.254.169.254",
        "https://evil.com",
        "https://google.com.evil.com",
        "https://google.com:8443",
        "https://evil.com@google.com",
        "ftp://google.com",
        "not-a-url",
        "",
        None,
        123
    ]

    for url in invalid_urls:
        assert not module.valid_target_url(url), (
            f"Invalid URL accepted: {url}"
        )

    # Verify POST rejects unapproved URLs
    post_event = {
        "httpMethod": "POST",
        "body": json.dumps({
            "id": "unsafe-post",
            "url": "https://evil.com",
            "enabled": True
        })
    }

    post_response = module.lambda_handler(
        post_event,
        None
    )

    assert post_response["statusCode"] == 400
    assert (
        json.loads(post_response["body"])["message"]
        == "Invalid or unapproved URL"
    )

    fake_table.put_item.assert_not_called()

    # Verify PUT rejects unapproved URLs
    put_event = {
        "httpMethod": "PUT",
        "pathParameters": {
            "id": "google"
        },
        "body": json.dumps({
            "url": "http://127.0.0.1"
        })
    }

    put_response = module.lambda_handler(
        put_event,
        None
    )

    assert put_response["statusCode"] == 400
    assert (
        json.loads(put_response["body"])["message"]
        == "Invalid or unapproved URL"
    )

    fake_table.update_item.assert_not_called()


# ---------------------------------------------------------
# UNIT TEST 17
# Verify unsafe HTTP redirects are blocked
# ---------------------------------------------------------

def test_unsafe_redirect_is_blocked(lambda_module):
    module, _ = lambda_module

    handler = module.SafeRedirectHandler()

    request = module.urllib.request.Request(
        "https://google.com"
    )

    unsafe_destinations = [
        "http://127.0.0.1/admin",
        "https://localhost/admin",
        "http://169.254.169.254/latest/meta-data/",
        "https://evil.com",
        "https://google.com.evil.com",
        "http://google.com",
    ]

    for destination in unsafe_destinations:
        try:
            handler.redirect_request(
                request,
                None,
                302,
                "Found",
                {},
                destination
            )

        except module.urllib.error.HTTPError as error:
            assert "Blocked unsafe HTTP redirect" in str(error)

        else:
            raise AssertionError(
                f"Unsafe redirect was not blocked: {destination}"
            )
