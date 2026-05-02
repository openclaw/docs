---
read_when:
    - QAスタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリを基盤とした QA シナリオの追加
    - Gateway ダッシュボードを中心に、より現実に近い QA 自動化を構築する
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリベースのシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-02T20:46:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストよりも現実的で、
チャネルに近い形で OpenClaw を検証するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除の各サーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、インバウンドメッセージの注入、Markdown レポートのエクスポートを行うためのデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来のランナー plugins: 子 QA gateway 内で実際のチャネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用の、リポジトリ管理のシードアセット。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                   |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA セルフチェック。Markdown レポートを書き込みます。                                                                                                    |
| `qa suite`                                          | QA gateway レーンに対して、リポジトリ管理のシナリオを実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                       |
| `qa coverage`                                       | Markdown シナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                         |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント型パリティレポートを書き込みます。                                                                         |
| `qa character-eval`                                 | 複数のライブモデルにまたがってキャラクター QA シナリオを実行し、判定付きレポートを作成します。[レポート](#reporting)を参照してください。                              |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して、単発のプロンプトを実行します。                                                                                              |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを開始します（エイリアス: `pnpm qa:lab:ui`）。                                                                                       |
| `qa docker-build-image`                             | 事前作成済み QA Docker イメージをビルドします。                                                                                                                        |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                  |
| `qa up`                                             | QA サイトをビルドし、Docker バックのスタックを開始して URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。 |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを開始します。                                                                                                                          |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを開始します。                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                               |
| `qa matrix`                                         | 使い捨て Tuwunel homeserver に対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                   |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャネルに対するライブトランスポートレーン。                                                                                          |

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker バックの gateway レーンが開始され、
オペレーターまたは自動化ループがエージェントに QA ミッションを与え、実際のチャネル動作を観察し、
成功したこと、失敗したこと、またはブロックされたままだったことを記録できる QA Lab ページが公開されます。

毎回 Docker イメージをリビルドせずに QA Lab UI をより速く反復するには、
バインドマウントされた QA Lab バンドルでスタックを開始します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージのままにし、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルをリビルドし、QA Lab アセットハッシュが変わるとブラウザーが自動リロードします。

ローカル OpenTelemetry トレーススモークの場合は、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを開始し、
`diagnostics-otel` plugin を有効にして `otel-trace-smoke` QA シナリオを実行し、その後
エクスポートされた protobuf スパンをデコードして、リリース上重要な形状をアサートします。
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
成功したターンではモデル呼び出しが `StreamAbandoned` をエクスポートしてはなりません。生の診断 ID と
`openclaw.content.*` 属性はトレースに含まれていてはなりません。QA スイートアーティファクトの隣に
`otel-smoke-summary.json` を書き込みます。

Observability QA はソースチェックアウト専用のままです。npm tarball には意図的に
QA Lab が含まれていないため、パッケージ Docker リリースレーンでは `qa` コマンドは実行されません。
診断インストルメンテーションを変更する場合は、ビルド済みソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

トランスポート実体の Matrix スモークレーンの場合は、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel homeserver をプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix plugin を実行し（`qa-channel` は使いません）、その後 Markdown レポート、JSON サマリー、観測イベントアーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` に書き込みます。

トランスポート実体の Telegram と Discord のスモークレーンの場合:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

どちらも 2 つの bot（driver + SUT）を備えた既存の実チャネルを対象にします。必要な環境変数、シナリオ一覧、出力アーティファクト、Convex 認証情報プールは、下の [Telegram と Discord の QA リファレンス](#telegram-and-discord-qa-reference) に記載されています。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker 環境をチェックし、エンドポイント設定を検証し、maintainer secret が存在する場合は admin/list 到達性を検証します。secret については set/missing 状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を作るのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、ライブトランスポートカバレッジマトリクスの一部ではありません。

| レーン   | カナリア | メンションゲート | Bot 間 | Allowlist ブロック | トップレベル返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

これにより、`qa-channel` を広範なプロダクト動作スイートとして保ちつつ、Matrix、
Telegram、および将来のライブトランスポートが、1 つの明示的なトランスポート契約
チェックリストを共有します。

Docker を QA パスに持ち込まずに使い捨て Linux VM レーンを使うには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、
`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストと Multipass のスイート実行は、デフォルトで分離された gateway worker を使って
選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト同時実行数は
4 で、選択されたシナリオ数で上限がかかります。worker 数を調整するには `--concurrency <count>` を使い、
逐次実行には `--concurrency 1` を使います。
いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが欲しい場合は
`--allow-failures` を使います。
ライブ実行では、ゲストにとって実用的なサポート済み QA 認証入力が転送されます。
環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は
`CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、
`--output-dir` はリポジトリルート配下に維持してください。

## Telegram と Discord の QA リファレンス

Matrix はシナリオ数が多く、Docker バックの homeserver プロビジョニングがあるため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram と Discord はより小規模で、各数個のシナリオ、プロファイルシステムなし、既存の実チャネルに対して実行されるため、リファレンスはここに置かれています。

### 共有 CLI フラグ

どちらのレーンも `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                                   | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | このシナリオのみを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | レポート/サマリー/観測メッセージと出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                           | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | QA Gateway 設定内の一時アカウント id です。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` または `live-frontier`（従来の `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                          | プライマリ/代替モデルの refs です。                                                                                         |
| `--fast`                              | オフ                                                       | サポートされている場合のプロバイダー高速モードです。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                        | `--credential-source convex` のときに使われるロールです。                                                                          |

どちらも、失敗したシナリオがある場合はゼロ以外で終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（ドライバー + SUT）を持つ、実際のプライベート Telegram グループ 1 つを対象にします。SUT ボットには Telegram ユーザー名が必要です。ボット間の観測は、両方のボットで `@BotFather` の **Bot-to-Bot Communication Mode** が有効になっている場合に最もよく動作します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — 数値のチャット id（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します（デフォルトでは編集済み）。

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
- `telegram-qa-observed-messages.json` — `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り、本文は編集済みです。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットを持つ、実際のプライベート Discord guild channel 1 つを対象にします。1 つはハーネスが制御するドライバーボットで、もう 1 つは子 OpenClaw Gateway がバンドルされた Discord plugin を通じて起動する SUT ボットです。チャンネルメンションの処理と、SUT ボットが Discord にネイティブの `/help` コマンドを登録していることを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — Discord から返される SUT ボットユーザー id と一致している必要があります（一致しない場合、このレーンは早期に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

出力アーティファクト:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は編集済みです。

### Convex 認証情報プール

Telegram と Discord の両方のレーンは、上記の env vars を読む代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。プール kind は `"telegram"` と `"discord"` です。

`admin/add` でブローカーが検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` は数値の chat-id 文字列である必要があります。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。

運用 env vars と Convex ブローカーエンドポイントの契約は、[Testing → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります（このセクション名は Discord サポートより前のものです。ブローカーのセマンティクスは両方の kind で同一です）。

## リポジトリに基づくシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に含められているため、QA プランは人間とエージェントの両方に見えます。

`qa-lab` は汎用 Markdown ランナーのままにする必要があります。各シナリオ Markdown ファイルは 1 回のテスト実行に対する信頼できる情報源であり、次を定義する必要があります。

- シナリオメタデータ
- 任意の category、capability、lane、risk メタデータ
- docs と code refs
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用かつ横断的なままで構いません。たとえば、Markdown シナリオは、特別扱いのランナーを追加せずに、Gateway `browser.request` シームを通じて埋め込み Control UI を操作するブラウザー側ヘルパーと、トランスポート側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーのフォルダーではなく、プロダクト能力ごとにグループ化する必要があります。ファイルを移動してもシナリオ ID は安定させてください。実装の追跡可能性には `docsRefs` と `codeRefs` を使います。

ベースラインリストは、次をカバーできる程度に広くしておく必要があります。

- DM とチャンネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリ想起
- モデル切り替え
- サブエージェントのハンドオフ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders などの小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります。

- `mock-openai` は、シナリオ対応の OpenClaw モックです。リポジトリに基づく QA とパリティゲートのデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、auth-profile ステージング要件、live/mock capability フラグを所有します。共有 suite と Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリ経由でルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は Markdown QA シナリオ用の汎用トランスポートシームを所有します。`qa-channel` はそのシーム上の最初のアダプターですが、設計目標はより広く、将来の実在または合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じ suite runner に接続する必要があります。

アーキテクチャレベルでの分割は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、ワーカー並行実行、アーティファクト書き込み、レポート作成を所有します。
- トランスポートアダプターは、Gateway 設定、readiness、受信と送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルはテスト実行を定義します。`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

Markdown QA システムにチャンネルを追加するには、ちょうど 2 つのものが必要です。

1. チャンネル用のトランスポートアダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- suite の起動と終了処理
- ワーカー並行実行
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ用の互換エイリアス

ランナー Plugin はトランスポート契約を所有します。

- `openclaw qa <runner>` が共有 `qa` ルート配下にどうマウントされるか
- Gateway がそのトランスポート用にどう設定されるか
- readiness がどう確認されるか
- 受信イベントがどう注入されるか
- 送信メッセージがどう観測されるか
- transcripts と正規化されたトランスポート状態がどう公開されるか
- トランスポートに支えられたアクションがどう実行されるか
- トランスポート固有のリセットまたはクリーンアップがどう処理されるか

新しいチャンネルの最小採用基準:

1. 共有 `qa` ルートの所有者を `qa-lab` のままにします。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは、ランナー Plugin またはチャンネルハーネス内に保ちます。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントします。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽く保ちます。遅延 CLI とランナー実行は、別々のエントリーポイントの背後に置く必要があります。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応します。
6. 新しいシナリオには汎用シナリオヘルパーを使います。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続けます。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 振る舞いが 1 つのチャンネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネス内に保ちます。
- シナリオが複数のチャンネルで使える新しい capability を必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- 振る舞いが 1 つのトランスポートに対してのみ意味を持つ場合は、そのシナリオをトランスポート固有に保ち、シナリオ契約内でそれを明示します。

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

既存シナリオ向けには互換エイリアス（`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus`）が引き続き利用できますが、新しいシナリオ作成では汎用名を使う必要があります。これらのエイリアスは一斉移行を避けるために存在しているのであり、今後のモデルとして存在しているわけではありません。

## レポート

`qa-lab` は、観測された bus タイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次に答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のあるフォローアップシナリオは何か

利用可能なシナリオの一覧は、フォローアップ作業の規模見積もりや新しいトランスポートの接続に役立ちます。`pnpm openclaw qa coverage` を実行してください（機械可読の出力には `--json` を追加します）。

キャラクターとスタイルのチェックでは、同じシナリオを複数のライブモデル
参照で実行し、判定付きの Markdown レポートを書き出します。

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

このコマンドは Docker ではなく、ローカル QA Gateway の子プロセスを実行します。キャラクター評価
シナリオでは `SOUL.md` を通じてペルソナを設定し、その後でチャット、ワークスペースの手伝い、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには
評価中であることを伝えるべきではありません。このコマンドは各完全な
トランスクリプトを保持し、基本的な実行統計を記録したうえで、対応している場合は `xhigh` 推論付きの高速モードで
判定モデルに、自然さ、雰囲気、ユーモアで実行結果をランク付けするよう依頼します。
プロバイダーを比較するときは `--blind-judge-models` を使用してください。判定プロンプトには引き続き
すべてのトランスクリプトと実行ステータスが渡されますが、候補参照は
`candidate-01` などの中立的なラベルに置き換えられます。レポートは
解析後にランキングを実際の参照へ対応付けます。
候補実行の既定は `high` の思考で、GPT-5.5 は `medium`、対応している古い OpenAI 評価参照は `xhigh`
です。特定の候補は `--model provider/model,thinking=<level>` でインライン上書きします。`--thinking <level>` は引き続き
グローバルなフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式も
互換性のために保持されています。
OpenAI 候補参照は、プロバイダーが対応している場合に優先処理が使われるよう、高速モードが既定です。
単一の候補または判定で上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加します。すべての候補モデルで高速モードを
強制的に有効化したい場合にのみ `--fast` を渡してください。候補と判定の所要時間は
ベンチマーク分析のためにレポートへ記録されますが、判定プロンプトでは
速度でランク付けしないよう明示しています。
候補モデル実行と判定モデル実行はいずれも、既定の並行数が 16 です。プロバイダーの制限やローカル Gateway の
負荷によって実行結果のノイズが大きすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補の `--model` が渡されない場合、キャラクター評価の既定は
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` です。
`--judge-model` が渡されない場合、判定モデルの既定は
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` です。

## 関連ドキュメント

- [マトリックス QA](/ja-JP/concepts/qa-matrix)
- [QA チャンネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
