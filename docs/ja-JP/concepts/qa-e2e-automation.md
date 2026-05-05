---
read_when:
    - QAスタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリベースの QA シナリオの追加
    - Gateway ダッシュボードを中心に、より実運用に近い品質保証自動化を構築する
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリを基盤とするシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート作成。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-05T04:50:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストではできない、より現実的でチャネルに沿った形で OpenClaw を実行するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、
  リアクション、編集、削除のサーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  インバウンドメッセージの注入、Markdown レポートのエクスポートのためのデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来のランナー Plugin: 子 QA gateway 内で
  実際のチャネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA
  シナリオ用のリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザーのスクリーンショット、VM 状態、PR 証拠を必要とするバグのための
  修正前後のライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA セルフチェック。Markdown レポートを書き込みます。                                                                                                                          |
| `qa suite`                                          | リポジトリ管理シナリオを QA gateway レーンに対して実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                                |
| `qa coverage`                                       | Markdown のシナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                             |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント的なパリティレポートを書き込みます。                                                                                            |
| `qa character-eval`                                 | 複数のライブモデルにわたってキャラクター QA シナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                                       |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                        |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                             |
| `qa docker-build-image`                             | 事前構築済み QA Docker イメージをビルドします。                                                                                                                                              |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                                       |
| `qa up`                                             | QA サイトをビルドし、Docker-backed スタックを起動し、URL を出力します（エイリアス: `pnpm qa:lab:up`; `:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加）。 |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                                |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 資格情報プールを管理します。                                                                                                                                                     |
| `qa matrix`                                         | 使い捨て Tuwunel homeserver に対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                         |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                     |
| `qa discord`                                        | 実際のプライベート Discord guild チャネルに対するライブトランスポートレーン。                                                                                                                |
| `qa slack`                                          | 実際のプライベート Slack チャネルに対するライブトランスポートレーン。                                                                                                                        |
| `qa mantis`                                         | ライブトランスポートバグ向けの修正前後の検証ランナー。Discord ステータスリアクション証拠、Crabbox デスクトップ/ブラウザースモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis)を参照してください。 |

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェント付きの Gateway ダッシュボード（Control UI）。
- 右: QA Lab。Slack 風のトランスクリプトとシナリオプランを表示します。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker-backed gateway レーンを起動し、オペレーターまたは自動化ループがエージェントに QA
ミッションを与え、実チャネルの挙動を観察し、何が動作し、何が失敗し、何がブロックされたままだったかを記録できる
QA Lab ページを公開します。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより高速に反復するには、
bind-mounted QA Lab bundle でスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージのまま保ち、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナーに bind-mount します。`qa:lab:watch`
は変更時にその bundle を再ビルドし、QA Lab のアセットハッシュが変わるとブラウザーが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、`diagnostics-otel` Plugin を有効にして
`otel-trace-smoke` QA シナリオを実行し、その後エクスポートされた protobuf spans をデコードしてリリースクリティカルな形状を検証します:
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在している必要があります。
成功したターンではモデル呼び出しが `StreamAbandoned` をエクスポートしてはなりません。生の診断 ID と
`openclaw.content.*` 属性はトレースに含めてはいけません。QA suite アーティファクトの横に
`otel-smoke-summary.json` を書き込みます。

Observability QA はソースチェックアウト専用のままです。npm tarball は意図的に
QA Lab を省略しているため、パッケージ Docker リリースレーンは `qa` コマンドを実行しません。診断
インストルメンテーションを変更する場合は、ビルド済みのソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

トランスポート実体の Matrix スモークレーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel homeserver をプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使いません）、その後 Markdown レポート、JSON サマリー、observed-events アーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` 配下に書き込みます。

トランスポート実体の Telegram、Discord、Slack スモークレーン:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

