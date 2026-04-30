---
read_when:
    - 您想要啟用或設定 web_search
    - 你想啟用或設定 x_search
    - 你需要選擇一個搜尋提供者
    - 您想了解自動偵測與提供者備援機制
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜尋網路、搜尋 X 貼文，或擷取頁面內容
title: 網頁搜尋
x-i18n:
    generated_at: "2026-04-30T03:49:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9f8233a33f0729c6413eda59c4ebc3338a1e398e8280eb12650197225ef8981e
    source_path: tools/web.md
    workflow: 16
---

`web_search` 工具會使用你設定的提供者搜尋網路並傳回結果。結果會依查詢快取 15 分鐘（可設定）。

OpenClaw 也包含用於 X（前 Twitter）貼文的 `x_search`，以及用於輕量 URL 擷取的 `web_fetch`。在此階段，`web_fetch` 會維持本機執行，而 `web_search` 和 `x_search` 可在底層使用 xAI Responses。

<Info>
  `web_search` 是輕量 HTTP 工具，不是瀏覽器自動化。對於大量使用 JS 的網站或登入流程，請使用 [網頁瀏覽器](/zh-TW/tools/browser)。若要擷取特定 URL，請使用 [Web Fetch](/zh-TW/tools/web-fetch)。
</Info>

## 快速開始

<Steps>
  <Step title="Choose a provider">
    選擇一個提供者並完成任何必要設定。有些提供者不需要金鑰，其他則使用 API 金鑰。詳情請參閱下方的提供者頁面。
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    這會儲存提供者和任何所需的憑證。你也可以設定環境變數（例如 `BRAVE_API_KEY`），並針對 API 支援的提供者略過此步驟。
  </Step>
  <Step title="Use it">
    代理現在可以呼叫 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    對於 X 貼文，請使用：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 選擇提供者

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-TW/tools/brave-search">
    含摘要片段的結構化結果。支援 `llm-context` 模式、國家/語言篩選器。提供免費方案。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    無需金鑰的備援。不需要 API 金鑰。非官方、以 HTML 為基礎的整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    神經 + 關鍵字搜尋，並提供內容擷取（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    結構化結果。最適合搭配 `firecrawl_search` 和 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google Search grounding 提供附引用的 AI 合成答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI 網頁 grounding 提供附引用的 AI 合成答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot 網頁搜尋提供附引用的 AI 合成答案。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Coding Plan 搜尋 API 提供結構化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或託管的 Ollama API 搜尋。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    含內容擷取控制和網域篩選的結構化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自架中介搜尋。不需要 API 金鑰。彙整 Google、Bing、DuckDuckGo 等來源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    含搜尋深度、主題篩選，以及用於 URL 擷取的 `tavily_extract` 的結構化結果。
  </Card>
</CardGroup>

### 提供者比較

| 提供者                                    | 結果樣式                   | 篩選器                                           | API 金鑰                                                                                |
| ----------------------------------------- | -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)              | 結構化摘要片段             | 國家、語言、時間、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)    | 結構化摘要片段             | --                                               | 無（無需金鑰）                                                                          |
| [Exa](/zh-TW/tools/exa-search)                  | 結構化 + 已擷取內容        | 神經/關鍵字模式、日期、內容擷取                  | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-TW/tools/firecrawl)             | 結構化摘要片段             | 透過 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-TW/tools/gemini-search)            | AI 合成 + 引用             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-TW/tools/grok-search)                | AI 合成 + 引用             | --                                               | `XAI_API_KEY`                                                                           |
| [Kimi](/zh-TW/tools/kimi-search)                | AI 合成 + 引用             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-TW/tools/minimax-search)   | 結構化摘要片段             | 區域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY`                                      |
| [Ollama Web Search](/zh-TW/tools/ollama-search) | 結構化摘要片段             | --                                               | 已登入的本機主機不需要；直接搜尋 `https://ollama.com` 則使用 `OLLAMA_API_KEY`           |
| [Perplexity](/zh-TW/tools/perplexity-search)    | 結構化摘要片段             | 國家、語言、時間、網域、內容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-TW/tools/searxng-search)          | 結構化摘要片段             | 類別、語言                                       | 無（自架）                                                                              |
| [Tavily](/zh-TW/tools/tavily)                   | 結構化摘要片段             | 透過 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自動偵測

