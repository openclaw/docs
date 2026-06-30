---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリ管理のQAシナリオを追加する
    - Gateway ダッシュボードを中心に、より高リアリズムな QA 自動化を構築する
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリに基づくシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA 概要
x-i18n:
    generated_at: "2026-06-30T13:47:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベートQAスタックは、単一のユニットテストよりも現実的で、
チャネルの形に沿った方法でOpenClawを検証するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、
  リアクション、編集、削除のサーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  インバウンドメッセージの注入、Markdownレポートのエクスポートを行うデバッガUIとQAバス。
- `extensions/qa-matrix`、将来のランナーPlugin: 子QAゲートウェイ内で
  実チャネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースラインQA
  シナリオ用のリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザスクリーンショット、VM状態、PR証跡が
  必要なバグに対するライブ検証の前後比較。

## コマンドサーフェス

すべてのQAフローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` なしの同梱QAセルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を指定した、タクソノミーに基づく成熟度プロファイルランナー。                                                                                                      |
| `qa suite`                                          | リポジトリ管理シナリオをQAゲートウェイレーンに対して実行します。エイリアス: 使い捨てLinux VM用の `pnpm openclaw qa suite --runner multipass`。                                                                                                                                  |
| `qa coverage`                                       | YAMLシナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                                                                                                               |
| `qa parity-report`                                  | 2つの `qa-suite-summary.json` ファイルを比較してエージェント型パリティレポートを書き出すか、`--runtime-axis --token-efficiency` を使って、1つのランタイムペアサマリーからCodex対OpenClawのランタイムパリティおよびトークン効率レポートを書き出します。                                         |
| `qa character-eval`                                 | 複数のライブモデルに対してキャラクターQAシナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                                                                                                                                            |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                                                                                                          |
| `qa ui`                                             | QAデバッガUIとローカルQAバスを開始します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 事前作成済みQA Dockerイメージをビルドします。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QAダッシュボード + ゲートウェイレーン用のdocker-composeスキャフォールドを書き出します。                                                                                                                                                                                                    |
| `qa up`                                             | QAサイトをビルドし、Dockerバックのスタックを開始してURLを出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                                                  |
| `qa aimock`                                         | AIMockプロバイダーサーバーだけを開始します。                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーだけを開始します。                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有Convex認証情報プールを管理します。                                                                                                                                                                                                                               |
| `qa matrix`                                         | 使い捨てTuwunelホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                                                                                                                      |
| `qa telegram`                                       | 実際のプライベートTelegramグループに対するライブトランスポートレーン。                                                                                                                                                                                                              |
| `qa discord`                                        | 実際のプライベートDiscordギルドチャネルに対するライブトランスポートレーン。                                                                                                                                                                                                       |
| `qa slack`                                          | 実際のプライベートSlackチャネルに対するライブトランスポートレーン。                                                                                                                                                                                                               |
| `qa whatsapp`                                       | 実際のWhatsApp Webアカウントに対するライブトランスポートレーン。                                                                                                                                                                                                                 |
| `qa mantis`                                         | ライブトランスポートバグの前後検証ランナー。Discordステータスリアクション証跡、Crabboxデスクトップ/ブラウザsmoke、Slack-in-VNC smokeを含みます。[Mantis](/ja-JP/concepts/mantis)と[Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook)を参照してください。 |

プロファイルに基づく `qa run` は `taxonomy.yaml` からメンバーシップを読み取り、
解決されたシナリオを `qa suite` 経由でディスパッチします。`--surface` と
`--category` は、個別のレーンを定義するのではなく、選択したプロファイルをフィルターします。
生成される `qa-evidence.json` には、選択カテゴリ数と不足しているカバレッジIDを含む
プロファイルスコアカードサマリーが含まれます。個々の証跡エントリは、
テスト、カバレッジロール、結果の信頼できる情報源のままです。
タクソノミー機能カバレッジIDは正確な証明ターゲットであり、エイリアスではありません。プライマリ
シナリオカバレッジは一致するIDを満たします。セカンダリカバレッジは参考情報のままです。
カバレッジIDは、小文字の英数字/ダッシュセグメントを持つドット区切りの
`namespace.behavior` 形式を使います。プロファイル、サーフェス、カテゴリIDは、既存のダッシュ区切りまたはドット区切りのタクソノミーIDを引き続き使用できます。
スリム証跡はエントリごとの `execution` を省略し、`evidenceMode: "slim"` を設定します。
`smoke-ci` はデフォルトでスリムになり、`--evidence-mode full` で完全なエントリを復元します。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデルプロバイダーとCrablineローカルプロバイダーサーバーを使った決定的なプロファイル証明には、
`smoke-ci` を使います。ライブチャネルに対するStable/LTS証明には `release` を使います。
`all` は明示的なフルタクソノミー証跡実行にのみ使います。これは
すべてのアクティブな成熟度カテゴリを選択し、`qa_profile=all` で `QA Profile
Evidence` ワークフロー経由でディスパッチできます。コマンドがOpenClaw
ルートプロファイルも必要とする場合は、QAコマンドの前にルートプロファイルを置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在のQAオペレーターフローは2ペインのQAサイトです。

- 左: エージェント付きのGatewayダッシュボード（Control UI）。
- 右: Slack風トランスクリプトとシナリオ計画を表示するQA Lab。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

これによりQAサイトがビルドされ、Dockerバックのゲートウェイレーンが開始され、
QA Labページが公開されます。そこでオペレーターまたは自動化ループはエージェントにQA
ミッションを与え、実チャネルの挙動を観察し、何が機能し、失敗し、または
ブロックされたままかを記録できます。

毎回Dockerイメージを再ビルドせずにQA Lab UIをより速く反復するには、
バインドマウントされたQA Labバンドルでスタックを開始します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` はDockerサービスを事前ビルド済みイメージ上に維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザが自動リロードします。

