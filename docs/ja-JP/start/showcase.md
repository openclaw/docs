---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際の OpenClaw 使用例を探しています
    - コミュニティプロジェクトのハイライトを更新する
summary: OpenClaw を活用したコミュニティ製プロジェクトと連携
title: ショーケース
x-i18n:
    generated_at: "2026-07-06T21:51:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

コミュニティ製の OpenClaw プロジェクト: Telegram、WhatsApp、Discord、ターミナル上でチャットネイティブに構築された、PR レビューループ、モバイルアプリ、ホームオートメーション、音声システム、開発ツール、メモリワークフロー。

<Info>
**掲載されたいですか？** [Discord の #self-promotion](https://discord.gg/clawd) でプロジェクトを共有するか、[X で @openclaw をタグ付け](https://x.com/openclaw)してください。
</Info>

## Discord からの新着

コーディング、開発ツール、モバイル、チャットネイティブなプロダクト構築にまたがる最近の注目作。

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

エージェントに「deploy this HTML」と伝えると、約 1 秒で公開 URL が返ってきます。ページは 1 時間後に自動失効します。サーバー不要、設定不要、サインアップ不要です。
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

任意の URL を貼り付けるだけで判定を取得できます。38 のフィード（PhishTank、OpenPhish、CERT.PL など）から 250 万件超の詐欺ドメインをローカルで照合するため、閲覧履歴がマシンの外に出ることはありません。
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

プロダクト作業のための 3 点セットです。[Socratic Dialogue](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) は回答前に質問を多角的に検証し、[Kano Model Strategist](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) は機能を採用する価値のあるものへ整理し、[Legible Agent Output](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) はエージェントの出力を平易な言葉に書き直します。
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

サブエージェントの作業中にオーケストレーターがアイドル状態になるのを防ぎます。結果は親エージェントをブロックせず、メールボックスに届く非同期コールバック機構です。
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

2〜4 GB のマシンでも OpenClaw を使える状態に保ちます。空きメモリを確認し、マシンがスワップを始める前に重い機能を削ります。[GitHub のソース](https://github.com/mirajmahmudul/openclaw-lite-mode)。
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

OpenClaw のファーストクラス対応を備えた、NVIDIA エンジニアによるトークンコストトラッカーです。エージェントの支出がどこに使われているかを、モデル別およびセッション別に正確に確認できます。
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

チャットで図を説明すると、プログラムで生成された Excalidraw スケッチが返ってきます。
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

OpenClaw に独自の Google Analytics クエリツールを構築させ、それをパッケージ化して ClawHub に公開しました。
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

59 種類のエージェントロールにわたってモデルをベンチマークし、「自分の GPU にはどの LLM がよいか？」に答えます。ローカルモデル選定でコミュニティに人気です。
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

プロバイダー非依存の楽曲生成です。一発プロンプトではなく、トラックを計画し、歌詞を構成し、乏しい結果を改訂します。BPM、キー、構成、マッシュアップ制御に対応した [MiniMax 版](https://clawhub.ai/luischarro/music-craft-minimax) も含まれます。
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode が変更を完了して PR を開き、OpenClaw が差分をレビューして、提案と明確なマージ判断を Telegram に返信します。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

「Robby」（@openclaw）にローカルのワインセラー Skill を依頼しました。サンプル CSV エクスポートと保存パスを要求し、その後 Skill を構築してテストします（例では 962 本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

週間の食事計画、定番品、配送枠の予約、注文確認。API は使わず、ブラウザー操作だけです。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

画面領域をホットキーで選択し、Gemini vision を通して、即座に Markdown をクリップボードへ入れます。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw 全体で Skills とコマンドを管理するデスクトップアプリです。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS をラップし、結果を Telegram のボイスメモとして送信します（煩わしい自動再生はありません）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ローカルの OpenAI Codex セッション（CLI + VS Code）を一覧表示、検査、監視する Homebrew インストール型ヘルパーです。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab プリンターの制御とトラブルシュートを行います。ステータス、ジョブ、カメラ、AMS、キャリブレーションなどに対応します。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通向けに、リアルタイムの発車情報、運行障害、エレベーター状況、経路案内を提供します。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay を介した英国の学校給食予約の自動化です。信頼性の高い表セルクリックのためにマウス座標を使用します。
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 にアップロードし、安全な署名付きダウンロードリンクを生成します。リモートの OpenClaw インスタンスに便利です。

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

地図と音声録音を備えた完全な iOS アプリを構築し、Telegram チャットだけで App Store 配布に向けて準備しました。
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring のデータをカレンダー、予定、ジムのスケジュールと統合する個人向け AI ヘルスアシスタントです。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

Opus 4.5 オーケストレーターが Codex ワーカーに委任する、1 つのゲートウェイ配下の 14 以上のエージェントです。エージェントのサンドボックス化については、[技術解説](https://github.com/adam91holt/orchestrated-ai-articles) と [Clawdspace](https://github.com/adam91holt/clawdspace) を参照してください。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

エージェント型ワークフロー（Claude Code、OpenClaw）と統合する Linear 向け CLI です。ターミナルから issue、プロジェクト、ワークフローを管理できます。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop を介してメッセージを読み取り、送信し、アーカイブします。Beeper のローカル MCP API を使用するため、エージェントはすべてのチャット（iMessage、WhatsApp など）を 1 か所で管理できます。
</Card>

</CardGroup>

## 自動化とワークフロー

スケジューリング、ブラウザー操作、サポートループ、そしてプロダクトの「このタスクを代わりにやって」側。

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code が空気清浄機の制御方法を発見して確認し、その後 OpenClaw が引き継いで室内の空気品質を管理します。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

屋根のカメラをトリガーにします。空がきれいに見えるたびに OpenClaw に空の写真を撮るよう依頼します。OpenClaw は Skill を設計し、撮影しました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

スケジュールされたプロンプトが、OpenClaw ペルソナを介して毎朝 1 枚のシーン画像（天気、タスク、日付、お気に入りの投稿または引用）を生成します。
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic の空き状況チェッカーと予約 CLI です。空いているコートを二度と逃しません。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

メールから PDF を収集し、税理士向けに書類を準備します。毎月の経理を自動操縦にします。
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix を見ながら、Telegram 経由で個人サイト全体を再構築しました。Notion から Astro へ、18 本の記事を移行し、DNS を Cloudflare へ移しました。ノート PC は一度も開いていません。
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人情報を検索し、CV のキーワードと照合して、関連する機会をリンク付きで返します。JSearch API を使って 30 分で構築されました。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw が Jira に接続し、その場で新しいスキルを生成しました（ClawHub に存在する前）。
</Card>

<Card title="Telegram 経由の Todoist スキル" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist タスクを自動化し、OpenClaw に Telegram チャット内で直接スキルを生成させました。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化で TradingView にログインし、チャートのスクリーンショットを取得して、必要に応じてテクニカル分析を実行します。API は不要で、ブラウザー制御だけです。
</Card>

<Card title="自動車交渉（$4,200 節約）" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

OpenClaw を自動車ディーラーとの交渉に投入し、往復の交渉を処理して価格から $4,200 を引き下げました。
</Card>

<Card title="フライトチェックインの自動操縦" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

メール内の次のフライトを見つけ、オンラインチェックインを進め、窓側席を選びます。航空会社アプリは不要です。
</Card>

<Card title="保険請求の提出" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

保険請求を提出し、フォローアップ予約を自律的にスケジュールしました。
</Card>

<Card title="Idealista 不動産スキル" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

物件検索と評価のための Idealista API CLI をスキルとしてラップし、エージェントがチャット内で家探しできるようにしました。
</Card>

<Card title="園芸ビジネスのバックオフィス" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

Gmail で作業依頼を監視し、Telegram 経由で送られた物件写真を分析し、複数ページの LaTeX 見積 PDF を作成して、Xero で請求します。
</Card>

<Card title="Slack 自動サポート" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

会社の Slack チャンネルを監視し、役立つ返信を行い、通知を Telegram に転送します。依頼されることなく、デプロイ済みアプリの本番バグを自律的に修正しました。
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

<Card title="X 投稿分析パイプライン" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

上位 100 件の X アカウントから 400 万件の投稿を取得し、クエリ可能な分析パイプラインに変換しました。
</Card>

<Card title="検査結果を Notion へ" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

何年分もの血液検査結果を構造化された Notion データベースに整理しました。
</Card>

<Card title="Obsidian セカンドブレイン" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

WhatsApp 上の日常利用アシスタントで、すべてのメモリをバージョン管理された Obsidian ボルト内の markdown として保存します。カロリーとワークアウトの追跡、ToDo リスト、生活管理に対応します。
</Card>

<Card title="家族史ボット" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

家族の Telegram グループチャット内に常駐し、50 人以上の親族にわたる物語を記録し、情報に基づいたフォローアップ質問をします。ネイティブ話者にはネパール語で返信します。
</Card>

<Card title="WhatsApp メモリボルト" icon="vault">
  **Community** • `memory` `transcription` `indexing`

WhatsApp の完全エクスポートを取り込み、1,000 件以上のボイスメモを文字起こしし、git ログと照合して、リンク付き markdown レポートを出力します。
</Card>

<Card title="Karakeep セマンティック検索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant と OpenAI または Ollama の埋め込みを使って、Karakeep ブックマークにベクトル検索を追加します。
</Card>

<Card title="Inside-Out-2 メモリ" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

セッションファイルをメモリに変換し、次に信念へ、さらに進化する自己モデルへ変換する独立したメモリマネージャー。
</Card>

</CardGroup>

## 音声と電話

音声優先の入口、電話ブリッジ、文字起こし中心のワークフロー。

<CardGroup cols={2}>

<Card title="Pebble Ring ワンタップ音声" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

Pebble Ring を 1 回タップするだけで OpenClaw との音声会話が始まります。ウェアラブルからエージェントにアクセスできます。
</Card>

<Card title="クリエイターメディアスタジオ" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

チャット内のフルメディアスタジオです。TTS、文字起こし、ブラウザー自動化を Codex 5.2 と MiniMax に接続しています。
</Card>

<Card title="Action Button トランシーバー" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

iPhone Action Button を OpenClaw に接続します。押して話すと、エージェントがトランシーバーのように応答します。
</Card>

<Card title="Clawdia 電話ブリッジ" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 音声アシスタントから OpenClaw HTTP へのブリッジ。エージェントとのほぼリアルタイムの電話通話を実現します。
</Card>

<Card title="OpenRouter 文字起こし" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter（Gemini など）経由の多言語音声文字起こし。ClawHub で利用できます。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub 上の OpenRouter 文字起こしスキル" />
</Card>

</CardGroup>

## インフラストラクチャとデプロイ

OpenClaw の実行と拡張を容易にするパッケージング、デプロイ、統合。

<CardGroup cols={2}>

<Card title="Home Assistant アドオン" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH トンネルサポートと永続状態を備え、Home Assistant OS 上で動作する OpenClaw Gateway。
</Card>

<Card title="Home Assistant スキル" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

自然言語で Home Assistant デバイスを制御、自動化します。

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub 上の Home Assistant スキル" />
</Card>

<Card title="macOS メニューバーマネージャー" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

クイックコントロール付きでエージェント状態を表示するネイティブ Swift メニューバーアプリ。
</Card>

<Card title="Nix パッケージング" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

再現可能なデプロイのための、必要なものが揃った nix 化済み OpenClaw 設定。
</Card>

<Card title="CalDAV カレンダー" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal と vdirsyncer を使うカレンダースキル。セルフホスト型カレンダー統合です。

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub 上の CalDAV カレンダースキル" />
</Card>

</CardGroup>

## ホームとハードウェア

OpenClaw の物理世界側です。住宅、センサー、カメラ、掃除機、その他のデバイス。

<CardGroup cols={2}>

<Card title="自作 HomePod スキル" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw がローカルネットワーク上の HomePod を見つけ、それらを制御するスキルを自分で書きました。
</Card>

<Card title="$35 ホロキューブインターフェース" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

机の上に置く、エージェントの物理的な顔としての安価なホログラフィックキューブ。
</Card>

<Card title="GoHome 自動化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw をインターフェースとして使う Nix ネイティブのホームオートメーションに、Grafana ダッシュボードを組み合わせています。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana ダッシュボード" />
</Card>

<Card title="Roborock 掃除機" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

自然な会話で Roborock ロボット掃除機を制御します。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状態" />
</Card>

</CardGroup>

## コミュニティプロジェクト

単一のワークフローを超えて、より広いプロダクトやエコシステムへ成長したもの。

<CardGroup cols={2}>

<Card title="StarSwap マーケットプレイス" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

本格的な天文機材マーケットプレイス。OpenClaw エコシステムとともに、その周辺で構築されています。
</Card>

<Card title="Clinch エージェント交渉プロトコル" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

オープンなエージェント間交渉です。あなたのエージェントが他のノードと取引、スケジュール、サービス契約を交渉し、結果に暗号署名します。あなたは承認または拒否するだけです。
</Card>

</CardGroup>

## プロジェクトを投稿する

<Steps>
  <Step title="共有する">
    [Discord の #self-promotion](https://discord.gg/clawd) に投稿するか、[@openclaw にツイート](https://x.com/openclaw) してください。
  </Step>
  <Step title="詳細を含める">
    何をするものかを説明し、リポジトリまたはデモへのリンクを含め、スクリーンショットがあれば共有してください。
  </Step>
  <Step title="掲載される">
    優れたプロジェクトをこのページに追加します。
  </Step>
</Steps>

## 関連

- [はじめに](/ja-JP/start/getting-started)
- [OpenClaw](/ja-JP/start/openclaw)
- [openclaw.ai の完全な X ショーケース](https://openclaw.ai/showcase/)
