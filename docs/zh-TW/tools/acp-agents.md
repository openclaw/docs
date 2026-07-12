---
read_when:
    - 透過 ACP 執行程式設計工具框架
    - 在訊息頻道上設定綁定對話的 ACP 工作階段
    - 將訊息頻道對話綁定至持久化 ACP 工作階段
    - 疑難排解 ACP 後端、外掛連接或完成結果傳遞問題
    - 從聊天中操作 `/acp` 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式設計工具（Claude Code、Cursor、Gemini 命令列介面、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-07-11T21:49:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[代理程式用戶端協定（ACP）](https://agentclientprotocol.com/) 工作階段可讓
OpenClaw 透過 ACP 後端外掛執行外部程式設計執行框架（Claude Code、Cursor、Copilot、Droid、
OpenClaw ACP、OpenCode、Gemini CLI，以及其他支援的 ACPX 執行框架）。
每次建立都會追蹤為一項[背景任務](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部執行框架路徑，而不是預設的 Codex 路徑。** 原生
Codex 應用程式伺服器外掛負責 `/codex ...` 控制項，以及代理程式回合預設使用的
`openai/gpt-*` 嵌入式執行階段；ACP 則負責 `/acp ...` 控制項
和 `sessions_spawn({ runtime: "acp" })` 工作階段。

若要讓 Codex 或 Claude Code 以外部 MCP 用戶端身分直接連線至
現有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而非 ACP。
</Note>

## 我該查看哪個頁面？

| 您想要……                                                                                       | 請使用                                | 備註                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                   | `/codex bind`、`/codex threads`       | 啟用 `codex` 外掛時使用原生 Codex 應用程式伺服器路徑：繫結的聊天回覆、圖片轉送、模型／快速模式／權限、停止與引導。ACP 是明確指定的備援方案 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確指定的 Codex ACP 或其他外部執行框架             | 本頁                                  | 聊天繫結工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行階段控制項                                                                                |
| 將 OpenClaw 閘道工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                                 | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式：IDE／用戶端透過標準輸入輸出或 WebSocket，使用 ACP 與 OpenClaw 通訊                                                                                                 |
| 重複使用本機 AI 命令列介面作為純文字備援模型                                                   | [命令列介面後端](/zh-TW/gateway/cli-backends) | 並非 ACP：沒有 OpenClaw 工具、ACP 控制項或執行框架執行階段                                                                                                                  |

## 是否可以直接使用？

可以，安裝官方 ACP 執行階段外掛後即可：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼簽出版本可在執行 `pnpm install` 後，使用本機 `extensions/acpx`
工作區外掛。執行 `/acp doctor` 以檢查就緒狀態。

只有在 ACP **確實可用**時，OpenClaw 才會向代理程式說明如何建立 ACP：
ACP 必須已啟用、分派不得停用、目前工作階段不得遭沙箱封鎖，且必須已載入
健康的執行階段後端。若有任何條件不成立，ACP Skills 與 `sessions_spawn`
的 ACP 指引會保持隱藏，避免代理程式建議無法使用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 如果已設定 `plugins.allow`，它就是限制性的外掛清單，且**必須**包含 `acpx`，否則已安裝的 ACP 後端會被刻意封鎖（`/acp doctor` 會回報允許清單中缺少該項目）。
    - Codex ACP 轉接器隨 `acpx` 外掛提供，並會在可行時於本機啟動。
    - Codex ACP 使用隔離的 `CODEX_HOME` 執行。OpenClaw 會從主機 Codex 設定複製受信任的專案信任項目，以及安全的模型／供應商路由設定（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode` 和安全的 `model_providers.<name>` 欄位）；驗證、通知與掛鉤則只保留在主機設定中。
    - 其他目標執行框架的轉接器可能會在首次使用時透過 `npx` 隨需擷取。
    - 該執行框架所需的供應商驗證必須已存在於主機上。
    - 如果主機無法使用 npm 或存取網路，首次執行時擷取轉接器會失敗，直到預先準備好快取或以其他方式安裝轉接器為止。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動實際的外部執行框架程序。OpenClaw 負責路由、
    背景任務狀態、傳遞、繫結與政策；執行框架則負責其
    供應商登入、模型目錄、檔案系統行為和原生工具。

    在判定問題出在 OpenClaw 前，請先確認：

    - `/acp doctor` 回報後端已啟用且狀態正常。
    - 設定 `acp.allowedAgents` 允許清單時，其中允許目標 ID。
    - 執行框架命令可在閘道主機上啟動。
    - 該執行框架已有供應商驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 所選模型存在於該執行框架中——模型 ID 無法跨執行框架通用。
    - 要求的 `cwd` 存在且可供存取；或者省略 `cwd`，讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此大量涉及寫入／執行的程式設計作業通常需要可在無人值守狀態下繼續執行的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具和內建 OpenClaw 工具預設**不會**提供給 ACP
執行框架。只有當執行框架應直接呼叫這些工具時，才在
[ACP 代理程式－設定](/zh-TW/tools/acp-agents-setup)中啟用明確的 MCP 橋接器。

## 支援的執行框架目標

使用 `acpx` 後端時，可將下列 ID 作為 `/acp spawn <id>` 或
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 的目標：

| 執行框架 ID | 一般後端                                       | 備註                                                                                         |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP 轉接器                         | 需要主機上已有 Claude Code 驗證。                                                            |
| `codex`      | Codex ACP 轉接器                               | 僅限原生 `/codex` 無法使用或明確要求 ACP 時，作為 ACP 備援方案。                              |
| `copilot`    | GitHub Copilot ACP 轉接器                      | 需要 Copilot 命令列介面／執行階段驗證。                                                      |
| `cursor`     | Cursor CLI ACP（`cursor-agent acp`）           | 如果本機安裝提供不同的 ACP 進入點，請覆寫 acpx 命令。                                        |
| `droid`      | Factory Droid CLI                              | 需要 Factory／Droid 驗證，或在執行框架環境中設定 `FACTORY_API_KEY`。                         |
| `fast-agent` | fast-agent-mcp ACP 轉接器                      | 使用 `uvx` 隨需擷取。                                                                        |
| `gemini`     | Gemini CLI ACP 轉接器                          | 需要 Gemini CLI 驗證或 API 金鑰設定。                                                        |
| `iflow`      | iFlow CLI                                      | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                             |
| `kilocode`   | Kilo Code CLI                                  | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                             |
| `kimi`       | Kimi/Moonshot CLI                              | 需要主機上已有 Kimi／Moonshot 驗證。                                                         |
| `kiro`       | Kiro CLI                                       | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                             |
| `mux`        | Mux CLI ACP 轉接器                             | 使用 `npx` 隨需擷取。                                                                        |
| `opencode`   | OpenCode ACP 轉接器                            | 需要 OpenCode 命令列介面／供應商驗證。                                                       |
| `openclaw`   | 透過 `openclaw acp` 的 OpenClaw 閘道橋接器     | 讓支援 ACP 的執行框架與 OpenClaw 閘道工作階段通訊。                                          |
| `qoder`      | Qoder CLI                                      | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                             |
| `qwen`       | Qwen Code／Qwen CLI                            | 需要主機上已有與 Qwen 相容的驗證。                                                           |
| `trae`       | Trae CLI ACP 轉接器                            | 轉接器可用性與模型控制取決於已安裝的命令列介面。                                             |

`pi`（pi-acp）也已在 acpx 後端中註冊，但與上述其他項目不同，
它並不是相同意義下的程式設計執行框架。

可在 acpx 本身設定自訂的 acpx 代理程式別名，但 OpenClaw
政策仍會在分派前檢查 `acp.allowedAgents`，以及任何
`agents.list[].runtime.acp.agent` 對應。

## 操作人員執行手冊

從聊天快速執行 `/acp` 的流程：

<Steps>
  <Step title="建立">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或明確指定
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="執行工作">
    在已繫結的對話或討論串中繼續操作（或明確指定工作階段金鑰）。
  </Step>
  <Step title="檢查狀態">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`、`/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引導">
    不取代現有上下文：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段與繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 建立作業會建立或恢復 ACP 執行階段工作階段、在 OpenClaw 工作階段儲存區記錄 ACP 中繼資料，並可能在執行由父項擁有時建立背景任務。
    - 即使執行階段工作階段是持久的，由父項擁有的 ACP 工作階段仍會視為背景工作；完成通知與跨介面傳遞會透過父項任務通知器進行，而不會像一般面向使用者的聊天工作階段般運作。
    - 任務維護會關閉已終止或已成為孤立項目、由父項擁有的一次性 ACP 工作階段。只要仍有作用中的對話繫結，就會保留持久 ACP 工作階段；若過時的持久工作階段沒有作用中繫結，則會將其關閉，避免在所屬任務完成或其任務記錄消失後遭到無聲恢復。
    - 已繫結的後續訊息會直接傳送至 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或過期。
    - 閘道命令會保留在本機處理。`/acp ...`、`/status` 和 `/unfocus` 絕不會作為一般提示文字傳送至已繫結的 ACP 執行框架。
    - 後端支援取消時，`cancel` 會中止作用中的回合；它不會刪除繫結或工作階段中繼資料。
    - 從 OpenClaw 的角度來看，`close` 會結束 ACP 工作階段並移除繫結。如果執行框架支援恢復，它仍可能保留自己的上游歷程記錄。
    - `close` 後，acpx 外掛會清理由 OpenClaw 擁有的包裝器和轉接器程序樹，並在閘道啟動期間回收過時且由 OpenClaw 擁有的 ACPX 孤立程序。
    - 閒置執行階段工作程序會在 `acp.runtime.ttlMinutes` 後符合清理資格；已儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    啟用**原生 Codex 外掛**時，應路由至該外掛的自然語言觸發語句：

    - 「將此 Discord 頻道繫結至 Codex。」
    - 「將此聊天附加至 Codex 討論串 `<id>`。」
    - 「顯示 Codex 討論串，然後繫結這一個。」

    原生 Codex 對話綁定是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而 Codex 原生
    工具（例如 shell/apply-patch）則在 Codex 內執行。對於 Codex 原生
    工具事件，OpenClaw 會為每輪注入原生掛鉤轉送器，讓外掛掛鉤
    可以阻擋 `before_tool_call`、觀察 `after_tool_call`，並透過 OpenClaw
    核准流程路由 Codex `PermissionRequest` 事件。Codex `Stop` 掛鉤
    會轉送至 OpenClaw `before_agent_finalize`，外掛可在該處要求
    Codex 完成回答前再執行一次模型處理。此轉送器刻意採取
    保守策略：不會修改 Codex 原生工具引數，也不會重寫 Codex 執行緒記錄。
    只有在需要 ACP 執行階段／工作階段模型時，才使用明確的 ACP。
    內嵌 Codex 的支援邊界記載於
    [Codex 控制框架 v1 支援契約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型／提供者／執行階段選擇速查表">
    - 舊版 Codex 模型參照——由 doctor 修復的舊版 Codex OAuth／訂閱模型路由。
    - `openai/*`——用於 OpenAI 代理程式輪次的原生 Codex app-server 內嵌執行階段。
    - `/codex ...`——原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"`——明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由的自然語言觸發語句">
    應路由至 ACP 執行階段的觸發語句：

    - 「將此作為一次性的 Claude Code ACP 工作階段執行，並摘要結果。」
    - 「在執行緒中使用 Gemini CLI 執行此工作，然後讓後續訊息維持在同一執行緒中。」
    - 「透過 ACP 在背景執行緒中執行 Codex。」

    OpenClaw 會選擇 `runtime: "acp"`、解析控制框架的 `agentId`，在支援時綁定至
    目前的對話或執行緒，並將後續訊息路由至
    該工作階段，直到關閉或到期。只有明確指定
    ACP/acpx，或原生 Codex 外掛無法執行所要求的操作時，
    Codex 才會採用此路徑。

    對於 `sessions_spawn`，只有在 ACP 已啟用、請求者未受沙箱限制，且已載入
    ACP 執行階段後端時，才會公開 `runtime: "acp"`。
    `acp.dispatch.enabled=false` 會暫停自動 ACP 執行緒分派，
    但不會隱藏或阻擋明確的 `sessions_spawn({ runtime: "acp" })`
    呼叫。它以 `codex`、`claude`、`droid`、
    `gemini` 或 `opencode` 等 ACP 控制框架 ID 為目標。除非
    `agents_list` 中的項目已明確設定
    `agents.list[].runtime.type="acp"`，否則請勿傳入一般的 OpenClaw 設定代理程式 ID；
    應改用預設子代理程式執行階段。當 OpenClaw 代理程式設定為
    `runtime.type="acp"` 時，OpenClaw 會使用 `runtime.acp.agent` 作為底層
    控制框架 ID。

  </Accordion>
</AccordionGroup>

## ACP 與子代理程式的比較

需要外部控制框架執行階段時，請使用 ACP。啟用 `codex` 外掛時，
若要進行 Codex 對話綁定／控制，請使用**原生 Codex
app-server**。需要 OpenClaw 原生委派執行時，請使用**子代理程式**。

| 領域          | ACP 工作階段                           | 子代理程式執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端外掛（例如 acpx） | OpenClaw 原生子代理程式執行階段  |
| 工作階段鍵值   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | 帶有 `runtime:"acp"` 的 `sessions_spawn` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理程式](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 執行 Claude Code 時，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段外掛。
3. Claude ACP 轉接器。
4. Claude 端的執行階段／工作階段機制。

ACP Claude 是具備 ACP 控制、工作階段續接、
背景工作追蹤，以及選用對話／執行緒綁定的**控制框架工作階段**。

命令列介面後端是獨立的純文字本機備援執行階段——請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對操作人員而言，實務準則如下：

- **需要 `/acp spawn`、可綁定的工作階段、執行階段控制或持久化的控制框架工作嗎？**請使用 ACP。
- **需要透過原始命令列介面進行簡單的本機文字備援嗎？**請使用命令列介面後端。

## 已綁定的工作階段

### 心智模型

- **聊天介面**——人們持續交談的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段**——OpenClaw 路由至的持久 Codex／Claude／Gemini 執行階段狀態。
- **子執行緒／主題**——僅由 `--thread ...` 建立的選用額外訊息介面。
- **執行階段工作區**——控制框架執行所在的檔案系統位置（`cwd`、儲存庫簽出、後端工作區）。與聊天介面彼此獨立。

### 目前對話綁定

`/acp spawn <harness> --bind here` 會將目前對話固定至
新產生的 ACP 工作階段——不建立子執行緒，並使用相同的聊天介面。OpenClaw 持續
負責傳輸、驗證、安全性與遞送。該
對話中的後續訊息會路由至同一工作階段；`/new` 與 `/reset` 會就地重設工作階段；
`/acp close` 則移除綁定。

範例：

```text
/codex bind                                              # 原生 Codex 綁定，將未來訊息路由至此處
/codex model gpt-5.4                                     # 調整已綁定的原生 Codex 執行緒
/codex stop                                              # 控制作用中的原生 Codex 輪次
/acp spawn codex --bind here                             # Codex 的明確 ACP 備援
/acp spawn codex --thread auto                           # 可能建立子執行緒／主題並在其中綁定
/acp spawn codex --bind here --cwd /workspace/repo       # 相同的聊天綁定，Codex 在 /workspace/repo 中執行
```

<AccordionGroup>
  <Accordion title="綁定規則與互斥性">
    - `--bind here` 與 `--thread ...` 互斥。
    - `--bind here` 僅適用於宣告支援目前對話綁定的頻道；否則 OpenClaw 會傳回清楚的不支援訊息。綁定會在閘道重新啟動後持續保留。
    - 在 Discord 上，`spawnSessions` 僅管控 `--thread auto|here` 的子執行緒建立，不影響 `--bind here`。
    - 如果未指定 `--cwd` 而產生至不同的 ACP 代理程式，OpenClaw 預設會繼承**目標代理程式的**工作區。繼承路徑不存在（`ENOENT`／`ENOTDIR`）時，會退回後端預設值；其他存取錯誤（例如 `EACCES`）則會顯示為產生錯誤。
    - 在已綁定的對話中，閘道管理命令仍由本機處理——即使一般後續文字會路由至已綁定的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 與 `/unfocus` 也一律由本機處理。

  </Accordion>
  <Accordion title="執行緒綁定的工作階段">
    頻道轉接器啟用執行緒綁定時：

    - OpenClaw 會將執行緒綁定至目標 ACP 工作階段。
    - 該執行緒中的後續訊息會路由至已綁定的 ACP 工作階段。
    - ACP 輸出會遞送回同一執行緒。
    - 取消聚焦／關閉／封存／閒置逾時或最長存續期到期時，會移除綁定。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 與 `/unfocus` 是閘道命令，而非傳送給 ACP 控制框架的提示詞。

    執行緒綁定 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（設為 `false` 可暫停自動 ACP 執行緒分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 啟用頻道轉接器的執行緒工作階段產生功能（預設：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    執行緒綁定支援取決於轉接器。如果作用中的頻道轉接器
    不支援執行緒綁定，OpenClaw 會傳回清楚的
    不支援／無法使用訊息。

  </Accordion>
  <Accordion title="支援執行緒的頻道">
    - 任何公開工作階段／執行緒綁定功能的頻道轉接器。
    - 目前內建支援：**Discord** 執行緒／頻道、**Telegram** 主題（群組／超級群組中的論壇主題與私訊主題）。
    - 外掛頻道可透過相同的綁定介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久頻道綁定

對於非暫時性工作流程，請在頂層
`bindings[]` 項目中設定持久 ACP 綁定。

### 綁定模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話綁定。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道的格式如下：

- **Discord 頻道／執行緒：**`match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道／私訊：**`match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。建議使用穩定的 Slack ID；頻道綁定也會比對該頻道執行緒內的回覆。
- **Telegram 論壇主題：**`match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp 私訊／群組：**`match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 `+15555550123` 之類的 E.164 號碼，群組則使用 `120363424282127706@g.us` 之類的 WhatsApp 群組 JID。
- **iMessage 私訊／群組：**`match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。若要取得穩定的群組綁定，建議使用 `chat_id:*`。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  擁有此綁定的 OpenClaw 代理程式 ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用的 ACP 覆寫值。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的操作人員可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用的執行階段工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用的後端覆寫值。
</ParamField>

### 每個代理程式的執行階段預設值

使用 `agents.list[].runtime` 為每個代理程式定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（控制框架 ID，例如 `codex` 或 `claude`）
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**ACP 綁定工作階段的覆寫優先順序：**

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

- OpenClaw 會在通過特定頻道的准入檢查後、使用前，確保已設定的 ACP 工作階段存在。
- 該頻道、主題或聊天中的訊息會路由至已設定的 ACP 工作階段。
- 已設定的 ACP 繫結擁有其工作階段路由。對於符合的繫結，頻道廣播的扇出不會取代已設定的 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段鍵。
- 暫時性執行階段繫結（例如由執行緒聚焦流程建立的繫結）在存在時仍會套用。
- 對於未明確指定 `cwd` 的跨代理程式 ACP 產生作業，OpenClaw 會從代理程式設定繼承目標代理程式工作區。
- 若繼承的工作區路徑不存在，則回退至後端的預設 cwd；若路徑存在但存取失敗，則顯示為產生錯誤。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

<Tabs>
  <Tab title="從 sessions_spawn">
    使用 `runtime: "acp"`，從代理程式回合或工具呼叫啟動 ACP 工作階段。

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
    `runtime: "acp"`。若省略 `agentId`，且已設定 `acp.defaultAgent`，
    OpenClaw 會使用該設定。`mode: "session"` 需要 `thread: true`，
    才能保留持續性的繫結對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 命令">
    使用 `/acp spawn`，從聊天中進行明確的操作員控制。

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
  傳送至 ACP 工作階段的初始提示。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須設為 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標執行框架識別碼。若已設定 `acp.defaultAgent`，則回退使用該值。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的情況下請求執行緒繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 為單次執行；`"session"` 為持續性工作階段。若設定 `thread: true`
  且省略 `mode`，OpenClaw 可能會依執行階段路徑預設使用持續性行為。
  `mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端／執行階段原則驗證）。
  若省略，ACP 產生作業會在已設定時繼承目標代理程式工作區；
  若繼承的路徑不存在，則回退至後端預設值，而實際的存取錯誤則會回傳。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段／橫幅文字、供操作員查看的標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  恢復現有 ACP 工作階段，而非建立新工作階段。代理程式會透過
  `session/load` 重播其對話歷程。需要 `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要作為系統事件串流回請求者工作階段。
  接受的回應包括 `streamLogPath`，其指向工作階段範圍的 JSONL 記錄
  (`<sessionId>.acp-stream.jsonl`)，你可以追蹤該檔案以取得完整的轉送歷程。
  除非設定 `streaming.progress.commentary=false`，否則父工作階段進度串流
  預設會顯示助理評論與 ACP 狀態進度。若未設定串流模式，Discord 的父工作階段
  預覽也預設使用進度模式。狀態進度仍會遵循 `acp.stream.tagVisibility`，
  因此除非明確啟用，否則 `plan` 等標籤會保持隱藏。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds`
作為其預設子回合限制。此工具不接受單次呼叫的逾時覆寫
（`runTimeoutSeconds`／`timeoutSeconds` 會因應設定預設值錯誤而遭拒）。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫。Codex ACP 產生作業會在 `session/new`
  之前，將 `openai/gpt-5.4` 等 OpenAI 參照正規化為 Codex ACP 啟動設定；
  `openai/gpt-5.4/high` 等斜線形式也會設定 Codex ACP 推理強度。
  若省略，`sessions_spawn({ runtime: "acp" })` 會在已設定時使用現有的
  子代理程式模型預設值（`agents.defaults.subagents.model` 或
  `agents.list[].subagents.model`）；否則讓 ACP 執行框架使用其自身的預設模型。
  其他執行框架必須宣告 ACP `models` 並支援 `session/set_model`；
  否則 OpenClaw／acpx 會明確失敗，而不會默默回退至目標代理程式的預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考／推理強度。對 Codex ACP 而言，`minimal` 對應低強度，
  `low`／`medium`／`high`／`xhigh` 會直接對應，而 `off` 會省略
  推理強度啟動覆寫。若省略，ACP 產生作業會針對所選模型使用現有的
  子代理程式思考預設值，以及各模型的
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 產生作業的繫結與執行緒模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                            |
    | ------ | --------------------------------------------------------------- |
    | `here` | 就地繫結目前作用中的對話；若沒有作用中的對話則失敗。            |
    | `off`  | 不建立目前對話繫結。                                            |

    注意事項：

    - `--bind here` 是「讓此頻道或聊天由 Codex 支援」最簡單的操作員路徑。
    - `--bind here` 不會建立子執行緒。
    - `--bind here` 僅適用於提供目前對話繫結支援的頻道。
    - 同一次 `/acp spawn` 呼叫中不能同時使用 `--bind` 和 `--thread`。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                             |
    | ------ | ------------------------------------------------------------------------------------------------ |
    | `auto` | 位於作用中的執行緒時：繫結該執行緒。位於執行緒外時：在支援的情況下建立／繫結子執行緒。          |
    | `here` | 要求目前有作用中的執行緒；若不在執行緒中則失敗。                                                 |
    | `off`  | 不繫結。工作階段以未繫結狀態啟動。                                                               |

    注意事項：

    - 在非執行緒繫結介面上，預設行為實際上等同於 `off`。
    - 執行緒繫結的產生作業需要頻道原則支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 若要固定目前對話而不建立子執行緒，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是由父工作階段擁有的背景工作。
傳遞路徑取決於其形式。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段用於在可見的聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結至 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道執行緒／主題繫結至 ACP 工作階段。
    - 持續設定的 `bindings[].type="acp"` 會將符合的對話路由至同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由至 ACP 工作階段，而 ACP 輸出會傳回
    同一個頻道／執行緒／主題。

    OpenClaw 傳送至執行框架的內容：

    - 一般的已繫結後續訊息會以提示文字傳送；只有在執行框架／後端支援時才會一併傳送附件。
    - `/acp` 管理命令和本機閘道命令會在分派至 ACP 前遭到攔截。
    - 執行階段產生的完成事件會依各目標具體化。OpenClaw 代理程式會取得 OpenClaw 的內部執行階段情境封裝；外部 ACP 執行框架則會取得包含子工作結果與指示的純文字提示。原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封裝絕不可傳送至外部執行框架，也不可作為 ACP 使用者逐字稿文字保存。
    - ACP 逐字稿項目會使用使用者可見的觸發文字或純文字完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會被視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="由父工作階段擁有的單次 ACP 工作階段">
    由另一個代理程式執行所產生的單次 ACP 工作階段是背景子工作，
    類似於子代理程式：

    - 父工作階段透過 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求執行工作。
    - 子工作階段會在其自身的 ACP 執行框架工作階段中執行。
    - 子回合會在原生子代理程式產生作業所使用的同一背景通道上執行，因此緩慢的 ACP 執行框架不會封鎖不相關的主要工作階段工作。
    - 完成結果會透過工作完成公告路徑回報。OpenClaw 會先將內部完成中繼資料轉換為純文字 ACP 提示，再傳送至外部執行框架，因此執行框架不會看到僅供 OpenClaw 使用的執行階段情境標記。
    - 當需要面向使用者的回覆時，父工作階段會以一般助理語氣改寫子工作結果。

    **請勿**將此路徑視為父工作階段與子工作階段之間的點對點聊天。
    子工作階段已經有可回報至父工作階段的完成通道。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可在產生後以另一個工作階段為目標。對於一般對等
    工作階段，OpenClaw 會在注入訊息後使用代理程式對代理程式（A2A）
    的後續訊息路徑：

    - 等待目標工作階段的回覆。
    - 可選擇讓請求者與目標交換有限次數的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞至可見的頻道或執行緒。

    該 A2A 路徑是在傳送者需要可見後續回應的對等傳送中使用的備援機制。當不相關的工作階段可以看見 ACP 目標並向其傳送訊息時（例如在寬鬆的 `tools.sessions.visibility` 設定下），此路徑仍會啟用。

    OpenClaw 只有在請求者是其自行擁有、由父工作階段管理的一次性 ACP 子工作階段之父工作階段時，才會略過 A2A 後續回應。在這種情況下，於任務完成流程之外再執行 A2A，可能會用子工作階段的結果喚醒父工作階段、將父工作階段的回覆轉送回子工作階段，並形成父子工作階段的回音迴圈。對於此類自有子工作階段，`sessions_send` 結果會回報 `delivery.status="skipped"`，因為完成流程已負責傳遞結果。

  </Accordion>
  <Accordion title="恢復現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而非重新開始。代理程式會透過 `session/load` 重播其對話記錄，因此能以先前的完整上下文繼續進行。

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用情境：

    - 將 Codex 工作階段從筆記型電腦轉交至手機——告訴代理程式從你中斷之處繼續。
    - 繼續先前在命令列介面中以互動方式啟動的程式設計工作階段，現在改由代理程式以無介面方式執行。
    - 接續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 僅適用於 `runtime: "acp"`；預設子代理程式執行階段會忽略這個 ACP 專用欄位。
    - `streamTo` 僅適用於 `runtime: "acp"`；預設子代理程式執行階段會忽略這個 ACP 專用欄位。
    - `resumeSessionId` 是主機本機的 ACP／控管程式恢復識別碼，不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP 產生原則與目標代理程式原則，而載入該上游識別碼的授權則由 ACP 後端或控管程式負責。
    - `resumeSessionId` 會還原上游 ACP 對話記錄；`thread` 與 `mode` 仍會正常套用至你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍要求 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 與 Claude Code 均支援）。
    - 如果找不到工作階段識別碼，產生作業會失敗並顯示明確錯誤，不會無提示地退回建立新工作階段。

  </Accordion>
  <Accordion title="部署後冒煙測試">
    部署閘道後，應執行即時端對端檢查，而非僅信任單元測試：

    1. 在目標主機上確認已部署的閘道版本與提交。
    2. 開啟連線至即時代理程式的暫時 ACPX 橋接工作階段。
    3. 要求該代理程式呼叫 `sessions_spawn`，並使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"`，以及任務 `Reply with exactly LIVE-ACP-SPAWN-OK`。
    4. 確認 `accepted=yes`、存在真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    將關卡維持在 `mode: "run"`，並略過 `streamTo: "parent"`——繫結執行緒的 `mode: "session"` 與串流轉送路徑屬於另外兩項更完整的整合測試。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機執行階段上執行，**不會**在 OpenClaw 沙箱內執行。

<Warning>
**安全邊界：**

- 外部控管程式可依其自身的命令列介面權限與所選 `cwd` 進行讀寫。
- OpenClaw 的沙箱原則**不會**包覆 ACP 控管程式的執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理程式、工作階段擁有權、頻道繫結及閘道傳遞原則。
- 若需由沙箱強制執行的 OpenClaw 原生工作，請使用 `runtime: "subagent"`。

</Warning>

目前限制：

- 如果請求者工作階段位於沙箱中，`sessions_spawn({ runtime: "acp" })` 與 `/acp spawn` 的 ACP 產生作業都會被封鎖。
- 使用 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作都接受選用的工作階段目標（`session-key`、`session-id` 或 `session-label`）。

**解析順序：**

1. 明確指定的目標引數（或 `/acp steer` 的 `--session`）
   - 先嘗試金鑰
   - 接著嘗試 UUID 格式的工作階段識別碼
   - 最後嘗試標籤
2. 目前的執行緒繫結（若此對話／執行緒已繫結至 ACP 工作階段）。
3. 目前請求者工作階段的備援。

目前對話繫結與執行緒繫結都會參與步驟 2。

若無法解析任何目標，OpenClaw 會傳回明確錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令                 | 功能                                                       | 範例                                                          |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或執行緒繫結。           | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段正在進行的回合。                           | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將引導指令傳送至執行中的工作階段。                         | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除執行緒目標繫結。                         | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項與功能。                 | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                           | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                                 | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫值。                               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准原則設定檔。                                       | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時時間（秒）。                               | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫值。                                   | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段的執行階段選項覆寫值。                         | `/acp reset-options`                                          |
| `/acp sessions`      | 列出儲存區中最近的 ACP 工作階段。                          | `/acp sessions`                                               |
| `/acp doctor`        | 顯示後端健康狀態、功能及可執行的修正措施。                 | `/acp doctor`                                                 |
| `/acp install`       | 輸出具確定性的安裝與啟用步驟。                             | `/acp install`                                                |

執行階段控制項（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 和 `reset-options`）要求來自外部頻道的
擁有者身分，以及來自內部閘道用戶端的 `operator.admin`。獲授權的非擁有者傳送者仍可使用 `sessions`、
`doctor`、`install` 和 `help`。

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級與
後端層級的工作階段識別碼。當後端缺少某項功能時，會清楚顯示
不支援控制項的錯誤。`/acp sessions` 會讀取目前已繫結或請求者工作階段的
儲存區；目標權杖（`session-key`、`session-id` 或 `session-label`）會透過閘道工作階段探索進行解析，
包括每個代理程式自訂的 `session.store` 根目錄。

### 執行階段選項對應

`/acp` 提供便利命令與通用設定器。對應操作如下：

| 命令                         | 對應至                                | 注意事項                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | 執行階段設定金鑰 `model`              | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為配接器模型識別碼，並將 `openai/gpt-5.4/high` 之類的斜線推理後綴對應至 `reasoning_effort`。                                                         |
| `/acp set thinking <level>`  | 標準選項 `thinking`                   | 若存在，OpenClaw 會傳送後端公告的對應選項，依序優先使用 `thinking`、`effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，配接器會將值對應至 `reasoning_effort`。                             |
| `/acp permissions <profile>` | 標準選項 `permissionProfile`          | 若存在，OpenClaw 會傳送後端公告的對應選項，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                                         |
| `/acp timeout <seconds>`     | 標準選項 `timeoutSeconds`             | 若存在，OpenClaw 會傳送後端公告的對應選項，例如 `timeout` 或 `timeout_seconds`。                                                                                                                       |
| `/acp cwd <path>`            | 執行階段目前工作目錄覆寫值            | 直接更新。                                                                                                                                                                                             |
| `/acp set <key> <value>`     | 通用                                  | `key=cwd` 會使用目前工作目錄覆寫路徑。                                                                                                                                                                 |
| `/acp reset-options`         | 清除所有執行階段覆寫值                | -                                                                                                                                                                                                      |

## acpx 控管程式、外掛設定與權限

如需 acpx 控管程式設定（Claude Code／Codex／Gemini CLI 別名）、
plugin-tools 與 OpenClaw-tools MCP 橋接，以及 ACP 權限模式的相關資訊，
請參閱 [ACP 代理程式——設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                                      | 可能原因                                                                                                                 | 修正方式                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                                   | 缺少或停用了後端外掛，或遭 `plugins.allow` 封鎖。                                                                        | 安裝並啟用後端外掛；若已設定該允許清單，請將 `acpx` 納入 `plugins.allow`，然後執行 `/acp doctor`。                                                                             |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP 已在全域停用。                                                                                                       | 設定 `acp.enabled=true`。                                                                                                                                                     |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 已停用從一般討論串訊息自動分派。                                                                                         | 設定 `acp.dispatch.enabled=true` 以恢復自動討論串路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                                             |
| `ACP agent "<id>" is not allowed by policy`                                               | 代理程式不在允許清單中。                                                                                                 | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                            |
| `/acp doctor` reports backend not ready right after startup                               | 後端外掛缺失、已停用、遭允許／拒絕原則封鎖，或其設定的可執行檔無法使用。                                                 | 安裝／啟用後端外掛，重新執行 `/acp doctor`；若仍處於異常狀態，請檢查後端安裝或原則錯誤。                                                                                      |
| 找不到執行框架命令                                                                        | 未安裝轉接器命令列介面、缺少外部外掛，或非 Codex 轉接器首次執行時的 `npx` 擷取失敗。                                     | 執行 `/acp doctor`、在閘道主機上安裝／預先準備轉接器，或明確設定 acpx 代理程式命令。                                                                                           |
| 執行框架回報找不到模型                                                                    | 模型 ID 對其他供應商／執行框架有效，但不適用於此 ACP 目標。                                                              | 使用該執行框架列出的模型、在執行框架中設定模型，或省略覆寫值。                                                                                                               |
| 執行框架回報供應商驗證錯誤                                                                | OpenClaw 運作正常，但目標命令列介面／供應商尚未登入。                                                                    | 在閘道主機環境中登入，或提供必要的供應商金鑰。                                                                                                                               |
| `Unable to resolve session target: ...`                                                   | 金鑰／ID／標籤權杖錯誤。                                                                                                | 執行 `/acp sessions`、複製確切的金鑰／標籤，然後重試。                                                                                                                       |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 在沒有可繫結之作用中對話的情況下使用了 `--bind here`。                                                                   | 移至目標聊天／頻道並重試，或建立未繫結的工作階段。                                                                                                                           |
| `Conversation bindings are unavailable for <channel>.`                                    | 轉接器不具備目前對話的 ACP 繫結能力。                                                                                    | 在支援時使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                                                         |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 在討論串內容之外使用了 `--thread here`。                                                                                 | 移至目標討論串，或使用 `--thread auto`／`off`。                                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 另一位使用者擁有作用中的繫結目標。                                                                                       | 由擁有者重新繫結，或使用不同的對話或討論串。                                                                                                                                 |
| `Thread bindings are unavailable for <channel>.`                                          | 轉接器不具備討論串繫結能力。                                                                                             | 使用 `--thread off`，或移至支援的轉接器／頻道。                                                                                                                              |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP 執行環境位於主機端；發出要求的工作階段位於沙箱中。                                                                   | 從沙箱工作階段使用 `runtime="subagent"`，或從非沙箱工作階段執行 ACP 建立操作。                                                                                               |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | ACP 執行環境要求使用 `sandbox="require"`。                                                                               | 若需要強制使用沙箱，請使用 `runtime="subagent"`；或從非沙箱工作階段以 `sandbox="inherit"` 使用 ACP。                                                                          |
| `Cannot apply --model ... did not advertise model support`                                | 目標執行框架未公開通用的 ACP 模型切換功能。                                                                               | 使用宣告支援 ACP `models`／`session/set_model` 的執行框架、使用 Codex ACP 模型參照，或在執行框架具有自有啟動旗標時直接於其中設定模型。                                        |
| 已繫結工作階段缺少 ACP 中繼資料                                                            | ACP 工作階段中繼資料已過期或遭刪除。                                                                                     | 使用 `/acp spawn` 重新建立，然後重新繫結／聚焦討論串。                                                                                                                      |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 會在非互動式 ACP 工作階段中封鎖寫入／執行。                                                            | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動閘道。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。                       |
| ACP 工作階段很快失敗，且幾乎沒有輸出                                                      | 權限提示遭 `permissionMode`／`nonInteractivePermissions` 封鎖。                                                         | 檢查閘道記錄中是否有 `AcpRuntimeError`。如需完整權限，請設定 `permissionMode=approve-all`；如需優雅降級，請設定 `nonInteractivePermissions=deny`。                           |
| ACP 工作階段完成工作後無限期停滯                                                          | 執行框架程序已完成，但 ACP 工作階段未回報完成。                                                                          | 更新 OpenClaw；目前的 acpx 清理程序會在關閉及閘道啟動時，終止由 OpenClaw 擁有且已失效的包裝器與轉接器程序。                                                                  |
| 執行框架看見 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | 內部事件封套洩漏至 ACP 邊界之外。                                                                                        | 更新 OpenClaw 並重新執行完成流程；外部執行框架應只收到純文字的完成提示。                                                                                                    |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex 掛鉤轉送機制，而非 ACP/acpx。在已繫結的 Codex 聊天中，使用
`/new` 或 `/reset` 啟動新的工作階段；如果它只成功一次，並在下一次
原生工具呼叫時再次出現，請重新啟動 Codex 應用程式伺服器或 OpenClaw 閘道，
而不要反覆執行 `/new`。請參閱
[Codex 執行框架疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
</Note>

## 相關內容

- [ACP 代理程式－設定](/zh-TW/tools/acp-agents-setup)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [命令列介面後端](/zh-TW/gateway/cli-backends)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架執行環境](/zh-TW/plugins/codex-harness-runtime)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理程式](/zh-TW/tools/subagents)
