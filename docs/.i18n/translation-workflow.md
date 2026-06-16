# Translation workflow

Internal note for the docs publish pipeline. This file is under `docs/.i18n`, which is ignored by the docs-site build and is not published.

## Goals

- English docs deploy quickly after every source docs sync.
- Locale translation does not run for every hot `main` commit.
- Translation work is debounced so a burst of docs commits becomes one translation wave.
- Locale jobs translate only pages whose source hash changed since the last successful locale output.
- Successful locale outputs are committed together, even if one or more locale jobs fail.
- A weekly reconciliation reruns every locale/page path to repair missed or flaky translations.

## Full translation stabilization review

The June 2026 full-translation fixes were driven by three observed failure classes:

- A full run could leave slow locale jobs active until the GitHub-hosted runner single-job 6 hour limit cancelled them.
- Increasing shards without checking platform limits produced `18 locales * 16 shards = 288` matrix jobs, above the GitHub Actions 256-combination matrix limit.
- A heredoc indentation bug in `Prepare locale artifact` made failed shards unable to upload failure metadata, so the finalizer could only report missing artifacts.

Completed changes:

| Area | Completed mitigation | PR |
| --- | --- | --- |
| Per-job runtime | Full runs are sharded by deterministic sorted pending-file index, so each locale job handles a subset instead of every pending page. | [#42](https://github.com/openclaw/docs/pull/42) |
| Runner timeout margin | Full sharding moved from 8 shards to 14 effective shards per locale, and translation thinking effort moved from `xhigh` to `medium`. | [#45](https://github.com/openclaw/docs/pull/45), [#46](https://github.com/openclaw/docs/pull/46) |
| Matrix platform limit | Full matrix size is capped at `18 * 14 = 252`, below the 256-combination limit. | [#46](https://github.com/openclaw/docs/pull/46) |
| Upstream fan-out | Full matrix `max-parallel` is throttled to 12, keeping peak active translation workers at `12 * 2 = 24`. | [#47](https://github.com/openclaw/docs/pull/47) |
| Failure observability | Failed translation or MDX repair shards upload metadata-only artifacts, so the finalizer can report failed shards separately from missing shards. | [#42](https://github.com/openclaw/docs/pull/42), [#47](https://github.com/openclaw/docs/pull/47) |
| Shell syntax regression | Translation workflows run a reusable shell-block syntax check before preparing translation work. | [#47](https://github.com/openclaw/docs/pull/47) |
| Matrix and worker budgets | The reusable preflight checks that `locale_count * shard_total <= 256` and peak full-run workers stay within the explicit budget of 24 before translation starts. | [#47](https://github.com/openclaw/docs/pull/47) |
| Stale output safety | The finalizer checks source SHA, shard metadata, expected locales, expected shard count, and per-page source hashes before applying artifacts. | [#42](https://github.com/openclaw/docs/pull/42) |

Parameter history:

| Stage | Full matrix jobs | Shards per locale | Matrix `max-parallel` | Workers per active job | Peak active workers | Thinking effort | Main issue |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Before #42 | 18 | 1 | 18 effective | 8 | 144 | `xhigh` | Slow locale jobs could hit the 6 hour runner limit. |
| #42 | 144 | 8 | 54 | 2 | 108 | `xhigh` | Slowest shards still had timeout risk. |
| #45 | 288 | 16 | 54 | 2 | 108 | `medium` | Invalid matrix size: `288 > 256`. |
| #46 | 252 | 14 | 54 | 2 | 108 | `medium` | Valid matrix, but still high upstream pressure. |
| #47/current | 252 | 14 | 12 | 2 | 24 | `medium` | Lower pressure; needs PR-level preflight and run telemetry. |

Recommended left-shift checks not yet completed:

| Check | Failure prevented | Suggested owner |
| --- | --- | --- |
| Pull-request translation workflow preflight that runs `actionlint`, shell extraction, and budget checks for `translate-*.yml`. | Workflow regressions before merge instead of at the next translation trigger. | CI |
| Artifact-contract fixture test for finalizer apply logic with successful, failed, missing, stale, invalid, changed, and deleted shard artifacts. | Finalizer regressions that only appear after expensive translation jobs finish. | Script or CI |
| Shard distribution fixture that reports docs-per-shard and bytes-per-shard for every locale. | File-count sharding can still create oversized shards when a few pages are much larger than average. | Script or CI |
| Small canary translation workflow using one locale and a tiny fixture docs tree. | End-to-end provider, prompt, MDX check, repair-scope, artifact upload, and finalizer assumptions before a full wave. | Manual or scheduled CI |
| Run telemetry summary for per-shard duration, pending count, changed count, retries, and failure reason. | Shard and fan-out tuning remains guesswork without trend data. | Workflow summary |

Open design risks:

- The locale list is duplicated across incremental, full, reusable, and finalizer workflow code. Add a generated or checked single source of truth before adding or removing locales.
- Full sharding assigns files by count, not by estimated work. A few large MDX pages can still make one shard much slower than the others.
- Sharded full artifacts intentionally omit translation memory payloads to avoid parallel overwrite races. That avoids corrupting the TM file, but it means full runs do not refresh TM state while `shard_total > 1`.
- The shell-block check validates extracted `run: |` scripts, but it is not a substitute for `actionlint`; it does not fully validate workflow expressions, matrix shape, permissions, or action inputs.
- Old per-locale release dispatch event types still exist for compatibility. Deprecate them after callers migrate to `translate-all-release` so the workflow does not keep unnecessary compatibility surface.

## Event flow

1. `openclaw/openclaw` syncs English docs into `openclaw/docs`.
2. GitHub Pages deploys English/source changes immediately from the sync commit.
3. `Translate Incremental` is triggered by normal English docs changes; `Translate Full` is triggered by glossary changes, release dispatch, manual dispatch, or weekly schedule.
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

Each locale job uploads one artifact named with locale and source SHA:

```text
i18n-zh-cn-s0of14-<source-sha>
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

For sharded full runs, `metadata.json` also includes `shard_index`, `shard_total`, `worker_parallel`, and `thinking_effort`. The finalizer expects one artifact per locale/shard pair and reports missing, failed, invalid, and stale artifacts separately.

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
