---
read_when:
    - ローカルで pnpm openclaw qa matrix を実行する
    - Matrix QA シナリオの追加または選択
    - Matrix QA の失敗、タイムアウト、または停止したクリーンアップのトリアージ
summary: Docker ベースの Matrix ライブ QA レーンに関するメンテナー向けリファレンス：CLI、プロファイル、環境変数、シナリオ、出力アーティファクト。
title: Matrix QA
x-i18n:
    generated_at: "2026-07-11T22:12:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA レーンは、Docker 内の使い捨て Tuwunel ホームサーバーに対して同梱の `@openclaw/matrix` Plugin を実行します。一時的なドライバー、SUT、オブザーバーの各アカウントと、事前設定済みのルームを使用します。これは Matrix の実際のトランスポートを使用するライブカバレッジです。

メンテナー専用のツールです。パッケージ化された OpenClaw リリースには `qa-lab` が含まれないため、`openclaw qa` はソースチェックアウトからのみ実行できます。この場合、Plugin のインストール手順なしで、同梱のランナーを直接読み込みます。

QA フレームワーク全般の背景については、[QA の概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

## クイックスタート

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

単純に `pnpm openclaw qa matrix` を実行すると `--profile all` が使用され、最初の失敗では停止しません。`--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` を使用すると、全項目を並列ジョブ間で分割できます。

## このレーンの動作

1. 制限付きの秘匿化リクエスト／レスポンスレコーダーの背後に、Docker 内で使い捨ての Tuwunel ホームサーバーをプロビジョニングします（デフォルトイメージは `ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名は `matrix-qa.test`、ポートは `28008`）。
2. 3 人の一時ユーザーを登録します。`driver`（受信トラフィックを送信）、`sut`（テスト対象の OpenClaw Matrix アカウント）、`observer`（サードパーティートラフィックを取得）です。
3. 選択したシナリオに必要なルーム（メイン、スレッド、メディア、再起動、セカンダリ、許可リスト、E2EE、検証用 DM など）を事前設定します。
4. 記録された Tuwunel 境界に対して、基盤に依存しない `matrix-qa-v1` プロトコルプローブを実行します。単体テストでは Matrix プロトコルフィクスチャを使用してプローブの契約を検証します。[#99707](https://github.com/openclaw/openclaw/pull/99707) の標準 QA トランスポートアダプターホストが、実際の Crabline ターゲット配線を担います。
5. SUT アカウントにスコープを限定した実際の Matrix Plugin を使用して、子 OpenClaw Gateway を起動します。
6. シナリオを順番に実行し、ドライバー／オブザーバーの Matrix クライアントを通じてイベントを監視し、記録されたトラフィックからルート／状態の期待値を導出します。
7. ホームサーバーを破棄し、レポートとエビデンス成果物を書き込んで終了します。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 共通フラグ

| フラグ                | デフォルト                                    | 説明                                                                                                                                               |
| --------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | シナリオプロファイル。[プロファイル](#profiles)を参照してください。                                                                               |
| `--fail-fast`         | オフ                                          | 最初にチェックまたはシナリオが失敗した時点で停止します。                                                                                           |
| `--scenario <id>`     | -                                             | このシナリオのみを実行します。複数回指定できます。[シナリオ](#scenarios)を参照してください。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | レポート、サマリー、ルート／状態の一覧、観測されたイベント、出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。               |
| `--repo-root <path>`  | `process.cwd()`                               | 中立的な作業ディレクトリから呼び出す場合のリポジトリルートです。                                                                                   |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 設定内の Matrix アカウント ID です。                                                                                                    |

### プロバイダーフラグ

このレーンは実際の Matrix トランスポートを使用しますが、モデルプロバイダーは設定可能です。

| フラグ                   | デフォルト             | 説明                                                                                                                                                               |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`        | 決定論的なモックディスパッチには `mock-openai`、ライブのフロンティアプロバイダーには `live-frontier` を使用します。従来のエイリアス `live-openai` も引き続き機能します。 |
| `--model <ref>`          | プロバイダーのデフォルト | プライマリの `provider/model` 参照です。                                                                                                                            |
| `--alt-model <ref>`      | プロバイダーのデフォルト | シナリオが実行途中で切り替える代替 `provider/model` 参照です。                                                                                                      |
| `--fast`                 | オフ                   | サポートされている場合、プロバイダーの高速モードを有効にします。                                                                                                   |

Matrix QA は `--credential-source` または `--credential-role` を受け付けません。このレーンは使い捨てユーザーをローカルでプロビジョニングするため、リース対象となる共有認証情報プールはありません。

## プロファイル

| プロファイル      | 用途                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（デフォルト） | カタログ全体。低速ですが網羅的です。                                                                                                                                                                                           |
| `fast`            | 命令型のライブトランスポート契約を検証するリリースゲート用サブセットです。メンション制御、許可リストによるブロック、返信形式、再起動後の再開、リアクションの監視、実行承認メタデータの配信、E2EE の基本返信を対象とします。       |
| `transport`       | トランスポートレベルのスレッド、DM、ルーム、自動参加、メンション／許可リスト、承認、リアクションの各シナリオです。                                                                                                             |
| `media`           | 画像、音声、動画、PDF、EPUB 添付ファイルのカバレッジです。                                                                                                                                                                     |
| `e2ee-smoke`      | 最小限の E2EE カバレッジです。暗号化された基本返信、スレッドのフォローアップ、ブートストラップ成功を対象とします。                                                                                                             |
| `e2ee-deep`       | E2EE の状態喪失、バックアップ、キー、復旧シナリオを網羅的に検証します。                                                                                                                                                         |
| `e2ee-cli`        | QA ハーネスを通じて実行される `openclaw matrix encryption setup` および `verify *` CLI シナリオです。                                                                                                                           |

正確なマッピングは `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` にあります。

## シナリオ

共有 Matrix アダプターは、`openclaw qa suite --channel-driver live --channel matrix` を通じて、次の標準 YAML シナリオを公開します。

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` は明示的に `--scenario subagent-thread-spawn`
を選択すれば引き続き利用できますが、ライブでの子処理完了の検証が安定するまでは、デフォルトの共有 Matrix セットには含まれません。

残りの命令型シナリオ ID 一覧は、`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` の `MatrixQaScenarioId` 共用体です。カテゴリは次のとおりです。

- スレッド処理：`matrix-thread-root-preservation`、`matrix-thread-nested-reply-shape`
- トップレベル／DM／ルーム：`matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- ストリーミングとツール進捗：`matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- メディア：`matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- ルーティング：`matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- リアクション：`matrix-reaction-*`
- 承認：`matrix-approval-*`（実行／Plugin メタデータ、チャンク分割されたフォールバック、拒否リアクション、スレッド、`target: "both"` ルーティング）
- 再起動と再生：`matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- メンション制御、ボット間通信、許可リスト：`matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE：`matrix-e2ee-*`（基本返信、スレッドのフォローアップ、ブートストラップ、復旧キーのライフサイクル、状態喪失の各種パターン、サーバーバックアップの動作、デバイス衛生、SAS／QR／DM 検証、再起動、成果物の秘匿化）
- E2EE CLI：`matrix-e2ee-cli-*`（暗号化セットアップ、べき等なセットアップ、ブートストラップ失敗、復旧キーのライフサイクル、複数アカウント、Gateway 返信のラウンドトリップ、自己検証）

任意に選んだセットを実行するには、`--scenario <id>` を指定します（複数回指定可能）。`--profile all` と組み合わせると、プロファイルによる制限を無視します。

## 環境変数

| 変数                                    | デフォルト                                | 効果                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30 分）                        | 実行全体に対する厳格な上限。                                                                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 最初のカナリア応答に対する上限。リリース CI では共有ランナー上でこの値を引き上げ、最初の Gateway ターンが遅くてもシナリオのカバレッジが開始する前に失敗しないようにする。                         |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 応答がないことを確認する否定アサーション用の静穏時間枠。実行タイムアウト以下（`<=`）に制限される。                                                                                              |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker の終了処理に対する上限。失敗時の出力には、復旧用の `docker compose ... down --remove-orphans` コマンドが含まれる。                                                                       |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 異なる Tuwunel バージョンに対して検証する場合に、ホームサーバーのイメージを上書きする。                                                                                                        |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | オン                                      | `0` を指定すると stderr の `[matrix-qa] ...` 進捗行を非表示にする。`1` を指定すると強制的に表示する。                                                                                           |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 編集済み                                  | `1` を指定すると、メッセージ本文と `formatted_body` を `matrix-qa-observed-events.json` に保持する。デフォルトでは、CI アーティファクトの安全性を確保するために編集される。                     |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | オフ                                      | `1` を指定すると、アーティファクト書き込み後の決定的な `process.exit` を省略する。matrix-js-sdk のネイティブ暗号化ハンドルにより、アーティファクト完了後もイベントループが存続する場合があるため、デフォルトでは強制終了する。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 外部ランチャー（例: `scripts/run-node.mjs`）によって設定された場合、Matrix QA は独自の tee を開始せず、そのログパスを再利用する。                                                               |

## 出力アーティファクト

`--output-dir` に書き込まれる（デフォルトは `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` で、連続する実行が互いを上書きしない）:

- `matrix-qa-report.md`: Markdown 形式のプロトコルレポート（成功、失敗、スキップされた項目とその理由）。
- `matrix-qa-summary.json`: CI による解析やダッシュボードに適した構造化サマリー。
- `matrix-qa-route-state-manifest.json`: シナリオ ID をキーとする動的な `matrix-qa-v1` インベントリ。編集済みのルート/本文形状、リクエスト順序、観測された再試行、エラー、同期トークンの連続性、および実行中に観測されたデバイス/キー/メディア/バックアップの状態ファミリーを記録する。これは実行可能な証拠であり、リポジトリにチェックインされるベースラインではない。
- `matrix-qa-observed-events.json`: ドライバークライアントおよびオブザーバークライアントから観測された Matrix イベント。`OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` でない限り本文は編集される。承認メタデータは、選択された安全なフィールドと切り詰められたコマンドプレビューを使用して要約される。
- `matrix-qa-output.log`: 実行時の stdout/stderr を結合したもの。`OPENCLAW_RUN_NODE_OUTPUT_LOG` が設定されている場合は、代わりに外部ランチャーのログを再利用する。

## トリアージのヒント

- **実行が終了間際で停止する:** `matrix-js-sdk` のネイティブ暗号化ハンドルは、ハーネスより長く存続する場合がある。デフォルトでは、アーティファクト書き込み後にクリーンな `process.exit` を強制する。`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` を設定した場合、プロセスがしばらく残ることを想定する。
- **クリーンアップエラー:** 出力された復旧コマンド（`docker compose ... down --remove-orphans` の呼び出し）を確認し、ホームサーバーのポートを解放するために手動で実行する。
- **CI で否定アサーションの時間枠が不安定:** CI が高速な場合は `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（デフォルト 8 秒）を短くし、低速な共有ランナーでは長くする。
- **バグレポート用に編集済み本文が必要:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` を指定して再実行し、`matrix-qa-observed-events.json` を添付する。生成されたアーティファクトは機密情報として扱う。
- **異なる Tuwunel バージョン:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` にテスト対象のバージョンを指定する。このレーンでは、固定されたデフォルトイメージのみがチェックインされる。

## ライブトランスポート契約

Matrix は、[QA の概要: ライブトランスポートのカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)で定義された単一の契約チェックリストを共有する 3 つのライブトランスポートレーン（Matrix、Telegram、Discord）の 1 つである。`qa-channel` は引き続き広範な合成スイートであり、意図的にこのマトリクスには含まれていない。

## 関連項目

- [QA の概要](/ja-JP/concepts/qa-e2e-automation): QA スタック全体とライブトランスポート契約
- [QA チャンネル](/ja-JP/channels/qa-channel): リポジトリに基づくシナリオ用の合成チャンネルアダプター
- [テスト](/ja-JP/help/testing): テストの実行と QA カバレッジの追加
- [Matrix](/ja-JP/channels/matrix): テスト対象のチャンネル Plugin
