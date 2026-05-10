---
read_when:
    - 你想要由 Tavily 支援的網頁搜尋
    - 你需要 Tavily API 金鑰
    - 你想使用 Tavily 作為 web_search 提供者
    - 您想要從 URL 擷取內容
summary: Tavily 搜尋與擷取工具
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:55:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) 是專為 AI 應用程式設計的搜尋 API。OpenClaw 以兩種方式公開它：

- 作為通用搜尋工具的 `web_search` provider
- 作為明確的 Plugin 工具：`tavily_search` 和 `tavily_extract`

Tavily 會傳回針對 LLM 使用最佳化的結構化結果，並支援可設定的搜尋深度、主題篩選、網域篩選、AI 產生的答案摘要，以及從 URL 擷取內容（包括以 JavaScript 渲染的頁面）。

| 屬性          | 值                                  |
| ------------- | ----------------------------------- |
| Plugin id     | `tavily`                            |
| 驗證          | `TAVILY_API_KEY` 或設定 `apiKey`    |
| Base URL      | `https://api.tavily.com`（預設）    |
| 內建工具      | `tavily_search`, `tavily_extract`   |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    在 [tavily.com](https://tavily.com) 建立 Tavily 帳號，然後在儀表板中產生 API 金鑰。
  </Step>
  <Step title="設定 Plugin 和 provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="驗證搜尋是否執行">
    從任何 agent 觸發 `web_search`，或直接呼叫 `tavily_search`。
  </Step>
</Steps>

<Tip>
在 onboarding 或 `openclaw configure --section web` 中選擇 Tavily，會自動啟用內建的 Tavily Plugin。
</Tip>

## 工具參考

### `tavily_search`

當你想使用 Tavily 專屬的搜尋控制項，而不是通用的 `web_search` 時，請使用這個工具。

| 參數              | 類型         | 限制 / 預設                            | 說明                                             |
| ----------------- | ------------ | -------------------------------------- | ------------------------------------------------ |
| `query`           | string       | 必填                                   | 搜尋查詢字串。保持在 400 個字元以內。           |
| `search_depth`    | enum         | `basic`（預設）, `advanced`            | `advanced` 較慢，但相關性更高。                 |
| `topic`           | enum         | `general`（預設）, `news`, `finance`   | 依主題類別篩選。                                |
| `max_results`     | integer      | 1-20                                   | 結果數量。                                      |
| `include_answer`  | boolean      | 預設 `false`                           | 包含 Tavily AI 產生的答案摘要。                 |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | 依新近程度篩選結果。                            |
| `include_domains` | string array | （無）                                 | 只包含來自這些網域的結果。                      |
| `exclude_domains` | string array | （無）                                 | 排除來自這些網域的結果。                        |

搜尋深度取捨：

| 深度       | 速度   | 相關性 | 最適合                               |
| ---------- | ------ | ------ | ------------------------------------ |
| `basic`    | 較快   | 高     | 一般用途查詢（預設）。               |
| `advanced` | 較慢   | 最高   | 精準研究與事實查核。                 |

### `tavily_extract`

使用這個工具從一個或多個 URL 擷取乾淨內容。可處理以 JavaScript 渲染的頁面，並支援以查詢為焦點的分塊，以進行目標式擷取。

| 參數                | 類型         | 限制 / 預設                   | 說明                                                       |
| ------------------- | ------------ | ----------------------------- | ---------------------------------------------------------- |
| `urls`              | string array | 必填，1-20                    | 要擷取內容的 URL。                                        |
| `query`             | string       | （選填）                      | 依此查詢的相關性重新排序擷取出的區塊。                    |
| `extract_depth`     | enum         | `basic`（預設）, `advanced`   | 對 JS-heavy 頁面、SPA 或動態表格使用 `advanced`。          |
| `chunks_per_source` | integer      | 1-5；**需要 `query`**         | 每個 URL 傳回的區塊數。如果未設定 `query` 就設定會出錯。   |
| `include_images`    | boolean      | 預設 `false`                  | 在結果中包含圖片 URL。                                    |

擷取深度取捨：

| 深度       | 使用時機                                   |
| ---------- | ------------------------------------------ |
| `basic`    | 簡單頁面。先嘗試這個。                    |
| `advanced` | JS-rendered SPA、動態內容、表格。          |

<Tip>
將較大的 URL 清單分批為多次 `tavily_extract` 呼叫（每個請求最多 20 個）。使用 `query` 搭配 `chunks_per_source`，只取得相關內容，而不是完整頁面。
</Tip>

## 選擇正確的工具

| 需求                                 | 工具             |
| ------------------------------------ | ---------------- |
| 快速網頁搜尋，不需要特殊選項         | `web_search`     |
| 使用深度、主題、AI 答案進行搜尋      | `tavily_search`  |
| 從特定 URL 擷取內容                  | `tavily_extract` |

<Note>
將 Tavily 作為 provider 的通用 `web_search` 工具支援 `query` 和 `count`（最多 20 筆結果）。若要使用 Tavily 專屬控制項（`search_depth`、`topic`、`include_answer`、網域篩選、時間範圍），請改用 `tavily_search`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="API 金鑰解析順序">
    Tavily client 會依下列順序查找其 API 金鑰：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（透過 SecretRefs 解析）。
    2. Gateway 環境中的 `TAVILY_API_KEY`。

    如果兩者都不存在，`tavily_extract` 會引發設定錯誤。

  </Accordion>

  <Accordion title="自訂 Base URL">
    如果你透過 proxy front Tavily，請覆寫 `plugins.entries.tavily.config.webSearch.baseUrl`。預設為 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` 需要 `query`">
    `tavily_extract` 會拒絕傳入 `chunks_per_source` 但未傳入 `query` 的呼叫。Tavily 會依查詢相關性排序區塊，因此沒有查詢時此參數沒有意義。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Web Search 概觀" href="/zh-TW/tools/web" icon="magnifying-glass">
    所有 provider 和自動偵測規則。
  </Card>
  <Card title="Firecrawl" href="/zh-TW/tools/firecrawl" icon="fire">
    搜尋加上具備內容擷取的 scraping。
  </Card>
  <Card title="Exa Search" href="/zh-TW/tools/exa-search" icon="binoculars">
    具備內容擷取的神經搜尋。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    Plugin entries 和工具路由的完整設定 schema。
  </Card>
</CardGroup>
