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
3. `Translate Incremental` is triggered by normal source docs changes.
4. `Translate Full` is triggered by glossary changes, release dispatch, manual dispatch, or weekly schedule.
5. The selected coordinator waits a cooldown window before starting translation.
6. After the cooldown, the coordinator reads the current `origin/main` source metadata.
7. If a newer docs sync arrived during cooldown, the coordinator uses the newer source state.
8. Incremental translation runs one job per locale with `fail-fast: false`.
9. Full translation runs sixteen deterministic shards per locale with `fail-fast: false` and `max-parallel: 54`.
10. Each locale job or locale shard uploads an artifact for the requested source SHA.
11. The shared finalizer downloads available artifacts and pushes one aggregate i18n commit.
12. After the aggregate commit lands, the finalizer dispatches the Pages deploy once.
13. The Pages workflow dispatches live smoke after deployment.

## Debounce policy

The coordinator waits 1 hour after a docs sync or release dispatch, then re-reads `origin/main`.

The default cooldown is controlled by the publish repo variable `OPENCLAW_DOCS_TRANSLATION_COOLDOWN_SECONDS`, which defaults to `3600`. Repository dispatch callers may override it with `client_payload.cooldown_seconds`, and manual runs may set `cooldown_seconds`.

If `.openclaw-sync/source.json` changed during the wait, it waits again from the newer state. If `main` keeps moving, the wait is capped by `OPENCLAW_DOCS_TRANSLATION_MAX_WAIT_SECONDS`, which defaults to the cooldown value. The newest observed state is translated after the cap.

Manual and weekly runs do not wait by default.

## Concurrency lanes

Full reconciliation uses the `docs-i18n-full` concurrency group and cancels older full runs. Full mode covers weekly reconciliation, glossary changes, release dispatch, and manual full runs.

Incremental translation uses the `docs-i18n-incremental` concurrency group and cancels older incremental runs. It does not cancel full reconciliation.

The finalizer uses the shared `docs-i18n-finalize` concurrency group with `cancel-in-progress: false`, so aggregate pushes are serialized across both lanes.

Full translation shards use 16 locale shards with 2 in-job workers each. The matrix `max-parallel: 54` caps active shard jobs, for a maximum of 108 active translation workers. More shards reduce the per-job page count without increasing upstream translation pressure. Incremental translation stays unsharded with 8 in-job workers per locale.

Docs translation uses `gpt-5.5` with medium thinking effort. The workload is constrained translation rather than deep reasoning; medium keeps prompt latency lower so full shard jobs stay farther from GitHub-hosted runner's 6 hour job limit.

## Incremental translation

Each translated page stores `x-i18n.source_hash`. Locale jobs compare the current English page hash with the stored locale hash.

Normal runs translate only:

- missing locale pages
- locale pages with stale `x-i18n.source_hash`
- pages affected by source deletion/pruning

Internal files under `docs/.i18n/**` are not translation inputs. Push-triggered runs that only change internal i18n files skip before the locale matrix.

If a locale job fails, its artifact is marked failed and carries no payload. The finalizer still commits successful locales. The failed locale remains stale and is picked up by the next incremental run because its source hashes still do not match.

If a run finishes after the source SHA has moved, the finalizer no longer drops the whole artifact set. It applies localized pages whose `x-i18n.source_hash` still matches the current English source file, skips stale pages, applies deletes only when the current English source is also gone, and skips translation memory updates from stale runs.

## Full translation shards

Full mode forces every source page into the pending list, then splits the sorted file list with `file_index % shard_total == shard_index`.

Each full shard translates only its assigned files. Deleted locale pages are also deterministically split across shards by sorted deleted path. Sharded full artifacts exclude `docs/.i18n/<locale>.tm.jsonl` so parallel shards cannot overwrite one another's translation memory output. Locale pages are still aggregated and committed by the finalizer.

## Artifact contract

Each locale job or shard uploads one artifact named with locale, shard, and source SHA:

```text
i18n-zh-cn-s0of16-<source-sha>
```

Incremental runs use `s0of1`.

Artifact contents:

```text
metadata.json
changed-files.txt
deleted-files.txt
payload/docs/<locale>/**
payload/docs/.i18n/<locale>.tm.jsonl
```

The translation memory payload is present for unsharded incremental runs only. Sharded full runs omit it.

`metadata.json` includes the locale, locale slug, source SHA, shard index, shard total, worker parallelism, thinking effort, total pending count, shard pending count, changed count, and any failure reason. The finalizer rejects artifacts with the wrong requested `source_sha` or unexpected shard metadata; if the requested source is no longer current, it falls back to per-page freshness checks.

The source repo release workflow dispatches one `translate-all-release` event. The coordinator still accepts old per-locale release events for compatibility, but those are only a fallback.

## Aggregate commit

The finalizer owns the only locale push in the normal path.

Commit message:

```text
chore(i18n): refresh translations
```

The commit may contain a partial locale or shard set. The job summary lists applied artifacts, artifacts with no changes, missing or failed artifacts, stale artifacts, skipped stale pages, skipped stale deletes, skipped stale translation memory, and invalid artifacts.

## Weekly reconciliation

The weekly run uses `full` mode. It forces a full reconciliation across every locale and every source page instead of relying only on changed source hashes.

Glossary changes also force full reconciliation because glossary guidance can affect pages whose source hashes did not change.

Expected behavior:

- regenerate or verify every locale page
- prune stale locale pages
- refresh locale pages while skipping sharded translation memory output
- still use parallel locale shard jobs
- still commit one aggregate result
- still tolerate individual locale failures

The weekly run is the repair mechanism for LLM flakiness, partial failures, and missed incremental updates.

## Deployment policy

English deploys from source sync commits.

Translations deploy after the aggregate i18n commit. The finalizer dispatches GitHub Pages once because GitHub suppresses normal push-triggered workflow runs from `GITHUB_TOKEN` commits. The Pages workflow dispatches live smoke after deployment so the smoke test checks the deployed site instead of racing the deploy.

A hot docs day should produce many fast English deploys, but only a small number of locale deploys.

If external deploy providers such as Mintlify watch every push, the aggregate i18n commit is the load reducer. Avoid restoring per-locale pushes to `main`.
