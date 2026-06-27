---
read_when:
    - OpenClaw のバグに対するライブ視覚 QA の構築または実行
    - プルリクエストに変更前後の検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオを追加する
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠をキャプチャし、アーティファクトを PR に添付するためのビジュアルなエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-06-27T11:09:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9de83fac9bfa64b4828dab96fcbf5fac33466c7ede9406472801dc7322bf3ae
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、可視の証拠が必要なバグ向けの OpenClaw エンドツーエンド検証システムです。既知の不正な ref に対してシナリオを実行して証拠を取得し、同じシナリオを候補 ref に対して実行して、その比較をメンテナーが PR またはローカルコマンドから検査できるアーティファクトとして公開します。

Mantis は Discord から始まります。Discord は、実際の bot 認証、実際の guild チャンネル、リアクション、スレッド、ネイティブコマンド、人間がトランスポートに表示された内容を視覚的に確認できるブラウザー UI を備えた、価値の高い最初のレーンを提供するためです。

## 目標

- GitHub issue または PR のバグを、ユーザーが見るものと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref 上で **before** アーティファクトを取得する。
- 修正を適用した後に、候補 ref 上で **after** アーティファクトを取得する。
- 可能な限り、Discord REST リアクション読み取りやチャンネルトランスクリプト検査など、決定的なオラクルを使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで、また GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まったときに VNC レスキューできるよう、十分なマシン状態を保持する。
- 実行がブロックされた場合、手動 VNC の支援が必要な場合、または完了した場合に、オペレーター Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis は単体テストの代替ではありません。Mantis 実行は、修正が理解された後、通常はより小さな回帰テストになるべきです。
- Mantis は通常の高速 CI ゲートではありません。低速で、ライブ資格情報を使用し、ライブ環境が重要なバグのために予約されています。
- Mantis は通常運用で人間を必要とすべきではありません。手動 VNC はレスキューパスであり、正常系ではありません。
- Mantis はアーティファクト、ログ、スクリーンショット、Markdown レポート、PR コメントに生のシークレットを保存しません。

## 所有権

Mantis は OpenClaw QA スタックに含まれます。

- OpenClaw は、シナリオランタイム、トランスポートアダプター、証拠スキーマ、および `pnpm openclaw qa mantis` 配下のローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部品、ブラウザーキャプチャヘルパー、アーティファクトライターを所有します。
- Crabbox は、リモート VM が必要な場合のウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有します。
- ClawSweeper は、メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿という GitHub コメントルーティングを所有します。
- OpenClaw エージェントは、シナリオがエージェント的なセットアップ、デバッグ、または詰まり状態の報告を必要とする場合に、Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保たれます。

## コマンド形式

最初のローカルコマンドは、Discord bot、guild、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before/after ランナーは次の形式を受け付けます。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは出力ディレクトリ配下に切り離されたベースラインおよび候補の worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とはベースラインのステータスが `fail`、候補のステータスが `pass` であることを意味します。

2 番目の Discord before/after プローブはスレッド添付ファイルを対象にします。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

このシナリオは、ドライバー bot で親メッセージを投稿し、実際の Discord スレッドを作成し、repo-local の `filePath` を使って OpenClaw の `message.thread-reply` アクションを呼び出し、その後スレッドをポーリングして SUT の返信と添付ファイル名を確認します。ベースラインのスクリーンショットは添付ファイルなしの返信を示し、候補のスクリーンショットは期待される `mantis-thread-report.md` 添付ファイルを示します。

最初の VM/ブラウザープリミティブはデスクトップ smoke です。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で可視ブラウザーを起動し、デスクトップをキャプチャし、アーティファクトをローカル出力ディレクトリへ戻し、再接続コマンドをレポートに書き込みます。このコマンドは Hetzner プロバイダーをデフォルトにします。これは Mantis レーンで動作するデスクトップ/VNC カバレッジを持つ最初のプロバイダーだからです。別の Crabbox fleet に対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

