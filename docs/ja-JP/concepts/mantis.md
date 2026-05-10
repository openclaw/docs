---
read_when:
    - OpenClaw のバグに対するライブ視覚 QA のビルドまたは実行
    - プルリクエストの変更前後の検証を追加する
    - Discord、Slack、WhatsApp、その他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠をキャプチャし、アーティファクトを PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-10T19:30:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1622b86cb5e08def1c8f06a16a0f454c67a58cf42f6c08c40bd66754648b9a95
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、可視の証拠を必要とするバグのための OpenClaw エンドツーエンド検証システムです。既知の不良 ref に対してシナリオを実行して証拠を取得し、同じシナリオを候補 ref に対して実行し、その比較を、メンテナーが PR またはローカルコマンドから確認できるアーティファクトとして公開します。

Mantis は Discord から始まります。Discord は、実際のボット認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、そして人間がトランスポートで表示された内容を視覚的に確認できるブラウザー UI という、高価値の最初のレーンを提供するためです。

## 目標

- GitHub issue または PR のバグを、ユーザーが目にするものと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref 上で **before** アーティファクトを取得する。
- 修正を適用した後に、候補 ref 上で **after** アーティファクトを取得する。
- 可能な場合は常に、Discord REST リアクションの読み取りやチャンネルトランスクリプト確認など、決定的なオラクルを使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで、GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まった場合に VNC で救出できるだけのマシン状態を保持する。
- 実行がブロックされた場合、手動 VNC 支援が必要な場合、または完了した場合に、オペレーターの Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis は単体テストの代替ではありません。Mantis 実行は通常、修正が理解された後に、より小さな回帰テストへ落とし込むべきです。
- Mantis は通常の高速 CI ゲートではありません。低速で、ライブ認証情報を使用し、ライブ環境が重要なバグに限定されます。
- Mantis は通常運用で人間を必要とすべきではありません。手動 VNC は救出パスであり、正常系ではありません。
- Mantis は生のシークレットをアーティファクト、ログ、スクリーンショット、Markdown レポート、PR コメントに保存しません。

## 所有権

Mantis は OpenClaw QA スタックに属します。

- OpenClaw は、`pnpm openclaw qa mantis` 配下のシナリオランタイム、トランスポートアダプター、証拠スキーマ、ローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部品、ブラウザーキャプチャヘルパー、アーティファクトライターを所有します。
- Crabbox は、リモート VM が必要な場合のウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有します。
- ClawSweeper は GitHub コメントルーティングを所有します。つまり、メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿です。
- シナリオにエージェント的なセットアップ、デバッグ、または詰まった状態の報告が必要な場合、OpenClaw エージェントは Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローのつなぎ込みは ClawSweeper に保たれます。

## コマンド形状

最初のローカルコマンドは、Discord ボット、ギルド、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before/after ランナーは、この形状を受け付けます。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは、出力ディレクトリ配下に分離されたベースラインおよび候補ワークツリーを作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行した後、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とはベースラインステータスが `fail`、候補ステータスが `pass` であることを意味します。

2 つ目の Discord before/after プローブは、スレッド添付ファイルを対象にします。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

このシナリオは、ドライバーボットで親メッセージを投稿し、実際の Discord スレッドを作成し、リポジトリローカルの `filePath` を指定して OpenClaw の `message.thread-reply` アクションを呼び出し、その後 SUT の返信と添付ファイル名をスレッドでポーリングします。ベースラインのスクリーンショットは添付ファイルなしの返信を示し、候補のスクリーンショットは期待される `mantis-thread-report.md` 添付ファイルを示します。

最初の VM/ブラウザープリミティブはデスクトップスモークです。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で可視ブラウザーを起動し、デスクトップをキャプチャし、アーティファクトをローカル出力ディレクトリへ取り戻し、再接続コマンドをレポートへ書き込みます。このコマンドは、Mantis レーンで動作するデスクトップ/VNC カバレッジを持つ最初のプロバイダーであるため、デフォルトで Hetzner プロバイダーを使用します。別の Crabbox フリートに対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

