---
read_when:
    - 透過 ACP 執行程式碼撰寫工具
    - 在訊息通道上設定與對話綁定的 ACP 工作階段
    - 將訊息通道對話繫結至持久 ACP 工作階段
    - 疑難排解 ACP 後端、Plugin 串接或完成回應傳遞
    - 透過聊天操作 /acp 指令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼開發工具（Claude Code、Cursor、Gemini CLI、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理
x-i18n:
    generated_at: "2026-05-06T02:58:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端 Plugin 執行外部編碼 harness（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX harness）。

每次 ACP 工作階段產生都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部 harness 路徑，不是預設的 Codex 路徑。** 原生
Codex app-server Plugin 擁有 `/codex ...` 控制項與
`agentRuntime.id: "codex"` 內嵌執行階段；ACP 擁有
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 作為外部 MCP 用戶端
直接連接到既有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我想要哪一頁？

| 你想要…                                                                                         | 使用這個                              | 備註                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中綁定或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 啟用 `codex` Plugin 時的原生 Codex app-server 路徑；包含已綁定聊天回覆、圖片轉發、模型/快速/權限、停止與導向控制。ACP 是明確的後備選項 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或另一個外部 harness              | 本頁                                  | 聊天綁定工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                                   |
| 將 OpenClaw Gateway 工作階段公開為編輯器或用戶端使用的 ACP 伺服器                              | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 以 ACP 對 OpenClaw 通訊                                                                                                                            |
| 重複使用本機 AI CLI 作為純文字後備模型                                                          | [CLI 後端](/zh-TW/gateway/cli-backends) | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有 harness 執行階段                                                                                                                               |

## 這能開箱即用嗎？

可以，在安裝官方 ACP 執行階段 Plugin 之後：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 之後使用本機 `extensions/acpx`
工作區 Plugin。執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只會在 ACP **真正可用**時才教導代理如何產生 ACP：
ACP 必須已啟用、dispatch 不得停用、目前工作階段不得被沙盒封鎖，
且必須載入執行階段後端。如果未滿足這些條件，ACP Plugin Skills 與
`sessions_spawn` ACP 指引會保持隱藏，讓代理不會建議
不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果已設定 `plugins.allow`，它就是限制性的 Plugin 清單，且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意阻擋，且 `/acp doctor` 會回報缺少 allowlist 項目。
    - Codex ACP 配接器會隨 `acpx` Plugin 一起暫存，並在可行時於本機啟動。
    - 其他目標 harness 配接器可能仍會在你第一次使用時透過 `npx` 隨需擷取。
    - 該 harness 的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取，首次執行的配接器擷取會失敗，直到快取已預先暖機或以其他方式安裝配接器。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部 harness 程序。OpenClaw 擁有路由、
    背景任務狀態、交付、綁定與政策；harness
    擁有其供應商登入、模型目錄、檔案系統行為與
    原生工具。

    在責怪 OpenClaw 之前，請確認：

    - `/acp doctor` 回報後端已啟用且健康。
    - 設定該 allowlist 時，目標 id 被 `acp.allowedAgents` 允許。
    - harness 命令可以在 Gateway 主機上啟動。
    - 該 harness 的供應商驗證已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該 harness 中 - 模型 id 無法跨 harness 攜帶。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此大量寫入/執行的編碼執行通常需要可在無人值守狀態下繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 工具與內建 OpenClaw 工具預設**不會**公開給
ACP harness。只有在 harness 應直接呼叫那些工具時，才啟用
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的 harness 目標

