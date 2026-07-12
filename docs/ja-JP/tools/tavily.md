---
read_when:
    - Tavily を利用したウェブ検索を使用したい場合
    - Tavily APIキーが必要です
    - Tavily を web_search プロバイダーとして使用する場合
    - URL からコンテンツを抽出したい場合
summary: Tavily の検索・抽出ツール
title: Tavily
x-i18n:
    generated_at: "2026-07-11T22:46:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) は、AI アプリケーション向けに設計された検索 API です。OpenClaw では、次の 2 つの方法で利用できます。

- 汎用検索ツールの `web_search` プロバイダーとして
- 明示的な Plugin ツールとして：`tavily_search` および `tavily_extract`

Tavily は、LLM での利用に最適化された構造化結果を返します。検索深度、トピックフィルタリング、ドメインフィルター、AI 生成の回答要約、URL（JavaScript でレンダリングされるページを含む）からのコンテンツ抽出を設定できます。

| プロパティ  | 値                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------- |
| Plugin ID | `tavily`                                                                                            |
| パッケージ   | `@openclaw/tavily-plugin`                                                                           |
| 認証        | 環境変数 `TAVILY_API_KEY` または設定の `apiKey`                                                           |
| ベース URL  | `https://api.tavily.com`（デフォルト）。上書きするには環境変数 `TAVILY_BASE_URL` または設定の `baseUrl` を使用 |
| タイムアウト | 検索は 30 秒、抽出は 60 秒（デフォルト）                                                                   |
| ツール      | `tavily_search`、`tavily_extract`                                                                    |

## はじめに

