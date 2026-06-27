---
read_when:
    - 你想要自託管的網頁搜尋提供者
    - 你想要使用 SearXNG 進行 web_search
    - 你需要注重隱私或隔離網路的搜尋選項
summary: SearXNG 網頁搜尋 -- 自行託管、免金鑰的元搜尋提供者
title: SearXNG 搜尋
x-i18n:
    generated_at: "2026-06-27T20:09:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支援 [SearXNG](https://docs.searxng.org/) 作為**自架、
免金鑰**的 `web_search` 提供者。SearXNG 是一個開源的中繼搜尋引擎，
會彙整來自 Google、Bing、DuckDuckGo 與其他來源的結果。

優點：

- **免費且不限量** -- 不需要 API 金鑰或商業訂閱
- **隱私 / 空氣隔離** -- 查詢永遠不會離開你的網路
- **可在任何地方運作** -- 不受商業搜尋 API 的地區限制

## 設定

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Run a SearXNG instance">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用任何你有權存取的既有 SearXNG 部署。請參閱
    [SearXNG 文件](https://docs.searxng.org/)以了解正式環境設定。

  </Step>
  <Step title="Configure">
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

## 設定

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

SearXNG 執行個體的外掛層級設定：

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

- `https://` 可用於公開或私人 SearXNG 主機
- `http://` 只接受可信任的私人網路或迴路主機
- 公開 SearXNG 主機必須使用 `https://`
- 私人/內部主機會使用自架網路防護；公開 `https://`
  主機會留在嚴格的網頁搜尋防護上，且不能重新導向到私人
  位址

## 環境變數

設定 `SEARXNG_BASE_URL` 作為設定的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

當設定了 `SEARXNG_BASE_URL` 且未設定明確提供者時，自動偵測
會自動選用 SearXNG（優先順序最低 -- 任何有
金鑰的 API 後端提供者都會先勝出）。

## 外掛設定參考

| 欄位         | 說明                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 執行個體基底 URL（必填）                              |
| `categories` | 逗號分隔的分類，例如 `general`、`news` 或 `science`                |
| `language`   | 結果的語言代碼，例如 `en`、`de` 或 `fr`                            |

## 注意事項

- **JSON API** -- 使用 SearXNG 原生的 `format=json` 端點，而不是 HTML 擷取
- **圖片結果 URL** -- 當 SearXNG 回傳直接圖片 URL 時，圖片分類結果會包含 `img_src`
- **不需要 API 金鑰** -- 可與任何 SearXNG 執行個體直接搭配使用
- **基底 URL 驗證** -- `baseUrl` 必須是有效的 `http://` 或 `https://`
  URL；公開主機必須使用 `https://`
- **網路防護** -- 私人/內部 SearXNG 端點會選擇加入
  私人網路存取；公開 `https://` SearXNG 端點會保留嚴格的 SSRF
  保護
- **自動偵測順序** -- SearXNG 會在已設定金鑰的 API 後端提供者
  之後檢查（順序 200）。像 DuckDuckGo 或
  Ollama Web Search 這類免金鑰提供者，不會在未明確選擇提供者時自動選用
- **自架** -- 你控制執行個體、查詢與上游搜尋引擎
- **分類** 未設定時預設為 `general`
- **分類後援** -- 如果非 `general` 分類請求成功但
  回傳零筆結果，OpenClaw 會在回傳空結果集前，用 `general`
  對相同查詢重試一次

<Tip>
  若要讓 SearXNG JSON API 運作，請確認你的 SearXNG 執行個體已在
  `settings.yml` 的 `search.formats` 下啟用 `json`
  格式。
</Tip>

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [DuckDuckGo Search](/zh-TW/tools/duckduckgo-search) -- 另一個免金鑰提供者
- [Brave Search](/zh-TW/tools/brave-search) -- 具有免費級別的結構化結果
