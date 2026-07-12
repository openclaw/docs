---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストに変更前後の検証を追加する
    - Discord、Slack、WhatsApp、その他のライブトランスポートシナリオの追加
    - 候補 ref に対する Control UI の重点的なブラウザ検証を実行する
    - スクリーンショット、ブラウザ自動化、またはVNCアクセスを必要とするQA実行のデバッグ
summary: Mantis は、ライブトランスポート比較および候補のみを対象としたブラウザ検証のために視覚的なエンドツーエンドの証跡を取得し、その成果物を PR に添付します。
title: Mantis
x-i18n:
    generated_at: "2026-07-12T14:25:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 86b65ae8503b23407b600aa08f16940f9fcaa9a4e598963f7f878a3b336784f0
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、OpenClaw の動作に関する視覚的な CI 証跡と PR コメントを公開します。
ライブトランスポートシナリオでは、既知の不良ベースラインと候補 ref を比較します。
一方、対象を絞ったブラウザレーンでは、決定論的なモックトランスポートに対して、
1 つの候補のみを検証する場合があります。Discord は、実際のボット認証、ギルドチャンネル、
リアクション、スレッド、ブラウザによる目視確認に最初に対応しました。Slack、Telegram、および対象を絞った Control
UI チャットレーンも存在します。WhatsApp と Matrix は未実装です。

## 所有範囲

- OpenClaw（`extensions/qa-lab/src/mantis/*`）：シナリオランタイム、`pnpm openclaw qa mantis <command>` CLI、証跡スキーマ。
- QA Lab（`extensions/qa-lab/src/live-transports/*`）：ライブトランスポートハーネス、ドライバー/SUT ボット、レポート/証跡ライター。
- Crabbox（`openclaw/crabbox`）：ウォームアップ済み Linux マシン、リース、VNC、`crabbox media preview`。
- GitHub Actions（`.github/workflows/mantis-*.yml`）：リモートエントリーポイント、アーティファクト保持。
- ClawSweeper：メンテナーの PR コマンドを解析し、ワークフローをディスパッチして、最終的な PR コメントを投稿します。

## CLI コマンド

すべてのコマンドは `pnpm openclaw qa mantis <command>` であり、
`extensions/qa-lab/src/mantis/cli.ts` で定義されています。ビルド時および実行時に `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
が必要です（同梱ワークフローではビルド前に `OPENCLAW_BUILD_PRIVATE_QA=1` と
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` を設定します）。

| コマンド                        | 目的                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord ボットがギルド/チャンネルを認識し、投稿とリアクションを実行できることを検証します。                                                       |
| `run`                           | ベースライン ref と候補 ref に対して変更前/変更後シナリオを実行します（Discord のみ）。                                                                  |
| `desktop-browser-smoke`         | Crabbox デスクトップをリースまたは再利用し、表示可能なブラウザを開いて、スクリーンショットと動画を取得します。                                           |
| `slack-desktop-smoke`           | Crabbox デスクトップをリースまたは再利用し、その中で Slack QA を実行して Slack Web を開き、証跡を取得します。                                             |
| `telegram-desktop-builder`      | Crabbox デスクトップをリースまたは再利用し、Telegram Desktop をインストールして、必要に応じて OpenClaw Gateway を構成します。                             |
| `visual-task` / `visual-driver` | 任意の画像理解アサーションに対応する汎用 Crabbox デスクトップキャプチャです。`visual-driver` は `crabbox record --while` 配下で起動されるドライバー側です。 |

すべてのコマンドで `--repo-root <path>` と `--output-dir <path>` を指定できます。Crabbox
コマンドではさらに、`--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl`、`--keep-lease` も指定できます。ローカル CLI の
provider/class のデフォルトは、特に記載がない限り `hetzner`/`beast` です。CI ワークフローでは
通常、両方を上書きします。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Discord REST API（`https://discord.com/api/v10`）を呼び出してボット
ユーザー、ギルド、ギルドのチャンネル、および対象チャンネルを取得し、
そのチャンネルがギルドに属することをアサートします。その後、`--skip-post` を指定しない限り、メッセージを投稿して
`👀` リアクションを追加します。`mantis-discord-smoke-summary.json` と
`mantis-discord-smoke-report.md` を書き出します。

