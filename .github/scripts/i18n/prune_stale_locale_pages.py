#!/usr/bin/env python3
"""Remove locale pages whose English source page no longer exists.

Definition:
  This script mirrors the prune step from translate-locale-reusable.yml. It
  removes stale files under docs/<locale>/ when the corresponding docs/<rel>
  source file is gone, then removes empty directories.

Parameters:
  --docs-root: Docs directory. Default: docs.
  --locale: Locale directory to prune. Default: LOCALE environment variable.

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
from pathlib import Path


def prune_stale_locale_pages(docs_root: Path, locale: str) -> int:
    locale_root = docs_root / locale
    if not locale_root.exists():
        return 0

    removed = 0
    for path in sorted(locale_root.rglob("*"), reverse=True):
        if path.is_dir():
            if not any(path.iterdir()):
                path.rmdir()
            continue
        rel = path.relative_to(locale_root)
        source = docs_root / rel
        if not source.exists():
            path.unlink()
            removed += 1

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
""",
    )
    parser.add_argument("--docs-root", default="docs", type=Path)
    parser.add_argument("--locale", default=os.environ.get("LOCALE", ""))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.locale:
        raise SystemExit("missing locale: pass --locale or set LOCALE")
    removed = prune_stale_locale_pages(args.docs_root, args.locale)
    print(f"removed stale locale pages: {removed}")


if __name__ == "__main__":
    main()
