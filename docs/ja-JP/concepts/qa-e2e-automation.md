---
read_when:
    - QAスタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリ backed QA シナリオの追加
    - Gateway ダッシュボードを中心に、より高いリアリズムの QA 自動化を構築する
summary: 'QA スタック概要: qa-lab、qa-channel、リポジトリ backed シナリオ、ライブ transport レーン、transport アダプター、レポート。'
title: QA 概要
x-i18n:
    generated_at: "2026-07-05T11:15:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fba58c5d3b1b2a5d57facfd77cdbf5c684d118633b4c73cfd3212ceda02bc36a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、ユニットテストでは実現できない現実的でチャンネルに沿った方法で OpenClaw を検証します。

構成要素:

- `extensions/qa-channel`: DM、チャンネル、スレッド、リアクション、編集、削除のサーフェスを持つ合成メッセージチャンネル。
- `extensions/qa-lab`: トランスクリプトの観測、受信メッセージの注入、Markdown レポートのエクスポートを行うためのデバッガー UI と QA バス。
- `extensions/qa-matrix`: 子 QA Gateway 内で実際の Matrix Plugin を駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用の、リポジトリに裏付けられたシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザーのスクリーンショット、VM 状態、PR 証拠が必要なバグのための修正前後のライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*` スクリプトエイリアスがあります。どちらの形式も動作します。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` なしのバンドル済み QA セルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を使う、タクソノミーに裏付けられた成熟度プロファイルランナー。                                                                       |
| `qa suite`                                          | QA Gateway レーンに対して、リポジトリに裏付けられたシナリオを実行します。`--runner multipass` はホストの代わりに使い捨ての Linux VM を使用します。                                                                                                                   |
| `qa coverage`                                       | YAML シナリオカバレッジインベントリを出力します（機械出力には `--json`、変更対象の挙動に対応するシナリオを探すには `--match <query>`、ランタイムツールフィクスチャカバレッジには `--tools`）。                                                                       |
| `qa parity-report`                                  | モデル軸のパリティゲート用に 2 つの `qa-suite-summary.json` ファイルを比較します。または `--runtime-axis --token-efficiency` を使って Codex 対 OpenClaw のランタイムパリティとトークン効率レポートを書き出します。                                                   |
| `qa confidence-report`                              | QA 証拠アーティファクトをマニフェストに照らして分類し、不明ゼロの信頼度レポートを作成します。                                                                                                                                                                      |
| `qa confidence-self-test`                           | 信頼度ゲートがドリフトを検出することを証明する、シード済みのネガティブコントロールカナリアを書き出します。                                                                                                                                                          |
| `qa jsonl-replay`                                   | キュレーション済み JSONL トランスクリプトをランタイムパリティ再生ハーネスで再生します。                                                                                                                                                                             |
| `qa character-eval`                                 | 複数のライブモデルに対してキャラクター QA シナリオを実行し、判定付きレポートを作成します。[レポート](#reporting)を参照してください。                                                                                                                                |
| `qa manual`                                         | 選択されたプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                                                                                             |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                   |
| `qa docker-build-image`                             | 事前ベイク済み QA Docker イメージをビルドします。                                                                                                                                                                                                                   |
| `qa docker-scaffold`                                | QA ダッシュボード + Gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                                                                                                              |
| `qa up`                                             | QA サイトをビルドし、Docker に裏付けられたスタックを起動し、URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                               |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                                                                                                       |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                            |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャンネルに対するライブトランスポートレーン。                                                                                                                                                                                     |
| `qa matrix`                                         | 使い捨ての Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix) を参照してください。                                                                                                                                          |
| `qa slack`                                          | 実際のプライベート Slack チャンネルに対するライブトランスポートレーン。                                                                                                                                                                                             |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                            |
| `qa whatsapp`                                       | 実際の WhatsApp Web アカウントに対するライブトランスポートレーン。                                                                                                                                                                                                  |
| `qa mantis`                                         | ライブトランスポートバグ用の修正前後の検証ランナー。Discord ステータスリアクション証拠、Crabbox デスクトップ/ブラウザースモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack デスクトップ Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) を参照してください。 |

`qa matrix` はランナー Plugin（`extensions/qa-matrix`）として登録されています。上記の他のすべてのレーンは `qa-lab` に直接組み込まれています。

### プロファイルに裏付けられた `qa run`

プロファイルに裏付けられた `qa run` は `taxonomy.yaml` からメンバーシップを読み取り、解決されたシナリオを `qa suite` にディスパッチします。`--surface` と `--category` は、別個のレーンを定義するのではなく、選択されたプロファイルをフィルターします。生成される `qa-evidence.json` には、選択カテゴリ数と不足しているカバレッジ ID を含むプロファイルスコアカード概要が含まれます。個々の証拠エントリは、テスト、カバレッジロール、結果の信頼できる情報源のままです。タクソノミー機能カバレッジ ID は正確な証明ターゲットであり、エイリアスではありません。プライマリシナリオカバレッジは一致する ID を満たし、セカンダリカバレッジは参考情報にとどまります。カバレッジ ID は、小文字英数字/ダッシュのセグメントを持つドット区切りの `namespace.behavior` 形式を使用します。プロファイル、サーフェス、カテゴリ ID は、既存のダッシュ区切りまたはドット区切りのタクソノミー ID を引き続き使用できます。

