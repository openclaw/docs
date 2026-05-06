---
read_when:
    - OpenClaw のバグ向けライブビジュアル QA の構築または実行
    - プルリクエストに変更前後の検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスを必要とする QA 実行のデバッグ
summary: Mantis は、ライブのトランスポート上で OpenClaw のバグを再現し、修正前後の証拠を取得して、成果物を PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-06T05:01:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b470cfe2b79dc6eee7382122c6ad7d1a9f7df6a1c4972254cd2672eefcf54e22
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、そして目に見える証拠が必要なバグのための OpenClaw エンドツーエンド検証システムです。既知の不良 ref に対してシナリオを実行し、証拠をキャプチャし、同じシナリオを候補 ref に対して実行して、その比較を、メンテナーが PR またはローカルコマンドから確認できる成果物として公開します。

Mantis は Discord から始まります。Discord は、実際の bot 認証、実際の guild チャンネル、リアクション、スレッド、ネイティブコマンド、そして人間がトランスポートに表示された内容を視覚的に確認できるブラウザ UI という、価値の高い最初のレーンを提供するためです。

## 目標

- GitHub issue または PR のバグを、ユーザーが見るものと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref で **before** 成果物をキャプチャする。
- 修正を適用した後に、候補 ref で **after** 成果物をキャプチャする。
- 可能な限り、Discord REST のリアクション読み取りやチャンネル transcript チェックのような決定的なオラクルを使用する。
- バグに目に見える UI サーフェスがある場合はスクリーンショットをキャプチャする。
- エージェント制御の CLI からローカルで、GitHub からリモートで実行する。
- ログイン、ブラウザ自動化、またはプロバイダー認証が詰まったときに VNC で救援できるだけのマシン状態を保持する。
- 実行がブロックされたとき、手動 VNC 支援が必要なとき、または完了したときに、オペレーター用 Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis は unit test の代替ではありません。修正内容が理解された後、Mantis 実行は通常、より小さな回帰テストになるべきです。
- Mantis は通常の高速な CI ゲートではありません。これは遅く、ライブ認証情報を使用し、ライブ環境が重要なバグのために予約されています。
- Mantis は通常運用で人間を必要とするべきではありません。手動 VNC は救援経路であり、正常系ではありません。
- Mantis は成果物、ログ、スクリーンショット、Markdown レポート、PR コメントに生のシークレットを保存しません。

## 所有範囲

Mantis は OpenClaw QA スタックに属します。

- OpenClaw は、シナリオランタイム、トランスポートアダプター、証拠スキーマ、`pnpm openclaw qa mantis` 配下のローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部品、ブラウザキャプチャヘルパー、成果物ライターを所有します。
- Crabbox は、リモート VM が必要なときにウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモート workflow エントリーポイントと成果物保持を所有します。
- ClawSweeper は、メンテナーコマンドの解析、workflow のディスパッチ、最終 PR コメントの投稿という GitHub コメントルーティングを所有します。
- OpenClaw エージェントは、シナリオにエージェント的なセットアップ、デバッグ、または詰まり状態の報告が必要なとき、Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナー workflow の接着部分は ClawSweeper に保持されます。

## コマンド形式

最初のローカルコマンドは、Discord bot、guild、チャンネル、メッセージ送信、リアクション送信、成果物パスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before と after ランナーは、この形式を受け取ります。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは出力ディレクトリ配下に切り離されたベースラインおよび候補 worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行した後、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とは、ベースラインのステータスが `fail` で候補のステータスが `pass` であることを意味します。

2 つ目の Discord before/after プローブは、スレッド添付を対象にします。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-thread-reply-filepath-attachment \
  --baseline <bug-ref> \
  --candidate <fix-ref> \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-thread-attachment
