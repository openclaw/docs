---
read_when:
    - ローカルの inferrs サーバーに対して OpenClaw を実行したい場合
    - inferrs 経由で Gemma または別のモデルを提供している場合
    - inferrs 用の正確な OpenClaw 互換フラグが必要な場合
summary: inferrs 経由で OpenClaw を実行する（OpenAI 互換ローカルサーバー）
title: Inferrs
x-i18n:
    generated_at: "2026-04-24T05:15:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 15
---

[inferrs](https://github.com/ericcurtin/inferrs) は、ローカルモデルを
OpenAI 互換の `/v1` API の背後で提供できます。OpenClaw は `inferrs` を、汎用
`openai-completions` 経路を通して利用できます。

`inferrs` は現在、専用の OpenClaw provider Plugin ではなく、
カスタムのセルフホスト OpenAI 互換 backend として扱うのが最適です。

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
  <Step title="OpenClaw の provider エントリを追加する">
    明示的な provider エントリを追加し、デフォルトモデルをそれに向けます。完全な config 例は以下を参照してください。
  </Step>
</Steps>

## 完全な config 例

この例では、ローカル `inferrs` サーバー上の Gemma 4 を使います。

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

## 高度な設定

<AccordionGroup>
  <Accordion title="requiresStringContent が重要な理由">
    一部の `inferrs` Chat Completions 経路は、
    構造化された content-part 配列ではなく、文字列の
    `messages[].content` のみを受け付けます。

    <Warning>
    OpenClaw 実行が次のようなエラーで失敗する場合:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    モデルエントリに `compat.requiresStringContent: true` を設定してください。
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw は、リクエスト送信前に純粋なテキスト content part を平文文字列へ flatten します。

  </Accordion>

  <Accordion title="Gemma と tool-schema の注意点">
    一部の現在の `inferrs` + Gemma の組み合わせは、小さな直接
    `/v1/chat/completions` リクエストは受け付けても、完全な OpenClaw agent-runtime
    turn では依然失敗します。

    その場合、まずこれを試してください:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    これにより、そのモデルに対する OpenClaw のツール schema サーフェスが無効になり、
    厳しめのローカル backend での prompt
    圧力を減らせる可能性があります。

    小さな直接リクエストが引き続き動くのに、通常の OpenClaw agent turn が
    `inferrs` 内で引き続きクラッシュするなら、残る問題は通常、OpenClaw の transport layer ではなく、上流の model/server 挙動です。

  </Accordion>

  <Accordion title="手動スモークテスト">
    設定後は、両方のレイヤーをテストしてください:

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

    最初のコマンドが動くのに 2 つ目が失敗する場合は、以下のトラブルシューティング節を確認してください。

  </Accordion>

  <Accordion title="プロキシ風の挙動">
    `inferrs` は、ネイティブ
    OpenAI endpoint ではなく、プロキシ風 OpenAI 互換 `/v1` backend として扱われます。

    - ここではネイティブ OpenAI 専用のリクエスト整形は適用されません
    - `service_tier`、Responses `store`、prompt-cache hint、
      OpenAI reasoning-compat payload shaping はありません
    - 隠し OpenClaw attribution header（`originator`、`version`、`User-Agent`）
      はカスタム `inferrs` base URL には注入されません

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="curl /v1/models が失敗する">
    `inferrs` が起動していない、到達できない、または期待した
    host/port に bind されていません。サーバーが起動しており、
    設定したアドレスで待ち受けていることを確認してください。
  </Accordion>

  <Accordion title="messages[].content が文字列を期待している">
    モデルエントリに `compat.requiresStringContent: true` を設定してください。詳細は
    上記の `requiresStringContent` 節を参照してください。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 呼び出しは通るのに openclaw infer model run が失敗する">
    ツール schema サーフェスを無効にするため、`compat.supportsTools: false` を設定してみてください。
    Gemma の tool-schema 注意点を参照してください。
  </Accordion>

  <Accordion title="inferrs がより大きい agent turn で依然クラッシュする">
    OpenClaw が schema エラーを出さなくなった後でも、`inferrs` がより大きな
    agent turn で依然クラッシュするなら、それは上流の `inferrs` または model の制約として扱ってください。
    Prompt 圧力を減らすか、別のローカル backend または model に切り替えてください。
  </Accordion>
</AccordionGroup>

<Tip>
一般的なヘルプについては [Troubleshooting](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルサーバーに対して OpenClaw を実行する。
  </Card>
  <Card title="Gateway トラブルシューティング" href="/ja-JP/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    probe は通るのに agent 実行が失敗するローカル OpenAI 互換 backend をデバッグする。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー動作の概要。
  </Card>
</CardGroup>