使用 `acpx` 後端時，請將這些 harness id 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| Harness id | 典型後端                                       | 備註                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 配接器                         | 需要主機上的 Claude Code 驗證。                                              |
| `codex`    | Codex ACP 配接器                               | 僅在原生 `/codex` 不可用或要求 ACP 時作為明確 ACP 後備選項。 |
| `copilot`  | GitHub Copilot ACP 配接器                      | 需要 Copilot CLI/執行階段驗證。                                                  |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。    |
| `droid`    | Factory Droid CLI                              | 需要 Factory/Droid 驗證，或 harness 環境中的 `FACTORY_API_KEY`。        |
| `gemini`   | Gemini CLI ACP 配接器                          | 需要 Gemini CLI 驗證或 API 金鑰設定。                                          |
| `iflow`    | iFlow CLI                                      | 配接器可用性與模型控制取決於已安裝的 CLI。                 |
| `kilocode` | Kilo Code CLI                                  | 配接器可用性與模型控制取決於已安裝的 CLI。                 |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                            |
| `kiro`     | Kiro CLI                                       | 配接器可用性與模型控制取決於已安裝的 CLI。                 |
| `opencode` | OpenCode ACP 配接器                            | 需要 OpenCode CLI/供應商驗證。                                                |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接   | 讓具備 ACP 感知能力的 harness 回頭與 OpenClaw Gateway 工作階段通訊。                 |
| `pi`       | Pi/內嵌 OpenClaw 執行階段                      | 用於 OpenClaw 原生 harness 實驗。                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主機上的 Qwen 相容驗證。                                          |

自訂 acpx 代理別名可在 acpx 本身設定，但 OpenClaw
政策在 dispatch 前仍會檢查 `acp.allowedAgents` 以及任何
`agents.list[].runtime.acp.agent` 對應。

## 操作員 Runbook

從聊天快速使用 `/acp` 流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已綁定的對話或 thread 中繼續（或明確指定工作階段
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
  <Step title="導向">
    不取代脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 綁定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資料">
    - 產生會建立或恢復 ACP 執行階段工作階段、在 OpenClaw 工作階段儲存區記錄 ACP 中繼資料，並可能在執行由父層擁有時建立背景任務。
    - 父層擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是持續性的；完成與跨介面交付會透過父層任務通知器進行，而不是像一般面向使用者的聊天工作階段一樣運作。
    - 任務維護會關閉終止或孤立的父層擁有單次 ACP 工作階段。只要仍有作用中的對話綁定，持續性 ACP 工作階段就會被保留；沒有作用中綁定的過期持續性工作階段會被關閉，避免在擁有任務完成或其任務記錄消失後被靜默恢復。
    - 已綁定的後續訊息會直接傳送到 ACP 工作階段，直到綁定被關閉、取消焦點、重設或過期。
    - Gateway 命令保持本機處理。`/acp ...`、`/status` 與 `/unfocus` 絕不會作為一般提示文字送到已綁定的 ACP harness。
    - `cancel` 會在後端支援取消時中止作用中回合；它不會刪除綁定或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除綁定。如果 harness 支援恢復，它可能仍保留自己的上游歷史。
    - 閒置的執行階段 worker 可在 `acp.runtime.ttlMinutes` 之後被清理；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    當原生 Codex
    Plugin 已啟用時，應路由到它的自然語言觸發：

    - "將這個 Discord 頻道綁定到 Codex。"
    - "將這個聊天附加到 Codex thread `<id>`。"
    - "顯示 Codex threads，然後綁定這一個。"

    原生 Codex 對話綁定是預設聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合原生
    hook relay，讓 Plugin hooks 能封鎖 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hooks 會被轉送到
    OpenClaw `before_agent_finalize`，在那裡 Plugin 可要求在 Codex
    完成答案之前再進行一次模型 pass。relay 仍刻意保守：
    它不會變更 Codex 原生工具引數，也不會重寫 Codex thread 記錄。
    只有在你想要 ACP 執行階段/工作階段模型時才使用明確 ACP。
    內嵌 Codex 支援邊界記錄於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness#v1-support-contract)。

  </Accordion>
  <Accordion title="模型／提供者／執行階段選擇速查表">
    - `openai-codex/*` - PI Codex OAuth／訂閱路由。
    - `openai/*` 加上 `agentRuntime.id: "codex"` - 原生 Codex app-server 內嵌執行階段。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由到 ACP 執行階段的觸發條件：

    - "以一次性 Claude Code ACP 工作階段執行此項，並摘要結果。"
    - "在執行緒中使用 Gemini CLI 處理這項任務，然後將後續追蹤保留在同一個執行緒中。"
    - "透過 ACP 在背景執行緒中執行 Codex。"

    OpenClaw 會選擇 `runtime: "acp"`、解析 harness `agentId`，
    在支援時繫結到目前對話或執行緒，並將後續追蹤路由到該工作階段，
    直到關閉或過期為止。只有在明確指定 ACP/acpx，或要求的操作無法使用原生 Codex
    Plugin 時，Codex 才會遵循此路徑。

    對於 `sessions_spawn`，只有在 ACP 已啟用、要求者未被沙箱化，
    且已載入 ACP 執行階段後端時，才會宣告 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 會暫停自動 ACP 執行緒分派，
    但不會隱藏或封鎖明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它會以 ACP harness id 為目標，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非該項目已明確設定
    `agents.list[].runtime.type="acp"`，否則不要傳入來自 `agents_list` 的一般
    OpenClaw 設定 agent id；
    否則請使用預設的子代理執行階段。當 OpenClaw agent
    設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理

