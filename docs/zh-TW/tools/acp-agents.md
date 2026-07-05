---
read_when:
    - 透過 ACP 執行程式設計 harnesses
    - 在訊息通道上設定繫結對話的 ACP 工作階段
    - 將訊息通道對話綁定到持久的 ACP 工作階段
    - 疑難排解 ACP 後端、外掛接線或完成交付
    - 透過聊天操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼撰寫框架（Claude Code、Cursor、Gemini 命令列介面、明確的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理
x-i18n:
    generated_at: "2026-07-05T01:59:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bc48f9d2d3d379596f50132b70f07d42d860a4c633835e0bda6622fcd5be8db
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端外掛執行外部編碼工具框架（例如 Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini CLI，以及其他
支援的 ACPX 工具框架）。

每個 ACP 工作階段的產生都會被追蹤為[背景工作](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部工具框架路徑，不是預設的 Codex 路徑。** 原生
Codex app-server 外掛負責 `/codex ...` 控制項，以及代理回合的預設
`openai/gpt-*` 嵌入式執行環境；ACP 負責
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 作為外部 MCP 用戶端直接連線到
既有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我該使用哪個頁面？

| 你想要…                                                                                         | 使用這個                              | 備註                                                                                                                                                                                          |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中綁定或控制 Codex                                                                    | `/codex bind`, `/codex threads`       | 啟用 `codex` 外掛時的原生 Codex app-server 路徑；包含已綁定聊天回覆、圖片轉送、模型/快速/權限、停止與引導控制。ACP 是明確的備援 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確的 Codex ACP，或其他外部工具框架                | 本頁                                  | 綁定聊天的工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景工作、執行環境控制                                   |
| 將 OpenClaw 閘道工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                                | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 以 ACP 與 OpenClaw 通訊                                                                                                                              |
| 重用本機 AI 命令列介面作為純文字備援模型                                                        | [命令列介面後端](/zh-TW/gateway/cli-backends) | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有工具框架執行環境                                                                                                                          |

## 這是否可直接使用？

可以，安裝官方 ACP 執行環境外掛後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 後使用本機 `extensions/acpx`
工作區外掛。執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只會在 ACP **真正可用**時教代理如何產生 ACP：
ACP 必須已啟用、dispatch 不得被停用、目前工作階段不得受沙盒阻擋，
且必須已載入執行環境後端。如果不符合這些條件，ACP 外掛 Skills 與
`sessions_spawn` ACP 指引會保持隱藏，避免代理建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的外掛清單，且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意阻擋，`/acp doctor` 會回報缺少 allowlist 項目。
    - Codex ACP 轉接器會隨 `acpx` 外掛暫存，並在可能時於本機啟動。
    - Codex ACP 會以隔離的 `CODEX_HOME` 執行；OpenClaw 會從主機 Codex 設定複製受信任的專案項目，以及安全的模型/供應商路由設定，而驗證、通知與 hook 會留在主機設定中。
    - 其他目標工具框架轉接器可能仍會在你第一次使用時透過 `npx` 按需擷取。
    - 該工具框架的供應商驗證仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取，首次執行的轉接器擷取會失敗，直到快取已預先暖機，或以其他方式安裝轉接器。

  </Accordion>
  <Accordion title="執行環境先決條件">
    ACP 會啟動真正的外部工具框架程序。OpenClaw 負責路由、
    背景工作狀態、傳遞、綁定與政策；工具框架負責其供應商登入、
    模型目錄、檔案系統行為與原生工具。

    在歸咎於 OpenClaw 之前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 當設定了 `acp.allowedAgents` allowlist 時，目標 ID 已被允許。
    - 工具框架命令可以在閘道主機上啟動。
    - 該工具框架具備供應商驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該工具框架中 - 模型 ID 無法跨工具框架移植。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd`，讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點擊原生權限提示，因此大量寫入/執行的編碼執行通常需要可無頭繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具與內建 OpenClaw 工具預設**不會**公開給
ACP 工具框架。只有在工具框架應直接呼叫那些工具時，才啟用
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的工具框架目標

使用 `acpx` 後端時，請將這些工具框架 ID 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 工具框架 ID | 典型後端                                       | 備註                                                                                |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP 轉接器                        | 需要主機上的 Claude Code 驗證。                                                     |
| `codex`    | Codex ACP 轉接器                              | 僅在原生 `/codex` 不可用或已要求 ACP 時，作為明確 ACP 備援。                        |
| `copilot`  | GitHub Copilot ACP 轉接器                     | 需要 Copilot 命令列介面/執行環境驗證。                                              |
| `cursor`   | Cursor 命令列介面 ACP (`cursor-agent acp`)    | 如果本機安裝公開了不同的 ACP 進入點，請覆寫 acpx 命令。                             |
| `droid`    | Factory Droid 命令列介面                      | 需要工具框架環境中的 Factory/Droid 驗證或 `FACTORY_API_KEY`。                       |
| `gemini`   | Gemini CLI ACP 轉接器                         | 需要 Gemini CLI 驗證或 API 金鑰設定。                                                |
| `iflow`    | iFlow 命令列介面                              | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                    |
| `kilocode` | Kilo Code 命令列介面                          | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                    |
| `kimi`     | Kimi/Moonshot 命令列介面                      | 需要主機上的 Kimi/Moonshot 驗證。                                                    |
| `kiro`     | Kiro 命令列介面                               | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                    |
| `opencode` | OpenCode ACP 轉接器                           | 需要 OpenCode 命令列介面/供應商驗證。                                                |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw 閘道橋接      | 讓具備 ACP 能力的工具框架與 OpenClaw 閘道工作階段通訊。                             |
| `qwen`     | Qwen Code / Qwen CLI                          | 需要主機上的 Qwen 相容驗證。                                                        |

自訂 acpx 代理別名可在 acpx 本身設定，但 OpenClaw
政策在 dispatch 前仍會檢查 `acp.allowedAgents`，以及任何
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
    在已綁定的對話或執行緒中繼續（或明確指定工作階段
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
    不取代內容脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 綁定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 產生會建立或恢復 ACP 執行環境工作階段，將 ACP 中繼資料記錄到 OpenClaw 工作階段儲存區，並且在執行由父層擁有時可能建立背景工作。
    - 即使執行環境工作階段是持久的，由父層擁有的 ACP 工作階段仍會被視為背景工作；完成與跨表面傳遞會透過父層工作通知器，而不是像一般面向使用者的聊天工作階段一樣處理。
    - 工作維護會關閉終止或孤立的由父層擁有的一次性 ACP 工作階段。只要仍有作用中的對話綁定，持久 ACP 工作階段就會保留；沒有作用中綁定的過期持久工作階段會被關閉，避免在擁有工作完成或其工作記錄消失後被靜默恢復。
    - 已綁定的後續訊息會直接傳送到 ACP 工作階段，直到綁定被關閉、取消聚焦、重設或過期。
    - 閘道命令會保留在本機。`/acp ...`、`/status` 與 `/unfocus` 絕不會作為一般提示文字傳送給已綁定的 ACP 工具框架。
    - 後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除綁定或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除綁定。如果工具框架支援恢復，仍可能保留其自己的上游歷史。
    - acpx 外掛會在 `close` 後清理 OpenClaw 擁有的包裝器與轉接器程序樹，並在閘道啟動期間回收過期的 OpenClaw 擁有 ACPX 孤兒程序。
    - 閒置的執行環境 worker 在 `acp.runtime.ttlMinutes` 後可被清理；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    當**原生 Codex 外掛**已啟用時，應路由到該外掛的自然語言觸發：

    - "將這個 Discord 頻道綁定到 Codex。"
    - "將這個聊天附加到 Codex 執行緒 `<id>`。"
    - "顯示 Codex 執行緒，然後綁定這一個。"

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍會透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）會在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合的原生
    hook relay，讓外掛 hook 可以封鎖 `before_tool_call`、觀察
    `after_tool_call`，並透過 OpenClaw 核准流程路由 Codex `PermissionRequest` 事件。
    Codex `Stop` hook 會轉送至 OpenClaw `before_agent_finalize`，
    外掛可在那裡要求再進行一次模型傳遞，然後 Codex 才會完成其答案。
    這個 relay 仍刻意保持保守：它不會變更 Codex 原生工具
    引數，也不會重寫 Codex thread 記錄。只有在你想使用 ACP
    runtime/session 模型時，才使用明確的 ACP。嵌入式 Codex
    支援邊界記錄於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 供應商 / runtime 選擇速查表">
    - 舊版 Codex 模型參照 - 由 doctor 修復的舊版 Codex OAuth/訂閱模型路由。
    - `openai/*` - 用於 OpenAI 代理回合的原生 Codex app-server 嵌入式 runtime。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由至 ACP runtime 的觸發條件：

    -「將這個作為一次性 Claude Code ACP 工作階段執行，並摘要結果。」
    -「在 thread 中使用 Gemini 命令列介面處理此任務，然後將後續追蹤保留在同一個 thread 中。」
    -「透過 ACP 在背景 thread 中執行 Codex。」

    OpenClaw 會選取 `runtime: "acp"`、解析 harness `agentId`，
    在支援時繫結至目前對話或 thread，並將後續追蹤路由至該工作階段直到關閉/到期。
    Codex 只有在明確指定 ACP/acpx，或原生 Codex
    外掛無法用於所要求的操作時，才會走這條路徑。

    對於 `sessions_spawn`，只有在 ACP 已啟用、請求者未受沙箱限制，
    且已載入 ACP runtime 後端時，才會通告 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 會暫停自動
    ACP thread 分派，但不會隱藏或封鎖明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它的目標是 ACP harness id，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。不要傳入來自
    `agents_list` 的一般 OpenClaw config 代理 id，除非該項目已明確設定為
    `agents.list[].runtime.type="acp"`；否則請使用預設的子代理 runtime。
    當 OpenClaw 代理設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層 harness id。

  </Accordion>
</AccordionGroup>

## ACP 與子代理比較

當你想使用外部 harness runtime 時，請使用 ACP。當 `codex`
外掛啟用，且你需要 Codex 對話繫結/控制時，請使用 **原生 Codex
app-server**。當你想使用 OpenClaw 原生的委派執行時，請使用 **子代理**。

| 區域          | ACP 工作階段                         | 子代理執行                         |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | ACP 後端外掛（例如 acpx）             | OpenClaw 原生子代理 runtime        |
| 工作階段鍵    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令      | `/acp ...`                            | `/subagents ...`                   |
| 產生工具      | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（預設 runtime）   |

另請參閱[子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 執行 Claude Code 時，堆疊為：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` runtime 外掛。
3. Claude ACP adapter。
4. Claude 端 runtime/session 機制。

ACP Claude 是具有 ACP 控制、工作階段恢復、背景任務追蹤，
以及選用對話/thread 繫結的 **harness 工作階段**。

命令列介面後端是獨立的純文字本機 fallback runtime - 請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對 operator 而言，實務規則是：

- **想要 `/acp spawn`、可繫結工作階段、runtime 控制，或持久 harness 工作？** 使用 ACP。
- **想要透過原始命令列介面進行簡單本機文字 fallback？** 使用命令列介面後端。

## 已繫結工作階段

### 心智模型

- **聊天介面** - 人們持續交談的位置（Discord channel、Telegram topic、iMessage chat）。
- **ACP 工作階段** - OpenClaw 路由到的持久 Codex/Claude/Gemini runtime 狀態。
- **子 thread/topic** - 只有 `--thread ...` 才會建立的選用額外訊息介面。
- **Runtime 工作區** - harness 執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。它獨立於聊天介面。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話釘選到
新產生的 ACP 工作階段 - 沒有子 thread，使用同一個聊天介面。
OpenClaw 仍負責 transport、auth、安全性與傳遞。該對話中的後續訊息
會路由至同一個工作階段；`/new` 與 `/reset` 會就地重設
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
  <Accordion title="繫結規則與互斥性">
    - `--bind here` 與 `--thread ...` 互斥。
    - `--bind here` 只適用於通告目前對話繫結能力的 channel；否則 OpenClaw 會回傳清楚的不支援訊息。繫結會在閘道重新啟動後保留。
    - 在 Discord 上，`spawnSessions` 會控管 `--thread auto|here` 的子 thread 建立 - 不會控管 `--bind here`。
    - 如果你產生到不同的 ACP 代理且未指定 `--cwd`，OpenClaw 預設會繼承 **目標代理的** 工作區。缺少的繼承路徑（`ENOENT`/`ENOTDIR`）會 fallback 至後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - 閘道管理命令會在已繫結對話中保持本機處理 - 即使一般後續文字會路由到已繫結的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 與 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="Thread 繫結工作階段">
    當 channel adapter 啟用 thread 繫結時：

    - OpenClaw 會將 thread 繫結至目標 ACP 工作階段。
    - 該 thread 中的後續訊息會路由至已繫結的 ACP 工作階段。
    - ACP 輸出會傳回同一個 thread。
    - Unfocus/close/archive/idle-timeout 或 max-age 到期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 與 `/unfocus` 是閘道命令，不是傳給 ACP harness 的 prompt。

    Thread 繫結 ACP 所需的 feature flag：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP thread 分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用 channel-adapter thread 工作階段產生（預設：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    Thread 繫結支援依 adapter 而異。如果作用中的 channel
    adapter 不支援 thread 繫結，OpenClaw 會回傳清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援 thread 的 channel">
    - 任何公開 session/thread 繫結能力的 channel adapter。
    - 目前內建支援：**Discord** threads/channels、**Telegram** topics（群組/超級群組中的 forum topics 與 DM topics）。
    - 外掛 channel 可透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久 channel 繫結

對於非暫時性工作流程，請在頂層 `bindings[]` 項目中設定持久 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各 channel 形狀如下：

- **Discord channel/thread：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack channel/DM：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。建議使用穩定的 Slack id；channel 繫結也會匹配該 channel thread 內的回覆。
- **Telegram forum topic：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/group：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 E.164 號碼，例如 `+15555550123`；群組請使用 WhatsApp group JID，例如 `120363424282127706@g.us`。
- **iMessage DM/group：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。穩定的群組繫結建議使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有此項目的 OpenClaw 代理 id。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用的 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的 operator 可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用的 runtime 工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用的後端覆寫。
</ParamField>

### 每個代理的 Runtime 預設值

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

- OpenClaw 會在通道特定准入之後、使用之前，確保已設定的 ACP 工作階段存在。
- 該通道、主題或聊天中的訊息會路由到已設定的 ACP 工作階段。
- 已設定的 ACP 繫結擁有其工作階段路由。通道廣播扇出不會取代相符繫結所設定的 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設相同的 ACP 工作階段鍵。
- 暫時性執行階段繫結（例如由執行緒聚焦流程建立的繫結）在存在時仍會套用。
- 對於沒有明確 `cwd` 的跨代理 ACP 產生，OpenClaw 會從代理設定繼承目標代理工作區。
- 缺少繼承的工作區路徑時，會退回後端預設 cwd；非缺失的存取失敗會顯示為產生錯誤。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

<Tabs>
  <Tab title="從 sessions_spawn">
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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段要明確設定
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用
    `acp.defaultAgent`。`mode: "session"` 需要
    `thread: true`，以保留持久的繫結對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 命令">
    使用 `/acp spawn` 從聊天進行明確的操作者控制。

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
  ACP 目標執行框架 ID。如果已設定，會退回 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的位置請求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久的。如果 `thread: true` 且
  省略 `mode`，OpenClaw 可能會依照執行階段路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  請求的執行階段工作目錄（由後端/執行階段政策驗證）。如果省略，
  ACP 產生會在已設定時繼承目標代理工作區；缺少繼承路徑時會退回後端
  預設值，而實際存取錯誤會被回傳。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段/橫幅文字的操作者面向標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續現有 ACP 工作階段，而不是建立新工作階段。代理會透過
  `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回請求者工作階段。
  接受的回應包含指向工作階段範圍 JSONL 記錄的 `streamLogPath`
  （`<sessionId>.acp-stream.jsonl`），你可以追蹤它以查看完整轉送歷史。
  父層進度串流預設會顯示助理評論與 ACP 狀態進度，除非
  `streaming.progress.commentary=false`。Discord 在未設定串流模式時，
  也會預設將父層預覽設為進度模式。狀態進度仍遵循
  `acp.stream.tagVisibility`，因此除非明確啟用，像 `plan` 這類標籤仍會保持隱藏。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds`
作為預設子回合限制。此工具不接受每次呼叫的逾時覆寫。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 產生會在 `session/new` 之前，
  將 `openai/gpt-5.4` 等 OpenAI 參照正規化為 Codex ACP 啟動設定；
  `openai/gpt-5.4/high` 等斜線形式也會設定 Codex ACP 推理強度。
  省略時，`sessions_spawn({ runtime: "acp" })` 會在已設定時使用現有
  子代理模型預設值（`agents.defaults.subagents.model` 或
  `agents.list[].subagents.model`）；否則會讓 ACP 執行框架使用自己的預設模型。
  其他執行框架必須宣告 ACP `models` 並支援
  `session/set_model`；否則 OpenClaw/acpx 會清楚失敗，而不是默默退回目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對於 Codex ACP，`minimal` 會對應到低強度，
  `low`/`medium`/`high`/`xhigh` 會直接對應，而 `off`
  會省略推理強度啟動覆寫。
  省略時，ACP 產生會使用現有子代理思考預設值，以及所選模型的每模型
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 產生繫結與執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前的使用中對話；如果沒有使用中對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    備註：

    - `--bind here` 是「讓這個通道或聊天由 Codex 支援」最簡單的操作者路徑。
    - `--bind here` 不會建立子執行緒。
    - `--bind here` 只適用於公開目前對話繫結支援的通道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在使用中的執行緒中：繫結該執行緒。在執行緒外：在支援時建立/繫結子執行緒。 |
    | `here` | 要求目前使用中的執行緒；如果不在執行緒中則失敗。                                                  |
    | `off`  | 不繫結。工作階段以未繫結狀態啟動。                                                                 |

    備註：

    - 在非執行緒繫結介面上，預設行為實際上是 `off`。
    - 執行緒繫結產生需要通道政策支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子執行緒時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。
傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段旨在持續於可見聊天介面上對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將通道執行緒/主題繫結到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由到 ACP 工作階段，ACP 輸出也會傳回同一個
    通道/執行緒/主題。

    OpenClaw 傳送給執行框架的內容：

    - 一般已繫結的後續訊息會作為提示文字傳送，只有在執行框架/後端支援時才會附帶附件。
    - `/acp` 管理命令與本機 Gateway 命令會在 ACP 分派前被攔截。
    - 執行階段產生的完成事件會依目標具體化。OpenClaw 代理會取得 OpenClaw 的內部執行階段內容封套；外部 ACP 執行框架則會取得包含子結果與指示的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封套絕不應傳送給外部執行框架，也不應作為 ACP 使用者逐字稿文字持久化。
    - ACP 逐字稿項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="父層擁有的一次性 ACP 工作階段">
    由另一個代理執行所產生的一次性 ACP 工作階段是背景子項，
    類似於子代理：

    - 父層使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 請求工作。
    - 子項會在自己的 ACP 執行框架工作階段中執行。
    - 子回合會在原生子代理產生所用的同一條背景通道上執行，因此緩慢的 ACP 執行框架不會阻塞不相關的主要工作階段工作。
    - 完成會透過任務完成公告路徑回報。OpenClaw 會在傳送給外部執行框架前，將內部完成中繼資料轉換為純 ACP 提示，因此執行框架不會看到 OpenClaw 專用的執行階段內容標記。
    - 當使用者面向回覆有用時，父層會以一般助理語氣改寫子結果。

    **不要** 將此路徑視為父層與子項之間的點對點聊天。子項已經有回到父層的完成通道。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可以在產生後鎖定另一個工作階段。對於一般對等工作階段，
    OpenClaw 會在注入訊息後使用代理對代理（A2A）後續路徑：

    - 等待目標工作階段的回覆。
    - 可選擇讓請求者與目標交換有限次數的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見通道或執行緒。

    這個 A2A 路徑是對等傳送的後備機制，適用於傳送者需要可見後續回覆的情況。
    當不相關的工作階段可以看見並傳訊給 ACP 目標時，它仍會保持啟用，
    例如在寬鬆的 `tools.sessions.visibility` 設定下。

    OpenClaw 只有在請求者是其自身由父項擁有的一次性 ACP 子項的
    父項時，才會略過 A2A 後續動作。在這種情況下，
    在工作完成之上執行 A2A，可能會用子項的結果喚醒父項、
    將父項的回覆轉送回子項，並建立父項/子項回音迴圈。`sessions_send` 結果會針對該擁有子項情況回報
    `delivery.status="skipped"`，因為完成路徑已負責處理結果。

  </Accordion>
  <Accordion title="續用現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是
    重新開始。代理程式會透過
    `session/load` 重播其對話歷史，因此會帶著先前內容的完整脈絡接續。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從你的筆電交接到手機 - 告訴你的代理程式從你離開的地方接續。
    - 繼續你先前在命令列介面中互動式啟動的編碼工作階段，現在改由代理程式以無頭方式執行。
    - 接續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理執行環境會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理執行環境會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機 ACP/harness 續用 id，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP 衍生政策與目標代理程式政策，而 ACP 後端或 harness 擁有載入該上游 id 的授權。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 與 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段 id，衍生會以明確錯誤失敗 - 不會靜默退回到新工作階段。

  </Accordion>
  <Accordion title="部署後煙霧測試">
    閘道部署後，請執行即時端對端檢查，而不是
    信任單元測試：

    1. 驗證目標主機上已部署的閘道版本與 commit。
    2. 開啟通往即時代理程式的臨時 ACPX 橋接工作階段。
    3. 要求該代理程式呼叫 `sessions_spawn`，並使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及工作 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理臨時橋接工作階段。

    將閘門維持在 `mode: "run"`，並略過 `streamTo: "parent"` -
    綁定對話串的 `mode: "session"` 與串流轉送路徑是另外的
    較完整整合檢查。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機執行環境中執行，**不是**在
OpenClaw 沙箱內執行。

<Warning>
**安全邊界：**

- 外部 harness 可依其自身命令列介面權限與所選 `cwd` 進行讀寫。
- OpenClaw 的沙箱政策**不會**包覆 ACP harness 執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理程式、工作階段擁有權、頻道繫結，以及閘道傳遞政策。
- 使用 `runtime: "subagent"` 執行由沙箱強制管控的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段已沙箱化，ACP 衍生會同時封鎖 `sessions_spawn({ runtime: "acp" })` 與 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試金鑰
   - 接著嘗試 UUID 形狀的工作階段 id
   - 接著嘗試標籤
2. 目前對話串繫結（如果此對話/對話串已繫結到 ACP 工作階段）。
3. 目前請求者工作階段後援。

目前對話繫結與對話串繫結都會參與
步驟 2。

如果沒有解析出目標，OpenClaw 會傳回明確錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 作用                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或對話串繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段進行中的回合。                            | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將 steer 指令傳送到執行中的工作階段。                     | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除對話串目標繫結。                        | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行環境選項與功能。                | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行環境模式。                          | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行環境設定選項。                                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行環境工作目錄覆寫。                                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                      | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行環境逾時（秒）。                                  | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行環境模型覆寫。                                    | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行環境選項覆寫。                            | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存區列出最近的 ACP 工作階段。                         | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、功能、可採取的修正。                        | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                              | `/acp install`                                                |

執行環境控制項（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 與 `reset-options`）需要
來自外部頻道的擁有者身分，以及來自內部閘道
用戶端的 `operator.admin`。已授權的非擁有者傳送者仍可使用 `sessions`、`doctor`、
`install` 與 `help`。

`/acp status` 會顯示有效的執行環境選項，以及執行環境層級與
後端層級的工作階段識別碼。當後端缺少某項功能時，不支援的控制項錯誤會
清楚顯示。`/acp sessions` 會針對目前已繫結或請求者工作階段讀取
儲存區；目標權杖（`session-key`、`session-id` 或 `session-label`）
會透過閘道工作階段探索解析，包括自訂的每代理程式 `session.store`
根目錄。

### 執行環境選項對應

`/acp` 有便利命令與通用設定器。等效
操作：

| 命令                         | 對應到                               | 注意事項                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 執行環境設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為配接器模型 id，並將斜線 reasoning 後綴（例如 `openai/gpt-5.4/high`）對應到 `reasoning_effort`。                                                     |
| `/acp set thinking <level>`  | 標準選項 `thinking`                  | OpenClaw 會在存在時傳送後端宣告的等效項，優先使用 `thinking`，接著是 `effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，配接器會將值對應到 `reasoning_effort`。 |
| `/acp permissions <profile>` | 標準選項 `permissionProfile`         | OpenClaw 會在存在時傳送後端宣告的等效項，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                       |
| `/acp timeout <seconds>`     | 標準選項 `timeoutSeconds`            | OpenClaw 會在存在時傳送後端宣告的等效項，例如 `timeout` 或 `timeout_seconds`。                                                                                                     |
| `/acp cwd <path>`            | 執行環境 cwd 覆寫                    | 直接更新。                                                                                                                                                                                                 |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆寫路徑。                                                                                                                                                                             |
| `/acp reset-options`         | 清除所有執行環境覆寫                 | -                                                                                                                                                                                                          |

## acpx harness、外掛設定與權限

如需 acpx harness 設定（Claude Code / Codex / Gemini 命令列介面
別名）、plugin-tools 與 OpenClaw-tools MCP 橋接，以及 ACP
權限模式，請參閱
[ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                                      | 可能原因                                                                                                               | 修正方式                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | 後端外掛遺失、已停用，或被 `plugins.allow` 封鎖。                                                                       | 安裝並啟用後端外掛；若已設定該允許清單，請將 `acpx` 納入 `plugins.allow`，然後執行 `/acp doctor`。                                                                      |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 已停用從一般執行緒訊息進行的自動分派。                                                                                 | 設定 `acp.dispatch.enabled=true` 以恢復自動執行緒路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                       |
| `ACP agent "<id>" is not allowed by policy`                                               | 代理不在允許清單中。                                                                                                   | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                       |
| `/acp doctor` reports backend not ready right after startup                               | 後端外掛遺失、已停用、被允許/拒絕政策封鎖，或其設定的可執行檔無法使用。                                                | 安裝/啟用後端外掛，重新執行 `/acp doctor`；若仍不健康，請檢查後端安裝或政策錯誤。                                                                                       |
| Harness command not found                                                                 | 配接器命令列介面未安裝、外部外掛遺失，或非 Codex 配接器的首次執行 `npx` 擷取失敗。                                     | 執行 `/acp doctor`、在閘道主機上安裝/預熱配接器，或明確設定 acpx 代理命令。                                                                                             |
| Model-not-found from the harness                                                          | 模型 ID 對其他提供者/執行框架有效，但不適用於此 ACP 目標。                                                             | 使用該執行框架列出的模型、在執行框架中設定模型，或省略覆寫。                                                                                                            |
| Vendor auth error from the harness                                                        | OpenClaw 健康，但目標命令列介面/提供者尚未登入。                                                                       | 在閘道主機環境中登入或提供所需的提供者金鑰。                                                                                                                           |
| `Unable to resolve session target: ...`                                                   | 錯誤的鍵/id/標籤權杖。                                                                                                 | 執行 `/acp sessions`，複製確切的鍵/標籤，然後重試。                                                                                                                     |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 在沒有作用中且可繫結對話的情況下使用了 `--bind here`。                                                                  | 移至目標聊天/頻道後重試，或使用未繫結的 spawn。                                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | 配接器缺少目前對話 ACP 繫結能力。                                                                                      | 在支援時使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                                    |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 在執行緒情境外使用了 `--thread here`。                                                                                  | 移至目標執行緒，或使用 `--thread auto`/`off`。                                                                                                                          |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 另一位使用者擁有作用中的繫結目標。                                                                                     | 以擁有者身分重新繫結，或使用其他對話或執行緒。                                                                                                                         |
| `Thread bindings are unavailable for <channel>.`                                          | 配接器缺少執行緒繫結能力。                                                                                             | 使用 `--thread off`，或移至支援的配接器/頻道。                                                                                                                          |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP 執行階段位於主機端；請求者工作階段已沙箱化。                                                                       | 從沙箱化工作階段使用 `runtime="subagent"`，或從非沙箱化工作階段執行 ACP spawn。                                                                                          |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACP 執行階段要求了 `sandbox="require"`。                                                                                | 若需要沙箱，請使用 `runtime="subagent"`；或從非沙箱化工作階段以 `sandbox="inherit"` 使用 ACP。                                                                           |
| `Cannot apply --model ... did not advertise model support`                                | 目標執行框架未公開通用 ACP 模型切換。                                                                                  | 使用宣告 ACP `models`/`session/set_model` 的執行框架、使用 Codex ACP 模型參照，或如果執行框架有自己的啟動旗標，直接在其中設定模型。                                    |
| Missing ACP metadata for bound session                                                    | 過期/已刪除的 ACP 工作階段中繼資料。                                                                                   | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦執行緒。                                                                                                                   |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 在非互動式 ACP 工作階段中封鎖寫入/執行。                                                              | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動閘道。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。                 |
| ACP session fails early with little output                                                | 權限提示被 `permissionMode`/`nonInteractivePermissions` 封鎖。                                                         | 檢查閘道日誌中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。                          |
| ACP session stalls indefinitely after completing work                                     | 執行框架程序已完成，但 ACP 工作階段未回報完成。                                                                        | 更新 OpenClaw；目前的 acpx 清理會在關閉和閘道啟動時，回收 OpenClaw 擁有的過期包裝器與配接器程序。                                                                       |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | 內部事件封套洩漏越過 ACP 邊界。                                                                                        | 更新 OpenClaw 並重新執行完成流程；外部執行框架應只收到純文字完成提示。                                                                                                  |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex hook 轉送，而不是 ACP/acpx。在已繫結的 Codex 聊天中，請使用 `/new`
或 `/reset` 啟動新的工作階段；如果它可以運作一次，然後在下一次原生工具呼叫時再次出現，
請改為重新啟動 Codex app-server 或 OpenClaw 閘道，而不是重複執行 `/new`。
請參閱 [Codex 執行框架疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
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
