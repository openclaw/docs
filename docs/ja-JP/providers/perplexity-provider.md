---
read_when:
    - Perplexity をウェブ検索プロバイダーとして設定したい場合
    - Perplexity API キーまたは OpenRouter プロキシのセットアップが必要です
summary: Perplexity Web検索プロバイダーの設定（APIキー、検索モード、フィルタリング）
title: Perplexity
x-i18n:
    generated_at: "2026-07-11T22:38:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin は、2 つのトランスポートを持つ `web_search` プロバイダーを登録します。ネイティブの Perplexity Search API（フィルター付きの構造化された結果）と、Perplexity Sonar チャット補完（直接または OpenRouter 経由で利用する、引用付きの AI 合成回答）です。

<Note>
このページでは、Perplexity **プロバイダー**の設定について説明します。Perplexity **ツール**（エージェントが使用する方法）については、[Perplexity 検索](/ja-JP/tools/perplexity-search)を参照してください。
</Note>

| プロパティ  | 値                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 種類        | Web 検索プロバイダー（モデルプロバイダーではありません）              |
| 認証        | `PERPLEXITY_API_KEY`（ネイティブ）または `OPENROUTER_API_KEY`（OpenRouter 経由） |
| 設定パス    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| 上書き設定  | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| キーの取得  | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## Plugin のインストール

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="API キーを設定する">
    ```bash
    openclaw configure --section web
    ```

    または、キーを直接設定します。

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    Gateway 環境で `PERPLEXITY_API_KEY` または `OPENROUTER_API_KEY` として
    エクスポートされたキーも使用できます。

  </Step>
  <Step title="検索を開始する">
    `web_search` は、そのキーが利用可能な検索認証情報になると Perplexity を
    自動検出します。追加の設定は不要です。プロバイダーを明示的に固定するには、
    次のように設定します。

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## 検索モード

Plugin は、次の順序でトランスポートを決定します。

1. `webSearch.baseUrl` または `webSearch.model` が設定されている場合、キーの種類にかかわらず、常にそのエンドポイントに対する Sonar チャット補完を経由します。
2. それ以外の場合は、キーの取得元によってエンドポイントが決まります。設定済みキーではプレフィックスによってトランスポートが選択され（設定は環境変数より優先されます）、環境変数のキーでは対応するエンドポイントが直接使用されます。

| キーのプレフィックス | トランスポート                                           | 機能                                           |
| -------------------- | -------------------------------------------------------- | ---------------------------------------------- |
| `pplx-`              | ネイティブ Perplexity Search API（`https://api.perplexity.ai`） | 構造化された結果、ドメイン／言語／日付フィルター |
| `sk-or-`             | OpenRouter（`https://openrouter.ai/api/v1`）、Sonar モデル | 引用付きの AI 合成回答                         |

それ以外のプレフィックスを持つ設定済みキーも、ネイティブの Search API を使用します。
チャット補完経路では、デフォルトで `perplexity/sonar-pro` モデルが使用されます。
`plugins.entries.perplexity.config.webSearch.model` で上書きできます。

## ネイティブ API のフィルタリング

| フィルター                           | 説明                                                            | トランスポート       |
| ------------------------------------ | --------------------------------------------------------------- | -------------------- |
| `count`                              | 検索ごとの結果数、1～10（デフォルトは 5）                       | ネイティブのみ       |
| `freshness`                          | 新しさの期間：`day`、`week`、`month`、`year`                    | 両方                 |
| `country`                            | 2 文字の国コード（`us`、`de`、`jp`）                            | ネイティブのみ       |
| `language`                           | ISO 639-1 言語コード（`en`、`fr`、`zh`）                        | ネイティブのみ       |
| `date_after` / `date_before`         | `YYYY-MM-DD` 形式の公開日範囲                                   | ネイティブのみ       |
| `domain_filter`                      | 最大 20 ドメイン。許可リストまたは `-` プレフィックス付き拒否リスト。混在は不可 | ネイティブのみ |
| `max_tokens` / `max_tokens_per_page` | 全結果を通じたコンテンツ上限／ページごとのコンテンツ上限       | ネイティブのみ       |

ネイティブ専用フィルターをチャット補完経路で使用すると、内容を説明するエラーが返されます。
`freshness` を `date_after`／`date_before` と組み合わせることはできません。

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    <Warning>
    対話型シェルでのみエクスポートされたキーは、その環境が明示的に
    インポートされない限り、launchd/systemd の Gateway デーモンからは参照できません。
    Gateway プロセスが読み取れるように、キーを `~/.openclaw/.env` または
    `env.shellEnv` で設定してください。完全な優先順位については、
    [環境変数](/ja-JP/help/environment)を参照してください。
    </Warning>
  </Accordion>

  <Accordion title="OpenRouter プロキシの設定">
    Perplexity 検索を OpenRouter 経由でルーティングするには、ネイティブの
    Perplexity キーの代わりに `OPENROUTER_API_KEY`（プレフィックスは `sk-or-`）を
    設定します。OpenClaw はキーを検出し、自動的に Sonar トランスポートへ切り替えます。
    OpenRouter の課金設定がすでにあり、プロバイダーをそこに集約したい場合に便利です。
  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="Perplexity 検索ツール" href="/ja-JP/tools/perplexity-search" icon="magnifying-glass">
    エージェントが Perplexity 検索を呼び出し、結果を解釈する方法。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    Plugin エントリを含む完全な設定リファレンス。
  </Card>
</CardGroup>
