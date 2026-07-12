---
read_when:
    - テストの実行または修正
summary: ローカルでテスト（vitest）を実行する方法と、force/coverage モードを使用するタイミング
title: テスト
x-i18n:
    generated_at: "2026-07-12T14:49:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- 完全なテストキット（スイート、ライブ、Docker）：[テスト](/ja-JP/help/testing)
- アップデートとPluginパッケージの検証：[アップデートとPluginのテスト](/ja-JP/help/testing-updates-plugins)

## エージェントのデフォルト

エージェントセッションは、テストと計算負荷の高い検証をCrabbox経由でリモート実行します。信頼済みのメンテナーコードでは、デフォルトでBlacksmith Testboxを使用します。設定済みのTestboxワークフローは認証情報を注入するため、信頼されていないコントリビューターまたはフォークのコードでは、代わりにシークレットを使用しないフォークCIか、サニタイズされたAWS Crabboxへの直接接続を使用する必要があります。

信頼済みコードのタスクでテストや負荷の高い証明が必要になりそうな場合は、バックグラウンドのコマンドセッションですぐに事前ウォームアップし、準備中も作業を続け、返された`tbx_...` IDを再利用し、実行するたびに現在のチェックアウトを同期して、引き渡し前に停止します。

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

最初に正常に再利用された後、ラッパーはリースのベース、依存関係、およびTestboxワークフローのフィンガープリントを`.crabbox/testbox-leases/`配下に記録します。ソースのみの編集では、ウォームアップ済みのボックスを引き続き再利用します。マージベース、ロックファイル、パッケージマネージャーの入力、ラッパー、またはTestboxワークフローが変更されると、安全側に失敗して新しいリースが必要になります。それでも、実行するたびに現在のチェックアウトを同期します。
`OPENCLAW_TESTBOX_ALLOW_STALE=1`は意図的な診断専用であり、リリースの証明には使用しません。

以下のローカルテストコマンドは、人間のワークフロー、またはユーザーが明示的に要求したエージェントのフォールバック向けです。リモートプロバイダーを利用できない場合は、その旨を報告する必要があります。これは、広範なローカルゲートを黙って実行してよいという許可ではありません。

信頼されていないコードでは、`--provider aws`を使用して事前ウォームアップします。実行するたびに`CRABBOX_ENV_ALLOW=CI`を設定し、`--provider aws --no-hydrate`を渡し、依存関係のインストールやテストの実行前に、新しい一時的なリモート`HOME`を使用する必要があります。その信頼されていないソース専用に新しくウォームアップしたリースを使用し、信頼済みまたは以前に認証情報を注入したリースは決して再利用しないでください。クリーンで信頼済みの`main`チェックアウトから、インストール済みの信頼できるCrabboxバイナリを起動し、`--fresh-pr`でリモートPRのみを取得します。信頼されていないチェックアウトのラッパーや設定をローカルで実行してはいけません。
`CRABBOX_AWS_INSTANCE_PROFILE`を設定解除し、解決済みの`aws.instanceProfile`が空でない限り、安全側に失敗させます。インストールやテストの前に、信頼済みの絶対パスのツールを使用してIMDSv2トークンを必須とし、IAM認証情報エンドポイントが404を返すことを証明し、リモートの`git rev-parse HEAD`がレビュー済みPRの完全なhead SHAと一致することを確認します。リースをそのSHAに紐付け、headが変更されたら停止して再ウォームアップします。クリーンな`main`から信頼済みの`scripts/crabbox-untrusted-bootstrap.sh`を`--fresh-pr`とともにアップロードします。このスクリプトは、固定バージョンのNode/pnpmをインストールし、SHAとパッケージマネージャーのバージョン固定を検証し、`HOME`を分離し、依存関係をインストールしてから、要求されたテストを実行します。ブローカーがロールなしであることを証明できない場合、またはリモートPRが存在しない場合は、シークレットを使用しないフォークCIを使用します。`hydrate-github`、`--no-sync`、または認証情報が注入されたTestboxワークフローを使用してはいけません。
すべての`CRABBOX_TAILSCALE*`オーバーライドを設定解除し、`--network public
--tailscale=false`を強制し、exit-node/LANフラグをクリアして、スクリプトをアップロードする前に`crabbox inspect`がTailscale状態なしのパブリックネットワークを報告することを必須とします。