```

このシナリオはドライバー bot で親メッセージを投稿し、実際の Discord スレッドを作成し、リポジトリローカルの `filePath` を使って OpenClaw の `message.thread-reply` アクションを呼び出し、その後スレッドをポーリングして SUT の返信と添付ファイル名を確認します。ベースラインのスクリーンショットには添付なしの返信が表示され、候補のスクリーンショットには期待される `mantis-thread-report.md` 添付が表示されます。

最初の VM/ブラウザ primitive は desktop smoke です。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で表示可能なブラウザを起動し、デスクトップをキャプチャし、成果物をローカル出力ディレクトリへ取り込み、レポートに再接続コマンドを書き込みます。このコマンドは Hetzner プロバイダーをデフォルトにします。これは Mantis レーンでデスクトップ/VNC カバレッジが動作する最初のプロバイダーだからです。別の Crabbox fleet に対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

便利な desktop smoke フラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、表示可能なブラウザで開くページを変更します。
- `--html-file <path>` は、リポジトリローカルの HTML 成果物を表示可能なブラウザでレンダリングします。Mantis はこれを使い、生成された Discord ステータスリアクションタイムラインを実際の Crabbox デスクトップ経由でキャプチャします。
- `--browser-profile-dir <remote-path>` は、リモート Chrome user-data-dir を再利用します。これにより、永続 Mantis デスクトップが実行間でログイン状態を保てます。長期間維持される Discord Web viewer プロファイルに使用します。
- `--browser-profile-archive-env <name>` は、ブラウザ起動前に、指定した環境変数から base64 `.tgz` Chrome user-data-dir アーカイブを復元します。Discord Web のようなログイン済み witness に使用します。デフォルトの env var は `OPENCLAW_MANTIS_BROWSER_PROFILE_TGZ_B64` です。
- `--video-duration <seconds>` は、MP4 キャプチャ長を制御します。落ち着くまで時間が必要な、ログイン済みの遅い Web アプリには長めの duration を使用します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新規作成され成功した lease を VNC 確認用に開いたままにします。失敗した実行では、オペレーターが再接続できるよう、lease が作成された場合はデフォルトで保持します。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズと lease の寿命を調整します。

Discord Web の証拠では、Mantis は bot token ではなく専用の viewer アカウントを使用します。ライブ Discord API シナリオはオラクルのままです。これは実際のスレッドを作成し、SUT の `thread-reply` を送信し、Discord REST 経由で添付を確認します。`OPENCLAW_QA_DISCORD_CAPTURE_UI_METADATA=1` が設定されている場合、シナリオは Discord Web URL 成果物も書き込みます。`OPENCLAW_QA_DISCORD_KEEP_THREADS=1` が設定されている場合、ログイン済みブラウザが開いて記録できるだけの時間、そのスレッドを利用可能な状態で残します。

GitHub workflow は候補スレッド URL を Discord Web で開き、スクリーンショットをキャプチャし、MP4 を記録し、Crabbox メディアツールが利用可能な場合はトリミング済み GIF プレビューを生成します。`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` で設定した永続 viewer プロファイルパスを優先してください。完全な Chrome プロファイルアーカイブは GitHub のシークレットサイズ制限を超える可能性があるためです。小さな/bootstrap プロファイルでは、workflow は `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` から base64 `.tgz` アーカイブを復元することもできます。どちらのプロファイルソースも設定されていない場合でも、workflow は決定的なベースライン/候補の添付スクリーンショットを公開し、ログイン済み Discord Web witness がスキップされたという notice を記録します。

最初の完全なデスクトップトランスポート primitive は Slack desktop smoke です。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在の checkout を VM に同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザで Slack Web を開き、表示可能なデスクトップをキャプチャし、Slack QA 成果物と VNC スクリーンショットの両方をローカル出力ディレクトリへコピーします。これは、SUT OpenClaw Gateway とブラウザの両方が同じ Linux デスクトップ VM 内に存在する最初の Mantis 形式です。

`--gateway-setup` を付けると、コマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的な使い捨て OpenClaw home を準備し、選択したチャンネル向けに Slack Socket Mode 設定をパッチし、ポート `38973` で `openclaw gateway run` を起動し、VNC セッション内で Chrome を実行したままにします。これは「Slack と claw が実行されている Linux デスクトップを残す」モードです。`--gateway-setup` が省略された場合、bot-to-bot Slack QA レーンがデフォルトのままです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` のみが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` へマッピングし、Crabbox の `OPENCLAW_*` env 転送が VM 内へ運べるようにします。

`--gateway-setup --credential-source convex` では、Mantis は VM を作成する前に共有 pool から Slack SUT 認証情報をリースし、リースされた channel id、Socket Mode app token、bot token を、デスクトップ内の `OPENCLAW_MANTIS_SLACK_*` runtime env として転送します。これにより GitHub workflows は薄く保たれます。必要なのは Convex broker シークレットだけで、生の Slack bot token や app token は不要です。

便利な Slack desktop フラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしたマシンに対して再実行します。
- `--gateway-setup` は、bot-to-bot QA レーンのみを実行する代わりに、VM 内で永続 OpenClaw Slack Gateway を起動します。
- `--keep-lease` は、成功後に VNC 確認用として Gateway VM を開いたままにします。`--no-keep-lease` は成果物収集後に停止します。
- `--slack-url <url>` は、特定の Slack Web URL を開きます。指定がない場合、SUT bot token が利用可能なら、Mantis は Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、Gateway セットアップで使用される Slack チャンネル allowlist を制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続 Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` で、同じ lease 上の再実行でも手動 Slack Web ログインが維持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack env token ではなく共有認証情報 pool を使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は、Slack ライブレーンへ渡されます。

