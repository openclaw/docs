---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストの前後検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠を取得して、成果物を PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-07-05T11:13:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9900316f179fbb42fb8cef603bd6719b55a8fb769409980ff7b17cf3e562ae70
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、既知の不正なベースライン ref と候補 ref に対して、実際のトランスポート上でバグシナリオを再実行し、before/after の比較を CI アーティファクトと PR コメントとして公開します。Discord が最初に出荷されました。実際の bot 認証、実際の guild チャンネル、リアクション、スレッド、および人間が確認できるブラウザー witness です。Slack と Telegram のレーンも存在します。WhatsApp と Matrix は未実装です。

## 所有範囲

- OpenClaw (`extensions/qa-lab/src/mantis/*`): シナリオランタイム、`pnpm openclaw qa mantis <command>` CLI、エビデンススキーマ。
- QA Lab (`extensions/qa-lab/src/live-transports/*`): ライブトランスポートハーネス、driver/SUT bot、レポート/エビデンス writer。
- Crabbox (`openclaw/crabbox`): ウォーム済み Linux マシン、lease、VNC、`crabbox media preview`。
- GitHub Actions (`.github/workflows/mantis-*.yml`): リモート entrypoint、アーティファクト保持。
- ClawSweeper: maintainer PR コマンドを解析し、workflow をディスパッチし、最終 PR コメントを投稿します。

## CLI コマンド

すべてのコマンドは `pnpm openclaw qa mantis <command>` で、`extensions/qa-lab/src/mantis/cli.ts` に定義されています。ビルド/実行時に `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` が必要です（バンドル済み workflow はビルド前に `OPENCLAW_BUILD_PRIVATE_QA=1` と `OPENCLAW_ENABLE_PRIVATE_QA_CLI=1` を設定します）。

| コマンド                        | 目的                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `discord-smoke`                 | Mantis Discord bot が guild/channel を確認し、投稿し、リアクションできることを検証します。                                                                 |
| `run`                           | ベースライン ref と候補 ref に対して before/after シナリオを実行します（Discord のみ）。                                                                  |
| `desktop-browser-smoke`         | Crabbox desktop を lease/再利用し、表示可能なブラウザーを開き、スクリーンショット + 動画を取得します。                                                    |
| `slack-desktop-smoke`           | Crabbox desktop を lease/再利用し、その中で Slack QA を実行し、Slack Web を開き、エビデンスを取得します。                                                 |
| `telegram-desktop-builder`      | Crabbox desktop を lease/再利用し、Telegram Desktop をインストールし、必要に応じて OpenClaw gateway を設定します。                                        |
| `visual-task` / `visual-driver` | 任意の画像理解アサーション付きの汎用 Crabbox desktop キャプチャです。`visual-driver` は `crabbox record --while` 配下で起動される driver 側です。          |

すべてのコマンドは `--repo-root <path>` と `--output-dir <path>` を受け付けます。Crabbox コマンドはさらに `--crabbox-bin`、`--provider`、`--machine-class`/`--class`、`--lease-id`、`--idle-timeout`、`--ttl`、`--keep-lease` も受け付けます。特に記載がない限り、provider/class のローカル CLI デフォルトは `hetzner`/`beast` です。CI workflow は通常、両方を上書きします。

### `discord-smoke`

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

Discord REST API (`https://discord.com/api/v10`) を呼び出して bot user、guild、guild のチャンネル、対象チャンネルを取得し、チャンネルがその guild に属することをアサートします。その後（`--skip-post` がない限り）メッセージを投稿し、`👀` リアクションを追加します。`mantis-discord-smoke-summary.json` と `mantis-discord-smoke-report.md` を書き込みます。

トークン解決順序は、`--token-file` の値、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`（`--token-env` で上書き）、次に `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN_FILE` で指定されたファイル（`--token-file-env` で上書き）です。Guild/channel id は `OPENCLAW_QA_DISCORD_GUILD_ID` / `OPENCLAW_QA_DISCORD_CHANNEL_ID`（`--guild-id` / `--channel-id` で上書き）から取得され、17-20 桁の Discord snowflake である必要があります。公開される summary と report 内で bot/guild/channel/message id と名前を `<redacted>` に置換するには、`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を設定します。

### `run`

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

`--transport` は現在 `discord` のみを受け付けます。`--scenario` は 2 つの組み込み id のいずれかで、それぞれ独自のデフォルトベースライン ref と期待される before/after ラベルを持ちます（`extensions/qa-lab/src/mantis/run.runtime.ts`）。

