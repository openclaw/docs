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
apply_artifacts = load_module("apply_artifacts")
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
        workflows = sorted((REPO_ROOT / ".github/workflows").glob("translate-*.yml"))
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
        allowed_docs_paths = {"docs/.i18n/translation-workflow.md", "docs/.i18n/translation-ci-temporary-todo.md"}
        generated_docs = [
            path
            for path in changed_paths
            if (path.startswith("docs/") and path not in allowed_docs_paths)
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

        self.assertIn("npm install -g @openai/codex@0.144.4", reusable)
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
          const source = `Plain Markdown says n < 9 before the JSX.\\n<ParamField path="prompt" type="string" default="Analyze this PDF document." label="Prompt" />\\n`;
          const translated = `Plain Markdown says n < 9 before the JSX.\\n<ParamField label="Eingabe" default="Analysieren Sie dieses PDF-Dokument." type="text" path="eingabe" />\\n`;
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
        self.assertIn("n < 9", output["result"]["value"])
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

            (repo / "docs/index.md").write_text("# Staged source side effect\n", encoding="utf-8")
            run_git(repo, "add", "docs/index.md")
            with self.assertRaises(SystemExit):
                mdx_repair_scope.enforce_scope(repo, "fr", baseline)
            run_git(repo, "restore", "--staged", "docs/index.md")
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


if __name__ == "__main__":
    unittest.main()
