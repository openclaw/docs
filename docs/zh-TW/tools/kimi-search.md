---
read_when:
    - 您想使用 Kimi 進行 web_search
    - 你需要 KIMI_API_KEY 或 MOONSHOT_API_KEY
summary: 透過 Moonshot 網頁搜尋進行 Kimi 網頁搜尋
title: Kimi 搜尋
x-i18n:
    generated_at: "2026-05-02T21:05:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 支援 Kimi 作為 `web_search` 提供者，使用 Moonshot 網頁搜尋產生附有引用的 AI 合成答案。

## 取得 API 金鑰

<Steps>
  <Step title="Create a key">
    從 [Moonshot AI](https://platform.moonshot.cn/) 取得 API 金鑰。
  </Step>
  <Step title="Store the key">
    在 Gateway 環境中設定 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

當你在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

- Moonshot API 區域：
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 預設 Kimi 網頁搜尋模型（預設為 `kimi-k2.6`）

## 設定

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

如果你將中國 API 主機用於聊天（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`），當省略 `tools.web.search.kimi.baseUrl` 時，OpenClaw 會為 Kimi `web_search` 重用同一個主機，因此來自 [platform.moonshot.cn](https://platform.moonshot.cn/) 的金鑰不會誤打到國際端點（這通常會傳回 HTTP 401）。當你需要不同的搜尋基底 URL 時，請用 `tools.web.search.kimi.baseUrl` 覆寫。

**環境替代方案：**在 Gateway 環境中設定 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。若是 gateway 安裝，請將它放在 `~/.openclaw/.env` 中。

如果你省略 `baseUrl`，OpenClaw 預設使用 `https://api.moonshot.ai/v1`。
如果你省略 `model`，OpenClaw 預設使用 `kimi-k2.6`。

## 運作方式

Kimi 使用 Moonshot 網頁搜尋合成帶有行內引用的答案，類似 Gemini 和 Grok 的 grounded response 做法。

只有在 Moonshot 傳回原生網頁搜尋 grounding 證據後，OpenClaw 才會將 Kimi `web_search` 視為成功，例如可重放的 `$web_search` 工具 payload、`search_results` 或引用 URL。如果 Kimi 立即以像「我無法瀏覽網際網路」這樣的純聊天答案停止，且沒有 grounding 證據，OpenClaw 會傳回結構化的 `kimi_web_search_ungrounded` 錯誤，而不是將該文字包裝成搜尋結果。請重試查詢、切換到 Brave 等結構化提供者，或在你已經有目標 URL 時使用 `web_fetch` / 瀏覽器工具。

## 支援的參數

Kimi 搜尋支援 `query`。

`count` 會為了共用 `web_search` 相容性而被接受，但 Kimi 仍會傳回一個附有引用的合成答案，而不是 N 筆結果清單。

目前不支援提供者專屬篩選器。

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Moonshot AI](/zh-TW/providers/moonshot) -- Moonshot 模型 + Kimi Coding 提供者文件
- [Gemini 搜尋](/zh-TW/tools/gemini-search) -- 透過 Google grounding 取得 AI 合成答案
- [Grok 搜尋](/zh-TW/tools/grok-search) -- 透過 xAI grounding 取得 AI 合成答案
