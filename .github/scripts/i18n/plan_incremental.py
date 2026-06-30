#!/usr/bin/env python3
"""Plan Translate Incremental locale shard matrix.

Definition:
  This script plans the incremental translation matrix from the same shared
  shard policy used by Translate Full. GitHub Actions consumes the emitted
  JSON matrix so incremental translation does not run one oversized locale job.

Parameters:
  --docs-root: Docs directory used to size shards. Default: docs.
  --target-docs-per-shard: Desired source documents per shard. Default: 250.
  --max-shards: Maximum shards per locale. Default: 4.

Outputs:
  GITHUB_OUTPUT receives locale_count, source_doc_count, shard_total, and
  matrix. GITHUB_STEP_SUMMARY receives a short plan summary. Stdout prints the
  same plan as formatted JSON for local inspection.

Examples:
  python .github/scripts/i18n/plan_incremental.py
  python .github/scripts/i18n/plan_incremental.py --target-docs-per-shard 100 --max-shards 4
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from translation_plan import (
    DEFAULT_MAX_SHARDS,
    DEFAULT_TARGET_DOCS_PER_SHARD,
    all_locales,
    expand_shards,
    matrix_json,
    shard_total_for_doc_count,
    source_doc_count,
)


def append_outputs(locale_count: int, source_docs: int, shard_total: int, matrix: str) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"locale_count={locale_count}\n")
        fh.write(f"source_doc_count={source_docs}\n")
        fh.write(f"shard_total={shard_total}\n")
        fh.write(f"matrix={matrix}\n")


def append_summary(locale_count: int, source_docs: int, shard_total: int) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary:
        return
    with Path(summary).open("a", encoding="utf-8") as fh:
        fh.write("### Translate Incremental shard plan\n\n")
        fh.write(f"- selected locales: `{locale_count}`\n")
        fh.write(f"- source docs: `{source_docs}`\n")
        fh.write(f"- shards per locale: `{shard_total}`\n")
        fh.write(f"- translation jobs: `{locale_count * shard_total}`\n")


def plan_incremental(
    docs_root: Path | None = None,
    target_docs_per_shard: int = DEFAULT_TARGET_DOCS_PER_SHARD,
    max_shards: int = DEFAULT_MAX_SHARDS,
) -> dict[str, object]:
    locales = all_locales()
    source_docs = source_doc_count(docs_root or Path("docs"))
    shard_total = shard_total_for_doc_count(source_docs, target_docs_per_shard, max_shards)
    shards = expand_shards(locales, shard_total)
    matrix = matrix_json(shards)
    append_outputs(len(locales), source_docs, shard_total, matrix)
    append_summary(len(locales), source_docs, shard_total)
    return {
        "locale_count": len(locales),
        "source_doc_count": source_docs,
        "shard_total": shard_total,
        "matrix": {"include": shards},
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Plan Translate Incremental locale shard matrix.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes locale_count, source_doc_count, shard_total, and matrix to GITHUB_OUTPUT.

Examples:
  python .github/scripts/i18n/plan_incremental.py
  python .github/scripts/i18n/plan_incremental.py --target-docs-per-shard 100 --max-shards 4
""",
    )
    parser.add_argument("--docs-root", default="docs", type=Path)
    parser.add_argument("--target-docs-per-shard", default=DEFAULT_TARGET_DOCS_PER_SHARD, type=int)
    parser.add_argument("--max-shards", default=DEFAULT_MAX_SHARDS, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plan = plan_incremental(args.docs_root, args.target_docs_per_shard, args.max_shards)
    print(json.dumps(plan, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
