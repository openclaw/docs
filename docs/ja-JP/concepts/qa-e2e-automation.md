---
read_when:
    - QA スタックがどのように連携しているかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリベースのQAシナリオの追加
    - Gateway ダッシュボードを対象に、より実運用に近い品質保証自動化を構築する
summary: 'QAスタックの概要: qa-lab、qa-channel、リポジトリベースのシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: 品質保証の概要
x-i18n:
    generated_at: "2026-04-30T05:09:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストよりも現実的で、
チャネルの形に沿った方法で OpenClaw を検証するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、
  編集、削除のサーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  受信メッセージの注入、Markdown レポートのエクスポートを行うためのデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来の runner plugins: 子 QA gateway 内の実際のチャネルを駆動する
  ライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA
  シナリオ用の、リポジトリ管理のシードアセット。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` 配下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあり、どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA 自己チェック。Markdown レポートを書き出します。                                                                                                      |
| `qa suite`                                          | リポジトリ管理のシナリオを QA gateway レーンに対して実行します。エイリアス: 破棄可能な Linux VM には `pnpm openclaw qa suite --runner multipass`。                     |
| `qa coverage`                                       | Markdown のシナリオカバレッジ一覧を出力します（機械出力には `--json`）。                                                                                                |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント型 parity-gate レポートを書き出します。                                                                    |
| `qa character-eval`                                 | 複数のライブモデルに対してキャラクター QA シナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                  |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発のプロンプトを実行します。                                                                                                |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                      |
| `qa docker-build-image`                             | 事前ベイク済みの QA Docker イメージをビルドします。                                                                                                                    |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                  |
| `qa up`                                             | QA サイトをビルドし、Docker ベースのスタックを起動して、URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` 変種は `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加）。 |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                          |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                               |
| `qa matrix`                                         | 破棄可能な Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix) を参照してください。                                            |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                               |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャネルに対するライブトランスポートレーン。                                                                                           |

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker ベースの gateway レーンを起動して、
オペレーターまたは自動化ループがエージェントに QA
ミッションを与え、実際のチャネル動作を観察し、成功したこと、失敗したこと、
またはブロックされたままのことを記録できる QA Lab ページを公開します。

毎回 Docker イメージを再ビルドせずに QA Lab UI を高速に反復するには、
バインドマウントされた QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上で維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch` は
変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザーが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` plugin を有効にして `otel-trace-smoke` QA シナリオを実行し、その後
エクスポートされた protobuf span をデコードして、リリースクリティカルな形状を検証します。
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
成功したターンではモデル呼び出しが `StreamAbandoned` をエクスポートしてはいけません。生の診断 ID と
`openclaw.content.*` 属性はトレースに含まれてはいけません。これは
QA suite アーティファクトの隣に `otel-smoke-summary.json` を書き出します。

Observability QA はソースチェックアウト専用のままです。npm tarball には意図的に
QA Lab が含まれていないため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。
診断インストルメンテーションを変更する場合は、ビルド済みのソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

実トランスポートの Matrix スモークレーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクト配置は [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に破棄可能な Tuwunel ホームサーバーをプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix plugin を実行し（`qa-channel` は使用しません）、その後 Markdown レポート、JSON サマリー、observed-events アーティファクト、結合された出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` 配下に書き出します。

実トランスポートの Telegram と Discord スモークレーンには、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

