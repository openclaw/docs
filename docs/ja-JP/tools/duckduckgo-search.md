---
read_when:
    - APIキーを必要としないWeb検索プロバイダーが必要な場合
    - web_search に DuckDuckGo を使用したい場合
    - 明示的に選択されたキー不要の検索プロバイダーが必要です
summary: DuckDuckGo Web 検索 -- キー不要プロバイダー (実験的、HTML ベース)
title: DuckDuckGo 検索
x-i18n:
    generated_at: "2026-07-05T11:53:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw は DuckDuckGo を**キー不要**の `web_search` プロバイダーとしてサポートしています。API キーやアカウントは不要です。

<Warning>
  DuckDuckGo は、公式 API ではなく DuckDuckGo の非 JavaScript HTML 検索ページをスクレイピングする**実験的な非公式**統合です。bot チャレンジページや HTML の変更により、ときどき壊れる可能性があります。
</Warning>

## セットアップ

自動検出は利用可能な認証情報を持つプロバイダーのみを考慮するため、DuckDuckGo が自動選択されることはありません。明示的に設定してください。

<Steps>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## 設定

設定でプロバイダーを直接指定します。

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
DuckDuckGo リージョンコード (例: `us-en`、`uk-en`、`de-de`)。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch レベル。
</ParamField>

`region` と `safeSearch` のツールパラメーターは、クエリごとに上記の Plugin 設定値を上書きします。

## 注記

- **API キー不要** -- DuckDuckGo が `web_search` プロバイダーとして選択されていれば動作します。
- **実験的** -- 公式 API や SDK ではなく、DuckDuckGo の非 JavaScript HTML 検索ページをスクレイピングします。結果はページ構造に依存し、ページ構造は予告なく変更されることがあります。
- **bot チャレンジのリスク** -- DuckDuckGo は、高負荷または自動化された利用に対して CAPTCHA を表示したり、リクエストをブロックしたりする場合があります。
- **明示的な選択のみ** -- OpenClaw の自動検出は利用可能な認証情報を持つプロバイダーのみを考慮するため、DuckDuckGo のようなキー不要のプロバイダーが自動的に選ばれることはありません。`provider: "duckduckgo"` を設定する必要があります。
- **設定されていない場合、SafeSearch のデフォルトは `moderate`** です。

<Tip>
  本番環境での使用には、[Brave Search](/ja-JP/tools/brave-search) (無料枠あり) または別の API ベースのプロバイダーを検討してください。
</Tip>

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きのニューラル検索
