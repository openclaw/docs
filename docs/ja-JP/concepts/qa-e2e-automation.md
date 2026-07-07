---
read_when:
    - QA スタックの構成を理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリに基づく QA シナリオの追加
    - Gateway ダッシュボードを中心に、より現実に近い QA 自動化を構築する
summary: 'QA スタック概要: qa-lab、qa-channel、リポジトリに基づくシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA 概要
x-i18n:
    generated_at: "2026-07-06T21:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 593069626405668b3691717dd361f3310e148e60fdd5d9b5ac7b5c4898b2c3fd
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、ユニットテストでは不可能な、現実的でチャネルに沿った形で OpenClaw を演習します。

構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除のサーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、受信メッセージの注入、Markdown レポートのエクスポートを行うデバッガー UI と QA バス。
- `extensions/qa-matrix`: 子 QA Gateway 内で実際の Matrix Plugin を駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用のリポジトリ裏付けシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実際のトランスポート、ブラウザーのスクリーンショット、VM 状態、PR エビデンスが必要なバグ向けの、前後ライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*` スクリプトエイリアスがあります。どちらの形式も機能します。

| コマンド                                             | 目的                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` なしのバンドル済み QA セルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を使う、タクソノミー裏付けの成熟度プロファイルランナー。                                                                                                  |
| `qa suite`                                          | QA Gateway レーンに対してリポジトリ裏付けシナリオを実行します。`--runner multipass` はホストの代わりに使い捨て Linux VM を使用します。                                                                                                                                         |
| `qa coverage`                                       | YAML シナリオカバレッジインベントリを出力します（機械出力には `--json`、変更対象の挙動に対応するシナリオを見つけるには `--match <query>`、ランタイムツールフィクスチャカバレッジには `--tools`）。                                                                                  |
| `qa parity-report`                                  | モデル軸パリティゲート用に 2 つの `qa-suite-summary.json` ファイルを比較します。または `--runtime-axis --token-efficiency` を使って Codex 対 OpenClaw のランタイムパリティとトークン効率レポートを書き込みます。                                                                          |
| `qa confidence-report`                              | マニフェストに照らして QA 証明アーティファクトを分類し、unknown がゼロの信頼度レポートを作成します。                                                                                                                                                                               |
| `qa confidence-self-test`                           | 信頼度ゲートがドリフトを検出できることを証明する、シード済みのネガティブコントロールカナリアを書き込みます。                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | キュレーション済み JSONL トランスクリプトを、ランタイムパリティ再生ハーネスを通じて再生します。                                                                                                                                                                                         |
| `qa character-eval`                                 | 判定付きレポートを伴って、複数のライブモデルに対してキャラクター QA シナリオを実行します。[レポート](#reporting) を参照してください。                                                                                                                                                        |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                                                                                                      |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを開始します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                |
| `qa docker-build-image`                             | 事前ベイク済み QA Docker イメージをビルドします。                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | QA ダッシュボード + Gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                                                                                                                                |
| `qa up`                                             | QA サイトをビルドし、Docker 裏付けスタックを開始し、URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                                              |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを開始します。                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを開始します。                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                           |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャネルに対するライブトランスポートレーン。                                                                                                                                                                                                   |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix) を参照してください。                                                                                                                                                                  |
| `qa slack`                                          | 実際のプライベート Slack チャネルに対するライブトランスポートレーン。                                                                                                                                                                                                           |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 実際の WhatsApp Web アカウントに対するライブトランスポートレーン。                                                                                                                                                                                                             |
| `qa mantis`                                         | ライブトランスポートバグ向けの前後検証ランナー。Discord ステータスリアクションエビデンス、Crabbox デスクトップ/ブラウザースモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) を参照してください。 |

`qa matrix` はランナー Plugin（`extensions/qa-matrix`）として登録されています。上記の他のすべてのレーンは `qa-lab` に直接組み込まれています。

### プロファイル裏付けの `qa run`

プロファイル裏付けの `qa run` は `taxonomy.yaml` からメンバーシップを読み取り、解決されたシナリオを `qa suite` 経由でディスパッチします。`--surface` と `--category` は、別個のレーンを定義するのではなく、選択されたプロファイルをフィルタリングします。生成される `qa-evidence.json` には、選択カテゴリ数と不足カバレッジ ID を含むプロファイルスコアカード概要が含まれます。個々のエビデンスエントリは、テスト、カバレッジロール、結果の信頼できる情報源のままです。タクソノミー機能カバレッジ ID は正確な証明ターゲットであり、エイリアスではありません。プライマリシナリオカバレッジは一致する ID を満たし、セカンダリカバレッジは助言にとどまります。カバレッジ ID は、小文字の英数字/ダッシュセグメントを持つドット区切りの `namespace.behavior` 形式を使用します。プロファイル、サーフェス、カテゴリ ID は、既存のダッシュ区切りまたはドット区切りのタクソノミー ID を引き続き使用できます。

