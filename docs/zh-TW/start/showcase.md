---
description: Real-world OpenClaw projects from the community
read_when:
    - 尋找真實的 OpenClaw 使用範例
    - 更新社群專案亮點
summary: 由社群建置並由 OpenClaw 驅動的專案與整合
title: 展示案例
x-i18n:
    generated_at: "2026-07-02T08:00:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0530aae85db5414b61c968dcc290178b2b33a540c7f86d556e9bad69cf374fb7
    source_path: start/showcase.md
    workflow: 16
---

OpenClaw 專案不是玩具示範。人們正在從他們已經使用的頻道交付 PR 審查迴圈、行動應用程式、家庭自動化、語音系統、開發工具，以及記憶密集型工作流程 — 在 Telegram、WhatsApp、Discord 與終端機上進行聊天原生建置；無需等待 API，即可為預訂、購物與支援提供真正的自動化；並與印表機、吸塵器、攝影機與居家系統整合實體世界。

<Info>
**想被精選展示嗎？** 在 [Discord 的 #self-promotion](https://discord.gg/clawd) 分享你的專案，或在 [X 上標註 @openclaw](https://x.com/openclaw)。
</Info>

## Discord 最新精選

近期在程式開發、開發工具、行動裝置與聊天原生產品建置方面的亮點。

<CardGroup cols={2}>

<Card title="PR 審查到 Telegram 回饋" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成變更、開啟 PR，OpenClaw 審查差異，並在 Telegram 中回覆建議與清楚的合併判定。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="OpenClaw PR 審查回饋已傳送到 Telegram" />
</Card>

<Card title="數分鐘建立酒窖技能" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

向「Robby」(@openclaw) 要求建立本機酒窖技能。它會要求範例 CSV 匯出與儲存路徑，接著建置並測試該技能（範例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="OpenClaw 從 CSV 建立本機酒窖技能" />
</Card>

<Card title="Tesco 購物自動駕駛" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每週餐點計畫、常買品、預訂配送時段、確認訂單。沒有 API，只有瀏覽器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="透過聊天進行 Tesco 購物自動化" />
</Card>

<Card title="SNAG 截圖轉 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

用快速鍵擷取螢幕區域，透過 Gemini 視覺處理，立即把 Markdown 放進剪貼簿。

  <img src="/assets/showcase/snag.png" alt="SNAG 截圖轉 Markdown 工具" />
</Card>

<Card title="代理程式 UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

用於跨 Agents、Claude、Codex 與 OpenClaw 管理 Skills 和命令的桌面應用程式。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 應用程式" />
</Card>

<Card title="Telegram 語音訊息 (papla.media)" icon="microphone" href="https://papla.media/docs">
  **Community** • `voice` `tts` `telegram`

包裝 papla.media TTS，並將結果作為 Telegram 語音訊息傳送（沒有惱人的自動播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="來自 TTS 的 Telegram 語音訊息輸出" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.ai/odrobnik/skills/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

透過 Homebrew 安裝的輔助工具，用來列出、檢查並監看本機 OpenAI Codex 工作階段（命令列介面 + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 印表機控制" icon="print" href="https://clawhub.ai/tobiasbischoff/skills/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制並疑難排解 BambuLab 印表機：狀態、工作、攝影機、AMS、校準等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI 技能" />
</Card>

<Card title="維也納交通 (Wiener Linien)" icon="train" href="https://clawhub.ai/hjanuschka/skills/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

提供維也納大眾運輸的即時發車資訊、事故中斷、電梯狀態與路線規劃。

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub 上的 Wiener Linien 技能" />
</Card>

<Card title="ParentPay 學校餐點" icon="utensils">
  **@George5562** • `automation` `browser` `parenting`

透過 ParentPay 自動預訂英國學校餐點。使用滑鼠座標可靠地點擊表格儲存格。
</Card>

<Card title="R2 上傳 (Send Me My Files)" icon="cloud-arrow-up" href="https://clawhub.ai/julianengel/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上傳到 Cloudflare R2/S3，並產生安全的預簽下載連結。適合遠端 OpenClaw 執行個體使用。

  <img src="/assets/showcase/r2-upload.png" alt="ClawHub 上的 R2 上傳技能" />
</Card>

<Card title="透過 Telegram 建置 iOS 應用程式" icon="mobile">
  **@coard** • `ios` `xcode` `app-store`

完全透過 Telegram 聊天建置了一個完整的 iOS 應用程式，包含地圖與語音錄音，並準備好發佈到 App Store。
</Card>

<Card title="Oura Ring 健康助理" icon="heart-pulse">
  **@AS** • `health` `oura` `calendar`

個人 AI 健康助理，將 Oura Ring 資料與行事曆、約診和健身房時程整合。

  <img src="/assets/showcase/oura-health.png" alt="Oura Ring 健康助理" />
</Card>

<Card title="Kev 的夢幻團隊（14+ 個代理程式）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration`

在一個閘道下管理 14+ 個代理程式，由 Opus 4.5 協調器委派給 Codex 工作代理程式。請參閱[技術文章](https://github.com/adam91holt/orchestrated-ai-articles)與 [Clawdspace](https://github.com/adam91holt/clawdspace) 了解代理程式沙盒化。
</Card>

<Card title="Linear 命令列介面" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli`

整合代理式工作流程（Claude Code、OpenClaw）的 Linear 命令列介面。從終端機管理議題、專案與工作流程。
</Card>

<Card title="Beeper 命令列介面" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli`

透過 Beeper Desktop 讀取、傳送與封存訊息。使用 Beeper 本機 MCP API，讓代理程式可以在一處管理你所有的聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 自動化與工作流程

排程、瀏覽器控制、支援迴圈，以及產品中「直接幫我完成任務」的一面。

<CardGroup cols={2}>

<Card title="Winix 空氣清淨機控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 探索並確認清淨機控制項，接著由 OpenClaw 接手管理房間空氣品質。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="透過 OpenClaw 控制 Winix 空氣清淨機" />
</Card>

<Card title="漂亮天空攝影機照片" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill`

由屋頂攝影機觸發：只要天空看起來漂亮，就要求 OpenClaw 拍一張天空照片。它設計了一個技能並完成拍攝。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="OpenClaw 擷取的屋頂攝影機天空快照" />
</Card>

<Card title="視覺化晨間簡報場景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `telegram`

透過 OpenClaw 人格，排程提示每天早上產生一張場景圖片（天氣、任務、日期、最喜歡的貼文或引言）。
</Card>

<Card title="Padel 球場預訂" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`

Playtomic 空位檢查器加上預訂命令列介面。再也不錯過空球場。

  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截圖" />
</Card>

<Card title="會計資料收件" icon="file-invoice-dollar">
  **Community** • `automation` `email` `pdf`

從電子郵件收集 PDF，為稅務顧問準備文件。每月會計自動處理。
</Card>

<Card title="沙發馬鈴薯開發模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `migration` `astro`

一邊看 Netflix，一邊透過 Telegram 重建整個個人網站 — 從 Notion 到 Astro、遷移 18 篇文章、DNS 轉到 Cloudflare。從未打開筆電。
</Card>

<Card title="求職代理程式" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜尋職缺，根據履歷關鍵字比對，並回傳附連結的相關機會。使用 JSearch API 在 30 分鐘內建置完成。
</Card>

<Card title="Jira 技能建置器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `jira` `skill` `devtools`

OpenClaw 連接到 Jira，然後即時產生新技能（在它出現在 ClawHub 之前）。
</Card>

<Card title="透過 Telegram 建立 Todoist 技能" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `todoist` `skill` `telegram`

自動化 Todoist 任務，並讓 OpenClaw 直接在 Telegram 聊天中產生該技能。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

透過瀏覽器自動化登入 TradingView、擷取圖表截圖，並依需求執行技術分析。不需要 API — 只要瀏覽器控制。
</Card>

<Card title="Slack 自動支援" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

監看公司 Slack 頻道、提供有幫助的回覆，並將通知轉送到 Telegram。未被要求的情況下，自主修復已部署應用程式中的生產環境錯誤。
</Card>

</CardGroup>

## 知識與記憶

索引、搜尋、記住並推理個人或團隊知識的系統。

<CardGroup cols={2}>

<Card title="xuezh 中文學習" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`

透過 OpenClaw 提供發音回饋與學習流程的中文學習引擎。

  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 發音回饋" />
</Card>

<Card title="WhatsApp 記憶保管庫" icon="vault">
  **Community** • `memory` `transcription` `indexing`

匯入完整 WhatsApp 匯出、轉錄 1k+ 則語音訊息、與 git 日誌交叉檢查，並輸出連結式 Markdown 報告。
</Card>

<Card title="Karakeep 語意搜尋" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`

使用 Qdrant 加上 OpenAI 或 Ollama 嵌入，為 Karakeep 書籤新增向量搜尋。
</Card>

<Card title="Inside-Out-2 記憶" icon="brain">
  **Community** • `memory` `beliefs` `self-model`

獨立的記憶管理器，將工作階段檔案轉為記憶，再轉為信念，最後轉為持續演化的自我模型。
</Card>

</CardGroup>

## 語音與電話

以語音優先的進入點、電話橋接，以及轉錄密集型工作流程。

<CardGroup cols={2}>

<Card title="Clawdia 電話橋接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`

Vapi 語音助理到 OpenClaw HTTP 的橋接。與你的代理程式進行近乎即時的電話通話。
</Card>

<Card title="OpenRouter 轉錄" icon="microphone" href="https://clawhub.ai/obviyus/skills/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

透過 OpenRouter（Gemini 等）進行多語音訊轉錄。可在 ClawHub 使用。

  <img src="/assets/showcase/openrouter-transcribe.png" alt="ClawHub 上的 OpenRouter 轉錄技能" />
</Card>

</CardGroup>

## 基礎設施與部署

讓 OpenClaw 更容易執行與擴充的封裝、部署與整合。

<CardGroup cols={2}>

<Card title="Home Assistant 附加元件" icon="home" href="https://github.com/ngutman/openclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`

在 Home Assistant OS 上執行的 OpenClaw 閘道，支援 SSH 通道與持久狀態。
</Card>

<Card title="Home Assistant skill" icon="toggle-on" href="https://clawhub.ai/homeofe/skills/openclaw-homeassistant">
  **@homeofe** • `homeassistant` `skill` `automation`

透過自然語言控制並自動化 Home Assistant 裝置。

  <img src="/assets/showcase/homeassistant.png" alt="ClawHub 上的 Home Assistant skill" />
</Card>

<Card title="Nix 封裝" icon="snowflake" href="https://github.com/openclaw/nix-openclaw">
  **@openclaw** • `nix` `packaging` `deployment`

功能齊備的 nix 化 OpenClaw 設定，可用於可重現部署。
</Card>

<Card title="CalDAV 行事曆" icon="calendar" href="https://clawhub.ai/asleep123/skills/caldav-calendar">
  **@asleep123** • `calendar` `caldav` `skill`

使用 khal 和 vdirsyncer 的行事曆 skill。自架行事曆整合。

  <img src="/assets/showcase/caldav-calendar.png" alt="ClawHub 上的 CalDAV 行事曆 skill" />
</Card>

</CardGroup>

## 居家與硬體

OpenClaw 的實體世界面向：住家、感測器、攝影機、吸塵器，以及其他裝置。

<CardGroup cols={2}>

<Card title="GoHome 自動化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`

以 OpenClaw 作為介面的 Nix 原生居家自動化，並附有 Grafana 儀表板。

  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 儀表板" />
</Card>

<Card title="Roborock 吸塵器" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`

透過自然對話控制你的 Roborock 機器人吸塵器。

  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 狀態" />
</Card>

</CardGroup>

## 社群專案

從單一工作流程成長為更廣泛產品或生態系的事物。

<CardGroup cols={2}>

<Card title="StarSwap 市集" icon="star" href="https://star-swap.com/">
  **社群** • `marketplace` `astronomy` `webapp`

完整的天文設備市集。以 OpenClaw 生態系建構，並圍繞其打造。
</Card>

</CardGroup>

## 提交你的專案

<Steps>
  <Step title="分享它">
    在 [Discord 的 #self-promotion](https://discord.gg/clawd) 發文，或[發推文標記 @openclaw](https://x.com/openclaw)。
  </Step>
  <Step title="包含詳細資訊">
    告訴我們它的用途、連結到 repo 或 demo，若有螢幕截圖也請分享。
  </Step>
  <Step title="獲得精選">
    我們會把出色的專案加入此頁面。
  </Step>
</Steps>

## 相關

- [開始使用](/zh-TW/start/getting-started)
- [OpenClaw](/zh-TW/start/openclaw)
