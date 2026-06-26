#!/usr/bin/env python3
"""Validate Translate Full trigger and worker fan-out budgets.

Definition:
  This script mirrors the budget preflight that previously lived in
  translate-shell-check-reusable.yml. It intentionally uses explicit scalar and
  block checks instead of a YAML dependency, so local and CI behavior stay
  aligned without adding package installation.

Parameters:
  --workflow: Path to translate-all.yml.
  --max-batch-size: Maximum locales per full follow-up batch. Default: 3.
  --max-active-workers: Maximum allowed max-parallel * worker_parallel. Default: 12.

Outputs:
  Prints the validated batch, worker, trigger, and concurrency settings.
  Exits non-zero when the workflow restores forbidden triggers, cancels running
  full runs, exceeds fan-out, or omits manual locale rerun support.

Examples:
  python .github/scripts/i18n/budget_check.py
  python .github/scripts/i18n/budget_check.py --workflow /tmp/translate-all.yml --max-active-workers 12
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Budget:
    batch_count: int
    max_batch_parallel: int
    worker_parallel: int
    active_workers: int
    cancel_in_progress: bool


def scalar_after(text: str, pattern: str, label: str) -> str:
    match = re.search(pattern, text, re.M)
    if not match:
        raise SystemExit(f"missing {label}")
    return match.group(1)


def validate_budget(workflow_path: Path, max_batch_size: int = 3, max_active_workers: int = 12) -> Budget:
    text = workflow_path.read_text(encoding="utf-8")

    if re.search(r"^\s*repository_dispatch:\s*$", text, re.M):
        raise SystemExit("Translate Full must not be triggered by release repository_dispatch events")
    if re.search(r'docs/\.i18n/glossary\.\*\.json', text):
        raise SystemExit("Translate Full must not be triggered by glossary pushes")
    if not re.search(r"^\s*schedule:\s*$", text, re.M):
        raise SystemExit("Translate Full must keep weekly schedule")
    if not re.search(r"^\s*workflow_dispatch:\s*$", text, re.M):
        raise SystemExit("Translate Full must keep manual dispatch")
    if not re.search(r"^\s*target_locale:\s*$", text, re.M):
        raise SystemExit("Translate Full manual dispatch must support target_locale")

    cancel_in_progress = scalar_after(text, r"^\s*cancel-in-progress:\s*(true|false)\s*$", "full cancel-in-progress") == "true"
    if cancel_in_progress:
        raise SystemExit("Translate Full must serialize without cancelling a running full run")

    max_parallel_values = [int(value) for value in re.findall(r"^\s*max-parallel:\s*([0-9]+)\s*$", text, re.M)]
    if not max_parallel_values:
        raise SystemExit("missing full batch max-parallel")
    max_batch_parallel = max(max_parallel_values)
    if max_batch_parallel > max_batch_size:
        raise SystemExit(f"full locale batch parallelism {max_batch_parallel} exceeds budget {max_batch_size}")

    worker_values = sorted(set(int(value) for value in re.findall(r'^\s*worker_parallel:\s*"([0-9]+)"\s*$', text, re.M)))
    if not worker_values:
        raise SystemExit("missing full worker_parallel")
    if len(worker_values) != 1:
        raise SystemExit(f"full workflow has mixed worker_parallel values: {worker_values}")
    worker_parallel = worker_values[0]
    active_workers = max_batch_parallel * worker_parallel
    batch_count = len(re.findall(r"^\s*translate-batch-[0-9]+:\s*$", text, re.M))
    if batch_count != 6:
        raise SystemExit(f"expected 6 follow-up batch jobs, found {batch_count}")

    # This budget is intentionally explicit so fan-out increases remain reviewable.
    if active_workers > max_active_workers:
        raise SystemExit(
            f"full translation peak workers {active_workers} exceeds budget {max_active_workers} "
            f"({max_batch_parallel} max-parallel * {worker_parallel} workers)"
        )

    return Budget(
        batch_count=batch_count,
        max_batch_parallel=max_batch_parallel,
        worker_parallel=worker_parallel,
        active_workers=active_workers,
        cancel_in_progress=cancel_in_progress,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate Translate Full matrix and worker budgets.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Prints the accepted budget values. Exits non-zero on malformed or oversized matrices.

Examples:
  python .github/scripts/i18n/budget_check.py
  python .github/scripts/i18n/budget_check.py --workflow .github/workflows/translate-all.yml --max-active-workers 12
""",
    )
    parser.add_argument("--workflow", default=".github/workflows/translate-all.yml", type=Path)
    parser.add_argument("--max-batch-size", default=3, type=int)
    parser.add_argument("--max-active-workers", default=12, type=int)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    budget = validate_budget(args.workflow, args.max_batch_size, args.max_active_workers)
    print(
        f"full translation budget ok: batches={budget.batch_count} max_parallel={budget.max_batch_parallel} "
        f"worker_parallel={budget.worker_parallel} peak_workers={budget.active_workers}"
    )


if __name__ == "__main__":
    main()
