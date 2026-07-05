---
read_when:
    - 你想將 Perplexity 設定為網頁搜尋提供者
    - 你需要 Perplexity API 金鑰或 OpenRouter 代理設定
summary: Perplexity 網頁搜尋提供者設定（API 金鑰、搜尋模式、篩選）
title: Perplexity
x-i18n:
    generated_at: "2026-07-05T11:38:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity 外掛會註冊一個 `web_search` 提供者，並提供兩種傳輸方式：原生 Perplexity Search API（含篩選器的結構化結果）與 Perplexity Sonar chat completions，可直接使用或透過 OpenRouter（附引用來源的 AI 合成答案）。

<Note>
本頁涵蓋 Perplexity **提供者**設定。若要了解 Perplexity **工具**（代理如何使用它），請參閱 [Perplexity 搜尋](/zh-TW/tools/perplexity-search)。
</Note>

| 屬性        | 值                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 類型        | 網頁搜尋提供者（不是模型提供者）                                       |
| 驗證        | `PERPLEXITY_API_KEY`（原生）或 `OPENROUTER_API_KEY`（透過 OpenRouter） |
| 設定路徑    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| 覆寫        | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
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

    在閘道環境中匯出的 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY` 金鑰也可以使用。

  </Step>
  <Step title="開始搜尋">
    一旦可用的搜尋憑證是 Perplexity 金鑰，`web_search` 會自動偵測 Perplexity；不需要其他設定。若要明確固定提供者：

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## 搜尋模式

此外掛會依照以下順序解析傳輸方式：

1. 已設定 `webSearch.baseUrl` 或 `webSearch.model`：一律透過 Sonar chat completions 路由到該端點，無論金鑰類型為何。
2. 否則，金鑰來源會決定端點：已設定金鑰的前綴會選擇傳輸方式（設定優先於環境變數）；環境金鑰會直接使用其相符的端點。

| 金鑰前綴 | 傳輸方式                                                   | 功能                                             |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | 原生 Perplexity Search API (`https://api.perplexity.ai`)   | 結構化結果、網域/語言/日期篩選器                |
| `sk-or-`   | OpenRouter (`https://openrouter.ai/api/v1`)，Sonar 模型    | 附引用來源的 AI 合成答案                         |

任何其他前綴的已設定金鑰也會使用原生 Search API。chat-completions 路徑預設使用 `perplexity/sonar-pro` 模型；可透過 `plugins.entries.perplexity.config.webSearch.model` 覆寫。

## 原生 API 篩選

| 篩選器                               | 說明                                                           | 傳輸方式     |
| ------------------------------------ | -------------------------------------------------------------- | ------------ |
| `count`                              | 每次搜尋的結果數，1-10（預設 5）                              | 僅限原生     |
| `freshness`                          | 新近度時間範圍：`day`、`week`、`month`、`year`                 | 兩者皆可     |
| `country`                            | 2 字母國家/地區代碼（`us`、`de`、`jp`）                       | 僅限原生     |
| `language`                           | ISO 639-1 語言代碼（`en`、`fr`、`zh`）                         | 僅限原生     |
| `date_after` / `date_before`         | `YYYY-MM-DD` 格式的發布日期範圍                               | 僅限原生     |
| `domain_filter`                      | 最多 20 個網域；允許清單或以 `-` 前綴的拒絕清單，不可混用     | 僅限原生     |
| `max_tokens` / `max_tokens_per_page` | 所有結果/每頁的內容預算                                       | 僅限原生     |

僅限原生的篩選器在 chat-completions 路徑上會回傳描述性錯誤。`freshness` 不能與 `date_after`/`date_before` 搭配使用。

## 進階設定

<AccordionGroup>
  <Accordion title="背景程序的環境變數">
    <Warning>
    只在互動式 shell 中匯出的金鑰，除非明確匯入該環境，否則 launchd/systemd 閘道背景程序看不到。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，讓閘道程序可以讀取。完整優先順序請參閱[環境變數](/zh-TW/help/environment)。
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter 代理設定">
    若要透過 OpenRouter 路由 Perplexity 搜尋，請設定 `OPENROUTER_API_KEY`（前綴 `sk-or-`），而不是原生 Perplexity 金鑰。OpenClaw 會偵測金鑰並自動切換到 Sonar 傳輸方式。如果你已經設定 OpenRouter 帳單並想在該處整合提供者，這會很有用。
  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Perplexity 搜尋工具" href="/zh-TW/tools/perplexity-search" icon="magnifying-glass">
    代理如何呼叫 Perplexity 搜尋並解讀結果。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定參考，包括外掛項目。
  </Card>
</CardGroup>