スリムエビデンスはエントリごとの `execution` を省略し、`evidenceMode: "slim"` を設定します。`smoke-ci` はデフォルトでスリムになり、`--evidence-mode full` で完全なエントリを復元します。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデルプロバイダーと Crabline ローカルプロバイダーサーバーを使った決定論的なプロファイル証明には `smoke-ci` を使用します。ライブチャネルに対する Stable/LTS 証明には `release` を使用します。`all` は明示的な完全タクソノミーエビデンス実行にのみ使用してください。これはすべてのアクティブな成熟度カテゴリを選択し、`qa_profile=all` を指定して `QA Profile Evidence` GitHub Actions ワークフロー経由でディスパッチできます。コマンドに OpenClaw ルートプロファイルも必要な場合は、QA コマンドの前にルートプロファイルを置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker 裏付けの Gateway レーンを開始し、QA Lab ページを公開します。そこでオペレーターまたは自動化ループは、エージェントに QA ミッションを与え、実際のチャネル挙動を観察し、機能したこと、失敗したこと、またはブロックされたままのことを記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより速く反復するには、bind マウントされた QA Lab バンドルでスタックを開始します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上に保ち、`extensions/qa-lab/web/dist` を `qa-lab` コンテナーに bind マウントします。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Lab アセットハッシュが変わるとブラウザーが自動リロードします。

### オブザーバビリティスモーク

<Note>
オブザーバビリティ QA はソースチェックアウト専用のままです。npm tarball は意図的に QA Lab（および `qa-channel`/`qa-matrix`）を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断計装を変更するときは、ビルド済みソースチェックアウトからこれらを実行してください。
</Note>

| エイリアス                            | 実行内容                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | ローカルの OpenTelemetry レシーバーに加え、`diagnostics-otel` を有効にした `otel-trace-smoke` シナリオ。                                      |
| `pnpm qa:otel:collector-smoke`          | 実際の OpenTelemetry Collector Docker コンテナの背後で同じレーンを実行します。エンドポイント配線や collector/OTLP 互換性を変更するときに使います。 |
| `pnpm qa:prometheus:smoke`              | `diagnostics-prometheus` を有効にした `docker-prometheus-smoke` シナリオ。                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` に続いて `qa:prometheus:smoke` を実行します。                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` に続いて `qa:prometheus:smoke` を実行します。                                                                            |

`qa:otel:smoke` はローカルの OTLP/HTTP レシーバーを起動し、最小構成の QA-channel
エージェントターンを実行したうえで、トレース、メトリクス、ログがエクスポートされたことを検証します。エクスポートされた protobuf トレーススパンをデコードし、リリース上重要な形をチェックします。
`openclaw.run`、`openclaw.harness.run`、最新の GenAI セマンティック規約に従う
モデル呼び出しスパン、`openclaw.context.assembled`、`openclaw.message.delivery`
がすべて存在する必要があります。この smoke は
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、モデル呼び出し
スパンは `{gen_ai.operation.name} {gen_ai.request.model}` という名前を使う必要があります。成功したターンでのモデル呼び出しは `StreamAbandoned` をエクスポートしてはなりません。また、生の診断
ID と `openclaw.content.*` 属性はトレースに含めてはいけません。このシナリオ
プロンプトは、モデルに固定マーカーで返信し、固定の
秘密文字列を出力しないよう求めます。生の OTLP ペイロードには、そのどちらも、またシナリオ ID から派生した QA
セッションキーも含まれていてはいけません。QA スイート成果物の隣に `otel-smoke-summary.json`
を書き込みます。

`qa:prometheus:smoke` は、未認証のスクレイプが拒否されることを検証した後、
認証済みスクレイプに、プロンプト内容、レスポンス内容、生の診断識別子、認証
トークン、ローカルパスを含まずに、リリース上重要なメトリクスファミリーが含まれることをチェックします。

### Matrix smoke レーン

モデルプロバイダーの認証情報を必要としない、実トランスポートの Matrix smoke レーンでは、
決定的な mock OpenAI プロバイダーを使う fast プロファイルを実行します。

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

