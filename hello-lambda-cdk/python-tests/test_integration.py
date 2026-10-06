import json


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