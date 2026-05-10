---
read_when:
    - QA スタックがどのように連携するかを理解する
    - qa-lab、qa-channel、またはトランスポートアダプターの拡張
    - リポジトリに基づく品質保証シナリオの追加
    - Gateway ダッシュボードを中心に、より現実に即した QA 自動化を構築する
summary: 'QA スタックの概要: qa-lab、qa-channel、リポジトリベースのシナリオ、ライブトランスポートレーン、トランスポートアダプター、レポート。'
title: QA の概要
x-i18n:
    generated_at: "2026-05-10T19:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

プライベート QA スタックは、単一のユニットテストよりも現実的で、
チャネルの形に近い方法で OpenClaw を検証するためのものです。

現在の構成要素:

- `extensions/qa-channel`: DM、チャネル、スレッド、リアクション、
  編集、削除のサーフェスを備えた合成メッセージチャネル。
- `extensions/qa-lab`: トランスクリプトの観察、受信メッセージの注入、
  Markdown レポートのエクスポートを行うためのデバッガー UI と QA バス。
- `extensions/qa-matrix`、将来の runner plugins: 子 QA gateway 内で
  実チャネルを駆動するライブトランスポートアダプター。
- `qa/`: キックオフタスクとベースライン QA シナリオ用の、
  リポジトリ管理されたシードアセット。
- [Mantis](/ja-JP/concepts/mantis): 実トランスポート、ブラウザーのスクリーンショット、
  VM 状態、PR 証拠を必要とするバグのための、修正前後のライブ検証。

## コマンドサーフェス

すべての QA フローは `pnpm openclaw qa <subcommand>` の下で実行されます。多くには `pnpm qa:*`
スクリプトエイリアスがあります。どちらの形式もサポートされています。

