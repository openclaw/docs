---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生代理執行環境之間進行選擇
    - 您對狀態或設定中的供應商／模型／執行階段標籤感到困惑
    - 您正在記錄原生測試框架的支援一致性
summary: OpenClaw 如何區分模型供應商、模型、頻道與代理執行階段
title: 代理執行階段
x-i18n:
    generated_at: "2026-07-11T21:14:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理執行環境**負責一個已準備好的模型迴圈：它接收提示詞、
驅動模型輸出、處理原生工具呼叫，並將完成的輪次
傳回 OpenClaw。

執行環境很容易與供應商混淆，因為兩者都會出現在模型
設定附近。它們是不同的層級：

| 層級         | 範例                                         | 意義                                                               |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------ |
| 供應商       | `anthropic`、`github-copilot`、`openai`      | OpenClaw 如何驗證身分、探索模型及命名模型參照。                    |
| 模型         | `claude-opus-4-6`、`gpt-5.6-sol`             | 為代理輪次選取的模型。                                             |
| 代理執行環境 | `claude-cli`、`codex`、`copilot`、`openclaw` | 執行已準備輪次的底層迴圈或後端。                                   |
| 頻道         | Discord、Slack、Telegram、WhatsApp           | 訊息進出 OpenClaw 的位置。                                         |

**執行框架**是提供代理執行環境的實作（程式碼
術語）。例如，隨附的 Codex 執行框架實作了 `codex` 執行環境。
公開設定在供應商或模型項目上使用 `agentRuntime.id`；整個代理的
執行環境鍵屬於舊版設定，會被忽略。`openclaw doctor --fix` 會移除舊的
整個代理執行環境固定設定，並將舊版執行環境模型參照改寫為標準的
供應商／模型參照，且在需要時加入模型範圍的執行環境政策。

執行環境分為兩個系列：

- **嵌入式執行框架**會在 OpenClaw 已準備好的代理迴圈內執行：包括
  內建的 `openclaw` 執行環境，以及已註冊的外掛執行框架，例如
  `codex` 和 `copilot`。
- **命令列介面後端**會執行本機命令列介面程序，同時保持模型參照
  為標準格式。例如，模型範圍設定為
  `agentRuntime.id: "claude-cli"` 的 `anthropic/claude-opus-4-8`
  表示「選取 Anthropic 模型，並透過 Claude CLI 執行」。
  `claude-cli` 不是嵌入式執行框架 ID，不得傳給 AgentHarness 選取流程。

`copilot` 執行框架是供 GitHub Copilot CLI 使用、獨立且須選擇啟用的
外部外掛執行框架；如需瞭解使用者應如何在 PI、Codex 與 GitHub Copilot
代理執行環境之間做選擇，請參閱
[GitHub Copilot 代理執行環境](/zh-TW/plugins/copilot)。

## Codex 介面

數個介面共用 Codex 這個名稱：

| 介面                                             | OpenClaw 名稱／設定                    | 功能                                                                                                           |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex 應用程式伺服器執行環境               | `openai/*` 模型參照                    | 透過 Codex 應用程式伺服器執行 OpenAI 嵌入式代理輪次。這是一般的 ChatGPT／Codex 訂閱設定。                      |
| Codex OAuth 驗證設定檔                           | `openai` OAuth 設定檔                  | 儲存 Codex 應用程式伺服器執行框架所使用的 ChatGPT／Codex 訂閱驗證資訊。                                       |
| Codex ACP 配接器                                 | `runtime: "acp"`、`agentId: "codex"`   | 透過外部 ACP/acpx 控制平面執行 Codex。僅在明確要求使用 ACP/acpx 時使用。                                       |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                           | 從聊天綁定、繼續、引導、停止及檢查 Codex 應用程式伺服器執行緒。                                               |
| 非代理介面的 OpenAI Platform API 路由            | `openai/*` 加上 API 金鑰驗證           | 直接使用 OpenAI API，例如影像、嵌入、語音及即時通訊。                                                         |

這些介面刻意彼此獨立。啟用 `codex` 外掛會提供原生應用程式伺服器功能；
`openclaw doctor --fix` 負責修復舊版 Codex 路由及清理過時的工作階段固定設定。
現在為代理模型選取 `openai/*` 表示「透過 Codex 執行此模型」，除非使用的是
非代理 OpenAI API 介面。

一般的 ChatGPT／Codex 訂閱設定會使用 Codex OAuth 進行驗證，但
模型參照仍使用 `openai/*`，並選取 `codex` 執行環境：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

這表示 OpenClaw 會選取 OpenAI 模型參照，接著要求 Codex
應用程式伺服器執行環境執行嵌入式代理輪次。這不表示「使用 API
計費」，也不表示頻道、模型供應商目錄或
OpenClaw 工作階段儲存區會變成 Codex。