トークンの解決順序は、`--token-file` の値、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（`--token-env` で上書き）、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE`
で指定されたファイル（`--token-file-env` で上書き）です。ギルド/チャンネル ID は
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID` から取得し（
`--guild-id` / `--channel-id` で上書き）、17～20 桁の Discord snowflake である必要があります。
公開されるサマリーとレポート内のボット/ギルド/チャンネル/メッセージの ID
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

現在、`--transport` には `discord` のみ指定できます。`--scenario` は 2 つの
組み込み ID のいずれかで、それぞれ独自のデフォルトベースライン ref と、期待される変更前/変更後の
ラベルを持ちます（`extensions/qa-lab/src/mantis/run.runtime.ts`）。

| シナリオ                                   | デフォルトベースライン                       | ベースラインの期待値                        | 候補の期待値                   |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | スレッド返信で `filePath` 添付が省略される | スレッド返信に含まれる        |

`--candidate` のデフォルトは `HEAD` です。その他のフラグ：`--credential-source`
（デフォルトは `convex`）、`--credential-role`（デフォルトは `ci`）、`--provider-mode`
（デフォルトは `live-frontier`）、`--fast`（デフォルトで有効）、`--skip-install`、`--skip-build`。

ランナーは、ベースラインと候補について detached 状態の `git worktree` チェックアウトを
`<output-dir>/worktrees/` 配下に作成し、それぞれで `pnpm install`/`pnpm build` を実行し
（スキップされていない場合）、その後、各 worktree に対して
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
を実行します。各レーンは `discord-qa-reaction-timelines.json`
と `<scenario-id>-timeline.html`/`.png` のペアを書き出します。ランナーはこの
証跡を `baseline/`/`candidate/` 配下へコピーし、出力ディレクトリに
`comparison.json`、`mantis-report.md`、`mantis-evidence.json` を書き出します。また、
比較が成功しなかった場合（ベースラインが `fail`、候補が `pass` ではない場合）は、
0 以外の終了コードで終了します。

2 番目の Discord シナリオ（`discord-thread-reply-filepath-attachment`）では、
ドライバーボットで親メッセージを投稿し、実際のスレッドを作成して、リポジトリローカルの
`filePath` を指定して SUT の `message.thread-reply` アクションを呼び出します。その後、
返信と添付ファイル名を確認するためにスレッドをポーリングします。このシナリオでは、
`mantis-thread-report.md` という名前の添付ファイルを期待します。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Crabbox デスクトップをリースまたは再利用し、VNC セッション内で、
`--browser-url`（デフォルトは `https://openclaw.ai`）またはレンダリング済みの
`--html-file` を開くブラウザを起動します。待機後、`scrot` でスクリーンショットを取得し、
必要に応じて `ffmpeg` で MP4 を録画して、`desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
を `--output-dir` に rsync で戻します。

フラグ：

- `--lease-id <cbx_...>` は、新規作成せずにウォームアップ済みデスクトップを再利用します。
- `--browser-profile-dir <remote-path>` は、リモートの Chrome user-data-dir を再利用し、永続デスクトップで実行間のログイン状態を維持します（長期間使用する Discord Web 閲覧者プロファイルで使用）。
- `--browser-profile-archive-env <name>` は、起動前にその環境変数から base64 `.tgz` Chrome プロファイルアーカイブを復元します（デフォルトは `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）。Discord Web など、ログイン済みの目視確認に使用します。
- `--video-duration <seconds>` は MP4 の取得時間を制御します（デフォルトは 10 秒）。
- `--keep-lease`（または `OPENCLAW_MANTIS_KEEP_VM=1`）は、この実行で作成したリースを VNC で確認できるよう開いたままにします。リースを作成した実行が失敗した場合も、デフォルトで開いたままになります。

