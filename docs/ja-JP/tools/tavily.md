---
read_when:
    - Tavily backed の Web 検索を使いたい
    - Tavily API キーが必要です
    - Tavily を `web_search` プロバイダーとして使いたい場合
    - URL からのコンテンツ抽出が必要な場合
summary: Tavily 検索および抽出ツール
title: Tavily
x-i18n:
    generated_at: "2026-07-05T11:55:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) は AI アプリケーション向けに設計された検索 API です。OpenClaw はこれを 2 つの方法で公開します。

- 汎用検索ツールの `web_search` プロバイダーとして
- 明示的なプラグインツールとして: `tavily_search` と `tavily_extract`

Tavily は、LLM での利用に最適化された構造化結果を返します。検索深度、トピックフィルタリング、ドメインフィルター、AI 生成の回答要約、URL からのコンテンツ抽出（JavaScript レンダリングページを含む）を設定できます。

| プロパティ | 値                                                                                         |
| --------- | --------------------------------------------------------------------------------------------- |
| Plugin ID | `tavily`                                                                                      |
| パッケージ | `@openclaw/tavily-plugin`                                                                     |
| 認証      | `TAVILY_API_KEY` env var または config `apiKey`                                                   |
| ベース URL | `https://api.tavily.com`（デフォルト）; 上書きするには `TAVILY_BASE_URL` env var または config `baseUrl` |
| タイムアウト | 30s search、60s extract（デフォルト）                                                             |
| ツール     | `tavily_search`, `tavily_extract`                                                             |

## はじめに

<Steps>
  <Step title="プラグインをインストールする">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="API キーを取得する">
    [tavily.com](https://tavily.com) で Tavily アカウントを作成し、ダッシュボードで API キーを生成します。
  </Step>
  <Step title="プラグインとプロバイダーを設定する">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
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
    任意のエージェントから `web_search` をトリガーするか、`tavily_search` を直接呼び出します。
  </Step>
</Steps>

<Tip>
オンボーディングまたは `openclaw configure --section web` で Tavily を選ぶと、必要に応じて公式 Tavily プラグインがインストールされ、有効化されます。
</Tip>

## ツールリファレンス

### `tavily_search`

汎用の `web_search` ではなく、Tavily 固有の検索制御を使いたい場合に使用します。

| パラメーター      | 型           | 制約 / デフォルト                  | 説明                                   |
| ----------------- | ------------ | -------------------------------------- | --------------------------------------------- |
| `query`           | string       | 必須                               | 検索クエリ文字列。                          |
| `search_depth`    | enum         | `basic`（デフォルト）, `advanced`          | `advanced` は遅くなりますが関連性が高くなります。    |
| `topic`           | enum         | `general`（デフォルト）, `news`, `finance` | トピックファミリーでフィルタリングします。                       |
| `max_results`     | integer      | 1-20、デフォルト `5`                      | 結果の件数。                            |
| `include_answer`  | boolean      | デフォルト `false`                        | Tavily AI 生成の回答要約を含めます。 |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | 新しさで結果をフィルタリングします。                    |
| `include_domains` | string array | （なし）                                 | これらのドメインからの結果のみを含めます。      |
| `exclude_domains` | string array | （なし）                                 | これらのドメインからの結果を除外します。           |

検索深度のトレードオフ:

| 深度       | 速度  | 関連性 | 最適な用途                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | 高速 | 高い      | 汎用クエリ（デフォルト）。   |
| `advanced` | 低速 | 最高   | 精密な調査と事実確認。 |

### `tavily_extract`

1 つ以上の URL からクリーンなコンテンツを抽出するために使用します。JavaScript レンダリングページを処理でき、対象を絞った抽出向けにクエリ重視のチャンク化をサポートします。

| パラメーター        | 型           | 制約 / デフォルト         | 説明                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | 必須、1-20                | コンテンツを抽出する URL。                               |
| `query`             | string       | （任意）                    | このクエリとの関連性で抽出チャンクを再ランキングします。         |
| `extract_depth`     | enum         | `basic`（デフォルト）, `advanced` | JS の多いページ、SPA、動的テーブルには `advanced` を使用します。 |
| `chunks_per_source` | integer      | 1-5; **`query` が必要**     | URL ごとに返すチャンク数。`query` なしで設定するとエラーになります。     |
| `include_images`    | boolean      | デフォルト `false`               | 結果に画像 URL を含めます。                              |

抽出深度のトレードオフ:

| 深度       | 使用する場面                                |
| ---------- | ------------------------------------------ |
| `basic`    | シンプルなページ。まずはこちらを試してください。              |
| `advanced` | JS レンダリング SPA、動的コンテンツ、テーブル。 |

<Tip>
大きな URL リストは複数の `tavily_extract` 呼び出しに分割してください（1 リクエストあたり最大 20 件）。ページ全体ではなく関連コンテンツのみを取得するには、`query` と `chunks_per_source` を併用します。
</Tip>

## 適切なツールの選択

| ニーズ                               | ツール             |
| ------------------------------------ | ---------------- |
| クイックな Web 検索、特別なオプションなし | `web_search`     |
| 深度、トピック、AI 回答付きの検索 | `tavily_search`  |
| 特定の URL からコンテンツを抽出   | `tavily_extract` |

<Note>
プロバイダーとして Tavily を使う汎用 `web_search` ツールは、`query` と `count`（最大 20 件の結果）をサポートします。Tavily 固有の制御（`search_depth`, `topic`, `include_answer`, ドメインフィルター、期間範囲）には、代わりに `tavily_search` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="API キー解決順序">
    Tavily クライアントは、次の順序で API キーを検索します。

    1. `plugins.entries.tavily.config.webSearch.apiKey`（SecretRefs 経由で解決）。
    2. Gateway 環境の `TAVILY_API_KEY`。

    どちらも存在しない場合、`tavily_search` と `tavily_extract` はどちらもセットアップエラーを発生させます。

  </Accordion>

  <Accordion title="カスタムベース URL">
    Tavily をプロキシ経由で利用する場合は、`plugins.entries.tavily.config.webSearch.baseUrl` を上書きするか、`TAVILY_BASE_URL` を設定します。config は env var より優先されます。デフォルトは `https://api.tavily.com` です。
  </Accordion>

  <Accordion title="`chunks_per_source` には `query` が必要">
    `tavily_extract` は、`query` なしで `chunks_per_source` を渡す呼び出しを拒否します。Tavily はクエリ関連性でチャンクをランキングするため、クエリがない場合このパラメーターに意味はありません。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Web Search の概要" href="/ja-JP/tools/web" icon="magnifying-glass">
    すべてのプロバイダーと自動検出ルール。
  </Card>
  <Card title="Firecrawl" href="/ja-JP/tools/firecrawl" icon="fire">
    コンテンツ抽出付きの検索とスクレイピング。
  </Card>
  <Card title="Exa Search" href="/ja-JP/tools/exa-search" icon="binoculars">
    コンテンツ抽出付きのニューラル検索。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    プラグインエントリーとツールルーティングの完全な config スキーマ。
  </Card>
</CardGroup>
