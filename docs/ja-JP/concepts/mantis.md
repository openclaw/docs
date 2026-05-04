---
read_when:
    - OpenClawのバグ向けライブビジュアルQAの構築または実行
    - プルリクエストに事前・事後の検証を追加する
    - Discord、Slack、WhatsApp、その他のライブトランスポートシナリオの追加
    - スクリーンショット、ブラウザー自動化、または VNC アクセスを必要とする QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠を取得し、アーティファクトを PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-04T04:58:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d3f3fa3db111b1b5c85f8efeccd749fbd5885cee6b7843ca4c8d049acfd9164
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、目に見える証拠が必要なバグのための OpenClaw エンドツーエンド検証システムです。既知の不良 ref に対してシナリオを実行し、証拠を取得し、同じシナリオを候補 ref に対して実行し、その比較を PR またはローカルコマンドからメンテナーが確認できるアーティファクトとして公開します。

Mantis は Discord から始まります。Discord は価値の高い最初のレーンを提供するためです。実際の bot 認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、そして人間がトランスポートで表示された内容を視覚的に確認できるブラウザー UI です。

## 目標

- GitHub issue または PR のバグを、ユーザーが見るのと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref 上で **before** アーティファクトを取得する。
- 修正を適用した後に、候補 ref 上で **after** アーティファクトを取得する。
- 可能な限り、Discord REST リアクション読み取りやチャンネルトランスクリプト確認など、決定的なオラクルを使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで、GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まったときに VNC で復旧できるだけのマシン状態を保持する。
- 実行がブロックされた場合、手動 VNC 支援が必要な場合、または完了した場合に、オペレーターの Discord チャンネルへ簡潔なステータスを投稿する。

## 対象外

- Mantis はユニットテストの代替ではありません。Mantis 実行は通常、修正内容が理解された後で、より小さな回帰テストになるべきです。
- Mantis は通常の高速 CI ゲートではありません。より遅く、ライブ認証情報を使用し、ライブ環境が重要なバグのために予約されています。
- Mantis は通常運用で人間を必要とするべきではありません。手動 VNC は復旧経路であり、ハッピーパスではありません。
- Mantis は生のシークレットをアーティファクト、ログ、スクリーンショット、Markdown レポート、または PR コメントに保存しません。

## オーナーシップ

Mantis は OpenClaw QA スタックに属します。

- OpenClaw は、`pnpm openclaw qa mantis` 配下のシナリオランタイム、トランスポートアダプター、証拠スキーマ、ローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部品、ブラウザー取得ヘルパー、アーティファクトライターを所有します。
- Crabbox は、リモート VM が必要な場合に、ウォーム済みの Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有します。
- ClawSweeper は GitHub コメントルーティングを所有します。メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿です。
- OpenClaw エージェントは、シナリオにエージェント的なセットアップ、デバッグ、または詰まり状態の報告が必要な場合に、Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保たれます。

## コマンド形式

最初のローカルコマンドは、Discord bot、ギルド、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before と after ランナーはこの形式を受け付けます。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは出力ディレクトリ配下に分離されたベースラインと候補の worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とはベースラインステータスが `fail`、候補ステータスが `pass` であることを意味します。

最初の VM/ブラウザープリミティブは desktop smoke です。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で表示可能なブラウザーを起動し、デスクトップを取得し、アーティファクトをローカル出力ディレクトリに取り戻し、再接続コマンドをレポートに書き込みます。このコマンドは、Mantis レーンで動作する desktop/VNC カバレッジを持つ最初のプロバイダーであるため、デフォルトで Hetzner プロバイダーを使用します。別の Crabbox フリートに対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きしてください。

有用な desktop smoke フラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、表示可能なブラウザーで開くページを変更します。
- `--html-file <path>` は、repo ローカルの HTML アーティファクトを表示可能なブラウザーでレンダリングします。Mantis はこれを使用して、生成された Discord ステータスリアクションタイムラインを実際の Crabbox デスクトップ経由で取得します。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新規作成された成功リースを VNC 検査用に開いたままにします。失敗した実行では、作成されたリースがある場合、オペレーターが再接続できるようにデフォルトでリースを保持します。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース存続時間を調整します。

