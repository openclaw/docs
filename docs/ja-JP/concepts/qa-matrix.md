---
read_when:
    - pnpm openclaw qa matrix をローカルで実行する
    - Matrix QA シナリオの追加または選択
    - Matrix QA の失敗、タイムアウト、または停止したクリーンアップのトリアージ
summary: 'Docker バックの Matrix ライブ QA レーンのメンテナー向けリファレンス: CLI、プロファイル、環境変数、シナリオ、出力アーティファクト。'
title: Matrix QA
x-i18n:
    generated_at: "2026-07-04T20:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA レーンは、バンドルされた `@openclaw/matrix` Plugin を Docker 内の使い捨て Tuwunel homeserver に対して実行し、一時的な driver、SUT、observer アカウントとシード済みのルームを使用します。これは Matrix 向けの、実際のトランスポートを使ったライブカバレッジです。

これはメンテナー専用ツールです。パッケージ化された OpenClaw リリースには意図的に `qa-lab` が含まれないため、`openclaw qa` はソースチェックアウトからのみ利用できます。ソースチェックアウトはバンドルされたランナーを直接読み込むため、Plugin のインストール手順は不要です。

より広い QA フレームワークの背景については、[QA 概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

## クイックスタート

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

通常の `pnpm openclaw qa matrix` は `--profile all` を実行し、最初の失敗では停止しません。リリースゲートには `--profile fast --fail-fast` を使用してください。完全なインベントリを並列実行する場合は、`--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` でカタログをシャード化します。

## レーンが行うこと

1. Docker 内に使い捨て Tuwunel homeserver をプロビジョニングします（既定のイメージは `ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名は `matrix-qa.test`、ポートは `28008`）。これは、境界付きのリダクション対応リクエスト/レスポンスレコーダーの背後に配置されます。
2. 3 人の一時ユーザーを登録します - `driver`（インバウンドトラフィックを送信）、`sut`（テスト対象の OpenClaw Matrix アカウント）、`observer`（サードパーティトラフィックのキャプチャ）。
3. 選択されたシナリオに必要なルーム（main、threading、media、restart、secondary、allowlist、E2EE、verification DM など）をシードします。
4. 記録された Tuwunel 境界に対して、基盤に依存しない `matrix-qa-v1` プロトコルプローブを実行します。ユニットテストは Matrix プロトコルフィクスチャでプローブ契約を証明します。[#99707](https://github.com/openclaw/openclaw/pull/99707) の正規 QA トランスポートアダプターホストが、実際の Crabline ターゲット配線を所有します。
5. SUT アカウントにスコープされた実際の Matrix Plugin を使って、子 OpenClaw gateway を起動します。子プロセスでは `qa-channel` は読み込まれません。
6. シナリオを順番に実行し、driver/observer Matrix クライアントを通じてイベントを観測し、記録されたトラフィックからルート/状態の期待値を導出します。
7. homeserver を破棄し、レポートと証拠アーティファクトを書き出してから終了します。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 共通フラグ

| フラグ                  | 既定値                                        | 説明                                                                                                                                          |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | シナリオプロファイル。[プロファイル](#profiles)を参照してください。                                                                          |
| `--fail-fast`         | オフ                                          | 最初に失敗したチェックまたはシナリオの後で停止します。                                                                                       |
| `--scenario <id>`     | -                                             | このシナリオのみを実行します。繰り返し指定できます。[シナリオ](#scenarios)を参照してください。                                               |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | レポート、サマリー、ルート/状態インベントリ、観測イベント、出力ログを書き込む場所。相対パスは `--repo-root` を基準に解決されます。          |
| `--repo-root <path>`  | `process.cwd()`                               | 中立的な作業ディレクトリから呼び出す場合のリポジトリルート。                                                                                 |
| `--sut-account <id>`  | `sut`                                         | QA gateway 設定内の Matrix アカウント ID。                                                                                                    |

### プロバイダーフラグ

このレーンは実際の Matrix トランスポートを使用しますが、モデルプロバイダーは設定可能です。

| フラグ                   | 既定値                 | 説明                                                                                                                                          |
| ------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`        | 決定論的なモックディスパッチには `mock-openai`、ライブ frontier プロバイダーには `live-frontier` を使用します。レガシーエイリアス `live-openai` も引き続き機能します。 |
| `--model <ref>`          | プロバイダーの既定値   | プライマリ `provider/model` ref。                                                                                                             |
| `--alt-model <ref>`      | プロバイダーの既定値   | シナリオが実行中に切り替える代替 `provider/model` ref。                                                                                      |
| `--fast`                 | オフ                   | サポートされている場合、プロバイダーの高速モードを有効にします。                                                                             |

Matrix QA は `--credential-source` または `--credential-role` を受け付けません。このレーンは使い捨てユーザーをローカルでプロビジョニングします。リース対象となる共有資格情報プールはありません。

## プロファイル

選択されたプロファイルによって、実行されるシナリオが決まります。

| プロファイル     | 用途                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (既定)    | 完全なカタログ。低速ですが網羅的です。                                                                                                                                                                                               |
| `fast`          | ライブトランスポート契約を検証するリリースゲート用サブセット: canary、メンションゲーティング、allowlist ブロック、返信形状、restart resume、スレッドフォローアップ、スレッド分離、リアクション観測、exec 承認メタデータ配信。 |
| `transport`     | トランスポートレベルのスレッド、DM、ルーム、自動参加、メンション/allowlist、承認、リアクションのシナリオ。                                                                                                                          |
| `media`         | 画像、音声、動画、PDF、EPUB 添付ファイルのカバレッジ。                                                                                                                                                                               |
| `e2ee-smoke`    | 最小限の E2EE カバレッジ - 基本的な暗号化返信、スレッドフォローアップ、ブートストラップ成功。                                                                                                                                       |
| `e2ee-deep`     | E2EE の状態喪失、バックアップ、鍵、復旧シナリオを網羅的に検証します。                                                                                                                                                                |
| `e2ee-cli`      | QA ハーネスを通じて実行される `openclaw matrix encryption setup` と `verify *` CLI シナリオ。                                                                                                                                        |

正確なマッピングは `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` にあります。

## シナリオ

完全なシナリオ ID リストは、`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` の `MatrixQaScenarioId` union です。カテゴリには次が含まれます。

- スレッド - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- トップレベル / DM / ルーム - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- ストリーミングとツール進行状況 - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- メディア - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- ルーティング - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- リアクション - `matrix-reaction-*`
- 承認 - `matrix-approval-*`（exec/plugin メタデータ、チャンク化フォールバック、拒否リアクション、スレッド、`target: "both"` ルーティング）
- 再起動と再生 - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- メンションゲーティング、bot 間通信、allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*`（基本返信、スレッドフォローアップ、ブートストラップ、復旧鍵ライフサイクル、状態喪失バリアント、サーバーバックアップ動作、デバイス衛生、SAS / QR / DM 検証、再起動、アーティファクトのリダクション）
- E2EE CLI - `matrix-e2ee-cli-*`（暗号化セットアップ、冪等なセットアップ、ブートストラップ失敗、復旧鍵ライフサイクル、マルチアカウント、gateway 返信ラウンドトリップ、自己検証）

手動で選んだセットを実行するには、`--scenario <id>`（繰り返し指定可能）を渡します。プロファイルゲーティングを無視するには、`--profile all` と組み合わせます。

## 環境変数

| 変数                                    | デフォルト                              | 効果                                                                                                                                                                                         |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30分)                        | 実行全体の厳格な上限。                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初期 canary 応答の上限。リリース CI では共有ランナー上でこれを引き上げ、低速な最初の Gateway ターンによってシナリオカバレッジの開始前に失敗しないようにする。                                       |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 否定的な無応答アサーション用の静寂ウィンドウ。実行タイムアウト以下 (`≤`) に制限される。                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker ティアダウンの上限。失敗表示には復旧用の `docker compose ... down --remove-orphans` コマンドが含まれる。                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 別の Tuwunel バージョンに対して検証する場合に、homeserver イメージを上書きする。                                                                                                             |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | オン                                      | `0` は stderr 上の `[matrix-qa] ...` 進捗行を抑制する。`1` はそれらを強制的に有効にする。                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 編集済み                                  | `1` はメッセージ本文と `formatted_body` を `matrix-qa-observed-events.json` に保持する。デフォルトでは CI アーティファクトを安全に保つため編集済みにする。                                                                    |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | オフ                                      | `1` はアーティファクト書き込み後の決定的な `process.exit` をスキップする。デフォルトで強制終了するのは、matrix-js-sdk のネイティブ crypto ハンドルがアーティファクト完了後もイベントループを生存させ続ける可能性があるため。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 外側のランチャー (例: `scripts/run-node.mjs`) によって設定された場合、Matrix QA は独自の tee を開始する代わりにそのログパスを再利用する。                                                                   |

## 出力アーティファクト

`--output-dir` に書き込まれる:

- `matrix-qa-report.md` - Markdown プロトコルレポート (何が成功、失敗、スキップされたか、およびその理由)。
- `matrix-qa-summary.json` - CI の解析とダッシュボードに適した構造化サマリー。
- `matrix-qa-route-state-manifest.json` - シナリオ id をキーにした動的な `matrix-qa-v1` インベントリ。編集済みのルート/本文形状、リクエスト順序、観測されたリトライ、エラー、sync-token の連続性、およびその実行中に観測されたデバイス/キー/メディア/バックアップ状態ファミリーを記録する。これは実行可能な証拠であり、チェックインされたベースラインではない。
- `matrix-qa-observed-events.json` - ドライバーおよびオブザーバークライアントから観測された Matrix イベント。`OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` でない限り本文は編集済みになり、承認メタデータは選択された安全なフィールドと切り詰められたコマンドプレビューで要約される。
- `matrix-qa-output.log` - 実行からの stdout/stderr の結合。`OPENCLAW_RUN_NODE_OUTPUT_LOG` が設定されている場合は、代わりに外側のランチャーのログが再利用される。

デフォルトの出力ディレクトリは `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` であるため、連続した実行が互いを上書きすることはない。

## トリアージのヒント

- **実行が終盤でハングする:** `matrix-js-sdk` のネイティブ crypto ハンドルはハーネスより長く生存する可能性がある。デフォルトでは、アーティファクト書き込み後にクリーンな `process.exit` を強制する。`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` を未設定にしている場合、プロセスがしばらく残ることを想定する。
- **クリーンアップエラー:** 出力された復旧コマンド (`docker compose ... down --remove-orphans` の呼び出し) を探し、homeserver ポートを解放するために手動で実行する。
- **CI で否定的アサーションウィンドウが不安定:** CI が高速な場合は `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (デフォルト 8秒) を下げ、低速な共有ランナーでは上げる。
- **バグレポート用に編集済み本文が必要:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` で再実行し、`matrix-qa-observed-events.json` を添付する。生成されたアーティファクトは機密として扱う。
- **別の Tuwunel バージョン:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` をテスト対象のバージョンに向ける。このレーンはピン留めされたデフォルトイメージのみをチェックする。

## ライブトランスポート契約

Matrix は、[QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage) で定義されている単一の契約チェックリストを共有する 3 つのライブトランスポートレーン (Matrix、Telegram、Discord) の 1 つである。`qa-channel` は引き続き広範な合成スイートであり、意図的にそのマトリックスの一部ではない。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) - QA スタック全体とライブトランスポート契約
- [QA Channel](/ja-JP/channels/qa-channel) - リポジトリに裏付けられたシナリオ用の合成チャンネルアダプター
- [テスト](/ja-JP/help/testing) - テストの実行と QA カバレッジの追加
- [Matrix](/ja-JP/channels/matrix) - テスト対象のチャンネル Plugin
