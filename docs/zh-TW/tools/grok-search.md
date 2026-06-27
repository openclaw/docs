---
read_when:
    - 你想使用 Grok 進行 web_search
    - 你想要使用 xAI OAuth 或 XAI_API_KEY 進行網路搜尋
summary: 透過 xAI 網頁實據回應進行 Grok 網頁搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-06-27T20:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援 Grok 作為 `web_search` 提供者，使用 xAI 網路根據回應來產生由即時搜尋結果與引用支撐的 AI 合成答案。

Grok 網路搜尋會優先使用你現有的 xAI OAuth 登入（如果可用）。如果沒有 OAuth 個人檔案，同一把 xAI API 金鑰也可以驅動內建的 `x_search` 工具，用於 X（前身為 Twitter）貼文搜尋，以及 `code_execution` 工具。如果你將金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 也會將其重用為內建 xAI 模型提供者的備援。

對於貼文層級的 X 指標，例如轉發、回覆、書籤或觀看次數，請優先使用 `x_search` 搭配確切的貼文 URL 或狀態 ID，而不是寬泛的搜尋查詢。

## 入門設定與 configure

如果你在以下流程中選擇 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以使用現有的 xAI OAuth 個人檔案，而不會提示輸入單獨的網路搜尋金鑰。如果 OAuth 不可用，則會退回到 xAI API 金鑰設定。OpenClaw 也可以顯示單獨的後續步驟，以使用相同的 xAI 憑證啟用 `x_search`。該後續步驟：

- 只會在你為 `web_search` 選擇 Grok 後出現
- 不是單獨的頂層網路搜尋提供者選項
- 可以選擇在同一流程中設定 `x_search` 模型

如果你略過它，之後可以在設定中啟用或變更 `x_search`。

## 登入或取得 API 金鑰

<Steps>
  <Step title="使用 xAI OAuth">
    如果你已在入門設定或模型驗證期間使用 xAI 登入，請選擇 Grok 作為 `web_search` 提供者。不需要單獨的 API 金鑰：

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="使用 API 金鑰備援">
    當 OAuth 不可用，或你刻意想使用金鑰支撐的網路搜尋設定時，請從 [xAI](https://console.x.ai/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `XAI_API_KEY`，或透過以下方式設定：

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

**憑證替代方案：**使用 `openclaw models auth login
--provider xai --method oauth` 登入、在閘道環境中設定 `XAI_API_KEY`，或儲存 `plugins.entries.xai.config.webSearch.apiKey`。對於閘道安裝，請將環境變數放在 `~/.openclaw/.env`。

## 運作方式

Grok 使用 xAI 網路根據回應，透過內嵌引用合成答案，類似 Gemini 的 Google Search grounding 方法。

## 支援的參數

Grok 搜尋支援 `query`。

`count` 會被接受以相容共用的 `web_search`，但 Grok 仍會回傳一個帶有引用的合成答案，而不是 N 筆結果清單。

目前不支援提供者專屬篩選器。

Grok 使用提供者專屬的 60 秒預設逾時，因為 xAI Responses 網路根據搜尋可能比共用的 `web_search` 預設值執行得更久。設定 `tools.web.search.timeoutSeconds` 可覆寫此值。

## Base URL 覆寫

當 Grok 網路搜尋應透過操作員代理或 xAI 相容的 Responses 端點路由時，請設定 `plugins.entries.xai.config.webSearch.baseUrl`。OpenClaw 會在修剪尾端斜線後，張貼到 `<baseUrl>/responses`。除非已設定 `plugins.entries.xai.config.xSearch.baseUrl`，否則 `x_search` 會使用相同的 `webSearch.baseUrl` 備援。

## 相關

- [網路搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Search 中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 進行一級 X 搜尋
- [Gemini Search](/zh-TW/tools/gemini-search) -- 透過 Google grounding 產生 AI 合成答案
