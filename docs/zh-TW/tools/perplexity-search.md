---
read_when:
    - 你想使用 Perplexity Search 進行網頁搜尋
    - 你需要設定 PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY
summary: Perplexity Search API 與 Sonar/OpenRouter 對 web_search 的相容性
title: Perplexity 搜尋
x-i18n:
    generated_at: "2026-07-11T21:55:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw 支援將 Perplexity Search API 作為 `web_search` 提供者。它會傳回包含 `title`、`url` 與 `snippet` 欄位的結構化結果。

為了相容性，OpenClaw 也支援舊版 Perplexity Sonar/OpenRouter 設定。如果您使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 金鑰，或設定 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，提供者便會切換至聊天補全路徑，並傳回附有引用來源的 AI 綜合回答，而非結構化的 Search API 結果。

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 取得 Perplexity API 金鑰

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 建立 Perplexity 帳戶。
2. 在控制台中產生 API 金鑰。
3. 將金鑰儲存在設定中，或在閘道環境中設定 `PERPLEXITY_API_KEY`。

## OpenRouter 相容性

如果您已透過 OpenRouter 使用 Perplexity Sonar，請保留 `provider: "perplexity"`，並在閘道環境中設定 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中儲存 `sk-or-...` 金鑰。

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

## 金鑰設定位置

**透過設定：**執行 `openclaw configure --section web`。此命令會將金鑰儲存在 `~/.openclaw/openclaw.json` 的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。該欄位也接受 SecretRef 物件。

**透過環境：**在閘道程序環境中設定 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。若是閘道安裝，請將其放入 `~/.openclaw/.env`（或您的服務環境）中。請參閱[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

如果已設定 `provider: "perplexity"`，但 Perplexity 金鑰 SecretRef 無法解析且沒有環境變數備援，啟動或重新載入會立即失敗。

## 工具參數

這些參數適用於原生 Perplexity Search API 路徑。

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number" default="5">
要傳回的結果數量（1 至 10）。
</ParamField>

<ParamField path="country" type="string">
2 個字母的 ISO 國家代碼（例如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 語言代碼（例如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間篩選條件——`day` 代表 24 小時。
</ParamField>

<ParamField path="date_after" type="string">
僅傳回在此日期之後發布的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
僅傳回在此日期之前發布的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="domain_filter" type="string[]">
網域允許清單／拒絕清單陣列（最多 20 個）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
總內容預算（上限為 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
每頁權杖上限。
</ParamField>

針對舊版 Sonar/OpenRouter 相容路徑：

- 接受 `query`、`count` 與 `freshness`。
- `count` 在此僅供相容用途；回應仍是一則附有引用來源的綜合回答，而非包含 N 筆結果的清單。
- 僅限 Search API 的篩選條件（`country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`）會傳回明確錯誤。

**範例：**

```javascript
// 依國家和語言搜尋
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近的結果（過去一週）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日期範圍搜尋
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 網域篩選（允許清單）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 網域篩選（拒絕清單——加上 - 前綴）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 擷取更多內容
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 網域篩選規則

- 每個篩選條件最多可包含 20 個網域。
- 同一個請求中不能混用允許清單與拒絕清單項目。
- 拒絕清單項目請使用 `-` 前綴（例如 `["-reddit.com"]`）。

## 注意事項

- Perplexity Search API 會傳回結構化的網頁搜尋結果（`title`、`url`、`snippet`）。
- OpenRouter 或明確設定的 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，會基於相容性將 Perplexity 切換回 Sonar 聊天補全。
- Sonar/OpenRouter 相容模式會傳回一則附有引用來源的綜合回答，而非結構化結果列。
- 預設會快取結果 15 分鐘（可透過 `cacheTtlMinutes` 設定）。

## 相關內容

<CardGroup cols={2}>
  <Card title="網頁搜尋概覽" href="/zh-TW/tools/web" icon="globe">
    所有提供者與自動偵測規則。
  </Card>
  <Card title="Brave 搜尋" href="/zh-TW/tools/brave-search" icon="shield">
    支援國家與語言篩選的結構化結果。
  </Card>
  <Card title="Exa 搜尋" href="/zh-TW/tools/exa-search" icon="magnifying-glass">
    具備內容擷取功能的神經搜尋。
  </Card>
  <Card title="Perplexity Search API 文件" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    官方 Perplexity Search API 快速入門與參考資料。
  </Card>
</CardGroup>
