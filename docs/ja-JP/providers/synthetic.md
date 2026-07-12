---
read_when:
    - Synthetic をモデルプロバイダーとして使用したい場合
    - Synthetic API キーまたはベース URL の設定が必要です
summary: OpenClaw で Synthetic の Anthropic 互換 API を使用する
title: 合成
x-i18n:
    generated_at: "2026-07-11T22:39:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) は Anthropic 互換のエンドポイントを提供します。
OpenClaw はこれを `synthetic` プロバイダーとして同梱し、Anthropic
Messages API を使用します。

| プロパティ | 値                                    |
| ---------- | ------------------------------------- |
| プロバイダー | `synthetic`                           |
| 認証       | `SYNTHETIC_API_KEY`                   |
| API        | Anthropic Messages                    |
| ベース URL | `https://api.synthetic.new/anthropic` |

## はじめに

<Steps>
  <Step title="API キーを取得">
    Synthetic アカウントから `SYNTHETIC_API_KEY` を取得するか、オンボーディングで
    入力を求めるようにします。
  </Step>
  <Step title="オンボーディングを実行">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="デフォルトモデルを確認">
    オンボーディングにより、デフォルトモデルは次のように設定されます。
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw の Anthropic クライアントはベース URL に `/v1` を自動的に追加するため、
`https://api.synthetic.new/anthropic` を使用してください（`/anthropic/v1` ではありません）。Synthetic が
ベース URL を変更した場合は、`models.providers.synthetic.baseUrl` を上書きしてください。
</Warning>

## 設定例

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## 組み込みカタログ

すべての Synthetic モデルでは、コスト（入力／出力／キャッシュ）は `0` です。

| モデル ID                                              | コンテキストウィンドウ | 最大トークン数 | 推論 | 入力               |
| ------------------------------------------------------ | ---------------------- | -------------- | ---- | ------------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000                | 65,536         | なし | テキスト           |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000                | 8,192          | あり | テキスト           |
| `hf:zai-org/GLM-4.7`                                   | 198,000                | 128,000        | なし | テキスト           |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000                | 8,192          | なし | テキスト           |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000                | 8,192          | なし | テキスト           |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000                | 8,192          | なし | テキスト           |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000                | 8,192          | なし | テキスト           |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000                | 8,192          | なし | テキスト           |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000                | 8,192          | なし | テキスト           |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000                | 8,192          | なし | テキスト           |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000                | 8,192          | なし | テキスト           |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000                | 8,192          | あり | テキスト + 画像    |
| `hf:openai/gpt-oss-120b`                               | 128,000                | 8,192          | なし | テキスト           |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000                | 8,192          | なし | テキスト           |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000                | 8,192          | なし | テキスト           |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000                | 8,192          | なし | テキスト + 画像    |
| `hf:zai-org/GLM-4.5`                                   | 128,000                | 128,000        | なし | テキスト           |
| `hf:zai-org/GLM-4.6`                                   | 198,000                | 128,000        | なし | テキスト           |
| `hf:zai-org/GLM-5`                                     | 256,000                | 128,000        | あり | テキスト + 画像    |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000                | 8,192          | なし | テキスト           |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000                | 8,192          | あり | テキスト           |

<Tip>
モデル参照は `synthetic/<modelId>` の形式を使用します。アカウントで利用可能な
すべてのモデルを確認するには、`openclaw models list --provider synthetic` を使用してください。
</Tip>

<AccordionGroup>
  <Accordion title="モデルの許可リスト">
    モデルの許可リスト（`agents.defaults.models`）を有効にする場合は、使用する予定の
    Synthetic モデルをすべて追加してください。許可リストにないモデルは
    エージェントに表示されません。
  </Accordion>

  <Accordion title="ベース URL の上書き">
    Synthetic が API エンドポイントを変更した場合は、ベース URL を上書きします。

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw は引き続き `/v1` を自動的に追加します。

  </Accordion>
</AccordionGroup>

## 関連項目

<CardGroup cols={2}>
  <Card title="モデルプロバイダー" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダーのルール、モデル参照、フェイルオーバーの動作。
  </Card>
  <Card title="設定リファレンス" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic のダッシュボードと API ドキュメント。
  </Card>
</CardGroup>
