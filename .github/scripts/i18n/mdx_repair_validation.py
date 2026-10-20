#!/usr/bin/env python3
"""Gates and three-state reporting for the MDX repair validation sub-pipeline.

Definition:
  Control plane for .github/workflows/mdx-repair-validation.yml (STORY-05 of
  plans/i18n-codex-mdx-fallback). The sub-pipeline validates the enhanced
  existing Codex repair relay (single entry: openai/codex-action@v1) against
  the frozen STORY-01 fixtures and uploads evidence only; it never edits
  production branches.

  oracle-gate replays the frozen STORY-01 strict oracle
  (strict-mdx-oracle.mjs, @mdx-js/mdx@3.1.1 compile({jsx:true})) over the two
  real fixture pages and asserts compile_failure with the diagnostics and
  content hashes recorded in fixture-manifest.json. It then replays the
  archived STORY-03 real-Codex repair payloads (metadata.final_outcome ==
  success) and asserts compile_success, so the known-good repair references
  stay compilable without any secret.

  single-entry audits the validation workflow: exactly one Codex executor
  entry (openai/codex-action@v1 unrolled into MDX_REPAIR_MAX_ATTEMPTS relay
  rounds, each round using the shared relay prompt) and no second executor
  (no `codex exec`, no direct model API endpoint).

  classify reduces one real-Codex opt-in run to exactly one explicit
  classification: success, agent_failure, or environment_failure. Quota,
  auth, model, and staging problems are environment_failure; relay failures
  keep their per-round diagnostics and are agent_failure; nothing is
  disguised as success.

Parameters:
  command: oracle-gate | single-entry | classify.
  --output-dir: Report directory. Default: ${RUNNER_TEMP:-.}/mdx-repair-validation.
  single-entry --workflow: Workflow file to audit.
    Default: .github/workflows/mdx-repair-validation.yml.
  classify --workspace: Workspace root holding .openclaw-sync/mdx.
    Default: GITHUB_WORKSPACE or current directory.
  classify --locale: Locale under validation. Default: zh-CN.

Environment (classify):
  MDX_VALIDATION_PREFLIGHT (ok|failed|missing), MDX_VALIDATION_PREFLIGHT_CLASS,
  MDX_VALIDATION_DECISION, MDX_VALIDATION_NOT_RUN_REASON,
  MDX_VALIDATION_FINAL_OUTCOME, MDX_VALIDATION_FAILURE_KIND,
  MDX_VALIDATION_ROUNDS, MDX_VALIDATION_FAILED_PATHS,
  MDX_VALIDATION_CHANGED_PATHS, MDX_REPAIR_MAX_ATTEMPTS,
  MDX_REPAIR_HARD_TIMEOUT_MS, MDX_REPAIR_AUXILIARY_MODE.

Outputs:
  oracle-gate writes oracle-gate.json plus repaired-references/ copies and
  exits non-zero when any fixture or repair-reference expectation fails.
  single-entry writes single-entry.json and exits non-zero on violations.
  classify copies .openclaw-sync/mdx relay diagnostics into relay/, writes
  classification.json, prints the classification, and writes GITHUB_OUTPUT
  classification/reason. It exits non-zero only on misconfiguration such as
  an enabled auxiliary arm.

Examples:
  python .github/scripts/i18n/mdx_repair_validation.py oracle-gate --output-dir /tmp/evidence
  python .github/scripts/i18n/mdx_repair_validation.py single-entry --workflow .github/workflows/mdx-repair-validation.yml
  MDX_VALIDATION_PREFLIGHT=ok MDX_VALIDATION_FINAL_OUTCOME=success python .github/scripts/i18n/mdx_repair_validation.py classify
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[2]
FIXTURE_EVIDENCE = REPO_ROOT / ".github/scripts/i18n/tests/fixtures/mdx-relay"
REPAIR_EVIDENCE_ARTIFACTS = (
    REPO_ROOT / ".github/scripts/i18n/tests/fixtures/mdx-relay/repaired-references"
)
SINGLE_ENTRY_ACTION = "uses: openai/codex-action@v1"
RELAY_PROMPT_FILE = "prompt-file: .openclaw-sync/docs-mdx-repair.md"
SECOND_EXECUTOR_TOKENS = ("codex exec", "api.openai.com", "chat/completions", "/v1/responses")
DEFAULT_WORKFLOW = REPO_ROOT / ".github/workflows/mdx-repair-validation.yml"
MESSAGE_LIMIT = 200


def default_output_dir() -> Path:
    return Path(os.environ.get("RUNNER_TEMP") or ".") / "mdx-repair-validation"


def load_fixture_expectations() -> list[dict[str, object]]:
    manifest = json.loads((FIXTURE_EVIDENCE / "fixture-manifest.json").read_text(encoding="utf-8"))
    expectations: list[dict[str, object]] = []
    for entry in manifest.get("fixtures", []):
        expectations.append(
            {
                "fixture_id": entry["id"],
                "file": FIXTURE_EVIDENCE / entry["path"],
                "expected": entry["oracle"],
                "content_sha256": (entry.get("content_retention") or {}).get("sha256"),
            }
        )
    return expectations


def load_repair_references(output_dir: Path) -> list[dict[str, object]]:
    references: list[dict[str, object]] = []
    for payload_path in sorted(REPAIR_EVIDENCE_ARTIFACTS.glob("*-enhanced_existing_codex_action.json")):
        record = json.loads(payload_path.read_text(encoding="utf-8"))
        metadata = record.get("metadata") or {}
        payload = record.get("payload")
        if metadata.get("final_outcome") != "success" or not payload:
            continue
        target = output_dir / "repaired-references" / f"{record['fixture_id']}.mdx"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(payload, encoding="utf-8")
        references.append(
            {
                "fixture_id": record["fixture_id"],
                "evidence": payload_path.relative_to(REPO_ROOT).as_posix(),
                "file": target,
            }
        )
    return references


def run_oracle(files: list[Path]) -> list[dict[str, object]]:
    result = subprocess.run(
        ["node", str(FIXTURE_EVIDENCE / "strict-mdx-oracle.mjs"), *[str(path) for path in files]],
        cwd=str(REPO_ROOT),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode not in (0, 1):
        raise SystemExit(f"strict MDX oracle failed to run (exit {result.returncode}): {result.stderr.strip()[:300]}")
    try:
        items = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"strict MDX oracle produced no JSON report: {exc}") from exc
    if not isinstance(items, list) or len(items) != len(files):
        raise SystemExit("strict MDX oracle report does not cover every input file")
    return items


def oracle_expectation_matches(item: dict[str, object], expectation: dict[str, object]) -> bool:
    if item.get("outcome") != "compile_failure":
        return False
    expected = expectation["expected"] or {}
    if not isinstance(expected, dict):
        return False
    error = item.get("error") or {}
    if not isinstance(error, dict):
        return False
    content_sha256 = expectation.get("content_sha256")
    return (
        error.get("source") == expected.get("source")
        and error.get("line") == expected.get("line")
        and error.get("column") == expected.get("column")
        and error.get("offset") == expected.get("offset")
        and (content_sha256 is None or item.get("sha256") == content_sha256)
    )


def oracle_gate(output_dir: Path) -> dict[str, object]:
    expectations = load_fixture_expectations()
    if not expectations:
        raise SystemExit("oracle gate misconfigured: fixture manifest has no fixtures")
    references = load_repair_references(output_dir)
    if not references:
        raise SystemExit("oracle gate misconfigured: no archived successful repair reference found")

    fixture_results: list[dict[str, object]] = []
    for expectation, item in zip(expectations, run_oracle([entry["file"] for entry in expectations])):
        fixture_results.append(
            {
                "fixture_id": expectation["fixture_id"],
                "file": expectation["file"].relative_to(REPO_ROOT).as_posix(),
                "expected": expectation["expected"],
                "observed": item,
                "match": oracle_expectation_matches(item, expectation),
            }
        )

    reference_results: list[dict[str, object]] = []
    for reference, item in zip(references, run_oracle([Path(str(entry["file"])) for entry in references])):
        reference_results.append(
            {
                "fixture_id": reference["fixture_id"],
                "evidence": reference["evidence"],
                "observed_outcome": item.get("outcome"),
                "match": item.get("outcome") == "compile_success",
            }
        )

    passed = all(entry["match"] for entry in fixture_results) and all(entry["match"] for entry in reference_results)
    report = {
        "gate": "strict-mdx-oracle",
        "oracle": (FIXTURE_EVIDENCE / "strict-mdx-oracle.mjs").relative_to(REPO_ROOT).as_posix(),
        "parser": "@mdx-js/mdx@3.1.1 compile({jsx:true})",
        "fixture_expectations": fixture_results,
        "repair_references": reference_results,
        "passed": passed,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "oracle-gate.json").write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    if not passed:
        raise SystemExit("strict MDX oracle gate failed; see oracle-gate.json")
    print("strict MDX oracle gate passed: frozen fixtures fail as recorded; archived repairs still compile")
    return report


def single_entry_report(workflow_path: Path) -> dict[str, object]:
    text = workflow_path.read_text(encoding="utf-8")
    budget = re.search(r'MDX_REPAIR_MAX_ATTEMPTS:\s*"([1-9][0-9]*)"', text)
    if not budget:
        raise SystemExit("single-entry audit failed: MDX_REPAIR_MAX_ATTEMPTS budget missing")
    rounds = int(budget.group(1))
    action_count = text.count(SINGLE_ENTRY_ACTION)
    prompt_count = text.count(RELAY_PROMPT_FILE)
    second_executors = [token for token in SECOND_EXECUTOR_TOKENS if token in text]
    checks = {
        "single_entry_unrolled_to_budget": action_count == rounds,
        "every_round_uses_relay_prompt": prompt_count == rounds,
        "no_second_executor": not second_executors,
    }
    try:
        workflow = workflow_path.relative_to(REPO_ROOT).as_posix()
    except ValueError:
        workflow = str(workflow_path)
    return {
        "workflow": workflow,
        "single_entry": SINGLE_ENTRY_ACTION,
        "rounds_budget": rounds,
        "action_count": action_count,
        "prompt_count": prompt_count,
        "second_executor_tokens": second_executors,
        "checks": checks,
        "passed": all(checks.values()),
    }


def single_entry_command(workflow_path: Path, output_dir: Path) -> dict[str, object]:
    report = single_entry_report(workflow_path)
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "single-entry.json").write_text(
        json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    if not report["passed"]:
        raise SystemExit(f"single-entry audit failed for {workflow_path}; see single-entry.json")
    print(f"single-entry audit passed: {report['action_count']} relay round(s), one Codex executor entry")
    return report


def sanitize_reason_token(raw: str) -> str:
    token = re.sub(r"[^A-Za-z0-9_.-]+", "_", raw.strip())
    return token[:100]


def classify_verdict() -> tuple[str, str]:
    auxiliary_mode = (os.environ.get("MDX_REPAIR_AUXILIARY_MODE") or "none").strip().lower()
    if auxiliary_mode != "none":
        return "environment_failure", f"auxiliary_mode_{sanitize_reason_token(auxiliary_mode)}_not_enabled"

    preflight = (os.environ.get("MDX_VALIDATION_PREFLIGHT") or "missing").strip().lower()
    if preflight != "ok":
        failure_class = sanitize_reason_token(os.environ.get("MDX_VALIDATION_PREFLIGHT_CLASS") or "")
        suffix = f"_{failure_class}" if failure_class else ""
        return "environment_failure", f"preflight_{preflight}{suffix}"

    decision = (os.environ.get("MDX_VALIDATION_DECISION") or "not_run").strip()
    if decision != "run":
        not_run_reason = sanitize_reason_token(os.environ.get("MDX_VALIDATION_NOT_RUN_REASON") or "")
        suffix = f"_{not_run_reason}" if not_run_reason else ""
        return "environment_failure", f"relay_not_started{suffix}"

    final_outcome = (os.environ.get("MDX_VALIDATION_FINAL_OUTCOME") or "unavailable").strip()
    if final_outcome == "success":
        return "success", "frozen_fixtures_pass_strict_recheck"
    if final_outcome in {"partial_success", "final_failure"}:
        return "agent_failure", f"relay_{final_outcome}"
    return "environment_failure", f"relay_outcome_{sanitize_reason_token(final_outcome)}"


def append_output(values: dict[str, str]) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        for key, value in values.items():
            fh.write(f"{key}={value}\n")


def trunc(message: object) -> str:
    return str(message or "").split("\n")[0][:MESSAGE_LIMIT]


def round_diagnostics(workspace: Path, locale: str) -> list[dict[str, object]]:
    mdx_dir = workspace / ".openclaw-sync" / "mdx"
    diagnostics: list[dict[str, object]] = []
    for path in sorted(mdx_dir.glob(f"{locale}-round-*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        errors = payload.get("errors") if isinstance(payload, dict) else None
        errors = [error for error in errors if isinstance(error, dict)] if isinstance(errors, list) else []
        entry: dict[str, object] = {"round_file": path.name, "error_count": len(errors)}
        if errors:
            first = errors[0]
            entry["first_error"] = {
                "type": first.get("type", ""),
                "file": first.get("file", ""),
                "line": first.get("line"),
                "column": first.get("column"),
                "message": trunc(first.get("message")),
            }
        diagnostics.append(entry)
    return diagnostics


def collect_relay_evidence(workspace: Path, locale: str, output_dir: Path) -> list[str]:
    mdx_dir = workspace / ".openclaw-sync" / "mdx"
    relay_dir = output_dir / "relay"
    relay_dir.mkdir(parents=True, exist_ok=True)
    copied: list[str] = []
    sources = list(mdx_dir.parent.glob(f"mdx/{locale}*")) if mdx_dir.parent.is_dir() else []
    runner_temp = os.environ.get("RUNNER_TEMP")
    if runner_temp:
        sources.extend(
            Path(runner_temp) / name
            for name in (f"{locale}.repair-baseline.txt", f"{locale}.repair-content-snapshot.json")
        )
    for source in sorted(set(sources)):
        if source.is_file():
            shutil.copy2(source, relay_dir / source.name)
            copied.append(source.name)
    return copied


def split_env_paths(name: str) -> list[str]:
    return [path for path in (os.environ.get(name) or "").split() if path]


def classify_command(workspace: Path, locale: str, output_dir: Path) -> dict[str, object]:
    auxiliary_mode = (os.environ.get("MDX_REPAIR_AUXILIARY_MODE") or "none").strip().lower()
    classification, reason = classify_verdict()

    mdx_dir = workspace / ".openclaw-sync" / "mdx"
    relay_report: dict[str, object] | None = None
    report_path = mdx_dir / f"{locale}-repair-report.json"
    if report_path.is_file():
        try:
            loaded = json.loads(report_path.read_text(encoding="utf-8"))
            relay_report = loaded if isinstance(loaded, dict) else None
        except json.JSONDecodeError:
            relay_report = None

    collected = collect_relay_evidence(workspace, locale, output_dir)
    payload = {
        "event": "validation_classification",
        "classification": classification,
        "reason": reason,
        "locale": locale,
        "budgets": {
            "max_attempts": os.environ.get("MDX_REPAIR_MAX_ATTEMPTS") or "4",
            "hard_timeout_ms": os.environ.get("MDX_REPAIR_HARD_TIMEOUT_MS") or "600000",
            "auxiliary_mode": auxiliary_mode,
        },
        "preflight": {
            "outcome": (os.environ.get("MDX_VALIDATION_PREFLIGHT") or "missing").strip().lower(),
            "failure_class": os.environ.get("MDX_VALIDATION_PREFLIGHT_CLASS") or "",
        },
        "relay": {
            "decision": (os.environ.get("MDX_VALIDATION_DECISION") or "not_run").strip(),
            "not_run_reason": os.environ.get("MDX_VALIDATION_NOT_RUN_REASON") or "",
            "final_outcome": (os.environ.get("MDX_VALIDATION_FINAL_OUTCOME") or "unavailable").strip(),
            "failure_kind": os.environ.get("MDX_VALIDATION_FAILURE_KIND") or "",
            "rounds": os.environ.get("MDX_VALIDATION_ROUNDS") or "0",
            "failed_paths": split_env_paths("MDX_VALIDATION_FAILED_PATHS"),
            "changed_paths": split_env_paths("MDX_VALIDATION_CHANGED_PATHS"),
            "round_diagnostics": round_diagnostics(workspace, locale),
            "report": relay_report,
        },
        "relay_evidence_files": collected,
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "classification.json").write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    append_output({"classification": classification, "reason": reason})
    print(json.dumps({"classification": classification, "reason": reason}, sort_keys=True))
    return payload


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Offline gates and three-state reporting for the MDX repair validation sub-pipeline.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  oracle-gate writes oracle-gate.json plus repaired-references/ copies.
  single-entry writes single-entry.json.
  classify writes classification.json, copies relay diagnostics, and writes GITHUB_OUTPUT classification/reason.

Examples:
  python .github/scripts/i18n/mdx_repair_validation.py oracle-gate --output-dir /tmp/evidence
  python .github/scripts/i18n/mdx_repair_validation.py single-entry --workflow .github/workflows/mdx-repair-validation.yml
  MDX_VALIDATION_PREFLIGHT=ok MDX_VALIDATION_FINAL_OUTCOME=success python .github/scripts/i18n/mdx_repair_validation.py classify
""",
    )
    parser.add_argument("command", choices=["oracle-gate", "single-entry", "classify"])
    parser.add_argument("--output-dir", default=default_output_dir(), type=Path)
    parser.add_argument("--workflow", default=DEFAULT_WORKFLOW, type=Path)
    parser.add_argument("--workspace", default=os.environ.get("GITHUB_WORKSPACE", "."), type=Path)
    parser.add_argument("--locale", default=os.environ.get("MDX_VALIDATION_LOCALE", "zh-CN"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = args.output_dir.resolve()
    if args.command == "oracle-gate":
        oracle_gate(output_dir)
    elif args.command == "single-entry":
        single_entry_command(args.workflow.resolve(), output_dir)
    else:
        payload = classify_command(args.workspace.resolve(), args.locale, output_dir)
        if payload["budgets"]["auxiliary_mode"] != "none":  # type: ignore[index]
            raise SystemExit("MDX_REPAIR_AUXILIARY_MODE must stay none; the validation pipeline is fail-closed")


if __name__ == "__main__":
    main()
