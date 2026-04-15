---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際のOpenClawの使用例を探している場合
    - コミュニティプロジェクトのハイライトを更新したい場合
summary: OpenClawを活用したコミュニティ製プロジェクトと統合機能
title: ショーケース
x-i18n:
    generated_at: "2026-04-15T04:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 797d0b85c9eca920240c79d870eb9636216714f3eba871c5ebd0f7f40cf7bbf1
    source_path: start/showcase.md
    workflow: 15
---

<!-- markdownlint-disable MD033 -->

# ショーケース

<div className="showcase-hero">
  <p className="showcase-kicker">チャット、ターミナル、ブラウザー、そしてリビングルームで構築</p>
  <p className="showcase-lead">
    OpenClawプロジェクトはおもちゃのデモではありません。すでに使っているチャネルから、PRレビューのループ、モバイルアプリ、ホームオートメーション、音声システム、devtools、メモリ負荷の高いワークフローが実際に出荷されています。
  </p>
  <div className="showcase-actions">
    <a href="#videos">デモを見る</a>
    <a href="#fresh-from-discord">プロジェクトを見る</a>
    <a href="https://discord.gg/clawd">あなたの作品を共有</a>
  </div>
  <div className="showcase-highlights">
    <div className="showcase-highlight">
      <strong>チャットネイティブな構築</strong>
      <span>Telegram、WhatsApp、Discord、Beeper、Webチャット、そしてターミナル中心のワークフロー。</span>
    </div>
    <div className="showcase-highlight">
      <strong>実用的な自動化</strong>
      <span>APIを待たずに、予約、買い物、サポート、レポート作成、ブラウザー操作を実現。</span>
    </div>
    <div className="showcase-highlight">
      <strong>ローカル + 現実世界</strong>
      <span>プリンター、掃除機、カメラ、健康データ、ホームシステム、個人ナレッジベース。</span>
    </div>
  </div>
</div>

