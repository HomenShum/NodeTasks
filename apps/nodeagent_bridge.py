"""Bounded optional HTTP bridge for the trusted local NodeTasks app."""

import ipaddress
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from http.client import HTTPException
from typing import Any, NamedTuple

MAX_PROMPT_CHARS = 4096
MAX_REQUEST_BYTES = 128 * 1024
MAX_RESPONSE_BYTES = 64 * 1024


class BridgeResult(NamedTuple):
    answer: str | None = None
    error: str | None = None


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _validate_endpoint(endpoint: str) -> None:
    if any(char.isspace() or ord(char) < 32 or ord(char) == 127 for char in endpoint):
        raise ValueError("Whitespace or control character in endpoint")
    url = urllib.parse.urlsplit(endpoint)
    if (url.scheme not in {"http", "https"} or not url.hostname or url.username is not None
            or url.password is not None or "#" in endpoint or url.netloc.endswith(":")):
        raise ValueError("Expected a direct HTTP(S) URL without credentials or fragment")
    if url.port is not None and not 1 <= url.port <= 65535:
        raise ValueError("Invalid port")
    if ":" in url.hostname:
        if not re.fullmatch(r"\[[^\]]+\](?::[0-9]+)?", url.netloc):
            raise ValueError("Invalid bracketed host")
        ipaddress.IPv6Address(url.hostname)
    else:
        host = url.hostname.encode("idna").decode("ascii").removesuffix(".")
        if len(host) > 253 or any(not re.fullmatch(r"[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?", label)
                                  for label in host.split(".")):
            raise ValueError("Invalid host")


def _reject_nonfinite(value: str) -> None:
    raise ValueError(f"Non-JSON number: {value}")


def call_nodeagent(endpoint: str, question: str, context: list[dict[str, Any]],
                   persona: str, view: str) -> BridgeResult:
    if not endpoint:
        return BridgeResult()
    if len(question) > MAX_PROMPT_CHARS:
        return BridgeResult(error="Question exceeds 4,096 characters.")
    try:
        _validate_endpoint(endpoint)
    except (ValueError, UnicodeError):
        return BridgeResult(error="Use a direct HTTP(S) endpoint with a valid host and port, without credentials or fragments.")

    try:
        body = json.dumps({
            "schema": "nodetasks-nodeagent-bridge-v1",
            "mode": "catalog_qa",
            "question": question,
            "message": question,
            "persona": persona,
            "savedView": view,
            "catalogContext": context,
            "context": context,
            "responseContract": {
                "answerField": "answer",
                "mustCiteTaskIds": True,
                "mustPreserveScoreBoundary": True,
            },
        }, allow_nan=False, ensure_ascii=False).encode("utf-8")
    except (TypeError, ValueError, UnicodeError, RecursionError):
        return BridgeResult(error="Catalog request could not be encoded as strict JSON.")
    if len(body) > MAX_REQUEST_BYTES:
        return BridgeResult(error="Catalog request exceeds 128 KiB.")

    request = urllib.request.Request(endpoint, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.build_opener(_NoRedirect()).open(request, timeout=20) as response:
            raw = response.read(MAX_RESPONSE_BYTES + 1)
    except urllib.error.HTTPError as exc:
        exc.close()
        return BridgeResult(error=f"Endpoint returned HTTP {exc.code}; redirects are not followed.")
    except (OSError, HTTPException, ValueError, UnicodeError):
        return BridgeResult(error="Endpoint could not complete the request (connection, timeout, or protocol failure).")
    if len(raw) > MAX_RESPONSE_BYTES:
        return BridgeResult(error="Endpoint response exceeds 64 KiB.")
    try:
        payload = json.loads(raw.decode("utf-8"), parse_constant=_reject_nonfinite)
    except (ValueError, UnicodeError, RecursionError):
        return BridgeResult(error="Endpoint response is not valid UTF-8 JSON.")
    if isinstance(payload, dict):
        message = payload.get("message")
        candidates = [message.get("content") if isinstance(message, dict) else None,
                      payload.get("answer"), payload.get("text"), payload.get("finalText")]
        for answer in candidates:
            if isinstance(answer, str) and answer.strip():
                try:
                    answer.encode("utf-8")
                except UnicodeEncodeError:
                    return BridgeResult(error="Endpoint answer is not valid Unicode text.")
                return BridgeResult(answer=answer)
    return BridgeResult(error="Endpoint did not return a nonempty answer, text, finalText, or message.content string.")
