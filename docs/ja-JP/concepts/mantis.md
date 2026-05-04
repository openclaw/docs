---
read_when:
    - OpenClaw のバグ向けライブビジュアル QA の構築または実行
    - プルリクエストの変更前後の検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオを追加する
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠をキャプチャし、成果物を PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-04T02:23:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a86ab4bc876d1c53ada1c30580034165f028194a072f559eb54a898a369211d
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、可視の証拠を必要とするバグのための OpenClaw エンドツーエンド検証システムです。既知の不良 ref に対してシナリオを実行して証拠を取得し、同じシナリオを候補 ref に対して実行して、その比較を PR やローカルコマンドからメンテナーが確認できるアーティファクトとして公開します。

Mantis は Discord から始めます。Discord は、実際のボット認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、そしてトランスポートが表示した内容を人間が視覚的に確認できるブラウザー UI という、高価値な最初のレーンを提供するためです。

## 目標

- GitHub issue または PR のバグを、ユーザーが見るものと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref で **before** アーティファクトを取得する。
- 修正を適用した後に、候補 ref で **after** アーティファクトを取得する。
- 可能な場合は、Discord REST のリアクション読み取りやチャンネル transcript チェックなど、決定的な oracle を使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで、GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まったときに VNC レスキューできるだけのマシン状態を保持する。
- 実行がブロックされた、手動 VNC 支援が必要になった、または完了したときに、オペレーターの Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis はユニットテストの代替ではありません。通常、Mantis の実行は、修正が理解された後でより小さな回帰テストになるべきです。
- Mantis は通常の高速 CI ゲートではありません。より遅く、ライブ認証情報を使用し、ライブ環境が重要なバグに限定されます。
- Mantis は通常運用で人間を必要とするべきではありません。手動 VNC はレスキューパスであり、正常系ではありません。
- Mantis はアーティファクト、ログ、スクリーンショット、Markdown レポート、PR コメントに生のシークレットを保存しません。

## 所有範囲

Mantis は OpenClaw QA スタック内にあります。

- OpenClaw は、`pnpm openclaw qa mantis` 配下のシナリオランタイム、トランスポートアダプター、証拠スキーマ、ローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部品、ブラウザー取得ヘルパー、アーティファクトライターを所有します。
- Crabbox は、リモート VM が必要な場合のウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリーポイントとアーティファクト保持を所有します。
- ClawSweeper は、GitHub コメントのルーティングを所有します。つまり、メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿です。
- OpenClaw エージェントは、シナリオにエージェント的なセットアップ、デバッグ、または詰まり状態の報告が必要な場合に、Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保持されます。

## コマンド形状

最初のローカルコマンドは、Discord ボット、ギルド、チャンネル、メッセージ送信、リアクション送信、アーティファクトパスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before / after ランナーは、この形状を受け取ります。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは出力ディレクトリ配下に分離されたベースラインと候補の worktree を作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とは、ベースラインのステータスが `fail` で候補のステータスが `pass` であることを意味します。

最初の VM/ブラウザープリミティブはデスクトップ smoke です。

```bash
pnpm openclaw qa mantis desktop-browser-smoke \
  --output-dir .artifacts/qa-e2e/mantis/desktop-browser
```

これは Crabbox デスクトップマシンをリースまたは再利用し、VNC セッション内で可視ブラウザーを起動し、デスクトップをキャプチャし、アーティファクトをローカル出力ディレクトリへ取り戻し、再接続コマンドをレポートに書き込みます。このコマンドは、Mantis レーンで動作するデスクトップ/VNC カバレッジを持つ最初のプロバイダーであるため、デフォルトで Hetzner プロバイダーを使用します。別の Crabbox fleet に対して実行する場合は、`--provider`、`--crabbox-bin`、または `OPENCLAW_MANTIS_CRABBOX_PROVIDER` で上書きします。

便利なデスクトップ smoke フラグ:

