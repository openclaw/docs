---
read_when:
    - テストの実行または修正
summary: テストをローカルで実行する方法（vitest）と、強制モード／カバレッジモードを使用するタイミング
title: テスト
x-i18n:
    generated_at: "2026-07-11T22:41:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）：[テスト](/ja-JP/help/testing)
- 更新とPluginパッケージの検証：[更新とPluginのテスト](/ja-JP/help/testing-updates-plugins)

## エージェントのデフォルト

エージェントセッションは、テストと計算負荷の高い検証をCrabbox経由でリモート実行します。信頼済みのメンテナーコードでは、デフォルトでBlacksmith Testboxを使用します。構成済みのTestboxワークフローは認証情報を注入するため、信頼されていないコントリビューターまたはフォークのコードでは、代わりにシークレットを使用しないフォークCIか、サニタイズされたAWS Crabboxへの直接接続を使用する必要があります。

信頼済みコードのタスクでテストや厳密な証明が必要になる可能性が高い場合は、バックグラウンドのコマンドセッションですぐに事前ウォームアップを開始し、環境の準備中も作業を続け、返された`tbx_...` IDを再利用し、実行ごとに現在のチェックアウトを同期して、引き渡し前に停止します。

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

最初の再利用が成功すると、ラッパーはリースのベース、依存関係、およびTestboxワークフローのフィンガープリントを`.crabbox/testbox-leases/`に記録します。ソースのみの編集では、ウォームアップ済みのボックスを引き続き再利用します。マージベース、ロックファイル、パッケージマネージャーの入力、ラッパー、またはTestboxワークフローが変更された場合は安全側に失敗し、新しいリースが必要になります。実行ごとに現在のチェックアウトは引き続き同期されます。
`OPENCLAW_TESTBOX_ALLOW_STALE=1`は意図的な診断専用であり、リリース証明には使用しません。

以下のローカルテストコマンドは、人間によるワークフロー、またはユーザーが明示的に要求したエージェントのフォールバック用です。リモートプロバイダーが利用できない場合は報告する必要があり、それを理由に広範なローカルゲートを暗黙的に実行してはなりません。

信頼されていないコードでは、`--provider aws`を使用して事前ウォームアップします。実行ごとに`CRABBOX_ENV_ALLOW=CI`を設定し、`--provider aws --no-hydrate`を渡し、依存関係のインストールやテストの実行前に新しい一時リモート`HOME`を使用する必要があります。その信頼されていないソース専用に新しくウォームアップしたリースを使用し、信頼済みまたは以前に認証情報を注入したリースを再利用してはなりません。クリーンで信頼済みの`main`チェックアウトからインストール済みの信頼済みCrabboxバイナリを起動し、`--fresh-pr`を使用してリモートPRのみを取得します。信頼されていないチェックアウトのラッパーや構成をローカルで実行してはなりません。
`CRABBOX_AWS_INSTANCE_PROFILE`を設定解除し、解決後の`aws.instanceProfile`が空でない限り安全側に失敗させます。インストールまたはテストの前に、信頼済みの絶対パス指定ツールを使用してIMDSv2トークンを必須とし、IAM認証情報エンドポイントが404を返すことを証明し、リモートの`git rev-parse HEAD`がレビュー済みPRの完全なhead SHAと一致することを検証します。リースをそのSHAに関連付け、headが変更された場合は停止して再ウォームアップします。クリーンな`main`から信頼済みの`scripts/crabbox-untrusted-bootstrap.sh`を`--fresh-pr`とともにアップロードします。このスクリプトは固定バージョンのNode/pnpmをインストールし、SHAとパッケージマネージャーの固定バージョンを検証し、`HOME`を分離し、依存関係をインストールしてから、要求されたテストを実行します。ブローカーがロール不在を証明できない場合、またはリモートPRが存在しない場合は、シークレットを使用しないフォークCIを使用します。`hydrate-github`、`--no-sync`、または認証情報を注入したTestboxワークフローを使用してはなりません。
すべての`CRABBOX_TAILSCALE*`オーバーライドを設定解除し、`--network public --tailscale=false`を強制し、出口Node/LANフラグをクリアして、スクリプトをアップロードする前に`crabbox inspect`がTailscale状態のないパブリックネットワークを報告することを必須とします。

