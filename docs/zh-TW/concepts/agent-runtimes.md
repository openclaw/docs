---
read_when:
    - 你正在 OpenClaw、Codex、ACP 或其他原生代理執行階段之間做選擇
    - 你對狀態或設定中的提供者/模型/執行階段標籤感到困惑
    - 你正在記錄原生測試框架的支援一致性
summary: OpenClaw 如何區分模型供應商、模型、通道與代理執行階段
title: 代理執行階段
x-i18n:
    generated_at: "2026-06-27T19:09:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理程式執行階段**是擁有一個已準備模型迴圈的元件：它會
接收提示、驅動模型輸出、處理原生工具呼叫，並將完成的回合傳回
OpenClaw。

執行階段很容易與供應商混淆，因為兩者都會出現在模型設定附近。
它們是不同層：

| 層級          | 範例                                         | 含義                                                                |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| 供應商        | `openai`, `anthropic`, `github-copilot`      | OpenClaw 如何驗證、探索模型，以及命名模型參照。                    |
| 模型          | `gpt-5.5`, `claude-opus-4-6`                 | 為代理程式回合選取的模型。                                        |
| 代理程式執行階段 | `openclaw`, `codex`, `copilot`, `claude-cli` | 執行已準備回合的低階迴圈或後端。                                  |
| 頻道          | Telegram, Discord, Slack, WhatsApp           | 訊息進出 OpenClaw 的位置。                                         |

你也會在程式碼中看到 **harness** 這個詞。harness 是提供代理程式執行階段的實作。
例如，內建的 Codex harness 實作了 `codex` 執行階段。公開設定會在
供應商或模型項目上使用 `agentRuntime.id`；整個代理程式的執行階段鍵是舊版設定，會被忽略。
`openclaw doctor --fix` 會移除舊的整個代理程式執行階段固定設定，並在需要時將
舊版執行階段模型參照重寫為標準供應商/模型參照加上模型範圍的
執行階段政策。

執行階段有兩個家族：

- **嵌入式 harness** 在 OpenClaw 已準備的代理程式迴圈內執行。今天這
  包含內建的 `openclaw` 執行階段，以及已註冊的外掛 harness，例如
  `codex` 和 `copilot`。
- **命令列介面後端** 會執行本機命令列介面處理程序，同時保持模型參照
  為標準形式。例如，`anthropic/claude-opus-4-8` 搭配
  模型範圍的 `agentRuntime.id: "claude-cli"`，表示「選取 Anthropic
  模型，透過 Claude CLI 執行。」`claude-cli` 不是嵌入式 harness ID，
  且不得傳給 AgentHarness 選取流程。

`copilot` harness 是獨立、需選擇啟用的外部外掛 harness，用於
GitHub Copilot CLI；關於 PI、Codex 與 GitHub Copilot 代理程式執行階段之間的使用者面向決策，請參閱
[GitHub Copilot 代理程式執行階段](/zh-TW/plugins/copilot)。

## Codex 介面

多數混淆來自數個不同介面共用 Codex 名稱：

| 介面                                             | OpenClaw 名稱/設定                    | 功能                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 執行階段                   | `openai/*` 模型參照                  | 透過 Codex app-server 執行 OpenAI 嵌入式代理程式回合。這是一般的 ChatGPT/Codex 訂閱設定。                    |
| Codex OAuth 驗證設定檔                           | `openai` OAuth 設定檔                | 儲存 Codex app-server harness 所使用的 ChatGPT/Codex 訂閱驗證。                                               |
| Codex ACP 配接器                                 | `runtime: "acp"`, `agentId: "codex"` | 透過外部 ACP/acpx 控制平面執行 Codex。只有在明確要求 ACP/acpx 時才使用。                                     |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                         | 從聊天綁定、恢復、導引、停止並檢查 Codex app-server 執行緒。                                                  |
| 非代理程式介面的 OpenAI Platform API 路由        | `openai/*` 加上 API 金鑰驗證         | 用於直接 OpenAI API，例如影像、嵌入、語音和即時功能。                                                         |

這些介面刻意彼此獨立。啟用 `codex` 外掛會讓
原生 app-server 功能可用；`openclaw doctor --fix` 負責舊版
Codex 路由修復和過時工作階段固定設定清理。現在為代理程式模型選取
`openai/*`，表示「透過 Codex 執行這個」，除非正在使用的是
非代理程式 OpenAI API 介面。

常見的 ChatGPT/Codex 訂閱設定會使用 Codex OAuth 進行驗證，但會保持
模型參照為 `openai/*`，並選取 `codex` 執行階段：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

這表示 OpenClaw 會選取 OpenAI 模型參照，然後要求 Codex app-server
執行階段執行嵌入式代理程式回合。它不表示「使用 API 計費」，也不表示
頻道、模型供應商目錄或 OpenClaw 工作階段儲存會變成 Codex。

