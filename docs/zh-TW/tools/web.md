---
read_when:
    - 你想要啟用或設定 `web_search`
    - 你想要啟用或設定 x_search
    - 你需要選擇搜尋服務供應商
    - 你想要瞭解自動偵測與供應商選擇
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch —— 搜尋網路、搜尋 X 貼文或擷取頁面內容
title: 網頁搜尋
x-i18n:
    generated_at: "2026-07-20T00:56:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 997e51064b0cd08d0f30987aa038e2f4a98da22f1094974b45f59c18491bd979
    source_path: tools/web.md
    workflow: 16
---

`web_search` 會使用你設定的提供者搜尋網路並傳回
正規化結果，且依查詢快取 15 分鐘（可設定）。OpenClaw
也內建用於 X（前身為 Twitter）貼文的 `x_search`，以及用於
輕量擷取 URL 的 `web_fetch`。`web_fetch` 一律在本機執行；當 Grok 是提供者時，`web_search` 會透過
xAI Responses 路由，而 `x_search` 一律使用
xAI Responses。

<Info>
  `web_search` 是輕量型 HTTP 工具，不是瀏覽器自動化工具。對於
  大量使用 JS 的網站或登入流程，請使用[網頁瀏覽器](/zh-TW/tools/browser)。若要
  擷取特定 URL，請使用[網頁擷取](/zh-TW/tools/web-fetch)。
</Info>

## 快速開始

