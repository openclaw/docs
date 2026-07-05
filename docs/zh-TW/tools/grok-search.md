---
read_when:
    - 你想使用 Grok 進行 web_search
    - 你想使用 xAI OAuth 或 XAI_API_KEY 進行網頁搜尋
summary: Grok 透過 xAI 網頁依據回應進行網頁搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-07-05T11:45:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援 Grok 作為 `web_search` 提供者，使用 xAI 的網頁紮根回應，產生由即時搜尋結果支援並附有引用的 AI 綜合答案。

Grok 網頁搜尋會優先使用現有的 xAI OAuth 登入（如果可用）。如果沒有 OAuth 設定檔，同一把 xAI API 金鑰也會驅動內建的 `x_search` 工具，用於 X（前稱 Twitter）貼文搜尋，以及 `code_execution` 工具。將金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 也可讓 OpenClaw 將它重用為內建 xAI 模型提供者的備援。

若要取得貼文層級的 X 指標（轉發、回覆、書籤、觀看次數），請使用含有確切貼文 URL 或狀態 ID 的 [`x_search`](/zh-TW/tools/web#x_search)，而不是寬泛的搜尋查詢。

## 入門設定與 configure

在 `openclaw onboard` 或 `openclaw configure --section
web` 期間選擇 **Grok**，可讓 OpenClaw 重用現有的 xAI OAuth 設定檔，而不會提示輸入另一把網頁搜尋金鑰。沒有 OAuth 時，會退回使用 xAI API 金鑰設定。

接著 OpenClaw 會提供後續步驟，使用同一組 xAI 憑證啟用 `x_search`。該後續步驟：

- 只會在你為 `web_search` 選擇 Grok 後出現
- 不是另一個獨立的頂層網頁搜尋提供者選項
- 可選擇在同一流程中設定 `x_search` 模型

略過它即可稍後在設定中啟用或變更 `x_search`。

## 登入或取得 API 金鑰

<Steps>
  <Step title="使用 xAI OAuth">
    如果你已在入門設定或模型驗證期間使用 xAI 登入，請選擇 Grok 作為 `web_search` 提供者。不需要另外的 API 金鑰：

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="使用 API 金鑰備援">
    當 OAuth 不可用，或你刻意想使用金鑰支援的網頁搜尋設定時，請從 [xAI](https://console.x.ai/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `XAI_API_KEY`，或透過以下方式設定：

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**憑證替代方案：** `openclaw models auth login --provider xai
--method oauth`、Gateway 環境中的 `XAI_API_KEY`，或
`plugins.entries.xai.config.webSearch.apiKey`。若是閘道安裝，請將環境變數放在 `~/.openclaw/.env`。

## 運作方式

Grok 使用 xAI 網頁紮根回應，綜合產生含有行內引用的答案，類似 Gemini 的 Google Search 紮根方法。

## 支援的參數

Grok 搜尋支援 `query`。為了共用 `web_search` 相容性，也接受 `count`，但 Grok 一律會傳回一個附有引用的綜合答案，而不是 N 筆結果清單。不支援提供者特定篩選器。

Grok 預設逾時時間為 60 秒，因為 xAI Responses 網頁紮根搜尋可能比共用的 `web_search` 預設值執行更久。可使用 `tools.web.search.timeoutSeconds` 覆寫。

## 基底 URL 覆寫

設定 `plugins.entries.xai.config.webSearch.baseUrl`，即可將 Grok 網頁搜尋透過操作員代理或 xAI 相容的 Responses 端點路由。OpenClaw 會在修剪結尾斜線後發佈到 `<baseUrl>/responses`。除非已設定 `plugins.entries.xai.config.xSearch.baseUrl`，否則 `x_search` 會退回使用相同的 `webSearch.baseUrl`。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Search 中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 提供的一級 X 搜尋
- [Gemini Search](/zh-TW/tools/gemini-search) -- 透過 Google 紮根提供的 AI 綜合答案
