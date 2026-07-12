---
read_when:
    - 你想在沒有 API 金鑰的情況下進行網頁搜尋
    - 你想使用 Parallel 的付費搜尋 API
    - 你想要依 LLM 上下文效率排序的高密度摘錄
summary: 平行搜尋 -- 來自網路來源、針對 LLM 最佳化的密集摘錄
title: 平行搜尋
x-i18n:
    generated_at: "2026-07-12T14:54:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 外掛提供兩個 [Parallel](https://parallel.ai/) `web_search`
提供者，兩者都會從專為 AI 代理程式建立的網頁索引傳回經過排序、針對 LLM 最佳化的摘錄：

| 提供者                 | id              | 驗證                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel Search（免費） | `parallel-free` | 無 -- Parallel 的免費 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel Search        | `parallel`      | `PARALLEL_API_KEY` -- 付費 Search API，提供更高的速率限制與目標調校             |

將 `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`，即可明確選取
其中一個；兩者都不會自動偵測。

<Note>
  直接使用 OpenAI Responses 模型（`api: "openai-responses"`、提供者
  `openai`、官方 API 基礎 URL）時，若 `tools.web.search.provider` 未設定、為空、設為 `"auto"`
  或 `"openai"`，會自動使用 OpenAI 託管的原生網頁搜尋
  -- 因此預設會略過 Parallel。請將
  `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`，改為透過
  Parallel 路由。請參閱[網頁搜尋概覽](/zh-TW/tools/web)。
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
  <Step title="建立帳戶">
    請前往 [platform.parallel.ai](https://platform.parallel.ai) 註冊，並
    從你的儀表板產生 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `PARALLEL_API_KEY`，或透過以下命令進行設定：

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
            apiKey: "par-...", // 若已設定 PARALLEL_API_KEY，則為選填
            baseUrl: "https://api.parallel.ai", // 選填；OpenClaw 會附加 /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // 免費 Search MCP 使用 "parallel-free"，此處顯示的
        // 付費 API 支援提供者則使用 "parallel"。
        provider: "parallel",
      },
    },
  },
}
```

**環境變數替代方案：**在閘道環境中設定 `PARALLEL_API_KEY`。
若為閘道安裝，請將其放入 `~/.openclaw/.env`。

## 基礎 URL 覆寫

僅適用於付費的 `parallel` 提供者；`parallel-free` 一律使用
`https://search.parallel.ai/mcp`，並忽略此設定。

設定 `plugins.entries.parallel.config.webSearch.baseUrl`，以透過相容的
Proxy 或替代端點（例如 Cloudflare AI Gateway）路由付費請求。
OpenClaw 會在純主機名稱前加上 `https://` 以進行正規化，並附加
`/v1/search`，除非路徑已以該字串結尾。解析後的端點是搜尋快取鍵的一部分，
因此不同端點的結果絕不會共用。

## 工具參數

這兩個提供者都會公開 Parallel 的原生搜尋格式，讓模型填入自然語言目標，
以及幾個簡短的關鍵字查詢——這是 Parallel
[建議](https://docs.parallel.ai/search/best-practices)的搭配方式，可獲得
最佳結果。

<ParamField path="objective" type="string" required>
對基礎問題或目標的自然語言描述（最多 5000 個字元）。內容應完整自足。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
精簡的關鍵字搜尋查詢，每個查詢 3-6 個字（1-5 個項目，每個最多 200 個字元）。
請提供 2-3 個多樣化查詢，以獲得最佳結果。
</ParamField>

<ParamField path="count" type="number">
要傳回的結果數量（1-40）。
</ParamField>

<ParamField path="session_id" type="string">
先前結果之 `sessionId` 中的選用 Parallel 工作階段 ID。在同一項任務的
後續搜尋中傳入此 ID，讓 Parallel 將相關呼叫分組，並改善後續結果。
`parallel` 上限為 1000 個字元；免費的 `parallel-free` Search MCP
上限為 100。超過限制的 ID 會遭捨棄（付費）或重新產生新的 ID（免費）。
</ParamField>

<ParamField path="client_model" type="string">
發出呼叫之模型的選用識別碼（例如 `claude-opus-4-7`、
`gpt-5.6-sol`），上限為 100 個字元。讓 Parallel 能依據你的模型能力
調整預設設定。請傳入目前使用中模型的確切 slug；不要縮寫成模型系列別名。
</ParamField>

## 注意事項

- Parallel 會依據結果對 LLM 推理的效用進行排名與壓縮，而非供人類
  點擊瀏覽；每筆結果應會包含密集的摘錄，而非完整頁面
  內容。
- 結果摘錄會以 `excerpts` 陣列傳回，並同時合併至
  `description`，以便相容於通用的 `web_search` 合約。
- 兩個提供者都會傳回 `session_id`；OpenClaw 會在
  工具承載資料中將其呈現為 `sessionId`，讓呼叫端能將後續搜尋分組。由
  Parallel 產生的工作階段 ID（非呼叫端提供）不會納入
  快取項目，因為查詢相同但互不相關的工作不應
  繼承該 ID。
- Parallel 傳回的 `searchId`、`warnings` 和 `usage` 若存在，
  會原樣傳遞。
- OpenClaw 一律會將解析後的結果數量轉送給 Parallel，並設為
  `advanced_settings.max_results`（`parallel`），或在 Parallel 傳回固定數量的回應後，
  於用戶端套用 `count`（`parallel-free`）。呼叫端的
  `count` 引數優先，其次為 `tools.web.search.maxResults`，否則使用
  OpenClaw 通用的 `web_search` 預設值（5）——Parallel 自有 API 的預設值
  為 10。
- 結果預設會快取 15 分鐘（`cacheTtlMinutes`）。
- 當呼叫端未提供工作階段 ID 時，`parallel-free` 會透過其 MCP 交握
  為每次呼叫建立新的 `session_id`；在相同情況下，`parallel` 則不會設定
  該值。

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Exa 搜尋](/zh-TW/tools/exa-search) -- 具備內容擷取功能的神經搜尋
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 支援網域篩選的結構化結果
