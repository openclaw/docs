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
3. `Translate All` (`openclaw/docs/.github/workflows/translate-all.yml`) is triggered by the sync commit, release dispatch, manual dispatch, or weekly schedule.
4. The coordinator waits a cooldown window before starting translation.
5. After the cooldown, the coordinator reads the current `origin/main` source metadata.
6. If a newer docs sync arrived during cooldown, the coordinator uses the newer source state.
7. Per-locale translation jobs run in parallel with `fail-fast: false`.
8. Each locale job uploads an artifact for the requested source SHA.
9. The finalizer downloads available artifacts, ignores stale or failed payloads, and publishes one aggregate i18n PR.
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

The source repo release workflow dispatches one `translate-all-release` event. The coordinator still accepts old per-locale release events for compatibility, but those are only a fallback.

## Aggregate commit

The finalizer publishes locale changes through a pull request. Aggregate and
locale recovery finalizers share the same queued publication group. Up to 100
pending jobs can wait without replacing an earlier pending finalizer.

Both paths retain their source freshness checks and validate changed build
inputs again after rebasing. Each candidate has an immutable branch derived from
its scope, validated tree, and base commit. An unmerged or closed candidate stays
available for inspection; later runs never overwrite its branch.

Commit message:

```text
chore(i18n): refresh translations
```

The commit may contain a partial locale set. Publication succeeds only after a
normal squash merge of the exact candidate head and verification of its owned
translation tree at the merge commit and current `main`. A pending PR is not a
published translation. The job summary lists applied locales, locales with no
changes, missing or failed locales, stale artifacts, and invalid artifacts.

## Weekly reconciliation

The weekly run uses `full` mode. It forces a full reconciliation across every locale and every source page instead of relying only on changed source hashes.

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

Translations deploy through R2 Pages after the finalizer verifies the merged
translation tree. The finalizer dispatches the existing deploy workflow because
`GITHUB_TOKEN` publication does not trigger normal push workflows. Failed or
unconfirmed merges leave `committed` false and prevent the dependent deploy.

A hot docs day should produce many fast English deploys, but only a small number of locale deploys.

The aggregate i18n commit limits normal publish work to one update. Recovery
locale commits use the same PR and merge-verification path.

Both publication owners require the strict `Publication merge admission` check
bound to GitHub Actions and the non-fast-forward rule before normal merging.
An administrator must activate the rules and verify empty bypass lists. Runtime
rejects exposed bypasses; GitHub can redact those lists from the workflow token,
so omitted fields do not prove the administrator-owned condition.

The trusted `publication-admission.yml` workflow posts neutral admission only for
a current open PR targeting this repository's main branch at the event head.
Obsolete events write no status. It never executes candidate code or validates
translation payloads. Aggregate and locale publishers own source freshness,
validation, scope, single-parent candidate checks, and actual merged-tree receipts.
They post the same admission status after their checks, so token-created PRs do
not depend on another workflow event. Missing effective policy retains the PR
without merging or dispatching its dependent R2 deployment.
