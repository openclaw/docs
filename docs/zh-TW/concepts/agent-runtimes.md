---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生代理執行環境之間做選擇
    - 你對狀態或設定中的提供者／模型／執行環境標籤感到困惑
    - 你正在記錄原生測試框架的支援一致性
summary: OpenClaw 如何區分模型供應商、模型、頻道與代理執行階段
title: 代理程式執行階段
x-i18n:
    generated_at: "2026-07-12T14:24:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理執行階段**擁有一個已準備好的模型迴圈：它接收提示詞、驅動模型輸出、處理原生工具呼叫，並將完成的輪次傳回 OpenClaw。

執行階段很容易與供應商混淆，因為兩者都會出現在模型設定附近。它們屬於不同層級：

| 層級          | 範例                                         | 含義                                                                 |
| ------------- | -------------------------------------------- | -------------------------------------------------------------------- |
| 供應商        | `anthropic`, `github-copilot`, `openai`      | OpenClaw 如何進行驗證、探索模型，以及命名模型參照。                  |
| 模型          | `claude-opus-4-6`, `gpt-5.6-sol`             | 為代理輪次選取的模型。                                               |
| 代理執行階段  | `claude-cli`, `codex`, `copilot`, `openclaw` | 執行已準備輪次的底層迴圈或後端。                                     |
| 頻道          | Discord, Slack, Telegram, WhatsApp           | 訊息進出 OpenClaw 的位置。                                           |

**工具框架**是提供代理執行階段的實作（程式碼術語）。例如，隨附的 Codex 工具框架實作了 `codex` 執行階段。公開設定在供應商或模型項目上使用 `agentRuntime.id`；整個代理層級的執行階段鍵是舊版設定，會被忽略。`openclaw doctor --fix` 會移除舊的整個代理執行階段固定設定，並視需要將舊版執行階段模型參照重寫為標準供應商／模型參照，以及模型範圍的執行階段原則。

兩種執行階段系列：

- **內嵌工具框架**在 OpenClaw 已準備好的代理迴圈內執行：包括內建的 `openclaw` 執行階段，以及已註冊的外掛工具框架，例如 `codex` 和 `copilot`。
- **命令列介面後端**會執行本機命令列介面程序，同時維持模型參照的標準形式。例如，`anthropic/claude-opus-4-8` 搭配模型範圍的 `agentRuntime.id: "claude-cli"`，表示「選取 Anthropic 模型，透過 Claude CLI 執行」。`claude-cli` 不是內嵌工具框架 ID，不得傳入 AgentHarness 選取流程。

`copilot` 工具框架是獨立、選用的外部外掛工具框架，用於 GitHub Copilot CLI；如需了解面向使用者的 PI、Codex 與 GitHub Copilot 代理執行階段選擇，請參閱 [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)。

## Codex 介面

數個介面共用 Codex 名稱：

| 介面                                             | OpenClaw 名稱／設定                     | 功能                                                                                                                |
| ------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 執行階段                   | `openai/*` 模型參照                     | 透過 Codex app-server 執行 OpenAI 內嵌代理輪次。這是一般的 ChatGPT/Codex 訂閱設定。                                  |
| Codex OAuth 驗證設定檔                           | `openai` OAuth 設定檔                   | 儲存供 Codex app-server 工具框架使用的 ChatGPT/Codex 訂閱驗證資訊。                                                 |
| Codex ACP 轉接器                                 | `runtime: "acp"`, `agentId: "codex"`    | 透過外部 ACP/acpx 控制平面執行 Codex。僅在明確要求 ACP/acpx 時使用。                                                |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                            | 從聊天中繫結、繼續、引導、停止及檢查 Codex app-server 執行緒。                                                     |
| 用於非代理介面的 OpenAI Platform API 路由        | `openai/*` 加上 API 金鑰驗證            | 直接使用 OpenAI API，例如影像、嵌入、語音及即時功能。                                                              |

這些介面刻意彼此獨立。啟用 `codex` 外掛會提供原生 app-server 功能；`openclaw doctor --fix` 負責修復舊版 Codex 路由及清理過時的工作階段固定設定。現在為代理模型選取 `openai/*`，表示「透過 Codex 執行」，除非使用的是非代理 OpenAI API 介面。

常見的 ChatGPT/Codex 訂閱設定使用 Codex OAuth 進行驗證，但模型參照仍維持為 `openai/*`，並選取 `codex` 執行階段：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

這表示 OpenClaw 會選取 OpenAI 模型參照，接著要求 Codex app-server 執行階段執行內嵌代理輪次。這不表示「使用 API 計費」，也不表示頻道、模型供應商目錄或 OpenClaw 工作階段儲存區會變成 Codex。

啟用隨附的 `codex` 外掛時，請使用原生 `/codex` 命令介面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）以自然語言控制 Codex，而非使用 ACP。只有在使用者明確要求 ACP/acpx 或正在測試 ACP 轉接器路徑時，才對 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 及類似的外部工具框架仍使用 ACP。

