---
read_when:
    - 你想使用 Kimi 進行 web_search
    - 你需要 KIMI_API_KEY 或 MOONSHOT_API_KEY
summary: 透過 Moonshot 網頁搜尋使用 Kimi 網頁搜尋
title: Kimi 搜尋
x-i18n:
    generated_at: "2026-07-20T00:55:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 65e5f8c9f3b607dbcc3256c51a6a083864e31f65ed2a751d2d500abeb35ba844
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi 是由 Moonshot 原生網頁搜尋支援的 `web_search` 供應商。Moonshot
會整合產生一個含有行內引用的答案，類似 Gemini 和 Grok 的
有依據回應供應商，而非傳回排序後的結果清單。

## 設定

<Steps>
  <Step title="建立金鑰">
    從 [Moonshot AI](https://platform.moonshot.cn/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`（若為
    閘道安裝，請將其新增至 `~/.openclaw/.env`），或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi**
也會提示輸入：

- Moonshot API 區域：`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`
- 網頁搜尋模型（預設為 `kimi-k2.6`）

## 設定

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 若已設定 KIMI_API_KEY 或 MOONSHOT_API_KEY，則為選填
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

省略 `tools.web.search.provider` 時，會根據可用的 API 金鑰自動偵測；
若設定了多組搜尋認證資訊，請明確將其設為 `kimi`。

請在 `plugins.entries.moonshot.config.webSearch` 下設定 Kimi 專用的 `apiKey`、`baseUrl` 和 `model` 值。

預設值：省略 `baseUrl` 時，其預設為 `https://api.moonshot.ai/v1`；`model`
預設為 `kimi-k2.6`。

如果聊天流量使用中國主機（`models.providers.moonshot.baseUrl`：
`https://api.moonshot.cn/v1`），且 Kimi 自己的 `baseUrl` 未設定，
Kimi `web_search` 會自動重複使用該主機，避免 `.cn` 金鑰意外傳送至
國際端點（該端點會對這些金鑰傳回 HTTP 401）。若要覆寫此繼承行為，請明確設定
Kimi `baseUrl`。

## 依據要求

只有在 Moonshot 的回應包含原生網頁搜尋依據證據後，OpenClaw 才會傳回 Kimi
`web_search` 結果，例如 `$web_search` 工具呼叫重播、
`search_results` 或引用 URL。如果 Kimi 在沒有依據的情況下直接回答
（例如「我無法瀏覽網際網路」），OpenClaw 會傳回
`kimi_web_search_ungrounded` 錯誤，而不會將該文字視為搜尋
結果。請重試查詢、切換至 Brave 等結構化供應商，或在已有目標 URL 時使用
`web_fetch`／瀏覽器工具。

## 工具參數

| 參數                                                       | 支援情況                                                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | 是                                                                                                                      |
| `count`                                                         | 為了跨供應商相容性而接受，但會忽略：Kimi 一律傳回一個整合產生的答案，而非 N 筆結果的清單 |
| `country`、`language`、`freshness`、`date_after`、`date_before` | 否                                                                                                                       |

## 相關內容

- [網頁搜尋總覽](/zh-TW/tools/web) - 所有供應商與自動偵測
- [Moonshot AI](/zh-TW/providers/moonshot) - Moonshot 模型與 Kimi Coding 供應商文件
- [Gemini 搜尋](/zh-TW/tools/gemini-search) - 透過 Google 依據產生的 AI 整合答案
- [Grok 搜尋](/zh-TW/tools/grok-search) - 透過 xAI 依據產生的 AI 整合答案
