---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生代理執行環境之間做選擇
    - 狀態或設定中的提供者/模型/執行階段標籤讓你感到困惑
    - 你正在記錄原生測試框架的支援對等情況
summary: OpenClaw 如何區分模型提供者、模型、通道與代理執行環境
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-05-07T13:15:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理執行環境**是擁有一個已準備模型迴圈的元件：它會
接收提示、驅動模型輸出、處理原生工具呼叫，並將完成的回合傳回
OpenClaw。

執行環境很容易與提供者混淆，因為兩者都會出現在模型
設定附近。它們是不同層：

| 層級          | 範例                                  | 意義                                                                |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供者        | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何驗證、探索模型，以及命名模型參照。                    |
| 模型          | `gpt-5.5`, `claude-opus-4-6`          | 為代理回合選取的模型。                                             |
| 代理執行環境  | `pi`, `codex`, `claude-cli`           | 執行已準備回合的低階迴圈或後端。                                  |
| 頻道          | Telegram, Discord, Slack, WhatsApp    | 訊息進出 OpenClaw 的位置。                                         |

你也會在程式碼中看到 **harness** 這個詞。harness 是
提供代理執行環境的實作。例如，隨附的 Codex harness
實作了 `codex` 執行環境。公開設定使用 `agentRuntime.id`；`openclaw
doctor --fix` 會將較舊的執行環境原則鍵改寫為該形狀。

執行環境有兩個家族：

- **嵌入式 harness** 會在 OpenClaw 已準備的代理迴圈內執行。今天這
  包含內建的 `pi` 執行環境，以及已註冊的 Plugin harness，例如
  `codex`。
- **CLI 後端** 會執行本機 CLI 程序，同時保持模型參照
  標準化。例如，`anthropic/claude-opus-4-7` 搭配
  `agentRuntime.id: "claude-cli"` 表示「選取 Anthropic 模型，透過
  Claude CLI 執行。」`claude-cli` 不是嵌入式 harness id，且不得
  傳給 AgentHarness 選取流程。

## Codex 介面

多數混淆來自幾個不同介面共用 Codex 名稱：

| 介面                                             | OpenClaw 名稱/設定                    | 作用                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex 應用程式伺服器執行環境               | `openai/*` model refs                | 透過 Codex 應用程式伺服器執行 OpenAI 嵌入式代理回合。這是一般的 ChatGPT/Codex 訂閱設定。                     |
| Codex OAuth 驗證設定檔                          | `openai-codex` auth provider         | 儲存 Codex 應用程式伺服器 harness 會使用的 ChatGPT/Codex 訂閱驗證。                                           |
| Codex ACP 配接器                                | `runtime: "acp"`, `agentId: "codex"` | 透過外部 ACP/acpx 控制平面執行 Codex。只有在明確要求 ACP/acpx 時才使用。                                      |
| 原生 Codex 聊天控制命令集                       | `/codex ...`                         | 從聊天中繫結、恢復、導引、停止及檢查 Codex 應用程式伺服器執行緒。                                            |
| 非代理介面的 OpenAI Platform API 路由           | `openai/*` plus API-key auth         | 用於直接 OpenAI API，例如影像、嵌入、語音和即時功能。                                                        |

這些介面刻意彼此獨立。啟用 `codex` Plugin 會讓
原生應用程式伺服器功能可用；`openclaw doctor --fix` 負責舊版
`openai-codex/*` 路由修復與過時工作階段釘選清理。現在為代理模型選取
`openai/*` 表示「透過 Codex 執行此項」，除非使用的是
非代理 OpenAI API 介面。

常見的 ChatGPT/Codex 訂閱設定會使用 Codex OAuth 進行驗證，但會保留
模型參照為 `openai/*`，並選取 `codex` 執行環境：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

這表示 OpenClaw 會選取 OpenAI 模型參照，然後要求 Codex 應用程式伺服器
執行環境執行嵌入式代理回合。這不表示「使用 API 計費」，也不表示頻道、
模型提供者目錄或 OpenClaw 工作階段儲存會變成 Codex。