最初の完全な desktop トランスポートプリミティブは Slack desktop smoke です。

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --output-dir .artifacts/qa-e2e/mantis/slack-desktop \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

これは Crabbox デスクトップマシンをリースまたは再利用し、現在の checkout を VM に同期し、その VM 内で `pnpm openclaw qa slack` を実行し、VNC ブラウザーで Slack Web を開き、表示可能なデスクトップを取得し、Slack QA アーティファクトと VNC スクリーンショットの両方をローカル出力ディレクトリにコピーします。これは、SUT OpenClaw Gateway とブラウザーの両方が同じ Linux デスクトップ VM 内に存在する、最初の Mantis 形式です。

`--gateway-setup` を指定すると、コマンドは `$HOME/.openclaw-mantis/slack-openclaw` に永続的な使い捨て OpenClaw home を準備し、選択したチャンネル用に Slack Socket Mode 設定をパッチし、ポート `38973` で `openclaw gateway run` を起動し、Chrome を VNC セッション内で実行し続けます。これは「Slack と claw が動作する Linux デスクトップを残す」モードです。`--gateway-setup` が省略された場合は、bot-to-bot Slack QA レーンがデフォルトのままです。

`--credential-source env` に必要な入力:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`
- リモートモデルレーン用の `OPENCLAW_LIVE_OPENAI_KEY`。ローカルで `OPENAI_API_KEY` のみが設定されている場合、Mantis は Crabbox を呼び出す前にそれを `OPENCLAW_LIVE_OPENAI_KEY` にマッピングし、Crabbox の `OPENCLAW_*` env 転送で VM 内に運べるようにします。

有用な Slack desktop フラグ:

- `--lease-id <cbx_...>` は、オペレーターがすでに VNC 経由で Slack Web にログインしたマシンに対して再実行します。
- `--gateway-setup` は、bot-to-bot QA レーンのみを実行する代わりに、VM 内で永続的な OpenClaw Slack Gateway を起動します。
- `--slack-url <url>` は、特定の Slack Web URL を開きます。指定しない場合、SUT bot token が利用可能であれば、Mantis は Slack `auth.test` から `https://app.slack.com/client/<team>/<channel>` を導出します。
- `--slack-channel-id <id>` は、Gateway セットアップで使用される Slack チャンネル許可リストを制御します。
- `OPENCLAW_MANTIS_SLACK_BROWSER_PROFILE_DIR` は、VM 内の永続 Chrome プロファイルを制御します。デフォルトは `$HOME/.config/openclaw-mantis/slack-chrome-profile` なので、手動の Slack Web ログインは同じリース上の再実行でも保持されます。
- `--credential-source convex --credential-role ci` は、直接の Slack env token の代わりに共有認証情報プールを使用します。
- `--provider-mode`、`--model`、`--alt-model`、`--fast` は Slack live レーンにそのまま渡されます。

GitHub smoke ワークフローは `Mantis Discord Smoke` です。最初の実シナリオ用の before and after GitHub ワークフローは `Mantis Discord Status Reactions` です。これは以下を受け付けます。

- `baseline_ref`: queued-only 挙動を再現すると期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すと期待される ref。

これはワークフローハーネス ref を checkout し、別々のベースラインと候補 worktree をビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、各レーンのタイムライン HTML を Crabbox デスクトップブラウザーでレンダリングし、それらの VNC スクリーンショットを、決定的なタイムライン PNG と並べて PR コメントに公開します。このワークフローは、次の Crabbox バイナリリリースが cut される前に現在の desktop/browser lease フラグを使用できるよう、`openclaw/crabbox` main から Crabbox CLI をビルドします。

