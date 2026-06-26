#!/usr/bin/env python3
"""Validate Translate Full matrix and worker fan-out budgets.

Definition:
  This script mirrors the budget preflight that previously lived in
  translate-shell-check-reusable.yml. It intentionally uses the same explicit
  scalar and block checks instead of a YAML dependency, so local and CI behavior
  stay aligned without adding package installation.

Parameters:
  --workflow: Path to translate-all.yml.
  --max-matrix-jobs: GitHub Actions matrix job limit. Default: 256.
  --max-active-workers: Maximum allowed max-parallel * worker_parallel. Default: 24.

Outputs:
  Prints the validated locale, shard, matrix, and active worker counts.
  Exits non-zero when the workflow exceeds a budget or the matrix is malformed.

Examples:
  python .github/scripts/i18n/budget_check.py
  python .github/scripts/i18n/budget_check.py --workflow /tmp/translate-all.yml --max-active-workers 24
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Budget:
    locale_count: int
    shard_total: int
    matrix_jobs: int
    max_parallel: int
    worker_parallel: int
    active_workers: int


def scalar_after(text: str, pattern: str, label: str) -> int:
    match = re.search(pattern, text, re.M)
    if not match:
        raise SystemExit(f"missing {label}")
    return int(match.group(1))


def validate_budget(workflow_path: Path, max_matrix_jobs: int = 256, max_active_workers: int = 24) -> Budget:
    text = workflow_path.read_text(encoding="utf-8")
    max_parallel = scalar_after(text, r"^\s*max-parallel:\s*([0-9]+)\s*$", "full max-parallel")
    shard_total = scalar_after(text, r'^\s*shard_total:\s*"([0-9]+)"\s*$', "full shard_total")
    worker_parallel = scalar_after(text, r'^\s*worker_parallel:\s*"([0-9]+)"\s*$', "full worker_parallel")

    locale_block = re.search(r"(?ms)^\s*locale:\n(?P<body>.*?)(?=^\s*shard_index:)", text)
    if not locale_block:
        raise SystemExit("missing full locale matrix")
    locale_count = len(re.findall(r"^\s*-\s+locale:\s+\S+\s*$", locale_block.group("body"), re.M))
    if locale_count == 0:
        raise SystemExit("full locale matrix is empty")

    shard_block = re.search(r"(?ms)^\s*shard_index:\n(?P<body>.*?)(?=^\s*uses:)", text)
    if not shard_block:
        raise SystemExit("missing full shard_index matrix")
    shard_indexes = [int(value) for value in re.findall(r"^\s*-\s+([0-9]+)\s*$", shard_block.group("body"), re.M)]
    expected_indexes = list(range(shard_total))
    if shard_indexes != expected_indexes:
        raise SystemExit(f"full shard_index matrix {shard_indexes} does not match shard_total {shard_total}")

    matrix_jobs = locale_count * shard_total
    if matrix_jobs > max_matrix_jobs:
        raise SystemExit(f"full translation matrix has {matrix_jobs} jobs; GitHub Actions limit is {max_matrix_jobs}")

    active_workers = max_parallel * worker_parallel
    # This budget is intentionally explicit so fan-out increases remain reviewable.
    if active_workers > max_active_workers:
        raise SystemExit(
            f"full translation peak workers {active_workers} exceeds budget {max_active_workers} "
            f"({max_parallel} max-parallel * {worker_parallel} workers)"
        )

    return Budget(
        locale_count=locale_count,
        shard_total=shard_total,
        matrix_jobs=matrix_jobs,
        max_parallel=max_parallel,
        worker_parallel=worker_parallel,
        active_workers=active_workers,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Translate Full matrix and worker budgets.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Prints the accepted budget values. Exits non-zero on malformed or oversized matrices.

Examples:
  python .github/scripts/i18n/budget_check.py
  python .github/scripts/i18n/budget_check.py --workflow .github/workflows/translate-all.yml --max-matrix-jobs 256
""",
    )
    parser.add_argument("--workflow", default=".github/workflows/translate-all.yml", type=Path)
    parser.add_argument("--max-matrix-jobs", default=256, type=int)
    parser.add_argument("--max-active-workers", default=24, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    budget = validate_budget(args.workflow, args.max_matrix_jobs, args.max_active_workers)
    print(
        f"full translation budget ok: locales={budget.locale_count} shards={budget.shard_total} "
        f"matrix_jobs={budget.matrix_jobs} peak_workers={budget.active_workers}"
    )


if __name__ == "__main__":
    main()
