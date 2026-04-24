---
read_when:
    - web_search で Brave Search を使用したい場合
    - '`BRAVE_API_KEY` またはプランの詳細が必要です'
summary: web_search の Brave Search API セットアップ
title: Brave search（レガシーパス）
x-i18n:
    generated_at: "2026-04-24T04:45:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 15
---

# Brave Search API

OpenClaw は、`web_search` プロバイダーとして Brave Search API をサポートしています。

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

Brave 検索のプロバイダー固有設定は、現在 `plugins.entries.brave.config.webSearch.*` 配下にあります。
レガシーな `tools.web.search.apiKey` も互換性 shim を通じて引き続き読み込まれますが、標準の設定パスではなくなりました。

`webSearch.mode` は Brave の転送方式を制御します。

- `web`（デフォルト）: タイトル、URL、スニペットを含む通常の Brave Web 検索
- `llm-context`: グラウンディング用に事前抽出されたテキストチャンクとソースを含む Brave LLM Context API

## ツールパラメーター

| パラメーター | 説明 |
| ------------- | ------------------------------------------------------------------- |
| `query`       | 検索クエリ（必須） |
| `count`       | 返す結果数（1〜10、デフォルト: 5） |
| `country`     | 2 文字の ISO 国コード（例: "US", "DE"） |
| `language`    | 検索結果用の ISO 639-1 言語コード（例: "en", "de", "fr"） |
| `search_lang` | Brave の検索言語コード（例: `en`, `en-gb`, `zh-hans`） |
| `ui_lang`     | UI 要素用の ISO 言語コード |
| `freshness`   | 時間フィルター: `day`（24 時間）、`week`、`month`、または `year` |
| `date_after`  | この日付以降に公開された結果のみ（YYYY-MM-DD） |
| `date_before` | この日付以前に公開された結果のみ（YYYY-MM-DD） |

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
```

## 注意

- OpenClaw は Brave の **Search** プランを使用します。レガシーなサブスクリプション（例: 月 2,000 クエリの旧 Free プラン）を利用している場合も引き続き有効ですが、LLM Context やより高いレート制限などの新しい機能は含まれません。
- 各 Brave プランには、毎月更新される **\$5/月の無料クレジット** が含まれます。Search プランの料金は 1,000 リクエストあたり \$5 なので、このクレジットで月 1,000 クエリをまかなえます。想定外の請求を防ぐため、Brave ダッシュボードで使用量の上限を設定してください。現在のプランについては [Brave API ポータル](https://brave.com/search/api/) を参照してください。
- Search プランには、LLM Context エンドポイントと AI 推論権が含まれます。結果を保存してモデルの学習や調整に使用するには、明示的な保存権を含むプランが必要です。詳しくは Brave の [利用規約](https://api-dashboard.search.brave.com/terms-of-service) を参照してください。
- `llm-context` モードは、通常の web_search スニペット形式ではなく、グラウンディングされたソースエントリーを返します。
- `llm-context` モードは `ui_lang`、`freshness`、`date_after`、`date_before` をサポートしていません。
- `ui_lang` には `en-US` のようなリージョンサブタグを含める必要があります。
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で設定可能）。

`web_search` の完全な設定については、[Web ツール](/ja-JP/tools/web) を参照してください。

## 関連

- [Brave search](/ja-JP/tools/brave-search)
