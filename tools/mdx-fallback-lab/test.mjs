import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { checkContent } from "./checker.mjs";
import { runFixture } from "./index.mjs";
import { buildRepairPrompt, ROUND_INSTRUCTION } from "./action.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const FIXTURE_ROOT = path.join(ROOT, ".github/scripts/i18n/tests/fixtures/mdx-relay");
const manifest = JSON.parse(await fs.readFile(path.join(FIXTURE_ROOT, "fixture-manifest.json"), "utf8"));
const taxonomy = manifest.fixtures.find((f) => f.id.includes("taxonomy"));
const anthropic = manifest.fixtures.find((f) => f.id.includes("plugin-html"));
const thresholds = { min_retention_ratio: 0.9, max_deleted_run_lines: 20, max_tail_deletion_ratio: 0.08, max_bulk_deletion_ratio: 0.1 };
const config = { hardTimeoutMs: 5000, maxAttempts: 2, checker: thresholds, auxiliaryMode: "none", auxiliaryVersion: null, actionVersion: "test" };

test("checker permits a one-phrase/punctuation difference", async () => {
  const source = await fs.readFile(path.join(FIXTURE_ROOT, taxonomy.path), "utf8");
  const changed = source.replace("成熟度分类法", "成熟度分类法。");
  assert.equal(checkContent(source, changed, thresholds).result, "pass");
});

test("checker rejects a deleted Accordion and final outcome is not success", async () => {
  const result = await runFixture(taxonomy, { config, variant: "taxonomy-delete-accordion" });
  assert.equal(result.record.checker_result, "fail");
  assert.notEqual(result.record.final_outcome, "success");
  assert.ok(result.feedback.length >= 1);
});

test("checker rejects anthropic fixture reduced to empty frontmatter", async () => {
  const result = await runFixture(anthropic, { config, variant: "anthropic-empty-frontmatter" });
  assert.equal(result.record.checker_result, "fail");
  assert.notEqual(result.record.final_outcome, "success");
});

test("default checker configuration fails closed", () => {
  assert.equal(checkContent("---\na: b\n---\nbody", "---\na: b\n---\nbody", null).result, "fail");
});

test("checker rejects a literal whole-file deletion and final outcome is not success", async () => {
  const source = await fs.readFile(path.join(FIXTURE_ROOT, taxonomy.path), "utf8");
  // A zero-byte whole-file deletion candidate must fail closed at the checker gate.
  const empty = checkContent(source, "", thresholds);
  assert.equal(empty.result, "fail");
  assert.equal(empty.violations[0].code, "empty_output");
  // "anthropic-empty-frontmatter" strips any source to frontmatter-only (zero body), so on the
  // taxonomy fixture it drives a whole-page deletion candidate through the repair loop.
  const result = await runFixture(taxonomy, { config, variant: "anthropic-empty-frontmatter" });
  assert.equal(result.record.checker_result, "fail");
  assert.notEqual(result.record.final_outcome, "success");
  assert.ok(result.feedback.length >= 1);
});

test("enhanced mock repairs both real fixtures through strict parser", async () => {
  for (const fixture of [anthropic, taxonomy]) {
    const result = await runFixture(fixture, { config });
    assert.equal(result.record.final_outcome, "success");
    assert.equal(result.record.parser_outcome, "compile_success");
    assert.equal(result.record.checker_result, "pass");
    assert.deepEqual(result.record.repair_stage_order, ["parser", "auxiliary", "codex", "checker", "scope", "protected_attribute", "recheck", "artifact"]);
  }
});

test("no-assistance preserves both real parser failures", async () => {
  for (const fixture of [anthropic, taxonomy]) {
    const result = await runFixture(fixture, { arm: "no_assistance", config });
    assert.equal(result.record.parser_outcome, "compile_failure");
    assert.equal(result.record.final_outcome, "final_failure");
    assert.equal(result.record.repair_attempts, null);
  }
});

test("unimplemented auxiliary arms fail closed before Codex", async () => {
  for (const auxiliaryMode of ["prettier", "pr153"]) {
    const result = await runFixture(anthropic, { config: { ...config, auxiliaryMode, auxiliaryVersion: "probe" } });
    assert.equal(result.record.final_outcome, "final_failure");
    assert.equal(result.record.skip_reason, "auxiliary_not_implemented");
    assert.equal(result.record.error.source, "auxiliary");
    assert.equal(result.record.codex_session, null);
    assert.equal(result.record.repair_attempts, null);
  }
});

test("relay protocol: round feedback and repair prompt carry multi-round relay wording", async () => {
  const result = await runFixture(taxonomy, { config, variant: "taxonomy-delete-accordion" });
  assert.ok(result.feedback.length >= 1);
  for (const entry of result.feedback) assert.equal(entry.instruction, ROUND_INSTRUCTION);
  const prompt = buildRepairPrompt({ file: "candidate.md", failureClass: taxonomy.failure_class, diagnostics: [{ source: "mdast-util-mdx-jsx", line: 1416, column: 339 }], reason: "Unexpected closing tag `</div>`, expected corresponding closing tag for `<span>`" });
  assert.match(prompt, /fix all parser\/checker diagnostics reported for this round/);
  assert.match(prompt, /continue fixing the remaining diagnostics until the page passes strict MDX compilation/);
  assert.match(prompt, /newly reported in this round's feedback is in scope/);
  assert.match(prompt, /must_preserve/);
  assert.match(prompt, /do not rewrite the whole page/);
  assert.match(prompt, /"line":1416/);
});

test("relay protocol: mock rounds feed forward current diagnostics until strict compile passes", async () => {
  const result = await runFixture(taxonomy, { config: { ...config, maxAttempts: 4 } });
  assert.equal(result.record.final_outcome, "success");
  assert.equal(result.record.parser_outcome, "compile_success");
  assert.ok(result.record.rounds >= 1 && result.record.rounds <= 4);
});
