# Frozen MDX repair fixtures

Portable inputs for the repair lab and independent validation workflow. These
snapshots come from public docs translation run
[27629404260](https://github.com/openclaw/docs/actions/runs/27629404260).
They are test data, not pages to publish or source docs to edit.

- `fixture-manifest.json` records original provenance, failure class, compiler
  location, SHA-256 and preservation expectations.
- `fixtures/zh-CN/` preserves the exact original bytes, including known errors.
- `repaired-references/` contains the final September 4 real Codex outputs,
  with selected result metadata. Raw model logs, profile paths and session
  identifiers are omitted; document payloads remain unchanged.
- `strict-mdx-oracle.mjs` compiles whole files with `@mdx-js/mdx@3.1.1`.
  Original inputs must fail at their recorded locations; repaired references
  must pass. A passing replay does not invoke a model or measure repair latency.

The two final real repairs each used one round. See the
[handoff](../../../../../../docs/.i18n/mdx-repair-handoff.md) for measured
latency, historical runner evidence and remaining production validation.
