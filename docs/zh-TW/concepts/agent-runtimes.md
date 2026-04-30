---
read_when:
    - 你正在 PI、Codex、ACP 或其他原生代理執行環境之間做選擇
    - 你對狀態或設定中的供應商/模型/執行階段標籤感到困惑
    - 你正在記錄原生測試框架的支援對等性
summary: OpenClaw 如何區分模型提供者、模型、通道與代理執行階段
title: 代理程式執行環境
x-i18n:
    generated_at: "2026-04-30T02:58:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**代理程式執行階段**是擁有一個已準備好模型迴圈的元件：它會接收提示、驅動模型輸出、處理原生工具呼叫，並將完成的回合傳回 OpenClaw。

執行階段很容易與提供者混淆，因為兩者都會出現在模型設定附近。它們是不同層：

| 層級 | 範例 | 意義 |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| 提供者 | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何驗證身分、探索模型，以及命名模型參照。 |
| 模型 | `gpt-5.5`, `claude-opus-4-6` | 為代理程式回合選取的模型。 |
| 代理程式執行階段 | `pi`, `codex`, `claude-cli` | 執行已準備好回合的低階迴圈或後端。 |
| 頻道 | Telegram, Discord, Slack, WhatsApp | 訊息進入和離開 OpenClaw 的位置。 |

你也會在程式碼中看到 **harness** 這個詞。harness 是提供代理程式執行階段的實作。例如，內建的 Codex harness 會實作 `codex` 執行階段。公開設定使用 `agentRuntime.id`；`openclaw doctor --fix` 會將較舊的執行階段政策鍵改寫成該形狀。

有兩個執行階段家族：

- **嵌入式 harness** 會在 OpenClaw 已準備好的代理程式迴圈內執行。目前這包含內建的 `pi` 執行階段，以及已註冊的 Plugin harness，例如 `codex`。
- **CLI 後端** 會執行本機 CLI 程序，同時保持模型參照的標準形式。例如，`anthropic/claude-opus-4-7` 搭配 `agentRuntime.id: "claude-cli"` 表示「選取 Anthropic 模型，透過 Claude CLI 執行。」`claude-cli` 不是嵌入式 harness id，且不得傳給 AgentHarness 選取流程。

## 三個名為 Codex 的項目

大多數混淆來自三個不同介面共用 Codex 名稱：

| 介面 | OpenClaw 名稱/設定 | 功能 |
| ---------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Codex OAuth 提供者路由 | `openai-codex/*` 模型參照 | 透過一般 OpenClaw PI 執行器使用 ChatGPT/Codex 訂閱 OAuth。 |
| 原生 Codex 應用程式伺服器執行階段 | `agentRuntime.id: "codex"` | 透過內建的 Codex 應用程式伺服器 harness 執行嵌入式代理程式回合。 |
| Codex ACP 配接器 | `runtime: "acp"`, `agentId: "codex"` | 透過外部 ACP/acpx 控制平面執行 Codex。只有在明確要求 ACP/acpx 時才使用。 |
| 原生 Codex 聊天控制命令集 | `/codex ...` | 從聊天中綁定、恢復、導引、停止及檢查 Codex 應用程式伺服器執行緒。 |
| 適用於 GPT/Codex 風格模型的 OpenAI Platform API 路由 | `openai/*` 模型參照 | 使用 OpenAI API 金鑰驗證，除非執行階段覆寫，例如 `runtime: "codex"`，會執行該回合。 |

這些介面刻意保持獨立。啟用 `codex` Plugin 會讓原生應用程式伺服器功能可用；它不會將 `openai-codex/*` 改寫成 `openai/*`，不會變更現有工作階段，也不會讓 ACP 成為 Codex 預設值。選取 `openai-codex/*` 表示「使用 Codex OAuth 提供者路由」，除非你另外強制指定執行階段。

常見的 Codex 設定會使用 `openai` 提供者搭配 `codex` 執行階段：

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

這表示 OpenClaw 會選取 OpenAI 模型參照，然後要求 Codex 應用程式伺服器執行階段執行嵌入式代理程式回合。這不表示頻道、模型提供者目錄，或 OpenClaw 工作階段儲存會變成 Codex。

