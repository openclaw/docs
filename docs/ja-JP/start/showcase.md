---
description: Real-world OpenClaw projects from the community
read_when:
    - 実際のOpenClaw使用例を探す
    - コミュニティプロジェクトのハイライトを更新する
summary: OpenClaw を活用したコミュニティ製プロジェクトと連携
title: ショーケース
x-i18n:
    generated_at: "2026-07-05T11:51:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aa5655ffc9536d17f77bac3160a4c36f18340c88b882498b9e23f72a2e5aed60
    source_path: start/showcase.md
    workflow: 16
---

コミュニティが構築した OpenClaw プロジェクト: Telegram、WhatsApp、Discord、ターミナル上でチャットネイティブに構築された、PR レビューループ、モバイルアプリ、ホームオートメーション、音声システム、開発ツール、メモリワークフロー。

<Info>
**掲載を希望しますか？** [Discord の #self-promotion](https://discord.gg/clawd) でプロジェクトを共有するか、[X で @openclaw をタグ付け](https://x.com/openclaw)してください。
</Info>

## Discord からの新着

コーディング、開発ツール、モバイル、チャットネイティブなプロダクト構築にわたる最近の注目例。

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode が変更を完了して PR を開き、OpenClaw が差分をレビューし、提案と明確なマージ判定を Telegram で返信します。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

ローカルのワインセラー用スキルを "Robby" (@openclaw) に依頼。サンプルの CSV エクスポートと保存先パスを要求し、その後スキルを構築してテストします（例では 962 本）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

週間の食事計画、定番商品、配送枠の予約、注文確認。API は不要で、ブラウザ操作だけです。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

画面範囲をホットキーで指定し、Gemini のビジョンで即座に Markdown をクリップボードへ。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

Agents、Claude、Codex、OpenClaw 全体のスキルとコマンドを管理するデスクトップアプリ。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

papla.media TTS をラップし、結果を Telegram のボイスメモとして送信します（煩わしい自動再生なし）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

ローカルの OpenAI Codex セッションを一覧表示、検査、監視するための Homebrew インストール型ヘルパー（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

BambuLab プリンターの制御とトラブルシュート: ステータス、ジョブ、カメラ、AMS、キャリブレーションなど。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

ウィーンの公共交通向けのリアルタイム発車情報、運行障害、エレベーター状況、経路検索。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

ParentPay 経由で英国の学校給食予約を自動化。表セルを確実にクリックするためにマウス座標を使用します。
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

Cloudflare R2/S3 にアップロードし、安全な署名付きダウンロードリンクを生成します。リモートの OpenClaw インスタンスに便利です。

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

地図と音声録音を備えた完全な iOS アプリを構築し、すべて Telegram チャット経由で App Store 配布向けに準備しました。
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

Oura リングのデータをカレンダー、予約、ジムの予定と統合する個人用 AI ヘルスアシスタント。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

1 つの Gateway 配下に 14 以上のエージェントを置き、Opus 4.5 オーケストレーターが Codex ワーカーへ委任します。エージェントのサンドボックス化については、[技術解説](https://github.com/adam91holt/orchestrated-ai-articles) と [Clawdspace](https://github.com/adam91holt/clawdspace) を参照してください。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

エージェント型ワークフロー（Claude Code、OpenClaw）と統合する Linear 用 CLI。ターミナルから課題、プロジェクト、ワークフローを管理できます。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

Beeper Desktop 経由でメッセージを読み取り、送信し、アーカイブします。Beeper local MCP API を使用するため、エージェントはすべてのチャット（iMessage、WhatsApp など）を 1 か所で管理できます。
</Card>

</CardGroup>

## オートメーションとワークフロー

スケジューリング、ブラウザ操作、サポートループ、そしてプロダクトにおける「そのタスクを代わりにやって」の側面。

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code が空気清浄機の操作を発見して確認し、その後 OpenClaw が引き継いで室内の空気品質を管理します。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

屋上カメラをきっかけに、空がきれいに見えるたび OpenClaw に空の写真撮影を依頼。OpenClaw がスキルを設計し、撮影しました。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

スケジュールされたプロンプトが、OpenClaw のペルソナ経由で毎朝 1 枚のシーン画像（天気、タスク、日付、お気に入りの投稿または引用）を生成します。
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic の空き状況チェッカーと予約 CLI。空いているコートを二度と逃しません。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

メールから PDF を収集し、税理士向けに書類を準備します。毎月の経理を自動操縦に。
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

Netflix を見ながら Telegram 経由で個人サイト全体を再構築しました — Notion から Astro へ、18 件の投稿を移行し、DNS は Cloudflare へ。ノート PC は一度も開いていません。
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

求人情報を検索し、職務経歴書のキーワードと照合し、関連する機会をリンク付きで返します。JSearch API を使って 30 分で構築。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw が Jira に接続し、その場で新しいスキルを生成しました（ClawHub に存在する前）。
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

Todoist タスクを自動化し、OpenClaw に Telegram チャット内で直接スキルを生成させました。
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

ブラウザ自動化で TradingView にログインし、チャートのスクリーンショットを撮り、必要に応じてテクニカル分析を実行します。API は不要 — ブラウザ操作だけです。
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

会社の Slack チャンネルを監視し、有用な返信を行い、通知を Telegram に転送します。依頼されなくても、デプロイ済みアプリの本番バグを自律的に修正しました。
</Card>

</CardGroup>

## ナレッジとメモリ

個人またはチームのナレッジをインデックス化、検索、記憶、推論するシステム。

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

OpenClaw 経由で発音フィードバックと学習フローを提供する中国語学習エンジン。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

WhatsApp の完全なエクスポートを取り込み、1,000 件以上のボイスメモを文字起こしし、git ログと照合して、リンク付きの markdown レポートを出力します。
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

Qdrant と OpenAI または Ollama の埋め込みを使って、Karakeep ブックマークにベクトル検索を追加します。
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

セッションファイルをメモリに変換し、次に信念へ、さらに進化する自己モデルへ変換する独立したメモリマネージャー。
</Card>

</CardGroup>

## 音声と電話

音声優先の入口、電話ブリッジ、文字起こし中心のワークフロー。

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 音声アシスタントから OpenClaw HTTP へのブリッジ。エージェントとのほぼリアルタイムな通話。
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

OpenRouter 経由の多言語音声文字起こし（Gemini など）。ClawHub で利用できます。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## インフラストラクチャとデプロイ

OpenClaw を実行、拡張しやすくするパッケージング、デプロイ、統合。

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

SSH トンネルサポートと永続状態を備え、Home Assistant OS 上で動作する OpenClaw Gateway。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

自然言語で Home Assistant デバイスを制御し、自動化します。

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub の Home Assistant skill" />
</Card>

<Card title="Nix パッケージ化" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

再現可能なデプロイのための、必要なものが揃った nix 化済み OpenClaw 設定。
</Card>

<Card title="CalDAV カレンダー" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

khal と vdirsyncer を使用するカレンダー skill。セルフホスト型カレンダー連携。

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub の CalDAV calendar skill" />
</Card>

</CardGroup>

## ホームとハードウェア

OpenClaw の物理世界側: 家、センサー、カメラ、掃除機、その他のデバイス。

<CardGroup cols={2}>

<Card title="GoHome オートメーション" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

OpenClaw をインターフェイスとして使う Nix ネイティブなホームオートメーションと、Grafana ダッシュボード。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana ダッシュボード" />
</Card>

<Card title="Roborock 掃除機" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

自然な会話を通じて Roborock ロボット掃除機を制御します。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock ステータス" />
</Card>

</CardGroup>

## コミュニティプロジェクト

単一のワークフローを超えて、より広範なプロダクトやエコシステムへと発展したもの。

<CardGroup cols={2}>

<Card title="StarSwap マーケットプレイス" icon="star" href="https://star-swap.com/">
  **Community** • `marketplace` `astronomy` `webapp`

本格的な天文機材マーケットプレイス。OpenClaw エコシステムを使い、その周辺に構築されています。
</Card>

</CardGroup>

## プロジェクトを投稿する

<Steps>
  <Step title="共有する">
    [Discord の #self-promotion](https://discord.gg/clawd) または [@openclaw にポスト](https://x.com/openclaw) で投稿してください。
  </Step>
  <Step title="詳細を含める">
    何をするものかを説明し、リポジトリまたはデモへのリンクを添えて、スクリーンショットがあれば共有してください。
  </Step>
  <Step title="掲載される">
    優れたプロジェクトをこのページに追加します。
  </Step>
</Steps>

## 関連

- [はじめに](/ja-JP/start/getting-started)
- [OpenClaw](/ja-JP/start/openclaw)