live-frontier プロバイダーレーンでは、OpenAI 互換の認証情報を
明示的に指定します。

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、成果物
レイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要としては、Docker 内に使い捨ての Tuwunel homeserver を
プロビジョニングし、一時的な
driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA
gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使いません）、その後 Markdown
レポート、JSON サマリー、観測イベント成果物、結合出力ログを
`.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き込みます。

シナリオは、ユニットテストではエンドツーエンドに証明できないトランスポート挙動を対象にしています。
メンションゲート、allow-bot ポリシー、許可リスト、トップレベル返信とスレッド返信、
DM ルーティング、リアクション処理、受信編集の抑制、再起動時のリプレイ重複排除、
homeserver 中断からの復旧、承認メタデータ配信、
メディア処理、Matrix E2EE のブートストラップ/復旧/検証フローです。
E2EE CLI プロファイルは、gateway 返信をチェックする前に、同じ使い捨て homeserver を通じて `openclaw matrix encryption setup` と
検証コマンドも実行します。

CI は
`.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使います。スケジュール実行とデフォルトの
手動実行では、QA が提供する live-frontier
認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
を使って fast Matrix プロファイルを実行します。
手動の `matrix_profile=all` は、`transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の 5 つのプロファイルシャードにファンアウトします。

### Discord Mantis シナリオ

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータス
リアクションタイムラインには `--scenario discord-status-reactions-tool-only` を使い、実際の Discord スレッドを作成して `message.thread-reply`
が `filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment`
を使います。これらのシナリオは、広範な smoke カバレッジではなく
before/after の再現プローブであるため、デフォルトの
live Discord レーンには含めません。thread-attachment Mantis ワークフローは、QA
環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、ログイン済み Discord Web の目撃動画も追加できます。その viewer プロファイルは視覚的なキャプチャ専用です。合否
判定は引き続き Discord REST oracle から得られます。

実トランスポートの Discord、Slack、Telegram、WhatsApp smoke レーンでは、次を実行します。

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

これらは、2 つの bot またはアカウント（driver +
SUT）を持つ既存の実チャンネルを対象にします。必須の環境変数、シナリオ一覧、出力成果物、Convex
認証情報プールは、下の
[Discord、Slack、Telegram、WhatsApp QA リファレンス](#discord-slack-telegram-and-whatsapp-qa-reference)
に記載されています。

### Mantis Slack デスクトップおよび visual-task ランナー

VNC レスキュー付きの完全な Slack デスクトップ VM 実行では、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack live
レーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、
`slack-qa/`、`slack-desktop-smoke.png`、および
`slack-desktop-smoke.mp4`（動画キャプチャが利用可能な場合）を Mantis 成果物ディレクトリにコピーします。Crabbox デスクトップ/ブラウザリースは、キャプチャ
ツールと browser/native-build ヘルパーパッケージをあらかじめ提供するため、このシナリオは古いリースでのみフォールバックをインストールするべきです。Mantis は `mantis-slack-desktop-smoke-report.md` に合計および
フェーズ別の所要時間を報告するため、遅い実行で、リースのウォームアップ、認証情報取得、リモートセットアップ、成果物コピーのどこに時間が使われたかが分かります。VNC 経由で Slack Web に手動ログインした後は `--lease-id <cbx_...>` を再利用します。再利用されたリースでは Crabbox の pnpm store キャッシュも
温まったままになります。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内で install/build を実行します。`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/`
がある場合にのみ使ってください。このモードは高コストな install/build ステップをスキップし、ワークスペースの準備ができていない場合はフェイルクローズします。`--gateway-setup` を指定すると、Mantis は永続的な
OpenClaw Slack gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、この
コマンドは通常の bot-to-bot Slack QA レーンを実行し、成果物キャプチャ後に終了します。

デスクトップ証拠でネイティブ Slack 承認 UI を証明するには、Mantis
承認チェックポイントモードを実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と同時には使えません。Slack
承認シナリオを実行し、承認以外のシナリオ ID を拒否し、各 pending
および resolved の承認状態で待機し、観測された Slack API メッセージを
`approval-checkpoints/<scenario>-pending.png` と
`approval-checkpoints/<scenario>-resolved.png` にレンダリングし、チェックポイント、
メッセージ証拠、acknowledgement、レンダリング済みスクリーンショットのいずれかが欠落または
空の場合は失敗します。コールド CI リースでは
`slack-desktop-smoke.png` に Slack サインインがまだ表示されることがあります。このレーンの視覚的
証拠は承認チェックポイント画像です。

デフォルトのチェックポイント実行では、2 つの標準 Slack 承認シナリオを保持します。
いずれかのオプトイン Codex 承認ルートをキャプチャするには、
`--scenario slack-codex-approval-exec-native` または
`--scenario slack-codex-approval-plugin-native` で明示的に選択します。Mantis は両方を受け入れ、
同じ pending/resolved スクリーンショットペアを出力します。ランナーは、選択された各 Codex ルートについてチェックポイント
およびリモートコマンドの期限を拡張し、完全な
承認、エージェント完了、resolved 更新シーケンスが完了できるようにします。

オペレーターチェックリスト、GitHub workflow dispatch コマンド、証拠コメント
契約、hydrate-mode 判断表、所要時間の解釈、失敗
処理手順は
[Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV 形式のデスクトップタスクでは、次を実行します。

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
プロンプトは構造化 JSON 判定（`visible`、`evidence`、`reason`）を求め、モデルが
`visible: true` を報告し、期待されたテキストを引用する証拠がある場合にのみ合格します。単に対象
テキストを引用するだけの `visible: false` レスポンスは、それでもアサーション失敗になります。画像理解プロバイダーを呼び出さずに、デスクトップ、ブラウザ、スクリーンショット、動画
配管を証明する no-model smoke には `--vision-mode metadata` を使います。録画は
`visual-task` の必須成果物です。Crabbox が空でない
`visual-task.mp4` を記録しなかった場合、visual driver が成功していてもタスクは失敗します。失敗時、タスクがすでに成功しており
`--keep-lease` が設定されていない場合を除き、Mantis は VNC 用にリースを保持します。

### 認証情報プールのヘルスチェック

プールされた live 認証情報を使う前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker の環境変数（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）をチェックし、エンドポイント設定を検証し、
`OPENCLAW_QA_CONVEX_SECRET_CI` と
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` については set/missing 状態のみを報告し、maintainer secret が存在する場合は admin/list 到達性を検証します。

## live トランスポートカバレッジ

live トランスポートレーンは、それぞれが独自のシナリオリスト形状を発明するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成 product-behavior
スイートであり、live トランスポートカバレッジマトリクスの一部ではありません。

live トランスポートランナーは、共有シナリオ ID、ベースラインカバレッジ
ヘルパー、シナリオ選択ヘルパーを
`openclaw/plugin-sdk/qa-live-transport-scenarios`
からインポートします。

| レーン     | カナリア | メンションゲート | Bot間 | 許可リストブロック | トップレベル返信 | 引用返信 | 再起動後の再開 | スレッドフォローアップ | スレッド分離 | リアクション観察 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

これにより、Matrix、Telegram、その他のライブトランスポートが1つの明示的なトランスポート契約チェックリストを共有しつつ、`qa-channel` は広範な製品動作スイートとして維持されます。

