---
read_when:
    - web_search に MiniMax を使いたい場合
    - MiniMax Coding Plan キーが必要な場合
    - MiniMax の CN / Global 検索ホストのガイダンスが欲しい場合
summary: Coding Plan 検索 API 経由の MiniMax Search
title: MiniMax 検索
x-i18n:
    generated_at: "2026-04-24T05:25:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20a91bfae72661efd5e0bc3b6247ab05c3487db40ecd9cd5a874858bf3c69df3
    source_path: tools/minimax-search.md
    workflow: 15
---

OpenClaw は、MiniMax
Coding Plan 検索 API を通じて、`web_search` provider として MiniMax をサポートしています。タイトル、URL、
スニペット、関連クエリを含む構造化検索結果を返します。

## Coding Plan キーを取得する

<Steps>
  <Step title="キーを作成する">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) で
    MiniMax Coding Plan キーを作成またはコピーします。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `MINIMAX_CODE_PLAN_KEY` を設定するか、次で設定します:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw は env エイリアスとして `MINIMAX_CODING_API_KEY` も受け付けます。`MINIMAX_API_KEY`
も、すでに coding-plan token を指している場合は互換 fallback として引き続き読み取られます。

## Config

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // MINIMAX_CODE_PLAN_KEY が設定されていれば任意
            region: "global", // または "cn"
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

**環境変数の代替:** Gateway 環境で `MINIMAX_CODE_PLAN_KEY` を設定してください。
gateway インストールでは、これを `~/.openclaw/.env` に置いてください。

## リージョン選択

MiniMax Search は次のエンドポイントを使います。

- Global: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` が未設定の場合、OpenClaw は
次の順序で region を解決します。

1. `tools.web.search.minimax.region` / Plugin 所有の `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、CN オンボーディングや `MINIMAX_API_HOST=https://api.minimaxi.com/...`
は、MiniMax Search も自動的に CN host 上に維持します。

OAuth の `minimax-portal` パス経由で MiniMax を認証した場合でも、
web search は引き続き provider id `minimax` として登録されます。OAuth provider base URL
は、CN / Global host 選択のための region ヒントとしてのみ使われます。

## サポートされるパラメーター

MiniMax Search がサポートするもの:

- `query`
- `count`（OpenClaw は返された結果リストを要求された count に切り詰めます）

provider 固有のフィルターは現在サポートされていません。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、および auth セットアップ
