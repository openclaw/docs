---
read_when:
    - セルフホスト型のウェブ検索プロバイダーが必要な場合
    - web_search に SearXNG を使用する場合
    - プライバシー重視またはエアギャップ環境向けの検索オプションが必要な場合
summary: SearXNG Web 検索 -- セルフホスト型でキー不要のメタ検索プロバイダー
title: SearXNG 検索
x-i18n:
    generated_at: "2026-07-11T22:48:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw は [SearXNG](https://docs.searxng.org/) を、**セルフホスト型で、
キー不要**の `web_search` プロバイダーとしてサポートしています。SearXNG は、Google、Bing、DuckDuckGo などのソースから結果を集約する、オープンソースのメタ検索エンジンです。

利点:

- **無料かつ無制限** -- API キーや有料サブスクリプションは不要
- **プライバシー / エアギャップ** -- クエリがネットワーク外に送信されない
- **どこでも利用可能** -- 商用検索 API の地域制限なし

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

    または、アクセス可能な既存の SearXNG デプロイメントを使用します。本番環境のセットアップについては、
    [SearXNG ドキュメント](https://docs.searxng.org/)を参照してください。

  </Step>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # プロバイダーとして "searxng" を選択
    ```

    または、環境変数を設定して自動検出に任せます。

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

SearXNG インスタンスに対する Plugin レベルの設定:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // 任意
            language: "en", // 任意
          },
        },
      },
    },
  },
}
```

`baseUrl` には SecretRef オブジェクトも指定できます（例: `{ source: "env", id: "SEARXNG_BASE_URL" }`）。

## 環境変数

設定の代わりに `SEARXNG_BASE_URL` を設定します。

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

解決順序は、設定された `baseUrl` 文字列、`baseUrl` に直接指定された環境変数の SecretRef、`SEARXNG_BASE_URL` の順です。いずれの設定パスも設定されておらず、明示的にプロバイダーが選択されていない状態で `SEARXNG_BASE_URL` が存在する場合、自動検出によって SearXNG が選択されます。

## Plugin 設定リファレンス

| フィールド   | 説明                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | SearXNG インスタンスのベース URL（必須）                            |
| `categories` | `general`、`news`、`science` などのカンマ区切りのカテゴリー         |
| `language`   | `en`、`de`、`fr` など、結果に使用する言語コード                     |

`web_search` ツール呼び出しでは、呼び出しごとの上書きとして `count`（1～10 件の結果）、`categories`、`language` も指定できます。

## 注意事項

- **JSON API** -- HTML スクレイピングではなく、SearXNG のネイティブな `format=json` エンドポイントを使用
- **画像結果の URL** -- SearXNG が画像の直接 URL を返す場合、画像カテゴリーの結果に `img_src` が含まれる
- **API キー不要** -- どの SearXNG インスタンスでもそのまま動作
- **ベース URL の検証** -- `baseUrl` は有効な `http://` または `https://` URL である必要がある
- **ネットワーク保護** -- `http://` のベース URL は、信頼されたプライベートホストまたはループバックホストを指定する必要がある（公開ホストでは `https://` が必須）。プライベートアドレスまたは内部アドレスに解決される `https://` のベース URL には、同様にセルフホスト向けの許可が適用される。一方、公開アドレスに解決される `https://` のベース URL には、厳格な SSRF 保護が維持される
- **自動検出の順序** -- SearXNG には `baseUrl` の設定が必要（必要な認証情報をすでに持つプロバイダーの中で順序は 200）。DuckDuckGo や Ollama Web Search などのキー不要プロバイダーが暗黙的に自動検出で選択されることはなく、明示的に `provider` を選択した場合にのみ有効になる
- **セルフホスト型** -- インスタンス、クエリ、上流の検索エンジンを自身で管理
- **カテゴリー**は、設定されていない場合はデフォルトで `general`
- **カテゴリーのフォールバック** -- `general` 以外のカテゴリーへのリクエストが成功しても結果が 0 件の場合、空の結果セットを返す前に、OpenClaw は同じクエリを `general` で一度再試行する
- **結果のキャッシュ** -- 同一のクエリ（クエリ、件数、カテゴリー、言語、ベース URL が同じもの）は、短い TTL の間プロセス内にキャッシュされる
- **バージョン要件** -- Plugin は `minHostVersion: >=2026.6.9` を宣言

<Tip>
  SearXNG JSON API を機能させるには、SearXNG インスタンスの `settings.yml` にある `search.formats` で `json` 形式が有効になっていることを確認してください。
</Tip>

## 関連項目

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [DuckDuckGo 検索](/ja-JP/tools/duckduckgo-search) -- 別のキー不要プロバイダー
- [Brave 検索](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された結果
