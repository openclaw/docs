---
read_when:
    - pnpm openclaw qa matrix をローカルで実行する
    - Matrix QA シナリオの追加または選択
    - Matrix QA の失敗、タイムアウト、または停止したクリーンアップのトリアージ
summary: 'Docker ベースの Matrix ライブ QA レーン向けメンテナーリファレンス: CLI、プロファイル、環境変数、シナリオ、出力アーティファクト。'
title: マトリックスQA
x-i18n:
    generated_at: "2026-07-05T11:20:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 012b07c4453cd2a206192e2c8caec6e0a7377796f94839a00282a6779a6cab88
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA laneは、バンドルされた`@openclaw/matrix` PluginをDocker内の使い捨てTuwunel homeserverに対して実行します。一時的なdriver、SUT、observerアカウントと、シード済みルームを使用します。これはMatrix向けの実トランスポートを使ったライブカバレッジです。

メンテナー専用ツールです。パッケージ化されたOpenClawリリースには`qa-lab`が含まれないため、`openclaw qa`はソースチェックアウトからのみ実行され、Pluginのインストール手順なしでバンドル済みランナーを直接読み込みます。

より広いQAフレームワークの背景については、[QA概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

## クイックスタート

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

通常の`pnpm openclaw qa matrix`は`--profile all`を実行し、最初の失敗では停止しません。`--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`で、完全なインベントリを並列ジョブにシャードできます。

## このlaneが行うこと

1. Docker内に使い捨てTuwunel homeserverをプロビジョニングします（デフォルトイメージは`ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名は`matrix-qa.test`、ポートは`28008`）。境界付きのリダクション対応リクエスト/レスポンスレコーダーの背後で動作します。
2. 3つの一時ユーザーを登録します: `driver`（インバウンドトラフィックを送信）、`sut`（テスト対象のOpenClaw Matrixアカウント）、`observer`（サードパーティのトラフィックキャプチャ）。
3. 選択されたシナリオに必要なルーム（main、threading、media、restart、secondary、allowlist、E2EE、verification DMなど）をシードします。
4. 記録されたTuwunel境界に対して、基盤に依存しない`matrix-qa-v1`プロトコルプローブを実行します。単体テストはMatrixプロトコルフィクスチャでプローブ契約を証明します。[#99707](https://github.com/openclaw/openclaw/pull/99707)の正規QAトランスポートアダプターホストが、実際のCrablineターゲット配線を所有します。
5. 実際のMatrix PluginをSUTアカウントにスコープした子OpenClaw Gatewayを開始します。
6. シナリオを順番に実行し、driver/observer Matrixクライアントを通じてイベントを観測し、記録済みトラフィックからルート/状態の期待値を導出します。
7. homeserverを破棄し、レポートと証拠アーティファクトを書き出してから終了します。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 共通フラグ

| フラグ                | デフォルト                                  | 説明                                                                                                                                   |
| --------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | シナリオプロファイル。[プロファイル](#profiles)を参照してください。                                                                                                  |
| `--fail-fast`         | オフ                                           | 最初に失敗したチェックまたはシナリオの後で停止します。                                                                                                |
| `--scenario <id>`     | -                                             | このシナリオのみを実行します。繰り返し指定できます。[シナリオ](#scenarios)を参照してください。                                                                              |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | レポート、サマリー、ルート/状態インベントリ、観測イベント、出力ログの書き込み先です。相対パスは`--repo-root`を基準に解決されます。 |
| `--repo-root <path>`  | `process.cwd()`                               | 中立的な作業ディレクトリから呼び出す場合のリポジトリルートです。                                                                               |
| `--sut-account <id>`  | `sut`                                         | QA Gateway設定内のMatrixアカウントIDです。                                                                                               |

### プロバイダーフラグ

このlaneは実際のMatrixトランスポートを使用しますが、モデルプロバイダーは設定可能です:

| フラグ                   | デフォルト       | 説明                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 決定論的なモックディスパッチには`mock-openai`、ライブのfrontierプロバイダーには`live-frontier`を使用します。レガシーエイリアス`live-openai`も引き続き動作します。 |
| `--model <ref>`          | プロバイダーのデフォルト | プライマリ`provider/model`参照です。                                                                                                             |
| `--alt-model <ref>`      | プロバイダーのデフォルト | シナリオが実行中に切り替える代替`provider/model`参照です。                                                                            |
| `--fast`                 | オフ              | サポートされている場合、プロバイダーの高速モードを有効にします。                                                                                                |

Matrix QAは`--credential-source`または`--credential-role`を受け付けません。このlaneは使い捨てユーザーをローカルでプロビジョニングします。リース対象となる共有資格情報プールはありません。

## プロファイル

| プロファイル      | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（デフォルト） | 完全なカタログです。低速ですが網羅的です。                                                                                                                                                                                                   |
| `fast`          | ライブトランスポート契約を実行するリリースゲート用サブセットです: canary、メンションゲート、allowlistブロック、返信形状、再起動後の再開、スレッドフォローアップ、スレッド分離、リアクション観測、exec承認メタデータ配信。 |
| `transport`     | トランスポートレベルのスレッド、DM、ルーム、autojoin、メンション/allowlist、承認、リアクションのシナリオです。                                                                                                                                  |
| `media`         | 画像、音声、動画、PDF、EPUB添付ファイルのカバレッジです。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小限のE2EEカバレッジです: 基本的な暗号化返信、スレッドフォローアップ、ブートストラップ成功。                                                                                                                                                   |
| `e2ee-deep`     | E2EEの状態喪失、バックアップ、鍵、リカバリーシナリオを網羅します。                                                                                                                                                                     |
| `e2ee-cli`      | QAハーネスを通じて駆動される`openclaw matrix encryption setup`と`verify *` CLIシナリオです。                                                                                                                                       |

正確なマッピングは`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`にあります。

## シナリオ

完全なシナリオIDリストは、`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`内の`MatrixQaScenarioId` unionです。カテゴリ:

- スレッド: `matrix-thread-*`、`matrix-subagent-thread-spawn`
- トップレベル / DM / ルーム: `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- ストリーミングとツール進行状況: `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- メディア: `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- ルーティング: `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- リアクション: `matrix-reaction-*`
- 承認: `matrix-approval-*`（exec/Pluginメタデータ、チャンク化フォールバック、拒否リアクション、スレッド、`target: "both"`ルーティング）
- 再起動とリプレイ: `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- メンションゲート、bot間通信、allowlist: `matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*`（基本返信、スレッドフォローアップ、ブートストラップ、リカバリーキーのライフサイクル、状態喪失バリアント、サーバーバックアップ動作、デバイス衛生、SAS / QR / DM検証、再起動、アーティファクトリダクション）
- E2EE CLI: `matrix-e2ee-cli-*`（暗号化セットアップ、冪等なセットアップ、ブートストラップ失敗、リカバリーキーのライフサイクル、複数アカウント、Gateway返信ラウンドトリップ、自己検証）

手動で選んだセットを実行するには、`--scenario <id>`（繰り返し可）を渡します。プロファイルゲートを無視するには、`--profile all`と組み合わせます。

## 環境変数

| 変数                                    | 既定値                                    | 効果                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 分)                         | 実行全体の厳密な上限。                                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 初期カナリア応答の上限。リリース CI では共有ランナー上でこの値を引き上げ、遅い最初の Gateway ターンによってシナリオカバレッジ開始前に失敗しないようにします。                                        |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | ネガティブな無応答アサーション用の静穏ウィンドウ。実行タイムアウト以下 (`<=`) に制限されます。                                                                                                       |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker ティアダウンの上限。失敗時の表示には復旧用の `docker compose ... down --remove-orphans` コマンドが含まれます。                                                                                |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 別の Tuwunel バージョンに対して検証する場合に、ホームサーバーイメージを上書きします。                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | オン                                      | `0` は stderr の `[matrix-qa] ...` 進捗行を抑制します。`1` はそれらを強制的に有効にします。                                                                                                          |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | マスク済み                                | `1` はメッセージ本文と `formatted_body` を `matrix-qa-observed-events.json` に保持します。既定では CI アーティファクトを安全に保つためにマスクします。                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | オフ                                      | `1` はアーティファクト書き込み後の決定論的な `process.exit` をスキップします。既定では、matrix-js-sdk のネイティブ暗号ハンドルがアーティファクト完了後もイベントループを生かし続ける可能性があるため、終了を強制します。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 外側のランチャー (例: `scripts/run-node.mjs`) によって設定された場合、Matrix QA は独自の tee を開始せず、そのログパスを再利用します。                                                                |

