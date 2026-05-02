---
read_when:
    - web_search に Exa を使用したい
    - EXA_API_KEYが必要です
    - ニューラル検索またはコンテンツ抽出が必要な場合
summary: Exa AI検索 -- コンテンツ抽出付きのニューラル検索とキーワード検索
title: Exa 検索
x-i18n:
    generated_at: "2026-05-02T21:07:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2ddf83c5130208eadc78eccb10aebf67af11b05690d75a817d6999f79be5fc3
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw は、`web_search` プロバイダーとして [Exa AI](https://exa.ai/) をサポートしています。Exa は、組み込みのコンテンツ抽出（ハイライト、テキスト、要約）を備えたニューラル、キーワード、ハイブリッド検索モードを提供します。

## API キーを取得する

<Steps>
  <Step title="アカウントを作成する">
    [exa.ai](https://exa.ai/) でサインアップし、ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存する">
    Gateway 環境に `EXA_API_KEY` を設定するか、次の方法で構成します。

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 構成

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

**環境の代替:** Gateway 環境に `EXA_API_KEY` を設定します。
gateway インストールの場合は、`~/.openclaw/.env` に配置します。

## Base URL の上書き

Exa 検索リクエストを互換プロキシまたは代替 Exa エンドポイント経由にする必要がある場合は、`plugins.entries.exa.config.webSearch.baseUrl` を設定します。OpenClaw は、ベアホストの先頭に `https://` を付けて正規化し、パスがすでにそこで終わっていない限り `/search` を追加します。解決されたエンドポイントは検索キャッシュキーに含まれるため、異なる Exa エンドポイントの結果は共有されません。

## ツールパラメーター

<ParamField path="query" type="string" required>
検索クエリ。
</ParamField>

<ParamField path="count" type="number">
返す結果数（1–100）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
検索モード。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
時間フィルター。
</ParamField>

<ParamField path="date_after" type="string">
この日付（`YYYY-MM-DD`）より後の結果。
</ParamField>

<ParamField path="date_before" type="string">
この日付（`YYYY-MM-DD`）より前の結果。
</ParamField>

<ParamField path="contents" type="object">
コンテンツ抽出オプション（以下を参照）。
</ParamField>

### コンテンツ抽出

Exa は、検索結果とともに抽出済みコンテンツを返せます。有効にするには `contents` オブジェクトを渡します。

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

| コンテンツオプション | 型                                                                    | 説明                           |
| -------------------- | --------------------------------------------------------------------- | ------------------------------ |
| `text`               | `boolean \| { maxCharacters }`                                        | ページ全文テキストを抽出する   |
| `highlights`         | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 重要な文を抽出する             |
| `summary`            | `boolean \| { query }`                                                | AI 生成の要約                  |

### 検索モード

| モード           | 説明                                      |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa が最適なモードを選択する（デフォルト） |
| `neural`         | セマンティック/意味ベースの検索           |
| `fast`           | 高速なキーワード検索                      |
| `deep`           | 徹底的なディープ検索                      |
| `deep-reasoning` | 推論を伴うディープ検索                    |
| `instant`        | 最速の結果                                |

## 注記

- `contents` オプションが指定されていない場合、Exa はデフォルトで `{ highlights: true }` を使用するため、結果には重要な文の抜粋が含まれます
- 利用可能な場合、結果は Exa API レスポンスの `highlightScores` フィールドと `summary` フィールドを保持します
- 結果の説明は、ハイライト、要約、全文テキストの順に、利用可能なものから解決されます
- `freshness` と `date_after`/`date_before` は組み合わせられません。時間フィルターモードはどちらか一方を使用してください
- クエリごとに最大 100 件の結果を返せます（Exa 検索タイプの制限に従います）
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で構成可能）
- Exa は、構造化 JSON レスポンスを持つ公式 API 統合です

## 関連

- [Web Search の概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 国/言語フィルター付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
