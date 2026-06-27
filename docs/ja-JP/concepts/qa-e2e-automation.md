---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリ backed QA シナリオの追加
    - Gateway ダッシュボードを中心に、より現実に近い QA 自動化を構築する
summary: 'QA スタック概要: qa-lab、qa-channel、リポジトリに裏付けられたシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート作成。'
title: QA 概要
x-i18n:
    generated_at: "2026-06-27T11:15:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストよりも現実的で、
チャネルに即した形で OpenClaw を動作確認するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、編集、削除のサーフェスを持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、インバウンドメッセージの注入、Markdown レポートのエクスポートを行うデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来の runner plugins: 子 QA gateway 内で実チャネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用のリポジトリ管理シードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザスクリーンショット、VM 状態、PR エビデンスが必要なバグの修正前後ライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあり、どちらの形式もサポートされます。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | `--qa-profile` なしの同梱 QA セルフチェック。`--qa-profile smoke-ci`、`--qa-profile release`、または `--qa-profile all` を使う、タクソノミーに基づく成熟度プロファイル runner。                                                                                                      |
| `qa suite`                                          | QA gateway レーンに対してリポジトリ管理シナリオを実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                                                                                                                  |
| `qa coverage`                                       | YAML シナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                                                                                                               |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較してエージェント型パリティレポートを書き込むか、`--runtime-axis --token-efficiency` を使って 1 つの runtime-pair サマリーから Codex-vs-OpenClaw runtime パリティとトークン効率レポートを書き込みます。                                         |
| `qa character-eval`                                 | 複数のライブモデルにまたがってキャラクター QA シナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                                                                                                                                            |
| `qa manual`                                         | 選択された provider/model レーンに対して単発プロンプトを実行します。                                                                                                                                                                                                          |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 事前構築済み QA Docker イメージをビルドします。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                                                                                                                                    |
| `qa up`                                             | QA サイトをビルドし、Docker バックエンドのスタックを起動して URL を出力します（エイリアス: `pnpm qa:lab:up`。`:fast` 版は `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                                                  |
| `qa aimock`                                         | AIMock provider サーバーだけを起動します。                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` provider サーバーだけを起動します。                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                               |
| `qa matrix`                                         | 使い捨て Tuwunel homeserver に対するライブトランスポートレーンです。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                                                                                                                      |
| `qa telegram`                                       | 実在のプライベート Telegram グループに対するライブトランスポートレーンです。                                                                                                                                                                                                              |
| `qa discord`                                        | 実在のプライベート Discord guild チャネルに対するライブトランスポートレーンです。                                                                                                                                                                                                       |
| `qa slack`                                          | 実在のプライベート Slack チャネルに対するライブトランスポートレーンです。                                                                                                                                                                                                               |
| `qa whatsapp`                                       | 実在の WhatsApp Web アカウントに対するライブトランスポートレーンです。                                                                                                                                                                                                                 |
| `qa mantis`                                         | Discord ステータスリアクションエビデンス、Crabbox デスクトップ/ブラウザ smoke、Slack-in-VNC smoke を含む、ライブトランスポートバグ用の修正前後検証 runner です。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) を参照してください。 |

プロファイルに基づく `qa run` は `taxonomy.yaml` からメンバーシップを読み込み、解決済みシナリオを
`qa suite` 経由でディスパッチします。`--surface` と
`--category` は、別レーンを定義するのではなく、選択されたプロファイルをフィルターします。
生成される `qa-evidence.json` には、選択カテゴリ数と欠落カバレッジ ID を含むプロファイルスコアカードサマリーが含まれます。個々のエビデンス
エントリは、テスト、カバレッジロール、結果に関する信頼できる情報源のままです。
タクソノミー機能カバレッジ ID は正確な証明ターゲットであり、エイリアスではありません。プライマリ
シナリオカバレッジは一致する ID を満たします。セカンダリカバレッジは参考情報のままです。
カバレッジ ID は、小文字の英数字/ダッシュセグメントを持つドット区切りの `namespace.behavior` 形式を使用します。プロファイル、サーフェス、カテゴリ ID は、既存のダッシュ区切りまたはドット区切りのタクソノミー ID を引き続き使用できます。
スリムエビデンスはエントリごとの `execution` を省略し、`evidenceMode: "slim"` を設定します。
`smoke-ci` はデフォルトで slim になり、`--evidence-mode full` は完全なエントリを復元します。

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

