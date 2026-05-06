---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリベースの QA シナリオの追加
    - Gateway ダッシュボードを中心に、より実運用に近い QA 自動化を構築する
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリに基づくシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート作成。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-06T05:02:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベートQAスタックは、単一の単体テストよりも現実に近い、チャネルの形に沿った方法で OpenClaw を検証するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャンネル、スレッド、
  リアクション、編集、削除の面を持つ合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、
  インバウンドメッセージの注入、Markdown レポートのエクスポートを行うデバッガーUIとQAバス。
- `extensions/qa-matrix`、将来のランナーPlugin: 子QA Gateway 内で実際のチャネルを
  駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースラインQA
  シナリオ用の、リポジトリに裏付けられたシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザスクリーンショット、
  VM状態、PR証拠を必要とするバグのための、ライブ検証の前後比較。

## コマンド面

すべてのQAフローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされたQA自己チェック。Markdown レポートを書き込みます。                                                                                                                                                                                                                        |
| `qa suite`                                          | QA Gateway レーンに対して、リポジトリに裏付けられたシナリオを実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                                                                                                                  |
| `qa coverage`                                       | Markdown シナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                                                                                                           |
| `qa parity-report`                                  | 2つの `qa-suite-summary.json` ファイルを比較し、エージェント型パリティレポートを書き込みます。                                                                                                                                                                                          |
| `qa character-eval`                                 | 複数のライブモデルにまたがってキャラクターQAシナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                                                                                                                                            |
| `qa manual`                                         | 選択されたプロバイダー/モデルレーンに対して、単発のプロンプトを実行します。                                                                                                                                                                                                          |
| `qa ui`                                             | QAデバッガーUIとローカルQAバスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 事前焼き込み済みのQA Docker イメージをビルドします。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QAダッシュボード + Gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                                                                                                                                    |
| `qa up`                                             | QAサイトをビルドし、Docker に裏付けられたスタックを起動し、URLを出力します（エイリアス: `pnpm qa:lab:up`。`:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                                                  |
| `qa aimock`                                         | AIMock プロバイダーサーバーだけを起動します。                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーだけを起動します。                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                               |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                                                                                                                      |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                                              |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャンネルに対するライブトランスポートレーン。                                                                                                                                                                                                       |
| `qa slack`                                          | 実際のプライベート Slack チャンネルに対するライブトランスポートレーン。                                                                                                                                                                                                               |
| `qa mantis`                                         | ライブトランスポートバグ向けの前後比較検証ランナー。Discord ステータスリアクション証拠、Crabbox デスクトップ/ブラウザスモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook) を参照してください。 |

## オペレーターフロー

現在のQAオペレーターフローは、2ペインのQAサイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack 風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これはQAサイトをビルドし、Docker に裏付けられた Gateway レーンを起動し、
オペレーターまたは自動化ループがエージェントにQAミッションを与え、
実際のチャネル動作を観察し、何が動作し、失敗し、または
ブロックされたままだったかを記録できる QA Lab ページを公開します。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより速く反復するには、
bind マウントされた QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージのままにし、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナへ bind マウントします。`qa:lab:watch` は
変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` Plugin を有効にした `otel-trace-smoke` QA シナリオを実行し、その後
エクスポートされた protobuf span をデコードして、リリース上重要な形をアサートします:
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
モデル呼び出しは、成功したターンで `StreamAbandoned` をエクスポートしてはなりません。生の診断IDと
`openclaw.content.*` 属性はトレースに含まれてはいけません。これは
QA suite アーティファクトの隣に `otel-smoke-summary.json` を書き込みます。

Observability QA はソースチェックアウト専用のままです。npm tarball は意図的に
QA Lab を省略しているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。
診断インストルメンテーションを変更する場合は、ビルド済みのソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

トランスポートが実物の Matrix スモークレーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全なCLIリファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel ホームサーバーをプロビジョニングし、一時的なドライバー/SUT/オブザーバーユーザーを登録し、そのトランスポートにスコープされた子QA Gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使いません）、その後 Markdown レポート、JSON サマリー、観測イベントアーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き込みます。

