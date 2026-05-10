---
read_when:
    - 透過 ACP 執行編碼工具框架
    - 在訊息頻道上設定綁定對話的 ACP 工作階段
    - 將訊息通道對話繫結至持久 ACP 工作階段
    - 疑難排解 ACP 後端、Plugin 串接或完成結果傳遞
    - 透過聊天操作 /acp 指令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼撰寫執行框架（Claude Code、Cursor、Gemini CLI、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-05-10T19:52:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6f4beb509c00c965bc2b202648f1b6567d1f3a633f2f9926882adafc5144e06
    source_path: tools/acp-agents.md
    workflow: 16
---

[代理程式用戶端協定 (ACP)](https://agentclientprotocol.com/) 工作階段
可讓 OpenClaw 透過 ACP 後端 Plugin 執行外部程式設計執行框架（例如 Pi、Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
受支援的 ACPX 執行框架）。

每次產生 ACP 工作階段都會追蹤為[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部執行框架路徑，不是預設的 Codex 路徑。** 原生
Codex 應用程式伺服器 Plugin 擁有 `/codex ...` 控制項，以及代理程式回合的預設
`openai/gpt-*` 內嵌執行階段；ACP 擁有
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 作為外部 MCP 用戶端，直接連線到既有的
OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我該看哪個頁面？

| 你想要…                                                                                         | 使用                                  | 備註                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                    | `/codex bind`、`/codex threads`       | 啟用 `codex` plugin 時的原生 Codex 應用程式伺服器路徑；包含已繫結的聊天回覆、圖片轉送、模型/快速/權限、停止與導向控制。ACP 是明確的備援 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部執行框架                | 本頁                                  | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                                                  |
| 將 OpenClaw Gateway 工作階段公開為供編輯器或用戶端使用的 ACP 伺服器                             | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 與 OpenClaw 進行 ACP 通訊                                                                                                                           |
| 重用本機 AI CLI 作為純文字備援模型                                                              | [CLI 後端](/zh-TW/gateway/cli-backends)     | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有執行框架執行階段                                                                                                                          |

## 這可以開箱即用嗎？

可以，安裝官方 ACP 執行階段 Plugin 後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 後使用本機
`extensions/acpx` 工作區 Plugin。執行 `/acp doctor` 以進行就緒檢查。

OpenClaw 只有在 ACP **真正可用**時才會教代理程式如何產生 ACP：
ACP 必須已啟用、分派不得停用、目前工作階段不得被沙箱封鎖，
而且必須已載入執行階段後端。如果不符合這些條件，
ACP Plugin Skills 與 `sessions_spawn` ACP 指引會保持隱藏，
因此代理程式不會建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的 Plugin 清單，而且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意封鎖，且 `/acp doctor` 會回報缺少 allowlist 項目。
    - Codex ACP 配接器會隨 `acpx` Plugin 暫存，並在可行時於本機啟動。
    - Codex ACP 會使用隔離的 `CODEX_HOME` 執行；OpenClaw 只會從主機 Codex 設定複製受信任的專案項目並信任作用中的工作區，而將驗證、通知與 hooks 留在主機設定中。
    - 其他目標執行框架配接器第一次使用時，仍可能按需透過 `npx` 擷取。
    - 該執行框架的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取權，首次執行的配接器擷取會失敗，直到快取已預先暖機，或配接器以其他方式安裝完成。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部執行框架程序。OpenClaw 擁有路由、
    背景任務狀態、傳遞、繫結與政策；執行框架擁有其供應商登入、
    模型目錄、檔案系統行為與原生工具。

    在歸咎於 OpenClaw 之前，請確認：

    - `/acp doctor` 回報後端已啟用且狀況正常。
    - 設定該 allowlist 時，目標 id 已由 `acp.allowedAgents` 允許。
    - 執行框架命令可以在 Gateway 主機上啟動。
    - 該執行框架已有供應商驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該執行框架中 - 模型 id 無法跨執行框架移植。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此大量寫入/執行的程式設計執行通常需要可無介面繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw Plugin 工具與內建 OpenClaw 工具預設**不會**公開給
ACP 執行框架。只有在執行框架應直接呼叫這些工具時，才啟用
[ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的執行框架目標

使用 `acpx` 後端時，請將這些執行框架 id 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 執行框架 id | 典型後端                                       | 備註                                                                                |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`    | Claude Code ACP 配接器                         | 需要主機上的 Claude Code 驗證。                                                     |
| `codex`     | Codex ACP 配接器                               | 只有在原生 `/codex` 不可用或要求 ACP 時，才作為明確 ACP 備援。                     |
| `copilot`   | GitHub Copilot ACP 配接器                      | 需要 Copilot CLI/執行階段驗證。                                                     |
| `cursor`    | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。                              |
| `droid`     | Factory Droid CLI                              | 需要 Factory/Droid 驗證，或執行框架環境中的 `FACTORY_API_KEY`。                    |
| `gemini`    | Gemini CLI ACP 配接器                          | 需要 Gemini CLI 驗證或 API key 設定。                                                |
| `iflow`     | iFlow CLI                                      | 配接器可用性與模型控制取決於已安裝的 CLI。                                          |
| `kilocode`  | Kilo Code CLI                                  | 配接器可用性與模型控制取決於已安裝的 CLI。                                          |
| `kimi`      | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                                    |
| `kiro`      | Kiro CLI                                       | 配接器可用性與模型控制取決於已安裝的 CLI。                                          |
| `opencode`  | OpenCode ACP 配接器                            | 需要 OpenCode CLI/供應商驗證。                                                       |
| `openclaw`  | 透過 `openclaw acp` 的 OpenClaw Gateway 橋接   | 讓支援 ACP 的執行框架可回頭與 OpenClaw Gateway 工作階段通訊。                      |
| `pi`        | Pi/內嵌 OpenClaw 執行階段                      | 用於 OpenClaw 原生執行框架實驗。                                                     |
| `qwen`      | Qwen Code / Qwen CLI                           | 需要主機上與 Qwen 相容的驗證。                                                       |

自訂 acpx 代理程式別名可以在 acpx 本身中設定，但 OpenClaw
政策在分派前仍會檢查 `acp.allowedAgents` 與任何
`agents.list[].runtime.acp.agent` 對應。

## 操作者操作手冊

聊天中的快速 `/acp` 流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`、
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
    `/acp model <provider/model>`、
    `/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="導向">
    不取代情境：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資料">
    - 產生會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存區記錄 ACP 中繼資料，並可能在執行由父層擁有時建立背景任務。
    - 父層擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是持久的也一樣；完成與跨介面傳遞會透過父層任務通知器，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉終止或孤立的父層擁有一次性 ACP 工作階段。持久 ACP 工作階段會在仍有作用中對話繫結時保留；沒有作用中繫結的過期持久工作階段會被關閉，因此它們不會在擁有者任務完成或其任務記錄消失後被靜默恢復。
    - 已繫結的後續訊息會直接送到 ACP 工作階段，直到繫結關閉、失焦、重設或過期。
    - Gateway 命令會保留在本機。`/acp ...`、`/status` 與 `/unfocus` 永遠不會作為一般提示文字傳送給已繫結的 ACP 執行框架。
    - 後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。如果執行框架支援恢復，它仍可能保留自己的上游歷史。
    - acpx Plugin 會在 `close` 後清理 OpenClaw 擁有的包裝器與配接器程序樹，並在 Gateway 啟動期間清除過期且由 OpenClaw 擁有的 ACPX 孤立項目。
    - 閒置的執行階段工作器在 `acp.runtime.ttlMinutes` 後符合清理資格；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    啟用時，應路由到**原生 Codex
    Plugin** 的自然語言觸發：

    -「將這個 Discord 頻道繫結到 Codex。」
    -「將這個聊天附加到 Codex 執行緒 `<id>`。」
    -「顯示 Codex 執行緒，然後繫結這一個。」

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合的原生
    hook relay，讓 Plugin hook 可以阻擋 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准流程路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hook 會轉送到
    OpenClaw `before_agent_finalize`，Plugin 可在此要求 Codex 最終確定答案前
    再執行一次模型傳遞。此 relay 會刻意保持保守：
    它不會變更 Codex 原生工具
    引數，也不會改寫 Codex 執行緒記錄。只有在你想使用 ACP 執行階段/工作階段模型時，
    才使用明確的 ACP。內嵌 Codex
    支援邊界記錄於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="Model / provider / runtime selection cheat sheet">
    - `openai-codex/*` - 由 doctor 修復的舊版 Codex OAuth/訂閱模型路由。
    - `openai/*` - 用於 OpenAI agent 回合的原生 Codex app-server 內嵌執行階段。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP-routing natural-language triggers">
    應該路由到 ACP 執行階段的觸發語句：

    - "以一次性 Claude Code ACP 工作階段執行此項，並摘要結果。"
    - "在一個執行緒中使用 Gemini CLI 完成此工作，然後將後續對話保留在同一個執行緒中。"
    - "透過 ACP 在背景執行緒中執行 Codex。"

    OpenClaw 會選擇 `runtime: "acp"`、解析 harness `agentId`、
    在支援時繫結到目前對話或執行緒，並將後續對話路由到該工作階段，直到關閉/到期為止。
    只有在明確指定 ACP/acpx，或原生 Codex
    Plugin 無法用於所要求操作時，Codex 才會遵循此路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、請求者未受 sandbox 限制，且已載入 ACP 執行階段
    後端時，才會公告 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停自動
    ACP 執行緒派送，但不會隱藏或封鎖明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它的目標是 ACP harness ID，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非該項目已明確以
    `agents.list[].runtime.type="acp"` 設定，
    否則不要從 `agents_list` 傳入一般
    OpenClaw 設定 agent ID；否則請使用預設子代理執行階段。當 OpenClaw agent
    設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness ID。

  </Accordion>
</AccordionGroup>

## ACP 與子代理比較

當你需要外部 harness 執行階段時，請使用 ACP。當 `codex`
Plugin 啟用，且需要 Codex 對話繫結/控制時，請使用**原生 Codex
app-server**。當你需要 OpenClaw 原生
委派執行時，請使用**子代理**。

| 區域          | ACP 工作階段                           | 子代理執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端 Plugin（例如 acpx） | OpenClaw 原生子代理執行階段  |
| 工作階段金鑰   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | 搭配 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 執行 Claude Code 時，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段 Plugin。
3. Claude ACP 介面卡。
4. Claude 端執行階段/工作階段機制。

ACP Claude 是一個具備 ACP 控制、工作階段恢復、
背景工作追蹤，以及選用對話/執行緒繫結的 **harness 工作階段**。

CLI 後端是獨立的純文字本機後援執行階段 - 請參閱
[CLI 後端](/zh-TW/gateway/cli-backends)。

對操作員而言，實用規則是：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制，或持續性 harness 工作嗎？** 使用 ACP。
- **只需要透過原始 CLI 進行簡單的本機文字後援嗎？** 使用 CLI 後端。

## 已繫結工作階段

### 心智模型

- **聊天介面** - 人們持續對話的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** - OpenClaw 路由到的持久 Codex/Claude/Gemini 執行階段狀態。
- **子執行緒/主題** - 只有由 `--thread ...` 建立的選用額外訊息介面。
- **執行階段工作區** - harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。獨立於聊天介面。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話釘選到
產生的 ACP 工作階段 - 不建立子執行緒，使用相同聊天介面。OpenClaw 持續
掌管傳輸、驗證、安全與交付。該
對話中的後續訊息會路由到同一個工作階段；`/new` 和 `/reset` 會在原處重設
工作階段；`/acp close` 會移除繫結。

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
  <Accordion title="Binding rules and exclusivity">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於公告目前對話繫結能力的頻道；否則 OpenClaw 會傳回清楚的不支援訊息。繫結會在 Gateway 重新啟動後持續存在。
    - 在 Discord 上，`spawnSessions` 會控管 `--thread auto|here` 的子執行緒建立 - 不控管 `--bind here`。
    - 如果你在沒有 `--cwd` 的情況下產生到不同 ACP agent，OpenClaw 預設會繼承**目標 agent 的**工作區。缺少繼承路徑（`ENOENT`/`ENOTDIR`）會退回後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - Gateway 管理命令在已繫結對話中仍保持本機處理 - 即使一般後續文字會路由到已繫結 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面啟用命令處理，`/status` 和 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="Thread-bound sessions">
    當頻道介面卡啟用執行緒繫結時：

    - OpenClaw 會將執行緒繫結到目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由到已繫結 ACP 工作階段。
    - ACP 輸出會傳回同一個執行緒。
    - Unfocus/close/archive/idle-timeout 或 max-age 到期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是 Gateway 命令，不是傳給 ACP harness 的提示。

    執行緒繫結 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設開啟（設為 `false` 可暫停自動 ACP 執行緒派送；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道介面卡執行緒工作階段產生（預設：`true`）：
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    執行緒繫結支援依介面卡而定。如果作用中的頻道
    介面卡不支援執行緒繫結，OpenClaw 會傳回清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="Thread-supporting channels">
    - 任何公開工作階段/執行緒繫結能力的頻道介面卡。
    - 目前內建支援：**Discord** 執行緒/頻道、**Telegram** 主題（群組/超級群組中的論壇主題與 DM 主題）。
    - Plugin 頻道可透過相同繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久頻道繫結

對於非暫時性工作流程，請在
最上層 `bindings[]` 項目中設定持久 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀如下：

- **Discord 頻道/執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道/DM：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。偏好穩定的 Slack ID；頻道繫結也會比對該頻道執行緒內的回覆。
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定的群組繫結偏好使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有者 OpenClaw agent ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的操作員可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用的執行階段工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用後端覆寫。
</ParamField>

### 每個 agent 的執行階段預設值

使用 `agents.list[].runtime` 為每個 agent 定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness ID，例如 `codex` 或 `claude`）
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

- OpenClaw 會在使用前確保已設定的 ACP 工作階段存在。
- 該頻道或主題中的訊息會路由至已設定的 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段鍵。
- 暫時性執行階段繫結（例如由執行緒聚焦流程建立的繫結）在存在時仍會套用。
- 對於沒有明確 `cwd` 的跨代理 ACP 產生，OpenClaw 會從代理設定繼承目標代理工作區。
- 遺失的繼承工作區路徑會退回到後端預設 cwd；非遺失的存取失敗會以產生錯誤呈現。

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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段必須明確設定
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用
    `acp.defaultAgent`。`mode: "session"` 需要 `thread: true`
    才能保留持續性的已繫結對話。
    </Note>

  </Tab>
  <Tab title="From /acp command">
    使用 `/acp spawn` 從聊天中進行明確的操作者控制。

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    關鍵旗標：

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
  傳送至 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須為 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標執行框架 id。如果已設定，會退回到 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援時要求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持續性。如果 `thread: true` 且省略
  `mode`，OpenClaw 可依執行階段路徑預設為持續性行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端／執行階段政策驗證）。若省略，
  ACP 產生會在已設定時繼承目標代理工作區；遺失的繼承路徑會退回
  到後端預設值，而實際存取錯誤會被回傳。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段／橫幅文字的操作者可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢復既有 ACP 工作階段，而不是建立新的工作階段。代理會透過
  `session/load` 重播其對話記錄。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回請求者工作階段。
  接受的回應包含指向工作階段範圍 JSONL 記錄的 `streamLogPath`
  （`<sessionId>.acp-stream.jsonl`），你可以 tail 它以取得完整轉送記錄。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  在 N 秒後中止 ACP 子回合。`0` 會讓回合走 Gateway 的無逾時路徑。
  同一個值會套用到 Gateway 執行和 ACP 執行階段，因此停滯或配額耗盡的
  執行框架不會無限期占用父代理通道。
</ParamField>
<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 產生會在 `session/new` 前，
  將 OpenClaw Codex 參照（例如 `openai-codex/gpt-5.4`）正規化為
  Codex ACP 啟動設定；斜線形式（例如 `openai-codex/gpt-5.4/high`）
  也會設定 Codex ACP 推理強度。其他執行框架必須宣告 ACP `models`
  並支援 `session/set_model`；否則 OpenClaw/acpx 會明確失敗，而不是
  靜默退回到目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考／推理強度。對於 Codex ACP，`minimal` 會映射為低強度，
  `low`/`medium`/`high`/`xhigh` 會直接映射，而 `off` 會省略推理強度
  啟動覆寫。
</ParamField>

## 產生繫結與執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前作用中的對話；如果沒有作用中對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    備註：

    - `--bind here` 是「讓這個頻道或聊天由 Codex 支援」的最簡單操作者路徑。
    - `--bind here` 不會建立子執行緒。
    - `--bind here` 只適用於公開目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中的執行緒中：繫結該執行緒。執行緒外：在支援時建立／繫結子執行緒。 |
    | `here` | 要求目前作用中的執行緒；如果不在其中則失敗。                                                  |
    | `off`  | 不繫結。工作階段會以未繫結狀態啟動。                                                                 |

    備註：

    - 在非執行緒繫結介面上，預設行為實際上是 `off`。
    - 執行緒繫結產生需要頻道政策支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子執行緒時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父項擁有的背景工作。
傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    互動式工作階段的用途是在可見的聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道執行緒／主題繫結到 ACP 工作階段。
    - 持續性設定的 `bindings[].type="acp"` 會將相符對話路由至同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由到 ACP 工作階段，ACP 輸出也會傳回同一個
    頻道／執行緒／主題。

    OpenClaw 傳送給執行框架的內容：

    - 一般已繫結的後續訊息會作為提示文字傳送，只有在執行框架／後端支援時才會附上附件。
    - `/acp` 管理指令和本機 Gateway 指令會在 ACP 派送前被攔截。
    - 執行階段產生的完成事件會依目標實體化。OpenClaw 代理會取得 OpenClaw 的內部執行階段內容信封；外部 ACP 執行框架會取得包含子結果與指示的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封絕不應傳送到外部執行框架，也不應作為 ACP 使用者文字記錄持久化。
    - ACP 文字記錄項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    由另一個代理執行所產生的一次性 ACP 工作階段是背景子項，
    類似子代理：

    - 父項以 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子項在自己的 ACP 執行框架工作階段中執行。
    - 子回合會在原生子代理產生所使用的同一個背景通道上執行，因此緩慢的 ACP 執行框架不會阻塞不相關的主工作階段工作。
    - 完成報告會透過任務完成公告路徑回傳。OpenClaw 會先將內部完成中繼資料轉換成純 ACP 提示，再傳送給外部執行框架，因此執行框架不會看到僅限 OpenClaw 的執行階段內容標記。
    - 當需要面向使用者的回覆時，父項會以一般助理語氣重寫子項結果。

    **不要** 將此路徑視為父項與子項之間的對等聊天。子項已經有回到父項的完成通道。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` 可以在產生後以另一個工作階段為目標。對於一般對等工作階段，
    OpenClaw 會在注入訊息後使用代理到代理（A2A）後續路徑：

    - 等待目標工作階段的回覆。
    - 選擇性地讓請求者與目標交換有限數量的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見的頻道或執行緒。

    該 A2A 路徑是對等傳送在傳送者需要可見後續回覆時的備援。
    當不相關的工作階段可以看到並傳訊給 ACP 目標時，它仍會啟用，
    例如在寬鬆的 `tools.sessions.visibility` 設定下。

    只有在請求者是其自身父項擁有的一次性 ACP 子項的父項時，
    OpenClaw 才會略過 A2A 後續。在這種情況下，在任務完成之上執行
    A2A 可能會以子項結果喚醒父項、將父項回覆轉送回子項，並建立
    父／子回音迴圈。對於這種已擁有子項的情況，`sessions_send` 結果會回報
    `delivery.status="skipped"`，因為完成路徑已經負責結果。

  </Accordion>
  <Accordion title="Resume an existing session">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是重新開始。
    代理會透過 `session/load` 重播其對話記錄，因此會帶著先前完整脈絡接續。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用情境：

    - 將 Codex 工作階段從你的筆電交接到你的手機 - 告訴你的代理從你離開的地方接續。
    - 繼續你先前在 CLI 中互動式啟動的程式撰寫工作階段，現在改由代理以無頭方式執行。
    - 接續因 gateway 重新啟動或閒置逾時而中斷的工作。

    備註：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機 ACP／執行框架恢復 id，不是 OpenClaw 頻道工作階段鍵；OpenClaw 在派送前仍會檢查 ACP 產生政策與目標代理政策，而 ACP 後端或執行框架負責載入該上游 id 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話記錄；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段 id，產生會以明確錯誤失敗 - 不會靜默退回到新工作階段。

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Gateway 部署後，請執行即時端到端檢查，而不是信任單元測試：

    1. 驗證目標主機上已部署的 gateway 版本與 commit。
    2. 開啟通往 live agent 的暫時 ACPX bridge session。
    3. 要求該 agent 以 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任務 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有 validator error。
    5. 清理暫時 bridge session。

    將 gate 保持在 `mode: "run"`，並略過 `streamTo: "parent"` -
    綁定 thread 的 `mode: "session"` 與 stream-relay 路徑是獨立的
    更完整整合檢查。

  </Accordion>
</AccordionGroup>

## 沙盒相容性

ACP session 目前在 host runtime 上執行，**不**在
OpenClaw sandbox 內執行。

<Warning>
**安全邊界：**

- external harness 可依據其自身 CLI 權限與選定的 `cwd` 讀取/寫入。
- OpenClaw 的 sandbox policy **不會**包覆 ACP harness 執行。
- OpenClaw 仍會強制執行 ACP feature gate、允許的 agent、session ownership、channel binding，以及 Gateway delivery policy。
- 若要使用由 sandbox 強制執行的 OpenClaw-native 工作，請使用 `runtime: "subagent"`。

</Warning>

目前限制：

- 如果 requester session 位於 sandbox 中，ACP spawn 會同時封鎖 `sessions_spawn({ runtime: "acp" })` 與 `/acp spawn`。
- 搭配 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## Session target 解析

大多數 `/acp` 動作都接受 optional session target（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的 target argument（或 `/acp steer` 的 `--session`）
   - 先嘗試 key
   - 接著嘗試 UUID 形狀的 session id
   - 再嘗試 label
2. 目前的 thread binding（如果此 conversation/thread 已綁定至 ACP session）。
3. 目前 requester session fallback。

Current-conversation binding 與 thread binding 都會參與
步驟 2。

如果沒有解析出 target，OpenClaw 會回傳明確錯誤
(`Unable to resolve session target: ...`)。

## ACP 控制項

| 指令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP session；可選擇目前 bind 或 thread bind。        | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消 target session 進行中的 turn。                       | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將 steer instruction 傳送到執行中的 session。             | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉 session 並解除 thread target binding。               | `/acp close`                                                  |
| `/acp status`        | 顯示 backend、mode、state、runtime option、capability。    | `/acp status`                                                 |
| `/acp set-mode`      | 設定 target session 的 runtime mode。                     | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入一般 runtime config option。                          | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定 runtime working directory override。                 | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定 approval policy profile。                            | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定 runtime timeout（秒）。                              | `/acp timeout 120`                                            |
| `/acp model`         | 設定 runtime model override。                             | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除 session runtime option override。                    | `/acp reset-options`                                          |
| `/acp sessions`      | 從 store 列出近期 ACP session。                           | `/acp sessions`                                               |
| `/acp doctor`        | Backend health、capability、可執行的修正。                | `/acp doctor`                                                 |
| `/acp install`       | 輸出確定性的 install 與 enable 步驟。                     | `/acp install`                                                |

`/acp status` 會顯示有效的 runtime option，以及 runtime-level 和
backend-level session identifier。當 backend 缺少 capability 時，
unsupported-control error 會清楚呈現。`/acp sessions` 會讀取
目前已綁定或 requester session 的 store；target token
（`session-key`、`session-id` 或 `session-label`）會透過
gateway session discovery 解析，包括自訂的 per-agent `session.store`
root。

### Runtime option 對應

`/acp` 有便利指令與一般 setter。等效操作：

| 指令                         | 對應到                               | 備註                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | runtime config key `model`           | 對於 Codex ACP，OpenClaw 會將 `openai-codex/<model>` 正規化為 adapter model id，並將 slash reasoning suffix（例如 `openai-codex/gpt-5.4/high`）對應到 `reasoning_effort`。                                |
| `/acp set thinking <level>`  | canonical option `thinking`          | OpenClaw 會在存在時傳送 backend-advertised equivalent，偏好順序為 `thinking`，接著是 `effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，adapter 會將值對應到 `reasoning_effort`。             |
| `/acp permissions <profile>` | canonical option `permissionProfile` | OpenClaw 會在存在時傳送 backend-advertised equivalent，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                                  |
| `/acp timeout <seconds>`     | canonical option `timeoutSeconds`    | OpenClaw 會在存在時傳送 backend-advertised equivalent，例如 `timeout` 或 `timeout_seconds`。                                                                                                               |
| `/acp cwd <path>`            | runtime cwd override                 | 直接更新。                                                                                                                                                                                                 |
| `/acp set <key> <value>`     | generic                              | `key=cwd` 會使用 cwd override path。                                                                                                                                                                       |
| `/acp reset-options`         | 清除所有 runtime override            | -                                                                                                                                                                                                          |

## acpx harness、Plugin 設定與權限

如需 acpx harness 設定（Claude Code / Codex / Gemini CLI
alias）、plugin-tools 與 OpenClaw-tools MCP bridge，以及 ACP
permission mode，請參閱
[ACP agent - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端 Plugin 遺失、已停用，或遭 `plugins.allow` 封鎖。                                                                  | 安裝並啟用後端 Plugin；設定允許清單時，在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                                       |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用一般執行緒訊息的自動派送。                                                                                       | 設定 `acp.dispatch.enabled=true` 以恢復自動執行緒路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍會運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | 代理不在允許清單中。                                                                                                   | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` 在啟動後立即回報後端尚未就緒                                  | 後端 Plugin 遺失、已停用、遭允許/拒絕政策封鎖，或其設定的可執行檔無法使用。                                           | 安裝/啟用後端 Plugin，重新執行 `/acp doctor`；若仍不健康，請檢查後端安裝或政策錯誤。                                                                                   |
| 找不到測試框架命令                                                          | 未安裝配接器 CLI、外部 Plugin 遺失，或非 Codex 配接器首次執行時的 `npx` 擷取失敗。                                    | 執行 `/acp doctor`，在 Gateway 主機上安裝/預熱配接器，或明確設定 acpx 代理命令。                                                                                        |
| 測試框架傳回找不到模型                                                      | 模型 ID 對其他提供者/測試框架有效，但對此 ACP 目標無效。                                                               | 使用該測試框架列出的模型、在測試框架中設定模型，或省略覆寫。                                                                                                           |
| 測試框架傳回供應商驗證錯誤                                                  | OpenClaw 狀態正常，但目標 CLI/提供者尚未登入。                                                                         | 登入，或在 Gateway 主機環境中提供所需的提供者金鑰。                                                                                                                     |
| `Unable to resolve session target: ...`                                     | 錯誤的鍵/ID/標籤 token。                                                                                               | 執行 `/acp sessions`，複製確切的鍵/標籤，然後重試。                                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有可繫結的作用中對話時使用了 `--bind here`。                                                                       | 移至目標聊天/頻道後重試，或使用未繫結的生成。                                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | 配接器缺少目前對話的 ACP 繫結能力。                                                                                    | 在支援時使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至受支援的頻道。                                                                                 |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在執行緒情境外使用了 `--thread here`。                                                                                 | 移至目標執行緒，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的繫結目標。                                                                                     | 以擁有者身分重新繫結，或使用不同對話或執行緒。                                                                                                                         |
| `Thread bindings are unavailable for <channel>.`                            | 配接器缺少執行緒繫結能力。                                                                                             | 使用 `--thread off`，或移至受支援的配接器/頻道。                                                                                                                        |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime 位於主機端；請求者工作階段在 sandbox 中。                                                                  | 從 sandbox 工作階段使用 `runtime="subagent"`，或從非 sandbox 工作階段執行 ACP 生成。                                                                                    |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 對 ACP runtime 要求了 `sandbox="require"`。                                                                             | 需要 sandbox 時使用 `runtime="subagent"`，或從非 sandbox 工作階段使用 `sandbox="inherit"` 搭配 ACP。                                                                     |
| `Cannot apply --model ... did not advertise model support`                  | 目標測試框架未公開通用 ACP 模型切換。                                                                                  | 使用會公告 ACP `models`/`session/set_model` 的測試框架、使用 Codex ACP 模型參照，或如果測試框架有自己的啟動旗標，直接在其中設定模型。                                  |
| 已繫結工作階段缺少 ACP 中繼資料                                             | ACP 工作階段中繼資料過時/已刪除。                                                                                     | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦執行緒。                                                                                                                   |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非互動式 ACP 工作階段中封鎖寫入/執行。                                                             | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動 gateway。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。             |
| ACP 工作階段很早失敗且輸出很少                                              | 權限提示遭 `permissionMode`/`nonInteractivePermissions` 封鎖。                                                        | 檢查 gateway 記錄中的 `AcpRuntimeError`。若要完整權限，設定 `permissionMode=approve-all`；若要優雅降級，設定 `nonInteractivePermissions=deny`。                         |
| ACP 工作階段在完成工作後無限期停滯                                          | 測試框架程序已完成，但 ACP 工作階段未回報完成。                                                                        | 更新 OpenClaw；目前的 acpx 清理會在關閉和 Gateway 啟動時，回收 OpenClaw 擁有的過時包裝器與配接器程序。                                                                 |
| 測試框架看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件信封洩漏到 ACP 邊界之外。                                                                                     | 更新 OpenClaw 並重新執行完成流程；外部測試框架應只收到純文字完成提示。                                                                                                |

## 相關

- [ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)
- [代理傳送](/zh-TW/tools/agent-send)
- [CLI 後端](/zh-TW/gateway/cli-backends)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [多代理 sandbox 工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理](/zh-TW/tools/subagents)
