---
read_when:
    - 你想要將 Ollama 用於 web_search
    - 你想要無需金鑰的 `web_search` 提供者
    - 你想使用透過 OLLAMA_API_KEY 驗證的 Ollama 託管式網頁搜尋
    - 你需要 Ollama 網頁搜尋的設定指南
summary: 透過本機 Ollama 主機或託管的 Ollama API 使用 Ollama 網頁搜尋
title: Ollama 網頁搜尋
x-i18n:
    generated_at: "2026-07-11T21:51:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw 支援將 **Ollama 網頁搜尋** 作為內建的 `web_search` 提供者，從 Ollama 的網頁搜尋 API 傳回標題、URL 與摘要片段。

本機／自行託管的 Ollama 預設不需要 API 金鑰；只需可連線的 Ollama 主機並執行 `ollama signin`。直接使用託管搜尋（不使用本機 Ollama）則需要設定 `baseUrl: "https://ollama.com"`，以及有效的 `OLLAMA_API_KEY`。

## 設定

<Steps>
  <Step title="啟動 Ollama">
    請確定已安裝 Ollama 且正在執行。
  </Step>
  <Step title="登入">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="選擇 Ollama 網頁搜尋">
    ```bash
    openclaw configure --section web
    ```

    選擇 **Ollama 網頁搜尋** 作為提供者。

  </Step>
</Steps>

如果您已使用 Ollama 執行模型，Ollama 網頁搜尋會重複使用相同的已設定主機。

<Note>
  OpenClaw 絕不會優先於較高優先順序且已設定憑證的提供者，自動選擇 Ollama 網頁搜尋；您必須透過 `tools.web.search.provider: "ollama"` 明確選擇它。
</Note>

## 設定檔

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

可選用僅適用於網頁搜尋的主機覆寫設定：

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

或者重複使用已為 Ollama 模型提供者設定的主機：

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

`models.providers.ollama.baseUrl` 是標準鍵；為了與 OpenAI SDK 風格的設定範例相容，網頁搜尋提供者也接受該處的 `baseURL`。若未設定任何值，OpenClaw 預設使用 `http://127.0.0.1:11434`。

直接使用託管的 Ollama 網頁搜尋（不使用本機 Ollama）：

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

- 不存在網頁搜尋專用的 API 金鑰欄位；設定的主機受驗證保護時，提供者會重複使用 `models.providers.ollama.apiKey`（或相符且由環境變數支援的提供者驗證）。
- 主機解析順序：`plugins.entries.ollama.config.webSearch.baseUrl` → `models.providers.ollama.baseUrl`（或 `baseURL`）→ `http://127.0.0.1:11434`。
- 如果解析出的主機是 `https://ollama.com`，OpenClaw 會直接呼叫 `https://ollama.com/api/web_search`，並使用 API 金鑰進行 Bearer 驗證。
- 否則，OpenClaw 會先呼叫本機代理端點 `/api/experimental/web_search`（此端點會簽署請求並轉送至 Ollama Cloud），然後退回使用同一主機上的 `/api/web_search`。如果兩者皆失敗且已設定 `OLLAMA_API_KEY`，則會使用該金鑰對 `https://ollama.com/api/web_search` 重試一次，而不會將金鑰傳送至本機主機。
- 如果無法連線至 Ollama 或尚未登入，OpenClaw 會在設定期間發出警告，但不會阻止選擇該提供者。

## 相關內容

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Ollama](/zh-TW/providers/ollama) -- Ollama 模型設定與雲端／本機模式
