---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストに変更前後の検証を追加する
    - Discord、Slack、WhatsApp、その他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠を取得し、アーティファクトを PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-11T20:28:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 465ed7c994e8821fc64ca46a58de46cbec8b4ba687862b00398f7b0d22d62b44
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、そして目に見える証拠が必要なバグのための OpenClaw エンドツーエンド検証システムです。既知の不具合がある ref に対してシナリオを実行して証拠を取得し、同じシナリオを候補 ref に対して実行して、その比較を PR またはローカルコマンドからメンテナーが確認できるアーティファクトとして公開します。

Mantis は Discord から始まります。Discord は、実際のボット認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、そして人間がトランスポートに表示された内容を視覚的に確認できるブラウザー UI を備えた、価値の高い最初のレーンを提供するためです。

## 目標

- ユーザーが目にするものと同じトランスポート形状で、GitHub issue または PR のバグを再現する。
- 修正を適用する前に、ベースライン ref 上で **before** アーティファクトを取得する。
- 修正を適用した後に、候補 ref 上で **after** アーティファクトを取得する。
- 可能な場合は常に、Discord REST リアクションの読み取りやチャンネル transcript チェックなどの決定論的なオラクルを使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで、また GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が止まったときに VNC で救出できる十分なマシン状態を保持する。
- 実行がブロックされた場合、手動 VNC 支援が必要な場合、または完了した場合に、オペレーター用 Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis はユニットテストの代替ではありません。Mantis 実行は通常、修正内容が理解された後で、より小さな回帰テストになるべきです。
- Mantis は通常の高速 CI ゲートではありません。低速で、ライブ認証情報を使用し、ライブ環境が重要なバグのために予約されています。
- Mantis は通常運用で人間を必要とするべきではありません。手動 VNC は救出経路であり、正常系ではありません。
- Mantis は、生のシークレットをアーティファクト、ログ、スクリーンショット、Markdown レポート、PR コメントに保存しません。

## 所有範囲

Mantis は OpenClaw QA スタック内にあります。

- OpenClaw は、`pnpm openclaw qa mantis` 配下のシナリオランタイム、トランスポートアダプター、証拠スキーマ、ローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部分、ブラウザー取得ヘルパー、アーティファクト書き込みを所有します。
- Crabbox は、リモート VM が必要な場合のウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有します。
- ClawSweeper は、GitHub コメントルーティングを所有します。つまり、メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿です。
- OpenClaw エージェントは、シナリオにエージェント的なセットアップ、デバッグ、または停止状態レポートが必要な場合に、Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保たれます。

## コマンド形状

最初のローカルコマンドは、Discord ボット、ギルド、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before/after ランナーはこの形状を受け取ります。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは、出力ディレクトリ配下に分離されたベースラインと候補の worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証が成功したことは、ベースラインステータスが `fail`、候補ステータスが `pass` であることを意味します。

2 つ目の Discord before/after プローブは、スレッド添付ファイルを対象にします。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

このシナリオは、ドライバーボットで親メッセージを投稿し、実際の Discord スレッドを作成し、リポジトリローカルの `filePath` を指定して OpenClaw の `message.thread-reply` アクションを呼び出し、その後 SUT の返信と添付ファイル名をスレッドでポーリングします。ベースラインのスクリーンショットには添付ファイルのない返信が表示され、候補のスクリーンショットには期待される `mantis-thread-report.md` 添付ファイルが表示されます。

最初の VM/ブラウザープリミティブはデスクトップ smoke です。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で可視ブラウザーを起動し、デスクトップを取得し、アーティファクトをローカル出力ディレクトリへ取り戻し、再接続コマンドをレポートに書き込みます。このコマンドは、Mantis レーンでデスクトップ/VNC カバレッジが動作する最初のプロバイダーであるため、デフォルトで Hetzner プロバイダーを使用します。別の Crabbox fleet に対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

便利なデスクトップ smoke フラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、可視ブラウザーで開くページを変更します。
- `--html-file <path>` は、リポジトリローカルの HTML アーティファクトを可視ブラウザーでレンダリングします。Mantis はこれを使用して、生成された Discord ステータスリアクション timeline を実際の Crabbox デスクトップ経由で取得します。
- `--browser-profile-dir <remote-path>` は、リモート Chrome user-data-dir を再利用するため、永続 Mantis デスクトップが実行間でログイン状態を維持できます。長期稼働の Discord Web ビューアープロファイルに使用します。
- `--browser-profile-archive-env <name>` は、ブラウザー起動前に、指定された環境変数から base64 の `.tgz` Chrome user-data-dir アーカイブを復元します。Discord Web など、ログイン済みの witness に使用します。デフォルトの環境変数は `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` です。
- `--video-duration <seconds>` は MP4 取得長を制御します。安定するまで時間が必要な、低速のログイン済み Web アプリには長めの時間を使用します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新しく作成され成功したリースを VNC 検査用に開いたままにします。失敗した実行では、オペレーターが再接続できるように、作成されたリースはデフォルトで保持されます。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース寿命を調整します。

