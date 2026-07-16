---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストに変更前後の検証を追加する
    - Discord、Slack、WhatsApp、その他のライブトランスポートシナリオの追加
    - 候補 ref に対する Control UI の重点的なブラウザ検証を実行中
    - スクリーンショット、ブラウザ自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、実際のトランスポート比較と候補のみを対象としたブラウザー検証のために、視覚的なエンドツーエンドのエビデンスを取得し、その成果物を PR に添付します。
title: Mantis
x-i18n:
    generated_at: "2026-07-16T11:39:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 48a1b306e37aba7e8c67139df61f3680a9aec066361aa196d88c81270337bc1b
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は OpenClaw の動作に関する視覚的な CI 証跡と PR コメントを公開します。
ライブトランスポートシナリオでは、既知の不良ベースラインと候補 ref を比較します。
一方、対象を絞ったブラウザレーンでは、決定論的なモックトランスポートに対して
1 つの候補を検証する場合があります。Discord は、実際のボット認証、ギルドチャンネル、
リアクション、スレッド、ブラウザによる目視確認を備えた形で最初にリリースされました。Slack、Telegram、および対象を絞った Control
UI チャットレーンも存在します。WhatsApp と Matrix は未実装です。

## 所有権

- OpenClaw (`extensions/qa-lab/src/mantis/*`)：シナリオランタイム、`pnpm openclaw qa mantis <command>` CLI、証跡スキーマ。
- QA Lab (`extensions/qa-lab/src/live-transports/*`)：ライブトランスポートハーネス、ドライバー/SUT ボット、レポート/証跡ライター。
- Crabbox (`openclaw/crabbox`)：ウォームアップ済み Linux マシン、リース、VNC、`crabbox media preview`。
- GitHub Actions (`.github/workflows/mantis-*.yml`)：リモートエントリーポイント、アーティファクトの保持。
- ClawSweeper：メンテナーの PR コマンドを解析し、ワークフローをディスパッチして、最終的な PR コメントを投稿します。

## CLI コマンド

すべてのコマンドは `pnpm openclaw qa mantis <command>` であり、
`extensions/qa-lab/src/mantis/cli.ts` で定義されています。ビルド時および実行時に `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1`
が必要です（バンドルされたワークフローでは、ビルド前に `OPENCLAW_BUILD_PRIVATE_QA=1` と
`OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` を設定します）。

| コマンド                         | 目的                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord ボットがギルド/チャンネルを認識し、投稿とリアクションを実行できることを検証します。                                                                                 |
| `run`                           | ベースラインと候補 ref に対して変更前/変更後のシナリオを実行します（Discord のみ）。                                                                           |
| `desktop-browser-smoke`         | Crabbox デスクトップをリースまたは再利用し、表示可能なブラウザを開いて、スクリーンショットと動画を取得します。                                                                        |
| `slack-desktop-smoke`           | Crabbox デスクトップをリースまたは再利用し、その内部で Slack QA を実行し、Slack Web を開いて証跡を取得します。                                                                  |
| `telegram-desktop-builder`      | Crabbox デスクトップをリースまたは再利用し、Telegram Desktop をインストールして、必要に応じて OpenClaw Gateway を設定します。                                                        |
| `visual-task` / `visual-driver` | オプションの画像理解アサーションを備えた汎用 Crabbox デスクトップキャプチャです。`visual-driver` は `crabbox record --while` 配下で起動されるドライバー側です。 |

すべてのコマンドは `--repo-root <path>` と `--output-dir <path>` を受け付けます。Crabbox
コマンドはさらに `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、
`--lease-id`、`--idle-timeout`、`--ttl`、`--keep-lease` を受け付けます。特に記載がない限り、プロバイダー/クラスのローカル CLI デフォルトは
`hetzner`/`beast` です。CI ワークフローでは通常、両方を上書きします。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Discord REST API (`https://discord.com/api/v10`) を呼び出して、ボット
ユーザー、ギルド、ギルドのチャンネル、対象チャンネルを取得し、その
チャンネルがギルドに属することをアサートした後、（`--skip-post` でない限り）メッセージを投稿して
`👀` リアクションを追加します。`mantis-discord-smoke-summary.json` と
`mantis-discord-smoke-report.md` を書き込みます。