便利なデスクトップ smoke フラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、可視ブラウザーで開くページを変更します。
- `--html-file <path>` は、repo-local の HTML アーティファクトを可視ブラウザーでレンダリングします。Mantis はこれを使用して、生成された Discord ステータスリアクションタイムラインを実際の Crabbox デスクトップ経由でキャプチャします。
- `--browser-profile-dir <remote-path>` は、リモート Chrome user-data-dir を再利用し、永続的な Mantis デスクトップが実行間でログイン状態を保てるようにします。長期間存続する Discord Web ビューアープロファイルにはこれを使用します。
- `--browser-profile-archive-env <name>` は、ブラウザー起動前に、指定された環境変数から base64 の `.tgz` Chrome user-data-dir アーカイブを復元します。Discord Web などのログイン済み witness に使用します。デフォルトの環境変数は `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` です。
- `--video-duration <seconds>` は、MP4 キャプチャ長を制御します。安定するまで時間が必要な低速のログイン済み Web アプリには、より長い時間を使用します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新しく作成された成功リースを VNC 検査用に開いたままにします。失敗した実行では、オペレーターが再接続できるよう、新規作成されたリースはデフォルトで保持されます。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース有効期間を調整します。

Discord Web 証拠には、Mantis は bot トークンではなく専用のビューアーアカウントを使用します。ライブ Discord API シナリオは引き続きオラクルです。実際のスレッドを作成し、SUT の `thread-reply` を送信し、Discord REST 経由で添付ファイルを確認します。`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは Discord Web URL アーティファクトも書き込みます。`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` が設定されている場合、ログイン済みブラウザーが開いて記録できるだけの時間、そのスレッドを利用可能なまま残します。

GitHub ワークフローは候補スレッド URL を Discord Web で開き、スクリーンショットを取得し、MP4 を記録し、Crabbox メディアツールが利用可能な場合はトリミング済み GIF プレビューを生成します。`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` で設定された永続ビューアープロファイルパスを推奨します。完全な Chrome プロファイルアーカイブは GitHub のシークレットサイズ制限を超える可能性があるためです。小さな/bootstrap プロファイルの場合、ワークフローは `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 の `.tgz` アーカイブを復元することもできます。どちらのプロファイルソースも設定されていない場合でも、ワークフローは決定的なベースライン/候補の添付ファイルスクリーンショットを公開し、ログイン済み Discord Web witness がスキップされたことを通知として記録します。

最初の完全なデスクトップトランスポートプリミティブは Slack デスクトップ smoke です。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在の checkout を VM に同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、可視デスクトップをキャプチャし、Slack QA アーティファクトと VNC スクリーンショットの両方をローカル出力ディレクトリへコピーします。これは、SUT OpenClaw Gateway とブラウザーの両方が同じ Linux デスクトップ VM 内に存在する最初の Mantis 形式です。

`--gateway-setup` を指定すると、コマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的な使い捨て OpenClaw home を準備し、選択したチャンネル用に Slack Socket Mode 設定をパッチし、ポート `38973` で `openclaw gateway run` を開始し、Chrome を VNC セッション内で実行し続けます。これは「Slack と実行中の claw がある Linux デスクトップを残してほしい」モードです。`--gateway-setup` が省略された場合は、bot-to-bot Slack QA レーンがデフォルトのままです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` のみが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` にマップし、Crabbox の `OPENCLAW_*` env 転送が VM 内へ運べるようにします。

`--gateway-setup --credential-source convex` を指定すると、Mantis は VM 作成前に共有プールから Slack SUT 資格情報をリースし、リースされたチャンネル id、Socket Mode app token、bot token をデスクトップ内の `OPENCLAW_MANTIS_SLACK_*` ランタイム env として転送します。これにより GitHub ワークフローは薄く保たれます。必要なのは Convex broker secret だけで、生の Slack bot token や app token は不要です。