啟用隨附的 `codex` 外掛時，請使用原生 `/codex` 命令
介面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、
`/codex stop`）以自然語言控制 Codex，而非使用 ACP。僅當使用者明確要求
ACP/acpx 或正在測試 ACP 配接器路徑時，才對 Codex 使用 ACP。
Claude Code、Gemini CLI、OpenCode、Cursor 及類似的外部
執行框架仍使用 ACP。

決策樹：

1. **Codex 綁定／控制／執行緒／繼續／引導／停止** -> 啟用隨附的 `codex` 外掛時，使用原生 `/codex` 命令介面。
2. **將 Codex 作為嵌入式執行環境**，或使用一般由訂閱支援的 Codex 代理體驗 -> `openai/<model>`。
3. **明確為 OpenAI 模型選擇 OpenClaw** -> 將模型參照保持為 `openai/<model>`，並將供應商／模型執行環境政策設為 `agentRuntime.id: "openclaw"`。選取的 `openai` OAuth 設定檔會在內部透過 OpenClaw 的 Codex 驗證傳輸進行路由。
4. **設定中的舊版 Codex 模型參照** -> 使用 `openclaw doctor --fix` 修復為 `openai/<model>`；若舊模型參照隱含使用 Codex 驗證路由，doctor 會在適當的供應商／模型範圍加入 `agentRuntime.id: "codex"` 以保留該路由。舊版 **`codex-cli/*`** 模型參照也會修復為相同的 `openai/<model>` Codex 應用程式伺服器路由；OpenClaw 不再保留隨附的 Codex CLI 後端。
5. **明確要求 ACP、acpx 或 Codex ACP 配接器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部執行框架** -> 使用 ACP/acpx，而非原生子代理執行環境。

| 您指的是……                           | 請使用                                       |
| ------------------------------------ | -------------------------------------------- |
| Codex 應用程式伺服器聊天／執行緒控制 | 隨附 `codex` 外掛提供的 `/codex ...`         |
| Codex 應用程式伺服器嵌入式代理執行環境 | `openai/*` 代理模型參照                    |
| OpenAI Codex OAuth                   | `openai` OAuth 設定檔                        |
| Claude Code 或其他外部執行框架       | ACP/acpx                                     |

