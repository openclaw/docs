---
read_when:
    - web_searchにGeminiを使いたい場合
    - '`GEMINI_API_KEY`が必要な場合'
    - Google Searchグラウンディングを使いたい場合
summary: Google Searchグラウンディングを使うGemini Web検索
title: Gemini検索
x-i18n:
    generated_at: "2026-04-24T05:24:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0778ae326e23ea1bb719fdc694b2accc5a6651e08658a695d4d70e20fc5943a4
    source_path: tools/gemini-search.md
    workflow: 15
---

OpenClawは、組み込みの[Google Searchグラウンディング](https://ai.google.dev/gemini-api/docs/grounding)を備えたGeminiモデルをサポートしており、引用付きの最新Google Search結果に基づくAI生成回答を返します。

## API keyを取得する

<Steps>
  <Step title="keyを作成する">
    [Google AI Studio](https://aistudio.google.com/apikey)にアクセスし、API keyを作成します。
  </Step>
  <Step title="keyを保存する">
    Gateway環境で`GEMINI_API_KEY`を設定するか、次で設定します。

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
            apiKey: "AIza...", // GEMINI_API_KEYが設定されていれば任意
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

**環境変数の代替:** Gateway環境で`GEMINI_API_KEY`を設定します。
gatewayインストールでは、`~/.openclaw/.env`に置いてください。

## 仕組み

リンクとsnippetの一覧を返す従来の検索プロバイダーとは異なり、
GeminiはGoogle Searchグラウンディングを使って、インライン引用付きのAI生成回答を生成します。結果には、生成された回答とソースURLの両方が含まれます。

- Geminiグラウンディングの引用URLは、Googleの
  リダイレクトURLから直接URLへ自動的に解決されます。
- リダイレクト解決では、最終的な引用URLを返す前に、SSRFガードパス（HEAD + redirect checks +
  http/https validation）を使用します。
- リダイレクト解決は厳格なSSRFデフォルトを使うため、
  private/internal対象へのリダイレクトはブロックされます。

## サポートされるパラメーター

Gemini検索は`query`をサポートします。

`count`は共有`web_search`互換性のため受け付けられますが、Geminiグラウンディングは
依然としてN件の結果リストではなく、引用付きの1つの生成回答を返します。

`country`、`language`、`freshness`、`domain_filter`のような
プロバイダー固有フィルターはサポートされていません。

## モデル選択

デフォルトモデルは`gemini-2.5-flash`です（高速で費用対効果が高い）。グラウンディングをサポートする任意のGemini
モデルを`plugins.entries.google.config.webSearch.model`経由で使用できます。

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- snippet付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- 構造化結果 + コンテンツ抽出
