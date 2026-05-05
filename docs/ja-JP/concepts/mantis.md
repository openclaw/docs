---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストに事前・事後の検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠をキャプチャし、アーティファクトをプルリクエストに添付するための、視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-05T06:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26a9671135e38bf82d3627364f691f8d91cc8649ffc2e5fa782ebef474a44fa1
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、目に見える証拠が必要なバグのための OpenClaw エンドツーエンド検証システムです。既知の不良 ref に対してシナリオを実行して証拠を取得し、候補 ref に対して同じシナリオを実行して、メンテナーが PR またはローカルコマンドから確認できるアーティファクトとして比較を公開します。

Mantis は Discord から始まります。Discord は価値の高い最初のレーンを提供するためです。実際の bot 認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、そして人間がトランスポートで表示された内容を視覚的に確認できるブラウザー UI があります。

## 目標

- ユーザーが見るものと同じトランスポート形状で、GitHub issue または PR のバグを再現する。
- 修正を適用する前に、ベースライン ref で **before** アーティファクトを取得する。
- 修正を適用した後に、候補 ref で **after** アーティファクトを取得する。
- 可能な限り、Discord REST リアクション読み取りやチャンネルトランスクリプト確認など、決定論的なオラクルを使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカル実行し、GitHub からリモート実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まったときに VNC レスキューを行えるよう、十分なマシン状態を保持する。
- 実行がブロックされた、手動 VNC 支援が必要、または完了したときに、オペレーター用 Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis は単体テストの代替ではありません。通常、Mantis 実行は修正を理解した後に、より小さな回帰テストになるべきです。
- Mantis は通常の高速 CI ゲートではありません。より遅く、ライブ認証情報を使用し、ライブ環境が重要なバグのために予約されています。
- Mantis は通常運用で人間を必要とすべきではありません。手動 VNC はレスキュー経路であり、正常系ではありません。
- Mantis は、生のシークレットをアーティファクト、ログ、スクリーンショット、Markdown レポート、PR コメントに保存しません。

## 所有権

Mantis は OpenClaw QA スタックに属します。

- OpenClaw は、`pnpm openclaw qa mantis` 配下のシナリオランタイム、トランスポートアダプター、証拠スキーマ、ローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部分、ブラウザー取得ヘルパー、アーティファクトライターを所有します。
- リモート VM が必要な場合、Crabbox はウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有します。
- ClawSweeper は、メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿という GitHub コメントルーティングを所有します。
- シナリオにエージェント的なセットアップ、デバッグ、または詰まり状態の報告が必要な場合、OpenClaw エージェントは Codex 経由で Mantis を動かします。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保たれます。

## コマンド形状

最初のローカルコマンドは、Discord bot、ギルド、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before と after ランナーは、この形状を受け付けます。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは、出力ディレクトリ配下に分離されたベースラインと候補の worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とはベースラインのステータスが `fail` で、候補のステータスが `pass` であることを意味します。

最初の VM/ブラウザープリミティブは、デスクトップ smoke です。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で表示可能なブラウザーを起動し、デスクトップを取得し、アーティファクトをローカル出力ディレクトリへ戻し、再接続コマンドをレポートへ書き込みます。このコマンドのデフォルトは Hetzner プロバイダーです。これは、Mantis レーンで動作するデスクトップ/VNC カバレッジを持つ最初のプロバイダーだからです。別の Crabbox フリートに対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

有用なデスクトップ smoke フラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、表示可能なブラウザーで開くページを変更します。
- `--html-file <path>` は、repo ローカルの HTML アーティファクトを表示可能なブラウザーでレンダリングします。Mantis はこれを使用して、生成された Discord ステータスリアクションのタイムラインを実際の Crabbox デスクトップ経由で取得します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新しく作成された成功済みリースを VNC 検査用に開いたままにします。失敗した実行では、オペレーターが再接続できるように、リースが作成されていた場合はデフォルトで保持します。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース寿命を調整します。

