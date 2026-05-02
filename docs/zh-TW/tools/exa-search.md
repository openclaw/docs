---
read_when:
    - 您想使用 Exa 進行 web_search
    - 你需要 EXA_API_KEY
    - 你需要神經搜尋或內容擷取
summary: Exa AI 搜尋 -- 具備內容擷取的神經搜尋與關鍵字搜尋
title: Exa 搜尋
x-i18n:
    generated_at: "2026-05-02T21:04:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2ddf83c5130208eadc78eccb10aebf67af11b05690d75a817d6999f79be5fc3
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw 支援 [Exa AI](https://exa.ai/) 作為 `web_search` 提供者。Exa
提供神經、關鍵字與混合搜尋模式，並內建內容擷取
（重點、文字、摘要）。

## 取得 API 金鑰

<Steps>
  <Step title="建立帳戶">
    在 [exa.ai](https://exa.ai/) 註冊，並從你的
    儀表板產生 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `EXA_API_KEY`，或透過以下方式設定：

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

**環境替代方案：**在 Gateway 環境中設定 `EXA_API_KEY`。
若是 gateway 安裝，請將其放在 `~/.openclaw/.env`。

## 覆寫基底 URL

當 Exa 搜尋請求應透過相容代理或替代 Exa 端點時，
設定 `plugins.entries.exa.config.webSearch.baseUrl`。OpenClaw
會透過在裸主機前加上 `https://` 來正規化，並附加 `/search`，除非
路徑已經以該處結尾。解析後的端點會包含在搜尋快取
金鑰中，因此來自不同 Exa 端點的結果不會共用。

## 工具參數

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number">
要傳回的結果數量（1–100）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜尋模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間篩選器。
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

Exa 可以在搜尋結果旁傳回擷取出的內容。傳入 `contents`
物件以啟用：

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

| 內容選項        | 型別                                                                  | 說明                 |
| --------------- | --------------------------------------------------------------------- | -------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 擷取完整頁面文字     |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 擷取關鍵句子         |
| `summary`       | `boolean \| { query }`                                                | AI 產生的摘要        |

### 搜尋模式

| 模式             | 說明                          |
| ---------------- | ----------------------------- |
| `auto`           | Exa 選擇最佳模式（預設）      |
| `neural`         | 語意／基於意義的搜尋          |
| `fast`           | 快速關鍵字搜尋                |
| `deep`           | 深入完整的深度搜尋            |
| `deep-reasoning` | 具推理能力的深度搜尋          |
| `instant`        | 最快的結果                    |

## 備註

- 如果未提供 `contents` 選項，Exa 預設為 `{ highlights: true }`，
  因此結果會包含關鍵句子摘錄
- 可用時，結果會保留 Exa API
  回應中的 `highlightScores` 與 `summary` 欄位
- 結果描述會先從重點解析，接著是摘要，再來是
  完整文字，以可用者為準
- `freshness` 與 `date_after`/`date_before` 無法合併使用，請使用一種
  時間篩選模式
- 每個查詢最多可傳回 100 筆結果（受 Exa 搜尋類型
  限制約束）
- 結果預設快取 15 分鐘（可透過
  `cacheTtlMinutes` 設定）
- Exa 是官方 API 整合，具備結構化 JSON 回應

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 具國家／語言篩選器的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 具網域篩選的結構化結果
