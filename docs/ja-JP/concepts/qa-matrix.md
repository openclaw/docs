---
read_when:
    - pnpm openclaw qa matrix をローカルで実行する
    - Matrix QA シナリオの追加または選択
    - Matrix QA の失敗、タイムアウト、または停止したクリーンアップのトリアージ
summary: Docker ベースの Matrix ライブ QA レーンに関するメンテナー向けリファレンス：CLI、プロファイル、環境変数、シナリオ、出力アーティファクト。
title: Matrix QA
x-i18n:
    generated_at: "2026-07-12T14:26:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA レーンは、バンドルされた `@openclaw/matrix` Plugin を Docker 内の使い捨て Tuwunel ホームサーバーに対して実行します。一時的なドライバー、SUT、オブザーバーの各アカウントと、事前に用意されたルームを使用します。これは Matrix の実際のトランスポートを使用するライブカバレッジです。

メンテナー専用ツールです。パッケージ化された OpenClaw リリースには `qa-lab` が含まれないため、`openclaw qa` はソースチェックアウトからのみ実行できます。この場合、Plugin のインストール手順なしで、バンドルされたランナーを直接読み込みます。

QA フレームワーク全体の詳細については、[QA の概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

## クイックスタート

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

通常の `pnpm openclaw qa matrix` は `--profile all` を実行し、最初の失敗では停止しません。`--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` を使用すると、完全なインベントリを複数の並列ジョブに分割できます。

## レーンの処理内容

1. Docker 内に使い捨ての Tuwunel ホームサーバーをプロビジョニングします（デフォルトイメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名 `matrix-qa.test`、ポート `28008`）。その境界には、サイズ制限付きで機密情報をマスキングするリクエスト／レスポンスレコーダーを配置します。
2. 3 人の一時ユーザーを登録します。`driver`（受信トラフィックを送信）、`sut`（テスト対象の OpenClaw Matrix アカウント）、`observer`（第三者トラフィックを記録）です。
3. 選択したシナリオに必要なルーム（メイン、スレッド、メディア、再起動、セカンダリ、許可リスト、E2EE、検証用 DM など）を事前に用意します。
4. 記録された Tuwunel 境界に対して、基盤に依存しない `matrix-qa-v1` プロトコルプローブを実行します。ユニットテストでは Matrix プロトコルフィクスチャを使用してプローブ契約を検証します。実際の Crabline ターゲットの配線は、[#99707](https://github.com/openclaw/openclaw/pull/99707) の標準 QA トランスポートアダプターホストが担います。
5. 実際の Matrix Plugin を SUT アカウントに限定した子 OpenClaw Gateway を起動します。
6. シナリオを順番に実行し、ドライバー／オブザーバーの Matrix クライアントを通じてイベントを監視し、記録されたトラフィックからルート／状態の期待値を導出します。
7. ホームサーバーを終了し、レポートとエビデンスのアーティファクトを書き込んでから終了します。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 共通フラグ

| フラグ                | デフォルト                                    | 説明                                                                                                                                                 |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | シナリオプロファイル。[プロファイル](#profiles)を参照してください。                                                                                  |
| `--fail-fast`         | オフ                                          | 最初に失敗したチェックまたはシナリオの後で停止します。                                                                                               |
| `--scenario <id>`     | -                                             | このシナリオのみを実行します。複数回指定できます。[シナリオ](#scenarios)を参照してください。                                                        |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | レポート、サマリー、ルート／状態インベントリ、観測イベント、出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。                 |
| `--repo-root <path>`  | `process.cwd()`                               | 中立的な作業ディレクトリから起動する場合のリポジトリルートです。                                                                                     |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 設定内の Matrix アカウント ID です。                                                                                                      |

### プロバイダーフラグ

このレーンは実際の Matrix トランスポートを使用しますが、モデルプロバイダーは設定可能です。

| フラグ                   | デフォルト             | 説明                                                                                                                                                         |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--provider-mode <mode>` | `live-frontier`        | 決定論的なモックディスパッチには `mock-openai`、ライブのフロンティアプロバイダーには `live-frontier` を使用します。従来のエイリアス `live-openai` も引き続き使用できます。 |
| `--model <ref>`          | プロバイダーのデフォルト | プライマリの `provider/model` 参照です。                                                                                                                     |
| `--alt-model <ref>`      | プロバイダーのデフォルト | シナリオが実行途中で切り替える代替 `provider/model` 参照です。                                                                                               |
| `--fast`                 | オフ                   | サポートされている場合、プロバイダーの高速モードを有効にします。                                                                                             |

Matrix QA は `--credential-source` または `--credential-role` を受け付けません。このレーンでは使い捨てユーザーをローカルにプロビジョニングするため、リース対象となる共有認証情報プールはありません。

## プロファイル

| プロファイル    | 用途                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all`（デフォルト） | 完全なカタログです。低速ですが網羅的です。                                                                                                                                                                                                             |
| `fast`          | 命令型のライブトランスポート契約を検証するリリースゲート用サブセットです。メンションゲート、許可リストによるブロック、返信形式、再起動後の再開、リアクションの観測、exec 承認メタデータの配信、E2EE の基本返信を実行します。 |
| `transport`     | トランスポートレベルのスレッド、DM、ルーム、自動参加、メンション／許可リスト、承認、リアクションの各シナリオです。                                                                                                                                     |
| `media`         | 画像、音声、動画、PDF、EPUB の添付ファイルを対象とします。                                                                                                                                                                                            |
| `e2ee-smoke`    | 最小限の E2EE カバレッジです。基本的な暗号化返信、スレッドのフォローアップ、ブートストラップ成功を対象とします。                                                                                                                                       |
| `e2ee-deep`     | E2EE の状態喪失、バックアップ、鍵、復旧の各シナリオを網羅します。                                                                                                                                                                                      |
| `e2ee-cli`      | QA ハーネスを通じて実行される `openclaw matrix encryption setup` および `verify *` CLI シナリオです。                                                                                                                                                   |

正確なマッピングは `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` にあります。

## シナリオ

共有 Matrix アダプターは、`openclaw qa suite --channel-driver live --channel matrix` を通じて次の標準 YAML シナリオを公開します。

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` は明示的に `--scenario subagent-thread-spawn`
を選択すれば引き続き使用できますが、ライブでの子処理完了の検証が安定するまでは、デフォルトの共有 Matrix セットには含まれません。

残りの命令型シナリオ ID のリストは、`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` の `MatrixQaScenarioId` ユニオンです。カテゴリーは次のとおりです。

- スレッド: `matrix-thread-root-preservation`、`matrix-thread-nested-reply-shape`
- トップレベル／DM／ルーム: `matrix-top-level-reply-shape`、`matrix-room-*`、`matrix-dm-*`
- ストリーミングとツール進行状況: `matrix-room-partial-streaming-preview`、`matrix-room-quiet-streaming-preview`、`matrix-room-tool-progress-*`、`matrix-room-block-streaming`
- メディア: `matrix-media-type-coverage`、`matrix-room-image-understanding-attachment`、`matrix-attachment-only-ignored`、`matrix-unsupported-media-safe`
- ルーティング: `matrix-room-autojoin-invite`、`matrix-secondary-room-*`
- リアクション: `matrix-reaction-*`
- 承認: `matrix-approval-*`（exec／Plugin メタデータ、分割フォールバック、拒否リアクション、スレッド、`target: "both"` ルーティング）
- 再起動とリプレイ: `matrix-restart-*`、`matrix-stale-sync-replay-dedupe`、`matrix-room-membership-loss`、`matrix-homeserver-restart-resume`、`matrix-initial-catchup-then-incremental`
- メンションゲート、Bot 間通信、許可リスト: `matrix-mention-*`、`matrix-allowbots-*`、`matrix-allowlist-*`、`matrix-multi-actor-ordering`、`matrix-inbound-edit-*`、`matrix-mxid-prefixed-command-block`、`matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*`（基本返信、スレッドのフォローアップ、ブートストラップ、リカバリーキーのライフサイクル、状態喪失の各バリエーション、サーバーバックアップの動作、デバイス衛生、SAS／QR／DM 検証、再起動、アーティファクトのマスキング）
- E2EE CLI: `matrix-e2ee-cli-*`（暗号化設定、べき等な設定、ブートストラップ失敗、リカバリーキーのライフサイクル、複数アカウント、Gateway 返信の往復、自己検証）

任意に選んだセットを実行するには、`--scenario <id>`（複数回指定可能）を渡します。プロファイルによる制限を無視するには、`--profile all` と組み合わせます。

## 環境変数

| 変数                                    | デフォルト                                | 効果                                                                                                                                                                                           |
| --------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000`（30分）                         | 実行全体の厳格な上限。                                                                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | 最初のカナリア応答の上限。共有ランナーでは、シナリオのカバレッジが開始される前に低速な最初の Gateway ターンが失敗しないよう、リリース CI がこの値を引き上げます。                                |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | 応答なしを確認する否定アサーションの静穏時間枠。実行タイムアウト以下（`<=`）に制限されます。                                                                                                   |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Docker の終了処理の上限。失敗時の出力には、復旧用の `docker compose ... down --remove-orphans` コマンドが含まれます。                                                                            |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 別の Tuwunel バージョンに対して検証する場合に、ホームサーバーイメージを上書きします。                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | オン                                      | `0` にすると stderr の `[matrix-qa] ...` 進行状況行を非表示にします。`1` にすると強制的に表示します。                                                                                           |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | 編集済み                                  | `1` にすると、`matrix-qa-observed-events.json` にメッセージ本文と `formatted_body` を保持します。デフォルトでは、CI アーティファクトを安全に保つため編集されます。                              |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | オフ                                      | `1` にすると、アーティファクト書き込み後の決定論的な `process.exit` をスキップします。matrix-js-sdk のネイティブ暗号化ハンドルにより、アーティファクトの完了後もイベントループが存続する場合があるため、デフォルトでは強制終了します。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                    | 外部ランチャー（例：`scripts/run-node.mjs`）によって設定されている場合、Matrix QA は独自の tee を開始せず、そのログパスを再利用します。                                                        |

## 出力アーティファクト

`--output-dir` に書き込まれます（デフォルトは `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`。これにより、連続する実行で互いに上書きされません）。

- `matrix-qa-report.md`：Markdown 形式のプロトコルレポート（何が成功、失敗、スキップされ、その理由は何か）。
- `matrix-qa-summary.json`：CI の解析やダッシュボードに適した構造化サマリー。
- `matrix-qa-route-state-manifest.json`：シナリオ ID をキーとする動的な `matrix-qa-v1` インベントリ。編集済みのルート／本文の形状、リクエスト順序、観測された再試行、エラー、同期トークンの連続性、その実行中に観測されたデバイス／キー／メディア／バックアップの状態ファミリーを記録します。これは実行可能な証拠であり、チェックインされたベースラインではありません。
- `matrix-qa-observed-events.json`：ドライバークライアントとオブザーバークライアントから観測された Matrix イベント。`OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` でない限り本文は編集されます。承認メタデータは、選択された安全なフィールドと切り詰められたコマンドプレビューによって要約されます。
- `matrix-qa-output.log`：実行の stdout/stderr を結合したもの。`OPENCLAW_RUN_NODE_OUTPUT_LOG` が設定されている場合は、代わりに外部ランチャーのログが再利用されます。

## トリアージのヒント

- **実行が終了間際に停止する：** `matrix-js-sdk` のネイティブ暗号化ハンドルは、ハーネスより長く存続する場合があります。デフォルトでは、アーティファクト書き込み後にクリーンな `process.exit` を強制します。`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` を設定した場合は、プロセスがしばらく残ることを想定してください。
- **クリーンアップエラー：** 出力された復旧コマンド（`docker compose ... down --remove-orphans` の呼び出し）を探し、ホームサーバーのポートを解放するために手動で実行してください。
- **CI で否定アサーションの時間枠が不安定：** CI が高速な場合は `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（デフォルトは8秒）を下げ、低速な共有ランナーでは引き上げてください。
- **バグレポート用に編集済みの本文が必要：** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` を指定して再実行し、`matrix-qa-observed-events.json` を添付してください。生成されたアーティファクトは機密情報として扱ってください。
- **異なる Tuwunel バージョン：** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` にテスト対象のバージョンを指定してください。このレーンでは、固定されたデフォルトイメージのみをチェックインします。

## ライブトランスポート契約

Matrix は、[QA の概要：ライブトランスポートのカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)で定義された単一の契約チェックリストを共有する3つのライブトランスポートレーン（Matrix、Telegram、Discord）の1つです。`qa-channel` は引き続き広範な合成スイートであり、意図的にそのマトリックスには含まれていません。

## 関連項目

- [QA の概要](/ja-JP/concepts/qa-e2e-automation)：QA スタック全体とライブトランスポート契約
- [QA チャンネル](/ja-JP/channels/qa-channel)：リポジトリベースのシナリオ用の合成チャンネルアダプター
- [テスト](/ja-JP/help/testing)：テストの実行と QA カバレッジの追加
- [Matrix](/ja-JP/channels/matrix)：テスト対象のチャンネル Plugin
