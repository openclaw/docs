---
read_when:
    - 你想使用 MiniMax 進行 web_search
    - 你需要 MiniMax Token Plan 金鑰或 OAuth 權杖
    - 你需要 MiniMax 中國／全球搜尋主機指引
summary: 透過 Token Plan 搜尋 API 使用 MiniMax Search
title: MiniMax 搜尋
x-i18n:
    generated_at: "2026-05-02T21:05:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw 透過 MiniMax Token Plan 搜尋 API，支援將 MiniMax 作為 `web_search` 提供者。它會回傳包含標題、URL、摘要與相關查詢的結構化搜尋結果。

## 取得 Token Plan 憑證

<Steps>
  <Step title="Create a key">
    從
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    建立或複製 MiniMax Token Plan 金鑰。
    OAuth 設定也可以改為重用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="Store the key">
    在 Gateway 環境中設定 `MINIMAX_CODE_PLAN_KEY`，或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 和
`MINIMAX_API_KEY` 作為環境變數別名。`MINIMAX_API_KEY` 應指向啟用搜尋的
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

**環境替代方案：** 在 Gateway 環境中設定 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、
`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`。
若是 gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 區域選擇

MiniMax Search 使用這些端點：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中國：`https://api.minimaxi.com/v1/coding_plan/search`

如果未設定 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 會依下列順序解析區域：

1. `tools.web.search.minimax.region` / Plugin 所擁有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

這表示中國區上線流程或 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
也會自動讓 MiniMax Search 保持使用中國區主機。

即使你是透過 OAuth `minimax-portal` 路徑驗證 MiniMax，
網頁搜尋仍會以提供者 ID `minimax` 註冊；OAuth 提供者基底 URL
會作為中國區/全球主機選擇的區域提示，而 `MINIMAX_OAUTH_TOKEN`
可滿足 MiniMax Search 的 bearer 憑證需求。

## 支援的參數

MiniMax Search 支援：

- `query`
- `count`（OpenClaw 會將回傳的結果清單裁切為要求的數量）

目前不支援提供者專屬篩選器。

## 相關

- [Web Search 概觀](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [MiniMax](/zh-TW/providers/minimax) -- 模型、影像、語音與驗證設定