## 出力アーティファクト

`--output-dir` に書き込まれます (既定は `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` で、連続した実行が互いに上書きしないようにします):

- `matrix-qa-report.md`: Markdown プロトコルレポート (何が成功、失敗、スキップされたか、およびその理由)。
- `matrix-qa-summary.json`: CI の解析やダッシュボードに適した構造化サマリー。
- `matrix-qa-route-state-manifest.json`: シナリオ ID をキーにした動的な `matrix-qa-v1` インベントリ。マスク済みのルート/本文形状、リクエスト順序、観測されたリトライ、エラー、同期トークンの継続性、およびその実行中に観測されたデバイス/キー/メディア/バックアップ状態ファミリーを記録します。これは実行可能な証拠であり、チェックインされるベースラインではありません。
- `matrix-qa-observed-events.json`: ドライバーおよびオブザーバークライアントから観測された Matrix イベント。`OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` でない限り本文はマスクされます。承認メタデータは、選択された安全なフィールドと切り詰められたコマンドプレビューで要約されます。
- `matrix-qa-output.log`: 実行からの stdout/stderr を結合したもの。`OPENCLAW_RUN_NODE_OUTPUT_LOG` が設定されている場合は、外側のランチャーのログが代わりに再利用されます。

## トリアージのヒント

