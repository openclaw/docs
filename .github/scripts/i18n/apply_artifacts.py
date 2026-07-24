#!/usr/bin/env python3
"""Apply downloaded locale shard artifacts to the docs tree.

Definition:
  This script mirrors the finalizer artifact-apply block from
  translate-finalize-reusable.yml. It validates artifact metadata, skips stale
  payload safely when the source changed, copies valid payload files, records
  incomplete shards, and writes the same GitHub outputs used by later steps.

Parameters:
  --source-sha: Source revision the artifacts must match.
  --mode: Translation mode for summary output.
  --shard-total: Expected shard count per locale.
  --expected-locales: Space-separated slug=locale pairs.
  --artifacts-root: Downloaded artifact directory.
  --skip-checkout-main: Test-only option that skips origin/main checkout.

Outputs:
  GITHUB_OUTPUT receives stale, base_source_sha, changed_count, and
  incomplete_count. The incomplete locale list is written to
  .openclaw-sync/i18n-incomplete-locales.txt. GITHUB_STEP_SUMMARY receives a
  finalizer summary.

Examples:
  python .github/scripts/i18n/apply_artifacts.py --source-sha abc --mode full --shard-total 14
  python .github/scripts/i18n/apply_artifacts.py --source-sha abc --mode incremental --shard-total 1 --expected-locales "fr=fr"
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
from dataclasses import dataclass, field
from pathlib import Path


DEFAULT_EXPECTED_LOCALES = (
    "zh-cn=zh-CN zh-tw=zh-TW ja-jp=ja-JP es=es pt-br=pt-BR ko=ko de=de fr=fr "
    "hi=hi ar=ar it=it vi=vi nl=nl fa=fa ru=ru tr=tr uk=uk id=id pl=pl th=th"
)
SOURCE_HASH_RE = re.compile(r"^x-i18n:\n(?:[ \t]+.*\n)*?[ \t]+source_hash: ([0-9a-f]{64})$", re.M)


@dataclass
class ApplyState:
    applied: list[str] = field(default_factory=list)
    no_changes: list[str] = field(default_factory=list)
    stale: list[str] = field(default_factory=list)
    invalid: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    skipped_stale_pages: list[str] = field(default_factory=list)
    skipped_stale_deletes: list[str] = field(default_factory=list)
    skipped_stale_tm: list[str] = field(default_factory=list)
    skipped_incomplete: list[str] = field(default_factory=list)
    seen: set[tuple[str, int]] = field(default_factory=set)


def run(args: list[str], check: bool = True) -> str:
    result = subprocess.run(args, check=False, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and result.returncode != 0:
        raise SystemExit(result.stderr.strip() or f"{' '.join(args)} failed")
    return result.stdout


def parse_expected(value: str) -> dict[str, str]:
    expected: dict[str, str] = {}
    for pair in value.split():
        slug, locale = pair.split("=", 1)
        expected[slug] = locale
    return expected


def artifact_label(locale: str, shard_index: int, expected_shard_total: int) -> str:
    if expected_shard_total == 1:
        return locale
    return f"{locale} shard {shard_index}/{expected_shard_total}"


def read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    return [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def source_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def translated_source_hash(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    match = SOURCE_HASH_RE.search(text)
    if not match:
        return ""
    return match.group(1).strip()


def locale_doc_source(locale: str, rel: str) -> Path | None:
    prefix = f"docs/{locale}/"
    if not rel.startswith(prefix):
        return None
    return Path("docs") / rel[len(prefix) :]


def tm_path(locale: str, rel: str) -> bool:
    return rel == f"docs/.i18n/{locale}.tm.jsonl"


def artifact_payload_issue(artifact: Path, metadata: dict[str, object], locale: str) -> str:
    try:
        changed = read_lines(artifact / "changed-files.txt")
        deleted = read_lines(artifact / "deleted-files.txt")
    except OSError as exc:
        return f"manifest read failed ({exc})"
    if len(changed) != len(set(changed)) or len(deleted) != len(set(deleted)):
        return "duplicate manifest path"
    if set(changed) & set(deleted):
        return "path appears in both changed and deleted manifests"
    for field, paths in (("changed_count", changed), ("deleted_count", deleted)):
        if field not in metadata:
            continue
        try:
            expected_count = int(metadata[field])
        except (TypeError, ValueError):
            return f"invalid {field}"
        if expected_count != len(paths):
            return f"{field} {expected_count} did not match manifest count {len(paths)}"
    for rel in changed + deleted:
        path = Path(rel)
        if path.is_absolute() or ".." in path.parts:
            return f"unsafe manifest path {rel}"
        if not (rel.startswith(f"docs/{locale}/") or tm_path(locale, rel)):
            return f"unexpected locale path {rel}"
    payload = artifact / "payload"
    for rel in changed:
        if not (payload / rel).is_file():
            return f"missing payload file {rel}"
    return ""


def should_apply_changed(source_current: bool, locale: str, rel: str, payload_file: Path) -> tuple[bool, str]:
    if source_current:
        return True, ""
    if tm_path(locale, rel):
        return False, f"{locale}: translation memory"
    source = locale_doc_source(locale, rel)
    if source is None or payload_file.suffix.lower() not in {".md", ".mdx"}:
        return False, f"{locale}: unsupported stale path {rel}"
    if not source.exists():
        return False, f"{locale}: source missing for {rel}"
    if translated_source_hash(payload_file) == source_hash(source):
        return True, ""
    return False, f"{locale}: {rel}"


def should_apply_deleted(source_current: bool, locale: str, rel: str) -> tuple[bool, str]:
    if source_current:
        return True, ""
    if tm_path(locale, rel):
        return False, f"{locale}: translation memory"
    source = locale_doc_source(locale, rel)
    if source is None:
        return False, f"{locale}: unsupported stale delete {rel}"
    if source.exists():
        return False, f"{locale}: {rel}"
    return True, ""


def artifact_stale_issue(artifact: Path, locale: str, source_current: bool) -> str:
    if source_current:
        return ""
    for rel in read_lines(artifact / "changed-files.txt"):
        apply_change, reason = should_apply_changed(False, locale, rel, artifact / "payload" / rel)
        if not apply_change:
            return reason
    for rel in read_lines(artifact / "deleted-files.txt"):
        apply_delete, reason = should_apply_deleted(False, locale, rel)
        if not apply_delete:
            return reason
    return ""


def checkout_latest_main(skip_checkout_main: bool) -> None:
    if skip_checkout_main:
        return
    run(["git", "fetch", "--quiet", "origin", "main:refs/remotes/origin/main"])
    run(["git", "checkout", "-B", "main", "refs/remotes/origin/main"])


def current_source_sha() -> str:
    source_json = run(["git", "show", "HEAD:.openclaw-sync/source.json"])
    try:
        return json.loads(source_json).get("sha") or ""
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid .openclaw-sync/source.json at HEAD: {exc}") from exc


def process_artifact(
    artifact: Path,
    expected: dict[str, str],
    expected_shard_total: int,
    source_sha: str,
    source_current: bool,
    complete_locales: set[str],
    state: ApplyState,
) -> None:
    metadata_path = artifact / "metadata.json"
    if not metadata_path.exists():
        state.invalid.append(f"{artifact.name}: missing metadata.json")
        return
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - preserve old broad metadata failure behavior.
        state.invalid.append(f"{artifact.name}: invalid metadata ({exc})")
        return
    if not isinstance(metadata, dict):
        state.invalid.append(f"{artifact.name}: metadata must be an object")
        return

    slug = metadata.get("locale_slug")
    locale = metadata.get("locale")
    if not isinstance(slug, str) or not isinstance(locale, str):
        state.invalid.append(f"{artifact.name}: locale metadata must be strings")
        return
    if slug not in expected or expected[slug] != locale:
        state.invalid.append(f"{artifact.name}: unexpected locale {locale!r}/{slug!r}")
        return
    try:
        shard_index = int(metadata.get("shard_index", 0))
        artifact_shard_total = int(metadata.get("shard_total", 1))
    except (TypeError, ValueError):
        state.invalid.append(f"{artifact.name}: invalid shard metadata")
        return
    if artifact_shard_total != expected_shard_total:
        state.invalid.append(f"{artifact.name}: shard_total {artifact_shard_total} did not match expected {expected_shard_total}")
        return
    if shard_index < 0 or shard_index >= expected_shard_total:
        state.invalid.append(f"{artifact.name}: invalid shard_index {shard_index}")
        return
    if metadata.get("source_sha") != source_sha:
        state.stale.append(f"{artifact_label(locale, shard_index, expected_shard_total)}: {metadata.get('source_sha')}")
        return

    state.seen.add((slug, shard_index))
    failed_reason = metadata.get("failed_reason") or ""
    if failed_reason:
        state.failed.append(f"{artifact_label(locale, shard_index, expected_shard_total)}: {failed_reason}")
        return
    if slug not in complete_locales:
        state.skipped_incomplete.append(artifact_label(locale, shard_index, expected_shard_total))
        return

    changed = read_lines(artifact / "changed-files.txt")
    deleted = read_lines(artifact / "deleted-files.txt")
    payload = artifact / "payload"
    applied_any = False

    for rel in deleted:
        apply_delete, reason = should_apply_deleted(source_current, locale, rel)
        if not apply_delete:
            state.skipped_stale_deletes.append(reason)
            continue
        path = Path(rel)
        if path.exists():
            path.unlink()
            applied_any = True

    for rel in changed:
        source = payload / rel
        if not source.exists():
            state.invalid.append(f"{artifact.name}: missing payload file {rel}")
            continue
        apply_change, reason = should_apply_changed(source_current, locale, rel, source)
        if not apply_change:
            if "translation memory" in reason:
                state.skipped_stale_tm.append(reason)
            else:
                state.skipped_stale_pages.append(reason)
            continue
        target = Path(rel)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        applied_any = True

    if applied_any:
        state.applied.append(artifact_label(locale, shard_index, expected_shard_total))
    elif changed or deleted:
        state.no_changes.append(f"{artifact_label(locale, shard_index, expected_shard_total)} (all stale)")
    else:
        state.no_changes.append(artifact_label(locale, shard_index, expected_shard_total))


def write_outputs(current: str, changed_count: int, incomplete_count: int) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write("stale=false\n")
        fh.write(f"base_source_sha={current}\n")
        fh.write(f"changed_count={changed_count}\n")
        fh.write(f"incomplete_count={incomplete_count}\n")


def write_summary(mode: str, expected_shard_total: int, source_sha: str, current: str, changed_count: int, state: ApplyState, missing_or_failed: list[str]) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary:
        return
    with Path(summary).open("a", encoding="utf-8") as fh:
        fh.write("### Translation finalizer\n\n")
        fh.write(f"- mode: `{mode}`\n")
        fh.write(f"- shard total: `{expected_shard_total}`\n")
        fh.write(f"- artifact source: `{source_sha}`\n")
        fh.write(f"- current source: `{current}`\n")
        fh.write(f"- changed paths: `{changed_count}`\n")
        if state.applied:
            fh.write(f"- applied artifacts: {', '.join(state.applied)}\n")
        if state.no_changes:
            fh.write(f"- artifacts with no changes: {', '.join(state.no_changes)}\n")
        if missing_or_failed:
            fh.write(f"- missing or failed artifacts: {', '.join(missing_or_failed)}\n")
        if state.skipped_incomplete:
            fh.write(f"- incomplete locales left unchanged: {', '.join(state.skipped_incomplete)}\n")
        if state.stale:
            fh.write(f"- stale artifacts ignored: {', '.join(state.stale)}\n")
        if state.skipped_stale_pages:
            sample = ", ".join(state.skipped_stale_pages[:20])
            fh.write(f"- stale pages skipped: `{len(state.skipped_stale_pages)}`")
            if sample:
                fh.write(f" ({sample})")
            fh.write("\n")
        if state.skipped_stale_deletes:
            sample = ", ".join(state.skipped_stale_deletes[:20])
            fh.write(f"- stale deletes skipped: `{len(state.skipped_stale_deletes)}`")
            if sample:
                fh.write(f" ({sample})")
            fh.write("\n")
        if state.skipped_stale_tm:
            sample = ", ".join(sorted(set(state.skipped_stale_tm))[:20])
            fh.write(f"- stale translation memory skipped: `{len(state.skipped_stale_tm)}`")
            if sample:
                fh.write(f" ({sample})")
            fh.write("\n")
        if state.invalid:
            fh.write(f"- invalid artifacts ignored: {'; '.join(state.invalid)}\n")


def apply_artifacts(
    source_sha: str,
    mode: str,
    shard_total: int,
    expected_locales: str,
    artifacts_root: Path,
    skip_checkout_main: bool = False,
) -> dict[str, int | str]:
    if shard_total < 1:
        raise SystemExit(f"invalid shard_total: {shard_total}")
    checkout_latest_main(skip_checkout_main)
    current = current_source_sha()
    source_current = current == source_sha
    expected = parse_expected(expected_locales)
    state = ApplyState()
    artifacts = sorted(path for path in artifacts_root.iterdir() if path.is_dir()) if artifacts_root.exists() else []
    shard_counts: dict[tuple[str, int], int] = {}
    blocked_locales: set[str] = set()
    preflight_issues: list[str] = []

    for artifact in artifacts:
        metadata_path = artifact / "metadata.json"
        if not metadata_path.exists():
            continue
        try:
            metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001 - process_artifact reports the exact metadata error.
            continue
        if not isinstance(metadata, dict):
            continue
        slug = metadata.get("locale_slug")
        locale = metadata.get("locale")
        if not isinstance(slug, str) or not isinstance(locale, str):
            continue
        if slug not in expected or expected[slug] != locale:
            continue
        try:
            shard_index = int(metadata.get("shard_index", 0))
            artifact_shard_total = int(metadata.get("shard_total", 1))
        except (TypeError, ValueError):
            continue
        if artifact_shard_total != shard_total or shard_index < 0 or shard_index >= shard_total:
            continue
        if metadata.get("source_sha") != source_sha:
            continue
        key = (slug, shard_index)
        shard_counts[key] = shard_counts.get(key, 0) + 1
        if metadata.get("failed_reason"):
            blocked_locales.add(slug)
            continue
        payload_issue = artifact_payload_issue(artifact, metadata, locale)
        if payload_issue:
            blocked_locales.add(slug)
            preflight_issues.append(f"{artifact.name}: {payload_issue}")
            continue
        stale_issue = artifact_stale_issue(artifact, locale, source_current)
        if stale_issue:
            blocked_locales.add(slug)
            preflight_issues.append(f"{artifact.name}: stale payload ({stale_issue})")

    for slug in expected:
        for shard_index in range(shard_total):
            count = shard_counts.get((slug, shard_index), 0)
            if count != 1:
                blocked_locales.add(slug)
            if count > 1:
                preflight_issues.append(f"{artifact_label(expected[slug], shard_index, shard_total)}: duplicate artifacts")
    complete_locales = set(expected) - blocked_locales
    state.invalid.extend(preflight_issues)

    for artifact in artifacts:
        process_artifact(artifact, expected, shard_total, source_sha, source_current, complete_locales, state)

    missing = [
        artifact_label(expected[slug], shard_index, shard_total)
        for slug in expected
        for shard_index in range(shard_total)
        if (slug, shard_index) not in state.seen
    ]
    missing_or_failed = missing + state.failed + state.invalid

    status = run(["git", "status", "--porcelain", "--untracked-files=all", "--", "docs"]).splitlines()
    changed_count = len(status)

    incomplete_path = Path(".openclaw-sync/i18n-incomplete-locales.txt")
    incomplete_path.parent.mkdir(exist_ok=True)
    incomplete_path.write_text("\n".join(missing_or_failed) + ("\n" if missing_or_failed else ""), encoding="utf-8")
    write_outputs(current, changed_count, len(missing_or_failed))
    write_summary(mode, shard_total, source_sha, current, changed_count, state, missing_or_failed)
    print(f"changed paths: {changed_count}")
    return {"base_source_sha": current, "changed_count": changed_count, "incomplete_count": len(missing_or_failed)}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply downloaded locale artifacts to the docs tree.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Applies valid payload files, records incomplete locales, and writes GitHub outputs.

Examples:
  python .github/scripts/i18n/apply_artifacts.py --source-sha abc --mode full --shard-total 14
  python .github/scripts/i18n/apply_artifacts.py --source-sha abc --mode incremental --shard-total 1 --expected-locales "fr=fr"
""",
    )
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--mode", required=True)
    parser.add_argument("--shard-total", required=True, type=int)
    parser.add_argument("--expected-locales", default=DEFAULT_EXPECTED_LOCALES)
    parser.add_argument("--artifacts-root", default=".openclaw-sync/i18n-artifacts", type=Path)
    parser.add_argument("--skip-checkout-main", action="store_true", help="Skip origin/main checkout for local fixture tests.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    apply_artifacts(
        source_sha=args.source_sha,
        mode=args.mode,
        shard_total=args.shard_total,
        expected_locales=args.expected_locales,
        artifacts_root=args.artifacts_root,
        skip_checkout_main=args.skip_checkout_main,
    )


if __name__ == "__main__":
    main()
