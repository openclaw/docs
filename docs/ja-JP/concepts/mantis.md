---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストへの変更前後の検証の追加
    - Discord、Slack、WhatsApp、その他のライブトランスポートシナリオの追加
    - 候補の参照に対して対象を絞った Control UI のブラウザー検証を実行中
    - スクリーンショット、ブラウザ自動化、または VNC アクセスを必要とする QA 実行のデバッグ
summary: Mantis は、実際のトランスポート比較と候補のみを対象としたブラウザの限定的な証明のために、視覚的なエンドツーエンドの証拠を取得し、その成果物を PR に添付します。
title: カマキリ
x-i18n:
    generated_at: "2026-07-11T22:06:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、OpenClaw の動作に関する視覚的な CI 証拠と PR コメントを公開します。
ライブトランスポートシナリオでは、既知の不良ベースラインと候補 ref を比較します。
一方、対象を絞ったブラウザレーンでは、決定論的なモックトランスポートに対して単一の候補を検証する場合があります。Discord は、実際のボット認証、ギルドチャンネル、リアクション、スレッド、ブラウザによる確認機能を備えた形で最初にリリースされました。Slack、Telegram、および対象を絞った Control UI チャットレーンも存在します。WhatsApp と Matrix は未実装です。

## 所有範囲

- OpenClaw (`extensions/qa-lab/src/mantis/*`): シナリオランタイム、`pnpm openclaw qa mantis <command>` CLI、証拠スキーマ。
- QA Lab (`extensions/qa-lab/src/live-transports/*`): ライブトランスポートハーネス、ドライバー/SUT ボット、レポート/証拠ライター。
- Crabbox (`openclaw/crabbox`): ウォームアップ済み Linux マシン、リース、VNC、`crabbox media preview`。
- GitHub Actions (`.github/workflows/mantis-*.yml`): リモートエントリーポイント、成果物の保持。
- ClawSweeper: メンテナーの PR コマンドを解析し、ワークフローをディスパッチして、最終的な PR コメントを投稿します。

## CLI コマンド

すべてのコマンドは `pnpm openclaw qa mantis <command>` 形式で、
`extensions/qa-lab/src/mantis/cli.ts` に定義されています。ビルド時および実行時に `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
が必要です（同梱のワークフローでは、ビルド前に `OPENCLAW_BUILD_PRIVATE_QA=1` と
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` を設定します）。

| コマンド                        | 目的                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord ボットがギルド/チャンネルを確認し、投稿とリアクションを実行できることを検証します。                                                       |
| `run`                           | ベースライン ref と候補 ref に対して変更前/変更後のシナリオを実行します（Discord のみ）。                                                               |
| `desktop-browser-smoke`         | Crabbox デスクトップをリースまたは再利用し、表示状態のブラウザを開いて、スクリーンショットと動画を取得します。                                          |
| `slack-desktop-smoke`           | Crabbox デスクトップをリースまたは再利用し、その中で Slack QA を実行して Slack Web を開き、証拠を取得します。                                           |
| `telegram-desktop-builder`      | Crabbox デスクトップをリースまたは再利用し、Telegram Desktop をインストールして、必要に応じて OpenClaw Gateway を設定します。                            |
| `visual-task` / `visual-driver` | 任意の画像理解アサーションに対応した汎用 Crabbox デスクトップキャプチャです。`visual-driver` は `crabbox record --while` 配下で起動されるドライバー側です。 |

すべてのコマンドは `--repo-root <path>` と `--output-dir <path>` を受け付けます。Crabbox
コマンドは、さらに `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl`、`--keep-lease` を受け付けます。特記がない限り、ローカル CLI の
プロバイダー/クラスのデフォルトは `hetzner`/`beast` です。CI ワークフローでは通常、その両方を
上書きします。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Discord REST API (`https://discord.com/api/v10`) を呼び出して、ボット
ユーザー、ギルド、ギルドのチャンネル、対象チャンネルを取得し、その
チャンネルがギルドに属することをアサートします。その後、`--skip-post` が指定されていない限り、メッセージを投稿して
`👀` リアクションを追加します。`mantis-discord-smoke-summary.json` と
`mantis-discord-smoke-report.md` を書き込みます。

