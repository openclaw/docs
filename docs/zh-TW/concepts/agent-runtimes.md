---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生代理執行環境之間做選擇
    - 你對狀態或設定中的提供者/模型/執行階段標籤感到困惑
    - 您正在記錄原生執行框架的支援對等性
summary: OpenClaw 如何區分模型提供者、模型、通道與代理執行環境
title: 代理執行環境
x-i18n:
    generated_at: "2026-05-10T19:30:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理執行階段**是擁有一個已準備模型迴圈的元件：它
接收提示、驅動模型輸出、處理原生工具呼叫，並將
完成的回合傳回 OpenClaw。

執行階段很容易和提供者混淆，因為兩者都會出現在模型
設定附近。它們是不同的層級：

| 層級          | 範例                                  | 意義                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供者        | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何驗證身分、探索模型，以及命名模型參照。                |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 為代理回合選取的模型。                                             |
| 代理執行階段  | `pi`, `codex`, `claude-cli`           | 執行已準備回合的低階迴圈或後端。                                  |
| 通道          | Telegram, Discord, Slack, WhatsApp    | 訊息進出 OpenClaw 的位置。                                         |

你也會在程式碼中看到 **harness** 這個字。harness 是提供
代理執行階段的實作。例如，內建的 Codex harness
實作了 `codex` 執行階段。公開設定會在提供者或模型項目上使用
`agentRuntime.id`；整個代理層級的執行階段鍵是舊版設定，且會被忽略。
`openclaw doctor --fix` 會移除舊的整個代理執行階段釘選，並在需要時將
舊版執行階段模型參照重寫為標準提供者/模型參照，加上模型範圍的
執行階段政策。

執行階段有兩個家族：

- **嵌入式 harness** 會在 OpenClaw 已準備的代理迴圈內執行。目前這
  包含內建的 `pi` 執行階段，以及已註冊的 Plugin harness，例如
  `codex`。
- **CLI 後端** 會執行本機 CLI 程序，同時保持模型參照為
  標準形式。例如，`anthropic/claude-opus-4-7` 搭配
  模型範圍的 `agentRuntime.id: "claude-cli"` 表示「選取 Anthropic
  模型，透過 Claude CLI 執行。」`claude-cli` 不是嵌入式 harness ID，
  且不得傳給 AgentHarness 選擇。

## Codex 介面

多數混淆來自幾個不同介面共用 Codex 名稱：

| 介面                                             | OpenClaw 名稱/設定                     | 作用                                                                                                           |
| ------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 執行階段                   | `openai/*` 模型參照                    | 透過 Codex app-server 執行 OpenAI 嵌入式代理回合。這是一般的 ChatGPT/Codex 訂閱設定。                         |
| Codex OAuth 驗證設定檔                           | `openai-codex` 驗證提供者              | 儲存 Codex app-server harness 使用的 ChatGPT/Codex 訂閱驗證。                                                  |
| Codex ACP 介面卡                                 | `runtime: "acp"`, `agentId: "codex"`   | 透過外部 ACP/acpx 控制平面執行 Codex。只有在明確要求 ACP/acpx 時才使用。                                      |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                           | 從聊天綁定、恢復、導引、停止，以及檢查 Codex app-server 執行緒。                                               |
| 非代理介面的 OpenAI Platform API 路由            | `openai/*` 加上 API 金鑰驗證           | 用於直接 OpenAI API，例如影像、嵌入、語音，以及即時功能。                                                      |

這些介面刻意保持獨立。啟用 `codex` Plugin 會讓
原生 app-server 功能可用；`openclaw doctor --fix` 負責舊版
`openai-codex/*` 路由修復與過期工作階段釘選清理。現在為代理模型選取
`openai/*` 表示「透過 Codex 執行這個項目」，除非正在使用
非代理的 OpenAI API 介面。

常見的 ChatGPT/Codex 訂閱設定會使用 Codex OAuth 進行驗證，但保持
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
執行階段執行嵌入式代理回合。這不表示「使用 API 計費」，也不表示
通道、模型提供者目錄，或 OpenClaw 工作階段儲存會變成 Codex。

