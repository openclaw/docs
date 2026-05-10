---
read_when:
    - 你想使用 Grok 進行 web_search
    - 您需要 XAI_API_KEY 才能使用網頁搜尋
summary: 透過 xAI 以網路資料為依據的回應進行 Grok 網路搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-05-10T19:53:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援 Grok 作為 `web_search` 提供者，使用 xAI 以網頁為依據的
回應來產生由即時搜尋結果支援、並附有引用來源的 AI 綜合答案。

同一個 xAI API 金鑰也可以驅動內建的 `x_search` 工具，用於 X
（前稱 Twitter）貼文搜尋，以及 `code_execution` 工具。如果你將金鑰儲存在
`plugins.entries.xai.config.webSearch.apiKey`，OpenClaw 現在也會將它重複用作
隨附 xAI 模型提供者的備用金鑰。

若要取得貼文層級的 X 指標，例如轉貼、回覆、書籤或瀏覽次數，請優先使用
`x_search` 搭配精確的貼文 URL 或狀態 ID，而不是寬泛的搜尋查詢。

## 入門與設定

如果你在下列流程中選擇 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以顯示一個獨立的後續步驟，讓你使用同一個
`XAI_API_KEY` 啟用 `x_search`。該後續步驟：

- 只會在你為 `web_search` 選擇 Grok 後出現
- 不是另一個頂層的網頁搜尋提供者選項
- 可以選擇在同一個流程中設定 `x_search` 模型

如果你略過它，可以稍後在設定中啟用或變更 `x_search`。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    從 [xAI](https://console.x.ai/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `XAI_API_KEY`，或透過下列方式設定：

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**環境替代方式：** 在 Gateway 環境中設定 `XAI_API_KEY`。
若是 Gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 運作方式

Grok 使用 xAI 以網頁為依據的回應來綜合產生帶有行內引用的答案，
類似 Gemini 的 Google Search grounding 方法。

## 支援的參數

Grok 搜尋支援 `query`。

`count` 會被接受以相容共用的 `web_search`，但 Grok 仍會
回傳一個帶有引用的綜合答案，而不是 N 筆結果清單。

目前不支援提供者專屬篩選器。

Grok 使用提供者專屬的 60 秒預設逾時，因為 xAI Responses
以網頁為依據的搜尋可能比共用的 `web_search` 預設值執行更久。設定
`tools.web.search.timeoutSeconds` 可覆寫它。

## 基礎 URL 覆寫

當 Grok 網頁搜尋應透過操作員 Proxy 或 xAI 相容的 Responses 端點路由時，設定
`plugins.entries.xai.config.webSearch.baseUrl`。OpenClaw
會在移除尾端斜線後發送到 `<baseUrl>/responses`。除非已設定
`plugins.entries.xai.config.xSearch.baseUrl`，否則 `x_search`
會使用相同的 `webSearch.baseUrl` 備用值。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Search 中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 進行第一級 X 搜尋
- [Gemini Search](/zh-TW/tools/gemini-search) -- 透過 Google grounding 產生的 AI 綜合答案
