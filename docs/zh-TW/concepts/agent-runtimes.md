---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生代理執行環境之間進行選擇
    - 你對狀態或設定中的供應商／模型／執行階段標籤感到困惑
    - 你正在記錄原生測試框架的支援一致性
summary: OpenClaw 如何區分模型供應商、模型、頻道與代理程式執行環境
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-07-22T10:29:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 44cef229c76c51059399c11d181350c2b29ee5b367f3060c838986c5b5302774
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理執行環境**負責一個已準備好的模型迴圈：它接收提示詞、
驅動模型輸出、處理原生工具呼叫，並將完成的輪次
傳回 OpenClaw。

執行環境很容易與供應商混淆，因為兩者都會出現在模型
設定附近。它們是不同的層級：

| 層級         | 範例                                     | 含義                                                             |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| 供應商      | `anthropic`, `github-copilot`, `openai`      | OpenClaw 如何驗證身分、探索模型，以及命名模型參照。 |
| 模型         | `claude-opus-4-6`, `gpt-5.6-sol`             | 為代理輪次選取的模型。                              |
| 代理執行環境 | `claude-cli`, `codex`, `copilot`, `openclaw` | 執行已準備輪次的底層迴圈或後端。      |
| 頻道       | Discord, Slack, Telegram, WhatsApp           | 訊息進出 OpenClaw 的位置。                            |

**控制框架**是提供代理執行環境的實作（程式碼
術語）。例如，隨附的 Codex 控制框架實作 `codex` 執行環境。
公開設定會在供應商或模型項目上使用 `agentRuntime.id`；整個代理的
執行環境鍵是舊版設定，會被忽略。`openclaw doctor --fix` 會移除舊的
整個代理執行環境釘選，並在需要時將舊版執行環境模型參照改寫為標準的
供應商／模型參照，加上模型範圍的執行環境原則。

兩類執行環境：

- **嵌入式控制框架**會在 OpenClaw 已準備好的代理迴圈內執行：包括
  內建的 `openclaw` 執行環境，以及已註冊的外掛控制框架，例如
  `codex` 和 `copilot`。
- **命令列介面後端**會執行本機命令列介面程序，同時維持標準的模型參照。
  例如，`anthropic/claude-opus-4-8` 搭配模型範圍的
  `agentRuntime.id: "claude-cli"` 表示「選取 Anthropic 模型，透過
  Claude CLI 執行」。`claude-cli` 不是嵌入式控制框架 ID，不得
  傳給 AgentHarness 選擇程序。

`copilot` 控制框架是獨立、選用的外部外掛控制框架，用於
GitHub Copilot CLI；如需了解使用者應如何在 PI、Codex 和 GitHub Copilot 代理執行環境之間
做選擇，請參閱 [GitHub Copilot 代理執行環境](/zh-TW/plugins/copilot)。

## Codex 介面

多個介面共用 Codex 名稱：

| 介面                                          | OpenClaw 名稱／設定                 | 功能                                                                                                   |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 執行環境                  | `openai/*` 模型參照                | 透過 Codex app-server 執行 OpenAI 嵌入式代理輪次。這是一般的 ChatGPT/Codex 訂閱設定。 |
| Codex OAuth 驗證設定檔                        | `openai` OAuth 設定檔              | 儲存 Codex app-server 控制框架使用的 ChatGPT/Codex 訂閱驗證資訊。                             |
| Codex ACP 轉接器                                | `runtime: "acp"`, `agentId: "codex"` | 透過外部 ACP/acpx 控制平面執行 Codex。僅在明確要求 ACP/acpx 時使用。        |
| 原生 Codex 聊天控制命令集            | `/codex ...`                         | 從聊天綁定、繼續、引導、停止及檢查 Codex app-server 執行緒。                                |
| 用於非代理介面的 OpenAI Platform API 路徑 | `openai/*` 加上 API 金鑰驗證         | 直接使用 OpenAI API，例如影像、嵌入、語音和即時功能。                                           |

這些介面刻意彼此獨立。啟用 `codex` 外掛
會提供原生 app-server 功能；`openclaw doctor --fix` 負責
修復舊版 Codex 路徑和清除過時的工作階段釘選。現在為代理模型選取 `openai/*`
表示「透過 Codex 執行」，除非正在使用非代理的
OpenAI API 介面。

一般的 ChatGPT/Codex 訂閱設定會使用 Codex OAuth 驗證，但
將模型參照保持為 `openai/*`，並選取 `codex` 執行環境：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

這表示 OpenClaw 會選取 OpenAI 模型參照，然後要求 Codex
app-server 執行環境執行嵌入式代理輪次。這不表示「使用 API
計費」，也不表示頻道、模型供應商目錄或
OpenClaw 工作階段儲存區會變成 Codex。

