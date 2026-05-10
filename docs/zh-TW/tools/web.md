---
read_when:
    - 你想啟用或設定 web_search
    - 您想要啟用或設定 x_search
    - 你需要選擇搜尋提供者
    - 您想了解自動偵測和提供者備援
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜尋網頁、搜尋 X 貼文，或擷取頁面內容
title: 網頁搜尋
x-i18n:
    generated_at: "2026-05-10T19:56:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c2806730f8c9cb33a3c142d5283de0f1231502e052c6da796c31125834a94e6
    source_path: tools/web.md
    workflow: 16
---

`web_search` 工具會使用你設定的供應商搜尋網路，並傳回結果。結果會依查詢快取 15 分鐘（可設定）。

OpenClaw 也包含用於 X（前稱 Twitter）貼文的 `x_search`，以及用於輕量 URL 擷取的 `web_fetch`。在此階段，`web_fetch` 會保持本機執行，而 `web_search` 和 `x_search` 可在底層使用 xAI Responses。

<Info>
  `web_search` 是輕量 HTTP 工具，不是瀏覽器自動化。對於
  大量使用 JS 的網站或登入，請使用 [Web Browser](/zh-TW/tools/browser)。若要
  擷取特定 URL，請使用 [Web Fetch](/zh-TW/tools/web-fetch)。
</Info>

## 快速開始

<Steps>
  <Step title="Choose a provider">
    選擇供應商並完成任何必要設定。有些供應商
    無需金鑰，而其他供應商使用 API 金鑰。詳情請參閱
    下方的供應商頁面。
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    這會儲存供應商和任何必要的憑證。你也可以設定 env
    var（例如 `BRAVE_API_KEY`），並略過 API 支援
    供應商的此步驟。
  </Step>
  <Step title="Use it">
    Agent 現在可以呼叫 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    對於 X 貼文，請使用：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 選擇供應商

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-TW/tools/brave-search">
    含摘要片段的結構化結果。支援 `llm-context` 模式、國家/語言篩選器。提供免費層級。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    無需金鑰的備援。不需要 API 金鑰。非官方、基於 HTML 的整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    神經 + 關鍵字搜尋，並具備內容擷取（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    結構化結果。最適合搭配 `firecrawl_search` 和 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google Search grounding 產生附引用來源的 AI 合成答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI web grounding 產生附引用來源的 AI 合成答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot web search 產生附引用來源的 AI 合成答案；未 grounding 的聊天備援會明確失敗。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Token Plan 搜尋 API 取得結構化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或代管的 Ollama API 進行搜尋。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    結構化結果，具備內容擷取控制與網域篩選。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自行託管的 meta-search。不需要 API 金鑰。彙整 Google、Bing、DuckDuckGo 等來源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    結構化結果，具備搜尋深度、主題篩選，以及用於 URL 擷取的 `tavily_extract`。
  </Card>
</CardGroup>

### 供應商比較

| 供應商                                    | 結果樣式                                                       | 篩選器                                           | API 金鑰                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)              | 結構化摘要片段                                                 | 國家、語言、時間、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)    | 結構化摘要片段                                                 | --                                               | 無（無需金鑰）                                                                          |
| [Exa](/zh-TW/tools/exa-search)                  | 結構化 + 已擷取                                                | 神經/關鍵字模式、日期、內容擷取                  | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-TW/tools/firecrawl)             | 結構化摘要片段                                                 | 透過 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-TW/tools/gemini-search)            | AI 合成 + 引用來源                                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-TW/tools/grok-search)                | AI 合成 + 引用來源                                             | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/zh-TW/tools/kimi-search)                | AI 合成 + 引用來源；未 grounding 的聊天備援會失敗              | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-TW/tools/minimax-search)   | 結構化摘要片段                                                 | 區域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/zh-TW/tools/ollama-search) | 結構化摘要片段                                                 | --                                               | 已登入本機主機不需要；直接搜尋 `https://ollama.com` 時使用 `OLLAMA_API_KEY`             |
| [Perplexity](/zh-TW/tools/perplexity-search)    | 結構化摘要片段                                                 | 國家、語言、時間、網域、內容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-TW/tools/searxng-search)          | 結構化摘要片段                                                 | 類別、語言                                       | 無（自行託管）                                                                          |
| [Tavily](/zh-TW/tools/tavily)                   | 結構化摘要片段                                                 | 透過 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自動偵測

## 原生 OpenAI web search

當 OpenClaw web search 已啟用且未固定 managed provider 時，直接使用 OpenAI Responses 模型會自動使用 OpenAI 代管的 `web_search` 工具。這是 bundled OpenAI plugin 中由供應商擁有的行為，且只適用於原生 OpenAI API 流量，不適用於 OpenAI 相容代理 base URL 或 Azure 路由。將 `tools.web.search.provider` 設為其他供應商（例如 `brave`），可讓 OpenAI 模型繼續使用 managed `web_search` 工具；或設定 `tools.web.search.enabled: false` 以停用 managed search 與原生 OpenAI search。