## 通常のローカル実行順序

1. 変更範囲の Vitest 検証には `pnpm test:changed`。
2. 単一のファイル、ディレクトリ、または明示的な対象には `pnpm test <path-or-filter>`。
3. ローカルの Vitest スイート全体が意図的に必要な場合にのみ `pnpm test`。

Codex ワークツリーまたはリンク／スパースチェックアウトでは、エージェントはローカルでの
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` の直接実行を避けます。

- ユーザーが明示的に要求した小さなファイル向けのローカルフォールバック：
  `node scripts/run-vitest.mjs <path-or-filter>`。
- 変更ゲートまたは広範な検証：pnpm が Testbox 内で実行されるように、`node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`。
- ラッパーが最後に出力する `exitCode` とタイミング JSON がコマンドの結果です。委任された Blacksmith GitHub Actions の実行では、SSH コマンドが成功した後でも、キープアライブアクションの外部から Testbox が停止されるため `cancelled` と表示されることがあります。失敗と判断する前に、ラッパーのサマリーとコマンド出力を確認してください。
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`：`pnpm check:changed` や対象を指定した `pnpm test ...` などのコマンドで、負荷の高いチェックの直列化を Git 共通ディレクトリではなく現在のワークツリー内に限定します。リンクされた複数のワークツリーで独立したチェックを意図的に実行する場合に限り、高性能なローカルホストで使用してください。

## コアコマンド

テストラッパーの実行は、短い `[test] passed|failed|skipped ... in ...` サマリーで終了します。Vitest 自体の所要時間行は、シャードごとの詳細として維持されます。

| コマンド                                          | 動作                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | 明示的なファイル／ディレクトリ対象は、スコープ付きの Vitest レーンを通じて実行されます。対象を指定しない実行はスイート全体の検証になります。固定シャードグループはローカル並列実行用のリーフ設定に展開され、開始前に想定されるシャードのファンアウトが出力されます。拡張機能グループは、巨大な単一のルートプロジェクトプロセスではなく、常に拡張機能ごとのシャード設定に展開されます。 |
| `pnpm test:changed`                               | 低コストでスマートな変更テスト実行：テストの直接編集、同階層の `*.test.ts` ファイル、明示的なソースマッピング、ローカルのインポートグラフから正確な対象を特定します。広範な変更、設定変更、パッケージ変更は、正確なテストにマッピングされない限りスキップされます。                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | 明示的な広範囲の変更テスト実行です。テストハーネス、設定、またはパッケージの編集時に、Vitest のより広範な変更テスト動作へフォールバックさせる必要がある場合に使用します。                                                                                                                                                                                  |
| `pnpm test:force`                                 | 設定された OpenClaw Gateway ポート（デフォルトは `18789`）を解放してから、隔離された Gateway ポートでスイート全体を実行し、サーバーテストが実行中のインスタンスと競合しないようにします。                                                                                                                                                                  |
| `pnpm test:coverage`                              | デフォルトのユニットレーン（`vitest.unit.config.ts`）について、参考情報として V8 カバレッジレポートを出力します。カバレッジしきい値は適用されません。                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | `origin/main` 以降に変更されたファイルのみを対象とするユニットカバレッジです。                                                                                                                                                                                                                                                                         |
| `pnpm changed:lanes`                              | `origin/main` との差分によってトリガーされるアーキテクチャレーンを表示します。                                                                                                                                                                                                                                                                        |
| `pnpm check:changed`                              | CI 外ではデフォルトで Crabbox/Testbox に委任し、リモート子プロセス内でスマートな変更チェックゲートを実行します。対象レーンのフォーマットに加え、型チェック、lint、ガードコマンドを実行します。Vitest は実行しません。テストの検証には `pnpm test:changed` または `pnpm test <target>` を使用してください。                                                                      |

## 共有テスト状態とプロセスヘルパー

