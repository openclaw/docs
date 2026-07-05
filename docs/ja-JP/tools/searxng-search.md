---
read_when:
    - 自己ホスト型の Web 検索プロバイダーが必要な場合
    - web_search に SearXNG を使用する
    - プライバシー重視またはエアギャップ環境向けの検索オプションが必要です
summary: SearXNG web search -- セルフホスト型、キー不要のメタ検索プロバイダー
title: SearXNG 検索
x-i18n:
    generated_at: "2026-07-05T11:55:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw は、**セルフホスト型でキー不要**の `web_search` プロバイダーとして [SearXNG](https://docs.searxng.org/) をサポートしています。SearXNG は、Google、Bing、DuckDuckGo、その他のソースから結果を集約するオープンソースのメタ検索エンジンです。

利点:

- **無料で無制限** -- API キーや商用サブスクリプションは不要
- **プライバシー / エアギャップ** -- クエリがネットワークの外に出ない
- **どこでも動作** -- 商用検索 API の地域制限なし

## セットアップ

<Steps>
  <Step title="Plugin をインストール">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="SearXNG インスタンスを実行">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    または、アクセスできる既存の SearXNG デプロイを使用します。本番環境のセットアップについては
    [SearXNG ドキュメント](https://docs.searxng.org/)を参照してください。

  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    または、環境変数を設定して自動検出に見つけさせます:

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

SearXNG インスタンスの Plugin レベル設定:

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

`baseUrl` は SecretRef オブジェクトも受け付けます（例: `{ source: "env", id: "SEARXNG_BASE_URL" }`）。

## 環境変数

設定の代替として `SEARXNG_BASE_URL` を設定します:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

解決順序: 設定された `baseUrl` 文字列、次に `baseUrl` 上のインライン env SecretRef、その次に `SEARXNG_BASE_URL`。設定パスがどれも設定されておらず、明示的なプロバイダーが選択されていない状態で `SEARXNG_BASE_URL` が存在する場合、自動検出は SearXNG を選択します。

## Plugin 設定リファレンス

| フィールド   | 説明                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | SearXNG インスタンスのベース URL（必須）                           |
| `categories` | `general`、`news`、`science` などのカンマ区切りカテゴリ            |
| `language`   | `en`、`de`、`fr` など、結果の言語コード                            |

`web_search` ツール呼び出しでは、呼び出しごとの上書きとして `count`（1-10 件の結果）、`categories`、`language` も受け付けます。

## メモ

- **JSON API** -- HTML スクレイピングではなく、SearXNG ネイティブの `format=json` エンドポイントを使用
- **画像結果 URL** -- 画像カテゴリの結果には、SearXNG が直接画像 URL を返す場合に `img_src` が含まれる
- **API キーなし** -- どの SearXNG インスタンスでもそのまま動作
- **ベース URL 検証** -- `baseUrl` は有効な `http://` または `https://` URL である必要がある
- **ネットワークガード** -- `http://` ベース URL は信頼済みのプライベートホストまたはループバックホストを対象にする必要がある（公開ホストでは `https://` を使用する必要がある）。プライベート/内部アドレスに解決される `https://` ベース URL には同じセルフホスト許可が適用され、公開アドレスに解決される `https://` ベース URL では厳格な SSRF 保護が維持される
- **自動検出の順序** -- SearXNG には設定済みの `baseUrl` が必要（必須認証情報をすでに持つプロバイダーの中で順序は 200）。DuckDuckGo や Ollama Web Search などのキー不要プロバイダーが暗黙的に自動検出で選ばれることはなく、明示的な `provider` 選択でのみ有効になる
- **セルフホスト型** -- インスタンス、クエリ、アップストリーム検索エンジンを自分で制御できる
- **カテゴリ** は、設定されていない場合 `general` がデフォルト
- **カテゴリフォールバック** -- `general` 以外のカテゴリリクエストが成功しても結果が 0 件の場合、OpenClaw は空の結果セットを返す前に、同じクエリを `general` で一度再試行する
- **結果キャッシュ** -- 同一のクエリ（同じクエリ、件数、カテゴリ、言語、ベース URL）は、短い TTL の間プロセス内にキャッシュされる
- **バージョン要件** -- Plugin は `minHostVersion: >=2026.6.9` を宣言している

<Tip>
  SearXNG JSON API を動作させるには、SearXNG インスタンスの `settings.yml` の `search.formats` で `json` 形式が有効になっていることを確認してください。
</Tip>

## 関連

- [Web Search 概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [DuckDuckGo Search](/ja-JP/tools/duckduckgo-search) -- もう一つのキー不要プロバイダー
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された結果
