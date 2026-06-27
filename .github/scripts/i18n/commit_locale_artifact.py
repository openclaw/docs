#!/usr/bin/env python3
"""Commit and publish one applied locale artifact.

Definition:
  This script owns the per-locale commit/push control plane for full
  translation recovery. It expects locale files to have already been applied
  and validated, then commits only docs/<locale> and that locale's translation
  memory. Canary commits are additionally restricted to the sampled page and
  locale translation memory. It retries rebase/push conflicts while guarding
  against source metadata moving after artifact application.

Parameters:
  --locale: Locale directory to commit. Default: LOCALE environment variable.
  --base-source-sha: Source SHA observed after artifact application. Default:
    BASE_SOURCE_SHA environment variable.
  --artifact-dir: Downloaded locale artifact directory. Default: ARTIFACT_DIR.
  --attempts: Push/rebase retry count. Default: 5.

Outputs:
  GITHUB_OUTPUT receives committed=true or committed=false. The script exits
  zero when there is nothing to commit or when source metadata moved after
  apply; it exits non-zero only when a commit should have landed but push/retry
  failed.

Examples:
  LOCALE=fr BASE_SOURCE_SHA=abc python .github/scripts/i18n/commit_locale_artifact.py
  ARTIFACT_ROLE=canary ARTIFACT_DIR=.openclaw-sync/i18n-artifacts/zh-cn-s0of1 LOCALE=zh-CN BASE_SOURCE_SHA=abc python .github/scripts/i18n/commit_locale_artifact.py
  python .github/scripts/i18n/commit_locale_artifact.py --locale zh-CN --base-source-sha abc --artifact-dir .openclaw-sync/i18n-artifacts/zh-cn-s0of1 --attempts 3
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path


def run(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(args, check=False, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and result.returncode != 0:
        raise SystemExit(result.stderr.strip() or f"{' '.join(args)} failed")
    return result


def git_stdout(args: list[str], check: bool = True) -> str:
    return run(["git", *args], check=check).stdout


def write_output(key: str, value: str) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"{key}={value}\n")


def remote_source_sha() -> str:
    result = run(["git", "show", "refs/remotes/origin/main:.openclaw-sync/source.json"], check=False)
    if result.returncode != 0:
        return ""
    try:
        return json.loads(result.stdout).get("sha") or ""
    except json.JSONDecodeError:
        return ""


def ensure_base_current(base_source_sha: str, locale: str) -> bool:
    current_source_sha = remote_source_sha()
    if current_source_sha and current_source_sha != base_source_sha:
        # Artifact application already did stale-page filtering against latest
        # main. If main moves again during validation/push, rerun this locale
        # rather than commit against an unvalidated source base.
        print(f"Source moved from {base_source_sha} to {current_source_sha}; skipping {locale} translation commit.")
        write_output("committed", "false")
        return False
    return True


def has_locale_changes(locale: str) -> bool:
    result = run(
        ["git", "status", "--porcelain", "--untracked-files=all", "--", f"docs/{locale}", f"docs/.i18n/{locale}.tm.jsonl"],
        check=True,
    )
    return bool(result.stdout.strip())


def pending_allowed(locale: str, locale_slug: str, shard_index: str, shard_total: str) -> set[str]:
    pending_file = Path(".openclaw-sync") / f"docs-i18n-{locale_slug}-s{shard_index}of{shard_total}.txt"
    allowed = {f"docs/.i18n/{locale}.tm.jsonl"}
    if not pending_file.exists():
        raise SystemExit(f"missing canary pending manifest: {pending_file}")
    docs_root = Path("docs").resolve()
    for line in pending_file.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        source = Path(line.strip()).resolve()
        rel = source.relative_to(docs_root).as_posix()
        allowed.add(f"docs/{locale}/{rel}")
    return allowed


def artifact_allowed(locale: str, artifact_dir: str) -> set[str]:
    artifact = Path(artifact_dir)
    if not artifact.exists():
        raise SystemExit(f"missing canary artifact directory: {artifact}")
    deleted = [line for line in (artifact / "deleted-files.txt").read_text(encoding="utf-8").splitlines() if line.strip()]
    if deleted:
        raise SystemExit(f"canary artifact unexpectedly included deleted paths: {', '.join(deleted)}")
    allowed = set()
    for line in (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        if line == f"docs/.i18n/{locale}.tm.jsonl" or line.startswith(f"docs/{locale}/"):
            allowed.add(line)
            continue
        raise SystemExit(f"canary artifact changed path outside locale scope: {line}")
    return allowed


def enforce_canary_scope(locale: str, allowed: set[str]) -> None:
    status = git_stdout(["status", "--porcelain", "--untracked-files=all", "--", f"docs/{locale}", f"docs/.i18n/{locale}.tm.jsonl"])
    changed = {line[3:] for line in status.splitlines() if line.strip()}
    bad = sorted(path for path in changed if path not in allowed)
    if bad:
        print("Canary commit touched paths outside the sampled page contract:", file=sys.stderr)
        for path in bad:
            print(path, file=sys.stderr)
        raise SystemExit(1)


def commit_locale(
    locale: str,
    base_source_sha: str,
    attempts: int,
    artifact_role: str = "",
    locale_slug: str = "",
    shard_index: str = "0",
    shard_total: str = "1",
    artifact_dir: str = "",
) -> bool:
    if not has_locale_changes(locale):
        print(f"No {locale} translation changes.")
        write_output("committed", "false")
        return False

    if artifact_role == "canary":
        allowed = artifact_allowed(locale, artifact_dir) if artifact_dir else pending_allowed(locale, locale_slug or locale, shard_index, shard_total)
        enforce_canary_scope(locale, allowed)

    git_stdout(["config", "user.name", "openclaw-docs-i18n[bot]"])
    git_stdout(["config", "user.email", "openclaw-docs-i18n[bot]@users.noreply.github.com"])
    git_stdout(["add", f"docs/{locale}", f"docs/.i18n/{locale}.tm.jsonl"])
    git_stdout(["commit", "-m", f"chore(i18n): refresh {locale} translations"])

    for attempt in range(1, attempts + 1):
        if run(["git", "fetch", "origin", "main:refs/remotes/origin/main"], check=False).returncode == 0:
            if not ensure_base_current(base_source_sha, locale):
                return False
            if run(["git", "rebase", "origin/main"], check=False).returncode == 0:
                if not ensure_base_current(base_source_sha, locale):
                    return False
                if run(["git", "push", "origin", "HEAD:main"], check=False).returncode == 0:
                    write_output("committed", "true")
                    return True
            run(["git", "rebase", "--abort"], check=False)
        print(f"{locale} translation push attempt {attempt} failed; retrying.")
        time.sleep(attempt * 2)

    raise SystemExit(f"Failed to push {locale} translations after retries.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Commit and publish one applied locale artifact.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes committed=true/false to GITHUB_OUTPUT and pushes docs/<locale> plus locale TM when changed.

Examples:
  LOCALE=fr BASE_SOURCE_SHA=abc python .github/scripts/i18n/commit_locale_artifact.py
  python .github/scripts/i18n/commit_locale_artifact.py --locale zh-CN --base-source-sha abc --artifact-dir .openclaw-sync/i18n-artifacts/zh-cn-s0of1 --attempts 3
""",
    )
    parser.add_argument("--locale", default=os.environ.get("LOCALE", ""))
    parser.add_argument("--base-source-sha", default=os.environ.get("BASE_SOURCE_SHA", ""))
    parser.add_argument("--artifact-dir", default=os.environ.get("ARTIFACT_DIR", ""))
    parser.add_argument("--attempts", default=5, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.locale:
        raise SystemExit("missing locale: pass --locale or set LOCALE")
    if not args.base_source_sha:
        raise SystemExit("missing base source sha: pass --base-source-sha or set BASE_SOURCE_SHA")
    if args.attempts < 1:
        raise SystemExit("attempts must be >= 1")
    commit_locale(
        args.locale,
        args.base_source_sha,
        args.attempts,
        artifact_role=os.environ.get("ARTIFACT_ROLE", ""),
        locale_slug=os.environ.get("LOCALE_SLUG", args.locale),
        shard_index=os.environ.get("SHARD_INDEX", "0"),
        shard_total=os.environ.get("SHARD_TOTAL", "1"),
        artifact_dir=args.artifact_dir,
    )


if __name__ == "__main__":
    main()
