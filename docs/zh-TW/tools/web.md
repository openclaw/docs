---
read_when:
    - 你想要啟用或設定 web_search
    - 你想要啟用或設定 x_search
    - 你需要選擇搜尋服務供應商
    - 你想瞭解自動偵測與供應商選擇
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜尋網路、搜尋 X 貼文或擷取頁面內容
title: 網路搜尋
x-i18n:
    generated_at: "2026-07-12T14:55:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` 會使用你設定的供應商搜尋網路，並傳回
標準化結果；結果會依查詢快取 15 分鐘（可設定）。OpenClaw
也內建用於搜尋 X（前稱 Twitter）貼文的 `x_search`，以及用於
輕量擷取 URL 的 `web_fetch`。`web_fetch` 一律在本機執行；當 Grok
是供應商時，`web_search` 會透過 xAI Responses 路由，而 `x_search`
一律使用 xAI Responses。

<Info>
  `web_search` 是輕量 HTTP 工具，而非瀏覽器自動化工具。對於
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
    這會儲存供應商及所有必要的認證資訊。對於 API 型
    供應商，你也可以改為設定供應商的環境變數（例如
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
    提供含摘要片段的結構化結果。支援 `llm-context` 模式及國家／語言篩選條件。提供免費方案。
  </Card>
  <Card title="Codex 託管搜尋" icon="search" href="/zh-TW/plugins/codex-harness">
    透過你的 Codex app-server 帳號，提供以來源為依據、由 AI 綜合產生的回答。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    無需金鑰的供應商。不需要 API 金鑰。非官方的 HTML 型整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    結合神經網路與關鍵字搜尋，並提供內容擷取（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    提供結構化結果。最適合搭配 `firecrawl_search` 與 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google 搜尋依據提供含引用、由 AI 綜合產生的回答。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI 網路依據提供含引用、由 AI 綜合產生的回答。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot 網路搜尋提供含引用、由 AI 綜合產生的回答；若退回無依據的聊天模式，會明確失敗。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Token Plan 搜尋 API 提供結構化結果。
  </Card>
  <Card title="Ollama 網路搜尋" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或託管的 Ollama API 進行搜尋。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-TW/tools/parallel-search">
    付費 Parallel Search API（`PARALLEL_API_KEY`）；提供更高的速率限制及目標調校。
  </Card>
  <Card title="Parallel Search（免費）" icon="layer-group" href="/zh-TW/tools/parallel-search">
    無需金鑰，需主動選用。Parallel 的免費 Search MCP，提供針對 LLM 最佳化的密集摘錄，且不需要 API 金鑰。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    提供結構化結果，並具備內容擷取控制與網域篩選功能。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自行託管的中繼搜尋。不需要 API 金鑰。彙整 Google、Bing、DuckDuckGo 等搜尋引擎。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    提供結構化結果，並具備搜尋深度、主題篩選及用於 URL 擷取的 `tavily_extract`。
  </Card>
</CardGroup>

### 供應商比較

