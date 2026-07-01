---
read_when:
    - QA スタックがどのように組み合わさっているかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターを拡張する
    - リポジトリ backed QA シナリオの追加
    - Gateway ダッシュボードを中心に高リアリズムの QA 自動化を構築する
summary: 'QAスタックの概要: qa-lab、qa-channel、リポジトリベースのシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA 概要
x-i18n:
    generated_at: "2026-07-01T05:28:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

OpenClawを単一のユニットテストよりも現実的な、
チャネルに即した形で実行検証するためのプライベートQAスタックです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャンネル、スレッド、リアクション、編集、削除の各サーフェスを持つ合成メッセージチャンネル。
- `extensions/qa-lab`: トランスクリプトの観察、インバウンドメッセージの注入、Markdownレポートのエクスポートに使うデバッガーUIとQAバス。
- `extensions/qa-matrix`、今後のランナーPlugin: 子QA Gateway内で実際のチャネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースラインQAシナリオのためのリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザスクリーンショット、VM状態、PR証跡が必要なバグに対するライブ検証の前後比較。

## コマンドサーフェス

すべてのQAフローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあり、どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` なしの同梱QAセルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を指定した、タクソノミーに基づく成熟度プロファイルランナー。                                                                                    |
| `qa suite`                                          | QA Gatewayレーンに対して、リポジトリ管理シナリオを実行します。エイリアス: 使い捨てLinux VM向けの `pnpm openclaw qa suite --runner multipass`。                                                                                                                         |
| `qa coverage`                                       | YAMLシナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                                                                                                              |
| `qa parity-report`                                  | 2つの `qa-suite-summary.json` ファイルを比較してエージェント的パリティレポートを書き出すか、`--runtime-axis --token-efficiency` を使って、1つのランタイムペアサマリーからCodex対OpenClawのランタイムパリティおよびトークン効率レポートを書き出します。              |
| `qa character-eval`                                 | 複数のライブモデルに対してキャラクターQAシナリオを実行し、判定付きレポートを作成します。[レポート](#reporting)を参照してください。                                                                                                                                     |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して、単発プロンプトを実行します。                                                                                                                                                                                                |
| `qa ui`                                             | QAデバッガーUIとローカルQAバスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                           |
| `qa docker-build-image`                             | 事前焼き込み済みQA Dockerイメージをビルドします。                                                                                                                                                                                                                      |
| `qa docker-scaffold`                                | QAダッシュボード + Gatewayレーン用のdocker-composeスキャフォールドを書き出します。                                                                                                                                                                                     |
| `qa up`                                             | QAサイトをビルドし、Dockerベースのスタックを起動してURLを出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                         |
| `qa aimock`                                         | AIMockプロバイダーサーバーのみを起動します。                                                                                                                                                                                                                            |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                                                                                                    |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有Convex資格情報プールを管理します。                                                                                                                                                                                                                                  |
| `qa matrix`                                         | 使い捨てTuwunelホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                                                                                                 |
| `qa telegram`                                       | 実際のプライベートTelegramグループに対するライブトランスポートレーン。                                                                                                                                                                                                |
| `qa discord`                                        | 実際のプライベートDiscordギルドチャンネルに対するライブトランスポートレーン。                                                                                                                                                                                         |
| `qa slack`                                          | 実際のプライベートSlackチャンネルに対するライブトランスポートレーン。                                                                                                                                                                                                 |
| `qa whatsapp`                                       | 実際のWhatsApp Webアカウントに対するライブトランスポートレーン。                                                                                                                                                                                                      |
| `qa mantis`                                         | ライブトランスポートのバグ向けの前後比較検証ランナー。Discordステータスリアクション証跡、Crabboxデスクトップ/ブラウザsmoke、Slack-in-VNC smokeを含みます。[Mantis](/ja-JP/concepts/mantis)と[Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook)を参照してください。 |

プロファイルに基づく `qa run` は `taxonomy.yaml` からメンバーシップを読み取り、解決されたシナリオを
`qa suite` 経由でディスパッチします。`--surface` と
`--category` は、別個のレーンを定義するのではなく、選択されたプロファイルをフィルタリングします。
結果の `qa-evidence.json` には、選択カテゴリ数と不足しているカバレッジIDを含むプロファイルスコアカードサマリーが含まれます。個々の証跡エントリは、テスト、カバレッジロール、結果の信頼できる情報源であり続けます。
タクソノミー機能カバレッジIDは正確な証明ターゲットであり、エイリアスではありません。プライマリシナリオカバレッジは一致するIDを満たし、セカンダリカバレッジは参考情報のままです。
カバレッジIDは、小文字の英数字/ダッシュセグメントによるドット区切りの `namespace.behavior` 形式を使用します。プロファイル、サーフェス、カテゴリIDは、既存のダッシュ区切りまたはドット区切りのタクソノミーIDを引き続き使用できます。
スリム証跡はエントリごとの `execution` を省略し、`evidenceMode: "slim"` を設定します。
`smoke-ci` はデフォルトでスリムになり、`--evidence-mode full` で完全なエントリに戻します。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデルプロバイダーとCrablineローカルプロバイダーサーバーによる決定論的なプロファイル証明には `smoke-ci` を使用します。ライブチャネルに対するStable/LTS証明には `release` を使用します。`all` は明示的な全タクソノミー証跡実行にのみ使用してください。これはすべてのアクティブな成熟度カテゴリを選択し、`QA Profile
Evidence` ワークフローで `qa_profile=all` としてディスパッチできます。コマンドがOpenClawルートプロファイルも必要とする場合は、QAコマンドの前にルートプロファイルを置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在のQAオペレーターフローは、2ペインのQAサイトです。

- 左: エージェント付きGatewayダッシュボード（Control UI）。
- 右: Slack風のトランスクリプトとシナリオ計画を表示するQA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これはQAサイトをビルドし、DockerベースのGatewayレーンを起動し、オペレーターまたは自動化ループがエージェントにQAミッションを与え、実際のチャネル動作を観察し、何が機能し、失敗し、またはブロックされたままだったかを記録できるQA Labページを公開します。

毎回Dockerイメージを再ビルドせずにQA Lab UIをより速く反復するには、バインドマウントされたQA Labバンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` はDockerサービスを事前ビルド済みイメージ上に維持し、`extensions/qa-lab/web/dist` を `qa-lab` コンテナへバインドマウントします。`qa:lab:watch` は変更時にそのバンドルを再ビルドし、QA Labアセットハッシュが変わるとブラウザが自動リロードします。

