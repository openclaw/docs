---
read_when:
    - OpenClaw を antirez/ds4 に対して実行したい
    - local DeepSeek V4 Flash バックエンドでツール呼び出しを使いたい
    - OpenClaw の ds4-server 用設定が必要です
summary: ds4（ローカルの DeepSeek V4 Flash OpenAI 互換サーバー）経由で OpenClaw を実行する
title: ds4
x-i18n:
    generated_at: "2026-07-05T11:43:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be449813295648694625ef8003b3f4b12903535b74816916ca5af0695174fbf4
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) は、OpenAI 互換の `/v1` API を備えたローカルの Metal バックエンドから DeepSeek V4 Flash を提供します。OpenClaw は汎用の `openai-completions` プロバイダーファミリーを通じて ds4 に接続します。

ds4 は OpenClaw にバンドルされたプロバイダー Plugin ではありません。`models.providers.ds4` の下で設定し、`ds4/deepseek-v4-flash` を選択します。

| プロパティ | 値                                                        |
| ----------- | --------------------------------------------------------- |
| プロバイダー id | `ds4`                                                     |
| Plugin      | なし（設定のみ）                                        |
| API         | OpenAI 互換 Chat Completions (`openai-completions`) |
| ベース URL    | `http://127.0.0.1:18000/v1`（推奨）                   |
| モデル id    | `deepseek-v4-flash`                                       |
| ツール呼び出し  | OpenAI 形式の `tools` / `tool_calls`                       |
| Reasoning   | DeepSeek 形式の `thinking` と `reasoning_effort`          |

## 要件

- Metal をサポートする macOS。
- `ds4-server` と DeepSeek V4 Flash GGUF ファイルを含む、動作する ds4 チェックアウト。
- 選択するコンテキストに十分なメモリ。`--ctx` の値を大きくすると、サーバー起動時により多くの KV メモリが割り当てられます。

<Warning>
OpenClaw のエージェントターンには、ツールスキーマとワークスペースコンテキストが含まれます。`--ctx 4096` のような小さなコンテキストでは、直接の curl テストは通っても、完全なエージェント実行では `500 prompt exceeds context` で失敗することがあります。エージェントとツールのスモークテストには、少なくとも `--ctx 32768` を使用してください。`--ctx 393216` は、十分なメモリがあり ds4 Think Max を有効にする場合にのみ使用してください。
</Warning>

## クイックスタート

<Steps>
  <Step title="ds4-server を起動する">
    `<DS4_DIR>` を ds4 チェックアウトのパスに置き換えます。

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="OpenAI 互換エンドポイントを確認する">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    レスポンスに `deepseek-v4-flash` が含まれているはずです。

  </Step>
  <Step title="OpenClaw プロバイダー設定を追加する">
    [完全な設定](#full-config) の設定を追加し、次にワンショットのモデルチェックを実行します。

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## 完全な設定

ds4 がすでに `127.0.0.1:18000` で実行されている場合は、この設定を使用します。

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`contextWindow` は `ds4-server --ctx` と一致させてください。サーバーのデフォルトより少ない出力を OpenClaw に要求させたい場合を除き、`maxTokens` は `--tokens` と一致させてください。

## オンデマンド起動

OpenClaw は `ds4/...` モデルが選択された場合にのみ ds4 を起動できます。同じプロバイダーエントリに `localService` を追加します。

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` は実行可能ファイルの絶対パスである必要があります。シェルの検索と `~` 展開は使用されません。すべての `localService` フィールドについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。

## Think Max

ds4 は、次の両方が true の場合にのみ Think Max を適用します。

- `ds4-server` が `--ctx 393216` 以上で起動されている。
- リクエストで `reasoning_effort: "max"`（または同等の ds4 effort フィールド）を使用している。

その大きなコンテキストで実行する場合は、サーバーフラグと OpenClaw モデルメタデータの両方を更新します。

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## テスト

OpenClaw をバイパスする直接 HTTP チェック:

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

OpenClaw モデルルーティング（クイックスタートのチェックと同じ）:

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

32768 以上のコンテキストを使用した、完全なエージェントとツール呼び出しのスモークテスト:

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

期待される結果:

- `executionTrace.winnerProvider` は `ds4`
- `executionTrace.winnerModel` は `deepseek-v4-flash`
- `toolSummary.calls` は少なくとも `1`
- `finalAssistantVisibleText` は `tool-ok` で始まる

## トラブルシューティング

<AccordionGroup>
  <Accordion title="curl /v1/models が接続できない">
    ds4 が実行されていないか、`baseUrl` のホスト/ポートにバインドされていません。`ds4-server` を起動してから再試行してください。

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    設定された `--ctx` は OpenClaw ターンには小さすぎます。`ds4-server --ctx` を増やし、`models.providers.ds4.models[].contextWindow` も一致するように更新してください。ツールを含む完全なエージェントターンには、直接の 1 メッセージ curl リクエストよりも大幅に多くのコンテキストが必要です。
  </Accordion>

  <Accordion title="Think Max が有効にならない">
    ds4 が Think Max を使用するのは、`--ctx` が少なくとも `393216` で、リクエストが `reasoning_effort: "max"` を要求する場合のみです。より小さいコンテキストでは high reasoning にフォールバックします。
  </Accordion>

  <Accordion title="最初のリクエストが遅い">
    ds4 には、コールド状態の Metal 常駐とモデルウォームアップのフェーズがあります。OpenClaw がオンデマンドでサーバーを起動する場合は、`localService.readyTimeoutMs: 300000` を設定してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="ローカルモデルサービス" href="/ja-JP/gateway/local-model-services" icon="play">
    モデルリクエストの前に、ローカルモデルサーバーをオンデマンドで起動します。
  </Card>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルバックエンドを選択して運用します。
  </Card>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー ref、認証、フェイルオーバーを設定します。
  </Card>
  <Card title="DeepSeek" href="/ja-JP/providers/deepseek" icon="brain">
    ネイティブ DeepSeek プロバイダーの動作と思考制御。
  </Card>
</CardGroup>