トークンの解決順序：`--token-file` の値、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
（`--token-env` で上書き）、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` で指定されたファイル
（`--token-file-env` で上書き）。ギルド/チャンネル ID は
`OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（
`--guild-id` / `--channel-id` で上書き）から取得され、17〜20 桁の Discord snowflake である必要があります。
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

`--transport` は現在、`discord` のみを受け付けます。`--scenario` は 2 つの
組み込み ID のいずれかであり、それぞれに独自のデフォルトベースライン ref と、期待される変更前/変更後の
ラベル（`extensions/qa-lab/src/mantis/run.runtime.ts`）があります。

| シナリオ                                   | デフォルトベースライン                           | ベースラインの期待値                         | 候補の期待値            |
| ------------------------------------------ | ------------------------------------------ | ---------------------------------------- | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                            | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | スレッド返信に `filePath` 添付ファイルが含まれない | スレッド返信にそれが含まれる     |

`--candidate` のデフォルトは `HEAD` です。その他のフラグ：`--credential-source`
（デフォルト `convex`）、`--credential-role`（デフォルト `ci`）、`--provider-mode`
（デフォルト `live-frontier`）、`--fast`（デフォルトでオン）、`--skip-install`、`--skip-build`。

ランナーは、ベースラインと候補用の分離された `git worktree` チェックアウトを
`<output-dir>/worktrees/` 配下に作成し、それぞれで `pnpm install`/`pnpm build` を
（スキップされない限り）実行した後、
`pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures`
を各 worktree に対して実行します。各レーンは `discord-qa-reaction-timelines.json`
と `<scenario-id>-timeline.html`/`.png` のペアを書き込みます。ランナーはこの
証跡を `baseline/`/`candidate/` 配下にコピーして戻し、出力ディレクトリに `comparison.json`、
`mantis-report.md`、`mantis-evidence.json` を書き込みます。また、
比較が合格しなかった場合（ベースラインが `fail`、候補が
`pass`）はゼロ以外で終了します。

2 番目の Discord シナリオ（`discord-thread-reply-filepath-attachment`）は、
ドライバーボットで親メッセージを投稿し、実際のスレッドを作成し、リポジトリローカルの `filePath` を使用して SUT の
`message.thread-reply` アクションを呼び出した後、スレッドを
ポーリングして返信と添付ファイル名を確認します。`mantis-thread-report.md`
という名前の添付ファイルを期待します。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Crabbox デスクトップをリースまたは再利用し、VNC セッション内でブラウザを起動して、
`--browser-url`（デフォルト `https://openclaw.ai`）またはレンダリングされた
`--html-file` を表示し、待機してから、`scrot` でスクリーンショットを撮影します。必要に応じて
`ffmpeg` で MP4 を録画し、`desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json`
を `--output-dir` に rsync で戻します。

フラグ：

- `--lease-id <cbx_...>` は、新規作成する代わりにウォームアップ済みのデスクトップを再利用します。
- `--browser-profile-dir <remote-path>` は、リモートの Chrome ユーザーデータディレクトリを再利用し、永続デスクトップが実行間でログイン状態を維持できるようにします（長期間維持される Discord Web ビューワープロファイルに使用）。
- `--browser-profile-archive-env <name>` は、起動前にその環境変数から base64 の `.tgz` Chrome プロファイルアーカイブを復元します（デフォルト `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）。Discord Web など、ログイン済みの目視確認に使用します。
- `--video-duration <seconds>` は MP4 のキャプチャ時間を制御します（デフォルト 10s）。
- `--keep-lease`（または `OPENCLAW_MANTIS_KEEP_VM=1`）は、この実行で作成したリースを VNC 検査用に開いたままにします。リースを作成した実行が失敗した場合も、デフォルトでリースを維持します。

Discord Web の証跡では、Mantis はボット
トークンではなく専用のビューワーアカウントを使用します。Discord REST オラクル（`qa discord` 経由）は引き続き信頼できる情報源です。
`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは
Discord Web URL アーティファクトも書き込み、`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` は
ブラウザがスレッドを開けるよう、十分な時間スレッドを開いたままにします。

