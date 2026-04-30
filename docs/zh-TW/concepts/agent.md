---
read_when:
    - 變更代理程式執行階段、工作區啟動程序或工作階段行為
summary: 代理執行階段、工作區合約與工作階段啟動程序
title: 代理執行階段
x-i18n:
    generated_at: "2026-04-30T02:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d65ee96cece296251d7d3a0512f12d2dfa900db0e5ffc0f37dcddae7ea55ad
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 執行一個**單一嵌入式代理執行階段** — 每個 Gateway 一個代理程序，並擁有自己的工作區、啟動檔案與工作階段儲存區。本頁說明該執行階段合約：工作區必須包含哪些內容、會注入哪些檔案，以及工作階段如何依此啟動。

## 工作區（必要）

OpenClaw 使用單一代理工作區目錄（`agents.defaults.workspace`）作為代理在工具與內容脈絡中的**唯一**工作目錄（`cwd`）。

建議：如果缺少 `~/.openclaw/openclaw.json`，請使用 `openclaw setup` 建立，並初始化工作區檔案。

完整工作區配置 + 備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

如果已啟用 `agents.defaults.sandbox`，非主要工作階段可以使用 `agents.defaults.sandbox.workspaceRoot` 下的每工作階段工作區覆寫此設定（請參閱 [Gateway 組態](/zh-TW/gateway/configuration)）。

## 啟動檔案（已注入）

在 `agents.defaults.workspace` 內，OpenClaw 預期有這些可由使用者編輯的檔案：

- `AGENTS.md` — 操作指示 +「記憶」
- `SOUL.md` — 人格、界線、語氣
- `TOOLS.md` — 使用者維護的工具備註（例如 `imsg`、`sag`、慣例）
- `BOOTSTRAP.md` — 一次性的首次執行儀式（完成後刪除）
- `IDENTITY.md` — 代理名稱／風格／emoji
- `USER.md` — 使用者個人資料 + 偏好的稱呼方式

在新工作階段的第一回合，OpenClaw 會將這些檔案的內容直接注入代理內容脈絡。

空白檔案會被略過。大型檔案會被修剪並以標記截斷，讓提示保持精簡（請讀取檔案以取得完整內容）。

如果缺少某個檔案，OpenClaw 會注入單一「缺少檔案」標記行（而 `openclaw setup` 會建立安全的預設範本）。

`BOOTSTRAP.md` 只會為**全新的工作區**建立（不存在其他啟動檔案）。如果你在完成儀式後刪除它，之後重新啟動時不應重新建立。

若要完全停用啟動檔案建立（適用於已預先植入內容的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 和相關系統工具）一律可用，但受工具政策限制。`apply_patch` 是選用項目，並由 `tools.exec.applyPatch` 管控。`TOOLS.md` **不會**控制哪些工具存在；它是關於 _你_ 希望如何使用這些工具的指引。

## Skills

OpenClaw 會從下列位置載入 Skills（優先順序由高到低）：

- 工作區：`<workspace>/skills`
- 專案代理 Skills：`<workspace>/.agents/skills`
- 個人代理 Skills：`~/.agents/skills`
- 受管理／本機：`~/.openclaw/skills`
- 內建（隨安裝提供）
- 額外 Skills 資料夾：`skills.load.extraDirs`

Skills 可由組態／環境管控（請參閱 [Gateway 組態](/zh-TW/gateway/configuration) 中的 `skills`）。

## 執行階段邊界

嵌入式代理執行階段建構於 Pi 代理核心之上（模型、工具與提示管線）。工作階段管理、探索、工具連接與通道遞送，都是 OpenClaw 在該核心之上的自有層。

## 工作階段

工作階段記錄會以 JSONL 儲存在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

工作階段 ID 穩定，並由 OpenClaw 選定。
不會讀取其他工具的舊版工作階段資料夾。

## 串流期間的引導

當佇列模式為 `steer` 時，傳入訊息會被注入目前的執行。佇列中的引導會在**目前助理回合完成其工具呼叫執行後**、下一次 LLM 呼叫前送達。Pi 會一次耗盡 `steer` 的所有待處理引導訊息；舊版 `queue` 則會在每個模型邊界耗盡一則訊息。引導不再略過目前助理訊息中剩餘的工具呼叫。

當佇列模式為 `followup` 或 `collect` 時，傳入訊息會保留到目前回合結束，接著以佇列中的酬載開始新的代理回合。模式與邊界行為請參閱 [佇列](/zh-TW/concepts/queue) 和 [引導佇列](/zh-TW/concepts/queue-steering)。

區塊串流會在助理區塊完成時立即傳送；它**預設關閉**（`agents.defaults.blockStreamingDefault: "off"`）。
透過 `agents.defaults.blockStreamingBreak` 調整邊界（`text_end` 與 `message_end`；預設為 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制軟性區塊分塊（預設為 800–1200 個字元；優先採用段落斷點，其次是換行，最後才是句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少單行洗版（傳送前以閒置時間為基礎合併）。非 Telegram 通道需要明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
詳細工具摘要會在工具啟動時發出（不防抖）；Control UI 會在可用時透過代理事件串流工具輸出。
更多詳細資料：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 模型參照

組態中的模型參照（例如 `agents.defaults.model` 和 `agents.defaults.models`）會依照**第一個** `/` 分割來解析。

- 設定模型時使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略提供者，OpenClaw 會先嘗試別名，接著針對該確切模型 ID 嘗試唯一的已設定提供者相符項，最後才回退到已設定的預設提供者。如果該提供者不再公開已設定的預設模型，OpenClaw 會回退到第一個已設定的提供者／模型，而不是暴露過時且已移除提供者的預設值。

## 組態（最小）

至少設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

---

_下一步：[群組聊天](/zh-TW/channels/group-messages)_ 🦞

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