Discord Web の証跡には、Mantis はボット
トークンではなく専用の閲覧者アカウントを使用します。Discord REST オラクル（`qa discord` 経由）が引き続き信頼できる基準です。
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは
Discord Web URL アーティファクトも書き出します。また、`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` は、
ブラウザが開けるよう十分な時間、スレッドを開いたままにします。

GitHub ワークフローでは、
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` を介した永続的な閲覧者プロファイルを優先します（完全なプロファイルアーカイブは
GitHub のシークレットサイズ上限を超える場合があります）。小規模/ブートストラップ用プロファイルでは、代わりに
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 `.tgz` を復元できます。
どちらのソースも構成されていない場合でも、ワークフローは決定論的な
ベースライン/候補のスクリーンショットを公開し、ログイン済みの目視確認が
スキップされたことをログに記録します。

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
デスクトップをキャプチャして、Slack QA アーティファクト（`slack-qa/`）と
VNC のスクリーンショット/動画の両方をローカルにコピーします。これは、SUT
Gateway とブラウザの両方が同じ VM 内で実行される唯一の Mantis 形式です。

`--gateway-setup` を指定すると、コマンドは VM 内の `$HOME/.openclaw-mantis/slack-openclaw`
に永続的で破棄可能な OpenClaw ホームを作成し、対象チャンネル用に Slack
Socket Mode 構成をパッチして、
`openclaw gateway run --dev --allow-unconfigured --port 38973` を起動し、
VNC セッション内で Chrome を実行したままにします。`--gateway-setup` を省略すると、代わりに通常の
ボット間 Slack QA レーンを実行します。

`--credential-source env` に必要な環境変数（ローカルのデフォルトは `env`、
ロールのデフォルトは `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`（ローカルで `OPENAI_API_KEY`
  のみが設定されている場合、Mantis は Crabbox を呼び出す前に、それを
  `OPENCLAW_LIVE_OPENAI_KEY` にコピーします）

`--credential-source convex` を指定すると、Mantis は VM を作成する前に
共有プールから Slack SUT 認証情報をリースし、チャンネル ID、アプリトークン、および
ボットトークンを `OPENCLAW_MANTIS_SLACK_*` 環境変数として VM に転送します。そのため、GitHub
ワークフローで必要なのは生の Slack トークンではなく、Convex ブローカーのシークレットだけです。

その他のフラグ：`--slack-url <url>` は特定の URL を開きます（指定しない場合、Mantis は
`auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します）。
`--slack-channel-id <id>` は Gateway の許可リストチャンネルを設定します。
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は VM 内の永続 Chrome
プロファイルを制御します（デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile`）。
`--approval-checkpoints` はネイティブ Slack 承認シナリオ
（`slack-approval-exec-native`、`slack-approval-plugin-native`）を実行し、
Gateway セットアップの代わりに保留中/解決済みのチェックポイントスクリーンショットをレンダリングします（
`--gateway-setup` とは相互排他的です）。`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model`、`--fast` は Slack
ライブレーンにそのまま渡されます。

承認チェックポイントのスクリーンショットは、ライブ Slack UI ではなく、
シナリオが観測した Slack API メッセージからレンダリングされます。`slack-desktop-smoke.png` は、
リースのブラウザプロファイルがすでにログイン済みだった場合に限り、Slack Web 自体の証跡になります。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Crabbox デスクトップをリースまたは再利用し、ネイティブ Linux Telegram Desktop をインストールし、
必要に応じてユーザーセッションアーカイブを復元し、リースされた Telegram SUT bot トークンで
OpenClaw を設定し、
`openclaw gateway run --dev --allow-unconfigured --port 38974` を起動して、
リースされたプライベートグループにドライバー bot の準備完了メッセージを投稿した後、
スクリーンショットと MP4 をキャプチャします。bot トークンは OpenClaw の設定にのみ使用され、
Telegram Desktop へのログインには決して使用されません。デスクトップビューアーは別個の
Telegram ユーザーセッションであり、`--telegram-profile-archive-env <name>` から復元するか、
VNC 経由で手動ログインし、`--keep-lease` で維持します。

フラグ: `--lease-id <cbx_...>` は、すでに Telegram Desktop にログイン済みの VM に対して再実行します。
`--telegram-profile-archive-env <name>` は、起動前に base64 の `.tgz` プロファイルアーカイブを復元します。
`--telegram-profile-dir <remote-path>` は、リモートプロファイルディレクトリを設定します
（デフォルトは `$HOME/.local/share/TelegramDesktop`）。
`--no-gateway-setup` は、Telegram Desktop のインストールと起動のみを行います。
`--credential-source`/`--credential-role` のデフォルトは `convex`/`maintainer` です。

## エビデンスマニフェスト

PR に公開する各シナリオは、レポートの隣に `mantis-evidence.json` を書き込みます。

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord ステータスリアクション QA",
  "summary": "PR コメント用の、人が読める冒頭の要約。",
  "scenario": "discord-status-reactions-tool-only",
  "comparison": {
    "baseline": { "sha": "...", "status": "fail", "expected": "キュー投入のみ" },
    "candidate": { "sha": "...", "status": "pass", "expected": "キュー投入 -> 思考中 -> 完了" },
    "pass": true
  },
  "artifacts": [
    {
      "kind": "timeline",
      "lane": "baseline",
      "label": "ベースラインのキュー投入のみ",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "ベースラインの Discord タイムライン",
      "width": 420
    }
  ]
}
```

