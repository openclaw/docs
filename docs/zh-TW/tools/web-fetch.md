---
read_when:
    - 你想要擷取 URL 並萃取可讀內容
    - 你需要設定 web_fetch 或其 Firecrawl 備援
    - 你想了解 web_fetch 限制與快取
sidebarTitle: Web Fetch
summary: '`web_fetch` 工具 -- 透過 HTTP 擷取並提取可讀內容'
title: 網頁擷取
x-i18n:
    generated_at: "2026-06-27T20:11:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5a4127b97ded80eec1a5944bc8606069e630c61f89c4d5ce9cb729390b4eb4d
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 工具會執行一般的 HTTP GET，並擷取可閱讀內容
（將 HTML 轉為 Markdown 或文字）。它**不會**執行 JavaScript。

對於大量依賴 JS 的網站或受登入保護的頁面，請改用
[網頁瀏覽器](/zh-TW/tools/browser)。

## 快速開始

`web_fetch` **預設啟用** -- 不需要設定。代理可以立即呼叫：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具參數

<ParamField path="url" type="string" required>
要擷取的 URL。僅支援 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主要內容擷取後的輸出格式。
</ParamField>

<ParamField path="maxChars" type="number">
將輸出截斷為這麼多字元。
</ParamField>

## 運作方式

<Steps>
  <Step title="Fetch">
    使用類似 Chrome 的 User-Agent 與 `Accept-Language`
    標頭傳送 HTTP GET。封鎖私人/內部主機名稱，並重新檢查重新導向。
  </Step>
  <Step title="Extract">
    對 HTML 回應執行 Readability（主要內容擷取）。
  </Step>
  <Step title="Fallback (optional)">
    如果 Readability 失敗且已選取 Firecrawl，會透過
    Firecrawl API 以繞過機器人偵測模式重試。
  </Step>
  <Step title="Cache">
    結果會快取 15 分鐘（可設定），以減少重複擷取同一 URL。
  </Step>
</Steps>

## 進度更新

`web_fetch` 只會在擷取超過五秒仍未完成時，發出一行公開進度：

```text
Fetching page content...
```

快速的快取命中與快速的網路回應會在計時器觸發前完成，因此
不會顯示進度行。如果呼叫被取消，計時器會被清除。
擷取最終完成時，代理會收到正常的工具結果；
進度行只是頻道 UI 狀態，絕不包含已擷取的頁面內容。

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

## Firecrawl 後備

如果 Readability 擷取失敗，`web_fetch` 可以退回使用
[Firecrawl](/zh-TW/tools/firecrawl)，以繞過機器人偵測並取得更好的擷取效果：

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
            // apiKey: "fc-...", // optional; omit for keyless starter access
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

`plugins.entries.firecrawl.config.webFetch.apiKey` 是選用項，並支援 SecretRef 物件。
舊版 `tools.web.fetch.firecrawl.*` 設定會由 `openclaw doctor --fix` 自動遷移。

<Note>
  如果你設定了 Firecrawl API 金鑰 SecretRef，但它無法解析且沒有
  `FIRECRAWL_API_KEY` 環境變數後備，閘道啟動會快速失敗。
</Note>

<Note>
  Firecrawl `baseUrl` 覆寫會受到鎖定：託管流量使用
  `https://api.firecrawl.dev`；自託管覆寫必須指向私人或
  內部端點，且 `http://` 只接受用於這些私人目標。
</Note>

目前的執行階段行為：

- `tools.web.fetch.provider` 會明確選取擷取後備提供者。
- 如果省略 `provider`，OpenClaw 會從已設定的憑證中，自動偵測第一個就緒的網頁擷取
  提供者。非沙箱化的 `web_fetch` 可以使用已安裝的外掛，只要它們宣告
  `contracts.webFetchProviders`，並在執行階段註冊相符的
  提供者。官方 Firecrawl 外掛會提供這個後備。
- 沙箱化的 `web_fetch` 呼叫允許內建提供者，以及已驗證官方 npm 或 ClawHub 來源的已安裝提供者。
  目前這允許官方 Firecrawl 外掛；第三方外部擷取外掛仍會被排除。
- 如果停用 Readability，`web_fetch` 會直接跳到所選的
  提供者後備。如果沒有可用提供者，會以關閉方式失敗。

## 受信任環境代理

如果你的部署需要 `web_fetch` 透過受信任的對外
HTTP(S) 代理，請設定 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式中，OpenClaw 仍會在送出要求前套用以主機名稱為基礎的 SSRF 檢查，
但會讓代理解析 DNS，而不是進行本機 DNS
釘選。只有在代理由操作員控制，且會在 DNS 解析後強制執行
對外政策時，才啟用此選項。

<Note>
  如果未設定 HTTP(S) 代理環境變數，或目標主機被
  `NO_PROXY` 排除，`web_fetch` 會退回一般嚴格路徑，使用本機 DNS
  釘選。
</Note>

## 限制與安全

- `maxChars` 會被限制在 `tools.web.fetch.maxCharsCap`
- 回應本文在解析前會受 `maxResponseBytes` 限制；過大的
  回應會被截斷並附帶警告
- 私人/內部主機名稱會被封鎖
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是狹義的選擇性啟用項，
  用於受信任的假 IP 代理堆疊；除非你的代理擁有
  這些合成範圍並強制執行自己的目的地政策，否則請不要設定
- 重新導向會被檢查，並受 `maxRedirects` 限制
- `useTrustedEnvProxy` 是明確的選擇性啟用項，且只應為
  操作員控制、仍會在 DNS 解析後強制執行對外政策的代理啟用
- `web_fetch` 是盡力而為 -- 某些網站需要使用[網頁瀏覽器](/zh-TW/tools/browser)

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

- [網頁搜尋](/zh-TW/tools/web) -- 使用多個提供者搜尋網路
- [網頁瀏覽器](/zh-TW/tools/browser) -- 適用於大量依賴 JS 網站的完整瀏覽器自動化
- [Firecrawl](/zh-TW/tools/firecrawl) -- Firecrawl 搜尋與擷取工具
