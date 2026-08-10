"""Vivid Engineering — production contact form handler (AWS Lambda + SES).

Deploy per backend/SETUP-LAMBDA-SES.md, then point js/contact.js at the
Function URL. Receives the form's JSON POST and emails it to the address in
the TO_ADDRESS environment variable, with Reply-To set to the visitor so
replying in your mail client just works.

Environment variables:
  TO_ADDRESS      where submissions are delivered (must be SES-verified)
  FROM_ADDRESS    SES-verified sender (defaults to TO_ADDRESS)
  ALLOWED_ORIGIN  the site origin allowed to call this function
"""
import json
import os
import re

import boto3

ses = boto3.client("ses")

TO_ADDRESS = os.environ.get("TO_ADDRESS", "joehenderson7@gmail.com")
FROM_ADDRESS = os.environ.get("FROM_ADDRESS", TO_ADDRESS)
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "https://d2t2dn2a26uq4h.cloudfront.net")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
}

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _response(status, body=None):
    out = {"statusCode": status, "headers": CORS_HEADERS}
    if body is not None:
        out["body"] = json.dumps(body)
    return out


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    if method == "OPTIONS":  # CORS preflight
        return _response(204)
    if method != "POST":
        return _response(405, {"ok": False, "error": "method not allowed"})

    try:
        data = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"ok": False, "error": "invalid json"})

    name = str(data.get("name", "")).strip()[:200]
    email = str(data.get("email", "")).strip()[:200]
    topic = str(data.get("topic", "")).strip()[:200]
    message = str(data.get("message", "")).strip()[:5000]

    if not name or not message or not EMAIL_RE.match(email):
        return _response(400, {"ok": False, "error": "invalid input"})

    body_text = (
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Topic: {topic or 'General inquiry'}\n"
        f"Submitted from: {str(data.get('submitted_from', ''))[:500]}\n"
        f"\n{message}\n"
    )

    try:
        ses.send_email(
            Source=FROM_ADDRESS,
            Destination={"ToAddresses": [TO_ADDRESS]},
            ReplyToAddresses=[email],
            Message={
                "Subject": {"Data": f"Website contact: {name} \u2014 {topic or 'General inquiry'}"},
                "Body": {"Text": {"Data": body_text}},
            },
        )
    except Exception:  # noqa: BLE001 — don't leak internals to the caller
        return _response(500, {"ok": False, "error": "send failed"})

    return _response(200, {"ok": True})