| 供應商                                           | 結果樣式                                                       | 篩選條件                                         | API 金鑰                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)                     | 結構化摘要片段                                                 | 國家、語言、時間、`llm-context` 模式             | `BRAVE_API_KEY`                                                                         |
| [Codex 託管搜尋](/zh-TW/plugins/codex-harness)         | AI 綜合產生 + 來源 URL                                         | 網域、內容大小、使用者位置                       | 無；使用 Codex/OpenAI 登入                                                             |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)           | 結構化摘要片段                                                 | --                                               | 無（無需金鑰）                                                                          |
| [Exa](/zh-TW/tools/exa-search)                         | 結構化 + 擷取內容                                              | 神經網路／關鍵字模式、日期、內容擷取             | `EXA_API_KEY`                                                                           |
| [Firecrawl](/zh-TW/tools/firecrawl)                    | 結構化摘要片段                                                 | 透過 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/zh-TW/tools/gemini-search)                   | AI 綜合產生 + 引用                                             | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/zh-TW/tools/grok-search)                       | AI 綜合產生 + 引用                                             | --                                               | xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`               |
| [Kimi](/zh-TW/tools/kimi-search)                       | AI 綜合產生 + 引用；退回無依據的聊天模式時會失敗              | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/zh-TW/tools/minimax-search)          | 結構化摘要片段                                                 | 區域（`global` / `cn`）                          | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama 網路搜尋](/zh-TW/tools/ollama-search)          | 結構化摘要片段                                                 | --                                               | 已登入的本機主機不需要；直接搜尋 `https://ollama.com` 則需 `OLLAMA_API_KEY`             |
| [Parallel](/zh-TW/tools/parallel-search)               | 依 LLM 內容相關性排序的密集摘錄                                | --                                               | `PARALLEL_API_KEY`（付費）                                                              |
| [Parallel Search（免費）](/zh-TW/tools/parallel-search) | 依 LLM 內容相關性排序的密集摘錄                                | --                                               | 無（免費 Search MCP）                                                                   |
| [Perplexity](/zh-TW/tools/perplexity-search)           | 結構化摘要片段                                                 | 國家、語言、時間、網域、內容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/zh-TW/tools/searxng-search)                 | 結構化摘要片段                                                 | 類別、語言                                       | 無（自行託管）                                                                          |
| [Tavily](/zh-TW/tools/tavily)                          | 結構化摘要片段                                                 | 透過 `tavily_search` 工具                        | `TAVILY_API_KEY`                                                                        |

## 自動偵測

文件及設定流程中的供應商清單按字母排序。自動偵測使用
另一套固定的優先順序，而且找到已設定的供應商時，只會選擇需要
認證資訊的供應商（`requiresCredential !== false`）。若未設定
`provider`，OpenClaw 會依下列順序檢查供應商，並使用
第一個就緒的供應商：

優先檢查 API 型供應商：

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

接著檢查已設定端點的供應商：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search（免費）**、**DuckDuckGo**、
**Ollama 網路搜尋**及 **Codex 託管搜尋**等無需金鑰的供應商，
即使具有內部順序值，也絕不會在自動偵測中獲選。只有當你
透過 `tools.web.search.provider` 明確選取，或使用
`openclaw configure --section web` 選取時，才會使用這些供應商。OpenClaw 不會僅因為沒有設定
API 型供應商，就將受管理的 `web_search` 查詢傳送至無需金鑰的
供應商。

OpenAI Responses 模型是例外：未設定 `tools.web.search.provider`
時，這些模型會使用 OpenAI 的原生網路搜尋，而非上述受管理的
供應商（請見下文）。將 `tools.web.search.provider` 設為
`parallel-free`（或其他供應商），即可改為透過受管理的路徑
路由這些模型。

<Note>
  所有供應商金鑰欄位都支援 SecretRef 物件。在
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下的外掛範圍 SecretRef
  會針對已安裝的 API 型網路搜尋供應商進行解析，包括 Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 及 Tavily，
  無論供應商是透過 `tools.web.search.provider` 明確指定，
  還是透過自動偵測選取。在自動偵測模式中，OpenClaw 只會解析
  所選供應商的金鑰；未選取的 SecretRef 會保持非作用中，因此你可以
  設定多個供應商，而無須為未使用的供應商支付解析成本。
</Note>

## OpenAI 原生網路搜尋

直接使用 OpenAI Responses 模型（`api: "openai-responses"`、供應商為 `openai`，且未設定基礎 URL 或使用官方 OpenAI API 基礎 URL）時，若已啟用 OpenClaw 網頁搜尋且未指定受管理的供應商，便會自動使用 OpenAI 託管的 `web_search` 工具。這是隨附 OpenAI 外掛中由供應商負責的行為，不適用於 OpenAI 相容代理伺服器的基礎 URL 或 Azure 路由。若要讓 OpenAI 模型繼續使用受管理的 `web_search` 工具，請將 `tools.web.search.provider` 設為其他供應商（例如 `brave`）；若要同時停用受管理搜尋與 OpenAI 原生搜尋，請設定 `tools.web.search.enabled: false`。

## 原生 Codex 網頁搜尋

