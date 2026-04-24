---
read_when:
    - テストの実行または修正
summary: Vitestを使ってローカルでテストを実行する方法と、force/coverage modeを使うべきタイミング
title: テスト
x-i18n:
    generated_at: "2026-04-24T05:20:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a333c438357bc719cc3cda536c417f044ea5e03a366b76d2c7d1ff434ca1587b
    source_path: reference/test.md
    workflow: 15
---

- フルテストキット（suite、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトcontrol portを保持している残留gateway processをkillし、その後、分離されたgateway portでフルVitest suiteを実行して、server testが実行中instanceと衝突しないようにします。以前のgateway実行でport 18789が占有されたままになっている場合に使ってください。
- `pnpm test:coverage`: V8 coverage付きでunit suiteを実行します（`vitest.unit.config.ts` 経由）。これは、読み込まれたfileに対するunit coverage gateであり、repo全体の全file coverageではありません。thresholdは lines/functions/statements が70%、branches が55%です。`coverage.all` がfalseなので、このgateは、分割lane内のすべてのsource fileを未カバーとして扱うのではなく、unit coverage suiteで読み込まれたfileを測定します。
- `pnpm test:coverage:changed`: `origin/main` から変更されたfileだけに対してunit coverageを実行します。
- `pnpm test:changed`: diffがroute可能なsource/test fileだけに触れている場合、変更されたgit pathをscoped Vitest laneへ展開します。config/setup変更では、配線変更時に必要に応じて広く再実行できるよう、ネイティブroot project runへフォールバックします。
- `pnpm changed:lanes`: `origin/main` に対するdiffによって起動されるarchitectural laneを表示します。
- `pnpm check:changed`: `origin/main` に対するdiff向けのsmart changed gateを実行します。core作業はcore test laneとともに、extension作業はextension test laneとともに、test-only作業はtest typecheck/testsのみで実行し、公開Plugin SDKまたはplugin-contract変更は1回のextension validation passへ展開し、release metadata-only version bumpは対象を絞ったversion/config/root-dependency checkのまま維持します。
- `pnpm test`: 明示的なfile/directory targetをscoped Vitest lane経由でルーティングします。targetなし実行では固定shard groupを使い、ローカル並列実行のためにleaf configへ展開します。extension groupは、1つの巨大なroot-project processではなく、常にextensionごとのshard configへ展開されます。
- フル実行およびextension shard実行では、ローカルtiming dataが `.artifacts/vitest-shard-timings.json` に更新されます。後続実行では、それらのtimingを使って遅いshardと速いshardのバランスを取ります。ローカルtiming artifactを無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 一部の `plugin-sdk` および `commands` test fileは、`test/setup.ts` のみを維持する専用light lane経由でルーティングされ、runtimeが重いcaseは既存laneに残ります。
- 一部の `plugin-sdk` および `commands` helper source fileも、これらのlight lane内の明示的な隣接testへ `pnpm test:changed` をマッピングするため、小さなhelper編集で重いruntime依存suite全体を再実行せずに済みます。
- `auto-reply` も3つの専用config（`core`, `top-level`, `reply`）に分割され、reply harnessが軽量なtop-level status/token/helper testを支配しないようになりました。
- ベースVitest configは現在、デフォルトで `pool: "threads"` と `isolate: false` を使い、共有non-isolated runnerがrepo config全体で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` はすべてのextension/plugin shardを実行します。重いchannel plugin、browser plugin、OpenAIは専用shardとして実行され、その他のplugin groupはまとめて処理されます。1つのbundled plugin laneには `pnpm test extensions/<id>` を使ってください。
- `pnpm test:perf:imports`: Vitest import-durationとimport-breakdownレポートを有効にしつつ、明示的なfile/directory targetには引き続きscoped lane routingを使います。
- `pnpm test:perf:imports:changed`: 同じimport profilingですが、`origin/main` から変更されたfileのみが対象です。
- `pnpm test:perf:changed:bench -- --ref <git-ref>`: 同じcommit済みgit diffに対して、routed changed-mode pathとネイティブroot-project runをbenchmarkします。
- `pnpm test:perf:changed:bench -- --worktree`: 先にcommitせず、現在のworktree change setをbenchmarkします。
- `pnpm test:perf:profile:main`: Vitest main threadのCPU profileを出力します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runnerのCPU + heap profileを出力します（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: フルsuiteのVitest leaf configをすべてserialに実行し、group化されたduration dataとconfigごとのJSON/log artifactを書き出します。Test Performance Agentは、遅いtestの修正を試みる前のbaselineとしてこれを使います。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後にgroup化レポートを比較します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でopt-inします。
- `pnpm test:e2e`: gateway end-to-end smoke test（multi-instance WS/HTTP/node pairing）を実行します。デフォルトでは `vitest.e2e.config.ts` で `threads` + `isolate: false` とadaptive workerを使います。`OPENCLAW_E2E_WORKERS=<n>` で調整し、verbose logが必要なら `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider live test（minimax/zai）を実行します。unskipするにはAPI keyと `LIVE=1`（またはprovider固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有live-test imageとDocker E2E imageを1回だけbuildし、その後デフォルト並列度4で `OPENCLAW_SKIP_DOCKER_BUILD=1` を付けてDocker smoke laneを実行します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` で調整してください。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、runnerは最初のfailure後に新しいpooled laneのスケジューリングを停止し、各laneには120分のtimeoutがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。startupまたはproviderに敏感なlaneは、並列poolの後に排他的に実行されます。laneごとのlogは `.artifacts/docker-tests/<run-id>/` 配下に書き出されます。
- `pnpm test:docker:openwebui`: Docker化されたOpenClaw + Open WebUIを起動し、Open WebUI経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際のproxy chatを実行します。利用可能なlive model key（たとえば `~/.profile` 内のOpenAI）が必要で、外部Open WebUI imageをpullし、通常のunit/e2e suiteのようにCI安定であることは想定していません。
- `pnpm test:docker:mcp-channels`: seed済みGateway containerと、`openclaw mcp serve` を起動する2つ目のclient containerを開始し、その後、実際のstdio bridge上で、routed conversation discovery、transcript read、attachment metadata、live event queue動作、outbound send routing、Claude形式のchannel + permission notificationを検証します。Claude notification assertionは生のstdio MCP frameを直接読み取るため、このsmokeはbridgeが実際に出力するものを反映します。

## ローカルPR gate

ローカルでPRのland/gate checkを行うには、次を実行してください:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いhostでflakeした場合は、回帰とみなす前に1回だけ再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。memory制約のあるhostでは、次を使ってください:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシbench（ローカルkey）

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトprompt: 「Reply with a single word: ok. No punctuation or extra text.」

前回実行（2025-12-31、20 runs）:

- minimax median 1279ms（min 1114、max 2431）
- opus median 2454ms（min 1224、max 3170）

## CLI startup bench

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

使い方:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preset:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 両方のpreset

出力には、各commandの `sampleCount`、avg、p50、p95、min/max、exit-code/signal distribution、およびmax RSS summaryが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は、runごとにV8 profileを書き出すため、timing取得とprofile captureが同じharnessを使います。

保存済み出力の慣例:

- `pnpm test:startup:bench:smoke` は、対象smoke artifactを `.artifacts/cli-startup-bench-smoke.json` に書き出します
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使ってフルsuite artifactを `.artifacts/cli-startup-bench-all.json` に書き出します
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使って、check-in済みbaseline fixtureを `test/fixtures/cli-startup-bench.json` に更新します

check-in済みfixture:

- `test/fixtures/cli-startup-bench.json`
- 更新するには `pnpm test:startup:bench:update`
- 現在の結果をfixtureと比較するには `pnpm test:startup:bench:check`

## オンボーディングE2E（Docker）

Dockerは任意です。これはcontainer化されたオンボーディングsmoke testにだけ必要です。

クリーンなLinux containerでのフルcold-start flow:

```bash
scripts/e2e/onboard-docker.sh
```

このscriptはpseudo-tty経由で対話型ウィザードを操作し、config/workspace/session fileを検証してから、gatewayを起動して `openclaw health` を実行します。

## QR import smoke（Docker）

メンテナンス対象のQR runtime helperが、サポート対象のDocker Node runtime（デフォルトNode 24、互換Node 22）で読み込まれることを確認します:

```bash
pnpm test:docker:qr
```

## 関連

- [Testing](/ja-JP/help/testing)
- [Testing live](/ja-JP/help/testing-live)
