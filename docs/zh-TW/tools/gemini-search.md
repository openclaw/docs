---
read_when:
    - 你想使用 Gemini 進行 web_search
    - 你需要 GEMINI_API_KEY 或 models.providers.google.apiKey
    - 你想要 Google Search grounding
summary: 使用 Google Search grounding 的 Gemini 網頁搜尋
title: Gemini 搜尋
x-i18n:
    generated_at: "2026-06-27T20:07:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8bbebd5689daaa63c817ff17eac70e197999a3e1ecbb198249eb567e5ba0fc5f
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支援內建
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding) 的 Gemini 模型，
會傳回由即時 Google Search 結果支援、含引用的 AI 合成答案。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 並建立
    API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `GEMINI_API_KEY`、重用
    `models.providers.google.apiKey`，或透過以下方式設定專用的網頁搜尋金鑰：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 設定

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**憑證優先順序：** Gemini 網頁搜尋會先使用
`plugins.entries.google.config.webSearch.apiKey`，接著使用 `GEMINI_API_KEY`，
再使用 `models.providers.google.apiKey`。對於基底 URL，專用的
`plugins.entries.google.config.webSearch.baseUrl` 會優先於
`models.providers.google.baseUrl`。

對於閘道安裝，請將環境金鑰放在 `~/.openclaw/.env`。

## 運作方式

不同於傳統搜尋提供者傳回連結和摘要片段列表，
Gemini 使用 Google Search grounding 產生含行內引用的 AI 合成答案。
結果包含合成答案與來源 URL。

- 來自 Gemini grounding 的引用 URL 會自動從 Google
  重新導向 URL 解析為直接 URL。
- 重新導向解析會在傳回最終引用 URL 前，使用 SSRF 防護路徑（HEAD + 重新導向檢查 +
  http/https 驗證）。
- 重新導向解析使用嚴格的 SSRF 預設值，因此會封鎖重新導向至
  私有／內部目標。

## 支援的參數

Gemini 搜尋支援 `query`、`freshness`、`date_after` 和 `date_before`。

`count` 會被接受，以相容共用的 `web_search`，但 Gemini grounding
仍會傳回一個含引用的合成答案，而不是 N 筆結果的
列表。

`freshness` 接受 `day`、`week`、`month`、`year`，以及共用捷徑
`pd`、`pw`、`pm` 和 `py`。`day`/`pd` 會在 Gemini
查詢中加入時效性指示，而不是硬性的 24 小時範圍。`week`、`month`、`year`，以及明確的
`date_after`/`date_before` 範圍會設定 Gemini Google Search grounding 的
`timeRangeFilter`。不支援 `country`、`language` 和 `domain_filter`。

## 模型選擇

預設模型是 `gemini-2.5-flash`（快速且具成本效益）。任何支援 grounding 的 Gemini
模型都可以透過
`plugins.entries.google.config.webSearch.model` 使用。

## 基底 URL 覆寫

當 Gemini 網頁搜尋必須透過操作員代理或自訂 Gemini 相容端點路由時，請設定 `plugins.entries.google.config.webSearch.baseUrl`。若未設定，
Gemini 網頁搜尋會重用 `models.providers.google.baseUrl`。純
`https://generativelanguage.googleapis.com` 值會正規化為
`https://generativelanguage.googleapis.com/v1beta`；自訂代理路徑會在移除尾端斜線後，依提供內容保留。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 含摘要片段的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 結構化結果 + 內容擷取
