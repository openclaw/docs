---
read_when:
    - テストの実行または修正
summary: ローカルでのテスト実行方法（Vitest）と、force/coverage モードを使うべき場面
title: Tests
x-i18n:
    generated_at: "2026-04-23T14:09:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0bcecb0868b3b68361e5ef78afc3170f2a481771bda8f7d54200b1d778d044a
    source_path: reference/test.md
    workflow: 15
---

# Tests

- 完全なテストキット（suite、live、Docker）: [Testing](/ja-JP/help/testing)

- `pnpm test:force`: 既定の control port を保持している残存 Gateway プロセスを強制終了し、その後、サーバーテストが実行中インスタンスと衝突しないよう、分離された Gateway port で完全な Vitest suite を実行します。以前の Gateway 実行で port 18789 が占有されたままになっている場合に使ってください。
- `pnpm test:coverage`: V8 coverage 付きで unit suite を実行します（`vitest.unit.config.ts` 経由）。これは whole-repo の all-file coverage ではなく、読み込まれたファイルに対する unit coverage gate です。閾値は lines/functions/statements が 70%、branches が 55% です。`coverage.all` が false のため、この gate は split-lane source file 全体を未カバーとみなすのではなく、unit coverage suite で読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` から変更されたファイルに対してのみ unit coverage を実行します。
- `pnpm test:changed`: diff がルーティング可能な source/test file のみを触っている場合、変更された git path をスコープ付き Vitest lane に展開します。config/setup 変更は、必要時に wiring 編集を広く再実行するため、引き続きネイティブな root project 実行にフォールバックします。
- `pnpm changed:lanes`: `origin/main` に対する diff でトリガーされるアーキテクチャ lane を表示します。
- `pnpm check:changed`: `origin/main` に対する diff 向けのスマート changed gate を実行します。core 作業は core test lane で、extension 作業は extension test lane で、test-only 作業は test typecheck/tests のみで実行し、public Plugin SDK または plugin-contract の変更は extension validation に展開し、release metadata-only の version bump は対象を絞った version/config/root-dependency チェックに維持します。
- `pnpm test`: 明示的な file/directory target をスコープ付き Vitest lane 経由でルーティングします。target なし実行では固定 shard group を使い、ローカル並列実行のため leaf config に展開されます。extension group は 1 つの巨大な root-project process ではなく、常に extension ごとの shard config に展開されます。
- 完全実行と extension shard 実行では、ローカル timing data が `.artifacts/vitest-shard-timings.json` に更新されます。後続実行では、その timing を使って遅い/速い shard のバランスを取ります。ローカル timing artifact を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 一部の `plugin-sdk` および `commands` テストファイルは、`test/setup.ts` だけを維持する専用の軽量 lane 経由でルーティングされ、ランタイムが重いケースは既存 lane に残されます。
- 一部の `plugin-sdk` および `commands` の helper source file も、`pnpm test:changed` をそれらの軽量 lane にある明示的な sibling test にマップするため、小さな helper 編集では重いランタイムバック suite の再実行を避けられます。
- `auto-reply` も、より軽い top-level status/token/helper テストを reply harness が支配しないよう、3 つの専用 config（`core`、`top-level`、`reply`）に分割されました。
- ベース Vitest config は現在、既定で `pool: "threads"` と `isolate: false` を使い、共有の非分離 runner がリポジトリ全体の config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/plugin shard を実行します。重いチャネル extension と OpenAI は専用 shard として動作し、それ以外の extension group はバッチのままです。1 つのバンドル済み Plugin lane には `pnpm test extensions/<id>` を使ってください。
- `pnpm test:perf:imports`: 明示的な file/directory target に対して引き続きスコープ付き lane ルーティングを使いながら、Vitest の import-duration + import-breakdown レポートを有効にします。
- `pnpm test:perf:imports:changed`: 同じ import profiling を、`origin/main` から変更されたファイルに対してのみ実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff に対して、ルーティングされた changed-mode path をネイティブ root-project 実行と比較ベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせず現在の worktree change set をベンチマークします。
- `pnpm test:perf:profile:main`: Vitest main thread の CPU profile を書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner の CPU + heap profile を書き込みます（`.artifacts/vitest-runner-profile`）。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in。
- `pnpm test:e2e`: Gateway の end-to-end smoke test（multi-instance WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` で、既定は `threads` + `isolate: false` と adaptive worker です。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider live test（minimax/zai）を実行します。スキップ解除には API key と `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test image と Docker E2E image を一度だけビルドし、その後 `OPENCLAW_SKIP_DOCKER_BUILD=1` 付きで Docker smoke lane を既定の並列数 4 で実行します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` で調整してください。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、runner は最初の失敗後に新しい pooled lane のスケジューリングを停止します。各 lane には 120 分の timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。起動や provider に敏感な lane は、並列 pool の後に排他的に実行されます。lane ごとのログは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際の proxy chat を実行します。使用可能な live model key（たとえば `~/.profile` の OpenAI）が必要で、外部 Open WebUI image を pull し、通常の unit/e2e suite のような CI 安定性は想定されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway container と、`openclaw mcp serve` を起動する 2 つ目の client container を立ち上げ、その後、ルーティングされた会話検出、transcript 読み取り、attachment metadata、live event queue 動作、outbound send routing、Claude 風のチャネル + permission notification を、実際の stdio bridge 上で検証します。Claude notification のアサーションは、生の stdio MCP frame を直接読み取るため、この smoke は bridge が実際に出力するものを反映します。

## ローカル PR gate

ローカルでの PR land/gate チェックには、次を実行してください。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

`pnpm test` が負荷の高いホストで flaky な場合は、退行とみなす前に 1 回再実行し、その後 `pnpm test <path/to/test>` で切り分けてください。メモリ制約のあるホストでは、次を使ってください。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデル遅延ベンチ（ローカル key）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 既定の prompt: 「Reply with a single word: ok. No punctuation or extra text.」

前回実行（2025-12-31、20 runs）:

- minimax median 1279ms（min 1114、max 2431）
- opus median 2454ms（min 1224、max 3170）

## CLI 起動ベンチ

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

- `startup`: `--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`: `health`、`status`、`status --json`、`sessions`、`sessions --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`: 両方のプリセット

出力には、各コマンドの `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、max RSS 要約が含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は run ごとの V8 profile を書き出すため、タイミング計測と profile 取得が同じ harness を使います。

保存出力の慣例:

- `pnpm test:startup:bench:smoke` は、対象を絞った smoke artifact を `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使って完全 suite artifact を `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使って、コミット済み baseline fixture `test/fixtures/cli-startup-bench.json` を更新します

コミット済み fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新
- 現在結果と fixture を比較するには `pnpm test:startup:bench:check`

## オンボーディング E2E（Docker）

Docker は任意です。これは container 化されたオンボーディング smoke test にのみ必要です。

クリーンな Linux container での完全 cold-start フロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは pseudo-tty 経由で対話型ウィザードを操作し、config/workspace/session file を検証した後、Gateway を起動して `openclaw health` を実行します。

## QR import smoke（Docker）

サポート対象の Docker Node runtime（既定の Node 24、互換の Node 22）で `qrcode-terminal` が読み込まれることを確認します:

```bash
pnpm test:docker:qr
```
