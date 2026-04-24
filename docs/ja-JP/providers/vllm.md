---
read_when:
    - ローカル vLLM サーバーに対して OpenClaw を実行したい場合
    - 自分のモデルで OpenAI 互換 `/v1` エンドポイントを使いたい場合
summary: vLLM（OpenAI 互換ローカルサーバー）で OpenClaw を実行する
title: vLLM
x-i18n:
    generated_at: "2026-04-24T05:17:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0296422a926c83b1ab5ffdac7857e34253b624f0d8756c02d49f8805869a219
    source_path: providers/vllm.md
    workflow: 15
---

vLLM は、**OpenAI 互換** HTTP API 経由でオープンソース（および一部のカスタム）モデルを提供できます。OpenClaw は `openai-completions` API を使って vLLM に接続します。

また、`VLLM_API_KEY` を設定して明示的な `models.providers.vllm` エントリーを定義していない場合、OpenClaw は vLLM 上で利用可能なモデルを**自動 discovery** できます（サーバーが認証を強制しないなら値は何でも構いません）。

OpenClaw は `vllm` を、ストリーミング使用量会計をサポートするローカル OpenAI 互換プロバイダーとして扱うため、status/context token 数は `stream_options.include_usage` 応答から更新できます。

| プロパティ         | 値                                       |
| ------------------ | ---------------------------------------- |
| Provider ID        | `vllm`                                   |
| API                | `openai-completions`（OpenAI 互換）      |
| Auth               | `VLLM_API_KEY` 環境変数                  |
| デフォルト base URL | `http://127.0.0.1:8000/v1`               |

## はじめに

<Steps>
  <Step title="OpenAI 互換サーバーとして vLLM を起動する">
    base URL は `/v1` エンドポイント（例: `/v1/models`, `/v1/chat/completions`）を公開している必要があります。vLLM は通常次のように動作します。

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API キー環境変数を設定する">
    サーバーが認証を強制しない場合、値は何でも構いません。

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="モデルを選ぶ">
    あなたの vLLM モデル ID のいずれかに置き換えてください。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="モデルが利用可能か確認する">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## モデル discovery（暗黙 provider）

`VLLM_API_KEY` が設定されている（または auth profile が存在する）状態で、**`models.providers.vllm` を定義していない**場合、OpenClaw は次を問い合わせます。

```
GET http://127.0.0.1:8000/v1/models
```

そして返された ID をモデルエントリーに変換します。

<Note>
`models.providers.vllm` を明示的に設定した場合、自動 discovery はスキップされ、モデルを手動で定義する必要があります。
</Note>

## 明示的設定（手動モデル）

明示的 config を使うべき場合:

- vLLM が別ホストまたは別 port で動作している
- `contextWindow` や `maxTokens` の値を pin したい
- サーバーが実際の API キーを要求する（またはヘッダーを自分で制御したい）

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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
  <Accordion title="Proxy 風動作">
    vLLM は、ネイティブ
    OpenAI エンドポイントではなく、proxy 風の OpenAI 互換 `/v1` backend として扱われます。これは次を意味します。

    | 動作 | 適用されるか |
    |------|-------------|
    | ネイティブ OpenAI リクエスト整形 | いいえ |
    | `service_tier` | 送信されない |
    | Responses `store` | 送信されない |
    | プロンプトキャッシュヒント | 送信されない |
    | OpenAI reasoning 互換ペイロード整形 | 適用されない |
    | 隠れた OpenClaw attribution ヘッダー | カスタム base URL では注入されない |

  </Accordion>

  <Accordion title="カスタム base URL">
    vLLM サーバーがデフォルト以外のホストまたは port で動作している場合は、明示的 provider config 内で `baseUrl` を設定してください。

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="サーバーに到達できない">
    vLLM サーバーが起動していてアクセス可能か確認してください。

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    接続エラーが出る場合は、ホスト、port、および vLLM が OpenAI 互換サーバーモードで起動していることを確認してください。

  </Accordion>

  <Accordion title="リクエストで auth エラーが出る">
    リクエストが auth エラーで失敗する場合は、サーバー設定に一致する実際の `VLLM_API_KEY` を設定するか、`models.providers.vllm` 配下で provider を明示的に設定してください。

    <Tip>
    vLLM サーバーが auth を強制しない場合、`VLLM_API_KEY` には空でない任意の値を設定すれば、OpenClaw に対するオプトインシグナルとして機能します。
    </Tip>

  </Accordion>

  <Accordion title="モデルが検出されない">
    自動 discovery には `VLLM_API_KEY` が設定されていること、**かつ** 明示的な `models.providers.vllm` config エントリーが存在しないことが必要です。provider を手動定義している場合、OpenClaw は discovery をスキップし、宣言したモデルだけを使います。
  </Accordion>
</AccordionGroup>

<Warning>
さらにヘルプが必要な場合: [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq) を参照してください。
</Warning>

## 関連

<CardGroup cols={2}>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー、model ref、failover 動作の選び方。
  </Card>
  <Card title="OpenAI" href="/ja-JP/providers/openai" icon="bolt">
    ネイティブ OpenAI provider と OpenAI 互換ルートの動作。
  </Card>
  <Card title="OAuth and auth" href="/ja-JP/gateway/authentication" icon="key">
    Auth の詳細と認証情報再利用ルール。
  </Card>
  <Card title="Troubleshooting" href="/ja-JP/help/troubleshooting" icon="wrench">
    よくある問題と解決方法。
  </Card>
</CardGroup>
