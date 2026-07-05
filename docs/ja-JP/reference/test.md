---
read_when:
    - テストの実行または修正
summary: ローカルでテストを実行する方法（vitest）と force/coverage モードを使うタイミング
title: テスト
x-i18n:
    generated_at: "2026-07-05T17:41:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17e8128198bea80e83a74cfbeb0a63056e7913ce4c7b6f976b4ec929fcfe493d
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）: [テスト](/ja-JP/help/testing)
- 更新と Plugin パッケージの検証: [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)

## エージェントのデフォルト

エージェントセッションは、テストと計算負荷の高い検証を Crabbox 経由でリモート実行します。信頼済みメンテナーコードでは、デフォルトで Blacksmith Testbox を使用します。設定済みの Testbox ワークフローは認証情報をハイドレートするため、信頼されていないコントリビューターまたはフォークのコードでは、代わりにシークレットなしのフォーク CI またはサニタイズ済みの直接 AWS Crabbox を使用する必要があります。

信頼済みコードのタスクでテストや重い証明が必要になりそうな場合は、バックグラウンドコマンドセッションですぐにプリウォームし、ハイドレート中も作業を続け、返された `tbx_...` id を再利用し、実行ごとに現在のチェックアウトを同期し、引き渡し前に停止します。

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

以下のローカルテストコマンドは、人間のワークフロー、またはユーザーから明示的に要求されたエージェントのフォールバック用です。リモートプロバイダーが利用できない場合は報告する必要があります。それは広範なローカルゲートを黙って実行する許可ではありません。

信頼されていないコードでは、`--provider aws` でプリウォームします。すべての実行で `CRABBOX_ENV_ALLOW=CI` を設定し、`--provider aws --no-hydrate` を渡し、依存関係をインストールまたはテストを実行する前に、新しい一時リモート `HOME` を使用する必要があります。その信頼されていないソース専用に新しくウォームしたリースを使用し、信頼済みまたは以前にハイドレートされたリースを再利用しないでください。クリーンな信頼済み `main` チェックアウトから、インストール済みの信頼済み Crabbox バイナリを起動し、`--fresh-pr` でリモート PR のみを取得します。信頼されていないチェックアウトのラッパーや設定をローカルで実行してはいけません。`CRABBOX_AWS_INSTANCE_PROFILE` を解除し、解決済みの `aws.instanceProfile` が空でない限りフェイルクローズします。インストールやテストの前に、信頼済みの絶対パスツールを使って IMDSv2 トークンを要求し、IAM 認証情報エンドポイントが 404 を返すことを証明し、リモートの `git rev-parse HEAD` がレビュー済み PR ヘッドの完全な SHA と等しいことを検証します。リースをその SHA に結び付け、ヘッドが変わったら停止して再ウォームします。クリーンな `main` から信頼済みの `scripts/crabbox-untrusted-bootstrap.sh` を `--fresh-pr` と一緒にアップロードします。これはピン留めされた Node/pnpm をインストールし、SHA とパッケージマネージャーのピン留めを検証し、`HOME` を分離し、依存関係をインストールしてから、要求されたテストを実行します。ブローカーがロールなし、またはリモート PR が存在しないことを証明できない場合は、シークレットなしのフォーク CI を使用します。`hydrate-github`、`--no-sync`、または認証情報でハイドレートされた Testbox ワークフローを使用しないでください。
すべての `CRABBOX_TAILSCALE*` オーバーライドを解除し、`--network public
--tailscale=false` を強制し、exit-node/LAN フラグをクリアし、スクリプトをアップロードする前に `crabbox inspect` が Tailscale 状態なしのパブリックネットワークを報告することを要求します。

## 通常のローカル順序

1. 変更スコープの Vitest 証明には `pnpm test:changed`。
2. 1 つのファイル、ディレクトリ、または明示的なターゲットには `pnpm test <path-or-filter>`。
3. ローカルの Vitest フルスイートが意図的に必要な場合のみ `pnpm test`。

Codex ワークツリーまたはリンク/スパースチェックアウトでは、エージェントは直接のローカル `pnpm test*` / `pnpm check*` / `pnpm crabbox:run` を避けます。