モックモデル provider と Crabline 偽 provider サーバーによる決定論的なプロファイル証明には `smoke-ci` を使用してください。
ライブチャネルに対する Stable/LTS 証明には `release` を使用してください。`all` は明示的な全タクソノミーエビデンス実行にのみ使用してください。これはすべてのアクティブな成熟度カテゴリを選択し、`qa_profile=all` を指定した `QA Profile
Evidence` workflow 経由でディスパッチできます。コマンドに OpenClaw
root プロファイルも必要な場合は、QA コマンドの前に root プロファイルを置きます。

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード (Control UI)。
- 右: Slack風のトランスクリプトとシナリオ計画を表示する QA Lab。

次のコマンドで実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker バックエンドの gateway レーンを起動し、オペレーターまたは自動化ループがエージェントに QA
ミッションを与え、実際のチャネル動作を観察し、成功したこと、失敗したこと、ブロックされたままのことを記録できる QA Lab ページを公開します。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより速く反復するには、
bind mount された QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上に維持し、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナに bind mount します。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザが自動リロードされます。

ローカル OpenTelemetry シグナル smoke には、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP receiver を起動し、`diagnostics-otel` plugin を有効にして `otel-trace-smoke` QA
シナリオを実行し、trace、
metrics、logs がエクスポートされることをアサートします。エクスポートされた protobuf trace spans
をデコードし、リリースクリティカルな形状をチェックします。
`openclaw.run`、`openclaw.harness.run`、最新の GenAI セマンティックコンベンション
model-call span、`openclaw.context.assembled`、`openclaw.message.delivery`
が存在している必要があります。この smoke は
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` を強制するため、model-call
span は `{gen_ai.operation.name} {gen_ai.request.model}` 名を使用する必要があります。
成功したターンでの model calls は `StreamAbandoned` をエクスポートしてはなりません。raw diagnostic IDs と
`openclaw.content.*` 属性は trace に含めないでください。raw OTLP
payloads はプロンプトセンチネル、レスポンスセンチネル、QA セッション
キーを含んではなりません。QA suite artifacts の隣に `otel-smoke-summary.json` を書き込みます。

collector バックエンドの OpenTelemetry smoke には、次を実行します。

```bash
pnpm qa:otel:collector-smoke
```

このレーンは、同じローカル receiver の前に実際の OpenTelemetry Collector Docker コンテナを配置します。エンドポイント配線、collector
互換性、またはインプロセス receiver では隠れてしまう可能性がある OTLP エクスポート動作を変更するときに使用してください。

保護された Prometheus scrape smoke には、次を実行します。

```bash
pnpm qa:prometheus:smoke
```

そのエイリアスは、`diagnostics-prometheus` を有効にして `docker-prometheus-smoke` QAシナリオを実行し、未認証のスクレイプが拒否されることを検証してから、認証済みスクレイプにリリース上重要なメトリクスファミリーが含まれ、プロンプト内容、応答内容、生の診断識別子、認証トークン、ローカルパスが含まれていないことを確認します。

両方のオブザーバビリティスモークを連続して実行するには、次を使用します。

```bash
pnpm qa:observability:smoke
```

コレクターを使う OpenTelemetry レーンと、保護された Prometheus スクレイプスモークを実行するには、次を使用します。

```bash
pnpm qa:observability:collector-smoke
```

オブザーバビリティ QA はソースチェックアウト専用です。npm tarball は意図的に QA Lab を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断インストルメンテーションを変更するときは、ビルド済みのソースチェックアウトから `pnpm qa:otel:smoke`、`pnpm qa:prometheus:smoke`、または `pnpm qa:observability:smoke` を使用します。

モデルプロバイダーの資格情報を必要としない、実トランスポートの Matrix スモークレーンでは、決定論的なモック OpenAI プロバイダーを使う高速プロファイルを実行します。

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

live-frontier プロバイダーレーンでは、OpenAI 互換の資格情報を明示的に指定します。

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクト配置は [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要としては、Docker 内に使い捨ての Tuwunel homeserver をプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix Plugin を実行し（`qa-channel` なし）、Markdown レポート、JSON サマリー、観測イベントアーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き込みます。

シナリオは、単体テストではエンドツーエンドで証明できないトランスポート動作を対象にします。mention gating、allow-bot ポリシー、allowlist、トップレベル返信とスレッド返信、DM ルーティング、リアクション処理、インバウンド編集の抑制、再起動時の replay dedupe、homeserver 中断からの復旧、承認メタデータ配信、メディア処理、Matrix E2EE の bootstrap/recovery/verification フローです。E2EE CLI プロファイルは、Gateway 返信を確認する前に、同じ使い捨て homeserver を通じて `openclaw matrix encryption setup` と検証コマンドも実行します。

Discord には、バグ再現用の Mantis 専用 opt-in シナリオもあります。明示的なステータスリアクションのタイムラインには `--scenario discord-status-reactions-tool-only` を使用し、実際の Discord スレッドを作成して `message.thread-reply` が `filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment` を使用します。これらのシナリオは、広範なスモークカバレッジではなく前後比較の再現プローブであるため、デフォルトの live Discord レーンには含めません。QA 環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、thread-attachment Mantis ワークフローはログイン済み Discord Web の witness 動画も追加できます。この viewer プロファイルは視覚キャプチャ専用であり、合否判定は引き続き Discord REST oracle から取得します。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とデフォルトの手動実行は、QA が提供する live-frontier 資格情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使って高速 Matrix プロファイルを実行します。手動の `matrix_profile=all` は、5 つのプロファイルシャードへファンアウトします。

実トランスポートの Telegram、Discord、Slack、WhatsApp スモークレーンでは、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

これらは、2 つの bot またはアカウント（driver + SUT）を持つ既存の実チャンネルを対象にします。必要な環境変数、シナリオ一覧、出力アーティファクト、Convex 資格情報プールは、下記の [Telegram、Discord、Slack、WhatsApp QA リファレンス](#telegram-discord-slack-and-whatsapp-qa-reference) に記載されています。

VNC レスキュー付きの完全な Slack デスクトップ VM 実行では、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack live レーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、動画キャプチャが利用可能な場合は `slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4` を Mantis アーティファクトディレクトリへコピーします。Crabbox デスクトップ/ブラウザのリースは、キャプチャツールとブラウザ/native-build ヘルパーパッケージを事前に提供するため、このシナリオがフォールバックをインストールするのは古いリースの場合だけです。Mantis は `mantis-slack-desktop-smoke-report.md` に合計およびフェーズ別の時間を報告するため、遅い実行で時間がリースのウォームアップ、資格情報取得、リモートセットアップ、アーティファクトコピーのどこに使われたかが分かります。VNC 経由で Slack Web に手動ログインした後は、`--lease-id <cbx_...>` を再利用します。再利用されたリースでは Crabbox の pnpm store cache も温存されます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内で install/build を実行します。`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合にのみ使用します。このモードは高コストな install/build ステップをスキップし、ワークスペースの準備ができていない場合は fail closed します。`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack Gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、このコマンドは通常の bot-to-bot Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

デスクトップ証拠付きでネイティブ Slack 承認 UI を証明するには、Mantis 承認チェックポイントモードを実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

このモードは `--gateway-setup` と相互排他的です。Slack 承認シナリオを実行し、非承認シナリオ ID を拒否し、各 pending および resolved 承認状態で待機し、観測された Slack API メッセージを `approval-checkpoints/<scenario>-pending.png` と `approval-checkpoints/<scenario>-resolved.png` にレンダリングし、いずれかのチェックポイント、メッセージ証拠、acknowledgement、またはレンダリング済みスクリーンショットが欠落または空の場合に失敗します。コールド CI リースでは `slack-desktop-smoke.png` に Slack サインインが表示される場合があります。このレーンの視覚証拠は承認チェックポイント画像です。

オペレーターチェックリスト、GitHub workflow dispatch コマンド、証拠コメント契約、hydrate-mode 判断表、タイミング解釈、失敗処理手順は [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV スタイルのデスクトップタスクでは、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` は Crabbox デスクトップ/ブラウザマシンをリースまたは再利用し、`crabbox record --while` を開始し、ネストされた `visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き込みます。`--expect-text` が設定されている場合、vision prompt は構造化 JSON verdict を要求し、モデルが肯定的な可視証拠を報告した場合にのみ成功します。対象テキストを引用するだけの否定応答はアサーションに失敗します。画像理解プロバイダーを呼び出さずにデスクトップ、ブラウザ、スクリーンショット、動画の配管を証明する no-model スモークには、`--vision-mode metadata` を使用します。記録は `visual-task` の必須アーティファクトです。Crabbox が空でない `visual-task.mp4` を記録しない場合、visual driver が成功していてもタスクは失敗します。失敗時、タスクがすでに成功していて `--keep-lease` が設定されていない場合を除き、Mantis は VNC 用にリースを保持します。

プールされた live 資格情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex broker 環境を確認し、endpoint 設定を検証し、maintainer secret が存在する場合は admin/list の到達性を検証します。secret については set/missing 状態のみを報告します。

## Live transport coverage

live transport レーンは、それぞれが独自のシナリオリスト形状を発明するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成 product-behavior suite であり、live transport coverage matrix の一部ではありません。

live transport runner は、共有シナリオ ID、baseline coverage helper、scenario-selection helper を `openclaw/plugin-sdk/qa-live-transport-scenarios` から import する必要があります。

| レーン     | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Quote reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

これにより、`qa-channel` は広範な product-behavior suite のまま維持され、Matrix、Telegram、その他の live transport は 1 つの明示的な transport-contract チェックリストを共有します。

QA パスに Docker を持ち込まない使い捨て Linux VM レーンでは、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。ホストおよび Multipass の suite 実行は、デフォルトで隔離された Gateway worker により、選択された複数のシナリオを並列実行します。`qa-channel` はデフォルトで同時実行数 4 となり、選択されたシナリオ数で上限がかかります。worker 数を調整するには `--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。パーソナルアシスタント benchmark pack を実行するには、`--pack personal-agent` を使用します。pack selector は、繰り返し指定された `--scenario` フラグに対して加算的です。明示的なシナリオが先に実行され、その後に重複を除去した pack シナリオが pack 順で実行されます。カスタム QA runner がすでに OpenTelemetry collector setup を提供しており、OpenTelemetry と Prometheus の診断スモークシナリオを一緒に選択したい場合は、`--pack observability` を使用します。いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は、`--allow-failures` を使用します。live 実行は、ゲストで実用的なサポート済み QA auth 入力を転送します。env ベースのプロバイダーキー、QA live provider config path、存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルートの下に置いてください。

