---
read_when:
    - Gemini で web_search を使用したい
    - GEMINI_API_KEY または models.providers.google.apiKey が必要です
    - Google 検索グラウンディングを使いたい
summary: Google Search グラウンディングを使った Gemini Web 検索
title: Gemini 検索
x-i18n:
    generated_at: "2026-07-05T11:50:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c7cb55fb185adfda01ab6b3c6434ab6e3ee31162733c752d4c81328bce9a6cd
    source_path: tools/gemini-search.md
    workflow: 16
---

OpenClaw は組み込みの
[Google Search グラウンディング](https://ai.google.dev/gemini-api/docs/grounding)
を備えた Gemini モデルに対応しており、ライブの Google Search 結果に基づく
引用付きの、AIが合成した回答を返します。

## API キーを取得する

<Steps>
  <Step title="キーを作成する">
    [Google AI Studio](https://aistudio.google.com/apikey) に移動し、
    API キーを作成します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境で `GEMINI_API_KEY` を設定するか、
    `models.providers.google.apiKey` を再利用するか、次の方法で専用の Web 検索キーを設定します。

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
その次に `models.providers.google.apiKey` を使用します。ベース URL では、専用の
`plugins.entries.google.config.webSearch.baseUrl` が
`models.providers.google.baseUrl` より優先されます。

Gateway インストールでは、環境キーを `~/.openclaw/.env` に配置します。

## 仕組み

リンクとスニペットの一覧を返す従来の検索プロバイダーとは異なり、
Gemini は Google Search グラウンディングを使用して、インライン引用付きの
AIが合成した回答を生成します。結果には、合成された回答とソース
URL の両方が含まれます。

- Gemini グラウンディングからの引用 URL は、OpenClaw の SSRF 保護付き
  fetch パス（リダイレクト追跡、http/https 検証）を通した HEAD request により、
  Google リダイレクト URL から直接 URL に自動的に解決されます。
- リダイレクト解決には厳格な SSRF デフォルトが使用されるため、
  プライベートまたは内部ターゲットへのリダイレクトはブロックされます。

## 対応パラメーター

Gemini 検索は `query`、`freshness`、`date_after`、`date_before` に対応しています。

`count` は共有の `web_search` 互換性のために受け付けられますが、Gemini グラウンディングは
N 件の結果リストではなく、引用付きの合成された回答を 1 つ返します。

`freshness` は `day`、`week`、`month`、`year` と、共有ショートカットの
`pd`、`pw`、`pm`、`py` を受け付けます。`day`/`pd` は、厳密な 24 時間範囲ではなく、
Gemini クエリに新しさの指示を追加します。`week`、`month`、`year` と明示的な
`date_after`/`date_before` 範囲は、Gemini Google Search グラウンディングの
`timeRangeFilter` を設定します。`country`、`language`、`domain_filter` は対応していません。

## モデル選択

デフォルトモデルは `gemini-2.5-flash`（高速で費用対効果が高い）です。グラウンディングに対応する任意の Gemini
モデルを `plugins.entries.google.config.webSearch.model` で使用できます。

## ベース URL の上書き

Gemini Web 検索をオペレーターのプロキシまたはカスタムの Gemini 互換エンドポイント経由でルーティングする必要がある場合は、
`plugins.entries.google.config.webSearch.baseUrl` を設定します。
これが未設定の場合、Gemini Web 検索は `models.providers.google.baseUrl` を再利用します。プレーンな
`https://generativelanguage.googleapis.com` 値は
`https://generativelanguage.googleapis.com/v1beta` に正規化されます。カスタムプロキシパスは、
末尾のスラッシュを削除したうえで指定どおり保持されます。

## 関連

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- スニペット付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- 構造化結果 + コンテンツ抽出
