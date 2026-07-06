---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターを拡張する
    - リポジトリに基づく QA シナリオの追加
    - Gateway ダッシュボードを中心とした、より高リアリズムな QA 自動化の構築
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリに裏付けられたシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート作成。'
title: QA の概要
x-i18n:
    generated_at: "2026-07-06T10:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a2d0f1edc82e778dbecf91c798cca5ef58468579248c40818715aa5c1cb5207
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、ユニットテストではできない現実的なチャネル形状で OpenClaw を実行します。

構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除サーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観測、インバウンドメッセージの注入、Markdown レポートのエクスポートを行うデバッガー UI と QA バス。
- `extensions/qa-matrix`: 子 QA Gateway 内で実際の Matrix Plugin を駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用の、リポジトリに裏付けられたシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実際のトランスポート、ブラウザスクリーンショット、VM 状態、PR エビデンスを必要とするバグ向けの前後ライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*` スクリプトエイリアスがあります。どちらの形式も動作します。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` なしのバンドル済み QA セルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を指定した、タクソノミーに裏付けられた成熟度プロファイルランナー。                                                                  |
| `qa suite`                                          | QA Gateway レーンに対して、リポジトリに裏付けられたシナリオを実行します。`--runner multipass` はホストの代わりに使い捨て Linux VM を使用します。                                                                                                                     |
| `qa coverage`                                       | YAML シナリオカバレッジインベントリを出力します（マシン出力には `--json`、触れた動作のシナリオ検索には `--match <query>`、ランタイムツールフィクスチャカバレッジには `--tools`）。                                                                                |
| `qa parity-report`                                  | モデル軸パリティゲート用に 2 つの `qa-suite-summary.json` ファイルを比較します。または `--runtime-axis --token-efficiency` を使用して、Codex 対 OpenClaw のランタイムパリティおよびトークン効率レポートを書き出します。                                             |
| `qa confidence-report`                              | マニフェストに対して QA 証明アーティファクトを分類し、不明ゼロの信頼度レポートにします。                                                                                                                                                                           |
| `qa confidence-self-test`                           | 信頼度ゲートがドリフトを検出することを証明する、シード済みネガティブコントロールカナリアを書き出します。                                                                                                                                                         |
| `qa jsonl-replay`                                   | キュレーション済み JSONL トランスクリプトをランタイムパリティ再生ハーネスで再生します。                                                                                                                                                                            |
| `qa character-eval`                                 | 複数のライブモデルにまたがってキャラクター QA シナリオを実行し、判定付きレポートを作成します。[レポート](#reporting)を参照してください。                                                                                                                          |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対してワンオフプロンプトを実行します。                                                                                                                                                                                          |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを開始します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                  |
| `qa docker-build-image`                             | 事前ベイク済み QA Docker イメージをビルドします。                                                                                                                                                                                                                  |
| `qa docker-scaffold`                                | QA ダッシュボード + Gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                                                                                                             |
| `qa up`                                             | QA サイトをビルドし、Docker ベースのスタックを開始して URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを開始します。                                                                                                                                                                                                                      |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを開始します。                                                                                                                                                                                                |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                           |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャネルに対するライブトランスポートレーン。                                                                                                                                                                                      |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix) を参照してください。                                                                                                                                          |
| `qa slack`                                          | 実際のプライベート Slack チャネルに対するライブトランスポートレーン。                                                                                                                                                                                              |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                           |
| `qa whatsapp`                                       | 実際の WhatsApp Web アカウントに対するライブトランスポートレーン。                                                                                                                                                                                                 |
| `qa mantis`                                         | Discord ステータスリアクションエビデンス、Crabbox デスクトップ/ブラウザスモーク、Slack-in-VNC スモークを備えた、ライブトランスポートバグ用の前後検証ランナー。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) を参照してください。 |

`qa matrix` はランナー Plugin（`extensions/qa-matrix`）として登録されています。上記の他のすべてのレーンは `qa-lab` に直接組み込まれています。

### プロファイルに裏付けられた `qa run`

プロファイルに裏付けられた `qa run` は `taxonomy.yaml` からメンバーシップを読み取り、解決されたシナリオを `qa suite` 経由でディスパッチします。`--surface` と `--category` は、別個のレーンを定義する代わりに、選択されたプロファイルをフィルタリングします。生成される `qa-evidence.json` には、選択カテゴリ数と欠落カバレッジ ID を含むプロファイルスコアカードサマリーが含まれます。個々のエビデンスエントリは、テスト、カバレッジロール、結果の真実のソースのままです。タクソノミー機能カバレッジ ID はエイリアスではなく、正確な証明ターゲットです。プライマリシナリオカバレッジは一致する ID を満たし、セカンダリカバレッジは助言にとどまります。カバレッジ ID は、小文字の英数字/ダッシュセグメントを持つドット区切りの `namespace.behavior` 形式を使用します。プロファイル、サーフェス、カテゴリ ID は、既存のダッシュ区切りまたはドット区切りのタクソノミー ID を引き続き使用できます。

スリムエビデンスはエントリごとの `execution` を省略し、`evidenceMode: "slim"` を設定します。`smoke-ci` はデフォルトでスリムになり、`--evidence-mode full` は完全なエントリを復元します。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデルプロバイダーと Crabline ローカルプロバイダーサーバーによる決定的なプロファイル証明には `smoke-ci` を使用します。ライブチャネルに対する Stable/LTS 証明には `release` を使用します。`all` は明示的な全タクソノミーエビデンス実行にのみ使用します。これはすべてのアクティブな成熟度カテゴリを選択し、`qa_profile=all` を指定して `QA Profile Evidence` GitHub Actions ワークフロー経由でディスパッチできます。コマンドに OpenClaw ルートプロファイルも必要な場合は、QA コマンドの前にルートプロファイルを置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在の QA オペレーターフローは、2 ペインの QA サイトです。

