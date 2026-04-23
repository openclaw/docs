---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際のOpenClaw活用例を探している場合
    - コミュニティプロジェクトのハイライトを更新する場合
summary: OpenClawを活用したコミュニティ製プロジェクトと連携
title: ショーケース
x-i18n:
    generated_at: "2026-04-23T14:10:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5bf4bd2548709a01ad18331537f804b32c3213139c2234915aa17f7a2638f19f
    source_path: start/showcase.md
    workflow: 15
---

# ショーケース

<div className="showcase-hero">
  <p className="showcase-kicker">チャット、ターミナル、ブラウザー、そしてリビングルームで生まれたもの</p>
  <p className="showcase-lead">
    OpenClawのプロジェクトは、おもちゃのデモではありません。人々は、すでに使っているチャンネル上で、PRレビューのループ、モバイルアプリ、ホームオートメーション、
    音声システム、開発ツール、メモリ負荷の高いワークフローを実際に形にしています。
  </p>
  <div className="showcase-actions">
    <a href="#videos">デモを見る</a>
    <a href="#fresh-from-discord">プロジェクトを見る</a>
    <a href="https://discord.gg/clawd">自分の作品を共有する</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>チャットネイティブな構築</strong>
      <span>Telegram、WhatsApp、Discord、Beeper、Webチャット、そしてターミナル優先のワークフロー。</span>
    </div>
    <div className="showcase-highlight">
      <strong>本物の自動化</strong>
      <span>予約、買い物、サポート、レポート作成、ブラウザー操作を、APIを待たずに実現。</span>
    </div>
    <div className="showcase-highlight">
      <strong>ローカル + 物理世界</strong>
      <span>プリンター、掃除機、カメラ、健康データ、ホームシステム、個人知識ベース。</span>
    </div>
  </div>
</div>