當你需要外部 harness 執行階段時使用 ACP。當啟用 `codex`
Plugin 且你需要 Codex 對話繫結／控制時，請使用 **原生 Codex
app-server**。當你需要 OpenClaw 原生委派執行時，請使用 **子代理**。

| 範圍          | ACP 工作階段                         | 子代理執行                         |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段      | ACP 後端 Plugin（例如 acpx）          | OpenClaw 原生子代理執行階段       |
| 工作階段金鑰  | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令      | `/acp ...`                            | `/subagents ...`                   |
| 生成工具      | 含 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設執行階段）  |

另請參閱 [子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 使用 Claude Code 時，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段 Plugin。
3. Claude ACP 介面卡。
4. Claude 端執行階段／工作階段機制。

ACP Claude 是具備 ACP 控制、工作階段續接、
背景任務追蹤，以及選用對話／執行緒繫結的 **harness 工作階段**。

CLI 後端是獨立的純文字本機後援執行階段 - 請參閱
[CLI 後端](/zh-TW/gateway/cli-backends)。

對操作員而言，實務規則是：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制，或持久 harness 工作？** 使用 ACP。
- **需要透過原始 CLI 進行簡單本機文字後援？** 使用 CLI 後端。

## 已繫結工作階段

### 心智模型

- **聊天介面** - 人們持續交談的地方（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** - OpenClaw 路由到的持久 Codex/Claude/Gemini 執行階段狀態。
- **子執行緒／主題** - 只有透過 `--thread ...` 建立的選用額外訊息介面。
- **執行階段工作區** - harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。與聊天介面相互獨立。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話釘選到
生成的 ACP 工作階段 - 不建立子執行緒，使用相同聊天介面。OpenClaw 持續
負責傳輸、驗證、安全與遞送。該對話中的後續訊息會路由到同一個工作階段；
`/new` 和 `/reset` 會就地重設工作階段；`/acp close` 會移除繫結。

範例：

```text
/codex bind                                              # 原生 Codex 繫結，將未來訊息路由到這裡
/codex model gpt-5.4                                     # 調整已繫結的原生 Codex 執行緒
/codex stop                                              # 控制作用中的原生 Codex 回合
/acp spawn codex --bind here                             # Codex 的明確 ACP 後援
/acp spawn codex --thread auto                           # 可能建立子執行緒／主題並在那裡繫結
/acp spawn codex --bind here --cwd /workspace/repo       # 相同聊天繫結，Codex 在 /workspace/repo 中執行
```

<AccordionGroup>
  <Accordion title="繫結規則與排他性">
    - `--bind here` 與 `--thread ...` 互斥。
    - `--bind here` 只適用於宣告支援目前對話繫結的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。繫結會在 Gateway 重新啟動後持續保留。
    - 在 Discord 上，`spawnSessions` 會為 `--thread auto|here` 控制子執行緒建立 - 而非 `--bind here`。
    - 如果你生成到不同 ACP agent 且未指定 `--cwd`，OpenClaw 預設會繼承 **目標 agent 的** 工作區。缺少繼承路徑（`ENOENT`/`ENOTDIR`）會退回後端預設；其他存取錯誤（例如 `EACCES`）會顯示為生成錯誤。
    - Gateway 管理命令會在已繫結對話中維持本機處理 - 即使一般後續文字會路由到已繫結的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；每當該介面已啟用命令處理時，`/status` 和 `/unfocus` 也會維持本機處理。

  </Accordion>
  <Accordion title="執行緒繫結工作階段">
    當頻道介面卡已啟用執行緒繫結時：

    - OpenClaw 會將執行緒繫結到目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由到已繫結的 ACP 工作階段。
    - ACP 輸出會遞送回同一個執行緒。
    - 取消聚焦／關閉／封存／閒置逾時或最大存留時間過期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 命令，不是給 ACP harness 的提示。

    執行緒繫結 ACP 的必要功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 執行緒分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道介面卡執行緒工作階段生成（預設值：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    執行緒繫結支援依介面卡而定。如果作用中的頻道
    介面卡不支援執行緒繫結，OpenClaw 會回傳清楚的
    不支援／不可用訊息。

  </Accordion>
  <Accordion title="支援執行緒的頻道">
    - 任何公開工作階段／執行緒繫結能力的頻道介面卡。
    - 目前內建支援：**Discord** 執行緒／頻道、**Telegram** 主題（群組／超級群組中的論壇主題，以及 DM 主題）。
    - Plugin 頻道可以透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久頻道繫結

對於非暫時性工作流程，請在
頂層 `bindings[]` 項目中設定持久 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀如下：

- **Discord 頻道／執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **BlueBubbles DM／群組：** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定群組繫結請優先使用 `chat_id:*` 或 `chat_identifier:*`。
- **iMessage DM／群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定群組繫結請優先使用 `chat_id:*`。

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

- OpenClaw 會確保設定的 ACP 工作階段在使用前存在。
- 該頻道或主題中的訊息會路由到設定的 ACP 工作階段。
- 在已繫結對話中，`/new` 和 `/reset` 會就地重設相同的 ACP 工作階段金鑰。
- 暫時性執行階段繫結（例如由執行緒聚焦流程建立）仍會在存在時套用。
- 對於未明確指定 `cwd` 的跨 agent ACP 生成，OpenClaw 會從 agent 設定繼承目標 agent 工作區。
- 缺少繼承工作區路徑時會退回後端預設 cwd；非缺少路徑的存取失敗會顯示為生成錯誤。

## 啟動 ACP 工作階段

有兩種方式可以啟動 ACP 工作階段：

<Tabs>
  <Tab title="從 sessions_spawn">
    使用 `runtime: "acp"` 從 agent 回合或
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
    `thread: true` 才能保留持久繫結的對話。
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
  傳送至 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須是 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標執行框架 ID。若已設定，會退回使用 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援時要求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是單次執行；`"session"` 是持久模式。如果 `thread: true` 且
  省略 `mode`，OpenClaw 可能會依執行階段路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端/執行階段原則驗證）。如果省略，ACP spawn 會在已設定時繼承目標代理工作區；缺少繼承路徑時會退回後端預設值，而實際存取錯誤會被回傳。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段/橫幅文字的操作員可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續既有 ACP 工作階段，而不是建立新的工作階段。代理會透過 `session/load` 重播其對話歷程。需要
  `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回要求者工作階段。可接受的回應包含
  `streamLogPath`，指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以追蹤它以取得完整中繼歷程。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  N 秒後中止 ACP 子層回合。`0` 會讓該回合維持在 gateway 的無逾時路徑上。同一個值會套用至 Gateway 執行與 ACP 執行階段，因此停滯或配額耗盡的執行框架不會無限期占用父層代理通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP spawn 會在 `session/new` 之前，將 OpenClaw Codex 參照（例如 `openai-codex/gpt-5.4`）正規化為 Codex ACP 啟動設定；斜線形式（例如
  `openai-codex/gpt-5.4/high`）也會設定 Codex ACP 推理強度。其他執行框架必須公布 ACP `models` 並支援
  `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是靜默退回目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對 Codex ACP 而言，`minimal` 對應到低強度，`low`/`medium`/`high`/`xhigh` 直接對應，而 `off` 會省略推理強度啟動覆寫。
</ParamField>

## Spawn 繫結與執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前作用中的對話；如果沒有作用中對話則失敗。 |
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
    | `here` | 要求目前有作用中的執行緒；如果不在執行緒中則失敗。                                                  |
    | `off`  | 不繫結。工作階段會以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非執行緒繫結介面上，預設行為實際上是 `off`。
    - 執行緒繫結 spawn 需要頻道原則支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子執行緒時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。傳遞路徑取決於這種形態。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    互動式工作階段旨在持續於可見的聊天介面上對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結至 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道執行緒/主題繫結至 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由至同一個 ACP 工作階段。

    繫結對話中的後續訊息會直接路由至 ACP 工作階段，而 ACP 輸出會傳遞回同一個頻道/執行緒/主題。

    OpenClaw 傳送給執行框架的內容：

    - 一般繫結後續訊息會作為提示文字傳送，且只有在執行框架/後端支援時才會附加附件。
    - `/acp` 管理命令與本機 Gateway 命令會在 ACP 分派前被攔截。
    - 執行階段產生的完成事件會依目標具體化。OpenClaw 代理會取得 OpenClaw 的內部執行階段情境信封；外部 ACP 執行框架會取得包含子層結果與指示的純文字提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封絕不應傳送給外部執行框架，也不應作為 ACP 使用者轉錄文字持久化。
    - ACP 轉錄項目使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    由另一個代理執行所 spawn 的單次 ACP 工作階段是背景子層，類似子代理：

    - 父層使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子層在自己的 ACP 執行框架工作階段中執行。
    - 子層回合會在原生子代理 spawn 使用的同一個背景通道上執行，因此緩慢的 ACP 執行框架不會阻塞不相關的主工作階段工作。
    - 完成結果會透過任務完成公告路徑回報。OpenClaw 會先將內部完成中繼資料轉換為純 ACP 提示，再傳送給外部執行框架，因此執行框架不會看到僅供 OpenClaw 使用的執行階段情境標記。
    - 當使用者可見回覆有用時，父層會以一般助理語氣重寫子層結果。

    **不要**將此路徑視為父層與子層之間的點對點聊天。子層已經有回到父層的完成通道。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` 可以在 spawn 後指向另一個工作階段。對於一般同儕工作階段，OpenClaw 會在注入訊息後使用代理對代理 (A2A) 後續路徑：

    - 等待目標工作階段的回覆。
    - 可選擇讓要求者與目標交換有限次數的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞至可見頻道或執行緒。

    該 A2A 路徑是同儕傳送的備援，適用於傳送者需要可見後續回覆的情況。當不相關的工作階段可以看見並傳訊給 ACP 目標時，它會保持啟用，例如在寬鬆的
    `tools.sessions.visibility` 設定下。

    OpenClaw 只有在要求者是自己父層擁有的單次 ACP 子層的父層時，才會略過 A2A 後續。在這種情況下，在任務完成之上執行 A2A 可能會用子層結果喚醒父層、將父層的回覆轉送回子層，並建立父層/子層回音迴圈。對於這種擁有子層的情況，`sessions_send` 結果會回報
    `delivery.status="skipped"`，因為完成路徑已經負責該結果。

  </Accordion>
  <Accordion title="Resume an existing session">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是重新開始。代理會透過
    `session/load` 重播其對話歷程，因此會帶著先前內容的完整情境接續。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從你的筆電交接到手機，告訴你的代理從你離開的地方接續。
    - 繼續你先前在 CLI 中互動啟動的編碼工作階段，現在透過你的代理以無頭方式接續。
    - 接續因 gateway 重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機的 ACP/執行框架繼續 ID，而不是 OpenClaw 頻道工作階段金鑰；OpenClaw 仍會在分派前檢查 ACP spawn 原則與目標代理原則，而 ACP 後端或執行框架則負責載入該上游 ID 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷程；`thread` 和 `mode` 仍會正常套用至你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段 ID，spawn 會以清楚錯誤失敗，不會靜默退回新工作階段。

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Gateway 部署後，請執行即時端對端檢查，而不是信任單元測試：

    1. 驗證目標主機上的已部署 gateway 版本與提交。
    2. 開啟連到即時代理的暫時 ACPX 橋接工作階段。
    3. 要求該代理以 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 和任務 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    請將閘門維持在 `mode: "run"`，並略過 `streamTo: "parent"`；
    執行緒繫結的 `mode: "session"` 與串流中繼路徑是另外的更完整整合檢查。

  </Accordion>
</AccordionGroup>

## Sandbox 相容性

ACP 工作階段目前在主機執行階段上執行，**不是**在 OpenClaw sandbox 內執行。

<Warning>
**安全邊界：**

- 外部執行框架可依照自身的 CLI 權限與所選的 `cwd` 進行讀取/寫入。
- OpenClaw 的沙箱政策**不會**包覆 ACP 執行框架的執行。
- OpenClaw 仍會強制執行 ACP 功能閘、允許的代理、工作階段擁有權、頻道繫結，以及 Gateway 傳遞政策。
- 使用 `runtime: "subagent"` 進行由沙箱強制執行的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段已沙箱化，ACP 產生會同時阻擋 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試 key
   - 接著嘗試 UUID 形狀的工作階段 id
   - 接著嘗試 label
2. 目前執行緒繫結（如果此對話/執行緒已繫結至 ACP 工作階段）。
3. 目前請求者工作階段後援。

目前對話繫結與執行緒繫結都會參與
步驟 2。

如果沒有解析出目標，OpenClaw 會回傳清楚的錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 作用                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段中正在進行的回合。                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將引導指令傳送至執行中的工作階段。                        | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項與功能。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                          | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                                  | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                            | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存區列出最近的 ACP 工作階段。                         | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、功能、可執行的修正。                        | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                              | `/acp install`                                                |

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級和
後端層級的工作階段識別碼。當後端缺少某項功能時，不支援的控制項錯誤會
清楚呈現。`/acp sessions` 會讀取
目前繫結或請求者工作階段的儲存區；目標權杖
（`session-key`、`session-id` 或 `session-label`）會透過
gateway 工作階段探索進行解析，包括自訂的每代理 `session.store`
根目錄。

### 執行階段選項對應

`/acp` 具有便利命令和通用設定器。等效
操作：

| 命令                         | 對應至                               | 備註                                                                                                                                                                           |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 執行階段設定 key `model`             | 對於 Codex ACP，OpenClaw 會將 `openai-codex/<model>` 正規化為配接器模型 id，並將斜線推理後綴（例如 `openai-codex/gpt-5.4/high`）對應至 `reasoning_effort`。                  |
| `/acp set thinking <level>`  | 執行階段設定 key `thinking`          | 對於 Codex ACP，OpenClaw 會在配接器支援時傳送對應的 `reasoning_effort`。                                                                                                       |
| `/acp permissions <profile>` | 執行階段設定 key `approval_policy`   | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | 執行階段設定 key `timeout`           | -                                                                                                                                                                              |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                    |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆寫路徑。                                                                                                                                                 |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | -                                                                                                                                                                              |

## acpx 執行框架、Plugin 設定與權限

如需 acpx 執行框架設定（Claude Code / Codex / Gemini CLI
別名）、plugin-tools 與 OpenClaw-tools MCP 橋接，以及 ACP
權限模式，請參閱
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正方式                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 缺少後端 Plugin、已停用，或被 `plugins.allow` 封鎖。                                                                   | 安裝並啟用後端 Plugin；設定允許清單時，將 `acpx` 加入 `plugins.allow`，然後執行 `/acp doctor`。                                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用從一般 thread 訊息進行自動分派。                                                                                 | 設定 `acp.dispatch.enabled=true` 以恢復自動 thread 路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍會運作。                                                     |
| `ACP agent "<id>" is not allowed by policy`                                 | 代理未在允許清單中。                                                                                                   | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 缺少後端 Plugin、已停用、被允許/拒絕政策封鎖，或其設定的可執行檔無法使用。                                             | 安裝/啟用後端 Plugin，重新執行 `/acp doctor`；如果仍不健康，請檢查後端安裝或政策錯誤。                                                                                  |
| Harness command not found                                                   | Adapter CLI 未安裝、缺少外部 Plugin，或非 Codex adapter 的首次執行 `npx` 擷取失敗。                                    | 執行 `/acp doctor`，在 Gateway 主機上安裝/預先暖機 adapter，或明確設定 acpx 代理命令。                                                                                   |
| Model-not-found from the harness                                            | 模型 ID 對另一個提供者/執行框架有效，但不適用於此 ACP 目標。                                                          | 使用該執行框架列出的模型、在執行框架中設定模型，或省略覆寫。                                                                                                           |
| Vendor auth error from the harness                                          | OpenClaw 健康，但目標 CLI/提供者尚未登入。                                                                             | 在 Gateway 主機環境登入或提供所需的提供者金鑰。                                                                                                                        |
| `Unable to resolve session target: ...`                                     | 錯誤的鍵/id/標籤權杖。                                                                                                 | 執行 `/acp sessions`，複製確切的鍵/標籤，然後重試。                                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有可繫結的有效對話時使用了 `--bind here`。                                                                         | 移至目標聊天/頻道後重試，或使用未繫結的 spawn。                                                                                                                        |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter 缺少目前對話的 ACP 繫結能力。                                                                                  | 在支援的地方使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至受支援的頻道。                                                                              |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在 thread 情境外使用了 `--thread here`。                                                                                | 移至目標 thread，或使用 `--thread auto`/`off`。                                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有有效的繫結目標。                                                                                       | 以擁有者身分重新繫結，或使用不同的對話或 thread。                                                                                                                       |
| `Thread bindings are unavailable for <channel>.`                            | Adapter 缺少 thread 繫結能力。                                                                                         | 使用 `--thread off`，或移至受支援的 adapter/頻道。                                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime 位於主機端；請求者工作階段處於沙箱中。                                                                     | 從沙箱工作階段使用 `runtime="subagent"`，或從非沙箱工作階段執行 ACP spawn。                                                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | ACP runtime 要求了 `sandbox="require"`。                                                                                | 若需要沙箱，使用 `runtime="subagent"`；或從非沙箱工作階段以 `sandbox="inherit"` 使用 ACP。                                                                                |
| `Cannot apply --model ... did not advertise model support`                  | 目標執行框架未公開通用 ACP 模型切換。                                                                                  | 使用宣告 ACP `models`/`session/set_model` 的執行框架、使用 Codex ACP 模型參照，或如果執行框架有自己的啟動旗標，請直接在其中設定模型。                                   |
| Missing ACP metadata for bound session                                      | ACP 工作階段中繼資料已過期/刪除。                                                                                      | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦 thread。                                                                                                                  |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非互動式 ACP 工作階段中封鎖寫入/執行。                                                              | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。             |
| ACP session fails early with little output                                  | 權限提示被 `permissionMode`/`nonInteractivePermissions` 封鎖。                                                         | 檢查 gateway 記錄中的 `AcpRuntimeError`。若需完整權限，請設定 `permissionMode=approve-all`；若需優雅降級，請設定 `nonInteractivePermissions=deny`。                     |
| ACP session stalls indefinitely after completing work                       | 執行框架程序已完成，但 ACP 工作階段未回報完成。                                                                        | 使用 `ps aux \| grep acpx` 監控；手動終止過期程序。                                                                                                                     |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件封套洩漏到 ACP 邊界外。                                                                                        | 更新 OpenClaw 並重新執行完成流程；外部執行框架應只收到純文字完成提示。                                                                                                 |

## 相關

- [ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)
- [代理傳送](/zh-TW/tools/agent-send)
- [CLI 後端](/zh-TW/gateway/cli-backends)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理](/zh-TW/tools/subagents)