Docker を QA パスに持ち込まずに使い捨ての Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。

ホストおよび Multipass のスイート実行は、デフォルトで分離された Gateway ワーカーを使って、選択された複数のシナリオを並列実行します。`qa-channel` はデフォルトで同時実行数 4 になり、選択されたシナリオ数が上限になります。ワーカー数を調整するには `--concurrency
<count>` を使用し、直列実行には `--concurrency 1` を使用します。パーソナルアシスタントのベンチマークパック（10シナリオ）を実行するには `--pack personal-agent` を使用します。パックセレクターは、繰り返し指定された `--scenario` フラグに追加されます。明示的なシナリオが先に実行され、その後にパックシナリオがパック順で実行され、重複は削除されます。カスタム QA ランナーがすでに OpenTelemetry コレクター設定を提供している場合に、`otel-trace-smoke` と `docker-prometheus-smoke` シナリオをまとめて選択するには `--pack observability` を使用します。

いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。

ライブ実行では、ゲストで実用的に扱えるサポート済みの QA 認証入力が転送されます。env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルート配下に保持してください。

## Discord、Slack、Telegram、WhatsApp QA リファレンス

Matrix はシナリオ数と Docker ベースの homeserver プロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Discord、Slack、Telegram、WhatsApp は既存の実トランスポートに対して実行されるため、それらのリファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                            | 説明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオのみを実行します。繰り返し指定できます。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、エビデンス、トランスポート固有のアーティファクト、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント id です。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                   | プライマリ/代替モデル ref です。                                                                                                                   |
| `--fast`                              | off                                                | サポートされている場合のプロバイダー高速モードです。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                 | `--credential-source convex` の場合に使用されるロールです。                                                                                                    |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。Telegram は利用可能なシナリオ id を表示して終了する `--list-scenarios` も受け付けますが、他のレーンはそのフラグを公開していません。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2つの異なる bot（driver + SUT）を持つ、1つの実プライベート Telegram グループを対象にします。SUT bot には Telegram ユーザー名が必要です。両方の bot で `@BotFather` の **Bot-to-Bot Communication Mode** が有効になっている場合、bot間の観察が最も安定します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値のチャット id（文字列）。
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

暗黙のデフォルトセットは常に、カナリア、メンションゲート、ネイティブコマンド返信、コマンド宛先指定、bot間グループ返信をカバーします。`mock-openai` のデフォルトには、決定論的な返信チェーンと最終メッセージのストリーミングチェックも含まれます。`telegram-current-session-status-tool` と `telegram-tool-only-usage-footer` は引き続きオプトインです。前者はカナリアの直後に直接スレッド化した場合にのみ安定し、後者はツールのみの返信における `/usage` フッターの実 Telegram 証明です。現在のデフォルト/任意の分割と回帰 ref を表示するには、`pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` を使用します。

出力アーティファクト:

- `telegram-qa-report.md`
- `qa-evidence.json` - プロファイル、カバレッジ、プロバイダー、チャンネル、アーティファクト、結果、RTT フィールドを含む、ライブトランスポートチェックのエビデンスエントリ。

パッケージ Telegram 実行は、同じ Telegram 認証情報契約を使用します。繰り返し RTT 測定は通常のパッケージ Telegram ライブレーンの一部です。RTT 分布は、選択された RTT チェックの `result.timing` の下で `qa-evidence.json` に折り込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、パッケージライブラッパーは `kind: "telegram"` 認証情報をリースし、リースされたグループ/driver/SUT bot の env をインストール済みパッケージ実行にエクスポートし、リースを Heartbeat し、シャットダウン時に解放します。Convex が選択されている場合、パッケージラッパーは CI 外では `telegram-mentioned-message-reply` の RTT チェック 20 回、30 秒の RTT タイムアウト、Convex ロール `maintainer` をデフォルトにします。別の RTT コマンドや Telegram 固有のサマリー形式を作成せずに RTT 測定を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。

### Discord QA

```bash
pnpm openclaw qa discord
```

