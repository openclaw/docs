---
read_when:
    - 你想要不需要 API 金鑰的網頁搜尋
    - 你想要 Parallel 的付費 Search API
    - 你想要為了提升 LLM 上下文效率而排序的密集摘錄
summary: 平行搜尋 -- 針對 LLM 最佳化的網頁來源密集摘錄
title: 平行搜尋
x-i18n:
    generated_at: "2026-06-27T20:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef64c2c125d2885385308dd8a57421b696fa1a9a5455b8c3b83854016f6514cb
    source_path: tools/parallel-search.md
    workflow: 16
---

Parallel 外掛提供兩個 [Parallel](https://parallel.ai/) `web_search` 提供者：

- **Parallel Search（免費）** (`parallel-free`) -- Parallel 的免費
  [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp)。不需要
  帳號或 API 金鑰。當你想使用 Parallel 託管的免金鑰搜尋路徑時，請明確選取它。
- **Parallel Search** (`parallel`) -- Parallel 的付費 Search API。需要
  `PARALLEL_API_KEY`，並提供更高的速率限制與目標調整。

兩者都會從為 AI 代理建置的網頁索引中，傳回經排序且針對 LLM 最佳化的摘錄。
將 `tools.web.search.provider` 設為 `parallel-free` 或 `parallel`，即可明確選擇其中一個。

<Note>
  當 `tools.web.search.provider` 未設定時，OpenAI Responses 模型會使用 OpenAI
  原生的網頁搜尋，因此會繞過 Parallel 提供者。將 `tools.web.search.provider`
  設為 `parallel-free` 或 `parallel`，即可透過 Parallel 路由它們。
</Note>

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## API 金鑰（付費提供者）

`parallel-free` 不需要 API 金鑰，但仍必須被選為受管理的提供者。付費的
`parallel` 提供者需要 API 金鑰：

<Steps>
  <Step title="建立帳號">
    在 [platform.parallel.ai](https://platform.parallel.ai) 註冊，並從你的儀表板產生 API 金鑰。
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
        // Use "parallel-free" for the free Search MCP, or "parallel" for
        // the paid API-backed provider shown here.
        provider: "parallel",
      },
    },
  },
}
```

**環境替代方式：**在閘道環境中設定 `PARALLEL_API_KEY`。
如果是閘道安裝，請將它放在 `~/.openclaw/.env`。

## 基底 URL 覆寫

基底 URL 覆寫只套用於付費的 `parallel` 提供者。免費的
`parallel-free` 提供者一律使用 `https://search.parallel.ai/mcp`。

當 Parallel 請求應該透過相容的代理或替代 Parallel 端點（例如
Cloudflare AI Gateway）時，請設定 `plugins.entries.parallel.config.webSearch.baseUrl`。
OpenClaw 會在裸主機前加上 `https://`，並附加 `/v1/search`，除非路徑已經以此結尾。
解析後的端點會納入搜尋快取鍵，因此不同 Parallel 端點的結果不會共用。

## 工具參數

OpenClaw 會公開 Parallel 的原生搜尋形狀，讓模型能同時填入自然語言目標與幾個簡短的關鍵字查詢 — 這是 Parallel [建議](https://docs.parallel.ai/search/best-practices)用來取得最佳結果的配對方式。

<ParamField path="objective" type="string" required>
底層問題或目標的自然語言描述（最多 5000 個字元）。應能自成完整脈絡。
</ParamField>

<ParamField path="search_queries" type="string[]" required>
精簡的關鍵字搜尋查詢，每個 3-6 個字（1-5 筆項目，每筆最多 200 個字元）。
為取得最佳結果，請提供 2-3 個多樣化查詢。
</ParamField>

<ParamField path="count" type="number">
要傳回的結果數量（1-40）。
</ParamField>

<ParamField path="session_id" type="string">
選用的 Parallel 工作階段 ID（在 `parallel` 上最多 1000 個字元；免費的
`parallel-free` Search MCP 上限為 100）。在屬於同一任務的後續搜尋中，傳入先前
Parallel 結果中的 `sessionId`，讓 Parallel 能將相關呼叫分組並改善後續結果。
超過限制的 ID 會被捨棄，並產生新的 ID。
</ParamField>

<ParamField path="client_model" type="string">
發出呼叫的模型選用識別碼（例如 `claude-opus-4-7`、`gpt-5.5`）。
讓 Parallel 能針對你的模型能力調整預設設定。請傳入確切的作用中模型 slug；
不要縮短為系列別名。
</ParamField>

## 注意事項

- Parallel 會根據 LLM 推理效用來排序並壓縮結果，而不是根據人類點閱率；預期每個結果會是密集摘錄，而不是完整頁面內容
- 結果摘錄會以 `excerpts` 陣列傳回，也會合併到 `description` 欄位，以相容於通用的 `web_search` 合約
- Parallel 會在每個回應中傳回 `session_id`；OpenClaw 會在工具承載資料中以 `sessionId` 呈現，讓呼叫端能將後續搜尋分組
- Parallel 的 `searchId`、`warnings` 和 `usage` 會在存在時原樣傳遞
- OpenClaw 一律會將解析後的結果數量以 `advanced_settings.max_results` 轉送給 Parallel。呼叫端的 `count` 引數優先，其次是頂層的 `tools.web.search.maxResults` 設定，否則使用 OpenClaw 的通用 `web_search` 預設值（5）。這可在切換提供者時保持結果數量一致；Parallel 本身預設為 10
- 結果預設會快取 15 分鐘（可透過 `cacheTtlMinutes` 設定）
- 免費的 `parallel-free` 提供者接受相同參數。它會在用戶端套用 `count`，並在未提供時為每次呼叫產生一個 `session_id`。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Exa 搜尋](/zh-TW/tools/exa-search) -- 具內容擷取的神經搜尋
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 具網域篩選的結構化結果
