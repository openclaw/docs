---
read_when:
    - web_search に Brave Search を使用したい場合
    - BRAVE_API_KEY またはプランの詳細が必要です
summary: web_search 用 Brave Search API の設定
title: Brave 検索
x-i18n:
    generated_at: "2026-05-02T05:06:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5b6624d078ba55e30fbac4dd863a0d016e2e8d160e32bcc406e5070998241ba
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw は `web_search` プロバイダーとして Brave Search API をサポートしています。

## API キーを取得する

1. [https://brave.com/search/api/](https://brave.com/search/api/) で Brave Search API アカウントを作成します
2. ダッシュボードで **Search** プランを選択し、API キーを生成します。
3. キーを設定に保存するか、Gateway 環境で `BRAVE_API_KEY` を設定します。

## 設定例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
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

プロバイダー固有の Brave 検索設定は、現在 `plugins.entries.brave.config.webSearch.*` の下にあります。
従来の `tools.web.search.apiKey` は互換性 shim 経由で引き続き読み込まれますが、もはや正規の設定パスではありません。

`webSearch.mode` は Brave トランスポートを制御します。

- `web`（デフォルト）: タイトル、URL、スニペットを含む通常の Brave Web 検索
- `llm-context`: 根拠付け用の事前抽出済みテキストチャンクとソースを含む Brave LLM Context API

## ツールパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果の数（1～10）。
</ParamField>

<ParamField path="country" type="string">
2 文字の ISO 国コード（例: `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
検索結果用の ISO 639-1 言語コード（例: `en`、`de`、`fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave の検索言語コード（例: `en`、`en-gb`、`zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 要素用の ISO 言語コード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター — `day` は 24 時間です。
</ParamField>

<ParamField path="date_after" type="string">
この日付（`YYYY-MM-DD`）より後に公開された結果のみ。
</ParamField>

<ParamField path="date_before" type="string">
この日付（`YYYY-MM-DD`）より前に公開された結果のみ。
</ParamField>

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
```

## 注記

- OpenClaw は Brave **Search** プランを使用します。従来のサブスクリプション（例: 月 2,000 クエリの元の Free プラン）を持っている場合、それは引き続き有効ですが、LLM Context やより高いレート制限などの新しい機能は含まれません。
- 各 Brave プランには、**月額 \$5 の無料クレジット**（更新あり）が含まれます。Search プランは 1,000 リクエストあたり \$5 なので、このクレジットで月 1,000 クエリをカバーできます。予期しない請求を避けるため、Brave ダッシュボードで使用上限を設定してください。現在のプランについては [Brave API ポータル](https://brave.com/search/api/) を参照してください。
- Search プランには LLM Context エンドポイントと AI 推論権限が含まれます。モデルのトレーニングまたはチューニングのために結果を保存するには、明示的な保存権限を持つプランが必要です。Brave の [利用規約](https://api-dashboard.search.brave.com/terms-of-service) を参照してください。
- `llm-context` モードは、通常の Web 検索スニペット形式の代わりに、根拠付けされたソースエントリを返します。
- `llm-context` モードは `freshness` と、境界付きの `date_after` + `date_before` 範囲をサポートします。`ui_lang` はサポートしません。Brave ではカスタム鮮度範囲に開始日と終了日の両方を含める必要があるため、`date_after` なしの `date_before` は拒否されます。
- `ui_lang` には `en-US` のような地域サブタグを含める必要があります。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）。

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリングを備えた構造化結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出を備えたニューラル検索