1つの実プライベート Discord guild チャンネルを対象にし、2つの bot を使います。ハーネスで制御される driver bot と、バンドルされた Discord Plugin を通じて子 OpenClaw Gateway が起動する SUT bot です。チャンネルメンション処理、SUT bot が Discord にネイティブ `/help` コマンドを登録済みであること、オプトインの Mantis エビデンスシナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT bot ユーザー id と一致する必要があります（一致しない場合、レーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は observed-message アーティファクト内にメッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は `discord-voice-autojoin` 用の voice/stage チャンネルを選択します。指定しない場合、シナリオは SUT bot から見える最初の voice/stage チャンネルを選びます。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオです。単独で実行され、`channels.discord.voice.autoJoin` を有効にし、SUT bot の現在の Discord 音声状態がターゲットの voice/stage チャンネルであることを検証します。Convex Discord 認証情報には任意の `voiceChannelId` を含められます。それ以外の場合、ランナーは guild 内で最初に見える voice/stage チャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を常時オン、ツールのみの guild 返信に切り替え、`messages.statusReactions.enabled=true` を設定するため、単独で実行されます。その後、REST リアクションタイムラインと HTML/PNG 視覚アーティファクトをキャプチャします。Mantis の before/after レポートは、シナリオが提供する MP4 アーティファクトも `baseline.mp4` と `candidate.mp4` として保持します。
- `discord-thread-reply-filepath-attachment` - オプトインの Mantis シナリオです。[Discord Mantis シナリオ](#discord-mantis-scenarios)を参照してください。

Discord 音声自動参加シナリオを明示的に実行します。

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis ステータスリアクションシナリオを明示的に実行します。

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
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は秘匿されます。
- ステータスリアクションシナリオが実行されるときの `discord-qa-reaction-timelines.json` と
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

1 つの実際のプライベート Slack チャンネルを対象にし、2 つの別個のボットを使用します。ハーネスが制御するドライバーボットと、バンドルされた Slack Plugin を通じて子 OpenClaw Gateway によって起動される SUT ボットです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージアーティファクトにメッセージ本文を保持します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は、Mantis 用の視覚的な承認チェックポイントを有効にします。ランナーは `<scenario>.pending.json` と
  `<scenario>.resolved.json` を書き込み、一致する `.ack.json` ファイルを待機します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` は、チェックポイント確認応答のタイムアウトを上書きします。デフォルトは `120000` です。

シナリオ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-reaction-glyph-native` - オプトインのライブメッセージツールリアクションシナリオ。エージェントに正確な `✅` グリフを渡すよう指示し、Slack が対象メッセージ上の SUT ボットについて `white_check_mark` を保存したことを確認します。
- `slack-approval-exec-native` - オプトインのネイティブ Slack exec 承認シナリオ。Gateway 経由で exec 承認を要求し、Slack メッセージにネイティブ承認ボタンがあることを検証し、それを解決して、解決済み Slack 更新を検証します。
- `slack-approval-plugin-native` - オプトインのネイティブ Slack Plugin 承認シナリオ。exec 承認ルーティングによって Plugin イベントが抑制されないように、exec と Plugin 承認の転送を同時に有効にし、同じ保留中/解決済みのネイティブ Slack UI パスを検証します。
- `slack-codex-approval-exec-native` - オプトインの Codex Guardian コマンド承認シナリオ。Codex Plugin を Guardian モードで有効にし、Slack 由来の Gateway エージェントターンを Codex app-server ハーネス経由でルーティングし、`openclaw-codex-app-server` のネイティブ Slack Plugin 承認プロンプトを待機し、それを解決して、Codex ターンが期待されるコマンド出力とアシスタントマーカーで完了することを検証します。
- `slack-codex-approval-plugin-native` - オプトインの Codex Guardian ファイル承認シナリオ。ワークスペース外の `apply_patch` 指示を使用して Codex に app-server ファイル変更承認ルートを出力させ、その後、同じネイティブ Slack の保留中/解決済み承認パス、最終アシスタントマーカー、クリーンアップ前の正確なファイル内容を検証します。

Codex 承認シナリオには、`openai/*` または `codex/*` の `--model`、通常のライブモデル認証情報、そして Codex Plugin に受け入れられる Codex auth または API キー auth が必要です。Slack レポートには、秘匿された Slack 承認メタデータとともに、Codex app-server メソッド、選択された Codex モデルキー、最終 Codex ターンステータス、操作マーカー検証が含まれます。

出力アーティファクト:

- `slack-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文は秘匿されます。
- `approval-checkpoints/` - Mantis が `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` を設定した場合のみ。チェックポイント JSON、確認応答 JSON、保留中/解決済みのスクリーンショットを含みます。

#### Slack ワークスペースのセットアップ

このレーンには、1 つのワークスペース内に 2 つの別個の Slack アプリと、両方のボットがメンバーであるチャンネルが必要です。

- `channelId` - 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` id。専用チャンネルを使用してください。このレーンは実行ごとに投稿します。
- `driverBotToken` - **Driver** アプリのボットトークン (`xoxb-...`)。
- `sutBotToken` - **SUT** アプリのボットトークン (`xoxb-...`)。ボットユーザー id が異なるよう、ドライバーとは別の Slack アプリである必要があります。
- `sutAppToken` - `connections:write` を持つ SUT アプリのアプリレベルトークン (`xapp-...`)。SUT アプリがイベントを受信できるよう、Socket Mode で使用されます。

本番ワークスペースを再利用するより、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール (`extensions/slack/src/setup-shared.ts:12`) を、ライブ Slack QA スイートでカバーされる権限とイベントに意図的に絞っています。ユーザーが見る本番チャンネルセットアップについては、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup) を参照してください。QA Driver/SUT ペアは、1 つのワークスペース内に 2 つの異なるボットユーザー id が必要なため、意図的に分離されています。

**1. Driver アプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動 → _Create New App_ →
_From a manifest_ → QA ワークスペースを選択し、次のマニフェストを貼り付け、
_Install to Workspace_ を実行します。

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

_Bot User OAuth Token_ (`xoxb-...`) をコピーします。これが `driverBotToken` になります。ドライバーに必要なのはメッセージ投稿と自身の識別だけです。イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト (`extensions/slack/src/setup-shared.ts:12`) のより狭いバージョンを意図的に使用します。ライブ Slack QA スイートはまだリアクション処理をカバーしていないため、リアクションのスコープとイベントは省略されています。

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

Slack がアプリを作成したら、その設定ページで 2 つの作業を行います。