<Info>
**掲載されたいですか？** あなたのプロジェクトを [Discordの#self-promotion](https://discord.gg/clawd) で共有するか、[Xで@openclawをタグ付け](https://x.com/openclaw)してください。
</Info>

<div className="showcase-jump-links">
  <a href="#videos">動画</a>
  <a href="#fresh-from-discord">Discordからの最新情報</a>
  <a href="#automation-workflows">自動化</a>
  <a href="#knowledge-memory">メモリ</a>
  <a href="#voice-phone">音声と電話</a>
  <a href="#infrastructure-deployment">インフラとデプロイ</a>
  <a href="#home-hardware">ホームとハードウェア</a>
  <a href="#community-projects">コミュニティ</a>
  <a href="#submit-your-project">プロジェクトを投稿</a>
</div>

<h2 id="videos">動画</h2>

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
    <h3>完全セットアップのウォークスルー</h3>
    <p>VelvetShark、28分。インストールし、オンボーディングを行い、最初に動くアシスタントをエンドツーエンドで使えるところまで進めます。</p>
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
    <p>OpenClawを中心に構築された実際のプロジェクト、表面、ワークフローをより手早く見渡せます。</p>
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
    <h3>実運用されているプロジェクト</h3>
    <p>チャットネイティブなコーディングループからハードウェアや個人向け自動化まで、コミュニティによる事例を紹介します。</p>
    <a href="https://www.youtube.com/watch?v=5kkIJNUGFho">YouTubeで見る</a>
  </div>
</div>

<h2 id="fresh-from-discord">Discordからの最新情報</h2>

<p className="showcase-section-intro">
  コーディング、devtools、モバイル、チャットネイティブなプロダクト構築における最近の注目例です。
</p>

<CardGroup cols={2}>

<Card title="PR Review → Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCodeが変更を完了 → PRを作成 → OpenClawが差分をレビューし、「軽微な提案」と明確なマージ判定をTelegramで返信します（先に適用すべき重要な修正も含む）。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegramで配信されたOpenClawのPRレビューフィードバック" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ローカルのワインセラー用Skillsを「Robby」(@openclaw) に依頼。サンプルのCSVエクスポートと保存先を確認し、その後すばやくSkillsを構築・テストします（例では962本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSVからローカルのワインセラー用Skillsを構築するOpenClaw" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

毎週の食事計画 → 定番品 → 配送枠を予約 → 注文を確定。APIは使わず、ブラウザー操作だけで実現。

  <img src="/assets/showcase/tesco-shop.jpg" alt="チャット経由のTesco買い物自動化" />
</Card>

<Card title="SNAG Screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

画面領域をホットキーで選択 → Gemini vision → Markdownが即座にクリップボードへ。

  <img src="/assets/showcase/snag.png" alt="SNAGスクリーンショットからMarkdownへのツール" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw間でSkillsやコマンドを管理するデスクトップアプリ。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UIアプリ" />
</Card>

<Card title="Telegram Voice Notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTSをラップし、結果をTelegramのボイスノートとして送信します（煩わしい自動再生なし）。

  <img src="/assets/showcase/papla-tts.jpg" alt="TTSからのTelegramボイスノート出力" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ローカルのOpenAI Codexセッションを一覧表示・検査・監視できるHomebrewインストール型ヘルパー（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub上のCodexMonitor" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLabプリンターの制御とトラブルシューティングに対応: 状態、ジョブ、カメラ、AMS、キャリブレーションなど。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub上のBambu CLI skill" />
</Card>

<Card title="Vienna Transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通向けに、リアルタイム出発情報、障害情報、エレベーター状態、ルーティングを提供。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill" />
</Card>

<Card title="ParentPay School Meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay経由で英国の学校給食予約を自動化。表のセルを確実にクリックするため、マウス座標を使用します。
</Card>

<Card title="R2 Upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3へアップロードし、安全な署名付きダウンロードリンクを生成します。リモートのOpenClawインスタンスに最適です。
</Card>

<Card title="iOS App via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

地図と音声録音を備えた完全なiOSアプリを構築し、TelegramチャットだけでTestFlightへデプロイしました。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight上のiOSアプリ" />
</Card>

<Card title="Oura Ring Health Assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ringデータをカレンダー、予定、ジムのスケジュールと統合した、個人向けAI健康アシスタント。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring健康アシスタント" />
</Card>
<Card title="Kev's Dream Team (14+ Agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

1つのGateway配下に14以上のagentsを配置し、Opus 4.5のオーケストレーターがCodexワーカーへ委譲します。Dream Teamの構成、モデル選択、サンドボックス化、Webhook、Heartbeat、委譲フローを網羅した包括的な[技術解説](https://github.com/adam91holt/orchestrated-ai-articles)があります。agentサンドボックス化用の[Clawdspace](https://github.com/adam91holt/clawdspace)も用意されています。[ブログ記事](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

agenticワークフロー（Claude Code、OpenClaw）と統合するLinear向けCLI。ターミナルからissue、プロジェクト、ワークフローを管理できます。最初の外部PRがマージされました。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

Beeper Desktop経由でメッセージを読み取り、送信し、アーカイブします。BeeperのローカルMCP APIを使うことで、agentsがiMessage、WhatsAppなどすべてのチャットを1か所で管理できます。
</Card>

</CardGroup>

<h2 id="automation-workflows">自動化 &amp; ワークフロー</h2>

<p className="showcase-section-intro">
  スケジューリング、ブラウザー操作、サポートループ、そして「その作業をそのまま代わりにやってほしい」という側面のプロダクトです。
</p>

<CardGroup cols={2}>

<Card title="Winix Air Purifier Control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Codeが空気清浄機の制御を発見して確認し、その後OpenClawが引き継いで部屋の空気品質を管理します。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw経由のWinix空気清浄機制御" />
</Card>

<Card title="Pretty Sky Camera Shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

屋上カメラをトリガーに、「空がきれいに見えたら写真を撮って」とOpenClawに依頼すると、Skillsを設計して撮影まで行います。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClawが撮影した屋上カメラの空の写真" />
</Card>

<Card title="Visual Morning Briefing Scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

スケジュールされたプロンプトにより、OpenClawペルソナを通じて毎朝1枚の「シーン」画像（天気、タスク、日付、お気に入りの投稿や引用）を生成します。
</Card>

<Card title="Padel Court Booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomicの空き状況チェッカーと予約CLI。空いたコートを二度と逃しません。
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cliのスクリーンショット" />
</Card>

<Card title="Accounting Intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`
  
  メールからPDFを収集し、税理士向けに書類を準備します。毎月の会計を自動操縦で処理します。
</Card>

<Card title="Couch Potato Dev Mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

Netflixを見ながらTelegram経由で個人サイト全体を再構築 — Notion → Astro、18本の記事を移行し、DNSをCloudflareへ。ノートPCは一度も開きませんでした。
</Card>

<Card title="Job Search Agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人一覧を検索し、CVのキーワードと照合して、関連する求人をリンク付きで返します。JSearch APIを使って30分で構築。
</Card>

<Card title="Jira Skill Builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

OpenClawをJiraに接続し、その場で新しいSkillsを生成しました（まだClawHubに存在する前の段階で）。
</Card>

<Card title="Todoist Skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

Todoistタスクを自動化し、そのSkillsをOpenClawにTelegramチャット内で直接生成させました。
</Card>

<Card title="TradingView Analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化でTradingViewにログインし、チャートのスクリーンショットを撮り、必要に応じてテクニカル分析を実行します。APIは不要で、必要なのはブラウザー操作だけです。
</Card>

<Card title="Slack Auto-Support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

社内のSlackチャンネルを監視し、有用な応答を返し、通知をTelegramへ転送します。依頼されることなく、デプロイ済みアプリの本番バグを自律的に修正しました。
</Card>

</CardGroup>

<h2 id="knowledge-memory">ナレッジ &amp; メモリ</h2>

<p className="showcase-section-intro">
  個人またはチームの知識をインデックス化、検索、記憶し、その上で推論するシステム。
</p>

<CardGroup cols={2}>

<Card title="xuezh Chinese Learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  OpenClawを通じて発音フィードバックと学習フローを提供する中国語学習エンジン。
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezhの発音フィードバック" />
</Card>

<Card title="WhatsApp Memory Vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`
  
  完全なWhatsAppエクスポートを取り込み、1,000件以上のボイスノートを文字起こしし、gitログと照合して、リンク付きのMarkdownレポートを出力します。
</Card>

<Card title="Karakeep Semantic Search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  Qdrant + OpenAI/Ollama embeddingsを使用して、Karakeepブックマークにベクトル検索を追加します。
</Card>

<Card title="Inside-Out-2 Memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`
  
  セッションファイルをメモリ → 信念 → 進化する自己モデルへと変換する独立したメモリマネージャー。
</Card>

</CardGroup>

<h2 id="voice-phone">音声 &amp; 電話</h2>

<p className="showcase-section-intro">
  音声優先の入口、電話ブリッジ、文字起こし中心のワークフロー。
</p>

<CardGroup cols={2}>

<Card title="Clawdia Phone Bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi音声アシスタント ↔ OpenClaw HTTPブリッジ。あなたのagentとのほぼリアルタイムな電話通話を実現します。
</Card>

<Card title="OpenRouter Transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter（Geminiなど）による多言語音声文字起こし。ClawHubで利用可能です。
</Card>

</CardGroup>

<h2 id="infrastructure-deployment">インフラ &amp; デプロイ</h2>

<p className="showcase-section-intro">
  OpenClawをより簡単に実行・拡張できるようにする、パッケージング、デプロイ、統合機能。
</p>

<CardGroup cols={2}>

<Card title="Home Assistant Add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  SSHトンネル対応と永続状態を備えた、Home Assistant OS上で動作するOpenClaw Gateway。
</Card>

<Card title="Home Assistant Skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  自然言語でHome Assistantデバイスを制御・自動化します。
</Card>

<Card title="Nix Packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`
  
  再現可能なデプロイのための、必要なものが一式そろったnix化OpenClaw設定。
</Card>

<Card title="CalDAV Calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  khal/vdirsyncerを使ったカレンダーSkills。セルフホスト型のカレンダー統合です。
</Card>

</CardGroup>

<h2 id="home-hardware">ホーム &amp; ハードウェア</h2>

<p className="showcase-section-intro">
  OpenClawの現実世界側: 家、センサー、カメラ、掃除機、その他のデバイス。
</p>

<CardGroup cols={2}>

<Card title="GoHome Automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  インターフェースとしてOpenClawを使うNixネイティブなホームオートメーション。美しいGrafanaダッシュボードも備えています。
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafanaダッシュボード" />
</Card>

<Card title="Roborock Vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  自然な会話を通じてRoborockロボット掃除機を制御します。
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborockの状態" />
</Card>

</CardGroup>

<h2 id="community-projects">コミュニティプロジェクト</h2>

<p className="showcase-section-intro">
  単一のワークフローを超えて、より広いプロダクトやエコシステムへ成長したもの。
</p>

<CardGroup cols={2}>

<Card title="StarSwap Marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`
  
  本格的な天体観測機材マーケットプレイス。OpenClawエコシステムを使って、またはその周辺で構築されています。
</Card>

</CardGroup>

---

<h2 id="submit-your-project">あなたのプロジェクトを投稿</h2>

<p className="showcase-section-intro">
  OpenClawで何か面白いものを作っているなら、ぜひ送ってください。魅力的なスクリーンショットと具体的な成果があると役立ちます。
</p>

共有したいものがありますか？ ぜひ掲載したいです！

<Steps>
  <Step title="共有する">
    [Discordの#self-promotion](https://discord.gg/clawd) に投稿するか、[Xで@openclawに投稿](https://x.com/openclaw)してください
  </Step>
  <Step title="詳細を含める">
    何をするものか、リポジトリやデモへのリンク、可能ならスクリーンショットも共有してください
  </Step>
  <Step title="掲載される">
    注目のプロジェクトをこのページに追加します
  </Step>
</Steps>