- `--lease-id <cbx_...>` または `OPENCLAW_MANTIS_CRABBOX_LEASE_ID` は、ウォーム済みデスクトップを再利用します。
- `--browser-url <url>` は、可視ブラウザーで開くページを変更します。
- `--html-file <path>` は、repo ローカルの HTML アーティファクトを可視ブラウザーでレンダリングします。Mantis はこれを使って、生成された Discord ステータスリアクションタイムラインを実際の Crabbox デスクトップ経由でキャプチャします。
- `--keep-lease` または `OPENCLAW_MANTIS_KEEP_VM=1` は、新規作成されて成功したリースを VNC 検査のために開いたままにします。失敗した実行では、オペレーターが再接続できるように、リースが作成されていた場合はデフォルトで保持します。
- `--class`、`--idle-timeout`、`--ttl` は、マシンサイズとリース有効期間を調整します。

GitHub smoke ワークフローは `Mantis Discord Smoke` です。最初の実シナリオ用の before / after GitHub ワークフローは `Mantis Discord Status Reactions` です。次を受け取ります。

- `baseline_ref`: queued-only の挙動を再現することが期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すことが期待される ref。

これはワークフローハーネス ref をチェックアウトし、ベースラインと候補の worktree を別々にビルドし、各 worktree に対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions アーティファクトとしてアップロードします。また、各レーンのタイムライン HTML を Crabbox デスクトップブラウザーでレンダリングし、それらの VNC スクリーンショットを決定的なタイムライン PNG と並べて PR コメントに公開します。このワークフローは、次の Crabbox バイナリリリースが切られる前に現在のデスクトップ/ブラウザーリースフラグを使用できるよう、`openclaw/crabbox` main から Crabbox CLI をビルドします。

ステータスリアクション実行は、PR コメントから直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭くしています。pull request コメント上で、write、maintain、または admin アクセスを持つユーザーからのものだけを実行し、Discord ステータスリアクションのリクエストだけを認識します。デフォルトでは、既知の不良ベースライン ref と現在の PR head SHA を候補として使用します。メンテナーはどちらの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的で、シナリオに焦点を当てています。2 番目は後で、ラベル、変更ファイル、ClawSweeper レビュー所見から、PR または issue を推奨 Mantis シナリオへマッピングできます。

## 実行ライフサイクル

1. 認証情報を取得する。
2. VM を割り当てる、または再利用する。
3. シナリオに UI 証拠が必要な場合、デスクトップ/ブラウザープロファイルを準備する。
4. ベースライン ref 用のクリーンな checkout を準備する。
5. 依存関係をインストールし、シナリオが必要とするものだけをビルドする。
6. 分離された状態ディレクトリで子 OpenClaw Gateway を起動する。
7. ライブトランスポート、プロバイダー、モデル、ブラウザープロファイルを設定する。
8. シナリオを実行し、ベースライン証拠を取得する。
9. Gateway を停止し、ログを保持する。
10. 同じ VM 内で候補 ref を準備する。
11. 同じシナリオを実行し、候補証拠を取得する。
12. oracle 結果と視覚的証拠を比較する。
13. Markdown、JSON、ログ、スクリーンショット、任意の trace アーティファクトを書き込む。
14. GitHub Actions アーティファクトをアップロードする。
15. 簡潔な PR または Discord ステータスメッセージを投稿する。

シナリオは 2 つの異なる方法で失敗できるべきです。

- **バグ再現**: ベースラインが期待された形で失敗した。
- **ハーネス失敗**: バグ oracle が意味を持つ前に、環境セットアップ、認証情報、Discord API、ブラウザー、またはプロバイダーが失敗した。

最終レポートでは、メンテナーが不安定な環境をプロダクト挙動と混同しないよう、これらのケースを分離する必要があります。

## Discord MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` であるギルドチャンネル内の Discord ステータスリアクションを対象にするべきです。

これが Mantis の良い種である理由:

- トリガーメッセージ上のリアクションとして Discord で可視です。
- Discord メッセージリアクション状態を通じて、強力な REST oracle があります。
- 実際の OpenClaw Gateway、Discord ボット認証、メッセージ dispatch、ソース返信配信モード、ステータスリアクション状態、モデル turn ライフサイクルを実行します。
- 最初の実装を正直に保てるだけ十分に狭いです。

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

ベースライン証拠では、queued の確認リアクションは表示されるが、tool-only モードでライフサイクル遷移がないことを示すべきです。候補証拠では、`messages.statusReactions.enabled` が明示的に true の場合にライフサイクルステータスリアクションが実行されることを示すべきです。

