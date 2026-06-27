# Translation workflow

Internal note for the docs publish pipeline. This file is under `docs/.i18n`, which is ignored by the docs-site build and is not published.

## Goals

- English docs deploy quickly after every source docs sync.
- Incremental translation does not run for every hot `main` commit.
- Full reconciliation is a recovery path, not a release path.
- Full reconciliation runs automatically only on the weekly schedule, or manually when an operator starts it.
- A failed full run can be retried for one locale without rerunning every locale.
- Provider/key failures stop before locale fan-out.
- A tiny canary sample must succeed before follow-up full batches start.
- Locale translation failures are visible as failed GitHub jobs, even when diagnostic artifacts were uploaded.

## Event Flow

1. `openclaw/openclaw` syncs English docs into `openclaw/docs`.
2. GitHub Pages deploys English/source changes immediately from the sync commit.
3. `Translate Incremental` debounces source-doc pushes and translates stale locale pages.
4. `Translate Full` runs only from the weekly schedule or `workflow_dispatch`.
5. Both workflows read the current `origin/main` source metadata after debounce.
6. Both workflows run the shared OpenAI provider/key preflight before any locale job.
7. Full translation plans one canary locale sample and bounded follow-up batches of up to three locales.
8. If the canary fails, follow-up full batches do not start.
9. Full locale jobs validate, commit, and dispatch deploy independently after that locale succeeds.
10. Incremental locale jobs still upload artifacts for the aggregate finalizer.
11. Failed locale jobs upload failure metadata before failing the job, so artifacts and CI status agree.

## Trigger Policy

`Translate Full` deliberately does not listen to release dispatches or glossary pushes. Release and glossary changes converge through the weekly full run. For urgent recovery, manually run `Translate Full` with `target_locale=all` or a single locale slug.

Top-level full workflow concurrency is serialized with `cancel-in-progress: false`. A new full run waits for a running full run instead of cancelling it.

Manual `target_locale` accepts `all` or one locale slug such as `fr`, `ja-jp`, or `zh-cn`. A single-locale rerun uses that locale for the canary sample, then schedules only that locale in the first full batch. Manual `canary_only=true` runs only the canary translation, R2 upload, and live smoke without starting follow-up full batches.

## Debounce Policy

The coordinator waits after push-triggered incremental runs. The default cooldown is controlled by `OPENCLAW_DOCS_TRANSLATION_COOLDOWN_SECONDS`, which defaults to `3600`. Manual and weekly runs do not wait by default unless the manual input sets `cooldown_seconds`.

If `.openclaw-sync/source.json` changed during a wait, the workflow waits again from the newer state. If `main` keeps moving, the wait is capped by `OPENCLAW_DOCS_TRANSLATION_MAX_WAIT_SECONDS`, which defaults to the cooldown value.

## Incremental Translation

Each translated page stores `x-i18n.source_hash`. Locale jobs compare the current English page hash with the stored locale hash.

Normal incremental runs translate only:

- missing locale pages
- locale pages with stale `x-i18n.source_hash`
- pages affected by source deletion/pruning

Internal files under `docs/.i18n/**` are not translation inputs. Push-triggered runs that only change internal i18n files skip before the locale matrix.

Incremental translation uses the provider/key preflight before expanding the locale matrix. If the key is invalid, model access is denied, or quota is exhausted, the preflight job fails and locale jobs are not scheduled.

## Full Translation

Full mode forces every source page for the selected locale into the pending manifest instead of relying on changed source hashes.

The weekly all-locale plan is:

```text
provider/key preflight
  -> canary locale sample
  -> batch 1, up to 3 locales
  -> batch 2, up to 3 locales
  -> ...
  -> status summary
```

The canary is a deterministic one-document sample from the first selected locale. It prefers `channels/line.md` because that page is easy to inspect on the live site and exercises fixed glossary terms such as `LINE`; if that page is not pending, it falls back to the smallest pending source page. The canary uploads a `canary` artifact, applies it through the same artifact validation path as locale commits, runs the aggregate docs check, commits that one-page locale refresh when there is a git diff, then dispatches and waits for an R2 Pages full upload. The R2 deploy is required even when the canary page already matches `main`, because `main` can be current while R2 is stale. After upload, the canary live-smokes `https://docs.openclaw.ai/<locale>/channels/line` and requires the page `<h1>` to be `LINE`. Canary artifacts include only the sampled locale page and that locale translation memory; unrelated pruned locale pages are not published by the probe. Before writing `main`, canary commits are guarded again against the downloaded artifact contract so only the sampled page and translation memory can be committed. If it fails translation, validation, commit, R2 upload, or live smoke, later batches are skipped. If it succeeds, the selected locales, including the canary locale, run in normal full batches unless `canary_only=true` was requested. If a later locale fails, already successful locales remain committed and published, and the failed locale can be rerun manually.