アーティファクトの `path` はマニフェストのディレクトリからの相対パスです。`targetPath` は、
設定された R2/S3 アーティファクトプレフィックスからの相対パスです。
`scripts/mantis/publish-pr-evidence.mjs` はパストラバーサルを拒否し、ファイルが存在しない場合は
`"required": false` のエントリをスキップします。

アーティファクト種別: `timeline`（決定論的な変更前後のスクリーンショット）、
`desktopScreenshot`（VNC/ブラウザのスクリーンショット）、`motionPreview`（録画から生成した
インラインアニメーション GIF）、`motionClip`（動きのない部分をトリミングした MP4）、
`fullVideo`（完全な録画）、`metadata`（JSON/ログのサイドカー）、`report`（Markdown レポート）。

実行時のディスク上のアーティファクト構成:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

スクリーンショットはエビデンスであり、シークレットではありませんが、引き続き編集による秘匿を
徹底する必要があります。プライベートチャンネル名、ユーザー名、またはメッセージ内容が
表示される場合があります。公開アーティファクトのアップロードでは
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を設定してください。Discord/Slack/Telegram の
GitHub ワークフローではデフォルトで有効です。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` は再利用可能なパブリッシャーです。ワークフローは、
マニフェスト、対象 PR、アーティファクトの対象ルート、コメントマーカー、アーティファクト URL、
実行 URL、リクエスト元を指定して呼び出します。宣言されたアーティファクトを Mantis R2 バケットへ
アップロードし、インライン画像/プレビューとリンク付き動画を含む要約優先の PR コメントを作成して、
既存のマーカーコメントを更新するか、新しいコメントを作成します。必要な環境変数:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（ワークフローでは `openclaw-crabbox-artifacts` を設定）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（ワークフローでは `auto` を設定）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（ワークフローでは `https://artifacts.openclaw.ai` を設定）

コメントは `github-actions[bot]` ではなく、Mantis GitHub App
（`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`）を介して投稿され、
非表示のマーカーコメントを upsert キーとして使用します。

