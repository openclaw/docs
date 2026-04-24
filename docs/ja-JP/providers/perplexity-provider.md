---
read_when:
    - web search プロバイダーとして Perplexity を設定したい場合
    - Perplexity API キーまたは OpenRouter プロキシ設定が必要です
summary: Perplexity web search プロバイダーのセットアップ（API キー、検索モード、フィルタリング）
title: Perplexity
x-i18n:
    generated_at: "2026-04-24T05:16:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b2d3d6912bc9952bbe89124dd8aea600c938c8ceff21df46508b6e44e0a1159
    source_path: providers/perplexity-provider.md
    workflow: 15
---

# Perplexity（Web Search Provider）

Perplexity Plugin は、Perplexity
Search API または OpenRouter 経由の Perplexity Sonar を通じて web search 機能を提供します。

<Note>
このページでは Perplexity **provider** のセットアップを扱います。Perplexity
**tool**（エージェントがどう使うか）については、[Perplexity ツール](/ja-JP/tools/perplexity-search) を参照してください。
</Note>

| Property    | Value |
| ----------- | ---------------------------------------------------------------------- |
| Type        | Web search provider（model provider ではない） |
| Auth        | `PERPLEXITY_API_KEY`（直接）または `OPENROUTER_API_KEY`（OpenRouter 経由） |
| Config path | `plugins.entries.perplexity.config.webSearch.apiKey` |

## はじめに

<Steps>
  <Step title="API キーを設定する">
    対話型 web-search 設定フローを実行します:

    ```bash
    openclaw configure --section web
    ```

    またはキーを直接設定します:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="検索を開始する">
    キーが設定されると、エージェントは自動的に Perplexity を web search に使用します。
    追加の手順は不要です。
  </Step>
</Steps>

## 検索モード

この Plugin は、API キー prefix に基づいて transport を自動選択します。

<Tabs>
  <Tab title="ネイティブ Perplexity API（pplx-）">
    キーが `pplx-` で始まる場合、OpenClaw はネイティブ Perplexity Search
    API を使用します。この transport は構造化された結果を返し、ドメイン、
    言語、日付フィルターをサポートします（詳細は下の filtering option を参照）。
  </Tab>
  <Tab title="OpenRouter / Sonar（sk-or-）">
    キーが `sk-or-` で始まる場合、OpenClaw は
    Perplexity Sonar model を使って OpenRouter 経由でルーティングします。この transport は、引用付きの AI 合成回答を返します。
  </Tab>
</Tabs>

| Key prefix | Transport | Features |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | ネイティブ Perplexity Search API | 構造化結果、ドメイン/言語/日付フィルター |
| `sk-or-`   | OpenRouter（Sonar） | 引用付き AI 合成回答 |

## ネイティブ API フィルタリング

<Note>
filtering option は、ネイティブ Perplexity API
（`pplx-` キー）使用時のみ利用できます。OpenRouter/Sonar 検索ではこれらのパラメーターをサポートしません。
</Note>

ネイティブ Perplexity API を使用する場合、検索は次のフィルターをサポートします。

| Filter | Description | Example |
| -------------- | -------------------------------------- | ----------------------------------- |
| Country | 2 文字の国コード | `us`, `de`, `jp` |
| Language | ISO 639-1 言語コード | `en`, `fr`, `zh` |
| Date range | 鮮度ウィンドウ | `day`, `week`, `month`, `year` |
| Domain filters | allowlist または denylist（最大 20 ドメイン） | `example.com` |
| Content budget | 応答ごと / ページごとのトークン上限 | `max_tokens`, `max_tokens_per_page` |

## 高度な設定

<AccordionGroup>
  <Accordion title="daemon プロセス向け環境変数">
    OpenClaw Gateway が daemon（launchd/systemd）として動作している場合、
    `PERPLEXITY_API_KEY` がそのプロセスで利用可能であることを確認してください。

    <Warning>
    `~/.profile` にだけ設定されたキーは、その環境が明示的に import されない限り、
    launchd/systemd daemon からは見えません。Gateway プロセスが
    それを読めるようにするには、キーを `~/.openclaw/.env` または `env.shellEnv` に設定してください。
    </Warning>

  </Accordion>

  <Accordion title="OpenRouter プロキシセットアップ">
    Perplexity 検索を OpenRouter 経由でルーティングしたい場合は、
    ネイティブ Perplexity キーの代わりに `OPENROUTER_API_KEY`（prefix `sk-or-`）を設定します。
    OpenClaw は prefix を検出し、自動的に Sonar transport へ切り替えます。

    <Tip>
    OpenRouter transport は、すでに OpenRouter アカウントを持っていて、
    複数プロバイダーにまたがる課金を統合したい場合に便利です。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Perplexity search ツール" href="/ja-JP/tools/perplexity-search" icon="magnifying-glass">
    エージェントが Perplexity 検索をどう呼び出し、結果をどう解釈するか。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    Plugin entries を含む完全な設定リファレンス。
  </Card>
</CardGroup>