- _Install to Workspace_ → _Bot User OAuth Token_ をコピー → これが `sutBotToken` になります。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` 値をコピー → これが `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットが異なるユーザー id を持っていることを確認します。ランタイムはユーザー id によってドライバーと SUT を区別します。両方に 1 つのアプリを再利用すると、mention-gating が即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル (例: `#openclaw-qa`) を作成し、チャンネル内から両方のボットを招待します。

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` id をコピーします。これが `channelId` になります。パブリックチャンネルでも動作します。プライベートチャンネルを使う場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには env vars を使用します (4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します)。または、CI と他のメンテナーがリースできるよう、共有 Convex プールにシードします。

Convex プールの場合は、4 つのフィールドを JSON ファイルに書き込みます。

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` を export した状態で、登録して検証します。

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなしを期待します。

**5. エンドツーエンドで検証する**

ローカルでレーンを実行し、両方のボットがブローカー経由で相互に通信できることを確認します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功する実行は 30 秒未満で完了し、`slack-qa-report.md` では `slack-canary` と `slack-mention-gating` の両方がステータス `pass` になります。レーンが約 90 秒ハングして `Convex credential pool exhausted
for kind "slack"` で終了する場合、プールが空であるか、すべての行がリースされています。`qa
credentials list --kind slack --status all --json` でどちらかが分かります。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

2 つの専用 WhatsApp Web アカウントを対象にします。ハーネスが制御するドライバーアカウントと、バンドルされた WhatsApp Plugin を通じて子 OpenClaw Gateway によって起動される SUT アカウントです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

任意:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は、`whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、グループアクション/メディア/投票シナリオ、
  `whatsapp-group-allowlist-block` などのグループシナリオを有効にします。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` は、観測メッセージアーティファクトにメッセージ本文を保持します。

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
- 返信と最終出力の動作: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- ユーザーパスのメッセージアクション: `whatsapp-agent-message-action-react` は
  実際のドライバー DM から開始し、モデルに `message` ツールを呼び出させ、
  ネイティブの WhatsApp リアクションを観測します。`whatsapp-agent-message-action-upload-file`
  は `message(action=upload-file)` に同じ姿勢を使い、
  ネイティブの WhatsApp メディアを観測します。`whatsapp-group-agent-message-action-react` と
  `whatsapp-group-agent-message-action-upload-file` は、実際の WhatsApp グループで
  同じユーザー可視のアクションを証明します。
- グループファンアウト: `whatsapp-broadcast-group-fanout` は 1 件のメンション付き
  WhatsApp グループメッセージから開始し、`main` と `qa-second` からの
  それぞれ異なる可視返信を検証します。
- グループ有効化: `whatsapp-group-activation-always` は実際のグループ
  セッションを `/activation always` に変更し、メンションのないグループメッセージで
  エージェントが起動することを証明してから、`/activation mention` に戻します。
  `whatsapp-group-reply-to-bot-triggers` はボット返信をシードし、明示的なメンションなしで
  それへのネイティブ引用返信を送信し、その返信コンテキストからエージェントが
  起動することを検証します。
- インバウンドメディアと構造化メッセージ: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  これらは実際の WhatsApp の画像、音声、ドキュメント、位置情報、連絡先、
  ステッカー、リアクションイベントをドライバー経由で送信します。
- 直接 Gateway コントラクトプローブ: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. これらは意図的にモデルプロンプトを迂回し、
  決定論的な Gateway/チャネルの `send`、`poll`、および
  `message.action` コントラクトを証明します。
- アクセス制御カバレッジ: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- ネイティブ承認: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- ステータスリアクション: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

カタログには現在 52 個のシナリオが含まれています。`live-frontier` のデフォルトレーンは、
高速なスモークカバレッジのため 10 個のシナリオに小さく保たれています。`mock-openai`
デフォルトレーンは、モデル出力のみをモックしながら、実際の WhatsApp
トランスポートを通じて 45 個のシナリオを決定論的に実行します。承認シナリオと
いくつかの重い/ブロッキングチェックは、シナリオ ID による明示指定のままです。

WhatsApp QA ドライバーは構造化されたライブイベント（`text`、`media`、
`location`、`reaction`、および `poll`）を観測し、メディア、投票、
連絡先、位置情報、ステッカーを能動的に送信できます。QA Lab はそのドライバーを、
非公開の WhatsApp ランタイムファイルに到達するのではなく、
`@openclaw/whatsapp/api.js` パッケージサーフェス経由でインポートします。
グループ観測では、`fromJid` はグループ JID であり、`participantJid` と
`fromPhoneE164` は参加者の送信者を識別します。メッセージ内容はデフォルトで
墨消しされます。直接 Gateway の投票、upload-file、メディア、グループ投票、
グループメディア、返信形状のプローブは、トランスポート/API コントラクトチェックです。
これらは、ユーザープロンプトによってエージェントが同じアクションを選択したことの
証明としては扱われません。ユーザーパスのアクション証明は、
`whatsapp-agent-message-action-react` や
`whatsapp-group-agent-message-action-react` などのシナリオから得られます。
そこではドライバーが通常の WhatsApp メッセージを送信し、QA Lab が結果として生成される
ネイティブの WhatsApp 成果物を観測します。WhatsApp レポートには、各シナリオの姿勢
（`user-path`、`direct-gateway`、または `native-approval`）が含まれるため、
エビデンスが実際に証明しているより強いコントラクトと誤認されることはありません。