トークンの解決順序は、`--token-file` の値、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（`--token-env` で上書き）、その次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
で指定されたファイル（`--token-file-env` で上書き）です。ギルド/チャンネル ID は
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（
`--guild-id` / `--channel-id` で上書き）から取得され、17～20 桁の Discord スノーフレークである必要があります。
公開される概要とレポート内のボット/ギルド/チャンネル/メッセージの ID
および名前を `<redacted>` に置き換えるには、`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を設定します。

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

現在、`--transport` は `discord` のみを受け付けます。`--scenario` は、2 つの
組み込み ID のいずれかです。それぞれに、固有のデフォルトベースライン ref と変更前/変更後の
期待ラベルがあります（`extensions/qa-lab/src/mantis/run.runtime.ts`）。

| シナリオ                                   | デフォルトベースライン                       | ベースラインの期待値                         | 候補の期待値                   |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | スレッド返信に `filePath` 添付が含まれない | スレッド返信に含まれる         |

`--candidate` のデフォルトは `HEAD` です。その他のフラグは、`--credential-source`
（デフォルトは `convex`）、`--credential-role`（デフォルトは `ci`）、`--provider-mode`
（デフォルトは `live-frontier`）、`--fast`（デフォルトで有効）、`--skip-install`、`--skip-build` です。

ランナーは、`<output-dir>/worktrees/` 配下にベースラインと
候補の detached `git worktree` チェックアウトを作成し、それぞれで
`pnpm install`/`pnpm build` を実行します（スキップされていない場合）。その後、各 worktree に対して
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
を実行します。各レーンは `discord-qa-reaction-timelines.json`
と `<scenario-id>-timeline.html`/`.png` の組を書き込みます。ランナーは、この
証拠を `baseline/`/`candidate/` 配下にコピーして戻し、出力ディレクトリに
`comparison.json`、`mantis-report.md`、`mantis-evidence.json` を書き込みます。
比較に合格しなかった場合（ベースラインが `fail`、候補が
`pass` でない場合）は、ゼロ以外の終了コードで終了します。

2 番目の Discord シナリオ（`discord-thread-reply-filepath-attachment`）は、
ドライバーボットで親メッセージを投稿し、実際のスレッドを作成して、リポジトリローカルの `filePath` を指定して SUT の
`message.thread-reply` アクションを呼び出します。その後、返信と添付ファイル名を確認するために
スレッドをポーリングします。`mantis-thread-report.md` という名前の添付ファイルを期待します。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Crabbox デスクトップをリースまたは再利用し、VNC セッション内で
`--browser-url`（デフォルトは `https://openclaw.ai`）またはレンダリング済みの
`--html-file` を指すブラウザを起動します。待機後、`scrot` でスクリーンショットを取得し、必要に応じて
`ffmpeg` で MP4 を録画して、`desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
を `--output-dir` に rsync でコピーして戻します。

フラグ:

- `--lease-id <cbx_...>` は、新規作成する代わりにウォームアップ済みデスクトップを再利用します。
- `--browser-profile-dir <remote-path>` は、リモートの Chrome ユーザーデータディレクトリを再利用します。これにより、永続デスクトップのログイン状態を実行間で維持できます（長期間使用する Discord Web 閲覧者プロファイルで使用されます）。
- `--browser-profile-archive-env <name>` は、起動前にその環境変数から base64 の `.tgz` Chrome プロファイルアーカイブを復元します（デフォルトは `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）。Discord Web など、ログイン済みの確認環境に使用されます。
- `--video-duration <seconds>` は MP4 の取得時間を制御します（デフォルトは 10 秒）。
- `--keep-lease`（または `OPENCLAW_MANTIS_KEEP_VM=1`）は、この実行で作成したリースを VNC 検査用に開いたままにします。リースを作成した実行が失敗した場合も、デフォルトでリースを維持します。

