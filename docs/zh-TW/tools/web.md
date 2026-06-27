---
read_when:
    - 你想要啟用或設定 web_search
    - 您想要啟用或設定 x_search
    - 你需要選擇搜尋提供者
    - 你想了解自動偵測與供應商選擇
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜尋網路、搜尋 X 貼文，或擷取頁面內容
title: 網頁搜尋
x-i18n:
    generated_at: "2026-06-27T20:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

`web_search` 工具會使用你設定的提供者搜尋網頁，並傳回結果。結果會依查詢快取 15 分鐘（可設定）。

OpenClaw 也包含用於 X（前身為 Twitter）貼文的 `x_search`，以及用於輕量 URL 擷取的 `web_fetch`。在此階段，`web_fetch` 維持本機執行，而 `web_search` 與 `x_search` 可在底層使用 xAI Responses。

<Info>
  `web_search` 是輕量 HTTP 工具，不是瀏覽器自動化。對於
  JS 密集的網站或登入，請使用 [網頁瀏覽器](/zh-TW/tools/browser)。若要
  擷取特定 URL，請使用 [網頁擷取](/zh-TW/tools/web-fetch)。
</Info>

## 快速開始

<Steps>
  <Step title="Choose a provider">
    選擇一個提供者並完成任何必要設定。有些提供者不需要金鑰，而其他提供者使用 API 金鑰。詳情請參閱下方的提供者頁面。
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    這會儲存提供者及任何所需的憑證。你也可以設定環境變數（例如 `BRAVE_API_KEY`），並對 API 後端提供者略過此步驟。
  </Step>
  <Step title="Use it">
    agent 現在可以呼叫 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    若要搜尋 X 貼文，請使用：

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
  <Card title="Codex Hosted Search" icon="search" href="/zh-TW/plugins/codex-harness">
    透過你的 Codex app-server 帳戶取得 AI 綜合、具根據的答案。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    免金鑰提供者。不需要 API 金鑰。非官方的 HTML 型整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    神經網路 + 關鍵字搜尋，並提供內容擷取（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    結構化結果。最適合搭配 `firecrawl_search` 與 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google Search grounding 取得帶引用的 AI 綜合答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI web grounding 取得帶引用的 AI 綜合答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot 網頁搜尋取得帶引用的 AI 綜合答案；未 grounding 的聊天備援會明確失敗。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Token Plan 搜尋 API 取得結構化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或託管的 Ollama API 搜尋。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-TW/tools/parallel-search">
    付費 Parallel Search API（`PARALLEL_API_KEY`）；更高的速率限制與目標調校。
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/zh-TW/tools/parallel-search">
    免金鑰選用。Parallel 的免費 Search MCP，提供針對 LLM 最佳化的密集摘錄，且不需要 API 金鑰。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    結構化結果，並提供內容擷取控制與網域篩選。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自行託管的後設搜尋。不需要 API 金鑰。彙總 Google、Bing、DuckDuckGo 等來源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    結構化結果，提供搜尋深度、主題篩選，以及用於 URL 擷取的 `tavily_extract`。
  </Card>
</CardGroup>

### 提供者比較

| 提供者                                           | 結果樣式                                                       | 篩選器                                           | API 金鑰                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)                     | 結構化摘要片段                                                 | 國家、語言、時間、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/zh-TW/plugins/codex-harness)    | AI 綜合 + 來源 URL                                             | 網域、內容大小、使用者位置                       | 無；使用 Codex/OpenAI 登入                                                              |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)           | 結構化摘要片段                                                 | --                                               | 無（免金鑰）                                                                            |
| [Exa](/zh-TW/tools/exa-search)                         | 結構化 + 已擷取                                                | 神經網路/關鍵字模式、日期、內容擷取             | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-TW/tools/firecrawl)                    | 結構化摘要片段                                                 | 透過 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-TW/tools/gemini-search)                   | AI 綜合 + 引用                                                 | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-TW/tools/grok-search)                       | AI 綜合 + 引用                                                 | --                                               | xAI OAuth、`XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/zh-TW/tools/kimi-search)                       | AI 綜合 + 引用；未 grounding 的聊天備援會失敗                  | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-TW/tools/minimax-search)          | 結構化摘要片段                                                 | 區域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/zh-TW/tools/ollama-search)        | 結構化摘要片段                                                 | --                                               | 已登入本機主機不需要；直接搜尋 `https://ollama.com` 時使用 `OLLAMA_API_KEY`             |
| [Parallel](/zh-TW/tools/parallel-search)               | 針對 LLM 內容排序的密集摘錄                                    | --                                               | `PARALLEL_API_KEY`（付費）                                                              |
| [Parallel Search (Free)](/zh-TW/tools/parallel-search) | 針對 LLM 內容排序的密集摘錄                                    | --                                               | 無（免費 Search MCP）                                                                   |
| [Perplexity](/zh-TW/tools/perplexity-search)           | 結構化摘要片段                                                 | 國家、語言、時間、網域、內容限制                | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-TW/tools/searxng-search)                 | 結構化摘要片段                                                 | 類別、語言                                       | 無（自行託管）                                                                          |
| [Tavily](/zh-TW/tools/tavily)                          | 結構化摘要片段                                                 | 透過 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自動偵測

