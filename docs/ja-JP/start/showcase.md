---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際のOpenClaw活用例を探す
    - コミュニティプロジェクトのハイライトを更新する
summary: OpenClaw を活用したコミュニティ製のプロジェクトと連携機能
title: ショーケース
x-i18n:
    generated_at: "2026-07-11T22:44:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

コミュニティが構築した OpenClaw プロジェクト：PR レビューループ、モバイルアプリ、ホームオートメーション、音声システム、開発ツール、メモリワークフロー。Telegram、WhatsApp、Discord、ターミナル上でチャットネイティブに構築されています。

<Info>
**掲載を希望しますか？** [Discord の #self-promotion](https://discord.gg/clawd) でプロジェクトを共有するか、[X で @openclaw をタグ付け](https://x.com/openclaw)してください。
</Info>

## Discord からの新着

コーディング、開発ツール、モバイル、チャットネイティブな製品開発における最近の注目作です。

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

エージェントに「この HTML をデプロイして」と伝えると、約 1 秒で公開 URL が返されます。ページは 1 時間後に自動失効します。サーバー、設定、登録は不要です。
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

任意の URL を貼り付けると、判定結果が返されます。PhishTank、OpenPhish、CERT.PL など 38 のフィードから収集した 250 万件以上の詐欺ドメインとローカルで照合するため、閲覧履歴が端末の外に送信されることはありません。
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

製品開発向けの 3 点セットです。[ソクラテス式対話](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog)は回答前に質問を掘り下げ、[狩野モデル戦略](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist)は採用する価値がある機能を分類し、[読みやすいエージェント出力](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output)はエージェントの出力を平易な言葉に書き直します。
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

サブエージェントの作業中にオーケストレーターが待機状態になるのを防ぎます。親エージェントをブロックせず、結果をメールボックスに届ける非同期コールバック機構です。
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

2～4 GB のマシンでも OpenClaw を利用可能な状態に保ちます。空きメモリを確認し、マシンがスワップを始める前に負荷の高い機能を縮小します。[GitHub のソース](https://github.com/mirajmahmudul/openclaw-lite-mode)。
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

OpenClaw を第一級でサポートする、NVIDIA のエンジニアによるトークンコスト追跡ツールです。エージェントの費用がどこで発生しているかを、モデル別およびセッション別に正確に確認できます。
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

チャットで図を説明すると、プログラムで生成された Excalidraw スケッチが返されます。
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw に独自の Google Analytics クエリツールを構築させ、その後パッケージ化して ClawHub に公開しました。
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

59 種類のエージェント役割でモデルをベンチマークし、「自分の GPU にはどの LLM が適しているか？」という疑問に答えます。ローカルモデル選びでコミュニティに人気のツールです。
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

プロバイダーに依存しない楽曲生成です。一度きりのプロンプトで済ませるのではなく、楽曲を計画し、歌詞を構成し、不十分な結果を修正します。BPM、キー、構成、マッシュアップを制御できる [MiniMax 版](https://clawhub.ai/luischarro/music-craft-minimax)も含まれます。
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode が変更を完了して PR を作成し、OpenClaw が差分をレビューして、提案と明確なマージ可否の判定を Telegram で返信します。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

「Robby」（@openclaw）にローカルのワインセラー用 skill を依頼しました。サンプルの CSV エクスポートと保存先パスを要求し、skill を構築してテストします（例では 962 本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

週間献立を作成し、定番品を追加し、配送時間帯を予約して、注文を確定します。API は使用せず、ブラウザー操作だけで実行します。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

ホットキーで画面領域を選択し、Gemini の画像認識を使用して、Markdown を即座にクリップボードへ出力します。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw の Skills とコマンドを一元管理するデスクトップアプリです。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **コミュニティ** • `voice` `tts` `telegram`

papla.media の TTS をラップし、結果を Telegram のボイスメッセージとして送信します（煩わしい自動再生はありません）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ローカルの OpenAI Codex セッションを一覧表示、調査、監視するための、Homebrew でインストール可能な補助ツールです（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab プリンターを操作し、問題を診断します。状態、ジョブ、カメラ、AMS、キャリブレーションなどに対応します。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通機関について、リアルタイムの出発情報、運行障害、エレベーターの状態、経路案内を提供します。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay を介した英国の学校給食予約を自動化します。表のセルを確実にクリックするため、マウス座標を使用します。
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 にアップロードし、安全な署名付きダウンロードリンクを生成します。リモートの OpenClaw インスタンスに便利です。

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

地図と音声録音を備えた完全な iOS アプリを、Telegram のチャットだけで構築し、App Store で配布できる状態まで準備しました。
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura Ring のデータをカレンダー、予定、ジムのスケジュールと統合する、個人向け AI 健康アシスタントです。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

1 つの Gateway 配下で 14 体以上のエージェントを動かし、Opus 4.5 のオーケストレーターが Codex ワーカーに処理を委任します。[技術解説](https://github.com/adam91holt/orchestrated-ai-articles)と、エージェントのサンドボックス化に使用する [Clawdspace](https://github.com/adam91holt/clawdspace)を参照してください。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

エージェント型ワークフロー（Claude Code、OpenClaw）と統合できる Linear 用 CLI です。ターミナルから課題、プロジェクト、ワークフローを管理できます。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop を介してメッセージを読み取り、送信、アーカイブします。Beeper のローカル MCP API を使用するため、エージェントはすべてのチャット（iMessage、WhatsApp など）を 1 か所で管理できます。
</Card>

</CardGroup>

## 自動化とワークフロー

スケジュール、ブラウザー操作、サポートループなど、製品の「タスクを代わりに実行してほしい」という側面です。

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code が空気清浄機の操作方法を特定して確認し、その後 OpenClaw が引き継いで室内の空気質を管理します。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

屋根に設置したカメラをトリガーにし、空がきれいに見えるたびに写真を撮るよう OpenClaw に依頼します。OpenClaw が skill を設計し、撮影まで行いました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

スケジュールされたプロンプトにより、OpenClaw のペルソナを介して毎朝 1 枚の情景画像（天気、タスク、日付、お気に入りの投稿または引用）を生成します。
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic の空き状況確認ツールと予約 CLI です。空いているコートをもう見逃しません。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **コミュニティ** • `automation` `email` `pdf`

メールから PDF を収集し、税務コンサルタント向けに書類を準備します。毎月の経理処理を自動運転します。
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix を見ながら、Telegram を介して個人サイト全体を再構築しました。Notion から Astro へ移行し、18 件の投稿を移し、DNS を Cloudflare に変更しました。ノートパソコンは一度も開いていません。
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人情報を検索し、履歴書のキーワードと照合して、関連する求人をリンク付きで返します。JSearch API を使用して 30 分で構築されました。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClawをJiraに接続し、その場で新しいスキルを生成しました（ClawHubに存在する前から）。
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoistのタスクを自動化し、OpenClawにTelegramのチャット内でスキルを直接生成させました。
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化を使ってTradingViewにログインし、チャートのスクリーンショットを撮影して、要求に応じてテクニカル分析を実行します。APIは不要で、ブラウザー操作だけで動作します。
</Card>

<Card title="Car negotiation ($4,200 saved)" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClawに自動車販売店との交渉を任せました。往復のやり取りを処理し、価格を4,200ドル引き下げました。
</Card>

<Card title="Flight check-in autopilot" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

メールから次のフライトを見つけ、オンラインチェックインを進め、窓側の座席を選択します。航空会社のアプリは不要です。
</Card>

<Card title="Insurance claim filing" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

保険金請求を提出し、フォローアップの予約を自律的に行いました。
</Card>

<Card title="Idealista real estate skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

物件の検索と評価に対応するIdealista API CLIをスキルとしてラップし、エージェントがチャット内で住居を探せるようにしました。
</Card>

<Card title="Gardening business back office" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Gmailで作業依頼を監視し、Telegram経由で送信された物件写真を分析して、複数ページのLaTeX見積書PDFを作成し、Xeroで請求書を発行します。
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

会社のSlackチャンネルを監視し、役立つ回答を返して、通知をTelegramへ転送します。依頼されることなく、デプロイ済みアプリの本番環境のバグを自律的に修正しました。
</Card>

</CardGroup>

## ナレッジとメモリ

個人またはチームのナレッジを索引化、検索、記憶し、それに基づいて推論するシステムです。

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClawを通じて発音フィードバックと学習フローを提供する中国語学習エンジンです。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="X post analysis pipeline" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

Xの上位100アカウントから400万件の投稿を取得し、検索可能な分析パイプラインに変換しました。
</Card>

<Card title="Lab results to Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

長年にわたる血液検査結果を、構造化されたNotionデータベースに整理しました。
</Card>

<Card title="Obsidian second brain" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

すべてのメモリを、バージョン管理されたObsidian保管庫内のMarkdownとして保存する、WhatsApp上の日常利用向けアシスタントです。カロリーと運動の記録、ToDoリスト、生活上の事務管理に対応します。
</Card>

<Card title="Family history bot" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

家族のTelegramグループチャットに参加し、50人を超える親族の物語を記録して、内容を踏まえた追加質問を行います。ネパール語の母語話者にはネパール語で応答します。
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **コミュニティ** • `memory` `transcription` `indexing`

WhatsAppの完全なエクスポートを取り込み、1,000件を超える音声メモを書き起こし、gitログと照合して、リンク付きのMarkdownレポートを出力します。
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

QdrantとOpenAIまたはOllamaの埋め込みを使用して、Karakeepのブックマークにベクトル検索を追加します。
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **コミュニティ** • `memory` `beliefs` `self-model`

セッションファイルを記憶に変換し、次に信念へ、さらに進化し続ける自己モデルへと変換する独立したメモリマネージャーです。
</Card>

</CardGroup>

## 音声と電話

音声を中心とした入口、電話ブリッジ、文字起こしを多用するワークフローです。

<CardGroup cols={2}>

<Card title="Pebble Ring one-tap voice" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Pebble Ringを1回タップするとOpenClawとの音声会話が始まり、ウェアラブル端末からエージェントにアクセスできます。
</Card>

<Card title="Creator media studio" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

チャット内で完結するメディアスタジオです。Codex 5.2とMiniMaxに接続したTTS、文字起こし、ブラウザー自動化を利用できます。
</Card>

<Card title="Action Button walkie-talkie" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

iPhoneのAction ButtonをOpenClawに接続しています。ボタンを押して話すと、エージェントがトランシーバーのように音声で応答します。
</Card>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi音声アシスタントとOpenClaw HTTPを接続するブリッジです。エージェントとほぼリアルタイムで通話できます。
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter（Geminiなど）を使用した多言語音声文字起こしです。ClawHubで利用できます。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## インフラストラクチャとデプロイ

OpenClawの実行と拡張を容易にするパッケージ化、デプロイ、統合です。

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSHトンネルと永続状態に対応し、Home Assistant OS上で動作するOpenClaw Gatewayです。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

自然言語を使ってHome Assistantデバイスを制御し、自動化します。

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="macOS menu bar manager" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

エージェントの状態とクイック操作を表示する、ネイティブSwift製メニューバーアプリです。
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

再現可能なデプロイのために必要な機能を一式備えた、Nix化済みのOpenClaw設定です。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khalとvdirsyncerを使用するカレンダースキルです。セルフホスト型カレンダーと統合できます。

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## 家庭とハードウェア

家庭、センサー、カメラ、掃除機などのデバイスを扱う、OpenClawの物理世界向け機能です。

<CardGroup cols={2}>

<Card title="Self-built HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClawがローカルネットワーク上のHomePodを検出し、それらを制御するスキルを自ら作成しました。
</Card>

<Card title="$35 holo cube interface" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

机の上でエージェントの物理的な顔として機能する、安価なホログラフィックキューブです。
</Card>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClawをインターフェースとして使用し、Grafanaダッシュボードも備えた、Nixネイティブのホームオートメーションです。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

自然な会話を通じてRoborockロボット掃除機を制御します。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## コミュニティプロジェクト

単一のワークフローを超えて、より広範な製品やエコシステムへと発展したプロジェクトです。

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **コミュニティ** • `marketplace` `astronomy` `webapp`

天文機材を扱う本格的なマーケットプレイスです。OpenClawエコシステムを活用し、その周辺に構築されています。
</Card>

<Card title="Clinch agent negotiation protocol" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

オープンなエージェント間交渉です。エージェントが他のNodeと取引条件、日程、サービス契約について交渉し、結果に暗号学的な署名を付けます。ユーザーは承認または拒否するだけです。
</Card>

</CardGroup>

## プロジェクトを投稿する

<Steps>
  <Step title="Share it">
    [Discordの#self-promotion](https://discord.gg/clawd)に投稿するか、[@openclaw宛てにポスト](https://x.com/openclaw)してください。
  </Step>
  <Step title="Include details">
    プロジェクトの機能を説明し、リポジトリまたはデモへのリンクを記載してください。スクリーンショットがある場合は共有してください。
  </Step>
  <Step title="Get featured">
    特に優れたプロジェクトをこのページに掲載します。
  </Step>
</Steps>

## 関連項目

- [はじめに](/ja-JP/start/getting-started)
- [OpenClaw](/ja-JP/start/openclaw)
- [openclaw.aiのXショーケース完全版](https://openclaw.ai/showcase/)
