---
read_when:
    - ローカルで pnpm openclaw qa matrix を実行する
    - Matrix QA シナリオの追加または選択
    - Matrix QA の失敗、タイムアウト、または進まないクリーンアップのトリアージ
summary: 'Docker ベースの Matrix ライブ QA レーン向けメンテナーリファレンス: CLI、プロファイル、環境変数、シナリオ、出力アーティファクト。'
title: Matrix QA
x-i18n:
    generated_at: "2026-04-30T05:09:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Matrix QA レーンは、同梱の `@openclaw/matrix` Plugin を Docker 内の使い捨て Tuwunel ホームサーバーに対して実行し、一時的な driver、SUT、observer アカウントと、シード済みルームを使用します。これは Matrix 向けのライブで実トランスポートを使うカバレッジです。

これはメンテナー専用ツールです。パッケージ化された OpenClaw リリースでは意図的に `qa-lab` を含めていないため、`openclaw qa` はソースチェックアウトからのみ利用できます。ソースチェックアウトでは同梱ランナーを直接読み込むため、Plugin のインストール手順は不要です。

より広い QA フレームワークの背景については、[QA 概要](/ja-JP/concepts/qa-e2e-automation)を参照してください。

## クイックスタート

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

通常の `pnpm openclaw qa matrix` は `--profile all` を実行し、最初の失敗では停止しません。リリースゲートには `--profile fast --fail-fast` を使用してください。全インベントリを並列実行するときは、`--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` でカタログをシャードしてください。

## レーンの処理内容

1. Docker 内に使い捨て Tuwunel ホームサーバーをプロビジョニングします（デフォルトイメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名 `matrix-qa.test`、ポート `28008`）。
2. 3 つの一時ユーザーを登録します — `driver`（インバウンドトラフィックを送信）、`sut`（テスト対象の OpenClaw Matrix アカウント）、`observer`（サードパーティトラフィックをキャプチャ）。
3. 選択されたシナリオで必要なルームをシードします（main、threading、media、restart、secondary、allowlist、E2EE、verification DM など）。
4. SUT アカウントにスコープされた実際の Matrix Plugin を使って子 OpenClaw Gateway を起動します。子プロセスでは `qa-channel` は読み込まれません。
5. シナリオを順番に実行し、driver/observer Matrix クライアントを通じてイベントを観測します。
6. ホームサーバーを破棄し、レポートとサマリーアーティファクトを書き出してから終了します。

## CLI

```text
pnpm openclaw qa matrix [options]
```

### 共通フラグ