## 原生 OpenAI 網頁搜尋

當 OpenClaw 網頁搜尋已啟用且未固定受管提供者時，直接的 OpenAI Responses 模型會自動使用 OpenAI 託管的 `web_search` 工具。這是內建 OpenAI 外掛中的提供者自有行為，且只適用於原生 OpenAI API 流量，不適用於 OpenAI 相容的代理基底 URL 或 Azure 路由。將 `tools.web.search.provider` 設為其他提供者（例如 `brave`），即可讓 OpenAI 模型保留受管的 `web_search` 工具；或將 `tools.web.search.enabled: false` 設定為停用受管搜尋與原生 OpenAI 搜尋。

## 原生 Codex 網頁搜尋

當網頁搜尋已啟用且未選取受管提供者時，Codex app-server 執行階段會自動使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 受管的 `web_search` 動態工具互斥，因此受管搜尋無法繞過原生網域限制。當託管搜尋不可用、已明確停用，或由選取的受管提供者取代時，OpenClaw 會使用受管工具。OpenClaw 會讓 Codex 的獨立 `web.run` 擴充保持停用，因為正式環境 app-server 流量會拒絕其使用者定義的 `web` 命名空間。

- 在 `tools.web.search.openaiCodex` 下設定原生搜尋
- 將 `tools.web.search.provider: "codex"` 設定為將 Codex Hosted Search 佈建為任何父模型的受管 `web_search` 提供者。每次呼叫都會執行一次有界限的暫時性 Codex app-server turn，且如果 Codex 未發出託管的 `webSearch` 項目就會失敗。
- `mode: "cached"` 是預設偏好，但 Codex 會針對不受限制的 app-server turn 將其解析為即時外部存取；設定 `"live"` 可明確要求即時存取
- 將 `tools.web.search.provider` 設定為受管提供者（例如 `brave`），即可改用 OpenClaw 受管的 `web_search`
- 將 `tools.web.search.openaiCodex.enabled: false` 設定為退出 Codex 託管搜尋；其他受管提供者仍可使用
- 限制 Codex 原生工具介面也會讓受管 `web_search` 保持可用
- 設定 `allowedDomains` 時，如果託管搜尋不可用，自動受管備援會 fail closed，因此無法繞過原生允許清單
- 停用工具的純 LLM 執行會同時停用原生與受管搜尋
- `tools.web.search.enabled: false` 會同時停用受管與原生搜尋

持久的有效 Codex 搜尋政策變更會啟動新的繫結 thread，因此已載入的 app-server thread 無法保留過期的託管搜尋存取權。暫時性的逐 turn 限制會使用臨時受限 thread，並保留既有繫結以供稍後恢復。

