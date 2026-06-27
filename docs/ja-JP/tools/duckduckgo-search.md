---
read_when:
    - API キーを必要としない Web 検索プロバイダーが必要である
    - web_search に DuckDuckGo を使用したい
    - 明示的に選択されたキー不要の検索プロバイダーが必要です
summary: DuckDuckGo Web検索 -- キー不要プロバイダー（実験的、HTMLベース）
title: DuckDuckGo 検索
x-i18n:
    generated_at: "2026-06-27T13:11:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw は、**キー不要**の `web_search` プロバイダーとして DuckDuckGo をサポートしています。API
キーやアカウントは不要です。

<Warning>
  DuckDuckGo は、公式 API ではなく DuckDuckGo の非 JavaScript 検索ページから結果を取得する
  **実験的な非公式**インテグレーションです。bot チャレンジページや HTML の変更によって
  ときどき壊れる可能性があります。
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

- **API キー不要** - DuckDuckGo を `web_search` プロバイダーとして選択すると動作します
- **実験的** - 公式 API や SDK ではなく、DuckDuckGo の非 JavaScript HTML
  検索ページから結果を収集します
- **bot チャレンジのリスク** - 大量または自動化された使用では、DuckDuckGo が CAPTCHA を表示したりリクエストをブロックしたりする場合があります
- **HTML 解析** - 結果はページ構造に依存し、予告なく変更される可能性があります
- **明示的な選択** - API ベースのプロバイダーが設定されていない場合でも、OpenClaw は DuckDuckGo を自動的には選択しません
- **SafeSearch は未設定時に moderate がデフォルト**です

<Tip>
  本番環境で使用する場合は、[Brave Search](/ja-JP/tools/brave-search) (無料枠
  あり) または別の API ベースのプロバイダーを検討してください。
</Tip>

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 無料枠付きの構造化された結果
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付きニューラル検索
