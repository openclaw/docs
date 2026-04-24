---
read_when:
    - '`web_search` で Brave Search を使いたい場合'
    - '`BRAVE_API_KEY` またはプラン詳細が必要な場合'
summary: '`web_search` 向け Brave Search API セットアップ'
title: Brave search
x-i18n:
    generated_at: "2026-04-24T05:22:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw は `web_search` provider として Brave Search API をサポートしています。

## API キーを取得する

1. [https://brave.com/search/api/](https://brave.com/search/api/) で Brave Search API アカウントを作成します
2. ダッシュボードで **Search** プランを選び、API キーを生成します。
3. キーを config に保存するか、Gateway 環境に `BRAVE_API_KEY` を設定します。

## 設定例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // または "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

provider 固有の Brave search 設定は現在 `plugins.entries.brave.config.webSearch.*` 配下にあります。
旧来の `tools.web.search.apiKey` も互換 shim を通じて引き続き読み込まれますが、もはや正式な config path ではありません。

`webSearch.mode` は Brave トランスポートを制御します:

- `web`（デフォルト）: タイトル、URL、スニペットを返す通常の Brave web search
- `llm-context`: Brave LLM Context API。テキストチャンクと出典が事前抽出され、grounding 用に返される

## ツールパラメータ

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果数（1–10）。
</ParamField>

<ParamField path="country" type="string">
2 文字の ISO 国コード（例: `US`, `DE`）。
</ParamField>

<ParamField path="language" type="string">
検索結果用の ISO 639-1 言語コード（例: `en`, `de`, `fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave 検索言語コード（例: `en`, `en-gb`, `zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 要素向け ISO 言語コード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルタ — `day` は 24 時間。
</ParamField>

<ParamField path="date_after" type="string">
この日付（`YYYY-MM-DD`）以降に公開された結果のみ。
</ParamField>

<ParamField path="date_before" type="string">
この日付（`YYYY-MM-DD`）以前に公開された結果のみ。
</ParamField>

**例:**

```javascript
// 国と言語を指定した検索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近の結果（過去 1 週間）
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
```

## 注記

- OpenClaw は Brave の **Search** プランを使います。旧来のサブスクリプション（たとえば元の Free プランで月 2,000 クエリなど）を持っている場合、それは引き続き有効ですが、LLM Context やより高いレート制限のような新機能は含まれません。
- 各 Brave プランには **月額 \$5 の無料クレジット**（更新あり）が含まれます。Search プランは 1,000 リクエストあたり \$5 なので、このクレジットで月 1,000 クエリをカバーできます。予期しない請求を避けるため、Brave ダッシュボードで使用量上限を設定してください。最新プランは [Brave API portal](https://brave.com/search/api/) を参照してください。
- Search プランには LLM Context エンドポイントと AI inference 権が含まれます。結果を保存してモデル学習や調整に使うには、明示的な保存権を持つプランが必要です。Brave の [Terms of Service](https://api-dashboard.search.brave.com/terms-of-service) を参照してください。
- `llm-context` モードは、通常の web-search スニペット形状の代わりに grounded source エントリを返します。
- `llm-context` モードは `ui_lang`, `freshness`, `date_after`, `date_before` をサポートしません。
- `ui_lang` には `en-US` のようなリージョンサブタグが必要です。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダと自動検出
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタ付き構造化結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きニューラル検索
