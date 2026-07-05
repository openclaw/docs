---
read_when:
    - 你想要自架式網頁搜尋提供者
    - 您想要使用 SearXNG 進行 web_search
    - 你需要注重隱私或離線隔離的搜尋選項
summary: SearXNG 網頁搜尋 -- 自行託管、免金鑰的元搜尋提供者
title: SearXNG 搜尋
x-i18n:
    generated_at: "2026-07-05T11:47:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw 支援 [SearXNG](https://docs.searxng.org/) 作為**自託管、
免金鑰**的 `web_search` 提供者。SearXNG 是一個開放原始碼的中介搜尋引擎，
會彙整來自 Google、Bing、DuckDuckGo 和其他來源的結果。

優點：

- **免費且無限制** -- 不需要 API 金鑰或商業訂閱
- **隱私 / 氣隙環境** -- 查詢永遠不會離開你的網路
- **隨處可用** -- 不受商業搜尋 API 的區域限制

## 設定

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="執行 SearXNG 執行個體">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用任何你可以存取的現有 SearXNG 部署。請參閱
    [SearXNG 文件](https://docs.searxng.org/) 了解正式環境設定。

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

`baseUrl` 也接受 SecretRef 物件（例如 `{ source: "env", id: "SEARXNG_BASE_URL" }`）。

## 環境變數

將 `SEARXNG_BASE_URL` 設為設定的替代方式：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

解析順序：已設定的 `baseUrl` 字串，接著是 `baseUrl` 上的行內 env SecretRef，
再來是 `SEARXNG_BASE_URL`。當沒有設定任何設定路徑，且
`SEARXNG_BASE_URL` 存在但未明確選擇提供者時，自動偵測會選取 SearXNG。

## 外掛設定參考

| 欄位         | 說明                                                        |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | 你的 SearXNG 執行個體的基底 URL（必填）                       |
| `categories` | 逗號分隔的分類，例如 `general`、`news` 或 `science` |
| `language`   | 結果的語言代碼，例如 `en`、`de` 或 `fr`              |

`web_search` 工具呼叫也接受 `count`（1-10 筆結果）、`categories`
和 `language` 作為每次呼叫的覆寫項目。

## 注意事項

- **JSON API** -- 使用 SearXNG 原生的 `format=json` 端點，而不是 HTML 擷取
- **圖片結果 URL** -- 當 SearXNG 回傳直接圖片 URL 時，圖片分類結果會包含 `img_src`
- **無 API 金鑰** -- 可直接搭配任何 SearXNG 執行個體使用
- **基底 URL 驗證** -- `baseUrl` 必須是有效的 `http://` 或 `https://`
  URL
- **網路防護** -- `http://` 基底 URL 必須指向受信任的私有或
  local loopback 主機（公開主機必須使用 `https://`）；解析到私有/內部位址的 `https://` 基底 URL
  會獲得相同的自託管允許，而解析到公開位址的 `https://` 基底 URL 則保留嚴格的 SSRF 保護
- **自動偵測順序** -- SearXNG 需要已設定的 `baseUrl`（在已具備所需憑證的提供者中排序
  為 200）。DuckDuckGo 或 Ollama Web Search 等免金鑰提供者永遠不會隱含贏得自動偵測；
  它們只會在明確選擇 `provider` 時啟用
- **自託管** -- 你控制執行個體、查詢和上游搜尋引擎
- **分類** 未設定時預設為 `general`
- **分類備援** -- 如果非 `general` 分類請求成功但
  回傳零筆結果，OpenClaw 會用 `general`
  對同一個查詢重試一次，然後才回傳空結果集
- **結果快取** -- 相同查詢（相同查詢、計數、分類、
  語言和基底 URL）會在程序內以短 TTL 快取
- **版本需求** -- 外掛宣告 `minHostVersion: >=2026.6.9`

<Tip>
  若要讓 SearXNG JSON API 運作，請確認你的 SearXNG 執行個體已在 `settings.yml` 的
  `search.formats` 下啟用 `json` 格式。
</Tip>

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [DuckDuckGo Search](/zh-TW/tools/duckduckgo-search) -- 另一個免金鑰提供者
- [Brave Search](/zh-TW/tools/brave-search) -- 提供免費方案的結構化結果