啟用內建的 `codex` 外掛時，自然語言 Codex 控制
應使用原生 `/codex` 命令介面（`/codex bind`、`/codex threads`、
`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有在
使用者明確要求 ACP/acpx，或正在測試 ACP 配接器路徑時，才對
Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 以及類似的外部
harness 仍然使用 ACP。

這是面向代理程式的決策樹：

1. 如果使用者要求 **Codex 綁定/控制/執行緒/恢復/導引/停止**，且已啟用內建的 `codex` 外掛，
   請使用原生 `/codex` 命令介面。
2. 如果使用者要求 **Codex 作為嵌入式執行階段**，或想要一般的
   訂閱支援 Codex 代理程式體驗，請使用 `openai/<model>`。
3. 如果使用者明確選擇 **OpenClaw 用於 OpenAI 模型**，請保持模型參照
   為 `openai/<model>`，並將供應商/模型執行階段政策設為
   `agentRuntime.id: "openclaw"`。選取的 `openai` OAuth 設定檔會在內部
   透過 OpenClaw 的 Codex 驗證傳輸路由。
4. 如果舊版設定仍包含 **舊版 Codex 模型參照**，請使用
   `openai/<model>` 搭配 `openclaw doctor --fix` 修復；doctor 會在舊模型參照暗示需要時，
   透過加入供應商/模型範圍的 `agentRuntime.id: "codex"` 保留 Codex 驗證
   路由。
   舊版 **`codex-cli/*` 模型參照** 會修復為相同的 `openai/<model>` Codex
   app-server 路由；OpenClaw 不再保留內建的 Codex CLI 後端。
5. 如果使用者明確說 **ACP**、**acpx** 或 **Codex ACP 配接器**，請使用
   搭配 `runtime: "acp"` 與 `agentId: "codex"` 的 ACP。
6. 如果要求是針對 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或
   其他外部 harness**，請使用 ACP/acpx，而不是原生子代理程式執行階段。

| 你的意思是...                         | 使用...                                      |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/執行緒控制      | 來自內建 `codex` 外掛的 `/codex ...`         |
| Codex app-server 嵌入式代理程式執行階段 | `openai/*` 代理程式模型參照                  |
| OpenAI Codex OAuth                    | `openai` OAuth 設定檔                        |
| Claude Code 或其他外部 harness        | ACP/acpx                                     |

關於 OpenAI 家族前綴分拆，請參閱 [OpenAI](/zh-TW/providers/openai) 和
[模型供應商](/zh-TW/concepts/model-providers)。關於 Codex 執行階段支援
合約，請參閱 [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 執行階段擁有權

不同執行階段擁有迴圈中不同範圍的部分。

| 介面                        | OpenClaw 嵌入式                              | Codex app-server                                                            |
| --------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者              | OpenClaw 透過 OpenClaw 嵌入式 runner         | Codex app-server                                                            |
| 標準執行緒狀態              | OpenClaw 文字記錄                            | Codex 執行緒，加上 OpenClaw 文字記錄鏡像                                   |
| OpenClaw 動態工具           | 原生 OpenClaw 工具迴圈                       | 透過 Codex 配接器橋接                                                      |
| 原生 shell 與檔案工具       | OpenClaw 路徑                                | Codex 原生工具，在支援處透過原生 hook 橋接                                 |
| 情境引擎                    | 原生 OpenClaw 情境組裝                       | OpenClaw 將專案組裝好的情境投射到 Codex 回合中                             |
| 壓縮                        | OpenClaw 或選取的情境引擎                    | Codex 原生壓縮，搭配 OpenClaw 通知和鏡像維護                               |
| 頻道傳遞                    | OpenClaw                                     | OpenClaw                                                                    |

這個擁有權分拆是主要設計規則：

- 如果 OpenClaw 擁有該介面，OpenClaw 可以提供一般的外掛 hook 行為。
- 如果原生執行階段擁有該介面，OpenClaw 需要執行階段事件或原生 hook。
- 如果原生執行階段擁有標準執行緒狀態，OpenClaw 應該鏡像並投射情境，而不是重寫不受支援的內部狀態。

## 執行階段選取

OpenClaw 會在供應商和模型解析後選擇嵌入式執行階段：

1. 模型範圍的執行階段政策優先。這可以位於已設定的供應商
   模型項目中，或位於 `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`。供應商萬用字元
   例如 `agents.defaults.models["vllm/*"].agentRuntime` 會在精確
   模型政策之後套用，因此動態探索到的供應商模型可以共用一個
   執行階段，而不會覆寫精確的逐模型例外。
2. 接著是位於
   `models.providers.<provider>.agentRuntime` 的供應商範圍執行階段政策。
3. 在 `auto` 模式中，已註冊的外掛執行階段可以宣告支援的供應商/模型
   配對。
4. 如果在 `auto` 模式中沒有執行階段宣告某個回合，OpenClaw 會使用 `openclaw` 作為
   相容性執行階段。當執行必須嚴格時，請使用明確的執行階段 ID。

整個工作階段和整個代理程式的執行階段固定設定會被忽略。這包括
`OPENCLAW_AGENT_RUNTIME`、工作階段 `agentHarnessId`/`agentRuntimeOverride` 狀態、
`agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。執行
`openclaw doctor --fix` 可移除過時的整個代理程式執行階段設定，並在 OpenClaw 能保留意圖時轉換
舊版執行階段模型參照。

明確的供應商/模型外掛執行階段會封閉失敗。例如，
供應商或模型上的 `agentRuntime.id: "codex"` 表示 Codex 或明確的
選取/執行階段錯誤；它絕不會被靜默路由回 OpenClaw。

命令列介面後端別名不同於嵌入式 harness ID。偏好的
Claude CLI 形式是：

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

舊版參照例如 `claude-cli/claude-opus-4-7` 仍為了相容性而支援，
但新設定應保持供應商/模型為標準形式，並將
執行後端放在供應商/模型執行階段政策中。

舊版 `codex-cli/*` 參照則不同：doctor 會將它們遷移到 `openai/*`，讓
它們透過 Codex app-server harness 執行，而不是保留 Codex CLI
後端。

`auto` 模式對多數供應商刻意保守。OpenAI 代理程式
模型是例外：未設定執行階段和 `auto` 都會解析為 Codex
harness。明確的 OpenClaw 執行階段設定仍是 `openai/*` 代理程式回合的
選擇性相容路由；當搭配選取的 `openai` OAuth 設定檔時，
OpenClaw 會在內部透過 Codex 驗證傳輸路由該路徑，同時
保持公開模型參照為 `openai/*`。過時的 OpenAI 執行階段工作階段固定設定會
被執行階段選取忽略，並可使用 `openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` 外掛已啟用，但
設定中仍保留舊版 Codex 模型參照，請將其視為舊版路由狀態。執行
`openclaw doctor --fix`，將其改寫為使用 Codex 執行階段的 `openai/*`。

## GitHub Copilot 代理執行階段

外部 `@openclaw/copilot` 外掛會註冊一個選擇性啟用的 `copilot` 執行階段，
其背後由 GitHub Copilot 命令列介面（`@github/copilot-sdk`）支援。它宣告
標準訂閱 `github-copilot` 供應商，且**永遠不會**由
`auto` 選取。透過 `agentRuntime.id` 依模型或依供應商選擇啟用：

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

此 harness 會在 `extensions/copilot/doctor-contract-api.ts` 中宣告其供應商、執行階段、命令列介面工作階段金鑰與驗證設定檔
前綴，而 `openclaw doctor` 會自動載入它。關於設定、驗證、transcript 鏡像、
壓縮、宣告式 doctor contract，以及更廣泛的 PI 與 Codex 與
Copilot SDK 決策，請參閱 [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)。

## 相容性合約

當某個執行階段不是 OpenClaw 時，它應記錄其支援哪些 OpenClaw 介面。
執行階段文件請使用這個形式：

| 問題                                   | 為什麼重要                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                       | 決定重試、工具續行與最終答案決策發生在哪裡。                                                     |
| 誰擁有標準對話串歷程？                 | 決定 OpenClaw 能否編輯歷程，或只能鏡像它。                                                        |
| OpenClaw 動態工具是否可用？            | 訊息、工作階段、排程，以及 OpenClaw 擁有的工具都仰賴這一點。                                      |
| 動態工具 hooks 是否可用？              | 外掛會預期在 OpenClaw 擁有的工具周圍有 `before_tool_call`、`after_tool_call` 與 middleware。       |
| 原生工具 hooks 是否可用？              | Shell、patch 與執行階段擁有的工具，需要原生 hook 支援，以便進行政策控管與觀察。                  |
| context engine 生命週期是否會執行？    | 記憶體與 context 外掛依賴 assemble、ingest、after-turn 與壓縮生命週期。                           |
| 會公開哪些壓縮資料？                   | 有些外掛只需要通知，而其他外掛需要保留/捨棄的 metadata。                                          |
| 哪些項目刻意不支援？                   | 使用者不應在原生執行階段擁有更多狀態的地方，假設其等同於 OpenClaw。                              |

Codex 執行階段支援合約記錄於
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 狀態標籤

狀態輸出可能同時顯示 `Execution` 與 `Runtime` 標籤。請將它們解讀為
診斷資訊，而不是供應商名稱。

- 像 `openai/gpt-5.5` 這樣的模型參照，會告訴你選取的供應商/模型。
- 像 `codex` 這樣的執行階段 ID，會告訴你是哪個迴圈正在執行這一輪。
- 像 Telegram 或 Discord 這樣的頻道標籤，會告訴你對話發生在哪裡。

如果某次執行仍顯示非預期的執行階段，請先檢查選取的供應商/模型
執行階段政策。舊版工作階段執行階段固定值不再決定路由。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [GitHub Copilot 代理執行階段](/zh-TW/plugins/copilot)
- [OpenAI](/zh-TW/providers/openai)
- [代理 harness 外掛](/zh-TW/plugins/sdk-agent-harness)
- [代理迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
