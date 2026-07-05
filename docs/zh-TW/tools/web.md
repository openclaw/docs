---
read_when:
    - 您想啟用或設定 web_search
    - 你想要啟用或設定 x_search
    - 您需要選擇搜尋提供者
    - 你想了解自動偵測與提供者選擇
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜尋網頁、搜尋 X 貼文，或擷取頁面內容
title: 網頁搜尋
x-i18n:
    generated_at: "2026-07-05T11:53:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9963a532560581e4aa533d2706eaab8f22224fec022ec8b8a3b8a093430f6971
    source_path: tools/web.md
    workflow: 16
---

`web_search` 會使用你設定的提供者搜尋網路，並傳回正規化結果，依查詢快取 15 分鐘（可設定）。OpenClaw 也內建用於 X（前 Twitter）貼文的 `x_search`，以及用於輕量 URL 擷取的 `web_fetch`。`web_fetch` 一律在本機執行；當 Grok 是提供者時，`web_search` 會透過 xAI Responses 路由，而 `x_search` 一律使用 xAI Responses。

<Info>
  `web_search` 是輕量 HTTP 工具，不是瀏覽器自動化。若是大量依賴 JS 的網站或登入流程，請使用 [網頁瀏覽器](/zh-TW/tools/browser)。若要擷取特定 URL，請使用 [網頁擷取](/zh-TW/tools/web-fetch)。
</Info>

## 快速開始

<Steps>
  <Step title="選擇提供者">
    選擇提供者並完成任何必要設定。有些提供者不需要金鑰，其他則需要 API 金鑰。詳情請參閱下方的提供者頁面。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    這會儲存提供者和任何所需憑證。對於 API 後端提供者，你也可以改為設定該提供者的環境變數（例如 `BRAVE_API_KEY`），並跳過此步驟。
  </Step>
  <Step title="使用">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    若要搜尋 X 貼文：

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## 選擇提供者

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-TW/tools/brave-search">
    具有摘要片段的結構化結果。支援 `llm-context` 模式、國家/語言篩選器。提供免費方案。
  </Card>
  <Card title="Codex 託管搜尋" icon="search" href="/zh-TW/plugins/codex-harness">
    透過你的 Codex app-server 帳戶取得 AI 合成的有依據回答。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    免金鑰提供者。不需要 API 金鑰。非官方的 HTML 型整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    結合神經與關鍵字搜尋，並提供內容擷取（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    結構化結果。最適合搭配 `firecrawl_search` 和 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google Search grounding 提供含引用的 AI 合成回答。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI 網路 grounding 提供含引用的 AI 合成回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot 網路搜尋提供含引用的 AI 合成回答；未 grounding 的聊天備援會明確失敗。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Token Plan 搜尋 API 提供結構化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或託管的 Ollama API 搜尋。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-TW/tools/parallel-search">
    付費 Parallel Search API（`PARALLEL_API_KEY`）；更高的速率限制與目標調整。
  </Card>
  <Card title="Parallel Search（免費）" icon="layer-group" href="/zh-TW/tools/parallel-search">
    免金鑰選用。Parallel 的免費 Search MCP，提供針對 LLM 最佳化的密集摘錄，且不需要 API 金鑰。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    具有內容擷取控制與網域篩選的結構化結果。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自行託管的中介搜尋。不需要 API 金鑰。彙整 Google、Bing、DuckDuckGo 等來源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    具有搜尋深度、主題篩選，以及用於 URL 擷取的 `tavily_extract` 的結構化結果。
  </Card>
</CardGroup>

### 提供者比較