便利な Slack デスクトップフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしたマシンに対して再実行します。
- `--gateway-setup` は、bot-to-bot QA レーンのみを実行する代わりに、VM 内で永続的な OpenClaw Slack Gateway を開始します。
- `--keep-lease` は成功後の VNC 検査用に Gateway VM を開いたままにします。`--no-keep-lease` はアーティファクト収集後に停止します。
- `--slack-url <url>` は特定の Slack Web URL を開きます。指定がない場合、SUT bot token が利用可能なら、Mantis は Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、Gateway セットアップで使用する Slack チャンネル許可リストを制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続 Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` であるため、手動の Slack Web ログインは同じリース上の再実行でも維持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack env トークンではなく共有資格情報プールを使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は、Slack ライブレーンへそのまま渡されます。

承認チェックポイント実行は、CI セーフな可視証拠のために Slack API メッセージスナップショットをチェックポイント PNG にレンダリングします。`slack-desktop-smoke.png` が Slack Web の証拠になるのは、リースがすでにログイン済みのウォームブラウザープロファイルを使用している場合だけです。

GitHub smoke ワークフローは `Mantis Discord Smoke` です。最初の実シナリオ用の before/after GitHub ワークフローは `Mantis Discord Status Reactions` です。次を受け付けます。

- `baseline_ref`: queued-only 動作を再現すると期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すと期待される ref。

これはワークフローハーネス ref を checkout し、個別のベースラインおよび候補 worktree をビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、各レーンのタイムライン HTML を Crabbox デスクトップブラウザーでレンダリングし、それらの VNC スクリーンショットを、決定的なタイムライン PNG と並べて PR コメントに公開します。同じ PR コメントには、`crabbox media preview` によって生成された軽量なモーショントリミング済み GIF プレビューが埋め込まれ、対応するモーショントリミング済み MP4 クリップへのリンクが含まれ、詳細検査用に完全なデスクトップ MP4 ファイルが保持されます。スクリーンショットは素早いレビューのためにインラインに残ります。ワークフローは、次の Crabbox バイナリリリースが切られる前に現在のデスクトップ/ブラウザーリースフラグを使用できるよう、`openclaw/crabbox` main から Crabbox CLI をビルドします。

`Mantis Scenario` は汎用の手動エントリポイントです。`scenario_id`、`candidate_ref`、任意の `baseline_ref`、任意の `pr_number` を受け取り、シナリオが所有するワークフローへディスパッチします。このラッパーは意図的に薄くなっています。シナリオのワークフローは引き続き、トランスポートのセットアップ、認証情報、VM クラス、期待されるオラクル、アーティファクトマニフェストを所有します。

`Mantis Slack Desktop Smoke` は最初の Slack VM ワークフローです。信頼済み候補 ref を別の worktree にチェックアウトし、Crabbox Linux デスクトップをリースし、その候補に対して `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` を実行し、VNC ブラウザで Slack Web を開き、デスクトップを録画し、`crabbox media preview` でモーションをトリミングしたプレビューを生成し、完全なアーティファクトディレクトリをアップロードし、任意で対象 PR にインライン証拠コメントを投稿します。デスクトップリースはデフォルトで AWS を使用し、AWS 容量が遅い、または利用できない場合にオペレーターが Hetzner へ切り替えられるよう手動プロバイダー入力を公開します。ボット同士の Slack トランスクリプトだけでなく、「Slack と claw が動作する Linux デスクトップ」が必要な場合にこのレーンを使用します。

`Mantis Telegram Live` は既存の Telegram ライブ QA レーンを同じ PR 証拠パイプラインでラップします。信頼済み候補 ref を別の worktree にチェックアウトし、`pnpm openclaw qa telegram --credential-source convex
--credential-role ci` を実行し、Telegram QA サマリー、`qa-evidence.json`、レポートアーティファクトから `mantis-evidence.json` マニフェストを書き出し、Crabbox デスクトップブラウザを通じて墨消し済み証拠 HTML をレンダリングし、`crabbox media preview` でモーションをトリミングした GIF を生成し、PR 番号が利用可能な場合はインライン PR 証拠コメントを投稿します。このレーンはログイン済み Telegram Web 証明ではなく、QA 証拠のビジュアルです。Telegram Bot API は安定したライブメッセージ証拠を提供しますが、通常の Mantis 自動化では Telegram Web のログイン状態は不要です。

`Mantis Telegram Desktop Proof` は、エージェント型のネイティブ Telegram Desktop 前後比較ラッパーです。メンテナーは PR コメントの `@openclaw-mantis telegram desktop proof`、自由形式の指示を添えた Actions UI、または汎用の `Mantis Scenario` ディスパッチャーから起動できます。このワークフローは PR、ベースライン ref、候補 ref、メンテナーの指示を Codex に渡します。エージェントは PR を読み、変更を証明する Telegram で見える動作を判断し、ベースラインと候補に対して実ユーザーの Crabbox Telegram Desktop 証明レーンを実行し、ネイティブ GIF が有用になるまで反復し、ペアの `motionPreview` アーティファクトを `mantis-evidence.json` に書き込み、バンドルをアップロードし、PR 番号が利用可能な場合は 2 列の PR 証拠テーブルを投稿します。

人間参加型の Telegram デスクトップセットアップには、シナリオビルダーを使用します。

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

ビルダーは Crabbox デスクトップをリースまたは再利用し、ネイティブ Linux Telegram Desktop バイナリをインストールし、任意でユーザーセッションアーカイブを復元し、リースされた Telegram SUT ボットトークンで OpenClaw を設定し、ポート `38974` で `openclaw gateway run` を開始し、リースされたプライベートグループへドライバーボットの準備完了メッセージを投稿し、その後、表示中の VNC デスクトップからスクリーンショットと MP4 をキャプチャします。ボットトークンが Telegram Desktop にログインすることはありません。これは OpenClaw の設定にのみ使われます。デスクトップビューアーは別の Telegram ユーザーセッションであり、`--telegram-profile-archive-env <name>` から復元するか、VNC 経由で手動作成し、`--keep-lease` で維持します。

便利な Telegram デスクトップビルダーフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに Telegram Desktop にログイン済みの VM に対して再実行します。
- `--telegram-profile-archive-env <name>` は、その環境変数から base64 の `.tgz` Telegram Desktop プロファイルアーカイブを読み取り、起動前に復元します。
- `--telegram-profile-dir <remote-path>` は、リモートの Telegram Desktop プロファイルディレクトリを制御します。デフォルトは `$HOME/.local/share/TelegramDesktop` です。
- `--no-gateway-setup` は、OpenClaw を設定せずに Telegram Desktop をインストールして開きます。
- `--credential-source convex --credential-role ci` は、直接の Telegram env トークンではなく共有認証情報ブローカーを使用します。

PR 公開シナリオはすべて、レポートの横に `mantis-evidence.json` を書き込みます。このスキーマはシナリオコードと GitHub コメントの間の引き渡しです。

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord Status Reactions QA",
  "summary": "Human-readable top summary for the PR comment.",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "queued-only" },
    "candidate": { "sha": "...", "status": "pass", "expected": "queued -> thinking -> done" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "Baseline queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "Baseline Discord timeline",
      "width": 420
    }
  ]
}
```