便利なデスクトップスモークフラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、可視ブラウザーで開くページを変更します。
- `--html-file <path>` は、リポジトリローカルの HTML アーティファクトを可視ブラウザーでレンダリングします。Mantis はこれを使用して、生成された Discord ステータスリアクションタイムラインを実際の Crabbox デスクトップ経由でキャプチャします。
- `--browser-profile-dir <remote-path>` は、リモート Chrome user-data-dir を再利用し、永続的な Mantis デスクトップが実行間でログイン状態を保てるようにします。長期稼働の Discord Web ビューアープロファイルにはこれを使用します。
- `--browser-profile-archive-env <name>` は、ブラウザー起動前に、指定された環境変数から base64 `.tgz` Chrome user-data-dir アーカイブを復元します。Discord Web など、ログイン済みの目撃者に使用します。デフォルトの env var は `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` です。
- `--video-duration <seconds>` は MP4 キャプチャ長を制御します。安定するまで時間が必要な低速のログイン済み Web アプリには、より長い期間を使用します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新規作成され成功したリースを VNC 検査のために開いたままにします。失敗した実行では、作成されたリースがある場合、オペレーターが再接続できるようにデフォルトでリースを保持します。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース寿命を調整します。

Discord Web 証拠では、Mantis はボットトークンではなく専用ビューアーアカウントを使用します。ライブ Discord API シナリオは引き続きオラクルです。これは実際のスレッドを作成し、SUT の `thread-reply` を送信し、Discord REST を通じて添付ファイルを確認します。`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは Discord Web URL アーティファクトも書き込みます。`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` が設定されている場合、ログイン済みブラウザーが開いて記録できるだけの時間、そのスレッドを利用可能なままにします。

GitHub ワークフローは候補スレッド URL を Discord Web で開き、スクリーンショットをキャプチャし、MP4 を記録し、Crabbox メディアツールが利用可能な場合はトリミング済み GIF プレビューを生成します。GitHub のシークレットサイズ制限を完全な Chrome プロファイルアーカイブが超える場合があるため、`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` を通じて設定された永続ビューアープロファイルパスを推奨します。小さな/bootstrap プロファイルの場合、ワークフローは `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 `.tgz` アーカイブを復元することもできます。どちらのプロファイルソースも設定されていない場合でも、ワークフローは決定的なベースライン/候補の添付ファイルスクリーンショットを公開し、ログイン済み Discord Web 目撃者がスキップされたという通知をログに残します。

最初の完全なデスクトップトランスポートプリミティブは Slack デスクトップスモークです。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在のチェックアウトを VM 内に同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、可視デスクトップをキャプチャし、Slack QA アーティファクトと VNC スクリーンショットの両方をローカル出力ディレクトリへコピーします。これは、SUT OpenClaw Gateway とブラウザーの両方が同じ Linux デスクトップ VM 内に存在する最初の Mantis 形状です。

`--gateway-setup` を指定すると、コマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的な使い捨て OpenClaw ホームを準備し、選択されたチャンネル用に Slack Socket Mode 設定をパッチし、ポート `38973` で `openclaw gateway run` を起動し、Chrome を VNC セッション内で実行したままにします。これは「Slack と実行中の claw がある Linux デスクトップを残しておく」モードです。`--gateway-setup` が省略された場合は、ボット間 Slack QA レーンが引き続きデフォルトです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` のみが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` へマッピングし、Crabbox の `OPENCLAW_*` env 転送が VM 内へ運べるようにします。

`--gateway-setup --credential-source convex` を指定すると、Mantis は VM 作成前に共有プールから Slack SUT 認証情報をリースし、リースされたチャンネル ID、Socket Mode app token、bot token をデスクトップ内の `OPENCLAW_MANTIS_SLACK_*` ランタイム env として転送します。これにより GitHub ワークフローは薄く保たれます。必要なのは Convex ブローカーシークレットだけで、生の Slack ボットまたはアプリトークンは不要です。