最初の完全なデスクトップトランスポートプリミティブは、Slack デスクトップ smoke です。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在のチェックアウトを VM 内へ同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、表示されているデスクトップを取得し、Slack QA アーティファクトと VNC スクリーンショットの両方をローカル出力ディレクトリへコピーします。これは、SUT OpenClaw gateway とブラウザーの両方が同じ Linux デスクトップ VM 内に存在する最初の Mantis 形状です。

`--gateway-setup` を指定すると、コマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的で使い捨ての OpenClaw ホームを準備し、選択されたチャンネル用に Slack Socket Mode 設定をパッチし、`38973` ポートで `openclaw gateway run` を開始し、Chrome を VNC セッション内で実行したままにします。これは「Slack と claw が実行中の Linux デスクトップを残す」モードです。`--gateway-setup` を省略した場合は、bot-to-bot Slack QA レーンがデフォルトのままです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` だけが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` にマッピングし、Crabbox の `OPENCLAW_*` env 転送が VM 内へ運べるようにします。

有用な Slack デスクトップフラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしたマシンに対して再実行します。
- `--gateway-setup` は、bot-to-bot QA レーンだけを実行する代わりに、VM 内で永続的な OpenClaw Slack gateway を開始します。
- `--slack-url <url>` は、特定の Slack Web URL を開きます。指定しない場合、SUT bot token が利用可能であれば、Mantis は Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、gateway セットアップで使用される Slack チャンネル allowlist を制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続的な Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` なので、手動の Slack Web ログインは同じリースでの再実行をまたいで保持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack env token の代わりに共有認証情報プールを使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は、Slack ライブレーンへそのまま渡されます。

GitHub smoke ワークフローは `Mantis Discord Smoke` です。最初の実シナリオの before and after GitHub ワークフローは `Mantis Discord Status Reactions` です。これは以下を受け付けます。

- `baseline_ref`: queued-only 動作を再現すると期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すと期待される ref。

これはワークフローハーネス ref をチェックアウトし、個別のベースラインと候補 worktree をビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、各レーンのタイムライン HTML を Crabbox デスクトップブラウザーでレンダリングし、その VNC スクリーンショットを決定論的なタイムライン PNG と並べて PR コメントに公開します。同じ PR コメントは、VNC ブラウザーレンダリング中に取得されたデスクトップ MP4 録画へリンクし、スクリーンショットは素早いレビューのためにインラインのままにします。ワークフローは `openclaw/crabbox` main から Crabbox CLI をビルドし、次の Crabbox バイナリリリースが切られる前に現在のデスクトップ/ブラウザーリースフラグを使用できるようにします。

PR コメントから直接ステータスリアクション実行をトリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭くしています。write、maintain、admin アクセスを持つユーザーからの pull request コメントでのみ実行され、Discord ステータスリアクションリクエストだけを認識します。デフォルトでは、既知の不良ベースライン ref と現在の PR head SHA を候補として使用します。メンテナーはいずれの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的で、シナリオに焦点を当てています。2 番目は後で、ラベル、変更ファイル、ClawSweeper レビュー結果から PR または issue を推奨 Mantis シナリオへマッピングできます。

## 実行ライフサイクル

1. 認証情報を取得する。
2. VM を割り当てる、または再利用する。
3. シナリオが UI 証拠を必要とする場合、デスクトップ/ブラウザープロファイルを準備する。
4. ベースライン ref のクリーンなチェックアウトを準備する。
5. 依存関係をインストールし、シナリオが必要とするものだけをビルドする。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を開始する。
7. ライブトランスポート、プロバイダー、モデル、ブラウザープロファイルを設定する。
8. シナリオを実行し、ベースライン証拠を取得する。
9. gateway を停止し、ログを保持する。
10. 同じ VM 内で候補 ref を準備する。
11. 同じシナリオを実行し、候補証拠を取得する。
12. オラクル結果と視覚的証拠を比較する。
13. Markdown、JSON、ログ、スクリーンショット、任意の trace アーティファクトを書き込む。
14. GitHub Actions アーティファクトをアップロードする。
15. 簡潔な PR または Discord ステータスメッセージを投稿する。

シナリオは、2 つの異なる方法で失敗できるべきです。

- **バグが再現された**: ベースラインが期待された方法で失敗した。
- **ハーネス失敗**: 環境セットアップ、認証情報、Discord API、ブラウザー、またはプロバイダーが、バグオラクルに意味が出る前に失敗した。

最終レポートでは、メンテナーが不安定な環境をプロダクトの動作と混同しないように、これらのケースを分離する必要があります。

## Discord MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` であるギルドチャンネルの Discord ステータスリアクションを対象にするべきです。