アーティファクトの `path` 値はマニフェストディレクトリからの相対パスです。`targetPath` 値は、設定された Mantis R2/S3 アーティファクトプレフィックス配下の相対パスです。パブリッシャーはパストラバーサルを拒否し、任意のプレビューまたは動画が利用できない場合、`"required": false` とマークされたエントリをスキップします。

サポートされるアーティファクト種別:

- `timeline`: 決定的なシナリオスクリーンショット。通常は前後比較です。
- `desktopScreenshot`: VNC/ブラウザデスクトップのスクリーンショット。
- `motionPreview`: デスクトップ録画から生成されたインラインアニメーション GIF。
- `motionClip`: 静的な冒頭と末尾を取り除いた、モーションをトリミングした MP4。
- `fullVideo`: 詳細調査用の完全な MP4 録画。
- `metadata`: JSON/ログのサイドカー。
- `report`: Markdown レポート。

再利用可能なパブリッシャーは `scripts/mantis/publish-pr-evidence.mjs` です。ワークフローはマニフェスト、対象 PR、アーティファクト対象ルート、コメントマーカー、Actions アーティファクト URL、実行 URL、リクエストソースを指定して呼び出します。これは宣言されたアーティファクトを設定済みの Mantis R2/S3 バケットにアップロードし、インライン画像/プレビューとリンク付き動画を含むサマリー優先の PR コメントを構築し、既存のマーカーコメントを更新するか新規作成します。ワークフローは `openclaw-crabbox-artifacts` に公開し、公開 URL は `https://artifacts.openclaw.ai` 配下になります。バケット、リージョン、公開 URL の値は直接提供されます。再利用可能なパブリッシャーには次が必要です。

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`

PR コメントから status-reactions 実行を直接起動することもできます。

```text
@openclaw-mantis discord status reactions
```

コメントトリガーは意図的に狭くなっています。これは write、maintain、admin アクセスを持つユーザーによる pull request コメントでのみ実行され、Discord status-reaction リクエストだけを認識します。デフォルトでは、既知の不良ベースライン ref と現在の PR head SHA を候補として使用します。メンテナーはどちらの ref も上書きできます。

```text
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram ライブ QA も PR コメントから起動できます。