啟用內建的 `codex` Plugin 時，自然語言 Codex 控制應使用原生
`/codex` 命令介面（`/codex bind`、`/codex threads`、`/codex resume`、
`/codex steer`、`/codex stop`），而不是 ACP。只有在使用者明確要求
ACP/acpx 或正在測試 ACP 介面卡路徑時，才對 Codex 使用 ACP。
Claude Code、Gemini CLI、OpenCode、Cursor，以及類似的外部
harness 仍然使用 ACP。

這是面向代理的決策樹：

1. 如果使用者要求 **Codex 綁定/控制/執行緒/恢復/導引/停止**，且內建的
   `codex` Plugin 已啟用，請使用原生 `/codex` 命令介面。
2. 如果使用者要求 **Codex 作為嵌入式執行階段**，或想要一般
   訂閱支援的 Codex 代理體驗，請使用 `openai/<model>`。
3. 如果使用者明確為 **OpenAI 模型選擇 PI**，請保持模型參照為
   `openai/<model>`，並將提供者/模型執行階段政策設為
   `agentRuntime.id: "pi"`。選取的 `openai-codex` 驗證設定檔會在內部
   透過 PI 的舊版 Codex 驗證傳輸路由。
4. 如果舊版設定仍包含 **`openai-codex/*` 模型參照**，請使用
   `openclaw doctor --fix` 將它修復為 `openai/<model>`；當舊模型參照
   暗示 Codex 驗證路由時，doctor 會加入提供者/模型範圍的
   `agentRuntime.id: "codex"` 來保留該路由。
5. 如果使用者明確說 **ACP**、**acpx**，或 **Codex ACP 介面卡**，請使用
   ACP，並設定 `runtime: "acp"` 與 `agentId: "codex"`。
6. 如果要求的是 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid，或
   另一個外部 harness**，請使用 ACP/acpx，而不是原生子代理執行階段。

| 你的意思是...                         | 使用...                                      |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/執行緒控制      | 內建 `codex` Plugin 的 `/codex ...`          |
| Codex app-server 嵌入式代理執行階段   | `openai/*` 代理模型參照                      |
| OpenAI Codex OAuth                    | `openai-codex` 驗證設定檔                    |
| Claude Code 或其他外部 harness        | ACP/acpx                                     |

