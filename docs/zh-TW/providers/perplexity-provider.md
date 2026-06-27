---
read_when:
    - 你想將 Perplexity 設定為網頁搜尋提供者
    - 你需要 Perplexity API 金鑰或 OpenRouter 代理設定
summary: Perplexity 網頁搜尋提供者設定（API 金鑰、搜尋模式、篩選）
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T19:56:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity 外掛透過 Perplexity
Search API 或經由 OpenRouter 的 Perplexity Sonar 提供網頁搜尋功能。

<Note>
本頁是 Perplexity **提供者**設定。若要了解 Perplexity **工具**（代理程式如何使用它），請參閱 [Perplexity 工具](/zh-TW/tools/perplexity-search)。
</Note>

| 屬性        | 值                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 類型        | 網頁搜尋提供者（不是模型提供者）                                       |
| 驗證        | `PERPLEXITY_API_KEY`（直接）或 `OPENROUTER_API_KEY`（透過 OpenRouter） |
| 設定路徑    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## 安裝外掛

安裝官方外掛，然後重新啟動閘道：

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## 開始使用

<Steps>
  <Step title="設定 API 金鑰">
    執行互動式網頁搜尋設定流程：

    ```bash
    openclaw configure --section web
    ```

    或直接設定金鑰：

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="開始搜尋">
    金鑰設定完成後，代理程式會自動使用 Perplexity 進行網頁搜尋。
    不需要其他步驟。
  </Step>
</Steps>

## 搜尋模式

外掛會根據 API 金鑰前綴自動選擇傳輸方式：

<Tabs>
  <Tab title="原生 Perplexity API（pplx-）">
    當你的金鑰以 `pplx-` 開頭時，OpenClaw 會使用原生 Perplexity Search
    API。此傳輸方式會傳回結構化結果，並支援網域、語言與日期篩選器（請參閱下方的篩選選項）。
  </Tab>
  <Tab title="OpenRouter / Sonar（sk-or-）">
    當你的金鑰以 `sk-or-` 開頭時，OpenClaw 會透過 OpenRouter 使用
    Perplexity Sonar 模型進行路由。此傳輸方式會傳回由 AI 合成且附有引用的答案。
  </Tab>
</Tabs>

| 金鑰前綴 | 傳輸方式                     | 功能                                             |
| -------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`  | 原生 Perplexity Search API   | 結構化結果、網域/語言/日期篩選器                |
| `sk-or-` | OpenRouter（Sonar）          | 由 AI 合成且附有引用的答案                      |

## 原生 API 篩選

<Note>
篩選選項僅在使用原生 Perplexity API（`pplx-` 金鑰）時可用。
OpenRouter/Sonar 搜尋不支援這些參數。
</Note>

使用原生 Perplexity API 時，搜尋支援下列篩選器：

| 篩選器       | 說明                               | 範例                                |
| ------------ | ---------------------------------- | ----------------------------------- |
| 國家         | 2 字母國家代碼                     | `us`, `de`, `jp`                    |
| 語言         | ISO 639-1 語言代碼                 | `en`, `fr`, `zh`                    |
| 日期範圍     | 新近度時間範圍                     | `day`, `week`, `month`, `year`      |
| 網域篩選器   | 允許清單或拒絕清單（最多 20 個網域） | `example.com`                       |
| 內容預算     | 每個回應 / 每頁的 Token 限制       | `max_tokens`, `max_tokens_per_page` |

## 進階設定

<AccordionGroup>
  <Accordion title="守護程式程序的環境變數">
    如果 OpenClaw 閘道以守護程式（launchd/systemd）執行，請確認
    `PERPLEXITY_API_KEY` 可供該程序使用。

    <Warning>
    只在互動式 shell 中匯出的金鑰，除非明確匯入該環境，否則 launchd/systemd
    守護程式看不到。請在 `~/.openclaw/.env` 或透過 `env.shellEnv` 設定金鑰，以確保閘道
    程序可以讀取。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter 代理設定">
    如果你偏好透過 OpenRouter 路由 Perplexity 搜尋，請設定
    `OPENROUTER_API_KEY`（前綴 `sk-or-`），而不是原生 Perplexity 金鑰。
    OpenClaw 會偵測前綴並自動切換到 Sonar 傳輸方式。

    <Tip>
    如果你已經有 OpenRouter 帳戶，並想在多個提供者之間整合計費，OpenRouter 傳輸方式會很有用。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Perplexity 搜尋工具" href="/zh-TW/tools/perplexity-search" icon="magnifying-glass">
    代理程式如何叫用 Perplexity 搜尋並解讀結果。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定參考，包含外掛項目。
  </Card>
</CardGroup>