<Steps>
  <Step title="選擇提供者">
    選擇提供者並完成所有必要設定。部分提供者
    不需要金鑰，其他則需要 API 金鑰。詳細資訊請參閱下方的
    提供者頁面。
  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    ```
    這會儲存提供者及所有必要的認證資訊。對於以 API 為基礎的
    提供者，你也可以改為設定該提供者的環境變數（例如
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

## 選擇提供者

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/zh-TW/tools/brave-search">
    提供含摘要的結構化結果。支援 `llm-context` 模式及國家／語言篩選。提供免費方案。
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/zh-TW/plugins/codex-harness">
    透過你的 Codex app-server 帳號提供由 AI 綜合且有依據的答案。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/zh-TW/tools/duckduckgo-search">
    無須金鑰的提供者。不需要 API 金鑰。非官方、以 HTML 為基礎的整合。
  </Card>
  <Card title="Exa" icon="brain" href="/zh-TW/tools/exa-search">
    結合神經網路與關鍵字搜尋，並提供內容擷取（重點、文字、摘要）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/zh-TW/tools/firecrawl">
    提供結構化結果。最適合搭配 `firecrawl_search` 與 `firecrawl_scrape` 進行深度擷取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/zh-TW/tools/gemini-search">
    透過 Google 搜尋依據提供含引用的 AI 綜合答案。
  </Card>
  <Card title="Grok" icon="zap" href="/zh-TW/tools/grok-search">
    透過 xAI 網路依據提供含引用的 AI 綜合答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/zh-TW/tools/kimi-search">
    透過 Moonshot 網路搜尋提供含引用的 AI 綜合答案；無依據的聊天後援會明確失敗。
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/zh-TW/tools/minimax-search">
    透過 MiniMax Token Plan 搜尋 API 提供結構化結果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/zh-TW/tools/ollama-search">
    透過已登入的本機 Ollama 主機或託管的 Ollama API 進行搜尋。
  </Card>
  <Card title="Parallel" icon="layer-group" href="/zh-TW/tools/parallel-search">
    付費 Parallel Search API（`PARALLEL_API_KEY`）；提供更高的速率限制與目標調校。
  </Card>
  <Card title="Parallel Search（免費）" icon="layer-group" href="/zh-TW/tools/parallel-search">
    無須金鑰，可選擇啟用。Parallel 的免費 Search MCP，提供針對 LLM 最佳化的密集摘錄，且不需要 API 金鑰。
  </Card>
  <Card title="Perplexity" icon="search" href="/zh-TW/tools/perplexity-search">
    提供結構化結果，並具備內容擷取控制與網域篩選功能。
  </Card>
  <Card title="SearXNG" icon="server" href="/zh-TW/tools/searxng-search">
    自行託管的中繼搜尋。不需要 API 金鑰。彙整 Google、Bing、DuckDuckGo 等搜尋引擎。
  </Card>
  <Card title="Tavily" icon="globe" href="/zh-TW/tools/tavily">
    提供結構化結果，並具備搜尋深度、主題篩選，以及用於 URL 擷取的 `tavily_extract`。
  </Card>
</CardGroup>

### 提供者比較

| 提供者                                           | 結果樣式                                                       | 篩選條件                                         | API 金鑰                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/zh-TW/tools/brave-search)                     | 結構化摘要                                                     | 國家、語言、時間、`llm-context` 模式        | `BRAVE_API_KEY`                                                                      |
| [Codex 託管搜尋](/zh-TW/plugins/codex-harness)         | AI 綜合內容 + 來源 URL                                         | 網域、內容大小、使用者位置                       | 無；使用 Codex/OpenAI 登入                                                             |
| [DuckDuckGo](/zh-TW/tools/duckduckgo-search)           | 結構化摘要                                                     | --                                               | 無（無須金鑰）                                                                          |
| [Exa](/zh-TW/tools/exa-search)                         | 結構化結果 + 擷取內容                                          | 神經網路／關鍵字模式、日期、內容擷取             | `EXA_API_KEY`                                                                      |
| [Firecrawl](/zh-TW/tools/firecrawl)                    | 結構化摘要                                                     | 透過 `firecrawl_search` 工具                     | `FIRECRAWL_API_KEY`                                                                      |
| [Gemini](/zh-TW/tools/gemini-search)                   | AI 綜合內容 + 引用                                             | --                                               | `GEMINI_API_KEY`                                                                      |
| [Grok](/zh-TW/tools/grok-search)                       | AI 綜合內容 + 引用                                             | --                                               | xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`                                    |
| [Kimi](/zh-TW/tools/kimi-search)                       | AI 綜合內容 + 引用；遇到無依據的聊天後援時會失敗              | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                 |
| [MiniMax Search](/zh-TW/tools/minimax-search)          | 結構化摘要                                                     | 區域（`global` / `cn`） | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`                           |
| [Ollama 網路搜尋](/zh-TW/tools/ollama-search)          | 結構化摘要                                                     | --                                               | 已登入的本機主機不需要；直接進行 `https://ollama.com` 搜尋時需使用 `OLLAMA_API_KEY`    |
| [Parallel](/zh-TW/tools/parallel-search)               | 針對 LLM 內容排序的密集摘錄                                   | --                                               | `PARALLEL_API_KEY`（付費）                                                              |
| [Parallel Search（免費）](/zh-TW/tools/parallel-search) | 針對 LLM 內容排序的密集摘錄                                   | --                                               | 無（免費 Search MCP）                                                                   |
| [Perplexity](/zh-TW/tools/perplexity-search)           | 結構化摘要                                                     | 國家、語言、時間、網域、內容限制                 | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                                 |
| [SearXNG](/zh-TW/tools/searxng-search)                 | 結構化摘要                                                     | 類別、語言                                       | 無（自行託管）                                                                          |
| [Tavily](/zh-TW/tools/tavily)                          | 結構化摘要                                                     | 透過 `tavily_search` 工具                     | `TAVILY_API_KEY`                                                                      |

## 結果格式

`web_search` 會在核心工具邊界正規化每個內建及外部外掛提供者。
呼叫端只會收到下列封閉格式之一：

```typescript
type WebSearchOutput =
  | {
      kind: "error";
      provider: string;
      error: "provider_error";
      message: string;
      docs?: string;
    }
  | {
      kind: "results";
      provider: string;
      query: string;
      count: number;
      tookMs?: number;
      results: Array<{
        title: string;
        url: string;
        snippet?: string;
        published?: string;
        siteName?: string;
      }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "answer";
      provider: string;
      query: string;
      tookMs?: number;
      content: string;
      citations?: Array<{ url: string; title?: string }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "raw";
      provider: string;
      data: unknown;
    };
```

結構化提供者使用 `kind: "results"`；綜合型提供者使用
`kind: "answer"`。外部外掛提供者的承載資料若不符合任一格式，
則會基於相容性，以 `kind: "raw"` 原樣傳遞。提供者特定的
欄位，例如原始分數、摘錄、相關搜尋、行內引用
偏移量、模型 ID 或工作階段中繼資料，不會在正規化
分支中傳遞。若提供者較豐富的回應是工作流程的一部分，請使用
該提供者的專用工具。