スリム証拠はエントリごとの `execution` を省略し、`evidenceMode: "slim"` を設定します。`smoke-ci` はデフォルトでスリムになり、`--evidence-mode full` は完全なエントリを復元します。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデルプロバイダーと Crabline ローカルプロバイダーサーバーを使った決定的なプロファイル証明には `smoke-ci` を使用します。ライブチャンネルに対する Stable/LTS 証明には `release` を使用します。`all` は明示的な全タクソノミー証拠実行にのみ使用してください。これはすべてのアクティブな成熟度カテゴリを選択し、`qa_profile=all` を指定して `QA Profile Evidence` GitHub Actions ワークフローからディスパッチできます。コマンドが OpenClaw ルートプロファイルも必要とする場合は、QA コマンドの前にルートプロファイルを置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在の QA オペレーターフローは、2 ペインの QA サイトです。

- 左: エージェントを持つ Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker に裏付けられた Gateway レーンが起動し、QA Lab ページが公開されます。オペレーターまたは自動化ループはそこでエージェントに QA ミッションを与え、実際のチャンネル挙動を観測し、成功したこと、失敗したこと、またはブロックされたままのことを記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより速く反復するには、バインドマウントされた QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上に保持し、`extensions/qa-lab/web/dist` を `qa-lab` コンテナへバインドマウントします。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Lab アセットハッシュが変わるとブラウザーが自動リロードします。

### オブザーバビリティスモーク

<Note>
オブザーバビリティ QA はソースチェックアウト専用のままです。npm tarball は意図的に QA Lab（および `qa-channel`/`qa-matrix`）を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断インストルメンテーションを変更するときは、ビルド済みのソースチェックアウトからこれらを実行してください。
</Note>

| エイリアス                            | 実行内容                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | ローカルの OpenTelemetry レシーバーと、`diagnostics-otel` を有効にした `otel-trace-smoke` シナリオ。                                      |
| `pnpm qa:otel:collector-smoke`          | 実際の OpenTelemetry Collector Docker コンテナー背後で実行する同じレーン。エンドポイント配線またはコレクター/OTLP 互換性を変更するときに使用します。 |
| `pnpm qa:prometheus:smoke`              | `diagnostics-prometheus` を有効にした `docker-prometheus-smoke` シナリオ。                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` に続いて `qa:prometheus:smoke` を実行します。                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` に続いて `qa:prometheus:smoke` を実行します。                                                                            |

`qa:otel:smoke` はローカルの OTLP/HTTP レシーバーを起動し、最小構成の QA-channel
エージェントターンを実行してから、トレース、メトリクス、ログがエクスポートされることを検証します。エクスポートされた
protobuf トレーススパンをデコードし、リリース上重要な形を確認します。
`openclaw.run`、`openclaw.harness.run`、最新の GenAI セマンティック規約に基づく
モデル呼び出しスパン、`openclaw.context.assembled`、`openclaw.message.delivery`
がすべて存在している必要があります。このスモークは
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、モデル呼び出し
スパンは `{gen_ai.operation.name} {gen_ai.request.model}` 名を使用する必要があります。モデル
呼び出しは成功したターンで `StreamAbandoned` をエクスポートしてはなりません。生の診断
ID と `openclaw.content.*` 属性はトレースに含めない必要があります。このシナリオの
プロンプトは、固定マーカーで返信し、固定の秘密文字列を出さないようモデルに求めます。生の OTLP ペイロードには、そのどちらも、シナリオ ID から派生した QA
セッションキーも含まれてはなりません。QA スイートの成果物の隣に `otel-smoke-summary.json`
を書き込みます。

`qa:prometheus:smoke` は未認証のスクレイプが拒否されることを検証し、その後、
認証済みスクレイプに、プロンプト内容、レスポンス内容、生の診断識別子、認証
トークン、ローカルパスを含まないリリース上重要なメトリクスファミリーが含まれることを確認します。

### Matrix スモークレーン

モデルプロバイダー認証情報を必要としない、実トランスポートの Matrix スモークレーンでは、決定的なモック OpenAI プロバイダーを使って高速プロファイルを実行します。

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

live-frontier プロバイダーレーンでは、OpenAI 互換の認証情報を明示的に指定します。

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、成果物
レイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要としては、使い捨ての Tuwunel ホームサーバーを Docker でプロビジョニングし、一時的な
driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA
Gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使用しない）、その後 Markdown
レポート、JSON サマリー、観測イベント成果物、結合出力ログを
`.artifacts/qa-e2e/matrix-<timestamp>/` 配下に書き込みます。