PR コメントから status-reactions 実行を直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭くなっています。pull request コメント上で、write、maintain、または admin 権限を持つユーザーからの場合にのみ実行され、Discord status-reaction リクエストだけを認識します。デフォルトでは、既知の不良ベースライン ref と現在の PR head SHA を候補として使用します。メンテナーはどちらの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的でシナリオに焦点を当てています。2 番目は、後で labels、変更ファイル、ClawSweeper レビュー所見から、PR または issue を推奨 Mantis シナリオにマッピングできます。

## 実行ライフサイクル

1. 認証情報を取得する。
2. VM を割り当てるか再利用する。
3. シナリオに UI 証拠が必要な場合、デスクトップ/ブラウザープロファイルを準備する。
4. ベースライン ref 用のクリーンな checkout を準備する。
5. 依存関係をインストールし、シナリオに必要なものだけをビルドする。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を起動する。
7. ライブトランスポート、プロバイダー、モデル、ブラウザープロファイルを設定する。
8. シナリオを実行し、ベースライン証拠を取得する。
9. Gateway を停止し、ログを保持する。
10. 同じ VM 内で候補 ref を準備する。
11. 同じシナリオを実行し、候補証拠を取得する。
12. オラクル結果と視覚的証拠を比較する。
13. Markdown、JSON、ログ、スクリーンショット、任意のトレースアーティファクトを書き込む。
14. GitHub Actions アーティファクトをアップロードする。
15. 簡潔な PR または Discord ステータスメッセージを投稿する。

シナリオは、2 つの異なる方法で失敗できるべきです。

- **バグ再現**: ベースラインが期待された方法で失敗した。
- **ハーネス失敗**: バグオラクルが意味を持つ前に、環境セットアップ、認証情報、Discord API、ブラウザー、またはプロバイダーが失敗した。

最終レポートは、メンテナーが不安定な環境と製品挙動を混同しないよう、これらのケースを分離しなければなりません。

## Discord MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` であるギルドチャンネル内の Discord status reactions を対象にするべきです。

これが Mantis のよい種である理由:

- トリガーメッセージ上のリアクションとして Discord で見える。
- Discord メッセージリアクション状態を通じた強い REST オラクルを持つ。
- 実際の OpenClaw Gateway、Discord bot 認証、メッセージ dispatch、ソース返信配信モード、ステータスリアクション状態、モデルターンライフサイクルを実行する。
- 最初の実装を正直に保つのに十分狭い。

期待されるシナリオ形式:

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

ベースライン証拠は queued acknowledgement reaction は示すものの、tool-only モードではライフサイクル遷移がないことを示すべきです。候補証拠は、`messages.statusReactions.enabled` が明示的に true のときにライフサイクル status reactions が実行されることを示すべきです。

実行可能な最初のスライスは、opt-in Discord live QA シナリオです。

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast \
  --output-dir .artifacts/qa-e2e/mantis/discord-status-reactions-candidate
```

SUT は、常時オンのギルド処理、`visibleReplies:
"message_tool"`、`ackReaction: "👀"`、および明示的なステータスリアクションで構成されます。オラクルは実際の Discord トリガーメッセージをポーリングし、観測されたシーケンス `👀 -> 🤔 -> 👍` を期待します。アーティファクトには `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html`、および `discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 部品

Mantis はゼロから始めるのではなく、既存の非公開 QA スタックを土台にするべきです。

- `pnpm openclaw qa discord` は、driver ボットと SUT ボットを使ったライブ Discord レーンをすでに実行します。
- ライブトランスポートランナーは、レポートと観測メッセージのアーティファクトを `.artifacts/qa-e2e/` 配下にすでに書き込みます。
- Convex 資格情報リースは、共有ライブトランスポート資格情報への排他的アクセスをすでに提供します。
- ブラウザー制御サービスは、スクリーンショット、スナップショット、ヘッドレス管理プロファイル、リモート CDP プロファイルをすでにサポートしています。
- QA Lab には、トランスポート形状のテスト用のデバッガー UI とバスがすでにあります。

