---
read_when:
    - 透過 ACP 執行程式碼編寫工具
    - 在訊息頻道上設定綁定對話的 ACP 工作階段
    - 將訊息通道對話綁定至持久性 ACP 工作階段
    - 疑難排解 ACP 後端、Plugin 串接或完成回覆傳遞
    - 從聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼編寫工具（Claude Code、Cursor、Gemini CLI、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-04-30T03:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端 Plugin 執行外部程式碼工具（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX 工具）。

每次 ACP 工作階段產生都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部工具路徑，不是預設的 Codex 路徑。** 原生 Codex
應用程式伺服器 Plugin 擁有 `/codex ...` 控制項與
`agentRuntime.id: "codex"` 嵌入式執行階段；ACP 擁有
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 以外部 MCP 用戶端的身分
直接連接到既有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我需要哪一頁？

| 你想要…                                                                                         | 使用                                  | 備註                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                     | `/codex bind`, `/codex threads`       | 啟用 `codex` Plugin 時的原生 Codex 應用程式伺服器路徑；包含繫結聊天回覆、圖片轉發、模型/快速/權限、停止與引導控制。ACP 是明確的備援 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部工具                     | 本頁                                  | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                      |
| 將 OpenClaw Gateway 工作階段作為 ACP 伺服器公開給編輯器或用戶端                                  | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 對 OpenClaw 使用 ACP                                                                    |
| 重複使用本機 AI CLI 作為純文字備援模型                                                           | [CLI 後端](/zh-TW/gateway/cli-backends)     | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有工具執行階段                                                                  |

## 這能開箱即用嗎？

通常可以。全新安裝會預設啟用內建的 `acpx` 執行階段 Plugin，
並隨附 Plugin 本機釘選的 `acpx` 二進位檔，OpenClaw 會在啟動時探測並自行修復。
執行 `/acp doctor` 以檢查就緒狀態。

OpenClaw 只會在 ACP **真正可用**時教導代理如何產生 ACP：
ACP 必須已啟用、派發不得停用、目前工作階段不得被沙箱封鎖，
且必須已載入執行階段後端。若不符合這些條件，ACP Plugin Skills 與
`sessions_spawn` ACP 指引會保持隱藏，避免代理建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果已設定 `plugins.allow`，它就是限制性的 Plugin 清單，且**必須**包含 `acpx`；否則內建預設值會被刻意封鎖，`/acp doctor` 會回報缺少允許清單項目。
    - 內建 Codex ACP 轉接器會隨 `acpx` Plugin 一起預備，並在可行時於本機啟動。
    - 其他目標工具轉接器在第一次使用時，仍可能透過 `npx` 按需擷取。
    - 該工具的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取，首次執行的轉接器擷取會失敗，直到快取已預熱或以其他方式安裝轉接器為止。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部工具程序。OpenClaw 擁有路由、
    背景任務狀態、交付、繫結與政策；工具則擁有其供應商登入、
    模型目錄、檔案系統行為與原生工具。

    在責怪 OpenClaw 之前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 設定允許清單時，目標 ID 已被 `acp.allowedAgents` 允許。
    - 工具命令可以在 Gateway 主機上啟動。
    - 該工具已有供應商驗證（`claude`, `codex`, `gemini`, `opencode`, `droid` 等）。
    - 所選模型存在於該工具中，模型 ID 無法跨工具攜帶使用。
    - 請求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點擊原生權限提示，因此大量寫入/執行的程式碼工作通常需要可在無介面情況下繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 工具與內建 OpenClaw 工具預設**不會**公開給