便利な Slack デスクトップフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしたマシンに対して再実行します。
- `--gateway-setup` は、ボット間 QA レーンのみを実行する代わりに、永続的な OpenClaw Slack Gateway を VM 内で起動します。
- `--keep-lease` は、成功後も Gateway VM を VNC 検査のために開いたままにします。`--no-keep-lease` は、アーティファクト収集後に停止します。
- `--slack-url <url>` は、特定の Slack Web URL を開きます。指定しない場合、SUT ボットトークンが利用可能なときは、Mantis が Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、Gateway セットアップで使用される Slack チャンネル allowlist を制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続 Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` なので、手動 Slack Web ログインは同じリース上の再実行でも維持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack env トークンではなく共有認証情報プールを使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は Slack ライブレーンへ渡されます。

GitHub スモークワークフローは `Mantis Discord Smoke` です。最初の実シナリオの before/after GitHub ワークフローは `Mantis Discord Status Reactions` です。これは次を受け付けます。

- `baseline_ref`: queued のみの挙動を再現することが期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すことが期待される ref。

これはワークフローハーネス ref をチェックアウトし、別々のベースラインおよび候補ワークツリーをビルドし、各ワークツリーに対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、Crabbox デスクトップブラウザーで各レーンのタイムライン HTML をレンダリングし、それらの VNC スクリーンショットを決定的なタイムライン PNG と並べて PR コメントに公開します。同じ PR コメントには、`crabbox media preview` によって生成された軽量なモーショントリミング済み GIF プレビューを埋め込み、対応するモーショントリミング済み MP4 クリップへリンクし、詳細検査用に完全なデスクトップ MP4 ファイルを保持します。スクリーンショットは簡易レビューのためにインラインのままです。このワークフローは、次の Crabbox バイナリリリースが切られる前に現在のデスクトップ/ブラウザーリースフラグを使用できるよう、`openclaw/crabbox` main から Crabbox CLI をビルドします。

`Mantis Scenario` は汎用の手動エントリーポイントです。`scenario_id`、`candidate_ref`、任意の `baseline_ref`、任意の `pr_number` を受け取り、シナリオ所有のワークフローをディスパッチします。このラッパーは意図的に薄く作られています。シナリオワークフローは引き続き、自身のトランスポートセットアップ、認証情報、VM クラス、期待されるオラクル、アーティファクトマニフェストを所有します。

`Mantis Slack Desktop Smoke` は最初の Slack VM ワークフローです。別のワークツリーで
信頼済み候補 ref をチェックアウトし、Crabbox Linux デスクトップをリースし、
その候補に対して `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` を実行し、
VNC ブラウザーで Slack Web を開き、デスクトップを録画し、
`crabbox media preview` で動きに合わせてトリミングしたプレビューを生成し、
完全なアーティファクトディレクトリをアップロードし、必要に応じて対象 PR に
インライン証拠コメントを投稿します。デスクトップリースにはデフォルトで AWS を使用し、
AWS のキャパシティが遅い、または利用できない場合にオペレーターが Hetzner に切り替えられる
手動プロバイダー入力を公開します。ボット間の Slack トランスクリプトだけでなく、
「Slack と claw が実行されている Linux デスクトップ」が必要なときに、このレーンを使用します。

`Mantis Telegram Live` は、既存の Telegram ライブ QA レーンを同じ PR 証拠パイプラインでラップします。
別のワークツリーで信頼済み候補 ref をチェックアウトし、`pnpm openclaw qa telegram --credential-source convex
--credential-role ci` を実行し、Telegram QA サマリーと観測済みメッセージアーティファクトから
`mantis-evidence.json` マニフェストを書き出し、Crabbox デスクトップブラウザーで墨消し済み
トランスクリプト HTML をレンダリングし、`crabbox media preview` で動きに合わせてトリミングした GIF を生成し、
PR 番号が利用できる場合はインライン PR 証拠コメントを投稿します。このレーンはログイン済み
Telegram Web 証拠ではなく、トランスクリプトの視覚証拠です。Telegram Bot API は安定した
ライブメッセージ証拠を提供しますが、通常の Mantis 自動化では Telegram Web のログイン状態は不要です。

人間が介在する Telegram デスクトップセットアップには、シナリオビルダーを使用します。

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

このビルダーは Crabbox デスクトップをリースまたは再利用し、ネイティブ Linux
Telegram Desktop バイナリをインストールし、必要に応じてユーザーセッションアーカイブを復元し、
リースされた Telegram SUT ボットトークンで OpenClaw を設定し、ポート `38974` で
`openclaw gateway run` を開始し、リースされたプライベートグループへドライバーボットの準備完了メッセージを投稿し、
表示中の VNC デスクトップからスクリーンショットと MP4 をキャプチャします。ボットトークンで
Telegram Desktop にログインすることはありません。OpenClaw を設定するためだけに使用します。
デスクトップビューアーは別個の Telegram ユーザーセッションであり、
`--telegram-profile-archive-env <name>` から復元するか、VNC 経由で手動作成し、
`--keep-lease` で維持します。

便利な Telegram デスクトップビルダーフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに Telegram Desktop にログインした VM に対して再実行します。
- `--telegram-profile-archive-env <name>` は、その環境変数から base64 の `.tgz` Telegram Desktop プロファイルアーカイブを読み取り、起動前に復元します。
- `--telegram-profile-dir <remote-path>` は、リモート Telegram Desktop プロファイルディレクトリを制御します。デフォルトは `$HOME/.local/share/TelegramDesktop` です。
- `--no-gateway-setup` は、OpenClaw を設定せずに Telegram Desktop をインストールして開きます。
- `--credential-source convex --credential-role ci` は、直接の Telegram 環境トークンではなく、共有クレデンシャルブローカーを使用します。

PR 公開シナリオはすべて、レポートの横に `mantis-evidence.json` を書き出します。
このスキーマは、シナリオコードと GitHub コメントの間の引き継ぎです。

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

アーティファクトの `path` 値は、マニフェストディレクトリからの相対パスです。`targetPath`
値は、`qa-artifacts` ブランチの公開ディレクトリ配下の相対パスです。
パブリッシャーはパストラバーサルを拒否し、任意のプレビューまたは動画が利用できない場合は
`"required": false` とマークされたエントリをスキップします。

サポートされるアーティファクト種別:

- `timeline`: 決定的なシナリオスクリーンショット。通常は前後比較。
- `desktopScreenshot`: VNC/ブラウザーデスクトップのスクリーンショット。
- `motionPreview`: デスクトップ録画から生成されたインラインアニメーション GIF。
- `motionClip`: 静的な冒頭と末尾を除去した、動きに合わせてトリミングされた MP4。
- `fullVideo`: 詳細調査用の完全な MP4 録画。
- `metadata`: JSON/ログのサイドカー。
- `report`: Markdown レポート。

再利用可能なパブリッシャーは `scripts/mantis/publish-pr-evidence.mjs` です。ワークフローは、
マニフェスト、対象 PR、`qa-artifacts` の対象ルート、コメントマーカー、Actions アーティファクト URL、
実行 URL、リクエストソースを指定して呼び出します。宣言されたアーティファクトを
`qa-artifacts` ブランチへコピーし、インライン画像/プレビューとリンク付き動画を含む
サマリー優先の PR コメントを作成してから、既存のマーカーコメントを更新するか、新規作成します。

PR コメントからステータスリアクションの実行を直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭くなっています。書き込み、メンテナンス、または管理者アクセス権を持つユーザーによる
プルリクエストコメントでのみ実行され、Discord ステータスリアクションリクエストだけを認識します。
デフォルトでは、既知の不良ベースライン ref と現在の PR head SHA を候補として使用します。
メンテナーはどちらの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram ライブ QA も PR コメントからトリガーできます。

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

デフォルトでは、現在の PR head SHA を候補として使用し、`telegram-status-command` を実行します。
特定の ref や事前にウォームアップした Crabbox デスクトップが必要な場合、メンテナーは
`candidate=...`、`provider=aws|hetzner`、`lease=<cbx_...>` を上書きできます。

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的で、シナリオに焦点を当てています。2 つ目は後で、
ラベル、変更ファイル、ClawSweeper レビュー所見から、PR または issue を推奨 Mantis シナリオに
マッピングできます。

## 実行ライフサイクル

1. クレデンシャルを取得します。
2. VM を割り当てるか再利用します。
3. シナリオが UI 証拠を必要とする場合、デスクトップ/ブラウザープロファイルを準備します。
4. ベースライン ref のクリーンなチェックアウトを準備します。
5. 依存関係をインストールし、シナリオが必要とするものだけをビルドします。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を開始します。
7. ライブトランスポート、プロバイダー、モデル、ブラウザープロファイルを設定します。
8. シナリオを実行し、ベースライン証拠をキャプチャします。
9. Gateway を停止し、ログを保持します。
10. 同じ VM で候補 ref を準備します。
11. 同じシナリオを実行し、候補証拠をキャプチャします。
12. オラクル結果と視覚証拠を比較します。
13. Markdown、JSON、ログ、スクリーンショット、任意のトレースアーティファクトを書き出します。
14. GitHub Actions アーティファクトをアップロードします。
15. 簡潔な PR または Discord ステータスメッセージを投稿します。

シナリオは、2 つの異なる方法で失敗できる必要があります。

- **バグを再現**: ベースラインが想定どおりの方法で失敗しました。
- **ハーネス失敗**: バグオラクルが意味を持つ前に、環境セットアップ、クレデンシャル、Discord API、ブラウザー、または
  プロバイダーが失敗しました。

最終レポートではこれらのケースを分け、メンテナーが不安定な環境をプロダクト挙動と混同しないようにする必要があります。

## Discord MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` のギルドチャンネルにおける
Discord ステータスリアクションを対象にする必要があります。

