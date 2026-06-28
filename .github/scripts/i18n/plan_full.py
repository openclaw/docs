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
import math
import os
import re
from dataclasses import dataclass
from pathlib import Path


MAX_BATCHES = 6
DEFAULT_BATCH_SIZE = 4
DEFAULT_TARGET_DOCS_PER_SHARD = 250
DEFAULT_MAX_SHARDS = 4
LOCALE_DIR_RE = re.compile(r"^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$")
LOCALES: tuple[tuple[str, str], ...] = (
    ("zh-CN", "zh-cn"),
    ("zh-TW", "zh-tw"),
    ("ja-JP", "ja-jp"),
    ("es", "es"),
    ("pt-BR", "pt-br"),
    ("ko", "ko"),
    ("de", "de"),
    ("fr", "fr"),
    ("hi", "hi"),
    ("ar", "ar"),
    ("it", "it"),
    ("vi", "vi"),
    ("nl", "nl"),
    ("fa", "fa"),
    ("ru", "ru"),
    ("tr", "tr"),
    ("uk", "uk"),
    ("id", "id"),
    ("pl", "pl"),
    ("th", "th"),
)


@dataclass(frozen=True)
class Locale:
    locale: str
    locale_slug: str

    def matrix_item(self) -> dict[str, str]:
        return {"locale": self.locale, "locale_slug": self.locale_slug}

    def matrix_item_with_shards(self, shard_total: int) -> dict[str, str]:
        item = self.matrix_item()
        item["shard_total"] = str(shard_total)
        return item


def is_locale_dir(path: Path) -> bool:
    return path.is_dir() and LOCALE_DIR_RE.match(path.name) is not None and (path / ".i18n" / "README.md").exists()


def source_doc_count(docs_root: Path) -> int:
    locale_dirs = {path.name for path in docs_root.iterdir() if is_locale_dir(path)}
    count = 0
    for path in docs_root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in {".md", ".mdx"}:
            continue
        rel = path.relative_to(docs_root)
        parts = rel.parts
        if parts and parts[0] in locale_dirs:
            continue
        rel_posix = rel.as_posix()
        if rel_posix.startswith(".i18n/") or rel_posix.startswith(".generated/"):
            continue
        count += 1
    return count


def shard_total_for_doc_count(doc_count: int, target_docs_per_shard: int, max_shards: int) -> int:
    if target_docs_per_shard < 1:
        raise SystemExit(f"invalid target docs per shard: {target_docs_per_shard}")
    if max_shards < 1:
        raise SystemExit(f"invalid max shards: {max_shards}")
    return max(1, min(max_shards, math.ceil(doc_count / target_docs_per_shard)))


def expand_shards(batch: list[Locale], shard_total: int) -> list[dict[str, str]]:
    return [
        {
            "locale": locale.locale,
            "locale_slug": locale.locale_slug,
            "shard_index": str(shard_index),
            "shard_total": str(shard_total),
        }
        for locale in batch
        for shard_index in range(shard_total)
    ]


def all_locales() -> list[Locale]:
    return [Locale(locale, slug) for locale, slug in LOCALES]


def normalize_target(value: str) -> str:
    return (value or "all").strip()


def select_locales(target_locale: str) -> list[Locale]:
    target = normalize_target(target_locale)
    locales = all_locales()
    if target.lower() == "all":
        return locales
    for locale in locales:
        if target in {locale.locale, locale.locale_slug}:
            return [locale]
    allowed = ", ".join(["all", *(locale.locale_slug for locale in locales)])
    raise SystemExit(f"unknown target locale {target!r}; expected one of: {allowed}")


def build_batches(selected: list[Locale], batch_size: int) -> list[list[Locale]]:
    if batch_size < 1 or batch_size > DEFAULT_BATCH_SIZE:
        raise SystemExit(f"invalid batch size {batch_size}; expected 1..{DEFAULT_BATCH_SIZE}")
    batches = [selected[index : index + batch_size] for index in range(0, len(selected), batch_size)]
    if len(batches) > MAX_BATCHES:
        raise SystemExit(f"full translation needs {len(batches)} batches; max supported is {MAX_BATCHES}")
    return batches


def matrix_json(items: list[dict[str, str]]) -> str:
    return json.dumps({"include": items}, separators=(",", ":"))


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