啟用隨附的 `codex` 外掛時，請使用原生 `/codex` 命令
介面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、
`/codex stop`）以自然語言控制 Codex，而非使用 ACP。僅在
使用者明確要求 ACP/acpx 或正在測試 ACP
轉接器路徑時，才對 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和類似的外部
控制框架仍使用 ACP。

決策樹：

1. **Codex 綁定／控制／執行緒／繼續／引導／停止** -> 啟用隨附的 `codex` 外掛時，使用原生 `/codex` 命令介面。
2. **將 Codex 作為嵌入式執行環境**或一般由訂閱支援的 Codex 代理體驗 -> `openai/<model>`。
3. **為 OpenAI 模型明確選擇 OpenClaw** -> 將模型參照保持為 `openai/<model>`，並將供應商／模型執行環境原則設為 `agentRuntime.id: "openclaw"`。選取的 `openai` OAuth 設定檔會在內部透過 OpenClaw 的 Codex 驗證傳輸路由。
4. **設定中的舊版 Codex 模型參照** -> 使用 `openclaw doctor --fix` 修復為 `openai/<model>`；若舊模型參照隱含 Codex 驗證路徑，doctor 會新增供應商／模型範圍的 `agentRuntime.id: "codex"` 以保留該路徑。舊版 **`codex-cli/*`** 模型參照會修復為相同的 `openai/<model>` Codex app-server 路徑；OpenClaw 不再保留隨附的 Codex 命令列介面後端。
5. **明確要求 ACP、acpx 或 Codex ACP 轉接器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部控制框架** -> ACP/acpx，而非原生子代理執行環境。

| 你指的是……                             | 使用……                                       |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天／執行緒控制    | 隨附 `codex` 外掛中的 `/codex ...` |
| Codex app-server 嵌入式代理執行環境 | `openai/*` 代理模型參照                  |
| OpenAI Codex OAuth                      | `openai` OAuth 設定檔                      |
| Claude Code 或其他外部控制框架   | ACP/acpx                                     |

