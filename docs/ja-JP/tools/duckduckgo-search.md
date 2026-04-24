---
read_when:
    - API キー不要の Web 検索 provider が欲しい場合
    - web_search に DuckDuckGo を使いたい場合
    - 設定不要の検索 fallback が必要な場合
summary: DuckDuckGo Web Search -- キー不要の fallback provider（実験的、HTML ベース）
title: DuckDuckGo 検索
x-i18n:
    generated_at: "2026-04-24T05:24:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 15
---

OpenClaw は、**キー不要**の `web_search` provider として DuckDuckGo をサポートしています。API
キーやアカウントは不要です。

<Warning>
  DuckDuckGo は、DuckDuckGo の非 JavaScript 検索ページから結果を取得する**実験的な非公式統合**であり、公式 API ではありません。bot challenge ページや HTML 変更により、時折動作しなくなることがあります。
</Warning>

## セットアップ

API キーは不要です。provider として DuckDuckGo を設定するだけです。

<Steps>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # provider として "duckduckgo" を選択
    ```
  </Step>
</Steps>

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

リージョンと SafeSearch のための任意の Plugin レベル設定:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Tool パラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果数（1–10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo の region code（例: `us-en`, `uk-en`, `de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch レベル。
</ParamField>

region と SafeSearch は Plugin config でも設定できます（上記参照）。Tool
パラメーターはクエリごとに config 値を上書きします。

## メモ

- **API キー不要** — すぐに使え、設定不要
- **実験的** — DuckDuckGo の非 JavaScript HTML
  検索ページから結果を収集します。公式 API や SDK ではありません
- **bot challenge のリスク** — DuckDuckGo は、高頻度または自動化された利用では
  CAPTCHA を返したり、リクエストをブロックしたりすることがあります
- **HTML 解析** — 結果はページ構造に依存し、これは予告なく変更されることがあります
- **自動検出順序** — DuckDuckGo は自動検出における最初のキー不要 fallback
  （order 100）です。キー設定済みの API-backed provider が最初に実行され、
  次に Ollama Web Search（order 110）、その後に SearXNG（order 200）が続きます
- **設定されていない場合、SafeSearch のデフォルトは moderate** です

<Tip>
  本番利用では、[Brave Search](/ja-JP/tools/brave-search)（無料 tier
  あり）または別の API-backed provider を検討してください。
</Tip>

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 無料 tier 付きの構造化結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きの neural search
