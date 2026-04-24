---
read_when:
    - 多くの LLM に対して 1 つの API key を使いたい場合
    - OpenClaw で Kilo Gateway 経由でモデルを実行したい場合
summary: OpenClaw で Kilo Gateway の統一 API を使って多くのモデルにアクセスする
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T05:15:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway は、単一の
エンドポイントと API key の背後で多くのモデルへのリクエストをルーティングする **統一 API** を提供します。OpenAI 互換なので、多くの OpenAI SDK は base URL を切り替えるだけで使えます。

| Property | 値 |
| -------- | ---------------------------------- |
| Provider | `kilocode` |
| Auth | `KILOCODE_API_KEY` |
| API | OpenAI 互換 |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## はじめに

<Steps>
  <Step title="アカウントを作成する">
    [app.kilo.ai](https://app.kilo.ai) にアクセスし、サインインまたはアカウント作成した後、API Keys に移動して新しい key を生成します。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    または、環境変数を直接設定します。

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## デフォルトモデル

デフォルトモデルは `kilocode/kilo/auto` で、Kilo Gateway が管理する
provider 所有の smart-routing モデルです。

<Note>
OpenClaw は `kilocode/kilo/auto` を安定したデフォルト ref として扱いますが、そのルートに対する source-backed なタスク→上流モデルのマッピングは公開していません。`kilocode/kilo/auto` の背後にある正確な上流ルーティングは、OpenClaw にハードコードされているのではなく、Kilo Gateway が所有しています。
</Note>

## 組み込みカタログ

OpenClaw は、起動時に Kilo Gateway から利用可能なモデルを動的に検出します。アカウントで利用可能なモデルの完全な一覧を見るには
`/models kilocode` を使ってください。

gateway で利用可能な任意のモデルは、`kilocode/` prefix を付けて使えます。

| Model ref | 注記 |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto` | デフォルト — smart routing |
| `kilocode/anthropic/claude-sonnet-4` | Kilo 経由の Anthropic |
| `kilocode/openai/gpt-5.5` | Kilo 経由の OpenAI |
| `kilocode/google/gemini-3-pro-preview` | Kilo 経由の Google |
| ...and many more | 一覧表示には `/models kilocode` を使ってください |

<Tip>
起動時、OpenClaw は `GET https://api.kilo.ai/api/gateway/models` に問い合わせ、
検出したモデルを静的フォールバックカタログより優先してマージします。同梱のフォールバックには常に
`kilocode/kilo/auto`（`Kilo Auto`）が含まれ、`input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000` が設定されています。
</Tip>

## config 例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="トランスポートと互換性">
    Kilo Gateway は source 内で OpenRouter 互換として文書化されているため、
    ネイティブ OpenAI リクエスト整形ではなく、proxy スタイルの OpenAI 互換パスに留まります。

    - Gemini ベースの Kilo ref は proxy-Gemini パスに留まるため、OpenClaw は
      そこで Gemini の thought-signature sanitation を維持しつつ、ネイティブ Gemini の
      replay validation や bootstrap 書き換えは有効にしません。
    - Kilo Gateway は内部的に、API key を使った Bearer token を使用します。

  </Accordion>

  <Accordion title="ストリームラッパーと reasoning">
    Kilo の共有ストリームラッパーは、サポートされる具体的 model ref に対して、
    provider app header を追加し、proxy reasoning payload を正規化します。

    <Warning>
    `kilocode/kilo/auto` や、その他の proxy-reasoning をサポートしない hint では、reasoning
    注入はスキップされます。reasoning サポートが必要な場合は、
    `kilocode/anthropic/claude-sonnet-4` のような具体的 model ref を使ってください。
    </Warning>

  </Accordion>

  <Accordion title="トラブルシューティング">
    - 起動時にモデル検出が失敗した場合、OpenClaw は `kilocode/kilo/auto` を含む同梱の静的カタログにフォールバックします。
    - API key が有効であり、Kilo アカウントで目的のモデルが有効になっていることを確認してください。
    - Gateway が daemon として動作している場合、そのプロセスから `KILOCODE_API_KEY` が利用可能であることを確認してください（たとえば `~/.openclaw/.env` または `env.shellEnv` 経由）。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    完全な OpenClaw 設定リファレンス。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway ダッシュボード、API keys、アカウント管理。
  </Card>
</CardGroup>
