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

@pytest.fixture
def crud_module(monkeypatch):
    """
    Load lambda/crud.py using a mocked DynamoDB table.
    """

    project_root = Path(__file__).resolve().parents[1]
    crud_file = project_root / "lambda" / "crud.py"

    fake_table = MagicMock()
    fake_dynamodb = MagicMock()

    fake_dynamodb.Table.return_value = fake_table

    class ConditionalCheckFailedException(Exception):
        pass

    fake_dynamodb.meta.client.exceptions.ConditionalCheckFailedException = (
        ConditionalCheckFailedException
    )

    fake_boto3 = types.ModuleType("boto3")
    fake_boto3.resource = MagicMock(
        return_value=fake_dynamodb
    )

    monkeypatch.setitem(
        sys.modules,
        "boto3",
        fake_boto3
    )

    monkeypatch.setenv(
        "TABLE_NAME",
        "TestWebCrawlerTargets"
    )

    spec = importlib.util.spec_from_file_location(
        "crud_lambda",
        crud_file
    )

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    return module, fake_table