Discord Web の証拠には、Mantis はボットトークンではなく専用のビューアーアカウントを使用します。ライブ Discord API シナリオは引き続きオラクルです。実際のスレッドを作成し、SUT の `thread-reply` を送信し、Discord REST を通じて添付ファイルを確認します。`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは Discord Web URL アーティファクトも書き込みます。`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` が設定されている場合、ログイン済みブラウザーが開いて記録できるだけの時間、そのスレッドを利用可能なまま残します。

GitHub ワークフローは、Discord Web で候補スレッド URL を開き、スクリーンショットを取得し、MP4 を記録し、Crabbox メディアツールが利用可能な場合はトリミング済み GIF プレビューを生成します。フル Chrome プロファイルアーカイブは GitHub のシークレットサイズ制限を超える可能性があるため、`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` で設定された永続ビューアープロファイルパスを優先してください。小さな/bootstrap プロファイルの場合、ワークフローは `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 の `.tgz` アーカイブを復元することもできます。どちらのプロファイルソースも設定されていない場合でも、ワークフローは決定論的なベースライン/候補の添付ファイルスクリーンショットを公開し、ログイン済み Discord Web witness がスキップされたという notice をログに記録します。

最初の完全なデスクトップトランスポートプリミティブは Slack デスクトップ smoke です。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在のチェックアウトを VM に同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、可視デスクトップを取得し、Slack QA アーティファクトと VNC スクリーンショットの両方をローカル出力ディレクトリへコピーします。これは、SUT の OpenClaw gateway とブラウザーの両方が同じ Linux デスクトップ VM 内に存在する最初の Mantis 形状です。

`--gateway-setup` を指定すると、このコマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的な使い捨て OpenClaw home を準備し、選択したチャンネル向けに Slack Socket Mode 設定をパッチし、ポート `38973` で `openclaw gateway run` を開始し、VNC セッション内で Chrome を実行したままにします。これは「Slack と claw が動作している Linux デスクトップを残しておく」モードです。`--gateway-setup` が省略された場合は、ボット間 Slack QA レーンが引き続きデフォルトです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` のみが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` にマッピングし、Crabbox の `OPENCLAW_*` 環境転送で VM 内へ運べるようにします。

`--gateway-setup --credential-source convex` を指定すると、Mantis は VM を作成する前に共有プールから Slack SUT 認証情報をリースし、リースされたチャンネル ID、Socket Mode アプリトークン、ボットトークンをデスクトップ内の `OPENCLAW_MANTIS_SLACK_*` ランタイム環境変数として転送します。これにより、GitHub ワークフローは薄く保たれます。必要なのは Convex broker シークレットだけで、生の Slack ボットトークンやアプリトークンは不要です。

