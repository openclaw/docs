---
read_when:
    - QA スタック全体の連携を理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリ管理の QA シナリオの追加
    - Gateway ダッシュボードを対象に、より現実に近い QA 自動化を構築する
summary: 'QAスタックの概要: qa-lab、qa-channel、リポジトリベースのシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-03T21:31:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストよりも現実に近い、
チャネルに沿った形で OpenClaw を動かすためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、
  リアクション、編集、削除のサーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  受信メッセージの注入、Markdown レポートのエクスポートのためのデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来の runner plugins: 子 QA gateway 内の実チャネルを
  駆動するライブトランスポートアダプター。
- `qa/`: kickoff タスクとベースライン QA
  シナリオのためのリポジトリ管理のシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザーのスクリーンショット、VM 状態、PR 証拠が
  必要なバグのためのライブ検証の前後確認。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあり、どちらの形式もサポートされます。

| コマンド                                            | 目的                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA セルフチェック。Markdown レポートを書き出します。                                                                                                    |
| `qa suite`                                          | リポジトリ管理のシナリオを QA gateway レーンに対して実行します。エイリアス: 使い捨て Linux VM には `pnpm openclaw qa suite --runner multipass`。                       |
| `qa coverage`                                       | Markdown のシナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                       |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント型パリティレポートを書き出します。                                                                        |
| `qa character-eval`                                 | 複数のライブモデルでキャラクター QA シナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                        |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発のプロンプトを実行します。                                                                                                |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                      |
| `qa docker-build-image`                             | 事前作成済み QA Docker イメージをビルドします。                                                                                                                        |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                 |
| `qa up`                                             | QA サイトをビルドし、Docker backed スタックを起動して URL を出力します（エイリアス: `pnpm qa:lab:up`; `:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加）。 |
| `qa aimock`                                         | AIMock プロバイダーサーバーだけを起動します。                                                                                                                          |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーだけを起動します。                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                               |
| `qa matrix`                                         | 使い捨て Tuwunel homeserver に対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix) を参照してください。                                                 |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                               |
| `qa discord`                                        | 実際のプライベート Discord guild チャネルに対するライブトランスポートレーン。                                                                                          |
| `qa mantis`                                         | 最初の Discord ステータスリアクションシナリオを含む、ライブトランスポートバグの前後検証 runner。[Mantis](/ja-JP/concepts/mantis) を参照してください。                       |

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェント付き Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker backed gateway レーンを起動し、
QA Lab ページを公開します。そこでオペレーターまたは自動化ループは、エージェントに QA
ミッションを与え、実際のチャネル挙動を観察し、何が成功し、失敗し、
ブロックされたままだったかを記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより高速に反復するには、
bind マウントされた QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージのままにし、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナーに bind マウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザーが自動リロードします。

ローカル OpenTelemetry トレース smoke には、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` plugin を有効にした状態で `otel-trace-smoke` QA シナリオを実行し、その後
エクスポートされた protobuf span をデコードして、リリース上重要な形をアサートします:
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
モデル呼び出しは成功したターンで `StreamAbandoned` をエクスポートしてはなりません。生の診断 ID と
`openclaw.content.*` 属性はトレースに含めない必要があります。これは QA suite アーティファクトの横に
`otel-smoke-summary.json` を書き出します。

Observability QA はソース checkout 専用です。npm tarball は意図的に
QA Lab を省いているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。
診断インストルメンテーションを変更するときは、ビルド済みソース checkout から
`pnpm qa:otel:smoke` を使用してください。

