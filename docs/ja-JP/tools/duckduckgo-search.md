---
read_when:
    - API キーを必要としないウェブ検索プロバイダーを利用したい場合
    - web_search に DuckDuckGo を使用したい場合
    - 明示的に選択した、キー不要の検索プロバイダーを使用したい場合
summary: DuckDuckGo ウェブ検索 -- キー不要のプロバイダー（試験的、HTML ベース）
title: DuckDuckGo 検索
x-i18n:
    generated_at: "2026-07-11T22:46:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw は、**キー不要**の `web_search` プロバイダーとして DuckDuckGo をサポートしています。API キーやアカウントは必要ありません。

<Warning>
  DuckDuckGo は、公式 API ではなく、DuckDuckGo の JavaScript を使用しない HTML 検索ページをスクレイピングする、**実験的かつ非公式**の統合です。ボットチャレンジページや HTML の変更により、ときどき動作しなくなる可能性があります。
</Warning>

## セットアップ

自動検出では使用可能な認証情報を持つプロバイダーのみが考慮されるため、DuckDuckGo が自動選択されることはありません。明示的に設定してください。

<Steps>
  <Step title="設定">
    ```bash
    openclaw configure --section web
    # プロバイダーとして "duckduckgo" を選択
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

リージョンと SafeSearch に関する、任意の Plugin レベルの設定：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo のリージョンコード
            safeSearch: "moderate", // "strict"、"moderate"、または "off"
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
返す検索結果の数（1～10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo のリージョンコード（例：`us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
SafeSearch のレベル。
</ParamField>

`region` と `safeSearch` のツールパラメーターは、クエリごとに上記の Plugin 設定値を上書きします。

## 注意事項

- **API キー不要** -- DuckDuckGo を `web_search` プロバイダーとして選択すれば動作します。
- **実験的** -- 公式 API や SDK ではなく、DuckDuckGo の JavaScript を使用しない HTML 検索ページをスクレイピングします。結果はページ構造に依存し、ページ構造は予告なく変更される可能性があります。
- **ボットチャレンジのリスク** -- 高負荷または自動化された利用では、DuckDuckGo が CAPTCHA を表示したり、リクエストをブロックしたりする場合があります。
- **明示的に選択した場合のみ** -- OpenClaw の自動検出では使用可能な認証情報を持つプロバイダーのみが考慮されるため、DuckDuckGo のようなキー不要のプロバイダーが自動的に選択されることはありません。`provider: "duckduckgo"` を設定する必要があります。
- 設定されていない場合、**SafeSearch のデフォルトは `moderate`** です。

<Tip>
  本番環境で使用する場合は、[Brave Search](/ja-JP/tools/brave-search)（無料枠あり）または別の API ベースのプロバイダーを検討してください。
</Tip>

## 関連項目

- [Web 検索の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された検索結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出機能を備えたニューラル検索