Mantis の良い種である理由:

- トリガーメッセージ上のリアクションとして Discord に表示される。
- Discord メッセージリアクション状態を通じて強い REST オラクルを持つ。
- 実際の OpenClaw Gateway、Discord bot 認証、メッセージディスパッチ、ソース返信配信モード、ステータスリアクション状態、モデルターンライフサイクルを実行する。
- 最初の実装を誠実に保つのに十分狭い。

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

ベースライン証拠は、queued acknowledgement reaction がある一方で、tool-only モードではライフサイクル遷移がないことを示すべきです。候補証拠は、`messages.statusReactions.enabled` が明示的に true のときに、ライフサイクルステータスリアクションが実行されることを示すべきです。

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

これは、常時有効なギルド処理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、および明示的なステータスリアクションで SUT を構成します。オラクルは実際の Discord トリガーメッセージをポーリングし、観測されたシーケンス
`👀 -> 🤔 -> 👍` を期待します。アーティファクトには `discord-qa-reaction-timelines.json`、
`discord-status-reactions-tool-only-timeline.html`、および
`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 構成要素

Mantis はゼロから始めるのではなく、既存の非公開 QA スタックを土台にする必要があります。

- `pnpm openclaw qa discord` は、driver ボットと SUT ボットを使って、すでにライブ Discord レーンを実行しています。
- ライブトランスポートランナーは、すでに `.artifacts/qa-e2e/` 配下にレポートと観測メッセージのアーティファクトを書き込みます。
- Convex 認証情報リースは、共有ライブトランスポート認証情報への排他的アクセスをすでに提供しています。
- ブラウザー制御サービスは、スクリーンショット、スナップショット、ヘッドレス管理プロファイル、リモート CDP プロファイルをすでにサポートしています。
- QA Lab には、トランスポート形状のテスト向けのデバッガー UI とバスがすでにあります。

最初の Mantis 実装は、これらの構成要素の上に置く薄い前後比較ランナーに、視覚的証拠レイヤーを 1 つ追加したものにできます。

## 証拠モデル

すべての実行は、安定したアーティファクトディレクトリを書き込みます。

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

`mantis-summary.json` は、機械可読な信頼できる情報源であるべきです。
Markdown レポートは PR コメントと人間によるレビューのためのものです。

サマリーには以下を含める必要があります。

- テストされた ref と SHA
- トランスポートとシナリオ id
- マシンプロバイダーとマシン id またはリース id
- シークレット値を含まない認証情報ソース
- baseline の結果
- candidate の結果
- baseline でバグが再現したかどうか
- candidate がそれを修正したかどうか
- アーティファクトパス
- サニタイズ済みのセットアップまたはクリーンアップの問題

スクリーンショットは証拠であり、シークレットではありません。それでも秘匿処理の規律は必要です。非公開チャンネル名、ユーザー名、またはメッセージ内容が表示される場合があります。公開 PR では、秘匿処理の方針がより強固になるまで、インライン画像よりも GitHub Actions アーティファクトリンクを優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルトです。Chrome は CDP を有効にして実行され、Playwright または OpenClaw ブラウザー制御がスクリーンショットを取得します。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、または視覚的デバッグに人間が必要な場合に、同じ VM 上で有効にします。

Discord オブザーバーブラウザープロファイルは、毎回ログインしなくてよい程度に永続的であるべきですが、個人のブラウザー状態からは分離する必要があります。プロファイルは開発者のラップトップではなく、Mantis マシンプールに属します。

Mantis が詰まった場合、次を含む Discord ステータスメッセージを投稿します。

- run id
- scenario id
- machine provider
- artifact directory
- 利用可能な場合は VNC または noVNC の接続手順
- 短いブロッカー説明

最初の非公開デプロイでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、後で専用の Mantis チャンネルへ移行できます。

## マシン

Mantis は、最初のリモート実装では Crabbox 経由の AWS を優先する必要があります。
Crabbox は、ウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、クリーンアップを提供します。AWS の容量が遅すぎる、または利用できない場合は、同じマシンインターフェースの背後に Hetzner プロバイダーを追加します。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化向けの CDP アクセス
- レスキュー向けの VNC または noVNC
- Node 22 と pnpm
- OpenClaw チェックアウトと依存関係キャッシュ
- Playwright を使用する場合の Playwright Chromium ブラウザーキャッシュ
- 1 つの OpenClaw Gateway、1 つのブラウザー、1 回のモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセス

VM は、想定された認証情報ストアまたはブラウザープロファイルストア以外に、長期間有効な生シークレットを保持すべきではありません。

## シークレット

シークレットは、リモート実行では GitHub organization または repository secrets に置き、ローカル実行ではローカルのオペレーター管理シークレットファイルに置きます。

推奨シークレット名:

- `OPENCLAW_QA_DISCORD_MANTIS_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_NOTIFY_CHANNEL_ID`
- 公開 GitHub アーティファクトアップロード向けの `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1`
- `OPENCLAW_QA_CONVEX_SITE_URL`
- `OPENCLAW_QA_CONVEX_SECRET_CI`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR`
- `OPENCLAW_QA_MANTIS_CRABBOX_COORDINATOR_TOKEN`

