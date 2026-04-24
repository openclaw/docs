---
read_when:
    - ローカルの SGLang サーバーに対して OpenClaw を実行したい場合
    - 自分のモデルで OpenAI 互換の /v1 endpoint を使いたい場合
summary: SGLang を使って OpenClaw を実行する（OpenAI 互換のセルフホストサーバー）
title: SGLang
x-i18n:
    generated_at: "2026-04-24T05:16:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 15
---

SGLang は、**OpenAI 互換** HTTP API を通じてオープンソースモデルを提供できます。
OpenClaw は `openai-completions` API を使って SGLang に接続できます。

`SGLANG_API_KEY` を使ってオプトインし、
明示的な `models.providers.sglang` エントリーを定義していない場合、OpenClaw は SGLang から利用可能なモデルを**自動検出**することもできます（サーバーが認証を強制しない場合は任意の値で動作します）。

OpenClaw は `sglang` を、ストリーミング使用量集計をサポートするローカルの OpenAI 互換 provider として扱うため、`stream_options.include_usage` 応答から status/context token 数を更新できます。

## はじめに

<Steps>
  <Step title="SGLang を起動する">
    OpenAI 互換 server として SGLang を起動します。base URL は
    `/v1` endpoint（たとえば `/v1/models`, `/v1/chat/completions`）を公開している必要があります。SGLang は通常次のように動作します。

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="API key を設定する">
    サーバー側で認証が設定されていない場合は任意の値で動作します。

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="オンボーディングを実行するか、モデルを直接設定する">
    ```bash
    openclaw onboard
    ```

    または、手動でモデルを設定します。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## モデル検出（暗黙 provider）

`SGLANG_API_KEY` が設定されている（または auth profile が存在する）状態で、
`models.providers.sglang` を**定義していない**場合、OpenClaw は次を問い合わせます。

- `GET http://127.0.0.1:30000/v1/models`

そして返された ID を model エントリーに変換します。

<Note>
`models.providers.sglang` を明示的に設定した場合、自動検出はスキップされ、
モデルは手動で定義しなければなりません。
</Note>

## 明示的設定（手動モデル）

次の場合は明示的 config を使ってください。

- SGLang が別ホスト/別ポートで動作している。
- `contextWindow`/`maxTokens` の値を固定したい。
- サーバーが実際の API key を必要とする（またはヘッダーを制御したい）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 高度な設定

<AccordionGroup>
  <Accordion title="proxy スタイル動作">
    SGLang は、ネイティブ OpenAI endpoint ではなく、
    proxy スタイルの OpenAI 互換 `/v1` backend として扱われます。

    | Behavior | SGLang |
    |----------|--------|
    | OpenAI 専用の request shaping | 適用されない |
    | `service_tier`, Responses `store`, prompt-cache ヒント | 送信されない |
    | reasoning 互換 payload shaping | 適用されない |
    | 隠し attribution header（`originator`, `version`, `User-Agent`） | custom SGLang base URL には注入されない |

  </Accordion>

  <Accordion title="トラブルシューティング">
    **server に到達できない**

    server が動作し、応答していることを確認してください。

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **auth エラー**

    request が auth エラーで失敗する場合は、server 設定に一致する実際の `SGLANG_API_KEY` を設定するか、
    `models.providers.sglang` 配下で provider を明示的に設定してください。

    <Tip>
    認証なしで SGLang を実行している場合、model 検出へのオプトインには
    `SGLANG_API_KEY` に空でない任意の値を入れれば十分です。
    </Tip>

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、フェイルオーバー動作の選び方。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    provider エントリーを含む完全な config schema。
  </Card>
</CardGroup>
