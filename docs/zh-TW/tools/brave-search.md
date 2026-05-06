---
read_when:
    - 您想要使用 Brave Search 進行 web_search
    - 你需要 BRAVE_API_KEY 或方案詳細資料
summary: 用於 web_search 的 Brave Search API 設定
title: Brave 搜尋
x-i18n:
    generated_at: "2026-05-06T09:20:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw 支援 Brave Search API 作為 `web_search` 提供者。

## 取得 API 金鑰

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 建立 Brave Search API 帳號
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

Brave 搜尋的提供者特定設定現在位於 `plugins.entries.brave.config.webSearch.*` 下。
舊版 `tools.web.search.apiKey` 仍會透過相容性 shim 載入，但不再是標準設定路徑。

`webSearch.mode` 控制 Brave 傳輸方式：

- `web`（預設）：一般 Brave 網頁搜尋，包含標題、URL 和摘要
- `llm-context`：Brave LLM Context API，提供預先擷取的文字區塊與來源以供根據

`webSearch.baseUrl` 可以將 Brave 請求指向受信任、與 Brave 相容的代理
或 Gateway。OpenClaw 會將 `/res/v1/web/search` 或 `/res/v1/llm/context` 附加到
已設定的基底 URL，並將基底 URL 保留在快取鍵中。公開
端點必須使用 `https://`；`http://` 只接受用於受信任的 loopback
或私有網路代理主機。

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
只包含此日期之後發布的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
只包含此日期之前發布的結果（`YYYY-MM-DD`）。
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

## 備註

- OpenClaw 使用 Brave **Search** 方案。如果你有舊版訂閱（例如原本每月 2,000 次查詢的 Free 方案），它仍然有效，但不包含 LLM Context 或更高速率限制等較新的功能。
- 每個 Brave 方案都包含**每月 \$5 的免費額度**（會續期）。Search 方案每 1,000 次請求費用為 \$5，因此額度可涵蓋每月 1,000 次查詢。請在 Brave 儀表板中設定你的用量限制，以避免非預期費用。請參閱 [Brave API 入口網站](https://brave.com/search/api/)了解目前方案。
- Search 方案包含 LLM Context 端點與 AI 推論權限。儲存結果以訓練或調校模型，需要具備明確儲存權限的方案。請參閱 Brave [服務條款](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式會傳回有根據的來源項目，而不是一般網頁搜尋摘要形狀。
- `llm-context` 模式支援 `freshness` 以及有界的 `date_after` + `date_before` 範圍。它不支援 `ui_lang`；沒有 `date_after` 的 `date_before` 會被拒絕，因為 Brave 要求自訂 freshness 範圍必須同時包含開始與結束日期。
- `ui_lang` 必須包含像 `en-US` 這樣的地區子標籤。
- 結果預設快取 15 分鐘（可透過 `cacheTtlMinutes` 設定）。
- 自訂 `webSearch.baseUrl` 值會包含在 Brave 快取身分識別中，因此
  代理特定的回應不會互相衝突。
- 啟用 `brave.http` 診斷旗標，可在疑難排解時記錄 Brave 請求 URL/查詢參數、回應狀態/計時，以及搜尋快取命中/未命中/寫入事件。此旗標絕不會記錄 API 金鑰或回應本文，但搜尋查詢可能具有敏感性。

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 具備網域篩選的結構化結果
- [Exa Search](/zh-TW/tools/exa-search) -- 具備內容擷取的神經搜尋
