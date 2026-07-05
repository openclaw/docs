---
read_when:
    - 你想要不需要 API 金鑰的網頁搜尋
    - 你想要 Parallel 的付費搜尋 API
    - 你想要依照 LLM 脈絡效率排序的密集摘錄
summary: 平行搜尋 -- 來自網路來源的 LLM 最佳化密集摘錄
title: 平行搜尋
x-i18n:
    generated_at: "2026-07-05T11:46:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3abb2b64499966ef1d1d8c905f17ae4845f09de62cfb23eeac535ecaeafde3b9
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 外掛提供兩個 [Parallel](https://parallel.ai/) `web_search`
提供者，兩者都會從為 AI agent 建置的網路索引中，傳回經排序、針對 LLM 最佳化的摘錄：

| 提供者                 | id              | 驗證                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search（免費） | `parallel-free` | 無 -- Parallel 的免費 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 付費 Search API、更高速率限制與目標調校             |

將 `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`，即可明確選取
其中一個；兩者都不會自動偵測。

<Note>
  直接使用 OpenAI Responses 模型（`api: "openai-responses"`、provider
  `openai`、官方 API base URL）時，若 `tools.web.search.provider` 未設定、為空、`"auto"`
  或 `"openai"`，會自動使用 OpenAI 託管的原生網路搜尋
  -- 因此預設會略過 Parallel。將
  `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`，即可改由
  Parallel 路由。請參閱[網路搜尋概覽](/zh-TW/tools/web)。
</Note>

## 安裝外掛

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API 金鑰（付費提供者）

`parallel-free` 不需要金鑰，但仍必須明確選取。付費
`parallel` 提供者需要 API 金鑰：

<Steps>
  <Step title="Create an account">
    在 [platform.parallel.ai](https://platform.parallel.ai) 註冊，並
    從你的儀表板產生 API 金鑰。
  </Step>
  <Step title="Store the key">
    在閘道環境中設定 `PARALLEL_API_KEY`，或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 設定

```json5
{
  plugins: {
    entries: {
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // optional if PARALLEL_API_KEY is set
            baseUrl: "https://api.parallel.ai", // optional; OpenClaw appends /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" for the free Search MCP, or "parallel" for the
        // paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**環境替代方式：**在閘道
環境中設定 `PARALLEL_API_KEY`。對於閘道安裝，請將它放在 `~/.openclaw/.env`。

## Base URL 覆寫

僅適用於付費 `parallel` 提供者；`parallel-free` 一律使用
`https://search.parallel.ai/mcp`，並忽略此設定。

將 `plugins.entries.parallel.config.webSearch.baseUrl` 設為相容的代理或替代端點，即可透過它路由付費
請求（例如
Cloudflare AI Gateway）。OpenClaw 會為裸主機名稱加上
`https://`，並附加 `/v1/search`，除非路徑已經以該字串結尾。
解析後的端點會成為搜尋快取鍵的一部分，因此不同
端點的結果絕不會共用。

## 工具參數

兩個提供者都公開 Parallel 的原生搜尋形狀，讓模型填入
自然語言目標以及幾個簡短關鍵字查詢 -- 這是 Parallel
[建議](https://docs.parallel.ai/search/best-practices)用來取得最佳結果的搭配方式。

<ParamField path="objective" type="string" required>
底層問題或目標的自然語言描述（最多 5000
個字元）。應可獨立理解。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
精簡的關鍵字搜尋查詢，每個 3-6 個字（1-5 筆，每筆最多 200 個字元）。
提供 2-3 個多樣化查詢可取得最佳結果。
</ParamField>

<ParamField path="count" type="number">
要傳回的結果數（1-40）。
</ParamField>

<ParamField path="session_id" type="string">
來自先前結果 `sessionId` 的選用 Parallel 工作階段 ID。將它傳入同一任務中的
後續搜尋，讓 Parallel 將相關呼叫分組，並
改善後續結果。`parallel` 上限為 1000 個字元；免費
`parallel-free` Search MCP 會將其限制在 100。超過限制的 ID 會被捨棄
（付費）或鑄造一個新的 ID（免費）。
</ParamField>

<ParamField path="client_model" type="string">
發出呼叫的模型選用識別碼（例如 `claude-opus-4-7`、
`gpt-5.5`），最多 100 個字元。可讓 Parallel 依據你的
模型能力調整預設設定。傳入確切的作用中模型 slug；不要縮短為
系列別名。
</ParamField>

## 注意事項

- Parallel 會依 LLM 推理效用對結果排序並壓縮，而不是為了人工
  點閱；每個結果會是密集摘錄，而不是完整頁面
  內容。
- 結果摘錄會以 `excerpts` 陣列傳回，也會合併到
  `description`，以相容通用 `web_search` 合約。
- 兩個提供者都會傳回 `session_id`；OpenClaw 會在
  工具酬載中將它公開為 `sessionId`，讓呼叫端可以將後續搜尋分組。由
  Parallel 產生的工作階段 ID（不是呼叫端提供的）會排除在
  快取項目之外，因為具有相同查詢的不相關任務不應
  繼承它。
- 來自 Parallel 的 `searchId`、`warnings` 和 `usage` 會在
  存在時原樣傳遞。
- OpenClaw 一律會將解析後的結果數轉送給 Parallel，作為
  `advanced_settings.max_results`（`parallel`），或在 Parallel 固定大小回應之後於
  用戶端套用 `count`
  （`parallel-free`）。呼叫端的 `count` 引數優先，其次是 `tools.web.search.maxResults`，否則使用
  OpenClaw 通用 `web_search` 預設值（5）-- Parallel 自身 API 預設值
  為 10。
- 結果預設會快取 15 分鐘（`cacheTtlMinutes`）。
- 當呼叫端未提供時，`parallel-free` 會透過其 MCP 交握為每次呼叫鑄造新的 `session_id`；
  `parallel` 在這種情況下則會保持未設定。

## 相關

- [網路搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Exa 搜尋](/zh-TW/tools/exa-search) -- 具內容擷取的神經搜尋
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 具網域篩選的結構化結果