シナリオは、ユニットテストではエンドツーエンドで証明できないトランスポート動作をカバーします。
メンションゲート、ボット許可ポリシー、許可リスト、トップレベルおよびスレッド返信、
DM ルーティング、リアクション処理、受信編集の抑制、再起動時リプレイの重複排除、
ホームサーバー中断からの復旧、承認メタデータ配信、メディア処理、Matrix E2EE
のブートストラップ/復旧/検証フローです。E2EE CLI プロファイルは、Gateway
返信を確認する前に、同じ使い捨てホームサーバーを通じて `openclaw matrix encryption setup` と
検証コマンドも実行します。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行およびデフォルトの
手動実行では、QA 提供の live-frontier 認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`
を使って高速 Matrix プロファイルを実行します。手動の `matrix_profile=all` は、`transport`、
`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の 5 つのプロファイルシャードへファンアウトします。

### Discord Mantis シナリオ

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータス
リアクションタイムラインには `--scenario discord-status-reactions-tool-only` を使用し、実際の Discord スレッドを作成して `message.thread-reply`
が `filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment`
を使用します。これらのシナリオは、広範なスモークカバレッジではなく前後比較の再現プローブであるため、デフォルトの
ライブ Discord レーンには含まれません。スレッド添付 Mantis ワークフローは、QA
環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、ログイン済み Discord Web
の証跡動画も追加できます。このビューアープロファイルは視覚的キャプチャ専用です。合否
判定は引き続き Discord REST オラクルから行われます。

実トランスポートの Discord、Slack、Telegram、WhatsApp スモークレーンでは、次を実行します。

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

