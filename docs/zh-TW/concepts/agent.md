---
read_when:
    - 變更代理程式執行階段、工作區啟動程序或工作階段行為
summary: 代理程式執行階段、工作區合約與工作階段啟動載入
title: 代理程式執行階段
x-i18n:
    generated_at: "2026-07-14T13:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 9f9050092650ecfd894eff837fa6fec49042347134ec7e2dbfa02afda518a47d
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 內建一套**嵌入式代理執行階段**：包括內建代理迴圈、工具
連接與提示組裝，與將對話輪次委派給外部
執行框架程序不同。每個已設定的代理（若要執行多個代理，請參閱[多代理路由](/zh-TW/concepts/multi-agent)）
都有自己的工作區、啟動檔案與工作階段
儲存區。本頁說明該執行階段合約：工作區必須
包含哪些內容、會注入哪些檔案，以及工作階段如何依據工作區進行啟動。

## 工作區（必要）

每個代理都使用單一工作區目錄（`agents.defaults.workspace`，或每個代理使用
`agents.list[].workspace`）作為工具與情境的**唯一**工作目錄（`cwd`）。

建議：使用 `openclaw setup`，在缺少 `~/.openclaw/openclaw.json` 時建立它，並初始化工作區檔案。

完整工作區配置與備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

若已啟用 `agents.defaults.sandbox`，非主要工作階段可使用
`agents.defaults.sandbox.workspaceRoot` 下的個別工作階段工作區覆寫此設定（請參閱
[閘道設定](/zh-TW/gateway/configuration)）。

## 啟動檔案（已注入）

OpenClaw 預期工作區內含有以下可由使用者編輯的檔案：

| 檔案           | 用途                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作指示與「記憶」                    |
| `SOUL.md`      | 人格、界線、語氣                            |
| `TOOLS.md`     | 使用者維護的工具備註與慣例           |
| `IDENTITY.md`  | 代理名稱／風格／表情符號                                |
| `USER.md`      | 使用者設定檔與偏好的稱呼方式                     |
| `HEARTBEAT.md` | 心跳偵測專用指示                      |
| `BOOTSTRAP.md` | 僅執行一次的首次啟動儀式（完成後刪除） |
| `MEMORY.md`    | 根層級長期記憶檔案（若存在）               |

在新工作階段的第一個對話輪次中，OpenClaw 會將這些檔案的內容注入系統提示的「專案情境」。只有當 `MEMORY.md` 存在於工作區根目錄時，才會注入它。

空白檔案會略過。大型檔案會經過修剪和截斷，並附上標記，使提示保持精簡（若要查看完整內容，請讀取該檔案）。缺少檔案時（`MEMORY.md` 除外），則會注入一行「缺少檔案」標記；`openclaw setup` 會為該檔案建立安全的預設範本。

只有在**全新的工作區**（不存在任何其他啟動檔案）中才會建立 `BOOTSTRAP.md`。在它仍待處理期間，OpenClaw 會將它保留在「專案情境」中，並在系統提示加入初始儀式的啟動指引，而不會將它複製到使用者訊息中。如果你在完成儀式後將其刪除，後續重新啟動時不會再次建立。

OpenClaw 觀察到工作區後，也會在狀態目錄中保留該工作區路徑的證明標記。如果近期已證明的工作區消失或遭清除，啟動程序會拒絕在無提示的情況下重新植入 `BOOTSTRAP.md`；請還原工作區，或執行完整的引導重設，以便同時清除工作區與標記。

