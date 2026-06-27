---
read_when:
    - antirez/ds4 に対して OpenClaw を実行したい場合
    - local DeepSeek V4 Flash バックエンドでツール呼び出しを使いたい
    - ds4-server 用の OpenClaw 設定が必要です
summary: ds4（ローカルの DeepSeek V4 Flash OpenAI 互換サーバー）経由で OpenClaw を実行する
title: ds4
x-i18n:
    generated_at: "2026-06-27T12:42:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9922421d39f5d2d29dfa62de9fc3de7131dfa96445d0646cd02ad766a125544
    source_path: providers/ds4.md
    workflow: 16
---

[ds4](https://github.com/antirez/ds4) は、ローカルの Metal バックエンドから、OpenAI 互換の `/v1` API で DeepSeek V4 Flash を提供します。OpenClaw は汎用の `openai-completions` プロバイダーファミリーを通じて ds4 に接続します。

ds4 は OpenClaw に同梱されるプロバイダー Plugin ではありません。
`models.providers.ds4` の下で構成し、`ds4/deepseek-v4-flash` を選択します。

- プロバイダー ID: `ds4`
- Plugin: なし
- API: OpenAI 互換 Chat Completions (`openai-completions`)
- 推奨ベース URL: `http://127.0.0.1:18000/v1`
- モデル ID: `deepseek-v4-flash`
- ツール呼び出し: OpenAI 形式の `tools` と `tool_calls` により対応
- 推論: DeepSeek 形式の `thinking` と `reasoning_effort`

## 要件

- Metal 対応の macOS。
- `ds4-server` と DeepSeek V4 Flash GGUF ファイルを含む、動作する ds4 チェックアウト。
- 選択するコンテキストに十分なメモリ。大きな `--ctx` 値では、サーバー起動時により多くの KV メモリが割り当てられます。

<Warning>
OpenClaw のエージェントターンには、ツールスキーマとワークスペースコンテキストが含まれます。`--ctx 4096` のような小さなコンテキストでは、直接の curl テストには通っても、完全なエージェント実行では `500 prompt exceeds context` で失敗することがあります。エージェントとツールのスモークテストには、少なくとも `--ctx 32768` を使用してください。十分なメモリがあり、ds4 Think Max の動作を使いたい場合にのみ `--ctx 393216` を使用してください。
</Warning>

## クイックスタート

<Steps>
  <Step title="Start ds4-server">
    `<DS4_DIR>` を ds4 のチェックアウトパスに置き換えます。

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="Verify the OpenAI-compatible endpoint">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    レスポンスに `deepseek-v4-flash` が含まれている必要があります。

  </Step>
  <Step title="Add the OpenClaw provider config">
    [完全な設定](#full-config) の設定を追加し、ワンショットのモデルチェックを実行します。

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

`contextWindow` は `ds4-server --ctx` の値と合わせてください。OpenClaw にサーバーのデフォルトより少ない出力を意図的に要求させたい場合を除き、`maxTokens` は `--tokens` と合わせてください。

## オンデマンド起動

OpenClaw は、`ds4/...` モデルが選択された場合にのみ ds4 を起動できます。同じプロバイダーエントリに `localService` を追加します。

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

`command` は絶対実行ファイルパスである必要があります。シェル検索と `~` 展開は使用されません。すべての `localService` フィールドについては、[ローカルモデルサービス](/ja-JP/gateway/local-model-services) を参照してください。

## Think Max

ds4 は、次の両方の条件が真の場合にのみ Think Max を適用します。

- `ds4-server` が `--ctx 393216` 以上で起動している。
- リクエストが `reasoning_effort: "max"` または同等の ds4 effort フィールドを使用している。

その大きなコンテキストを実行する場合は、サーバーフラグと OpenClaw モデルメタデータの両方を更新します。

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

直接の HTTP チェックから始めます。

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

次に OpenClaw のモデルルーティングをテストします。

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

完全なエージェントとツール呼び出しのスモークテストには、少なくとも 32768 のコンテキストを使用します。

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
  <Accordion title="curl /v1/models cannot connect">
    ds4 が実行されていないか、`baseUrl` のホストとポートにバインドされていません。`ds4-server` を起動してから再試行します。

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    構成された `--ctx` が OpenClaw のターンには小さすぎます。`ds4-server --ctx` を増やし、`models.providers.ds4.models[].contextWindow` を一致するように更新してください。ツールを含む完全なエージェントターンには、直接の 1 メッセージ curl リクエストよりも大幅に多くのコンテキストが必要です。
  </Accordion>

  <Accordion title="Think Max does not activate">
    ds4 が Think Max を使用するのは、`--ctx` が少なくとも `393216` で、リクエストが `reasoning_effort: "max"` を要求している場合のみです。より小さいコンテキストでは high reasoning にフォールバックします。
  </Accordion>

  <Accordion title="The first request is slow">
    ds4 には Metal 常駐のコールドスタートとモデルウォームアップの段階があります。OpenClaw がオンデマンドでサーバーを起動する場合は、`localService.readyTimeoutMs: 300000` を使用してください。
  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Local model services" href="/ja-JP/gateway/local-model-services" icon="play">
    モデルリクエストの前に、ローカルモデルサーバーをオンデマンドで起動します。
  </Card>
  <Card title="Local models" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルバックエンドを選択して運用します。
  </Card>
  <Card title="Model providers" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダー参照、認証、フェイルオーバーを構成します。
  </Card>
  <Card title="DeepSeek" href="/ja-JP/providers/deepseek" icon="brain">
    ネイティブ DeepSeek プロバイダーの動作と思考制御。
  </Card>
</CardGroup>
