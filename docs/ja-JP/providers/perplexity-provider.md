---
read_when:
    - Perplexity を Web 検索プロバイダーとして設定したい
    - Perplexity API キーまたは OpenRouter プロキシ設定が必要です
summary: Perplexity Web 検索プロバイダーのセットアップ（API キー、検索モード、フィルタリング）
title: Perplexity
x-i18n:
    generated_at: "2026-07-05T11:41:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin は、2 つのトランスポートを持つ `web_search` プロバイダーを登録します:
ネイティブの Perplexity Search API（フィルター付きの構造化された結果）と Perplexity
Sonar chat completions（直接、または OpenRouter 経由。引用付きの AI 合成回答）。

<Note>
このページでは Perplexity **プロバイダー** の設定について説明します。Perplexity **ツール**（エージェントがそれをどう使うか）については、[Perplexity 検索](/ja-JP/tools/perplexity-search)を参照してください。
</Note>

| プロパティ    | 値                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| 種類        | Web 検索プロバイダー（モデルプロバイダーではありません）                             |
| 認証        | `PERPLEXITY_API_KEY`（ネイティブ）または `OPENROUTER_API_KEY`（OpenRouter 経由） |
| 設定パス | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| オーバーライド   | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| キーを取得   | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## Plugin をインストール

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを設定">
    ```bash
    openclaw configure --section web
    ```

    または、キーを直接設定します:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Gateway 環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` としてエクスポートされたキーも使用できます。

  </Step>
  <Step title="検索を開始">
    `web_search` は、そのキーが利用可能な検索認証情報になると Perplexity を自動検出します。追加の設定は不要です。プロバイダーを明示的に固定するには:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## 検索モード

Plugin は次の順序でトランスポートを解決します:

1. `webSearch.baseUrl` または `webSearch.model` が設定されている場合: キーの種類に関係なく、常にそのエンドポイントに対する Sonar chat completions 経由でルーティングします。
2. それ以外の場合、キーのソースがエンドポイントを決定します: 設定済みキーのプレフィックスがトランスポートを選択します（設定は環境変数より優先されます）。環境キーは対応するエンドポイントを直接使用します。

| キープレフィックス | トランスポート                                                  | 機能                                         |
| ---------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `pplx-`    | ネイティブ Perplexity Search API (`https://api.perplexity.ai`) | 構造化された結果、ドメイン/言語/日付フィルター |
| `sk-or-`   | OpenRouter (`https://openrouter.ai/api/v1`)、Sonar モデル   | 引用付きの AI 合成回答            |

その他のプレフィックスを持つ設定済みキーも、ネイティブ Search API を使用します。
chat-completions パスはデフォルトで `perplexity/sonar-pro` モデルを使用します。`plugins.entries.perplexity.config.webSearch.model` でオーバーライドできます。

## ネイティブ API フィルタリング

| フィルター                               | 説明                                                     | トランスポート   |
| ------------------------------------ | --------------------------------------------------------------- | ----------- |
| `count`                              | 検索ごとの結果数、1-10（デフォルト 5）                            | ネイティブのみ |
| `freshness`                          | 新しさの期間: `day`、`week`、`month`、`year`                  | 両方        |
| `country`                            | 2 文字の国コード（`us`、`de`、`jp`）                        | ネイティブのみ |
| `language`                           | ISO 639-1 言語コード（`en`、`fr`、`zh`）                      | ネイティブのみ |
| `date_after` / `date_before`         | `YYYY-MM-DD` 形式の公開日範囲                            | ネイティブのみ |
| `domain_filter`                      | 最大 20 ドメイン。許可リストまたは `-` 接頭辞の拒否リストで、混在不可 | ネイティブのみ |
| `max_tokens` / `max_tokens_per_page` | すべての結果全体 / ページごとのコンテンツ予算                    | ネイティブのみ |

ネイティブ専用フィルターは、chat-completions パスでは説明的なエラーを返します。
`freshness` は `date_after`/`date_before` と組み合わせることはできません。

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    <Warning>
    インタラクティブシェルだけでエクスポートされたキーは、その環境が明示的にインポートされていない限り、
    launchd/systemd Gateway デーモンからは見えません。Gateway プロセスが読み取れるように、キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。完全な優先順位については、[環境変数](/ja-JP/help/environment)を参照してください。
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter プロキシ設定">
    Perplexity 検索を OpenRouter 経由でルーティングするには、ネイティブの Perplexity キーではなく `OPENROUTER_API_KEY`
    （プレフィックス `sk-or-`）を設定します。OpenClaw はキーを検出し、Sonar トランスポートに自動的に切り替えます。すでに
    OpenRouter の課金設定があり、プロバイダーをそこに集約したい場合に便利です。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Perplexity 検索ツール" href="/ja-JP/tools/perplexity-search" icon="magnifying-glass">
    エージェントが Perplexity 検索を呼び出し、結果を解釈する方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    Plugin エントリを含む完全な設定リファレンス。
  </Card>
</CardGroup>