実トランスポートの Matrix smoke レーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクト配置は [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel homeserver をプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix plugin を実行します（`qa-channel` は使いません）。その後、Markdown レポート、JSON サマリー、観測イベントアーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き出します。

実トランスポートの Telegram と Discord smoke レーン:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

どちらも 2 つの bot（driver + SUT）を持つ既存の実チャネルを対象にします。必要な環境変数、シナリオリスト、出力アーティファクト、Convex 認証情報プールは、下の [Telegram と Discord QA リファレンス](#telegram-and-discord-qa-reference) に記載されています。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker 環境をチェックし、endpoint 設定を検証し、メンテナー secret が存在する場合は admin/list の到達性を確認します。secret については set/missing 状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形式を発明するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成 product-behavior suite であり、ライブトランスポートカバレッジマトリクスには含まれません。

| レーン   | カナリア | メンションゲーティング | Bot 間 | Allowlist ブロック | トップレベル返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観察 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | -------- | ---------------------- | ------ | ------------------ | ---------------- | ---------- | ---------------------- | ------------ | ---------------- | -------------- | ---------------------- |
| Matrix   | x        | x                      | x      | x                  | x                | x          | x                      | x            | x                |                |                        |
| Telegram | x        | x                      | x      |                    |                  |            |                        |              |                  | x              |                        |
| Discord  | x        | x                      | x      |                    |                  |            |                        |              |                  |                | x                      |

これにより、`qa-channel` は広範な product-behavior suite として維持され、Matrix、
Telegram、将来のライブトランスポートは 1 つの明示的な transport-contract
チェックリストを共有します。

Docker を QA パスに持ち込まずに使い捨て Linux VM レーンを使うには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass guest を起動し、依存関係をインストールし、guest 内で OpenClaw をビルドし、
`qa suite` を実行してから、通常の QA レポートと
サマリーをホスト上の `.artifacts/qa-e2e/...` にコピーし戻します。
ホスト上の `qa suite` と同じシナリオ選択の挙動を再利用します。
ホストおよび Multipass suite の実行では、デフォルトで分離された gateway workers により、選択された複数シナリオを並列実行します。`qa-channel` のデフォルト同時実行数は
4 で、選択されたシナリオ数を上限とします。worker 数を調整するには `--concurrency <count>` を使用し、
シリアル実行には `--concurrency 1` を使用します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトが欲しい場合は `--allow-failures` を使用してください。
ライブ実行では、guest で実用的なサポート対象 QA 認証入力を転送します:
環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および
存在する場合は `CODEX_HOME`。guest がマウントされたワークスペース経由で書き戻せるように、
`--output-dir` はリポジトリルートの下に保ってください。

## Telegram と Discord QA リファレンス

Matrix はシナリオ数と Docker backed homeserver プロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix) があります。Telegram と Discord はより小規模で、それぞれ数個のシナリオ、プロファイルシステムなし、既存の実チャネル対象のため、リファレンスはここにあります。

### 共有 CLI フラグ

どちらのレーンも `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 経由で登録され、同じフラグを受け付けます:

| フラグ                                  | デフォルト                                                   | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | このシナリオだけを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | レポート、サマリー、観測メッセージ、出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                           | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 設定内の一時アカウント ID です。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` または `live-frontier`（従来の `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                          | プライマリ/代替モデル参照です。                                                                                         |
| `--fast`                              | オフ                                                       | 対応している場合のプロバイダー高速モードです。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                        | `--credential-source convex` のときに使用するロールです。                                                                          |

どちらもシナリオが失敗すると 0 以外で終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの別個のボット（driver + SUT）を使って、実在する 1 つのプライベート Telegram グループを対象にします。SUT ボットには Telegram ユーザー名が必要です。両方のボットで `@BotFather` の **Bot-to-Bot Communication Mode** を有効にしていると、ボット間の観測が最も安定します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は観測メッセージアーティファクト内にメッセージ本文を保持します（デフォルトでは秘匿化）。

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
- `telegram-qa-summary.json` — カナリアから始まる返信ごとの RTT（driver 送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り、本文は秘匿化されます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットを使って、実在する 1 つのプライベート Discord ギルドチャンネルを対象にします。1 つはハーネスが制御する driver ボットで、もう 1 つは子 OpenClaw Gateway が同梱 Discord Plugin を通じて起動する SUT ボットです。チャンネルメンション処理、SUT ボットが Discord にネイティブ `/help` コマンドを登録していること、オプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord から返される SUT ボットユーザー ID と一致している必要があります（一致しない場合、このレーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は観測メッセージアーティファクト内にメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — オプトインの Mantis シナリオです。SUT を常時オンかつツールのみのギルド返信に切り替え、`messages.statusReactions.enabled=true` を設定してから、REST リアクションタイムラインと HTML/PNG 視覚アーティファクトを取得するため、単独で実行されます。

Mantis ステータスリアクションシナリオを明示的に実行します:

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
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は秘匿化されます。
- ステータスリアクションシナリオの実行時は `discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Convex 認証情報プール

Telegram と Discord の両方のレーンは、上記の env vars を読む代わりに共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。プール種別は `"telegram"` と `"discord"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` は数値のチャット ID 文字列である必要があります。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

運用 env vars と Convex ブローカーエンドポイント契約は [テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります（セクション名は Discord 対応より前のものです。ブローカーの意味論はどちらの種別でも同じです）。

## リポジトリベースのシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは QA プランが人間とエージェントの両方に見えるように、意図的に git に含めています。

`qa-lab` は汎用的な Markdown ランナーのままにするべきです。各シナリオ Markdown ファイルは 1 回のテスト実行の信頼できる情報源であり、次を定義する必要があります:

- シナリオメタデータ
- 任意のカテゴリ、ケイパビリティ、レーン、リスクメタデータ
- ドキュメントとコード参照
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用的で横断的なままで構いません。たとえば、Markdown シナリオは、特別扱いのランナーを追加せずに、Gateway `browser.request` seam 経由で埋め込み Control UI を操作するブラウザー側ヘルパーと、トランスポート側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーフォルダーではなくプロダクトケイパビリティごとにグループ化するべきです。ファイル移動時もシナリオ ID は安定させてください。実装の追跡可能性には `docsRefs` と `codeRefs` を使います。

ベースラインリストは次をカバーできる程度に広く保つべきです:

- DM とチャンネルチャット
- スレッドの挙動
- メッセージアクションライフサイクル
- Cron コールバック
- メモリ想起
- モデル切り替え
- サブエージェント引き継ぎ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。リポジトリベース QA とパリティゲートのデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジ用に AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、auth-profile ステージング要件、live/mock ケイパビリティフラグを所有します。共有 suite と Gateway コードは、プロバイダー名で分岐する代わりにプロバイダーレジストリを経由するべきです。

## トランスポートアダプター

`qa-lab` は Markdown QA シナリオ用の汎用トランスポート seam を所有します。`qa-channel` はその seam 上の最初のアダプターですが、設計対象はより広範です。将来の実在または合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じ suite ランナーに接続するべきです。

アーキテクチャレベルでの分割は次のとおりです:

- `qa-lab` は汎用シナリオ実行、ワーカー並行実行、アーティファクト書き込み、レポートを所有します。
- トランスポートアダプターは Gateway 設定、準備完了、受信および送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` がそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

Markdown QA システムにチャンネルを追加するには、厳密に次の 2 つが必要です:

1. チャンネル用のトランスポートアダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホスト機構を所有します:

- `openclaw qa` コマンドルート
- suite の起動と終了処理
- ワーカー並行実行
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を所有します:

- `openclaw qa <runner>` を共有 `qa` ルートの下にマウントする方法
- そのトランスポート向けに Gateway を設定する方法
- 準備完了を確認する方法
- 受信イベントを注入する方法
- 送信メッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに裏付けられたアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャンネルの最小導入基準:

1. 共有 `qa` ルートの所有者として `qa-lab` を維持します。
2. 共有 `qa-lab` ホスト seam 上にトランスポートランナーを実装します。
3. トランスポート固有の機構はランナー Plugin またはチャンネルハーネス内に保ちます。
4. 競合するルートコマンドを登録する代わりに、ランナーを `openclaw qa <runner>` としてマウントします。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートするべきです。`runtime-api.ts` は軽く保ってください。遅延 CLI とランナー実行は別々のエントリポイントの背後に置くべきです。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応します。
6. 新しいシナリオでは汎用シナリオヘルパーを使います。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続けます。

判断ルールは厳密です:

- 挙動を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 挙動が 1 つのチャンネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネス内に保ちます。
- 複数のチャンネルが使える新しいケイパビリティをシナリオが必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加する代わりに汎用ヘルパーを追加します。
- 1 つのトランスポートに対してのみ意味のある挙動の場合は、シナリオをトランスポート固有に保ち、そのことをシナリオ契約で明示します。

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

互換性エイリアスは既存のシナリオ向けに引き続き利用できます。`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` です。ただし、新しいシナリオ作成では汎用名を使用してください。これらのエイリアスは一斉移行を避けるために存在しており、今後の標準形ではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートでは次を答える必要があります。

- 動作したこと
- 失敗したこと
- ブロックされたままだったこと
- 追加する価値のあるフォローアップシナリオ

利用可能なシナリオの一覧は、フォローアップ作業の規模見積もりや新しいトランスポートの配線に役立ちます。`pnpm openclaw qa coverage` を実行してください（機械可読な出力には `--json` を追加します）。

キャラクターとスタイルのチェックでは、同じシナリオを複数のライブモデル参照で実行し、判定済みの Markdown レポートを書き出します。

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター評価シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後、チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行してください。候補モデルには、評価中であることを伝えないでください。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録したうえで、対応している場合は `xhigh` reasoning を使った高速モードでジャッジモデルに尋ね、自然さ、雰囲気、ユーモアで実行結果を順位付けします。
プロバイダーを比較する場合は `--blind-judge-models` を使用してください。ジャッジプロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後に順位を実際の参照へ対応付けます。
候補実行の thinking は既定で `high` です。GPT-5.5 では `medium`、それをサポートする旧 OpenAI 評価参照では `xhigh` になります。特定の候補は `--model provider/model,thinking=<level>` でインライン上書きできます。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI 候補参照は既定で高速モードになり、プロバイダーが対応している場合は優先処理が使用されます。単一の候補またはジャッジで上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加してください。すべての候補モデルで高速モードを強制したい場合のみ、`--fast` を渡します。ベンチマーク分析のために候補とジャッジの所要時間はレポートに記録されますが、ジャッジプロンプトでは速度で順位付けしないよう明示的に指示します。
候補とジャッジモデルの実行は、どちらも既定で concurrency 16 です。プロバイダー制限やローカル Gateway の負荷によって実行のノイズが大きくなる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、キャラクター評価は既定で `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、および `google/gemini-3.1-pro-preview` を使用します。
`--judge-model` が渡されない場合、ジャッジは既定で `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-6,thinking=high` になります。

## 関連ドキュメント

- [マトリックスQA](/ja-JP/concepts/qa-matrix)
- [QAチャネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
