#!/usr/bin/env python3
"""Package one locale shard artifact for the finalizer.

Definition:
  This script mirrors the artifact packaging block from
  translate-locale-reusable.yml. It determines failure reason from prior step
  outcomes, filters changed/deleted paths to the shard contract, copies payload
  files, and writes metadata.json without changing translation semantics.

Parameters:
  --workspace: GitHub workspace root. Default: GITHUB_WORKSPACE or current dir.
  --openclaw-sync-dir: State/output directory. Default: .openclaw-sync.

Environment:
  LOCALE, LOCALE_SLUG, SOURCE_SHA, MODE, SHARD_INDEX, SHARD_TOTAL,
  WORKER_PARALLEL, THINKING_EFFORT, PENDING_COUNT, TOTAL_PENDING_COUNT,
  ALL_COUNT, optional ARTIFACT_ROLE, TRANSLATE_OUTCOME, MDX_CHECK_OUTCOME,
  MDX_REPAIR_OUTCOME, MDX_SCOPE_OUTCOME, and MDX_RECHECK_OUTCOME.

Outputs:
  Writes .openclaw-sync/artifacts/<locale_slug>-s<index>of<total>/ with
  changed-files.txt, deleted-files.txt, payload/, and metadata.json.
  GITHUB_OUTPUT receives failed, failed_reason, changed_count, and deleted_count.
  GITHUB_STEP_SUMMARY receives a concise per-locale artifact status.

Examples:
  LOCALE=fr LOCALE_SLUG=fr SOURCE_SHA=abc MODE=incremental SHARD_INDEX=0 SHARD_TOTAL=1 python .github/scripts/i18n/package_artifact.py
  LOCALE=zh-CN LOCALE_SLUG=zh-cn SOURCE_SHA=abc MODE=full SHARD_INDEX=2 SHARD_TOTAL=14 python .github/scripts/i18n/package_artifact.py
"""

from __future__ import annotations

import argparse
import collections
import json
import os
import re
import shutil
import subprocess
from pathlib import Path


CANONICAL_I18N_MARKER_RE = re.compile(r"__OC_I18N_\d+__")
I18N_MARKER_PREFIX_RE = re.compile(r"__oc_i18n_", re.IGNORECASE)
MDX_PROTECTED_ATTRIBUTE_CHECKER = Path(__file__).with_name("check_mdx_protected_attributes.mjs")
MDX_PROTECTED_ATTRIBUTE_REPAIR = Path(__file__).with_name("repair_mdx_protected_attributes.mjs")


def git_lines(args: list[str]) -> list[str]:
    result = subprocess.run(["git", *args], check=True, text=True, stdout=subprocess.PIPE)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def env_int(name: str) -> int:
    try:
        return int(os.environ[name])
    except (KeyError, ValueError) as exc:
        raise SystemExit(f"invalid {name}: {os.environ.get(name, '')}") from exc


def failure_reason() -> str:
    translate_outcome = os.environ.get("TRANSLATE_OUTCOME", "skipped")
    mdx_check_outcome = os.environ.get("MDX_CHECK_OUTCOME", "skipped")
    mdx_repair_outcome = os.environ.get("MDX_REPAIR_OUTCOME", "skipped")
    mdx_scope_outcome = os.environ.get("MDX_SCOPE_OUTCOME", "skipped")
    mdx_recheck_outcome = os.environ.get("MDX_RECHECK_OUTCOME", "skipped")

    if translate_outcome == "failure":
        return "translation failed"
    if mdx_check_outcome == "failure":
        if mdx_repair_outcome == "failure":
            return "mdx repair failed"
        if mdx_scope_outcome == "failure":
            return "mdx repair scope failed"
        if mdx_recheck_outcome != "success":
            return "mdx repair failed"
    return ""


def read_pending_allowed(workspace: Path, locale: str, locale_slug: str, shard_index: int, shard_total: int) -> set[str]:
    docs_root = workspace / "docs"
    pending_file = workspace / ".openclaw-sync" / f"docs-i18n-{locale_slug}-s{shard_index}of{shard_total}.txt"
    allowed: set[str] = set()
    if pending_file.exists():
        for line in pending_file.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            source = Path(line.strip())
            rel = source.relative_to(docs_root).as_posix()
            allowed.add(f"docs/{locale}/{rel}")
    # Translation memory is locale-global rather than page-sharded. Shard 0
    # carries it so a sharded locale finalizer applies the refreshed TM once.
    if shard_total == 1 or shard_index == 0:
        allowed.add(f"docs/.i18n/{locale}.tm.jsonl")
    return allowed