```text
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

デフォルトでは現在の PR head SHA を候補として使用し、`telegram-status-command` を実行します。特定の ref または事前にウォームアップ済みの Crabbox デスクトップが必要な場合、メンテナーは `candidate=...`、`provider=aws|hetzner`、`lease=<cbx_...>` を上書きできます。

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的でシナリオに焦点を当てています。2 番目のコマンドは後で、PR または issue を、ラベル、変更ファイル、ClawSweeper レビュー所見から推奨 Mantis シナリオへマッピングできます。

## 実行ライフサイクル

1. 認証情報を取得する。
2. VM を割り当てる、または再利用する。
3. シナリオが UI 証拠を必要とする場合、デスクトップ/ブラウザプロファイルを準備する。
4. ベースライン ref 用のクリーンなチェックアウトを準備する。
5. 依存関係をインストールし、シナリオが必要とするものだけをビルドする。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を開始する。
7. ライブトランスポート、プロバイダー、モデル、ブラウザプロファイルを設定する。
8. シナリオを実行し、ベースライン証拠をキャプチャする。
9. Gateway を停止し、ログを保持する。
10. 同じ VM で候補 ref を準備する。
11. 同じシナリオを実行し、候補証拠をキャプチャする。
12. オラクル結果とビジュアル証拠を比較する。
13. Markdown、JSON、ログ、スクリーンショット、任意のトレースアーティファクトを書き込む。
14. GitHub Actions アーティファクトをアップロードする。
15. 簡潔な PR または Discord ステータスメッセージを投稿する。

シナリオは 2 つの異なる方法で失敗できる必要があります。

- **バグ再現**: ベースラインが期待どおりの方法で失敗した。
- **ハーネス失敗**: バグオラクルが意味を持つ前に、環境セットアップ、認証情報、Discord API、ブラウザ、またはプロバイダーが失敗した。

最終レポートでは、メンテナーが不安定な環境と製品動作を混同しないよう、これらのケースを分離する必要があります。

## Discord MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` であるギルドチャンネル内の Discord ステータスリアクションを対象にする必要があります。

これが優れた Mantis シードである理由:

- トリガーメッセージ上のリアクションとして Discord で見える。
- Discord メッセージリアクション状態を通じた強力な REST オラクルがある。
- 実際の OpenClaw Gateway、Discord ボット認証、メッセージディスパッチ、ソース返信配信モード、ステータスリアクション状態、モデルターンライフサイクルを実行する。
- 最初の実装を誠実に保てる程度に狭い。

期待されるシナリオ形状:

```yaml
id: discord-status-reactions-tool-only
transport: discord
baseline:
  expect:
    reproduced: true
candidate:
  expect:
    fixed: true
config:
  messages:
    ackReaction: "👀"
    ackReactionScope: "group-mentions"
    groupChat:
      visibleReplies: "message_tool"
    statusReactions:
      enabled: true
      timing:
        debounceMs: 0
discord:
  requireMention: true
  notifyChannel: operator-notify
evidence:
  rest:
    messageReactions: true
  browser:
    screenshotMessageRow: true
```

ベースライン証拠は、queued 確認リアクションは表示するものの、tool-only モードでライフサイクル遷移がないことを示す必要があります。候補証拠は、`messages.statusReactions.enabled` が明示的に true の場合にライフサイクルステータスリアクションが実行されることを示す必要があります。

実行可能な最初のスライスは、オプトインの Discord ライブ QA シナリオです。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

これは SUT を、常時オンのギルド処理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、明示的なステータスリアクションで設定します。オラクルは実際の Discord トリガーメッセージをポーリングし、観測されるシーケンス `👀 -> 🤔 -> 👍` を期待します。アーティファクトには `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html`、`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 部品

Mantis はゼロから始めるのではなく、既存のプライベート QA スタックの上に構築する必要があります。

- `pnpm openclaw qa discord` は、ドライバーと SUT ボットを使ったライブ Discord レーンをすでに実行しています。
- ライブトランスポートランナーは、レポート、QA 証拠、トランスポート固有のアーティファクトを `.artifacts/qa-e2e/` 配下にすでに書き込みます。
- Convex 認証情報リースは、共有ライブトランスポート認証情報への排他的アクセスをすでに提供しています。
- ブラウザ制御サービスは、スクリーンショット、スナップショット、ヘッドレス管理プロファイル、リモート CDP プロファイルをすでにサポートしています。
- QA Lab には、トランスポート形状のテスト用デバッガー UI とバスがすでにあります。

最初の Mantis 実装は、これらの部品の上に置く薄い前後比較ランナーに、1 つのビジュアル証拠レイヤーを加えたものにできます。

## 証拠モデル

すべての実行は安定したアーティファクトディレクトリを書き込みます。

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-summary.json
  baseline/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  candidate/
    summary.json
    discord-message.json
    screenshot-message-row.png
    gateway-debug/
  comparison.json
  run.log
```

