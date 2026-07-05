---
read_when:
    - MiniMax を web_search に使用したい場合
    - MiniMax Token Plan キーまたは OAuth トークンが必要です
    - MiniMax の CN/グローバル検索ホストに関するガイダンスが必要です
summary: トークンプラン検索 API 経由の MiniMax Search
title: MiniMax 検索
x-i18n:
    generated_at: "2026-07-05T11:55:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw は MiniMax Token Plan 検索 API を通じて、MiniMax を `web_search` provider としてサポートします。タイトル、URL、スニペット、関連クエリを含む構造化された検索結果を返します。

## Token Plan 認証情報を取得する

<Steps>
  <Step title="Create a key">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) から MiniMax Token Plan キーを作成またはコピーします。
    OAuth セットアップでは、代わりに `MINIMAX_OAUTH_TOKEN` を再利用できます。
  </Step>
  <Step title="Store the key">
    Gateway 環境で `MINIMAX_CODE_PLAN_KEY` を設定するか、次で構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw は env エイリアスとして `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、`MINIMAX_API_KEY` も受け入れ、この順序で `MINIMAX_CODE_PLAN_KEY` の後に確認します。`MINIMAX_API_KEY` は、検索が有効な Token Plan 認証情報を指す必要があります。通常の MiniMax モデル API キーは、Token Plan 検索エンドポイントで受け入れられない場合があります。

## 構成

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

**環境での代替:** Gateway 環境で `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または `MINIMAX_API_KEY` を設定します。
gateway インストールでは、`~/.openclaw/.env` に入れます。

## リージョン選択

MiniMax Search は次のエンドポイントを使用します。

- グローバル: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` が未設定の場合、OpenClaw は次の順序でリージョンを解決します。

1. `tools.web.search.minimax.region` / plugin 所有の `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、CN オンボーディングまたは `MINIMAX_API_HOST=https://api.minimaxi.com/...` により、MiniMax Search も自動的に CN ホストを使い続けます。

OAuth の `minimax-portal` パスを通じて MiniMax を認証した場合でも、web search は provider id `minimax` として登録されます。OAuth provider のベース URL は CN/global ホスト選択のリージョンヒントとして使用され、`MINIMAX_OAUTH_TOKEN` で MiniMax Search の bearer 認証情報を満たすことができます。

## サポートされるパラメーター

| パラメーター | 型      | 制約            | 説明                                                                        |
| --------- | ------- | --------------- | --------------------------------------------------------------------------- |
| `query`   | string  | 必須            | 検索クエリ文字列。                                                          |
| `count`   | integer | 1-10、デフォルト 5 | 返す結果数。OpenClaw は返されたリストをこのサイズに切り詰めます。 |

provider 固有のフィルターは現在サポートされていません。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべての provider と自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、認証セットアップ
