# Translation workflow

Internal note for the docs publish pipeline. This file is under `docs/.i18n`, which is ignored by the docs-site build and is not published.

## Goals

- English docs deploy quickly after every source docs sync.
- Locale translation does not run for every hot `main` commit.
- Translation work is debounced so a burst of docs commits becomes one translation wave.
- Locale jobs translate only pages whose source hash changed since the last successful locale output.
- Successful locale outputs are committed even if one or more locale jobs fail.
- A weekly reconciliation reruns every locale/page path to repair missed or flaky translations.
- Translation publish work is serialized through R2 Pages so deploys do not race each other.

## Event flow

1. `openclaw/openclaw` syncs English docs into `openclaw/docs`.
2. GitHub Pages deploys English/source changes immediately from the sync commit.
3. Translation workflows debounce hot `main` changes, then re-read the current source metadata.
4. Incremental translation handles normal docs syncs. It runs one shard per locale, then one aggregate finalizer commits successful locale artifacts together.
5. Full translation handles weekly repair, glossary refreshes, release dispatches, and manual recovery. It runs a canary first, then bounded sharded locale batches, then one finalizer per locale.
6. Finalizers push translation commits and explicitly dispatch R2 Pages because `GITHUB_TOKEN` pushes do not trigger the normal publish workflow.
7. Workflow summaries report successful, failed, skipped, stale, and incomplete locales.

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

If a locale job fails, its artifact is marked failed and carries no payload. The finalizer still commits successful locales. The failed locale remains stale and is picked up by the next incremental run because its source hashes still do not match.

## Full translation

Full translation is a reconciliation mode. It is used for weekly repair, glossary-driven refreshes, release dispatches, and targeted manual recovery.

The full workflow has three layers:

- Canary: translate and commit one representative page for the selected canary locale.
- Translation shards: split each selected locale across one or more shard jobs.
- Locale finalizer: apply every shard for one locale, run full validation, commit that locale, and dispatch one locale-scoped R2 publish.

Shard count is derived from the English source document count, not from locale-specific history. The current policy is `ceil(source_doc_count / 250)`, capped at `1..4`. This intentionally overestimates work for some locales, but it avoids under-sharding large full runs while keeping the planner stateless.

Full translation keeps peak concurrency bounded: batches remain capped, shard jobs use `worker_parallel: 3`, and locale finalizers run one at a time within each batch. Sharding is meant to reduce per-job wall time, not to multiply total active model workers without review.

Targeted manual runs set `target_locale` to one locale slug or locale name. Use targeted full runs to recover a failed locale after workflow-control changes; do not rerun old finalizer jobs unless the artifacts and workflow ref are known to be valid.

## Artifact contract

Each locale shard uploads one artifact named with locale, shard, and source SHA:

```text
i18n-zh-cn-s0of4-<source-sha>
```

Artifact contents:

```text
metadata.json
changed-files.txt
deleted-files.txt
payload/docs/<locale>/**
payload/docs/.i18n/<locale>.tm.jsonl
```

`metadata.json` includes the locale, locale slug, source SHA, shard index, shard total, pending count, changed count, and any failure reason. The finalizer rejects artifacts whose `source_sha` does not match the current `.openclaw-sync/source.json`.

Translation memory is locale-global. For sharded full runs, shard 0 carries `docs/.i18n/<locale>.tm.jsonl`; other shards carry only their page payload. Artifact upload must include hidden files so `.i18n` payloads are not dropped.

`changed-files.txt` is a payload contract, not just a git diff list. Every listed path must exist in the artifact payload unless it is also listed in `deleted-files.txt`. This matters for new or canary locales where the TM file may not exist yet.

The source repo release workflow dispatches one `translate-all-release` event. The coordinator still accepts old per-locale release events for compatibility, but those are only a fallback.

## Commit ownership

Finalizers own locale pushes. Translation shard jobs never push.

Incremental translation uses one aggregate finalizer and one aggregate commit:

```text
chore(i18n): refresh translations
```

Full translation uses locale finalizers. Each locale finalizer commits only `docs/<locale>/**` plus `docs/.i18n/<locale>.tm.jsonl` when that TM file exists or is already tracked.

The commit may contain a partial locale set. Summaries list applied locales, locales with no changes, missing or failed locales, stale artifacts, and invalid artifacts.

## Weekly reconciliation

The weekly run uses `full` mode. It forces a full reconciliation across every locale and every source page instead of relying only on changed source hashes.

Glossary changes also force full reconciliation because glossary guidance can affect pages whose source hashes did not change.

The weekly run is the repair mechanism for LLM flakiness, partial failures, and missed incremental updates. It uses the full translation sharding, artifact, and locale-finalizer semantics described above.

## Canary policy

Canary runs are a control-plane check, not a full site proof. They verify artifact apply, canary scope enforcement, commit behavior, and R2 dispatch wiring on one representative page.

Canary finalization skips `npm run docs:check`; full locale finalizers and full publish paths keep strict validation. In normal full runs, page-scoped canary R2 dispatch is best-effort so stale scoped deploys or R2 failures do not block later full batches. In `canary_only=true` manual validation, canary R2 remains strict and waits for the scoped publish result.

## Deployment policy

English deploys from source sync commits.

Translations deploy after finalizer commits because GitHub suppresses normal push-triggered workflow runs from `GITHUB_TOKEN` commits. Incremental translation dispatches a publish after the aggregate commit. Full translation dispatches locale-scoped publishes from locale finalizers.

`R2 Pages` serializes deploys with `queue: max` and `cancel-in-progress: false`. A running upload is not cancelled, and pending uploads are queued instead of being replaced by newer waiting requests.

Scoped locale/page publishes still build the site before uploading a filtered manifest subset. They are an optimization for upload scope and validation blast radius, not a separate minimal build system.

A hot docs day should produce many fast English deploys, but only a small number of locale deploys.

If external deploy providers such as Mintlify watch every push, the aggregate i18n commit is the load reducer. Avoid restoring per-locale pushes to `main`.
