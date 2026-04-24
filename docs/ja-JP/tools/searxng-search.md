---
read_when:
    - セルフホスト型の web search プロバイダが欲しい
    - web_search にSearXNGを使いたい
    - プライバシー重視またはair-gappedな検索オプションが必要です
summary: SearXNG web search -- セルフホスト型・API key不要のメタ検索プロバイダ
title: SearXNG 検索
x-i18n:
    generated_at: "2026-04-24T05:26:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 15
---

OpenClawは、**セルフホスト型でAPI key不要**の `web_search` プロバイダとして [SearXNG](https://docs.searxng.org/) をサポートしています。SearXNGは、Google、Bing、DuckDuckGo、その他のソースから結果を集約するオープンソースのメタ検索エンジンです。

利点:

- **無料かつ無制限** -- API keyや商用サブスクリプションは不要
- **プライバシー / air-gap** -- クエリがネットワーク外へ出ない
- **どこでも動作** -- 商用検索APIのリージョン制限なし

## セットアップ

<Steps>
  <Step title="SearXNGインスタンスを実行する">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    または、アクセス可能な既存のSearXNGデプロイを使ってください。本番セットアップについては
    [SearXNG documentation](https://docs.searxng.org/) を参照してください。

  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    # providerとして "searxng" を選択
    ```

    または、env varを設定してauto-detectionに見つけさせます:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 設定

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNGインスタンス用のpluginレベル設定:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

`baseUrl` フィールドはSecretRef objectも受け付けます。

トランスポートルール:

- `https://` は公開またはprivateなSearXNG hostで使えます
- `http://` は信頼されたprivate-networkまたはloopback hostでのみ受け付けられます
- 公開SearXNG hostでは `https://` を使う必要があります

## 環境変数

configの代替として `SEARXNG_BASE_URL` を設定します:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` が設定され、明示的なproviderが未設定の場合、auto-detectionは
自動的にSearXNGを選択します（優先度は最低 -- key付きのAPIバックエンドproviderがあれば
そちらが先に選ばれます）。

## Plugin設定リファレンス

| フィールド | 説明 |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl` | SearXNGインスタンスのbase URL（必須） |
| `categories` | `general`、`news`、`science` などのカンマ区切りカテゴリ |
| `language` | `en`、`de`、`fr` などの結果用言語コード |

## 注記

- **JSON API** -- HTMLスクレイピングではなく、SearXNGネイティブの `format=json` endpointを使います
- **API key不要** -- どのSearXNGインスタンスでもそのまま動作します
- **base URL検証** -- `baseUrl` は有効な `http://` または `https://`
  URLである必要があります。公開hostでは `https://` を使う必要があります
- **auto-detection順序** -- auto-detectionではSearXNGが最後（order 200）に
  チェックされます。設定済みkeyを持つAPIバックエンドproviderが先に実行され、
  次にDuckDuckGo（order 100）、その次にOllama Web Search（order 110）です
- **セルフホスト型** -- インスタンス、クエリ、上流検索エンジンを自分で制御できます
- **Categories** は未設定時に `general` がデフォルトです

<Tip>
  SearXNG JSON APIを動作させるには、SearXNGインスタンスの `settings.yml` にある `search.formats` で `json`
  formatが有効になっていることを確認してください。
</Tip>

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダとauto-detection
- [DuckDuckGo Search](/ja-JP/tools/duckduckgo-search) -- 別のAPI key不要fallback
- [Brave Search](/ja-JP/tools/brave-search) -- 無料tier付きの構造化結果