Discord Web の証拠には、Mantis はボット
トークンではなく専用の閲覧者アカウントを使用します。Discord REST オラクル（`qa discord` 経由）が引き続き信頼できる判定元です。
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは
Discord Web URL の成果物も書き込みます。また、`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` を指定すると、
ブラウザで開くのに十分な時間、スレッドを開いたままにします。

GitHub ワークフローは、
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` による永続的な閲覧者プロファイルを優先します（完全なプロファイルアーカイブは
GitHub のシークレットサイズ上限を超える可能性があります）。小規模なプロファイルや初期セットアップ用プロファイルでは、代わりに
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 の `.tgz` を復元できます。どちらの
ソースも設定されていない場合でも、ワークフローは決定論的な
ベースライン/候補のスクリーンショットを公開し、ログイン済み確認を
スキップしたことを記録します。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Crabbox デスクトップをリースまたは再利用し、チェックアウトを VM に同期して、その中で
`pnpm openclaw qa slack` を実行します。VNC ブラウザで Slack Web を開き、
デスクトップを取得して、Slack QA の成果物（`slack-qa/`）と
VNC のスクリーンショット/動画の両方をローカルにコピーして戻します。これは、
SUT Gateway とブラウザの両方が同じ VM 内で実行される唯一の Mantis 構成です。

`--gateway-setup` を指定すると、コマンドは VM 内の
`$HOME/.openclaw-mantis/slack-openclaw` に永続的で破棄可能な OpenClaw
ホームを作成し、対象チャンネル用に Slack
Socket Mode 設定をパッチして、
`openclaw gateway run --dev --allow-unconfigured --port 38973` を起動し、VNC セッション内で
Chrome を実行したままにします。`--gateway-setup` を省略すると、代わりに通常の
ボット間 Slack QA レーンを実行します。

`--credential-source env` に必要な環境変数（ローカルのデフォルトは `env`、
ロールのデフォルトは `maintainer`）:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`（ローカルで `OPENAI_API_KEY`
  のみが設定されている場合、Mantis は Crabbox の呼び出し前にそれを
  `OPENCLAW_LIVE_OPENAI_KEY` にコピーします）

`--credential-source convex` を指定すると、Mantis は VM を作成する前に共有プールから
Slack SUT 認証情報をリースし、チャンネル ID、アプリトークン、ボットトークンを
`OPENCLAW_MANTIS_SLACK_*` 環境変数として VM に転送します。そのため、GitHub
ワークフローに必要なのは生の Slack トークンではなく、Convex ブローカーのシークレットだけです。

その他のフラグ: `--slack-url <url>` は特定の URL を開きます（指定しない場合、Mantis は
`auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します）。
`--slack-channel-id <id>` は Gateway の許可リスト対象チャンネルを設定します。
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は VM 内の永続的な Chrome
プロファイルを制御します（デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile`）。
`--approval-checkpoints` はネイティブの Slack 承認シナリオ
（`slack-approval-exec-native`、`slack-approval-plugin-native`）を実行し、
Gateway セットアップの代わりに保留中/解決済みチェックポイントのスクリーンショットをレンダリングします（`--gateway-setup` とは
同時に使用できません）。`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model`、`--fast` は Slack
ライブレーンにそのまま渡されます。

