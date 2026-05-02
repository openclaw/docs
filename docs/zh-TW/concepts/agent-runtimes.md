---
read_when:
    - 你正在 PI、Codex、ACP 或另一個原生代理執行階段之間做選擇
    - 你對狀態或設定中的供應商／模型／執行階段標籤感到困惑
    - 你正在記錄原生測試框架的支援同等性
summary: OpenClaw 如何分離模型提供者、模型、通道和代理程式執行階段
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-05-02T02:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

一個 **agent runtime** 是擁有一個已準備模型迴圈的元件：它會
接收提示、驅動模型輸出、處理原生工具呼叫，並將
完成的回合傳回 OpenClaw。

Runtime 很容易與 provider 混淆，因為兩者都會出現在模型
設定附近。它們是不同的層級：

| 層級          | 範例                                  | 含義                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何驗證、探索模型，以及命名模型參照。                    |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 為 agent 回合選取的模型。                                          |
| Agent runtime | `pi`, `codex`, `claude-cli`           | 執行已準備回合的低階迴圈或後端。                                  |
| Channel       | Telegram, Discord, Slack, WhatsApp    | 訊息進入與離開 OpenClaw 的地方。                                   |

你也會在程式碼中看到 **harness** 這個詞。harness 是提供
agent runtime 的實作。例如，內建的 Codex harness
會實作 `codex` runtime。公開設定使用 `agentRuntime.id`；`openclaw
doctor --fix` 會將較舊的 runtime-policy key 改寫成該形狀。

Runtime 有兩個家族：

- **嵌入式 harness** 會在 OpenClaw 已準備的 agent 迴圈內執行。目前這
  包含內建的 `pi` runtime，以及已註冊的 Plugin harness，例如
  `codex`。
- **CLI 後端** 會執行本機 CLI 程序，同時保持模型參照
  的標準形式。例如，`anthropic/claude-opus-4-7` 搭配
  `agentRuntime.id: "claude-cli"` 表示「選取 Anthropic 模型，透過
  Claude CLI 執行」。`claude-cli` 不是嵌入式 harness id，也不得
  傳給 AgentHarness 選取流程。

## Codex 介面

大多數混淆來自幾個不同介面共用 Codex 名稱：

| 介面                                                 | OpenClaw 名稱/設定                         | 功能                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| 原生 Codex app-server runtime                        | `openai/*` 加上 `agentRuntime.id: "codex"` | 透過 Codex app-server 執行嵌入式 agent 回合。這是常見的 ChatGPT/Codex 訂閱設定。                          |
| Codex OAuth provider 路由                            | `openai-codex/*` 模型參照                 | 透過一般 OpenClaw PI runner 使用 ChatGPT/Codex 訂閱 OAuth。                                               |
| Codex ACP 介面卡                                    | `runtime: "acp"`, `agentId: "codex"`       | 透過外部 ACP/acpx 控制平面執行 Codex。只有在明確要求 ACP/acpx 時才使用。                                  |
| 原生 Codex chat-control 指令集                       | `/codex ...`                               | 從聊天中繫結、恢復、導向、停止及檢查 Codex app-server thread。                                            |
| GPT/Codex 風格模型的 OpenAI Platform API 路由        | `openai/*` 模型參照                       | 使用 OpenAI API-key 驗證，除非有 runtime 覆寫，例如 `agentRuntime.id: "codex"` 來執行該回合。             |

這些介面刻意彼此獨立。啟用 `codex` Plugin 會讓
原生 app-server 功能可用；它不會將
`openai-codex/*` 改寫成 `openai/*`，不會變更既有工作階段，也不會
讓 ACP 成為 Codex 預設值。選取 `openai-codex/*` 表示「使用 Codex
OAuth provider 路由」，除非你另外強制指定 runtime。

常見的 ChatGPT/Codex 訂閱設定會使用 Codex OAuth 進行驗證，但保留
模型參照為 `openai/*`，並選取 `codex` runtime：

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

這表示 OpenClaw 會選取 OpenAI 模型參照，接著要求 Codex app-server
runtime 執行嵌入式 agent 回合。這不表示「使用 API 計費」，也不表示
channel、模型 provider 目錄，或 OpenClaw 工作階段儲存會變成 Codex。