- 小さなファイルに対してユーザーが明示的に要求したローカルフォールバック:
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 変更ゲートまたは広範な証明: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`。これにより pnpm は Testbox 内で実行されます。
- ラッパーの最終 `exitCode` とタイミング JSON がコマンド結果です。委譲された Blacksmith GitHub Actions 実行は、SSH コマンド成功後に `cancelled` と表示される場合があります。これは Testbox が keepalive action の外部から停止されるためです。失敗として扱う前に、ラッパーのサマリーとコマンド出力を確認してください。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: `pnpm check:changed` や対象指定の `pnpm test ...` などのコマンドで、heavy-check の直列化を Git 共通ディレクトリではなく現在のワークツリー内に保ちます。リンクされたワークツリー間で独立したチェックを意図的に実行する場合に、高容量のローカルホストでのみ使用してください。

## コアコマンド

テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終わります。Vitest 自身の所要時間行は、シャードごとの詳細として残ります。

| コマンド                                           | 内容                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明示的なファイル/ディレクトリターゲットは、スコープ付き Vitest レーンを通ります。ターゲットなしの実行はフルスイート証明です。固定シャードグループはローカル並列実行用のリーフ設定に展開され、開始前に想定されるシャードのファンアウトが表示されます。Plugin グループは、巨大なルートプロジェクトプロセス 1 つではなく、常に Plugin ごとのシャード設定に展開されます。 |
| `pnpm test:changed`                               | 安価でスマートな変更テスト実行: 直接編集されたテスト、兄弟 `*.test.ts` ファイル、明示的なソースマッピング、ローカル import グラフから精密なターゲットを取得します。広範な設定/パッケージ変更は、精密なテストにマップされない限りスキップされます。                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明示的な広範変更テスト実行。テストハーネス/設定/パッケージの編集で、Vitest のより広い変更テスト動作にフォールバックすべき場合に使用します。                                                                                                                                                                                                              |
| `pnpm test:force`                                 | 設定済みの OpenClaw Gateway ポート（デフォルト `18789`）を解放してから、分離された Gateway ポートでフルスイートを実行し、サーバーテストが実行中のインスタンスと衝突しないようにします。                                                                                                                                                                          |
| `pnpm test:coverage`                              | V8 カバレッジ付きのユニットスイート（`vitest.unit.config.ts`）。リポジトリ全体のカバレッジではなく、デフォルトのユニットレーンゲートです。`coverage.all` は `false` で、しきい値は行/関数/ステートメント 70%、ブランチ 55%、兄弟ソースファイルを持つ非 fast ユニットテストにスコープされます。                                                                                           |
| `pnpm test:coverage:changed`                      | `origin/main` 以降に変更されたファイルのみのユニットカバレッジ。                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | `origin/main` に対する diff によってトリガーされるアーキテクチャレーンを表示します。                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | CI 外ではデフォルトで Crabbox/Testbox に委譲し、その後リモート子プロセス内でスマート変更チェックゲートを実行します。対象レーンの typecheck、lint、guard コマンドを実行します。Vitest は実行しません。テスト証明には `pnpm test:changed` または `pnpm test <target>` を使用してください。                                                                                      |

## 共有テスト状態とプロセスヘルパー

- `src/test-utils/openclaw-test-state.ts`: テストで分離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定フィクスチャ、ワークスペース、エージェントディレクトリ、または auth-profile ストアが必要な場合に、Vitest から使用します。
- `pnpm test:env-mutations:report`: `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR`、または関連する env キーを直接変更するテスト/ハーネスの非ブロッキングレポートです。共有 test-state ヘルパーへの移行候補を見つけるために使用します。
- `test/helpers/openclaw-test-instance.ts`: 実行中の Gateway、CLI env、ログキャプチャ、クリーンアップを 1 か所で必要とするプロセスレベルの E2E テスト用です。
- `scripts/lib/docker-e2e-image.sh` を source する Docker/Bash E2E レーンは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。マルチホームスクリプトは `docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` は、source 可能なホスト env ファイルを書き出します（`create` の前の `--` は、新しい Node ランタイムが `--env-file` を Node フラグとして扱うのを防ぎます）。Gateway を起動するレーンは、エントリポイント解決、モック OpenAI 起動、フォアグラウンド/バックグラウンド起動、readiness probe、state env export、ログダンプ、プロセスクリーンアップのために `scripts/lib/openclaw-e2e-instance.sh` を source できます。

## Control UI、TUI、Plugin レーン

- **Control UI モック E2E:** `pnpm test:ui:e2e` は、Vite Control UI を起動し、モックされた Gateway WebSocket に対して実際の Chromium ページを操作する Vitest + Playwright レーンを実行します。テストは `ui/src/**/*.e2e.test.ts` にあり、共有モック/コントロールは `ui/src/test-helpers/control-ui-e2e.ts` にあります。`pnpm test:e2e` はこのレーンを含みます。エージェント実行は、対象指定の証明を含め、デフォルトで Testbox/Crabbox を使用します。明示的なローカルフォールバックの場合のみ `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` を使用してください。
- **TUI PTY テスト:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` は、高速なフェイクバックエンド PTY レーンを実行します。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` または `pnpm tui:pty:test:watch --mode local` は、外部モデルエンドポイントのみをモックする、より遅い `tui --local` スモークを実行します。生の ANSI スナップショットではなく、安定した表示テキストまたはフィクスチャ呼び出しをアサートしてください。
- `pnpm test:extensions` と `pnpm test extensions` はすべての Plugin シャードを実行します。重いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、その他の Plugin グループはバッチ化されたままです。`pnpm test extensions/<id>` は、1 つのバンドル済み Plugin レーンを実行します。
- 兄弟テストを持つソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストにマップされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集では、依存パスが精密な場合、すべてのシャードを広範に実行する代わりに、ローカル import グラフを使って import 元のテストを実行します。
- `auto-reply` は 3 つの専用設定（`core`、`top-level`、`reply`）に分割されているため、reply ハーネスが軽量な top-level の status/token/helper テストを圧迫しません。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを通り、ランタイムが重いケースは既存のレーンに残します。
- ベース Vitest 設定はデフォルトで `pool: "threads"` と `isolate: false` を使用し、共有の非分離ランナーがリポジトリ設定全体で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。

## Gateway と E2E

- Gateway 統合はオプトインです: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway`。
- `pnpm test:e2e`: リポジトリの E2E 集約 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`: gateway のエンドツーエンドスモークテスト（マルチインスタンス WS/HTTP/node ペアリング）。デフォルトは `vitest.e2e.config.ts` の適応型ワーカー付き `threads` + `isolate: false` です。`OPENCLAW_E2E_WORKERS=<n>` で調整し、`OPENCLAW_E2E_VERBOSE=1` で詳細ログを有効にします。
- `pnpm test:live`: プロバイダーのライブテスト（Claude/Minimax/DeepSeek/z.ai など、`*.live.test.ts` でゲート）。スキップを解除するには API キーと `LIVE=1`（または `OPENCLAW_LIVE_TEST=1`）が必要です。`OPENCLAW_LIVE_TEST_QUIET=0` で詳細出力を有効にします。

## Docker フルスイート（`pnpm test:docker:all`）

共有ライブテストイメージをビルドし、OpenClaw を npm tarball として一度パックし、ベア Node/Git ランナーイメージと、その tarball を `/app` にインストールする機能イメージをビルドまたは再利用してから、重み付きスケジューラーで Docker スモークレーンを実行します。`scripts/package-openclaw-for-docker.mjs` はローカル/CI 共通の単一パッケージパッカーであり、Docker が消費する前に tarball と `dist/postinstall-inventory.json` を検証します。

- ベアイメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）: インストーラー/更新/Plugin 依存レーン。コピーされたリポジトリソースではなく、事前ビルド済み tarball をマウントします。
- 機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）: 通常のビルド済みアプリ機能レーン。
- レーン定義: `scripts/lib/docker-e2e-scenarios.mjs`。プランナー: `scripts/lib/docker-e2e-plan.mjs`。実行器: `scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、スケジューラー所有の CI プラン（レーン、イメージ種別、パッケージ/ライブイメージ要件、状態シナリオ、資格情報チェック）を出力します。

