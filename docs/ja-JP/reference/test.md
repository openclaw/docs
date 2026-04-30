---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と、force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-04-30T05:34:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9328d6f0383b5067fa8bb5d0f1bf22a3b9048a267908bf85167842ddc3d12e42
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)

- `pnpm test:force`: 既定の制御ポートを保持している残存 Gateway プロセスを強制終了し、分離された Gateway ポートで完全な Vitest スイートを実行して、サーバーテストが実行中のインスタンスと衝突しないようにします。以前の Gateway 実行でポート 18789 が使用中のままになった場合に使用します。
- `pnpm test:coverage`: V8 カバレッジ付きでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これは読み込まれたファイルのユニットカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` が false のため、このゲートはすべての分割レーンのソースファイルを未カバーとして扱うのではなく、ユニットカバレッジスイートで読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルだけに対してユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストのスマート変更テスト実行です。直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフから精密なターゲットを実行します。広範な設定/パッケージ変更は、精密なテストにマップされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範変更テスト実行です。テストハーネス/設定/パッケージ編集で Vitest のより広範な変更テスト動作にフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャ上のレーンを表示します。
- `pnpm check:changed`: `origin/main` との差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャ上のレーンに対して typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テストの証跡には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーン経由でルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行用にリーフ設定へ展開します。extension グループは、巨大なルートプロジェクトプロセス 1 つではなく、常に extension ごとのシャード設定へ展開します。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 自身の所要時間行は、シャードごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストが分離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定フィクスチャ、ワークスペース、エージェントディレクトリ、または auth-profile ストアを必要とする場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストが、実行中の Gateway、CLI env、ログ取得、クリーンアップを 1 か所で必要とする場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数 home のスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットには `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を、source 可能なホスト env ファイルには `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、エントリポイント解決、モック OpenAI 起動、Gateway のフォアグラウンド/バックグラウンド起動、準備完了プローブ、状態 env export、ログダンプ、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- 完全、extension、include-pattern のシャード実行は、`.artifacts/vitest-shard-timings.json` のローカルタイミングデータを更新します。以降の設定全体実行では、それらのタイミングを使って遅いシャードと速いシャードのバランスを取ります。include-pattern CI シャードはタイミングキーにシャード名を追加するため、設定全体のタイミングデータを置き換えずに、フィルター済みシャードのタイミングを可視化できます。ローカルタイミングアーティファクトを無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` および `commands` テストファイルは、現在は `test/setup.ts` だけを保持する専用の軽量レーンを経由し、ランタイム負荷の高いケースは既存レーンに残します。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマップされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集は、依存パスが精密な場合に、全シャードを広範実行する代わりに、ローカル import グラフを使って import 元のテストを実行します。
- `auto-reply` は、返信ハーネスが軽量なトップレベルのステータス/トークン/ヘルパーテストを支配しないよう、3 つの専用設定（`core`、`top-level`、`reply`）にも分割されるようになりました。
- ベース Vitest 設定は現在、既定で `pool: "threads"` と `isolate: false` になり、共有の非分離ランナーがリポジトリ全体の設定で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/Plugin シャードを実行します。重いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行されます。その他の Plugin グループはバッチ化されたままです。バンドルされた Plugin レーンを 1 つ実行するには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: 明示的なファイル/ディレクトリターゲットに対してスコープ付きレーンルーティングを引き続き使用しながら、Vitest の import 所要時間および import 内訳レポートを有効にします。
- `pnpm test:perf:imports:changed`: 同じ import プロファイリングを、`origin/main` 以降に変更されたファイルに対してのみ実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff に対して、ルーティングされた変更モードのパスをネイティブのルートプロジェクト実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリーの変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイルを書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: ユニットランナーの CPU およびヒーププロファイルを書き込みます（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべてのフルスイート Vitest リーフ設定を直列実行し、グループ化された所要時間データと設定ごとの JSON/ログアーティファクトを書き込みます。Test Performance Agent は、低速テスト修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に、グループ化されたレポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` でオプトインします。
- `pnpm test:e2e`: Gateway の end-to-end スモークテスト（複数インスタンスの WS/HTTP/node ペアリング）を実行します。既定では `vitest.e2e.config.ts` で `threads` + `isolate: false` と適応ワーカーを使用します。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: provider live テスト（minimax/zai）を実行します。スキップを解除するには API キーと `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test イメージをビルドし、OpenClaw を npm tarball として一度だけ pack し、ベア Node/Git ランナーイメージと、その tarball を `/app` にインストールする functional イメージをビルド/再利用してから、重み付きスケジューラーを通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker スモークレーンを実行します。ベアイメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は installer/update/plugin-dependency レーンに使用されます。これらのレーンはコピーされたリポジトリソースを使う代わりに、事前ビルド済み tarball をマウントします。functional イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は通常のビルド済みアプリ機能レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` は単一のローカル/CI パッケージ packer であり、Docker がそれを消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択された計画を実行します。`node scripts/test-docker-all.mjs --plan-json` は、ビルドや Docker 実行なしで、選択されたレーン、イメージ種別、package/live-image の必要性、状態シナリオ、認証情報チェックに関する、スケジューラー所有の CI 計画を出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、既定は 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider に敏感な tail pool を制御し、既定は 10 です。重いレーンの上限は既定で `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider の上限は、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、既定で provider ごとに重いレーン 1 つです。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列ホストで 1 つのレーンが実効的な重みまたはリソース上限を超える場合でも、空の pool から開始でき、そのレーンがキャパシティを解放するまで単独で実行されます。ローカル Docker daemon の create ストームを避けるため、レーン開始は既定で 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。ランナーは既定で Docker を preflight し、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとにアクティブレーンステータスを出力し、互換性のあるレーン間で provider CLI ツールキャッシュを共有し、一時的な live-provider 失敗を既定で 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、以降の実行で最長優先の順序付けに使うためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーンマニフェストを出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を、ステータス出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を、タイミング再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を、live-provider レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。パッケージエイリアスは `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only モードは、main と tail の live レーンを 1 つの最長優先 pool にマージするため、provider バケットは Claude、Codex、Gemini の作業をまとめて詰め込めます。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、ランナーは最初の失敗後に新しい pooled レーンのスケジューリングを停止します。各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンは、より厳しいレーンごとの上限を使用します。CLI backend Docker セットアップコマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（既定 180）による独自のタイムアウトがあります。レーンごとのログ、`summary.json`、`failures.json`、フェーズタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。低速レーンの確認には `pnpm test:docker:timings <summary.json>` を、低コストのターゲット指定再実行コマンドの出力には `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium ベースのソース E2E コンテナをビルドし、生の CDP と分離された Gateway を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットにリンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータが含まれることを検証します。
- CLI backend live Docker probe は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、または `pnpm test:docker:live-cli-backend:codex:mcp` のように、焦点を絞ったレーンとして実行できます。Claude と Gemini には対応する `:resume` および `:mcp` エイリアスがあります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際のプロキシ済みチャットを実行します。使用可能な live model キー（たとえば `~/.profile` 内の OpenAI）が必要で、外部の Open WebUI イメージを pull します。通常の unit/e2e スイートのように CI で安定することは期待されていません。
- `pnpm test:docker:mcp-channels`: seed 済み Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、実際の stdio ブリッジ越しに、ルーティングされた会話検出、transcript 読み取り、attachment メタデータ、live event queue の動作、outbound send ルーティング、Claude スタイルの channel + permission 通知を検証します。Claude 通知のアサーションは、生の stdio MCP フレームを直接読み取るため、スモークはブリッジが実際に出力する内容を反映します。

## ローカル PR ゲート

ローカルでのPRランド/ゲートチェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定に失敗する場合は、回帰として扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の環境変数: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトのプロンプト: 「1語だけで返信してください: ok。句読点や余分なテキストは入れないでください。」

前回の実行（2025-12-31、20回実行）:

- minimax 中央値 1279ms（最小 1114、最大 2431）
- opus 中央値 2454ms（最小 1224、最大 3170）

## CLI起動ベンチ

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナル分布、最大RSSの要約が含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとにV8プロファイルを書き出すため、タイミング測定とプロファイル取得に同じハーネスを使用できます。

保存される出力の規約:

- `pnpm test:startup:bench:smoke` は対象スモークアーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は `runs=5` と `warmup=1` を使用して、フルスイートアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は `runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新します
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較します

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディングスモークテストでのみ必要です。

クリーンなLinuxコンテナでのフルコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、疑似tty経由で対話型ウィザードを操作し、config/workspace/sessionファイルを検証してから、Gateway を起動し `openclaw health` を実行します。

## QRインポートスモーク（Docker）

メンテナンスされているQRランタイムヘルパーが、サポート対象のDocker Nodeランタイム（Node 24がデフォルト、Node 22互換）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
