---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，而不將其與一般預設值混淆
    - 你想要有一個地方可以找到目前文件化的實驗性旗標
summary: OpenClaw 中實驗性旗標的含義，以及目前有哪些已記錄在文件中
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-05T11:13:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 428c9519a5252941657a0d961506229a1a8b4077ab4553e7727d1ab6a13da62b
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗性功能是需要透過明確旗標選擇啟用的預覽介面。它們需要更多實際使用經驗，才會取得穩定預設值或長期合約。

- 除非文件告訴你啟用某項功能，否則預設為關閉。
- 形狀與行為可能比穩定設定更快變動。
- 當已有穩定路徑時，優先使用穩定路徑。
- 先在較小環境中測試後，再廣泛推出。

## 目前記錄的旗標

| 介面                     | 鍵                                                                                         | 使用時機                                                                                                                          | 更多                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行環境         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 較小或較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                                       | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 索引先前的工作階段逐字稿，並接受額外的儲存與索引成本                                                      | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex 工具框架           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更新版本以 OpenClaw 沙盒支援的 exec-server 為目標，而不是停用程式碼模式                    | [Codex 工具框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你希望在相容的執行環境與 UI 中公開結構化的 `update_plan` 工具，以追蹤多步驟工作                                                  | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                       |

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每一輪從代理的工具介面中移除三個預設工具：`browser`、`cron` 和 `message`。當 `tools.toolSearch` 尚未設定時，它也會針對外掛/MCP/用戶端工具目錄預設使用結構化 Tool Search（`tool_search`、`tool_describe`、`tool_call`），因此這些目錄會留在提示之外，而不是被完整倒入。需要直接 `message` 傳遞的執行仍會保持直接傳遞，而不會套用精簡模式的 Tool Search 預設。使用 `agents.list[].experimental.localModelLean` 可將此設定限定到單一代理。

如果你已經全域調整 Tool Search，OpenClaw 會保留該設定不變。設定 `tools.toolSearch: false` 可退出精簡模式的 Tool Search 預設。

### 為什麼是這三個工具

`browser`、`cron` 和 `message` 在預設執行環境中有最大的描述與最多的參數形狀。對於小型上下文或較嚴格的 OpenAI 相容後端，這會造成以下差異：

- 工具結構描述能放進提示，或擠掉對話歷史。
- 模型選對工具，或因太多相似結構描述而輸出格式錯誤的工具呼叫。
- Chat Completions 配接器保持在結構化輸出限制內，或因工具呼叫酬載大小而收到 400。

移除它們只會縮短直接工具清單。模型仍然有 `read`、`write`、`edit`、`exec`、`apply_patch`、網路搜尋/擷取（設定時）、記憶，以及工作階段/代理工具。除非你設定 `tools.toolSearch: false`，否則額外目錄仍可透過 Tool Search 存取。

### 何時開啟

在你證明模型可以與閘道通訊，但完整代理回合表現異常後，再啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理回合因格式錯誤的工具呼叫、過大的提示，或模型忽略工具而失敗。
3. 切換 `localModelLean: true` 後排除失敗。

### 何時保持關閉

如果你的後端能乾淨地處理完整預設執行環境，請保持關閉。這是為需要較小工具介面的本機堆疊提供的因應方式，不是託管模型或資源充足的本機設備的預設值。

精簡模式不會取代 `tools.profile`、`tools.allow`/`tools.deny`，或模型 `compat.supportsTools: false` 逃生閥。若要在特定代理上永久使用較窄的工具介面，請優先使用這些穩定控制項。

### 啟用

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

僅限單一代理：

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

變更旗標後請重新啟動閘道。

## 實驗性不代表隱藏

實驗性功能應該在文件中以及設定路徑本身清楚說明，而不是藏在看似穩定的預設控制項後面。

## 相關

- [功能](/zh-TW/concepts/features)
- [發布通道](/zh-TW/install/development-channels)
