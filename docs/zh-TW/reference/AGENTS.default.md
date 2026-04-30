---
read_when:
    - 開始新的 OpenClaw 代理程式工作階段
    - 啟用或稽核預設 Skills
summary: 個人助理設定的預設 OpenClaw 代理指示與 Skills 名冊
title: 預設 AGENTS.md
x-i18n:
    generated_at: "2026-04-30T03:35:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - OpenClaw 個人助理（預設）

## 首次執行（建議）

OpenClaw 會為代理使用專用的工作區目錄。預設值：`~/.openclaw/workspace`（可透過 `agents.defaults.workspace` 設定）。

1. 建立工作區（如果尚不存在）：

```bash
mkdir -p ~/.openclaw/workspace
```

2. 將預設工作區範本複製到工作區：

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. 選用：如果你想使用個人助理 Skills 名單，請用此檔案取代 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 選用：透過設定 `agents.defaults.workspace` 選擇不同工作區（支援 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全預設值

- 不要將目錄或秘密資訊傾倒到聊天中。
- 除非明確要求，否則不要執行破壞性命令。
- 不要向外部訊息介面傳送部分／串流回覆（僅傳送最終回覆）。

## 工作階段開始（必要）

- 讀取 `SOUL.md`、`USER.md`，以及 `memory/` 中的今天＋昨天。
- 若存在 `MEMORY.md`，請讀取它。
- 在回覆前完成。

## Soul（必要）

- `SOUL.md` 定義身分、語氣和界線。保持其最新狀態。
- 如果你變更 `SOUL.md`，請告知使用者。
- 每個工作階段你都是全新的執行個體；連續性存在於這些檔案中。

## 共享空間（建議）

- 你不是使用者的聲音；在群組聊天或公開頻道中務必謹慎。
- 不要分享私人資料、聯絡資訊或內部筆記。

## 記憶系統（建議）

- 每日日誌：`memory/YYYY-MM-DD.md`（如有需要，建立 `memory/`）。
- 長期記憶：`MEMORY.md`，用於持久保存事實、偏好和決策。
- 小寫 `memory.md` 僅為舊版修復輸入；不要有意同時保留兩個根目錄檔案。
- 工作階段開始時，讀取今天＋昨天，以及存在時的 `MEMORY.md`。
- 記錄：決策、偏好、限制、未完成事項。
- 除非明確要求，否則避免記錄秘密資訊。

## 工具與 Skills

- 工具存在於 Skills 中；需要時遵循各 Skills 的 `SKILL.md`。
- 將環境特定筆記保存在 `TOOLS.md`（Skills 的筆記）。

## 備份提示（建議）

如果你將此工作區視為 Clawd 的「記憶」，請將它做成 git repo（理想情況下為私有），讓 `AGENTS.md` 和你的記憶檔案能被備份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 的功能

- 執行 WhatsApp Gateway + Pi 程式碼代理，讓助理可以讀寫聊天、擷取內容脈絡，並透過主機 Mac 執行 Skills。
- macOS app 管理權限（螢幕錄製、通知、麥克風），並透過其隨附的二進位檔提供 `openclaw` CLI。
- 直接聊天預設會折疊到代理的 `main` 工作階段；群組會保持隔離為 `agent:<agentId>:<channel>:group:<id>`（房間／頻道：`agent:<agentId>:<channel>:channel:<id>`）；Heartbeats 會讓背景任務保持運作。

## 核心 Skills（在 Settings → Skills 中啟用）

- **mcporter** — 用於管理外部技能後端的工具伺服器執行環境／CLI。
- **Peekaboo** — 快速 macOS 螢幕截圖，並可選用 AI 視覺分析。
- **camsnap** — 從 RTSP/ONVIF 安全攝影機擷取影格、片段或動作警示。
- **oracle** — 支援工作階段重播和瀏覽器控制的 OpenAI-ready 代理 CLI。
- **eightctl** — 從終端機控制你的睡眠。
- **imsg** — 傳送、讀取、串流 iMessage 與 SMS。
- **wacli** — WhatsApp CLI：同步、搜尋、傳送。
- **discord** — Discord 動作：反應、貼圖、投票。使用 `user:<id>` 或 `channel:<id>` 目標（裸數字 id 具有歧義）。
- **gog** — Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** — 終端機 Spotify 用戶端，用於搜尋／佇列／控制播放。
- **sag** — ElevenLabs 語音，具 mac 風格的 say 使用體驗；預設串流到喇叭。
- **Sonos CLI** — 從指令碼控制 Sonos 喇叭（探索／狀態／播放／音量／群組）。
- **blucli** — 從指令碼播放、群組化並自動化 BluOS 播放器。
- **OpenHue CLI** — Philips Hue 燈光控制，用於場景和自動化。
- **OpenAI Whisper** — 本機語音轉文字，用於快速聽寫和語音信箱轉錄。
- **Gemini CLI** — 從終端機使用 Google Gemini 模型進行快速問答。
- **agent-tools** — 用於自動化和輔助指令碼的實用工具包。

## 使用筆記

- 編寫指令碼時優先使用 `openclaw` CLI；mac app 會處理權限。
- 從 Skills 分頁執行安裝；如果二進位檔已存在，它會隱藏按鈕。
- 保持 Heartbeats 啟用，讓助理能排程提醒、監控收件匣，並觸發攝影機擷取。
- Canvas UI 以全螢幕搭配原生覆蓋層執行。避免將關鍵控制項放在左上、右上或底部邊緣；在版面中加入明確留白，不要依賴安全區域內距。
- 對於瀏覽器驅動的驗證，使用 `openclaw browser`（分頁／狀態／螢幕截圖）搭配 OpenClaw 管理的 Chrome 設定檔。
- 對於 DOM 檢查，使用 `openclaw browser eval|query|dom|snapshot`（需要機器輸出時使用 `--json`/`--out`）。
- 對於互動，使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot refs；CSS 選擇器請使用 `evaluate`）。

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [代理執行環境](/zh-TW/concepts/agent)
