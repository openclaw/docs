---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生代理執行階段之間做選擇
    - 你對狀態或設定中的提供者/模型/執行階段標籤感到困惑
    - 你正在記錄原生測試框架的支援對等性
summary: OpenClaw 如何區分模型提供者、模型、通道和代理執行階段
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-05-03T21:30:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理執行階段**是擁有一個準備好的模型迴圈的元件：它接收提示詞、驅動模型輸出、處理原生工具呼叫，並將完成的回合傳回 OpenClaw。

執行階段很容易和提供者混淆，因為兩者都會出現在模型設定附近。它們是不同層：

| 層級          | 範例                                  | 含義                                                                 |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- |
| 提供者        | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何驗證身分、探索模型，以及命名模型參照。                 |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 為代理回合選取的模型。                                               |
| 代理執行階段 | `pi`, `codex`, `claude-cli`           | 執行已準備回合的底層迴圈或後端。                                     |
| 頻道          | Telegram, Discord, Slack, WhatsApp    | 訊息進入與離開 OpenClaw 的位置。                                     |

你也會在程式碼中看到 **harness** 這個詞。harness 是提供代理執行階段的實作。例如，隨附的 Codex harness 實作了 `codex` 執行階段。公開設定使用 `agentRuntime.id`；`openclaw doctor --fix` 會把較舊的執行階段政策鍵重寫為該形狀。

有兩種執行階段家族：

- **嵌入式 harness** 在 OpenClaw 已準備好的代理迴圈內執行。今天這包括內建的 `pi` 執行階段，以及已註冊的 Plugin harness，例如 `codex`。
- **CLI 後端** 會執行本機 CLI 程序，同時保持模型參照為標準形式。例如，`anthropic/claude-opus-4-7` 搭配 `agentRuntime.id: "claude-cli"` 表示「選取 Anthropic 模型，透過 Claude CLI 執行。」`claude-cli` 不是嵌入式 harness id，也不得傳給 AgentHarness 選取流程。

## Codex 介面

大多數混淆來自幾個不同介面共用 Codex 名稱：

| 介面                                                 | OpenClaw 名稱/設定                         | 作用                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server 執行階段                       | `openai/*` 加上 `agentRuntime.id: "codex"` | 透過 Codex app-server 執行嵌入式代理回合。這是一般的 ChatGPT/Codex 訂閱設定。                            |
| Codex OAuth 提供者路由                               | `openai-codex/*` 模型參照                  | 透過一般 OpenClaw PI 執行器使用 ChatGPT/Codex 訂閱 OAuth。                                                |
| Codex ACP 配接器                                    | `runtime: "acp"`, `agentId: "codex"`       | 透過外部 ACP/acpx 控制平面執行 Codex。僅在明確要求 ACP/acpx 時使用。                                      |
| 原生 Codex 聊天控制命令集                            | `/codex ...`                               | 從聊天中綁定、恢復、導引、停止及檢查 Codex app-server 執行緒。                                           |
| GPT/Codex 風格模型的 OpenAI Platform API 路由        | `openai/*` 模型參照                        | 使用 OpenAI API key 驗證，除非執行階段覆寫（例如 `agentRuntime.id: "codex"`）負責執行該回合。            |

這些介面刻意彼此獨立。啟用 `codex` Plugin 會讓原生 app-server 功能可用；它不會把 `openai-codex/*` 重寫為 `openai/*`，不會變更既有工作階段，也不會讓 ACP 成為 Codex 預設值。選取 `openai-codex/*` 表示「使用 Codex OAuth 提供者路由」，除非你另外強制指定執行階段。

常見的 ChatGPT/Codex 訂閱設定會使用 Codex OAuth 進行驗證，但保持模型參照為 `openai/*`，並選取 `codex` 執行階段：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

這表示 OpenClaw 選取 OpenAI 模型參照，然後要求 Codex app-server 執行階段執行嵌入式代理回合。這不表示「使用 API 計費」，也不表示頻道、模型提供者目錄或 OpenClaw 工作階段儲存區會變成 Codex。