直接的 OpenAI ChatGPT Responses 流量也可以使用 OpenAI 託管的 `web_search` 工具。該獨立路徑仍透過 `tools.web.search.openaiCodex.enabled: true` 選用，且只適用於使用 `api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
        provider: "codex",
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

對於不支援原生 Codex 搜尋的執行階段與提供者，Codex 可以透過 OpenClaw 的動態工具命名空間使用受管的 `web_search` 備援。當你需要 OpenClaw 提供者專屬的網路控制，而不是 Codex 託管搜尋時，請使用明確的受管提供者。

選取 `provider: "codex"` 會啟用內建的 `codex` 外掛，並使用上方所示相同的 `tools.web.search.openaiCodex` 限制。請先使用 `openclaw models auth login --provider openai` 驗證 Codex app-server。父代理可以使用任何模型或執行環境；只有有界搜尋 worker 會透過 Codex 執行。

## 網路安全

受管理的 HTTP `web_search` 提供者呼叫會使用 OpenClaw 的受保護擷取路徑。對於受信任的提供者 API 主機，OpenClaw 只會針對該提供者主機名稱，允許 Surge、Clash 和 sing-box 的 fake-IP DNS 答覆落在 `198.18.0.0/15` 與 `fc00::/7` 範圍內。其他私有、loopback、link-local 和中繼資料目的地仍會被封鎖。Codex Hosted Search 是例外：其有界 worker 會將網路存取委派給 Codex app-server 的託管 `web_search` 工具。

這項自動允許不適用於任意 `web_fetch` URL。對於 `web_fetch`，只有當你的受信任代理擁有這些合成範圍時，才明確啟用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 與 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 設定網頁搜尋

文件與設定流程中的提供者清單按字母排序。自動偵測會保留獨立的優先順序。

如果未設定 `provider`，OpenClaw 會依照此順序檢查提供者，並使用第一個已就緒的提供者：

先檢查 API 後端提供者：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（順序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；選用的 `plugins.entries.exa.config.webSearch.baseUrl` 會覆寫 Exa 端點（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）
10. **Parallel** -- 透過 `PARALLEL_API_KEY` 或 `plugins.entries.parallel.config.webSearch.apiKey` 使用付費 Parallel Search API；選用的 `plugins.entries.parallel.config.webSearch.baseUrl` 會覆寫端點（順序 75）

接著檢查已設定端點的提供者：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search (Free)**、**DuckDuckGo**、**Ollama Web Search** 和 **Codex Hosted Search** 等免金鑰提供者，只有在你透過 `tools.web.search.provider` 或 `openclaw configure --section web` 明確選取時才可用。OpenClaw 不會只因為未設定 API 後端提供者，就將受管理的 `web_search` 查詢傳送到免金鑰提供者。

OpenAI Responses 模型是例外：當未設定 `tools.web.search.provider` 時，它們會使用 OpenAI 的原生網頁搜尋，而非上述受管理提供者。將 `tools.web.search.provider` 設為 `parallel-free`（或其他提供者）即可讓它們透過受管理路徑路由。

<Note>
  所有提供者金鑰欄位都支援 SecretRef 物件。位於 `plugins.entries.<plugin>.config.webSearch.apiKey` 下的外掛範圍 SecretRefs，會針對已安裝的 API 後端網頁搜尋提供者解析，包括 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 和 Tavily，無論提供者是透過 `tools.web.search.provider` 明確選取，或是透過自動偵測選取。在自動偵測模式中，OpenClaw 只會解析已選取的提供者金鑰 -- 未選取的 SecretRefs 會保持停用，因此你可以保留多個已設定的提供者，而不必為未使用的提供者支付解析成本。
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

提供者專屬設定（API 金鑰、基底 URL、模式）位於 `plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 也可以在其專用網頁搜尋設定與 `GEMINI_API_KEY` 之後，以較低優先順序的備援方式重用 `models.providers.google.apiKey` 與 `models.providers.google.baseUrl`。範例請參閱提供者頁面。Grok 也可以重用來自 `openclaw models auth login --provider xai --method oauth` 的 xAI OAuth 驗證設定檔；API 金鑰設定仍作為備援。

`tools.web.search.provider` 會依照內建與已安裝外掛 manifest 宣告的網頁搜尋提供者 ID 進行驗證。像 `"brvae"` 這樣的拼字錯誤會導致設定驗證失敗，而不是靜默退回自動偵測。如果已設定的提供者只有過期的外掛證據，例如解除安裝第三方外掛後留下的 `plugins.entries.<plugin>` 區塊，OpenClaw 會保持啟動流程具韌性並回報警告，讓你可以重新安裝外掛，或執行 `openclaw doctor --fix` 清理過期設定。

`web_fetch` 備援提供者選取是分開的：

- 使用 `tools.web.fetch.provider` 選擇它
- 或省略該欄位，讓 OpenClaw 從已設定認證中自動偵測第一個已就緒的 web-fetch 提供者
- 非沙盒化的 `web_fetch` 可以使用宣告 `contracts.webFetchProviders` 的已安裝外掛提供者；沙盒化擷取允許內建提供者與已驗證的官方外掛安裝，但排除第三方外部外掛
- 官方 Firecrawl 外掛提供 web-fetch 備援，設定於 `plugins.entries.firecrawl.config.webFetch.*` 下

