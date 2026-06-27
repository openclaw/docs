---
read_when:
    - Exa を web_search に使用したい
    - EXA_API_KEY が必要です
    - ニューラル検索またはコンテンツ抽出が必要な場合
summary: Exa AI 検索 -- コンテンツ抽出付きのニューラル検索とキーワード検索
title: Exa 検索
x-i18n:
    generated_at: "2026-06-27T13:11:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw は `web_search` プロバイダーとして [Exa AI](https://exa.ai/) をサポートしています。Exa は、組み込みのコンテンツ抽出（ハイライト、テキスト、要約）を備えたニューラル、キーワード、ハイブリッド検索モードを提供します。

## Plugin をインストール

公式 Plugin をインストールしてから、Gateway を再起動します。

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## API キーを取得

<Steps>
  <Step title="アカウントを作成">
    [exa.ai](https://exa.ai/) でサインアップし、ダッシュボードから API キーを生成します。
  </Step>
  <Step title="キーを保存">
    Gateway 環境に `EXA_API_KEY` を設定するか、次で構成します。

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

**環境変数の代替:** Gateway 環境に `EXA_API_KEY` を設定します。
Gateway インストールの場合は、`~/.openclaw/.env` に配置します。

## ベース URL の上書き

Exa 検索リクエストを互換プロキシまたは代替 Exa エンドポイント経由にする必要がある場合は、`plugins.entries.exa.config.webSearch.baseUrl` を設定します。OpenClaw はベアホストの先頭に `https://` を付けて正規化し、パスがすでにそこで終わっていない限り `/search` を追加します。解決済みエンドポイントは検索キャッシュキーに含まれるため、異なる Exa エンドポイントからの結果は共有されません。

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
この日付より後の結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
この日付より前の結果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
コンテンツ抽出オプション（下記参照）。
</ParamField>

### コンテンツ抽出

Exa は、検索結果とあわせて抽出済みコンテンツを返すことができます。有効にするには `contents` オブジェクトを渡します。

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

| Contents オプション | 型                                                                    | 説明                         |
| --------------- | --------------------------------------------------------------------- | ---------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | ページ全文テキストを抽出 |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 重要な文を抽出  |
| `summary`       | `boolean \| { query }`                                                | AI 生成の要約   |

### 検索モード

| モード             | 説明                       |
| ---------------- | --------------------------------- |
| `auto`           | Exa が最適なモードを選択（デフォルト） |
| `neural`         | セマンティック/意味ベースの検索     |
| `fast`           | 高速なキーワード検索              |
| `deep`           | 詳細な深掘り検索              |
| `deep-reasoning` | 推論を伴う深掘り検索        |
| `instant`        | 最速の結果                   |

## 注記

- `contents` オプションが指定されていない場合、Exa はデフォルトで `{ highlights: true }` を使用するため、結果には重要な文の抜粋が含まれます
- 利用可能な場合、結果は Exa API レスポンスの `highlightScores` フィールドと `summary` フィールドを保持します
- 結果の説明は、ハイライト、要約、全文テキストの順に、利用可能なものから解決されます
- `freshness` と `date_after`/`date_before` は併用できません。時間フィルターモードはどちらか一方を使用してください
- クエリごとに最大 100 件の結果を返せます（Exa 検索タイプの制限に依存）
- 結果はデフォルトで 15 分間キャッシュされます（`cacheTtlMinutes` で構成可能）
- Exa は構造化 JSON レスポンスを備えた公式 API 統合です

## 関連

- [Web Search 概要](/ja-JP/tools/web) -- すべてのプロバイダーと自動検出
- [Brave Search](/ja-JP/tools/brave-search) -- 国/言語フィルター付きの構造化結果
- [Perplexity Search](/ja-JP/tools/perplexity-search) -- ドメインフィルタリング付きの構造化結果
