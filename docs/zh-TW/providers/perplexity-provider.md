---
read_when:
    - 您想要將 Perplexity 設定為網頁搜尋提供者
    - 你需要 Perplexity API 金鑰或 OpenRouter 代理設定
summary: Perplexity 網頁搜尋供應商設定（API 金鑰、搜尋模式、篩選）
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T03:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin 透過 Perplexity Search API 或經由 OpenRouter 使用 Perplexity Sonar，提供網頁搜尋功能。

<Note>
本頁是 Perplexity **provider** 設定。如需 Perplexity **tool**（代理如何使用它），請參閱 [Perplexity tool](/zh-TW/tools/perplexity-search)。
</Note>

| 屬性        | 值                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 類型        | 網頁搜尋供應器（不是模型供應器）                                       |
| 驗證        | `PERPLEXITY_API_KEY`（直接）或 `OPENROUTER_API_KEY`（透過 OpenRouter） |
| 設定路徑    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

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
    金鑰設定完成後，代理會自動使用 Perplexity 進行網頁搜尋。不需要其他步驟。
  </Step>
</Steps>

## 搜尋模式

Plugin 會根據 API 金鑰前綴自動選擇傳輸方式：

<Tabs>
  <Tab title="原生 Perplexity API (pplx-)">
    當你的金鑰以 `pplx-` 開頭時，OpenClaw 會使用原生 Perplexity Search API。此傳輸方式會傳回結構化結果，並支援網域、語言與日期篩選器（請參閱下方的篩選選項）。
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    當你的金鑰以 `sk-or-` 開頭時，OpenClaw 會透過 OpenRouter，使用 Perplexity Sonar 模型進行路由。此傳輸方式會傳回帶有引用來源的 AI 綜合答案。
  </Tab>
</Tabs>

| 金鑰前綴 | 傳輸方式                     | 功能                                             |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | 原生 Perplexity Search API   | 結構化結果、網域/語言/日期篩選器                |
| `sk-or-`   | OpenRouter (Sonar)           | 帶有引用來源的 AI 綜合答案                      |

## 原生 API 篩選

<Note>
篩選選項僅在使用原生 Perplexity API（`pplx-` 金鑰）時可用。OpenRouter/Sonar 搜尋不支援這些參數。
</Note>

使用原生 Perplexity API 時，搜尋支援下列篩選器：

| 篩選器       | 說明                                  | 範例                                |
| -------------- | -------------------------------------- | ----------------------------------- |
| 國家           | 2 個字母的國家代碼                    | `us`, `de`, `jp`                    |
| 語言           | ISO 639-1 語言代碼                    | `en`, `fr`, `zh`                    |
| 日期範圍       | 近期時間範圍                          | `day`, `week`, `month`, `year`      |
| 網域篩選器     | 允許清單或封鎖清單（最多 20 個網域） | `example.com`                       |
| 內容預算       | 每次回應 / 每頁的 Token 限制          | `max_tokens`, `max_tokens_per_page` |

## 進階設定

<AccordionGroup>
  <Accordion title="Daemon 程序的環境變數">
    如果 OpenClaw Gateway 以 daemon（launchd/systemd）方式執行，請確認該程序可使用 `PERPLEXITY_API_KEY`。

    <Warning>
    只在 `~/.profile` 中設定的金鑰，不會對 launchd/systemd daemon 可見，除非明確匯入該環境。請在 `~/.openclaw/.env` 中設定金鑰，或透過 `env.shellEnv` 設定，以確保 Gateway 程序能讀取它。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter 代理設定">
    如果你偏好透過 OpenRouter 路由 Perplexity 搜尋，請設定 `OPENROUTER_API_KEY`（前綴 `sk-or-`），而不是原生 Perplexity 金鑰。OpenClaw 會偵測此前綴，並自動切換到 Sonar 傳輸方式。

    <Tip>
    如果你已經有 OpenRouter 帳戶，並想在多個供應器之間整合帳單，OpenRouter 傳輸方式會很有用。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/zh-TW/tools/perplexity-search" icon="magnifying-glass">
    代理如何叫用 Perplexity 搜尋並解讀結果。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    包含 Plugin entries 的完整設定參考。
  </Card>
</CardGroup>
