---
read_when:
    - ローカルの inferrs サーバーに対して OpenClaw を実行したい
    - Gemma または別のモデルを inferrs 経由で提供している
    - inferrs には正確な OpenClaw 互換フラグが必要です
summary: inferrs 経由で OpenClaw を実行する（OpenAI 互換のローカルサーバー）
title: 推論する
x-i18n:
    generated_at: "2026-05-06T05:16:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) は、OpenAI 互換の `/v1` API の背後でローカルモデルを提供できます。OpenClaw は汎用の `openai-completions` パスを通じて `inferrs` と連携します。

| プロパティ       | 値                                                                 |
| ---------------- | ------------------------------------------------------------------ |
| プロバイダー id  | `inferrs`（カスタム。`models.providers.inferrs` で設定）           |
| Plugin           | なし — `inferrs` はバンドル済みの OpenClaw プロバイダー Plugin ではありません |
| 認証環境変数     | 任意。inferrs サーバーに認証がない場合は任意の値で動作します       |
| API              | OpenAI 互換（`openai-completions`）                                |
| 推奨ベース URL   | `http://127.0.0.1:8080/v1`（または inferrs サーバーの場所）        |

<Note>
  `inferrs` は現在、専用の OpenClaw プロバイダー Plugin ではなく、カスタムのセルフホスト OpenAI 互換バックエンドとして扱うのが最適です。オンボーディングの選択フラグではなく、`models.providers.inferrs` を通じて設定します。自動検出付きの真のバンドル済み Plugin が必要な場合は、[SGLang](/ja-JP/providers/sglang) または [vLLM](/ja-JP/providers/vllm) を参照してください。
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
    明示的なプロバイダーエントリを追加し、デフォルトモデルをそれに向けます。完全な設定例は下記を参照してください。
  </Step>
</Steps>

## 完全な設定例

この例では、ローカルの `inferrs` サーバーで Gemma 4 を使用します。

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
    一部の `inferrs` Chat Completions ルートは、構造化された content-part 配列ではなく、文字列の
    `messages[].content` のみを受け付けます。

    <Warning>
    OpenClaw の実行が次のようなエラーで失敗する場合:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    モデルエントリで `compat.requiresStringContent: true` を設定してください。
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw はリクエスト送信前に、純粋なテキスト content part をプレーン文字列へ平坦化します。

  </Accordion>

  <Accordion title="Gemma とツールスキーマの注意点">
    現在の一部の `inferrs` + Gemma の組み合わせでは、小さな直接
    `/v1/chat/completions` リクエストは受け付けるものの、完全な OpenClaw agent-runtime
    ターンでは失敗することがあります。

    その場合は、まずこれを試してください。

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    これにより、そのモデルに対する OpenClaw のツールスキーマサーフェスが無効になり、より厳格なローカルバックエンドへのプロンプト負荷を減らせる場合があります。

    ごく小さな直接リクエストは引き続き動作するのに、通常の OpenClaw エージェントターンが `inferrs` 内でクラッシュし続ける場合、残っている問題は通常、OpenClaw のトランスポート層ではなくアップストリームのモデルまたはサーバーの挙動です。

  </Accordion>

  <Accordion title="手動スモークテスト">
    設定後、両方の層をテストします。

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

    最初のコマンドは動作するのに 2 番目が失敗する場合は、下記のトラブルシューティングセクションを確認してください。

  </Accordion>

  <Accordion title="プロキシ形式の挙動">
    `inferrs` はネイティブの OpenAI エンドポイントではなく、プロキシ形式の OpenAI 互換 `/v1` バックエンドとして扱われます。

    - ネイティブ OpenAI 専用のリクエスト整形はここでは適用されません
    - `service_tier`、Responses `store`、prompt-cache ヒント、OpenAI reasoning-compat ペイロード整形はありません
    - 非表示の OpenClaw attribution ヘッダー（`originator`、`version`、`User-Agent`）は、カスタムの `inferrs` ベース URL には注入されません

  </Accordion>
</AccordionGroup>

## トラブルシューティング

<AccordionGroup>
  <Accordion title="curl /v1/models が失敗する">
    `inferrs` が実行されていない、到達できない、または想定した
    ホスト/ポートにバインドされていません。サーバーが起動しており、設定したアドレスで待ち受けていることを確認してください。
  </Accordion>

  <Accordion title="messages[].content expected a string">
    モデルエントリで `compat.requiresStringContent: true` を設定してください。詳細は上記の
    `requiresStringContent` セクションを参照してください。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 呼び出しは成功するが openclaw infer model run が失敗する">
    ツールスキーマサーフェスを無効にするために、`compat.supportsTools: false` の設定を試してください。
    上記の Gemma ツールスキーマの注意点を参照してください。
  </Accordion>

  <Accordion title="大きなエージェントターンで inferrs がまだクラッシュする">
    OpenClaw がスキーマエラーを受け取らなくなっても、大きな
    エージェントターンで `inferrs` がまだクラッシュする場合は、アップストリームの `inferrs` またはモデルの制限として扱ってください。プロンプト負荷を減らすか、別のローカルバックエンドまたはモデルに切り替えてください。
  </Accordion>
</AccordionGroup>

<Tip>
一般的なヘルプについては、[トラブルシューティング](/ja-JP/help/troubleshooting) と [FAQ](/ja-JP/help/faq) を参照してください。
</Tip>

## 関連

<CardGroup cols={2}>
  <Card title="ローカルモデル" href="/ja-JP/gateway/local-models" icon="server">
    ローカルモデルサーバーに対して OpenClaw を実行します。
  </Card>
  <Card title="Gateway トラブルシューティング" href="/ja-JP/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    プローブは通るもののエージェント実行が失敗する、ローカル OpenAI 互換バックエンドをデバッグします。
  </Card>
  <Card title="モデル選択" href="/ja-JP/concepts/model-providers" icon="layers">
    すべてのプロバイダー、モデル参照、フェイルオーバー挙動の概要です。
  </Card>
</CardGroup>
