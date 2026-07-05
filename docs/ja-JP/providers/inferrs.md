---
read_when:
    - ローカルの inferrs サーバーに対して OpenClaw を実行したい
    - inferrs を通じて Gemma または別のモデルを提供しています
    - inferrs 用の正確な OpenClaw 互換フラグが必要です
summary: inferrs（OpenAI互換ローカルサーバー）経由でOpenClawを実行する
title: 推論
x-i18n:
    generated_at: "2026-07-05T11:44:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) は、OpenAI 互換の `/v1` API の背後でローカルモデルを提供します。OpenClaw は汎用の `openai-completions` アダプターを通じてこれと通信します。

| プロパティ       | 値                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| プロバイダー ID  | `inferrs` (カスタム。`models.providers.inferrs` 配下で設定)                    |
| Plugin           | なし — バンドルされた OpenClaw プロバイダー Plugin ではありません              |
| 認証環境変数     | 不要。inferrs サーバーに認証がなければ任意の値で動作します                     |
| API              | OpenAI 互換 (`openai-completions`)                                              |
| 推奨ベース URL   | `http://127.0.0.1:8080/v1` (または inferrs サーバーが待ち受ける任意の場所)     |

<Note>
  `inferrs` は専用の OpenClaw プロバイダー Plugin ではなく、カスタムのセルフホスト OpenAI 互換バックエンドです。オンボーディングの認証選択肢から選ぶのではなく、`models.providers.inferrs` 配下で設定します。自動検出付きのバンドル済み Plugin については、[SGLang](/ja-JP/providers/sglang) または [vLLM](/ja-JP/providers/vllm) を参照してください。
</Note>

## はじめに

<Steps>
  <Step title="モデル付きで inferrs を起動する">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="サーバーに到達できることを確認する">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="OpenClaw プロバイダーエントリを追加する">
    明示的なプロバイダーエントリを追加し、デフォルトモデルをそこに向けます。下の設定例を参照してください。
  </Step>
</Steps>

## 完全な設定例

ローカルの `inferrs` サーバー上の Gemma 4:

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

OpenClaw は、`inferrs/...` モデルが選択された場合にのみ `inferrs` 自体を起動できます。同じプロバイダーエントリに `localService` を追加します。

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

`command` は絶対パスである必要があります。Gateway ホストで `which inferrs` を実行し、そのパスを使用してください。完全なフィールドリファレンス: [ローカルモデルサービス](/ja-JP/gateway/local-model-services)。

## 高度な設定

<AccordionGroup>
  <Accordion title="requiresStringContent が重要な理由">
    一部の `inferrs` Chat Completions ルートは、構造化されたコンテンツパート配列ではなく、文字列の `messages[].content` のみを受け付けます。

    <Warning>
    OpenClaw の実行が次のエラーで失敗する場合:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    モデルエントリで `compat.requiresStringContent: true` を設定してください。OpenClaw はリクエスト送信前に、純粋なテキストコンテンツパートをプレーン文字列へフラット化します。
    </Warning>

  </Accordion>

  <Accordion title="Gemma とツールスキーマの注意点">
    一部の `inferrs` + Gemma の組み合わせでは、小さな直接 `/v1/chat/completions` リクエストは受け付けますが、完全な OpenClaw エージェントランタイムターンでは失敗します。まずツールスキーマサーフェスを無効にしてみてください。

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    これにより、より厳格なローカルバックエンドへのプロンプト負荷が下がります。小さな直接リクエストはまだ動作する一方で、通常の OpenClaw エージェントターンが `inferrs` 内部でクラッシュし続ける場合は、OpenClaw のトランスポート問題ではなく、上流のモデルまたはサーバーの制限として扱ってください。

  </Accordion>

  <Accordion title="手動スモークテスト">
    設定後、両方のレイヤーをテストします。

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

    最初のコマンドが動作し、2 つ目が失敗する場合は、下のトラブルシューティングを参照してください。

  </Accordion>

  <Accordion title="プロキシ形式の動作">
    `inferrs` は `openai-responses` ではなく汎用の `openai-completions` アダプターを使用するため、OpenAI ネイティブ専用のリクエスト整形は適用されません。`service_tier`、Responses の `store`、プロンプトキャッシュヒント、OpenAI 推論互換ペイロード整形はいずれも送信されません。
  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="curl /v1/models が失敗する">
    `inferrs` が実行されていない、到達できない、または設定したホスト/ポートにバインドされていません。サーバーが起動され、そのアドレスで待ち受けていることを確認してください。
  </Accordion>

  <Accordion title="messages[].content expected a string">
    モデルエントリで `compat.requiresStringContent: true` を設定してください (上記参照)。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 呼び出しは通るが openclaw infer model run が失敗する">
    ツールスキーマサーフェスを無効にするために `compat.supportsTools: false` を設定してください (上記の Gemma の注意点を参照)。
  </Accordion>

  <Accordion title="大きなエージェントターンで inferrs がまだクラッシュする">
    スキーマエラーがなくなっても、大きなエージェントターンで `inferrs` がまだクラッシュする場合は、上流の `inferrs` またはモデルの制限として扱ってください。プロンプト負荷を下げるか、バックエンド/モデルを切り替えてください。
  </Accordion>
</AccordionGroup>

<Tip>
一般的なヘルプについては、[トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    OpenClaw をローカルモデルサーバーに対して実行します。
  </Card>
  <Card title="ローカルモデルサービス" href="/ja-JP/gateway/local-model-services" icon="play">
    設定済みプロバイダー向けにローカルモデルサーバーをオンデマンドで起動します。
  </Card>
  <Card title="Gateway トラブルシューティング" href="/ja-JP/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    プローブは通るがエージェント実行に失敗するローカル OpenAI 互換バックエンドをデバッグします。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要です。
  </Card>
</CardGroup>