実行可能な最初のスライスは、opt-in の Discord live QA シナリオです。

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
"message_tool"`、`ackReaction: "👀"`、明示的なステータスリアクションで設定します。oracle は実際の Discord トリガーメッセージをポーリングし、観測シーケンス `👀 -> 🤔 -> 👍` を期待します。アーティファクトには `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html`、`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 部品

Mantis は、ゼロから始めるのではなく、既存の private QA スタック上に構築するべきです。

- `pnpm openclaw qa discord` は、driver と SUT ボットを使ったライブ Discord レーンをすでに実行しています。
- ライブトランスポートランナーは、`.artifacts/qa-e2e/` 配下にレポートと観測メッセージアーティファクトをすでに書き込みます。
- Convex 認証情報リースは、共有ライブトランスポート認証情報への排他的アクセスをすでに提供しています。
- ブラウザー制御サービスは、スクリーンショット、スナップショット、headless 管理プロファイル、リモート CDP プロファイルをすでにサポートしています。
- QA Lab には、トランスポート形状のテスト用のデバッガー UI と bus がすでにあります。

最初の Mantis 実装は、これらの部品に薄い before/after ランナーと 1 つの視覚的証拠レイヤーを足したものにできます。

## 証拠モデル

各実行は、安定したアーティファクトディレクトリを書き込みます。

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

`mantis-summary.json` は、機械可読な信頼できる情報源であるべきです。Markdown レポートは PR コメントと人間によるレビュー用です。

summary には次を含める必要があります。

- テストされた ref と SHA
- トランスポートとシナリオ id
- マシンプロバイダーとマシン id またはリース id
- シークレット値を含まない認証情報ソース
- ベースライン結果
- 候補結果
- バグがベースラインで再現されたかどうか
- 候補がそれを修正したかどうか
- アーティファクトパス
- サニタイズ済みのセットアップまたはクリーンアップ問題

スクリーンショットは証拠であり、シークレットではありません。それでも redaction の規律は必要です。private チャンネル名、ユーザー名、またはメッセージ内容が表示される可能性があります。public PR では、redaction のストーリーがより強くなるまで、インライン画像より GitHub Actions アーティファクトリンクを優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **Headless automation**: CI のデフォルトです。Chrome は CDP 有効で実行され、Playwright または OpenClaw ブラウザー制御がスクリーンショットを取得します。
- **VNC rescue**: ログイン、MFA、Discord anti-automation、または視覚的デバッグで人間が必要な場合に、同じ VM 上で有効にされます。

Discord オブザーバーのブラウザープロファイルは、実行のたびにログインしなくて済む程度に永続的であるべきですが、個人用ブラウザー状態からは分離されている必要があります。プロファイルは開発者のラップトップではなく、Mantis マシンプールに属します。

Mantis が停止状態になった場合、次を含む Discord ステータスメッセージを投稿します。

- 実行 ID
- シナリオ ID
- マシンプロバイダー
- アーティファクトディレクトリ
- 利用可能な場合は VNC または noVNC の接続手順
- 短いブロッカー説明

最初のプライベートデプロイでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、後で専用の Mantis チャンネルへ移行できます。

## マシン

Mantis は最初のリモート実装では Crabbox 経由の AWS を優先するべきです。Crabbox はウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、クリーンアップを提供します。AWS のキャパシティが遅すぎるか利用できない場合は、同じマシンインターフェイスの背後に Hetzner プロバイダーを追加します。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化用の CDP アクセス
- 復旧用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw のチェックアウトと依存関係キャッシュ
- Playwright を使用する場合の Playwright Chromium ブラウザーキャッシュ
- 1つの OpenClaw Gateway、1つのブラウザー、1つのモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセス

VM は、想定される認証情報ストアまたはブラウザープロファイルストア以外に、長期間有効な生シークレットを保持してはいけません。

## シークレット

リモート実行のシークレットは GitHub organization またはリポジトリシークレットに置き、ローカル実行のシークレットはローカルのオペレーター管理シークレットファイルに置きます。

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

長期的には、Convex 認証情報プールをライブトランスポート認証情報の通常のソースとして維持するべきです。GitHub シークレットは、ブローカーとフォールバックレーンをブートストラップします。Discord ステータスリアクションワークフローは、Mantis Crabbox シークレットを Crabbox CLI が期待する `CRABBOX_COORDINATOR` および `CRABBOX_COORDINATOR_TOKEN` 環境変数へ対応付けます。互換性フォールバックとして、プレーンな `CRABBOX_*` GitHub シークレット名も引き続き受け付けられます。

