#!/usr/bin/env python3
"""Validate publish-repo source metadata for a translation job.

Definition:
  This script mirrors the Read source metadata step from
  translate-locale-reusable.yml. It reads .openclaw-sync/source.json, validates
  repository and sha fields, checks that the sha matches the requested input,
  and writes the same GitHub outputs used by checkout/source steps.

Parameters:
  --source-json: Path to source metadata JSON. Default: .openclaw-sync/source.json.

Environment:
  SOURCE_SHA is the requested source sha. GITHUB_OUTPUT receives repository and
  sha when validation succeeds.

Outputs:
  repository=<repo> and sha=<sha> are appended to GITHUB_OUTPUT. Exit code is
  non-zero when metadata is missing, malformed, or stale.

Examples:
  SOURCE_SHA=abc python .github/scripts/i18n/read_source_metadata.py
  SOURCE_SHA=abc python .github/scripts/i18n/read_source_metadata.py --source-json /tmp/source.json
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class SourceMetadata:
    repository: str
    sha: str


def read_source_metadata(source_json: Path, requested_sha: str) -> SourceMetadata:
    try:
        data = json.loads(source_json.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"missing source metadata in {source_json}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"invalid source metadata in {source_json}: {exc}") from exc

    metadata = SourceMetadata(repository=data.get("repository") or "", sha=data.get("sha") or "")
    if not metadata.repository or not metadata.sha:
        raise SystemExit(f"invalid source metadata in {source_json}")
    if metadata.sha != requested_sha:
        raise SystemExit(f"publish ref source {metadata.sha} does not match requested {requested_sha}")
    return metadata


def append_output(metadata: SourceMetadata) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"repository={metadata.repository}\n")
        fh.write(f"sha={metadata.sha}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate publish-repo source metadata for a translation job.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Appends repository and sha fields to GITHUB_OUTPUT.

Examples:
  SOURCE_SHA=abc python .github/scripts/i18n/read_source_metadata.py
  SOURCE_SHA=abc python .github/scripts/i18n/read_source_metadata.py --source-json /tmp/source.json
""",
    )
    parser.add_argument("--source-json", default=".openclaw-sync/source.json", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    metadata = read_source_metadata(args.source_json, os.environ["SOURCE_SHA"])
    append_output(metadata)


if __name__ == "__main__":
    main()
