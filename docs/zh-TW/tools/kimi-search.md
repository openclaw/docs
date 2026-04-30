---
read_when:
    - 你想要使用 Kimi 進行 web_search
    - 需要 KIMI_API_KEY 或 MOONSHOT_API_KEY
summary: Kimi 網頁搜尋（透過 Moonshot 網頁搜尋）
title: Kimi 搜尋
x-i18n:
    generated_at: "2026-04-30T03:45:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw 支援 Kimi 作為 `web_search` 提供者，使用 Moonshot 網頁搜尋產生附有引用來源的 AI 綜合答案。

## 取得 API 金鑰

<Steps>
  <Step title="建立金鑰">
    從 [Moonshot AI](https://platform.moonshot.cn/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi** 時，OpenClaw 也可以詢問：

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

如果你將中國 API 主機用於聊天（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`），當省略 `tools.web.search.kimi.baseUrl` 時，OpenClaw 會將同一個主機重用於 Kimi `web_search`，因此來自 [platform.moonshot.cn](https://platform.moonshot.cn/) 的金鑰不會誤打到國際端點（通常會傳回 HTTP 401）。當你需要不同的搜尋基底 URL 時，請使用 `tools.web.search.kimi.baseUrl` 覆寫。

**環境替代方案：**在 Gateway 環境中設定 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。若是 Gateway 安裝，請將其放在 `~/.openclaw/.env`。

如果省略 `baseUrl`，OpenClaw 預設為 `https://api.moonshot.ai/v1`。
如果省略 `model`，OpenClaw 預設為 `kimi-k2.6`。

## 運作方式

Kimi 使用 Moonshot 網頁搜尋產生附有行內引用來源的綜合答案，類似 Gemini 與 Grok 的有依據回應方法。

## 支援的參數

Kimi 搜尋支援 `query`。

`count` 會為了共用 `web_search` 相容性而被接受，但 Kimi 仍會傳回一個附有引用來源的綜合答案，而不是 N 筆結果清單。

目前不支援提供者專屬篩選條件。

## 相關

- [網頁搜尋概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [Moonshot AI](/zh-TW/providers/moonshot) -- Moonshot 模型 + Kimi Coding 提供者文件
- [Gemini Search](/zh-TW/tools/gemini-search) -- 透過 Google 提供依據的 AI 綜合答案
- [Grok Search](/zh-TW/tools/grok-search) -- 透過 xAI 提供依據的 AI 綜合答案