`externalContent.wrapped: true` 是由邊界本身確保為真的信任標記：
提供者文字（`title`、`snippet`、`siteName`、`content`、引用
標題、錯誤 `message`）會移除任何既有的封裝行，
並在核心邊界只重新封裝一次，因此提供者中繼資料無法偽造
此標記。`query` 一律是要求的查詢，引用與結果 URL
必須可解析為 http(s)，`published` 必須符合 ISO 日期格式，輸出的 URL 會經過正規化，而
含有 `error` 鍵的承載資料一律會回報為 `kind: "error"`，並將
原始提供者代碼保留在封裝訊息中。原始資料直通
承載資料會保留提供者設定的任何標記。

## 自動偵測

文件與設定流程中的提供者清單按字母順序排列。自動偵測採用
另一套固定的優先順序，而且只有在找到已設定認證資訊時，才會選取
需要認證資訊的提供者（`requiresCredential !== false`）。若未設定
`provider`，OpenClaw 會依照下列順序檢查提供者，並使用
第一個已準備就緒的提供者：

以 API 為基礎的提供者優先：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（順序 10）
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（順序 15）
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（順序 20）
4. **Grok** -- xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（順序 30）
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（順序 40）
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（順序 50）
7. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（順序 60）
8. **Exa** -- `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；選用的 `plugins.entries.exa.config.webSearch.baseUrl` 會覆寫 Exa 端點（順序 65）
9. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（順序 70）
10. **Parallel** -- 透過 `PARALLEL_API_KEY` 或 `plugins.entries.parallel.config.webSearch.apiKey` 使用付費的 Parallel Search API；選用的 `plugins.entries.parallel.config.webSearch.baseUrl` 會覆寫端點（順序 75）

接著是已設定的端點提供者：

11. **SearXNG** -- `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（順序 200）

**Parallel Search (Free)**、**DuckDuckGo**、
**Ollama Web Search** 和 **Codex Hosted Search** 等不需要金鑰的提供者，
即使具有內部順序值，也絕不會在自動偵測中勝出。只有當你使用
`tools.web.search.provider` 明確選取，或透過
`openclaw configure --section web` 選取時，才會使用這些提供者。OpenClaw 不會只因為
未設定 API 支援的提供者，就將受管理的 `web_search` 查詢傳送給
不需要金鑰的提供者。

OpenAI Responses 模型是例外：當 `tools.web.search.provider`
未設定時，它們會使用 OpenAI 的原生網頁搜尋，而非上述受管理的
提供者（請見下文）。將 `tools.web.search.provider` 設為
`parallel-free`（或其他提供者），即可改為透過受管理的路徑
路由這些模型。

<Note>
  所有提供者金鑰欄位都支援 SecretRef 物件。位於
  `plugins.entries.<plugin>.config.webSearch.apiKey` 下、以外掛為範圍的 SecretRef，
  會針對已安裝且由 API 支援的網頁搜尋提供者解析，包括 Brave、Exa、Firecrawl、
  Gemini、Grok、Kimi、MiniMax、Parallel、Perplexity 和 Tavily，
  無論提供者是透過 `tools.web.search.provider` 明確選取，
  還是經由自動偵測選取。在自動偵測模式下，OpenClaw 只會解析
  所選提供者的金鑰——未選取的 SecretRef 會維持非啟用狀態，因此你可以
  設定多個提供者，而不必為未使用的提供者支付解析成本。
</Note>

## 原生 OpenAI 網頁搜尋

直接使用 OpenAI Responses 的模型（`api: "openai-responses"`、提供者 `openai`、
沒有基礎 URL 或使用官方 OpenAI API 基礎 URL）會在 OpenClaw 網頁搜尋已啟用且未
固定任何受管理提供者時，自動使用 OpenAI 託管的
`web_search` 工具。這是內建 OpenAI 外掛中由提供者擁有的行為，
不適用於 OpenAI 相容的代理基礎 URL 或 Azure 路由。將
`tools.web.search.provider` 設為其他提供者（例如 `brave`），即可
讓 OpenAI 模型繼續使用受管理的 `web_search` 工具；或將
`tools.web.search.enabled: false` 設定為停用受管理搜尋和原生
OpenAI 搜尋。

## 原生 Codex 網頁搜尋

