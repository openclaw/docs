#!/usr/bin/env python3
"""Merge prior and current translation artifacts for failed-shard resume.

Definition:
  Copies artifact directories into one flat finalizer input. Prior successful
  shards are copied first; current rerun artifacts replace matching prior
  artifact names.

Parameters:
  --previous-root: Optional artifacts downloaded from the resumed run.
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
import shutil
from pathlib import Path


def artifact_dirs(root: Path | None) -> list[Path]:
    if root is None or not root.exists():
        return []
    return sorted(path for path in root.rglob("*") if path.is_dir() and (path / "metadata.json").is_file())


def merge_artifact_roots(previous_root: Path | None, current_root: Path, output_root: Path) -> int:
    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)
    merged: set[str] = set()
    for root in (previous_root, current_root):
        names: set[str] = set()
        for artifact in artifact_dirs(root):
            if artifact.name in names:
                raise SystemExit(f"duplicate artifact directory name in {root}: {artifact.name}")
            names.add(artifact.name)
            destination = output_root / artifact.name
            if destination.exists():
                shutil.rmtree(destination)
            shutil.copytree(artifact, destination)
            merged.add(artifact.name)
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
    parser.add_argument("--current-root", required=True, type=Path)
    parser.add_argument("--output-root", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    merge_artifact_roots(args.previous_root, args.current_root, args.output_root)


if __name__ == "__main__":
    main()