GitHub smoke workflow は `Mantis Discord Smoke` です。最初の実シナリオ向けの before と after GitHub workflow は `Mantis Discord Status Reactions` です。これは以下を受け取ります。

- `baseline_ref`: queued のみの挙動を再現すると期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を表示すると期待される ref。

これは workflow harness ref を checkout し、ベースラインと候補の worktree を別々にビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions 成果物としてアップロードします。また、各レーンのタイムライン HTML を Crabbox デスクトップブラウザでレンダリングし、決定的なタイムライン PNG と並べて、それらの VNC スクリーンショットを PR コメントで公開します。同じ PR コメントには、`crabbox media preview` が生成した軽量なモーショントリミング済み GIF プレビューを埋め込み、対応するモーショントリミング済み MP4 クリップへリンクし、詳細確認用に完全なデスクトップ MP4 ファイルを保持します。スクリーンショットはすばやくレビューできるよう inline のままにします。workflow は `openclaw/crabbox` main から Crabbox CLI をビルドし、次の Crabbox バイナリリリースが作成される前に現在のデスクトップ/ブラウザ lease フラグを使用できるようにします。

`Mantis Scenario` は汎用の手動エントリーポイントです。`scenario_id`、`candidate_ref`、任意の `baseline_ref`、任意の `pr_number` を受け取り、その後、シナリオ所有の workflow をディスパッチします。ラッパーは意図的に薄く保たれています。シナリオ workflow は引き続き、自身のトランスポートセットアップ、認証情報、VM class、期待されるオラクル、成果物 manifest を所有します。

`Mantis Slack Desktop Smoke` は最初の Slack VM ワークフローです。これは別の worktree で
信頼済みの候補 ref をチェックアウトし、Crabbox Linux デスクトップをリースし、
その候補に対して `pnpm openclaw qa mantis slack-desktop-smoke --gateway-setup` を実行し、
VNC ブラウザーで Slack Web を開き、デスクトップを録画し、
`crabbox media preview` でモーショントリミング済みプレビューを生成し、完全な artifact
ディレクトリをアップロードし、必要に応じて対象 PR にインライン証拠コメントを投稿します。
デスクトップリースにはデフォルトで AWS を使い、AWS のキャパシティが遅い、または利用できない場合に
オペレーターが Hetzner に切り替えられるよう、手動のプロバイダー入力を公開します。
bot-to-bot の Slack トランスクリプトだけではなく、「Slack と claw が動いている Linux デスクトップ」
が必要なときにこの lane を使います。

すべての PR 公開シナリオは、レポートの隣に `mantis-evidence.json` を書き込みます。
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

Artifact の `path` 値は、manifest ディレクトリからの相対パスです。`targetPath`
値は、`qa-artifacts` ブランチの公開ディレクトリ配下の相対パスです。
publisher はパストラバーサルを拒否し、任意のプレビューや動画が利用できない場合は
`"required": false` とマークされたエントリをスキップします。

サポートされる artifact 種別:

- `timeline`: 決定的なシナリオスクリーンショット。通常は前後比較。
- `desktopScreenshot`: VNC/ブラウザーデスクトップのスクリーンショット。
- `motionPreview`: デスクトップ録画から生成されたインラインアニメーション GIF。
- `motionClip`: 静的な導入部と末尾を削除した、モーショントリミング済み MP4。
- `fullVideo`: 詳細調査用の完全な MP4 録画。
- `metadata`: JSON/ログのサイドカー。
- `report`: Markdown レポート。

再利用可能な publisher は `scripts/mantis/publish-pr-evidence.mjs` です。ワークフローは
manifest、対象 PR、`qa-artifacts` の対象ルート、コメントマーカー、
Actions artifact URL、run URL、リクエスト元を指定してこれを呼び出します。宣言された artifact を
`qa-artifacts` ブランチにコピーし、インライン画像/プレビューとリンク付き動画を含む
サマリー優先の PR コメントを作成してから、既存のマーカーコメントを更新するか
新規作成します。

PR コメントから status-reactions run を直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭くしています。pull request コメントで、write、maintain、
または admin アクセスを持つユーザーからのものだけを実行し、Discord status-reaction
リクエストだけを認識します。デフォルトでは、既知の不良 baseline ref と現在の PR head SHA を
候補として使います。メンテナーはどちらの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的で、シナリオに焦点を当てています。2 つ目は、後で PR
または issue を、ラベル、変更ファイル、ClawSweeper レビュー結果に基づく
推奨 Mantis シナリオへマッピングできます。

## 実行ライフサイクル

1. 認証情報を取得します。
2. VM を割り当てるか再利用します。
3. シナリオが UI 証拠を必要とする場合は、デスクトップ/ブラウザープロファイルを準備します。
4. baseline ref 用のクリーンなチェックアウトを準備します。
5. 依存関係をインストールし、シナリオが必要とするものだけをビルドします。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を起動します。
7. ライブ transport、プロバイダー、モデル、ブラウザープロファイルを設定します。
8. シナリオを実行し、baseline 証拠を取得します。
9. Gateway を停止し、ログを保持します。
10. 同じ VM で candidate ref を準備します。
11. 同じシナリオを実行し、candidate 証拠を取得します。
12. oracle 結果と視覚的証拠を比較します。
13. Markdown、JSON、ログ、スクリーンショット、任意の trace artifact を書き込みます。
14. GitHub Actions artifact をアップロードします。
15. 簡潔な PR または Discord ステータスメッセージを投稿します。

シナリオは、2 つの異なる方法で失敗できる必要があります。

- **バグ再現**: baseline が想定どおりに失敗した。
- **ハーネス失敗**: バグ oracle が意味を持つ前に、環境セットアップ、認証情報、Discord API、ブラウザー、または
  プロバイダーが失敗した。

最終レポートでは、メンテナーが不安定な環境と製品の挙動を混同しないよう、
これらのケースを分離する必要があります。

## Discord MVP

最初のシナリオは、ソース返信 delivery mode が `message_tool_only` である guild channel の
Discord status reactions を対象にする必要があります。

これが Mantis の優れた種になる理由:

- トリガー元メッセージ上の reaction として Discord で見える。
- Discord メッセージ reaction state を通じた強力な REST oracle がある。
- 実際の OpenClaw Gateway、Discord bot 認証、メッセージ dispatch、
  ソース返信 delivery mode、status reaction state、モデル turn ライフサイクルを実行する。
- 最初の実装を誠実に保つのに十分狭い。

想定されるシナリオ形状:

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

Baseline 証拠は、queued acknowledgement reaction はあるが、tool-only mode では
ライフサイクル遷移がないことを示す必要があります。Candidate 証拠は、
`messages.statusReactions.enabled` が明示的に true のときに lifecycle status reactions が
実行されることを示す必要があります。

実行可能な最初の slice は、opt-in の Discord live QA シナリオです。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

