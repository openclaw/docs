---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と、force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-02T05:05:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1100eb4c5990de1a56c8fd65c6152318316232414078cdaad122d4525bf27fee
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- アップデートと Plugin パッケージ検証: [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)

- `pnpm test:force`: 既定の制御ポートを保持している残留 Gateway プロセスを終了し、分離された Gateway ポートで Vitest スイート全体を実行するため、サーバーテストが実行中のインスタンスと衝突しません。以前の Gateway 実行でポート 18789 が使用中のままになった場合に使用します。
- `pnpm test:coverage`: V8 カバレッジでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これは読み込まれたファイルのユニットカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/文が 70%、分岐が 55% です。`coverage.all` が false のため、このゲートは、すべての分割レーンのソースファイルを未カバーとして扱うのではなく、ユニットカバレッジスイートで読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルに対してのみユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストのスマート変更テスト実行です。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフから正確なターゲットを実行します。広範な設定/パッケージ変更は、正確なテストにマップされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲変更テスト実行です。テストハーネス/設定/パッケージの編集で、Vitest のより広い変更テスト動作にフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` との差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンに対して typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証跡には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンにルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行のためにリーフ設定へ展開します。拡張機能グループは、巨大なルートプロジェクトプロセス 1 つではなく、常に拡張機能ごとのシャード設定に展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 独自の所要時間行は、シャードごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストで分離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定フィクスチャ、ワークスペース、エージェントディレクトリ、または auth-profile ストアが必要な場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストで、実行中の Gateway、CLI 環境、ログキャプチャ、クリーンアップを一か所で必要とする場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数ホームのスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。より低レベルの呼び出し元は、コンテナ内シェルスニペット用に `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を使用するか、source 可能なホスト env ファイル用に `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱うのを防ぎます。Gateway を起動する Docker/Bash レーンは、エントリポイント解決、モック OpenAI 起動、Gateway のフォアグラウンド/バックグラウンド起動、readiness プローブ、状態 env エクスポート、ログダンプ、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- フル、拡張機能、include-pattern のシャード実行は、ローカルのタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。以降の全設定実行では、そのタイミングを使って遅いシャードと速いシャードのバランスを取ります。include-pattern CI シャードは、タイミングキーにシャード名を追加します。これにより、全設定タイミングデータを置き換えずに、フィルター済みシャードのタイミングを可視化したままにできます。ローカルタイミング成果物を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` だけを残す専用の軽量レーンを経由するようになり、ランタイムの重いケースは既存のレーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマップされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集では、依存パスが正確な場合、すべてのシャードを広範囲実行する代わりに、ローカルインポートグラフを使ってインポート元テストを実行します。
- `auto-reply` は現在、3 つの専用設定（`core`、`top-level`、`reply`）にも分割されているため、reply ハーネスがより軽量なトップレベルのステータス/トークン/ヘルパーテストを支配しません。
- ベース Vitest 設定は現在、既定で `pool: "threads"` と `isolate: false` になり、共有の非分離ランナーがリポジトリ全体の設定で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` はすべての拡張機能/Plugin シャードを実行します。重いチャンネルPlugin、ブラウザーPlugin、OpenAI は専用シャードとして実行されます。他の Plugin グループはバッチ化されたままです。バンドル済み Plugin レーンを 1 つだけ実行するには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: Vitest のインポート時間 + インポート内訳レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットには引き続きスコープ付きレーンルーティングを使用します。
- `pnpm test:perf:imports:changed`: 同じインポートプロファイリングですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git 差分に対して、ルーティングされた changed-mode パスをネイティブのルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリー変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイルを書き出します（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: ユニットランナーの CPU + ヒーププロファイルを書き出します（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべてのフルスイート Vitest リーフ設定を直列に実行し、グループ化された所要時間データと設定ごとの JSON/ログ成果物を書き出します。Test Performance Agent は、遅いテストの修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に、グループ化されたレポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gateway のエンドツーエンドスモークテスト（複数インスタンスの WS/HTTP/node ペアリング）を実行します。既定では `threads` + `isolate: false` を使用し、`vitest.e2e.config.ts` で適応型ワーカーを使います。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: プロバイダーのライブテスト（minimax/zai）を実行します。スキップ解除には API キーと `LIVE=1`（またはプロバイダー固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有ライブテストイメージをビルドし、OpenClaw を npm tarball として一度パックし、ベア Node/Git ランナーイメージと、その tarball を `/app` にインストールする機能イメージをビルド/再利用してから、重み付きスケジューラーを通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker スモークレーンを実行します。ベアイメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は、インストーラー/更新/Plugin 依存関係レーンに使用されます。これらのレーンは、コピーされたリポジトリソースの代わりに事前ビルド済み tarball をマウントします。機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は、通常のビルド済みアプリ機能レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` はローカル/CI 共通の単一パッケージパッカーであり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行します。`node scripts/test-docker-all.mjs --plan-json` は、ビルドや Docker 実行をせずに、選択されたレーン、イメージ種別、パッケージ/ライブイメージ要件、状態シナリオ、資格情報チェックについて、スケジューラー所有の CI プランを出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、既定値は 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` はプロバイダーに敏感な tail プールを制御し、既定値は 10 です。重いレーンの上限は、既定で `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。プロバイダー上限は、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、既定でプロバイダーごとに重いレーン 1 つです。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列ホストで 1 つのレーンが有効な重みまたはリソース上限を超える場合でも、空のプールから開始でき、容量を解放するまで単独で実行されます。ローカル Docker デーモンの create ストームを避けるため、レーン開始は既定で 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。ランナーは既定で Docker を事前チェックし、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとにアクティブレーン状態を出力し、互換性のあるレーン間でプロバイダー CLI ツールキャッシュを共有し、一時的なライブプロバイダー失敗を既定で 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、以降の実行で最長優先順序に使うためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、状態出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を使用し、タイミング再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を使用し、ライブプロバイダーレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。パッケージエイリアスは `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only モードでは、メインと tail のライブレーンを 1 つの最長優先プールに統合するため、プロバイダーバケットは Claude、Codex、Gemini の作業をまとめて詰め込めます。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、ランナーは最初の失敗後に新しいプール済みレーンのスケジュールを停止します。各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンは、より厳しいレーンごとの上限を使用します。CLI バックエンド Docker セットアップコマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（既定 180）による独自のタイムアウトがあります。レーンごとのログ、`summary.json`、`failures.json`、フェーズタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調べるには `pnpm test:docker:timings <summary.json>` を使用し、低コストの対象限定再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium ベースのソース E2E コンテナをビルドし、raw CDP と分離された Gateway を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットにリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータが含まれることを検証します。
- CLI バックエンドのライブ Docker プローブは、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように、焦点を絞ったレーンとして実行できます。Claude と Gemini には対応する `:resume` と `:mcp` エイリアスがあります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際のプロキシされたチャットを実行します。利用可能なライブモデルキー（たとえば `~/.profile` 内の OpenAI）が必要で、外部 Open WebUI イメージを pull します。通常の unit/e2e スイートのように CI 安定であることは想定されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、実際の stdio ブリッジ上で、ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキュー動作、アウトバウンド送信ルーティング、Claude 形式のチャンネル + 権限通知を検証します。Claude 通知アサーションは raw stdio MCP フレームを直接読み取るため、このスモークはブリッジが実際に発行する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: 汚れた旧ユーザーフィクスチャにパック済みの OpenClaw tarball をインストールし、ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行してから、loopback Gateway を起動し、エージェント、チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: 既定で `openclaw@latest` をインストールし、ライブプロバイダーやチャンネルキーなしで現実的な既存ユーザーファイルをシードし、焼き込み済みの `openclaw config set` コマンドレシピでそのベースラインを設定し、その公開済みインストールをパック済みの OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、loopback Gateway を起動し、設定済み intent、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係状態、起動、`/healthz`、`/readyz`、RPC ステータスが維持されるか正常に修復されることを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で 1 つのベースラインを上書きし、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なマトリックスを展開し、または `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加します。パッケージ受け入れでは、それらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開します。
- `pnpm test:docker:update-migration`: クリーンアップ負荷の高い `plugin-deps-cleanup` シナリオで、公開済みアップグレードサバイバーハーネスを実行します。既定では `openclaw@2026.4.23` から開始します。別の `Update Migration` ワークフローはこのレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定版公開済みパッケージを候補版に更新して、フルリリース CI の外で設定済み Plugin 依存関係のクリーンアップを証明します。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリパッケージ、git moving ref、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査について、インストール/更新 smoke を実行します。

## ローカル PR ゲート

ローカルで PR の land/gate チェックを行うには、次を実行します:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定になる場合は、回帰として扱う前に一度だけ再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホストでは、次を使用します:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「単語を1つだけ返してください: ok。句読点や追加テキストは不要です。」

直近の実行（2025-12-31、20回実行）:

- minimax 中央値 1279ms（最小 1114、最大 2431）
- opus 中央値 2454ms（最小 1224、最大 3170）

## CLI 起動ベンチ

スクリプト: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

使用法:

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナル分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は、実行ごとに V8 プロファイルを書き込むため、タイミングとプロファイル取得に同じハーネスを使用します。

保存済み出力の規約:

- `pnpm test:startup:bench:smoke` は、対象を絞ったスモーク成果物を `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用して、フルスイート成果物を `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、疑似 tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証してから、Gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク（Docker）

保守されている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 がデフォルト、Node 22 が互換）で読み込まれることを確認します:

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
