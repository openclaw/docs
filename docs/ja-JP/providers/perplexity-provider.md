---
read_when:
    - Perplexity を Web 検索プロバイダーとして構成したい
    - Perplexity API キーまたは OpenRouter プロキシ設定が必要です
summary: Perplexity Web 検索プロバイダーのセットアップ（API キー、検索モード、フィルタリング）
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T12:48:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Pluginは、Perplexity Search APIまたはOpenRouter経由のPerplexity Sonarを通じてWeb検索機能を提供します。

<Note>
このページはPerplexity **プロバイダー**のセットアップです。Perplexity **ツール**（エージェントがそれをどう使うか）については、[Perplexityツール](/ja-JP/tools/perplexity-search)を参照してください。
</Note>

| プロパティ | 値                                                                     |
| ----------- | ---------------------------------------------------------------------- |
| 種類        | Web検索プロバイダー（モデルプロバイダーではない）                     |
| 認証        | `PERPLEXITY_API_KEY`（直接）または`OPENROUTER_API_KEY`（OpenRouter経由） |
| 設定パス    | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## Pluginをインストール

公式Pluginをインストールしてから、Gatewayを再起動します。

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## はじめに

<Steps>
  <Step title="Set the API key">
    インタラクティブなWeb検索設定フローを実行します。

    ```bash
    openclaw configure --section web
    ```

    または、キーを直接設定します。

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="Start searching">
    キーが設定されると、エージェントはWeb検索にPerplexityを自動的に使用します。
    追加の手順は不要です。
  </Step>
</Steps>

## 検索モード

PluginはAPIキーのプレフィックスに基づいてトランスポートを自動選択します。

<Tabs>
  <Tab title="Native Perplexity API (pplx-)">
    キーが`pplx-`で始まる場合、OpenClawはネイティブのPerplexity Search
    APIを使用します。このトランスポートは構造化された結果を返し、ドメイン、言語、
    日付フィルターをサポートします（下記のフィルタリングオプションを参照）。
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    キーが`sk-or-`で始まる場合、OpenClawはPerplexity Sonarモデルを使用して
    OpenRouter経由でルーティングします。このトランスポートは引用付きのAI合成回答を返します。
  </Tab>
</Tabs>

| キープレフィックス | トランスポート              | 機能                                             |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | ネイティブPerplexity Search API | 構造化された結果、ドメイン/言語/日付フィルター |
| `sk-or-`   | OpenRouter（Sonar）          | 引用付きのAI合成回答                            |

## ネイティブAPIのフィルタリング

<Note>
フィルタリングオプションは、ネイティブのPerplexity API（`pplx-`キー）を使用する場合にのみ利用できます。
OpenRouter/Sonar検索はこれらのパラメーターをサポートしていません。
</Note>

ネイティブのPerplexity APIを使用する場合、検索では次のフィルターがサポートされます。

| フィルター     | 説明                                   | 例                                  |
| -------------- | -------------------------------------- | ----------------------------------- |
| 国             | 2文字の国コード                        | `us`, `de`, `jp`                    |
| 言語           | ISO 639-1言語コード                    | `en`, `fr`, `zh`                    |
| 日付範囲       | 新しさの期間                           | `day`, `week`, `month`, `year`      |
| ドメインフィルター | 許可リストまたは拒否リスト（最大20ドメイン） | `example.com`                       |
| コンテンツ予算 | レスポンスごと/ページごとのトークン制限 | `max_tokens`, `max_tokens_per_page` |

## 高度な設定

<AccordionGroup>
  <Accordion title="Environment variable for daemon processes">
    OpenClaw Gatewayをデーモン（launchd/systemd）として実行する場合は、
    `PERPLEXITY_API_KEY`をそのプロセスで利用できるようにしてください。

    <Warning>
    インタラクティブシェルでのみエクスポートされたキーは、その環境が明示的にインポートされない限り、
    launchd/systemdデーモンからは見えません。Gatewayプロセスがキーを読み取れるようにするには、
    `~/.openclaw/.env`または`env.shellEnv`でキーを設定してください。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter proxy setup">
    Perplexity検索をOpenRouter経由でルーティングしたい場合は、ネイティブのPerplexityキーの代わりに
    `OPENROUTER_API_KEY`（プレフィックス`sk-or-`）を設定します。
    OpenClawはプレフィックスを検出し、自動的にSonarトランスポートへ切り替えます。

    <Tip>
    OpenRouterトランスポートは、すでにOpenRouterアカウントを持っていて、
    複数のプロバイダーにまたがる請求を統合したい場合に便利です。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Perplexity search tool" href="/ja-JP/tools/perplexity-search" icon="magnifying-glass">
    エージェントがPerplexity検索を呼び出し、結果を解釈する方法。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    Pluginエントリを含む完全な設定リファレンス。
  </Card>
</CardGroup>
