---
read_when:
    - セルフホスト型の Web 検索プロバイダーを使いたい場合
    - web_search に SearXNG を使用したい場合
    - プライバシー重視またはエアギャップ環境向けの検索オプションが必要な場合
summary: SearXNG ウェブ検索 -- セルフホスト型、キー不要のメタ検索プロバイダー
title: SearXNG 検索
x-i18n:
    generated_at: "2026-05-02T21:08:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9be62f7398379e1672ea7e934a571a529cac07dc5d880ac74e51f8445594034
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClawは[SearXNG](https://docs.searxng.org/)を**セルフホスト型で、
キー不要**の`web_search`プロバイダーとしてサポートしています。SearXNGは、Google、Bing、DuckDuckGo、その他のソースから結果を集約するオープンソースのメタ検索エンジンです。

利点:

- **無料で無制限** -- APIキーや商用サブスクリプションは不要
- **プライバシー / エアギャップ** -- クエリがネットワークの外に出ない
- **どこでも動作** -- 商用検索APIのリージョン制限なし

## セットアップ

<Steps>
  <Step title="SearXNGインスタンスを実行する">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    または、アクセス可能な既存のSearXNGデプロイメントを使用します。本番環境のセットアップについては
    [SearXNGドキュメント](https://docs.searxng.org/)を参照してください。

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

SearXNGインスタンスのPluginレベル設定:

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

`baseUrl`フィールドはSecretRefオブジェクトも受け付けます。

トランスポートルール:

- `https://`はパブリックまたはプライベートのSearXNGホストで動作する
- `http://`は信頼済みのプライベートネットワークまたはループバックホストでのみ受け付けられる
- パブリックSearXNGホストは`https://`を使用する必要がある
- プライベート/内部ホストはセルフホスト型ネットワークガードを使用する。パブリックの`https://`
  ホストは厳格なWeb検索ガード上に残り、プライベート
  アドレスへリダイレクトできない

## 環境変数

設定の代替として`SEARXNG_BASE_URL`を設定します。

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

`SEARXNG_BASE_URL`が設定され、明示的なプロバイダーが設定されていない場合、自動検出はSearXNGを自動的に選択します（最も低い優先度 -- キーを持つAPIベースのプロバイダーがある場合は、それが先に選ばれます）。

## Plugin設定リファレンス

| フィールド   | 説明                                                               |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | SearXNGインスタンスのベースURL（必須）                             |
| `categories` | `general`、`news`、`science`などのカンマ区切りカテゴリ             |
| `language`   | `en`、`de`、`fr`など、結果の言語コード                             |

## 注意事項

- **JSON API** -- HTMLスクレイピングではなく、SearXNGネイティブの`format=json`エンドポイントを使用する
- **画像結果URL** -- SearXNGが直接画像URLを返す場合、画像カテゴリの結果には`img_src`が含まれる
- **APIキー不要** -- どのSearXNGインスタンスでもすぐに動作する
- **ベースURL検証** -- `baseUrl`は有効な`http://`または`https://`
  URLでなければならない。パブリックホストは`https://`を使用する必要がある
- **ネットワークガード** -- プライベート/内部SearXNGエンドポイントは
  プライベートネットワークアクセスを明示的に有効化する。パブリックの`https://` SearXNGエンドポイントは厳格なSSRF
  保護を維持する
- **自動検出順序** -- SearXNGは自動検出で最後（順序200）にチェックされる。設定済みキーを持つAPIベースのプロバイダーが先に実行され、その後に
  DuckDuckGo（順序100）、Ollama Web Search（順序110）が続く
- **セルフホスト型** -- インスタンス、クエリ、アップストリーム検索エンジンを自分で制御する
- **カテゴリ** は未設定時にデフォルトで`general`になる
- **カテゴリフォールバック** -- `general`以外のカテゴリリクエストが成功しても
  結果が0件だった場合、OpenClawは空の結果セットを返す前に、同じクエリを`general`で一度再試行する

<Tip>
  SearXNG JSON APIを動作させるには、SearXNGインスタンスの`settings.yml`で`search.formats`の下にある`json`
  形式が有効になっていることを確認してください。
</Tip>

## 関連情報

- [Web検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [DuckDuckGo検索](/ja-JP/tools/duckduckgo-search) -- もう1つのキー不要フォールバック
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化結果
