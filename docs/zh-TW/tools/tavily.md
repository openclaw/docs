---
read_when:
    - 你想要由 Tavily 支援的網頁搜尋
    - 你需要一個 Tavily API 金鑰
    - 你想要使用 Tavily 作為 web_search 提供者
    - 你想要從 URL 擷取內容
summary: Tavily 搜尋與擷取工具
title: Tavily
x-i18n:
    generated_at: "2026-04-30T03:48:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 16
---

OpenClaw 可以透過兩種方式使用 **Tavily**：

- 作為 `web_search` 提供者
- 作為明確的 Plugin 工具：`tavily_search` 和 `tavily_extract`

Tavily 是專為 AI 應用程式設計的搜尋 API，會傳回針對 LLM 使用最佳化的結構化結果。它支援可設定的搜尋深度、主題篩選、網域篩選器、AI 產生的答案摘要，以及從 URL 擷取內容（包括 JavaScript 轉譯的頁面）。

## 取得 API 金鑰

1. 在 [tavily.com](https://tavily.com/) 建立 Tavily 帳戶。
2. 在儀表板中產生 API 金鑰。
3. 將它儲存在設定中，或在 Gateway 環境中設定 `TAVILY_API_KEY`。

## 設定 Tavily 搜尋

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

注意事項：

- 在上線引導或 `openclaw configure --section web` 中選擇 Tavily，會自動啟用隨附的 Tavily Plugin。
- 將 Tavily 設定儲存在 `plugins.entries.tavily.config.webSearch.*` 下。
- 使用 Tavily 的 `web_search` 支援 `query` 和 `count`（最多 20 筆結果）。
- 若要使用 Tavily 專屬控制項，例如 `search_depth`、`topic`、`include_answer` 或網域篩選器，請使用 `tavily_search`。

## Tavily Plugin 工具

### `tavily_search`

當你想使用 Tavily 專屬搜尋控制項，而不是通用的 `web_search` 時，請使用此工具。

| 參數              | 說明                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `query`           | 搜尋查詢字串（保持在 400 個字元以內）                                 |
| `search_depth`    | `basic`（預設，平衡）或 `advanced`（最高相關性，較慢）                |
| `topic`           | `general`（預設）、`news`（即時更新）或 `finance`                     |
| `max_results`     | 結果數量，1-20（預設：5）                                             |
| `include_answer`  | 包含 AI 產生的答案摘要（預設：false）                                 |
| `time_range`      | 依新近程度篩選：`day`、`week`、`month` 或 `year`                      |
| `include_domains` | 要限制結果的網域陣列                                                  |
| `exclude_domains` | 要從結果中排除的網域陣列                                              |

**搜尋深度：**

| 深度       | 速度 | 相關性 | 最適用於                            |
| ---------- | ---- | ------ | ----------------------------------- |
| `basic`    | 較快 | 高     | 一般用途查詢（預設）                |
| `advanced` | 較慢 | 最高   | 精準查詢、特定事實、研究            |

### `tavily_extract`

使用此工具可從一個或多個 URL 擷取乾淨內容。它可處理 JavaScript 轉譯的頁面，並支援以查詢為焦點的分塊，以進行目標式擷取。

| 參數                | 說明                                                        |
| ------------------- | ----------------------------------------------------------- |
| `urls`              | 要擷取的 URL 陣列（每次請求 1-20 個）                       |
| `query`             | 依與此查詢的相關性重新排序擷取出的分塊                      |
| `extract_depth`     | `basic`（預設，快速）或 `advanced`（適用於大量 JS 的頁面） |
| `chunks_per_source` | 每個 URL 的分塊數量，1-5（需要 `query`）                    |
| `include_images`    | 在結果中包含圖片 URL（預設：false）                         |

**擷取深度：**

| 深度       | 使用時機                                  |
| ---------- | ----------------------------------------- |
| `basic`    | 簡單頁面 - 請先嘗試此選項                |
| `advanced` | JS 轉譯的 SPA、動態內容、表格             |

提示：

- 每次請求最多 20 個 URL。將較大的清單分批成多次呼叫。
- 使用 `query` + `chunks_per_source` 只取得相關內容，而不是完整頁面。
- 先嘗試 `basic`；如果內容缺失或不完整，再改用 `advanced`。

## 選擇正確的工具

| 需求                             | 工具             |
| -------------------------------- | ---------------- |
| 快速網頁搜尋，無特殊選項         | `web_search`     |
| 使用深度、主題、AI 答案進行搜尋  | `tavily_search`  |
| 從特定 URL 擷取內容              | `tavily_extract` |

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者和自動偵測
- [Firecrawl](/zh-TW/tools/firecrawl) -- 搭配內容擷取的搜尋 + 擷取
- [Exa Search](/zh-TW/tools/exa-search) -- 搭配內容擷取的神經搜尋
