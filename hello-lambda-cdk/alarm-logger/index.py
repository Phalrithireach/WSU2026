import os
import boto3

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def lambda_handler(event, context):
    detail = event.get("detail", {})

    alarm_name = detail.get("alarmName", "UnknownAlarm")
    state = detail.get("state", {})
    state_value = state.get("value", "UNKNOWN")
    reason = state.get("reason", "")
    event_time = event.get("time", "")

    table.put_item(
        Item={
            "alarmId": f"{alarm_name}#{event_time}",
            "alarmName": alarm_name,
            "state": state_value,
            "reason": reason,
            "timestamp": event_time,
        }
    )

    return {
        "statusCode": 200,
        "message": "Alarm state change logged",
    }