## Telegram、Discord、Slack、WhatsApp QA リファレンス

Matrix はシナリオ数と Docker バックのホームサーバープロビジョニングがあるため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack、WhatsApp は既存の実際のトランスポートに対して実行されるため、リファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                | デフォルト                                       | 説明                                                                                                                                 |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | このシナリオだけを実行します。繰り返し指定できます。                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | レポート、サマリー、エビデンス、トランスポート固有のアーティファクト、出力ログを書き込む場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                    | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | QA Gateway 設定内の一時アカウント ID です。                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                                            |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                   | プライマリ/代替モデル参照です。                                                                                                                   |
| `--fast`                              | オフ                                                | 対応している場合のプロバイダー高速モードです。                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                                          |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                 | `--credential-source convex` の場合に使うロールです。                                                                                                    |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（ドライバー + SUT）を持つ、実際のプライベート Telegram グループ 1 つを対象にします。SUT ボットには Telegram ユーザー名が必要です。両方のボットで `@BotFather` の **Bot-to-Bot Communication Mode** が有効になっていると、ボット間の観測が最もよく機能します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値チャット ID（文字列）。
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

暗黙のデフォルトセットは、canary、メンションゲーティング、ネイティブコマンド返信、コマンド宛先指定、ボット間グループ返信を常にカバーします。`mock-openai` のデフォルトには、決定的な返信チェーンと最終メッセージストリーミングのチェックも含まれます。`telegram-current-session-status-tool` は、任意のネイティブコマンド返信の後ではなく、canary の直後にスレッド化された場合にのみ安定するため、引き続きオプトインです。回帰参照付きで現在のデフォルト/任意の分割を出力するには、`pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` を使います。

