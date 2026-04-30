---
read_when:
    - 你想使用 Grok 進行 web_search
    - 若要使用網頁搜尋，你需要 XAI_API_KEY
summary: 透過 xAI 以網頁為依據的回應進行 Grok 網頁搜尋
title: Grok 搜尋
x-i18n:
    generated_at: "2026-04-30T03:45:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw 支援 Grok 作為 `web_search` 提供者，使用 xAI 以網頁為依據的
回應來產生由即時搜尋結果支援並附有引用的 AI 合成答案。

同一個 `XAI_API_KEY` 也可以驅動內建的 `x_search` 工具，用於 X
（前稱 Twitter）貼文搜尋。如果你將金鑰儲存在
`plugins.entries.xai.config.webSearch.apiKey` 底下，OpenClaw 現在也會將它重複用作
隨附 xAI 模型提供者的後備。

對於貼文層級的 X 指標，例如轉發、回覆、書籤或瀏覽次數，請優先使用
`x_search` 搭配確切的貼文 URL 或狀態 ID，而不是寬泛的搜尋
查詢。

## 初始設定與配置

如果你在下列期間選擇 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以顯示一個獨立的後續步驟，以使用相同的
`XAI_API_KEY` 啟用 `x_search`。該後續步驟：

- 只有在你為 `web_search` 選擇 Grok 之後才會出現
- 不是另一個獨立的頂層網頁搜尋提供者選項
- 可以在同一個流程中選擇性設定 `x_search` 模型

如果你略過它，可以稍後在 config 中啟用或變更 `x_search`。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    從 [xAI](https://console.x.ai/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `XAI_API_KEY`，或透過下列方式配置：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Config

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
對於 gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 運作方式

Grok 使用 xAI 以網頁為依據的回應，產生帶有行內
引用的合成答案，類似 Gemini 的 Google Search grounding 方法。

## 支援的參數

Grok search 支援 `query`。

為了與共享的 `web_search` 相容，也接受 `count`，但 Grok 仍然
會回傳一個附有引用的合成答案，而不是 N 筆結果清單。

目前不支援提供者專屬篩選器。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Web Search 中的 x_search](/zh-TW/tools/web#x_search) -- 透過 xAI 提供第一級 X 搜尋
- [Gemini Search](/zh-TW/tools/gemini-search) -- 透過 Google grounding 提供 AI 合成答案
