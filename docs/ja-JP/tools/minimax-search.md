---
read_when:
    - web_searchにMiniMaxを使用したい
    - MiniMax Token Plan キーまたは OAuth トークンが必要です
    - MiniMax の CN/グローバル検索ホストに関するガイダンスが必要な場合
summary: Token Plan 検索 API 経由の MiniMax 検索
title: MiniMax 検索
x-i18n:
    generated_at: "2026-05-11T20:39:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0a2dfe4261ab4bc5d234cedf9dff41fbbfbbad8914c6c9c43bc76e8694d99d4
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClawは、MiniMax Token Plan検索APIを通じてMiniMaxを`web_search`プロバイダーとしてサポートしています。タイトル、URL、スニペット、関連クエリを含む構造化された検索結果を返します。

## Token Plan認証情報を取得する

<Steps>
  <Step title="Create a key">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key)からMiniMax Token Planキーを作成またはコピーします。
    OAuth設定では、代わりに`MINIMAX_OAUTH_TOKEN`を再利用できます。
  </Step>
  <Step title="Store the key">
    Gateway環境で`MINIMAX_CODE_PLAN_KEY`を設定するか、次の方法で構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClawは、環境変数のエイリアスとして`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、`MINIMAX_API_KEY`も受け付けます。`MINIMAX_API_KEY`は、検索が有効なToken Plan認証情報を指す必要があります。通常のMiniMaxモデルAPIキーは、Token Plan検索エンドポイントで受け付けられない場合があります。

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

**環境変数の代替:** Gateway環境で`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、または`MINIMAX_API_KEY`を設定します。
Gatewayをインストールしている場合は、`~/.openclaw/.env`に入れます。

## リージョンの選択

MiniMax Searchは次のエンドポイントを使用します。

- グローバル: `https://api.minimax.io/v1/coding_plan/search`
- 中国: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region`が未設定の場合、OpenClawは次の順序でリージョンを解決します。

1. `tools.web.search.minimax.region` / plugin所有の`webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、中国向けオンボーディングや`MINIMAX_API_HOST=https://api.minimaxi.com/...`により、MiniMax Searchも自動的に中国ホストに維持されます。

OAuthの`minimax-portal`パスを通じてMiniMaxを認証した場合でも、Web検索は引き続きプロバイダーID`minimax`として登録されます。OAuthプロバイダーのベースURLは中国/グローバルホスト選択のリージョンヒントとして使用され、`MINIMAX_OAUTH_TOKEN`はMiniMax SearchのBearer認証情報を満たすことができます。

## サポートされるパラメーター

| パラメーター | 型    | 制約 | 説明                                                                 |
| --------- | ------- | ----------- | --------------------------------------------------------------------------- |
| `query`   | string  | 必須    | 検索クエリ文字列。                                                        |
| `count`   | integer | 1-10        | 返す結果数。OpenClawは返されたリストをこのサイズに切り詰めます。 |

プロバイダー固有のフィルターは現在サポートされていません。

## 関連

- [Web Searchの概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、認証設定
