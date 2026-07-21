---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想要試用預覽版執行階段功能，而不將它們與一般預設值混淆
    - 你想要有一個地方可以找到目前文件中記載的實驗性旗標
summary: OpenClaw 中的實驗性旗標代表什麼，以及目前有哪些旗標已記載於文件中
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-21T08:59:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ba3a3e13b308c572b02076e131143845d4ad4c2a28847aabec1496012e29a6f7
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗性功能是由明確旗標啟用的預覽介面。它們需要累積更多實際使用經驗，才能成為穩定的預設值或長期維護的契約。

- 預設關閉，除非文件說明了範圍明確的自動設定規則。
- 其結構與行為的變更速度可能比穩定設定更快。
- 若已有穩定路徑，請優先使用該路徑。
- 先在較小的環境中測試，再進行大規模推出。

## 目前已記載的旗標

| 介面                     | 鍵                                                                                         | 適用時機                                                                                                                          | 更多資訊                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行階段         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 較小型或限制較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                                 | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 為過往工作階段逐字記錄建立索引，並願意承擔額外的儲存空間與索引成本                                      | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex 執行框架           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更新版本以 OpenClaw 沙箱支援的 exec-server 為目標，而不是停用 Code Mode                    | [Codex 執行框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你希望在相容的執行階段與 UI 中公開結構化 `update_plan` 工具，以追蹤多步驟工作                                                | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                       |
| Code Mode                | `tools.codeMode.enabled`                                                                   | 你希望以精簡、由程式碼協調的方式存取隱藏的 OpenClaw 工具目錄                                                                     | [Code Mode](/zh-TW/tools/code-mode)                                                                 |
| Swarm                    | `tools.swarm.enabled`                                                                      | 你希望 Code Mode 指令碼並行協調範圍受限的子代理程式群組                                                                          | [Swarm](/zh-TW/tools/swarm)                                                                         |

## Control UI 實驗室

開啟 **Settings → Agents & Tools → Labs**，管理提供
Control UI 開關的實驗。啟用或停用實驗室功能會立即修補標準的閘道
設定；只有功能需要重新啟動時，頁面才會顯示重新啟動提示。

Code Mode 和 Swarm 是目前隨附的 Labs 項目。這兩個開關都會
寫入現有且已驗證的設定鍵，通常不需要重新啟動閘道，就能在後續代理程式
執行時生效。

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每次執行時，從代理程式的直接介面移除重量級選用工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。明確允許或傳遞所需的工具仍然可用，但工具搜尋可能會將其編入目錄，而不是直接公開。當 `tools.toolSearch` 尚未設定時，精簡模式也會將外掛／MCP／用戶端目錄預設為結構化工具搜尋（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可將此設定限縮至單一代理程式。

在新手引導期間，若 `ollama` 或 `lmstudio` 推論路由通過驗證，且 `agents.defaults.experimental.localModelLean: true` 尚無值，系統便會自動設定該值。OpenClaw 會記錄此設定源自新手引導，因此日後驗證通過的非本機路由只會解除這項自動設定。明確設定的 `true` 或 `false` 會保留。其他自行託管及 OpenAI 相容供應商不會根據模型名稱或 URL 進行推斷。

如果你已在全域調整工具搜尋，OpenClaw 不會變更該設定。設定 `tools.toolSearch: false` 可選擇不採用精簡模式的工具搜尋預設值。

在結構化 `tools` 模式中，精簡執行會讓 `exec` 直接顯示在工具搜尋控制項旁，讓針對程式設計調校的本機模型仍可選擇其熟悉的 shell 路徑。這只會變更結構描述的可見性：一般工具政策、沙箱機制及 exec 核准仍然適用。明確的 `code` 與 `directory` 模式會維持其正常的壓縮行為。

### 為何選擇這些工具

這些工具的說明最長、參數結構最廣泛，或最可能使小型模型偏離一般程式設計與對話路徑。在上下文較小或限制較嚴格的 OpenAI 相容後端上，差異在於：

- 工具結構描述能放入提示詞，而不是排擠對話記錄。
- 模型能選擇正確的工具，而不是因為太多相似的結構描述而發出格式錯誤的工具呼叫。
- Chat Completions 配接器能維持在結構化輸出限制內，而不是因工具呼叫承載資料過大而發生 400 錯誤。

移除這些工具只會縮短直接工具清單。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、影像理解、網頁搜尋／擷取（如已設定）、記憶，以及工作階段／代理程式工具。除非你設定 `tools.toolSearch: false`，否則仍可透過工具搜尋存取額外目錄；明確允許工具，可讓精簡代理程式重新納入已裁減的工作流程。

### 何時開啟

確認模型可與閘道通訊，但完整代理程式執行仍出現異常後，再啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理程式執行因工具呼叫格式錯誤、提示詞過大，或模型忽略其工具而失敗。
3. 切換 `localModelLean: true` 後問題消失。

### 何時維持關閉

如果你的後端可順利處理完整的預設執行階段，請維持關閉。這是供需要較小工具介面的本機技術堆疊使用的因應措施，並非託管模型或資源充足本機設備的預設值。

精簡模式不會取代 `tools.profile`、`tools.allow`/`tools.deny`，或模型的 `compat.supportsTools: false` 緊急避險機制。如需在特定代理程式上永久縮小工具介面，請優先使用這些穩定的調整選項。

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

變更旗標後，請重新啟動閘道。除非你透過 `tools.allow` 或 `tools.alsoAllow` 明確保留，否則精簡篩選會移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`；工具搜尋仍可能將保留的工具編入目錄，而不是直接公開。

## 實驗性不代表隱藏

實驗性功能應在文件及設定路徑本身明確標示，而不是隱藏在看似穩定的預設調整選項之後。

## 相關內容

- [功能](/zh-TW/concepts/features)
- [發行通道](/zh-TW/install/development-channels)