便利な Slack デスクトップフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしているマシンに対して再実行します。
- `--gateway-setup` は、ボット間 QA レーンだけを実行する代わりに、VM 内で永続的な OpenClaw Slack Gateway を開始します。
- `--keep-lease` は成功後も Gateway VM を VNC 検査用に開いたままにします。`--no-keep-lease` はアーティファクト収集後に停止します。
- `--slack-url <url>` は、特定の Slack Web URL を開きます。指定しない場合、SUT ボットトークンが利用可能であれば、Mantis は Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、Gateway セットアップで使用される Slack チャンネル allowlist を制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続 Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` であるため、手動 Slack Web ログインは同じリース上での再実行後も維持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack 環境トークンではなく共有認証情報プールを使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は、Slack ライブレーンへそのまま渡されます。

GitHub smoke ワークフローは `Mantis Discord Smoke` です。最初の実シナリオの before/after GitHub ワークフローは `Mantis Discord Status Reactions` です。次を受け取ります。

- `baseline_ref`: queued-only 動作を再現することが期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すことが期待される ref。

これはワークフローハーネス ref をチェックアウトし、別々のベースラインと候補 worktree をビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、各レーンの timeline HTML を Crabbox デスクトップブラウザーでレンダリングし、その VNC スクリーンショットを、決定論的な timeline PNG と並べて PR コメントに公開します。同じ PR コメントには、`crabbox media preview` によって生成された軽量のモーショントリミング済み GIF プレビューを埋め込み、対応するモーショントリミング済み MP4 クリップへリンクし、詳細検査用にフルデスクトップ MP4 ファイルを保持します。スクリーンショットはすばやいレビューのためにインラインのままです。このワークフローは、次の Crabbox バイナリリリースが切られる前に現在のデスクトップ/ブラウザーリースフラグを使用できるよう、`openclaw/crabbox` main から Crabbox CLI をビルドします。

`Mantis Scenario` は汎用の手動エントリーポイントです。`scenario_id`、`candidate_ref`、任意の `baseline_ref`、任意の `pr_number` を受け取り、シナリオ所有のワークフローをディスパッチします。この wrapper は意図的に薄く作られています。シナリオワークフローは引き続き、自身のトランスポートセットアップ、認証情報、VM クラス、期待されるオラクル、アーティファクト manifest を所有します。

`Mantis Slack Desktop Smoke` は最初の Slack VM ワークフローです。これは別の worktree で信頼済み candidate ref をチェックアウトし、Crabbox Linux デスクトップをリースし、その candidate に対して `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` を実行し、VNC ブラウザーで Slack Web を開き、デスクトップを録画し、`crabbox media preview` でモーションをトリミングしたプレビューを生成し、完全な artifact ディレクトリをアップロードし、任意で対象 PR にインライン証拠コメントを投稿します。デスクトップリースのデフォルトは AWS で、手動の provider 入力を公開しているため、AWS のキャパシティが遅い、または利用できない場合にオペレーターは Hetzner に切り替えられます。bot 間だけの Slack transcript ではなく、「Slack と claw が動作している Linux デスクトップ」が必要な場合にこの lane を使用します。

`Mantis Telegram Live` は、既存の Telegram live QA lane を同じ PR 証拠パイプラインでラップします。別の worktree で信頼済み candidate ref をチェックアウトし、`pnpm openclaw qa telegram --credential-source convex
--credential-role ci` を実行し、Telegram QA summary と observed-message artifact から `mantis-evidence.json` manifest を書き込み、Crabbox デスクトップブラウザーを通じて redact 済み transcript HTML をレンダリングし、`crabbox media preview` でモーションをトリミングした GIF を生成し、PR 番号が利用可能な場合はインライン PR 証拠コメントを投稿します。この lane はログイン済み Telegram Web の証拠ではなく、transcript の視覚証拠です。Telegram Bot API は安定した live message 証拠を提供しますが、通常の Mantis automation に Telegram Web のログイン状態は不要です。

`Mantis Telegram Desktop Proof` は、agentic なネイティブ Telegram Desktop の before/after ラッパーです。メンテナーは PR コメントの `@Mantis telegram desktop proof`、Actions UI の自由形式の指示、または汎用 `Mantis Scenario` dispatcher からトリガーできます。ワークフローは PR、baseline ref、candidate ref、メンテナーの指示を Codex に渡します。agent は PR を読み、変更を証明する Telegram 上で見える挙動を決定し、baseline と candidate に対して実ユーザーの Crabbox Telegram Desktop proof lane を実行し、ネイティブ GIF が有用になるまで反復し、ペアの `motionPreview` artifact を `mantis-evidence.json` に書き込み、bundle をアップロードし、PR 番号が利用可能な場合は 2 列の PR 証拠テーブルを投稿します。

人間が介在する Telegram デスクトップセットアップには、scenario builder を使用します。

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

builder は Crabbox デスクトップをリースまたは再利用し、ネイティブ Linux Telegram Desktop バイナリをインストールし、任意でユーザーセッション archive を復元し、リースされた Telegram SUT bot token で OpenClaw を構成し、port `38974` で `openclaw gateway run` を開始し、リースされた private group に driver-bot readiness message を投稿し、その後、表示中の VNC デスクトップから screenshot と MP4 を取得します。bot token が Telegram Desktop にログインすることはありません。これは OpenClaw の構成にのみ使用されます。desktop viewer は、`--telegram-profile-archive-env <name>` から復元されるか、VNC で手動作成され、`--keep-lease` で維持される、別の Telegram user session です。

有用な Telegram desktop builder flags:

- `--lease-id <cbx_...>` は、オペレーターがすでに Telegram Desktop にログイン済みの VM に対して再実行します。
- `--telegram-profile-archive-env <name>` は、その env var から base64 の `.tgz` Telegram Desktop profile archive を読み取り、起動前に復元します。
- `--telegram-profile-dir <remote-path>` は remote Telegram Desktop profile directory を制御します。デフォルトは `$HOME/.local/share/TelegramDesktop` です。
- `--no-gateway-setup` は、OpenClaw を構成せずに Telegram Desktop をインストールして開きます。
- `--credential-source convex --credential-role ci` は、直接の Telegram env token の代わりに shared credential broker を使用します。

PR を公開するすべての scenario は、その report の隣に `mantis-evidence.json` を書き込みます。この schema は scenario code と GitHub comment の間の引き渡しです。

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

Artifact の `path` values は manifest directory からの相対パスです。`targetPath` values は `qa-artifacts` branch publish directory 配下の相対パスです。publisher は path traversal を拒否し、optional previews または videos が利用できない場合は `"required": false` とマークされた entries をスキップします。

サポートされる artifact kinds:

- `timeline`: deterministic scenario screenshot。通常は before/after です。
- `desktopScreenshot`: VNC/browser desktop screenshot。
- `motionPreview`: desktop recording から生成された inline animated GIF。
- `motionClip`: static な lead-in と tail を除去した、motion-trimmed MP4。
- `fullVideo`: 詳細調査用の full MP4 recording。
- `metadata`: JSON/log sidecar。
- `report`: Markdown report。

再利用可能な publisher は `scripts/mantis/publish-pr-evidence.mjs` です。ワークフローは manifest、target PR、`qa-artifacts` target root、comment marker、Actions artifact URL、run URL、request source を指定してこれを呼び出します。これは宣言された artifact を `qa-artifacts` branch にコピーし、inline images/previews と linked videos を含む summary-first の PR comment を作成し、その後、既存の marker comment を更新するか新規作成します。

PR コメントから status-reactions run を直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

comment trigger は意図的に狭くしています。これは write、maintain、または admin access を持つユーザーによる pull request comments でのみ実行され、Discord status-reaction requests だけを認識します。デフォルトでは、既知の bad baseline ref と現在の PR head SHA を candidate として使用します。メンテナーはどちらの ref も override できます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

Telegram live QA も PR コメントからトリガーできます。

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

デフォルトでは、現在の PR head SHA を candidate として使用し、`telegram-status-command` を実行します。特定の ref または事前ウォーム済みの Crabbox desktop が必要な場合、メンテナーは `candidate=...`、`provider=aws|hetzner`、`lease=<cbx_...>` を override できます。

ClawSweeper command examples:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初の command は明示的で scenario-focused です。2 つ目は後で、labels、changed files、ClawSweeper review findings から、PR または issue を推奨 Mantis scenarios に map できます。

## 実行ライフサイクル

1. credentials を取得します。
2. VM を割り当てるか再利用します。
3. scenario が UI 証拠を必要とする場合は、desktop/browser profile を準備します。
4. baseline ref 用の clean checkout を準備します。
5. dependencies をインストールし、scenario が必要とするものだけを build します。
6. isolated state directory で child OpenClaw Gateway を開始します。
7. live transport、provider、model、browser profile を構成します。
8. scenario を実行し、baseline evidence を取得します。
9. gateway を停止し、logs を保持します。
10. 同じ VM で candidate ref を準備します。
11. 同じ scenario を実行し、candidate evidence を取得します。
12. oracle results と visual evidence を比較します。
13. Markdown、JSON、logs、screenshots、optional trace artifacts を書き込みます。
14. GitHub Actions artifacts をアップロードします。
15. 簡潔な PR または Discord status message を投稿します。

scenario は、2 つの異なる方法で失敗できる必要があります。

- **Bug reproduced**: baseline が想定どおりの失敗をしました。
- **Harness failure**: bug oracle が意味を持つ前に、environment setup、credentials、Discord API、browser、または provider が失敗しました。

final report はこれらのケースを分離し、メンテナーが flaky な environment と product behavior を混同しないようにする必要があります。

## Discord MVP

最初の scenario は、source reply delivery mode が `message_tool_only` の guild channels における Discord status reactions を対象にする必要があります。

これが Mantis の seed として適している理由:

- triggering message 上の reactions として Discord で見えます。
- Discord message reaction state を通じた強い REST oracle があります。
- 実際の OpenClaw Gateway、Discord bot auth、message dispatch、source reply delivery mode、status reaction state、model turn lifecycle を動かします。
- 最初の実装を誠実に保つのに十分狭い範囲です。

想定される scenario shape:

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

Baseline evidence は queued acknowledgement reaction を示す必要がありますが、tool-only mode では lifecycle transition を示すべきではありません。Candidate evidence は、`messages.statusReactions.enabled` が明示的に true の場合に lifecycle status reactions が実行されることを示す必要があります。

実行可能な最初の slice は、opt-in Discord live QA scenario です。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

これは、always-on guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、および明示的な status reactions で SUT を構成します。oracle は実際の Discord triggering message を poll し、observed sequence `👀 -> 🤔 -> 👍` を期待します。Artifacts には `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html`、`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 要素

