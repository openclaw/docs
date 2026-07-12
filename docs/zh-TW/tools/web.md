---
read_when:
    - 您想要啟用或設定 web_search
    - 你想啟用或設定 x_search
    - 你需要選擇搜尋服務供應商
    - 你想瞭解自動偵測與提供者選擇
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch —— 搜尋網路、搜尋 X 貼文，或擷取頁面內容
title: 網頁搜尋
x-i18n:
    generated_at: "2026-07-11T21:54:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` 會使用你設定的供應商搜尋網路並傳回
正規化結果，且依查詢快取 15 分鐘（可設定）。OpenClaw
也內建用於搜尋 X（前身為 Twitter）貼文的 `x_search`，以及用於
輕量擷取 URL 的 `web_fetch`。`web_fetch` 一律在本機執行；當 Grok 為供應商時，
`web_search` 會透過 xAI Responses 路由，而 `x_search` 一律使用
xAI Responses。

<Info>
  `web_search` 是輕量級 HTTP 工具，而非瀏覽器自動化工具。對於
  大量使用 JS 的網站或需要登入的情況，請使用[網頁瀏覽器](/zh-TW/tools/browser)。若要
  擷取特定 URL，請使用[網頁擷取](/zh-TW/tools/web-fetch)。
</Info>

## 快速開始

<Steps>
  <Step title="選擇供應商">
    選擇供應商並完成所有必要設定。部分供應商
    不需要金鑰，其他供應商則需要 API 金鑰。詳情請參閱下方的
    供應商頁面。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    此命令會儲存供應商及所有必要的憑證。對於以 API 為基礎的
    供應商，你也可以改為設定該供應商的環境變數（例如
    `BRAVE_API_KEY`），並略過此步驟。
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

## 選擇供應商

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-TW/tools/brave-search">
    提供含摘要片段的結構化結果。支援 `llm-context` 模式及國家／語言篩選。提供免費方案。
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/zh-TW/plugins/codex-harness">
    透過你的 Codex app-server 帳號提供有依據的 AI 綜合回答。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    無須金鑰的供應商。不需要 API 金鑰。非官方的 HTML 型整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    結合神經與關鍵字搜尋，並可擷取內容（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    提供結構化結果。最適合搭配 `firecrawl_search` 與 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google Search 依據功能提供附引用來源的 AI 綜合回答。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI 網路依據功能提供附引用來源的 AI 綜合回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot 網路搜尋提供附引用來源的 AI 綜合回答；若退回無依據的聊天模式，會明確失敗。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Token Plan 搜尋 API 提供結構化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或託管的 Ollama API 搜尋。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-TW/tools/parallel-search">
    付費的 Parallel Search API（`PARALLEL_API_KEY`）；提供較高的速率限制與目標調校。
  </Card>
  <Card title="Parallel Search（免費）" icon="layer-group" href="/zh-TW/tools/parallel-search">
    無須金鑰，可選擇啟用。Parallel 的免費 Search MCP，提供針對大型語言模型最佳化的密集摘錄，且不需要 API 金鑰。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    提供結構化結果，並具備內容擷取控制與網域篩選。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自行託管的後設搜尋。不需要 API 金鑰。彙整 Google、Bing、DuckDuckGo 等來源。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    提供結構化結果，具備搜尋深度與主題篩選功能，並可使用 `tavily_extract` 擷取 URL 內容。
  </Card>
</CardGroup>

### 供應商比較

