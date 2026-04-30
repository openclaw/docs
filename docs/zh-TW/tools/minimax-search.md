---
read_when:
    - 你想要使用 MiniMax 進行 web_search
    - 你需要一把 MiniMax Coding Plan 金鑰
    - 你想要 MiniMax CN/全球搜尋主機指引
summary: 透過 Coding Plan 搜尋 API 使用 MiniMax 搜尋
title: MiniMax 搜尋
x-i18n:
    generated_at: "2026-04-30T03:46:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw 透過 MiniMax Coding Plan 搜尋 API 支援 MiniMax 作為 `web_search` 提供者。它會傳回包含標題、URL、摘要和相關查詢的結構化搜尋結果。

## 取得 Coding Plan 金鑰

<Steps>
  <Step title="建立金鑰">
    從
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)
    建立或複製 MiniMax Coding Plan 金鑰。
  </Step>
  <Step title="儲存金鑰">
    在 Gateway 環境中設定 `MINIMAX_CODE_PLAN_KEY`，或透過以下方式設定：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw 也接受 `MINIMAX_CODING_API_KEY` 作為環境變數別名。當 `MINIMAX_API_KEY`
已指向 coding-plan 權杖時，仍會作為相容性後援讀取。

## 設定

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // optional if MINIMAX_CODE_PLAN_KEY is set
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

**環境替代方案：**在 Gateway 環境中設定 `MINIMAX_CODE_PLAN_KEY`。
若是 Gateway 安裝，請將它放在 `~/.openclaw/.env`。

## 區域選擇

MiniMax Search 使用這些端點：

- 全球：`https://api.minimax.io/v1/coding_plan/search`
- 中國：`https://api.minimaxi.com/v1/coding_plan/search`

如果未設定 `plugins.entries.minimax.config.webSearch.region`，OpenClaw 會依照以下順序解析區域：

1. `tools.web.search.minimax.region` / Plugin 擁有的 `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

這表示中國區上線設定或 `MINIMAX_API_HOST=https://api.minimaxi.com/...`
也會自動讓 MiniMax Search 使用中國區主機。

即使你是透過 OAuth `minimax-portal` 路徑驗證 MiniMax，
網頁搜尋仍會註冊為提供者 ID `minimax`；OAuth 提供者基底 URL
只會作為中國區/全球主機選擇的區域提示使用。

## 支援的參數

MiniMax Search 支援：

- `query`
- `count`（OpenClaw 會將傳回的結果清單裁剪為要求的數量）

目前不支援提供者特定的篩選器。

## 相關

- [網頁搜尋概覽](/zh-TW/tools/web) -- 所有提供者與自動偵測
- [MiniMax](/zh-TW/providers/minimax) -- 模型、圖片、語音和驗證設定
