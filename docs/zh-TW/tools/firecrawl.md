---
read_when:
    - 你想要使用 Firecrawl 支援的網頁擷取功能
    - 你想要免金鑰的 Firecrawl `web_fetch`
    - 你需要 Firecrawl API 金鑰才能使用搜尋功能或獲得更高的使用上限
    - 你想要將 Firecrawl 用作 `web_search` 提供者
    - 你希望 `web_fetch` 具備反機器人擷取功能
summary: Firecrawl 搜尋、擷取與 web_fetch 備援機制
title: Firecrawl
x-i18n:
    generated_at: "2026-07-11T21:54:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以透過三種方式使用 **Firecrawl**：

- 作為 `web_search` 提供者
- 作為明確的外掛工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作為 `web_fetch` 的備援擷取器

這是一項託管式擷取／搜尋服務，支援規避機器人防護與快取，有助於處理大量依賴 JS 的網站，或封鎖一般 HTTP 擷取的頁面。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 無金鑰 web_fetch 與 API 金鑰

明確選取的託管 Firecrawl `web_fetch` 備援功能支援無須 API 金鑰的入門存取。需要更高限額時，請在閘道環境中加入 `FIRECRAWL_API_KEY`，或進行相關設定。Firecrawl `web_search` 和 `firecrawl_scrape` 需要 API 金鑰。

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

- 在新手引導或 `openclaw configure --section web` 中選擇 Firecrawl，會自動啟用已安裝的 Firecrawl 外掛。
- 搭配 Firecrawl 的 `web_search` 支援 `query` 和 `count`。
- 若要使用 Firecrawl 特有的控制項，例如 `sources`、`categories` 或結果擷取，請使用 `firecrawl_search`。
- `baseUrl` 預設為位於 `https://api.firecrawl.dev` 的託管 Firecrawl。僅允許針對私有／內部端點進行自架覆寫；只有這些私有目標可以使用 HTTP。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜尋與擷取基底 URL 共用的環境變數備援值。
- Firecrawl 搜尋請求的預設逾時時間為 30 秒；`firecrawl_search` 的 `timeoutSeconds` 參數可針對每次呼叫覆寫此設定。

## 設定 Firecrawl web_fetch 備援

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 明確選取會啟用無金鑰備援
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

- 明確選取的 Firecrawl `web_fetch` 備援功能無須 API 金鑰即可運作。設定後，OpenClaw 會傳送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`，以取得更高限額。
- 在新手引導期間或透過 `openclaw configure --section web` 選擇 Firecrawl，會啟用該外掛，並為 `web_fetch` 選取 Firecrawl，除非已設定其他擷取提供者。
- `firecrawl_scrape` 需要 API 金鑰。
- `maxAgeMs` 控制快取結果可以保留多久（毫秒）。預設值為 172,800,000 毫秒（2 天）。
- `onlyMainContent` 預設為 `true`；`timeoutSeconds` 預設為 60。
- 舊版 `tools.web.fetch.firecrawl.*` 和 `tools.web.search.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。
- Firecrawl 擷取／基底 URL 覆寫遵循與搜尋相同的託管／私有規則：公開託管流量使用 `https://api.firecrawl.dev`；自架覆寫必須解析至私有／內部端點。
- `firecrawl_scrape` 會先拒絕明顯的私有、local loopback、中繼資料及非 HTTP(S) 目標 URL，再將其轉送至 Firecrawl；這與明確 Firecrawl 擷取呼叫所遵循的 `web_fetch` 目標安全契約一致。

`firecrawl_scrape` 會重複使用相同的 `plugins.entries.firecrawl.config.webFetch.*` 設定與環境變數，包括其必要的 API 金鑰。

### 自架 Firecrawl

自行執行 Firecrawl 時，請設定 `plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。OpenClaw 僅針對 local loopback、私人網路、`.local`、`.internal` 或 `.localhost` 目標接受 `http://`。系統會拒絕公開的自訂主機，以免意外將 Firecrawl API 金鑰傳送至任意端點。

## Firecrawl 外掛工具

### `firecrawl_search`

想使用 Firecrawl 特有的搜尋控制項，而非通用的 `web_search` 時，請使用此工具。

參數：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

對於大量依賴 JS 或受機器人防護的頁面，如果一般 `web_fetch` 效果不佳，請使用此工具。

參數：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隱匿／規避機器人防護

除非呼叫端覆寫相關參數，否則 `firecrawl_scrape` 和 `web_fetch` 的 Firecrawl 備援功能預設使用 `proxy: "auto"` 加上 `storeInCache: true`。`firecrawl_search` 和 Firecrawl `web_search` 提供者沒有 `proxy`／`storeInCache` 控制項；隱匿代理模式僅適用於擷取／抓取請求。

Firecrawl 的 `proxy` 模式控制機器人防護規避方式（`basic`、`stealth` 或 `auto`）。若基本嘗試失敗，`auto` 會使用隱匿代理重試，因此可能比僅使用基本擷取消耗更多點數。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 擷取順序：

1. Readability（本機）
2. 已設定的擷取提供者，例如 Firecrawl（已選取時，或根據已設定的憑證自動偵測）
3. 基本 HTML 清理（最後的備援）

選取控制項是 `tools.web.fetch.provider`。若省略此設定，OpenClaw 會根據可用憑證，自動偵測第一個已就緒的網頁擷取提供者。官方 Firecrawl 外掛會提供該備援功能。

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [網頁擷取](/zh-TW/tools/web-fetch) -- 具備 Firecrawl 備援的 `web_fetch` 工具
- [Tavily](/zh-TW/tools/tavily) -- 搜尋與擷取工具