- 左: エージェントを備えた Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオプランを表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker ベースの Gateway レーンが開始され、QA Lab ページが公開されます。そこでオペレーターまたは自動化ループは、エージェントに QA ミッションを与え、実際のチャネル動作を観測し、何が動作したか、失敗したか、またはブロックされたままだったかを記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより高速に反復するには、バインドマウントされた QA Lab バンドルでスタックを開始します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上に維持し、`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Lab アセットハッシュが変わるとブラウザが自動リロードされます。

### 観測性スモーク

<Note>
観測性 QA はソースチェックアウト専用のままです。npm tarball は意図的に QA Lab（および `qa-channel`/`qa-matrix`）を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断インストルメンテーションを変更するときは、ビルド済みソースチェックアウトからこれらを実行してください。
</Note>

| エイリアス                            | 実行内容                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | ローカル OpenTelemetry レシーバーに加えて、`diagnostics-otel` を有効にした `otel-trace-smoke` シナリオ。                                |
| `pnpm qa:otel:collector-smoke`          | 実際の OpenTelemetry Collector Docker コンテナを背後に置いた同じレーン。エンドポイント配線または collector/OTLP 互換性を変更するときに使用します。 |
| `pnpm qa:prometheus:smoke`              | `diagnostics-prometheus` を有効にした `docker-prometheus-smoke` シナリオ。                                                              |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` の後に `qa:prometheus:smoke` を実行します。                                                                              |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` の後に `qa:prometheus:smoke` を実行します。                                                                    |

`qa:otel:smoke` はローカル OTLP/HTTP レシーバーを開始し、最小構成の QA-channel
エージェントターンを実行してから、トレース、メトリクス、ログがエクスポートされることを検証します。エクスポートされた
protobuf トレーススパンをデコードし、リリース上重要な形状をチェックします:
`openclaw.run`、`openclaw.harness.run`、最新の GenAI semantic-convention
モデル呼び出しスパン、`openclaw.context.assembled`、`openclaw.message.delivery`
がすべて存在する必要があります。このスモークは
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、モデル呼び出し
スパンは `{gen_ai.operation.name} {gen_ai.request.model}` 名を使用する必要があります。成功したターンでモデル
呼び出しが `StreamAbandoned` をエクスポートしてはなりません。生の診断
ID と `openclaw.content.*` 属性はトレースに含めない必要があります。このシナリオの
プロンプトは、固定マーカーで返信し、固定の
秘密文字列を含めないようモデルに求めます。生の OTLP ペイロードには、そのどちらも、またはシナリオ id から派生した QA
セッションキーも含まれてはなりません。これは QA スイート成果物の隣に `otel-smoke-summary.json`
を書き込みます。

`qa:prometheus:smoke` は未認証のスクレイプが拒否されることを検証し、その後、
認証済みスクレイプに、プロンプト内容、応答内容、生の診断識別子、認証
トークン、ローカルパスを含まないリリース上重要なメトリクスファミリーが含まれることを確認します。

### Matrix スモークレーン

モデルプロバイダーの認証情報を必要としない transport-real Matrix スモークレーンでは、
決定的なモック OpenAI プロバイダーを使って高速プロファイルを実行します:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

live-frontier プロバイダーレーンでは、OpenAI 互換の認証情報を
明示的に指定します:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、env vars、成果物
レイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要としては、これは
使い捨ての Tuwunel homeserver を Docker でプロビジョニングし、一時的な
driver/SUT/observer ユーザーを登録し、実際の Matrix Plugin をその transport にスコープされた子 QA
gateway 内で実行し（`qa-channel` なし）、その後 Markdown
レポート、JSON サマリー、観測イベント成果物、結合出力ログを
`.artifacts/qa-e2e/matrix-<timestamp>/` 配下に書き込みます。

シナリオは、単体テストではエンドツーエンドに証明できない transport 動作を対象にします:
メンションゲート、allow-bot ポリシー、許可リスト、トップレベル返信とスレッド
返信、DM ルーティング、リアクション処理、受信編集の抑制、再起動時の
リプレイ重複排除、homeserver 中断からの復旧、承認メタデータ配信、
メディア処理、Matrix E2EE のブートストラップ/復旧/検証フローです。
E2EE CLI プロファイルは、gateway 返信を確認する前に、同じ使い捨て homeserver を通じて
`openclaw matrix encryption setup` と検証コマンドも駆動します。

CI は
`.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とデフォルトの
手動実行では、QA が提供する live-frontier
認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使って高速 Matrix プロファイルを実行します。
手動の `matrix_profile=all` は 5 つのプロファイルシャードにファンアウトします: `transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli`。

### Discord Mantis シナリオ

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータス
リアクションタイムラインには `--scenario discord-status-reactions-tool-only` を使用し、実際の Discord スレッドを作成して `message.thread-reply`
が `filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment`
を使用します。これらのシナリオは、広範なスモークカバレッジではなく
前後比較の再現プローブであるため、デフォルトの
ライブ Discord レーンには含まれません。スレッド添付の Mantis ワークフローは、QA
環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、ログイン済み Discord Web 証跡動画も追加できます。その viewer プロファイルは視覚キャプチャ専用です。合否
判定は引き続き Discord REST oracle から得られます。

