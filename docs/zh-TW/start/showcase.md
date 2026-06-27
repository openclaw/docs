---
description: Real-world OpenClaw projects from the community
read_when:
    - 尋找真實的 OpenClaw 使用範例
    - 更新社群專案精選
summary: 由社群打造、由 OpenClaw 驅動的專案與整合
title: 展示案例
x-i18n:
    generated_at: "2026-06-27T20:03:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 999f89403c1d022e795c0017e5aa7543a4a021ba98cf601b37ce2835136a86a1
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw 專案不是玩具示範。人們正從他們已經使用的通道交付 PR 審查迴圈、行動應用程式、居家自動化、語音系統、開發工具，以及大量使用記憶的工作流程——在 Telegram、WhatsApp、Discord 和終端機上進行原生聊天式建置；不必等待 API，就能為訂位、購物和支援提供真正的自動化；並且與印表機、吸塵器、攝影機和居家系統進行實體世界整合。

<Info>
**想被收錄嗎？** 在 [Discord 的 #self-promotion](https://discord.gg/clawd) 分享你的專案，或在 [X 上標記 @openclaw](https://x.com/openclaw)。
</Info>

## Discord 最新精選

橫跨程式設計、開發工具、行動裝置與原生聊天式產品建置的近期亮點。

<CardGroup cols={2}>

<Card title="PR Review to Telegram Feedback" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成變更、開啟 PR，OpenClaw 審查差異，並在 Telegram 中回覆建議與明確的合併判定。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR review feedback delivered in Telegram" />
</Card>

<Card title="Wine Cellar Skill in Minutes" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

要求「Robby」（@openclaw）製作本地酒窖技能。它會要求提供範例 CSV 匯出與儲存路徑，接著建置並測試該技能（範例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw building a local wine cellar skill from CSV" />
</Card>

<Card title="Tesco Shop Autopilot" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每週餐點計畫、常買品項、預約配送時段、確認訂單。沒有 API，只有瀏覽器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="Tesco shop automation via chat" />
</Card>

<Card title="SNAG screenshot-to-Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

用快速鍵選取螢幕區域、Gemini 視覺辨識，立即將 Markdown 放入剪貼簿。

  <img src="/assets/showcase/snag.png" alt="SNAG screenshot-to-markdown tool" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用來跨 Agents、Claude、Codex 和 OpenClaw 管理 Skills 與命令的桌面應用程式。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI app" />
</Card>

<Card title="Telegram voice notes (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

包裝 papla.media TTS，並將結果作為 Telegram 語音訊息傳送（沒有惱人的自動播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="Telegram voice note output from TTS" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

透過 Homebrew 安裝的輔助工具，可列出、檢查與監看本機 OpenAI Codex 工作階段（命令列介面 + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="CodexMonitor on ClawHub" />
</Card>

<Card title="Bambu 3D Printer Control" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制並疑難排解 BambuLab 印表機：狀態、工作、攝影機、AMS、校正等。

  <img src="/assets/showcase/bambu-cli.png" alt="Bambu CLI skill on ClawHub" />
</Card>

<Card title="Vienna transport (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

為維也納大眾運輸提供即時發車資訊、服務中斷、電梯狀態與路線規劃。

  <img src="/assets/showcase/wienerlinien.png" alt="Wiener Linien skill on ClawHub" />
</Card>

<Card title="ParentPay school meals" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

透過 ParentPay 自動預訂英國學校餐點。使用滑鼠座標可靠地點擊表格儲存格。
</Card>

<Card title="R2 upload (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上傳到 Cloudflare R2/S3，並產生安全的預簽署下載連結。適用於遠端 OpenClaw 執行個體。

  <img src="/assets/showcase/r2-upload.png" alt="R2 upload skill on ClawHub" />
</Card>

<Card title="iOS app via Telegram" icon="mobile">
  **@coard** • `ios` `xcode` `testflight`

完全透過 Telegram 聊天建置了完整的 iOS 應用程式，包含地圖與錄音功能，並部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="iOS app on TestFlight" />
</Card>

<Card title="Oura Ring health assistant" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

個人 AI 健康助理，將 Oura 戒指資料與行事曆、約會和健身房時程整合。

  <img src="/assets/showcase/oura-health.png" alt="Oura ring health assistant" />
</Card>

<Card title="Kev's Dream Team (14+ agents)" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

在單一閘道下執行 14 個以上的代理，由 Opus 4.5 協調器委派給 Codex worker。請參閱 [技術文章](https://github.com/adam91holt/orchestrated-ai-articles) 以及用於代理沙盒化的 [Clawdspace](https://github.com/adam91holt/clawdspace)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

用於 Linear 的命令列介面，能與代理式工作流程（Claude Code、OpenClaw）整合。從終端機管理議題、專案與工作流程。
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

透過 Beeper Desktop 讀取、傳送與封存訊息。使用 Beeper 本機 MCP API，讓代理能在同一處管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自動化與工作流程

排程、瀏覽器控制、支援迴圈，以及產品中「幫我把任務完成」的一面。

<CardGroup cols={2}>

<Card title="Winix air purifier control" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 發現並確認了空氣清淨機控制項，接著由 OpenClaw 接手管理房間空氣品質。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="Winix air purifier control via OpenClaw" />
</Card>

<Card title="Pretty sky camera shots" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋頂攝影機觸發：每當天空看起來很美，就請 OpenClaw 拍一張天空照片。它設計了一個技能並完成拍攝。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="Roof camera sky snapshot captured by OpenClaw" />
</Card>

<Card title="Visual morning briefing scene" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

排程提示每天早上透過 OpenClaw 人格產生一張場景圖片（天氣、任務、日期、最愛貼文或引言）。
</Card>

<Card title="Padel court booking" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 空位檢查器加上預訂命令列介面。再也不會錯過開放的球場。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli screenshot" />
</Card>

<Card title="Accounting intake" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

從電子郵件收集 PDF，為稅務顧問準備文件。每月會計工作自動完成。
</Card>

<Card title="Couch potato dev mode" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一邊看 Netflix，一邊透過 Telegram 重建整個個人網站——從 Notion 到 Astro、遷移 18 篇文章、DNS 切到 Cloudflare。從未打開筆電。
</Card>

<Card title="Job search agent" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜尋職缺清單，與履歷關鍵字比對，並回傳含連結的相關機會。使用 JSearch API 在 30 分鐘內建成。
</Card>

<Card title="Jira skill builder" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 連接到 Jira，接著即時產生了一個新技能（在它出現在 ClawHub 之前）。
</Card>

<Card title="Todoist skill via Telegram" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自動化 Todoist 任務，並讓 OpenClaw 直接在 Telegram 聊天中產生該技能。
</Card>

<Card title="TradingView analysis" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

透過瀏覽器自動化登入 TradingView、擷取圖表截圖，並按需執行技術分析。不需要 API——只要瀏覽器控制即可。
</Card>

<Card title="Slack auto-support" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

監看公司 Slack 頻道、提供有幫助的回覆，並將通知轉發到 Telegram。自主修復了已部署應用程式中的生產環境錯誤，而且沒有人要求它這麼做。
</Card>

</CardGroup>

## 知識與記憶

可索引、搜尋、記住並推理個人或團隊知識的系統。

<CardGroup cols={2}>

<Card title="xuezh Chinese learning" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

透過 OpenClaw 提供發音回饋與學習流程的中文學習引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh pronunciation feedback" />
</Card>

<Card title="WhatsApp memory vault" icon="vault">
  **Community** • `memory` `transcription` `indexing`

匯入完整 WhatsApp 匯出資料、轉錄 1k+ 則語音訊息、與 git 記錄交叉檢查，並輸出帶連結的 markdown 報告。
</Card>

<Card title="Karakeep semantic search" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加上 OpenAI 或 Ollama 嵌入，為 Karakeep 書籤新增向量搜尋。
</Card>

<Card title="Inside-Out-2 memory" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

獨立記憶管理器，將工作階段檔案轉為記憶，再轉為信念，最後形成不斷演進的自我模型。
</Card>

</CardGroup>

## 語音與電話

語音優先的入口、電話橋接，以及大量使用轉錄的工作流程。

<CardGroup cols={2}>

<Card title="Clawdia phone bridge" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

連接 Vapi 語音助理與 OpenClaw HTTP 的橋接器。與你的代理進行近乎即時的電話通話。
</Card>

<Card title="OpenRouter transcription" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

透過 OpenRouter（Gemini 等）進行多語音訊轉錄。可在 ClawHub 取得。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="OpenRouter transcription skill on ClawHub" />
</Card>

</CardGroup>

## 基礎架構與部署

讓 OpenClaw 更容易執行與擴充的封裝、部署與整合。

<CardGroup cols={2}>

<Card title="Home Assistant add-on" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

在 Home Assistant OS 上執行的 OpenClaw 閘道，支援 SSH 通道並具備持久狀態。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

透過自然語言控制並自動化 Home Assistant 裝置。

  <img src="/assets/showcase/homeassistant.png" alt="Home Assistant skill on ClawHub" />
</Card>

<Card title="Nix packaging" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

內建完整功能的 Nix 化 OpenClaw 設定，用於可重現部署。
</Card>

<Card title="CalDAV calendar" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的行事曆技能。自行託管的行事曆整合。

  <img src="/assets/showcase/caldav-calendar.png" alt="CalDAV calendar skill on ClawHub" />
</Card>

</CardGroup>

## 家庭與硬體

OpenClaw 的實體世界面向：住家、感測器、攝影機、吸塵器與其他裝置。

<CardGroup cols={2}>

<Card title="GoHome automation" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 作為介面的 Nix 原生居家自動化，並搭配 Grafana 儀表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana dashboard" />
</Card>

<Card title="Roborock vacuum" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

透過自然對話控制你的 Roborock 掃地機器人。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock status" />
</Card>

</CardGroup>

## 社群專案

從單一工作流程發展為更廣泛產品或生態系的成果。

<CardGroup cols={2}>

<Card title="StarSwap marketplace" icon="star" href="https://star-swap.com/">
  **社群** • `marketplace` `astronomy` `webapp`

完整的天文設備市集。使用 OpenClaw 生態系建置，並圍繞其打造。
</Card>

</CardGroup>

## 提交你的專案

<Steps>
  <Step title="Share it">
    在 [Discord 的 #self-promotion](https://discord.gg/clawd) 發文，或[在 X 上標記 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="Include details">
    告訴我們它的用途，連結到 repo 或示範，若有截圖也請分享。
  </Step>
  <Step title="Get featured">
    我們會將出色的專案加入此頁面。
  </Step>
</Steps>

## 相關

- [開始使用](/zh-TW/start/getting-started)
- [OpenClaw](/zh-TW/start/openclaw)
