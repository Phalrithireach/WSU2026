from pathlib import Path
import importlib.util
import sys
import types
from unittest.mock import MagicMock

import pytest


@pytest.fixture
def lambda_module(monkeypatch):
    """
    Load lambda/index.py without creating a real AWS CloudWatch client.
    """

    project_root = Path(__file__).resolve().parents[1]
    lambda_file = project_root / "lambda" / "index.py"

    fake_cloudwatch = MagicMock()

    fake_boto3 = types.ModuleType("boto3")
    fake_boto3.client = MagicMock(return_value=fake_cloudwatch)

    monkeypatch.setitem(sys.modules, "boto3", fake_boto3)

    spec = importlib.util.spec_from_file_location(
        "web_health_lambda",
        lambda_file
    )

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module, fake_cloudwatch