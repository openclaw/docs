---
read_when:
    - 您正在 OpenClaw、Codex、ACP 或其他原生代理執行階段之間做選擇
    - 你對狀態或設定中的提供者／模型／執行階段標籤感到困惑
    - 你正在記錄原生測試框架的支援一致性
summary: OpenClaw 如何區分模型提供者、模型、通道與代理執行階段
title: 代理程式執行階段
x-i18n:
    generated_at: "2026-07-05T11:14:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a4b3c54b9f80e37662dc98f14db8abc4491426695dc9aa081b05bc923cb44ecd
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理程式執行階段**擁有一個已準備好的模型迴圈：它接收提示、驅動模型輸出、處理原生工具呼叫，並將完成的回合傳回 OpenClaw。

執行階段很容易與提供者混淆，因為兩者都會出現在模型設定附近。它們是不同的層：

| 層級 | 範例 | 意義 |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| 提供者 | `anthropic`, `github-copilot`, `openai` | OpenClaw 如何驗證、探索模型，以及命名模型參照。 |
| 模型 | `claude-opus-4-6`, `gpt-5.5` | 為代理程式回合選取的模型。 |
| 代理程式執行階段 | `claude-cli`, `codex`, `copilot`, `openclaw` | 執行已準備回合的低階迴圈或後端。 |
| 通道 | Discord, Slack, Telegram, WhatsApp | 訊息進出 OpenClaw 的位置。 |

**harness** 是提供代理程式執行階段的實作（程式碼術語）。例如，內建的 Codex harness 實作了 `codex` 執行階段。公開設定會在提供者或模型項目上使用 `agentRuntime.id`；整個代理程式的執行階段鍵是舊版設定，會被忽略。`openclaw doctor --fix` 會移除舊的整個代理程式執行階段固定設定，並在需要時將舊版執行階段模型參照改寫為標準提供者/模型參照，加上模型範圍的執行階段策略。

兩種執行階段家族：

- **嵌入式 harness** 在 OpenClaw 已準備好的代理程式迴圈內執行：內建的 `openclaw` 執行階段，以及已註冊的外掛 harness，例如 `codex` 和 `copilot`。
- **命令列介面後端** 執行本機命令列介面程序，同時保留標準模型參照。例如，`anthropic/claude-opus-4-8` 搭配模型範圍的 `agentRuntime.id: "claude-cli"`，意思是「選取 Anthropic 模型，透過 Claude CLI 執行」。`claude-cli` 不是嵌入式 harness ID，不得傳給 AgentHarness 選取流程。

`copilot` harness 是獨立、可選用的外部外掛 harness，用於 GitHub Copilot CLI；使用者面向的 PI、Codex 和 GitHub Copilot 代理程式執行階段之間的決策，請參閱 [GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)。

## Codex 介面

有幾個介面共用 Codex 名稱：

| 介面 | OpenClaw 名稱/設定 | 作用 |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 執行階段 | `openai/*` 模型參照 | 透過 Codex app-server 執行 OpenAI 嵌入式代理程式回合。這是常見的 ChatGPT/Codex 訂閱設定。 |
| Codex OAuth 驗證設定檔 | `openai` OAuth 設定檔 | 儲存 Codex app-server harness 會使用的 ChatGPT/Codex 訂閱驗證。 |
| Codex ACP 轉接器 | `runtime: "acp"`, `agentId: "codex"` | 透過外部 ACP/acpx 控制平面執行 Codex。僅在明確要求 ACP/acpx 時使用。 |
| 原生 Codex 聊天控制命令集 | `/codex ...` | 從聊天中繫結、恢復、導引、停止及檢查 Codex app-server 執行緒。 |
| 非代理程式介面的 OpenAI Platform API 路由 | `openai/*` 加上 API 金鑰驗證 | 直接 OpenAI API，例如影像、嵌入、語音和即時。 |

這些介面刻意彼此獨立。啟用 `codex` 外掛會提供原生 app-server 功能；`openclaw doctor --fix` 負責舊版 Codex 路由修復與過時工作階段固定設定清理。現在為代理程式模型選取 `openai/*`，表示「透過 Codex 執行此模型」，除非使用的是非代理程式 OpenAI API 介面。

常見的 ChatGPT/Codex 訂閱設定使用 Codex OAuth 進行驗證，但會保留模型參照為 `openai/*`，並選取 `codex` 執行階段：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

這表示 OpenClaw 會選取 OpenAI 模型參照，然後要求 Codex app-server 執行階段執行嵌入式代理程式回合。這不表示「使用 API 計費」，也不表示通道、模型提供者目錄或 OpenClaw 工作階段儲存會變成 Codex。