出力アーティファクト:

- `telegram-qa-report.md`
- `qa-evidence.json` - プロファイル、カバレッジ、プロバイダー、チャンネル、アーティファクト、結果、RTT フィールドを含む、ライブトランスポートチェックのエビデンスエントリ。

パッケージ Telegram 実行は、同じ Telegram 認証情報契約を使います。反復 RTT
測定は通常のパッケージ Telegram ライブレーンの一部です。RTT
分布は、選択された RTT チェックの `result.timing` の下で
`qa-evidence.json` に組み込まれます。

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

`OPENCLAW_QA_CREDENTIAL_SOURCE=convex` が設定されている場合、パッケージライブラッパーは
`kind: "telegram"` 認証情報をリースし、リースされたグループ/ドライバー/SUT ボット
env をインストール済みパッケージ実行にエクスポートし、リースの Heartbeat を行い、シャットダウン時に
解放します。パッケージラッパーは、Convex が選択された場合、CI 外では
`telegram-mentioned-message-reply` の RTT チェック 20 回、30 秒の RTT タイムアウト、Convex ロール
`maintainer` をデフォルトにします。別の RTT コマンドや Telegram 固有のサマリー形式を
作成せずに RTT 測定を調整するには、`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`、
`OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`、または
`OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` を上書きします。

### Discord QA

```bash
pnpm openclaw qa discord
```