決策樹：

1. **Codex 繫結／控制／執行緒／繼續／引導／停止** -> 啟用隨附的 `codex` 外掛時，使用原生 `/codex` 命令介面。
2. **以 Codex 作為內嵌執行階段**，或一般由訂閱支援的 Codex 代理體驗 -> `openai/<model>`。
3. **明確為 OpenAI 模型選擇 OpenClaw** -> 將模型參照維持為 `openai/<model>`，並將供應商／模型執行階段原則設為 `agentRuntime.id: "openclaw"`。選取的 `openai` OAuth 設定檔會在內部透過 OpenClaw 的 Codex 驗證傳輸進行路由。
4. **設定中的舊版 Codex 模型參照** -> 使用 `openclaw doctor --fix` 修復為 `openai/<model>`；當舊模型參照隱含使用 Codex 驗證路由時，doctor 會視需要新增供應商／模型範圍的 `agentRuntime.id: "codex"`，以保留該路由。舊版 **`codex-cli/*`** 模型參照會修復為相同的 `openai/<model>` Codex app-server 路由；OpenClaw 不再保留隨附的 Codex CLI 後端。
5. **明確要求 ACP、acpx 或 Codex ACP 轉接器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部工具框架** -> ACP/acpx，而非原生子代理執行階段。

| 你的意思是……                         | 使用……                                      |
| ------------------------------------ | ------------------------------------------- |
| Codex app-server 聊天／執行緒控制    | 隨附 `codex` 外掛提供的 `/codex ...`        |
| Codex app-server 內嵌代理執行階段    | `openai/*` 代理模型參照                     |
| OpenAI Codex OAuth                   | `openai` OAuth 設定檔                       |
| Claude Code 或其他外部工具框架       | ACP/acpx                                    |

