---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法（vitest）と force/coverage モードを使用するタイミング
title: テスト
x-i18n:
    generated_at: "2026-06-28T00:13:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- アップデートとPluginパッケージの検証: [アップデートとPluginのテスト](/ja-JP/help/testing-updates-plugins)

- 通常のローカルテスト順序:
  1. 変更スコープの Vitest 証明には `pnpm test:changed`。
  2. 1 ファイル、ディレクトリ、または明示的なターゲットには `pnpm test <path-or-filter>`。
  3. ローカルの Vitest フルスイートが意図的に必要な場合のみ `pnpm test`。
- `pnpm test:force`: デフォルトの制御ポートを保持している残留 Gateway プロセスを終了し、隔離された Gateway ポートで Vitest フルスイートを実行するため、サーバーテストが実行中のインスタンスと衝突しません。以前の Gateway 実行でポート 18789 が使用中のままになった場合に使用します。
- `pnpm test:coverage`: V8 カバレッジでユニットスイートを実行します（`vitest.unit.config.ts` 経由）。これはデフォルトユニットレーンのカバレッジゲートであり、リポジトリ全体の全ファイルカバレッジではありません。しきい値は行/関数/ステートメントが 70%、ブランチが 55% です。`coverage.all` が false であり、デフォルトレーンがカバレッジ対象を兄弟ソースファイルを持つ非高速ユニットテストにスコープするため、このゲートは偶然読み込まれたすべての推移的 import ではなく、このレーンが所有するソースを測定します。
- `pnpm test:coverage:changed`: `origin/main` 以降に変更されたファイルについてのみユニットカバレッジを実行します。
- `pnpm test:changed`: 安価でスマートな変更テスト実行です。直接のテスト編集、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフから精密なターゲットを実行します。広範な config/package 変更は、精密なテストにマッピングされない限りスキップされます。
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: 明示的な広範囲変更テスト実行です。テストハーネス/config/package の編集で、Vitest のより広い変更テスト動作へフォールバックすべき場合に使用します。
- `pnpm changed:lanes`: `origin/main` に対する diff によってトリガーされるアーキテクチャレーンを表示します。
- `pnpm check:changed`: CI 外ではデフォルトで Crabbox/Testbox に委譲し、リモート子プロセス内で `origin/main` に対する diff のスマート変更チェックゲートを実行します。影響を受けるアーキテクチャレーンの typecheck、lint、ガードコマンドを実行しますが、Vitest テストは実行しません。テスト証明には `pnpm test:changed` または明示的な `pnpm test <target>` を使用します。
- Codex worktree と linked/sparse checkout: pnpm が依存関係を調整しないことを確認していない限り、直接ローカルで `pnpm test*`、`pnpm check*`、`pnpm crabbox:run` を実行するのは避けます。小さな明示的ファイル証明には `node scripts/run-vitest.mjs <path-or-filter>` を使用します。変更ゲートや広範な証明には `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` を使用し、pnpm が Testbox 内で実行されるようにします。
- Testbox-through-Crabbox 証明: ラッパーの最終 `exitCode` とタイミング JSON をコマンド結果として使用します。委譲された Blacksmith GitHub Actions 実行は、SSH コマンドが成功した後でも、Testbox が keepalive action の外部から停止されるため `cancelled` と表示されることがあります。これをテスト失敗として扱う前に、ラッパーの要約とコマンド出力を確認します。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` や対象指定の `pnpm test ...` などのコマンドについて、heavy-check の直列化を Git common dir ではなく現在の worktree 内に保持します。linked worktree 全体で独立したチェックを意図的に実行する高容量のローカルホストでのみ使用します。
- `pnpm test`: 明示的なファイル/ディレクトリターゲットをスコープされた Vitest レーンへルーティングします。ターゲットなしの実行はフルスイート証明です。固定シャードグループを使用し、ローカル並列実行用にリーフ config へ展開し、開始前に予期されるローカルシャード fanout を出力します。拡張機能グループは、巨大な root-project プロセス 1 つではなく、常に拡張機能ごとのシャード config へ展開されます。
- テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` 要約で終了します。Vitest 自体の duration 行はシャードごとの詳細のままです。
- 共有 OpenClaw テスト状態: テストが隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、config fixture、workspace、agent dir、または auth-profile store を必要とする場合、Vitest から `src/test-utils/openclaw-test-state.ts` を使用します。
- `pnpm test:env-mutations:report`: `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR`、または関連する OpenClaw env キーを直接変更するテストとハーネスの非ブロッキングレポートです。共有 test-state helper への移行候補を見つけるために使用します。
- Control UI mocked E2E: Vite Control UI を起動し、mock された Gateway WebSocket に対して実際の Chromium ページを操作する Vitest + Playwright レーンには `pnpm test:ui:e2e` を使用します。テストは `ui/src/**/*.e2e.test.ts` にあります。共有 mock と制御は `ui/src/test-helpers/control-ui-e2e.ts` にあります。`pnpm test:e2e` にはこのレーンが含まれます。Codex worktree では、依存関係のインストール後の小さな対象指定証明には `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` を優先し、より広範な GUI 証明には Testbox/Crabbox を使用します。
- プロセス E2E helper: Vitest のプロセスレベル E2E テストが、実行中の Gateway、CLI env、ログキャプチャ、クリーンアップを 1 か所で必要とする場合は `test/helpers/openclaw-test-instance.ts` を使用します。
- TUI PTY テスト: 高速な fake-backend PTY レーンには `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` を使用します。外部モデルエンドポイントのみを mock する、より遅い `tui --local` smoke には `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` または `pnpm tui:pty:test:watch --mode local` を使用します。生の ANSI スナップショットではなく、安定した可視テキストまたは fixture 呼び出しを assert します。
- Docker/Bash E2E helper: `scripts/lib/docker-e2e-image.sh` を source するレーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。multi-home スクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。低レベルの呼び出し元は、コンテナ内シェルスニペットに `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` を使用するか、source 可能なホスト env ファイルに `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` を使用できます。`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱うのを防ぎます。Gateway を起動する Docker/Bash レーンは、entrypoint 解決、mock OpenAI 起動、Gateway の foreground/background 起動、readiness probe、state env export、ログ dump、プロセスクリーンアップのために、コンテナ内で `scripts/lib/openclaw-e2e-instance.sh` を source できます。
- フル、拡張機能、include-pattern のシャード実行は、ローカルタイミングデータを `.artifacts/vitest-shard-timings.json` に更新します。後続の whole-config 実行は、それらのタイミングを使用して遅いシャードと速いシャードのバランスを取ります。include-pattern CI シャードはタイミングキーにシャード名を追加し、whole-config タイミングデータを置き換えずに filtered shard タイミングを可視化します。ローカルタイミングアーティファクトを無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを通るようになり、runtime-heavy なケースは既存のレーンに残ります。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟へマッピングされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下の helper 編集は、依存パスが精密な場合、すべてのシャードを広範囲実行する代わりに、ローカル import グラフを使用して importing tests を実行します。
- `auto-reply` は 3 つの専用 config（`core`、`top-level`、`reply`）にも分割され、reply harness がより軽い top-level status/token/helper テストを支配しないようになりました。
- ベース Vitest config は、リポジトリ config 全体で共有の非隔離 runner を有効にしたうえで、デフォルトが `pool: "threads"` と `isolate: false` になりました。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。
- `pnpm test:extensions` と `pnpm test extensions` はすべての拡張機能/Plugin シャードを実行します。重い channel Plugin、browser Plugin、OpenAI は専用シャードとして実行されます。他の Plugin グループはバッチのままです。1 つの bundled Plugin レーンには `pnpm test extensions/<id>` を使用します。
- `pnpm test:perf:imports`: 明示的なファイル/ディレクトリターゲットにはスコープされたレーンルーティングを引き続き使用しつつ、Vitest import-duration + import-breakdown レポートを有効にします。
- `pnpm test:perf:imports:changed`: 同じ import profiling ですが、`origin/main` 以降に変更されたファイルのみを対象にします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff について、ルーティングされた changed-mode パスをネイティブ root-project 実行と比較してベンチマークします。
- `pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在の worktree 変更セットをベンチマークします。
- `pnpm test:perf:profile:main`: Vitest メインスレッドの CPU profile を書き込みます（`.artifacts/vitest-main-profile`）。
- `pnpm test:perf:profile:runner`: unit runner の CPU + heap profile を書き込みます（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest leaf config を直列に実行し、グループ化された duration データと config ごとの JSON/log アーティファクトを書き込みます。Test Performance Agent は、slow-test 修正を試みる前の baseline としてこれを使用します。
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: パフォーマンス重視の変更後にグループ化レポートを比較します。
- `pnpm test:docker:timings <summary.json>` は Docker all 実行後に遅い Docker レーンを検査します。同じアーティファクトから安価な対象指定 rerun コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- Gateway integration: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway` で opt-in します。
- `pnpm test:e2e`: リポジトリ E2E aggregate を実行します。Gateway end-to-end smoke テストと Control UI mocked browser E2E レーンです。
- `pnpm test:e2e:gateway`: Gateway end-to-end smoke テスト（multi-instance WS/HTTP/node pairing）を実行します。`vitest.e2e.config.ts` では adaptive workers とともに、デフォルトで `threads` + `isolate: false` です。`OPENCLAW_E2E_WORKERS=<n>` で調整し、詳細ログには `OPENCLAW_E2E_VERBOSE=1` を設定します。
- `pnpm test:live`: provider live テスト（minimax/zai）を実行します。skip を解除するには API キーと `LIVE=1`（または provider 固有の `*_LIVE_TEST=1`）が必要です。
- `pnpm test:docker:all`: 共有ライブテストイメージをビルドし、OpenClaw を npm tarball として一度だけパックし、素の Node/Git ランナーイメージと、その tarball を `/app` にインストールする機能イメージをビルドまたは再利用してから、重み付きスケジューラーを通じて `OPENCLAW_SKIP_DOCKER_BUILD=1` で Docker スモークレーンを実行します。素のイメージ (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) はインストーラー、更新、Plugin 依存関係レーンに使用されます。これらのレーンは、コピーされたリポジトリソースを使う代わりに、事前ビルド済み tarball をマウントします。機能イメージ (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) は、通常のビルド済みアプリ機能レーンに使用されます。`scripts/package-openclaw-for-docker.mjs` はローカル/CI 共通の単一パッケージパッカーであり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。Docker レーン定義は `scripts/lib/docker-e2e-scenarios.mjs` にあり、プランナーのロジックは `scripts/lib/docker-e2e-plan.mjs` にあります。`scripts/test-docker-all.mjs` は選択されたプランを実行します。`node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、選択されたレーン、イメージ種別、パッケージ/ライブイメージの必要性、状態シナリオ、認証情報チェックについて、スケジューラーが所有する CI プランを出力します。`OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` はプロセススロットを制御し、デフォルトは 10 です。`OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` はプロバイダーに敏感な末尾プールを制御し、デフォルトは 10 です。重いレーンの上限はデフォルトで `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`、`OPENCLAW_DOCKER_ALL_NPM_LIMIT=5`、`OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7` です。プロバイダー上限は `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4`、`OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4` により、デフォルトでプロバイダーごとに重いレーン 1 本です。より大きなホストでは `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` または `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` を使用します。低並列ホストで 1 本のレーンが有効な重みまたはリソース上限を超える場合でも、空のプールから開始でき、容量を解放するまで単独で実行されます。ローカル Docker デーモンの作成集中を避けるため、レーン開始はデフォルトで 2 秒ずつずらされます。`OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>` で上書きできます。ランナーはデフォルトで Docker を事前チェックし、古い OpenClaw E2E コンテナをクリーンアップし、30 秒ごとにアクティブレーンのステータスを出力し、互換性のあるレーン間でプロバイダー CLI ツールキャッシュを共有し、一時的なライブプロバイダー失敗をデフォルトで 1 回再試行 (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) し、後続実行で長いものから順に並べるためにレーン所要時間を `.artifacts/docker-tests/lane-timings.json` に保存します。Docker を実行せずにレーンマニフェストを表示するには `OPENCLAW_DOCKER_ALL_DRY_RUN=1`、ステータス出力を調整するには `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`、所要時間の再利用を無効にするには `OPENCLAW_DOCKER_ALL_TIMINGS=0` を使用します。決定的/ローカルレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip`、ライブプロバイダーレーンのみには `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` を使用します。パッケージエイリアスは `pnpm test:docker:local:all` と `pnpm test:docker:live:all` です。ライブ専用モードでは、メインと末尾のライブレーンを長いもの優先の単一プールに統合し、プロバイダーバケットが Claude、Codex、Gemini の作業を一緒に詰め込めるようにします。`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、ランナーは最初の失敗後に新しいプール済みレーンのスケジューリングを停止します。また、各レーンには 120 分のフォールバックタイムアウトがあり、`OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` で上書きできます。選択されたライブ/末尾レーンでは、より厳しいレーン別上限を使用します。CLI バックエンド Docker セットアップコマンドには、`OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` による独自のタイムアウトがあります (デフォルト 180)。レーン別ログ、`summary.json`、`failures.json`、フェーズ所要時間は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調べるには `pnpm test:docker:timings <summary.json>` を使用し、安価で対象を絞った再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。
- `pnpm test:docker:browser-cdp-snapshot`: Chromium を利用するソース E2E コンテナをビルドし、生の CDP と分離された Gateway を起動し、`browser doctor --deep` を実行して、CDP ロールスナップショットにリンク URL、カーソル昇格されたクリック可能要素、iframe 参照、フレームメタデータが含まれることを検証します。
- `pnpm test:docker:skill-install`: 素の Docker ランナーにパック済み OpenClaw tarball をインストールし、`skills.install.allowUploadedArchives` を無効化し、ライブ ClawHub 検索から現在の Skill slug を解決し、`openclaw skills install` を通じてインストールして、`SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json`、`skills info --json` を検証します。
- CLI バックエンドのライブ Docker プローブは、たとえば `pnpm test:docker:live-cli-backend:claude`、`pnpm test:docker:live-cli-backend:claude:resume`、`pnpm test:docker:live-cli-backend:claude:mcp` のような焦点を絞ったレーンとして実行できます。Gemini には対応する `:resume` と `:mcp` エイリアスがあります。
- `pnpm test:docker:openwebui`: Docker 化された OpenClaw + Open WebUI を起動し、Open WebUI 経由でサインインし、`/api/models` を確認してから、`/api/chat/completions` 経由で実際のプロキシ済みチャットを実行します。利用可能なライブモデルキーが必要で、外部の Open WebUI イメージをプルします。また、通常のユニット/E2E スイートのように CI で安定することは想定されていません。
- `pnpm test:docker:mcp-channels`: シード済み Gateway コンテナと、`openclaw mcp serve` を起動する 2 つ目のクライアントコンテナを開始し、ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの挙動、送信ルーティング、実際の stdio ブリッジ越しの Claude スタイルのチャンネルおよび権限通知を検証します。Claude 通知アサーションは生の stdio MCP フレームを直接読み取るため、スモークはブリッジが実際に出力する内容を反映します。
- `pnpm test:docker:upgrade-survivor`: 汚れた旧ユーザーフィクスチャ上にパック済み OpenClaw tarball をインストールし、ライブプロバイダーキーやチャンネルキーなしでパッケージ更新と非対話型 doctor を実行してから、loopback Gateway を起動し、エージェント、チャンネル設定、Plugin allowlist、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係状態、起動、RPC ステータスが存続することを確認します。
- `pnpm test:docker:published-upgrade-survivor`: デフォルトで `openclaw@latest` をインストールし、ライブプロバイダーキーやチャンネルキーなしで現実的な既存ユーザーファイルをシードし、焼き込み済みの `openclaw config set` コマンドレシピでそのベースラインを設定し、その公開済みインストールをパック済み OpenClaw tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込んでから、loopback Gateway を起動し、設定済み intent、ワークスペース/セッションファイル、古い Plugin 設定とレガシー依存関係状態、起動、`/healthz`、`/readyz`、RPC ステータスが存続するか、正常に修復されることを確認します。1 つのベースラインを上書きするには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` を使用し、`openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` のような正確なローカルマトリクスを展開するには `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` を使用し、シナリオフィクスチャを追加するには `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` を使用します。reported-issues セットには、設定済み外部 OpenClaw Plugin がアップグレード中に自動的にインストールされることを検証する `configured-plugin-installs` と、ソース専用 Plugin シャドウが起動を壊さないようにする `stale-source-plugin-shadow` が含まれます。Package Acceptance は、これらを `published_upgrade_survivor_baseline`、`published_upgrade_survivor_baselines`、`published_upgrade_survivor_scenarios` として公開し、正確なパッケージ spec を Docker レーンへ渡す前に、`last-stable-4` や `all-since-2026.4.23` のようなメタベースライントークンを解決します。
- `pnpm test:docker:update-migration`: クリーンアップが重い `plugin-deps-cleanup` シナリオで公開済みアップグレード survivor ハーネスを実行し、デフォルトで `openclaw@2026.4.23` から開始します。別個の `Update Migration` ワークフローは、このレーンを `baselines=all-since-2026.4.23` で展開し、`.23` 以降のすべての安定公開済みパッケージが候補へ更新され、Full Release CI の外で設定済み Plugin 依存関係のクリーンアップを証明するようにします。
- `pnpm test:docker:plugins`: ローカルパス、`file:`、巻き上げられた依存関係を持つ npm registry パッケージ、git の移動 ref、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査について、インストール/更新スモークを実行します。

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

## モデルレイテンシベンチ（ローカルキー）

スクリプト: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

使用方法:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- 任意の env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

前回の実行（2025-12-31、20 回）:

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

出力には、各コマンドの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナル分布、最大 RSS サマリーが含まれます。任意の `--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込むため、タイミングとプロファイル取得で同じハーネスを使用できます。

