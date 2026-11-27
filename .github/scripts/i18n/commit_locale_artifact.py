#!/usr/bin/env python3
"""Commit and publish validated translation artifacts through a pull request.

Definition:
  This script owns the aggregate and per-locale publication control plane for full
  translation recovery. It expects locale files to have already been applied
  and validated, then commits only docs/<locale> and that locale's translation
  memory. Canary commits are additionally restricted to the sampled page and
  locale translation memory. It retries fetch/rebase conflicts while guarding
  against source metadata moving after artifact application.

Parameters:
  --locale: Locale directory to commit. Default: LOCALE environment variable.
  --base-source-sha: Source SHA observed after artifact application. Default:
    BASE_SOURCE_SHA environment variable.
  --artifact-dir: Downloaded locale artifact directory. Default: ARTIFACT_DIR.
  --attempts: Fetch/rebase retry count. Default: 5.

Outputs:
  GITHUB_OUTPUT receives committed=true only after the merged PR's translation
  tree is verified, or committed=false when no change is published. Stale source
  metadata is an explicit skip. Unconfirmed publication exits non-zero and
  retains any candidate branch and PR for inspection.

Examples:
  LOCALE=fr BASE_SOURCE_SHA=abc python .github/scripts/i18n/commit_locale_artifact.py
  ARTIFACT_ROLE=canary ARTIFACT_DIR=.openclaw-sync/i18n-artifacts/zh-cn-s0of1 LOCALE=zh-CN BASE_SOURCE_SHA=abc python .github/scripts/i18n/commit_locale_artifact.py
  python .github/scripts/i18n/commit_locale_artifact.py --locale zh-CN --base-source-sha abc --artifact-dir .openclaw-sync/i18n-artifacts/zh-cn-s0of1 --attempts 3
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Callable

from publication_admission import attest_publication


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
    if not current_source_sha or current_source_sha != base_source_sha:
        # Artifact application already did stale-page filtering against latest
        # main. If main moves again during validation/push, or source.json is
        # missing/unreadable, skip rather than commit against an unvalidated
        # source base.
        if current_source_sha:
            print(f"Source moved from {base_source_sha} to {current_source_sha}; skipping {locale} translation commit.")
        else:
            print(f"Source metadata missing or unreadable; skipping {locale} translation commit.")
        write_output("committed", "false")
        return False
    return True


def has_locale_changes(locale: str) -> bool:
    result = run(
        ["git", "status", "--porcelain", "--untracked-files=all", "--", *locale_pathspecs(locale)],
        check=True,
    )
    return bool(result.stdout.strip())


def locale_pathspecs(locale: str) -> list[str]:
    tm_path = f"docs/.i18n/{locale}.tm.jsonl"
    paths = [f"docs/{locale}"]
    if Path(tm_path).exists() or run(["git", "ls-files", "--error-unmatch", tm_path], check=False).returncode == 0:
        paths.append(tm_path)
    return paths


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
    status = git_stdout(["status", "--porcelain", "--untracked-files=all", "--", *locale_pathspecs(locale)])
    changed = {line[3:] for line in status.splitlines() if line.strip()}
    bad = sorted(path for path in changed if path not in allowed)
    if bad:
        print("Canary commit touched paths outside the sampled page contract:", file=sys.stderr)
        for path in bad:
            print(path, file=sys.stderr)
        raise SystemExit(1)


BUILD_INPUTS = ["docs", "scripts", "package.json", "package-lock.json", ".openclaw-sync"]


def scope_tree(ref: str, paths: list[str]) -> str:
    return git_stdout(["ls-tree", "-r", "-z", "--full-tree", ref, "--", *paths])


def publish_commit(paths: list[str], title: str, source_current: Callable[[], bool], attempts: int,
                   revalidate: bool = True) -> bool:
    """Publish a locally committed artifact, preserving its validation owner."""
    validated_base = git_stdout(["rev-parse", "HEAD^"]).strip()
    for attempt in range(1, attempts + 1):
        if run(["git", "fetch", "origin", "main:refs/remotes/origin/main"], check=False).returncode:
            time.sleep(attempt * 2)
            continue
        if not source_current():
            return False
        base = git_stdout(["rev-parse", "origin/main"]).strip()
        if base != validated_base:
            changed_inputs = run(["git", "diff", "--quiet", validated_base, base, "--", *BUILD_INPUTS], check=False).returncode
            if changed_inputs and not revalidate:
                raise SystemExit("Canary build inputs changed after validation; run a fresh finalizer.")
            if run(["git", "rebase", "origin/main"], check=False).returncode:
                run(["git", "rebase", "--abort"], check=False)
                time.sleep(attempt * 2)
                continue
            if changed_inputs:
                # Rebased docs and renderer inputs must pass the same full check.
                changed_dependencies = run(["git", "diff", "--quiet", validated_base, base, "--", "package.json", "package-lock.json"], check=False).returncode
                if changed_dependencies or not Path("node_modules").exists():
                    run(["npm", "ci"])
                run(["npm", "run", "docs:check"])
            validated_base = base
        if not source_current():
            return False
        break
    else:
        raise SystemExit("Failed to rebase translation artifacts; run a fresh finalizer.")

    expected = scope_tree("HEAD", paths)
    scope_key = hashlib.sha256("\0".join(paths).encode()).hexdigest()[:16]
    payload_key = hashlib.sha256(expected.encode()).hexdigest()
    branch = f"automation/docs-i18n/{scope_key}-{payload_key}-{validated_base}"
    repo = os.environ.get("GITHUB_REPOSITORY") or run(["gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).stdout.strip()
    candidate_url = f"https://github.com/{repo}/compare/main...{branch}?expand=1"
    remote = run(["git", "ls-remote", "--exit-code", "--heads", "origin", f"refs/heads/{branch}"], check=False)
    if remote.returncode == 0:
        head = remote.stdout.split()[0]
        git_stdout(["fetch", "origin", head])
        if scope_tree(head, paths) != expected:
            raise SystemExit(f"Retained translation candidate differs; inspect {candidate_url}")
    elif remote.returncode == 2:
        head = git_stdout(["rev-parse", "HEAD"]).strip()
    else:
        raise SystemExit(f"Cannot inspect translation candidate: {candidate_url}")
    for path in git_stdout(["diff", "--no-renames", "--name-only", "-z", f"origin/main...{head}"]).split("\0"):
        if not path:
            continue
        if not any(path == allowed or path.startswith(allowed.rstrip("/") + "/") for allowed in paths):
            raise SystemExit(f"Translation candidate changes unowned path {path}; inspect {candidate_url}")
    if git_stdout(["show", "-s", "--format=%P", head]).strip() != validated_base:
        raise SystemExit(f"Translation candidate does not have one validated base parent: {candidate_url}")
    if remote.returncode == 2:
        git_stdout(["push", f"--force-with-lease=refs/heads/{branch}:", "origin", f"HEAD:refs/heads/{branch}"])

    def find_pr() -> str:
        return run(["gh", "pr", "list", "--base", "main", "--head", branch, "--state", "all",
                    "--json", "number,isCrossRepository,headRefOid", "--jq",
                    f'[.[] | select(.isCrossRepository == false and .headRefOid == "{head}")] | .[0].number // empty']).stdout.strip()

    print(f"Translation candidate: {candidate_url}")
    number = find_pr()
    if not number:
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md") as body:
            body.write(f"{title}\n\nValidated translation tree: {payload_key}\n")
            body.flush()
            run(["gh", "pr", "create", "--base", "main", "--head", branch, "--title", title, "--body-file", body.name], check=False)
        number = find_pr()
    if not number:
        raise SystemExit(f"Translation PR creation unconfirmed; inspect {candidate_url}")
    url = f"https://github.com/{repo}/pull/{number}"
    print(f"Translation PR: {url}")
    # A required status starts missing. Attest before waiting for merge readiness;
    # server-side strict checks protect the gap after our final base read.
    attest_publication(repo, number, head, validated_base)
    requested = False
    for _ in range(30):
        record = json.loads(run(["gh", "pr", "view", number, "--json", "headRefOid,state,mergeStateStatus,mergeCommit"]).stdout)
        if record["headRefOid"] != head:
            raise SystemExit(f"Translation PR head changed: {url}")
        if record["state"] == "MERGED":
            merged = record["mergeCommit"]["oid"]
            git_stdout(["fetch", "origin", "main", merged])
            git_stdout(["merge-base", "--is-ancestor", merged, "origin/main"])
            if git_stdout(["show", "-s", "--format=%P", merged]).strip() != validated_base:
                raise SystemExit(f"Translation merge parent differs from validated base: {url}")
            if scope_tree(merged, paths) != expected or scope_tree("origin/main", paths) != expected:
                raise SystemExit(f"Merged translation tree differs from validated artifacts: {url}")
            if not source_current():
                return False
            print(f"Verified translation PR {url} at {merged}")
            write_output("commit_sha", merged)
            return True
        if record["state"] != "OPEN" or record["mergeStateStatus"] == "DIRTY":
            raise SystemExit(f"Translation PR cannot merge; retained for inspection: {url}")
        if record["mergeStateStatus"] == "CLEAN" and not requested:
            git_stdout(["fetch", "origin", "main:refs/remotes/origin/main"])
            if not source_current():
                return False
            # This is a freshness check, not an atomic base compare-and-swap.
            if run(["git", "diff", "--quiet", validated_base, "origin/main", "--", *BUILD_INPUTS], check=False).returncode:
                raise SystemExit(f"Build inputs changed after PR validation; retained for inspection: {url}")
            requested = True
            run(["gh", "pr", "merge", number, "--squash", "--match-head-commit", head], check=False)
        time.sleep(10)
    raise SystemExit(f"Translation PR not merged; retained for inspection: {url}")


def commit_aggregate(base_metadata_oid: str, attempts: int) -> bool:
    def source_current() -> bool:
        result = run(["git", "rev-parse", "--verify", "refs/remotes/origin/main:.openclaw-sync/source.json"], check=False)
        if result.returncode or result.stdout.strip() != base_metadata_oid:
            print("Source metadata moved or is unreadable; start a fresh aggregate finalizer.")
            write_output("committed", "false")
            return False
        return True

    git_stdout(["config", "user.name", "openclaw-docs-i18n[bot]"])
    git_stdout(["config", "user.email", "openclaw-docs-i18n[bot]@users.noreply.github.com"])
    git_stdout(["add", "docs"])
    git_stdout(["commit", "-m", "chore(i18n): refresh translations"])
    committed = publish_commit(["docs"], "chore(i18n): refresh translations", source_current, attempts)
    write_output("committed", "true" if committed else "false")
    return committed


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
    git_stdout(["add", *locale_pathspecs(locale)])
    git_stdout(["commit", "-m", f"chore(i18n): refresh {locale} translations"])

    committed = publish_commit(locale_pathspecs(locale), f"chore(i18n): refresh {locale} translations",
                               lambda: ensure_base_current(base_source_sha, locale), attempts,
                               revalidate=artifact_role != "canary" or os.environ.get("CANARY_BOOTSTRAP") == "true")
    write_output("committed", "true" if committed else "false")
    return committed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Commit and publish one applied locale artifact.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes committed=true only after the validated translation PR is merged.

Examples:
  LOCALE=fr BASE_SOURCE_SHA=abc python .github/scripts/i18n/commit_locale_artifact.py
  python .github/scripts/i18n/commit_locale_artifact.py --locale zh-CN --base-source-sha abc --artifact-dir .openclaw-sync/i18n-artifacts/zh-cn-s0of1 --attempts 3
""",
    )
    parser.add_argument("--locale", default=os.environ.get("LOCALE", ""))
    parser.add_argument("--aggregate", action="store_true")
    parser.add_argument("--base-source-metadata-oid", default=os.environ.get("BASE_SOURCE_METADATA_OID", ""))
    parser.add_argument("--base-source-sha", default=os.environ.get("BASE_SOURCE_SHA", ""))
    parser.add_argument("--artifact-dir", default=os.environ.get("ARTIFACT_DIR", ""))
    parser.add_argument("--attempts", default=5, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.attempts < 1:
        raise SystemExit("attempts must be >= 1")
    if args.aggregate:
        if not args.base_source_metadata_oid:
            raise SystemExit("missing base source metadata OID")
        commit_aggregate(args.base_source_metadata_oid, args.attempts)
        return
    if not args.locale:
        raise SystemExit("missing locale: pass --locale or set LOCALE")
    if not args.base_source_sha:
        raise SystemExit("missing base source sha: pass --base-source-sha or set BASE_SOURCE_SHA")
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
