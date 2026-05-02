---
read_when:
    - web_search に MiniMax を使用したい
    - MiniMax Token Plan キーまたは OAuth トークンが必要です
    - MiniMax の CN/グローバル検索ホストに関するガイダンスが必要です
summary: Token Plan 検索 API 経由の MiniMax Search
title: MiniMax 検索
x-i18n:
    generated_at: "2026-05-02T05:07:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf721a293d6b244e69d952f433bde83417eb907ef8c0b46d04a567f1b668a32e
    source_path: tools/minimax-search.md
    workflow: 16
---

OpenClaw は、MiniMax Token Plan 検索 API を通じて MiniMax を `web_search` プロバイダーとしてサポートします。タイトル、URL、スニペット、関連クエリを含む構造化された検索結果を返します。

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

OpenClaw は env エイリアスとして `MINIMAX_CODING_API_KEY` と `MINIMAX_OAUTH_TOKEN` も受け付けます。`MINIMAX_API_KEY` は、すでに token-plan 認証情報を指している場合の互換性フォールバックとして引き続き読み取られます。

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

**環境での代替:** Gateway 環境で `MINIMAX_CODE_PLAN_KEY` または `MINIMAX_OAUTH_TOKEN` を設定します。
Gateway インストールでは、`~/.openclaw/.env` に配置します。

## リージョン選択

MiniMax Search は次のエンドポイントを使用します。

- グローバル: `https://api.minimax.io/v1/coding_plan/search`
- CN: `https://api.minimaxi.com/v1/coding_plan/search`

`plugins.entries.minimax.config.webSearch.region` が未設定の場合、OpenClaw は次の順序でリージョンを解決します。

1. `tools.web.search.minimax.region` / Plugin 所有の `webSearch.region`
2. `MINIMAX_API_HOST`
3. `models.providers.minimax.baseUrl`
4. `models.providers.minimax-portal.baseUrl`

つまり、CN オンボーディングまたは `MINIMAX_API_HOST=https://api.minimaxi.com/...` により、MiniMax Search も自動的に CN ホストに維持されます。

OAuth の `minimax-portal` パスを通じて MiniMax で認証した場合でも、Web 検索は引き続きプロバイダー ID `minimax` として登録されます。OAuth プロバイダーのベース URL は CN/グローバルのホスト選択のリージョンヒントとして使用され、`MINIMAX_OAUTH_TOKEN` は MiniMax Search の bearer 認証情報を満たすことができます。

## サポートされるパラメーター

MiniMax Search は次をサポートします。

- `query`
- `count`（OpenClaw は返された結果リストを要求された件数に切り詰めます）

プロバイダー固有のフィルターは現在サポートされていません。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [MiniMax](/ja-JP/providers/minimax) -- モデル、画像、音声、認証セットアップ
