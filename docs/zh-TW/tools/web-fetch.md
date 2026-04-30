---
read_when:
    - 您想要取得某個 URL 並擷取可讀內容
    - 您需要設定 web_fetch 或其 Firecrawl 備援機制
    - 你想了解 web_fetch 的限制與快取
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- HTTP 擷取並萃取可讀內容
title: 網頁擷取
x-i18n:
    generated_at: "2026-04-30T03:49:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 430ff19fe477cff22bb88bc69f1fdd53185cb61c935f2b64481e98b2e5f4aff9
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 工具會執行純 HTTP GET，並擷取可讀內容
（HTML 轉為 markdown 或文字）。它**不會**執行 JavaScript。

對於大量依賴 JS 的網站或受登入保護的頁面，請改用
[網頁瀏覽器](/zh-TW/tools/browser)。

## 快速開始

`web_fetch` **預設已啟用** -- 無需設定。代理可以立即
呼叫它：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具參數

<ParamField path="url" type="string" required>
要擷取的 URL。僅限 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主內容擷取後的輸出格式。
</ParamField>

<ParamField path="maxChars" type="number">
將輸出截斷為此字元數。
</ParamField>

## 運作方式

<Steps>
  <Step title="Fetch">
    使用類似 Chrome 的 User-Agent 和 `Accept-Language`
    標頭傳送 HTTP GET。封鎖私人/內部主機名稱，並重新檢查重新導向。
  </Step>
  <Step title="Extract">
    在 HTML 回應上執行 Readability（主內容擷取）。
  </Step>
  <Step title="Fallback (optional)">
    如果 Readability 失敗且已設定 Firecrawl，則透過
    Firecrawl API 以規避機器人偵測模式重試。
  </Step>
  <Step title="Cache">
    結果會快取 15 分鐘（可設定），以減少對同一 URL 的重複
    擷取。
  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000, // max output chars
        maxCharsCap: 50000, // hard cap for maxChars param
        maxResponseBytes: 2000000, // max download size before truncation
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // use Readability extraction
        userAgent: "Mozilla/5.0 ...", // override User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // opt-in for trusted fake-IP proxies using 198.18.0.0/15
          allowIpv6UniqueLocalRange: true, // opt-in for trusted fake-IP proxies using fc00::/7
        },
      },
    },
  },
}
```

## Firecrawl 後援

如果 Readability 擷取失敗，`web_fetch` 可以後援至
[Firecrawl](/zh-TW/tools/firecrawl)，以規避機器人偵測並提供更好的擷取：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // optional; omit for auto-detect from available credentials
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // optional if FIRECRAWL_API_KEY is set
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // cache duration (1 day)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 支援 SecretRef 物件。
舊版 `tools.web.fetch.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。

<Note>
  如果 Firecrawl 已啟用，且其 SecretRef 未解析，且沒有
  `FIRECRAWL_API_KEY` 環境變數後援，gateway 啟動會快速失敗。
</Note>

<Note>
  Firecrawl `baseUrl` 覆寫受到鎖定：必須使用 `https://`，且必須是
  官方 Firecrawl 主機（`api.firecrawl.dev`）。
</Note>

目前的執行階段行為：

- `tools.web.fetch.provider` 會明確選取擷取後援提供者。
- 如果省略 `provider`，OpenClaw 會從可用憑證自動偵測第一個就緒的 web-fetch
  提供者。目前內建的提供者是 Firecrawl。
- 如果停用 Readability，`web_fetch` 會直接跳到選取的
  提供者後援。如果沒有可用提供者，則會以封閉方式失敗。

## 限制與安全性

- `maxChars` 會被限制在 `tools.web.fetch.maxCharsCap`
- 回應本文在剖析前會限制為 `maxResponseBytes`；過大的
  回應會被截斷並顯示警告
- 私人/內部主機名稱會被封鎖
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是針對
  受信任假 IP 代理堆疊的狹義選擇加入；除非你的代理擁有
  這些合成範圍並強制執行自己的目的地政策，否則請保持未設定
- 重新導向會被檢查，並受 `maxRedirects` 限制
- `web_fetch` 是盡力而為 -- 有些網站需要[網頁瀏覽器](/zh-TW/tools/browser)

## 工具設定檔

如果你使用工具設定檔或允許清單，請加入 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // or: allow: ["group:web"]  (includes web_fetch, web_search, and x_search)
  },
}
```

## 相關

- [網頁搜尋](/zh-TW/tools/web) -- 使用多個提供者搜尋網頁
- [網頁瀏覽器](/zh-TW/tools/browser) -- 適用於大量依賴 JS 網站的完整瀏覽器自動化
- [Firecrawl](/zh-TW/tools/firecrawl) -- Firecrawl 搜尋與爬取工具