當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

對於 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它使用與聊天相同的 xAI 驗證設定檔，或 Grok 網頁搜尋使用的 `XAI_API_KEY` / 外掛網頁搜尋認證。舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動遷移。當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 Grok 時，OpenClaw 也可以使用相同認證提供選用的 `x_search` 設定。這是 Grok 路徑內的獨立後續步驟，不是獨立的頂層網頁搜尋提供者選項。如果你選擇另一個提供者，OpenClaw 不會顯示 `x_search` 提示。

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
    在閘道程序環境中設定提供者環境變數：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    對於閘道安裝，請將它放在 `~/.openclaw/.env`。
    請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具參數

| 參數                  | 說明                                                  |
| --------------------- | ----------------------------------------------------- |
| `query`               | 搜尋查詢（必要）                                      |
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
| `max_tokens_per_page` | 每頁 token 限制，預設 2048（僅限 Perplexity）         |

<Warning>
  並非所有參數都能搭配所有提供者使用。Brave `llm-context` 模式會拒絕 `ui_lang`；`date_before` 也需要 `date_after`，因為 Brave 自訂 freshness 範圍要求同時提供開始與結束日期。Gemini、Grok 和 Kimi 會傳回一個附引用的合成答案。它們接受 `count` 以維持共用工具相容性，但這不會改變 grounded answer 的形狀。Gemini 會將 `day` freshness 視為近期提示；更寬的 freshness 值與明確日期會設定 Google Search grounding 時間範圍。當你使用 Sonar/OpenRouter 相容路徑（`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 或 `OPENROUTER_API_KEY`）時，Perplexity 的行為也相同。SearXNG 只針對受信任的私有網路或 loopback 主機接受 `http://`；公開 SearXNG 端點必須使用 `https://`。Firecrawl 和 Tavily 透過 `web_search` 只支援 `query` 與 `count` -- 進階選項請使用它們的專用工具。
</Warning>

## x_search

`x_search` 會使用 xAI 查詢 X（前 Twitter）貼文，並傳回附引用的 AI 合成答案。它接受自然語言查詢與選用的結構化篩選器。OpenClaw 只會在服務此工具呼叫的請求上啟用內建 xAI `x_search` 工具。

<Note>
  xAI 文件記載 `x_search` 支援關鍵字搜尋、語意搜尋、使用者搜尋與討論串擷取。對於每篇貼文的互動統計，例如轉貼、回覆、書籤或檢視次數，請優先針對精確貼文 URL 或狀態 ID 進行目標查詢。廣泛的關鍵字搜尋可能找到正確貼文，但傳回的每篇貼文中繼資料可能較不完整。一個好的模式是：先定位貼文，然後針對該精確貼文執行第二個 `x_search` 查詢。
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

當設定 `plugins.entries.xai.config.xSearch.baseUrl` 時，`x_search` 會發佈到 `<baseUrl>/responses`。如果省略該欄位，它會退回到 `plugins.entries.xai.config.webSearch.baseUrl`，接著是舊版 `tools.web.search.grok.baseUrl`，最後是公開 xAI 端點。

### x_search 參數

| 參數                         | 說明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜尋查詢（必填）                                      |
| `allowed_x_handles`          | 將結果限制為特定 X 帳號                               |
| `excluded_x_handles`         | 排除特定 X 帳號                                       |
| `from_date`                  | 僅包含此日期（YYYY-MM-DD）當天或之後的貼文            |
| `to_date`                    | 僅包含此日期（YYYY-MM-DD）當天或之前的貼文            |
| `enable_image_understanding` | 讓 xAI 檢查符合條件貼文所附加的圖片                   |
| `enable_video_understanding` | 讓 xAI 檢查符合條件貼文所附加的影片                   |

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

- [網頁擷取](/zh-TW/tools/web-fetch) -- 擷取 URL 並萃取可讀內容
- [網頁瀏覽器](/zh-TW/tools/browser) -- 適用於大量使用 JS 網站的完整瀏覽器自動化
- [Grok 搜尋](/zh-TW/tools/grok-search) -- 以 Grok 作為 `web_search` 提供者
- [Ollama 網頁搜尋](/zh-TW/tools/ollama-search) -- 透過你的 Ollama 主機進行無需金鑰的網頁搜尋