def write_lines(path: Path, lines: list[str]) -> None:
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def same_i18n_protocol_markers(source: str, translated: str) -> bool:
    source = source.replace(r"\_", "_")
    translated = translated.replace(r"\_", "_")
    source_markers = collections.Counter(CANONICAL_I18N_MARKER_RE.findall(source))
    translated_markers = collections.Counter(CANONICAL_I18N_MARKER_RE.findall(translated))
    if source_markers != translated_markers:
        return False
    source_residual = CANONICAL_I18N_MARKER_RE.sub("", source)
    translated_residual = CANONICAL_I18N_MARKER_RE.sub("", translated)
    return len(I18N_MARKER_PREFIX_RE.findall(source_residual)) == len(I18N_MARKER_PREFIX_RE.findall(translated_residual))


def leaked_i18n_protocol_paths(workspace: Path, locale: str, changed: list[str]) -> list[str]:
    leaked: list[str] = []
    locale_prefix = f"docs/{locale}/"
    for file_name in changed:
        if not file_name.startswith(locale_prefix) or not file_name.endswith((".md", ".mdx")):
            continue
        translated_path = workspace / file_name
        source_path = workspace / "docs" / file_name.removeprefix(locale_prefix)
        if not translated_path.is_file() or not source_path.is_file():
            continue
        source = source_path.read_text(encoding="utf-8")
        translated = translated_path.read_text(encoding="utf-8")
        if not same_i18n_protocol_markers(source, translated):
            leaked.append(file_name)
    return leaked


def drifted_mdx_protected_attribute_paths(workspace: Path, locale: str, changed: list[str]) -> list[str]:
    documents: list[dict[str, str]] = []
    drifted: list[str] = []
    locale_prefix = f"docs/{locale}/"
    for file_name in changed:
        if not file_name.startswith(locale_prefix) or not file_name.endswith((".md", ".mdx")):
            continue
        translated_path = workspace / file_name
        source_path = workspace / "docs" / file_name.removeprefix(locale_prefix)
        if not translated_path.is_file():
            continue
        if not source_path.is_file():
            drifted.append(file_name)
            continue
        source = source_path.read_text(encoding="utf-8")
        translated = translated_path.read_text(encoding="utf-8")
        documents.append(
            {
                "path": file_name,
                "source": source,
                "translated": translated,
            }
        )
    if not documents:
        return drifted
    module_root = workspace
    if not (module_root / "node_modules/@mdx-js/mdx/package.json").is_file():
        repository_root = Path(__file__).resolve().parents[3]
        if (repository_root / "node_modules/@mdx-js/mdx/package.json").is_file():
            module_root = repository_root
    result = subprocess.run(
        ["node", str(MDX_PROTECTED_ATTRIBUTE_CHECKER)],
        check=False,
        text=True,
        input=json.dumps({"moduleRoot": str(module_root), "documents": documents}),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip() or "unknown error"
        raise SystemExit(f"mdx protected attribute check failed: {detail}")
    try:
        output = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"mdx protected attribute check returned invalid JSON: {exc}") from exc
    parsed_drifted = output.get("drifted")
    if not isinstance(parsed_drifted, list) or not all(isinstance(path, str) for path in parsed_drifted):
        raise SystemExit("mdx protected attribute check returned invalid drifted paths")
    return drifted + parsed_drifted


