---
read_when:
    - Web 検索に Perplexity Search を使用したい
    - PERPLEXITY_API_KEY または OPENROUTER_API_KEY のセットアップが必要です
summary: web_search 向けの Perplexity Search API と Sonar/OpenRouter 互換性
title: Perplexity 検索
x-i18n:
    generated_at: "2026-07-05T11:55:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a7ca97355110e70a05f1d57acab475dda8dec89393804df40c6e9be5e30780e8
    source_path: tools/perplexity-search.md
    workflow: 16
---

OpenClaw は Perplexity Search API を `web_search` プロバイダーとしてサポートします。これは `title`、`url`、`snippet` フィールドを持つ構造化結果を返します。

互換性のため、OpenClaw はレガシーの Perplexity Sonar/OpenRouter セットアップもサポートします。`OPENROUTER_API_KEY`、`plugins.entries.perplexity.config.webSearch.apiKey` 内の `sk-or-...` キー、または `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` を設定している場合、プロバイダーはチャット補完パスに切り替わり、構造化された Search API の結果ではなく、引用付きの AI 合成回答を返します。

## Plugin のインストール

公式 Plugin をインストールし、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## Perplexity API キーの取得

1. [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) で Perplexity アカウントを作成します。
2. ダッシュボードで API キーを生成します。
3. キーを設定に保存するか、Gateway 環境で `PERPLEXITY_API_KEY` を設定します。

## OpenRouter 互換性

Perplexity Sonar 用にすでに OpenRouter を使用していた場合は、`provider: "perplexity"` を維持し、Gateway 環境で `OPENROUTER_API_KEY` を設定するか、`plugins.entries.perplexity.config.webSearch.apiKey` に `sk-or-...` キーを保存します。

任意の互換性制御:

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 設定例

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

## キーを設定する場所

**設定経由:** `openclaw configure --section web` を実行します。これにより、キーは `~/.openclaw/openclaw.json` の `plugins.entries.perplexity.config.webSearch.apiKey` に保存されます。このフィールドは SecretRef オブジェクトも受け付けます。

**環境経由:** Gateway プロセス環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` を設定します。Gateway インストールの場合は、`~/.openclaw/.env`（またはサービス環境）に配置します。[環境変数](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

`provider: "perplexity"` が設定されていて、Perplexity キーの SecretRef が未解決で環境フォールバックもない場合、起動/再読み込みは即座に失敗します。

## ツールパラメーター

これらのパラメーターは、ネイティブ Perplexity Search API パスに適用されます。

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果の数（1〜10）。
</ParamField>

<ParamField path="country" type="string">
2 文字の ISO 国コード（例: `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 言語コード（例: `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター - `day` は 24 時間です。
</ParamField>

<ParamField path="date_after" type="string">
この日付（`YYYY-MM-DD`）より後に公開された結果のみ。
</ParamField>

<ParamField path="date_before" type="string">
この日付（`YYYY-MM-DD`）より前に公開された結果のみ。
</ParamField>

<ParamField path="domain_filter" type="string[]">
ドメインの許可リスト/拒否リスト配列（最大 20）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
合計コンテンツ予算（最大 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
ページごとのトークン上限。
</ParamField>

レガシー Sonar/OpenRouter 互換パスの場合:

- `query`、`count`、`freshness` が受け付けられます。
- `count` はそこでの互換性専用です。レスポンスは N 件の結果リストではなく、引用付きの単一の合成回答のままです。
- Search API 専用フィルター（`country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens`、`max_tokens_per_page`）は明示的なエラーを返します。

**例:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (allowlist)
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// Domain filtering (denylist - prefix with -)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// More content extraction
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### ドメインフィルターのルール

- フィルターごとに最大 20 ドメイン。
- 同じリクエスト内で許可リストと拒否リストのエントリを混在させることはできません。
- 拒否リストエントリには `-` プレフィックスを使用します（例: `["-reddit.com"]`）。

## 注記

- Perplexity Search API は、構造化された Web 検索結果（`title`、`url`、`snippet`）を返します。
- OpenRouter、または明示的な `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` は、互換性のため Perplexity を Sonar チャット補完へ戻します。
- Sonar/OpenRouter 互換性は、構造化された結果行ではなく、引用付きの単一の合成回答を返します。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）。

## 関連

<CardGroup cols={2}>
  <Card title="Web 検索の概要" href="/ja-JP/tools/web" icon="globe">
    すべてのプロバイダーと自動検出ルール。
  </Card>
  <Card title="Brave 検索" href="/ja-JP/tools/brave-search" icon="shield">
    国と言語のフィルター付き構造化結果。
  </Card>
  <Card title="Exa 検索" href="/ja-JP/tools/exa-search" icon="magnifying-glass">
    コンテンツ抽出付きのニューラル検索。
  </Card>
  <Card title="Perplexity Search API ドキュメント" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    公式 Perplexity Search API クイックスタートとリファレンス。
  </Card>
</CardGroup>