長期的には、Convex 認証情報プールをライブトランスポート認証情報の通常のソースとして維持する必要があります。GitHub secrets はブローカーとフォールバックレーンをブートストラップします。
Discord ステータスリアクションワークフローは、Mantis Crabbox シークレットを、Crabbox CLI が期待する `CRABBOX_COORDINATOR` および `CRABBOX_COORDINATOR_TOKEN` 環境変数に対応付けます。プレーンな `CRABBOX_*` GitHub secret 名は、互換性フォールバックとして引き続き受け入れられます。

Mantis ランナーは、次を絶対に出力してはいけません。

- Discord ボットトークン
- プロバイダー API キー
- ブラウザークッキー
- 認証プロファイルの内容
- VNC パスワード
- 生の認証情報ペイロード

公開アーティファクトアップロードでは、ボット、ギルド、チャンネル、メッセージ id などの Discord ターゲットメタデータも秘匿する必要があります。GitHub スモークワークフローは、この理由で `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

トークンを誤って issue、PR、チャット、またはログに貼り付けた場合は、新しいシークレットが保存された後にローテーションしてください。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期間有効な Actions アーティファクトとしてアップロードする必要があります。ワークフローがバグレポートまたは修正 PR 向けに実行される場合は、秘匿済みの PNG スクリーンショットも `qa-artifacts` ブランチに公開し、そのバグまたは修正 PR にインラインの前後比較スクリーンショット付きコメントを upsert する必要があります。主要な証拠を汎用 QA 自動化 PR のみに投稿しないでください。生ログ、観測メッセージ、その他の大きな証拠は Actions アーティファクトに残します。

本番ワークフローは、`github-actions[bot]` ではなく Mantis GitHub App でそれらのコメントを投稿する必要があります。app id と秘密鍵は、`MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions secrets として保存します。ワークフローは非表示マーカーを upsert キーとして使用し、トークンが編集できる場合はそのコメントを更新し、古いボット所有のマーカーを編集できない場合は新しい Mantis 所有コメントを作成します。