## 通常のローカル実行順序

1. 変更範囲のVitest証明には`pnpm test:changed`。
2. 1つのファイル、ディレクトリ、または明示的なターゲットには`pnpm test <path-or-filter>`。
3. ローカルの完全なVitestスイートが意図的に必要な場合にのみ`pnpm test`。

Codexワークツリーまたはリンク済み／スパースチェックアウトでは、エージェントはローカルでの`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`の直接実行を避けます。

- ユーザーが明示的に要求した小さなファイル向けのローカルフォールバック：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 変更ゲートまたは広範な証明：`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`。これによりpnpmはTestbox内で実行されます。
- ラッパーの最終的な`exitCode`とタイミングJSONがコマンド結果です。Testboxがキープアライブアクションの外部から停止されるため、SSHコマンドが成功した後でも委任されたBlacksmith GitHub Actions実行が`cancelled`と表示されることがあります。失敗と判断する前に、ラッパーの概要とコマンド出力を確認してください。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：`pnpm check:changed`や対象を絞った`pnpm test ...`などのコマンドで、負荷の高いチェックの直列化をGit共通ディレクトリではなく現在のワークツリー内に限定します。リンクされた複数のワークツリーで独立したチェックを意図的に実行する場合に限り、高性能なローカルホストで使用してください。

## コアコマンド

テストラッパーの実行終了時には、短い`[test] passed|failed|skipped ... in ...`概要が表示されます。Vitest独自の所要時間行は、シャードごとの詳細としてそのまま表示されます。

| コマンド                                          | 動作                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明示的なファイル／ディレクトリターゲットは、範囲を限定したVitestレーンに振り分けられます。ターゲットなしの実行は完全なスイート証明です。固定シャードグループはローカル並列実行用の末端構成に展開され、開始前に想定されるシャードのファンアウトが表示されます。拡張機能グループは、1つの巨大なルートプロジェクトプロセスではなく、常に拡張機能ごとのシャード構成に展開されます。 |
| `pnpm test:changed`                               | 低コストでスマートな変更テスト実行：直接編集されたテスト、隣接する`*.test.ts`ファイル、明示的なソースマッピング、およびローカルインポートグラフから正確なターゲットを特定します。広範な変更、構成変更、パッケージ変更は、正確なテストに対応付けられない限りスキップされます。                                                                                 |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明示的な広範囲の変更テスト実行。テストハーネス、構成、またはパッケージの編集時にVitestのより広範な変更テスト動作へフォールバックする必要がある場合に使用します。                                                                                                                                                                                           |
| `pnpm test:force`                                 | 構成済みのOpenClaw Gatewayポート（デフォルトは`18789`）を解放してから、分離されたGatewayポートで完全なスイートを実行し、サーバーテストが実行中のインスタンスと競合しないようにします。                                                                                                                                                                      |
| `pnpm test:coverage`                              | デフォルトのユニットレーン（`vitest.unit.config.ts`）について、参考情報としてV8カバレッジレポートを出力します。カバレッジしきい値は適用されません。                                                                                                                                                                                                       |
| `pnpm test:coverage:changed`                      | `origin/main`以降に変更されたファイルのみのユニットカバレッジ。                                                                                                                                                                                                                                                                                        |
| `pnpm changed:lanes`                              | `origin/main`との差分によってトリガーされるアーキテクチャレーンを表示します。                                                                                                                                                                                                                                                                           |
| `pnpm check:changed`                              | CI外ではデフォルトでCrabbox/Testboxに委任し、リモート子プロセス内でスマートな変更チェックゲートを実行します。これには、影響を受けるレーンのフォーマット、型チェック、lint、ガードコマンドが含まれます。Vitestは実行しません。テスト証明には`pnpm test:changed`または`pnpm test <target>`を使用してください。                                              |

