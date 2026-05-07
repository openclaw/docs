---
read_when:
    - QAスタックの全体像を理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリに基づくQAシナリオの追加
    - Gateway ダッシュボードを中心とした、より現実に近い QA 自動化の構築
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリに基づくシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート作成。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-07T13:16:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一の単体テストよりも現実的で、
チャンネル形状に近い方法で OpenClaw を検証するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャンネル、スレッド、
  リアクション、編集、削除のサーフェスを持つ合成メッセージチャンネル。
- `extensions/qa-lab`: トランスクリプトの観測、
  受信メッセージの注入、Markdown レポートのエクスポートを行うデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来のランナー Plugin: 子 QA gateway 内の実チャンネルを駆動する
  ライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA
  シナリオのためのリポジトリ管理のシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザスクリーンショット、VM 状態、PR エビデンスが必要なバグに対する
  ライブ検証の前後確認。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドルされた QA セルフチェック。Markdown レポートを書き込みます。                                                                                                                                                                                                                        |
| `qa suite`                                          | リポジトリ管理のシナリオを QA gateway レーンに対して実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                                                                                                                  |
| `qa coverage`                                       | Markdown のシナリオカバレッジインベントリを出力します（機械出力には `--json`）。                                                                                                                                                                                           |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント的パリティレポートを書き込みます。                                                                                                                                                                                          |
| `qa character-eval`                                 | 判定付きレポートで、複数のライブモデルに対してキャラクター QA シナリオを実行します。[レポート](#reporting)を参照してください。                                                                                                                                                            |
| `qa manual`                                         | 選択されたプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                                                                                                          |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 事前焼き込み済み QA Docker イメージをビルドします。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き込みます。                                                                                                                                                                                                    |
| `qa up`                                             | QA サイトをビルドし、Docker バックのスタックを起動し、URL を出力します（エイリアス: `pnpm qa:lab:up`; `:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加します）。                                                                                                  |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                               |
| `qa matrix`                                         | 使い捨て Tuwunel ホームサーバーに対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                                                                                                                      |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                                              |
| `qa discord`                                        | 実際のプライベート Discord ギルドチャンネルに対するライブトランスポートレーン。                                                                                                                                                                                                       |
| `qa slack`                                          | 実際のプライベート Slack チャンネルに対するライブトランスポートレーン。                                                                                                                                                                                                               |
| `qa mantis`                                         | ライブトランスポートのバグ向けの前後検証ランナー。Discord ステータスリアクションのエビデンス、Crabbox デスクトップ/ブラウザスモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook)を参照してください。 |

## オペレーターのフロー

現在の QA オペレーターフローは、2 ペインの QA サイトです。

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: Slack風のトランスクリプトとシナリオ計画を表示する QA Lab。

次で実行します。

```bash
pnpm qa:lab:up
```

これは QA サイトをビルドし、Docker バックの gateway レーンを起動し、
オペレーターまたは自動化ループがエージェントに QA
ミッションを与え、実際のチャンネル動作を観測し、成功、失敗、または
ブロックされたままだった内容を記録できる QA Lab ページを公開します。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより速く反復するには、
バインドマウントした QA Lab バンドルでスタックを起動します。

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前ビルド済みイメージ上に保ち、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナへバインドマウントします。`qa:lab:watch`
は変更時にそのバンドルを再ビルドし、QA Lab
アセットハッシュが変わるとブラウザが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します。

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` Plugin を有効にして `otel-trace-smoke` QA シナリオを実行した後、
エクスポートされた protobuf span をデコードし、リリースクリティカルな形状を検証します。
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
成功したターンではモデル呼び出しが `StreamAbandoned` をエクスポートしてはなりません。生の診断 ID と
`openclaw.content.*` 属性はトレースに含まれてはなりません。QA suite アーティファクトの隣に
`otel-smoke-summary.json` を書き込みます。

Observability QA はソースチェックアウト専用のままです。npm tarball は意図的に
QA Lab を省略するため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。診断
インストルメンテーションを変更する場合は、ビルド済みソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

トランスポート実体の Matrix スモークレーンには、次を実行します。

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクト配置は [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel ホームサーバーをプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使用しません）、その後 `.artifacts/qa-e2e/matrix-<timestamp>/` の下に Markdown レポート、JSON サマリー、observed-events アーティファクト、結合出力ログを書き込みます。

シナリオは、単体テストではエンドツーエンドで証明できないトランスポート動作をカバーします。メンションゲート、allow-bot ポリシー、allowlist、トップレベル返信とスレッド返信、DM ルーティング、リアクション処理、受信編集の抑制、再起動リプレイの重複排除、ホームサーバー中断からの回復、承認メタデータ配信、メディア処理、Matrix E2EE のブートストラップ/回復/検証フローです。E2EE CLI プロファイルは、gateway の返信を確認する前に、同じ使い捨てホームサーバーを通じて `openclaw matrix encryption setup` と検証コマンドも実行します。

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータスリアクション
タイムラインには `--scenario discord-status-reactions-tool-only` を使用し、
実際の Discord スレッドを作成して `message.thread-reply` が
`filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment` を使用します。これらのシナリオは、広範なスモークカバレッジではなく前後の再現プローブであるため、
デフォルトのライブ Discord レーンには含めません。
スレッド添付の Mantis ワークフローは、QA
環境で `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が構成されている場合、ログイン済み Discord Web
証人動画も追加できます。この viewer プロファイルは視覚キャプチャ専用です。合否
判定は引き続き Discord REST oracle から行われます。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とデフォルトの手動実行は、ライブ frontier 認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使って fast Matrix プロファイルを実行します。手動の `matrix_profile=all` は 5 つのプロファイルシャードにファンアウトし、シャードごとに 1 つのアーティファクトディレクトリを保ちながら網羅的カタログを並列実行できるようにします。

トランスポート実体の Telegram、Discord、Slack スモークレーンには、次を実行します。

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

これらは、2 つの bot（driver + SUT）を持つ既存の実チャンネルを対象にします。必要な環境変数、シナリオリスト、出力アーティファクト、Convex 認証情報プールは、下の [Telegram、Discord、Slack QA リファレンス](#telegram-discord-and-slack-qa-reference) に記載されています。

完全な Slack デスクトップ VM を VNC レスキュー付きで実行するには、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox のデスクトップ/ブラウザーマシンをリースし、VM 内で Slack ライブレーンを実行し、VNC ブラウザーで Slack Web を開き、デスクトップをキャプチャし、動画キャプチャを利用できる場合は `slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4` を Mantis アーティファクトディレクトリへコピーします。Crabbox のデスクトップ/ブラウザーリースでは、キャプチャツールとブラウザー/ネイティブビルドヘルパーパッケージが最初から提供されるため、古いリースでのみフォールバックをインストールする想定です。Mantis は合計時間とフェーズごとの時間を `mantis-slack-desktop-smoke-report.md` に報告するため、遅い実行で時間がリースのウォームアップ、認証情報の取得、リモートセットアップ、アーティファクトコピーのどこに使われたかを確認できます。VNC 経由で Slack Web に手動ログインした後は、`--lease-id <cbx_...>` を再利用します。再利用されたリースでは Crabbox の pnpm ストアキャッシュも温かい状態に保たれます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内でインストール/ビルドを実行します。`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合にのみ使用します。このモードでは高コストなインストール/ビルド手順をスキップし、ワークスペースの準備ができていない場合は安全側で失敗します。`--gateway-setup` を付けると、Mantis はポート `38973` で実行される永続的な OpenClaw Slack Gateway を VM 内に残します。付けない場合、このコマンドは通常のボット間 Slack QA レーンを実行し、アーティファクトのキャプチャ後に終了します。

オペレーターチェックリスト、GitHub ワークフローのディスパッチコマンド、証拠コメント契約、hydrate-mode 判断表、タイミングの解釈、失敗時の対応手順は [Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV スタイルのデスクトップタスクでは、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` は Crabbox のデスクトップ/ブラウザーマシンをリースまたは再利用し、`crabbox record --while` を開始し、ネストされた `visual-driver` で表示中のブラウザーを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き込みます。`--expect-text` が設定されている場合、ビジョンプロンプトは構造化 JSON の判定を求め、モデルが肯定的な視覚的証拠を報告した場合にのみ成功します。対象テキストを単に引用しているだけの否定応答はアサーションに失敗します。画像理解プロバイダーを呼び出さずにデスクトップ、ブラウザー、スクリーンショット、動画の配管を証明するモデルなしスモークには、`--vision-mode metadata` を使用します。録画は `visual-task` の必須アーティファクトです。Crabbox が空でない `visual-task.mp4` を記録しなかった場合、ビジュアルドライバーが成功していてもタスクは失敗します。失敗時、タスクがすでに成功していて `--keep-lease` が設定されていなかった場合を除き、Mantis は VNC 用にリースを保持します。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカーの env を確認し、エンドポイント設定を検証し、メンテナーシークレットが存在する場合は admin/list の到達性を検証します。シークレットについては設定済み/未設定の状態のみを報告します。

## ライブトランスポートのカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を作るのではなく、1つの契約を共有します。`qa-channel` は広範な合成プロダクト動作スイートであり、ライブトランスポートのカバレッジマトリクスには含まれません。

| レーン     | カナリア | メンションゲート制御 | ボット間 | 許可リストブロック | トップレベル返信 | 再起動再開 | スレッドフォローアップ | スレッド分離 | リアクション観測 | ヘルプコマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

これにより、`qa-channel` は広範なプロダクト動作スイートとして維持される一方で、Matrix、Telegram、および将来のライブトランスポートは、1つの明示的なトランスポート契約チェックリストを共有します。

QA パスに Docker を持ち込まず、使い捨ての Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。ホスト上の `qa suite` と同じシナリオ選択動作を再利用します。ホストと Multipass のスイート実行は、デフォルトで分離された Gateway ワーカーを使い、選択された複数のシナリオを並列実行します。`qa-channel` のデフォルト並列数は 4 で、選択されたシナリオ数が上限です。ワーカー数を調整するには `--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は、`--allow-failures` を使用します。ライブ実行では、ゲストで実用的に使えるサポート対象の QA 認証入力が転送されます。env ベースのプロバイダーキー、QA ライブプロバイダー設定パス、存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるように、`--output-dir` はリポジトリルート配下に置きます。

## Telegram、Discord、Slack QA リファレンス

Matrix はシナリオ数と Docker ベースのホームサーバープロビジョニングがあるため、[専用ページ](/ja-JP/concepts/qa-matrix)があります。Telegram、Discord、Slack はより小さく、それぞれ少数のシナリオで、プロファイルシステムはなく、既存の実チャンネルを対象にするため、ここにリファレンスを置いています。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` 経由で登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                                         | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | このシナリオのみを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | レポート/サマリー/観測メッセージと出力ログの書き込み先です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | 中立的な cwd から呼び出す場合のリポジトリルートです。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定内の一時アカウント id です。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` または `live-frontier`（レガシーの `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                                | プライマリ/代替モデル refs です。                                                                                         |
| `--fast`                              | オフ                                                             | サポートされている場合のプロバイダー高速モードです。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 認証情報プール](#convex-credential-pool)を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                              | `--credential-source convex` の場合に使用するロールです。                                                                          |

各レーンは、いずれかのシナリオが失敗すると非ゼロで終了します。`--allow-failures` は、失敗終了コードを設定せずにアーティファクトを書き込みます。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2つの異なるボット（ドライバー + SUT）を持つ1つの実際の非公開 Telegram グループを対象にします。SUT ボットには Telegram ユーザー名が必要です。ボット間観測は、両方のボットで `@BotFather` の **ボット間通信モード** が有効な場合に最もよく動作します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値チャット id（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内のメッセージ本文を保持します（デフォルトでは秘匿化）。

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
- `telegram-qa-summary.json` - カナリアから始まる返信ごとの RTT（ドライバー送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り、本文は秘匿化されます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2つのボットを持つ1つの実際の非公開 Discord ギルドチャンネルを対象にします。ハーネスが制御するドライバーボットと、同梱の Discord Plugin 経由で子 OpenClaw Gateway によって起動される SUT ボットです。チャンネルメンション処理、SUT ボットが Discord にネイティブ `/help` コマンドを登録済みであること、オプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT ボットユーザー id と一致している必要があります（一致しない場合、このレーンは早期に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージアーティファクト内のメッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は `discord-voice-autojoin` 用の音声/ステージチャンネルを選択します。指定しない場合、シナリオは SUT ボットから見える最初の音声/ステージチャンネルを選びます。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインの音声シナリオ。単独で実行され、`channels.discord.voice.autoJoin` を有効にし、SUT bot の現在の Discord 音声状態が対象の音声/ステージチャネルであることを検証します。Convex Discord 認証情報には任意の `voiceChannelId` を含められます。それ以外の場合、ランナーはギルド内で最初に表示される音声/ステージチャネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオ。SUT を常時オン、ツール専用のギルド返信に切り替え、`messages.statusReactions.enabled=true` を設定し、その後 REST リアクションのタイムラインと HTML/PNG の視覚的アーティファクトを取得するため、単独で実行されます。Mantis の前後レポートも、シナリオ提供の MP4 アーティファクトを `baseline.mp4` と `candidate.mp4` として保持します。

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
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

出力アーティファクト:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文は編集されます。
- ステータスリアクションシナリオが実行される場合の `discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

1 つの実際のプライベート Slack チャネルを対象にし、2 つの異なる bot を使用します。ハーネスが制御する driver bot と、バンドルされた Slack Plugin を通じて子 OpenClaw Gateway によって起動される SUT bot です。

`--credential-source env` の場合に必要な env:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクト内にメッセージ本文を保持します。

シナリオ（`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`）:

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
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文は編集されます。

#### Slack ワークスペースのセットアップ

このレーンには、1 つのワークスペース内に 2 つの異なる Slack アプリと、両方の bot がメンバーであるチャネルが必要です。

- `channelId` - 両方の bot が招待されているチャネルの `Cxxxxxxxxxx` ID。専用チャネルを使用してください。このレーンは実行ごとに投稿します。
- `driverBotToken` - **Driver** アプリの bot トークン（`xoxb-...`）。
- `sutBotToken` - **SUT** アプリの bot トークン（`xoxb-...`）。bot ユーザー ID が異なるように、driver とは別の Slack アプリである必要があります。
- `sutAppToken` - SUT アプリの `connections:write` を持つアプリレベルトークン（`xapp-...`）。Socket Mode によって SUT アプリがイベントを受信できるようにするために使用されます。

本番ワークスペースを再利用するより、QA 専用の Slack ワークスペースを推奨します。

以下の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を、ライブ Slack QA スイートでカバーされる権限とイベントに意図的に絞り込んでいます。ユーザーに見える本番チャネルのセットアップについては、[Slack チャネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup) を参照してください。QA Driver/SUT ペアは、1 つのワークスペース内に 2 つの異なる bot ユーザー ID が必要なため、意図的に分離されています。

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

_Bot User OAuth Token_（`xoxb-...`）をコピーします。これが `driverBotToken` になります。driver はメッセージを投稿し、自身を識別するだけでよいため、イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト（`extensions/slack/src/setup-shared.ts:10`）のより狭いバージョンを意図的に使用します。ライブ Slack QA スイートはまだリアクション処理をカバーしていないため、リアクションのスコープとイベントは省略されています。

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

各トークンで `auth.test` を呼び出し、2 つの bot のユーザー ID が異なることを確認します。ランタイムはユーザー ID によって driver と SUT を区別します。1 つのアプリを両方に再利用すると、mention-gating は即座に失敗します。

**3. チャネルを作成する**

QA ワークスペースでチャネル（例: `#openclaw-qa`）を作成し、チャネル内から両方の bot を招待します。

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。パブリックチャネルでも動作します。プライベートチャネルを使用する場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは成功します。

**4. 認証情報を登録する**

選択肢は 2 つあります。単一マシンでのデバッグには env vars を使用します（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、CI と他のメンテナーがリースできるように、共有 Convex プールにシードします。

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

`count: 1`、`status: "active"`、`lease` フィールドなしが期待されます。

**5. エンドツーエンドで検証する**

ローカルでレーンを実行し、両方の bot がブローカー経由で互いに会話できることを確認します。

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

グリーンの実行は 30 秒を大きく下回って完了し、`slack-qa-report.md` では `slack-canary` と `slack-mention-gating` の両方がステータス `pass` と表示されます。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空であるか、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらか確認できます。

### Convex 認証情報プール

Telegram、Discord、Slack レーンは、上記の env vars を読み取る代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡す（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定する）と、QA Lab は排他的リースを取得し、実行中は Heartbeat し、シャットダウン時に解放します。プール種別は `"telegram"`、`"discord"`、`"slack"` です。

`admin/add` でブローカーが検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` は数値のチャット ID 文字列である必要があります。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- Slack（`kind: "slack"`）: `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` は `^[A-Z][A-Z0-9]+$`（`Cxxxxxxxxxx` のような Slack ID）に一致する必要があります。アプリとスコープのプロビジョニングについては、[Slack ワークスペースのセットアップ](#setting-up-the-slack-workspace) を参照してください。

運用 env vars と Convex ブローカーエンドポイント契約は、[Testing → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります（セクション名は Discord サポート以前のものですが、ブローカーのセマンティクスは両方の種別で同一です）。

## リポジトリ由来のシード

シードアセットは `qa/` にあります。

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは、QA 計画が人間とエージェントの両方に見えるように、意図的に git に入れられています。

`qa-lab` は汎用 markdown ランナーのままであるべきです。各シナリオ markdown ファイルは、1 回のテスト実行に対する信頼できる情報源であり、次を定義するべきです。

- シナリオメタデータ
- 任意のカテゴリ、ケイパビリティ、レーン、リスクメタデータ
- docs と code refs
- 任意の Plugin 要件
- 任意の Gateway config patch
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用で横断的なままにできます。たとえば、markdown シナリオは、特別扱いのランナーを追加することなく、Gateway `browser.request` seam を通じて埋め込み Control UI を操作するブラウザ側ヘルパーと、トランスポート側ヘルパーを組み合わせられます。

シナリオファイルは、ソースツリーフォルダではなく、製品ケイパビリティごとにグループ化するべきです。ファイルが移動してもシナリオ ID は安定させます。実装のトレーサビリティには `docsRefs` と `codeRefs` を使用します。

ベースラインリストは、次をカバーできる程度に広く保つべきです。

- DM とチャネルチャット
- スレッド動作
- メッセージアクションのライフサイクル
- cron コールバック
- メモリ想起
- モデル切り替え
- subagent ハンドオフ
- リポジトリ読み取りとドキュメント読み取り
- Lobster Invaders などの小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります。

- `mock-openai` はシナリオ認識型の OpenClaw モックです。リポジトリ由来の QA とパリティゲートのためのデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加的なものであり、`mock-openai` シナリオディスパッチャーを置き換えません。

プロバイダーレーン実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、自身のデフォルト、ローカルサーバー起動、Gateway モデル config、auth-profile ステージング要件、ライブ/モックケイパビリティフラグを所有します。共有スイートと Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを経由してルーティングするべきです。

## トランスポートアダプター

`qa-lab` は、Markdown QA シナリオ向けの汎用トランスポートシームを所有します。`qa-channel` はそのシーム上の最初のアダプターですが、設計上の対象はもっと広く、将来の実在または合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じスイートランナーに接続するべきです。

アーキテクチャレベルでは、分割は次のとおりです。

- `qa-lab` は、汎用シナリオ実行、ワーカー並行実行、アーティファクト書き込み、レポート作成を所有します。
- トランスポートアダプターは、Gateway 設定、準備完了状態、受信と送信の観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` はそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルの追加

Markdown QA システムにチャンネルを追加するには、正確に次の 2 つが必要です。

1. そのチャンネル向けのトランスポートアダプター。
2. チャンネル契約を検証するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合は、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します。

- `openclaw qa` コマンドルート
- スイートの起動と終了処理
- ワーカー並行実行
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

Runner Plugin はトランスポート契約を所有します。

- `openclaw qa <runner>` を共有 `qa` ルートの下にマウントする方法
- そのトランスポート向けに Gateway を設定する方法
- 準備完了状態を確認する方法
- 受信イベントを注入する方法
- 送信メッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに裏付けられたアクションを実行する方法
- トランスポート固有のリセットやクリーンアップを処理する方法

新しいチャンネルの最小採用基準は次のとおりです。

1. 共有 `qa` ルートの所有者として `qa-lab` を維持します。
2. 共有 `qa-lab` ホストシーム上にトランスポートランナーを実装します。
3. トランスポート固有の仕組みは runner Plugin またはチャンネルハーネス内に留めます。
4. 競合するルートコマンドを登録するのではなく、ランナーを `openclaw qa <runner>` としてマウントします。Runner Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートするべきです。`runtime-api.ts` は軽量に保ち、遅延 CLI とランナー実行は別のエントリーポイントの背後に置いてください。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応します。
6. 新しいシナリオには汎用シナリオヘルパーを使用します。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続けます。

判断ルールは厳格です。

- 振る舞いを `qa-lab` で一度だけ表現できる場合は、`qa-lab` に置きます。
- 振る舞いが 1 つのチャンネルトランスポートに依存する場合は、その runner Plugin または Plugin ハーネスに留めます。
- シナリオに複数のチャンネルで使える新しい機能が必要な場合は、`suite.ts` にチャンネル固有の分岐を追加するのではなく、汎用ヘルパーを追加します。
- ある振る舞いが 1 つのトランスポートでのみ意味を持つ場合は、シナリオをトランスポート固有のままにし、そのことをシナリオ契約で明示します。

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

既存シナリオ向けに、互換エイリアス `waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` は引き続き利用できますが、新しいシナリオの作成では汎用名を使用するべきです。これらのエイリアスは一斉移行を避けるために存在するものであり、今後のモデルではありません。

## レポート作成

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートでは次の内容に答えるべきです。

- 何が動作したか
- 何が失敗したか
- 何がブロックされたままだったか
- 追加する価値のあるフォローアップシナリオは何か

利用可能なシナリオのインベントリを確認するには、つまりフォローアップ作業の規模を見積もる場合や新しいトランスポートを接続する場合に便利ですが、`pnpm openclaw qa coverage` を実行します（機械可読な出力には `--json` を追加します）。

キャラクターとスタイルのチェックでは、同じシナリオを複数のライブモデル
参照で実行し、判定済み Markdown レポートを書き込みます。

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

このコマンドは、Docker ではなくローカル QA Gateway 子プロセスを実行します。キャラクター評価
シナリオでは、`SOUL.md` でペルソナを設定し、その後チャット、ワークスペース支援、小さなファイルタスクなどの通常のユーザーターンを実行するべきです。候補モデルには、評価されていることを知らせるべきではありません。このコマンドは各完全
トランスクリプトを保持し、基本的な実行統計を記録した後、対応している場合は `xhigh` 推論を使った高速モードで判定モデルに依頼し、自然さ、雰囲気、ユーモアで実行をランク付けします。
プロバイダーを比較する場合は `--blind-judge-models` を使用してください。判定プロンプトには引き続き
すべてのトランスクリプトと実行ステータスが渡されますが、候補参照は `candidate-01` のような中立的な
ラベルに置き換えられます。レポートは解析後にランキングを実際の参照へ対応付けます。
候補実行は既定で `high` thinking になり、GPT-5.5 では `medium`、それをサポートする古い OpenAI 評価参照では `xhigh`
になります。特定の候補を上書きするには、`--model provider/model,thinking=<level>` でインライン指定します。`--thinking <level>` は引き続き
グローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は
互換性のために維持されています。
OpenAI の候補参照は、プロバイダーが対応している場所で優先処理が使われるように、既定で高速モードになります。
単一の候補または判定に上書きが必要な場合は、インラインで `,fast`、`,no-fast`、または `,fast=false` を追加します。すべての候補モデルで高速モードを強制したい場合にのみ `--fast` を渡してください。候補と判定の所要時間は
ベンチマーク分析のためにレポートに記録されますが、判定プロンプトでは速度でランク付けしないよう明示しています。
候補と判定モデルの実行はいずれも既定で並行数 16 です。プロバイダー制限やローカル Gateway
負荷により実行のノイズが大きくなりすぎる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補 `--model` が渡されない場合、キャラクター評価は
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` を既定にします。
`--judge-model` が渡されない場合、判定は既定で
`openai/gpt-5.5,thinking=xhigh,fast` および
`anthropic/claude-opus-4-6,thinking=high` になります。

## 関連ドキュメント

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [QA Channel](/ja-JP/channels/qa-channel)
- [Testing](/ja-JP/help/testing)
- [Dashboard](/ja-JP/web/dashboard)
