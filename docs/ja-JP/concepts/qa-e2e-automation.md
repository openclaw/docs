---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリに基づく QA シナリオの追加
    - Gateway ダッシュボードを対象にした、より実環境に近い QA 自動化の構築
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリベースのシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート作成。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-04T04:58:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストで可能な範囲よりも現実に近い、チャンネルに沿った形で OpenClaw を実行することを目的としています。

現在の構成要素:

- `extensions/qa-channel`: DM、チャンネル、スレッド、
  リアクション、編集、削除のサーフェスを持つ合成メッセージチャンネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  インバウンドメッセージの注入、Markdown レポートのエクスポートを行うデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来のランナー Plugin: 子 QA Gateway 内で
  実際のチャンネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA
  シナリオ用のリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザのスクリーンショット、
  VM の状態、PR 証拠が必要なバグに対する事前および事後のライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA セルフチェック。Markdown レポートを書き出します。                                                                                                                         |
| `qa suite`                                          | QA Gateway レーンに対してリポジトリ管理シナリオを実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                               |
| `qa coverage`                                       | Markdown のシナリオカバレッジ目録を出力します（機械出力には `--json`）。                                                                                                                    |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント的パリティレポートを書き出します。                                                                                             |
| `qa character-eval`                                 | 複数のライブモデルにわたってキャラクター QA シナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                                     |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発のプロンプトを実行します。                                                                                                                     |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                            |
| `qa docker-build-image`                             | 事前構築済み QA Docker イメージをビルドします。                                                                                                                                             |
| `qa docker-scaffold`                                | QA ダッシュボード + Gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                                      |
| `qa up`                                             | QA サイトをビルドし、Docker ベースのスタックを起動して URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加）。 |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                               |
| `qa mock-openai`                                    | シナリオ認識型の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                    |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                     |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                    |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャンネルに対するライブトランスポートレーン。                                                                                                             |
| `qa slack`                                          | 実際のプライベート Slack チャンネルに対するライブトランスポートレーン。                                                                                                                     |
| `qa mantis`                                         | ライブトランスポートバグの事前および事後検証ランナー。Discord ステータスリアクション証拠、Crabbox デスクトップ/ブラウザスモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis)を参照してください。 |

## オペレーターフロー

現在の QA オペレーターフローは、2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker ベースの Gateway レーンが起動し、
QA Lab ページが公開されます。そこでオペレーターまたは自動化ループは、エージェントに QA
ミッションを与え、実際のチャンネル動作を観察し、動作したこと、失敗したこと、または
ブロックされたままのことを記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより高速に反復するには、
バインドマウントされた QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前構築済みイメージ上で維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナーにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` Plugin を有効にして `otel-trace-smoke` QA シナリオを実行した後、
エクスポートされた protobuf span をデコードして、リリース上重要な形を検証します:
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
モデル呼び出しは成功したターンで `StreamAbandoned` をエクスポートしてはなりません。生の診断 ID と
`openclaw.content.*` 属性はトレースに含めない必要があります。QA スイートアーティファクトの横に
`otel-smoke-summary.json` を書き出します。

Observability QA はソースチェックアウト専用のままです。npm tarball は意図的に
QA Lab を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。
診断インストルメンテーションを変更するときは、ビルド済みソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

トランスポート実体ありの Matrix スモークレーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、env vars、アーティファクトレイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概略: Docker 内に使い捨て Tuwunel ホームサーバーをプロビジョニングし、一時的なドライバー/SUT/オブザーバーユーザーを登録し、そのトランスポートにスコープされた子 QA Gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使用しません）、その後 Markdown レポート、JSON サマリー、観測イベントアーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` 配下に書き出します。

トランスポート実体ありの Telegram、Discord、Slack スモークレーンには、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