啟用內建的 `codex` Plugin 時，自然語言 Codex 控制應使用原生 `/codex` 命令介面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`），而不是 ACP。只有在使用者明確要求 ACP/acpx，或正在測試 ACP 配接器路徑時，才對 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor，以及類似的外部 harness 仍使用 ACP。

這是面向代理程式的決策樹：

1. 如果使用者要求 **Codex 綁定/控制/執行緒/恢復/導引/停止**，在內建的 `codex` Plugin 已啟用時，使用原生 `/codex` 命令介面。
2. 如果使用者要求 **Codex 作為嵌入式執行階段**，使用 `openai/<model>` 搭配 `agentRuntime.id: "codex"`。
3. 如果使用者要求 **一般 OpenClaw 執行器上的 Codex OAuth/訂閱驗證**，使用 `openai-codex/<model>`，並將執行階段保留為 PI。
4. 如果使用者明確提到 **ACP**、**acpx** 或 **Codex ACP 配接器**，使用 ACP 搭配 `runtime: "acp"` 和 `agentId: "codex"`。
5. 如果要求是針對 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid，或其他外部 harness**，使用 ACP/acpx，而不是原生子代理程式執行階段。

| 你的意思是... | 使用... |
| --------------------------------------- | -------------------------------------------- |
| Codex 應用程式伺服器聊天/執行緒控制 | 來自內建 `codex` Plugin 的 `/codex ...` |
| Codex 應用程式伺服器嵌入式代理程式執行階段 | `agentRuntime.id: "codex"` |
| PI 執行器上的 OpenAI Codex OAuth | `openai-codex/*` 模型參照 |
| Claude Code 或其他外部 harness | ACP/acpx |

如需 OpenAI 家族前綴分流，請參閱 [OpenAI](/zh-TW/providers/openai) 和 [模型提供者](/zh-TW/concepts/model-providers)。如需 Codex 執行階段支援契約，請參閱 [Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 執行階段擁有權

不同執行階段擁有迴圈中不同程度的控制權。

| 介面 | OpenClaw PI 嵌入式 | Codex 應用程式伺服器 |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型迴圈擁有者 | OpenClaw 透過 PI 嵌入式執行器 | Codex 應用程式伺服器 |
| 標準執行緒狀態 | OpenClaw 逐字稿 | Codex 執行緒，加上 OpenClaw 逐字稿鏡像 |
| OpenClaw 動態工具 | 原生 OpenClaw 工具迴圈 | 透過 Codex 配接器橋接 |
| 原生 shell 和檔案工具 | PI/OpenClaw 路徑 | Codex 原生工具，在支援處透過原生 hook 橋接 |
| Context engine | 原生 OpenClaw context 組裝 | OpenClaw projects 將 context 組裝到 Codex 回合中 |
| Compaction | OpenClaw 或選取的 context engine | Codex 原生 Compaction，搭配 OpenClaw 通知和鏡像維護 |
| 頻道傳遞 | OpenClaw | OpenClaw |

這個擁有權分工是主要設計規則：

- 如果 OpenClaw 擁有該介面，OpenClaw 可以提供一般 Plugin hook 行為。
- 如果原生執行階段擁有該介面，OpenClaw 需要執行階段事件或原生 hook。
- 如果原生執行階段擁有標準執行緒狀態，OpenClaw 應該鏡像並投射 context，而不是改寫不受支援的內部狀態。

## 執行階段選取

OpenClaw 會在提供者和模型解析後選擇嵌入式執行階段：

1. 工作階段記錄的執行階段優先。設定變更不會將現有逐字稿熱切換到不同的原生執行緒系統。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 會強制新工作階段或重設後工作階段使用該執行階段。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以設定 `auto`、`pi`、已註冊的嵌入式 harness id（例如 `codex`），或受支援的 CLI 後端別名（例如 `claude-cli`）。
4. 在 `auto` 模式中，已註冊的 Plugin 執行階段可以宣告支援的提供者/模型配對。
5. 如果在 `auto` 模式中沒有執行階段宣告某個回合，且已設定 `fallback: "pi"`（預設值），OpenClaw 會使用 PI 作為相容性備援。設定 `fallback: "none"` 可改為讓未匹配的 `auto` 模式選取失敗。

明確的 Plugin 執行階段預設會封閉失敗。例如，`runtime: "codex"` 表示 Codex，或明確的選取錯誤，除非你在相同覆寫範圍中設定 `fallback: "pi"`。執行階段覆寫不會繼承較寬範圍的備援設定，因此代理程式層級的 `runtime: "codex"` 不會只因為預設值使用 `fallback: "pi"` 就被靜默路由回 PI。

CLI 後端別名不同於嵌入式 harness id。建議的 Claude CLI 形式是：

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

舊式參照（例如 `claude-cli/claude-opus-4-7`）仍為相容性而受到支援，但新設定應保持提供者/模型標準形式，並將執行後端放在 `agentRuntime.id`。

`auto` 模式刻意保守。Plugin 執行階段可以宣告它們理解的提供者/模型配對，但 Codex Plugin 在 `auto` 模式中不會宣告 `openai-codex` 提供者。這會讓 `openai-codex/*` 保持為明確的 PI Codex OAuth 路由，並避免將訂閱驗證設定靜默移到原生應用程式伺服器 harness 上。

如果 `openclaw doctor` 警告 `codex` Plugin 已啟用，而 `openai-codex/*` 仍透過 PI 路由，請將其視為診斷，而不是遷移。當 PI Codex OAuth 是你想要的內容時，請保持設定不變。只有在你想要原生 Codex 應用程式伺服器執行時，才切換到 `openai/<model>` 加上 `agentRuntime.id: "codex"`。

## 相容性契約

當執行階段不是 PI 時，它應該記錄它支援哪些 OpenClaw 介面。執行階段文件請使用這個形狀：

| 問題 | 重要性 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 誰擁有模型迴圈？ | 決定重試、工具延續，以及最終答案決策發生的位置。 |
| 誰擁有標準執行緒歷史？ | 決定 OpenClaw 是否能編輯歷史，或只能鏡像它。 |
| OpenClaw 動態工具是否可用？ | 訊息傳遞、工作階段、cron，以及 OpenClaw 擁有的工具依賴於此。 |
| 動態工具 hook 是否可用？ | Plugin 會預期 OpenClaw 擁有工具周圍有 `before_tool_call`、`after_tool_call` 和中介軟體。 |
| 原生工具 hook 是否可用？ | Shell、patch，以及執行階段擁有的工具需要原生 hook 支援，以便套用政策和觀察。 |
| Context engine 生命週期是否執行？ | 記憶體和 context Plugin 依賴組裝、擷取、回合後，以及 Compaction 生命週期。 |
| 會公開哪些 Compaction 資料？ | 有些 Plugin 只需要通知，而其他 Plugin 需要保留/丟棄的 metadata。 |
| 哪些內容刻意不支援？ | 使用者不應在原生執行階段擁有更多狀態時假設其等同於 PI。 |

Codex 執行階段支援契約記錄於 [Codex harness](/zh-TW/plugins/codex-harness#v1-support-contract)。

## 狀態標籤

狀態輸出可能同時顯示 `Execution` 和 `Runtime` 標籤。請將它們視為診斷資訊，而不是提供者名稱。

- 像 `openai/gpt-5.5` 這樣的模型參照會告訴你所選的提供者/模型。
- 像 `codex` 這樣的執行階段 ID 會告訴你是哪個迴圈正在執行這一輪。
- 像 Telegram 或 Discord 這樣的頻道標籤會告訴你對話發生在哪裡。

如果在變更執行階段設定後，工作階段仍顯示 PI，請使用 `/new` 開始新的工作階段，或使用 `/reset` 清除目前的工作階段。現有工作階段會保留其記錄的執行階段，避免逐字稿透過兩個不相容的原生工作階段系統重播。

## 相關

- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [OpenAI](/zh-TW/providers/openai)
- [代理執行框架 Plugin](/zh-TW/plugins/sdk-agent-harness)
- [代理迴圈](/zh-TW/concepts/agent-loop)
- [模型](/zh-TW/concepts/models)
- [狀態](/zh-TW/cli/status)
