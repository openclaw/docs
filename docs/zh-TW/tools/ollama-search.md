---
read_when:
    - 你想使用 Ollama 進行 web_search
    - 你想要一個免金鑰的 web_search 提供者
    - 你想使用搭配 OLLAMA_API_KEY 的託管式 Ollama 網頁搜尋
    - 你需要 Ollama 網路搜尋設定指南
summary: 透過本機 Ollama 主機或託管式 Ollama API 進行 Ollama 網頁搜尋
title: Ollama 網頁搜尋
x-i18n:
    generated_at: "2026-04-30T03:47:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw 支援 **Ollama 網頁搜尋** 作為內建的 `web_search` provider。它使用 Ollama 的網頁搜尋 API，並回傳包含標題、URL 和摘要片段的結構化結果。

對於本機或自行託管的 Ollama，此設定預設不需要 API 金鑰。它需要：

- OpenClaw 可連線到的 Ollama 主機
- `ollama signin`

若要直接使用託管搜尋，請將 Ollama provider base URL 設為 `https://ollama.com`，並提供真正的 `OLLAMA_API_KEY`。

## 設定

<Steps>
  <Step title="啟動 Ollama">
    確認 Ollama 已安裝並正在執行。
  </Step>
  <Step title="登入">
    執行：

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="選擇 Ollama 網頁搜尋">
    執行：

    ```bash
    openclaw configure --section web
    ```

    然後選取 **Ollama 網頁搜尋** 作為 provider。

  </Step>
</Steps>

如果你已使用 Ollama 作為模型，Ollama 網頁搜尋會重用相同的已設定主機。

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

可選的 Ollama 主機覆寫：

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

如果你已將 Ollama 設定為模型 provider，網頁搜尋 provider 可以改為重用該主機：

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

Ollama 模型 provider 使用 `baseUrl` 作為標準鍵。為了相容 OpenAI SDK 風格的設定範例，網頁搜尋 provider 也會接受 `models.providers.ollama` 上的 `baseURL`。

如果未明確設定 Ollama base URL，OpenClaw 會使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主機需要 bearer 驗證，OpenClaw 會重用 `models.providers.ollama.apiKey`（或相符的 env 後援 provider 驗證）來向該已設定主機發出請求。

直接託管的 Ollama 網頁搜尋：

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

## 注意事項

- 此 provider 不需要網頁搜尋專用的 API 金鑰欄位。
- 如果 Ollama 主機受驗證保護，OpenClaw 會在存在時重用一般 Ollama provider API 金鑰。
- 如果 `baseUrl` 是 `https://ollama.com`，OpenClaw 會直接呼叫 `https://ollama.com/api/web_search`，並將已設定的 Ollama API 金鑰作為 bearer 驗證傳送。
- 如果已設定的主機未公開網頁搜尋，且已設定 `OLLAMA_API_KEY`，OpenClaw 可以退回使用 `https://ollama.com/api/web_search`，而不會將該 env 金鑰傳送到本機主機。
- 如果 Ollama 無法連線或尚未登入，OpenClaw 會在設定期間警告，但不會阻止選取。
- 當未設定較高優先順序且具認證的 provider 時，執行階段自動偵測可以退回使用 Ollama 網頁搜尋。
- 本機 Ollama daemon 主機使用本機 Proxy 端點 `/api/experimental/web_search`，該端點會簽署並轉送至 Ollama Cloud。
- `https://ollama.com` 主機會直接使用公開託管端點 `/api/web_search`，並搭配 bearer API 金鑰驗證。

## 相關

- [網頁搜尋總覽](/zh-TW/tools/web) -- 所有 provider 與自動偵測
- [Ollama](/zh-TW/providers/ollama) -- Ollama 模型設定與雲端/本機模式