| 提供者                                         | 結果樣式                                                   | 篩選器                                          | API 金鑰                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)                     | 結構化摘要片段                                            | 國家、語言、時間、`llm-context` 模式      | `BRAVE_API_KEY`                                                                         |
| [Codex 託管搜尋](/zh-TW/plugins/codex-harness)    | AI 合成 + 來源 URL                                   | 網域、脈絡大小、使用者位置             | 無；使用 Codex/OpenAI 登入                                                         |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)           | 結構化摘要片段                                            | --                                               | 無（免金鑰）                                                                         |
| [Exa](/zh-TW/tools/exa-search)                         | 結構化 + 已擷取內容                                         | 神經/關鍵字模式、日期、內容擷取    | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-TW/tools/firecrawl)                    | 結構化摘要片段                                            | 透過 `firecrawl_search` 工具                      | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-TW/tools/gemini-search)                   | AI 合成 + 引用                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-TW/tools/grok-search)                       | AI 合成 + 引用                                     | --                                               | xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`              |
| [Kimi](/zh-TW/tools/kimi-search)                       | AI 合成 + 引用；未 grounding 的聊天備援會失敗 | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-TW/tools/minimax-search)          | 結構化摘要片段                                            | 區域（`global` / `cn`）                         | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/zh-TW/tools/ollama-search)        | 結構化摘要片段                                            | --                                               | 已登入的本機主機不需要；直接搜尋 `https://ollama.com` 需 `OLLAMA_API_KEY` |
| [Parallel](/zh-TW/tools/parallel-search)               | 針對 LLM 脈絡排序的密集摘錄                          | --                                               | `PARALLEL_API_KEY`（付費）                                                               |
| [Parallel Search（免費）](/zh-TW/tools/parallel-search) | 針對 LLM 脈絡排序的密集摘錄                          | --                                               | 無（免費 Search MCP）                                                                  |
| [Perplexity](/zh-TW/tools/perplexity-search)           | 結構化摘要片段                                            | 國家、語言、時間、網域、內容限制 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-TW/tools/searxng-search)                 | 結構化摘要片段                                            | 類別、語言                             | 無（自行託管）                                                                      |
| [Tavily](/zh-TW/tools/tavily)                          | 結構化摘要片段                                            | 透過 `tavily_search` 工具                         | `TAVILY_API_KEY`                                                                        |

## 自動偵測

文件和設定流程中的提供者清單依字母順序排列。自動偵測使用獨立且固定的優先順序，而且只有在找到已設定的憑證時，才會選取需要憑證（`requiresCredential !== false`）的提供者。如果未設定 `provider`，OpenClaw 會依下列順序檢查提供者，並使用第一個已就緒的提供者：

API 後端提供者優先：

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

接著是已設定端點的提供者：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search（免費）**、**DuckDuckGo**、**Ollama Web Search** 和 **Codex 託管搜尋** 等免金鑰提供者，即使有內部順序值，也永遠不會贏得自動偵測。只有在你透過 `tools.web.search.provider` 或 `openclaw configure --section web` 明確選取它們時才會使用。OpenClaw 不會只因為未設定 API 後端提供者，就把受管的 `web_search` 查詢傳送到免金鑰提供者。

OpenAI Responses 模型是例外：當 `tools.web.search.provider` 未設定時，它們會使用 OpenAI 的原生網路搜尋，而不是上述受管提供者（見下方）。將 `tools.web.search.provider` 設為 `parallel-free`（或其他提供者），即可改由受管路徑路由。

<Note>
  所有提供者金鑰欄位都支援 SecretRef 物件。安裝的 API 後端網路搜尋提供者會解析 `plugins.entries.<plugin>.config.webSearch.apiKey` 下的外掛範圍 SecretRef，包括 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 和 Tavily，無論提供者是透過 `tools.web.search.provider` 明確選取，或是透過自動偵測選取。在自動偵測模式中，OpenClaw 只會解析所選提供者的金鑰 -- 未選取的 SecretRef 會保持未啟用，因此你可以保留多個已設定的提供者，而不必為未使用者支付解析成本。
</Note>

## 原生 OpenAI 網路搜尋

直接 OpenAI Responses 模型（`api: "openai-responses"`、提供者 `openai`，沒有 base URL 或使用官方 OpenAI API base URL）會在啟用 OpenClaw 網頁搜尋且未指定受管理提供者時，自動使用 OpenAI 託管的 `web_search` 工具。這是 bundled OpenAI 外掛中的提供者自有行為，不適用於 OpenAI 相容的代理 base URL 或 Azure 路由。將 `tools.web.search.provider` 設為其他提供者（例如 `brave`）可為 OpenAI 模型保留受管理的 `web_search` 工具，或將 `tools.web.search.enabled: false` 設為停用受管理搜尋與原生 OpenAI 搜尋。

## 原生 Codex 網頁搜尋

Codex app-server 執行階段會在啟用網頁搜尋且未選取受管理提供者時，自動使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，因此受管理搜尋無法繞過原生網域限制。OpenClaw 會在託管搜尋不可用、明確停用，或由已選取的受管理提供者取代時，使用受管理工具。OpenClaw 會保持 Codex 獨立的 `web.run` 擴充功能停用（`features.standalone_web_search: false`），因為正式環境 app-server 流量會拒絕其使用者定義的 `web` 命名空間。