Mantis はゼロから始めるのではなく、既存の private QA stack の上に構築する必要があります。

- `pnpm openclaw qa discord` は、driver と SUT bots を使用する live Discord lane をすでに実行します。
- live transport runner は、`.artifacts/qa-e2e/` 配下に reports と observed-message artifacts をすでに書き込みます。
- Convex credential leases は、shared live transport credentials への exclusive access をすでに提供します。
- browser control service は、screenshots、snapshots、headless managed profiles、remote CDP profiles をすでにサポートしています。
- QA Lab には、transport-shaped testing 用の debugger UI と bus がすでにあります。

最初の Mantis 実装は、これらの要素の上に薄い before/after runner と 1 つの visual evidence layer を追加したものにできます。

## 証拠モデル

すべての run は stable artifact directory を書き込みます。

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

`mantis-summary.json` は machine-readable な source of truth であるべきです。Markdown report は PR comments と human review 用です。

summary には以下を含める必要があります。

- テストした refs と SHAs
- transport と scenario id
- machine provider と machine id または lease id
- secret values を含まない credential source
- baseline result
- candidate result
- bug が baseline で再現したかどうか
- candidate がそれを修正したかどうか
- artifact paths
- sanitized setup または cleanup issues

スクリーンショットは証拠であり、秘密情報ではありません。それでも、秘匿化の規律は必要です。
非公開チャンネル名、ユーザー名、メッセージ内容が表示される場合があります。公開 PR では、
秘匿化の方針がより強固になるまで、インライン画像より GitHub Actions のアーティファクトリンクを
優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルトです。Chrome は CDP を有効にして実行され、
  Playwright または OpenClaw のブラウザー制御がスクリーンショットを取得します。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、
  または視覚的なデバッグに人の介入が必要な場合、同じ VM で有効にします。