承認チェックポイントのスクリーンショットは、ライブ Slack UI ではなく、
シナリオが観測した Slack API メッセージからレンダリングされます。`slack-desktop-smoke.png` が
Slack Web 自体の証拠となるのは、リースのブラウザプロファイルがすでにログイン済みの場合だけです。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Crabbox デスクトップをリースまたは再利用し、ネイティブ Linux Telegram Desktop をインストールし、
必要に応じてユーザーセッションのアーカイブを復元し、リースした Telegram SUT ボットトークンで
OpenClaw を設定して、
`openclaw gateway run --dev --allow-unconfigured --port 38974` を起動し、リースした
非公開グループにドライバーボットの準備完了メッセージを投稿してから、スクリーンショットと
MP4 をキャプチャします。ボットトークンは OpenClaw の設定にのみ使用され、Telegram Desktop
へのログインには一切使用されません。デスクトップビューアーは別個の Telegram ユーザーセッションであり、
`--telegram-profile-archive-env <name>` から復元するか、VNC を介して手動でログインし、
`--keep-lease` で維持します。

フラグ: `--lease-id <cbx_...>` は、Telegram Desktop にログイン済みの VM に対して
再実行します。`--telegram-profile-archive-env <name>` は、起動前に base64 形式の
`.tgz` プロファイルアーカイブを復元します。`--telegram-profile-dir <remote-path>`
はリモートプロファイルディレクトリを設定します（デフォルトは `$HOME/.local/share/TelegramDesktop`）。
`--no-gateway-setup` は Telegram Desktop のインストールと起動のみを行います。
`--credential-source`/`--credential-role` のデフォルトは `convex`/`maintainer` です。

## エビデンスマニフェスト

PR に公開する各シナリオは、レポートの隣に `mantis-evidence.json` を書き込みます。

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

アーティファクトの `path` はマニフェストのディレクトリからの相対パスであり、`targetPath` は
設定済みの R2/S3 アーティファクトプレフィックスからの相対パスです。`scripts/mantis/publish-pr-evidence.mjs`
はパストラバーサルを拒否し、ファイルが存在しない場合は `"required": false` のエントリを
スキップします。

アーティファクト種別: `timeline`（決定論的な変更前後のスクリーンショット）、
`desktopScreenshot`（VNC/ブラウザーのスクリーンショット）、`motionPreview`（録画から生成した
インラインアニメーション GIF）、`motionClip`（動きのある部分だけにトリミングした MP4）、
`fullVideo`（完全な録画）、`metadata`（JSON/ログのサイドカーファイル）、
`report`（Markdown レポート）。

実行時のディスク上のアーティファクト配置:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

スクリーンショットはエビデンスであり、シークレットではありませんが、それでも適切な墨消しが必要です。
非公開チャンネル名、ユーザー名、メッセージ内容が含まれる場合があります。公開アーティファクトの
アップロードでは `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を設定してください。Discord/Slack/Telegram
の GitHub ワークフローではデフォルトで有効です。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` は再利用可能な公開処理です。ワークフローは、
マニフェスト、対象 PR、アーティファクトの対象ルート、コメントマーカー、アーティファクト URL、
実行 URL、リクエスト元を指定してこれを呼び出します。宣言されたアーティファクトを Mantis R2
バケットにアップロードし、概要を先頭に配置した PR コメントをインライン画像/プレビューと
リンク付き動画で構築してから、既存のマーカーコメントを更新するか、新しいコメントを作成します。
必須の環境変数:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（ワークフローでは `openclaw-crabbox-artifacts` を設定）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（ワークフローでは `auto` を設定）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（ワークフローでは `https://artifacts.openclaw.ai` を設定）

コメントは `github-actions[bot]` ではなく、Mantis GitHub App（`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`）を介して投稿され、非表示のマーカーコメントを
アップサートキーとして使用します。