これは、常時有効な guild handling、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、明示的な status reactions で SUT を設定します。oracle は
実際の Discord トリガー元メッセージをポーリングし、観測されたシーケンス
`👀 -> 🤔 -> 👍` を期待します。Artifact には `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html`、
`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 部品

Mantis はゼロから始めるのではなく、既存の private QA stack を土台にする必要があります。

- `pnpm openclaw qa discord` は、driver bot と SUT bot を使った live Discord lane をすでに実行します。
- live transport runner は、`.artifacts/qa-e2e/` 配下にレポートと observed-message
  artifact をすでに書き込みます。
- Convex credential lease は、共有 live transport 認証情報への排他的アクセスをすでに提供します。
- ブラウザー制御サービスは、スクリーンショット、snapshot、
  headless managed profile、remote CDP profile をすでにサポートしています。
- QA Lab には、transport 形状のテスト用の debugger UI と bus がすでにあります。

最初の Mantis 実装は、これらの部品の上に構築する薄い before/after runner と、
1 つの視覚的証拠レイヤーにできます。

## 証拠モデル

すべての run は安定した artifact ディレクトリを書き込みます。

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

`mantis-summary.json` は機械可読な source of truth である必要があります。
Markdown レポートは PR コメントと人間のレビュー用です。

サマリーには以下を含める必要があります。

- テストした ref と SHA
- transport と scenario id
- machine provider と machine id または lease id
- secret 値を含まない credential source
- baseline result
- candidate result
- baseline でバグが再現したかどうか
- candidate が修正したかどうか
- artifact path
- sanitized setup または cleanup issue

スクリーンショットは証拠であり、secret ではありません。それでも redaction discipline は必要です。
private channel name、user name、message content が現れる可能性があります。public PR では、
redaction story がより強固になるまで、インライン画像よりも GitHub Actions artifact link を優先します。

## ブラウザーと VNC

ブラウザー lane には 2 つのモードがあります。

- **Headless automation**: CI のデフォルト。Chrome は CDP を有効にして動作し、
  Playwright または OpenClaw browser control がスクリーンショットを取得します。
- **VNC rescue**: login、MFA、Discord anti-automation、または visual debugging で人間が必要な場合に、
  同じ VM で有効にします。

Discord observer browser profile は、毎回ログインしなくて済む程度に永続的であるべきですが、
個人のブラウザー状態からは分離されている必要があります。profile は開発者 laptop ではなく、
Mantis machine pool に属します。

Mantis が詰まった場合、次を含む Discord ステータスメッセージを投稿します。

- run id
- scenario id
- machine provider
- artifact directory
- 利用可能な場合は VNC または noVNC の接続手順
- 短い blocker text

最初の private deployment では、これらのメッセージを既存の operator channel に投稿し、
後で専用の Mantis channel に移行できます。

## マシン

Mantis は、最初のリモート実装では Crabbox 経由の AWS を優先する必要があります。
Crabbox は、ウォーム済みマシン、lease tracking、hydration、ログ、結果、
cleanup を提供します。AWS のキャパシティが遅すぎる、または利用できない場合は、同じ machine interface の背後に
Hetzner provider を追加します。

最小 VM 要件:

- desktop 対応の Chrome または Chromium がインストールされた Linux
- browser automation 用の CDP access
- rescue 用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw checkout と dependency cache
- Playwright を使う場合は Playwright Chromium browser cache
- 1 つの OpenClaw Gateway、1 つの browser、1 つの model run に十分な CPU とメモリ
- Discord、GitHub、model provider、credential broker への outbound access

VM は、想定される credential store または browser profile store の外に、
長期間有効な raw secret を保持してはなりません。

## Secret

Secret は、リモート run では GitHub organization または repository secret に、
ローカル run ではローカルの operator-controlled secret file に保存します。

推奨 secret name:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` for public GitHub artifact uploads
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期的には、Convex credential pool が live transport 認証情報の通常の source であり続けるべきです。
GitHub secrets は broker と fallback lane を bootstrap します。
Discord status-reactions workflow は、Mantis Crabbox secrets を Crabbox CLI が期待する
`CRABBOX_COORDINATOR` および `CRABBOX_COORDINATOR_TOKEN` 環境変数にマッピングし直します。
plain な `CRABBOX_*` GitHub secret name は、compatibility fallback として引き続き受け付けられます。

Mantis runner は絶対に次を出力してはなりません。

- Discord bot token
- provider API key
- browser cookie
- auth profile content
- VNC password
- raw credential payload

