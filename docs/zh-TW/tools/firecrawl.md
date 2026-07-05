---
read_when:
    - 你想要由 Firecrawl 支援的網頁擷取
    - 您想要免金鑰的 Firecrawl web_fetch
    - 你需要 Firecrawl API 金鑰才能使用搜尋或更高的限制
    - 你想要將 Firecrawl 作為 web_search 提供者
    - 您想要針對 web_fetch 的反機器人擷取
summary: Firecrawl 搜尋、擷取與 `web_fetch` 備援
title: Firecrawl
x-i18n:
    generated_at: "2026-07-05T11:45:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2481548681f05e5e45cc1925ca1a261b60ddb2db430b09706fa85a346bcdc5a0
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以透過三種方式使用 **Firecrawl**：

- 作為 `web_search` 提供者
- 作為明確的外掛工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作為 `web_fetch` 的後備擷取器

它是托管的擷取/搜尋服務，支援機器人規避與快取，有助於處理 JS 密集的網站，或封鎖一般 HTTP 擷取的頁面。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 無金鑰 web_fetch 與 API 金鑰

明確選取的托管 Firecrawl `web_fetch` 後備支援不使用 API 金鑰的入門存取。需要更高額度時，請在閘道環境中加入 `FIRECRAWL_API_KEY`，或進行設定。Firecrawl `web_search` 和 `firecrawl_scrape` 需要 API 金鑰。

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

- 在導覽設定或 `openclaw configure --section web` 中選擇 Firecrawl，會自動啟用已安裝的 Firecrawl 外掛。
- 使用 Firecrawl 的 `web_search` 支援 `query` 和 `count`。
- 若要使用 Firecrawl 專屬控制項，例如 `sources`、`categories` 或結果抓取，請使用 `firecrawl_search`。
- `baseUrl` 預設為位於 `https://api.firecrawl.dev` 的托管 Firecrawl。只有私人/內部端點允許自架覆寫；HTTP 也只接受這些私人目標。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜尋與抓取基底 URL 的共用環境後備。
- Firecrawl 搜尋請求預設逾時為 30 秒；`firecrawl_search` 的 `timeoutSeconds` 參數會針對每次呼叫覆寫它。

## 設定 Firecrawl web_fetch 後備

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

- 明確選取的 Firecrawl `web_fetch` 後備不需要 API 金鑰即可運作。設定後，OpenClaw 會傳送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY` 以取得更高額度。
- 在導覽設定或 `openclaw configure --section web` 中選擇 Firecrawl，會啟用外掛並為 `web_fetch` 選取 Firecrawl，除非已設定其他擷取提供者。
- `firecrawl_scrape` 需要 API 金鑰。
- `maxAgeMs` 控制可使用多舊的快取結果（毫秒）。預設為 172,800,000 毫秒（2 天）。
- `onlyMainContent` 預設為 `true`；`timeoutSeconds` 預設為 60。
- 舊版 `tools.web.fetch.firecrawl.*` 和 `tools.web.search.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。
- Firecrawl 抓取/基底 URL 覆寫遵循與搜尋相同的托管/私人規則：公開托管流量使用 `https://api.firecrawl.dev`；自架覆寫必須解析為私人/內部端點。
- `firecrawl_scrape` 會在將明顯的私人、loopback、中繼資料與非 HTTP(S) 目標 URL 轉送到 Firecrawl 前拒絕它們，與明確 Firecrawl 抓取呼叫的 `web_fetch` 目標安全合約一致。

`firecrawl_scrape` 會重用相同的 `plugins.entries.firecrawl.config.webFetch.*` 設定與環境變數，包括其必要的 API 金鑰。

### 自架 Firecrawl

自行執行 Firecrawl 時，請設定 `plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。OpenClaw 只接受針對 loopback、私人網路、`.local`、`.internal` 或 `.localhost` 目標的 `http://`。公開自訂主機會遭拒絕，以免 Firecrawl API 金鑰意外傳送到任意端點。

## Firecrawl 外掛工具

### `firecrawl_search`

當你想使用 Firecrawl 專屬搜尋控制項，而不是通用 `web_search` 時，請使用此工具。

參數：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

針對 JS 密集或受機器人防護、一般 `web_fetch` 效果不佳的頁面使用此工具。

參數：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隱匿 / 機器人規避

除非呼叫端覆寫這些參數，否則 `firecrawl_scrape` 和 `web_fetch` Firecrawl 後備預設為 `proxy: "auto"` 加上 `storeInCache: true`。`firecrawl_search` 和 `web_search` Firecrawl 提供者沒有 `proxy`/`storeInCache` 控制項；隱匿代理模式只適用於抓取/擷取請求。

Firecrawl 的 `proxy` 模式控制機器人規避（`basic`、`stealth` 或 `auto`）。如果基本嘗試失敗，`auto` 會使用隱匿代理重試，這可能比僅基本抓取使用更多額度。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 擷取順序：

1. Readability（本機）
2. 已設定的擷取提供者，例如 Firecrawl（在選取時，或從已設定的憑證自動偵測到時）
3. 基本 HTML 清理（最後後備）

選取旋鈕是 `tools.web.fetch.provider`。如果省略，OpenClaw 會從可用憑證中自動偵測第一個已就緒的網頁擷取提供者。官方 Firecrawl 外掛提供該後備。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [網頁擷取](/zh-TW/tools/web-fetch) -- 帶有 Firecrawl 後備的 web_fetch 工具
- [Tavily](/zh-TW/tools/tavily) -- 搜尋 + 擷取工具