| 供應商                                           | 結果形式                                                       | 篩選條件                                         | API 金鑰                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)                     | 結構化摘要片段                                                 | 國家、語言、時間、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/zh-TW/plugins/codex-harness)    | AI 綜合內容 + 來源 URL                                         | 網域、內容大小、使用者位置                       | 無；使用 Codex/OpenAI 登入                                                             |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)           | 結構化摘要片段                                                 | --                                               | 無（無須金鑰）                                                                          |
| [Exa](/zh-TW/tools/exa-search)                         | 結構化內容 + 擷取內容                                          | 神經／關鍵字模式、日期、內容擷取                 | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-TW/tools/firecrawl)                    | 結構化摘要片段                                                 | 透過 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-TW/tools/gemini-search)                   | AI 綜合內容 + 引用來源                                         | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-TW/tools/grok-search)                       | AI 綜合內容 + 引用來源                                         | --                                               | xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/zh-TW/tools/kimi-search)                       | AI 綜合內容 + 引用來源；若退回無依據聊天模式則失敗             | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-TW/tools/minimax-search)          | 結構化摘要片段                                                 | 區域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/zh-TW/tools/ollama-search)        | 結構化摘要片段                                                 | --                                               | 已登入的本機主機不需要；直接搜尋 `https://ollama.com` 則需 `OLLAMA_API_KEY`             |
| [Parallel](/zh-TW/tools/parallel-search)               | 依大型語言模型內容相關性排序的密集摘錄                         | --                                               | `PARALLEL_API_KEY`（付費）                                                              |
| [Parallel Search（免費）](/zh-TW/tools/parallel-search) | 依大型語言模型內容相關性排序的密集摘錄                         | --                                               | 無（免費 Search MCP）                                                                   |
| [Perplexity](/zh-TW/tools/perplexity-search)           | 結構化摘要片段                                                 | 國家、語言、時間、網域、內容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-TW/tools/searxng-search)                 | 結構化摘要片段                                                 | 類別、語言                                       | 無（自行託管）                                                                          |
| [Tavily](/zh-TW/tools/tavily)                          | 結構化摘要片段                                                 | 透過 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自動偵測

文件與設定流程中的供應商清單依字母順序排列。自動偵測使用
另一套固定的優先順序，而且只有在找到已設定的供應商時，才會選擇需要
憑證（`requiresCredential !== false`）的供應商。如果未設定
`provider`，OpenClaw 會依下列順序檢查供應商，並使用第一個
已就緒的供應商：

首先檢查以 API 為基礎的供應商：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（順序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；可選的 `plugins.entries.exa.config.webSearch.baseUrl` 會覆寫 Exa 端點（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）
10. **Parallel** -- 透過 `PARALLEL_API_KEY` 或 `plugins.entries.parallel.config.webSearch.apiKey` 使用付費 Parallel Search API；可選的 `plugins.entries.parallel.config.webSearch.baseUrl` 會覆寫端點（順序 75）

接著檢查已設定端點的供應商：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search（免費）**、**DuckDuckGo**、
**Ollama Web Search** 和 **Codex Hosted Search** 等無須金鑰的供應商，
即使具有內部順序值，也絕不會在自動偵測中勝出。
只有當你透過 `tools.web.search.provider` 明確選取它們，或使用
`openclaw configure --section web` 選取時，才會使用這些供應商。OpenClaw 不會因為
未設定以 API 為基礎的供應商，就將受管理的
`web_search` 查詢傳送至無須金鑰的供應商。

OpenAI Responses 模型是例外：當 `tools.web.search.provider`
未設定時，它們會使用 OpenAI 的原生網路搜尋，而非上述受管理的
供應商（請見下文）。將 `tools.web.search.provider` 設為
`parallel-free`（或其他供應商），即可改為透過受管理的路徑
路由。

<Note>
  所有供應商金鑰欄位都支援 SecretRef 物件。位於
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下的外掛範圍 SecretRef，
  會針對已安裝且以 API 為基礎的網路搜尋供應商進行解析，包括 Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 和 Tavily，
  無論是透過 `tools.web.search.provider` 明確選擇供應商，或
  透過自動偵測選取皆同。在自動偵測模式下，OpenClaw 只會解析
  所選供應商的金鑰；未選取的 SecretRef 會保持停用，因此你可以
  設定多個供應商，而不必為未使用的供應商
  支付解析成本。
</Note>

## OpenAI 原生網路搜尋

