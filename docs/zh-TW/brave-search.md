---
read_when:
    - 您想使用 Brave Search 進行 web_search
    - 你需要 BRAVE_API_KEY 或方案詳細資訊
summary: web_search 的 Brave Search API 設定
title: Brave 搜尋（舊版路徑）
x-i18n:
    generated_at: "2026-04-30T02:45:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw 支援 Brave Search API 作為 `web_search` 提供者。

## 取得 API 金鑰

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 建立 Brave Search API 帳戶
2. 在儀表板中，選擇 **Search** 方案並產生 API 金鑰。
3. 將金鑰儲存在設定中，或在 Gateway 環境中設定 `BRAVE_API_KEY`。

## 設定範例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Brave 專屬的搜尋設定現在位於 `plugins.entries.brave.config.webSearch.*` 下。
舊版 `tools.web.search.apiKey` 仍會透過相容性 shim 載入，但它不再是標準設定路徑。

`webSearch.mode` 控制 Brave 傳輸模式：

- `web`（預設）：一般 Brave 網頁搜尋，包含標題、URL 和摘要
- `llm-context`：Brave LLM Context API，包含預先擷取的文字區塊和用於依據佐證的來源

## 工具參數

| 參數          | 說明                                                                |
| ------------- | ------------------------------------------------------------------- |
| `query`       | 搜尋查詢（必要）                                                    |
| `count`       | 要傳回的結果數量（1-10，預設：5）                                   |
| `country`     | 2 字母 ISO 國家代碼（例如 "US"、"DE"）                              |
| `language`    | 搜尋結果的 ISO 639-1 語言代碼（例如 "en"、"de"、"fr"）              |
| `search_lang` | Brave 搜尋語言代碼（例如 `en`、`en-gb`、`zh-hans`）                 |
| `ui_lang`     | UI 元素的 ISO 語言代碼                                              |
| `freshness`   | 時間篩選器：`day`（24 小時）、`week`、`month` 或 `year`              |
| `date_after`  | 只包含此日期之後發布的結果（YYYY-MM-DD）                            |
| `date_before` | 只包含此日期之前發布的結果（YYYY-MM-DD）                            |

**範例：**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 注意事項

- OpenClaw 使用 Brave **Search** 方案。如果你有舊版訂閱（例如原本每月 2,000 次查詢的 Free 方案），它仍然有效，但不包含 LLM Context 或更高速率限制等較新功能。
- 每個 Brave 方案都包含**每月 \$5 免費額度**（會續期）。Search 方案每 1,000 次請求收費 \$5，因此該額度可涵蓋每月 1,000 次查詢。請在 Brave 儀表板中設定使用量限制，以避免產生非預期費用。請參閱 [Brave API 入口網站](https://brave.com/search/api/)了解目前方案。
- Search 方案包含 LLM Context 端點和 AI 推論權限。儲存結果以訓練或微調模型需要具備明確儲存權限的方案。請參閱 Brave [服務條款](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式會傳回有依據佐證的來源項目，而不是一般網頁搜尋摘要格式。
- `llm-context` 模式不支援 `ui_lang`、`freshness`、`date_after` 或 `date_before`。
- `ui_lang` 必須包含像 `en-US` 這樣的區域子標籤。
- 結果預設會快取 15 分鐘（可透過 `cacheTtlMinutes` 設定）。

請參閱 [Web 工具](/zh-TW/tools/web)了解完整的 web_search 設定。

## 相關

- [Brave 搜尋](/zh-TW/tools/brave-search)
