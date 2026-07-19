---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，同時避免將其與一般預設值混淆
    - 你想要有一個地方可以找到目前文件中記載的實驗性旗標
summary: OpenClaw 中的實驗性旗標代表什麼，以及目前有哪些旗標已有文件說明
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-19T13:43:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c25e5120b0c602c2d143e54f124b760208a08ddfed3d515f73de2b2fd2640d9d
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗性功能是位於明確旗標之後的預覽介面。它們需要累積更多實際使用經驗，才會獲得穩定的預設值或長期維護的契約。

- 除非文件說明了範圍明確的自動設定規則，否則預設為關閉。
- 其結構與行為的變更速度可能比穩定設定更快。
- 如果已有穩定途徑，請優先使用。
- 請先在較小的環境中測試，再廣泛推出。

## 目前已記錄的旗標

| 介面                     | 鍵                                                                                         | 適用情況                                                                                                                          | 更多資訊                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行環境         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 較小或限制較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                                  | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你希望 `memory_search` 為先前的工作階段逐字稿建立索引，並願意承擔額外的儲存空間與索引成本                                         | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex 測試框架           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你希望原生 Codex app-server 0.132.0 或更新版本改以 OpenClaw 沙箱支援的 exec-server 為目標，而不是停用 Code Mode                   | [Codex 測試框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你希望在相容的執行環境與 UI 中公開結構化的 `update_plan` 工具，以追蹤多步驟工作                                                | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                      |
| Code Mode                | `tools.codeMode.enabled`                                                                   | 你希望透過精簡、由程式碼協調的方式，存取隱藏的 OpenClaw 工具目錄                                                                | [Code Mode](/tools/code-mode)                                                                 |

## Control UI Labs

開啟 **Settings → Agents & Tools → Labs**，管理具有
Control UI 開關的實驗功能。啟用或停用實驗室功能會立即修補標準的閘道
設定；只有當功能需要重新啟動時，頁面才會顯示重新啟動提示。

Code Mode 目前是唯一已發布的 Labs 項目。Swarm 尚未公開：
其設定結構尚未發布，因此 Control UI 不會寫入可能導致操作者設定
失效的臆測性鍵值。

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每次互動中，從代理程式的直接介面移除重量級的選用工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。明確允許或傳遞作業所需的工具仍可使用，但 Tool Search 可能會將它們收錄至目錄，而不是直接公開。當尚未設定 `tools.toolSearch` 時，精簡模式也會將外掛／MCP／用戶端目錄預設為結構化 Tool Search（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可將範圍限制為單一代理程式。

在新手設定期間，經驗證的 `ollama` 或 `lmstudio` 推論路由會在該值不存在時自動設定 `agents.defaults.experimental.localModelLean: true`。OpenClaw 會記錄此設定來自新手設定，因此之後經驗證的非本機路由只會解除該自動設定。明確設定的 `true` 或 `false` 會予以保留。其他自架與 OpenAI 相容的供應商不會依模型名稱或 URL 進行推斷。

如果你已在全域調校 Tool Search，OpenClaw 會保留該設定不變。設定 `tools.toolSearch: false` 可停用精簡模式的 Tool Search 預設值。

在結構化 `tools` 模式中，精簡執行會讓 `exec` 與 Tool Search 控制項一同保持直接可見，讓針對程式設計調校的本機模型仍可選擇其熟悉的 Shell 路徑。這只會變更結構描述的可見性：一般工具政策、沙箱機制和執行核准仍然適用。明確的 `code` 和 `directory` 模式會維持其一般壓縮行為。

### 為何選擇這些工具

這些工具的說明最長、參數結構最廣，或最可能使小型模型偏離一般程式設計與對話路徑。對內容長度較小或限制更嚴格的 OpenAI 相容後端而言，這會造成以下差異：

- 工具結構描述可完整放入提示，而不是排擠對話記錄。
- 模型能選擇正確的工具，而不是因過多相似的結構描述而產生格式錯誤的工具呼叫。
- Chat Completions 轉接器可維持在結構化輸出限制內，而不是因工具呼叫承載資料過大而收到 400 錯誤。

移除這些工具只會縮短直接工具清單。模型仍可使用 `read`、`write`、`edit`、`exec`、`apply_patch`、影像理解、網路搜尋／擷取（若已設定）、記憶，以及工作階段／代理程式工具。除非你設定 `tools.toolSearch: false`，否則額外目錄仍可透過 Tool Search 存取；明確允許工具可讓精簡代理程式重新使用已裁減的工作流程。

### 何時應啟用

當你已確認模型可以與閘道通訊，但完整代理程式互動運作異常時，請啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理程式互動因工具呼叫格式錯誤、提示過大，或模型忽略其工具而失敗。
3. 切換 `localModelLean: true` 後可排除該失敗。

### 何時應保持關閉

如果你的後端能順利處理完整的預設執行環境，請保持關閉。這是提供給需要較小工具介面的本機技術堆疊使用的因應措施，而不是託管模型或資源充足的本機設備之預設值。

精簡模式不會取代 `tools.profile`、`tools.allow`/`tools.deny` 或模型的 `compat.supportsTools: false` 應急機制。若要永久縮減特定代理程式的工具介面，請優先使用這些穩定的調整選項。

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

僅限單一代理程式：

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

變更旗標後，請重新啟動閘道。除非你使用 `tools.allow` 或 `tools.alsoAllow` 明確保留，否則精簡篩選會移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`；Tool Search 仍可能將保留的工具收錄至目錄，而不是直接公開。

## 實驗性不代表隱藏

實驗性功能應在文件及設定路徑本身明確標示，而不是藏在看似穩定的預設調整選項之後。

## 相關內容

- [功能](/zh-TW/concepts/features)
- [發布通道](/zh-TW/install/development-channels)