def repair_mdx_protected_attributes(
    workspace: Path,
    locale: str,
    locale_slug: str,
    shard_index: int,
    shard_total: int,
) -> tuple[str, list[str], bool]:
    manifest = workspace / ".openclaw-sync" / f"docs-i18n-{locale_slug}-s{shard_index}of{shard_total}.txt"
    if not manifest.is_file():
        return f"missing pending manifest: {manifest}", [], False
    source_paths = [Path(line) for line in manifest.read_text(encoding="utf-8").splitlines() if line.strip()]
    repairable_sources = [path for path in source_paths if path.suffix in {".md", ".mdx"}]
    if not repairable_sources:
        return "", [], False
    module_root = workspace
    if not (module_root / "node_modules/@mdx-js/mdx/package.json").is_file():
        repository_root = Path(__file__).resolve().parents[3]
        if (repository_root / "node_modules/@mdx-js/mdx/package.json").is_file():
            module_root = repository_root
    result = subprocess.run(
        [
            "node",
            str(MDX_PROTECTED_ATTRIBUTE_REPAIR),
            "--workspace",
            str(workspace),
            "--locale",
            locale,
            "--manifest",
            str(manifest),
            "--module-root",
            str(module_root),
        ],
        check=False,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if result.returncode != 0:
        return result.stderr.strip() or result.stdout.strip() or "unknown error", [], True
    try:
        output = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        return f"repair returned invalid JSON: {exc}", [], True
    repaired = output.get("repaired")
    if not isinstance(repaired, list) or not all(isinstance(path, str) for path in repaired):
        return "repair returned invalid paths", [], True
    docs_root = (workspace / "docs").resolve()
    try:
        allowed_repaired = {
            f"docs/{locale}/{source.resolve().relative_to(docs_root).as_posix()}" for source in repairable_sources
        }
    except ValueError:
        return "pending manifest source escapes docs root", [], True
    if any(path not in allowed_repaired for path in repaired):
        return "repair returned path outside pending manifest", [], True
    return "", repaired, True


def append_outputs(metadata: dict[str, object]) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    failed_reason = str(metadata.get("failed_reason") or "")
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"failed={'true' if failed_reason else 'false'}\n")
        fh.write(f"failed_reason={failed_reason}\n")
        fh.write(f"changed_count={metadata.get('changed_count', 0)}\n")
        fh.write(f"deleted_count={metadata.get('deleted_count', 0)}\n")


def append_summary(metadata: dict[str, object]) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary:
        return
    with Path(summary).open("a", encoding="utf-8") as fh:
        fh.write("### Locale artifact\n\n")
        fh.write(f"- locale: `{metadata['locale']}`\n")
        fh.write(f"- mode: `{metadata['mode']}`\n")
        fh.write(f"- shard: `{metadata['shard_index']}/{metadata['shard_total']}`\n")
        fh.write(f"- pending docs: `{metadata['pending_count']}`\n")
        fh.write(f"- changed files: `{metadata['changed_count']}`\n")
        fh.write(f"- deleted files: `{metadata['deleted_count']}`\n")
        failed_reason = str(metadata.get("failed_reason") or "")
        if failed_reason:
            fh.write(f"- failure: `{failed_reason}`\n")


