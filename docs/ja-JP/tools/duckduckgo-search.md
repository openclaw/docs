---
read_when:
    - API キーが不要な Web 検索プロバイダーを使いたい場合
    - web_search で DuckDuckGo を使用したい
    - 設定不要の検索フォールバックが必要です
summary: DuckDuckGo ウェブ検索 -- キー不要のフォールバックプロバイダー (実験的、HTMLベース)
title: DuckDuckGo 検索
x-i18n:
    generated_at: "2026-05-06T05:20:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw は、**キー不要**の `web_search` プロバイダーとして DuckDuckGo をサポートしています。API
キーやアカウントは不要です。

<Warning>
  DuckDuckGo は、公式 API ではなく DuckDuckGo の非 JavaScript 検索ページから結果を取得する、**実験的な非公式**統合です。bot チャレンジページや HTML 変更によって、ときどき壊れる可能性があります。
</Warning>

## セットアップ

API キーは不要です - DuckDuckGo をプロバイダーとして設定するだけです。

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## 設定

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

リージョンと SafeSearch の任意の Plugin レベル設定:

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

## ツールパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果数 (1-10)。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo リージョンコード (例: `us-en`, `uk-en`, `de-de`)。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch レベル。
</ParamField>

リージョンと SafeSearch は Plugin 設定でも指定できます (上記参照) - ツール
パラメーターはクエリごとに設定値を上書きします。

## 注記

- **API キー不要** - そのまま動作し、設定は不要
- **実験的** - 公式 API や SDK ではなく、DuckDuckGo の非 JavaScript HTML
  検索ページから結果を収集します
- **bot チャレンジのリスク** - 高負荷または自動化された使用では、DuckDuckGo が CAPTCHA を表示したりリクエストをブロックしたりする場合があります
- **HTML 解析** - 結果はページ構造に依存し、予告なく変更される可能性があります
- **自動検出の順序** - DuckDuckGo は最初のキー不要フォールバック
  (順序 100) です。設定済みのキーを持つ API ベースのプロバイダーが先に実行され、
  その後に Ollama Web Search (順序 110)、SearXNG (順序 200) が実行されます
- **未設定の場合、SafeSearch は moderate がデフォルト**です

<Tip>
  本番環境で使用する場合は、[Brave Search](/ja-JP/tools/brave-search) (無料枠あり)
  または別の API ベースのプロバイダーを検討してください。
</Tip>

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きのニューラル検索