最初の Mantis 実装は、これらの部品の上に置く薄い before/after ランナーと、1 つの視覚的証拠レイヤーにできます。

## 証拠モデル

各実行は安定したアーティファクトディレクトリを書き込みます。

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

`mantis-summary.json` は、機械可読な信頼できる唯一の情報源であるべきです。Markdown レポートは PR コメントと人間によるレビュー向けです。

サマリーには以下を含める必要があります。

- テストされた refs と SHA
- トランスポートとシナリオ ID
- マシンプロバイダーとマシン ID またはリース ID
- シークレット値を含まない資格情報ソース
- ベースライン結果
- 候補結果
- バグがベースラインで再現したかどうか
- 候補がそれを修正したかどうか
- アーティファクトパス
- サニタイズされたセットアップまたはクリーンアップの問題

スクリーンショットは証拠であり、シークレットではありません。それでも秘匿化の規律は必要です。非公開チャンネル名、ユーザー名、またはメッセージ内容が表示される場合があります。公開 PR では、秘匿化の方針がより強固になるまで、インライン画像よりも GitHub Actions アーティファクトリンクを優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルトです。Chrome は CDP を有効にして実行され、Playwright または OpenClaw ブラウザー制御がスクリーンショットをキャプチャします。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、または視覚的デバッグに人間が必要な場合、同じ VM 上で有効にします。

Discord オブザーバーブラウザープロファイルは、実行ごとにログインしなくてもよい程度には永続化されるべきですが、個人のブラウザー状態からは分離されるべきです。プロファイルは開発者のノート PC ではなく、Mantis マシンプールに属します。

Mantis が行き詰まった場合、次を含む Discord ステータスメッセージを投稿します。

- 実行 ID
- シナリオ ID
- マシンプロバイダー
- アーティファクトディレクトリ
- 利用可能な場合は VNC または noVNC の接続手順
- 短いブロッカー文

最初の非公開デプロイでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、後で専用の Mantis チャンネルへ移行できます。

## マシン

Mantis は、最初のリモート実装では Crabbox 経由の AWS を優先するべきです。Crabbox は、ウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、クリーンアップを提供します。AWS 容量が遅すぎる、または利用できない場合は、同じマシンインターフェイスの背後に Hetzner プロバイダーを追加してください。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化用の CDP アクセス
- レスキュー用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw チェックアウトと依存関係キャッシュ
- Playwright を使用する場合は Playwright Chromium ブラウザーキャッシュ
- 1 つの OpenClaw Gateway、1 つのブラウザー、1 つのモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、資格情報ブローカーへのアウトバウンドアクセス

VM は、期待される資格情報ストアまたはブラウザープロファイルストアの外に長期存続する生のシークレットを保持するべきではありません。

## シークレット

シークレットは、リモート実行では GitHub 組織またはリポジトリのシークレットに、ローカル実行ではローカルのオペレーター管理シークレットファイルに置きます。

推奨シークレット名:

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

長期的には、Convex 資格情報プールがライブトランスポート資格情報の通常のソースであり続けるべきです。GitHub シークレットは、ブローカーとフォールバックレーンをブートストラップします。Discord ステータスリアクションワークフローは、Mantis Crabbox シークレットを、Crabbox CLI が期待する `CRABBOX_COORDINATOR` および `CRABBOX_COORDINATOR_TOKEN` 環境変数にマップし直します。プレーンな `CRABBOX_*` GitHub シークレット名は、互換性フォールバックとして引き続き受け入れられます。

Mantis ランナーは、次を絶対に出力してはいけません。

- Discord ボットトークン
- プロバイダー API キー
- ブラウザー Cookie
- 認証プロファイル内容
- VNC パスワード
- 生の資格情報ペイロード