PR コメントは短く、視覚的であるべきです。

```md
Mantis Discord ステータスリアクション QA

サマリー: Mantis は、報告された Discord ステータスリアクションのバグを、既知の不良 baseline と candidate fix に対して再実行しました。baseline ではバグが再現し、candidate では期待される queued -> thinking -> done シーケンスが表示されました。

- シナリオ: `discord-status-reactions-tool-only`
- 実行: <workflow run link>
- アーティファクト: <artifact link>
- Baseline: `<status>` at `<sha>`
- Candidate: `<status>` at `<sha>`

| Baseline            | Candidate           |
| ------------------- | ------------------- |
| <inline screenshot> | <inline screenshot> |
```

ハーネスが失敗したために実行が失敗した場合、コメントでは candidate が失敗したと示唆するのではなく、そのことを明記する必要があります。

## 非公開デプロイメモ

非公開デプロイには、すでに Mantis Discord アプリケーションがある場合があります。適切なボット権限を持ち、安全にローテーションできる場合は、別のアプリを作成するのではなく、そのアプリケーションを再利用してください。

初期のオペレーター通知チャンネルは、シークレットまたはデプロイ設定で設定します。最初は既存のメンテナーまたは運用チャンネルを指し、専用の Mantis チャンネルができたらそこへ移行できます。

このドキュメントには、ギルド id、チャンネル id、ボットトークン、ブラウザークッキー、VNC パスワードを記載しないでください。GitHub secrets、認証情報ブローカー、またはオペレーターのローカルシークレットストアに保存してください。

## シナリオの追加

Mantis シナリオでは、次を宣言する必要があります。

- id とタイトル
- トランスポート
- 必要な認証情報
- baseline ref ポリシー
- candidate ref ポリシー
- OpenClaw 設定パッチ
- セットアップ手順
- 刺激
- 期待される baseline オラクル
- 期待される candidate オラクル
- 視覚的キャプチャターゲット
- タイムアウト予算
- クリーンアップ手順

シナリオは、小さく型付けされたオラクルを優先するべきです。

- リアクションバグ向けの Discord リアクション状態
- スレッド化バグ向けの Discord メッセージ参照
- Slack バグ向けの Slack thread ts とリアクション API 状態
- メールバグ向けのメール message id とヘッダー
- UI が唯一の信頼できる観測対象である場合のブラウザースクリーンショット

ビジョンチェックは追加的なものにするべきです。プラットフォーム API でバグを証明できる場合は、その API を合否オラクルとして使用し、スクリーンショットは人間の確信のために残してください。

## プロバイダー拡張

Discord の後、同じランナーで次を追加できます。

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- Email: コネクターだけでは不十分な場合の `gog` を使った Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションゲート、コマンド、利用可能な場合のリアクション。
- Matrix: 暗号化ルーム、スレッドまたは返信関係、再起動後の復帰。

各トランスポートには、安価なスモークシナリオを 1 つと、1 つ以上のバグクラスシナリオを用意する必要があります。高コストな視覚シナリオはオプトインのままにしてください。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どの Discord ボットを driver にし、どれを SUT にするべきか?
- オブザーバーブラウザーログインでは、人間の Discord アカウント、テストアカウント、または最初のフェーズではボットが読める REST 証拠のみのどれを使うべきか?
- GitHub は PR 向けの Mantis アーティファクトをどのくらい保持するべきか?
- ClawSweeper は、メンテナーコマンドを待つのではなく、いつ Mantis を自動的に推奨するべきか?
- 公開 PR 向けにアップロードする前に、スクリーンショットを秘匿またはクロップするべきか?