| シナリオ                                   | デフォルトベースライン                   | ベースラインの期待値                       | 候補の期待値                 |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------ | ---------------------------- |
| `discord-status-reactions-tool-only`       | `0bf06e953fdda290799fc9fb9244a8f67fdae593` | `queued-only`                              | `queued -> thinking -> done` |
| `discord-thread-reply-filepath-attachment` | `81349cdc2a9d5143fd0991ed858b739e7d96e05c` | thread reply が `filePath` attachment を省略 | thread reply がそれを含む    |

`--candidate` のデフォルトは `HEAD` です。その他のフラグは、`--credential-source`（デフォルト `convex`）、`--credential-role`（デフォルト `ci`）、`--provider-mode`（デフォルト `live-frontier`）、`--fast`（デフォルトでオン）、`--skip-install`、`--skip-build` です。

runner は `<output-dir>/worktrees/` 配下にベースラインと候補の detached `git worktree` checkout を作成し、それぞれで `pnpm install`/`pnpm build` を実行します（skip されていない場合）。その後、各 worktree に対して `pnpm openclaw qa discord --scenario <id> --model openai/gpt-5.4 --alt-model openai/gpt-5.4 --allow-failures` を実行します。各レーンは `discord-qa-reaction-timelines.json` と `<scenario-id>-timeline.html`/`.png` のペアを書き込みます。runner はこのエビデンスを `baseline/`/`candidate/` 配下にコピーし、出力ディレクトリに `comparison.json`、`mantis-report.md`、`mantis-evidence.json` を書き込み、比較が合格しなかった場合（ベースラインが `fail`、候補が `pass`）は nonzero で終了します。

2 つ目の Discord シナリオ（`discord-thread-reply-filepath-attachment`）は、driver bot で親メッセージを投稿し、実際のスレッドを作成し、repo-local の `filePath` で SUT の `message.thread-reply` action を呼び出します。その後、返信と attachment ファイル名をスレッドからポーリングします。`mantis-thread-report.md` という名前の attachment を期待します。

### `desktop-browser-smoke`

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

Crabbox desktop を lease または再利用し、VNC セッション内で `--browser-url`（デフォルト `https://openclaw.ai`）またはレンダリング済みの `--html-file` を指すブラウザーを起動し、待機し、`scrot` でスクリーンショットを撮り、必要に応じて `ffmpeg` で MP4 を録画し、`desktop-browser-smoke.png` / `.mp4` / `remote-metadata.json` を `--output-dir` に rsync します。

フラグ:

- `--lease-id <cbx_...>` は、新規作成の代わりにウォーム済み desktop を再利用します。
- `--browser-profile-dir <remote-path>` は、リモート Chrome user-data-dir を再利用し、永続 desktop が実行間でログイン状態を維持できるようにします（長寿命の Discord Web viewer profile に使用）。
- `--browser-profile-archive-env <name>` は、起動前にその env var から base64 の `.tgz` Chrome profile archive を復元します（デフォルト `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64`）。Discord Web のようなログイン済み witness に使用します。
- `--video-duration <seconds>` は MP4 キャプチャ長を制御します（デフォルト 10s）。
- `--keep-lease`（または `OPENCLAW_MANTIS_KEEP_VM=1`）は、この実行で作成された lease を VNC inspection 用に開いたままにします。lease を作成した失敗実行も、デフォルトでそれを保持します。

Discord Web エビデンスでは、Mantis は bot token ではなく専用 viewer アカウントを使用します。Discord REST oracle（`qa discord` 経由）は引き続き authoritative です。`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは Discord Web URL アーティファクトも書き込み、`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` はブラウザーがスレッドを開けるだけの時間、スレッドを開いたままにします。

GitHub workflow は `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` による永続 viewer profile を優先します（完全な profile archive は GitHub の secret サイズ制限を超える可能性があります）。小さな/bootstrap profile の場合は、代わりに `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 の `.tgz` を復元できます。どちらのソースも設定されていない場合でも、workflow は deterministic なベースライン/候補スクリーンショットを公開し、ログイン済み witness が skip されたことをログに記録します。

### `slack-desktop-smoke`

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Crabbox desktop を lease または再利用し、checkout を VM に同期し、その中で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、desktop をキャプチャし、Slack QA アーティファクト（`slack-qa/`）と VNC スクリーンショット/動画の両方をローカルにコピーします。これは、SUT gateway とブラウザーの両方が同じ VM 内で実行される唯一の Mantis 形態です。

`--gateway-setup` を指定すると、このコマンドは VM 内の `$HOME/.openclaw-mantis/slack-openclaw` に永続 disposable OpenClaw home を作成し、対象チャンネル向けの Slack Socket Mode config にパッチを当て、`openclaw gateway run --dev --allow-unconfigured --port 38973` を起動し、Chrome を VNC セッション内で実行したままにします。`--gateway-setup` を省略すると、通常の bot-to-bot Slack QA レーンを実行します。