GitHub ワークフローでは、
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` を介した永続ビューワープロファイルを優先します（完全なプロファイルアーカイブは
GitHub のシークレットサイズ制限を超える場合があります）。小規模なプロファイルやブートストラップ用プロファイルでは、代わりに
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 の `.tgz` を復元できます。どちらの
ソースも設定されていない場合でも、ワークフローは決定論的な
ベースライン/候補のスクリーンショットを公開し、ログイン済みの目視確認が
スキップされたことを記録します。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Crabbox デスクトップをリースまたは再利用し、チェックアウトを VM に同期して、その内部で
`pnpm openclaw qa slack` を実行し、VNC ブラウザで Slack Web を開き、
デスクトップをキャプチャして、Slack QA アーティファクト（`slack-qa/`）と
VNC のスクリーンショット/動画の両方をローカルにコピーして戻します。これは、
SUT Gateway とブラウザの両方が同じ VM 内で動作する唯一の Mantis 構成です。

`--gateway-setup` を指定すると、コマンドは VM 内の `$HOME/.openclaw-mantis/slack-openclaw` に
永続的で破棄可能な OpenClaw ホームを作成し、対象チャンネル用の Slack
Socket Mode 設定をパッチして、
`openclaw gateway run --dev --allow-unconfigured --port 38973` を起動し、
Chrome を VNC セッション内で実行したままにします。`--gateway-setup` を省略すると、代わりに通常の
ボット間 Slack QA レーンを実行します。

`--credential-source env` に必要な環境変数（ローカルデフォルトは `env`、
ロールデフォルトは `maintainer`）：

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`（ローカルで `OPENAI_API_KEY`
  のみが設定されている場合、Mantis は Crabbox を
  呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` にコピーします）

`--credential-source convex` を指定すると、Mantis は VM の作成前に
共有プールから Slack SUT 認証情報をリースし、チャンネル ID、アプリトークン、ボットトークンを
`OPENCLAW_MANTIS_SLACK_*` 環境変数として VM に転送します。そのため、GitHub
ワークフローに必要なのは生の Slack トークンではなく、Convex ブローカーシークレットのみです。

その他のフラグ：`--slack-url <url>` は特定の URL を開きます（指定しない場合、Mantis は
`auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します）。
`--slack-channel-id <id>` は Gateway の許可リストチャンネルを設定します。
`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は VM 内の永続 Chrome
プロファイルを制御します（デフォルト `$HOME/.config/openclaw-mantis/slack-chrome-profile`）。
`--approval-checkpoints` はネイティブ Slack 承認シナリオ
（`slack-approval-exec-native`、`slack-approval-plugin-native`）を実行し、
Gateway セットアップの代わりに保留中/解決済みチェックポイントのスクリーンショットをレンダリングします
（`--gateway-setup` とは相互排他）。`--hydrate-mode source|prehydrated`、
`--provider-mode`、`--model`、`--alt-model`、`--fast` は
Slack ライブレーンにそのまま渡されます。

承認チェックポイントのスクリーンショットは、ライブ Slack UI ではなく、
シナリオが観測した Slack API メッセージからレンダリングされます。`slack-desktop-smoke.png` は、
リースのブラウザプロファイルがすでにログイン済みだった場合に限り、Slack Web 自体の証跡となります。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Crabbox デスクトップをリースまたは再利用し、ネイティブ Linux Telegram Desktop を
インストールし、必要に応じてユーザーセッションアーカイブを復元し、
リースした Telegram SUT ボットトークンで OpenClaw を設定して、
`openclaw gateway run --dev --allow-unconfigured --port 38974` を起動し、
リースしたプライベートグループにドライバーボットの準備完了メッセージを投稿した後、
スクリーンショットと MP4 を取得します。ボットトークンは OpenClaw を設定するだけであり、
Telegram Desktop へのログインには決して使用されません。デスクトップビューワーは別個の Telegram ユーザーセッションであり、
`--telegram-profile-archive-env <name>` から復元するか、VNC 経由で手動ログインし、
`--keep-lease` で稼働状態を維持します。

フラグ：`--lease-id <cbx_...>` は、Telegram Desktop にすでにログイン済みの
VM に対して再実行します。`--telegram-profile-archive-env <name>` は、起動前に base64 の
`.tgz` プロファイルアーカイブを復元します。`--telegram-profile-dir <remote-path>`
はリモートプロファイルディレクトリを設定します（デフォルト `$HOME/.local/share/TelegramDesktop`）。
`--no-gateway-setup` は Telegram Desktop のインストールと起動のみを行います。
`--credential-source`/`--credential-role` のデフォルトは `convex`/`maintainer` です。

## 証跡マニフェスト

PR に公開するすべてのシナリオは、そのレポートの隣に
`mantis-evidence.json` を書き込みます。

```json
{
  "schemaVersion": 1,
  "id": "discord-status-reactions",
  "title": "Mantis Discord ステータスリアクション QA",
  "summary": "PR コメント向けの、人が読める冒頭の要約。",
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
      "label": "ベースラインは queued-only",
      "path": "baseline/timeline.png",
      "targetPath": "baseline.png",
      "alt": "ベースラインの Discord タイムライン",
      "width": 420
    }
  ]
}
```

アーティファクトの `path` はマニフェストのディレクトリからの相対パスであり、`targetPath` は
設定された R2/S3 アーティファクトプレフィックスからの相対パスです。`scripts/mantis/publish-pr-evidence.mjs` は
パストラバーサルを拒否し、ファイルが存在しない場合は `"required": false` を持つ
エントリをスキップします。

アーティファクトの種類: `timeline`（決定論的な変更前後のスクリーンショット）、
`desktopScreenshot`（VNC/ブラウザーのスクリーンショット）、`motionPreview`（録画から生成したインラインのアニメーション
GIF）、`motionClip`（動きのある部分だけにトリミングした MP4）、`fullVideo`（完全な
録画）、`metadata`（JSON/ログのサイドカー）、`report`（Markdown レポート）。

実行時のディスク上のアーティファクト配置:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

スクリーンショットは証拠であり、シークレットではありませんが、それでも編集による秘匿を徹底する必要があります。
非公開チャンネル名、ユーザー名、メッセージ内容が含まれる可能性があります。公開アーティファクトをアップロードする場合は
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を設定してください。これは
Discord/Slack/Telegram の GitHub ワークフローでデフォルトで有効になっています。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` は再利用可能なパブリッシャーです。ワークフローは、
マニフェスト、対象 PR、アーティファクトの対象ルート、コメントマーカー、
アーティファクト URL、実行 URL、リクエスト元を指定してこれを呼び出します。宣言されたアーティファクトを
Mantis R2 バケットにアップロードし、インラインの画像/プレビューとリンク付き動画を含む、
要約を先頭に置いた PR コメントを構築してから、既存のマーカーコメントを更新するか、
新しいコメントを作成します。必須の環境変数:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET`（ワークフローは `openclaw-crabbox-artifacts` を設定）
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION`（ワークフローは `auto` を設定）
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL`（ワークフローは `https://artifacts.openclaw.ai` を設定）