啟用內建 `codex` 外掛時，使用原生 `/codex` 命令介面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）進行自然語言 Codex 控制，而不是 ACP。只有在使用者明確要求 ACP/acpx，或正在測試 ACP 轉接器路徑時，才對 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和類似外部 harness 仍使用 ACP。

決策樹：

1. **Codex 繫結/控制/執行緒/恢復/導引/停止** -> 啟用內建 `codex` 外掛時，使用原生 `/codex` 命令介面。
2. **Codex 作為嵌入式執行階段** 或一般由訂閱支援的 Codex 代理程式體驗 -> `openai/<model>`。
3. **為 OpenAI 模型明確選擇 OpenClaw** -> 保留模型參照為 `openai/<model>`，並將提供者/模型執行階段策略設為 `agentRuntime.id: "openclaw"`。選取的 `openai` OAuth 設定檔會在內部透過 OpenClaw 的 Codex 驗證傳輸路由。
4. **設定中的舊版 Codex 模型參照** -> 使用 `openclaw doctor --fix` 修復為 `openai/<model>`；當舊模型參照暗示 Codex 驗證路由時，doctor 會透過加入提供者/模型範圍的 `agentRuntime.id: "codex"` 來保留該路由。舊版 **`codex-cli/*`** 模型參照會修復到相同的 `openai/<model>` Codex app-server 路由；OpenClaw 不再保留內建 Codex CLI 後端。
5. **明確要求 ACP、acpx 或 Codex ACP 轉接器** -> `runtime: "acp"` 和 `agentId: "codex"`。
6. **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness** -> ACP/acpx，而不是原生子代理程式執行階段。

| 你的意思是... | 使用... |
| --------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/執行緒控制 | 來自內建 `codex` 外掛的 `/codex ...` |
| Codex app-server 嵌入式代理程式執行階段 | `openai/*` 代理程式模型參照 |
| OpenAI Codex OAuth | `openai` OAuth 設定檔 |
| Claude Code 或其他外部 harness | ACP/acpx |

