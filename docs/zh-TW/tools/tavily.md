---
read_when:
    - 你想要由 Tavily 支援的網頁搜尋
    - 你需要 Tavily API 金鑰
    - 你想要將 Tavily 作為 web_search 提供者
    - 你想要從 URL 擷取內容
summary: Tavily 搜尋與擷取工具
title: Tavily
x-i18n:
    generated_at: "2026-06-27T20:10:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) 是專為 AI 應用設計的搜尋 API。OpenClaw 透過兩種方式公開它：

- 作為通用搜尋工具的 `web_search` 提供者
- 作為明確的外掛工具：`tavily_search` 和 `tavily_extract`

Tavily 會回傳針對 LLM 使用最佳化的結構化結果，並支援可設定的搜尋深度、主題篩選、網域篩選、AI 產生的答案摘要，以及從 URL 擷取內容（包括 JavaScript 渲染的頁面）。

| 屬性      | 值                                  |
| --------- | ----------------------------------- |
| 外掛 id   | `tavily`                            |
| 套件      | `@openclaw/tavily-plugin`           |
| 驗證      | `TAVILY_API_KEY` 或設定 `apiKey`    |
| 基礎 URL  | `https://api.tavily.com`（預設）    |
| 工具      | `tavily_search`, `tavily_extract`   |

## 開始使用

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="取得 API 金鑰">
    在 [tavily.com](https://tavily.com) 建立 Tavily 帳號，然後在儀表板中產生 API 金鑰。
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
  <Step title="確認搜尋可執行">
    從任何代理觸發 `web_search`，或直接呼叫 `tavily_search`。
  </Step>
</Steps>

<Tip>
在導覽式設定或 `openclaw configure --section web` 中選擇 Tavily，會在需要時安裝並啟用官方 Tavily 外掛。
</Tip>

## 工具參考

### `tavily_search`

當你想使用 Tavily 專屬搜尋控制項，而不是通用 `web_search` 時，請使用此工具。

| 參數              | 類型         | 限制 / 預設                            | 說明                                            |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | 必填                                   | 搜尋查詢字串。請保持在 400 個字元以下。        |
| `search_depth`    | enum         | `basic`（預設）, `advanced`            | `advanced` 較慢，但相關性更高。                |
| `topic`           | enum         | `general`（預設）, `news`, `finance`   | 依主題類別篩選。                              |
| `max_results`     | integer      | 1-20                                   | 結果數量。                                    |
| `include_answer`  | boolean      | 預設 `false`                           | 包含 Tavily AI 產生的答案摘要。                |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | 依近期程度篩選結果。                          |
| `include_domains` | string array | （無）                                 | 只包含來自這些網域的結果。                    |
| `exclude_domains` | string array | （無）                                 | 排除來自這些網域的結果。                      |

搜尋深度取捨：

| 深度       | 速度   | 相關性 | 最適合                                           |
| ---------- | ------ | ------ | ------------------------------------------------ |
| `basic`    | 較快   | 高     | 通用查詢（預設）。                              |
| `advanced` | 較慢   | 最高   | 精準研究與事實查證。                            |

### `tavily_extract`

使用此工具可從一個或多個 URL 擷取乾淨內容。可處理 JavaScript 渲染的頁面，並支援以查詢為焦點的分塊，以進行目標式擷取。

| 參數                | 類型         | 限制 / 預設                    | 說明                                                        |
| ------------------- | ------------ | ------------------------------ | ----------------------------------------------------------- |
| `urls`              | string array | 必填，1-20                     | 要擷取內容的 URL。                                         |
| `query`             | string       | （選填）                       | 依與此查詢的相關性重新排序擷取出的區塊。                   |
| `extract_depth`     | enum         | `basic`（預設）, `advanced`    | 對 JS 較重的頁面、SPA 或動態表格使用 `advanced`。          |
| `chunks_per_source` | integer      | 1-5；**需要 `query`**          | 每個 URL 回傳的區塊數。若未設定 `query` 便設定此項會出錯。 |
| `include_images`    | boolean      | 預設 `false`                   | 在結果中包含圖片 URL。                                     |

擷取深度取捨：

| 深度       | 使用時機                                      |
| ---------- | --------------------------------------------- |
| `basic`    | 簡單頁面。請先嘗試此選項。                   |
| `advanced` | JS 渲染的 SPA、動態內容、表格。              |

<Tip>
將較大的 URL 清單分批成多次 `tavily_extract` 呼叫（每個請求最多 20 個）。使用 `query` 加上 `chunks_per_source`，只取得相關內容，而不是完整頁面。
</Tip>

## 選擇合適的工具

| 需求                                 | 工具             |
| ------------------------------------ | ---------------- |
| 快速網頁搜尋，無特殊選項             | `web_search`     |
| 使用深度、主題、AI 答案進行搜尋      | `tavily_search`  |
| 從特定 URL 擷取內容                  | `tavily_extract` |

<Note>
以 Tavily 作為提供者的通用 `web_search` 工具支援 `query` 和 `count`（最多 20 個結果）。若要使用 Tavily 專屬控制項（`search_depth`、`topic`、`include_answer`、網域篩選、時間範圍），請改用 `tavily_search`。
</Note>

## 進階設定

<AccordionGroup>
  <Accordion title="API 金鑰解析順序">
    Tavily 用戶端會依以下順序查找其 API 金鑰：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（透過 SecretRefs 解析）。
    2. 來自閘道環境的 `TAVILY_API_KEY`。

    若兩者都不存在，`tavily_extract` 會引發設定錯誤。

  </Accordion>

  <Accordion title="自訂基礎 URL">
    如果你透過代理轉接 Tavily，請覆寫 `plugins.entries.tavily.config.webSearch.baseUrl`。預設為 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` 需要 `query`">
    `tavily_extract` 會拒絕傳入 `chunks_per_source` 但沒有 `query` 的呼叫。Tavily 會依查詢相關性排序區塊，因此沒有查詢時此參數沒有意義。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Web Search 概覽" href="/zh-TW/tools/web" icon="magnifying-glass">
    所有提供者和自動偵測規則。
  </Card>
  <Card title="Firecrawl" href="/zh-TW/tools/firecrawl" icon="fire">
    結合搜尋與內容擷取的爬取。
  </Card>
  <Card title="Exa Search" href="/zh-TW/tools/exa-search" icon="binoculars">
    搭配內容擷取的神經搜尋。
  </Card>
  <Card title="設定" href="/zh-TW/gateway/configuration" icon="gear">
    外掛項目和工具路由的完整設定結構描述。
  </Card>
</CardGroup>
