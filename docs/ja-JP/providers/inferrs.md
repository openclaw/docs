---
read_when:
    - ローカルの inferrs サーバーに対して OpenClaw を実行したい場合
    - inferrs を介して Gemma または別のモデルを提供している場合
    - inferrs 用の正確な OpenClaw 互換性フラグが必要です
summary: inferrs（OpenAI互換のローカルサーバー）経由でOpenClawを実行する
title: 推論する
x-i18n:
    generated_at: "2026-07-11T22:35:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) は、OpenAI 互換の `/v1` API を介してローカルモデルを提供します。OpenClaw は汎用の `openai-completions` アダプターを介して通信します。

| プロパティ         | 値                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| プロバイダー ID    | `inferrs`（カスタム。`models.providers.inferrs` で設定）             |
| Plugin             | なし — OpenClaw に同梱されたプロバイダー Plugin ではありません      |
| 認証環境変数       | 不要。inferrs サーバーで認証を使用しない場合は任意の値で動作します   |
| API                | OpenAI 互換（`openai-completions`）                                  |
| 推奨ベース URL     | `http://127.0.0.1:8080/v1`（または inferrs サーバーの待受先）        |

<Note>
  `inferrs` はカスタムのセルフホスト型 OpenAI 互換バックエンドであり、OpenClaw 専用のプロバイダー Plugin ではありません。オンボーディングで認証方法を選択するのではなく、`models.providers.inferrs` で設定します。自動検出機能を備えた同梱 Plugin については、[SGLang](/ja-JP/providers/sglang) または [vLLM](/ja-JP/providers/vllm) を参照してください。
</Note>

## はじめに

<Steps>
  <Step title="モデルを指定して inferrs を起動する">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="サーバーに接続できることを確認する">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="OpenClaw のプロバイダーエントリを追加する">
    明示的なプロバイダーエントリを追加し、デフォルトモデルがそれを参照するようにします。以下の設定例を参照してください。
  </Step>
</Steps>

## 完全な設定例

ローカルの `inferrs` サーバー上で Gemma 4 を使用する場合：

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## オンデマンド起動

OpenClaw は、`inferrs/...` モデルが選択された場合に限り、`inferrs` を自動的に起動できます。同じプロバイダーエントリに `localService` を追加します。

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` には絶対パスを指定する必要があります。Gateway ホストで `which inferrs` を実行し、表示されたパスを使用してください。すべてのフィールドのリファレンスについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services)を参照してください。

## 高度な設定

<AccordionGroup>
  <Accordion title="requiresStringContent が重要な理由">
    `inferrs` の Chat Completions ルートの中には、構造化されたコンテンツパーツの配列ではなく、文字列形式の `messages[].content` のみを受け付けるものがあります。

    <Warning>
    OpenClaw の実行が次のエラーで失敗する場合：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    モデルエントリで `compat.requiresStringContent: true` を設定してください。これにより OpenClaw は、リクエストを送信する前にテキストのみのコンテンツパーツをプレーンな文字列へ変換します。
    </Warning>

  </Accordion>

  <Accordion title="Gemma とツールスキーマに関する注意事項">
    `inferrs` と Gemma の組み合わせによっては、小規模な直接 `/v1/chat/completions` リクエストは受け付けても、OpenClaw エージェントランタイムの完全なターンでは失敗することがあります。まず、ツールスキーマの送信を無効にしてみてください。

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    これにより、制約の厳しいローカルバックエンドにかかるプロンプトの負荷が軽減されます。小規模な直接リクエストは引き続き動作するものの、通常の OpenClaw エージェントターンが `inferrs` 内で繰り返しクラッシュする場合は、OpenClaw の通信処理の問題ではなく、上流のモデルまたはサーバーの制限として扱ってください。

  </Accordion>

  <Accordion title="手動スモークテスト">
    設定後に、両方のレイヤーを一度テストします。

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    最初のコマンドが動作し、2 番目が失敗する場合は、以下のトラブルシューティングを参照してください。

  </Accordion>

  <Accordion title="プロキシ形式の動作">
    `inferrs` は `openai-responses` ではなく汎用の `openai-completions` アダプターを使用するため、OpenAI ネイティブ専用のリクエスト整形は一切適用されません。`service_tier`、Responses の `store`、プロンプトキャッシュのヒント、OpenAI の推論互換ペイロード整形はいずれも送信されません。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="curl /v1/models が失敗する">
    `inferrs` が実行されていない、接続できない、または設定したホストとポートで待ち受けていません。サーバーが起動済みで、そのアドレスを待ち受けていることを確認してください。
  </Accordion>

  <Accordion title="messages[].content に文字列が必要と表示される">
    モデルエントリで `compat.requiresStringContent: true` を設定してください（上記参照）。
  </Accordion>

  <Accordion title="直接の /v1/chat/completions 呼び出しは成功するが openclaw infer model run は失敗する">
    `compat.supportsTools: false` を設定して、ツールスキーマの送信を無効にしてください（上記の Gemma に関する注意事項を参照）。
  </Accordion>

  <Accordion title="大規模なエージェントターンで inferrs が引き続きクラッシュする">
    スキーマエラーが解消された後も、規模の大きいエージェントターンで `inferrs` がクラッシュする場合は、上流の `inferrs` またはモデルの制限として扱ってください。プロンプトの負荷を軽減するか、バックエンドまたはモデルを切り替えてください。
  </Accordion>
</AccordionGroup>

<Tip>
一般的なヘルプについては、[トラブルシューティング](/ja-JP/help/troubleshooting)と[よくある質問](/ja-JP/help/faq)を参照してください。
</Tip>

## 関連項目

<CardGroup cols={2}>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    OpenClaw をローカルモデルサーバーに接続して実行する方法。
  </Card>
  <Card title="ローカルモデルサービス" href="/ja-JP/gateway/local-model-services" icon="play">
    設定済みプロバイダー向けに、ローカルモデルサーバーをオンデマンドで起動する方法。
  </Card>
  <Card title="Gateway のトラブルシューティング" href="/ja-JP/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    プローブには成功するものの、エージェント実行では失敗するローカルの OpenAI 互換バックエンドをデバッグする方法。
  </Card>
  <Card title="モデルの選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
</CardGroup>