シナリオは、単体テストではエンドツーエンドに証明できないトランスポート動作をカバーします: メンションゲート、allow-bot ポリシー、許可リスト、トップレベル返信とスレッド返信、DM ルーティング、リアクション処理、インバウンド編集の抑制、再起動リプレイ重複排除、ホームサーバー中断からの復旧、承認メタデータ配信、メディア処理、Matrix E2EE ブートストラップ/復旧/検証フロー。E2EE CLI プロファイルは、Gateway 返信をチェックする前に、同じ使い捨てホームサーバーを通じて `openclaw matrix encryption setup` と検証コマンドも駆動します。

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータスリアクション
タイムラインには `--scenario discord-status-reactions-tool-only` を使用し、
実際の Discord スレッドを作成して `message.thread-reply` が
`filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment` を使用します。
これらのシナリオは、広範なスモークカバレッジではなく前後比較の再現プローブであるため、
デフォルトのライブ Discord レーンには含めません。
スレッド添付 Mantis ワークフローは、QA
環境に `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、ログイン済み Discord Web
証人動画を追加することもできます。そのビューアープロファイルは視覚キャプチャ専用です。合否
判断は引き続き Discord REST オラクルから得られます。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンド面を使用します。スケジュール実行とデフォルトの手動実行は、ライブ frontier 認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使って高速 Matrix プロファイルを実行します。手動の `matrix_profile=all` は5つのプロファイルシャードに分散されるため、網羅的なカタログを並列実行しながら、各シャードにつき1つのアーティファクトディレクトリを維持できます。

トランスポートが実物の Telegram、Discord、Slack スモークレーンには、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

これらは2つのbot（ドライバー + SUT）を持つ既存の実チャネルを対象にします。必要な環境変数、シナリオ一覧、出力アーティファクト、Convex 認証情報プールは、下の [Telegram、Discord、Slack QA リファレンス](#telegram-discord-and-slack-qa-reference) に記載されています。

完全な Slack デスクトップ VM 実行を VNC レスキュー付きで行うには、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox デスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブレーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、動画キャプチャが利用可能な場合は `slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4` を Mantis アーティファクトディレクトリへコピーします。Crabbox のデスクトップ/ブラウザリースでは、キャプチャツールとブラウザ/ネイティブビルド用ヘルパーパッケージが最初から提供されるため、シナリオがフォールバックをインストールするのは古いリースの場合だけです。Mantis は `mantis-slack-desktop-smoke-report.md` に合計およびフェーズごとの所要時間を報告するため、遅い実行で時間がリースのウォームアップ、認証情報の取得、リモートセットアップ、アーティファクトコピーのどこに費やされたかが分かります。VNC 経由で Slack Web に手動ログインした後は `--lease-id <cbx_...>` を再利用してください。再利用されたリースでは Crabbox の pnpm ストアキャッシュも暖かい状態に保たれます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内でインストール/ビルドを実行します。再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合のみ、`--hydrate-mode prehydrated` を使用してください。このモードは高コストなインストール/ビルド手順をスキップし、ワークスペースの準備ができていない場合は安全側で失敗します。`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack Gateway を VM 内のポート `38973` で実行したままにします。指定しない場合、コマンドは通常のボット間 Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

