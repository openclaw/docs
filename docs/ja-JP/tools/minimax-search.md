---
read_when:
    - web_search に MiniMax を使用する場合
    - MiniMax Token Plan キーまたは OAuth トークンが必要です
    - MiniMax の中国版／グローバル版の検索ホストに関するガイダンスが必要な場合
summary: Token Plan 検索 API を介した MiniMax Search
title: MiniMax 検索
x-i18n:
    generated_at: "2026-07-11T22:45:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e96d1a5fe20847c5fd4476fa6aab8366910b81833c1e42e125d231c4ab003e15
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw は、MiniMax Token Plan 検索 API を介して、MiniMax を `web_search` プロバイダーとしてサポートします。タイトル、URL、スニペット、関連クエリを含む構造化された検索結果を返します。

## Token Plan 認証情報を取得する

<Steps>
  <Step title="キーを作成する">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) で MiniMax Token Plan キーを作成またはコピーします。
    OAuth を使用する構成では、代わりに `MINIMAX_OAUTH_TOKEN` を再利用できます。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `MINIMAX_CODE_PLAN_KEY` を設定するか、次のコマンドで構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw は環境変数の別名として `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、`MINIMAX_API_KEY` も受け入れ、`MINIMAX_CODE_PLAN_KEY` の後にこの順序で確認します。`MINIMAX_API_KEY` には、検索が有効な Token Plan 認証情報を指定する必要があります。通常の MiniMax モデル API キーは、Token Plan 検索エンドポイントで受け入れられない場合があります。

## 構成

```json5
{
  plugins: {
    entries: {
      minimax: {
        config: {
          webSearch: {
            apiKey: "sk-cp-...", // MiniMax Token Plan の環境変数が設定されている場合は省略可能
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

**環境変数を使用する代替方法:** Gateway 環境に `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または `MINIMAX_API_KEY` を設定します。
Gateway をインストールしている場合は、`~/.openclaw/.env` に追加します。

## リージョンの選択

MiniMax Search は次のエンドポイントを使用します。

- グローバル: `https://api.minimax.io/v1/coding_plan/search`
- 中国: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` が未設定の場合、OpenClaw は次の順序でリージョンを解決します。

1. `tools.web.search.minimax.region` / Plugin が所有する `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、中国向けのオンボーディング、または `MINIMAX_API_HOST=https://api.minimaxi.com/...` の設定により、MiniMax Search でも自動的に中国向けホストが使用されます。

OAuth の `minimax-portal` 経由で MiniMax を認証した場合でも、ウェブ検索はプロバイダー ID `minimax` として登録されます。OAuth プロバイダーのベース URL は、中国向けまたはグローバル向けホストを選択するためのリージョンの手掛かりとして使用され、`MINIMAX_OAUTH_TOKEN` は MiniMax Search の Bearer 認証情報として使用できます。

## サポートされるパラメーター

| パラメーター | 型      | 制約             | 説明                                                                     |
| ------------ | ------- | ---------------- | ------------------------------------------------------------------------ |
| `query`      | 文字列  | 必須             | 検索クエリ文字列。                                                       |
| `count`      | 整数    | 1～10、既定値 5  | 返す結果の数。OpenClaw は返されたリストをこの件数に切り詰めます。        |

現在、プロバイダー固有のフィルターはサポートされていません。

## 関連項目

- [ウェブ検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、認証の設定