<Steps>
  <Step title="Plugin をインストールする">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="API キーを取得する">
    [tavily.com](https://tavily.com) で Tavily アカウントを作成し、ダッシュボードで API キーを生成します。
  </Step>
  <Step title="Plugin とプロバイダーを設定する">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // TAVILY_API_KEY が設定されている場合は省略可能
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
  </Step>
  <Step title="検索が実行されることを確認する">
    任意のエージェントから `web_search` を実行するか、`tavily_search` を直接呼び出します。
  </Step>
</Steps>

<Tip>
オンボーディングまたは `openclaw configure --section web` で Tavily を選択すると、必要に応じて公式 Tavily Plugin がインストールされ、有効化されます。
</Tip>

## ツールリファレンス

### `tavily_search`

汎用の `web_search` ではなく、Tavily 固有の検索制御を使用する場合に利用します。

| パラメーター         | 型           | 制約／デフォルト                         | 説明                                      |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------- |
| `query`           | 文字列        | 必須                                    | 検索クエリ文字列。                            |
| `search_depth`    | 列挙型        | `basic`（デフォルト）、`advanced`          | `advanced` は低速ですが、関連性が高くなります。 |
| `topic`           | 列挙型        | `general`（デフォルト）、`news`、`finance` | トピックの種類でフィルタリングします。            |
| `max_results`     | 整数          | 1～20、デフォルトは `5`                    | 結果の件数。                                 |
| `include_answer`  | 真偽値        | デフォルトは `false`                      | Tavily が AI で生成した回答要約を含めます。      |
| `time_range`      | 列挙型        | `day`、`week`、`month`、`year`            | 結果を新しさでフィルタリングします。              |
| `include_domains` | 文字列の配列   | （なし）                                  | 指定したドメインの結果のみを含めます。             |
| `exclude_domains` | 文字列の配列   | （なし）                                  | 指定したドメインの結果を除外します。               |

検索深度のトレードオフ：

| 深度        | 速度   | 関連性 | 最適な用途                             |
| ---------- | ------ | ------ | ------------------------------------ |
| `basic`    | 高速   | 高い    | 汎用クエリ（デフォルト）。               |
| `advanced` | 低速   | 最高    | 精密な調査と事実確認。                    |

### `tavily_extract`

1 つ以上の URL から整形されたコンテンツを抽出する場合に利用します。JavaScript でレンダリングされるページを処理でき、対象を絞った抽出のためにクエリに基づくチャンク分割をサポートします。

| パラメーター           | 型           | 制約／デフォルト                    | 説明                                                                  |
| ------------------- | ------------ | --------------------------------- | --------------------------------------------------------------------- |
| `urls`              | 文字列の配列   | 必須、1～20                        | コンテンツの抽出元となる URL。                                            |
| `query`             | 文字列        | （省略可能）                         | 抽出されたチャンクを、このクエリとの関連性に基づいて再順位付けします。                |
| `extract_depth`     | 列挙型        | `basic`（デフォルト）、`advanced`     | JS を多用するページ、SPA、動的テーブルには `advanced` を使用します。               |
| `chunks_per_source` | 整数          | 1～5。**`query` が必須**             | URL ごとに返すチャンク数。`query` なしで設定するとエラーになります。                 |
| `include_images`    | 真偽値        | デフォルトは `false`                 | 結果に画像 URL を含めます。                                                |

抽出深度のトレードオフ：

| 深度        | 使用する場面                                  |
| ---------- | ------------------------------------------ |
| `basic`    | 単純なページ。最初にこちらを試してください。       |
| `advanced` | JS でレンダリングされる SPA、動的コンテンツ、表。 |

<Tip>
多数の URL は、複数回の `tavily_extract` 呼び出しに分割してください（1 リクエストあたり最大 20 件）。ページ全体ではなく関連するコンテンツだけを取得するには、`query` と `chunks_per_source` を組み合わせて使用します。
</Tip>

## 適切なツールの選択

| 用途                                     | ツール            |
| --------------------------------------- | ---------------- |
| 特別なオプションを使わない簡易ウェブ検索      | `web_search`     |
| 深度、トピック、AI 回答を指定した検索          | `tavily_search`  |
| 特定の URL からのコンテンツ抽出              | `tavily_extract` |

<Note>
Tavily をプロバイダーとして使用する汎用 `web_search` ツールは、`query` と `count`（最大 20 件）をサポートします。Tavily 固有の制御（`search_depth`、`topic`、`include_answer`、ドメインフィルター、期間範囲）を使用する場合は、代わりに `tavily_search` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="API キーの解決順序">
    Tavily クライアントは、次の順序で API キーを検索します。

    1. `plugins.entries.tavily.config.webSearch.apiKey`（SecretRefs を通じて解決）。
    2. Gateway 環境の `TAVILY_API_KEY`。

    どちらも存在しない場合、`tavily_search` と `tavily_extract` はどちらもセットアップエラーを発生させます。

  </Accordion>

  <Accordion title="カスタムベース URL">
    プロキシ経由で Tavily を利用する場合は、`plugins.entries.tavily.config.webSearch.baseUrl` を上書きするか、`TAVILY_BASE_URL` を設定します。設定値は環境変数より優先されます。デフォルトは `https://api.tavily.com` です。
  </Accordion>

  <Accordion title="`chunks_per_source` には `query` が必要">
    `tavily_extract` は、`query` なしで `chunks_per_source` を渡す呼び出しを拒否します。Tavily はクエリとの関連性に基づいてチャンクを順位付けするため、クエリがなければこのパラメーターに意味はありません。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="ウェブ検索の概要" href="/ja-JP/tools/web" icon="magnifying-glass">
    すべてのプロバイダーと自動検出ルール。
  </Card>
  <Card title="Firecrawl" href="/ja-JP/tools/firecrawl" icon="fire">
    コンテンツ抽出を伴う検索とスクレイピング。
  </Card>
  <Card title="Exa Search" href="/ja-JP/tools/exa-search" icon="binoculars">
    コンテンツ抽出を伴うニューラル検索。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    Plugin エントリとツールルーティングの完全な設定スキーマ。
  </Card>
</CardGroup>