直接使用 OpenAI Responses 模型（`api: "openai-responses"`、供應商為 `openai`，且未設定基礎 URL 或使用官方 OpenAI API 基礎 URL）時，若已啟用 OpenClaw 網頁搜尋且未固定任何託管供應商，會自動使用 OpenAI 託管的 `web_search` 工具。這是內建 OpenAI 外掛中由供應商負責的行為，不適用於 OpenAI 相容代理伺服器的基礎 URL 或 Azure 路由。將 `tools.web.search.provider` 設為其他供應商（例如 `brave`），即可讓 OpenAI 模型繼續使用託管的 `web_search` 工具；或將 `tools.web.search.enabled: false` 設為停用，以同時停用託管搜尋與 OpenAI 原生搜尋。

## 原生 Codex 網頁搜尋

當已啟用網頁搜尋且未選取託管供應商時，Codex app-server 執行階段會自動使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 的託管 `web_search` 動態工具互斥，因此託管搜尋無法繞過原生網域限制。當託管搜尋無法使用、明確停用，或由已選取的託管供應商取代時，OpenClaw 會使用託管工具。OpenClaw 會保持停用 Codex 的獨立 `web.run` 擴充功能（`features.standalone_web_search: false`），因為正式環境的 app-server 流量會拒絕使用者自訂的 `web` 命名空間。

- 在 `tools.web.search.openaiCodex` 下設定原生搜尋
- 將 `tools.web.search.provider: "codex"` 設為把 Codex Hosted Search 佈建成任意父模型的託管 `web_search` 供應商。每次呼叫都會執行一次有界限的暫時性 Codex app-server 回合；若 Codex 未產生託管的 `webSearch` 項目，呼叫便會失敗。
- `mode: "cached"` 是預設偏好，但對不受限制的 app-server 回合，Codex 會將其解析為即時外部存取；設為 `"live"` 可明確要求即時存取
- 將 `tools.web.search.provider` 設為 `brave` 等託管供應商，即可改用 OpenClaw 的託管 `web_search`
- 將 `tools.web.search.openaiCodex.enabled: false` 設為不使用 Codex 託管搜尋；其他託管供應商仍可使用
- 限制 Codex 原生工具介面時，也會讓託管 `web_search` 保持可用
- 設定 `allowedDomains` 時，若託管搜尋無法使用，自動託管後援會採取失敗關閉，以免繞過原生允許清單
- 停用工具、僅執行大型語言模型的作業會同時停用原生搜尋與託管搜尋
- `tools.web.search.enabled: false` 會同時停用託管搜尋與原生搜尋

持續有效的 Codex 搜尋政策變更會啟動新的已繫結執行緒，以免已載入的 app-server 執行緒繼續保有過時的託管搜尋存取權。每回合的暫時限制會使用暫時受限執行緒，並保留現有繫結供稍後繼續執行。

直接的 OpenAI ChatGPT Responses 流量也能使用 OpenAI 託管的 `web_search` 工具。這條獨立路徑仍須透過 `tools.web.search.openaiCodex.enabled: true` 明確啟用，且僅適用於使用 `api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // 選用：也可讓非 Codex 父模型使用 Codex Hosted Search。
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

對於不支援原生 Codex 搜尋的執行階段與供應商，Codex 可透過 OpenClaw 的動態工具命名空間使用託管 `web_search` 後援。若需要使用 OpenClaw 特定於供應商的網路控制，而非 Codex 託管搜尋，請明確指定託管供應商。

選取 `provider: "codex"` 會啟用內建的 `codex` 外掛，並使用上方所示的相同 `tools.web.search.openaiCodex` 限制。請先使用 `openclaw models auth login --provider openai` 驗證 Codex app-server。父代理程式可使用任何模型或執行階段；只有有界限的搜尋工作程式會透過 Codex 執行。

## 網路安全性

託管 HTTP `web_search` 供應商呼叫會使用 OpenClaw 受防護的擷取路徑，範圍僅限目前供應商自己的主機名稱。僅對該主機名稱，OpenClaw 允許 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 與 `fc00::/7` 中的假 IP DNS 回應。其他私人、回送、鏈路本機及中繼資料目的地仍會遭到封鎖。Codex Hosted Search 是例外：其有界限的工作程式會將網路存取委派給 Codex app-server 託管的 `web_search` 工具。

這項自動允許不適用於任意 `web_fetch` URL。對於 `web_fetch`，只有當受信任代理伺服器擁有這些合成範圍時，才應明確啟用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 預設值：true
        provider: "brave", // 或省略以自動偵測
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

特定於供應商的設定（API 金鑰、基礎 URL、模式）位於 `plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 也可在其專用網頁搜尋設定和 `GEMINI_API_KEY` 之後，以較低優先順序將 `models.providers.google.apiKey` 和 `models.providers.google.baseUrl` 用作後援。範例請參閱各供應商頁面。
Grok 也可重複使用來自 `openclaw models auth login --provider xai --method oauth` 的 xAI OAuth 驗證設定檔；API 金鑰設定仍作為後援。