## 原生 Codex web search

支援 Codex 的模型可以選擇使用供應商原生 Responses `web_search` 工具，而不是 OpenClaw 的 managed `web_search` 函式。

- 在 `tools.web.search.openaiCodex` 下設定
- 只會對支援 Codex 的模型啟用（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的供應商）
- Managed `web_search` 仍適用於非 Codex 模型
- `mode: "cached"` 是預設且建議的設定
- `tools.web.search.enabled: false` 會同時停用 managed 與原生搜尋

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

如果已啟用原生 Codex 搜尋，但目前模型不支援 Codex，OpenClaw 會維持一般 managed `web_search` 行為。

## 網路安全

Managed `web_search` 供應商呼叫會使用 OpenClaw 的受保護 fetch 路徑。對於
受信任的供應商 API 主機，OpenClaw 只會針對該供應商主機名稱，
允許 Surge、Clash 和 sing-box fake-IP DNS 在 `198.18.0.0/15` 與
`fc00::/7` 的回應。其他私有、loopback、link-local 和 metadata 目的地仍會被封鎖。

此自動允許不適用於任意 `web_fetch` URL。對於
`web_fetch`，只有在你的受信任代理擁有這些合成範圍時，才明確啟用
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 設定 web search

文件與設定流程中的供應商清單按字母順序排列。自動偵測則維持
獨立的優先順序。

如果未設定 `provider`，OpenClaw 會依此順序檢查供應商，並使用
第一個已就緒的供應商：

首先是 API 支援的供應商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（順序 20）
4. **Grok** -- `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；選用的 `plugins.entries.exa.config.webSearch.baseUrl` 會覆寫 Exa 端點（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）

之後是無需金鑰的備援：

10. **DuckDuckGo** -- 無需帳號或 API 金鑰的無金鑰 HTML 備援（順序 100）
11. **Ollama Web Search** -- 當你設定的本機 Ollama 主機可連線且已使用 `ollama signin` 登入時，可透過它使用無需金鑰的備援；主機需要時可重用 Ollama 供應商 bearer auth，並可在設定 `OLLAMA_API_KEY` 時直接呼叫 `https://ollama.com` 搜尋（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

如果未偵測到供應商，會備援到 Brave（你會收到提示設定金鑰的缺少金鑰錯誤）。

<Note>
  所有供應商金鑰欄位都支援 SecretRef 物件。位於
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下、Plugin 範圍的 SecretRefs
  會針對 bundled API 支援 web search 供應商解析，包括 Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Perplexity 和 Tavily，
  無論供應商是透過 `tools.web.search.provider` 明確選取，還是
  透過自動偵測選取。在自動偵測模式中，OpenClaw 只會解析
  已選取的供應商金鑰 -- 未選取的 SecretRefs 會保持未啟用，因此你可以
  保留多個已設定的供應商，而不必為未使用的供應商支付解析成本。
</Note>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

提供者專屬設定（API 金鑰、基礎 URL、模式）位於
`plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 也可以在其專用網頁搜尋設定和 `GEMINI_API_KEY` 之後，以較低優先順序重複使用
`models.providers.google.apiKey` 與 `models.providers.google.baseUrl`
作為備援。範例請參閱提供者頁面。

`tools.web.search.provider` 會依據內建和已安裝 Plugin 清單宣告的網頁搜尋提供者 ID 進行驗證。像 `"brvae"` 這樣的拼字錯誤會使設定驗證失敗，而不是靜默退回自動偵測。如果設定的提供者只有過期的 Plugin 證據，例如解除安裝第三方 Plugin 後留下的
`plugins.entries.<plugin>` 區塊，OpenClaw 會保持啟動韌性並回報警告，讓你可以重新安裝該 Plugin，或執行 `openclaw doctor --fix` 清理過期設定。

`web_fetch` 備援提供者選擇是分開的：

- 使用 `tools.web.fetch.provider` 選擇它
- 或省略該欄位，讓 OpenClaw 從可用憑證中自動偵測第一個就緒的網頁擷取提供者
- 非沙箱化的 `web_fetch` 可使用宣告 `contracts.webFetchProviders` 的已安裝 Plugin 提供者；沙箱化擷取會維持僅限內建提供者
- 目前內建的網頁擷取提供者是 Firecrawl，設定位於
  `plugins.entries.firecrawl.config.webFetch.*` 下

當你在 `openclaw onboard` 或
`openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

對於 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它會使用與聊天相同的 xAI 驗證設定檔，或 Grok 網頁搜尋使用的 `XAI_API_KEY` / Plugin 網頁搜尋憑證。
舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動遷移。
當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 Grok 時，
OpenClaw 也可以用相同金鑰提供選用的 `x_search` 設定。
這是 Grok 路徑內的獨立後續步驟，不是另一個最上層網頁搜尋提供者選項。如果你選擇其他提供者，OpenClaw 不會顯示 `x_search` 提示。

