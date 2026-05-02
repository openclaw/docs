---
read_when:
    - 您想使用 Grok 進行 web_search
    - 你需要 XAI_API_KEY 才能進行網頁搜尋
summary: 透過 xAI 以網路為依據的回應進行 Grok 網頁搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-05-02T21:05:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7238be2b488ba285c948065f5c1deff21898409aa11bdaa9ec893274d0eadd4a
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援 Grok 作為 `web_search` 提供者，使用 xAI 以網頁為根據的回應，產生由即時搜尋結果與引用支援的 AI 綜合答案。

同一個 `XAI_API_KEY` 也可以驅動內建的 `x_search` 工具，用於 X（前身為 Twitter）貼文搜尋。如果你將金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 現在也會將它作為隨附 xAI 模型提供者的備用金鑰重複使用。

對於貼文層級的 X 指標，例如轉發、回覆、書籤或觀看次數，請優先使用 `x_search` 搭配確切的貼文 URL 或狀態 ID，而不是寬泛的搜尋查詢。

## 上手與設定

如果你在以下流程中選擇 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以顯示一個獨立的後續步驟，使用相同的 `XAI_API_KEY` 啟用 `x_search`。該後續步驟：

- 只會在你為 `web_search` 選擇 Grok 後出現
- 不是另一個獨立的頂層網頁搜尋提供者選項
- 可以選擇在同一流程中設定 `x_search` 模型

如果你略過它，可以稍後在設定中啟用或變更 `x_search`。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    從 [xAI](https://console.x.ai/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `XAI_API_KEY`，或透過以下方式設定：

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

**環境替代方式：** 在 Gateway 環境中設定 `XAI_API_KEY`。對於 Gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 運作方式

Grok 使用 xAI 以網頁為根據的回應來綜合含有行內引用的答案，類似 Gemini 的 Google 搜尋 grounding 方法。

## 支援的參數

Grok 搜尋支援 `query`。

`count` 會被接受以相容共用的 `web_search`，但 Grok 仍會傳回一個含有引用的綜合答案，而不是 N 筆結果清單。

目前不支援提供者專用篩選器。

Grok 使用提供者專用的 60 秒預設逾時，因為 xAI Responses 以網頁為根據的搜尋可能會比共用的 `web_search` 預設值執行更久。設定 `tools.web.search.timeoutSeconds` 可覆寫它。

## Base URL 覆寫

當 Grok 網頁搜尋應透過操作方代理或 xAI 相容的 Responses 端點路由時，請設定 `plugins.entries.xai.config.webSearch.baseUrl`。OpenClaw 會在移除尾端斜線後發送到 `<baseUrl>/responses`。除非已設定 `plugins.entries.xai.config.xSearch.baseUrl`，否則 `x_search` 會使用相同的 `webSearch.baseUrl` 備用值。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Search 中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 提供一級支援的 X 搜尋
- [Gemini Search](/zh-TW/tools/gemini-search) -- 透過 Google grounding 提供 AI 綜合答案
