---
read_when:
    - 您想使用 Perplexity Search 進行網路搜尋
    - 你需要設定 PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY
summary: Perplexity 搜尋 API 以及 Sonar/OpenRouter 對 web_search 的相容性
title: Perplexity 搜尋（舊版路徑）
x-i18n:
    generated_at: "2026-04-30T03:18:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 16
---

# Perplexity Search API

OpenClaw 支援將 Perplexity Search API 作為 `web_search` provider。
它會傳回包含 `title`、`url` 和 `snippet` 欄位的結構化結果。

為了相容性，OpenClaw 也支援舊版 Perplexity Sonar/OpenRouter 設定。
如果你使用 `OPENROUTER_API_KEY`、`plugins.entries.perplexity.config.webSearch.apiKey` 中的 `sk-or-...` 金鑰，或設定 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，該 provider 會切換到 chat-completions 路徑，並傳回附有引用的 AI 綜合答案，而不是結構化的 Search API 結果。

## 取得 Perplexity API 金鑰

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 建立 Perplexity 帳戶
2. 在儀表板產生 API 金鑰
3. 將金鑰儲存在設定中，或在 Gateway 環境中設定 `PERPLEXITY_API_KEY`。

## OpenRouter 相容性

如果你已經使用 OpenRouter 搭配 Perplexity Sonar，請保留 `provider: "perplexity"`，並在 Gateway 環境中設定 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中儲存 `sk-or-...` 金鑰。

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

**透過設定：** 執行 `openclaw configure --section web`。它會將金鑰儲存在
`~/.openclaw/openclaw.json` 中的 `plugins.entries.perplexity.config.webSearch.apiKey` 之下。
該欄位也接受 SecretRef 物件。

**透過環境：** 在 Gateway 行程環境中設定 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。
對於 Gateway 安裝，請將它放在
`~/.openclaw/.env`（或你的服務環境）中。請參閱 [環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

如果已設定 `provider: "perplexity"`，且 Perplexity 金鑰 SecretRef 無法解析且沒有環境備援，啟動/重新載入會快速失敗。

## 工具參數

這些參數適用於原生 Perplexity Search API 路徑。

| 參數                  | 說明                                                 |
| --------------------- | ---------------------------------------------------- |
| `query`               | 搜尋查詢（必要）                                     |
| `count`               | 要傳回的結果數量（1-10，預設：5）                    |
| `country`             | 2 字母 ISO 國家/地區代碼（例如 "US"、"DE"）          |
| `language`            | ISO 639-1 語言代碼（例如 "en"、"de"、"fr"）          |
| `freshness`           | 時間篩選器：`day`（24 小時）、`week`、`month` 或 `year` |
| `date_after`          | 只包含此日期之後發布的結果（YYYY-MM-DD）             |
| `date_before`         | 只包含此日期之前發布的結果（YYYY-MM-DD）             |
| `domain_filter`       | 網域允許清單/拒絕清單陣列（最多 20 個）              |
| `max_tokens`          | 總內容預算（預設：25000，最大：1000000）             |
| `max_tokens_per_page` | 每頁 token 限制（預設：2048）                        |

對於舊版 Sonar/OpenRouter 相容性路徑：

- 接受 `query`、`count` 和 `freshness`
- `count` 在該路徑中僅供相容性使用；回應仍是一個附有引用的綜合
  答案，而不是 N 筆結果的清單
- Search API 專用篩選器，例如 `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page`
  會傳回明確錯誤

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

### 網域篩選器規則

- 每個篩選器最多 20 個網域
- 不可在同一個請求中混用允許清單和拒絕清單
- 拒絕清單項目請使用 `-` 前綴（例如 `["-reddit.com"]`）

## 注意事項

- Perplexity Search API 會傳回結構化網頁搜尋結果（`title`、`url`、`snippet`）
- OpenRouter 或明確的 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 會為了相容性將 Perplexity 切回 Sonar chat completions
- Sonar/OpenRouter 相容性會傳回一個附有引用的綜合答案，而不是結構化結果列
- 結果預設會快取 15 分鐘（可透過 `cacheTtlMinutes` 設定）

完整的 web_search 設定請參閱 [Web 工具](/zh-TW/tools/web)。
更多詳細資訊請參閱 [Perplexity Search API 文件](https://docs.perplexity.ai/docs/search/quickstart)。

## 相關

- [Perplexity 搜尋](/zh-TW/tools/perplexity-search)
- [Web 搜尋](/zh-TW/tools/web)
