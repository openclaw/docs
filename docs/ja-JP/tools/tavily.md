---
read_when:
    - Tavily を利用した Web 検索が必要な場合
    - Tavily API キーが必要です
    - Tavily を web_search プロバイダーとして使いたい
    - URL からのコンテンツ抽出が必要な場合
summary: Tavily 検索と抽出ツール
title: Tavily
x-i18n:
    generated_at: "2026-06-27T13:19:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) は AI アプリケーション向けに設計された検索 API です。OpenClaw はこれを 2 つの方法で公開します。

- 汎用検索ツールの `web_search` プロバイダーとして
- 明示的な Plugin ツールとして: `tavily_search` と `tavily_extract`

Tavily は、設定可能な検索深度、トピックフィルタリング、ドメインフィルター、AI 生成の回答要約、URL からのコンテンツ抽出（JavaScript でレンダリングされたページを含む）を備え、LLM での利用に最適化された構造化結果を返します。

| プロパティ | 値                                  |
| --------- | ----------------------------------- |
| Plugin ID | `tavily`                            |
| パッケージ | `@openclaw/tavily-plugin`           |
| 認証      | `TAVILY_API_KEY` または config `apiKey` |
| ベース URL | `https://api.tavily.com`（デフォルト） |
| ツール    | `tavily_search`, `tavily_extract`   |

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
オンボーディングまたは `openclaw configure --section web` で Tavily を選択すると、必要に応じて公式 Tavily Plugin がインストールされ、有効化されます。
</Tip>

## ツールリファレンス

### `tavily_search`

汎用の `web_search` ではなく Tavily 固有の検索コントロールを使いたい場合に使用します。

| パラメーター       | 型           | 制約 / デフォルト                    | 説明                                           |
| ----------------- | ------------ | -------------------------------------- | ---------------------------------------------- |
| `query`           | string       | 必須                                  | 検索クエリ文字列。400 文字未満にしてください。 |
| `search_depth`    | enum         | `basic`（デフォルト）, `advanced`     | `advanced` は遅くなりますが、関連性が高くなります。 |
| `topic`           | enum         | `general`（デフォルト）, `news`, `finance` | トピックファミリーでフィルタリングします。     |
| `max_results`     | integer      | 1-20                                   | 結果の数。                                     |
| `include_answer`  | boolean      | デフォルト `false`                    | Tavily の AI 生成回答要約を含めます。          |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | 新しさで結果をフィルタリングします。           |
| `include_domains` | string array | （なし）                              | これらのドメインからの結果のみを含めます。     |
| `exclude_domains` | string array | （なし）                              | これらのドメインからの結果を除外します。       |

検索深度のトレードオフ:

| 深度       | 速度   | 関連性 | 最適な用途                           |
| ---------- | ------ | ------ | ------------------------------------ |
| `basic`    | 高速   | 高い   | 汎用クエリ（デフォルト）。           |
| `advanced` | 低速   | 最高   | 精密な調査と事実確認。               |

### `tavily_extract`

1 つ以上の URL からクリーンなコンテンツを抽出するために使用します。JavaScript でレンダリングされたページを扱い、対象を絞った抽出のためのクエリ重視のチャンク化をサポートします。

| パラメーター         | 型           | 制約 / デフォルト           | 説明                                                   |
| ------------------- | ------------ | --------------------------- | ------------------------------------------------------ |
| `urls`              | string array | 必須, 1-20                  | コンテンツを抽出する URL。                            |
| `query`             | string       | （任意）                    | 抽出したチャンクをこのクエリへの関連性で再ランクします。 |
| `extract_depth`     | enum         | `basic`（デフォルト）, `advanced` | JS が多いページ、SPA、または動的テーブルには `advanced` を使用します。 |
| `chunks_per_source` | integer      | 1-5; **`query` が必要**     | URL ごとに返されるチャンク数。`query` なしで設定するとエラーになります。 |
| `include_images`    | boolean      | デフォルト `false`          | 結果に画像 URL を含めます。                            |

抽出深度のトレードオフ:

| 深度       | 使用する場面                                 |
| ---------- | -------------------------------------------- |
| `basic`    | シンプルなページ。まずこれを試してください。 |
| `advanced` | JS でレンダリングされた SPA、動的コンテンツ、テーブル。 |

<Tip>
大きな URL リストは複数の `tavily_extract` 呼び出しに分割してください（リクエストあたり最大 20 件）。ページ全体ではなく関連コンテンツだけを取得するには、`query` と `chunks_per_source` を併用します。
</Tip>

## 適切なツールを選ぶ

| ニーズ                               | ツール           |
| ------------------------------------ | ---------------- |
| 特別なオプションなしのクイック Web 検索 | `web_search`     |
| 深度、トピック、AI 回答付きの検索     | `tavily_search`  |
| 特定の URL からコンテンツを抽出する   | `tavily_extract` |

<Note>
Tavily をプロバイダーとして使う汎用 `web_search` ツールは、`query` と `count`（最大 20 件の結果）をサポートします。Tavily 固有のコントロール（`search_depth`、`topic`、`include_answer`、ドメインフィルター、期間範囲）には、代わりに `tavily_search` を使用してください。
</Note>

## 高度な設定

<AccordionGroup>
  <Accordion title="API キーの解決順序">
    Tavily クライアントは次の順序で API キーを検索します。

    1. `plugins.entries.tavily.config.webSearch.apiKey`（SecretRefs 経由で解決）。
    2. Gateway 環境の `TAVILY_API_KEY`。

    どちらも存在しない場合、`tavily_extract` はセットアップエラーを発生させます。

  </Accordion>

  <Accordion title="カスタムベース URL">
    Tavily をプロキシ経由で前段に置く場合は、`plugins.entries.tavily.config.webSearch.baseUrl` を上書きします。デフォルトは `https://api.tavily.com` です。
  </Accordion>

  <Accordion title="`chunks_per_source` には `query` が必要">
    `tavily_extract` は、`query` なしで `chunks_per_source` を渡す呼び出しを拒否します。Tavily はクエリへの関連性でチャンクをランク付けするため、このパラメーターはクエリなしでは意味がありません。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Web Search の概要" href="/ja-JP/tools/web" icon="magnifying-glass">
    すべてのプロバイダーと自動検出ルール。
  </Card>
  <Card title="Firecrawl" href="/ja-JP/tools/firecrawl" icon="fire">
    検索に加えて、コンテンツ抽出付きのスクレイピング。
  </Card>
  <Card title="Exa Search" href="/ja-JP/tools/exa-search" icon="binoculars">
    コンテンツ抽出付きのニューラル検索。
  </Card>
  <Card title="設定" href="/ja-JP/gateway/configuration" icon="gear">
    Plugin エントリーとツールルーティングの完全な config スキーマ。
  </Card>
</CardGroup>
