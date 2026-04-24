---
read_when:
    - モデルプロバイダーとしてSyntheticを使いたい場合
    - Synthetic API keyまたはbase URLの設定が必要な場合
summary: OpenClawでSyntheticのAnthropic互換APIを使う
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T05:16:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
---

[Synthetic](https://synthetic.new)はAnthropic互換エンドポイントを公開しています。
OpenClawはこれを`synthetic`プロバイダーとして登録し、Anthropic
Messages APIを使用します。

| プロパティ | 値 |
| -------- | ------------------------------------- |
| プロバイダー | `synthetic` |
| 認証 | `SYNTHETIC_API_KEY` |
| API | Anthropic Messages |
| Base URL | `https://api.synthetic.new/anthropic` |

## はじめに

<Steps>
  <Step title="API keyを取得する">
    Syntheticアカウントから`SYNTHETIC_API_KEY`を取得するか、
    オンボーディングウィザードに入力を促させてください。
  </Step>
  <Step title="オンボーディングを実行する">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="デフォルトモデルを確認する">
    オンボーディング後、デフォルトモデルは次に設定されます:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClawのAnthropic clientはbase URLに自動的に`/v1`を追加するため、
`https://api.synthetic.new/anthropic`を使ってください（`/anthropic/v1`ではありません）。Syntheticが
base URLを変更した場合は、`models.providers.synthetic.baseUrl`を上書きしてください。
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

すべてのSyntheticモデルはコスト`0`（input/output/cache）を使用します。

| モデルID | コンテキストウィンドウ | 最大トークン | Reasoning | 入力 |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | no        | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | yes       | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | no        | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | no        | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | no        | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | no        | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | no        | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | no        | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | yes       | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | no        | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | no        | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | no        | text         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | yes       | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | no        | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | yes       | text         |

<Tip>
モデル参照は`synthetic/<modelId>`形式を使います。アカウントで利用可能な
すべてのモデルを見るには、`openclaw models list --provider synthetic`を使用してください。
</Tip>

<AccordionGroup>
  <Accordion title="モデルallowlist">
    モデルallowlist（`agents.defaults.models`）を有効にする場合は、
    使用予定のSyntheticモデルをすべて追加してください。allowlistにないモデルは、
    エージェントから見えなくなります。
  </Accordion>

  <Accordion title="Base URL上書き">
    SyntheticがAPIエンドポイントを変更した場合は、設定内でbase URLを上書きしてください。

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

    OpenClawは自動的に`/v1`を追加することを忘れないでください。

  </Accordion>
</AccordionGroup>

## 関連

<CardGroup cols={2}>
  <Card title="Model selection" href="/ja-JP/concepts/model-providers" icon="layers">
    プロバイダールール、モデル参照、およびフェイルオーバー動作。
  </Card>
  <Card title="Configuration reference" href="/ja-JP/gateway/configuration-reference" icon="gear">
    プロバイダー設定を含む完全な設定スキーマ。
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    SyntheticダッシュボードとAPIドキュメント。
  </Card>
</CardGroup>
