---
read_when:
    - 透過 ACP 執行程式碼撰寫框架
    - 在訊息通道上設定綁定至對話的 ACP 工作階段
    - 將訊息通道對話繫結至持久性 ACP 工作階段
    - 疑難排解 ACP 後端、Plugin 串接或補全傳遞
    - 從聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼撰寫工具（Claude Code、Cursor、Gemini CLI、明確的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-05-02T03:00:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e5fdd4df58c6e15182ae068cb77f5b257e954e5e546014464f273c504463553
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端 Plugin 執行外部編碼工具（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX 工具）。

每次 ACP 工作階段產生都會追蹤為一項[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部工具路徑，不是預設的 Codex 路徑。** 原生
Codex app-server Plugin 擁有 `/codex ...` 控制項與
`agentRuntime.id: "codex"` 嵌入式執行階段；ACP 擁有
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 作為外部 MCP 用戶端，直接連線到既有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我需要哪個頁面？

| 你想要…                                                                                         | 使用這個                              | 備註                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 啟用 `codex` Plugin 時的原生 Codex app-server 路徑；包含已繫結的聊天回覆、圖片轉送、模型/快速/權限、停止與導向控制。ACP 是明確的備援方案 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部工具                    | 此頁面                                | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                                   |
| 將 OpenClaw Gateway 工作階段作為 ACP 伺服器公開給編輯器或用戶端                                | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 與 OpenClaw 進行 ACP 通訊                                                                                                                            |
| 重用本機 AI CLI 作為純文字備援模型                                                              | [CLI 後端](/zh-TW/gateway/cli-backends) | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有工具執行階段                                                                                                                               |

## 這可以開箱即用嗎？

通常可以。全新安裝預設會啟用隨附的 `acpx` 執行階段 Plugin，
並包含由 Plugin 本機固定版本的 `acpx` 二進位檔；OpenClaw 會在
Gateway HTTP 監聽器上線後立即探測並自我修復。執行
`/acp doctor` 進行就緒檢查。

只有在 ACP **真正可用** 時，OpenClaw 才會教代理程式 ACP 產生方式：
ACP 必須已啟用、派發不得停用、目前工作階段不得被沙箱封鎖，
且必須已載入執行階段後端。如果不符合這些條件，ACP Plugin Skills 與
`sessions_spawn` ACP 指引會保持隱藏，讓代理程式不會建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的 Plugin 清單，且**必須**包含 `acpx`；否則隨附的預設值會被刻意封鎖，`/acp doctor` 會回報缺少 allowlist 項目。
    - 隨附的 Codex ACP 轉接器會與 `acpx` Plugin 一起預備，並在可行時於本機啟動。
    - 其他目標工具轉接器可能仍會在你第一次使用時透過 `npx` 按需擷取。
    - 該工具的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取權，首次執行的轉接器擷取會失敗，直到快取已預先暖機，或以其他方式安裝轉接器為止。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部工具程序。OpenClaw 擁有路由、
    背景任務狀態、傳遞、繫結與政策；工具則擁有其供應商登入、
    模型目錄、檔案系統行為與原生工具。

    在歸咎於 OpenClaw 之前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 設定該 allowlist 時，目標 id 已被 `acp.allowedAgents` 允許。
    - 工具命令可以在 Gateway 主機上啟動。
    - 該工具具備供應商驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該工具中，模型 id 無法跨工具移植。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點擊原生權限提示，因此寫入/執行密集的編碼執行通常需要可無人值守繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 工具與內建 OpenClaw 工具預設**不會**公開給
ACP 工具。只有在該工具應直接呼叫那些工具時，才啟用
[ACP 代理程式 — 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的工具目標

使用隨附的 `acpx` 後端時，請將這些工具 id 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 工具 id | 典型後端                                      | 備註                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 轉接器                        | 需要主機上的 Claude Code 驗證。                                              |
| `codex`    | Codex ACP 轉接器                              | 僅在原生 `/codex` 不可用或要求 ACP 時，作為明確 ACP 備援。 |
| `copilot`  | GitHub Copilot ACP 轉接器                     | 需要 Copilot CLI/執行階段驗證。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。    |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 驗證，或工具環境中的 `FACTORY_API_KEY`。        |
| `gemini`   | Gemini CLI ACP 轉接器                         | 需要 Gemini CLI 驗證或 API 金鑰設定。                                          |
| `iflow`    | iFlow CLI                                      | 轉接器可用性與模型控制取決於已安裝的 CLI。                 |
| `kilocode` | Kilo Code CLI                                  | 轉接器可用性與模型控制取決於已安裝的 CLI。                 |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                            |
| `kiro`     | Kiro CLI                                       | 轉接器可用性與模型控制取決於已安裝的 CLI。                 |
| `opencode` | OpenCode ACP 轉接器                           | 需要 OpenCode CLI/供應商驗證。                                                |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接 | 讓支援 ACP 的工具回連 OpenClaw Gateway 工作階段。                 |
| `pi`       | Pi/嵌入式 OpenClaw 執行階段                   | 用於 OpenClaw 原生工具實驗。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主機上的 Qwen 相容驗證。                                          |

自訂 acpx 代理程式別名可以在 acpx 本身中設定，但 OpenClaw
政策在派發前仍會檢查 `acp.allowedAgents` 以及任何
`agents.list[].runtime.acp.agent` 對應。

## 操作者執行手冊

從聊天快速使用 `/acp` 流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    繼續在已繫結的對話或討論串中操作（或明確指定工作階段
    key）。
  </Step>
  <Step title="檢查狀態">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="導向">
    不取代脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 產生會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存區記錄 ACP 中繼資料，並可能在該執行由父層擁有時建立背景任務。
    - 即使執行階段工作階段是持久的，父層擁有的 ACP 工作階段仍會被視為背景工作；完成與跨介面傳遞會經由父層任務通知器處理，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉終止或孤立的父層擁有一次性 ACP 工作階段。當有效對話繫結仍存在時，持久 ACP 工作階段會被保留；沒有有效繫結的過期持久工作階段會被關閉，因此在擁有任務完成或其任務記錄消失後，無法被靜默恢復。
    - 已繫結的後續訊息會直接送往 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或過期。
    - Gateway 命令保持本機處理。`/acp ...`、`/status` 與 `/unfocus` 絕不會作為一般提示文字傳送給已繫結的 ACP 工具。
    - 當後端支援取消時，`cancel` 會中止進行中的回合；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的觀點結束 ACP 工作階段，並移除繫結。如果工具支援恢復，仍可能保留自己的上游歷史。
    - 閒置的執行階段工作器可在 `acp.runtime.ttlMinutes` 後清理；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    應在啟用時路由到**原生 Codex
    Plugin**的自然語言觸發：

    - "將此 Discord 頻道繫結到 Codex。"
    - "將此聊天附加到 Codex 討論串 `<id>`。"
    - "顯示 Codex 討論串，然後繫結這個。"

    原生 Codex 對話繫結是預設聊天控制路徑。
    OpenClaw 動態工具仍會透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合原生
    hook relay，讓 Plugin hooks 可以封鎖 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hooks 會轉送到
    OpenClaw `before_agent_finalize`，Plugin 可在該處要求再進行一次
    模型傳遞，然後 Codex 才完成其答案。relay 會刻意保持保守：
    它不會變更 Codex 原生工具
    引數，也不會改寫 Codex 討論串記錄。只有在你想要 ACP 執行階段/工作階段模型時，
    才使用明確 ACP。嵌入式 Codex
    支援邊界記錄於
    [Codex 工具 v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供者 / 執行階段選擇速查表">
    - `openai-codex/*` — PI Codex OAuth/訂閱路由。
    - `openai/*` 加上 `agentRuntime.id: "codex"` — 原生 Codex app-server 內嵌執行階段。
    - `/codex ...` — 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` — 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由到 ACP 執行階段的觸發條件：

    - "將此作為一次性的 Claude Code ACP 工作階段執行，並摘要結果。"
    - "在對話串中使用 Gemini CLI 執行此工作，然後將後續回覆保留在同一個對話串。"
    - "透過 ACP 在背景對話串中執行 Codex。"

    OpenClaw 會選取 `runtime: "acp"`、解析 harness `agentId`，
    在支援時繫結到目前對話或對話串，並
    將後續回覆路由到該工作階段，直到關閉/到期為止。Codex 只會
    在 ACP/acpx 明確指定，或原生 Codex
    Plugin 無法用於所要求的操作時，才會走這條路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、要求者未受沙盒限制，且已載入 ACP 執行階段
    後端時，才會公告 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停自動
    ACP 對話串分派，但不會隱藏或封鎖明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它會以 ACP harness id 為目標，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非該項目已
    以 `agents.list[].runtime.type="acp"` 明確設定，否則不要傳入來自 `agents_list` 的一般
    OpenClaw 設定代理 id；
    否則請使用預設子代理執行階段。當 OpenClaw 代理
    設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理

當你需要外部 harness 執行階段時，請使用 ACP。當 `codex`
Plugin 已啟用，且你需要 Codex 對話繫結/控制時，請使用 **原生 Codex
app-server**。當你需要 OpenClaw 原生的
委派執行時，請使用 **子代理**。

| 區域          | ACP 工作階段                           | 子代理執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端 Plugin（例如 acpx） | OpenClaw 原生子代理執行階段  |
| 工作階段金鑰   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要指令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

對於透過 ACP 的 Claude Code，其堆疊為：

1. OpenClaw ACP 工作階段控制平面。
2. 內建的 `acpx` 執行階段 Plugin。
3. Claude ACP 配接器。
4. Claude 端執行階段/工作階段機制。

ACP Claude 是具有 ACP 控制、工作階段續用、
背景工作追蹤，以及選用對話/對話串繫結的 **harness 工作階段**。

CLI 後端是獨立的純文字本機備援執行階段 — 請參閱
[CLI 後端](/zh-TW/gateway/cli-backends)。

對操作員而言，實務規則是：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制，或持久性 harness 工作嗎？** 使用 ACP。
- **需要透過原始 CLI 進行簡單的本機文字備援嗎？** 使用 CLI 後端。

## 繫結工作階段

### 心智模型

- **聊天介面** — 使用者持續對話的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** — OpenClaw 路由到的持久性 Codex/Claude/Gemini 執行階段狀態。
- **子對話串/主題** — 僅由 `--thread ...` 建立的選用額外訊息介面。
- **執行階段工作區** — harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。獨立於聊天介面。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話釘選到
產生的 ACP 工作階段 — 沒有子對話串，使用相同聊天介面。OpenClaw 會持續
管理傳輸、驗證、安全性與送達。該
對話中的後續訊息會路由到同一個工作階段；`/new` 和 `/reset` 會就地重設
工作階段；`/acp close` 會移除繫結。

範例：

```text
/codex bind                                              # 原生 Codex 繫結，將未來訊息路由到這裡
/codex model gpt-5.4                                     # 調整已繫結的原生 Codex 對話串
/codex stop                                              # 控制作用中的原生 Codex 回合
/acp spawn codex --bind here                             # Codex 的明確 ACP 備援
/acp spawn codex --thread auto                           # 可建立子對話串/主題並在該處繫結
/acp spawn codex --bind here --cwd /workspace/repo       # 相同聊天繫結，Codex 在 /workspace/repo 中執行
```

<AccordionGroup>
  <Accordion title="繫結規則與互斥性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於公告支援目前對話繫結的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。繫結會在 gateway 重新啟動後持續存在。
    - 在 Discord 上，只有當 OpenClaw 需要為 `--thread auto|here` 建立子對話串時，才需要 `spawnAcpSessions` — `--bind here` 不需要。
    - 如果你在未指定 `--cwd` 的情況下產生到不同的 ACP 代理，OpenClaw 預設會繼承**目標代理的**工作區。遺失的繼承路徑（`ENOENT`/`ENOTDIR`）會退回後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - Gateway 管理指令會保留在已繫結對話的本機處理 — 即使一般後續文字會路由到已繫結的 ACP 工作階段，`/acp ...` 指令仍由 OpenClaw 處理；只要該介面已啟用指令處理，`/status` 和 `/unfocus` 也會保留為本機處理。

  </Accordion>
  <Accordion title="對話串繫結工作階段">
    當頻道配接器已啟用對話串繫結時：

    - OpenClaw 會將對話串繫結到目標 ACP 工作階段。
    - 該對話串中的後續訊息會路由到已繫結的 ACP 工作階段。
    - ACP 輸出會送回同一個對話串。
    - 取消聚焦/關閉/封存/閒置逾時或最大存續時間到期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 指令，不是傳給 ACP harness 的提示。

    對話串繫結 ACP 的必要功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 對話串分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道配接器 ACP 對話串產生旗標（配接器特定）：
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    對話串繫結支援依配接器而定。如果作用中的頻道
    配接器不支援對話串繫結，OpenClaw 會回傳清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援對話串的頻道">
    - 任何公開工作階段/對話串繫結能力的頻道配接器。
    - 目前內建支援：**Discord** 對話串/頻道、**Telegram** 主題（群組/超級群組中的論壇主題與 DM 主題）。
    - Plugin 頻道可以透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久性頻道繫結

對於非暫時性工作流程，請在
頂層 `bindings[]` 項目中設定持久性 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久性 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀：

- **Discord 頻道/對話串：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/群組：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。若要穩定的群組繫結，建議使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。若要穩定的群組繫結，建議使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有者 OpenClaw 代理 id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的操作員可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用執行階段工作目錄。
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

**ACP 繫結工作階段的覆寫優先順序：**

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

- OpenClaw 會確保設定的 ACP 工作階段在使用前存在。
- 該頻道或主題中的訊息會路由到設定的 ACP 工作階段。
- 在已繫結對話中，`/new` 和 `/reset` 會就地重設相同的 ACP 工作階段金鑰。
- 暫時性執行階段繫結（例如由對話串聚焦流程建立的繫結）在存在時仍會套用。
- 對於未明確指定 `cwd` 的跨代理 ACP 產生，OpenClaw 會從代理設定繼承目標代理工作區。
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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段需明確設定
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true`，才能保留持久繫結的對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 命令">
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
  傳送至 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須為 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標 harness id。如果已設定，會退回使用 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的位置要求 thread 繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久的。如果 `thread: true` 且
  省略 `mode`，OpenClaw 可能會依 runtime 路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的 runtime 工作目錄（由後端/runtime
  政策驗證）。如果省略，ACP spawn 會在已設定時繼承目標代理程式工作區；
  缺少的繼承路徑會退回到後端預設值，而實際存取錯誤會被傳回。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段/橫幅文字中、面向操作員的標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續現有 ACP 工作階段，而不是建立新的工作階段。代理程式會透過
  `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要串流回要求者工作階段，作為系統事件。
  接受的回應包含 `streamLogPath`，指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以 tail 以查看完整轉送歷史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒後中止 ACP 子回合。`0` 會讓該回合保持在
  Gateway 的無逾時路徑上。同一個值會套用到 Gateway
  執行與 ACP runtime，因此停滯或配額用盡的 harness
  不會無限期占用父代理程式通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP spawn
  會在 `session/new` 前，將 OpenClaw Codex 參照（例如
  `openai-codex/gpt-5.4`）正規化為 Codex ACP 啟動設定；例如
  `openai-codex/gpt-5.4/high` 的斜線形式也會設定 Codex ACP
  reasoning effort。其他 harness 必須公開 ACP `models` 並支援
  `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是靜默退回目標代理程式預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的 thinking/reasoning effort。對於 Codex ACP，`minimal` 對應到低 effort，
  `low`/`medium`/`high`/`xhigh` 會直接對應，而 `off`
  會省略 reasoning-effort 啟動覆寫。
</ParamField>

## Spawn 繫結與 thread 模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 在原處繫結目前作用中的對話；如果沒有作用中的對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    注意事項：

    - `--bind here` 是「讓這個頻道或聊天由 Codex 支援」最簡單的操作員路徑。
    - `--bind here` 不會建立子 thread。
    - `--bind here` 僅可用於公開目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中的 thread 中：繫結該 thread。在 thread 外：在支援時建立/繫結子 thread。 |
    | `here` | 要求目前作用中的 thread；如果不在 thread 中則失敗。                                                  |
    | `off`  | 不繫結。工作階段會以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非 thread 繫結介面上，預設行為實際上是 `off`。
    - thread 繫結的 spawn 需要頻道政策支援：
      - Discord：`channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnAcpSessions=true`
    - 當你想固定目前對話而不建立子 thread 時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父擁有的背景工作。
傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段旨在持續於可見聊天介面上對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道 thread/topic 繫結到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符的對話路由至同一個 ACP 工作階段。

    繫結對話中的後續訊息會直接路由至
    ACP 工作階段，而 ACP 輸出會傳回同一個
    頻道/thread/topic。

    OpenClaw 傳送給 harness 的內容：

    - 一般繫結後續訊息會以提示文字傳送，只有在 harness/後端支援時才會附加附件。
    - `/acp` 管理命令與本機 Gateway 命令會在 ACP 分派前被攔截。
    - runtime 產生的完成事件會依目標具體化。OpenClaw 代理程式會取得 OpenClaw 的內部 runtime-context envelope；外部 ACP harness 會取得包含子結果與指令的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope 絕不應傳送給外部 harness，或作為 ACP 使用者 transcript 文字保存。
    - ACP transcript 項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="父擁有的一次性 ACP 工作階段">
    由另一個代理程式執行所 spawn 的一次性 ACP 工作階段是背景子項，
    類似於子代理程式：

    - 父項使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子項會在自己的 ACP harness 工作階段中執行。
    - 子回合會在原生子代理程式 spawn 使用的同一個背景通道上執行，因此緩慢的 ACP harness 不會阻塞不相關的主工作階段工作。
    - 完成會透過任務完成 announce 路徑回報。OpenClaw 會先將內部完成中繼資料轉換為純 ACP 提示，再傳送給外部 harness，因此 harness 不會看到 OpenClaw 專用的 runtime context 標記。
    - 當使用者可見回覆有用時，父項會以一般 assistant 語氣重寫子結果。

    **不要**將此路徑視為父項與子項之間的點對點聊天。
    子項已經有回到父項的完成通道。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可以在 spawn 後鎖定另一個工作階段。對於一般
    peer 工作階段，OpenClaw 會在注入訊息後使用 agent-to-agent (A2A) 後續路徑：

    - 等待目標工作階段回覆。
    - 可選擇讓要求者與目標交換有限數量的後續回合。
    - 要求目標產生 announce 訊息。
    - 將該 announce 傳遞到可見頻道或 thread。

    對於傳送者需要可見後續回覆的 peer 傳送，該 A2A 路徑是 fallback。
    當不相關的工作階段可以看到並傳訊給 ACP 目標時，它仍會保持啟用，
    例如在寬鬆的 `tools.sessions.visibility` 設定下。

    只有當要求者是其自身父擁有的一次性 ACP 子項的父項時，
    OpenClaw 才會跳過 A2A 後續。在該情況下，在任務完成之上執行 A2A
    可能會用子項結果喚醒父項，將父項回覆轉送回子項，
    並建立父/子 echo 迴圈。`sessions_send` 結果會針對該擁有子項情況回報
    `delivery.status="skipped"`，因為完成路徑已負責該結果。

  </Accordion>
  <Accordion title="繼續現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是重新開始。
    代理程式會透過 `session/load` 重播其對話歷史，因此會帶著先前完整上下文繼續。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從你的筆電交接到手機，告訴你的代理程式從離開處繼續。
    - 繼續你先前在 CLI 中互動式啟動的程式碼工作階段，現在透過你的代理程式以無頭方式執行。
    - 接續因 gateway 重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 僅在 `runtime: "acp"` 時適用；預設子代理程式 runtime 會忽略此 ACP 專用欄位。
    - `streamTo` 僅在 `runtime: "acp"` 時適用；預設子代理程式 runtime 會忽略此 ACP 專用欄位。
    - `resumeSessionId` 是主機本機的 ACP/harness resume id，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP spawn 政策與目標代理程式政策，而 ACP 後端或 harness 擁有載入該上游 id 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段 id，spawn 會以清楚錯誤失敗，不會靜默 fallback 到新工作階段。

  </Accordion>
  <Accordion title="部署後 smoke test">
    gateway 部署後，請執行即時端對端檢查，而不是只相信單元測試：

    1. 驗證目標主機上的已部署 gateway 版本與 commit。
    2. 開啟到即時代理程式的臨時 ACPX 橋接工作階段。
    3. 要求該代理程式以 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 和任務 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有 validator 錯誤。
    5. 清理臨時橋接工作階段。

    將 gate 保持在 `mode: "run"` 並略過 `streamTo: "parent"`；
    thread 繫結的 `mode: "session"` 與 stream-relay 路徑是另外更豐富的整合通過項目。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機 runtime 上執行，**不是**在
OpenClaw 沙箱內。

<Warning>
**安全邊界：**

- 外部執行器可依其自身 CLI 權限與所選 `cwd` 進行讀取/寫入。
- OpenClaw 的沙箱政策**不會**包覆 ACP 執行器的執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理、工作階段擁有權、通道繫結，以及 Gateway 傳遞政策。
- 使用 `runtime: "subagent"` 進行由沙箱強制執行的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段已被沙箱化，ACP 產生工作階段會同時封鎖 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

多數 `/acp` 動作接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試 key
   - 接著嘗試 UUID 形狀的工作階段 id
   - 接著嘗試標籤
2. 目前執行緒繫結（如果此對話/執行緒已繫結至 ACP 工作階段）。
3. 目前請求者工作階段備援。

目前對話繫結和執行緒繫結都會參與
步驟 2。

如果無法解析出目標，OpenClaw 會回傳明確錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 作用                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段正在進行的回合。                          | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 傳送引導指令到執行中的工作階段。                          | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、runtime 選項、功能。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的 runtime 模式。                         | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用 runtime 設定選項。                               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定 runtime 工作目錄覆寫。                               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定 runtime 逾時（秒）。                                 | `/acp timeout 120`                                            |
| `/acp model`         | 設定 runtime 模型覆寫。                                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段 runtime 選項覆寫。                           | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存區列出最近的 ACP 工作階段。                         | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、功能、可採取的修正。                        | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                              | `/acp install`                                                |

`/acp status` 會顯示有效的 runtime 選項，以及 runtime 層級與
後端層級的工作階段識別碼。當後端缺少某項功能時，會清楚顯示
不支援的控制項錯誤。`/acp sessions` 會讀取目前已繫結或請求者工作階段的
儲存區；目標 token
（`session-key`、`session-id` 或 `session-label`）會透過
gateway 工作階段探索解析，包括自訂的每代理 `session.store`
根目錄。

### Runtime 選項對應

`/acp` 提供便利命令與通用 setter。等效
操作：

| 命令                         | 對應到                               | 備註                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | runtime 設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai-codex/<model>` 正規化為配接器模型 id，並將斜線推理後綴（例如 `openai-codex/gpt-5.4/high`）對應到 `reasoning_effort`。 |
| `/acp set thinking <level>`  | runtime 設定鍵 `thinking`            | 對於 Codex ACP，OpenClaw 會在配接器支援時傳送對應的 `reasoning_effort`。                                                                                                      |
| `/acp permissions <profile>` | runtime 設定鍵 `approval_policy`     | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | runtime 設定鍵 `timeout`             | —                                                                                                                                                                              |
| `/acp cwd <path>`            | runtime cwd 覆寫                     | 直接更新。                                                                                                                                                                     |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 會使用 cwd 覆寫路徑。                                                                                                                                                |
| `/acp reset-options`         | 清除所有 runtime 覆寫                | —                                                                                                                                                                              |

## acpx 執行器、Plugin 設定與權限

如需 acpx 執行器設定（Claude Code / Codex / Gemini CLI
別名）、plugin-tools 與 OpenClaw-tools MCP 橋接，以及 ACP
權限模式，請參閱
[ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端 Plugin 遺失、已停用，或遭 `plugins.allow` 封鎖。                                                                  | 安裝並啟用後端 Plugin；若已設定該允許清單，請在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用從一般執行緒訊息自動分派。                                                                                       | 設定 `acp.dispatch.enabled=true` 以恢復自動執行緒路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | 代理未在允許清單中。                                                                                                   | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 後端 Plugin 遺失、已停用、遭允許/拒絕政策封鎖，或其設定的可執行檔不可用。                                              | 安裝/啟用後端 Plugin，重新執行 `/acp doctor`；若仍不健康，請檢查後端安裝或政策錯誤。                                                                                    |
| 找不到執行環境命令                                                          | 未安裝轉接器 CLI、外部 Plugin 遺失，或非 Codex 轉接器的首次執行 `npx` 擷取失敗。                                       | 執行 `/acp doctor`、在 Gateway 主機上安裝/預熱轉接器，或明確設定 acpx 代理命令。                                                                                        |
| 執行環境回報找不到模型                                                      | 模型 ID 對另一個供應商/執行環境有效，但不適用於此 ACP 目標。                                                          | 使用該執行環境列出的模型、在執行環境中設定模型，或省略覆寫。                                                                                                           |
| 執行環境回報供應商驗證錯誤                                                  | OpenClaw 狀態正常，但目標 CLI/供應商尚未登入。                                                                         | 登入，或在 Gateway 主機環境中提供所需的供應商金鑰。                                                                                                                     |
| `Unable to resolve session target: ...`                                     | 錯誤的 key/ID/標籤權杖。                                                                                               | 執行 `/acp sessions`，複製確切的 key/標籤，然後重試。                                                                                                                   |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有作用中可繫結對話的情況下使用 `--bind here`。                                                                     | 移至目標聊天/頻道後重試，或使用未繫結的 spawn。                                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | 轉接器缺少目前對話的 ACP 繫結功能。                                                                                    | 在支援的情況下使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在執行緒內容外使用 `--thread here`。                                                                                    | 移至目標執行緒，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的繫結目標。                                                                                     | 以擁有者身分重新繫結，或使用不同的對話或執行緒。                                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | 轉接器缺少執行緒繫結功能。                                                                                             | 使用 `--thread off`，或移至支援的轉接器/頻道。                                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 執行階段位於主機端；請求者工作階段已沙盒化。                                                                       | 從沙盒化工作階段使用 `runtime="subagent"`，或從非沙盒化工作階段執行 ACP spawn。                                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 對 ACP 執行階段要求 `sandbox="require"`。                                                                               | 對必要的沙盒化使用 `runtime="subagent"`，或從非沙盒化工作階段使用搭配 `sandbox="inherit"` 的 ACP。                                                                       |
| `Cannot apply --model ... did not advertise model support`                  | 目標執行環境未公開通用 ACP 模型切換。                                                                                  | 使用宣告支援 ACP `models`/`session/set_model` 的執行環境、使用 Codex ACP 模型參照，或若執行環境有自己的啟動旗標，請直接在其中設定模型。                                |
| 已繫結工作階段缺少 ACP 中繼資料                                             | ACP 工作階段中繼資料過期/已刪除。                                                                                      | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦執行緒。                                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 阻擋非互動式 ACP 工作階段中的寫入/執行。                                                              | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。              |
| ACP 工作階段很早失敗且幾乎沒有輸出                                          | 權限提示遭 `permissionMode`/`nonInteractivePermissions` 阻擋。                                                         | 檢查 gateway 記錄中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。                     |
| ACP 工作階段完成工作後無限期停滯                                            | 執行環境程序已完成，但 ACP 工作階段未回報完成。                                                                        | 使用 `ps aux \| grep acpx` 監控；手動終止過期程序。                                                                                                                     |
| 執行環境看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件封套洩漏到 ACP 邊界之外。                                                                                      | 更新 OpenClaw 並重新執行完成流程；外部執行環境應只收到純完成提示。                                                                                                     |

## 相關

- [ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)
- [代理傳送](/zh-TW/tools/agent-send)
- [CLI 後端](/zh-TW/gateway/cli-backends)
- [Codex 執行環境](/zh-TW/plugins/codex-harness)
- [多代理沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理](/zh-TW/tools/subagents)