保存済み出力の慣例:

- `pnpm test:startup:bench:smoke` は、対象のスモークアーティファクトを `.artifacts/cli-startup-bench-smoke.json` に書き込みます
- `pnpm test:startup:bench:save` は、`runs=5` と `warmup=1` を使用して、フルスイートのアーティファクトを `.artifacts/cli-startup-bench-all.json` に書き込みます
- `pnpm test:startup:bench:update` は、`runs=5` と `warmup=1` を使用して、チェックイン済みのベースラインフィクスチャを `test/fixtures/cli-startup-bench.json` に更新します

チェックイン済みフィクスチャ:

- `test/fixtures/cli-startup-bench.json`
- `pnpm test:startup:bench:update` で更新
- `pnpm test:startup:bench:check` で現在の結果をフィクスチャと比較

## Gateway 起動ベンチ

スクリプト: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

ベンチマークはデフォルトで `dist/entry.js` にあるビルド済み CLI エントリを使用します。package-script コマンドを使用する前に
`pnpm build` を実行してください。代わりにソースランナーを測定するには、`--entry scripts/run-node.mjs` を渡し、その結果はビルド済みエントリのベースラインとは分けて扱ってください。

使用方法:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

ケース ID:

- `default`: 通常の Gateway 起動。
- `skipChannels`: チャンネル起動をスキップした Gateway 起動。
- `oneInternalHook`: 設定済みの内部フック 1 つ。
- `allInternalHooks`: すべての内部フック。
- `fiftyPlugins`: 50 個のマニフェスト Plugin。
- `fiftyStartupLazyPlugins`: 50 個の startup-lazy マニフェスト Plugin。