オペレーターチェックリスト、GitHub ワークフローディスパッチコマンド、証拠コメントの契約、hydrate モード判断表、タイミングの解釈、失敗処理の手順は [Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV スタイルのデスクトップタスクを実行するには、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` は Crabbox デスクトップ/ブラウザマシンをリースまたは再利用し、`crabbox record --while` を開始し、ネストされた `visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き出します。`--expect-text` が設定されている場合、ビジョンプロンプトは構造化 JSON 判定を求め、モデルが肯定的な可視証拠を報告した場合にのみ合格します。対象テキストを単に引用するだけの否定的な応答はアサーションに失敗します。画像理解プロバイダーを呼び出さずに、デスクトップ、ブラウザ、スクリーンショット、動画の配管を証明するモデルなしスモークには `--vision-mode metadata` を使用してください。録画は `visual-task` の必須アーティファクトです。Crabbox が空でない `visual-task.mp4` を記録しなかった場合、ビジュアルドライバーが合格していてもタスクは失敗します。失敗時、タスクがすでに合格していて `--keep-lease` が設定されていない場合を除き、Mantis は VNC 用にリースを保持します。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカー環境を確認し、エンドポイント設定を検証し、メンテナーシークレットが存在する場合は admin/list の到達性を検証します。シークレットについては設定済み/未設定の状態だけを報告します。

## ライブトランスポートのカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を発明するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、ライブトランスポートカバレッジマトリックスには含まれません。

| レーン   | Canary | Mention gating | Bot-to-bot | Allowlist block | Top-level reply | Restart resume | Thread follow-up | Thread isolation | Reaction observation | Help command | Native command registration |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持され、Matrix、Telegram、今後のライブトランスポートは 1 つの明示的なトランスポート契約チェックリストを共有します。

QA パスに Docker を持ち込まずに使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。ホストおよび Multipass のスイート実行では、デフォルトで、選択された複数のシナリオを分離された Gateway ワーカーで並列実行します。`qa-channel` のデフォルト同時実行数は 4 で、選択されたシナリオ数が上限です。ワーカー数を調整するには `--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。いずれかのシナリオが失敗すると、コマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用してください。ライブ実行では、ゲストで実用的なサポート済み QA 認証入力が転送されます。具体的には、env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペースを通じて書き戻せるように、`--output-dir` はリポジトリルート配下に置いてください。

## Telegram、Discord、Slack QA リファレンス

Matrix はシナリオ数と Docker ベースのホームサーバープロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix) があります。Telegram、Discord、Slack はより小さく、それぞれ少数のシナリオで、プロファイルシステムはなく、既存の実チャンネルを対象とするため、リファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                | デフォルト                                                    | 説明                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                             | このシナリオだけを実行します。繰り返し指定できます。                                                                  |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | レポート/サマリー/観測メッセージと出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。           |
| `--repo-root <path>`                  | `process.cwd()`                                               | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                 |
| `--sut-account <id>`                  | `sut`                                                         | QA Gateway 設定内の一時アカウント ID です。                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                               | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                               |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                      | プライマリ/代替モデル参照です。                                                                                       |
| `--fast`                              | オフ                                                          | サポートされている場合のプロバイダー高速モードです。                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                         | [Convex 認証情報プール](#convex-credential-pool) を参照してください。                                                  |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                        | `--credential-source convex` の場合に使用されるロールです。                                                           |

各レーンは、失敗したシナリオが 1 つでもあると非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なるボット（ドライバー + SUT）を持つ実際のプライベート Telegram グループ 1 つを対象にします。SUT ボットには Telegram ユーザー名が必要です。両方のボットで `@BotFather` の **ボット間通信モード** が有効になっていると、ボット間観測が最もよく機能します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します（デフォルトでは編集されます）。

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
- `telegram-qa-summary.json` - canary から始まる返信ごとの RTT（ドライバー送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り、本文は編集されます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つのボットを持つ実際のプライベート Discord ギルドチャンネル 1 つを対象にします。1 つはハーネスによって制御されるドライバーボットで、もう 1 つはバンドルされた Discord Plugin を通じて子 OpenClaw Gateway によって開始される SUT ボットです。チャンネルメンション処理、SUT ボットが Discord にネイティブ `/help` コマンドを登録していること、オプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT ボットユーザー ID と一致する必要があります（一致しない場合、レーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は観測メッセージアーティファクトにメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を常時有効でツール専用のギルド返信に切り替え、`messages.statusReactions.enabled=true` を設定してから、REST リアクションタイムラインと HTML/PNG ビジュアルアーティファクトをキャプチャするため、単独で実行されます。Mantis の before/after レポートは、シナリオが提供する MP4 アーティファクトも `baseline.mp4` と `candidate.mp4` として保持します。

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
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は墨消しされます。
- status-reaction シナリオが実行された場合は、`discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

1 つの実際の非公開 Slack チャンネルを対象にし、2 つの別個のボットを使います。ハーネスが制御するドライバーボットと、子 OpenClaw Gateway が同梱の Slack Plugin を通じて起動する SUT ボットです。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は observed-message アーティファクトにメッセージ本文を保持します。

シナリオ (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

出力アーティファクト:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文は墨消しされます。

#### Slack ワークスペースの設定

このレーンには、1 つのワークスペース内に 2 つの別個の Slack アプリと、両方のボットがメンバーであるチャンネルが必要です:

- `channelId` - 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` ID。専用チャンネルを使ってください。このレーンは実行のたびに投稿します。
- `driverBotToken` - **Driver** アプリのボットトークン (`xoxb-...`)。
- `sutBotToken` - **SUT** アプリのボットトークン (`xoxb-...`)。ドライバーとは別の Slack アプリである必要があります。そうすることで、ボットユーザー ID が別になります。
- `sutAppToken` - SUT アプリの `connections:write` を持つアプリレベルトークン (`xapp-...`)。Socket Mode で使われ、SUT アプリがイベントを受信できるようにします。

本番ワークスペースを再利用するよりも、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、ライブ Slack QA スイートでカバーされる権限とイベントに合わせて、同梱の Slack Plugin の本番インストール (`extensions/slack/src/setup-shared.ts:10`) を意図的に絞っています。ユーザーが見る本番チャンネルの設定については、[Slack チャンネルのクイック設定](/ja-JP/channels/slack#quick-setup) を参照してください。QA Driver/SUT ペアは、1 つのワークスペース内に 2 つの別個のボットユーザー ID が必要なため、意図的に分けられています。

**1. Driver アプリを作成する**

[api.slack.com/apps](https://api.slack.com/apps) に移動し、_Create New App_ → _From a manifest_ → QA ワークスペースを選択し、次のマニフェストを貼り付けてから _Install to Workspace_ を実行します:

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

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリは、同梱の Slack Plugin の本番マニフェスト (`extensions/slack/src/setup-shared.ts:10`) をより狭くしたバージョンを意図的に使います。ライブ Slack QA スイートはまだリアクション処理をカバーしていないため、リアクションのスコープとイベントは省略されています。

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

Slack がアプリを作成したら、設定ページで次の 2 つを行います:

- _Install to Workspace_ → _Bot User OAuth Token_ をコピー → これが `sutBotToken` になります。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → これが `sutAppToken` になります。

各トークンで `auth.test` を呼び出し、2 つのボットのユーザー ID が異なることを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。両方に同じアプリを再利用すると、mention-gating が即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネルを作成し (例: `#openclaw-qa`)、チャンネル内から両方のボットを招待します:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。公開チャンネルで問題ありません。非公開チャンネルを使う場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには環境変数を使います (4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します)。または、CI と他のメンテナーがリースできるように、共有 Convex プールへシードします。

Convex プールの場合は、4 つのフィールドを JSON ファイルへ書き込みます:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` をエクスポートしたうえで、登録して確認します:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなしを期待します。

**5. エンドツーエンドで確認する**

両方のボットがブローカーを通じて相互に会話できることを確認するため、レーンをローカルで実行します:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

グリーンの実行は 30 秒を十分に下回る時間で完了し、`slack-qa-report.md` では `slack-canary` と `slack-mention-gating` の両方が status `pass` になります。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空であるか、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらかが分かります。

### Convex 認証情報プール

Telegram、Discord、Slack のレーンは、上記の環境変数を読む代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します (または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します)。QA Lab は排他的リースを取得し、実行中は Heartbeat を送り、シャットダウン時に解放します。プール種別は `"telegram"`、`"discord"`、`"slack"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` は数値の chat-id 文字列である必要があります。
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` は `^[A-Z][A-Z0-9]+$` (例: `Cxxxxxxxxxx` のような Slack ID) に一致する必要があります。アプリとスコープのプロビジョニングについては、[Slack ワークスペースの設定](#setting-up-the-slack-workspace) を参照してください。

運用環境変数と Convex ブローカーエンドポイント契約は、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります (セクション名は Discord 対応より前のものです。ブローカーのセマンティクスは両方の種別で同一です)。

## リポジトリベースのシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に入っているため、QA 計画は人間とエージェントの両方に見えます。

`qa-lab` は汎用的な markdown ランナーであり続けるべきです。各シナリオ markdown ファイルは、1 回のテスト実行に対する信頼できる情報源であり、次を定義するべきです:

- シナリオメタデータ
- 任意のカテゴリ、機能、レーン、リスクメタデータ
- ドキュメント参照とコード参照
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用的かつ横断的なままで構いません。たとえば、markdown シナリオでは、トランスポート側ヘルパーとブラウザー側ヘルパーを組み合わせ、Gateway の `browser.request` 境界を通じて埋め込み Control UI を操作できます。専用ケースのランナーを追加する必要はありません。

シナリオファイルは、ソースツリーフォルダーではなく製品機能ごとにグループ化するべきです。ファイルを移動してもシナリオ ID は安定させてください。実装の追跡可能性には `docsRefs` と `codeRefs` を使います。

ベースラインリストは、次をカバーできるだけ十分に広く保つべきです:

- DM とチャンネルチャット
- スレッドの挙動
- メッセージアクションのライフサイクル
- cron コールバック
- メモリ想起
- モデル切り替え
- サブエージェントの引き継ぎ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` は、シナリオを認識する OpenClaw モックです。これは、リポジトリベース QA とパリティゲートのデフォルトの決定論的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル設定、auth-profile ステージング要件、ライブ/モック機能フラグを所有します。共有スイートと Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを通じてルーティングするべきです。

## トランスポートアダプター

`qa-lab` は markdown QA シナリオ向けの汎用トランスポート境界を所有します。`qa-channel` はその境界上の最初のアダプターですが、設計対象はもっと広いです。将来の実チャンネルまたは合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じスイートランナーへ接続するべきです。

アーキテクチャレベルでは、分割は次のとおりです:

- `qa-lab` は、汎用シナリオ実行、ワーカー並行処理、アーティファクト書き込み、レポートを所有します。
- トランスポートアダプターは、Gateway 設定、準備状態、受信と送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の markdown シナリオファイルがテスト実行を定義します。`qa-lab` は、それらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

markdown QA システムへチャンネルを追加するには、正確に次の 2 つが必要です:

1. チャンネル用のトランスポートアダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホスト機構を所有します:

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカーの並行実行
- アーティファクトの書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin がトランスポート契約を所有します。

- `openclaw qa <runner>` を共有 `qa` ルート配下にマウントする方法
- そのトランスポート向けに Gateway を構成する方法
- 準備完了を確認する方法
- インバウンドイベントを注入する方法
- アウトバウンドメッセージを監視する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに裏付けられたアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャネルの最小導入基準:

1. 共有 `qa` ルートの所有者は `qa-lab` のままにする。
2. 共有 `qa-lab` ホストの継ぎ目にトランスポートランナーを実装する。
3. トランスポート固有の仕組みはランナー Plugin またはチャネルハーネス内に保つ。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントする。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別のエントリポイントの背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使用する。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できるなら、`qa-lab` に置く。
- 振る舞いが 1 つのチャネルトランスポートに依存するなら、そのランナー Plugin または Plugin ハーネス内に保つ。
- シナリオに複数のチャネルで使える新しい機能が必要なら、`suite.ts` にチャネル固有の分岐を追加するのではなく、汎用ヘルパーを追加する。
- 振る舞いが 1 つのトランスポートでのみ意味を持つなら、シナリオをトランスポート固有のままにし、そのことをシナリオ契約で明示する。

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

既存シナリオ向けに互換エイリアス `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` は引き続き利用できますが、新しいシナリオ作成では汎用名を使用してください。エイリアスは一斉移行を避けるために存在するものであり、今後のモデルではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次に答える必要があります。

- 動作したこと
- 失敗したこと
- ブロックされたままだったこと
- 追加する価値があるフォローアップシナリオ

利用可能なシナリオのインベントリを確認するには、つまりフォローアップ作業の規模を見積もる場合や新しいトランスポートを接続する場合に便利な一覧として、`pnpm openclaw qa coverage` を実行します（機械可読の出力には `--json` を追加）。

文字とスタイルのチェックでは、同じシナリオを複数のライブモデル
参照に対して実行し、判定済みの Markdown レポートを書き込みます。

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

このコマンドは Docker ではなく、ローカル QA Gateway の子プロセスを実行します。文字評価
シナリオでは、`SOUL.md` を通じてペルソナを設定し、その後チャット、ワークスペースの支援、小さなファイルタスクなどの通常のユーザーターンを実行します。候補モデルには、評価されていることを伝えないでください。このコマンドは各完全
トランスクリプトを保持し、基本的な実行統計を記録したうえで、対応している場合は高速モードかつ
`xhigh` 推論で判定モデルに依頼し、自然さ、雰囲気、ユーモアで実行をランク付けします。
プロバイダーを比較する場合は `--blind-judge-models` を使用します。判定プロンプトには引き続き
すべてのトランスクリプトと実行ステータスが渡されますが、候補参照は
`candidate-01` のような中立ラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付けます。
候補実行はデフォルトで `high` thinking になり、GPT-5.5 では `medium`、それに対応する古い OpenAI 評価参照では `xhigh`
になります。特定の候補は
`--model provider/model,thinking=<level>` でインライン上書きできます。`--thinking <level>` は引き続き
グローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は
互換性のために保持されます。
OpenAI 候補参照は、プロバイダーが対応している場合に優先処理が使われるよう、デフォルトで高速モードになります。
単一の候補または判定モデルに上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加します。
すべての候補モデルで高速モードを強制したい場合にのみ `--fast` を渡してください。候補と判定の所要時間は
ベンチマーク分析用にレポートへ記録されますが、判定プロンプトでは速度でランク付けしないよう明示します。
候補モデル実行と判定モデル実行はいずれもデフォルトで並行数 16 です。プロバイダー制限やローカル Gateway
の負荷により実行のノイズが大きすぎる場合は、
`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、文字評価はデフォルトで
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` になります。
`--judge-model` が渡されない場合、判定モデルはデフォルトで
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` になります。

## 関連ドキュメント

- [マトリックス QA](/ja-JP/concepts/qa-matrix)
- [QA チャネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
