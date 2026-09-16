#!/usr/bin/env python3
"""Prepare translation workflow source selection outputs.

Definition:
  This script mirrors the debounce and source-selection shell block used by
  Translate Incremental and Translate Full. It reads origin/main, waits for an
  optional cooldown window, validates .openclaw-sync/source.json, and writes the
  same GitHub output fields consumed by downstream jobs. Retirement preparation
  only records the already checked-out HEAD, without fetching or debouncing.

Parameters:
  --mode: Workflow lane: incremental, full, or retirements.
  --title: Summary heading to write to GITHUB_STEP_SUMMARY.
  --inspect-resume-run: Validate a completed full run and pin its artifact IDs.
  --resume-artifacts-root: Resolve source from downloaded full-run receipts.
  --resume-publish-ref: Verified docs commit for legacy receipts only.

Environment:
  EVENT_NAME, BEFORE_SHA, REQUESTED_COOLDOWN_SECONDS, DEFAULT_COOLDOWN_SECONDS,
  DEFAULT_MAX_WAIT_SECONDS, GITHUB_OUTPUT, and GITHUB_STEP_SUMMARY match the
  variables provided by the workflow.

Outputs:
  GITHUB_OUTPUT receives mode, publish_ref, should_translate, source_repository,
  and source_sha. GITHUB_STEP_SUMMARY receives a short workflow summary.

Examples:
  EVENT_NAME=workflow_dispatch python .github/scripts/i18n/prepare.py --mode incremental --title "Translate Incremental"
  EVENT_NAME=workflow_dispatch python .github/scripts/i18n/prepare.py --mode full --title "Translate Full"
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

from merge_artifact_roots import NATIVE_ARTIFACT_NAME, artifact_dirs, artifact_name, read_artifact_metadata, require_artifact_count


LOCALES = {
    "ar",
    "de",
    "es",
    "fa",
    "fr",
    "hi",
    "id",
    "it",
    "ja-JP",
    "ko",
    "nl",
    "pl",
    "pt-BR",
    "ru",
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
    source_metadata_oid: str = ""


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
    return read_source_state("refs/remotes/origin/main")


def read_source_state(ref: str) -> MainState:
    publish_ref = run_git(["rev-parse", ref]).strip()
    source_json = run_git(["show", f"{publish_ref}:.openclaw-sync/source.json"])
    try:
        data = json.loads(source_json)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid .openclaw-sync/source.json at {publish_ref}: {exc}") from exc
    source_repository = data.get("repository") or ""
    source_sha = data.get("sha") or ""
    if not source_repository or not source_sha:
        raise SystemExit(f"Invalid .openclaw-sync/source.json at {publish_ref}")
    oid = run_git(["rev-parse", f"{publish_ref}:.openclaw-sync/source.json"]).strip()
    return MainState(publish_ref, source_repository, source_sha, oid)


def github_json(endpoint: str, *, paginate: bool = False) -> object:
    args = ["gh", "api", endpoint]
    if paginate:
        args.extend(["--paginate", "--slurp"])
    result = subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE)
    return json.loads(result.stdout)


def inspect_resume_run(run_id: str, repository: str) -> dict[str, str]:
    if not re.fullmatch(r"[1-9][0-9]*", run_id):
        raise SystemExit("resume_run_id must be a numeric Translate Full run ID")
    run = github_json(f"repos/{repository}/actions/runs/{run_id}")
    # GitHub returns either a plain workflow path or path@ref for a run.
    workflow_path = run.get("path", "").partition("@")[0]
    if (
        run.get("repository", {}).get("full_name") != repository
        or run.get("head_repository", {}).get("full_name") != repository
        or workflow_path != ".github/workflows/translate-all.yml"
        or run.get("status") != "completed"
    ):
        raise SystemExit("resume_run_id must identify a completed Translate Full run in this repository")
    pages = github_json(f"repos/{repository}/actions/runs/{run_id}/artifacts?per_page=100", paginate=True)
    latest: dict[str, dict[str, object]] = {}
    for page in pages:
        for artifact in page["artifacts"]:
            name = artifact["name"]
            if name.startswith("i18n-") and not name.startswith("i18n-canary-"):
                if not NATIVE_ARTIFACT_NAME.fullmatch(name):
                    raise SystemExit(f"invalid resume artifact name: {name}")
                if name not in latest or artifact["id"] > latest[name]["id"]:
                    latest[name] = artifact
    if not latest:
        raise SystemExit("resume run has no locale artifacts; start a new full run instead")
    if any(artifact.get("expired") for artifact in latest.values()):
        raise SystemExit("resume run has expired locale artifacts; cannot reconstruct its receipts")
    # Pin IDs before download. A later rerun must not silently replace the
    # successful receipts between planning and aggregate finalization.
    values = {
        "resume_artifact_ids": ",".join(str(latest[name]["id"]) for name in sorted(latest)),
        "resume_run_attempt": str(run["run_attempt"]),
    }
    print(f"Resume {repository}/actions/runs/{run_id}/attempts/{run['run_attempt']}: pinned {len(latest)} locale artifacts")
    append_github_output(values)
    return values


def read_resume_state(artifacts_root: Path, publish_ref: str = "", artifact_ids: str = "") -> MainState:
    artifacts = artifact_dirs(artifacts_root)
    require_artifact_count(artifacts, artifact_ids)
    if not artifacts:
        raise SystemExit("resume artifact download is empty or incomplete")
    sources: set[str] = set()
    snapshots: set[tuple[str, str]] = set()
    identities: set[str] = set()
    legacy = False
    for artifact in artifacts:
        metadata = read_artifact_metadata(artifact)
        name = artifact_name(metadata)
        if metadata.get("mode") != "full" or metadata.get("artifact_role", "locale") != "locale":
            raise SystemExit(f"resume artifact {artifact.name} is not a full locale receipt")
        locale = metadata.get("locale")
        if locale not in LOCALES or metadata.get("locale_slug") != locale.lower():
            raise SystemExit(f"resume artifact {artifact.name} has an unknown locale")
        if name in identities:
            raise SystemExit(f"duplicate resume artifact: {name}")
        identities.add(name)
        source = metadata.get("source_sha", "")
        if not isinstance(source, str) or not re.fullmatch(r"[0-9a-f]{40}", source):
            raise SystemExit(f"resume artifact {artifact.name} lacks a full source SHA")
        sources.add(source)
        snapshot = metadata.get("publish_ref"), metadata.get("source_metadata_oid")
        if snapshot == (None, None):
            legacy = True
        elif not all(isinstance(value, str) and re.fullmatch(r"[0-9a-f]{40}", value) for value in snapshot):
            raise SystemExit(f"resume artifact {artifact.name} has incomplete snapshot provenance")
        else:
            snapshots.add(snapshot)
    if len(sources) != 1 or len(snapshots) > 1:
        raise SystemExit("resume artifacts contain contradictory source snapshots")
    if legacy and not publish_ref:
        raise SystemExit("legacy resume artifacts lack publish_ref; supply the verified original resume_publish_ref")
    if publish_ref and not re.fullmatch(r"[0-9a-f]{40}", publish_ref):
        raise SystemExit("resume_publish_ref must be the full original publish commit SHA")
    if publish_ref and not legacy:
        raise SystemExit("resume_publish_ref is only for legacy receipts without snapshot provenance")
    recorded = next(iter(snapshots), None)
    if recorded and publish_ref and recorded[0] != publish_ref:
        raise SystemExit("resume_publish_ref contradicts recorded snapshot provenance")
    state = read_source_state(publish_ref or recorded[0])
    if state.source_sha != next(iter(sources)) or (recorded and state.source_metadata_oid != recorded[1]):
        raise SystemExit("resume publish snapshot does not match artifact source metadata")
    return state


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


def incremental_should_translate_paths(changed_paths: list[str]) -> bool:
    has_glossary_change = any(re.match(r"^docs/\.i18n/glossary\..*\.json$", path) for path in changed_paths)
    has_translatable_docs = any(is_translatable_doc_path(path) for path in changed_paths)
    if not has_translatable_docs:
        if has_glossary_change:
            print("Glossary-only change; weekly or manual full reconciliation will pick it up.")
            return False
        print("No translatable docs changed after cooldown; skipping translation matrix.")
        return False
    return True


def incremental_should_translate(before_sha: str, publish_ref: str) -> bool:
    diff = subprocess.run(
        ["git", "diff", "--name-only", before_sha, publish_ref],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    changed_paths = [line.strip() for line in diff.stdout.splitlines() if line.strip()]
    return incremental_should_translate_paths(changed_paths)


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
    return "0"


def sleep_with_heartbeat(seconds: int) -> None:
    remaining = seconds
    while remaining > 0:
        chunk = min(remaining, 60)
        time.sleep(chunk)
        remaining -= chunk
        if remaining > 0:
            print(f"Still debouncing docs main; {remaining}s remaining.")


def prepare_translation_state(mode: str) -> tuple[MainState, int]:
    event_name = os.environ.get("EVENT_NAME", "")
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

    return state, cooldown


def prepare(mode: str, title: str, resume_artifacts_root: Path | None = None, resume_publish_ref: str = "") -> dict[str, str]:
    if resume_artifacts_root is not None:
        if mode != "full":
            raise SystemExit("only full translations support resume artifacts")
        state, cooldown = read_resume_state(resume_artifacts_root, resume_publish_ref, os.environ.get("RESUME_ARTIFACT_IDS", "")), 0
    elif resume_publish_ref:
        raise SystemExit("resume_publish_ref requires resume_run_id")
    elif mode == "retirements":
        state, cooldown = read_source_state("HEAD"), 0
    else:
        state, cooldown = prepare_translation_state(mode)

    should_translate = mode != "retirements"
    event_name = os.environ.get("EVENT_NAME", "")
    before_sha = os.environ.get("BEFORE_SHA", "")
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
  EVENT_NAME=workflow_dispatch python .github/scripts/i18n/prepare.py --mode full --title "Translate Full"
""",
    )
    parser.add_argument("--mode", choices=["incremental", "full", "retirements"], required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--inspect-resume-run", default="")
    parser.add_argument("--resume-artifacts-root", type=Path)
    parser.add_argument("--resume-publish-ref", default="")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.inspect_resume_run:
        inspect_resume_run(args.inspect_resume_run, os.environ["GITHUB_REPOSITORY"])
    else:
        prepare(args.mode, args.title, args.resume_artifacts_root, args.resume_publish_ref)


if __name__ == "__main__":
    main()