スケジューリングの調整項目（環境変数、括弧内はデフォルト）:

| 環境変数                                                                                                        | デフォルト          | 目的                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | プロセススロット。                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | プロバイダーに敏感なテールプール。                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 重いライブプロバイダーレーンの上限。                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm リソースレーンの上限。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | サービスリソースレーンの上限。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | プロバイダー別の重いレーン上限。                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | より狭いプロバイダー別の上限。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | より大きなホスト向けの上書き。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | レーン開始間の遅延。ローカル Docker デーモンの作成集中を避けます。                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | レーン別のフォールバックタイムアウト。選択されたライブ/テールレーンはより厳しい上限を使います。                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 一時的なライブプロバイダー失敗の再試行回数。                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Docker を実行せずにレーンマニフェストを出力します。                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | アクティブレーンのステータス出力間隔。                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | 最長優先の順序付けに `.artifacts/docker-tests/lane-timings.json` を再利用します。無効にするには `0` に設定します。                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | 決定的/ローカルレーンのみの場合は `skip`、ライブプロバイダーレーンのみの場合は `only`。エイリアス: `pnpm test:docker:local:all`、`pnpm test:docker:live:all`。ライブ専用モードでは、メインとテールのライブレーンを 1 つの最長優先プールに統合し、プロバイダーバケットが Claude/Codex/Gemini の作業をまとめて詰められるようにします。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI バックエンド Docker セットアップタイムアウト。                                                                                                                                                                                                                                         |