Mantis のよい種になる理由:

- トリガーメッセージ上のリアクションとして Discord で見えます。
- Discord メッセージリアクション状態を通じた強力な REST オラクルがあります。
- 実際の OpenClaw Gateway、Discord ボット認証、メッセージディスパッチ、
  ソース返信配信モード、ステータスリアクション状態、モデルターンのライフサイクルを実行します。
- 最初の実装を誠実に保てるほど狭い範囲です。

想定されるシナリオの形:

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

ベースライン証拠は、キュー済み確認リアクションがあるものの、tool-only モードでは
ライフサイクル遷移がないことを示す必要があります。候補証拠は、`messages.statusReactions.enabled` が明示的に
true の場合に、ライフサイクルステータスリアクションが実行されることを示す必要があります。

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

これは、常時有効のギルド処理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、明示的なステータスリアクションで SUT を設定します。オラクルは
実際の Discord トリガーメッセージをポーリングし、観測されたシーケンス
`👀 -> 🤔 -> 👍` を期待します。アーティファクトには `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html`、および
`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 部品

Mantis はゼロから始めるのではなく、既存のプライベート QA スタックを土台にする必要があります。

- `pnpm openclaw qa discord` は、ドライバーと SUT ボットを使うライブ Discord レーンをすでに実行しています。
- ライブトランスポートランナーは、`.artifacts/qa-e2e/` 配下にレポートと観測済みメッセージアーティファクトをすでに書き出します。
- Convex クレデンシャルリースは、共有ライブトランスポートクレデンシャルへの排他的アクセスをすでに提供します。
- ブラウザー制御サービスは、スクリーンショット、スナップショット、ヘッドレス管理プロファイル、リモート CDP プロファイルをすでにサポートしています。
- QA Lab には、トランスポート形状のテスト用デバッガー UI とバスがすでにあります。

最初の Mantis 実装は、これらの部品の上に薄い前後比較ランナーと、1 つの視覚証拠レイヤーを追加する形にできます。

## 証拠モデル

すべての実行は、安定したアーティファクトディレクトリを書き出します。

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

`mantis-summary.json` は機械可読な信頼できる情報源であるべきです。
Markdown レポートは PR コメントと人間によるレビュー用です。

サマリーには次を含める必要があります。

- テストした ref と SHA
- トランスポートとシナリオ ID
- マシンプロバイダーとマシン ID またはリース ID
- シークレット値を含まないクレデンシャルソース
- ベースライン結果
- 候補結果
- ベースラインでバグが再現したかどうか
- 候補がそれを修正したかどうか
- アーティファクトパス
- サニタイズ済みのセットアップまたはクリーンアップ問題

スクリーンショットは証拠であり、シークレットではありません。それでも墨消しの規律は必要です。
プライベートチャンネル名、ユーザー名、またはメッセージ内容が表示される場合があります。公開 PR では、
墨消し方針がより強固になるまで、インライン画像よりも GitHub Actions アーティファクトリンクを優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルトです。Chrome は CDP を有効にして実行され、
  Playwright または OpenClaw ブラウザー制御がスクリーンショットをキャプチャします。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、または視覚デバッグで人間が必要な場合に、同じ VM 上で有効化されます。

Discord オブザーバーブラウザープロファイルは、毎回ログインしなくて済む程度に永続的であるべきですが、
個人のブラウザー状態からは分離されている必要があります。プロファイルは開発者のラップトップではなく、
Mantis マシンプールに属します。

Mantis が停止した場合、次を含む Discord ステータスメッセージを投稿します。

- 実行 ID
- シナリオ ID
- マシンプロバイダー
- アーティファクトディレクトリ
- 利用可能な場合は VNC または noVNC の接続手順
- 短いブロッカー文

最初のプライベートデプロイは、これらのメッセージを既存のオペレーターチャンネルに投稿し、後で専用の Mantis チャンネルへ移行できます。

## マシン

Mantis は最初のリモート実装では Crabbox 経由の AWS を優先する必要があります。Crabbox は、ウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、クリーンアップを提供します。AWS のキャパシティが遅すぎる、または利用できない場合は、同じマシンインターフェイスの背後に Hetzner プロバイダーを追加します。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化用の CDP アクセス
- 復旧用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw のチェックアウトと依存関係キャッシュ
- Playwright を使用する場合の Playwright Chromium ブラウザーキャッシュ
- 1 つの OpenClaw Gateway、1 つのブラウザー、1 回のモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセス

VM は、想定される認証情報ストアまたはブラウザープロファイルストアの外に、長期間有効な生のシークレットを保持してはいけません。

## シークレット

シークレットは、リモート実行では GitHub organization またはリポジトリシークレットに、ローカル実行ではローカルのオペレーター管理シークレットファイルに置きます。

推奨されるシークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- パブリック GitHub アーティファクトアップロード用の `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期的には、Convex 認証情報プールをライブトランスポート認証情報の通常のソースとして維持する必要があります。GitHub シークレットはブローカーとフォールバックレーンをブートストラップします。Discord ステータスリアクションワークフローは、Mantis Crabbox シークレットを Crabbox CLI が想定する `CRABBOX_COORDINATOR` および `CRABBOX_COORDINATOR_TOKEN` 環境変数に対応付けます。プレーンな `CRABBOX_*` GitHub シークレット名は、互換性のあるフォールバックとして引き続き受け入れられます。