ハーネスが制御するドライバーボットと、バンドルされた Discord Plugin を通じて子 OpenClaw Gateway によって起動される SUT ボットの 2 つのボットを持つ、実際のプライベート Discord ギルドチャンネル 1 つを対象にします。チャンネルメンションの処理、SUT ボットが Discord にネイティブ `/help` コマンドを登録済みであること、オプトインの Mantis エビデンスシナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord が返す SUT ボットユーザー ID と一致している必要があります（一致しない場合、このレーンは早期に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は `discord-voice-autojoin` の音声/ステージチャンネルを選択します。指定しない場合、シナリオは SUT ボットから見える最初の音声/ステージチャンネルを選択します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオです。単独で実行され、`channels.discord.voice.autoJoin` を有効にし、SUT ボットの現在の Discord 音声状態が対象の音声/ステージチャンネルであることを検証します。Convex Discord 認証情報には任意の `voiceChannelId` を含めることができます。ない場合、ランナーはギルド内で最初に見える音声/ステージチャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を `messages.statusReactions.enabled=true` の常時オン、ツール専用ギルド返信に切り替えるため単独で実行され、その後 REST リアクションタイムラインと HTML/PNG ビジュアルアーティファクトを取得します。Mantis の before/after レポートでは、シナリオ提供の MP4 アーティファクトも `baseline.mp4` と `candidate.mp4` として保持します。

Discord 音声自動参加シナリオを明示的に実行します:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Mantis ステータスリアクションシナリオを明示的に実行します:

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
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリ。
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り本文は編集されます。
- ステータスリアクションシナリオが実行された場合の `discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

ハーネスが制御するドライバーボットと、バンドルされた Slack Plugin を通じて子 OpenClaw Gateway によって起動される SUT ボットの 2 つの異なるボットを持つ、実際のプライベート Slack チャンネル 1 つを対象にします。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` は Mantis のビジュアル承認
  チェックポイントを有効にします。ランナーは `<scenario>.pending.json` と
  `<scenario>.resolved.json` を書き込み、その後対応する `.ack.json` ファイルを待ちます。
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` はチェックポイント
  確認タイムアウトを上書きします。デフォルトは `120000` です。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`）:

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - オプトインのネイティブ Slack exec 承認シナリオです。
  Gateway を通じて exec 承認を要求し、Slack メッセージにネイティブ承認ボタンがあることを検証し、
  それを解決して、解決済みの Slack 更新を検証します。
- `slack-approval-plugin-native` - オプトインのネイティブ Slack Plugin 承認シナリオです。
  exec と Plugin 承認の転送を同時に有効にし、Plugin イベントが
  exec 承認ルーティングによって抑制されないようにしてから、同じ pending/resolved
  ネイティブ Slack UI パスを検証します。

出力アーティファクト:

- `slack-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックのエビデンスエントリ。
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り本文は編集されます。
- `approval-checkpoints/` - Mantis が
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` を設定した場合のみ。チェックポイント JSON、
  確認 JSON、pending/resolved スクリーンショットを含みます。

#### Slack ワークスペースの設定

このレーンには、1 つのワークスペース内に 2 つの異なる Slack アプリと、両方のボットがメンバーになっているチャンネルが必要です。

- `channelId` - 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` ID です。専用チャンネルを使ってください。このレーンは実行ごとに投稿します。
- `driverBotToken` - **Driver** アプリのボットトークン（`xoxb-...`）。
- `sutBotToken` - **SUT** アプリのボットトークン（`xoxb-...`）。そのボットユーザー ID が異なるように、ドライバーとは別の Slack アプリである必要があります。
- `sutAppToken` - SUT アプリの `connections:write` を持つアプリレベルトークン（`xapp-...`）。SUT アプリがイベントを受信できるように Socket Mode で使われます。

本番ワークスペースを再利用するより、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を、ライブ Slack QA スイートでカバーされる権限とイベントに意図的に絞っています。ユーザーが見る本番チャンネル設定については、[Slack チャンネルのクイック設定](/ja-JP/channels/slack#quick-setup)を参照してください。QA Driver/SUT ペアは、このレーンが 1 つのワークスペース内に 2 つの異なるボットユーザー ID を必要とするため、意図的に分離されています。

**1. Driver アプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動し、_Create New App_ → _From a manifest_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから _Install to Workspace_ を実行します。

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

_Bot User OAuth Token_（`xoxb-...`）をコピーします。これが `driverBotToken` になります。ドライバーに必要なのは、メッセージを投稿して自身を識別することだけです。イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト（`extensions/slack/src/setup-shared.ts:10`）を意図的に狭くしたバージョンを使用します。ライブ Slack QA スイートはまだリアクション処理を対象にしていないため、リアクションのスコープとイベントは省略されています。

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

各トークンで `auth.test` を呼び出して、2 つのボットが異なるユーザー ID を持つことを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。両方に同じアプリを再利用すると、メンションゲートですぐに失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から両方のボットを招待します。

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。パブリックチャンネルで動作します。プライベートチャンネルを使う場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

方法は 2 つあります。単一マシンでのデバッグには環境変数を使用します（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、共有 Convex プールにシードして、CI と他のメンテナーがリースできるようにします。

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

ブローカー経由で両方のボットが互いに通信できることを確認するため、レーンをローカルで実行します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功した実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` では `slack-canary` と `slack-mention-gating` の両方がステータス `pass` になります。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空か、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらかが分かります。

