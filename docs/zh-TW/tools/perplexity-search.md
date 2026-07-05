---
read_when:
    - 你想要使用 Perplexity Search 進行網頁搜尋
    - 你需要設定 PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY
summary: Perplexity Search API 與 Sonar/OpenRouter 的 web_search 相容性
title: Perplexity 搜尋
x-i18n:
    generated_at: "2026-07-05T11:46:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw 支援將 Perplexity Search API 作為 `web_search` 提供者。它會傳回包含 `title`、`url` 和 `snippet` 欄位的結構化結果。

為了相容性，OpenClaw 也支援舊版 Perplexity Sonar/OpenRouter 設定。如果你使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 金鑰，或設定 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，提供者會切換到 chat-completions 路徑，並傳回含引用來源的 AI 合成答案，而不是結構化的 Search API 結果。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 取得 Perplexity API 金鑰

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 建立 Perplexity 帳戶。
2. 在儀表板中產生 API 金鑰。
3. 將金鑰儲存在設定中，或在閘道環境中設定 `PERPLEXITY_API_KEY`。

## OpenRouter 相容性

如果你已經使用 OpenRouter 搭配 Perplexity Sonar，請保留 `provider: "perplexity"`，並在閘道環境中設定 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中儲存 `sk-or-...` 金鑰。

選用的相容性控制項：

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 設定範例

### 原生 Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar 相容性

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## 設定金鑰的位置

**透過設定：**執行 `openclaw configure --section web`。它會將金鑰儲存在 `~/.openclaw/openclaw.json` 的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。該欄位也接受 SecretRef 物件。

**透過環境：**在閘道程序環境中設定 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。對於 gateway 安裝，請將它放在 `~/.openclaw/.env`（或你的服務環境）中。請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

如果已設定 `provider: "perplexity"`，且 Perplexity 金鑰 SecretRef 未解析又沒有 env 備援，啟動/重新載入會快速失敗。

## 工具參數

這些參數適用於原生 Perplexity Search API 路徑。

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number" default="5">
要傳回的結果數量（1-10）。
</ParamField>

<ParamField path="country" type="string">
2 個字母的 ISO 國家/地區代碼（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 語言代碼（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間篩選器 - `day` 為 24 小時。
</ParamField>

<ParamField path="date_after" type="string">
僅包含此日期之後發布的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
僅包含此日期之前發布的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="domain_filter" type="string[]">
網域允許清單/拒絕清單陣列（最多 20 個）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
總內容預算（最多 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
每頁 token 限制。
</ParamField>

對於舊版 Sonar/OpenRouter 相容性路徑：

- 接受 `query`、`count` 和 `freshness`。
- `count` 在該處僅供相容性使用；回應仍是一個含引用來源的合成答案，而不是 N 筆結果清單。
- 僅限 Search API 的篩選器（`country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`）會傳回明確錯誤。

**範例：**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 網域篩選規則

- 每個篩選器最多 20 個網域。
- 不能在同一個請求中混用允許清單和拒絕清單項目。
- 對拒絕清單項目使用 `-` 前綴（例如 `["-reddit.com"]`）。

## 附註

- Perplexity Search API 會傳回結構化網頁搜尋結果（`title`、`url`、`snippet`）。
- OpenRouter，或明確的 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，會為了相容性將 Perplexity 切回 Sonar chat completions。
- Sonar/OpenRouter 相容性會傳回一個含引用來源的合成答案，而不是結構化結果列。
- 預設會快取結果 15 分鐘（可透過 `cacheTtlMinutes` 設定）。

## 相關

<CardGroup cols={2}>
  <Card title="網頁搜尋概覽" href="/zh-TW/tools/web" icon="globe">
    所有提供者和自動偵測規則。
  </Card>
  <Card title="Brave 搜尋" href="/zh-TW/tools/brave-search" icon="shield">
    含國家/地區和語言篩選器的結構化結果。
  </Card>
  <Card title="Exa 搜尋" href="/zh-TW/tools/exa-search" icon="magnifying-glass">
    具內容擷取功能的神經搜尋。
  </Card>
  <Card title="Perplexity Search API 文件" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    官方 Perplexity Search API 快速入門與參考。
  </Card>
</CardGroup>