出力には、最初のプロセス出力、`/healthz`、`/readyz`、HTTP listen ログ時刻、Gateway ready ログ時刻、CPU 時間、CPU コア比率、最大 RSS、ヒープ、起動トレースメトリクス、イベントループ遅延、Plugin lookup-table 詳細メトリクスが含まれます。このスクリプトは、子 Gateway 環境で `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を有効にします。

`/healthz` はライブネスとして読み取ります。HTTP サーバーが応答できます。`/readyz` は使用可能な readiness として読み取ります。起動 Plugin サイドカー、チャンネル、ready-critical な post-attach 作業が安定しています。Gateway 起動フックは非同期にディスパッチされ、readiness 保証の一部ではありません。Ready ログ時刻は Gateway 内部の ready ログタイムスタンプです。プロセス側の帰属分析には有用ですが、外部の `/readyz` プローブの代替にはなりません。

変更を比較する場合は JSON 出力または `--output` を使用します。トレース出力が、フェーズタイミングだけでは説明できない import、compile、または CPU-bound な作業を示した場合にのみ `--cpu-prof-dir` を使用します。ソースランナーの結果とビルド済み `dist/entry.js` の結果を同じベースラインとして比較しないでください。

## Gateway 再起動ベンチ

スクリプト: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

再起動ベンチマークは macOS と Linux のみでサポートされます。プロセス内再起動には SIGUSR1 を使用し、Windows では即座に失敗します。

ベンチマークはデフォルトで `dist/entry.js` にあるビルド済み CLI エントリを使用します。package-script コマンドを使用する前に
`pnpm build` を実行してください。代わりにソースランナーを測定するには、`--entry scripts/run-node.mjs` を渡し、その結果はビルド済みエントリのベースラインとは分けて扱ってください。

使用方法:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

ケース ID:

- `skipChannels`: チャンネルをスキップした再起動。
- `skipChannelsAcpxProbe`: チャンネルをスキップし、ACPX 起動プローブをオンにした再起動。
- `skipChannelsNoAcpxProbe`: チャンネルをスキップし、ACPX 起動プローブをオフにした再起動。
- `default`: 通常の再起動。
- `fiftyPlugins`: 50 個のマニフェスト Plugin を使用した再起動。

出力には、次の `/healthz`、次の `/readyz`、ダウンタイム、restart ready タイミング、CPU、RSS、置換プロセスの起動トレースメトリクス、シグナル処理、active-work drain、close フェーズ、次の起動、ready タイミング、メモリスナップショットの再起動トレースメトリクスが含まれます。このスクリプトは、子 Gateway 環境で
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` と `OPENCLAW_GATEWAY_RESTART_TRACE=1` を有効にします。

変更が再起動シグナリング、close ハンドラー、startup-after-restart、サイドカーシャットダウン、サービスハンドオフ、または再起動後の readiness に触れる場合は、このベンチマークを使用します。Gateway の仕組みをチャンネル起動から切り分ける場合は、`skipChannels` から始めます。`default` または Plugin-heavy なケースは、狭いケースで再起動パスを説明できてから使用します。

トレースメトリクスは帰属の手がかりであり、判定ではありません。再起動の変更は、複数サンプル、対応する owner span、`/healthz` と `/readyz` の挙動、ユーザーに見える再起動契約から判断する必要があります。

## オンボーディング E2E（Docker）

Docker は任意です。これはコンテナ化されたオンボーディングスモークテストにのみ必要です。

クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

このスクリプトは、pseudo-tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証した後、Gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク（Docker）

メンテナンスされている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 デフォルト、Node 22 互換）でロードされることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
