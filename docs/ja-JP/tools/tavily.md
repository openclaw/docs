---
read_when:
    - Tavily によるウェブ検索を使いたい場合
    - Tavily API キーが必要です
    - Tavily を web_search プロバイダーとして使用したい場合
    - URL からのコンテンツ抽出が必要な場合
summary: Tavily の検索および抽出ツール
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:56:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) は、AIアプリケーション向けに設計された検索APIです。OpenClaw では、次の2つの方法で公開されています。

- 汎用検索ツールの `web_search` provider として
- 明示的な Plugin ツールとして: `tavily_search` と `tavily_extract`

Tavily は、設定可能な検索深度、トピックフィルタリング、ドメインフィルター、AI生成の回答要約、URLからのコンテンツ抽出（JavaScriptでレンダリングされるページを含む）を備えた、LLMでの利用に最適化された構造化結果を返します。

| プロパティ      | 値                               |
| ------------- | ----------------------------------- |
| Plugin ID     | `tavily`                            |
| 認証          | `TAVILY_API_KEY` または config `apiKey` |
| ベースURL      | `https://api.tavily.com` (デフォルト)  |
| 同梱ツール | `tavily_search`, `tavily_extract`   |

## はじめに

<Steps>
  <Step title="APIキーを取得する">
    [tavily.com](https://tavily.com) で Tavily アカウントを作成し、ダッシュボードでAPIキーを生成します。
  </Step>
  <Step title="Plugin と provider を設定する">
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
    任意の agent から `web_search` をトリガーするか、`tavily_search` を直接呼び出します。
  </Step>
</Steps>

<Tip>
オンボーディングまたは `openclaw configure --section web` で Tavily を選択すると、同梱の Tavily Plugin が自動的に有効になります。
</Tip>

## ツールリファレンス

### `tavily_search`

汎用の `web_search` ではなく、Tavily 固有の検索制御を使用したい場合に使います。

| パラメーター         | 型         | 制約 / デフォルト                  | 説明                                     |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | 文字列       | 必須                               | 検索クエリ文字列。400文字未満にしてください。 |
| `search_depth`    | 列挙型         | `basic` (デフォルト), `advanced`          | `advanced` は遅いものの、関連性が高くなります。      |
| `topic`           | 列挙型         | `general` (デフォルト), `news`, `finance` | トピックファミリーでフィルタリングします。                         |
| `max_results`     | 整数      | 1-20                                   | 結果の数。                              |
| `include_answer`  | 真偽値      | デフォルト `false`                        | Tavily のAI生成回答要約を含めます。   |
| `time_range`      | 列挙型         | `day`, `week`, `month`, `year`         | 新しさで結果をフィルタリングします。                      |
| `include_domains` | 文字列配列 | (なし)                                 | これらのドメインからの結果のみを含めます。        |
| `exclude_domains` | 文字列配列 | (なし)                                 | これらのドメインからの結果を除外します。             |

検索深度のトレードオフ:

| 深度      | 速度  | 関連性 | 最適な用途                             |
| ---------- | ------ | --------- | ------------------------------------ |
| `basic`    | 高速 | 高い      | 汎用クエリ (デフォルト)。   |
| `advanced` | 低速 | 最高   | 精密な調査と事実確認。 |

### `tavily_extract`

1つ以上のURLからクリーンなコンテンツを抽出するために使います。JavaScriptでレンダリングされるページに対応し、対象を絞った抽出のためにクエリ重視のチャンク化をサポートします。

| パラメーター           | 型         | 制約 / デフォルト         | 説明                                                 |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | 文字列配列 | 必須、1-20                | コンテンツ抽出元のURL。                               |
| `query`             | 文字列       | (任意)                    | 抽出されたチャンクをこのクエリとの関連性で再ランク付けします。         |
| `extract_depth`     | 列挙型         | `basic` (デフォルト), `advanced` | JSの多いページ、SPA、動的テーブルには `advanced` を使います。 |
| `chunks_per_source` | 整数      | 1-5; **`query` が必要**     | URLごとに返されるチャンク数。`query` なしで設定するとエラーになります。     |
| `include_images`    | 真偽値      | デフォルト `false`               | 結果に画像URLを含めます。                              |

抽出深度のトレードオフ:

| 深度      | 使用する場面                                |
| ---------- | ------------------------------------------ |
| `basic`    | 単純なページ。まずはこちらを試してください。              |
| `advanced` | JSでレンダリングされるSPA、動的コンテンツ、テーブル。 |

<Tip>
大きなURLリストは複数の `tavily_extract` 呼び出しに分割してください（1リクエストあたり最大20件）。ページ全体ではなく関連コンテンツのみを取得するには、`query` と `chunks_per_source` を併用します。
</Tip>

## 適切なツールの選択

| 必要なこと                                 | ツール             |
| ------------------------------------ | ---------------- |
| 特別なオプションなしのクイックWeb検索 | `web_search`     |
| 深度、トピック、AI回答を指定した検索 | `tavily_search`  |
| 特定URLからのコンテンツ抽出   | `tavily_extract` |

<Note>
Tavily を provider とする汎用 `web_search` ツールは、`query` と `count`（最大20件の結果）をサポートします。Tavily 固有の制御（`search_depth`、`topic`、`include_answer`、ドメインフィルター、時間範囲）には、代わりに `tavily_search` を使います。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="APIキーの解決順序">
    Tavily クライアントは、次の順序でAPIキーを検索します。

    1. `plugins.entries.tavily.config.webSearch.apiKey` (SecretRefs 経由で解決)。
    2. gateway 環境の `TAVILY_API_KEY`。

    どちらも存在しない場合、`tavily_extract` はセットアップエラーを発生させます。

  </Accordion>

  <Accordion title="カスタムベースURL">
    プロキシ経由で Tavily を利用する場合は、`plugins.entries.tavily.config.webSearch.baseUrl` を上書きします。デフォルトは `https://api.tavily.com` です。
  </Accordion>

  <Accordion title="`chunks_per_source` には `query` が必要">
    `tavily_extract` は、`query` なしで `chunks_per_source` を渡す呼び出しを拒否します。Tavily はクエリとの関連性でチャンクをランク付けするため、このパラメーターはクエリなしでは意味を持ちません。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Web Search の概要" href="/ja-JP/tools/web" icon="magnifying-glass">
    すべての provider と自動検出ルール。
  </Card>
  <Card title="Firecrawl" href="/ja-JP/tools/firecrawl" icon="fire">
    検索に加えてコンテンツ抽出付きのスクレイピング。
  </Card>
  <Card title="Exa Search" href="/ja-JP/tools/exa-search" icon="binoculars">
    コンテンツ抽出付きのニューラル検索。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    Plugin エントリとツールルーティングの完全な config スキーマ。
  </Card>
</CardGroup>