`tools.web.search.provider` 會依內建及已安裝外掛資訊清單中宣告的網頁搜尋供應商 ID 進行驗證。像 `"brvae"` 這樣的拼字錯誤會使設定驗證失敗，而不會無聲地退回自動偵測。若已設定的供應商只有過時的外掛證據，例如解除安裝第三方外掛後遺留的 `plugins.entries.<plugin>` 區塊，OpenClaw 會維持啟動韌性並回報警告，讓你可以重新安裝該外掛，或執行 `openclaw doctor --fix` 清理過時設定。

`web_fetch` 後援供應商的選取方式互相獨立：

- 使用 `tools.web.fetch.provider` 選取
- 或省略該欄位，讓 OpenClaw 從已設定的憑證中自動偵測第一個就緒的網頁擷取供應商
- 非沙箱化的 `web_fetch` 可以使用宣告 `contracts.webFetchProviders` 的已安裝外掛供應商；沙箱化擷取允許內建供應商及經驗證的官方外掛安裝，但排除第三方外部外掛
- 官方 Firecrawl 外掛是目前唯一內建的 `webFetchProviders` 貢獻者，其設定位於 `plugins.entries.firecrawl.config.webFetch.*` 下

當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選取 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

若要使用 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它使用與聊天相同的 xAI 驗證設定檔，或使用 Grok 網頁搜尋所用的 `XAI_API_KEY`／外掛網頁搜尋憑證。
舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動遷移。
當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選取 Grok 時，Grok 設定完成後，OpenClaw 也會立即提供使用相同憑證的選用 `x_search` 設定。這是 Grok 路徑內的獨立後續步驟，而非獨立的頂層網頁搜尋供應商選項。若選取其他供應商，OpenClaw 不會顯示 `x_search` 提示。

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
    在閘道程序環境中設定供應商環境變數：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    對於閘道安裝，請將其放入 `~/.openclaw/.env`。
    請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具參數

| 參數                  | 說明                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 搜尋查詢（必填）                                                   |
| `count`               | 要傳回的結果數（1-10，預設值：5）                                 |
| `country`             | 2 字母 ISO 國家代碼（例如 "US"、"DE"）                            |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"）                             |
| `search_lang`         | 搜尋語言代碼（僅限 Brave）                                        |
| `freshness`           | 時間篩選條件：`day`、`week`、`month` 或 `year`                    |
| `date_after`          | 此日期之後的結果（YYYY-MM-DD）                                    |
| `date_before`         | 此日期之前的結果（YYYY-MM-DD）                                    |
| `ui_lang`             | 使用者介面語言代碼（僅限 Brave）                                  |
| `domain_filter`       | 網域允許清單／拒絕清單陣列（僅限 Perplexity）                     |
| `max_tokens`          | 內容權杖總預算，僅限原生 Perplexity Search API                    |
| `max_tokens_per_page` | 每頁擷取權杖上限，僅限原生 Perplexity Search API                  |

