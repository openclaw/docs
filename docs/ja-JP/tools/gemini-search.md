---
read_when:
    - web_search に Gemini を使用したい場合
    - GEMINI_API_KEY または models.providers.google.apiKey が必要です
    - Google Search によるグラウンディングを使用したい
summary: Google Search グラウンディングによる Gemini ウェブ検索
title: Gemini 検索
x-i18n:
    generated_at: "2026-05-02T05:07:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 015d77fef123b1fd99d43eb6472bb8c672585328e17735d1fa0ead387cd2066a
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw は、組み込みの
[Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)
を備えた Gemini モデルをサポートします。これは、ライブの Google Search 結果に
引用で裏付けられた AI 合成の回答を返します。

## API キーを取得する

<Steps>
  <Step title="Create a key">
    [Google AI Studio](https://aistudio.google.com/apikey) に移動して、
    API キーを作成します。
  </Step>
  <Step title="Store the key">
    Gateway 環境で `GEMINI_API_KEY` を設定するか、
    `models.providers.google.apiKey` を再利用するか、次のコマンドで専用の Web 検索キーを構成します。

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
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // optional; falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash", // default
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

**認証情報の優先順位:** Gemini Web 検索は、まず
`plugins.entries.google.config.webSearch.apiKey` を使用し、次に `GEMINI_API_KEY`、
その次に `models.providers.google.apiKey` を使用します。ベース URL については、専用の
`plugins.entries.google.config.webSearch.baseUrl` が
`models.providers.google.baseUrl` より優先されます。

Gateway インストールでは、環境キーを `~/.openclaw/.env` に配置します。

## 仕組み

リンクとスニペットの一覧を返す従来の検索プロバイダーとは異なり、
Gemini は Google Search grounding を使用して、インライン引用付きの
AI 合成回答を生成します。結果には、合成された回答とソース
URL の両方が含まれます。

- Gemini grounding からの引用 URL は、Google リダイレクト URL から直接 URL へ自動的に解決されます。
- リダイレクト解決では、最終的な引用 URL を返す前に SSRF ガード経路（HEAD + リダイレクトチェック +
  http/https 検証）を使用します。
- リダイレクト解決では厳格な SSRF デフォルトを使用するため、
  private/internal ターゲットへのリダイレクトはブロックされます。

## サポートされるパラメーター

Gemini 検索は、`query`、`freshness`、`date_after`、`date_before` をサポートします。

`count` は共有 `web_search` 互換性のために受け付けられますが、Gemini grounding は
N 件の結果一覧ではなく、引用付きの合成回答を 1 つ返します。

`freshness` は `day`、`week`、`month`、`year` と、共有ショートカットの
`pd`、`pw`、`pm`、`py` を受け付けます。OpenClaw はこれらの値、または明示的な
`date_after`/`date_before` 範囲を、Gemini Google Search grounding の
`timeRangeFilter` に変換します。`country`、`language`、`domain_filter` はサポートされません。

## モデル選択

デフォルトのモデルは `gemini-2.5-flash`（高速で費用対効果が高い）です。grounding をサポートする任意の Gemini
モデルを、`plugins.entries.google.config.webSearch.model` で使用できます。

## ベース URL の上書き

Gemini Web 検索をオペレータープロキシまたはカスタムの Gemini 互換エンドポイント経由にする必要がある場合は、
`plugins.entries.google.config.webSearch.baseUrl` を設定します。これが未設定の場合、Gemini Web 検索は
`models.providers.google.baseUrl` を再利用します。単純な
`https://generativelanguage.googleapis.com` 値は
`https://generativelanguage.googleapis.com/v1beta` に正規化されます。カスタムプロキシパスは、末尾のスラッシュを削除した後、指定どおり保持されます。

## 関連

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- スニペット付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- 構造化結果 + コンテンツ抽出
