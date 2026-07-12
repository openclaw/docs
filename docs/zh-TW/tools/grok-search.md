---
read_when:
    - 你想使用 Grok 進行 web_search
    - 你想使用 xAI OAuth 或 XAI_API_KEY 進行網頁搜尋
summary: 透過 xAI 網路依據回應進行 Grok 網路搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-07-11T21:54:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援將 Grok 作為 `web_search` 提供者，使用以網路資訊為依據的 xAI 回應，根據即時搜尋結果產生附有引用來源的 AI 綜合答案。

Grok 網路搜尋會優先使用現有的 xAI OAuth 登入（若有）。如果沒有 OAuth 設定檔，同一把 xAI API 金鑰也可供內建的 `x_search` 工具搜尋 X（前稱 Twitter）貼文，以及供 `code_execution` 工具使用。將金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey`，也可讓 OpenClaw 將其重複用作隨附 xAI 模型提供者的備援。

若要取得貼文層級的 X 指標（轉發、回覆、書籤、瀏覽次數），請使用 [`x_search`](/zh-TW/tools/web#x_search) 並提供確切的貼文 URL 或狀態 ID，而非寬泛的搜尋查詢。

## 新手設定與配置

在 `openclaw onboard` 或 `openclaw configure --section
web` 期間選擇 **Grok**，可讓 OpenClaw 重複使用現有的 xAI OAuth 設定檔，而不會提示輸入另一把網路搜尋金鑰。沒有 OAuth 時，則會退回使用 xAI API 金鑰設定。

接著，OpenClaw 會提供後續步驟，讓你使用同一組 xAI 憑證啟用 `x_search`。此後續步驟：

- 僅在你選擇 Grok 作為 `web_search` 提供者後顯示
- 並非另一個獨立的頂層網路搜尋提供者選項
- 可選擇在同一流程中設定 `x_search` 模型

你可以略過此步驟，稍後再於設定中啟用或變更 `x_search`。

## 登入或取得 API 金鑰

<Steps>
  <Step title="使用 xAI OAuth">
    如果你已在新手設定或模型驗證期間登入 xAI，請選擇 Grok 作為 `web_search` 提供者。不需要另一把 API 金鑰：

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="使用 API 金鑰備援">
    當 OAuth 無法使用，或你刻意想使用由金鑰支援的網路搜尋設定時，請從 [xAI](https://console.x.ai/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `XAI_API_KEY`，或透過以下指令進行配置：

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
            apiKey: "xai-...", // 若可使用 xAI OAuth 或 XAI_API_KEY，則為選填
            baseUrl: "https://api.x.ai/v1", // 選填的 Responses API Proxy／基底 URL 覆寫值
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

**憑證替代方案：**`openclaw models auth login --provider xai
--method oauth`、閘道環境中的 `XAI_API_KEY`，或 `plugins.entries.xai.config.webSearch.apiKey`。若為閘道安裝，請將環境變數放在 `~/.openclaw/.env` 中。

## 運作方式

Grok 使用以網路資訊為依據的 xAI 回應，綜合產生含行內引用來源的答案，類似 Gemini 的 Google 搜尋依據機制。

## 支援的參數

Grok 搜尋支援 `query`。為了與共用 `web_search` 相容，亦接受 `count`，但 Grok 一律傳回一個附有引用來源的綜合答案，而非包含 N 筆結果的清單。不支援提供者專屬的篩選條件。

Grok 預設逾時時間為 60 秒，因為以網路資訊為依據的 xAI Responses 搜尋可能比共用 `web_search` 的預設時間執行得更久。可使用 `tools.web.search.timeoutSeconds` 覆寫此設定。

## 基底 URL 覆寫

設定 `plugins.entries.xai.config.webSearch.baseUrl`，可透過營運者 Proxy 或與 xAI 相容的 Responses 端點路由 Grok 網路搜尋。OpenClaw 移除結尾斜線後，會向 `<baseUrl>/responses` 傳送 POST 要求。除非設定了 `plugins.entries.xai.config.xSearch.baseUrl`，否則 `x_search` 會退回使用相同的 `webSearch.baseUrl`。

## 相關內容

- [網路搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [網路搜尋中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 提供的一級 X 搜尋
- [Gemini 搜尋](/zh-TW/tools/gemini-search) -- 透過 Google 搜尋依據機制產生 AI 綜合答案