<Warning>
  並非所有參數都適用於所有供應商。Brave `llm-context` 模式會拒絕 `ui_lang`；`date_before` 也必須搭配 `date_after`，因為 Brave 自訂時效範圍需要同時提供開始與結束日期。
  Gemini、Grok 和 Kimi 會傳回一個附引文的綜合答案。它們接受 `count` 以相容共用工具，但這不會改變有依據答案的結構。Gemini 將 `day` 時效視為近期程度提示；範圍更廣的時效值及明確日期會設定 Google Search 依據查詢的時間範圍。
  透過 Sonar/OpenRouter 相容路徑（`plugins.entries.perplexity.config.webSearch.baseUrl`／`model` 或 `OPENROUTER_API_KEY`）使用 Perplexity 時，其行為相同；該路徑也不支援 `max_tokens` 和 `max_tokens_per_page`。
  SearXNG 僅允許受信任的私人網路或回送主機使用 `http://`；公開 SearXNG 端點必須使用 `https://`。
  Firecrawl 和 Tavily 透過 `web_search` 僅支援 `query` 和 `count`——進階選項請使用其專用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查詢 X（前身為 Twitter）貼文，並傳回附引文的 AI 綜合答案。它接受自然語言查詢及選用的結構化篩選條件。OpenClaw 會針對每個請求建構內建的 xAI `x_search` 工具，而非永久註冊，因此它只會在實際呼叫該工具的回合中啟用。

<Warning>
  `x_search` 在 xAI 的伺服器上執行。xAI 對每 1,000 次工具呼叫收取 5 美元，另加模型的輸入與輸出權杖費用。
</Warning>

<Note>
  xAI 文件說明 `x_search` 支援關鍵字搜尋、語意搜尋、使用者搜尋及執行緒擷取。若要取得轉貼、回覆、書籤或瀏覽次數等單篇貼文互動統計資料，建議針對確切的貼文 URL 或狀態 ID 進行目標式查詢。廣泛的關鍵字搜尋可能找到正確貼文，但傳回的單篇貼文中繼資料可能較不完整。建議做法是：先找出貼文，再執行第二次 `x_search` 查詢，聚焦於該篇確切貼文。
</Note>

### x_search 設定

省略 `enabled` 時，只有在作用中模型的供應商為 `xai`，且能解析到 xAI 憑證時，才會公開 `x_search`。若作用中模型使用已知的非 xAI 供應商，請將 `plugins.entries.xai.config.xSearch.enabled` 設為 `true`，以選擇啟用跨供應商使用。若作用中模型的供應商缺失或無法解析，此工具會維持隱藏。將 `enabled` 設為 `false`，即可對所有供應商停用此工具。使用此工具一律需要 xAI 憑證。

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // required for a known non-xAI model provider
            model: "grok-4.3",
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

設定 `plugins.entries.xai.config.xSearch.baseUrl` 時，`x_search` 會向 `<baseUrl>/responses` 發出 POST 請求。若省略該欄位，則會依序回退至 `plugins.entries.xai.config.webSearch.baseUrl`、舊版 `tools.web.search.grok.baseUrl`，最後使用公開的 xAI 端點（`https://api.x.ai/v1`）。

### x_search 參數

| 參數                         | 說明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜尋查詢（必填）                                       |
| `allowed_x_handles`          | 將結果限制為最多 20 個 X 使用者名稱                    |
| `excluded_x_handles`         | 排除最多 20 個 X 使用者名稱                            |
| `from_date`                  | 僅包含此日期當天或之後的貼文（YYYY-MM-DD）             |
| `to_date`                    | 僅包含此日期當天或之前的貼文（YYYY-MM-DD）             |
| `enable_image_understanding` | 讓 xAI 檢查符合條件之貼文所附的圖片                    |
| `enable_video_understanding` | 讓 xAI 檢查符合條件之貼文所附的影片                    |

`allowed_x_handles` 與 `excluded_x_handles` 互斥。

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

若使用工具設定檔或允許清單，請加入 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## 相關內容

- [網頁擷取](/zh-TW/tools/web-fetch) -- 擷取 URL 並提取可讀內容
- [網頁瀏覽器](/zh-TW/tools/browser) -- 為大量使用 JS 的網站提供完整瀏覽器自動化
- [Grok 搜尋](/zh-TW/tools/grok-search) -- 使用 Grok 作為 `web_search` 供應商
- [Ollama 網頁搜尋](/zh-TW/tools/ollama-search) -- 透過 Ollama 主機進行免金鑰的網頁搜尋
