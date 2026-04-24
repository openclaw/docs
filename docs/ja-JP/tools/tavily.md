---
read_when:
    - Tavily を使った Web 検索をしたい場合
    - Tavily API key が必要な場合
    - '`web_search` provider として Tavily を使いたい場合'
    - URL からコンテンツを抽出したい場合
summary: Tavily の検索ツールと抽出ツール
title: Tavily
x-i18n:
    generated_at: "2026-04-24T05:26:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af858cd8507e3ebe6614f0695f568ce589798c816c8475685526422a048ef1a
    source_path: tools/tavily.md
    workflow: 15
---

OpenClaw は **Tavily** を 2 つの方法で使えます。

- `web_search` provider として
- 明示的な Plugin tool として: `tavily_search` と `tavily_extract`

Tavily は AI アプリケーション向けに設計された検索 API で、
LLM が扱いやすいよう最適化された構造化結果を返します。設定可能な検索深度、
トピックフィルタリング、ドメインフィルター、AI 生成の回答要約、URL からのコンテンツ抽出
（JavaScript レンダリングされたページを含む）をサポートします。

## API key を取得する

1. [tavily.com](https://tavily.com/) で Tavily アカウントを作成します。
2. ダッシュボードで API key を生成します。
3. config に保存するか、gateway 環境で `TAVILY_API_KEY` を設定します。

## Tavily 検索を設定する

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // TAVILY_API_KEY が設定されていれば任意
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

注:

- オンボーディングまたは `openclaw configure --section web` で Tavily を選ぶと、
  bundled Tavily Plugin が自動的に有効になります。
- Tavily config は `plugins.entries.tavily.config.webSearch.*` 配下に保存してください。
- Tavily を使う `web_search` は `query` と `count`（最大 20 件）をサポートします。
- `search_depth`、`topic`、`include_answer`、
  ドメインフィルターのような Tavily 固有制御には `tavily_search` を使ってください。

## Tavily Plugin tools

### `tavily_search`

汎用 `web_search` ではなく Tavily 固有の検索制御を使いたい場合に使います。

| Parameter         | 説明                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `query`           | 検索 query 文字列（400 文字未満を推奨）                              |
| `search_depth`    | `basic`（デフォルト、バランス型）または `advanced`（最高関連性、低速） |
| `topic`           | `general`（デフォルト）、`news`（リアルタイム更新）、または `finance` |
| `max_results`     | 結果件数、1-20（デフォルト: 5）                                      |
| `include_answer`  | AI 生成の回答要約を含める（デフォルト: false）                       |
| `time_range`      | 新しさでフィルタ: `day`、`week`、`month`、`year`                     |
| `include_domains` | 結果を制限するドメインの配列                                         |
| `exclude_domains` | 結果から除外するドメインの配列                                       |

**検索深度:**

| Depth      | 速度   | 関連性 | 向いている用途                        |
| ---------- | ------ | ------ | ------------------------------------- |
| `basic`    | 高速   | 高い   | 汎用クエリ（デフォルト）              |
| `advanced` | 低速   | 最高   | 精度重視、具体的事実、調査            |

### `tavily_extract`

1 つ以上の URL からクリーンなコンテンツを抽出するにはこれを使います。
JavaScript レンダリングページを処理し、対象を絞った
抽出のための query ベース chunking もサポートします。

| Parameter           | 説明                                                        |
| ------------------- | ----------------------------------------------------------- |
| `urls`              | 抽出する URL の配列（1 リクエストあたり 1-20 件）           |
| `query`             | この query への関連性で抽出 chunk を再ランクする            |
| `extract_depth`     | `basic`（デフォルト、高速）または `advanced`（JS の多いページ向け） |
| `chunks_per_source` | URL ごとの chunk 数、1-5（`query` が必要）                  |
| `include_images`    | 結果に画像 URL を含める（デフォルト: false）                |

**抽出深度:**

| Depth      | 使うタイミング                              |
| ---------- | ------------------------------------------- |
| `basic`    | シンプルなページ - まずはこちらを試す       |
| `advanced` | JS レンダリング SPA、動的コンテンツ、表     |

ヒント:

- 1 リクエストあたり最大 20 URL です。より多い場合は複数回に分けてください。
- 全ページではなく関連コンテンツだけ欲しい場合は、`query` + `chunks_per_source` を使ってください。
- まず `basic` を試し、コンテンツが欠けているか不完全なら `advanced` にフォールバックしてください。

## 適切な tool を選ぶ

| 必要なこと                           | Tool             |
| ------------------------------------ | ---------------- |
| 手早い Web 検索、特別なオプション不要 | `web_search`     |
| 深度、トピック、AI 回答付きの検索     | `tavily_search`  |
| 特定 URL からのコンテンツ抽出         | `tavily_extract` |

## 関連

- [Web Search overview](/ja-JP/tools/web) -- すべての provider と自動検出
- [Firecrawl](/ja-JP/tools/firecrawl) -- コンテンツ抽出付きの検索 + scraping
- [Exa Search](/ja-JP/tools/exa-search) -- コンテンツ抽出付き neural search
