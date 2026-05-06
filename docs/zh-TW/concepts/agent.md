---
read_when:
    - 變更代理程式執行階段、工作區啟動程序或工作階段行為
summary: 代理程式執行階段、工作區契約與工作階段啟動程序
title: 代理執行環境
x-i18n:
    generated_at: "2026-05-06T09:06:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 372cf6a02b35646c24e68d96938bba57721eeec512e17c2d40c8e721e7561bd1
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 執行**單一嵌入式代理程式執行環境** - 每個 Gateway 一個代理程式程序，並有自己的工作區、啟動檔案和工作階段儲存區。本頁說明該執行環境合約：工作區必須包含哪些內容、會注入哪些檔案，以及工作階段如何依據它啟動。

## 工作區（必需）

OpenClaw 使用單一代理程式工作區目錄（`agents.defaults.workspace`）作為代理程式在工具與上下文中的**唯一**工作目錄（`cwd`）。

建議：使用 `openclaw setup` 在缺少時建立 `~/.openclaw/openclaw.json`，並初始化工作區檔案。

完整工作區版面配置 + 備份指南：[代理程式工作區](/zh-TW/concepts/agent-workspace)

如果已啟用 `agents.defaults.sandbox`，非主要工作階段可以使用 `agents.defaults.sandbox.workspaceRoot` 底下的逐工作階段工作區覆寫此設定（請參閱 [Gateway 設定](/zh-TW/gateway/configuration)）。

## 啟動檔案（已注入）

在 `agents.defaults.workspace` 內，OpenClaw 預期有這些可由使用者編輯的檔案：

- `AGENTS.md` - 操作指示 +「記憶」
- `SOUL.md` - 人格、界線、語氣
- `TOOLS.md` - 使用者維護的工具備註（例如 `imsg`、`sag`、慣例）
- `BOOTSTRAP.md` - 一次性首次執行儀式（完成後刪除）
- `IDENTITY.md` - 代理程式名稱/氛圍/emoji
- `USER.md` - 使用者資料 + 偏好的稱呼方式

在新工作階段的第一輪中，OpenClaw 會將這些檔案的內容注入到系統提示詞的專案上下文中。

空白檔案會被略過。大型檔案會以標記修剪並截斷，讓提示詞保持精簡（請讀取檔案以取得完整內容）。

如果檔案遺失，OpenClaw 會注入單一「檔案遺失」標記行（且 `openclaw setup` 會建立安全的預設範本）。

`BOOTSTRAP.md` 只會為**全新工作區**建立（沒有其他啟動檔案存在）。在它待處理期間，OpenClaw 會將它保留在專案上下文中，並加入系統提示詞啟動指引以進行初始儀式，而不是將它複製到使用者訊息中。如果你在完成儀式後刪除它，之後重新啟動時不應重新建立。

若要完全停用啟動檔案建立（用於預先填入內容的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 與相關系統工具）一律可用，並受工具政策約束。`apply_patch` 是選用項目，且由 `tools.exec.applyPatch` 控制。`TOOLS.md` **不會**控制有哪些工具存在；它是關於 _你_ 希望如何使用這些工具的指引。

## Skills

OpenClaw 會從這些位置載入 Skills（優先順序由高到低）：

- 工作區：`<workspace>/skills`
- 專案代理程式 Skills：`<workspace>/.agents/skills`
- 個人代理程式 Skills：`~/.agents/skills`
- 受管理/本機：`~/.openclaw/skills`
- 隨附（隨安裝提供）
- 額外 Skills 資料夾：`skills.load.extraDirs`

Skills 可由設定/env 控制（請參閱 [Gateway 設定](/zh-TW/gateway/configuration) 中的 `skills`）。

## 執行環境邊界

嵌入式代理程式執行環境建構於 Pi 代理程式核心之上（模型、工具與提示詞管線）。工作階段管理、探索、工具接線和通道傳遞，是 OpenClaw 在該核心之上的自有層。

## 工作階段

工作階段逐字稿會以 JSONL 儲存在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

工作階段 ID 是穩定的，並由 OpenClaw 選定。
不會讀取其他工具留下的舊版工作階段資料夾。

## 串流時導引

當佇列模式為 `steer` 時，傳入訊息會被注入目前的執行。已排入佇列的導引會在**目前 assistant 回合完成執行其工具呼叫之後**、下一次 LLM 呼叫之前送達。Pi 會針對 `steer` 一次耗盡所有待處理導引訊息；舊版 `queue` 則在每個模型邊界耗盡一則訊息。導引不再跳過目前 assistant 訊息中剩餘的工具呼叫。

當佇列模式為 `followup` 或 `collect` 時，傳入訊息會被保留到目前回合結束，然後新的代理程式回合會以排入佇列的酬載開始。請參閱[佇列](/zh-TW/concepts/queue)與[導引佇列](/zh-TW/concepts/queue-steering)，了解模式與邊界行為。

區塊串流會在 assistant 區塊完成後立即傳送；它**預設為關閉**（`agents.defaults.blockStreamingDefault: "off"`）。
透過 `agents.defaults.blockStreamingBreak` 調整邊界（`text_end` 與 `message_end`；預設為 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制軟性區塊分塊（預設為 800-1200 個字元；優先使用段落分隔，其次為換行；最後才是句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少單行垃圾訊息（傳送前以閒置為基礎合併）。非 Telegram 通道需要明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
詳細工具摘要會在工具啟動時發出（無 debounce）；Control UI 會在可用時透過代理程式事件串流工具輸出。
更多詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 模型參照

設定中的模型參照（例如 `agents.defaults.model` 和 `agents.defaults.models`）會透過在**第一個** `/` 處分割來解析。

- 設定模型時使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供者，OpenClaw 會先嘗試別名，接著針對該精確模型 ID 嘗試唯一的已設定提供者相符項，最後才退回到已設定的預設提供者。如果該提供者不再公開已設定的預設模型，OpenClaw 會退回到第一個已設定的提供者/模型，而不是顯示過時且已移除提供者的預設值。

## 設定（最小）

至少請設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

---

_下一步：[群組聊天](/zh-TW/channels/group-messages)_ 🦞

## 相關

- [代理程式工作區](/zh-TW/concepts/agent-workspace)
- [多代理程式路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
