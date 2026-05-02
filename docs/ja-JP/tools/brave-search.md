---
read_when:
    - Brave Search を web_search に使用したい場合
    - BRAVE_API_KEY またはプランの詳細が必要です
summary: web_search 用の Brave Search API 設定
title: Brave 検索
x-i18n:
    generated_at: "2026-05-02T21:07:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw は Brave Search API を `web_search` プロバイダーとしてサポートしています。

## APIキーを取得する

1. [https://brave.com/search/api/](https://brave.com/search/api/) で Brave Search API アカウントを作成します。
2. ダッシュボードで **Search** プランを選び、APIキーを生成します。
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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

プロバイダー固有の Brave 検索設定は、現在 `plugins.entries.brave.config.webSearch.*` 配下にあります。
レガシーの `tools.web.search.apiKey` は互換性 shim を通じて引き続き読み込まれますが、もはや正規の設定パスではありません。

`webSearch.mode` は Brave の転送方式を制御します。

- `web`（デフォルト）: タイトル、URL、スニペットを含む通常の Brave Web 検索
- `llm-context`: グラウンディング用に事前抽出されたテキストチャンクとソースを含む Brave LLM Context API

`webSearch.baseUrl` は、Brave リクエストを信頼済みの Brave 互換プロキシ
または Gateway に向けることができます。OpenClaw は設定されたベースURLに
`/res/v1/web/search` または `/res/v1/llm/context` を追加し、ベースURLをキャッシュキーに保持します。公開
エンドポイントでは `https://` を使用する必要があります。`http://` は、信頼済みのループバック
またはプライベートネットワークのプロキシホストに対してのみ許可されます。

## ツールパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果の数（1〜10）。
</ParamField>

<ParamField path="country" type="string">
2文字の ISO 国コード（例: `US`, `DE`）。
</ParamField>

<ParamField path="language" type="string">
検索結果の ISO 639-1 言語コード（例: `en`, `de`, `fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave の検索言語コード（例: `en`, `en-gb`, `zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 要素の ISO 言語コード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター — `day` は24時間です。
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

## 注意事項

- OpenClaw は Brave の **Search** プランを使用します。レガシーサブスクリプション（例: 月2,000クエリの元の Free プラン）を持っている場合は引き続き有効ですが、LLM Context やより高いレート制限などの新しい機能は含まれません。
- 各 Brave プランには、更新される **月額 \$5 の無料クレジット** が含まれます。Search プランは1,000リクエストあたり \$5 なので、このクレジットで月1,000クエリをカバーできます。予期しない課金を避けるため、Brave ダッシュボードで使用量上限を設定してください。現在のプランについては [Brave API ポータル](https://brave.com/search/api/) を参照してください。
- Search プランには LLM Context エンドポイントと AI 推論権が含まれます。モデルのトレーニングやチューニングのために結果を保存するには、明示的な保存権を持つプランが必要です。Brave の [利用規約](https://api-dashboard.search.brave.com/terms-of-service) を参照してください。
- `llm-context` モードは、通常の Web 検索スニペット形式ではなく、グラウンディングされたソースエントリを返します。
- `llm-context` モードは `freshness` と、境界付きの `date_after` + `date_before` 範囲をサポートします。`ui_lang` はサポートしません。`date_after` なしの `date_before` は、Brave がカスタム鮮度範囲に開始日と終了日の両方を含めることを要求するため拒否されます。
- `ui_lang` には `en-US` のようなリージョンサブタグを含める必要があります。
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes` で設定可能）。
- カスタム `webSearch.baseUrl` 値は Brave キャッシュIDに含まれるため、
  プロキシ固有のレスポンスが衝突することはありません。
- トラブルシューティング中に Brave リクエストの URL/クエリパラメーター、レスポンスのステータス/タイミング、検索キャッシュのヒット/ミス/書き込みイベントをログ出力するには、`brave.http` 診断フラグを有効にします。このフラグは APIキーやレスポンス本文をログ出力することはありませんが、検索クエリには機密情報が含まれる可能性があります。

## 関連

- [Web Search 概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きのニューラル検索
