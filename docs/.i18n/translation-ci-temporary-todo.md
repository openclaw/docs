# Translation CI Temporary TODO

Temporary operator note for the current translation CI failures. Remove this file after the workflow fixes land and the affected locales have been recovered.

## Issues To Fix

1. Add `queue: max` to the `r2-pages.yml` concurrency group and update tests/documentation to match GitHub's queue semantics. `cancel-in-progress: false` protects the running upload but does not preserve every pending upload; without `queue: max`, rapid locale-scoped dispatches can cancel older pending R2 Pages runs before any upload job starts.
2. Align the incremental locale matrix with the finalizer's expected locale list. The finalizer currently expects `hi` and `ru` artifacts, but `translate-incremental.yml` does not schedule those locales, so an otherwise successful aggregate incremental run can still fail with incomplete locales after committing and publishing successful artifacts.
3. Split large full-translation locales into multiple shards. A `Translate ru shard 0/1` job that runs for about two hours and ends with `Error: The operation was canceled` is a translation job timeout, not an R2 publish queue cancellation. Full runs with `pending_limit: "0"` can produce hundreds of documents for one locale; a single shard with `worker_parallel: "3"` may not finish within the reusable workflow's 120-minute timeout.
   - Use a conservative first-pass shard policy: `shard_total = ceil(source_doc_count / 250)`, capped to `1..4`. Source docs are an upper bound for full pending docs, so this avoids under-sharding large locales without adding locale-specific planning state. The observed `ru` case had `696` pending docs, so it should run as `3` shards.
   - Keep overall translation concurrency bounded while adding shards: preserve full batch `max-parallel: 3` and `worker_parallel: "3"` unless a separate budget review changes them. Sharding should reduce per-job duration, not increase peak active workers.
   - Prefer a locale-level finalizer for sharded full translation. Shard jobs should upload artifacts only; one finalizer for that locale should download every shard artifact, apply them together, run one docs check, push one locale commit, and dispatch one locale-scoped R2 publish. Do not let each shard independently commit and publish the same locale.
4. Keep translation memory in sharded full artifacts. Translation memory is locale-global, so one shard artifact should carry `docs/.i18n/<locale>.tm.jsonl` for the locale finalizer; otherwise full translation shards can finish successfully while the commit/finalizer stage misses refreshed TM state.
5. Keep canary finalization lightweight. Canary runs should verify artifact apply, canary scope enforcement, and commit control-plane behavior without running full `npm run docs:check` or waiting for a page-scoped R2 build; full locale/final publish paths remain strict.

## Post-Fix Operator Steps

After the workflow fixes land on `main`, publish and recover in this order:

1. Manually run `R2 Pages` on `main` with `artifact_scope=full` and `force_upload=true` to publish any translation commits that already reached `main`. This only publishes committed docs; it does not recover translations that exist only in old workflow artifacts.
2. Rerun failed or missing locales as targeted `Translate Full` runs instead of rerunning all locales. Use `target_locale=<slug>` for each incomplete locale, such as `hi` or `ru`, after the matrix/finalizer locale list has been corrected.
3. Do not rely on rerunning only an old finalizer/commit job after changing workflow code. Reusable workflows execute from the workflow ref of that old run, and finalizers can only apply artifacts that were actually produced and are still available. When in doubt, rerun the affected locale workflow so translation, validation, commit, and R2 publish use the fixed control plane.
4. Watch the dispatched `R2 Pages` runs after the fix: pending R2 uploads should queue instead of being cancelled with a higher-priority waiting-request annotation. A locale job that runs close to two hours and cancels during `docs-i18n` output should be treated as a translation timeout and handled by sharding or a timeout-budget change.

## Acceptance Checklist

1. Trigger targeted recovery for every known incomplete language after the fix lands. At minimum, rerun `Translate Full` for `hi` and `ru`; add any other failed or cancelled locale from the latest full/incremental summaries.
2. Confirm each targeted locale produces all expected shard artifacts, the locale-level finalizer commits the translated pages and translation memory, and the commit reaches `main`.
3. For any locale whose translation artifacts were produced but whose finalizer/commit failed, rerun the targeted locale workflow after the control-plane fix so translation, artifact apply, commit, and publish all use the fixed workflow code.
4. Confirm each recovered locale dispatches and completes a locale-scoped `R2 Pages` publish. If a publish is missed but the commit is already on `main`, run a manual full `R2 Pages` publish to push the committed output.
5. Confirm the latest full or incremental workflow summary no longer lists the recovered languages as missing, failed, cancelled, or incomplete.
