#!/usr/bin/env python3
"""Remove localized outputs selected for one full-translation shard.

Definition:
  Full translation retries preserve successful pages by avoiding overwrite after
  the first pass. This script removes the shard's old localized outputs once so
  only pages produced by the current worker can satisfy later strict passes.

Parameters:
  --docs-root: Docs directory. Default: docs.
  --pending-file: Absolute-source manifest produced by build_pending_manifest.py.
  --locale: Locale output directory. Default: LOCALE environment variable.

Outputs:
  Deletes only mapped Markdown/MDX files under docs/<locale>/ and prints the
  removed count. Invalid or escaping manifest paths fail before any deletion.

Examples:
  LOCALE=hi python .github/scripts/i18n/clear_pending_locale_outputs.py --pending-file .openclaw-sync/docs-i18n-hi-s0of6.txt
  python .github/scripts/i18n/clear_pending_locale_outputs.py --docs-root /tmp/docs --pending-file /tmp/pending.txt --locale de
"""

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path


LOCALE_RE = re.compile(r"[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\Z")


def validate_locale(locale: str) -> None:
    locale_path = Path(locale)
    if (
        not locale
        or locale_path.is_absolute()
        or locale_path.anchor
        or locale_path.parts != (locale,)
        or not LOCALE_RE.fullmatch(locale)
    ):
        raise SystemExit(f"invalid locale: {locale}")


def pending_locale_outputs(docs_root: Path, pending_file: Path, locale: str) -> list[Path]:
    validate_locale(locale)
    docs_root = docs_root.resolve()
    locale_root = docs_root / locale
    if locale_root.is_symlink():
        raise SystemExit(f"locale output directory must not be a symlink: {locale_root}")

    outputs: list[Path] = []
    for raw_line in pending_file.read_text(encoding="utf-8").splitlines():
        value = raw_line.strip()
        if not value:
            continue
        source = Path(value)
        if not source.is_absolute():
            raise SystemExit(f"pending source path must be absolute: {value}")
        resolved_source = source.resolve()
        try:
            resolved_source.relative_to(docs_root)
        except ValueError as exc:
            raise SystemExit(f"pending source path must stay under docs: {value}") from exc
        try:
            rel = source.relative_to(docs_root)
        except ValueError as exc:
            raise SystemExit(f"pending source path must be rooted under docs: {value}") from exc
        if source != resolved_source:
            raise SystemExit(f"pending source path must be canonical and must not use symlinks: {value}")
        if resolved_source.suffix.lower() not in {".md", ".mdx"}:
            raise SystemExit(f"pending source path must be Markdown or MDX: {value}")
        if not resolved_source.is_file():
            raise SystemExit(f"pending source path must be an existing file: {value}")

        output = locale_root / rel
        if output.exists() or output.is_symlink():
            parent = locale_root
            for part in rel.parent.parts:
                parent /= part
                if parent.is_symlink():
                    raise SystemExit(f"localized output parent must not be a symlink: {parent}")
            try:
                output.parent.resolve().relative_to(locale_root.resolve())
            except ValueError as exc:
                raise SystemExit(f"localized output path must stay under locale root: {output}") from exc
        outputs.append(output)
    return sorted(set(outputs))


def clear_pending_locale_outputs(docs_root: Path, pending_file: Path, locale: str) -> int:
    outputs = pending_locale_outputs(docs_root, pending_file, locale)
    removed = 0
    for output in outputs:
        if output.exists() or output.is_symlink():
            output.unlink()
            removed += 1
    return removed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove localized outputs selected for one full-translation shard.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Deletes mapped docs/<locale> Markdown/MDX files and prints a removed count.

Examples:
  LOCALE=hi python .github/scripts/i18n/clear_pending_locale_outputs.py --pending-file .openclaw-sync/docs-i18n-hi-s0of6.txt
  python .github/scripts/i18n/clear_pending_locale_outputs.py --docs-root /tmp/docs --pending-file /tmp/pending.txt --locale de
""",
    )
    parser.add_argument("--docs-root", default="docs", type=Path)
    parser.add_argument("--pending-file", required=True, type=Path)
    parser.add_argument("--locale", default=os.environ.get("LOCALE", ""))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.locale:
        raise SystemExit("missing locale: pass --locale or set LOCALE")
    removed = clear_pending_locale_outputs(args.docs_root, args.pending_file, args.locale)
    print(f"removed pending locale outputs: {removed}")


if __name__ == "__main__":
    main()