Mantis ランナーは次を絶対に出力してはいけません:

- Discord ボットトークン
- プロバイダー API キー
- ブラウザークッキー
- 認証プロファイルの内容
- VNC パスワード
- 生の認証情報ペイロード

パブリックアーティファクトのアップロードでは、ボット、ギルド、チャンネル、メッセージ ID などの Discord ターゲットメタデータも編集して秘匿する必要があります。このため、GitHub スモークワークフローでは `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

トークンが誤って issue、PR、チャット、ログに貼り付けられた場合は、新しいシークレットを保存した後にローテーションしてください。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期間有効な Actions アーティファクトとしてアップロードする必要があります。ワークフローがバグレポートまたは修正 PR に対して実行される場合は、編集済みの PNG スクリーンショットも `qa-artifacts` ブランチに公開し、そのバグまたは修正 PR にインラインの前後スクリーンショット付きコメントを upsert する必要があります。主要な証拠を汎用の QA 自動化 PR だけに投稿しないでください。生ログ、観測されたメッセージ、その他の大きな証拠は Actions アーティファクトに残します。

本番ワークフローは、それらのコメントを `github-actions[bot]` ではなく Mantis GitHub App で投稿する必要があります。アプリ ID と秘密鍵を `MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions シークレットとして保存します。ワークフローは非表示マーカーを upsert キーとして使用し、トークンが編集できる場合はそのコメントを更新し、古いボット所有マーカーを編集できない場合は Mantis 所有の新しいコメントを作成します。

