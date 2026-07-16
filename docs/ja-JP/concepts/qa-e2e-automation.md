---
doc-schema-version: 1
read_when:
    - QAスタックの全体的な構成を理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリベースの QA シナリオの追加
    - Gateway ダッシュボードを対象とした、よりリアリティの高い QA 自動化の構築
summary: 'QAスタックの概要: qa-lab、qa-channel、リポジトリに基づくシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA概要
x-i18n:
    generated_at: "2026-07-16T11:41:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単体テストでは実現できない、現実的でチャネルに即した方法で OpenClaw を検証します。

構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除の各サーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、受信メッセージの注入、Markdown レポートのエクスポートを行うためのデバッガー UI、QA バス、シナリオプロファイル、ライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用のリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実際のトランスポート、ブラウザーのスクリーンショット、VM の状態、PR の証拠を必要とするバグ向けの修正前後のライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` 配下で実行されます。多くのフローには `pnpm qa:*` スクリプトエイリアスがあり、どちらの形式でも動作します。

| コマンド                                             | 目的                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` を使用しないバンドル済み QA セルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を使用する、タクソノミーに基づく成熟度プロファイルランナー。                                                                                                  |
| `qa suite`                                          | QA Gateway レーンに対してリポジトリ管理シナリオを実行します。`--runner multipass` はホストの代わりに使い捨て Linux VM を使用します。                                                                                                                                         |
| `qa coverage`                                       | YAML シナリオカバレッジ一覧を出力します（マシン出力には `--json`、変更対象の動作に対応するシナリオの検索には `--match <query>`、ランタイムツールのフィクスチャカバレッジには `--tools`）。                                                                                  |
| `qa parity-report`                                  | モデル軸のパリティゲート用に 2 つの `qa-suite-summary.json` ファイルを比較します。または `--runtime-axis --token-efficiency` を使用して、Codex と OpenClaw のランタイムパリティおよびトークン効率レポートを書き出します。                                                                          |
| `qa confidence-report`                              | マニフェストに照らして QA 証拠アーティファクトを分類し、不明項目ゼロの信頼度レポートを作成します。                                                                                                                                                                               |
| `qa confidence-self-test`                           | 信頼度ゲートがドリフトを検出することを証明する、シード済みネガティブコントロールカナリアを書き出します。                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | 厳選された JSONL トランスクリプトをランタイムパリティ再生ハーネスで再生します。                                                                                                                                                                                         |
| `qa character-eval`                                 | 複数のライブモデルに対してキャラクター QA シナリオを実行し、評価済みレポートを作成します。[レポート](#reporting)を参照してください。                                                                                                                                                        |
| `qa manual`                                         | 選択したプロバイダー／モデルレーンに対して単発のプロンプトを実行します。                                                                                                                                                                                                      |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                |
| `qa docker-build-image`                             | 事前構築済み QA Docker イメージをビルドします。                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | QA ダッシュボードと Gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                                                                                                                                |
| `qa up`                                             | QA サイトをビルドし、Docker ベースのスタックを起動して URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                                              |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                           |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャネルに対するライブトランスポートレーン。                                                                                                                                                                                                   |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対する QA Lab Matrix プロファイル。[Matrix スモークレーン](#matrix-smoke-lanes)を参照してください。                                                                                                                                                      |
| `qa slack`                                          | 実際のプライベート Slack チャネルに対するライブトランスポートレーン。                                                                                                                                                                                                           |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                                          |
| `qa whatsapp`                                       | 実際の WhatsApp Web アカウントに対するライブトランスポートレーン。                                                                                                                                                                                                             |
| `qa mantis`                                         | ライブトランスポートのバグ向けの修正前後検証ランナー。Discord のステータスリアクション証拠、Crabbox のデスクトップ／ブラウザースモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis) および [Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook)を参照してください。 |

### プロファイルベースの `qa run`

プロファイルベースの `qa run` は `taxonomy.yaml` からメンバー構成を読み取り、解決されたシナリオを `qa suite` 経由でディスパッチします。`--surface` と `--category` は、個別のレーンを定義するのではなく、選択したプロファイルをフィルタリングします。生成される `qa-evidence.json` には、選択されたカテゴリの件数と不足しているカバレッジ ID を含むプロファイルスコアカードの概要が含まれます。個々の証拠エントリは引き続き、テスト、カバレッジロール、結果に関する信頼できる唯一の情報源です。タクソノミー機能のカバレッジ ID は別名ではなく、厳密な証明対象です。プライマリシナリオのカバレッジは一致する ID を満たしますが、セカンダリカバレッジは参考情報にとどまります。カバレッジ ID は、小文字の英数字／ダッシュ区切りセグメントによるドット区切りの `namespace.behavior` 形式を使用します。プロファイル、サーフェス、カテゴリの ID には、既存のダッシュ区切りまたはドット区切りのタクソノミー ID を引き続き使用できます。

簡略化された証拠では、エントリごとの `execution` が省略され、`evidenceMode: "slim"` が設定されます。`smoke-ci` はデフォルトで簡略形式を使用し、`--evidence-mode full` で完全なエントリに戻せます。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデルプロバイダーと Crabline ローカルプロバイダーサーバーを使用した決定論的なプロファイル証明には `smoke-ci` を使用します。ライブチャネルに対する Stable/LTS 証明には `release` を使用します。明示的な完全タクソノミー証拠の実行にのみ `all` を使用してください。これはすべてのアクティブな成熟度カテゴリを選択し、`QA
Profile Evidence` GitHub Actions ワークフローから `qa_profile=all` を指定してディスパッチできます。コマンドで OpenClaw のルートプロファイルも必要な場合は、ルートプロファイルを QA コマンドの前に置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在の QA オペレーターフローは、2 ペイン構成の QA サイトです。

- 左: エージェントを備えた Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

このコマンドは QA サイトをビルドし、Docker ベースの Gateway レーンを起動して、QA Lab ページを公開します。このページでは、オペレーターまたは自動化ループがエージェントに QA ミッションを与え、実際のチャネル動作を観察し、成功したこと、失敗したこと、またはブロックされたままのことを記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をすばやく反復開発するには、QA Lab バンドルをバインドマウントしてスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスで事前構築済みイメージを使い続け、`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Lab アセットのハッシュが変わるとブラウザーが自動的に再読み込みされます。

### オブザーバビリティスモーク

<Note>
オブザーバビリティ QA はソースチェックアウト専用のままです。npm tarball では意図的に QA Lab（および `qa-channel`）を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断計測を変更する場合は、ビルド済みのソースチェックアウトからこれらを実行してください。
</Note>

| エイリアス                                   | 実行内容                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | ローカルの OpenTelemetry レシーバーに加え、`diagnostics-otel` を有効にした `otel-trace-smoke` シナリオ。                                      |
| `pnpm qa:otel:collector-smoke`          | 実際の OpenTelemetry Collector Docker コンテナを介した同じレーン。エンドポイントの配線または Collector/OTLP の互換性を変更する場合に使用します。 |
| `pnpm qa:prometheus:smoke`              | `diagnostics-prometheus` を有効にした `docker-prometheus-smoke` シナリオ。                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` に続いて `qa:prometheus:smoke` を実行。                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` に続いて `qa:prometheus:smoke` を実行。                                                                            |

`qa:otel:smoke` はローカルの OTLP/HTTP レシーバーを起動し、最小限の QA チャネルの
エージェントターンを実行してから、トレース、メトリクス、ログがエクスポートされることを検証します。
エクスポートされた protobuf トレーススパンをデコードし、リリースに不可欠な構造を確認します。
`openclaw.run`、`openclaw.harness.run`、最新の GenAI セマンティック規約に準拠した
モデル呼び出しスパン、`openclaw.context.assembled`、および `openclaw.message.delivery`
がすべて存在する必要があります。このスモークは
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、モデル呼び出し
スパンは `{gen_ai.operation.name} {gen_ai.request.model}` という名前を使用する必要があります。正常なターンでは、モデル
呼び出しが `StreamAbandoned` をエクスポートしてはなりません。また、生の診断
ID と `openclaw.content.*` 属性をトレースに含めてはなりません。このシナリオの
プロンプトは、固定マーカーを返し、固定された秘密文字列を出力しないようモデルに要求します。
生の OTLP ペイロードには、そのどちらも、シナリオ ID から派生した QA
セッションキーも含まれていてはなりません。QA スイートの成果物の隣に
`otel-smoke-summary.json` を書き込みます。

`qa:prometheus:smoke` は、未認証のスクレイプが拒否されることを検証してから、
認証済みのスクレイプに、プロンプト内容、応答内容、生の診断識別子、認証
トークン、ローカルパスを含まずに、リリースに不可欠なメトリクスファミリーが含まれることを
確認します。

### Matrix スモークレーン

モデルプロバイダーの認証情報を必要としない、実際のトランスポートを使用する Matrix スモークレーンでは、
決定論的なモック OpenAI プロバイダーを使用してリリースプロファイルを実行します。

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

ライブのフロンティアプロバイダーレーンでは、OpenAI 互換の認証情報を
明示的に指定します。

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

単純な `pnpm openclaw qa matrix` は完全な `all` プロファイルを実行し、
シナリオが失敗しても続行します。より短いフィードバックループには `--fail-fast` を使用するか、
`--scenario <id>` を繰り返して個別のシナリオを選択します。明示的なシナリオ ID は
`--profile` より優先されます。

| プロファイル      | シナリオ | 目的                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | 完全なカタログ（デフォルト）。                                                                                                              |
| `release`    | 2         | リリースに不可欠なチャネルのベースラインとライブ許可リストの再読み込み。                                                                             |
| `fast`       | 12        | スレッド、リアクション、承認、ポリシー、ボットゲーティング、暗号化された返信を重点的に網羅。                                               |
| `transport`  | 50        | スレッド、DM/ルームのルーティング、自動参加、承認、リアクション、再起動、メンション/許可リストのポリシー、編集、複数アクターの順序付け。         |
| `media`      | 7         | 画像、生成画像、音声、添付ファイル、未対応メディア、暗号化メディアを網羅。                                              |
| `e2ee-smoke` | 8         | 暗号化された返信、スレッド、ブートストラップ、復旧、再起動、秘匿化、障害を最小限に網羅。                                       |
| `e2ee-deep`  | 18        | 状態喪失、バックアップ、キー復旧、デバイス衛生、SAS/QR/DM 検証。                                                            |
| `e2ee-cli`   | 9         | ハーネスを介した `openclaw matrix encryption setup`、復旧キー、複数アカウント、Gateway のラウンドトリップ、自己検証コマンド。 |

プロファイルの所属とチャネル要件は、`qa/scenarios/channels/` 以下の宣言的な Matrix
シナリオに定義されています。実行時にチャネルドライバーが選択されます。
それらのライブ実装は
`extensions/qa-lab/src/live-transports/matrix/scenarios/` 以下にあります。

アダプターは Docker 内に使い捨ての Tuwunel ホームサーバー（デフォルト
イメージ `ghcr.io/matrix-construct/tuwunel:v1.5.1`、サーバー名 `matrix-qa.test`、
ポート `28008`）をプロビジョニングし、一時的なドライバー、SUT、オブザーバーユーザーを登録し、必要な
ルームを準備して、秘匿化したリクエスト/レスポンス境界を記録します。その後、
そのトランスポートに限定された子 QA Gateway 内で実際の Matrix Plugin を
実行し（`qa-channel` は使用しません）、環境を破棄します。

一般的なオプション:

| フラグ                     | デフォルト           | 目的                                                                              |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | 上記のプロファイルから 1 つを選択します。                                                    |
| `--scenario <id>`        | -                 | シナリオを 1 つ選択します。繰り返し指定できます。                                                     |
| `--fail-fast`            | オフ               | 最初にチェックまたはシナリオが失敗した時点で停止します。                                       |
| `--allow-failures`       | オフ               | シナリオが失敗しても失敗終了コードを返さずに成果物を書き込みます。         |
| `--provider-mode <mode>` | `live-frontier`   | 決定論的なディスパッチには `mock-openai`、ライブプロバイダーには `live-frontier` を使用します。 |
| `--model <ref>`          | プロバイダーのデフォルト  | プライマリ `provider/model` 参照を設定します。                                          |
| `--alt-model <ref>`      | プロバイダーのデフォルト  | モデルを切り替えるシナリオで使用する代替モデルを設定します。                        |
| `--fast`                 | オフ               | サポートされている場合にプロバイダーの高速モードを有効にします。                                           |
| `--output-dir <path>`    | 自動生成         | レポートディレクトリを選択します。相対パスは `--repo-root` を基準に解決されます。           |
| `--repo-root <path>`     | 現在のディレクトリ | 中立的な作業ディレクトリから実行します。                                                |
| `--sut-account <id>`     | `sut`             | 子 Gateway の設定で Matrix アカウント ID を選択します。                            |

Matrix QA は共有 Matrix 認証情報をリースしません。アダプターがローカルで
使い捨てユーザーを作成するため、`--credential-source` または
`--credential-role` は受け付けません。ホームサーバーのイメージは
`OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` で上書きできます。応答なしの否定検証は
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS`（デフォルト `8000`、アクティブな
シナリオのタイムアウト以下に制限）で調整します。Matrix の暗号化ネイティブハンドルはクリーンアップ後も
存続する可能性があるため、単発コマンドは通常、成果物をフラッシュした後にクリーン終了を強制します。
代わりにコマンドが戻る必要のある直接テストハーネスの場合に限り、
`OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` を設定します。

各実行では、選択した出力ディレクトリ以下に通常の QA Lab 成果物である
`qa-suite-report.md`、`qa-suite-summary.json`、`qa-evidence.json`、
および秘匿化された `matrix-harness-*/matrix-qa-harness.json` マニフェストを書き込みます。クリーンアップに
失敗した場合は、表示された `docker compose ... down --remove-orphans` 復旧
コマンドを実行します。低速なランナーでは応答なしの待機時間を延長します。高速な CI では、短い
待機時間により否定検証を短縮できます。

これらのシナリオは、ユニットテストではエンドツーエンドに証明できないトランスポート動作を
網羅します。メンションゲーティング、ボット許可ポリシー、許可リスト、トップレベルおよびスレッド内の
返信、DM ルーティング、リアクション処理、受信編集の抑制、再起動時のリプレイ重複排除、
ホームサーバー中断からの復旧、承認メタデータの配信、メディア処理、Matrix E2EE の
ブートストラップ/復旧/検証フローが対象です。E2EE CLI プロファイルは、
Gateway の返信を確認する前に、同じ使い捨てホームサーバーを介して `openclaw matrix encryption setup`
および検証コマンドも実行します。

`matrix-room-block-streaming` と `subagent-thread-spawn` は、
明示的な `--scenario` の選択によって引き続き利用できますが、デフォルトの `all` プロファイルには
含まれません。

CI は
`.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とリリース実行では、
リリースシナリオを実行します。手動の `matrix_profile=all` ディスパッチでは、
`transport`、`media`、`e2ee-smoke`、`e2ee-deep`、`e2ee-cli` の各プロファイルを
並列展開します。絞り込みディスパッチでは、1 つのジョブで `fast`、`release`、または `transport` を選択します。

### Discord Mantis シナリオ

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータス
リアクションのタイムラインには `--scenario discord-status-reactions-tool-only` を使用し、
実際の Discord スレッドを作成して `message.thread-reply` が
`filePath` 添付ファイルを保持することを検証するには `--scenario discord-thread-reply-filepath-attachment`
を使用します。これらのシナリオは、広範なスモーク網羅ではなく修正前後の再現プローブであるため、
デフォルトのライブ Discord レーンには含まれません。スレッド添付ファイル用の Mantis ワークフローでは、
QA 環境に `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、ログイン済みの
Discord Web による証跡動画を追加することもできます。このビューワープロファイルは視覚的な記録専用です。
合否判定は引き続き Discord REST オラクルによって行われます。

実際のトランスポートを使用するその他のスモークレーン:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

これらは、2 つのボットまたはアカウント（ドライバー +
SUT）を持つ既存の実チャネルを対象とします。これら 4 つのトランスポートに必要な環境変数、
シナリオ一覧、出力成果物、Convex 認証情報プールについては、
以下の [Discord、Slack、Telegram、WhatsApp の QA リファレンス](#discord-slack-telegram-and-whatsapp-qa-reference)
で説明しています。

### Mantis Slack デスクトップおよび視覚タスクランナー

VNC レスキューを備えた完全な Slack デスクトップ VM 実行では、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox のデスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブ
レーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャして、
`slack-qa/`、`slack-desktop-smoke.png`、および
`slack-desktop-smoke.mp4`（動画キャプチャが利用可能な場合）を
Mantis アーティファクトディレクトリへコピーします。Crabbox のデスクトップ/ブラウザリースでは、
キャプチャツールとブラウザ/ネイティブビルドのヘルパーパッケージがあらかじめ提供されるため、このシナリオで
フォールバックをインストールする必要があるのは古いリースの場合だけです。Mantis は合計および
フェーズごとの所要時間を `mantis-slack-desktop-smoke-report.md` に記録するため、実行が遅い場合に
リースのウォームアップ、認証情報の取得、リモートセットアップ、アーティファクトのコピーの
どこに時間がかかったかを確認できます。VNC 経由で Slack Web に手動ログインした後は
`--lease-id <cbx_...>` を再利用してください。再利用したリースでは Crabbox の pnpm ストアキャッシュも
ウォーム状態に保たれます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、
VM 内でインストール/ビルドを実行します。再利用するリモートワークスペースに
`node_modules` とビルド済みの `dist/` がすでにある場合に限り、
`--hydrate-mode prehydrated` を使用してください。このモードではコストの高いインストール/ビルド手順を省略し、
ワークスペースの準備が整っていない場合は安全側に失敗します。`--gateway-setup` を指定すると、Mantis は
永続的な OpenClaw Slack Gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、
コマンドは通常の bot 間 Slack QA レーンを実行し、アーティファクトの
キャプチャ後に終了します。

デスクトップ証拠を伴うネイティブ Slack 承認 UI を実証するには、Mantis の
承認チェックポイントモードを実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と同時には使用できません。Slack の
承認シナリオを実行し、承認以外のシナリオ ID を拒否し、保留中および
解決済みの各承認状態で待機し、観測された Slack API メッセージを
`approval-checkpoints/<scenario>-pending.png` と
`approval-checkpoints/<scenario>-resolved.png` にレンダリングした後、チェックポイント、
メッセージ証拠、確認応答、またはレンダリングされたスクリーンショットのいずれかが欠落しているか
空の場合は失敗します。コールド状態の CI リースでは
`slack-desktop-smoke.png` に Slack のサインイン画面が表示されることがありますが、承認チェックポイント画像がこのレーンの視覚的な
証拠になります。

デフォルトのチェックポイント実行では、2 つの標準 Slack 承認シナリオが維持されます。
オプトインの Codex 承認ルートのいずれかをキャプチャするには、
`--scenario slack-codex-approval-exec-native` または
`--scenario slack-codex-approval-plugin-native` で明示的に選択します。Mantis は両方を受け付け、
同じ保留中/解決済みのスクリーンショットペアを出力します。ランナーは、選択された各 Codex ルートについてチェックポイントと
リモートコマンドの期限を延長し、承認全体、エージェントの完了、および解決済みへの更新シーケンスを
完了できるようにします。

オペレーター用チェックリスト、GitHub ワークフローのディスパッチコマンド、証拠コメントの
契約、ハイドレートモードの判断表、所要時間の解釈、および障害
処理手順については、
[Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook)を参照してください。

エージェント/CV 形式のデスクトップタスクを実行するには、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` は Crabbox のデスクトップ/ブラウザマシンをリースまたは再利用し、
`crabbox record --while` を起動し、入れ子になった
`visual-driver` を介して表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が
選択されている場合はスクリーンショットに対して `openclaw infer image
describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、
`mantis-visual-task-driver-result.json`、および
`mantis-visual-task-report.md` を書き込みます。`--expect-text` が設定されている場合、ビジョン
プロンプトは構造化 JSON の判定（`visible`、`evidence`、`reason`）を要求し、
モデルが、期待されるテキストを引用する証拠とともに `visible: true` を報告した場合にのみ
成功します。対象テキストを単に引用しただけの `visible: false` 応答では、
引き続きアサーションに失敗します。画像理解プロバイダーを呼び出さずに
デスクトップ、ブラウザ、スクリーンショット、および動画の配管を実証するモデルなしのスモークには、
`--vision-mode metadata` を使用します。録画は
`visual-task` の必須アーティファクトです。Crabbox が空でない
`visual-task.mp4` を録画しなかった場合、視覚ドライバーが成功していてもタスクは失敗します。
失敗時、タスクがすでに成功しており `--keep-lease` が設定されていなかった場合を除き、Mantis は VNC 用にリースを維持します。

### 認証情報プールのヘルスチェック

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカーの環境変数（`OPENCLAW_QA_CONVEX_SITE_URL`、
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`）を確認し、エンドポイント設定を検証し、
`OPENCLAW_QA_CONVEX_SECRET_CI` と
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` については設定済み/未設定の状態のみを報告し、
メンテナーシークレットが存在する場合は admin/list への到達可能性を検証します。

## 正規シナリオカバレッジ

ルートの `taxonomy.yaml` はセマンティックカバレッジ ID を定義します。`qa/scenarios/` 配下のシナリオ YAML ファイルは
各シナリオをそれらの ID にマッピングし、実行
メタデータを所有します。`channel` が唯一のチャンネル要件であり、`profiles` は
名前付き実行への所属を宣言します。チャンネルドライバーは、実行レベルで交換可能な
実装上の選択肢です。TypeScript
ランナーはそのカタログを照会し、並行するシナリオまたはカバレッジの
インベントリを維持しません。

静的な `qa coverage` の出力は、タクソノミーからシナリオへのマッピングを報告します。実際の
証明は `qa-evidence.json` から得られます。ここには、実行されたシナリオ、
カバレッジ ID、チャンネル、実際に使用されたドライバー、および結果が記録されます。チャンネルとドライバーは
レポートのディメンションであり、追加のカバレッジ ID 語彙やシナリオ
適格性の軸ではありません。

QA パスに Docker を持ち込まず、使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これにより新しい Multipass ゲストが起動し、依存関係がインストールされ、ゲスト内で OpenClaw が
ビルドされ、`qa suite` が実行された後、通常の QA レポートと
サマリーがホスト上の `.artifacts/qa-e2e/...` にコピーされます。ホスト上の
`qa suite` と同じシナリオ選択動作を再利用します。

ホストおよび Multipass のスイート実行では、デフォルトで分離された Gateway ワーカーを使用して、
選択された複数のシナリオを並列実行します。`qa-channel` のデフォルトは
同時実行数 4 で、選択されたシナリオ数が上限です。ワーカー数を調整するには `--concurrency
<count>` を、
逐次実行するには `--concurrency 1` を使用します。
パーソナルアシスタントのベンチマークパック（10
シナリオ）を実行するには、`--pack personal-agent` を使用します。パックセレクターは、繰り返し指定する `--scenario` フラグに対して加算的に動作します。
明示的なシナリオが先に実行され、その後、重複を除去したうえでパックの順序に従って
パックのシナリオが実行されます。カスタム QA ランナーが OpenTelemetry コレクターのセットアップをすでに提供している場合に、
`otel-trace-smoke` と `docker-prometheus-smoke` のシナリオをまとめて選択するには
`--pack observability` を使用します。

いずれかのシナリオが失敗すると、コマンドはゼロ以外で終了します。終了コードを失敗にせずに
アーティファクトを取得する場合は、`--allow-failures` を使用します。

ライブ実行では、ゲストで実用可能なサポート対象の QA 認証入力が転送されます。
環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および
存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、
`--output-dir` はリポジトリルート配下に置いてください。

## Discord、Slack、Telegram、WhatsApp の QA リファレンス

Matrix アダプターは、前述の使い捨て Docker ベースレーンを使用します。
Discord、Slack、Telegram、WhatsApp は既存の実際の
トランスポートに対して実行されるため、それらのリファレンスをここに記載します。

### 共通 CLI フラグ

これらのレーンは
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、
同じフラグを受け付けます。

| フラグ                                  | デフォルト                                            | 説明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオのみを実行します。繰り返し指定できます。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、証拠、トランスポート固有のアーティファクト、および出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント ID です。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`、`aimock`、または `live-frontier`。                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                   | プライマリ/代替モデル参照です。                                                                                                                   |
| `--fast`                              | オフ                                                | サポートされている場合のプロバイダー高速モードです。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                 | `--credential-source convex` の場合に使用されるロールです。                                                                                                    |
| `--allow-failures`                    | オフ                                                | シナリオが失敗した場合でも失敗終了コードを返さずにアーティファクトを書き込みます。                                                                      |

各レーンは、いずれかのシナリオが失敗するとゼロ以外で終了します。`--allow-failures` は、
失敗終了コードを設定せずにアーティファクトを書き込みます。Telegram は、利用可能なシナリオ ID を表示して終了する
`--list-scenarios` も受け付けますが、他のレーンでは
このフラグを公開していません。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なる bot（ドライバー +
SUT）を持つ 1 つの実際の非公開 Telegram グループを対象にします。SUT bot には Telegram ユーザー名が必要です。bot 間の観測は、
両方の bot で `@BotFather` の **Bot-to-Bot Communication Mode** が有効になっている場合に
最も適切に動作します。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

`release` プロファイルは、メンテナンス対象の Telegram YAML シナリオを選択します。`all` は、
オプトインのセッション、使用量、返信チェーン、およびストリーミングのストレスチェックを追加します。明示的な
`--scenario` の値はプロファイルを上書きします。

- `channel-canary`
- `channel-mention-gating`
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

`release` プロファイルは、canary、メンションゲーティング、ネイティブコマンドの
応答、コマンドの宛先指定、bot 間のグループ応答を常に対象とします。`mock-openai`
には、決定論的な長い最終プレビューチェックも含まれます。
`telegram-current-session-status-tool` と
`telegram-tool-only-usage-footer` は引き続きオプトインです。前者が安定するのは、
canary の直後にスレッド化した場合のみです。後者は、ツールのみの応答に付く
`/usage` フッターを実際の Telegram で検証します。現在の
デフォルト／オプションの区分をリグレッション参照付きで表示するには、`pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` を使用します。すべての
Telegram ライブアダプターシナリオでは `--profile all` を使用します。

出力アーティファクト：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリ。
  プロファイル、カバレッジ、プロバイダー、チャンネル、アーティファクト、結果、RTT
  フィールドが含まれます。

パッケージの Telegram 実行では、同じ Telegram 認証情報コントラクトを使用します。RTT の反復
測定は、通常のパッケージ Telegram ライブレーンの一部です。RTT
分布は、選択された RTT チェックの `result.timing` の下にある `qa-evidence.json` に
組み込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、パッケージライブラッパーは
`kind: "telegram"` 認証情報をリースし、リースされたグループ／ドライバー／SUT
bot の環境変数をインストール済みパッケージの実行へエクスポートし、リースに Heartbeat を送信し、シャットダウン時に
解放します。パッケージラッパーのデフォルトは、`channel-canary` の RTT チェック 20 回、
RTT タイムアウト 30s、Convex が選択されている CI 外では Convex ロール
`maintainer` です。別の RTT コマンドや Telegram 固有の要約形式を
作成せずに RTT 測定を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、
または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つの bot が存在する、実際の非公開 Discord ギルドチャンネル 1 つを対象とします。一方は
ハーネスが制御するドライバー bot、もう一方はバンドル済み Discord Plugin を介して
子 OpenClaw Gateway が起動する SUT bot です。チャンネルでのメンション処理、
SUT bot がネイティブ `/help` コマンドを Discord に登録したこと、および
オプトインの Mantis エビデンスシナリオを検証します。

`--credential-source env` の場合に必要な環境変数：

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT bot のユーザー ID と
  一致する必要があります（一致しない場合、レーンは即座に失敗します）。

オプション：

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は、`discord-voice-autojoin` の音声／ステージチャンネルを
  選択します。指定しない場合、シナリオは SUT bot に表示される最初の
  音声／ステージチャンネルを選択します。

Discord YAML モジュールシナリオ（`qa/scenarios/channels/discord-*.yaml`）：

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオです。単独で実行され、
  `channels.discord.voice.autoJoin` を有効化し、SUT bot の現在の
  Discord 音声状態が対象の音声／ステージチャンネルであることを検証します。Convex の Discord
  認証情報には、オプションの `voiceChannelId` を含められます。含まれない場合、ランナー
  アダプターがギルド内で最初に表示される音声／ステージチャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を
  `messages.statusReactions.enabled=true` により常時有効なツールのみのギルド応答へ
  切り替えるため、単独で実行されます。その後、REST
  リアクションタイムラインと HTML／PNG ビジュアルアーティファクトを取得します。Mantis の実行前／実行後
  レポートでは、シナリオが提供した MP4 アーティファクトも `baseline.mp4`
  および `candidate.mp4` として保持されます。
- `discord-thread-reply-filepath-attachment` - オプトインの Mantis シナリオです。
  [Discord Mantis シナリオ](#discord-mantis-scenarios)を参照してください。

Discord 音声自動参加シナリオを明示的に実行します：

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis ステータスリアクションシナリオを明示的に実行します：

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

出力アーティファクト：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリです。
- `discord-qa-reaction-timelines.json` および
  ステータスリアクションシナリオの実行時の
  `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

2 つの異なる bot が存在する、実際の非公開 Slack チャンネル 1 つを対象とします。一方は
ハーネスが制御するドライバー bot、もう一方はバンドル済み Slack Plugin を介して
子 OpenClaw Gateway が起動する SUT bot です。

`--credential-source env` の場合に必要な環境変数：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

オプション：

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は、Mantis のビジュアル承認
  チェックポイントを有効にします。アダプターは `<scenario>.pending.json` と
  `<scenario>.resolved.json` を書き込み、一致する `.ack.json` ファイルを待機します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` は、チェックポイントの
  確認応答タイムアウトを上書きします。デフォルトは `120000` です。

Slack ライブアダプターを通じて公開される正規 YAML シナリオ：

- `thread-follow-up`
- `thread-isolation`

Slack YAML モジュールシナリオ（`qa/scenarios/channels/slack-*.yaml`）：

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - 設定上無効なチャンネルが、応答せずに
  構造化された警告を発することを確認する、オプトインの実 Slack プローブです。
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`、`slack-progress-commentary-false`、
  `slack-progress-commentary-omitted`、および
  `slack-progress-commentary-verbose-dedupe` - 独立したコメント／ツール進行状況の制御、
  キー省略時のレガシーデフォルト、および永続的な詳細進行状況が有効な場合の単一配信動作を
  検証する、オプトインの実 Slack プローブです。
- `slack-reaction-glyph-native` - オプトインのライブメッセージツールリアクションシナリオです。
  エージェントに正確な `✅` グリフを渡すよう指示し、対象メッセージ上の SUT bot に対して
  Slack が `white_check_mark` を保存したことを確認します。
- `slack-chart-presentation-native` - ネイティブ `data_visualization` ブロックと正確なアクセシブルテキストを
  検証する、オプトインのポータブルチャートシナリオです。
- `slack-table-presentation-native` - ネイティブ `data_table` ブロック、正確な行、およびアクセシブルテキストを
  検証する、オプトインのポータブルテーブルシナリオです。
- `slack-table-invalid-blocks-fallback` - 本番の Slack 送信パスを介して、
  ヘッダーと 101 データ行を持つ、構造的に読み取り可能な上限超過の生テーブルを送信し、
  Slack 自体が `invalid_blocks` を返すことを証明し、保存された書式無効時のフォールバックが完全であり、
  ネイティブデータブロックを持たないことを検証する、オプトインの直接トランスポートシナリオです。
  シナリオの詳細には、安全なエラーコード、件数、ブール値の
  エビデンスのみを保持します。
- `slack-approval-exec-native` - オプトインのネイティブ Slack exec 承認シナリオです。
  Gateway を介して exec 承認を要求し、Slack メッセージに
  ネイティブの承認ボタンがあることを検証し、承認を解決して、解決済みの Slack
  更新を検証します。
- `slack-approval-plugin-native` - オプトインのネイティブ Slack Plugin 承認
  シナリオです。exec と Plugin の承認転送を同時に有効化し、exec 承認のルーティングによって
  Plugin イベントが抑制されないようにしてから、同じ
  保留中／解決済みのネイティブ Slack UI パスを検証します。
- `slack-codex-approval-exec-native` - オプトインの Codex Guardian コマンド承認
  シナリオです。Guardian モードで Codex Plugin を有効化し、
  Slack から開始された Gateway エージェントターンを Codex app-server ハーネス経由でルーティングし、
  `openclaw-codex-app-server` に対するネイティブ Slack Plugin 承認プロンプトを
  待機して解決し、Codex ターンが想定されるコマンド出力と
  アシスタントマーカーを伴って完了することを検証します。
- `slack-codex-approval-plugin-native` - オプトインの Codex Guardian ファイル承認
  シナリオです。ワークスペース外の `apply_patch` 命令を使用して、Codex が
  app-server のファイル変更承認ルートを発行するようにします。その後、同じネイティブ
  Slack の保留中／解決済み承認パス、最終アシスタントマーカー、および正確なファイル
  内容をクリーンアップ前に検証します。

Codex 承認シナリオには、`openai/*` または `codex/*` `--model`、
通常のライブモデル認証情報、および Codex Plugin が受け入れる Codex 認証または API キー認証が必要です。
シナリオの詳細には、秘匿化された Slack 承認メタデータに加えて、
Codex app-server メソッド、選択された Codex モデルキー、最終的な Codex ターンステータス、
および操作マーカーの検証が含まれます。

出力アーティファクト：

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリです。
- `approval-checkpoints/` - Mantis が
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` を設定した場合のみ。チェックポイント JSON、
  確認応答 JSON、および保留中／解決済みのスクリーンショットが含まれます。

#### Slack ワークスペースのセットアップ

このレーンには、1 つのワークスペース内に 2 つの異なる Slack アプリと、両方の
bot が参加しているチャンネルが必要です：

- `channelId` - 両方の bot が招待されているチャンネルの `Cxxxxxxxxxx` ID。
  専用チャンネルを使用してください。このレーンは実行のたびに投稿します。
- `driverBotToken` - **Driver** アプリの bot トークン（`xoxb-...`）。
- `sutBotToken` - **SUT** アプリの bot トークン（`xoxb-...`）。bot ユーザー ID を
  別にするため、ドライバーとは異なる Slack アプリでなければなりません。
- `sutAppToken` - `connections:write` を持つ SUT アプリの
  アプリレベルトークン（`xapp-...`）。SUT アプリがイベントを受信できるよう、Socket Mode で使用されます。

本番ワークスペースを再利用するよりも、QA 専用の Slack ワークスペースを
推奨します。

以下の SUT マニフェストでは、バンドル済み Slack Plugin の
本番インストール（`extensions/slack/src/setup-shared.ts:12`）を、ライブ Slack QA スイートの対象となる
権限とイベントに意図的に限定しています。ユーザーから見た
本番チャンネルのセットアップについては、
[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup)を参照してください。QA の Driver／SUT
ペアは、1 つのワークスペース内で 2 つの異なる bot ユーザー ID がレーンに必要なため、意図的に分離されています。

**1. Driver アプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ に移動し、QA ワークスペースを選択して、次のマニフェストを貼り付け、
_Install to Workspace_ を実行します：

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "OpenClaw QA Slack ライブレーン用テストドライバー bot"
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

_Bot User OAuth Token_（`xoxb-...`）をコピーします。これが
`driverBotToken` になります。ドライバーに必要なのはメッセージの投稿と自身の識別のみです。
イベントも Socket Mode も必要ありません。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリでは、
バンドル済み Slack Plugin の本番マニフェスト（`extensions/slack/src/setup-shared.ts:12`）を
意図的に限定しています。ライブ Slack QA スイートではリアクション処理をまだ対象としていないため、
リアクションのスコープとイベントは省略されています。

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

Slack がアプリを作成したら、その設定ページで次の 2 つを行います。

- _Install to Workspace_ → _Bot User OAuth Token_ をコピー → これが
  `sutBotToken` になります。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ
  `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → これが
  `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットのユーザー ID が異なることを確認します。
ランタイムはユーザー ID によってドライバーと SUT を区別します。同じアプリを
両方に再利用すると、メンションゲート処理が直ちに失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から
両方のボットを招待します。

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` ID をコピーします。これが
`channelId` になります。公開チャンネルを使用できます。非公開チャンネルを使用する場合も、
両方のアプリにはすでに `groups:history` があるため、ハーネスによる履歴の読み取りは
引き続き成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには環境変数を使用し（4 つの
`OPENCLAW_QA_SLACK_*` 変数を設定して `--credential-source env` を渡します）、または
共有 Convex プールに登録して、CI や他のメンテナーがリースできるようにします。

Convex プールの場合は、4 つのフィールドを JSON ファイルに書き込みます。

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` を
エクスポートした状態で、登録して確認します。

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"` があり、`lease` フィールドがないことを確認します。

**5. エンドツーエンドで確認する**

両方のボットがブローカーを介して相互に通信できることを確認するため、ローカルでレーンを
実行します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常な実行は 30 秒を大きく下回る時間で完了し、`qa-suite-report.md` では
`slack-canary` と `slack-mention-gating` の両方がステータス `pass` として表示されます。レーンが
約 90 秒間停止した後に `Convex credential pool exhausted
for kind "slack"` で終了する場合は、プールが空であるか、すべての行がリース中です。どちらなのかは `qa
credentials list --kind slack --status all --json` で確認できます。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

専用の 2 つの WhatsApp Web アカウントを対象とします。1 つはハーネスが制御する
ドライバーアカウント、もう 1 つは子 OpenClaw Gateway がバンドルされた
WhatsApp Plugin を介して起動する SUT アカウントです。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

任意:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は、
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、
  `whatsapp-group-reply-to-bot-triggers`、グループのアクション／メディア／投票シナリオ、
  および `whatsapp-group-allowlist-block` などのグループシナリオを有効にします。

WhatsApp YAML シナリオ（`qa/scenarios/channels/whatsapp-*.yaml`）:

- ベースラインとグループゲート処理: `whatsapp-canary`、`whatsapp-pairing-block`、
  `whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、
  `whatsapp-group-activation-always`、`whatsapp-group-reply-to-bot-triggers`、
  `whatsapp-top-level-reply-shape`、`whatsapp-restart-resume`、
  `whatsapp-group-allowlist-block`。
- ネイティブコマンド: `whatsapp-help-command`、`whatsapp-status-command`、
  `whatsapp-commands-command`、`whatsapp-tools-compact-command`、
  `whatsapp-whoami-command`、`whatsapp-context-command`、
  `whatsapp-native-new-command`。
- 返信と最終出力の動作: `whatsapp-tool-only-usage-footer`、
  `whatsapp-reply-to-message`、`whatsapp-group-reply-to-message`、
  `whatsapp-reply-to-mode-batched`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`、`whatsapp-stream-final-message-accounting`。
- ユーザーパスのメッセージアクション: `whatsapp-agent-message-action-react` は
  実際のドライバー DM から開始し、モデルに `message` ツールを呼び出させ、
  ネイティブ WhatsApp リアクションを観測します。`whatsapp-agent-message-action-upload-file` は
  `message(action=upload-file)` に対して同じ構成を使用し、
  ネイティブ WhatsApp メディアを観測します。`whatsapp-group-agent-message-action-react` と
  `whatsapp-group-agent-message-action-upload-file` は、実際の WhatsApp グループで同じ
  ユーザー可視アクションを実証します。
- グループファンアウト: `whatsapp-broadcast-group-fanout` は、メンションを含む 1 件の
  WhatsApp グループメッセージから開始し、`main`
  と `qa-second` から別々の可視返信が届くことを確認します。
- グループのアクティベーション: `whatsapp-group-activation-always` は実際のグループ
  セッションを `/activation always` に変更し、メンションのないグループメッセージで
  エージェントが起動することを実証した後、`/activation mention` に戻します。
  `whatsapp-group-reply-to-bot-triggers` はボットの返信を準備し、それに対して明示的なメンションなしで
  ネイティブの引用返信を送信し、その返信コンテキストからエージェントが
  起動することを確認します。
- 受信メディアと構造化メッセージ: `whatsapp-inbound-image-caption`、
  `whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、
  `whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。
  これらは、実際の WhatsApp の画像、音声、ドキュメント、位置情報、連絡先、
  ステッカー、リアクションイベントをドライバー経由で送信します。
- Gateway コントラクトの直接プローブ: `whatsapp-outbound-media-matrix`、
  `whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、
  `whatsapp-outbound-send-serialization`、
  `whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、
  `whatsapp-message-actions`、`whatsapp-reply-context-isolation`、
  `whatsapp-reply-delivery-shape`。これらは意図的にモデルへのプロンプトを迂回し、
  決定論的な Gateway／チャンネルの `send`、`poll`、および
  `message.action` コントラクトを実証します。
- アクセス制御のカバレッジ: `whatsapp-access-control-dm-open`、
  `whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、
  `whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- ネイティブ承認: `whatsapp-approval-exec-deny-native`、
  `whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、
  `whatsapp-approval-exec-group-reaction-native`、
  `whatsapp-approval-plugin-native`。
- ステータスリアクション: `whatsapp-status-reactions`、
  `whatsapp-status-reaction-lifecycle`。

カタログには現在 52 個のシナリオが含まれています。`live-frontier` のデフォルトレーンは、
高速なスモークカバレッジのため 8 シナリオに抑えられています。`mock-openai` の
デフォルトレーンは、モデル出力のみをモックしながら、実際の WhatsApp
トランスポートを介して 39 シナリオを決定論的に実行します。承認シナリオと、一部の
負荷が高い／ブロッキングするチェックは、引き続きシナリオ ID で明示的に指定します。

WhatsApp QA ドライバーは構造化されたライブイベント（`text`、`media`、
`location`、`reaction`、`poll`）を観測し、メディア、投票、
連絡先、位置情報、ステッカーを能動的に送信できます。QA Lab は非公開の
WhatsApp ランタイムファイルに直接アクセスせず、`@openclaw/whatsapp/api.js` パッケージサーフェスを介して
そのドライバーをインポートします。グループの観測では、`fromJid` がグループ JID、
`participantJid` と `fromPhoneE164` が参加者である送信者を識別します。
メッセージ内容はデフォルトで秘匿化されます。Gateway への直接の投票、ファイルアップロード、
メディア、グループ投票、グループメディア、返信形式のプローブは、トランスポート／API
コントラクトのチェックです。ユーザープロンプトによってエージェントが同じアクションを
選択したことの証明としては扱われません。ユーザーパスのアクション証明は、
`whatsapp-agent-message-action-react` や
`whatsapp-group-agent-message-action-react` などのシナリオから得られます。これらでは、ドライバーが通常の
WhatsApp メッセージを送信し、QA Lab が生成されたネイティブ WhatsApp 成果物を観測します。
WhatsApp シナリオの詳細には、各シナリオの構成（`user-path`、
`direct-gateway`、または `native-approval`）が含まれるため、実際に証明されたものより
強いコントラクトの証拠と誤認されることはありません。

出力成果物:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。

### Convex 認証情報プール

Discord、Slack、Telegram、WhatsApp の各レーンは、上記の環境変数を読み取る代わりに、
共有 Convex プールから認証情報をリースできます。
`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。
QA Lab は排他的リースを取得し、実行中は Heartbeat を送信し、
シャットダウン時にリースを解放します。プールの種類は `"discord"`、`"slack"`、
`"telegram"`、`"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形式:

- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` は数値のチャット ID 文字列でなければなりません。
- Telegram 実ユーザー（`kind: "telegram-user"`）: `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  Mantis Telegram Desktop の証明専用です。汎用 QA Lab レーンは
  この種類を取得してはなりません。
- WhatsApp（`kind: "whatsapp"`）: `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - 電話番号は異なる E.164 文字列でなければなりません。

Mantis Telegram Desktop の証明ワークフローは、TDLib CLI ドライバーと Telegram Desktop
監視の両方に対して 1 つの排他的な Convex `telegram-user` リースを保持し、
証明を公開した後に解放します。

PR で決定論的なビジュアル差分が必要な場合、Telegram のフォーマッターまたは
配信レイヤーを変更しながら、Mantis は `main` と PR head で同じモック
モデル返信を使用できます。キャプチャのデフォルトは PR コメント向けに調整されています。
標準 Crabbox クラス、24fps のデスクトップ録画、24fps のモーション GIF、1920px のプレビュー
幅です。変更前／変更後のコメントでは、意図した GIF のみを含むクリーンなバンドルを
公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形式のチェックは現在、ブローカーではなく
Slack QA ランナーにあります。`{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用し、Slack チャンネル ID には
`Cxxxxxxxxxx` のような値を指定します。アプリとスコープのプロビジョニングについては、
[Slack ワークスペースのセットアップ](#setting-up-the-slack-workspace)を参照してください。

運用環境変数と Convex ブローカーのエンドポイントコントラクトについては、
[テスト → Convex を介した共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)
を参照してください（このセクション名はマルチチャンネルプールより前から存在しますが、
リースのセマンティクスは各種類で共通です）。

## リポジトリ管理のシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

QA 計画を人間とエージェントの両方から確認できるようにするため、これらは意図的に git に
含まれています。

`qa-lab` は汎用 YAML シナリオランナーのままです。各シナリオ YAML ファイルは
1 回のテスト実行における信頼できる唯一の情報源であり、次を定義する必要があります。

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意のカテゴリ、機能、レーン、リスクのメタデータ
- `scenario` 内のドキュメントおよびコード参照
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の Gateway 設定パッチ
- フローシナリオ用の実行可能なトップレベルの `flow`、または
  Vitest および Playwright シナリオ用の `scenario.execution.kind`／`scenario.execution.path`

`flow` を支える再利用可能なランタイムサーフェスは、汎用的かつ
横断的なまま維持します。たとえば、YAML シナリオでは、特別なケースのランナーを追加せずに、
Gateway の `browser.request` シームを通じて組み込みの Control UI を操作する
ブラウザ側ヘルパーとトランスポート側ヘルパーを組み合わせられます。

シナリオファイルは、ソースツリーのフォルダーではなく、製品の機能別に
グループ化してください。ファイルを移動してもシナリオ ID は安定させ、
実装の追跡可能性には `docsRefs` と
`codeRefs` を使用します。

ベースライン一覧は、少なくとも次をカバーできる十分な広さを維持してください。

- DM とチャンネルチャット
- スレッドの動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリの想起
- モデルの切り替え
- サブエージェントへの引き継ぎ
- リポジトリとドキュメントの読み取り
- Lobster Invaders などの小規模なビルドタスク 1 件

## プロバイダーモックレーン

`qa suite` には、ローカルプロバイダーモックレーンが 2 つあります。

- `mock-openai` は、シナリオ対応の OpenClaw モックです。リポジトリベースの QA と
パリティゲート向けの、デフォルトの決定論的モックレーンとして維持されます。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、
カオスカバレッジ向けに AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、
`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、そのデフォルト、ローカルサーバーの起動、Gateway のモデル設定、
認証プロファイルのステージング要件、ライブ/モックの機能フラグを所有します。共有スイートと
Gateway のコードは、プロバイダー名で分岐せず、プロバイダーレジストリを通じてルーティングします。

## トランスポートアダプター

`qa-lab` は、YAML QA シナリオ向けの汎用トランスポートシームを所有します。`qa-channel` は
合成デフォルトです。`crabline` はローカルのプロバイダー形式のサーバーを起動し、
それらに対して OpenClaw の通常のチャンネル Plugin を実行します。`live` は、
実際のプロバイダー認証情報と外部チャンネル用に予約されています。

アーキテクチャレベルでは、分担は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、ワーカーの並行処理、アーティファクトの
  書き込み、レポート作成を所有します。
- トランスポートアダプターは、Gateway の設定、準備完了状態、受信と送信の
  観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の YAML シナリオファイルがテスト実行を定義し、`qa-lab` が
  それらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

YAML QA システムにチャンネルを追加するには、チャンネル実装に加えて、
チャンネル契約を検証するシナリオパックが必要です。スモーク CI
カバレッジのため、対応する Crabline ローカルプロバイダーサーバーを追加し、
`crabline` ドライバーを通じて公開します。

共有 `qa-lab` ホストがフローを所有できる場合は、
新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は、共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカーの並行処理
- アーティファクトの書き込み
- レポート生成
- シナリオ実行
- 旧 `qa-channel` シナリオ向けの互換性エイリアス

ランナー Plugin はトランスポート契約を所有します。

- 共有 `qa` ルート配下に `openclaw qa <runner>` をマウントする方法
- そのトランスポート向けに Gateway を設定する方法
- 準備完了状態を確認する方法
- 受信イベントを注入する方法
- 送信メッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに基づくアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャンネルを採用するための最低要件は次のとおりです。

1. 共有 `qa` ルートの所有者として `qa-lab` を維持します。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは、ランナー Plugin またはチャンネル
   ハーネス内に維持します。
4. 競合するルートコマンドを登録する代わりに、ランナーを `openclaw qa <runner>` として
   マウントします。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、
   `runtime-api.ts` から対応する `qaRunnerCliRegistrations`
   配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI と
   ランナーの実行は別々のエントリポイントの背後に維持してください。オプションの
   `adapterFactory` は、コマンドの既存シナリオカタログを変更せずに、
   トランスポートを共有シナリオへ公開します。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で YAML シナリオを
   作成または適応します。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を実施している場合を除き、
   既存の互換性エイリアスを動作させ続けます。

判断ルールは厳格です。

- 動作を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に配置します。
- 動作が 1 つのチャンネルトランスポートに依存する場合は、そのランナー
  Plugin または Plugin ハーネス内に維持します。
- 複数のチャンネルで使用できる新しい機能がシナリオに必要な場合は、
  `suite.ts` にチャンネル固有の分岐を追加せず、汎用ヘルパーを追加します。
- ある動作が 1 つのトランスポートでのみ意味を持つ場合は、シナリオを
  トランスポート固有のまま維持し、そのことをシナリオ契約で明示します。

### シナリオヘルパー名

新しいシナリオで推奨される汎用ヘルパーは次のとおりです。

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

既存のシナリオでは、互換性エイリアス
`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、
`formatConversationTranscript`、`resetBus` を引き続き使用できますが、
新しいシナリオの作成には汎用名を使用してください。エイリアスは
一斉移行を避けるために存在するものであり、今後のモデルではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートでは次に回答する必要があります。

- 正常に動作したもの
- 失敗したもの
- ブロックされたままのもの
- 追加する価値があるフォローアップシナリオ

利用可能なシナリオの一覧を確認するには（フォローアップ作業の規模を見積もる場合や、
新しいトランスポートを接続する場合に便利です）、`pnpm openclaw qa coverage` を実行します
（機械可読出力には `--json` を追加します）。
変更対象の動作またはファイルパスに対する重点的な検証を選ぶ場合は、
`pnpm openclaw qa coverage --match <query>` を実行します。照合レポートは、
シナリオメタデータ、ドキュメント参照、コード参照、カバレッジ ID、
Plugin、プロバイダー要件を検索し、一致する `qa suite
--scenario ...` ターゲットを出力します。

`qa suite` を実行するたびに、選択したシナリオセット向けのトップレベル
`qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md`
アーティファクトが書き込まれます。`execution.kind: vitest` または
`execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、
シナリオごとのログも書き込みます。`execution.kind: script` を宣言するシナリオは、
`node --import tsx` を通じて `execution.path` にあるエビデンス生成処理を実行します
（`${outputDir}` と `${scenarioId}` は `execution.args` で展開されます）。
生成処理は独自の `qa-evidence.json` を書き込み、そのエントリはスイート出力に
インポートされ、アーティファクトパスはその生成処理の `qa-evidence.json` を基準に
解決されます。`qa run
--qa-profile` を通じて `qa suite` に到達すると、
同じ `qa-evidence.json` に、選択した分類カテゴリのプロファイル
スコアカード概要も含まれます。

カバレッジ出力は検出支援として扱い、ゲートの代替として扱わないでください。
選択したシナリオには、テスト対象の動作に適したプロバイダーモード、ライブトランスポート、
Multipass、Testbox、またはリリースレーンが引き続き必要です。
スコアカードの背景情報については、[成熟度スコアカード](/ja-JP/maturity/scorecard)を参照してください。

キャラクターとスタイルを確認するには、複数のライブモデル参照で同じシナリオを実行し、
判定済みの Markdown レポートを作成します。

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

このコマンドは Docker ではなく、ローカル QA Gateway の子プロセスを実行します。
キャラクター評価シナリオでは `SOUL.md` を通じてペルソナを設定し、その後、
チャット、ワークスペースのヘルプ、小規模なファイルタスクなどの通常のユーザーターンを
実行してください。候補モデルには、評価されていることを伝えないでください。このコマンドは
各完全なトランスクリプトを保持し、基本的な実行統計を記録した後、サポートされている場合は
`xhigh` 推論を使用した高速モードで判定モデルに問い合わせ、自然さ、雰囲気、
ユーモアに基づいて実行を順位付けします。プロバイダーを比較する場合は
`--blind-judge-models` を使用します。判定プロンプトには引き続きすべてのトランスクリプトと
実行状態が渡されますが、候補参照は `candidate-01` などの中立的なラベルに
置き換えられます。レポートは解析後に順位を実際の参照へ対応付けます。

候補実行のデフォルトは `high` thinking で、GPT-5.6 Luna には
`medium`、それをサポートする旧 OpenAI 評価参照には
`xhigh` が使用されます。特定の候補は `--model provider/model,thinking=<level>` で
インライン上書きできます。インラインオプションは `fast`、
`no-fast`、`fast=<bool>` もサポートします。`--thinking
<level>` は
引き続きグローバルフォールバックを設定し、旧 `--model-thinking
<provider/model=level>` 形式は互換性のために
維持されます。OpenAI の候補参照では、プロバイダーがサポートしている場合に優先処理が
使用されるよう、高速モードがデフォルトになります。すべての候補モデルで高速モードを
強制的に有効にする場合にのみ、`--fast` を渡してください。候補と判定の所要時間は
ベンチマーク分析用にレポートへ記録されますが、判定プロンプトには速度で順位付けしないよう
明示されています。候補モデルと判定モデルの実行は、どちらも並行数 16 がデフォルトです。
プロバイダーの制限またはローカル Gateway の負荷によって実行のノイズが大きくなりすぎる場合は、
`--concurrency` または `--judge-concurrency` を下げてください。

候補 `--model` が渡されない場合、キャラクター評価のデフォルトは
`openai/gpt-5.6-luna`、`openai/gpt-5.2`、`openai/gpt-5`、
`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` です。
`--judge-model` が渡されない場合、判定モデルのデフォルトは
`openai/gpt-5.6-sol,thinking=xhigh,fast` と
`anthropic/claude-opus-4-8,thinking=high` です。

## 関連ドキュメント

- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [パーソナルエージェントベンチマークパック](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA チャンネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