- `src/test-utils/openclaw-test-state.ts`：テストで隔離された `HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、設定フィクスチャ、ワークスペース、エージェントディレクトリ、または認証プロファイルストアが必要な場合に、Vitest から使用します。
- `pnpm test:env-mutations:report`：`HOME`、`OPENCLAW_STATE_DIR`、`OPENCLAW_CONFIG_PATH`、`OPENCLAW_WORKSPACE_DIR`、または関連する環境変数キーを直接変更するテスト／ハーネスについて、ブロックしないレポートを生成します。共有テスト状態ヘルパーへの移行候補を見つけるために使用します。
- `test/helpers/openclaw-test-instance.ts`：実行中の Gateway、CLI 環境、ログ収集、クリーンアップを一か所で必要とするプロセスレベルの E2E テスト向けです。
- `scripts/lib/docker-e2e-image.sh` を読み込む Docker/Bash E2E レーンでは、`docker_e2e_test_state_shell_b64 <label> <scenario>` をコンテナに渡し、`scripts/lib/openclaw-e2e-instance.sh` でデコードできます。複数のホームディレクトリを使用するスクリプトでは、`docker_e2e_test_state_function_b64` を渡し、各フローで `openclaw_test_state_create <label> <scenario>` を呼び出せます。`node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` は、ホストで source 可能な環境ファイルを書き込みます（`create` の前の `--` により、新しい Node ランタイムが `--env-file` を Node フラグとして扱うのを防ぎます）。Gateway を起動するレーンでは、エントリポイントの解決、モック OpenAI の起動、フォアグラウンド／バックグラウンド起動、準備完了プローブ、状態環境変数のエクスポート、ログダンプ、プロセスのクリーンアップのために `scripts/lib/openclaw-e2e-instance.sh` を読み込めます。

## Control UI、TUI、拡張機能レーン

- **Control UI のモック E2E:** `pnpm test:ui:e2e` は、Vite Control UI を起動し、モック化された Gateway WebSocket に対して実際の Chromium ページを操作する Vitest + Playwright レーンを実行します。テストは `ui/src/**/*.e2e.test.ts` にあり、共有モックとコントロールは `ui/src/test-helpers/control-ui-e2e.ts` にあります。`pnpm test:e2e` にはこのレーンが含まれます。対象を絞った検証を含め、エージェント実行ではデフォルトで Testbox/Crabbox を使用します。明示的にローカルへフォールバックする場合に限り、`node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` を使用してください。
- **TUI PTY テスト:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` は、高速な偽バックエンド PTY レーンを実行します。`OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` または `pnpm tui:pty:test:watch --mode local` は、外部モデルのエンドポイントのみをモックする、より低速な `tui --local` スモークテストを実行します。生の ANSI スナップショットではなく、安定して表示されるテキストまたはフィクスチャ呼び出しをアサートしてください。
- `pnpm test:extensions` と `pnpm test extensions` は、すべての拡張機能/Plugin シャードを実行します。負荷の高いチャンネル Plugin、ブラウザー Plugin、OpenAI は専用シャードとして実行され、その他の Plugin グループはバッチ処理のままです。`pnpm test extensions/<id>` は、バンドルされた単一の Plugin レーンを実行します。
- 兄弟テストがあるソースファイルは、より広いディレクトリ glob にフォールバックする前に、その兄弟テストへマッピングされます。`src/channels/plugins/contracts/test-helpers`、`src/plugin-sdk/test-helpers`、`src/plugins/contracts` 配下のヘルパー編集では、依存関係パスが正確な場合、すべてのシャードを広範に実行する代わりに、ローカルのインポートグラフを使用してインポート元のテストを実行します。
- コントラクトディレクトリのターゲットは、それぞれのコントラクトレーンへ展開されます。汎用の `channels`/`plugins` プロジェクトは `contracts/**` を除外するため、`pnpm test src/channels/plugins/contracts` は 4 つのチャンネルコントラクト設定を実行し、`pnpm test src/plugins/contracts` は Plugin コントラクト設定を実行します。
- `auto-reply` は 3 つの専用設定（`core`、`top-level`、`reply`）に分割されているため、返信ハーネスが、より軽量なトップレベルのステータス/トークン/ヘルパーテストを圧迫することはありません。
- 選択された `plugin-sdk` と `commands` のテストファイルは、`test/setup.ts` のみを保持する専用の軽量レーンを経由し、ランタイム負荷の高いケースは既存のレーンに残ります。
- ベースの Vitest 設定はデフォルトで `pool: "threads"` と `isolate: false` を使用し、共有の非分離ランナーがリポジトリ全体の設定で有効になっています。
- `pnpm test:channels` は `vitest.channels.config.ts` を実行します。

