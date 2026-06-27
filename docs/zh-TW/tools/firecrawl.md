---
read_when:
    - 你想要由 Firecrawl 支援的網頁擷取
    - 你想要無金鑰的 Firecrawl web_fetch
    - 你需要 Firecrawl API 金鑰才能搜尋或取得更高限制
    - 你想要將 Firecrawl 作為 web_search 提供者
    - 你希望為 web_fetch 加入反機器人擷取功能
summary: Firecrawl 搜尋、擷取與 web_fetch 後援
title: Firecrawl
x-i18n:
    generated_at: "2026-06-27T20:07:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8f6ef7ea3711e8e3e55d6eec4a99397dec4efc548c7192924fdd5850cb270bf
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以透過三種方式使用 **Firecrawl**：

- 作為 `web_search` 提供者
- 作為明確的外掛工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作為 `web_fetch` 的備援擷取器

它是一項託管的擷取/搜尋服務，支援規避機器人防護與快取，
有助於處理大量使用 JS 的網站，或是會封鎖一般 HTTP 擷取的頁面。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 無金鑰 web_fetch 與 API 金鑰

明確選取的託管 Firecrawl `web_fetch` 備援支援不使用 API 金鑰的入門
存取。當你需要更高限制時，請在閘道環境中加入 `FIRECRAWL_API_KEY`
或進行設定。Firecrawl `web_search` 和
`firecrawl_scrape` 需要 API 金鑰。

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

- 在入門設定中選擇 Firecrawl，或執行 `openclaw configure --section web`，會自動啟用已安裝的 Firecrawl 外掛。
- 使用 Firecrawl 的 `web_search` 支援 `query` 和 `count`。
- 若要使用 Firecrawl 專屬控制項，例如 `sources`、`categories` 或結果爬取，請使用 `firecrawl_search`。
- `baseUrl` 預設為託管 Firecrawl 的 `https://api.firecrawl.dev`。只有私人/內部端點允許自架覆寫；HTTP 只接受用於那些私人目標。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜尋與爬取基底 URL 的共用環境備援。

## 設定 Firecrawl web_fetch 備援

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // explicit selection enables keyless fallback
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
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

- 明確選取的 Firecrawl `web_fetch` 備援可以在沒有 API 金鑰的情況下運作。設定後，OpenClaw 會傳送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY` 以取得更高限制。
- 在入門設定期間選擇 Firecrawl，或執行 `openclaw configure --section web`，會啟用外掛並為 `web_fetch` 選取 Firecrawl，除非已設定另一個擷取提供者。
- `firecrawl_scrape` 需要 API 金鑰。
- `maxAgeMs` 控制可接受的快取結果最舊時間（毫秒）。預設為 2 天。
- 舊版 `tools.web.fetch.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。
- Firecrawl 爬取/基底 URL 覆寫遵循與搜尋相同的託管/私人規則：公開託管流量使用 `https://api.firecrawl.dev`；自架覆寫必須解析為私人/內部端點。
- `firecrawl_scrape` 會在將目標 URL 轉送給 Firecrawl 前，拒絕明顯的私人、loopback、中繼資料，以及非 HTTP(S) 目標 URL，這與明確 Firecrawl 爬取呼叫的 `web_fetch` 目標安全合約一致。

`firecrawl_scrape` 會重用相同的 `plugins.entries.firecrawl.config.webFetch.*` 設定與環境變數，包括其必要的 API 金鑰。

### 自架 Firecrawl

當你自行執行 Firecrawl 時，請設定 `plugins.entries.firecrawl.config.webSearch.baseUrl`、
`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。
OpenClaw 只對 loopback、私人網路、`.local`、`.internal` 或 `.localhost`
目標接受 `http://`。公開自訂主機會被拒絕，以免 Firecrawl API 金鑰意外傳送到任意端點。

## Firecrawl 外掛工具

### `firecrawl_search`

當你想使用 Firecrawl 專屬搜尋控制項，而不是通用 `web_search` 時，請使用這個工具。

核心參數：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

對於大量使用 JS 或受到機器人防護保護、一般 `web_fetch` 效果較弱的頁面，請使用這個工具。

核心參數：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隱匿 / 規避機器人防護

Firecrawl 提供一個用於規避機器人防護的 **proxy mode** 參數（`basic`、`stealth` 或 `auto`）。
OpenClaw 對 Firecrawl 請求一律使用 `proxy: "auto"` 加上 `storeInCache: true`。
如果省略 proxy，Firecrawl 預設為 `auto`。如果基本嘗試失敗，`auto` 會使用隱匿代理重試，這可能會比僅使用 basic 的爬取消耗更多點數。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 擷取順序：

1. Readability（本機）
2. Firecrawl（已選取時，或從已設定憑證自動偵測時）
3. 基本 HTML 清理（最後備援）

選擇旋鈕是 `tools.web.fetch.provider`。如果省略它，OpenClaw
會從可用憑證中自動偵測第一個就緒的 web-fetch 提供者。
官方 Firecrawl 外掛提供該備援。

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Fetch](/zh-TW/tools/web-fetch) -- 具有 Firecrawl 備援的 web_fetch 工具
- [Tavily](/zh-TW/tools/tavily) -- 搜尋 + 擷取工具
