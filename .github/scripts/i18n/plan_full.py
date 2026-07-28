#!/usr/bin/env python3
"""Plan Translate Full locale canary and bounded batches.

Definition:
  This script owns the full-translation locale selection policy. It turns a
  manual target locale or an all-locale run into one canary locale plus bounded
  follow-up batches. GitHub Actions consumes the emitted JSON matrices.

Parameters:
  --target-locale: Locale slug/name to rerun, or all. Default: TARGET_LOCALE/all.
  --batch-size: Maximum locales per follow-up batch. Default: 4.
  --docs-root: Docs directory used to size full-translation shards. Default: docs.
  --target-docs-per-shard: Desired source documents per shard. Default: 125.
  --max-shards: Maximum shards per locale. Default: 8.
  --resume-artifacts-root: Prior run artifacts. When set, rerun only failed,
    missing, or unusable shards and reuse successful artifacts in finalization.
  --source-sha: Required with --resume-artifacts-root. Rejects stale artifacts.

Outputs:
  GITHUB_OUTPUT receives locale_count, canary locale fields, selected_locales,
  expected_locales, shard_total, and batch_1 through batch_6 JSON matrices.
  The step summary records the selected canary and batch count. Exits non-zero
  for unknown locales or oversized batch requests.

Examples:
  python .github/scripts/i18n/plan_full.py --target-locale all
  python .github/scripts/i18n/plan_full.py --target-locale fr --batch-size 2
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from translation_plan import (
    Locale,
    expand_shards,
    matrix_json,
    normalize_target,
    select_locales,
    shard_total_for_doc_count,
    source_doc_count,
)


MAX_BATCHES = 6
DEFAULT_BATCH_SIZE = 4
RESUME_BATCH_SIZE = 28
FULL_TARGET_DOCS_PER_SHARD = 125
FULL_MAX_SHARDS = 8


def build_batches(selected: list[Locale], batch_size: int) -> list[list[Locale]]:
    if batch_size < 1 or batch_size > DEFAULT_BATCH_SIZE:
        raise SystemExit(f"invalid batch size {batch_size}; expected 1..{DEFAULT_BATCH_SIZE}")
    batches = [selected[index : index + batch_size] for index in range(0, len(selected), batch_size)]
    if len(batches) > MAX_BATCHES:
        raise SystemExit(f"full translation needs {len(batches)} batches; max supported is {MAX_BATCHES}")
    return batches


def artifact_is_usable(artifact: Path, metadata: dict[str, object]) -> bool:
    changed_path = artifact / "changed-files.txt"
    deleted_path = artifact / "deleted-files.txt"
    if not changed_path.is_file() or not deleted_path.is_file():
        return False
    changed = [line for line in changed_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    deleted = [line for line in deleted_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    try:
        if int(metadata.get("changed_count") or 0) != len(changed):
            return False
        if int(metadata.get("deleted_count") or 0) != len(deleted):
            return False
    except (TypeError, ValueError):
        return False
    payload = artifact / "payload"
    return all((payload / path).is_file() for path in changed)


def build_resume_plan(
    selected: list[Locale],
    shard_total: int,
    artifacts_root: Path,
    source_sha: str,
) -> list[list[dict[str, str]]]:
    if not source_sha:
        raise SystemExit("--source-sha is required with --resume-artifacts-root")
    artifacts: dict[tuple[str, int], list[tuple[Path, dict[str, object]]]] = {}
    selected_slugs = {locale.locale_slug for locale in selected}
    for artifact in sorted(path for path in artifacts_root.rglob("*") if path.is_dir() and (path / "metadata.json").is_file()):
        try:
            metadata = json.loads((artifact / "metadata.json").read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(metadata, dict) or metadata.get("artifact_role", "locale") == "canary":
            continue
        slug = metadata.get("locale_slug")
        if slug not in selected_slugs:
            continue
        if metadata.get("source_sha") != source_sha:
            raise SystemExit(f"resume artifact {artifact.name} belongs to source {metadata.get('source_sha')}, expected {source_sha}")
        if metadata.get("mode") != "full":
            raise SystemExit(f"resume artifact {artifact.name} is not from a full translation run")
        try:
            shard_index = int(metadata.get("shard_index"))
            artifact_shard_total = int(metadata.get("shard_total"))
        except (TypeError, ValueError) as exc:
            raise SystemExit(f"resume artifact {artifact.name} has invalid shard metadata") from exc
        if artifact_shard_total != shard_total:
            raise SystemExit(
                f"resume artifact {artifact.name} uses {artifact_shard_total} shards, expected {shard_total}"
            )
        artifacts.setdefault((str(slug), shard_index), []).append((artifact, metadata))

    failed_shards: list[dict[str, str]] = []
    for locale in selected:
        for shard_index in range(shard_total):
            candidates = artifacts.get((locale.locale_slug, shard_index), [])
            if len(candidates) > 1:
                raise SystemExit(f"resume run contains duplicate artifacts for {locale.locale} shard {shard_index}/{shard_total}")
            usable = False
            if candidates:
                artifact, metadata = candidates[0]
                usable = not metadata.get("failed_reason") and artifact_is_usable(artifact, metadata)
            if usable:
                continue
            failed_shards.append(
                {
                    "locale": locale.locale,
                    "locale_slug": locale.locale_slug,
                    "shard_index": str(shard_index),
                    "shard_total": str(shard_total),
                }
            )
    batches = [
        failed_shards[index : index + RESUME_BATCH_SIZE]
        for index in range(0, len(failed_shards), RESUME_BATCH_SIZE)
    ]
    if len(batches) > MAX_BATCHES:
        raise SystemExit(f"resume needs {len(batches)} batches; max supported is {MAX_BATCHES}")
    return batches


def append_outputs(
    selected: list[Locale],
    batches: list[list[dict[str, str]]],
    shard_total: int,
    source_docs: int,
    resume_mode: bool,
    translation_required: bool,
) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    canary = selected[0]
    expected_locales = " ".join(f"{locale.locale_slug}={locale.locale}" for locale in selected)
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"locale_count={len(selected)}\n")
        fh.write(f"canary_locale={canary.locale}\n")
        fh.write(f"canary_locale_slug={canary.locale_slug}\n")
        fh.write(f"selected_locales={','.join(locale.locale for locale in selected)}\n")
        fh.write(f"expected_locales={expected_locales}\n")
        fh.write(f"source_doc_count={source_docs}\n")
        fh.write(f"shard_total={shard_total}\n")
        fh.write(f"resume_mode={'true' if resume_mode else 'false'}\n")
        fh.write(f"translation_required={'true' if translation_required else 'false'}\n")
        for index in range(MAX_BATCHES):
            batch = batches[index] if index < len(batches) else []
            fh.write(f"batch_{index + 1}_count={len(batch)}\n")
            fh.write(f"batch_{index + 1}={matrix_json(batch)}\n")


def append_summary(
    target_locale: str,
    selected: list[Locale],
    batches: list[list[dict[str, str]]],
    shard_total: int,
    source_docs: int,
    resume_mode: bool,
    translation_required: bool,
) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary:
        return
    with Path(summary).open("a", encoding="utf-8") as fh:
        fh.write("### Translate Full locale plan\n\n")
        fh.write(f"- requested target: `{normalize_target(target_locale)}`\n")
        fh.write(f"- selected locales: `{', '.join(locale.locale for locale in selected)}`\n")
        fh.write(f"- canary locale: `{selected[0].locale}`\n")
        fh.write(f"- source docs: `{source_docs}`\n")
        fh.write(f"- shards per locale: `{shard_total}`\n")
        fh.write(f"- resume mode: `{'true' if resume_mode else 'false'}`\n")
        fh.write(f"- translation required: `{'true' if translation_required else 'false'}`\n")
        for index, batch in enumerate(batches, start=1):
            items = ", ".join(f"{item['locale']}:{item['shard_index']}" for item in batch)
            fh.write(f"- batch {index}: `{items}`\n")


def plan_full(
    target_locale: str,
    batch_size: int,
    docs_root: Path | None = None,
    target_docs_per_shard: int = FULL_TARGET_DOCS_PER_SHARD,
    max_shards: int = FULL_MAX_SHARDS,
    resume_artifacts_root: Path | None = None,
    source_sha: str = "",
) -> dict[str, object]:
    selected = select_locales(target_locale)
    source_docs = source_doc_count(docs_root or Path("docs"))
    shard_total = shard_total_for_doc_count(source_docs, target_docs_per_shard, max_shards)
    resume_mode = resume_artifacts_root is not None
    if resume_artifacts_root is not None:
        matrix_batches = build_resume_plan(selected, shard_total, resume_artifacts_root, source_sha)
    else:
        batches = build_batches(selected, batch_size)
        matrix_batches = [expand_shards(batch, shard_total) for batch in batches]
    translation_required = any(matrix_batches)
    expected_locales = " ".join(f"{locale.locale_slug}={locale.locale}" for locale in selected)
    append_outputs(selected, matrix_batches, shard_total, source_docs, resume_mode, translation_required)
    append_summary(
        target_locale,
        selected,
        matrix_batches,
        shard_total,
        source_docs,
        resume_mode,
        translation_required,
    )
    return {
        "selected": [locale.matrix_item() for locale in selected],
        "canary": selected[0].matrix_item(),
        "expected_locales": expected_locales,
        "source_doc_count": source_docs,
        "shard_total": shard_total,
        "resume_mode": resume_mode,
        "translation_required": translation_required,
        "batches": matrix_batches,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Plan Translate Full locale canary and bounded follow-up batches.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes canary locale fields and batch_1..batch_6 JSON matrices to GITHUB_OUTPUT.

Examples:
  python .github/scripts/i18n/plan_full.py --target-locale all
  TARGET_LOCALE=fr python .github/scripts/i18n/plan_full.py --batch-size 2
""",
    )
    parser.add_argument("--target-locale", default=os.environ.get("TARGET_LOCALE", "all"))
    parser.add_argument("--batch-size", default=DEFAULT_BATCH_SIZE, type=int)
    parser.add_argument("--docs-root", default="docs", type=Path)
    parser.add_argument("--target-docs-per-shard", default=FULL_TARGET_DOCS_PER_SHARD, type=int)
    parser.add_argument("--max-shards", default=FULL_MAX_SHARDS, type=int)
    parser.add_argument("--resume-artifacts-root", type=Path)
    parser.add_argument("--source-sha", default=os.environ.get("SOURCE_SHA", ""))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plan = plan_full(
        args.target_locale,
        args.batch_size,
        args.docs_root,
        args.target_docs_per_shard,
        args.max_shards,
        args.resume_artifacts_root,
        args.source_sha,
    )
    print(json.dumps(plan, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
