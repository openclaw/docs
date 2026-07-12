---
read_when:
    - 你想將 Perplexity 設定為網頁搜尋提供者
    - 你需要 Perplexity API 金鑰或 OpenRouter Proxy 設定
summary: Perplexity 網頁搜尋提供者設定（API 金鑰、搜尋模式、篩選）
title: Perplexity
x-i18n:
    generated_at: "2026-07-11T21:46:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity 外掛會註冊一個 `web_search` 提供者，並支援兩種傳輸方式：原生 Perplexity Search API（提供含篩選條件的結構化結果），以及直接使用或透過 OpenRouter 使用的 Perplexity Sonar 聊天補全（提供由 AI 綜合產生且附帶引用來源的答案）。

<Note>
本頁說明 Perplexity **提供者**的設定方式。如需了解 Perplexity **工具**（代理程式如何使用它），請參閱 [Perplexity 搜尋](/zh-TW/tools/perplexity-search)。
</Note>

| 屬性        | 值                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 類型        | 網頁搜尋提供者（不是模型提供者）                                       |
| 驗證        | `PERPLEXITY_API_KEY`（原生）或 `OPENROUTER_API_KEY`（透過 OpenRouter） |
| 設定路徑    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| 覆寫項目    | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| 取得金鑰    | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## 安裝外掛

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    ```bash
    openclaw configure --section web
    ```

    或直接設定金鑰：

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    在閘道環境中匯出為 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY` 的金鑰也可使用。

  </Step>
  <Step title="開始搜尋">
    當 Perplexity 的金鑰是可用的搜尋憑證時，`web_search` 會自動偵測 Perplexity；不需要進一步設定。若要明確指定提供者：

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## 搜尋模式

此外掛會依下列順序決定傳輸方式：

1. 已設定 `webSearch.baseUrl` 或 `webSearch.model`：無論金鑰類型為何，一律透過該端點的 Sonar 聊天補全路由。
2. 否則，由金鑰來源決定端點：已設定金鑰的前綴會選擇傳輸方式（設定優先於環境變數）；環境金鑰則直接使用其對應的端點。

| 金鑰前綴 | 傳輸方式                                                   | 功能                                           |
| -------- | ---------------------------------------------------------- | ---------------------------------------------- |
| `pplx-`  | 原生 Perplexity Search API（`https://api.perplexity.ai`）  | 結構化結果、網域／語言／日期篩選               |
| `sk-or-` | OpenRouter（`https://openrouter.ai/api/v1`）、Sonar 模型   | 由 AI 綜合產生且附帶引用來源的答案             |

已設定且具有其他任何前綴的金鑰也會使用原生 Search API。聊天補全路徑預設使用 `perplexity/sonar-pro` 模型；可透過 `plugins.entries.perplexity.config.webSearch.model` 覆寫。

## 原生 API 篩選

| 篩選條件                             | 說明                                                            | 傳輸方式     |
| ------------------------------------ | --------------------------------------------------------------- | ------------ |
| `count`                              | 每次搜尋的結果數，1–10（預設為 5）                              | 僅限原生     |
| `freshness`                          | 時效範圍：`day`、`week`、`month`、`year`                        | 兩者皆可     |
| `country`                            | 2 個字母的國家代碼（`us`、`de`、`jp`）                         | 僅限原生     |
| `language`                           | ISO 639-1 語言代碼（`en`、`fr`、`zh`）                         | 僅限原生     |
| `date_after` / `date_before`         | `YYYY-MM-DD` 格式的發布日期範圍                                | 僅限原生     |
| `domain_filter`                      | 最多 20 個網域；可使用允許清單或帶有 `-` 前綴的拒絕清單，不可混用 | 僅限原生   |
| `max_tokens` / `max_tokens_per_page` | 所有結果的總內容額度／每頁內容額度                              | 僅限原生     |

在聊天補全路徑上使用僅限原生的篩選條件時，會傳回說明性錯誤。`freshness` 不可與 `date_after`／`date_before` 搭配使用。

## 進階設定

<AccordionGroup>
  <Accordion title="常駐程序的環境變數">
    <Warning>
    僅在互動式 shell 中匯出的金鑰，對 launchd/systemd 閘道常駐程序並不可見，除非明確匯入該環境。請在 `~/.openclaw/.env` 中或透過 `env.shellEnv` 設定金鑰，讓閘道程序可以讀取。完整的優先順序請參閱[環境變數](/zh-TW/help/environment)。
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter Proxy 設定">
    若要透過 OpenRouter 路由 Perplexity 搜尋，請設定 `OPENROUTER_API_KEY`（前綴為 `sk-or-`），而非原生 Perplexity 金鑰。OpenClaw 會偵測該金鑰並自動切換至 Sonar 傳輸方式。如果您已設定 OpenRouter 計費，並希望在該處整合各個提供者，此方式會很實用。
  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="Perplexity 搜尋工具" href="/zh-TW/tools/perplexity-search" icon="magnifying-glass">
    代理程式如何呼叫 Perplexity 搜尋及解讀結果。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整的設定參考，包括外掛項目。
  </Card>
</CardGroup>
