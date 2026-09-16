#!/usr/bin/env python3
"""Merge prior and current translation artifacts for failed-shard resume.

Definition:
  Copies artifact directories into one flat finalizer input. Prior successful
  shards are copied first; current rerun artifacts replace matching prior
  artifact names.

Parameters:
  --previous-root: Optional artifacts downloaded from the resumed run.
  --previous-artifact-ids: Pinned IDs whose receipts must all be present.
  --current-root: Artifacts produced by the current run.
  --output-root: Fresh merged artifact directory.

Outputs:
  Recreates --output-root and prints the number of merged artifacts.

Examples:
  python .github/scripts/i18n/merge_artifact_roots.py \
    --previous-root .openclaw-sync/resume-artifacts \
    --current-root .openclaw-sync/current-artifacts \
    --output-root .openclaw-sync/i18n-artifacts
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
from pathlib import Path


NATIVE_ARTIFACT_NAME = re.compile(r"i18n-[a-z-]+-s[0-9]+of[0-9]+-[0-9a-f]{40}")


def artifact_dirs(root: Path | None) -> list[Path]:
    if root is None or not root.exists():
        return []
    # download-artifact extracts a single match directly into the requested root.
    return sorted(path.parent for path in root.rglob("metadata.json"))


def require_artifact_count(artifacts: list[Path], artifact_ids: str) -> None:
    # download-artifact warns, rather than fails, if only some requested IDs exist.
    if artifact_ids and len(artifacts) != len(artifact_ids.split(",")):
        raise SystemExit("resume artifact download is empty or incomplete")


def read_artifact_metadata(artifact: Path) -> dict[str, object]:
    try:
        metadata = json.loads((artifact / "metadata.json").read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"invalid artifact metadata in {artifact.name}: {exc}") from exc
    if not isinstance(metadata, dict):
        raise SystemExit(f"invalid artifact metadata in {artifact.name}")
    if NATIVE_ARTIFACT_NAME.fullmatch(artifact.name) and artifact.name != artifact_name(metadata):
        raise SystemExit(f"artifact directory disagrees with metadata: {artifact.name}")
    return metadata


def artifact_name(metadata: dict[str, object]) -> str:
    role = metadata.get("artifact_role", "locale")
    slug, source = metadata.get("locale_slug"), metadata.get("source_sha")
    if role not in {"locale", "canary"} or not all(
        isinstance(value, str) and re.fullmatch(r"[A-Za-z0-9-]+", value) for value in (slug, source)
    ):
        raise SystemExit("invalid artifact identity")
    try:
        index, total = int(metadata["shard_index"]), int(metadata["shard_total"])
    except (KeyError, TypeError, ValueError) as exc:
        raise SystemExit("invalid artifact shard identity") from exc
    if not 0 <= index < total:
        raise SystemExit("invalid artifact shard identity")
    prefix = "i18n-canary" if role == "canary" else "i18n"
    return f"{prefix}-{slug}-s{index}of{total}-{source}"


def merge_artifact_roots(previous_root: Path | None, current_root: Path, output_root: Path, previous_artifact_ids: str = "") -> int:
    roots = [(root, artifact_dirs(root)) for root in (previous_root, current_root)]
    require_artifact_count(roots[0][1], previous_artifact_ids)
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)
    merged: set[str] = set()
    for root, artifacts in roots:
        names: set[str] = set()
        for artifact in artifacts:
            name = artifact_name(read_artifact_metadata(artifact))
            if name in names:
                raise SystemExit(f"duplicate artifact identity in {root}: {name}")
            names.add(name)
            destination = output_root / name
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(artifact, destination)
            merged.add(name)
    print(f"merged artifacts: {len(merged)}")
    return len(merged)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Merge prior and current translation artifacts.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Examples:
  python .github/scripts/i18n/merge_artifact_roots.py --current-root current --output-root merged
  python .github/scripts/i18n/merge_artifact_roots.py --previous-root prior --current-root current --output-root merged
""",
    )
    parser.add_argument("--previous-root", type=Path)
    parser.add_argument("--previous-artifact-ids", default="")
    parser.add_argument("--current-root", required=True, type=Path)
    parser.add_argument("--output-root", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    merge_artifact_roots(args.previous_root, args.current_root, args.output_root, args.previous_artifact_ids)


if __name__ == "__main__":
    main()