### 儲存 API 金鑰

<Tabs>
  <Tab title="設定檔">
    執行 `openclaw configure --section web` 或直接設定金鑰：

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="環境變數">
    在 Gateway 行程環境中設定提供者環境變數：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    對於 Gateway 安裝，請將它放在 `~/.openclaw/.env`。
    請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具參數

| 參數                  | 說明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜尋查詢（必填）                                      |
| `count`               | 要傳回的結果數（1-10，預設：5）                       |
| `country`             | 2 字母 ISO 國家/地區代碼（例如 "US"、"DE"）           |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"）                 |
| `search_lang`         | 搜尋語言代碼（僅限 Brave）                            |
| `freshness`           | 時間篩選器：`day`、`week`、`month` 或 `year`          |
| `date_after`          | 此日期之後的結果（YYYY-MM-DD）                        |
| `date_before`         | 此日期之前的結果（YYYY-MM-DD）                        |
| `ui_lang`             | UI 語言代碼（僅限 Brave）                             |
| `domain_filter`       | 網域允許清單/拒絕清單陣列（僅限 Perplexity）          |
| `max_tokens`          | 總內容預算，預設 25000（僅限 Perplexity）             |
| `max_tokens_per_page` | 每頁權杖限制，預設 2048（僅限 Perplexity）            |

<Warning>
  並非所有參數都適用於所有提供者。Brave `llm-context` 模式
  會拒絕 `ui_lang`；`date_before` 也需要 `date_after`，因為 Brave 自訂
  freshness 範圍需要開始和結束日期。
  Gemini、Grok 和 Kimi 會傳回一個帶有引用的合成答案。它們
  接受 `count` 以維持共用工具相容性，但這不會改變
  grounded 答案形態。Gemini 支援 `freshness`、`date_after` 和
  `date_before`，方式是將它們轉換為 Google Search grounding 時間範圍。
  當你使用 Sonar/OpenRouter 相容路徑（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）時，Perplexity 的行為相同。
  SearXNG 只接受受信任私有網路或 loopback 主機的 `http://`；
  公開 SearXNG 端點必須使用 `https://`。
  Firecrawl 和 Tavily 透過 `web_search` 僅支援 `query` 和 `count`
  -- 進階選項請使用它們的專用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查詢 X（前身為 Twitter）貼文，並傳回
帶有引用的 AI 合成答案。它接受自然語言查詢與
選用的結構化篩選器。OpenClaw 只會在服務此工具呼叫的請求上啟用內建 xAI `x_search`
工具。

<Note>
  xAI 文件記載 `x_search` 支援關鍵字搜尋、語意搜尋、使用者
  搜尋和討論串擷取。對於每則貼文的互動統計，例如轉貼、
  回覆、書籤或瀏覽次數，建議針對精確貼文 URL
  或狀態 ID 進行目標查詢。廣泛關鍵字搜尋可能找到正確貼文，但傳回的
  每則貼文中繼資料較不完整。良好模式是：先定位貼文，然後
  執行第二次 `x_search` 查詢，聚焦於那則精確貼文。
</Note>

### x_search 設定

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

當設定
`plugins.entries.xai.config.xSearch.baseUrl` 時，`x_search` 會發佈到 `<baseUrl>/responses`。如果省略該欄位，
它會退回 `plugins.entries.xai.config.webSearch.baseUrl`，接著是
舊版 `tools.web.search.grok.baseUrl`，最後是公開 xAI 端點。

### x_search 參數

| 參數                         | 說明                                             |
| ---------------------------- | ------------------------------------------------ |
| `query`                      | 搜尋查詢（必填）                                 |
| `allowed_x_handles`          | 將結果限制為特定 X 帳號                          |
| `excluded_x_handles`         | 排除特定 X 帳號                                  |
| `from_date`                  | 僅包含此日期當天或之後的貼文（YYYY-MM-DD）       |
| `to_date`                    | 僅包含此日期當天或之前的貼文（YYYY-MM-DD）       |
| `enable_image_understanding` | 讓 xAI 檢查符合貼文附加的圖片                    |
| `enable_video_understanding` | 讓 xAI 檢查符合貼文附加的影片                    |

### x_search 範例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 範例

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具設定檔

如果你使用工具設定檔或允許清單，請新增 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## 相關

- [網頁擷取](/zh-TW/tools/web-fetch) -- 擷取 URL 並取出可讀內容
- [網頁瀏覽器](/zh-TW/tools/browser) -- 針對大量使用 JS 的網站進行完整瀏覽器自動化
- [Grok 搜尋](/zh-TW/tools/grok-search) -- Grok 作為 `web_search` 提供者
- [Ollama 網頁搜尋](/zh-TW/tools/ollama-search) -- 透過你的 Ollama 主機進行免金鑰網頁搜尋
