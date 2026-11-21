#!/usr/bin/env python3
"""GitHub boundary fixture; branch creation and squash merges use real Git."""
import json
import os
from pathlib import Path
import subprocess
import sys

root = Path(os.environ["PR_FIXTURE_ROOT"])
mode = os.environ.get("PR_FIXTURE_MODE", "merge")
record = root / "pr.json"


def git(cwd, *args):
    return subprocess.check_output(["git", *args], cwd=cwd, text=True, stderr=subprocess.PIPE).strip()


def save(state):
    record.write_text(json.dumps(state))


operation = sys.argv[1:3]
if sys.argv[1] == "api":
    path = sys.argv[2]
    remote = Path(git(Path.cwd(), "remote", "get-url", "origin"))
    if path == "apps/github-actions":
        response = {"id": 15368}
    elif "/rules/branches/main" in path:
        response = [] if mode == "missing-gate" else [
            {"type": "non_fast_forward", "ruleset_id": 1},
            {"type": "required_status_checks", "ruleset_id": 1, "parameters": {
                "strict_required_status_checks_policy": True,
                "required_status_checks": [{"context": "Publication merge admission", "integration_id": 15368}]}}]
    elif "/rulesets/1?" in path:
        response = {"enforcement": "active"}
        if mode == "bypass-gate":
            response["bypass_actors"] = [{"actor_id": 1}]
    elif "/pulls/" in path:
        state = json.loads(record.read_text())
        response = {"state": state["state"].lower(),
                    "head": {"sha": "0" * 40 if mode == "moved-head" else state["headRefOid"]},
                    "base": {"ref": "main", "repo": {"full_name": "example/docs"}}}
    elif path.endswith("/git/ref/heads/main"):
        response = {"object": {"sha": git(remote, "rev-parse", "main")}}
    elif "/statuses/" in path:
        response = dict(arg.split("=", 1) for arg in sys.argv[3:] if "=" in arg)
        response["sha"] = path.rsplit("/", 1)[1]
        (root / "status.json").write_text(json.dumps(response))
    else:
        raise AssertionError(path)
    print(json.dumps(response))
elif operation == ["pr", "list"]:
    branch = sys.argv[sys.argv.index("--head") + 1]
    state = json.loads(record.read_text()) if record.exists() else None
    remote = git(Path.cwd(), "ls-remote", "origin", f"refs/heads/{branch}")
    print("1" if state and state["branch"] == branch and remote and state["headRefOid"] == remote.split()[0] else "")
elif operation == ["pr", "create"]:
    if mode == "create-failed":
        sys.exit(1)
    branch = sys.argv[sys.argv.index("--head") + 1]
    remote = git(Path.cwd(), "ls-remote", "origin", f"refs/heads/{branch}").split()[0]
    save({"branch": branch, "headRefOid": remote, "state": "OPEN", "mergeStateStatus": "CLEAN", "mergeCommit": None})
    if mode == "uncertain-create":
        sys.exit(1)
    print("https://github.com/example/docs/pull/1")
elif operation == ["pr", "view"]:
    state = json.loads(record.read_text())
    if not (root / "status.json").exists():
        state["mergeStateStatus"] = "BLOCKED"
    if mode == "pending":
        state["mergeStateStatus"] = "BLOCKED"
    if mode == "moved-head":
        state["headRefOid"] = "0" * 40
    print(json.dumps(state))
elif operation == ["pr", "merge"]:
    state = json.loads(record.read_text())
    assert "--squash" in sys.argv and "--admin" not in sys.argv
    assert sys.argv[sys.argv.index("--match-head-commit") + 1] == state["headRefOid"]
    if mode == "merge-failed":
        sys.exit(1)
    merger = root / "merger"
    git(root, "clone", git(Path.cwd(), "remote", "get-url", "origin"), str(merger))
    git(merger, "config", "commit.gpgsign", "false")
    git(merger, "config", "user.name", "Fixture")
    git(merger, "config", "user.email", "fixture@example.invalid")
    git(merger, "checkout", "-B", "main", "origin/main")
    if mode == "merge-base-race":
        (merger / "docs/fr/concurrent.md").write_text("concurrent\n")
        git(merger, "add", ".")
        git(merger, "commit", "-m", "Concurrent change after final client read")
        git(merger, "push", "origin", "HEAD:main")
    status = json.loads((root / "status.json").read_text())
    assert status["sha"] == state["headRefOid"] and status["context"] == "Publication merge admission"
    assert status["state"] == "success"
    # Model strict required-check admission, not a client-side base CAS.
    if git(merger, "show", "-s", "--format=%P", state["headRefOid"]) != git(merger, "rev-parse", "HEAD"):
        sys.exit(1)
    git(merger, "merge", "--squash", state["headRefOid"])
    if mode == "wrong-tree":
        (merger / "docs/fr/extra.md").write_text("unexpected\n")
        git(merger, "add", "docs/fr/extra.md")
    git(merger, "commit", "-m", "Squashed translation PR")
    merged = git(merger, "rev-parse", "HEAD")
    assert merged != state["headRefOid"]
    git(merger, "push", "origin", "HEAD:main")
    state.update(state="MERGED", mergeCommit={"oid": merged})
    save(state)
    if mode == "uncertain-merge":
        sys.exit(1)
else:
    raise AssertionError(sys.argv)