如需了解 OpenAI 系列前綴的拆分方式，請參閱 [OpenAI](/zh-TW/providers/openai) 和
[模型供應商](/zh-TW/concepts/model-providers)。如需了解 Codex 執行環境支援
合約，請參閱 [Codex 控制框架執行環境](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 執行環境所有權

不同的執行環境負責不同範圍的迴圈：

| 介面                     | OpenClaw 嵌入式                              | Codex app-server                                                            |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者            | OpenClaw，透過 OpenClaw 嵌入式執行器 | Codex app-server                                                            |
| 標準執行緒狀態      | OpenClaw 逐字記錄                            | Codex 執行緒，加上 OpenClaw 逐字記錄鏡像                               |
| OpenClaw 動態工具      | 原生 OpenClaw 工具迴圈                      | 透過 Codex 轉接器橋接                                           |
| 原生殼層和檔案工具 | OpenClaw 路徑                                  | Codex 原生工具，並在支援時透過原生掛鉤橋接            |
| 上下文引擎              | 原生 OpenClaw 上下文組裝               | OpenClaw 將組裝好的上下文投射至 Codex 輪次                     |
| 壓縮                  | OpenClaw 或所選的上下文引擎            | Codex 原生壓縮，搭配 OpenClaw 通知和鏡像維護 |
| 頻道傳遞            | OpenClaw                                       | OpenClaw                                                                    |

設計規則：如果介面由 OpenClaw 負責，就能提供一般的外掛掛鉤
行為。如果介面由原生執行環境負責，OpenClaw 就需要執行環境
事件或原生掛鉤。如果標準執行緒狀態由原生執行環境負責，
OpenClaw 會鏡像並投射上下文，而不是改寫不支援的
內部結構。

## 執行環境選擇

OpenClaw 會在解析供應商和模型後，依照
以下順序解析嵌入式執行環境：

1. **模型範圍的執行環境原則**優先。它位於已設定的供應商
   模型項目，或 `agents.defaults.models["provider/model"].agentRuntime`
   ／`agents.entries.*.models["provider/model"].agentRuntime` 中。`agents.defaults.models["vllm/*"].agentRuntime` 之類的供應商
   萬用字元會在精確模型原則之後套用，因此動態探索到的供應商模型可以
   共用同一個執行環境，而不會覆寫精確的個別模型例外。
2. **供應商範圍的執行環境原則**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已註冊的外掛執行環境可以認領其支援的供應商／模型配對。
4. 如果在 `auto` 模式下沒有任何項目認領該輪次，OpenClaw 會回復使用
   `openclaw` 作為相容性執行環境。若執行必須嚴格，請使用明確的執行環境 ID。

整個工作階段和整個代理的執行環境釘選會被忽略：`OPENCLAW_AGENT_RUNTIME`、
工作階段 `agentHarnessId`/`agentRuntimeOverride` 狀態、`agents.defaults.agentRuntime`
和 `agents.entries.*.agentRuntime`。執行 `openclaw doctor --fix` 以移除過時的
整個代理執行環境設定，並在可保留意圖時轉換舊版執行環境模型參照。

明確的供應商／模型外掛執行環境會採取封閉式失敗：供應商或模型上的 `agentRuntime.id: "codex"`
表示 Codex，否則就會產生明確的選擇／執行環境錯誤——絕不會
無提示地重新路由至 OpenClaw。只有 `auto` 可以將不相符的
輪次路由至 OpenClaw。

命令列介面後端別名與嵌入式控制框架 ID 不同。建議的 Claude CLI 形式：

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

為了相容性，仍支援 `claude-cli/claude-opus-4-7` 之類的舊版參照，
但新設定應維持標準的供應商／模型，並
將執行後端放在供應商／模型執行環境原則中。

舊版 `codex-cli/*` 參照則不同：doctor 會將它們遷移至 `openai/*`，使其
透過 Codex app-server 控制框架執行，而不是保留 Codex
命令列介面後端。

對大多數供應商而言，`auto` 模式刻意採取保守策略。OpenAI 代理
模型是例外：未設定執行環境和 `auto` 都會解析為 Codex
控制框架。明確的 OpenClaw 執行環境設定仍是 `openai/*` 代理輪次的選用相容性
路徑；搭配已選取的 `openai` OAuth
設定檔時，OpenClaw 會在內部透過 Codex 驗證
傳輸路由該路徑，同時將公開模型參照保持為 `openai/*`。過時的 OpenAI
執行環境工作階段釘選會被執行環境選擇程序忽略，並可使用
`openclaw doctor --fix` 清除。

如果 `openclaw doctor` 警告已啟用 `codex` 外掛，但設定中仍有舊版
Codex 模型參照，請將其視為舊版路由狀態，並執行
`openclaw doctor --fix`，以 Codex 執行階段將其改寫為 `openai/*`。

## GitHub Copilot 代理程式執行階段

外部 `@openclaw/copilot` 外掛會註冊一個選擇加入的 `copilot` 執行階段，
其後端由 GitHub Copilot 命令列介面（`@github/copilot-sdk`）提供。它宣告使用
標準訂閱 `github-copilot` 提供者，且**絕不會**由
`auto` 選取。請透過 `agentRuntime.id`，依模型或提供者選擇加入：

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

此控管程式會在 `extensions/copilot/doctor-contract-api.ts` 中宣告其提供者、執行階段、命令列介面工作階段金鑰及驗證設定檔
前綴，而 `openclaw doctor`
會自動載入該內容。如需設定、驗證、逐字稿鏡像、壓縮、宣告式 doctor 合約，以及更廣泛的 PI、Codex 與 Copilot SDK
選擇說明，請參閱 [GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)。

## 相容性合約

當執行階段並非 OpenClaw 時，其文件應說明支援哪些 OpenClaw 功能介面：

| 問題                                   | 重要原因                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                       | 決定重試、工具續行及最終答案決策會在何處進行。                                                    |
| 誰擁有標準執行緒歷程？                 | 決定 OpenClaw 能編輯歷程，還是只能鏡像歷程。                                                      |
| OpenClaw 動態工具是否可用？            | 訊息、工作階段、排程及 OpenClaw 擁有的工具仰賴此功能。                                            |
| 動態工具掛鉤是否可用？                 | 外掛預期 OpenClaw 擁有的工具周圍具有 `before_tool_call`、`after_tool_call` 及中介軟體。           |
| 原生工具掛鉤是否可用？                 | Shell、修補及執行階段擁有的工具需要原生掛鉤支援，才能套用政策並進行觀察。                          |
| 是否會執行內容引擎生命週期？           | 記憶與內容外掛仰賴組裝、擷取、回合後處理及壓縮生命週期。                                          |
| 會公開哪些壓縮資料？                   | 有些外掛只需要通知；其他外掛則需要保留／捨棄的中繼資料。                                          |
| 哪些功能刻意不受支援？                 | 當原生執行階段擁有更多狀態時，使用者不應假設其等同於 OpenClaw。                                   |

Codex 執行階段支援合約記載於
[Codex 控管程式執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 狀態標籤

狀態輸出可以同時顯示 `Execution` 與 `Runtime` 標籤。請將其視為
診斷資訊，而非提供者名稱：

- 模型參照（例如 `openai/gpt-5.6-sol`）是所選的提供者／模型。
- 執行階段 ID（例如 `codex`）是執行該回合的迴圈。
- 頻道標籤（例如 Telegram 或 Discord）表示對話進行的位置。

如果執行作業顯示非預期的執行階段，請先檢查所選提供者／模型的
執行階段政策。舊版工作階段執行階段釘選已不再決定路由。

## 相關內容

- [Codex 控管程式](/zh-TW/plugins/codex-harness)
- [Codex 控管程式執行階段](/zh-TW/plugins/codex-harness-runtime)
- [GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)
- [OpenAI](/zh-TW/providers/openai)
- [代理程式控管程式外掛](/zh-TW/plugins/sdk-agent-harness)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
