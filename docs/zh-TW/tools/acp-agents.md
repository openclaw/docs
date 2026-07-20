---
read_when:
    - 透過 ACP 執行程式碼撰寫工具鏈
    - 在訊息頻道上設定綁定對話的 ACP 工作階段
    - 將訊息頻道對話繫結至持久化 ACP 工作階段
    - 疑難排解 ACP 後端、外掛連接或完成結果傳遞問題
    - 從聊天中操作 /acp 命令
sidebarTitle: ACP agents
summary: 透過 ACP 後端執行外部程式設計工具（Claude Code、Cursor、Gemini CLI、明確指定的 Codex ACP、OpenClaw ACP、OpenCode）
title: ACP 代理程式
x-i18n:
    generated_at: "2026-07-20T00:54:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a2b2b3754e7889f06e65740b9c08e56ec8d01637c286ec2dfa743ae2f7e507e
    source_path: tools/acp-agents.md
    workflow: 16
---

[代理程式用戶端協定 (ACP)](https://agentclientprotocol.com/) 工作階段可讓
OpenClaw 透過 ACP 後端外掛執行外部程式設計工具框架（Claude Code、Cursor、Copilot、Droid、
OpenClaw ACP、OpenCode、Gemini CLI，以及其他支援的 ACPX 工具框架）。
每次啟動都會以[背景任務](/zh-TW/automation/tasks)追蹤。

<Note>
**ACP 是外部工具框架路徑，而非預設的 Codex 路徑。** 原生
Codex app-server 外掛負責 `/codex ...` 控制項，以及代理程式回合所使用的預設
`openai/gpt-*` 內嵌執行環境；ACP 則負責 `/acp ...` 控制項
與 `sessions_spawn({ runtime: "acp" })` 工作階段。

若要讓 Codex 或 Claude Code 直接以外部 MCP 用戶端連線至
現有的 OpenClaw 頻道對話，請使用
[`openclaw mcp serve`](/zh-TW/cli/mcp)，而非 ACP。
</Note>

## 我需要哪個頁面？

| 你想要……                                                                                       | 使用                                  | 備註                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 在目前對話中繫結或控制 Codex                                                                    | `/codex bind`、`/codex threads`       | 啟用 `codex` 外掛時使用原生 Codex app-server 路徑：繫結聊天回覆、轉送圖片、模型／快速模式／權限、停止及引導。ACP 是明確的備援方案 |
| 透過 OpenClaw 執行 Claude Code、Gemini CLI、明確指定的 Codex ACP，或其他外部工具框架              | 本頁                                  | 與聊天繫結的工作階段、`/acp spawn`、`sessions_spawn({ runtime: "acp" })`、背景任務、執行環境控制項                                                                  |
| 將 OpenClaw 閘道工作階段公開為 ACP 伺服器，供編輯器或用戶端使用                                  | [`openclaw acp`](/zh-TW/cli/acp)            | 橋接模式：IDE／用戶端透過 stdio／WebSocket，使用 ACP 與 OpenClaw 通訊                                                                                                       |
| 將本機 AI 命令列介面重複用作純文字備援模型                                                      | [命令列介面後端](/zh-TW/gateway/cli-backends) | 並非 ACP：無 OpenClaw 工具、無 ACP 控制項、無工具框架執行環境                                                                                                              |

## 是否可直接使用？

可以，但必須先安裝官方 ACP 執行環境外掛：

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

原始碼簽出版本可在
`pnpm install` 後使用本機 `extensions/acpx` 工作區外掛。執行 `/acp doctor` 進行就緒檢查。

OpenClaw 只會在 ACP **確實可用**時，告知代理程式如何啟動 ACP：
必須啟用 ACP、分派功能不得停用、目前工作階段不得遭沙箱封鎖，
而且執行環境後端必須已載入且運作正常。只要有任何條件不符，
ACP Skills 和 `sessions_spawn` ACP 指引便會保持隱藏，
避免代理程式建議無法使用的後端。

<AccordionGroup>
  <Accordion title="首次執行注意事項">
    - 若已設定 `plugins.allow`，它會成為限制性的外掛清單，並且**必須**包含 `acpx`，否則已安裝的 ACP 後端會被刻意封鎖（`/acp doctor` 會回報允許清單缺少此項目）。
    - Codex ACP 轉接器隨 `acpx` 外掛提供，並會盡可能在本機啟動。
    - Codex ACP 使用隔離的 `CODEX_HOME` 執行。OpenClaw 會從主機 Codex 設定複製受信任的專案信任項目，以及安全的模型／供應商路由設定（`model`、`model_provider`、`model_reasoning_effort`、`sandbox_mode`，以及安全的 `model_providers.<name>` 欄位）；驗證、通知和掛鉤則只保留在主機設定中。
    - 其他目標工具框架轉接器可能會在首次使用時透過 `npx` 隨需擷取。
    - 該工具框架所需的供應商驗證必須已存在於主機上。
    - 如果主機沒有 npm 或網路存取權，首次執行的轉接器擷取會失敗，直到預先準備好快取，或透過其他方式安裝轉接器為止。

  </Accordion>
  <Accordion title="執行環境先決條件">
    ACP 會啟動實際的外部工具框架程序。OpenClaw 負責路由、
    背景任務狀態、傳遞、繫結及原則；工具框架則負責
    其供應商登入、模型目錄、檔案系統行為及原生工具。

    在歸咎於 OpenClaw 之前，請確認：

    - `/acp doctor` 回報後端已啟用且運作正常。
    - 設定 `acp.allowedAgents` 允許清單時，該清單允許目標 ID。
    - 工具框架命令可在閘道主機上啟動。
    - 該工具框架具備供應商驗證資訊（`claude`、`codex`、`gemini`、`opencode`、`droid` 等）。
    - 該工具框架中存在所選模型——模型 ID 無法跨工具框架通用。
    - 所要求的 `cwd` 存在且可存取，否則請省略 `cwd`，讓後端使用預設值。
    - 權限模式符合工作需求。非互動式工作階段無法點選原生權限提示，因此大量寫入／執行的程式設計作業通常需要可在無人值守狀態下繼續執行的 ACPX 權限設定檔。

  </Accordion>
</AccordionGroup>

OpenClaw 外掛工具和內建 OpenClaw 工具預設**不會**公開給 ACP
工具框架。只有在工具框架應直接呼叫這些工具時，才啟用
[ACP 代理程式——設定](/zh-TW/tools/acp-agents-setup)中的明確 MCP 橋接。

## 支援的工具框架目標

使用 `acpx` 後端時，請將這些 ID 用作 `/acp spawn <id>` 或
`sessions_spawn({ runtime: "acp", agentId: "<id>" })` 目標：

| 工具框架 ID | 一般後端                                       | 備註                                                                                |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`     | Claude Code ACP 轉接器                         | 需要主機上已有 Claude Code 驗證資訊。                                               |
| `codex`      | Codex ACP 轉接器                               | 僅在原生 `/codex` 無法使用或明確要求 ACP 時，作為 ACP 備援方案。 |
| `copilot`    | GitHub Copilot ACP 轉接器                      | 需要 Copilot 命令列介面／執行環境驗證資訊。                                         |
| `cursor`     | Cursor CLI ACP（`cursor-agent acp`）          | 如果本機安裝公開了不同的 ACP 進入點，請覆寫 acpx 命令。                              |
| `droid`      | Factory Droid CLI                              | 需要 Factory／Droid 驗證資訊，或工具框架環境中具備 `FACTORY_API_KEY`。              |
| `fast-agent` | fast-agent-mcp ACP 轉接器                      | 透過 `uvx` 隨需擷取。                                                  |
| `gemini`     | Gemini CLI ACP 轉接器                          | 需要 Gemini CLI 驗證資訊或 API 金鑰設定。                                            |
| `iflow`      | iFlow CLI                                      | 轉接器可用性和模型控制取決於已安裝的命令列介面。                                    |
| `kilocode`   | Kilo Code CLI                                  | 轉接器可用性和模型控制取決於已安裝的命令列介面。                                    |
| `kimi`       | Kimi／Moonshot CLI                             | 需要主機上已有 Kimi／Moonshot 驗證資訊。                                             |
| `kiro`       | Kiro CLI                                       | 轉接器可用性和模型控制取決於已安裝的命令列介面。                                    |
| `mux`        | Mux CLI ACP 轉接器                             | 透過 `npx` 隨需擷取。                                                   |
| `opencode`   | OpenCode ACP 轉接器                            | 需要 OpenCode 命令列介面／供應商驗證資訊。                                          |
| `openclaw`   | 透過 `openclaw acp` 的 OpenClaw 閘道橋接  | 讓支援 ACP 的工具框架與 OpenClaw 閘道工作階段通訊。                                 |
| `qoder`      | Qoder CLI                                      | 轉接器可用性和模型控制取決於已安裝的命令列介面。                                    |
| `qwen`       | Qwen Code／Qwen CLI                            | 需要主機上已有與 Qwen 相容的驗證資訊。                                               |
| `trae`       | Trae CLI ACP 轉接器                            | 轉接器可用性和模型控制取決於已安裝的命令列介面。                                    |

`pi`（pi-acp）也已在 acpx 後端中註冊，但其性質與上述其他項目不同，
並非同類的程式設計工具框架。

可在 acpx 本身設定自訂 acpx 代理程式別名，但 OpenClaw
原則仍會在分派前檢查 `acp.allowedAgents` 及任何
`agents.list[].runtime.acp.agent` 對應。

## 操作人員執行手冊

從聊天快速執行 `/acp` 的流程：

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
    不取代內容脈絡：`/acp steer tighten logging and continue`。
  </Step>
  <Step title="停止">
    `/acp cancel`（目前回合）或 `/acp close`（工作階段與繫結）。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="生命週期詳細資訊">
    - 產生或恢復 ACP 執行階段工作階段、在 OpenClaw 工作階段儲存區中記錄 ACP 中繼資料，並可能在執行由父項擁有時建立背景任務。
    - 由父項擁有的 ACP 工作階段會視為背景工作，即使執行階段工作階段是持久的；完成通知與跨介面傳遞會透過父項任務通知器進行，而不會像一般面向使用者的聊天工作階段一樣運作。
    - 任務維護會關閉已終止或孤立且由父項擁有的一次性 ACP 工作階段。只要仍有作用中的對話繫結，持久 ACP 工作階段就會保留；沒有作用中繫結的過時持久工作階段則會關閉，避免在擁有該工作階段的任務完成或其任務記錄消失後遭到無聲恢復。
    - 繫結的後續訊息會直接傳送至 ACP 工作階段，直到繫結遭到關閉、取消聚焦、重設或過期。
    - 閘道命令會留在本機。`/acp ...`、`/status` 和 `/unfocus` 絕不會以一般提示文字傳送至已繫結的 ACP 控制框架。
    - `cancel` 會在後端支援取消時中止作用中的輪次；它不會刪除繫結或工作階段中繼資料。
    - `close` 會從 OpenClaw 的角度結束 ACP 工作階段並移除繫結。若控制框架支援恢復，它仍可能保留自己的上游歷程記錄。
    - acpx 外掛會在 `close` 之後清理 OpenClaw 擁有的包裝器與轉接器處理程序樹，並在閘道啟動期間清除過時且由 OpenClaw 擁有的 ACPX 孤立處理程序。
    - 閒置的執行階段工作處理程序在內建閒置期間過後可被清理；儲存的工作階段中繼資料仍可供 `/acp sessions` 使用。

  </Accordion>
  <Accordion title="原生 Codex 路由規則">
    啟用時，應路由至**原生 Codex 外掛**的自然語言觸發語句：

    - “將此 Discord 頻道繫結至 Codex。”
    - “將此聊天附加至 Codex 討論串 `<id>`。”
    - “顯示 Codex 討論串，然後繫結這一個。”

    原生 Codex 對話繫結是預設的聊天控制路徑。
    OpenClaw 動態工具仍透過 OpenClaw 執行，而 shell/apply-patch
    等 Codex 原生工具則在 Codex 內執行。對於 Codex 原生
    工具事件，OpenClaw 會為每個輪次注入原生掛鉤轉送器，讓外掛掛鉤
    能阻擋 `before_tool_call`、觀察 `after_tool_call`，並透過 OpenClaw 核准機制路由 Codex
    `PermissionRequest` 事件。Codex `Stop` 掛鉤
    會轉送至 OpenClaw `before_agent_finalize`，外掛可在該處要求
    Codex 完成回答前再執行一次模型處理。此轉送器刻意保持
    保守：它不會修改 Codex 原生工具引數，
    也不會重寫 Codex 討論串記錄。只有在需要
    ACP 執行階段／工作階段模型時，才使用明確的 ACP。嵌入式 Codex 支援邊界記載於
    [Codex 控制框架 v1 支援合約](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

  </Accordion>
  <Accordion title="模型／提供者／執行階段選擇速查表">
    - 舊版 Codex 模型參照 — 由 doctor 修復的舊版 Codex OAuth／訂閱模型路由。
    - `openai/*` — 用於 OpenAI 代理程式輪次的原生 Codex app-server 嵌入式執行階段。
    - `/codex ...` — 原生 Codex 對話控制。
    - `/acp ...` 或 `runtime: "acp"` — 明確的 ACP／acpx 控制。

  </Accordion>
  <Accordion title="ACP 路由自然語言觸發語句">
    應路由至 ACP 執行階段的觸發語句：

    - “將此作為一次性 Claude Code ACP 工作階段執行，並摘要結果。”
    - “在討論串中使用 Gemini 命令列介面執行此任務，然後讓後續訊息留在同一討論串中。”
    - “透過 ACP 在背景討論串中執行 Codex。”

    OpenClaw 會選擇 `runtime: "acp"`、解析控制框架 `agentId`，在支援時繫結至
    目前的對話或討論串，並將後續訊息路由至該工作階段，
    直到關閉／過期為止。只有明確指定 ACP／acpx，或原生 Codex 外掛
    無法用於所要求的操作時，Codex 才會採用此路徑。

    對於 `sessions_spawn`，只有在 ACP
    已啟用、要求者未受沙箱限制，且已載入 ACP 執行階段後端時，
    才會公開 `runtime: "acp"`。`acp.dispatch.enabled=false` 會暫停 ACP 討論串的自動分派，
    但不會隱藏或阻擋明確的 `sessions_spawn({ runtime: "acp" })`
    呼叫。它以 `codex`、`claude`、`droid`、
    `gemini` 或 `opencode` 等 ACP 控制框架 ID 為目標。除非
    `agents_list` 中的一般 OpenClaw 設定代理程式 ID 項目已明確設定
    `agents.list[].runtime.type="acp"`，否則不要傳入該 ID；請改用預設的子代理程式
    執行階段。當 OpenClaw 代理程式設定了
    `runtime.type="acp"` 時，OpenClaw 會使用 `runtime.acp.agent` 作為底層
    控制框架 ID。

  </Accordion>
</AccordionGroup>

## ACP 與子代理程式的比較

需要外部控制框架執行階段時，請使用 ACP。啟用 `codex` 外掛時，
請使用**原生 Codex app-server** 進行 Codex 對話繫結／控制。
需要 OpenClaw 原生委派執行時，請使用**子代理程式**。

| 領域          | ACP 工作階段                           | 子代理程式執行                      |
| ------------- | ------------------------------------- | ---------------------------------- |
| 執行階段       | ACP 後端外掛（例如 acpx） | OpenClaw 原生子代理程式執行階段  |
| 工作階段索引鍵   | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| 主要命令 | `/acp ...`                            | `/subagents ...`                   |
| 產生工具    | `sessions_spawn` 搭配 `runtime:"acp"` | `sessions_spawn`（預設執行階段） |

另請參閱[子代理程式](/zh-TW/tools/subagents)。

## ACP 如何執行 Claude Code

透過 ACP 執行 Claude Code 時，堆疊如下：

1. OpenClaw ACP 工作階段控制平面。
2. 官方 `@openclaw/acpx` 執行階段外掛。
3. Claude ACP 轉接器。
4. Claude 端執行階段／工作階段機制。

ACP Claude 是具備 ACP 控制、工作階段恢復、
背景任務追蹤，以及選用對話／討論串繫結的**控制框架工作階段**。

命令列介面後端是獨立、僅限文字的本機備援執行階段，請參閱
[命令列介面後端](/zh-TW/gateway/cli-backends)。

對操作人員而言，實務規則如下：

- **需要 `/acp spawn`、可繫結工作階段、執行階段控制或持久控制框架工作？** 請使用 ACP。
- **需要透過原始命令列介面進行簡單的本機文字備援？** 請使用命令列介面後端。

## 繫結的工作階段

### 心智模型

- **聊天介面** — 使用者持續交談的位置（Discord 頻道、Telegram 主題、iMessage 聊天）。
- **ACP 工作階段** — OpenClaw 路由至的持久 Codex／Claude／Gemini 執行階段狀態。
- **子討論串／主題** — 僅由 `--thread ...` 建立的選用額外訊息介面。
- **執行階段工作區** — 控制框架執行所在的檔案系統位置（`cwd`、儲存庫簽出、後端工作區）。它與聊天介面彼此獨立。

### 目前對話繫結

`/acp spawn <harness> --bind here` 會將目前對話固定至
已產生的 ACP 工作階段——不建立子討論串，並使用相同的聊天介面。OpenClaw 仍
負責傳輸、驗證、安全性與傳遞。該
對話中的後續訊息會路由至同一工作階段；`/new` 和 `/reset` 會就地重設工作階段；
`/acp close` 則移除繫結。

範例：

```text
/codex bind                                              # 原生 Codex 繫結，將後續訊息路由至此處
/codex model gpt-5.4                                     # 調整已繫結的原生 Codex 討論串
/codex stop                                              # 控制作用中的原生 Codex 輪次
/acp spawn codex --bind here                             # Codex 的明確 ACP 備援
/acp spawn codex --thread auto                           # 可能建立子討論串／主題並在該處繫結
/acp spawn codex --bind here --cwd /workspace/repo       # 使用相同聊天繫結，Codex 在 /workspace/repo 中執行
```

<AccordionGroup>
  <Accordion title="繫結規則與互斥性">
    - `--bind here` 和 `--thread ...` 互斥。
    - `--bind here` 僅適用於宣告支援目前對話繫結的頻道；否則 OpenClaw 會傳回清楚的不支援訊息。繫結會在閘道重新啟動後保留。
    - 在 Discord 上，`spawnSessions` 控制 `--thread auto|here` 的子討論串建立，而非 `--bind here`。
    - 如果未指定 `--cwd` 而產生至不同的 ACP 代理程式，OpenClaw 預設會繼承**目標代理程式的**工作區。缺少繼承路徑（`ENOENT`／`ENOTDIR`）時會改用後端預設值；其他存取錯誤（例如 `EACCES`）則會顯示為產生錯誤。
    - 在繫結的對話中，閘道管理命令會留在本機——即使一般後續文字會路由至已繫結的 ACP 工作階段，`/acp ...` 命令仍由 OpenClaw 處理；只要該介面已啟用命令處理，`/status` 和 `/unfocus` 也會留在本機。

  </Accordion>
  <Accordion title="討論串繫結工作階段">
    為頻道轉接器啟用討論串繫結時：

    - OpenClaw 會將討論串繫結至目標 ACP 工作階段。
    - 該討論串中的後續訊息會路由至已繫結的 ACP 工作階段。
    - ACP 輸出會傳回同一討論串。
    - 取消聚焦／關閉／封存／閒置逾時或最長存續時間到期時，會移除繫結。
    - `/acp close`、`/acp cancel`、`/acp status`、`/status` 和 `/unfocus` 是閘道命令，不是傳送給 ACP 控制框架的提示。

    討論串繫結 ACP 所需的功能旗標：

    - `acp.enabled=true`
    - `acp.dispatch.enabled` 預設開啟（將 `false` 設定為暫停 ACP 討論串的自動分派；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作）。
    - 啟用頻道轉接器討論串工作階段產生（預設值：`true`）：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`

    討論串繫結支援因轉接器而異。如果作用中的頻道轉接器
    不支援討論串繫結，OpenClaw 會傳回清楚的
    不支援／無法使用訊息。

  </Accordion>
  <Accordion title="支援討論串的頻道">
    - 任何公開工作階段／討論串繫結能力的頻道轉接器。
    - 目前的內建支援：**Discord** 討論串／頻道、**Telegram** 主題（群組／超級群組中的論壇主題及私訊主題）。
    - 外掛頻道可透過相同的繫結介面新增支援。

  </Accordion>
</AccordionGroup>

## 持久頻道繫結

對於非暫時性工作流程，請在頂層
`bindings[]` 項目中設定持久 ACP 繫結。

### 繫結模型

<ParamField path="bindings[].type" type='"acp"'>
  標記持久 ACP 對話繫結。
</ParamField>
<ParamField path="bindings[].match" type="object">
  識別目標對話。各頻道的格式：

- **Discord 頻道/討論串：** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Slack 頻道/私訊：** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`。建議使用穩定的 Slack ID；頻道繫結也會比對該頻道討論串內的回覆。
- **Telegram 論壇主題：** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **WhatsApp 私訊/群組：** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`。直接聊天請使用 E.164 號碼，例如 `+15555550123`；群組請使用 WhatsApp 群組 JID，例如 `120363424282127706@g.us`。
- **iMessage 私訊/群組：** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`。建議使用 `chat_id:*`，以獲得穩定的群組繫結。

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  所屬 OpenClaw 代理程式的 ID。
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

使用 `agents.list[].runtime` 為每個代理程式定義一次 ACP 預設值：

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent`（工具框架 ID，例如 `codex` 或 `claude`）
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

- 在通過頻道特定的准入檢查後、使用前，OpenClaw 會確保已設定的 ACP 工作階段存在。
- 該頻道、主題或聊天中的訊息會路由至已設定的 ACP 工作階段。
- 已設定的 ACP 繫結擁有其工作階段路由。對於相符的繫結，頻道廣播扇出不會取代已設定的 ACP 工作階段。
- 在已繫結的對話中，`/new` 和 `/reset` 會就地重設同一個 ACP 工作階段金鑰。
- 暫時性執行階段繫結（例如由討論串焦點流程建立）仍會在存在時套用。
- 對於未明確指定 `cwd` 的跨代理程式 ACP 產生作業，OpenClaw 會從代理程式設定繼承目標代理程式工作區。
- 若繼承的工作區路徑不存在，則回退至後端預設的 cwd；若路徑存在但存取失敗，則顯示為產生錯誤。

## 啟動 ACP 工作階段

啟動 ACP 工作階段有兩種方式：

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
    `runtime` 預設為 `subagent`，因此 ACP 工作階段請明確設定 `runtime: "acp"`。若省略 `agentId`，OpenClaw 會在已設定時使用 `acp.defaultAgent`。`mode: "session"` 必須搭配 `thread: true`，才能保留持續性的繫結對話。
    </Note>

  </Tab>
  <Tab title="從 /acp 命令">
    使用 `/acp spawn`，從聊天中進行明確的操作人員控制。

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
  傳送至 ACP 工作階段的初始提示詞。
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  ACP 工作階段必須為 `"acp"`。
</ParamField>
<ParamField path="agentId" type="string">
  ACP 目標工具框架 ID。若已設定，則回退至 `acp.defaultAgent`。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  在支援時要求討論串繫結流程。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` 為單次執行；`"session"` 為持續性。若為 `thread: true` 且省略 `mode`，OpenClaw 可能會依執行階段路徑預設為持續性行為。`mode: "session"` 必須搭配 `thread: true`。
</ParamField>
<ParamField path="cwd" type="string">
  要求的執行階段工作目錄（由後端/執行階段原則驗證）。
  若省略，ACP 產生作業會在已設定時繼承目標代理程式工作區；
  若繼承的路徑不存在，則回退至後端預設值，而實際的存取
  錯誤則會傳回。
</ParamField>
<ParamField path="label" type="string">
  用於工作階段/橫幅文字的操作人員可見標籤。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  繼續既有的 ACP 工作階段，而非建立新的工作階段。代理程式會透過
  `session/load` 重播其對話歷程。必須搭配
  `runtime: "acp"`。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` 會將初始 ACP 執行進度摘要以系統事件串流回要求者
  工作階段。OpenClaw 會將完整的轉送歷程記錄於子代理程式的 SQLite
  狀態，並隨子工作階段一併移除。除非
  `streaming.progress.commentary=false`，否則父工作階段進度串流預設會顯示助理註解與 ACP
  狀態進度。若未設定串流模式，Discord 的父工作階段
  預覽也會預設使用進度模式。狀態進度仍會遵循 `acp.stream.tagVisibility`，
  因此 `plan` 等標記除非明確啟用，否則仍會隱藏。
</ParamField>

ACP `sessions_spawn` 執行會使用 `agents.defaults.subagents.runTimeoutSeconds`
作為其預設子回合限制。此工具不接受個別呼叫的逾時覆寫
（`runTimeoutSeconds`/`timeoutSeconds` 會遭拒絕，並傳回要求設定預設值的錯誤）。

<ParamField path="model" type="string">
  ACP 子工作階段的明確模型覆寫設定。Codex ACP 產生作業會在
  `session/new` 前，將 `openai/gpt-5.4` 等 OpenAI 參照正規化為
  Codex ACP 啟動設定；`openai/gpt-5.4/high` 等斜線形式也會設定
  Codex ACP 推理強度。若省略，`sessions_spawn({ runtime: "acp" })`
  會在已設定時使用既有的子代理程式模型預設值（`agents.defaults.subagents.model` 或
  `agents.list[].subagents.model`）；否則會讓 ACP
  工具框架使用其自身的預設模型。其他工具框架必須宣告 ACP
  `models` 並支援 `session/set_model`；否則 OpenClaw/acpx 會
  明確失敗，而不會無聲地回退至目標代理程式的預設值。
</ParamField>
<ParamField path="thinking" type="string">
  明確的思考/推理強度。對 Codex ACP 而言，`minimal` 會對應至低
  強度，`low`/`medium`/`high`/`xhigh` 會直接對應，而 `off` 會省略
  推理強度啟動覆寫。若省略，ACP 產生作業會使用既有的
  子代理程式思考預設值，以及所選模型的個別模型
  `agents.defaults.models["provider/model"].params.thinking`。
</ParamField>

## 產生作業的繫結與討論串模式

<Tabs>
  <Tab title="--bind here|off">
    | 模式   | 行為                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | 就地繫結目前的作用中對話；若沒有作用中對話則失敗。 |
    | `off`  | 不建立目前對話的繫結。                          |

    注意事項：

    - `--bind here` 是「讓此頻道或聊天由 Codex 支援」最簡單的操作人員路徑。
    - `--bind here` 不會建立子討論串。
    - `--bind here` 僅適用於提供目前對話繫結支援的頻道。
    - `--bind` 和 `--thread` 無法在同一個 `/acp spawn` 呼叫中合併使用。

  </Tab>
  <Tab title="--thread auto|here|off">
    | 模式   | 行為                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | 位於作用中討論串時：繫結該討論串。位於討論串外時：在支援時建立/繫結子討論串。 |
    | `here` | 必須位於目前的作用中討論串；若不在討論串中則失敗。                                                  |
    | `off`  | 不繫結。工作階段以未繫結狀態啟動。                                                                 |

    注意事項：

    - 在非討論串繫結介面上，預設行為實際上等同於 `off`。
    - 討論串繫結的產生作業需要頻道原則支援：
      - Discord：`channels.discord.threadBindings.spawnSessions=true`
      - Telegram：`channels.telegram.threadBindings.spawnSessions=true`
    - 若要固定目前對話而不建立子討論串，請使用 `--bind here`。

  </Tab>
</Tabs>

## 傳遞模型

ACP 工作階段可以是互動式工作區，也可以是由父工作階段擁有的背景
工作。傳遞路徑取決於其形式。

<AccordionGroup>
  <Accordion title="互動式 ACP 工作階段">
    互動式工作階段旨在於可見的聊天介面上持續對話：

    - `/acp spawn ... --bind here` 會將目前對話繫結至 ACP 工作階段。
    - `/acp spawn ... --thread ...` 會將頻道討論串/主題繫結至 ACP 工作階段。
    - 持續性設定的 `bindings[].type="acp"` 會將相符的對話路由至同一個 ACP 工作階段。

    已繫結對話中的後續訊息會直接路由至 ACP
    工作階段，而 ACP 輸出則會傳回同一個
    頻道/討論串/主題。

    OpenClaw 傳送至工具框架的內容：

    - 一般的有界後續互動會以提示文字傳送，且僅在控管工具／後端支援時附帶附件。
    - `/acp` 管理命令與本機閘道命令會在分派至 ACP 前被攔截。
    - 執行階段產生的完成事件會依各目標具體化。OpenClaw 代理程式會取得 OpenClaw 的內部執行階段情境封套；外部 ACP 控管工具則會取得包含子項結果與指示的純文字提示。絕不應將原始 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` 封套傳送至外部控管工具，或將其持久保存為 ACP 使用者逐字記錄文字。
    - ACP 逐字記錄項目會使用使用者可見的觸發文字或純文字完成提示。內部事件中繼資料會盡可能在 OpenClaw 中保持結構化，且不會視為使用者撰寫的聊天內容。

  </Accordion>
  <Accordion title="由父項擁有的單次 ACP 工作階段">
    由另一個代理程式執行所衍生的單次 ACP 工作階段，是類似子代理程式的
    背景子項：

    - 父項使用 `sessions_spawn({ runtime: "acp", mode: "run" })` 要求執行工作。
    - 子項會在自己的 ACP 控管工具工作階段中執行。
    - 子項回合會在原生子代理程式衍生所使用的相同背景通道上執行，因此緩慢的 ACP 控管工具不會阻擋無關的主工作階段工作。
    - 完成結果會透過工作完成公告路徑回報。OpenClaw 會先將內部完成中繼資料轉換為純文字 ACP 提示，再傳送至外部控管工具，因此控管工具不會看到僅供 OpenClaw 使用的執行階段情境標記。
    - 當適合提供面向使用者的回覆時，父項會以一般助理語氣重寫子項結果。

    **不要**將此路徑視為父項與子項之間的點對點聊天。
    子項已有將完成結果回傳給父項的通道。

  </Accordion>
  <Accordion title="sessions_send 與 A2A 傳遞">
    `sessions_send` 可在衍生後以另一個工作階段為目標。對於一般對等
    工作階段，OpenClaw 會在注入訊息後使用代理程式對代理程式（A2A）
    後續互動路徑：

    - 等待目標工作階段的回覆。
    - 選擇性允許請求端與目標交換有限次數的後續回合。
    - 要求目標產生公告訊息。
    - 將該公告傳遞至可見的頻道或討論串。

    該 A2A 路徑是對等傳送的備援機制，適用於傳送端需要
    可見後續互動的情況。當無關的工作階段可以查看 ACP 目標並
    向其傳送訊息時，此路徑仍會啟用，例如使用寬鬆的 `tools.sessions.visibility`
    設定時。

    只有當請求端是其自身由父項擁有的單次 ACP 子項之父項時，
    OpenClaw 才會略過 A2A 後續互動。在此情況下，若在工作完成機制上
    疊加執行 A2A，可能會用子項結果喚醒父項、將父項的回覆轉送回子項，
    並形成父項／子項回音迴圈。對於這種自有子項情況，
    `sessions_send` 結果會回報 `delivery.status="skipped"`，因為完成路徑
    已負責處理該結果。

  </Accordion>
  <Accordion title="繼續現有工作階段">
    使用 `resumeSessionId` 繼續先前的 ACP 工作階段，而不是
    重新開始。代理程式會透過 `session/load` 重播其對話歷史，
    因此能帶著先前內容的完整情境繼續執行。

    ```json
    {
      "task": "從上次中斷處繼續——修正剩餘的測試失敗",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    常見使用案例：

    - 將 Codex 工作階段從你的筆記型電腦交接至手機——告訴你的代理程式從上次中斷處繼續。
    - 繼續你先前在命令列介面中以互動方式啟動的程式設計工作階段，現在透過你的代理程式以無介面方式執行。
    - 繼續因閘道重新啟動或閒置逾時而中斷的工作。

    注意事項：

    - `resumeSessionId` 僅在 `runtime: "acp"` 時適用；預設子代理程式執行階段會忽略此 ACP 專用欄位。
    - `streamTo` 僅在 `runtime: "acp"` 時適用；預設子代理程式執行階段會忽略此 ACP 專用欄位。
    - `resumeSessionId` 是主機本機的 ACP／控管工具繼續識別碼，而不是 OpenClaw 頻道工作階段金鑰；OpenClaw 在分派前仍會檢查 ACP 衍生原則與目標代理程式原則，而載入該上游識別碼的授權則由 ACP 後端或控管工具負責。
    - `resumeSessionId` 會還原上游 ACP 對話歷史；`thread` 與 `mode` 仍會正常套用至你正在建立的新 OpenClaw 工作階段，因此 `mode: "session"` 仍需要 `thread: true`。
    - 目標代理程式必須支援 `session/load`（Codex 與 Claude Code 均支援）。
    - 若找不到工作階段識別碼，衍生作業會失敗並顯示清楚的錯誤，不會無聲地改用新工作階段。

  </Accordion>
  <Accordion title="部署後冒煙測試">
    部署閘道後，請執行即時端對端檢查，而非僅信任
    單元測試：

    1. 驗證目標主機上已部署的閘道版本與提交。
    2. 開啟連線至即時代理程式的暫時 ACPX 橋接工作階段。
    3. 要求該代理程式使用 `runtime: "acp"`、`agentId: "codex"`、`mode: "run"` 以及工作 `Reply with exactly LIVE-ACP-SPAWN-OK` 呼叫 `sessions_spawn`。
    4. 驗證 `accepted=yes`、實際的 `childSessionKey`，且沒有驗證器錯誤。
    5. 清理暫時橋接工作階段。

    將關卡維持在 `mode: "run"`，並略過 `streamTo: "parent"`——
    繫結至討論串的 `mode: "session"` 與串流中繼路徑是個別且更完整的
    整合測試流程。

  </Accordion>
</AccordionGroup>

## 沙箱相容性

ACP 工作階段目前在主機執行階段上執行，**而非**在 OpenClaw
沙箱內。

<Warning>
**安全性邊界：**

- 外部控管工具可依其自身的命令列介面權限及所選的 `cwd` 進行讀取／寫入。
- OpenClaw 的沙箱原則**不會**包覆 ACP 控管工具的執行。
- OpenClaw 仍會強制執行 ACP 功能關卡、允許的代理程式、工作階段擁有權、頻道繫結及閘道傳遞原則。
- 需要由沙箱強制執行的 OpenClaw 原生工作時，請使用 `runtime: "subagent"`。

</Warning>

目前限制：

- 若請求端工作階段位於沙箱中，`sessions_spawn({ runtime: "acp" })` 與 `/acp spawn` 的 ACP 衍生作業都會遭到阻擋。
- 搭配 `runtime: "acp"` 的 `sessions_spawn` 不支援 `sandbox: "require"`。

## 工作階段目標解析

大多數 `/acp` 動作都接受選用的工作階段目標（`session-key`、
`session-id` 或 `session-label`）。

**解析順序：**

1. 明確的目標引數（或 `/acp steer` 的 `--session`）
   - 先嘗試金鑰
   - 接著嘗試 UUID 格式的工作階段識別碼
   - 再嘗試標籤
2. 目前的討論串繫結（若此對話／討論串已繫結至 ACP 工作階段）。
3. 目前請求端工作階段的備援解析。

目前對話繫結與討論串繫結都會參與步驟 2。

若無法解析任何目標，OpenClaw 會傳回清楚的錯誤
（`Unable to resolve session target: ...`）。

## ACP 控制項

| 命令              | 功能                                              | 範例                                                       |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | 建立 ACP 工作階段；可選擇目前繫結或討論串繫結。 | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | 取消目標工作階段進行中的回合。                 | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | 將引導指示傳送至執行中的工作階段。                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | 關閉工作階段並解除討論串目標的繫結。                  | `/acp close`                                                  |
| `/acp status`        | 顯示後端、模式、狀態、執行階段選項與功能。 | `/acp status`                                                 |
| `/acp set-mode`      | 設定目標工作階段的執行階段模式。                      | `/acp set-mode plan`                                          |
| `/acp set`           | 寫入通用執行階段設定選項。                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | 設定執行階段工作目錄覆寫。                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | 設定核准原則設定檔。                              | `/acp permissions strict`                                     |
| `/acp timeout`       | 設定執行階段逾時（秒）。                            | `/acp timeout 120`                                            |
| `/acp model`         | 設定執行階段模型覆寫。                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | 移除工作階段的執行階段選項覆寫。                  | `/acp reset-options`                                          |
| `/acp sessions`      | 列出儲存區中近期的 ACP 工作階段。                      | `/acp sessions`                                               |
| `/acp doctor`        | 顯示後端健康狀態、功能與可採取的修正措施。           | `/acp doctor`                                                 |
| `/acp install`       | 輸出確定性的安裝與啟用步驟。             | `/acp install`                                                |

執行階段控制項（`spawn`、`cancel`、`steer`、`close`、`status`、`set-mode`、
`set`、`cwd`、`permissions`、`timeout`、`model` 及 `reset-options`）需要
外部頻道提供擁有者身分，而內部閘道用戶端則需提供 `operator.admin`。
已獲授權但非擁有者的傳送端仍可使用 `sessions`、
`doctor`、`install` 及 `help`。對於非擁有者傳送端，`/acp sessions`
僅會列出目前繫結或請求端的工作階段；擁有者身分與
`operator.admin` 用戶端則可查看所有近期工作階段。

`/acp status` 會顯示生效的執行階段選項，以及執行階段層級與
後端層級的工作階段識別碼。當後端缺少某項功能時，
不支援的控制項錯誤會清楚顯示。接受目標權杖的命令
（`session-key`、`session-id` 或 `session-label`）會透過閘道
工作階段探索來解析，包括每個代理程式自訂的 `session.store` 根目錄。`/acp sessions`
不接受目標權杖。

### 執行階段選項對應

`/acp` 提供便利命令與通用設定器。等效操作：

| 命令                         | 對應至                               | 備註                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | 執行階段設定鍵 `model`           | 對於 Codex ACP，OpenClaw 會將 `openai/<model>` 正規化為配接器模型 ID，並將斜線推理後綴（例如 `openai/gpt-5.4/high`）對應至 `reasoning_effort`。                                         |
| `/acp set thinking <level>`  | 標準選項 `thinking`          | 若後端有公告對等項目，OpenClaw 會傳送該項目，依序優先採用 `thinking`、`effort`、`reasoning_effort` 或 `thought_level`。對於 Codex ACP，配接器會將值對應至 `reasoning_effort`。 |
| `/acp permissions <profile>` | 標準選項 `permissionProfile` | 若後端有公告對等項目，OpenClaw 會傳送該項目，例如 `approval_policy`、`permission_profile`、`permissions` 或 `permission_mode`。                                                       |
| `/acp timeout <seconds>`     | 標準選項 `timeoutSeconds`    | 若後端有公告對等項目，OpenClaw 會傳送該項目，例如 `timeout` 或 `timeout_seconds`。                                                                                                     |
| `/acp cwd <path>`            | 執行階段目前工作目錄覆寫                 | 直接更新。                                                                                                                                                                                             |
| `/acp set <key> <value>`     | 通用                              | `key=cwd` 使用目前工作目錄覆寫路徑。                                                                                                                                                                      |
| `/acp reset-options`         | 清除所有執行階段覆寫         | -                                                                                                                                                                                                          |

## acpx 測試框架、外掛設定與權限

如需 acpx 測試框架設定（Claude Code／Codex／Gemini 命令列介面別名）、
plugin-tools 與 OpenClaw-tools MCP 橋接器，以及 ACP 權限模式的相關資訊，
請參閱 [ACP 代理程式－設定](/zh-TW/tools/acp-agents-setup)。

## 疑難排解

| 症狀                                                                                      | 可能原因                                                                                                               | 修正方式                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | 缺少後端外掛、外掛已停用，或遭 `plugins.allow` 封鎖。                                                       | 安裝並啟用後端外掛；若已設定該允許清單，請在 `plugins.allow` 中加入 `acpx`，然後執行 `/acp doctor`。                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP 已全域停用。                                                                                                 | 設定 `acp.enabled=true`。                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | 已停用從一般討論串訊息自動分派。                                                               | 設定 `acp.dispatch.enabled=true` 以恢復自動討論串路由；明確的 `sessions_spawn({ runtime: "acp" })` 呼叫仍可運作。                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | 代理程式不在允許清單中。                                                                                                | 使用允許的 `agentId`，或更新 `acp.allowedAgents`。                                                                                                                     |
| `/acp doctor` 在啟動後立即回報後端尚未就緒                               | 缺少後端外掛、外掛已停用、遭允許／拒絕原則封鎖，或其設定的可執行檔無法使用。        | 安裝／啟用後端外掛、重新執行 `/acp doctor`；若後端仍不正常，請檢查後端安裝或原則錯誤。                                           |
| 找不到測試框架命令                                                                 | 未安裝配接器命令列介面、缺少外部外掛，或非 Codex 配接器首次執行時擷取 `npx` 失敗。 | 執行 `/acp doctor`、在閘道主機上安裝／預先準備配接器，或明確設定 acpx 代理程式命令。                                                      |
| 測試框架回報找不到模型                                                          | 模型 ID 對其他供應商／測試框架有效，但對此 ACP 目標無效。                                                | 使用該測試框架列出的模型、在測試框架中設定模型，或省略覆寫。                                                                            |
| 測試框架回報供應商驗證錯誤                                                        | OpenClaw 運作正常，但目標命令列介面／供應商尚未登入。                                                     | 登入，或在閘道主機環境中提供必要的供應商金鑰。                                                                                             |
| `Unable to resolve session target: ...`                                                   | 金鑰／ID／標籤權杖錯誤。                                                                                                | 執行 `/acp sessions`、複製確切的金鑰／標籤，然後重試。                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | 在沒有可繫結的作用中對話時使用了 `--bind here`。                                                            | 移至目標聊天／頻道後重試，或使用未繫結的產生方式。                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | 配接器不具備目前對話的 ACP 繫結功能。                                                             | 在支援的情況下使用 `/acp spawn ... --thread ...`、設定頂層 `bindings[]`，或移至支援的頻道。                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | 在討論串情境外使用了 `--thread here`。                                                                         | 移至目標討論串，或使用 `--thread auto`/`off`。                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | 另一位使用者擁有作用中的繫結目標。                                                                           | 以擁有者身分重新繫結，或使用不同的對話或討論串。                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | 配接器不具備討論串繫結功能。                                                                               | 使用 `--thread off`，或移至支援的配接器／頻道。                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | ACP 執行階段位於主機端；要求者工作階段位於沙箱中。                                                              | 從沙箱工作階段使用 `runtime="subagent"`，或從非沙箱工作階段產生 ACP。                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | 為 ACP 執行階段要求了 `sandbox="require"`。                                                                         | 如需沙箱隔離，請使用 `runtime="subagent"`；或從非沙箱工作階段搭配 `sandbox="inherit"` 使用 ACP。                                                      |
| `Cannot apply --model ... did not advertise model support`                                | 目標測試框架未公開通用 ACP 模型切換功能。                                                        | 使用會公告 ACP `models`/`session/set_model` 的測試框架、使用 Codex ACP 模型參照，或在測試框架具有自身啟動旗標時直接於其中設定模型。 |
| 繫結工作階段缺少 ACP 中繼資料                                                    | ACP 工作階段中繼資料過時／已刪除。                                                                                    | 使用 `/acp spawn` 重新建立，然後重新繫結／聚焦討論串。                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` 會阻擋非互動式 ACP 工作階段中的寫入／執行操作。                                                    | 將 `plugins.entries.acpx.config.permissionMode` 設為 `approve-all`，並重新啟動閘道。請參閱[權限設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。 |
| ACP 工作階段提早失敗且輸出很少                                                | 權限提示遭 `permissionMode`/`nonInteractivePermissions` 阻擋。                                        | 檢查閘道記錄中的 `AcpRuntimeError`。如需完整權限，請設定 `permissionMode=approve-all`；如需優雅降級，請設定 `nonInteractivePermissions=deny`。        |
| ACP 工作階段完成工作後無限期停滯                                     | 測試框架程序已結束，但 ACP 工作階段未回報完成。                                                    | 更新 OpenClaw；目前的 acpx 清理機制會在關閉及閘道啟動時，終止由 OpenClaw 擁有且已過時的包裝器與配接器程序。                                             |
| 測試框架看到 `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | 內部事件封套洩漏至 ACP 邊界之外。                                                                | 更新 OpenClaw 並重新執行完成流程；外部測試框架應只收到純文字完成提示。                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` 屬於
原生 Codex 鉤子中繼，而非 ACP/acpx。在已繫結的 Codex 聊天中，使用
`/new` 或 `/reset` 啟動新的工作階段；如果它成功一次，但在
下一次原生工具呼叫時再次出現，請重新啟動 Codex 應用程式伺服器或 OpenClaw 閘道，
而不要重複執行 `/new`。請參閱
[Codex 測試框架疑難排解](/zh-TW/plugins/codex-harness#troubleshooting)。
</Note>

## 相關資訊

- [ACP 代理程式 - 設定](/zh-TW/tools/acp-agents-setup)
- [代理程式傳送](/zh-TW/tools/agent-send)
- [命令列介面後端](/zh-TW/gateway/cli-backends)
- [Codex 測試框架](/zh-TW/plugins/codex-harness)
- [Codex 測試框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [多代理程式沙箱工具](/zh-TW/tools/multi-agent-sandbox-tools)
- [`openclaw acp`（橋接模式）](/zh-TW/cli/acp)
- [子代理程式](/zh-TW/tools/subagents)
