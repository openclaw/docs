#!/usr/bin/env python3
"""Guard the generated-doc MDX repair step.

Definition:
  This script records the locale files that were already untracked before the
  MDX repair agent ran, then verifies that the repair only changed allowed
  locale-controlled paths and did not create additional untracked locale files.

Parameters:
  command: snapshot or enforce.
  --baseline: File path used to store the pre-repair untracked locale snapshot.
  --workspace: Git workspace root. Default: GITHUB_WORKSPACE or current dir.
  --locale: Locale directory name. Default: LOCALE environment variable.

Outputs:
  snapshot writes the baseline file and prints its path.
  enforce prints a short success message or exits non-zero with offending paths.

Examples:
  LOCALE=fr python .github/scripts/i18n/mdx_repair_scope.py snapshot --baseline .openclaw-sync/mdx/fr.repair-baseline.txt
  LOCALE=fr python .github/scripts/i18n/mdx_repair_scope.py enforce --baseline .openclaw-sync/mdx/fr.repair-baseline.txt
"""

from __future__ import annotations

import argparse
import os
import subprocess
from pathlib import Path


def git_lines(workspace: Path, args: list[str]) -> list[str]:
    result = subprocess.run(["git", *args], cwd=workspace, check=True, text=True, stdout=subprocess.PIPE)
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def untracked_locale_files(workspace: Path, locale: str) -> list[str]:
    return sorted(git_lines(workspace, ["ls-files", "--others", "--exclude-standard", "--", f"docs/{locale}"]))


def write_lines(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def read_lines(path: Path) -> set[str]:
    if not path.exists():
        raise SystemExit(f"missing repair scope baseline: {path}")
    return {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


def is_allowed_changed_path(path: str, locale: str) -> bool:
    return path.startswith(f"docs/{locale}/") or path == f"docs/.i18n/{locale}.tm.jsonl"


def snapshot_scope(workspace: Path, locale: str, baseline: Path) -> list[str]:
    files = untracked_locale_files(workspace, locale)
    write_lines(baseline, files)
    print(f"Recorded {len(files)} pre-repair untracked locale file(s) in {baseline}")
    return files


def enforce_scope(workspace: Path, locale: str, baseline: Path) -> None:
    baseline_files = read_lines(baseline)
    staged_paths = git_lines(workspace, ["diff", "--cached", "--name-only"])
    if staged_paths:
        print("Docs MDX repair staged files; forbidden:")
        print("\n".join(staged_paths))
        raise SystemExit(1)

    changed_paths = git_lines(workspace, ["diff", "--name-only"])
    bad_paths = [path for path in changed_paths if not is_allowed_changed_path(path, locale)]
    if bad_paths:
        print("Docs MDX repair touched forbidden paths:")
        print("\n".join(bad_paths))
        raise SystemExit(1)

    current_untracked = set(untracked_locale_files(workspace, locale))
    new_untracked = sorted(current_untracked - baseline_files)
    if new_untracked:
        print("Docs MDX repair created untracked locale files; forbidden:")
        print("\n".join(new_untracked))
        raise SystemExit(1)

    # Full translation can legitimately create new locale pages before repair.
    # The baseline makes the guard focus on repair-stage side effects only.
    print(
        f"Docs MDX repair scope ok: {len(changed_paths)} changed path(s), "
        f"{len(current_untracked)} pre-existing untracked locale file(s)"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Snapshot and enforce the translated MDX repair scope.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  snapshot writes the baseline file. enforce exits non-zero on forbidden repair edits.

Examples:
  LOCALE=fr python .github/scripts/i18n/mdx_repair_scope.py snapshot --baseline .openclaw-sync/mdx/fr.repair-baseline.txt
  LOCALE=fr python .github/scripts/i18n/mdx_repair_scope.py enforce --baseline .openclaw-sync/mdx/fr.repair-baseline.txt
""",
    )
    parser.add_argument("command", choices=["snapshot", "enforce"])
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--workspace", default=os.environ.get("GITHUB_WORKSPACE", "."), type=Path)
    parser.add_argument("--locale", default=os.environ.get("LOCALE", ""))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.locale:
        raise SystemExit("missing locale: pass --locale or set LOCALE")

    workspace = args.workspace.resolve()
    if args.command == "snapshot":
        snapshot_scope(workspace, args.locale, args.baseline)
    else:
        enforce_scope(workspace, args.locale, args.baseline)


if __name__ == "__main__":
    main()