如需了解 OpenAI 系列前綴的拆分方式，請參閱 [OpenAI](/zh-TW/providers/openai) 和[模型供應商](/zh-TW/concepts/model-providers)。如需了解 Codex 執行階段支援契約，請參閱 [Codex 工具框架執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 執行階段擁有權

不同的執行階段擁有不同程度的迴圈控制權：

| 介面                       | OpenClaw 內嵌                                  | Codex app-server                                                                 |
| -------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| 模型迴圈擁有者             | OpenClaw，透過 OpenClaw 內嵌執行器             | Codex app-server                                                                 |
| 標準執行緒狀態             | OpenClaw 轉錄內容                              | Codex 執行緒，加上 OpenClaw 轉錄內容鏡像                                         |
| OpenClaw 動態工具          | 原生 OpenClaw 工具迴圈                         | 透過 Codex 轉接器橋接                                                            |
| 原生 Shell 和檔案工具      | OpenClaw 路徑                                  | Codex 原生工具，並在支援時透過原生掛鉤橋接                                       |
| 上下文引擎                 | 原生 OpenClaw 上下文組裝                       | OpenClaw 將已組裝的上下文投射至 Codex 輪次                                       |
| 壓縮                       | OpenClaw 或選取的上下文引擎                    | Codex 原生壓縮，搭配 OpenClaw 通知和鏡像維護                                     |
| 頻道傳遞                   | OpenClaw                                       | OpenClaw                                                                         |

設計規則：如果介面由 OpenClaw 擁有，它就能提供一般的外掛掛鉤行為。如果介面由原生執行階段擁有，OpenClaw 就需要執行階段事件或原生掛鉤。如果標準執行緒狀態由原生執行階段擁有，OpenClaw 會鏡像並投射上下文，而不是重寫不受支援的內部狀態。

## 執行階段選取

OpenClaw 會在解析供應商和模型後，依下列順序解析內嵌執行階段：

1. **模型範圍的執行階段原則**優先。它位於已設定的供應商模型項目中，或位於 `agents.defaults.models["provider/model"].agentRuntime`／`agents.list[].models["provider/model"].agentRuntime`。供應商萬用字元（例如 `agents.defaults.models["vllm/*"].agentRuntime`）會在精確模型原則之後套用，因此動態探索到的供應商模型可以共用一個執行階段，而不會覆寫各模型的精確例外。
2. **供應商範圍的執行階段原則**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已註冊的外掛執行階段可以宣告支援的供應商／模型配對。
4. 如果在 `auto` 模式中沒有任何執行階段接手該輪次，OpenClaw 會回退到 `openclaw` 作為相容性執行階段。如果執行必須嚴格指定，請使用明確的執行階段 ID。

整個工作階段和整個代理的執行階段固定設定會被忽略：`OPENCLAW_AGENT_RUNTIME`、工作階段 `agentHarnessId`／`agentRuntimeOverride` 狀態、`agents.defaults.agentRuntime`，以及 `agents.list[].agentRuntime`。執行 `openclaw doctor --fix` 可移除過時的整個代理執行階段設定，並在可以保留意圖時轉換舊版執行階段模型參照。

明確指定的供應商／模型外掛執行階段會採取失敗關閉策略：供應商或模型上的 `agentRuntime.id: "codex"` 表示使用 Codex，否則會產生明確的選取／執行階段錯誤；絕不會無提示地路由回 OpenClaw。只有 `auto` 能將未匹配的輪次路由至 OpenClaw。

命令列介面後端別名與內嵌工具框架 ID 不同。建議的 Claude CLI 形式：

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

為了相容性，仍支援 `claude-cli/claude-opus-4-7` 等舊版參照，但新設定應維持供應商／模型的標準形式，並將執行後端放在供應商／模型執行階段原則中。

舊版 `codex-cli/*` 參照則不同：doctor 會將其遷移至 `openai/*`，使其透過 Codex app-server 工具框架執行，而不是保留 Codex CLI 後端。

對大多數供應商而言，`auto` 模式刻意採取保守策略。OpenAI 代理模型是例外：未設定執行階段與 `auto` 都會解析至 Codex 工具框架。明確的 OpenClaw 執行階段設定仍是 `openai/*` 代理輪次的選用相容性路由；搭配已選取的 `openai` OAuth 設定檔時，OpenClaw 會在內部透過 Codex 驗證傳輸路由該路徑，同時將公開模型參照維持為 `openai/*`。執行階段選取會忽略過時的 OpenAI 執行階段工作階段固定設定，並可使用 `openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告在設定中仍有舊版 Codex 模型參照時啟用了 `codex` 外掛，請將其視為舊版路由狀態，並執行 `openclaw doctor --fix`，將其重寫為使用 Codex 執行階段的 `openai/*`。

## GitHub Copilot 代理執行階段

外部 `@openclaw/copilot` 外掛會註冊一個選擇性啟用的 `copilot` 執行階段，
其後端由 GitHub Copilot 命令列介面（`@github/copilot-sdk`）提供。它宣告使用
標準訂閱 `github-copilot` 提供者，且**永遠不會**由 `auto` 選取。
請透過 `agentRuntime.id` 依模型或提供者選擇啟用：

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

此框架會在 `extensions/copilot/doctor-contract-api.ts` 中宣告其提供者、執行階段、命令列介面工作階段金鑰與驗證設定檔
前綴，`openclaw doctor` 會自動載入該檔案。如需了解設定、驗證、對話記錄鏡像、壓縮、
宣告式 doctor 合約，以及更全面的 PI、Codex 與 Copilot SDK
選擇考量，請參閱 [GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)。

## 相容性合約

當執行階段不是 OpenClaw 時，其文件應說明支援哪些 OpenClaw 功能介面：

| 問題                                   | 重要性                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰負責模型迴圈？                       | 決定重試、工具接續與最終答案的決策發生在何處。                                                       |
| 誰負責標準執行緒歷程？                 | 決定 OpenClaw 可以編輯歷程，還是只能將其鏡像。                                                       |
| OpenClaw 動態工具是否可用？            | 訊息傳遞、工作階段、排程及 OpenClaw 所擁有的工具皆依賴此功能。                                       |
| 動態工具掛鉤是否可用？                 | 外掛預期 OpenClaw 所擁有的工具周圍會有 `before_tool_call`、`after_tool_call` 與中介軟體。             |
| 原生工具掛鉤是否可用？                 | Shell、修補與執行階段所擁有的工具需要原生掛鉤支援，才能套用政策與進行觀察。                            |
| 內容引擎生命週期是否會執行？           | 記憶與內容外掛依賴組裝、擷取、回合結束後與壓縮生命週期。                                             |
| 會公開哪些壓縮資料？                   | 有些外掛只需要通知；其他外掛則需要保留／捨棄項目的中繼資料。                                         |
| 哪些功能刻意不受支援？                 | 當原生執行階段擁有更多狀態時，使用者不應假設其功能等同於 OpenClaw。                                   |

Codex 執行階段的支援合約記載於
[Codex 框架執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 狀態標籤

狀態輸出可能同時顯示 `Execution` 與 `Runtime` 標籤。請將它們視為
診斷資訊，而非提供者名稱：

- `openai/gpt-5.6-sol` 之類的模型參照代表所選的提供者／模型。
- `codex` 之類的執行階段 ID 代表正在執行該回合的迴圈。
- Telegram 或 Discord 之類的頻道標籤代表對話正在何處進行。

如果某次執行顯示非預期的執行階段，請先檢查所選提供者／模型的
執行階段政策。舊版工作階段的執行階段固定設定已不再決定路由。

## 相關內容

- [Codex 框架](/zh-TW/plugins/codex-harness)
- [Codex 框架執行階段](/zh-TW/plugins/codex-harness-runtime)
- [GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)
- [OpenAI](/zh-TW/providers/openai)
- [代理程式框架外掛](/zh-TW/plugins/sdk-agent-harness)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
