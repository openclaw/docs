---
read_when:
    - 你想要使用 Firecrawl 支援的網頁擷取功能
    - 你想要無需金鑰的 Firecrawl Search（免費）或無需金鑰的 web_fetch
    - 你需要 Firecrawl API 金鑰才能使用搜尋功能或取得更高的使用限制
    - 你想要將 Firecrawl 作為 web_search 提供者
    - 你想要為 `web_fetch` 啟用反機器人擷取功能
summary: Firecrawl 搜尋、擷取與 web_fetch 備援方案
title: Firecrawl
x-i18n:
    generated_at: "2026-07-14T14:04:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 98b8af0839b1759e3be9393879a6d9a92fa0c505bf475bafd73c3f32d20fa106
    source_path: tools/firecrawl.md
    workflow: 16
---

OpenClaw 可以透過三種方式使用 **Firecrawl**：

- 作為 `web_search` 提供者
- 作為明確指定的外掛工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作為 `web_fetch` 的備援擷取器

這是一項託管式擷取與搜尋服務，支援規避機器人防護及快取，有助於處理大量使用 JS 的網站，或阻擋一般 HTTP 擷取的頁面。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/firecrawl-plugin
openclaw gateway restart
```

## 無金鑰存取與 API 金鑰

Firecrawl 會註冊兩個 `web_search` 提供者：

- **Firecrawl 搜尋**（`firecrawl`）— 使用託管的 `/v2/search` API 與你的
  金鑰；存在金鑰時會自動偵測。
- **Firecrawl 搜尋（免費）**（`firecrawl-free`）— 使用託管的無金鑰入門
  方案，不需要 API 金鑰。它**只能選擇啟用**，且永遠不會自動選取，因為
  選取後會將你的搜尋查詢傳送至 Firecrawl 的免費方案。

明確選取的 Firecrawl `web_fetch` 備援也不需要金鑰。明確使用
`firecrawl_search` 和 `firecrawl_scrape` 工具則需要 API 金鑰。請在
閘道環境中加入 `FIRECRAWL_API_KEY`，或設定此項以取得較高限制。

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

- 在初始設定或 `openclaw configure --section web` 中選擇 Firecrawl，會自動啟用已安裝的 Firecrawl 外掛。
- 在初始設定中選擇 **Firecrawl 搜尋（免費）**（或設定 `provider: "firecrawl-free"`），即可在沒有 API 金鑰的情況下以無金鑰模式執行。使用金鑰的 **Firecrawl 搜尋**提供者會傳送 `plugins.entries.firecrawl.config.webSearch.apiKey` 或 `FIRECRAWL_API_KEY`。
- 搭配 Firecrawl 使用 `web_search` 時，支援 `query` 和 `count`。
- 若要使用 Firecrawl 專屬控制項，例如 `sources`、`categories` 或結果抓取，請使用 `firecrawl_search`。
- `baseUrl` 預設使用位於 `https://api.firecrawl.dev` 的託管 Firecrawl。僅允許對私有／內部端點使用自架覆寫；只有這些私有目標可接受 HTTP。
- `FIRECRAWL_BASE_URL` 是 Firecrawl 搜尋與抓取基底 URL 共用的環境變數備援。
- Firecrawl 搜尋請求的預設逾時為 30 秒；`firecrawl_search` 的 `timeoutSeconds` 參數可在每次呼叫時覆寫此值。

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

- 明確選取的 Firecrawl `web_fetch` 備援不需要 API 金鑰即可運作。完成設定後，OpenClaw 會傳送 `plugins.entries.firecrawl.config.webFetch.apiKey` 或 `FIRECRAWL_API_KEY`，以取得較高限制。
- 在初始設定或 `openclaw configure --section web` 中選擇 Firecrawl，會啟用此外掛並選取 Firecrawl 作為 `web_fetch`，除非已設定其他擷取提供者。
- `firecrawl_scrape` 需要 API 金鑰。
- `maxAgeMs` 控制快取結果可保留多久（毫秒）。預設為 172,800,000 毫秒（2 天）。
- `onlyMainContent` 預設為 `true`；`timeoutSeconds` 預設為 60。
- 舊版 `tools.web.fetch.firecrawl.*` 和 `tools.web.search.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。
- Firecrawl 抓取／基底 URL 覆寫遵循與搜尋相同的託管／私有規則：公開託管流量使用 `https://api.firecrawl.dev`；自架覆寫必須解析至私有／內部端點。
- `firecrawl_scrape` 會在將目標 URL 轉送至 Firecrawl 前，拒絕明顯的私有、回送、中繼資料及非 HTTP(S) 目標 URL，與明確 Firecrawl 抓取呼叫的 `web_fetch` 目標安全合約一致。

`firecrawl_scrape` 會重複使用相同的 `plugins.entries.firecrawl.config.webFetch.*` 設定與環境變數，包括其必要的 API 金鑰。

### 自架 Firecrawl

自行執行 Firecrawl 時，請設定 `plugins.entries.firecrawl.config.webSearch.baseUrl`、`plugins.entries.firecrawl.config.webFetch.baseUrl` 或 `FIRECRAWL_BASE_URL`。OpenClaw 僅針對回送、私有網路、`.local`、`.internal` 或 `.localhost` 目標接受 `http://`。系統會拒絕公開的自訂主機，避免意外將 Firecrawl API 金鑰傳送至任意端點。

## Firecrawl 外掛工具

### `firecrawl_search`

當你需要 Firecrawl 專屬搜尋控制項，而非通用的 `web_search` 時，請使用此工具。需要 API 金鑰。

參數：

- `query`
- `count`（1-100）
- `sources`
- `categories`
- `includeDomains` / `excludeDomains`（僅限主機名稱；互斥）
- `tbs`（時間篩選器，例如 `qdr:d`、`qdr:w`、`sbd:1`）
- `location` 和 `country`（地理位置指定）
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

對於大量使用 JS 或受機器人防護的頁面，若一般的 `web_fetch` 效果不佳，請使用此工具。

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

除非呼叫端覆寫這些參數，否則 `firecrawl_scrape` 和 `web_fetch` Firecrawl 備援預設會使用 `proxy: "auto"` 加上 `storeInCache: true`。`firecrawl_search` 和 `web_search` Firecrawl 提供者沒有 `proxy`/`storeInCache` 控制項；隱匿代理模式僅適用於抓取／擷取請求。

Firecrawl 的 `proxy` 模式控制機器人防護規避（`basic`、`stealth` 或 `auto`）。若基本嘗試失敗，`auto` 會使用隱匿代理重試，這可能會比僅使用基本抓取消耗更多點數。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 擷取順序：

1. Readability（本機）
2. 已設定的擷取提供者，例如 Firecrawl（選取後，或從已設定的認證資訊自動偵測）
3. 基本 HTML 清理（最後的備援）

選擇控制項為 `tools.web.fetch.provider`。若省略此項，OpenClaw 會從可用的認證資訊中，自動偵測第一個已就緒的網頁擷取提供者。官方 Firecrawl 外掛會提供該備援。

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [網頁擷取](/zh-TW/tools/web-fetch) -- 具備 Firecrawl 備援的 web_fetch 工具
- [Tavily](/zh-TW/tools/tavily) -- 搜尋與擷取工具
