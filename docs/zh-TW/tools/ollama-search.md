---
read_when:
    - 你想要使用 Ollama 進行 web_search
    - 你需要一個免金鑰的 web_search 提供者
    - 你想搭配 OLLAMA_API_KEY 使用託管式 Ollama Web Search
    - 你需要 Ollama Web Search 設定指南
summary: 透過本機 Ollama 主機或託管式 Ollama API 使用 Ollama 網頁搜尋
title: Ollama 網路搜尋
x-i18n:
    generated_at: "2026-07-05T11:51:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw 支援 **Ollama Web Search** 作為內建的 `web_search` 提供者，
會從 Ollama 的網頁搜尋 API 傳回標題、URL 和摘要片段。

本機/自架 Ollama 預設不需要 API 金鑰；它需要可連線的
Ollama 主機加上 `ollama signin`。直接託管搜尋（沒有本機 Ollama）需要
`baseUrl: "https://ollama.com"` 和真正的 `OLLAMA_API_KEY`。

## 設定

<Steps>
  <Step title="啟動 Ollama">
    確認 Ollama 已安裝並正在執行。
  </Step>
  <Step title="登入">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="選擇 Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    選取 **Ollama Web Search** 作為提供者。

  </Step>
</Steps>

如果你已經使用 Ollama 作為模型，Ollama Web Search 會重用相同的
已設定主機。

<Note>
  OpenClaw 絕不會自動選擇 Ollama Web Search 來取代優先順序更高的
  有憑證提供者；你必須使用
  `tools.web.search.provider: "ollama"` 明確選擇它。
</Note>

## 組態

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

可選的主機覆寫，僅限網頁搜尋範圍：

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

或重用已為 Ollama 模型提供者設定的主機：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

`models.providers.ollama.baseUrl` 是標準鍵；網頁搜尋
提供者也接受該處的 `baseURL`，以相容 OpenAI SDK 風格的
組態範例。如果未設定任何項目，OpenClaw 預設為
`http://127.0.0.1:11434`。

直接託管的 Ollama Web Search（沒有本機 Ollama）：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## 驗證與請求路由

- 沒有網頁搜尋專用的 API 金鑰欄位；當設定的主機受驗證保護時，提供者會重用
  `models.providers.ollama.apiKey`（或相符的環境變數支援提供者驗證）。
- 主機解析順序：`plugins.entries.ollama.config.webSearch.baseUrl` →
  `models.providers.ollama.baseUrl`（或 `baseURL`）→ `http://127.0.0.1:11434`。
- 如果解析後的主機是 `https://ollama.com`，OpenClaw 會直接呼叫
  `https://ollama.com/api/web_search`，並使用 API 金鑰作為 Bearer
  驗證。
- 否則，OpenClaw 會先呼叫本機代理端點
  `/api/experimental/web_search`（它會簽署並轉送到 Ollama
  Cloud），然後在同一主機上退回到 `/api/web_search`。如果兩者都失敗
  且已設定 `OLLAMA_API_KEY`，它會使用該金鑰對
  `https://ollama.com/api/web_search` 重試一次，但不會將金鑰傳送到
  本機主機。
- 如果 Ollama 無法連線或尚未登入，OpenClaw 會在設定期間提出警告，但
  不會阻止你選取該提供者。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Ollama](/zh-TW/providers/ollama) -- Ollama 模型設定與雲端/本機模式
