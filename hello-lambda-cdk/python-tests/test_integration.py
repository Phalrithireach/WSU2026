import json
import urllib.request
import urllib.error


# ---------------------------------------------------------
# INTEGRATION TEST 1
# Run the Web Health Lambda using real HTTP requests
# ---------------------------------------------------------

def test_live_websites_can_be_checked(lambda_module):
    module, _ = lambda_module

    response = module.lambda_handler({}, None)

    assert response["statusCode"] == 200

    body = json.loads(response["body"])

    assert len(body) == 3

    websites = [
        result["website"]
        for result in body
    ]

    assert websites == [
        "https://google.com",
        "https://github.com",
        "https://amazon.com"
    ]

    for result in body:
        assert "website" in result
        assert "status" in result
        assert "availability" in result
        assert "latency_ms" in result

        assert result["availability"] in [0, 1]

        assert result["latency_ms"] >= 0


# ---------------------------------------------------------
# INTEGRATION TEST 2
# Verify live website checks produce CloudWatch metrics
# ---------------------------------------------------------

def test_live_checks_publish_metrics(lambda_module):
    module, fake_cloudwatch = lambda_module

    response = module.lambda_handler({}, None)

    assert response["statusCode"] == 200

    body = json.loads(response["body"])

    assert len(body) == 3

    # One CloudWatch request should be produced
    # for each monitored website.
    assert (
        fake_cloudwatch
        .put_metric_data
        .call_count
        == 3
    )

    calls = fake_cloudwatch.put_metric_data.call_args_list

    expected_websites = [
        "https://google.com",
        "https://github.com",
        "https://amazon.com"
    ]

    for index, call in enumerate(calls):
        arguments = call.kwargs

        assert (
            arguments["Namespace"]
            == "WSU2026/WebHealth"
        )

        metrics = arguments["MetricData"]

        assert len(metrics) == 2

        availability_metric = metrics[0]
        latency_metric = metrics[1]

        assert (
            availability_metric["MetricName"]
            == "Availability"
        )

        assert (
            latency_metric["MetricName"]
            == "Latency"
        )

        assert (
            availability_metric["Dimensions"][0]["Name"]
            == "Website"
        )

        assert (
            availability_metric["Dimensions"][0]["Value"]
            == expected_websites[index]
        )

        assert (
            latency_metric["Dimensions"][0]["Value"]
            == expected_websites[index]
        )

        # ---------------------------------------------------------
# APPLIED PROJECT - CRUD INTEGRATION TEST
# Test real API Gateway -> Lambda -> DynamoDB CRUD flow
# ---------------------------------------------------------

def test_live_crud_api():
    base_url = (
        "https://wuyes58ng1.execute-api."
        "ap-southeast-2.amazonaws.com/prod"
    )

    target_id = "integration-test"
    target_url = f"{base_url}/targets/{target_id}"

    # -----------------------------------------------------
    # CREATE
    # -----------------------------------------------------
    create_data = json.dumps({
        "id": target_id,
        "url": "https://example.com",
        "enabled": True
    }).encode("utf-8")

    create_request = urllib.request.Request(
        f"{base_url}/targets",
        data=create_data,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(
            create_request,
            timeout=10
        ) as response:
            create_body = json.loads(
                response.read().decode("utf-8")
            )

        assert create_body["message"] == "Target created"
        assert create_body["item"]["id"] == target_id
        assert "dynamodb_write_ms" in create_body

        # -------------------------------------------------
        # READ
        # -------------------------------------------------
        with urllib.request.urlopen(
            target_url,
            timeout=10
        ) as response:
            read_body = json.loads(
                response.read().decode("utf-8")
            )

        assert read_body["item"]["id"] == target_id
        assert (
            read_body["item"]["url"]
            == "https://example.com"
        )
        assert "dynamodb_read_ms" in read_body

        # -------------------------------------------------
        # UPDATE
        # -------------------------------------------------
        update_data = json.dumps({
            "url": "https://www.example.com",
            "enabled": False
        }).encode("utf-8")

        update_request = urllib.request.Request(
            target_url,
            data=update_data,
            headers={
                "Content-Type": "application/json"
            },
            method="PUT"
        )

        with urllib.request.urlopen(
            update_request,
            timeout=10
        ) as response:
            update_body = json.loads(
                response.read().decode("utf-8")
            )

        assert update_body["message"] == "Target updated"
        assert update_body["item"]["enabled"] is False
        assert "dynamodb_write_ms" in update_body

    finally:
        # -------------------------------------------------
        # DELETE
        # Always clean up the integration-test record
        # -------------------------------------------------
        delete_request = urllib.request.Request(
            target_url,
            method="DELETE"
        )

        try:
            with urllib.request.urlopen(
                delete_request,
                timeout=10
            ) as response:
                delete_body = json.loads(
                    response.read().decode("utf-8")
                )

            assert delete_body["message"] == "Target deleted"
            assert "dynamodb_write_ms" in delete_body

        except urllib.error.HTTPError as error:
            # Ignore 404 if creation failed before the item existed
            if error.code != 404:
                raise