| ワークフロー                      | トリガー                                                                                   | 実行内容                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動ディスパッチ                                                                           | 選択した ref に対して `discord-smoke` を実行します。                                                                                                                                                                                                                                                            |
| `Mantis Discord Status Reactions` | PR コメントまたは手動ディスパッチ                                                          | ベースライン/候補のワークツリーを個別に構築し、それぞれで `discord-status-reactions-tool-only` を実行し、各レーンのタイムラインを Crabbox デスクトップブラウザでレンダリングし、`crabbox media preview` で動きのない部分をトリミングした GIF/MP4 プレビューを生成してアーティファクトをアップロードし、インラインの PR エビデンスを投稿します。 |
| `Mantis Scenario`                 | 手動ディスパッチ                                                                           | 汎用ディスパッチャーです。`scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number` を受け取り、対応するシナリオワークフローへ転送します。 |
| `Mantis Slack Desktop Smoke`      | 手動ディスパッチ                                                                           | Crabbox Linux デスクトップをリースし（デフォルトは `aws`、`hetzner` も選択可能）、候補に対して `slack-desktop-smoke --gateway-setup` を実行してデスクトップを録画し、モーションプレビューを生成してアーティファクトをアップロードし、PR 番号が指定されている場合は PR エビデンスを投稿します。 |
| `Mantis Telegram Live`            | PR コメントまたは手動ディスパッチ                                                          | bot API の Telegram ライブ QA レーン（`openclaw qa telegram`）を実行し、QA 要約から `mantis-evidence.json` を書き込み、編集により秘匿されたエビデンス HTML を Crabbox デスクトップブラウザでレンダリングし、モーション GIF を生成して PR エビデンスを投稿します。このレーンでは Telegram Web へのログインは不要です。 |
| `Mantis Telegram Desktop Proof`   | メンテナー PR ラベル（`mantis: telegram-visible-proof`）と PR コメント、または手動ディスパッチ | エージェントによるネイティブ Telegram Desktop の変更前後の実証です。PR、ベースライン/候補の ref、メンテナーの指示を Codex に渡し、Codex が両方の ref に対して実ユーザーの Crabbox Telegram Desktop 実証レーンを実行し、2 列の PR エビデンステーブルを投稿します。 |
| `Mantis Web UI Chat Proof`        | PR コメントまたは手動ディスパッチ                                                          | 候補に対して OpenClaw Control UI チャットに焦点を当てた Playwright 実証を実行し、ブラウザがモック Gateway 経由で送信することを検証し、スクリーンショット/動画アーティファクトをキャプチャして PR エビデンスを投稿します。このレーンは Web チャットの実証専用であり、WinUI/ネイティブアプリや任意のビジュアル実証には使用しません。 |

`Mantis Discord Status Reactions` と `Mantis Telegram Live` はどちらも、
`baseline_ref`/`candidate_ref`（または PR コメント内の `baseline=`/`candidate=`）を受け取り、
解決された SHA が `origin/main` の祖先、リリースタグ（`v*`）、またはオープンな PR の head の
いずれかであることを検証してから、シークレットを含む認証情報で実行します。

write/maintain/admin アクセス権を持つ PR からのコメントトリガー:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram コメントトリガーでは、デフォルトで PR の head SHA を候補、
`telegram-status-command` をシナリオとして使用します。`provider=aws|hetzner` と
`lease=<cbx_...>` を受け付け、特定の Crabbox プロバイダーまたは事前にウォームアップされた
デスクトップを対象にできます。`Mantis Telegram Desktop Proof` は、PR に
`mantis: telegram-visible-proof` ラベルがすでに付いている場合にのみ PR コメントへ応答します。

Web UI チャットのコメントトリガーでは、デフォルトで PR の head SHA を候補として使用します。
Control UI のモック Gateway チャット実証を実行し、ブラウザアーティファクトを公開します。
その他の Web ページやネイティブアプリのサーフェスには、通常の Playwright/ブラウザ実証、
メンテナーのスクリーンショット、Crabbox、またはローカルアーティファクトを使用してください。

ClawSweeper はシナリオを直接ディスパッチすることもできます。

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## マシンとシークレット

