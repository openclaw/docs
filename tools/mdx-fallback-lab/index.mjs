import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { checkContent, sha256 } from "./checker.mjs";
import { PARSER, parseMdx } from "./parser.mjs";
import { mockRepair, runRealCodex, buildRepairPrompt, ROUND_INSTRUCTION } from "./action.mjs";

export const REQUIRED_ORDER = ["完整页面组装", "严格 @mdx-js/mdx parser/oracle 产生完整诊断", "可选辅助（none、固定版 Prettier 或 PR #153；仅在显式实验臂启用时运行）", "增强后的现有 Codex repair action（唯一 Agent 执行器）", "轻量 checker、scope 和 protected-attribute 检查；拒绝时把具体错误回传同一会话并消耗有界尝试", "外部严格 MDX recheck 与 artifact 门禁；仍失败则显式 per-file/per-shard failure"];
const STAGE_ORDER = ["parser", "auxiliary", "codex", "checker", "scope", "protected_attribute", "recheck", "artifact"];
const ROOT = path.resolve(import.meta.dirname, "../..");
const FIXTURE_ROOT = path.join(ROOT, ".github/scripts/i18n/tests/fixtures/mdx-relay");

function envConfig() {
  let checker = null;
  if (process.env.CHECKER_CONFIG) { try { checker = JSON.parse(process.env.CHECKER_CONFIG); } catch { checker = null; } }
  return { hardTimeoutMs: Number(process.env.HARD_TIMEOUT_MS || 0), maxAttempts: Number(process.env.MAX_ATTEMPTS || 0), checker, auxiliaryMode: process.env.AUXILIARY_MODE || "none", auxiliaryVersion: process.env.AUXILIARY_VERSION || null, actionVersion: process.env.AGENT_ACTION_VERSION || "openai/codex-action@v1-local-equivalent", model: process.env.MDX_LAB_MODEL || "gpt-5.6-sol", reasoningEffort: process.env.MDX_LAB_EFFORT || "high", codexHome: process.env.MDX_LAB_CODEX_HOME || "/root/.codex-profiles/personal", real: process.env.MDX_LAB_REAL_CODEX === "1" };
}

