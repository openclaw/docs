#!/usr/bin/env python3
"""Extract and validate shell blocks from translation workflow YAML files.

Definition:
  This script mirrors the preflight logic that previously lived in
  translate-shell-check-reusable.yml. It scans translate-*.yml files for
  literal `run: |` shell blocks, masks GitHub expressions, writes each block to
  a temporary shell file, and optionally runs `bash -n` on every extracted file.

Parameters:
  --workflows-dir: Directory containing workflow YAML files.
  --out-dir: Directory where extracted shell files are written.
  --check-bash: Run bash syntax validation after extraction.

Outputs:
  Extracted shell scripts are written to --out-dir. Script paths are printed to
  stdout. Exit code is non-zero when extraction or bash validation fails.

Examples:
  python .github/scripts/i18n/workflow_shell_check.py --check-bash
  python .github/scripts/i18n/workflow_shell_check.py --workflows-dir /tmp/wf --out-dir /tmp/out
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
from pathlib import Path


GITHUB_EXPRESSION_RE = re.compile(r"\$\{\{.*?\}\}")


def extract_run_blocks(workflow_path: Path, out_dir: Path) -> list[Path]:
    lines = workflow_path.read_text(encoding="utf-8").splitlines()
    scripts: list[Path] = []
    index = 0
    script_index = 0

    while index < len(lines):
        line = lines[index]
        if line.strip() != "run: |":
            index += 1
            continue

        base_indent = len(line) - len(line.lstrip(" "))
        block_start = index + 1
        block_end = block_start
        while block_end < len(lines):
            candidate = lines[block_end]
            if candidate.strip() and len(candidate) - len(candidate.lstrip(" ")) <= base_indent:
                break
            block_end += 1

        content_indent = None
        for candidate in lines[block_start:block_end]:
            if candidate.strip():
                content_indent = len(candidate) - len(candidate.lstrip(" "))
                break
        if content_indent is None:
            index = block_end
            continue

        script_lines: list[str] = []
        for candidate in lines[block_start:block_end]:
            if not candidate.strip():
                script_lines.append("")
            elif candidate.startswith(" " * content_indent):
                script_lines.append(candidate[content_indent:])
            else:
                script_lines.append(candidate.lstrip(" "))

        # GitHub expressions are interpolated before the shell runs; masking
        # keeps this preflight focused on shell structure, matching the old YAML.
        masked_lines = [GITHUB_EXPRESSION_RE.sub("__GITHUB_EXPR__", line) for line in script_lines]
        script_index += 1
        script_path = out_dir / f"{workflow_path.name}.{script_index}.sh"
        script_path.write_text("\n".join(masked_lines) + "\n", encoding="utf-8")
        scripts.append(script_path)
        index = block_end

    return scripts


def extract_workflow_shells(workflows_dir: Path, out_dir: Path) -> list[Path]:
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    scripts: list[Path] = []
    for workflow_path in sorted(workflows_dir.glob("translate-*.yml")):
        scripts.extend(extract_run_blocks(workflow_path, out_dir))
    return scripts


def check_bash_syntax(scripts: list[Path]) -> None:
    for script in scripts:
        subprocess.run(["bash", "-n", str(script)], check=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract translate workflow shell blocks and optionally run bash -n.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes extracted shell files to --out-dir and prints their paths.

Examples:
  python .github/scripts/i18n/workflow_shell_check.py --check-bash
  python .github/scripts/i18n/workflow_shell_check.py --workflows-dir .github/workflows --out-dir /tmp/shells
""",
    )
    parser.add_argument("--workflows-dir", default=".github/workflows", type=Path)
    parser.add_argument("--out-dir", default=".openclaw-sync/workflow-shell-check", type=Path)
    parser.add_argument("--check-bash", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    scripts = extract_workflow_shells(args.workflows_dir, args.out_dir)
    for script in scripts:
        print(script)
    if args.check_bash:
        check_bash_syntax(scripts)


if __name__ == "__main__":
    main()
