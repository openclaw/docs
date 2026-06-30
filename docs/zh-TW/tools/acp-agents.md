---
read_when:
    - 透過 ACP 執行程式碼編寫工具環境
    - 在訊息通道上設定綁定對話的 ACP 工作階段
    - 將訊息通道對話綁定到持久 ACP 工作階段
    - ACP 後端、外掛串接或 completion 傳遞疑難排解
    - 從聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式碼編寫工具（Claude Code、Cursor、Gemini 命令列介面、明確的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-06-30T13:49:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) 工作階段
讓 OpenClaw 透過 ACP 後端外掛執行外部編碼 harness（例如 Claude Code、
Cursor、Copilot、Droid、OpenClaw ACP、OpenCode、Gemini 命令列介面，以及其他
支援的 ACPX harness）。

每次產生 ACP 工作階段都會被追蹤為一個[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部 harness 路徑，不是預設的 Codex 路徑。** 原生 Codex app-server 外掛擁有 `/codex ...` 控制項，以及用於代理回合的預設
`openai/gpt-*` 內嵌執行階段；ACP 擁有
`/acp ...` 控制項與 `sessions_spawn({ runtime: "acp" })` 工作階段。

如果你想讓 Codex 或 Claude Code 以外部 MCP 用戶端身分，直接連接到現有的 OpenClaw channel 對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而不是 ACP。
</Note>

## 我想要哪個頁面？

| 你想要…                                                                                    | 使用這個                              | 備註                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中綁定或控制 Codex                                               | `/codex bind`, `/codex threads`       | 啟用 `codex` 外掛時的原生 Codex app-server 路徑；包含已綁定聊天回覆、圖片轉送、模型/快速/權限、停止與引導控制。ACP 是明確的備援 |
| 透過 OpenClaw 執行 Claude Code、Gemini 命令列介面、明確的 Codex ACP，或其他外部 harness | 本頁                             | 與聊天綁定的工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制                                                                                   |
| 將 OpenClaw Gateway 工作階段作為 ACP 伺服器提供給編輯器或用戶端                   | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式。IDE/用戶端透過 stdio/WebSocket 與 OpenClaw 以 ACP 通訊                                                                                                                            |
| 重複使用本機 AI 命令列介面作為純文字備援模型                                              | [命令列介面後端](/zh-TW/gateway/cli-backends) | 不是 ACP。沒有 OpenClaw 工具、沒有 ACP 控制項、沒有 harness 執行階段                                                                                                                               |

## 這是否開箱即用？

是，安裝官方 ACP 執行階段外掛後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼 checkout 可在 `pnpm install` 後使用本機 `extensions/acpx` workspace 外掛。執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只有在 ACP **確實可用**時，才會教導代理產生 ACP：ACP 必須已啟用、dispatch 不得停用、目前工作階段不得被 sandbox 阻擋，且必須已載入執行階段後端。若不符合這些條件，ACP 外掛 Skills 與
`sessions_spawn` ACP 指引會保持隱藏，讓代理不會建議不可用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果設定了 `plugins.allow`，它就是限制性的外掛清單，且**必須**包含 `acpx`；否則已安裝的 ACP 後端會被刻意阻擋，且 `/acp doctor` 會回報缺少 allowlist 項目。
    - Codex ACP adapter 會隨 `acpx` 外掛一起 staged，並在可能時於本機啟動。
    - Codex ACP 會使用隔離的 `CODEX_HOME` 執行；OpenClaw 會從主機 Codex config 複製受信任的專案項目，以及安全的模型/供應商路由 config，而 auth、notifications 與 hooks 會留在主機 config 上。
    - 其他目標 harness adapter 可能仍會在你第一次使用時，依需求透過 `npx` 擷取。
    - 該 harness 的 vendor auth 仍必須存在於主機上。
    - 如果主機沒有 npm 或網路存取權，首次執行 adapter 擷取會失敗，直到 cache 預先暖機，或以其他方式安裝 adapter。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部 harness 程序。OpenClaw 擁有路由、背景任務狀態、遞送、綁定與政策；harness
    擁有其供應商登入、模型目錄、檔案系統行為與
    原生工具。

    在責怪 OpenClaw 之前，請確認：

    - `/acp doctor` 回報已啟用且健康的後端。
    - 設定該 allowlist 時，目標 id 允許於 `acp.allowedAgents`。
    - harness 命令可在 Gateway 主機上啟動。
    - 該 harness 的供應商 auth 已存在（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該 harness - 模型 id 無法跨 harness 攜帶使用。
    - 要求的 `cwd` 存在且可存取，或省略 `cwd` 並讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點擊原生權限提示，因此大量寫入/執行的編碼執行通常需要可無人值守繼續的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具與內建 OpenClaw 工具預設**不會**公開給
ACP harness。只有在 harness 應直接呼叫那些工具時，才啟用
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP bridge。

## 支援的 harness 目標

使用 `acpx` 後端時，請將這些 harness id 作為 `/acp spawn <id>`
或 `sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| Harness id | 典型後端                                | 備註                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Claude Code ACP adapter                        | 需要主機上的 Claude Code auth。                                              |
| `codex`    | Codex ACP adapter                              | 僅在原生 `/codex` 不可用或要求 ACP 時，作為明確 ACP 備援。 |
| `copilot`  | GitHub Copilot ACP adapter                     | 需要 Copilot 命令列介面/執行階段 auth。                                                  |
| `cursor`   | Cursor 命令列介面 ACP (`cursor-agent acp`)            | 如果本機安裝公開不同的 ACP entrypoint，請覆寫 acpx 命令。    |
| `droid`    | Factory Droid 命令列介面                              | 需要 harness 環境中的 Factory/Droid auth 或 `FACTORY_API_KEY`。        |
| `gemini`   | Gemini 命令列介面 ACP adapter                         | 需要 Gemini 命令列介面 auth 或 API key 設定。                                          |
| `iflow`    | iFlow 命令列介面                                      | Adapter 可用性與模型控制取決於已安裝的命令列介面。                 |
| `kilocode` | Kilo Code 命令列介面                                  | Adapter 可用性與模型控制取決於已安裝的命令列介面。                 |
| `kimi`     | Kimi/Moonshot 命令列介面                              | 需要主機上的 Kimi/Moonshot auth。                                            |
| `kiro`     | Kiro 命令列介面                                       | Adapter 可用性與模型控制取決於已安裝的命令列介面。                 |
| `opencode` | OpenCode ACP adapter                           | 需要 OpenCode 命令列介面/供應商 auth。                                                |
| `openclaw` | 透過 `openclaw acp` 的 OpenClaw Gateway bridge | 讓 ACP-aware harness 回連到 OpenClaw Gateway 工作階段。                 |
| `qwen`     | Qwen Code / Qwen 命令列介面                           | 需要主機上的 Qwen-compatible auth。                                          |

自訂 acpx agent alias 可在 acpx 本身設定，但 OpenClaw
policy 在 dispatch 前仍會檢查 `acp.allowedAgents` 以及任何
`agents.list[].runtime.acp.agent` 對應。

## 操作者 runbook

從聊天快速使用 `/acp` 流程：

<Steps>
  <Step title="產生">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`，或明確的
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在綁定的對話或 thread 中繼續（或明確指定工作階段
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
  <Step title="引導">
    不取代 context：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段 + 綁定）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - Spawn 會建立或恢復 ACP 執行階段工作階段，在 OpenClaw 工作階段儲存區記錄 ACP metadata，並可能在該執行屬於父項擁有時建立背景任務。
    - 父項擁有的 ACP 工作階段會被視為背景工作，即使執行階段工作階段是 persistent；完成與跨介面遞送會透過父任務 notifier，而不是像一般面向使用者的聊天工作階段那樣運作。
    - 任務維護會關閉 terminal 或孤立的父項擁有 one-shot ACP 工作階段。當仍存在作用中的對話綁定時，persistent ACP 工作階段會被保留；沒有作用中綁定的 stale persistent 工作階段會被關閉，避免在擁有任務完成或其任務記錄消失後被靜默恢復。
    - 已綁定的 follow-up 訊息會直接傳送到 ACP 工作階段，直到綁定被關閉、取消聚焦、重設或過期。
    - Gateway 命令會保持本機處理。`/acp ...`、`/status` 與 `/unfocus` 絕不會作為一般 prompt 文字傳送給已綁定的 ACP harness。
    - 後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除綁定或工作階段 metadata。
    - 從 OpenClaw 的角度，`close` 會結束 ACP 工作階段並移除綁定。如果 harness 支援 resume，它仍可能保留自己的上游歷程。
    - acpx 外掛會在 `close` 後清理 OpenClaw 擁有的 wrapper 與 adapter 程序樹，並在 Gateway 啟動期間回收 stale 的 OpenClaw 擁有 ACPX orphan。
    - 閒置執行階段 worker 在 `acp.runtime.ttlMinutes` 後符合清理資格；儲存的工作階段 metadata 仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    當啟用時，應路由至**原生 Codex
    外掛**的自然語言觸發：

    - 「將此 Discord channel 綁定到 Codex。」
    - 「將此聊天附加到 Codex thread `<id>`。」
    - 「顯示 Codex threads，然後綁定這一個。」

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而
    Codex 原生工具（例如 shell/apply-patch）則在 Codex 內執行。
    對於 Codex 原生工具事件，OpenClaw 會注入每回合的原生
    鉤子轉送，讓外掛鉤子可以阻擋 `before_tool_call`、觀察
    `after_tool_call`，並將 Codex `PermissionRequest` 事件
    透過 OpenClaw 核准流程路由。Codex `Stop` 鉤子會轉送到
    OpenClaw `before_agent_finalize`，外掛可在其中要求再進行一次
    模型傳遞，然後 Codex 才完成其回答。此轉送機制刻意保持保守：
    它不會變更 Codex 原生工具
    引數，也不會重寫 Codex 執行緒記錄。只有在需要 ACP 執行階段/工作階段模型時
    才使用明確的 ACP。嵌入式 Codex
    支援邊界記錄於
    [Codex harness v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型 / 提供者 / 執行階段選擇速查表">
    - 舊版 Codex 模型參照 - doctor 修復的舊版 Codex OAuth/訂閱模型路由。
    - `openai/*` - 用於 OpenAI 代理回合的原生 Codex 應用伺服器嵌入式執行階段。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發條件">
    應路由到 ACP 執行階段的觸發條件：

    - "將此作為一次性 Claude Code ACP 工作階段執行，並摘要結果。"
    - "在執行緒中使用 Gemini 命令列介面處理此工作，然後將後續追蹤保留在同一個執行緒中。"
    - "透過 ACP 在背景執行緒中執行 Codex。"

    OpenClaw 會選取 `runtime: "acp"`、解析執行框架 `agentId`、
    在支援時繫結到目前對話或執行緒，並
    將後續追蹤路由到該工作階段直到關閉/過期。只有在 ACP/acpx 明確指定，或請求操作的原生 Codex
    外掛不可用時，Codex 才會遵循此路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、請求者未受沙箱限制，且 ACP 執行階段
    後端已載入時，才會公告 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停自動
    ACP 執行緒分派，但不會隱藏或阻擋明確的
    `sessions_spawn({ runtime: "acp" })` 呼叫。它以 ACP 執行框架 ID 為目標，例如 `codex`、
    `claude`、`droid`、`gemini` 或 `opencode`。除非該項目
    已以 `agents.list[].runtime.type="acp"` 明確設定，
    否則不要傳入來自 `agents_list` 的一般
    OpenClaw 設定代理 ID；
    改用預設子代理執行階段。當 OpenClaw 代理
    設定為 `runtime.type="acp"` 時，OpenClaw 會使用
    `runtime.acp.agent` 作為底層執行框架 ID。

  </Accordion>
</AccordionGroup>

## ACP 與子代理

當你需要外部執行框架執行階段時，使用 ACP。當 `codex`
外掛已啟用，且你需要 Codex 對話繫結/控制時，使用 **原生 Codex
應用伺服器**。當你需要 OpenClaw 原生
委派執行時，使用 **子代理**。

| 範圍          | ACP 工作階段                           | 子代理執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端外掛（例如 acpx） | OpenClaw 原生子代理執行階段  |
| 工作階段鍵   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | 使用 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設執行階段） |

另請參閱 [子代理](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

對於透過 ACP 的 Claude Code，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段外掛。
3. Claude ACP 轉接器。
4. Claude 端執行階段/工作階段機制。

ACP Claude 是一個具有 ACP 控制、工作階段恢復、
背景工作追蹤，以及可選對話/執行緒繫結的 **執行框架工作階段**。

命令列介面後端是獨立的純文字本機備援執行階段 - 請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對於操作人員，實務規則是：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制或持久執行框架工作？** 使用 ACP。
- **需要透過原始命令列介面進行簡單本機文字備援？** 使用命令列介面後端。

## 已繫結工作階段

### 心智模型

- **聊天介面** - 人們持續對話的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** - OpenClaw 路由到的持久 Codex/Claude/Gemini 執行階段狀態。
- **子執行緒/主題** - 僅由 `--thread ...` 建立的可選額外訊息介面。
- **執行階段工作區** - 執行框架執行所在的檔案系統位置（`cwd`、repo checkout、後端工作區）。它與聊天介面相互獨立。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話釘選到
已產生的 ACP 工作階段 - 不建立子執行緒，使用相同聊天介面。OpenClaw 持續
掌管傳輸、驗證、安全與傳遞。該
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
  <Accordion title="繫結規則與互斥性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 只適用於公告目前對話繫結能力的頻道；否則 OpenClaw 會回傳清楚的不支援訊息。繫結會在閘道重新啟動後持續存在。
    - 在 Discord 上，`spawnSessions` 會控管 `--thread auto|here` 的子執行緒建立 - 不控管 `--bind here`。
    - 如果你在沒有 `--cwd` 的情況下產生到不同的 ACP 代理，OpenClaw 預設會繼承**目標代理的**工作區。缺少繼承路徑（`ENOENT`/`ENOTDIR`）時會退回後端預設值；其他存取錯誤（例如 `EACCES`）會顯示為產生錯誤。
    - 閘道管理命令在已繫結對話中仍保留本機處理 - 即使一般後續文字會路由到已繫結的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 和 `/unfocus` 也會保持本機處理。

  </Accordion>
  <Accordion title="執行緒繫結工作階段">
    當頻道轉接器啟用執行緒繫結時：

    - OpenClaw 會將執行緒繫結到目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由到已繫結的 ACP 工作階段。
    - ACP 輸出會傳回同一個執行緒。
    - 取消聚焦/關閉/封存/閒置逾時或最大存活時間過期會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是閘道命令，不是傳給 ACP 執行框架的提示。

    執行緒繫結 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設開啟（設為 `false` 可暫停自動 ACP 執行緒分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道轉接器執行緒工作階段產生（預設：`true`）：
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    執行緒繫結支援依轉接器而異。如果目前的頻道
    轉接器不支援執行緒繫結，OpenClaw 會回傳清楚的
    不支援/不可用訊息。

  </Accordion>
  <Accordion title="支援執行緒的頻道">
    - 任何公開工作階段/執行緒繫結能力的頻道轉接器。
    - 目前內建支援：**Discord** 執行緒/頻道、**Telegram** 主題（群組/超級群組中的論壇主題與 DM 主題）。
    - 外掛頻道可透過相同繫結介面新增支援。

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
  識別目標對話。各頻道形狀：

- **Discord 頻道/執行緒：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道/DM：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。建議使用穩定的 Slack ID；頻道繫結也會匹配該頻道執行緒中的回覆。
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp DM/群組：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 E.164 號碼，例如 `+15555550123`；群組請使用 WhatsApp 群組 JID，例如 `120363424282127706@g.us`。
- **iMessage DM/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。建議將 `chat_id:*` 用於穩定的群組繫結。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有此繫結的 OpenClaw 代理 ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  可選 ACP 覆寫。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  可選的操作人員可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  可選的執行階段工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  可選的後端覆寫。
</ParamField>

### 每個代理的執行階段預設值

使用 `agents.list[].runtime` 為每個代理定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（執行框架 ID，例如 `codex` 或 `claude`）
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
- 已設定的 ACP 繫結擁有其工作階段路由。通道廣播扇出不會取代相符繫結的已設定 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設相同的 ACP 工作階段金鑰。
- 暫時性執行階段繫結（例如由執行緒聚焦流程建立的繫結）在存在時仍會套用。
- 對於沒有明確 `cwd` 的跨代理 ACP 產生，OpenClaw 會從代理設定繼承目標代理工作區。
- 缺少繼承的工作區路徑會退回到後端預設 cwd；非缺少路徑造成的存取失敗會以產生錯誤呈現。

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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段請明確設定
    `runtime: "acp"`。如果省略 `agentId`，OpenClaw 會在已設定時使用
    `acp.defaultAgent`。`mode: "session"` 需要 `thread: true`，以保留持久繫結對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 指令">
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
  ACP 目標 harness ID。如果已設定，則退回使用 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援時請求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 是一次性；`"session"` 是持久性。如果 `thread: true` 且
  省略 `mode`，OpenClaw 可依執行階段路徑預設為持久行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端/執行階段政策驗證）。如果省略，ACP 產生會在已設定時繼承目標代理工作區；缺少繼承的路徑會退回到後端預設值，而實際存取錯誤會被回傳。
</ParamField>
<ParamField path="label" type="string">
  在工作階段/橫幅文字中使用、面向操作員的標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續既有 ACP 工作階段，而不是建立新的工作階段。代理會透過 `session/load` 重播其對話歷史。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回請求者工作階段。接受的回應包含
  `streamLogPath`，指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以 tail 以取得完整轉送歷史。
  父進度串流預設會顯示助理評論和 ACP 狀態進度，除非 `streaming.progress.commentary=false`。未設定串流模式時，Discord 也會預設將父預覽設為進度模式。狀態進度仍會遵守 `acp.stream.tagVisibility`，因此像 `plan` 這類標籤會維持隱藏，除非明確啟用。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds` 作為其預設子回合限制。此工具不接受每次呼叫的逾時覆寫。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 產生會在 `session/new` 之前，將 `openai/gpt-5.4` 等 OpenAI 參照正規化為 Codex ACP 啟動設定；`openai/gpt-5.4/high` 等斜線形式也會設定 Codex ACP reasoning effort。
  省略時，`sessions_spawn({ runtime: "acp" })` 會在已設定時使用既有子代理模型預設值（`agents.defaults.subagents.model` 或
  `agents.list[].subagents.model`）；否則讓 ACP harness 使用自己的預設模型。
  其他 harness 必須宣告 ACP `models` 並支援 `session/set_model`；否則 OpenClaw/acpx 會明確失敗，而不是靜默退回到目標代理預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的 thinking/reasoning effort。對 Codex ACP 而言，`minimal` 會對應到低 effort，`low`/`medium`/`high`/`xhigh` 會直接對應，而 `off` 會省略 reasoning-effort 啟動覆寫。
  省略時，ACP 產生會使用既有子代理 thinking 預設值，以及所選模型的個別模型
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 產生繫結與執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | 就地繫結目前作用中的對話；如果沒有作用中的對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    注意事項：

    - `--bind here` 是「讓此通道或聊天由 Codex 支援」最簡單的操作員路徑。
    - `--bind here` 不會建立子執行緒。
    - `--bind here` 僅適用於公開目前對話繫結支援的通道。
    - `--bind` 和 `--thread` 不能在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | 在作用中的執行緒內：繫結該執行緒。在執行緒外：在支援時建立/繫結子執行緒。 |
    | `here` | 要求目前有作用中的執行緒；如果不在執行緒中則失敗。                                                  |
    | `off`  | 不繫結。工作階段以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非執行緒繫結介面上，預設行為實際上是 `off`。
    - 執行緒繫結產生需要通道政策支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 當你想固定目前對話而不建立子執行緒時，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是父層擁有的背景工作。傳遞路徑取決於該形態。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段旨在持續於可見聊天介面上對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結到 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將通道執行緒/主題繫結到 ACP 工作階段。
    - 持久設定的 `bindings[].type="acp"` 會將相符對話路由到同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由到 ACP 工作階段，而 ACP 輸出會傳回同一個通道/執行緒/主題。

    OpenClaw 傳送給 harness 的內容：

    - 一般已繫結後續訊息會作為提示文字傳送；只有在 harness/後端支援時才會附加附件。
    - `/acp` 管理指令和本機 Gateway 指令會在 ACP 派送前被攔截。
    - 執行階段產生的完成事件會依目標具現化。OpenClaw 代理會取得 OpenClaw 的內部執行階段內容封套；外部 ACP harness 會取得包含子結果與指示的純提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封套絕不應傳送到外部 harness，或作為 ACP 使用者逐字稿文字持久化。
    - ACP 逐字稿項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料在可能時會在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="父層擁有的一次性 ACP 工作階段">
    由另一個代理執行產生的一次性 ACP 工作階段是背景子項，類似子代理：

    - 父層使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 請求工作。
    - 子項會在自己的 ACP harness 工作階段中執行。
    - 子回合會在原生子代理產生所使用的同一條背景通道上執行，因此緩慢的 ACP harness 不會阻塞不相關的主工作階段工作。
    - 完成會透過工作完成公告路徑回報。OpenClaw 會在傳送到外部 harness 前，將內部完成中繼資料轉換為純 ACP 提示，因此 harness 不會看到 OpenClaw 專用的執行階段內容標記。
    - 當適合回覆使用者時，父層會以一般助理語氣改寫子項結果。

    請**勿**將此路徑視為父層與子項之間的對等聊天。子項已經有完成通道可回到父層。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可在產生後以另一個工作階段為目標。對於一般對等工作階段，OpenClaw 會在注入訊息後使用代理對代理（A2A）的後續路徑：

    - 等待目標工作階段的回覆。
    - 選擇性讓請求者與目標交換有界數量的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞到可見的通道或執行緒。

    該 A2A 路徑是對等傳送的備援，適用於傳送者需要可見後續訊息的情況。當不相關的工作階段可以看到 ACP 目標並傳送訊息時，例如在寬鬆的
    `tools.sessions.visibility` 設定下，此路徑仍會啟用。

    只有當請求者是其自己由父層擁有的一次性 ACP 子項目的
    父層時，OpenClaw 才會略過 A2A 後續處理。在這種情況下，
    在任務完成之上執行 A2A 可能會用子項目的結果喚醒父層，
    將父層的回覆轉送回子項目，並建立父層/子項目的回音迴圈。
    `sessions_send` 結果會針對該擁有子項目的情況回報
    `delivery.status="skipped"`，因為完成路徑已負責處理結果。

  </Accordion>
  <Accordion title="恢復現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是
    重新開始。代理會透過 `session/load` 重播其對話歷史，
    因此會帶著先前內容的完整脈絡接續。

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
    - 繼續你先前在命令列介面中互動式啟動的編碼工作階段，現在透過你的代理以無頭模式執行。
    - 接續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `streamTo` 只在 `runtime: "acp"` 時適用；預設子代理執行階段會忽略這個僅限 ACP 的欄位。
    - `resumeSessionId` 是主機本機的 ACP/harness 恢復 id，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP 產生政策和目標代理政策，而 ACP 後端或 harness 負責載入該上游 id 的授權。
    - `resumeSessionId` 會恢復上游 ACP 對話歷史；`thread` 和 `mode` 仍會正常套用到你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理必須支援 `session/load`（Codex 和 Claude Code 支援）。
    - 如果找不到工作階段 id，產生會以清楚的錯誤失敗 - 不會靜默退回到新的工作階段。

  </Accordion>
  <Accordion title="部署後煙霧測試">
    閘道部署後，請執行即時端對端檢查，而不是
    信任單元測試：

    1. 驗證目標主機上已部署的閘道版本和提交。
    2. 開啟通往即時代理的臨時 ACPX 橋接工作階段。
    3. 要求該代理以 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 和任務 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理臨時橋接工作階段。

    將閘門保持在 `mode: "run"`，並略過 `streamTo: "parent"` -
    綁定執行緒的 `mode: "session"` 和串流轉送路徑屬於
    另外更完整的整合檢查。

  </Accordion>
</AccordionGroup>

## 沙盒相容性

ACP 工作階段目前在主機執行階段上執行，**不是**在
OpenClaw 沙盒內執行。

<Warning>
**安全邊界：**

- 外部 harness 可依其自身命令列介面權限和選取的 `cwd` 進行讀取/寫入。
- OpenClaw 的沙盒政策**不會**包覆 ACP harness 執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理、工作階段擁有權、頻道繫結，以及閘道傳遞政策。
- 使用 `runtime: "subagent"` 執行由沙盒強制保護的 OpenClaw 原生工作。

</Warning>

目前限制：

- 如果請求者工作階段位於沙盒中，ACP 產生會同時阻擋 `sessions_spawn({ runtime: "acp" })` 和 `/acp spawn`。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

多數 `/acp` 動作接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 嘗試金鑰
   - 接著嘗試 UUID 形狀的工作階段 id
   - 接著嘗試標籤
2. 目前執行緒繫結（如果此對話/執行緒已繫結到 ACP 工作階段）。
3. 目前請求者工作階段後備。

目前對話繫結和執行緒繫結都會參與
步驟 2。

如果無法解析任何目標，OpenClaw 會傳回清楚的錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 功能                                                      | 範例                                                          |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。          | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段中進行中的回合。                         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將導引指令傳送到執行中的工作階段。                       | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                       | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項、能力。               | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                         | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                                     | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                                 | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                           | `/acp reset-options`                                          |
| `/acp sessions`      | 從儲存區列出最近的 ACP 工作階段。                        | `/acp sessions`                                               |
| `/acp doctor`        | 後端健康狀態、能力、可執行修正。                         | `/acp doctor`                                                 |
| `/acp install`       | 列印確定性的安裝與啟用步驟。                             | `/acp install`                                                |

執行階段控制項（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 和 `reset-options`）需要
來自外部頻道的擁有者身分，以及來自內部閘道
用戶端的 `operator.admin`。已授權的非擁有者傳送者仍可使用 `sessions`、`doctor`、
`install` 和 `help`。

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級和
後端層級的工作階段識別碼。當後端缺少能力時，不支援控制項錯誤會
清楚顯示。`/acp sessions` 會讀取目前已繫結或請求者工作階段的
儲存區；目標權杖
（`session-key`、`session-id` 或 `session-label`）會透過
閘道工作階段探索解析，包括自訂的每代理 `session.store`
根目錄。

### 執行階段選項對應

`/acp` 有便利命令和通用設定器。等效
操作：

| 命令                         | 對應到                               | 注意事項                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 執行階段設定鍵 `model`               | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為介面卡模型 id，並將斜線推理後綴（例如 `openai/gpt-5.4/high`）對應到 `reasoning_effort`。                                                            |
| `/acp set thinking <level>`  | 正規選項 `thinking`                  | OpenClaw 會在存在時傳送後端宣告的等效項，優先順序為 `thinking`，接著是 `effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，介面卡會將值對應到 `reasoning_effort`。 |
| `/acp permissions <profile>` | 正規選項 `permissionProfile`         | OpenClaw 會在存在時傳送後端宣告的等效項，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                                                |
| `/acp timeout <seconds>`     | 正規選項 `timeoutSeconds`            | OpenClaw 會在存在時傳送後端宣告的等效項，例如 `timeout` 或 `timeout_seconds`。                                                                                                                            |
| `/acp cwd <path>`            | 執行階段 cwd 覆寫                    | 直接更新。                                                                                                                                                                                                 |
| `/acp set <key> <value>`     | 通用                                 | `key=cwd` 使用 cwd 覆寫路徑。                                                                                                                                                                             |
| `/acp reset-options`         | 清除所有執行階段覆寫                 | -                                                                                                                                                                                                          |

## acpx harness、外掛設定和權限

如需 acpx harness 設定（Claude Code / Codex / Gemini CLI
別名）、plugin-tools 和 OpenClaw-tools MCP 橋接，以及 ACP
權限模式，請參閱
[ACP 代理 - 設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                        | 可能原因                                                                                                               | 修正                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | 後端外掛遺失、已停用，或遭 `plugins.allow` 封鎖。                                                                       | 安裝並啟用後端外掛；若已設定該允許清單，請在 `plugins.allow` 中包含 `acpx`，然後執行 `/acp doctor`。                                                                     |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP 已全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                 |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | 已停用從一般執行緒訊息進行的自動分派。                                                                                 | 設定 `acp.dispatch.enabled=true` 以恢復自動執行緒路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                        |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent 不在允許清單中。                                                                                                 | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                        |
| `/acp doctor` reports backend not ready right after startup                 | 後端外掛遺失、已停用、遭允許/拒絕原則封鎖，或其設定的可執行檔無法使用。                                                | 安裝/啟用後端外掛，重新執行 `/acp doctor`；若仍維持不健康狀態，請檢查後端安裝或原則錯誤。                                                                                |
| Harness command not found                                                   | Adapter 命令列介面尚未安裝、外部外掛遺失，或非 Codex Adapter 的首次執行 `npx` 擷取失敗。                               | 執行 `/acp doctor`，在閘道主機上安裝/預熱 Adapter，或明確設定 acpx Agent 命令。                                                                                          |
| Model-not-found from the harness                                            | 模型 ID 對另一個提供者/Harness 有效，但不適用於此 ACP 目標。                                                           | 使用該 Harness 列出的模型、在 Harness 中設定模型，或省略覆寫。                                                                                                           |
| Vendor auth error from the harness                                          | OpenClaw 狀態正常，但目標命令列介面/提供者尚未登入。                                                                   | 在閘道主機環境中登入或提供必要的提供者金鑰。                                                                                                                            |
| `Unable to resolve session target: ...`                                     | 錯誤的鍵/ID/標籤 Token。                                                                                               | 執行 `/acp sessions`、複製精確的鍵/標籤，然後重試。                                                                                                                      |
| `--bind here requires running /acp spawn inside an active ... conversation` | 在沒有作用中可繫結對話的情況下使用 `--bind here`。                                                                     | 移至目標聊天/頻道後重試，或使用未繫結的 spawn。                                                                                                                          |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter 缺少目前對話的 ACP 繫結能力。                                                                                  | 在支援處使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | 在執行緒情境外使用 `--thread here`。                                                                                   | 移至目標執行緒，或使用 `--thread auto`/`off`。                                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | 另一位使用者擁有作用中的繫結目標。                                                                                     | 以擁有者身分重新繫結，或使用不同的對話或執行緒。                                                                                                                        |
| `Thread bindings are unavailable for <channel>.`                            | Adapter 缺少執行緒繫結能力。                                                                                          | 使用 `--thread off`，或移至支援的 Adapter/頻道。                                                                                                                         |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime 位於主機端；請求者 session 處於沙盒中。                                                                    | 從沙盒 session 使用 `runtime="subagent"`，或從非沙盒 session 執行 ACP spawn。                                                                                             |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | 針對 ACP runtime 要求了 `sandbox="require"`。                                                                           | 若需要強制沙盒，請使用 `runtime="subagent"`；或從非沙盒 session 使用 ACP 搭配 `sandbox="inherit"`。                                                                       |
| `Cannot apply --model ... did not advertise model support`                  | 目標 Harness 未公開通用 ACP 模型切換。                                                                                 | 使用宣告 ACP `models`/`session/set_model` 的 Harness、使用 Codex ACP 模型參照，或若 Harness 有自己的啟動旗標，直接在 Harness 中設定模型。                                |
| Missing ACP metadata for bound session                                      | 過時/已刪除的 ACP session metadata。                                                                                   | 使用 `/acp spawn` 重新建立，然後重新繫結/聚焦執行緒。                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` 在非互動式 ACP session 中阻擋寫入/執行。                                                              | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all` 並重新啟動閘道。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。                  |
| ACP session fails early with little output                                  | 權限提示遭 `permissionMode`/`nonInteractivePermissions` 阻擋。                                                         | 檢查閘道記錄中的 `AcpRuntimeError`。若要完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。                          |
| ACP session stalls indefinitely after completing work                       | Harness 處理程序已完成，但 ACP session 未回報完成。                                                                    | 更新 OpenClaw；目前的 acpx 清理機制會在關閉與閘道啟動時，清除 OpenClaw 擁有的過時 wrapper 與 Adapter 處理程序。                                                         |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | 內部事件 envelope 洩漏到 ACP 邊界之外。                                                                                | 更新 OpenClaw 並重新執行完成流程；外部 Harness 應只收到純文字完成提示。                                                                                                  |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex hook relay，而不是 ACP/acpx。在已繫結的 Codex 聊天中，使用 `/new`
或 `/reset` 開始新的 session；如果它成功一次，接著在下一次原生工具呼叫時又返回，
請重新啟動 Codex app-server 或 OpenClaw 閘道，而不是重複執行 `/new`。請參閱 [Codex Harness 疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
</Note>

## 相關

- [ACP Agents - 設定](/zh-TW/tools/acp-agents-setup)
- [Agent 傳送](/zh-TW/tools/agent-send)
- [命令列介面後端](/zh-TW/gateway/cli-backends)
- [Codex Harness](/zh-TW/plugins/codex-harness)
- [Codex Harness runtime](/zh-TW/plugins/codex-harness-runtime)
- [多 Agent 沙盒工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [Sub-agents](/zh-TW/tools/subagents)
