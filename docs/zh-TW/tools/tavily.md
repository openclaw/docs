---
read_when:
    - 你想使用由 Tavily 支援的網頁搜尋
    - 你需要 Tavily API 金鑰
    - 你想要將 Tavily 作為 `web_search` 提供者
    - 你想要從 URL 擷取內容
summary: Tavily 搜尋與擷取工具
title: Tavily
x-i18n:
    generated_at: "2026-07-11T21:52:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) 是專為 AI 應用程式設計的搜尋 API。OpenClaw 透過兩種方式提供此功能：

- 作為通用搜尋工具的 `web_search` 提供者
- 作為明確的外掛工具：`tavily_search` 和 `tavily_extract`

Tavily 會傳回針對大型語言模型使用而最佳化的結構化結果，並提供可設定的搜尋深度、主題篩選、網域篩選、AI 產生的答案摘要，以及從 URL 擷取內容的功能（包括由 JavaScript 轉譯的頁面）。

| 屬性      | 值                                                                                                  |
| --------- | --------------------------------------------------------------------------------------------------- |
| 外掛 ID   | `tavily`                                                                                            |
| 套件      | `@openclaw/tavily-plugin`                                                                           |
| 驗證      | `TAVILY_API_KEY` 環境變數或設定中的 `apiKey`                                                        |
| 基礎 URL  | `https://api.tavily.com`（預設）；可使用 `TAVILY_BASE_URL` 環境變數或設定中的 `baseUrl` 覆寫         |
| 逾時時間  | 搜尋 30 秒、擷取 60 秒（預設）                                                                      |
| 工具      | `tavily_search`、`tavily_extract`                                                                    |

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="取得 API 金鑰">
    在 [tavily.com](https://tavily.com) 建立 Tavily 帳戶，然後在控制面板中產生 API 金鑰。
  </Step>
  <Step title="設定外掛和提供者">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // 如果已設定 TAVILY_API_KEY，則此項為選填
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
  <Step title="確認搜尋可正常執行">
    從任何代理程式觸發 `web_search`，或直接呼叫 `tavily_search`。
  </Step>
</Steps>

<Tip>
在初始設定或 `openclaw configure --section web` 中選擇 Tavily，會在需要時安裝並啟用官方 Tavily 外掛。
</Tip>

## 工具參考

### `tavily_search`

當你需要 Tavily 專屬的搜尋控制，而非通用的 `web_search` 時，請使用此工具。

| 參數              | 類型         | 限制／預設值                           | 說明                                      |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------- |
| `query`           | 字串         | 必填                                   | 搜尋查詢字串。                            |
| `search_depth`    | 列舉         | `basic`（預設）、`advanced`            | `advanced` 較慢，但相關性更高。           |
| `topic`           | 列舉         | `general`（預設）、`news`、`finance`   | 依主題類別篩選。                          |
| `max_results`     | 整數         | 1–20，預設為 `5`                       | 結果數量。                                |
| `include_answer`  | 布林值       | 預設為 `false`                         | 包含由 Tavily AI 產生的答案摘要。         |
| `time_range`      | 列舉         | `day`、`week`、`month`、`year`         | 依新近程度篩選結果。                      |
| `include_domains` | 字串陣列     | （無）                                 | 僅包含來自這些網域的結果。                |
| `exclude_domains` | 字串陣列     | （無）                                 | 排除來自這些網域的結果。                  |

搜尋深度的取捨：

| 深度       | 速度 | 相關性 | 最適合的用途                         |
| ---------- | ---- | ------ | ------------------------------------ |
| `basic`    | 較快 | 高     | 一般用途的查詢（預設）。             |
| `advanced` | 較慢 | 最高   | 精準研究與事實查證。                 |

### `tavily_extract`

使用此工具從一個或多個 URL 擷取乾淨內容。它可處理由 JavaScript 轉譯的頁面，並支援以查詢為重點的分塊，以進行針對性擷取。

| 參數                | 類型         | 限制／預設值                        | 說明                                                        |
| ------------------- | ------------ | ----------------------------------- | ----------------------------------------------------------- |
| `urls`              | 字串陣列     | 必填，1–20                          | 要從中擷取內容的 URL。                                      |
| `query`             | 字串         | （選填）                            | 依與此查詢的相關性重新排序擷取的內容區塊。                  |
| `extract_depth`     | 列舉         | `basic`（預設）、`advanced`         | 對大量使用 JS 的頁面、SPA 或動態表格使用 `advanced`。       |
| `chunks_per_source` | 整數         | 1–5；**需要 `query`**               | 每個 URL 傳回的內容區塊數。未設定 `query` 時設定此項會發生錯誤。 |
| `include_images`    | 布林值       | 預設為 `false`                      | 在結果中包含圖片 URL。                                      |

擷取深度的取捨：

| 深度       | 使用時機                                     |
| ---------- | -------------------------------------------- |
| `basic`    | 簡單頁面。請先嘗試此選項。                   |
| `advanced` | 由 JS 轉譯的 SPA、動態內容和表格。           |

<Tip>
將較大的 URL 清單分批交由多次 `tavily_extract` 呼叫處理（每個請求最多 20 個）。使用 `query` 搭配 `chunks_per_source`，只取得相關內容，而非完整頁面。
</Tip>

## 選擇合適的工具

| 需求                                 | 工具               |
| ------------------------------------ | ------------------ |
| 快速網頁搜尋，無特殊選項             | `web_search`       |
| 依深度和主題搜尋，並取得 AI 答案     | `tavily_search`    |
| 從特定 URL 擷取內容                  | `tavily_extract`   |

<Note>
以 Tavily 作為提供者的通用 `web_search` 工具支援 `query` 和 `count`（最多 20 筆結果）。若要使用 Tavily 專屬控制項（`search_depth`、`topic`、`include_answer`、網域篩選、時間範圍），請改用 `tavily_search`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="API 金鑰解析順序">
    Tavily 用戶端會依下列順序尋找 API 金鑰：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（透過 SecretRefs 解析）。
    2. 閘道環境中的 `TAVILY_API_KEY`。

    如果兩者都不存在，`tavily_search` 和 `tavily_extract` 都會引發設定錯誤。

  </Accordion>

  <Accordion title="自訂基礎 URL">
    如果你透過代理伺服器轉送 Tavily，請覆寫 `plugins.entries.tavily.config.webSearch.baseUrl`，或設定 `TAVILY_BASE_URL`。設定值的優先順序高於環境變數。預設值為 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` 需要 `query`">
    `tavily_extract` 會拒絕傳入 `chunks_per_source` 卻未傳入 `query` 的呼叫。Tavily 會根據查詢相關性排列內容區塊，因此若沒有查詢，此參數便沒有意義。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="網頁搜尋概覽" href="/zh-TW/tools/web" icon="magnifying-glass">
    所有提供者和自動偵測規則。
  </Card>
  <Card title="Firecrawl" href="/zh-TW/tools/firecrawl" icon="fire">
    結合內容擷取的搜尋和資料抓取。
  </Card>
  <Card title="Exa Search" href="/zh-TW/tools/exa-search" icon="binoculars">
    結合內容擷取的神經搜尋。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    外掛項目和工具路由的完整設定結構描述。
  </Card>
</CardGroup>
