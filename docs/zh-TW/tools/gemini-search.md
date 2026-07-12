---
read_when:
    - 你想要使用 Gemini 進行 `web_search`
    - 你需要 `GEMINI_API_KEY` 或 `models.providers.google.apiKey`
    - 你想使用 Google 搜尋依據功能
summary: 使用 Google 搜尋依據的 Gemini 網頁搜尋
title: Gemini 搜尋
x-i18n:
    generated_at: "2026-07-11T21:51:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支援內建
[Google 搜尋依據](https://ai.google.dev/gemini-api/docs/grounding)的 Gemini 模型，
可根據即時 Google 搜尋結果傳回由 AI 綜合產生並附有引用的答案。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 並建立
    API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `GEMINI_API_KEY`、重複使用
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
            apiKey: "AIza...", // 若已設定 GEMINI_API_KEY 或 models.providers.google.apiKey，則可省略
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 選用；未設定時改用 models.providers.google.baseUrl
            model: "gemini-2.5-flash", // 預設值
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
`plugins.entries.google.config.webSearch.apiKey`，其次是 `GEMINI_API_KEY`，
最後是 `models.providers.google.apiKey`。就基礎 URL 而言，專用的
`plugins.entries.google.config.webSearch.baseUrl` 優先於
`models.providers.google.baseUrl`。

若是安裝於閘道，請將環境金鑰放入 `~/.openclaw/.env`。

## 運作方式

傳統搜尋提供者會傳回連結與摘要片段的清單，而 Gemini 則不同，它會使用
Google 搜尋依據產生由 AI 綜合且附有行內引用的答案。結果同時包含綜合產生的
答案與來源 URL。

- Gemini 搜尋依據傳回的引用 URL，會透過 OpenClaw 具備 SSRF 防護的擷取路徑
  發出 HEAD 請求，自動將 Google 重新導向 URL 解析為直接 URL（遵循重新導向、
  驗證 http/https）。
- 重新導向解析採用嚴格的 SSRF 預設值，因此會封鎖重新導向至
  私有／內部目標的情況。

## 支援的參數

Gemini 搜尋支援 `query`、`freshness`、`date_after` 和 `date_before`。

為了相容於共用的 `web_search`，也接受 `count`，但 Gemini 搜尋依據仍會傳回
一個附有引用的綜合答案，而不是包含 N 筆結果的清單。

`freshness` 接受 `day`、`week`、`month`、`year`，以及共用的簡寫
`pd`、`pw`、`pm` 和 `py`。`day`／`pd` 會在 Gemini 查詢中加入近期性指示，
而不會設定嚴格的 24 小時範圍。`week`、`month`、`year`，以及明確的
`date_after`／`date_before` 範圍，會設定 Gemini Google 搜尋依據的
`timeRangeFilter`。不支援 `country`、`language` 和 `domain_filter`。

## 模型選擇

預設模型是 `gemini-2.5-flash`（快速且符合成本效益）。任何支援搜尋依據的
Gemini 模型都可以透過 `plugins.entries.google.config.webSearch.model` 使用。

## 基礎 URL 覆寫

當 Gemini 網頁搜尋必須經由營運者代理伺服器或自訂的 Gemini 相容端點路由時，
請設定 `plugins.entries.google.config.webSearch.baseUrl`。若未設定，Gemini
網頁搜尋會重複使用 `models.providers.google.baseUrl`。單純的
`https://generativelanguage.googleapis.com` 值會正規化為
`https://generativelanguage.googleapis.com/v1beta`；自訂代理路徑在移除尾端斜線後，
會依照提供的內容保留。

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 包含摘要片段的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 結構化結果與內容擷取