公開アーティファクトアップロードでは、ボット、ギルド、チャンネル、メッセージ ID などの Discord ターゲットメタデータも秘匿化するべきです。GitHub smoke ワークフローはこの理由で `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

トークンが誤って issue、PR、チャット、またはログに貼り付けられた場合は、新しいシークレットを保存した後にローテーションしてください。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期保持の Actions アーティファクトとしてアップロードするべきです。ワークフローがバグレポートまたは修正 PR のために実行される場合、秘匿化された PNG スクリーンショットも `qa-artifacts` ブランチに公開し、そのバグまたは修正 PR に before/after スクリーンショットをインラインで含むコメントを upsert するべきです。主要な証拠を汎用 QA 自動化 PR にだけ投稿しないでください。生ログ、観測メッセージ、その他の大きな証拠は Actions アーティファクトに残します。

本番ワークフローは、それらのコメントを `github-actions[bot]` ではなく Mantis GitHub App で投稿するべきです。アプリ ID と秘密鍵は `MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions シークレットとして保存します。ワークフローは非表示マーカーを upsert キーとして使用し、トークンが編集できる場合はそのコメントを更新し、古いボット所有マーカーを編集できない場合は新しい Mantis 所有コメントを作成します。

PR コメントは短く視覚的であるべきです。

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

ハーネスが失敗したために実行が失敗した場合、コメントは候補が失敗したと示唆するのではなく、その旨を述べる必要があります。

## 非公開デプロイの注意事項

非公開デプロイには、すでに Mantis Discord アプリケーションがある場合があります。適切なボット権限を持ち、安全にローテーションできる場合は、別のアプリを作成せずにそのアプリケーションを再利用してください。

初期のオペレーター通知チャンネルは、シークレットまたはデプロイ構成を通じて設定します。最初は既存のメンテナーまたは運用チャンネルを指し、専用の Mantis チャンネルが存在するようになったらそこへ移動できます。

ギルド ID、チャンネル ID、ボットトークン、ブラウザー Cookie、または VNC パスワードをこのドキュメントに入れないでください。GitHub シークレット、資格情報ブローカー、またはオペレーターのローカルシークレットストアに保存してください。

## シナリオの追加

Mantis シナリオは次を宣言するべきです。

- ID とタイトル
- トランスポート
- 必要な資格情報
- ベースライン ref ポリシー
- 候補 ref ポリシー
- OpenClaw 構成パッチ
- セットアップ手順
- 刺激
- 期待されるベースラインオラクル
- 期待される候補オラクル
- 視覚キャプチャターゲット
- タイムアウト予算
- クリーンアップ手順

シナリオは、小さく型付けされたオラクルを優先するべきです。

- リアクションバグ用の Discord リアクション状態
- スレッドバグ用の Discord メッセージ参照
- Slack バグ用の Slack スレッド ts とリアクション API 状態
- メールバグ用のメールメッセージ ID とヘッダー
- UI が唯一の信頼できる観測対象である場合のブラウザースクリーンショット

ビジョンチェックは追加的であるべきです。プラットフォーム API がバグを証明できる場合は、API を合否オラクルとして使用し、スクリーンショットは人間の確信のために保持してください。

## プロバイダー拡張

Discord の後、同じランナーで次を追加できます。

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- メール: コネクターでは不十分な場合の `gog` を使った Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションゲーティング、コマンド、利用可能な場合はリアクション。
- Matrix: 暗号化ルーム、スレッドまたは返信関係、再起動後の再開。

各トランスポートには、低コストな smoke シナリオを 1 つと、1 つ以上のバグクラスシナリオを用意するべきです。高コストな視覚シナリオは opt-in のままにするべきです。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どの Discord ボットを driver にし、どれを SUT にするべきか。
- オブザーバーブラウザーログインは、最初のフェーズで人間の Discord アカウント、テストアカウント、またはボットが読める REST 証拠のみのどれを使うべきか。
- GitHub は PR 用の Mantis アーティファクトをどれくらいの期間保持するべきか。
- ClawSweeper は、メンテナーコマンドを待つ代わりに、いつ Mantis を自動的に推奨するべきか。
- 公開 PR 用に、アップロード前にスクリーンショットを秘匿化またはクロップするべきか。