どちらも 2 つの bot（driver + SUT）を持つ既存の実チャネルを対象にします。必要な環境変数、シナリオ一覧、出力アーティファクト、Convex 認証情報プールは、下記の [Telegram と Discord QA リファレンス](#telegram-and-discord-qa-reference) に記載されています。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker 環境をチェックし、エンドポイント設定を検証し、
メンテナーシークレットが存在する場合は admin/list 到達性を確認します。シークレットについては設定済み/未設定の状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオ一覧形式を発明するのではなく、1 つのコントラクトを共有します。`qa-channel` は広範な合成プロダクト動作 suite であり、ライブトランスポートカバレッジマトリクスの一部ではありません。

| レーン   | カナリア | Mention ゲーティング | Bot 間 | Allowlist ブロック | トップレベル返信 | 再起動後の再開 | スレッドフォローアップ | スレッド分離 | リアクション観察 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | -------- | -------------------- | ------ | ------------------ | ---------------- | -------------- | ---------------------- | ------------ | ---------------- | -------------- | ---------------------- |
| Matrix   | x        | x                    | x      | x                  | x                | x              | x                      | x            | x                |                |                        |
| Telegram | x        | x                    | x      |                    |                  |                |                        |              |                  | x              |                        |
| Discord  | x        | x                    | x      |                    |                  |                |                        |              |                  |                | x                      |

これにより、`qa-channel` は広範なプロダクト動作 suite として維持される一方で、Matrix、
Telegram、および将来のライブトランスポートは 1 つの明示的なトランスポートコントラクト
チェックリストを共有します。

Docker を QA パスに持ち込まずに破棄可能な Linux VM レーンを使うには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、
`qa suite` を実行してから、通常の QA レポートと
サマリーをホスト上の `.artifacts/qa-e2e/...` にコピーして戻します。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストと Multipass の suite 実行は、デフォルトで分離された gateway worker を使い、
選択された複数のシナリオを並列に実行します。`qa-channel` のデフォルト同時実行数は
4 で、選択されたシナリオ数によって上限が決まります。worker 数を調整するには
`--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。
いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしで
アーティファクトが必要な場合は `--allow-failures` を使用してください。
ライブ実行は、ゲストで実用的なサポート済み QA 認証入力を転送します。
環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、
および存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、
`--output-dir` はリポジトリルート配下に維持してください。

## Telegram と Discord QA リファレンス

Matrix はシナリオ数と Docker ベースのホームサーバープロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix) があります。Telegram と Discord はより小規模で、それぞれ少数のシナリオ、プロファイルシステムなし、既存の実チャネルに対する実行であるため、リファレンスはここにあります。

### 共有 CLI フラグ

どちらのレーンも `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                                   | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | このシナリオだけを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | レポート、サマリー、観測メッセージ、出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                           | 中立の cwd から呼び出す場合のリポジトリルート。                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 設定内の一時アカウント ID。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` または `live-frontier`（従来の `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                          | プライマリ/代替モデル参照。                                                                                         |
| `--fast`                              | オフ                                                       | サポートされている場合のプロバイダー高速モード。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                        | `--credential-source convex` のときに使用されるロール。                                                                          |

どちらも、失敗したシナリオがあると 0 以外で終了します。`--allow-failures` は、失敗の終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（driver + SUT）を持つ、実在する 1 つのプライベート Telegram グループを対象にします。SUT ボットには Telegram ユーザー名が必要です。ボット間の観測は、両方のボットで `@BotFather` の **Bot-to-Bot Communication Mode** が有効な場合に最も安定して動作します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します（デフォルトでは秘匿）。

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
- `telegram-qa-summary.json` — canary から始まる返信ごとの RTT（driver 送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り本文は秘匿されます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットがある、実在する 1 つのプライベート Discord ギルドチャンネルを対象にします。1 つはハーネスが制御する driver ボット、もう 1 つはバンドルされた Discord Plugin を通じて子 OpenClaw Gateway が起動する SUT ボットです。チャンネルメンション処理と、SUT ボットが Discord にネイティブの `/help` コマンドを登録していることを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord が返す SUT ボットユーザー ID と一致している必要があります（一致しない場合、このレーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

出力アーティファクト:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り本文は秘匿されます。

### Convex 認証情報プール

Telegram と Discord の両方のレーンは、上記の env vars を読み取る代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。プール種別は `"telegram"` と `"discord"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` は数値のチャット ID 文字列である必要があります。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

運用 env vars と Convex ブローカーエンドポイント契約は、[Testing → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)にあります（このセクション名は Discord サポートより前のものです。ブローカーのセマンティクスは両方の種別で同一です）。

## リポジトリ backed シード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に入れられており、QA 計画が人間とエージェントの両方に見えるようになっています。

`qa-lab` は汎用 Markdown ランナーのままにする必要があります。各シナリオ Markdown ファイルは、1 回のテスト実行に対する信頼できる情報源であり、次を定義する必要があります。

- シナリオメタデータ
- 任意のカテゴリ、ケイパビリティ、レーン、リスクメタデータ
- docs とコード参照
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用かつ横断的なままでかまいません。たとえば、Markdown シナリオは、特別なケースのランナーを追加せずに、Gateway `browser.request` seam 経由で埋め込み Control UI を操作するブラウザー側ヘルパーと、transport 側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーフォルダーではなく製品ケイパビリティごとにグループ化する必要があります。ファイルが移動してもシナリオ ID は安定させ、実装のトレーサビリティには `docsRefs` と `codeRefs` を使用してください。

ベースラインリストは、次をカバーできる程度に広く保つ必要があります。

- DM とチャンネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリ想起
- モデル切り替え
- サブエージェントへのハンドオフ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には、2 つのローカルプロバイダーモックレーンがあります。

- `mock-openai` は、シナリオ対応の OpenClaw モックです。リポジトリ backed QA と parity gate のデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、fixture、記録/再生、chaos カバレッジのために AIMock backed プロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、auth-profile ステージング要件、live/mock ケイパビリティフラグを所有します。共有 suite と Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを経由してルーティングする必要があります。

## Transport アダプター

`qa-lab` は、Markdown QA シナリオ用の汎用 transport seam を所有します。`qa-channel` はその seam 上の最初のアダプターですが、設計対象はもっと広く、将来の実在または合成チャンネルは、transport 固有の QA ランナーを追加するのではなく、同じ suite ランナーに接続する必要があります。

アーキテクチャレベルでの分割は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、ワーカー並行処理、アーティファクト書き込み、レポート作成を所有します。
- transport アダプターは、Gateway 設定、ready 状態、受信および送信の観測、transport アクション、正規化された transport 状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` がそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルを追加する

Markdown QA システムにチャンネルを追加するには、厳密に 2 つのものが必要です。

1. そのチャンネル用の transport アダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホスト機構を所有します。

- `openclaw qa` コマンドルート
- suite の起動と終了処理
- ワーカー並行処理
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin は transport 契約を所有します。

- 共有 `qa` ルート配下に `openclaw qa <runner>` をマウントする方法
- その transport 向けに Gateway を設定する方法
- ready 状態を確認する方法
- 受信イベントを注入する方法
- 送信メッセージを観測する方法
- transcript と正規化された transport 状態を公開する方法
- transport backed アクションを実行する方法
- transport 固有のリセットやクリーンアップを処理する方法

新しいチャンネルの最小採用基準:

1. 共有 `qa` ルートの所有者として `qa-lab` を維持する。
2. 共有 `qa-lab` ホスト seam 上に transport ランナーを実装する。
3. transport 固有の機構をランナー Plugin またはチャンネルハーネス内に保つ。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽く保ち、lazy CLI とランナー実行は別エントリポイントの背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適用する。
6. 新しいシナリオには汎用シナリオヘルパーを使用する。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できるなら、`qa-lab` に置く。
- 振る舞いが 1 つのチャンネル transport に依存するなら、そのランナー Plugin または Plugin ハーネス内に保つ。
- シナリオに複数のチャンネルが使用できる新しいケイパビリティが必要な場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加する。
- 振る舞いが 1 つの transport にだけ意味を持つ場合は、シナリオを transport 固有に保ち、シナリオ契約でそれを明示する。

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

互換エイリアスは既存シナリオ向けに引き続き利用できます — `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` — ただし、新しいシナリオ作成では汎用名を使用してください。これらのエイリアスは一斉移行を避けるために存在しており、今後のモデルではありません。

## レポート

`qa-lab` は、観測された bus タイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次に答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値があるフォローアップシナリオは何か

利用可能なシナリオの一覧は、フォローアップ作業の規模見積もりや新しい transport の配線に便利です。`pnpm openclaw qa coverage` を実行します（機械可読な出力には `--json` を追加）。

文字とスタイルのチェックでは、同じシナリオを複数の live model
ref で実行し、判定済みの Markdown レポートを書き出します。

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

このコマンドは Docker ではなく、ローカルの QA Gateway 子プロセスを実行します。Character eval
シナリオでは `SOUL.md` を通じて persona を設定し、その後に chat、workspace help、小さな file task などの通常の user turn を実行する必要があります。candidate model には、評価中であることを伝えないでください。このコマンドは各完全な
transcript を保持し、基本的な実行統計を記録したうえで、サポートされる場合は `xhigh` reasoning を使った fast mode で judge model に問い合わせ、naturalness、vibe、humor によって実行を順位付けします。
provider を比較する場合は `--blind-judge-models` を使用します。judge prompt には引き続きすべての transcript と実行 status が渡されますが、candidate ref は `candidate-01` のような中立的な label に置き換えられます。report は parsing 後にランキングを実際の ref に対応付けます。
candidate run は既定で `high` thinking になり、GPT-5.5 では `medium`、それをサポートする古い OpenAI eval ref では `xhigh` になります。特定の candidate は
`--model provider/model,thinking=<level>` で inline に上書きします。`--thinking <level>` は引き続き global fallback を設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI candidate ref は既定で fast mode になり、provider がサポートしている場合は priority processing が使用されます。単一の candidate または judge に上書きが必要な場合は、inline で `,fast`、`,no-fast`、または `,fast=false` を追加します。すべての candidate model で fast mode を強制的に有効にしたい場合にのみ `--fast` を渡します。benchmark analysis のために candidate と judge の duration は report に記録されますが、judge prompt では speed で順位付けしないよう明示されています。
candidate と judge model の run はどちらも既定で concurrency 16 です。provider の制限やローカル Gateway の負荷で run のノイズが大きすぎる場合は、
`--concurrency` または `--judge-concurrency` を下げます。
candidate `--model` が渡されない場合、character eval は既定で
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` になります（`--model` が渡されない場合）。
`--judge-model` が渡されない場合、judge は既定で
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` になります。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [QA Channel](/ja-JP/channels/qa-channel)
- [Testing](/ja-JP/help/testing)
- [Dashboard](/ja-JP/web/dashboard)