如需 OpenAI 家族前綴分割，請參閱 [OpenAI](/zh-TW/providers/openai) 和 [模型提供者](/zh-TW/concepts/model-providers)。如需 Codex 執行階段支援合約，請參閱 [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 執行階段所有權

不同執行階段擁有迴圈的不同部分：

| 介面 | OpenClaw 嵌入式 | Codex app-server |
| --------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者 | OpenClaw，透過 OpenClaw 嵌入式 runner | Codex app-server |
| 標準執行緒狀態 | OpenClaw 逐字稿 | Codex 執行緒，加上 OpenClaw 逐字稿鏡像 |
| OpenClaw 動態工具 | 原生 OpenClaw 工具迴圈 | 透過 Codex 轉接器橋接 |
| 原生 shell 和檔案工具 | OpenClaw 路徑 | Codex 原生工具，在支援時透過原生 hook 橋接 |
| 情境引擎 | 原生 OpenClaw 情境組裝 | OpenClaw 將組裝好的情境投射到 Codex 回合 |
| 壓縮 | OpenClaw 或選取的情境引擎 | Codex 原生壓縮，搭配 OpenClaw 通知與鏡像維護 |
| 通道傳遞 | OpenClaw | OpenClaw |

設計規則：如果 OpenClaw 擁有該介面，它可以提供一般外掛 hook 行為。如果原生執行階段擁有該介面，OpenClaw 需要執行階段事件或原生 hook。如果原生執行階段擁有標準執行緒狀態，OpenClaw 會鏡像並投射情境，而不是改寫不受支援的內部實作。

## 執行階段選取

OpenClaw 會在提供者與模型解析後，依照以下順序解析嵌入式執行階段：

1. **模型範圍的執行階段策略**優先。這位於已設定的提供者模型項目，或 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`。像 `agents.defaults.models["vllm/*"].agentRuntime` 這類提供者萬用字元會在精確模型策略之後套用，因此動態探索到的提供者模型可以共用同一個執行階段，而不會覆寫精確的逐模型例外。
2. **提供者範圍的執行階段策略**：`models.providers.<provider>.agentRuntime`。
3. **`auto` 模式**：已註冊的外掛執行階段可以宣告支援的提供者/模型配對。
4. 如果在 `auto` 模式中沒有任何項目宣告該回合，OpenClaw 會回退到 `openclaw` 作為相容性執行階段。當執行必須嚴格時，請使用明確的執行階段 ID。

整個工作階段與整個代理程式的執行階段固定設定會被忽略：`OPENCLAW_AGENT_RUNTIME`、工作階段 `agentHarnessId`/`agentRuntimeOverride` 狀態、`agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。執行 `openclaw doctor --fix` 可移除過時的整個代理程式執行階段設定，並在可保留意圖時轉換舊版執行階段模型參照。

明確的提供者/模型外掛執行階段會封閉失敗：提供者或模型上的 `agentRuntime.id: "codex"` 表示 Codex，否則會產生清楚的選取/執行階段錯誤 - 絕不會靜默路由回 OpenClaw。只有 `auto` 可以將不符合的回合路由到 OpenClaw。

命令列介面後端別名不同於嵌入式 harness ID。建議的 Claude CLI 形式：

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

像 `claude-cli/claude-opus-4-7` 這類舊版參照仍為了相容性而受到支援，但新設定應保持提供者/模型為標準形式，並將執行後端放入提供者/模型執行階段策略。

舊版 `codex-cli/*` 參照則不同：doctor 會將它們遷移到 `openai/*`，讓它們透過 Codex app-server harness 執行，而不是保留 Codex CLI 後端。

對大多數提供者而言，`auto` 模式刻意採取保守策略。OpenAI 代理程式模型是例外：未設定執行階段與 `auto` 都會解析到 Codex harness。明確的 OpenClaw 執行階段設定仍是 `openai/*` 代理程式回合的可選相容性路由；當搭配選取的 `openai` OAuth 設定檔時，OpenClaw 會在內部透過 Codex 驗證傳輸路由該路徑，同時保持公開模型參照為 `openai/*`。過時的 OpenAI 執行階段工作階段固定設定會被執行階段選取忽略，並可用 `openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` 外掛已啟用但設定中仍有舊版 Codex 模型參照，請將其視為舊版路由狀態，並執行 `openclaw doctor --fix` 將其改寫為 `openai/*` 搭配 Codex 執行階段。

## GitHub Copilot 代理程式執行階段

外部 `@openclaw/copilot` 外掛註冊了一個選擇加入的 `copilot` 執行階段，
由 GitHub Copilot 命令列介面（`@github/copilot-sdk`）支援。它宣告
標準訂閱 `github-copilot` 提供者，且**永遠不會**由
`auto` 選取。透過 `agentRuntime.id` 依模型或依提供者選擇加入：

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

此 harness 會在 `extensions/copilot/doctor-contract-api.ts` 中宣告其提供者、執行階段、命令列介面工作階段金鑰與驗證設定檔
前綴，`openclaw doctor` 會自動載入該檔案。關於設定、驗證、逐字稿鏡像、壓縮、
宣告式 doctor contract，以及更廣泛的 PI vs Codex vs Copilot SDK
決策，請參閱 [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)。

## 相容性契約

當執行階段不是 OpenClaw 時，其文件應說明它支援哪些 OpenClaw 介面：

| 問題                                   | 為什麼重要                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                       | 決定重試、工具延續與最終答案決策在哪裡發生。                                                     |
| 誰擁有標準執行緒歷史？                 | 決定 OpenClaw 是否可以編輯歷史，或只能鏡像歷史。                                                   |
| OpenClaw 動態工具是否可用？            | 訊息、工作階段、排程，以及 OpenClaw 擁有的工具都依賴此能力。                                      |
| 動態工具掛鉤是否可用？                 | 外掛預期 `before_tool_call`、`after_tool_call`，以及圍繞 OpenClaw 擁有工具的中介軟體可用。 |
| 原生工具掛鉤是否可用？                 | Shell、patch，以及執行階段擁有的工具需要原生掛鉤支援，以便執行政策與觀察。                       |
| 情境引擎生命週期是否執行？             | 記憶與情境外掛依賴 assemble、ingest、after-turn 與壓縮生命週期。                                  |
| 會公開哪些壓縮資料？                   | 有些外掛只需要通知；其他外掛則需要保留/丟棄的中繼資料。                                           |
| 哪些項目刻意不支援？                   | 使用者不應在原生執行階段擁有更多狀態時，假設它等同於 OpenClaw。                                  |

Codex 執行階段支援契約記錄於
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 狀態標籤

狀態輸出可以同時顯示 `Execution` 與 `Runtime` 標籤。請將它們視為
診斷資訊，而不是提供者名稱：

- 例如 `openai/gpt-5.5` 的模型參照，是所選的提供者/模型。
- 例如 `codex` 的執行階段 ID，是正在執行該回合的迴圈。
- 例如 Telegram 或 Discord 的頻道標籤，是對話發生的位置。

如果某次執行顯示非預期的執行階段，請先檢查所選提供者/模型的
執行階段政策。舊版工作階段執行階段釘選不再決定路由。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)
- [OpenAI](/zh-TW/providers/openai)
- [代理 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [代理迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