<Info>
**掲載されたいですか？** あなたのプロジェクトを [Discordの#self-promotion](https://discord.gg/clawd) で共有するか、[Xで @openclaw をタグ付け](https://x.com/openclaw) してください。
</Info>

<div className="showcase-jump-links">
  <a href="#videos">動画</a>
  <a href="#fresh-from-discord">Discordからの最新事例</a>
  <a href="#automation-workflows">自動化</a>
  <a href="#knowledge-memory">メモリ</a>
  <a href="#voice-phone">音声と電話</a>
  <a href="#infrastructure-deployment">インフラ</a>
  <a href="#home-hardware">ホームとハードウェア</a>
  <a href="#community-projects">コミュニティ</a>
  <a href="#submit-your-project">プロジェクトを投稿する</a>
</div>

## 動画

<p className="showcase-section-intro">
  「これは何？」から「なるほど、わかった」まで最短でたどり着きたいなら、ここから始めてください。
</p>

<div className="showcase-video-grid">
  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
        title="OpenClaw: The self-hosted AI that Siri should have been (Full setup)"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>フルセットアップ解説</h3>
    <p>VelvetShark、28分。インストール、オンボーディング、そして最初に動くアシスタント完成までをエンドツーエンドで説明。</p>
    <a href="https://www.youtube.com/watch?v=SaWSPZoPX34">YouTubeで見る</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
        title="OpenClaw showcase video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>コミュニティショーケース映像</h3>
    <p>OpenClawを中心に作られた実際のプロジェクト、画面、ワークフローをよりテンポよく紹介します。</p>
    <a href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">YouTubeで見る</a>
  </div>

  <div className="showcase-video-card">
    <div className="showcase-video-shell">
      <iframe
        src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
        title="OpenClaw community showcase"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
    <h3>実際に使われているプロジェクト</h3>
    <p>チャットネイティブなコーディングループからハードウェアや個人向け自動化まで、コミュニティの実例集。</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">YouTubeで見る</a>
  </div>
</div>

## Discordからの最新事例

<p className="showcase-section-intro">
  コーディング、開発ツール、モバイル、チャットネイティブなプロダクト作りにおける最近の注目事例。
</p>

<CardGroup cols={2}>

<Card title="PR Review → Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCodeが変更を完了 → PRを作成 → OpenClawが差分をレビューし、「軽微な提案」と明確なマージ判断をTelegramで返信（先に適用すべき重要修正も含む）。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegramで配信されたOpenClawのPRレビューフィードバック" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ローカルのワインセラーSkillを「Robby」(@openclaw) に依頼。サンプルCSVエクスポートと保存場所を尋ね、その後すばやくSkillを構築/テストします（例では962本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSVからローカルのワインセラーSkillを構築するOpenClaw" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

毎週の献立 → 定番商品 → 配送枠の予約 → 注文確定。APIなし、ブラウザー操作だけで実現。

  <img src="/assets/showcase/tesco-shop.jpg" alt="チャット経由のTesco買い物自動化" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

画面領域をホットキーで選択 → Gemini vision → クリップボードに即座にMarkdown。

  <img src="/assets/showcase/snag.png" alt="SNAGスクリーンショットからMarkdownへのツール" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw間でSkills/コマンドを管理するデスクトップアプリ。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UIアプリ" />
</Card>

<Card title="Telegram Voice Notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTSをラップし、結果をTelegramのボイスノートとして送信します（うっとうしい自動再生なし）。

  <img src="/assets/showcase/papla-tts.jpg" alt="TTSから生成されたTelegramボイスノート出力" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ローカルのOpenAI Codexセッションを一覧/確認/監視するHomebrewインストール型ヘルパー（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub上のCodexMonitor" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLabプリンターの制御とトラブルシューティング: ステータス、ジョブ、カメラ、AMS、キャリブレーションなど。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub上のBambu CLI Skill" />
</Card>

<Card title="Vienna Transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通機関向けに、リアルタイム出発情報、運行障害、エレベーター状況、経路案内を提供。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien Skill" />
</Card>

<Card title="ParentPay School Meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay経由で英国の学校給食予約を自動化。テーブルセルを確実にクリックするため、マウス座標を使用。
</Card>

<Card title="R2 Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3へアップロードし、安全なpresignedダウンロードリンクを生成。リモートのOpenClawインスタンスに最適です。
</Card>

<Card title="iOS App via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

地図と音声録音を備えた完全なiOSアプリを構築し、TelegramチャットだけでTestFlightへデプロイ。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight上のiOSアプリ" />
</Card>

<Card title="Oura Ring Health Assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ringのデータをカレンダー、予定、ジムのスケジュールと統合した個人向けAI健康アシスタント。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring健康アシスタント" />
</Card>
<Card title="Kev's Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

1つのGateway配下で14以上のエージェントを運用し、Opus 4.5オーケストレーターがCodexワーカーへ委譲。Dream Teamの構成、モデル選択、サンドボックス化、Webhook、Heartbeat、委譲フローを網羅した包括的な[技術解説](https://github.com/adam91holt/orchestrated-ai-articles)あり。エージェントのサンドボックス化には [Clawdspace](https://github.com/adam91holt/clawdspace)。[ブログ記事](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

エージェント型ワークフロー（Claude Code、OpenClaw）と統合するLinear向けCLI。ターミナルからissue、プロジェクト、ワークフローを管理。最初の外部PRもマージ済みです！
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop経由でメッセージの読み取り、送信、アーカイブを実行。BeeperのローカルMCP APIを使うため、エージェントがすべてのチャット（iMessage、WhatsAppなど）を1か所で管理できます。
</Card>

</CardGroup>

<a id="automation-workflows"></a>

## 自動化とワークフロー

<p className="showcase-section-intro">
  スケジューリング、ブラウザー操作、サポートループ、そして「その作業を代わりにやって」の側面。
</p>

<CardGroup cols={2}>

<Card title="Winix Air Purifier Control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Codeが空気清浄機の制御方法を発見して確認し、その後OpenClawが引き継いで室内の空気品質を管理。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClawによるWinix空気清浄機制御" />
</Card>

<Card title="Pretty Sky Camera Shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

屋上カメラをトリガーに、「空がきれいに見えたら写真を撮って」とOpenClawへ依頼 — Skillを設計し、実際に撮影まで行いました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClawが撮影した屋上カメラの空のスナップショット" />
</Card>

<Card title="Visual Morning Briefing Scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

スケジュール済みプロンプトにより、OpenClawのペルソナを通じて、天気、タスク、日付、お気に入り投稿/引用をまとめた1枚の「シーン」画像を毎朝生成。
</Card>

<Card title="Padel Court Booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomicの空き状況チェッカー + 予約CLI。空いたコートをもう見逃しません。
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cliのスクリーンショット" />
</Card>

<Card title="Accounting Intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  メールからPDFを収集し、税理士向けに書類を準備。毎月の会計処理を自動操縦化。
</Card>

<Card title="Couch Potato Dev Mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Telegramだけで個人サイト全体を作り直しながらNetflixを視聴 — Notion → Astro、18本の記事を移行、DNSをCloudflareへ。ノートPCは一度も開かずに完了。
</Card>

<Card title="Job Search Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人一覧を検索し、CVキーワードと照合して、関連する求人をリンク付きで返します。JSearch APIを使って30分で構築。
</Card>

<Card title="Jira Skill Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClawがJiraに接続し、その場で新しいSkillを生成（ClawHubに存在する前に）。
</Card>

<Card title="Todoist Skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoistタスクを自動化し、OpenClawにTelegramチャット内で直接Skillを生成させました。
</Card>

<Card title="TradingView Analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化でTradingViewにログインし、チャートをスクリーンショットし、オンデマンドでテクニカル分析を実行。API不要、必要なのはブラウザー操作だけ。
</Card>

<Card title="Slack Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

会社のSlackチャンネルを監視し、役立つ返信を行い、通知をTelegramへ転送。依頼されていないのに、デプロイ済みアプリの本番バグを自律的に修正。
</Card>

</CardGroup>

<a id="knowledge-memory"></a>

## 知識とメモリ

<p className="showcase-section-intro">
  個人またはチームの知識をインデックス化し、検索し、記憶し、推論するシステム。
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinese Learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClawを通じた発音フィードバックと学習フローを備えた中国語学習エンジン。
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezhの発音フィードバック" />
</Card>

<Card title="WhatsApp Memory Vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  完全なWhatsAppエクスポートを取り込み、1000件超のボイスノートを文字起こしし、gitログと照合し、リンク付きMarkdownレポートを出力。
</Card>

<Card title="Karakeep Semantic Search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama埋め込みを使って、Karakeepブックマークにベクトル検索を追加。
</Card>

<Card title="Inside-Out-2 Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  セッションファイルをメモリ → 信念 → 進化する自己モデルへ変換する独立したメモリマネージャー。
</Card>

</CardGroup>

<a id="voice-phone"></a>

## 音声と電話

<p className="showcase-section-intro">
  音声優先の入口、電話ブリッジ、文字起こし負荷の高いワークフロー。
</p>

<CardGroup cols={2}>

<Card title="Clawdia Phone Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi音声アシスタント ↔ OpenClaw HTTPブリッジ。あなたのエージェントとほぼリアルタイムで電話通話できます。
</Card>

<Card title="OpenRouter Transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter（Geminiなど）経由の多言語音声文字起こし。ClawHubで利用可能です。
</Card>

</CardGroup>

<a id="infrastructure-deployment"></a>

## インフラとデプロイ

<p className="showcase-section-intro">
  OpenClawをより実行しやすく、拡張しやすくするパッケージング、デプロイ、連携。
</p>

<CardGroup cols={2}>

<Card title="Home Assistant Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  Home Assistant OS上で動作するOpenClaw Gateway。SSHトンネル対応と永続状態を備えます。
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  自然言語でHome Assistantデバイスを制御・自動化。
</Card>

<Card title="Nix Packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  再現可能なデプロイ向けに、必要なものを揃えたnix化OpenClaw構成。
</Card>

<Card title="CalDAV Calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncerを使ったカレンダーSkill。セルフホスト型カレンダー連携。
</Card>

</CardGroup>

<a id="home-hardware"></a>

## ホームとハードウェア

<p className="showcase-section-intro">
  OpenClawの物理世界側: 家、センサー、カメラ、掃除機、その他のデバイス。
</p>

<CardGroup cols={2}>

<Card title="GoHome Automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  インターフェースとしてOpenClawを使うNixネイティブなホームオートメーション。美しいGrafanaダッシュボードも付属。
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafanaダッシュボード" />
</Card>

<Card title="Roborock Vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  Roborockロボット掃除機を自然な会話で制御。
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborockのステータス" />
</Card>

</CardGroup>

## コミュニティプロジェクト

<p className="showcase-section-intro">
  単一ワークフローを超えて、より広いプロダクトやエコシステムへ成長したもの。
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  本格的な天体観測機材マーケットプレイス。OpenClawエコシステムで/を中心に構築。
</Card>

</CardGroup>

---

## あなたのプロジェクトを投稿する

<p className="showcase-section-intro">
  OpenClawで何か面白いものを作っているなら、ぜひ送ってください。強いスクリーンショットと具体的な成果があると助かります。
</p>

共有したいものがありますか？ ぜひ掲載したいです！

<Steps>
  <Step title="共有する">
    [Discordの#self-promotion](https://discord.gg/clawd) に投稿するか、[Xで @openclaw に投稿](https://x.com/openclaw)
  </Step>
  <Step title="詳細を含める">
    何をするものか、リポジトリ/デモへのリンク、あればスクリーンショットを教えてください
  </Step>
  <Step title="掲載される">
    注目プロジェクトをこのページに追加します
  </Step>
</Steps>