### WhatsApp QA

```bash
pnpm openclaw qa whatsapp
```

2 つの専用 WhatsApp Web アカウントを対象にします。1 つはハーネスによって制御されるドライバーアカウントで、もう 1 つはバンドルされた WhatsApp Plugin を通じて子 OpenClaw Gateway によって起動される SUT アカウントです。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

任意:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` は `whatsapp-mention-gating` や `whatsapp-group-allowlist-block` などのグループシナリオを有効にします。
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` は observed-message アーティファクト内にメッセージ本文を保持します。

シナリオカタログ（`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`）:

- ベースラインとグループゲート: `whatsapp-canary`、`whatsapp-pairing-block`、`whatsapp-mention-gating`、`whatsapp-top-level-reply-shape`、`whatsapp-restart-resume`、`whatsapp-group-allowlist-block`。
- ネイティブコマンド: `whatsapp-help-command`、`whatsapp-status-command`、`whatsapp-commands-command`、`whatsapp-tools-compact-command`、`whatsapp-whoami-command`、`whatsapp-context-command`、`whatsapp-native-new-command`。
- 返信と最終出力の挙動: `whatsapp-tool-only-usage-footer`、`whatsapp-reply-to-message`、`whatsapp-group-reply-to-message`、`whatsapp-reply-context-isolation`、`whatsapp-reply-delivery-shape`、`whatsapp-stream-final-message-accounting`。
- 受信メディアと構造化メッセージ: `whatsapp-inbound-image-caption`、`whatsapp-audio-preflight`、`whatsapp-inbound-structured-messages`、`whatsapp-group-audio-gating`。これらは実際の WhatsApp の画像、音声、ドキュメント、位置情報、連絡先、ステッカーのイベントをドライバー経由で送信します。
- 送信 Gateway とメッセージアクションのカバレッジ: `whatsapp-outbound-media-matrix`、`whatsapp-outbound-document-preserves-filename`、`whatsapp-outbound-poll`、`whatsapp-message-actions`。
- アクセス制御のカバレッジ: `whatsapp-access-control-dm-open`、`whatsapp-access-control-dm-disabled`、`whatsapp-access-control-group-open`、`whatsapp-access-control-group-disabled`、`whatsapp-group-allowlist-block`。
- ネイティブ承認: `whatsapp-approval-exec-deny-native`、`whatsapp-approval-exec-native`、`whatsapp-approval-exec-reaction-native`、`whatsapp-approval-plugin-native`。
- ステータスリアクション: `whatsapp-status-reactions`。

カタログには現在 36 個のシナリオが含まれています。`live-frontier` のデフォルトレーンは、高速なスモークカバレッジのために 10 シナリオに小さく保たれています。`mock-openai` のデフォルトレーンは、モデル出力だけをモックしながら、実際の WhatsApp トランスポートを通じて 31 個の決定的シナリオを実行します。承認シナリオと、いくつかの重いチェックまたはブロック系チェックは、シナリオ ID による明示指定のままです。

WhatsApp QA ドライバーは、構造化されたライブイベント（`text`、`media`、`location`、`reaction`、`poll`）を監視し、メディア、投票、連絡先、位置情報、ステッカーを能動的に送信できます。QA Lab は、プライベートな WhatsApp ランタイムファイルに直接アクセスする代わりに、`@openclaw/whatsapp/api.js` パッケージサーフェスを通じてそのドライバーをインポートします。メッセージ内容はデフォルトで伏せられます。送信投票と upload-file のカバレッジは、モデルプロンプトのみのツール呼び出しではなく、決定的な Gateway の `poll` と `message.action` 呼び出しを通じて実行されます。

出力アーティファクト:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - ライブトランスポートチェックの証拠エントリ。
- `whatsapp-qa-observed-messages.json` - `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` でない限り本文は伏せられます。

### Convex 認証情報プール

