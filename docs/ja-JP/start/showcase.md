---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際のOpenClaw使用例を探す
    - コミュニティプロジェクトのハイライトを更新する
summary: OpenClaw を活用したコミュニティ製のプロジェクトと連携
title: ショーケース
x-i18n:
    generated_at: "2026-06-27T13:06:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw プロジェクトはおもちゃのデモではありません。人々は、すでに使っているチャネルから、PR レビューループ、モバイルアプリ、ホームオートメーション、音声システム、devtools、メモリを大量に使うワークフローを出荷しています。Telegram、WhatsApp、Discord、ターミナル上のチャットネイティブなビルド、API を待たずに予約、買い物、サポートを行う実用的な自動化、そしてプリンター、掃除機、カメラ、ホームシステムとの物理世界の統合です。

<Info>
**掲載されたいですか?** [Discord の #self-promotion](https://discord.gg/clawd) でプロジェクトを共有するか、[X で @openclaw をタグ付け](https://x.com/openclaw)してください。
</Info>

## Discord からの最新情報

コーディング、devtools、モバイル、チャットネイティブなプロダクト構築にまたがる最近の注目事例。

<CardGroup cols={2}>

<Card title="PR レビューから Telegram フィードバックへ" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode が変更を完了して PR を開き、OpenClaw が差分をレビューし、提案と明確なマージ判定を添えて Telegram で返信します。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram で配信された OpenClaw PR レビューフィードバック" />
</Card>

<Card title="数分で作るワインセラー Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ローカルのワインセラー Skill を "Robby" (@openclaw) に依頼。サンプル CSV エクスポートと保存パスを要求し、その後 Skill を構築してテストします (例では 962 本)。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV からローカルのワインセラー Skill を構築する OpenClaw" />
</Card>

<Card title="Tesco 買い物オートパイロット" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

週間献立、いつもの商品、配送枠の予約、注文の確認。API は不要で、ブラウザー操作だけです。

  <img src="/assets/showcase/tesco-shop.jpg" alt="チャット経由の Tesco 買い物自動化" />
</Card>

<Card title="SNAG スクリーンショットから Markdown へ" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

ホットキーで画面領域を選択し、Gemini vision に渡して、即座に Markdown をクリップボードへ送ります。

  <img src="/assets/showcase/snag.png" alt="SNAG スクリーンショットから Markdown へのツール" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw 全体で Skills とコマンドを管理するデスクトップアプリ。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI アプリ" />
</Card>

<Card title="Telegram 音声メモ (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS をラップし、結果を Telegram 音声メモとして送信します (煩わしい自動再生なし)。

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS からの Telegram 音声メモ出力" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ローカルの OpenAI Codex セッションを一覧表示、検査、監視するための、Homebrew でインストール可能なヘルパー (CLI + VS Code)。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上の CodexMonitor" />
</Card>

<Card title="Bambu 3D プリンター制御" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab プリンターを制御してトラブルシュートします。ステータス、ジョブ、カメラ、AMS、キャリブレーションなどに対応します。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上の Bambu CLI Skill" />
</Card>

<Card title="ウィーン交通 (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通機関向けのリアルタイム出発情報、運行障害、エレベーター状態、経路検索。

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub 上の Wiener Linien Skill" />
</Card>

<Card title="ParentPay 学校給食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay 経由で英国の学校給食予約を自動化。確実に表のセルをクリックするためにマウス座標を使用します。
</Card>

<Card title="R2 アップロード (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 にアップロードし、安全な署名付きダウンロードリンクを生成します。リモートの OpenClaw インスタンスに便利です。

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub 上の R2 アップロード Skill" />
</Card>

<Card title="Telegram 経由の iOS アプリ" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

地図と音声録音を備えた完全な iOS アプリを構築し、Telegram チャットだけで TestFlight にデプロイしました。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上の iOS アプリ" />
</Card>

<Card title="Oura Ring 健康アシスタント" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring データをカレンダー、予定、ジムのスケジュールと統合する個人向け AI 健康アシスタント。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring 健康アシスタント" />
</Card>

<Card title="Kev の Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

1 つの Gateway の下で 14+ agents を運用し、Opus 4.5 オーケストレーターが Codex ワーカーへ委任します。agent サンドボックス化については、[技術解説](https://github.com/adam91holt/orchestrated-ai-articles) と [Clawdspace](https://github.com/adam91holt/clawdspace) を参照してください。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

エージェント型ワークフロー (Claude Code、OpenClaw) と統合する Linear 用 CLI。ターミナルから issue、プロジェクト、ワークフローを管理できます。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop 経由でメッセージを読み取り、送信し、アーカイブします。Beeper local MCP API を使うため、エージェントはすべてのチャット (iMessage、WhatsApp など) を 1 か所で管理できます。
</Card>

</CardGroup>

## 自動化とワークフロー

スケジューリング、ブラウザー操作、サポートループ、そして「そのタスクを代わりにやっておいて」というプロダクト側面。

<CardGroup cols={2}>

<Card title="Winix 空気清浄機制御" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code が空気清浄機の制御を発見して確認し、その後 OpenClaw が引き継いで部屋の空気品質を管理します。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw 経由の Winix 空気清浄機制御" />
</Card>

<Card title="きれいな空のカメラ撮影" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

屋根のカメラをトリガーに、空がきれいに見えるたびに OpenClaw に写真撮影を依頼。OpenClaw が Skill を設計し、撮影しました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw が撮影した屋根カメラの空スナップショット" />
</Card>

<Card title="ビジュアル朝ブリーフィングシーン" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

スケジュールされたプロンプトが、OpenClaw ペルソナ経由で毎朝 1 枚のシーン画像 (天気、タスク、日付、お気に入りの投稿または引用) を生成します。
</Card>

<Card title="Padel コート予約" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 空き状況チェッカーと予約 CLI。空いているコートをもう見逃しません。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli スクリーンショット" />
</Card>

<Card title="会計取り込み" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

メールから PDF を収集し、税理士向けに書類を準備します。月次会計をオートパイロットで行います。
</Card>

<Card title="カウチポテト開発モード" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix を見ながら Telegram 経由で個人サイト全体を再構築。Notion から Astro へ、18 件の投稿を移行し、DNS を Cloudflare へ移しました。ノートパソコンは一度も開いていません。
</Card>

<Card title="求人検索エージェント" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人情報を検索し、CV のキーワードと照合し、関連する求人をリンク付きで返します。JSearch API を使って 30 分で構築されました。
</Card>

<Card title="Jira Skill ビルダー" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw が Jira に接続し、その場で新しい Skill を生成しました (ClawHub に存在する前)。
</Card>

<Card title="Telegram 経由の Todoist Skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist タスクを自動化し、OpenClaw に Telegram チャット内で直接 Skill を生成させました。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化で TradingView にログインし、チャートのスクリーンショットを撮り、要求に応じてテクニカル分析を実行します。API は不要で、ブラウザー操作だけです。
</Card>

<Card title="Slack 自動サポート" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

会社の Slack チャネルを監視し、役に立つ返信を行い、通知を Telegram に転送します。依頼されなくても、デプロイ済みアプリの本番バグを自律的に修正しました。
</Card>

</CardGroup>

## ナレッジとメモリ

個人またはチームのナレッジをインデックス化、検索、記憶、推論するシステム。

<CardGroup cols={2}>

<Card title="xuezh 中国語学習" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw 経由の発音フィードバックと学習フローを備えた中国語学習エンジン。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 発音フィードバック" />
</Card>

<Card title="WhatsApp メモリ保管庫" icon="vault">
  **Community** • `memory` `transcription` `indexing`

WhatsApp エクスポート全体を取り込み、1k+ 件の音声メモを文字起こしし、git ログと照合して、リンク付き Markdown レポートを出力します。
</Card>

<Card title="Karakeep セマンティック検索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant と OpenAI または Ollama embeddings を使用して、Karakeep ブックマークにベクトル検索を追加します。
</Card>

<Card title="Inside-Out-2 メモリ" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

セッションファイルをメモリに変換し、さらに信念へ、そして進化する自己モデルへと変換する独立したメモリマネージャー。
</Card>

</CardGroup>

## 音声と電話

音声優先の入口、電話ブリッジ、文字起こし中心のワークフロー。

<CardGroup cols={2}>

<Card title="Clawdia 電話ブリッジ" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 音声アシスタントから OpenClaw HTTP へのブリッジ。エージェントとのほぼリアルタイムの電話通話。
</Card>

<Card title="OpenRouter 文字起こし" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter 経由の多言語音声文字起こし (Gemini など)。ClawHub で利用できます。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub 上の OpenRouter 文字起こし Skill" />
</Card>

</CardGroup>

## インフラストラクチャとデプロイ

OpenClaw を実行し拡張しやすくするパッケージング、デプロイ、統合。

<CardGroup cols={2}>

<Card title="Home Assistant アドオン" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

Home Assistant OS 上で動作する、SSH トンネル対応と永続状態を備えた OpenClaw gateway。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

自然言語で Home Assistant デバイスを制御し、自動化します。

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

再現可能なデプロイのための、すぐに使える nix 化された OpenClaw 設定。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal と vdirsyncer を使用するカレンダースキル。セルフホストのカレンダー連携。

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## ホームとハードウェア

OpenClaw の物理世界側: 家、センサー、カメラ、掃除機、その他のデバイス。

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw をインターフェイスとして使う Nix ネイティブのホームオートメーションと、Grafana ダッシュボード。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

自然な会話を通じて Roborock ロボット掃除機を制御します。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## コミュニティプロジェクト

単一のワークフローを超えて、より広い製品やエコシステムへ成長したもの。

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **コミュニティ** • `marketplace` `astronomy` `webapp`

本格的な天文機材マーケットプレイス。OpenClaw エコシステムとともに、その周辺で構築されています。
</Card>

</CardGroup>

## プロジェクトを送信

<Steps>
  <Step title="Share it">
    [Discord の #self-promotion](https://discord.gg/clawd) に投稿するか、[@openclaw にツイート](https://x.com/openclaw) してください。
  </Step>
  <Step title="Include details">
    何をするものかを説明し、リポジトリまたはデモへのリンクを含め、スクリーンショットがあれば共有してください。
  </Step>
  <Step title="Get featured">
    目立つプロジェクトはこのページに追加します。
  </Step>
</Steps>

## 関連

- [はじめに](/ja-JP/start/getting-started)
- [OpenClaw](/ja-JP/start/openclaw)
