---
read_when:
    - 啟動新的 OpenClaw 代理工作階段
    - 啟用或稽核預設 Skills
summary: 預設 OpenClaw 代理指示與個人助理設定的 Skills 名冊
title: 預設 AGENTS.md
x-i18n:
    generated_at: "2026-06-27T19:58:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

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

3. 選用：如果你想使用個人助理技能清單，請用此檔案取代 AGENTS.md：

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

- 不要將目錄或祕密傾印到聊天中。
- 除非明確要求，否則不要執行破壞性命令。
- 變更設定或排程器之前（例如 crontab、systemd units、nginx configs 或 shell rc files），請先檢查現有狀態，並預設保留/合併。
- 不要向外部訊息介面傳送部分/串流回覆（僅傳送最終回覆）。

## 現有解決方案預檢

在提議或建置自訂系統、功能、工作流程、工具、整合或自動化之前，先簡要檢查是否已有足夠好用的開源專案、維護中的函式庫、既有 OpenClaw 外掛或免費平台能解決問題。適用時優先使用它們。只有在既有選項不適合、太昂貴、無人維護、不安全、不合規，或使用者明確要求自訂時，才建置自訂方案。除非使用者明確核准花費，否則避免推薦付費服務。保持輕量：這是預檢關卡，不是廣泛的研究任務。

## 工作階段開始（必要）

- 讀取 `SOUL.md`、`USER.md`，以及 `memory/` 中的今天+昨天。
- 存在時讀取 `MEMORY.md`。
- 在回覆前完成。

## 靈魂（必要）

- `SOUL.md` 定義身分、語氣與界線。保持其為最新。
- 如果你變更 `SOUL.md`，請告知使用者。
- 每個工作階段你都是全新的執行個體；連續性存在於這些檔案中。

## 共享空間（建議）

- 你不是使用者的代言人；在群組聊天或公開頻道中請小心。
- 不要分享私人資料、聯絡資訊或內部筆記。

## 記憶系統（建議）

- 每日記錄：`memory/YYYY-MM-DD.md`（需要時建立 `memory/`）。
- 長期記憶：`MEMORY.md` 用於持久的事實、偏好與決策。
- 小寫 `memory.md` 僅作為舊版修復輸入；不要刻意同時保留兩個根檔案。
- 工作階段開始時，存在時讀取今天 + 昨天 + `MEMORY.md`。
- 寫入記憶檔案前，請先讀取；只寫入具體更新，絕不寫入空白佔位符。
- 擷取：決策、偏好、限制、未完成事項。
- 除非明確要求，否則避免祕密。

## 工具與 Skills

- 工具存在於 Skills 中；需要時遵循各 Skills 的 `SKILL.md`。
- 將環境特定筆記保留在 `TOOLS.md`（Skills 筆記）。

## 備份提示（建議）

如果你將此工作區視為 Clawd 的「記憶」，請將它設為 git repo（理想上為私有），讓 `AGENTS.md` 和你的記憶檔案都有備份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 的作用

- 執行 WhatsApp 閘道 + 嵌入式 OpenClaw 代理，讓助理可以讀寫聊天、擷取脈絡，並透過主機 Mac 執行 Skills。
- macOS app 管理權限（螢幕錄製、通知、麥克風），並透過其 bundled binary 提供 `openclaw` 命令列介面。
- 直接聊天預設會折疊到代理的 `main` 工作階段；群組會保持隔離為 `agent:<agentId>:<channel>:group:<id>`（房間/頻道：`agent:<agentId>:<channel>:channel:<id>`）；心跳偵測會讓背景任務保持運作。

## 核心 Skills（在 Settings → Skills 中啟用）

- **mcporter** - 用於管理外部技能後端的工具伺服器執行階段/命令列介面。
- **Peekaboo** - 快速 macOS 螢幕截圖，並可選用 AI 視覺分析。
- **camsnap** - 從 RTSP/ONVIF 監視攝影機擷取影格、片段或動作警示。
- **oracle** - OpenAI-ready 代理命令列介面，具備工作階段重播與瀏覽器控制。
- **eightctl** - 從終端機控制你的睡眠。
- **imsg** - 傳送、讀取、串流 iMessage 與 SMS。
- **wacli** - WhatsApp 命令列介面：同步、搜尋、傳送。
- **discord** - Discord 動作：反應、貼圖、投票。使用 `user:<id>` 或 `channel:<id>` 目標（純數字 id 具有歧義）。
- **gog** - Google Suite 命令列介面：Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 終端機 Spotify 用戶端，用於搜尋/排隊/控制播放。
- **sag** - ElevenLabs 語音，具備 mac 風格 say 使用體驗；預設串流到喇叭。
- **Sonos CLI** - 從腳本控制 Sonos 喇叭（探索/狀態/播放/音量/群組）。
- **blucli** - 從腳本播放、群組化並自動化 BluOS 播放器。
- **OpenHue CLI** - Philips Hue 燈光控制，用於場景與自動化。
- **OpenAI Whisper** - 本機語音轉文字，用於快速聽寫與語音信箱逐字稿。
- **Gemini CLI** - 從終端機使用 Google Gemini 模型進行快速問答。
- **agent-tools** - 用於自動化與輔助腳本的實用工具包。

## 使用注意事項

- 腳本編寫優先使用 `openclaw` 命令列介面；mac app 會處理權限。
- 從 Skills 分頁執行安裝；如果 binary 已存在，它會隱藏按鈕。
- 保持心跳偵測啟用，讓助理能排程提醒、監控收件匣並觸發相機擷取。
- Canvas UI 會以全螢幕搭配原生覆蓋層執行。避免將關鍵控制項放在左上/右上/底部邊緣；在版面配置中加入明確 gutter，且不要依賴 safe-area insets。
- 對於瀏覽器驅動的驗證，使用 `openclaw browser`（tabs/status/screenshot）搭配 OpenClaw 管理的 Chrome profile。
- 對於 DOM 檢查，使用 `openclaw browser eval|query|dom|snapshot`（需要機器輸出時使用 `--json`/`--out`）。
- 對於互動，使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot refs；CSS selectors 請使用 `evaluate`）。

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [代理執行階段](/zh-TW/concepts/agent)
