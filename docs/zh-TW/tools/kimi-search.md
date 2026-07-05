---
read_when:
    - 您想使用 Kimi 進行 `web_search`
    - 你需要 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`
summary: 透過 Moonshot 網頁搜尋進行 Kimi 網頁搜尋
title: Kimi 搜尋
x-i18n:
    generated_at: "2026-07-05T11:45:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42ee67c14c979298c296b20cc3f10e8c1d0f93defadc1ce2aa25ac9411aba036
    source_path: tools/kimi-search.md
    workflow: 16
---

Kimi 是由 Moonshot 原生網頁搜尋支援的 `web_search` 供應器。Moonshot
會合成一個包含行內引用的答案，類似 Gemini 和 Grok 的
有根據回應供應器，而不是回傳排序後的結果清單。

## 設定

<Steps>
  <Step title="建立金鑰">
    從 [Moonshot AI](https://platform.moonshot.cn/) 取得 API 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`（若是
    閘道安裝，請將它加入 `~/.openclaw/.env`），或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

在 `openclaw onboard` 或 `openclaw configure --section web` 期間選擇 **Kimi**
也會提示輸入：

- Moonshot API 區域：`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`
- 網頁搜尋模型（預設為 `kimi-k2.6`）

## 設定檔

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

省略時，`tools.web.search.provider` 會從可用的 API 金鑰自動偵測；
如果已設定多組搜尋憑證，請將它明確設為 `kimi`。

`tools.web.search.kimi` 底下的等效 scoped 形式（`apiKey`、`baseUrl`、`model`）
也可運作；兩種形狀都會合併到同一份解析後的設定中。

預設值：省略時 `baseUrl` 預設為 `https://api.moonshot.ai/v1`，`model`
預設為 `kimi-k2.6`。

如果聊天流量使用中國主機（`models.providers.moonshot.baseUrl`：
`https://api.moonshot.cn/v1`），當 Kimi `web_search` 未設定自己的 `baseUrl` 時，
會自動重用該主機，因此 `.cn` 金鑰不會意外打到國際端點
（該端點會對這些金鑰回傳 HTTP 401）。設定明確的 Kimi `baseUrl`
即可覆寫此繼承。

## 根據要求

OpenClaw 只會在 Moonshot 的回應包含原生網頁搜尋根據證據後，
才回傳 Kimi `web_search` 結果，例如 `$web_search` 工具呼叫重播、
`search_results`，或引用 URL。如果 Kimi 直接回答且沒有根據
（例如「我無法瀏覽網際網路」），OpenClaw 會回傳
`kimi_web_search_ungrounded` 錯誤，而不是將該文字視為搜尋結果。
請重試查詢、切換到 Brave 等結構化供應器，或在已知目標 URL 時使用
`web_fetch` / 瀏覽器工具。

## 工具參數

| 參數                                                            | 支援                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `query`                                                         | 是                                                                                                                       |
| `count`                                                         | 為了跨供應器相容性而接受，但會被忽略：Kimi 一律回傳一個合成答案，而不是 N 筆結果清單 |
| `country`, `language`, `freshness`, `date_after`, `date_before` | 否                                                                                                                       |

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) - 所有供應器與自動偵測
- [Moonshot AI](/zh-TW/providers/moonshot) - Moonshot 模型 + Kimi Coding 供應器文件
- [Gemini Search](/zh-TW/tools/gemini-search) - 透過 Google grounding 產生的 AI 合成答案
- [Grok Search](/zh-TW/tools/grok-search) - 透過 xAI grounding 產生的 AI 合成答案
