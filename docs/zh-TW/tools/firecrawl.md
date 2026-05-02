---
read_when:
    - 您想要由 Firecrawl 支援的網頁擷取
    - 你需要 Firecrawl API 金鑰
    - 你想要將 Firecrawl 作為 web_search 提供者
    - 你想要針對 web_fetch 使用反機器人擷取
summary: Firecrawl 搜尋、擷取與 web_fetch 備援
title: Firecrawl
x-i18n:
    generated_at: "2026-05-02T21:05:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0570fde055cf8028cddf78f1ba19225d10cccd0662f45d063f23a39b4a82a7e0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以透過三種方式使用 **Firecrawl**：

- 作為 `web_search` 提供者
- 作為明確的 Plugin 工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作為 `web_fetch` 的備援擷取器

它是一項託管式擷取/搜尋服務，支援 bot 規避與快取，
有助於處理大量使用 JS 的網站，或封鎖一般 HTTP 擷取的頁面。

## 取得 API 金鑰

1. 建立 Firecrawl 帳號並產生 API 金鑰。
2. 將它儲存在設定中，或在 Gateway 環境中設定 `FIRECRAWL_API_KEY`。

## 設定 Firecrawl 搜尋

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

注意事項：

- 在入門流程或 `openclaw configure --section web` 中選擇 Firecrawl，會自動啟用內建的 Firecrawl Plugin。
- 搭配 Firecrawl 的 `web_search` 支援 `query` 和 `count`。
- 若要使用 Firecrawl 專屬控制項，例如 `sources`、`categories` 或結果爬取，請使用 `firecrawl_search`。
- `baseUrl` 預設為位於 `https://api.firecrawl.dev` 的託管 Firecrawl。只有私有/內部端點才允許自架覆寫；HTTP 也只接受這些私有目標。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜尋與爬取基底 URL 的共用環境備援值。

## 設定 Firecrawl 爬取 + web_fetch 備援

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000,
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

注意事項：

- Firecrawl 備援嘗試只會在 API 金鑰可用時執行（`plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`）。
- `maxAgeMs` 控制可使用多舊的快取結果（毫秒）。預設為 2 天。
- 舊版 `tools.web.fetch.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。
- Firecrawl 爬取/基底 URL 覆寫遵循與搜尋相同的託管/私有規則：公開託管流量使用 `https://api.firecrawl.dev`；自架覆寫必須解析為私有/內部端點。
- `firecrawl_scrape` 會先拒絕明顯的私有、loopback、中繼資料，以及非 HTTP(S) 目標 URL，才會將它們轉送給 Firecrawl，這與明確 Firecrawl 爬取呼叫的 `web_fetch` 目標安全合約一致。

`firecrawl_scrape` 會重複使用相同的 `plugins.entries.firecrawl.config.webFetch.*` 設定與環境變數。

### 自架 Firecrawl

當你自行執行 Firecrawl 時，請設定 `plugins.entries.firecrawl.config.webSearch.baseUrl`、
`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。
OpenClaw 只接受針對 loopback、私有網路、`.local`、`.internal` 或 `.localhost`
目標的 `http://`。公開自訂主機會遭到拒絕，避免 Firecrawl API 金鑰意外傳送到任意端點。

## Firecrawl Plugin 工具

### `firecrawl_search`

當你想使用 Firecrawl 專屬搜尋控制項，而不是通用 `web_search` 時，請使用此工具。

核心參數：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

對於大量使用 JS 或受 bot 保護、而一般 `web_fetch` 效果不佳的頁面，請使用此工具。

核心參數：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隱匿 / bot 規避

Firecrawl 暴露一個 **代理模式** 參數用於 bot 規避（`basic`、`stealth` 或 `auto`）。
OpenClaw 對 Firecrawl 請求一律使用 `proxy: "auto"` 加上 `storeInCache: true`。
如果省略 proxy，Firecrawl 預設為 `auto`。若基本嘗試失敗，`auto` 會使用隱匿代理重試，這可能會比僅使用 basic 的爬取消耗更多點數。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 擷取順序：

1. Readability（本機）
2. Firecrawl（如果已選取，或自動偵測為有效的 web-fetch 備援）
3. 基本 HTML 清理（最後備援）

選擇控制項是 `tools.web.fetch.provider`。如果省略，OpenClaw
會從可用認證中自動偵測第一個就緒的 web-fetch 提供者。
目前內建提供者是 Firecrawl。

## 相關

- [Web Search 概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Fetch](/zh-TW/tools/web-fetch) -- 具備 Firecrawl 備援的 web_fetch 工具
- [Tavily](/zh-TW/tools/tavily) -- 搜尋 + 擷取工具
