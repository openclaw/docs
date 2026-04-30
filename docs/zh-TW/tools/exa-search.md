---
read_when:
    - 你想使用 Exa 進行 web_search
    - 你需要 EXA_API_KEY
    - 你想要神經搜尋或內容擷取
summary: Exa AI 搜尋 -- 具備內容擷取功能的神經與關鍵字搜尋
title: Exa 搜尋
x-i18n:
    generated_at: "2026-04-30T03:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw 支援 [Exa AI](https://exa.ai/) 作為 `web_search` 提供者。Exa
提供神經、關鍵字與混合搜尋模式，並內建內容
擷取功能（重點、文字、摘要）。

## 取得 API 金鑰

<Steps>
  <Step title="建立帳戶">
    在 [exa.ai](https://exa.ai/) 註冊，並從你的
    儀表板產生 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `EXA_API_KEY`，或透過下列方式設定：

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

**環境替代方式：** 在 Gateway 環境中設定 `EXA_API_KEY`。
若是 gateway 安裝，請放在 `~/.openclaw/.env`。

## 工具參數

<ParamField path="query" type="string" required>
搜尋查詢。
</ParamField>

<ParamField path="count" type="number">
要傳回的結果數量 (1–100)。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜尋模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間篩選器。
</ParamField>

<ParamField path="date_after" type="string">
此日期之後的結果 (`YYYY-MM-DD`)。
</ParamField>

<ParamField path="date_before" type="string">
此日期之前的結果 (`YYYY-MM-DD`)。
</ParamField>

<ParamField path="contents" type="object">
內容擷取選項（見下方）。
</ParamField>

### 內容擷取

Exa 可以在搜尋結果旁一併傳回擷取的內容。傳入 `contents`
物件即可啟用：

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

| 內容選項        | 類型                                                                  | 說明                  |
| --------------- | --------------------------------------------------------------------- | --------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | 擷取完整頁面文字      |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 擷取關鍵句子          |
| `summary`       | `boolean \| { query }`                                                | AI 產生的摘要         |

### 搜尋模式

| 模式             | 說明                              |
| ---------------- | --------------------------------- |
| `auto`           | Exa 選擇最佳模式（預設）          |
| `neural`         | 語意／以意義為基礎的搜尋          |
| `fast`           | 快速關鍵字搜尋                    |
| `deep`           | 完整的深度搜尋                    |
| `deep-reasoning` | 具推理能力的深度搜尋              |
| `instant`        | 最快的結果                        |

## 備註

- 如果未提供 `contents` 選項，Exa 預設為 `{ highlights: true }`，
  因此結果會包含關鍵句摘錄
- 可用時，結果會保留 Exa API
  回應中的 `highlightScores` 與 `summary` 欄位
- 結果描述會先從重點解析，再從摘要解析，最後才從
  完整文字解析，視何者可用而定
- `freshness` 與 `date_after`/`date_before` 不能合併使用，請使用一種
  時間篩選模式
- 每個查詢最多可傳回 100 筆結果（受 Exa 搜尋類型
  限制影響）
- 結果預設快取 15 分鐘（可透過
  `cacheTtlMinutes` 設定）
- Exa 是官方 API 整合，提供結構化 JSON 回應

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Brave Search](/zh-TW/tools/brave-search) -- 具國家／語言篩選器的結構化結果
- [Perplexity Search](/zh-TW/tools/perplexity-search) -- 具網域篩選功能的結構化結果