啟用網頁搜尋且未選取受管理的供應商時，Codex app-server 執行階段會自動使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 受管理的 `web_search` 動態工具互斥，因此受管理搜尋無法繞過原生網域限制。當託管搜尋無法使用、明確停用，或由所選的受管理供應商取代時，OpenClaw 會使用受管理工具。OpenClaw 會保持停用 Codex 的獨立 `web.run` 擴充功能（`features.standalone_web_search: false`），因為正式環境的 app-server 流量會拒絕使用者定義的 `web` 命名空間。

- 在 `tools.web.search.openaiCodex` 下設定原生搜尋
- 將 `tools.web.search.provider: "codex"` 設為由 Codex 託管搜尋充當任何父模型的受管理 `web_search` 供應商。每次呼叫都會執行一次受限的暫時性 Codex app-server 回合；若 Codex 未發出託管的 `webSearch` 項目，呼叫便會失敗。
- `mode: "cached"` 是預設偏好設定，但對不受限制的 app-server 回合，Codex 會將其解析為即時外部存取；設定 `"live"` 可明確要求即時存取
- 將 `tools.web.search.provider` 設為 `brave` 等受管理供應商，即可改用 OpenClaw 受管理的 `web_search`
- 設定 `tools.web.search.openaiCodex.enabled: false` 可選擇退出 Codex 託管搜尋；其他受管理供應商仍可使用
- 限制 Codex 原生工具介面時，受管理的 `web_search` 仍可使用
- 設定 `allowedDomains` 時，若託管搜尋無法使用，自動受管理備援會採取封閉式失敗，以免繞過原生允許清單
- 停用工具、僅使用 LLM 的執行會同時停用原生搜尋與受管理搜尋
- `tools.web.search.enabled: false` 會同時停用受管理搜尋與原生搜尋

持久生效的 Codex 搜尋政策變更會啟動新的綁定執行緒，避免已載入的 app-server 執行緒繼續保有過時的託管搜尋存取權。每回合的暫時性限制會使用臨時受限執行緒，並保留現有綁定以供稍後繼續執行。

直接的 OpenAI ChatGPT Responses 流量也能使用 OpenAI 託管的 `web_search` 工具。這個獨立路徑仍須透過 `tools.web.search.openaiCodex.enabled: true` 選擇啟用，且僅適用於使用 `api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // 選用：也可從非 Codex 父模型使用 Codex 託管搜尋。
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

對於不支援原生 Codex 搜尋的執行階段和供應商，Codex 可透過 OpenClaw 的動態工具命名空間使用受管理的 `web_search` 備援。若你需要使用 OpenClaw 針對特定供應商的網路控制，而非 Codex 託管搜尋，請明確指定受管理供應商。

選取 `provider: "codex"` 會啟用隨附的 `codex` 外掛，並使用上述相同的 `tools.web.search.openaiCodex` 限制。請先使用 `openclaw models auth login --provider openai` 驗證 Codex app-server。父代理程式可使用任何模型或執行階段；只有受限搜尋工作程序會透過 Codex 執行。

## 網路安全

受管理的 HTTP `web_search` 供應商呼叫會使用 OpenClaw 的防護式擷取路徑，範圍限定於目前供應商本身的主機名稱。OpenClaw 僅針對該主機名稱允許 Surge、Clash 和 sing-box 在 `198.18.0.0/15` 與 `fc00::/7` 範圍內的假 IP DNS 回應。其他私人、迴路、連結本機及中繼資料目的地仍會遭到封鎖。Codex 託管搜尋是例外：其受限工作程序會將網路存取委派給 Codex app-server 託管的 `web_search` 工具。

這項自動允許不適用於任意 `web_fetch` URL。對於 `web_fetch`，只有在你信任的代理伺服器擁有這些合成範圍時，才應明確啟用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 與 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

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

供應商專屬設定（API 金鑰、基礎 URL、模式）位於 `plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 也可重複使用 `models.providers.google.apiKey` 和 `models.providers.google.baseUrl`，作為其專用網頁搜尋設定與 `GEMINI_API_KEY` 之後的低優先順序備援。範例請參閱各供應商頁面。
Grok 也可重複使用來自 `openclaw models auth login
--provider xai --method oauth` 的 xAI OAuth 驗證設定檔；API 金鑰設定仍作為備援。

