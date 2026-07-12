---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想嘗試預覽版執行階段功能，同時避免將它們與一般預設值混淆
    - 您想要在同一處找到目前已有文件說明的實驗性旗標
summary: OpenClaw 中實驗性旗標的含義，以及目前有哪些旗標已納入文件說明
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-11T21:16:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗性功能是必須透過明確旗標選擇啟用的預覽功能介面。它們需要累積更多實際使用經驗，才會成為穩定的預設值或長期契約。

- 除非文件指示你啟用，否則預設為關閉。
- 其形式與行為可能比穩定設定更快變動。
- 若已有穩定途徑，應優先使用。
- 只有先在較小型環境中完成測試後，才應廣泛推出。

## 目前已有文件記載的旗標

| 功能介面                 | 鍵                                                                                         | 適用情況                                                                                                                               | 更多資訊                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行階段         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 規模較小或限制較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面時                                                                   | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 為先前工作階段的逐字稿建立索引，並願意承擔額外的儲存與索引成本                                                    | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex 測試框架           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更新版本以 OpenClaw 沙箱支援的執行伺服器為目標，而不是停用程式碼模式                               | [Codex 測試框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你希望在相容的執行階段與使用者介面中公開結構化的 `update_plan` 工具，以追蹤多步驟工作                                                   | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                      |

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每輪互動中，從代理程式直接可用的介面移除較為繁重的選用工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。明確允許或傳遞所需的工具仍然可用，但工具搜尋可能會將它們編入目錄，而不是直接公開。若尚未設定 `tools.toolSearch`，精簡模式也會預設讓外掛／MCP／用戶端目錄使用結構化工具搜尋（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可將此設定限制於單一代理程式。

如果你已在全域調整工具搜尋，OpenClaw 會保留該設定不變。設定 `tools.toolSearch: false` 可停用精簡模式預設的工具搜尋。

在結構化 `tools` 模式中，精簡模式執行時會讓 `exec` 與工具搜尋控制項一同保持直接可見，讓針對程式設計調校的本機模型仍可選擇其熟悉的殼層途徑。這只會變更結構描述的可見性：一般工具政策、沙箱機制與執行核准仍然適用。明確的 `code` 和 `directory` 模式會保留其正常的壓縮行為。

### 為何是這些工具

這些工具的描述最長、參數形式最廣泛，或最可能使小型模型偏離一般程式設計與對話途徑。對於上下文較小或限制更嚴格的 OpenAI 相容後端，差異如下：

- 工具結構描述能容納於提示詞中，而非排擠對話歷程。
- 模型能選擇正確工具，而非因過多相似的結構描述而產生格式錯誤的工具呼叫。
- Chat Completions 轉接器能維持在結構化輸出限制內，而非因工具呼叫承載資料過大而回傳 400 錯誤。

移除這些工具只會縮短直接工具清單。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、影像理解、網路搜尋／擷取（若已設定）、記憶，以及工作階段／代理程式工具。除非設定 `tools.toolSearch: false`，否則仍可透過工具搜尋存取額外目錄；明確允許工具可讓精簡代理程式重新採用經裁減的工作流程。

### 何時啟用

確認模型可以與閘道通訊，但完整代理程式輪次運作異常後，再啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理程式輪次因工具呼叫格式錯誤、提示詞過大，或模型忽略其工具而失敗。
3. 將 `localModelLean: true` 切換為啟用後，問題消失。

### 何時維持關閉

如果你的後端可以順利處理完整的預設執行階段，請維持關閉。這是供需要較小工具介面的本機技術堆疊使用的因應措施，並非託管模型或資源充足之本機設備的預設值。

精簡模式無法取代 `tools.profile`、`tools.allow`／`tools.deny`，或模型的 `compat.supportsTools: false` 退出機制。若要永久縮小特定代理程式的工具介面，應優先使用這些穩定的控制項。

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

僅針對單一代理程式：

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

變更旗標後，請重新啟動閘道。除非你使用 `tools.allow` 或 `tools.alsoAllow` 明確保留，否則精簡篩選會移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`；工具搜尋仍可能將保留的工具編入目錄，而不是直接公開。

## 實驗性不代表隱藏

實驗性功能應在文件及設定路徑本身明確標示，而不是隱藏在看似穩定的預設控制項之後。

## 相關內容

- [功能](/zh-TW/concepts/features)
- [發布頻道](/zh-TW/install/development-channels)