リソース上限の環境変数パターンは `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` です（リソース名は大文字化し、英数字以外は `_` にまとめます）。

その他の動作: ランナーはデフォルトで Docker をプリフライトし、古い OpenClaw E2E コンテナーをクリーンアップし、互換性のあるレーン間でプロバイダー CLI ツールキャッシュを共有し、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の失敗後に新しいプールレーンのスケジューリングを停止します。低並列ホストで 1 つのレーンが有効な重み/リソース上限を超える場合でも、空のプールから単独で開始し、容量を解放するまで単独で実行できます。レーン別ログ、`summary.json`、`failures.json`、フェーズタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調べるには `pnpm test:docker:timings <summary.json>` を使い、安価な対象限定の再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使います。

### 主な Docker レーン

| コマンド                                                                     | 検証内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | raw CDP + 分離された Gateway を備えた Chromium ベースのソース E2E コンテナ。`browser doctor --deep` の CDP ロールスナップショットには、リンク URL、カーソルで昇格されたクリック可能要素、iframe 参照、フレームメタデータが含まれます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | `skills.install.allowUploadedArchives: false` のベア Docker ランナーにパック済み tarball をインストールし、ライブ ClawHub 検索から現在の skill slug を解決し、`openclaw skills install` でインストールし、`SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json`、`skills info --json` を検証します。                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | フォーカスされた CLI バックエンドのライブプローブ。Gemini には対応する `:resume` と `:mcp` のエイリアスがあります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pnpm test:docker:openwebui`                                                | Docker 化された OpenClaw + Open WebUI: サインインし、`/api/models` を確認し、`/api/chat/completions` 経由で実際にプロキシされたチャットを実行します。使用可能なライブモデルキーが必要で、外部イメージを取得します。unit/e2e スイートのように CI で安定することは想定されていません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | シード済み Gateway コンテナと、`openclaw mcp serve` を起動するクライアントコンテナ: ルーティングされた会話検出、トランスクリプト読み取り、添付ファイルメタデータ、ライブイベントキューの挙動、送信ルーティング、実際の stdio ブリッジ越しの Claude 形式のチャンネル + 権限通知（アサーションは raw stdio MCP フレームを直接読み取ります）。                                                                                                                                                                                                                                                                                                                                                                                                               |
| `pnpm test:docker:upgrade-survivor`                                         | 汚れた旧ユーザーフィクスチャの上にパック済み tarball をインストールし、ライブプロバイダー/チャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、loopback Gateway を開始し、エージェント/チャンネル設定/Plugin 許可リスト/ワークスペース/セッションファイル/古いレガシー Plugin 依存関係状態/起動/RPC ステータスが維持されることを確認します。                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:published-upgrade-survivor`                               | デフォルトでは `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みの `openclaw config set` レシピで設定し、パック済み tarball に更新し、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、`/healthz`、`/readyz`、RPC ステータスを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` でマトリクスを拡張し、または `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加できます（`configured-plugin-installs` と `stale-source-plugin-shadow` を含みます）。Package Acceptance はこれらを `published_upgrade_survivor_baseline(s)` / `_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` のようなメタトークンを解決します。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` シナリオの公開版アップグレードサバイバーハーネスで、デフォルトでは `openclaw@2026.4.23` から開始します。`Update Migration` ワークフローはこれを `baselines=all-since-2026.4.23` で拡張し、Full Release CI の外で configured-plugin 依存関係クリーンアップを証明します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:plugins`                                                  | ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリパッケージ、git moving refs、ClawHub フィクスチャ、マーケットプレイス更新、Claude バンドルの有効化/検査に対するインストール/更新 smoke。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## ローカル PR ゲート

ローカル PR の land/gate チェックでは、次を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が flaky になる場合は、回帰として扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリ制約のあるホスト向け:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## テストパフォーマンスツール

- `pnpm test:perf:imports`: Vitest のインポート所要時間 + インポート内訳レポートを有効にしつつ、明示的なファイル/ディレクトリターゲットにはスコープ付き lane ルーティングを引き続き使用します。`pnpm test:perf:imports:changed` は、同じプロファイリングを `origin/main` 以降に変更されたファイルにスコープします。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git diff について、ルーティングされた changed-mode パスをネイティブな root-project 実行と比較してベンチマークします。`pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリーの変更セットをベンチマークします。
- `pnpm test:perf:profile:main` は Vitest メインスレッドの CPU プロファイル（`.artifacts/vitest-main-profile`）を書き込みます。`pnpm test:perf:profile:runner` は unit runner の CPU + heap プロファイル（`.artifacts/vitest-runner-profile`）を書き込みます。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: すべての full-suite Vitest leaf config を直列に実行し、グループ化された所要時間データと config ごとの JSON/log アーティファクトを書き込みます。full-suite レポートはデフォルトでファイルを分離するため、以前のファイルから保持されたモジュールグラフや GC 停止は後続のアサーションに課金されません。shared-worker の蓄積を意図的にプロファイリングする場合にのみ `-- --no-isolate` を渡します。Test Performance Agent は、低速テスト修正を試みる前のベースラインとしてこれを使用します。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` は、パフォーマンスにフォーカスした変更後にグループ化レポートを比較します。
- full、extension、include-pattern shard の実行は、`.artifacts/vitest-shard-timings.json` のローカルタイミングデータを更新します。後続の whole-config 実行は、それらのタイミングを使用して低速 shard と高速 shard のバランスを取ります。include-pattern CI shard は shard 名をタイミングキーに追加するため、whole-config のタイミングデータを置き換えずに、フィルターされた shard のタイミングを可視化できます。ローカルタイミングアーティファクトを無視するには `OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。