これらは 2 つの bot（driver + SUT）を持つ既存の実チャネルを対象にします。必須の環境変数、シナリオリスト、出力アーティファクト、Convex 資格情報プールは、下の [Telegram、Discord、Slack QA リファレンス](#telegram-discord-and-slack-qa-reference)に記載されています。

VNC レスキュー付きの完全な Slack デスクトップ VM 実行には、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザーマシンをリースし、VM 内で Slack ライブレーンを実行し、
VNC ブラウザーで Slack Web を開き、デスクトップをキャプチャし、ビデオキャプチャが利用可能な場合は
`slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4`
を Mantis アーティファクトディレクトリへコピーします。VNC 経由で Slack Web に手動ログインした後は `--lease-id <cbx_...>` を再利用してください。
`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack
gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、このコマンドは通常の bot-to-bot Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

エージェント/CV スタイルのデスクトップタスクには、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` は Crabbox デスクトップ/ブラウザーマシンをリースまたは再利用し、
`crabbox record --while` を開始し、ネストされた
`visual-driver` を通じて表示中のブラウザーを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe`
を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き込みます。
`--expect-text` が設定されている場合、ビジョンプロンプトは構造化 JSON
判定を求め、モデルが肯定的な可視証拠を報告した場合にのみ合格します。
対象テキストを引用するだけの否定応答はアサーションに失敗します。
`--vision-mode metadata` は、画像理解
プロバイダーを呼び出さずにデスクトップ、ブラウザー、スクリーンショット、ビデオの配管を検証する no-model スモークに使用します。
記録は `visual-task` の必須アーティファクトです。Crabbox が空でない
`visual-task.mp4` を記録しなかった場合、visual driver
が合格していてもタスクは失敗します。失敗時、タスクがすでに合格していて `--keep-lease` が設定されていない場合を除き、Mantis は VNC 用にリースを保持します。

プールされたライブ資格情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker 環境をチェックし、endpoint 設定を検証し、maintainer secret が存在する場合は admin/list の到達性を検証します。secret については設定済み/未設定の状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を考案するのではなく、1 つの契約を共有します。`qa-channel` は幅広い合成プロダクト挙動 suite であり、ライブトランスポートカバレッジマトリックスの一部ではありません。

| レーン     | カナリア | メンションゲーティング | ボット間 | 許可リストブロック | トップレベル返信 | 再起動後の再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          |                 |                 |                |                  |                  |                      |              |                             |

これにより、`qa-channel` は広範な製品動作スイートのままになり、Matrix、
Telegram、および将来のライブトランスポートは、1つの明示的なトランスポート契約
チェックリストを共有します。

QA パスに Docker を持ち込まずに使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw
をビルドし、`qa suite` を実行したあと、通常の QA レポートと
サマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストと Multipass のスイート実行は、デフォルトで分離された Gateway ワーカーを使って、
選択された複数のシナリオを並列に実行します。`qa-channel` のデフォルトの並行数は
4で、選択されたシナリオ数を上限とします。ワーカー数を調整するには `--concurrency <count>` を使い、
シリアル実行には `--concurrency 1` を使います。
いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトが必要な場合は `--allow-failures` を使います。
ライブ実行では、ゲストで実用的なサポート対象 QA 認証入力が転送されます。
env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および
存在する場合の `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるよう、
`--output-dir` はリポジトリルート配下に置いてください。

## Telegram、Discord、Slack QA リファレンス

Matrix は、シナリオ数と Docker ベースのホームサーバープロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack はより小規模で、それぞれ数個のシナリオ、プロファイルシステムなし、既存の実チャンネルに対して実行するため、リファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 経由で登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                                         | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | このシナリオのみを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | レポート、サマリー、観測メッセージ、および出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定内の一時アカウント ID です。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                                | プライマリ/代替モデル参照です。                                                                                         |
| `--fast`                              | オフ                                                             | サポートされる場合のプロバイダー高速モードです。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                              | `--credential-source convex` の場合に使われるロールです。                                                                          |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2つの異なるボット（ドライバー + SUT）を持つ1つの実プライベート Telegram グループを対象にします。SUT ボットには Telegram ユーザー名が必要です。ボット間観測は、両方のボットで `@BotFather` の **Bot-to-Bot Communication Mode** が有効な場合に最もよく動作します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内にメッセージ本文を保持します（デフォルトではマスクされます）。

シナリオ（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）:

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

出力アーティファクト:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — カナリアから始まる返信ごとの RTT（ドライバー送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り、本文はマスクされます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2つのボットを持つ1つの実プライベート Discord ギルドチャンネルを対象にします。ハーネスが制御するドライバーボットと、子 OpenClaw Gateway がバンドルされた Discord Plugin 経由で開始する SUT ボットです。チャンネルメンション処理、SUT ボットが Discord にネイティブ `/help` コマンドを登録していること、およびオプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord から返される SUT ボットユーザー ID と一致している必要があります（一致しない場合、このレーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内にメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — オプトインの Mantis シナリオです。SUT を `messages.statusReactions.enabled=true` で常時オン、ツールのみのギルド返信に切り替えたうえで、REST リアクションタイムラインと HTML/PNG の視覚アーティファクトを取得するため、単独で実行されます。Mantis の before/after レポートも、シナリオが提供する MP4 アーティファクトを `baseline.mp4` と `candidate.mp4` として保持します。

Mantis ステータスリアクションシナリオを明示的に実行します。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

出力アーティファクト:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文はマスクされます。
- ステータスリアクションシナリオが実行された場合は、`discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

2つの異なるボットを持つ1つの実プライベート Slack チャンネルを対象にします。ハーネスが制御するドライバーボットと、子 OpenClaw Gateway がバンドルされた Slack Plugin 経由で開始する SUT ボットです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内にメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）:

- `slack-canary`
- `slack-mention-gating`

出力アーティファクト:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文はマスクされます。

#### Slack ワークスペースの設定

このレーンには、1つのワークスペース内に2つの異なる Slack アプリと、両方のボットがメンバーになっているチャンネルが必要です。

- `channelId` — 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` ID です。専用チャンネルを使ってください。このレーンは実行のたびに投稿します。
- `driverBotToken` — **Driver** アプリのボットトークン（`xoxb-...`）です。
- `sutBotToken` — **SUT** アプリのボットトークン（`xoxb-...`）です。ドライバーとは別の Slack アプリである必要があり、これによりボットユーザー ID が異なります。
- `sutAppToken` — `connections:write` を持つ SUT アプリのアプリレベルトークン（`xapp-...`）です。Socket Mode が SUT アプリでイベントを受信するために使います。

本番ワークスペースを再利用するより、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を反映しています。ユーザーが見る本番チャンネル設定については、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup)を参照してください。QA Driver/SUT ペアは、1つのワークスペース内に2つの異なるボットユーザー ID が必要なため、意図的に分離されています。

