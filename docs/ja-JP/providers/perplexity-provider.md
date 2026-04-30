---
read_when:
    - Perplexity を Web 検索プロバイダーとして設定したい
    - Perplexity API キーまたは OpenRouter プロキシ設定が必要です
summary: Perplexity Web 検索プロバイダーのセットアップ（API キー、検索モード、フィルタリング）
title: Perplexity
x-i18n:
    generated_at: "2026-04-30T05:31:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Perplexity Plugin は、Perplexity Search API または OpenRouter 経由の Perplexity Sonar を通じて Web 検索機能を提供します。

<Note>
このページは Perplexity **provider** のセットアップです。Perplexity **tool**（エージェントでの使用方法）については、[Perplexity tool](/ja-JP/tools/perplexity-search) を参照してください。
</Note>

| プロパティ | 値 |
| ----------- | ---------------------------------------------------------------------- |
| 種類 | Web 検索プロバイダー（モデルプロバイダーではありません） |
| 認証 | `PERPLEXITY_API_KEY`（直接）または `OPENROUTER_API_KEY`（OpenRouter 経由） |
| 設定パス | `plugins.entries.perplexity.config.webSearch.apiKey` |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話型の Web 検索設定フローを実行します。

    ```bash
    openclaw configure --section web
    ```

    または、キーを直接設定します。

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="検索を開始する">
    キーが設定されると、エージェントは Web 検索に Perplexity を自動的に使用します。追加の手順は不要です。
  </Step>
</Steps>

## 検索モード

この Plugin は API キーのプレフィックスに基づいてトランスポートを自動選択します。

<Tabs>
  <Tab title="ネイティブ Perplexity API (pplx-)">
    キーが `pplx-` で始まる場合、OpenClaw はネイティブの Perplexity Search API を使用します。このトランスポートは構造化された結果を返し、ドメイン、言語、日付フィルターをサポートします（下記のフィルタリングオプションを参照）。
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    キーが `sk-or-` で始まる場合、OpenClaw は Perplexity Sonar モデルを使用して OpenRouter 経由でルーティングします。このトランスポートは引用付きの AI 合成回答を返します。
  </Tab>
</Tabs>

| キーのプレフィックス | トランスポート | 機能 |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-` | ネイティブ Perplexity Search API | 構造化された結果、ドメイン/言語/日付フィルター |
| `sk-or-` | OpenRouter (Sonar) | 引用付きの AI 合成回答 |

## ネイティブ API フィルタリング

<Note>
フィルタリングオプションは、ネイティブ Perplexity API（`pplx-` キー）を使用している場合にのみ利用できます。OpenRouter/Sonar 検索はこれらのパラメーターをサポートしていません。
</Note>

ネイティブ Perplexity API を使用する場合、検索では次のフィルターがサポートされます。

| フィルター | 説明 | 例 |
| -------------- | -------------------------------------- | ----------------------------------- |
| 国 | 2 文字の国コード | `us`, `de`, `jp` |
| 言語 | ISO 639-1 言語コード | `en`, `fr`, `zh` |
| 日付範囲 | 新しさの期間 | `day`, `week`, `month`, `year` |
| ドメインフィルター | 許可リストまたは拒否リスト（最大 20 ドメイン） | `example.com` |
| コンテンツ予算 | レスポンスごと / ページごとのトークン上限 | `max_tokens`, `max_tokens_per_page` |

## 高度な設定

<AccordionGroup>
  <Accordion title="デーモンプロセス用の環境変数">
    OpenClaw Gateway がデーモン（launchd/systemd）として実行される場合は、`PERPLEXITY_API_KEY` がそのプロセスで利用できることを確認してください。

    <Warning>
    `~/.profile` にのみ設定されたキーは、その環境が明示的にインポートされない限り、launchd/systemd デーモンからは見えません。Gateway プロセスが読み取れるように、キーを `~/.openclaw/.env` または `env.shellEnv` 経由で設定してください。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter プロキシのセットアップ">
    Perplexity 検索を OpenRouter 経由でルーティングしたい場合は、ネイティブの Perplexity キーではなく `OPENROUTER_API_KEY`（プレフィックス `sk-or-`）を設定します。OpenClaw はプレフィックスを検出し、自動的に Sonar トランスポートへ切り替えます。

    <Tip>
    OpenRouter トランスポートは、すでに OpenRouter アカウントを持っていて、複数プロバイダーにまたがる請求を一元化したい場合に便利です。
    </Tip>

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
