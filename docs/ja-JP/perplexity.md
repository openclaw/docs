---
read_when:
    - Web検索にPerplexity Searchを使いたい場合
    - '`PERPLEXITY_API_KEY`または`OPENROUTER_API_KEY`の設定が必要な場合'
summary: '`web_search`向けのPerplexity Search APIおよびSonar/OpenRouter互換性'
title: Perplexity検索（レガシーパス）
x-i18n:
    generated_at: "2026-04-24T05:06:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 87a7b6e14f636cfe6b7c5833af1b0aecb334a39babbb779c32f29bbbb5c9e14a
    source_path: perplexity.md
    workflow: 15
---

# Perplexity Search API

OpenClawは、`web_search`プロバイダーとしてPerplexity Search APIをサポートしています。
これは`title`、`url`、`snippet`フィールドを持つ構造化結果を返します。

互換性のため、OpenClawはレガシーなPerplexity Sonar/OpenRouter構成もサポートしています。
`OPENROUTER_API_KEY`を使う場合、`plugins.entries.perplexity.config.webSearch.apiKey`に`sk-or-...`キーを入れる場合、または`plugins.entries.perplexity.config.webSearch.baseUrl` / `model`を設定する場合、プロバイダーはchat-completionsパスへ切り替わり、構造化されたSearch API結果ではなく、引用付きのAI合成回答を返します。

## Perplexity API keyの取得

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)でPerplexityアカウントを作成します
2. ダッシュボードでAPI keyを生成します
3. keyを設定に保存するか、Gateway環境で`PERPLEXITY_API_KEY`を設定します。

## OpenRouter互換性

Perplexity Sonar用にすでにOpenRouterを使っている場合は、`provider: "perplexity"`を維持したまま、Gateway環境で`OPENROUTER_API_KEY`を設定するか、`plugins.entries.perplexity.config.webSearch.apiKey`に`sk-or-...`キーを保存してください。

任意の互換性制御:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 設定例

### ネイティブPerplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar互換性

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## keyの設定場所

**設定経由:** `openclaw configure --section web`を実行します。keyは
`~/.openclaw/openclaw.json`の`plugins.entries.perplexity.config.webSearch.apiKey`
に保存されます。このフィールドはSecretRefオブジェクトも受け付けます。

**環境変数経由:** Gatewayプロセス環境で`PERPLEXITY_API_KEY`または`OPENROUTER_API_KEY`
を設定します。gatewayインストールでは、
`~/.openclaw/.env`（またはサービス環境）に置いてください。[Env vars](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

`provider: "perplexity"`が設定されており、Perplexity keyのSecretRefが未解決で、かつenvフォールバックもない場合、起動/リロードは即座に失敗します。

## ツールパラメーター

これらのパラメーターは、ネイティブPerplexity Search APIパスに適用されます。

| パラメーター | 説明 |
| --------------------- | ---------------------------------------------------- |
| `query`               | 検索クエリ（必須） |
| `count`               | 返す結果数（1-10、デフォルト: 5） |
| `country`             | 2文字のISO国コード（例: `"US"`、`"DE"`） |
| `language`            | ISO 639-1言語コード（例: `"en"`、`"de"`、`"fr"`） |
| `freshness`           | 時間フィルター: `day`（24時間）、`week`、`month`、または`year` |
| `date_after`          | この日付以降に公開された結果のみ（YYYY-MM-DD） |
| `date_before`         | この日付以前に公開された結果のみ（YYYY-MM-DD） |
| `domain_filter`       | ドメインallowlist/denylist配列（最大20） |
| `max_tokens`          | 総コンテンツ予算（デフォルト: 25000、最大: 1000000） |
| `max_tokens_per_page` | ページごとのトークン上限（デフォルト: 2048） |

レガシーSonar/OpenRouter互換パスでは:

- `query`、`count`、`freshness`が受け付けられます
- `count`はそのパスでは互換性専用であり、レスポンスは依然としてN件の結果一覧ではなく、引用付きの1つの合成回答です
- `country`、`language`、`date_after`、
  `date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`
  のようなSearch API専用フィルターは明示的エラーを返します

**例:**

```javascript
// 国と言語を指定した検索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近の結果（過去1週間）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日付範囲検索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// ドメインフィルタリング（allowlist）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// ドメインフィルタリング（denylist - 接頭辞に - を付ける）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// より多くのコンテンツ抽出
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### ドメインフィルタールール

- フィルターごとに最大20ドメイン
- 1つのリクエストでallowlistとdenylistを混在させることはできません
- denylistエントリには`-`接頭辞を使用します（例: `["-reddit.com"]`）

## 注意

- Perplexity Search APIは構造化されたWeb検索結果（`title`、`url`、`snippet`）を返します
- OpenRouterまたは明示的な`plugins.entries.perplexity.config.webSearch.baseUrl` / `model`は、互換性のためにPerplexityをSonar chat completionsへ戻します
- Sonar/OpenRouter互換性は、構造化された結果行ではなく、引用付きの1つの合成回答を返します
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes`で設定可能）

`web_search`の完全な設定については[Web tools](/ja-JP/tools/web)を参照してください。
詳細は[Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart)を参照してください。

## 関連

- [Perplexity search](/ja-JP/tools/perplexity-search)
- [Web search](/ja-JP/tools/web)
