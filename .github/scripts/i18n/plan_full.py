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
  --target-docs-per-shard: Desired source documents per shard. Default: 250.
  --max-shards: Maximum shards per locale. Default: 4.

Outputs:
  GITHUB_OUTPUT receives locale_count, canary locale fields, selected_locales,
  shard_total, and batch_1 through batch_6 JSON matrices. Each batch exposes a
  shard matrix for translation jobs and a locale matrix for one finalizer per
  locale. The step summary records the selected canary and batch count. Exits
  non-zero for unknown locales or oversized batch requests.

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
    DEFAULT_MAX_SHARDS,
    DEFAULT_TARGET_DOCS_PER_SHARD,
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


def build_batches(selected: list[Locale], batch_size: int) -> list[list[Locale]]:
    if batch_size < 1 or batch_size > DEFAULT_BATCH_SIZE:
        raise SystemExit(f"invalid batch size {batch_size}; expected 1..{DEFAULT_BATCH_SIZE}")
    batches = [selected[index : index + batch_size] for index in range(0, len(selected), batch_size)]
    if len(batches) > MAX_BATCHES:
        raise SystemExit(f"full translation needs {len(batches)} batches; max supported is {MAX_BATCHES}")
    return batches


def append_outputs(selected: list[Locale], batches: list[list[Locale]], shard_total: int, source_docs: int) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    canary = selected[0]
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"locale_count={len(selected)}\n")
        fh.write(f"canary_locale={canary.locale}\n")
        fh.write(f"canary_locale_slug={canary.locale_slug}\n")
        fh.write(f"selected_locales={','.join(locale.locale for locale in selected)}\n")
        fh.write(f"source_doc_count={source_docs}\n")
        fh.write(f"shard_total={shard_total}\n")
        for index in range(MAX_BATCHES):
            batch = batches[index] if index < len(batches) else []
            fh.write(f"batch_{index + 1}_count={len(batch)}\n")
            fh.write(f"batch_{index + 1}={matrix_json(expand_shards(batch, shard_total))}\n")
            fh.write(f"batch_{index + 1}_locales={matrix_json([locale.matrix_item_with_shards(shard_total) for locale in batch])}\n")


def append_summary(target_locale: str, selected: list[Locale], batches: list[list[Locale]], shard_total: int, source_docs: int) -> None:
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
        for index, batch in enumerate(batches, start=1):
            fh.write(f"- batch {index}: `{', '.join(locale.locale for locale in batch)}`\n")


def plan_full(
    target_locale: str,
    batch_size: int,
    docs_root: Path | None = None,
    target_docs_per_shard: int = DEFAULT_TARGET_DOCS_PER_SHARD,
    max_shards: int = DEFAULT_MAX_SHARDS,
) -> dict[str, object]:
    selected = select_locales(target_locale)
    batches = build_batches(selected, batch_size)
    source_docs = source_doc_count(docs_root or Path("docs"))
    shard_total = shard_total_for_doc_count(source_docs, target_docs_per_shard, max_shards)
    append_outputs(selected, batches, shard_total, source_docs)
    append_summary(target_locale, selected, batches, shard_total, source_docs)
    return {
        "selected": [locale.matrix_item() for locale in selected],
        "canary": selected[0].matrix_item(),
        "source_doc_count": source_docs,
        "shard_total": shard_total,
        "batches": [expand_shards(batch, shard_total) for batch in batches],
        "batch_locales": [[locale.matrix_item_with_shards(shard_total) for locale in batch] for batch in batches],
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
    parser.add_argument("--target-docs-per-shard", default=DEFAULT_TARGET_DOCS_PER_SHARD, type=int)
    parser.add_argument("--max-shards", default=DEFAULT_MAX_SHARDS, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plan = plan_full(args.target_locale, args.batch_size, args.docs_root, args.target_docs_per_shard, args.max_shards)
    print(json.dumps(plan, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