ACP 工具。只有在該工具應直接呼叫這些工具時，才啟用
[ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的工具目標

使用內建 `acpx` 後端時，請使用這些工具 ID 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 工具 ID    | 典型後端                                       | 備註                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 轉接器                         | 需要主機上的 Claude Code 驗證。                                                     |
| `codex`    | Codex ACP 轉接器                               | 僅在原生 `/codex` 不可用或已要求 ACP 時，才作為明確 ACP 備援。                      |
| `copilot`  | GitHub Copilot ACP 轉接器                      | 需要 Copilot CLI/執行階段驗證。                                                     |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開了不同的 ACP 進入點，請覆寫 acpx 命令。                             |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 驗證，或工具環境中的 `FACTORY_API_KEY`。                         |
| `gemini`   | Gemini CLI ACP 轉接器                          | 需要 Gemini CLI 驗證或 API 金鑰設定。                                                |
| `iflow`    | iFlow CLI                                      | 轉接器可用性與模型控制取決於已安裝的 CLI。                                          |
| `kilocode` | Kilo Code CLI                                  | 轉接器可用性與模型控制取決於已安裝的 CLI。                                          |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                                    |
| `kiro`     | Kiro CLI                                       | 轉接器可用性與模型控制取決於已安裝的 CLI。                                          |
| `opencode` | OpenCode ACP 轉接器                            | 需要 OpenCode CLI/供應商驗證。                                                       |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接   | 讓 ACP 感知工具能回頭與 OpenClaw Gateway 工作階段對話。                             |
| `pi`       | Pi/嵌入式 OpenClaw 執行階段                    | 用於 OpenClaw 原生工具實驗。                                                        |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主機上的 Qwen 相容驗證。                                                        |

自訂 acpx 代理別名可在 acpx 本身中設定，但 OpenClaw
政策在派發前仍會檢查 `acp.allowedAgents` 與任何
`agents.list[].runtime.acp.agent` 對應。

## 操作者執行手冊

從聊天快速使用 `/acp` 的流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在繫結的對話或執行緒中繼續（或明確指定工作階段
    金鑰）。
  </Step>
  <Step title="檢查狀態">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引導">
    不取代內容脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前輪次）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期細節">
    - 產生會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存區中記錄 ACP 中繼資料，並可能在執行由父層擁有時建立背景任務。
    - 由父層擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是持久的；完成與跨介面交付會透過父層任務通知器進行，而不是像一般面向使用者的聊天工作階段一樣運作。
    - 任務維護會關閉已終止或孤立、由父層擁有的一次性 ACP 工作階段。只要仍有有效對話繫結，持久 ACP 工作階段就會保留；沒有有效繫結的過時持久工作階段會被關閉，使其無法在擁有任務完成或其任務記錄消失後被靜默恢復。
    - 繫結的後續訊息會直接傳送到 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或過期。
    - Gateway 命令會保留在本機。`/acp ...`、`/status` 與 `/unfocus` 永遠不會作為一般提示文字傳送給已繫結的 ACP 工具。
    - 當後端支援取消時，`cancel` 會中止作用中的輪次；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。如果工具支援恢復，它仍可能保留自己的上游歷史。
    - 閒置的執行階段工作站可在 `acp.runtime.ttlMinutes` 後清理；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    當原生 Codex Plugin 已啟用時，應路由到**原生 Codex
    Plugin** 的自然語言觸發：

    - 「將這個 Discord 頻道繫結到 Codex。」
    - 「將這個聊天附加到 Codex 執行緒 `<id>`。」
    - 「顯示 Codex 執行緒，然後繫結這一個。」

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）會在 Codex 內部執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每輪原生
    hook 轉送，使 Plugin hook 能封鎖 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hook 會轉送到 OpenClaw `before_agent_finalize`，
    Plugin 可在那裡要求 Codex 完成答案前再進行一次模型處理。
    此轉送刻意保持保守：它不會變更 Codex 原生工具參數，
    也不會重寫 Codex 執行緒記錄。只有在你想要 ACP 執行階段/工作階段模型時，
    才使用明確 ACP。嵌入式 Codex 支援邊界記錄於
    [Codex 工具 v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供者 / 執行階段選擇速查表">
    - `openai-codex/*` — PI Codex OAuth/訂閱路由。
    - `openai/*` 加上 `agentRuntime.id: "codex"` — 原生 Codex app-server 內嵌執行階段。
    - `/codex ...` — 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` — 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發詞">
    應路由到 ACP 執行階段的觸發詞：

    - "以一次性 Claude Code ACP 工作階段執行這個，並摘要結果。"
    - "在一個執行緒中使用 Gemini CLI 處理這項任務，然後將後續回覆保留在同一個執行緒中。"
    - "透過 ACP 在背景執行緒中執行 Codex。"

    OpenClaw 會選擇 `runtime: "acp"`、解析 harness `agentId`，
    在支援時繫結到目前的對話或執行緒，並將後續回覆路由到該工作階段，
    直到關閉/到期為止。只有在明確指定 ACP/acpx，或原生 Codex
    plugin 無法用於請求的操作時，Codex 才會採用這條路徑。

    對於 `sessions_spawn`，只有在 ACP 已啟用、請求者未受沙箱限制，
    且已載入 ACP 執行階段後端時，才會公告 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 會暫停自動 ACP 執行緒派發，
    但不會隱藏或阻擋明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它的目標是 ACP harness id，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非該項目已明確設定
    `agents.list[].runtime.type="acp"`，否則不要傳入來自 `agents_list`
    的一般 OpenClaw 設定代理 id；
    請改用預設子代理執行階段。當 OpenClaw 代理設定為
    `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理

當你需要外部 harness 執行階段時，請使用 ACP。當 `codex`
plugin 已啟用且你需要 Codex 對話繫結/控制時，請使用**原生 Codex
app-server**。當你需要 OpenClaw 原生的委派執行時，請使用**子代理**。

| 區域          | ACP 工作階段                           | 子代理執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端 plugin（例如 acpx） | OpenClaw 原生子代理執行階段  |
| 工作階段鍵   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | 帶有 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

對於透過 ACP 執行的 Claude Code，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 隨附的 `acpx` 執行階段 plugin。
3. Claude ACP 配接器。
4. Claude 端執行階段/工作階段機制。

ACP Claude 是一個具備 ACP 控制、工作階段恢復、
背景任務追蹤，以及可選對話/執行緒繫結的 **harness 工作階段**。

CLI 後端是獨立的純文字本機備援執行階段 — 請參閱
[CLI 後端](/zh-TW/gateway/cli-backends)。

對於操作者，實務規則是：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制，或持久 harness 工作嗎？** 使用 ACP。
- **需要透過原始 CLI 進行簡單的本機文字備援嗎？** 使用 CLI 後端。

## 已繫結工作階段

### 心智模型

- **聊天介面** — 人們持續對話的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** — OpenClaw 路由到的持久 Codex/Claude/Gemini 執行階段狀態。
- **子執行緒/主題** — 僅由 `--thread ...` 建立的選用額外訊息介面。
- **執行階段工作區** — harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。它與聊天介面彼此獨立。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話固定到
產生的 ACP 工作階段 — 不建立子執行緒，使用相同聊天介面。OpenClaw 會持續
負責傳輸、驗證、安全性與傳遞。該對話中的後續訊息會路由到同一個工作階段；
`/new` 和 `/reset` 會在原處重設工作階段；`/acp close` 會移除繫結。

範例：

```text
/codex bind                                              # 原生 Codex 繫結，將未來訊息路由到這裡
/codex model gpt-5.4                                     # 調整已繫結的原生 Codex 執行緒
/codex stop                                              # 控制作用中的原生 Codex 回合
/acp spawn codex --bind here                             # Codex 的明確 ACP 備援
/acp spawn codex --thread auto                           # 可能會建立子執行緒/主題並在那裡繫結
/acp spawn codex --bind here --cwd /workspace/repo       # 相同聊天繫結，Codex 在 /workspace/repo 中執行
```

<AccordionGroup>
  <Accordion title="繫結規則與排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於公告支援目前對話繫結的通道；否則 OpenClaw 會回傳明確的不支援訊息。繫結會在 Gateway 重新啟動後保留。
    - 在 Discord 上，只有當 OpenClaw 需要為 `--thread auto|here` 建立子執行緒時，才需要 `spawnAcpSessions` — `--bind here` 不需要。
    - 如果你在沒有 `--cwd` 的情況下產生到不同 ACP 代理，OpenClaw 預設會繼承**目標代理的**工作區。遺失的繼承路徑（`ENOENT`/`ENOTDIR`）會退回後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - Gateway 管理命令會在已繫結對話中保持本機處理 — 即使一般後續文字會路由到已繫結的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 和 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="執行緒繫結工作階段">
    當通道配接器已啟用執行緒繫結時：

    - OpenClaw 會將執行緒繫結到目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由到已繫結的 ACP 工作階段。
    - ACP 輸出會傳回同一個執行緒。
    - 取消聚焦/關閉/封存/閒置逾時或最大存續時間到期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 命令，不是傳給 ACP harness 的提示。

    執行緒繫結 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 執行緒派發；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 啟用通道配接器 ACP 執行緒產生旗標（依配接器而定）：
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    執行緒繫結支援取決於配接器。如果作用中的通道
    配接器不支援執行緒繫結，OpenClaw 會回傳明確的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援執行緒的通道">
    - 任何公開工作階段/執行緒繫結能力的通道配接器。
    - 目前內建支援：**Discord** 執行緒/頻道、**Telegram** 主題（群組/超級群組中的論壇主題與 DM 主題）。
    - Plugin 通道可以透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久通道繫結

對於非暫時性工作流程，請在
頂層 `bindings[]` 項目中設定持久 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標示持久 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各通道形狀如下：

- **Discord 頻道/執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/群組：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定的群組繫結建議使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定的群組繫結建議使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有者 OpenClaw 代理 id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的面向操作者標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用的執行階段工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用後端覆寫。
</ParamField>

### 每個代理的執行階段預設值

使用 `agents.list[].runtime` 為每個代理定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 已繫結工作階段的覆寫優先順序：**

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

- OpenClaw 會確保已設定的 ACP 工作階段在使用前存在。
- 該頻道或主題中的訊息會路由到已設定的 ACP 工作階段。
- 在已繫結對話中，`/new` 和 `/reset` 會在原處重設同一個 ACP 工作階段鍵。
- 暫時性執行階段繫結（例如由執行緒聚焦流程建立）仍會在存在時套用。
- 對於沒有明確 `cwd` 的跨代理 ACP 產生，OpenClaw 會從代理設定繼承目標代理工作區。
- 遺失的繼承工作區路徑會退回後端預設 cwd；非遺失的存取失敗會顯示為產生錯誤。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

<Tabs>
  <Tab title="從 sessions_spawn">
    使用 `runtime: "acp"` 從代理回合或
    工具呼叫啟動 ACP 工作階段。

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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段請明確設定
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true` 以保留持久繫結的對話。
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

    請參閱 [斜線命令](/zh-TW/tools/slash-commands)。

  </Tab>
</Tabs>

### `sessions_spawn` 參數

<ParamField path="task" type="string" required>
  傳送到 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須是 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標 harness ID。如果已設定，則退回使用 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的地方要求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久的。如果 `thread: true` 且
  省略 `mode`，OpenClaw 可能會依 runtime 路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的 runtime 工作目錄（由後端/runtime 政策驗證）。如果省略，
  ACP spawn 會在已設定時繼承目標代理的工作區；缺少繼承路徑時會退回
  後端預設值，而實際存取錯誤則會回傳。
</ParamField>
<ParamField path="label" type="string">
  在工作階段/橫幅文字中使用、面向操作員的標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續既有 ACP 工作階段，而不是建立新的工作階段。代理會透過
  `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要以系統事件串流回要求者工作階段。
  已接受的回應包含 `streamLogPath`，指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以追蹤它來查看完整轉送歷史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後中止 ACP 子回合。`0` 會讓該回合走 Gateway 的無逾時路徑。
  相同值會套用到 Gateway 執行和 ACP runtime，因此停滯或配額耗盡的
  harness 不會無限期占用父代理通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP spawn 會在 `session/new`
  之前，將 `openai-codex/gpt-5.4` 等 OpenClaw Codex 參照正規化為
  Codex ACP 啟動設定；`openai-codex/gpt-5.4/high` 這類斜線形式也會設定
  Codex ACP 推理強度。其他 harness 必須宣告 ACP `models` 並支援
  `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是靜默退回
  目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對 Codex ACP 而言，`minimal` 會對應到低強度，
  `low`/`medium`/`high`/`xhigh` 會直接對應，而 `off` 會省略推理強度
  啟動覆寫。
</ParamField>

## Spawn 繫結和執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前的作用中對話；如果沒有作用中對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    注意事項：

    - `--bind here` 是「讓這個頻道或聊天由 Codex 支援」最簡單的操作員路徑。
    - `--bind here` 不會建立子執行緒。
    - `--bind here` 只適用於公開目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中執行緒中：繫結該執行緒。在執行緒外：在支援時建立/繫結子執行緒。 |
    | `here` | 要求目前有作用中執行緒；如果不在執行緒中則失敗。                                                  |
    | `off`  | 不繫結。工作階段以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非執行緒繫結介面上，預設行為實際上是 `off`。
    - 執行緒繫結的 spawn 需要頻道政策支援：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 當你想固定目前對話而不建立子執行緒時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。
傳遞路徑取決於其型態。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    互動式工作階段旨在於可見聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道執行緒/主題繫結到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    繫結對話中的後續訊息會直接路由到 ACP 工作階段，而 ACP 輸出會傳回
    同一個頻道/執行緒/主題。

    OpenClaw 傳送給 harness 的內容：

    - 一般繫結後續訊息會以提示文字傳送，只有在 harness/後端支援時才會附加附件。
    - `/acp` 管理命令和本機 Gateway 命令會在 ACP 派送前被攔截。
    - runtime 產生的完成事件會依目標實體化。OpenClaw 代理會收到 OpenClaw 的內部 runtime-context envelope；外部 ACP harness 會收到含子結果與指示的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope 絕不應傳送到外部 harness，或作為 ACP 使用者轉錄文字持久化。
    - ACP 轉錄項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會在可能時以結構化形式保留於 OpenClaw 中，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    由另一個代理執行 spawn 的一次性 ACP 工作階段是背景子項，
    類似子代理：

    - 父層使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子項在自己的 ACP harness 工作階段中執行。
    - 子回合會在原生子代理 spawn 所使用的同一個背景通道上執行，因此緩慢的 ACP harness 不會阻塞不相關的主工作階段工作。
    - 完成會透過工作完成公告路徑回報。OpenClaw 會先將內部完成中繼資料轉換為純 ACP 提示，再傳送到外部 harness，因此 harness 不會看到僅限 OpenClaw 的 runtime context 標記。
    - 當需要面向使用者的回覆時，父層會以一般助理語氣重寫子結果。

    **不要**將此路徑視為父層與子項之間的點對點聊天。子項已經有回到
    父層的完成通道。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` 可以在 spawn 之後以另一個工作階段為目標。對一般
    對等工作階段而言，OpenClaw 會在注入訊息後使用代理對代理（A2A）
    後續路徑：

    - 等待目標工作階段的回覆。
    - 選擇性讓要求者與目標交換有界數量的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見頻道或執行緒。

    該 A2A 路徑是對等傳送的備用機制，適用於傳送者需要可見後續回覆時。
    當不相關的工作階段可以看見並傳訊給 ACP 目標時，例如在寬鬆的
    `tools.sessions.visibility` 設定下，它會保持啟用。

    只有當要求者是其自身父層擁有的一次性 ACP 子項的父層時，OpenClaw
    才會略過 A2A 後續。在該情況下，在工作完成之上執行 A2A 可能會用
    子項結果喚醒父層、將父層回覆轉送回子項，並建立父層/子項回音迴圈。
    對於該擁有子項案例，`sessions_send` 結果會回報
    `delivery.status="skipped"`，因為完成路徑已負責處理結果。

  </Accordion>
  <Accordion title="Resume an existing session">
    使用 `resumeSessionId` 以繼續先前的 ACP 工作階段，而不是重新開始。
    代理會透過 `session/load` 重播其對話歷史，因此會帶著先前完整脈絡接續。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從筆電交接到手機 — 告訴你的代理從離開處接續。
    - 繼續你在 CLI 中以互動方式啟動的編碼工作階段，現在透過你的代理以無頭方式執行。
    - 接續因 gateway 重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理 runtime 會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理 runtime 會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機的 ACP/harness 繼續 ID，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在派送前仍會檢查 ACP spawn 政策和目標代理政策，而 ACP 後端或 harness 擁有載入該上游 ID 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理必須支援 `session/load`（Codex 和 Claude Code 都支援）。
    - 如果找不到工作階段 ID，spawn 會以清楚錯誤失敗 — 不會靜默退回到新工作階段。

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Gateway 部署後，請執行即時端對端檢查，而不是信任單元測試：

    1. 驗證目標主機上的已部署 Gateway 版本和提交。
    2. 開啟到即時代理的臨時 ACPX bridge 工作階段。
    3. 要求該代理以 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 和任務 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理臨時 bridge 工作階段。

    將 gate 保持在 `mode: "run"`，並略過 `streamTo: "parent"` —
    執行緒繫結的 `mode: "session"` 和串流轉送路徑是另外更完整的整合檢查。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機 runtime 上執行，**不是**在
OpenClaw 沙箱內執行。

<Warning>
**安全邊界：**

- 外部執行框架可依據自身 CLI 權限與所選 `cwd` 進行讀取/寫入。
- OpenClaw 的沙箱政策**不會**包裹 ACP 執行框架的執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理、工作階段擁有權、頻道繫結，以及 Gateway 傳遞政策。
- 對需要沙箱強制執行的 OpenClaw 原生工作，請使用 `runtime: "subagent"`。

</Warning>

目前限制：

- 如果請求者工作階段受到沙箱限制，則 ACP 衍生會同時封鎖 `sessions_spawn({ runtime: "acp" })` 與 `/acp spawn`。
- 搭配 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作都接受選用的工作階段目標（`session-key`、`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試金鑰
   - 接著嘗試 UUID 形狀的工作階段 ID
   - 接著嘗試標籤
2. 目前執行緒繫結（如果此對話/執行緒已繫結至 ACP 工作階段）。
3. 目前請求者工作階段備援。

目前對話繫結與執行緒繫結都會參與步驟 2。

如果沒有解析出目標，OpenClaw 會傳回清楚的錯誤（`Unable to resolve session target: ...`）。

## ACP 控制

| 指令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段中進行中的回合。                          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將引導指令傳送至執行中的工作階段。                        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項與功能。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                          | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入一般執行階段設定選項。                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                                  | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                            | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存區列出近期 ACP 工作階段。                           | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、功能與可操作修正。                          | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                              | `/acp install`                                                |

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級與後端層級的工作階段識別碼。當後端缺少某項功能時，不支援的控制錯誤會清楚浮現。`/acp sessions` 會讀取目前已繫結或請求者工作階段的儲存區；目標權杖（`session-key`、`session-id` 或 `session-label`）會透過 gateway 工作階段探索來解析，包括自訂的每代理 `session.store` 根目錄。

### 執行階段選項對應

`/acp` 提供便利指令與一般 setter。等效操作：

| 指令                         | 對應至                               | 備註                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 執行階段設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai-codex/<model>` 正規化為 adapter model id，並將斜線推理後綴（例如 `openai-codex/gpt-5.4/high`）對應至 `reasoning_effort`。              |
| `/acp set thinking <level>`  | 執行階段設定鍵 `thinking`            | 對於 Codex ACP，OpenClaw 會在 adapter 支援時傳送對應的 `reasoning_effort`。                                                                                                    |
| `/acp permissions <profile>` | 執行階段設定鍵 `approval_policy`     | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | 執行階段設定鍵 `timeout`             | —                                                                                                                                                                              |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                     |
| `/acp set <key> <value>`     | 一般                                 | `key=cwd` 會使用 cwd 覆寫路徑。                                                                                                                                               |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | —                                                                                                                                                                              |

## acpx 執行框架、Plugin 設定與權限

關於 acpx 執行框架設定（Claude Code / Codex / Gemini CLI 別名）、plugin-tools 與 OpenClaw-tools MCP 橋接，以及 ACP 權限模式，請參閱 [ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正方式                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端 Plugin 遺失、已停用，或被 `plugins.allow` 封鎖。                                                                  | 安裝並啟用後端 Plugin；若已設定該允許清單，請在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                      | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用一般對話串訊息的自動分派。                                                                                     | 設定 `acp.dispatch.enabled=true` 以恢復自動對話串路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | 代理不在允許清單中。                                                                                                  | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | Plugin 相依性探測或自我修復仍在執行中。                                                                               | 稍候片刻並重新執行 `/acp doctor`；若狀態仍不健康，請檢查後端安裝錯誤以及 Plugin 允許/拒絕政策。                                                                        |
| Harness command not found                                                   | 配接器 CLI 未安裝、暫存的 Plugin 相依性遺失，或非 Codex 配接器的首次執行 `npx` 擷取失敗。                            | 執行 `/acp doctor`、修復 Plugin 相依性、在 Gateway 主機上安裝/預熱配接器，或明確設定 acpx 代理命令。                                                                    |
| Model-not-found from the harness                                            | 模型 ID 對另一個提供者/執行框架有效，但不適用於此 ACP 目標。                                                          | 使用該執行框架列出的模型、在執行框架中設定模型，或省略覆寫。                                                                                                           |
| Vendor auth error from the harness                                          | OpenClaw 狀態正常，但目標 CLI/提供者尚未登入。                                                                        | 在 Gateway 主機環境中登入或提供必要的提供者金鑰。                                                                                                                       |
| `Unable to resolve session target: ...`                                     | 錯誤的金鑰/ID/標籤權杖。                                                                                             | 執行 `/acp sessions`、複製精確的金鑰/標籤，然後重試。                                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有作用中可繫結對話的情況下使用了 `--bind here`。                                                                  | 移至目標聊天/頻道後重試，或使用未繫結的產生方式。                                                                                                                       |
| `Conversation bindings are unavailable for <channel>.`                      | 配接器缺少目前對話 ACP 繫結能力。                                                                                    | 在支援的位置使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                               |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在對話串情境之外使用了 `--thread here`。                                                                              | 移至目標對話串，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的繫結目標。                                                                                   | 以擁有者身分重新繫結，或使用不同的對話或對話串。                                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | 配接器缺少對話串繫結能力。                                                                                           | 使用 `--thread off`，或移至支援的配接器/頻道。                                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime 位於主機端；請求者工作階段處於沙盒中。                                                                    | 從沙盒工作階段使用 `runtime="subagent"`，或從非沙盒工作階段執行 ACP 產生。                                                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 已為 ACP runtime 要求 `sandbox="require"`。                                                                           | 針對必要沙盒化使用 `runtime="subagent"`，或從非沙盒工作階段使用搭配 `sandbox="inherit"` 的 ACP。                                                                         |
| `Cannot apply --model ... did not advertise model support`                  | 目標執行框架未公開通用 ACP 模型切換。                                                                                | 使用宣告支援 ACP `models`/`session/set_model` 的執行框架、使用 Codex ACP 模型參照，或若執行框架有自己的啟動旗標，直接在其中設定模型。                                  |
| Missing ACP metadata for bound session                                      | 過時/已刪除的 ACP 工作階段中繼資料。                                                                                  | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦對話串。                                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非互動式 ACP 工作階段中封鎖寫入/執行。                                                            | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all` 並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。             |
| ACP session fails early with little output                                  | 權限提示被 `permissionMode`/`nonInteractivePermissions` 封鎖。                                                        | 檢查 gateway 日誌中的 `AcpRuntimeError`。若需完整權限，請設定 `permissionMode=approve-all`；若需優雅降級，請設定 `nonInteractivePermissions=deny`。                    |
| ACP session stalls indefinitely after completing work                       | 執行框架程序已完成，但 ACP 工作階段未回報完成。                                                                       | 使用 `ps aux \| grep acpx` 監控；手動終止過時程序。                                                                                                                     |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件信封洩漏到 ACP 邊界之外。                                                                                    | 更新 OpenClaw 並重新執行完成流程；外部執行框架應只會收到純文字完成提示。                                                                                               |

## 相關

- [ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)
- [代理傳送](/zh-TW/tools/agent-send)
- [CLI 後端](/zh-TW/gateway/cli-backends)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [多代理沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理](/zh-TW/tools/subagents)