コメントは `github-actions[bot]` ではなく、Mantis GitHub App（`MANTIS_GITHUB_APP_ID` /
`MANTIS_GITHUB_APP_PRIVATE_KEY`）を通じて投稿され、非表示の
マーカーコメントを upsert キーとして使用します。

| ワークフロー                          | トリガー                                                                                    | 実行内容                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動ディスパッチ                                                                            | 選択した ref に対して `discord-smoke` を実行します。                                                                                                                                                                                                                                                                       |
| `Mantis Discord Status Reactions` | PR コメントまたは手動ディスパッチ                                                              | ベースラインと候補のワークツリーを個別に構築し、それぞれで `discord-status-reactions-tool-only` を実行し、各レーンのタイムラインを Crabbox デスクトップブラウザーでレンダリングし、`crabbox media preview` で動きのある部分だけにトリミングした GIF/MP4 プレビューを生成して、アーティファクトをアップロードし、インラインの PR 証拠を投稿します。                                 |
| `Mantis Scenario`                 | 手動ディスパッチ                                                                            | 汎用ディスパッチャー: `scenario_id`（`discord-status-reactions-tool-only`、`discord-thread-reply-filepath-attachment`、`slack-desktop-smoke`、`telegram-live`、`telegram-desktop-proof`、`web-ui-chat-proof`）、`baseline_ref`、`candidate_ref`、`pr_number` を受け取り、対応するシナリオワークフローに転送します。 |
| `Mantis Slack Desktop Smoke`      | 手動ディスパッチ                                                                            | Crabbox Linux デスクトップをリースし（デフォルトは `aws`、`hetzner` も選択可能）、候補に対して `slack-desktop-smoke --gateway-setup` を実行し、デスクトップを録画して、モーションプレビューを生成し、アーティファクトをアップロードし、PR 番号が指定されている場合は PR 証拠を投稿します。                                                      |
| `Mantis Telegram Live`            | PR コメントまたは手動ディスパッチ                                                              | bot API を使用する Telegram ライブ QA レーン（`openclaw qa telegram`）を実行し、QA の要約から `mantis-evidence.json` を書き込み、Crabbox デスクトップブラウザーを通じて編集済みの証拠 HTML をレンダリングし、モーション GIF を生成して、PR 証拠を投稿します。このレーンでは Telegram Web へのログインは不要です。                               |
| `Mantis Telegram Desktop Proof`   | メンテナーによる PR ラベル（`mantis: telegram-visible-proof`）と PR コメント、または手動ディスパッチ | エージェントによるネイティブ Telegram Desktop の変更前後の証拠を取得します。PR、ベースライン/候補の ref、メンテナーの指示を Codex に渡します。Codex は両方の ref に対して実ユーザーの Crabbox Telegram Desktop 証拠レーンを実行し、2 列の PR 証拠テーブルを投稿します。                                                              |
| `Mantis Web UI Chat Proof`        | PR コメントまたは手動ディスパッチ                                                              | 候補に対して OpenClaw Control UI のチャットに焦点を絞った Playwright 証拠取得を実行し、ブラウザーがモック化された Gateway を通じて送信することを検証し、スクリーンショット/動画アーティファクトを取得して、PR 証拠を投稿します。このレーンは Web チャットのみの証拠であり、WinUI/ネイティブアプリや任意の視覚的証拠には対応しません。                           |

