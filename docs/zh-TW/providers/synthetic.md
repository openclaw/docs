---
read_when:
    - 您想要使用 Synthetic 作為模型提供者
    - 你需要設定 Synthetic API 金鑰或基礎 URL
summary: 在 OpenClaw 中使用 Synthetic 的 Anthropic 相容 API
title: 合成
x-i18n:
    generated_at: "2026-04-30T03:34:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) 提供與 Anthropic 相容的端點。
OpenClaw 將其註冊為 `synthetic` 提供者，並使用 Anthropic
Messages API。

| 屬性 | 值                                    |
| ---- | ------------------------------------- |
| 提供者 | `synthetic`                           |
| 驗證 | `SYNTHETIC_API_KEY`                   |
| API  | Anthropic Messages                    |
| 基礎 URL | `https://api.synthetic.new/anthropic` |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    從你的 Synthetic 帳戶取得 `SYNTHETIC_API_KEY`，或讓
    入門設定精靈提示你輸入一組金鑰。
  </Step>
  <Step title="執行入門設定">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="驗證預設模型">
    完成入門設定後，預設模型會設為：
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw 的 Anthropic 用戶端會自動將 `/v1` 附加到基礎 URL，因此請使用
`https://api.synthetic.new/anthropic`（不是 `/anthropic/v1`）。如果 Synthetic
變更其基礎 URL，請覆寫 `models.providers.synthetic.baseUrl`。
</Warning>

## 設定範例

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

## 內建目錄

所有 Synthetic 模型都使用成本 `0`（輸入/輸出/快取）。

| 模型 ID                                                | 脈絡視窗 | 最大 Token 數 | 推理 | 輸入         |
| ------------------------------------------------------ | -------- | ------------ | ---- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000  | 65,536       | 否   | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000  | 8,192        | 是   | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000  | 128,000      | 否   | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000  | 8,192        | 否   | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000  | 8,192        | 否   | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000  | 8,192        | 否   | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000  | 8,192        | 否   | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000  | 8,192        | 否   | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000  | 8,192        | 否   | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000  | 8,192        | 否   | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000  | 8,192        | 否   | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000  | 8,192        | 是   | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000  | 8,192        | 否   | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000  | 8,192        | 否   | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000  | 8,192        | 否   | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000  | 8,192        | 否   | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000  | 128,000      | 否   | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000  | 128,000      | 否   | text         |
| `hf:zai-org/GLM-5`                                     | 256,000  | 128,000      | 是   | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000  | 8,192        | 否   | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000  | 8,192        | 是   | text         |

<Tip>
模型參照使用 `synthetic/<modelId>` 形式。使用
`openclaw models list --provider synthetic` 查看你帳戶可用的所有模型。
</Tip>

<AccordionGroup>
  <Accordion title="模型允許清單">
    如果你啟用模型允許清單（`agents.defaults.models`），請加入你計畫使用的每個
    Synthetic 模型。不在允許清單中的模型會從代理程式中隱藏。
  </Accordion>

  <Accordion title="基礎 URL 覆寫">
    如果 Synthetic 變更其 API 端點，請在你的設定中覆寫基礎 URL：

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

    請記得 OpenClaw 會自動附加 `/v1`。

  </Accordion>
</AccordionGroup>

## 相關

<CardGroup cols={2}>
  <Card title="模型選擇" href="/zh-TW/concepts/model-providers" icon="layers">
    提供者規則、模型參照，以及故障轉移行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包含提供者設定。
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 儀表板與 API 文件。
  </Card>
</CardGroup>
