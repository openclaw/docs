---
read_when:
    - 你想要由 Firecrawl 支援的網頁擷取
    - 你需要 Firecrawl API 金鑰
    - 你想要使用 Firecrawl 作為 web_search 提供者
    - 你想要為 web_fetch 提供反機器人擷取功能
summary: Firecrawl 搜尋、抓取和 web_fetch 備援
title: Firecrawl
x-i18n:
    generated_at: "2026-04-30T03:45:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cd7a56c3a5c7d7876daddeef9acdbe25272404916250bdf40d1d7ad31388f19
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以透過三種方式使用 **Firecrawl**：

- 作為 `web_search` 供應商
- 作為明確的 Plugin 工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作為 `web_fetch` 的備用擷取器

它是一項託管式擷取/搜尋服務，支援機器人規避和快取，
這有助於處理大量使用 JS 的網站，或會封鎖一般 HTTP 擷取的頁面。

## 取得 API 金鑰

1. 建立 Firecrawl 帳戶並產生 API 金鑰。
2. 將它儲存在設定中，或在 gateway 環境中設定 `FIRECRAWL_API_KEY`。

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

注意：

- 在入門流程或 `openclaw configure --section web` 中選擇 Firecrawl，會自動啟用內建的 Firecrawl Plugin。
- 使用 Firecrawl 的 `web_search` 支援 `query` 和 `count`。
- 如需 Firecrawl 專屬控制項，例如 `sources`、`categories` 或結果爬取，請使用 `firecrawl_search`。
- `baseUrl` 覆寫必須維持在 `https://api.firecrawl.dev`。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜尋和爬取基底 URL 的共用環境備用值。

## 設定 Firecrawl 爬取 + web_fetch 備用

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

注意：

- Firecrawl 備用嘗試只會在 API 金鑰可用時執行（`plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`）。
- `maxAgeMs` 控制快取結果可有多舊（毫秒）。預設為 2 天。
- 舊版 `tools.web.fetch.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。
- Firecrawl 爬取/基底 URL 覆寫僅限於 `https://api.firecrawl.dev`。

`firecrawl_scrape` 會重複使用相同的 `plugins.entries.firecrawl.config.webFetch.*` 設定和環境變數。

## Firecrawl Plugin 工具

### `firecrawl_search`

當你想使用 Firecrawl 專屬搜尋控制項，而不是通用的 `web_search` 時使用此工具。

核心參數：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

在大量使用 JS 或受機器人保護、一般 `web_fetch` 表現不足的頁面上使用此工具。

核心參數：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隱身 / 機器人規避

Firecrawl 會公開用於機器人規避的 **proxy 模式**參數（`basic`、`stealth` 或 `auto`）。
OpenClaw 對 Firecrawl 請求一律使用 `proxy: "auto"` 加上 `storeInCache: true`。
如果省略 proxy，Firecrawl 預設為 `auto`。如果基本嘗試失敗，`auto` 會以隱身 proxy 重試，這可能會比僅限 basic 的爬取使用更多額度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 擷取順序：

1. Readability（本機）
2. Firecrawl（如果已選取，或自動偵測為作用中的網頁擷取備用方案）
3. 基本 HTML 清理（最後備用）

選擇旋鈕是 `tools.web.fetch.provider`。如果省略它，OpenClaw
會從可用憑證中自動偵測第一個就緒的網頁擷取供應商。
目前內建供應商是 Firecrawl。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有供應商和自動偵測
- [網頁擷取](/zh-TW/tools/web-fetch) -- 具有 Firecrawl 備用方案的 web_fetch 工具
- [Tavily](/zh-TW/tools/tavily) -- 搜尋 + 擷取工具
