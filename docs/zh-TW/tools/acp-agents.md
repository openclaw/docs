---
read_when:
    - 透過 ACP 執行程式設計測試框架
    - 在訊息通道上設定對話綁定的 ACP 工作階段
    - 將訊息頻道對話綁定到持久的 ACP 工作階段
    - 疑難排解 ACP 後端、外掛接線或完成交付
    - 透過聊天操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼編寫工具框架（Claude Code、Cursor、Gemini CLI、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-07-05T11:48:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段可讓
OpenClaw 透過 ACP 後端外掛執行外部程式碼執行框架（Claude Code、Cursor、Copilot、Droid、
OpenClaw ACP、OpenCode、Gemini 命令列介面，以及其他支援的 ACPX 執行框架）。
每次產生都會被追蹤為
[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部執行框架路徑，不是預設 Codex 路徑。** 原生
Codex app-server 外掛擁有 `/codex ...` 控制項，以及代理回合的預設
`openai/gpt-*` 內嵌執行階段；ACP 擁有 `/acp ...` 控制項
和 `sessions_spawn({ runtime: "acp" })` 工作階段。

若要讓 Codex 或 Claude Code 作為外部 MCP 用戶端直接連線到
現有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我該看哪個頁面？

| 你想要...                                                                                  | 使用這個                              | 備註                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                               | `/codex bind`, `/codex threads`       | 啟用 `codex` 外掛時的原生 Codex app-server 路徑：已繫結的聊天回覆、圖片轉送、模型/快速/權限、停止和引導。ACP 是明確的備援 |
| 透過 OpenClaw 執行 Claude Code、Gemini 命令列介面、明確的 Codex ACP，或其他外部執行框架 | 本頁面                             | 綁定聊天的工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                 |
| 將 OpenClaw Gateway 工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                   | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式：IDE/用戶端透過 stdio/WebSocket 以 ACP 與 OpenClaw 通訊                                                                                                      |
| 重用本機 AI 命令列介面作為純文字備援模型                                              | [命令列介面後端](/zh-TW/gateway/cli-backends) | 不是 ACP：沒有 OpenClaw 工具、沒有 ACP 控制項、沒有執行框架執行階段                                                                                                             |

## 這能開箱即用嗎？

可以，在安裝官方 ACP 執行階段外掛後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 後使用本機 `extensions/acpx` 工作區外掛。
執行 `/acp doctor` 進行就緒檢查。

只有在 ACP **真正可用**時，OpenClaw 才會教代理如何產生 ACP：
ACP 必須啟用、派送不得停用、目前工作階段不得被沙盒阻擋，
且必須已載入健康的執行階段後端。若任一條件失敗，ACP Skills 和
`sessions_spawn` ACP 指引會保持隱藏，讓代理不會建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行的注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的外掛清單，且**必須**包含 `acpx`，否則已安裝的 ACP 後端會被刻意阻擋（`/acp doctor` 會回報缺少允許清單項目）。
    - Codex ACP 轉接器隨 `acpx` 外掛一起提供，並會在可行時於本機啟動。
    - Codex ACP 會以隔離的 `CODEX_HOME` 執行。OpenClaw 會從主機 Codex 設定複製可信專案信任項目，以及安全的模型/提供者路由設定（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode` 和安全的 `model_providers.<name>` 欄位）；驗證、通知和 hook 只保留在主機設定上。
    - 其他目標執行框架轉接器可能會在首次使用時依需求透過 `npx` 擷取。
    - 該執行框架的供應商驗證必須已存在於主機上。
    - 如果主機沒有 npm 或網路存取，首次執行的轉接器擷取會失敗，直到快取已預熱或轉接器以其他方式安裝為止。

  </Accordion>
  <Accordion title="執行階段必要條件">
    ACP 會啟動真正的外部執行框架程序。OpenClaw 擁有路由、
    背景任務狀態、傳遞、繫結和政策；執行框架擁有
    其提供者登入、模型目錄、檔案系統行為和原生工具。

    在歸咎於 OpenClaw 之前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 設定該允許清單時，目標 ID 受到 `acp.allowedAgents` 允許。
    - 執行框架命令可在 Gateway 主機上啟動。
    - 該執行框架已具備提供者驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該執行框架中 - 模型 ID 無法跨執行框架通用。
    - 請求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點擊原生權限提示，因此大量寫入/執行的程式碼工作通常需要能以無頭方式繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具和內建 OpenClaw 工具預設**不會**公開給 ACP
執行框架。只有在執行框架應直接呼叫那些工具時，才啟用
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的執行框架目標

使用 `acpx` 後端時，請將這些 ID 作為 `/acp spawn <id>` 或
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 執行框架 ID   | 典型後端                                | 備註                                                                               |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP 轉接器                        | 需要主機上的 Claude Code 驗證。                                              |
| `codex`      | Codex ACP 轉接器                              | 僅在原生 `/codex` 不可用或明確請求 ACP 時，才作為 ACP 備援。 |
| `copilot`    | GitHub Copilot ACP 轉接器                     | 需要 Copilot 命令列介面/執行階段驗證。                                                  |
| `cursor`     | Cursor 命令列介面 ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。    |
| `droid`      | Factory Droid 命令列介面                              | 需要執行框架環境中的 Factory/Droid 驗證或 `FACTORY_API_KEY`。        |
| `fast-agent` | fast-agent-mcp ACP 轉接器                     | 依需求透過 `uvx` 擷取。                                                       |
| `gemini`     | Gemini 命令列介面 ACP 轉接器                         | 需要 Gemini 命令列介面驗證或 API 金鑰設定。                                          |
| `iflow`      | iFlow 命令列介面                                      | 轉接器可用性和模型控制取決於已安裝的命令列介面。                 |
| `kilocode`   | Kilo Code 命令列介面                                  | 轉接器可用性和模型控制取決於已安裝的命令列介面。                 |
| `kimi`       | Kimi/Moonshot 命令列介面                              | 需要主機上的 Kimi/Moonshot 驗證。                                            |
| `kiro`       | Kiro 命令列介面                                       | 轉接器可用性和模型控制取決於已安裝的命令列介面。                 |
| `mux`        | Mux 命令列介面 ACP 轉接器                            | 依需求透過 `npx` 擷取。                                                       |
| `opencode`   | OpenCode ACP 轉接器                           | 需要 OpenCode 命令列介面/提供者驗證。                                                |
| `openclaw`   | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接 | 讓支援 ACP 的執行框架回頭與 OpenClaw Gateway 工作階段通訊。                 |
| `qoder`      | Qoder 命令列介面                                      | 轉接器可用性和模型控制取決於已安裝的命令列介面。                 |
| `qwen`       | Qwen Code / Qwen 命令列介面                           | 需要主機上的 Qwen 相容驗證。                                          |
| `trae`       | Trae 命令列介面 ACP 轉接器                           | 轉接器可用性和模型控制取決於已安裝的命令列介面。                 |

`pi` (pi-acp) 也已在 acpx 後端中註冊，但它與上方其他項目
並不是同樣意義上的程式碼執行框架。

可在 acpx 本身設定自訂 acpx 代理別名，但 OpenClaw
政策在派送前仍會檢查 `acp.allowedAgents` 和任何
`agents.list[].runtime.acp.agent` 對應。

## 操作者執行手冊

從聊天快速使用 `/acp` 流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已繫結的對話或討論串中繼續（或明確指定工作階段金鑰）。
  </Step>
  <Step title="檢查狀態">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`、`/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引導">
    不替換內容脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 產生會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存中記錄 ACP 中繼資料，並可能在執行由父層擁有時建立背景任務。
    - 父層擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是持續性的；完成和跨介面傳遞會透過父層任務通知器進行，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉終止或孤立的父層擁有一次性 ACP 工作階段。持續性 ACP 工作階段會在仍有作用中對話繫結時保留；沒有作用中繫結的過期持續性工作階段會被關閉，使其無法在擁有者任務完成或其任務記錄消失後被靜默恢復。
    - 已繫結的後續訊息會直接傳送到 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或過期。
    - Gateway 命令會保留在本機。`/acp ...`、`/status` 和 `/unfocus` 絕不會作為一般提示文字傳送到已繫結的 ACP 執行框架。
    - 後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除繫結或工作階段中繼資料。
    - 從 OpenClaw 的角度來看，`close` 會結束 ACP 工作階段並移除繫結。如果執行框架支援恢復，它仍可能保留自己的上游歷史。
    - acpx 外掛會在 `close` 後清理 OpenClaw 擁有的包裝器和轉接器程序樹，並在 Gateway 啟動期間回收過期的 OpenClaw 擁有 ACPX 孤立程序。
    - 閒置的執行階段工作器可在 `acp.runtime.ttlMinutes` 後清理；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    啟用時應路由到**原生 Codex 外掛**的自然語言觸發：

    -「將此 Discord 頻道繫結到 Codex。」
    -「將此聊天附加到 Codex 討論串 `<id>`。」
    -「顯示 Codex 討論串，然後繫結這個。」

    原生 Codex 對話綁定是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而 Codex 原生
    工具（例如 shell/apply-patch）則在 Codex 內執行。對於 Codex 原生
    工具事件，OpenClaw 會注入每回合的原生 hook 中繼，讓外掛 hook
    可以封鎖 `before_tool_call`、觀察 `after_tool_call`，並透過 OpenClaw 核准流程路由 Codex
    `PermissionRequest` 事件。Codex `Stop` hook
    會中繼至 OpenClaw `before_agent_finalize`，外掛可在該處要求
    再進行一次模型傳遞，然後 Codex 才完成其回答。此中繼刻意保持保守：
    它不會改變 Codex 原生工具引數，
    也不會重寫 Codex 執行緒記錄。只有在你想要
    ACP 執行階段/工作階段模型時才使用明確的 ACP。內嵌 Codex 支援邊界
    記錄於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 供應商 / 執行階段選擇速查表">
    - 舊版 Codex 模型參照 - 舊版 Codex OAuth/訂閱模型路由由 doctor 修復。
    - `openai/*` - 用於 OpenAI agent 回合的原生 Codex app-server 內嵌執行階段。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由至 ACP 執行階段的觸發條件：

    - "以一次性 Claude Code ACP 工作階段執行此項，並摘要結果。"
    - "為此任務在一個執行緒中使用 Gemini CLI，然後將後續追問保留在同一個執行緒中。"
    - "透過 ACP 在背景執行緒中執行 Codex。"

    OpenClaw 會選取 `runtime: "acp"`、解析 harness `agentId`，
    在支援時綁定至目前對話或執行緒，並將後續追問路由
    到該工作階段，直到關閉/到期為止。只有在
    ACP/acpx 為明確指定，或原生 Codex 外掛不適用於
    所要求的操作時，Codex 才會走這條路徑。

    對於 `sessions_spawn`，只有在 ACP 已啟用、
    請求者未被沙盒化，且 ACP 執行階段後端已載入時，才會宣告 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 會暫停自動 ACP 執行緒分派，
    但不會隱藏或封鎖明確的 `sessions_spawn({ runtime: "acp" })`
    呼叫。它的目標是 ACP harness id，例如 `codex`、`claude`、`droid`、
    `gemini` 或 `opencode`。除非該項目明確設定了
    `agents.list[].runtime.type="acp"`，否則不要傳入
    來自 `agents_list` 的一般 OpenClaw 設定 agent id；請改用預設子代理
    執行階段。當 OpenClaw agent 設定了
    `runtime.type="acp"` 時，OpenClaw 會使用 `runtime.acp.agent` 作為底層
    harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理

當你想要外部 harness 執行階段時使用 ACP。當 `codex` 外掛
已啟用，且你需要 Codex 對話綁定/控制時，使用 **原生 Codex
app-server**。當你想要 OpenClaw 原生委派執行時，使用 **子代理**。

| 區域          | ACP 工作階段                           | 子代理執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端外掛（例如 acpx） | OpenClaw 原生子代理執行階段  |
| 工作階段鍵   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | 帶有 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 執行 Claude Code 時，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段外掛。
3. Claude ACP 轉接器。
4. Claude 端執行階段/工作階段機制。

ACP Claude 是一個具備 ACP 控制、工作階段恢復、
背景任務追蹤，以及可選對話/執行緒綁定的 **harness 工作階段**。

命令列介面後端是獨立的純文字 local fallback 執行階段 - 請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對於操作者，實務規則是：

- **想要 `/acp spawn`、可綁定工作階段、執行階段控制，或持久 harness 工作？** 使用 ACP。
- **想要透過原始命令列介面進行簡單的本機文字後援？** 使用命令列介面後端。

## 已綁定工作階段

### 心智模型

- **聊天介面** - 人們持續對話的地方（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** - OpenClaw 路由至其中的持久 Codex/Claude/Gemini 執行階段狀態。
- **子執行緒/主題** - 僅由 `--thread ...` 建立的可選額外訊息介面。
- **執行階段工作區** - harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。與聊天介面彼此獨立。

### 目前對話綁定

`/acp spawn <harness> --bind here` 會將目前對話釘選到
新產生的 ACP 工作階段 - 不建立子執行緒，使用相同聊天介面。OpenClaw 保持
擁有傳輸、驗證、安全性和遞送。該對話中的後續訊息
會路由至同一個工作階段；`/new` 和 `/reset` 會在原處重設工作階段；
`/acp close` 會移除綁定。

範例：

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="綁定規則與排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於宣告支援目前對話綁定的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。綁定會在閘道重新啟動後持續存在。
    - 在 Discord 上，`spawnSessions` 會管控 `--thread auto|here` 的子執行緒建立 - 不管控 `--bind here`。
    - 如果你在沒有 `--cwd` 的情況下產生到不同的 ACP agent，OpenClaw 預設會繼承 **目標 agent 的** 工作區。遺失的繼承路徑（`ENOENT`/`ENOTDIR`）會退回到後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - 閘道管理命令在已綁定對話中保持本機處理 - 即使一般後續文字會路由到已綁定的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 和 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="執行緒綁定工作階段">
    當頻道轉接器已啟用執行緒綁定時：

    - OpenClaw 會將一個執行緒綁定至目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由至已綁定的 ACP 工作階段。
    - ACP 輸出會傳回同一個執行緒。
    - 取消聚焦/關閉/封存/閒置逾時或最大期限到期會移除綁定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是閘道命令，不是傳給 ACP harness 的提示。

    執行緒綁定 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 執行緒分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道轉接器執行緒工作階段產生（預設：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    執行緒綁定支援取決於轉接器。如果作用中的頻道轉接器
    不支援執行緒綁定，OpenClaw 會回傳清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援執行緒的頻道">
    - 任何公開工作階段/執行緒綁定能力的頻道轉接器。
    - 目前內建支援：**Discord** 執行緒/頻道、**Telegram** 主題（群組/超級群組中的論壇主題，以及 DM 主題）。
    - 外掛頻道可透過相同綁定介面加入支援。

  </Accordion>
</AccordionGroup>

## 持久頻道綁定

對於非臨時工作流程，請在頂層
`bindings[]` 項目中設定持久 ACP 綁定。

### 綁定模型

<ParamField path="bindings[].type" type='"acp"'>
  標示持久 ACP 對話綁定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀如下：

- **Discord 頻道/執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道/DM：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。偏好使用穩定的 Slack id；頻道綁定也會比對該頻道執行緒內的回覆。
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/群組：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 E.164 號碼，例如 `+15555550123`；群組請使用 WhatsApp 群組 JID，例如 `120363424282127706@g.us`。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定群組綁定偏好使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有此綁定的 OpenClaw agent id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可選 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可選的面向操作者標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可選執行階段工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可選後端覆寫。
</ParamField>

### 每個 agent 的執行階段預設值

使用 `agents.list[].runtime` 為每個 agent 定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 已綁定工作階段的覆寫優先順序：**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. 全域 ACP 預設值（例如 `acp.backend`）

### 範例

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### 行為

- OpenClaw 會確保已設定的 ACP 工作階段在特定頻道准入之後、使用之前存在。
- 該頻道、主題或聊天中的訊息會路由到已設定的 ACP 工作階段。
- 已設定的 ACP 綁定擁有其工作階段路由。頻道廣播扇出不會取代相符綁定已設定的 ACP 工作階段。
- 在已綁定的對話中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段金鑰。
- 暫時執行階段綁定（例如由討論串聚焦流程建立的綁定）在存在時仍會套用。
- 對於沒有明確 `cwd` 的跨代理 ACP 啟動，OpenClaw 會從代理設定繼承目標代理工作區。
- 缺少繼承工作區路徑時，會回退到後端預設 cwd；非缺少造成的存取失敗會顯示為啟動錯誤。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

<Tabs>
  <Tab title="From sessions_spawn">
    使用 `runtime: "acp"` 從代理回合或工具呼叫啟動 ACP 工作階段。

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 預設為 `subagent`，因此 ACP 工作階段請明確設定 `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用 `acp.defaultAgent`。`mode: "session"` 需要 `thread: true` 才能保留持久綁定對話。
    </Note>

  </Tab>
  <Tab title="From /acp command">
    使用 `/acp spawn` 從聊天中進行明確的操作員控制。

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    主要旗標：

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    請參閱 [Slash commands](/zh-TW/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 參數

<ParamField path="task" type="string" required>
  傳送至 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須為 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標執行框架 ID。如果已設定，會回退到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的位置請求討論串綁定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久。若為 `thread: true` 且省略 `mode`，OpenClaw 可能會依執行階段路徑預設為持久行為。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  請求的執行階段工作目錄（由後端/執行階段政策驗證）。若省略，ACP 啟動會在已設定時繼承目標代理工作區；缺少繼承路徑時會回退到後端預設值，而實際存取錯誤會被傳回。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段/橫幅文字的操作員可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢復既有 ACP 工作階段，而不是建立新工作階段。代理會透過 `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回請求者工作階段。接受的回應包含指向工作階段範圍 JSONL 記錄的 `streamLogPath`（`<sessionId>.acp-stream.jsonl`），你可以追蹤它以取得完整轉送歷史。除非 `streaming.progress.commentary=false`，否則父層進度串流預設會顯示助理註解和 ACP 狀態進度。當未設定串流模式時，Discord 也會預設將父層預覽設為進度模式。狀態進度仍會遵循 `acp.stream.tagVisibility`，因此除非明確啟用，否則 `plan` 等標籤仍會保持隱藏。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds` 作為其預設子回合限制。此工具不接受每次呼叫的逾時覆寫（`runTimeoutSeconds`/`timeoutSeconds` 會因 config-the-default 錯誤而被拒絕）。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 啟動會在 `session/new` 前，將 `openai/gpt-5.4` 等 OpenAI 參照正規化為 Codex ACP 啟動設定；`openai/gpt-5.4/high` 等斜線形式也會設定 Codex ACP 推理強度。省略時，若已設定，`sessions_spawn({ runtime: "acp" })` 會使用既有子代理模型預設值（`agents.defaults.subagents.model` 或 `agents.list[].subagents.model`）；否則會讓 ACP 執行框架使用自己的預設模型。其他執行框架必須公告 ACP `models` 並支援 `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是靜默回退到目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對於 Codex ACP，`minimal` 會對應到低強度，`low`/`medium`/`high`/`xhigh` 會直接對應，而 `off` 會省略推理強度啟動覆寫。省略時，ACP 啟動會針對所選模型使用既有子代理思考預設值，以及每個模型的 `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 啟動綁定與討論串模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 就地綁定目前作用中的對話；若沒有作用中對話則失敗。 |
    | `off`  | 不建立目前對話綁定。                          |

    注意事項：

    - `--bind here` 是「讓此頻道或聊天由 Codex 支援」最簡單的操作員路徑。
    - `--bind here` 不會建立子討論串。
    - `--bind here` 只適用於公開目前對話綁定支援的頻道。
    - `--bind` 和 `--thread` 不能在同一次 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中討論串中：綁定該討論串。在討論串外：在支援時建立/綁定子討論串。 |
    | `here` | 需要目前作用中的討論串；若不在討論串中則失敗。                                                  |
    | `off`  | 不綁定。工作階段會以未綁定狀態啟動。                                                                 |

    注意事項：

    - 在非討論串綁定介面上，預設行為實際上是 `off`。
    - 討論串綁定啟動需要頻道政策支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子討論串時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    互動式工作階段旨在於可見聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話綁定到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道討論串/主題綁定到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    已綁定對話中的後續訊息會直接路由到 ACP 工作階段，而 ACP 輸出會傳遞回同一個頻道/討論串/主題。

    OpenClaw 傳送給執行框架的內容：

    - 一般已綁定後續訊息會以提示文字傳送，只有在執行框架/後端支援時才會附加附件。
    - `/acp` 管理命令和本機 Gateway 命令會在 ACP 分派之前被攔截。
    - 執行階段產生的完成事件會依目標實體化。OpenClaw 代理會取得 OpenClaw 的內部執行階段內容封套；外部 ACP 執行框架會取得包含子結果與指示的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封套絕不應傳送給外部執行框架，也不應作為 ACP 使用者轉錄文字持久化。
    - ACP 轉錄項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    由另一個代理執行啟動的一次性 ACP 工作階段，是類似子代理的背景子項：

    - 父層會使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子項會在自己的 ACP 執行框架工作階段中執行。
    - 子回合會在原生子代理啟動使用的同一個背景通道上執行，因此緩慢的 ACP 執行框架不會封鎖不相關的主工作階段工作。
    - 完成會透過任務完成公告路徑回報。OpenClaw 會先將內部完成中繼資料轉換為純 ACP 提示，再傳送給外部執行框架，因此執行框架不會看到僅供 OpenClaw 使用的執行階段內容標記。
    - 當適合產生面向使用者的回覆時，父層會以一般助理語氣重寫子項結果。

    請**不要**將此路徑視為父層與子項之間的點對點聊天。子項已經有回到父層的完成通道。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` 可以在啟動後指定另一個工作階段。對於一般對等工作階段，OpenClaw 會在注入訊息後使用代理對代理（A2A）後續路徑：

    - 等待目標工作階段的回覆。
    - 可選擇讓請求者與目標交換有界數量的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見頻道或討論串。

    該 A2A 路徑是對等傳送的後備機制，適用於傳送方需要可見後續回覆的情況。當無關的工作階段可以看到 ACP 目標並向其傳送訊息時，它會保持啟用，例如在寬鬆的 `tools.sessions.visibility` 設定下。

    OpenClaw 只會在請求者是其自身父層所擁有的一次性 ACP 子項的父層時，略過 A2A 後續回覆。在這種情況下，在任務完成之上執行 A2A 可能會用子項的結果喚醒父層、將父層的回覆轉發回子項，並建立父層/子項回音迴圈。`sessions_send` 結果會針對該擁有子項的情況回報 `delivery.status="skipped"`，因為完成路徑已經負責處理結果。

  </Accordion>
  <Accordion title="繼續現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是重新開始。代理程式會透過 `session/load` 重放其對話歷程，因此會帶著先前內容的完整脈絡接續。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從你的筆電交接到你的手機 - 告訴你的代理程式從你離開的地方接續。
    - 繼續你先前在命令列介面中以互動方式啟動的編碼工作階段，現在透過你的代理程式以無頭模式執行。
    - 接續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理程式執行階段會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理程式執行階段會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機 ACP/harness 繼續識別碼，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 仍會在分派前檢查 ACP 產生政策與目標代理程式政策，而 ACP 後端或 harness 擁有載入該上游識別碼的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷程；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段識別碼，產生會以明確錯誤失敗 - 不會靜默後備到新的工作階段。

  </Accordion>
  <Accordion title="部署後煙霧測試">
    閘道部署後，請執行即時端對端檢查，而不是信任單元測試：

    1. 驗證目標主機上已部署的閘道版本和提交。
    2. 開啟一個通往即時代理程式的暫時 ACPX 橋接工作階段。
    3. 要求該代理程式呼叫 `sessions_spawn`，並帶上 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任務 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    將閘門保持在 `mode: "run"`，並略過 `streamTo: "parent"` -
    綁定執行緒的 `mode: "session"` 和串流轉送路徑是另外更豐富的整合驗證。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機執行階段上執行，**不是**在 OpenClaw
沙箱內執行。

<Warning>
**安全邊界：**

- 外部 harness 可依其自身命令列介面權限與所選 `cwd` 讀取/寫入。
- OpenClaw 的沙箱政策**不會**包裹 ACP harness 執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理程式、工作階段所有權、頻道繫結，以及閘道傳遞政策。
- 使用 `runtime: "subagent"` 來執行由沙箱強制保護的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段受沙箱限制，ACP 產生會對 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn` 兩者都被封鎖。
- 帶有 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作接受選用的工作階段目標（`session-key`、`session-id` 或 `session-label`）。

**解析順序：**

1. 明確目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試金鑰
   - 然後嘗試 UUID 形式的工作階段識別碼
   - 然後嘗試標籤
2. 目前執行緒繫結（如果此對話/執行緒已繫結至 ACP 工作階段）。
3. 目前請求者工作階段後備。

目前對話繫結和執行緒繫結都會參與步驟 2。

如果無法解析任何目標，OpenClaw 會傳回明確錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段正在進行的回合。                          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將導引指令傳送到執行中的工作階段。                        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項、能力。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                          | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                                  | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                            | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存列出最近的 ACP 工作階段。                           | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、能力、可執行修復。                          | `/acp doctor`                                                 |
| `/acp install`       | 列印決定性的安裝與啟用步驟。                              | `/acp install`                                                |

執行階段控制項（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 和 `reset-options`）需要
外部頻道的擁有者身分，以及內部閘道用戶端的 `operator.admin`。已授權的非擁有者傳送者仍可使用 `sessions`、
`doctor`、`install` 和 `help`。

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級與
後端層級的工作階段識別碼。當後端缺少某項能力時，不支援控制項的錯誤會明確呈現。`/acp sessions` 會讀取目前繫結或請求者工作階段的儲存；目標權杖（`session-key`、
`session-id` 或 `session-label`）會透過閘道工作階段探索解析，
包括自訂的每代理程式 `session.store` 根目錄。

### 執行階段選項對應

`/acp` 有便利命令和通用設定器。等效操作：

| 命令                         | 對應到                               | 注意事項                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 執行階段設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為配接器模型識別碼，並將斜線推理尾碼（例如 `openai/gpt-5.4/high`）對應到 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 標準選項 `thinking`                  | 當存在時，OpenClaw 會傳送後端公告的等效項，優先使用 `thinking`，然後是 `effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，配接器會將值對應到 `reasoning_effort`。 |
| `/acp permissions <profile>` | 標準選項 `permissionProfile`         | 當存在時，OpenClaw 會傳送後端公告的等效項，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                                                   |
| `/acp timeout <seconds>`     | 標準選項 `timeoutSeconds`            | 當存在時，OpenClaw 會傳送後端公告的等效項，例如 `timeout` 或 `timeout_seconds`。                                                                                                                                |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                                                      |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆寫路徑。                                                                                                                                                                                   |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | -                                                                                                                                                                                                               |

## acpx harness、外掛設定與權限

如需 acpx harness 設定（Claude Code / Codex / Gemini 命令列介面別名）、
plugin-tools 和 OpenClaw-tools MCP 橋接，以及 ACP 權限模式，
請參閱 [ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                                   | 可能原因                                                                                                           | 修正方式                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | 後端外掛遺失、已停用，或被 `plugins.allow` 封鎖。                                                       | 安裝並啟用後端外掛；若已設定該允許清單，請在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP 已全域停用。                                                                                                 | 設定 `acp.enabled=true`。                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 已停用從一般對話串訊息自動分派。                                                               | 設定 `acp.dispatch.enabled=true` 以恢復自動對話串路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Agent 不在允許清單中。                                                                                                | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                     |
| `/acp doctor` 在啟動後立即回報後端尚未就緒                               | 後端外掛遺失、已停用、被允許/拒絕政策封鎖，或其設定的可執行檔無法使用。        | 安裝/啟用後端外掛，重新執行 `/acp doctor`；若仍不健康，請檢查後端安裝或政策錯誤。                                           |
| 找不到 harness 命令                                                                 | 配接器命令列介面未安裝、外部外掛遺失，或非 Codex 配接器的首次執行 `npx` 擷取失敗。 | 執行 `/acp doctor`，在閘道主機上安裝/預熱配接器，或明確設定 acpx agent 命令。                                                      |
| harness 傳回找不到模型                                                          | 模型 ID 對另一個供應商/harness 有效，但不適用於此 ACP 目標。                                                | 使用該 harness 列出的模型、在 harness 中設定模型，或省略覆寫。                                                                            |
| harness 傳回供應商驗證錯誤                                                        | OpenClaw 狀態正常，但目標命令列介面/供應商尚未登入。                                                     | 在閘道主機環境中登入或提供所需的供應商金鑰。                                                                                             |
| `Unable to resolve session target: ...`                                                   | 金鑰/ID/標籤 token 錯誤。                                                                                                | 執行 `/acp sessions`，複製精確的金鑰/標籤，然後重試。                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 在沒有可繫結的作用中對話時使用了 `--bind here`。                                                            | 移至目標聊天/頻道後重試，或使用未繫結的 spawn。                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | 配接器缺少目前對話的 ACP 繫結能力。                                                             | 在支援時使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 在對話串情境之外使用了 `--thread here`。                                                                         | 移至目標對話串，或使用 `--thread auto`/`off`。                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 另一位使用者擁有作用中的繫結目標。                                                                           | 以擁有者身分重新繫結，或使用不同的對話或對話串。                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | 配接器缺少對話串繫結能力。                                                                               | 使用 `--thread off`，或移至支援的配接器/頻道。                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP runtime 位於主機端；請求者工作階段已沙箱化。                                                              | 從沙箱化工作階段使用 `runtime="subagent"`，或從非沙箱化工作階段執行 ACP spawn。                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | 已為 ACP runtime 請求 `sandbox="require"`。                                                                         | 對必要的沙箱化使用 `runtime="subagent"`，或從非沙箱化工作階段搭配 `sandbox="inherit"` 使用 ACP。                                                      |
| `Cannot apply --model ... did not advertise model support`                                | 目標 harness 未公開通用 ACP 模型切換。                                                        | 使用宣告 ACP `models`/`session/set_model` 的 harness、使用 Codex ACP 模型參照，或如果 harness 有自己的啟動旗標，直接在 harness 中設定模型。 |
| 已繫結工作階段缺少 ACP metadata                                                    | ACP 工作階段 metadata 已過期/刪除。                                                                                    | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦對話串。                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非互動式 ACP 工作階段中封鎖寫入/執行。                                                    | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。 |
| ACP 工作階段很早失敗且輸出很少                                                | 權限提示被 `permissionMode`/`nonInteractivePermissions` 封鎖。                                        | 檢查 gateway logs 中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。        |
| ACP 工作階段在完成工作後無限期停滯                                     | Harness 程序已完成，但 ACP 工作階段未回報完成。                                                    | 更新 OpenClaw；目前的 acpx 清理會在關閉與閘道啟動時，回收 OpenClaw 擁有的過期 wrapper 與配接器程序。                                             |
| Harness 看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | 內部事件 envelope 洩漏到 ACP 邊界外。                                                                | 更新 OpenClaw 並重新執行完成流程；外部 harness 應只會收到純文字完成提示。                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex hook 轉送，不屬於 ACP/acpx。在已繫結的 Codex 聊天中，使用 `/new`
或 `/reset` 開始新的工作階段；如果它成功一次，然後在下一次原生工具呼叫時再次出現，
請重新啟動 Codex app-server 或 OpenClaw 閘道，而不是重複執行 `/new`。請參閱
[Codex harness 疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
</Note>

## 相關

- [ACP agents - 設定](/zh-TW/tools/acp-agents-setup)
- [Agent 傳送](/zh-TW/tools/agent-send)
- [命令列介面後端](/zh-TW/gateway/cli-backends)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [多 agent 沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子 agent](/zh-TW/tools/subagents)
