---
read_when:
    - 你想在沒有 API 金鑰的情況下使用網路搜尋
    - 你想使用 Parallel 的付費搜尋 API
    - 您希望取得依 LLM 上下文效率排序的高密度節錄
summary: 平行搜尋——針對 LLM 最佳化的網路來源高密度摘錄
title: 平行搜尋
x-i18n:
    generated_at: "2026-07-11T21:54:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 外掛提供兩個 [Parallel](https://parallel.ai/) `web_search`
供應商，兩者都會從專為 AI 代理程式建立的網頁索引中，傳回經過排序且針對 LLM 最佳化的摘錄：

| 供應商                 | id              | 驗證                                                                                       |
| ---------------------- | --------------- | ------------------------------------------------------------------------------------------ |
| Parallel 搜尋（免費）  | `parallel-free` | 無 -- Parallel 的免費 [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) |
| Parallel 搜尋          | `parallel`      | `PARALLEL_API_KEY` -- 付費搜尋 API，具備更高的速率限制與目標調校功能                       |

將 `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`，即可明確選擇
其中一個；兩者都不會被自動偵測。

<Note>
  直接使用 OpenAI Responses 的模型（`api: "openai-responses"`、供應商
  `openai`、官方 API 基礎 URL）會在 `tools.web.search.provider` 未設定、為空、
  設為 `"auto"` 或 `"openai"` 時，自動使用 OpenAI 託管的原生網頁搜尋；
  因此預設會略過 Parallel。若要改為透過 Parallel 路由，請將
  `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`。請參閱
  [網頁搜尋概覽](/zh-TW/tools/web)。
</Note>

## 安裝外掛

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API 金鑰（付費供應商）

`parallel-free` 不需要金鑰，但仍須明確選取。付費的
`parallel` 供應商需要 API 金鑰：

<Steps>
  <Step title="建立帳戶">
    在 [platform.parallel.ai](https://platform.parallel.ai) 註冊，並從
    儀表板產生 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
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
        // 免費 Search MCP 使用 "parallel-free"，此處所示的
        // 付費 API 供應商則使用 "parallel"。
        provider: "parallel",
      },
    },
  },
}
```

**環境變數替代方案：**在閘道環境中設定 `PARALLEL_API_KEY`。
若為閘道安裝，請將其放入 `~/.openclaw/.env`。

## 覆寫基礎 URL

僅適用於付費的 `parallel` 供應商；`parallel-free` 一律使用
`https://search.parallel.ai/mcp`，並忽略此設定。

設定 `plugins.entries.parallel.config.webSearch.baseUrl`，即可將付費
請求透過相容的代理伺服器或替代端點路由（例如 Cloudflare AI Gateway）。
OpenClaw 會在純主機名稱前加上 `https://` 以進行正規化，並附加
`/v1/search`，除非路徑結尾已是該字串。解析後的端點會納入搜尋快取鍵，
因此不同端點的結果絕不共用。

## 工具參數

兩個供應商都會公開 Parallel 的原生搜尋結構，讓模型填入自然語言目標，
再加上幾個簡短的關鍵字查詢；這是 Parallel 為獲得最佳結果而
[建議](https://docs.parallel.ai/search/best-practices)採用的搭配方式。

<ParamField path="objective" type="string" required>
對基礎問題或目標的自然語言描述（最多 5000 個字元）。內容應完整獨立。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
精簡的關鍵字搜尋查詢，每項 3 至 6 個字詞（1 至 5 項，每項最多 200 個字元）。
為獲得最佳結果，請提供 2 至 3 個多樣化查詢。
</ParamField>

<ParamField path="count" type="number">
要傳回的結果數量（1 至 40）。
</ParamField>

<ParamField path="session_id" type="string">
選填的 Parallel 工作階段 ID，取自先前結果的 `sessionId`。在同一任務的
後續搜尋中傳入此值，讓 Parallel 將相關呼叫分組並改善後續結果。
`parallel` 最多允許 1000 個字元；免費的 `parallel-free` Search MCP
上限為 100。超出限制的 ID 會被捨棄（付費）或改為產生新的 ID（免費）。
</ParamField>

<ParamField path="client_model" type="string">
發出呼叫之模型的選填識別碼（例如 `claude-opus-4-7`、
`gpt-5.6-sol`），最多 100 個字元。這可讓 Parallel 依據模型能力調整
預設設定。請傳入目前使用中模型的完整 slug；不要縮寫為系列別名。
</ParamField>

## 注意事項

- Parallel 會根據對 LLM 推理的實用性排序並壓縮結果，而非針對真人點閱；
  因此每筆結果會提供密集摘錄，而非完整頁面內容。
- 結果摘錄會以 `excerpts` 陣列傳回，也會合併至 `description`，
  以相容於通用的 `web_search` 合約。
- 兩個供應商都會傳回 `session_id`；OpenClaw 會在工具承載資料中將其公開為
  `sessionId`，讓呼叫端能將後續搜尋分組。由 Parallel 產生的工作階段 ID
  （即並非由呼叫端提供）不會納入快取項目，因為查詢相同但彼此無關的任務
  不應繼承該 ID。
- Parallel 傳回的 `searchId`、`warnings` 與 `usage` 若存在，會原樣傳遞。
- OpenClaw 一律將解析後的結果數量以 `advanced_settings.max_results`
  （`parallel`）轉送給 Parallel，或在 Parallel 傳回固定大小的回應後，
  於用戶端套用 `count`（`parallel-free`）。呼叫端的 `count` 引數優先，
  其次是 `tools.web.search.maxResults`，否則使用 OpenClaw 通用
  `web_search` 的預設值（5）；Parallel 自身 API 的預設值為 10。
- 結果預設快取 15 分鐘（`cacheTtlMinutes`）。
- 當呼叫端未提供 `session_id` 時，`parallel-free` 會透過 MCP 交握為每次
  呼叫產生新的 `session_id`；`parallel` 則在此情況下保持未設定。

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有供應商與自動偵測
- [Exa 搜尋](/zh-TW/tools/exa-search) -- 具備內容擷取功能的神經搜尋
- [Perplexity 搜尋](/zh-TW/tools/perplexity-search) -- 具備網域篩選功能的結構化結果
