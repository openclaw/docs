---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-05T01:48:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- 更新とPluginパッケージの検証: [更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存 Gateway プロセスを終了し、隔離された Gateway ポートで Vitest スイート全体を実行して、サーバーテストが実行中のインスタンスと衝突しないようにします。以前の Gateway 実行によってポート 18789 が使用中のまま残っている場合に使用します。
- `pnpm test:coverage`: （`vitest.unit.config.ts` 経由で）V8 カバレッジ付きのユニットスイートを実行します。これは、リポジトリ全体の全ファイルカバレッジではなく、読み込まれたファイルのユニットカバレッジゲートです。しきい値は行/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` が false のため、このゲートは、すべての分割レーンのソースファイルを未カバーとして扱うのではなく、ユニットカバレッジスイートによって読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: 安価なスマート変更テスト実行です。直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルのインポートグラフから正確なターゲットを実行します。広範な/config/package 変更は、正確なテストにマップされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲変更テスト実行です。テストハーネス/config/package の編集で Vitest のより広い変更テスト動作にフォールバックさせる必要がある場合に使用します。
- `pnpm changed:lanes`: `origin/main` に対する差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` に対する差分について、スマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンに対して typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンへルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行のためにリーフ設定へ展開します。拡張機能グループは、巨大な 1 つのルートプロジェクトプロセスではなく、常に拡張機能ごとのシャード設定へ展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終わります。Vitest 自身の所要時間行はシャードごとの詳細のままです。
- 共有 OpenClaw テスト状態: テストが隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir、または auth-profile store を必要とする場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストで、実行中の Gateway、CLI env、ログキャプチャ、クリーンアップを 1 か所で必要とする場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数 home のスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットには `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を、source 可能なホスト env ファイルには `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source して、entrypoint 解決、モック OpenAI 起動、Gateway のフォアグラウンド/バックグラウンド起動、readiness probe、state env export、ログダンプ、プロセスクリーンアップを利用できます。
- full、extension、include-pattern のシャード実行は、ローカルのタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の whole-config 実行は、それらのタイミングを使って遅いシャードと速いシャードのバランスを取ります。include-pattern CI シャードはタイミングキーにシャード名を追加し、whole-config のタイミングデータを置き換えずにフィルター済みシャードのタイミングを見える状態に保ちます。ローカルタイミング成果物を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを通るようになり、ランタイム負荷の高いケースは既存のレーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストにマップされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集は、依存パスが正確な場合、すべてのシャードを広範囲実行するのではなく、ローカルのインポートグラフを使ってインポート元のテストを実行します。
- `auto-reply` は 3 つの専用設定（`core`、`top-level`、`reply`）にも分割され、reply ハーネスが軽量な top-level status/token/helper テストを支配しないようになりました。
- ベース Vitest 設定は現在、デフォルトで `pool: "threads"` と `isolate: false` になっており、共有の非隔離 runner がリポジトリ全体の設定で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` はすべての拡張機能/Plugin シャードを実行します。重いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、その他の Plugin グループはバッチ化されたままです。バンドル済み Plugin 1 つのレーンには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: Vitest のインポート所要時間 + インポート内訳レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットには引き続きスコープ付きレーンルーティングを使用します。
- `pnpm test:perf:imports:changed`: 同じインポートプロファイリングですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff について、ルーティングされた変更モードのパスをネイティブのルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリーの変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイル（`.artifacts/vitest-main-profile`）を書き込みます。
- `pnpm test:perf:profile:runner`: ユニット runner の CPU + ヒーププロファイル（`.artifacts/vitest-runner-profile`）を書き込みます。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: full-suite のすべての Vitest リーフ設定を直列に実行し、グループ化された所要時間データに加えて設定ごとの JSON/ログ成果物を書き込みます。Test Performance Agent は、遅いテストの修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に、グループ化されたレポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gateway のエンドツーエンドスモークテスト（複数インスタンスの WS/HTTP/node ペアリング）を実行します。デフォルトは `vitest.e2e.config.ts` 内の適応的 workers を備えた `threads` + `isolate: false` です。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: プロバイダーのライブテスト（minimax/zai）を実行します。スキップを解除するには API キーと `LIVE=1`（またはプロバイダー固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有ライブテストイメージをビルドし、OpenClaw を npm tarball として 1 回だけ pack し、ベア Node/Git runner イメージと、その tarball を `/app` にインストールする機能イメージをビルド/再利用してから、重み付きスケジューラー経由で `OPENCLAW_SKIP_DOCKER_BUILD=1` を使って Docker スモークレーンを実行します。ベアイメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は installer/update/plugin-dependency レーンに使用されます。それらのレーンはコピーされたリポジトリソースを使う代わりに、事前ビルド済み tarball をマウントします。機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は通常のビルド済みアプリ機能レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` は単一のローカル/CI package packer で、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあります。planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択された plan を実行します。`node scripts/test-docker-all.mjs --plan-json` は、ビルドや Docker 実行をせずに、選択レーン、イメージ種別、package/live-image の必要性、state scenario、credential check について、スケジューラー所有の CI plan を出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` はプロバイダーに敏感な tail pool を制御し、デフォルトは 10 です。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。プロバイダー上限は、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、デフォルトでプロバイダーごとに重いレーン 1 つです。より大きなホストには `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列ホストで 1 つのレーンが有効な重みまたはリソース上限を超える場合でも、空の pool から開始でき、そのキャパシティを解放するまで単独で実行されます。ローカル Docker daemon の create storm を避けるため、レーン開始はデフォルトで 2 秒ずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きします。runner はデフォルトで Docker をプリフライトし、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとに active-lane status を出力し、互換性のあるレーン間でプロバイダー CLI ツールキャッシュを共有し、一時的なライブプロバイダー失敗をデフォルトで 1 回再試行（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）し、後続実行で longest-first 並びに使うためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーン manifest を出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を、status 出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を、タイミング再利用を無効化するには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を、ライブプロバイダーレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。package エイリアスは `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only mode は main と tail のライブレーンを 1 つの longest-first pool に統合し、プロバイダーバケットが Claude、Codex、Gemini の作業を一緒に詰め込めるようにします。runner は、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の失敗後に新しい pooled lane のスケジューリングを停止します。各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンでは、より厳しいレーンごとの上限を使用します。CLI backend Docker セットアップコマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）による独自のタイムアウトがあります。レーンごとのログ、`summary.json`、`failures.json`、フェーズタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンの調査には `pnpm test:docker:timings <summary.json>` を、安価で対象を絞った再実行コマンドの出力には `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium ベースの source E2E コンテナをビルドし、生 CDP と隔離された Gateway を起動し、`browser doctor --deep` を実行し、CDP ロールスナップショットにリンク URL、カーソル昇格された clickable、iframe refs、frame metadata が含まれることを検証します。
- CLI backend live Docker probe は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように、焦点を絞ったレーンとして実行できます。Claude と Gemini には対応する `:resume` と `:mcp` エイリアスがあります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際のプロキシチャットを実行します。利用可能なライブモデルキー（たとえば `~/.profile` の OpenAI）が必要で、外部 Open WebUI イメージを pull します。また、通常の unit/e2e スイートほど CI 安定であることは想定されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway コンテナと、`openclaw mcp serve` を spawn する 2 つ目のクライアントコンテナを起動し、ルーティングされた会話検出、transcript 読み取り、添付 metadata、ライブ event queue 動作、outbound send ルーティング、実際の stdio ブリッジ越しの Claude 形式チャンネル + permission 通知を検証します。Claude 通知アサーションは、生の stdio MCP frame を直接読み取るため、スモークはブリッジが実際に発行する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: 汚れた旧ユーザーフィクスチャの上にパック済みの OpenClaw tarball をインストールし、ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行してから、ループバック Gateway を起動し、エージェント、チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: 既定では `openclaw@latest` をインストールし、ライブプロバイダーやチャンネルキーなしで現実的な既存ユーザーファイルをシードし、組み込みの `openclaw config set` コマンドレシピでそのベースラインを設定し、その公開済みインストールをパック済みの OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、ループバック Gateway を起動し、設定済みインテント、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係状態、起動、`/healthz`、`/readyz`、RPC ステータスが維持されるか、きれいに修復されることを確認します。1 つのベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、`all-since-2026.4.23` などの `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で厳密なマトリクスを展開し、または `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加します。reported-issues セットには、アップグレード中に設定済みの外部 OpenClaw plugins が自動インストールされることを検証する `configured-plugin-installs` と、ソースのみの Plugin シャドウで起動が壊れないようにする `stale-source-plugin-shadow` が含まれます。Package Acceptance では、これらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開します。
- `pnpm test:docker:update-migration`: 既定では `openclaw@2026.4.23` から開始し、クリーンアップの多い `plugin-deps-cleanup` シナリオで公開済みアップグレード survivor ハーネスを実行します。別個の `Update Migration` ワークフローは、このレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定版公開済みパッケージが候補版へ更新され、Full Release CI の外で設定済み Plugin 依存関係クリーンアップを証明します。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリパッケージ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査について、インストール/更新 smoke を実行します。

## ローカル PR ゲート

ローカルの PR land/gate チェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` がフレークした場合は、回帰として扱う前に一度だけ再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ (ローカルキー)

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の環境変数: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「単語 1 つで返信してください: ok。句読点や追加テキストは不要です。」

最終実行 (2025-12-31、20 回実行):

- minimax 中央値 1279ms (最小 1114、最大 2431)
- opus 中央値 2454ms (最小 1224、最大 3170)

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

出力には、各コマンドの `sampleCount`、avg、p50、p95、min/max、終了コード/シグナル分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込むため、タイミングとプロファイル取得で同じハーネスを使用します。

保存出力の規約:

- `pnpm test:startup:bench:smoke` は、対象を絞ったスモークアーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用して、フルスイートアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャ `test/fixtures/cli-startup-bench.json` を更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新します
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較します

## オンボーディング E2E (Docker)

Docker は任意です。これはコンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、疑似 tty 経由で対話型ウィザードを駆動し、config/workspace/session ファイルを検証してから、Gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク (Docker)

メンテナンスされている QR ランタイムヘルパーが、サポートされている Docker Node ランタイム (デフォルトは Node 24、Node 22 互換) でロードされることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と plugins のテスト](/ja-JP/help/testing-updates-plugins)
