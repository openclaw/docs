---
read_when:
    - 透過 ACP 執行編碼框架
    - 在訊息通道上設定對話綁定的 ACP 工作階段
    - 將訊息通道對話綁定至持久 ACP 工作階段
    - 疑難排解 ACP 後端、Plugin 串接或補全傳遞
    - 從聊天中操作 /acp 指令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼編寫工具（Claude Code、Cursor、Gemini CLI、明確的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-05-07T13:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端 Plugin 執行外部編碼執行框架（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX 執行框架）。

每個 ACP 工作階段的產生都會追蹤為一個[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部執行框架路徑，不是預設的 Codex 路徑。** 
原生 Codex app-server Plugin 擁有 `/codex ...` 控制項和
`agentRuntime.id: "codex"` 嵌入式執行階段；ACP 擁有
`/acp ...` 控制項和 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 以外部 MCP 用戶端身分
直接連線到現有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我該看哪個頁面？

| 你想要…                                                                                         | 使用這個                              | 備註                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 啟用 `codex` Plugin 時的原生 Codex app-server 路徑；包含已繫結的聊天回覆、圖片轉發、模型/快速/權限、停止和導引控制。ACP 是明確的備用方案 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部執行框架                | 本頁                                  | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                                   |
| 將 OpenClaw Gateway 工作階段作為 ACP 伺服器公開給編輯器或用戶端                                 | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 對 OpenClaw 說 ACP                                                                                                                            |
| 重用本機 AI CLI 作為純文字備用模型                                                              | [CLI 後端](/zh-TW/gateway/cli-backends) | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有執行框架執行階段                                                                                                                               |

## 這可以開箱即用嗎？

可以，安裝官方 ACP 執行階段 Plugin 後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可以在 `pnpm install` 後使用本機
`extensions/acpx` 工作區 Plugin。執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只有在 ACP **真正可用**時才會教代理程式有關 ACP 產生：
ACP 必須已啟用、分派不得停用、目前工作階段不得被沙箱封鎖，
而且必須載入執行階段後端。如果不符合這些條件，ACP Plugin Skills 和
`sessions_spawn` ACP 指引會保持隱藏，避免代理程式建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的 Plugin 清單，且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意封鎖，而 `/acp doctor` 會回報缺少允許清單項目。
    - Codex ACP 配接器會隨 `acpx` Plugin 暫存，並在可行時於本機啟動。
    - Codex ACP 會使用隔離的 `CODEX_HOME` 執行；OpenClaw 只會從主機 Codex 設定複製受信任的專案項目並信任作用中的工作區，而將驗證、通知和 hooks 留在主機設定上。
    - 其他目標執行框架配接器在你第一次使用時，可能仍會依需求以 `npx` 擷取。
    - 該執行框架的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取權，首次執行的配接器擷取會失敗，直到快取已預熱或配接器以其他方式安裝為止。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部執行框架程序。OpenClaw 擁有路由、
    背景任務狀態、傳遞、繫結和政策；執行框架擁有其供應商登入、
    模型目錄、檔案系統行為和原生工具。

    在怪罪 OpenClaw 之前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 設定允許清單時，目標 id 受到 `acp.allowedAgents` 允許。
    - 執行框架命令可以在 Gateway 主機上啟動。
    - 該執行框架的供應商驗證已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該執行框架中 - 模型 id 不能跨執行框架通用。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此大量寫入/執行的編碼執行通常需要能夠無人值守繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 工具和內建 OpenClaw 工具預設**不會**公開給
ACP 執行框架。只有在執行框架應直接呼叫這些工具時，才啟用
[ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的執行框架目標

使用 `acpx` 後端時，請將這些執行框架 id 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 執行框架 id | 典型後端                                       | 備註                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 配接器                         | 需要主機上的 Claude Code 驗證。                                              |
| `codex`    | Codex ACP 配接器                               | 僅在原生 `/codex` 不可用或要求 ACP 時，作為明確 ACP 備用方案。 |
| `copilot`  | GitHub Copilot ACP 配接器                      | 需要 Copilot CLI/執行階段驗證。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。    |
| `droid`    | Factory Droid CLI                              | 需要執行框架環境中的 Factory/Droid 驗證或 `FACTORY_API_KEY`。        |
| `gemini`   | Gemini CLI ACP 配接器                          | 需要 Gemini CLI 驗證或 API 金鑰設定。                                          |
| `iflow`    | iFlow CLI                                      | 配接器可用性和模型控制取決於已安裝的 CLI。                 |
| `kilocode` | Kilo Code CLI                                  | 配接器可用性和模型控制取決於已安裝的 CLI。                 |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                            |
| `kiro`     | Kiro CLI                                       | 配接器可用性和模型控制取決於已安裝的 CLI。                 |
| `opencode` | OpenCode ACP 配接器                            | 需要 OpenCode CLI/供應商驗證。                                                |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接   | 讓具備 ACP 感知能力的執行框架回頭與 OpenClaw Gateway 工作階段對話。                 |
| `pi`       | Pi/嵌入式 OpenClaw 執行階段                    | 用於 OpenClaw 原生執行框架實驗。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主機上的 Qwen 相容驗證。                                          |

自訂 acpx 代理程式別名可以在 acpx 本身中設定，但 OpenClaw
政策在分派前仍會檢查 `acp.allowedAgents` 和任何
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
    在已繫結的對話或執行緒中繼續（或明確指定工作階段
    key）。
  </Step>
  <Step title="檢查狀態">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`。
  </Step>
  <Step title="導引">
    不取代內容脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 產生會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存區記錄 ACP metadata，並且在執行由父項擁有時可能建立背景任務。
    - 父項擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是持久的；完成和跨介面傳遞會透過父任務通知器進行，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉終端或孤立的父項擁有一次性 ACP 工作階段。持久 ACP 工作階段會在仍有作用中對話繫結時保留；沒有作用中繫結的過期持久工作階段會被關閉，避免在擁有任務完成或其任務記錄消失後被靜默恢復。
    - 已繫結的後續訊息會直接傳送到 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或過期。
    - Gateway 命令會留在本機。`/acp ...`、`/status` 和 `/unfocus` 永遠不會作為一般提示文字傳送給已繫結的 ACP 執行框架。
    - 後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除繫結或工作階段 metadata。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。如果執行框架支援恢復，它可能仍會保留自己的上游歷史。
    - acpx Plugin 會在 `close` 後清理 OpenClaw 擁有的包裝器和配接器程序樹，並在 Gateway 啟動期間收割過期的 OpenClaw 擁有 ACPX 孤兒程序。
    - 閒置的執行階段 worker 在 `acp.runtime.ttlMinutes` 後符合清理資格；已儲存的工作階段 metadata 仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    當啟用時，應路由至**原生 Codex
    Plugin** 的自然語言觸發：

    - 「將這個 Discord 頻道繫結到 Codex。」
    - 「將這個聊天附加到 Codex 執行緒 `<id>`。」
    - 「顯示 Codex 執行緒，然後繫結這一個。」

    原生 Codex 對話綁定是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合的原生
    hook relay，讓 Plugin hook 可以封鎖 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hook 會轉送到
    OpenClaw `before_agent_finalize`，Plugin 可在其中要求多一次
    模型回合，然後 Codex 才完成其回答。relay 仍刻意保持
    保守：它不會變更 Codex 原生工具
    引數，也不會重寫 Codex 執行緒記錄。只有在你想要 ACP runtime/session 模型時，
    才使用明確的 ACP。嵌入式 Codex
    支援邊界記載於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供者 / runtime 選擇速查表">
    - `openai-codex/*` - 由 doctor 修復的舊版 Codex OAuth/訂閱模型路由。
    - `openai/*` - 用於 OpenAI agent 回合的原生 Codex app-server 嵌入式 runtime。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由至 ACP runtime 的觸發條件：

    - "以一次性 Claude Code ACP 工作階段執行這個，並摘要結果。"
    - "在執行緒中使用 Gemini CLI 處理這項任務，然後將後續追蹤保留在同一個執行緒中。"
    - "透過 ACP 在背景執行緒中執行 Codex。"

    OpenClaw 會選擇 `runtime: "acp"`、解析 harness `agentId`，
    在支援時綁定到目前對話或執行緒，並
    將後續追蹤路由至該工作階段，直到關閉/過期為止。Codex 只有在 ACP/acpx 為明確指定，
    或原生 Codex
    Plugin 不適用於所要求的操作時，才會走這條路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、請求者未被沙箱化，且 ACP runtime
    後端已載入時，才會公告 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停自動
    ACP 執行緒分派，但不會隱藏或封鎖明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它的目標是 ACP harness id，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非來自 `agents_list` 的一般
    OpenClaw 設定 agent id 中的項目已明確設定為
    `agents.list[].runtime.type="acp"`，
    否則不要傳入；請改用預設的 sub-agent runtime。當 OpenClaw agent
    設定了 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與 sub-agents

當你想要外部 harness runtime 時，請使用 ACP。當 `codex`
Plugin 已啟用，且你需要 Codex 對話綁定/控制時，請使用 **原生 Codex
app-server**。當你想要 OpenClaw 原生
委派執行時，請使用 **sub-agents**。

| 領域          | ACP 工作階段                           | Sub-agent 執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP 後端 Plugin（例如 acpx） | OpenClaw 原生 sub-agent runtime  |
| 工作階段金鑰   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | 帶有 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設 runtime） |

另請參閱 [Sub-agents](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

對於透過 ACP 使用 Claude Code，堆疊為：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` runtime Plugin。
3. Claude ACP adapter。
4. Claude 端 runtime/session 機制。

ACP Claude 是具備 ACP 控制、工作階段續用、
背景任務追蹤，以及選用對話/執行緒綁定的 **harness 工作階段**。

CLI 後端是獨立的純文字本機後援 runtime - 請參閱
[CLI 後端](/zh-TW/gateway/cli-backends)。

對操作員而言，實務規則是：

- **想要 `/acp spawn`、可綁定工作階段、runtime 控制，或持久 harness 工作嗎？** 使用 ACP。
- **想要透過原始 CLI 進行簡單的本機文字後援嗎？** 使用 CLI 後端。

## 已綁定工作階段

### 心智模型

- **聊天介面** - 人們持續交談的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** - OpenClaw 會路由到的持久 Codex/Claude/Gemini runtime 狀態。
- **子執行緒/主題** - 僅由 `--thread ...` 建立的選用額外訊息介面。
- **Runtime 工作區** - harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。它與聊天介面彼此獨立。

### 目前對話綁定

`/acp spawn <harness> --bind here` 會將目前對話釘選到
產生的 ACP 工作階段 - 不建立子執行緒，維持相同聊天介面。OpenClaw 持續
掌管傳輸、驗證、安全與傳遞。該
對話中的後續訊息會路由至同一個工作階段；`/new` 和 `/reset` 會就地重設
工作階段；`/acp close` 會移除綁定。

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
    - `--bind here` 只適用於公告目前對話綁定能力的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。綁定會在 Gateway 重新啟動後保留。
    - 在 Discord 上，`spawnSessions` 會控管 `--thread auto|here` 的子執行緒建立 - 不控管 `--bind here`。
    - 如果你在未指定 `--cwd` 的情況下產生到不同 ACP agent，OpenClaw 預設會繼承**目標 agent 的**工作區。缺少繼承路徑（`ENOENT`/`ENOTDIR`）會後援到後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - Gateway 管理命令會在已綁定對話中保持本機處理 - 即使一般後續文字路由到已綁定的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 和 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="執行緒綁定工作階段">
    當頻道 adapter 啟用執行緒綁定時：

    - OpenClaw 會將執行緒綁定到目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由到已綁定的 ACP 工作階段。
    - ACP 輸出會傳回同一個執行緒。
    - 取消聚焦/關閉/封存/閒置逾時或最大年限過期會移除綁定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 命令，不是傳給 ACP harness 的提示。

    執行緒綁定 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 執行緒分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 頻道 adapter 執行緒工作階段產生已啟用（預設：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    執行緒綁定支援依 adapter 而異。如果作用中的頻道
    adapter 不支援執行緒綁定，OpenClaw 會回傳清楚的
    不支援/無法使用訊息。

  </Accordion>
  <Accordion title="支援執行緒的頻道">
    - 任何公開 session/thread 綁定能力的頻道 adapter。
    - 目前內建支援：**Discord** 執行緒/頻道、**Telegram** 主題（群組/超級群組中的論壇主題與 DM 主題）。
    - Plugin 頻道可透過相同的綁定介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久頻道綁定

對於非短暫工作流程，請在
頂層 `bindings[]` 項目中設定持久 ACP 綁定。

### 綁定模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話綁定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀：

- **Discord 頻道/執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/群組：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定群組綁定偏好使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定群組綁定偏好使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有者 OpenClaw agent id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的操作員可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用 runtime 工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用後端覆寫。
</ParamField>

### 每個 agent 的 Runtime 預設值

使用 `agents.list[].runtime` 為每個 agent 一次定義 ACP 預設值：

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

- OpenClaw 會在使用前確保已設定的 ACP 工作階段存在。
- 該頻道或主題中的訊息會路由到已設定的 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設相同的 ACP 工作階段鍵。
- 暫時性的執行階段繫結（例如由執行緒焦點流程建立的繫結）在存在時仍會套用。
- 對於沒有明確 `cwd` 的跨代理程式 ACP 衍生，OpenClaw 會從代理程式設定繼承目標代理程式工作區。
- 缺少繼承的工作區路徑時會退回後端預設 cwd；非缺失的存取失敗會以衍生錯誤呈現。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

<Tabs>
  <Tab title="從 sessions_spawn">
    使用 `runtime: "acp"` 從代理程式回合或工具呼叫啟動 ACP 工作階段。

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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段請明確設定 `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用 `acp.defaultAgent`。`mode: "session"` 需要 `thread: true`，才能保留持久繫結對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 命令">
    從聊天中使用 `/acp spawn` 進行明確的操作者控制。

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

    請參閱 [Slash 命令](/zh-TW/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 參數

<ParamField path="task" type="string" required>
  傳送給 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須是 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標框架 id。若已設定，會退回到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援時請求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久式。如果 `thread: true` 且省略 `mode`，OpenClaw 可能會依執行階段路徑預設為持久行為。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  請求的執行階段工作目錄（由後端／執行階段政策驗證）。如果省略，ACP 衍生會在已設定時繼承目標代理程式工作區；缺少繼承路徑時會退回後端預設值，而實際存取錯誤會被傳回。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段／橫幅文字、面向操作者的標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續現有 ACP 工作階段，而不是建立新的工作階段。代理程式會透過 `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回請求者工作階段。接受的回應包含 `streamLogPath`，指向工作階段範圍的 JSONL 記錄（`<sessionId>.acp-stream.jsonl`），你可以追蹤該檔案以取得完整轉送歷史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒後中止 ACP 子回合。`0` 會讓該回合走 Gateway 的無逾時路徑。同一個值會套用到 Gateway 執行和 ACP 執行階段，因此停滯或配額耗盡的框架不會無限期占用父代理程式通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 衍生會在 `session/new` 之前，將 OpenClaw Codex 參照（例如 `openai-codex/gpt-5.4`）正規化為 Codex ACP 啟動設定；像 `openai-codex/gpt-5.4/high` 這類斜線形式也會設定 Codex ACP 推理強度。其他框架必須宣告 ACP `models` 並支援 `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是默默退回目標代理程式預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考／推理強度。對 Codex ACP 來說，`minimal` 會對應到低強度，`low`/`medium`/`high`/`xhigh` 會直接對應，`off` 會省略推理強度啟動覆寫。
</ParamField>

## 衍生繫結與執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前作用中的對話；如果沒有作用中的對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    注意事項：

    - `--bind here` 是「讓這個頻道或聊天由 Codex 支援」最簡單的操作者路徑。
    - `--bind here` 不會建立子執行緒。
    - `--bind here` 只適用於公開目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中執行緒中：繫結該執行緒。執行緒外：在支援時建立／繫結子執行緒。 |
    | `here` | 要求目前作用中的執行緒；如果不在執行緒中則失敗。                                                  |
    | `off`  | 不繫結。工作階段會以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非執行緒繫結介面上，預設行為實際上是 `off`。
    - 執行緒繫結衍生需要頻道政策支援：
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子執行緒時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段是為了在可見的聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道執行緒／主題繫結到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由到 ACP 工作階段，而 ACP 輸出會傳回同一個頻道／執行緒／主題。

    OpenClaw 會傳送給框架的內容：

    - 一般已繫結後續訊息會以提示文字傳送，只有在框架／後端支援時才會附加附件。
    - `/acp` 管理命令和本機 Gateway 命令會在 ACP 派送前被攔截。
    - 執行階段產生的完成事件會依目標具體化。OpenClaw 代理程式會取得 OpenClaw 的內部執行階段內容信封；外部 ACP 框架會取得包含子結果與指示的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封絕不應傳送給外部框架，或作為 ACP 使用者逐字稿文字保存。
    - ACP 逐字稿項目會使用使用者可見的觸發文字或純完成提示。在可行時，內部事件中繼資料會在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="父層擁有的一次性 ACP 工作階段">
    由另一個代理程式執行衍生的一次性 ACP 工作階段是背景子項，類似子代理程式：

    - 父層使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子項會在自己的 ACP 框架工作階段中執行。
    - 子回合會在原生子代理程式衍生使用的同一個背景通道上執行，因此緩慢的 ACP 框架不會封鎖不相關的主要工作階段工作。
    - 完成會透過任務完成宣告路徑回報。OpenClaw 會先將內部完成中繼資料轉換成純 ACP 提示，再傳送給外部框架，因此框架不會看到僅限 OpenClaw 的執行階段內容標記。
    - 當面向使用者的回覆有用時，父層會以一般助理語氣重寫子結果。

    **不要** 將這條路徑視為父層與子項之間的點對點聊天。子項已經有回到父層的完成通道。

  </Accordion>
  <Accordion title="sessions_send 和 A2A 傳遞">
    `sessions_send` 可以在衍生後鎖定另一個工作階段。對於一般對等工作階段，OpenClaw 會在注入訊息後使用代理程式對代理程式（A2A）後續路徑：

    - 等待目標工作階段的回覆。
    - 選擇性允許請求者與目標交換有限次數的後續回合。
    - 要求目標產生宣告訊息。
    - 將該宣告傳遞到可見頻道或執行緒。

    該 A2A 路徑是對等傳送在傳送者需要可見後續回覆時的備援。當不相關的工作階段可以看見並傳訊息給 ACP 目標時，例如在寬鬆的 `tools.sessions.visibility` 設定下，它會保持啟用。

    只有當請求者是其自身父層擁有的一次性 ACP 子項的父層時，OpenClaw 才會略過 A2A 後續。在這種情況下，在任務完成之上執行 A2A 可能會用子項結果喚醒父層、將父層回覆轉送回子項，並建立父層／子項回音迴圈。該擁有子項案例的 `sessions_send` 結果會回報 `delivery.status="skipped"`，因為完成路徑已經負責該結果。

  </Accordion>
  <Accordion title="繼續現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是重新開始。代理程式會透過 `session/load` 重播其對話歷史，因此會帶著先前內容的完整上下文繼續。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用情境：

    - 將 Codex 工作階段從筆電交接到手機，告訴你的代理程式從你離開的地方繼續。
    - 繼續你在 CLI 中互動式啟動、現在透過代理程式以無介面方式進行的編碼工作階段。
    - 接續因 Gateway 重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只會在 `runtime: "acp"` 時套用；預設子代理程式執行階段會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只會在 `runtime: "acp"` 時套用；預設子代理程式執行階段會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機 ACP／框架繼續 id，不是 OpenClaw 頻道工作階段鍵；OpenClaw 在派送前仍會檢查 ACP 衍生政策與目標代理程式政策，而 ACP 後端或框架負責載入該上游 id 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 和 Claude Code 都支援）。
    - 如果找不到工作階段 id，衍生會以清楚錯誤失敗，不會默默退回到新工作階段。

  </Accordion>
  <Accordion title="部署後冒煙測試">
    Gateway 部署後，請執行即時端對端檢查，而不是信任單元測試：

    1. 驗證目標主機上已部署的 Gateway 版本與提交。
    2. 開啟通往即時代理程式的暫時 ACPX 橋接工作階段。
    3. 要求該代理程式呼叫 `sessions_spawn`，並使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任務 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    將閘門維持在 `mode: "run"`，並略過 `streamTo: "parent"` -
    執行緒綁定的 `mode: "session"` 與串流轉送路徑是各自獨立、
    更完整的整合檢查。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機執行階段上執行，**不是**在
OpenClaw 沙箱內執行。

<Warning>
**安全邊界：**

- 外部控管工具可依照其自身的 CLI 權限與所選的 `cwd` 進行讀取/寫入。
- OpenClaw 的沙箱政策**不會**包覆 ACP 控管工具的執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理程式、工作階段擁有權、頻道繫結與 Gateway 傳遞政策。
- 若要執行由沙箱強制控管的 OpenClaw 原生工作，請使用 `runtime: "subagent"`。

</Warning>

目前限制：

- 如果請求者工作階段已沙箱化，則 ACP 產生作業會同時封鎖 `sessions_spawn({ runtime: "acp" })` 與 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

多數 `/acp` 動作接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試金鑰
   - 接著嘗試 UUID 形式的工作階段 ID
   - 接著嘗試標籤
2. 目前執行緒繫結（如果此對話/執行緒已繫結至 ACP 工作階段）。
3. 目前請求者工作階段後援。

目前對話繫結與執行緒繫結都會參與
步驟 2。

如果無法解析目標，OpenClaw 會傳回清楚的錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 指令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選用目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段中正在進行的回合。                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將導向指示傳送給執行中的工作階段。                        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項與能力。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                          | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                                  | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                            | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存區列出最近的 ACP 工作階段。                         | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、能力與可操作修正。                          | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                              | `/acp install`                                                |

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級和
後端層級的工作階段識別碼。當後端缺少某項能力時，系統會清楚呈現
不支援控制項的錯誤。`/acp sessions` 會讀取目前繫結或請求者工作階段的
儲存區；目標權杖（`session-key`、`session-id` 或 `session-label`）
會透過 gateway 工作階段探索解析，包括自訂的每代理程式 `session.store`
根目錄。

### 執行階段選項對應

`/acp` 提供便利指令與通用設定器。等效
操作如下：

| 指令                         | 對應到                               | 備註                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 執行階段設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai-codex/<model>` 正規化為配接器模型 ID，並將斜線推理後綴（例如 `openai-codex/gpt-5.4/high`）對應至 `reasoning_effort`。 |
| `/acp set thinking <level>`  | 執行階段設定鍵 `thinking`            | 對於 Codex ACP，OpenClaw 會在配接器支援時傳送對應的 `reasoning_effort`。                                                                                                      |
| `/acp permissions <profile>` | 執行階段設定鍵 `approval_policy`     | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | 執行階段設定鍵 `timeout`             | -                                                                                                                                                                              |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                    |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 會使用 cwd 覆寫路徑。                                                                                                                                               |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | -                                                                                                                                                                              |

## acpx 控管工具、Plugin 設定與權限

如需 acpx 控管工具設定（Claude Code / Codex / Gemini CLI
別名）、plugin-tools 與 OpenClaw-tools MCP 橋接器，以及 ACP
權限模式，請參閱
[ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正方式                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端 Plugin 遺失、停用，或被 `plugins.allow` 封鎖。                                                                    | 安裝並啟用後端 Plugin；設定允許清單時，請在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                                     |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用從一般對話串訊息自動派送。                                                                                       | 設定 `acp.dispatch.enabled=true` 以恢復自動對話串路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent 不在允許清單中。                                                                                                 | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 後端 Plugin 遺失、停用、被允許/拒絕政策封鎖，或其設定的可執行檔無法使用。                                             | 安裝/啟用後端 Plugin，重新執行 `/acp doctor`；如果狀態仍不健康，請檢查後端安裝或政策錯誤。                                                                              |
| Harness command not found                                                   | 轉接器 CLI 未安裝、外部 Plugin 遺失，或非 Codex 轉接器的首次執行 `npx` 擷取失敗。                                     | 執行 `/acp doctor`、在 Gateway 主機上安裝/預先暖機轉接器，或明確設定 acpx agent 命令。                                                                                  |
| Model-not-found from the harness                                            | 模型 ID 對另一個提供者/harness 有效，但不適用於此 ACP 目標。                                                          | 使用該 harness 列出的模型、在 harness 中設定模型，或省略覆寫。                                                                                                          |
| Vendor auth error from the harness                                          | OpenClaw 狀態正常，但目標 CLI/提供者尚未登入。                                                                         | 在 Gateway 主機環境中登入或提供必要的提供者金鑰。                                                                                                                       |
| `Unable to resolve session target: ...`                                     | 錯誤的鍵/id/標籤 token。                                                                                               | 執行 `/acp sessions`，複製精確的鍵/標籤，然後重試。                                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有可繫結的作用中對話時使用了 `--bind here`。                                                                       | 移至目標聊天/頻道後重試，或使用未繫結的 spawn。                                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | 轉接器缺少目前對話的 ACP 繫結能力。                                                                                   | 在支援時使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                                    |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在對話串情境外使用了 `--thread here`。                                                                                 | 移至目標對話串，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的繫結目標。                                                                                     | 以擁有者身分重新繫結，或使用不同的對話或對話串。                                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | 轉接器缺少對話串繫結能力。                                                                                             | 使用 `--thread off`，或移至支援的轉接器/頻道。                                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime 位於主機端；請求者工作階段已沙箱化。                                                                       | 從沙箱化工作階段使用 `runtime="subagent"`，或從非沙箱化工作階段執行 ACP spawn。                                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 已為 ACP runtime 要求 `sandbox="require"`。                                                                            | 若需要強制沙箱化，請使用 `runtime="subagent"`；或從非沙箱化工作階段搭配 `sandbox="inherit"` 使用 ACP。                                                                   |
| `Cannot apply --model ... did not advertise model support`                  | 目標 harness 未公開通用 ACP 模型切換。                                                                                | 使用宣告 ACP `models`/`session/set_model` 的 harness、使用 Codex ACP 模型參照，或在 harness 具有自己的啟動旗標時直接於其中設定模型。                                    |
| Missing ACP metadata for bound session                                      | ACP 工作階段中繼資料已過期/刪除。                                                                                      | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦對話串。                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 封鎖非互動 ACP 工作階段中的寫入/執行。                                                               | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。             |
| ACP session fails early with little output                                  | 權限提示被 `permissionMode`/`nonInteractivePermissions` 封鎖。                                                         | 檢查 gateway 記錄中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。                     |
| ACP session stalls indefinitely after completing work                       | Harness 程序已完成，但 ACP 工作階段未回報完成。                                                                       | 更新 OpenClaw；目前的 acpx 清理會在關閉和 Gateway 啟動時回收 OpenClaw 擁有的過期 wrapper 和轉接器程序。                                                                |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件信封洩漏到 ACP 邊界之外。                                                                                      | 更新 OpenClaw 並重新執行完成流程；外部 harness 應只收到純文字完成提示。                                                                                                |

## 相關

- [ACP agents - 設定](/zh-TW/tools/acp-agents-setup)
- [Agent 傳送](/zh-TW/tools/agent-send)
- [CLI 後端](/zh-TW/gateway/cli-backends)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [多 agent 沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [Sub-agents](/zh-TW/tools/subagents)
