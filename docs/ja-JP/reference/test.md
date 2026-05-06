---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-06T05:18:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4a87abe86ab28f14b1ea96846ee221eb504fb1bc9e6c17b4b2f348867cde855d
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- アップデートと Plugin パッケージの検証: [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存 Gateway プロセスを終了し、隔離された Gateway ポートで完全な Vitest スイートを実行するため、サーバーテストが実行中のインスタンスと衝突しません。以前の Gateway 実行でポート 18789 が使用中のままになった場合に使用してください。
- `pnpm test:coverage`: V8 カバレッジ付きでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これはデフォルトのユニットレーンのカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行数/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` は false で、デフォルトレーンのカバレッジ対象は兄弟ソースファイルを持つ非 fast ユニットテストに限定されるため、このゲートは、たまたま読み込んだすべての推移的 import ではなく、このレーンが所有するソースを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみのユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストなスマート変更テスト実行です。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフから精密なターゲットを実行します。広範な設定/パッケージ変更は、精密なテストにマッピングされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲変更テスト実行です。テストハーネス/設定/パッケージの編集で、Vitest のより広い変更テスト動作へフォールバックすべき場合に使用してください。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` との差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用してください。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンにルーティングします。ターゲットなしの実行は固定 shard グループを使用し、ローカル並列実行のために leaf config へ展開します。extension グループは、巨大な単一 root-project プロセスではなく、常に extension ごとの shard config に展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 自体の所要時間行は shard ごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストが隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定 fixture、workspace、agent dir、auth-profile store を必要とする場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用してください。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストが、実行中の Gateway、CLI env、ログ取得、クリーンアップを一か所で必要とする場合は、`test/helpers/openclaw-test-instance.ts` を使用してください。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、コンテナへ `docker_e2e_test_state_shell_b64 <label> <scenario>` を渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数 home のスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットとして `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を使用するか、source 可能なホスト env ファイルとして `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにします。Gateway を起動する Docker/Bash レーンは、entrypoint 解決、モック OpenAI 起動、Gateway の foreground/background 起動、readiness probe、状態 env export、ログ dump、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- 完全、extension、include-pattern の shard 実行は、ローカルタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。以降の whole-config 実行は、そのタイミングを使って遅い shard と速い shard のバランスを取ります。include-pattern CI shard は shard 名をタイミングキーに追加するため、whole-config タイミングデータを置き換えずに、フィルタされた shard タイミングを可視化したままにします。ローカルタイミング成果物を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定してください。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを通るようになり、ランタイムが重いケースは既存のレーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマッピングされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集は、依存パスが精密な場合、すべての shard を広範囲実行するのではなく、ローカル import グラフを使って import 元のテストを実行します。
- `auto-reply` は 3 つの専用 config（`core`、`top-level`、`reply`）にも分割されるようになり、reply ハーネスが軽量な top-level status/token/helper テストを支配しないようになりました。
- ベース Vitest config は現在、デフォルトで `pool: "threads"` と `isolate: false` になっており、共有の非隔離 runner がリポジトリ全体の config で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての extension/plugin shard を実行します。重い channel plugins、browser plugin、OpenAI は専用 shard として実行され、その他の plugin グループは batched のままです。1 つの bundled plugin レーンには `pnpm test extensions/<id>` を使用してください。
- `pnpm test:perf:imports`: Vitest の import-duration と import-breakdown レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットにはスコープ付きレーンルーティングを引き続き使用します。
- `pnpm test:perf:imports:changed`: 同じ import profiling ですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff に対して、ルーティングされた changed-mode パスをネイティブ root-project 実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、現在の worktree の変更セットを、先に commit せずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest main thread の CPU profile を書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner の CPU + heap profile を書き込みます（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest leaf config を直列に実行し、グループ化された所要時間データと config ごとの JSON/log 成果物を書き込みます。Test Performance Agent は、遅いテストの修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後にグループ化されたレポートを比較します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in します。
- `pnpm test:e2e`: Gateway の end-to-end smoke tests（multi-instance WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` ではデフォルトで `threads` + `isolate: false` と adaptive workers を使用します。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定してください。
- `pnpm test:live`: provider live tests（minimax/zai）を実行します。スキップを解除するには API keys と `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test image をビルドし、OpenClaw を npm tarball として一度 pack し、bare Node/Git runner image と、その tarball を `/app` にインストールする functional image をビルド/再利用したうえで、weighted scheduler を通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` 付きで Docker smoke レーンを実行します。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は installer/update/plugin-dependency レーンに使用されます。これらのレーンはコピーされたリポジトリソースではなく、事前ビルド済み tarball を mount します。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は通常の built-app functionality レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` は単一の local/CI package packer であり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択された plan を実行します。`node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、選択されたレーン、image kinds、package/live-image needs、state scenarios、credential checks に対する scheduler 所有の CI plan を出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセス slots を制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider に敏感な tail pool を制御し、デフォルトは 10 です。重いレーンの cap はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider cap は `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、provider ごとに重いレーン 1 つをデフォルトにします。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用してください。低並列度ホストで 1 つのレーンが実効 weight または resource cap を超える場合でも、空の pool から開始でき、capacity を解放するまで単独で実行されます。レーン開始は、ローカル Docker daemon の create storm を避けるため、デフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きしてください。runner はデフォルトで Docker を preflight し、古い OpenClaw E2E containers をクリーンアップし、30 秒ごとに active-lane status を出力し、互換レーン間で provider CLI tool caches を共有し、transient live-provider failures をデフォルトで 1 回 retry し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、後続実行の longest-first ordering のためにレーンタイミングを `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずに lane manifest を表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1`、status output を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`、タイミング再利用を無効化するには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用してください。deterministic/local レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`、live-provider レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用してください。package alias は `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only mode は main と tail の live レーンを 1 つの longest-first pool に統合するため、provider bucket が Claude、Codex、Gemini の作業をまとめて配置できます。runner は、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の failure 後に新しい pooled レーンの scheduling を停止します。各レーンには 120 分の fallback timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンは、より厳しいレーン別 cap を使用します。CLI backend Docker setup commands には `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）による独自の timeout があります。レーン別ログ、`summary.json`、`failures.json`、phase timings は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調べるには `pnpm test:docker:timings <summary.json>` を、低コストな targeted rerun commands を表示するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用してください。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium-backed source E2E container をビルドし、生の CDP と隔離された Gateway を起動し、`browser doctor --deep` を実行して、CDP role snapshots に link URLs、cursor-promoted clickables、iframe refs、frame metadata が含まれることを検証します。
- CLI backend live Docker probes は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように focused lanes として実行できます。Claude と Gemini には対応する `:resume` と `:mcp` aliases があります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由で sign in し、`/api/models` を確認した後、`/api/chat/completions` 経由で実際の proxied chat を実行します。使用可能な live model key（例: `~/.profile` 内の OpenAI）が必要で、外部 Open WebUI image を pull します。通常の unit/e2e suites のような CI 安定性は期待されません。
- `pnpm test:docker:mcp-channels`: シード済みの Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、ルーティングされた会話の検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの挙動、アウトバウンド送信ルーティング、実際の stdio ブリッジ越しの Claude 形式のチャネル + 権限通知を検証します。Claude 通知のアサーションは生の stdio MCP フレームを直接読み取るため、smoke はブリッジが実際に送出する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: 汚れた旧ユーザーフィクスチャの上にパック済み OpenClaw tarball をインストールし、ライブプロバイダーやチャネルキーなしでパッケージ更新と非対話型 doctor を実行してから、loopback Gateway を起動し、エージェント、チャネル設定、Plugin allowlist、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: 既定では `openclaw@latest` をインストールし、ライブプロバイダーやチャネルキーなしで現実的な既存ユーザーファイルをシードし、焼き込み済みの `openclaw config set` コマンドレシピでそのベースラインを構成し、その公開済みインストールをパック済み OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、loopback Gateway を起動し、構成済みインテント、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係状態、起動、`/healthz`、`/readyz`、RPC ステータスが維持されるか、きれいに修復されることを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で 1 つのベースラインを上書きするか、`openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で正確なローカルマトリクスを展開するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加します。reported-issues セットには、アップグレード中に構成済みの外部 OpenClaw plugins が自動的にインストールされることを検証する `configured-plugin-installs` と、ソース専用の Plugin shadow が起動を壊さないようにする `stale-source-plugin-shadow` が含まれます。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決してから、正確なパッケージ指定を Docker レーンに渡します。
- `pnpm test:docker:update-migration`: cleanup が多い `plugin-deps-cleanup` シナリオで公開済みアップグレード survivor ハーネスを実行し、既定では `openclaw@2026.4.23` から開始します。別個の `Update Migration` ワークフローはこのレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定版公開パッケージを候補版へ更新して、Full Release CI の外で構成済み Plugin 依存関係の cleanup を証明します。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、hoist された依存関係を持つ npm レジストリパッケージ、git moving refs、ClawHub フィクスチャ、marketplace 更新、Claude バンドルの有効化/検査について、インストール/更新 smoke を実行します。

## ローカル PR ゲート

ローカル PR の land/gate チェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定になる場合は、回帰として扱う前に一度だけ再実行し、その後 `pnpm test <path/to/test>` で分離します。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の環境変数: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

直近の実行（2025-12-31、20回実行）:

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナルの分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は、タイミングとプロファイル取得が同じハーネスを使用するように、実行ごとに V8 プロファイルを書き込みます。

保存出力の規約:

- `pnpm test:startup:bench:smoke` は、対象スモークアーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用して、フルスイートアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新します
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較します

## オンボーディング E2E（Docker）

Docker は任意です。これは、コンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは疑似 tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証してから、Gateway を起動し `openclaw health` を実行します。

## QR インポートスモーク（Docker）

メンテナンスされている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 がデフォルト、Node 22 互換）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [アップデートと plugins のテスト](/ja-JP/help/testing-updates-plugins)