| フラグ                  | デフォルト                                       | 説明                                                                                                            |
| --------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | シナリオプロファイル。[プロファイル](#profiles)を参照してください。                                                                           |
| `--fail-fast`         | off                                           | 最初に失敗したチェックまたはシナリオの後で停止します。                                                                         |
| `--scenario <id>`     | —                                             | このシナリオのみを実行します。繰り返し指定できます。[シナリオ](#scenarios)を参照してください。                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | レポート、サマリー、観測イベント、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`  | `process.cwd()`                               | 中立的な作業ディレクトリから呼び出す場合のリポジトリルートです。                                                        |
| `--sut-account <id>`  | `sut`                                         | QA Gateway 設定内の Matrix アカウント ID です。                                                                        |

### プロバイダーフラグ

このレーンは実際の Matrix トランスポートを使用しますが、モデルプロバイダーは設定可能です。

| フラグ                     | デフォルト          | 説明                                                                                                                               |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | 決定的なモックディスパッチには `mock-openai`、ライブのフロンティアプロバイダーには `live-frontier` を使用します。従来のエイリアス `live-openai` も引き続き動作します。 |
| `--model <ref>`          | provider default | プライマリの `provider/model` 参照です。                                                                                                             |
| `--alt-model <ref>`      | provider default | シナリオが実行途中で切り替える代替の `provider/model` 参照です。                                                                            |
| `--fast`                 | off              | サポートされている場合、プロバイダーの高速モードを有効にします。                                                                                                |

Matrix QA は `--credential-source` または `--credential-role` を受け付けません。このレーンはローカルで使い捨てユーザーをプロビジョニングします。リース対象の共有資格情報プールはありません。

## プロファイル

選択されたプロファイルによって、実行されるシナリオが決まります。

| プロファイル         | 用途                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | 完全なカタログです。低速ですが網羅的です。                                                                                                                                                                                                   |
| `fast`          | ライブトランスポート契約を検証するリリースゲート用サブセットです。canary、mention gating、allowlist block、reply shape、restart resume、thread follow-up、thread isolation、reaction observation、exec approval metadata delivery を実行します。 |
| `transport`     | トランスポートレベルの threading、DM、room、autojoin、mention/allowlist、approval、reaction シナリオです。                                                                                                                                  |
| `media`         | 画像、音声、動画、PDF、EPUB 添付ファイルのカバレッジです。                                                                                                                                                                                  |
| `e2ee-smoke`    | 最小限の E2EE カバレッジです — 基本的な暗号化返信、thread follow-up、bootstrap success。                                                                                                                                                  |
| `e2ee-deep`     | E2EE の state-loss、backup、key、recovery シナリオを網羅的に実行します。                                                                                                                                                                     |
| `e2ee-cli`      | QA ハーネスを通じて駆動される `openclaw matrix encryption setup` と `verify *` CLI シナリオです。                                                                                                                                       |

正確なマッピングは `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts` にあります。

## シナリオ

完全なシナリオ ID 一覧は、`extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15` の `MatrixQaScenarioId` union です。カテゴリには次のものがあります。

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- top-level / DM / room — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming と tool progress — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reactions — `matrix-reaction-*`
- approvals — `matrix-approval-*`（exec/plugin メタデータ、chunked fallback、deny reactions、threads、`target: "both"` routing）
- restart と replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating、bot-to-bot、allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*`（基本的な返信、thread follow-up、bootstrap、recovery key lifecycle、state-loss variants、server backup behavior、device hygiene、SAS / QR / DM verification、restart、artifact redaction）
- E2EE CLI — `matrix-e2ee-cli-*`（encryption setup、idempotent setup、bootstrap failure、recovery-key lifecycle、multi-account、gateway-reply round-trip、self-verification）

手動で選んだセットを実行するには `--scenario <id>`（繰り返し可）を渡します。プロファイルのゲートを無視するには `--profile all` と組み合わせてください。

## 環境変数

| 変数                                    | デフォルト                              | 効果                                                                                                                                                                                                 |
| --------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 分)                       | 実行全体の厳密な上限。                                                                                                                                                                               |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                 | 初期カナリア返信の上限。リリース CI では共有ランナー上でこの値を引き上げ、遅い最初の Gateway ターンによってシナリオカバレッジ開始前に失敗しないようにします。                                      |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                  | 返信なしの否定アサーション用の静かなウィンドウ。実行タイムアウト以下 (`≤`) にクランプされます。                                                                                                      |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                 | Docker ティアダウンの上限。失敗時の表示には、リカバリー用の `docker compose ... down --remove-orphans` コマンドが含まれます。                                                                        |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | 別の Tuwunel バージョンに対して検証するときに、ホームサーバーイメージを上書きします。                                                                                                                |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | オン                                    | `0` は stderr の `[matrix-qa] ...` 進捗行を抑制します。`1` は強制的に有効にします。                                                                                                                   |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | リダクト済み                            | `1` はメッセージ本文と `formatted_body` を `matrix-qa-observed-events.json` に保持します。デフォルトでは CI アーティファクトを安全に保つためリダクトします。                                        |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | オフ                                    | `1` はアーティファクト書き込み後の決定的な `process.exit` をスキップします。デフォルトでは、matrix-js-sdk のネイティブ暗号ハンドルがアーティファクト完了後もイベントループを生かし続ける可能性があるため、終了を強制します。 |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | 未設定                                  | 外側のランチャー (例: `scripts/run-node.mjs`) によって設定された場合、Matrix QA は独自の tee を開始せず、そのログパスを再利用します。                                                               |

## 出力アーティファクト

`--output-dir` に書き込まれます。

- `matrix-qa-report.md` — Markdown プロトコルレポート (何が成功し、失敗し、スキップされ、その理由は何か)。
- `matrix-qa-summary.json` — CI 解析とダッシュボードに適した構造化サマリー。
- `matrix-qa-observed-events.json` — ドライバークライアントとオブザーバークライアントから観測された Matrix イベント。`OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` でない限り本文はリダクトされます。承認メタデータは、選択された安全なフィールドと切り詰められたコマンドプレビューで要約されます。
- `matrix-qa-output.log` — 実行の stdout/stderr を結合したもの。`OPENCLAW_RUN_NODE_OUTPUT_LOG` が設定されている場合は、代わりに外側のランチャーのログが再利用されます。

デフォルトの出力ディレクトリは `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` なので、連続した実行で互いに上書きされません。

## トリアージのヒント

- **実行が終盤付近でハングする:** `matrix-js-sdk` のネイティブ暗号ハンドルはハーネスより長く残ることがあります。デフォルトでは、アーティファクト書き込み後にクリーンな `process.exit` を強制します。`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` の設定を解除している場合は、プロセスがしばらく残ることを想定してください。
- **クリーンアップエラー:** 出力されたリカバリーコマンド (`docker compose ... down --remove-orphans` の呼び出し) を探し、ホームサーバーポートを解放するために手動で実行してください。
- **CI で否定アサーションのウィンドウが不安定:** CI が高速な場合は `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (デフォルト 8 秒) を下げます。遅い共有ランナーでは引き上げます。
- **バグレポートにリダクト済み本文が必要:** `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` で再実行し、`matrix-qa-observed-events.json` を添付してください。生成されたアーティファクトは機密として扱ってください。
- **別の Tuwunel バージョン:** `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` をテスト対象バージョンに向けます。このレーンは、ピン留めされたデフォルトイメージのみをチェックします。

## ライブトランスポートコントラクト

Matrix は、[QA 概要 → ライブトランスポートカバレッジ](/ja-JP/concepts/qa-e2e-automation#live-transport-coverage)で定義された単一のコントラクトチェックリストを共有する、3 つのライブトランスポートレーン (Matrix、Telegram、Discord) の 1 つです。`qa-channel` は引き続き広範な合成スイートであり、意図的にそのマトリックスの一部ではありません。

## 関連

- [QA 概要](/ja-JP/concepts/qa-e2e-automation) — QA スタック全体とライブトランスポートコントラクト
- [QA Channel](/ja-JP/channels/qa-channel) — リポジトリに基づくシナリオ用の合成チャンネルアダプター
- [テスト](/ja-JP/help/testing) — テストの実行と QA カバレッジの追加
- [Matrix](/ja-JP/channels/matrix) — テスト対象のチャンネル Plugin