ローカルOpenTelemetryシグナルsmokeには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカルOTLP/HTTPレシーバーを開始し、`diagnostics-otel` Pluginを有効にした状態で
`otel-trace-smoke` QAシナリオを実行してから、トレース、
メトリクス、ログがエクスポートされていることをアサートします。エクスポートされたprotobufトレーススパンをデコードし、
リリースクリティカルな形をチェックします。
`openclaw.run`、`openclaw.harness.run`、最新のGenAIセマンティック規約
モデル呼び出しスパン、`openclaw.context.assembled`、`openclaw.message.delivery`
が存在する必要があります。smokeは
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、モデル呼び出し
スパンは `{gen_ai.operation.name} {gen_ai.request.model}` 名を使う必要があります。
成功したターンでは、モデル呼び出しが `StreamAbandoned` をエクスポートしてはいけません。生の診断IDと
`openclaw.content.*` 属性はトレースに含めてはいけません。生のOTLP
ペイロードにプロンプトセンチネル、レスポンスセンチネル、QAセッション
キーが含まれていてはいけません。QA suiteアーティファクトの横に `otel-smoke-summary.json` を書き出します。

CollectorバックのOpenTelemetry smokeには、次を実行します。

```bash
pnpm qa:otel:collector-smoke
```

このレーンは、同じローカルレシーバーの前に実際のOpenTelemetry Collector Dockerコンテナを置きます。
エンドポイント配線、Collector
互換性、またはインプロセスレシーバーでは見落とされる可能性のあるOTLPエクスポート挙動を変更するときに使います。

保護されたPrometheusスクレイプsmokeには、次を実行します。

```bash
pnpm qa:prometheus:smoke
```

そのエイリアスは、`diagnostics-prometheus` を有効にした
`docker-prometheus-smoke` QA シナリオを実行し、認証されていないスクレイプが拒否されることを検証してから、認証済みスクレイプにリリース上重要なメトリクスファミリーが含まれ、プロンプト内容、レスポンス内容、生の診断識別子、認証トークン、ローカルパスが含まれないことを確認します。

両方のオブザーバビリティスモークを続けて実行するには、次を使用します。

```bash
pnpm qa:observability:smoke
```

コレクターを使う OpenTelemetry レーンと、保護された Prometheus スクレイプスモークを実行するには、次を使用します。

```bash
pnpm qa:observability:collector-smoke
```

オブザーバビリティ QA はソースチェックアウト専用です。npm tarball では意図的に QA Lab を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断インストルメンテーションを変更する場合は、ビルド済みのソースチェックアウトから `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke` を使用してください。

