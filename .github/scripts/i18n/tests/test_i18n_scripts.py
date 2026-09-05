from __future__ import annotations

import hashlib
import importlib.util
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest
from contextlib import contextmanager, redirect_stdout
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
    result = subprocess.run(["git", *args], cwd=repo, check=True, text=True, stdout=subprocess.PIPE, timeout=120)
    return result.stdout


def init_repo(repo: Path) -> None:
    run_git(repo, "init", "-b", "main")
    run_git(repo, "config", "user.name", "Test")
    run_git(repo, "config", "user.email", "test@example.com")
    run_git(repo, "config", "commit.gpgsign", "false")


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
        install = "npm install --no-save --package-lock=false @mdx-js/mdx@3.1.1 tsx@4.23.12"
        self.assertIn(install, text)
        self.assertLess(text.index(install), text.index("Run i18n control-plane regressions"))
        self.assertRegex(text, r'pull_request:\n    paths:\n      - "\.github/scripts/i18n/\*\*"\n      - "\.github/workflows/translate-\*\.yml"')

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

        # The Codex CLI pin has one source of truth: toolchain.json. Workflows
        # must resolve it at runtime; no workflow may embed a version literal.
        toolchain = json.loads((REPO_ROOT / ".github/scripts/i18n/toolchain.json").read_text(encoding="utf-8"))
        self.assertRegex(str(toolchain["codex_cli"]), r"^\d+\.\d+\.\d+$")
        self.assertRegex(str(toolchain["go_version"]), r"^\d+\.\d+$")
        self.assertIn('CODEX_CLI_VERSION="$(jq -r .codex_cli "${I18N_SCRIPT_DIR}/toolchain.json")"', reusable)
        self.assertIn('GO_VERSION="$(jq -r .go_version "${I18N_SCRIPT_DIR}/toolchain.json")"', reusable)
        self.assertIn('npm install -g "@openai/codex@${CODEX_CLI_VERSION}"', reusable)
        self.assertIn("sparse-checkout-cone-mode: false", full)
        for workflow_path in sorted((REPO_ROOT / ".github/workflows").glob("translate-*.yml")):
            self.assertIsNone(
                re.search(r"@openai/codex@\d", workflow_path.read_text(encoding="utf-8")),
                f"{workflow_path.name} must resolve the Codex CLI version from toolchain.json",
            )

        self.assertIn("effort: xhigh", reusable)
        self.assertIn('go-version: "${{ env.GO_VERSION }}"', reusable)
        self.assertNotIn('codex-args:', reusable)
        self.assertNotIn('--full-auto', reusable)
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

    def test_prepare_reads_metadata_from_the_once_resolved_revision(self) -> None:
        for ref in ("HEAD", "refs/remotes/origin/main"):
            with self.subTest(ref=ref), patch.object(prepare, "run_git", side_effect=[
                "resolved-sha\n", '{"repository":"openclaw/openclaw","sha":"source-a"}',
            ]) as git:
                self.assertEqual(prepare.MainState("resolved-sha", "openclaw/openclaw", "source-a"), prepare.read_source_state(ref))
                self.assertEqual([
                    (["rev-parse", ref],),
                    (["show", "resolved-sha:.openclaw-sync/source.json"],),
                ], [call.args for call in git.call_args_list])

    def test_prepare_translation_preserves_debounce_cap_and_push_filter(self) -> None:
        first = prepare.MainState("publish-a", "openclaw/openclaw", "source-a")
        newer = prepare.MainState("publish-b", "openclaw/openclaw", "source-b")
        for mode, states, cap, translate in (
            ("full", [first, first], "20", True),
            ("full", [first, newer], "10", True),
            ("incremental", [first, newer, newer, newer], "20", True),
            ("incremental", [first, first], "20", False),
        ):
            with self.subTest(mode=mode, states=states, translate=translate), patch.dict(os.environ, {
                "EVENT_NAME": "push", "BEFORE_SHA": "before", "REQUESTED_COOLDOWN_SECONDS": "10",
                "DEFAULT_MAX_WAIT_SECONDS": cap,
            }, clear=True), patch.object(prepare, "read_main_state", side_effect=states) as read, \
                    patch.object(prepare, "sleep_with_heartbeat") as sleep, \
                    patch.object(prepare, "incremental_should_translate", return_value=translate) as changed:
                result = prepare.prepare(mode, "Fixture preparation")
                self.assertEqual(states[-1].publish_ref, result["publish_ref"])
                self.assertEqual(states[-1].source_sha, result["source_sha"])
                self.assertEqual(str(translate).lower(), result["should_translate"])
                self.assertEqual(len(states), read.call_count)
                self.assertEqual([(10,)] * (len(states) // 2), [call.args for call in sleep.call_args_list])
                if mode == "incremental":
                    changed.assert_called_once_with("before", states[-1].publish_ref)
                else:
                    changed.assert_not_called()

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

    def test_provider_preflight_private_selection_and_availability_fallback(self) -> None:
        cases = [
            (200, {}, ["private-primary"], "primary"),
            (404, {"code": "model_not_found"}, ["private-primary", "private-fallback"], "fallback"),
            (403, {"param": "model", "code": "permission_denied"}, ["private-primary", "private-fallback"], "fallback"),
            (401, {}, ["private-primary"], None),
            (403, {"code": "permission_denied"}, ["private-primary"], None),
            (404, {}, ["private-primary"], None),
            (429, {"code": "insufficient_quota"}, ["private-primary"], None),
            (500, {}, ["private-primary"], None),
        ]
        for status, error, expected_models, slot in cases:
            with self.subTest(status=status, error=error), tempfile.TemporaryDirectory() as tmp:
                output = Path(tmp) / "output"
                body = json.dumps({"error": {**error, "message": "private-primary private-fallback"}})
                responses = [provider_preflight.ApiResponse(status, body), provider_preflight.ApiResponse(200, "{}")]
                stdout = io.StringIO()
                with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key", "GITHUB_OUTPUT": str(output)}), patch.object(provider_preflight, "openai_probe_request", side_effect=responses) as probe, redirect_stdout(stdout):
                    if slot:
                        provider_preflight.provider_preflight("openai", "private-primary", 30, fallback_model="private-fallback")
                    else:
                        with self.assertRaises(SystemExit) as failure:
                            provider_preflight.provider_preflight("openai", "private-primary", 30, fallback_model="private-fallback")
                        stdout.write(str(failure.exception))
                self.assertEqual(expected_models, [call.args[0] for call in probe.call_args_list])
                public_output = stdout.getvalue() + output.read_text()
                for identifier in ("private-primary", "private-fallback"):
                    self.assertNotIn(identifier, public_output)
                if slot:
                    self.assertIn(f"model_slot={slot}", output.read_text())

    def test_read_source_metadata_validates_requested_sha_and_outputs_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source_json = Path(tmp) / "source.json"
            source_json.write_text('{"repository":"openclaw/openclaw","sha":"source-a"}\n', encoding="utf-8")
            metadata = read_source_metadata.read_source_metadata(source_json, "source-a", "openclaw/openclaw")
            self.assertEqual("openclaw/openclaw", metadata.repository)
            self.assertEqual("source-a", metadata.sha)
            with self.assertRaises(SystemExit):
                read_source_metadata.read_source_metadata(source_json, "other-source")
            with self.assertRaises(SystemExit):
                read_source_metadata.read_source_metadata(source_json, "source-a", "other/repository")

    def test_prune_stale_locale_pages_removes_only_pages_without_source(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp) / "docs"
            (docs / "fr/old/nested").mkdir(parents=True)
            (docs / "fr/index.md").parent.mkdir(parents=True, exist_ok=True)
            (docs / "index.md").write_text("# Index\n", encoding="utf-8")
            (docs / "fr/index.md").write_text("# Index FR\n", encoding="utf-8")
            (docs / "fr/old/nested/page.md").write_text("# Old\n", encoding="utf-8")
            (docs / "fr/unrelated-empty").mkdir()

            args = [sys.executable, str(SCRIPT_DIR / "prune_stale_locale_pages.py"), "--docs-root", str(docs), "--locale", "fr"]
            before = self._docs_bytes(Path(tmp))
            empty = subprocess.run([*args, "--source-path="], text=True, capture_output=True, timeout=30)
            self.assertNotEqual(0, empty.returncode)
            self.assertEqual(before, self._docs_bytes(Path(tmp)))
            result = subprocess.run(args, text=True, capture_output=True, timeout=30)

            self.assertEqual(0, result.returncode, result.stderr)
            self.assertIn("removed stale locale pages: 1", result.stdout)
            self.assertTrue((docs / "fr/index.md").exists())
            self.assertFalse((docs / "fr/old").exists())
            self.assertFalse((docs / "fr/unrelated-empty").exists())

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
            for metadata, body, needs_refresh in (
                ("", "# Index FR\n", False),
                ("  model: retired-model\n", "# Index FR\n", True),
                ("  provider: retired-provider\n", "# Index FR\n", True),
                ("", "# Index FR\n```yaml\nx-i18n:\n  model: example\n```\n", False),
            ):
                with self.subTest(metadata=metadata, body=body):
                    (tmp_path / "docs/fr/index.md").write_text(
                        f"---\nx-i18n:\n  source_hash: {digest}\n{metadata}---\n\n{body}",
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
                    expected = ["guide/setup.mdx", "index.md"] if needs_refresh else ["guide/setup.mdx"]
                    self.assertEqual(2, result.all_count)
                    self.assertEqual(len(expected), result.total_pending_count)
                    self.assertEqual(expected, [file.relative_to((tmp_path / "docs").resolve()).as_posix() for file in result.shard_files])

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

            self._prepare_mdx_checker(repo)
            before = translated.read_bytes()
            checked, report = self._check_translated_mdx(repo)
            self.assertEqual(0, checked.returncode, checked.stderr)
            self.assertEqual([], report["errors"])
            self.assertEqual(before, translated.read_bytes())

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
                        "MDX_CHECK_OUTCOME": "success" if checked.returncode == 0 else "failure",
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

    def _prepare_mdx_checker(self, repo: Path) -> None:
        mirror = repo / ".openclaw-sync"
        mirror.mkdir(exist_ok=True)
        for name in ("check-docs-mdx.mjs", "check-docs-mdx.mts", "tsx.mjs"):
            shutil.copy2(REPO_ROOT / ".openclaw-sync" / name, mirror / name)
        shutil.copytree(REPO_ROOT / ".openclaw-sync/lib", mirror / "lib")
        (repo / "node_modules").symlink_to(REPO_ROOT / "node_modules", target_is_directory=True)

    def _check_translated_mdx(self, repo: Path, step: str = "Check translated MDX") -> tuple[subprocess.CompletedProcess, dict]:
        report = repo / ".openclaw-sync/mdx/fr.json"
        workflow = (REPO_ROOT / ".github/workflows/translate-locale-reusable.yml").read_text(encoding="utf-8")
        block = workflow.split(f"      - name: {step}\n", 1)[1].split("      - name:", 1)[0]
        command = block.split("        run: |\n", 1)[1]
        for key, value in (("locale_slug", "fr"), ("shard_index", "0"), ("shard_total", "1")):
            command = command.replace("${{ inputs." + key + " }}", value)
        result = subprocess.run(
            ["bash", "-eu", "-c", command], cwd=repo, text=True, capture_output=True,
            env={**os.environ, "I18N_SCRIPT_DIR": str(SCRIPT_DIR), "GITHUB_WORKSPACE": str(repo), "LOCALE": "fr"},
        )
        return result, json.loads(report.read_text(encoding="utf-8"))

    def test_translated_mdx_preflight_catches_pending_markdown_and_rechecks_fresh_report(self) -> None:
        with tempfile.TemporaryDirectory(prefix="mdx quoted ' $() ") as tmp:
            repo = Path(tmp)
            init_repo(repo)
            (repo / "docs/fr").mkdir(parents=True)
            originals = {}
            for name, attributes in (("plain.md", ""), ("protected.md", ' className="card"')):
                source = repo / "docs" / name
                source.write_text(f'<div{attributes}>Texte</div>\n', encoding="utf-8")
                translated = repo / "docs/fr" / name
                translated.write_text(f'<div{attributes}>Texte</span>\n', encoding="utf-8")
                originals[translated] = translated.read_bytes()
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "existing malformed translations")
            self._prepare_mdx_checker(repo)
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(
                "".join(str(repo / "docs" / file.name) + "\n" for file in originals), encoding="utf-8",
            )
            old = subprocess.run(
                ["node", str(repo / ".openclaw-sync/check-docs-mdx.mjs"), "docs/fr",
                 "--json-out", ".openclaw-sync/old.json"],
                cwd=repo, text=True, capture_output=True,
            )
            self.assertEqual(0, old.returncode, old.stderr)
            self.assertEqual([], json.loads((repo / ".openclaw-sync/old.json").read_text())["errors"])
            self.assertEqual("", run_git(repo, "diff", "--name-only", "--", "docs"))

            checked, report = self._check_translated_mdx(repo)
            self.assertEqual(1, checked.returncode, checked.stderr)
            self.assertEqual({"docs/fr/plain.md", "docs/fr/protected.md"}, {error["file"] for error in report["errors"]})
            for error in report["errors"]:
                self.assertEqual("translated-mdx", error["type"])
                self.assertIn("Unexpected closing tag", error["message"])
                self.assertIn("span", error["message"])
                self.assertIn("div", error["message"])
            for file, before in originals.items():
                self.assertEqual(before, file.read_bytes())
                file.write_bytes(before.replace(b"</span>", b"</div>"))
            rechecked = subprocess.run(report["recheck_command"], cwd=repo.parent, text=True, capture_output=True)
            self.assertEqual(0, rechecked.returncode, rechecked.stderr)
            fresh = json.loads((repo / ".openclaw-sync/mdx/fr.json").read_text())
            self.assertEqual([], fresh["errors"])
            self.assertEqual(report["recheck_command"], fresh["recheck_command"])
            rechecked, fresh = self._check_translated_mdx(repo, "Recheck translated MDX")
            self.assertEqual(0, rechecked.returncode, rechecked.stderr)
            self.assertEqual([], fresh["errors"])

    def test_translated_mdx_preflight_preserves_mixed_markdown_and_jsx(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            shutil.copytree(FIXTURES / "pending-docs/docs", repo / "docs")
            self._prepare_mdx_checker(repo)
            translated = repo / "docs/fr/index.md"
            translated.write_text(
                '---\ntitle: Exemple\n---\n<!-- unmatched { ` <X /> -->\n\n'
                'Texte n < 9, <user@example.com>, <https://example.com>.\n\n'
                '`<X id="literal" />`\n\n```mdx\n<div></span>\n```\n\n'
                '<Card id="stable" title="Français">Texte</Card>\n\n{ready && <X />}\n',
                encoding="utf-8",
            )
            (repo / "docs/fr/valid.mdx").write_text('<Card title="Français" />\n', encoding="utf-8")
            (repo / "docs/fr/not-pending.md").write_text('<div></span>\n', encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(
                "".join(str(repo / "docs" / name) + "\n" for name in ("index.md", "valid.mdx", "missing.md")),
                encoding="utf-8",
            )
            before = {file: file.read_bytes() for file in (repo / "docs").rglob("*") if file.is_file()}
            checked, report = self._check_translated_mdx(repo)
            self.assertEqual(0, checked.returncode, checked.stderr)
            self.assertEqual([], report["errors"])
            self.assertEqual(before, {file: file.read_bytes() for file in (repo / "docs").rglob("*") if file.is_file()})
            translated.write_text("Texte n < 9, <user@example.com>, <div></span>\n", encoding="utf-8")
            checked, report = self._check_translated_mdx(repo)
            self.assertEqual(1, checked.returncode, checked.stderr)
            error, = report["errors"]
            self.assertEqual(1, error["line"])
            self.assertNotIn("column", error)
            self.assertIn("columns refer to normalized Markdown", error["message"])

    def test_translated_mdx_preflight_combines_generic_and_packaging_syntax_errors(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "docs/fr").mkdir(parents=True)
            self._prepare_mdx_checker(repo)
            for name, value in {
                "poison.md": "analysis to=functions.exec\n",
                "accordion.md": '<Accordion title="Title">\nContent\n  </Accordion>\n',
                "generic.mdx": "<div></span>\n",
                "pending.md": "<div></span>\n",
            }.items():
                (repo / "docs/fr" / name).write_text(value, encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/pending.md") + "\n")
            checked, report = self._check_translated_mdx(repo)
            self.assertEqual(1, checked.returncode, checked.stderr)
            self.assertEqual(
                {("poison-text", "docs/fr/poison.md"), ("mintlify-mdx", "docs/fr/accordion.md"),
                 ("mdx", "docs/fr/generic.mdx"), ("translated-mdx", "docs/fr/pending.md")},
                {(error["type"], error["file"]) for error in report["errors"]},
            )

    def test_translated_mdx_preflight_bounds_reports_and_reveals_remaining_errors(self) -> None:
        for poison in (False, True):
            with self.subTest(poison=poison), tempfile.TemporaryDirectory() as tmp:
                repo = Path(tmp)
                (repo / "docs/fr").mkdir(parents=True)
                self._prepare_mdx_checker(repo)
                sources = []
                for index in range(52):
                    source = repo / "docs" / f"page-{index:02}.md"
                    source.write_text("<div>Texte</div>\n", encoding="utf-8")
                    sources.append(str(source))
                    (repo / "docs/fr" / source.name).write_text(
                        ("/home/runner/work/example\n\n" if poison else "") + "<div>Texte</span>\n",
                        encoding="utf-8",
                    )
                (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text("\n".join(sources) + "\n")
                checked, report = self._check_translated_mdx(repo)
                self.assertEqual(1, checked.returncode, checked.stderr)
                self.assertEqual(50, len(report["errors"]))
                self.assertEqual({"poison-text" if poison else "translated-mdx"}, {error["type"] for error in report["errors"]})
                reported = {error["file"] for error in report["errors"]}
                remaining = {f"docs/fr/page-{index:02}.md" for index in range(52)} - reported
                self.assertEqual(2, len(remaining))
                for file in reported:
                    (repo / file).write_bytes((repo / "docs" / Path(file).name).read_bytes())
                checked, report = self._check_translated_mdx(repo, "Recheck translated MDX")
                self.assertEqual(1, checked.returncode, checked.stderr)
                self.assertEqual(remaining, {error["file"] for error in report["errors"]})
                self.assertEqual(4 if poison else 2, len(report["errors"]))
                self.assertTrue(any(error["type"] == "translated-mdx" for error in report["errors"]))
                for file in remaining:
                    (repo / file).write_bytes((repo / "docs" / Path(file).name).read_bytes())
                checked, report = self._check_translated_mdx(repo, "Recheck translated MDX")
                self.assertEqual(0, checked.returncode, checked.stderr)
                self.assertEqual([], report["errors"])

    def test_translated_mdx_preflight_fails_closed_on_generic_checker_failure(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo = Path(tmp)
            (repo / "docs/fr").mkdir(parents=True)
            self._prepare_mdx_checker(repo)
            (repo / "docs/fr/index.md").write_text("<div></span>\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n")
            output = repo / ".openclaw-sync/mdx/fr.json"
            output.parent.mkdir()
            for body, code in ((None, 1), ("not JSON", 0), ('{}', 0),
                               ('{"files":1,"errors":[{}]}', 1), ('{"files":1,"errors":[]}', 2)):
                with self.subTest(body=body, code=code):
                    # Break the actual subprocess/report boundary, without a production injection hook.
                    program = 'import fs from "node:fs";\n'
                    if body is not None:
                        program += f'fs.writeFileSync(process.argv[process.argv.indexOf("--json-out") + 1], {json.dumps(body)});\n'
                    program += f'process.exit({code});\n'
                    (repo / ".openclaw-sync/check-docs-mdx.mjs").write_text(program, encoding="utf-8")
                    output.write_text('{"files":999,"errors":[],"stale":true}', encoding="utf-8")
                    checked, report = self._check_translated_mdx(repo)
                    self.assertEqual(1, checked.returncode, checked.stderr)
                    self.assertNotIn("stale", report)
                    self.assertEqual({"generic-checker", "translated-mdx"}, {error["type"] for error in report["errors"]})

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

    def test_ensure_base_current_treats_empty_remote_sha_as_stale(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp) / "github_output"
            stdout = io.StringIO()
            with patch.object(commit_locale_artifact, "remote_source_sha", return_value=""), patch.dict(os.environ, {"GITHUB_OUTPUT": str(output)}), redirect_stdout(stdout):
                current = commit_locale_artifact.ensure_base_current("source-a", "fr")
            self.assertFalse(current)
            self.assertIn("committed=false", output.read_text(encoding="utf-8"))
            self.assertIn("missing or unreadable", stdout.getvalue())

    def test_commit_locale_skips_push_when_origin_source_json_is_unreadable(self) -> None:
        cases = {
            "missing": None,
            "invalid": "{not-json\n",
            "empty_sha": json.dumps({"repository": "openclaw/openclaw", "sha": ""}) + "\n",
            "missing_sha": json.dumps({"repository": "openclaw/openclaw"}) + "\n",
        }
        for name, source_body in cases.items():
            with self.subTest(name):
                with tempfile.TemporaryDirectory() as tmp:
                    tmp_path = Path(tmp)
                    origin = tmp_path / "origin.git"
                    subprocess.run(["git", "init", "--bare", str(origin)], check=True, text=True, stdout=subprocess.PIPE)
                    repo = tmp_path / "repo"
                    repo.mkdir()
                    init_repo(repo)
                    (repo / ".openclaw-sync").mkdir()
                    if source_body is None:
                        (repo / ".openclaw-sync/keep").write_text("x\n", encoding="utf-8")
                    else:
                        (repo / ".openclaw-sync/source.json").write_text(source_body, encoding="utf-8")
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

                    stdout = io.StringIO()
                    with chdir(repo), redirect_stdout(stdout):
                        committed = commit_locale_artifact.commit_locale(
                            "hi",
                            "source-a",
                            1,
                            artifact_role="canary",
                            artifact_dir=str(artifact),
                        )

                    self.assertFalse(committed)
                    self.assertIn("missing or unreadable", stdout.getvalue())
                    self.assertNotIn("docs/hi/index.md", run_git(repo, "ls-tree", "-r", "--name-only", "origin/main"))

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
            (repo / "docs/fr").mkdir()
            stale = repo / "docs/fr/retired.md"
            stale.write_text("# Retired\n", encoding="utf-8")
            run_git(repo, "add", ".")
            run_git(repo, "commit", "-m", "initial")
            stale.unlink()
            (repo / "docs/fr/index.md").write_text("<div></span>\n", encoding="utf-8")
            (repo / ".openclaw-sync/docs-i18n-fr-s0of1.txt").write_text(str(repo / "docs/index.md") + "\n")
            self._prepare_mdx_checker(repo)
            checked, _ = self._check_translated_mdx(repo)
            rechecked, _ = self._check_translated_mdx(repo, "Recheck translated MDX")
            self.assertEqual(1, checked.returncode, checked.stderr)
            self.assertEqual(1, rechecked.returncode, rechecked.stderr)
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
                with env({
                    "TRANSLATE_OUTCOME": "success", "MDX_CHECK_OUTCOME": "failure",
                    "MDX_REPAIR_OUTCOME": "success", "MDX_SCOPE_OUTCOME": "success",
                    "MDX_RECHECK_OUTCOME": "failure" if rechecked.returncode else "success",
                }):
                    metadata = package_artifact.package_artifact(repo, Path(".openclaw-sync"))

            self.assertIn("failed=true", output.read_text(encoding="utf-8"))
            self.assertIn("failed_reason=translation failed", output.read_text(encoding="utf-8"))
            self.assertIn("failed_reason=mdx repair failed", output.read_text(encoding="utf-8"))
            self.assertEqual("mdx repair failed", metadata["failed_reason"])
            self.assertEqual((0, 0), (metadata["changed_count"], metadata["deleted_count"]))
            artifact = repo / ".openclaw-sync/artifacts/fr-s0of1"
            for name in ("changed-files.txt", "deleted-files.txt"):
                self.assertEqual("", (artifact / name).read_text(encoding="utf-8"))
            self.assertFalse(any((artifact / "payload").rglob("*.md")))

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
                    "docs/fr/index.md": self._translated_page(repo / "docs/index.md", "# Index FR\n")
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
                payload={"docs/fr/index.md": self._translated_page(repo / "docs/index.md", "# Index FR\n")},
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
                payload={"docs/fr/guide/setup.md": self._translated_page(repo / "docs/guide/setup.md", "# Setup FR\n")},
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

    def test_artifact_preflight_preserves_current_source_tm_rules(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, chdir(Path(tmp)):
            artifact = Path(tmp) / "artifact"
            for source_current in (True, False):
                for kind, rel in (
                    ("changed", "docs/.i18n/fr.tm.jsonl"),
                    ("deleted", "docs/.i18n/fr.tm.jsonl"),
                ):
                    with self.subTest(source_current=source_current, kind=kind, rel=rel):
                        if artifact.exists():
                            shutil.rmtree(artifact)
                        self._write_artifact(Path(tmp), "artifact", **{kind: [rel]}, payload={rel: "payload without source hash\n"} if kind == "changed" else {})
                        issue = apply_artifacts.artifact_stale_issue(artifact, "fr", source_current)
                        self.assertEqual(source_current, issue == "")

    def test_apply_artifacts_checks_page_sources_across_all_locale_shards(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            seed = root / "seed"
            seed.mkdir()
            self._repo_with_source(str(seed))
            (seed / "docs/clawhub").mkdir()
            (seed / "docs/clawhub/guide.mdx").write_text("# Current ClawHub guide\n")
            (seed / "docs/clawhub/data.json").write_text('{"current":true}\n')
            (seed / "docs/fr/clawhub").mkdir(parents=True)
            (seed / "docs/fr/clawhub/guide.mdx").write_text("# Existing guide FR\n")
            (seed / "docs/fr/index.md").write_text("# Existing index FR\n")
            (seed / "docs/fr/orphan.md").write_text("# Valid deletion once locale passes\n")
            (seed / "docs/.i18n").mkdir()
            (seed / "docs/.i18n/fr.tm.jsonl").write_text('{"original":"memory"}\n')
            (seed / ".openclaw-sync/source.json").write_text(json.dumps({
                "repository": "openclaw/openclaw", "sha": "stable-core",
                "sources": {
                    "openclaw": {"repository": "openclaw/openclaw", "sha": "stable-core"},
                    "clawhub": {"repository": "openclaw/clawhub", "sha": "after-retirement"},
                },
            }) + "\n")
            run_git(seed, "add", ".")
            run_git(seed, "commit", "-m", "secondary source after retirement")
            origin = root / "origin.git"
            run_git(root, "init", "--bare", "-b", "main", str(origin))
            run_git(seed, "remote", "add", "origin", str(origin))
            run_git(seed, "push", "origin", "main")
            guide = self._translated_page(seed / "docs/clawhub/guide.mdx", "# Updated guide FR\n")
            old_hash = hashlib.sha256(b"# Old ClawHub English\n").hexdigest()
            old_page = f"---\nx-i18n:\n  source_hash: {old_hash}\n---\n# Old translation\n"
            cases = (
                ("same_sha_retired", "stable-core", "clawhub/retired.md", old_page, False),
                ("same_sha_changed", "stable-core", "clawhub/guide.mdx", old_page, False),
                ("stale_sha_changed", "old-core", "clawhub/guide.mdx", old_page, False),
                ("missing_hash", "stable-core", "clawhub/guide.mdx", "# No source hash\n", False),
                ("non_markdown", "stable-core", "clawhub/data.json", self._translated_page(seed / "docs/clawhub/data.json", "data\n"), False),
                ("current_valid", "stable-core", "clawhub/guide.mdx", guide, True),
                ("stale_valid", "old-core", "clawhub/guide.mdx", guide, True),
            )
            for case, source_sha, relative, page, valid in cases:
                with self.subTest(case=case):
                    repo = root / case
                    run_git(root, "clone", str(origin), str(repo))
                    before = self._docs_bytes(repo)
                    artifacts = repo / ".openclaw-sync/i18n-artifacts"
                    metadata = {"failed_reason": "", "locale": "fr", "locale_slug": "fr", "mode": "full", "shard_total": 2, "source_sha": source_sha}
                    payload = {"docs/fr/index.md": self._translated_page(seed / "docs/index.md", "# Updated index FR\n")}
                    if source_sha == "stable-core":
                        payload["docs/.i18n/fr.tm.jsonl"] = '{"updated":"memory"}\n'
                    self._write_artifact(artifacts, "fr-s0of2", metadata={**metadata, "shard_index": 0}, changed=list(payload), deleted=["docs/fr/orphan.md"], payload=payload)
                    self._write_artifact(artifacts, "fr-s1of2", metadata={**metadata, "shard_index": 1}, changed=[f"docs/fr/{relative}"], payload={f"docs/fr/{relative}": page})
                    result = self._retirement_cli(repo, root, {}, "apply_artifacts.py", "--source-sha", source_sha, "--mode", "full", "--shard-total", "2", "--expected-locales", "fr=fr", "--artifacts-root", str(artifacts))
                    self.assertEqual("stable-core", result["base_source_sha"])
                    self.assertFalse((repo / "docs/clawhub/retired.md").exists())
                    self.assertFalse((repo / "docs/fr/clawhub/retired.md").exists(), "old wave must not resurrect a retired page")
                    if valid:
                        expected = {**before, **{rel: text.encode() for rel, text in payload.items()}, f"docs/fr/{relative}": page.encode()}
                        del expected["docs/fr/orphan.md"]
                        self.assertEqual(expected, self._docs_bytes(repo))
                        self.assertEqual("0", result["incomplete_count"])
                        self.assertEqual(str(len(payload) + 2), result["changed_count"])
                    else:
                        self.assertEqual(before, self._docs_bytes(repo), "invalid page must block every shard's updates, TM and deletions")
                        self.assertEqual("0", result["changed_count"])
                        self.assertEqual("1", result["incomplete_count"])
                        self.assertIn(f"docs/fr/{relative}", (repo / ".openclaw-sync/i18n-incomplete-locales.txt").read_text())

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
                payload={"docs/fr/index.md": self._translated_page(repo / "docs/index.md", "# Updated FR\n")},
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
                payload={"docs/fr/index.md": self._translated_page(repo / "docs/index.md", "# Index FR\n")},
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
                payload={"docs/fr/index.md": self._translated_page(repo / "docs/index.md", "# Updated FR\n")},
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

    def test_finalizer_commit_rechecks_metadata_after_aggregate_validation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            seed = root / "seed"
            seed.mkdir()
            self._repo_with_source(str(seed))
            origin = root / "origin.git"
            run_git(root, "init", "--bare", "-b", "main", str(origin))
            run_git(seed, "remote", "add", "origin", str(origin))
            run_git(seed, "push", "origin", "main")
            workflow = "translate-finalize-reusable.yml"
            for case in ("unchanged", "unrelated_main", "restored_secondary", "metadata_refresh", "missing_metadata"):
                with self.subTest(case=case):
                    run_git(seed, "fetch", "origin", "main")
                    run_git(seed, "merge", "--ff-only", "origin/main")
                    (seed / "docs/fr/clawhub").mkdir(parents=True, exist_ok=True)
                    (seed / "docs/fr/clawhub/retired.md").write_text("# Retired FR\n")
                    (seed / "docs/clawhub").mkdir(exist_ok=True)
                    (seed / "docs/clawhub/retired.md").unlink(missing_ok=True)
                    metadata = {
                        "repository": "openclaw/openclaw", "sha": "stable-core",
                        "sources": {"clawhub": {"repository": "openclaw/clawhub", "sha": "retired"}},
                    }
                    source_json = seed / ".openclaw-sync/source.json"
                    source_json.write_text(json.dumps(metadata) + "\n")
                    run_git(seed, "add", "docs", ".openclaw-sync/source.json")
                    run_git(seed, "commit", "--allow-empty", "-m", "fixture retirement admission")
                    run_git(seed, "push", "origin", "main")
                    repo = root / case
                    run_git(root, "clone", str(origin), str(repo))
                    run_git(repo, "config", "commit.gpgsign", "false")
                    artifacts = repo / ".openclaw-sync/artifacts"
                    self._write_artifact(artifacts, "fr-s0of1", metadata={
                        "locale": "fr", "locale_slug": "fr", "source_sha": "stable-core",
                        "shard_index": 0, "shard_total": 1, "failed_reason": "",
                    }, deleted=["docs/fr/clawhub/retired.md"])
                    applied = self._retirement_cli(repo, root, {}, "apply_artifacts.py", "--source-sha", "stable-core", "--mode", "retirements", "--shard-total", "1", "--expected-locales", "fr=fr", "--artifacts-root", str(artifacts))
                    self.assertEqual("1", applied["changed_count"])
                    self.assertEqual("0", applied["incomplete_count"])
                    admitted_oid = run_git(repo, "rev-parse", "HEAD:.openclaw-sync/source.json").strip()
                    self.assertEqual(admitted_oid, applied["base_source_metadata_oid"])
                    self.assertEqual(json.loads(run_git(repo, "cat-file", "blob", admitted_oid))["sha"], applied["base_source_sha"])
                    # Simulate a remote update during the awaited docs:check.
                    if case == "restored_secondary":
                        (seed / "docs/clawhub/retired.md").write_text("# Restored English\n")
                        metadata["sources"]["clawhub"]["sha"] = "restored"
                        source_json.write_text(json.dumps(metadata) + "\n")
                    elif case == "metadata_refresh":
                        metadata["syncedAt"] = "later sync with identical sources"
                        source_json.write_text(json.dumps(metadata) + "\n")
                    elif case == "missing_metadata":
                        source_json.unlink()
                    elif case == "unrelated_main":
                        (seed / "unrelated.txt").write_text("Unrelated main change\n")
                    if case != "unchanged":
                        run_git(seed, "add", ".")
                        run_git(seed, "commit", "-m", "fixture update during validation")
                        run_git(seed, "push", "origin", "main")
                    remote_before = run_git(origin, "rev-parse", "main").strip()
                    values = {f"steps.apply.outputs.{key}": value for key, value in applied.items()}
                    self._retirement_step(repo, root, values, "Commit aggregate translation refresh", workflow_name=workflow)
                    published = case in {"unchanged", "unrelated_main"}
                    self.assertEqual("true" if published else None, values.get("steps.aggregate_commit.outputs.committed"))
                    paths = run_git(origin, "ls-tree", "-r", "--name-only", "main").splitlines()
                    self.assertEqual(not published, "docs/fr/clawhub/retired.md" in paths)
                    if published:
                        self.assertNotEqual(remote_before, run_git(origin, "rev-parse", "main").strip())
                        run_git(origin, "merge-base", "--is-ancestor", remote_before, "main")
                        if case == "unrelated_main":
                            self.assertIn("unrelated.txt", paths)
                    else:
                        self.assertEqual(remote_before, run_git(origin, "rev-parse", "main").strip())
                        failure = self._retirement_step(repo, root, values, "Fail uncommitted aggregate translation refresh", workflow_name=workflow, succeeds=False)
                        self.assertIn("did not commit them", failure.stderr)

    def test_retirement_workflow_cleans_all_locales_without_translation_and_is_idempotent(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, runner, values, seed, origin = self._retirement_fixture(Path(tmp))
            # The literal main checkout admits the source before prepare records it.
            (seed / "docs/new.md").write_text("# New source\n", encoding="utf-8")
            run_git(seed, "add", "docs/new.md")
            run_git(seed, "commit", "-m", "new publish revision")
            run_git(seed, "push", "origin", "main")
            self._prepare_retirements(repo, runner, values)
            selected_ref = run_git(seed, "rev-parse", "HEAD").strip()
            selected_metadata = (repo / ".openclaw-sync/source.json").read_bytes()
            (seed / ".openclaw-sync/source.json").write_text('{"repository":"openclaw/openclaw","sha":"source-b"}\n')
            run_git(seed, "add", ".openclaw-sync/source.json")
            run_git(seed, "commit", "-m", "remote main moves after checkout")
            run_git(seed, "push", "origin", "main")
            self._retirement_step(repo, runner, values, "Record checked-out source snapshot")
            self._retirement_step(repo, runner, values, "Validate selected source pair")
            self.assertEqual(selected_ref, values["steps.prepare.outputs.publish_ref"])
            self.assertEqual("source-a", values["steps.prepare.outputs.source_sha"])
            self.assertEqual("false", values["steps.prepare.outputs.should_translate"])
            self.assertEqual(selected_ref, run_git(repo, "rev-parse", "refs/remotes/origin/main").strip(), "recording must not fetch")
            self.assertEqual(selected_ref, run_git(repo, "rev-parse", "HEAD").strip())
            self.assertEqual(selected_metadata, (repo / ".openclaw-sync/source.json").read_bytes())
            # Existing translation lanes still fetch the newest main, without
            # changing the retirement producer's admitted checkout.
            for mode in ("full", "incremental"):
                preparation = self._retirement_cli(repo, runner, {**values, "EVENT_NAME": "workflow_dispatch", "REQUESTED_COOLDOWN_SECONDS": "0"}, "prepare.py", "--mode", mode, "--title", "Fixture translation")
                self.assertEqual(run_git(seed, "rev-parse", "HEAD").strip(), preparation["publish_ref"])
                self.assertEqual("source-b", preparation["source_sha"])
                self.assertEqual("true", preparation["should_translate"])
                self.assertEqual(selected_ref, run_git(repo, "rev-parse", "HEAD").strip())
            self._retirement_step(repo, runner, values, "Prune and package every locale")
            self._retirement_step(repo, runner, values, "Require a complete deletion-only bundle")
            for item in translation_plan.all_locales():
                self.assertTrue((repo / f"docs/{item.locale}/orphan/keep.md").is_file(), "unselected orphan must survive retirement")
                self.assertEqual(b"", (repo / f".openclaw-sync/docs-i18n-{item.locale_slug}-s0of1.txt").read_bytes())
            self.assertFalse((repo / "docs/fr/retired").exists())
            self.assertTrue((repo / "docs/fr/unrelated-empty").is_dir())
            self.assertTrue((repo / "docs/fr/never-translated").is_dir())
            self.assertFalse((repo / "not-evaluated").exists())
            selected = json.loads(Path(values["GITHUB_EVENT_PATH"]).read_text())["inputs"]["source_paths"].splitlines()
            self.assertEqual(selected, json.loads((runner / "retirements-source-paths.json").read_text()))
            summary = (runner / "summary").read_text()
            self.assertIn(f"Selected source paths: {len(selected)}", summary)
            for path in selected:
                self.assertIn(path, summary)
            self.assertEqual(selected_ref, values["steps.prepare.outputs.publish_ref"])

            # The old lane still schedules model work for stale/missing surviving
            # pages, even when the operator only needs source retirements.
            legacy = {**values, "LOCALE": "fr", "LOCALE_SLUG": "fr", "MODE": "incremental", "SHARD_INDEX": "0", "SHARD_TOTAL": "1"}
            pending_output = self._retirement_cli(repo, runner, legacy, "build_pending_manifest.py")
            self.assertGreater(int(pending_output["pending_count"]), 0)
            workflow = (REPO_ROOT / ".github/workflows/translate-retirements.yml").read_text(encoding="utf-8")
            incremental = (REPO_ROOT / ".github/workflows/translate-incremental.yml").read_text(encoding="utf-8")
            self.assertIn("- provider-preflight", incremental)
            self.assertNotIn("provider-preflight", workflow)
            self.assertNotIn("translate-locale-reusable.yml", workflow)
            self.assertNotIn("strategy:", workflow)
            self.assertRegex(workflow, r"on:\n  workflow_dispatch:\n    inputs:\n      source_paths:")
            self.assertIn("group: docs-i18n-retirements\n  cancel-in-progress: false", workflow)
            self.assertIn("ref: ${{ github.workflow_sha }}", workflow)
            self.assertEqual(["${{ github.workflow_sha }}", "main"], re.findall(r"^          ref: (.+)$", workflow, re.M))
            self.assertEqual(2, workflow.count("uses: actions/checkout@"))
            self.assertLess(workflow.index("Stage workflow scripts"), workflow.index("Check out trusted main snapshot"))
            self.assertLess(workflow.index("Check out trusted main snapshot"), workflow.index("Record checked-out source snapshot"))
            self.assertIn("needs: produce\n    uses: ./.github/workflows/translate-finalize-reusable.yml", workflow)
            self.assertNotIn("expected_locales:", workflow)  # Keep the finalizer's complete default.
            self.assertLess(workflow.index("Require a complete deletion-only bundle"), workflow.index("uses: actions/upload-artifact"))

            locales = translation_plan.all_locales()
            self.assertEqual({item.locale_slug: item.locale for item in locales}, apply_artifacts.parse_expected(apply_artifacts.DEFAULT_EXPECTED_LOCALES))
            artifacts = repo / ".openclaw-sync/artifacts"
            self.assertEqual(len(locales), len(list(artifacts.iterdir())))
            intended = {f"docs/{item.locale}/retired/old.md" for item in locales[:-1]}
            for item in locales:
                artifact = artifacts / f"{item.locale_slug}-s0of1"
                metadata = json.loads((artifact / "metadata.json").read_text())
                self.assertEqual("", metadata["failed_reason"])
                self.assertEqual(0, metadata["pending_count"])
                self.assertEqual("skipped", metadata["mdx_protected_attribute_repair_outcome"])
                self.assertEqual(b"", (artifact / "changed-files.txt").read_bytes())
                self.assertEqual([], list((artifact / "payload").rglob("*")))
                expected = [f"docs/{item.locale}/retired/old.md"] if item != locales[-1] else []
                self.assertEqual(expected, (artifact / "deleted-files.txt").read_text().splitlines())
                self.assertIn(f"- {item.locale}: {len(expected)} deletions", summary)

            consumer = runner / "consumer"
            run_git(runner, "clone", str(origin), str(consumer))
            before = self._docs_bytes(consumer)
            result = self._apply_retirement_bundle(consumer, runner, values, artifacts)
            self.assertEqual("0", result["incomplete_count"])
            self.assertEqual(str(len(intended)), result["changed_count"])
            expected_bytes = {path: content for path, content in before.items() if path not in intended}
            self.assertEqual(expected_bytes, self._docs_bytes(repo))
            self.assertEqual(expected_bytes, self._docs_bytes(consumer))
            self.assertEqual(intended, set(run_git(consumer, "diff", "--name-only", "--", "docs").splitlines()))
            self.assertEqual("", run_git(consumer, "diff", "--name-only", "--diff-filter=ACMRT", "--", "docs"))
            # Simulate the finalizer's published cleanup in the local bare origin,
            # then run the producer again: every locale must now be a valid no-op.
            run_git(consumer, "config", "user.name", "Test")
            run_git(consumer, "config", "user.email", "test@example.com")
            run_git(consumer, "config", "commit.gpgsign", "false")
            run_git(consumer, "add", "docs")
            run_git(consumer, "commit", "-m", "fixture aggregate retirements")
            run_git(consumer, "push", "origin", "main")
            shutil.rmtree(artifacts)
            self._produce_retirements(repo, runner, values)
            for item in locales:
                artifact = artifacts / f"{item.locale_slug}-s0of1"
                self.assertEqual(b"", (artifact / "deleted-files.txt").read_bytes())
                self.assertEqual(0, json.loads((artifact / "metadata.json").read_text())["deleted_count"])
            shutil.rmtree(consumer / ".openclaw-sync/current-artifacts")
            second = self._apply_retirement_bundle(consumer, runner, values, artifacts)
            self.assertEqual("0", second["incomplete_count"])
            self.assertEqual("0", second["changed_count"])
            self.assertEqual(expected_bytes, self._docs_bytes(consumer))
            self.assertFalse((runner / "forbidden-runtime-called").exists())

    def test_retirement_upload_gate_rejects_incomplete_or_non_deletion_bundles(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, runner, values, _seed, _origin = self._retirement_fixture(Path(tmp))
            self._prepare_retirements(repo, runner, values)
            event = Path(values["GITHUB_EVENT_PATH"])
            valid_event = event.read_bytes()
            outside = runner / "outside"
            outside.mkdir()
            (outside / "escape.md").write_text("outside must remain unchanged\n")
            first_locale = repo / "docs" / translation_plan.all_locales()[0].locale
            source_alias, locale_alias = repo / "docs/source-alias", first_locale / "locale-alias"
            source_alias.symlink_to(outside, target_is_directory=True)
            locale_alias.symlink_to(outside, target_is_directory=True)
            (first_locale / "directory.md").mkdir()
            before = self._docs_bytes(repo)
            directories = {path for path in (repo / "docs").rglob("*") if path.is_dir()}
            invalid = ["", " \t\r\n\n"] + [
                "retired/old.md\n" + path for path in (
                    "retired/old.md", "../escape.md", str(outside / "escape.md"), "C:/escape.md",
                    "retired//old.md", "retired/./old.md", "retired\\old.md", "zh-cn/index.md",
                    ".i18n/state.md", "concepts/.generated/state.md", "old.png", "index.md",
                    "source-alias/missing.md", "locale-alias/escape.md", "directory.md", "bad\tname.md", "bad\0name.md",
                )
            ]
            for selection in invalid:
                with self.subTest(selection=selection):
                    event.write_text(json.dumps({"inputs": {"source_paths": selection}}))
                    self._retirement_step(repo, runner, values, "Prune and package every locale", succeeds=False)
                    self.assertEqual(before, self._docs_bytes(repo), "invalid selection must fail before any deletion")
                    self.assertEqual(directories, {path for path in (repo / "docs").rglob("*") if path.is_dir()})
                    self.assertEqual("outside must remain unchanged\n", (outside / "escape.md").read_text())
                    self.assertFalse((repo / ".openclaw-sync/artifacts").exists())
            source_alias.unlink()
            locale_alias.unlink()
            (first_locale / "directory.md").rmdir()
            event.write_bytes(valid_event)
            self._retirement_step(repo, runner, values, "Prune and package every locale")
            self._retirement_step(repo, runner, values, "Require a complete deletion-only bundle")
            artifacts = repo / ".openclaw-sync/artifacts"
            artifact = artifacts / "fr-s0of1"
            originals = {path: path.read_bytes() for path in artifact.iterdir() if path.is_file()}
            empty_locale = artifacts / f"{translation_plan.all_locales()[-1].locale_slug}-s0of1"
            for field in ("source_sha", "source_repository"):
                with self.subTest(source_pair_field=field):
                    mismatch = {**values, f"steps.prepare.outputs.{field}": "mismatched"}
                    self._retirement_step(repo, runner, mismatch, "Validate selected source pair", succeeds=False)
            cases = ("missing_empty_locale", "failed", "changed_count", "changed_manifest", "pending_work", "tm_delete", "other_locale_delete", "unsafe_delete", "unselected_delete", "payload")
            for case in cases:
                with self.subTest(case=case):
                    metadata_path = artifact / "metadata.json"
                    metadata = json.loads(metadata_path.read_text())
                    if case == "missing_empty_locale":
                        empty_locale.rename(runner / empty_locale.name)
                    elif case == "failed":
                        metadata["failed_reason"] = "packaging failed"
                    elif case == "changed_count":
                        metadata["changed_count"] = 1
                    elif case == "changed_manifest":
                        (artifact / "changed-files.txt").write_text("docs/fr/index.md\n")
                    elif case == "pending_work":
                        metadata["pending_count"] = 1
                    elif case.endswith("delete"):
                        path = {"tm_delete": "docs/.i18n/fr.tm.jsonl", "other_locale_delete": "docs/de/retired/old.md", "unsafe_delete": "docs/fr/../index.md", "unselected_delete": "docs/fr/orphan/keep.md"}[case]
                        (artifact / "deleted-files.txt").write_text(path + "\n")
                    elif case == "payload":
                        (artifact / "payload/unlisted.md").write_text("unadvertised payload\n")
                    metadata_path.write_text(json.dumps(metadata))
                    try:
                        self._retirement_step(repo, runner, values, "Require a complete deletion-only bundle", succeeds=False)
                    finally:
                        for path, content in originals.items():
                            path.write_bytes(content)
                        (artifact / "payload/unlisted.md").unlink(missing_ok=True)
                        if not empty_locale.exists():
                            (runner / empty_locale.name).rename(empty_locale)

    def test_retirement_finalizer_rejects_missing_failed_and_restored_source_deletes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            repo, runner, values, seed, origin = self._retirement_fixture(Path(tmp))
            self._produce_retirements(repo, runner, values)
            source_artifacts = repo / ".openclaw-sync/artifacts"
            for case in ("missing", "failed", "wrong_source", "restored_same_source", "restored_new_source"):
                with self.subTest(case=case):
                    restored = case.startswith("restored_")
                    if restored:
                        (seed / "docs/retired").mkdir(exist_ok=True)
                        (seed / "docs/retired/old.md").write_text("# Restored English\n")
                        primary_sha = "source-a" if case == "restored_same_source" else "source-b"
                        (seed / ".openclaw-sync/source.json").write_text(json.dumps({
                            "repository": "openclaw/openclaw", "sha": primary_sha,
                            "sources": {
                                "openclaw": {"repository": "openclaw/openclaw", "sha": primary_sha},
                                "clawhub": {"repository": "openclaw/clawhub", "sha": "clawhub-restored"},
                            },
                        }) + "\n")
                        run_git(seed, "add", "docs", ".openclaw-sync/source.json")
                        run_git(seed, "commit", "-m", "restore source page")
                        run_git(seed, "push", "origin", "main")
                    consumer = runner / case
                    run_git(runner, "clone", str(origin), str(consumer))
                    before = self._docs_bytes(consumer)
                    artifacts = runner / f"{case}-artifacts"
                    shutil.copytree(source_artifacts, artifacts)
                    french = artifacts / "fr-s0of1"
                    if case == "missing":
                        shutil.rmtree(french)
                    elif case in {"failed", "wrong_source"}:
                        metadata_path = french / "metadata.json"
                        metadata = json.loads(metadata_path.read_text())
                        metadata["failed_reason" if case == "failed" else "source_sha"] = "failed" if case == "failed" else "other-source"
                        metadata_path.write_text(json.dumps(metadata))
                    elif restored:
                        # A valid update must also stay unapplied when this locale's
                        # deletion targets restored English, even with the same core SHA.
                        index_hash = hashlib.sha256((consumer / "docs/index.md").read_bytes()).hexdigest()
                        payload = french / "payload/docs/fr/index.md"
                        payload.parent.mkdir(parents=True)
                        payload.write_text(f"---\nx-i18n:\n  source_hash: {index_hash}\n---\n# Updated index\n")
                        (french / "changed-files.txt").write_text("docs/fr/index.md\n")
                        metadata_path = french / "metadata.json"
                        metadata = json.loads(metadata_path.read_text())
                        metadata["changed_count"] = 1
                        metadata_path.write_text(json.dumps(metadata))
                    result = self._apply_retirement_bundle(consumer, runner, values, artifacts)
                    self.assertGreater(int(result["incomplete_count"]), 0)
                    self.assertEqual(before["docs/fr/retired/old.md"], (consumer / "docs/fr/retired/old.md").read_bytes())
                    if restored:
                        self.assertEqual(primary_sha, result["base_source_sha"])
                        self.assertEqual("0", result["changed_count"])
                        self.assertEqual(before, self._docs_bytes(consumer))
                        self.assertIn("stale payload", (consumer / ".openclaw-sync/i18n-incomplete-locales.txt").read_text())
                    else:
                        self.assertFalse((consumer / "docs/de/retired/old.md").exists())
                    for item in translation_plan.all_locales():
                        for rel in (f"docs/{item.locale}/orphan/keep.md", f"docs/{item.locale}/index.md", f"docs/.i18n/{item.locale}.tm.jsonl"):
                            self.assertEqual(before[rel], (consumer / rel).read_bytes())

    def _retirement_fixture(self, root: Path):
        seed = root / "seed"
        seed.mkdir()
        self._repo_with_source(str(seed))
        for item in translation_plan.all_locales():
            locale = seed / "docs" / item.locale
            locale.mkdir()
            (locale / "index.md").write_text(f"# Surviving {item.locale}\n\n[Still linked](orphan/keep.md)\n")
            (locale / "orphan").mkdir()
            (locale / "orphan/keep.md").write_text(f"# Unselected orphan {item.locale}\n")
            if item != translation_plan.all_locales()[-1]:
                (locale / "retired").mkdir()
                (locale / "retired/old.md").write_text(f"# Retired {item.locale}\n")
            tm = seed / f"docs/.i18n/{item.locale}.tm.jsonl"
            tm.parent.mkdir(exist_ok=True)
            tm.write_bytes(b'{"unchanged":"memory"}\n')
        run_git(seed, "add", "docs")
        run_git(seed, "commit", "-m", "stale locale fixtures")
        origin = root / "origin.git"
        run_git(root, "init", "--bare", "-b", "main", str(origin))
        run_git(seed, "remote", "add", "origin", str(origin))
        run_git(seed, "push", "origin", "main")
        repo = root / "producer"
        run_git(root, "clone", str(origin), str(repo))
        (repo / "docs/fr/unrelated-empty").mkdir()
        (repo / "docs/fr/never-translated").mkdir()
        runner = root / "runner"
        runner.mkdir()
        scripts = repo / ".openclaw-sync/workflow-ref/.github/scripts/i18n"
        shutil.copytree(SCRIPT_DIR, scripts)
        # Block runtime entry points without changing any production script.
        commands = runner / "bin"
        commands.mkdir()
        (commands / "python").symlink_to(sys.executable)
        for command in ("node", "npm", "go", "codex"):
            executable = commands / command
            executable.write_text('#!/bin/sh\ntouch "$RUNNER_TEMP/forbidden-runtime-called"\nexit 99\n')
            executable.chmod(0o755)
        values = {"PATH": f"{commands}{os.pathsep}{os.environ['PATH']}", "RUNNER_TEMP": str(runner), "github.event_name": "workflow_dispatch"}
        event = runner / "event.json"
        event.write_text(json.dumps({"inputs": {"source_paths": "retired/old.md\r\nnever-translated/missing.mdx\r\nretired/$(touch not-evaluated).md\r\n"}}))
        values["GITHUB_EVENT_PATH"] = str(event)
        return repo, runner, values, seed, origin

    def _retirement_step(self, repo: Path, runner: Path, values: dict[str, str], name: str, *, succeeds: bool = True, workflow_name: str = "translate-retirements.yml"):
        workflow = REPO_ROOT / ".github/workflows" / workflow_name
        blocks = [block for block in re.split(r"(?m)^      - name: ", workflow.read_text())[1:] if "        run: |\n" in block]
        shells = runner / "shells"
        shells.mkdir(exist_ok=True)
        extracted = workflow_shell_check.extract_run_blocks(workflow, shells)
        index = next(index for index, block in enumerate(blocks) if block.splitlines()[0] == name)
        step_env = {}
        for key, raw in re.findall(r"^          (\w+): (.+)$", blocks[index].split("        run: |\n")[0], re.M):
            step_env[key] = values[raw[3:-2].strip()] if raw.startswith("${{") else json.loads(raw) if raw.startswith('"') else raw
        output = runner / "output"
        github_env = runner / "env"
        output.write_text("")
        github_env.write_text("")
        process_env = {**os.environ, **values, **step_env, "GITHUB_WORKSPACE": str(repo), "GITHUB_OUTPUT": str(output), "GITHUB_ENV": str(github_env), "GITHUB_STEP_SUMMARY": str(runner / "summary")}
        result = subprocess.run(["bash", str(extracted[index])], cwd=repo, env=process_env, text=True, capture_output=True, timeout=60)
        if succeeds:
            self.assertEqual(0, result.returncode, f"{name}: {result.stdout}\n{result.stderr}")
        else:
            self.assertNotEqual(0, result.returncode, f"{name} unexpectedly succeeded")
        values.update(dict(line.split("=", 1) for line in github_env.read_text().splitlines()))
        outputs = dict(line.split("=", 1) for line in output.read_text().splitlines())
        step_id = re.search(r"^        id: (\w+)$", blocks[index], re.M)
        if step_id:
            values.update({f"steps.{step_id[1]}.outputs.{key}": value for key, value in outputs.items()})
        return result

    def _prepare_retirements(self, repo: Path, runner: Path, values: dict[str, str]) -> None:
        self._retirement_step(repo, runner, values, "Stage workflow scripts")
        workflow = (REPO_ROOT / ".github/workflows/translate-retirements.yml").read_text()
        checkout = workflow.split("      - name: Check out trusted main snapshot\n", 1)[1].split("      - name:", 1)[0]
        ref = re.search(r"^          ref: (.+)$", checkout, re.M)[1]
        self.assertEqual("main", ref)
        # Simulate actions/checkout against the fixture's local bare origin,
        # at the workflow's checkout boundary, before the actual prepare shell.
        run_git(repo, "fetch", "origin", f"{ref}:refs/remotes/origin/{ref}")
        run_git(repo, "checkout", "-B", ref, f"refs/remotes/origin/{ref}")
        self._retirement_step(repo, runner, values, "Record checked-out source snapshot")
        self._retirement_step(repo, runner, values, "Validate selected source pair")
        self._retirement_step(repo, runner, values, "Plan one shard for every canonical locale")

    def _produce_retirements(self, repo: Path, runner: Path, values: dict[str, str]) -> None:
        self._prepare_retirements(repo, runner, values)
        self._retirement_step(repo, runner, values, "Prune and package every locale")
        self._retirement_step(repo, runner, values, "Require a complete deletion-only bundle")

    def _retirement_cli(self, repo: Path, runner: Path, values: dict[str, str], script: str, *args: str) -> dict[str, str]:
        output = runner / "cli-output"
        output.write_text("")
        process_env = {**os.environ, **values, "GITHUB_WORKSPACE": str(repo), "GITHUB_OUTPUT": str(output), "GITHUB_STEP_SUMMARY": str(runner / "summary")}
        result = subprocess.run([sys.executable, str(SCRIPT_DIR / script), *args], cwd=repo, env=process_env, text=True, capture_output=True, timeout=60)
        self.assertEqual(0, result.returncode, f"{script}: {result.stdout}\n{result.stderr}")
        return dict(line.split("=", 1) for line in output.read_text().splitlines())

    def _apply_retirement_bundle(self, repo: Path, runner: Path, values: dict[str, str], artifacts: Path) -> dict[str, str]:
        current = repo / ".openclaw-sync/current-artifacts"
        if not current.exists():
            shutil.copytree(artifacts, current / "i18n-retirements-source-a")
        merged = repo / ".openclaw-sync/i18n-artifacts"
        self._retirement_cli(repo, runner, values, "merge_artifact_roots.py", "--current-root", str(current), "--output-root", str(merged))
        return self._retirement_cli(repo, runner, values, "apply_artifacts.py", "--source-sha", values["steps.prepare.outputs.source_sha"], "--mode", "retirements", "--shard-total", "1", "--artifacts-root", str(merged))

    @staticmethod
    def _docs_bytes(repo: Path) -> dict[str, bytes]:
        return {path.relative_to(repo).as_posix(): path.read_bytes() for path in (repo / "docs").rglob("*") if path.is_file()}

    @staticmethod
    def _translated_page(source: Path, body: str) -> str:
        source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
        return f"---\nx-i18n:\n  source_hash: {source_hash}\n---\n\n{body}"

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