系統會依據隨附與已安裝外掛資訊清單所宣告的網頁搜尋供應商 ID 驗證 `tools.web.search.provider`。像 `"brvae"` 這類拼字錯誤會導致設定驗證失敗，而不會默默退回自動偵測。若已設定的供應商僅剩過時的外掛證據，例如解除安裝第三方外掛後遺留的 `plugins.entries.<plugin>` 區塊，OpenClaw 仍會保持啟動韌性並回報警告，讓你能重新安裝外掛，或執行 `openclaw doctor --fix` 清理過時設定。

`web_fetch` 的備援供應商選取機制彼此獨立：

- 使用 `tools.web.fetch.provider` 選取
- 或省略該欄位，讓 OpenClaw 從已設定認證資訊中自動偵測第一個就緒的網頁擷取供應商
- 非沙箱化的 `web_fetch` 可使用宣告 `contracts.webFetchProviders` 的已安裝外掛供應商；沙箱化擷取允許隨附供應商與經驗證的官方外掛安裝項目，但排除第三方外部外掛
- 官方 Firecrawl 外掛目前是唯一隨附的 `webFetchProviders` 提供者，設定位置為 `plugins.entries.firecrawl.config.webFetch.*`

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

對於 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它會使用與聊天相同的 xAI 驗證設定檔，或 Grok 網頁搜尋所使用的 `XAI_API_KEY`／外掛網頁搜尋認證資訊。
舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動遷移。
在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 Grok 時，OpenClaw 也會在 Grok 設定完成後，立即使用相同的認證資訊提供選用的 `x_search` 設定。這是 Grok 路徑內獨立的後續步驟，而不是另一個頂層網頁搜尋供應商選項。若你選擇其他供應商，OpenClaw 不會顯示 `x_search` 提示。

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

    若是閘道安裝，請將其放入 `~/.openclaw/.env`。
    請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具參數

| 參數                  | 說明                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 搜尋查詢（必填）                                                   |
| `count`               | 要傳回的結果數（1-10，預設值：5）                                 |
| `country`             | 2 位字母的 ISO 國家代碼（例如 "US"、"DE"）                        |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"）                             |
| `search_lang`         | 搜尋語言代碼（僅限 Brave）                                        |
| `freshness`           | 時間篩選條件：`day`、`week`、`month` 或 `year`                    |
| `date_after`          | 此日期之後的結果（YYYY-MM-DD）                                     |
| `date_before`         | 此日期之前的結果（YYYY-MM-DD）                                     |
| `ui_lang`             | UI 語言代碼（僅限 Brave）                                         |
| `domain_filter`       | 網域允許清單／拒絕清單陣列（僅限 Perplexity）                     |
| `max_tokens`          | 內容權杖總預算，僅限原生 Perplexity Search API                    |
| `max_tokens_per_page` | 每頁擷取權杖限制，僅限原生 Perplexity Search API                  |

<Warning>
  並非所有參數都適用於所有供應商。Brave 的 `llm-context` 模式會拒絕 `ui_lang`；`date_before` 也必須搭配 `date_after`，因為 Brave 的自訂時效範圍同時需要開始與結束日期。
  Gemini、Grok 和 Kimi 會傳回一個附有引用的綜合答案。它們會接受 `count` 以相容共用工具，但該參數不會改變有依據答案的形式。Gemini 將 `day` 時效視為近期性提示；更寬的時效值和明確日期會設定 Google Search 依據的時間範圍。
  使用 Sonar/OpenRouter 相容路徑（`plugins.entries.perplexity.config.webSearch.baseUrl`／`model` 或 `OPENROUTER_API_KEY`）時，Perplexity 的行為也相同；該路徑也不支援 `max_tokens` 和 `max_tokens_per_page`。
  SearXNG 僅允許受信任私人網路或迴路主機使用 `http://`；公開 SearXNG 端點必須使用 `https://`。
  Firecrawl 和 Tavily 透過 `web_search` 僅支援 `query` 與 `count`——如需進階選項，請使用它們的專用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查詢 X（前身為 Twitter）貼文，並傳回附有引用的 AI 綜合答案。它接受自然語言查詢及選用的結構化篩選條件。OpenClaw 會針對每個要求建立內建的 xAI `x_search` 工具，而非永久註冊，因此它只會在實際呼叫該工具的回合中生效。