`--credential-source env` に必要な env（ローカルデフォルトは `env`、role デフォルトは `maintainer`）:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`（ローカルで `OPENAI_API_KEY` だけが設定されている場合、Mantis は Crabbox の呼び出し前にそれを `OPENCLAW_LIVE_OPENAI_KEY` にコピーします）

`--credential-source convex` では、Mantis は VM 作成前に共有プールから Slack SUT credential を lease し、channel id、app token、bot token を `OPENCLAW_MANTIS_SLACK_*` env var として VM に転送します。そのため GitHub workflow は生の Slack token ではなく Convex broker secret だけを必要とします。

その他のフラグ: `--slack-url <url>` は特定の URL を開きます（指定がなければ Mantis は `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します）。`--slack-channel-id <id>` は gateway allowlist channel を設定します。`OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は VM 内の永続 Chrome profile を制御します（デフォルト `$HOME/.config/openclaw-mantis/slack-chrome-profile`）。`--approval-checkpoints` は native Slack approval シナリオ（`slack-approval-exec-native`、`slack-approval-plugin-native`）を実行し、gateway setup の代わりに pending/resolved checkpoint スクリーンショットをレンダリングします（`--gateway-setup` とは相互排他）。`--hydrate-mode source|prehydrated`、`--provider-mode`、`--model`、`--alt-model`、`--fast` は Slack live レーンに渡されます。

Approval checkpoint スクリーンショットは、live Slack UI ではなく、シナリオが観測した Slack API message からレンダリングされます。`slack-desktop-smoke.png` は、lease の browser profile がすでにログイン済みだった場合にのみ Slack Web 自体の証明になります。

### `telegram-desktop-builder`

```bash
pnpm openclaw qa mantis telegram-desktop-builder \
  --credential-source convex \
  --credential-role maintainer \
  --keep-lease
```

Crabbox desktop を lease または再利用し、native Linux Telegram Desktop をインストールし、必要に応じて user-session archive を復元し、lease された Telegram SUT bot token で OpenClaw を設定し、`openclaw gateway run --dev --allow-unconfigured --port 38974` を起動し、driver-bot readiness message を lease された private group に投稿してから、スクリーンショットと MP4 を取得します。bot token は OpenClaw の設定にのみ使用され、Telegram Desktop へのログインには決して使用されません。desktop viewer は別の Telegram user session であり、`--telegram-profile-archive-env <name>` から復元するか、VNC 経由で手動ログインし、`--keep-lease` で維持します。

フラグ: `--lease-id <cbx_...>` は、Telegram Desktop にすでにログイン済みの VM に対して再実行します。`--telegram-profile-archive-env <name>` は、起動前に base64 の `.tgz` プロファイルアーカイブを復元します。`--telegram-profile-dir <remote-path>` は、リモートプロファイルディレクトリを設定します (デフォルトは `$HOME/.local/share/TelegramDesktop`)。`--no-gateway-setup` は Telegram Desktop のインストールと起動だけを行います。`--credential-source`/`--credential-role` のデフォルトは `convex`/`maintainer` です。

## エビデンスマニフェスト

PR に公開するすべてのシナリオは、そのレポートの隣に `mantis-evidence.json` を書き込みます。

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

アーティファクトの `path` はマニフェストのディレクトリからの相対パスです。`targetPath` は、設定済みの R2/S3 アーティファクトプレフィックスからの相対パスです。`scripts/mantis/publish-pr-evidence.mjs` はパストラバーサルを拒否し、ファイルがない場合は `"required": false` のエントリをスキップします。

アーティファクトの種類: `timeline` (決定的な前後スクリーンショット)、`desktopScreenshot` (VNC/ブラウザスクリーンショット)、`motionPreview` (録画からのインラインアニメーション GIF)、`motionClip` (動き部分にトリミングした MP4)、`fullVideo` (完全な録画)、`metadata` (JSON/ログサイドカー)、`report` (Markdown レポート)。

実行のディスク上のアーティファクトレイアウト:

```text
.artifacts/qa-e2e/mantis/<run-id>/
  mantis-report.md
  mantis-evidence.json
  baseline/
  candidate/
  comparison.json
```

スクリーンショットはエビデンスであり、シークレットではありませんが、それでもリダクション規律が必要です。非公開チャンネル名、ユーザー名、またはメッセージ内容が表示される可能性があります。公開アーティファクトのアップロードでは `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を設定してください。Discord/Slack/Telegram の GitHub ワークフローではデフォルトで有効です。