**1. Driver アプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動し、_Create New App_ → _From a manifest_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから、_Install to Workspace_ を選択します。

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

_Bot User OAuth Token_（`xoxb-...`）をコピーします。これが `driverBotToken` になります。ドライバーはメッセージを投稿し、自身を識別するだけでよく、イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。スコープセットは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を反映しています。

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
        "reactions:read",
        "reactions:write",
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
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Slack がアプリを作成したら、その設定ページで次の 2 つを行います。

- _Install to Workspace_ → _Bot User OAuth Token_ をコピー → それが `sutBotToken` になります。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → それが `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットが別々のユーザー ID を持つことを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。1 つのアプリを両方に再利用すると、メンションゲーティングが即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から両方のボットを招待します。

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。パブリックチャンネルで問題ありません。プライベートチャンネルを使う場合も、両方のアプリにはすでに `groups:history` があるため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには環境変数を使います（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、共有 Convex プールにシードして、CI や他のメンテナーがリースできるようにします。

Convex プールの場合、4 つのフィールドを JSON ファイルに書き込みます。

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` をエクスポートした状態で、登録して確認します。

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなしを期待します。

**5. エンドツーエンドで検証する**

ブローカー経由で両方のボットが互いに通信できることを確認するため、ローカルでレーンを実行します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常な実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` には `slack-canary` と `slack-mention-gating` の両方がステータス `pass` として表示されます。レーンが約 90 秒間ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空か、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらか確認できます。

### Convex 認証情報プール

Telegram、Discord、Slack のレーンは、上記の環境変数を読む代わりに共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。プール種別は `"telegram"`、`"discord"`、`"slack"` です。

`admin/add` でブローカーが検証するペイロード形状:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` は数値のチャット ID 文字列である必要があります。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` は `^[A-Z][A-Z0-9]+$`（`Cxxxxxxxxxx` のような Slack ID）に一致する必要があります。アプリとスコープのプロビジョニングについては、[Slack ワークスペースの設定](#setting-up-the-slack-workspace)を参照してください。

運用環境変数と Convex ブローカーエンドポイント契約は、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります（このセクション名は Discord サポートより前のものです。ブローカーのセマンティクスは両方の種別で同一です）。

## リポジトリベースのシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に含めてあり、QA 計画が人間とエージェントの両方に見えるようにしています。

`qa-lab` は汎用の Markdown ランナーのままであるべきです。各シナリオ Markdown ファイルは、1 回のテスト実行の信頼できる情報源であり、次を定義する必要があります。

- シナリオメタデータ
- 任意のカテゴリ、機能、レーン、リスクのメタデータ
- ドキュメントとコード参照
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用かつ横断的なままでよいです。たとえば、Markdown シナリオでは、特別ケースのランナーを追加せずに、トランスポート側のヘルパーと、組み込み Control UI を Gateway の `browser.request` シーム経由で操作するブラウザー側ヘルパーを組み合わせられます。

シナリオファイルは、ソースツリーフォルダーではなく製品機能別にグループ化する必要があります。ファイルを移動するときもシナリオ ID は安定させてください。実装の追跡可能性には `docsRefs` と `codeRefs` を使用します。

ベースラインリストは、次をカバーできる程度に広く保つ必要があります。

- DM とチャンネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリ想起
- モデル切り替え
- サブエージェントの引き継ぎ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります。

- `mock-openai` はシナリオ対応の OpenClaw モックです。これは、リポジトリベースの QA とパリティゲートのデフォルトの決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、認証プロファイルのステージング要件、ライブ/モック機能フラグを所有します。共有スイートと Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリ経由でルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は Markdown QA シナリオ向けの汎用トランスポートシームを所有します。`qa-channel` はそのシーム上の最初のアダプターですが、設計対象はより広いです。将来の実チャンネルまたは合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じスイートランナーに接続する必要があります。

アーキテクチャレベルでは、分割は次のとおりです。

- `qa-lab` は汎用シナリオ実行、ワーカー並行処理、アーティファクト書き込み、レポートを所有します。
- トランスポートアダプターは、Gateway 設定、準備完了、受信および送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルを追加する

Markdown QA システムにチャンネルを追加するには、正確に 2 つのものが必要です。

1. そのチャンネルのトランスポートアダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並行処理
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を所有します。

- `openclaw qa <runner>` が共有 `qa` ルート配下にどのようにマウントされるか
- Gateway がそのトランスポート向けにどのように設定されるか
- 準備完了がどのように確認されるか
- 受信イベントがどのように注入されるか
- 送信メッセージがどのように観測されるか
- トランスクリプトと正規化されたトランスポート状態がどのように公開されるか
- トランスポートに裏付けられたアクションがどのように実行されるか
- トランスポート固有のリセットまたはクリーンアップがどのように処理されるか

新しいチャンネルの最小導入基準:

1. 共有 `qa` ルートの所有者として `qa-lab` を維持する。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装する。
3. トランスポート固有の仕組みをランナー Plugin またはチャンネルハーネス内に保つ。
4. 競合するルートコマンドを登録する代わりに、ランナーを `openclaw qa <runner>` としてマウントする。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽く保ち、遅延 CLI とランナー実行は別のエントリポイントの背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使用する。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です。

- 動作を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 動作が 1 つのチャンネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネスに保ちます。
- シナリオが複数のチャンネルで使える新しい機能を必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- 動作が 1 つのトランスポートにのみ意味を持つ場合は、シナリオをトランスポート固有に保ち、それをシナリオ契約で明示します。

### シナリオヘルパー名

新しいシナリオに推奨される汎用ヘルパー:

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

既存シナリオ向けには互換エイリアス（`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`）が引き続き利用できますが、新しいシナリオ作成では汎用名を使用する必要があります。これらのエイリアスは一斉移行を避けるために存在しており、今後のモデルとして存在するものではありません。

## レポート

`qa-lab` は観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次に答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

利用可能なシナリオのインベントリ（フォローアップ作業の規模見積もりや新しいトランスポートの配線に便利）については、`pnpm openclaw qa coverage` を実行します（機械可読出力には `--json` を追加します）。

文字とスタイルのチェックでは、同じシナリオを複数のライブモデル参照で実行し、判定済み Markdown レポートを書き込みます。

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドは Docker ではなく、ローカル QA Gateway の子プロセスを実行します。キャラクター評価シナリオでは、`SOUL.md` でペルソナを設定してから、チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、評価されていることを伝えるべきではありません。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録してから、対応している場合は `xhigh` 推論を使った fast モードで判定モデルに実行結果を自然さ、雰囲気、ユーモアでランク付けさせます。
プロバイダーを比較するときは `--blind-judge-models` を使用します。判定プロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` のような中立的なラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付け直します。
候補実行のデフォルトは `high` thinking で、GPT-5.5 は `medium`、それに対応している古い OpenAI 評価参照は `xhigh` です。特定の候補を上書きするには、`--model provider/model,thinking=<level>` のようにインラインで指定します。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI 候補参照はデフォルトで fast モードになり、プロバイダーが対応している場合は優先処理が使用されます。単一の候補または判定モデルで上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加します。すべての候補モデルで fast モードを強制的に有効にしたい場合にのみ、`--fast` を渡してください。候補と判定モデルの所要時間はベンチマーク分析のためにレポートへ記録されますが、判定プロンプトには速度でランク付けしないよう明示されます。
候補と判定モデルの実行はどちらもデフォルトで同時実行数 16 です。プロバイダーの制限やローカル Gateway の負荷で実行結果のノイズが大きすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補の `--model` が渡されていない場合、キャラクター評価はデフォルトで、`--model` が渡されていないときに `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、および `google/gemini-3.1-pro-preview` を使用します。
`--judge-model` が渡されていない場合、判定モデルのデフォルトは `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [マトリックス QA](/ja-JP/concepts/qa-matrix)
- [QA Channel](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
