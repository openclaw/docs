---
read_when:
    - 你想要一個不需要 API 金鑰的網頁搜尋供應商
    - 你想要使用 DuckDuckGo 進行 web_search
    - 你想要明確選擇一個不需要金鑰的搜尋提供者
summary: DuckDuckGo 網頁搜尋 -- 無需金鑰的提供者（實驗性，基於 HTML）
title: DuckDuckGo 搜尋
x-i18n:
    generated_at: "2026-07-11T21:53:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw 支援 DuckDuckGo 作為**免金鑰**的 `web_search` 提供者。不需要 API 金鑰或帳號。

<Warning>
  DuckDuckGo 是一項**實驗性、非官方**的整合，透過擷取 DuckDuckGo 的非 JavaScript HTML 搜尋頁面運作，而非使用官方 API。機器人驗證頁面或 HTML 變更可能偶爾導致功能中斷。
</Warning>

## 設定

DuckDuckGo 絕不會被自動選取，因為自動偵測只會考慮具備可用憑證的提供者。請明確設定：

<Steps>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # 選取 "duckduckgo" 作為提供者
    ```
  </Step>
</Steps>

## 組態

直接在組態中設定提供者：

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

可選的外掛層級區域與 SafeSearch 設定：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo 區域代碼
            safeSearch: "moderate", // "strict"、"moderate" 或 "off"
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
DuckDuckGo 區域代碼（例如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch 層級。
</ParamField>

`region` 和 `safeSearch` 工具參數會針對每次查詢覆寫上述外掛組態值。

## 注意事項

- **不需要 API 金鑰**——選取 DuckDuckGo 作為 `web_search` 提供者後即可使用。
- **實驗性**——擷取 DuckDuckGo 的非 JavaScript HTML 搜尋頁面，而非使用官方 API 或 SDK。結果取決於頁面結構，而頁面結構可能隨時變更，恕不另行通知。
- **機器人驗證風險**——在大量或自動化使用時，DuckDuckGo 可能會顯示 CAPTCHA 或封鎖請求。
- **僅限明確選取**——OpenClaw 的自動偵測只會考慮具備可用憑證的提供者，因此不會自動選取像 DuckDuckGo 這類免金鑰的提供者；你必須設定 `provider: "duckduckgo"`。
- **未設定時，SafeSearch 預設為 `moderate`**。

<Tip>
  若用於正式環境，請考慮使用 [Brave Search](/zh-TW/tools/brave-search)（提供免費方案）或其他由 API 支援的提供者。
</Tip>

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web)——所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search)——提供免費方案的結構化結果
- [Exa Search](/zh-TW/tools/exa-search)——具備內容擷取功能的神經搜尋