## 原生 OpenAI 網頁搜尋

當 OpenClaw 網頁搜尋已啟用且未固定託管提供者時，直接的 OpenAI Responses 模型會自動使用 OpenAI 託管的 `web_search` 工具。這是隨附 OpenAI Plugin 中由提供者擁有的行為，而且只適用於原生 OpenAI API 流量，不適用於 OpenAI 相容的代理基底 URL 或 Azure 路由。將 `tools.web.search.provider` 設為其他提供者（例如 `brave`），即可為 OpenAI 模型保留託管的 `web_search` 工具，或設定 `tools.web.search.enabled: false` 以停用託管搜尋和原生 OpenAI 搜尋。

## 原生 Codex 網頁搜尋

支援 Codex 的模型可以選擇使用提供者原生的 Responses `web_search` 工具，而不是 OpenClaw 的託管 `web_search` 函式。

- 在 `tools.web.search.openaiCodex` 下設定
- 它只會針對支援 Codex 的模型啟用（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的提供者）
- 託管的 `web_search` 仍適用於非 Codex 模型
- `mode: "cached"` 是預設且建議的設定
- `tools.web.search.enabled: false` 會同時停用託管和原生搜尋

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

如果已啟用原生 Codex 搜尋，但目前模型不支援 Codex，OpenClaw 會維持一般託管的 `web_search` 行為。

## 設定網頁搜尋

文件和設定流程中的提供者清單按字母排序。自動偵測會保留獨立的優先順序。

如果未設定 `provider`，OpenClaw 會依照以下順序檢查提供者，並使用第一個已就緒的提供者：

先檢查 API 支援的提供者：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`（順序 20）
4. **Grok** -- `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）

之後是無需金鑰的備援：

10. **DuckDuckGo** -- 無需帳號或 API 金鑰的無金鑰 HTML 備援（順序 100）
11. **Ollama Web Search** -- 當你設定的本機 Ollama 主機可連線且已透過 `ollama signin` 登入時，透過它提供無需金鑰的備援；當主機需要時可重用 Ollama 提供者 bearer 驗證，並且在設定 `OLLAMA_API_KEY` 時可呼叫直接的 `https://ollama.com` 搜尋（順序 110）
12. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

如果未偵測到任何提供者，則會退回 Brave（你會收到缺少金鑰的錯誤，提示你設定金鑰）。

<Note>
  所有提供者金鑰欄位都支援 SecretRef 物件。位於 `plugins.entries.<plugin>.config.webSearch.apiKey` 下的 Plugin 範圍 SecretRef 會針對隨附的 API 支援網頁搜尋提供者解析，包括 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Perplexity 和 Tavily，無論該提供者是透過 `tools.web.search.provider` 明確選取，或是透過自動偵測選取。在自動偵測模式中，OpenClaw 只會解析所選提供者的金鑰 -- 未選取的 SecretRef 會保持未啟用，因此你可以設定多個提供者，而不必為未使用的提供者支付解析成本。
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

提供者特定設定（API 金鑰、基底 URL、模式）位於 `plugins.entries.<plugin>.config.webSearch.*` 下。範例請參閱提供者頁面。

`web_fetch` 備援提供者選擇是獨立的：

- 使用 `tools.web.fetch.provider` 選擇它
- 或略過該欄位，讓 OpenClaw 從可用憑證中自動偵測第一個就緒的 web-fetch 提供者
- 目前隨附的 web-fetch 提供者是 Firecrawl，設定於 `plugins.entries.firecrawl.config.webFetch.*` 下

當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

對於 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它使用與 Grok 網頁搜尋相同的 `XAI_API_KEY` 後援。
舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動遷移。
當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 Grok 時，
OpenClaw 也可以用相同金鑰提供選用的 `x_search` 設定。
這是 Grok 路徑內的獨立後續步驟，不是獨立的頂層
網頁搜尋供應商選項。如果你選擇其他供應商，OpenClaw 不會
顯示 `x_search` 提示。

