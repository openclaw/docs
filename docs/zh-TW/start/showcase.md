---
description: Real-world OpenClaw projects from the community
read_when:
    - 尋找真實的 OpenClaw 使用範例
    - 更新社群專案精選內容
summary: 由社群打造、以 OpenClaw 驅動的專案與整合方案
title: 作品展示
x-i18n:
    generated_at: "2026-07-11T21:51:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

社群打造的 OpenClaw 專案：PR 審查循環、行動應用程式、居家自動化、語音系統、開發工具與記憶工作流程，並以 Telegram、WhatsApp、Discord 和終端機上的聊天原生方式建構。

<Info>
**想在這裡亮相嗎？** 請到 [Discord 的 #self-promotion](https://discord.gg/clawd) 分享你的專案，或[在 X 上標記 @openclaw](https://x.com/openclaw)。
</Info>

## Discord 最新精選

近期在程式設計、開發工具、行動應用與聊天原生產品開發方面的傑出作品。

<CardGroup cols={2}>

<Card title="Dropage instant HTML deploy" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

告訴你的代理程式「部署這份 HTML」，大約一秒後就能取得公開 URL。頁面會在一小時後自動失效，不需要伺服器、設定或註冊。
</Card>

<Card title="Anti-scam URL checker" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

貼上任意 URL，即可取得判定結果。它整合來自 38 個來源（PhishTank、OpenPhish、CERT.PL 等）的 250 萬個以上詐騙網域，並在本機進行比對，因此瀏覽記錄絕不會離開你的裝置。
</Card>

<Card title="Product-design reasoning skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

專為產品工作打造的三件組：[蘇格拉底式對話](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog)會在回答前交叉檢視問題，[Kano 模型策略師](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist)會分類哪些功能值得保留，而[易讀的代理程式輸出](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output)則會將代理程式輸出改寫成淺白語言。
</Card>

<Card title="Mailbox broker for sub-agents" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

避免協調器在子代理程式工作時閒置：這是一套非同步回呼機制，結果會送達信箱，而不會阻塞父代理程式。
</Card>

<Card title="lite-mode for low-RAM machines" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

讓 OpenClaw 在 2 至 4 GB 記憶體的機器上仍可正常使用：檢查可用記憶體，並在系統開始使用交換空間前精簡高負載功能。[GitHub 原始碼](https://github.com/mirajmahmudul/openclaw-lite-mode)。
</Card>

<Card title="tokenomics cost tracker" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

由 NVIDIA 工程師打造、原生支援 OpenClaw 的權杖成本追蹤器：可按模型與工作階段，精確查看代理程式的費用花在何處。
</Card>

<Card title="Excalidraw diagram generator" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

在聊天中描述圖表，即可取得以程式方式產生的 Excalidraw 草圖。
</Card>

<Card title="GA4 analytics skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

讓 OpenClaw 建立自己的 Google Analytics 查詢工具，接著將其封裝並發布至 ClawHub。
</Card>

<Card title="ClawEval model rankings" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

針對 59 種代理程式角色評測模型，以回答「我的 GPU 適合使用哪個大型語言模型？」這個問題。它是社群挑選本機模型時的熱門工具。
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

不受供應商限制的歌曲生成工具：先規劃曲目與歌詞結構，再修訂內容不足的結果，而非只使用一次性提示。另提供可控制 BPM、調性、結構與混搭的 [MiniMax 版本](https://clawhub.ai/luischarro/music-craft-minimax)。
</Card>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成變更並建立 PR，OpenClaw 接著審查差異，透過 Telegram 回覆建議，並提供明確的合併判定。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

請「Robby」（@openclaw）建立本機酒窖 Skill。它會要求提供 CSV 匯出範例與儲存路徑，然後建立並測試該 Skill（範例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

規劃每週餐點、加入常購商品、預約配送時段並確認訂單。不需要 API，只需控制瀏覽器。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

使用快捷鍵擷取螢幕區域，交由 Gemini 視覺模型處理，立即在剪貼簿中取得 Markdown。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用於跨 Agents、Claude、Codex 與 OpenClaw 管理 Skills 和命令的桌面應用程式。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **社群** • `voice` `tts` `telegram`

封裝 papla.media TTS，並將結果以 Telegram 語音訊息傳送（不會有惱人的自動播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

透過 Homebrew 安裝的輔助工具，可列出、檢查及監看本機 OpenAI Codex 工作階段（命令列介面 + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制 BambuLab 印表機並排除故障：檢視狀態、工作、相機、AMS、校準等功能。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供維也納大眾運輸的即時發車資訊、營運中斷、電梯狀態與路線規劃。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

透過 ParentPay 自動預訂英國學校餐點。使用滑鼠座標，以可靠地點擊表格儲存格。
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上傳至 Cloudflare R2/S3，並產生安全的預先簽署下載連結。適合遠端 OpenClaw 執行個體使用。

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

完全透過 Telegram 聊天建立一套具備地圖與錄音功能的完整 iOS 應用程式，並準備好發布至 App Store。
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

個人 AI 健康助理，將 Oura Ring 資料與行事曆、預約及健身房排程整合。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

單一閘道下有超過 14 個代理程式，由 Opus 4.5 協調器將工作委派給 Codex 工作代理程式。請參閱[技術說明](https://github.com/adam91holt/orchestrated-ai-articles)，以及用於代理程式沙箱化的 [Clawdspace](https://github.com/adam91holt/clawdspace)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

可與代理式工作流程（Claude Code、OpenClaw）整合的 Linear 命令列介面。直接從終端機管理議題、專案與工作流程。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

透過 Beeper Desktop 讀取、傳送及封存訊息。使用 Beeper 本機 MCP API，讓代理程式能在單一位置管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自動化與工作流程

涵蓋排程、瀏覽器控制、支援循環，以及產品中「直接替我完成工作」的部分。

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 探索並確認空氣清淨機的控制方式，接著由 OpenClaw 接手管理室內空氣品質。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋頂攝影機觸發：要求 OpenClaw 在天空看起來漂亮時拍攝照片。它設計了一個 Skill，並完成拍攝。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

排程提示會透過 OpenClaw 角色設定，每天早晨產生一張情境圖片，內容包含天氣、任務、日期，以及喜愛的貼文或引言。
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 空位檢查器與預訂命令列介面。再也不會錯過空出的球場。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **社群** • `automation` `email` `pdf`

從電子郵件收集 PDF，並為稅務顧問準備文件。讓每月帳務自動運作。
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一邊看 Netflix，一邊完全透過 Telegram 重建整個個人網站：從 Notion 遷移至 Astro、移轉 18 篇文章，並將 DNS 改至 Cloudflare。全程未開啟筆記型電腦。
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜尋職缺、比對履歷關鍵字，並回傳附有連結的相關機會。使用 JSearch API，30 分鐘內完成建置。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 連接至 Jira，接著即時產生了一個新 skill（當時 ClawHub 上還沒有）。
</Card>

<Card title="透過 Telegram 使用 Todoist skill" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自動處理 Todoist 任務，並讓 OpenClaw 直接在 Telegram 聊天中產生該 skill。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

透過瀏覽器自動化登入 TradingView、擷取圖表畫面，並按需執行技術分析。無需 API，只需控制瀏覽器。
</Card>

<Card title="汽車議價（省下 4,200 美元）" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

讓 OpenClaw 自行與汽車經銷商交涉：它處理多輪往返議價，最終將價格降低了 4,200 美元。
</Card>

<Card title="航班報到自動駕駛" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

從電子郵件中找出下一趟航班、完成線上報到並選擇靠窗座位，完全不需要航空公司的應用程式。
</Card>

<Card title="提出保險理賠申請" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

自主提出保險理賠申請，並安排後續預約。
</Card>

<Card title="Idealista 房地產 skill" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

用於房產查詢與估價的 Idealista API 命令列介面，封裝成 skill，讓代理程式能在聊天中尋找房屋。
</Card>

<Card title="園藝事業後勤管理" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

監看 Gmail 中的工作單、分析透過 Telegram 傳送的房產照片、撰寫多頁 LaTeX 報價 PDF，並透過 Xero 開立發票。
</Card>

<Card title="Slack 自動支援" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

監看公司的 Slack 頻道、提供實用回覆，並將通知轉傳至 Telegram。它甚至在未被要求的情況下，自主修正了已部署應用程式中的正式環境錯誤。
</Card>

</CardGroup>

## 知識與記憶

用於建立索引、搜尋、記憶個人或團隊知識，並據此推理的系統。

<CardGroup cols={2}>

<Card title="xuezh 中文學習" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

透過 OpenClaw 提供發音回饋與學習流程的中文學習引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 發音回饋" />
</Card>

<Card title="X 貼文分析管線" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

擷取 100 個熱門 X 帳號的 400 萬篇貼文，並將其轉換為可查詢的分析管線。
</Card>

<Card title="將檢驗結果匯入 Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

將多年的血液檢驗結果整理成結構化的 Notion 資料庫。
</Card>

<Card title="Obsidian 第二大腦" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

WhatsApp 上的日常助理，所有記憶均以 Markdown 格式儲存在受版本控制的 Obsidian 儲存庫中：追蹤熱量與運動、管理待辦清單及處理生活行政事務。
</Card>

<Card title="家族史機器人" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

常駐於家族 Telegram 群組聊天中，記錄超過 50 位親屬的故事，並提出切合脈絡的後續問題；對母語使用者則以尼泊爾語回覆。
</Card>

<Card title="WhatsApp 記憶庫" icon="vault">
  **社群** • `memory` `transcription` `indexing`

匯入完整的 WhatsApp 匯出資料、轉錄超過 1,000 則語音訊息、與 git 紀錄交叉核對，並輸出含連結的 Markdown 報告。
</Card>

<Card title="Karakeep 語意搜尋" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 搭配 OpenAI 或 Ollama 嵌入，為 Karakeep 書籤加入向量搜尋功能。
</Card>

<Card title="腦筋急轉彎 2 記憶系統" icon="brain">
  **社群** • `memory` `beliefs` `self-model`

獨立的記憶管理器，將工作階段檔案轉化為記憶，再形成信念，最終建立持續演進的自我模型。
</Card>

</CardGroup>

## 語音與電話

以語音為優先的入口、電話橋接，以及大量使用轉錄的工作流程。

<CardGroup cols={2}>

<Card title="Pebble Ring 一鍵語音" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

只需輕觸 Pebble Ring 一次，即可與 OpenClaw 開始語音對話，透過穿戴式裝置存取代理程式。
</Card>

<Card title="創作者媒體工作室" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

聊天中的完整媒體工作室：整合 TTS、轉錄與瀏覽器自動化，並連接至 Codex 5.2 和 MiniMax。
</Card>

<Card title="Action Button 對講機" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

將 iPhone Action Button 連接至 OpenClaw：按下按鈕、開始說話，代理程式便會像對講機一樣回應。
</Card>

<Card title="Clawdia 電話橋接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

將 Vapi 語音助理連接至 OpenClaw HTTP 的橋接工具。可與代理程式進行近乎即時的電話通話。
</Card>

<Card title="OpenRouter 轉錄" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

透過 OpenRouter（Gemini 等）進行多語言音訊轉錄。可於 ClawHub 取得。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub 上的 OpenRouter 轉錄 skill" />
</Card>

</CardGroup>

## 基礎架構與部署

讓 OpenClaw 更容易執行及擴充的封裝、部署與整合工具。

<CardGroup cols={2}>

<Card title="Home Assistant 附加元件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

在 Home Assistant OS 上執行的 OpenClaw 閘道，支援 SSH 通道與持久化狀態。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

透過自然語言控制並自動化 Home Assistant 裝置。

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub 上的 Home Assistant skill" />
</Card>

<Card title="macOS 選單列管理器" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

原生 Swift 選單列應用程式，可顯示代理程式狀態並提供快速控制項。
</Card>

<Card title="Nix 封裝" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

功能齊備的 Nix 化 OpenClaw 設定，可實現可重現的部署。
</Card>

<Card title="CalDAV 行事曆" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 與 vdirsyncer 的行事曆 skill。自架式行事曆整合。

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub 上的 CalDAV 行事曆 skill" />
</Card>

</CardGroup>

## 居家與硬體

OpenClaw 與實體世界的連結：住宅、感測器、攝影機、吸塵器及其他裝置。

<CardGroup cols={2}>

<Card title="自行建立的 HomePod skill" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw 找到區域網路上的 HomePod，並自行編寫了一個 skill 來控制它們。
</Card>

<Card title="35 美元的全息立方體介面" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

以平價的全息立方體作為代理程式擺在桌上的實體面孔。
</Card>

<Card title="GoHome 自動化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 作為介面的 Nix 原生居家自動化系統，並搭配 Grafana 儀表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 儀表板" />
</Card>

<Card title="Roborock 吸塵器" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

透過自然對話控制 Roborock 掃地機器人。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 狀態" />
</Card>

</CardGroup>

## 社群專案

從單一工作流程發展為更廣泛產品或生態系的專案。

<CardGroup cols={2}>

<Card title="StarSwap 市集" icon="star" href="https://star-swap.com/">
  **社群** • `marketplace` `astronomy` `webapp`

完整的天文器材市集，以 OpenClaw 生態系為基礎並圍繞其建置。
</Card>

<Card title="Clinch 代理程式議價協定" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

開放式代理程式對代理程式議價：你的代理程式會與其他節點協商交易、時程與服務協議，並以密碼學方式簽署結果；你只需核准或拒絕。
</Card>

</CardGroup>

## 提交你的專案

<Steps>
  <Step title="分享專案">
    在 [Discord 的 #self-promotion](https://discord.gg/clawd) 發文，或[在 X 上提及 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="附上詳細資訊">
    告訴我們專案的功能、提供程式碼儲存庫或示範連結，並在有截圖時一併分享。
  </Step>
  <Step title="獲得精選">
    我們會將表現出色的專案加入此頁面。
  </Step>
</Steps>

## 相關內容

- [開始使用](/zh-TW/start/getting-started)
- [OpenClaw](/zh-TW/start/openclaw)
- [openclaw.ai 上的完整 X 精選展示](https://openclaw.ai/showcase/)