<Warning>
  `x_search` 在 xAI 的伺服器上執行。xAI 對每 1,000 次工具呼叫收費 $5，另加模型的輸入與輸出權杖費用。
</Warning>

<Note>
  xAI 文件指出，`x_search` 支援關鍵字搜尋、語意搜尋、使用者搜尋和討論串擷取。若要取得每篇貼文的互動統計資料，例如轉貼、回覆、書籤或瀏覽次數，建議針對確切的貼文 URL 或狀態 ID 進行定向查詢。廣泛的關鍵字搜尋可能會找到正確貼文，但傳回的每篇貼文中繼資料可能較不完整。建議的做法是：先找出貼文，再執行第二次 `x_search` 查詢，聚焦於該篇確切貼文。
</Note>

### x_search 設定

省略 `enabled` 時，只有在使用中模型的提供者為 `xai`，且能解析 xAI 認證資訊時，才會公開 `x_search`。如果使用中模型具有已知的非 xAI 提供者，請將 `plugins.entries.xai.config.xSearch.enabled` 設為 `true`，以選擇啟用跨提供者使用。如果使用中模型的提供者缺失或無法解析，此工具會維持隱藏。將 `enabled` 設為 `false`，即可對所有提供者停用此工具。使用此工具一律需要 xAI 認證資訊。

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // 已知的非 xAI 模型提供者必須設定
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // 選用，覆寫 webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // 若已設定 xAI 驗證設定檔或 XAI_API_KEY，則為選用
            baseUrl: "https://api.x.ai/v1", // 選用的共用 xAI Responses 基礎 URL
          },
        },
      },
    },
  },
}
```

設定 `plugins.entries.xai.config.xSearch.baseUrl` 時，`x_search` 會向 `<baseUrl>/responses` 傳送 POST 要求。如果省略該欄位，則會依序回退至 `plugins.entries.xai.config.webSearch.baseUrl`、舊版 `tools.web.search.grok.baseUrl`，最後回退至公開的 xAI 端點（`https://api.x.ai/v1`）。

### x_search 參數

| 參數                         | 說明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜尋查詢（必填）                                       |
| `allowed_x_handles`          | 將結果限制為最多 20 個 X 帳號代稱                      |
| `excluded_x_handles`         | 排除最多 20 個 X 帳號代稱                              |
| `from_date`                  | 僅包含此日期當天或之後的貼文（YYYY-MM-DD）             |
| `to_date`                    | 僅包含此日期當天或之前的貼文（YYYY-MM-DD）             |
| `enable_image_understanding` | 讓 xAI 檢查相符貼文所附的圖片                          |
| `enable_video_understanding` | 讓 xAI 檢查相符貼文所附的影片                          |

`allowed_x_handles` 與 `excluded_x_handles` 互斥。

### x_search 範例

```javascript
await x_search({
  query: "晚餐食譜",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 各貼文統計資料：如可行，請使用確切的貼文狀態 URL 或狀態 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 範例

```javascript
// 基本搜尋
await web_search({ query: "OpenClaw 外掛 SDK" });

// 德國特定搜尋
await web_search({ query: "線上看電視", country: "DE", language: "de" });

// 最近的結果（過去一週）
await web_search({ query: "AI 發展", freshness: "week" });

// 日期範圍
await web_search({
  query: "氣候研究",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 網域篩選（僅限 Perplexity）
await web_search({
  query: "產品評測",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具設定檔

如果你使用工具設定檔或允許清單，請加入 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]（包含 web_search、x_search 與 web_fetch）
  },
}
```

## 相關內容

- [網頁擷取](/zh-TW/tools/web-fetch) -- 擷取 URL 並提取可閱讀的內容
- [網頁瀏覽器](/zh-TW/tools/browser) -- 針對大量使用 JS 的網站提供完整的瀏覽器自動化
- [Grok 搜尋](/zh-TW/tools/grok-search) -- 使用 Grok 作為 `web_search` 提供者
- [Ollama 網頁搜尋](/zh-TW/tools/ollama-search) -- 透過你的 Ollama 主機進行不需金鑰的網頁搜尋
