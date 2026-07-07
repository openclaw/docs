---
description: Real-world OpenClaw projects from the community
read_when:
    - 尋找真實的 OpenClaw 使用範例
    - 更新社群專案亮點
summary: 由社群建置、由 OpenClaw 驅動的專案與整合
title: 展示
x-i18n:
    generated_at: "2026-07-06T21:51:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 64af6f1da52ebdccff82fe2cdb0f7a5f0cd57627b08ee796369e2933f47fbae4
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw 社群打造的專案：PR 審查迴圈、行動應用程式、居家自動化、語音系統、開發工具，以及記憶工作流程，皆以 Telegram、WhatsApp、Discord 和終端機上的聊天原生方式建置。

<Info>
**想被收錄嗎？** 在 [Discord 上的 #self-promotion](https://discord.gg/clawd) 分享你的專案，或在 [X 上標記 @openclaw](https://x.com/openclaw)。
</Info>

## Discord 最新動態

橫跨程式開發、開發工具、行動裝置，以及聊天原生產品建置的近期亮點。

<CardGroup cols={2}>

<Card title="Dropage 即時 HTML 部署" icon="cloud-arrow-up" href="https://clawhub.ai/jiantoucn/skills/dropage-deploy">
  **@jiantoucn** • `deploy` `hosting` `skill`

告訴你的代理程式「部署這個 HTML」，約一秒後取得公開 URL。頁面會在一小時後自動過期，無需伺服器、無需設定、無需註冊。
</Card>

<Card title="防詐騙 URL 檢查器" icon="shield-halved" href="https://clawhub.ai/phishguard-niki/anti-scam-guard">
  **@phishguard-niki** • `security` `phishing` `skill`

貼上任何 URL，即可取得判定結果。來自 38 個來源（PhishTank、OpenPhish、CERT.PL 等）的 250 萬個以上詐騙網域，在本機比對，因此瀏覽紀錄永不離開機器。
</Card>

<Card title="產品設計推理 Skills" icon="pen-ruler" href="https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog">
  **@monikazapisekstudio** • `product` `reasoning` `skills`

產品工作的三件套：[蘇格拉底對話](https://clawhub.ai/monikazapisekstudio/skills/socratic-dialog) 會在回答前交叉詰問問題，[Kano 模型策略師](https://clawhub.ai/monikazapisekstudio/skills/kano-model-strategist) 會整理哪些功能值得保留，[易讀代理程式輸出](https://clawhub.ai/monikazapisekstudio/skills/legible-agent-output) 會將代理程式輸出改寫成白話。
</Card>

<Card title="子代理程式的信箱代理" icon="inbox" href="https://clawhub.ai/albzhu/skills/miab-broker">
  **@albzhu** • `multi-agent` `async` `skill`

在子代理程式工作時，避免協調器閒置：以非同步回呼機制將結果送進信箱，而不是阻塞父代理程式。
</Card>

<Card title="低 RAM 機器的 lite-mode" icon="feather" href="https://clawhub.ai/skills/lite-mode">
  **@mirajmahmudul** • `performance` `skill`

讓 OpenClaw 在 2 至 4 GB 機器上仍可使用：檢查可用記憶體，並在機器開始交換前修剪重型功能。[GitHub 原始碼](https://github.com/mirajmahmudul/openclaw-lite-mode)。
</Card>

<Card title="tokenomics 成本追蹤器" icon="coins" href="https://github.com/ncz-os/tokenomics">
  **@ncz-os** • `devtools` `costs` `tokens`

由 NVIDIA 工程師打造、對 OpenClaw 提供一級支援的 Token 成本追蹤器：精確查看你的代理程式花費流向，按模型與工作階段細分。
</Card>

<Card title="Excalidraw 圖表產生器" icon="shapes" href="https://x.com/swiftlysingh/status/2009684853827281070">
  **@swiftlysingh** • `diagrams` `excalidraw` `devtools`

在聊天中描述圖表，即可取得以程式產生的 Excalidraw 草圖。
</Card>

<Card title="GA4 分析 Skill" icon="chart-column" href="https://x.com/jdrhyne/status/2012028725710192741">
  **@jdrhyne** • `analytics` `ga4` `skill`

讓 OpenClaw 建置自己的 Google Analytics 查詢工具，然後封裝並發布到 ClawHub。
</Card>

<Card title="ClawEval 模型排名" icon="ranking-star" href="https://github.com/AIgenteur/ClawEval">
  **@AIgenteur** • `evals` `models` `devtools`

跨 59 種代理程式角色對模型進行基準測試，以回答「我的 GPU 該用哪個 LLM？」。這是社群挑選本機模型的熱門選擇。
</Card>

<Card title="Music Craft" icon="music" href="https://clawhub.ai/luischarro/music-craft">
  **@luischarro** • `music` `generation` `skill`

供應商無關的歌曲生成：規劃曲目、架構歌詞，並修訂稀疏結果，而非一次性提示。包含具備 BPM、調性、結構與混搭控制的 [MiniMax 變體](https://clawhub.ai/luischarro/music-craft-minimax)。
</Card>

<Card title="PR 審查到 Telegram 回饋" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成變更並開啟 PR，OpenClaw 審查 diff，然後在 Telegram 回覆建議與清楚的合併判定。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR 審查回饋透過 Telegram 傳送" />
</Card>

<Card title="數分鐘內完成酒窖 Skill" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

要求「Robby」（@openclaw）製作一個本機酒窖 Skill。它會要求範例 CSV 匯出與儲存路徑，然後建置並測試該 Skill（範例中有 962 瓶）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 從 CSV 建置本機酒窖 Skill" />
</Card>

<Card title="Tesco 購物自動駕駛" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每週餐點規劃、常購品、預訂配送時段、確認訂單。無需 API，只靠瀏覽器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="透過聊天自動化 Tesco 購物" />
</Card>

<Card title="SNAG 截圖轉 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

用快速鍵擷取螢幕區域，Gemini 視覺處理，立即將 Markdown 放到剪貼簿。

  <img src="/assets/showcase/snag.png" alt="SNAG 截圖轉 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用於跨 Agents、Claude、Codex 和 OpenClaw 管理 Skills 與命令的桌面應用程式。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 應用程式" />
</Card>

<Card title="Telegram 語音訊息（papla.media）" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

包裝 papla.media TTS，並將結果作為 Telegram 語音訊息傳送（沒有惱人的自動播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="來自 TTS 的 Telegram 語音訊息輸出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

透過 Homebrew 安裝的輔助工具，可列出、檢查並監看本機 OpenAI Codex 工作階段（命令列介面 + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 印表機控制" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制並疑難排解 BambuLab 印表機：狀態、工作、相機、AMS、校準等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu 命令列介面 Skill" />
</Card>

<Card title="維也納交通（Wiener Linien）" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

維也納大眾運輸的即時發車、營運中斷、電梯狀態與路線規劃。

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub 上的 Wiener Linien Skill" />
</Card>

<Card title="ParentPay 學校餐點" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

透過 ParentPay 自動預訂英國學校餐點。使用滑鼠座標可靠地點擊表格儲存格。
</Card>

<Card title="R2 上傳（Send Me My Files）" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上傳到 Cloudflare R2/S3 並產生安全的預先簽署下載連結。適合遠端 OpenClaw 執行個體。

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub 上的 R2 上傳 Skill" />
</Card>

<Card title="透過 Telegram 建置 iOS 應用程式" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

完全透過 Telegram 聊天建置具備地圖與語音錄音的完整 iOS 應用程式，並準備好提交到 App Store 發布。
</Card>

<Card title="Oura Ring 健康助理" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

整合 Oura 戒指資料與行事曆、約診和健身房課表的個人 AI 健康助理。

  <img src="/assets/showcase/oura-health.png" alt="Oura 戒指健康助理" />
</Card>

<Card title="Kev 的夢幻團隊（14+ 個代理程式）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

在同一個閘道下有 14+ 個代理程式，由 Opus 4.5 協調器委派給 Codex 工作者。請參閱[技術文章](https://github.com/adam91holt/orchestrated-ai-articles)與用於代理程式沙箱化的 [Clawdspace](https://github.com/adam91holt/clawdspace)。
</Card>

<Card title="Linear 命令列介面" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

整合代理式工作流程（Claude Code、OpenClaw）的 Linear 命令列介面。從終端機管理議題、專案與工作流程。
</Card>

<Card title="Beeper 命令列介面" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

透過 Beeper Desktop 讀取、傳送和封存訊息。使用 Beeper 本機 MCP API，讓代理程式能在同一處管理你所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自動化與工作流程

排程、瀏覽器控制、支援迴圈，以及產品中「幫我把任務做完」的一面。

<CardGroup cols={2}>

<Card title="Winix 空氣清淨機控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 發現並確認空氣清淨機控制，然後由 OpenClaw 接手管理房間空氣品質。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="透過 OpenClaw 控制 Winix 空氣清淨機" />
</Card>

<Card title="漂亮天空相機拍攝" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋頂相機觸發：請 OpenClaw 在天空看起來漂亮時拍一張天空照片。它設計了一個 Skill 並完成拍攝。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw 擷取的屋頂相機天空快照" />
</Card>

<Card title="視覺化晨間簡報場景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

排程提示每天早上透過 OpenClaw 人格產生一張場景圖片（天氣、任務、日期、最愛貼文或引言）。
</Card>

<Card title="Padel 球場預訂" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 空位檢查器加上預訂命令列介面。再也不錯過開放球場。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截圖" />
</Card>

<Card title="會計資料收件" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

從電子郵件收集 PDF，為稅務顧問準備文件。每月會計自動駕駛。
</Card>

<Card title="沙發馬鈴薯開發模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一邊看 Netflix，一邊透過 Telegram 重建整個個人網站，從 Notion 到 Astro，遷移 18 篇文章，DNS 轉到 Cloudflare。完全沒打開筆電。
</Card>

<Card title="求職代理程式" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜尋職缺，與履歷關鍵字比對，並回傳附連結的相關機會。使用 JSearch API 在 30 分鐘內建成。
</Card>

<Card title="Jira Skill 建置器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 連上 Jira，然後即時產生了一個新技能（在它出現在 ClawHub 之前）。
</Card>

<Card title="透過 Telegram 使用的 Todoist 技能" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自動化 Todoist 任務，並讓 OpenClaw 直接在 Telegram 聊天中產生技能。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

透過瀏覽器自動化登入 TradingView、擷取圖表截圖，並依需求進行技術分析。不需要 API，只要瀏覽器控制。
</Card>

<Card title="汽車議價（省下 $4,200）" icon="car-side" href="https://x.com/astuyve/status/2014147784098681217">
  **@astuyve** • `negotiation` `email` `automation`

讓 OpenClaw 自行處理汽車經銷商：它負責來回議價，並把價格砍低了 $4,200。
</Card>

<Card title="航班報到自動駕駛" icon="plane-departure" href="https://x.com/armanddp/status/2008767951340794245">
  **@armanddp** • `travel` `email` `automation`

在電子郵件中找出下一班航班、完成線上報到，並選擇靠窗座位，不需要航空公司 App。
</Card>

<Card title="保險理賠申請" icon="file-signature" href="https://x.com/avi_press/status/2013066316467560521">
  **@avi_press** • `automation` `insurance` `browser`

自主提交保險理賠申請，並安排後續預約。
</Card>

<Card title="Idealista 房地產技能" icon="building" href="https://x.com/quifago/status/2012458753786859872">
  **@quifago** • `real-estate` `api` `skill`

用於房產查詢與估價的 Idealista API 命令列介面，封裝成技能後，代理就能在聊天中找房。
</Card>

<Card title="園藝業務後台" icon="seedling" href="https://news.ycombinator.com/item?id=47783940">
  **@mjsweet** • `automation` `email` `invoicing`

監看 Gmail 中的工單、分析透過 Telegram 傳來的房產照片、撰寫多頁 LaTeX 報價 PDF，並透過 Xero 開立發票。
</Card>

<Card title="Slack 自動支援" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

監看公司 Slack 頻道、提供有幫助的回覆，並將通知轉發到 Telegram。它還在未被要求的情況下，自主修復了已部署 App 中的生產環境錯誤。
</Card>

</CardGroup>

## 知識與記憶

能索引、搜尋、記住並推理個人或團隊知識的系統。

<CardGroup cols={2}>

<Card title="xuezh 中文學習" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

透過 OpenClaw 提供發音回饋與學習流程的中文學習引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 發音回饋" />
</Card>

<Card title="X 貼文分析管線" icon="hashtag" href="https://x.com/andrewjiang/status/2008388427180630155">
  **@andrewjiang** • `analysis` `x` `pipeline`

抓取 100 個頂尖 X 帳號的 400 萬則貼文，並將它們轉成可查詢的分析管線。
</Card>

<Card title="檢驗結果匯入 Notion" icon="flask" href="https://x.com/danpeguine/status/2013388700479058068">
  **@danpeguine** • `health` `notion` `organization`

將多年血液檢驗結果整理成結構化的 Notion 資料庫。
</Card>

<Card title="Obsidian 第二大腦" icon="book" href="https://notesbylex.com/openclaw-the-missing-piece-for-obsidians-second-brain">
  **@lexandstuff** • `obsidian` `whatsapp` `memory`

在 WhatsApp 上日常使用的助理，所有記憶都以 markdown 儲存在版本控管的 Obsidian 保險庫中：熱量與運動追蹤、待辦清單、生活行政事項。
</Card>

<Card title="家族歷史機器人" icon="people-roof" href="https://news.ycombinator.com/item?id=47783940">
  **@brtkwr** • `telegram` `memory` `family`

常駐於家族 Telegram 群組聊天中，記錄 50 多位親戚的故事，並提出有根據的追問，還會以尼泊爾語回覆母語使用者。
</Card>

<Card title="WhatsApp 記憶保險庫" icon="vault">
  **社群** • `memory` `transcription` `indexing`

匯入完整 WhatsApp 匯出資料、轉錄 1k+ 則語音備忘，與 git 日誌交叉檢查，並輸出帶連結的 markdown 報告。
</Card>

<Card title="Karakeep 語意搜尋" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 搭配 OpenAI 或 Ollama 嵌入，為 Karakeep 書籤加入向量搜尋。
</Card>

<Card title="Inside-Out-2 記憶" icon="brain">
  **社群** • `memory` `beliefs` `self-model`

獨立的記憶管理器，會將工作階段檔案轉成記憶，再轉成信念，最後形成持續演化的自我模型。
</Card>

</CardGroup>

## 語音與電話

以語音為優先的入口、電話橋接，以及大量使用轉錄的工作流程。

<CardGroup cols={2}>

<Card title="Pebble Ring 一鍵語音" icon="ring" href="https://x.com/thekitze/status/2014765279650189578">
  **@thekitze** • `voice` `wearable` `hardware`

在 Pebble Ring 上輕點一下，即可開始與 OpenClaw 進行語音對話，從穿戴裝置存取代理。
</Card>

<Card title="創作者媒體工作室" icon="clapperboard" href="https://x.com/cedric_chee/status/2014608153393168425">
  **@cedric_chee** • `media` `tts` `transcription`

聊天中的完整媒體工作室：TTS、轉錄，以及連接到 Codex 5.2 和 MiniMax 的瀏覽器自動化。
</Card>

<Card title="動作按鈕對講機" icon="walkie-talkie" href="https://x.com/i/status/2072766510053888497">
  **@buddyhadry** • `voice` `ios` `mobile`

iPhone 動作按鈕接上 OpenClaw：按下、說話，代理就會像對講機一樣回話。
</Card>

<Card title="Clawdia 電話橋接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 語音助理到 OpenClaw 的 HTTP 橋接。與你的代理進行近乎即時的電話通話。
</Card>

<Card title="OpenRouter 轉錄" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

透過 OpenRouter（Gemini 等）進行多語音訊轉錄。可在 ClawHub 上取得。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub 上的 OpenRouter 轉錄技能" />
</Card>

</CardGroup>

## 基礎架構與部署

讓 OpenClaw 更容易執行與擴充的封裝、部署與整合。

<CardGroup cols={2}>

<Card title="Home Assistant 附加元件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

在 Home Assistant OS 上執行的 OpenClaw 閘道，支援 SSH 通道與持久狀態。
</Card>

<Card title="Home Assistant 技能" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

透過自然語言控制並自動化 Home Assistant 裝置。

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub 上的 Home Assistant 技能" />
</Card>

<Card title="macOS 選單列管理器" icon="desktop" href="https://x.com/MagiMetal/status/2009424267801485362">
  **@MagiMetal** • `macos` `swift` `ui`

原生 Swift 選單列 App，顯示代理狀態並提供快速控制。
</Card>

<Card title="Nix 封裝" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

內建完整配置的 nixified OpenClaw 設定，用於可重現部署。
</Card>

<Card title="CalDAV 行事曆" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的行事曆技能。自架行事曆整合。

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub 上的 CalDAV 行事曆技能" />
</Card>

</CardGroup>

## 家庭與硬體

OpenClaw 連結實體世界的一面：住家、感測器、攝影機、吸塵器與其他裝置。

<CardGroup cols={2}>

<Card title="自製 HomePod 技能" icon="volume-high" href="https://x.com/localghost/status/2014763987683225685">
  **@localghost** • `homepod` `discovery` `skill`

OpenClaw 找到本機網路上的 HomePod，並自行撰寫控制它們的技能。
</Card>

<Card title="$35 全像方塊介面" icon="cube" href="https://x.com/andrewjiang/status/2013140793649734032">
  **@andrewjiang** • `hardware` `display` `fun`

一個便宜的全像方塊，作為桌面上代理的實體面孔。
</Card>

<Card title="GoHome 自動化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

Nix 原生家庭自動化，以 OpenClaw 作為介面，並搭配 Grafana 儀表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 儀表板" />
</Card>

<Card title="Roborock 吸塵器" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

透過自然對話控制你的 Roborock 掃地機器人。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 狀態" />
</Card>

</CardGroup>

## 社群專案

從單一工作流程成長為更廣泛產品或生態系的事物。

<CardGroup cols={2}>

<Card title="StarSwap 市集" icon="star" href="https://star-swap.com/">
  **社群** • `marketplace` `astronomy` `webapp`

完整的天文器材市集。以 OpenClaw 生態系打造，並圍繞其運作。
</Card>

<Card title="Clinch 代理議價協定" icon="handshake" href="https://clawhub.ai/publicstringapps/clinch">
  **@publicstringapps** • `protocol` `p2p` `skill`

開放的代理對代理議價：你的代理會與其他節點討價還價、安排時程與服務協議，並以密碼學方式簽署結果；你只需要核准或拒絕。
</Card>

</CardGroup>

## 提交你的專案

<Steps>
  <Step title="分享它">
    在 [Discord 的 #self-promotion](https://discord.gg/clawd) 發文，或 [發文標註 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="包含詳細資訊">
    告訴我們它能做什麼、連結到 repo 或示範，並在有截圖時分享截圖。
  </Step>
  <Step title="獲得精選">
    我們會把出色的專案加入這個頁面。
  </Step>
</Steps>

## 相關

- [開始使用](/zh-TW/start/getting-started)
- [OpenClaw](/zh-TW/start/openclaw)
- [openclaw.ai 上的完整 X 展示](https://openclaw.ai/showcase/)
