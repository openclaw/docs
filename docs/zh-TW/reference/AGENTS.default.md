---
read_when:
    - 啟動新的 OpenClaw 代理工作階段
    - 啟用或稽核預設 Skills
summary: 預設 OpenClaw 代理指令與個人助理設定的 Skills 名冊
title: 預設 AGENTS.md
x-i18n:
    generated_at: "2026-07-05T11:40:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 首次執行（建議）

OpenClaw 代理會使用工作區目錄。預設值：`~/.openclaw/workspace`（可透過 `agents.defaults.workspace` 設定，支援 `~`）。

1. 建立工作區：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 將預設工作區範本複製到其中：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 選用：使用此檔案的個人助理技能名冊，而不是通用範本：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 選用：指向不同的工作區：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全預設值

- 不要將目錄或秘密傾印到聊天中。
- 除非明確要求，否則不要執行破壞性命令。
- 在變更設定或排程器（crontab、systemd units、nginx configs、shell rc files）之前，請先檢查現有狀態，並預設保留/合併。
- 不要向外部訊息介面傳送部分/串流回覆（僅傳送最終回覆）。

## 既有解決方案預檢

在提議或建置自訂系統、功能、工作流程、工具、整合或自動化之前，請檢查是否已有開源專案、維護中的函式庫、既有 OpenClaw 外掛，或免費平台已足以解決問題。合適時優先採用這些方案。只有在既有選項不適用、太昂貴、無人維護、不安全、不合規，或使用者明確要求自訂時，才建置自訂方案。除非使用者明確核准支出，否則避免推薦付費服務。保持輕量，作為預檢閘門，而不是研究任務。

## 工作階段開始（必要）

- 回應前先讀取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天與昨天的內容。
- 若存在 `MEMORY.md`，請讀取它。

## 靈魂（必要）

- `SOUL.md` 定義身分、語氣與界限。保持它最新。
- 如果你變更 `SOUL.md`，請告知使用者。
- 每個工作階段中你都是全新的實例；連續性存在於這些檔案中。

## 共享空間（建議）

- 你不是使用者的聲音；在群組聊天或公開頻道中要謹慎。
- 不要分享私人資料、聯絡資訊或內部筆記。

## 記憶系統（建議）

- 每日日誌：`memory/YYYY-MM-DD.md`（必要時建立 `memory/`）。
- 長期記憶：`MEMORY.md` 用於持久事實、偏好與決策。
- 小寫的 `memory.md` 僅作為舊版修復輸入；不要刻意同時保留兩個根目錄檔案。
- 工作階段開始時，讀取今天 + 昨天 + 存在時的 `MEMORY.md`。
- 寫入記憶檔案前，先讀取它們；只寫入具體更新，絕不寫入空白佔位。
- 擷取：決策、偏好、限制、未完成事項。
- 除非明確要求，否則避免秘密。

## 工具與技能

- 工具存在於 Skills 中；需要時遵循每個 Skills 的 `SKILL.md`。
- 將環境特定筆記保存在 `TOOLS.md`（供 Skills 使用的筆記）。

## 備份提示（建議）

將此工作區視為助理的記憶：把它做成 git 儲存庫（最好是私有），讓 `AGENTS.md` 和記憶檔案有備份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Optional: add a private remote + push
```

## OpenClaw 的功能

- 執行訊息頻道閘道（WhatsApp、Telegram、Discord、Signal、iMessage、Slack 等）加上嵌入式代理，讓助理可以讀寫聊天、擷取脈絡，並透過主機執行 Skills。
- macOS 應用程式管理權限（螢幕錄製、通知、麥克風），並透過其隨附的二進位檔公開 `openclaw` 命令列介面。
- 直接聊天預設會收合到代理的 `main` 工作階段；群組和頻道/聊天室會取得自己的工作階段鍵。確切的鍵格式請參閱[頻道路由](/zh-TW/channels/channel-routing)。心跳偵測會讓背景工作保持執行。

## 核心 Skills（在設定 → Skills 中啟用）

個人助理工作區的範例名冊；可換成適合你設定的任何 Skills。

- **mcporter** - 用於管理外部 Skills 後端的工具伺服器執行階段/命令列介面。
- **Peekaboo** - 快速 macOS 螢幕截圖，並可選擇 AI 視覺分析。
- **camsnap** - 從 RTSP/ONVIF 安全攝影機擷取影格、片段或動作警示。
- **oracle** - 支援 OpenAI 的代理命令列介面，具備工作階段重播與瀏覽器控制。
- **eightctl** - 從終端機控制你的睡眠。
- **imsg** - 傳送、讀取、串流 iMessage 與 SMS。
- **wacli** - WhatsApp 命令列介面：同步、搜尋、傳送。
- **discord** - Discord 動作：反應、貼圖、投票。使用 `user:<id>` 或 `channel:<id>` 目標（裸數字 ID 具有歧義）。
- **gog** - Google Suite 命令列介面：Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 終端機 Spotify 用戶端，可搜尋/佇列/控制播放。
- **sag** - ElevenLabs 語音，具備 mac 風格 say 使用者體驗；預設串流到喇叭。
- **Sonos CLI** - 從腳本控制 Sonos 喇叭（探索/狀態/播放/音量/群組）。
- **blucli** - 從腳本播放、群組和自動化 BluOS 播放器。
- **OpenHue CLI** - Philips Hue 燈光控制，用於場景和自動化。
- **OpenAI Whisper** - 本機語音轉文字，用於快速聽寫與語音信箱逐字稿。
- **Gemini CLI** - 從終端機使用 Google Gemini 模型進行快速問答。
- **agent-tools** - 自動化與輔助腳本的實用工具包。

## 使用注意事項

- 腳本編寫優先使用 `openclaw` 命令列介面；桌面應用程式會處理權限。
- 從 Skills 分頁執行安裝；一旦必要的二進位檔已存在，安裝按鈕就會隱藏。
- 保持心跳偵測啟用，讓助理可以排程提醒、監控收件匣，並觸發攝影機擷取。
- Canvas 使用者介面以全螢幕搭配原生覆蓋層執行。避免將關鍵控制項放在左上/右上/底部邊緣；請加入明確的版面溝槽，而不是依賴安全區域內距。
- 對於瀏覽器驅動的驗證，使用 `openclaw browser` 命令列介面（隨附的 `browser` 外掛），並搭配 OpenClaw 管理的 Chrome/Brave/Edge/Chromium 設定檔。
- 管理：`status`、`doctor [--deep]`、`start [--headless]`、`stop`、`tabs`、`tab [new|select|close]`、`open <url>`、`focus <id>`、`close <id>`。
- 檢查：`screenshot [--full-page|--ref|--labels]`、`snapshot [--format ai|aria|--interactive|--efficient]`、`console`、`errors`、`requests`、`pdf`、`responsebody`。
- 動作：`navigate`、`click <ref>`、`type <ref> <text>`、`press`、`hover`、`drag`、`select`、`upload`、`download`、`fill`、`dialog`、`wait`、`evaluate --fn <js>`、`highlight`。動作需要來自 `snapshot` 的 `ref`（動作不接受 CSS 選擇器）；需要 `document.querySelector` 風格定位時，請使用 `evaluate`。
- 在任何檢查命令上加入 `--json` 以取得機器可讀輸出。

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [代理執行階段](/zh-TW/concepts/agent)
- [頻道路由](/zh-TW/channels/channel-routing)