`mantis-summary.json` は機械可読な信頼できる唯一の情報源であるべきです。
Markdown レポートは PR コメントと人間によるレビュー用です。

サマリーには次を含める必要があります。

- テストした refs と SHA
- transport とシナリオ id
- マシンプロバイダーとマシン id または lease id
- シークレット値を含まない認証情報ソース
- baseline の結果
- candidate の結果
- baseline でバグが再現したかどうか
- candidate が修正したかどうか
- artifact パス
- サニタイズ済みのセットアップまたはクリーンアップの問題

スクリーンショットは証拠であり、シークレットではありません。それでも、編集除去の規律は必要です。
非公開チャンネル名、ユーザー名、メッセージ内容が表示される場合があります。公開 PR では、
編集除去の方針がより強固になるまで、インライン画像より GitHub Actions artifact リンクを優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルトです。Chrome は CDP を有効にして実行され、
  Playwright または OpenClaw ブラウザー制御がスクリーンショットを取得します。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、
  または視覚的なデバッグに人間が必要な場合に、同じ VM で有効化されます。

Discord observer のブラウザープロファイルは、毎回の実行でログインしなくて済む程度に永続化されるべきですが、
個人のブラウザー状態からは分離してください。プロファイルは開発者のラップトップではなく、
Mantis マシンプールに属します。

Mantis が詰まった場合、次を含む Discord ステータスメッセージを投稿します。

- run id
- シナリオ id
- マシンプロバイダー
- artifact ディレクトリ
- 利用可能な場合は VNC または noVNC の接続手順
- 短いブロッカー説明

最初の非公開デプロイでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、
後で専用の Mantis チャンネルへ移行できます。

## マシン

Mantis は最初のリモート実装では Crabbox 経由の AWS を優先するべきです。
Crabbox は、ウォーム済みマシン、lease 追跡、hydration、ログ、結果、
クリーンアップを提供します。AWS の容量が遅すぎる、または利用できない場合は、
同じマシンインターフェイスの背後に Hetzner プロバイダーを追加してください。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化用の CDP アクセス
- レスキュー用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw checkout と依存関係キャッシュ
- Playwright を使用する場合は Playwright Chromium ブラウザーキャッシュ
- 1 つの OpenClaw Gateway、1 つのブラウザー、1 つのモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへの outbound アクセス

VM は、想定される認証情報ストアまたはブラウザープロファイルストア以外に、
長期的な raw secret を保持するべきではありません。

## シークレット

リモート実行ではシークレットは GitHub organization または repository secrets に置き、
ローカル実行ではローカルのオペレーター管理シークレットファイルに置きます。

推奨されるシークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- 公開 GitHub artifact アップロード用の `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期的には、Convex 認証情報プールを live transport 認証情報の通常ソースとして維持するべきです。
GitHub secrets はブローカーと fallback レーンを bootstrap します。
Discord status-reactions ワークフローは、Mantis Crabbox シークレットを Crabbox CLI が期待する
`CRABBOX_COORDINATOR` と `CRABBOX_COORDINATOR_TOKEN` 環境変数へ対応付けます。
プレーンな `CRABBOX_*` GitHub secret 名は、互換性 fallback として引き続き受け入れられます。

Mantis runner は次を絶対に出力してはいけません。

- Discord bot token
- プロバイダー API キー
- ブラウザークッキー
- auth profile の内容
- VNC パスワード
- raw credential payload

公開 artifact アップロードでも、bot、guild、channel、message id などの Discord target metadata を編集除去するべきです。
GitHub smoke ワークフローはこの理由で `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

