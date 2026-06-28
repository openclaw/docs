---
read_when:
    - 你想使用 MiniMax 進行 web_search
    - 你需要 MiniMax Token Plan 金鑰或 OAuth 權杖
    - 你想要 MiniMax 中國/全球搜尋主機指引
summary: 透過 Token Plan 搜尋 API 使用 MiniMax Search
title: MiniMax 搜尋
x-i18n:
    generated_at: "2026-05-11T20:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw 透過 MiniMax Token Plan 搜尋 API，支援 MiniMax 作為 `web_search` 提供者。它會回傳結構化搜尋結果，包含標題、URL、摘要片段與相關查詢。

## 取得 Token Plan 憑證

<Steps>
  <Step title="建立金鑰">
    從
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    建立或複製 MiniMax Token Plan 金鑰。
    OAuth 設定可以改為重用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `MINIMAX_CODE_PLAN_KEY`，或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 和
`MINIMAX_API_KEY` 作為環境別名。`MINIMAX_API_KEY` 應指向已啟用搜尋的
Token Plan 憑證；一般 MiniMax 模型 API 金鑰可能不會被 Token Plan 搜尋端點接受。

## 設定

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if a MiniMax Token Plan env var is set
            region: "global", // or "cn"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "minimax",
      },
    },
  },
}
```

**環境替代方案：**在 Gateway 環境中設定 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、
`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`。
若是 gateway 安裝，請將其放在 `~/.openclaw/.env`。

## 區域選擇

MiniMax Search 使用以下端點：

- Global：`https://api.minimax.io/v1/coding_plan/search`
- CN：`https://api.minimaxi.com/v1/coding_plan/search`

如果未設定 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 會依照以下順序解析區域：

1. `tools.web.search.minimax.region` / Plugin 擁有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

這表示 CN onboarding 或 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
也會自動讓 MiniMax Search 保持使用 CN 主機。

即使你是透過 OAuth `minimax-portal` 路徑驗證 MiniMax，網頁搜尋仍會註冊為提供者 ID `minimax`；OAuth 提供者基底 URL
會作為 CN/global 主機選擇的區域提示，而 `MINIMAX_OAUTH_TOKEN`
可滿足 MiniMax Search 的 bearer 憑證需求。

## 支援的參數

| 參數 | 類型    | 約束 | 說明                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | required    | 搜尋查詢字串。                                                        |
| `count`   | integer | 1-10        | 要回傳的結果數量。OpenClaw 會將回傳清單修剪為此大小。 |

目前不支援提供者專屬篩選器。

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [MiniMax](/zh-TW/providers/minimax) -- 模型、影像、語音與驗證設定
