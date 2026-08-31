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
2. The R2 Pages workflow deploys English/source changes from the sync commit.
3. `Translate Incremental`, when enabled, handles source docs pushes. `Translate Full` runs only on manual dispatch or Sundays at 03:17 UTC; glossary changes and release events do not trigger it.
4. The coordinator waits a cooldown window before starting translation.
5. After the cooldown, the coordinator reads the current `origin/main` source metadata.
6. If a newer docs sync arrived during cooldown, the coordinator uses the newer source state.
7. Per-locale translation jobs run in parallel with `fail-fast: false`.
8. Each locale job uploads an artifact for the requested source SHA.
9. The finalizer downloads available artifacts, ignores stale or failed payloads, and pushes one aggregate i18n commit.
10. After the aggregate commit lands, the finalizer dispatches the full R2 Pages deploy once.
11. The Pages workflow dispatches live smoke after deployment.

## Debounce policy

Incremental push runs wait 1 hour after a docs sync, then re-read `origin/main`.

The default cooldown is controlled by the publish repo variable `OPENCLAW_DOCS_TRANSLATION_COOLDOWN_SECONDS`, which defaults to `3600`. Manual translation runs may set `cooldown_seconds`.

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

`metadata.json` includes the locale, locale slug, source SHA, pending count, changed count, and any failure reason. Artifact metadata must match the requested source SHA. Every changed Markdown page must have an existing English source and a recorded `x-i18n.source_hash` matching its current bytes; every page deletion requires English absence. These checks always apply, even when the primary source SHA still matches, because the mirror also includes independently versioned sources such as ClawHub. A missing or changed source, missing page hash, or restored source for a deletion blocks the whole affected locale across all shards before any payload is applied. This prevents an older translation wave from recreating retired pages. Non-Markdown page payloads are rejected; current-source translation memory retains its existing acceptance rules.

Release dispatch events do not start translation. Use the manual Full workflow when a release needs reconciliation before Sunday.

## Manual retirement cleanup

To remove specific retired English files' locale counterparts without running translation or calling a model, put the approved docs-relative `.md`/`.mdx` filenames in `retirements.txt`, one per line (for example `concepts/retired.md`), then dispatch:

```sh
gh workflow run translate-retirements.yml --repo openclaw/docs --ref main \
  --field source_paths=@retirements.txt
```

The required `source_paths` input is data, not shell code. Blank lines are ignored and CRLF line endings are normalized; a blank-only selection fails. Paths must be unique canonical relative Markdown filenames, outside locale/internal directories, without traversal or symlinks. Every selected English source must be absent in the pinned snapshot. Missing locale counterparts are valid no-ops. This lane does not sweep all orphans: unselected orphan pages may still have inbound links and lack redirects, so their files and unrelated empty directories remain untouched. Full/Incremental pruning without a selection retains its existing behavior.

`Translate Retirements` stages control scripts from the immutable workflow revision, then checks out trusted literal `main` once. Retirement preparation records that checkout's exact HEAD and reads its core metadata from the resolved commit, without fetching, reselecting, waiting, or scheduling translation. The producer verifies the checked-out source pair; later movement of remote `main` does not change this admitted snapshot. One producer passes the selection to the existing pruner for every canonical locale, then uses the existing packager with an empty pending manifest and one shard per locale. Locales with no selected counterparts still produce valid empty artifacts. The producer requires the complete locale set, successful metadata, deletion manifests limited to the selected counterparts, and no changed payload or translation memory before uploading one `i18n-retirements-<source-sha>` bundle. The summary records selected paths/count and per-locale deletion counts.

The aggregate finalizer owns publication: all locales remain required, full `docs:check` runs before a changed tree can be committed, and deployment uses the full R2 path. Both artifact acceptance and the final source-snapshot fence are enforced: apply records the Git blob OID of `.openclaw-sync/source.json` and derives its primary SHA from that immutable blob. After the site checks, the commit step verifies that remote main still has exactly that readable metadata blob before and after rebase, then uses a normal fast-forward push. Any metadata change, including a secondary-source update or metadata-only sync refresh, requires a fresh finalizer attempt. Unrelated main changes with identical source metadata remain safely rebasable. This manual lane has separate, non-cancelling concurrency; it neither enables Incremental nor cancels Full.

If selection validation fails, correct the path list or resolve the source mismatch before rerunning; do not remove the selection to bypass it. If packaging reports failed or missing artifacts, inspect the producer's locale check and rerun after fixing the workflow cause. If a page hash or source-presence check fails, inspect the finalizer's incomplete-locale report and rerun the appropriate translation or retirement lane on current source. If aggregate checks find broken inbound links, stop and fix the source or redirect owner; do not hand-edit generated translations or bypass checks. A successful producer alone does not prove publication: verify the aggregate commit and its R2 deployment.

## Aggregate commit

The finalizer owns the only locale push in the normal path.

Commit message:

```text
chore(i18n): refresh translations
```

The commit may contain a partial locale set. The job summary lists applied locales, locales with no changes, missing or failed locales, stale artifacts, and invalid artifacts. The finalizer fails the run if required artifacts remain incomplete, even when it commits successful locales.

## Weekly reconciliation

The weekly run uses `full` mode. It forces a full reconciliation across every locale and every source page instead of relying only on changed source hashes.

Glossary changes are picked up by the next Sunday or manual Full run because glossary guidance can affect pages whose source hashes did not change.

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

Translations deploy after the aggregate i18n commit. The finalizer dispatches the full R2 Pages workflow because GitHub suppresses normal push-triggered workflow runs from `GITHUB_TOKEN` commits. The Pages workflow dispatches live smoke after deployment so the smoke test checks the deployed site instead of racing the deploy.

A hot docs day should produce many fast English deploys, but only a small number of locale deploys.

If external deploy providers such as Mintlify watch every push, the aggregate i18n commit is the load reducer. Avoid restoring per-locale pushes to `main`.
