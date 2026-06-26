#!/usr/bin/env python3
"""Plan Translate Full locale canary and bounded batches.

Definition:
  This script owns the full-translation locale selection policy. It turns a
  manual target locale or an all-locale run into one canary locale plus bounded
  follow-up batches. GitHub Actions consumes the emitted JSON matrices.

Parameters:
  --target-locale: Locale slug/name to rerun, or all. Default: TARGET_LOCALE/all.
  --batch-size: Maximum locales per follow-up batch. Default: 4.

Outputs:
  GITHUB_OUTPUT receives locale_count, canary_locale, canary_locale_slug,
  selected_locales, and batch_1 through batch_6 JSON matrices. The step summary
  records the selected canary and batch count. Exits non-zero for unknown
  locales or oversized batch requests.

Examples:
  python .github/scripts/i18n/plan_full.py --target-locale all
  python .github/scripts/i18n/plan_full.py --target-locale fr --batch-size 2
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path


MAX_BATCHES = 6
DEFAULT_BATCH_SIZE = 4
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


def matrix_json(locales: list[Locale]) -> str:
    return json.dumps({"include": [locale.matrix_item() for locale in locales]}, separators=(",", ":"))


def append_outputs(selected: list[Locale], batches: list[list[Locale]]) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    canary = selected[0]
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"locale_count={len(selected)}\n")
        fh.write(f"canary_locale={canary.locale}\n")
        fh.write(f"canary_locale_slug={canary.locale_slug}\n")
        fh.write(f"selected_locales={','.join(locale.locale for locale in selected)}\n")
        for index in range(MAX_BATCHES):
            batch = batches[index] if index < len(batches) else []
            fh.write(f"batch_{index + 1}_count={len(batch)}\n")
            fh.write(f"batch_{index + 1}={matrix_json(batch)}\n")


def append_summary(target_locale: str, selected: list[Locale], batches: list[list[Locale]]) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary:
        return
    with Path(summary).open("a", encoding="utf-8") as fh:
        fh.write("### Translate Full locale plan\n\n")
        fh.write(f"- requested target: `{normalize_target(target_locale)}`\n")
        fh.write(f"- selected locales: `{', '.join(locale.locale for locale in selected)}`\n")
        fh.write(f"- canary locale: `{selected[0].locale}`\n")
        for index, batch in enumerate(batches, start=1):
            fh.write(f"- batch {index}: `{', '.join(locale.locale for locale in batch)}`\n")


def plan_full(target_locale: str, batch_size: int) -> dict[str, object]:
    selected = select_locales(target_locale)
    batches = build_batches(selected, batch_size)
    append_outputs(selected, batches)
    append_summary(target_locale, selected, batches)
    return {
        "selected": [locale.matrix_item() for locale in selected],
        "canary": selected[0].matrix_item(),
        "batches": [[locale.matrix_item() for locale in batch] for batch in batches],
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
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plan = plan_full(args.target_locale, args.batch_size)
    print(json.dumps(plan, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
