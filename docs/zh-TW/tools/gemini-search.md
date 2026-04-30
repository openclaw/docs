---
read_when:
    - 你想使用 Gemini 進行 web_search
    - 你需要 GEMINI_API_KEY
    - 你想要以 Google Search 作為依據
summary: 以 Google Search 為依據的 Gemini 網頁搜尋
title: Gemini 搜尋
x-i18n:
    generated_at: "2026-04-30T03:45:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw 支援內建
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
的 Gemini 模型，會傳回由即時 Google Search 結果支援、並附有引用的 AI 合成答案。

## 取得 API 金鑰

<Steps>
  <Step title="Create a key">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 並建立
    API 金鑰。
  </Step>
  <Step title="Store the key">
    在 Gateway 環境中設定 `GEMINI_API_KEY`，或透過下列方式設定：

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY is set
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

**環境替代方式：**在 Gateway 環境中設定 `GEMINI_API_KEY`。
若是 Gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 運作方式

與傳統搜尋提供者傳回連結和摘要片段清單不同，Gemini 會使用 Google Search grounding 產生附有行內引用的 AI 合成答案。結果包含合成答案和來源 URL。

- 來自 Gemini grounding 的引用 URL 會自動從 Google
  重新導向 URL 解析為直接 URL。
- 重新導向解析會先使用 SSRF 防護路徑（HEAD + 重新導向檢查 +
  http/https 驗證），再傳回最終引用 URL。
- 重新導向解析使用嚴格的 SSRF 預設值，因此會封鎖重新導向到
  私人/內部目標。

## 支援的參數

Gemini 搜尋支援 `query`。

為了與共用的 `web_search` 相容，會接受 `count`，但 Gemini grounding
仍會傳回一個附有引用的合成答案，而不是 N 筆結果清單。

不支援提供者專屬篩選器，例如 `country`、`language`、`freshness` 和
`domain_filter`。

## 模型選擇

預設模型是 `gemini-2.5-flash`（快速且具成本效益）。任何支援 grounding
的 Gemini 模型都可以透過
`plugins.entries.google.config.webSearch.model` 使用。

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者和自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 含摘要片段的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 結構化結果 + 內容擷取
