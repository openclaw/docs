---
read_when:
    - 變更代理執行階段、工作區啟動程序或工作階段行為
summary: 代理執行階段、工作區合約與工作階段啟動程序
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-05-04T02:22:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 執行**單一嵌入式代理執行階段**：每個
Gateway 一個代理程序，並有自己的工作區、啟動檔案與工作階段儲存區。本頁
涵蓋該執行階段契約：工作區必須包含什麼、哪些檔案會被
注入，以及工作階段如何依據它啟動。

## 工作區（必填）

OpenClaw 使用單一代理工作區目錄（`agents.defaults.workspace`）作為代理在工具與脈絡中的**唯一**工作目錄（`cwd`）。

建議：使用 `openclaw setup` 在缺少時建立 `~/.openclaw/openclaw.json`，並初始化工作區檔案。

完整工作區配置 + 備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

如果啟用 `agents.defaults.sandbox`，非主要工作階段可以使用
`agents.defaults.sandbox.workspaceRoot` 下的每工作階段工作區覆寫此設定（請參閱
[Gateway 設定](/zh-TW/gateway/configuration)）。

## 啟動檔案（已注入）

在 `agents.defaults.workspace` 內，OpenClaw 預期有以下可由使用者編輯的檔案：

- `AGENTS.md` — 操作指示 +「記憶」
- `SOUL.md` — 人格、界線、語氣
- `TOOLS.md` — 使用者維護的工具備註（例如 `imsg`、`sag`、慣例）
- `BOOTSTRAP.md` — 一次性的首次執行儀式（完成後刪除）
- `IDENTITY.md` — 代理名稱/氛圍/emoji
- `USER.md` — 使用者個人資料 + 偏好的稱呼

在新工作階段的第一輪中，OpenClaw 會將這些檔案的內容注入 system prompt 的 Project Context。

空白檔案會被略過。大型檔案會被修剪並以標記截斷，讓 prompt 保持精簡（請閱讀該檔案以取得完整內容）。

如果檔案缺失，OpenClaw 會注入一行「缺少檔案」標記（而 `openclaw setup` 會建立安全的預設範本）。

`BOOTSTRAP.md` 只會為**全新的工作區**建立（不存在任何其他啟動檔案）。當它仍待處理時，OpenClaw 會將它保留在 Project Context 中，並為初始儀式加入 system-prompt 啟動指引，而不是將其複製到使用者訊息中。如果你在完成儀式後刪除它，後續重新啟動時不應再次建立。

若要完全停用啟動檔案建立（用於預先植入的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 與相關系統工具）一律可用，
但受工具政策約束。`apply_patch` 是選用項目，並由
`tools.exec.applyPatch` 閘控。`TOOLS.md` **不會**控制哪些工具存在；它是
關於你希望工具如何被使用的指引。

## Skills

OpenClaw 會從這些位置載入 Skills（優先順序由高到低）：

- 工作區：`<workspace>/skills`
- 專案代理 Skills：`<workspace>/.agents/skills`
- 個人代理 Skills：`~/.agents/skills`
- 受管理/本機：`~/.openclaw/skills`
- 內建（隨安裝一併提供）
- 額外 Skills 資料夾：`skills.load.extraDirs`

Skills 可由設定/env 閘控（請參閱 [Gateway 設定](/zh-TW/gateway/configuration)中的 `skills`）。

## 執行階段邊界

嵌入式代理執行階段建構於 Pi 代理核心（模型、工具與
prompt 管線）之上。工作階段管理、探索、工具接線與頻道
遞送，則是 OpenClaw 在該核心之上的自有層。

## 工作階段

工作階段逐字稿會以 JSONL 儲存在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

工作階段 ID 是穩定的，並由 OpenClaw 選定。
不會讀取其他工具的舊版工作階段資料夾。

## 串流期間的引導

當佇列模式為 `steer` 時，傳入訊息會被注入目前執行中。
已排入佇列的引導會在**目前 assistant 輪次完成
執行其工具呼叫之後**、下一次 LLM 呼叫之前送達。Pi 會為 `steer` 一次排空所有待處理的
引導訊息；舊版 `queue` 則在每個
模型邊界排空一則訊息。引導不再略過目前
assistant 訊息中剩餘的工具呼叫。

當佇列模式為 `followup` 或 `collect` 時，傳入訊息會保留到
目前輪次結束，接著以已排入佇列的 payload 啟動新的代理輪次。請參閱
[佇列](/zh-TW/concepts/queue)與[引導佇列](/zh-TW/concepts/queue-steering)，了解模式
與邊界行為。

區塊串流會在完成的 assistant 區塊結束後立即傳送；它
**預設關閉**（`agents.defaults.blockStreamingDefault: "off"`）。
可透過 `agents.defaults.blockStreamingBreak` 調整邊界（`text_end` vs `message_end`；預設為 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制軟性區塊分段（預設為
800–1200 個字元；優先使用段落斷點，其次為換行；句子最後）。
使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少
單行洗版（傳送前以閒置為基礎合併）。非 Telegram 頻道需要
明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
詳細工具摘要會在工具開始時發出（無 debounce）；Control UI
會在可用時透過代理事件串流工具輸出。
更多詳情：[串流 + 分段](/zh-TW/concepts/streaming)。

## 模型參照

設定中的模型參照（例如 `agents.defaults.model` 和 `agents.defaults.models`）會透過在**第一個** `/` 分割來解析。

- 設定模型時請使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供者，OpenClaw 會先嘗試別名，接著為該精確模型 id 尋找唯一的
  已設定提供者符合項，然後才回退
  到已設定的預設提供者。如果該提供者不再公開
  已設定的預設模型，OpenClaw 會回退到第一個已設定的
  提供者/模型，而不是顯示過時且已移除的提供者預設值。

## 設定（最小）

至少需設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

---

_下一步：[群組聊天](/zh-TW/channels/group-messages)_ 🦞

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
