---
read_when:
    - 你看到一個 `.experimental` 設定鍵，並想知道它是否穩定
    - 你想試用預覽版執行階段功能，又不想將它們與一般預設值混淆
    - 你想要有一個地方能找到目前文件中記載的實驗性旗標
summary: OpenClaw 中的實驗性旗標代表什麼，以及目前有哪些旗標已記載於文件中
title: 實驗性功能
x-i18n:
    generated_at: "2026-07-22T10:30:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c14b74bbafce77c0d1e1358ad94053675c4aad9e26be78719f58e78f455c3a2
    source_path: concepts/experimental-features.md
    workflow: 16
---

實驗性功能是置於明確旗標之後的預覽介面。它們需要累積更多實際使用經驗，才能成為穩定的預設值或長期有效的契約。

- 除非文件說明了範圍明確的自動設定規則，否則預設為關閉。
- 其結構與行為的變更速度可能比穩定設定更快。
- 若已有穩定的做法，請優先採用。
- 只有在較小型的環境中完成測試後，才廣泛推出。

## 目前已記載的旗標

| 介面                     | 鍵                                                                                            | 適用時機                                                                                                                          | 更多資訊                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 本機模型執行環境         | `agents.defaults.experimental.localModelLean`, `agents.entries.*.experimental.localModelLean` | 較小型或限制較嚴格的本機後端無法處理 OpenClaw 完整的預設工具介面                                                                 | [本機模型](/zh-TW/gateway/local-models)                                                      |
| Codex 測試框架            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                       | 你希望原生 Codex app-server 0.132.0 或更新版本以 OpenClaw 沙箱支援的 exec-server 為目標，而非停用 Code Mode                       | [Codex 測試框架參考](/zh-TW/plugins/codex-harness-reference#sandboxed-native-execution)      |
| 結構化規劃工具           | `tools.experimental.planTool`                                                                 | 你希望在相容的執行環境與 UI 中公開結構化的 `update_plan` 工具，用於追蹤多步驟工作                                               | [閘道設定參考](/zh-TW/gateway/config-tools#toolsexperimental)                                |
| Code Mode                | `tools.codeMode.enabled`                                                                      | 你希望透過由程式碼協調的精簡方式，存取隱藏的 OpenClaw 工具目錄                                                                    | [Code Mode](/zh-TW/tools/code-mode)                                                          |
| Swarm                    | `tools.swarm.enabled`                                                                         | 你希望 Code Mode 指令碼能以平行方式協調範圍受限的子代理程式群組                                                                   | [Swarm](/zh-TW/tools/swarm)                                                                  |

## Control UI 實驗室

開啟 **Settings → Agents & Tools → Labs**，以管理具有
Control UI 開關的實驗。啟用或停用實驗室項目時，會立即修補標準的閘道
設定；只有在功能需要重新啟動時，頁面才會顯示重新啟動提示。

Code Mode 與 Swarm 是目前已發布的 Labs 項目。兩個開關都會
寫入現有且已驗證的設定鍵，且通常不必重新啟動閘道，就會對之後的代理程式
執行生效。

## 本機模型精簡模式

`agents.defaults.experimental.localModelLean: true` 會在每一輪中，從代理程式的直接介面移除重量級的選用工具：`browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 與 `pdf`。明確允許或傳遞作業所需的工具仍可使用，但工具搜尋可能會將它們收錄於目錄中，而非直接公開。當尚未設定 `tools.toolSearch` 時，精簡模式也會將外掛／MCP／用戶端目錄預設為結構化工具搜尋（`tool_search`、`tool_describe`、`tool_call`）。使用 `agents.entries.*.experimental.localModelLean` 可將其範圍限制於單一代理程式。

在初始設定期間，若已驗證的 `ollama` 或 `lmstudio` 推論路由尚未具有該值，便會自動設定 `agents.defaults.experimental.localModelLean: true`。OpenClaw 會記錄此設定來自初始設定流程，因此後續經驗證的非本機路由只會解除自動設定。明確設定的 `true` 或 `false` 會保留。系統不會根據模型名稱或 URL 推斷其他自行託管及 OpenAI 相容的供應商。

若你已在全域調整工具搜尋，OpenClaw 不會變更該設定。設定 `tools.toolSearch: false` 可停用精簡模式的工具搜尋預設值。

在結構化 `tools` 模式中，精簡執行會讓 `exec` 與工具搜尋控制項並列並保持直接可見，使針對程式設計調校的本機模型仍可選擇熟悉的 Shell 路徑。這只會變更結構描述的可見性：一般工具政策、沙箱隔離與 exec 核准機制仍然適用。明確的 `code` 與 `directory` 模式會維持其一般壓縮行為。

### 為何選擇這些工具

這些工具具有最長的說明、最廣泛的參數結構，或最可能使小型模型偏離一般程式設計與對話流程。在上下文較小或限制較嚴格的 OpenAI 相容後端上，這會造成以下差異：

- 工具結構描述能放入提示中，而不是排擠對話歷史記錄。
- 模型能選擇正確的工具，而不是因相似的結構描述過多，產生格式錯誤的工具呼叫。
- Chat Completions 轉接器能維持在結構化輸出限制內，而不是因工具呼叫承載資料大小導致 400 錯誤。

移除這些工具只會縮短直接工具清單。模型仍具有 `read`、`write`、`edit`、`exec`、`apply_patch`、影像理解、網頁搜尋／擷取（若已設定）、記憶，以及工作階段／代理程式工具。除非設定 `tools.toolSearch: false`，否則額外目錄仍可透過工具搜尋存取；明確允許工具可讓精簡代理程式重新加入遭裁減的工作流程。

### 何時應啟用

當你已確認模型可與閘道通訊，但完整的代理程式執行出現異常時，請啟用精簡模式：

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` 成功。
2. 一般代理程式執行因工具呼叫格式錯誤、提示過大，或模型忽略其工具而失敗。
3. 切換 `localModelLean: true` 後，失敗狀況消失。

### 何時應維持關閉

若後端能順利處理完整的預設執行環境，請維持關閉。這是提供給需要較小工具介面的本機堆疊的因應措施，而不是託管模型或資源充足之本機設備的預設值。

精簡模式無法取代 `tools.profile`、`tools.allow`/`tools.deny`，或模型的 `compat.supportsTools: false` 應變機制。若要為特定代理程式永久縮小工具介面，請優先使用這些穩定的調整項目。

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

僅套用於一個代理程式：

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

變更旗標後，請重新啟動閘道。除非你使用 `tools.allow` 或 `tools.alsoAllow` 明確保留，否則精簡篩選會移除 `browser`、`cron`、`message`、`image_generate`、`music_generate`、`video_generate`、`tts` 與 `pdf`；工具搜尋仍可能將保留的工具收錄於目錄中，而非直接公開。

## 實驗性不代表隱藏

實驗性功能應在文件及設定路徑本身清楚標示，而不是隱藏在看似穩定的預設調整項目之後。

## 相關內容

- [功能](/zh-TW/concepts/features)
- [發布管道](/zh-TW/install/development-channels)