Discord オブザーバーのブラウザープロファイルは、実行のたびに
ログインしなくて済む程度に永続化しつつ、個人のブラウザー状態からは分離する必要があります。プロファイルは
開発者のラップトップではなく、Mantis マシンプールに属します。

Mantis が停止した場合、次の内容を含む Discord ステータスメッセージを投稿します。

- 実行 ID
- シナリオ ID
- マシンプロバイダー
- アーティファクトディレクトリ
- 利用可能な場合は VNC または noVNC の接続手順
- 短いブロッカー説明

最初の非公開デプロイでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、
後で専用の Mantis チャンネルへ移行できます。

## マシン

最初のリモート実装では、Mantis は Crabbox 経由の AWS を優先するべきです。
Crabbox は、ウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、
クリーンアップを提供します。AWS の容量が遅すぎるか利用できない場合は、同じマシンインターフェースの
背後に Hetzner プロバイダーを追加します。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化のための CDP アクセス
- レスキュー用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw のチェックアウトと依存関係キャッシュ
- Playwright を使用する場合の Playwright Chromium ブラウザーキャッシュ
- 1 つの OpenClaw Gateway、1 つのブラウザー、1 回のモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセス

VM は、想定された認証情報ストアまたはブラウザープロファイルストアの外に、長期存続する生の秘密情報を保持するべきではありません。

## シークレット

リモート実行では秘密情報は GitHub の組織またはリポジトリシークレットに置き、
ローカル実行ではオペレーター管理のローカルシークレットファイルに置きます。

