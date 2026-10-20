# MDX repair relay handoff

Updated: 2026-10-20. Status: **local implementation and historical runner drill
complete; integration with current main and production acceptance incomplete**.
This draft preserves the existing history without rebasing. Do not treat it as
ready to merge or deploy.

## Read first

The old local `plans/i18n-codex-mdx-fallback` tree contained two incompatible
progress views: v1 was blocked, while v2 marked eight stories complete. The v2
completion meant implementation and drill acceptance, with production follow-up
left open. Neither view establishes deployment. This document supersedes both
for handoff; local agent state, transcripts and raw process logs are not needed
to resume and are not included.

At handoff, main was inspected at `13fb3492f2` (abbreviated revision).
[PR #153](https://github.com/openclaw/docs/pull/153) merged a revised deterministic
syntax-recovery implementation on September 7; it did not land this branch's
multi-round relay. Main still used a single Codex repair/recheck path.
[PR #202](https://github.com/openclaw/docs/pull/202) merged September 24 and avoids
retranslating unchanged pages by default. Preserve that newer selection/resume
contract when integrating this older branch.

## Implementation and decisions to preserve

- Enhance the existing Codex repair action, with at most four sequential rounds;
  each later round consumes diagnostics from the previous external check. This
  is one logical repair path, not a second independent model/API integration.
- D-09 selected the Codex-only enhancement; no formatter is a default dependency.
  D-10 selected 600 seconds per round, at most four rounds, with 12-minute action
  step timeouts. The 300-second local experiment remains evidence, not the final
  workflow budget. These are branch decisions, not current-main defaults.
- The compiler is the oracle. Model exit success alone cannot accept output.
  Keep path enforcement, catastrophic-content checks and protected-attribute
  validation. The content check does not prove translation equivalence.
- Package passing pages when a page cannot be repaired, record failed paths,
  and preserve the explicit failure result. Infrastructure failures still fail
  the shard. The finalizer must understand this partial-success contract.
- The reusable worker defaults `mdx_repair_enabled` to false. Enablement also
  requires canary locale/path selection and a successful validation gate.
  Current callers require explicit integration; merging does not activate it.

Key code:

- `.github/scripts/i18n/mdx_repair_relay.py`: relay decisions, snapshots and reports.
- `.github/scripts/i18n/mdx_repair_canary.py`: canary and release checks.
- `.github/scripts/i18n/package_artifact.py` and `apply_artifacts.py`: partial results.
- `.github/workflows/translate-locale-reusable.yml`: repair and publication wiring.
- `.github/workflows/mdx-repair-validation.yml`: offline and opt-in real validation.
- `tools/mdx-fallback-lab/`: standalone experiment and behavioral tests.
- [Canary operations](mdx-repair-canary-operations.md): existing branch drill procedure.

## Historical evidence and its limits

The tracked [fixture archive](../../.github/scripts/i18n/tests/fixtures/mdx-relay/README.md)
contains two actual pipeline failures from run `27629404260`, their byte hashes
and diagnostics, and the successful September 4 repair payloads. Payloads are
public documentation snapshots, not fresh translations. Archived model stdout,
stderr, session identifiers and machine-specific configuration were omitted.

| Evidence | Observed result |
| --- | --- |
| HTML-comment fixture, local real Codex | strict compile pass, 1 round, 70,743 ms |
| Taxonomy mismatched tags, local real Codex | strict compile pass, 1 round, 166,576 ms |

Both used `gpt-5.6-sol` / `high`, a 300-second per-round budget, and no auxiliary
repairer. The two successes do not demonstrate successful real rounds 2–4 or a
production repair rate. Earlier experiments did consume two real attempts
(comment success; taxonomy still failed on a second pre-existing diagnostic),
before the broadened diagnostic protocol produced the final successes above.
Those earlier raw runs are not part of this portable archive.

Historical GitHub drill:
[33935656061](https://github.com/openclaw/docs/actions/runs/33935656061), September 5:
offline checks, real frozen-fixture repair and isolated single-page translation
passed; final publication was skipped. The recorded runner repair used
`gpt-5.6` / `xhigh` with the branch's 600-second / four-round budget. Artifact
retention may have expired; the URL is provenance, not a promise that artifacts
remain downloadable. The archived local payloads remain independently replayable.

The drill fixed an incompatible `--full-auto` invocation, a source-revision
race, Go-version drift and a missing `tsx` dependency. Main independently fixed
its obsolete flag in #138. Reconcile current dependencies rather than restoring
the old branch pins wholesale.

## Reproduce without local planning files

Use the repository's Node 22 toolchain and install its declared dependencies
with `npm ci`. The strict oracle requires `@mdx-js/mdx@3.1.1`; the workflow shell
check also requires the declared YAML parser. Then run from the repository root:

```sh
python .github/scripts/i18n/tests/test_i18n_scripts.py
npm test --prefix tools/mdx-fallback-lab
python .github/scripts/i18n/workflow_shell_check.py
python .github/scripts/i18n/budget_check.py
python .github/scripts/i18n/mdx_repair_validation.py oracle-gate --output-dir .local/mdx-handoff-check
python .github/scripts/i18n/mdx_repair_validation.py single-entry --output-dir .local/mdx-handoff-check
```

The oracle gate must see the two original pages fail with their archived
locations/hashes and the two archived repairs compile successfully. This is
parser replay, not a new model run. Ordinary tests use mock repair and need no
credentials. Output under `.local/` is disposable and ignored locally; remove it
after inspection. A fresh clone may not have the local ignore rule, so do not
add verification output to commits.

For a real local experiment, explicitly set `MDX_LAB_REAL_CODEX=1`,
`MDX_LAB_CODEX_HOME` to the chosen authenticated profile, the available
`MDX_LAB_MODEL` and `MDX_LAB_EFFORT`, `HARD_TIMEOUT_MS`, `MAX_ATTEMPTS`, and
`CHECKER_CONFIG`. Read `tools/mdx-fallback-lab/index.mjs` and `action.mjs` before
running; the historical profile/model defaults are not portable. Use
`MDX_LAB_EVIDENCE` to send new results to a disposable directory, rather than
replace archived evidence. The GitHub validation workflow's real mode is also
explicit opt-in and may need current toolchain/model pins.

## Handoff verification (2026-10-20)

The 158 Python control-plane regressions and 10 Node lab tests passed. Workflow
shell syntax, the nine-worker concurrency budget, the strict oracle gate and
the single-entry audit passed. A temporary export of the staged tracked tree,
with dependencies supplied from the installed Node modules, passed all 10 lab
tests and the oracle gate without any local `plans/` tree. Original fixture
bytes and repaired payloads matched their historical sources; Gitleaks found
no secrets in the portable archive. No new real model run or live publication
was triggered during this handoff. This is branch validation, not validation
against today's main.

Independent review of the handoff delta used the repo-local `autoreview`
helper (`--mode local --engine codex`, configured `gpt-5.6-terra` / `xhigh`)
and returned no actionable findings. The large snapshot commit was verified
separately by byte comparison, secret scan and parser replay; the review does
not certify the inherited implementation or its integration with current main.

## Remaining work, in order

1. Integrate with current main in the receiving environment. Resolve workflow,
   source-sync prompt, deterministic repair and artifact/finalizer conflicts;
   preserve #202's changed/missing/forced selection and resume receipts. No
   rebase, merge or current-main compatibility claim was made during handoff.
2. Reconcile `.openclaw-sync/docs-mdx-repair.md` with its owner in
   `openclaw/openclaw`. This branch contains a historical prompt edit; copying
   only the publish mirror is insufficient because source sync can overwrite it.
3. Re-run offline checks on the integrated revision, then run real fixture
   validation with the actual production CLI/model. Collect successful real
   rounds 2–4 and budget-exhaustion evidence when available; those paths lack
   final-protocol real-run proof and are currently covered only by simulations.
4. Wire canary inputs in the intended caller; run a real publication with
   `commit_locale=true`. Inspect `canary-release-summary`, published page/R2
   smoke results and rollback. The September drill did not exercise live commit
   or publication.
5. Confirm successful pages survive partial failures end to end, inspect logs
   for retained per-page diagnostics, and observe repair rate/cost on real runs.
   Update this status only after production acceptance.

Separately, the October 18 full run
[39093742658](https://github.com/openclaw/docs/actions/runs/39093742658) was still
running with failed shards at inspection on October 20. Recheck its current
status in the receiving environment; it is not proof for this branch.