## Artifact Contract

Each locale job uploads one artifact named with role, locale, shard, and source SHA:

```text
i18n-zh-cn-s0of1-<source-sha>
i18n-canary-zh-cn-s0of1-<source-sha>
```

Artifact contents:

```text
metadata.json
changed-files.txt
deleted-files.txt
payload/docs/<locale>/**
payload/docs/.i18n/<locale>.tm.jsonl
```

`metadata.json` includes the artifact role, locale, locale slug, source SHA, pending count, changed count, deleted count, step outcomes, and failure reason. A failed translation writes an empty payload contract, uploads the artifact, then fails the job. Full status summaries count canary artifacts separately and do not treat a canary artifact as a successful locale refresh.

## Commit And Deploy Policy

Full locale jobs are the commit and publish unit. After a locale succeeds, a separate write-permission commit job downloads that locale artifact, applies it to latest `main`, runs `npm run docs:check`, commits only `docs/<locale>/**` and `docs/.i18n/<locale>.tm.jsonl`, pushes with rebase/retry under the shared locale finalizer concurrency, and dispatches `r2-pages.yml` with a full upload. The dispatch step waits for the R2 Pages run and fails if the upload fails. If an artifact applied changes but the locale commit did not land, the finalizer fails instead of reporting an unpublished refresh as successful.

Artifact application is intentionally conservative when source metadata has moved. The apply step uses latest `main`, copies only payload pages whose embedded `x-i18n.source_hash` still matches the current source page, and skips stale translation memory. If `main` moves again between apply/validation and push, the commit script skips that locale commit so the next manual or weekly run can re-evaluate from the new base.

Incremental translation keeps the aggregate finalizer. The finalizer downloads available artifacts, applies valid successful payloads, rejects stale or failed artifacts, runs `npm run docs:check`, pushes one aggregate i18n commit, dispatches and waits for `r2-pages.yml` with a full upload, and fails when required locale artifacts are missing or failed.

## Automatic Verification

The script test suite validates the recovery controls:

- `Translate Full` has no release dispatch trigger.
- glossary pushes do not trigger `Translate Full`.
- weekly and manual triggers remain present.
- manual single-locale planning selects only that locale.
- full canary manifests keep the total pending count but translate only a bounded sample.
- provider/key preflight classifies invalid key, model access, and quota failures.
- canary success gates follow-up full batches.
- full worker fan-out stays within the small-batch budget.
- full status summaries report locale success, failure, skip reason, and artifact counts from metadata.
- failed artifact metadata produces visible GitHub output status.
- locale artifact application still rejects missing, failed, stale, and invalid artifacts.

Run locally:

```bash
python -m unittest .github/scripts/i18n/tests/test_i18n_scripts.py
python .github/scripts/i18n/workflow_shell_check.py --check-bash
python .github/scripts/i18n/budget_check.py
```

## Manual Verification

Before merging workflow recovery changes:

1. Trigger `Translate Full` with a deliberately invalid translation key in a test context and confirm the provider preflight fails before locale jobs start.
2. Trigger or simulate a canary failure and confirm follow-up full batches are skipped.
3. Trigger `Translate Full` with `target_locale=fr` and confirm only `fr` runs.
4. Trigger a manual `canary_only=true` run and confirm the canary waits for `r2-pages.yml` and live-smokes the LINE page.
5. Observe or simulate a later locale failure and confirm earlier successful locale commits remain published.
6. Rerun only the failed locale with `target_locale=<slug>` and confirm it commits independently.
7. Confirm release events do not start `Translate Full`.
8. Confirm glossary-only changes do not start `Translate Full`.
9. Check GitHub Actions summaries for selected locales, canary/batch status, artifact counts, and explicit failures.
10. Confirm the final diff from any locale commit contains only `docs/<locale>/**` and `docs/.i18n/<locale>.tm.jsonl`.
