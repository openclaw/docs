#!/usr/bin/env python3
"""Dispatch R2 Pages and wait for the upload result.

Definition:
  This script is the translation workflow deploy gate. It starts the R2 Pages
  workflow through GitHub CLI and waits for the dispatched run to finish so a
  translation canary proves content upload, not just workflow scheduling.

Parameters:
  --workflow: Workflow file to dispatch. Default: r2-pages.yml.
  --ref: Git ref to dispatch. Default: main.
  --repo: GitHub repository. Default: GITHUB_REPOSITORY.
  --artifact-scope: R2 artifact scope input. Default: full.
  --locale: Locale code for locale/page scoped uploads.
  --page-path: Locale-relative page route for page scoped uploads.
  --force-upload: Force R2 object audit/upload input. Default: true.
  --live-url: Optional live URL to verify after upload.
  --expect-h1: Expected h1 text for live URL verification.
  --timeout-seconds: Maximum wait. Default: 3600.
  --poll-seconds: Poll interval. Default: 10.

Outputs:
  Prints the dispatched run URL, final conclusion, and optional live smoke
  status. Exits non-zero when the workflow cannot be dispatched, cannot be
  found, times out, finishes with a non-success conclusion, or the live smoke
  check does not converge.

Examples:
  GH_TOKEN=... GITHUB_REPOSITORY=openclaw/docs python .github/scripts/i18n/dispatch_r2_pages.py
  python .github/scripts/i18n/dispatch_r2_pages.py --repo openclaw/docs --ref main --timeout-seconds 1800
  python .github/scripts/i18n/dispatch_r2_pages.py --artifact-scope page --locale zh-CN --page-path channels/line --no-force-upload
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
from datetime import UTC, datetime


RUN_URL_RE = re.compile(r"/actions/runs/([0-9]+)")
H1_RE = re.compile(r"<h1\b[^>]*>(.*?)</h1>", re.I | re.S)


def run(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(args, check=False, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or f"{' '.join(args)} failed"
        raise SystemExit(detail)
    return result


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def parse_run_id(output: str) -> str:
    match = RUN_URL_RE.search(output)
    return match.group(1) if match else ""


def dispatch(
    workflow: str,
    ref: str,
    repo: str,
    artifact_scope: str,
    force_upload: bool,
    locale: str = "",
    page_path: str = "",
) -> str:
    command = [
        "gh",
        "workflow",
        "run",
        workflow,
        "--repo",
        repo,
        "--ref",
        ref,
        "-f",
        f"artifact_scope={artifact_scope}",
        "-f",
        f"force_upload={'true' if force_upload else 'false'}",
    ]
    if locale:
        command.extend(["-f", f"locale={locale}"])
    if page_path:
        command.extend(["-f", f"page_path={page_path}"])
    result = run(command)
    output = "\n".join(part for part in [result.stdout.strip(), result.stderr.strip()] if part)
    if output:
        print(output)
    return parse_run_id(output)


def list_workflow_dispatch_runs(workflow: str, ref: str, repo: str) -> list[dict]:
    result = run(
        [
            "gh",
            "run",
            "list",
            "--repo",
            repo,
            "--workflow",
            workflow,
            "--branch",
            ref,
            "--event",
            "workflow_dispatch",
            "--json",
            "databaseId,createdAt,status,url",
            "--limit",
            "20",
        ]
    )
    return json.loads(result.stdout or "[]")


def find_dispatched_run(workflow: str, ref: str, repo: str, started_at: datetime, known_run_ids: set[str]) -> str:
    cutoff = started_at.replace(microsecond=0)
    for _ in range(12):
        runs = list_workflow_dispatch_runs(workflow, ref, repo)
        recent = [
            item
            for item in runs
            if str(item["databaseId"]) not in known_run_ids and parse_time(item["createdAt"]) >= cutoff
        ]
        if len(recent) == 1:
            run_id = str(recent[0]["databaseId"])
            print(f"Resolved R2 Pages run: {recent[0].get('url') or run_id}")
            return run_id
        if len(recent) > 1:
            urls = ", ".join(str(item.get("url") or item["databaseId"]) for item in recent)
            raise SystemExit(f"ambiguous dispatched R2 Pages run candidates: {urls}")
        time.sleep(5)
    raise SystemExit("could not resolve dispatched R2 Pages run")


def find_recent_run(workflow: str, ref: str, repo: str, started_at: datetime) -> str:
    """Backward-compatible wrapper for tests and one-off callers."""
    return find_dispatched_run(workflow, ref, repo, started_at, set())


def known_workflow_dispatch_run_ids(workflow: str, ref: str, repo: str) -> set[str]:
    try:
        return {str(item["databaseId"]) for item in list_workflow_dispatch_runs(workflow, ref, repo)}
    except SystemExit:
        raise
    except Exception as exc:
        raise SystemExit(f"could not list existing R2 Pages runs before dispatch: {exc}") from exc


def wait_for_run(repo: str, run_id: str, timeout_seconds: int, poll_seconds: int) -> None:
    deadline = time.monotonic() + timeout_seconds
    while True:
        result = run(["gh", "run", "view", run_id, "--repo", repo, "--json", "status,conclusion,url"])
        data = json.loads(result.stdout)
        status = data.get("status")
        conclusion = data.get("conclusion") or ""
        url = data.get("url") or run_id
        print(f"R2 Pages run {run_id}: status={status} conclusion={conclusion} url={url}")
        if status == "completed":
            if conclusion == "success":
                return
            raise SystemExit(f"R2 Pages run {run_id} finished with conclusion={conclusion}")
        if time.monotonic() >= deadline:
            raise SystemExit(f"timed out waiting for R2 Pages run {run_id}")
        time.sleep(poll_seconds)


def extract_h1(document: str) -> str:
    match = H1_RE.search(document)
    if not match:
        return ""
    text = re.sub(r"<[^>]+>", "", match.group(1))
    return " ".join(html.unescape(text).split())


def fetch_text(url: str, timeout_seconds: int = 30) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "openclaw-docs-i18n-canary/1.0"})
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:  # noqa: S310 - workflow-provided HTTPS URL.
        return response.read().decode("utf-8", errors="replace")


def verify_live_h1(url: str, expected_h1: str, timeout_seconds: int, poll_seconds: int) -> None:
    if not url and not expected_h1:
        return
    if not url or not expected_h1:
        raise SystemExit("live smoke requires both --live-url and --expect-h1")
    deadline = time.monotonic() + timeout_seconds
    cache_buster = int(time.time())
    separator = "&" if "?" in url else "?"
    smoke_url = f"{url}{separator}_openclaw_i18n_canary={cache_buster}"
    last_h1 = ""
    while True:
        try:
            last_h1 = extract_h1(fetch_text(smoke_url))
            print(f"Live canary h1: {last_h1!r} from {smoke_url}")
            if last_h1 == expected_h1:
                return
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"Live canary fetch failed: {exc}")
        if time.monotonic() >= deadline:
            raise SystemExit(f"live canary h1 did not become {expected_h1!r}; last h1 was {last_h1!r}")
        time.sleep(poll_seconds)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Dispatch R2 Pages and wait for the upload result.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Prints the dispatched R2 Pages run and exits non-zero unless it completes successfully.
  When --live-url and --expect-h1 are provided, also verifies the live page h1.

Examples:
  GH_TOKEN=... GITHUB_REPOSITORY=openclaw/docs python .github/scripts/i18n/dispatch_r2_pages.py
  python .github/scripts/i18n/dispatch_r2_pages.py --repo openclaw/docs --ref main --timeout-seconds 1800
  python .github/scripts/i18n/dispatch_r2_pages.py --artifact-scope locale --locale ja-JP --no-force-upload
  python .github/scripts/i18n/dispatch_r2_pages.py --live-url https://docs.openclaw.ai/zh-CN/channels/line --expect-h1 LINE
""",
    )
    parser.add_argument("--workflow", default="r2-pages.yml")
    parser.add_argument("--ref", default="main")
    parser.add_argument("--repo", default=os.environ.get("GITHUB_REPOSITORY", ""))
    parser.add_argument("--artifact-scope", default="full")
    parser.add_argument("--locale", default="")
    parser.add_argument("--page-path", default="")
    parser.add_argument("--force-upload", default=True, action=argparse.BooleanOptionalAction)
    parser.add_argument("--live-url", default="")
    parser.add_argument("--expect-h1", default="")
    parser.add_argument("--timeout-seconds", default=3600, type=int)
    parser.add_argument("--poll-seconds", default=10, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.repo:
        raise SystemExit("missing repository: pass --repo or set GITHUB_REPOSITORY")
    if args.timeout_seconds < 1:
        raise SystemExit("timeout-seconds must be >= 1")
    if args.poll_seconds < 1:
        raise SystemExit("poll-seconds must be >= 1")

    # GitHub's dispatch API can omit the new run URL; snapshot first so fallback
    # resolution cannot attach this deploy gate to a pre-existing R2 run.
    known_run_ids = known_workflow_dispatch_run_ids(args.workflow, args.ref, args.repo)
    started_at = datetime.now(UTC)
    run_id = dispatch(
        args.workflow,
        args.ref,
        args.repo,
        args.artifact_scope,
        args.force_upload,
        args.locale,
        args.page_path,
    )
    if not run_id:
        run_id = find_dispatched_run(args.workflow, args.ref, args.repo, started_at, known_run_ids)
    wait_for_run(args.repo, run_id, args.timeout_seconds, args.poll_seconds)
    verify_live_h1(args.live_url, args.expect_h1, args.timeout_seconds, args.poll_seconds)


if __name__ == "__main__":
    main()