ローカル CLI の Crabbox デフォルトは `--provider hetzner --class beast` です。
`--provider`、`--class`/`--machine-class`、または
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` で上書きできます。
GitHub ワークフローでは通常、両方を上書きします（たとえば `--class standard`、および Slack
ワークフローの `aws`/`hetzner` プロバイダー選択入力）。プロバイダーが遅すぎるか利用できない場合は、
フォールバックをハードコードせず、同じ Crabbox インターフェースの背後に追加してください。

VM ベースライン: デスクトップ対応の Chrome/Chromium、CDP アクセス、VNC/
noVNC、Node 22+ と pnpm、OpenClaw チェックアウトを備え、対象トランスポート、GitHub、
モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセスが可能な Linux。

Mantis ワークフロー全体で使用されるシークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- 公開アーティファクトのアップロード用の `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（ワークフローではフォールバックとして
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` も受け付け、Crabbox の呼び出し前に
  通常の名前へマッピングします）
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis ランナーは、Discord/Slack/Telegram の bot トークン、プロバイダー API キー、
ブラウザ Cookie、認証プロファイルの内容、VNC パスワード、生の認証情報ペイロードを
決して出力してはいけません。トークンが Issue、PR、チャット、またはログに漏洩した場合は、
置換用シークレットを保存した後にローテーションしてください。

## 実行結果

変更前後のトランスポートシナリオでは、不安定な環境が製品の回帰と解釈されないように、
次の結果を区別します。

- **バグを再現**: ベースラインがシナリオの想定どおりに失敗しました。
- **ハーネスの失敗**: オラクルが意味を持つ前に、環境セットアップ、認証情報、トランスポート API、
  ブラウザ、またはプロバイダーが失敗しました。

候補のみのブラウザ実証では、候補がモック Gateway と可視 UI アサーションに合格したかどうかを
報告します。ベースラインを再現したとは主張しません。

## シナリオの追加

ライブトランスポートシナリオは、独立した宣言ファイル形式ではなく、トランスポートごとに
TypeScript で定義されます（Discord の変更前後の構成については、
`extensions/qa-lab/src/mantis/run.runtime.ts` の `MANTIS_SCENARIO_CONFIGS` を参照）。
各シナリオには、ID とタイトル、トランスポート、必要な認証情報、ベースライン ref ポリシー、
候補 ref ポリシー、OpenClaw 設定パッチ、セットアップ/刺激ステップ、想定されるベースラインと
候補のオラクル、ビジュアルキャプチャ対象、タイムアウト予算、クリーンアップステップが必要です。

候補のみを対象とした集中的なブラウザ証跡には、専用の決定論的 E2E テストとワークフローを使用できます。スコープを明示し、実行前に候補 ref を検証し、シークレットを使用する公開処理を分離したうえで、同じ証跡マニフェストの契約を出力します。

ビジョンチェックよりも、小規模で型付けされたオラクルを優先します。たとえば、Discord のリアクション状態やメッセージ参照、Slack スレッドの `ts`／リアクション API 状態、メールのメッセージ ID とヘッダーです。UI が唯一の信頼できる観測対象である場合はブラウザのスクリーンショットを使用し、プラットフォーム API のオラクルが存在する場合は、それに対する追加検証としてビジョンチェックを維持します。

Discord、Slack、Telegram に続き、同じランナー構成を WhatsApp
（QR ログイン、再識別、配信、メディア、リアクション）および Matrix
（暗号化されたルーム、スレッド／返信の関係、再起動後の再開）にも拡張できますが、どちらもまだ実装されていません。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どちらの Discord ボットをドライバーとし、どちらを SUT とするべきですか？
- GitHub は PR の Mantis アーティファクトをどのくらいの期間保持するべきですか？
- ClawSweeper は、メンテナーのコマンドを待たずに、どのような場合に Mantis シナリオを自動的に推奨するべきですか？
- 公開 PR では、アップロード前にスクリーンショットを墨消しまたは切り抜くべきですか？
