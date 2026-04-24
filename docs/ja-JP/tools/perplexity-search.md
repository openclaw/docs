---
read_when:
    - web search に Perplexity Search を使いたい場合
    - '`PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` の設定が必要です'
summary: web_search 向けの Perplexity Search API と Sonar/OpenRouter 互換性
title: Perplexity search
x-i18n:
    generated_at: "2026-04-24T05:26:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f85aa953ff406237013fdc9a06b86756a26e62d41e5a3e3aa732563960e4ba9
    source_path: tools/perplexity-search.md
    workflow: 15
---

# Perplexity Search API

OpenClaw は、`web_search` プロバイダーとして Perplexity Search API をサポートしています。
これは `title`, `url`, `snippet` フィールドを持つ構造化結果を返します。

互換性のために、OpenClaw はレガシーな Perplexity Sonar/OpenRouter セットアップもサポートしています。
`OPENROUTER_API_KEY` を使う場合、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを使う場合、または `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` を設定した場合、プロバイダーは chat-completions 経路に切り替わり、構造化 Search API 結果の代わりに引用付きの AI 合成回答を返します。

## Perplexity API キーを取得する

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) で Perplexity アカウントを作成します
2. ダッシュボードで API キーを生成します
3. キーを config に保存するか、Gateway 環境で `PERPLEXITY_API_KEY` を設定します。

## OpenRouter 互換性

すでに OpenRouter を Perplexity Sonar 用に使っている場合は、`provider: "perplexity"` のままにして、Gateway 環境で `OPENROUTER_API_KEY` を設定するか、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを保存してください。

任意の互換性制御:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## config 例

### ネイティブ Perplexity Search API

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

### OpenRouter / Sonar 互換性

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

## キーの設定場所

**config 経由:** `openclaw configure --section web` を実行します。キーは
`~/.openclaw/openclaw.json` の `plugins.entries.perplexity.config.webSearch.apiKey` に保存されます。
このフィールドは SecretRef object も受け付けます。

**環境変数経由:** Gateway プロセス環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY`
を設定します。gateway install では、
`~/.openclaw/.env`（またはサービス環境）に置いてください。詳細は [Env vars](/ja-JP/help/faq#env-vars-and-env-loading) を参照してください。

`provider: "perplexity"` が設定されており、Perplexity キー SecretRef が未解決で env fallback もない場合、起動/再読み込みは fail fast します。

## ツールパラメーター

これらのパラメーターは、ネイティブ Perplexity Search API 経路に適用されます。

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果数（1〜10）。
</ParamField>

<ParamField path="country" type="string">
2 文字の ISO 国コード（例: `US`, `DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 言語コード（例: `en`, `de`, `fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター — `day` は 24 時間です。
</ParamField>

<ParamField path="date_after" type="string">
この日付（`YYYY-MM-DD`）以降に公開された結果のみ。
</ParamField>

<ParamField path="date_before" type="string">
この日付（`YYYY-MM-DD`）以前に公開された結果のみ。
</ParamField>

<ParamField path="domain_filter" type="string[]">
ドメイン allowlist/denylist 配列（最大 20）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
合計コンテンツ予算（最大 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
ページごとのトークン上限。
</ParamField>

レガシーな Sonar/OpenRouter 互換経路では:

- `query`, `count`, `freshness` は受け付けられます
- そこでは `count` は互換性専用です。レスポンスは引き続き、
  N 件の結果一覧ではなく、引用付きの 1 つの合成回答です
- `country`, `language`, `date_after`,
  `date_before`, `domain_filter`, `max_tokens`, `max_tokens_per_page`
  のような Search API 専用フィルターは明示的エラーを返します

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

// ドメインフィルタリング（denylist - 先頭に -）
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

### domain filter ルール

- フィルターごとの最大ドメイン数は 20
- 同一リクエスト内で allowlist と denylist は混在できない
- denylist エントリーには `-` prefix を使う（例: `["-reddit.com"]`）

## 注意

- Perplexity Search API は、構造化された web search 結果（`title`, `url`, `snippet`）を返します
- OpenRouter または明示的な `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` は、互換性のために Perplexity を Sonar chat completions に戻します
- Sonar/OpenRouter 互換性は、構造化された結果行ではなく、引用付きの 1 つの合成回答を返します
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Perplexity Search API docs](https://docs.perplexity.ai/docs/search/quickstart) -- 公式 Perplexity ドキュメント
- [Brave Search](/ja-JP/tools/brave-search) -- 国/言語フィルター付き構造化結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きニューラル検索