## GitHub 自動化

`scripts/mantis/publish-pr-evidence.mjs` は再利用可能な公開ツールです。ワークフローは、マニフェスト、対象 PR、アーティファクトの対象ルート、コメントマーカー、アーティファクト URL、実行 URL、リクエスト元を指定してこれを呼び出します。宣言されたアーティファクトを Mantis R2 バケットにアップロードし、インライン画像/プレビューとリンク付き動画を含む、サマリー優先の PR コメントを構築してから、既存のマーカーコメントを更新するか、新しいコメントを作成します。必須 env:

- `MANTIS_ARTIFACT_R2_ACCESS_KEY_ID`
- `MANTIS_ARTIFACT_R2_SECRET_ACCESS_KEY`
- `MANTIS_ARTIFACT_R2_BUCKET` (ワークフローでは `openclaw-crabbox-artifacts` を設定)
- `MANTIS_ARTIFACT_R2_ENDPOINT`
- `MANTIS_ARTIFACT_R2_REGION` (ワークフローでは `auto` を設定)
- `MANTIS_ARTIFACT_R2_PUBLIC_BASE_URL` (ワークフローでは `https://artifacts.openclaw.ai` を設定)

コメントは `github-actions[bot]` ではなく、Mantis GitHub App (`MANTIS_GITHUB_APP_ID` / `MANTIS_GITHUB_APP_PRIVATE_KEY`) 経由で投稿され、非表示のマーカーコメントを upsert キーとして使用します。

| ワークフロー                          | トリガー                                                                                    | 実行内容                                                                                                                                                                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mantis Discord Smoke`            | 手動ディスパッチ                                                                            | 選択した ref に対して `discord-smoke` を実行します。                                                                                                                                                                                                                                                  |
| `Mantis Discord Status Reactions` | PR コメントまたは手動ディスパッチ                                                              | baseline/candidate の別々のワークツリーを構築し、それぞれで `discord-status-reactions-tool-only` を実行し、各レーンのタイムラインを Crabbox デスクトップブラウザでレンダリングし、`crabbox media preview` で動き部分にトリミングした GIF/MP4 プレビューを生成し、アーティファクトをアップロードし、インライン PR エビデンスを投稿します。            |
| `Mantis Scenario`                 | 手動ディスパッチ                                                                            | 汎用ディスパッチャー: `scenario_id` (`discord-status-reactions-tool-only`, `discord-thread-reply-filepath-attachment`, `slack-desktop-smoke`, `telegram-live`, `telegram-desktop-proof`)、`baseline_ref`、`candidate_ref`、`pr_number` を受け取り、対応するシナリオワークフローへ転送します。 |
| `Mantis Slack Desktop Smoke`      | 手動ディスパッチ                                                                            | Crabbox Linux デスクトップをリースし (デフォルトは `aws`、`hetzner` も選択可能)、candidate に対して `slack-desktop-smoke --gateway-setup` を実行し、デスクトップを録画し、モーションプレビューを生成し、アーティファクトをアップロードし、PR 番号が指定されている場合は PR エビデンスを投稿します。                                 |
| `Mantis Telegram Live`            | PR コメントまたは手動ディスパッチ                                                              | bot-API Telegram ライブ QA レーン (`openclaw qa telegram`) を実行し、QA サマリーから `mantis-evidence.json` を書き込み、Crabbox デスクトップブラウザでリダクション済みエビデンス HTML をレンダリングし、モーション GIF を生成し、PR エビデンスを投稿します。このレーンでは Telegram Web ログインは不要です。          |
| `Mantis Telegram Desktop Proof`   | メンテナー PR ラベル (`mantis: telegram-visible-proof`) と PR コメント、または手動ディスパッチ | Agentic なネイティブ Telegram Desktop の前後証明です。PR、baseline/candidate ref、メンテナーの指示を Codex に渡し、Codex が両方の ref で実ユーザー Crabbox Telegram Desktop 証明レーンを実行し、2 列の PR エビデンステーブルを投稿します。                                         |

`Mantis Discord Status Reactions` と `Mantis Telegram Live` はどちらも `baseline_ref`/`candidate_ref` (または PR コメント内の `baseline=`/`candidate=`) を受け取り、シークレットを含む認証情報で実行する前に、解決された SHA が `origin/main` の祖先、リリースタグ (`v*`)、またはオープン PR の head のいずれかであることを検証します。

書き込み/メンテナンス/管理アクセス権を持つ PR からのコメントトリガー:

```text
@openclaw-mantis discord status reactions
@openclaw-mantis discord status reactions baseline=origin/main candidate=HEAD
@openclaw-mantis telegram
@openclaw-mantis telegram scenario=telegram-status-command
@openclaw-mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

