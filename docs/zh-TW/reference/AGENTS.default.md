---
read_when:
    - 啟動新的 OpenClaw 代理程式工作階段
    - 啟用或稽核預設 Skills
summary: 個人助理設定的預設 OpenClaw 代理程式指示與 Skills 清單
title: 預設 AGENTS.md
x-i18n:
    generated_at: "2026-05-06T02:57:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ecfafd0bee8b18f5787a0b8e273ce281c40c7d2d5754f15daa1f2b7cc7ecad0
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## 首次執行（建議）

OpenClaw 會為代理程式使用專用的工作區目錄。預設值：`~/.openclaw/workspace`（可透過 `agents.defaults.workspace` 設定）。

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

3. 選用：如果你想要個人助理技能清單，請用此檔案取代 AGENTS.md：

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. 選用：透過設定 `agents.defaults.workspace` 選擇不同的工作區（支援 `~`）：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## 安全預設值

- 不要將目錄或秘密資訊傾印到聊天中。
- 除非明確要求，否則不要執行破壞性指令。
- 不要將部分／串流回覆傳送到外部訊息介面（只傳送最終回覆）。

## 工作階段開始（必要）

- 讀取 `SOUL.md`、`USER.md`，以及 `memory/` 中今天和昨天的內容。
- 若存在，讀取 `MEMORY.md`。
- 在回覆前完成。

## Soul（必要）

- `SOUL.md` 定義身分、語氣與界線。保持其最新狀態。
- 如果你變更 `SOUL.md`，請告知使用者。
- 每個工作階段你都是全新的執行個體；連續性存在於這些檔案中。

## 共享空間（建議）

- 你不是使用者的代言人；在群組聊天或公開頻道中要謹慎。
- 不要分享私人資料、聯絡資訊或內部筆記。

## 記憶系統（建議）

- 每日紀錄：`memory/YYYY-MM-DD.md`（如有需要，建立 `memory/`）。
- 長期記憶：`MEMORY.md`，用於持久保存事實、偏好與決策。
- 小寫的 `memory.md` 只是舊版修復輸入；不要刻意同時保留兩個根目錄檔案。
- 工作階段開始時，讀取今天 + 昨天 + `MEMORY.md`（若存在）。
- 擷取：決策、偏好、限制、未完成事項。
- 避免秘密資訊，除非明確要求。

## 工具與技能

- 工具存在於 Skills 中；需要時請遵循每個技能的 `SKILL.md`。
- 將環境特定筆記保留在 `TOOLS.md`（Skills 筆記）中。

## 備份提示（建議）

如果你將此工作區視為 Clawd 的「記憶」，請將它做成 git repo（理想情況為私人），讓 `AGENTS.md` 和你的記憶檔案有備份。

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## OpenClaw 的功能

- 執行 WhatsApp Gateway + Pi 程式撰寫代理程式，讓助理可透過主機 Mac 讀寫聊天、擷取情境，並執行技能。
- macOS app 管理權限（螢幕錄製、通知、麥克風），並透過其內建二進位檔提供 `openclaw` CLI。
- 直接聊天預設會摺疊到代理程式的 `main` 工作階段；群組會維持隔離為 `agent:<agentId>:<channel>:group:<id>`（聊天室／頻道：`agent:<agentId>:<channel>:channel:<id>`）；Heartbeats 會讓背景工作保持存活。

## 核心 Skills（在設定 → Skills 中啟用）

- **mcporter** - 用於管理外部技能後端的工具伺服器 runtime/CLI。
- **Peekaboo** - 快速 macOS 螢幕截圖，並可選用 AI 視覺分析。
- **camsnap** - 從 RTSP/ONVIF 安全攝影機擷取影格、片段或動作警報。
- **oracle** - 支援工作階段重播與瀏覽器控制的 OpenAI-ready 代理程式 CLI。
- **eightctl** - 從終端機控制你的睡眠。
- **imsg** - 傳送、讀取、串流 iMessage 與 SMS。
- **wacli** - WhatsApp CLI：同步、搜尋、傳送。
- **discord** - Discord 動作：反應、貼圖、投票。使用 `user:<id>` 或 `channel:<id>` 目標（裸數字 ID 具有歧義）。
- **gog** - Google Suite CLI：Gmail、Calendar、Drive、Contacts。
- **spotify-player** - 終端機 Spotify 用戶端，用於搜尋／排入佇列／控制播放。
- **sag** - ElevenLabs 語音，具備 mac 風格的 say UX；預設串流到喇叭。
- **Sonos CLI** - 從腳本控制 Sonos 喇叭（探索／狀態／播放／音量／群組）。
- **blucli** - 從腳本播放、群組化並自動化 BluOS 播放器。
- **OpenHue CLI** - 用於場景與自動化的 Philips Hue 照明控制。
- **OpenAI Whisper** - 本機語音轉文字，用於快速聽寫與語音信箱轉錄。
- **Gemini CLI** - 從終端機使用 Google Gemini 模型進行快速問答。
- **agent-tools** - 用於自動化與輔助腳本的實用工具組。

## 使用注意事項

- 編寫腳本時優先使用 `openclaw` CLI；mac app 會處理權限。
- 從 Skills 分頁執行安裝；如果二進位檔已存在，它會隱藏按鈕。
- 保持 Heartbeats 啟用，讓助理可以排程提醒、監控收件匣，並觸發攝影機擷取。
- Canvas UI 以全螢幕搭配原生覆疊執行。避免將關鍵控制項放在左上／右上／底部邊緣；在版面配置中加入明確的邊距，且不要依賴 safe-area insets。
- 對於瀏覽器驅動的驗證，請使用 `openclaw browser`（tabs/status/screenshot），搭配 OpenClaw 管理的 Chrome 設定檔。
- 對於 DOM 檢查，請使用 `openclaw browser eval|query|dom|snapshot`（需要機器輸出時使用 `--json`/`--out`）。
- 對於互動，請使用 `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run`（click/type 需要 snapshot refs；CSS selectors 請使用 `evaluate`）。

## 相關

- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [代理程式 runtime](/zh-TW/concepts/agent)