若要完全停用啟動檔案建立功能（適用於預先植入內容的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 與相關系統工具）一律可用，
但仍受工具政策約束。OpenAI 模型預設啟用 `apply_patch`，並由
`tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）控管。`TOOLS.md` **不會**控制有哪些工具可用；它只是
關於你希望如何使用這些工具的指引。

## Skills

OpenClaw 會從下列位置載入 Skills（依優先順序由高至低）：

- 工作區：`<workspace>/skills`
- 專案代理 Skills：`<workspace>/.agents/skills`
- 個人代理 Skills：`~/.agents/skills`
- 受管理／本機：`~/.openclaw/skills`
- 隨附（與安裝套件一同提供）
- 額外 Skills 資料夾：`skills.load.extraDirs`

Skills 根目錄可包含分組資料夾，例如
`<workspace>/skills/personal/foo/SKILL.md`；該 Skill 仍會以其
扁平化的 frontmatter 名稱公開，例如 `foo`。

Skills 可由設定／環境變數控管（請參閱[閘道設定](/zh-TW/gateway/configuration)中的 `skills`）。

## 執行階段界線

嵌入式代理執行階段由 OpenClaw 擁有：模型探索、工具連接、
提示組裝、工作階段管理與頻道傳送共用一個整合式
執行階段介面。

## 工作階段

工作階段資料列儲存在每個代理各自的 SQLite 資料庫中：

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

對話記錄 JSONL 檔案仍可存在於
`~/.openclaw/agents/<agentId>/sessions/` 下，作為舊版遷移輸入、已刪除或
重設的封存、匯入、匯出及支援成品。使用中的代理歷程會
與工作階段資料列一同儲存在 SQLite 中。工作階段 ID 固定不變，並由
OpenClaw 選定。OpenClaw 不會讀取其他工具的工作階段資料夾。

## 串流期間的引導

執行期間收到的傳入提示，預設會引導至目前的執行。
引導內容會在**目前的助理對話輪次完成其
工具呼叫後**、下一次 LLM 呼叫前傳送，且不再略過
目前助理訊息中剩餘的工具呼叫。

`/queue steer` 是預設的進行中執行行為。`/queue followup` 與
`/queue collect` 會讓訊息等候後續對話輪次，而非進行引導。
`/queue interrupt` 則會中止進行中的執行。佇列與界線行為請參閱[佇列](/zh-TW/concepts/queue)
與[引導佇列](/zh-TW/concepts/queue-steering)。

區塊串流會在助理區塊完成時立即傳送；此功能
**預設關閉**（`agents.defaults.blockStreamingDefault: "off"`）。
可透過 `agents.defaults.blockStreamingBreak` 調整界線（`text_end` 與 `message_end`；預設為 `text_end`）。
使用 `agents.defaults.blockStreamingChunk` 控制軟性區塊分段（預設為
800-1200 個字元；優先在段落分隔處分段，其次是換行，最後才是句子）。
使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少
單行訊息洗版（傳送前依閒置時間合併）。非 Telegram 頻道必須
明確設定 `*.streaming.block.enabled: true` 才會啟用區塊回覆（QQ Bot
則預設串流區塊回覆，除非 `channels.qqbot.streaming.mode` 為 `"off"`）。
詳細工具摘要會在工具啟動時發出（不進行防彈跳）；若可用，控制介面
會透過代理事件串流工具輸出。
更多詳細資訊：[串流與分段](/zh-TW/concepts/streaming)。

## 模型參照

設定中的模型參照（例如 `agents.defaults.model` 與 `agents.defaults.models`）會在**第一個** `/` 處分割並解析。

- 設定模型時，請使用 `provider/model`。
- 若模型 ID 本身包含 `/`（OpenRouter 風格），請包含供應商前綴（例如：`openrouter/moonshotai/kimi-k2`）。
- 若省略供應商，OpenClaw 會先嘗試別名，接著尋找該模型 ID 在
  已設定供應商中的唯一完全相符項目，最後才回退至
  已設定的預設供應商。若該供應商已不再提供
  已設定的預設模型，OpenClaw 會回退至第一個已設定的
  供應商／模型，而不會顯示已移除供應商的過時預設值。

## 設定（最低需求）

至少設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

## 相關內容

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
- [群組聊天](/zh-TW/channels/group-messages)
