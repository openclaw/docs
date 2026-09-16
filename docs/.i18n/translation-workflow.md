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

1. `openclaw/openclaw/.github/workflows/docs-sync-publish.yml` mirrors the OpenClaw docs tree into `openclaw/docs`, then replaces `docs/clawhub/` with the current `openclaw/clawhub/docs` input. The sync script also rewrites the publish `docs/docs.json`. The generated locale picker blocks exist there even though the source repo no longer commits them.
2. GitHub Pages deploys English/source changes immediately from the sync commit.
3. `Translate Incremental` handles debounced source changes. `Translate Full` (`openclaw/docs/.github/workflows/translate-all.yml`) runs on a weekly schedule or manual dispatch.
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

If a locale job fails, its artifact is marked failed and carries no payload. The finalizer still commits successful locales. The failed locale remains stale and is picked up by the next incremental run because its source hashes still do not match.

## Artifact contract

Each locale shard uploads one artifact named with locale, shard, and source SHA:

```text
i18n-zh-cn-s0of8-<source-sha>
```

Artifact contents:

```text
metadata.json
changed-files.txt
deleted-files.txt
payload/docs/<locale>/**
payload/docs/.i18n/<locale>.tm.jsonl
```

`metadata.json` includes the locale, locale slug, source SHA, shard index/count, pending count, changed count, and any failure reason. It also records the actual docs checkout `publish_ref` and the Git blob ID `source_metadata_oid` of its `.openclaw-sync/source.json`. The workflow commit and docs snapshot can differ, including on manual branch dispatches.

The finalizer checks requested artifact source identity, page hashes, locale completeness, and TM freshness against current main. It rechecks the complete source metadata before committing. Resuming an old snapshot does not permit stale pages or TM to overwrite newer source state.

## Resume a full run

After the original `Translate Full` run finishes, dispatch the current workflow with `resume_run_id` set to that run's numeric ID. Leave `target_locale=all` to reuse successful shards and retry failed, missing, or unusable shards. A specific locale limits that plan to matching receipts. Runs serialize without cancelling an active full run.

Preparation pins the prior run's latest artifact IDs, rejects expired or missing receipts, and downloads them before selecting source. Recorded provenance must identify one full source SHA and one docs snapshot. Preparation then checks out that immutable docs/TM snapshot and sizes the shard plan from its docs. It does not debounce or select newer main for a resume. Empty, unmatched, inconsistent, or contradictory evidence fails before provider work.

Older receipts lack `publish_ref` and `source_metadata_oid`. For these only, supply `resume_publish_ref` with the full original docs commit SHA verified from the original run's selected-source summary or locale checkout logs. The workflow run's `head_sha` alone is not sufficient: preparation may have selected a different main commit. The backfill must match the artifacts' source SHA and any recorded snapshot evidence. New receipts recover their snapshot automatically and reject this override.

Preparation, locale workers, and finalization retain helpers from the current workflow revision outside the checkout directory. Restoring old docs or TM cannot restore old validator code. Both flat single-artifact downloads and per-artifact directories are supported; current rerun receipts replace prior ones by locale/shard/source identity. The finalizer uses the same pinned prior artifact IDs admitted by preparation and rejects an incomplete download before merging payloads.

For a non-publishing page check, use `diagnostic_canary_only=true`, the desired `target_locale`, and `canary_source_path`. Publication still requires the existing finalizer checks; a successful historical-source canary is not proof that old output can be applied to today's main.

## Aggregate commit

The finalizer owns the only locale push in the normal path.

Commit message:

```text
chore(i18n): refresh translations
```

The commit may contain a partial locale set. The job summary lists applied locales, locales with no changes, missing or failed locales, stale artifacts, and invalid artifacts.

## Weekly reconciliation

The weekly run uses `full` mode. It forces a full reconciliation across every locale and every source page instead of relying only on changed source hashes.

Glossary changes are picked up by the next weekly or manual full reconciliation because glossary guidance can affect pages whose source hashes did not change.

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
