---
read_when:
    - 你想要使用 MiniMax 進行 web_search
    - 您需要 MiniMax Token Plan 金鑰或 OAuth 權杖
    - 您需要 MiniMax 中國版／全球版搜尋主機的設定指引
summary: 透過 Token Plan 搜尋 API 使用 MiniMax Search
title: MiniMax 搜尋
x-i18n:
    generated_at: "2026-07-11T21:51:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw 透過 MiniMax Token Plan 搜尋 API，支援將 MiniMax 作為 `web_search` 提供者。它會傳回結構化的搜尋結果，包括標題、URL、摘要片段和相關查詢。

## 取得 Token Plan 認證資訊

<Steps>
  <Step title="建立金鑰">
    從 [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    建立或複製 MiniMax Token Plan 金鑰。
    OAuth 設定則可改用 `MINIMAX_OAUTH_TOKEN`。
  </Step>
  <Step title="儲存金鑰">
    在閘道環境中設定 `MINIMAX_CODE_PLAN_KEY`，或透過以下指令設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受以 `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN` 和
`MINIMAX_API_KEY` 作為環境變數別名，並會在檢查
`MINIMAX_CODE_PLAN_KEY` 後依此順序檢查。`MINIMAX_API_KEY` 應指向已啟用搜尋功能的
Token Plan 認證資訊；Token Plan 搜尋端點可能不接受一般的 MiniMax 模型 API 金鑰。

## 設定

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // 若已設定 MiniMax Token Plan 環境變數則可省略
            region: "global", // 或 "cn"
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

**環境變數替代方案：**在閘道環境中設定 `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、
`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`。
若為閘道安裝，請將其放入 `~/.openclaw/.env`。

## 區域選擇

MiniMax Search 使用以下端點：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中國：`https://api.minimaxi.com/v1/coding_plan/search`

若未設定 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 會依下列順序解析區域：

1. `tools.web.search.minimax.region`／外掛所擁有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

這表示在中國區域完成初始設定，或設定 `MINIMAX_API_HOST=https://api.minimaxi.com/...`，
也會自動讓 MiniMax Search 繼續使用中國主機。

即使你是透過 OAuth `minimax-portal` 路徑向 MiniMax 驗證身分，
網頁搜尋仍會以提供者識別碼 `minimax` 註冊；OAuth 提供者的基礎 URL
會作為選擇中國／全球主機的區域提示，而 `MINIMAX_OAUTH_TOKEN`
可作為 MiniMax Search 的 Bearer 認證資訊。

## 支援的參數

| 參數      | 類型    | 限制條件        | 說明                                                       |
| --------- | ------- | --------------- | ---------------------------------------------------------- |
| `query`   | 字串    | 必填            | 搜尋查詢字串。                                             |
| `count`   | 整數    | 1-10，預設為 5  | 要傳回的結果數量。OpenClaw 會將傳回的清單裁減至此大小。    |

目前不支援提供者專用的篩選條件。

## 相關內容

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [MiniMax](/zh-TW/providers/minimax) -- 模型、影像、語音與驗證設定
