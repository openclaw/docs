---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法 (vitest) と force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-05-10T19:52:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- 更新とPluginパッケージの検証: [更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)

- `pnpm test:force`: デフォルトの制御ポートを保持している残存 Gateway プロセスを終了し、サーバーテストが実行中インスタンスと衝突しないよう、隔離された Gateway ポートで Vitest スイート全体を実行します。以前の Gateway 実行でポート 18789 が使用中のままになった場合に使用します。
- `pnpm test:coverage`: `vitest.unit.config.ts` 経由で V8 カバレッジ付きのユニットスイートを実行します。これはデフォルトユニットレーンのカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/ステートメントが 70%、分岐が 55% です。`coverage.all` が false であり、デフォルトレーンのカバレッジ対象が兄弟ソースファイルを持つ非高速ユニットテストに絞られるため、このゲートは偶然ロードしたすべての推移的 import ではなく、このレーンが所有するソースを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルのみを対象にユニットカバレッジを実行します。
- `pnpm test:changed`: 低コストのスマート変更テスト実行です。直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフから精密なターゲットを実行します。広範な/config/package 変更は、精密なテストにマップされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲変更テスト実行です。テストハーネス/config/package の編集で Vitest のより広い変更テスト動作へフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` との差分によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: `origin/main` との差分に対してスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープ付き Vitest レーンへルーティングします。ターゲットなしの実行では固定シャードグループを使い、ローカル並列実行のためにリーフ config へ展開します。拡張グループは常に、巨大な単一 root-project プロセスではなく、拡張ごとのシャード config へ展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 自身の所要時間行はシャードごとの詳細として残ります。
- 共有 OpenClaw テスト状態: テストが隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir、または auth-profile store を必要とする場合は、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- プロセス E2E ヘルパー: Vitest のプロセスレベル E2E テストが、実行中の Gateway、CLI env、ログキャプチャ、cleanup を一か所で必要とする場合は、`test/helpers/openclaw-test-instance.ts` を使用します。
- Docker/Bash E2E ヘルパー: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナへ渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。multi-home スクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットとして `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を使用するか、source 可能なホスト env ファイルとして `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱わないようにするためのものです。Gateway を起動する Docker/Bash レーンは、entrypoint 解決、モック OpenAI 起動、Gateway のフォアグラウンド/バックグラウンド起動、readiness probe、state env export、ログダンプ、プロセス cleanup のために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- full、extension、include-pattern のシャード実行は、ローカル timing データを `.artifacts/vitest-shard-timings.json` に更新します。以降の whole-config 実行では、その timing を使って遅いシャードと速いシャードを均衡させます。include-pattern CI シャードは timing key にシャード名を追加するため、whole-config timing データを置き換えずに filtered shard timing を可視化できます。ローカル timing artifact を無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、現在、`test/setup.ts` のみを保持する専用の軽量レーンを経由します。runtime-heavy なケースは既存のレーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマップされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集では、依存パスが精密な場合に、すべてのシャードを広範実行するのではなく、ローカル import グラフを使って import しているテストを実行します。
- `auto-reply` は、reply ハーネスがより軽量な top-level status/token/helper テストを支配しないよう、3 つの専用 config（`core`、`top-level`、`reply`）にも分割されるようになりました。
- ベース Vitest config は現在、`pool: "threads"` と `isolate: false` をデフォルトにし、共有の非隔離 runner がリポジトリ config 全体で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての拡張/Plugin シャードを実行します。重いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行されます。他の Plugin グループはバッチのままです。バンドル済み Plugin 1 つのレーンには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: 明示的なファイル/ディレクトリターゲットにはスコープ付きレーンルーティングを使い続けながら、Vitest の import-duration と import-breakdown のレポートを有効にします。
- `pnpm test:perf:imports:changed`: 同じ import プロファイリングを、`origin/main` 以降に変更されたファイルのみで実行します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git 差分に対して、ルーティングされた changed-mode パスをネイティブ root-project 実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、現在の worktree の変更セットを、先にコミットせずにベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU プロファイルを書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: ユニット runner の CPU + heap プロファイルを書き込みます（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest リーフ config を直列に実行し、グループ化された所要時間データと config ごとの JSON/log artifact を書き込みます。Test Performance Agent は、低速テスト修正を試みる前のベースラインとしてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後に、グループ化されたレポートを比較します。
- Gateway 統合: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in します。
- `pnpm test:e2e`: Gateway のエンドツーエンド smoke test（multi-instance WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` では adaptive workers 付きの `threads` + `isolate: false` がデフォルトです。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: provider live test（minimax/zai）を実行します。スキップ解除には API キーと `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有 live-test image をビルドし、OpenClaw を npm tarball として一度 pack し、bare Node/Git runner image と、その tarball を `/app` にインストールする functional image をビルド/再利用し、その後 weighted scheduler を通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker smoke レーンを実行します。bare image（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）は installer/update/plugin-dependency レーンに使用されます。これらのレーンは、コピーされたリポジトリソースではなく、事前ビルド済み tarball をマウントします。functional image（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）は通常の built-app functionality レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` は唯一の local/CI package packer であり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、planner ロジックは `scripts/lib/docker-e2e-plan.mjs` にあり、`scripts/test-docker-all.mjs` が選択された plan を実行します。`node scripts/test-docker-all.mjs --plan-json` は、ビルドや Docker 実行を行わず、選択されたレーン、image kinds、package/live-image needs、state scenarios、credential checks について、scheduler が所有する CI plan を出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセス slot を制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` は provider-sensitive tail pool を制御し、デフォルトは 10 です。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。provider 上限は `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、provider ごとに重いレーン 1 つがデフォルトです。より大きいホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列度ホストで 1 つのレーンが有効な weight または resource cap を超える場合でも、空の pool から開始でき、容量を解放するまで単独で実行されます。ローカル Docker daemon の create storm を避けるため、レーン開始はデフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。runner はデフォルトで Docker を preflight し、古い OpenClaw E2E コンテナを cleanup し、30 秒ごとに active-lane status を出力し、互換性のあるレーン間で provider CLI tool cache を共有し、一時的な live-provider failure をデフォルトで 1 回 retry し（`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`）、以降の実行で longest-first ordering を行うためにレーン timing を `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーン manifest を出力するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1` を使用し、status 出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` を使用し、timing の再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/local レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` を使用し、live-provider レーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。package alias は `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。live-only mode は main と tail の live レーンを 1 つの longest-first pool に統合し、provider bucket が Claude、Codex、Gemini の作業を一緒に詰め込めるようにします。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、runner は最初の failure 後に新しい pooled lane の scheduling を停止します。各レーンには 120 分の fallback timeout があり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択された live/tail レーンは、より厳しい per-lane cap を使用します。CLI backend Docker setup コマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`（デフォルト 180）による独自の timeout があります。レーンごとのログ、`summary.json`、`failures.json`、phase timing は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調査するには `pnpm test:docker:timings <summary.json>` を使用し、低コストのターゲット付き再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium-backed source E2E コンテナをビルドし、raw CDP と隔離された Gateway を起動し、`browser doctor --deep` を実行し、CDP role snapshot に link URL、cursor-promoted clickables、iframe refs、frame metadata が含まれていることを検証します。
- `pnpm test:docker:skill-install`: packed OpenClaw tarball を bare Docker runner にインストールし、`skills.install.allowUploadedArchives` を無効化し、live ClawHub search から現在の skill slug を解決し、`openclaw skills install` 経由でインストールし、`SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json`、`skills info --json` を検証します。
- CLI backend live Docker probe は、たとえば `pnpm test:docker:live-cli-backend:codex`、`pnpm test:docker:live-cli-backend:codex:resume`、`pnpm test:docker:live-cli-backend:codex:mcp` のように、focus されたレーンとして実行できます。Claude と Gemini には対応する `:resume` と `:mcp` alias があります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際の proxied chat を実行します。利用可能な live model key（たとえば `~/.profile` の OpenAI）が必要で、外部 Open WebUI image を pull します。通常の unit/e2e スイートのように CI-stable であることは期待されません。
- `pnpm test:docker:mcp-channels`: シード済みの Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、その後、ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルのメタデータ、ライブイベントキューの挙動、送信ルーティング、実際の stdio ブリッジ経由での Claude 形式のチャンネル + 権限通知を検証します。Claude 通知のアサーションは raw stdio MCP フレームを直接読み取るため、このスモークはブリッジが実際に発行する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: 汚れた旧ユーザーフィクスチャの上にパック済み OpenClaw tarball をインストールし、ライブプロバイダーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、その後 local loopback Gateway を開始して、エージェント、チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係の状態、起動、RPC ステータスが維持されることを確認します。
- `pnpm test:docker:published-upgrade-survivor`: デフォルトで `openclaw@latest` をインストールし、ライブプロバイダーやチャンネルキーなしで現実的な既存ユーザーファイルをシードし、焼き込み済みの `openclaw config set` コマンドレシピでそのベースラインを設定し、公開済みインストールをパック済み OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、その後 local loopback Gateway を開始して、設定済み intent、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係の状態、起動、`/healthz`、`/readyz`、RPC ステータスが維持される、またはきれいに修復されることを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で 1 つのベースラインを上書きし、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` で `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような正確なローカルマトリクスを展開するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加します。reported-issues セットには、設定済みの外部 OpenClaw Plugin がアップグレード中に自動インストールされることを検証する `configured-plugin-installs` と、ソース専用 Plugin シャドウが起動を壊さないようにする `stale-source-plugin-shadow` が含まれます。Package Acceptance はそれらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、Docker レーンに正確なパッケージ仕様を渡す前に、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決します。
- `pnpm test:docker:update-migration`: クリーンアップが多い `plugin-deps-cleanup` シナリオで公開済みアップグレード survivor ハーネスを実行し、デフォルトでは `openclaw@2026.4.23` から開始します。別個の `Update Migration` ワークフローは、このレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定版公開済みパッケージが候補版へ更新されることを確認し、Full Release CI の外で設定済み Plugin 依存関係のクリーンアップを証明します。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、ホイストされた依存関係を持つ npm レジストリパッケージ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査について、インストール/更新スモークを実行します。

## ローカル PR ゲート

ローカルで PR の land/gate チェックを行うには、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定に失敗する場合は、リグレッションとして扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホストでは、次を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- 既定のプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

前回の実行（2025-12-31、20 回実行）:

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナルの分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は、実行ごとに V8 プロファイルを書き込むため、タイミング計測とプロファイル取得で同じハーネスを使用します。

保存される出力の規則:

- `pnpm test:startup:bench:smoke` は、対象のスモーク成果物を `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用して、フルスイートの成果物を `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` で更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新します
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較します

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディングのスモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、疑似 tty 経由で対話型ウィザードを駆動し、config/workspace/session ファイルを検証した後、gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク（Docker）

メンテナンスされている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（既定の Node 24、互換の Node 22）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と plugins のテスト](/ja-JP/help/testing-updates-plugins)