如需 OpenAI 家族前綴分流，請參閱 [OpenAI](/zh-TW/providers/openai) 和
[模型提供者](/zh-TW/concepts/model-providers)。如需 Codex 執行階段支援
合約，請參閱 [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 執行階段所有權

不同執行階段擁有不同範圍的迴圈。

| 介面                        | OpenClaw PI 嵌入式                      | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者              | OpenClaw 透過 PI 嵌入式執行器          | Codex app-server                                                            |
| 標準執行緒狀態              | OpenClaw 逐字稿                         | Codex 執行緒，加上 OpenClaw 逐字稿鏡像                                      |
| OpenClaw 動態工具           | 原生 OpenClaw 工具迴圈                  | 透過 Codex 介面卡橋接                                                       |
| 原生 shell 與檔案工具       | PI/OpenClaw 路徑                        | Codex 原生工具，在支援時透過原生 hook 橋接                                  |
| 情境引擎                    | 原生 OpenClaw 情境組裝                  | OpenClaw 將專案組裝的情境投射到 Codex 回合中                                |
| Compaction                  | OpenClaw 或選取的情境引擎              | Codex 原生 compaction，搭配 OpenClaw 通知與鏡像維護                          |
| 通道傳遞                    | OpenClaw                                | OpenClaw                                                                    |

這個所有權分離是主要設計規則：

- 如果 OpenClaw 擁有該介面，OpenClaw 可以提供一般 Plugin hook 行為。
- 如果原生執行階段擁有該介面，OpenClaw 需要執行階段事件或原生 hook。
- 如果原生執行階段擁有標準執行緒狀態，OpenClaw 應該鏡像並投射情境，而不是重寫不受支援的內部狀態。

## 執行階段選擇

OpenClaw 會在提供者與模型解析後選擇嵌入式執行階段：

1. 模型範圍的執行階段政策優先。這可以位於已設定的提供者
   模型項目，或位於 `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`。
2. 接著是位於
   `models.providers.<provider>.agentRuntime` 的提供者範圍執行階段政策。
3. 在 `auto` 模式中，已註冊的 Plugin 執行階段可以宣告支援的提供者/模型
   配對。
4. 如果在 `auto` 模式中沒有執行階段宣告某個回合，OpenClaw 會使用 PI 作為
   相容性執行階段。當執行必須嚴格時，請使用明確的執行階段 ID。

整個工作階段與整個代理的執行階段釘選都會被忽略。這包括
`OPENCLAW_AGENT_RUNTIME`、工作階段 `agentHarnessId`/`agentRuntimeOverride` 狀態、
`agents.defaults.agentRuntime`，以及 `agents.list[].agentRuntime`。執行
`openclaw doctor --fix` 可移除過期的整個代理執行階段設定，並在 OpenClaw 能保留意圖時
轉換舊版執行階段模型參照。

明確的提供者/模型 Plugin 執行階段會封閉失敗。例如，提供者或模型上的
`agentRuntime.id: "codex"` 表示 Codex 或清楚的選擇/執行階段錯誤；
它永遠不會靜默路由回 PI。

CLI 後端別名不同於嵌入式 harness ID。偏好的 Claude CLI 形式是：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

舊版參照，例如 `claude-cli/claude-opus-4-7`，仍因相容性而受到支援，
但新設定應保持提供者/模型為標準形式，並將執行後端放在提供者/模型
執行階段政策中。

對多數提供者而言，`auto` 模式刻意保守。OpenAI 代理模型是例外：
未設定執行階段與 `auto` 都會解析到 Codex harness。明確的 PI 執行階段
設定仍是 `openai/*` 代理回合的選擇性相容路由；當它搭配選取的
`openai-codex` 驗證設定檔時，OpenClaw 會在內部將 PI 透過舊版
Codex 驗證傳輸路由，同時保持公開模型參照為 `openai/*`。過期的
OpenAI PI 工作階段釘選會被執行階段選擇忽略，並可使用
`openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` Plugin 已啟用，但設定中仍有
`openai-codex/*`，請將那視為舊版路由狀態。執行
`openclaw doctor --fix` 將它重寫為帶有 Codex 執行階段的 `openai/*`。

## 相容性合約

當執行階段不是 PI 時，它應記錄其支援哪些 OpenClaw 介面。
請使用此格式撰寫執行階段文件：

| 問題                                   | 為什麼重要                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                       | 決定重試、工具延續，以及最終答案決策發生的位置。                                                   |
| 誰擁有規範對話串歷史？                 | 決定 OpenClaw 是否可以編輯歷史，或只能鏡像它。                                                     |
| OpenClaw 動態工具是否可用？            | 訊息、工作階段、Cron，以及 OpenClaw 擁有的工具都依賴此功能。                                       |
| 動態工具 hook 是否可用？               | Plugin 預期在 OpenClaw 擁有的工具周圍使用 `before_tool_call`、`after_tool_call` 和 middleware。    |
| 原生工具 hook 是否可用？               | Shell、patch，以及執行階段擁有的工具需要原生 hook 支援，以便執行政策與觀察。                      |
| 內容引擎生命週期是否執行？             | Memory 和內容 Plugin 依賴組裝、擷取、回合後，以及 Compaction 生命週期。                           |
| 會公開哪些 Compaction 資料？           | 有些 Plugin 只需要通知，而其他 Plugin 需要保留/捨棄的中繼資料。                                   |
| 哪些內容是刻意不支援的？               | 使用者不應在原生執行階段擁有更多狀態時，假設它與 PI 等價。                                        |

Codex 執行階段支援合約記錄於
[Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime#v1-support-contract)。

## 狀態標籤

狀態輸出可能同時顯示 `Execution` 和 `Runtime` 標籤。請將它們解讀為
診斷資訊，而不是提供者名稱。

- 像 `openai/gpt-5.5` 這樣的模型參照會告訴你選取的提供者/模型。
- 像 `codex` 這樣的執行階段 ID 會告訴你哪個迴圈正在執行該回合。
- 像 Telegram 或 Discord 這樣的頻道標籤會告訴你對話發生的位置。

如果一次執行仍顯示非預期的執行階段，請先檢查所選提供者/模型的
執行階段政策。舊版工作階段執行階段釘選不再決定路由。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [Codex harness 執行階段](/zh-TW/plugins/codex-harness-runtime)
- [OpenAI](/zh-TW/providers/openai)
- [Agent harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [Agent 迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
