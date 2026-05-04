---
read_when:
    - 你想取得一個 URL 並擷取可讀內容
    - 你需要設定 web_fetch 或其 Firecrawl 後備方案
    - 你想了解 web_fetch 的限制和快取
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- 具備可讀內容擷取功能的 HTTP 擷取
title: 網頁擷取
x-i18n:
    generated_at: "2026-05-04T02:46:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8c3efbf4a640b2fd69cc9532dcb06a873a6830a2e8a85ab7510ab38207c8670
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 工具會執行一般 HTTP GET，並擷取可讀內容
（將 HTML 轉為 Markdown 或文字）。它**不會**執行 JavaScript。

對於大量依賴 JS 的網站或受登入保護的頁面，請改用
[網頁瀏覽器](/zh-TW/tools/browser)。

## 快速開始

`web_fetch` **預設已啟用** -- 不需要設定。代理可以立即呼叫它：

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
  <Step title="擷取">
    使用類似 Chrome 的 User-Agent 和 `Accept-Language`
    標頭傳送 HTTP GET。封鎖私有/內部主機名稱，並重新檢查重新導向。
  </Step>
  <Step title="提取">
    在 HTML 回應上執行 Readability（主內容擷取）。
  </Step>
  <Step title="後援（選用）">
    如果 Readability 失敗且已設定 Firecrawl，則透過
    Firecrawl API 以規避機器人偵測模式重試。
  </Step>
  <Step title="快取">
    結果會快取 15 分鐘（可設定），以減少對相同 URL 的重複
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
        useTrustedEnvProxy: false, // let a trusted HTTP(S) env proxy resolve DNS
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

如果 Readability 擷取失敗，`web_fetch` 可以後援到
[Firecrawl](/zh-TW/tools/firecrawl)，用於規避機器人偵測並提供更好的擷取：

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
  如果 Firecrawl 已啟用，且其 SecretRef 未解析且沒有
  `FIRECRAWL_API_KEY` 環境後援，Gateway 啟動會快速失敗。
</Note>

<Note>
  Firecrawl `baseUrl` 覆寫受到限制：託管流量使用
  `https://api.firecrawl.dev`；自架覆寫必須指向私有或
  內部端點，且 `http://` 只接受用於這些私有目標。
</Note>

目前的執行階段行為：

- `tools.web.fetch.provider` 會明確選擇擷取後援提供者。
- 如果省略 `provider`，OpenClaw 會從可用憑證中自動偵測第一個就緒的網頁擷取
  提供者。非沙盒化的 `web_fetch` 可以使用已安裝且宣告
  `contracts.webFetchProviders`，並在執行階段註冊相符提供者的 plugins。
  目前內建提供者是 Firecrawl。
- 沙盒化的 `web_fetch` 呼叫仍限制為內建提供者。
- 如果 Readability 已停用，`web_fetch` 會直接跳到所選的
  提供者後援。如果沒有可用提供者，則會封閉失敗。

## 受信任的環境代理

如果你的部署需要讓 `web_fetch` 透過受信任的出站
HTTP(S) 代理，請設定 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍會在傳送請求前套用基於主機名稱的 SSRF 檢查，
但會讓代理解析 DNS，而不是執行本機 DNS
釘選。只有在代理由操作者控制，並且會在 DNS 解析後強制執行
出站政策時，才啟用此選項。

<Note>
  如果未設定 HTTP(S) 代理環境變數，或目標主機被
  `NO_PROXY` 排除，`web_fetch` 會回退到使用本機 DNS
  釘選的一般嚴格路徑。
</Note>

## 限制與安全性

- `maxChars` 會限制在 `tools.web.fetch.maxCharsCap`
- 回應本文在解析前會限制為 `maxResponseBytes`；過大的
  回應會被截斷並附帶警告
- 私有/內部主機名稱會被封鎖
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是針對受信任假 IP 代理堆疊的狹義選用項；
  除非你的代理擁有這些合成範圍並強制執行自己的目的地政策，
  否則請不要設定
- 重新導向會被檢查，並受 `maxRedirects` 限制
- `useTrustedEnvProxy` 是明確的選用項，且只應為
  操作者控制、仍會在 DNS 解析後強制執行出站政策的代理啟用
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
- [Firecrawl](/zh-TW/tools/firecrawl) -- Firecrawl 搜尋與擷取工具
