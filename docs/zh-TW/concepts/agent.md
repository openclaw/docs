---
read_when:
    - 變更代理程式執行階段、工作區啟動程序或工作階段行為
summary: 代理程式執行環境、工作區契約與工作階段啟動程序
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-07-12T14:27:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 內建一套**嵌入式代理執行階段**：包含內建的代理迴圈、工具連接與提示詞組裝，這與將對話輪次委派給外部控制程序不同。每個已設定的代理（若要執行多個代理，請參閱[多代理路由](/zh-TW/concepts/multi-agent)）都有自己的工作區、啟動檔案與工作階段儲存區。本頁說明該執行階段合約：工作區必須包含哪些內容、會注入哪些檔案，以及工作階段如何依據這些內容進行啟動。

## 工作區（必要）

每個代理都使用單一工作區目錄（`agents.defaults.workspace`，或每個代理的 `agents.list[].workspace`）作為工具與上下文的**唯一**工作目錄（`cwd`）。

建議：使用 `openclaw setup`，在 `~/.openclaw/openclaw.json` 不存在時建立該檔案，並初始化工作區檔案。

完整的工作區配置與備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

如果已啟用 `agents.defaults.sandbox`，非主要工作階段可以使用 `agents.defaults.sandbox.workspaceRoot` 下的個別工作階段工作區覆寫此設定（請參閱[閘道設定](/zh-TW/gateway/configuration)）。

## 啟動檔案（注入）

OpenClaw 預期工作區內包含以下可由使用者編輯的檔案：

| 檔案           | 用途                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作指示與「記憶」                    |
| `SOUL.md`      | 人格、界線與語氣                            |
| `TOOLS.md`     | 使用者維護的工具備註與慣例           |
| `IDENTITY.md`  | 代理名稱、風格與表情符號                                |
| `USER.md`      | 使用者個人資料與偏好的稱呼方式                     |
| `HEARTBEAT.md` | 心跳偵測專用指示                      |
| `BOOTSTRAP.md` | 僅執行一次的首次啟動儀式（完成後刪除） |
| `MEMORY.md`    | 根層級的長期記憶檔案（若存在）               |

在新工作階段的第一個對話輪次，OpenClaw 會將這些檔案的內容注入系統提示詞的專案上下文。只有當 `MEMORY.md` 存在於工作區根目錄時，才會注入該檔案。

空白檔案會被略過。大型檔案會經過裁剪與截斷，並附上標記，以保持提示詞精簡（若要查看完整內容，請讀取該檔案）。如果缺少檔案（`MEMORY.md` 除外），則會改為注入一行「檔案遺失」標記；`openclaw setup` 會為其建立安全的預設範本。

`BOOTSTRAP.md` 只會為**全新的工作區**建立（不存在其他啟動檔案）。在它尚待處理時，OpenClaw 會將其保留於專案上下文中，並在系統提示詞中加入初始儀式的啟動指引，而不會將內容複製到使用者訊息中。如果你在完成儀式後將其刪除，之後重新啟動時不會再次建立。

工作區一旦被觀察到，OpenClaw 也會在狀態目錄中保留該工作區路徑的證明標記。如果近期已證明的工作區消失或遭到清除，啟動時將拒絕在未提示的情況下重新植入 `BOOTSTRAP.md`；請還原工作區，或使用完整的引導重設，讓工作區與標記一併清除。

若要完全停用啟動檔案建立功能（適用於已預先植入內容的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 及相關系統工具）一律可用，但受工具政策限制。OpenAI 模型預設啟用 `apply_patch`，並由 `tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）管控。`TOOLS.md` **不會**控制存在哪些工具；它只是關於你希望如何使用這些工具的指引。

## Skills

OpenClaw 會從下列位置載入 Skills（依優先順序由高至低）：

- 工作區：`<workspace>/skills`
- 專案代理 Skills：`<workspace>/.agents/skills`
- 個人代理 Skills：`~/.agents/skills`
- 受管理／本機：`~/.openclaw/skills`
- 隨安裝套件內附
- 額外的 Skill 資料夾：`skills.load.extraDirs`

Skill 根目錄可以包含分組資料夾，例如 `<workspace>/skills/personal/foo/SKILL.md`；該 Skill 仍會以其 frontmatter 中的扁平名稱公開，例如 `foo`。

Skills 可由設定／環境變數管控（請參閱[閘道設定](/zh-TW/gateway/configuration)中的 `skills`）。

## 執行階段邊界

嵌入式代理執行階段由 OpenClaw 擁有：模型探索、工具連接、提示詞組裝、工作階段管理與頻道傳遞共用同一個整合式執行階段介面。

## 工作階段

工作階段資料列儲存在每個代理的 SQLite 資料庫中：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

逐字記錄 JSONL 檔案仍可存放於 `~/.openclaw/agents/<agentId>/sessions/` 下，作為舊版遷移輸入、已刪除或重設的封存、匯入、匯出及支援成品。使用中的代理歷程會與工作階段資料列一同儲存在 SQLite 中。工作階段 ID 固定不變，並由 OpenClaw 選定。OpenClaw 不會讀取其他工具的工作階段資料夾。

## 串流期間的引導

執行期間收到的輸入提示詞，預設會引導至目前的執行。引導會在**目前的助理對話輪次執行完其工具呼叫之後**、下一次 LLM 呼叫之前送達，且不再略過目前助理訊息中剩餘的工具呼叫。

`/queue steer` 是執行中的預設行為。`/queue followup` 與 `/queue collect` 會讓訊息等候稍後的對話輪次，而不是進行引導。`/queue interrupt` 則會中止目前的執行。關於佇列與邊界行為，請參閱[佇列](/zh-TW/concepts/queue)與[引導佇列](/zh-TW/concepts/queue-steering)。

區塊串流會在助理區塊完成後立即傳送；此功能**預設關閉**（`agents.defaults.blockStreamingDefault: "off"`）。可透過 `agents.defaults.blockStreamingBreak` 調整邊界（`text_end` 與 `message_end`；預設為 `text_end`）。使用 `agents.defaults.blockStreamingChunk` 控制彈性區塊的分塊方式（預設為 800-1200 個字元；優先在段落中斷處分割，其次為換行，最後才是句子）。使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少單行訊息洗版（傳送前依閒置時間合併）。非 Telegram 頻道必須明確設定 `*.blockStreaming: true`，才能啟用區塊回覆。
詳細工具摘要會在工具啟動時送出（不做防抖）；如果有代理事件可用，Control UI 會透過事件串流傳送工具輸出。
更多詳細資訊：[串流與分塊](/zh-TW/concepts/streaming)。

## 模型參照

設定中的模型參照（例如 `agents.defaults.model` 與 `agents.defaults.models`）會以**第一個** `/` 為界進行分割剖析。

- 設定模型時請使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 樣式），請加入供應商前綴（例如：`openrouter/moonshotai/kimi-k2`）。
- 如果省略供應商，OpenClaw 會先嘗試別名，接著尋找與該模型 ID 完全相符且唯一的已設定供應商，最後才退回已設定的預設供應商。如果該供應商已不再提供所設定的預設模型，OpenClaw 會改為退回第一個已設定的供應商／模型，而不是呈現已移除供應商所留下的過時預設值。

## 設定（最低需求）

至少設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

## 相關內容

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
- [群組聊天](/zh-TW/channels/group-messages)
