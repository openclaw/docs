#!/usr/bin/env python3
"""Remove locale pages whose English source page no longer exists.

Definition:
  This script mirrors the prune step from translate-locale-reusable.yml. It
  removes stale files under docs/<locale>/ when the corresponding docs/<rel>
  source file is gone, then removes empty directories.

Parameters:
  --docs-root: Docs directory. Default: docs.
  --locale: Locale directory to prune. Default: LOCALE environment variable.
  --source-path: Repeatable docs-relative .md/.mdx retirement selection. Omit
    to retain the full orphan sweep; an explicitly empty selection is invalid.

Outputs:
  Deletes stale locale files and empty locale directories in place. Prints the
  removed file count. Exit code is zero when the locale directory does not exist.

Examples:
  LOCALE=fr python .github/scripts/i18n/prune_stale_locale_pages.py
  python .github/scripts/i18n/prune_stale_locale_pages.py --docs-root /tmp/docs --locale zh-CN
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path, PureWindowsPath

from translation_plan import LOCALE_NAMES, is_locale_dir


def prune_stale_locale_pages(docs_root: Path, locale: str, source_paths: list[str] | None = None) -> int:
    if source_paths is not None:
        docs_root = docs_root.resolve()
    locale_root = docs_root / locale
    selected: list[Path] | None = None
    if source_paths is not None:
        if not source_paths:
            raise SystemExit("Empty retirement selection; pass at least one --source-path.")
        if locale not in LOCALE_NAMES:
            raise SystemExit(f"Invalid retirement locale: {locale!r}")
        selected = []
        seen: set[str] = set()
        # Validate the entire selection before unlinking even its first page.
        # Canonical paths and symlink-free ancestry keep deletion at its owner.
        for value in source_paths:
            rel = Path(value)
            if (
                not value or value != value.strip() or rel.is_absolute() or PureWindowsPath(value).drive
                or rel.as_posix() != value or "\\" in value or rel.suffix not in {".md", ".mdx"}
                or any(ord(char) < 32 or ord(char) == 127 for char in value)
                or any(part.startswith(".") for part in rel.parts)
                or rel.parts[0].lower() in {name.lower() for name in LOCALE_NAMES}
            ):
                raise SystemExit(f"Invalid retirement source path {value!r}; use a canonical docs-relative Markdown filename.")
            if value in seen:
                raise SystemExit(f"Duplicate retirement source path: {value!r}")
            seen.add(value)
            source, target = docs_root / rel, locale_root / rel
            for path in (source, target):
                while path != docs_root:
                    if path.is_symlink():
                        raise SystemExit(f"Retirement path crosses a symlink: {path}")
                    path = path.parent
            if is_locale_dir(docs_root / rel.parts[0]):
                raise SystemExit(f"Retirement source path belongs to a locale: {value!r}")
            if source.exists():
                raise SystemExit(f"English source still exists: {value!r}; select only retired sources.")
            if target.exists():
                if not target.is_file():
                    raise SystemExit(f"Retirement counterpart is not a file: {target}")
                selected.append(target)
    if not locale_root.exists():
        return 0

    removed = 0
    for path in sorted(locale_root.rglob("*") if selected is None else selected, reverse=True):
        if path.is_dir():
            if not any(path.iterdir()):
                path.rmdir()
            continue
        rel = path.relative_to(locale_root)
        source = docs_root / rel
        if not source.exists():
            path.unlink()
            removed += 1
            if selected is not None:
                parent = path.parent
                while parent != locale_root and not any(parent.iterdir()):
                    parent.rmdir()
                    parent = parent.parent

    if selected is None:
        for path in sorted(locale_root.rglob("*"), reverse=True):
            if path.is_dir() and not any(path.iterdir()):
                path.rmdir()
    return removed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove locale pages whose English source page no longer exists.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Deletes stale locale files and empty directories in place, then prints a removed count.

Examples:
  LOCALE=fr python .github/scripts/i18n/prune_stale_locale_pages.py
  python .github/scripts/i18n/prune_stale_locale_pages.py --docs-root /tmp/docs --locale zh-CN
  python .github/scripts/i18n/prune_stale_locale_pages.py --locale fr --source-path concepts/retired.md
""",
    )
    parser.add_argument("--docs-root", default="docs", type=Path)
    parser.add_argument("--locale", default=os.environ.get("LOCALE", ""))
    parser.add_argument("--source-path", action="append", help="Only prune this absent English source's counterpart; repeat for multiple paths.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.locale:
        raise SystemExit("missing locale: pass --locale or set LOCALE")
    removed = prune_stale_locale_pages(args.docs_root, args.locale, args.source_path)
    print(f"removed stale locale pages: {removed}")


if __name__ == "__main__":
    main()
