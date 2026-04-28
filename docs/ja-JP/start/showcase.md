---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際の OpenClaw 利用例を探している場合
    - コミュニティプロジェクトのハイライトを更新すること
summary: OpenClaw を活用したコミュニティ構築のプロジェクトと統合
title: ショーケース
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T05:22:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: db901336bb0814eae93453331a58aa267024afeb53f259f5e2a4d71df1039ad2
    source_path: start/showcase.md
    workflow: 15
---

OpenClaw プロジェクトは、おもちゃのデモではありません。人々は、すでに使っているチャンネルから、PR レビューループ、モバイルアプリ、ホームオートメーション、音声システム、開発ツール、メモリ集約型ワークフローを実際に構築しています。Telegram、WhatsApp、Discord、ターミナル上でのチャットネイティブな構築、API を待たずに予約・買い物・サポートを行う実用的な自動化、そしてプリンター、掃除機、カメラ、ホームシステムとの物理世界連携まであります。

<Info>
**掲載されたいですか？** プロジェクトを [Discord の #self-promotion](https://discord.gg/clawd) で共有するか、[X で @openclaw にタグ付け](https://x.com/openclaw) してください。
</Info>

## 動画

「これは何だ？」から「なるほど、わかった」まで最短で進みたいなら、ここから始めてください。

<CardGroup cols={3}>

<Card title="完全セットアップ walkthrough" href="https://www.youtube.com/watch?v=SaWSPZoPX34">
  VelvetShark、28 分。インストール、オンボーディング、最初に動くアシスタントまでを end-to-end で案内。
</Card>

<Card title="コミュニティショーケース reel" href="https://www.youtube.com/watch?v=mMSKQvlmFuQ">
  OpenClaw を中心に構築された実際のプロジェクト、サーフェス、ワークフローをよりテンポよく巡る内容。
</Card>

<Card title="実際に使われているプロジェクト" href="https://www.youtube.com/watch?v=5kkIJNUGFho">
  チャットネイティブなコーディングループからハードウェアや個人向け自動化まで、コミュニティの実例。
</Card>

</CardGroup>

## Discord から最近の注目例

コーディング、開発ツール、モバイル、チャットネイティブなプロダクト構築にまたがる最近の注目事例です。

<CardGroup cols={2}>

<Card title="PR レビューから Telegram フィードバックへ" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode が変更を完了して PR を作成し、OpenClaw が差分をレビューして、提案と明確なマージ判断を Telegram で返信します。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="Telegram で配信される OpenClaw の PR レビューフィードバック" />
</Card>

<Card title="数分で作るワインセラー Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ローカルのワインセラー Skill を「Robby」(@openclaw) に依頼。サンプル CSV エクスポートと保存パスを要求し、その後 Skill を構築してテストします（例では 962 本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="CSV からローカルのワインセラー Skill を構築する OpenClaw" />
</Card>

<Card title="Tesco 買い物 Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

週間献立、定番商品、配達枠の予約、注文確定。API なしで、ブラウザー操作だけで実現。

  <img src="/assets/showcase/tesco-shop.jpg" alt="チャット経由の Tesco 買い物自動化" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

画面領域をホットキーで選択し、Gemini vision で解析して、即座に Markdown をクリップボードへ。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw 間で Skills とコマンドを管理するデスクトップアプリ。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI アプリ" />
</Card>

<Card title="Telegram ボイスノート（papla.media）" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media の TTS をラップし、結果を Telegram のボイスノートとして送信します（煩わしい自動再生なし）。

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS から生成された Telegram ボイスノート出力" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

Homebrew でインストールできる helper。ローカル OpenAI Codex セッションの一覧、確認、監視を行えます（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上の CodexMonitor" />
</Card>

<Card title="Bambu 3D プリンター制御" icon="print" href="https://clawhub.ai/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab プリンターを制御およびトラブルシュート: ステータス、ジョブ、カメラ、AMS、キャリブレーションなど。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上の Bambu CLI skill" />
</Card>

<Card title="ウィーン交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通に対するリアルタイム出発情報、運行障害、エレベーター状況、ルーティング。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay 学校給食" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay 経由の英国学校給食予約を自動化。表セルを確実にクリックするためにマウス座標を使用。
</Card>

<Card title="R2 アップロード（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 にアップロードし、安全な事前署名付きダウンロードリンクを生成します。リモート OpenClaw インスタンスに便利です。
</Card>

<Card title="Telegram 経由の iOS アプリ" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

地図と音声録音を備えた完全な iOS アプリを構築し、すべて Telegram チャット経由で TestFlight に配布。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上の iOS アプリ" />
</Card>

<Card title="Oura Ring ヘルスアシスタント" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura ring データをカレンダー、予定、ジムスケジュールと統合する個人向け AI ヘルスアシスタント。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring ヘルスアシスタント" />
</Card>

<Card title="Kev's Dream Team（14 以上の agent）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

1 つの gateway の下で 14 以上の agent を運用し、Opus 4.5 オーケストレーターが Codex worker に委譲します。[技術的な解説](https://github.com/adam91holt/orchestrated-ai-articles) と、agent sandboxing 用の [Clawdspace](https://github.com/adam91holt/clawdspace) も参照してください。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

agentic ワークフロー（Claude Code、OpenClaw）と統合する Linear 用 CLI。ターミナルから issue、project、workflow を管理します。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop 経由でメッセージの読み取り、送信、アーカイブを行います。Beeper local MCP API を使用するため、agent が iMessage、WhatsApp などすべてのチャットを 1 か所で管理できます。
</Card>

</CardGroup>

## 自動化とワークフロー

スケジューリング、ブラウザー制御、サポートループ、そして「その作業をそのままやってほしい」という側面です。

<CardGroup cols={2}>

<Card title="Winix 空気清浄機制御" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code が清浄機の制御方法を発見・確認し、その後 OpenClaw が部屋の空気質管理を引き継ぎます。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="OpenClaw による Winix 空気清浄機制御" />
</Card>

<Card title="空のきれいな写真を撮るカメラ" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

屋上カメラをトリガーに、空がきれいなときはいつでも OpenClaw に空の写真を撮らせます。Skill を設計し、実際に撮影しました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw が撮影した屋上カメラの空の写真" />
</Card>

<Card title="ビジュアル朝のブリーフィング scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

スケジュールされた prompt が、OpenClaw persona を通じて毎朝 1 枚の scene 画像（天気、タスク、日付、お気に入り投稿または引用）を生成します。
</Card>

<Card title="Padel コート予約" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic の空き状況チェッカーと予約 CLI。空いたコートを見逃しません。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli スクリーンショット" />
</Card>

<Card title="会計書類 intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

メールから PDF を収集し、税理士向けに書類を準備します。毎月の会計処理を自動化。
</Card>

<Card title="ソファで開発モード" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix を見ながら Telegram 経由で個人サイト全体を再構築 — Notion から Astro へ、18 本の記事を移行し、DNS を Cloudflare に移行。ノート PC は一度も開いていません。
</Card>

<Card title="求人検索 agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人一覧を検索し、CV キーワードに照合し、関連する機会をリンク付きで返します。JSearch API を使って 30 分で構築。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw が Jira に接続し、その場で新しい skill を生成しました（ClawHub に存在する前の段階）。
</Card>

<Card title="Telegram 経由の Todoist skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist タスクを自動化し、その skill を OpenClaw が Telegram チャット内で直接生成しました。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザー自動化で TradingView にログインし、チャートをスクリーンショットして、必要時にテクニカル分析を実行します。API は不要で、ブラウザー制御だけです。
</Card>

<Card title="Slack 自動サポート" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

会社の Slack チャンネルを監視し、役立つ返信を行い、通知を Telegram に転送します。依頼されることなく、デプロイ済みアプリの本番バグを自律的に修正しました。
</Card>

</CardGroup>

## 知識とメモリ

個人またはチームの知識をインデックスし、検索し、記憶し、推論するシステムです。

<CardGroup cols={2}>

<Card title="xuezh 中国語学習" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw 経由で発音フィードバックと学習フローを提供する中国語学習エンジン。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 発音フィードバック" />
</Card>

<Card title="WhatsApp メモリ保管庫" icon="vault">
  **Community** • `memory` `transcription` `indexing`

完全な WhatsApp エクスポートを取り込み、1000 件以上のボイスノートを文字起こしし、git ログと照合して、リンク付き Markdown レポートを出力します。
</Card>

<Card title="Karakeep セマンティック検索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant と OpenAI または Ollama 埋め込みを使って、Karakeep ブックマークにベクトル検索を追加します。
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

セッションファイルを記憶へ、記憶を信念へ、信念を進化する自己モデルへと変換する、独立したメモリ管理システム。
</Card>

</CardGroup>

## 音声と電話

音声優先の入口、電話ブリッジ、文字起こし中心のワークフローです。

<CardGroup cols={2}>

<Card title="Clawdia 電話ブリッジ" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 音声アシスタントから OpenClaw HTTP へのブリッジ。agent とほぼリアルタイムで電話できます。
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

多言語音声文字起こしを OpenRouter（Gemini など）経由で提供します。ClawHub で利用できます。
</Card>

</CardGroup>

## インフラストラクチャとデプロイ

OpenClaw をより簡単に実行・拡張できるようにするパッケージング、デプロイ、統合です。

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH トンネル対応と永続状態を備えた、Home Assistant OS 上で動作する OpenClaw gateway。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`

自然言語で Home Assistant デバイスを制御・自動化します。
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

再現可能なデプロイ向けの、必要なものが揃った nix 化 OpenClaw 設定。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`

khal と vdirsyncer を使ったカレンダー skill。セルフホスト型カレンダー統合です。
</Card>

</CardGroup>

## ホームとハードウェア

OpenClaw の物理世界側: 家、センサー、カメラ、掃除機、そのほかのデバイス。

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

インターフェースとして OpenClaw を使う Nix ネイティブなホームオートメーションに、Grafana ダッシュボードを追加。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana ダッシュボード" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

自然な会話を通じて Roborock ロボット掃除機を操作します。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock ステータス" />
</Card>

</CardGroup>

## コミュニティプロジェクト

単一のワークフローを超えて、より広い製品やエコシステムへ成長したものです。

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

本格的な天体観測機材マーケットプレイス。OpenClaw エコシステムとともに、そしてその周辺で構築されています。
</Card>

</CardGroup>

## プロジェクトを投稿する

<Steps>
  <Step title="共有する">
    [Discord の #self-promotion](https://discord.gg/clawd) に投稿するか、[X で @openclaw に投稿](https://x.com/openclaw) してください。
  </Step>
  <Step title="詳細を含める">
    何をするものかを説明し、リポジトリまたはデモへのリンクを付け、可能ならスクリーンショットも共有してください。
  </Step>
  <Step title="掲載される">
    注目すべきプロジェクトをこのページに追加します。
  </Step>
</Steps>

## 関連

- [Getting started](/ja-JP/start/getting-started)
- [OpenClaw](/ja-JP/start/openclaw)
