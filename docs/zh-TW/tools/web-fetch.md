---
read_when:
    - 你想要擷取 URL 並提取可讀內容
    - 你需要設定 web_fetch 或其 Firecrawl 備援方案
    - 你想了解 `web_fetch` 的限制與快取機制
sidebarTitle: Web Fetch
summary: web_fetch 工具 -- 透過 HTTP 擷取並提取可讀內容
title: 網頁擷取
x-i18n:
    generated_at: "2026-07-19T14:10:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ddf312245064672dcf489e8714740fa3e034827e16b33be8fb6a87db04f19ef8
    source_path: tools/web-fetch.md
    workflow: 16
---

`web_fetch` 會執行一般的 HTTP GET，並擷取可讀內容（將 HTML 轉為
Markdown 或文字）。它**不會**執行 JavaScript。對於大量使用 JS 的網站或
受登入保護的頁面，請改用[網頁瀏覽器](/zh-TW/tools/browser)。

## 快速開始

預設為啟用，無須設定：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具參數

<ParamField path="url" type="string" required>
要擷取的 URL。僅限 `http(s)`。
</ParamField>

<ParamField path="extractMode" type="'markdown' | 'text'" default="markdown">
主要內容擷取後的輸出格式。
</ParamField>

<ParamField path="maxChars" type="number">
將輸出截斷至此字元數。限制於 `tools.web.fetch.maxCharsCap`。
</ParamField>

## 結果

`web_fetch` 會傳回包含下列欄位的封閉式結構化結果：

- 要求中繼資料：`url`、`finalUrl`、`status`、`extractMode` 和 `extractor`
- 選用的回應中繼資料：`contentType`、`title` 和 `warning`（不存在時省略）
- 封裝內容中繼資料：`externalContent`、`truncated`、`length`、`rawLength`、
  `fetchedAt`、`tookMs` 和 `text`
- 快取命中時的選用 `cached: true`
- 截斷內容寫入私有暫存檔案時的選用 `spill: { path, chars, truncated? }`；
  僅當該檔案包含部分來源內容時，才會有 `truncated`

`length` 是封裝後的 `text` 長度。`rawLength` 是外部內容封裝前
所擷取內容的長度。

## 運作方式

<Steps>
  <Step title="擷取">
    使用類似 Chrome 的 User-Agent 和 `Accept-Language`
    標頭傳送 HTTP GET。封鎖私人／內部主機名稱，並重新檢查重新導向。
  </Step>
  <Step title="擷取內容">
    對 HTML 回應執行 Readability（主要內容擷取）。
  </Step>
  <Step title="後援（選用）">
    如果 Readability 失敗且有可用的擷取提供者，則透過
    該提供者重試（例如 Firecrawl 的規避機器人阻擋模式）。
  </Step>
  <Step title="快取">
    結果會快取 15 分鐘（可設定），以減少重複
    擷取相同 URL。
  </Step>
</Steps>

## 進度更新

僅當擷取在五秒後仍處於等待狀態時，`web_fetch` 才會發出公開的進度訊息：

```text
正在擷取頁面內容...
```

快速的快取命中和迅速的網路回應會在計時器觸發前完成，因此
絕不會顯示進度訊息。取消呼叫會清除計時器。此進度訊息僅為頻道 UI 狀態，
絕不包含擷取的頁面內容。