出力成果物:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリ。
- `whatsapp-qa-observed-messages.json` - 本文は
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` でない限り墨消しされます。

### Convex 認証情報プール

Discord、Slack、Telegram、WhatsApp レーンは、上記の env vars を読む代わりに
共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡す
（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定する）と、QA Lab は
排他的リースを取得し、実行中は Heartbeat し、シャットダウン時に解放します。
プール種別は `"discord"`、`"slack"`、`"telegram"`、および `"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` は数値の chat-id 文字列である必要があります。
- Telegram 実ユーザー (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  Mantis Telegram Desktop 証明専用です。汎用 QA Lab レーンは
  この種別を取得してはいけません。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話番号は相互に異なる E.164 文字列である必要があります。

Mantis Telegram Desktop 証明ワークフローは、TDLib CLI ドライバーと Telegram Desktop
証人の両方に 1 つの排他的 Convex `telegram-user` リースを保持し、証明の公開後に
それを解放します。

PR に決定論的な視覚差分が必要な場合、Mantis は Telegram フォーマッターまたは
配信レイヤーが変更される間、`main` と PR head で同じモックモデル返信を使用できます。
キャプチャのデフォルトは PR コメント向けに調整されています。標準 Crabbox クラス、
24fps デスクトップ録画、24fps モーション GIF、1920px プレビュー幅です。
before/after コメントでは、意図した GIF のみを含むクリーンなバンドルを公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形状チェックは現在、
ブローカーではなく Slack QA ランナー内にあります。`{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使い、
Slack チャネル ID は `Cxxxxxxxxxx` のようにします。アプリとスコープのプロビジョニングについては
[Slack ワークスペースの設定](#setting-up-the-slack-workspace) を参照してください。

運用 env vars と Convex ブローカーエンドポイントのコントラクトは
[Testing → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)
にあります（セクション名はマルチチャネルプールより前のものです。リースセマンティクスは
種別間で共有されています）。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

これらは、QA プランが人間とエージェントの両方に見えるように、意図的に git に含まれています。

`qa-lab` は汎用 YAML シナリオランナーのままです。各シナリオ YAML ファイルは
1 回のテスト実行に対する信頼できる情報源であり、次を定義する必要があります:

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意のカテゴリ、ケイパビリティ、レーン、リスクメタデータ
- `scenario` 内の docs と code refs
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の Gateway config patch
- フローシナリオ用の実行可能なトップレベル `flow`、または
  Vitest と Playwright シナリオ用の `scenario.execution.kind` / `scenario.execution.path`

`flow` を支える再利用可能なランタイムサーフェスは、汎用かつ横断的なままです。
たとえば、YAML シナリオは、特別なケースのランナーを追加することなく、
Gateway `browser.request` シーム経由で埋め込み Control UI を操作する
ブラウザー側ヘルパーと、トランスポート側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーフォルダーではなくプロダクトケイパビリティで
グループ化する必要があります。ファイルを移動してもシナリオ ID は安定させ、
実装のトレーサビリティには `docsRefs` と `codeRefs` を使用してください。

ベースラインリストは、次をカバーするのに十分な広さを維持する必要があります:

- DM とチャネルチャット
- スレッド動作
- メッセージアクションライフサイクル
- cron コールバック
- メモリリコール
- モデル切り替え
- サブエージェントへの引き継ぎ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 件

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。これは、リポジトリに裏付けられた
  QA とパリティゲートのデフォルトの決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジ用に
  AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、
  `mock-openai` シナリオディスパッチャーを置き換えません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル config、
auth-profile ステージング要件、ライブ/モックケイパビリティフラグを所有します。
共有 suite と Gateway コードは、プロバイダー名で分岐するのではなく、
プロバイダーレジストリ経由でルーティングします。

## トランスポートアダプター

`qa-lab` は YAML QA シナリオ用の汎用トランスポートシームを所有します。`qa-channel` は
合成デフォルトです。`crabline` はローカルのプロバイダー形状サーバーを起動し、
OpenClaw の通常のチャネル Plugin をそれらに対して実行します。`live` は実際の
プロバイダー認証情報と外部チャネルのために予約されています。

アーキテクチャレベルでは、分割は次のとおりです:

- `qa-lab` は汎用シナリオ実行、ワーカー並行処理、成果物書き込み、
  レポート作成を所有します。
- トランスポートアダプターは Gateway config、準備完了状態、インバウンドおよびアウトバウンド観測、
  トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の YAML シナリオファイルはテスト実行を定義し、
  `qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャネルの追加

YAML QA システムにチャネルを追加するには、チャネル実装に加え、チャネルコントラクトを
実行するシナリオパックが必要です。スモーク CI カバレッジのため、対応する Crabline
ローカルプロバイダーサーバーを追加し、`crabline` ドライバー経由で公開してください。

共有 `qa-lab` ホストがフローを所有できる場合、新しいトップレベル QA コマンドルートを
追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します:

- `openclaw qa` コマンドルート
- suite の起動と終了処理
- ワーカー並行処理
- 成果物書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポートコントラクトを所有します:

- 共有 `qa` ルートの下に `openclaw qa <runner>` をマウントする方法
- そのトランスポート向けに Gateway を構成する方法
- 準備完了状態をチェックする方法
- インバウンドイベントを注入する方法
- アウトバウンドメッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに裏付けられたアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャネルの最小採用基準:

1. 共有 `qa` ルートの所有者は `qa-lab` のままにします。
2. 共有 `qa-lab` ホスト境界にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは、ランナー Plugin またはチャンネル
   ハーネス内に保ちます。
4. 競合するルートコマンドを登録する代わりに、ランナーを `openclaw qa <runner>` としてマウントします。ランナー Plugin は
   `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations`
   配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI と
   ランナー実行は別のエントリーポイントの背後に置きます。任意の
   `adapterFactory` は、コマンドの既存シナリオカタログを変更せずに
   トランスポートを共有シナリオへ公開します。
5. テーマ別の `qa/scenarios/`
   ディレクトリ配下で YAML シナリオを作成または適応します。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させたままにします。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 振る舞いが 1 つのチャンネルトランスポートに依存する場合は、そのランナー
  Plugin または Plugin ハーネス内に保ちます。
- シナリオが複数のチャンネルで使用できる新しい機能を必要とする場合は、
  `suite.ts` にチャンネル固有の分岐を追加する代わりに、汎用ヘルパーを追加します。
- 振る舞いが 1 つのトランスポートでのみ意味を持つ場合は、シナリオを
  トランスポート固有のままにし、そのことをシナリオ契約で明示します。

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

既存シナリオ向けの互換エイリアス -
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus` - は引き続き利用できますが、新しいシナリオ作成では
汎用名を使用する必要があります。これらのエイリアスは、一斉移行を避けるために存在しており、
今後のモデルとして存在しているわけではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次に答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のあるフォローアップシナリオは何か

利用可能なシナリオのインベントリは、フォローアップ作業の規模を見積もる場合や
新しいトランスポートを接続する場合に有用で、`pnpm openclaw qa coverage` を実行します（機械可読の出力には `--json`
を追加します）。触れた振る舞いやファイルパスに対して絞り込んだ証明を選ぶ場合は、`pnpm openclaw qa coverage --match <query>` を実行します。マッチレポートは、シナリオメタデータ、ドキュメント参照、コード参照、カバレッジ ID、
Plugin、プロバイダー要件を検索し、一致する `qa suite
--scenario ...` ターゲットを出力します。

各 `qa suite` 実行は、選択されたシナリオセットについて、トップレベルの `qa-evidence.json`、
`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き込みます。
`execution.kind: vitest` または
`execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、さらに
シナリオごとのログも書き込みます。`execution.kind: script` を宣言するシナリオは、
`execution.path` の証拠生成プログラムを `node --import tsx` 経由で実行します（
`${outputDir}` と `${scenarioId}` は `execution.args` 内で展開されます）。その
生成プログラムは独自の `qa-evidence.json` を書き込み、そのエントリは
スイート出力へインポートされ、アーティファクトパスはその
生成プログラムの `qa-evidence.json` を基準に解決されます。`qa suite` が `qa run
--qa-profile` 経由で到達された場合、同じ `qa-evidence.json` には、選択された分類カテゴリのプロファイル
スコアカード要約も含まれます。

カバレッジ出力は探索補助として扱い、ゲートの代替として扱わないでください。
選択されたシナリオには、テスト対象の振る舞いに応じて、適切なプロバイダーモード、ライブトランスポート、
Multipass、Testbox、またはリリースレーンが依然として必要です。
スコアカードの文脈については、[成熟度スコアカード](/ja-JP/maturity/scorecard) を参照してください。

キャラクターとスタイルのチェックでは、同じシナリオを複数のライブモデル参照で実行し、
判定済みの Markdown レポートを書き込みます。

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター
評価シナリオは、`SOUL.md` でペルソナを設定し、その後、チャット、ワークスペース支援、小さなファイルタスクなどの通常の
ユーザーターンを実行する必要があります。候補モデルには、評価中であることを伝えてはいけません。このコマンドは
各完全なトランスクリプトを保持し、基本的な実行統計を記録したうえで、サポートされる場合は `xhigh` 推論を使った
fast モードで判定モデルに依頼し、自然さ、雰囲気、ユーモアによって実行をランク付けします。
プロバイダーを比較する場合は `--blind-judge-models` を使用します。判定プロンプトは引き続き
すべてのトランスクリプトと実行ステータスを受け取りますが、候補参照は `candidate-01` などの
中立ラベルに置き換えられます。レポートは、解析後にランキングを実際の参照へ対応付けます。

候補実行はデフォルトで `high` thinking になり、GPT-5.5 は `medium`、
それをサポートする古い OpenAI 評価参照は `xhigh` になります。特定の
候補は `--model provider/model,thinking=<level>` でインライン上書きします。インライン
オプションは `fast`、`no-fast`、`fast=<bool>` もサポートします。`--thinking
<level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking
<provider/model=level>` 形式は互換性のために維持されています。OpenAI 候補
参照は、プロバイダーがサポートする場合に優先処理が使用されるよう、デフォルトで fast モードになります。
すべての候補モデルで fast モードを強制的に有効化したい場合にのみ、`--fast` を渡してください。
候補と判定の所要時間はベンチマーク分析用にレポートへ記録されますが、判定プロンプトは
速度でランク付けしないよう明示します。候補モデル実行と判定モデル実行は、どちらもデフォルトで同時実行数 16 です。
プロバイダー制限やローカル
Gateway の負荷によって実行が不安定になる場合は、`--concurrency` または `--judge-concurrency` を下げます。

候補 `--model` が渡されない場合、キャラクター評価のデフォルトは
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` です。`--judge-model` が渡されない場合、判定モデルのデフォルトは
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-8,thinking=high` です。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [パーソナルエージェントベンチマークパック](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA チャンネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
