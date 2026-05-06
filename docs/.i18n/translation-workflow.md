# Translation workflow

Internal note for the publish mirror. This file is under `docs/.i18n`, which is ignored by the docs-site build and is not published.

## Goals

- English docs deploy quickly after every source docs sync.
- Locale translation does not run for every hot `main` commit.
- Translation work is debounced so a burst of docs commits becomes one translation wave.
- Locale jobs translate only pages whose source hash changed since the last successful locale output.
- Successful locale outputs are committed together, even if one or more locale jobs fail.
- A weekly reconciliation reruns every locale/page path to repair missed or flaky translations.

## Event flow

1. `openclaw/openclaw` syncs English docs into this publish repo.
2. GitHub Pages deploys English/source changes immediately from the sync commit.
3. A translation coordinator is triggered by the sync commit, release dispatch, manual dispatch, or weekly schedule.
4. The coordinator waits a short cooldown window before starting translation.
5. After the cooldown, the coordinator reads the current `origin/main` source metadata.
6. If a newer docs sync arrived during cooldown, the coordinator uses the newer source state.
7. Per-locale translation jobs run in parallel with `fail-fast: false`.
8. Each successful locale job uploads an artifact with only that locale's changed output.
9. A finalizer job downloads all available artifacts, ignores stale artifacts, and pushes one aggregate i18n commit.

## Debounce policy

The coordinator should prefer settling over eagerness. A small delay is enough to collapse normal commit bursts without making translations feel stuck.

Recommended default:

- Wait 5 minutes after a docs sync.
- Re-read `origin/main` after waiting.
- If `.openclaw-sync/source.json` changed during the wait, restart the wait once from the newer state.
- If `main` keeps moving, cap the total wait around 20 minutes and translate the newest settled state.

This keeps English fast while making locale translation batch-oriented.

## Incremental translation

Each translated page stores `x-i18n.source_hash`. Locale jobs compare the current English page hash with the stored locale hash.

Normal runs translate only:

- missing locale pages
- locale pages with stale `x-i18n.source_hash`
- pages affected by source deletion/pruning

If a locale job fails, the finalizer still commits artifacts from other successful locales. The failed locale remains stale and is picked up by the next incremental run because its source hashes still do not match.

## Artifact contract

Each locale job should upload one artifact named with locale and source SHA, for example:

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

`metadata.json` should include:

```json
{
  "locale": "zh-CN",
  "locale_slug": "zh-cn",
  "source_sha": "<openclaw/openclaw sha>",
  "pending_count": 12
}
```

The finalizer must reject artifacts whose `source_sha` does not match the current `.openclaw-sync/source.json`.

The source repo release workflow should dispatch one `translate-all-release` event. The coordinator still accepts the old per-locale release events for compatibility, but those are only a fallback and should not be restored as the primary path.

## Aggregate commit

The finalizer owns the only locale push in the normal path.

Commit message:

```text
chore(i18n): refresh translations
```

The commit may contain a partial locale set. The job summary should list:

- committed locales
- locales with no changes
- failed or missing locales
- stale artifacts ignored

## Weekly reconciliation

Run once per week from the coordinator.

Weekly mode should force a full reconciliation across every locale and every source page. It should not rely only on changed source hashes.

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

Translations deploy from the aggregate i18n commit. That means a hot docs day should produce many fast English deploys, but only a small number of locale deploys.

If external deploy providers such as Mintlify watch every push, the aggregate i18n commit is the important load reducer. Avoid restoring per-locale pushes to `main`.