## 設定

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 預設值：true
        provider: "firecrawl", // 選用；省略以自動偵測
        maxChars: 20000, // 預設輸出字元數；上限為 maxCharsCap
        maxCharsCap: 20000, // maxChars 參數的硬性上限
        maxResponseBytes: 750000, // 截斷前的最大下載大小（32000-10000000）
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        useTrustedEnvProxy: false, // 允許受信任的 HTTP(S) 環境代理伺服器解析 DNS
        readability: true, // 使用 Readability 擷取
        userAgent: "Mozilla/5.0 ...", // 覆寫 User-Agent
        ssrfPolicy: {
          allowRfc2544BenchmarkRange: true, // 選擇性允許使用 198.18.0.0/15 的受信任假 IP 代理伺服器
          allowIpv6UniqueLocalRange: true, // 選擇性允許使用 fc00::/7 的受信任假 IP 代理伺服器
        },
      },
    },
  },
}
```

## Firecrawl 後援

如果 Readability 擷取失敗，`web_fetch` 可退回使用
[Firecrawl](/zh-TW/tools/firecrawl)，以規避機器人阻擋並改善擷取效果：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 選用；省略以根據可用認證資訊自動偵測
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            // apiKey: "fc-...", // 選用；省略即可使用無金鑰的入門存取
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 172800000, // 快取持續時間（2 天）
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 為選用，並支援 SecretRef 物件。
舊版 `tools.web.fetch.firecrawl.*` 設定會透過 `openclaw doctor --fix`
自動遷移至 `plugins.entries.firecrawl.config.webFetch`。

<Note>
  如果你設定了 Firecrawl API 金鑰 SecretRef，但該參照無法解析，且沒有
  `FIRECRAWL_API_KEY` 環境變數後援，閘道啟動會立即失敗。
</Note>

<Note>
  Firecrawl `baseUrl` 覆寫受到嚴格限制：託管流量使用
  `https://api.firecrawl.dev`；自行託管的覆寫必須指向私人或
  內部端點，且只有這些私人目標才接受 `http://`。
</Note>

目前的執行階段行為：

- `tools.web.fetch.provider` 會明確選取擷取後援提供者。
- 若省略 `provider`，OpenClaw 會從已設定的認證資訊中，自動偵測第一個就緒的網頁擷取
  提供者。非沙箱化的 `web_fetch` 可使用已安裝的外掛；這些外掛須宣告
  `contracts.webFetchProviders`，並在執行階段註冊相符的提供者。目前官方 Firecrawl 外掛
  提供此後援。
- 沙箱化的 `web_fetch` 呼叫允許使用內建提供者，以及官方 npm 或 ClawHub
  來源已通過驗證的已安裝提供者。目前這會允許官方 Firecrawl 外掛；
  第三方外部擷取外掛仍會被排除。
- 如果停用 Readability，`web_fetch` 會直接跳至所選的
  提供者後援。如果沒有可用的提供者，則會以封閉方式失敗。

## 受信任的環境代理伺服器

如果你的部署要求 `web_fetch` 經由受信任的對外
HTTP(S) 代理伺服器，請設定 `tools.web.fetch.useTrustedEnvProxy: true`。

在此模式下，OpenClaw 仍會在傳送要求前套用以主機名稱為基礎的 SSRF 檢查，
但會讓代理伺服器解析 DNS，而不是在本機固定 DNS。只有在代理伺服器由
操作者控制，且會在 DNS 解析後強制執行對外連線政策時，才啟用此功能。

<Note>
  如果未設定 HTTP(S) 代理伺服器環境變數，或目標主機遭
  `NO_PROXY` 排除，`web_fetch` 會退回使用具本機 DNS
  固定機制的一般嚴格路徑。
</Note>

## 限制與安全性

- `maxChars` 的上限為 `tools.web.fetch.maxCharsCap`（預設值為 `20000`）
- 回應本文在剖析前的上限為 `maxResponseBytes`（預設值為 `750000`，限制於
  32000-10000000）；過大的回應會被截斷並顯示警告
- 封鎖私人／內部主機名稱
- `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
  `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` 是針對受信任假 IP 代理伺服器堆疊的有限制選擇性設定；
  除非你的代理伺服器擁有這些合成範圍，並強制執行其自身的目的地政策，
  否則請勿設定
- 重新導向會受到檢查，並由 `maxRedirects` 限制（預設值為 `3`）
- `useTrustedEnvProxy` 是明確的選擇性設定，且僅應為
  在 DNS 解析後仍會強制執行對外連線政策、由操作者控制的代理伺服器啟用
- `web_fetch` 僅盡力而為——部分網站需要使用[網頁瀏覽器](/zh-TW/tools/browser)

## 工具設定檔

如果你使用工具設定檔或允許清單，請新增 `web_fetch` 或 `group:web`：

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
- [網頁瀏覽器](/zh-TW/tools/browser)——針對大量使用 JS 的網站提供完整的瀏覽器自動化
- [Firecrawl](/zh-TW/tools/firecrawl)——Firecrawl 搜尋與抓取工具