Telegram コメントトリガーは、デフォルトで PR head SHA を candidate、`telegram-status-command` をシナリオとして使用します。特定の Crabbox プロバイダーまたは事前ウォーム済みデスクトップを対象にするため、`provider=aws|hetzner` と `lease=<cbx_...>` を受け付けます。`Mantis Telegram Desktop Proof` は、PR にすでに `mantis: telegram-visible-proof` ラベルが付いている場合にのみ、PR コメントに応答します。

ClawSweeper もシナリオを直接ディスパッチできます。

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
```

## マシンとシークレット

ローカル CLI Crabbox のデフォルトは `--provider hetzner --class beast` です。`--provider`、`--class`/`--machine-class`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` / `OPENCLAW_MANTIS_CRABBOX_CLASS` で上書きできます。GitHub ワークフローでは通常、両方を上書きします (たとえば `--class standard`、および Slack ワークフローの `aws`/`hetzner` プロバイダー選択入力)。プロバイダーが遅すぎる、または利用できない場合は、フォールバックをハードコードするのではなく、同じ Crabbox インターフェイスの背後に追加してください。

VM baseline: デスクトップ対応 Chrome/Chromium、CDP アクセス、VNC/noVNC、Node 22+ と pnpm、OpenClaw チェックアウト、対象トランスポート、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセスを備えた Linux。

Mantis ワークフロー全体で使用されるシークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` 公開アーティファクトアップロード用
- `OPENCLAW_QA_CONVEX_SITE_URL`, `OPENCLAW_QA_CONVEX_SECRET_CI`
- `CRABBOX_COORDINATOR` / `CRABBOX_COORDINATOR_TOKEN` (ワークフローはフォールバックとして `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR` / `_TOKEN` も受け付け、Crabbox を呼び出す前にプレーンな名前へマップします)
- `MANTIS_GITHUB_APP_ID`, `MANTIS_GITHUB_APP_PRIVATE_KEY`

Mantis ランナーは、Discord/Slack/Telegram bot トークン、プロバイダー API キー、ブラウザ Cookie、認証プロファイル内容、VNC パスワード、または生の認証情報ペイロードを決して出力してはいけません。トークンが issue、PR、チャット、またはログに漏れた場合は、置換シークレットを保存した後にローテーションしてください。

## 実行結果

シナリオは区別可能な 2 つの方法のいずれかで失敗し、レポートではそれらを分離します。これにより、不安定な環境がプロダクトのリグレッションとして読まれることを防ぎます。

- **バグが再現された**: baseline がシナリオの期待どおりに失敗しました。
- **ハーネス失敗**: oracle が意味を持つ前に、環境セットアップ、認証情報、トランスポート API、ブラウザ、またはプロバイダーが失敗しました。

## シナリオの追加

シナリオは、スタンドアロンの宣言的ファイル形式ではなく、トランスポートごとに TypeScript で定義されます (Discord の前後形状については `extensions/qa-lab/src/mantis/run.runtime.ts` の `MANTIS_SCENARIO_CONFIGS` を参照)。各シナリオには、id とタイトル、トランスポート、必須認証情報、baseline ref ポリシー、candidate ref ポリシー、OpenClaw config パッチ、セットアップ/刺激ステップ、期待される baseline と candidate の oracle、視覚キャプチャ対象、タイムアウト予算、クリーンアップステップが必要です。

ビジョンチェックよりも、小さく型付けされた oracle を優先してください。Discord のリアクション状態またはメッセージ参照、Slack スレッド `ts`/リアクション API 状態、メールメッセージ ID とヘッダーなどです。UI が唯一の信頼できる観測対象である場合はブラウザスクリーンショットを使用し、プラットフォーム API oracle が存在する場合は、ビジョンチェックをそれに対する追加的なものにしてください。

Discord、Slack、Telegram の後は、同じランナー形状を WhatsApp (QR ログイン、再識別、配信、メディア、リアクション) と Matrix (暗号化ルーム、スレッド/返信関係、再起動再開) に拡張できます。どちらもまだ実装されていません。

## 未解決の質問

- 既存の Mantis bot を再利用する場合、どの Discord bot をドライバーと SUT にするべきか。
- GitHub は PR の Mantis アーティファクトをどのくらい保持するべきか。
- ClawSweeper は、メンテナーコマンドを待つ代わりに、いつ Mantis シナリオを自動的に推奨するべきか。
- 公開 PR では、アップロード前にスクリーンショットをリダクションまたはクロップするべきか。
