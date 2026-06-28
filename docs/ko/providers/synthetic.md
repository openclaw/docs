---
read_when:
    - 모델 provider로 Synthetic를 사용하려고 합니다.
    - Synthetic API key 또는 base URL 설정이 필요합니다.
summary: OpenClaw에서 Synthetic의 Anthropic 호환 API 사용
title: Synthetic
x-i18n:
    generated_at: "2026-04-24T06:32:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 15
    postprocess_version: locale-links-v1
---

[Synthetic](https://synthetic.new)는 Anthropic 호환 엔드포인트를 제공합니다.
OpenClaw는 이를 `synthetic` provider로 등록하고 Anthropic
Messages API를 사용합니다.

| Property | Value                                 |
| -------- | ------------------------------------- |
| Provider | `synthetic`                           |
| Auth     | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| Base URL | `https://api.synthetic.new/anthropic` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    Synthetic 계정에서 `SYNTHETIC_API_KEY`를 발급받거나, 온보딩 마법사가 이를 묻도록 하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="기본 모델 확인">
    온보딩 후 기본 모델은 다음으로 설정됩니다.
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw의 Anthropic 클라이언트는 base URL에 `/v1`을 자동으로 붙이므로
`https://api.synthetic.new/anthropic`를 사용하세요(`/anthropic/v1` 아님). Synthetic가
base URL을 변경하면 `models.providers.synthetic.baseUrl`을 재정의하세요.
</Warning>

## config 예시

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

## 내장 카탈로그

모든 Synthetic 모델은 비용이 `0`입니다(input/output/cache).

| Model ID                                               | Context window | Max tokens | Reasoning | Input        |
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
모델 ref는 `synthetic/<modelId>` 형식을 사용합니다. 계정에서 사용할 수 있는 모든 모델을 보려면
`openclaw models list --provider synthetic`를 사용하세요.
</Tip>

<AccordionGroup>
  <Accordion title="모델 allowlist">
    모델 allowlist(`agents.defaults.models`)를 활성화하면, 사용할 계획인 모든
    Synthetic 모델을 추가하세요. allowlist에 없는 모델은 에이전트에서 숨겨집니다.
  </Accordion>

  <Accordion title="Base URL 재정의">
    Synthetic가 API 엔드포인트를 변경하면 config에서 base URL을 재정의하세요.

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

    OpenClaw가 `/v1`을 자동으로 붙인다는 점을 기억하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider 규칙, 모델 ref, failover 동작.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 설정을 포함한 전체 config 스키마.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 대시보드 및 API 문서.
  </Card>
</CardGroup>