當內建的 `codex` Plugin 啟用時，自然語言 Codex 控制
應使用原生 `/codex` 指令介面（`/codex bind`、`/codex threads`、
`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有在
使用者明確要求 ACP/acpx，或正在測試 ACP 介面卡路徑時，才對 Codex
使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor，以及類似的外部
harness 仍然使用 ACP。

這是面向 agent 的決策樹：

1. 如果使用者要求 **Codex bind/control/thread/resume/steer/stop**，在內建
   `codex` Plugin 啟用時，使用原生 `/codex` 指令介面。
2. 如果使用者要求 **Codex 作為嵌入式 runtime**，或想要一般
   訂閱支援的 Codex agent 體驗，使用
   `openai/<model>` 搭配 `agentRuntime.id: "codex"`。
3. 如果使用者要求 **一般 OpenClaw runner 上的 Codex OAuth/訂閱驗證**，
   使用 `openai-codex/<model>`，並讓 runtime 保持為 PI。
4. 如果使用者明確提到 **ACP**、**acpx**，或 **Codex ACP 介面卡**，使用
   ACP 搭配 `runtime: "acp"` 與 `agentId: "codex"`。
5. 如果請求是針對 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid，或
   其他外部 harness**，使用 ACP/acpx，而不是原生 sub-agent runtime。

| 你的意思是...                         | 使用...                                      |
| ------------------------------------- | -------------------------------------------- |
| Codex app-server chat/thread 控制     | 內建 `codex` Plugin 的 `/codex ...`          |
| Codex app-server 嵌入式 agent runtime | `agentRuntime.id: "codex"`                   |
| PI runner 上的 OpenAI Codex OAuth     | `openai-codex/*` 模型參照                   |
| Claude Code 或其他外部 harness        | ACP/acpx                                     |

關於 OpenAI 家族前綴分流，請參閱 [OpenAI](/zh-TW/providers/openai) 和
[模型 providers](/zh-TW/concepts/model-providers)。關於 Codex runtime 支援
合約，請參閱 [Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## Runtime 所有權

不同 runtime 擁有迴圈中不同程度的控制權。

| 介面                        | OpenClaw PI 嵌入式                       | Codex app-server                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者              | OpenClaw 透過 PI 嵌入式 runner          | Codex app-server                                                            |
| 標準 thread 狀態            | OpenClaw transcript                     | Codex thread，加上 OpenClaw transcript 鏡像                                |
| OpenClaw 動態工具           | 原生 OpenClaw 工具迴圈                  | 透過 Codex 介面卡橋接                                                      |
| 原生 shell 與檔案工具       | PI/OpenClaw 路徑                        | Codex 原生工具，在支援處透過原生 hook 橋接                                |
| Context engine              | 原生 OpenClaw context 組裝              | OpenClaw 將專案組裝的 context 投射進 Codex 回合                            |
| Compaction                  | OpenClaw 或所選 context engine          | Codex 原生 compaction，搭配 OpenClaw 通知與鏡像維護                        |
| Channel delivery            | OpenClaw                                | OpenClaw                                                                    |

這個所有權分工是主要設計規則：

- 如果 OpenClaw 擁有該介面，OpenClaw 可以提供一般 Plugin hook 行為。
- 如果原生 runtime 擁有該介面，OpenClaw 需要 runtime 事件或原生 hook。
- 如果原生 runtime 擁有標準 thread 狀態，OpenClaw 應該鏡像並投射 context，而不是改寫不受支援的內部狀態。

## Runtime 選取

OpenClaw 會在 provider 與模型解析後選擇嵌入式 runtime：

1. 工作階段記錄的 runtime 優先。設定變更不會將
   既有 transcript 熱切換到不同的原生 thread 系統。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會對新的或重設的工作階段強制使用該 runtime。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以設定
   `auto`、`pi`、已註冊的嵌入式 harness id（例如 `codex`），或
   支援的 CLI 後端別名（例如 `claude-cli`）。
4. 在 `auto` 模式中，已註冊的 Plugin runtime 可以宣告它們支援的 provider/model
   配對。
5. 如果沒有 runtime 在 `auto` 模式中宣告某個回合，且設定了 `fallback: "pi"`
   （預設值），OpenClaw 會使用 PI 作為相容性 fallback。設定
   `fallback: "none"` 會讓未匹配的 `auto` 模式選取改為失敗。

明確指定的 Plugin runtime 預設會封閉失敗。例如，
`agentRuntime.id: "codex"` 表示 Codex，或是清楚的選取錯誤，除非你在
相同覆寫範圍中設定 `fallback: "pi"`。Runtime 覆寫不會繼承
較廣範圍的 fallback 設定，因此 agent 層級的 `agentRuntime.id: "codex"` 不會
只因為 defaults 使用了 `fallback: "pi"` 就靜默路由回 PI。

CLI 後端別名不同於嵌入式 harness id。建議的
Claude CLI 形式是：

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

舊版參照（例如 `claude-cli/claude-opus-4-7`）仍為了
相容性而支援，但新設定應保留 provider/model 的標準形式，並將
執行後端放在 `agentRuntime.id`。

`auto` 模式刻意保守。Plugin runtime 可以宣告它們理解的
provider/model 配對，但 Codex Plugin 在 `auto` 模式中不會宣告
`openai-codex` provider。這會保留
`openai-codex/*` 作為明確的 PI Codex OAuth 路由，並避免將
訂閱驗證設定靜默移到原生 app-server harness。

如果 `openclaw doctor` 警告 `codex` Plugin 已啟用，但
`openai-codex/*` 仍透過 PI 路由，請將它視為診斷，而不是
遷移。當你想要 PI Codex OAuth 時，保持設定不變。
只有在想要原生 Codex app-server 執行時，才切換到 `openai/<model>` 加上
`agentRuntime.id: "codex"`。

## 相容性合約

當 runtime 不是 PI 時，它應該記錄它支援哪些 OpenClaw 介面。
Runtime 文件請使用這個形狀：

| 問題                                   | 為何重要                                                                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                       | 決定重試、工具延續，以及最終答案決策發生的位置。                                                 |
| 誰擁有標準執行緒歷史？                 | 決定 OpenClaw 是否可以編輯歷史，或只能鏡像它。                                                    |
| OpenClaw 動態工具是否可用？            | 訊息傳遞、工作階段、cron，以及 OpenClaw 擁有的工具都依賴這一點。                                  |
| 動態工具 hook 是否可用？               | Plugin 會預期 `before_tool_call`、`after_tool_call`，以及 OpenClaw 擁有工具周圍的中介軟體。       |
| 原生工具 hook 是否可用？               | Shell、patch，以及執行階段擁有的工具需要原生 hook 支援，以便執行政策與觀察。                     |
| 上下文引擎生命週期是否會執行？         | 記憶與上下文 Plugin 依賴組裝、擷取、回合後，以及 Compaction 生命週期。                            |
| 會公開哪些 Compaction 資料？           | 有些 Plugin 只需要通知，而其他 Plugin 需要保留/捨棄的中繼資料。                                  |
| 哪些是刻意不支援的？                   | 使用者不應在原生執行階段擁有更多狀態時假設其與 PI 等價。                                         |

Codex 執行階段支援合約記錄於
[Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 狀態標籤

狀態輸出可能會同時顯示 `Execution` 和 `Runtime` 標籤。請將它們視為
診斷資訊，而不是供應商名稱。

- 像 `openai/gpt-5.5` 這樣的模型參照會告訴你所選的供應商/模型。
- 像 `codex` 這樣的執行階段 ID 會告訴你是哪個迴圈正在執行該回合。
- 像 Telegram 或 Discord 這樣的頻道標籤會告訴你對話發生在哪裡。

如果工作階段在變更執行階段設定後仍顯示 PI，請使用 `/new` 開始新的工作階段，
或使用 `/reset` 清除目前的工作階段。既有工作階段會保留其記錄的執行階段，
因此逐字稿不會透過兩個不相容的原生工作階段系統重播。

## 相關

- [Codex harness](/zh-TW/plugins/codex-harness)
- [OpenAI](/zh-TW/providers/openai)
- [Agent harness Plugin](/zh-TW/plugins/sdk-agent-harness)
- [Agent 迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