Codex app-server 執行階段會在網頁搜尋已啟用且未選取受管理提供者時，
自動使用 Codex 託管的 `web_search` 工具。原生託管搜尋與 OpenClaw 受管理的
`web_search` 動態工具互斥，因此受管理搜尋無法繞過原生網域限制。
當託管搜尋無法使用、遭明確停用，或由所選的受管理提供者取代時，
OpenClaw 會使用受管理工具。OpenClaw 會讓 Codex 的獨立
`web.run` 擴充功能維持停用（`features.standalone_web_search: false`），
因為正式環境的 app-server 流量會拒絕其使用者定義的 `web`
命名空間。

- 在 `tools.web.search.openaiCodex` 下設定原生搜尋
- 將 `tools.web.search.provider: "codex"` 設為針對任何父模型，將 Codex Hosted Search
  佈建為受管理的 `web_search` 提供者。每次呼叫都會執行一次
  有界限、暫時性的 Codex app-server 回合；若 Codex 未發出託管的
  `webSearch` 項目，則呼叫失敗。
- `mode: "cached"` 是預設偏好設定，但 Codex 會針對不受限制的
  app-server 回合，將其解析為即時外部存取；設定 `"live"` 可明確要求
  即時存取
- 將 `tools.web.search.provider` 設為受管理提供者（例如 `brave`），以使用
  OpenClaw 受管理的 `web_search`
- 設定 `tools.web.search.openaiCodex.enabled: false` 可選擇不使用 Codex 託管的
  搜尋；其他受管理提供者仍可使用
- 限制 Codex 原生工具介面時，也會讓受管理的 `web_search`
  保持可用
- 設定 `allowedDomains` 時，如果託管搜尋無法使用，
  自動受管理備援會以關閉方式失敗，以避免繞過原生允許清單
- 停用工具、僅執行 LLM 的回合會同時停用原生搜尋和受管理搜尋
- `tools.web.search.enabled: false` 會同時停用受管理搜尋和原生搜尋

持續有效的 Codex 搜尋政策變更會啟動新的繫結執行緒，避免已載入的
app-server 執行緒繼續保有過時的託管搜尋存取權。每回合的暫時限制會使用
臨時受限執行緒，並保留現有繫結以供之後繼續執行。

直接的 OpenAI ChatGPT Responses 流量也能使用 OpenAI 託管的
`web_search` 工具。這條獨立路徑仍須透過
`tools.web.search.openaiCodex.enabled: true` 選擇啟用，且只適用於使用
`api: "openai-chatgpt-responses"` 的合格 `openai/*` 模型。

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // 選用：也從非 Codex 父模型使用 Codex Hosted Search。
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

對於不支援原生 Codex 搜尋的執行階段和提供者，Codex 可透過 OpenClaw 的
動態工具命名空間使用受管理的 `web_search` 備援。當你需要使用
OpenClaw 依提供者而定的網路控制，而非 Codex 託管搜尋時，請使用明確的
受管理提供者。

選取 `provider: "codex"` 會啟用內建的 `codex` 外掛，並使用
上述相同的 `tools.web.search.openaiCodex` 限制。請先使用
`openclaw models auth login --provider openai` 驗證 Codex app-server。
父代理程式可以使用任何模型或執行階段；只有有界限的搜尋工作程式
會透過 Codex 執行。

## 網路安全

受管理的 HTTP `web_search` 提供者呼叫會使用 OpenClaw 受防護的擷取路徑，
其範圍限定為目前提供者本身的主機名稱。僅針對該主機名稱，
OpenClaw 允許位於 `198.18.0.0/15` 和 `fc00::/7` 中的
Surge、Clash 和 sing-box 假 IP DNS 回應。其他私有、迴路、連結本機和
中繼資料目的地仍會遭到封鎖。Codex Hosted Search 是例外：
其有界限的工作程式會將網路存取委派給 Codex app-server 託管的
`web_search` 工具。

這項自動允許不適用於任意的 `web_fetch` URL。針對
`web_fetch`，只有在你的可信任代理擁有這些合成範圍時，才應明確啟用
`tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 設定

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 預設值：true
        provider: "brave", // 或省略以進行自動偵測
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

提供者專屬設定（API 金鑰、基礎 URL、模式）位於
`plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 也可以在其專用網頁搜尋設定和
`GEMINI_API_KEY` 之後，將 `models.providers.google.apiKey` 和
`models.providers.google.baseUrl` 作為較低優先順序的備援重複使用。範例請參閱
提供者頁面。
Grok 也可以重複使用來自 `openclaw models auth login
--provider xai --method oauth` 的 xAI OAuth 驗證設定檔；API 金鑰設定仍作為備援。