PR コメントは短く、視覚的である必要があります:

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

ハーネスの失敗が原因で実行が失敗した場合、コメントは候補が失敗したかのように示すのではなく、その旨を述べる必要があります。

## プライベートデプロイに関するメモ

プライベートデプロイには、すでに Mantis Discord アプリケーションがある場合があります。適切なボット権限を持ち、安全にローテーションできる場合は、別のアプリを作成せずにそのアプリケーションを再利用してください。

初期のオペレーター通知チャンネルは、シークレットまたはデプロイ設定で指定します。最初は既存のメンテナーまたは運用チャンネルを指し、専用の Mantis チャンネルができたらそこへ移行できます。

ギルド ID、チャンネル ID、ボットトークン、ブラウザークッキー、VNC パスワードをこのドキュメントに記載しないでください。GitHub シークレット、認証情報ブローカー、またはオペレーターのローカルシークレットストアに保存してください。

## シナリオの追加

Mantis シナリオは次を宣言する必要があります:

- ID とタイトル
- トランスポート
- 必要な認証情報
- ベースライン ref ポリシー
- 候補 ref ポリシー
- OpenClaw 設定パッチ
- セットアップ手順
- 刺激
- 期待されるベースラインオラクル
- 期待される候補オラクル
- ビジュアルキャプチャターゲット
- タイムアウト予算
- クリーンアップ手順