| ワークフロー                          | トリガー                                                                                    | 処理内容                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動ディスパッチ                                                                            | 選択した ref に対して `discord-smoke` を実行します。                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR コメントまたは手動ディスパッチ                                                              | ベースラインと候補のワークツリーを別々に構築し、それぞれで `discord-status-reactions-tool-only` を実行し、各レーンのタイムラインを Crabbox デスクトップブラウザーでレンダリングし、`crabbox media preview` で動きのある部分だけにトリミングした GIF/MP4 プレビューを生成し、アーティファクトをアップロードして、インラインの PR エビデンスを投稿します。                                 |
| `Mantis Scenario`                 | 手動ディスパッチ                                                                            | 汎用ディスパッチャーです。`scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number` を受け取り、対応するシナリオワークフローに転送します。 |
| `Mantis Slack Desktop Smoke`      | 手動ディスパッチ                                                                            | Crabbox Linux デスクトップをリースし（デフォルトは `aws`、`hetzner` も選択可能）、候補に対して `slack-desktop-smoke --gateway-setup` を実行し、デスクトップを録画し、モーションプレビューを生成してアーティファクトをアップロードし、PR 番号が指定されている場合は PR エビデンスを投稿します。                                                      |
| `Mantis Telegram Live`            | PR コメントまたは手動ディスパッチ                                                              | ボット API の Telegram ライブ QA レーン（`openclaw qa telegram`）を実行し、QA の概要から `mantis-evidence.json` を書き込み、Crabbox デスクトップブラウザーを介して墨消し済みのエビデンス HTML をレンダリングし、モーション GIF を生成して、PR エビデンスを投稿します。このレーンでは Telegram Web へのログインは不要です。                               |
| `Mantis Telegram Desktop Proof`   | メンテナー PR ラベル（`mantis: telegram-visible-proof`）と PR コメント、または手動ディスパッチ | エージェントによるネイティブ Telegram Desktop の変更前後のエビデンスです。PR、ベースライン/候補の ref、メンテナーの指示を Codex に渡し、Codex が両方の ref に対して実ユーザーの Crabbox Telegram Desktop エビデンスレーンを実行し、2 列の PR エビデンステーブルを投稿します。                                                              |
| `Mantis Web UI Chat Proof`        | PR コメントまたは手動ディスパッチ                                                              | 候補に対して OpenClaw Control UI チャットに特化した Playwright エビデンスを実行し、ブラウザーがモック化された Gateway を介して送信することを検証し、スクリーンショット/動画アーティファクトをキャプチャして、PR エビデンスを投稿します。このレーンは Web チャットのエビデンス専用であり、WinUI/ネイティブアプリや任意の視覚的エビデンスには対応しません。                           |

`Mantis Discord Status Reactions` と `Mantis Telegram Live` は、どちらも
`baseline_ref`/`candidate_ref`（または PR コメント内の `baseline=`/`candidate=`）を受け入れ、
シークレットを含む認証情報を使用して実行する前に、解決された SHA が `origin/main` の祖先、
リリースタグ（`v*`）、またはオープンな PR の head のいずれかであることを検証します。

write/maintain/admin 権限を持つ PR からのコメントトリガー:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram のコメントトリガーでは、デフォルトで PR の head SHA を候補、
`telegram-status-command` をシナリオとして使用します。また、`provider=aws|hetzner` と
`lease=<cbx_...>` を受け入れ、特定の Crabbox プロバイダーまたは事前ウォームアップ済みの
デスクトップを対象にできます。`Mantis Telegram Desktop Proof` は、PR に
`mantis: telegram-visible-proof` ラベルがすでに付いている場合にのみ PR コメントへ応答します。

Web UI チャットのコメントトリガーでは、デフォルトで PR の head SHA を候補として使用します。
Control UI のモック Gateway チャットエビデンスを実行し、ブラウザーアーティファクトを公開します。
その他の Web ページやネイティブアプリのサーフェスには、通常の Playwright/ブラウザーエビデンス、
メンテナーのスクリーンショット、Crabbox、またはローカルアーティファクトを使用してください。

ClawSweeper からシナリオを直接ディスパッチすることもできます。

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## マシンとシークレット