ローカルOpenTelemetryシグナルsmokeには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカルOTLP/HTTPレシーバーを起動し、`diagnostics-otel` Pluginを有効にして `otel-trace-smoke` QAシナリオを実行し、その後トレース、メトリクス、ログがエクスポートされたことをアサートします。エクスポートされたprotobufトレーススパンをデコードし、リリースクリティカルな形状をチェックします。
`openclaw.run`、`openclaw.harness.run`、最新のGenAIセマンティック規約モデル呼び出しスパン、`openclaw.context.assembled`、`openclaw.message.delivery` が存在している必要があります。このsmokeは
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、モデル呼び出しスパンは `{gen_ai.operation.name} {gen_ai.request.model}` 名を使用する必要があります。
成功したターンで、モデル呼び出しは `StreamAbandoned` をエクスポートしてはなりません。生の診断IDと
`openclaw.content.*` 属性はトレースに含めないでください。生のOTLPペイロードには、プロンプトセンチネル、レスポンスセンチネル、QAセッションキーが含まれていてはなりません。QAスイートアーティファクトの隣に `otel-smoke-summary.json` を書き出します。

コレクターを介したOpenTelemetry smokeには、次を実行します。

```bash
pnpm qa:otel:collector-smoke
```

このレーンは、同じローカルレシーバーの前段に実際のOpenTelemetry Collector Dockerコンテナを配置します。エンドポイント配線、コレクター互換性、またはインプロセスレシーバーでは隠れてしまう可能性があるOTLPエクスポート動作を変更する場合に使用してください。

保護されたPrometheusスクレイプsmokeには、次を実行します。

```bash
pnpm qa:prometheus:smoke
```

そのエイリアスは、`diagnostics-prometheus` を有効にして `docker-prometheus-smoke` QA シナリオを実行し、未認証のスクレイプが拒否されることを検証したうえで、認証済みスクレイプに、プロンプト内容、レスポンス内容、生の診断識別子、認証トークン、ローカルパスを含まず、リリース上重要なメトリクスファミリーが含まれていることを確認します。

両方の可観測性 smoke を続けて実行するには、次を使用します。

```bash
pnpm qa:observability:smoke
```

コレクターを使う OpenTelemetry レーンと、保護された Prometheus スクレイプ smoke を実行するには、次を使用します。

```bash
pnpm qa:observability:collector-smoke
```

可観測性 QA はソースチェックアウト専用です。npm tarball は意図的に QA Lab を省いているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断インストルメンテーションを変更する場合は、ビルド済みのソースチェックアウトから `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke` を使用します。

