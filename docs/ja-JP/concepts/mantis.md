---
read_when:
    - OpenClaw のバグに対するライブビジュアル QA の構築または実行
    - プルリクエストの事前検証と事後検証を追加する
    - Discord、Slack、WhatsApp、またはその他のライブトランスポートシナリオを追加する
    - スクリーンショット、ブラウザー自動化、または VNC アクセスが必要な QA 実行のデバッグ
summary: Mantis は、ライブトランスポート上で OpenClaw のバグを再現し、修正前後の証拠をキャプチャし、アーティファクトを PR に添付するための視覚的なエンドツーエンド検証システムです。
title: カマキリ
x-i18n:
    generated_at: "2026-05-03T21:30:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3463882b01a7941f6d758c509d6cd70e099aa8352053347fa9c37a80e5b256ce
    source_path: concepts/mantis.md
    workflow: 16
---

Mantis は、実際のランタイム、実際のトランスポート、目に見える証拠が必要なバグのための OpenClaw エンドツーエンド検証システムです。既知の不良 ref に対してシナリオを実行して証拠を取得し、同じシナリオを候補 ref に対して実行し、その比較を、メンテナーが PR またはローカルコマンドから確認できる成果物として公開します。

Mantis は Discord から開始します。Discord は、実際の bot 認証、実際のギルドチャンネル、リアクション、スレッド、ネイティブコマンド、人間がトランスポートに表示された内容を視覚的に確認できるブラウザー UI という、価値の高い最初のレーンを提供するためです。

## 目標

- GitHub issue または PR のバグを、ユーザーが見るものと同じトランスポート形状で再現する。
- 修正を適用する前に、ベースライン ref で **before** 成果物を取得する。
- 修正を適用した後に、候補 ref で **after** 成果物を取得する。
- 可能な場合は、Discord REST リアクション読み取りやチャンネルのトランスクリプト確認など、決定論的なオラクルを使用する。
- バグに可視 UI サーフェスがある場合はスクリーンショットを取得する。
- エージェント制御の CLI からローカルで、また GitHub からリモートで実行する。
- ログイン、ブラウザー自動化、またはプロバイダー認証が詰まったときの VNC レスキューのために十分なマシン状態を保持する。
- 実行がブロックされた場合、手動 VNC 支援が必要な場合、または完了した場合に、オペレーターの Discord チャンネルへ簡潔なステータスを投稿する。

## 非目標

- Mantis はユニットテストの代替ではありません。Mantis 実行は通常、修正が理解された後に、より小さなリグレッションテストになるべきです。
- Mantis は通常の高速 CI ゲートではありません。より遅く、ライブ認証情報を使用し、ライブ環境が重要なバグに限定されます。
- Mantis は通常動作で人間を必要とするべきではありません。手動 VNC はレスキューパスであり、正常系ではありません。
- Mantis は生のシークレットを成果物、ログ、スクリーンショット、Markdown レポート、PR コメントに保存しません。

## 所有範囲

Mantis は OpenClaw QA スタック内にあります。

- OpenClaw は、シナリオランタイム、トランスポートアダプター、証拠スキーマ、`pnpm openclaw qa mantis` 配下のローカル CLI を所有します。
- QA Lab は、ライブトランスポートハーネス部品、ブラウザー取得ヘルパー、成果物ライターを所有します。
- Crabbox は、リモート VM が必要な場合に、ウォーム済み Linux マシンを所有します。
- GitHub Actions は、リモートワークフローのエントリポイントと成果物保持を所有します。
- ClawSweeper は GitHub コメントルーティングを所有します。つまり、メンテナーコマンドの解析、ワークフローのディスパッチ、最終 PR コメントの投稿です。
- OpenClaw エージェントは、シナリオでエージェント的なセットアップ、デバッグ、または詰まった状態の報告が必要な場合に、Codex を通じて Mantis を駆動します。

この境界により、トランスポート知識は OpenClaw に、マシンスケジューリングは Crabbox に、メンテナーワークフローの接着部分は ClawSweeper に保たれます。

## コマンド形式

最初のローカルコマンドは、Discord bot、ギルド、チャンネル、メッセージ送信、リアクション送信、成果物パスを検証します。

```bash
pnpm openclaw qa mantis discord-smoke \
  --output-dir .artifacts/qa-e2e/mantis/discord-smoke
```

ローカルの before/after ランナーはこの形式を受け付けます。

```bash
pnpm openclaw qa mantis run \
  --transport discord \
  --scenario discord-status-reactions-tool-only \
  --baseline origin/main \
  --candidate HEAD \
  --output-dir .artifacts/qa-e2e/mantis/local-discord-status-reactions
```