ローカル CLI の Crabbox デフォルトは `--provider hetzner --class beast` です。
`--provider`、`--class`/`--machine-class`、または
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` で
上書きできます。GitHub ワークフローでは通常、両方を上書きします（たとえば `--class standard`、
および Slack ワークフローの `aws`/`hetzner` プロバイダー選択入力）。プロバイダーが遅すぎるか
利用できない場合は、フォールバックをハードコードするのではなく、同じ Crabbox インターフェースの
背後に追加してください。

VM のベースライン: デスクトップ対応の Chrome/Chromium、CDP アクセス、VNC/
noVNC、Node 22 以降と pnpm、OpenClaw のチェックアウト、および対象トランスポート、GitHub、
モデルプロバイダー、認証情報ブローカーへの外向きアクセスを備えた Linux。

Mantis ワークフロー全体で使用されるシークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 公開アーティファクトのアップロード用の `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（ワークフローでは
  フォールバックとして `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` も受け入れ、
  Crabbox を呼び出す前に通常の名前へマッピングします）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis ランナーは、Discord/Slack/Telegram のボットトークン、プロバイダー API キー、
ブラウザー Cookie、認証プロファイルの内容、VNC パスワード、生の認証情報ペイロードを
決して出力してはなりません。トークンが issue、PR、チャット、ログに漏えいした場合は、
代替シークレットを保存した後にローテーションしてください。

## 実行結果

変更前後のトランスポートシナリオでは、不安定な環境が製品のリグレッションとして
解釈されないよう、次の結果を区別します。

- **バグを再現**: ベースラインがシナリオの想定どおりに失敗しました。
- **ハーネスの失敗**: オラクルが意味を持つ前に、環境設定、認証情報、トランスポート API、
  ブラウザー、またはプロバイダーが失敗しました。

候補のみのブラウザーエビデンスは、候補がモック Gateway と表示 UI のアサーションに
合格したかどうかを報告します。ベースラインを再現したとは主張しません。

## シナリオの追加

ライブトランスポートシナリオは、独立した宣言形式のファイルではなく、トランスポートごとに
TypeScript で定義されます（Discord の変更前後の形式については、
`extensions/qa-lab/src/mantis/run.runtime.ts` の `MANTIS_SCENARIO_CONFIGS` を参照）。
各シナリオには、ID とタイトル、トランスポート、必須の認証情報、ベースライン ref ポリシー、
候補 ref ポリシー、OpenClaw 設定パッチ、セットアップ/刺激手順、期待されるベースラインと
候補のオラクル、視覚的キャプチャ対象、タイムアウト予算、クリーンアップ手順が必要です。

候補のみを対象にした集中的なブラウザー証跡には、専用の決定論的 E2E テストとワークフローを使用できます。スコープを明示し、実行前に候補の ref を検証し、シークレットを利用する公開処理を分離して、同じ証跡マニフェストの契約を出力します。

視覚チェックよりも、小さく型付けされたオラクルを優先します。たとえば、Discord のリアクション状態やメッセージ参照、Slack スレッドの `ts`／リアクション API の状態、メールのメッセージ ID とヘッダーなどです。UI が唯一の信頼できる観測対象である場合はブラウザーのスクリーンショットを使用し、プラットフォーム API のオラクルが存在する場合は、視覚チェックをその補助として追加します。

Discord、Slack、Telegram に続き、同じランナー構成を WhatsApp（QR ログイン、再識別、配信、メディア、リアクション）と Matrix（暗号化ルーム、スレッド／返信の関連付け、再起動後の再開）にも拡張できますが、どちらもまだ実装されていません。

## 未解決の問題

- 既存の Mantis ボットを再利用する場合、どの Discord ボットをドライバーとし、どのボットを SUT とすべきですか？
- GitHub は PR の Mantis アーティファクトをどのくらいの期間保持すべきですか？
- ClawSweeper は、メンテナーのコマンドを待たず、どのタイミングで Mantis シナリオを自動的に推奨すべきですか？
- 公開 PR にアップロードする前に、スクリーンショットをマスキングまたはトリミングすべきですか？
