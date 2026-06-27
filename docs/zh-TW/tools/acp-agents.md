---
read_when:
    - 透過 ACP 執行編碼 harnesses
    - 在訊息通道上設定繫結對話的 ACP 工作階段
    - 將訊息頻道對話綁定到持久 ACP 工作階段
    - 疑難排解 ACP 後端、外掛串接或完成結果傳遞
    - 從聊天操作 /acp 指令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部編碼工具環境（Claude Code、Cursor、Gemini 命令列介面、明確的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-06-27T20:04:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9ad2fd3dec35062209b5e66a3ec301e8fa247d10a48787e54b938b10b314aee
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端外掛執行外部程式碼工具框架（例如 Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX 工具框架）。

每次產生 ACP 工作階段都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部工具框架路徑，不是預設的 Codex 路徑。** 原生 Codex
應用伺服器外掛負責 `/codex ...` 控制項，以及代理回合的預設
`openai/gpt-*` 內嵌執行階段；ACP 負責
`/acp ...` 控制項和 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 作為外部 MCP 用戶端直接連線到現有的
OpenClaw 頻道對話，請使用 [`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我該使用哪個頁面？

| 你想要…                                                                                         | 使用                                  | 備註                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 啟用 `codex` 外掛時使用原生 Codex 應用伺服器路徑；包含已繫結的聊天回覆、圖片轉送、模型/快速/權限、停止與引導控制。ACP 是明確的備用方案 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部工具框架                | 本頁                                  | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制項                                   |
| 將 OpenClaw 閘道工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                                 | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 與 OpenClaw 使用 ACP 通訊                                                               |
| 重用本機 AI 命令列介面作為純文字備用模型                                                        | [命令列介面後端](/zh-TW/gateway/cli-backends) | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有工具框架執行階段                                                              |

## 這可以開箱即用嗎？

可以，安裝官方 ACP 執行階段外掛後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 後使用本機 `extensions/acpx` 工作區外掛。
執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只會在 ACP **真正可用** 時，教導代理如何產生 ACP 工作階段：
ACP 必須已啟用、分派不可被停用、目前工作階段不可被沙盒封鎖，且必須已載入
執行階段後端。若不符合這些條件，ACP 外掛 Skills 與
`sessions_spawn` ACP 指引會保持隱藏，避免代理建議不可用的後端。

<AccordionGroup>
  <Accordion title="初次執行注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的外掛清單，且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意封鎖，`/acp doctor` 會回報缺少允許清單項目。
    - Codex ACP 轉接器會隨 `acpx` 外掛一起預備，並在可行時於本機啟動。
    - Codex ACP 使用隔離的 `CODEX_HOME` 執行；OpenClaw 會從主機 Codex 設定複製受信任的專案項目，以及安全的模型/供應商路由設定，而驗證、通知和 hook 會留在主機設定上。
    - 其他目標工具框架轉接器第一次使用時，仍可能視需要透過 `npx` 擷取。
    - 該工具框架的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取，初次執行的轉接器擷取會失敗，直到快取已預先暖機，或以其他方式安裝轉接器。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部工具框架程序。OpenClaw 負責路由、
    背景任務狀態、傳遞、繫結和政策；工具框架負責其供應商登入、
    模型目錄、檔案系統行為和原生工具。

    在責怪 OpenClaw 前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 設定允許清單時，目標 id 已被 `acp.allowedAgents` 允許。
    - 工具框架命令可以在閘道主機上啟動。
    - 該工具框架具備供應商驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該工具框架中 - 模型 id 無法跨工具框架通用。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點擊原生權限提示，因此大量寫入/執行的程式碼執行通常需要可無頭繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具和內建 OpenClaw 工具預設**不會**公開給
ACP 工具框架。只有在工具框架應直接呼叫那些工具時，才啟用
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的工具框架目標

使用 `acpx` 後端時，請將這些工具框架 id 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 工具框架 id | 典型後端                                       | 備註                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 轉接器                         | 需要主機上的 Claude Code 驗證。                                                     |
| `codex`    | Codex ACP 轉接器                               | 僅在原生 `/codex` 不可用或明確要求 ACP 時，作為 ACP 備用方案。                     |
| `copilot`  | GitHub Copilot ACP 轉接器                      | 需要 Copilot CLI/執行階段驗證。                                                     |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP 進入點，請覆寫 acpx 命令。                              |
| `droid`    | Factory Droid CLI                              | 需要工具框架環境中的 Factory/Droid 驗證或 `FACTORY_API_KEY`。                       |
| `gemini`   | Gemini CLI ACP 轉接器                          | 需要 Gemini CLI 驗證或 API key 設定。                                                |
| `iflow`    | iFlow CLI                                      | 轉接器可用性和模型控制取決於已安裝的 CLI。                                          |
| `kilocode` | Kilo Code CLI                                  | 轉接器可用性和模型控制取決於已安裝的 CLI。                                          |
| `kimi`     | Kimi/Moonshot CLI                              | 需要主機上的 Kimi/Moonshot 驗證。                                                   |
| `kiro`     | Kiro CLI                                       | 轉接器可用性和模型控制取決於已安裝的 CLI。                                          |
| `opencode` | OpenCode ACP 轉接器                            | 需要 OpenCode CLI/供應商驗證。                                                      |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw 閘道橋接       | 讓支援 ACP 的工具框架回連到 OpenClaw 閘道工作階段。                                 |
| `qwen`     | Qwen Code / Qwen CLI                           | 需要主機上的 Qwen 相容驗證。                                                        |

自訂 acpx 代理別名可以在 acpx 本身中設定，但 OpenClaw
政策在分派前仍會檢查 `acp.allowedAgents` 和任何
`agents.list[].runtime.acp.agent` 對應。

## 操作者執行手冊

從聊天使用快速 `/acp` 流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已繫結的對話或討論串中繼續（或明確指定工作階段
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
  <Step title="引導">
    不取代上下文：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資料">
    - 產生會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存中記錄 ACP 中繼資料，且當執行由父層擁有時可能會建立背景任務。
    - 父層擁有的 ACP 工作階段即使執行階段工作階段是持續性的，也會被視為背景工作；完成和跨介面傳遞會透過父層任務通知器，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉終止或孤立的父層擁有一次性 ACP 工作階段。持續性 ACP 工作階段會在仍有作用中對話繫結時保留；沒有作用中繫結的過時持續性工作階段會被關閉，避免它們在擁有任務完成或其任務記錄消失後被悄悄恢復。
    - 已繫結的後續訊息會直接傳送到 ACP 工作階段，直到繫結被關閉、取消焦點、重設或過期。
    - 閘道命令會留在本機。`/acp ...`、`/status` 和 `/unfocus` 絕不會作為一般提示文字傳送給已繫結的 ACP 工具框架。
    - 當後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。如果工具框架支援恢復，它仍可能保留自己的上游歷史。
    - acpx 外掛會在 `close` 後清理 OpenClaw 擁有的包裝器和轉接器程序樹，並在閘道啟動期間回收過時的 OpenClaw 擁有 ACPX 孤立程序。
    - 閒置的執行階段 worker 在 `acp.runtime.ttlMinutes` 後可被清理；儲存的工作階段中繼資料仍可用於 `/acp sessions`。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    應在啟用時路由到**原生 Codex
    外掛**的自然語言觸發：

    -「將這個 Discord 頻道繫結到 Codex。」
    -「將這個聊天附加到 Codex 討論串 `<id>`。」
    -「顯示 Codex 討論串，然後繫結這一個。」

    原生 Codex 對話綁定是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合的原生
    hook 轉送，使外掛 hook 可以阻擋 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准流程路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hook 會轉送到
    OpenClaw `before_agent_finalize`，外掛可在 Codex 完成其回答前要求再進行一次
    模型傳遞。此轉送刻意保持保守：它不會改動 Codex 原生工具
    引數，也不會重寫 Codex 執行緒記錄。只有在你想要 ACP runtime/session 模型時，才使用明確的 ACP。
    內嵌 Codex
    支援邊界記錄於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供者 / runtime 選擇速查表">
    - 舊版 Codex 模型參照 - 由 doctor 修復的舊版 Codex OAuth/訂閱模型路由。
    - `openai/*` - 用於 OpenAI agent 回合的原生 Codex app-server 內嵌 runtime。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由到 ACP runtime 的觸發條件：

    - 「將這個作為一次性 Claude Code ACP session 執行，並摘要結果。」
    - 「這項任務使用 Gemini 命令列介面在一個執行緒中處理，然後將後續對話保留在同一個執行緒。」
    - 「透過 ACP 在背景執行緒中執行 Codex。」

    OpenClaw 會選擇 `runtime: "acp"`、解析 harness `agentId`，
    在支援時綁定到目前對話或執行緒，並將後續訊息
    路由到該 session，直到關閉/到期。只有在 ACP/acpx 明確指定，或原生 Codex
    外掛無法用於所要求的操作時，Codex 才會走這條路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、請求者未受沙箱限制，且已載入 ACP runtime
    後端時，才會公布 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停自動
    ACP 執行緒分派，但不會隱藏或阻擋明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它的目標是 ACP harness id，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非該項目
    已明確設定為 `agents.list[].runtime.type="acp"`，
    否則不要傳入來自 `agents_list` 的一般
    OpenClaw 設定 agent id；請改用預設子代理 runtime。當 OpenClaw agent
    設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理

當你需要外部 harness runtime 時，使用 ACP。當 `codex`
外掛已啟用，且需要 Codex 對話綁定/控制時，使用**原生 Codex
app-server**。當你需要 OpenClaw 原生
委派執行時，使用**子代理**。

| 範圍          | ACP session                           | 子代理執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP 後端外掛（例如 acpx） | OpenClaw 原生子代理 runtime  |
| Session key   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| Spawn 工具    | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（預設 runtime） |

另請參閱[子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

對於透過 ACP 執行的 Claude Code，堆疊如下：

1. OpenClaw ACP session 控制平面。
2. 官方 `@openclaw/acpx` runtime 外掛。
3. Claude ACP adapter。
4. Claude 端 runtime/session 機制。

ACP Claude 是具備 ACP 控制、session 恢復、
背景任務追蹤，以及選用對話/執行緒綁定的 **harness session**。

命令列介面後端是獨立的純文字本機備援 runtime - 請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對於操作員，實務規則是：

- **需要 `/acp spawn`、可綁定 session、runtime 控制，或持續性 harness 工作？** 使用 ACP。
- **需要透過原始命令列介面進行簡單本機文字備援？** 使用命令列介面後端。

## 已綁定 session

### 心智模型

- **聊天介面** - 人們持續對話的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP session** - OpenClaw 路由到的持久 Codex/Claude/Gemini runtime 狀態。
- **子執行緒/主題** - 只有透過 `--thread ...` 建立的選用額外訊息介面。
- **Runtime 工作區** - harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。它獨立於聊天介面。

### 目前對話綁定

`/acp spawn <harness> --bind here` 會將目前對話釘選到
新產生的 ACP session - 不建立子執行緒，使用相同聊天介面。OpenClaw 會繼續
擁有傳輸、驗證、安全性與傳遞。該
對話中的後續訊息會路由到同一個 session；`/new` 和 `/reset` 會就地重設
session；`/acp close` 會移除綁定。

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
  <Accordion title="綁定規則與互斥性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於宣告支援目前對話綁定的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。綁定會在閘道重新啟動後持續存在。
    - 在 Discord 上，`spawnSessions` 會管控 `--thread auto|here` 的子執行緒建立 - 不管控 `--bind here`。
    - 如果你在沒有 `--cwd` 的情況下生成到不同的 ACP agent，OpenClaw 預設會繼承**目標 agent 的**工作區。遺失的繼承路徑（`ENOENT`/`ENOTDIR`）會退回後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為 spawn 錯誤。
    - 閘道管理命令會在已綁定對話中維持本機處理 - 即使一般後續文字會路由到已綁定的 ACP session，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面啟用了命令處理，`/status` 和 `/unfocus` 也會維持本機處理。

  </Accordion>
  <Accordion title="執行緒綁定 session">
    當頻道 adapter 啟用執行緒綁定時：

    - OpenClaw 會將執行緒綁定到目標 ACP session。
    - 該執行緒中的後續訊息會路由到已綁定的 ACP session。
    - ACP 輸出會傳回同一個執行緒。
    - 取消聚焦/關閉/封存/閒置逾時或最大存續時間到期，會移除綁定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是閘道命令，不是傳給 ACP harness 的提示。

    執行緒綁定 ACP 的必要功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設開啟（設為 `false` 可暫停自動 ACP 執行緒分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 啟用頻道 adapter 執行緒 session spawn（預設：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    執行緒綁定支援是 adapter 特定的。如果作用中的頻道
    adapter 不支援執行緒綁定，OpenClaw 會回傳清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援執行緒的頻道">
    - 任何公開 session/執行緒綁定能力的頻道 adapter。
    - 目前內建支援：**Discord** 執行緒/頻道、**Telegram** 主題（群組/超級群組中的論壇主題，以及 DM 主題）。
    - 外掛頻道可透過相同的綁定介面加入支援。

  </Accordion>
</AccordionGroup>

## 持久頻道綁定

對於非短暫工作流程，請在
頂層 `bindings[]` 項目中設定持久 ACP 綁定。

### 綁定模型

<ParamField path="bindings[].type" type='"acp"'>
  標示持久 ACP 對話綁定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道形狀如下：

- **Discord 頻道/執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道/DM：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。建議使用穩定的 Slack id；頻道綁定也會匹配該頻道執行緒中的回覆。
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/群組：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 E.164 號碼，例如 `+15555550123`；群組請使用 WhatsApp group JID，例如 `120363424282127706@g.us`。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定群組綁定建議使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有者 OpenClaw agent id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的操作員顯示標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用的 runtime 工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用的後端覆寫。
</ParamField>

### 每個 agent 的 runtime 預設值

使用 `agents.list[].runtime` 為每個 agent 定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（harness id，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 已綁定 session 的覆寫優先順序：**

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

- OpenClaw 會在特定頻道的准入之後、使用之前，確保已設定的 ACP 工作階段存在。
- 該頻道、主題或聊天中的訊息會路由至已設定的 ACP 工作階段。
- 已設定的 ACP 綁定擁有其工作階段路由。頻道廣播展開傳送不會取代相符綁定所設定的 ACP 工作階段。
- 在已綁定的對話中，`/new` 和 `/reset` 會就地重設相同的 ACP 工作階段鍵。
- 暫時性執行階段綁定（例如由 thread-focus 流程建立）在存在時仍會套用。
- 對於未明確指定 `cwd` 的跨代理 ACP 產生，OpenClaw 會從代理設定繼承目標代理工作區。
- 缺少繼承的工作區路徑時，會退回後端預設 cwd；非缺少路徑的存取失敗會以產生錯誤呈現。

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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段請明確設定
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true` 才能保留持久的已綁定對話。
    </Note>

  </Tab>
  <Tab title="From /acp command">
    從聊天使用 `/acp spawn` 進行明確的操作員控制。

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

    請參閱[斜線命令](/zh-TW/tools/slash-commands)。

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
  ACP 目標 harness id。如果已設定，會退回 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的位置要求 thread 綁定流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是單次執行；`"session"` 是持久工作階段。如果 `thread: true` 且省略
  `mode`，OpenClaw 可能會依執行階段路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端/執行階段政策驗證）。如果省略，ACP 產生會在已設定時繼承目標代理工作區；缺少繼承路徑時會退回後端預設值，而真實存取錯誤會被傳回。
</ParamField>
<ParamField path="label" type="string">
  工作階段/橫幅文字中使用的操作員可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續既有 ACP 工作階段，而不是建立新的工作階段。代理會透過 `session/load` 重播其對話記錄。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回要求者工作階段。接受的回應包含
  `streamLogPath`，指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以 tail 它來查看完整轉送記錄。
  除非 `streaming.progress.commentary=false`，否則父進度串流預設會顯示助理評論與 ACP 狀態進度。Discord 在未設定串流模式時，也會預設將父預覽設為進度模式。狀態進度仍會遵守 `acp.stream.tagVisibility`，因此像 `plan` 這類標籤除非明確啟用，否則仍會隱藏。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds` 作為其預設子回合限制。該工具不接受每次呼叫的逾時覆寫。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 產生會先將 `openai/gpt-5.4` 等 OpenAI 參照正規化為 Codex ACP 啟動設定，再執行 `session/new`；`openai/gpt-5.4/high` 這類斜線形式也會設定 Codex ACP 推理強度。
  省略時，`sessions_spawn({ runtime: "acp" })` 會在已設定時使用既有的子代理模型預設值（`agents.defaults.subagents.model` 或
  `agents.list[].subagents.model`）；否則會讓 ACP harness 使用自己的預設模型。
  其他 harness 必須宣告 ACP `models` 並支援
  `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是靜默退回目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對 Codex ACP 而言，`minimal` 會對應到低強度，`low`/`medium`/`high`/`xhigh` 會直接對應，而 `off` 會省略推理強度啟動覆寫。
  省略時，ACP 產生會使用既有的子代理思考預設值，以及所選模型的個別模型
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 產生綁定與 thread 模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地綁定目前作用中的對話；如果沒有作用中對話則失敗。 |
    | `off`  | 不建立目前對話綁定。                          |

    注意事項：

    - `--bind here` 是「讓這個頻道或聊天由 Codex 支援」最簡單的操作員路徑。
    - `--bind here` 不會建立子 thread。
    - `--bind here` 只適用於公開目前對話綁定支援的頻道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中的 thread 中：綁定該 thread。在 thread 外：支援時建立/綁定子 thread。 |
    | `here` | 要求目前作用中的 thread；如果不在其中則失敗。                                                  |
    | `off`  | 不綁定。工作階段會以未綁定狀態啟動。                                                                 |

    注意事項：

    - 在非 thread 綁定介面上，預設行為實際上是 `off`。
    - thread 綁定的產生需要頻道政策支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子 thread 時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    互動式工作階段旨在持續於可見聊天介面上對話：

    - `/acp spawn ... --bind here` 會將目前對話綁定到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道 thread/主題綁定到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    已綁定對話中的後續訊息會直接路由到 ACP 工作階段，而 ACP 輸出會傳回同一個頻道/thread/主題。

    OpenClaw 傳送給 harness 的內容：

    - 一般已綁定的後續訊息會作為提示文字傳送，且只有在 harness/後端支援時才會附上附件。
    - `/acp` 管理命令和本機閘道命令會在 ACP 分派前被攔截。
    - 執行階段產生的完成事件會依目標具體化。OpenClaw 代理會取得 OpenClaw 的內部執行階段情境信封；外部 ACP harness 會取得包含子結果與指令的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 信封絕不應傳送給外部 harness，也不應作為 ACP 使用者轉錄文字持久化。
    - ACP 轉錄項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料在可行時會在 OpenClaw 中維持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    由另一個代理執行產生的單次 ACP 工作階段是背景子項，類似子代理：

    - 父層使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求工作。
    - 子項會在自己的 ACP harness 工作階段中執行。
    - 子回合會在原生子代理產生所使用的同一個背景通道上執行，因此緩慢的 ACP harness 不會阻塞無關的主工作階段工作。
    - 完成報告會透過任務完成公告路徑回傳。OpenClaw 會先將內部完成中繼資料轉換成純 ACP 提示，再傳送給外部 harness，因此 harness 不會看到僅限 OpenClaw 的執行階段情境標記。
    - 當面向使用者的回覆有用時，父層會以一般助理語氣重寫子結果。

    **不要** 將此路徑視為父層與子項之間的點對點聊天。子項已經有完成通道可以回到父層。

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` 可在產生後指定另一個工作階段。對於一般對等工作階段，OpenClaw 會在注入訊息後使用代理對代理（A2A）後續路徑：

    - 等待目標工作階段的回覆。
    - 可選擇讓要求者和目標交換有限次數的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見頻道或 thread。

    該 A2A 路徑是對等傳送在寄件者需要可見後續回覆時的 fallback。當無關工作階段能夠看到並傳訊給 ACP 目標時，例如在寬鬆的
    `tools.sessions.visibility` 設定下，它會保持啟用。

    只有當請求者是其自身父層所擁有的一次性 ACP 子項的
    父層時，OpenClaw 才會略過 A2A 後續處理。在這種情況下，
    在任務完成之上執行 A2A 可能會用子項結果喚醒父層、
    將父層回覆轉送回子項，並建立父層/子項回音迴圈。`sessions_send` 結果會針對
    該受擁有子項案例回報 `delivery.status="skipped"`，因為
    完成路徑已經負責處理結果。

  </Accordion>
  <Accordion title="繼續既有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是
    從頭開始。代理會透過 `session/load` 重播其對話歷史，
    因此會帶著先前完整脈絡接續進行。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從筆電交接到手機 - 告訴你的代理從上次中斷處接續。
    - 繼續你先前在命令列介面中以互動方式啟動、現在透過代理以無頭模式執行的寫程式工作階段。
    - 接續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機的 ACP/harness 繼續 ID，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP 產生政策與目標代理政策，而 ACP 後端或 harness 負責載入該上游 ID 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理必須支援 `session/load`（Codex 和 Claude Code 都支援）。
    - 如果找不到工作階段 ID，產生會以清楚錯誤失敗 - 不會靜默退回到新工作階段。

  </Accordion>
  <Accordion title="部署後煙霧測試">
    閘道部署後，請執行即時端對端檢查，而不是
    只信任單元測試：

    1. 驗證目標主機上的已部署閘道版本與提交。
    2. 開啟一個到即時代理的暫時 ACPX 橋接工作階段。
    3. 要求該代理呼叫 `sessions_spawn`，並使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任務 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    將閘門保持在 `mode: "run"`，並略過 `streamTo: "parent"` -
    綁定執行緒的 `mode: "session"` 和串流轉送路徑是另外的
    較完整整合檢查。

  </Accordion>
</AccordionGroup>

## 沙盒相容性

ACP 工作階段目前在主機執行階段執行，**不是**在
OpenClaw 沙盒內執行。

<Warning>
**安全邊界：**

- 外部 harness 可依照自身命令列介面權限與所選 `cwd` 讀寫。
- OpenClaw 的沙盒政策**不會**包覆 ACP harness 執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理、工作階段擁有權、頻道繫結，以及閘道遞送政策。
- 使用 `runtime: "subagent"` 進行由沙盒強制執行的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段已沙盒化，ACP 產生會同時封鎖 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試金鑰
   - 接著嘗試 UUID 形狀的工作階段 ID
   - 接著嘗試標籤
2. 目前執行緒繫結（如果此對話/執行緒已繫結到 ACP 工作階段）。
3. 目前請求者工作階段備援。

目前對話繫結與執行緒繫結都會參與
步驟 2。

如果無法解析任何目標，OpenClaw 會回傳清楚錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段進行中的回合。                            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將導引指示傳送到執行中的工作階段。                        | `/acp steer --session support inbox prioritize failing tests` |
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
| `/acp doctor`        | 後端健康狀態、能力、可執行修正。                          | `/acp doctor`                                                 |
| `/acp install`       | 列印可重現的安裝與啟用步驟。                              | `/acp install`                                                |

`/acp status` 會顯示有效執行階段選項，以及執行階段層級和
後端層級工作階段識別碼。當後端缺少某項能力時，
不支援控制項錯誤會清楚顯示。`/acp sessions` 會讀取
目前繫結或請求者工作階段的儲存；目標權杖
（`session-key`、`session-id` 或 `session-label`）會透過
閘道工作階段探索解析，包括自訂的每代理 `session.store`
根目錄。

### 執行階段選項對應

`/acp` 具有便利命令和通用設定器。等效
操作：

| 命令                         | 對應到                               | 注意事項                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 執行階段設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為配接器模型 ID，並將斜線推理後綴（例如 `openai/gpt-5.4/high`）對應到 `reasoning_effort`。                                                            |
| `/acp set thinking <level>`  | 標準選項 `thinking`                  | OpenClaw 會在存在時傳送後端宣告的等效項，優先順序為 `thinking`，接著是 `effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，配接器會將值對應到 `reasoning_effort`。                              |
| `/acp permissions <profile>` | 標準選項 `permissionProfile`         | OpenClaw 會在存在時傳送後端宣告的等效項，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                                                |
| `/acp timeout <seconds>`     | 標準選項 `timeoutSeconds`            | OpenClaw 會在存在時傳送後端宣告的等效項，例如 `timeout` 或 `timeout_seconds`。                                                                                                                            |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                                                 |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 會使用 cwd 覆寫路徑。                                                                                                                                                                            |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | -                                                                                                                                                                                                          |

## acpx harness、外掛設定與權限

如需 acpx harness 設定（Claude Code / Codex / Gemini CLI
別名）、plugin-tools 與 OpenClaw-tools MCP 橋接，以及 ACP
權限模式，請參閱
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端外掛缺失、已停用，或被 `plugins.allow` 封鎖。                                                                      | 安裝並啟用後端外掛；若已設定該允許清單，請在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                                    |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用一般對話串訊息的自動分派。                                                                                       | 設定 `acp.dispatch.enabled=true` 以恢復自動對話串路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                 | 代理不在允許清單中。                                                                                                   | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                 | 後端外掛缺失、已停用、被允許/拒絕政策封鎖，或其設定的可執行檔無法使用。                                                | 安裝/啟用後端外掛、重新執行 `/acp doctor`，若仍不健康，請檢查後端安裝或政策錯誤。                                                                                       |
| Harness command not found                                                   | 轉接器命令列介面未安裝、外部外掛缺失，或非 Codex 轉接器首次執行的 `npx` 擷取失敗。                                    | 執行 `/acp doctor`、在閘道主機上安裝/預熱轉接器，或明確設定 acpx 代理命令。                                                                                             |
| Model-not-found from the harness                                            | 模型 ID 對另一個供應商/執行框架有效，但不適用於此 ACP 目標。                                                          | 使用該執行框架列出的模型、在執行框架中設定模型，或省略覆寫。                                                                                                            |
| Vendor auth error from the harness                                          | OpenClaw 正常，但目標命令列介面/供應商尚未登入。                                                                       | 在閘道主機環境登入，或提供必要的供應商金鑰。                                                                                                                            |
| `Unable to resolve session target: ...`                                     | 錯誤的金鑰/ID/標籤權杖。                                                                                               | 執行 `/acp sessions`、複製精確的金鑰/標籤，然後重試。                                                                                                                    |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有可綁定的作用中對話時使用了 `--bind here`。                                                                        | 移至目標聊天/頻道後重試，或使用未綁定的 spawn。                                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | 轉接器缺少目前對話的 ACP 綁定能力。                                                                                    | 在支援處使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                                    |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在對話串脈絡外使用了 `--thread here`。                                                                                  | 移至目標對話串，或使用 `--thread auto`/`off`。                                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的綁定目標。                                                                                     | 以擁有者身分重新綁定，或使用其他對話或對話串。                                                                                                                          |
| `Thread bindings are unavailable for <channel>.`                            | 轉接器缺少對話串綁定能力。                                                                                             | 使用 `--thread off`，或移至支援的轉接器/頻道。                                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP 執行階段在主機端；請求者工作階段處於沙箱中。                                                                       | 從沙箱工作階段使用 `runtime="subagent"`，或從非沙箱工作階段執行 ACP spawn。                                                                                              |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 對 ACP 執行階段要求了 `sandbox="require"`。                                                                             | 對必要的沙箱化使用 `runtime="subagent"`，或從非沙箱工作階段使用含 `sandbox="inherit"` 的 ACP。                                                                           |
| `Cannot apply --model ... did not advertise model support`                  | 目標執行框架未公開通用 ACP 模型切換。                                                                                  | 使用宣告支援 ACP `models`/`session/set_model` 的執行框架、使用 Codex ACP 模型參照，或如果該執行框架有自己的啟動旗標，請直接在其中設定模型。                              |
| Missing ACP metadata for bound session                                      | 過時/已刪除的 ACP 工作階段中繼資料。                                                                                   | 使用 `/acp spawn` 重新建立，然後重新綁定/聚焦對話串。                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非互動 ACP 工作階段中封鎖寫入/執行。                                                                | 將 `plugins.entries.acpx.config.permissionMode` 設定為 `approve-all`，並重新啟動閘道。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。                |
| ACP session fails early with little output                                  | 權限提示被 `permissionMode`/`nonInteractivePermissions` 封鎖。                                                         | 檢查閘道日誌中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。                           |
| ACP session stalls indefinitely after completing work                       | 執行框架程序已完成，但 ACP 工作階段未回報完成。                                                                         | 更新 OpenClaw；目前的 acpx 清理會在關閉和閘道啟動時，收割 OpenClaw 擁有的過時包裝器與轉接器程序。                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件信封洩漏跨越 ACP 邊界。                                                                                       | 更新 OpenClaw 並重新執行完成流程；外部執行框架應只收到純文字完成提示。                                                                                                  |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex hook relay，而不是 ACP/acpx。在已綁定的 Codex 聊天中，使用 `/new` 或
`/reset` 啟動新的工作階段；如果它成功一次，接著在下一次原生工具呼叫時又再次出現，
請重新啟動 Codex app-server 或 OpenClaw 閘道，而不是重複 `/new`。請參閱 [Codex 執行框架疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
</Note>

## 相關

- [ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)
- [代理傳送](/zh-TW/tools/agent-send)
- [命令列介面後端](/zh-TW/gateway/cli-backends)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [多代理沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理](/zh-TW/tools/subagents)
