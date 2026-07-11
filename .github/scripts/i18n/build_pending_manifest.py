#!/usr/bin/env python3
"""Build the pending docs manifest for one locale shard.

Definition:
  This script mirrors the pending-doc selection logic from
  translate-locale-reusable.yml. It discovers source docs, excludes generated
  and locale docs, compares source hashes in incremental mode, and writes the
  shard-specific pending file consumed by docs-i18n.

Parameters:
  --docs-root: Docs directory. Default: docs.
  --openclaw-sync-dir: State/output directory. Default: .openclaw-sync.

Environment:
  LOCALE, LOCALE_SLUG, MODE, SHARD_INDEX, SHARD_TOTAL, optional
  PENDING_LIMIT, CANARY_SOURCE_PATH, and GITHUB_OUTPUT.

Outputs:
  Writes docs-i18n-<locale_slug>-s<index>of<total>.txt under --openclaw-sync-dir.
  GITHUB_OUTPUT receives all_count, total_pending_count, and pending_count.

Examples:
  LOCALE=fr LOCALE_SLUG=fr MODE=incremental SHARD_INDEX=0 SHARD_TOTAL=1 python .github/scripts/i18n/build_pending_manifest.py
  LOCALE=zh-CN LOCALE_SLUG=zh-cn MODE=full SHARD_INDEX=1 SHARD_TOTAL=4 python .github/scripts/i18n/build_pending_manifest.py
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
from dataclasses import dataclass
from pathlib import Path

from translation_plan import is_locale_dir


SOURCE_HASH_RE = re.compile(r"^x-i18n:\n(?:[ \t]+.*\n)*?[ \t]+source_hash: ([0-9a-f]{64})$", re.M)


@dataclass(frozen=True)
class PendingResult:
    all_count: int
    total_pending_count: int
    pending_count: int
    pending_path: Path
    shard_files: list[Path]


def stored_source_hash(path: Path) -> str:
    if not path.exists():
        return ""
    text = path.read_text(encoding="utf-8", errors="ignore")
    match = SOURCE_HASH_RE.search(text)
    if not match:
        return ""
    return match.group(1).strip()


def validate_shard(index_value: str, total_value: str) -> tuple[int, int]:
    try:
        shard_index = int(index_value)
        shard_total = int(total_value)
    except ValueError as exc:
        raise SystemExit(f"invalid shard inputs: {exc}") from exc
    if shard_total < 1:
        raise SystemExit(f"invalid shard_total: {shard_total}")
    if shard_index < 0 or shard_index >= shard_total:
        raise SystemExit(f"invalid shard_index {shard_index} for shard_total {shard_total}")
    return shard_index, shard_total


def validate_pending_limit(value: str) -> int:
    try:
        limit = int(value or "0")
    except ValueError as exc:
        raise SystemExit(f"invalid PENDING_LIMIT: {value}") from exc
    if limit < 0:
        raise SystemExit(f"invalid PENDING_LIMIT: {limit}")
    return limit


def build_pending_manifest(
    docs_root: Path,
    openclaw_sync_dir: Path,
    locale: str,
    locale_slug: str,
    mode: str,
    shard_index: int,
    shard_total: int,
    pending_limit: int = 0,
    canary_source_path: str = "",
) -> PendingResult:
    locale_dirs = {path.name for path in docs_root.iterdir() if is_locale_dir(path)}
    pending_path = openclaw_sync_dir / f"docs-i18n-{locale_slug}-s{shard_index}of{shard_total}.txt"

    all_files: list[Path] = []
    pending_files: list[Path] = []
    for path in docs_root.rglob("*"):
        # Alias files such as CLAUDE.md -> AGENTS.md resolve to the same source
        # path. Translating both assigns one output to multiple shards, wasting
        # model calls and making the final artifact overwrite nondeterministic.
        if path.is_symlink() or not path.is_file() or path.suffix.lower() not in {".md", ".mdx"}:
            continue
        rel = path.relative_to(docs_root)
        parts = rel.parts
        if parts and parts[0] in locale_dirs:
            continue
        rel_posix = rel.as_posix()
        if rel_posix.startswith(".i18n/") or rel_posix.startswith(".generated/"):
            continue
        all_files.append(path.resolve())
        locale_path = docs_root / locale / rel
        source_hash = hashlib.sha256(path.read_bytes()).hexdigest()
        if mode == "full" or stored_source_hash(locale_path) != source_hash:
            pending_files.append(path.resolve())

    pending_files = sorted(pending_files)
    shard_files = [file for index, file in enumerate(pending_files) if index % shard_total == shard_index]
    if pending_limit:
        if canary_source_path:
            canary_source = (docs_root / canary_source_path).resolve()
            try:
                canary_source.relative_to(docs_root.resolve())
            except ValueError as exc:
                raise SystemExit(f"configured canary source must stay under docs: {canary_source_path}") from exc
            if canary_source not in shard_files:
                raise SystemExit(f"configured canary source is not pending in this shard: {canary_source_path}")
            # Prefer a user-visible page with known glossary coverage so the
            # canary proves both translation and the deployed page content.
            shard_files = [canary_source]
        else:
            # Full canary publishes a real one-page probe before expensive batches,
            # so choose the smallest deterministic sample to cap token and review cost.
            shard_files = sorted(shard_files, key=lambda file: (file.stat().st_size, file.as_posix()))[:pending_limit]

    pending_path.parent.mkdir(parents=True, exist_ok=True)
    pending_path.write_text("\n".join(str(file) for file in shard_files) + ("\n" if shard_files else ""), encoding="utf-8")
    print(
        f"all_docs={len(all_files)} total_pending_docs={len(pending_files)} "
        f"shard={shard_index}/{shard_total} shard_pending_docs={len(shard_files)}"
    )
    return PendingResult(
        all_count=len(all_files),
        total_pending_count=len(pending_files),
        pending_count=len(shard_files),
        pending_path=pending_path,
        shard_files=shard_files,
    )


def append_output(result: PendingResult) -> None:
    output = os.environ.get("GITHUB_OUTPUT")
    if not output:
        return
    with Path(output).open("a", encoding="utf-8") as fh:
        fh.write(f"all_count={result.all_count}\n")
        fh.write(f"total_pending_count={result.total_pending_count}\n")
        fh.write(f"pending_count={result.pending_count}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build the pending docs manifest for one locale shard.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""Outputs:
  Writes .openclaw-sync/docs-i18n-<locale_slug>-s<index>of<total>.txt and GitHub output counts.

Examples:
  LOCALE=fr LOCALE_SLUG=fr MODE=incremental SHARD_INDEX=0 SHARD_TOTAL=1 python .github/scripts/i18n/build_pending_manifest.py
  LOCALE=zh-CN LOCALE_SLUG=zh-cn MODE=full SHARD_INDEX=0 SHARD_TOTAL=1 PENDING_LIMIT=1 CANARY_SOURCE_PATH=channels/line.md python .github/scripts/i18n/build_pending_manifest.py
""",
    )
    parser.add_argument("--docs-root", default="docs", type=Path)
    parser.add_argument("--openclaw-sync-dir", default=".openclaw-sync", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    shard_index, shard_total = validate_shard(os.environ["SHARD_INDEX"], os.environ["SHARD_TOTAL"])
    pending_limit = validate_pending_limit(os.environ.get("PENDING_LIMIT", "0"))
    result = build_pending_manifest(
        docs_root=args.docs_root,
        openclaw_sync_dir=args.openclaw_sync_dir,
        locale=os.environ["LOCALE"],
        locale_slug=os.environ["LOCALE_SLUG"],
        mode=os.environ["MODE"],
        shard_index=shard_index,
        shard_total=shard_total,
        pending_limit=pending_limit,
        canary_source_path=os.environ.get("CANARY_SOURCE_PATH", ""),
    )
    append_output(result)


if __name__ == "__main__":
    main()
