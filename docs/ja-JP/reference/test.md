---
read_when:
    - テストの実行または修正
summary: ローカルでのテスト実行方法（Vitest）と、force/coverage モードを使うべき場面
title: テスト
x-i18n:
    generated_at: "2026-04-21T04:50:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04bdcbc3a1121f4c460cd9060f581a49dfc6fa65c4b9ddb9c87db81c4a535166
    source_path: reference/test.md
    workflow: 15
---

# テスト

- 完全なテストキット（suite、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトの control port を保持している残存 gateway プロセスを強制終了してから、分離された gateway port で完全な Vitest suite を実行し、server テストが起動中インスタンスと衝突しないようにします。以前の gateway 実行で port 18789 が占有されたままになっている場合に使用してください。
- `pnpm test:coverage`: V8 coverage を使って unit suite を実行します（`vitest.unit.config.ts` 経由）。これはロードされたファイルに対する unit coverage gate であり、repo 全体の全ファイル coverage ではありません。閾値は lines/functions/statements が 70%、branches が 55% です。`coverage.all` が false のため、この gate は unit coverage suite が読み込んだファイルを対象に計測し、分割レーンの全ソースファイルを未カバー扱いにはしません。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルに対してのみ unit coverage を実行します。
- `pnpm test:changed`: 変更された git path を、差分がルーティング可能な source/test ファイルだけを含む場合に scoped Vitest lane へ展開します。config/setup の変更は、必要な場合に wiring 編集が広く再実行されるよう、引き続きネイティブな root projects 実行へフォールバックします。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャ lane を表示します。
- `pnpm check:changed`: `origin/main` との差分に対する smart changed gate を実行します。core 作業には core test lane、extension 作業には extension test lane、test のみの作業には test typecheck/tests のみを実行し、public Plugin SDK または plugin-contract の変更は extension 検証まで拡張されます。
- `pnpm test`: 明示的な file/directory ターゲットを scoped Vitest lane 経由で実行します。ターゲットなし実行では固定 shard group を使い、ローカル並列実行のため leaf config へ展開されます。extension group は常に 1 つの巨大な root-project process ではなく、extension ごとの shard config に展開されます。
- 完全実行と extension shard 実行では、ローカル timing データを `.artifacts/vitest-shard-timings.json` に更新します。後続の実行はその timing を使って遅い shard と速い shard のバランスを取ります。ローカル timing artifact を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 一部の `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量 lane へルーティングされ、runtime の重いケースは既存 lane に残されます。
- 一部の `plugin-sdk` と `commands` の helper source ファイルも `pnpm test:changed` でそれらの軽量 lane にある明示的な sibling test にマップされるため、小さな helper 編集で重い runtime-backed suite 全体を再実行せずに済みます。
- `auto-reply` も 3 つの専用 config（`core`、`top-level`、`reply`）に分割されており、reply harness が軽量な top-level の status/token/helper テストを支配しないようになっています。
- ベース Vitest config は現在 `pool: "threads"` と `isolate: false` をデフォルトにし、共有の non-isolated runner が repo 全体の config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/Plugin shard を実行します。重い channel extension と OpenAI は専用 shard として動作し、その他の extension group はバッチのままです。1 つの同梱 Plugin lane だけ実行するには `pnpm test extensions/<id>` を使用してください。
- `pnpm test:perf:imports`: Vitest の import-duration + import-breakdown レポートを有効にしつつ、明示的な file/directory ターゲットでは引き続き scoped lane routing を使用します。
- `pnpm test:perf:imports:changed`: 同じ import profiling を、`origin/main` 以降に変更されたファイルに対してのみ実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じ commit 済み git diff に対して、routed changed-mode path とネイティブ root-project 実行をベンチマーク比較します。
- `pnpm test:perf:changed:bench -- --worktree` は、現在の worktree の変更セットをコミットせずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest main thread の CPU profile を書き出します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner の CPU + heap profile を書き出します（`.artifacts/vitest-runner-profile`）。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: gateway end-to-end smoke test（multi-instance WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` ではデフォルトで `threads` + `isolate: false` と adaptive worker を使います。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider の live test（minimax/zai）を実行します。API key と、スキップ解除のための `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認したうえで、`/api/chat/completions` を通る実際のプロキシチャットを実行します。使用可能な live model key（たとえば `~/.profile` 内の OpenAI）が必要で、外部 Open WebUI image を pull し、通常の unit/e2e suite のような CI 安定性は想定していません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway container と、`openclaw mcp serve` を起動する 2 つ目の client container を開始し、実際の stdio bridge 上でルーティングされた会話検出、transcript 読み取り、添付ファイル metadata、live event queue の挙動、outbound send routing、および Claude 風の channel + permission 通知を検証します。Claude 通知アサーションは raw stdio MCP frame を直接読み取るため、この smoke は bridge が実際に何を出力するかを反映します。

## ローカル PR gate

ローカルでの PR 着地/gate チェックには、次を実行してください:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いホストで flaky になる場合は、回帰と判断する前に 1 回再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは、次を使用します:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデル遅延ベンチマーク（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

前回実行（2025-12-31、20 runs）:

- minimax median 1279ms（min 1114、max 2431）
- opus median 2454ms（min 1224、max 3170）

## CLI 起動ベンチマーク

スクリプト: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

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

プリセット:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 両方のプリセット

出力には、各コマンドごとに `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、および max RSS 要約が含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は run ごとの V8 profile を書き出すため、タイミング計測と profile 取得が同じ harness を使用します。

保存済み出力の慣例:

- `pnpm test:startup:bench:smoke` は、対象の smoke artifact を `.artifacts/cli-startup-bench-smoke.json` に書き出します
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` で完全 suite artifact を `.artifacts/cli-startup-bench-all.json` に書き出します
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` で、チェックイン済み baseline fixture を `test/fixtures/cli-startup-bench.json` に更新します

チェックイン済み fixture:

- `test/fixtures/cli-startup-bench.json`
- 更新するには `pnpm test:startup:bench:update`
- 現在の結果を fixture と比較するには `pnpm test:startup:bench:check`

## オンボーディング E2E（Docker）

Docker は任意です。これは container 化されたオンボーディング smoke test でのみ必要です。

クリーンな Linux container での完全な cold-start フロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは pseudo-tty 経由で対話型ウィザードを操作し、config/workspace/session file を検証した後、gateway を起動して `openclaw health` を実行します。

## QR import smoke（Docker）

サポート対象の Docker Node runtime（デフォルトの Node 24、互換の Node 22）で `qrcode-terminal` が読み込まれることを確認します:

```bash
pnpm test:docker:qr
```