def package_artifact(workspace: Path, openclaw_sync_dir: Path) -> dict[str, object]:
    locale = os.environ["LOCALE"]
    locale_slug = os.environ["LOCALE_SLUG"]
    shard_index = env_int("SHARD_INDEX")
    shard_total = env_int("SHARD_TOTAL")
    shard_id = f"s{shard_index}of{shard_total}"
    artifact_dir = openclaw_sync_dir / "artifacts" / f"{locale_slug}-{shard_id}"
    payload_dir = artifact_dir / "payload"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    payload_dir.mkdir(parents=True, exist_ok=True)

    failed_reason = failure_reason()
    changed_path = artifact_dir / "changed-files.txt"
    deleted_path = artifact_dir / "deleted-files.txt"

    protected_attribute_repair_outcome = "skipped"
    if failed_reason:
        write_lines(changed_path, [])
        write_lines(deleted_path, [])
    else:
        changed = git_lines(["diff", "--name-only", "--diff-filter=ACMRT", "--", f"docs/{locale}", f"docs/.i18n/{locale}.tm.jsonl"])
        changed.extend(git_lines(["ls-files", "--others", "--exclude-standard", "--", f"docs/{locale}", f"docs/.i18n/{locale}.tm.jsonl"]))
        changed = sorted(set(changed))
        deleted = git_lines(["diff", "--name-only", "--diff-filter=D", "--", f"docs/{locale}", f"docs/.i18n/{locale}.tm.jsonl"])

        allowed = read_pending_allowed(workspace, locale, locale_slug, shard_index, shard_total)
        protected_attribute_repair_error, repaired_paths, protected_attribute_repair_ran = repair_mdx_protected_attributes(
            workspace, locale, locale_slug, shard_index, shard_total
        )
        protected_attribute_repair_outcome = (
            "failure" if protected_attribute_repair_error else "success" if protected_attribute_repair_ran else "skipped"
        )
        # A repair can be the only working-tree change for a pending page, so
        # include the script's validated paths in the pre-repair Git snapshot.
        changed = sorted(set(changed + repaired_paths))
        # The finalizer treats every changed-files.txt entry as a required
        # payload file, so allowed-but-missing TM paths must not be advertised.
        shard_changed = [line for line in changed if line in allowed and (workspace / line).is_file()]
        leaked_paths = leaked_i18n_protocol_paths(workspace, locale, shard_changed)
        protected_attribute_drift = (
            drifted_mdx_protected_attribute_paths(workspace, locale, shard_changed)
            if not protected_attribute_repair_error
            else []
        )
        if protected_attribute_repair_error:
            failed_reason = "mdx protected attribute repair failed"
            shard_changed = []
            deleted = []
        elif leaked_paths:
            failed_reason = "i18n protocol marker leaked"
            shard_changed = []
            deleted = []
        elif protected_attribute_drift:
            failed_reason = "mdx protected attribute drift"
            shard_changed = []
            deleted = []
        if os.environ.get("ARTIFACT_ROLE") == "canary":
            shard_deleted = []
        elif shard_total == 1:
            shard_deleted = deleted
        else:
            shard_deleted = [
                line
                for index, line in enumerate(sorted(line for line in deleted if not line.startswith("docs/.i18n/")))
                if index % shard_total == shard_index
            ]
        write_lines(changed_path, shard_changed)
        write_lines(deleted_path, shard_deleted)

    for file_name in [line for line in changed_path.read_text(encoding="utf-8").splitlines() if line.strip()]:
        source = Path(file_name)
        if not source.is_file():
            continue
        target = payload_dir / file_name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    changed_files = [line for line in changed_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    deleted_files = [line for line in deleted_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    metadata: dict[str, object] = {
        "locale": locale,
        "locale_slug": locale_slug,
        "source_sha": os.environ["SOURCE_SHA"],
        "mode": os.environ["MODE"],
        "artifact_role": os.environ.get("ARTIFACT_ROLE", "locale"),
        "shard_index": shard_index,
        "shard_total": shard_total,
        "worker_parallel": env_int("WORKER_PARALLEL"),
        "thinking_effort": os.environ["THINKING_EFFORT"],
        "pending_count": env_int("PENDING_COUNT"),
        "total_pending_count": env_int("TOTAL_PENDING_COUNT"),
        "all_count": env_int("ALL_COUNT"),
        "changed_count": len(changed_files),
        "deleted_count": len(deleted_files),
        "translate_outcome": os.environ.get("TRANSLATE_OUTCOME", "skipped"),
        "mdx_check_outcome": os.environ.get("MDX_CHECK_OUTCOME", "skipped"),
        "mdx_repair_outcome": os.environ.get("MDX_REPAIR_OUTCOME", "skipped"),
        "mdx_scope_outcome": os.environ.get("MDX_SCOPE_OUTCOME", "skipped"),
        "mdx_recheck_outcome": os.environ.get("MDX_RECHECK_OUTCOME", "skipped"),
        "mdx_protected_attribute_repair_outcome": protected_attribute_repair_outcome,
        "failed_reason": failed_reason,
    }
    (artifact_dir / "metadata.json").write_text(json.dumps(metadata, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    append_outputs(metadata)
    append_summary(metadata)
    print(json.dumps(metadata, indent=2, sort_keys=True))
    return metadata


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Package one locale shard artifact for the translation finalizer.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes changed/deleted lists, payload files, metadata.json, and GitHub output status.

Examples:
  LOCALE=fr LOCALE_SLUG=fr SOURCE_SHA=abc MODE=incremental SHARD_INDEX=0 SHARD_TOTAL=1 python .github/scripts/i18n/package_artifact.py
  LOCALE=zh-CN LOCALE_SLUG=zh-cn SOURCE_SHA=abc MODE=full SHARD_INDEX=2 SHARD_TOTAL=14 python .github/scripts/i18n/package_artifact.py
""",
    )
    parser.add_argument("--workspace", default=os.environ.get("GITHUB_WORKSPACE", "."), type=Path)
    parser.add_argument("--openclaw-sync-dir", default=".openclaw-sync", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    package_artifact(args.workspace.resolve(), args.openclaw_sync_dir)


if __name__ == "__main__":
    main()
