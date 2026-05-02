---
read_when:
    - テストの実行または修正
summary: テストをローカルで実行する方法 (vitest) と、force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-02T21:05:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a88599d079e1ca42d73d354b582d67dd85be40fc92eed5abe6dcef37dc21f4f
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- 更新と Plugin パッケージ検証: [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存 Gateway プロセスを終了し、分離された Gateway ポートで完全な Vitest スイートを実行して、サーバーテストが実行中のインスタンスと衝突しないようにします。以前の Gateway 実行によってポート 18789 が占有されたままになっている場合に使用します。
- `pnpm test:coverage`: V8 カバレッジ付きでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これは読み込まれたファイルのユニットカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` が false であるため、このゲートはすべての分割レーンのソースファイルを未カバーとして扱うのではなく、ユニットカバレッジスイートによって読み込まれたファイルを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストのスマート変更テスト実行です。直接のテスト編集、隣接する `*.test.ts` ファイル、明示的なソースマッピング、ローカルのインポートグラフから精密なターゲットを実行します。広範な/config/package 変更は、精密なテストに対応付けられない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲の変更テスト実行です。テストハーネス/config/package の編集で、Vitest のより広い変更テスト動作へフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` に対する差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` に対する差分について、スマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テストの証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンにルーティングします。ターゲットなしの実行では固定シャードグループを使用し、ローカル並列実行のためにリーフ config へ展開します。extension グループは、巨大な単一 root-project プロセスではなく、常に extension ごとのシャード config に展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 自身の所要時間行はシャードごとの詳細のままです。
- 共有 OpenClaw テスト状態: テストで分離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir、または auth-profile store が必要な場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストで、実行中の Gateway、CLI env、ログキャプチャ、クリーンアップを一か所で扱う必要がある場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナへ渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。multi-home スクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。より低レベルの呼び出し元は、コンテナ内シェルスニペット用に `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を使用するか、source 可能なホスト env ファイル用に `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、entrypoint 解決、mock OpenAI 起動、Gateway フォアグラウンド/バックグラウンド起動、readiness probe、状態 env export、ログダンプ、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- 完全、extension、include-pattern のシャード実行は、ローカルタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の whole-config 実行では、それらのタイミングを使用して低速シャードと高速シャードのバランスを取ります。include-pattern CI シャードはタイミングキーにシャード名を追加するため、whole-config タイミングデータを置き換えずに、フィルターされたシャードのタイミングを可視化できます。ローカルタイミング artifact を無視するには、`OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを通るようになり、ランタイムが重いケースは既存のレーンに残ります。
- 隣接テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その隣接テストへマッピングされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集では、dependency path が精密な場合、すべてのシャードを広範囲に実行するのではなく、ローカルのインポートグラフを使用してインポート元のテストを実行します。
- `auto-reply` は 3 つの専用 config（`core`、`top-level`、`reply`）にも分割され、reply ハーネスがより軽量な top-level status/token/helper テストを支配しないようになりました。
- ベース Vitest config は `pool: "threads"` と `isolate: false` をデフォルトにし、共有の非分離 runner がリポジトリ全体の config で有効になりました。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/Plugin シャードを実行します。重い channel Plugin、browser Plugin、OpenAI は専用シャードとして実行されます。その他の Plugin グループはバッチ化されたままです。バンドルされた単一 Plugin レーンには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: Vitest の import-duration + import-breakdown レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットにはスコープ付きレーンルーティングを引き続き使用します。
- `pnpm test:perf:imports:changed`: 同じ import プロファイリングを実行しますが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff について、ルーティングされた changed-mode パスをネイティブ root-project 実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在の worktree の変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイル（`.artifacts/vitest-main-profile`）を書き込みます。
- `pnpm test:perf:profile:runner`: ユニット runner の CPU + heap プロファイル（`.artifacts/vitest-runner-profile`）を書き込みます。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest リーフ config を直列に実行し、グループ化された所要時間データに加えて config ごとの JSON/log artifact を書き込みます。Test Performance Agent は、低速テスト修正を試みる前の baseline としてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後にグループ化レポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in します。
- `pnpm test:e2e`: Gateway の end-to-end smoke テスト（multi-instance WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` では adaptive workers とともに `threads` + `isolate: false` がデフォルトです。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: provider live テスト（minimax/zai）を実行します。スキップ解除には API キーと `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test イメージをビルドし、OpenClaw を npm tarball として一度 pack し、bare Node/Git runner イメージと、その tarball を `/app` にインストールする functional イメージをビルド/再利用した後、重み付き scheduler を通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker smoke レーンを実行します。bare イメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は installer/update/plugin-dependency レーンで使用されます。これらのレーンは、コピーされたリポジトリソースを使う代わりに、事前ビルド済み tarball をマウントします。functional イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は、通常の built-app 機能レーンで使用されます。`scripts/package-openclaw-for-docker.mjs` は単一の local/CI package packer であり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択された plan を実行します。`node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、選択されたレーン、イメージ種別、package/live-image の必要性、状態シナリオ、認証情報チェックについて、scheduler 所有の CI plan を出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider-sensitive tail pool を制御し、デフォルトは 10 です。重いレーンの上限は、デフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider の上限は、`OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、デフォルトで provider ごとに重いレーン 1 つです。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列ホストで 1 つのレーンが有効な重みまたはリソース上限を超える場合でも、空の pool から開始でき、そのレーンは capacity を解放するまで単独で実行されます。ローカル Docker daemon の create storm を避けるため、レーン開始はデフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きします。runner はデフォルトで Docker を preflight し、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとに active-lane status を出力し、互換性のあるレーン間で provider CLI tool cache を共有し、一時的な live-provider failure をデフォルトで 1 回再試行し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行で longest-first ordering に使うためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーン manifest を出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、status 出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を使用し、タイミング再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/local レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を使用し、live-provider レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。package alias は `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only mode は main と tail の live レーンを 1 つの longest-first pool に統合するため、provider bucket は Claude、Codex、Gemini の作業をまとめて詰められます。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、runner は最初の failure 後に新しい pooled lane のスケジュールを停止します。また各レーンには 120 分の fallback timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンでは、より厳しいレーンごとの上限が使用されます。CLI backend Docker setup コマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）による専用 timeout があります。レーンごとのログ、`summary.json`、`failures.json`、phase timing は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。低速レーンを調べるには `pnpm test:docker:timings <summary.json>` を使用し、低コストなターゲット再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium を使う source E2E コンテナをビルドし、生の CDP と分離された Gateway を開始し、`browser doctor --deep` を実行し、CDP role snapshot に link URL、cursor-promoted clickable、iframe ref、frame metadata が含まれることを検証します。
- CLI backend live Docker probe は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように、focused lane として実行できます。Claude と Gemini には対応する `:resume` と `:mcp` alias があります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` をチェックしてから、`/api/chat/completions` を通じて実際の proxied chat を実行します。使用可能な live model key（たとえば `~/.profile` 内の OpenAI）が必要で、外部の Open WebUI イメージを pull し、通常の unit/e2e スイートのような CI 安定性は期待されていません。
- `pnpm test:docker:mcp-channels`: seed 済み Gateway コンテナと、`openclaw mcp serve` を spawn する 2 つ目の client コンテナを起動し、ルーティングされた会話検出、transcript 読み取り、attachment metadata、live event queue 動作、outbound send routing、実際の stdio bridge 越しの Claude-style channel + permission notifications を検証します。Claude notification assertion は、生の stdio MCP frame を直接読み取るため、smoke は bridge が実際に出力するものを反映します。
- `pnpm test:docker:upgrade-survivor`: パックされた OpenClaw tarball を変更済みの旧ユーザーフィクスチャ上にインストールし、live プロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行してから、ループバック Gateway を起動し、エージェント、チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: デフォルトで `openclaw@latest` をインストールし、live プロバイダーやチャンネルキーなしで現実的な既存ユーザーファイルをシードし、組み込みの `openclaw config set` コマンドレシピでそのベースラインを設定し、その公開済みインストールをパックされた OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、ループバック Gateway を起動し、設定済み intent、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係状態、起動、`/healthz`、`/readyz`、RPC ステータスが維持されるか、クリーンに修復されることを確認します。1つのベースラインは `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、`all-since-2026.4.23` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で厳密なマトリクスを展開し、または `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加します。reported-issues セットには、設定済みの外部 OpenClaw plugins がアップグレード中に自動的にインストールされることを検証する `configured-plugin-installs` が含まれます。Package Acceptance では、これらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開します。
- `pnpm test:docker:update-migration`: クリーンアップ負荷の高い `plugin-deps-cleanup` シナリオで公開済みアップグレード survivor ハーネスを実行し、デフォルトでは `openclaw@2026.4.23` から開始します。別個の `Update Migration` ワークフローは、このレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定版公開済みパッケージが候補版へ更新され、Full Release CI の外で設定済み Plugin 依存関係のクリーンアップを証明します。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、ホイストされた依存関係を持つ npm レジストリパッケージ、git の移動参照、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査について、インストール/更新 smoke を実行します。

## ローカル PR ゲート

ローカルの PR land/gate チェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が一時的に失敗する場合は、リグレッションとして扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

最終実行（2025-12-31、20 runs）:

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

出力には、各コマンドの `sampleCount`、avg、p50、p95、min/max、exit-code/signal 分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込むため、タイミング計測とプロファイル取得で同じハーネスを使用します。

保存される出力の慣例:

- `pnpm test:startup:bench:smoke` は対象を絞った smoke アーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は `runs=5` と `warmup=1` を使用して、フルスイートのアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は `runs=5` と `warmup=1` を使用して、チェックイン済みのベースライン fixture を `test/fixtures/cli-startup-bench.json` に更新します

チェックイン済み fixture:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新
- `pnpm test:startup:bench:check` で現在の結果を fixture と比較

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディング smoke テストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは pseudo-tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証してから、Gateway を起動して `openclaw health` を実行します。

## QR import smoke（Docker）

メンテナンスされている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 がデフォルト、Node 22 が互換）でロードされることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と plugins のテスト](/ja-JP/help/testing-updates-plugins)