ランナーは、出力ディレクトリ配下に分離されたベースラインおよび候補ワークツリーを作成し、依存関係をインストールし、各 ref をビルドし、`--allow-failures` 付きでシナリオを実行してから、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を書き込みます。最初の Discord シナリオでは、検証成功とは、ベースラインステータスが `fail` で候補ステータスが `pass` であることを意味します。

GitHub スモークワークフローは `Mantis Discord Smoke` です。最初の実シナリオの before/after GitHub ワークフローは `Mantis Discord Status Reactions` です。これは次を受け付けます。

- `baseline_ref`: キューのみの挙動を再現することが期待される ref。
- `candidate_ref`: `queued -> thinking -> done` を示すことが期待される ref。

ワークフローハーネス ref をチェックアウトし、別々のベースラインおよび候補ワークツリーをビルドし、各ワークツリーに対して `discord-status-reactions-tool-only` を実行し、`baseline/`、`candidate/`、`comparison.json`、`mantis-report.md` を Actions 成果物としてアップロードします。

ステータスリアクション実行は、PR コメントから直接トリガーすることもできます。

```text
@Mantis discord status reactions
```

コメントトリガーは意図的に狭くしています。pull request コメントのうち、write、maintain、または admin 権限を持つユーザーからのものだけで実行され、Discord ステータスリアクション要求だけを認識します。デフォルトでは、既知の不良ベースライン ref と現在の PR head SHA を候補として使用します。メンテナーはいずれの ref も上書きできます。

```text
@Mantis discord status reactions baseline=origin/main candidate=HEAD
```

ClawSweeper コマンド例:

```text
@clawsweeper mantis discord discord-status-reactions-tool-only
@clawsweeper verify e2e discord
```

最初のコマンドは明示的で、シナリオに焦点を当てています。2 つ目は将来的に、ラベル、変更ファイル、ClawSweeper レビュー所見から、PR または issue を推奨 Mantis シナリオへ対応付けられます。

## 実行ライフサイクル

1. 認証情報を取得する。
2. VM を割り当てる、または再利用する。
3. ベースライン ref 用のクリーンなチェックアウトを準備する。
4. 依存関係をインストールし、シナリオが必要とするものだけをビルドする。
5. 分離された状態ディレクトリで子 OpenClaw Gateway を開始する。
6. ライブトランスポート、プロバイダー、モデル、ブラウザープロファイルを設定する。
7. シナリオを実行し、ベースライン証拠を取得する。
8. Gateway を停止し、ログを保持する。
9. 同じ VM 内で候補 ref を準備する。
10. 同じシナリオを実行し、候補証拠を取得する。
11. オラクル結果と視覚的証拠を比較する。
12. Markdown、JSON、ログ、スクリーンショット、任意のトレース成果物を書き込む。
13. GitHub Actions 成果物をアップロードする。
14. 簡潔な PR または Discord ステータスメッセージを投稿する。

シナリオは、2 つの異なる方法で失敗できるべきです。

- **バグ再現**: ベースラインが期待された形で失敗した。
- **ハーネス失敗**: 環境セットアップ、認証情報、Discord API、ブラウザー、またはプロバイダーが、バグオラクルに意味が出る前に失敗した。

最終レポートは、メンテナーが不安定な環境と製品挙動を混同しないように、これらのケースを分離する必要があります。

## Discord MVP

最初のシナリオは、ソース返信配信モードが `message_tool_only` であるギルドチャンネル内の Discord ステータスリアクションを対象にするべきです。

これが良い Mantis の種になる理由:

- トリガーメッセージ上のリアクションとして Discord で見える。
- Discord メッセージリアクション状態を通じた強い REST オラクルがある。
- 実際の OpenClaw Gateway、Discord bot 認証、メッセージディスパッチ、ソース返信配信モード、ステータスリアクション状態、モデルターンライフサイクルを実行する。
- 最初の実装を正直に保てるだけ十分に狭い。

想定されるシナリオ形式:

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

ベースライン証拠は、キュー済みの確認リアクションは表示するが、ツールのみモードでライフサイクル遷移は表示しないべきです。候補証拠は、`messages.statusReactions.enabled` が明示的に true のときにライフサイクルステータスリアクションが実行されることを示すべきです。

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

これは SUT を、常時オンのギルド処理、`visibleReplies: "message_tool"`、`ackReaction: "👀"`、明示的なステータスリアクションで設定します。オラクルは実際の Discord トリガーメッセージをポーリングし、観測シーケンス `👀 -> 🤔 -> 👍` を期待します。成果物には `discord-qa-reaction-timelines.json`、`discord-status-reactions-tool-only-timeline.html`、`discord-status-reactions-tool-only-timeline.png` が含まれます。

## 既存の QA 要素

