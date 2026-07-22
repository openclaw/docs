---
read_when:
    - 透過 ACP 執行程式設計工具框架
    - 在訊息頻道上設定對話綁定的 ACP 工作階段
    - 將訊息頻道對話繫結至持久性 ACP 工作階段
    - 疑難排解 ACP 後端、外掛連接或完成結果傳遞問題
    - 從聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式設計工具（Claude Code、Cursor、Gemini 命令列介面、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-07-22T10:51:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fc7f32ff927c7e949be1595f6aa00ed034a51185c6a6b1e0df01a242954667d1
    source_path: tools/acp-agents.md
    workflow: 16
---

[代理程式用戶端通訊協定 (ACP)](https://agentclientprotocol.com/) 工作階段可讓
OpenClaw 透過 ACP 後端外掛執行外部程式設計操作框架（Claude Code、Cursor、Copilot、Droid、
OpenClaw ACP、OpenCode、Gemini 命令列介面，以及其他支援的 ACPX 操作框架）。
每次啟動都會追蹤為一項
[背景工作](/zh-TW/automation/tasks)。

<Note>
**ACP 是外部操作框架路徑，而非預設的 Codex 路徑。** 原生
Codex 應用程式伺服器外掛負責 `/codex ...` 控制項，以及代理程式回合所使用的預設
`openai/gpt-*` 嵌入式執行階段；ACP 則負責 `/acp ...` 控制項
與 `sessions_spawn({ runtime: "acp" })` 工作階段。

若要讓 Codex 或 Claude Code 以外部 MCP 用戶端的身分，直接連線至
現有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而非 ACP。
</Note>

## 我該查看哪個頁面？

| 你想要……                                                                                  | 使用                                  | 備註                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                               | `/codex bind`、`/codex threads`       | 啟用 `codex` 外掛時使用原生 Codex 應用程式伺服器路徑：繫結的聊天回覆、圖片轉送、模型／快速模式／權限、停止及引導。ACP 是明確指定的備援方案 |
| 透過 OpenClaw 執行 Claude Code、Gemini 命令列介面、明確指定的 Codex ACP 或其他外部操作框架 | 本頁                                  | 與聊天繫結的工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景工作、執行階段控制項                                                                 |
| 將 OpenClaw 閘道工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                   | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式：IDE／用戶端透過 stdio／WebSocket 使用 ACP 與 OpenClaw 通訊                                                                                                      |
| 將本機 AI 命令列介面重複用作純文字備援模型                                              | [命令列介面後端](/zh-TW/gateway/cli-backends) | 並非 ACP：沒有 OpenClaw 工具、ACP 控制項或操作框架執行階段                                                                                                             |

## 是否能開箱即用？

可以，但須先安裝官方 ACP 執行階段外掛：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼簽出可在 `pnpm install` 後使用本機
`extensions/acpx` 工作區外掛。執行 `/acp doctor` 以進行就緒狀態檢查。

OpenClaw 只會在 ACP **確實可用**時，告知代理程式如何啟動 ACP：
ACP 必須已啟用、分派不得停用、目前工作階段不得因沙箱而遭封鎖，
且必須已載入健康的執行階段後端。若任何條件不符，ACP Skills 與
`sessions_spawn` ACP 指引會保持隱藏，
避免代理程式建議使用無法使用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 若已設定 `plugins.allow`，它就是限制性的外掛清單，且**必須**包含 `acpx`，否則已安裝的 ACP 後端會被刻意封鎖（`/acp doctor` 會回報缺少的允許清單項目）。
    - Codex ACP 配接器隨 `acpx` 外掛提供，並會盡可能在本機啟動。
    - Codex ACP 使用隔離的 `CODEX_HOME` 執行。OpenClaw 會從主機 Codex 設定複製受信任的專案信任項目，以及安全的模型／供應商路由設定（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode`，以及安全的 `model_providers.<name>` 欄位）；驗證、通知與掛鉤則僅保留於主機設定中。
    - 其他目標操作框架配接器可能會在首次使用時，透過 `npx` 隨需擷取。
    - 主機上必須已具備該操作框架的供應商驗證。
    - 若主機無法使用 npm 或網路，首次執行時的配接器擷取將會失敗，直到預先暖機快取或以其他方式安裝配接器為止。

  </Accordion>
  <Accordion title="執行階段先決條件">
    ACP 會啟動真正的外部操作框架程序。OpenClaw 負責路由、
    背景工作狀態、傳遞、繫結與政策；操作框架則負責
    自身的供應商登入、模型目錄、檔案系統行為與原生工具。

    在認定是 OpenClaw 的問題前，請先確認：

    - `/acp doctor` 回報後端已啟用且狀態健康。
    - 設定該允許清單時，`acp.allowedAgents` 允許此目標 ID。
    - 操作框架命令可在閘道主機上啟動。
    - 該操作框架具備供應商驗證（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 該操作框架中存在所選模型——模型 ID 無法跨操作框架通用。
    - 要求的 `cwd` 存在且可存取；否則請省略 `cwd`，讓後端使用其預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此涉及大量寫入／執行的程式設計作業，通常需要可在無介面環境中繼續執行的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具與 OpenClaw 內建工具預設**不會**公開給 ACP
操作框架。只有當操作框架應直接呼叫這些工具時，才啟用
[ACP 代理程式－設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的操作框架目標

使用 `acpx` 後端時，請將下列 ID 作為 `/acp spawn <id>` 或
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 操作框架 ID   | 典型後端                                | 備註                                                                               |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP 配接器                        | 主機上必須具備 Claude Code 驗證。                                              |
| `codex`      | Codex ACP 配接器                              | 僅在原生 `/codex` 無法使用或明確要求 ACP 時，作為明確指定的 ACP 備援方案。 |
| `copilot`    | GitHub Copilot ACP 配接器                     | 必須具備 Copilot 命令列介面／執行階段驗證。                                                  |
| `cursor`     | Cursor 命令列介面 ACP（`cursor-agent acp`）            | 若本機安裝公開了不同的 ACP 進入點，請覆寫 acpx 命令。    |
| `droid`      | Factory Droid 命令列介面                              | 操作框架環境中必須具備 Factory／Droid 驗證或 `FACTORY_API_KEY`。        |
| `fast-agent` | fast-agent-mcp ACP 配接器                     | 透過 `uvx` 隨需擷取。                                                       |
| `gemini`     | Gemini 命令列介面 ACP 配接器                         | 必須具備 Gemini 命令列介面驗證或 API 金鑰設定。                                          |
| `iflow`      | iFlow 命令列介面                                      | 配接器可用性與模型控制取決於已安裝的命令列介面。                 |
| `kilocode`   | Kilo Code 命令列介面                                  | 配接器可用性與模型控制取決於已安裝的命令列介面。                 |
| `kimi`       | Kimi／Moonshot 命令列介面                              | 主機上必須具備 Kimi／Moonshot 驗證。                                            |
| `kiro`       | Kiro 命令列介面                                       | 配接器可用性與模型控制取決於已安裝的命令列介面。                 |
| `mux`        | Mux 命令列介面 ACP 配接器                            | 透過 `npx` 隨需擷取。                                                       |
| `opencode`   | OpenCode ACP 配接器                           | 必須具備 OpenCode 命令列介面／供應商驗證。                                                |
| `openclaw`   | 透過 `openclaw acp` 的 OpenClaw 閘道橋接 | 讓支援 ACP 的操作框架與 OpenClaw 閘道工作階段通訊。                 |
| `qoder`      | Qoder 命令列介面                                      | 配接器可用性與模型控制取決於已安裝的命令列介面。                 |
| `qwen`       | Qwen Code／Qwen 命令列介面                           | 主機上必須具備與 Qwen 相容的驗證。                                          |
| `trae`       | Trae 命令列介面 ACP 配接器                           | 配接器可用性與模型控制取決於已安裝的命令列介面。                 |

`pi`（pi-acp）也已在 acpx 後端註冊，但它與上述其他項目不同，
並非同類型的程式設計操作框架。

可在 acpx 本身設定自訂 acpx 代理程式別名，但 OpenClaw
政策仍會在分派前檢查 `acp.allowedAgents`，以及任何
`agents.entries.*.runtime.acp.agent` 對應。

## 操作人員執行手冊

從聊天開始的快速 `/acp` 流程：

<Steps>
  <Step title="啟動">
    `/acp spawn claude --bind here`、
    `/acp spawn gemini --mode persistent --thread auto`，或明確指定
    `/acp spawn codex --bind here`。
  </Step>
  <Step title="工作">
    在已繫結的對話或討論串中繼續（或明確指定工作階段金鑰）。
  </Step>
  <Step title="檢查狀態">
    `/acp status`
  </Step>
  <Step title="調整">
    `/acp model <provider/model>`、`/acp permissions <profile>`、
    `/acp timeout <seconds>`。
  </Step>
  <Step title="引導">
    在不取代內容脈絡的情況下：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段與繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 產生作業會建立或恢復 ACP 執行階段工作階段、在 OpenClaw 工作階段儲存區中記錄 ACP 中繼資料，並且可能會在執行作業由父項擁有時建立背景工作。
    - 即使執行階段工作階段是持續性的，由父項擁有的 ACP 工作階段仍會視為背景工作；完成通知與跨介面傳遞會透過父項工作通知器處理，而不會像一般面向使用者的聊天工作階段那樣運作。
    - 工作維護會關閉已終止或失去父項的單次 ACP 工作階段。只要仍有作用中的對話繫結，持續性 ACP 工作階段就會保留；沒有作用中繫結的過時持續性工作階段則會關閉，避免在所屬工作完成或其工作記錄消失後遭到無聲恢復。
    - 繫結後的後續訊息會直接傳送至 ACP 工作階段，直到繫結被關閉、取消聚焦、重設或到期為止。
    - 閘道命令會留在本機處理。`/acp ...`、`/status` 和 `/unfocus` 絕不會以一般提示文字傳送至已繫結的 ACP 控制框架。
    - `cancel` 會在後端支援取消時中止作用中的回合；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。如果控制框架支援恢復，仍可能保留自己的上游歷程記錄。
    - acpx 外掛會在 `close` 後清理由 OpenClaw 擁有的包裝器與配接器處理程序樹，並在閘道啟動期間清除由 OpenClaw 擁有的過時 ACPX 孤立處理程序。
    - 閒置的執行階段背景工作處理器會在內建閒置期間過後進入可清理狀態；儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    啟用時，應路由至 **原生 Codex 外掛**的自然語言觸發詞：

    - 「將此 Discord 頻道繫結至 Codex。」
    - 「將此聊天附加至 Codex 討論串 `<id>`。」
    - 「顯示 Codex 討論串，然後繫結這一個。」

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而 shell/apply-patch
    等 Codex 原生工具則在 Codex 內執行。對於 Codex 原生工具事件，
    OpenClaw 會在每個回合注入原生掛鉤轉送器，讓外掛掛鉤
    能夠封鎖 `before_tool_call`、觀察 `after_tool_call`，並透過 OpenClaw
    核准路由 Codex `PermissionRequest` 事件。Codex `Stop` 掛鉤
    會轉送至 OpenClaw `before_agent_finalize`，外掛可在該處要求
    Codex 完成其回覆前再執行一次模型處理。此轉送器刻意採取
    保守方式：它不會修改 Codex 原生工具引數，
    也不會重寫 Codex 討論串記錄。只有在需要
    ACP 執行階段／工作階段模型時，才明確使用 ACP。嵌入式 Codex 支援界線
    記錄於
    [Codex 控制框架 v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型／提供者／執行階段選擇速查表">
    - 舊版 Codex 模型參照 - 由 doctor 修復的舊版 Codex OAuth／訂閱模型路由。
    - `openai/*` - 用於 OpenAI 代理程式回合的原生 Codex app-server 嵌入式執行階段。
    - `/codex ...` - 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` - 明確的 ACP/acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發詞">
    應路由至 ACP 執行階段的觸發詞：

    - 「將此作業當作單次 Claude Code ACP 工作階段執行，並摘要結果。」
    - 「在討論串中使用 Gemini 命令列介面執行此工作，然後讓後續訊息留在同一個討論串中。」
    - 「透過 ACP 在背景討論串中執行 Codex。」

    OpenClaw 會選擇 `runtime: "acp"`、解析控制框架 `agentId`、在支援時繫結至
    目前對話或討論串，並將後續訊息路由至該工作階段，
    直到關閉／到期為止。只有明確指定 ACP/acpx，或原生 Codex 外掛
    無法用於所要求的操作時，Codex 才會採用此路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、要求者不在沙箱中，且已載入 ACP 執行階段後端時，
    才會公告 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停自動 ACP 討論串分派，
    但不會隱藏或封鎖明確的 `sessions_spawn({ runtime: "acp" })`
    呼叫。它的目標是 `codex`、`claude`、`droid`、
    `gemini` 或 `opencode` 等 ACP 控制框架 ID。除非 `agents_list` 中的一般 OpenClaw 設定代理程式 ID
    已明確設定 `agents.entries.*.runtime.type="acp"`，否則不要傳入該 ID；
    請改用預設的子代理程式
    執行階段。當 OpenClaw 代理程式設定了
    `runtime.type="acp"` 時，OpenClaw 會使用 `runtime.acp.agent` 作為底層
    控制框架 ID。

  </Accordion>
</AccordionGroup>

## ACP 與子代理程式的比較

需要外部控制框架執行階段時，請使用 ACP。啟用 `codex` 外掛時，
請使用**原生 Codex app-server** 進行 Codex 對話繫結／控制。
需要 OpenClaw 原生委派執行作業時，請使用**子代理程式**。

| 領域          | ACP 工作階段                           | 子代理程式執行作業                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端外掛（例如 acpx） | OpenClaw 原生子代理程式執行階段  |
| 工作階段索引鍵   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理程式](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 執行 Claude Code 時，技術堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段外掛。
3. Claude ACP 配接器。
4. Claude 端執行階段／工作階段機制。

ACP Claude 是具有 ACP 控制、工作階段恢復、
背景工作追蹤及選用對話／討論串繫結的**控制框架工作階段**。

命令列介面後端是獨立的純文字本機備援執行階段，請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對操作人員而言，實用規則如下：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制或持續性控制框架工作？**請使用 ACP。
- **需要透過原始命令列介面進行簡單的本機文字備援？**請使用命令列介面後端。

## 已繫結的工作階段

### 心智模型

- **聊天介面** - 使用者持續交談的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** - OpenClaw 路由至其中的持久 Codex／Claude／Gemini 執行階段狀態。
- **子討論串／主題** - 只有 `--thread ...` 才會建立的選用額外通訊介面。
- **執行階段工作區** - 控制框架執行所在的檔案系統位置（`cwd`、存放庫簽出、後端工作區）。與聊天介面無關。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話固定至
產生的 ACP 工作階段，不建立子討論串，並使用同一個聊天介面。OpenClaw 持續
負責傳輸、驗證、安全性及傳遞。該對話中的後續訊息會路由至
相同工作階段；`/new` 和 `/reset` 會就地重設工作階段；
`/acp close` 則會移除繫結。

範例：

```text
/codex bind                                              # 原生 Codex 繫結，將後續訊息路由至此處
/codex model gpt-5.4                                     # 調整已繫結的原生 Codex 討論串
/codex stop                                              # 控制作用中的原生 Codex 回合
/acp spawn codex --bind here                             # Codex 的明確 ACP 備援
/acp spawn codex --thread auto                           # 可能建立子討論串／主題並繫結至該處
/acp spawn codex --bind here --cwd /workspace/repo       # 相同的聊天繫結，Codex 在 /workspace/repo 中執行
```

<AccordionGroup>
  <Accordion title="繫結規則與互斥性">
    - `--bind here` 與 `--thread ...` 互斥。
    - `--bind here` 僅適用於公告支援目前對話繫結的頻道；否則 OpenClaw 會傳回明確的不支援訊息。繫結在閘道重新啟動後仍會保留。
    - 在 Discord 上，`spawnSessions` 會控管 `--thread auto|here` 的子討論串建立，而不是 `--bind here`。
    - 如果在沒有 `--cwd` 的情況下產生至不同的 ACP 代理程式，OpenClaw 預設會繼承**目標代理程式的**工作區。缺少繼承路徑（`ENOENT`／`ENOTDIR`）時會退回後端預設值；其他存取錯誤（例如 `EACCES`）則會顯示為產生錯誤。
    - 閘道管理命令會在已繫結的對話中留在本機處理，即使一般後續文字會路由至已繫結的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 和 `/unfocus` 也會留在本機處理。

  </Accordion>
  <Accordion title="討論串繫結工作階段">
    為頻道配接器啟用討論串繫結時：

    - OpenClaw 會將討論串繫結至目標 ACP 工作階段。
    - 該討論串中的後續訊息會路由至已繫結的 ACP 工作階段。
    - ACP 輸出會傳回至同一個討論串。
    - 取消聚焦／關閉／封存／閒置逾時或最長期限到期時，會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是閘道命令，不是傳送給 ACP 控制框架的提示。

    討論串繫結 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設為開啟（將 `false` 設為暫停自動 ACP 討論串分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 已啟用頻道配接器討論串工作階段產生功能（預設值：`true`）：
      - Discord／Telegram：`session.threadBindings.spawnSessions=true`

    討論串繫結支援視配接器而定。如果作用中的頻道配接器
    不支援討論串繫結，OpenClaw 會傳回明確的
    不支援／無法使用訊息。

  </Accordion>
  <Accordion title="支援討論串的頻道">
    - 任何公開工作階段／討論串繫結功能的頻道配接器。
    - 目前的內建支援：**Discord** 討論串／頻道、**Telegram** 主題（群組／超級群組中的論壇主題及私人訊息主題）。
    - 外掛頻道可透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持續性頻道繫結

對於非暫時性工作流程，請在頂層
`bindings[]` 項目中設定持續性 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標示持續性 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道的結構：

- **Discord 頻道／討論串：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道／私訊：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。建議使用穩定的 Slack ID；頻道繫結也會比對該頻道討論串內的回覆。
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp 私訊／群組：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 E.164 號碼，例如 `+15555550123`；群組請使用 WhatsApp 群組 JID，例如 `120363424282127706@g.us`。
- **iMessage 私訊／群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。建議使用 `chat_id:*` 以取得穩定的群組繫結。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所屬的 OpenClaw 代理程式 ID。
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  選用的 ACP 覆寫設定。
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  選用的操作人員可見標籤。
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  選用的執行階段工作目錄。
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  選用的後端覆寫設定。
</ParamField>

### 每個代理程式的執行階段預設值

使用 `agents.entries.*.runtime` 為每個代理程式定義一次 ACP 預設值：

- `agents.entries.*.runtime.type="acp"`
- `agents.entries.*.runtime.acp.agent`（操作框架 ID，例如 `codex` 或 `claude`）
- `agents.entries.*.runtime.acp.backend`
- `agents.entries.*.runtime.acp.mode`
- `agents.entries.*.runtime.acp.cwd`

**ACP 繫結工作階段的覆寫優先順序：**

1. `bindings[].acp.*`
2. `agents.entries.*.runtime.acp.*`
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

- OpenClaw 會在通過頻道特定的准入檢查後、使用前，確保設定的 ACP 工作階段存在。
- 該頻道、主題或聊天中的訊息會路由至設定的 ACP 工作階段。
- 設定的 ACP 繫結擁有其工作階段路由。對於相符的繫結，頻道廣播的扇出不會取代設定的 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段金鑰。
- 暫時性執行階段繫結（例如由討論串聚焦流程建立）仍會在存在時套用。
- 對於未明確指定 `cwd` 的跨代理程式 ACP 產生作業，OpenClaw 會從代理程式設定繼承目標代理程式工作區。
- 若繼承的工作區路徑不存在，則回復使用後端預設 cwd；若路徑存在但存取失敗，則會顯示為產生錯誤。

## 啟動 ACP 工作階段

有兩種方式可以啟動 ACP 工作階段：

<Tabs>
  <Tab title="從 sessions_spawn">
    使用 `runtime: "acp"` 從代理程式回合或工具呼叫啟動 ACP 工作階段。

    ```json
    {
      "task": "開啟儲存庫並摘要說明失敗的測試",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` 的預設值為 `subagent`，因此請為 ACP 工作階段明確設定 `runtime: "acp"`。若省略 `agentId`，OpenClaw 會在已設定時使用 `acp.defaultAgent`。`mode: "session"` 需要 `thread: true` 才能維持持續性的繫結對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 命令">
    使用 `/acp spawn` 從聊天中進行明確的操作人員控制。

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
  ACP 目標操作框架 ID。若已設定，則回復使用 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援的情況下要求討論串繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 為單次執行；`"session"` 為持續性工作階段。若為 `thread: true` 且省略 `mode`，OpenClaw 可能會依執行階段路徑預設採用持續性行為。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端／執行階段政策驗證）。
  若省略，ACP 產生作業會在已設定時繼承目標代理程式工作區；
  若繼承的路徑不存在，則回復使用後端預設值，而實際的存取
  錯誤則會傳回。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段／橫幅文字的操作人員可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續現有的 ACP 工作階段，而非建立新工作階段。代理程式會透過
  `session/load` 重播其對話記錄。需要
  `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要以系統事件串流回要求者
  工作階段。OpenClaw 會將完整的轉送記錄儲存在子代理程式的 SQLite
  狀態中，並隨子工作階段一併移除。除非
  `streaming.progress.commentary=false`，否則父工作階段進度串流預設會顯示助理評論與 ACP
  狀態進度。當未設定串流模式時，Discord 的父工作階段預覽
  預設也會使用進度模式。狀態進度仍遵循
  `acp.stream.tagVisibility`，因此 `plan` 等標記除非明確啟用，
  否則仍會隱藏。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds`
作為其預設子回合限制。此工具不接受每次呼叫的
逾時覆寫（`runTimeoutSeconds`/`timeoutSeconds` 會遭拒，並傳回
要求設定預設值的錯誤）。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫設定。Codex ACP 產生作業會在
  `session/new` 前，將 `openai/gpt-5.4` 等 OpenAI 參照正規化為
  Codex ACP 啟動設定；`openai/gpt-5.4/high` 等斜線形式也會設定 Codex ACP
  推理強度。若省略，`sessions_spawn({ runtime: "acp" })` 會在已設定時使用現有的子代理程式
  模型預設值（`agents.defaults.subagents.model` 或 `agents.entries.*.subagents.model`）；否則讓 ACP
  操作框架使用其自身的預設模型。其他操作框架必須公告 ACP
  `models` 並支援 `session/set_model`；否則 OpenClaw/acpx 會明確
  失敗，而不會無聲地回復使用目標代理程式的預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考／推理強度。對 Codex ACP 而言，`minimal` 對應至低
  強度，`low`/`medium`/`high`/`xhigh` 會直接對應，而 `off` 會省略
  推理強度啟動覆寫。若省略，ACP 產生作業會針對所選
  模型使用現有的子代理程式思考預設值及各模型的
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 產生作業的繫結與討論串模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 就地將目前的作用中對話繫結；若沒有作用中的對話則失敗。 |
    | `off`  | 不建立目前對話繫結。                          |

    注意事項：

    - `--bind here` 是「讓此頻道或聊天由 Codex 支援」最簡單的操作人員路徑。
    - `--bind here` 不會建立子討論串。
    - `--bind here` 僅適用於公開目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 無法在同一個 `/acp spawn` 呼叫中搭配使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | 位於作用中的討論串時：繫結該討論串。位於討論串外時：在支援的情況下建立／繫結子討論串。 |
    | `here` | 要求目前有作用中的討論串；若不在討論串中則失敗。                                                  |
    | `off`  | 不繫結。工作階段以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非討論串繫結介面上，預設行為實際上等同於 `off`。
    - 討論串繫結的產生作業需要頻道政策支援：
      - Discord／Telegram：`session.threadBindings.spawnSessions=true`
    - 若要固定目前的對話而不建立子討論串，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是由父工作階段擁有的背景
工作。傳遞路徑取決於其形式。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段旨在於可見的聊天介面上持續對話：

    - `/acp spawn ... --bind here` 將目前對話繫結至 ACP 工作階段。
    - `/acp spawn ... --thread ...` 將頻道討論串／主題繫結至 ACP 工作階段。
    - 持續性的已設定 `bindings[].type="acp"` 會將相符的對話路由至同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由至 ACP
    工作階段，而 ACP 輸出則會傳回同一個
    頻道／討論串／主題。

    OpenClaw 傳送至操作框架的內容：

    - 一般的有限後續互動會以提示文字傳送；只有在測試框架／後端支援時，才會一併傳送附件。
    - `/acp` 管理命令與本機閘道命令會在分派至 ACP 前遭攔截。
    - 執行階段產生的完成事件會依各目標具體化。OpenClaw 代理程式會取得 OpenClaw 的內部執行階段情境封套；外部 ACP 測試框架則會取得包含子項結果與指示的純提示。絕不可將原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封套傳送至外部測試框架，或將其持久保存為 ACP 使用者逐字稿文字。
    - ACP 逐字稿項目會使用使用者可見的觸發文字或純完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="由父項擁有的單次 ACP 工作階段">
    由另一個代理程式執行所產生的單次 ACP 工作階段，是背景
    子項，類似子代理程式：

    - 父項透過 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求執行工作。
    - 子項在自己的 ACP 測試框架工作階段中執行。
    - 子項輪次會在原生子代理程式產生作業所使用的相同背景通道上執行，因此緩慢的 ACP 測試框架不會阻擋不相關的主要工作階段工作。
    - 完成報告會透過工作完成公告路徑傳回。OpenClaw 會先將內部完成中繼資料轉換為純 ACP 提示，再傳送至外部測試框架，因此測試框架不會看到僅供 OpenClaw 使用的執行階段情境標記。
    - 當需要向使用者回覆時，父項會以一般助理語氣重寫子項結果。

    **不要**將此路徑視為父項與
    子項之間的點對點聊天。子項已有將完成結果傳回父項的通道。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可在產生後指定另一個工作階段。對於一般對等
    工作階段，OpenClaw 會在注入訊息後使用代理程式對代理程式（A2A）
    後續互動路徑：

    - 等待目標工作階段回覆。
    - 可選擇讓要求者與目標交換有限次數的後續輪次。
    - 要求目標產生公告訊息。
    - 將該公告傳遞至可見頻道或討論串。

    該 A2A 路徑是對等傳送的備援機制，適用於傳送者需要
    可見後續回覆的情況。當不相關的工作階段可以看見 ACP 目標並
    傳送訊息給它時，此路徑仍會啟用，例如採用寬鬆的 `tools.sessions.visibility`
    設定時。

    OpenClaw 只會在要求者是其自行擁有、由父項管理的單次 ACP
    子項之父項時，略過 A2A 後續互動。在此情況下，若在工作完成機制之上
    執行 A2A，可能會以子項結果喚醒父項、將父項的回覆轉送回子項，
    並造成父項／子項回音
    迴圈。對於這種自有子項情況，`sessions_send` 結果會回報
    `delivery.status="skipped"`，因為完成路徑已負責
    傳回結果。

  </Accordion>
  <Accordion title="繼續現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是
    重新開始。代理程式會透過
    `session/load` 重播其對話歷程，因此能以完整的先前情境繼續執行。

    ```json
    {
      "task": "從上次中斷處繼續——修正其餘測試失敗",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從你的筆記型電腦移交至手機——要求你的代理程式從上次中斷處繼續。
    - 繼續你先前在命令列介面中以互動方式啟動的程式設計工作階段，現在改由代理程式以無頭模式執行。
    - 接續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 僅在 `runtime: "acp"` 時適用；預設的子代理程式執行階段會忽略這個僅供 ACP 使用的欄位。
    - `streamTo` 僅在 `runtime: "acp"` 時適用；預設的子代理程式執行階段會忽略這個僅供 ACP 使用的欄位。
    - `resumeSessionId` 是主機本機的 ACP／測試框架續接 ID，而非 OpenClaw 頻道工作階段金鑰；OpenClaw 仍會在分派前檢查 ACP 產生政策與目標代理程式政策，而載入該上游 ID 的授權則由 ACP 後端或測試框架負責。
    - `resumeSessionId` 會還原上游 ACP 對話歷程；`thread` 與 `mode` 仍會如常套用至你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 與 Claude Code 均支援）。
    - 若找不到工作階段 ID，產生作業會以明確錯誤失敗，不會無聲地回退至新工作階段。

  </Accordion>
  <Accordion title="部署後煙霧測試">
    部署閘道後，請執行即時端對端檢查，而不要只信任
    單元測試：

    1. 確認目標主機上已部署的閘道版本與提交。
    2. 開啟連線至即時代理程式的暫時 ACPX 橋接工作階段。
    3. 要求該代理程式以 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 及工作 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 確認 `accepted=yes`、真實的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    將閘門維持在 `mode: "run"`，並略過 `streamTo: "parent"`——
    綁定討論串的 `mode: "session"` 與串流轉送路徑屬於另外較完整的
    整合驗證流程。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機執行階段上執行，**不會**在 OpenClaw
沙箱內執行。

<Warning>
**安全性邊界：**

- 外部測試框架可依照自身的命令列介面權限與所選的 `cwd` 進行讀取／寫入。
- OpenClaw 的沙箱政策**不會**包覆 ACP 測試框架的執行。
- OpenClaw 仍會強制執行 ACP 功能閘門、允許的代理程式、工作階段擁有權、頻道繫結及閘道傳遞政策。
- 需要由沙箱強制執行的 OpenClaw 原生工作，請使用 `runtime: "subagent"`。

</Warning>

目前限制：

- 如果要求者工作階段位於沙箱中，`sessions_spawn({ runtime: "acp" })` 與 `/acp spawn` 的 ACP 產生作業都會遭到封鎖。
- 搭配 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作都接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 先嘗試金鑰
   - 接著嘗試 UUID 格式的工作階段 ID
   - 然後嘗試標籤
2. 目前的討論串繫結（如果此對話／討論串已繫結至 ACP 工作階段）。
3. 目前要求者工作階段的備援。

目前對話繫結與討論串繫結都會參與步驟 2。

如果無法解析任何目標，OpenClaw 會傳回明確錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令              | 功能                                              | 範例                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或討論串繫結。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段正在進行的輪次。                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將引導指示傳送至執行中的工作階段。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除討論串目標的繫結。                  | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項及能力。 | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                      | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入一般執行階段設定選項。                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准政策設定檔。                              | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                            | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段執行階段選項覆寫。                  | `/acp reset-options`                                          |
| `/acp sessions`      | 列出儲存區中最近的 ACP 工作階段。                      | `/acp sessions`                                               |
| `/acp doctor`        | 顯示後端健康狀態、能力及可採取的修正措施。           | `/acp doctor`                                                 |
| `/acp install`       | 輸出確定性的安裝與啟用步驟。             | `/acp install`                                                |

執行階段控制項（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 及 `reset-options`）要求
外部頻道提供擁有者身分，內部閘道用戶端則須提供 `operator.admin`。
經授權的非擁有者傳送者仍可使用 `sessions`、
`doctor`、`install` 及 `help`。對於非擁有者傳送者，`/acp sessions`
只會列出目前繫結的工作階段或要求者工作階段；具有擁有者身分及
`operator.admin` 的用戶端則可查看所有最近的工作階段。

`/acp status` 會顯示有效的執行階段選項，以及執行階段層級與
後端層級的工作階段識別碼。當後端缺少某項能力時，系統會
明確顯示不支援控制項的錯誤。接受目標權杖的命令
（`session-key`、`session-id` 或 `session-label`）會透過閘道
工作階段探索解析這些權杖，包括每個代理程式的自訂 `session.store` 根目錄。`/acp sessions`
不接受目標權杖。

### 執行階段選項對應

`/acp` 提供便利命令與一般設定器。對等操作：

| 命令                      | 對應至                              | 備註                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 執行階段設定鍵 `model`           | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為配接器模型 ID，並將 `openai/gpt-5.4/high` 等斜線推理後綴對應至 `reasoning_effort`。                                         |
| `/acp set thinking <level>`  | 標準選項 `thinking`          | 若後端有宣告對應項目，OpenClaw 會傳送該項目，優先依序使用 `thinking`、`effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，配接器會將值對應至 `reasoning_effort`。 |
| `/acp permissions <profile>` | 標準選項 `permissionProfile` | 若後端有宣告對應項目，OpenClaw 會傳送該項目，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                       |
| `/acp timeout <seconds>`     | 標準選項 `timeoutSeconds`    | 若後端有宣告對應項目，OpenClaw 會傳送該項目，例如 `timeout` 或 `timeout_seconds`。                                                                                                     |
| `/acp cwd <path>`            | 執行階段目前工作目錄覆寫                 | 直接更新。                                                                                                                                                                                             |
| `/acp set <key> <value>`     | 通用                              | `key=cwd` 使用目前工作目錄覆寫路徑。                                                                                                                                                                      |
| `/acp reset-options`         | 清除所有執行階段覆寫         | -                                                                                                                                                                                                          |

## acpx 控制介面、外掛設定與權限

如需 acpx 控制介面設定（Claude Code / Codex / Gemini 命令列介面別名）、
plugin-tools 與 OpenClaw-tools MCP 橋接器，以及 ACP 權限模式的相關資訊，
請參閱 [ACP 代理程式－設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                                   | 可能原因                                                                                                           | 修正方式                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | 後端外掛遺失、已停用或遭 `plugins.allow` 阻擋。                                                       | 安裝並啟用後端外掛；若已設定該允許清單，請在 `plugins.allow` 中加入 `acpx`，然後執行 `/acp doctor`。                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP 已全域停用。                                                                                                 | 設定 `acp.enabled=true`。                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 已停用從一般討論串訊息自動分派。                                                               | 將 `acp.dispatch.enabled=true` 設定為恢復自動討論串路由；明確呼叫 `sessions_spawn({ runtime: "acp" })` 仍可運作。                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | 代理程式不在允許清單中。                                                                                                | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                     |
| `/acp doctor` 在啟動後立即回報後端尚未就緒                               | 後端外掛遺失、已停用、遭允許／拒絕政策阻擋，或其設定的執行檔無法使用。        | 安裝／啟用後端外掛、重新執行 `/acp doctor`；若其仍處於異常狀態，請檢查後端安裝或政策錯誤。                                           |
| 找不到控制介面命令                                                                 | 未安裝配接器命令列介面、外部外掛遺失，或非 Codex 配接器首次執行時擷取 `npx` 失敗。 | 執行 `/acp doctor`、在閘道主機上安裝／預熱配接器，或明確設定 acpx 代理程式命令。                                                      |
| 控制介面回報找不到模型                                                          | 模型 ID 對另一個供應商／控制介面有效，但不適用於此 ACP 目標。                                                | 使用該控制介面列出的模型、在控制介面中設定模型，或省略覆寫。                                                                            |
| 控制介面回報供應商驗證錯誤                                                        | OpenClaw 運作正常，但尚未登入目標命令列介面／供應商。                                                     | 登入，或在閘道主機環境中提供必要的供應商金鑰。                                                                                             |
| `Unable to resolve session target: ...`                                                   | 錯誤的鍵／ID／標籤權杖。                                                                                                | 執行 `/acp sessions`、複製完全相同的鍵／標籤，然後重試。                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 在沒有可繫結作用中對話的情況下使用 `--bind here`。                                                            | 移至目標聊天／頻道後重試，或使用未繫結的產生方式。                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | 配接器不具備目前對話的 ACP 繫結功能。                                                             | 在支援的情況下使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 在討論串情境外使用 `--thread here`。                                                                         | 移至目標討論串，或使用 `--thread auto`/`off`。                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 另一位使用者擁有作用中的繫結目標。                                                                           | 以擁有者身分重新繫結，或使用不同的對話或討論串。                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | 配接器不具備討論串繫結功能。                                                                               | 使用 `--thread off`，或移至支援的配接器／頻道。                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP 執行階段位於主機端；要求者工作階段處於沙箱中。                                                              | 從沙箱化工作階段使用 `runtime="subagent"`，或從非沙箱化工作階段產生 ACP。                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | 為 ACP 執行階段要求 `sandbox="require"`。                                                                         | 若必須使用沙箱，請使用 `runtime="subagent"`；或從非沙箱化工作階段搭配 `sandbox="inherit"` 使用 ACP。                                                      |
| `Cannot apply --model ... did not advertise model support`                                | 目標控制介面未公開通用 ACP 模型切換功能。                                                        | 使用有宣告 ACP `models`/`session/set_model` 的控制介面、使用 Codex ACP 模型參照，或在控制介面有自己的啟動旗標時直接於其中設定模型。 |
| 繫結工作階段缺少 ACP 中繼資料                                                    | ACP 工作階段中繼資料過期／已刪除。                                                                                    | 使用 `/acp spawn` 重新建立，然後重新繫結／聚焦討論串。                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 會在非互動式 ACP 工作階段中阻擋寫入／執行操作。                                                    | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動閘道。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。 |
| ACP 工作階段提早失敗且幾乎沒有輸出                                                | 權限提示遭 `permissionMode`/`nonInteractivePermissions` 阻擋。                                        | 檢查閘道日誌中的 `AcpRuntimeError`。若要取得完整權限，請設定 `permissionMode=approve-all`；若要優雅降級，請設定 `nonInteractivePermissions=deny`。        |
| ACP 工作階段完成工作後無限期停滯                                     | 控制介面處理程序已完成，但 ACP 工作階段未回報完成。                                                    | 更新 OpenClaw；目前的 acpx 清理機制會在關閉及閘道啟動時終止由 OpenClaw 擁有、已失效的包裝器與配接器處理程序。                                             |
| 控制介面看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | 內部事件信封洩漏至 ACP 邊界之外。                                                                | 更新 OpenClaw 並重新執行完成流程；外部控制介面應只接收純文字完成提示。                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex 掛鉤轉送，而非 ACP/acpx。在已繫結的 Codex 聊天中，使用
`/new` 或 `/reset` 啟動新工作階段；若它成功一次，卻在
下一次原生工具呼叫時再次出現，請重新啟動 Codex app-server 或 OpenClaw 閘道，
而不要重複執行 `/new`。請參閱
[Codex 控制介面疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
</Note>

## 相關內容

- [ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [命令列介面後端](/zh-TW/gateway/cli-backends)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理程式](/zh-TW/tools/subagents)
