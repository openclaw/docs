---
read_when:
    - セルフホスト型の Web 検索プロバイダーが必要な場合
    - web_search に SearXNG を使用したい
    - プライバシー重視またはエアギャップ環境向けの検索オプションが必要です
summary: SearXNG Web 検索 -- セルフホスト型、キー不要のメタ検索プロバイダー
title: SearXNG 検索
x-i18n:
    generated_at: "2026-06-27T13:16:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw は **セルフホスト型でキー不要** の `web_search` プロバイダーとして [SearXNG](https://docs.searxng.org/) をサポートしています。SearXNG は、Google、Bing、DuckDuckGo などのソースから結果を集約するオープンソースのメタ検索エンジンです。

利点:

- **無料で無制限** -- API キーや商用サブスクリプションは不要
- **プライバシー / エアギャップ** -- クエリがネットワーク外へ出ない
- **どこでも動作** -- 商用検索 API の地域制限なし

## セットアップ

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="SearXNG インスタンスを実行する">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    または、アクセス可能な既存の SearXNG デプロイを使用します。本番環境のセットアップについては
    [SearXNG ドキュメント](https://docs.searxng.org/)を参照してください。

  </Step>
  <Step title="設定する">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    または、環境変数を設定して自動検出に見つけさせます。

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

SearXNG インスタンス用の Plugin レベル設定:

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

`baseUrl` フィールドは SecretRef オブジェクトも受け付けます。

トランスポートルール:

- `https://` は公開またはプライベートな SearXNG ホストで動作します
- `http://` は信頼済みのプライベートネットワークまたはループバックホストでのみ受け付けられます
- 公開 SearXNG ホストは `https://` を使用する必要があります
- プライベート/内部ホストはセルフホスト型ネットワークガードを使用します。公開 `https://`
  ホストは厳格な Web 検索ガードのままで、プライベート
  アドレスへリダイレクトできません

## 環境変数

設定の代替として `SEARXNG_BASE_URL` を設定します。

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL` が設定されていて明示的なプロバイダーが設定されていない場合、自動検出は
SearXNG を自動的に選択します（最も低い優先度です。キーを持つ API ベースのプロバイダーがあれば
そちらが先に優先されます）。

## Plugin 設定リファレンス

| フィールド   | 説明                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | SearXNG インスタンスのベース URL（必須）                           |
| `categories` | `general`、`news`、`science` などのカンマ区切りカテゴリ            |
| `language`   | `en`、`de`、`fr` などの結果用言語コード                            |

## 注記

- **JSON API** -- HTML スクレイピングではなく、SearXNG ネイティブの `format=json` エンドポイントを使用します
- **画像結果 URL** -- SearXNG が直接の画像 URL を返す場合、画像カテゴリの結果には `img_src` が含まれます
- **API キー不要** -- 任意の SearXNG インスタンスですぐに動作します
- **ベース URL 検証** -- `baseUrl` は有効な `http://` または `https://`
  URL である必要があります。公開ホストは `https://` を使用する必要があります
- **ネットワークガード** -- プライベート/内部 SearXNG エンドポイントは
  プライベートネットワークアクセスに明示的に参加します。公開 `https://` SearXNG エンドポイントは厳格な SSRF
  保護を維持します
- **自動検出順序** -- SearXNG は、設定済みキーを持つ API ベースのプロバイダー
  の後にチェックされます（順序 200）。DuckDuckGo や
  Ollama Web Search などのキー不要プロバイダーは、明示的にプロバイダーを選択しない限り自動選択されません
- **セルフホスト型** -- インスタンス、クエリ、上流検索エンジンを自分で制御できます
- **カテゴリ** は、未設定の場合 `general` がデフォルトです
- **カテゴリフォールバック** -- `general` 以外のカテゴリリクエストが成功しても
  結果が 0 件の場合、OpenClaw は空の結果セットを返す前に、同じクエリを `general`
  で 1 回再試行します

<Tip>
  SearXNG JSON API を動作させるには、SearXNG インスタンスの `settings.yml` の
  `search.formats` で `json` 形式が有効になっていることを確認してください。
</Tip>

## 関連

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [DuckDuckGo Search](/ja-JP/tools/duckduckgo-search) -- もう 1 つのキー不要プロバイダー
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された結果