`Mantis Discord Status Reactions` と `Mantis Telegram Live` はどちらも
`baseline_ref`/`candidate_ref`（または PR コメント内の `baseline=`/`candidate=`）を受け入れ、
シークレットを含む認証情報を使用して実行する前に、解決された SHA が `origin/main` の祖先、
リリースタグ（`v*`）、またはオープンな PR の head のいずれかであることを検証します。

write/maintain/admin 権限を持つ PR からのコメントトリガー:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,channel-canary
@openclaw-mantis web ui chat
@openclaw-mantis web-ui-chat candidate=HEAD
```

Telegram のコメントトリガーは、デフォルトで PR の head SHA を候補、
`telegram-status-command` をシナリオとして使用します。特定の Crabbox プロバイダーまたは事前にウォームアップされた
デスクトップを対象にするため、`provider=aws|hetzner` と
`lease=<cbx_...>` を受け入れます。`Mantis Telegram Desktop Proof` は、PR に
`mantis: telegram-visible-proof` ラベルがすでに付いている場合にのみ PR コメントへ応答します。

Web UI チャットのコメントトリガーは、デフォルトで PR の head SHA を候補として使用します。これらは
Control UI のモック Gateway を使用したチャット証拠取得を実行してブラウザーアーティファクトを公開します。その他の
Web ページやネイティブアプリの画面については、通常の Playwright/ブラウザー証拠、メンテナーによるスクリーンショット、Crabbox、またはローカルの
アーティファクトを使用してください。

ClawSweeper からシナリオを直接ディスパッチすることもできます。

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## マシンとシークレット

ローカル CLI の Crabbox のデフォルトは `--provider hetzner --class beast` です。
`--provider`、`--class`/`--machine-class`、または
`OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` で上書きできます。GitHub
ワークフローでは両方を上書きするのが一般的です（例: `--class standard`、および
Slack ワークフローの `aws`/`hetzner` プロバイダー選択入力）。プロバイダーが
遅すぎる場合や利用できない場合は、フォールバックをハードコードするのではなく、同じ Crabbox インターフェースの背後に追加してください。

VM のベースライン: デスクトップ対応の Chrome/Chromium、CDP アクセス、VNC/
noVNC、Node 22.22.3+、24.15+、または 25.9+ と pnpm、OpenClaw のチェックアウトを備えた Linux。さらに、
対象トランスポート、GitHub、モデルプロバイダー、認証情報ブローカーへの
外向きアクセスが必要です。

Mantis のコマンドとワークフロー全体で使用される認証情報および環境変数の名前:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- ローカルの `qa mantis run --credential-source env` には、
  `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`、`OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`、
  `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` も必要です。GitHub ワークフローでは通常、
  生の Discord bot トークンではなく `--credential-source convex` と以下のブローカー認証情報を使用します。
- 公開アーティファクトのアップロード用の `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`、`OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENAI_API_KEY`（または Telegram Desktop 証拠取得専用の
  `OPENCLAW_MANTIS_AGENT_OPENAI_API_KEY`）
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN`（ワークフローは
  `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` もフォールバックとして受け入れ、
  Crabbox を呼び出す前に通常の名前へマッピングします）
