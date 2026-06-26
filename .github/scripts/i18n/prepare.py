#!/usr/bin/env python3
"""Prepare translation workflow source selection outputs.

Definition:
  This script mirrors the debounce and source-selection shell block used by
  Translate Incremental and Translate Full. It reads origin/main, waits for an
  optional cooldown window, validates .openclaw-sync/source.json, and writes the
  same GitHub output fields consumed by downstream jobs.

Parameters:
  --mode: Translation lane, either incremental or full.
  --title: Summary heading to write to GITHUB_STEP_SUMMARY.

Environment:
  EVENT_NAME, BEFORE_SHA, REQUESTED_COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS,
  DEFAULT_MAX_WAIT_SECONDS, GITHUB_OUTPUT, and GITHUB_STEP_SUMMARY match the
  variables provided by the workflow.

Outputs:
  GITHUB_OUTPUT receives mode, publish_ref, should_translate, source_repository,
  and source_sha. GITHUB_STEP_SUMMARY receives a short workflow summary.

Examples:
  EVENT_NAME=workflow_dispatch python .github/scripts/i18n/prepare.py --mode incremental --title "Translate Incremental"
  EVENT_NAME=repository_dispatch python .github/scripts/i18n/prepare.py --mode full --title "Translate Full"
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path


LOCALES = {
    "ar",
    "de",
    "es",
    "fa",
    "fr",
    "id",
    "it",
    "ja-JP",
    "ko",
    "nl",
    "pl",
    "pt-BR",
    "th",
    "tr",
    "uk",
    "vi",
    "zh-CN",
    "zh-TW",
}


@dataclass(frozen=True)
class MainState:
    publish_ref: str
    source_repository: str
    source_sha: str


def run_git(args: list[str], check: bool = True) -> str:
    result = subprocess.run(["git", *args], text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and result.returncode != 0:
        raise SystemExit(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def validate_seconds(value: str, label: str) -> int:
    if not value or not re.fullmatch(r"[0-9]+", value):
        raise SystemExit(f"Invalid {label}: {value}")
    return int(value)


def read_main_state() -> MainState:
    run_git(["fetch", "--quiet", "origin", "main:refs/remotes/origin/main"])
    publish_ref = run_git(["rev-parse", "refs/remotes/origin/main"]).strip()
    source_json = run_git(["show", "refs/remotes/origin/main:.openclaw-sync/source.json"])
    try:
        data = json.loads(source_json)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid .openclaw-sync/source.json on origin/main: {exc}") from exc
    source_repository = data.get("repository") or ""
    source_sha = data.get("sha") or ""
    if not source_repository or not source_sha:
        raise SystemExit("Invalid .openclaw-sync/source.json on origin/main")
    return MainState(publish_ref=publish_ref, source_repository=source_repository, source_sha=source_sha)


def is_translatable_doc_path(path: str) -> bool:
    if not path.startswith("docs/"):
        return False
    rel = path[len("docs/") :]
    first = rel.split("/", 1)[0]
    if first in LOCALES:
        return False
    if rel.startswith(".generated/") or rel.startswith(".i18n/"):
        return False
    return rel.lower().endswith((".md", ".mdx"))


def incremental_should_translate(before_sha: str, publish_ref: str) -> bool:
    diff = subprocess.run(
        ["git", "diff", "--name-only", before_sha, publish_ref],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    changed_paths = [line.strip() for line in diff.stdout.splitlines() if line.strip()]
    if any(re.match(r"^docs/\.i18n/glossary\..*\.json$", path) for path in changed_paths):
        print("Glossary changed; full lane owns this translation.")
        return False
    if not any(is_translatable_doc_path(path) for path in changed_paths):
        print("No translatable docs changed after cooldown; skipping translation matrix.")
        return False
    return True


def append_github_output(values: dict[str, str]) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        for key, value in values.items():
            fh.write(f"{key}={value}\n")


def append_summary(title: str, mode: str, state: MainState, cooldown: int, should_translate: bool) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary:
        return
    with Path(summary).open("a", encoding="utf-8") as fh:
        fh.write(f"### {title}\n\n")
        fh.write(f"- mode: `{mode}`\n")
        fh.write(f"- publish ref: `{state.publish_ref}`\n")
        fh.write(f"- source: `{state.source_repository}@{state.source_sha}`\n")
        fh.write(f"- cooldown seconds: `{cooldown}`\n")
        fh.write(f"- should translate: `{'true' if should_translate else 'false'}`\n")


def default_cooldown(mode: str, event_name: str, requested: str, default: str) -> str:
    if requested:
        return requested
    if mode == "incremental" and event_name == "push":
        return default
    if mode == "full" and event_name in {"push", "repository_dispatch"}:
        return default
    return "0"


def sleep_with_heartbeat(seconds: int) -> None:
    remaining = seconds
    while remaining > 0:
        chunk = min(remaining, 60)
        time.sleep(chunk)
        remaining -= chunk
        if remaining > 0:
            print(f"Still debouncing docs main; {remaining}s remaining.")


def prepare(mode: str, title: str) -> dict[str, str]:
    event_name = os.environ.get("EVENT_NAME", "")
    before_sha = os.environ.get("BEFORE_SHA", "")
    cooldown = validate_seconds(
        default_cooldown(
            mode,
            event_name,
            os.environ.get("REQUESTED_COOLDOWN_SECONDS", ""),
            os.environ.get("DEFAULT_COOLDOWN_SECONDS", "3600"),
        ),
        "cooldown_seconds",
    )
    max_wait = validate_seconds(os.environ.get("DEFAULT_MAX_WAIT_SECONDS", "3600"), "OPENCLAW_DOCS_TRANSLATION_MAX_WAIT_SECONDS")
    if max_wait < cooldown:
        max_wait = cooldown

    elapsed = 0
    while True:
        state = read_main_state()
        before_ref = state.publish_ref
        before_source = state.source_sha

        if cooldown == 0:
            break

        print(f"Waiting {cooldown}s for docs main to settle at {before_ref} ({before_source}).")
        sleep_with_heartbeat(cooldown)
        elapsed += cooldown

        state = read_main_state()
        if state.publish_ref == before_ref and state.source_sha == before_source:
            break

        print(f"Docs main moved to {state.publish_ref} ({state.source_sha}) during cooldown.")
        if elapsed >= max_wait:
            print("Cooldown cap reached; translating newest observed state.")
            break

    should_translate = True
    if mode == "incremental" and event_name == "push" and before_sha:
        should_translate = incremental_should_translate(before_sha, state.publish_ref)

    values = {
        "mode": mode,
        "publish_ref": state.publish_ref,
        "should_translate": "true" if should_translate else "false",
        "source_repository": state.source_repository,
        "source_sha": state.source_sha,
    }
    append_github_output(values)
    append_summary(title, mode, state, cooldown, should_translate)
    return values


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare translation workflow source and debounce outputs.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes mode, publish_ref, should_translate, source_repository, and source_sha to GITHUB_OUTPUT.

Examples:
  EVENT_NAME=workflow_dispatch python .github/scripts/i18n/prepare.py --mode incremental --title "Translate Incremental"
  EVENT_NAME=repository_dispatch python .github/scripts/i18n/prepare.py --mode full --title "Translate Full"
""",
    )
    parser.add_argument("--mode", choices=["incremental", "full"], required=True)
    parser.add_argument("--title", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    prepare(args.mode, args.title)


if __name__ == "__main__":
    main()
