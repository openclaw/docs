---
read_when:
    - 你想使用 Synthetic 作為模型供應商
    - 你需要設定 Synthetic API 金鑰或基礎 URL
summary: 在 OpenClaw 中使用 Synthetic 的 Anthropic 相容 API
title: Synthetic
x-i18n:
    generated_at: "2026-07-19T14:00:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f6cc89a7b837f57555d176ce78e62a39095d4ef0765c96b6b7b93ffebd7388
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) 提供與 Anthropic 相容的端點。
OpenClaw 將其內建為 `synthetic` 提供者，並使用 Anthropic
Messages API。

| 屬性 | 值                                 |
| -------- | ------------------------------------- |
| 提供者 | `synthetic`                           |
| 驗證     | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| 基底 URL | `https://api.synthetic.new/anthropic` |

## 開始使用

<Steps>
  <Step title="取得 API 金鑰">
    從你的 Synthetic 帳戶取得 `SYNTHETIC_API_KEY`，或讓初始設定流程
    提示你輸入。
  </Step>
  <Step title="執行初始設定">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="驗證預設模型">
    初始設定會將預設模型設為：
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M3
    ```
  </Step>
</Steps>

<Warning>
OpenClaw 的 Anthropic 用戶端會自動將 `/v1` 附加至基底 URL，因此請使用
`https://api.synthetic.new/anthropic`（而非 `/anthropic/v1`）。如果 Synthetic
變更其基底 URL，請覆寫 `models.providers.synthetic.baseUrl`。
</Warning>

## 設定範例

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
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
            id: "hf:MiniMaxAI/MiniMax-M3",
            name: "MiniMax M3",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## 內建目錄

所有 Synthetic 模型的成本（輸入／輸出／快取）均為 `0`。如需瞭解服務可用性，請參閱 Synthetic 的
[目前模型清單](https://dev.synthetic.new/docs/api/models)。

| 模型 ID                                            | 上下文視窗 | 最大權杖數 | 推理 | 輸入        |
| --------------------------------------------------- | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M3`                           | 262,144        | 65,536     | 是       | 文字 + 圖片 |
| `hf:moonshotai/Kimi-K2.7-Code`                      | 262,144        | 8,192      | 是       | 文字 + 圖片 |
| `hf:nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4` | 262,144        | 8,192      | 是       | 文字         |
| `hf:openai/gpt-oss-120b`                            | 131,072        | 8,192      | 是       | 文字         |
| `hf:Qwen/Qwen3.6-27B`                               | 262,144        | 81,920     | 是       | 文字 + 圖片 |
| `hf:zai-org/GLM-4.7-Flash`                          | 196,608        | 131,072    | 是       | 文字         |
| `hf:zai-org/GLM-5.2`                                | 524,288        | 131,072    | 是       | 文字         |

<Tip>
模型參照使用 `synthetic/<modelId>` 格式。使用
`openclaw models list --provider synthetic` 可查看你的
帳戶可用的所有模型。
</Tip>

<AccordionGroup>
  <Accordion title="模型允許清單">
    如果啟用模型允許清單（`agents.defaults.modelPolicy.allow`），請加入你計畫使用的每個
    Synthetic 模型。不在允許清單中的模型會對代理程式隱藏。
  </Accordion>

  <Accordion title="覆寫基底 URL">
    如果 Synthetic 變更其 API 端點，請覆寫基底 URL：

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

    OpenClaw 仍會自動附加 `/v1`。

  </Accordion>
</AccordionGroup>

## 相關內容

<CardGroup cols={2}>
  <Card title="模型提供者" href="/zh-TW/concepts/model-providers" icon="layers">
    提供者規則、模型參照與容錯移轉行為。
  </Card>
  <Card title="設定參考" href="/zh-TW/gateway/configuration-reference" icon="gear">
    完整設定結構描述，包含提供者設定。
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 儀表板與 API 文件。
  </Card>
</CardGroup>
