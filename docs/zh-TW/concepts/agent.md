---
read_when:
    - 變更代理執行階段、工作區啟動程序或工作階段行為
summary: 代理執行階段、工作區合約與工作階段啟動程序
title: 代理執行階段
x-i18n:
    generated_at: "2026-07-05T11:12:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9c2468239d94e393246af28a38b1db602a5d665f0fb43e80def19acb5985093f
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 隨附一個**嵌入式代理執行階段**：內建的代理循環、工具
接線與提示組裝，與將回合委派給外部
工具程序不同。每個已設定的代理（若要執行多個代理，請參閱[多代理路由](/zh-TW/concepts/multi-agent)）
都有自己的工作區、啟動檔案與工作階段
儲存區。本頁涵蓋該執行階段合約：工作區必須
包含什麼、會注入哪些檔案，以及工作階段如何依此啟動。

## 工作區（必要）

每個代理都會使用單一工作區目錄（`agents.defaults.workspace`，或每個代理的
`agents.list[].workspace`）作為工具與情境的**唯一**工作目錄（`cwd`）。

建議：使用 `openclaw setup` 在缺少 `~/.openclaw/openclaw.json` 時建立它，並初始化工作區檔案。

完整工作區版面配置與備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

如果已啟用 `agents.defaults.sandbox`，非主要工作階段可以使用
`agents.defaults.sandbox.workspaceRoot` 下的每工作階段工作區覆寫此設定（請參閱
[閘道設定](/zh-TW/gateway/configuration)）。

## 啟動檔案（已注入）

在工作區內，OpenClaw 會預期這些可由使用者編輯的檔案：

| 檔案           | 用途                                              |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | 操作指示 +「記憶」                    |
| `SOUL.md`      | 人格、邊界、語氣                            |
| `TOOLS.md`     | 使用者維護的工具備註與慣例           |
| `IDENTITY.md`  | 代理名稱/風格/emoji                                |
| `USER.md`      | 使用者個人資料 + 偏好的稱呼                     |
| `HEARTBEAT.md` | 心跳偵測專屬指示                      |
| `BOOTSTRAP.md` | 一次性的首次執行儀式（完成後刪除） |
| `MEMORY.md`    | 根長期記憶檔案（若存在）               |

在新工作階段的第一個回合，OpenClaw 會將這些檔案的內容注入系統提示的專案情境。`MEMORY.md` 只有在工作區根目錄存在時才會注入。

空白檔案會略過。大型檔案會以標記修剪和截斷，讓提示保持精簡（閱讀檔案以取得完整內容）。缺少的檔案（`MEMORY.md` 除外）則會注入單一「缺少檔案」標記行；`openclaw setup` 會為它建立安全的預設範本。

`BOOTSTRAP.md` 只會為**全新的工作區**建立（沒有其他啟動檔案存在）。當它待處理時，OpenClaw 會將它保留在專案情境中，並加入初始儀式的系統提示啟動指引，而不是將它複製到使用者訊息中。如果你在完成儀式後刪除它，後續重新啟動時不會重新建立。

工作區被觀察到之後，OpenClaw 也會為工作區路徑保留一個狀態目錄證明標記。如果最近證明過的工作區消失或被清除，啟動會拒絕靜默重新植入 `BOOTSTRAP.md`；請還原工作區，或使用完整的 onboard 重設，讓工作區與標記一起清除。

若要完全停用啟動檔案建立（適用於預先植入的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 及相關系統工具）一律可用，
但受工具政策約束。`apply_patch` 對 OpenAI 模型預設開啟，並由
`tools.exec.applyPatch`（`enabled`、`workspaceOnly`、`allowModels`）控管。`TOOLS.md` **不會**控制哪些工具存在；它是
關於你希望工具如何使用的指引。

## Skills

OpenClaw 會從以下位置載入 Skills（優先順序由高到低）：

- 工作區：`<workspace>/skills`
- 專案代理 Skills：`<workspace>/.agents/skills`
- 個人代理 Skills：`~/.agents/skills`
- 受管理/本機：`~/.openclaw/skills`
- 隨附（隨安裝提供）
- 額外 Skills 資料夾：`skills.load.extraDirs`

Skill 根目錄可以包含分組資料夾，例如
`<workspace>/skills/personal/foo/SKILL.md`；該 Skill 仍會以其
扁平 frontmatter 名稱公開，例如 `foo`。

Skills 可以由設定/env 控管（請參閱[閘道設定](/zh-TW/gateway/configuration)中的 `skills`）。

## 執行階段邊界

嵌入式代理執行階段由 OpenClaw 擁有：模型探索、工具接線、
提示組裝、工作階段管理與通道傳遞共享一個整合式
執行階段介面。

## 工作階段

工作階段逐字稿會以 JSONL 儲存在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

工作階段 ID 穩定且由 OpenClaw 選擇。OpenClaw 不會讀取其他工具的工作階段資料夾。

## 串流時導引

預設情況下，執行中途抵達的傳入提示會被導引到目前執行中。
導引會在**目前助理回合完成執行其
工具呼叫之後**傳遞，在下一次 LLM 呼叫之前，且不再略過
目前助理訊息中剩餘的工具呼叫。

`/queue steer` 是預設的作用中執行行為。`/queue followup` 和
`/queue collect` 會讓訊息等待稍後的回合，而不是導引。
`/queue interrupt` 則會中止作用中的執行。請參閱[佇列](/zh-TW/concepts/queue)
與[導引佇列](/zh-TW/concepts/queue-steering)，了解佇列與邊界行為。

區塊串流會在完成的助理區塊一完成時就送出；它
**預設關閉**（`agents.defaults.blockStreamingDefault: "off"`）。
透過 `agents.defaults.blockStreamingBreak` 調整邊界（`text_end` 與 `message_end`；預設為 `text_end`）。
使用 `agents.defaults.blockStreamingChunk` 控制軟性區塊分塊（預設為
800-1200 個字元；優先使用段落中斷，其次是換行；句子最後）。
使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少
單行洗版（傳送前依閒置時間合併）。非 Telegram 通道需要
明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
詳細工具摘要會在工具開始時發出（沒有 debounce）；Control UI
會在可用時透過代理事件串流工具輸出。
更多詳細資訊：[串流 + 分塊](/zh-TW/concepts/streaming)。

## 模型參照

設定中的模型參照（例如 `agents.defaults.model` 與 `agents.defaults.models`）會透過在**第一個** `/` 分割來解析。

- 設定模型時使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含 provider 前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果省略 provider，OpenClaw 會先嘗試別名，接著為該精確模型 id 嘗試唯一的
  已設定 provider 相符項，然後才退回
  已設定的預設 provider。如果該 provider 不再公開
  已設定的預設模型，OpenClaw 會退回到第一個已設定的
  provider/model，而不是顯示過時的已移除 provider 預設值。

## 設定（最小）

至少請設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
- [群組聊天](/zh-TW/channels/group-messages)