これらは 2 つのボット（ドライバー + SUT）を持つ既存の実チャンネルを対象にします。必要な env vars、シナリオ一覧、出力アーティファクト、Convex 認証情報プールは、下の [Telegram、Discord、Slack QA リファレンス](#telegram-discord-and-slack-qa-reference)に記載されています。

VNC レスキュー付きの完全な Slack デスクトップ VM 実行には、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブレーンを実行し、
VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、
`slack-qa/` と `slack-desktop-smoke.png` を Mantis アーティファクト
ディレクトリにコピーします。VNC 経由で Slack Web に手動ログインした後、
`--lease-id <cbx_...>` を再利用してください。`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack
Gateway を VM 内のポート `38973` で起動したままにします。指定しない場合、コマンドは通常の
ボット対ボット Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカー env を確認し、エンドポイント設定を検証し、メンテナーシークレットが存在する場合は admin/list の到達性を検証します。シークレットについては設定済み/欠落の状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオ一覧形式を発明するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、ライブトランスポートカバレッジマトリクスの一部ではありません。

| レーン   | Canary | メンションゲーティング | ボット対ボット | Allowlist ブロック | トップレベル返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観察 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | ---------------------- | -------------- | ------------------ | ---------------- | ---------- | ---------------------- | ------------ | ---------------- | -------------- | ---------------------- |
| Matrix   | x      | x                      | x              | x                  | x                | x          | x                      | x            | x                |                |                        |
| Telegram | x      | x                      | x              |                    |                  |            |                        |              |                  | x              |                        |
| Discord  | x      | x                      | x              |                    |                  |            |                        |              |                  |                | x                      |
| Slack    | x      | x                      | x              |                    |                  |            |                        |              |                  |                |                        |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方、Matrix、
Telegram、将来のライブトランスポートは 1 つの明示的なトランスポート契約
チェックリストを共有します。

Docker を QA パスに持ち込まずに使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw
をビルドし、`qa suite` を実行してから、通常の QA レポートと
サマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストと Multipass のスイート実行は、既定では分離された Gateway ワーカーで
選択された複数のシナリオを並列実行します。`qa-channel` の既定の並行数は
4 で、選択されたシナリオ数が上限です。ワーカー数を調整するには
`--concurrency <count>` を使用し、シリアル実行には `--concurrency 1` を使用します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしで
成果物が必要な場合は `--allow-failures` を使用します。
ライブ実行では、ゲストで実用的なサポート対象の QA 認証入力が転送されます:
env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および
存在する場合は `CODEX_HOME`。ゲストがマウントされたワークスペース経由で
書き戻せるように、`--output-dir` はリポジトリルート配下に置いてください。

## Telegram、Discord、Slack の QA リファレンス

Matrix には、シナリオ数と Docker ベースのホームサーバープロビジョニングがあるため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack はより小規模で、それぞれ少数のシナリオ、プロファイルシステムなし、既存の実チャンネルに対する実行なので、それらのリファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 経由で登録され、同じフラグを受け付けます:

| フラグ                                | 既定値                                                          | 説明                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | このシナリオだけを実行します。繰り返し指定できます。                                                                  |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | レポート、サマリー、観測メッセージ、および出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                 |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定内の一時アカウント id です。                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` または `live-frontier` です（レガシーの `live-openai` も引き続き動作します）。                          |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーの既定値                                            | プライマリ/代替モデル ref です。                                                                                      |
| `--fast`                              | オフ                                                            | サポートされる場合のプロバイダー高速モードです。                                                                      |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                  |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                         | `--credential-source convex` の場合に使用されるロールです。                                                           |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずに成果物を書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なる bot（ドライバー + SUT）を持つ、1 つの実際のプライベート Telegram グループを対象にします。SUT bot には Telegram ユーザー名が必要です。bot 間の観測は、両方の bot で `@BotFather` の **Bot-to-Bot Communication Mode** が有効になっている場合に最もよく機能します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数値のチャット id（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は、観測メッセージ成果物内のメッセージ本文を保持します（既定ではマスク）。

シナリオ（`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`）:

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

出力成果物:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — canary から始まる返信ごとの RTT（ドライバー送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り、本文はマスクされます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つの bot を持つ、1 つの実際のプライベート Discord ギルドチャンネルを対象にします: ハーネスで制御されるドライバー bot と、同梱の Discord Plugin 経由で子 OpenClaw Gateway により起動される SUT bot です。チャンネルメンション処理、SUT bot が Discord にネイティブの `/help` コマンドを登録済みであること、およびオプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord が返す SUT bot ユーザー id と一致する必要があります（一致しない場合、このレーンは早期に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージ成果物内のメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — オプトインの Mantis シナリオです。SUT を常時オン、ツールのみのギルド返信に切り替え、`messages.statusReactions.enabled=true` を設定してから、REST リアクションタイムラインと HTML/PNG ビジュアル成果物をキャプチャするため、単独で実行されます。

Mantis ステータスリアクションシナリオを明示的に実行します:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

出力成果物:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文はマスクされます。
- ステータスリアクションシナリオを実行した場合は `discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

2 つの異なる bot を持つ、1 つの実際のプライベート Slack チャンネルを対象にします: ハーネスで制御されるドライバー bot と、同梱の Slack Plugin 経由で子 OpenClaw Gateway により起動される SUT bot です。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージ成果物内のメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）:

- `slack-canary`
- `slack-mention-gating`

出力成果物:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文はマスクされます。

### Convex 認証情報プール

Telegram、Discord、Slack のレーンは、上記の env vars を読む代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat を送信し、シャットダウン時に解放します。プール kind は `"telegram"`、`"discord"`、`"slack"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` は数値の chat-id 文字列である必要があります。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

運用 env vars と Convex ブローカーエンドポイント契約は、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)にあります（このセクション名は Discord サポートより前のものです。ブローカーのセマンティクスは両方の kind で同一です）。

## リポジトリベースのシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に置かれているため、QA 計画は人間と
エージェントの両方から見えます。

`qa-lab` は汎用の Markdown ランナーのままにする必要があります。各シナリオ Markdown ファイルは
1 回のテスト実行の信頼できる情報源であり、次を定義する必要があります:

- シナリオメタデータ
- 任意のカテゴリ、機能、レーン、リスクメタデータ
- docs と code refs
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用的で
横断的なままにできます。たとえば、Markdown シナリオはトランスポート側
ヘルパーとブラウザー側ヘルパーを組み合わせ、専用ランナーを追加せずに
Gateway の `browser.request` シーム経由で埋め込み Control UI を操作できます。

シナリオファイルは、ソースツリーフォルダーではなく製品機能ごとに
グループ化する必要があります。ファイルを移動してもシナリオ ID は安定させ、実装の追跡可能性には
`docsRefs` と `codeRefs` を使用してください。

ベースラインリストは、次をカバーできる程度に広く保つ必要があります:

- DM とチャンネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリリコール
- モデル切り替え
- サブエージェントの引き継ぎ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。これは、リポジトリベースの QA とパリティゲートの既定の
  決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、
  fixture、record/replay、chaos カバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、
  `mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、自身の既定値、ローカルサーバー起動、Gateway モデル設定、
auth-profile ステージング要件、およびライブ/モック機能フラグを所有します。共有スイートと
Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリ経由でルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は、Markdown QA シナリオ用の汎用トランスポートシームを所有します。`qa-channel` はそのシーム上の最初のアダプターですが、設計上の対象はより広範です。将来の実チャンネルまたは合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じスイートランナーに接続する必要があります。

アーキテクチャレベルでは、分割は次のとおりです:

- `qa-lab` は、汎用シナリオ実行、ワーカー並行性、成果物書き込み、レポートを所有します。
- トランスポートアダプターは、Gateway 設定、準備完了状態、受信および送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

Markdown QA システムにチャンネルを追加するには、正確に 2 つのものが必要です:

1. そのチャンネル用のトランスポートアダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカーの並行実行
- アーティファクトの書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を所有します。

- 共有 `qa` ルートの下に `openclaw qa <runner>` をマウントする方法
- そのトランスポート向けに Gateway を構成する方法
- 準備完了を確認する方法
- インバウンドイベントを注入する方法
- アウトバウンドメッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに裏付けられたアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャネルの最小採用基準:

1. 共有 `qa` ルートの所有者は `qa-lab` のままにします。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みはランナー Plugin またはチャネルハーネス内に保持します。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントします。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から一致する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別のエントリポイントの背後に置きます。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適用します。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を行っているのでない限り、既存の互換エイリアスを機能させ続けます。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できるなら、`qa-lab` に置きます。
- 振る舞いが 1 つのチャネルトランスポートに依存するなら、そのランナー Plugin または Plugin ハーネス内に保持します。
- 複数のチャネルで使える新しい機能がシナリオに必要なら、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- ある振る舞いが 1 つのトランスポートでしか意味を持たないなら、シナリオをトランスポート固有のままにし、それをシナリオ契約で明示します。

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

既存のシナリオでは互換エイリアス（`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`）も引き続き利用できますが、新しいシナリオの作成では汎用名を使う必要があります。これらのエイリアスは、一斉移行を避けるために存在するものであり、今後のモデルではありません。

## レポート

`qa-lab` は、観測されたバスのタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次の問いに答える必要があります。

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

利用可能なシナリオの一覧（フォローアップ作業の規模見積もりや新しいトランスポートの配線に役立ちます）を確認するには、`pnpm openclaw qa coverage` を実行します（機械可読出力には `--json` を追加します）。

文字とスタイルのチェックでは、同じシナリオを複数のライブモデル refs で実行し、判定済みの Markdown レポートを書き込みます。

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

このコマンドは Docker ではなく、ローカル QA Gateway の子プロセスを実行します。キャラクター評価シナリオでは `SOUL.md` を通じてペルソナを設定し、その後チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、評価されていることを伝えるべきではありません。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録したうえで、対応している場合は `xhigh` 推論を使った高速モードで判定モデルに依頼し、自然さ、雰囲気、ユーモアで実行結果をランク付けします。プロバイダーを比較するときは `--blind-judge-models` を使用します。判定プロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補 refs は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後にランキングを実際の refs に対応付けます。
候補実行はデフォルトで `high` の思考レベルを使い、GPT-5.5 では `medium`、それをサポートする古い OpenAI 評価 refs では `xhigh` を使います。特定の候補を上書きするには `--model provider/model,thinking=<level>` をインラインで指定します。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI 候補 refs はデフォルトで高速モードになり、プロバイダーが対応している場合は優先処理が使用されます。単一の候補または判定モデルで上書きが必要な場合は、`,fast`、`,no-fast`、または `,fast=false` をインラインで追加します。すべての候補モデルで高速モードを強制的にオンにしたい場合にのみ、`--fast` を渡します。候補と判定の所要時間はベンチマーク分析のためにレポートへ記録されますが、判定プロンプトでは速度でランク付けしないよう明示されています。
候補モデルと判定モデルの実行はいずれもデフォルトで並行数 16 です。プロバイダーの制限やローカル Gateway の負荷により実行がノイズの多いものになる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、キャラクター評価はデフォルトで `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、および `google/gemini-3.1-pro-preview` になります。
`--judge-model` が渡されない場合、判定モデルはデフォルトで `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-6,thinking=high` になります。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [QA Channel](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