- 在 `tools.web.search.openaiCodex` 下設定原生搜尋
- 設定 `tools.web.search.provider: "codex"`，將 Codex Hosted Search 佈建為任何父模型的受管理 `web_search` 提供者。每次呼叫都會執行一次有界的暫時性 Codex app-server 回合，若 Codex 未產生託管的 `webSearch` 項目則失敗。
- `mode: "cached"` 是預設偏好，但 Codex 會將其解析為不受限制 app-server 回合的即時外部存取；設定 `"live"` 可明確請求即時存取
- 將 `tools.web.search.provider` 設為受管理提供者（例如 `brave`），以改用 OpenClaw 受管理的 `web_search`
- 設定 `tools.web.search.openaiCodex.enabled: false` 以退出 Codex 託管搜尋；其他受管理提供者仍可用
- 限制 Codex 原生工具介面也會讓受管理 `web_search` 保持可用
- 設定 `allowedDomains` 時，如果託管搜尋不可用，自動受管理備援會以關閉失敗，避免原生允許清單被繞過
- 停用工具的純 LLM 執行會同時停用原生與受管理搜尋
- `tools.web.search.enabled: false` 會同時停用受管理與原生搜尋

持久生效的 Codex 搜尋政策變更會啟動新的已繫結執行緒，因此已載入的 app-server 執行緒無法保留過期的託管搜尋存取權。每回合的暫時性限制會使用暫時受限執行緒，並保留既有繫結以供稍後恢復。

直接 OpenAI ChatGPT Responses 流量也可以使用 OpenAI 託管的 `web_search` 工具。該獨立路徑仍需透過 `tools.web.search.openaiCodex.enabled: true` 選擇加入，且僅適用於使用 `api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

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

對於不支援原生 Codex 搜尋的執行階段與提供者，Codex 可以透過 OpenClaw 的動態工具命名空間使用受管理的 `web_search` 備援。當你需要 OpenClaw 提供者特定的網路控制，而不是 Codex 託管搜尋時，請使用明確的受管理提供者。

選取 `provider: "codex"` 會啟用 bundled `codex` 外掛，並使用上方顯示的相同 `tools.web.search.openaiCodex` 限制。請先使用 `openclaw models auth login --provider openai` 驗證 Codex app-server。父代理可以使用任何模型或執行階段；只有有界搜尋工作者會透過 Codex 執行。

## 網路安全

受管理 HTTP `web_search` 提供者呼叫會使用 OpenClaw 受防護的 fetch 路徑，範圍限於目前提供者自己的主機名稱。僅對該主機名稱，OpenClaw 允許 Surge、Clash 與 sing-box 在 `198.18.0.0/15` 和 `fc00::/7` 中的 fake-IP DNS 回答。其他 private、loopback、link-local 與 metadata 目的地仍會被封鎖。Codex Hosted Search 是例外：其有界工作者會將網路存取委派給 Codex app-server 託管的 `web_search` 工具。

此自動允許不適用於任意 `web_fetch` URL。對於 `web_fetch`，僅在你信任的代理擁有這些合成範圍時，才明確啟用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

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

提供者特定設定（API 金鑰、base URL、模式）位於 `plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 也可以將 `models.providers.google.apiKey` 和 `models.providers.google.baseUrl` 作為較低優先順序的備援，排在其專用網頁搜尋設定與 `GEMINI_API_KEY` 之後。請參閱提供者頁面取得範例。
Grok 也可以重用來自 `openclaw models auth login
--provider xai --method oauth` 的 xAI OAuth 驗證設定檔；API 金鑰設定仍是備援。

`tools.web.search.provider` 會根據 bundled 與已安裝外掛 manifest 宣告的網頁搜尋提供者 ID 進行驗證。像 `"brvae"` 這樣的拼字錯誤會使設定驗證失敗，而不是靜默退回自動偵測。如果設定的提供者只有過期外掛證據，例如解除安裝第三方外掛後留下的 `plugins.entries.<plugin>` 區塊，OpenClaw 會保持啟動具韌性並回報警告，讓你可以重新安裝外掛或執行 `openclaw doctor --fix` 清理過期設定。

`web_fetch` 備援提供者選取是分開的：

- 使用 `tools.web.fetch.provider` 選擇
- 或省略該欄位，讓 OpenClaw 從已設定憑證中自動偵測第一個就緒的 web-fetch 提供者
- 非沙箱化 `web_fetch` 可使用宣告 `contracts.webFetchProviders` 的已安裝外掛提供者；沙箱化 fetch 允許 bundled 提供者與已驗證的官方外掛安裝，但排除第三方外部外掛
- 官方 Firecrawl 外掛是目前唯一的 bundled `webFetchProviders` 貢獻者，設定於 `plugins.entries.firecrawl.config.webFetch.*` 下

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

對於 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它使用與聊天相同的 xAI 驗證設定檔，或 Grok 網頁搜尋使用的 `XAI_API_KEY` / 外掛網頁搜尋憑證。
舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動遷移。
當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 Grok 時，OpenClaw 也會在 Grok 設定完成後，使用相同憑證提供選用的 `x_search` 設定。這是 Grok 路徑中的獨立後續步驟，而不是另一個頂層網頁搜尋提供者選項。如果你選擇其他提供者，OpenClaw 不會顯示 `x_search` 提示。

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