### 儲存 API 金鑰

<Tabs>
  <Tab title="設定檔">
    執行 `openclaw configure --section web`，或直接設定金鑰：

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
    在 Gateway 程序環境中設定供應商環境變數：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    對於 gateway 安裝，請將它放在 `~/.openclaw/.env`。
    請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具參數

| 參數                  | 說明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜尋查詢（必要）                                      |
| `count`               | 要傳回的結果數量（1-10，預設：5）                    |
| `country`             | 2 字母 ISO 國家/地區代碼（例如 "US"、"DE"）           |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"）                 |
| `search_lang`         | 搜尋語言代碼（僅限 Brave）                           |
| `freshness`           | 時間篩選器：`day`、`week`、`month` 或 `year`          |
| `date_after`          | 此日期之後的結果（YYYY-MM-DD）                        |
| `date_before`         | 此日期之前的結果（YYYY-MM-DD）                        |
| `ui_lang`             | UI 語言代碼（僅限 Brave）                             |
| `domain_filter`       | 網域允許清單/拒絕清單陣列（僅限 Perplexity）         |
| `max_tokens`          | 總內容預算，預設 25000（僅限 Perplexity）             |
| `max_tokens_per_page` | 每頁 token 限制，預設 2048（僅限 Perplexity）         |

<Warning>
  並非所有參數都適用於所有供應商。Brave `llm-context` 模式
  會拒絕 `ui_lang`、`freshness`、`date_after` 和 `date_before`。
  Gemini、Grok 和 Kimi 會傳回一個附有引用的綜合答案。它們
  接受 `count` 以維持共用工具相容性，但這不會改變
  grounded 答案的形態。
  當你使用 Sonar/OpenRouter 相容性路徑（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）時，Perplexity 的行為也相同。
  SearXNG 只接受受信任私人網路或 local loopback 主機的 `http://`；
  公開 SearXNG 端點必須使用 `https://`。
  Firecrawl 和 Tavily 透過 `web_search` 只支援 `query` 和 `count`
  -- 進階選項請使用它們的專用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查詢 X（前 Twitter）貼文，並傳回
附有引用的 AI 綜合答案。它接受自然語言查詢和
選用的結構化篩選器。OpenClaw 只會在服務此工具呼叫的請求上啟用內建 xAI `x_search`
工具。

<Note>
  xAI 將 `x_search` 文件化為支援關鍵字搜尋、語意搜尋、使用者
  搜尋和討論串擷取。對於每則貼文的互動統計，例如轉貼、
  回覆、書籤或瀏覽次數，請優先針對確切貼文 URL
  或狀態 ID 進行查找。廣泛的關鍵字搜尋可能會找到正確貼文，但傳回較不完整的
  每則貼文中繼資料。良好的模式是：先定位貼文，然後
  執行第二次聚焦於該確切貼文的 `x_search` 查詢。
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
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
}
```

### x_search 參數

| 參數                         | 說明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜尋查詢（必要）                                       |
| `allowed_x_handles`          | 將結果限制為特定 X 帳號                               |
| `excluded_x_handles`         | 排除特定 X 帳號                                       |
| `from_date`                  | 只包含此日期當天或之後的貼文（YYYY-MM-DD）            |
| `to_date`                    | 只包含此日期當天或之前的貼文（YYYY-MM-DD）            |
| `enable_image_understanding` | 讓 xAI 檢查符合貼文附加的圖片                         |
| `enable_video_understanding` | 讓 xAI 檢查符合貼文附加的影片                         |

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

## 相關內容

- [Web Fetch](/zh-TW/tools/web-fetch) -- 擷取 URL 並萃取可讀內容
- [Web Browser](/zh-TW/tools/browser) -- 針對大量使用 JS 的網站進行完整瀏覽器自動化
- [Grok Search](/zh-TW/tools/grok-search) -- 以 Grok 作為 `web_search` 供應商
- [Ollama Web Search](/zh-TW/tools/ollama-search) -- 透過你的 Ollama 主機進行免金鑰網頁搜尋
