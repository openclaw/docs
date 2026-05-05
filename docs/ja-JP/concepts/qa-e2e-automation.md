---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリに基づく QA シナリオの追加
    - Gateway ダッシュボードを対象に、より実運用に近い QA 自動化を構築する
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリに基づくシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-05T01:45:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストよりも現実に近い、
チャンネルの形に沿った方法で OpenClaw を実行するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャンネル、スレッド、
  リアクション、編集、削除のサーフェスを持つ合成メッセージチャンネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  受信メッセージの注入、Markdown レポートのエクスポートを行うデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来のランナーPlugin: 子 QA Gateway 内で
  実チャンネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA
  シナリオ用のリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザスクリーンショット、VM 状態、PR 証跡が
  必要なバグの修正前後ライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くは `pnpm qa:*`
スクリプトエイリアスを持ち、どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA 自己チェック。Markdown レポートを書き込みます。                                                                                                                            |
| `qa suite`                                          | リポジトリ管理シナリオを QA Gateway レーンに対して実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                                |
| `qa coverage`                                       | Markdown のシナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                             |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェントによるパリティレポートを書き込みます。                                                                                          |
| `qa character-eval`                                 | 複数のライブモデルに対してキャラクター QA シナリオを実行し、判定付きレポートを作成します。[レポート](#reporting)を参照してください。                                                        |
| `qa manual`                                         | 選択されたプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                      |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                            |
| `qa docker-build-image`                             | 事前作成済み QA Docker イメージをビルドします。                                                                                                                                              |
| `qa docker-scaffold`                                | QA ダッシュボード + Gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                                      |
| `qa up`                                             | QA サイトをビルドし、Docker ベースのスタックを起動して、URL を出力します（エイリアス: `pnpm qa:lab:up`; `:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加）。 |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                                |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                          |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                     |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対するライブトランスポートレーンです。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                 |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーンです。                                                                                                                |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャンネルに対するライブトランスポートレーンです。                                                                                                         |
| `qa slack`                                          | 実際のプライベート Slack チャンネルに対するライブトランスポートレーンです。                                                                                                                 |
| `qa mantis`                                         | Discord ステータスリアクション証跡、Crabbox デスクトップ/ブラウザスモーク、Slack-in-VNC スモークを含む、ライブトランスポートバグの修正前後検証ランナーです。[Mantis](/ja-JP/concepts/mantis)を参照してください。 |

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker ベースの Gateway レーンを起動して、
オペレーターまたは自動化ループがエージェントに QA
ミッションを与え、実チャンネルの動作を観察し、成功したこと、失敗したこと、
またはブロックされたままのことを記録できる QA Lab ページを公開します。

毎回 Docker イメージをリビルドせずに QA Lab UI をすばやく反復するには、
バインドマウントされた QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上に維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルをリビルドし、QA Lab
アセットハッシュが変わるとブラウザが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` Plugin を有効にして
`otel-trace-smoke` QA シナリオを実行した後、
エクスポートされた protobuf スパンをデコードし、リリース上重要な形を検証します。
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
成功したターンでモデル呼び出しが `StreamAbandoned` をエクスポートしてはいけません。生の診断 ID と
`openclaw.content.*` 属性はトレースから除外されている必要があります。QA スイート成果物の隣に
`otel-smoke-summary.json` を書き込みます。

Observability QA はソースチェックアウト専用のままです。npm tarball は意図的に
QA Lab を除外しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。
診断インストルメンテーションを変更する場合は、ビルド済みソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

実トランスポート Matrix スモークレーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、成果物レイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel ホームサーバーをプロビジョニングし、一時的なドライバー/SUT/オブザーバーユーザーを登録し、そのトランスポートにスコープされた子 QA Gateway 内で実際の Matrix Plugin を実行し（`qa-channel` なし）、Markdown レポート、JSON サマリー、観測イベント成果物、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き込みます。

実トランスポート Telegram、Discord、Slack スモークレーンには、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

これらは 2 つのボット（ドライバー + SUT）を持つ既存の実チャンネルを対象にします。必要な環境変数、シナリオ一覧、出力成果物、Convex 認証情報プールは、下の [Telegram、Discord、Slack QA リファレンス](#telegram-discord-and-slack-qa-reference)に記載されています。

VNC レスキュー付きの完全な Slack デスクトップ VM 実行には、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブレーンを実行し、
VNC ブラウザで Slack Web を開き、デスクトップをキャプチャして、
`slack-qa/` と `slack-desktop-smoke.png` を Mantis 成果物ディレクトリへコピーします。
VNC 経由で Slack Web に手動ログインした後、`--lease-id <cbx_...>` を再利用してください。
`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack
Gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、コマンドは
通常のボット間 Slack QA レーンを実行し、成果物キャプチャ後に終了します。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカー環境をチェックし、エンドポイント設定を検証し、メンテナーシークレットが存在する場合は admin/list 到達性を確認します。シークレットについては set/missing 状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を作るのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、ライブトランスポートカバレッジマトリックスの一部ではありません。

| レーン   | Canary | メンションゲート | ボット間 | Allowlist ブロック | トップレベル返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観察 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | ---------------- | -------- | ------------------ | ---------------- | ---------- | ---------------------- | ------------ | ------------------ | -------------- | ------------------------ |
| Matrix   | x      | x                | x        | x                  | x                | x          | x                      | x            | x                  |                |                          |
| Telegram | x      | x                | x        |                    |                  |            |                        |              |                    | x              |                          |
| Discord  | x      | x                | x        |                    |                  |            |                        |              |                    |                | x                        |
| Slack    | x      | x                | x        |                    |                  |            |                        |              |                    |                |                          |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方で、
Matrix、Telegram、将来のライブトランスポートは 1 つの明示的なトランスポート契約
チェックリストを共有します。

QA パスに Docker を持ち込まない使い捨て Linux VM レーンには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより新しい Multipass ゲストが起動し、依存関係がインストールされ、ゲスト内で OpenClaw がビルドされ、`qa suite` が実行された後、通常の QA レポートとサマリーがホスト上の `.artifacts/qa-e2e/...` にコピーされます。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストと Multipass のスイート実行では、デフォルトで、選択された複数のシナリオを分離された Gateway ワーカーで並列実行します。`qa-channel` のデフォルト並行数は 4 で、選択されたシナリオ数が上限です。ワーカー数を調整するには `--concurrency <count>` を使用し、シリアル実行には `--concurrency 1` を使用します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
ライブ実行では、ゲストで実用的なサポート対象の QA 認証入力が転送されます。env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルート配下に置いてください。

## Telegram、Discord、Slack QA リファレンス

Matrix はシナリオ数が多く、Docker ベースの homeserver プロビジョニングがあるため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack はより小規模で、それぞれ少数のシナリオのみ、プロファイルシステムなし、既存の実チャンネルを対象とするため、リファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                                         | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | このシナリオのみを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | レポート、サマリー、観測メッセージ、出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定内の一時アカウント id です。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                                | プライマリ/代替モデル参照です。                                                                                         |
| `--fast`                              | オフ                                                             | サポートされている場合のプロバイダー高速モードです。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                              | `--credential-source convex` の場合に使用されるロールです。                                                                          |

各レーンはいずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なる bot（ドライバー + SUT）を持つ、1 つの実プライベート Telegram グループを対象にします。SUT bot には Telegram ユーザー名が必要です。bot 間の観測は、両方の bot で `@BotFather` の **Bot-to-Bot Communication Mode** が有効な場合に最もよく動作します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数値のチャット id（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します（デフォルトではリダクトされます）。

シナリオ（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）:

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

出力アーティファクト:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — canary から始まる返信ごとの RTT（ドライバー送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り本文はリダクトされます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つの bot を持つ、1 つの実プライベート Discord guild チャンネルを対象にします。ハーネスが制御するドライバー bot と、バンドルされた Discord Plugin を通じて子 OpenClaw Gateway によって起動される SUT bot です。チャンネルメンション処理、SUT bot が Discord にネイティブ `/help` コマンドを登録していること、オプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord が返す SUT bot ユーザー id と一致している必要があります（一致しない場合、レーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — オプトインの Mantis シナリオです。SUT を常時オン、ツールのみの guild 返信に切り替え、`messages.statusReactions.enabled=true` を指定したうえで、REST リアクションタイムラインと HTML/PNG ビジュアルアーティファクトをキャプチャするため、単独で実行されます。

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り本文はリダクトされます。
- ステータスリアクションシナリオが実行された場合は、`discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

2 つの異なる bot を持つ、1 つの実プライベート Slack チャンネルを対象にします。ハーネスが制御するドライバー bot と、バンドルされた Slack Plugin を通じて子 OpenClaw Gateway によって起動される SUT bot です。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）:

- `slack-canary`
- `slack-mention-gating`

出力アーティファクト:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り本文はリダクトされます。

#### Slack ワークスペースのセットアップ

このレーンには、1 つのワークスペース内に 2 つの異なる Slack app と、両方の bot がメンバーになっているチャンネルが必要です。

- `channelId` — 両方の bot が招待されているチャンネルの `Cxxxxxxxxxx` id です。専用チャンネルを使用してください。このレーンは実行のたびに投稿します。
- `driverBotToken` — **Driver** app の bot token（`xoxb-...`）です。
- `sutBotToken` — **SUT** app の bot token（`xoxb-...`）です。bot ユーザー id が異なるように、ドライバーとは別の Slack app である必要があります。
- `sutAppToken` — `connections:write` を持つ SUT app の app-level token（`xapp-...`）です。SUT app がイベントを受信できるように Socket Mode で使用されます。

本番ワークスペースを再利用するより、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を反映しています。ユーザーから見える本番チャンネルセットアップについては、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup)を参照してください。QA Driver/SUT ペアは、レーンが 1 つのワークスペース内で 2 つの異なる bot ユーザー id を必要とするため、意図的に分離されています。

**1. Driver app を作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動し、_Create New App_ → _From a manifest_ → QA ワークスペースを選択、以下のマニフェストを貼り付け、_Install to Workspace_ を実行します。

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

_Bot User OAuth Token_（`xoxb-...`）をコピーします。これが `driverBotToken` になります。ドライバーはメッセージを投稿し、自身を識別するだけでよいため、イベントも Socket Mode も不要です。

**2. SUT app を作成する**

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

Slack が app を作成した後、その設定ページで 2 つの作業を行います。

- _Install to Workspace_ → _Bot User OAuth Token_ をコピー → これが `sutBotToken` になります。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → これが `sutAppToken` になります。

各トークンで `auth.test` を呼び出して、2 つのボットが別々のユーザー ID を持つことを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。両方に 1 つのアプリを再利用すると、mention-gating は即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から両方のボットを招待します。

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_チャンネル情報 → 概要 → チャンネル ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。パブリックチャンネルで問題ありません。プライベートチャンネルを使う場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンのデバッグには env vars を使います（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、CI と他のメンテナーがリースできるように共有 Convex プールにシードします。

Convex プールでは、4 つのフィールドを JSON ファイルに書き込みます。

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` を export した状態で、登録して確認します。

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなし、となることを期待します。

**5. エンドツーエンドで確認する**

ブローカー経由で両方のボットが相互に会話できることを確認するため、レーンをローカルで実行します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常な実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` では `slack-canary` と `slack-mention-gating` の両方がステータス `pass` になります。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空か、すべての行がリース中です。`qa credentials list --kind slack --status all --json` でどちらかを確認できます。

### Convex 認証情報プール

Telegram、Discord、Slack レーンは、上記の env vars を読み取る代わりに共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡すか、`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します。QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。プールの種類は `"telegram"`、`"discord"`、`"slack"` です。

`admin/add` でブローカーが検証するペイロード形状:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` は数値チャット ID 文字列である必要があります。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` は `^[A-Z][A-Z0-9]+$`（`Cxxxxxxxxxx` のような Slack ID）に一致する必要があります。アプリとスコープのプロビジョニングについては、[Slack ワークスペースの設定](#setting-up-the-slack-workspace)を参照してください。

運用用 env vars と Convex ブローカーエンドポイント契約は、[Testing → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)にあります（セクション名は Discord 対応前のものですが、ブローカーのセマンティクスは両方の種類で同一です）。

## リポジトリ backed seeds

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に入れてあり、QA プランが人間とエージェントの両方に見えるようにしています。

`qa-lab` は汎用 Markdown ランナーのままにするべきです。各シナリオ Markdown ファイルは、1 つのテスト実行の信頼できる情報源であり、次を定義するべきです。

- シナリオメタデータ
- 任意の category、capability、lane、risk メタデータ
- docs と code refs
- 任意の Plugin 要件
- 任意の Gateway config patch
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイム surface は、汎用かつ横断的なままで構いません。たとえば Markdown シナリオは、特別なケースのランナーを追加せずに、Gateway `browser.request` seam 経由で埋め込み Control UI を操作するブラウザー側ヘルパーと、transport 側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーフォルダーではなく、プロダクト capability ごとにグループ化するべきです。ファイルを移動してもシナリオ ID は安定させてください。実装の traceability には `docsRefs` と `codeRefs` を使います。

ベースラインリストは、次をカバーするのに十分な広さを保つべきです。

- DM とチャンネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- cron コールバック
- メモリ recall
- モデル切り替え
- サブエージェント handoff
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## Provider mock レーン

`qa suite` には 2 つのローカル provider mock レーンがあります。

- `mock-openai` は、シナリオを認識する OpenClaw mock です。リポジトリ backed QA と parity gate のデフォルト決定的 mock レーンのままです。
- `aimock` は、実験的なプロトコル、fixture、record/replay、chaos coverage のために AIMock backed provider server を起動します。これは追加的なものであり、`mock-openai` シナリオ dispatcher を置き換えるものではありません。

provider レーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。各 provider は、自身のデフォルト、ローカルサーバー起動、Gateway モデル config、auth-profile staging needs、live/mock capability flags を所有します。共有 suite と Gateway コードは、provider 名で分岐するのではなく provider registry 経由でルーティングするべきです。

## Transport アダプター

`qa-lab` は Markdown QA シナリオ向けの汎用 transport seam を所有します。`qa-channel` はその seam 上の最初のアダプターですが、設計対象はさらに広いものです。将来の実在または合成チャンネルは、transport 固有の QA ランナーを追加するのではなく、同じ suite runner に接続するべきです。

アーキテクチャレベルでの分割は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、ワーカー concurrency、アーティファクト書き込み、レポートを所有します。
- transport アダプターは、Gateway config、readiness、inbound と outbound の observation、transport actions、正規化された transport state を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` がそれらを実行する再利用可能なランタイム surface を提供します。

### チャンネルを追加する

Markdown QA システムにチャンネルを追加するには、正確に 2 つのものが必要です。

1. そのチャンネルの transport アダプター。
2. そのチャンネル契約を exercise するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンド root を追加しないでください。

`qa-lab` は共有ホスト mechanics を所有します。

- `openclaw qa` コマンド root
- suite startup と teardown
- ワーカー concurrency
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの compatibility aliases

Runner plugins は transport contract を所有します。

- 共有 `qa` root の下に `openclaw qa <runner>` をどう mount するか
- その transport 向けに Gateway をどう設定するか
- readiness をどう確認するか
- inbound events をどう inject するか
- outbound messages をどう observe するか
- transcripts と正規化された transport state をどう公開するか
- transport backed actions をどう実行するか
- transport 固有の reset や cleanup をどう扱うか

新しいチャンネルの最小採用基準:

1. 共有 `qa` root の所有者として `qa-lab` を維持する。
2. 共有 `qa-lab` ホスト seam 上に transport runner を実装する。
3. transport 固有の mechanics は runner plugin または channel harness 内に保つ。
4. 競合する root command を登録するのではなく、runner を `openclaw qa <runner>` として mount する。Runner plugins は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export するべきです。`runtime-api.ts` は軽く保ち、lazy CLI と runner execution は別 entrypoint の背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. リポジトリが意図的な移行を行っている場合を除き、既存の compatibility aliases を動作させ続ける。

判断ルールは厳格です。

- 動作を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 動作が 1 つのチャンネル transport に依存する場合は、その runner plugin または plugin harness に保ちます。
- あるシナリオが複数のチャンネルで使える新しい capability を必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- ある動作が 1 つの transport にのみ意味を持つ場合は、そのシナリオを transport 固有に保ち、シナリオ契約内でそれを明示します。

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

既存シナリオ向けには compatibility aliases も引き続き利用できます — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — ただし、新しいシナリオ作成では汎用名を使うべきです。これらの alias は flag-day migration を避けるためのものであり、今後のモデルではありません。

## レポート

`qa-lab` は、観測された bus timeline から Markdown プロトコルレポートを export します。
レポートは次に答えるべきです。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のある follow-up シナリオは何か

利用可能なシナリオの inventory については、follow-up 作業の見積もりや新しい transport の wiring に役立つため、`pnpm openclaw qa coverage` を実行します（machine-readable output には `--json` を追加します）。

character と style checks では、同じシナリオを複数の live model refs で実行し、judge された Markdown レポートを書き込みます。

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター評価シナリオでは、`SOUL.md` を通じてペルソナを設定してから、チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、評価されていることを伝えないでください。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録してから、サポートされている場合は `xhigh` 推論を使った高速モードで判定モデルに実行を自然さ、雰囲気、ユーモアでランク付けするよう依頼します。
プロバイダーを比較する場合は `--blind-judge-models` を使用します。判定プロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` などの中立ラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付けます。
候補実行のデフォルトは `high` 思考で、GPT-5.5 では `medium`、それをサポートする古い OpenAI 評価参照では `xhigh` です。特定の候補をインラインで上書きするには `--model provider/model,thinking=<level>` を使用します。`--thinking <level>` は引き続きグローバルなフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために保持されています。
OpenAI 候補参照のデフォルトは高速モードで、プロバイダーがサポートする場合は優先処理が使用されます。単一の候補または判定に上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加します。すべての候補モデルで高速モードを強制的に有効にしたい場合にのみ `--fast` を渡します。候補と判定の所要時間はベンチマーク分析のためにレポートに記録されますが、判定プロンプトでは速度でランク付けしないよう明示されています。
候補モデル実行と判定モデル実行の同時実行数はいずれもデフォルトで 16 です。プロバイダー制限やローカル Gateway の負荷によって実行のノイズが大きすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補の `--model` が渡されていない場合、キャラクター評価のデフォルトは
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` です。
`--judge-model` が渡されていない場合、判定モデルのデフォルトは
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [マトリックス QA](/ja-JP/concepts/qa-matrix)
- [QA チャンネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