モデルプロバイダーの認証情報を必要としない、実際のトランスポートを使う Matrix smoke レーンでは、決定論的なモック OpenAI プロバイダーと fast プロファイルを実行します。

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

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクト配置は [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要としては、Docker 内に使い捨ての Tuwunel ホームサーバーをプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA Gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使用しません）、Markdown レポート、JSON サマリー、observed-events アーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き込みます。

シナリオは、ユニットテストではエンドツーエンドで証明できないトランスポート動作を対象にしています。メンションゲーティング、allow-bot ポリシー、許可リスト、トップレベル返信とスレッド返信、DM ルーティング、リアクション処理、受信編集の抑制、再起動時リプレイの重複排除、ホームサーバー中断からの回復、承認メタデータの配信、メディア処理、Matrix E2EE のブートストラップ/回復/検証フローです。E2EE CLI プロファイルでは、Gateway の返信を確認する前に、同じ使い捨てホームサーバーを通じて `openclaw matrix encryption setup` と検証コマンドも実行します。

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータスリアクションタイムラインには `--scenario discord-status-reactions-tool-only` を使用し、実際の Discord スレッドを作成して `message.thread-reply` が `filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment` を使用します。これらのシナリオは、広範な smoke カバレッジではなく前後比較の再現プローブであるため、デフォルトのライブ Discord レーンには含めません。QA 環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、スレッド添付 Mantis ワークフローはログイン済み Discord Web の証跡動画も追加できます。この viewer プロファイルは視覚的なキャプチャ専用です。合否判定は引き続き Discord REST oracle から行われます。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とデフォルトの手動実行では、QA 提供の live-frontier 認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使用して fast Matrix プロファイルを実行します。手動の `matrix_profile=all` は 5 つのプロファイルシャードにファンアウトします。

実際のトランスポートを使う Telegram、Discord、Slack、WhatsApp smoke レーンでは、次を使用します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

これらは、2 つのボットまたはアカウント（driver + SUT）を持つ既存の実チャンネルを対象にします。必須環境変数、シナリオ一覧、出力アーティファクト、Convex 認証情報プールについては、下の [Telegram、Discord、Slack、WhatsApp QA リファレンス](#telegram-discord-slack-and-whatsapp-qa-reference) に記載されています。

VNC レスキュー付きの完全な Slack デスクトップ VM 実行では、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox のデスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブレーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、動画キャプチャが利用可能な場合は `slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4` を Mantis のアーティファクトディレクトリへコピーします。Crabbox のデスクトップ/ブラウザリースはキャプチャツールとブラウザ/ネイティブビルドのヘルパーパッケージを事前に提供するため、このシナリオがフォールバックをインストールするのは古いリースの場合だけです。Mantis は合計およびフェーズごとのタイミングを `mantis-slack-desktop-smoke-report.md` に報告するため、低速な実行でリースのウォームアップ、認証情報の取得、リモートセットアップ、アーティファクトコピーのどこに時間がかかったかが分かります。VNC 経由で Slack Web に手動ログインした後は `--lease-id <cbx_...>` を再利用してください。再利用したリースでは Crabbox の pnpm ストアキャッシュも温存されます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内でインストール/ビルドを実行します。再利用したリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合にのみ `--hydrate-mode prehydrated` を使用してください。このモードは高コストなインストール/ビルド手順をスキップし、ワークスペースの準備ができていない場合は安全側に失敗します。`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack Gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、このコマンドは通常の bot-to-bot Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

デスクトップ証拠付きでネイティブ Slack 承認 UI を証明するには、Mantis の承認チェックポイントモードを実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と同時には使用できません。Slack 承認シナリオを実行し、承認以外のシナリオ ID を拒否し、各保留中および解決済みの承認状態で待機し、観測された Slack API メッセージを `approval-checkpoints/<scenario>-pending.png` と `approval-checkpoints/<scenario>-resolved.png` にレンダリングします。そのうえで、チェックポイント、メッセージ証拠、確認応答、レンダリング済みスクリーンショットのいずれかが欠落または空の場合は失敗します。コールド CI リースでは `slack-desktop-smoke.png` に Slack サインインが表示されることがあります。このレーンの視覚的証拠は承認チェックポイント画像です。

オペレーターチェックリスト、GitHub ワークフローディスパッチコマンド、証拠コメント契約、hydrate-mode 判定表、タイミングの解釈、失敗時の対処手順は [Mantis Slack デスクトップ Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV スタイルのデスクトップタスクでは、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` は Crabbox のデスクトップ/ブラウザマシンをリースまたは再利用し、`crabbox record --while` を開始し、ネストされた `visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き出します。`--expect-text` が設定されている場合、ビジョンプロンプトは構造化 JSON 判定を要求し、モデルが肯定的な可視証拠を報告した場合にのみパスします。対象テキストを単に引用するだけの否定応答はアサーションに失敗します。画像理解プロバイダーを呼び出さずに、デスクトップ、ブラウザ、スクリーンショット、動画の配管を証明するモデルなしスモークには `--vision-mode metadata` を使用します。録画は `visual-task` の必須アーティファクトです。Crabbox が空でない `visual-task.mp4` を録画しなかった場合、ビジュアルドライバーがパスしていてもタスクは失敗します。失敗時、タスクがすでにパスしていて `--keep-lease` が設定されていなかった場合を除き、Mantis は VNC 用にリースを保持します。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカー環境変数をチェックし、エンドポイント設定を検証し、maintainer シークレットが存在する場合は admin/list の到達性を確認します。シークレットについては設定済み/欠落の状態のみを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を考案するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、ライブトランスポートカバレッジマトリクスには含まれません。

ライブトランスポートランナーは、共有シナリオ ID、ベースラインカバレッジヘルパー、シナリオ選択ヘルパーを `openclaw/plugin-sdk/qa-live-transport-scenarios` からインポートする必要があります。

| レーン     | カナリア | メンションゲート | Bot-to-bot | Allowlist ブロック | トップレベル返信 | 引用返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

これにより、`qa-channel` は広範なプロダクト動作スイートのままにしつつ、Matrix、Telegram、その他のライブトランスポートが 1 つの明示的なトランスポート契約チェックリストを共有します。

Docker を QA パスに持ち込まずに使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。
ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。
ホストおよび Multipass のスイート実行では、デフォルトで分離された Gateway ワーカーを使って複数の選択済みシナリオを並列実行します。`qa-channel` のデフォルト同時実行数は 4 で、選択されたシナリオ数を上限とします。ワーカー数を調整するには `--concurrency <count>` を使用し、シリアル実行には `--concurrency 1` を使用します。
パーソナルアシスタントベンチマークパックを実行するには `--pack personal-agent` を使用します。パックセレクターは繰り返し指定した `--scenario` フラグと加算的に扱われます。明示的なシナリオが先に実行され、その後、重複を取り除いたパックシナリオがパック順に実行されます。
カスタム QA ランナーがすでに OpenTelemetry コレクターのセットアップを提供しており、OpenTelemetry と Prometheus の診断スモークシナリオをまとめて選択したい場合は、`--pack observability` を使用します。
いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用します。
ライブ実行では、ゲストで実用的なサポート済み QA 認証入力が転送されます。環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるよう、`--output-dir` はリポジトリルート配下にしてください。

## Telegram、Discord、Slack、WhatsApp QA リファレンス

Matrix はシナリオ数が多く、Docker ベースのホームサーバープロビジョニングを使うため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack、WhatsApp は既存の実在トランスポートに対して実行されるため、それらのリファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                            | 説明                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオのみを実行します。繰り返し指定できます。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、証跡、トランスポート固有のアーティファクト、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント ID です。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                   | プライマリ/代替モデル参照です。                                                                                                                   |
| `--fast`                              | オフ                                                | 対応している場合のプロバイダー高速モードです。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                 | `--credential-source convex` の場合に使用されるロールです。                                                                                                    |

いずれかのシナリオが失敗すると、各レーンはゼロ以外で終了します。`--allow-failures` は失敗の終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（ドライバー + SUT）を持つ 1 つの実在するプライベート Telegram グループを対象にします。SUT ボットには Telegram ユーザー名が必要です。両方のボットで `@BotFather` の **ボット間通信モード** が有効になっていると、ボット間の観測が最も安定します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値のチャット ID（文字列）。
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

暗黙のデフォルトセットは、常にカナリア、メンションゲーティング、ネイティブコマンド応答、コマンド宛先指定、ボット間グループ応答を対象にします。`mock-openai` のデフォルトには、決定論的な返信チェーンと最終メッセージのストリーミングチェックも含まれます。`telegram-current-session-status-tool` は、任意のネイティブコマンド応答の後ではなく、カナリアの直後にスレッド化された場合にのみ安定するため、引き続きオプトインです。現在のデフォルト/任意の分割とリグレッション参照を出力するには、`pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` を使用してください。

出力アーティファクト:

- `telegram-qa-report.md`
- `qa-evidence.json` - プロファイル、カバレッジ、プロバイダー、チャンネル、アーティファクト、結果、RTT フィールドを含む、ライブトランスポートチェックの証跡エントリ。

パッケージ Telegram 実行は同じ Telegram 認証情報契約を使用します。反復 RTT
測定は通常のパッケージ Telegram ライブレーンの一部です。RTT
分布は、選択された RTT チェックの `result.timing` の下で `qa-evidence.json` に組み込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、パッケージライブラッパーは
`kind: "telegram"` 認証情報をリースし、リースされたグループ/ドライバー/SUT ボットの
env をインストール済みパッケージ実行へエクスポートし、リースの Heartbeat を送り、シャットダウン時に
解放します。パッケージラッパーは、Convex が選択されている場合、CI 外では
`telegram-mentioned-message-reply` の RTT チェック 20 回、30 秒の RTT タイムアウト、Convex ロール
`maintainer` をデフォルトにします。別個の RTT コマンドや Telegram 固有のサマリー形式を
作成せずに RTT 測定を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または
`OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きしてください。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットを持つ 1 つの実在するプライベート Discord ギルドチャンネルを対象にします。1 つはハーネスが制御するドライバーボット、もう 1 つはバンドルされた Discord Plugin を通じて子 OpenClaw Gateway が起動する SUT ボットです。チャンネルメンション処理、SUT ボットが Discord にネイティブ `/help` コマンドを登録していること、オプトインの Mantis 証跡シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord が返す SUT ボットユーザー ID と一致している必要があります（一致しない場合、レーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内にメッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は `discord-voice-autojoin` 用の音声/ステージチャンネルを選択します。指定しない場合、シナリオは SUT ボットから見える最初の音声/ステージチャンネルを選びます。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオです。単独で実行され、`channels.discord.voice.autoJoin` を有効化し、SUT ボットの現在の Discord 音声状態が対象の音声/ステージチャンネルであることを検証します。Convex Discord 認証情報には任意の `voiceChannelId` を含められます。それ以外の場合、ランナーはギルド内で最初に見える音声/ステージチャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を `messages.statusReactions.enabled=true` による常時オンかつツール専用のギルド応答へ切り替えるため、単独で実行されます。その後、REST リアクションタイムラインと HTML/PNG 視覚アーティファクトをキャプチャします。Mantis の前後レポートでは、シナリオが提供する MP4 アーティファクトも `baseline.mp4` および `candidate.mp4` として保持します。

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
- `qa-evidence.json` - ライブトランスポートチェックの証跡エントリ。
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は墨消しされます。
- ステータスリアクションシナリオが実行された場合は、`discord-qa-reaction-timelines.json` および `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

2 つの異なるボットを持つ 1 つの実在するプライベート Slack チャンネルを対象にします。1 つはハーネスが制御するドライバーボット、もう 1 つはバンドルされた Slack Plugin を通じて子 OpenClaw Gateway が起動する SUT ボットです。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内にメッセージ本文を保持します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は Mantis 用の視覚的承認
  チェックポイントを有効にします。ランナーは `<scenario>.pending.json` と
  `<scenario>.resolved.json` を書き込み、その後、一致する `.ack.json` ファイルを待機します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` はチェックポイント
  確認応答タイムアウトを上書きします。デフォルトは `120000` です。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）:

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - オプトインのネイティブ Slack exec 承認シナリオです。
  Gateway を通じて exec 承認を要求し、Slack メッセージにネイティブ承認ボタンがあることを
  検証し、それを解決して、解決済みの Slack 更新を検証します。
- `slack-approval-plugin-native` - オプトインのネイティブ Slack Plugin 承認シナリオです。
  exec と Plugin 承認の転送を同時に有効化し、Plugin イベントが exec 承認ルーティングによって
  抑制されないようにしたうえで、同じ保留中/解決済みのネイティブ Slack UI パスを検証します。

出力アーティファクト:

- `slack-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証跡エントリ。
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文は墨消しされます。
- `approval-checkpoints/` - Mantis が
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` を設定した場合のみ。チェックポイント JSON、
  確認応答 JSON、保留中/解決済みスクリーンショットを含みます。

#### Slack ワークスペースの設定

このレーンには、1 つのワークスペース内に 2 つの異なる Slack アプリと、両方のボットがメンバーであるチャンネルが必要です。

- `channelId` - 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` ID。専用チャンネルを使用してください。このレーンは実行のたびに投稿します。
- `driverBotToken` - **ドライバー**アプリのボットトークン（`xoxb-...`）。
- `sutBotToken` - **SUT** アプリのボットトークン（`xoxb-...`）。ボットユーザー ID が異なるように、ドライバーとは別の Slack アプリである必要があります。
- `sutAppToken` - SUT アプリのアプリレベルトークン（`xapp-...`）。`connections:write` を持ち、SUT アプリがイベントを受信できるよう Socket Mode で使用されます。

本番ワークスペースを再利用するよりも、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を、ライブ Slack QA スイートでカバーされる権限とイベントへ意図的に絞っています。ユーザーが目にする本番チャンネルの設定については、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup)を参照してください。QA のドライバー/SUT ペアは、1 つのワークスペース内で 2 つの異なるボットユーザー ID が必要なため、意図的に分離されています。

**1. ドライバーアプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動し、_新しいアプリを作成_ → _マニフェストから_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから、_ワークスペースにインストール_ を選択します。

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

_Bot User OAuth Token_ (`xoxb-...`) をコピーします。これが `driverBotToken` になります。ドライバーに必要なのは、メッセージを投稿し、自分自身を識別することだけです。イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _新しいアプリを作成 → マニフェストから_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト (`extensions/slack/src/setup-shared.ts:10`) より狭いバージョンを意図的に使用します。ライブ Slack QA スイートはまだリアクション処理を対象にしていないため、リアクションのスコープとイベントは省略されています。

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

- _ワークスペースにインストール_ → _Bot User OAuth Token_ をコピー → それが `sutBotToken` になります。
- _基本情報 → アプリレベルトークン → トークンとスコープを生成_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → それが `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットが異なるユーザー ID を持つことを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。1 つのアプリを両方に再利用すると、メンションゲートで即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から両方のボットを招待します。

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_チャンネル情報 → 概要 → チャンネル ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。パブリックチャンネルで問題ありません。プライベートチャンネルを使用する場合でも、両方のアプリにはすでに `groups:history` があるため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

方法は 2 つあります。単一マシンでのデバッグには環境変数を使用します（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、共有 Convex プールにシードして、CI と他のメンテナーがリースできるようにします。

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

`count: 1`、`status: "active"`、`lease` フィールドなしを期待します。

**5. エンドツーエンドで検証する**

ブローカーを介して両方のボットが相互に通信できることを確認するため、レーンをローカルで実行します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

正常な実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` には `slack-canary` と `slack-mention-gating` の両方がステータス `pass` で表示されます。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空であるか、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらかを確認できます。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

2 つの専用 WhatsApp Web アカウントを対象にします。ハーネスが制御するドライバーアカウントと、バンドルされた WhatsApp Plugin を通じて子 OpenClaw Gateway が起動する SUT アカウントです。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

任意:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は、`whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、`whatsapp-broadcast-group-fanout`、`whatsapp-group-activation-always`、`whatsapp-group-reply-to-bot-triggers`、グループのアクション/メディア/投票シナリオ、`whatsapp-group-allowlist-block` などのグループシナリオを有効にします。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` は、observed-message アーティファクト内にメッセージ本文を保持します。

シナリオカタログ (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- ベースラインとグループゲート: `whatsapp-canary`、`whatsapp-pairing-block`、`whatsapp-mention-gating`、`whatsapp-group-pending-history-context`、`whatsapp-group-activation-always`、`whatsapp-group-reply-to-bot-triggers`、`whatsapp-top-level-reply-shape`、`whatsapp-restart-resume`、`whatsapp-group-allowlist-block`。
- ネイティブコマンド: `whatsapp-help-command`、`whatsapp-status-command`、`whatsapp-commands-command`、`whatsapp-tools-compact-command`、`whatsapp-whoami-command`、`whatsapp-context-command`、`whatsapp-native-new-command`。
- 返信と最終出力の動作: `whatsapp-tool-only-usage-footer`、`whatsapp-reply-to-message`、`whatsapp-group-reply-to-message`、`whatsapp-reply-to-mode-batched`、`whatsapp-reply-context-isolation`、`whatsapp-reply-delivery-shape`、`whatsapp-stream-final-message-accounting`。
- ユーザーパスのメッセージアクション: `whatsapp-agent-message-action-react` は、実際のドライバー DM から開始し、モデルに `message` ツールを呼び出させ、ネイティブ WhatsApp リアクションを観測します。`whatsapp-agent-message-action-upload-file` は、`message(action=upload-file)` に同じ姿勢を使用し、ネイティブ WhatsApp メディアを観測します。`whatsapp-group-agent-message-action-react` と `whatsapp-group-agent-message-action-upload-file` は、実際の WhatsApp グループで同じユーザー可視アクションを証明します。
- グループファンアウト: `whatsapp-broadcast-group-fanout` は、メンションされた 1 件の WhatsApp グループメッセージから開始し、`main` と `qa-second` から別々の可視返信があることを検証します。
- グループ有効化: `whatsapp-group-activation-always` は、実際のグループセッションを `/activation always` に変更し、メンションされていないグループメッセージがエージェントを起動することを証明してから、`/activation mention` に戻します。`whatsapp-group-reply-to-bot-triggers` は、ボット返信をシードし、明示的なメンションなしでそれに対するネイティブ引用返信を送信し、その返信コンテキストからエージェントが起動することを検証します。
- インバウンドメディアと構造化メッセージ: `whatsapp-inbound-image-caption`、`whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、`whatsapp-group-audio-gating`、`whatsapp-inbound-reaction-no-trigger`。これらは、実際の WhatsApp 画像、音声、ドキュメント、位置情報、連絡先、スタンプ、リアクションイベントをドライバー経由で送信します。
- 直接 Gateway 契約プローブ: `whatsapp-outbound-media-matrix`、`whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、`whatsapp-group-outbound-media`、`whatsapp-group-outbound-poll`、`whatsapp-message-actions`、`whatsapp-reply-context-isolation`、`whatsapp-reply-delivery-shape`。これらは意図的にモデルプロンプトを迂回し、決定論的な Gateway/チャンネルの `send`、`poll`、`message.action` 契約を証明します。
- アクセス制御カバレッジ: `whatsapp-access-control-dm-open`、`whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、`whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- ネイティブ承認: `whatsapp-approval-exec-deny-native`、`whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、`whatsapp-approval-exec-group-reaction-native`、`whatsapp-approval-plugin-native`。
- ステータスリアクション: `whatsapp-status-reactions`、`whatsapp-status-reaction-lifecycle`。

現在、カタログには 50 個のシナリオが含まれています。`live-frontier` のデフォルトレーンは、高速なスモークカバレッジのために 10 シナリオに小さく保たれています。`mock-openai` のデフォルトレーンは、モデル出力のみをモックしながら、実際の WhatsApp トランスポートを通じて 44 個の決定論的シナリオを実行します。承認シナリオと、いくつかの重い/ブロッキングチェックは、引き続きシナリオ ID による明示指定のままです。

WhatsApp QA ドライバーは、構造化されたライブイベント（`text`、`media`、`location`、`reaction`、`poll`）を観測し、メディア、投票、連絡先、位置情報、スタンプを能動的に送信できます。QA Lab は、プライベート WhatsApp ランタイムファイルに到達するのではなく、`@openclaw/whatsapp/api.js` パッケージサーフェスを通じてそのドライバーをインポートします。グループ観測では、`fromJid` はグループ JID であり、`participantJid` と `fromPhoneE164` が参加者送信者を識別します。メッセージ内容はデフォルトで編集されます。直接 Gateway の投票、upload-file、メディア、グループ投票、グループメディア、返信形状プローブは、トランスポート/API 契約チェックです。ユーザープロンプトによってエージェントが同じアクションを選んだことの証明としては扱われません。ユーザーパスのアクション証明は、`whatsapp-agent-message-action-react` や `whatsapp-group-agent-message-action-react` などのシナリオから得られます。そこでは、ドライバーが通常の WhatsApp メッセージを送信し、QA Lab が結果のネイティブ WhatsApp アーティファクトを観測します。WhatsApp レポートには、各シナリオの姿勢（`user-path`、`direct-gateway`、または `native-approval`）が含まれるため、実際に証明しているより強い契約であるとエビデンスを誤認することはありません。

出力アーティファクト:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリ。
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` でない限り、本文は編集されます。

### Convex 認証情報プール

Telegram、Discord、Slack、WhatsApp レーンは、上記の環境変数を読む代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat し、シャットダウン時に解放します。プール種別は `"telegram"`、`"discord"`、`"slack"`、`"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` は数値の chat-id 文字列である必要があります。
- Telegram 実ユーザー (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Mantis Telegram Desktop 証明専用です。汎用 QA Lab レーンはこの種類を取得してはいけません。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話番号は互いに異なる E.164 文字列である必要があります。

Mantis Telegram Desktop 証明ワークフローは、TDLib CLI ドライバーと Telegram Desktop
証人の両方に対して、排他的な Convex `telegram-user` リースを 1 つ保持し、
証明を公開した後に解放します。

PR に決定的な視覚差分が必要な場合、Mantis は Telegram フォーマッターまたは配信
レイヤーの変更中に、`main` と PR head で同じモックモデル応答を使用できます。
キャプチャのデフォルトは PR コメント向けに調整されています: 標準 Crabbox
クラス、24fps デスクトップ録画、24fps モーション GIF、1920px プレビュー幅です。
Before/after コメントでは、意図した GIF だけを含むクリーンなバンドルを公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形状チェックは現在、broker ではなく Slack QA runner にあります。`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用し、Slack チャンネル ID は `Cxxxxxxxxxx` のようにします。アプリとスコープのプロビジョニングについては、[Slack ワークスペースの設定](#setting-up-the-slack-workspace)を参照してください。

運用 env vars と Convex broker エンドポイント契約は、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1)にあります (このセクション名はマルチチャンネルプールより前のものです。リースセマンティクスは種類をまたいで共有されます)。

## リポジトリ由来のシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

これらは意図的に git に入っているため、QA 計画は人間と
agent の両方から見えます。

`qa-lab` は汎用 YAML シナリオ runner のままにする必要があります。各シナリオ YAML ファイルは
1 回のテスト実行の信頼できる情報源であり、次を定義する必要があります:

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意のカテゴリ、capability、lane、risk メタデータ
- `scenario` 内の docs と code refs
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の Gateway config patch
- フローシナリオ用の実行可能なトップレベル `flow`、または Vitest と Playwright シナリオ用の `scenario.execution.kind` /
  `scenario.execution.path`

`flow` を支える再利用可能なランタイム surface は、汎用かつ
横断的なままで構いません。たとえば、YAML シナリオは特別扱いの runner を追加せずに、Gateway `browser.request` seam を通じて埋め込み Control UI を操作する browser-side helper と、transport-side helper を組み合わせられます。

シナリオファイルはソースツリーのフォルダーではなく、プロダクト capability ごとにグループ化する必要があります。
ファイルを移動してもシナリオ ID は安定させ、実装の追跡可能性には `docsRefs` と `codeRefs` を使用してください。

ベースラインリストは、次をカバーできる十分な広さを保つ必要があります:

- DM とチャンネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- cron コールバック
- メモリ想起
- モデル切り替え
- subagent ハンドオフ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。リポジトリ由来 QA と parity gate 向けのデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、fixture、record/replay、chaos カバレッジ向けに AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオ dispatcher を置き換えません。

プロバイダーレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。
各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル config、
auth-profile staging の必要性、live/mock capability flags を所有します。共有 suite と
Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリ経由でルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は YAML QA シナリオ向けの汎用トランスポート seam を所有します。`qa-channel` は
合成デフォルトです。`crabline` はローカルのプロバイダー形状サーバーを起動し、
OpenClaw の通常のチャンネル Plugin をそれらに対して実行します。`live` は実際の
プロバイダー認証情報と外部チャンネル用に予約されています。

アーキテクチャレベルでは、分割は次のとおりです:

- `qa-lab` は汎用シナリオ実行、worker concurrency、artifact 書き込み、レポートを所有します。
- トランスポートアダプターは Gateway config、readiness、inbound と outbound の観測、transport actions、正規化された transport state を所有します。
- `qa/scenarios/` 配下の YAML シナリオファイルがテスト実行を定義し、`qa-lab` はそれらを実行する再利用可能な runtime surface を提供します。

### チャンネルの追加

YAML QA システムにチャンネルを追加するには、チャンネル実装と、
チャンネル契約を実行するシナリオパックが必要です。smoke CI カバレッジのために、
対応する Crabline ローカルプロバイダーサーバーを追加し、`crabline`
driver 経由で公開してください。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンド root を追加しないでください。

`qa-lab` は共有ホスト機構を所有します:

- `openclaw qa` コマンド root
- suite の起動と終了処理
- worker concurrency
- artifact 書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

Runner Plugin はトランスポート契約を所有します:

- `openclaw qa <runner>` を共有 `qa` root の下にマウントする方法
- そのトランスポート向けに gateway を構成する方法
- readiness をチェックする方法
- inbound event を注入する方法
- outbound message を観測する方法
- transcripts と正規化された transport state を公開する方法
- transport-backed actions を実行する方法
- transport 固有の reset または cleanup を処理する方法

新しいチャンネルの最小採用基準:

1. `qa-lab` を共有 `qa` root の所有者として保つ。
2. 共有 `qa-lab` ホスト seam 上に transport runner を実装する。
3. トランスポート固有の機構は runner Plugin またはチャンネル harness 内に保つ。
4. 競合する root command を登録する代わりに、runner を `openclaw qa <runner>` としてマウントする。Runner Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列を export する必要があります。`runtime-api.ts` は軽く保ち、lazy CLI と runner 実行は別の entrypoint の背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で YAML シナリオを作成または適合させる。
6. 新しいシナリオには汎用シナリオ helper を使用する。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です:

- 動作を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置く。
- 動作が 1 つのチャンネルトランスポートに依存する場合は、その runner Plugin または Plugin harness 内に保つ。
- シナリオが複数のチャンネルで使用できる新しい capability を必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用 helper を追加する。
- 動作が 1 つのトランスポートに対してのみ意味を持つ場合は、シナリオを transport-specific に保ち、それをシナリオ契約で明示する。

### シナリオ helper 名

新しいシナリオで推奨される汎用 helper:

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

既存シナリオ向けには互換エイリアス - `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` - が引き続き利用できますが、新しいシナリオ作成では汎用名を使用する必要があります。これらのエイリアスは、一斉移行を避けるために存在しており、今後のモデルとして存在しているわけではありません。

## レポート

`qa-lab` は観測された bus timeline から Markdown プロトコルレポートを export します。
レポートは次に答える必要があります:

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のある follow-up シナリオは何か

利用可能なシナリオの一覧には、follow-up 作業の規模見積もりや新しいトランスポートの配線に有用な `pnpm openclaw qa coverage` を実行します (機械可読出力には `--json` を追加)。
触れた動作またはファイルパスに対する重点的な証明を選ぶ場合は、`pnpm openclaw qa coverage --match <query>` を実行します。
match レポートは、シナリオメタデータ、docs refs、code refs、coverage IDs、Plugin、provider requirements を検索し、一致する `qa suite --scenario ...` ターゲットを出力します。
すべての `qa suite` 実行は、選択された
シナリオセットに対してトップレベルの `qa-evidence.json`、
`qa-suite-summary.json`、`qa-suite-report.md` artifact を書き込みます。
`execution.kind: vitest` または
`execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、
シナリオごとのログも書き込みます。`execution.kind: script` を宣言するシナリオは、
`execution.path` の evidence producer を `node --import tsx` 経由で実行します (`execution.args` 内の
`${outputDir}` と `${scenarioId}` は展開されます)。producer は独自の `qa-evidence.json` を書き込み、その entries は suite
output に取り込まれ、artifact paths はその producer の
`qa-evidence.json` からの相対として解決されます。`qa suite` が
`qa run --qa-profile` 経由で到達された場合、同じ `qa-evidence.json` には選択された taxonomy categories の profile
scorecard summary も含まれます。
これは gate の代替ではなく discovery aid として扱ってください。選択されたシナリオには、テスト対象の動作に適した provider mode、live transport、Multipass、Testbox、または release lane が依然として必要です。
scorecard の文脈については、[成熟度 scorecard](/ja-JP/maturity/scorecard)を参照してください。

character と style のチェックでは、同じシナリオを複数の live model
refs に対して実行し、judged Markdown レポートを書き込みます:

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター評価シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行します。候補モデルには、評価されていることを知らせないでください。このコマンドは各完全なトランスクリプトを保持し、基本的な実行統計を記録した後、対応している場合は `xhigh` reasoning を使った fast mode で judge モデルに依頼し、自然さ、雰囲気、ユーモアで実行をランク付けします。プロバイダーを比較する場合は `--blind-judge-models` を使用します。judge プロンプトには引き続きすべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付けます。
候補実行の既定は `high` thinking で、GPT-5.5 では `medium`、それをサポートする古い OpenAI 評価参照では `xhigh` です。特定の候補は `--model provider/model,thinking=<level>` でインライン上書きします。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI 候補参照は既定で fast mode になり、プロバイダーが対応している場合は priority processing が使用されます。単一の候補または judge に上書きが必要な場合は、`,fast`、`,no-fast`、または `,fast=false` をインラインで追加します。すべての候補モデルで fast mode を強制したい場合にのみ `--fast` を渡します。候補と judge の所要時間はベンチマーク分析のためにレポートへ記録されますが、judge プロンプトでは速度でランク付けしないよう明示しています。
候補と judge モデルの実行はいずれも既定で concurrency 16 です。プロバイダー制限またはローカル Gateway の負荷によって実行のノイズが大きくなりすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、キャラクター評価の既定は、`--model` が渡されないときに `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、および `google/gemini-3.1-pro-preview` になります。
`--judge-model` が渡されない場合、judge の既定は `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-8,thinking=high` です。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [個人エージェントベンチマークパック](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA Channel](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [Dashboard](/ja-JP/web/dashboard)