推奨されるシークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- 公開 GitHub アーティファクトアップロード用の `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期的には、Convex の認証情報プールをライブトランスポート認証情報の通常の供給元として維持するべきです。
GitHub シークレットは、ブローカーとフォールバックレーンをブートストラップします。
Discord ステータスリアクションワークフローは、Mantis Crabbox シークレットを
Crabbox CLI が想定する `CRABBOX_COORDINATOR` と `CRABBOX_COORDINATOR_TOKEN` 環境変数へ対応付けます。
互換性のフォールバックとして、プレーンな `CRABBOX_*` GitHub シークレット名も引き続き受け付けます。

Mantis ランナーは次を決して出力してはいけません。

- Discord ボットトークン
- プロバイダー API キー
- ブラウザークッキー
- 認証プロファイルの内容
- VNC パスワード
- 生の認証情報ペイロード

公開アーティファクトのアップロードでは、ボット、ギルド、チャンネル、メッセージ ID などの
Discord ターゲットメタデータも秘匿化するべきです。GitHub スモークワークフローは
この理由で `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

トークンが誤って issue、PR、チャット、ログに貼り付けられた場合は、
新しいシークレットを保存した後でローテーションしてください。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期保存の Actions アーティファクトとしてアップロードするべきです。
ワークフローがバグレポートまたは修正 PR のために実行された場合は、
秘匿化済みの PNG スクリーンショットも `qa-artifacts` ブランチに公開し、
そのバグまたは修正 PR にインラインの前後比較スクリーンショット付きコメントを upsert するべきです。
主要な証拠を汎用の QA 自動化 PR だけに投稿しないでください。生ログ、観測された
メッセージ、その他の大きな証拠は Actions アーティファクトに残します。

本番ワークフローでは、それらのコメントを `github-actions[bot]` ではなく
Mantis GitHub App で投稿するべきです。アプリ ID と秘密鍵は
`MANTIS_GITHUB_APP_ID` と `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions
シークレットとして保存します。ワークフローは非表示マーカーを upsert キーとして使用し、
トークンが編集できる場合はそのコメントを更新し、古い bot 所有のマーカーを編集できない場合は
Mantis 所有の新しいコメントを作成します。

PR コメントは短く、視覚的にするべきです。

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

ハーネスの失敗によって実行が失敗した場合、コメントでは候補が失敗したかのように示すのではなく、
そのことを明記しなければなりません。

## 非公開デプロイメモ

非公開デプロイには、すでに Mantis Discord アプリケーションがある場合があります。
そのアプリケーションに適切なボット権限があり、安全にローテーションできる場合は、
別のアプリを作成する代わりに再利用してください。

初期のオペレーター通知チャンネルは、シークレットまたはデプロイ設定で指定します。
最初は既存のメンテナーまたは運用チャンネルを指し、その後、専用の Mantis チャンネルが
作成されたらそこへ移行できます。

ギルド ID、チャンネル ID、ボットトークン、ブラウザークッキー、VNC パスワードを
このドキュメントに記載しないでください。GitHub シークレット、認証情報ブローカー、
またはオペレーターのローカルシークレットストアに保存してください。

## シナリオの追加

Mantis シナリオは次を宣言するべきです。

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
- 視覚キャプチャターゲット
- タイムアウト予算
- クリーンアップ手順

シナリオでは、小さく型付けされたオラクルを優先するべきです。

- リアクションバグには Discord リアクション状態
- スレッドバグには Discord メッセージ参照
- Slack バグには Slack スレッド ts とリアクション API 状態
- メールバグにはメールメッセージ ID とヘッダー
- UI が唯一の信頼できる観測対象である場合はブラウザースクリーンショット

ビジョンチェックは追加的であるべきです。プラットフォーム API でバグを証明できる場合は、
その API を合否オラクルとして使用し、スクリーンショットは人間の信頼性確認のために保持してください。

## プロバイダー拡張

Discord の後、同じランナーに次を追加できます。

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- メール: コネクターでは不十分な場合の `gog` を使った Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションゲーティング、コマンド、利用可能な場合はリアクション。
- Matrix: 暗号化ルーム、スレッドまたは返信関係、再起動後の再開。

各トランスポートには、安価なスモークシナリオを 1 つと、1 つ以上のバグクラスシナリオを用意するべきです。
高コストの視覚シナリオはオプトインのままにしてください。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どの Discord ボットをドライバーにし、
  どれを SUT にするべきか?
- 最初のフェーズでは、オブザーバーブラウザーのログインに人間の Discord アカウント、テストアカウント、
  またはボットが読める REST 証拠のみのどれを使用するべきか?
- GitHub は PR 用の Mantis アーティファクトをどれくらいの期間保持するべきか?
- ClawSweeper は、メンテナーコマンドを待つ代わりに、いつ Mantis を自動的に推奨するべきか?
- 公開 PR では、アップロード前にスクリーンショットを秘匿化またはクロップするべきか?