`tools.web.search.provider` 會依照內建及已安裝外掛資訊清單宣告的網頁搜尋提供者 ID
進行驗證。像 `"brvae"` 這樣的拼字錯誤會導致設定驗證失敗，
而不會悄悄退回自動偵測。若已設定的提供者只有過時的外掛證據，例如解除安裝
第三方外掛後留下的 `plugins.entries.<plugin>` 區塊，
OpenClaw 仍會保持啟動流程的韌性並回報警告，讓你可以重新安裝該
外掛，或執行 `openclaw doctor --fix` 清理過時設定。

`web_fetch` 備援提供者的選取方式互相獨立：

- 使用 `tools.web.fetch.provider` 選取
- 或省略該欄位，讓 OpenClaw 從已設定的認證資訊中，自動偵測第一個已就緒的網頁擷取
  提供者
- 非沙箱化的 `web_fetch` 可使用宣告
  `contracts.webFetchProviders` 的已安裝外掛提供者；沙箱化擷取允許內建提供者和
  已驗證的官方外掛安裝項目，但排除第三方外部外掛
- 官方 Firecrawl 外掛是目前唯一內建的 `webFetchProviders`
  貢獻者，其設定位於
  `plugins.entries.firecrawl.config.webFetch.*` 下

當你在 `openclaw onboard` 或
`openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 還可以詢問：

- Moonshot API 區域（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

針對 `x_search`，請設定 `plugins.entries.xai.config.xSearch.*`。它會使用與聊天相同的
xAI 驗證設定檔，或 Grok 網頁搜尋所使用的 `XAI_API_KEY` / 外掛網頁搜尋
認證資訊。
舊版 `tools.web.x_search.*` 設定會由 `openclaw doctor --fix` 自動移轉。
當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 Grok 時，
OpenClaw 也會在 Grok 設定完成後，立即提供使用相同認證資訊設定選用
`x_search` 的選項。這是 Grok 路徑中的獨立後續步驟，
而非另一個頂層網頁搜尋提供者選項。若選擇其他提供者，
OpenClaw 不會顯示 `x_search` 提示。

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
    在閘道處理程序環境中設定提供者環境變數：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    若為閘道安裝，請將其放入 `~/.openclaw/.env`。
    請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具參數

| 參數                  | 說明                                                               |
| --------------------- | ------------------------------------------------------------------ |
| `query`               | 搜尋查詢（必填）                                                   |
| `count`               | 要傳回的結果數（1-10，預設：5）                                   |
| `country`             | 2 位字母的 ISO 國家代碼（例如 "US"、"DE"）                        |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"）                             |
| `search_lang`         | 搜尋語言代碼（僅限 Brave）                                        |
| `freshness`           | 時間篩選條件：`day`、`week`、`month` 或 `year`                     |
| `date_after`          | 此日期之後的結果（YYYY-MM-DD）                                    |
| `date_before`         | 此日期之前的結果（YYYY-MM-DD）                                    |
| `ui_lang`             | UI 語言代碼（僅限 Brave）                                         |
| `domain_filter`       | 網域允許清單／拒絕清單陣列（僅限 Perplexity）                     |
| `max_tokens`          | 內容權杖總預算，僅限原生 Perplexity Search API                    |
| `max_tokens_per_page` | 每頁擷取權杖上限，僅限原生 Perplexity Search API                   |

<Warning>
  並非所有參數都適用於所有供應商。Brave `llm-context` 模式
  會拒絕 `ui_lang`；`date_before` 也需要 `date_after`，因為 Brave 自訂
  時效範圍同時需要開始與結束日期。
  Gemini、Grok 和 Kimi 會傳回一則附有引用的 AI 綜合回答。它們
  接受 `count` 以維持共用工具相容性，但此參數不會改變
  依據搜尋結果產生的回答形式。Gemini 將 `day` 時效性視為近期程度提示；範圍較寬的
  時效值與明確日期會設定 Google Search 依據搜尋結果回答的時間範圍。
  透過 Sonar/OpenRouter
  相容路徑（`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` 或 `OPENROUTER_API_KEY`）使用 Perplexity 時，其行為相同；該路徑也不支援 `max_tokens` 和
  `max_tokens_per_page`。
  SearXNG 僅對受信任的私人網路或回送主機接受 `http://`；
  公開的 SearXNG 端點必須使用 `https://`。
  Firecrawl 和 Tavily 僅透過 `web_search` 支援 `query` 和 `count`
  ——若要使用進階選項，請使用其專用工具。
