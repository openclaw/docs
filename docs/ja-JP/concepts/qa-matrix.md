---
read_when:
    - pnpm openclaw qa matrix をローカルで実行する
    - Matrix QA シナリオの追加または選択
    - Matrix QA の失敗、タイムアウト、または進まないクリーンアップをトリアージする
summary: 'Dockerベースの Matrix ライブQAレーンに関するメンテナー向けリファレンス: CLI、プロファイル、環境変数、シナリオ、出力アーティファクト。'
title: Matrix QA
x-i18n:
    generated_at: "2026-05-06T05:03:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA レーンは、Docker 内の使い捨て Tuwunel ホームサーバーに対して、バンドルされた `@openclaw/matrix` プラグインを実行します。一時的なドライバー、SUT、オブザーバーのアカウントと、事前投入されたルームも使用します。これは Matrix 向けの、実際のトランスポートを使うライブカバレッジです。

これはメンテナー専用のツールです。パッケージ化された OpenClaw リリースでは意図的に `qa-lab` を省いているため、`openclaw qa` はソースチェックアウトからのみ利用できます。ソースチェックアウトではバンドルされたランナーを直接読み込むため、プラグインのインストール手順は不要です。

より広い QA フレームワークの背景については、[QA 概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

## クイックスタート

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

単純な `pnpm openclaw qa matrix` は `--profile all` を実行し、最初の失敗では停止しません。リリースゲートには `--profile fast --fail-fast` を使用してください。全インベントリを並列実行する場合は、`--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` でカタログをシャード化します。

## レーンの動作

1. Docker 内に使い捨て Tuwunel ホームサーバーをプロビジョニングします（デフォルトイメージは `ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名は `matrix-qa.test`、ポートは `28008`）。
2. 3 つの一時ユーザーを登録します - `driver`（インバウンドトラフィックを送信）、`sut`（テスト対象の OpenClaw Matrix アカウント）、`observer`（サードパーティトラフィックのキャプチャ）。
3. 選択されたシナリオで必要なルームを事前投入します（main、threading、media、restart、secondary、allowlist、E2EE、verification DM など）。
4. SUT アカウントにスコープされた実際の Matrix プラグインを使って、子 OpenClaw Gateway を起動します。子プロセスでは `qa-channel` は読み込まれません。
5. シナリオを順番に実行し、driver/observer Matrix クライアントを通じてイベントを観測します。
6. ホームサーバーを破棄し、レポートとサマリー成果物を書き出してから終了します。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 共通フラグ

| フラグ                  | デフォルト                                       | 説明                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | シナリオプロファイル。[プロファイル](#profiles)を参照してください。                                                                           |
| `--fail-fast`         | オフ                                           | 最初に失敗したチェックまたはシナリオの後に停止します。                                                                         |
| `--scenario <id>`     | -                                             | このシナリオのみを実行します。繰り返し指定できます。[シナリオ](#scenarios)を参照してください。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | レポート、サマリー、観測イベント、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`  | `process.cwd()`                               | 中立的な作業ディレクトリから呼び出す場合のリポジトリルートです。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 設定内の Matrix アカウント ID です。                                                                        |

### プロバイダーフラグ

このレーンは実際の Matrix トランスポートを使用しますが、モデルプロバイダーは設定できます。

| フラグ                     | デフォルト          | 説明                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 決定的なモックディスパッチには `mock-openai`、ライブ frontier プロバイダーには `live-frontier` を使用します。レガシーエイリアス `live-openai` も引き続き動作します。 |
| `--model <ref>`          | プロバイダーのデフォルト | プライマリ `provider/model` 参照です。                                                                                                             |
| `--alt-model <ref>`      | プロバイダーのデフォルト | シナリオが実行中に切り替える代替 `provider/model` 参照です。                                                                            |
| `--fast`                 | オフ              | サポートされている場合に、プロバイダーの高速モードを有効にします。                                                                                                |

Matrix QA は `--credential-source` または `--credential-role` を受け付けません。このレーンは使い捨てユーザーをローカルにプロビジョニングします。リース対象となる共有認証情報プールはありません。

## プロファイル

選択されたプロファイルによって、実行されるシナリオが決まります。

| プロファイル         | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（デフォルト） | 完全なカタログです。低速ですが網羅的です。                                                                                                                                                                                                   |
| `fast`          | ライブトランスポート契約を検証するリリースゲート用サブセットです。canary、メンションゲート、allowlist ブロック、返信形状、restart resume、スレッドフォローアップ、スレッド分離、リアクション観測、exec 承認メタデータ配信を実行します。 |
| `transport`     | トランスポートレベルのスレッド、DM、ルーム、autojoin、mention/allowlist、approval、リアクションのシナリオです。                                                                                                                                  |
| `media`         | 画像、音声、動画、PDF、EPUB 添付ファイルのカバレッジです。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小限の E2EE カバレッジです - 基本的な暗号化返信、スレッドフォローアップ、ブートストラップ成功。                                                                                                                                                  |
| `e2ee-deep`     | E2EE の状態喪失、バックアップ、鍵、リカバリーシナリオを網羅的に扱います。                                                                                                                                                                     |
| `e2ee-cli`      | QA ハーネス経由で駆動される `openclaw matrix encryption setup` と `verify *` CLI シナリオです。                                                                                                                                       |

正確なマッピングは `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` にあります。

## シナリオ

完全なシナリオ ID 一覧は、`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` の `MatrixQaScenarioId` union です。カテゴリには次が含まれます。

- スレッド - `matrix-thread-*`、`matrix-subagent-thread-spawn`
- トップレベル / DM / ルーム - `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- ストリーミングとツール進行状況 - `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- メディア - `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- ルーティング - `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- リアクション - `matrix-reaction-*`
- 承認 - `matrix-approval-*`（exec/plugin メタデータ、チャンク化フォールバック、拒否リアクション、スレッド、`target: "both"` ルーティング）
- 再起動と再生 - `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- メンションゲート、bot-to-bot、allowlist - `matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*`（基本返信、スレッドフォローアップ、ブートストラップ、リカバリーキーライフサイクル、状態喪失バリアント、サーバーバックアップ動作、デバイス衛生、SAS / QR / DM 検証、再起動、成果物のリダクション）
- E2EE CLI - `matrix-e2ee-cli-*`（暗号化セットアップ、冪等なセットアップ、ブートストラップ失敗、リカバリーキーライフサイクル、複数アカウント、gateway-reply ラウンドトリップ、自己検証）

手動で選んだセットを実行するには、`--scenario <id>`（繰り返し指定可）を渡します。プロファイルゲートを無視するには `--profile all` と組み合わせます。

## 環境変数

| 変数                                    | デフォルト                                | 効果                                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 分)                         | 実行全体の厳密な上限。                                                                                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初期 canary 応答の上限。リリース CI は共有ランナーでこの値を引き上げるため、遅い最初の Gateway ターンでシナリオカバレッジの開始前に失敗しない。                                                               |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 否定的な no-reply アサーション用の静穏ウィンドウ。実行タイムアウト以下（`≤`）にクランプされる。                                                                                                                |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker ティアダウンの上限。失敗時の表示には復旧用の `docker compose ... down --remove-orphans` コマンドが含まれる。                                                                                            |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 別の Tuwunel バージョンに対して検証する場合に homeserver イメージを上書きする。                                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | オン                                      | `0` は stderr の `[matrix-qa] ...` 進捗行を抑止する。`1` は強制的に有効にする。                                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 伏せ字化                                  | `1` はメッセージ本文と `formatted_body` を `matrix-qa-observed-events.json` に保持する。デフォルトでは CI アーティファクトを安全に保つため伏せ字化する。                                                        |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | オフ                                      | `1` はアーティファクト書き込み後の決定的な `process.exit` をスキップする。デフォルトでは、matrix-js-sdk のネイティブ暗号ハンドルがアーティファクト完了後もイベントループを生存させる可能性があるため終了を強制する。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 外側のランチャー（例: `scripts/run-node.mjs`）によって設定されている場合、Matrix QA は独自の tee を開始せず、そのログパスを再利用する。                                                                        |

## 出力アーティファクト

`--output-dir` に書き込まれる:

- `matrix-qa-report.md` - Markdown プロトコルレポート（何が成功、失敗、スキップされ、その理由）。
- `matrix-qa-summary.json` - CI 解析とダッシュボードに適した構造化サマリー。
- `matrix-qa-observed-events.json` - ドライバークライアントとオブザーバークライアントから観測された Matrix イベント。`OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` でない限り本文は伏せ字化される。承認メタデータは、選択された安全なフィールドと切り詰められたコマンドプレビューで要約される。
- `matrix-qa-output.log` - 実行からの stdout/stderr の結合ログ。`OPENCLAW_RUN_NODE_OUTPUT_LOG` が設定されている場合は、代わりに外側のランチャーのログが再利用される。

デフォルトの出力ディレクトリは `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` なので、連続した実行が互いに上書きしない。

## トリアージのヒント

- **実行が終盤付近でハングする:** `matrix-js-sdk` のネイティブ暗号ハンドルがハーネスより長く生存することがある。デフォルトではアーティファクト書き込み後にクリーンな `process.exit` を強制する。`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` を解除している場合は、プロセスが残ることを想定する。
- **クリーンアップエラー:** 出力された復旧コマンド（`docker compose ... down --remove-orphans` 呼び出し）を探し、homeserver ポートを解放するため手動で実行する。
- **CI で否定アサーションのウィンドウが不安定:** CI が高速な場合は `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（デフォルト 8 秒）を下げる。遅い共有ランナーでは引き上げる。
- **バグレポート用に伏せ字化された本文が必要:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` で再実行し、`matrix-qa-observed-events.json` を添付する。生成されたアーティファクトは機微なものとして扱う。
- **別の Tuwunel バージョン:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` をテスト対象のバージョンに向ける。このレーンはピン留めされたデフォルトイメージのみをチェックする。

## ライブトランスポート契約

Matrix は、[QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)で定義された単一の契約チェックリストを共有する 3 つのライブトランスポートレーン（Matrix、Telegram、Discord）の 1 つ。`qa-channel` は広範な合成スイートのままであり、意図的にそのマトリックスには含まれない。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - QA スタック全体とライブトランスポート契約
- [QA Channel](/ja-JP/channels/qa-channel) - リポジトリに基づくシナリオ用の合成チャンネルアダプター
- [テスト](/ja-JP/help/testing) - テストの実行と QA カバレッジの追加
- [Matrix](/ja-JP/channels/matrix) - テスト対象のチャンネル Plugin