Mantis はゼロから始めるのではなく、既存のプライベート QA スタックの上に構築するべきです。

- `pnpm openclaw qa discord` は、すでにドライバー bot と SUT bot を含むライブ Discord レーンを実行します。
- ライブトランスポートランナーは、すでに `.artifacts/qa-e2e/` 配下にレポートと観測メッセージ成果物を書き込みます。
- Convex 認証情報リースは、共有ライブトランスポート認証情報への排他的アクセスをすでに提供しています。
- ブラウザー制御サービスは、すでにスクリーンショット、スナップショット、ヘッドレス管理プロファイル、リモート CDP プロファイルをサポートしています。
- QA Lab には、トランスポート形状のテスト用のデバッガー UI とバスがすでにあります。

最初の Mantis 実装は、これらの要素の上に置く薄い before/after ランナーと、1 つの視覚的証拠レイヤーにできます。

## 証拠モデル

すべての実行は、安定した成果物ディレクトリを書き込みます。

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

`mantis-summary.json` は、機械可読な信頼できる情報源であるべきです。Markdown レポートは PR コメントと人間のレビュー用です。

サマリーには次を含める必要があります。

- テストされた ref と SHA
- トランスポートとシナリオ ID
- マシンプロバイダーとマシン ID またはリース ID
- シークレット値を含まない認証情報ソース
- ベースライン結果
- 候補結果
- バグがベースラインで再現したかどうか
- 候補がそれを修正したかどうか
- 成果物パス
- サニタイズされたセットアップまたはクリーンアップの問題

スクリーンショットは証拠であり、シークレットではありません。それでも、リダクションの規律は必要です。プライベートチャンネル名、ユーザー名、またはメッセージ内容が表示される場合があります。公開 PR では、リダクション方針がより強固になるまで、インライン画像よりも GitHub Actions 成果物リンクを優先してください。

## ブラウザーと VNC

ブラウザーレーンには 2 つのモードがあります。

- **ヘッドレス自動化**: CI のデフォルト。Chrome は CDP 有効で実行され、Playwright または OpenClaw ブラウザー制御がスクリーンショットを取得します。
- **VNC レスキュー**: ログイン、MFA、Discord の自動化対策、または視覚的なデバッグで人間が必要な場合に、同じ VM 上で有効化されます。

Discord オブザーバーブラウザープロファイルは、毎回ログインしなくて済む程度に永続的であるべきですが、個人のブラウザー状態からは分離されるべきです。プロファイルは Mantis マシンプールに属し、開発者のラップトップには属しません。

Mantis が詰まったときは、次を含む Discord ステータスメッセージを投稿します。

- 実行 ID
- シナリオ ID
- マシンプロバイダー
- 成果物ディレクトリ
- 利用可能な場合は VNC または noVNC 接続手順
- 短いブロッカー文

最初のプライベートデプロイでは、これらのメッセージを既存のオペレーターチャンネルに投稿し、後で専用の Mantis チャンネルへ移行できます。

## マシン

Mantis は、最初のリモート実装では Crabbox 経由の AWS を優先するべきです。Crabbox は、ウォーム済みマシン、リース追跡、ハイドレーション、ログ、結果、クリーンアップを提供します。AWS 容量が遅すぎる、または利用できない場合は、同じマシンインターフェースの背後に Hetzner プロバイダーを追加します。

最小 VM 要件:

- デスクトップ対応の Chrome または Chromium がインストールされた Linux
- ブラウザー自動化のための CDP アクセス
- レスキュー用の VNC または noVNC
- Node 22 と pnpm
- OpenClaw チェックアウトと依存関係キャッシュ
- Playwright が使用される場合は Playwright Chromium ブラウザーキャッシュ
- 1 つの OpenClaw Gateway、1 つのブラウザー、1 回のモデル実行に十分な CPU とメモリ
- Discord、GitHub、モデルプロバイダー、認証情報ブローカーへのアウトバウンドアクセス

VM は、想定される認証情報ストアまたはブラウザープロファイルストア以外に、長期間有効な生のシークレットを保持するべきではありません。

## シークレット

シークレットは、リモート実行では GitHub organization または repository secrets に、ローカル実行ではローカルのオペレーター制御シークレットファイルに置きます。

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

長期的には、Convex 認証情報プールをライブのトランスポート認証情報の通常のソースとして維持する必要があります。GitHub secrets はブローカーとフォールバックレーンをブートストラップします。

Mantis ランナーは次を絶対に出力してはいけません。

- Discord bot トークン
- プロバイダー API キー
- ブラウザー Cookie
- 認証プロファイルの内容
- VNC パスワード
- 生の認証情報ペイロード

