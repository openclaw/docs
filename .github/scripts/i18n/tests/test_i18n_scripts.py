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
from unittest.mock import patch


SCRIPT_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[4]
FIXTURES = Path(__file__).resolve().parent / "fixtures"
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))
NON_CLI_SCRIPT_MODULES = {SCRIPT_DIR / "translation_plan.py"}
WORKFLOW_TEST_ENTRYPOINTS = {SCRIPT_DIR / "tests/test_i18n_scripts.py"}


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
translation_plan = load_module("translation_plan")
pending = load_module("build_pending_manifest")
clear_pending_locale_outputs = load_module("clear_pending_locale_outputs")
package_artifact = load_module("package_artifact")
mdx_repair_scope = load_module("mdx_repair_scope")
mdx_repair_relay = load_module("mdx_repair_relay")
mdx_repair_validation = load_module("mdx_repair_validation")
mdx_repair_canary = load_module("mdx_repair_canary")
apply_artifacts = load_module("apply_artifacts")
merge_artifact_roots = load_module("merge_artifact_roots")
read_source_metadata = load_module("read_source_metadata")
prune_stale_locale_pages = load_module("prune_stale_locale_pages")
plan_full = load_module("plan_full")
plan_incremental = load_module("plan_incremental")
provider_preflight = load_module("provider_preflight")
summarize_full = load_module("summarize_full")
commit_locale_artifact = load_module("commit_locale_artifact")
dispatch_r2_pages = load_module("dispatch_r2_pages")


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
        # The MDX repair validation sub-pipeline (STORY-05) joins the same
        # audit: no inline interpreter heredocs, and every i18n control-plane
        # script it uses is called through the recognized patterns.
        validation_workflow = REPO_ROOT / ".github/workflows/mdx-repair-validation.yml"
        workflows = sorted(set((REPO_ROOT / ".github/workflows").glob("translate-*.yml")) | {validation_workflow})
        self.assertTrue(workflows)

        called_scripts: set[Path] = set()
        heredoc_pattern = re.compile(r"(?:python|node)\s+-\s+<<['\"]?(?:PY|NODE)['\"]?")
        script_call_pattern = re.compile(
            r"python\s+(?:"
            r"(?P<repo>\.github/scripts/i18n/[A-Za-z0-9_./-]+\.py)"
            r"|\"\$\{I18N_SCRIPT_DIR\}/(?P<temp>[A-Za-z0-9_-]+\.py)\""
            r")(?=\s|$)"
        )
        for workflow in workflows:
            text = workflow.read_text(encoding="utf-8")
            self.assertIsNone(heredoc_pattern.search(text), f"{workflow} still contains inline Python/Node heredoc")
            for match in script_call_pattern.finditer(text):
                if match.group("repo"):
                    called_scripts.add(REPO_ROOT / match.group("repo"))
                else:
                    called_scripts.add(SCRIPT_DIR / match.group("temp"))

        expected_scripts = (
            set(SCRIPT_DIR.glob("*.py")) - {SCRIPT_DIR / "__init__.py"} - NON_CLI_SCRIPT_MODULES
        ) | WORKFLOW_TEST_ENTRYPOINTS
        self.assertEqual(expected_scripts, called_scripts)
        for script in called_scripts:
            self.assertTrue(script.exists(), f"workflow calls missing script: {script}")

    def test_i18n_scripts_expose_help(self) -> None:
        for script in sorted(set(SCRIPT_DIR.glob("*.py")) - NON_CLI_SCRIPT_MODULES):
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
        allowed_docs_paths = {
            "docs/.i18n/translation-workflow.md",
            "docs/.i18n/translation-ci-temporary-todo.md",
            # STORY-06 canary operations manual (repo-owned control-plane doc).
            "docs/.i18n/mdx-repair-canary-operations.md",
            # Portable handoff for the unmerged control-plane implementation.
            "docs/.i18n/mdx-repair-handoff.md",
        }
        allowed_openclaw_sync_paths = {".openclaw-sync/docs-mdx-repair.md"}
        generated_docs = [
            path
            for path in changed_paths
            if (path.startswith("docs/") and path not in allowed_docs_paths)
            or path == "docs/docs.json"
            or (
                path.startswith(".openclaw-sync/")
                and path not in allowed_openclaw_sync_paths
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

    def test_shell_check_installs_mdx_dependency_before_regressions(self) -> None:
        text = (REPO_ROOT / ".github/workflows/translate-shell-check-reusable.yml").read_text(encoding="utf-8")
        install = "npm install --no-save --package-lock=false @mdx-js/mdx@3.1.1"
        self.assertIn(install, text)
        self.assertLess(text.index(install), text.index("Run i18n control-plane regressions"))

    def test_budget_check_accepts_current_full_batches_and_rejects_worker_over_budget(self) -> None:
        budget = budget_check.validate_budget(REPO_ROOT / ".github/workflows/translate-all.yml")
        self.assertEqual(6, budget.batch_count)
        self.assertEqual(3, budget.max_batch_parallel)
        self.assertEqual(3, budget.worker_parallel)
        self.assertEqual(9, budget.active_workers)
        self.assertFalse(budget.cancel_in_progress)

        with tempfile.TemporaryDirectory() as tmp:
            workflow = Path(tmp) / "translate-all.yml"
            text = (REPO_ROOT / ".github/workflows/translate-all.yml").read_text(encoding="utf-8")
            workflow.write_text(text.replace('worker_parallel: "3"', 'worker_parallel: "5"'), encoding="utf-8")
            with self.assertRaises(SystemExit):
                budget_check.validate_budget(workflow)

    def test_full_workflow_keeps_only_weekly_and_manual_triggers(self) -> None:
        text = (REPO_ROOT / ".github/workflows/translate-all.yml").read_text(encoding="utf-8")
        self.assertNotIn("repository_dispatch:", text)
        self.assertNotIn('"docs/.i18n/glossary.*.json"', text)
        self.assertIn("schedule:", text)
        self.assertIn("workflow_dispatch:", text)
        self.assertIn("target_locale:", text)
        self.assertIn("resume_run_id:", text)
        self.assertIn("canary_only:", text)
        self.assertIn("cancel-in-progress: false", text)

    def test_full_workflow_gates_batches_after_canary(self) -> None:
        text = (REPO_ROOT / ".github/workflows/translate-all.yml").read_text(encoding="utf-8")
        reusable = (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")
        for index in range(1, 7):
            self.assertIn(f"translate-batch-{index}:", text)
            self.assertIn("needs.translate-canary.result == 'success'", text)
            self.assertIn("inputs.canary_only != true", text)
        self.assertIn("artifact_role: canary", text)
        self.assertIn("canary_source_path: ${{ inputs.canary_source_path || 'channels/line.md' }}", text)
        self.assertIn("diagnostic_canary_only:", text)
        self.assertEqual(7, text.count("inputs.diagnostic_canary_only != true"))
        self.assertIn(
            "max_attempts: ${{ (inputs.canary_source_path || 'channels/line.md') != 'channels/line.md' && '1' || '5' }}",
            text,
        )
        self.assertIn(
            "log_rejected_body: ${{ (inputs.canary_source_path || 'channels/line.md') != 'channels/line.md' }}",
            text,
        )
        self.assertIn(
            "if: inputs.canary_only == true && inputs.canary_source_path != 'channels/line.md'",
            text,
        )
        self.assertIn("canary_live_path: channels/line", text)
        self.assertIn("canary_expected_h1: LINE", text)
        self.assertIn("canary_publish_required: ${{ inputs.canary_only == true }}", text)
        self.assertIn("shard_index: ${{ matrix.shard_index }}", text)
        self.assertIn("shard_total: ${{ matrix.shard_total }}", text)
        self.assertIn("commit_locale: false", text)
        self.assertIn("translate-finalize-reusable.yml", text)
        self.assertIn("run-id: ${{ inputs.resume_run_id }}", text)
        self.assertIn("resume_run_id: ${{ inputs.resume_run_id || '' }}", text)
        self.assertIn("merge_artifact_roots.py", text)
        self.assertIn("needs.plan.outputs.translation_required == 'false'", text)
        self.assertNotIn("translate-locale-finalize-reusable.yml", text)
        self.assertRegex(
            text,
            r"translate-canary:[\s\S]*?artifact_role: canary[\s\S]*?commit_locale: \$\{\{ inputs\.canary_only == true \}\}",
        )
        self.assertIn(
            "inputs.commit_locale || (inputs.artifact_role == 'canary' && inputs.canary_publish_required)",
            reusable,
        )
        self.assertNotIn("inputs.artifact_role == 'canary' || steps.apply.outputs.changed_count != '0'", reusable)
        self.assertIn("inputs.artifact_role != 'canary' && steps.apply.outputs.changed_count != '0'", reusable)
        self.assertIn("inputs.commit_locale && steps.apply.outputs.changed_count != '0'", reusable)
        self.assertIn("Fail uncommitted locale refresh", reusable)
        self.assertIn(
            "(inputs.artifact_role == 'canary' && inputs.canary_publish_required) || (inputs.commit_locale && steps.locale_commit.outputs.committed == 'true')",
            reusable,
        )
        self.assertIn("ARTIFACT_DIR: .openclaw-sync/i18n-artifacts/${{ inputs.locale_slug }}-s${{ inputs.shard_index }}of${{ inputs.shard_total }}", reusable)
        self.assertIn("include-hidden-files: true", reusable)
        self.assertIn('PARTIAL_ARGS=(--allow-partial)', reusable)
        self.assertIn('python "${I18N_SCRIPT_DIR}/clear_pending_locale_outputs.py"', reusable)
        self.assertIn('if [ "${MODE}" = "full" ] && [ "$attempt" -eq 1 ]; then', reusable)
        self.assertIn('PARTIAL_ARGS+=(--overwrite)', reusable)
        self.assertIn('echo "docs-i18n strict completion check $attempt/$max_attempts"', reusable)
        self.assertIn('echo "I18N_SCRIPT_DIR=${I18N_SCRIPT_DIR}" >> "$GITHUB_ENV"', reusable)
        self.assertIn("ref: ${{ github.workflow_sha }}", reusable)
        self.assertIn('python "${I18N_SCRIPT_DIR}/build_pending_manifest.py"', reusable)
        self.assertIn('python "${I18N_SCRIPT_DIR}/commit_locale_artifact.py"', reusable)
        self.assertIn('python "${I18N_SCRIPT_DIR}/dispatch_r2_pages.py" "${args[@]}"', reusable)
        commit_locale_block = re.search(r"(?ms)^  commit-locale:.*?(?=^  [a-zA-Z0-9_-]+:|\Z)", reusable)
        self.assertIsNotNone(commit_locale_block)
        self.assertNotIn("concurrency:", commit_locale_block.group(0))
        self.assertIn("It retries rebase/push conflicts", commit_locale_artifact.__doc__ or "")
        self.assertIn("--artifact-scope page", reusable)
        self.assertIn('--ref "${{ github.ref_name }}"', reusable)
        self.assertIn('--locale "${{ inputs.locale }}"', reusable)
        self.assertIn('--page-path "${{ inputs.canary_live_path }}"', reusable)
        self.assertIn('if [ "${{ inputs.canary_publish_required }}" = "true" ]; then', reusable)
        self.assertIn('--live-url "${CANARY_LIVE_URL}"', reusable)
        self.assertIn('--expect-h1 "${CANARY_EXPECTED_H1}"', reusable)
        self.assertIn("--no-wait", reusable)
        self.assertIn("Canary scoped R2 publish dispatch failed; continuing", reusable)
        self.assertIn("--artifact-scope locale", reusable)
        self.assertIn("--no-force-upload", reusable)
        finalize_reusable = (REPO_ROOT / ".github/workflows/translate-finalize-reusable.yml").read_text(encoding="utf-8")
        self.assertIn('echo "I18N_SCRIPT_DIR=${I18N_SCRIPT_DIR}" >> "$GITHUB_ENV"', finalize_reusable)
        self.assertIn("ref: ${{ github.workflow_sha }}", finalize_reusable)
        self.assertIn("EXPECTED_LOCALES: ${{ inputs.expected_locales }}", finalize_reusable)
        self.assertIn("id: aggregate_commit", finalize_reusable)
        self.assertIn('echo "committed=true" >> "$GITHUB_OUTPUT"', finalize_reusable)
        self.assertIn("Fail uncommitted aggregate translation refresh", finalize_reusable)
        self.assertIn("steps.aggregate_commit.outputs.committed != 'true'", finalize_reusable)
        self.assertIn("steps.aggregate_commit.outputs.committed == 'true'", finalize_reusable)
        self.assertIn('python "${I18N_SCRIPT_DIR}/dispatch_r2_pages.py"', finalize_reusable)
        self.assertIn("expected_locales: ${{ needs.plan.outputs.expected_locales }}", text)
        self.assertIn("FINALIZE_RESULT: ${{ needs.finalize.result }}", text)
        self.assertNotIn("finalize-batch-", text)
        self.assertIn("provider-preflight:", text)
        self.assertIn("Translate Full completed with failed or cancelled work", text)
        r2_pages = (REPO_ROOT / ".github/workflows/r2-pages.yml").read_text(encoding="utf-8")
        actionlint_config = (REPO_ROOT / ".github/actionlint.yaml").read_text(encoding="utf-8")
        self.assertIn("- locale", r2_pages)
        self.assertIn("- page", r2_pages)
        self.assertRegex(r2_pages, r"group: r2-pages\s+queue: max\s+cancel-in-progress: false")
        self.assertIn(".github/workflows/r2-pages.yml:", actionlint_config)
        self.assertIn('unexpected key "queue" for "concurrency" section', actionlint_config)
        self.assertIn("run-name: R2 Pages", r2_pages)
        self.assertIn("request_id:", r2_pages)
        self.assertIn("Fail stale scoped translation deploy", r2_pages)
        self.assertIn("Refresh scoped docs content from main", r2_pages)
        self.assertIn("SCOPED_CONTENT_SHA: ${{ steps.scoped-content.outputs.content_sha || '' }}", r2_pages)
        self.assertIn("R2_UPLOAD_SCOPE: ${{ steps.artifact-scope.outputs.upload_scope }}", r2_pages)
        self.assertIn("R2_UPLOAD_LOCALE: ${{ inputs.locale || '' }}", r2_pages)
        self.assertIn("R2_UPLOAD_PAGE_PATH: ${{ inputs.page_path || '' }}", r2_pages)

    def test_translation_worker_preserves_progress_across_retries(self) -> None:
        reusable = (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")
        self.assertIn("MODE: ${{ inputs.mode }}", reusable)
        self.assertIn('if [ "${MODE}" = "full" ] && [ "$attempt" -eq 1 ]; then', reusable)
        self.assertIn("PARTIAL_ARGS+=(--overwrite)", reusable)
        self.assertIn("PARTIAL_ARGS=(--allow-partial)", reusable)
        self.assertIn('"${PARTIAL_ARGS[@]}"', reusable)
        self.assertNotIn('if [ "${MODE}" != "full" ]; then\n                exit 0', reusable)
        self.assertNotIn('if [ "${MODE}" = "full" ]; then\n              echo "docs-i18n strict completion check', reusable)
        self.assertIn('echo "docs-i18n strict completion check $attempt/$max_attempts"', reusable)
        self.assertNotIn("TRANSLATE_ARGS", reusable)

    def test_clear_pending_locale_outputs_removes_only_requested_locale_pages(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs"
            source = docs / "guide/page.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Source\n", encoding="utf-8")
            requested = docs / "hi/guide/page.md"
            untouched = docs / "hi/guide/other.md"
            requested.parent.mkdir(parents=True)
            requested.write_text("# Old\n", encoding="utf-8")
            untouched.write_text("# Keep\n", encoding="utf-8")
            manifest = root / "pending.txt"
            manifest.write_text(f"{source.resolve()}\n", encoding="utf-8")

            removed = clear_pending_locale_outputs.clear_pending_locale_outputs(docs, manifest, "hi")

            self.assertEqual(1, removed)
            self.assertFalse(requested.exists())
            self.assertTrue(untouched.exists())

    def test_clear_pending_locale_outputs_rejects_escape_before_deleting(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs"
            source = docs / "guide/page.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Source\n", encoding="utf-8")
            localized = docs / "hi/guide/page.md"
            localized.parent.mkdir(parents=True)
            localized.write_text("# Old\n", encoding="utf-8")
            outside = root / "outside.md"
            outside.write_text("# Outside\n", encoding="utf-8")
            manifest = root / "pending.txt"
            manifest.write_text(f"{source.resolve()}\n{outside.resolve()}\n", encoding="utf-8")

            with self.assertRaisesRegex(SystemExit, "must stay under docs"):
                clear_pending_locale_outputs.clear_pending_locale_outputs(docs, manifest, "hi")

            self.assertTrue(localized.exists())

    def test_clear_pending_locale_outputs_rejects_source_symlink_without_remapping(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs"
            source = docs / "guide/real.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Source\n", encoding="utf-8")
            alias = docs / "guide/alias.md"
            alias.symlink_to(source)
            real_output = docs / "hi/guide/real.md"
            alias_output = docs / "hi/guide/alias.md"
            real_output.parent.mkdir(parents=True)
            real_output.write_text("# Real output\n", encoding="utf-8")
            alias_output.write_text("# Alias output\n", encoding="utf-8")
            manifest = root / "pending.txt"
            manifest.write_text(f"{alias.parent.resolve() / alias.name}\n", encoding="utf-8")

            with self.assertRaisesRegex(SystemExit, "must be canonical and must not use symlinks"):
                clear_pending_locale_outputs.clear_pending_locale_outputs(docs, manifest, "hi")

            self.assertTrue(real_output.exists())
            self.assertTrue(alias_output.exists())

    def test_clear_pending_locale_outputs_rejects_anchored_locale(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs"
            source = docs / "guide/page.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Source\n", encoding="utf-8")
            localized = docs / "hi/guide/page.md"
            localized.parent.mkdir(parents=True)
            localized.write_text("# Old\n", encoding="utf-8")
            manifest = root / "pending.txt"
            manifest.write_text(f"{source.resolve()}\n", encoding="utf-8")

            with self.assertRaisesRegex(SystemExit, "invalid locale"):
                clear_pending_locale_outputs.clear_pending_locale_outputs(docs, manifest, "/")

            self.assertTrue(localized.exists())

    def test_clear_pending_locale_outputs_rejects_symlinked_parent(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            docs = root / "docs"
            source = docs / "guide/page.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Source\n", encoding="utf-8")
            outside = root / "outside"
            outside.mkdir()
            outside_output = outside / "page.md"
            outside_output.write_text("# Outside output\n", encoding="utf-8")
            locale_root = docs / "hi"
            locale_root.mkdir()
            (locale_root / "guide").symlink_to(outside, target_is_directory=True)
            manifest = root / "pending.txt"
            manifest.write_text(f"{source.resolve()}\n", encoding="utf-8")

            with self.assertRaisesRegex(SystemExit, "parent must not be a symlink"):
                clear_pending_locale_outputs.clear_pending_locale_outputs(docs, manifest, "hi")

            self.assertTrue(outside_output.exists())

    def test_translation_worker_timeout_accommodates_full_shards(self) -> None:
        reusable = (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")
        self.assertRegex(reusable, r"(?ms)^  translate:\n.*?^    timeout-minutes: 360$")

    def test_translation_workflows_pin_latest_codex_and_tier_effort(self) -> None:
        reusable = (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")
        full = (REPO_ROOT / ".github/workflows/translate-all.yml").read_text(encoding="utf-8")
        incremental = (REPO_ROOT / ".github/workflows/translate-incremental.yml").read_text(encoding="utf-8")

        self.assertIn("npm install -g @openai/codex@0.146.1", reusable)
        self.assertIn("effort: xhigh", reusable)
        self.assertNotIn("effort: max", reusable)
        self.assertEqual(1, full.count('thinking_effort: "xhigh"'))
        self.assertEqual(6, full.count("thinking_effort: ${{ inputs.translation_effort || 'xhigh' }}"))
        self.assertIn("translation_effort:", full)
        self.assertIn("canary_source_path:", full)
        self.assertIn("canary_source_path: ${{ inputs.canary_source_path || 'channels/line.md' }}", full)
        self.assertNotIn("- max", full)
        self.assertEqual(1, incremental.count('thinking_effort: "xhigh"'))
        self.assertNotIn('thinking_effort: "max"', incremental)

    def test_prepare_path_selection_matches_incremental_rules(self) -> None:
        self.assertTrue(prepare.is_translatable_doc_path("docs/guide/setup.mdx"))
        self.assertTrue(prepare.is_translatable_doc_path("docs/reference/test.md"))
        self.assertFalse(prepare.is_translatable_doc_path("docs/fr/guide/setup.mdx"))
        self.assertFalse(prepare.is_translatable_doc_path("docs/.i18n/glossary.fr.json"))
        self.assertFalse(prepare.is_translatable_doc_path("docs/.generated/api.md"))
        self.assertEqual("3600", prepare.default_cooldown("incremental", "push", "", "3600"))
        self.assertEqual("0", prepare.default_cooldown("incremental", "workflow_dispatch", "", "3600"))
        self.assertEqual("0", prepare.default_cooldown("full", "schedule", "", "3600"))
        self.assertFalse(prepare.incremental_should_translate_paths(["docs/.i18n/glossary.fr.json"]))
        self.assertTrue(prepare.incremental_should_translate_paths(["docs/.i18n/glossary.fr.json", "docs/guide/setup.mdx"]))

    def test_incremental_workflow_schedules_all_expected_finalizer_locales(self) -> None:
        text = (REPO_ROOT / ".github/workflows/translate-incremental.yml").read_text(encoding="utf-8")
        expected = apply_artifacts.parse_expected(apply_artifacts.DEFAULT_EXPECTED_LOCALES)

        self.assertEqual(expected, {locale.locale_slug: locale.locale for locale in translation_plan.all_locales()})
        self.assertIn('python "${I18N_SCRIPT_DIR}/plan_incremental.py"', text)
        self.assertIn("matrix: ${{ fromJSON(needs.plan.outputs.matrix) }}", text)
        self.assertIn("max-parallel: 12", text)
        self.assertIn("shard_index: ${{ matrix.shard_index }}", text)
        self.assertIn("shard_total: ${{ matrix.shard_total }}", text)
        self.assertIn("shard_total: ${{ needs.plan.outputs.shard_total }}", text)
        self.assertIn('worker_parallel: "3"', text)
        self.assertNotIn('shard_index: "0"', text)
        self.assertNotIn('shard_total: "1"', text)
        self.assertNotIn('worker_parallel: "8"', text)
        for slug in expected.values():
            self.assertIn(f'!docs/{slug}/**', text)

    def test_incremental_workflow_keeps_running_debounce_on_hot_main(self) -> None:
        text = (REPO_ROOT / ".github/workflows/translate-incremental.yml").read_text(encoding="utf-8")

        self.assertRegex(text, r"group: docs-i18n-incremental\s+(?:#[^\n]*\n\s*)*cancel-in-progress: false")

    def test_locale_like_docs_dirs_are_supported_and_excluded_from_incremental_triggers(self) -> None:
        text = (REPO_ROOT / ".github/workflows/translate-incremental.yml").read_text(encoding="utf-8")
        docs_dirs = {path.name for path in (REPO_ROOT / "docs").iterdir() if path.is_dir()}
        supported_locales = {locale.locale for locale in translation_plan.all_locales()}
        excluded_dirs = set(re.findall(r'!\s*docs/([^/]+)/\*\*', text))

        # Locale output directories use short BCP47 tags. Treating only this
        # shape as locale-like avoids false positives such as docs/web.
        locale_like_dirs = {name for name in docs_dirs if re.fullmatch(r"[a-z]{2}(?:-[A-Z]{2})?", name)}

        self.assertEqual(set(), locale_like_dirs - supported_locales)
        self.assertEqual(set(), supported_locales - excluded_dirs)

    def test_supported_locale_dirs_are_never_source_docs_without_markers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            docs.mkdir()
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            for locale in translation_plan.all_locales():
                locale_dir = docs / locale.locale
                locale_dir.mkdir()
                (locale_dir / "index.md").write_text(f"# {locale.locale}\n", encoding="utf-8")

            incremental = plan_incremental.plan_incremental(docs, target_docs_per_shard=1, max_shards=4)
            pending_result = pending.build_pending_manifest(
                docs_root=docs,
                openclaw_sync_dir=Path(tmp) / ".openclaw-sync",
                locale="de",
                locale_slug="de",
                mode="incremental",
                shard_index=0,
                shard_total=1,
            )

            self.assertEqual(1, incremental["source_doc_count"])
            self.assertEqual(1, pending_result.all_count)
            self.assertEqual(1, pending_result.total_pending_count)

    def test_full_plan_all_uses_canary_and_small_batches(self) -> None:
        result = plan_full.plan_full("all", 4, FIXTURES / "pending-docs" / "docs")
        self.assertEqual("es", result["canary"]["locale"])
        self.assertEqual(5, len(result["batches"]))
        self.assertEqual(1, result["shard_total"])
        self.assertEqual(20, len(result["expected_locales"].split()))
        self.assertLessEqual(max(len(batch) for batch in result["batches"]), 4)
        self.assertEqual(20, sum(len(batch) for batch in result["batches"]))

    def test_translation_plan_shared_shard_policy(self) -> None:
        self.assertEqual(1, translation_plan.shard_total_for_doc_count(0, 250, 4))
        self.assertEqual(1, translation_plan.shard_total_for_doc_count(250, 250, 4))
        self.assertEqual(2, translation_plan.shard_total_for_doc_count(251, 250, 4))
        self.assertEqual(4, translation_plan.shard_total_for_doc_count(1200, 250, 4))
        with self.assertRaises(SystemExit):
            translation_plan.shard_total_for_doc_count(10, 0, 4)
        with self.assertRaises(SystemExit):
            translation_plan.shard_total_for_doc_count(10, 250, 0)

    def test_full_plan_shards_large_batches_without_increasing_locale_batch_size(self) -> None:
        result = plan_full.plan_full("ru", 4, FIXTURES / "pending-docs" / "docs", target_docs_per_shard=1, max_shards=4)

        self.assertEqual(2, result["shard_total"])
        self.assertEqual(
            [
                {"locale": "ru", "locale_slug": "ru", "shard_index": "0", "shard_total": "2"},
                {"locale": "ru", "locale_slug": "ru", "shard_index": "1", "shard_total": "2"},
            ],
            result["batches"][0],
        )
        self.assertEqual("ru=ru", result["expected_locales"])

    def test_full_plan_resume_reruns_only_failed_shards(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifacts = Path(tmp) / "artifacts"
            base_metadata = {
                "artifact_role": "locale",
                "locale": "ru",
                "locale_slug": "ru",
                "mode": "full",
                "shard_total": 2,
                "source_sha": "source-a",
                "changed_count": 0,
                "deleted_count": 0,
            }
            self._write_artifact(
                artifacts,
                "i18n-ru-s0of2-source-a",
                metadata={**base_metadata, "shard_index": 0, "failed_reason": ""},
            )
            self._write_artifact(
                artifacts,
                "i18n-ru-s1of2-source-a",
                metadata={**base_metadata, "shard_index": 1, "failed_reason": "translation failed"},
            )

            result = plan_full.plan_full(
                "ru",
                4,
                FIXTURES / "pending-docs" / "docs",
                target_docs_per_shard=1,
                max_shards=4,
                resume_artifacts_root=artifacts,
                source_sha="source-a",
            )

            self.assertTrue(result["resume_mode"])
            self.assertTrue(result["translation_required"])
            self.assertEqual([{"locale": "ru", "locale_slug": "ru"}], result["selected"])
            self.assertEqual(
                [[{"locale": "ru", "locale_slug": "ru", "shard_index": "1", "shard_total": "2"}]],
                result["batches"],
            )

    def test_full_resume_keeps_successful_locales_in_finalization_set(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifacts = Path(tmp) / "artifacts"
            locales = [translation_plan.Locale("fr", "fr"), translation_plan.Locale("ru", "ru")]
            for locale in locales:
                for shard_index in range(2):
                    failed = locale.locale == "ru" and shard_index == 1
                    self._write_artifact(
                        artifacts,
                        f"i18n-{locale.locale_slug}-s{shard_index}of2-source-a",
                        metadata={
                            "artifact_role": "locale",
                            "locale": locale.locale,
                            "locale_slug": locale.locale_slug,
                            "mode": "full",
                            "shard_index": shard_index,
                            "shard_total": 2,
                            "source_sha": "source-a",
                            "failed_reason": "translation failed" if failed else "",
                            "changed_count": 0,
                            "deleted_count": 0,
                        },
                    )

            batches = plan_full.build_resume_plan(locales, 2, artifacts, "source-a")

            self.assertEqual(
                [[{"locale": "ru", "locale_slug": "ru", "shard_index": "1", "shard_total": "2"}]],
                batches,
            )
            self.assertEqual(["fr", "ru"], [locale.locale for locale in locales])

    def test_full_resume_without_artifacts_reruns_every_shard(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            locales = [translation_plan.Locale("fr", "fr")]

            batches = plan_full.build_resume_plan(locales, 2, Path(tmp), "source-a")

            self.assertEqual(
                [
                    [
                        {"locale": "fr", "locale_slug": "fr", "shard_index": "0", "shard_total": "2"},
                        {"locale": "fr", "locale_slug": "fr", "shard_index": "1", "shard_total": "2"},
                    ]
                ],
                batches,
            )

    def test_full_resume_with_all_successful_shards_requires_only_finalization(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifacts = Path(tmp) / "artifacts"
            for shard_index in range(2):
                self._write_artifact(
                    artifacts,
                    f"i18n-ru-s{shard_index}of2-source-a",
                    metadata={
                        "artifact_role": "locale",
                        "locale": "ru",
                        "locale_slug": "ru",
                        "mode": "full",
                        "shard_index": shard_index,
                        "shard_total": 2,
                        "source_sha": "source-a",
                        "failed_reason": "",
                        "changed_count": 0,
                        "deleted_count": 0,
                    },
                )

            result = plan_full.plan_full(
                "ru",
                4,
                FIXTURES / "pending-docs" / "docs",
                target_docs_per_shard=1,
                max_shards=4,
                resume_artifacts_root=artifacts,
                source_sha="source-a",
            )

            self.assertEqual([], result["batches"])
            self.assertFalse(result["translation_required"])

    def test_full_plan_resume_rejects_stale_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifacts = Path(tmp) / "artifacts"
            self._write_artifact(
                artifacts,
                "i18n-ru-s0of2-source-old",
                metadata={
                    "artifact_role": "locale",
                    "locale": "ru",
                    "locale_slug": "ru",
                    "mode": "full",
                    "shard_index": 0,
                    "shard_total": 2,
                    "source_sha": "source-old",
                    "failed_reason": "",
                    "changed_count": 0,
                    "deleted_count": 0,
                },
            )

            with self.assertRaisesRegex(SystemExit, "belongs to source source-old"):
                plan_full.plan_full(
                    "ru",
                    4,
                    FIXTURES / "pending-docs" / "docs",
                    target_docs_per_shard=1,
                    max_shards=4,
                    resume_artifacts_root=artifacts,
                    source_sha="source-new",
                )

    def test_full_plan_defaults_to_max_sized_shards(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            docs.mkdir()
            for index in range(740):
                (docs / f"page-{index:03d}.md").write_text("# Page\n", encoding="utf-8")

            result = plan_full.plan_full("hi", 4, docs)

            self.assertEqual(6, result["shard_total"])
            self.assertEqual(6, len(result["batches"][0]))

    def test_full_plan_excludes_supported_locale_dirs_without_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            docs.mkdir()
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            (docs / "hi").mkdir()
            (docs / "hi/index.md").write_text("# Hindi\n", encoding="utf-8")
            (docs / "ru").mkdir()
            (docs / "ru/index.md").write_text("# Russian\n", encoding="utf-8")
            (docs / "fr/.i18n").mkdir(parents=True)
            (docs / "fr/.i18n/README.md").write_text("# marker\n", encoding="utf-8")
            (docs / "fr/index.md").write_text("# French\n", encoding="utf-8")

            result = plan_full.plan_full("ru", 4, docs, target_docs_per_shard=1, max_shards=4)

            self.assertEqual(1, result["source_doc_count"])
            self.assertEqual(1, result["shard_total"])

    def test_incremental_plan_reuses_shared_locale_and_shard_policy(self) -> None:
        result = plan_incremental.plan_incremental(FIXTURES / "pending-docs" / "docs", target_docs_per_shard=1, max_shards=4)

        self.assertEqual(20, result["locale_count"])
        self.assertEqual(2, result["source_doc_count"])
        self.assertEqual(2, result["shard_total"])
        self.assertEqual(40, len(result["matrix"]["include"]))
        self.assertEqual(
            [
                {"locale": "es", "locale_slug": "es", "shard_index": "0", "shard_total": "2"},
                {"locale": "es", "locale_slug": "es", "shard_index": "1", "shard_total": "2"},
            ],
            result["matrix"]["include"][:2],
        )
        self.assertEqual(
            [
                "es",
                "zh-CN",
                "zh-TW",
                "ja-JP",
                "pt-BR",
                "fr",
                "ko",
                "ru",
                "de",
                "it",
                "id",
                "tr",
                "vi",
                "pl",
                "nl",
                "uk",
                "th",
                "ar",
                "fa",
                "hi",
            ],
            [item["locale"] for item in result["matrix"]["include"][::2]],
        )

    def test_incremental_plan_excludes_supported_locale_dirs_without_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            docs.mkdir()
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            (docs / "hi").mkdir()
            (docs / "hi/index.md").write_text("# Hindi\n", encoding="utf-8")
            (docs / "ru").mkdir()
            (docs / "ru/index.md").write_text("# Russian\n", encoding="utf-8")

            result = plan_incremental.plan_incremental(docs, target_docs_per_shard=1, max_shards=4)

            self.assertEqual(1, result["source_doc_count"])
            self.assertEqual(1, result["shard_total"])
            self.assertEqual(20, len(result["matrix"]["include"]))

    def test_full_plan_manual_single_locale_only_selects_target(self) -> None:
        result = plan_full.plan_full("fr", 3, FIXTURES / "pending-docs" / "docs")
        self.assertEqual({"locale": "fr", "locale_slug": "fr"}, result["canary"])
        self.assertEqual([[{"locale": "fr", "locale_slug": "fr", "shard_index": "0", "shard_total": "1"}]], result["batches"])
        with self.assertRaises(SystemExit):
            plan_full.plan_full("xx", 3, FIXTURES / "pending-docs" / "docs")

    def test_provider_preflight_classifies_key_model_and_quota_failures(self) -> None:
        self.assertEqual((False, "invalid_key", "OpenAI rejected the translation API key"), provider_preflight.classify_response(401, "{}"))
        self.assertEqual(
            (False, "model_access_denied", "OpenAI denied access to the requested translation model"),
            provider_preflight.classify_response(403, "{}"),
        )
        self.assertEqual(
            (False, "quota_exhausted", "OpenAI reported insufficient quota for the translation key"),
            provider_preflight.classify_response(429, '{"error":{"code":"insufficient_quota"}}'),
        )
        self.assertEqual((True, "ok", "provider preflight ok"), provider_preflight.classify_response(200, "{}"))

    def test_provider_preflight_probe_uses_responses_api_minimum_output_budget(self) -> None:
        class FakeResponse:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc_value, traceback):
                return False

            def read(self) -> bytes:
                return b"{}"

        with patch.object(provider_preflight.urllib.request, "urlopen", return_value=FakeResponse()) as urlopen:
            response = provider_preflight.openai_probe_request("gpt-5.5", "test-key", 30)

        request = urlopen.call_args.args[0]
        payload = json.loads(request.data)
        self.assertEqual(200, response.status_code)
        self.assertGreaterEqual(payload["max_output_tokens"], 16)

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
            self.assertEqual("index.md", result.shard_files[0].name)
            self.assertTrue(result.shard_files[0].as_posix().endswith("/docs/index.md"))
            self.assertEqual(str(result.shard_files[0]), result.pending_path.read_text(encoding="utf-8").strip())

    def test_translation_planning_excludes_symlink_aliases(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            docs.mkdir()
            source = docs / "AGENTS.md"
            source.write_text("# Instructions\n", encoding="utf-8")
            alias = docs / "CLAUDE.md"
            alias.symlink_to(source.name)

            result = pending.build_pending_manifest(
                docs_root=docs,
                openclaw_sync_dir=Path(tmp) / ".openclaw-sync",
                locale="fr",
                locale_slug="fr",
                mode="full",
                shard_index=0,
                shard_total=1,
            )

            self.assertEqual(1, translation_plan.source_doc_count(docs))
            self.assertEqual(1, result.all_count)
            self.assertEqual(1, result.total_pending_count)
            self.assertEqual([source.resolve()], result.shard_files)

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

    def test_pending_manifest_excludes_supported_locale_dirs_without_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            docs.mkdir()
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            (docs / "hi").mkdir()
            (docs / "hi/index.md").write_text("# Hindi\n", encoding="utf-8")
            (docs / "ru").mkdir()
            (docs / "ru/index.md").write_text("# Russian\n", encoding="utf-8")
            (docs / "fr/.i18n").mkdir(parents=True)
            (docs / "fr/.i18n/README.md").write_text("# marker\n", encoding="utf-8")
            (docs / "fr/index.md").write_text("# French\n", encoding="utf-8")

            result = pending.build_pending_manifest(
                docs_root=docs,
                openclaw_sync_dir=Path(tmp) / ".openclaw-sync",
                locale="de",
                locale_slug="de",
                mode="incremental",
                shard_index=0,
                shard_total=1,
            )

            self.assertEqual(1, result.all_count)
            self.assertEqual(1, result.total_pending_count)
            self.assertEqual(["index.md"], [file.name for file in result.shard_files])

    def test_pending_manifest_canary_limit_keeps_total_count_but_limits_sample(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            result = pending.build_pending_manifest(
                docs_root=tmp_path / "docs",
                openclaw_sync_dir=tmp_path / ".openclaw-sync",
                locale="fr",
                locale_slug="fr",
                mode="full",
                shard_index=0,
                shard_total=1,
                pending_limit=1,
            )

            self.assertEqual(2, result.total_pending_count)
            self.assertEqual(1, result.pending_count)

    def test_pending_manifest_canary_prefers_configured_source_page(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            result = pending.build_pending_manifest(
                docs_root=tmp_path / "docs",
                openclaw_sync_dir=tmp_path / ".openclaw-sync",
                locale="fr",
                locale_slug="fr",
                mode="full",
                shard_index=0,
                shard_total=1,
                pending_limit=1,
                canary_source_path="guide/setup.mdx",
            )

            self.assertEqual(2, result.total_pending_count)
            self.assertEqual(1, result.pending_count)
            self.assertTrue(result.shard_files[0].as_posix().endswith("/docs/guide/setup.mdx"))

    def test_pending_manifest_canary_supports_multiple_configured_source_pages(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            result = pending.build_pending_manifest(
                docs_root=tmp_path / "docs",
                openclaw_sync_dir=tmp_path / ".openclaw-sync",
                locale="fr",
                locale_slug="fr",
                mode="full",
                shard_index=0,
                shard_total=1,
                pending_limit=1,
                canary_source_path="guide/setup.mdx,index.md",
            )

            self.assertEqual(2, result.total_pending_count)
            self.assertEqual(2, result.pending_count)
            self.assertEqual(
                ["guide/setup.mdx", "index.md"],
                [file.relative_to((tmp_path / "docs").resolve()).as_posix() for file in result.shard_files],
            )

    def test_pending_manifest_canary_rejects_duplicate_configured_source_pages(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            with self.assertRaisesRegex(SystemExit, "configured canary sources must be unique"):
                pending.build_pending_manifest(
                    docs_root=tmp_path / "docs",
                    openclaw_sync_dir=tmp_path / ".openclaw-sync",
                    locale="fr",
                    locale_slug="fr",
                    mode="full",
                    shard_index=0,
                    shard_total=1,
                    pending_limit=1,
                    canary_source_path="index.md,index.md",
                )

    def test_pending_manifest_canary_rejects_empty_configured_source_pages(self) -> None:
        with self.assertRaisesRegex(SystemExit, "configured canary sources must not be empty"):
            pending.parse_canary_source_paths(",\n,")

    def test_pending_manifest_canary_rejects_duplicate_resolved_source_pages(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            with self.assertRaisesRegex(SystemExit, "configured canary sources must resolve to unique paths"):
                pending.build_pending_manifest(
                    docs_root=tmp_path / "docs",
                    openclaw_sync_dir=tmp_path / ".openclaw-sync",
                    locale="fr",
                    locale_slug="fr",
                    mode="full",
                    shard_index=0,
                    shard_total=1,
                    pending_limit=1,
                    canary_source_path="index.md,./index.md",
                )

    def test_pending_manifest_canary_rejects_missing_configured_source_page(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs" / "docs", tmp_path / "docs")

            with self.assertRaises(SystemExit):
                pending.build_pending_manifest(
                    docs_root=tmp_path / "docs",
                    openclaw_sync_dir=tmp_path / ".openclaw-sync",
                    locale="fr",
                    locale_slug="fr",
                    mode="full",
                    shard_index=0,
                    shard_total=1,
                    pending_limit=1,
                    canary_source_path="channels/line.md",
                )

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

    def test_package_artifact_excludes_allowed_tm_when_payload_is_missing(self) -> None:
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
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n", encoding="utf-8")

            def fake_git_lines(args: list[str]) -> list[str]:
                if "--diff-filter=ACMRT" in args:
                    return ["docs/.i18n/fr.tm.jsonl", "docs/fr/index.md"]
                return []

            with (
                chdir(repo),
                patch.object(package_artifact, "git_lines", fake_git_lines),
                env(
                    {
                        "GITHUB_WORKSPACE": str(repo),
                        "LOCALE": "fr",
                        "LOCALE_SLUG": "fr",
                        "SOURCE_SHA": "source-a",
                        "MODE": "full",
                        "SHARD_INDEX": "0",
                        "SHARD_TOTAL": "1",
                        "WORKER_PARALLEL": "3",
                        "THINKING_EFFORT": "medium",
                        "PENDING_COUNT": "1",
                        "TOTAL_PENDING_COUNT": "1",
                        "ALL_COUNT": "1",
                        "ARTIFACT_ROLE": "canary",
                        "TRANSLATE_OUTCOME": "success",
                        "MDX_CHECK_OUTCOME": "skipped",
                        "MDX_REPAIR_OUTCOME": "skipped",
                        "MDX_SCOPE_OUTCOME": "skipped",
                        "MDX_RECHECK_OUTCOME": "skipped",
                    }
                ),
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual(1, metadata["changed_count"])
            self.assertEqual(["docs/fr/index.md"], (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines())
            self.assertTrue((artifact / "payload/docs/fr/index.md").exists())
            self.assertFalse((artifact / "payload/docs/.i18n/fr.tm.jsonl").exists())

    def test_package_artifact_fails_closed_on_i18n_protocol_marker_leak(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/index.md").write_text("# Index FR\n\\_\\_OC\\_I18N\\_900014\\_\\_\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n", encoding="utf-8")

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "LOCALE": "fr",
                    "LOCALE_SLUG": "fr",
                    "SOURCE_SHA": "source-a",
                    "MODE": "full",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "WORKER_PARALLEL": "3",
                    "THINKING_EFFORT": "xhigh",
                    "PENDING_COUNT": "1",
                    "TOTAL_PENDING_COUNT": "1",
                    "ALL_COUNT": "1",
                    "TRANSLATE_OUTCOME": "success",
                    "MDX_CHECK_OUTCOME": "success",
                    "MDX_REPAIR_OUTCOME": "skipped",
                    "MDX_SCOPE_OUTCOME": "skipped",
                    "MDX_RECHECK_OUTCOME": "skipped",
                }
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual("i18n protocol marker leaked", metadata["failed_reason"])
            self.assertEqual(0, metadata["changed_count"])
            self.assertEqual("", (artifact / "changed-files.txt").read_text(encoding="utf-8"))
            self.assertFalse((artifact / "payload/docs/fr/index.md").exists())

    def test_package_artifact_fails_closed_on_mdx_protected_attribute_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr/tools").mkdir(parents=True)
            (repo / "docs/tools").mkdir(parents=True)
            (repo / "docs/tools/pdf.md").write_text(
                '<ParamField path="prompt" type="string" default="Analyze this PDF document." />\n',
                encoding="utf-8",
            )
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/tools/pdf.md").write_text(
                '<ParamField path="prompt" type="string" default="Analysez ce document PDF." />\n',
                encoding="utf-8",
            )
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(
                str(repo / "docs/tools/pdf.md") + "\n",
                encoding="utf-8",
            )

            with (
                chdir(repo),
                patch.object(package_artifact, "drifted_mdx_protected_attribute_paths", return_value=["docs/fr/tools/pdf.md"]),
                env(
                    {
                        "GITHUB_WORKSPACE": str(repo),
                        "LOCALE": "fr",
                        "LOCALE_SLUG": "fr",
                        "SOURCE_SHA": "source-a",
                        "MODE": "full",
                        "SHARD_INDEX": "0",
                        "SHARD_TOTAL": "1",
                        "WORKER_PARALLEL": "3",
                        "THINKING_EFFORT": "xhigh",
                        "PENDING_COUNT": "1",
                        "TOTAL_PENDING_COUNT": "1",
                        "ALL_COUNT": "1",
                        "TRANSLATE_OUTCOME": "success",
                        "MDX_CHECK_OUTCOME": "success",
                        "MDX_REPAIR_OUTCOME": "skipped",
                        "MDX_SCOPE_OUTCOME": "skipped",
                        "MDX_RECHECK_OUTCOME": "skipped",
                    }
                ),
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual("mdx protected attribute drift", metadata["failed_reason"])
            self.assertEqual(0, metadata["changed_count"])
            self.assertEqual("", (artifact / "changed-files.txt").read_text(encoding="utf-8"))
            self.assertFalse((artifact / "payload/docs/fr/tools/pdf.md").exists())

    def test_package_artifact_repairs_mdx_protected_attribute_drift(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr/tools").mkdir(parents=True)
            (repo / "docs/tools").mkdir(parents=True)
            source = repo / "docs/tools/pdf.md"
            translated = repo / "docs/fr/tools/pdf.md"
            source.write_text(
                '<ParamField path="prompt" type="string" default="Analyze this PDF document." label="Prompt" />\n',
                encoding="utf-8",
            )
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            translated.write_text(
                '<ParamField label="Invite" default="Analysez ce document PDF." type="texte" path="invite" />\n',
                encoding="utf-8",
            )
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(source) + "\n", encoding="utf-8")

            with (
                chdir(repo),
                env(
                    {
                        "GITHUB_WORKSPACE": str(repo),
                        "LOCALE": "fr",
                        "LOCALE_SLUG": "fr",
                        "SOURCE_SHA": "source-a",
                        "MODE": "full",
                        "SHARD_INDEX": "0",
                        "SHARD_TOTAL": "1",
                        "WORKER_PARALLEL": "3",
                        "THINKING_EFFORT": "xhigh",
                        "PENDING_COUNT": "1",
                        "TOTAL_PENDING_COUNT": "1",
                        "ALL_COUNT": "1",
                        "TRANSLATE_OUTCOME": "success",
                        "MDX_CHECK_OUTCOME": "success",
                        "MDX_REPAIR_OUTCOME": "skipped",
                        "MDX_SCOPE_OUTCOME": "skipped",
                        "MDX_RECHECK_OUTCOME": "skipped",
                    }
                ),
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            expected = (
                '<ParamField path="prompt" type="string" default="Analyze this PDF document." label="Invite" />\n'
            )
            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual("", metadata["failed_reason"])
            self.assertEqual("success", metadata["mdx_protected_attribute_repair_outcome"])
            self.assertEqual(expected, translated.read_text(encoding="utf-8"))
            self.assertEqual(expected, (artifact / "payload/docs/fr/tools/pdf.md").read_text(encoding="utf-8"))

    def test_protected_attribute_repair_skips_empty_manifest_without_node(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / ".openclaw-sync").mkdir()
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text("", encoding="utf-8")
            with patch.object(package_artifact.subprocess, "run") as run:
                result = package_artifact.repair_mdx_protected_attributes(repo, "fr", "fr", 0, 1)
            self.assertEqual(("", [], False), result)
            run.assert_not_called()

    def test_package_artifact_includes_repair_only_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr/tools").mkdir(parents=True)
            (repo / "docs/tools").mkdir(parents=True)
            source = repo / "docs/tools/pdf.md"
            translated = repo / "docs/fr/tools/pdf.md"
            source.write_text('<X default="source" />\n', encoding="utf-8")
            translated.write_text('<X default="traduit" />\n', encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "existing bad translation")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(source) + "\n", encoding="utf-8")

            with (
                chdir(repo),
                env(
                    {
                        "GITHUB_WORKSPACE": str(repo),
                        "LOCALE": "fr",
                        "LOCALE_SLUG": "fr",
                        "SOURCE_SHA": "source-a",
                        "MODE": "full",
                        "SHARD_INDEX": "0",
                        "SHARD_TOTAL": "1",
                        "WORKER_PARALLEL": "3",
                        "THINKING_EFFORT": "xhigh",
                        "PENDING_COUNT": "1",
                        "TOTAL_PENDING_COUNT": "1",
                        "ALL_COUNT": "1",
                        "TRANSLATE_OUTCOME": "success",
                        "MDX_CHECK_OUTCOME": "success",
                        "MDX_REPAIR_OUTCOME": "skipped",
                        "MDX_SCOPE_OUTCOME": "skipped",
                        "MDX_RECHECK_OUTCOME": "skipped",
                    }
                ),
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual("", metadata["failed_reason"])
            self.assertEqual(1, metadata["changed_count"])
            self.assertEqual("docs/fr/tools/pdf.md\n", (artifact / "changed-files.txt").read_text(encoding="utf-8"))
            self.assertEqual(
                '<X default="source" />\n',
                (artifact / "payload/docs/fr/tools/pdf.md").read_text(encoding="utf-8"),
            )

    def test_mdx_protected_attribute_signatures_use_parsed_element_ownership(self) -> None:
        script = REPO_ROOT / ".github/scripts/i18n/check_mdx_protected_attributes.mjs"
        program = f"""
          import {{ protectedAttributeSignatures }} from {json.dumps(script.as_uri())};
          const tree = {{type: "root", children: [
            {{type: "mdxFlowExpression", value: "/* <X id=comment /> */"}},
            {{type: "inlineCode", value: "<X id=code />"}},
            {{type: "mdxJsxFlowElement", name: "_ParamField", attributes: [
              {{type: "mdxJsxAttribute", name: "aria-hidden", value: null}},
              {{type: "mdxJsxAttribute", name: "path", value: {{type: "mdxJsxAttributeValueExpression", value: "/\\\\{{/.source"}}}},
              {{type: "mdxJsxAttribute", name: "data-id", value: "ignored"}}
            ], children: []}},
            {{type: "mdxJsxFlowElement", name: "_ParamField", attributes: [
              {{type: "mdxJsxAttribute", name: "default", value: "Don't use A"}}
            ], children: []}}
          ]}};
          process.stdout.write(JSON.stringify(protectedAttributeSignatures(tree)));
        """
        result = subprocess.run(["node", "--input-type=module", "-e", program], check=True, text=True, stdout=subprocess.PIPE)
        self.assertEqual(
            [
                ["_ParamField", 0, [["aria-hidden", "boolean", True], ["path", "expression", r"/\{/.source"]]],
                ["_ParamField", 1, [["default", "string", "Don't use A"]]],
            ],
            json.loads(result.stdout),
        )

    def test_mdx_protected_attribute_checker_parses_nested_expression_jsx(self) -> None:
        script = REPO_ROOT / ".github/scripts/i18n/check_mdx_protected_attributes.mjs"
        payload = {
            "moduleRoot": str(REPO_ROOT),
            "documents": [
                {
                    "path": "nested-expression.mdx",
                    "source": '| Limit | <=100 |\n| --- | --- |\n{ready && <Link rel="noopener" id="docs" />}\n',
                    "translated": '| Limit | <=100 |\n| --- | --- |\n{ready && <Link rel="noopener" id="translated" />}\n',
                },
                {
                    "path": "non-rendered.mdx",
                    "source": '<!-- unmatched { ` <X id="html-comment-a" /> -->\n{/* <X id="comment-a" /> */}`<X\nid="code-a" />`\n```mdx\n<X id="fence-a" />\n```\n<_X aria-hidden path={/\\{/.source} />\n',
                    "translated": '<!-- unmatched { ` <X id="html-comment-b" /> -->\n{/* <X id="comment-b" /> */}`<X\nid="code-b" />`\n```mdx\n<X id="fence-b" />\n```\n<_X path={/\\{/.source} aria-hidden />\n',
                },
                {
                    "path": "operator-expression.mdx",
                    "source": '<X id={n < 2 ? "a" : "b"} />\n',
                    "translated": '<X id={n < 2 ? "a" : "b"} />\n',
                },
                {
                    "path": "expression-order.mdx",
                    "source": '<X id={next()} type={next()} />\n',
                    "translated": '<X type={next()} id={next()} />\n',
                },
                {
                    "path": "spread-expression.mdx",
                    "source": '{ready && <X {...{id: "source"}} />}\n',
                    "translated": '{ready && <X {...{id: "translated"}} />}\n',
                },
                {
                    "path": "spread-precedence.mdx",
                    "source": '<X id="fixed" {...props} />\n',
                    "translated": '<X {...props} id="fixed" />\n',
                },
                {
                    "path": "escaped-backtick.mdx",
                    "source": 'Literal \\` then <X id="source" />\n',
                    "translated": 'Literal \\` then <X id="translated" />\n',
                },
                {
                    "path": "quoted-comment.mdx",
                    "source": '<Label text="<!--" /><X id="source" /><!-- note -->\n',
                    "translated": '<Label text="<!--" /><X id="translated" /><!-- note -->\n',
                },
                {
                    "path": "bigint-expression.mdx",
                    "source": '<X default={1n} />\n',
                    "translated": '<X default={2n} />\n',
                },
                {
                    "path": "tagged-template.mdx",
                    "source": '<X id={String.raw`\\n`} />\n',
                    "translated": '<X id={String.raw`\n`} />\n',
                },
                {
                    "path": "autolink.mdx",
                    "source": '<user@example.com> <X id="same" />\n',
                    "translated": '<user@example.com> <X id="same" />\n',
                },
            ],
        }
        result = subprocess.run(
            ["node", str(script)],
            check=True,
            text=True,
            input=json.dumps(payload),
            stdout=subprocess.PIPE,
        )
        self.assertEqual(
            {
                "drifted": [
                    "nested-expression.mdx",
                    "expression-order.mdx",
                    "spread-expression.mdx",
                    "spread-precedence.mdx",
                    "escaped-backtick.mdx",
                    "quoted-comment.mdx",
                    "bigint-expression.mdx",
                    "tagged-template.mdx",
                ]
            },
            json.loads(result.stdout),
        )

    def test_mdx_syntax_repair_rescues_common_translation_damage(self) -> None:
        repair = REPO_ROOT / ".github/scripts/i18n/repair_mdx_syntax.mjs"
        cases = [
            # Fabricated unclosed element: the invented <id> token is removed
            # and the translated prose stays.
            (
                '<ParamField path="prompt" type="string" label="Prompt" />\n\nUse a prompt.\n',
                "Utilisez un <id> prompt.\n",
                "Utilisez un  prompt.\n",
            ),
            # Stray closing tag is dropped and the unterminated flow element is
            # closed on its own line.
            (
                "<div>\n  <span>Score</span>\n</div>\n",
                "<div>\n  <span>Skor kartu</span>\n</span>\n",
                "<div>\n  <span>Skor kartu</span>\n</div>\n\n",
            ),
            # Unquoted attribute values are quoted; junk where an attribute
            # name was expected is dropped.
            (
                '<Tabs>\n  <Tab title="Questions">Answer</Tab>\n</Tabs>\n',
                "<Tabs>\n  <Tab title=Domande 'freq> Risposta</Tab>\n</Tabs>\n",
                '<Tabs>\n  <Tab title="Domande" freq> Risposta</Tab>\n</Tabs>\n',
            ),
            # A real element that lost its closer gets it back.
            (
                "<Note>Take care</Note>\n\nEnd.\n",
                "<Note>Prendre soin\n\nFin.\n",
                "<Note>Prendre soin</Note>\n\nFin.\n",
            ),
            # Unquoted values stop before the `/>` delimiter so self-closing
            # syntax is preserved.
            (
                '<img src="guide" />\n',
                "<img src=guide/>\n",
                '<img src="guide"/>\n',
            ),
            # Terminated Markdown/HTML comments are valid downstream and are
            # left untouched (never rewritten to MDX expression syntax).
            (
                "text note here more\n",
                "texte <!-- note ici --> plus\n",
                "texte <!-- note ici --> plus\n",
            ),
            # Unterminated comments are closed so the text stays commented out.
            (
                "text note here more\n",
                "texte <!-- note ici\n",
                "texte <!-- note ici -->\n",
            ),
            # Void elements become self-closing; comments stay intact and must
            # not hide the real damage from diagnosis.
            (
                "<Note>Take care</Note>\n",
                "<!-- translated -->\nLigne un<br>\n<Note>Prendre soin\n",
                "<!-- translated -->\nLigne un<br />\n<Note>Prendre soin</Note>\n",
            ),
            # Real elements get closed; prose less-than stays untouched because
            # diagnosis shares the downstream chain's tolerant masking.
            (
                "<Note>Take care</Note>\n",
                "compare 1 < 2\n\n<Note>Prendre soin\n",
                "compare 1 < 2\n\n<Note>Prendre soin</Note>\n",
            ),
            # Adjacent stray closers all get removed (mutable offsets are not
            # patch identities), then the real element gets closed.
            (
                "<div>a</div>\n",
                "<div>a</span></em>\n",
                "<div>a</div>\n",
            ),
            # A fabricated flow-level element is removed, never closed: an
            # undefined uppercase component would break MDX rendering.
            (
                "<div>a</div>\n",
                "<Div>\ntexte\n",
                "\ntexte\n",
            ),
            # The opener search must target the diagnosed element, not the
            # first same-name token inside comments or code examples.
            (
                "<div>a</div>\n",
                "<!-- <Div> example -->\n<Div>\ntexte\n",
                "<!-- <Div> example -->\n\ntexte\n",
            ),
            (
                "<div>a</div>\n",
                "```\n<Div> example\n```\n\n<Div>\ntexte\n",
                "```\n<Div> example\n```\n\n\ntexte\n",
            ),
            # Astral Unicode inside a terminated comment must not shift the
            # masked-copy offsets used to locate the stray closer.
            (
                "<div>a</div>\n",
                "<!-- \U0001F600 -->\n<div>a</span>\n",
                "<!-- \U0001F600 -->\n<div>a</div>\n",
            ),
        ]
        program = (
            'import { createProcessor } from "@mdx-js/mdx";\n'
            f"import {{ repairMdxSyntax }} from {json.dumps(repair.as_uri())};\n"
            'const processor = createProcessor({ format: "mdx" });\n'
            'const markdownProcessor = createProcessor({ format: "md" });\n'
            f"const cases = {json.dumps(cases)};\n"
            "for (const [source, translated, expected] of cases) {\n"
            "  const result = repairMdxSyntax(processor, markdownProcessor, source, translated);\n"
            "  if (result.value !== expected) {\n"
            '    throw new Error(`unexpected repair: ${JSON.stringify(result.value)}`);\n'
            "  }\n"
            "}\n"
        )
        result = subprocess.run(
            ["node", "--input-type=module", "-e", program],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            cwd=REPO_ROOT,
        )
        self.assertEqual("", result.stdout)

    def test_mdx_syntax_repair_leaves_valid_documents_untouched(self) -> None:
        repair = REPO_ROOT / ".github/scripts/i18n/repair_mdx_syntax.mjs"
        program = (
            'import { createProcessor } from "@mdx-js/mdx";\n'
            f"import {{ repairMdxSyntax }} from {json.dumps(repair.as_uri())};\n"
            'const processor = createProcessor({ format: "mdx" });\n'
            'const markdownProcessor = createProcessor({ format: "md" });\n'
            'const result = repairMdxSyntax(processor, markdownProcessor, "<Note>ok</Note>\\n", "<Note>ok</Note>\\n");\n'
            "if (result.changed) throw new Error(`unexpected rewrite: ${JSON.stringify(result.value)}`);\n"
        )
        subprocess.run(
            ["node", "--input-type=module", "-e", program],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            cwd=REPO_ROOT,
        )

    def test_mdx_syntax_repair_fails_closed_on_unresolvable_damage(self) -> None:
        repair = REPO_ROOT / ".github/scripts/i18n/repair_mdx_syntax.mjs"
        program = (
            'import { createProcessor } from "@mdx-js/mdx";\n'
            f"import {{ repairMdxSyntax }} from {json.dumps(repair.as_uri())};\n"
            'const processor = createProcessor({ format: "mdx" });\n'
            'const markdownProcessor = createProcessor({ format: "md" });\n'
            "try {\n"
            '  repairMdxSyntax(processor, markdownProcessor, "# T\\n", "{{ready &&\\n");\n'
            "} catch (error) {\n"
            "  console.log(String(error.message).slice(0, 40));\n"
            '  process.exit(0);\n'
            "}\n"
            'throw new Error("expected the repair to fail closed");\n'
        )
        result = subprocess.run(
            ["node", "--input-type=module", "-e", program],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            cwd=REPO_ROOT,
        )
        self.assertIn("MDX syntax repair exhausted", result.stdout)

        # A multiline unterminated comment has no knowable end; the repair must
        # refuse instead of exposing or hiding the remainder.
        program = (
            'import { createProcessor } from "@mdx-js/mdx";\n'
            f"import {{ repairMdxSyntax }} from {json.dumps(repair.as_uri())};\n"
            'const processor = createProcessor({ format: "mdx" });\n'
            'const markdownProcessor = createProcessor({ format: "md" });\n'
            "try {\n"
            '  repairMdxSyntax(processor, markdownProcessor, "# T\\n", "<!-- hidden note\\nvisible text\\n");\n'
            "} catch (error) {\n"
            "  console.log(String(error.message).slice(0, 40));\n"
            '  process.exit(0);\n'
            "}\n"
            'throw new Error("expected the repair to fail closed");\n'
        )
        result = subprocess.run(
            ["node", "--input-type=module", "-e", program],
            check=True,
            text=True,
            stdout=subprocess.PIPE,
            cwd=REPO_ROOT,
        )
        self.assertIn("MDX syntax repair exhausted", result.stdout)

    def test_package_artifact_repairs_mdx_syntax_before_protected_attributes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr/tools").mkdir(parents=True)
            (repo / "docs/tools").mkdir(parents=True)
            source = repo / "docs/tools/pdf.md"
            translated = repo / "docs/fr/tools/pdf.md"
            source.write_text(
                '<Note path="prompt" type="string" label="Prompt">care</Note>\n',
                encoding="utf-8",
            )
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            translated.write_text(
                '<Note path="invite" type="texte" label="Invite">soin',
                encoding="utf-8",
            )
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(source) + "\n", encoding="utf-8")

            with (
                chdir(repo),
                env(
                    {
                        "GITHUB_WORKSPACE": str(repo),
                        "LOCALE": "fr",
                        "LOCALE_SLUG": "fr",
                        "SOURCE_SHA": "source-a",
                        "MODE": "full",
                        "SHARD_INDEX": "0",
                        "SHARD_TOTAL": "1",
                        "WORKER_PARALLEL": "3",
                        "THINKING_EFFORT": "xhigh",
                        "PENDING_COUNT": "1",
                        "TOTAL_PENDING_COUNT": "1",
                        "ALL_COUNT": "1",
                        "TRANSLATE_OUTCOME": "success",
                        "MDX_CHECK_OUTCOME": "success",
                        "MDX_REPAIR_OUTCOME": "skipped",
                        "MDX_SCOPE_OUTCOME": "skipped",
                        "MDX_RECHECK_OUTCOME": "skipped",
                    }
                ),
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            expected = '<Note path="prompt" type="string" label="Invite">soin</Note>'
            self.assertEqual("", metadata["failed_reason"])
            self.assertEqual("success", metadata["mdx_syntax_repair_outcome"])
            self.assertEqual("success", metadata["mdx_protected_attribute_repair_outcome"])
            self.assertEqual(expected, translated.read_text(encoding="utf-8"))

    def test_syntax_repair_skips_empty_manifest_without_node(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / ".openclaw-sync").mkdir()
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text("", encoding="utf-8")
            with patch.object(package_artifact.subprocess, "run") as run:
                result = package_artifact.repair_mdx_syntax(repo, "fr", "fr", 0, 1)
            self.assertEqual(("", [], False), result)
            run.assert_not_called()

    def test_repair_scripts_reject_locale_path_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/tools").mkdir(parents=True)
            (repo / "docs/tools/pdf.md").write_text("# Source\n", encoding="utf-8")
            manifest = repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt"
            manifest.write_text(str(repo / "docs/tools/pdf.md") + "\n", encoding="utf-8")
            for script in (
                ".github/scripts/i18n/repair_mdx_syntax.mjs",
                ".github/scripts/i18n/repair_mdx_protected_attributes.mjs",
            ):
                result = subprocess.run(
                    [
                        "node",
                        str(REPO_ROOT / script),
                        "--workspace",
                        str(repo),
                        "--locale",
                        "../escape",
                        "--manifest",
                        str(manifest),
                        "--module-root",
                        "/nonexistent",
                    ],
                    check=False,
                    text=True,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                self.assertNotEqual(0, result.returncode, script)
                self.assertIn("single safe path segment", result.stderr, script)

    def test_mdx_protected_attribute_repair_uses_parser_offsets(self) -> None:
        checker = REPO_ROOT / ".github/scripts/i18n/check_mdx_protected_attributes.mjs"
        repair = REPO_ROOT / ".github/scripts/i18n/repair_mdx_protected_attributes.mjs"
        program = f"""
          import {{ createProcessor }} from "@mdx-js/mdx";
          import {{ protectedAttributeSignatures }} from {json.dumps(checker.as_uri())};
          import {{ repairProtectedAttributes }} from {json.dumps(repair.as_uri())};
          const processor = createProcessor({{ format: "mdx" }});
          const markdownProcessor = createProcessor({{ format: "md" }});
          const source = `
<X title="English" id="fixed" {{...props}} data-label="English" rel={{next()}} />
{{ready && <Y default={{1n}} label="English" />}}
<Outer content={{<Inner id="inner" />}} id="outer" title="English" />
<Z title="English" />
\\`<Y default={{9n}} />\\`
`;
          const translated = `
<X data-label="Français" rel={{other()}} {{...otherProps}} id="traduit" title="Français" />
{{ready && <Y label="Français" default={{2n}} />}}
<Outer title="Français" id="extérieur" content={{<Inner id="intérieur" />}} />
<Z title="Français" id="added" />
\\`<Y default={{8n}} />\\`
`;
          const result = repairProtectedAttributes(processor, markdownProcessor, source, translated);
          const expected = protectedAttributeSignatures(processor.parse(source));
          const actual = protectedAttributeSignatures(processor.parse(result.value));
          process.stdout.write(JSON.stringify({{ result, expected, actual }}));
        """
        result = subprocess.run(
            ["node", "--input-type=module", "-e", program],
            check=True,
            text=True,
            cwd=REPO_ROOT,
            stdout=subprocess.PIPE,
        )
        output = json.loads(result.stdout)
        self.assertTrue(output["result"]["changed"])
        self.assertEqual(output["expected"], output["actual"])
        self.assertIn('data-label="Français"', output["result"]["value"])
        self.assertIn('label="Français"', output["result"]["value"])
        self.assertIn('content={<Inner id="inner" />}', output["result"]["value"])
        self.assertIn('title="Français"', output["result"]["value"])
        self.assertIn('<Z title="Français" />', output["result"]["value"])
        self.assertIn('`<Y default={8n} />`', output["result"]["value"])

    def test_mdx_protected_attribute_repair_preserves_offsets_after_markdown_less_than(self) -> None:
        checker = REPO_ROOT / ".github/scripts/i18n/check_mdx_protected_attributes.mjs"
        repair = REPO_ROOT / ".github/scripts/i18n/repair_mdx_protected_attributes.mjs"
        program = f"""
          import {{ createProcessor }} from "@mdx-js/mdx";
          import {{ parseMdx, protectedAttributeSignatures }} from {json.dumps(checker.as_uri())};
          import {{ repairProtectedAttributes }} from {json.dumps(repair.as_uri())};
          const processor = createProcessor({{ format: "mdx" }});
          const markdownProcessor = createProcessor({{ format: "md" }});
          const source = `Plain Markdown says n < 9 and m < 12 before the JSX. 🚀\\n<ParamField path="prompt" type="string" default="Analyze this PDF document." label="Prompt" />\\n`;
          const translated = `Plain Markdown says n < 9 and m < 12 before the JSX. 🚀\\n<ParamField label="Eingabe" default="Analysieren Sie dieses PDF-Dokument." type="text" path="eingabe" />\\n`;
          const result = repairProtectedAttributes(processor, markdownProcessor, source, translated);
          const expected = protectedAttributeSignatures(parseMdx(processor, markdownProcessor, source));
          const actual = protectedAttributeSignatures(parseMdx(processor, markdownProcessor, result.value));
          process.stdout.write(JSON.stringify({{ result, expected, actual }}));
        """
        result = subprocess.run(
            ["node", "--input-type=module", "-e", program],
            check=True,
            text=True,
            cwd=REPO_ROOT,
            stdout=subprocess.PIPE,
        )
        output = json.loads(result.stdout)
        self.assertTrue(output["result"]["changed"])
        self.assertEqual(output["expected"], output["actual"])
        self.assertIn("n < 9 and m < 12", output["result"]["value"])
        self.assertIn('label="Eingabe"', output["result"]["value"])
        self.assertIn('path="prompt"', output["result"]["value"])
        self.assertIn('default="Analyze this PDF document."', output["result"]["value"])

    def test_mdx_protected_attribute_check_includes_spread_only_documents(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            (workspace / "docs/tools").mkdir(parents=True)
            (workspace / "docs/fr/tools").mkdir(parents=True)
            (workspace / "docs/tools/spread.md").write_text('{ready && <X {...{id: "source"}} />}\n', encoding="utf-8")
            (workspace / "docs/fr/tools/spread.md").write_text('{ready && <X {...{id: "translated"}} />}\n', encoding="utf-8")

            self.assertEqual(
                ["docs/fr/tools/spread.md"],
                package_artifact.drifted_mdx_protected_attribute_paths(
                    workspace,
                    "fr",
                    ["docs/fr/tools/spread.md"],
                ),
            )

    def test_mdx_protected_attribute_check_fails_closed_without_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workspace = Path(tmp)
            (workspace / "docs/fr/tools").mkdir(parents=True)
            (workspace / "docs/fr/tools/orphan.md").write_text('<X id="orphan" />\n', encoding="utf-8")

            self.assertEqual(
                ["docs/fr/tools/orphan.md"],
                package_artifact.drifted_mdx_protected_attribute_paths(
                    workspace,
                    "fr",
                    ["docs/fr/tools/orphan.md"],
                ),
            )

    def test_package_artifact_carries_translation_memory_only_on_first_shard(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/guide").mkdir(parents=True)
            (repo / "docs/guide/setup.md").write_text("# Setup\n", encoding="utf-8")
            (repo / "docs/guide/usage.md").write_text("# Usage\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/guide").mkdir(parents=True)
            (repo / "docs/fr/guide/setup.md").write_text("# Setup FR\n", encoding="utf-8")
            (repo / "docs/fr/guide/usage.md").write_text("# Usage FR\n", encoding="utf-8")
            (repo / "docs/.i18n").mkdir(parents=True)
            (repo / "docs/.i18n/fr.tm.jsonl").write_text('{"ok":true}\n', encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of2.txt").write_text(str(repo / "docs/guide/setup.md") + "\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s1of2.txt").write_text(str(repo / "docs/guide/usage.md") + "\n", encoding="utf-8")

            base_env = {
                "GITHUB_WORKSPACE": str(repo),
                "LOCALE": "fr",
                "LOCALE_SLUG": "fr",
                "SOURCE_SHA": "source-a",
                "MODE": "full",
                "SHARD_TOTAL": "2",
                "WORKER_PARALLEL": "3",
                "THINKING_EFFORT": "medium",
                "PENDING_COUNT": "1",
                "TOTAL_PENDING_COUNT": "2",
                "ALL_COUNT": "2",
                "TRANSLATE_OUTCOME": "success",
                "MDX_CHECK_OUTCOME": "skipped",
                "MDX_REPAIR_OUTCOME": "skipped",
                "MDX_SCOPE_OUTCOME": "skipped",
                "MDX_RECHECK_OUTCOME": "skipped",
            }

            with chdir(repo), env({**base_env, "SHARD_INDEX": "0"}):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))
            artifact = repo / ".openclaw-sync/artifacts/fr-s0of2"
            self.assertEqual(2, metadata["changed_count"])
            self.assertEqual(
                ["docs/.i18n/fr.tm.jsonl", "docs/fr/guide/setup.md"],
                (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines(),
            )
            self.assertTrue((artifact / "payload/docs/.i18n/fr.tm.jsonl").exists())

            with chdir(repo), env({**base_env, "SHARD_INDEX": "1"}):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))
            artifact = repo / ".openclaw-sync/artifacts/fr-s1of2"
            self.assertEqual(1, metadata["changed_count"])
            self.assertEqual(
                ["docs/fr/guide/usage.md"],
                (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines(),
            )
            self.assertFalse((artifact / "payload/docs/.i18n/fr.tm.jsonl").exists())

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

    def test_canary_package_excludes_unrelated_pruned_deletes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/.i18n").mkdir(parents=True)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            (repo / "docs/fr/index.md").write_text("# Old Index FR\n", encoding="utf-8")
            (repo / "docs/fr/removed.md").write_text("# Removed FR\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/index.md").write_text("# New Index FR\n", encoding="utf-8")
            (repo / "docs/fr/removed.md").unlink()
            (repo / "docs/.i18n/fr.tm.jsonl").write_text('{"ok":true}\n', encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n", encoding="utf-8")

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "LOCALE": "fr",
                    "LOCALE_SLUG": "fr",
                    "SOURCE_SHA": "source-a",
                    "MODE": "full",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "WORKER_PARALLEL": "3",
                    "THINKING_EFFORT": "medium",
                    "PENDING_COUNT": "1",
                    "TOTAL_PENDING_COUNT": "2",
                    "ALL_COUNT": "2",
                    "ARTIFACT_ROLE": "canary",
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
            self.assertEqual(0, metadata["deleted_count"])
            self.assertEqual(["docs/.i18n/fr.tm.jsonl", "docs/fr/index.md"], (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines())
            self.assertEqual("", (artifact / "deleted-files.txt").read_text(encoding="utf-8"))

    def test_canary_commit_scope_allows_only_sampled_page_and_tm(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/.i18n").mkdir(parents=True)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            (repo / "docs/fr/index.md").write_text("# Old Index FR\n", encoding="utf-8")
            (repo / "docs/.i18n/fr.tm.jsonl").write_text('{"old":true}\n', encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/index.md").write_text("# New Index FR\n", encoding="utf-8")
            (repo / "docs/.i18n/fr.tm.jsonl").write_text('{"ok":true}\n', encoding="utf-8")
            artifact = repo / ".openclaw-sync/i18n-artifacts/fr-s0of1"
            artifact.mkdir(parents=True)
            (artifact / "changed-files.txt").write_text("docs/.i18n/fr.tm.jsonl\ndocs/fr/index.md\n", encoding="utf-8")
            (artifact / "deleted-files.txt").write_text("", encoding="utf-8")

            with chdir(repo):
                allowed = commit_locale_artifact.artifact_allowed("fr", str(artifact))
                commit_locale_artifact.enforce_canary_scope("fr", allowed)

    def test_locale_pathspecs_allow_new_locale_without_tm(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / "docs/hi").mkdir(parents=True)
            (repo / "docs/hi/index.md").write_text("# Hindi\n", encoding="utf-8")

            with chdir(repo):
                self.assertEqual(["docs/hi"], commit_locale_artifact.locale_pathspecs("hi"))
                self.assertTrue(commit_locale_artifact.has_locale_changes("hi"))

    def test_canary_commit_new_locale_without_tm_does_not_add_missing_tm_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            origin = tmp_path / "origin.git"
            subprocess.run(["git", "init", "--bare", str(origin)], check=True, text=True, stdout=subprocess.PIPE)
            repo = tmp_path / "repo"
            repo.mkdir()
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / ".openclaw-sync/source.json").write_text(json.dumps({"repository": "openclaw/openclaw", "sha": "source-a"}) + "\n", encoding="utf-8")
            (repo / "docs").mkdir()
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")
            run_git(repo, "remote", "add", "origin", str(origin))
            run_git(repo, "push", "-u", "origin", "main")

            (repo / "docs/hi").mkdir(parents=True)
            (repo / "docs/hi/index.md").write_text("# Hindi\n", encoding="utf-8")
            artifact = repo / ".openclaw-sync/i18n-artifacts/hi-s0of1"
            artifact.mkdir(parents=True)
            (artifact / "changed-files.txt").write_text("docs/hi/index.md\n", encoding="utf-8")
            (artifact / "deleted-files.txt").write_text("", encoding="utf-8")

            with chdir(repo):
                committed = commit_locale_artifact.commit_locale(
                    "hi",
                    "source-a",
                    1,
                    artifact_role="canary",
                    artifact_dir=str(artifact),
                )

            self.assertTrue(committed)
            self.assertEqual("# Hindi\n", run_git(repo, "show", "origin/main:docs/hi/index.md"))
            self.assertNotIn("docs/.i18n/hi.tm.jsonl", run_git(repo, "ls-tree", "-r", "--name-only", "origin/main"))

    def test_canary_commit_scope_rejects_unrelated_locale_deletes_not_in_artifact(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/.i18n").mkdir(parents=True)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            (repo / "docs/fr/index.md").write_text("# Old Index FR\n", encoding="utf-8")
            (repo / "docs/fr/removed.md").write_text("# Removed FR\n", encoding="utf-8")
            (repo / "docs/.i18n/fr.tm.jsonl").write_text('{"old":true}\n', encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/index.md").write_text("# New Index FR\n", encoding="utf-8")
            (repo / "docs/fr/removed.md").unlink()
            artifact = repo / ".openclaw-sync/i18n-artifacts/fr-s0of1"
            artifact.mkdir(parents=True)
            (artifact / "changed-files.txt").write_text("docs/fr/index.md\n", encoding="utf-8")
            (artifact / "deleted-files.txt").write_text("", encoding="utf-8")

            with chdir(repo):
                allowed = commit_locale_artifact.artifact_allowed("fr", str(artifact))
                with self.assertRaises(SystemExit):
                    commit_locale_artifact.enforce_canary_scope("fr", allowed)

    def test_canary_artifact_scope_rejects_deleted_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifact = Path(tmp) / "artifact"
            artifact.mkdir()
            (artifact / "changed-files.txt").write_text("docs/fr/index.md\n", encoding="utf-8")
            (artifact / "deleted-files.txt").write_text("docs/fr/removed.md\n", encoding="utf-8")

            with self.assertRaises(SystemExit):
                commit_locale_artifact.artifact_allowed("fr", str(artifact))

    def test_dispatch_r2_pages_parses_run_urls(self) -> None:
        self.assertEqual("28277584371", dispatch_r2_pages.parse_run_id("https://github.com/openclaw/docs/actions/runs/28277584371"))

    def test_dispatch_r2_pages_passes_scoped_inputs(self) -> None:
        captured: list[str] = []

        def fake_run(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
            captured.extend(args)
            return subprocess.CompletedProcess(
                args=args,
                returncode=0,
                stdout="https://github.com/openclaw/docs/actions/runs/28277584371\n",
                stderr="",
            )

        with patch.object(dispatch_r2_pages, "run", fake_run):
            run_id = dispatch_r2_pages.dispatch(
                "r2-pages.yml",
                "main",
                "openclaw/docs",
                "page",
                False,
                "zh-CN",
                "channels/line",
                "request-123",
            )

        self.assertEqual("28277584371", run_id)
        self.assertIn("artifact_scope=page", captured)
        self.assertIn("force_upload=false", captured)
        self.assertIn("locale=zh-CN", captured)
        self.assertIn("page_path=channels/line", captured)
        self.assertIn("request_id=request-123", captured)

    def test_dispatch_r2_pages_selects_recent_workflow_dispatch(self) -> None:
        calls = {"count": 0}
        now = "2026-06-27T03:43:01Z"

        def fake_run(args: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
            calls["count"] += 1
            payload = [{"databaseId": 123, "createdAt": now, "status": "queued", "url": "https://github.com/openclaw/docs/actions/runs/123"}]
            return subprocess.CompletedProcess(args=args, returncode=0, stdout=json.dumps(payload), stderr="")

        with patch.object(dispatch_r2_pages, "run", fake_run), patch.object(dispatch_r2_pages.time, "sleep", lambda _: None):
            run_id = dispatch_r2_pages.find_recent_run("r2-pages.yml", "main", "openclaw/docs", dispatch_r2_pages.parse_time(now))

        self.assertEqual("123", run_id)
        self.assertEqual(1, calls["count"])

    def test_dispatch_r2_pages_ignores_known_recent_runs(self) -> None:
        now = "2026-06-27T03:43:01Z"

        def fake_list(workflow: str, ref: str, repo: str) -> list[dict]:
            self.assertEqual("r2-pages.yml", workflow)
            self.assertEqual("main", ref)
            self.assertEqual("openclaw/docs", repo)
            return [
                {"databaseId": 123, "createdAt": now, "status": "completed", "url": "https://github.com/openclaw/docs/actions/runs/123"},
                {"databaseId": 456, "createdAt": now, "status": "queued", "url": "https://github.com/openclaw/docs/actions/runs/456"},
            ]

        with patch.object(dispatch_r2_pages, "list_workflow_dispatch_runs", fake_list), patch.object(dispatch_r2_pages.time, "sleep", lambda _: None):
            run_id = dispatch_r2_pages.find_dispatched_run(
                "r2-pages.yml",
                "main",
                "openclaw/docs",
                dispatch_r2_pages.parse_time(now),
                {"123"},
            )

        self.assertEqual("456", run_id)

    def test_dispatch_r2_pages_uses_request_id_to_resolve_concurrent_runs(self) -> None:
        now = "2026-06-27T03:43:01Z"

        def fake_list(workflow: str, ref: str, repo: str) -> list[dict]:
            return [
                {
                    "databaseId": 123,
                    "createdAt": now,
                    "displayTitle": "R2 Pages i18n-r2-locale-ja-JP-aaa",
                    "status": "queued",
                    "url": "https://github.com/openclaw/docs/actions/runs/123",
                },
                {
                    "databaseId": 456,
                    "createdAt": now,
                    "displayTitle": "R2 Pages i18n-r2-locale-zh-TW-bbb",
                    "status": "queued",
                    "url": "https://github.com/openclaw/docs/actions/runs/456",
                },
            ]

        with patch.object(dispatch_r2_pages, "list_workflow_dispatch_runs", fake_list), patch.object(dispatch_r2_pages.time, "sleep", lambda _: None):
            run_id = dispatch_r2_pages.find_dispatched_run(
                "r2-pages.yml",
                "main",
                "openclaw/docs",
                dispatch_r2_pages.parse_time(now),
                set(),
                "i18n-r2-locale-zh-TW-bbb",
            )

        self.assertEqual("456", run_id)

    def test_dispatch_r2_pages_retries_failed_dispatch_run(self) -> None:
        dispatches: list[str] = []
        waited: list[str] = []
        verified: list[tuple[str, str]] = []

        def fake_dispatch(
            workflow: str,
            ref: str,
            repo: str,
            artifact_scope: str,
            force_upload: bool,
            locale: str = "",
            page_path: str = "",
            request_id: str = "",
        ) -> str:
            dispatches.append(request_id)
            return "123" if len(dispatches) == 1 else "456"

        def fake_wait(repo: str, run_id: str, timeout_seconds: int, poll_seconds: int) -> None:
            waited.append(run_id)
            if run_id == "123":
                raise SystemExit("stale scoped deploy")

        def fake_verify(url: str, expected_h1: str, timeout_seconds: int, poll_seconds: int) -> None:
            verified.append((url, expected_h1))

        argv = [
            "dispatch_r2_pages.py",
            "--repo",
            "openclaw/docs",
            "--artifact-scope",
            "locale",
            "--locale",
            "zh-TW",
            "--dispatch-attempts",
            "2",
            "--poll-seconds",
            "1",
            "--live-url",
            "https://docs.openclaw.ai/zh-TW/channels/line",
            "--expect-h1",
            "LINE",
        ]
        with (
            patch.object(sys, "argv", argv),
            patch.object(dispatch_r2_pages, "known_workflow_dispatch_run_ids", lambda workflow, ref, repo: set()),
            patch.object(dispatch_r2_pages, "dispatch", fake_dispatch),
            patch.object(dispatch_r2_pages, "wait_for_run", fake_wait),
            patch.object(dispatch_r2_pages, "verify_live_h1", fake_verify),
            patch.object(dispatch_r2_pages.time, "sleep", lambda _: None),
        ):
            dispatch_r2_pages.main()

        self.assertEqual(["123", "456"], waited)
        self.assertEqual(2, len(dispatches))
        self.assertNotEqual(dispatches[0], dispatches[1])
        self.assertEqual([("https://docs.openclaw.ai/zh-TW/channels/line", "LINE")], verified)

    def test_dispatch_r2_pages_retries_cancelled_run(self) -> None:
        dispatches: list[str] = []
        waited: list[str] = []

        def fake_dispatch(
            workflow: str,
            ref: str,
            repo: str,
            artifact_scope: str,
            force_upload: bool,
            locale: str = "",
            page_path: str = "",
            request_id: str = "",
        ) -> str:
            dispatches.append(request_id)
            return "123" if len(dispatches) == 1 else "456"

        def fake_wait(repo: str, run_id: str, timeout_seconds: int, poll_seconds: int) -> None:
            waited.append(run_id)
            if run_id == "123":
                raise dispatch_r2_pages.R2RunConclusionError(run_id, "cancelled")

        argv = [
            "dispatch_r2_pages.py",
            "--repo",
            "openclaw/docs",
            "--dispatch-attempts",
            "3",
            "--poll-seconds",
            "1",
        ]
        with (
            patch.object(sys, "argv", argv),
            patch.object(dispatch_r2_pages, "known_workflow_dispatch_run_ids", lambda workflow, ref, repo: set()),
            patch.object(dispatch_r2_pages, "dispatch", fake_dispatch),
            patch.object(dispatch_r2_pages, "wait_for_run", fake_wait),
            patch.object(dispatch_r2_pages, "verify_live_h1", lambda url, expected_h1, timeout_seconds, poll_seconds: None),
            patch.object(dispatch_r2_pages.time, "sleep", lambda _: None),
        ):
            dispatch_r2_pages.main()

        self.assertEqual(["123", "456"], waited)
        self.assertEqual(2, len(dispatches))
        self.assertNotEqual(dispatches[0], dispatches[1])

    def test_dispatch_r2_pages_no_wait_skips_strict_publish_gate(self) -> None:
        waited: list[str] = []
        verified: list[tuple[str, str]] = []

        def fake_dispatch(
            workflow: str,
            ref: str,
            repo: str,
            artifact_scope: str,
            force_upload: bool,
            locale: str = "",
            page_path: str = "",
            request_id: str = "",
        ) -> str:
            return "123"

        def fake_wait(repo: str, run_id: str, timeout_seconds: int, poll_seconds: int) -> None:
            waited.append(run_id)
            raise SystemExit("R2 Pages run failed")

        def fake_verify(url: str, expected_h1: str, timeout_seconds: int, poll_seconds: int) -> None:
            verified.append((url, expected_h1))

        argv = [
            "dispatch_r2_pages.py",
            "--repo",
            "openclaw/docs",
            "--artifact-scope",
            "page",
            "--locale",
            "zh-TW",
            "--page-path",
            "channels/line",
            "--no-wait",
            "--live-url",
            "https://docs.openclaw.ai/zh-TW/channels/line",
            "--expect-h1",
            "LINE",
        ]
        with (
            patch.object(sys, "argv", argv),
            patch.object(dispatch_r2_pages, "known_workflow_dispatch_run_ids", lambda workflow, ref, repo: set()),
            patch.object(dispatch_r2_pages, "dispatch", fake_dispatch),
            patch.object(dispatch_r2_pages, "wait_for_run", fake_wait),
            patch.object(dispatch_r2_pages, "verify_live_h1", fake_verify),
        ):
            dispatch_r2_pages.main()

        self.assertEqual([], waited)
        self.assertEqual([], verified)

    def test_dispatch_r2_pages_rejects_ambiguous_new_runs(self) -> None:
        now = "2026-06-27T03:43:01Z"

        def fake_list(workflow: str, ref: str, repo: str) -> list[dict]:
            return [
                {"databaseId": 123, "createdAt": now, "status": "queued", "url": "https://github.com/openclaw/docs/actions/runs/123"},
                {"databaseId": 456, "createdAt": now, "status": "queued", "url": "https://github.com/openclaw/docs/actions/runs/456"},
            ]

        with patch.object(dispatch_r2_pages, "list_workflow_dispatch_runs", fake_list), patch.object(dispatch_r2_pages.time, "sleep", lambda _: None):
            with self.assertRaises(SystemExit):
                dispatch_r2_pages.find_dispatched_run(
                    "r2-pages.yml",
                    "main",
                    "openclaw/docs",
                    dispatch_r2_pages.parse_time(now),
                    set(),
                )

    def test_dispatch_r2_pages_extracts_h1_text(self) -> None:
        document = '<html><body><h1 class="title">LINE</h1></body></html>'

        self.assertEqual("LINE", dispatch_r2_pages.extract_h1(document))

    def test_dispatch_r2_pages_live_h1_retries_until_expected(self) -> None:
        seen: list[str] = []

        def fake_fetch(url: str, timeout_seconds: int = 30) -> str:
            seen.append(url)
            if len(seen) == 1:
                return "<h1>行</h1>"
            return "<h1>LINE</h1>"

        with patch.object(dispatch_r2_pages, "fetch_text", fake_fetch), patch.object(dispatch_r2_pages.time, "sleep", lambda _: None):
            dispatch_r2_pages.verify_live_h1("https://docs.openclaw.ai/zh-CN/channels/line", "LINE", 30, 1)

        self.assertEqual(2, len(seen))
        self.assertIn("_openclaw_i18n_canary=", seen[0])

    def test_r2_upload_page_scope_filters_manifest_entries(self) -> None:
        result = self._run_r2_upload_scope("page", "zh-CN", "channels/line")

        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("r2 upload scope: page (3/7 manifest entries, partial=true)", result.stdout)
        self.assertIn("r2 dry-run put: zh-CN/channels/line\n", result.stdout)
        self.assertIn("r2 dry-run put: zh-CN/channels/line/index.html", result.stdout)
        self.assertIn("r2 dry-run put: zh-CN/channels/line.md", result.stdout)
        self.assertNotIn("zh-CN/channels/sms", result.stdout)
        self.assertNotIn("ja-JP/channels/line", result.stdout)
        self.assertNotIn("assets/docs-site.css", result.stdout)
        self.assertNotIn("pagefind/pagefind.js", result.stdout)

    def test_r2_upload_locale_scope_filters_manifest_entries(self) -> None:
        result = self._run_r2_upload_scope("locale", "zh-CN")

        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("r2 upload scope: locale (5/7 manifest entries, partial=true)", result.stdout)
        self.assertIn("r2 dry-run put: zh-CN/channels/line/index.html", result.stdout)
        self.assertIn("r2 dry-run put: zh-CN/channels/sms/index.html", result.stdout)
        self.assertIn("r2 dry-run put: pagefind/pagefind.js", result.stdout)
        self.assertNotIn("ja-JP/channels/line", result.stdout)
        self.assertNotIn("assets/docs-site.css", result.stdout)

    def test_r2_upload_page_scope_allows_canary_locale_manifest_entries(self) -> None:
        result = self._run_r2_upload_scope(
            "page",
            "hi",
            "channels/line",
            extra_keys=[
                "hi/channels/line",
                "hi/channels/line/index.html",
                "hi/channels/line.md",
            ],
        )

        self.assertEqual(0, result.returncode, result.stderr)
        self.assertIn("r2 upload scope: page (3/10 manifest entries, partial=true)", result.stdout)
        self.assertIn("r2 dry-run put: hi/channels/line\n", result.stdout)
        self.assertIn("r2 dry-run put: hi/channels/line/index.html", result.stdout)
        self.assertIn("r2 dry-run put: hi/channels/line.md", result.stdout)

    def test_r2_upload_page_scope_rejects_unknown_locale_without_manifest_entries(self) -> None:
        result = self._run_r2_upload_scope("page", "hi", "channels/line")

        self.assertNotEqual(0, result.returncode)
        self.assertIn("R2_UPLOAD_SCOPE=page matched zero manifest entries", result.stderr)

    def test_r2_upload_locale_scope_rejects_pagefind_only_unknown_locale(self) -> None:
        result = self._run_r2_upload_scope("locale", "hi")

        self.assertNotEqual(0, result.returncode)
        self.assertIn("R2_UPLOAD_SCOPE=locale matched no entries for locale hi", result.stderr)

    def test_r2_upload_page_scope_rejects_unclean_locale_code(self) -> None:
        result = self._run_r2_upload_scope("page", "../hi", "channels/line")

        self.assertNotEqual(0, result.returncode)
        self.assertIn("R2_UPLOAD_LOCALE must be a clean locale code", result.stderr)

    def test_r2_upload_page_scope_rejects_reserved_asset_prefix_locale(self) -> None:
        result = self._run_r2_upload_scope("page", "assets", "docs-site.css")

        self.assertNotEqual(0, result.returncode)
        self.assertIn("R2_UPLOAD_LOCALE cannot use reserved docs asset prefix: assets", result.stderr)

    def test_r2_upload_locale_scope_rejects_reserved_pagefind_prefix_locale(self) -> None:
        result = self._run_r2_upload_scope("locale", "pagefind")

        self.assertNotEqual(0, result.returncode)
        self.assertIn("R2_UPLOAD_LOCALE cannot use reserved docs asset prefix: pagefind", result.stderr)

    def _run_r2_upload_scope(
        self,
        scope: str,
        locale: str,
        page_path: str = "",
        extra_keys: list[str] | None = None,
    ) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            dist = tmp_path / "dist"
            files = tmp_path / "files"
            dist.mkdir()
            files.mkdir()
            entries = []
            for key in [
                "zh-CN/channels/line",
                "zh-CN/channels/line/index.html",
                "zh-CN/channels/line.md",
                "zh-CN/channels/sms/index.html",
                "ja-JP/channels/line/index.html",
                "pagefind/pagefind.js",
                "assets/docs-site.css",
                *(extra_keys or []),
            ]:
                file_path = files / key.replace("/", "__")
                file_path.write_text(key, encoding="utf-8")
                digest = hashlib.sha256(file_path.read_bytes()).hexdigest()
                entries.append(
                    {
                        "cacheControl": "public, max-age=60",
                        "contentType": "text/html; charset=utf-8",
                        "file": str(file_path),
                        "key": key,
                        "sha256": digest,
                    }
                )

            manifest = tmp_path / "manifest.json"
            manifest.write_text(json.dumps({"entries": entries, "generatedAt": "2026-06-27T00:00:00Z", "version": 1}), encoding="utf-8")
            remote_manifest = tmp_path / "remote.json"
            remote_manifest.write_text(json.dumps({"entries": [], "generatedAt": "2026-06-26T00:00:00Z", "version": 1}), encoding="utf-8")

            test_env = os.environ.copy()
            test_env.update(
                {
                    "R2_UPLOAD_DRY_RUN": "1",
                    "R2_UPLOAD_MANIFEST_PATH": str(manifest),
                    "R2_UPLOAD_REMOTE_MANIFEST_PATH": str(remote_manifest),
                    "R2_UPLOAD_SCOPE": scope,
                    "R2_UPLOAD_LOCALE": locale,
                }
            )
            if page_path:
                test_env["R2_UPLOAD_PAGE_PATH"] = page_path
            return subprocess.run(
                ["node", str(REPO_ROOT / "scripts/docs-site/r2-upload.mjs")],
                cwd=tmp_path,
                env=test_env,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )

    def test_package_artifact_failure_writes_visible_github_status(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs").mkdir()
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")
            output = repo / "github-output.txt"

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "GITHUB_OUTPUT": str(output),
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
                package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            self.assertIn("failed=true", output.read_text(encoding="utf-8"))
            self.assertIn("failed_reason=translation failed", output.read_text(encoding="utf-8"))

    def test_mdx_repair_scope_allows_preexisting_untracked_locale_files_only(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            baseline = repo / ".openclaw-sync/mdx/fr.repair-baseline.txt"
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            (repo / "docs/fr/tracked.md").write_text("# Tracked FR\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            (repo / "docs/fr/from-translation.md").write_text("# New FR\n", encoding="utf-8")
            mdx_repair_scope.snapshot_scope(repo, "fr", baseline)

            (repo / "docs/fr/tracked.md").write_text("# Tracked FR repaired\n", encoding="utf-8")
            mdx_repair_scope.enforce_scope(repo, "fr", baseline)

            (repo / "docs/index.md").write_text("# Source side effect\n", encoding="utf-8")
            with self.assertRaises(SystemExit):
                mdx_repair_scope.enforce_scope(repo, "fr", baseline)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")

            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")

            (repo / "docs/fr/from-repair.md").write_text("# Repair side effect\n", encoding="utf-8")
            with self.assertRaises(SystemExit):
                mdx_repair_scope.enforce_scope(repo, "fr", baseline)

            baseline.write_text(baseline.read_text(encoding="utf-8") + "docs/fr/from-repair.md\n", encoding="utf-8")
            run_git(repo, "add", "docs/fr/from-repair.md")
            (repo / "docs/fr/staged-from-repair.md").write_text("# Staged repair side effect\n", encoding="utf-8")
            run_git(repo, "add", "docs/fr/staged-from-repair.md")
            with self.assertRaises(SystemExit):
                mdx_repair_scope.enforce_scope(repo, "fr", baseline)

            # Staged non-locale side effects are forbidden too. This stays
            # last so the suite never has to unstage the shared index.
            (repo / "docs/index.md").write_text("# Staged source side effect\n", encoding="utf-8")
            run_git(repo, "add", "docs/index.md")
            with self.assertRaises(SystemExit):
                mdx_repair_scope.enforce_scope(repo, "fr", baseline)

    def _relay_reusable_workflow_text(self) -> str:
        return (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")

    def test_reusable_workflow_keeps_single_entry_bounded_relay(self) -> None:
        text = self._relay_reusable_workflow_text()

        # D-09 budgets are explicit workflow env with the approved defaults.
        self.assertIn('MDX_REPAIR_MAX_ATTEMPTS: "4"', text)
        self.assertIn('MDX_REPAIR_HARD_TIMEOUT_MS: "600000"', text)
        self.assertIn('MDX_REPAIR_AUXILIARY_MODE: "none"', text)

        # Exactly one Agent entry, unrolled into at most MAX_ATTEMPTS rounds;
        # no other Codex executor and no auxiliary arm exists in production.
        self.assertEqual(4, text.count("uses: openai/codex-action@v1"))
        self.assertEqual(4, text.count("timeout-minutes: 12\n"))
        self.assertEqual(4, text.count("prompt-file: .openclaw-sync/docs-mdx-repair.md"))
        # No legacy --full-auto CLI flag: sandbox/approval semantics are
        # carried by the codex-action inputs themselves (sandbox,
        # safety-strategy), matching the production minimal call surface.
        self.assertNotIn("full-auto", text)
        self.assertEqual(4, text.count("sandbox: workspace-write"))
        self.assertEqual(4, text.count("safety-strategy: drop-sudo"))
        self.assertNotIn("codex exec", text)
        self.assertNotIn("prettier", text)
        self.assertNotIn("pr153", text)

        # Contract stage order: strict check -> relay decision -> scope
        # snapshot -> per-round (repair -> enforce scope -> recheck) -> report
        # -> artifact packaging.
        order = [
            "Check translated MDX",
            "Decide MDX repair relay",
            "Snapshot translated MDX repair scope",
            "Repair translated MDX\n",
            "Enforce translated MDX repair scope\n",
            "Recheck translated MDX\n",
            "Repair translated MDX (relay round 2)",
            "Enforce translated MDX repair scope (relay round 2)",
            "Recheck translated MDX (relay round 2)",
            "Repair translated MDX (relay round 3)",
            "Enforce translated MDX repair scope (relay round 3)",
            "Recheck translated MDX (relay round 3)",
            "Repair translated MDX (relay round 4)",
            "Enforce translated MDX repair scope (relay round 4)",
            "Recheck translated MDX (relay round 4)",
            "Record MDX repair relay outcome",
            "Prepare locale artifact",
        ]
        positions = [text.index(name) for name in order]
        self.assertEqual(sorted(positions), positions)

        # Relay stop conditions: round N+1 only runs when round N's recheck
        # still failed, so retries are bounded and diagnostics stay current.
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 1", text)
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 2", text)
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 3", text)
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 4", text)
        self.assertIn("steps.mdx_repair.outcome == 'success' &&\n          steps.mdx_scope.outcome == 'success' && steps.mdx_recheck.outcome == 'failure'", text)
        self.assertIn("steps.mdx_repair_2.outcome == 'success' &&\n          steps.mdx_scope_2.outcome == 'success' && steps.mdx_recheck_2.outcome == 'failure'", text)
        self.assertIn("steps.mdx_repair_3.outcome == 'success' &&\n          steps.mdx_scope_3.outcome == 'success' && steps.mdx_recheck_3.outcome == 'failure'", text)

        # Every relay round keeps the scope and strict recheck gates; the
        # scope baseline is snapshotted once before the first repair round.
        self.assertEqual(4, text.count('mdx_repair_scope.py" enforce'))
        self.assertEqual(1, text.count('mdx_repair_scope.py" snapshot'))
        self.assertEqual(5, text.count("check-docs-mdx.mjs"))
        self.assertIn('python "${I18N_SCRIPT_DIR}/mdx_repair_relay.py" decide', text)
        self.assertIn('python "${I18N_SCRIPT_DIR}/mdx_repair_relay.py" report', text)

    def test_docs_mdx_repair_prompt_carries_relay_protocol(self) -> None:
        prompt_file = REPO_ROOT / ".openclaw-sync/docs-mdx-repair.md"
        prompt = " ".join(prompt_file.read_text(encoding="utf-8").split())

        self.assertIn("multi-round relay protocol", prompt)
        self.assertIn("fix all parser/checker diagnostics reported for this round", prompt)
        self.assertIn("continue fixing the remaining diagnostics", prompt)
        self.assertIn("until the pages pass strict MDX", prompt)
        self.assertIn("must_preserve", prompt)
        self.assertIn("Do not rewrite the whole page", prompt)
        self.assertIn("Do not add, delete, or rename files", prompt)
        self.assertIn(".openclaw-sync/mdx/${LOCALE}.json", prompt)
        self.assertIn("MDX_REPAIR_MAX_ATTEMPTS", prompt)
        self.assertIn("complete pages", prompt)

    def _relay_decide_workspace(self, repo: Path, errors: list[dict], manifest_lines: list[str]) -> None:
        mdx_dir = repo / ".openclaw-sync/mdx"
        mdx_dir.mkdir(parents=True, exist_ok=True)
        (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text("\n".join(manifest_lines) + ("\n" if manifest_lines else ""), encoding="utf-8")
        (mdx_dir / "fr.json").write_text(json.dumps({"files": 1, "errors": errors}), encoding="utf-8")

    def test_repair_relay_decide_runs_on_strict_compile_failure(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            source = repo / "docs/index.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Index\n", encoding="utf-8")
            (repo / "docs/fr").mkdir()
            (repo / "docs/fr/index.md").write_text("# Index FR\n", encoding="utf-8")
            self._relay_decide_workspace(
                repo,
                [{"type": "mdx", "file": "docs/fr/index.md", "line": 1, "column": 1, "message": "Unexpected end of file"}],
                [str(source)],
            )
            output = repo / "github-output.txt"
            relay_env = {
                "GITHUB_WORKSPACE": str(repo),
                "GITHUB_OUTPUT": str(output),
                "RUNNER_TEMP": str(repo / ".openclaw-sync/mdx"),
                "LOCALE": "fr",
                "LOCALE_SLUG": "fr",
                "SHARD_INDEX": "0",
                "SHARD_TOTAL": "1",
                "MDX_CHECK_OUTCOME": "failure",
                "MDX_REPAIR_MAX_ATTEMPTS": "4",
                "MDX_REPAIR_HARD_TIMEOUT_MS": "600000",
            }

            with chdir(repo), env(relay_env):
                mdx_repair_relay.decide(repo)

            self.assertIn("decision=run", output.read_text(encoding="utf-8"))
            state = json.loads((repo / ".openclaw-sync/mdx/fr-repair-state.json").read_text(encoding="utf-8"))
            self.assertEqual("run", state["decision"])
            self.assertEqual("relay", state["repair_mode"])
            self.assertEqual(4, state["max_attempts"])
            self.assertEqual(600000, state["hard_timeout_ms"])
            self.assertEqual("none", state["auxiliary_mode"])
            snapshot = json.loads(
                (repo / ".openclaw-sync/mdx/fr.repair-content-snapshot.json").read_text(encoding="utf-8")
            )
            self.assertEqual(["docs/fr/index.md"], sorted(snapshot))

    def test_repair_relay_decide_records_not_run_for_startup_conditions(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            source = repo / "docs/index.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Index\n", encoding="utf-8")
            output = repo / "github-output.txt"
            base_env = {
                "GITHUB_WORKSPACE": str(repo),
                "GITHUB_OUTPUT": str(output),
                "RUNNER_TEMP": str(repo / ".openclaw-sync/mdx"),
                "LOCALE": "fr",
                "LOCALE_SLUG": "fr",
                "SHARD_INDEX": "0",
                "SHARD_TOTAL": "1",
                "MDX_CHECK_OUTCOME": "failure",
                "MDX_REPAIR_MAX_ATTEMPTS": "4",
                "MDX_REPAIR_HARD_TIMEOUT_MS": "600000",
            }
            compile_error = {"type": "mdx", "file": "docs/fr/index.md", "line": 1, "column": 1, "message": "boom"}

            def decide_with(errors: list[dict], manifest_lines: list[str], check_outcome: str = "failure") -> str:
                output.write_text("", encoding="utf-8")
                self._relay_decide_workspace(repo, errors, manifest_lines)
                with chdir(repo), env({**base_env, "MDX_CHECK_OUTCOME": check_outcome}):
                    mdx_repair_relay.decide(repo)
                return output.read_text(encoding="utf-8")

            # Strict check passed: the repair must not start.
            self.assertIn("decision=not_run", decide_with([compile_error], [str(source)], check_outcome="success"))
            self.assertIn("reason=mdx_check_success", output.read_text(encoding="utf-8"))

            # No pending files: not_run success branch.
            self.assertIn("decision=not_run", decide_with([compile_error], []))
            self.assertIn("reason=no_pending_files", output.read_text(encoding="utf-8"))

            # Only non-compile diagnostics (e.g. poison text): not repaired.
            poison = {"type": "poison-text", "file": "docs/fr/index.md", "line": 1, "column": 1, "message": "leak"}
            self.assertIn("decision=not_run", decide_with([poison], [str(source)]))
            self.assertIn("reason=no_mdx_compile_diagnostics", output.read_text(encoding="utf-8"))

            # Diagnostics outside the locale scope: not repaired.
            outside = {"type": "mdx", "file": "docs/en/index.md", "line": 1, "column": 1, "message": "boom"}
            self.assertIn("decision=not_run", decide_with([outside], [str(source)]))
            self.assertIn("reason=diagnostics_out_of_locale_scope", output.read_text(encoding="utf-8"))

            state = json.loads((repo / ".openclaw-sync/mdx/fr-repair-state.json").read_text(encoding="utf-8"))
            self.assertEqual("none", state["repair_mode"])
            self.assertFalse((repo / ".openclaw-sync/mdx/fr.repair-content-snapshot.json").exists())

    def test_repair_relay_decide_fails_closed_on_invalid_budget_or_auxiliary(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            source = repo / "docs/index.md"
            source.parent.mkdir(parents=True)
            source.write_text("# Index\n", encoding="utf-8")
            self._relay_decide_workspace(
                repo,
                [{"type": "mdx", "file": "docs/fr/index.md", "line": 1, "column": 1, "message": "boom"}],
                [str(source)],
            )
            base_env = {
                "GITHUB_WORKSPACE": str(repo),
                "LOCALE": "fr",
                "LOCALE_SLUG": "fr",
                "SHARD_INDEX": "0",
                "SHARD_TOTAL": "1",
                "MDX_CHECK_OUTCOME": "failure",
                "MDX_REPAIR_MAX_ATTEMPTS": "4",
                "MDX_REPAIR_HARD_TIMEOUT_MS": "600000",
            }
            with chdir(repo):
                with env({**base_env, "MDX_REPAIR_MAX_ATTEMPTS": "0"}), self.assertRaisesRegex(SystemExit, "MDX_REPAIR_MAX_ATTEMPTS"):
                    mdx_repair_relay.decide(repo)
                with env({**base_env, "MDX_REPAIR_HARD_TIMEOUT_MS": "unlimited"}), self.assertRaisesRegex(SystemExit, "MDX_REPAIR_HARD_TIMEOUT_MS"):
                    mdx_repair_relay.decide(repo)
                with env({**base_env, "MDX_REPAIR_AUXILIARY_MODE": "prettier"}), self.assertRaisesRegex(SystemExit, "not enabled in production"):
                    mdx_repair_relay.decide(repo)

    def _relay_report_workspace(self, repo: Path, errors: list[dict], snapshot: dict[str, str], decision: str = "run") -> None:
        mdx_dir = repo / ".openclaw-sync/mdx"
        mdx_dir.mkdir(parents=True, exist_ok=True)
        (mdx_dir / "fr.json").write_text(json.dumps({"files": 3, "errors": errors}), encoding="utf-8")
        (mdx_dir / "fr-repair-state.json").write_text(
            json.dumps(
                {
                    "decision": decision,
                    "not_run_reason": "" if decision == "run" else "no_pending_files",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "shard_index": "0",
                    "shard_total": "1",
                    "repair_mode": "relay" if decision == "run" else "none",
                    "max_attempts": 4,
                    "hard_timeout_ms": 600000,
                    "auxiliary_mode": "none",
                }
            ),
            encoding="utf-8",
        )
        (mdx_dir / "fr.repair-content-snapshot.json").write_text(json.dumps(snapshot), encoding="utf-8")

    def test_repair_relay_report_classifies_relay_outcomes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            docs = repo / "docs"
            (docs / "fr").mkdir(parents=True)
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            (docs / "guide.md").write_text("# Guide\n", encoding="utf-8")
            (docs / "fr/index.md").write_text("# Index FR casse\n", encoding="utf-8")
            (docs / "fr/guide.md").write_text("# Guide FR\n", encoding="utf-8")
            (docs / "fr/poison.md").write_text("# Poison FR\n", encoding="utf-8")
            manifest_lines = [str(docs / name) for name in ("index.md", "guide.md", "poison.md")]
            (repo / ".openclaw-sync").mkdir(exist_ok=True)
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text("\n".join(manifest_lines) + "\n", encoding="utf-8")
            guide_hash = hashlib.sha256((docs / "fr/guide.md").read_bytes()).hexdigest()
            poison_hash = hashlib.sha256((docs / "fr/poison.md").read_bytes()).hexdigest()
            output = repo / "github-output.txt"
            base_env = {
                "GITHUB_WORKSPACE": str(repo),
                "GITHUB_OUTPUT": str(output),
                "RUNNER_TEMP": str(repo / ".openclaw-sync/mdx"),
                "LOCALE": "fr",
                "LOCALE_SLUG": "fr",
                "SHARD_INDEX": "0",
                "SHARD_TOTAL": "1",
                "MDX_CHECK_OUTCOME": "failure",
                "MDX_REPAIR_MAX_ATTEMPTS": "4",
                "MDX_REPAIR_HARD_TIMEOUT_MS": "600000",
            }
            compile_error = {"type": "mdx", "file": "docs/fr/index.md", "line": 3, "column": 1, "message": "Unexpected end of file"}
            poison_error = {"type": "poison-text", "file": "docs/fr/poison.md", "line": 1, "column": 1, "message": "Leaked tool-call channel marker."}

            def report_with(errors: list[dict], snapshot: dict[str, str], outcomes: str, decision: str = "run") -> dict[str, object]:
                output.write_text("", encoding="utf-8")
                self._relay_report_workspace(repo, errors, snapshot, decision)
                with chdir(repo), env({**base_env, "MDX_REPAIR_ROUNDS_OUTCOMES": outcomes}):
                    mdx_repair_relay.report(repo)
                lines = dict(line.split("=", 1) for line in output.read_text(encoding="utf-8").splitlines() if "=" in line)
                self.assertEqual("not_run" if decision != "run" else lines["final_outcome"], lines["final_outcome"])
                return {**lines, "report": json.loads((repo / ".openclaw-sync/mdx/fr-repair-report.json").read_text(encoding="utf-8"))}

            snapshot = {
                "docs/fr/index.md": "stale-content-hash",
                "docs/fr/guide.md": guide_hash,
                "docs/fr/poison.md": poison_hash,
            }
            # Partial success: one page still failing, one pending page passing.
            result = report_with(
                [compile_error, poison_error],
                snapshot,
                "success success failure skipped skipped skipped skipped skipped skipped skipped skipped skipped",
            )
            self.assertEqual("partial_success", result["final_outcome"])
            self.assertEqual("compile_failed", result["failure_kind"])
            self.assertEqual("relay", result["repair_mode"])
            self.assertEqual("1", result["rounds"])
            self.assertEqual("failure", result["recheck_outcome"])
            self.assertEqual("docs/fr/index.md docs/fr/poison.md", result["failed_paths"])
            self.assertEqual("docs/fr/poison.md", result["nonsyntax_failed_paths"])
            self.assertEqual(["docs/fr/index.md"], [record["path"] for record in result["report"]["changed_paths"]])
            self.assertEqual("mdx", result["report"]["error_source"])
            self.assertEqual(3, result["report"]["error_line"])
            self.assertEqual(1, result["report"]["error_column"])
            self.assertEqual([], result["report"]["violations"])

            # Relay success: strict recheck passed, no failures recorded.
            result = report_with([], {"docs/fr/guide.md": guide_hash}, "success success success skipped skipped skipped skipped skipped skipped skipped skipped skipped")
            self.assertEqual("success", result["final_outcome"])
            self.assertEqual("success", result["recheck_outcome"])
            self.assertEqual("", result["failed_paths"])

            # Relay never started (not_run decision).
            result = report_with([compile_error], snapshot, "skipped skipped skipped skipped skipped skipped skipped skipped skipped skipped skipped skipped", decision="not_run")
            self.assertEqual("not_run", result["final_outcome"])
            self.assertEqual("none", result["repair_mode"])

            # All pending pages still failing: explicit final failure.
            damage = {"type": "mdx", "file": "docs/fr/guide.md", "line": 1, "column": 1, "message": "boom"}
            result = report_with([compile_error, damage, poison_error], snapshot, "success success failure skipped skipped skipped skipped skipped skipped skipped skipped skipped")
            self.assertEqual("final_failure", result["final_outcome"])
            self.assertEqual("compile_failed", result["failure_kind"])

            # Hard action failure (timeout/crash) never counts as success.
            result = report_with([compile_error], snapshot, "failure skipped skipped skipped skipped skipped skipped skipped skipped skipped skipped skipped")
            self.assertEqual("final_failure", result["final_outcome"])
            self.assertEqual("action_failed", result["failure_kind"])

            # Repair-phase page deletion/emptying is a content-loss violation.
            loss_snapshot = {
                **snapshot,
                "docs/fr/deleted.md": "gone",
                "docs/fr/emptied.md": "gone-too",
            }
            (docs / "fr/emptied.md").write_text("", encoding="utf-8")
            result = report_with([], loss_snapshot, "success success success skipped skipped skipped skipped skipped skipped skipped skipped skipped")
            self.assertEqual("final_failure", result["final_outcome"])
            self.assertEqual("content_loss", result["failure_kind"])
            codes = [violation["code"] for violation in result["report"]["violations"]]
            self.assertEqual(["whole_document_deleted", "empty_output"], codes)

    def test_package_artifact_partial_success_keeps_passing_pages_and_marks_failed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            (repo / "docs/guide.md").write_text("# Guide\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            # Both pages are new translations; one is damaged beyond the
            # deterministic rescue, one is healthy.
            (repo / "docs/fr/index.md").write_text("Texte {{ready &&\n", encoding="utf-8")
            (repo / "docs/fr/guide.md").write_text("# Guide FR\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(f"{repo / 'docs/index.md'}\n{repo / 'docs/guide.md'}\n", encoding="utf-8")
            mdx_dir = repo / ".openclaw-sync/mdx"
            mdx_dir.mkdir(parents=True)
            (mdx_dir / "fr-repair-report.json").write_text('{"repair_mode": "relay", "rounds": 2}\n', encoding="utf-8")

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "LOCALE": "fr",
                    "LOCALE_SLUG": "fr",
                    "SOURCE_SHA": "source-a",
                    "MODE": "full",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "WORKER_PARALLEL": "3",
                    "THINKING_EFFORT": "xhigh",
                    "PENDING_COUNT": "2",
                    "TOTAL_PENDING_COUNT": "2",
                    "ALL_COUNT": "2",
                    "TRANSLATE_OUTCOME": "success",
                    "MDX_CHECK_OUTCOME": "failure",
                    "MDX_REPAIR_OUTCOME": "success",
                    "MDX_SCOPE_OUTCOME": "success",
                    "MDX_RECHECK_OUTCOME": "failure",
                    "MDX_REPAIR_FINAL_OUTCOME": "partial_success",
                    "MDX_REPAIR_FAILURE_KIND": "compile_failed",
                    "MDX_REPAIR_MODE": "relay",
                    "MDX_REPAIR_ROUNDS": "2",
                    "MDX_REPAIR_FAILED_PATHS": "docs/fr/index.md",
                    "MDX_REPAIR_CHANGED_PATHS": "docs/fr/index.md docs/fr/guide.md",
                }
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            # The damaged page is excluded and explicitly marked; the healthy
            # page is packaged normally instead of dropping the whole shard.
            self.assertEqual("", metadata["failed_reason"])
            self.assertEqual(["docs/fr/guide.md"], (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines())
            self.assertTrue((artifact / "payload/docs/fr/guide.md").exists())
            self.assertFalse((artifact / "payload/docs/fr/index.md").exists())
            self.assertEqual("partial", metadata["mdx_syntax_repair_outcome"])
            self.assertEqual("partial_success", metadata["mdx_repair_final_outcome"])
            self.assertEqual("relay", metadata["mdx_repair_mode"])
            self.assertEqual(2, metadata["mdx_repair_rounds"])
            self.assertEqual(["docs/fr/index.md"], metadata["mdx_repair_failed_paths"])
            self.assertEqual(["docs/fr/guide.md", "docs/fr/index.md"], metadata["mdx_repair_changed_paths"])
            report = json.loads((artifact / "mdx-repair-report.json").read_text(encoding="utf-8"))
            self.assertEqual("relay", report["repair_mode"])

    def test_package_artifact_salvages_fixable_pages_in_partial_shard(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs/fr").mkdir(parents=True)
            (repo / "docs/note.md").write_text("<Note>Take care</Note>\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")

            # The unclosed element is deterministic-rescueable, so the page is
            # salvaged and packaged even though the relay reported it failed.
            (repo / "docs/fr/note.md").write_text("<Note>Prendre soin\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(f"{repo / 'docs/note.md'}\n", encoding="utf-8")

            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "LOCALE": "fr",
                    "LOCALE_SLUG": "fr",
                    "SOURCE_SHA": "source-a",
                    "MODE": "full",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "WORKER_PARALLEL": "3",
                    "THINKING_EFFORT": "xhigh",
                    "PENDING_COUNT": "1",
                    "TOTAL_PENDING_COUNT": "1",
                    "ALL_COUNT": "1",
                    "TRANSLATE_OUTCOME": "success",
                    "MDX_CHECK_OUTCOME": "failure",
                    "MDX_REPAIR_OUTCOME": "success",
                    "MDX_SCOPE_OUTCOME": "success",
                    "MDX_RECHECK_OUTCOME": "failure",
                    "MDX_REPAIR_FINAL_OUTCOME": "partial_success",
                    "MDX_REPAIR_FAILURE_KIND": "compile_failed",
                    "MDX_REPAIR_MODE": "relay",
                    "MDX_REPAIR_ROUNDS": "1",
                    "MDX_REPAIR_FAILED_PATHS": "docs/fr/note.md",
                }
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            self.assertEqual("", metadata["failed_reason"])
            self.assertEqual(["docs/fr/note.md"], (artifact / "changed-files.txt").read_text(encoding="utf-8").splitlines())
            self.assertEqual("<Note>Prendre soin</Note>\n", (artifact / "payload/docs/fr/note.md").read_text(encoding="utf-8"))
            self.assertEqual("success", metadata["mdx_syntax_repair_outcome"])
            # Every relay-failed page was rescued, so the shard result is a
            # full success.
            self.assertEqual("success", metadata["mdx_repair_final_outcome"])
            self.assertEqual([], metadata["mdx_repair_failed_paths"])

    def test_package_artifact_repair_relay_metadata_on_clean_shard(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs").mkdir()
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")
            (repo / "docs/fr").mkdir()
            (repo / "docs/fr/index.md").write_text("# Index FR\n", encoding="utf-8")
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
                    "WORKER_PARALLEL": "3",
                    "THINKING_EFFORT": "medium",
                    "PENDING_COUNT": "1",
                    "TOTAL_PENDING_COUNT": "1",
                    "ALL_COUNT": "1",
                    "TRANSLATE_OUTCOME": "success",
                    "MDX_CHECK_OUTCOME": "success",
                    "MDX_REPAIR_OUTCOME": "skipped",
                    "MDX_SCOPE_OUTCOME": "skipped",
                    "MDX_RECHECK_OUTCOME": "skipped",
                    "MDX_REPAIR_FINAL_OUTCOME": "not_run",
                    "MDX_REPAIR_MODE": "none",
                    "MDX_REPAIR_ROUNDS": "0",
                }
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            self.assertEqual("", metadata["failed_reason"])
            self.assertEqual("not_run", metadata["mdx_repair_final_outcome"])
            self.assertEqual("none", metadata["mdx_repair_mode"])
            self.assertEqual(0, metadata["mdx_repair_rounds"])
            self.assertEqual([], metadata["mdx_repair_failed_paths"])
            self.assertFalse((repo / ".openclaw-sync/artifacts/fr-s0of1/mdx-repair-report.json").exists())

    def test_package_artifact_syntax_salvage_fails_closed_on_infrastructure_error(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / ".openclaw-sync").mkdir()
            (repo / "docs").mkdir()
            (repo / "docs/index.md").write_text("# Index\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")
            (repo / "docs/fr").mkdir()
            (repo / "docs/fr/index.md").write_text("# Index FR\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n", encoding="utf-8")

            with (
                chdir(repo),
                patch.object(package_artifact, "repair_mdx_syntax", return_value=("node crashed without page info", [], True)),
                env(
                    {
                        "GITHUB_WORKSPACE": str(repo),
                        "LOCALE": "fr",
                        "LOCALE_SLUG": "fr",
                        "SOURCE_SHA": "source-a",
                        "MODE": "incremental",
                        "SHARD_INDEX": "0",
                        "SHARD_TOTAL": "1",
                        "WORKER_PARALLEL": "3",
                        "THINKING_EFFORT": "medium",
                        "PENDING_COUNT": "1",
                        "TOTAL_PENDING_COUNT": "1",
                        "ALL_COUNT": "1",
                        "TRANSLATE_OUTCOME": "success",
                        "MDX_CHECK_OUTCOME": "success",
                        "MDX_REPAIR_OUTCOME": "skipped",
                        "MDX_SCOPE_OUTCOME": "skipped",
                        "MDX_RECHECK_OUTCOME": "skipped",
                    }
                ),
            ):
                metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            # A salvage run that cannot name a failing page is infrastructure
            # failure, not per-page salvage: the shard fails closed.
            self.assertEqual("mdx syntax repair failed", metadata["failed_reason"])
            self.assertEqual("", (repo / ".openclaw-sync/artifacts/fr-s0of1/changed-files.txt").read_text(encoding="utf-8"))

    def test_apply_artifacts_reports_mdx_repair_unresolved_pages(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            summary = Path(tmp) / "step-summary.txt"
            self._write_artifact(
                artifacts,
                "partial",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 0,
                    "shard_total": 1,
                    "source_sha": "source-a",
                    "mdx_repair_mode": "relay",
                    "mdx_repair_rounds": 4,
                    "mdx_repair_final_outcome": "partial_success",
                    "mdx_repair_failed_paths": ["docs/fr/broken.md"],
                },
                changed=["docs/fr/index.md"],
                payload={"docs/fr/index.md": "# Index FR\n"},
            )

            with chdir(repo), env({"GITHUB_STEP_SUMMARY": str(summary)}):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="incremental",
                    shard_total=1,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            # The shard applies (failed_reason stays empty) and the finalizer
            # interprets the per-page failure marking in its summary.
            self.assertEqual(0, result["incomplete_count"])
            self.assertTrue((repo / "docs/fr/index.md").exists())
            self.assertIn("mdx repair unresolved pages", summary.read_text(encoding="utf-8"))
            self.assertIn("fr: 1 page(s) still failing strict MDX", summary.read_text(encoding="utf-8"))

    def test_full_summary_ignores_canary_as_locale_success_and_reports_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifacts = Path(tmp)
            self._write_artifact(
                artifacts,
                "canary",
                metadata={
                    "artifact_role": "canary",
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "full",
                    "shard_index": 0,
                    "shard_total": 1,
                    "source_sha": "source-a",
                    "changed_count": 1,
                    "deleted_count": 0,
                },
            )

            summary = summarize_full.summarize_full(["fr"], artifacts, "success", "success")

            self.assertEqual([], summary.successful)
            self.assertEqual(["fr: no artifact"], summary.skipped)

    def test_full_summary_aggregates_locale_shard_artifacts(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            artifacts = Path(tmp)
            for index, changed_count in enumerate([2, 3]):
                self._write_artifact(
                    artifacts,
                    f"fr-s{index}of2",
                    metadata={
                        "artifact_role": "locale",
                        "failed_reason": "",
                        "locale": "fr",
                        "locale_slug": "fr",
                        "mode": "full",
                        "shard_index": index,
                        "shard_total": 2,
                        "source_sha": "source-a",
                        "changed_count": changed_count,
                        "deleted_count": 1,
                    },
                )

            summary = summarize_full.summarize_full(["fr"], artifacts, "success", "success")

            self.assertEqual(["fr: changed=5 deleted=2"], summary.successful)
            self.assertEqual([], summary.failed)
            self.assertEqual([], summary.skipped)

    def test_merge_artifact_roots_prefers_current_rerun(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            previous = root / "previous"
            current = root / "current"
            output = root / "output"
            metadata = {
                "locale": "fr",
                "locale_slug": "fr",
                "mode": "full",
                "shard_index": 1,
                "shard_total": 2,
                "source_sha": "source-a",
                "changed_count": 0,
                "deleted_count": 0,
            }
            self._write_artifact(
                previous,
                "i18n-fr-s1of2-source-a",
                metadata={**metadata, "failed_reason": "translation failed"},
            )
            self._write_artifact(
                current,
                "i18n-fr-s1of2-source-a",
                metadata={**metadata, "failed_reason": ""},
            )

            count = merge_artifact_roots.merge_artifact_roots(previous, current, output)

            self.assertEqual(1, count)
            merged = json.loads((output / "i18n-fr-s1of2-source-a/metadata.json").read_text(encoding="utf-8"))
            self.assertEqual("", merged["failed_reason"])

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

    def test_apply_artifacts_applies_all_locale_shards_together(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            (repo / "docs/guide").mkdir()
            (repo / "docs/guide/setup.md").write_text("# Setup\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "add source")
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "fr-s0of2",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "full",
                    "shard_index": 0,
                    "shard_total": 2,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/index.md"],
                payload={"docs/fr/index.md": "# Index FR\n"},
            )
            self._write_artifact(
                artifacts,
                "fr-s1of2",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "full",
                    "shard_index": 1,
                    "shard_total": 2,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/guide/setup.md"],
                payload={"docs/fr/guide/setup.md": "# Setup FR\n"},
            )

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="full",
                    shard_total=2,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            self.assertEqual(0, result["incomplete_count"])
            self.assertIn("Index FR", (repo / "docs/fr/index.md").read_text(encoding="utf-8"))
            self.assertIn("Setup FR", (repo / "docs/fr/guide/setup.md").read_text(encoding="utf-8"))

    def test_apply_artifacts_leaves_locale_unchanged_when_one_stale_page_changed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            (repo / "docs/guide.md").write_text("# Current guide\n", encoding="utf-8")
            (repo / "docs/fr").mkdir()
            (repo / "docs/fr/index.md").write_text("# Existing index FR\n", encoding="utf-8")
            (repo / "docs/fr/guide.md").write_text("# Existing guide FR\n", encoding="utf-8")
            (repo / ".openclaw-sync/source.json").write_text(
                '{"repository":"openclaw/openclaw","sha":"source-b"}\n',
                encoding="utf-8",
            )
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "move source")
            index_hash = hashlib.sha256((repo / "docs/index.md").read_bytes()).hexdigest()
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "fr-s0of1",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "full",
                    "shard_index": 0,
                    "shard_total": 1,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/index.md", "docs/fr/guide.md"],
                payload={
                    "docs/fr/index.md": (
                        "---\n"
                        "x-i18n:\n"
                        f"  source_hash: {index_hash}\n"
                        "---\n\n"
                        "# Updated index FR\n"
                    ),
                    "docs/fr/guide.md": (
                        "---\n"
                        "x-i18n:\n"
                        f"  source_hash: {'0' * 64}\n"
                        "---\n\n"
                        "# Stale guide FR\n"
                    ),
                },
            )

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="full",
                    shard_total=1,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            self.assertEqual(1, result["incomplete_count"])
            self.assertEqual(0, result["changed_count"])
            self.assertEqual("# Existing index FR\n", (repo / "docs/fr/index.md").read_text(encoding="utf-8"))
            self.assertEqual("# Existing guide FR\n", (repo / "docs/fr/guide.md").read_text(encoding="utf-8"))

    def test_apply_artifacts_leaves_incomplete_locale_unchanged(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            (repo / "docs/fr").mkdir()
            (repo / "docs/fr/index.md").write_text("# Existing FR\n", encoding="utf-8")
            (repo / "docs/fr/removed.md").write_text("# Keep until locale completes\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "add existing locale")
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "fr-s0of2",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 0,
                    "shard_total": 2,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/index.md"],
                deleted=["docs/fr/removed.md"],
                payload={"docs/fr/index.md": "# Updated FR\n"},
            )
            self._write_artifact(
                artifacts,
                "fr-s1of2",
                metadata={
                    "failed_reason": "translation failed",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 1,
                    "shard_total": 2,
                    "source_sha": "source-a",
                },
            )

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="incremental",
                    shard_total=2,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            self.assertEqual(1, result["incomplete_count"])
            self.assertEqual("# Existing FR\n", (repo / "docs/fr/index.md").read_text(encoding="utf-8"))
            self.assertTrue((repo / "docs/fr/removed.md").exists())
            self.assertEqual(0, result["changed_count"])

    def test_apply_artifacts_does_not_block_complete_locale_for_malformed_extra(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "fr-s0of1",
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
                payload={"docs/fr/index.md": "# Index FR\n"},
            )
            self._write_artifact(
                artifacts,
                "stray",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": "invalid",
                    "shard_total": 1,
                    "source_sha": "source-a",
                },
            )
            non_object = self._write_artifact(artifacts, "non-object")
            (non_object / "metadata.json").write_text("[]\n", encoding="utf-8")
            unhashable_slug = self._write_artifact(artifacts, "unhashable-slug")
            (unhashable_slug / "metadata.json").write_text(
                json.dumps({"locale": "fr", "locale_slug": []}) + "\n",
                encoding="utf-8",
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

            self.assertEqual(3, result["incomplete_count"])
            self.assertIn("Index FR", (repo / "docs/fr/index.md").read_text(encoding="utf-8"))

    def test_apply_artifacts_leaves_locale_unchanged_for_missing_shard_payload(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = self._repo_with_source(tmp)
            (repo / "docs/fr").mkdir()
            (repo / "docs/fr/index.md").write_text("# Existing FR\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "add existing locale")
            artifacts = repo / ".openclaw-sync/i18n-artifacts"
            self._write_artifact(
                artifacts,
                "fr-s0of2",
                metadata={
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 0,
                    "shard_total": 2,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/index.md"],
                payload={"docs/fr/index.md": "# Updated FR\n"},
            )
            self._write_artifact(
                artifacts,
                "fr-s1of2",
                metadata={
                    "changed_count": 1,
                    "failed_reason": "",
                    "locale": "fr",
                    "locale_slug": "fr",
                    "mode": "incremental",
                    "shard_index": 1,
                    "shard_total": 2,
                    "source_sha": "source-a",
                },
                changed=["docs/fr/missing.md"],
            )

            with chdir(repo):
                result = apply_artifacts.apply_artifacts(
                    source_sha="source-a",
                    mode="incremental",
                    shard_total=2,
                    expected_locales="fr=fr",
                    artifacts_root=artifacts,
                    skip_checkout_main=True,
                )

            self.assertEqual(1, result["incomplete_count"])
            self.assertEqual("# Existing FR\n", (repo / "docs/fr/index.md").read_text(encoding="utf-8"))
            self.assertEqual(0, result["changed_count"])

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


class MdxRepairValidationWorkflowTests(unittest.TestCase):
    """STORY-05: independent CI validation sub-pipeline structure contract."""

    def _workflow_text(self) -> str:
        return (REPO_ROOT / ".github/workflows/mdx-repair-validation.yml").read_text(encoding="utf-8")

    def _dispatch_block(self, text: str) -> str:
        match = re.search(r"(?ms)^  workflow_dispatch:\n.*?(?=^  workflow_call:)", text)
        self.assertIsNotNone(match)
        assert match is not None
        return match.group(0)

    def _workflow_call_block(self, text: str) -> str:
        match = re.search(r"(?ms)^  workflow_call:\n.*?(?=^run-name:)", text)
        self.assertIsNotNone(match)
        assert match is not None
        return match.group(0)

    def _offline_job_block(self, text: str) -> str:
        match = re.search(r"(?ms)^  offline-validation:\n.*?(?=^  [A-Za-z0-9_-]+:\n)", text)
        self.assertIsNotNone(match)
        assert match is not None
        return match.group(0)

    def _real_job_block(self, text: str) -> str:
        match = re.search(r"(?ms)^  real-codex-relay:\n.*", text)
        self.assertIsNotNone(match)
        assert match is not None
        return match.group(0)

    def test_validation_workflow_supports_dispatch_and_reuse_with_real_codex_default_off(self) -> None:
        text = self._workflow_text()
        self.assertIn("workflow_dispatch:", text)
        self.assertIn("workflow_call:", text)
        dispatch = self._dispatch_block(text)
        reusable = self._workflow_call_block(text)
        for block in (dispatch, reusable):
            self.assertIn("real_codex:", block)
            self.assertIn("default: false", block)
        # auxiliary_mode is fixed to none: dispatch offers a single-choice
        # list, and reusable callers get a fail-closed guard at runtime.
        self.assertIn("type: choice", dispatch)
        options = re.search(r"(?ms)auxiliary_mode:\n.*?options:\n((?:\s+- [^\n]+\n)+)", dispatch)
        self.assertIsNotNone(options)
        assert options is not None
        option_values = [line.strip("- \n") for line in options.group(1).splitlines() if line.strip()]
        self.assertEqual(["none"], option_values)
        self.assertIn("auxiliary_mode:", reusable)
        self.assertIn("default: none", reusable)

    def test_validation_workflow_keeps_single_entry_bounded_relay(self) -> None:
        text = self._workflow_text()

        # D-10 budgets mirror the production relay; auxiliary stays none.
        self.assertIn('MDX_REPAIR_MAX_ATTEMPTS: "4"', text)
        self.assertIn('MDX_REPAIR_HARD_TIMEOUT_MS: "600000"', text)
        self.assertIn('MDX_REPAIR_AUXILIARY_MODE: "none"', text)

        # Exactly one Agent entry, unrolled into at most MAX_ATTEMPTS rounds
        # with the identical production parameter protocol; no second Codex
        # executor and no direct model API call exists anywhere.
        self.assertEqual(4, text.count("uses: openai/codex-action@v1"))
        self.assertEqual(4, text.count("timeout-minutes: 12\n"))
        self.assertEqual(4, text.count("prompt-file: .openclaw-sync/docs-mdx-repair.md"))
        self.assertEqual(4, text.count("model: gpt-5.6"))
        self.assertEqual(4, text.count("effort: xhigh"))
        # No legacy --full-auto CLI flag: sandbox/approval semantics are
        # carried by the codex-action inputs themselves (sandbox,
        # safety-strategy), keeping the CLI call surface at the production
        # minimum (codex 0.146.1 rejects --full-auto).
        self.assertNotIn("full-auto", text)
        self.assertEqual(4, text.count("sandbox: workspace-write"))
        self.assertEqual(4, text.count("safety-strategy: drop-sudo"))
        self.assertNotIn("codex exec", text)
        self.assertNotIn("api.openai.com", text)

        # Contract stage order: preflight -> staging -> strict check -> relay
        # decision -> scope snapshot -> per-round (repair -> enforce scope ->
        # recheck) -> report -> classification.
        order = [
            "Preflight agent credentials",
            "Stage frozen fixture workspace",
            "Check translated MDX",
            "Decide MDX repair relay",
            "Snapshot translated MDX repair scope",
            "Repair translated MDX\n",
            "Enforce translated MDX repair scope\n",
            "Recheck translated MDX\n",
            "Repair translated MDX (relay round 2)",
            "Enforce translated MDX repair scope (relay round 2)",
            "Recheck translated MDX (relay round 2)",
            "Repair translated MDX (relay round 3)",
            "Enforce translated MDX repair scope (relay round 3)",
            "Recheck translated MDX (relay round 3)",
            "Repair translated MDX (relay round 4)",
            "Enforce translated MDX repair scope (relay round 4)",
            "Recheck translated MDX (relay round 4)",
            "Record MDX repair relay outcome",
            "Classify validation outcome",
        ]
        positions = [text.index(name) for name in order]
        self.assertEqual(sorted(positions), positions)

        # Relay stop conditions: round N+1 only runs when round N's recheck
        # still failed, so retries are bounded and diagnostics stay current.
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 1", text)
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 2", text)
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 3", text)
        self.assertIn("env.MDX_REPAIR_MAX_ATTEMPTS >= 4", text)
        self.assertIn("steps.mdx_repair.outcome == 'success' &&\n          steps.mdx_scope.outcome == 'success' && steps.mdx_recheck.outcome == 'failure'", text)
        self.assertIn("steps.mdx_repair_2.outcome == 'success' &&\n          steps.mdx_scope_2.outcome == 'success' && steps.mdx_recheck_2.outcome == 'failure'", text)
        self.assertIn("steps.mdx_repair_3.outcome == 'success' &&\n          steps.mdx_scope_3.outcome == 'success' && steps.mdx_recheck_3.outcome == 'failure'", text)

        # Every relay round keeps the scope and strict recheck gates; the
        # scope baseline is snapshotted once before the first repair round.
        self.assertEqual(4, text.count("mdx_repair_scope.py enforce"))
        self.assertEqual(1, text.count("mdx_repair_scope.py snapshot"))
        self.assertEqual(5, text.count("node .openclaw-sync/check-docs-mdx.mjs"))
        self.assertIn('python .github/scripts/i18n/mdx_repair_relay.py decide', text)
        self.assertIn('python .github/scripts/i18n/mdx_repair_relay.py report', text)

        # Twelve outcome tokens: three per relay round.
        self.assertEqual(12, text.count("|| 'skipped' }}"))

    def test_validation_workflow_is_read_only_and_publish_free(self) -> None:
        text = self._workflow_text()
        self.assertRegex(text, r"(?m)^permissions:\n  contents: read\n")
        self.assertNotIn("contents: write", text)
        self.assertNotIn("actions: write", text)
        self.assertNotIn("git push", text)
        self.assertNotIn("git commit", text)
        self.assertNotIn("commit_locale_artifact", text)
        self.assertNotIn("dispatch_r2_pages", text)
        self.assertNotIn("apply_artifacts", text)
        self.assertNotIn("package_artifact", text)
        self.assertNotIn("persist-credentials: true", text)
        self.assertEqual(2, text.count("persist-credentials: false"))

    def test_validation_workflow_offline_job_needs_no_secrets_and_real_job_is_opt_in(self) -> None:
        text = self._workflow_text()
        offline = self._offline_job_block(text)
        self.assertNotIn("secrets.", offline)
        real = self._real_job_block(text)
        self.assertIn("needs: offline-validation", real)
        self.assertIn("if: inputs.real_codex == true", real)
        # Environment failures are preflighted before any repair round so the
        # three-state classification can never disguise them as results.
        self.assertIn("Preflight agent credentials", real)
        # Staging, strict check, relay decision, and the scope snapshot all
        # stay gated on the preflight outcome.
        self.assertEqual(
            3,
            real.count("steps.preflight.outputs.provider_preflight == 'ok' && steps.mdx_check.outcome == 'failure'"),
        )
        round_blocks = re.findall(r"(?ms)^      - name: Repair translated MDX.*?(?=^      - name:)", real)
        self.assertEqual(4, len(round_blocks))
        for block in round_blocks:
            self.assertIn("uses: openai/codex-action@v1", block)
            self.assertIn("steps.preflight.outputs.provider_preflight == 'ok'", block)
            self.assertIn("steps.mdx_check.outcome == 'failure'", block)
            self.assertIn("steps.mdx_relay.outputs.decision == 'run'", block)
            self.assertIn("timeout-minutes: 12", block)
            self.assertIn("continue-on-error: true", block)
        self.assertIn("provider_preflight.py", real)

    def test_validation_workflow_installs_production_toolchain_and_offline_gates(self) -> None:
        text = self._workflow_text()
        self.assertIn("npm install -g @openai/codex@0.146.1", text)
        self.assertIn("node-version: 22", text)
        self.assertIn("@mdx-js/mdx@3.1.1", text)
        self.assertIn("python .github/scripts/i18n/tests/test_i18n_scripts.py", text)
        self.assertIn("(cd tools/mdx-fallback-lab && npm test)", text)
        self.assertIn("mdx_repair_validation.py oracle-gate", text)
        self.assertIn("mdx_repair_validation.py single-entry", text)
        self.assertIn("fixture-manifest.json", text)

    def test_validation_workflow_enforces_auxiliary_fail_closed(self) -> None:
        text = self._workflow_text()
        self.assertEqual(2, text.count("Enforce auxiliary mode fail-closed"))
        self.assertEqual(2, text.count("AUXILIARY_MODE_INPUT: ${{ inputs.auxiliary_mode }}"))
        self.assertIn("is not enabled; the validation pipeline is fail-closed", text)

    def test_validation_workflow_uploads_evidence_and_gates_on_classification(self) -> None:
        text = self._workflow_text()
        self.assertIn("name: mdx-repair-validation-offline-${{ github.run_id }}", text)
        self.assertIn("name: mdx-repair-validation-real-codex-${{ github.run_id }}", text)
        self.assertEqual(2, text.count("retention-days: 14"))
        self.assertEqual(3, text.count("if: always()\n"))
        self.assertIn("if: always() && steps.classify.outputs.classification != 'success'", text)
        self.assertIn("mdx_repair_validation.py classify", text)
        self.assertIn("steps.classify.outputs.classification != 'success'", text)

    def test_validation_workflow_single_entry_audit_passes_on_current_workflow(self) -> None:
        report = mdx_repair_validation.single_entry_report(
            REPO_ROOT / ".github/workflows/mdx-repair-validation.yml"
        )
        self.assertTrue(report["passed"])
        self.assertEqual(4, report["rounds_budget"])
        self.assertEqual(4, report["action_count"])
        self.assertEqual(4, report["prompt_count"])
        self.assertEqual([], report["second_executor_tokens"])

    def test_validation_workflow_single_entry_audit_rejects_second_executor(self) -> None:
        workflow = REPO_ROOT / ".github/workflows/mdx-repair-validation.yml"
        with tempfile.TemporaryDirectory() as tmp:
            mutated = Path(tmp) / "mutated.yml"
            mutated.write_text(
                workflow.read_text(encoding="utf-8") + "      - run: codex exec --dangerously-bypass\n",
                encoding="utf-8",
            )
            report = mdx_repair_validation.single_entry_report(mutated)
            self.assertFalse(report["passed"])
            self.assertIn("codex exec", report["second_executor_tokens"])

            extra_round = Path(tmp) / "extra-round.yml"
            extra_round.write_text(
                workflow.read_text(encoding="utf-8").replace(
                    'MDX_REPAIR_MAX_ATTEMPTS: "4"', 'MDX_REPAIR_MAX_ATTEMPTS: "5"'
                ),
                encoding="utf-8",
            )
            report = mdx_repair_validation.single_entry_report(extra_round)
            self.assertFalse(report["passed"])
            self.assertEqual(5, report["rounds_budget"])
            self.assertEqual(4, report["action_count"])

    def test_oracle_gate_expectations_come_from_frozen_fixture_manifest(self) -> None:
        expectations = mdx_repair_validation.load_fixture_expectations()
        self.assertEqual(2, len(expectations))
        by_id = {str(entry["fixture_id"]): entry for entry in expectations}
        html_comment = by_id["real-27629404260-zhcn-plugin-html-comment"]
        taxonomy = by_id["real-27629404260-zhcn-taxonomy-stray-close"]
        self.assertEqual("micromark-extension-mdx-jsx", html_comment["expected"]["source"])
        self.assertEqual(29, html_comment["expected"]["line"])
        self.assertEqual("mdast-util-mdx-jsx", taxonomy["expected"]["source"])
        self.assertEqual(1075, taxonomy["expected"]["line"])
        self.assertTrue(str(html_comment["file"]).startswith(str(REPO_ROOT)))

    def test_oracle_expectation_match_requires_manifest_diagnostics_and_hash(self) -> None:
        expectation = {
            "expected": {"source": "mdast-util-mdx-jsx", "line": 1075, "column": 5, "offset": 114137},
            "content_sha256": "hash-a",
        }
        failing = {
            "outcome": "compile_failure",
            "sha256": "hash-a",
            "error": {"source": "mdast-util-mdx-jsx", "line": 1075, "column": 5, "offset": 114137},
        }
        self.assertTrue(mdx_repair_validation.oracle_expectation_matches(failing, expectation))
        drifting_hash = {**failing, "sha256": "hash-b"}
        self.assertFalse(mdx_repair_validation.oracle_expectation_matches(drifting_hash, expectation))
        passing = {**failing, "outcome": "compile_success"}
        self.assertFalse(mdx_repair_validation.oracle_expectation_matches(passing, expectation))
        wrong_span = {
            **failing,
            "error": {"source": "mdast-util-mdx-jsx", "line": 900, "column": 5, "offset": 1},
        }
        self.assertFalse(mdx_repair_validation.oracle_expectation_matches(wrong_span, expectation))

    def test_classify_verdict_covers_three_states(self) -> None:
        base = {
            "MDX_REPAIR_AUXILIARY_MODE": "none",
            "MDX_VALIDATION_PREFLIGHT": "ok",
            "MDX_VALIDATION_DECISION": "run",
            "MDX_VALIDATION_FINAL_OUTCOME": "success",
        }

        def verdict_with(**overrides: str) -> tuple[str, str]:
            with env({**base, **overrides}):  # type: ignore[arg-type]
                return mdx_repair_validation.classify_verdict()

        self.assertEqual(("success", "frozen_fixtures_pass_strict_recheck"), verdict_with())
        self.assertEqual(("agent_failure", "relay_final_failure"), verdict_with(MDX_VALIDATION_FINAL_OUTCOME="final_failure"))
        self.assertEqual(("agent_failure", "relay_partial_success"), verdict_with(MDX_VALIDATION_FINAL_OUTCOME="partial_success"))

        classification, reason = verdict_with(
            MDX_VALIDATION_PREFLIGHT="failed", MDX_VALIDATION_PREFLIGHT_CLASS="quota_exhausted"
        )
        self.assertEqual("environment_failure", classification)
        self.assertEqual("preflight_failed_quota_exhausted", reason)
        self.assertEqual(("environment_failure", "preflight_missing"), verdict_with(MDX_VALIDATION_PREFLIGHT="missing"))

        classification, reason = verdict_with(
            MDX_VALIDATION_DECISION="not_run",
            MDX_VALIDATION_NOT_RUN_REASON="no_mdx_compile_diagnostics",
            MDX_VALIDATION_FINAL_OUTCOME="unavailable",
        )
        self.assertEqual("environment_failure", classification)
        self.assertEqual("relay_not_started_no_mdx_compile_diagnostics", reason)

        classification, reason = verdict_with(MDX_VALIDATION_FINAL_OUTCOME="unavailable")
        self.assertEqual("environment_failure", classification)
        self.assertEqual("relay_outcome_unavailable", reason)

        classification, reason = verdict_with(MDX_REPAIR_AUXILIARY_MODE="prettier")
        self.assertEqual("environment_failure", classification)
        self.assertEqual("auxiliary_mode_prettier_not_enabled", reason)

    def test_classify_command_writes_report_evidence_and_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            mdx_dir = repo / ".openclaw-sync/mdx"
            mdx_dir.mkdir(parents=True)
            (mdx_dir / "zh-CN-round-1.json").write_text(
                json.dumps(
                    {
                        "errors": [
                            {
                                "type": "mdx",
                                "file": "docs/zh-CN/maturity/taxonomy.mdx",
                                "line": 1063,
                                "column": 5,
                                "message": "Unexpected closing tag `</div>`",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            (mdx_dir / "zh-CN-repair-report.json").write_text(
                json.dumps({"final_outcome": "final_failure", "rounds_history": [{"round": 1, "error_count": 1}]}),
                encoding="utf-8",
            )
            output = repo / "github-output.txt"
            evidence = repo / "evidence"
            with chdir(repo), env(
                {
                    "GITHUB_WORKSPACE": str(repo),
                    "GITHUB_OUTPUT": str(output),
                    "MDX_REPAIR_AUXILIARY_MODE": "none",
                    "MDX_VALIDATION_PREFLIGHT": "ok",
                    "MDX_VALIDATION_DECISION": "run",
                    "MDX_VALIDATION_FINAL_OUTCOME": "final_failure",
                    "MDX_VALIDATION_FAILURE_KIND": "compile_failed",
                    "MDX_VALIDATION_ROUNDS": "1",
                    "MDX_VALIDATION_FAILED_PATHS": "docs/zh-CN/maturity/taxonomy.mdx",
                }
            ):
                payload = mdx_repair_validation.classify_command(repo, "zh-CN", evidence)

            self.assertEqual("agent_failure", payload["classification"])
            report = json.loads((evidence / "classification.json").read_text(encoding="utf-8"))
            self.assertEqual("agent_failure", report["classification"])
            self.assertEqual("relay_final_failure", report["reason"])
            self.assertEqual(["docs/zh-CN/maturity/taxonomy.mdx"], report["relay"]["failed_paths"])
            self.assertEqual(1, report["relay"]["round_diagnostics"][0]["error_count"])
            self.assertEqual("final_failure", report["relay"]["report"]["final_outcome"])
            self.assertTrue((evidence / "relay/zh-CN-round-1.json").exists())
            self.assertTrue((evidence / "relay/zh-CN-repair-report.json").exists())
            self.assertIn("classification=agent_failure", output.read_text(encoding="utf-8"))
            self.assertIn("reason=relay_final_failure", output.read_text(encoding="utf-8"))

GHA_TOKEN_RE = re.compile(
    r"steps\.[A-Za-z0-9_]+\.outcome"
    r"|steps\.[A-Za-z0-9_]+\.outputs\.[A-Za-z0-9_]+"
    r"|env\.[A-Z0-9_]+"
    r"|inputs\.[a-z0-9_]+"
    r"|needs\.[a-z0-9-]+\.result"
)


def _gha_format(fmt: str, args: tuple[str, ...]) -> str:
    # Enough of GitHub's format() for the test expressions: {0}, {1}, ...
    # escaped as {{ }}.
    return re.sub(r"\{(\d)\}", lambda match: args[int(match.group(1))], fmt.replace("{{", "{").replace("}}", "}"))


def evaluate_gha_condition(expression: str, values: dict[str, object]) -> bool:
    """Evaluate a workflow `if:` expression for a fixed scenario (dry run)."""

    def substitute(match: "re.Match[str]") -> str:
        token = match.group(0)
        if token not in values:
            raise AssertionError(f"no scenario value for {token}")
        return repr(values[token])

    python = GHA_TOKEN_RE.sub(substitute, expression)
    python = python.replace("&&", " and ").replace("||", " or ")
    functions = {
        "true": True,
        "false": False,
        "contains": lambda haystack, needle: needle in haystack,
        "format": lambda fmt, *args: _gha_format(fmt, args),
        "replace": lambda value, old, new: str(value).replace(old, new),
        "always": lambda: True,
    }
    return bool(eval(python, {"__builtins__": {}}, functions))  # noqa: S307 - test-only expression evaluation


class MdxRepairCanaryRolloutTests(unittest.TestCase):
    """STORY-06: staged rollout wiring and the switch-off equivalence dry run."""

    RELAY_STEP_NAMES = [
        "Decide MDX repair relay",
        "Snapshot translated MDX repair scope",
        "Repair translated MDX",
        "Enforce translated MDX repair scope",
        "Recheck translated MDX",
        "Repair translated MDX (relay round 2)",
        "Enforce translated MDX repair scope (relay round 2)",
        "Recheck translated MDX (relay round 2)",
        "Repair translated MDX (relay round 3)",
        "Enforce translated MDX repair scope (relay round 3)",
        "Recheck translated MDX (relay round 3)",
        "Repair translated MDX (relay round 4)",
        "Enforce translated MDX repair scope (relay round 4)",
        "Recheck translated MDX (relay round 4)",
        "Record MDX repair relay outcome",
    ]
    CANARY_GUARD = " && env.MDX_REPAIR_CANARY_ENABLED == 'true'"

    def _workflow_text(self) -> str:
        return (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")

    def _job_text(self, text: str, job: str) -> str:
        match = re.search(rf"(?ms)^  {re.escape(job)}:\n.*?(?=^  [A-Za-z0-9_-]+:\n|\Z)", text)
        self.assertIsNotNone(match)
        assert match is not None
        return match.group(0)

    def _job_level_if(self, job_text: str, job: str) -> str:
        match = re.search(rf"(?ms)^  {re.escape(job)}:\n.*?^    if: >-\n((?:      [^\n]+\n)+)", job_text)
        self.assertIsNotNone(match, f"job {job} has no folded if")
        assert match is not None
        return " ".join(part.strip() for part in match.group(1).splitlines())

    def _parse_steps(self, job_text: str) -> list[dict[str, str]]:
        steps: list[dict[str, str]] = []
        for match in re.finditer(r"(?ms)^      - name: ([^\n]+)\n(.*?)(?=^      - name: |\Z)", job_text):
            block = match.group(2)
            id_match = re.search(r"^        id: ([A-Za-z0-9_]+)$", block, re.M)
            condition = ""
            cond_match = re.search(
                r"(?ms)^        if: >-\n((?:          [^\n]+\n)+)|^        if: ([^\n]+)$", block
            )
            if cond_match:
                folded, single = cond_match.group(1), cond_match.group(2)
                condition = " ".join(part.strip() for part in folded.splitlines()) if folded else single.strip()
            steps.append(
                {
                    "name": match.group(1).strip(),
                    "id": id_match.group(1) if id_match else "",
                    "if": condition,
                }
            )
        return steps

    def _pre_canary_steps(self, steps: list[dict[str, str]]) -> list[dict[str, str]]:
        """Model the workflow before the canary/relay chain: relay steps gone,
        guard tokens stripped from every remaining condition."""
        pre: list[dict[str, str]] = []
        for step in steps:
            if step["name"] in self.RELAY_STEP_NAMES:
                continue
            pre.append({**step, "if": step["if"].replace(self.CANARY_GUARD, "")})
        return pre

    def _run_plan(
        self,
        steps: list[dict[str, str]],
        static: dict[str, object],
        world_outcomes: dict[str, str],
        world_outputs: dict[str, dict[str, str]],
        start: str,
    ) -> list[str]:
        ids = sorted({step["id"] for step in steps if step["id"]})
        output_keys = sorted({key for outputs in world_outputs.values() for key in outputs})
        outcomes: dict[str, str] = {}
        outputs: dict[str, dict[str, str]] = {}
        executed: list[str] = []
        started = False
        for step in steps:
            if step["name"] == start:
                started = True
            if not started:
                continue
            values: dict[str, object] = dict(static)
            for step_id in ids:
                values.setdefault(f"steps.{step_id}.outcome", "skipped")
            for step_id, outcome in outcomes.items():
                values[f"steps.{step_id}.outcome"] = outcome
            for step_id in ids:
                for key in output_keys:
                    values.setdefault(f"steps.{step_id}.outputs.{key}", "")
            for step_id, step_outputs in outputs.items():
                for key, value in step_outputs.items():
                    values[f"steps.{step_id}.outputs.{key}"] = value
            ran = evaluate_gha_condition(step["if"], values) if step["if"] else True
            if ran:
                executed.append(step["name"])
                if step["id"]:
                    outcomes[step["id"]] = world_outcomes.get(step["id"], "success")
                    outputs[step["id"]] = world_outputs.get(step["id"], {})
            elif step["id"]:
                outcomes[step["id"]] = "skipped"
        return executed

    def _translate_static(self, canary_enabled: bool, gate_result: str) -> dict[str, object]:
        return {
            "steps.stale.outputs.skip": "false",
            "steps.pending.outputs.pending_count": "1",
            "steps.translate_docs.outcome": "success",
            "env.MDX_REPAIR_MAX_ATTEMPTS": 4,
            "env.MDX_REPAIR_CANARY_ENABLED": "true" if canary_enabled else "false",
            "inputs.canary_gate_failure_policy": "fallback",
            "needs.mdx-repair-gate.result": gate_result,
        }

    def test_canary_switch_inputs_default_to_original_failure_path(self) -> None:
        import yaml  # Preinstalled on GitHub runners; only used to mirror the dispatch/call input blocks.

        workflow = yaml.safe_load(self._workflow_text())
        triggers = workflow[True] if True in workflow else workflow["on"]
        self.assertEqual(["workflow_call", "workflow_dispatch"], sorted(triggers))
        call = triggers["workflow_call"]["inputs"]
        dispatch = triggers["workflow_dispatch"]["inputs"]
        self.assertEqual(sorted(call), sorted(dispatch))
        for name, spec in call.items():
            self.assertEqual(spec.get("default"), dispatch[name].get("default"), name)
            self.assertEqual(spec.get("type"), dispatch[name].get("type"), name)
        self.assertEqual(False, call["mdx_repair_enabled"]["default"])
        self.assertEqual("", call["canary_locales"]["default"])
        self.assertEqual("", call["canary_paths"]["default"])
        self.assertEqual("fallback", call["canary_gate_failure_policy"]["default"])
        self.assertEqual("boolean", call["mdx_repair_enabled"]["type"])

    def test_switch_off_dry_run_matches_pre_canary_failure_path(self) -> None:
        text = self._workflow_text()
        translate_steps = self._parse_steps(self._job_text(text, "translate"))
        current = [step for step in translate_steps if step["name"] != "Decide canary MDX repair scope"]
        pre_canary = self._pre_canary_steps(current)

        world_outcomes = {
            "mdx_check": "failure",
            "mdx_canary": "success",
            "mdx_relay": "success",
            "mdx_repair": "success",
            "mdx_scope": "success",
            "mdx_recheck": "success",
            "package": "success",
        }
        world_outputs = {
            "mdx_relay": {"decision": "run", "reason": ""},
            "mdx_repair_report": {"final_outcome": "success", "failed_paths": ""},
            "package": {"failed": "true", "failed_reason": "mdx repair failed"},
        }
        start = "Install docs MDX checker dependency"
        for canary_enabled, gate_result in ((False, "skipped"), (False, "failure")):
            executed = self._run_plan(
                current,
                self._translate_static(canary_enabled, gate_result),
                world_outcomes,
                world_outputs,
                start,
            )
            baseline = self._run_plan(
                pre_canary,
                self._translate_static(canary_enabled, gate_result),
                world_outcomes,
                world_outputs,
                start,
            )
            self.assertEqual(baseline, executed)
            self.assertNotIn("Decide canary MDX repair scope", executed)
            for relay_step in self.RELAY_STEP_NAMES:
                self.assertNotIn(relay_step, executed)
            self.assertEqual(
                [
                    "Install docs MDX checker dependency",
                    "Check translated MDX",
                    "Prepare locale artifact",
                    "Upload locale artifact",
                    "Fail failed locale artifact",
                ],
                executed,
            )

    def test_canary_enabled_dry_run_runs_bounded_relay(self) -> None:
        text = self._workflow_text()
        translate_steps = self._parse_steps(self._job_text(text, "translate"))
        current = [step for step in translate_steps if step["name"] != "Decide canary MDX repair scope"]
        world_outcomes = {
            "mdx_check": "failure",
            "mdx_relay": "success",
            "mdx_repair": "success",
            "mdx_scope": "success",
            "mdx_recheck": "success",
            "package": "success",
        }
        world_outputs = {
            "mdx_relay": {"decision": "run", "reason": ""},
            "mdx_repair_report": {"final_outcome": "success", "failed_paths": ""},
            "package": {"failed": "false", "failed_reason": ""},
        }
        executed = self._run_plan(
            current,
            self._translate_static(True, "success"),
            world_outcomes,
            world_outputs,
            "Install docs MDX checker dependency",
        )
        self.assertEqual(
            [
                "Install docs MDX checker dependency",
                "Check translated MDX",
                "Decide MDX repair relay",
                "Snapshot translated MDX repair scope",
                "Repair translated MDX",
                "Enforce translated MDX repair scope",
                "Recheck translated MDX",
                "Record MDX repair relay outcome",
                "Prepare locale artifact",
                "Upload locale artifact",
            ],
            executed,
        )
        # A passing first-round recheck keeps rounds 2..4 skipped, and the
        # failed-artifact step does not run because the relay rescued the
        # shard inside its gates.
        self.assertNotIn("Fail failed locale artifact", executed)
        self.assertNotIn("Repair translated MDX (relay round 2)", executed)

    def test_translate_job_waits_for_gate_and_keeps_default_path(self) -> None:
        translate_job = self._job_text(self._workflow_text(), "translate")
        self.assertIn("needs: mdx-repair-gate", translate_job)
        translate_if = self._job_level_if(translate_job, "translate")
        base = {"inputs.canary_gate_failure_policy": "fallback"}
        self.assertTrue(evaluate_gha_condition(translate_if, {**base, "needs.mdx-repair-gate.result": "skipped"}))
        self.assertTrue(evaluate_gha_condition(translate_if, {**base, "needs.mdx-repair-gate.result": "success"}))
        self.assertTrue(evaluate_gha_condition(translate_if, {**base, "needs.mdx-repair-gate.result": "failure"}))
        self.assertFalse(
            evaluate_gha_condition(
                translate_if,
                {
                    "inputs.canary_gate_failure_policy": "abort",
                    "needs.mdx-repair-gate.result": "failure",
                },
            )
        )
        self.assertFalse(
            evaluate_gha_condition(translate_if, {**base, "needs.mdx-repair-gate.result": "cancelled"})
        )

        decide = next(
            step for step in self._parse_steps(translate_job) if step["name"] == "Decide canary MDX repair scope"
        )
        self.assertEqual("mdx_canary", decide["id"])
        self.assertIn('python "${I18N_SCRIPT_DIR}/mdx_repair_canary.py" decide', translate_job)
        self.assertIn("MDX_REPAIR_GATE_RESULT: ${{ needs.mdx-repair-gate.result }}", translate_job)
        self.assertIn("MDX_REPAIR_ENABLED_INPUT: ${{ inputs.mdx_repair_enabled }}", translate_job)
        self.assertIn("CANARY_LOCALES: ${{ inputs.canary_locales }}", translate_job)
        self.assertIn("CANARY_PATHS: ${{ inputs.canary_paths }}", translate_job)
        # The decision step runs before translation so the guard variable is
        # available to every relay step condition.
        self.assertLess(
            translate_job.index("Decide canary MDX repair scope"),
            translate_job.index("Translate changed docs into locale"),
        )

    def test_gate_job_reuses_validation_subpipeline_fail_closed(self) -> None:
        gate_job = self._job_text(self._workflow_text(), "mdx-repair-gate")
        self.assertIn("uses: ./.github/workflows/mdx-repair-validation.yml", gate_job)
        self.assertIn("real_codex: true", gate_job)
        self.assertIn("secrets: inherit", gate_job)
        self.assertRegex(gate_job, r"(?ms)^    permissions:\n      contents: read\n")
        self.assertNotIn("timeout-minutes", gate_job)
        self.assertNotIn("codex exec", gate_job)
        gate_if = self._job_level_if(gate_job, "mdx-repair-gate")
        self.assertIn("inputs.mdx_repair_enabled == true", gate_if)
        # Exact token membership, not substring matching: zh-CN2 must not
        # enable zh-CN. canary_locales is a comma-separated list without
        # spaces so the expression-only gate check stays exact.
        self.assertIn(
            "contains(format(',{0},', inputs.canary_locales), format(',{0},', inputs.locale))",
            gate_if,
        )
        self.assertTrue(
            evaluate_gha_condition(
                gate_if,
                {
                    "inputs.mdx_repair_enabled": True,
                    "inputs.canary_locales": "zh-CN,ja-JP",
                    "inputs.locale": "zh-CN",
                },
            )
        )
        self.assertFalse(
            evaluate_gha_condition(
                gate_if,
                {
                    "inputs.mdx_repair_enabled": True,
                    "inputs.canary_locales": "zh-CN2,ja-JP",
                    "inputs.locale": "zh-CN",
                },
            )
        )
        self.assertFalse(
            evaluate_gha_condition(
                gate_if,
                {
                    "inputs.mdx_repair_enabled": False,
                    "inputs.canary_locales": "zh-CN",
                    "inputs.locale": "zh-CN",
                },
            )
        )

    def test_finalize_consumes_gate_before_publish_and_stays_default_when_off(self) -> None:
        text = self._workflow_text()
        commit_job = self._job_text(text, "commit-locale")
        commit_if = self._job_level_if(commit_job, "commit-locale")
        original_if = (
            "needs.translate.result == 'success' && "
            "(inputs.commit_locale || (inputs.artifact_role == 'canary' && inputs.canary_publish_required))"
        )
        combos = [
            {"inputs.commit_locale": False, "inputs.artifact_role": "locale", "inputs.canary_publish_required": False},
            {"inputs.commit_locale": True, "inputs.artifact_role": "locale", "inputs.canary_publish_required": False},
            {"inputs.commit_locale": False, "inputs.artifact_role": "canary", "inputs.canary_publish_required": True},
            {"inputs.commit_locale": False, "inputs.artifact_role": "canary", "inputs.canary_publish_required": False},
        ]
        for combo in combos:
            combo = {**combo, "needs.translate.result": "success"}
            skipped_gate = {
                **combo,
                "needs.translate.result": "success",
                "needs.mdx-repair-gate.result": "skipped",
                "inputs.canary_gate_failure_policy": "fallback",
            }
            # Switch off: the new finalize condition must accept exactly the
            # same publishes as the pre-canary condition.
            self.assertEqual(
                evaluate_gha_condition(original_if, combo),
                evaluate_gha_condition(commit_if, skipped_gate),
                combo,
            )
            aborted_gate = {
                **combo,
                "needs.translate.result": "success",
                "needs.mdx-repair-gate.result": "failure",
                "inputs.canary_gate_failure_policy": "abort",
            }
            self.assertFalse(evaluate_gha_condition(commit_if, aborted_gate))
        fallback_gate = {
            "inputs.commit_locale": True,
            "inputs.artifact_role": "locale",
            "inputs.canary_publish_required": False,
            "needs.translate.result": "success",
            "needs.mdx-repair-gate.result": "failure",
            "inputs.canary_gate_failure_policy": "fallback",
        }
        self.assertTrue(evaluate_gha_condition(commit_if, fallback_gate))
        self.assertFalse(
            evaluate_gha_condition(commit_if, {**fallback_gate, "needs.translate.result": "failure"})
        )

        self.assertIn("needs:\n      - translate\n      - mdx-repair-gate", commit_job)
        # Gate consumption happens before commit/dispatch, so abort fails
        # before anything is published.
        self.assertLess(
            commit_job.index("Consume MDX repair release gate"), commit_job.index("Commit locale refresh")
        )
        self.assertLess(
            commit_job.index("Consume MDX repair release gate"), commit_job.index("Dispatch locale docs deploy")
        )
        self.assertIn("name: mdx-repair-validation-real-codex-${{ github.run_id }}", commit_job)
        self.assertIn('python "${I18N_SCRIPT_DIR}/mdx_repair_canary.py" gate', commit_job)
        self.assertIn("MDX_REPAIR_GATE_RESULT: ${{ needs.mdx-repair-gate.result }}", commit_job)

        # Switch off: none of the new finalize steps run.
        static = {
            "inputs.commit_locale": True,
            "inputs.artifact_role": "locale",
            "inputs.canary_publish_required": False,
            "inputs.mdx_repair_enabled": False,
            "inputs.canary_gate_failure_policy": "fallback",
            "needs.translate.result": "success",
            "needs.mdx-repair-gate.result": "skipped",
        }
        world_outputs = {
            "apply": {"changed_count": "1", "incomplete_count": "0"},
            "locale_commit": {"committed": "true"},
        }
        executed = self._run_plan(
            self._parse_steps(commit_job),
            static,
            {"apply": "success", "locale_commit": "success"},
            world_outputs,
            "Apply locale artifact",
        )
        for new_step in (
            "Download MDX repair validation evidence",
            "Consume MDX repair release gate",
            "Verify canary R2 content against artifact",
            "Record canary release summary",
            "Upload canary release summary evidence",
        ):
            self.assertNotIn(new_step, executed)
        self.assertIn("Commit locale refresh", executed)
        self.assertIn("Dispatch locale docs deploy", executed)

    def test_canary_finalize_steps_run_only_for_enabled_canary(self) -> None:
        commit_job = self._job_text(self._workflow_text(), "commit-locale")
        static = {
            "inputs.commit_locale": False,
            "inputs.artifact_role": "canary",
            "inputs.canary_publish_required": True,
            "inputs.mdx_repair_enabled": True,
            "inputs.canary_gate_failure_policy": "fallback",
            "needs.translate.result": "success",
            "needs.mdx-repair-gate.result": "success",
            "steps.locale_commit.outputs.committed": "",
        }
        world_outputs = {"apply": {"changed_count": "1", "incomplete_count": "0"}}
        executed = self._run_plan(
            self._parse_steps(commit_job),
            static,
            {
                "apply": "success",
                "mdx_release_gate": "success",
                "r2_smoke": "success",
                "release_summary": "success",
            },
            world_outputs,
            "Check out latest main",
        )
        for new_step in (
            "Download MDX repair validation evidence",
            "Consume MDX repair release gate",
            "Verify canary R2 content against artifact",
            "Record canary release summary",
            "Upload canary release summary evidence",
        ):
            self.assertIn(new_step, executed)
        self.assertIn("Dispatch locale docs deploy", executed)
        self.assertIn('python "${I18N_SCRIPT_DIR}/mdx_repair_canary.py" r2-smoke', commit_job)
        self.assertIn('python "${I18N_SCRIPT_DIR}/mdx_repair_canary.py" summary', commit_job)
        self.assertIn("canary-release-summary-${{ inputs.locale_slug }}", commit_job)
        self.assertIn("retention-days: 14", commit_job)

    def test_every_relay_step_condition_carries_canary_guard(self) -> None:
        translate_job = self._job_text(self._workflow_text(), "translate")
        by_name = {step["name"]: step for step in self._parse_steps(translate_job)}
        for relay_step in self.RELAY_STEP_NAMES:
            self.assertIn(self.CANARY_GUARD, by_name[relay_step]["if"], relay_step)
        guarded = [step for step in self._parse_steps(translate_job) if self.CANARY_GUARD in step["if"]]
        self.assertEqual(
            sorted(self.RELAY_STEP_NAMES),
            sorted(step["name"] for step in guarded),
        )
        # The strict check and packaging belong to the original path and are
        # never gated by the canary.
        self.assertNotIn(self.CANARY_GUARD, by_name["Check translated MDX"]["if"])
        self.assertNotIn(self.CANARY_GUARD, by_name["Prepare locale artifact"]["if"])


class MdxRepairCanaryTests(unittest.TestCase):
    """STORY-06: canary switch, RELEASE gate, release summary, and R2 smoke."""

    def _decide(
        self, repo: Path, manifest_pages: list[str] | None = None, **overrides: str
    ) -> tuple[dict[str, object], str, str]:
        output = repo / "github-output.txt"
        env_file = repo / "github-env.txt"
        values = {
            "LOCALE": "zh-CN",
            "LOCALE_SLUG": "zh-CN",
            "SHARD_INDEX": "0",
            "SHARD_TOTAL": "1",
            "MDX_REPAIR_ENABLED_INPUT": "false",
            "CANARY_LOCALES": "",
            "CANARY_PATHS": "",
            "CANARY_GATE_FAILURE_POLICY": "fallback",
            "MDX_REPAIR_GATE_RESULT": "skipped",
            "GITHUB_OUTPUT": str(output),
            "GITHUB_ENV": str(env_file),
        }
        values.update(overrides)
        if manifest_pages is not None:
            manifest = repo / ".openclaw-sync/docs-i18n-zh-CN-s0of1.txt"
            manifest.parent.mkdir(parents=True, exist_ok=True)
            manifest.write_text("".join(f"{repo / page}\n" for page in manifest_pages), encoding="utf-8")
        with chdir(repo), env(values):  # type: ignore[arg-type]
            mdx_repair_canary.decide_command(repo)
        decision = json.loads(
            (repo / ".openclaw-sync/mdx/zh-CN-canary-decision.json").read_text(encoding="utf-8")
        )
        return decision, output.read_text(encoding="utf-8"), env_file.read_text(encoding="utf-8")

    def test_decide_switch_off_records_original_failure_path(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            decision, output, env_file = self._decide(repo, MDX_REPAIR_ENABLED_INPUT="false")
            self.assertFalse(decision["enabled"])
            self.assertEqual("switch_off", decision["reason"])
            self.assertIn("enabled=false", output)
            self.assertIn(f"{mdx_repair_canary.CANARY_ENV_VAR}=false", env_file)

    def test_decide_requires_filled_whitelists(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            pages = ["docs/channels/line.md"]
            decision, _, _ = self._decide(
                repo, manifest_pages=pages, MDX_REPAIR_ENABLED_INPUT="true", CANARY_LOCALES=""
            )
            self.assertEqual("canary_locales_empty", decision["reason"])

            decision, _, _ = self._decide(
                repo,
                manifest_pages=pages,
                MDX_REPAIR_ENABLED_INPUT="true",
                CANARY_LOCALES="ja-JP",
                CANARY_PATHS="channels",
            )
            self.assertEqual("locale_not_in_canary_scope", decision["reason"])

            decision, _, _ = self._decide(
                repo,
                manifest_pages=pages,
                MDX_REPAIR_ENABLED_INPUT="true",
                CANARY_LOCALES="zh-CN",
                CANARY_PATHS="",
            )
            self.assertEqual("canary_paths_empty", decision["reason"])

    def test_decide_locale_membership_is_exact_token(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            pages = ["docs/channels/line.md"]
            # Substring traps (zh-CN inside zh-CN2) must not enable the canary.
            decision, _, _ = self._decide(
                repo,
                manifest_pages=pages,
                MDX_REPAIR_ENABLED_INPUT="true",
                CANARY_LOCALES="zh-CN2",
                CANARY_PATHS="channels",
                MDX_REPAIR_GATE_RESULT="success",
            )
            self.assertEqual("locale_not_in_canary_scope", decision["reason"])

            decision, output, env_file = self._decide(
                repo,
                manifest_pages=pages,
                MDX_REPAIR_ENABLED_INPUT="true",
                CANARY_LOCALES="zh-CN, ja-JP",
                CANARY_PATHS="channels",
                MDX_REPAIR_GATE_RESULT="success",
            )
            self.assertTrue(decision["enabled"])
            self.assertEqual("canary_enabled", decision["reason"])
            self.assertIn("enabled=true", output)
            self.assertIn(f"{mdx_repair_canary.CANARY_ENV_VAR}=true", env_file)

    def test_decide_rejects_pending_pages_outside_canary_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            decision, _, _ = self._decide(
                repo,
                manifest_pages=["docs/channels/line.md", "docs/guide/other.md"],
                MDX_REPAIR_ENABLED_INPUT="true",
                CANARY_LOCALES="zh-CN",
                CANARY_PATHS="channels",
                MDX_REPAIR_GATE_RESULT="success",
            )
            self.assertFalse(decision["enabled"])
            self.assertTrue(str(decision["reason"]).startswith("pending_paths_outside_canary_scope"))
            self.assertIn("docs/zh-CN/guide/other.md", decision["pending_pages_outside_canary_scope"])

            # Directory prefixes and exact file paths both stay inside scope.
            decision, _, _ = self._decide(
                repo,
                manifest_pages=["docs/channels/line.md", "docs/channels/sub/page.md"],
                MDX_REPAIR_ENABLED_INPUT="true",
                CANARY_LOCALES="zh-CN",
                CANARY_PATHS="channels channels/line.md",
                MDX_REPAIR_GATE_RESULT="success",
            )
            self.assertTrue(decision["enabled"])

    def test_decide_requires_validation_gate_success(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            base = {
                "manifest_pages": ["docs/channels/line.md"],
                "MDX_REPAIR_ENABLED_INPUT": "true",
                "CANARY_LOCALES": "zh-CN",
                "CANARY_PATHS": "channels/line.md",
            }
            decision, _, env_file = self._decide(repo, **base, MDX_REPAIR_GATE_RESULT="success")
            self.assertTrue(decision["enabled"])
            self.assertIn(f"{mdx_repair_canary.CANARY_ENV_VAR}=true", env_file)

            decision, _, _ = self._decide(repo, **base, MDX_REPAIR_GATE_RESULT="failure")
            self.assertFalse(decision["enabled"])
            self.assertEqual("validation_gate_failure", decision["reason"])

            decision, _, _ = self._decide(repo, **base, MDX_REPAIR_GATE_RESULT="cancelled")
            self.assertFalse(decision["enabled"])
            self.assertEqual("validation_gate_cancelled", decision["reason"])

    def test_decide_invalid_policy_fails_closed_only_when_switch_on(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            decision, _, _ = self._decide(repo, CANARY_GATE_FAILURE_POLICY="yolo")
            self.assertEqual("switch_off", decision["reason"])

            with self.assertRaisesRegex(SystemExit, "CANARY_GATE_FAILURE_POLICY"):
                self._decide(
                    repo,
                    manifest_pages=["docs/channels/line.md"],
                    MDX_REPAIR_ENABLED_INPUT="true",
                    CANARY_LOCALES="zh-CN",
                    CANARY_PATHS="channels",
                    CANARY_GATE_FAILURE_POLICY="yolo",
                )

    def _gate(self, repo: Path, evidence: dict[str, object] | None, **overrides: str) -> tuple[dict[str, object], str]:
        output = repo / "github-output.txt"
        evidence_dir = repo / ".openclaw-sync/mdx-repair-gate"
        evidence_dir.mkdir(parents=True, exist_ok=True)
        classification = evidence_dir / "classification.json"
        if evidence is not None:
            classification.write_text(json.dumps(evidence), encoding="utf-8")
        else:
            classification.unlink(missing_ok=True)
        values = {
            "MDX_REPAIR_GATE_RESULT": "success",
            "CANARY_GATE_FAILURE_POLICY": "fallback",
            "GITHUB_OUTPUT": str(output),
        }
        values.update(overrides)
        with chdir(repo), env(values):  # type: ignore[arg-type]
            mdx_repair_canary.gate_command(evidence_dir)
        record = json.loads((evidence_dir / "gate-decision.json").read_text(encoding="utf-8"))
        return record, output.read_text(encoding="utf-8")

    def test_gate_passes_only_with_success_classification(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            record, output = self._gate(
                repo, {"classification": "success", "reason": "frozen_fixtures_pass_strict_recheck"}
            )
            self.assertEqual("pass", record["gate_decision"])
            self.assertEqual("success", record["classification"])
            self.assertIn("gate_decision=pass", output)

            with self.assertRaisesRegex(SystemExit, "classification evidence is missing"):
                self._gate(repo, None)

            with self.assertRaisesRegex(SystemExit, "classification evidence says agent_failure"):
                self._gate(repo, {"classification": "agent_failure", "reason": "relay_final_failure"})

    def test_gate_fallback_records_and_continues(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            record, output = self._gate(
                repo,
                {"classification": "agent_failure", "reason": "relay_final_failure"},
                MDX_REPAIR_GATE_RESULT="failure",
                CANARY_GATE_FAILURE_POLICY="fallback",
            )
            self.assertEqual("fallback", record["gate_decision"])
            self.assertEqual("agent_failure", record["classification"])
            self.assertIn("gate_decision=fallback", output)
            self.assertIn("classification=agent_failure", output)

            record, _ = self._gate(
                repo,
                {"classification": "environment_failure", "reason": "preflight_failed_quota_exhausted"},
                MDX_REPAIR_GATE_RESULT="failure",
                CANARY_GATE_FAILURE_POLICY="fallback",
            )
            self.assertEqual("environment_failure", record["classification"])

            # A failed gate without evidence still records the decision.
            record, _ = self._gate(repo, None, MDX_REPAIR_GATE_RESULT="failure")
            self.assertEqual("fallback", record["gate_decision"])
            self.assertEqual("unknown", record["classification"])
            self.assertEqual("classification_evidence_missing", record["reason"])

            # Evidence contradicting the failed gate result fails closed.
            with self.assertRaisesRegex(SystemExit, "classification evidence says success"):
                self._gate(repo, {"classification": "success"}, MDX_REPAIR_GATE_RESULT="failure")

    def test_gate_abort_records_before_failing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            output = repo / "github-output.txt"
            evidence_dir = repo / ".openclaw-sync/mdx-repair-gate"
            evidence_dir.mkdir(parents=True)
            (evidence_dir / "classification.json").write_text(
                json.dumps({"classification": "environment_failure", "reason": "preflight_failed_quota"}),
                encoding="utf-8",
            )
            with chdir(repo), env(
                {
                    "MDX_REPAIR_GATE_RESULT": "failure",
                    "CANARY_GATE_FAILURE_POLICY": "abort",
                    "GITHUB_OUTPUT": str(output),
                }
            ):
                with self.assertRaisesRegex(SystemExit, "canary aborted"):
                    mdx_repair_canary.gate_command(evidence_dir)
            record = json.loads((evidence_dir / "gate-decision.json").read_text(encoding="utf-8"))
            self.assertEqual("abort", record["gate_decision"])
            self.assertIn("gate_decision=abort", output.read_text(encoding="utf-8"))

    def test_gate_skipped_when_canary_off(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            record, output = self._gate(repo, None, MDX_REPAIR_GATE_RESULT="skipped")
            self.assertEqual("not_applicable", record["gate_decision"])
            self.assertIn("gate_decision=not_applicable", output)

    def _summary(self, repo: Path, artifact: dict[str, object], **overrides: str) -> tuple[dict[str, object], str]:
        artifact_dir = repo / ".openclaw-sync/i18n-artifacts/zh-CN-s0of1"
        artifact_dir.mkdir(parents=True, exist_ok=True)
        (artifact_dir / "metadata.json").write_text(json.dumps(artifact), encoding="utf-8")
        summary_file = repo / "step-summary.md"
        values = {
            "LOCALE": "zh-CN",
            "LOCALE_SLUG": "zh-CN",
            "SHARD_INDEX": "0",
            "SHARD_TOTAL": "1",
            "ARTIFACT_ROLE": "canary",
            "GATE_DECISION": "pass",
            "GATE_CLASSIFICATION": "success",
            "GATE_REASON": "validation_classification_success",
            "CANARY_GATE_FAILURE_POLICY": "fallback",
            "R2_SMOKE_OUTCOME": "verified",
            "R2_SMOKE_REASON": "live_h1_matches_artifact",
            "R2_SMOKE_EXPECTED_H1": "LINE",
            "PAGES_DISPATCH_WAITED": "true",
            "GITHUB_STEP_SUMMARY": str(summary_file),
        }
        values.update(overrides)
        with chdir(repo), env(values):  # type: ignore[arg-type]
            mdx_repair_canary.summary_command(artifact_dir, repo)
        record = json.loads(
            (repo / ".openclaw-sync/canary-release-summary-zh-CN-s0of1.json").read_text(encoding="utf-8")
        )
        return record, summary_file.read_text(encoding="utf-8")

    def test_summary_lists_ac03_sections_and_clean_integrity(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            artifact = {
                "mdx_repair_mode": "relay",
                "mdx_repair_rounds": 2,
                "mdx_repair_final_outcome": "success",
                "mdx_repair_changed_paths": ["docs/zh-CN/channels/line.md"],
                "mdx_repair_failed_paths": [],
                "failed_reason": "",
            }
            report = {
                "repair_mode": "relay",
                "rounds": 2,
                "final_outcome": "success",
                "failure_kind": "none",
                "changed_paths": [{"path": "docs/zh-CN/channels/line.md"}],
                "failed_paths": [],
                "violations": [],
            }
            (repo / ".openclaw-sync/i18n-artifacts/zh-CN-s0of1").mkdir(parents=True)
            (repo / ".openclaw-sync/i18n-artifacts/zh-CN-s0of1/mdx-repair-report.json").write_text(
                json.dumps(report), encoding="utf-8"
            )
            record, markdown = self._summary(repo, artifact)
            self.assertEqual("relay", record["repair"]["repair_mode"])
            self.assertEqual(2, record["repair"]["rounds"])
            self.assertEqual(["docs/zh-CN/channels/line.md"], record["repair"]["repaired_pages"])
            self.assertEqual([], record["repair"]["checker_intercepted_pages"])
            self.assertEqual([], record["repair"]["failed_pages"])
            self.assertEqual([], record["remaining_risks"])
            self.assertEqual("verified", record["publish_integrity"]["r2_content"]["outcome"])
            for fragment in (
                "release gate: `pass`",
                "Codex repaired pages: `docs/zh-CN/channels/line.md`",
                "checker intercepted pages: none",
                "failed pages: none",
                "remaining risks: none recorded",
                "R2 content=`verified`",
            ):
                self.assertIn(fragment, markdown)

    def test_summary_reports_failed_checker_intercepted_and_risk_tokens(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            artifact = {
                "mdx_repair_mode": "relay",
                "mdx_repair_rounds": 4,
                "mdx_repair_final_outcome": "final_failure",
                "mdx_repair_changed_paths": [],
                "mdx_repair_failed_paths": ["docs/zh-CN/maturity/taxonomy.md"],
                "failed_reason": "mdx repair failed",
            }
            report = {
                "repair_mode": "relay",
                "rounds": 4,
                "final_outcome": "final_failure",
                "failure_kind": "content_loss",
                "changed_paths": [],
                "failed_paths": [{"path": "docs/zh-CN/maturity/taxonomy.md"}],
                "violations": [
                    {"gate": "checker", "code": "whole_document_deleted", "path": "docs/zh-CN/maturity/taxonomy.md"}
                ],
            }
            (repo / ".openclaw-sync/i18n-artifacts/zh-CN-s0of1").mkdir(parents=True)
            (repo / ".openclaw-sync/i18n-artifacts/zh-CN-s0of1/mdx-repair-report.json").write_text(
                json.dumps(report), encoding="utf-8"
            )
            record, markdown = self._summary(
                repo,
                artifact,
                GATE_DECISION="fallback",
                GATE_CLASSIFICATION="agent_failure",
                GATE_REASON="relay_final_failure",
                R2_SMOKE_OUTCOME="",
                R2_SMOKE_REASON="dispatch_no_wait_final_publication_covered_by_locale_full_deploys",
                PAGES_DISPATCH_WAITED="false",
            )
            self.assertEqual(
                ["docs/zh-CN/maturity/taxonomy.md"], record["repair"]["checker_intercepted_pages"]
            )
            self.assertEqual(["docs/zh-CN/maturity/taxonomy.md"], record["repair"]["failed_pages"])
            self.assertEqual(
                [
                    "pages_still_failing_1",
                    "checker_intercepted_1",
                    "relay_final_failure",
                    "release_gate_fallback_agent_failure",
                    "r2_content_unverified_dispatch_no_wait_final_publication_covered_by_locale_full_deploys",
                    "pages_dispatch_not_waited",
                ],
                record["remaining_risks"],
            )
            self.assertIn("R2 content=`unverified`", markdown)
            self.assertIn("- remaining risks:", markdown)

    def test_summary_marks_missing_metadata_as_risk(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            artifact_dir = repo / ".openclaw-sync/i18n-artifacts/zh-CN-s0of1"
            artifact_dir.mkdir(parents=True)
            summary_file = repo / "step-summary.md"
            with chdir(repo), env(
                {
                    "LOCALE": "zh-CN",
                    "LOCALE_SLUG": "zh-CN",
                    "SHARD_INDEX": "0",
                    "SHARD_TOTAL": "1",
                    "GATE_DECISION": "not_applicable",
                    "GITHUB_STEP_SUMMARY": str(summary_file),
                }
            ):
                mdx_repair_canary.summary_command(artifact_dir, repo)
            record = json.loads(
                (repo / ".openclaw-sync/canary-release-summary-zh-CN-s0of1.json").read_text(encoding="utf-8")
            )
            self.assertIn("artifact_metadata_missing", record["remaining_risks"])

    def _r2_smoke(
        self, repo: Path, page_body: str | None, live_html: str | None, **overrides: str
    ) -> tuple[dict[str, str], list[str]]:
        if page_body is not None:
            page = repo / "docs/zh-CN/channels/line.mdx"
            page.parent.mkdir(parents=True, exist_ok=True)
            page.write_text(page_body, encoding="utf-8")
        fetches: list[str] = []

        def fake_fetch(url: str, timeout_seconds: int = 30) -> str:
            fetches.append(url)
            if live_html is None:
                raise AssertionError("fetch_text must not be called")
            return live_html

        output = repo / "github-output.txt"
        values = {
            "LOCALE": "zh-CN",
            "R2_SMOKE_REQUIRE_VERIFIED": "1",
            "R2_SMOKE_UNVERIFIED_REASON": "",
            "GITHUB_OUTPUT": str(output),
        }
        values.update(overrides)
        with chdir(repo), env(values):  # type: ignore[arg-type]
            with patch.object(mdx_repair_canary.dispatch_r2_pages, "fetch_text", side_effect=fake_fetch):
                mdx_repair_canary.r2_smoke_command(
                    "zh-CN",
                    "channels/line",
                    "https://docs.openclaw.ai/zh-CN/channels/line",
                    repo / "docs",
                    2,
                    1,
                )
        outputs = dict(
            line.split("=", 1) for line in output.read_text(encoding="utf-8").splitlines() if "=" in line
        )
        return outputs, fetches

    def test_r2_smoke_derives_expected_h1_from_artifact_page(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            page = "---\ntitle: LINE\n---\n\n# `LINE` channel\n\nbody\n"
            outputs, fetches = self._r2_smoke(repo, page, "<html><h1>LINE channel</h1></html>")
            self.assertEqual("verified", outputs["r2_smoke"])
            self.assertEqual("LINE channel", outputs["expected_h1"])
            self.assertEqual(1, len(fetches))

    def test_r2_smoke_fails_required_on_live_mismatch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            page = "---\ntitle: LINE\n---\n\n# LINE channel\n"
            with self.assertRaisesRegex(SystemExit, "R2 content smoke finished mismatch"):
                self._r2_smoke(repo, page, "<html><h1>行</h1></html>")
            outputs, _ = self._r2_smoke(repo, page, "<html><h1>行</h1></html>", R2_SMOKE_REQUIRE_VERIFIED="0")
            self.assertEqual("mismatch", outputs["r2_smoke"])
            self.assertTrue(outputs["r2_smoke_reason"].startswith("live_h1_mismatch"))

    def test_r2_smoke_records_unverified_reason_without_fetching(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            page = "# LINE channel\n"
            outputs, fetches = self._r2_smoke(
                repo,
                page,
                None,
                R2_SMOKE_REQUIRE_VERIFIED="0",
                R2_SMOKE_UNVERIFIED_REASON="dispatch_no_wait_final_publication_covered_by_locale_full_deploys",
            )
            self.assertEqual("unverified", outputs["r2_smoke"])
            self.assertEqual(
                "dispatch_no_wait_final_publication_covered_by_locale_full_deploys",
                outputs["r2_smoke_reason"],
            )
            self.assertEqual([], fetches)

    def test_r2_smoke_marks_missing_artifact_page_explicitly(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            with self.assertRaisesRegex(SystemExit, "artifact_page_missing"):
                self._r2_smoke(repo, None, "<h1>anything</h1>")
            outputs, _ = self._r2_smoke(repo, None, "<h1>anything</h1>", R2_SMOKE_REQUIRE_VERIFIED="0")
            self.assertEqual("unverified", outputs["r2_smoke"])
            self.assertTrue(outputs["r2_smoke_reason"].startswith("artifact_page_missing"))

    def test_artifact_h1_skips_frontmatter_and_falls_back_to_title(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            page = repo / "page.mdx"
            page.write_text("---\ntitle: Frontmatter Title\n---\n\nbody without heading\n", encoding="utf-8")
            self.assertEqual(("Frontmatter Title", ""), mdx_repair_canary.artifact_h1(page))
            page.write_text("---\ntitle: Ignored\n---\n\n# Heading Wins\n", encoding="utf-8")
            self.assertEqual(("Heading Wins", ""), mdx_repair_canary.artifact_h1(page))
            page.write_text("no heading at all\n", encoding="utf-8")
            h1, note = mdx_repair_canary.artifact_h1(page)
            self.assertEqual("", h1)
            self.assertTrue(note.startswith("artifact_h1_missing"))


if __name__ == "__main__":
    unittest.main()