- `CRABBOX_ACCESS_CLIENT_ID`、`CRABBOX_ACCESS_CLIENT_SECRET`
- `MANTIS_GITHUB_APP_ID`、`MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis ランナーは、Discord/Slack/Telegram の bot トークン、
プロバイダー API キー、ブラウザー Cookie、認証プロファイルの内容、VNC パスワード、生の認証情報ペイロードを
決して出力してはいけません。トークンが issue、PR、チャット、ログに漏洩した場合は、
代替のシークレットを保存した後にローテーションしてください。

## 実行結果

変更前後を比較するトランスポートシナリオでは、不安定な環境が製品のリグレッションとして
解釈されないよう、次の結果を区別します。

- **バグを再現**: ベースラインがシナリオの想定どおりに失敗しました。
- **ハーネスの失敗**: オラクルが意味を持つ前に、環境設定、認証情報、トランスポート API、ブラウザー、
  またはプロバイダーが失敗しました。

候補のみのブラウザー証拠は、候補がモック化された
Gateway と表示 UI のアサーションに合格したかどうかを報告します。ベースラインを再現したとは主張しません。

## シナリオの追加

ライブトランスポートのシナリオは、独立した宣言型ファイル形式ではなく、
トランスポートごとに TypeScript で定義します（Discord の変更前後の形式については
`extensions/qa-lab/src/mantis/run.runtime.ts` の `MANTIS_SCENARIO_CONFIGS` を参照）。
各シナリオには、id とタイトル、トランスポート、必要な認証情報、ベースラインの
ref ポリシー、候補の ref ポリシー、OpenClaw 設定パッチ、セットアップ/刺激ステップ、
想定されるベースラインと候補のオラクル、視覚的キャプチャ対象、タイムアウト
予算、クリーンアップステップが必要です。

候補のみに焦点を絞ったブラウザー証拠取得には、専用の決定論的 E2E テストと
ワークフローを使用できます。スコープを明示し、実行前に候補の ref を検証し、
シークレットを使用する公開処理を分離し、同じ証拠
マニフェスト契約を出力してください。

画像認識による確認より、小さく型付けされたオラクルを優先してください。たとえば、Discord のリアクション状態や
メッセージ参照、Slack スレッドの `ts`/リアクション API 状態、メールのメッセージ id
とヘッダーです。UI が唯一の信頼できる観測対象である場合はブラウザーのスクリーンショットを使用し、
プラットフォーム API のオラクルが存在する場合は、画像認識による確認をそれに追加する形にしてください。

Discord、Slack、Telegram に続き、同じランナー形式を WhatsApp
（QR ログイン、再識別、配信、メディア、リアクション）と Matrix
（暗号化されたルーム、スレッド/返信関係、再起動後の再開）へ拡張できますが、どちらも
まだ実装されていません。

## 未解決の問題

- 既存の Mantis ボットを再利用する場合、どちらの Discord ボットをドライバーとし、どちらを SUT とすべきですか？
- GitHub は PR の Mantis アーティファクトをどのくらいの期間保持すべきですか？
- ClawSweeper は、メンテナーのコマンドを待たずに、どのような場合に Mantis シナリオを自動的に推奨すべきですか？
- 公開 PR にアップロードする前に、スクリーンショットを墨消しまたはトリミングすべきですか？
