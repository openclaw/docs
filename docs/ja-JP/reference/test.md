---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法（vitest）と force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-04-30T18:38:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存 Gateway プロセスを強制終了し、隔離された Gateway ポートで Vitest スイート全体を実行して、サーバーテストが実行中のインスタンスと衝突しないようにします。以前の Gateway 実行でポート 18789 が占有されたままになった場合に使用します。
- `pnpm test:coverage`: V8 カバレッジでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これは読み込まれたファイルのユニットカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は lines/functions/statements が 70%、branches が 55% です。`coverage.all` が false のため、このゲートは、すべての分割レーンのソースファイルを未カバーとして扱うのではなく、ユニットカバレッジスイートに読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストなスマート変更テスト実行です。直接編集されたテスト、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフから精密なターゲットを実行します。広範な config/package 変更は、精密なテストにマップされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲の変更テスト実行です。テストハーネス/config/package の編集で、Vitest のより広い changed-test 挙動にフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` との差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの typecheck、lint、guard コマンドを実行しますが、Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンへルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行のためにリーフ config へ展開します。extension グループは、巨大な 1 つのルートプロジェクトプロセスではなく、常に extension ごとのシャード config に展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終わります。Vitest 自身の duration 行はシャードごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストが隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir、auth-profile store を必要とする場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストで、実行中の Gateway、CLI env、ログキャプチャ、クリーンアップを 1 か所で必要とする場合は `test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナへ渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。multi-home スクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットには `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を、source 可能なホスト env ファイルには `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、entrypoint 解決、モック OpenAI 起動、Gateway の foreground/background 起動、readiness probe、state env export、ログダンプ、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- full、extension、include-pattern のシャード実行は、ローカルタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の whole-config 実行は、そのタイミングを使って遅いシャードと速いシャードのバランスを取ります。include-pattern CI シャードはタイミングキーにシャード名を追加するため、whole-config タイミングデータを置き換えずに、フィルターされたシャードのタイミングを可視化したままにできます。ローカルタイミングアーティファクトを無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーン経由でルーティングされるようになり、runtime-heavy なケースは既存のレーンに残ります。
- 隣接テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その隣接テストにマップされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集は、依存パスが精密な場合、すべてのシャードを広範囲に実行するのではなく、ローカル import グラフを使って import しているテストを実行します。
- `auto-reply` は 3 つの専用 config（`core`、`top-level`、`reply`）にも分割されるようになったため、reply ハーネスが軽量な top-level status/token/helper テストを支配しません。
- ベース Vitest config は `pool: "threads"` と `isolate: false` をデフォルトにし、共有の非隔離ランナーがリポジトリ config 全体で有効になりました。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` はすべての extension/Plugin シャードを実行します。重いチャネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、その他の Plugin グループはバッチのままです。バンドルされた Plugin レーンを 1 つ実行するには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: Vitest の import-duration と import-breakdown レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットにはスコープ付きレーンルーティングを引き続き使用します。
- `pnpm test:perf:imports:changed`: 同じ import プロファイリングですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff について、ルーティングされた changed-mode パスをネイティブのルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、現在の worktree の変更セットを、先にコミットせずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイルを書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: ユニットランナーの CPU + heap プロファイルを書き込みます（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: full-suite のすべての Vitest リーフ config を直列に実行し、グループ化された duration データと config ごとの JSON/log アーティファクトを書き込みます。Test Performance Agent は、slow-test 修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンスに焦点を当てた変更後に、グループ化されたレポートを比較します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in します。
- `pnpm test:e2e`: Gateway の end-to-end smoke tests（multi-instance WS/HTTP/node pairing）を実行します。デフォルトは `vitest.e2e.config.ts` の adaptive workers 付き `threads` + `isolate: false` です。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: provider live tests（minimax/zai）を実行します。skip を解除するには API keys と `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test image をビルドし、OpenClaw を npm tarball として 1 回 pack し、bare Node/Git runner image と、その tarball を `/app` にインストールする functional image をビルド/再利用してから、weighted scheduler 経由で `OPENCLAW_SKIP_DOCKER_BUILD=1` を使って Docker smoke lanes を実行します。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は installer/update/plugin-dependency lanes に使用されます。これらのレーンはコピーされたリポジトリソースを使うのではなく、事前ビルド済み tarball をマウントします。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は通常の built-app functionality lanes に使用されます。`scripts/package-openclaw-for-docker.mjs` は単一の local/CI package packer で、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker lane definitions は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner logic は `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択された plan を実行します。`node scripts/test-docker-all.mjs --plan-json` は、ビルドや Docker 実行なしで、選択されたレーン、image kinds、package/live-image needs、state scenarios、credential checks について scheduler-owned CI plan を出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider-sensitive tail pool を制御し、デフォルトは 10 です。重いレーンの caps はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider caps は `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、デフォルトで provider ごとに 1 つの重いレーンになります。より大きいホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列度のホストで 1 つのレーンが有効な weight または resource cap を超える場合でも、空の pool から開始でき、capacity を解放するまで単独で実行されます。レーン開始は、ローカル Docker daemon の create storm を避けるため、デフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。ランナーはデフォルトで Docker を preflight し、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとに active-lane status を出力し、互換レーン間で provider CLI tool caches を共有し、一時的な live-provider failures をデフォルトで 1 回 retry し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行の longest-first ordering のために `.artifacts/docker-tests/lane-timings.json` にレーンタイミングを保存します。Docker を実行せずに lane manifest を出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を、status output を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を、timing reuse を無効化するには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/local lanes のみにするには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を、live-provider lanes のみにするには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。package aliases は `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only mode は main と tail の live lanes を 1 つの longest-first pool に統合し、provider buckets が Claude、Codex、Gemini の作業をまとめて詰められるようにします。ランナーは、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の失敗後に新しい pooled lanes のスケジュールを停止します。各レーンには 120 分の fallback timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail lanes では、より厳しい per-lane caps が使用されます。CLI backend Docker setup commands には `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）による独自の timeout があります。レーンごとのログ、`summary.json`、`failures.json`、phase timings は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調べるには `pnpm test:docker:timings <summary.json>` を、低コストな targeted rerun commands を出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium-backed source E2E コンテナをビルドし、raw CDP と隔離された Gateway を起動し、`browser doctor --deep` を実行して、CDP role snapshots に link URLs、cursor-promoted clickables、iframe refs、frame metadata が含まれることを検証します。
- CLI backend live Docker probes は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のような focused lanes として実行できます。Claude と Gemini には対応する `:resume` と `:mcp` aliases があります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際の proxied chat を実行します。使用可能な live model key（たとえば `~/.profile` の OpenAI）が必要で、外部 Open WebUI image を pull し、通常の unit/e2e suites のように CI-stable であることは期待されません。
- `pnpm test:docker:mcp-channels`: seed 済みの Gateway コンテナと、`openclaw mcp serve` を spawn する 2 つ目の client コンテナを起動し、routed conversation discovery、transcript reads、attachment metadata、live event queue behavior、outbound send routing、Claude-style channel + permission notifications を実際の stdio bridge 越しに検証します。Claude notification assertion は raw stdio MCP frames を直接読み取るため、この smoke は bridge が実際に発行する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: 変更を含む旧ユーザーフィクスチャに、パック済みの OpenClaw tarball を上書きインストールし、ライブのプロバイダーキーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行した後、ループバック Gateway を起動し、エージェント、チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古い Plugin runtime-deps 状態、起動、RPC ステータスが維持されることを確認します。

## ローカル PR ゲート

ローカルの PR land/ゲートチェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` がフレークした場合は、回帰として扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の環境変数: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「1語だけで返信してください: ok。句読点や余分なテキストは含めないでください。」

最終実行（2025-12-31、20回実行）:

- minimax 中央値 1279ms（最小 1114、最大 2431）
- opus 中央値 2454ms（最小 1224、最大 3170）

## CLI 起動ベンチ

スクリプト: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

使用方法:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

プリセット:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 両方のプリセット

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナル分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込むため、タイミングとプロファイルキャプチャは同じハーネスを使用します。

保存される出力の規約:

- `pnpm test:startup:bench:smoke` は対象のスモーク成果物を `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は `runs=5` と `warmup=1` を使用してフルスイート成果物を `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は `runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新します
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較します

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは疑似 tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証した後、Gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク（Docker）

メンテナンス対象の QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 デフォルト、Node 22 互換）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
