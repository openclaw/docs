---
read_when:
    - 你想使用 Exa 進行 web_search
    - 你需要 EXA_API_KEY
    - 你想要神經搜尋或內容擷取
summary: Exa AI 搜尋 -- 具內容擷取的神經與關鍵字搜尋
title: Exa 搜尋
x-i18n:
    generated_at: "2026-07-05T11:49:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) 是一個 `web_search` 提供者，支援神經、關鍵字和混合搜尋模式，並內建內容擷取（重點、文字、摘要）。

## 安裝外掛

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## 取得 API 金鑰

<Steps>
  <Step title="建立帳號">
    在 [exa.ai](https://exa.ai/) 註冊，並從你的儀表板產生 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `EXA_API_KEY`，或透過以下方式設定：

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**環境替代方案：**在閘道環境中設定 `EXA_API_KEY`。若是閘道安裝，請放在 `~/.openclaw/.env`。請參閱
[環境變數](/zh-TW/help/faq#env-vars-and-env-loading)。

## Base URL 覆寫

設定 `plugins.entries.exa.config.webSearch.baseUrl`，即可將 Exa 搜尋
請求路由到相容的代理或替代端點。OpenClaw 會透過加上 `https://` 來
正規化裸主機，並附加 `/search`，除非路徑已經以該字串結尾。解析後的端點是搜尋
快取鍵的一部分，因此不同端點的結果絕不會共用。

## 工具參數

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number" default="5">
要傳回的結果數量（1-100，受 Exa 搜尋類型限制約束）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜尋模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間篩選器。不能與 `date_after`/`date_before` 組合使用。
</ParamField>

<ParamField path="date_after" type="string">
此日期之後的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
此日期之前的結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
內容擷取選項（見下方）。
</ParamField>

### 內容擷取

傳入 `contents` 物件以控制結果中擷取的內容：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| 內容選項        | 類型                                                                  | 說明             |
| --------------- | --------------------------------------------------------------------- | ---------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 擷取完整頁面文字 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 擷取關鍵句子     |
| `summary`       | `boolean \| { query }`                                                | AI 產生的摘要    |

如果省略 `contents`，Exa 預設為 `{ highlights: true }`，因此結果會包含
關鍵句子摘錄。結果說明會優先從重點解析，其次是摘要，再來是完整文字 -- 以最先可用者為準。結果
也會在可用時保留 Exa API 回應中的原始 `highlightScores` 和 `summary` 欄位。

### 搜尋模式

| 模式             | 說明                         |
| ---------------- | ---------------------------- |
| `auto`           | Exa 選擇最佳模式（預設）     |
| `neural`         | 語意/基於意義的搜尋          |
| `fast`           | 快速關鍵字搜尋               |
| `deep`           | 完整深度搜尋                 |
| `deep-reasoning` | 帶有推理的深度搜尋           |
| `instant`        | 最快的結果                   |

## 備註

- `count` 最多接受 100，受 Exa 搜尋類型限制約束。
- 結果預設快取 15 分鐘。設定共用的
  `tools.web.search.cacheTtlMinutes`（分鐘）和
  `tools.web.search.timeoutSeconds`（預設 30s），即可變更所有 `web_search` 提供者（包括 Exa）的快取和
  請求逾時。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 含國家/語言篩選器的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 含網域篩選的結構化結果
