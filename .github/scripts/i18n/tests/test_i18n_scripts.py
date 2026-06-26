from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import contextmanager
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[4]
FIXTURES = Path(__file__).resolve().parent / "fixtures"


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPT_DIR / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


workflow_shell_check = load_module("workflow_shell_check")
budget_check = load_module("budget_check")
prepare = load_module("prepare")
pending = load_module("build_pending_manifest")
package_artifact = load_module("package_artifact")
apply_artifacts = load_module("apply_artifacts")
read_source_metadata = load_module("read_source_metadata")
prune_stale_locale_pages = load_module("prune_stale_locale_pages")


@contextmanager
def chdir(path: Path):
    old = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old)


@contextmanager
def env(values: dict[str, str]):
    old = {key: os.environ.get(key) for key in values}
    os.environ.update(values)
    try:
        yield
    finally:
        for key, value in old.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def run_git(repo: Path, *args: str) -> str:
    result = subprocess.run(["git", *args], cwd=repo, check=True, text=True, stdout=subprocess.PIPE)
    return result.stdout


def init_repo(repo: Path) -> None:
    run_git(repo, "init", "-b", "main")
    run_git(repo, "config", "user.name", "Test")
    run_git(repo, "config", "user.email", "test@example.com")


class I18NScriptTests(unittest.TestCase):
    def test_translate_workflows_call_existing_scripts_without_inline_python_or_node_heredocs(self) -> None:
        workflows = sorted((REPO_ROOT / ".github/workflows").glob("translate-*.yml"))
        self.assertTrue(workflows)

        called_scripts: set[Path] = set()
        heredoc_pattern = re.compile(r"(?:python|node)\s+-\s+<<['\"]?(?:PY|NODE)['\"]?")
        script_call_pattern = re.compile(r"python\s+(\.github/scripts/i18n/[A-Za-z0-9_./-]+\.py)\b")
        for workflow in workflows:
            text = workflow.read_text(encoding="utf-8")
            self.assertIsNone(heredoc_pattern.search(text), f"{workflow} still contains inline Python/Node heredoc")
            for match in script_call_pattern.finditer(text):
                called_scripts.add(REPO_ROOT / match.group(1))

        expected_scripts = set(SCRIPT_DIR.glob("*.py")) - {SCRIPT_DIR / "__init__.py"}
        self.assertEqual(expected_scripts, called_scripts)
        for script in called_scripts:
            self.assertTrue(script.exists(), f"workflow calls missing script: {script}")

    def test_i18n_scripts_expose_help(self) -> None:
        for script in sorted(SCRIPT_DIR.glob("*.py")):
            result = subprocess.run(
                [sys.executable, str(script), "--help"],
                cwd=REPO_ROOT,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            self.assertEqual(0, result.returncode, f"{script} --help failed: {result.stderr}")
            self.assertIn("Examples:", result.stdout, f"{script} help should include examples")

    def test_no_generated_docs_are_part_of_this_migration_diff(self) -> None:
        changed = subprocess.run(
            ["git", "diff", "--name-only"],
            cwd=REPO_ROOT,
            check=True,
            text=True,
            stdout=subprocess.PIPE,
        ).stdout.splitlines()
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=REPO_ROOT,
            check=True,
            text=True,
            stdout=subprocess.PIPE,
        ).stdout.splitlines()
        changed_paths = changed + untracked
        generated_docs = [
            path
            for path in changed_paths
            if path.startswith("docs/")
            or path == "docs/docs.json"
            or (
                path.startswith(".openclaw-sync/")
                and not path.startswith(".openclaw-sync/workflow-shell-check/")
            )
        ]
        self.assertEqual([], generated_docs)

    def test_workflow_shell_extraction_masks_github_expressions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            workflows = tmp_path / "workflows"
            shutil.copytree(FIXTURES / "workflow-shell", workflows)
            out_dir = tmp_path / "shells"

            scripts = workflow_shell_check.extract_workflow_shells(workflows, out_dir)
            self.assertEqual(1, len(scripts))
            self.assertIn('echo "__GITHUB_EXPR__"', scripts[0].read_text(encoding="utf-8"))
            workflow_shell_check.check_bash_syntax(scripts)

    def test_budget_check_accepts_current_full_matrix_and_rejects_worker_over_budget(self) -> None:
        budget = budget_check.validate_budget(REPO_ROOT / ".github/workflows/translate-all.yml")
        self.assertEqual(18, budget.locale_count)
        self.assertEqual(14, budget.shard_total)
        self.assertEqual(252, budget.matrix_jobs)
        self.assertEqual(24, budget.active_workers)

        with tempfile.TemporaryDirectory() as tmp:
            workflow = Path(tmp) / "translate-all.yml"
            text = (REPO_ROOT / ".github/workflows/translate-all.yml").read_text(encoding="utf-8")
            workflow.write_text(text.replace("max-parallel: 12", "max-parallel: 13"), encoding="utf-8")
            with self.assertRaises(SystemExit):
                budget_check.validate_budget(workflow)

    def test_prepare_path_selection_matches_incremental_rules(self) -> None:
        self.assertTrue(prepare.is_translatable_doc_path("docs/guide/setup.mdx"))
        self.assertTrue(prepare.is_translatable_doc_path("docs/reference/test.md"))
        self.assertFalse(prepare.is_translatable_doc_path("docs/fr/guide/setup.mdx"))
        self.assertFalse(prepare.is_translatable_doc_path("docs/.i18n/glossary.fr.json"))
        self.assertFalse(prepare.is_translatable_doc_path("docs/.generated/api.md"))
        self.assertEqual("3600", prepare.default_cooldown("incremental", "push", "", "3600"))
        self.assertEqual("0", prepare.default_cooldown("incremental", "workflow_dispatch", "", "3600"))
        self.assertEqual("3600", prepare.default_cooldown("full", "repository_dispatch", "", "3600"))

    def test_read_source_metadata_validates_requested_sha_and_outputs_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source_json = Path(tmp) / "source.json"
            source_json.write_text('{"repository":"openclaw/openclaw","sha":"source-a"}\n', encoding="utf-8")
            metadata = read_source_metadata.read_source_metadata(source_json, "source-a")
            self.assertEqual("openclaw/openclaw", metadata.repository)
            self.assertEqual("source-a", metadata.sha)
            with self.assertRaises(SystemExit):
                read_source_metadata.read_source_metadata(source_json, "other-source")

    def test_prune_stale_locale_pages_removes_only_pages_without_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            (docs / "fr/old/nested").mkdir(parents=True)
            (docs / "fr/index.md").parent.mkdir(parents=True, exist_ok=True)
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            (docs / "fr/index.md").write_text("# Index FR\n", encoding="utf-8")
            (docs / "fr/old/nested/page.md").write_text("# Old\n", encoding="utf-8")

            removed = prune_stale_locale_pages.prune_stale_locale_pages(docs, "fr")

            self.assertEqual(1, removed)
            self.assertTrue((docs / "fr/index.md").exists())
            self.assertFalse((docs / "fr/old").exists())

    def test_pending_manifest_filters_locale_generated_and_shards_pending_docs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            result = pending.build_pending_manifest(
                docs_root=tmp_path / "docs",
                openclaw_sync_dir=tmp_path / ".openclaw-sync",
                locale="fr",
                locale_slug="fr",
                mode="incremental",
                shard_index=1,
                shard_total=2,
            )

            self.assertEqual(2, result.all_count)
            self.assertEqual(2, result.total_pending_count)
            self.assertEqual(1, result.pending_count)
            self.assertTrue(result.shard_files[0].as_posix().endswith("/docs/index.md"))
            self.assertEqual(str(result.shard_files[0]), result.pending_path.read_text(encoding="utf-8").strip())

    def test_pending_manifest_skips_matching_incremental_hash(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")
            source = tmp_path / "docs/index.md"
            digest = hashlib.sha256(source.read_bytes()).hexdigest()
            (tmp_path / "docs/fr/index.md").write_text(
                f"---\nx-i18n:\n  source_hash: {digest}\n---\n\n# Index FR\n",
                encoding="utf-8",
            )

            result = pending.build_pending_manifest(
                docs_root=tmp_path / "docs",
                openclaw_sync_dir=tmp_path / ".openclaw-sync",
                locale="fr",
                locale_slug="fr",
                mode="incremental",
                shard_index=0,
                shard_total=1,
            )

            self.assertEqual(2, result.all_count)
            self.assertEqual(1, result.total_pending_count)
            self.assertTrue(result.shard_files[0].as_posix().endswith("/docs/guide/setup.mdx"))

    def test_package_artifact_keeps_only_allowed_changed_paths_and_payload(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs").mkdir()
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/fr/index.md").write_text("# Index FR\n", encoding="utf-8")
            (repo / "docs/.i18n").mkdir(parents=True)
            (repo / "docs/.i18n/fr.tm.jsonl").write_text('{"ok":true}\n', encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n", encoding="utf-8")

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "LOCALE": "fr",
                    "LOCALE_SLUG": "fr",
                    "SOURCE_SHA": "source-a",
                    "MODE": "incremental",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "WORKER_PARALLEL": "8",
                    "THINKING_EFFORT": "medium",
                    "PENDING_COUNT": "1",
                    "TOTAL_PENDING_COUNT": "1",
                    "ALL_COUNT": "1",
                    "TRANSLATE_OUTCOME": "success",
                    "MDX_CHECK_OUTCOME": "skipped",
                    "MDX_REPAIR_OUTCOME": "skipped",
                    "MDX_SCOPE_OUTCOME": "skipped",
                    "MDX_RECHECK_OUTCOME": "skipped",
                }
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual(2, metadata["changed_count"])
            self.assertEqual(["docs/.i18n/fr.tm.jsonl", "docs/fr/index.md"], (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines())
            self.assertTrue((artifact / "payload/docs/fr/index.md").exists())
            self.assertTrue((artifact / "payload/docs/.i18n/fr.tm.jsonl").exists())

    def test_package_artifact_failure_writes_empty_payload_contract(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs").mkdir()
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "LOCALE": "fr",
                    "LOCALE_SLUG": "fr",
                    "SOURCE_SHA": "source-a",
                    "MODE": "incremental",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "WORKER_PARALLEL": "8",
                    "THINKING_EFFORT": "medium",
                    "PENDING_COUNT": "1",
                    "TOTAL_PENDING_COUNT": "1",
                    "ALL_COUNT": "1",
                    "TRANSLATE_OUTCOME": "failure",
                    "MDX_CHECK_OUTCOME": "skipped",
                    "MDX_REPAIR_OUTCOME": "skipped",
                    "MDX_SCOPE_OUTCOME": "skipped",
                    "MDX_RECHECK_OUTCOME": "skipped",
                }
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual("translation failed", metadata["failed_reason"])
            self.assertEqual("", (artifact / "changed-files.txt").read_text(encoding="utf-8"))
            self.assertEqual("", (artifact / "deleted-files.txt").read_text(encoding="utf-8"))

    def test_apply_artifacts_applies_normal_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "normal",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 0,
                    "shard_total": 1,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/index.md"],
                payload={
                    "docs/fr/index.md": (
                        "---\n"
                        "x-i18n:\n"
                        "  source_hash: 1111111111111111111111111111111111111111111111111111111111111111\n"
                        "---\n\n"
                        "# Index FR\n"
                    )
                },
            )

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="incremental",
                    shard_total=1,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            self.assertEqual(0, result["incomplete_count"])
            self.assertTrue((repo / "docs/fr/index.md").exists())
            self.assertIn("Index FR", (repo / "docs/fr/index.md").read_text(encoding="utf-8"))

    def test_apply_artifacts_reports_missing_metadata_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(artifacts, "missing-metadata", include_metadata=False, changed=["docs/fr/index.md"])

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="incremental",
                    shard_total=1,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            incomplete = (repo / ".openclaw-sync/i18n-incomplete-locales.txt").read_text(encoding="utf-8")
            self.assertEqual(2, result["incomplete_count"])
            self.assertIn("fr", incomplete)
            self.assertIn("missing metadata.json", incomplete)

    def test_apply_artifacts_reports_failed_metadata_fixture(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "failed",
                metadata={
                    "failed_reason": "translation failed",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 0,
                    "shard_total": 1,
                    "source_sha": "source-a",
                },
            )

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="incremental",
                    shard_total=1,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            incomplete = (repo / ".openclaw-sync/i18n-incomplete-locales.txt").read_text(encoding="utf-8")
            self.assertEqual(1, result["incomplete_count"])
            self.assertIn("fr: translation failed", incomplete)

    def _repo_with_source(self, tmp: str) -> Path:
        repo = Path(tmp)
        init_repo(repo)
        (repo / ".openclaw-sync").mkdir()
        (repo / ".openclaw-sync/source.json").write_text('{"repository":"openclaw/openclaw","sha":"source-a"}\n', encoding="utf-8")
        (repo / "docs").mkdir()
        (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
        run_git(repo, "add", ".")
        run_git(repo, "commit", "-m", "initial")
        return repo

    def _write_artifact(
        self,
        artifacts_root: Path,
        name: str,
        *,
        metadata: dict[str, object] | None = None,
        include_metadata: bool = True,
        changed: list[str] | None = None,
        deleted: list[str] | None = None,
        payload: dict[str, str] | None = None,
    ) -> Path:
        artifact = artifacts_root / name
        artifact.mkdir(parents=True)
        if include_metadata:
            (artifact / "metadata.json").write_text(
                json.dumps(metadata or {}, indent=2, sort_keys=True) + "\n",
                encoding="utf-8",
            )
        changed_files = changed or []
        deleted_files = deleted or []
        (artifact / "changed-files.txt").write_text("\n".join(changed_files) + ("\n" if changed_files else ""), encoding="utf-8")
        (artifact / "deleted-files.txt").write_text("\n".join(deleted_files) + ("\n" if deleted_files else ""), encoding="utf-8")
        for rel, text in (payload or {}).items():
            payload_path = artifact / "payload" / rel
            payload_path.parent.mkdir(parents=True, exist_ok=True)
            payload_path.write_text(text, encoding="utf-8")
        return artifact


if __name__ == "__main__":
    unittest.main()