- **実行が終盤でハングする:** `matrix-js-sdk` のネイティブ暗号ハンドルはハーネスより長く生き残ることがあります。既定ではアーティファクト書き込み後にクリーンな `process.exit` を強制します。`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` を設定した場合、プロセスが残り続けることを想定してください。
- **クリーンアップエラー:** 出力された復旧コマンド (`docker compose ... down --remove-orphans` の呼び出し) を探し、ホームサーバーポートを解放するために手動で実行してください。
- **CI でネガティブアサーションのウィンドウが不安定:** CI が高速な場合は `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (既定 8 秒) を下げ、遅い共有ランナーでは上げてください。
- **バグ報告のためにマスク済み本文が必要:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` で再実行し、`matrix-qa-observed-events.json` を添付してください。生成されたアーティファクトは機密として扱ってください。
- **別の Tuwunel バージョン:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` をテスト対象のバージョンに向けてください。このレーンでは、ピン留めされた既定イメージのみをチェックインします。

## ライブトランスポート契約

Matrix は、[QA 概要: ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)で定義された単一の契約チェックリストを共有する 3 つのライブトランスポートレーン (Matrix、Telegram、Discord) の 1 つです。`qa-channel` は引き続き広範な合成スイートであり、意図的にそのマトリックスの一部にはなっていません。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation): QA スタック全体とライブトランスポート契約
- [QA Channel](/ja-JP/channels/qa-channel): リポジトリに裏付けられたシナリオ用の合成チャンネルアダプター
- [テスト](/ja-JP/help/testing): テストの実行と QA カバレッジの追加
- [Matrix](/ja-JP/channels/matrix): テスト対象のチャンネル Plugin