## ベンチマーク

<Accordion title="モデルレイテンシ（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

任意の env: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。デフォルトプロンプト: 「Reply with a single word: ok. No punctuation or extra text.」

</Accordion>

<Accordion title="CLI 起動（scripts/bench-cli-startup.ts）">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

プリセット:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: 両方のプリセットを組み合わせたもの

出力には、コマンドごとの `sampleCount`、平均、p50、p95、最小/最大、終了コード/シグナル分布、最大 RSS が含まれます。`--cpu-prof-dir` / `--heap-prof-dir` は実行ごとに V8 プロファイルを書き込みます。

保存される出力: `pnpm test:startup:bench:smoke` は `.artifacts/cli-startup-bench-smoke.json` を書き込みます。`pnpm test:startup:bench:save` は `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）を書き込みます。チェックイン済みフィクスチャ: `test/fixtures/cli-startup-bench.json`。`pnpm test:startup:bench:update` で更新され、`pnpm test:startup:bench:check` で比較されます。

</Accordion>

<Accordion title="Gateway 起動 (scripts/bench-gateway-startup.ts)">

既定では、ビルド済み CLI エントリ `dist/entry.js` を使います。先に `pnpm build` を実行してください。代わりにソースランナーを測定するには `--entry scripts/run-node.mjs` を渡し、その結果はビルド済みエントリのベースラインとは分けて扱ってください。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ケース ID: `default`、`skipChannels`（チャネル起動をスキップ）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 個のマニフェスト Plugin）、`fiftyStartupLazyPlugins`（50 個の startup-lazy マニフェスト Plugin）。

出力には、最初のプロセス出力、`/healthz`、`/readyz`、HTTP listen ログ時刻、Gateway ready ログ時刻、CPU 時間、CPU コア比率、最大 RSS、ヒープ、起動トレースメトリクス、イベントループ遅延、Plugin ルックアップテーブルの詳細メトリクスが含まれます。このスクリプトは子 Gateway 環境で `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。