當隨附的 `codex` Plugin 啟用時，自然語言 Codex 控制應使用原生
`/codex` 命令介面（`/codex bind`、`/codex threads`、
`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有在
使用者明確要求 ACP/acpx，或正在測試 ACP 配接器路徑時，才對 Codex 使用
ACP。Claude Code、Gemini CLI、OpenCode、Cursor 與類似的外部 harness
仍然使用 ACP。

這是面向代理的決策樹：

1. 如果使用者要求 **Codex 繫結/控制/執行緒/恢復/導引/停止**，且隨附的
   `codex` Plugin 已啟用，請使用原生 `/codex` 命令介面。
2. 如果使用者要求 **Codex 作為嵌入式執行環境**，或想要一般
   由訂閱支援的 Codex 代理體驗，請使用 `openai/<model>`。
3. 如果使用者明確為 **OpenAI 模型選擇 PI**，請保留模型參照為
   `openai/<model>`，並設定 `agentRuntime.id: "pi"`。選取的
   `openai-codex` 驗證設定檔會透過 PI 的舊版 Codex 驗證傳輸在內部路由。
4. 如果舊版設定仍包含 **`openai-codex/*` 模型參照**，請使用
   `openclaw doctor --fix` 將它修復為 `openai/<model>`。
5. 如果使用者明確說 **ACP**、**acpx** 或 **Codex ACP 配接器**，請使用
   ACP，並設定 `runtime: "acp"` 和 `agentId: "codex"`。
6. 如果請求是針對 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid，或
   另一個外部 harness**，請使用 ACP/acpx，而不是原生子代理執行環境。

| 你的意思是...                         | 使用...                                      |
| ------------------------------------- | -------------------------------------------- |
| Codex 應用程式伺服器聊天/執行緒控制  | 來自隨附 `codex` Plugin 的 `/codex ...`      |
| Codex 應用程式伺服器嵌入式代理執行環境 | `openai/*` agent model refs                  |
| OpenAI Codex OAuth                    | `openai-codex` auth profiles                 |
| Claude Code 或其他外部 harness        | ACP/acpx                                     |

關於 OpenAI 家族前綴拆分，請參閱 [OpenAI](/zh-TW/providers/openai) 和
[模型提供者](/zh-TW/concepts/model-providers)。關於 Codex 執行環境支援
合約，請參閱 [Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 執行環境擁有權

不同執行環境擁有迴圈的不同部分。

| 介面                        | OpenClaw PI 嵌入式                    | Codex 應用程式伺服器                                                       |
| --------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者              | OpenClaw 透過 PI 嵌入式 runner        | Codex 應用程式伺服器                                                       |
| 標準執行緒狀態              | OpenClaw transcript                   | Codex thread，外加 OpenClaw transcript mirror                               |
| OpenClaw 動態工具           | 原生 OpenClaw 工具迴圈                | 透過 Codex 配接器橋接                                                      |
| 原生 shell 與檔案工具       | PI/OpenClaw 路徑                      | Codex 原生工具，並在支援處透過原生 hook 橋接                               |
| 情境引擎                    | 原生 OpenClaw 情境組裝                | OpenClaw 將專案情境組裝進 Codex 回合                                       |
| Compaction                  | OpenClaw 或選取的情境引擎             | Codex 原生 Compaction，搭配 OpenClaw 通知與鏡像維護                         |
| 頻道傳遞                    | OpenClaw                              | OpenClaw                                                                    |

這個擁有權拆分是主要設計規則：

- 如果 OpenClaw 擁有該介面，OpenClaw 可以提供一般 Plugin hook 行為。
- 如果原生執行環境擁有該介面，OpenClaw 需要執行環境事件或原生 hook。
- 如果原生執行環境擁有標準執行緒狀態，OpenClaw 應該鏡像並投射情境，而不是改寫不支援的內部狀態。

## 執行環境選取

OpenClaw 會在提供者與模型解析後選擇嵌入式執行環境：

1. 工作階段記錄的執行環境優先。設定變更不會將
   現有 transcript 即時切換到不同的原生執行緒系統。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會強制新工作階段或重設工作階段使用該執行環境。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以設定
   `auto`、`pi`、已註冊的嵌入式 harness id（例如 `codex`），或
   支援的 CLI 後端別名（例如 `claude-cli`）。
4. 在 `auto` 模式中，已註冊的 Plugin 執行環境可以宣告支援的提供者/模型
   配對。
5. 如果在 `auto` 模式中沒有執行環境宣告某個回合，OpenClaw 會使用 PI 作為
   相容性執行環境。當執行必須嚴格時，請使用明確的執行環境 id。

明確的 Plugin 執行環境會封閉式失敗。例如，`agentRuntime.id: "codex"`
表示 Codex，或清楚的選取/執行環境錯誤；它絕不會悄悄路由回
PI。

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

舊版參照（例如 `claude-cli/claude-opus-4-7`）仍受支援以維持
相容性，但新設定應保持提供者/模型標準化，並將
執行後端放在 `agentRuntime.id`。

`auto` 模式對多數提供者刻意保守。OpenAI 代理模型是例外：未設定執行環境
與 `auto` 都會解析到 Codex harness。明確的 PI 執行環境設定仍是
`openai/*` 代理回合的選擇性相容路由；當它搭配選取的
`openai-codex` 驗證設定檔時，OpenClaw 會在內部將 PI 透過舊版
Codex 驗證傳輸路由，同時保持公開模型參照為 `openai/*`。沒有明確設定的
過時 OpenAI PI 工作階段釘選會被修復回 Codex。

如果 `openclaw doctor` 警告 `codex` Plugin 已啟用，而
設定中仍保留 `openai-codex/*`，請將其視為舊版路由狀態。執行
`openclaw doctor --fix`，將它改寫為使用 Codex 執行環境的 `openai/*`。

## 相容性合約

當執行環境不是 PI 時，它應該記錄其支援哪些 OpenClaw 介面。
請將此形狀用於執行環境文件：

| 問題                                 | 為何重要                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？                     | 決定重試、工具續行與最終答案決策發生在哪裡。                                                     |
| 誰擁有標準執行緒歷史？               | 決定 OpenClaw 是否可以編輯歷史，或只能鏡像它。                                                    |
| OpenClaw 動態工具是否可運作？        | 訊息、工作階段、Cron 與 OpenClaw 擁有的工具都仰賴此項。                                          |
| 動態工具 hook 是否可運作？           | Plugins 會預期 `before_tool_call`、`after_tool_call`，以及 OpenClaw 擁有工具周圍的 middleware。 |
| 原生工具 hook 是否可運作？           | Shell、patch 與執行環境擁有的工具需要原生 hook 支援，以利原則與觀測。                            |
| 情境引擎生命週期是否會執行？         | 記憶與情境 Plugins 取決於 assemble、ingest、after-turn 與 Compaction 生命週期。                  |
| 會暴露哪些 Compaction 資料？         | 有些 Plugins 只需要通知，而其他 Plugins 需要保留/捨棄中繼資料。                                 |
| 有哪些刻意不支援的項目？             | 使用者不應在原生執行環境擁有更多狀態時，假設它與 PI 等同。                                      |

Codex 執行階段支援合約記載於
[Codex 執行框架](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 狀態標籤

狀態輸出可能同時顯示 `Execution` 與 `Runtime` 標籤。請將它們視為
診斷資訊，而不是供應商名稱。

- 像 `openai/gpt-5.5` 這樣的模型參照會告訴你選取的供應商/模型。
- 像 `codex` 這樣的執行階段 ID 會告訴你哪個迴圈正在執行該回合。
- 像 Telegram 或 Discord 這樣的頻道標籤會告訴你對話發生的位置。

如果工作階段在變更執行階段設定後仍顯示 PI，請使用 `/new` 開始新的工作階段，
或使用 `/reset` 清除目前的工作階段。現有工作階段會保留其記錄的執行階段，
這樣逐字稿就不會透過兩個不相容的原生工作階段系統重新播放。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [OpenAI](/zh-TW/providers/openai)
- [代理程式執行框架 Plugin](/zh-TW/plugins/sdk-agent-harness)
- [代理程式迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
