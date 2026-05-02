---
read_when:
    - 你想使用 Grok 進行 web_search
    - 你需要 XAI_API_KEY 才能使用網頁搜尋
summary: 透過 xAI 以網頁為依據的回應進行 Grok 網頁搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-05-02T03:00:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: ab38ee8614ba4bab9a3bf91cb14d4565f1766513594fd2d1a280ff4b2fed1478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援 Grok 作為 `web_search` 提供者，使用 xAI 以 Web 為依據的回應，產生由即時搜尋結果支援且附有引用來源的 AI 合成答案。

同一個 `XAI_API_KEY` 也可以支援內建的 `x_search` 工具，用於 X（前身為 Twitter）貼文搜尋。如果你將金鑰儲存在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 現在也會重用它，作為內建 xAI 模型提供者的備用金鑰。

若要取得貼文層級的 X 指標，例如轉貼、回覆、書籤或觀看次數，請優先使用 `x_search` 搭配確切的貼文 URL 或狀態 ID，而不是寬泛的搜尋查詢。

## 初始設定與設定

如果你在以下流程中選擇 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以顯示一個獨立的後續步驟，使用相同的 `XAI_API_KEY` 啟用 `x_search`。該後續步驟：

- 只會在你為 `web_search` 選擇 Grok 後出現
- 不是另一個獨立的頂層網頁搜尋提供者選項
- 可以選擇在同一流程中設定 `x_search` 模型

如果你略過它，稍後仍可在設定中啟用或變更 `x_search`。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    從 [xAI](https://console.x.ai/) 取得 API 金鑰。
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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

**環境替代方案：**在 Gateway 環境中設定 `XAI_API_KEY`。
若是 gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 運作方式

Grok 使用 xAI 以 Web 為依據的回應，合成包含行內引用來源的答案，類似 Gemini 的 Google 搜尋依據方法。

## 支援的參數

Grok 搜尋支援 `query`。

為了共用 `web_search` 相容性，`count` 會被接受，但 Grok 仍會回傳一個附有引用來源的合成答案，而不是 N 筆結果清單。

目前不支援提供者專屬篩選器。

Grok 使用提供者專屬的 60 秒預設逾時，因為 xAI Responses 以 Web 為依據的搜尋可能比共用的 `web_search` 預設值執行更久。設定 `tools.web.search.timeoutSeconds` 以覆寫它。

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [網頁搜尋中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 提供一級 X 搜尋
- [Gemini 搜尋](/zh-TW/tools/gemini-search) -- 透過 Google 依據提供 AI 合成答案