## 共有テスト状態とプロセスヘルパー

- `src/test-utils/openclaw-test-state.ts`：テストで分離された`HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、構成フィクスチャ、ワークスペース、エージェントディレクトリ、または認証プロファイルストアが必要な場合に、Vitestから使用します。
- `pnpm test:env-mutations:report`：`HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR`、または関連する環境キーを直接変更するテスト／ハーネスの非ブロッキングレポートです。共有テスト状態ヘルパーへの移行候補を見つけるために使用します。
- `test/helpers/openclaw-test-instance.ts`：実行中のGateway、CLI環境、ログ取得、クリーンアップを一元的に必要とするプロセスレベルのE2Eテスト向けです。
- `scripts/lib/docker-e2e-image.sh`を読み込むDocker/Bash E2Eレーンでは、`docker_e2e_test_state_shell_b64 <label> <scenario>`をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh`でデコードできます。複数のホームディレクトリを使用するスクリプトでは、`docker_e2e_test_state_function_b64`を渡し、各フローで`openclaw_test_state_create <label> <scenario>`を呼び出せます。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json`は、読み込み可能なホスト環境ファイルを書き込みます（`create`の前にある`--`により、新しいNodeランタイムが`--env-file`をNodeフラグとして扱うのを防ぎます）。Gatewayを起動するレーンでは、エントリポイントの解決、モックOpenAIの起動、フォアグラウンド／バックグラウンド起動、準備完了プローブ、状態環境のエクスポート、ログダンプ、プロセスのクリーンアップのために、`scripts/lib/openclaw-e2e-instance.sh`を読み込めます。

## Control UI、TUI、および拡張機能レーン

- **Control UI のモック E2E:** `pnpm test:ui:e2e` は、Vite Control UI を起動し、モックの Gateway WebSocket に対して実際の Chromium ページを操作する Vitest + Playwright レーンを実行します。テストは `ui/src/**/*.e2e.test.ts`、共有モックと制御は `ui/src/test-helpers/control-ui-e2e.ts` にあります。`pnpm test:e2e` にはこのレーンが含まれます。対象を絞った検証を含め、エージェント実行ではデフォルトで Testbox/Crabbox を使用します。`node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` は、明示的にローカルへフォールバックする場合にのみ使用してください。
- **TUI PTY テスト:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` は、高速な偽バックエンド PTY レーンを実行します。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` または `pnpm tui:pty:test:watch --mode local` は、外部モデルのエンドポイントだけをモックする、より低速な `tui --local` スモークテストを実行します。生の ANSI スナップショットではなく、安定した可視テキストまたはフィクスチャの呼び出しをアサートしてください。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての拡張機能/Plugin シャードを実行します。負荷の高いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、その他の Plugin グループはまとめて実行されます。`pnpm test extensions/<id>` は、バンドルされた単一の Plugin レーンを実行します。
- 同階層にテストがあるソースファイルは、より広いディレクトリ glob へフォールバックする前に、その同階層のテストへマッピングされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集では、依存関係のパスが明確な場合、すべてのシャードを広範に実行する代わりに、ローカルのインポートグラフを使用してインポート元のテストを実行します。
- コントラクトディレクトリを対象にすると、対応するコントラクトレーンへ展開されます。`pnpm test src/channels/plugins/contracts` は4つのチャンネルコントラクト設定を実行し、`pnpm test src/plugins/contracts` は Plugin コントラクト設定を実行します。これは、汎用の `channels`/`plugins` プロジェクトが `contracts/**` を除外しているためです。
- `auto-reply` は3つの専用設定（`core`、`top-level`、`reply`）に分割されているため、返信ハーネスがより軽量なトップレベルのステータス/トークン/ヘルパーテストを圧迫しません。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを経由し、ランタイム負荷の高いケースは既存のレーンに残ります。
- 基本の Vitest 設定は、`pool: "threads"` と `isolate: false` がデフォルトで、共有の非分離ランナーがリポジトリ全体の設定で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。

## Gateway と E2E

- Gateway 統合はオプトインです: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway`。
- `pnpm test:e2e`: リポジトリの E2E 集約 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`: Gateway のエンドツーエンドスモークテスト（複数インスタンスの WS/HTTP/Node ペアリング）。`vitest.e2e.config.ts` では、適応型ワーカーを使用する `threads` + `isolate: false` がデフォルトです。`OPENCLAW_E2E_WORKERS=<n>` で調整し、`OPENCLAW_E2E_VERBOSE=1` で詳細ログを有効にできます。
- `pnpm test:live`: プロバイダーのライブテスト（Claude/Minimax/DeepSeek/z.ai など、`*.live.test.ts` により制御）。スキップを解除するには API キーと `LIVE=1`（または `OPENCLAW_LIVE_TEST=1`）が必要です。`OPENCLAW_LIVE_TEST_QUIET=0` で詳細出力を有効にできます。

## 完全な Docker スイート（`pnpm test:docker:all`）

共有ライブテストイメージをビルドし、OpenClaw を npm tarball として一度だけパッケージ化し、最小構成の Node/Git ランナーイメージと、その tarball を `/app` にインストールする機能イメージをビルドまたは再利用した後、重み付きスケジューラーを通じて Docker スモークレーンを実行します。`scripts/package-openclaw-for-docker.mjs` はローカル/CI 共通の唯一のパッケージ作成処理であり、Docker が使用する前に tarball と `dist/postinstall-inventory.json` を検証します。

- 最小構成イメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）: インストーラー/更新/Plugin 依存関係レーン。コピーしたリポジトリソースの代わりに、事前ビルド済みの tarball をマウントします。
- 機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）: 通常のビルド済みアプリ機能レーン。
- レーン定義: `scripts/lib/docker-e2e-scenarios.mjs`。プランナー: `scripts/lib/docker-e2e-plan.mjs`。実行処理: `scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、スケジューラーが管理する CI プラン（レーン、イメージ種別、パッケージ/ライブイメージの要否、状態シナリオ、認証情報チェック）を出力します。

スケジューリング調整項目（環境変数、括弧内はデフォルト値）:

| 環境変数                                                                                                        | デフォルト          | 目的                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | プロセススロット数。                                                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | プロバイダー依存の末尾プール。                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 負荷の高いライブプロバイダーレーンの上限。                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm リソースレーンの上限。                                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | サービスリソースレーンの上限。                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | プロバイダーごとの高負荷レーンの上限。                                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | より厳しいプロバイダーごとの上限。                                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | より大規模なホスト向けの上書き。                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | レーン開始間の遅延。ローカルの Docker デーモンで作成処理が集中するのを防ぎます。                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000（120分）  | レーンごとのフォールバックタイムアウト。選択されたライブ/末尾レーンには、より厳しい上限が適用されます。                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 一時的なライブプロバイダー障害に対する再試行回数。                                                                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | オフ                | Docker を実行せずにレーンマニフェストを出力します。                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | アクティブなレーンのステータス出力間隔。                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | オン                | 最長優先の順序付けに `.artifacts/docker-tests/lane-timings.json` を再利用します。無効にするには `0` に設定します。                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | 決定論的/ローカルレーンのみの場合は `skip`、ライブプロバイダーレーンのみの場合は `only`。エイリアス: `pnpm test:docker:local:all`、`pnpm test:docker:live:all`。ライブのみのモードでは、メインと末尾のライブレーンを最長優先の単一プールに統合し、プロバイダーバケットが Claude/Codex/Gemini の処理をまとめて割り当てられるようにします。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI バックエンドの Docker セットアップタイムアウト。                                                                                                                                                                                                                                                                                                   |

リソース上限用の環境変数パターンは `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` です（リソース名を大文字にし、英数字以外を `_` にまとめます）。

その他の動作: ランナーはデフォルトで Docker を事前確認し、古い OpenClaw E2E コンテナをクリーンアップし、互換性のあるレーン間でプロバイダー CLI ツールのキャッシュを共有します。また、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の失敗後は新しいプール対象レーンのスケジューリングを停止します。並列度の低いホストで、あるレーンが実効的な重み/リソース上限を超える場合でも、空のプールから開始し、容量を解放するまで単独で実行できます。レーンごとのログ、`summary.json`、`failures.json`、およびフェーズの所要時間は `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。低速なレーンを調査するには `pnpm test:docker:timings <summary.json>` を使用し、低コストで対象を絞った再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。

### 主な Docker レーン

| コマンド                                                                    | 検証内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Chromium ベースのソース E2E コンテナと、生の CDP + 分離された Gateway。`browser doctor --deep` の CDP ロールスナップショットに、リンク URL、カーソルによってクリック可能に昇格した要素、iframe 参照、フレームメタデータが含まれることを検証します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:skill-install`                                            | `skills.install.allowUploadedArchives: false` を設定した最小構成の Docker ランナーにパック済み tarball をインストールし、ClawHub のライブ検索から現在のスキルスラッグを解決し、`openclaw skills install` でインストールして、`SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json`、および `skills info --json` を検証します。                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | CLI バックエンドに焦点を当てたライブプローブ。Gemini にも対応する `:resume` および `:mcp` エイリアスがあります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:openwebui`                                                | Docker 化された OpenClaw + Open WebUI: サインインし、`/api/models` を確認し、`/api/chat/completions` を通じて実際のプロキシチャットを実行します。使用可能なライブモデルキーが必要で、外部イメージを取得します。ユニット/E2E スイートのような CI 安定性は想定されていません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:docker:mcp-channels`                                             | シード済みの Gateway コンテナと、`openclaw mcp serve` を起動するクライアントコンテナ: ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルのメタデータ、ライブイベントキューの動作、外向き送信のルーティング、および実際の stdio ブリッジを介した Claude 形式のチャンネル通知と権限通知を検証します（アサーションは生の stdio MCP フレームを直接読み取ります）。                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:docker:upgrade-survivor`                                         | 使用済みの旧ユーザーフィクスチャにパック済み tarball を上書きインストールし、ライブのプロバイダー/チャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、loopback Gateway を起動して、エージェント/チャンネル設定、Plugin 許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin 依存関係の状態、起動、RPC ステータスが維持されることを確認します。                                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:published-upgrade-survivor`                               | デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みの `openclaw config set` レシピで設定し、パック済み tarball に更新して、非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、`/healthz`、`/readyz`、RPC ステータスを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` でマトリクスを拡張するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加できます（`configured-plugin-installs` と `stale-source-plugin-shadow` を含みます）。Package Acceptance では、これらを `published_upgrade_survivor_baseline(s)` / `_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` などのメタトークンを解決します。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` シナリオの公開済みアップグレード維持ハーネスで、デフォルトでは `openclaw@2026.4.23` から開始します。`Update Migration` ワークフローは、`baselines=all-since-2026.4.23` を使用してこれを拡張し、Full Release CI の外部で設定済み Plugin の依存関係クリーンアップを実証します。                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:docker:plugins`                                                  | ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリパッケージ、移動する git 参照、ClawHub フィクスチャ、マーケットプレイスの更新、および Claude バンドルの有効化/検査に対するインストール/更新スモークテストです。                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

## ローカル PR ゲート

ローカルで PR のランディング/ゲートチェックを行うには、以下を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定に失敗した場合は、回帰として扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリに制約のあるホストでは、以下を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## テスト性能ツール

- `pnpm test:perf:imports`: Vitest のインポート所要時間とインポート内訳のレポートを有効にしつつ、明示的なファイル／ディレクトリ対象にはスコープ付きレーンルーティングを引き続き使用します。`pnpm test:perf:imports:changed` は、同じプロファイリングを `origin/main` 以降に変更されたファイルに限定します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git 差分について、ルーティングされた変更モードのパスをネイティブのルートプロジェクト実行と比較してベンチマークします。`pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリーの変更セットをベンチマークします。
- `pnpm test:perf:profile:main` は Vitest メインスレッドの CPU プロファイルを出力します（`.artifacts/vitest-main-profile`）。`pnpm test:perf:profile:runner` はユニットランナーの CPU およびヒーププロファイルを出力します（`.artifacts/vitest-runner-profile`）。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: フルスイートの各 Vitest リーフ設定を直列実行し、グループ化された所要時間データと設定ごとの JSON／ログアーティファクトを出力します。フルスイートレポートはデフォルトでファイルを分離するため、以前のファイルで保持されたモジュールグラフや GC の一時停止時間が後続のアサーションに加算されません。共有ワーカーでの蓄積を意図的にプロファイリングする場合にのみ、`-- --no-isolate` を渡してください。Test Performance Agent は、低速テストの修正を試みる前のベースラインとしてこれを使用します。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` は、パフォーマンス重視の変更後にグループ化レポートを比較します。
- フル実行、Plugin、include パターンの各シャード実行は、`.artifacts/vitest-shard-timings.json` のローカルタイミングデータを更新します。その後の設定全体の実行では、そのタイミングを使用して低速シャードと高速シャードのバランスを取ります。include パターンの CI シャードはタイミングキーにシャード名を追加するため、設定全体のタイミングデータを置き換えずに、フィルタリングされたシャードのタイミングを確認できます。ローカルのタイミングアーティファクトを無視するには、`OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。

## ベンチマーク

<Accordion title="モデルのレイテンシー（scripts/bench-model.ts）">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

任意の環境変数: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。デフォルトのプロンプト: 「単語を1つだけ返してください: ok。句読点や追加のテキストは不要です。」

</Accordion>

<Accordion title="CLI の起動（scripts/bench-cli-startup.ts）">

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

- `startup`: `--version`、`--help`、`health`、`health --json`、`status --json`、`status`
- `real`: `health`、`status`、`status --json`、`sessions`、`sessions --json`、`tasks --json`、`tasks list --json`、`tasks audit --json`、`agents list --json`、`gateway status`、`gateway status --json`、`gateway health --json`、`config get gateway.port`
- `all`: 両方のプリセットを組み合わせたもの

出力には、コマンドごとの `sampleCount`、平均値、p50、p95、最小値／最大値、終了コード／シグナルの分布、最大 RSS が含まれます。`--cpu-prof-dir`／`--heap-prof-dir` は、実行ごとに V8 プロファイルを出力します。

保存される出力: `pnpm test:startup:bench:smoke` は `.artifacts/cli-startup-bench-smoke.json` を出力し、`pnpm test:startup:bench:save` は `.artifacts/cli-startup-bench-all.json`（`runs=5 warmup=1`）を出力します。リポジトリに保存されているフィクスチャは `test/fixtures/cli-startup-bench.json` で、`pnpm test:startup:bench:update` によって更新され、`pnpm test:startup:bench:check` によって比較されます。

</Accordion>

<Accordion title="Gateway の起動（scripts/bench-gateway-startup.ts）">

デフォルトでは、`dist/entry.js` にあるビルド済み CLI エントリを使用します。先に `pnpm build` を実行してください。代わりにソースランナーを測定するには `--entry scripts/run-node.mjs` を渡し、その結果はビルド済みエントリのベースラインとは分けて扱ってください。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ケース ID: `default`、`skipChannels`（チャンネルの起動をスキップ）、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins`（50 個のマニフェスト Plugin）、`fiftyStartupLazyPlugins`（起動時に遅延読み込みされる50個のマニフェスト Plugin）。

出力には、最初のプロセス出力、`/healthz`、`/readyz`、HTTP リッスンログの時刻、Gateway 準備完了ログの時刻、CPU 時間、CPU コア比率、最大 RSS、ヒープ、起動トレース指標、イベントループ遅延、Plugin ルックアップテーブルの詳細指標が含まれます。スクリプトは、子 Gateway の環境に `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。

`/healthz` は生存性を示します（HTTP サーバーが応答可能）。`/readyz` は利用可能な準備完了状態を示します（起動時の Plugin サイドカー、チャンネル、アタッチ後の準備完了に必須の処理が収束済み）。起動フックは非同期でディスパッチされ、準備完了保証には含まれません。準備完了ログの時刻は Gateway 内部のタイムスタンプであり、プロセス側の要因分析には役立ちますが、外部の `/readyz` プローブの代わりにはなりません。

変更を比較する場合は、JSON 出力または `--output` を使用してください。`--cpu-prof-dir` は、トレース出力によって、フェーズのタイミングだけでは説明できないインポート、コンパイル、または CPU バウンドな処理が示された場合にのみ使用してください。

</Accordion>

<Accordion title="Gateway の再起動（scripts/bench-gateway-restart.ts）">

macOS と Linux のみ対応しています（プロセス内再起動に SIGUSR1 を使用するため、Windows では即座に失敗します）。デフォルトで使用するビルド済みエントリと `--entry scripts/run-node.mjs` による上書きは、前述の Gateway 起動と同じです。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ケース ID: `skipChannels`、`skipChannelsAcpxProbe`（ACPX 起動プローブがオン）、`skipChannelsNoAcpxProbe`（プローブがオフ）、`default`、`fiftyPlugins`。

出力には、次の `/healthz`、次の `/readyz`、ダウンタイム、再起動後の準備完了タイミング、CPU、RSS、置換プロセスの起動トレース指標、およびシグナル処理、実行中処理の完了待ち、クローズフェーズ、次回起動、準備完了タイミング、メモリスナップショットに関する再起動トレース指標が含まれます。スクリプトは `OPENCLAW_GATEWAY_STARTUP_TRACE=1` と `OPENCLAW_GATEWAY_RESTART_TRACE=1` を設定します。

再起動シグナル、クローズハンドラー、再起動後の起動、サイドカーのシャットダウン、サービスの引き継ぎ、または再起動後の準備完了状態に変更が及ぶ場合は、このベンチマークを使用してください。チャンネルの起動から Gateway の仕組みを切り分けるため、まず `skipChannels` から始めてください。`default` または Plugin の多いケースは、限定的なケースで再起動パスを説明できた後にのみ使用してください。トレース指標は要因分析の手がかりであり、判定そのものではありません。再起動の変更は、複数のサンプル、対応する所有者のスパン、`/healthz`／`/readyz` の動作、およびユーザーに見える再起動契約に基づいて判断してください。

</Accordion>

## オンボーディング E2E（Docker）

任意です。コンテナ化されたオンボーディングのスモークテストにのみ必要です。クリーンな Linux コンテナで完全なコールドスタートフローを実行します。

```bash
scripts/e2e/onboard-docker.sh
```

疑似 TTY 経由で対話型ウィザードを操作し、設定／ワークスペース／セッションファイルを検証した後、Gateway を起動して `openclaw health` を実行します。

## QR インポートのスモークテスト（Docker）

メンテナンス対象の QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム（デフォルトは Node 24、Node 22 も互換）で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連項目

- [テスト](/ja-JP/help/testing)
- [ライブ環境でのテスト](/ja-JP/help/testing-live)
- [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)
