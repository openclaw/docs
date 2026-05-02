---
read_when:
    - web_search に MiniMax を使用したい場合
    - MiniMax Token Plan キーまたは OAuth トークンが必要です
    - MiniMax の CN/グローバル検索ホストに関するガイダンスが必要です
summary: Token Plan 検索 API 経由の MiniMax Search
title: MiniMax 検索
x-i18n:
    generated_at: "2026-05-02T21:08:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5bb84f38c1407c203b76eea2d7a3ab5fefbdab0844dc20899742581945d7d77e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw は MiniMax Token Plan 検索 API を通じて、MiniMax を `web_search` provider としてサポートします。タイトル、URL、スニペット、関連クエリを含む構造化された検索結果を返します。

## Token Plan 認証情報を取得する

<Steps>
  <Step title="キーを作成する">
    [MiniMax Platform](https://platform.minimax.io/user-center/basic-information/interface-key) から MiniMax Token Plan キーを作成またはコピーします。
    OAuth セットアップでは、代わりに `MINIMAX_OAUTH_TOKEN` を再利用できます。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `MINIMAX_CODE_PLAN_KEY` を設定するか、次で構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

OpenClaw は env エイリアスとして `MINIMAX_CODING_API_KEY`、`MINIMAX_OAUTH_TOKEN`、
`MINIMAX_API_KEY` も受け付けます。`MINIMAX_API_KEY` は、検索が有効な
Token Plan 認証情報を指す必要があります。通常の MiniMax モデル API キーは、
Token Plan 検索エンドポイントで受け付けられない場合があります。

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

**環境での代替:** Gateway 環境で `MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`、
`MINIMAX_OAUTH_TOKEN`、または `MINIMAX_API_KEY` を設定します。
Gateway インストールでは、`~/.openclaw/.env` に配置します。

## リージョン選択

MiniMax Search は次のエンドポイントを使用します。

- グローバル: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` が未設定の場合、OpenClaw は
次の順序でリージョンを解決します。

1. `tools.web.search.minimax.region` / Plugin が所有する `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、CN オンボーディングまたは `MINIMAX_API_HOST=https://api.minimaxi.com/...` により、
MiniMax Search も自動的に CN ホストに維持されます。

OAuth の `minimax-portal` パスを通じて MiniMax で認証した場合でも、
web search は引き続き provider id `minimax` として登録されます。OAuth provider の base URL は
CN/グローバルのホスト選択のリージョンヒントとして使われ、`MINIMAX_OAUTH_TOKEN` は
MiniMax Search の bearer 認証情報を満たすことができます。

## サポートされるパラメーター

MiniMax Search は次をサポートします。

- `query`
- `count`（OpenClaw は返された結果リストをリクエストされた件数に切り詰めます）

Provider 固有のフィルターは現在サポートされていません。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべての provider と自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、認証のセットアップ
