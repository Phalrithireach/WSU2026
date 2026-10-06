import json
import types
from unittest.mock import MagicMock


class FakeResponse:
    def __init__(self, status=200):
        self.status = status


def set_fake_time(module, monkeypatch):
    fake_time = types.SimpleNamespace(
        time=MagicMock(
            side_effect=[
                1.0, 1.1,
                2.0, 2.2,
                3.0, 3.3
            ]
        )
    )

    monkeypatch.setattr(module, "time", fake_time)


def test_handler_returns_three_results(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        MagicMock(return_value=FakeResponse(200))
    )

    set_fake_time(module, monkeypatch)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    assert len(body) == 3


def test_results_contain_all_websites(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        MagicMock(return_value=FakeResponse(200))
    )

    set_fake_time(module, monkeypatch)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    websites = [
        result["website"]
        for result in body
    ]

    assert websites == [
        "https://google.com",
        "https://github.com",
        "https://amazon.com"
    ]


def test_all_successful_websites_are_available(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        MagicMock(return_value=FakeResponse(200))
    )

    set_fake_time(module, monkeypatch)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    assert all(
        result["availability"] == 1
        for result in body
    )


def test_single_failed_website_is_detected(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    def fake_urlopen(request, timeout=5):
        if request.full_url == "https://github.com":
            raise Exception("GitHub unavailable")

        return FakeResponse(200)

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        fake_urlopen
    )

    set_fake_time(module, monkeypatch)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    google = body[0]
    github = body[1]
    amazon = body[2]

    assert google["availability"] == 1
    assert github["availability"] == 0
    assert amazon["availability"] == 1


def test_failed_website_contains_error_details(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    def fake_urlopen(request, timeout=5):
        if request.full_url == "https://github.com":
            raise Exception("GitHub unavailable")

        return FakeResponse(200)

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        fake_urlopen
    )

    set_fake_time(module, monkeypatch)

    response = module.lambda_handler({}, None)
    body = json.loads(response["body"])

    github = body[1]

    assert github["status"] == "DOWN"
    assert github["availability"] == 0
    assert "GitHub unavailable" in github["error"]


def test_cloudwatch_called_for_every_website(
    lambda_module,
    monkeypatch
):
    module, fake_cloudwatch = lambda_module

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        MagicMock(return_value=FakeResponse(200))
    )

    set_fake_time(module, monkeypatch)

    module.lambda_handler({}, None)

    assert (
        fake_cloudwatch
        .put_metric_data
        .call_count
        == 3
    )


def test_each_cloudwatch_request_contains_two_metrics(
    lambda_module,
    monkeypatch
):
    module, fake_cloudwatch = lambda_module

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        MagicMock(return_value=FakeResponse(200))
    )

    set_fake_time(module, monkeypatch)

    module.lambda_handler({}, None)

    for call in fake_cloudwatch.put_metric_data.call_args_list:
        metric_data = call.kwargs["MetricData"]

        assert len(metric_data) == 2

        assert (
            metric_data[0]["MetricName"]
            == "Availability"
        )

        assert (
            metric_data[1]["MetricName"]
            == "Latency"
        )


def test_web_requests_use_timeout_and_user_agent(
    lambda_module,
    monkeypatch
):
    module, _ = lambda_module

    captured_requests = []

    def fake_urlopen(request, timeout=5):
        captured_requests.append(
            {
                "request": request,
                "timeout": timeout
            }
        )

        return FakeResponse(200)

    monkeypatch.setattr(
        module.urllib.request,
        "urlopen",
        fake_urlopen
    )

    set_fake_time(module, monkeypatch)

    module.lambda_handler({}, None)

    assert len(captured_requests) == 3

    for captured in captured_requests:
        assert captured["timeout"] == 5

        request = captured["request"]

        assert (
            request.get_header("User-agent")
            == "Mozilla/5.0"
        )