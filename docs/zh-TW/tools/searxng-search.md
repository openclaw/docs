---
read_when:
    - 你想要一個自行託管的網路搜尋提供者
    - 您想使用 SearXNG 進行 web_search
    - 你需要注重隱私或網路隔離的搜尋選項
summary: SearXNG 網頁搜尋 -- 自行託管、無需金鑰的元搜尋提供者
title: SearXNG 搜尋
x-i18n:
    generated_at: "2026-04-30T03:47:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支援 [SearXNG](https://docs.searxng.org/) 作為**自託管、
免金鑰**的 `web_search` provider。SearXNG 是一個開放原始碼的中介搜尋引擎，
會彙總 Google、Bing、DuckDuckGo 和其他來源的結果。

優點：

- **免費且不限量** -- 不需要 API 金鑰或商業訂閱
- **隱私 / air-gap** -- 查詢不會離開你的網路
- **可在任何地方運作** -- 不受商業搜尋 API 的區域限制

## 設定

<Steps>
  <Step title="執行 SearXNG 執行個體">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用你有權存取的任何現有 SearXNG 部署。請參閱
    [SearXNG 文件](https://docs.searxng.org/)了解生產環境設定。

  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    或設定環境變數，讓自動偵測找到它：

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 設定檔

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG 執行個體的 Plugin 層級設定：

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` 欄位也接受 SecretRef 物件。

傳輸規則：

- `https://` 可用於公開或私有 SearXNG 主機
- `http://` 只接受用於受信任的私有網路或 loopback 主機
- 公開的 SearXNG 主機必須使用 `https://`

## 環境變數

將 `SEARXNG_BASE_URL` 設為設定檔以外的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

設定 `SEARXNG_BASE_URL` 且未明確設定 provider 時，自動偵測會
自動選擇 SearXNG（優先順序最低 -- 任何有金鑰的 API-backed provider
都會先勝出）。

## Plugin 設定參考

| 欄位         | 說明                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 執行個體的基礎 URL（必填）                            |
| `categories` | 逗號分隔的分類，例如 `general`、`news` 或 `science`                 |
| `language`   | 結果的語言代碼，例如 `en`、`de` 或 `fr`                             |

## 注意事項

- **JSON API** -- 使用 SearXNG 原生的 `format=json` endpoint，而不是 HTML 抓取
- **不需要 API 金鑰** -- 可直接搭配任何 SearXNG 執行個體使用
- **基礎 URL 驗證** -- `baseUrl` 必須是有效的 `http://` 或 `https://`
  URL；公開主機必須使用 `https://`
- **自動偵測順序** -- SearXNG 會在自動偵測中最後檢查（順序 200）。
  已設定金鑰的 API-backed provider 會先執行，接著是
  DuckDuckGo（順序 100），再來是 Ollama Web Search（順序 110）
- **自託管** -- 你可以控制執行個體、查詢和上游搜尋引擎
- **分類** 未設定時預設為 `general`

<Tip>
  若要讓 SearXNG JSON API 運作，請確認你的 SearXNG 執行個體已在
  `settings.yml` 的 `search.formats` 底下啟用 `json` 格式。
</Tip>

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有 provider 和自動偵測
- [DuckDuckGo Search](/zh-TW/tools/duckduckgo-search) -- 另一個免金鑰備援
- [Brave Search](/zh-TW/tools/brave-search) -- 具免費級別的結構化結果
