---
read_when:
    - web_search に Gemini を使用したい場合
    - GEMINI_API_KEY または models.providers.google.apiKey が必要です
    - Google 検索によるグラウンディングを使用する場合
summary: Google Search グラウンディングを使用した Gemini ウェブ検索
title: Gemini 検索
x-i18n:
    generated_at: "2026-07-11T22:45:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw は、組み込みの
[Google Search グラウンディング](https://ai.google.dev/gemini-api/docs/grounding)
に対応した Gemini モデルをサポートしています。これにより、リアルタイムの Google Search 結果に基づく、引用付きの AI 合成回答が返されます。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [Google AI Studio](https://aistudio.google.com/apikey) にアクセスし、
    API キーを作成します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `GEMINI_API_KEY` を設定するか、
    `models.providers.google.apiKey` を再利用するか、次のコマンドで Web 検索専用キーを設定します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 設定

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY または models.providers.google.apiKey が設定されている場合は省略可能
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 省略可能。models.providers.google.baseUrl にフォールバック
            model: "gemini-2.5-flash", // デフォルト
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**認証情報の優先順位:** Gemini Web 検索では、最初に
`plugins.entries.google.config.webSearch.apiKey`、次に `GEMINI_API_KEY`、
最後に `models.providers.google.apiKey` が使用されます。ベース URL については、
専用の `plugins.entries.google.config.webSearch.baseUrl` が
`models.providers.google.baseUrl` より優先されます。

Gateway をインストールする場合は、環境変数のキーを `~/.openclaw/.env` に配置します。

## 仕組み

リンクとスニペットの一覧を返す従来の検索プロバイダーとは異なり、
Gemini は Google Search グラウンディングを使用して、インライン引用付きの
AI 合成回答を生成します。結果には、合成された回答とソース URL の両方が含まれます。

- Gemini グラウンディングの引用 URL は、OpenClaw の SSRF 対策が施された
  フェッチ経路（リダイレクト追跡、http/https 検証）を介した HEAD リクエストにより、
  Google のリダイレクト URL から直接 URL へ自動的に解決されます。
- リダイレクト解決では厳格な SSRF デフォルト設定を使用するため、
  プライベートまたは内部ターゲットへのリダイレクトはブロックされます。

## サポートされるパラメーター

Gemini 検索は `query`、`freshness`、`date_after`、`date_before` をサポートします。

`count` は共通の `web_search` との互換性のために受け付けられますが、
Gemini グラウンディングは N 件の結果一覧ではなく、引用付きの合成回答を 1 件返します。

`freshness` には `day`、`week`、`month`、`year` と、共通の短縮形
`pd`、`pw`、`pm`、`py` を指定できます。`day`/`pd` は厳密な 24 時間の範囲を
設定する代わりに、Gemini クエリへ最新性に関する指示を追加します。
`week`、`month`、`year` および明示的な `date_after`/`date_before` の範囲は、
Gemini Google Search グラウンディングの `timeRangeFilter` を設定します。
`country`、`language`、`domain_filter` はサポートされません。

## モデルの選択

デフォルトモデルは `gemini-2.5-flash`（高速で費用対効果に優れる）です。
グラウンディングをサポートする任意の Gemini モデルを
`plugins.entries.google.config.webSearch.model` で使用できます。

## ベース URL の上書き

Gemini Web 検索を運用者のプロキシまたは Gemini 互換のカスタムエンドポイント経由で
ルーティングする必要がある場合は、`plugins.entries.google.config.webSearch.baseUrl`
を設定します。これが未設定の場合、Gemini Web 検索は
`models.providers.google.baseUrl` を再利用します。単純な
`https://generativelanguage.googleapis.com` という値は
`https://generativelanguage.googleapis.com/v1beta` に正規化されます。
カスタムプロキシのパスは、末尾のスラッシュを削除した後、指定どおりに保持されます。

## 関連項目

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- スニペット付きの構造化された結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- 構造化された結果とコンテンツ抽出
