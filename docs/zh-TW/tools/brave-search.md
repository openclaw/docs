---
read_when:
    - 你想使用 Brave Search 進行 web_search
    - 你需要 BRAVE_API_KEY 或方案詳細資訊
summary: Brave Search API 設定，用於 web_search
title: Brave 搜尋
x-i18n:
    generated_at: "2026-07-05T11:48:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw 支援 Brave Search API 作為 `web_search` 提供者。

## 取得 API 金鑰

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 建立 Brave Search API 帳戶
2. 在儀表板中，選擇 **Search** 方案並產生 API 金鑰。
3. 將金鑰儲存在設定中，或在閘道環境中設定 `BRAVE_API_KEY`。

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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

Brave 專屬搜尋設定位於 `plugins.entries.brave.config.webSearch.*`；這是標準設定路徑。共用的頂層 `tools.web.search.apiKey` 和範圍限定的 `tools.web.search.brave.*` 仍會透過相容性合併載入，但新的設定應使用上方的外掛範圍路徑。

`webSearch.mode` 控制 Brave 傳輸：

- `web`（預設）：一般 Brave 網頁搜尋，包含標題、URL 和摘要片段
- `llm-context`：Brave LLM Context API，提供預先擷取的文字區塊和來源以作為依據

`webSearch.baseUrl` 可將 Brave 請求指向受信任的 Brave 相容代理
或閘道。OpenClaw 會將 `/res/v1/web/search` 或 `/res/v1/llm/context` 附加到
設定的基底 URL，並在快取鍵中保留基底 URL。公開
端點必須使用 `https://`；`http://` 僅接受用於受信任的回環
或私人網路代理主機。

## 工具參數

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number" default="5">
要傳回的結果數量（1–10）。
</ParamField>

<ParamField path="country" type="string">
2 字母 ISO 國家/地區代碼（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
搜尋結果的 ISO 639-1 語言代碼（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave 搜尋語言代碼（例如 `en`、`en-gb`、`zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 元素的 ISO 語言代碼。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間篩選器 — `day` 為 24 小時。
</ParamField>

<ParamField path="date_after" type="string">
僅包含此日期之後發布的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
僅包含此日期之前發布的結果（`YYYY-MM-DD`）。
</ParamField>

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

- OpenClaw 使用 Brave **Search** 方案。如果你有舊版訂閱（例如原始的 Free 方案，每月 2,000 次查詢），它仍然有效，但不包含較新的功能，例如 LLM Context 或更高的速率限制。
- 每個 Brave 方案都包含**每月 \$5 免費額度**（會續期）。Search 方案費用為每 1,000 次請求 \$5，因此此額度可涵蓋每月 1,000 次查詢。請在 Brave 儀表板中設定你的使用量上限，以避免非預期費用。請參閱 [Brave API 入口網站](https://brave.com/search/api/) 以取得目前方案。
- Search 方案包含 LLM Context 端點和 AI 推論權利。儲存結果以訓練或調校模型，需要具備明確儲存權利的方案。請參閱 Brave [服務條款](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式會傳回有依據的來源項目，而不是一般網頁搜尋摘要片段格式。
- `llm-context` 模式支援 `freshness` 和有界的 `date_after` + `date_before` 範圍。它不支援 `ui_lang`；沒有 `date_after` 的 `date_before` 會被拒絕，因為 Brave 要求自訂新鮮度範圍必須同時包含開始和結束日期。
- `ui_lang` 必須包含區域子標籤，例如 `en-US`。
- 結果預設會快取 15 分鐘（可透過 `cacheTtlMinutes` 設定）。
- 自訂 `webSearch.baseUrl` 值會包含在 Brave 快取識別中，因此
  代理專屬回應不會互相衝突。
- 啟用 `brave.http` 診斷旗標，以在疑難排解時記錄 Brave 請求 URL/查詢參數、回應狀態/時間，以及搜尋快取命中/未命中/寫入事件。此旗標絕不會記錄 API 金鑰或回應本文，但搜尋查詢可能是敏感資訊。

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者和自動偵測
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 具備網域篩選的結構化結果
- [Exa Search](/zh-TW/tools/exa-search) -- 具備內容擷取的神經搜尋