token が誤って issue、PR、chat、log に貼り付けられた場合は、
新しいシークレットを保存した後にローテーションしてください。

## GitHub artifacts と PR コメント

Mantis ワークフローは、完全な証拠 bundle を短命の Actions artifact としてアップロードするべきです。
ワークフローがバグレポートまたは修正 PR に対して実行される場合は、編集除去済みのインラインメディアも
構成済みの Mantis R2/S3 bucket に公開し、そのバグまたは修正 PR のコメントを upsert して、
インラインの before/after スクリーンショットを含めるべきです。主要な証拠を汎用 QA 自動化 PR のみに投稿しないでください。
Raw log、観測されたメッセージ、その他の大きな証拠は Actions artifact に残します。

本番ワークフローでは、`github-actions[bot]` ではなく Mantis GitHub App でそれらのコメントを投稿するべきです。
app id と private key は `MANTIS_GITHUB_APP_ID` と `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets として保存してください。
ワークフローは非表示マーカーを upsert key として使用し、token が編集できる場合はそのコメントを更新し、
古い bot 所有のマーカーを編集できない場合は新しい Mantis 所有コメントを作成します。

PR コメントは短く、視覚的であるべきです。

```md
Mantis Discord Status Reactions QA

Summary: Mantis reran the reported Discord status-reaction bug against the known
bad baseline and the candidate fix. The baseline reproduced the bug, while the
candidate showed the expected queued -> thinking -> done sequence.

- Scenario: `discord-status-reactions-tool-only`
- Run: <workflow run link>
- Artifact: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

harness が失敗したために実行が失敗した場合、コメントでは candidate が失敗したかのように示唆せず、
その旨を述べる必要があります。

## 非公開デプロイの注意事項

非公開デプロイには、すでに Mantis Discord application がある場合があります。
適切な bot 権限があり、安全にローテーションできる場合は、別の app を作成せずにその application を再利用してください。

初期のオペレーター通知チャンネルは、secrets または deployment configuration で設定してください。
最初は既存の maintainer または operations チャンネルを指し、
専用の Mantis チャンネルができたらそこへ移行できます。

guild id、channel id、bot token、browser cookie、VNC password をこのドキュメントに入れないでください。
それらは GitHub secrets、認証情報ブローカー、またはオペレーターのローカル secret store に保存してください。

## シナリオの追加

Mantis シナリオでは次を宣言するべきです。

- id と title
- transport
- 必要な認証情報
- baseline ref policy
- candidate ref policy
- OpenClaw config patch
- setup steps
- stimulus
- expected baseline oracle
- expected candidate oracle
- visual capture targets
- timeout budget
- cleanup steps

シナリオでは、小さく型付けされた oracle を優先するべきです。

- reaction バグには Discord reaction state
- threading バグには Discord message references
- Slack バグには Slack thread ts と reaction API state
- email バグには email message id と header
- UI が唯一の信頼できる観測対象である場合はブラウザースクリーンショット

Vision check は追加的であるべきです。プラットフォーム API でバグを証明できる場合は、
pass/fail oracle として API を使用し、スクリーンショットは人間の確信のために残してください。

## プロバイダー拡張

Discord の後、同じ runner で次を追加できます。

- Slack: reactions、threads、app mentions、modals、file uploads。
- Email: connectors だけでは不十分な場合の `gog` を使った Gmail auth と message threading。
- WhatsApp: QR login、re-identification、message delivery、media、reactions。
- Telegram: group mention gating、commands、利用可能な場合は reactions。
- Matrix: encrypted rooms、thread または reply relations、restart resume。

各 transport には、安価な smoke シナリオを 1 つと、1 つ以上の bug-class シナリオを用意するべきです。
高コストな visual シナリオは opt-in のままにしてください。

## 未解決の質問

- 既存の Mantis bot を再利用する場合、どの Discord bot を driver にし、どれを SUT にするべきか？
- observer browser login は、人間の Discord アカウント、test account、
  それとも第 1 フェーズでは bot-readable REST evidence のみを使うべきか？
- GitHub は PR 用の Mantis artifacts をどのくらい保持するべきか？
- ClawSweeper は maintainer command を待つ代わりに、いつ Mantis を自動推奨するべきか？
- 公開 PR では、アップロード前にスクリーンショットを編集除去または cropped するべきか？