</Warning>

## x_search

`x_search` 使用 xAI 查詢 X（前身為 Twitter）貼文，並傳回
附有引用的 AI 綜合回答。它接受自然語言查詢和
選用的結構化篩選條件。OpenClaw 會針對每個請求建構內建的 xAI `x_search`
工具，而不是將其永久註冊，因此它只會在實際呼叫它的該回合中
啟用。

<Warning>
  `x_search` 會在 xAI 的伺服器上執行。xAI 對每 1,000 次工具呼叫收取 $5，另加
  模型的輸入與輸出權杖費用。
</Warning>

<Note>
  xAI 文件指出 `x_search` 支援關鍵字搜尋、語意搜尋、使用者
  搜尋和討論串擷取。若要取得轉貼、回覆、書籤或瀏覽次數等單篇貼文
  互動統計資料，建議針對確切的貼文 URL
  或狀態 ID 進行查詢。廣泛的關鍵字搜尋可能會找到正確的貼文，但傳回的
  單篇貼文中繼資料可能較不完整。良好的做法是：先找出貼文，接著
  執行第二次 `x_search` 查詢，聚焦於該篇確切貼文。
</Note>

### x_search 設定

省略 `enabled` 時，只有在作用中模型的
供應商為 `xai` 且能解析 xAI 認證資訊時，才會公開 `x_search`。若作用中模型具有已知的
非 xAI 供應商，請將 `plugins.entries.xai.config.xSearch.enabled` 設為 `true`，
以選擇啟用跨供應商使用。若作用中模型的供應商遺失或
無法解析，此工具將維持隱藏。將 `enabled` 設為 `false`，即可對
所有供應商停用此工具。使用此工具一律需要 xAI 認證資訊。

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // 使用已知的非 xAI 模型供應商時為必填
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // 選用，覆寫 webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // 若已設定 xAI 驗證設定檔或 XAI_API_KEY，則為選用
            baseUrl: "https://api.x.ai/v1", // 選用的共用 xAI Responses 基底 URL
          },
        },
      },
    },
  },
}
```

設定 `plugins.entries.xai.config.xSearch.baseUrl` 時，`x_search` 會向 `<baseUrl>/responses`
發送 POST 請求。若省略該欄位，
則會依序退回使用 `plugins.entries.xai.config.webSearch.baseUrl`，然後是
公開的 xAI 端點（`https://api.x.ai/v1`）。

### x_search 參數

| 參數                         | 說明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | 搜尋查詢（必填）                                       |
| `allowed_x_handles`          | 將結果限制為最多 20 個 X 帳號                          |
| `excluded_x_handles`         | 排除最多 20 個 X 帳號                                  |
| `from_date`                  | 僅包含此日期當日或之後的貼文（YYYY-MM-DD）             |
| `to_date`                    | 僅包含此日期當日或之前的貼文（YYYY-MM-DD）             |
| `enable_image_understanding` | 允許 xAI 檢查相符貼文所附的圖片                        |
| `enable_video_understanding` | 允許 xAI 檢查相符貼文所附的影片                        |

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
// 單篇貼文統計資料：可行時請使用確切的狀態 URL 或狀態 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## 範例

```javascript
// 基本搜尋
await web_search({ query: "OpenClaw 外掛 SDK" });

// 德國特定搜尋
await web_search({ query: "線上觀看電視", country: "DE", language: "de" });

// 近期結果（過去一週）
await web_search({ query: "AI 發展", freshness: "week" });

// 日期範圍
await web_search({
  query: "氣候研究",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 網域篩選（僅限 Perplexity）
await web_search({
  query: "產品評論",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具設定檔

如果使用工具設定檔或允許清單，請新增 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]（包含 web_search、x_search 和 web_fetch）
  },
}
```

## 相關內容

- [Web Fetch](/zh-TW/tools/web-fetch) —— 擷取 URL 並提取可讀內容
- [Web Browser](/zh-TW/tools/browser) —— 適用於大量使用 JS 網站的完整瀏覽器自動化
- [Grok Search](/zh-TW/tools/grok-search) —— 以 Grok 作為 `web_search` 供應商
- [Ollama Web Search](/zh-TW/tools/ollama-search) —— 透過你的 Ollama 主機進行免金鑰網頁搜尋
