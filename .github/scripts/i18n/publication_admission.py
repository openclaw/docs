#!/usr/bin/env python3
"""Post neutral PR admission; publishers retain payload and provenance policy."""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from pathlib import Path

CONTEXT = "Publication merge admission"


def api(path: str, fields: dict[str, str] | None = None):
    args = ["gh", "api", path]
    if fields:
        args.extend(["--method", "POST"])
        for key, value in fields.items():
            args.extend(["-f", f"{key}={value}"])
    result = subprocess.run(args, text=True, capture_output=True, timeout=60)
    if result.returncode:
        raise SystemExit(result.stderr.strip() or f"GitHub request failed: {path}")
    return json.loads(result.stdout)


def current_pull(repository: str, number: str, head: str) -> bool:
    pull = api(f"repos/{repository}/pulls/{number}")
    return (pull["state"] == "open" and pull["head"]["sha"] == head
            and pull["base"]["ref"] == "main" and pull["base"]["repo"]["full_name"] == repository)


def require_strict_gate(repository: str) -> None:
    rules = api(f"repos/{repository}/rules/branches/main?per_page=100")
    if not isinstance(rules, list) or len(rules) >= 100:
        raise SystemExit("Effective branch rules are incomplete; PR retained")
    app_id = api("apps/github-actions")["id"]
    if type(app_id) is not int:
        raise SystemExit("GitHub Actions identity is unavailable")
    strict = [rule for rule in rules if rule["type"] == "required_status_checks"
              and rule.get("parameters", {}).get("strict_required_status_checks_policy") is True
              and any(check["context"] == CONTEXT and check.get("integration_id") == app_id
                      for check in rule["parameters"].get("required_status_checks", []))]
    non_ff = [rule for rule in rules if rule["type"] == "non_fast_forward"]
    if not strict or not non_ff:
        raise SystemExit(f"Required strict {CONTEXT} gate is not active; PR retained")
    for rule_id in {rule.get("ruleset_id") for rule in strict + non_ff}:
        if type(rule_id) is not int:
            raise SystemExit("Effective rule has no source ruleset")
        ruleset = api(f"repos/{repository}/rulesets/{rule_id}?includes_parents=true")
        if ruleset.get("enforcement") != "active":
            raise SystemExit("Publication ruleset is inactive")
        # GitHub redacts bypass actors without ruleset-write access. Activation
        # owns that proof; runtime rejects exposed bypass without admin credentials.
        if "bypass_actors" in ruleset and ruleset["bypass_actors"] != []:
            raise SystemExit("Publication ruleset permits bypass")
        if ruleset.get("current_user_can_bypass", "never") != "never":
            raise SystemExit("Current publisher can bypass the ruleset")


def post_admission(repository: str, head: str) -> None:
    fields = {"context": CONTEXT, "state": "success", "description": "Current open pull request targeting main"}
    if os.environ.get("GITHUB_RUN_ID"):
        fields["target_url"] = (f"{os.environ.get('GITHUB_SERVER_URL', 'https://github.com')}/"
                                f"{repository}/actions/runs/{os.environ['GITHUB_RUN_ID']}")
    api(f"repos/{repository}/statuses/{head}", fields)


def attest_publication(repository: str, number: str, head: str, base: str) -> None:
    require_strict_gate(repository)
    if (not current_pull(repository, number, head)
            or api(f"repos/{repository}/git/ref/heads/main")["object"]["sha"] != base):
        raise SystemExit("Publication PR or validated base changed; PR retained")
    post_admission(repository, head)


def main() -> None:
    argparse.ArgumentParser(description=__doc__, epilog="Examples: python publication_admission.py").parse_args()
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text())
    number, head = str(event["number"]), event["pull_request"]["head"]["sha"]
    if (not re.fullmatch(r"[\w.-]+/[\w.-]+", repository) or not re.fullmatch(r"[1-9][0-9]*", number)
            or not re.fullmatch(r"[a-f0-9]{40}", head)):
        raise SystemExit("Invalid publication event identity")
    if current_pull(repository, number, head):
        post_admission(repository, head)
    else:
        print("Obsolete pull request event; no status written.")


if __name__ == "__main__":
    main()
