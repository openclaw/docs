---
read_when:
    - 透過 ACP 執行程式碼撰寫框架
    - 在訊息通道上設定對話綁定的 ACP 工作階段
    - 將訊息通道對話繫結至持久性 ACP 工作階段
    - 疑難排解 ACP 後端、Plugin 串接或補全傳遞
    - 從聊天中操作 /acp 指令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部編碼工具（Claude Code、Cursor、Gemini CLI、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-05-02T21:04:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[代理用戶端協定 (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端 Plugin 執行外部程式碼作業框架（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX 作業框架）。

每次 ACP 工作階段產生都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部作業框架路徑，不是預設的 Codex 路徑。** 原生
Codex app-server Plugin 擁有 `/codex ...` 控制項與
`agentRuntime.id: "codex"` 嵌入式執行階段；ACP 擁有
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你希望 Codex 或 Claude Code 作為外部 MCP 用戶端
直接連線到既有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我該看哪一頁？

| 你想要…                                                                                        | 使用                                  | 備註                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 啟用 `codex` Plugin 時的原生 Codex app-server 路徑；包含已繫結的聊天回覆、影像轉發、模型/快速/權限、停止與導引控制。ACP 是明確的備援 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部作業框架                 | 本頁                                  | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                                                  |
| 將 OpenClaw Gateway 工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                              | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 與 OpenClaw 對話                                                                                                                                    |
| 重用本機 AI CLI 作為純文字備援模型                                                              | [CLI 後端](/zh-TW/gateway/cli-backends)     | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有作業框架執行階段                                                                                                                          |

## 這可以開箱即用嗎？

可以，在安裝官方 ACP 執行階段 Plugin 之後：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 之後使用本機
`extensions/acpx` workspace Plugin。執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只有在 ACP **真正可用**時，才會教代理如何產生 ACP：
ACP 必須已啟用、dispatch 不得停用、目前工作階段不得遭沙盒封鎖，
且執行階段後端必須已載入。如果這些條件未滿足，ACP Plugin skills
與 `sessions_spawn` ACP 指引會保持隱藏，避免代理建議不可用的後端。

<AccordionGroup>
  <Accordion title="First-run gotchas">
    - 如果設定了 `plugins.allow`，它就是限制性 Plugin 清單，且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意封鎖，`/acp doctor` 會回報缺少 allowlist 項目。
    - Codex ACP adapter 會隨 `acpx` Plugin 一起暫存，並在可行時於本機啟動。
    - 其他目標作業框架 adapter 第一次使用時，仍可能透過 `npx` 按需擷取。
    - 該作業框架的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取權，首次執行的 adapter 擷取會失敗，直到快取已預熱或以其他方式安裝 adapter。

  </Accordion>
  <Accordion title="Runtime prerequisites">
    ACP 會啟動真正的外部作業框架程序。OpenClaw 負責路由、
    背景任務狀態、交付、繫結與政策；作業框架負責自己的
    供應商登入、模型目錄、檔案系統行為與原生工具。

    在歸咎於 OpenClaw 之前，請確認：

    - `/acp doctor` 回報後端已啟用且健康。
    - 設定 allowlist 時，目標 ID 已由 `acp.allowedAgents` 允許。
    - 作業框架命令可在 Gateway 主機上啟動。
    - 該作業框架的供應商驗證已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該作業框架中 — 模型 ID 無法跨作業框架移植。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd`，讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此大量寫入/執行的程式碼作業通常需要可無人值守繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 工具與內建 OpenClaw 工具預設**不會**公開給
ACP 作業框架。只有在作業框架應直接呼叫這些工具時，才啟用
[ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的作業框架目標

使用 `acpx` 後端時，請使用這些作業框架 ID 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 作業框架 ID | 典型後端                                       | 備註                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | 需要主機上的 Claude Code 驗證。                                                     |
| `codex`    | Codex ACP adapter                              | 僅在原生 `/codex` 不可用或明確要求 ACP 時，作為明確 ACP 備援。                      |
| `copilot`  | GitHub Copilot ACP adapter                     | 需要 Copilot CLI/執行階段驗證。                                                     |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。                               |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 驗證，或作業框架環境中的 `FACTORY_API_KEY`。                     |
| `gemini`   | Gemini CLI ACP adapter                         | 需要 Gemini CLI 驗證或 API 金鑰設定。                                                |
| `iflow`    | iFlow CLI                                      | Adapter 可用性與模型控制取決於已安裝的 CLI。                                        |
| `kilocode` | Kilo Code CLI                                  | Adapter 可用性與模型控制取決於已安裝的 CLI。                                        |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                                   |
| `kiro`     | Kiro CLI                                       | Adapter 可用性與模型控制取決於已安裝的 CLI。                                        |
| `opencode` | OpenCode ACP adapter                           | 需要 OpenCode CLI/供應商驗證。                                                      |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接   | 讓支援 ACP 的作業框架與 OpenClaw Gateway 工作階段對話。                             |
| `pi`       | Pi/嵌入式 OpenClaw 執行階段                    | 用於 OpenClaw 原生作業框架實驗。                                                    |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主機上的 Qwen 相容驗證。                                                        |

自訂 acpx 代理別名可以在 acpx 本身中設定，但 OpenClaw 政策仍會在 dispatch 前
檢查 `acp.allowedAgents` 以及任何 `agents.list[].runtime.acp.agent` 對應。

## 操作員執行手冊

從聊天快速使用 `/acp` 流程：

<Steps>
  <Step title="Spawn">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="Work">
    在已繫結的對話或執行緒中繼續（或明確指定工作階段金鑰）。
  </Step>
  <Step title="Check state">
    `/acp status`
  </Step>
  <Step title="Tune">
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="Steer">
    不取代脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="Stop">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Lifecycle details">
    - Spawn 會建立或恢復 ACP 執行階段工作階段、在 OpenClaw 工作階段儲存區記錄 ACP 中繼資料，並可能在執行由父層擁有時建立背景任務。
    - 父層擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是持久的；完成與跨介面交付會透過父任務通知器，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉終止或孤立的父層擁有一次性 ACP 工作階段。持久 ACP 工作階段會在仍有作用中對話繫結時保留；沒有作用中繫結的過時持久工作階段會被關閉，使其無法在擁有它的任務完成或其任務記錄消失後被靜默恢復。
    - 已繫結的後續訊息會直接傳送至 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或過期。
    - Gateway 命令會留在本機。`/acp ...`、`/status` 與 `/unfocus` 永遠不會作為一般提示文字傳送給已繫結的 ACP 作業框架。
    - 當後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。如果作業框架支援恢復，它仍可能保留自己的上游歷史。
    - 閒置的執行階段 worker 在 `acp.runtime.ttlMinutes` 之後有資格被清理；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="Native Codex routing rules">
    當**原生 Codex Plugin**啟用時，應路由到它的自然語言觸發：

    -「將這個 Discord 頻道繫結到 Codex。」
    -「將這個聊天附加到 Codex 執行緒 `<id>`。」
    -「顯示 Codex 執行緒，然後繫結這一個。」

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍會透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合的原生
    hook 轉送，使 Plugin hook 可以阻擋 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hook 會被轉送到 OpenClaw `before_agent_finalize`，
    Plugin 可在此要求 Codex 完成其答案前再進行一次模型傳遞。
    轉送機制刻意保持保守：它不會變更 Codex 原生工具引數，也不會重寫
    Codex 執行緒記錄。只有在你想要 ACP 執行階段/工作階段模型時，
    才使用明確 ACP。嵌入式 Codex 支援邊界記錄於
    [Codex 作業框架 v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供者 / 執行階段選擇速查表">
    - `openai-codex/*` — PI Codex OAuth/訂閱路由。
    - `openai/*` 加上 `agentRuntime.id: "codex"` — 原生 Codex app-server 內嵌執行階段。
    - `/codex ...` — 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` — 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由的自然語言觸發條件">
    應路由至 ACP 執行階段的觸發條件：

    - "Run this as a one-shot Claude Code ACP session and summarize the result."
    - "Use Gemini CLI for this task in a thread, then keep follow-ups in that same thread."
    - "Run Codex through ACP in a background thread."

    OpenClaw 會選擇 `runtime: "acp"`、解析 harness `agentId`，
    在支援時繫結到目前的對話或討論串，並將後續訊息路由至該工作階段，
    直到關閉或過期為止。只有在明確指定 ACP/acpx，或原生 Codex
    plugin 無法用於所要求的操作時，Codex 才會採用這條路徑。

    對於 `sessions_spawn`，只有在 ACP 已啟用、請求者未被沙箱化，
    且已載入 ACP 執行階段後端時，才會公開 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 會暫停自動 ACP 討論串派送，
    但不會隱藏或封鎖明確的 `sessions_spawn({ runtime: "acp" })`
    呼叫。它會以 `codex`、`claude`、`droid`、`gemini` 或 `opencode`
    等 ACP harness id 為目標。除非 `agents_list` 中的項目已明確設定
    `agents.list[].runtime.type="acp"`，否則不要傳入一般的 OpenClaw
    設定 agent id；請改用預設的子代理程式執行階段。當 OpenClaw agent
    設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理程式

當你需要外部 harness 執行階段時，請使用 ACP。當 `codex`
plugin 已啟用，且你需要 Codex 對話繫結/控制時，請使用**原生 Codex
app-server**。當你需要 OpenClaw 原生的委派執行時，請使用**子代理程式**。

| 領域          | ACP 工作階段                           | 子代理程式執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端 plugin（例如 acpx）            | OpenClaw 原生子代理程式執行階段  |
| 工作階段鍵值   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要指令       | `/acp ...`                            | `/subagents ...`                   |
| 生成工具       | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理程式](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 使用 Claude Code 時，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段 plugin。
3. Claude ACP 介面卡。
4. Claude 端執行階段/工作階段機制。

ACP Claude 是具有 ACP 控制、工作階段續用、背景任務追蹤，
以及選用對話/討論串繫結的 **harness 工作階段**。

CLI 後端是獨立的純文字本機後援執行階段 — 請參閱
[CLI 後端](/zh-TW/gateway/cli-backends)。

對操作員而言，實務規則是：

- **需要 `/acp spawn`、可繫結的工作階段、執行階段控制，或持久 harness 工作？** 使用 ACP。
- **需要透過原始 CLI 進行簡單的本機文字後援？** 使用 CLI 後端。

## 已繫結的工作階段

### 心智模型

- **聊天介面** — 使用者持續交談的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** — OpenClaw 路由到的持久 Codex/Claude/Gemini 執行階段狀態。
- **子討論串/主題** — 只有 `--thread ...` 才會建立的選用額外訊息介面。
- **執行階段工作區** — harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。它獨立於聊天介面。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話釘選到
已生成的 ACP 工作階段 — 不建立子討論串，使用相同聊天介面。OpenClaw 持續
負責傳輸、驗證、安全與遞送。該對話中的後續訊息會路由到同一個工作階段；
`/new` 和 `/reset` 會在原處重設工作階段；`/acp close` 會移除繫結。

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
  <Accordion title="繫結規則與排他性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於宣告支援目前對話繫結的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。繫結會在 Gateway 重新啟動後保留。
    - 在 Discord 上，`spawnSessions` 會控管 `--thread auto|here` 的子討論串建立 — 不控管 `--bind here`。
    - 如果你在沒有 `--cwd` 的情況下生成到不同 ACP agent，OpenClaw 預設會繼承**目標 agent 的**工作區。缺少的繼承路徑（`ENOENT`/`ENOTDIR`）會回退到後端預設值；其他存取錯誤（例如 `EACCES`）會以生成錯誤呈現。
    - Gateway 管理指令會在已繫結對話中保持本機處理 — 即使一般後續文字會路由到已繫結的 ACP 工作階段，`/acp ...` 指令仍由 OpenClaw 處理；只要該介面已啟用指令處理，`/status` 和 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="討論串繫結的工作階段">
    當頻道介面卡啟用討論串繫結時：

    - OpenClaw 會將討論串繫結到目標 ACP 工作階段。
    - 該討論串中的後續訊息會路由到已繫結的 ACP 工作階段。
    - ACP 輸出會遞送回同一個討論串。
    - 取消聚焦/關閉/封存/閒置逾時或最長存留時間過期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 指令，不是傳給 ACP harness 的提示。

    討論串繫結 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 討論串派送；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道介面卡討論串工作階段生成（預設：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    討論串繫結支援依介面卡而異。如果目前使用中的頻道
    介面卡不支援討論串繫結，OpenClaw 會回傳清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援討論串的頻道">
    - 任何公開工作階段/討論串繫結能力的頻道介面卡。
    - 目前內建支援：**Discord** 討論串/頻道、**Telegram** 主題（群組/超級群組中的論壇主題和 DM 主題）。
    - Plugin 頻道可以透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久頻道繫結

對於非暫時性工作流程，請在頂層 `bindings[]` 項目中設定持久 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀：

- **Discord 頻道/討論串：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM/群組：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。建議使用 `chat_id:*` 或 `chat_identifier:*` 取得穩定的群組繫結。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。建議使用 `chat_id:*` 取得穩定的群組繫結。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有此繫結的 OpenClaw agent id。
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

### 每個 agent 的執行階段預設值

使用 `agents.list[].runtime` 為每個 agent 定義一次 ACP 預設值：

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

- OpenClaw 會確保設定的 ACP 工作階段在使用前已存在。
- 該頻道或主題中的訊息會路由到設定的 ACP 工作階段。
- 在已繫結對話中，`/new` 和 `/reset` 會在原處重設同一個 ACP 工作階段鍵值。
- 臨時執行階段繫結（例如由討論串聚焦流程建立）在存在時仍會套用。
- 對於沒有明確 `cwd` 的跨 agent ACP 生成，OpenClaw 會從 agent 設定繼承目標 agent 工作區。
- 缺少的繼承工作區路徑會回退到後端預設 cwd；非缺少路徑造成的存取失敗會以生成錯誤呈現。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

<Tabs>
  <Tab title="從 sessions_spawn">
    使用 `runtime: "acp"` 從 agent 回合或工具呼叫啟動 ACP 工作階段。

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
    `thread: true`，以保留持久繫結的對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 指令">
    使用 `/acp spawn`，可從聊天中明確進行操作者控制。

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

    請參閱 [斜線指令](/zh-TW/tools/slash-commands)。

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
  ACP 目標 harness ID。若已設定，會回退至 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的位置要求討論串繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久模式。如果 `thread: true` 且省略
  `mode`，OpenClaw 可能會依 runtime 路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的 runtime 工作目錄（由後端/runtime 政策驗證）。如果省略，ACP spawn 會在已設定時繼承目標代理工作區；缺少的繼承路徑會回退至後端預設值，而真實存取錯誤會被傳回。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段/橫幅文字的操作者可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續既有 ACP 工作階段，而不是建立新的工作階段。代理會透過
  `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要串流回要求者工作階段，作為系統事件。接受的回應包含
  `streamLogPath`，指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以追蹤它以取得完整轉送歷史。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒後中止 ACP 子回合。`0` 會讓該回合使用 Gateway 的無逾時路徑。同一個值會套用到 Gateway 執行與 ACP runtime，因此停滯或配額耗盡的 harness 不會無限期占用父代理通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP spawn 會在 `session/new` 之前，將
  `openai-codex/gpt-5.4` 等 OpenClaw Codex 參照正規化為 Codex
  ACP 啟動設定；像 `openai-codex/gpt-5.4/high` 這類斜線形式也會設定 Codex ACP 推理強度。
  其他 harness 必須公告 ACP `models` 並支援
  `session/set_model`；否則 OpenClaw/acpx 會明確失敗，而不是靜默回退至目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對 Codex ACP 而言，`minimal` 會對應到低強度，
  `low`/`medium`/`high`/`xhigh` 會直接對應，而 `off`
  會省略推理強度啟動覆寫。
</ParamField>

## Spawn 繫結與討論串模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前作用中的對話；若沒有作用中對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    注意事項：

    - `--bind here` 是「讓這個頻道或聊天由 Codex 支援」最簡單的操作者路徑。
    - `--bind here` 不會建立子討論串。
    - `--bind here` 僅可用於公開目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中的討論串內：繫結該討論串。在討論串外：在支援時建立/繫結子討論串。 |
    | `here` | 要求目前有作用中的討論串；若不在討論串內則失敗。                                                  |
    | `off`  | 無繫結。工作階段會以未繫結狀態開始。                                                                 |

    注意事項：

    - 在非討論串繫結介面上，預設行為實際上是 `off`。
    - 討論串繫結的 spawn 需要頻道政策支援：
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - 想要固定目前對話而不建立子討論串時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段用於在可見的聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道討論串/主題繫結到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    繫結對話中的後續訊息會直接路由到 ACP 工作階段，而 ACP 輸出會傳回同一個頻道/討論串/主題。

    OpenClaw 傳送到 harness 的內容：

    - 一般繫結後續訊息會以提示文字傳送，只有在 harness/後端支援時才會附上附件。
    - `/acp` 管理指令與本機 Gateway 指令會在 ACP 分派前被攔截。
    - runtime 產生的完成事件會依目標具體化。OpenClaw 代理會取得 OpenClaw 的內部 runtime-context envelope；外部 ACP harness 會取得包含子結果與指示的一般提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` envelope 絕不應傳送給外部 harness，或作為 ACP 使用者 transcript 文字持久化。
    - ACP transcript 項目會使用使用者可見的觸發文字或一般完成提示。內部事件中繼資料會在可行時於 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="父層擁有的一次性 ACP 工作階段">
    由另一個代理執行產生的一次性 ACP 工作階段是背景子工作，類似於子代理：

    - 父層會使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子工作會在自己的 ACP harness 工作階段中執行。
    - 子回合會在原生子代理 spawn 所使用的同一個背景通道上執行，因此緩慢的 ACP harness 不會阻擋無關的主工作階段工作。
    - 完成會透過工作完成公告路徑回報。OpenClaw 會在將內部完成中繼資料傳送到外部 harness 前，轉換為一般 ACP 提示，因此 harness 不會看到 OpenClaw 專用的 runtime context 標記。
    - 當使用者可見回覆有用時，父層會以一般助理語氣重寫子結果。

    **不要**將此路徑視為父層與子層之間的對等聊天。子工作已經有回到父層的完成通道。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可以在 spawn 後指定另一個工作階段。對於一般對等工作階段，OpenClaw 會在注入訊息後使用代理對代理（A2A）後續路徑：

    - 等待目標工作階段的回覆。
    - 可選擇讓要求者和目標交換有界數量的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見頻道或討論串。

    該 A2A 路徑是對等傳送的備援，適用於傳送者需要可見後續回覆的情況。當無關工作階段能看到並傳訊給 ACP 目標時，例如在寬鬆的
    `tools.sessions.visibility` 設定下，它會保持啟用。

    只有在要求者是自己父層擁有的一次性 ACP 子工作階段之父層時，OpenClaw 才會略過 A2A 後續。在此情況下，於工作完成之上執行 A2A 可能會以子工作結果喚醒父層，將父層回覆轉送回子層，並建立父/子回音循環。對於這個擁有的子工作案例，
    `sessions_send` 結果會回報 `delivery.status="skipped"`，因為完成路徑已負責該結果。

  </Accordion>
  <Accordion title="繼續既有工作階段">
    使用 `resumeSessionId` 可繼續先前的 ACP 工作階段，而不是重新開始。代理會透過
    `session/load` 重播其對話歷史，因此會以先前的完整內容接續。

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從筆電交接到手機 — 告訴你的代理從你離開的位置繼續。
    - 繼續你在 CLI 中互動式啟動的程式碼工作階段，現在透過代理以無頭方式進行。
    - 接續因 Gateway 重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 僅在 `runtime: "acp"` 時適用；預設子代理 runtime 會忽略這個 ACP 專用欄位。
    - `streamTo` 僅在 `runtime: "acp"` 時適用；預設子代理 runtime 會忽略這個 ACP 專用欄位。
    - `resumeSessionId` 是主機本機 ACP/harness 繼續 ID，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP spawn 政策與目標代理政策，而 ACP 後端或 harness 負責載入該上游 ID 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段 ID，spawn 會以明確錯誤失敗 — 不會靜默回退至新工作階段。

  </Accordion>
  <Accordion title="部署後煙霧測試">
    Gateway 部署後，請執行即時端到端檢查，而不是只信任單元測試：

    1. 驗證目標主機上已部署的 Gateway 版本與 commit。
    2. 開啟到即時代理的暫時 ACPX bridge 工作階段。
    3. 要求該代理使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 和任務 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時 bridge 工作階段。

    將 gate 保持在 `mode: "run"` 並略過 `streamTo: "parent"` —
    討論串繫結的 `mode: "session"` 與串流轉送路徑是獨立且更完整的整合流程。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機 runtime 上執行，**不是**在
OpenClaw 沙箱內執行。

<Warning>
**安全邊界：**

- 外部 harness 可依據其自身的 CLI 權限與所選的 `cwd` 進行讀取/寫入。
- OpenClaw 的沙箱政策**不會**包覆 ACP harness 執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理、工作階段擁有權、通道繫結，以及 Gateway 傳遞政策。
- 使用 `runtime: "subagent"` 進行由沙箱強制執行的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段已啟用沙箱，ACP 產生會同時封鎖 `sessions_spawn({ runtime: "acp" })` 與 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作都接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試 key
   - 接著嘗試 UUID 形式的工作階段 id
   - 接著嘗試 label
2. 目前討論串繫結（如果此對話/討論串已繫結至 ACP 工作階段）。
3. 目前請求者工作階段備援。

目前對話繫結與討論串繫結都會參與
步驟 2。

如果無法解析任何目標，OpenClaw 會傳回清楚的錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選用目前繫結或討論串繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段中正在進行的回合。                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將導向指令傳送至執行中的工作階段。                        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除討論串目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項、能力。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                          | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                                  | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                            | `/acp reset-options`                                          |
| `/acp sessions`      | 從 store 列出最近的 ACP 工作階段。                        | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、能力、可執行的修正。                        | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                              | `/acp install`                                                |

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級和
後端層級的工作階段識別碼。當後端缺少某項能力時，不支援控制項的錯誤會
清楚顯示。`/acp sessions` 會讀取目前已繫結或請求者工作階段的
store；目標 token
（`session-key`、`session-id` 或 `session-label`）會透過
gateway 工作階段探索解析，包括自訂的每代理 `session.store`
根目錄。

### 執行階段選項對應

`/acp` 有便利命令與通用 setter。等效
操作如下：

| 命令                         | 對應至                               | 備註                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 執行階段設定 key `model`             | 對於 Codex ACP，OpenClaw 會將 `openai-codex/<model>` 正規化為 adapter model id，並將斜線 reasoning 後綴（例如 `openai-codex/gpt-5.4/high`）對應至 `reasoning_effort`。                    |
| `/acp set thinking <level>`  | 執行階段設定 key `thinking`          | 對於 Codex ACP，在 adapter 支援時，OpenClaw 會傳送對應的 `reasoning_effort`。                                                                                                             |
| `/acp permissions <profile>` | 執行階段設定 key `approval_policy`   | —                                                                                                                                                                                          |
| `/acp timeout <seconds>`     | 執行階段設定 key `timeout`           | —                                                                                                                                                                                          |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                                 |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 會使用 cwd 覆寫路徑。                                                                                                                                                           |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | —                                                                                                                                                                                          |

## acpx harness、Plugin 設定與權限

如需 acpx harness 設定（Claude Code / Codex / Gemini CLI
別名）、plugin-tools 與 OpenClaw-tools MCP bridge，以及 ACP
權限模式，請參閱
[ACP 代理 — 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正方式                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端 Plugin 遺失、已停用，或被 `plugins.allow` 封鎖。                                                                  | 安裝並啟用後端 Plugin；若已設定該允許清單，請將 `acpx` 納入 `plugins.allow`，然後執行 `/acp doctor`。                                                                   |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用從一般執行緒訊息自動分派。                                                                                      | 設定 `acp.dispatch.enabled=true` 以恢復自動執行緒路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍會運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent 不在允許清單中。                                                                                                 | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 後端 Plugin 遺失、已停用、被允許/拒絕政策封鎖，或其設定的可執行檔無法使用。                                           | 安裝/啟用後端 Plugin，重新執行 `/acp doctor`；若仍不健康，請檢查後端安裝或政策錯誤。                                                                                    |
| Harness command not found                                                   | 配接器 CLI 尚未安裝、外部 Plugin 遺失，或非 Codex 配接器的首次執行 `npx` 擷取失敗。                                   | 執行 `/acp doctor`，在 Gateway 主機上安裝/預熱配接器，或明確設定 acpx agent 命令。                                                                                      |
| Model-not-found from the harness                                            | 模型 ID 對其他提供者/harness 有效，但對此 ACP 目標無效。                                                              | 使用該 harness 列出的模型、在 harness 中設定模型，或省略覆寫。                                                                                                          |
| Vendor auth error from the harness                                          | OpenClaw 狀態正常，但目標 CLI/提供者尚未登入。                                                                         | 在 Gateway 主機環境登入或提供所需的提供者金鑰。                                                                                                                         |
| `Unable to resolve session target: ...`                                     | 錯誤的鍵/id/標籤權杖。                                                                                                 | 執行 `/acp sessions`，複製精確的鍵/標籤，然後重試。                                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有可綁定作用中對話的情況下使用 `--bind here`。                                                                     | 移至目標聊天/頻道後重試，或使用未綁定的 spawn。                                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | 配接器缺少目前對話的 ACP 綁定能力。                                                                                    | 在支援時使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                                   |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在執行緒內容之外使用 `--thread here`。                                                                                 | 移至目標執行緒，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的綁定目標。                                                                                    | 以擁有者身分重新綁定，或使用不同的對話或執行緒。                                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | 配接器缺少執行緒綁定能力。                                                                                            | 使用 `--thread off`，或移至支援的配接器/頻道。                                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime 位於主機端；請求者 session 已沙箱化。                                                                      | 從沙箱化 session 使用 `runtime="subagent"`，或從非沙箱化 session 執行 ACP spawn。                                                                                       |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 對 ACP runtime 要求了 `sandbox="require"`。                                                                            | 使用 `runtime="subagent"` 取得必要沙箱化，或從非沙箱化 session 使用 ACP 並設定 `sandbox="inherit"`。                                                                    |
| `Cannot apply --model ... did not advertise model support`                  | 目標 harness 未公開通用 ACP 模型切換。                                                                                 | 使用宣告 ACP `models`/`session/set_model` 的 harness、使用 Codex ACP 模型參照，或若 harness 有自己的啟動旗標，直接在其中設定模型。                                     |
| Missing ACP metadata for bound session                                      | ACP session 中繼資料已過期/刪除。                                                                                      | 使用 `/acp spawn` 重新建立，然後重新綁定/聚焦執行緒。                                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 會在非互動式 ACP session 中阻擋寫入/執行。                                                           | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。             |
| ACP session fails early with little output                                  | 權限提示被 `permissionMode`/`nonInteractivePermissions` 阻擋。                                                         | 檢查 gateway 記錄中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。                     |
| ACP session stalls indefinitely after completing work                       | Harness 程序已結束，但 ACP session 未回報完成。                                                                       | 使用 `ps aux \| grep acpx` 監控；手動終止過期程序。                                                                                                                     |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件信封洩漏跨越 ACP 邊界。                                                                                       | 更新 OpenClaw 並重新執行完成流程；外部 harness 應只收到純文字完成提示。                                                                                                |

## 相關

- [ACP agent — 設定](/zh-TW/tools/acp-agents-setup)
- [Agent 傳送](/zh-TW/tools/agent-send)
- [CLI 後端](/zh-TW/gateway/cli-backends)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [多 agent 沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [Sub-agents](/zh-TW/tools/subagents)