## Gateway と E2E

- Gateway 統合はオプトインです: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` または `pnpm test:gateway`。
- `pnpm test:e2e`: リポジトリの E2E 集約 = `pnpm test:e2e:gateway && pnpm test:ui:e2e`。
- `pnpm test:e2e:gateway`: Gateway のエンドツーエンドスモークテスト（複数インスタンスの WS/HTTP/Node ペアリング）。`vitest.e2e.config.ts` では、適応型ワーカーを使用する `threads` + `isolate: false` がデフォルトです。`OPENCLAW_E2E_WORKERS=<n>` で調整し、`OPENCLAW_E2E_VERBOSE=1` で詳細ログを有効にします。
- `pnpm test:live`: プロバイダーのライブテスト（Claude/Minimax/DeepSeek/z.ai など。`*.live.test.ts` により制御）。スキップを解除するには API キーと `LIVE=1`（または `OPENCLAW_LIVE_TEST=1`）が必要です。`OPENCLAW_LIVE_TEST_QUIET=0` で詳細出力を有効にします。

## 完全な Docker スイート（`pnpm test:docker:all`）

共有ライブテストイメージをビルドし、OpenClaw を npm tarball として一度だけパックし、その tarball を `/app` にインストールする最小構成の Node/Git ランナーイメージと機能イメージをビルドまたは再利用してから、重み付きスケジューラーを通じて Docker スモークレーンを実行します。`scripts/package-openclaw-for-docker.mjs` はローカル/CI で使用する唯一のパッケージパッカーであり、Docker が使用する前に tarball と `dist/postinstall-inventory.json` を検証します。

- 最小構成イメージ（`OPENCLAW_DOCKER_E2E_BARE_IMAGE`）: インストーラー/更新/Plugin 依存関係レーン。コピーされたリポジトリソースの代わりに、事前ビルド済み tarball をマウントします。
- 機能イメージ（`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`）: 通常のビルド済みアプリ機能レーン。
- レーン定義: `scripts/lib/docker-e2e-scenarios.mjs`。プランナー: `scripts/lib/docker-e2e-plan.mjs`。エグゼキューター: `scripts/test-docker-all.mjs`。
- `node scripts/test-docker-all.mjs --plan-json` は、Docker をビルドまたは実行せずに、スケジューラーが管理する CI プラン（レーン、イメージ種別、パッケージ/ライブイメージの要否、状態シナリオ、認証情報チェック）を出力します。

スケジューリング調整項目（環境変数、括弧内はデフォルト値）:

| 環境変数                                                                                                        | デフォルト          | 用途                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | プロセススロット。                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | プロバイダー依存のテールプール。                                                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | 負荷の高いライブプロバイダーレーンの上限。                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | npm リソースレーンの上限。                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | サービスリソースレーンの上限。                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | プロバイダーごとの高負荷レーン上限。                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | プロバイダーごとの、より狭い上限。                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | より大規模なホスト向けのオーバーライド。                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | レーン開始間の遅延。ローカル Docker デーモンで作成処理が集中することを回避します。                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | レーンごとのフォールバックタイムアウト。選択されたライブ/テールレーンでは、より厳しい上限を使用します。                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | 一時的なライブプロバイダー障害に対する再試行回数。                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Docker を実行せずにレーンマニフェストを出力します。                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | アクティブレーンのステータス出力間隔。                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | 最長優先の順序付けに `.artifacts/docker-tests/lane-timings.json` を再利用します。無効にするには `0` に設定します。                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | 決定論的/ローカルレーンのみの場合は `skip`、ライブプロバイダーレーンのみの場合は `only`。エイリアス: `pnpm test:docker:local:all`、`pnpm test:docker:live:all`。ライブのみのモードでは、メインとテールのライブレーンを 1 つの最長優先プールに統合し、プロバイダーバケットが Claude/Codex/Gemini の処理をまとめて配置できるようにします。 |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | CLI バックエンドの Docker セットアップタイムアウト。                                                                                                                                                                                                                                       |

リソース上限の環境変数パターンは `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT`（リソース名を大文字にし、英数字以外を `_` にまとめる）です。

その他の動作: runner はデフォルトで Docker の事前チェックを行い、古い OpenClaw E2E コンテナを削除し、互換性のあるレーン間でプロバイダー CLI ツールのキャッシュを共有します。また、`OPENCLAW_DOCKER_ALL_FAIL_FAST=0` が設定されていない限り、最初の失敗後は新しいプール済みレーンのスケジューリングを停止します。並列度の低いホストで、あるレーンが有効な重み/リソース上限を超える場合でも、空のプールから起動し、容量を解放するまで単独で実行できます。レーンごとのログ、`summary.json`、`failures.json`、およびフェーズのタイミングは `.artifacts/docker-tests/<run-id>/` 配下に書き込まれます。遅いレーンを調査するには `pnpm test:docker:timings <summary.json>` を使用し、低コストで対象を絞った再実行コマンドを出力するには `pnpm test:docker:rerun <run-id|summary.json|failures.json>` を使用します。

### 主な Docker レーン

| コマンド                                                                    | 検証内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Chromium を利用するソース E2E コンテナと raw CDP + 分離された Gateway。`browser doctor --deep` の CDP ロールスナップショットには、リンク URL、カーソルによってクリック可能に昇格した要素、iframe 参照、およびフレームメタデータが含まれます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:skill-install`                                            | `skills.install.allowUploadedArchives: false` を設定した最小構成の Docker runner にパック済み tarball をインストールし、ClawHub のライブ検索から現在有効な skill slug を解決して、`openclaw skills install` でインストールします。その後、`SKILL.md`、`.clawhub/origin.json`、`.clawhub/lock.json`、および `skills info --json` を検証します。                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | 対象を絞った CLI バックエンドのライブプローブ。Gemini にも対応する `:resume` および `:mcp` エイリアスがあります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `pnpm test:docker:openwebui`                                                | Docker 化された OpenClaw + Open WebUI: サインインし、`/api/models` を確認して、`/api/chat/completions` 経由で実際にプロキシされたチャットを実行します。利用可能なライブモデルキーが必要で、外部イメージを pull します。単体/E2E スイートのような CI 安定性は想定されていません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:mcp-channels`                                             | シード済み Gateway コンテナと、`openclaw mcp serve` を起動するクライアントコンテナ: ルーティングされた会話の検出、トランスクリプトの読み取り、添付ファイルのメタデータ、ライブイベントキューの動作、送信ルーティング、および実際の stdio ブリッジ経由の Claude 形式のチャンネル通知と権限通知を検証します（アサーションは raw stdio MCP フレームを直接読み取ります）。                                                                                                                                                                                                                                                                                                                                                                                  |
| `pnpm test:docker:upgrade-survivor`                                         | 使用済み状態の古いユーザーフィクスチャにパック済み tarball を上書きインストールし、ライブのプロバイダー/チャンネルキーなしでパッケージ更新と非対話型 doctor を実行し、loopback Gateway を起動します。その後、エージェント/チャンネル設定、Plugin の許可リスト、ワークスペース/セッションファイル、古いレガシー Plugin の依存関係状態、起動、および RPC ステータスが維持されることを確認します。                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:published-upgrade-survivor`                               | デフォルトで `openclaw@latest` をインストールし、現実的な既存ユーザーファイルをシードし、組み込みの `openclaw config set` レシピで設定してから、パック済み tarball に更新します。非対話型 doctor を実行し、`.artifacts/upgrade-survivor/summary.json` を書き込み、`/healthz`、`/readyz`、RPC ステータスを確認します。`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` で上書きし、`OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` でマトリクスを拡張するか、`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` でシナリオフィクスチャを追加できます（`configured-plugin-installs` と `stale-source-plugin-shadow` を含みます）。Package Acceptance では、これらを `published_upgrade_survivor_baseline(s)` / `_scenarios` として公開し、`last-stable-4` や `all-since-2026.4.23` などのメタトークンを解決します。 |
| `pnpm test:docker:update-migration`                                         | `plugin-deps-cleanup` シナリオの公開済みアップグレード維持ハーネスで、デフォルトでは `openclaw@2026.4.23` から開始します。`Update Migration` ワークフローでは、`baselines=all-since-2026.4.23` を使用してこれを拡張し、Full Release CI 外で設定済み Plugin の依存関係クリーンアップを実証します。                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:plugins`                                                  | ローカルパス、`file:`、巻き上げられた依存関係を持つ npm レジストリパッケージ、移動する git 参照、ClawHub フィクスチャ、マーケットプレイス更新、および Claude バンドルの有効化/検査に対するインストール/更新のスモークテスト。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

## ローカル PR ゲート

ローカルで PR の land/gate チェックを行うには、以下を実行します。

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

負荷の高いホストで `pnpm test` が不安定に失敗した場合は、リグレッションとして扱う前に一度再実行し、その後 `pnpm test <path/to/test>` で切り分けます。メモリに制約のあるホストでは、以下を使用します。

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## テストパフォーマンス用ツール

- `pnpm test:perf:imports`: 明示的なファイル/ディレクトリ対象にはスコープ付きレーンルーティングを引き続き使用しながら、Vitest のインポート所要時間とインポート内訳のレポートを有効にします。`pnpm test:perf:imports:changed` は、同じプロファイリングの対象を `origin/main` 以降に変更されたファイルに限定します。
- `pnpm test:perf:changed:bench -- --ref <git-ref>` は、同じコミット済み git 差分について、ルーティングされた変更モードのパスをネイティブのルートプロジェクト実行と比較してベンチマークします。`pnpm test:perf:changed:bench -- --worktree` は、先にコミットせずに現在のワークツリーの変更セットをベンチマークします。
- `pnpm test:perf:profile:main` は Vitest のメインスレッド用 CPU プロファイル (`.artifacts/vitest-main-profile`) を書き出します。`pnpm test:perf:profile:runner` はユニットランナー用の CPU + ヒーププロファイル (`.artifacts/vitest-runner-profile`) を書き出します。
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: フルスイートのすべての Vitest リーフ設定を直列に実行し、グループ別の所要時間データと設定ごとの JSON/ログ成果物を書き出します。フルスイートレポートではデフォルトでファイルを分離するため、以前のファイルで保持されたモジュールグラフや GC 停止時間が後続のアサーションに計上されません。共有ワーカーへの蓄積を意図的にプロファイリングする場合にのみ `-- --no-isolate` を渡してください。Test Performance Agent は、低速テストの修正を試みる前のベースラインとしてこれを使用します。`pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` は、パフォーマンス重視の変更後にグループ別レポートを比較します。
- フル、拡張機能、include パターンのシャード実行では、`.artifacts/vitest-shard-timings.json` のローカルタイミングデータが更新されます。以降の設定全体の実行では、低速シャードと高速シャードのバランス調整にそれらのタイミングが使用されます。include パターンの CI シャードでは、タイミングキーにシャード名が追加されるため、設定全体のタイミングデータを置き換えることなく、フィルタリングされたシャードのタイミングを確認できます。ローカルのタイミング成果物を無視するには、`OPENCLAW_TEST_PROJECTS_TIMINGS=0` を設定します。

## ベンチマーク

<Accordion title="モデルレイテンシー (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

任意の環境変数: `MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`。デフォルトのプロンプト: 「1 語だけで応答してください: ok。句読点や追加テキストは不要です。」

</Accordion>

<Accordion title="CLI 起動 (scripts/bench-cli-startup.ts)">

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

出力には、`sampleCount`、平均、p50、p95、最小値/最大値、終了コード/シグナルの分布、コマンドごとの最大 RSS が含まれます。`--cpu-prof-dir` / `--heap-prof-dir` は、実行ごとに V8 プロファイルを書き出します。

保存される出力: `pnpm test:startup:bench:smoke` は `.artifacts/cli-startup-bench-smoke.json` に書き出し、`pnpm test:startup:bench:save` は `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`) に書き出します。リポジトリに格納されるフィクスチャ: `test/fixtures/cli-startup-bench.json`。`pnpm test:startup:bench:update` で更新され、`pnpm test:startup:bench:check` で比較されます。

</Accordion>

<Accordion title="Gateway 起動 (scripts/bench-gateway-startup.ts)">

デフォルトでは、`dist/entry.js` にあるビルド済み CLI エントリを使用します。先に `pnpm build` を実行してください。代わりにソースランナーを計測するには `--entry scripts/run-node.mjs` を渡し、その結果はビルド済みエントリのベースラインとは分けて管理してください。

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

ケース ID: `default`、`skipChannels` (チャネル起動をスキップ)、`oneInternalHook`、`allInternalHooks`、`fiftyPlugins` (50 個のマニフェスト Plugin)、`fiftyStartupLazyPlugins` (50 個の起動時遅延読み込みマニフェスト Plugin)。

出力には、最初のプロセス出力、`/healthz`、`/readyz`、HTTP リッスンのログ時刻、Gateway 準備完了のログ時刻、CPU 時間、CPU コア比率、最大 RSS、ヒープ、起動トレースメトリクス、イベントループ遅延、Plugin ルックアップテーブルの詳細メトリクスが含まれます。スクリプトは、子 Gateway の環境で `OPENCLAW_GATEWAY_STARTUP_TRACE=1` を設定します。

`/healthz` は生存確認です (HTTP サーバーが応答可能)。`/readyz` は利用可能な準備完了状態です (起動時 Plugin サイドカー、チャネル、アタッチ後に準備完了へ重大な影響を与える処理が収束済み)。起動フックは非同期にディスパッチされ、準備完了保証には含まれません。準備完了ログ時刻は Gateway 内部のタイムスタンプであり、プロセス側の要因特定には役立ちますが、外部の `/readyz` プローブの代わりにはなりません。

変更を比較する場合は、JSON 出力または `--output` を使用します。`--cpu-prof-dir` は、トレース出力によってインポート、コンパイル、またはフェーズタイミングだけでは説明できない CPU バウンド処理が示された場合にのみ使用します。

</Accordion>

<Accordion title="Gateway 再起動 (scripts/bench-gateway-restart.ts)">

macOS と Linux のみ対応します (プロセス内再起動に SIGUSR1 を使用し、Windows では即座に失敗します)。上記の Gateway 起動と同じく、ビルド済みエントリがデフォルトで、`--entry scripts/run-node.mjs` で上書きできます。

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

ケース ID: `skipChannels`、`skipChannelsAcpxProbe` (ACPX 起動プローブがオン)、`skipChannelsNoAcpxProbe` (プローブがオフ)、`default`、`fiftyPlugins`。

出力には、次の `/healthz`、次の `/readyz`、ダウンタイム、再起動の準備完了タイミング、CPU、RSS、置換プロセスの起動トレースメトリクス、およびシグナル処理、進行中作業の排出、クローズフェーズ、次回起動、準備完了タイミング、メモリスナップショットに関する再起動トレースメトリクスが含まれます。スクリプトは `OPENCLAW_GATEWAY_STARTUP_TRACE=1` と `OPENCLAW_GATEWAY_RESTART_TRACE=1` を設定します。

変更が再起動シグナリング、クローズハンドラー、再起動後の起動、サイドカーのシャットダウン、サービスの引き継ぎ、または再起動後の準備完了状態に関係する場合は、このベンチマークを使用します。チャネル起動から Gateway の動作を分離するには `skipChannels` から始めてください。狭いケースで再起動パスを説明できた後にのみ、`default` または Plugin 数の多いケースを使用します。トレースメトリクスは要因特定の手掛かりであり、判定そのものではありません。複数のサンプル、対応する所有者スパン、`/healthz`/`/readyz` の動作、ユーザーから見える再起動契約に基づいて、再起動に関する変更を評価してください。

</Accordion>

## オンボーディング E2E (Docker)

任意です。コンテナ化されたオンボーディングのスモークテストにのみ必要です。クリーンな Linux コンテナでの完全なコールドスタートフロー:

```bash
scripts/e2e/onboard-docker.sh
```

疑似 tty を介して対話型ウィザードを操作し、設定/ワークスペース/セッションファイルを検証してから、Gateway を起動し、`openclaw health` を実行します。

## QR インポートスモーク (Docker)

保守対象の QR ランタイムヘルパーが、サポート対象の Docker Node ランタイム (Node 24 がデフォルト、Node 22 と互換) で読み込まれることを確認します。

```bash
pnpm test:docker:qr
```

## 関連項目

- [テスト](/ja-JP/help/testing)
- [ライブテスト](/ja-JP/help/testing-live)
- [アップデートと Plugin のテスト](/ja-JP/help/testing-updates-plugins)
