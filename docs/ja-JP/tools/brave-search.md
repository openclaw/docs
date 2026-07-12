---
read_when:
    - web_search に Brave Search を使用する場合
    - BRAVE_API_KEY またはプランの詳細が必要です
summary: web_search 用の Brave Search API セットアップ
title: Brave 検索
x-i18n:
    generated_at: "2026-07-11T22:42:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw は `web_search` プロバイダーとして Brave Search API をサポートしています。

## API キーを取得する

1. [https://brave.com/search/api/](https://brave.com/search/api/) で Brave Search API アカウントを作成します。
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
            mode: "web", // または "llm-context"
            baseUrl: "https://api.search.brave.com", // 任意のプロキシ／ベース URL の上書き
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

プロバイダー固有の Brave 検索設定は `plugins.entries.brave.config.webSearch.*` に配置します。これが正規の設定パスです。共有のトップレベル `tools.web.search.apiKey` とスコープ付きの `tools.web.search.brave.*` も互換性マージによって引き続き読み込まれますが、新しい設定では上記の Plugin スコープのパスを使用してください。

`webSearch.mode` は Brave の転送方式を制御します。

- `web`（デフォルト）：タイトル、URL、スニペットを含む通常の Brave ウェブ検索
- `llm-context`：グラウンディング用に事前抽出されたテキストチャンクとソースを提供する Brave LLM Context API

`webSearch.baseUrl` を使用すると、Brave リクエストを信頼できる Brave 互換プロキシ
またはゲートウェイに送信できます。OpenClaw は設定されたベース URL に
`/res/v1/web/search` または `/res/v1/llm/context` を追加し、ベース URL をキャッシュキーに含めます。公開
エンドポイントでは `https://` を使用する必要があります。`http://` は、信頼できるループバック
またはプライベートネットワーク上のプロキシホストに対してのみ許可されます。

## ツールのパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果の件数（1～10）。
</ParamField>

<ParamField path="country" type="string">
2 文字の ISO 国コード（例：`US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
検索結果に使用する ISO 639-1 言語コード（例：`en`、`de`、`fr`）。
</ParamField>

<ParamField path="search_lang" type="string">
Brave の検索言語コード（例：`en`、`en-gb`、`zh-hans`）。
</ParamField>

<ParamField path="ui_lang" type="string">
UI 要素に使用する ISO 言語コード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
期間フィルター — `day` は 24 時間です。
</ParamField>

<ParamField path="date_after" type="string">
この日付より後に公開された結果のみ（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
この日付より前に公開された結果のみ（`YYYY-MM-DD`）。
</ParamField>

**例：**

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

## 注意事項

- OpenClaw は Brave の **Search** プランを使用します。従来のサブスクリプション（例：月間 2,000 クエリを利用できる旧 Free プラン）を利用している場合、そのサブスクリプションは引き続き有効ですが、LLM Context やより高いレート制限などの新しい機能は含まれません。
- 各 Brave プランには、毎月更新される **月額 \$5 の無料クレジット** が含まれます。Search プランの料金は 1,000 リクエストあたり \$5 のため、このクレジットで月間 1,000 クエリを利用できます。予期しない課金を避けるため、Brave ダッシュボードで利用上限を設定してください。現在のプランについては、[Brave API ポータル](https://brave.com/search/api/)を参照してください。
- Search プランには、LLM Context エンドポイントと AI 推論権が含まれます。モデルの学習やチューニングのために結果を保存するには、明示的な保存権を含むプランが必要です。Brave の[利用規約](https://api-dashboard.search.brave.com/terms-of-service)を参照してください。
- `llm-context` モードでは、通常のウェブ検索のスニペット形式ではなく、グラウンディングされたソースエントリが返されます。
- `llm-context` モードは、`freshness` と範囲が限定された `date_after` + `date_before` の期間指定をサポートします。`ui_lang` はサポートされません。また、Brave ではカスタム期間に開始日と終了日の両方が必要なため、`date_after` を伴わない `date_before` は拒否されます。
- `ui_lang` には、`en-US` のような地域サブタグを含める必要があります。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）。
- カスタムの `webSearch.baseUrl` 値は Brave のキャッシュ識別情報に含まれるため、
  プロキシ固有のレスポンスが衝突することはありません。
- トラブルシューティング中に `brave.http` 診断フラグを有効にすると、Brave リクエストの URL／クエリパラメーター、レスポンスのステータス／所要時間、検索キャッシュのヒット／ミス／書き込みイベントがログに記録されます。このフラグで API キーやレスポンス本文がログに記録されることはありませんが、検索クエリには機密情報が含まれる可能性があります。

## 関連項目

- [ウェブ検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリングに対応した構造化結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出に対応したニューラル検索
