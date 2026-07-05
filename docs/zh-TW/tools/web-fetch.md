---
read_when:
    - 你想要擷取 URL 並提取可讀內容
    - 你需要設定 web_fetch 或其 Firecrawl 備援機制
    - 你想了解 web_fetch 的限制與快取
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- HTTP 擷取並萃取可讀內容
title: 網頁擷取
x-i18n:
    generated_at: "2026-07-05T11:49:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 會執行一般的 HTTP GET，並擷取可讀內容（將 HTML 轉為
Markdown 或文字）。它**不會**執行 JavaScript。對於大量依賴 JS 的網站或
受登入保護的頁面，請改用[網頁瀏覽器](/zh-TW/tools/browser)。

## 快速開始

預設啟用，不需要設定：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具參數

<ParamField path="url" type="string" required>
要擷取的 URL。僅支援 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主內容擷取後的輸出格式。
</ParamField>

<ParamField path="maxChars" type="number">
將輸出截斷為此字元數。會受限於 `tools.web.fetch.maxCharsCap`。
</ParamField>

## 運作方式

<Steps>
  <Step title="Fetch">
    使用類似 Chrome 的 User-Agent 和 `Accept-Language` 標頭傳送 HTTP GET。
    封鎖私有/內部主機名稱，並重新檢查重新導向。
  </Step>
  <Step title="Extract">
    在 HTML 回應上執行 Readability（主內容擷取）。
  </Step>
  <Step title="Fallback (optional)">
    如果 Readability 失敗且有可用的擷取提供者，會透過該提供者重試
    （例如 Firecrawl 的機器人規避模式）。
  </Step>
  <Step title="Cache">
    結果會快取 15 分鐘（可設定），以減少對相同 URL 的重複擷取。
  </Step>
</Steps>

## 進度更新

只有當擷取在五秒後仍在等待中時，`web_fetch` 才會發出公開進度行：

```text
Fetching page content...
```

快速的快取命中和快速的網路回應會在計時器觸發前完成，因此
不會顯示進度行。取消呼叫會清除計時器。該進度行只屬於通道 UI 狀態，
絕不包含已擷取的頁面內容。

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // default: true
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 20000, // default output chars; capped by maxCharsCap
        maxCharsCap: 20000, // hard cap for maxChars param
        maxResponseBytes: 750000, // max download size before truncation (32000-10000000)
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

## Firecrawl 備援

如果 Readability 擷取失敗，`web_fetch` 可以備援至
[Firecrawl](/zh-TW/tools/firecrawl)，以進行機器人規避和更好的擷取：

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
            maxAgeMs: 172800000, // cache duration (2 days)
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 是選用項，並支援 SecretRef 物件。
舊版 `tools.web.fetch.firecrawl.*` 設定會透過 `openclaw doctor --fix`
自動遷移至 `plugins.entries.firecrawl.config.webFetch`。

<Note>
  如果你設定了 Firecrawl API 金鑰 SecretRef，但它未解析且沒有
  `FIRECRAWL_API_KEY` 環境備援，閘道啟動會快速失敗。
</Note>

<Note>
  Firecrawl `baseUrl` 覆寫受到鎖定：託管流量使用
  `https://api.firecrawl.dev`；自架覆寫必須指向私有或
  內部端點，且 `http://` 只會對這些私有目標接受。
</Note>

目前的執行階段行為：

- `tools.web.fetch.provider` 會明確選取擷取備援提供者。
- 如果省略 `provider`，OpenClaw 會從已設定的憑證中自動偵測第一個就緒的 web-fetch
  提供者。非沙箱化的 `web_fetch` 可以使用已安裝的外掛，前提是該外掛宣告
  `contracts.webFetchProviders`，並在執行階段註冊相符的提供者。官方 Firecrawl 外掛目前提供此
  備援。
- 沙箱化的 `web_fetch` 呼叫允許內建提供者，以及官方 npm 或 ClawHub 來源已驗證的已安裝提供者。
  目前這允許官方 Firecrawl 外掛；第三方外部擷取外掛仍會被排除。
- 如果停用 Readability，`web_fetch` 會直接跳到選定的提供者備援。
  如果沒有可用的提供者，則會關閉式失敗。

## 受信任的環境代理

如果你的部署需要讓 `web_fetch` 透過受信任的輸出
HTTP(S) 代理，請設定 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式中，OpenClaw 仍會在傳送請求前套用以主機名稱為基礎的 SSRF 檢查，
但會讓代理解析 DNS，而不是執行本機 DNS 釘選。只有在代理由操作者控制，
且會在 DNS 解析後強制執行輸出政策時，才啟用此選項。

<Note>
  如果未設定 HTTP(S) 代理環境變數，或目標主機被
  `NO_PROXY` 排除，`web_fetch` 會退回使用具備本機 DNS
  釘選的正常嚴格路徑。
</Note>

## 限制與安全性

- `maxChars` 會受限於 `tools.web.fetch.maxCharsCap`（預設 `20000`）
- 回應本文在剖析前會限制為 `maxResponseBytes`（預設 `750000`，限制範圍為
  32000-10000000）；過大的回應會被截斷並顯示警告
- 私有/內部主機名稱會被封鎖
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是針對受信任假 IP 代理堆疊的狹窄選擇加入項；
  除非你的代理擁有這些合成範圍並強制執行自己的目的地政策，否則請保持未設定
- 重新導向會被檢查，並受 `maxRedirects` 限制（預設 `3`）
- `useTrustedEnvProxy` 是明確的選擇加入項，且只應為在 DNS
  解析後仍會強制執行輸出政策、由操作者控制的代理啟用
- `web_fetch` 採盡力而為；某些網站需要[網頁瀏覽器](/zh-TW/tools/browser)

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