Mantis ランナーは次を絶対に出力してはいけません。

- Discord ボットトークン
- プロバイダー API キー
- ブラウザークッキー
- 認証プロファイルの内容
- VNC パスワード
- 生の認証情報ペイロード

公開アーティファクトアップロードでは、ボット、ギルド、チャンネル、メッセージ ID などの Discord ターゲットメタデータも編集するべきです。このため、GitHub スモークワークフローは `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にします。

トークンが誤って issue、PR、チャット、ログに貼り付けられた場合は、新しいシークレットを保存した後でローテーションします。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期間有効な Actions アーティファクトとしてアップロードするべきです。バグレポートまたは修正 PR に対してワークフローを実行する場合は、編集済み PNG スクリーンショットも `qa-artifacts` ブランチへ公開し、そのバグまたは修正 PR にインラインの before/after スクリーンショット付きコメントを upsert するべきです。主要な証拠を汎用 QA 自動化 PR だけに投稿してはいけません。生ログ、観測されたメッセージ、その他の大きな証拠は Actions アーティファクトに残します。

本番ワークフローは、`github-actions[bot]` ではなく Mantis GitHub App でそれらのコメントを投稿するべきです。app ID と秘密鍵は `MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` GitHub Actions シークレットとして保存します。ワークフローは非表示マーカーを upsert キーとして使用し、トークンで編集できる場合はそのコメントを更新し、古いボット所有のマーカーを編集できない場合は新しい Mantis 所有コメントを作成します。

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

ハーネスの失敗が原因で実行が失敗した場合、コメントは候補が失敗したと示唆するのではなく、そのことを明記する必要があります。

## プライベートデプロイメモ

プライベートデプロイには、すでに Mantis Discord アプリケーションがある場合があります。適切なボット権限があり、安全にローテーションできる場合は、別のアプリを作成するのではなく、そのアプリケーションを再利用します。

最初のオペレーター通知チャンネルは、シークレットまたはデプロイ設定で設定します。最初は既存のメンテナーまたは運用チャンネルを指し、専用の Mantis チャンネルが存在するようになったらそこへ移行できます。

ギルド ID、チャンネル ID、ボットトークン、ブラウザークッキー、VNC パスワードをこのドキュメントに記載してはいけません。それらは GitHub シークレット、認証情報ブローカー、またはオペレーターのローカルシークレットストアに保存します。

## シナリオの追加

Mantis シナリオでは次を宣言するべきです。

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

- リアクションバグ用の Discord リアクション状態
- スレッドバグ用の Discord メッセージ参照
- Slack バグ用の Slack スレッド ts とリアクション API 状態
- メールバグ用のメールメッセージ ID とヘッダー
- UI が唯一の信頼できる観測対象である場合のブラウザースクリーンショット

ビジョンチェックは追加的であるべきです。プラットフォーム API でバグを証明できる場合は、その API を合否オラクルとして使用し、スクリーンショットは人間の確信のために保持します。

## プロバイダー拡張

Discord の後、同じランナーで次を追加できます。

- Slack: リアクション、スレッド、アプリメンション、モーダル、ファイルアップロード。
- メール: コネクターだけでは不十分な場合の `gog` を使った Gmail 認証とメッセージスレッド。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: グループメンションゲーティング、コマンド、利用可能な場合のリアクション。
- Matrix: 暗号化ルーム、スレッドまたは返信関係、再起動後の再開。

各トランスポートには、1つの低コストなスモークシナリオと、1つ以上のバグクラスシナリオを用意するべきです。高コストな視覚シナリオはオプトインのままにするべきです。

## 未解決の質問

- 既存の Mantis ボットを再利用する場合、どの Discord ボットをドライバーにし、どれを SUT にするべきか?
- オブザーバーブラウザーのログインは、最初のフェーズで人間の Discord アカウント、テストアカウント、またはボットが読める REST 証拠のみのどれを使用するべきか?
- GitHub は PR 用の Mantis アーティファクトをどのくらい保持するべきか?
- ClawSweeper は、メンテナーコマンドを待つ代わりに、いつ Mantis を自動的に推奨するべきか?
- 公開 PR 用に、アップロード前のスクリーンショットを編集またはクロップするべきか?