如需瞭解 OpenAI 系列前綴的劃分，請參閱 [OpenAI](/zh-TW/providers/openai) 和
[模型供應商](/zh-TW/concepts/model-providers)。如需瞭解 Codex 執行環境的支援
契約，請參閱 [Codex 執行框架執行環境](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 執行環境權責

不同執行環境負責的迴圈範圍不同：

| 介面                       | OpenClaw 嵌入式                                      | Codex 應用程式伺服器                                                           |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| 模型迴圈負責者             | OpenClaw，透過 OpenClaw 嵌入式執行器                 | Codex 應用程式伺服器                                                           |
| 標準執行緒狀態             | OpenClaw 對話記錄                                     | Codex 執行緒，加上 OpenClaw 對話記錄鏡像                                       |
| OpenClaw 動態工具          | 原生 OpenClaw 工具迴圈                               | 透過 Codex 配接器橋接                                                          |
| 原生殼層與檔案工具         | OpenClaw 路徑                                         | Codex 原生工具，並在支援時透過原生掛鉤橋接                                     |
| 上下文引擎                 | 原生 OpenClaw 上下文組裝                             | OpenClaw 將已組裝的上下文投射至 Codex 輪次                                     |
| 壓縮                       | OpenClaw 或選取的上下文引擎                          | Codex 原生壓縮，搭配 OpenClaw 通知與鏡像維護                                   |
| 頻道傳遞                   | OpenClaw                                              | OpenClaw                                                                       |

設計規則：若介面由 OpenClaw 負責，便能提供一般的外掛掛鉤
行為。若介面由原生執行環境負責，OpenClaw 就需要執行環境
事件或原生掛鉤。若標準執行緒狀態由原生執行環境負責，
OpenClaw 會鏡像並投射上下文，而非改寫不受支援的
內部結構。

## 執行環境選取

OpenClaw 會在解析供應商與模型後，依照以下順序解析嵌入式執行環境：

1. **模型範圍的執行環境政策**優先。它位於已設定的供應商
   模型項目中，或位於 `agents.defaults.models["provider/model"].agentRuntime`
   ／`agents.list[].models["provider/model"].agentRuntime`。供應商
   萬用字元（例如 `agents.defaults.models["vllm/*"].agentRuntime`）會在
   精確模型政策之後套用，因此動態探索到的供應商模型可以共用一個
   執行環境，而不會覆寫各模型的精確例外設定。
2. **供應商範圍的執行環境政策**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已註冊的外掛執行環境可以認領支援的供應商／模型組合。
4. 如果在 `auto` 模式中沒有任何執行環境認領該輪次，OpenClaw 會退回使用
   `openclaw` 作為相容性執行環境。如果執行必須嚴格限定，請使用明確的執行環境 ID。

整個工作階段與整個代理的執行環境固定設定都會被忽略：`OPENCLAW_AGENT_RUNTIME`、
工作階段 `agentHarnessId`／`agentRuntimeOverride` 狀態、`agents.defaults.agentRuntime`
及 `agents.list[].agentRuntime`。執行 `openclaw doctor --fix` 可移除過時的
整個代理執行環境設定，並在能保留原意時轉換舊版執行環境模型參照。

明確指定的供應商／模型外掛執行環境會採取失敗關閉：供應商或模型上的
`agentRuntime.id: "codex"` 表示使用 Codex，否則就產生明確的選取／執行環境錯誤；
絕不會悄悄路由回 OpenClaw。只有 `auto` 可以將未匹配的
輪次路由至 OpenClaw。

命令列介面後端別名與嵌入式執行框架 ID 不同。建議的 Claude CLI 格式：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

基於相容性，仍支援 `claude-cli/claude-opus-4-7` 等舊版參照，
但新的設定應保持供應商／模型為標準格式，並將執行後端放在
供應商／模型執行環境政策中。

舊版 `codex-cli/*` 參照則不同：doctor 會將其遷移至 `openai/*`，使其
透過 Codex 應用程式伺服器執行框架執行，而非保留 Codex
命令列介面後端。

對大多數供應商而言，`auto` 模式刻意採取保守策略。OpenAI 代理
模型是例外：未設定執行環境與設定為 `auto` 時，兩者都會解析為 Codex
執行框架。明確的 OpenClaw 執行環境設定仍是 `openai/*` 代理輪次可選擇啟用的
相容性路由；與選取的 `openai` OAuth 設定檔搭配使用時，OpenClaw 會在內部
透過 Codex 驗證傳輸路由該路徑，同時維持公開模型參照為 `openai/*`。過時的
OpenAI 執行環境工作階段固定設定會被執行環境選取流程忽略，並可使用
`openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` 外掛已啟用，但設定中仍有舊版
Codex 模型參照，請將其視為舊版路由狀態，並執行
`openclaw doctor --fix`，將其改寫為使用 Codex 執行環境的 `openai/*`。

## GitHub Copilot 代理執行環境

外部 `@openclaw/copilot` 外掛會註冊一個選用式 `copilot` 執行階段，
其後端為 GitHub Copilot 命令列介面（`@github/copilot-sdk`）。它會宣告使用
標準訂閱 `github-copilot` 提供者，且**絕不會**由 `auto` 選取。
可透過 `agentRuntime.id` 針對每個模型或提供者啟用：

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

此執行框架會在 `extensions/copilot/doctor-contract-api.ts` 中宣告其提供者、
執行階段、命令列介面工作階段金鑰及驗證設定檔前綴，並由 `openclaw doctor`
自動載入。如需瞭解設定、驗證、逐字稿鏡像、壓縮、宣告式 doctor 合約，
以及更廣泛的 PI、Codex 與 Copilot SDK 選擇考量，請參閱
[GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)。

## 相容性合約

當執行階段不是 OpenClaw 時，其文件應說明它支援哪些 OpenClaw 功能介面：

| 問題 | 重要原因 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰負責模型迴圈？ | 決定重試、工具接續及最終答案決策會在何處進行。 |
| 誰負責標準對話串歷程？ | 決定 OpenClaw 能否編輯歷程，或只能建立鏡像。 |
| OpenClaw 動態工具是否可用？ | 訊息傳遞、工作階段、排程及 OpenClaw 所屬工具皆依賴此功能。 |
| 動態工具掛鉤是否可用？ | 外掛預期 OpenClaw 所屬工具支援 `before_tool_call`、`after_tool_call`，以及其周圍的中介軟體。 |
| 原生工具掛鉤是否可用？ | Shell、修補及執行階段所屬工具需要原生掛鉤支援，才能套用政策並進行觀察。 |
| 內容引擎生命週期是否會執行？ | 記憶與內容外掛依賴組裝、擷取、回合後處理及壓縮生命週期。 |
| 會公開哪些壓縮資料？ | 某些外掛只需要通知；其他外掛則需要保留／捨棄項目的中繼資料。 |
| 哪些功能刻意不受支援？ | 當原生執行階段管理更多狀態時，使用者不應假設其功能等同於 OpenClaw。 |

Codex 執行階段的支援合約記載於
[Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 狀態標籤

狀態輸出可能同時顯示 `Execution` 與 `Runtime` 標籤。應將它們視為
診斷資訊，而非提供者名稱：

- `openai/gpt-5.6-sol` 之類的模型參照代表所選的提供者／模型。
- `codex` 之類的執行階段 ID 代表正在執行該回合的迴圈。
- Telegram 或 Discord 之類的頻道標籤代表對話進行的位置。

如果執行作業顯示非預期的執行階段，請先檢查所選提供者／模型的
執行階段政策。舊版工作階段的執行階段固定設定已不再決定路由。

## 相關內容

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [Codex 執行框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)
- [OpenAI](/zh-TW/providers/openai)
- [代理程式執行框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
