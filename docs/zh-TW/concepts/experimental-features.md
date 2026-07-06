---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，同時避免將它們與一般預設值混淆
    - 你想要在單一位置找到目前文件記載的實驗性旗標
summary: OpenClaw 中實驗性旗標的含義，以及目前已記錄的旗標
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-06T10:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ac12f9e754afd369a1be0853f8023e479fe51777aa42b73f6245223f07053152
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗功能是必須明確透過旗標選用的預覽介面。它們需要更多真實世界使用經驗，才會成為穩定預設值或長期合約。

- 預設關閉，除非文件告訴你啟用某項功能。
- 形狀與行為可能比穩定設定變動得更快。
- 若已有穩定路徑，請優先使用穩定路徑。
- 請先在較小環境中測試後，再廣泛推出。

## 目前已記錄的旗標

| 介面                     | 鍵                                                                                         | 使用時機                                                                                                                          | 更多                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 本機模型執行階段         | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | 較小或較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                                        | [本機模型](/zh-TW/gateway/local-models)                                                             |
| 記憶搜尋                 | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | 你想讓 `memory_search` 索引先前的工作階段轉錄，並接受額外的儲存與索引成本                                                        | [記憶設定參考](/zh-TW/reference/memory-config#session-memory-search-experimental)                   |
| Codex 測試框架           | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | 你想讓原生 Codex app-server 0.132.0 或更新版本指向 OpenClaw 沙盒支援的 exec-server，而不是停用 Code Mode                         | [Codex 測試框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)             |
| 結構化規劃工具           | `tools.experimental.planTool`                                                              | 你想在相容的執行階段與 UI 中公開結構化 `update_plan` 工具，用於追蹤多步驟工作                                                     | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                       |

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每次回合中，從代理的直接介面移除重量級選用工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`。明確允許或傳送所需的工具仍會可用，不過工具搜尋可能會將它們編入目錄，而不是直接公開。當尚未設定 `tools.toolSearch` 時，精簡模式也會預設將外掛/MCP/用戶端目錄設為結構化工具搜尋（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.list[].experimental.localModelLean` 可將此設定限定到單一代理。

如果你已經全域調校工具搜尋，OpenClaw 會保留該設定不變。設定 `tools.toolSearch: false` 可退出精簡模式的工具搜尋預設值。

### 為什麼是這些工具

這些工具具有最大的描述、最廣泛的參數形狀，或最可能讓小模型偏離正常編碼與對話路徑。在小型上下文或較嚴格的 OpenAI 相容後端上，差別會是：

- 工具結構描述能放入提示，而不是擠掉對話歷史。
- 模型選對工具，而不是因太多相似結構描述而輸出格式錯誤的工具呼叫。
- Chat Completions 轉接器維持在結構化輸出限制內，而不是因工具呼叫承載大小收到 400。

移除它們只會縮短直接工具清單。模型仍有 `read`、`write`、`edit`、`exec`、`apply_patch`、影像理解、網路搜尋/擷取（設定後）、記憶，以及工作階段/代理工具。除非你設定 `tools.toolSearch: false`，否則額外目錄仍可透過工具搜尋取得；明確允許工具也能讓精簡代理重新加入精簡過的工作流程。

### 何時開啟

當你已證明模型可以與閘道通訊，但完整代理回合行為異常時，請啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理回合因格式錯誤的工具呼叫、過大的提示，或模型忽略其工具而失敗。
3. 切換 `localModelLean: true` 後排除該失敗。

### 何時保持關閉

如果你的後端能乾淨地處理完整預設執行階段，請保持此功能關閉。這是給需要較小工具介面的本機堆疊使用的解決方法，不是託管模型或資源充足本機設備的預設值。

精簡模式不會取代 `tools.profile`、`tools.allow`/`tools.deny`，或模型的 `compat.supportsTools: false` 逃生出口。若要在特定代理上永久縮小工具介面，請優先使用那些穩定旋鈕。

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

僅針對一個代理：

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

變更旗標後請重新啟動閘道。精簡篩選會移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 和 `pdf`，除非你用 `tools.allow` 或 `tools.alsoAllow` 明確保留它們；工具搜尋仍可能將保留的工具編入目錄，而不是直接公開。

## 實驗不代表隱藏

實驗功能應該在文件與設定路徑本身清楚說明，而不是隱藏在看似穩定的預設旋鈕後面。

## 相關

- [功能](/zh-TW/concepts/features)
- [發行通道](/zh-TW/install/development-channels)