`/healthz` はライブネスです（HTTP サーバーが応答できます）。`/readyz` は利用可能なレディネスです（起動 Plugin サイドカー、チャネル、ready-critical な post-attach 作業が落ち着いています）。起動フックは非同期でディスパッチされ、レディネス保証には含まれません。Ready ログ時刻は Gateway の内部タイムスタンプで、プロセス側の原因特定には有用ですが、外部 `/readyz` プローブの代替にはなりません。

変更を比較するときは JSON 出力または `--output` を使ってください。`--cpu-prof-dir` は、トレース出力が import、compile、または CPU バウンドな作業を指し、フェーズタイミングだけでは説明できない場合にのみ使ってください。

</Accordion>

<Accordion title="Gateway 再起動 (scripts/bench-gateway-restart.ts)">

macOS と Linux のみです（プロセス内再起動に SIGUSR1 を使います。Windows では即座に失敗します）。上記の Gateway 起動と同じく、既定はビルド済みエントリで、`--entry scripts/run-node.mjs` による上書きも同じです。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ケース ID: `skipChannels`、`skipChannelsAcpxProbe`（ACPX 起動プローブ有効）、`skipChannelsNoAcpxProbe`（プローブ無効）、`default`、`fiftyPlugins`。

出力には、次の `/healthz`、次の `/readyz`、ダウンタイム、再起動 ready タイミング、CPU、RSS、置換プロセスの起動トレースメトリクス、シグナル処理、アクティブ作業の drain、close フェーズ、次回起動、ready タイミング、メモリスナップショットに関する再起動トレースメトリクスが含まれます。このスクリプトは `OPENCLAW_GATEWAY_STARTUP_TRACE=1` と `OPENCLAW_GATEWAY_RESTART_TRACE=1` を設定します。

変更が再起動シグナル、close ハンドラー、再起動後の起動、サイドカーのシャットダウン、サービスの引き継ぎ、または再起動後のレディネスに触れる場合は、このベンチマークを使ってください。チャネル起動から Gateway の仕組みを切り分けるには `skipChannels` から始めてください。狭いケースで再起動パスを説明できた後にのみ、`default` または Plugin が多いケースを使ってください。トレースメトリクスは原因特定のヒントであり、判定ではありません。再起動の変更は、複数サンプル、対応するオーナー範囲、`/healthz`/`/readyz` の挙動、ユーザーに見える再起動契約から判断してください。

</Accordion>

## オンボーディング E2E (Docker)

任意です。コンテナ化されたオンボーディングスモークテストにのみ必要です。クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

疑似 tty 経由で対話型ウィザードを操作し、config/workspace/session ファイルを検証してから、Gateway を起動して `openclaw health` を実行します。

## QR インポートスモーク (Docker)

保守されている QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（Node 24 既定、Node 22 互換）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [更新と Plugin のテスト](/ja-JP/help/testing-updates-plugins)