當隨附的 `codex` Plugin 已啟用時，自然語言 Codex 控制應使用原生 `/codex` 命令介面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有在使用者明確要求 ACP/acpx，或正在測試 ACP 配接器路徑時，才對 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 與類似的外部 harness 仍使用 ACP。

這是面向代理的決策樹：

1. 如果使用者要求 **Codex bind/control/thread/resume/steer/stop**，在隨附的 `codex` Plugin 已啟用時，使用原生 `/codex` 命令介面。
2. 如果使用者要求 **將 Codex 作為嵌入式執行階段**，或想要一般由訂閱支援的 Codex 代理體驗，使用 `openai/<model>` 搭配 `agentRuntime.id: "codex"`。
3. 如果使用者要求 **在一般 OpenClaw 執行器上使用 Codex OAuth/訂閱驗證**，使用 `openai-codex/<model>`，並讓執行階段維持為 PI。
4. 如果使用者明確說 **ACP**、**acpx** 或 **Codex ACP adapter**，使用 ACP 搭配 `runtime: "acp"` 與 `agentId: "codex"`。
5. 如果請求是針對 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，使用 ACP/acpx，而不是原生子代理執行階段。

| 你的意思是...                         | 使用...                                      |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server 聊天/執行緒控制      | 隨附 `codex` Plugin 的 `/codex ...`          |
| Codex app-server 嵌入式代理執行階段   | `agentRuntime.id: "codex"`                   |
| PI 執行器上的 OpenAI Codex OAuth      | `openai-codex/*` 模型參照                   |
| Claude Code 或其他外部 harness        | ACP/acpx                                     |

