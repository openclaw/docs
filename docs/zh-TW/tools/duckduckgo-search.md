---
read_when:
    - 您需要一個不需要 API 金鑰的網路搜尋提供者
    - 你想要使用 DuckDuckGo 進行 web_search
    - 你想要明確選擇的免金鑰搜尋供應商
summary: DuckDuckGo 網頁搜尋 -- 免金鑰提供者（實驗性，基於 HTML）
title: DuckDuckGo 搜尋
x-i18n:
    generated_at: "2026-06-27T20:06:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支援 DuckDuckGo 作為**免金鑰**的 `web_search` 提供者。不需要 API
金鑰或帳號。

<Warning>
  DuckDuckGo 是一個**實驗性、非官方**整合，會從 DuckDuckGo 的非 JavaScript 搜尋頁面
  擷取結果，而不是使用官方 API。請預期偶爾會因機器人挑戰頁面或 HTML 變更而中斷。
</Warning>

## 設定

不需要 API 金鑰 - 只要將 DuckDuckGo 設為你的提供者：

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## 設定檔

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

可選的外掛層級設定，用於區域和 SafeSearch：

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
要傳回的結果數量 (1-10)。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 區域代碼（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 等級。
</ParamField>

區域和 SafeSearch 也可以在外掛設定中設定（見上方）- 工具
參數會依每次查詢覆寫設定值。

## 注意事項

- **不需要 API 金鑰** - 在你選擇 DuckDuckGo 作為 `web_search`
  提供者後即可使用
- **實驗性** - 從 DuckDuckGo 的非 JavaScript HTML
  搜尋頁面收集結果，而不是官方 API 或 SDK
- **機器人挑戰風險** - DuckDuckGo 在大量或自動化使用時，可能會提供 CAPTCHA 或封鎖請求
- **HTML 解析** - 結果取決於頁面結構，而頁面結構可能會在沒有
  通知的情況下變更
- **明確選擇** - 未設定 API 支援的提供者時，OpenClaw 不會自動選擇 DuckDuckGo
- **SafeSearch 未設定時預設為 moderate**

<Tip>
  若要用於正式環境，請考慮 [Brave Search](/zh-TW/tools/brave-search)（提供免費方案）
  或其他 API 支援的提供者。
</Tip>

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者和自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 提供免費方案的結構化結果
- [Exa Search](/zh-TW/tools/exa-search) -- 具備內容擷取的神經搜尋
