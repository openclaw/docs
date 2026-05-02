---
read_when:
    - 您想使用 Gemini 進行 web_search
    - 您需要 GEMINI_API_KEY 或 models.providers.google.apiKey
    - 您想要 Google Search 依據
summary: 使用 Google Search 作為依據的 Gemini 網頁搜尋
title: Gemini 搜尋
x-i18n:
    generated_at: "2026-05-02T21:05:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支援內建
[Google Search 依據](https://ai.google.dev/gemini-api/docs/grounding)的 Gemini 模型，
可傳回由即時 Google Search 結果支援、並附有
引用來源的 AI 合成答案。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 並建立
    API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `GEMINI_API_KEY`、重用
    `models.providers.google.apiKey`，或透過下列方式設定專用的網頁搜尋金鑰：

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

**憑證優先順序：**Gemini 網頁搜尋會先使用
`plugins.entries.google.config.webSearch.apiKey`，再使用 `GEMINI_API_KEY`，
最後使用 `models.providers.google.apiKey`。對於基礎 URL，專用的
`plugins.entries.google.config.webSearch.baseUrl` 會優先於
`models.providers.google.baseUrl`。

若是 Gateway 安裝，請將環境金鑰放在 `~/.openclaw/.env`。

## 運作方式

不同於傳統搜尋提供者會傳回連結與摘要片段清單，Gemini 使用 Google Search 依據來產生附有
行內引用來源的 AI 合成答案。結果同時包含合成答案與來源
URL。

- Gemini 依據所提供的引用 URL 會自動從 Google
  重新導向 URL 解析為直接 URL。
- 重新導向解析會先使用 SSRF 防護路徑（HEAD + 重新導向檢查 +
  http/https 驗證），再傳回最終引用 URL。
- 重新導向解析使用嚴格的 SSRF 預設值，因此會封鎖重新導向到
  私有/內部目標。

## 支援的參數

Gemini 搜尋支援 `query`、`freshness`、`date_after` 和 `date_before`。

`count` 可用於共用的 `web_search` 相容性，但 Gemini 依據
仍會傳回一個附有引用來源的合成答案，而不是 N 筆結果的
清單。

`freshness` 接受 `day`、`week`、`month`、`year`，以及共用快捷值
`pd`、`pw`、`pm` 和 `py`。OpenClaw 會將這些值，或明確的
`date_after`/`date_before` 範圍，轉換為 Gemini Google Search 依據的
`timeRangeFilter`。不支援 `country`、`language` 和 `domain_filter`。

## 模型選擇

預設模型是 `gemini-2.5-flash`（快速且具成本效益）。任何支援依據功能的 Gemini
模型都可透過
`plugins.entries.google.config.webSearch.model` 使用。

## 基礎 URL 覆寫

當 Gemini 網頁搜尋必須透過操作員代理或自訂 Gemini 相容端點路由時，請設定
`plugins.entries.google.config.webSearch.baseUrl`。若未設定，
Gemini 網頁搜尋會重用 `models.providers.google.baseUrl`。純
`https://generativelanguage.googleapis.com` 值會正規化為
`https://generativelanguage.googleapis.com/v1beta`；自訂代理路徑會在移除尾端斜線後依提供的內容保留。

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 含摘要片段的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 結構化結果 + 內容擷取