關於 OpenAI 系列前綴分流，請參閱 [OpenAI](/zh-TW/providers/openai) 和 [模型提供者](/zh-TW/concepts/model-providers)。關於 Codex 執行階段支援合約，請參閱 [Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 執行階段所有權

不同執行階段擁有迴圈的不同部分。

| 介面                        | OpenClaw PI 嵌入式                    | Codex app-server                                                            |
| --------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者              | OpenClaw 透過 PI 嵌入式執行器        | Codex app-server                                                            |
| 標準執行緒狀態              | OpenClaw 逐字稿                      | Codex 執行緒，加上 OpenClaw 逐字稿鏡像                                      |
| OpenClaw 動態工具           | 原生 OpenClaw 工具迴圈               | 透過 Codex 配接器橋接                                                       |
| 原生 shell 與檔案工具       | PI/OpenClaw 路徑                     | Codex 原生工具，於支援處透過原生 hook 橋接                                  |
| 上下文引擎                  | 原生 OpenClaw 上下文組裝             | OpenClaw 將專案組裝的上下文投射到 Codex 回合                                |
| Compaction                  | OpenClaw 或選取的上下文引擎          | Codex 原生壓縮，搭配 OpenClaw 通知與鏡像維護                                |
| 頻道傳遞                    | OpenClaw                              | OpenClaw                                                                    |

這個所有權分工是主要設計規則：

- 如果 OpenClaw 擁有該介面，OpenClaw 就能提供一般 Plugin hook 行為。
- 如果原生執行階段擁有該介面，OpenClaw 需要執行階段事件或原生 hook。
- 如果原生執行階段擁有標準執行緒狀態，OpenClaw 應該鏡像並投射上下文，而不是重寫不受支援的內部狀態。

## 執行階段選取

OpenClaw 會在提供者與模型解析後選擇嵌入式執行階段：

1. 工作階段記錄的執行階段優先。設定變更不會把既有逐字稿即時切換到不同的原生執行緒系統。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會為新的或重設後的工作階段強制使用該執行階段。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可設定為 `auto`、`pi`、已註冊的嵌入式 harness id（例如 `codex`），或受支援的 CLI 後端別名（例如 `claude-cli`）。
4. 在 `auto` 模式中，已註冊的 Plugin 執行階段可以宣告支援的提供者/模型配對。
5. 如果在 `auto` 模式中沒有執行階段宣告某個回合，OpenClaw 會使用 PI 作為相容性執行階段。當執行必須嚴格時，請使用明確的執行階段 id。

明確指定的 Plugin 執行階段會封閉失敗。例如，`agentRuntime.id: "codex"` 表示 Codex 或清楚的選取/執行階段錯誤；它絕不會靜默路由回 PI。

CLI 後端別名不同於嵌入式 harness id。偏好的 Claude CLI 形式是：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

為了相容性，仍支援 `claude-cli/claude-opus-4-7` 等舊版參照，但新設定應保持提供者/模型為標準形式，並把執行後端放在 `agentRuntime.id` 中。

`auto` 模式刻意保守。Plugin 執行階段可以宣告它們理解的提供者/模型配對，但 Codex Plugin 不會在 `auto` 模式中宣告 `openai-codex` 提供者。這會讓 `openai-codex/*` 保持為明確的 PI Codex OAuth 路由，並避免將訂閱驗證設定靜默移到原生 app-server harness 上。

如果 `openclaw doctor` 警告 `codex` Plugin 已啟用，而 `openai-codex/*` 仍透過 PI 路由，請把它視為診斷，而不是遷移。當你想要 PI Codex OAuth 時，保持設定不變。只有在你想要原生 Codex app-server 執行時，才切換到 `openai/<model>` 加上 `agentRuntime.id: "codex"`。

## 相容性合約

當執行階段不是 PI 時，它應記錄自己支援哪些 OpenClaw 介面。執行階段文件請使用此形狀：

| 問題                                   | 重要原因                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                       | 決定重試、工具接續與最終答案決策發生的位置。                                                      |
| 誰擁有標準執行緒歷史？                 | 決定 OpenClaw 是否能編輯歷史，或只能鏡像它。                                                      |
| OpenClaw 動態工具是否可用？            | 訊息、工作階段、cron 與 OpenClaw 擁有的工具依賴此能力。                                           |
| 動態工具 hook 是否可用？               | Plugin 會期待 OpenClaw 擁有的工具周圍有 `before_tool_call`、`after_tool_call` 與 middleware。     |
| 原生工具 hook 是否可用？               | Shell、patch 與執行階段擁有的工具需要原生 hook 支援，才能套用政策與觀察。                        |
| 上下文引擎生命週期是否執行？           | 記憶與上下文 Plugin 依賴 assemble、ingest、after-turn 與 compaction 生命週期。                    |
| 暴露哪些 compaction 資料？             | 有些 Plugin 只需要通知，其他則需要保留/丟棄的中繼資料。                                          |
| 哪些內容刻意不支援？                   | 使用者不應在原生執行階段擁有更多狀態時假設它與 PI 等效。                                         |

Codex 執行階段支援合約記錄於 [Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 狀態標籤

狀態輸出可能會同時顯示 `Execution` 和 `Runtime` 標籤。請將它們視為診斷資訊，而不是提供者名稱。

- 像 `openai/gpt-5.5` 這樣的模型參照會告訴你所選的提供者/模型。
- 像 `codex` 這樣的 runtime id 會告訴你哪個迴圈正在執行該回合。
- 像 Telegram 或 Discord 這樣的頻道標籤會告訴你對話發生在哪裡。

如果工作階段在變更 Runtime 設定後仍顯示 PI，請使用 `/new` 開始新的工作階段，或使用 `/reset` 清除目前的工作階段。現有工作階段會保留其記錄的 Runtime，因此轉錄不會透過兩個不相容的原生工作階段系統重新播放。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [OpenAI](/zh-TW/providers/openai)
- [Agent harness plugins](/zh-TW/plugins/sdk-agent-harness)
- [Agent loop](/zh-TW/concepts/agent-loop)
- [Models](/zh-TW/concepts/models)
- [Status](/zh-TW/cli/status)
