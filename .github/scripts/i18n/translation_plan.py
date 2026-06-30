"""Shared translation planning helpers.

Definition:
  This module owns locale selection, source-doc discovery, and shard expansion
  for translation workflow control scripts. Both full and incremental
  workflows call these helpers so shard sizing cannot drift between lanes.

Parameters:
  Functions accept locale selectors, docs roots, batch sizes, and shard sizing
  limits. This module has no CLI parameters.

Outputs:
  Returns locale matrix dictionaries and source document counts. It does not
  read or write GitHub output files by itself.

Examples:
  from translation_plan import all_locales
  from translation_plan import shard_total_for_doc_count
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path


DEFAULT_TARGET_DOCS_PER_SHARD = 250
DEFAULT_MAX_SHARDS = 4

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

LOCALE_NAMES = frozenset(locale for locale, _slug in LOCALES)


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


def is_supported_locale_dir(path: Path) -> bool:
    return path.is_dir() and path.name in LOCALE_NAMES


def is_locale_dir(path: Path) -> bool:
    return is_supported_locale_dir(path) or (path.is_dir() and (path / ".i18n" / "README.md").exists())


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


def shard_total_for_doc_count(
    doc_count: int,
    target_docs_per_shard: int = DEFAULT_TARGET_DOCS_PER_SHARD,
    max_shards: int = DEFAULT_MAX_SHARDS,
) -> int:
    if target_docs_per_shard < 1:
        raise SystemExit(f"invalid target docs per shard: {target_docs_per_shard}")
    if max_shards < 1:
        raise SystemExit(f"invalid max shards: {max_shards}")
    return max(1, min(max_shards, math.ceil(doc_count / target_docs_per_shard)))


def expand_shards(locales: list[Locale], shard_total: int) -> list[dict[str, str]]:
    return [
        {
            "locale": locale.locale,
            "locale_slug": locale.locale_slug,
            "shard_index": str(shard_index),
            "shard_total": str(shard_total),
        }
        for locale in locales
        for shard_index in range(shard_total)
    ]


def matrix_json(items: list[dict[str, str]]) -> str:
    return json.dumps({"include": items}, separators=(",", ":"))


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