公開アーティファクトのアップロードでも、bot、guild、channel、message id などの Discord ターゲットメタデータを編集して秘匿する必要があります。GitHub smoke ワークフローはこの理由で `OPENCLAW_QA_REDACT_PUBLIC_METADATA=1` を有効にしています。

トークンを issue、PR、チャット、ログに誤って貼り付けた場合は、新しい secret を保存した後にローテーションしてください。

## GitHub アーティファクトと PR コメント

Mantis ワークフローは、完全な証拠バンドルを短期間保持される Actions アーティファクトとしてアップロードする必要があります。バグ報告または修正 PR のためにワークフローを実行する場合は、秘匿済みの PNG スクリーンショットを `qa-artifacts` ブランチにも公開し、そのバグまたは修正 PR に before/after スクリーンショットをインラインで含むコメントを upsert する必要があります。主な証拠を汎用の QA 自動化 PR だけに投稿しないでください。生ログ、観測されたメッセージ、その他の大きな証拠は Actions アーティファクトに残します。

本番ワークフローでは、それらのコメントを `github-actions[bot]` ではなく Mantis GitHub App で投稿する必要があります。app id と private key は `MANTIS_GITHUB_APP_ID` および `MANTIS_GITHUB_APP_PRIVATE_KEY` の GitHub Actions secrets として保存してください。ワークフローは hidden marker を upsert キーとして使用し、トークンで編集できる場合はそのコメントを更新し、古い bot 所有の marker を編集できない場合は Mantis 所有の新しいコメントを作成します。

PR コメントは短く視覚的にする必要があります。

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

ハーネスの失敗が原因で実行が失敗した場合、コメントでは candidate が失敗したと示唆するのではなく、その旨を記載する必要があります。

## プライベートデプロイのメモ

プライベートデプロイには、すでに Mantis Discord アプリケーションがある場合があります。適切な bot 権限があり、安全にローテーションできる場合は、別のアプリを作成するのではなくそのアプリケーションを再利用してください。

初期のオペレーター通知 channel は secrets またはデプロイ設定で指定します。最初は既存のメンテナーまたは運用 channel を指すようにし、専用の Mantis channel が存在するようになったらそこへ移動できます。

guild id、channel id、bot トークン、ブラウザー Cookie、VNC パスワードをこのドキュメントに記載しないでください。GitHub secrets、認証情報ブローカー、またはオペレーターのローカル secret ストアに保存してください。

## シナリオの追加

Mantis シナリオでは次を宣言する必要があります。

- id とタイトル
- トランスポート
- 必要な認証情報
- baseline ref ポリシー
- candidate ref ポリシー
- OpenClaw config パッチ
- セットアップ手順
- 刺激
- 期待される baseline oracle
- 期待される candidate oracle
- ビジュアルキャプチャターゲット
- タイムアウト予算
- クリーンアップ手順

シナリオでは、小さく型付けされた oracle を優先する必要があります。

- リアクションのバグには Discord リアクション状態
- スレッド化のバグには Discord メッセージ参照
- Slack のバグには Slack thread ts とリアクション API 状態
- メールのバグにはメール message id と header
- UI が唯一の信頼できる観測対象である場合はブラウザースクリーンショット

ビジョンチェックは追加的にする必要があります。プラットフォーム API でバグを証明できる場合は、その API を pass/fail oracle として使用し、スクリーンショットは人間の確認用に残してください。

## プロバイダー拡張

Discord の後、同じランナーで次を追加できます。

- Slack: リアクション、スレッド、app mentions、modals、ファイルアップロード。
- メール: connector だけでは不十分な場合の `gog` を使った Gmail 認証とメッセージスレッド化。
- WhatsApp: QR ログイン、再識別、メッセージ配信、メディア、リアクション。
- Telegram: group mention gating、コマンド、利用可能な場合はリアクション。
- Matrix: 暗号化 rooms、thread または reply relations、再起動後の再開。

各トランスポートには、低コストな smoke シナリオを 1 つと、1 つ以上のバグクラスシナリオを用意する必要があります。高コストなビジュアルシナリオは opt-in のままにしてください。

## 未解決の質問

- 既存の Mantis bot を再利用する場合、どの Discord bot を driver にし、どれを SUT にするべきですか？
- observer ブラウザーログインは、最初のフェーズで人間の Discord アカウント、テストアカウント、または bot で読み取り可能な REST 証拠のみのどれを使用するべきですか？
- GitHub は PR の Mantis アーティファクトをどのくらいの期間保持するべきですか？
- ClawSweeper は、メンテナーコマンドを待つのではなく、いつ Mantis を自動的に推奨するべきですか？
- 公開 PR では、アップロード前にスクリーンショットを秘匿またはクロップするべきですか？
