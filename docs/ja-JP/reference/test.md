---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と、force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-01T05:03:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d50f77fdb8dcf7153c59d1bd9f3d61d745ba17ea846eb0610d0f064ad0d1761
    source_path: reference/test.md
    workflow: 16
---

- 包括的なテストキット (スイート、ライブ、Docker): [テスト](/ja-JP/help/testing)

- `pnpm test:force`: 既定の制御ポートを保持している残留 Gateway プロセスを強制終了し、隔離された Gateway ポートで Vitest スイート全体を実行するため、サーバーテストが実行中のインスタンスと衝突しません。以前の Gateway 実行によってポート 18789 が使用中のまま残った場合に使用します。
- `pnpm test:coverage`: V8 カバレッジ付きでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これは読み込まれたファイルのユニットカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` が false のため、このゲートはすべての分割レーンのソースファイルを未カバーとして扱うのではなく、ユニットカバレッジスイートによって読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストのスマート変更テスト実行です。直接編集されたテスト、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカルインポートグラフから精密なターゲットを実行します。広範な設定/パッケージ変更は、精密なテストに対応付けられない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲の変更テスト実行です。テストハーネス/設定/パッケージの編集を Vitest のより広い変更テスト動作にフォールバックさせる必要がある場合に使用します。
- `pnpm changed:lanes`: `origin/main` に対する差分でトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` に対する差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの型チェック、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証跡には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンにルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行のためにリーフ設定へ展開します。拡張グループは、巨大なルートプロジェクトプロセス 1 つではなく、常に拡張ごとのシャード設定に展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 独自の所要時間行はシャードごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストに隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定フィクスチャ、ワークスペース、エージェントディレクトリ、または認証プロファイルストアが必要な場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストで、実行中の Gateway、CLI 環境、ログ取得、クリーンアップを 1 か所で必要とする場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数ホームのスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。より低レベルの呼び出し元は、コンテナ内シェルスニペットには `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を、source 可能なホスト env ファイルには `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source することで、エントリポイント解決、モック OpenAI 起動、Gateway のフォアグラウンド/バックグラウンド起動、準備状況プローブ、状態 env エクスポート、ログダンプ、プロセスクリーンアップを利用できます。
- フル、拡張、include パターンのシャード実行は、ローカルのタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の全設定実行では、それらのタイミングを使用して遅いシャードと速いシャードのバランスを取ります。include パターンの CI シャードはタイミングキーにシャード名を追加するため、全設定のタイミングデータを置き換えずにフィルター済みシャードのタイミングを表示できます。ローカルタイミング成果物を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを通るようになり、ランタイム負荷の高いケースは既存のレーンに残ります。
- 隣接テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その隣接テストに対応付けられます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集は、依存パスが精密な場合、すべてのシャードを広範囲実行するのではなく、ローカルインポートグラフを使ってインポート元テストを実行します。
- `auto-reply` は、専用の 3 つの設定（`core`、`top-level`、`reply`）にも分割されるようになり、返信ハーネスがより軽量なトップレベルのステータス/トークン/ヘルパーテストを支配しないようになりました。
- ベース Vitest 設定は、リポジトリ設定全体で共有の非隔離ランナーを有効にしたうえで、既定で `pool: "threads"` と `isolate: false` になりました。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての拡張/Plugin シャードを実行します。重いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、他の Plugin グループはバッチ処理のままです。バンドル済み Plugin レーンを 1 つ実行するには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: 明示的なファイル/ディレクトリターゲットにはスコープ付きレーンルーティングを使い続けながら、Vitest のインポート所要時間とインポート内訳のレポートを有効にします。
- `pnpm test:perf:imports:changed`: 同じインポートプロファイリングですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git 差分について、ルーティングされた変更モードのパスをネイティブのルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリー変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイルを書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: ユニットランナーの CPU + ヒーププロファイルを書き込みます（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべてのフルスイート Vitest リーフ設定を直列に実行し、グループ化された所要時間データに加えて、設定ごとの JSON/ログ成果物を書き込みます。Test Performance Agent は、遅いテストの修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に、グループ化されたレポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gateway のエンドツーエンドスモークテスト（複数インスタンスの WS/HTTP/Node ペアリング）を実行します。既定では `vitest.e2e.config.ts` で `threads` + `isolate: false` と適応的ワーカーを使用します。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: プロバイダーのライブテスト（minimax/zai）を実行します。スキップを解除するには API キーと `LIVE=1`（またはプロバイダー固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有ライブテストイメージをビルドし、OpenClaw を npm tarball として一度だけパックし、素の Node/Git ランナーイメージと、その tarball を `/app` にインストールする機能イメージをビルド/再利用してから、重み付きスケジューラを通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker スモークレーンを実行します。素のイメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）はインストーラー/更新/Plugin 依存関係レーンに使用されます。これらのレーンは、コピーされたリポジトリソースではなく、事前ビルド済み tarball をマウントします。機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は、通常のビルド済みアプリ機能レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` はローカル/CI 共通の唯一のパッケージパッカーであり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択されたプランを実行します。`node scripts/test-docker-all.mjs --plan-json` は、ビルドや Docker 実行を行わずに、選択されたレーン、イメージ種別、パッケージ/ライブイメージの必要性、状態シナリオ、認証情報チェックについて、スケジューラ所有の CI プランを出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、既定値は 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` はプロバイダーに敏感なテールプールを制御し、既定値は 10 です。重いレーンの上限は既定で `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。プロバイダー上限は、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、既定でプロバイダーごとに重いレーン 1 つです。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。並列度の低いホストで 1 つのレーンが実効重みまたはリソース上限を超える場合でも、空のプールから開始でき、容量を解放するまで単独で実行されます。ローカル Docker デーモンの作成集中を避けるため、レーン開始は既定で 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きします。ランナーは既定で Docker を事前チェックし、古い OpenClaw E2E コンテナを削除し、30 秒ごとにアクティブレーンのステータスを出力し、互換性のあるレーン間でプロバイダー CLI ツールキャッシュを共有し、一時的なライブプロバイダー失敗を既定で 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行での最長優先順序付けのためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を、ステータス出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を、タイミング再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を、ライブプロバイダーレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。パッケージエイリアスは `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。ライブのみモードでは、メインとテールのライブレーンを 1 つの最長優先プールに統合するため、プロバイダーバケットは Claude、Codex、Gemini の作業をまとめて詰め込めます。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、ランナーは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択されたライブ/テールレーンでは、より厳しいレーンごとの上限が使用されます。CLI バックエンドの Docker セットアップコマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（既定値 180）による独自のタイムアウトがあります。レーンごとのログ、`summary.json`、`failures.json`、フェーズタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調べるには `pnpm test:docker:timings <summary.json>` を、低コストのターゲット付き再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium ベースのソース E2E コンテナをビルドし、生の CDP と隔離された Gateway を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットにリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータが含まれることを検証します。
- CLI バックエンドのライブ Docker プローブは、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように、焦点を絞ったレーンとして実行できます。Claude と Gemini にも対応する `:resume` と `:mcp` エイリアスがあります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際のプロキシされたチャットを実行します。利用可能なライブモデルキー（たとえば `~/.profile` 内の OpenAI）が必要で、外部の Open WebUI イメージを取得します。また、通常のユニット/e2e スイートのように CI 安定であることは期待されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキュー動作、アウトバウンド送信ルーティング、実際の stdio ブリッジ経由の Claude 形式チャンネル + 権限通知を検証します。Claude 通知のアサーションは生の stdio MCP フレームを直接読み取るため、このスモークはブリッジが実際に出力する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: パック済みの OpenClaw tar アーカイブをダーティな旧ユーザーフィクスチャに上書きインストールし、ライブのプロバイダーキーやチャネルキーなしでパッケージ更新と非対話型 doctor を実行した後、ループバック Gateway を起動し、エージェント、チャネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古い Plugin runtime-deps 状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: デフォルトで `openclaw@latest` をインストールし、ライブのプロバイダーキーやチャネルキーなしで現実的な既存ユーザーファイルをシードし、組み込みの `openclaw config set` コマンドレシピでそのベースラインを設定し、その公開済みインストールをパック済みの OpenClaw tar アーカイブに更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んだ後、ループバック Gateway を起動し、設定済みインテント、ワークスペース/セッションファイル、古い Plugin 設定/runtime-deps 状態、起動、RPC ステータスが維持されるか、正常に修復されることを確認します。ベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きできます。パッケージ受け入れでは、同じ値が `published_upgrade_survivor_baseline` として公開されます。

## ローカル PR ゲート

ローカルの PR land/gate チェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` がフレークした場合は、回帰として扱う前に一度だけ再実行し、その後 `pnpm test <path/to/test>` で分離します。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ (ローカルキー)

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使い方:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の環境変数: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「1語だけで返信してください: ok。句読点や余分なテキストは不要です。」

前回の実行 (2025-12-31、20 回):

- minimax 中央値 1279ms (最小 1114、最大 2431)
- opus 中央値 2454ms (最小 1224、最大 3170)

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナルの分布、最大 RSS の要約が含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込むため、タイミングとプロファイル取得に同じハーネスを使用できます。

保存された出力の規約:

- `pnpm test:startup:bench:smoke` は対象を絞ったスモークアーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は `runs=5` と `warmup=1` を使用してフルスイートアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は `runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` で更新します

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

このスクリプトは疑似 tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証してから、Gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク (Docker)

メンテナンスされている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム (デフォルトの Node 24、互換の Node 22) でロードされることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
