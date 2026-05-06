---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-06T09:09:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- 更新とPluginパッケージの検証: [更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存 Gateway プロセスを終了し、サーバーテストが実行中のインスタンスと衝突しないよう、分離された Gateway ポートで Vitest スイート全体を実行します。以前の Gateway 実行でポート 18789 が使用中のまま残った場合に使用します。
- `pnpm test:coverage`: V8 カバレッジを有効にして（`vitest.unit.config.ts` 経由で）ユニットスイートを実行します。これはデフォルトのユニットレーンのカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` は false で、デフォルトレーンはカバレッジ対象を兄弟ソースファイルを持つ非 fast ユニットテストにスコープするため、このゲートは偶然ロードされたすべての推移的インポートではなく、このレーンが所有するソースを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: 安価なスマート変更テスト実行です。直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフから正確なターゲットを実行します。広範な設定/パッケージ変更は、正確なテストにマッピングされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲変更テスト実行です。テストハーネス/設定/パッケージの編集で、Vitest のより広範な変更テスト動作へフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` との差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの型チェック、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットを、スコープ済み Vitest レーン経由でルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行のためにリーフ設定へ展開します。拡張グループは、巨大な単一ルートプロジェクトプロセスではなく、常に拡張ごとのシャード設定へ展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終わります。Vitest 自身の所要時間行はシャードごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストで分離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定フィクスチャ、ワークスペース、エージェントディレクトリ、または認証プロファイルストアが必要な場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストで、実行中の Gateway、CLI 環境、ログキャプチャ、クリーンアップを 1 か所で扱う必要がある場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナへ渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数 HOME のスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットには `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を使用でき、source 可能なホスト環境ファイルには `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、エントリポイント解決、モック OpenAI 起動、Gateway のフォアグラウンド/バックグラウンド起動、準備完了プローブ、状態環境変数のエクスポート、ログダンプ、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- フル、拡張、include パターンのシャード実行は、ローカルのタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の設定全体の実行では、それらのタイミングを使って低速シャードと高速シャードのバランスを取ります。include パターンの CI シャードはタイミングキーにシャード名を追加するため、設定全体のタイミングデータを置き換えずに、フィルター済みシャードのタイミングを確認できます。ローカルタイミング成果物を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを残す専用の軽量レーン経由でルーティングされるようになり、ランタイム負荷の高いケースは既存のレーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマッピングされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集は、依存パスが正確な場合に、すべてのシャードを広範に実行するのではなく、ローカルインポートグラフを使ってインポート元テストを実行します。
- `auto-reply` は、返信ハーネスが軽量なトップレベルのステータス/トークン/ヘルパーテストを支配しないよう、3 つの専用設定（`core`、`top-level`、`reply`）にも分割されるようになりました。
- ベース Vitest 設定は、リポジトリ設定全体で共有の非分離ランナーを有効にしたうえで、`pool: "threads"` と `isolate: false` をデフォルトにするようになりました。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての拡張/Plugin シャードを実行します。重いチャネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、その他の Plugin グループはバッチのままです。バンドルされた Plugin レーンを 1 つだけ実行するには、`pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: Vitest のインポート所要時間とインポート内訳レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットには引き続きスコープ済みレーンルーティングを使用します。
- `pnpm test:perf:imports:changed`: 同じインポートプロファイリングですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git 差分について、ルーティングされた変更モードパスをネイティブのルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、現在のワークツリー変更セットを、先にコミットせずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイル（`.artifacts/vitest-main-profile`）を書き出します。
- `pnpm test:perf:profile:runner`: ユニットランナーの CPU + ヒーププロファイル（`.artifacts/vitest-runner-profile`）を書き出します。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべてのフルスイート Vitest リーフ設定を直列に実行し、グループ化された所要時間データと、設定ごとの JSON/ログ成果物を書き出します。Test Performance Agent は、低速テスト修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に、グループ化レポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gateway のエンドツーエンドスモークテスト（複数インスタンスの WS/HTTP/node ペアリング）を実行します。`vitest.e2e.config.ts` では、適応ワーカー付きの `threads` + `isolate: false` がデフォルトです。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: プロバイダーのライブテスト（minimax/zai）を実行します。スキップを解除するには API キーと `LIVE=1`（またはプロバイダー固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有ライブテストイメージをビルドし、OpenClaw を npm tarball として 1 回パックし、素の Node/Git ランナーイメージと、その tarball を `/app` にインストールする機能イメージをビルド/再利用してから、重み付きスケジューラーを通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker スモークレーンを実行します。素のイメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）はインストーラー/更新/Plugin 依存関係レーンに使用されます。これらのレーンは、コピーされたリポジトリソースではなく、事前ビルド済み tarball をマウントします。機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は通常のビルド済みアプリ機能レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` は単一のローカル/CI パッケージパッカーであり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行します。`node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、選択されたレーン、イメージ種別、パッケージ/ライブイメージ要件、状態シナリオ、認証情報チェックについて、スケジューラー所有の CI プランを出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` はプロバイダー依存の tail プールを制御し、デフォルトは 10 です。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。プロバイダー上限は、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、プロバイダーごとに重いレーン 1 つがデフォルトです。より大きいホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列ホストで 1 つのレーンが有効な重みまたはリソース上限を超える場合でも、空のプールから起動でき、容量を解放するまで単独で実行されます。ローカル Docker デーモンの作成集中を避けるため、レーン開始はデフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。ランナーはデフォルトで Docker を事前チェックし、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとにアクティブレーンのステータスを出力し、互換性のあるレーン間でプロバイダー CLI ツールキャッシュを共有し、一時的なライブプロバイダー失敗をデフォルトで 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行で長い順に並べるためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1`、ステータス出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`、タイミング再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`、ライブプロバイダーレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。パッケージエイリアスは `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only モードでは main と tail のライブレーンを 1 つの長い順プールに統合するため、プロバイダーバケットは Claude、Codex、Gemini の作業をまとめて詰め込めます。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、ランナーは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンは、より厳しいレーンごとの上限を使用します。CLI バックエンド Docker セットアップコマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）による独自のタイムアウトがあります。レーンごとのログ、`summary.json`、`failures.json`、フェーズタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。低速レーンを調べるには `pnpm test:docker:timings <summary.json>` を使用し、安価なターゲット指定再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium ベースのソース E2E コンテナをビルドし、生の CDP と分離された Gateway を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットにリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータが含まれることを検証します。
- CLI バックエンドのライブ Docker プローブは、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のような集中的なレーンとして実行できます。Claude と Gemini には対応する `:resume` と `:mcp` エイリアスがあります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` を通じて実際のプロキシ済みチャットを実行します。利用可能なライブモデルキー（たとえば `~/.profile` 内の OpenAI）が必要で、外部 Open WebUI イメージを pull し、通常のユニット/e2e スイートのような CI 安定性は期待されていません。
- `pnpm test:docker:mcp-channels`: シード済みの Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの挙動、送信ルーティング、実際の stdio ブリッジ経由の Claude 形式のチャンネル通知と権限通知を検証します。Claude 通知のアサーションは生の stdio MCP フレームを直接読み取るため、このスモークテストはブリッジが実際に出力する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: パックされた OpenClaw tarball を汚れた旧ユーザーフィクスチャの上にインストールし、ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後 loopback Gateway を起動して、エージェント、チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: 既定で `openclaw@latest` をインストールし、ライブプロバイダーやチャンネルキーなしで現実的な既存ユーザーファイルをシードし、そのベースラインを組み込みの `openclaw config set` コマンドレシピで設定し、その公開済みインストールをパックされた OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 loopback Gateway を起動して、設定済みインテント、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係状態、起動、`/healthz`、`/readyz`、RPC ステータスが維持されるか正常に修復されることを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で 1 つのベースラインを上書きし、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような正確なローカルマトリクスを展開するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加します。reported-issues セットには、設定済みの外部 OpenClaw plugins がアップグレード中に自動インストールされることを検証する `configured-plugin-installs` と、ソース専用 Plugin シャドウが起動を壊さないようにする `stale-source-plugin-shadow` が含まれます。パッケージ受け入れは、それらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、正確なパッケージ仕様を Docker レーンに渡す前に、`last-stable-4` や `all-since-2026.4.23` などのメタベースライントークンを解決します。
- `pnpm test:docker:update-migration`: クリーンアップが多い `plugin-deps-cleanup` シナリオで公開済みアップグレードサバイバーハーネスを実行し、既定では `openclaw@2026.4.23` から開始します。別個の `Update Migration` ワークフローはこのレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定版公開パッケージが候補版へ更新され、Full Release CI の外で設定済み Plugin 依存関係のクリーンアップを証明します。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリパッケージ、git 移動参照、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査について、インストール/更新スモークを実行します。

## ローカル PR ゲート

ローカルでの PR 取り込み/ゲートチェックには、次を実行します:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定に失敗する場合は、回帰として扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリに制約のあるホストでは、次を使用します:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「単語 1 つで返信してください: ok。句読点や余分なテキストは不要です。」

最終実行（2025-12-31、20 回実行）:

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナル分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込むため、タイミングとプロファイル取得に同じハーネスを使用します。

保存済み出力の規約:

- `pnpm test:startup:bench:smoke` は、対象を絞ったスモークアーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用してフルスイートアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャ `test/fixtures/cli-startup-bench.json` を更新します

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

このスクリプトは疑似 tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証してから Gateway を起動し、`openclaw health` を実行します。

## QR インポートスモーク（Docker）

メンテナンスされている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 がデフォルト、Node 22 が互換）で読み込まれることを確認します:

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と plugins のテスト](/ja-JP/help/testing-updates-plugins)