モデルプロバイダー認証情報を必要としない、実トランスポートの Matrix スモークレーンでは、決定論的なモック OpenAI プロバイダーを使う高速プロファイルを実行します。

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

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクト配置は [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要としては、Docker 内に使い捨ての Tuwunel homeserver をプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA Gateway 内で実際の Matrix Plugin を実行し（`qa-channel` なし）、Markdown レポート、JSON サマリー、observed-events アーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` に書き込みます。

シナリオは、単体テストではエンドツーエンドで証明できないトランスポート動作を対象にしています。メンションゲート、allow-bot ポリシー、許可リスト、トップレベル返信とスレッド返信、DM ルーティング、リアクション処理、受信編集の抑制、再起動時のリプレイ重複排除、homeserver 中断からの復旧、承認メタデータ配信、メディア処理、Matrix E2EE のブートストラップ/復旧/検証フローです。E2EE CLI プロファイルは、Gateway 返信を確認する前に、同じ使い捨て homeserver を通じて `openclaw matrix encryption setup` と検証コマンドも実行します。

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータスリアクションタイムラインには `--scenario discord-status-reactions-tool-only` を使用し、実際の Discord スレッドを作成して `message.thread-reply` が `filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment` を使用します。これらのシナリオは広範なスモークカバレッジではなく前後比較の再現プローブであるため、デフォルトの live Discord レーンには含まれません。QA 環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、スレッド添付 Mantis ワークフローは、ログイン済み Discord Web の証人動画も追加できます。この viewer プロファイルは視覚キャプチャ専用です。合否判定は引き続き Discord REST オラクルから取得されます。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とデフォルトの手動実行は、QA が提供する live-frontier 認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使って高速 Matrix プロファイルを実行します。手動の `matrix_profile=all` は 5 つのプロファイルシャードにファンアウトします。

実トランスポートの Telegram、Discord、Slack、WhatsApp スモークレーンでは、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

これらは、2 つのボットまたはアカウント（driver + SUT）を持つ既存の実チャンネルを対象にします。必要な環境変数、シナリオ一覧、出力アーティファクト、Convex 認証情報プールは、下の [Telegram、Discord、Slack、WhatsApp QA リファレンス](#telegram-discord-slack-and-whatsapp-qa-reference) に記載されています。

VNC レスキュー付きの完全な Slack デスクトップ VM 実行では、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack live レーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、動画キャプチャが利用可能な場合は `slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4` を Mantis アーティファクトディレクトリにコピーします。Crabbox デスクトップ/ブラウザリースは、キャプチャツールとブラウザ/native-build ヘルパーパッケージをあらかじめ提供するため、このシナリオがフォールバックをインストールするのは古いリースのみであるべきです。Mantis は `mantis-slack-desktop-smoke-report.md` に合計およびフェーズ別の所要時間を報告するため、遅い実行で時間がリースのウォームアップ、認証情報取得、リモートセットアップ、アーティファクトコピーのどこに使われたかが分かります。VNC 経由で Slack Web に手動ログインした後は `--lease-id <cbx_...>` を再利用してください。再利用したリースでは Crabbox の pnpm store キャッシュも暖かい状態に保たれます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内で install/build を実行します。`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合にのみ使用してください。このモードは高コストな install/build ステップをスキップし、ワークスペースの準備ができていない場合は fail closed します。`--gateway-setup` を指定すると、Mantis は VM 内のポート `38973` で永続的な OpenClaw Slack Gateway を起動したままにします。指定しない場合、コマンドは通常の bot-to-bot Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

デスクトップ証拠付きでネイティブ Slack 承認 UI を証明するには、Mantis 承認チェックポイントモードを実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と同時に使用できません。Slack 承認シナリオを実行し、承認シナリオ以外の ID を拒否し、各 pending および resolved 承認状態で待機し、観測された Slack API メッセージを `approval-checkpoints/<scenario>-pending.png` と `approval-checkpoints/<scenario>-resolved.png` にレンダリングし、いずれかのチェックポイント、メッセージ証拠、確認応答、またはレンダリング済みスクリーンショットが欠落または空の場合は失敗します。コールド CI リースでは `slack-desktop-smoke.png` に Slack サインインが表示されることがあります。このレーンの視覚的証拠は承認チェックポイント画像です。

オペレーターチェックリスト、GitHub ワークフローディスパッチコマンド、証拠コメント契約、hydrate-mode 判断表、タイミングの解釈、失敗時の処理手順は [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV 形式のデスクトップタスクでは、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` は Crabbox デスクトップ/ブラウザマシンをリースまたは再利用し、`crabbox record --while` を開始し、ネストされた `visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き込みます。`--expect-text` が設定されている場合、ビジョンプロンプトは構造化 JSON 判定を要求し、モデルが肯定的な可視証拠を報告した場合にのみ成功します。対象テキストを引用するだけの否定応答はアサーションに失敗します。画像理解プロバイダーを呼び出さずにデスクトップ、ブラウザ、スクリーンショット、動画の配管を証明する no-model スモークには `--vision-mode metadata` を使用します。録画は `visual-task` の必須アーティファクトです。Crabbox が空でない `visual-task.mp4` を記録しない場合、visual driver が成功していてもタスクは失敗します。失敗時、タスクがすでに成功していて `--keep-lease` が設定されていない場合を除き、Mantis は VNC 用にリースを保持します。

プールされた live 認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker 環境を確認し、エンドポイント設定を検証し、maintainer シークレットが存在する場合は admin/list 到達性を検証します。シークレットについては設定済み/欠落ステータスのみを報告します。

## live トランスポートカバレッジ

live トランスポートレーンは、それぞれが独自のシナリオリスト形状を作るのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、live トランスポートカバレッジマトリクスの一部ではありません。

live トランスポートランナーは、共有シナリオ ID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパーを `openclaw/plugin-sdk/qa-live-transport-scenarios` からインポートする必要があります。

| レーン     | Canary | メンションゲート | Bot-to-bot | 許可リストブロック | トップレベル返信 | 引用返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | Help コマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

これにより、`qa-channel` は広範なプロダクト動作スイートのまま維持され、Matrix、Telegram、その他の live トランスポートは 1 つの明示的なトランスポート契約チェックリストを共有します。

QA パスに Docker を持ち込まない使い捨て Linux VM レーンでは、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。ホストおよび Multipass のスイート実行は、デフォルトで分離された Gateway ワーカーを使って、選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 で、選択されたシナリオ数を上限とします。ワーカー数を調整するには `--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。personal assistant ベンチマークパックを実行するには `--pack personal-agent` を使用します。パックセレクターは繰り返し指定された `--scenario` フラグに加算されます。明示的なシナリオが最初に実行され、その後パックシナリオがパック順に、重複を除去して実行されます。カスタム QA ランナーがすでに OpenTelemetry コレクターセットアップを提供しており、OpenTelemetry と Prometheus 診断スモークシナリオをまとめて選択したい場合は `--pack observability` を使用します。いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。live 実行は、ゲストで実用的なサポート済み QA 認証入力を転送します。環境変数ベースのプロバイダーキー、QA live プロバイダー設定パス、存在する場合の `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルート配下に置いてください。

## Telegram、Discord、Slack、WhatsApp QA リファレンス

Matrix はシナリオ数と Docker ベースの homeserver プロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack、WhatsApp は既存の実際のトランスポートに対して実行されるため、リファレンスはここにあります。

### 共通 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                | デフォルト                                       | 説明                                                                                                                                             |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオのみを実行します。繰り返し指定できます。                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、証拠、トランスポート固有の成果物、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                           |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント id です。                                                                                                     |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                          |
| `--model <ref>` / `--alt-model <ref>` | provider default                                   | プライマリ/代替モデル ref です。                                                                                                                 |
| `--fast`                              | off                                                | サポートされている場合のプロバイダー高速モードです。                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex credential pool](#convex-credential-pool) を参照してください。                                                                           |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`            | `--credential-source convex` の場合に使用されるロールです。                                                                                      |

いずれかのシナリオが失敗すると、各レーンは 0 以外で終了します。`--allow-failures` は失敗終了コードを設定せずに成果物を書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（driver + SUT）を持つ、実際の 1 つのプライベート Telegram グループを対象にします。SUT ボットには Telegram ユーザー名が必要です。bot-to-bot 観測は、両方のボットで `@BotFather` の **Bot-to-Bot Communication Mode** が有効な場合に最も安定します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値の chat id（文字列）。
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
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

暗黙のデフォルトセットは、常に canary、メンションゲーティング、ネイティブコマンド返信、コマンドアドレッシング、bot-to-bot グループ返信をカバーします。`mock-openai` のデフォルトには、決定的な返信チェーンと最終メッセージのストリーミングチェックも含まれます。`telegram-current-session-status-tool` は、canary の直後にスレッド化された場合のみ安定し、任意のネイティブコマンド返信の後では安定しないため、引き続き opt-in です。現在のデフォルト/オプション分割と regression refs を出力するには、`pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` を使用します。

出力成果物:

- `telegram-qa-report.md`
- `qa-evidence.json` - live トランスポートチェックの証拠エントリ。profile、coverage、provider、channel、artifacts、result、RTT フィールドを含みます。

Package Telegram の実行は同じ Telegram 認証情報契約を使用します。繰り返し RTT
測定は通常の package Telegram live レーンの一部です。RTT
分布は、選択された RTT チェックの `result.timing` の下で `qa-evidence.json` に組み込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、package live wrapper は
`kind: "telegram"` 認証情報を lease し、lease された group/driver/SUT ボット
env をインストール済み package 実行にエクスポートし、lease に Heartbeat を送り、シャットダウン時に
解放します。package wrapper は、Convex が選択されている場合、CI 外では
`telegram-mentioned-message-reply` の RTT チェック 20 回、30s RTT タイムアウト、Convex ロール
`maintainer` をデフォルトにします。別の RTT コマンドや Telegram 固有のサマリー形式を
作成せずに RTT 測定を調整するには、
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、
または `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットを持つ、実際の 1 つのプライベート Discord guild channel を対象にします。1 つは harness が制御する driver ボットで、もう 1 つは bundled Discord Plugin を通じて子 OpenClaw Gateway が起動する SUT ボットです。channel mention handling、SUT ボットが Discord にネイティブ `/help` コマンドを登録していること、opt-in Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord が返す SUT ボットユーザー id と一致する必要があります（一致しない場合、レーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は observed-message 成果物内にメッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は `discord-voice-autojoin` 用の voice/stage channel を選択します。これがない場合、シナリオは SUT ボットから見える最初の voice/stage channel を選びます。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - opt-in voice シナリオです。単独で実行され、`channels.discord.voice.autoJoin` を有効にし、SUT ボットの現在の Discord voice state が対象の voice/stage channel であることを検証します。Convex Discord 認証情報には任意の `voiceChannelId` を含められます。それ以外の場合、runner は guild 内で最初に見える voice/stage channel を検出します。
- `discord-status-reactions-tool-only` - opt-in Mantis シナリオです。SUT を `messages.statusReactions.enabled=true` 付きの常時オン、tool-only guild 返信に切り替えるため単独で実行され、その後 REST reaction timeline と HTML/PNG visual 成果物を取得します。Mantis の before/after レポートは、シナリオが提供する MP4 成果物も `baseline.mp4` と `candidate.mp4` として保持します。

Discord voice auto-join シナリオを明示的に実行します。

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis status-reaction シナリオを明示的に実行します。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

出力成果物:

- `discord-qa-report.md`
- `qa-evidence.json` - live トランスポートチェックの証拠エントリ。
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は redacted されます。
- status-reaction シナリオが実行された場合の `discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

2 つの異なるボットを持つ、実際の 1 つのプライベート Slack channel を対象にします。1 つは harness が制御する driver ボットで、もう 1 つは bundled Slack Plugin を通じて子 OpenClaw Gateway が起動する SUT ボットです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は observed-message 成果物内にメッセージ本文を保持します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は Mantis の visual approval
  checkpoints を有効にします。runner は `<scenario>.pending.json` と
  `<scenario>.resolved.json` を書き込み、その後一致する `.ack.json` ファイルを待ちます。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` は checkpoint
  acknowledgement timeout を上書きします。デフォルトは `120000` です。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）:

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - opt-in ネイティブ Slack exec approval シナリオです。
  Gateway 経由で exec approval を要求し、Slack メッセージに
  ネイティブ approval ボタンがあることを検証し、それを解決して resolved Slack update を検証します。
- `slack-approval-plugin-native` - opt-in ネイティブ Slack Plugin approval シナリオです。
  exec と Plugin approval forwarding を一緒に有効化し、Plugin events が
  exec approval routing によって抑制されないようにしたうえで、同じ pending/resolved
  ネイティブ Slack UI path を検証します。

出力成果物:

- `slack-qa-report.md`
- `qa-evidence.json` - live トランスポートチェックの証拠エントリ。
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文は redacted されます。
- `approval-checkpoints/` - Mantis が
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` を設定した場合のみ。checkpoint JSON、
  acknowledgement JSON、pending/resolved screenshots を含みます。

#### Slack workspace のセットアップ

このレーンには、1 つの workspace 内に 2 つの異なる Slack apps と、両方のボットがメンバーである channel が必要です。

- `channelId` - 両方のボットが招待されている channel の `Cxxxxxxxxxx` id。専用 channel を使用してください。このレーンは実行ごとに投稿します。
- `driverBotToken` - **Driver** app の bot token（`xoxb-...`）。
- `sutBotToken` - **SUT** app の bot token（`xoxb-...`）。driver とは別の Slack app である必要があり、その bot user id が異なるようにします。
- `sutAppToken` - `connections:write` を持つ SUT app の app-level token（`xapp-...`）。Socket Mode が SUT app でイベントを受信できるようにするために使用されます。

本番 workspace を再利用するよりも、QA 専用の Slack workspace を推奨します。

下の SUT manifest は、bundled Slack Plugin の production install（`extensions/slack/src/setup-shared.ts:10`）を、live Slack QA suite でカバーされる権限とイベントに意図的に絞っています。ユーザーが見る production-channel setup については、[Slack channel quick setup](/ja-JP/channels/slack#quick-setup) を参照してください。QA Driver/SUT ペアは、1 つの workspace 内に 2 つの異なる bot user id が必要なため、意図的に分離されています。

**1. Driver app を作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動し、_新しいアプリを作成_ → _マニフェストから_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから、_ワークスペースにインストール_ を実行します。

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

_Bot User OAuth Token_ (`xoxb-...`) をコピーします。これが `driverBotToken` になります。ドライバーに必要なのは、メッセージを投稿して自身を識別することだけです。イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _新しいアプリを作成 → マニフェストから_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト (`extensions/slack/src/setup-shared.ts:10`) より狭いバージョンを意図的に使用します。ライブ Slack QA スイートはまだリアクション処理をカバーしていないため、リアクションスコープとイベントは省略されています。

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

Slack がアプリを作成したら、その設定ページで 2 つの操作を行います。

- _ワークスペースにインストール_ → _Bot User OAuth Token_ をコピー → これが `sutBotToken` になります。
- _基本情報 → アプリレベルトークン → トークンとスコープを生成_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → これが `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットが異なるユーザー ID を持つことを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。1 つのアプリを両方に再利用すると、メンションゲートですぐに失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から両方のボットを招待します。

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_チャンネル情報 → 概要 → チャンネル ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。公開チャンネルで動作します。プライベートチャンネルを使用する場合でも、両方のアプリにはすでに `groups:history` があるため、ハーネスの履歴読み取りは成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには環境変数を使用します（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、CI と他のメンテナーがリースできるように、共有 Convex プールにシードします。

Convex プールの場合は、4 つのフィールドを JSON ファイルに書き込みます。

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

`count: 1`、`status: "active"`、`lease` フィールドなしになることを想定します。

**5. エンドツーエンドで検証する**

ローカルでレーンを実行し、両方のボットがブローカー経由で相互に通信できることを確認します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常な実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` では `slack-canary` と `slack-mention-gating` の両方がステータス `pass` になります。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空であるか、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらかを確認できます。

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

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は、`whatsapp-mention-gating` や `whatsapp-group-allowlist-block` などのグループシナリオを有効にします。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` は、observed-message アーティファクト内にメッセージ本文を保持します。

シナリオカタログ (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- ベースラインとグループゲーティング: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- ネイティブコマンド: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- 返信と最終出力の動作: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- 受信メディアと構造化メッセージ: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. これらは、実際の WhatsApp の画像、音声、ドキュメント、位置情報、連絡先、ステッカーイベントをドライバー経由で送信します。
- 送信 Gateway とメッセージアクションのカバレッジ:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- アクセス制御のカバレッジ: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- ネイティブ承認: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- ステータスリアクション: `whatsapp-status-reactions`.

カタログには現在 36 個のシナリオが含まれています。`live-frontier` デフォルトレーンは、高速なスモークカバレッジのため 10 シナリオに抑えています。`mock-openai` デフォルトレーンは、モデル出力のみをモックしながら、実際の WhatsApp トランスポートを通じて 31 個の決定論的シナリオを実行します。承認シナリオと、いくつかの重めまたはブロッキングのチェックは、シナリオ id による明示実行のままです。

WhatsApp QA ドライバーは、構造化されたライブイベント (`text`, `media`, `location`, `reaction`, `poll`) を監視し、メディア、投票、連絡先、位置情報、ステッカーを能動的に送信できます。QA Lab は、非公開の WhatsApp runtime ファイルへ到達するのではなく、`@openclaw/whatsapp/api.js` パッケージサーフェスを通じてそのドライバーをインポートします。メッセージ内容はデフォルトで redact されます。送信 poll と upload-file のカバレッジは、モデルプロンプトのみのツール呼び出しではなく、決定論的な gateway `poll` と `message.action` 呼び出しを通じて実行されます。

出力アーティファクト:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリ。
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` でない限り本文は redact されます。

### Convex 認証情報プール

Telegram、Discord、Slack、WhatsApp レーンは、上記の env vars を読む代わりに共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡すか、`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定してください。QA Lab は排他的リースを取得し、実行中はそれに Heartbeat を送り、シャットダウン時に解放します。プール種別は `"telegram"`, `"discord"`, `"slack"`, `"whatsapp"` です。

`admin/add` でブローカーが検証するペイロード形状:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` は数値の chat-id 文字列である必要があります。
- Telegram 実ユーザー (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Mantis Telegram Desktop proof 専用です。汎用 QA Lab レーンはこの種別を取得してはいけません。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話番号は互いに異なる E.164 文字列である必要があります。

Mantis Telegram Desktop proof ワークフローは、TDLib CLI ドライバーと Telegram Desktop witness の両方のために、1 つの排他的 Convex `telegram-user` リースを保持し、proof を公開した後に解放します。

PR に決定論的なビジュアル差分が必要な場合、Mantis は Telegram formatter または delivery layer が変わる間、`main` と PR head で同じモックモデル返信を使用できます。キャプチャのデフォルトは PR コメント向けに調整されています。標準 Crabbox クラス、24fps のデスクトップ録画、24fps の motion GIF、1920px のプレビュー幅です。before/after コメントでは、意図した GIF のみを含むクリーンなバンドルを公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形状チェックは現在、ブローカーではなく Slack QA runner にあります。`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用し、`Cxxxxxxxxxx` のような Slack channel id を指定してください。アプリとスコープのプロビジョニングについては、[Slack ワークスペースのセットアップ](#setting-up-the-slack-workspace) を参照してください。

運用 env vars と Convex ブローカーエンドポイントのコントラクトは、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります。このセクション名はマルチチャネルプール以前のものですが、リースセマンティクスは各種別で共有されています。

## リポジトリに基づくシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

これらは、QA プランを人間と agent の両方に見えるようにするため、意図的に git に含めています。

`qa-lab` は汎用 YAML シナリオランナーであり続ける必要があります。各シナリオ YAML ファイルは、1 回のテスト実行に対する信頼できる情報源であり、以下を定義する必要があります:

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意の category、capability、lane、risk メタデータ
- `scenario` 内の docs と code refs
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の gateway config patch
- フローシナリオ用の実行可能なトップレベル `flow`、または Vitest と Playwright シナリオ用の `scenario.execution.kind` / `scenario.execution.path`

`flow` を支える再利用可能なランタイムサーフェスは、汎用的で横断的なままにしてよい。たとえば、YAML シナリオでは、特別扱いのランナーを追加せずに、Gateway の `browser.request` シームを通じて埋め込み Control UI を駆動するブラウザー側ヘルパーと、トランスポート側ヘルパーを組み合わせられる。

シナリオファイルは、ソースツリーのフォルダーではなく、プロダクト機能ごとにグループ化する。ファイルを移動してもシナリオ ID は安定させる。実装の追跡可能性には `docsRefs` と `codeRefs` を使う。

ベースラインリストは、以下をカバーできる程度に広く保つ。

- DM とチャンネルチャット
- スレッドの動作
- メッセージアクションのライフサイクル
- cron コールバック
- メモリの想起
- モデル切り替え
- サブエージェントへの引き渡し
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 件

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがある。

- `mock-openai` は、シナリオを認識する OpenClaw モックである。リポジトリに基づく QA とパリティゲートのデフォルトの決定的モックレーンのままとする。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために、AIMock ベースのプロバイダーサーバーを起動する。これは追加要素であり、`mock-openai` シナリオディスパッチャーを置き換えるものではない。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にある。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、認証プロファイルのステージング要件、live/mock 機能フラグを所有する。共有スイートと Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを通じてルーティングする。

## トランスポートアダプター

`qa-lab` は YAML QA シナリオ向けの汎用トランスポートシームを所有する。`qa-channel` は合成デフォルトである。`crabline` はローカルのプロバイダー形状サーバーを起動し、それらに対して OpenClaw の通常のチャンネル Plugin を実行する。`live` は実プロバイダー認証情報と外部チャンネル用に予約されている。

アーキテクチャレベルでの分割は次のとおり。

- `qa-lab` は、汎用シナリオ実行、ワーカー並行性、アーティファクト書き込み、レポート作成を所有する。
- トランスポートアダプターは、Gateway 設定、準備完了、受信と送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有する。
- `qa/scenarios/` 配下の YAML シナリオファイルはテスト実行を定義する。`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供する。

### チャンネルを追加する

YAML QA システムにチャンネルを追加するには、チャンネル実装に加えて、そのチャンネル契約を実行するシナリオパックが必要である。smoke CI カバレッジのために、対応する Crabline ローカルプロバイダーサーバーを追加し、`crabline` ドライバーを通じて公開する。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しない。

`qa-lab` は共有ホストの仕組みを所有する。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並行性
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を所有する。

- `openclaw qa <runner>` を共有 `qa` ルート配下にマウントする方法
- そのトランスポート向けに Gateway を設定する方法
- 準備完了を確認する方法
- 受信イベントを注入する方法
- 送信メッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに基づくアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを扱う方法

新しいチャンネルの最小導入基準は次のとおり。

1. 共有 `qa` ルートの所有者を `qa-lab` のままにする。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装する。
3. トランスポート固有の仕組みはランナー Plugin またはチャンネルハーネス内に保つ。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする。`runtime-api.ts` は軽量に保つ。遅延 CLI とランナー実行は、別のエントリーポイントの背後に置く。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で YAML シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使う。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格である。

- 挙動を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置く。
- 挙動が 1 つのチャンネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネス内に保つ。
- シナリオが複数のチャンネルで使える新しい機能を必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加する。
- 挙動が 1 つのトランスポートでのみ意味を持つ場合は、シナリオをトランスポート固有に保ち、それをシナリオ契約で明示する。

### シナリオヘルパー名

新しいシナリオで推奨される汎用ヘルパーは次のとおり。

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

既存シナリオ向けの互換エイリアスとして、`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` は引き続き利用できる。ただし、新しいシナリオ作成では汎用名を使うべきである。これらのエイリアスは一斉移行を避けるために存在しており、今後のモデルではない。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートする。レポートは次に答えるべきである。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- どのフォローアップシナリオを追加する価値があるか

利用可能なシナリオのインベントリには、フォローアップ作業の規模を見積もる場合や新しいトランスポートを配線する場合に役立つ `pnpm openclaw qa coverage` を実行する（機械可読出力には `--json` を追加する）。
触れた挙動またはファイルパスに対する焦点を絞った証拠を選ぶ場合は、`pnpm openclaw qa coverage --match <query>` を実行する。
マッチレポートは、シナリオメタデータ、ドキュメント参照、コード参照、カバレッジ ID、Plugin、プロバイダー要件を検索し、一致する `qa suite --scenario ...` ターゲットを出力する。
すべての `qa suite` 実行は、選択されたシナリオセットについて、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き込む。`execution.kind: vitest` または `execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、シナリオごとのログも書き込む。`execution.kind: script` を宣言するシナリオは、`node --import tsx` を通じて `execution.path` の証拠プロデューサーを実行する（`execution.args` 内で `${outputDir}` と `${scenarioId}` が展開される）。プロデューサーは自身の `qa-evidence.json` を書き込み、そのエントリはスイート出力にインポートされ、そのアーティファクトパスはそのプロデューサーの `qa-evidence.json` からの相対パスとして解決される。`qa run --qa-profile` を通じて `qa suite` に到達した場合、同じ `qa-evidence.json` には、選択された分類カテゴリのプロファイルスコアカードサマリーも含まれる。
これは発見支援として扱い、ゲートの代替として扱わない。選択したシナリオには、テスト対象の挙動に応じて、適切なプロバイダーモード、live トランスポート、Multipass、Testbox、またはリリースレーンがなお必要である。
スコアカードの文脈については、[成熟度スコアカード](/ja-JP/maturity/scorecard) を参照。

キャラクターとスタイルのチェックでは、複数の live モデル参照に対して同じシナリオを実行し、判定済み Markdown レポートを書き込む。

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行する。キャラクター評価シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後にチャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行するべきである。候補モデルには、評価されていることを知らせるべきではない。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録した後、サポートされる場合は高速モードかつ `xhigh` 推論でジャッジモデルに依頼し、自然さ、雰囲気、ユーモアで実行をランク付けする。
プロバイダーを比較する場合は `--blind-judge-models` を使う。ジャッジプロンプトにはすべてのトランスクリプトと実行ステータスが引き続き渡されるが、候補参照は `candidate-01` のような中立ラベルに置き換えられる。レポートは解析後にランキングを実際の参照へ対応付ける。
候補実行のデフォルトは `high` thinking で、GPT-5.5 は `medium`、それをサポートする古い OpenAI 評価参照は `xhigh` である。特定の候補を上書きするには、`--model provider/model,thinking=<level>` でインライン指定する。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために保持されている。
OpenAI 候補参照は、プロバイダーがサポートする場合に優先処理が使われるよう、デフォルトで高速モードになる。単一の候補またはジャッジに上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加する。すべての候補モデルで高速モードを強制したい場合にのみ、`--fast` を渡す。候補とジャッジの所要時間はベンチマーク分析のためにレポートに記録されるが、ジャッジプロンプトでは速度でランク付けしないよう明示される。
候補モデル実行とジャッジモデル実行はいずれもデフォルトの並行数が 16 である。プロバイダー制限またはローカル Gateway の負荷により実行が過度にノイズを含む場合は、`--concurrency` または `--judge-concurrency` を下げる。
候補 `--model` が渡されない場合、character eval は、`--model` が渡されない場合に `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、`google/gemini-3.1-pro-preview` をデフォルトとする。
`--judge-model` が渡されない場合、ジャッジはデフォルトで `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-8,thinking=high` になる。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [Personal agent benchmark pack](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA Channel](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [Dashboard](/ja-JP/web/dashboard)
