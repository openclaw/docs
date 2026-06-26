#!/usr/bin/env python3
"""Validate the shared translation provider credentials before locale fan-out.

Definition:
  This script performs the translation workflow provider/key gate. It supports
  the OpenAI provider used by docs-i18n, runs a minimal Responses API probe,
  classifies common credential/model/quota failures, and fails before expensive
  locale matrices are scheduled.

Parameters:
  --provider: Translation provider. Default: OPENCLAW_DOCS_I18N_PROVIDER/openai.
  --model: Model name to validate. Default: OPENCLAW_DOCS_I18N_MODEL.
  --timeout-seconds: HTTP timeout. Default: 30.
  --status-code and --response-file: Test-only inputs for local classification.

Outputs:
  Prints a short success line or failure classification. GITHUB_OUTPUT receives
  provider_preflight=ok and failure_class when available. Exit code is non-zero
  for missing keys, unsupported providers, denied model access, quota/rate-limit
  responses, or unknown API failures.

Examples:
  OPENAI_API_KEY=sk-... OPENCLAW_DOCS_I18N_MODEL=gpt-5.5 python .github/scripts/i18n/provider_preflight.py
  python .github/scripts/i18n/provider_preflight.py --status-code 401 --response-file /tmp/openai-error.json
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from pathlib import Path


OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"


@dataclass(frozen=True)
class ApiResponse:
    status_code: int
    body: str


def append_output(values: dict[str, str]) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        for key, value in values.items():
            fh.write(f"{key}={value}\n")


def parse_error_code(body: str) -> str:
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return ""
    error = data.get("error")
    if isinstance(error, dict):
        code = error.get("code") or error.get("type") or ""
        return str(code)
    return ""


def classify_response(status_code: int, body: str) -> tuple[bool, str, str]:
    code = parse_error_code(body)
    if 200 <= status_code < 300:
        return True, "ok", "provider preflight ok"
    if code == "insufficient_quota":
        return False, "quota_exhausted", "OpenAI reported insufficient quota for the translation key"
    if status_code == 401:
        return False, "invalid_key", "OpenAI rejected the translation API key"
    if status_code == 403:
        return False, "model_access_denied", "OpenAI denied access to the requested translation model"
    if status_code == 404:
        return False, "model_not_found", "OpenAI could not find the requested translation model"
    if status_code == 429:
        return False, "rate_limited", "OpenAI rate-limited the translation preflight"
    if "model" in code and "not" in code:
        return False, "model_not_found", "OpenAI could not find the requested translation model"
    return False, "provider_error", f"OpenAI preflight failed with HTTP {status_code}"


def openai_probe_request(model: str, api_key: str, timeout_seconds: int) -> ApiResponse:
    payload = json.dumps(
        {
            "model": model,
            "input": "Reply with ok.",
            "max_output_tokens": 8,
            "store": False,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        OPENAI_RESPONSES_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:  # noqa: S310 - fixed OpenAI API URL.
            body = response.read().decode("utf-8", errors="replace")
            return ApiResponse(status_code=response.status, body=body)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        return ApiResponse(status_code=exc.code, body=body)
    except urllib.error.URLError as exc:
        raise SystemExit(f"provider_error: OpenAI preflight network failure: {exc}") from exc


def load_test_response(status_code: int | None, response_file: Path | None) -> ApiResponse | None:
    if status_code is None:
        return None
    body = response_file.read_text(encoding="utf-8") if response_file else ""
    return ApiResponse(status_code=status_code, body=body)


def provider_preflight(
    provider: str,
    model: str,
    timeout_seconds: int,
    test_response: ApiResponse | None = None,
) -> str:
    if provider != "openai":
        append_output({"provider_preflight": "failed", "failure_class": "unsupported_provider"})
        raise SystemExit(f"unsupported_provider: {provider}")
    if not model:
        append_output({"provider_preflight": "failed", "failure_class": "missing_model"})
        raise SystemExit("missing_model: OPENCLAW_DOCS_I18N_MODEL is required")

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if test_response is None and not api_key:
        append_output({"provider_preflight": "failed", "failure_class": "missing_key"})
        raise SystemExit("missing_key: OPENAI_API_KEY is required for translation")

    response = test_response or openai_probe_request(model, api_key, timeout_seconds)
    ok, failure_class, message = classify_response(response.status_code, response.body)
    append_output({"provider_preflight": "ok" if ok else "failed", "failure_class": "" if ok else failure_class})
    if not ok:
        raise SystemExit(f"{failure_class}: {message}")
    print(f"provider preflight ok: provider={provider} model={model}")
    return failure_class


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate translation provider credentials before locale fan-out.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Prints a concise provider/key result and writes provider_preflight/failure_class to GITHUB_OUTPUT.

Examples:
  OPENAI_API_KEY=sk-... OPENCLAW_DOCS_I18N_MODEL=gpt-5.5 python .github/scripts/i18n/provider_preflight.py
  python .github/scripts/i18n/provider_preflight.py --status-code 429 --response-file /tmp/error.json
""",
    )
    parser.add_argument("--provider", default=os.environ.get("OPENCLAW_DOCS_I18N_PROVIDER", "openai"))
    parser.add_argument("--model", default=os.environ.get("OPENCLAW_DOCS_I18N_MODEL", ""))
    parser.add_argument("--timeout-seconds", default=30, type=int)
    parser.add_argument("--status-code", type=int, help="Test-only HTTP status to classify instead of calling the provider.")
    parser.add_argument("--response-file", type=Path, help="Test-only provider response body for --status-code.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    test_response = load_test_response(args.status_code, args.response_file)
    provider_preflight(args.provider, args.model, args.timeout_seconds, test_response)


if __name__ == "__main__":
    main()
