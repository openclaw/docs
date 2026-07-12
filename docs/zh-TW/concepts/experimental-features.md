---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，同時避免將其與一般預設值混淆
    - 你想要有一個地方可以找到目前文件中記載的實驗性旗標
summary: OpenClaw 中的實驗性旗標代表什麼，以及目前有哪些旗標已記載於文件中
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-12T14:25:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗性功能是透過明確旗標選擇啟用的預覽介面。在獲得穩定預設值或長期有效的契約之前，仍需累積更多實際使用經驗。

- 除非文件指示你啟用，否則預設為關閉。
- 其結構與行為的變更速度可能比穩定設定更快。
- 如果已有穩定的途徑，請優先使用。
- 請先在較小的環境中測試，再廣泛推出。

## 目前已有文件說明的旗標

| 介面                     | 鍵                                                                                         | 適用時機                                                                                                                          | 更多資訊                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行環境         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 較小型或限制較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面時                                                                | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 為先前的工作階段逐字稿建立索引，並願意承擔額外的儲存與索引成本                                              | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex 控制框架           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更新版本使用由 OpenClaw 沙箱支援的 exec-server，而不是停用程式碼模式                          | [Codex 控制框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你希望在相容的執行環境與使用者介面中公開結構化 `update_plan` 工具，以追蹤多步驟工作                                                | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                       |

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每一輪從代理程式的直接介面中移除重量級的選用工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 與 `pdf`。明確允許或傳送所需的工具仍可使用，但工具搜尋可能會將它們列入目錄，而不是直接公開。若尚未設定 `tools.toolSearch`，精簡模式也會預設讓外掛／MCP／用戶端目錄使用結構化工具搜尋（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可將此設定限定於單一代理程式。

如果你已在全域調整工具搜尋，OpenClaw 會保留該設定不變。設定 `tools.toolSearch: false` 可選擇不採用精簡模式的工具搜尋預設值。

在結構化 `tools` 模式中，精簡執行會讓 `exec` 與工具搜尋控制項並列且保持直接可見，讓針對程式設計調校的本機模型仍可選擇熟悉的 shell 途徑。這只會變更結構描述的可見性：一般工具政策、沙箱機制與 exec 核准仍然適用。明確的 `code` 與 `directory` 模式會維持正常的壓縮行為。

### 為何選擇這些工具

這些工具具有最長的說明、最廣泛的參數結構，或最有可能使小型模型偏離一般程式設計與對話流程。在內容空間較小或限制較嚴格的 OpenAI 相容後端上，差異在於：

- 工具結構描述能容納於提示詞中，而非排擠對話記錄。
- 模型能選擇正確的工具，而非因過多相似結構描述而產生格式錯誤的工具呼叫。
- Chat Completions 轉接器能維持在結構化輸出限制內，而非因工具呼叫承載資料過大而收到 400 錯誤。

移除這些工具只會縮短直接工具清單。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、影像理解、網路搜尋／擷取（若已設定）、記憶，以及工作階段／代理程式工具。除非你設定 `tools.toolSearch: false`，否則仍可透過工具搜尋存取額外目錄；明確允許工具可讓精簡代理程式重新納入經裁減的工作流程。

### 何時啟用

確認模型能與閘道通訊，但完整代理程式回合行為異常後，再啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理程式回合因工具呼叫格式錯誤、提示詞過大，或模型忽略其工具而失敗。
3. 切換為 `localModelLean: true` 後，故障消失。

### 何時保持關閉

如果你的後端能順利處理完整的預設執行環境，請保持關閉。這是供需要較小工具介面的本機技術堆疊使用的替代方案，並非託管模型或資源充足之本機設備的預設值。

精簡模式不會取代 `tools.profile`、`tools.allow`／`tools.deny`，或模型的 `compat.supportsTools: false` 退路選項。若要永久縮小特定代理程式的工具介面，請優先使用這些穩定的調整選項。

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

僅套用於單一代理程式：

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

變更旗標後，請重新啟動閘道。除非你使用 `tools.allow` 或 `tools.alsoAllow` 明確保留，否則精簡篩選會移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 與 `pdf`；工具搜尋仍可能將保留的工具列入目錄，而不是直接公開。

## 實驗性不代表隱藏

實驗性功能應在文件與設定路徑本身清楚標示，而不是隱藏在看似穩定的預設調整選項之後。

## 相關內容

- [功能](/zh-TW/concepts/features)
- [發布管道](/zh-TW/install/development-channels)