Public artifact upload では、bot、guild、channel、message id などの Discord target metadata も
redact する必要があります。GitHub smoke workflow はこの理由で
`OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

token が issue、PR、chat、log に誤って貼り付けられた場合は、
新しい secret が保存された後に rotate します。

## GitHub artifact と PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期間のみ保持される Actions アーティファクトとしてアップロードする必要があります。ワークフローがバグレポートまたは修正 PR のために実行される場合は、編集済みの PNG スクリーンショットを `qa-artifacts` ブランチにも公開し、そのバグまたは修正 PR に、前後比較スクリーンショットをインラインで含むコメントを upsert する必要があります。主要な証拠を汎用の QA 自動化 PR だけに投稿しないでください。生ログ、観測されたメッセージ、その他の大きな証拠は Actions アーティファクトに保持します。

本番ワークフローは、それらのコメントを `github-actions[bot]` ではなく、Mantis GitHub App で投稿する必要があります。アプリ id と秘密鍵を `MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions シークレットとして保存します。ワークフローは非表示マーカーを upsert キーとして使用し、トークンが編集できる場合はそのコメントを更新し、古い bot 所有のマーカーを編集できない場合は Mantis 所有の新しいコメントを作成します。

PR コメントは短く、視覚的である必要があります。

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

ハーネスの失敗が原因で実行が失敗した場合、コメントでは候補が失敗したかのように示唆するのではなく、そのことを明記する必要があります。

## 非公開デプロイの注記

非公開デプロイには、すでに Mantis Discord アプリケーションがある場合があります。適切な bot 権限があり、安全にローテーションできる場合は、別のアプリを作成せずにそのアプリケーションを再利用します。

初期のオペレーター通知チャンネルは、シークレットまたはデプロイ設定で指定します。最初は既存のメンテナーまたは運用チャンネルを指すようにし、専用の Mantis チャンネルができたらそこへ移動できます。

guild id、channel id、bot トークン、ブラウザー Cookie、VNC パスワードをこのドキュメントに記載しないでください。それらは GitHub シークレット、認証情報ブローカー、またはオペレーターのローカルシークレットストアに保存します。

## シナリオの追加

Mantis シナリオでは、次を宣言する必要があります。

- id とタイトル
- トランスポート
- 必要な認証情報
- ベースライン ref ポリシー
- 候補 ref ポリシー
- OpenClaw 設定パッチ
- セットアップ手順
- 刺激
- 期待されるベースライン oracle
- 期待される候補 oracle
- 視覚キャプチャ対象
- タイムアウト予算
- クリーンアップ手順

シナリオでは、小さく型付けされた oracle を優先する必要があります。

- リアクションのバグでは Discord のリアクション状態
- スレッドのバグでは Discord のメッセージ参照
- Slack のバグでは Slack のスレッド ts とリアクション API 状態
- メールのバグではメールのメッセージ id とヘッダー
- UI が唯一の信頼できる観測対象である場合はブラウザーのスクリーンショット

ビジョンチェックは追加的なものにする必要があります。プラットフォーム API でバグを証明できる場合は、その API を合否判定の oracle として使用し、スクリーンショットは人間の信頼性確認のために保持します。

## プロバイダーの拡張

Discord の後、同じ runner で次を追加できます。

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- Email: コネクターだけでは不十分な場合の、`gog` を使用した Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションのゲート制御、コマンド、利用可能な場合のリアクション。
- Matrix: 暗号化されたルーム、スレッドまたは返信の関係、再起動後の再開。

各トランスポートには、低コストのスモークシナリオを 1 つと、バグクラス別シナリオを 1 つ以上用意する必要があります。高コストな視覚シナリオは opt-in のままにします。

## 未解決の質問

- 既存の Mantis bot を再利用する場合、どの Discord bot をドライバーにし、どれを SUT にするべきですか？
- 最初のフェーズでは、観測用ブラウザーのログインに人間の Discord アカウント、テストアカウント、または bot が読み取れる REST 証拠のみのどれを使うべきですか？
- GitHub は PR の Mantis アーティファクトをどのくらいの期間保持するべきですか？
- ClawSweeper は、メンテナーコマンドを待たずに、どのタイミングで Mantis を自動的に推奨するべきですか？
- 公開 PR では、アップロード前にスクリーンショットを編集またはクロップするべきですか？