Telegram、Discord、Slack、WhatsApp レーンは、上記の環境変数を読み取る代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat を送信し、シャットダウン時に解放します。プール種別は `"telegram"`、`"discord"`、`"slack"`、`"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` は数値のチャット ID 文字列である必要があります。
- Telegram 実ユーザー（`kind: "telegram-user"`）: `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Mantis Telegram Desktop 証拠専用です。汎用 QA Lab レーンはこの種別を取得してはいけません。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp（`kind: "whatsapp"`）: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話番号は異なる E.164 文字列である必要があります。

Mantis Telegram Desktop 証拠ワークフローは、TDLib CLI ドライバーと Telegram Desktop 証人の両方に対して 1 つの排他的 Convex `telegram-user` リースを保持し、証拠を公開した後に解放します。

PR に決定的なビジュアル差分が必要な場合、Mantis は Telegram フォーマッターまたは配信レイヤーの変更中に、`main` と PR head の両方で同じモックモデル返信を使用できます。キャプチャのデフォルトは PR コメント向けに調整されています。標準 Crabbox クラス、24fps デスクトップ録画、24fps モーション GIF、1920px プレビュー幅です。Before/after コメントでは、意図した GIF だけを含むクリーンなバンドルを公開する必要があります。

Slack レーンもプールを使用できます。Slack ペイロード形状のチェックは、現在ブローカーではなく Slack QA ランナー内にあります。`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用し、`Cxxxxxxxxxx` のような Slack チャンネル ID を指定します。アプリとスコープのプロビジョニングについては、[Slack ワークスペースのセットアップ](#setting-up-the-slack-workspace) を参照してください。

運用環境変数と Convex ブローカーエンドポイント契約は、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります（セクション名はマルチチャンネルプールより前のものです。リースセマンティクスは種別間で共有されています）。

## リポジトリ backed シード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

これらは意図的に git に含まれているため、QA 計画は人間とエージェントの両方に見えます。

`qa-lab` は汎用 YAML シナリオランナーのままであるべきです。各シナリオ YAML ファイルは 1 回のテスト実行の信頼できる情報源であり、次を定義する必要があります。

- トップレベルの `title`
- `scenario` メタデータ
- `scenario` 内の任意の category、capability、lane、risk メタデータ
- `scenario` 内の docs と code refs
- `scenario` 内の任意の Plugin 要件
- `scenario` 内の任意の Gateway config パッチ
- フローシナリオ用の実行可能なトップレベル `flow`、または Vitest と Playwright シナリオ用の `scenario.execution.kind` / `scenario.execution.path`

`flow` を支える再利用可能なランタイムサーフェスは、汎用的かつ横断的なままで構いません。たとえば、YAML シナリオでは、特別なランナーを追加せずに、Gateway の `browser.request` seam を通じて埋め込み Control UI を操作するブラウザー側ヘルパーと、トランスポート側ヘルパーを組み合わせられます。

シナリオファイルは、ソースツリーのフォルダーではなく、プロダクト機能ごとにグループ化する必要があります。ファイルを移動してもシナリオ ID は安定させてください。実装の追跡可能性には `docsRefs` と `codeRefs` を使用します。

ベースラインリストは、次をカバーできる十分な広さを保つ必要があります。

- DM とチャンネルチャット
- スレッドの動作
- メッセージアクションのライフサイクル
- Cron コールバック
- メモリーリコール
- モデル切り替え
- サブエージェントへのハンドオフ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります。

- `mock-openai` は、シナリオ対応の OpenClaw モックです。リポジトリに基づく QA とパリティゲートのための、デフォルトの決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために、AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、認証プロファイルのステージング要件、live/mock 機能フラグを所有します。共有スイートと Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを通じてルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は、YAML QA シナリオ用の汎用トランスポート seam を所有します。`qa-channel` は合成デフォルトです。`crabline` はローカルのプロバイダー形状のサーバーを起動し、それらに対して OpenClaw の通常のチャンネル Plugin を実行します。`live` は実際のプロバイダー資格情報と外部チャンネル用に予約されています。

アーキテクチャレベルでは、分割は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、ワーカー並行処理、アーティファクト書き込み、レポートを所有します。
- トランスポートアダプターは、Gateway 設定、準備状態、インバウンドおよびアウトバウンドの観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の YAML シナリオファイルはテスト実行を定義し、`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

YAML QA システムにチャンネルを追加するには、チャンネル実装に加えて、チャンネル契約を実行するシナリオパックが必要です。スモーク CI カバレッジには、対応する Crabline フェイクプロバイダーサーバーを追加し、`crabline` ドライバーを通じて公開します。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並行処理
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ用の互換エイリアス

ランナー Plugin はトランスポート契約を所有します。

- `openclaw qa <runner>` を共有 `qa` ルート配下にマウントする方法
- そのトランスポート用に Gateway を設定する方法
- 準備状態を確認する方法
- インバウンドイベントを注入する方法
- アウトバウンドメッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに基づくアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャンネルの最小採用基準:

1. 共有 `qa` ルートの所有者を `qa-lab` のままにします。
2. 共有 `qa-lab` ホスト seam 上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは、ランナー Plugin またはチャンネルハーネス内に保ちます。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントします。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別のエントリーポイントの背後に置く必要があります。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で YAML シナリオを作成または適合させます。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続けます。

判断ルールは厳格です。

- 動作を `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 動作が 1 つのチャンネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネス内に保ちます。
- シナリオが複数のチャンネルで使える新しい機能を必要とする場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- 動作が 1 つのトランスポートでのみ意味を持つ場合は、シナリオをトランスポート固有のままにし、それをシナリオ契約で明示します。

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

既存シナリオ向けに互換エイリアス `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` は引き続き利用できますが、新しいシナリオ作成では汎用名を使用する必要があります。これらのエイリアスは、一斉移行を避けるために存在しており、今後のモデルとして存在しているわけではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。レポートは次に答える必要があります。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のあるフォローアップシナリオは何か

利用可能なシナリオのインベントリには、フォローアップ作業の見積もりや新しいトランスポートの配線に役立つ `pnpm openclaw qa coverage` を実行します（機械可読出力には `--json` を追加します）。
触れた動作またはファイルパスの集中証明を選ぶ場合は、`pnpm openclaw qa coverage --match <query>` を実行します。
マッチレポートは、シナリオメタデータ、ドキュメント参照、コード参照、カバレッジ ID、Plugin、プロバイダー要件を検索し、一致する `qa suite --scenario ...` ターゲットを出力します。
すべての `qa suite` 実行は、選択されたシナリオセットについて、トップレベルの `qa-evidence.json`、`qa-suite-summary.json`、`qa-suite-report.md` アーティファクトを書き込みます。`execution.kind: vitest` または `execution.kind: playwright` を宣言するシナリオは、対応するテストパスを実行し、シナリオごとのログも書き込みます。`execution.kind: script` を宣言するシナリオは、`node --import tsx` を通じて `execution.path` のエビデンスプロデューサーを実行します（`execution.args` 内の `${outputDir}` と `${scenarioId}` は展開されます）。プロデューサーは独自の `qa-evidence.json` を書き込み、そのエントリはスイート出力にインポートされ、そのアーティファクトパスはそのプロデューサーの `qa-evidence.json` からの相対パスとして解決されます。`qa suite` が `qa run --qa-profile` を通じて到達された場合、同じ `qa-evidence.json` には、選択された分類カテゴリのプロファイルスコアカード概要も含まれます。
これは発見支援として扱い、ゲートの代替として扱わないでください。選択したシナリオには、テスト対象の動作に応じた適切なプロバイダーモード、ライブトランスポート、Multipass、Testbox、またはリリースレーンが引き続き必要です。
スコアカードのコンテキストについては、[成熟度スコアカード](/ja-JP/maturity/scorecard) を参照してください。

文字とスタイルのチェックでは、同じシナリオを複数の live モデル参照で実行し、判定済み Markdown レポートを書き込みます。

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

このコマンドは、Docker ではなくローカル QA Gateway 子プロセスを実行します。文字評価シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、評価されていることを伝えてはいけません。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録した後、対応している場合は `xhigh` 推論を使った fast モードで判定モデルに依頼し、自然さ、雰囲気、ユーモアで実行をランク付けします。
プロバイダーを比較する場合は `--blind-judge-models` を使用します。判定プロンプトにはすべてのトランスクリプトと実行ステータスが引き続き渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付けます。
候補実行はデフォルトで `high` thinking を使用し、GPT-5.5 では `medium`、それをサポートする古い OpenAI eval 参照では `xhigh` を使用します。特定の候補は `--model provider/model,thinking=<level>` でインライン上書きします。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI 候補参照はデフォルトで fast モードになり、プロバイダーが対応している場合は優先処理が使用されます。単一の候補または判定に上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加します。すべての候補モデルで fast モードを強制したい場合にのみ、`--fast` を渡してください。候補と判定の所要時間はベンチマーク分析のためにレポートに記録されますが、判定プロンプトには速度でランク付けしないよう明示されます。
候補モデル実行と判定モデル実行はいずれもデフォルトで並行数 16 です。プロバイダー制限またはローカル Gateway 負荷によって実行がノイズ過多になる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、文字評価は `openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-8`、`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、`moonshot/kimi-k2.5`、および `google/gemini-3.1-pro-preview` をデフォルトにします。
`--judge-model` が渡されない場合、判定は `openai/gpt-5.5,thinking=xhigh,fast` と `anthropic/claude-opus-4-8,thinking=high` をデフォルトにします。

## 関連ドキュメント

- [マトリックス QA](/ja-JP/concepts/qa-matrix)
- [成熟度スコアカード](/ja-JP/maturity/scorecard)
- [パーソナルエージェントベンチマークパック](/ja-JP/concepts/personal-agent-benchmark-pack)
- [QA Channel](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
