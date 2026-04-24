---
read_when:
    - web_searchにExaを使いたい場合
    - '`EXA_API_KEY`が必要な場合'
    - neural検索またはコンテンツ抽出を使いたい場合
summary: Exa AI検索 -- コンテンツ抽出付きのneural検索とkeyword検索
title: Exa検索
x-i18n:
    generated_at: "2026-04-24T05:24:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 15
---

OpenClawは、[Exa AI](https://exa.ai/)を`web_search`プロバイダーとしてサポートしています。Exaは、組み込みのコンテンツ抽出
（highlights、text、summary）付きで、neural、keyword、およびhybrid検索モードを提供します。

## API keyを取得する

<Steps>
  <Step title="アカウントを作成する">
    [exa.ai](https://exa.ai/)で登録し、ダッシュボードからAPI keyを生成します。
  </Step>
  <Step title="keyを保存する">
    Gateway環境で`EXA_API_KEY`を設定するか、次で設定します。

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
            apiKey: "exa-...", // EXA_API_KEYが設定されていれば任意
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

**環境変数の代替:** Gateway環境で`EXA_API_KEY`を設定します。
gatewayインストールでは、`~/.openclaw/.env`に置いてください。

## ツールパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number">
返す結果数（1〜100）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
検索モード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター。
</ParamField>

<ParamField path="date_after" type="string">
この日付以降の結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
この日付以前の結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
コンテンツ抽出オプション（下記参照）。
</ParamField>

### コンテンツ抽出

Exaは、検索結果と一緒に抽出済みコンテンツを返せます。有効にするには`contents`
オブジェクトを渡します。

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // ページ全文
    highlights: { numSentences: 3 }, // 主要な文
    summary: true, // AI要約
  },
});
```

| コンテンツオプション | 型 | 説明 |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | ページ全文を抽出 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 主要な文を抽出 |
| `summary`       | `boolean \| { query }`                                                | AI生成要約 |

### 検索モード

| モード | 説明 |
| ---------------- | --------------------------------- |
| `auto`           | Exaが最適なモードを選択します（デフォルト） |
| `neural`         | セマンティック/意味ベース検索 |
| `fast`           | 高速keyword検索 |
| `deep`           | 徹底的なdeep検索 |
| `deep-reasoning` | 推論付きdeep検索 |
| `instant`        | 最速の結果 |

## 注意

- `contents`オプションが指定されない場合、Exaはデフォルトで`{ highlights: true }`
  を使用するため、結果には主要文の抜粋が含まれます
- 結果は、利用可能な場合、Exa APIレスポンスの`highlightScores`と`summary`フィールドを保持します
- 結果説明は、highlights、summary、
  全文の順で解決されます。利用可能なものが使われます
- `freshness`と`date_after`/`date_before`は併用できません。時間フィルターモードは
  1つだけ使ってください
- クエリごとに最大100件の結果を返せます（Exa search-type
  制限の対象）
- 結果はデフォルトで15分間キャッシュされます（`cacheTtlMinutes`で設定可能）
- Exaは、構造化JSONレスポンスを返す公式API連携です

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 国/言語フィルター付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
