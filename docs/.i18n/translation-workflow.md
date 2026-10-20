# Translation workflow

Internal note for the docs publish pipeline. This file is under `docs/.i18n`, which is ignored by the docs-site build and is not published.

## Goals

- English docs deploy quickly after every source docs sync.
- Locale translation does not run for every hot `main` commit.
- Translation work is debounced so a burst of docs commits becomes one translation wave.
- Locale jobs translate only pages whose source hash changed since the last successful locale output.
- Successful locale outputs are committed together, even if one or more locale jobs fail.
- A weekly reconciliation reruns every locale/page path to repair missed or flaky translations.

## Event flow

1. `openclaw/openclaw` syncs English docs into `openclaw/docs`.
2. GitHub Pages deploys English/source changes immediately from the sync commit.
3. `Translate All` is triggered by the sync commit, release dispatch, manual dispatch, or weekly schedule.
4. The coordinator waits a cooldown window before starting translation.
5. After the cooldown, the coordinator reads the current `origin/main` source metadata.
6. If a newer docs sync arrived during cooldown, the coordinator uses the newer source state.
7. Per-locale translation jobs run in parallel with `fail-fast: false`.
8. Each locale job uploads an artifact for the requested source SHA.
9. The finalizer downloads available artifacts, ignores stale or failed payloads, and pushes one aggregate i18n commit.
10. After the aggregate commit lands, the finalizer dispatches the Pages deploy once.
11. The Pages workflow dispatches live smoke after deployment.

## Debounce policy

The coordinator waits 1 hour after a docs sync or release dispatch, then re-reads `origin/main`.

The default cooldown is controlled by the publish repo variable `OPENCLAW_DOCS_TRANSLATION_COOLDOWN_SECONDS`, which defaults to `3600`. Repository dispatch callers may override it with `client_payload.cooldown_seconds`, and manual runs may set `cooldown_seconds`.

If `.openclaw-sync/source.json` changed during the wait, it waits again from the newer state. If `main` keeps moving, the wait is capped by `OPENCLAW_DOCS_TRANSLATION_MAX_WAIT_SECONDS`, which defaults to the cooldown value. The newest observed state is translated after the cap.

Manual and weekly runs do not wait by default.

## Incremental translation

Each translated page stores `x-i18n.source_hash`. Locale jobs compare the current English page hash with the stored locale hash.

Normal runs translate only:

- missing locale pages
- locale pages with stale `x-i18n.source_hash`
- pages affected by source deletion/pruning

Internal files under `docs/.i18n/**` are not translation inputs. Push-triggered runs that only change internal i18n files skip before the locale matrix.

If an infrastructure or translation failure invalidates a shard, its artifact is marked failed and carries no payload. This branch can salvage passing pages when individual pages fail validation, recording excluded pages in metadata. The finalizer still commits usable results; excluded pages remain stale and are selected again because their source hashes do not match.

## Translation engine boundary

The publish repository owns orchestration, checks, artifacts and finalization.
The translator belongs to `openclaw/openclaw/scripts/docs-i18n`. The locale
worker checks out the source revision and invokes document mode (`--mode doc`).
Document mode masks protected literals and sends bounded text chunks to
one-shot Codex translation calls. Those chunks are operational retry boundaries,
not MDX syntax boundaries; strict parsing must run on the assembled page.
Translation calls are separate from the workspace-writing Codex repair action.

This branch contains an unmerged repair-relay implementation. Its local and
runner acceptance records do not mean it is deployed. See the
[handoff and remaining work](mdx-repair-handoff.md) for decisions, reproducible
fixtures, historical evidence and the integration checklist.

## Artifact contract

Each locale job uploads one artifact named with locale and source SHA:

```text
i18n-zh-cn-<source-sha>
```

Artifact contents:

```text
metadata.json
changed-files.txt
deleted-files.txt
payload/docs/<locale>/**
payload/docs/.i18n/<locale>.tm.jsonl
```

`metadata.json` includes the locale, locale slug, source SHA, pending count, changed count, and any failure reason. The finalizer rejects artifacts whose `source_sha` does not match the current `.openclaw-sync/source.json`.

### MDX repair chain

This branch enhances the existing Codex action with bounded repair rounds,
checker feedback, path enforcement and external MDX rechecks. The branch
budget is 600 seconds per round and at most four rounds. A failed page can be
excluded while passing pages from the shard remain packageable; infrastructure
failures still fail the shard.

The enhanced path is gated by `mdx_repair_enabled`, locale/path canary selection
and validation. The switch defaults to false, and existing callers do not
activate it automatically. Merging the code alone does not enable the relay.

The strict `@mdx-js/mdx` compiler is the syntax oracle. The lightweight content
check catches empty output and catastrophic deletion, rather than proving prose
equivalence. Path and protected-attribute checks remain separate requirements.
A model's successful exit is insufficient without the external checks.

The branch retains historical deterministic syntax and protected-attribute
repair code. Its pre-merge version of syntax recovery differs from the version
that ultimately landed in PR #153; reconcile those changes with current main
before enabling this branch. Formatter probes did not justify adding Prettier
or another formatter as a default repair dependency.

The executable baseline and successful historical repair outputs are tracked
under `.github/scripts/i18n/tests/fixtures/mdx-relay/`. Tests and independent
validation use those files without requiring the ignored local planning tree.
The [handoff](mdx-repair-handoff.md) distinguishes measured outcomes from
unverified production behavior.

The source repo release workflow dispatches one `translate-all-release` event. The coordinator still accepts old per-locale release events for compatibility, but those are only a fallback.

## Aggregate commit

The finalizer owns the only locale push in the normal path.

Commit message:

```text
chore(i18n): refresh translations
```

The commit may contain a partial locale set. The job summary lists applied locales, locales with no changes, missing or failed locales, stale artifacts, and invalid artifacts.

## Weekly reconciliation

The weekly run uses `full` mode. It forces a full reconciliation across every locale and every source page instead of relying only on changed source hashes.

Glossary changes also force full reconciliation because glossary guidance can affect pages whose source hashes did not change.

Expected behavior:

- regenerate or verify every locale page
- prune stale locale pages
- refresh translation memory as needed
- still use parallel locale jobs
- still commit one aggregate result
- still tolerate individual locale failures

The weekly run is the repair mechanism for LLM flakiness, partial failures, and missed incremental updates.

## Deployment policy

English deploys from source sync commits.

Translations deploy after the aggregate i18n commit. The finalizer dispatches GitHub Pages once because GitHub suppresses normal push-triggered workflow runs from `GITHUB_TOKEN` commits. The Pages workflow dispatches live smoke after deployment so the smoke test checks the deployed site instead of racing the deploy.

A hot docs day should produce many fast English deploys, but only a small number of locale deploys.

If external deploy providers such as Mintlify watch every push, the aggregate i18n commit is the load reducer. Avoid restoring per-locale pushes to `main`.
