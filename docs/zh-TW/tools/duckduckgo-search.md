---
read_when:
    - 您想要不需要 API 金鑰的網頁搜尋提供者
    - 你想要使用 DuckDuckGo 進行 web_search
    - 你需要一個零設定的搜尋備援機制
summary: DuckDuckGo 網頁搜尋 -- 免金鑰備援提供者（實驗性，基於 HTML）
title: DuckDuckGo 搜尋
x-i18n:
    generated_at: "2026-05-06T02:58:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支援 DuckDuckGo 作為**免金鑰**的 `web_search` 提供者。不需要 API
金鑰或帳戶。

<Warning>
  DuckDuckGo 是一項**實驗性、非官方**整合，會從 DuckDuckGo 的非 JavaScript 搜尋頁面擷取結果，而不是使用官方 API。可能會因機器人驗證頁面或 HTML 變更而偶爾失效。
</Warning>

## 設定

不需要 API 金鑰，只要將 DuckDuckGo 設為你的提供者：

<Steps>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Plugin 層級的選用地區與 SafeSearch 設定：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## 工具參數

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number" default="5">
要傳回的結果數量（1-10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 地區代碼（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 等級。
</ParamField>

地區與 SafeSearch 也可以在 Plugin 設定中設定（見上方）；工具參數會依每次查詢覆寫設定值。

## 注意事項

- **不需要 API 金鑰** - 開箱即用，零設定
- **實驗性** - 從 DuckDuckGo 的非 JavaScript HTML 搜尋頁面收集結果，而不是使用官方 API 或 SDK
- **機器人驗證風險** - 在大量或自動化使用時，DuckDuckGo 可能會提供 CAPTCHA 或封鎖請求
- **HTML 解析** - 結果取決於頁面結構，而頁面結構可能會在未通知的情況下變更
- **自動偵測順序** - DuckDuckGo 是第一個免金鑰備援選項（順序 100）。已設定金鑰的 API 支援提供者會先執行，接著是 Ollama Web Search（順序 110），再來是 SearXNG（順序 200）
- **未設定時，SafeSearch 預設為 moderate**

<Tip>
  若用於生產環境，請考慮 [Brave Search](/zh-TW/tools/brave-search)（提供免費層級）或其他 API 支援的提供者。
</Tip>

## 相關內容

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 提供免費層級的結構化結果
- [Exa Search](/zh-TW/tools/exa-search) -- 具備內容擷取的神經搜尋
