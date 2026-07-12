---
read_when:
    - 您想擷取某個 URL 並提取可閱讀的內容
    - 你需要設定 web_fetch 或其 Firecrawl 備援機制
    - 你想要瞭解 web_fetch 的限制與快取機制
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- 透過 HTTP 擷取並提取可讀內容
title: 網頁擷取
x-i18n:
    generated_at: "2026-07-11T21:56:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c956b01fce44dc4b8f3ac289b312691c3fe4293ed2e6777fb53f3345dd99e93
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 會執行一般的 HTTP GET，並擷取可讀內容（將 HTML 轉換為
Markdown 或文字）。它**不會**執行 JavaScript。對於大量使用 JS 的網站或
受登入保護的頁面，請改用[網頁瀏覽器](/zh-TW/tools/browser)。

## 快速開始

預設啟用，無須設定：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具參數

<ParamField path="url" type="string" required>
要擷取的 URL。僅支援 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
擷取主要內容後的輸出格式。
</ParamField>

<ParamField path="maxChars" type="number">
將輸出截斷至此字元數。上限受 `tools.web.fetch.maxCharsCap` 限制。
</ParamField>

## 運作方式

<Steps>
  <Step title="擷取">
    使用類似 Chrome 的 User-Agent 和 `Accept-Language`
    標頭傳送 HTTP GET。封鎖私人／內部主機名稱，並重新檢查重新導向。
  </Step>
  <Step title="提取">
    對 HTML 回應執行 Readability（主要內容提取）。
  </Step>
  <Step title="備援（選用）">
    如果 Readability 失敗且有可用的擷取提供者，則透過該提供者重試
    （例如 Firecrawl 的機器人規避模式）。
  </Step>
  <Step title="快取">
    結果會快取 15 分鐘（可設定），以減少對相同 URL 的重複
    擷取。
  </Step>
</Steps>

## 進度更新

只有在擷取作業經過五秒後仍未完成時，`web_fetch` 才會發出公開的進度訊息：

```text
正在擷取頁面內容...
```

快速的快取命中和網路回應會在計時器觸發前完成，因此
不會顯示進度訊息。取消呼叫會清除計時器。此進度訊息僅代表頻道介面狀態，
絕不包含擷取到的頁面內容。

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 預設值：true
        provider: "firecrawl", // 選用；省略則自動偵測
        maxChars: 20000, // 預設輸出字元數；上限為 maxCharsCap
        maxCharsCap: 20000, // maxChars 參數的硬性上限
        maxResponseBytes: 750000, // 截斷前的最大下載大小（32000-10000000）
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // 讓受信任的 HTTP(S) 環境代理伺服器解析 DNS
        readability: true, // 使用 Readability 提取
        userAgent: "Mozilla/5.0 ...", // 覆寫 User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // 選擇性啟用：供使用 198.18.0.0/15 的受信任假 IP 代理伺服器使用
          allowIpv6UniqueLocalRange: true, // 選擇性啟用：供使用 fc00::/7 的受信任假 IP 代理伺服器使用
        },
      },
    },
  },
}
```

## Firecrawl 備援

如果 Readability 提取失敗，`web_fetch` 可改用
[Firecrawl](/zh-TW/tools/firecrawl) 來規避機器人限制並改善提取效果：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 選用；省略則根據可用憑證自動偵測
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // 選用；省略則使用免金鑰的入門存取
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // 快取時間（2 天）
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 為選用，並支援 SecretRef 物件。
舊版 `tools.web.fetch.firecrawl.*` 設定可透過 `openclaw doctor --fix`
自動遷移至 `plugins.entries.firecrawl.config.webFetch`。

<Note>
  如果設定了 Firecrawl API 金鑰 SecretRef，但該參照無法解析且沒有
  `FIRECRAWL_API_KEY` 環境變數作為備援，閘道啟動會立即失敗。
</Note>

<Note>
  Firecrawl 的 `baseUrl` 覆寫受到嚴格限制：託管流量使用
  `https://api.firecrawl.dev`；自行託管的覆寫必須指向私人或
  內部端點，且只有這類私人目標才接受 `http://`。
</Note>

目前的執行階段行為：

- `tools.web.fetch.provider` 會明確選取擷取備援提供者。
- 如果省略 `provider`，OpenClaw 會根據已設定的憑證，自動偵測第一個就緒的網頁擷取
  提供者。非沙箱環境中的 `web_fetch` 可以使用已安裝的外掛；這些外掛必須宣告
  `contracts.webFetchProviders`，並在執行階段註冊相符的提供者。目前官方 Firecrawl 外掛
  提供此備援功能。
- 沙箱環境中的 `web_fetch` 呼叫允許使用內建提供者，以及官方 npm 或 ClawHub
  來源已驗證的已安裝提供者。目前這允許使用官方 Firecrawl 外掛；第三方外部擷取外掛
  仍會被排除。
- 如果停用 Readability，`web_fetch` 會直接使用所選的
  提供者備援。如果沒有可用的提供者，則會採取封閉式失敗。

## 受信任的環境代理伺服器

如果您的部署需要讓 `web_fetch` 經由受信任的對外
HTTP(S) 代理伺服器，請設定 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍會在傳送要求前套用基於主機名稱的 SSRF 檢查，
但會讓代理伺服器解析 DNS，而不在本機固定 DNS。只有在代理伺服器由操作人員控制，
且會在 DNS 解析後強制執行對外連線政策時，才應啟用此功能。

<Note>
  如果未設定 HTTP(S) 代理伺服器環境變數，或目標主機被
  `NO_PROXY` 排除，`web_fetch` 會退回使用具備本機 DNS
  固定機制的一般嚴格路徑。
</Note>

## 限制與安全性

- `maxChars` 的上限受 `tools.web.fetch.maxCharsCap` 限制（預設為 `20000`）
- 回應本文在解析前的上限為 `maxResponseBytes`（預設為 `750000`，限制於
  32000-10000000）；過大的回應會遭截斷並顯示警告
- 私人／內部主機名稱會遭封鎖
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是專供
  受信任假 IP 代理伺服器堆疊使用的有限選擇性設定；除非您的代理伺服器擁有
  這些合成範圍並強制執行自己的目的地政策，否則請勿設定
- 重新導向會經過檢查，且數量受 `maxRedirects` 限制（預設為 `3`）
- `useTrustedEnvProxy` 必須明確選擇啟用，且僅應用於由操作人員控制、
  並會在 DNS 解析後持續強制執行對外連線政策的代理伺服器
- `web_fetch` 僅提供盡力而為的支援——部分網站需要使用[網頁瀏覽器](/zh-TW/tools/browser)

## 工具設定檔

如果您使用工具設定檔或允許清單，請加入 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // 或：allow: ["group:web"]（包含 web_fetch、web_search 和 x_search）
  },
}
```

## 相關內容

- [網頁搜尋](/zh-TW/tools/web)——使用多個提供者搜尋網路
- [網頁瀏覽器](/zh-TW/tools/browser)——適用於大量使用 JS 之網站的完整瀏覽器自動化
- [Firecrawl](/zh-TW/tools/firecrawl)——Firecrawl 搜尋與擷取工具
