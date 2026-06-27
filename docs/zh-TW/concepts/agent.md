---
read_when:
    - 變更代理程式執行階段、工作區啟動程序或工作階段行為
summary: 代理程式執行環境、工作區合約與工作階段啟動設定
title: 代理執行階段
x-i18n:
    generated_at: "2026-06-27T19:10:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw 執行一個**單一嵌入式代理執行階段** - 每個
閘道一個代理程序，並有自己的工作區、啟動檔案和工作階段儲存區。本頁
說明該執行階段合約：工作區必須包含什麼、哪些檔案會被
注入，以及工作階段如何依據它啟動。

## 工作區（必要）

OpenClaw 使用單一代理工作區目錄（`agents.defaults.workspace`），作為代理在工具與脈絡中的**唯一**工作目錄（`cwd`）。

建議：使用 `openclaw setup` 在缺少時建立 `~/.openclaw/openclaw.json`，並初始化工作區檔案。

完整工作區配置 + 備份指南：[代理工作區](/zh-TW/concepts/agent-workspace)

如果啟用 `agents.defaults.sandbox`，非主要工作階段可以使用
`agents.defaults.sandbox.workspaceRoot` 底下的每工作階段工作區覆寫此設定（請參閱
[閘道設定](/zh-TW/gateway/configuration)）。

## 啟動檔案（已注入）

在 `agents.defaults.workspace` 內，OpenClaw 預期有這些可由使用者編輯的檔案：

- `AGENTS.md` - 操作指示 +「記憶」
- `SOUL.md` - 人格、界線、語氣
- `TOOLS.md` - 使用者維護的工具筆記（例如 `imsg`、`sag`、慣例）
- `BOOTSTRAP.md` - 一次性的首次執行儀式（完成後刪除）
- `IDENTITY.md` - 代理名稱/氛圍/表情符號
- `USER.md` - 使用者個人資料 + 偏好的稱呼方式

在新工作階段的第一輪，OpenClaw 會將這些檔案的內容注入到系統提示的專案脈絡中。

空白檔案會被略過。大型檔案會被修剪並以標記截斷，讓提示保持精簡（請閱讀檔案以取得完整內容）。

如果檔案缺失，OpenClaw 會注入單一「缺少檔案」標記行（而 `openclaw setup` 會建立安全的預設範本）。

`BOOTSTRAP.md` 只會為**全新的工作區**建立（沒有其他啟動檔案存在）。當它待處理時，OpenClaw 會將它保留在專案脈絡中，並為初始儀式加入系統提示啟動指引，而不是把它複製到使用者訊息中。如果你在完成儀式後刪除它，之後重新啟動時不應重新建立。

工作區被觀察到之後，OpenClaw 也會為工作區路徑保留狀態目錄證明標記。如果最近已證明的工作區消失或被清除，啟動會拒絕靜默地重新播種 `BOOTSTRAP.md`；請還原工作區，或使用完整的 onboard 重設，讓工作區和標記一起被清除。

若要完全停用啟動檔案建立（用於預先播種的工作區），請設定：

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## 內建工具

核心工具（read/exec/edit/write 和相關系統工具）一律可用，
但會受工具政策限制。`apply_patch` 是選用項目，並由
`tools.exec.applyPatch` 控制。`TOOLS.md` **不**控制哪些工具存在；它是
關於你希望工具如何被使用的指引。

## Skills

OpenClaw 會從這些位置載入 Skills（優先順序由高到低）：

- 工作區：`<workspace>/skills`
- 專案代理 Skills：`<workspace>/.agents/skills`
- 個人代理 Skills：`~/.agents/skills`
- 受管/本機：`~/.openclaw/skills`
- 隨附（隨安裝提供）
- 額外 Skills 資料夾：`skills.load.extraDirs`

Skills 根目錄可以包含分組資料夾，例如
`<workspace>/skills/personal/foo/SKILL.md`；該 Skill 仍會以其
扁平 frontmatter 名稱公開，例如 `foo`。

Skills 可以由設定/env 控制（請參閱[閘道設定](/zh-TW/gateway/configuration)中的 `skills`）。

## 執行階段邊界

嵌入式代理執行階段由 OpenClaw 擁有：模型探索、工具接線、
提示組裝、工作階段管理和通道遞送共用同一個整合式
執行階段表面。

## 工作階段

工作階段逐字稿會以 JSONL 儲存在：

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

工作階段 ID 穩定，並由 OpenClaw 選擇。
不會讀取其他工具的舊版工作階段資料夾。

## 串流時導引

預設情況下，在執行中途抵達的傳入提示會被導引到目前執行中。
導引會在**目前助理輪次完成執行其工具呼叫之後**遞送，
並在下一次 LLM 呼叫之前進行，且不再略過目前助理訊息中
剩餘的工具呼叫。

`/queue steer` 是預設的作用中執行行為。`/queue followup` 和
`/queue collect` 會讓訊息等待稍後的輪次，而不是進行導引。
`/queue interrupt` 則會中止作用中執行。請參閱[佇列](/zh-TW/concepts/queue)
和[導引佇列](/zh-TW/concepts/queue-steering)，了解佇列與邊界行為。

區塊串流會在完成助理區塊後立即傳送；它
**預設關閉**（`agents.defaults.blockStreamingDefault: "off"`）。
透過 `agents.defaults.blockStreamingBreak` 調整邊界（`text_end` vs `message_end`；預設為 text_end）。
使用 `agents.defaults.blockStreamingChunk` 控制軟性區塊分段（預設為
800-1200 字元；優先採用段落中斷，其次是換行；句子最後）。
使用 `agents.defaults.blockStreamingCoalesce` 合併串流區塊，以減少
單行洗版（傳送前以閒置為基礎合併）。非 Telegram 通道需要
明確設定 `*.blockStreaming: true` 才能啟用區塊回覆。
詳細工具摘要會在工具開始時發出（無 debounce）；Control UI
會在可用時透過代理事件串流工具輸出。
更多詳細資訊：[串流 + 分段](/zh-TW/concepts/streaming)。

## 模型 refs

設定中的模型 refs（例如 `agents.defaults.model` 和 `agents.defaults.models`）會透過在**第一個** `/` 分割來解析。

- 設定模型時使用 `provider/model`。
- 如果模型 ID 本身包含 `/`（OpenRouter 風格），請包含提供者前綴（範例：`openrouter/moonshotai/kimi-k2`）。
- 如果你省略提供者，OpenClaw 會先嘗試別名，接著嘗試該精確模型 id 的唯一
  已設定提供者相符項，最後才退回
  已設定的預設提供者。如果該提供者不再公開
  已設定的預設模型，OpenClaw 會退回第一個已設定的
  提供者/模型，而不是浮現過時的已移除提供者預設值。

## 設定（最小）

至少設定：

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom`（強烈建議）

---

_下一步：[群組聊天](/zh-TW/channels/group-messages)_ 🦞

## 相關

- [代理工作區](/zh-TW/concepts/agent-workspace)
- [多代理路由](/zh-TW/concepts/multi-agent)
- [工作階段管理](/zh-TW/concepts/session)