シナリオでは、小さく型付けされたオラクルを優先する必要があります:

- リアクションバグ用の Discord リアクション状態
- スレッドバグ用の Discord メッセージ参照
- Slack バグ用の Slack スレッド ts とリアクション API 状態
- メールバグ用のメールメッセージ ID とヘッダー
- UI が唯一の信頼できる観測対象である場合のブラウザースクリーンショット

ビジョンチェックは追加的である必要があります。プラットフォーム API でバグを証明できる場合は、その API を合否判定オラクルとして使用し、スクリーンショットは人間の確信のために保持します。

## プロバイダー拡張

Discord の後、同じランナーは次を追加できます:

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- メール: コネクターだけでは不十分な場合の、`gog` を使用した Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションゲート、コマンド、利用可能な場合のリアクション。
- Matrix: 暗号化ルーム、スレッドまたは返信関係、再起動後の再開。

各トランスポートには、低コストなスモークシナリオを 1 つと、1 つ以上のバグクラスシナリオを用意する必要があります。高コストなビジュアルシナリオはオプトインのままにしてください。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どの Discord ボットをドライバーにし、どれを SUT にするべきですか？
- オブザーバーブラウザーのログインは、最初のフェーズで人間の Discord アカウント、テストアカウント、またはボットが読める REST 証拠のみのどれを使用するべきですか？
- GitHub は PR の Mantis アーティファクトをどのくらい保持するべきですか？
- ClawSweeper は、メンテナーコマンドを待つのではなく、いつ Mantis を自動的に推奨するべきですか？
- パブリック PR では、アップロード前にスクリーンショットを編集して秘匿する、またはクロップするべきですか？
