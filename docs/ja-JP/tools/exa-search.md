---
read_when:
    - Exa を web_search に使用したい
    - EXA_API_KEY が必要です
    - ニューラル検索またはコンテンツ抽出が必要な場合
summary: Exa AI 検索 -- コンテンツ抽出を備えたニューラル検索とキーワード検索
title: Exa検索
x-i18n:
    generated_at: "2026-07-05T11:53:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) は、ニューラル、キーワード、ハイブリッド検索モードに加えて、組み込みのコンテンツ抽出（ハイライト、テキスト、要約）を備えた `web_search` プロバイダーです。

## Pluginをインストール

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## APIキーを取得

<Steps>
  <Step title="Create an account">
    [exa.ai](https://exa.ai/) でサインアップし、ダッシュボードからAPIキーを生成します。
  </Step>
  <Step title="Store the key">
    Gateway環境で `EXA_API_KEY` を設定するか、次で構成します。

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**環境変数による代替:** Gateway環境で `EXA_API_KEY` を設定します。gatewayインストールでは、`~/.openclaw/.env` に入れます。[環境変数](/ja-JP/help/faq#env-vars-and-env-loading)を参照してください。

## Base URLの上書き

Exa検索リクエストを互換プロキシまたは代替エンドポイント経由にルーティングするには、`plugins.entries.exa.config.webSearch.baseUrl` を設定します。OpenClawは、裸のホストの先頭に `https://` を付け、パスがすでにそこで終わっていない限り `/search` を追加して正規化します。解決されたエンドポイントは検索キャッシュキーの一部になるため、異なるエンドポイントからの結果が共有されることはありません。

## ツールパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number" default="5">
返す結果数（1-100、Exaの検索タイプ制限に従います）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
検索モード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター。`date_after`/`date_before` と組み合わせることはできません。
</ParamField>

<ParamField path="date_after" type="string">
この日付（`YYYY-MM-DD`）より後の結果。
</ParamField>

<ParamField path="date_before" type="string">
この日付（`YYYY-MM-DD`）より前の結果。
</ParamField>

<ParamField path="contents" type="object">
コンテンツ抽出オプション（下記参照）。
</ParamField>

### コンテンツ抽出

結果内の抽出コンテンツを制御するには、`contents` オブジェクトを渡します。

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| コンテンツオプション | 型                                                                    | 説明                 |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | ページ全文を抽出 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 重要な文を抽出  |
| `summary`       | `boolean \| { query }`                                                | AI生成の要約   |

`contents` を省略した場合、Exaはデフォルトで `{ highlights: true }` になるため、結果には重要文の抜粋が含まれます。結果の説明は、まずハイライト、次に要約、次に全文の順に、最初に利用可能なものから解決されます。利用可能な場合、結果にはExa APIレスポンスの生の `highlightScores` フィールドと `summary` フィールドも保持されます。

### 検索モード

| モード             | 説明                       |
| ---------------- | --------------------------------- |
| `auto`           | Exaが最適なモードを選択（デフォルト） |
| `neural`         | セマンティック/意味ベースの検索     |
| `fast`           | 高速なキーワード検索              |
| `deep`           | 徹底的なディープ検索              |
| `deep-reasoning` | 推論を伴うディープ検索        |
| `instant`        | 最速の結果                   |

## 注記

- `count` は最大100まで受け付けますが、Exaの検索タイプ制限に従います。
- 結果はデフォルトで15分間キャッシュされます。Exaを含むすべての `web_search` プロバイダーのキャッシュとリクエストタイムアウトを変更するには、共有の `tools.web.search.cacheTtlMinutes`（分）と `tools.web.search.timeoutSeconds`（デフォルト30s）を構成します。

## 関連

- [Web Searchの概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 国/言語フィルター付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
