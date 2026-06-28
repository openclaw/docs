#!/usr/bin/env python3
"""Summarize a Translate Full run by locale artifact status.

Definition:
  This script reads downloaded full translation artifacts and writes a
  locale-oriented GitHub summary. It is intentionally report-only: workflow job
  results remain the source of truth for pass/fail, while this summary explains
  which locales succeeded, failed, or were skipped before artifact creation.

Parameters:
  --selected-locales: Comma-separated locale names selected by plan_full.py.
  --artifacts-root: Downloaded artifact directory. Default:
    .openclaw-sync/i18n-artifacts.
  --canary-result: GitHub job result for the canary job.
  --provider-result: GitHub job result for provider preflight.

Outputs:
  GITHUB_STEP_SUMMARY receives successful locales, failed locales, skipped
  locales, and artifact counts. The script also prints the summary JSON.

Examples:
  python .github/scripts/i18n/summarize_full.py --selected-locales zh-CN,fr
  python .github/scripts/i18n/summarize_full.py --selected-locales fr --canary-result failure
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class FullSummary:
    successful: list[str] = field(default_factory=list)
    failed: list[str] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)
    invalid: list[str] = field(default_factory=list)
    artifact_count: int = 0
    metadata_only_count: int = 0


def parse_selected(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def read_artifacts(artifacts_root: Path) -> tuple[dict[str, dict[str, object]], list[str], int, int]:
    artifacts: dict[str, dict[str, object]] = {}
    invalid: list[str] = []
    artifact_count = 0
    metadata_only_count = 0
    if not artifacts_root.exists():
        return artifacts, invalid, artifact_count, metadata_only_count

    for artifact in sorted(path for path in artifacts_root.rglob("*") if path.is_dir() and (path / "metadata.json").exists()):
        artifact_count += 1
        try:
            metadata = json.loads((artifact / "metadata.json").read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            invalid.append(f"{artifact.name}: invalid metadata ({exc})")
            continue
        locale = str(metadata.get("locale") or "")
        if not locale:
            invalid.append(f"{artifact.name}: missing locale")
            continue
        changed_count = int(metadata.get("changed_count") or 0)
        deleted_count = int(metadata.get("deleted_count") or 0)
        failed_reason = str(metadata.get("failed_reason") or "")
        artifact_role = str(metadata.get("artifact_role") or "locale")
        if failed_reason and changed_count == 0 and deleted_count == 0:
            metadata_only_count += 1
        if artifact_role == "canary":
            continue
        existing = artifacts.setdefault(
            locale,
            {
                "locale": locale,
                "changed_count": 0,
                "deleted_count": 0,
                "failed_reason": "",
            },
        )
        existing["changed_count"] = int(existing.get("changed_count") or 0) + changed_count
        existing["deleted_count"] = int(existing.get("deleted_count") or 0) + deleted_count
        if failed_reason:
            previous = str(existing.get("failed_reason") or "")
            existing["failed_reason"] = "; ".join(part for part in [previous, failed_reason] if part)
    return artifacts, invalid, artifact_count, metadata_only_count


def summarize_full(selected_locales: list[str], artifacts_root: Path, provider_result: str, canary_result: str) -> FullSummary:
    artifacts, invalid, artifact_count, metadata_only_count = read_artifacts(artifacts_root)
    summary = FullSummary(invalid=invalid, artifact_count=artifact_count, metadata_only_count=metadata_only_count)

    for locale in selected_locales:
        metadata = artifacts.get(locale)
        if metadata is None:
            if provider_result != "success":
                summary.skipped.append(f"{locale}: provider preflight {provider_result}")
            elif canary_result != "success":
                summary.skipped.append(f"{locale}: canary {canary_result}")
            else:
                summary.skipped.append(f"{locale}: no artifact")
            continue
        failed_reason = str(metadata.get("failed_reason") or "")
        if failed_reason:
            summary.failed.append(f"{locale}: {failed_reason}")
        else:
            changed = metadata.get("changed_count", 0)
            deleted = metadata.get("deleted_count", 0)
            summary.successful.append(f"{locale}: changed={changed} deleted={deleted}")
    return summary


def append_summary(summary: FullSummary) -> None:
    output = os.environ.get("GITHUB_STEP_SUMMARY")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write("### Translate Full locale artifacts\n\n")
        fh.write(f"- artifact count: `{summary.artifact_count}`\n")
        fh.write(f"- metadata-only failure artifacts: `{summary.metadata_only_count}`\n")
        fh.write(f"- successful locales: `{', '.join(summary.successful) if summary.successful else 'none'}`\n")
        fh.write(f"- failed locales: `{', '.join(summary.failed) if summary.failed else 'none'}`\n")
        fh.write(f"- skipped locales: `{', '.join(summary.skipped) if summary.skipped else 'none'}`\n")
        if summary.invalid:
            fh.write(f"- invalid artifacts: `{' ; '.join(summary.invalid)}`\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Summarize Translate Full locale artifact status.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes a locale-level artifact summary to GITHUB_STEP_SUMMARY and prints JSON.

Examples:
  python .github/scripts/i18n/summarize_full.py --selected-locales zh-CN,fr
  python .github/scripts/i18n/summarize_full.py --selected-locales fr --canary-result failure
""",
    )
    parser.add_argument("--selected-locales", required=True)
    parser.add_argument("--artifacts-root", default=".openclaw-sync/i18n-artifacts", type=Path)
    parser.add_argument("--provider-result", default=os.environ.get("PROVIDER_RESULT", "unknown"))
    parser.add_argument("--canary-result", default=os.environ.get("CANARY_RESULT", "unknown"))
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    summary = summarize_full(parse_selected(args.selected_locales), args.artifacts_root, args.provider_result, args.canary_result)
    append_summary(summary)
    print(json.dumps(summary.__dict__, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