これらは、2 つのボットまたはアカウント（driver +
SUT）がある既存の実チャンネルを対象にします。必要な環境変数、シナリオ一覧、出力成果物、Convex
認証情報プールは、下記の
[Discord、Slack、Telegram、WhatsApp QA リファレンス](#discord-slack-telegram-and-whatsapp-qa-reference)
に記載されています。

### Mantis Slack デスクトップおよびビジュアルタスクランナー

VNC レスキュー付きの完全な Slack デスクトップ VM 実行では、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブ
レーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャして、
`slack-qa/`、`slack-desktop-smoke.png`、および
`slack-desktop-smoke.mp4`（動画キャプチャが利用可能な場合）を Mantis
成果物ディレクトリへコピーします。Crabbox デスクトップ/ブラウザリースは、キャプチャ
ツールとブラウザ/ネイティブビルド補助パッケージを事前に提供するため、シナリオは古いリースでのみ
フォールバックをインストールするべきです。Mantis は `mantis-slack-desktop-smoke-report.md` に合計および
フェーズ別の所要時間を報告するため、遅い実行で時間がリースのウォームアップ、認証情報の取得、リモートセットアップ、成果物コピーのどこに使われたかが分かります。VNC から Slack Web
に手動ログインした後は `--lease-id <cbx_...>` を再利用します。再利用したリースでは Crabbox の pnpm ストアキャッシュも
温存されます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内で install/build を実行します。`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに
`node_modules` とビルド済みの `dist/` がある場合にのみ使用します。このモードは高コストな install/build
手順をスキップし、ワークスペースが準備できていない場合はフェイルクローズします。`--gateway-setup` を付けると、Mantis は永続的な
OpenClaw Slack Gateway を VM 内のポート `38973` で実行したままにします。付けない場合、このコマンドは通常の
ボット間 Slack QA レーンを実行し、成果物キャプチャ後に終了します。

デスクトップ証跡付きでネイティブ Slack 承認 UI を証明するには、Mantis
承認チェックポイントモードを実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と相互排他的です。Slack
承認シナリオを実行し、承認以外のシナリオ ID を拒否し、各保留中および解決済み承認状態で待機し、観測された Slack API メッセージを
`approval-checkpoints/<scenario>-pending.png` と
`approval-checkpoints/<scenario>-resolved.png` にレンダリングします。その後、チェックポイント、メッセージ証跡、確認応答、レンダリング済みスクリーンショットのいずれかが欠落または
空の場合に失敗します。コールド CI リースでは `slack-desktop-smoke.png` に Slack
サインインが表示される場合があります。承認チェックポイント画像がこのレーンの視覚的
証跡です。

オペレーターチェックリスト、GitHub ワークフローディスパッチコマンド、証跡コメント
契約、hydrate-mode 判定表、タイミング解釈、失敗時の対応手順は
[Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV 形式のデスクトップタスクでは、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` は Crabbox デスクトップ/ブラウザマシンをリースまたは再利用し、
`crabbox record --while` を開始し、ネストされた `visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が
選択されている場合はスクリーンショットに対して `openclaw infer image
describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き込みます。`--expect-text` が設定されている場合、ビジョン
プロンプトは構造化 JSON 判定（`visible`、`evidence`、`reason`）を求め、モデルが期待テキストを引用する証拠とともに
`visible: true` を報告した場合にのみ成功します。対象テキストを引用しているだけの `visible: false` レスポンスでも検証は失敗します。画像理解プロバイダーを呼び出さずに、デスクトップ、ブラウザ、スクリーンショット、動画
配管を証明する no-model スモークには `--vision-mode metadata` を使用します。録画は
`visual-task` の必須成果物です。Crabbox が空でない
`visual-task.mp4` を記録しなかった場合、ビジュアルドライバーが成功していてもタスクは失敗します。失敗時、タスクがすでに成功しており
`--keep-lease` が設定されていない場合を除き、Mantis は VNC 用にリースを保持します。

### 認証情報プールのヘルスチェック

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカー環境（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）を確認し、エンドポイント設定を検証し、
`OPENCLAW_QA_CONVEX_SECRET_CI` と
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` については設定済み/未設定の状態だけを報告し、maintainer シークレットが存在する場合は admin/list の到達性を検証します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を作るのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作
スイートであり、ライブトランスポートカバレッジマトリクスの一部ではありません。

ライブトランスポートランナーは、共有シナリオ ID、ベースラインカバレッジ
ヘルパー、シナリオ選択ヘルパーを
`openclaw/plugin-sdk/qa-live-transport-scenarios` からインポートします。

| レーン   | カナリア | メンションゲート | bot 間 | 許可リストブロック | トップレベル返信 | 引用返信 | 再起動後の再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

これにより、`qa-channel` は広範なプロダクト挙動スイートとして維持され、Matrix、
Telegram、その他のライブトランスポートは 1 つの明示的なトランスポート契約
チェックリストを共有します。

QA パスに Docker を持ち込まず、使い捨て Linux VM レーンで実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw
をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の
`.artifacts/qa-e2e/...` にコピーして戻します。ホスト上の `qa suite` と同じ
シナリオ選択挙動を再利用します。

ホストと Multipass のスイート実行は、デフォルトで分離された Gateway ワーカーを使って、
選択された複数のシナリオを並列実行します。`qa-channel` のデフォルトは並行数 4 で、
選択されたシナリオ数を上限とします。ワーカー数を調整するには `--concurrency
<count>` を使い、直列実行には `--concurrency 1` を使います。
パーソナルアシスタントのベンチマークパック (10 シナリオ) を実行するには
`--pack personal-agent` を使います。パックセレクターは、繰り返し指定した
`--scenario` フラグに加算されます。明示的なシナリオが先に実行され、その後、
パックシナリオがパック順に重複を除去して実行されます。カスタム QA ランナーが
OpenTelemetry コレクター設定をすでに提供している場合に、`otel-trace-smoke` と
`docker-prometheus-smoke` シナリオをまとめて選択するには、`--pack observability`
を使います。

いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしで
成果物が必要な場合は、`--allow-failures` を使います。

ライブ実行は、ゲストにとって実用的なサポート対象の QA 認証入力を転送します。
env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および存在する場合の
`CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、
`--output-dir` はリポジトリルート配下に置いてください。

## Discord、Slack、Telegram、WhatsApp QA リファレンス

Matrix はシナリオ数と Docker ベースの homeserver プロビジョニングのため、
[専用ページ](/ja-JP/concepts/qa-matrix)があります。Discord、Slack、Telegram、
WhatsApp は既存の実トランスポートに対して実行されるため、それらのリファレンスは
ここにあります。

### 共有 CLI フラグ

これらのレーンは
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 経由で登録され、
同じフラグを受け付けます。

| フラグ                                | デフォルト                                       | 説明                                                                                                                                            |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオだけを実行します。繰り返し指定できます。                                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、証拠、トランスポート固有の成果物、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                          |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント id です。                                                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` または `live-frontier` です (レガシーの `live-openai` もまだ動作します)。                                                         |
| `--model <ref>` / `--alt-model <ref>` | provider default                                   | プライマリ/代替モデル ref です。                                                                                                                |
| `--fast`                              | off                                                | サポートされる場合のプロバイダー高速モードです。                                                                                               |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                            |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`            | `--credential-source convex` の場合に使われるロールです。                                                                                       |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は
失敗終了コードを設定せずに成果物を書き込みます。Telegram は利用可能なシナリオ id を出力して
終了する `--list-scenarios` も受け付けます。他のレーンはそのフラグを公開していません。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なる bot (ドライバー + SUT) を持つ 1 つの実プライベート Telegram グループを
対象にします。SUT bot には Telegram ユーザー名が必要です。bot 間観測は、両方の bot で
`@BotFather` の **Bot-to-Bot Communication Mode** が有効になっている場合に最もよく
動作します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値の chat id (文字列)。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

シナリオ (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

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

暗黙のデフォルトセットは常に、カナリア、メンションゲート、ネイティブコマンド返信、
コマンドの宛先指定、bot 間グループ返信をカバーします。`mock-openai` のデフォルトには、
決定論的な返信チェーンと最終メッセージストリーミングのチェックも含まれます。
`telegram-current-session-status-tool` と `telegram-tool-only-usage-footer` は
オプトインのままです。前者はカナリアの直後に直接スレッド化された場合にのみ安定し、
後者は tool-only 返信における `/usage` フッターの実 Telegram 証明です。現在の
デフォルト/任意の分割とリグレッション ref を出力するには、`pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` を使います。

出力成果物:

- `telegram-qa-report.md`
- `qa-evidence.json` - プロファイル、カバレッジ、プロバイダー、チャンネル、成果物、
  結果、RTT フィールドを含む、ライブトランスポートチェックの証拠エントリ。

パッケージ Telegram 実行は、同じ Telegram 認証情報契約を使います。繰り返し RTT 測定は
通常のパッケージ Telegram ライブレーンの一部です。RTT 分布は、選択された RTT チェックの
`result.timing` 配下で `qa-evidence.json` に組み込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、パッケージライブラッパーは
`kind: "telegram"` 認証情報をリースし、リースされたグループ/ドライバー/SUT bot の env を
インストール済みパッケージ実行へエクスポートし、リースに Heartbeat を送り、シャットダウン時に
解放します。Convex が選択されている場合、パッケージラッパーは CI 外では
`telegram-mentioned-message-reply` の RTT チェック 20 回、30 秒の RTT タイムアウト、
Convex ロール `maintainer` をデフォルトにします。別の RTT コマンドや Telegram 固有の
サマリー形式を作成せずに RTT 測定を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES`
を上書きします。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つの bot を持つ 1 つの実プライベート Discord guild チャンネルを対象にします。
1 つはハーネスが制御するドライバー bot、もう 1 つはバンドルされた Discord Plugin 経由で
子 OpenClaw Gateway によって開始される SUT bot です。チャンネルメンション処理、
SUT bot が Discord にネイティブ `/help` コマンドを登録済みであること、
およびオプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT bot ユーザー id と
  一致している必要があります (一致しない場合、レーンは即座に失敗します)。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージ成果物にメッセージ本文を
  保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は、`discord-voice-autojoin` 用の
  ボイス/ステージチャンネルを選択します。指定しない場合、シナリオは SUT bot に見える最初の
  ボイス/ステージチャンネルを選びます。

シナリオ (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオです。単独で実行され、
  `channels.discord.voice.autoJoin` を有効にし、SUT bot の現在の Discord 音声状態が
  対象のボイス/ステージチャンネルであることを検証します。Convex Discord 認証情報には任意の
  `voiceChannelId` を含められます。含まれない場合、ランナーは guild 内で最初に見える
  ボイス/ステージチャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を
  `messages.statusReactions.enabled=true` の常時オン、tool-only guild 返信に切り替えるため
  単独で実行され、その後 REST リアクションタイムラインと HTML/PNG 視覚成果物を取得します。
  Mantis の before/after レポートは、シナリオが提供する MP4 成果物も `baseline.mp4` と
  `candidate.mp4` として保持します。
- `discord-thread-reply-filepath-attachment` - オプトインの Mantis シナリオです。
  [Discord Mantis シナリオ](#discord-mantis-scenarios)を参照してください。

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
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`
  でない限り、本文は編集されます。
- ステータスリアクションのシナリオが実行されるときの
  `discord-qa-reaction-timelines.json` と
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

1 つの実際のプライベート Slack チャンネルを対象にします。2 つの異なるボットを使います。ハーネスが制御するドライバーボットと、バンドルされた Slack Plugin を通じて子 OpenClaw gateway が起動する SUT ボットです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は、Mantis 用の視覚的な承認チェックポイントを有効にします。ランナーは `<scenario>.pending.json` と `<scenario>.resolved.json` を書き込み、一致する `.ack.json` ファイルを待ちます。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` は、チェックポイント確認のタイムアウトを上書きします。デフォルトは `120000` です。

シナリオ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - オプトインのネイティブ Slack exec 承認シナリオ。Gateway を通じて exec 承認を要求し、Slack メッセージにネイティブ承認ボタンがあることを検証し、それを解決して、解決済み Slack 更新を検証します。
- `slack-approval-plugin-native` - オプトインのネイティブ Slack Plugin 承認シナリオ。exec と Plugin 承認の転送を一緒に有効にし、Plugin イベントが exec 承認ルーティングで抑制されないようにしてから、同じ保留中/解決済みのネイティブ Slack UI パスを検証します。

出力アーティファクト:

- `slack-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`
  でない限り、本文は編集されます。
- `approval-checkpoints/` - Mantis が `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`
  を設定した場合のみ。チェックポイント JSON、確認 JSON、保留中/解決済みのスクリーンショットを含みます。

#### Slack ワークスペースのセットアップ

このレーンには、1 つのワークスペース内の 2 つの異なる Slack アプリと、両方のボットがメンバーであるチャンネルが必要です。

- `channelId` - 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` id。専用チャンネルを使用してください。このレーンは実行のたびに投稿します。
- `driverBotToken` - **Driver** アプリのボットトークン (`xoxb-...`)。
- `sutBotToken` - **SUT** アプリのボットトークン (`xoxb-...`)。ボットユーザー id を別にするため、ドライバーとは別の Slack アプリである必要があります。
- `sutAppToken` - SUT アプリのアプリレベルトークン (`xapp-...`)。`connections:write` を持ち、SUT アプリがイベントを受信できるように Socket Mode で使われます。

本番ワークスペースを再利用するよりも、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール (`extensions/slack/src/setup-shared.ts:12`) を、ライブ Slack QA スイートでカバーされる権限とイベントに意図的に絞っています。ユーザーが見る本番チャンネルのセットアップについては、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup) を参照してください。QA Driver/SUT ペアは、このレーンが 1 つのワークスペース内に 2 つの異なるボットユーザー id を必要とするため、意図的に分離されています。

**1. Driver アプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動 → _Create New App_ →
_From a manifest_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから _Install to Workspace_:

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

_Bot User OAuth Token_ (`xoxb-...`) をコピーします。これが `driverBotToken` になります。ドライバーはメッセージの投稿と自身の識別だけを必要とします。イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト (`extensions/slack/src/setup-shared.ts:12`) の、より狭いバージョンを意図的に使います。リアクションのスコープとイベントは、ライブ Slack QA スイートがまだリアクション処理をカバーしていないため省略されています。

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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → これが `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットのユーザー id が異なることを検証します。ランタイムはユーザー id でドライバーと SUT を区別します。両方に 1 つのアプリを再利用すると、mention-gating が即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル (例: `#openclaw-qa`) を作成し、チャンネル内から両方のボットを招待します。

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` id をコピーします。これが `channelId` になります。公開チャンネルで問題ありません。プライベートチャンネルを使う場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには env vars を使います (4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します)。または、CI と他のメンテナーがリースできるように共有 Convex プールをシードします。

Convex プールでは、4 つのフィールドを JSON ファイルに書き込みます。

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` をエクスポートした状態で、登録して検証します。

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなしを想定します。

**5. エンドツーエンドで検証する**

ローカルでレーンを実行し、両方のボットがブローカーを通じて互いに通信できることを確認します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常な実行は 30 秒未満で完了し、`slack-qa-report.md` は `slack-canary` と `slack-mention-gating` の両方をステータス `pass` として表示します。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空か、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらかを確認できます。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

2 つの専用 WhatsApp Web アカウントを対象にします。ハーネスが制御するドライバーアカウントと、バンドルされた WhatsApp Plugin を通じて子 OpenClaw gateway が起動する SUT アカウントです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

任意:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は、`whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、`whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、`whatsapp-group-reply-to-bot-triggers`、グループアクション/メディア/ポールのシナリオ、`whatsapp-group-allowlist-block` などのグループシナリオを有効にします。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します。

シナリオカタログ (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- ベースラインとグループのゲート制御: `whatsapp-canary`, `whatsapp-pairing-block`,
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
  ネイティブ WhatsApp メディアを観測します。`whatsapp-group-agent-message-action-react` と
  `whatsapp-group-agent-message-action-upload-file` は、実際の WhatsApp グループで
  同じユーザー可視アクションを証明します。
- グループファンアウト: `whatsapp-broadcast-group-fanout` は 1 件のメンション付き
  WhatsApp グループメッセージから開始し、`main` と `qa-second` からの
  個別の可視返信を検証します。
- グループ有効化: `whatsapp-group-activation-always` は実際のグループ
  セッションを `/activation always` に変更し、メンションされていないグループメッセージで
  エージェントが起動することを証明してから、`/activation mention` に戻します。
  `whatsapp-group-reply-to-bot-triggers` はボット返信をシードし、明示的なメンションなしで
  それに対するネイティブの引用返信を送信し、その返信コンテキストからエージェントが
  起動することを検証します。
- インバウンドメディアと構造化メッセージ: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  これらは実際の WhatsApp 画像、音声、ドキュメント、位置情報、連絡先、
  ステッカー、リアクションイベントをドライバー経由で送信します。
- 直接 Gateway コントラクトプローブ: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. これらは意図的にモデルプロンプトをバイパスし、
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

カタログには現在 52 個のシナリオがあります。`live-frontier` のデフォルトレーンは、
高速なスモークカバレッジのために 10 シナリオに小さく保たれています。`mock-openai`
デフォルトレーンは、モデル出力だけをモックしながら、実際の WhatsApp
トランスポート経由で 45 シナリオを決定論的に実行します。承認シナリオと、いくつかの
重めまたはブロッキングのチェックは、シナリオ ID による明示指定のままです。

WhatsApp QA ドライバーは構造化されたライブイベント（`text`、`media`,
`location`, `reaction`, および `poll`）を観測し、メディア、投票、
連絡先、位置情報、ステッカーを能動的に送信できます。QA Lab はプライベートな
WhatsApp ランタイムファイルに踏み込むのではなく、`@openclaw/whatsapp/api.js`
パッケージサーフェス経由でそのドライバーをインポートします。グループ観測では、
`fromJid` はグループ JID であり、`participantJid` と `fromPhoneE164` は
参加者の送信者を識別します。メッセージ内容はデフォルトで編集されます。直接 Gateway の
投票、upload-file、メディア、グループ投票、グループメディア、返信形状プローブは
トランスポート/API コントラクトチェックです。ユーザープロンプトによってエージェントが
同じアクションを選択したことの証明としては扱われません。ユーザーパスのアクション証明は、
`whatsapp-agent-message-action-react` や
`whatsapp-group-agent-message-action-react` のようなシナリオから得られます。そこでは、
ドライバーが通常の WhatsApp メッセージを送信し、QA Lab が結果として生じるネイティブ
WhatsApp アーティファクトを観測します。WhatsApp レポートには各シナリオの姿勢
（`user-path`、`direct-gateway`、または `native-approval`）が含まれるため、
証拠が実際に証明しているより強いコントラクトと誤認されることはありません。

出力アーティファクト:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`
  でない限り本文は編集されます。

### Convex 認証情報プール

Discord、Slack、Telegram、WhatsApp レーンは、上記の env vars を読む代わりに
共有 Convex プールから認証情報をリースできます。`--credential-source convex`
を渡す（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定する）と、
QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に
解放します。プール種別は `"discord"`、`"slack"`、`"telegram"`、および
`"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` は数値のチャット ID 文字列である必要があります。
- Telegram 実ユーザー (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  Mantis Telegram Desktop 証明専用です。汎用 QA Lab レーンはこの種別を取得してはいけません。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話番号は異なる E.164 文字列である必要があります。

Mantis Telegram Desktop 証明ワークフローは、TDLib CLI ドライバーと Telegram Desktop
証人の両方に対して 1 つの排他的 Convex `telegram-user` リースを保持し、
証明を公開した後に解放します。

PR に決定論的な視覚差分が必要な場合、Mantis は Telegram フォーマッターまたは
配信レイヤーを変更しながら、`main` と PR head で同じモックモデル返信を使用できます。
キャプチャのデフォルトは PR コメント向けに調整されています。標準 Crabbox クラス、
24fps デスクトップ録画、24fps モーション GIF、1920px プレビュー幅です。
before/after コメントは、意図した GIF のみを含むクリーンなバンドルを公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形状チェックは現在、ブローカーではなく
Slack QA ランナー内にあります。`{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用し、
`Cxxxxxxxxxx` のような Slack チャネル ID を指定します。アプリとスコープのプロビジョニングについては
[Slack ワークスペースの設定](#setting-up-the-slack-workspace) を参照してください。

運用 env vars と Convex ブローカーエンドポイントのコントラクトは
[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)
にあります（セクション名はマルチチャネルプールより前のものです。リースセマンティクスは
種別間で共有されています）。

## リポジトリ由来のシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

これらは、QA 計画が人間とエージェントの両方に見えるように、意図的に git に入れられています。

`qa-lab` は汎用 YAML シナリオランナーのままです。各シナリオ YAML ファイルは
1 回のテスト実行における信頼できる情報源であり、以下を定義する必要があります:

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意のカテゴリ、機能、レーン、リスクメタデータ
- `scenario` 内の docs とコード参照
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の Gateway 設定パッチ
- フローシナリオ用の実行可能なトップレベル `flow`、または
  Vitest と Playwright シナリオ用の `scenario.execution.kind` / `scenario.execution.path`

`flow` を支える再利用可能なランタイムサーフェスは、汎用かつ横断的なままです。
たとえば、YAML シナリオは、特殊ケースのランナーを追加せずに、トランスポート側ヘルパーと、
Gateway `browser.request` seam 経由で埋め込み Control UI を操作するブラウザー側ヘルパーを
組み合わせることができます。

シナリオファイルは、ソースツリーフォルダーではなく、プロダクト機能別にグループ化する必要があります。
ファイルを移動してもシナリオ ID は安定させ、実装の追跡可能性には `docsRefs` と
`codeRefs` を使用してください。

ベースラインリストは、以下をカバーできるだけ十分に広く保つ必要があります:

- DM とチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- cron コールバック
- メモリ想起
- モデル切り替え
- サブエージェントへの引き継ぎ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 件

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。リポジトリ由来 QA とパリティゲート向けの
  デフォルトの決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、record/replay、カオスカバレッジのために
  AIMock 由来のプロバイダーサーバーを開始します。これは追加的なものであり、
  `mock-openai` シナリオディスパッチャーを置き換えません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、
auth-profile ステージング要件、ライブ/モック機能フラグを所有します。共有スイートと
Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリ経由でルーティングします。

## トランスポートアダプター

`qa-lab` は YAML QA シナリオ用の汎用トランスポート seam を所有します。`qa-channel` は
合成デフォルトです。`crabline` はローカルのプロバイダー形状サーバーを開始し、
OpenClaw の通常のチャネル Plugin をそれらに対して実行します。`live` は実際の
プロバイダー認証情報と外部チャネル用に予約されています。

アーキテクチャレベルでは、分割は次のとおりです:

- `qa-lab` は、汎用シナリオ実行、ワーカー並行性、アーティファクト書き込み、
  レポート作成を所有します。
- トランスポートアダプターは、Gateway 設定、readiness、インバウンドとアウトバウンドの観測、
  トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の YAML シナリオファイルはテスト実行を定義し、`qa-lab` は
  それらを実行する再利用可能なランタイムサーフェスを提供します。

### チャネルの追加

YAML QA システムにチャネルを追加するには、チャネル実装に加えて、チャネルコントラクトを
実行するシナリオパックが必要です。スモーク CI カバレッジ用には、対応する Crabline ローカル
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

ランナー Plugin はトランスポートコントラクトを所有します:

- 共有 `qa` ルートの下に `openclaw qa <runner>` をマウントする方法
- そのトランスポート向けに Gateway を設定する方法
- readiness の確認方法
- インバウンドイベントの注入方法
- アウトバウンドメッセージの観測方法
- トランスクリプトと正規化されたトランスポート状態の公開方法
- トランスポート由来アクションの実行方法
- トランスポート固有のリセットまたはクリーンアップの処理方法

新しいチャネルの最小採用基準:

1. 共有 `qa` ルートの所有者は `qa-lab` のままにします。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは、ランナー Plugin またはチャネルハーネス内に保持します。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントします。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別々のエントリーポイントの背後に置く必要があります。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で YAML シナリオを作成または適合させます。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスが動作し続けるようにします。

判定ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 振る舞いが単一のチャネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネス内に保持します。
- シナリオが複数のチャネルで利用できる新しい機能を必要とする場合は、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- 振る舞いが単一のトランスポートでのみ意味を持つ場合は、シナリオをトランスポート固有のままにし、そのことをシナリオ契約で明示します。

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

既存シナリオ向けには互換エイリアス `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` も引き続き利用できますが、新しいシナリオ作成では汎用名を使う必要があります。これらのエイリアスは一斉移行を避けるために存在しており、今後のモデルではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは以下に答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

利用可能なシナリオのインベントリは、フォローアップ作業の規模見積もりや新しいトランスポートの配線に役立ちます。`pnpm openclaw qa coverage` を実行します（機械可読な出力には `--json` を追加）。変更された振る舞いまたはファイルパスに対する焦点を絞った証明を選ぶ場合は、`pnpm openclaw qa coverage --match <query>` を実行します。マッチレポートはシナリオメタデータ、ドキュメント参照、コード参照、カバレッジ ID、Plugin、プロバイダー要件を検索し、一致する `qa suite --scenario ...` ターゲットを出力します。

各 `qa suite` 実行は、選択されたシナリオセットについて、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き込みます。`execution.kind: vitest` または `execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、シナリオごとのログも書き込みます。`execution.kind: script` を宣言するシナリオは、`execution.path` のエビデンス生成処理を `node --import tsx` 経由で実行します（`execution.args` 内の `${outputDir}` と `${scenarioId}` は展開されます）。生成処理は独自の `qa-evidence.json` を書き込み、そのエントリはスイート出力にインポートされ、アーティファクトパスはその生成処理の `qa-evidence.json` からの相対パスとして解決されます。`qa suite` が `qa run --qa-profile` 経由で到達された場合、同じ `qa-evidence.json` には、選択されたタクソノミーカテゴリのプロファイルスコアカード要約も含まれます。

カバレッジ出力は発見支援として扱い、ゲートの代替として扱わないでください。選択したシナリオには、テスト対象の振る舞いに適したプロバイダーモード、ライブトランスポート、Multipass、Testbox、またはリリースレーンが依然として必要です。スコアカードのコンテキストについては、[成熟度スコアカード](/ja-JP/maturity/scorecard) を参照してください。

キャラクターとスタイルのチェックでは、複数のライブモデル参照に対して同じシナリオを実行し、判定済みの Markdown レポートを書き込みます。

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター評価シナリオは `SOUL.md` を通じてペルソナを設定し、その後チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、評価中であることを伝えてはいけません。このコマンドは各完全なトランスクリプトを保持し、基本的な実行統計を記録してから、サポートされる場合は `xhigh` 推論を使用した高速モードで判定モデルに依頼し、自然さ、雰囲気、ユーモアで実行をランク付けします。プロバイダーを比較するときは `--blind-judge-models` を使用します。判定プロンプトにはすべてのトランスクリプトと実行ステータスが引き続き渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付けます。

候補実行はデフォルトで `high` thinking を使用し、GPT-5.5 では `medium`、対応する古い OpenAI 評価参照では `xhigh` を使用します。特定の候補は `--model provider/model,thinking=<level>` でインライン上書きします。インラインオプションは `fast`、`no-fast`、`fast=<bool>` もサポートします。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために保持されています。OpenAI 候補参照は、プロバイダーがサポートする場合に優先処理が使われるよう、デフォルトで高速モードになります。すべての候補モデルで高速モードを強制的に有効にしたい場合にのみ、`--fast` を渡します。候補と判定の所要時間はベンチマーク分析のためにレポートへ記録されますが、判定プロンプトでは速度でランク付けしないよう明示します。候補モデル実行と判定モデル実行はどちらもデフォルトで同時実行数 16 です。プロバイダーの制限やローカル Gateway の負荷によって実行がノイズ過多になる場合は、`--concurrency` または `--judge-concurrency` を下げます。

候補の `--model` が渡されない場合、キャラクター評価はデフォルトで `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` を使用します。`--judge-model` が渡されない場合、判定モデルはデフォルトで `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-8,thinking=high` になります。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [パーソナルエージェントベンチマークパック](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA チャネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