| 參數                  | 說明                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 搜尋查詢（必填）                                                   |
| `count`               | 要回傳的結果數（1-10，預設：5）                                    |
| `country`             | 2 字母 ISO 國家/地區代碼（例如 "US"、"DE"）                        |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"）                              |
| `search_lang`         | 搜尋語言代碼（僅 Brave）                                           |
| `freshness`           | 時間篩選器：`day`、`week`、`month` 或 `year`                       |
| `date_after`          | 此日期之後的結果（YYYY-MM-DD）                                     |
| `date_before`         | 此日期之前的結果（YYYY-MM-DD）                                     |
| `ui_lang`             | UI 語言代碼（僅 Brave）                                            |
| `domain_filter`       | 網域允許清單/拒絕清單陣列（僅 Perplexity）                         |
| `max_tokens`          | 總內容 token 預算，僅原生 Perplexity Search API                    |
| `max_tokens_per_page` | 每頁擷取 token 限制，僅原生 Perplexity Search API                  |

<Warning>
  並非所有參數都適用於所有提供者。Brave `llm-context` 模式會拒絕 `ui_lang`；`date_before` 也需要 `date_after`，因為 Brave 自訂 freshness 範圍需要開始與結束日期。
  Gemini、Grok 與 Kimi 會回傳一個帶引用的合成答案。它們接受 `count` 以維持共用工具相容性，但不會改變 grounded 答案形狀。Gemini 會將 `day` freshness 視為近期提示；較寬的 freshness 值與明確日期會設定 Google Search grounding 時間範圍。
  當你使用 Sonar/OpenRouter 相容路徑（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）時，Perplexity 也會以相同方式運作；該路徑也會捨棄 `max_tokens` 與 `max_tokens_per_page` 支援。
  SearXNG 僅接受可信 private-network 或 loopback 主機使用 `http://`；
  公開 SearXNG 端點必須使用 `https://`。
  Firecrawl 與 Tavily 透過 `web_search` 僅支援 `query` 和 `count`
  -- 進階選項請使用它們的專用工具。
</Warning>

## x_search

`x_search` 會使用 xAI 查詢 X（前 Twitter）貼文，並回傳帶引用的 AI 合成答案。它接受自然語言查詢與選用的結構化篩選器。OpenClaw 會依每個請求建構內建 xAI `x_search` 工具，而不是永久註冊，因此它只會在實際呼叫它的回合中啟用。

<Note>
  xAI 文件記載 `x_search` 支援關鍵字搜尋、語意搜尋、使用者搜尋與對話串擷取。對於每則貼文的互動統計資料（例如 reposts、replies、bookmarks 或 views），建議針對確切貼文 URL 或 status ID 進行目標查詢。廣泛關鍵字搜尋可能會找到正確貼文，但回傳較不完整的每則貼文 metadata。良好模式是：先定位貼文，然後執行第二個聚焦於該確切貼文的 `x_search` 查詢。
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

設定 `plugins.entries.xai.config.xSearch.baseUrl` 時，`x_search` 會傳送 POST 到 `<baseUrl>/responses`。如果省略該欄位，它會退回使用 `plugins.entries.xai.config.webSearch.baseUrl`，接著是舊版 `tools.web.search.grok.baseUrl`，最後是公開 xAI 端點（`https://api.x.ai/v1`）。

### x_search 參數

| 參數                         | 說明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜尋查詢（必要）                                      |
| `allowed_x_handles`          | 將結果限制為特定 X 帳號                               |
| `excluded_x_handles`         | 排除特定 X 帳號                                       |
| `from_date`                  | 僅包含此日期當天或之後的貼文（YYYY-MM-DD）            |
| `to_date`                    | 僅包含此日期當天或之前的貼文（YYYY-MM-DD）            |
| `enable_image_understanding` | 讓 xAI 檢查相符貼文所附加的圖片                       |
| `enable_video_understanding` | 讓 xAI 檢查相符貼文所附加的影片                       |

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

如果你使用工具設定檔或允許清單，請加入 `web_search`、`x_search` 或 `group:web`：

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
- [網頁瀏覽器](/zh-TW/tools/browser) -- 適用於大量使用 JS 網站的完整瀏覽器自動化
- [Grok 搜尋](/zh-TW/tools/grok-search) -- 以 Grok 作為 `web_search` 提供者
- [Ollama 網頁搜尋](/zh-TW/tools/ollama-search) -- 透過你的 Ollama 主機進行免金鑰網頁搜尋