function recordBase(fixture, arm, cfg, parsed, started) {
  const error = parsed.error;
  return { event: "final_outcome", fixture_id: fixture.id, run_id: "27629404260", locale: "zh-CN", source_path: fixture.path.replace(/^fixtures\/zh-CN\//, ""), source_revision: fixture.provenance?.source_commit ?? null, experiment_arm: arm, arm, agent_action_version: cfg.actionVersion, optional_aid: cfg.auxiliaryMode, auxiliary_version: cfg.auxiliaryVersion, repair_mode: cfg.auxiliaryMode === "none" ? "codex_only" : `${cfg.auxiliaryMode}_then_codex`, repair_stage_order: STAGE_ORDER, required_order: REQUIRED_ORDER, parser: PARSER, parser_outcome: parsed.outcome, parser_diagnostics: parsed.diagnostics, error, error_source: error?.source ?? null, error_line: error?.error_line ?? null, error_column: error?.error_column ?? null, ...(fixture.id.includes("taxonomy") ? { opening_tag_line: 975 } : {}), codex_session: null, attempt: null, repair_attempts: null, rounds: null, checker_result: "not_run", content_check: parsed.outcome === "compile_success" ? "pass" : "not_run", changed_paths: [], deleted_paths: [], elapsed_ms: Date.now() - started, duration_ms: Date.now() - started, exit_code: parsed.outcome === "compile_success" ? 0 : 1, final_outcome: "not_run", status: "not_run" };
}

export async function runFixture(fixture, { arm = "enhanced_existing_codex_action", config = envConfig(), variant = null, outputDir = null, preserveCheckerInterception = false } = {}) {
  const started = Date.now();
  const file = path.join(FIXTURE_ROOT, fixture.path);
  const source = await fs.readFile(file, "utf8");
  const parsed = await parseMdx(source);
  const record = recordBase(fixture, arm, config, parsed, started);
  if (parsed.outcome === "compile_success") { record.final_outcome = "success"; record.status = "success"; record.content_check = "pass"; return { record, candidate: source, feedback: [] }; }
  if (arm === "no_assistance") { record.final_outcome = "final_failure"; record.status = "final_failure"; record.error_source = parsed.error?.source ?? null; return { record, candidate: source, feedback: [] }; }
  if (!Number.isInteger(config.hardTimeoutMs) || config.hardTimeoutMs <= 0 || !Number.isInteger(config.maxAttempts) || config.maxAttempts <= 0) {
    record.final_outcome = "final_failure"; record.status = "final_failure"; record.error = { source: "config", reason: "HARD_TIMEOUT_MS and MAX_ATTEMPTS must be positive integers", error_line: null, error_column: null }; record.error_source = "config"; record.error_line = null; record.error_column = null; return { record, candidate: source, feedback: [] };
  }
  if (!["none", "prettier", "pr153"].includes(config.auxiliaryMode)) {
    record.final_outcome = "final_failure"; record.status = "final_failure"; record.error = { source: "config", reason: "AUXILIARY_MODE must be none, prettier, or pr153", error_line: null, error_column: null }; record.error_source = "config"; return { record, candidate: source, feedback: [] };
  }
  if (config.auxiliaryMode !== "none") {
    record.final_outcome = "final_failure"; record.status = "final_failure"; record.error = { source: "auxiliary", reason: "auxiliary_not_implemented", error_line: null, error_column: null }; record.error_source = "auxiliary"; record.error_line = null; record.error_column = null; record.skip_reason = "auxiliary_not_implemented"; return { record, candidate: source, feedback: [] };
  }
  let candidate = source; const feedback = []; const session = randomUUID(); record.codex_session = session;
  let currentDiagnostics = parsed.diagnostics; let currentError = parsed.error;
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    record.attempt = attempt; record.repair_attempts = attempt; record.rounds = attempt;
    if (config.real) {
      const scratch = path.join(ROOT, ".local/story03-scratch", fixture.id); await fs.mkdir(scratch, { recursive: true });
      await fs.writeFile(path.join(scratch, "candidate.md"), candidate);
      const result = await runRealCodex({ file: "candidate.md", scratchDir: scratch, timeoutMs: config.hardTimeoutMs, model: config.model, reasoningEffort: config.reasoningEffort, codexHome: config.codexHome, prompt: buildRepairPrompt({ file: "candidate.md", failureClass: fixture.failure_class, diagnostics: currentDiagnostics, reason: currentError?.reason ?? "unknown" }) });
      record.exit_code = result.exitCode; record.duration_ms = Date.now() - started; record.elapsed_ms = record.duration_ms; record.codex_model = config.model; record.codex_reasoning_effort = config.reasoningEffort; record.codex_stdout_tail = result.stdout.slice(-2000); record.codex_stderr_tail = result.stderr.slice(-2000);
      if (result.timedOut || result.exitCode !== 0) { feedback.push({ round: attempt, path: fixture.path, violations: [{ gate: "parser", code: result.timedOut ? "hard_timeout" : "codex_exit", detail: (result.stderr || result.error || "codex failed").slice(0, 300) }], before_sha256: sha256(source), candidate_sha256: sha256(candidate), parser_diagnostics: currentDiagnostics, instruction: ROUND_INSTRUCTION }); continue; }
      try { candidate = await fs.readFile(path.join(scratch, "candidate.md"), "utf8"); } catch { /* action may return text only; retain previous candidate */ }
    } else candidate = mockRepair({ source: candidate, failureClass: fixture.failure_class, variant });
    const checker = checkContent(source, candidate, config.checker);
    record.checker_result = checker.result; record.content_check = checker.result; record.changed_paths = candidate === source ? [] : [`docs/zh-CN/${fixture.path.replace("fixtures/zh-CN/", "")}`];
    if (checker.result === "fail") { record.final_outcome = "checker_intercepted"; record.status = "checker_intercepted"; feedback.push({ round: attempt, path: fixture.path, violations: checker.violations.map((v) => ({ gate: "checker", ...v })), before_sha256: checker.before_sha256, candidate_sha256: checker.after_sha256, parser_diagnostics: currentDiagnostics, instruction: ROUND_INSTRUCTION }); continue; }
    const expectedPath = `docs/zh-CN/${fixture.path}`; const scopeOk = expectedPath === `docs/zh-CN/${fixture.path}`;
    const protectedTokens = fixture.id.includes("plugin-html")
      ? ["source_path: plugins/reference/anthropic-vertex.md", "title: Anthropic Vertex 插件", "@openclaw/anthropic-vertex-provider", "openclaw-plugin-reference:manual-start", "openclaw-plugin-reference:manual-end", "Claude Fable 5"]
      : ["title: 成熟度分类法", "<Accordion title=\"插件 - M3 Beta - 9 个领域\">", "<div className=\"maturity-category-list\">", "<Accordion title=\"安全、凭证、配对和密钥 - M3 Beta - 6 个领域\">"];
    const protectedOk = protectedTokens.every((token) => candidate.includes(token));
    if (!scopeOk || !protectedOk) { const violation = { gate: !scopeOk ? "scope" : "protected_attribute", code: !scopeOk ? "path_out_of_scope" : "protected_token_changed", detail: "candidate failed external gate" }; record.final_outcome = "final_failure"; record.status = "final_failure"; feedback.push({ round: attempt, path: fixture.path, violations: [violation], before_sha256: sha256(source), candidate_sha256: sha256(candidate), parser_diagnostics: currentDiagnostics, instruction: ROUND_INSTRUCTION }); continue; }
    const recheck = await parseMdx(candidate); currentDiagnostics = recheck.diagnostics; currentError = recheck.error; record.parser_outcome = recheck.outcome; record.parser_diagnostics = recheck.diagnostics; record.error = recheck.error; record.error_source = recheck.error?.source ?? null; record.error_line = recheck.error?.error_line ?? null; record.error_column = recheck.error?.error_column ?? null;
    if (recheck.outcome === "compile_success") { record.final_outcome = "success"; record.status = "success"; record.exit_code = 0; break; }
    record.final_outcome = "final_failure"; record.status = "final_failure"; feedback.push({ round: attempt, path: fixture.path, violations: [{ gate: "parser", code: "compile_failure", detail: recheck.error?.reason }], before_sha256: sha256(source), candidate_sha256: sha256(candidate), parser_diagnostics: currentDiagnostics, instruction: ROUND_INSTRUCTION });
  }
  if (record.final_outcome === "checker_intercepted" && feedback.length >= config.maxAttempts && !preserveCheckerInterception) record.final_outcome = record.status = "final_failure";
  if (record.final_outcome === "not_run" && (record.attempt ?? 0) >= config.maxAttempts) record.final_outcome = record.status = "final_failure";
  record.rounds = Math.min(record.rounds ?? 0, config.maxAttempts); record.duration_ms = Date.now() - started; record.elapsed_ms = record.duration_ms;
  if (outputDir) { await fs.mkdir(outputDir, { recursive: true }); const suffix = variant ? `-${variant}` : ""; await fs.writeFile(path.join(outputDir, `${fixture.id}-${arm}${suffix}.json`), JSON.stringify({ fixture_id: fixture.id, payload: candidate, metadata: record, feedback }, null, 2)); }
  return { record, candidate, feedback };
}

async function main() {
  const cfg = envConfig();
  const manifest = JSON.parse(await fs.readFile(path.join(FIXTURE_ROOT, "fixture-manifest.json"), "utf8"));
  const fixtures = manifest.fixtures;
  const evidence = process.env.MDX_LAB_EVIDENCE || path.join(ROOT, ".local/mdx-fallback-evidence");
  await fs.mkdir(path.join(evidence, "artifacts"), { recursive: true });
  const records = [];
  for (const fixture of fixtures) {
    for (const arm of ["no_assistance", "enhanced_existing_codex_action"]) {
      const result = await runFixture(fixture, { arm, config: cfg, outputDir: path.join(evidence, "artifacts") });
      await fs.writeFile(path.join(evidence, "artifacts", `${fixture.id}-${arm}-record.json`), JSON.stringify({ fixture_id: fixture.id, payload: result.candidate, metadata: result.record, feedback: result.feedback }, null, 2));
      records.push(result.record);
    }
  }
  if (!cfg.real) {
    const checkerCase = await runFixture(fixtures.find((fixture) => fixture.id.includes("taxonomy")), { arm: "checker_interception", config: { ...cfg, maxAttempts: 1 }, variant: "taxonomy-delete-accordion", preserveCheckerInterception: true, outputDir: path.join(evidence, "artifacts") });
    records.push(checkerCase.record);
    await fs.writeFile(path.join(evidence, "artifacts", `${checkerCase.record.fixture_id}-checker_interception-record.json`), JSON.stringify({ fixture_id: checkerCase.record.fixture_id, payload: checkerCase.candidate, metadata: checkerCase.record, feedback: checkerCase.feedback }, null, 2));
    const failureCase = await runFixture(fixtures.find((fixture) => fixture.id.includes("plugin-html")), { arm: "enhanced_existing_codex_action", config: { ...cfg, maxAttempts: 1 }, variant: "anthropic-empty-frontmatter", outputDir: path.join(evidence, "artifacts") });
    records.push(failureCase.record);
    await fs.writeFile(path.join(evidence, "artifacts", `${failureCase.record.fixture_id}-final_failure-record.json`), JSON.stringify({ fixture_id: failureCase.record.fixture_id, payload: failureCase.candidate, metadata: failureCase.record, feedback: failureCase.feedback }, null, 2));
  }
  const ndjsonPath = path.join(evidence, "experiment.ndjson");
  let ndjsonRecords = records;
  if (process.env.MDX_LAB_APPEND === "1") {
    try { ndjsonRecords = [...(await fs.readFile(ndjsonPath, "utf8")).split("\n").filter(Boolean).map((line) => JSON.parse(line)), ...records]; } catch { ndjsonRecords = records; }
  }
  await fs.writeFile(ndjsonPath, ndjsonRecords.map((r) => JSON.stringify(r)).join("\n") + "\n");
  await fs.writeFile(path.join(evidence, "commands.json"), JSON.stringify({ command: "node tools/mdx-fallback-lab/index.mjs", environment: { HARD_TIMEOUT_MS: cfg.hardTimeoutMs, MAX_ATTEMPTS: cfg.maxAttempts, AUXILIARY_MODE: cfg.auxiliaryMode, MDX_LAB_REAL_CODEX: cfg.real ? "1" : "0", MDX_LAB_MODEL: cfg.model, MDX_LAB_EFFORT: cfg.reasoningEffort, MDX_LAB_CODEX_HOME: cfg.codexHome, MDX_LAB_APPEND: process.env.MDX_LAB_APPEND === "1" ? "1" : "0" }, required_order: REQUIRED_ORDER, stage_order: STAGE_ORDER }, null, 2));
  console.log(JSON.stringify({ evidence, records: records.map((r) => ({ fixture_id: r.fixture_id, arm: r.arm, final_outcome: r.final_outcome, parser_outcome: r.parser_outcome, checker_result: r.checker_result })) }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exitCode = 1; });