transport-real Discord、Slack、Telegram、WhatsApp スモークレーンでは:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

これらは、2 つの bot またはアカウント（driver +
SUT）を持つ既存の実チャンネルを対象にします。必須 env vars、シナリオリスト、出力成果物、Convex
認証情報プールは、下の
[Discord、Slack、Telegram、WhatsApp QA リファレンス](#discord-slack-telegram-and-whatsapp-qa-reference)
に記載されています。

### Mantis Slack デスクトップと視覚タスクランナー

VNC レスキュー付きの完全な Slack デスクトップ VM 実行では、次を実行します:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブ
レーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、
`slack-qa/`、`slack-desktop-smoke.png`、および
`slack-desktop-smoke.mp4`（動画キャプチャが利用可能な場合）を Mantis 成果物ディレクトリにコピーします。Crabbox デスクトップ/ブラウザリースは、キャプチャ
ツールとブラウザ/native-build ヘルパーパッケージを事前に提供するため、このシナリオが
フォールバックをインストールするのは古いリースのみであるべきです。Mantis は `mantis-slack-desktop-smoke-report.md` に合計および
フェーズ別のタイミングを報告するため、遅い実行では
リースのウォームアップ、認証情報の取得、リモートセットアップ、成果物コピーのどこに時間がかかったかが分かります。VNC 経由で Slack Web に
手動ログインした後は `--lease-id <cbx_...>` を再利用します。再利用されたリースは Crabbox の pnpm store キャッシュも
温かい状態に保ちます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内で install/build を
実行します。再利用するリモートワークスペースにすでに `node_modules` とビルド済み `dist/` がある場合にのみ
`--hydrate-mode prehydrated` を使用します。このモードは高コストな install/build ステップをスキップし、ワークスペースの準備ができていない場合は fail closed します。
`--gateway-setup` を指定すると、Mantis は永続的な
OpenClaw Slack gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、
このコマンドは通常の bot-to-bot Slack QA レーンを実行し、成果物キャプチャ後に終了します。

デスクトップ証拠付きでネイティブ Slack 承認 UI を証明するには、Mantis
承認チェックポイントモードを実行します:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と相互排他的です。Slack
承認シナリオを実行し、非承認シナリオ id を拒否し、各 pending
および resolved 承認状態で待機し、観測された Slack API メッセージを
`approval-checkpoints/<scenario>-pending.png` と
`approval-checkpoints/<scenario>-resolved.png` にレンダリングし、チェックポイント、
メッセージ証拠、確認応答、またはレンダリングされたスクリーンショットが欠落しているか
空の場合に失敗します。コールド CI リースでは
`slack-desktop-smoke.png` に Slack サインインが表示されることがあります。承認チェックポイント画像がこのレーンの視覚的
証拠です。

デフォルトのチェックポイント実行では、2 つの標準 Slack 承認シナリオを維持します。
いずれかのオプトイン Codex 承認ルートをキャプチャするには、
`--scenario slack-codex-approval-exec-native` または
`--scenario slack-codex-approval-plugin-native` で明示的に選択します。Mantis は両方を受け入れ、
同じ pending/resolved スクリーンショットペアを出力します。ランナーは、選択された各 Codex ルートについてチェックポイント
とリモートコマンドの期限を拡張し、完全な
承認、エージェント完了、resolved 更新シーケンスを完了できるようにします。

オペレーターチェックリスト、GitHub workflow dispatch コマンド、証拠コメント
契約、hydrate-mode 判断表、タイミング解釈、失敗
処理手順は
[Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

agent/CV 形式のデスクトップタスクでは、次を実行します:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` は Crabbox デスクトップ/ブラウザマシンをリースまたは再利用し、
`crabbox record --while` を開始し、ネストされた
`visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が
選択されている場合はスクリーンショットに対して `openclaw infer image
describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json`、および
`mantis-visual-task-report.md` を書き込みます。`--expect-text` が設定されている場合、vision
プロンプトは構造化 JSON 判定（`visible`、`evidence`、`reason`）を要求し、
モデルが `visible: true` を報告し、期待テキストを引用する証拠がある場合にのみ合格します。
ターゲットテキストを単に引用するだけの `visible: false` 応答は、引き続きアサーションに失敗します。画像理解プロバイダーを呼び出さずに
デスクトップ、ブラウザ、スクリーンショット、動画の配管を証明する no-model スモークには `--vision-mode metadata` を使用します。
録画は `visual-task` の必須成果物です。Crabbox が空でない
`visual-task.mp4` を記録しない場合、visual driver が合格していてもタスクは失敗します。失敗時、
Mantis は、タスクがすでに合格していて `--keep-lease` が設定されていない場合を除き、VNC 用にリースを保持します。

### 認証情報プールのヘルスチェック

プールされたライブ認証情報を使用する前に、次を実行します:

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker env（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）をチェックし、エンドポイント設定を検証し、
`OPENCLAW_QA_CONVEX_SECRET_CI` と
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` について set/missing ステータスのみを報告し、maintainer secret が存在する場合は admin/list 到達性を検証します。

## ライブ transport カバレッジ

ライブ transport レーンは、それぞれが独自の
シナリオリスト形状を作るのではなく、1 つの契約を共有します。`qa-channel` は広範な合成 product-behavior
スイートであり、ライブ transport カバレッジマトリクスの一部ではありません。

ライブ transport ランナーは、共有シナリオ id、ベースラインカバレッジ
ヘルパー、シナリオ選択ヘルパーを
`openclaw/plugin-sdk/qa-live-transport-scenarios` からインポートします。

| レーン     | カナリア | メンションゲーティング | ボット間 | 許可リストブロック | トップレベル返信 | 引用返信 | 再起動後の再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持され、Matrix、
Telegram、および他のライブトランスポートは、明示的なトランスポート契約
チェックリストを共有します。

QA パスに Docker を持ち込まずに使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw
をビルドし、`qa suite` を実行した後、通常の QA レポートと
サマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。ホスト上の
`qa suite` と同じシナリオ選択動作を再利用します。

ホストおよび Multipass のスイート実行では、デフォルトで、分離された Gateway ワーカーを使って
複数の選択済みシナリオを並列実行します。`qa-channel` のデフォルトは
同時実行数 4 で、選択されたシナリオ数を上限とします。ワーカー数を調整するには
`--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。
パーソナルアシスタントのベンチマークパック（10
シナリオ）を実行するには `--pack personal-agent` を使用します。パックセレクターは、繰り返し指定した `--scenario` フラグに対して加算的です。
明示シナリオが先に実行され、その後にパックシナリオがパック順で実行され、
重複は削除されます。カスタム QA ランナーが OpenTelemetry コレクターのセットアップをすでに提供している場合に、
`otel-trace-smoke` と `docker-prometheus-smoke` シナリオをまとめて選択するには
`--pack observability` を使用します。

いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトを取得したい場合は、`--allow-failures` を使用します。

ライブ実行では、ゲストに渡すことが実用的な、サポート済みの QA 認証入力を転送します。
環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および
存在する場合の `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、
`--output-dir` はリポジトリルート配下に置いてください。

## Discord、Slack、Telegram、WhatsApp QA リファレンス

Matrix はシナリオ数と Docker ベースのホームサーバープロビジョニングのため、
[専用ページ](/ja-JP/concepts/qa-matrix)があります。Discord、Slack、Telegram、
WhatsApp は既存の実際のトランスポートに対して実行されるため、
それらのリファレンスはここにあります。

### 共通 CLI フラグ

これらのレーンは
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、
同じフラグを受け付けます。

| フラグ                                  | デフォルト                                            | 説明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオのみを実行します。繰り返し指定できます。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、証拠、トランスポート固有のアーティファクト、および出力ログが書き込まれる場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント ID です。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                   | プライマリ/代替モデル参照です。                                                                                                                   |
| `--fast`                              | オフ                                                | サポートされている場合のプロバイダー高速モードです。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 資格情報プール](#convex-credential-pool)を参照してください。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                 | `--credential-source convex` の場合に使用されるロールです。                                                                                                    |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は
失敗終了コードを設定せずにアーティファクトを書き込みます。Telegram は利用可能なシナリオ ID を出力して終了する
`--list-scenarios` も受け付けます。他のレーンは
そのフラグを公開していません。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（ドライバー +
SUT）を持つ、実際のプライベート Telegram グループ 1 つを対象にします。SUT ボットには Telegram ユーザー名が必要です。両方のボットで
`@BotFather` の **Bot-to-Bot Communication Mode** を有効にすると、
ボット間観測が最も安定します。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

シナリオ（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`）:

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

暗黙のデフォルトセットは常に、カナリア、メンションゲーティング、ネイティブコマンド
返信、コマンド宛先指定、ボット間グループ返信をカバーします。`mock-openai`
のデフォルトには、決定論的な返信チェーンと最終メッセージストリーミング
チェックも含まれます。`telegram-current-session-status-tool` と
`telegram-tool-only-usage-footer` は引き続きオプトインです。前者はカナリアの直後に直接スレッド化された場合にのみ安定し、
後者はツールのみの返信における `/usage` フッターの実 Telegram 証拠です。
現在のデフォルト/任意の分割と回帰参照を出力するには、`pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` を使用します。

出力アーティファクト:

- `telegram-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリです。
  profile、coverage、provider、channel、artifacts、result、RTT
  フィールドを含みます。

パッケージ Telegram 実行は、同じ Telegram 資格情報契約を使用します。反復 RTT
測定は、通常のパッケージ Telegram ライブレーンの一部です。RTT
分布は、選択された RTT チェックの `result.timing` の下で
`qa-evidence.json` に組み込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、パッケージライブラッパーは
`kind: "telegram"` 資格情報をリースし、リースされたグループ/ドライバー/SUT
ボットの環境変数をインストール済みパッケージ実行にエクスポートし、リースに Heartbeat を送り、
シャットダウン時に解放します。パッケージラッパーのデフォルトは、
`telegram-mentioned-message-reply` の 20 回の RTT チェック、30 秒の RTT タイムアウト、および Convex が選択されている場合の
CI 外での Convex ロール `maintainer` です。個別の RTT コマンドや Telegram 固有のサマリー形式を作成せずに
RTT 測定を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または
`OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットを持つ、実際のプライベート Discord ギルドチャンネル 1 つを対象にします。ハーネスで制御されるドライバーボットと、
バンドルされた Discord Plugin を通じて子 OpenClaw Gateway によって起動される SUT ボットです。チャンネルメンション処理、
SUT ボットが Discord にネイティブ `/help` コマンドを登録済みであること、
およびオプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT ボットユーザー ID と一致している必要があります
  （一致しない場合、このレーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージアーティファクトに
  メッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は
  `discord-voice-autojoin` の音声/ステージチャンネルを選択します。指定しない場合、シナリオは SUT ボットに表示される最初の
  音声/ステージチャンネルを選択します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオです。単独で実行され、
  `channels.discord.voice.autoJoin` を有効にし、SUT ボットの現在の
  Discord 音声状態が対象の音声/ステージチャンネルであることを検証します。Convex Discord
  資格情報には任意の `voiceChannelId` を含めることができます。含まれない場合、ランナーは
  ギルド内で最初に表示される音声/ステージチャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。
  SUT を常時オンでツールのみのギルド返信に切り替え、
  `messages.statusReactions.enabled=true` を設定したうえで、REST
  リアクションタイムラインと HTML/PNG 視覚アーティファクトをキャプチャするため、単独で実行されます。Mantis の前後
  レポートは、シナリオが提供する MP4 アーティファクトも `baseline.mp4`
  および `candidate.mp4` として保持します。
- `discord-thread-reply-filepath-attachment` - オプトインの Mantis シナリオです。
  [Discord Mantis シナリオ](#discord-mantis-scenarios)を参照してください。

Discord 音声自動参加シナリオを明示的に実行します。

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis ステータスリアクションシナリオを明示的に実行します:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

出力アーティファクト:

- `discord-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンス項目。
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
  でない限り、本文は編集済み。
- ステータスリアクションシナリオが実行された場合は
  `discord-qa-reaction-timelines.json` と
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

1 つの実際のプライベート Slack チャンネルを対象に、2 つの異なる bot を使用する。ハーネスが制御するドライバー bot と、バンドルされた Slack Plugin を通じて子 OpenClaw Gateway が起動する SUT bot。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は observed-message アーティファクトにメッセージ本文を保持する。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は Mantis 用の視覚的承認チェックポイントを有効にする。ランナーは `<scenario>.pending.json` と
  `<scenario>.resolved.json` を書き込み、一致する `.ack.json` ファイルを待機する。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` はチェックポイント確認タイムアウトを上書きする。デフォルトは `120000`。

シナリオ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-reaction-glyph-native` - オプトインのライブ message-tool リアクションシナリオ。
  エージェントに正確な `✅` グリフを渡すよう指示し、対象メッセージ上の SUT bot について Slack が `white_check_mark` を保存したことを確認する。
- `slack-approval-exec-native` - オプトインのネイティブ Slack exec 承認シナリオ。
  Gateway を通じて exec 承認を要求し、Slack メッセージにネイティブ承認ボタンがあることを検証し、それを解決して、解決済み Slack 更新を検証する。
- `slack-approval-plugin-native` - オプトインのネイティブ Slack Plugin 承認シナリオ。exec と Plugin 承認の転送を同時に有効にし、Plugin イベントが exec 承認ルーティングによって抑制されないようにしたうえで、同じ pending/resolved ネイティブ Slack UI パスを検証する。
- `slack-codex-approval-exec-native` - オプトインの Codex Guardian コマンド承認シナリオ。Codex Plugin を Guardian モードで有効化し、Slack 起点の Gateway エージェントターンを Codex app-server ハーネス経由でルーティングし、
  `openclaw-codex-app-server` に対するネイティブ Slack Plugin 承認プロンプトを待機して解決し、Codex ターンが期待されるコマンド出力とアシスタントマーカーで終了することを検証する。
- `slack-codex-approval-plugin-native` - オプトインの Codex Guardian ファイル承認シナリオ。ワークスペース外の `apply_patch` 指示を使用して Codex に app-server ファイル変更承認ルートを発行させたうえで、同じネイティブ Slack の pending/resolved 承認パス、最終アシスタントマーカー、正確なファイル内容をクリーンアップ前に検証する。

Codex 承認シナリオには、`openai/*` または `codex/*` の `--model`、通常のライブモデル認証情報、そして Codex Plugin が受け入れる Codex auth または API-key auth が必要。
Slack レポートには、編集済み Slack 承認メタデータとともに、Codex app-server メソッド、選択された Codex モデルキー、最終 Codex ターンステータス、operation-marker 検証が含まれる。

出力アーティファクト:

- `slack-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンス項目。
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`
  でない限り、本文は編集済み。
- `approval-checkpoints/` - Mantis が
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` を設定した場合のみ。チェックポイント JSON、確認 JSON、pending/resolved のスクリーンショットを含む。

#### Slack ワークスペースの設定

このレーンには、1 つのワークスペース内に 2 つの異なる Slack アプリと、両方の bot がメンバーになっているチャンネルが必要:

- `channelId` - 両方の bot が招待されているチャンネルの `Cxxxxxxxxxx` id。専用チャンネルを使用すること。このレーンは実行ごとに投稿する。
- `driverBotToken` - **ドライバー**アプリの bot トークン (`xoxb-...`)。
- `sutBotToken` - **SUT**アプリの bot トークン (`xoxb-...`)。bot ユーザー id が異なるように、ドライバーとは別の Slack アプリでなければならない。
- `sutAppToken` - `connections:write` を持つ SUT アプリのアプリレベルトークン (`xapp-...`)。SUT アプリがイベントを受信できるよう Socket Mode で使用される。

本番ワークスペースを再利用するよりも、QA 専用の Slack ワークスペースを推奨する。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール (`extensions/slack/src/setup-shared.ts:12`) を、ライブ Slack QA スイートでカバーされる権限とイベントに意図的に絞っている。ユーザーが見る本番チャンネル設定については、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup) を参照。QA のドライバー/SUT ペアは、1 つのワークスペース内に 2 つの異なる bot ユーザー id が必要なため、意図的に分離されている。

**1. ドライバーアプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動 → _新しいアプリを作成_ →
_マニフェストから_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから、
_ワークスペースにインストール_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

_Bot User OAuth Token_ (`xoxb-...`) をコピーする。これが `driverBotToken` になる。ドライバーに必要なのはメッセージの投稿と自身の識別だけで、イベントも Socket Mode も不要。

**2. SUT アプリを作成する**

同じワークスペースで _新しいアプリを作成 → マニフェストから_ を繰り返す。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト (`extensions/slack/src/setup-shared.ts:12`) のより狭いバージョンを意図的に使用する。ライブ Slack QA スイートはまだリアクション処理をカバーしていないため、リアクションのスコープとイベントは省略されている。

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Slack がアプリを作成したら、その設定ページで 2 つのことを行う:

- _ワークスペースにインストール_ → _Bot User OAuth Token_ をコピー → これが `sutBotToken` になる。
- _基本情報 → App-Level Tokens → トークンとスコープを生成_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` 値をコピー → これが `sutAppToken` になる。

各トークンで `auth.test` を呼び出し、2 つの bot が異なるユーザー id を持つことを確認する。ランタイムはユーザー id でドライバーと SUT を区別する。両方に 1 つのアプリを再利用すると、mention-gating が即座に失敗する。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル (例: `#openclaw-qa`) を作成し、チャンネル内から両方の bot を招待する:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_チャンネル情報 → 概要 → Channel ID_ から `Cxxxxxxxxxx` id をコピーする。これが `channelId` になる。パブリックチャンネルで問題ない。プライベートチャンネルを使用する場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功する。

**4. 認証情報を登録する**

選択肢は 2 つ。単一マシンでのデバッグには env vars を使用する (4 つの
`OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡す)。または、CI と他のメンテナーがリースできるように共有 Convex プールをシードする。

Convex プールの場合、4 つのフィールドを JSON ファイルに書き込む:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` を export した状態で、登録して検証する:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなしを期待する。

**5. エンドツーエンドで検証する**

両方の bot がブローカーを通じて互いに通信できることを確認するため、レーンをローカルで実行する:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功した実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` には `slack-canary` と `slack-mention-gating` の両方がステータス `pass` と表示される。レーンが約 90 秒間ハングして `Convex credential pool exhausted
for kind "slack"` で終了する場合、プールが空か、すべての行がリース済みである。`qa
credentials list --kind slack --status all --json` でどちらかが分かる。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

2 つの専用 WhatsApp Web アカウントを対象にする。ハーネスが制御するドライバーアカウントと、バンドルされた WhatsApp Plugin を通じて子 OpenClaw Gateway が起動する SUT アカウント。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

任意:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は `whatsapp-mention-gating`、
  `whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、グループ action/media/poll シナリオ、
  および `whatsapp-group-allowlist-block` などのグループシナリオを有効にする。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` は observed-message アーティファクトにメッセージ本文を保持する。

シナリオカタログ (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- ベースラインとグループゲーティング: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- ネイティブコマンド: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- 返信と最終出力の挙動: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- ユーザーパスのメッセージアクション: `whatsapp-agent-message-action-react` は
  実際のドライバーDMから開始し、モデルに `message` ツールを呼び出させ、
  ネイティブの WhatsApp リアクションを観測します。`whatsapp-agent-message-action-upload-file`
  は `message(action=upload-file)` に同じ姿勢を使い、ネイティブの WhatsApp メディアを観測します。
  `whatsapp-group-agent-message-action-react` と
  `whatsapp-group-agent-message-action-upload-file` は、実際の WhatsApp グループで
  同じユーザー可視アクションを証明します。
- グループファンアウト: `whatsapp-broadcast-group-fanout` は、メンションされた
  1つの WhatsApp グループメッセージから開始し、`main`
  と `qa-second` からの別々の可視返信を検証します。
- グループ有効化: `whatsapp-group-activation-always` は実際のグループ
  セッションを `/activation always` に変更し、メンションされていないグループメッセージで
  エージェントが起動することを証明してから、`/activation mention` に戻します。
  `whatsapp-group-reply-to-bot-triggers` はボット返信をシードし、明示的なメンションなしで
  それに対するネイティブの引用返信を送信し、その返信コンテキストから
  エージェントが起動することを検証します。
- 受信メディアと構造化メッセージ: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  これらは実際の WhatsApp 画像、音声、ドキュメント、位置情報、連絡先、
  ステッカー、リアクションイベントをドライバー経由で送信します。
- 直接 Gateway 契約プローブ: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. これらは意図的にモデルプロンプトをバイパスし、
  決定的な Gateway/チャネルの `send`、`poll`、および
  `message.action` 契約を証明します。
- アクセス制御カバレッジ: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- ネイティブ承認: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- ステータスリアクション: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

カタログには現在52個のシナリオが含まれています。`live-frontier` のデフォルトレーンは、
高速なスモークカバレッジのために10個のシナリオに小さく保たれています。`mock-openai`
デフォルトレーンは、モデル出力のみをモックしながら、実際の WhatsApp
トランスポートを通じて45個のシナリオを決定的に実行します。承認シナリオといくつかの
重い/ブロッキングチェックは、シナリオIDで明示的に指定されたままです。

WhatsApp QA ドライバーは構造化されたライブイベント（`text`, `media`,
`location`, `reaction`, `poll`）を観測し、メディア、投票、
連絡先、位置情報、ステッカーを能動的に送信できます。QA Lab は、そのドライバーを
プライベートな WhatsApp ランタイムファイルに踏み込むのではなく、
`@openclaw/whatsapp/api.js` パッケージサーフェス経由でインポートします。
グループ観測では、`fromJid` はグループJIDであり、`participantJid` と
`fromPhoneE164` は参加者の送信者を識別します。
メッセージ内容はデフォルトで編集されます。直接 Gateway の投票、upload-file、
メディア、グループ投票、グループメディア、返信形状プローブは、トランスポート/API
契約チェックです。ユーザープロンプトによってエージェントが同じアクションを選んだことの
証明としては扱われません。ユーザーパスのアクション証明は、
`whatsapp-agent-message-action-react` や
`whatsapp-group-agent-message-action-react` のようなシナリオから得られます。そこでは、
ドライバーが通常の WhatsApp メッセージを送信し、QA Lab が結果として生じる
ネイティブ WhatsApp アーティファクトを観測します。WhatsApp レポートには、
各シナリオの姿勢（`user-path`,
`direct-gateway`, または `native-approval`）が含まれるため、証拠が実際に証明するより
強い契約と誤認されることはありません。

出力アーティファクト:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`
  でない限り本文は編集されます。

### Convex 認証情報プール

Discord、Slack、Telegram、WhatsApp レーンは、上記の環境変数を読む代わりに
共有 Convex プールから認証情報をリースできます。
`--credential-source convex` を渡すか、`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。
QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。
プール種別は `"discord"`、`"slack"`、
`"telegram"`、`"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` は数値のチャットID文字列でなければなりません。
- Telegram 実ユーザー (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  Mantis Telegram Desktop 証明専用です。汎用 QA Lab レーンは
  この種別を取得してはなりません。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話番号は別々の E.164 文字列でなければなりません。

Mantis Telegram Desktop 証明ワークフローは、TDLib CLI ドライバーと Telegram Desktop
証人の両方に対して1つの排他的な Convex
`telegram-user` リースを保持し、証明の公開後に解放します。

PR に決定的なビジュアル差分が必要な場合、Mantis は Telegram フォーマッターまたは
配信レイヤーが変更されている間、`main` と PR head で同じモックモデル返信を使用できます。
キャプチャのデフォルトは PR コメント向けに調整されています。標準の
Crabbox クラス、24fps のデスクトップ録画、24fps のモーションGIF、1920px のプレビュー幅です。
前後比較コメントでは、意図したGIFのみを含むクリーンなバンドルを公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形状チェックは現在、ブローカーではなく
Slack QA ランナーにあります。`{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用し、
Slack チャネルIDは `Cxxxxxxxxxx` のようにします。アプリとスコープのプロビジョニングについては、
[Slack ワークスペースの設定](#setting-up-the-slack-workspace) を参照してください。

運用環境変数と Convex ブローカーエンドポイント契約は
[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)
にあります（セクション名はマルチチャネルプール以前のものですが、リースセマンティクスは
種別全体で共有されます）。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

これらは意図的に git に入っているため、QA 計画は人間とエージェントの両方に可視です。

`qa-lab` は汎用 YAML シナリオランナーのままです。各シナリオ YAML ファイルは
1回のテスト実行の信頼できる情報源であり、次を定義する必要があります:

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意のカテゴリ、機能、レーン、リスクメタデータ
- `scenario` 内のドキュメント参照とコード参照
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の Gateway 設定パッチ
- フローシナリオ用の実行可能なトップレベル `flow`、または
  Vitest と Playwright シナリオ用の `scenario.execution.kind` / `scenario.execution.path`

`flow` を支える再利用可能なランタイムサーフェスは、汎用で横断的なままです。
たとえば、YAML シナリオは、特別なランナーを追加せずに、トランスポート側ヘルパーと、
Gateway `browser.request` seam 経由で埋め込み Control UI を操作するブラウザー側ヘルパーを
組み合わせることができます。

シナリオファイルは、ソースツリーのフォルダーではなく、プロダクト機能ごとにグループ化する必要があります。
ファイルが移動してもシナリオIDは安定させ、実装の追跡可能性には `docsRefs` と
`codeRefs` を使用してください。

ベースラインリストは、次をカバーするのに十分な広さを保つ必要があります:

- DM とチャネルチャット
- スレッド挙動
- メッセージアクションライフサイクル
- cron コールバック
- メモリ呼び出し
- モデル切り替え
- サブエージェントの引き継ぎ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク1つ

## プロバイダーモックレーン

`qa suite` には2つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。リポジトリに裏付けられた QA と
  パリティゲートのデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジ用に
  AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、
  `mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、それぞれのデフォルト、ローカルサーバー起動、Gateway モデル設定、
認証プロファイルのステージング要件、ライブ/モック機能フラグを所有します。共有スイートと
Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを経由してルーティングします。

## トランスポートアダプター

`qa-lab` は YAML QA シナリオ用の汎用トランスポート seam を所有します。`qa-channel` は
合成デフォルトです。`crabline` はローカルのプロバイダー形状サーバーを起動し、
OpenClaw の通常のチャネル Plugin をそれらに対して実行します。`live` は実際の
プロバイダー認証情報と外部チャネル用に予約されています。

アーキテクチャレベルでの分割は次のとおりです:

- `qa-lab` は汎用シナリオ実行、ワーカー並行性、アーティファクト書き込み、
  レポート作成を所有します。
- トランスポートアダプターは、Gateway 設定、準備完了、受信および送信の観測、
  トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の YAML シナリオファイルがテスト実行を定義し、`qa-lab`
  はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャネルの追加

YAML QA システムにチャネルを追加するには、チャネル実装に加えて、チャネル契約を検証する
シナリオパックが必要です。スモーク CI カバレッジには、対応する Crabline ローカル
プロバイダーサーバーを追加し、`crabline` ドライバー経由で公開します。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを
追加しないでください。

`qa-lab` は共有ホスト機構を所有します:

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並行性
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を所有します:

- `openclaw qa <runner>` が共有 `qa` ルートの下にどのようにマウントされるか
- そのトランスポート向けに Gateway がどのように設定されるか
- 準備完了がどのようにチェックされるか
- 受信イベントがどのように注入されるか
- 送信メッセージがどのように観測されるか
- トランスクリプトと正規化されたトランスポート状態がどのように公開されるか
- トランスポートに裏付けられたアクションがどのように実行されるか
- トランスポート固有のリセットまたはクリーンアップがどのように処理されるか

新しいチャネルの最小採用基準:

1. 共有 `qa` ルートの所有者は `qa-lab` のままにします。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは、ランナープラグインまたはチャネルハーネス内に保持します。
4. 競合するルートコマンドを登録する代わりに、ランナーを `openclaw qa <runner>` としてマウントします。ランナープラグインは `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別々のエントリポイントの背後に置きます。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で YAML シナリオを作成または適応します。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させたままにします。

判定ルールは厳格です。

- 動作を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 動作が 1 つのチャネルトランスポートに依存する場合は、そのランナープラグインまたはプラグインハーネスに保持します。
- シナリオが複数のチャネルで使える新しい機能を必要とする場合は、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- 動作が 1 つのトランスポートに対してのみ意味を持つ場合は、シナリオをトランスポート固有のままにし、そのことをシナリオ契約で明示します。

### シナリオヘルパー名

新しいシナリオで推奨される汎用ヘルパー:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

既存シナリオ向けの互換エイリアスとして、`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` は引き続き利用できます。ただし、新しいシナリオの作成では汎用名を使用する必要があります。これらのエイリアスは一斉移行を避けるために存在しており、今後のモデルではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。レポートは次の問いに答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のあるフォローアップシナリオは何か

利用可能なシナリオの一覧を確認するには、`pnpm openclaw qa coverage` を実行します。これはフォローアップ作業の規模を見積もる場合や新しいトランスポートを配線する場合に役立ちます。機械可読出力には `--json` を追加します。変更された動作またはファイルパスに対して重点的な証明を選ぶ場合は、`pnpm openclaw qa coverage --match <query>` を実行します。マッチレポートはシナリオメタデータ、ドキュメント参照、コード参照、カバレッジ ID、プラグイン、プロバイダー要件を検索し、一致する `qa suite --scenario ...` ターゲットを出力します。

各 `qa suite` 実行は、選択されたシナリオセットについて、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き込みます。`execution.kind: vitest` または `execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、シナリオごとのログも書き込みます。`execution.kind: script` を宣言するシナリオは、`execution.path` のエビデンス生成プロデューサーを `node --import tsx` 経由で実行します（`execution.args` 内の `${outputDir}` と `${scenarioId}` は展開されます）。プロデューサーは独自の `qa-evidence.json` を書き込み、そのエントリはスイート出力にインポートされ、アーティファクトパスはそのプロデューサーの `qa-evidence.json` からの相対パスとして解決されます。`qa run --qa-profile` 経由で `qa suite` に到達した場合、同じ `qa-evidence.json` には、選択されたタクソノミーカテゴリのプロファイルスコアカード概要も含まれます。

カバレッジ出力は検出の補助として扱い、ゲートの代替として扱わないでください。選択したシナリオには、テスト対象の動作に適したプロバイダーモード、ライブトランスポート、Multipass、Testbox、またはリリースレーンが依然として必要です。スコアカードの背景については、[成熟度スコアカード](/ja-JP/maturity/scorecard) を参照してください。

キャラクターとスタイルのチェックでは、同じシナリオを複数のライブモデル参照に対して実行し、判定済みの Markdown レポートを書き込みます。

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター評価シナリオでは `SOUL.md` を通じてペルソナを設定し、その後チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには評価中であることを伝えないでください。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録したうえで、サポートされる場合は `xhigh` 推論を使った高速モードで判定モデルに依頼し、自然さ、雰囲気、ユーモアで実行を順位付けします。プロバイダーを比較する場合は `--blind-judge-models` を使用します。判定プロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後に順位を実際の参照へ対応付けます。

候補実行はデフォルトで `high` thinking を使用します。ただし、GPT-5.5 では `medium`、それをサポートする古い OpenAI 評価参照では `xhigh` を使用します。特定の候補は `--model provider/model,thinking=<level>` でインライン指定して上書きできます。インラインオプションは `fast`、`no-fast`、`fast=<bool>` もサポートします。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために保持されています。OpenAI 候補参照は、プロバイダーがサポートする場合に優先処理が使われるよう、デフォルトで高速モードになります。すべての候補モデルで高速モードを強制したい場合にのみ `--fast` を渡します。候補と判定の所要時間はベンチマーク分析のためにレポートへ記録されますが、判定プロンプトでは速度で順位付けしないよう明示されます。候補モデル実行と判定モデル実行はいずれもデフォルトで並行数 16 です。プロバイダー制限やローカル Gateway の負荷によって実行ノイズが大きくなる場合は、`--concurrency` または `--judge-concurrency` を下げます。

候補 `--model` が渡されない場合、キャラクター評価のデフォルトは `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` です。`--judge-model` が渡されない場合、判定モデルのデフォルトは `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-8,thinking=high` です。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [個人エージェントベンチマークパック](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA チャネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