| コマンド                                            | 目的                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | バンドル済み QA セルフチェック。Markdown レポートを書き出します。                                                                                                                                                                                                                        |
| `qa suite`                                          | リポジトリ管理のシナリオを QA gateway レーンに対して実行します。エイリアス: 使い捨て Linux VM 用の `pnpm openclaw qa suite --runner multipass`。                                                                                                                                  |
| `qa coverage`                                       | Markdown のシナリオカバレッジインベントリを出力します（マシン出力には `--json`）。                                                                                                                                                                                           |
| `qa parity-report`                                  | 2 つの `qa-suite-summary.json` ファイルを比較し、エージェント型パリティレポートを書き出します。                                                                                                                                                                                          |
| `qa character-eval`                                 | 複数のライブモデルでキャラクター QA シナリオを実行し、判定付きレポートを生成します。[レポート](#reporting)を参照してください。                                                                                                                                                            |
| `qa manual`                                         | 選択したプロバイダー/モデルレーンに対して単発プロンプトを実行します。                                                                                                                                                                                                          |
| `qa ui`                                             | QA デバッガー UI とローカル QA バスを起動します（エイリアス: `pnpm qa:lab:ui`）。                                                                                                                                                                                                    |
| `qa docker-build-image`                             | 事前構築済み QA Docker イメージをビルドします。                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | QA ダッシュボード + gateway レーン用の docker-compose スキャフォールドを書き出します。                                                                                                                                                                                                    |
| `qa up`                                             | QA サイトをビルドし、Docker バックのスタックを起動して、URL を出力します（エイリアス: `pnpm qa:lab:up`; `:fast` バリアントは `--use-prebuilt-image --bind-ui-dist --skip-ui-build` を追加）。                                                                                                  |
| `qa aimock`                                         | AIMock プロバイダーサーバーのみを起動します。                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | シナリオ対応の `mock-openai` プロバイダーサーバーのみを起動します。                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | 共有 Convex 認証情報プールを管理します。                                                                                                                                                                                                                               |
| `qa matrix`                                         | 使い捨て Tuwunel homeserver に対するライブトランスポートレーン。[Matrix QA](/ja-JP/concepts/qa-matrix)を参照してください。                                                                                                                                                                      |
| `qa telegram`                                       | 実際のプライベート Telegram グループに対するライブトランスポートレーン。                                                                                                                                                                                                              |
| `qa discord`                                        | 実際のプライベート Discord guild チャネルに対するライブトランスポートレーン。                                                                                                                                                                                                       |
| `qa slack`                                          | 実際のプライベート Slack チャネルに対するライブトランスポートレーン。                                                                                                                                                                                                               |
| `qa mantis`                                         | ライブトランスポートのバグ向けの修正前後の検証 runner。Discord ステータスリアクション証拠、Crabbox デスクトップ/ブラウザースモーク、Slack-in-VNC スモークを含みます。[Mantis](/ja-JP/concepts/mantis) と [Mantis Slack Desktop Runbook](/ja-JP/concepts/mantis-slack-desktop-runbook)を参照してください。 |

## オペレーターフロー

現在の QA オペレーターフローは 2 ペインの QA サイトです:

- 左: エージェントを含む Gateway ダッシュボード（Control UI）。
- 右: QA Lab。Slack 風のトランスクリプトとシナリオプランを表示します。

次で実行します:

```bash
pnpm qa:lab:up
```

これにより QA サイトがビルドされ、Docker バックの gateway レーンが起動し、
QA Lab ページが公開されます。オペレーターまたは自動化ループはそこでエージェントに QA
ミッションを与え、実チャネルでの動作を観察し、成功、失敗、または
ブロックされたままの内容を記録できます。

毎回 Docker イメージを再ビルドせずに QA Lab UI をより高速に反復するには、
バインドマウントされた QA Lab バンドルでスタックを起動します:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` は Docker サービスを事前構築済みイメージ上に保ち、
`extensions/qa-lab/web/dist` を `qa-lab` コンテナにバインドマウントします。`qa:lab:watch` は
変更時にそのバンドルを再ビルドし、QA Lab アセットハッシュが変わるとブラウザーが自動リロードします。

ローカル OpenTelemetry トレーススモークには、次を実行します:

```bash
pnpm qa:otel:smoke
```

このスクリプトはローカル OTLP/HTTP トレースレシーバーを起動し、
`diagnostics-otel` Plugin を有効にして `otel-trace-smoke` QA シナリオを実行した後、
エクスポートされた protobuf span をデコードし、リリースクリティカルな形状を検証します:
`openclaw.run`、`openclaw.harness.run`、`openclaw.model.call`、
`openclaw.context.assembled`、`openclaw.message.delivery` が存在する必要があります。
成功したターンではモデル呼び出しが `StreamAbandoned` をエクスポートしてはならず、生の診断 ID と
`openclaw.content.*` 属性はトレースに含めてはいけません。QA suite アーティファクトの隣に
`otel-smoke-summary.json` を書き出します。

Observability QA はソースチェックアウト専用のままです。npm tarball は意図的に
QA Lab を省いているため、パッケージ Docker リリースレーンでは `qa` コマンドを実行しません。
診断インストルメンテーションを変更するときは、ビルド済みソースチェックアウトから
`pnpm qa:otel:smoke` を使用してください。

トランスポート実体の Matrix スモークレーンには、次を実行します:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

このレーンの完全な CLI リファレンス、プロファイル/シナリオカタログ、環境変数、アーティファクトレイアウトは [Matrix QA](/ja-JP/concepts/qa-matrix) にあります。概要: Docker 内に使い捨て Tuwunel homeserver をプロビジョニングし、一時的な driver/SUT/observer ユーザーを登録し、そのトランスポートにスコープされた子 QA gateway 内で実際の Matrix Plugin を実行し（`qa-channel` は使いません）、その後 Markdown レポート、JSON サマリー、observed-events アーティファクト、結合出力ログを `.artifacts/qa-e2e/matrix-<timestamp>/` の下に書き出します。

シナリオは、ユニットテストではエンドツーエンドに証明できないトランスポート挙動をカバーします: mention gating、allow-bot ポリシー、allowlist、トップレベル返信とスレッド返信、DM ルーティング、リアクション処理、受信編集の抑制、再起動時 replay dedupe、homeserver 中断からの復旧、承認メタデータ配信、メディア処理、Matrix E2EE ブートストラップ/復旧/検証フロー。E2EE CLI プロファイルは、gateway 返信を確認する前に、同じ使い捨て homeserver を通して `openclaw matrix encryption setup` と検証コマンドも駆動します。

Discord には、バグ再現用の Mantis 専用オプトインシナリオもあります。明示的なステータスリアクション
タイムラインには `--scenario discord-status-reactions-tool-only` を使用し、
実際の Discord スレッドを作成して `message.thread-reply` が
`filePath` 添付を保持することを検証するには `--scenario discord-thread-reply-filepath-attachment` を使用します。
これらのシナリオは、広範なスモークカバレッジではなく修正前後の再現プローブであるため、
デフォルトのライブ Discord レーンには含めません。
スレッド添付の Mantis ワークフローでは、QA 環境で
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` または
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` が設定されている場合、
ログイン済み Discord Web 目撃動画も追加できます。その viewer プロファイルは視覚的なキャプチャ専用です。
合否判定は引き続き Discord REST oracle から得られます。

CI は `.github/workflows/qa-live-transports-convex.yml` で同じコマンドサーフェスを使用します。スケジュール実行とデフォルトの手動実行は、ライブ frontier 認証情報、`--fast`、`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000` を使って fast Matrix プロファイルを実行します。手動の `matrix_profile=all` は 5 つのプロファイルシャードにファンアウトするため、各シャードにつき 1 つのアーティファクトディレクトリを維持しながら、網羅的なカタログを並列実行できます。

トランスポート実体の Telegram、Discord、Slack スモークレーンには:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

これらは 2 つのボット（driver + SUT）を持つ既存の実チャネルを対象にします。必要な環境変数、シナリオリスト、出力アーティファクト、Convex 認証情報プールは、以下の [Telegram、Discord、Slack QA リファレンス](#telegram-discord-and-slack-qa-reference) に記載されています。

完全な Slack デスクトップ VM 実行を VNC レスキュー付きで行うには、次を実行します。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

このコマンドは Crabbox のデスクトップ/ブラウザマシンをリースし、VM 内で Slack ライブレーンを実行し、VNC ブラウザで Slack Web を開き、デスクトップをキャプチャし、動画キャプチャが利用可能な場合は `slack-qa/`、`slack-desktop-smoke.png`、`slack-desktop-smoke.mp4` を Mantis アーティファクトディレクトリへコピーします。Crabbox のデスクトップ/ブラウザリースには、キャプチャツールとブラウザ/ネイティブビルド補助パッケージが事前に用意されているため、このシナリオがフォールバックをインストールするのは古いリースの場合だけです。Mantis は `mantis-slack-desktop-smoke-report.md` で合計タイミングとフェーズ別タイミングを報告するため、遅い実行で時間がリースのウォームアップ、認証情報取得、リモートセットアップ、アーティファクトコピーのどこにかかったかが分かります。VNC 経由で Slack Web に手動ログインした後は、`--lease-id <cbx_...>` を再利用してください。再利用されたリースでは、Crabbox の pnpm ストアキャッシュも温存されます。デフォルトの `--hydrate-mode source` はソースチェックアウトから検証し、VM 内で install/build を実行します。`--hydrate-mode prehydrated` は、再利用するリモートワークスペースにすでに `node_modules` とビルド済みの `dist/` がある場合にのみ使用してください。このモードは高コストな install/build ステップをスキップし、ワークスペースの準備ができていない場合はフェイルクローズします。`--gateway-setup` を指定すると、Mantis は永続的な OpenClaw Slack Gateway を VM 内のポート `38973` で起動したままにします。指定しない場合、このコマンドは通常の bot-to-bot Slack QA レーンを実行し、アーティファクトキャプチャ後に終了します。

オペレーターチェックリスト、GitHub ワークフローディスパッチコマンド、証拠コメントの契約、hydrate-mode 判断表、タイミングの解釈、失敗時の処理手順は [Mantis Slack デスクトップランブック](/ja-JP/concepts/mantis-slack-desktop-runbook) にあります。

エージェント/CV 形式のデスクトップタスクでは、次を実行します。

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` は Crabbox のデスクトップ/ブラウザマシンをリースまたは再利用し、`crabbox record --while` を開始し、ネストされた `visual-driver` を通じて表示中のブラウザを操作し、`visual-task.png` をキャプチャし、`--vision-mode image-describe` が選択されている場合はスクリーンショットに対して `openclaw infer image describe` を実行し、`visual-task.mp4`、`mantis-visual-task-summary.json`、`mantis-visual-task-driver-result.json`、`mantis-visual-task-report.md` を書き出します。`--expect-text` が設定されている場合、ビジョンプロンプトは構造化 JSON 判定を求め、モデルが肯定的な可視証拠を報告した場合にのみ合格します。ターゲットテキストを単に引用するだけの否定的な応答はアサーションに失敗します。画像理解プロバイダーを呼び出さずに、デスクトップ、ブラウザ、スクリーンショット、動画の配管を検証する no-model スモークには `--vision-mode metadata` を使用してください。録画は `visual-task` の必須アーティファクトです。Crabbox が空でない `visual-task.mp4` を記録しない場合、ビジュアルドライバーが合格していてもタスクは失敗します。失敗時、タスクがすでに合格していて `--keep-lease` が設定されていなかった場合を除き、Mantis は VNC 用にリースを保持します。

プールされたライブ認証情報を使用する前に、次を実行します。

```bash
pnpm openclaw qa credentials doctor
```

doctor は Convex ブローカー環境をチェックし、エンドポイント設定を検証し、メンテナーシークレットが存在する場合は admin/list の到達性を確認します。シークレットについては設定済み/未設定の状態だけを報告します。

## ライブトランスポートカバレッジ

ライブトランスポートレーンは、それぞれが独自のシナリオリスト形状を発明するのではなく、1 つの契約を共有します。`qa-channel` は広範な合成プロダクト挙動スイートであり、ライブトランスポートカバレッジマトリクスの一部ではありません。

| レーン     | Canary | メンションゲーティング | Bot-to-bot | allowlist ブロック | トップレベル返信 | 再起動レジューム | スレッドフォローアップ | スレッド分離 | リアクション観測 | help コマンド | ネイティブコマンド登録 |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

これにより、`qa-channel` は広範なプロダクト挙動スイートとして維持される一方で、Matrix、Telegram、および将来のライブトランスポートは 1 つの明示的なトランスポート契約チェックリストを共有します。

Docker を QA パスに持ち込まずに使い捨て Linux VM レーンを実行するには、次を実行します。

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

これは新しい Multipass ゲストを起動し、依存関係をインストールし、ゲスト内で OpenClaw をビルドし、`qa suite` を実行してから、通常の QA レポートとサマリーをホスト上の `.artifacts/qa-e2e/...` にコピーします。
ホスト上の `qa suite` と同じシナリオ選択挙動を再利用します。
ホストと Multipass のスイート実行は、デフォルトで分離された Gateway ワーカーを使い、選択された複数シナリオを並列実行します。`qa-channel` のデフォルト並行数は 4 で、選択されたシナリオ数が上限になります。ワーカー数を調整するには `--concurrency <count>` を使用し、直列実行には `--concurrency 1` を使用します。
いずれかのシナリオが失敗すると、このコマンドは非ゼロで終了します。失敗終了コードなしでアーティファクトが必要な場合は `--allow-failures` を使用してください。
ライブ実行では、ゲストにとって実用的なサポート対象の QA 認証入力が転送されます。環境変数ベースのプロバイダーキー、QA ライブプロバイダー設定パス、および存在する場合は `CODEX_HOME` です。ゲストがマウントされたワークスペース経由で書き戻せるよう、`--output-dir` はリポジトリルート配下に置いてください。

## Telegram、Discord、Slack QA リファレンス

Matrix はシナリオ数と Docker ベースのホームサーバープロビジョニングのため、[専用ページ](/ja-JP/concepts/qa-matrix) があります。Telegram、Discord、Slack はより小規模で、それぞれ数個のシナリオ、プロファイルシステムなし、既存の実チャンネルに対する実行であるため、そのリファレンスはここにあります。

### 共有 CLI フラグ

これらのレーンは `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` を通じて登録され、同じフラグを受け付けます。

| フラグ                                  | デフォルト                                                         | 説明                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | このシナリオだけを実行します。繰り返し指定できます。                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | レポート/サマリー/観測メッセージと出力ログが書き込まれる場所です。相対パスは `--repo-root` を基準に解決されます。 |
| `--repo-root <path>`                  | `process.cwd()`                                                 | ニュートラルな cwd から呼び出す場合のリポジトリルートです。                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | QA Gateway 設定内の一時アカウント ID です。                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` または `live-frontier` です（レガシーの `live-openai` も引き続き動作します）。                                                  |
| `--model <ref>` / `--alt-model <ref>` | プロバイダーのデフォルト                                                | プライマリ/代替モデル ref です。                                                                                         |
| `--fast`                              | オフ                                                             | サポートされている場合のプロバイダー高速モードです。                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                           | [Convex 認証情報プール](#convex-credential-pool) を参照してください。                                                                |
| `--credential-role <maintainer\|ci>`  | CI では `ci`、それ以外では `maintainer`                              | `--credential-source convex` の場合に使用されるロールです。                                                                          |

いずれかのシナリオが失敗すると、各レーンは非ゼロで終了します。`--allow-failures` は失敗終了コードを設定せずにアーティファクトを書き出します。

### Telegram QA

```bash
pnpm openclaw qa telegram
```

2 つの異なる bot（ドライバー + SUT）を含む 1 つの実際のプライベート Telegram グループを対象にします。SUT bot には Telegram ユーザー名が必要です。bot-to-bot 観測は、両方の bot で `@BotFather` の **Bot-to-Bot Communication Mode** が有効な場合に最もよく動作します。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - 数値のチャット ID（文字列）。
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

任意:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` は、観測メッセージアーティファクトにメッセージ本文を保持します（デフォルトでは秘匿）。

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

暗黙のデフォルトセットは常に canary、メンションゲーティング、ネイティブコマンド返信、コマンド宛先指定、bot-to-bot グループ返信をカバーします。`mock-openai` のデフォルトには、決定論的な返信チェーンと最終メッセージストリーミングのチェックも含まれます。`telegram-current-session-status-tool` は、任意のネイティブコマンド返信の後ではなく、canary の直後に直接スレッド化された場合にのみ安定するため、引き続きオプトインです。現在のデフォルト/任意の分割と回帰 ref を出力するには、`pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` を使用してください。

出力アーティファクト:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - canary から始まる返信ごとの RTT（ドライバー送信 → 観測された SUT 返信）を含みます。
- `telegram-qa-observed-messages.json` - `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` でない限り本文は秘匿されます。

### Discord QA

```bash
pnpm openclaw qa discord
```

2 つの bot を含む 1 つの実際のプライベート Discord ギルドチャンネルを対象にします。1 つはハーネスが制御するドライバー bot、もう 1 つは bundled Discord Plugin を通じて子 OpenClaw Gateway によって起動される SUT bot です。チャンネルメンション処理、SUT bot が Discord にネイティブ `/help` コマンドを登録済みであること、およびオプトインの Mantis 証拠シナリオを検証します。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - Discord から返される SUT ボットユーザー ID と一致する必要があります（一致しない場合、そのレーンは即座に失敗します）。

任意:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します。
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` は `discord-voice-autojoin` 用のボイス/ステージチャンネルを選択します。指定しない場合、シナリオは SUT ボットから見える最初のボイス/ステージチャンネルを選びます。

シナリオ（`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`）:

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - オプトインのボイスシナリオです。単独で実行され、`channels.discord.voice.autoJoin` を有効にし、SUT ボットの現在の Discord ボイス状態が対象のボイス/ステージチャンネルであることを検証します。Convex Discord 認証情報には任意の `voiceChannelId` を含められます。含まれない場合、ランナーはギルド内で見える最初のボイス/ステージチャンネルを検出します。
- `discord-status-reactions-tool-only` - オプトインの Mantis シナリオです。SUT を、`messages.statusReactions.enabled=true` を使った常時オン、ツール専用のギルド返信に切り替えるため、単独で実行されます。その後、REST リアクションのタイムラインと HTML/PNG の視覚アーティファクトを取得します。Mantis の前後レポートも、シナリオから提供された MP4 アーティファクトを `baseline.mp4` と `candidate.mp4` として保持します。

Discord ボイス自動参加シナリオを明示的に実行します:

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
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

出力アーティファクト:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` - `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` でない限り、本文はリダクションされます。
- ステータスリアクションシナリオが実行された場合は、`discord-qa-reaction-timelines.json` と `discord-status-reactions-tool-only-timeline.png`。

### Slack QA

```bash
pnpm openclaw qa slack
```

1 つの実際のプライベート Slack チャンネルを対象に、2 つの異なるボットを使います。ハーネスによって制御されるドライバーボットと、バンドルされた Slack Plugin を通じて子 OpenClaw Gateway によって起動される SUT ボットです。

`--credential-source env` の場合に必要な環境変数:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

任意:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` は、観測メッセージのアーティファクトにメッセージ本文を保持します。

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
- `slack-qa-observed-messages.json` - `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` でない限り、本文はリダクションされます。

#### Slack ワークスペースのセットアップ

このレーンには、1 つのワークスペース内に 2 つの異なる Slack アプリと、両方のボットがメンバーになっているチャンネルが必要です:

- `channelId` - 両方のボットが招待されているチャンネルの `Cxxxxxxxxxx` ID。専用チャンネルを使用してください。このレーンは実行ごとに投稿します。
- `driverBotToken` - **Driver** アプリのボットトークン（`xoxb-...`）。
- `sutBotToken` - **SUT** アプリのボットトークン（`xoxb-...`）。ボットユーザー ID が異なるように、ドライバーとは別の Slack アプリである必要があります。
- `sutAppToken` - `connections:write` を持つ SUT アプリのアプリレベルトークン（`xapp-...`）。Socket Mode が SUT アプリでイベントを受信できるようにするために使われます。

本番ワークスペースを再利用するより、QA 専用の Slack ワークスペースを推奨します。

下記の SUT マニフェストは、バンドルされた Slack Plugin の本番インストール（`extensions/slack/src/setup-shared.ts:10`）を、ライブ Slack QA スイートで対象とする権限とイベントに意図的に絞っています。ユーザーから見える本番チャンネルのセットアップについては、[Slack チャンネルのクイックセットアップ](/ja-JP/channels/slack#quick-setup)を参照してください。QA の Driver/SUT ペアは、1 つのワークスペース内で 2 つの異なるボットユーザー ID が必要なため、意図的に分離されています。

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

_Bot User OAuth Token_（`xoxb-...`）をコピーします。これが `driverBotToken` になります。ドライバーはメッセージの投稿と自身の識別だけを必要とします。イベントも Socket Mode も不要です。

**2. SUT アプリを作成する**

同じワークスペースで _Create New App → From a manifest_ を繰り返します。この QA アプリは、バンドルされた Slack Plugin の本番マニフェスト（`extensions/slack/src/setup-shared.ts:10`）の、より絞り込んだバージョンを意図的に使用しています。ライブ Slack QA スイートはまだリアクション処理を対象としていないため、リアクションのスコープとイベントは省略されています。

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

Slack がアプリを作成したら、その設定ページで 2 つのことを行います:

- _Install to Workspace_ → _Bot User OAuth Token_ をコピー → これが `sutBotToken` になります。
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → スコープ `connections:write` を追加 → 保存 → `xapp-...` の値をコピー → これが `sutAppToken` になります。

各トークンで `auth.test` を呼び出して、2 つのボットのユーザー ID が異なることを確認します。ランタイムはユーザー ID でドライバーと SUT を区別します。両方に同じアプリを再利用すると、mention-gating が即座に失敗します。

**3. チャンネルを作成する**

QA ワークスペースでチャンネル（例: `#openclaw-qa`）を作成し、チャンネル内から両方のボットを招待します:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

_channel info → About → Channel ID_ から `Cxxxxxxxxxx` ID をコピーします。これが `channelId` になります。パブリックチャンネルで動作します。プライベートチャンネルを使う場合でも、両方のアプリはすでに `groups:history` を持っているため、ハーネスの履歴読み取りは引き続き成功します。

**4. 認証情報を登録する**

2 つの選択肢があります。単一マシンでのデバッグには環境変数を使います（4 つの `OPENCLAW_QA_SLACK_*` 変数を設定し、`--credential-source env` を渡します）。または、CI と他のメンテナーがリースできるように、共有 Convex プールにシードします。

Convex プールの場合、4 つのフィールドを JSON ファイルに書き込みます:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

シェルで `OPENCLAW_QA_CONVEX_SITE_URL` と `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` をエクスポートした状態で、登録して検証します:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

`count: 1`、`status: "active"`、`lease` フィールドなしを期待します。

**5. エンドツーエンドで検証する**

両方のボットがブローカーを通じて相互に会話できることを確認するため、レーンをローカルで実行します:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

成功する実行は 30 秒を大きく下回る時間で完了し、`slack-qa-report.md` には `slack-canary` と `slack-mention-gating` の両方が `pass` ステータスで表示されます。レーンが約 90 秒ハングして `Convex credential pool exhausted for kind "slack"` で終了する場合、プールが空か、すべての行がリースされています。`qa credentials list --kind slack --status all --json` でどちらかを確認できます。

### Convex 認証情報プール

Telegram、Discord、Slack、WhatsApp レーンは、上記の環境変数を読む代わりに、共有 Convex プールから認証情報をリースできます。`--credential-source convex` を渡します（または `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` を設定します）。QA Lab は排他的リースを取得し、実行中は Heartbeat し、シャットダウン時に解放します。プール種別は `"telegram"`、`"discord"`、`"slack"`、`"whatsapp"` です。

ブローカーが `admin/add` で検証するペイロード形状:

- Telegram（`kind: "telegram"`）: `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` は数値のチャット ID 文字列である必要があります。
- Telegram 実ユーザー（`kind: "telegram-user"`）: `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - TDLib CLI ドライバーと Telegram Desktop の視覚証人の両方で使われる、1 つの排他的なバーナーアカウントリースです。
- Discord（`kind: "discord"`）: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`。
- WhatsApp（`kind: "whatsapp"`）: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - 電話番号は異なる E.164 文字列である必要があります。

視覚的な実ユーザー Telegram 証明には、保持された Crabbox セッションを推奨します:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` は、TDLib CLI ドライバーと Telegram Desktop 証人の両方に対して排他的な Convex `telegram-user` リースを 1 つ保持し、デスクトップ録画を開始し、任意のエージェント駆動の再現手順のために Crabbox を生かしたままにします。エージェントは満足するまで `send`、`run`、`screenshot`、`status` を使用でき、その後 `finish` が認証情報を解放する前に、スクリーンショット、動画、モーションでトリミングされた動画/GIF、TDLib プローブ出力、ログを収集します。`publish --session <file> --pr <number>` はデフォルトでモーション GIF のみをコメントします。ログと JSON 出力には `--full-artifacts` による明示的なオプトインが必要です。デフォルトの `probe` コマンドは、簡単な `/status` スモークチェック用の 1 コマンド短縮形のままです。

PR で決定的なビジュアル差分が必要な場合は、`--mock-response-file <path>` を使用します:
Telegram フォーマッターまたは配信レイヤーを変更している間、同じモックモデル応答を `main` と PR head の両方で実行できます。キャプチャのデフォルトは PR コメント向けに調整されています: 標準の Crabbox クラス、24fps のデスクトップ録画、24fps のモーション GIF、1920px のプレビュー幅です。変更前/変更後のコメントでは、意図した GIF のみを含むクリーンなバンドルを公開する必要があります。

Slack レーンでもプールを使用できます。Slack ペイロード形状チェックは現在、ブローカーではなく Slack QA ランナーにあります。Slack チャンネル ID には `Cxxxxxxxxxx` のような値を使い、`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` を使用してください。アプリとスコープのプロビジョニングについては、[Slack ワークスペースの設定](#setting-up-the-slack-workspace) を参照してください。

運用上の環境変数と Convex ブローカーエンドポイント契約は、[テスト → Convex 経由の共有 Telegram 認証情報](/ja-JP/help/testing#shared-telegram-credentials-via-convex-v1) にあります (このセクション名はマルチチャンネルプールより前のものです。リースのセマンティクスは種類をまたいで共有されます)。

## リポジトリに裏付けられたシード

シードアセットは `qa/` にあります:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

これらは意図的に git に置かれており、QA 計画が人間とエージェントの両方に見えるようになっています。

`qa-lab` は汎用的な Markdown ランナーのままにする必要があります。各シナリオ Markdown ファイルは、1 回のテスト実行に対する信頼できる情報源であり、次を定義する必要があります:

- シナリオメタデータ
- 任意のカテゴリ、ケイパビリティ、レーン、リスクのメタデータ
- docs とコード参照
- 任意の Plugin 要件
- 任意の Gateway 設定パッチ
- 実行可能な `qa-flow`

`qa-flow` を支える再利用可能なランタイムサーフェスは、汎用的かつ横断的なままで構いません。たとえば、Markdown シナリオは、特別扱いのランナーを追加せずに、Gateway の `browser.request` seam を通じて埋め込み Control UI を操作するブラウザー側ヘルパーと、トランスポート側ヘルパーを組み合わせることができます。

シナリオファイルは、ソースツリーのフォルダーではなく、製品ケイパビリティごとにグループ化する必要があります。ファイルが移動してもシナリオ ID は安定させてください。実装の追跡可能性には `docsRefs` と `codeRefs` を使用します。

ベースラインリストは、次をカバーできる十分な広さを保つ必要があります:

- DM とチャンネルチャット
- スレッドの挙動
- メッセージアクションのライフサイクル
- cron コールバック
- メモリー呼び出し
- モデル切り替え
- サブエージェントのハンドオフ
- リポジトリ読み取りと docs 読み取り
- Lobster Invaders のような小さなビルドタスク 1 つ

## プロバイダーモックレーン

`qa suite` には 2 つのローカルプロバイダーモックレーンがあります:

- `mock-openai` はシナリオ対応の OpenClaw モックです。リポジトリに裏付けられた QA とパリティゲートのためのデフォルトの決定的モックレーンのままです。
- `aimock` は、実験的なプロトコル、フィクスチャ、記録/再生、カオスカバレッジのために AIMock ベースのプロバイダーサーバーを起動します。これは追加のものであり、`mock-openai` シナリオディスパッチャーを置き換えるものではありません。

プロバイダーレーンの実装は `extensions/qa-lab/src/providers/` 配下にあります。各プロバイダーは、そのデフォルト、ローカルサーバー起動、Gateway モデル設定、認証プロファイルのステージング要件、live/mock ケイパビリティフラグを所有します。共有 suite と Gateway コードは、プロバイダー名で分岐するのではなく、プロバイダーレジストリを通じてルーティングする必要があります。

## トランスポートアダプター

`qa-lab` は Markdown QA シナリオ向けの汎用トランスポート seam を所有します。`qa-channel` はその seam 上の最初のアダプターですが、設計目標はより広いものです。将来の実チャンネルまたは合成チャンネルは、トランスポート固有の QA ランナーを追加するのではなく、同じ suite ランナーに差し込む必要があります。

アーキテクチャレベルでは、分割は次のとおりです:

- `qa-lab` は汎用シナリオ実行、ワーカー同時実行、アーティファクト書き込み、レポート作成を所有します。
- トランスポートアダプターは Gateway 設定、準備完了状態、インバウンドおよびアウトバウンドの観測、トランスポートアクション、正規化されたトランスポート状態を所有します。
- `qa/scenarios/` 配下の Markdown シナリオファイルがテスト実行を定義し、`qa-lab` がそれらを実行する再利用可能なランタイムサーフェスを提供します。

### チャンネルを追加する

Markdown QA システムにチャンネルを追加するには、正確に 2 つのものが必要です:

1. チャンネル用のトランスポートアダプター。
2. チャンネル契約を実行するシナリオパック。

共有 `qa-lab` ホストがフローを所有できる場合、新しいトップレベル QA コマンドルートを追加しないでください。

`qa-lab` は共有ホストの仕組みを所有します:

- `openclaw qa` コマンドルート
- suite の起動と終了処理
- ワーカー同時実行
- アーティファクト書き込み
- レポート生成
- シナリオ実行
- 古い `qa-channel` シナリオ向けの互換エイリアス

ランナー Plugin はトランスポート契約を所有します:

- `openclaw qa <runner>` を共有 `qa` ルート配下にマウントする方法
- そのトランスポート向けに Gateway を設定する方法
- 準備完了状態をチェックする方法
- インバウンドイベントを注入する方法
- アウトバウンドメッセージを観測する方法
- トランスクリプトと正規化されたトランスポート状態を公開する方法
- トランスポートに裏付けられたアクションを実行する方法
- トランスポート固有のリセットまたはクリーンアップを処理する方法

新しいチャンネルの最小導入基準:

1. 共有 `qa` ルートの所有者として `qa-lab` を維持する。
2. 共有 `qa-lab` ホスト seam 上にトランスポートランナーを実装する。
3. トランスポート固有の仕組みはランナー Plugin またはチャンネルハーネス内に保つ。
4. 競合するルートコマンドを登録する代わりに、ランナーを `openclaw qa <runner>` としてマウントする。ランナー Plugin は `openclaw.plugin.json` で `qaRunners` を宣言し、`runtime-api.ts` から対応する `qaRunnerCliRegistrations` 配列をエクスポートする必要があります。`runtime-api.ts` は軽量に保ってください。遅延 CLI とランナー実行は、別々のエントリポイントの背後に置く必要があります。
5. テーマ別の `qa/scenarios/` ディレクトリ配下で Markdown シナリオを作成または適応する。
6. 新しいシナリオには汎用シナリオヘルパーを使用する。
7. リポジトリが意図的な移行を行っている場合を除き、既存の互換エイリアスを動作させ続ける。

判断ルールは厳格です:

- 挙動を `qa-lab` に一度だけ表現できる場合は、`qa-lab` に置く。
- 挙動が 1 つのチャンネルトランスポートに依存する場合は、そのランナー Plugin または Plugin ハーネスに保つ。
- シナリオに複数のチャンネルで使える新しいケイパビリティが必要な場合は、`suite.ts` にチャンネル固有の分岐を追加する代わりに、汎用ヘルパーを追加する。
- 挙動が 1 つのトランスポートでのみ意味を持つ場合は、シナリオをトランスポート固有に保ち、そのことをシナリオ契約で明示する。

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

既存シナリオ向けの互換エイリアスとして、`waitForQaChannelReady`、`waitForOutboundMessage`、`waitForNoOutbound`、`formatConversationTranscript`、`resetBus` は引き続き利用できます。ただし、新しいシナリオ作成では汎用名を使用する必要があります。これらのエイリアスは一斉移行を避けるためのものであり、今後のモデルとして存在するものではありません。

## レポート

`qa-lab` は、観測されたバスタイムラインから Markdown プロトコルレポートをエクスポートします。
レポートは次に答える必要があります:

- 何が機能したか
- 何が失敗したか
- 何がブロックされたままか
- 追加する価値のあるフォローアップシナリオは何か

利用可能なシナリオのインベントリについては、フォローアップ作業の規模見積もりや新しいトランスポートの配線時に役立つため、`pnpm openclaw qa coverage` を実行してください (機械可読出力には `--json` を追加します)。

キャラクターとスタイルのチェックでは、同じシナリオを複数の live モデル参照に対して実行し、判定付きの Markdown レポートを書き出します:

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

このコマンドは Docker ではなく、ローカル QA Gateway 子プロセスを実行します。キャラクター評価シナリオは `SOUL.md` でペルソナを設定し、その後にチャット、ワークスペースのヘルプ、小さなファイルタスクなどの通常のユーザーターンを実行する必要があります。候補モデルには、評価されていることを伝えてはいけません。このコマンドは各完全トランスクリプトを保持し、基本的な実行統計を記録した後、対応している場合は `xhigh` reasoning を使った fast mode でジャッジモデルに、自然さ、雰囲気、ユーモアによって実行をランク付けするよう依頼します。
プロバイダーを比較するときは `--blind-judge-models` を使用してください。ジャッジプロンプトにはすべてのトランスクリプトと実行ステータスが引き続き渡されますが、候補参照は `candidate-01` のような中立ラベルに置き換えられます。レポートはパース後にランキングを実際の参照へ戻して対応付けます。
候補実行はデフォルトで `high` thinking になり、GPT-5.5 では `medium`、それをサポートする古い OpenAI eval 参照では `xhigh` になります。特定の候補は `--model provider/model,thinking=<level>` でインラインに上書きできます。`--thinking <level>` は引き続きグローバルフォールバックを設定し、古い `--model-thinking <provider/model=level>` 形式は互換性のために維持されています。
OpenAI 候補参照はデフォルトで fast mode になり、プロバイダーが対応している場合は優先処理が使用されます。単一の候補またはジャッジに上書きが必要な場合は、`,fast`、`,no-fast`、または `,fast=false` をインラインで追加します。すべての候補モデルで fast mode を強制的にオンにしたい場合にのみ、`--fast` を渡してください。ベンチマーク分析のために候補とジャッジの所要時間はレポートに記録されますが、ジャッジプロンプトでは速度でランク付けしないよう明示します。
候補とジャッジモデルの実行はいずれもデフォルトで同時実行 16 です。プロバイダー制限またはローカル Gateway の負荷によって実行がノイズ過多になる場合は、`--concurrency` または `--judge-concurrency` を下げてください。
候補の `--model` が渡されない場合、キャラクター評価は
`openai/gpt-5.5`、`openai/gpt-5.2`、`openai/gpt-5`、`anthropic/claude-opus-4-6`、
`anthropic/claude-sonnet-4-6`、`zai/glm-5.1`、
`moonshot/kimi-k2.5`、および
`google/gemini-3.1-pro-preview` をデフォルトにします。
`--judge-model` が渡されない場合、ジャッジは
`openai/gpt-5.5,thinking=xhigh,fast` と
`anthropic/claude-opus-4-6,thinking=high` をデフォルトにします。

## 関連 docs

- [Matrix QA](/ja-JP/concepts/qa-matrix)
- [QA チャンネル](/ja-JP/channels/qa-channel)
- [テスト](/ja-JP/help/testing)
- [ダッシュボード](/ja-JP/web/dashboard)
