---
read_when:
    - Synthetic를 모델 provider로 사용하려고 합니다
    - Synthetic API 키 또는 base URL 설정이 필요합니다
summary: OpenClaw에서 Synthetic의 Anthropic 호환 API 사용하기
title: Synthetic
x-i18n:
    generated_at: "2026-04-12T23:32:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c4d2c6635482e09acaf603a75c8a85f0782e42a4a68ef6166f423a48d184ffa
    source_path: providers/synthetic.md
    workflow: 15
---

# Synthetic

[Synthetic](https://synthetic.new)은 Anthropic 호환 엔드포인트를 제공합니다.
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
    Synthetic 계정에서 `SYNTHETIC_API_KEY`를 발급받거나,
    온보딩 마법사에서 입력하라는 안내를 따르세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="기본 모델 확인">
    온보딩 후 기본 모델은 다음으로 설정됩니다:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw의 Anthropic 클라이언트는 base URL에 `/v1`을 자동으로 추가하므로
`https://api.synthetic.new/anthropic`를 사용하세요(`/anthropic/v1`이 아님). Synthetic가
base URL을 변경하면 `models.providers.synthetic.baseUrl`을 재정의하세요.
</Warning>

## 구성 예시

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

## 모델 카탈로그

모든 Synthetic 모델은 비용이 `0`(입력/출력/캐시)으로 설정됩니다.

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
모델 참조는 `synthetic/<modelId>` 형식을 사용합니다.
계정에서 사용 가능한 모든 모델을 보려면
`openclaw models list --provider synthetic`를 사용하세요.
</Tip>

<AccordionGroup>
  <Accordion title="모델 허용 목록">
    모델 허용 목록(`agents.defaults.models`)을 활성화하는 경우, 사용하려는
    모든 Synthetic 모델을 추가하세요. 허용 목록에 없는 모델은
    agent에서 숨겨집니다.
  </Accordion>

  <Accordion title="Base URL 재정의">
    Synthetic가 API 엔드포인트를 변경하면 구성에서 base URL을 재정의하세요:

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

    OpenClaw가 `/v1`을 자동으로 추가한다는 점을 기억하세요.

  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    provider 규칙, 모델 참조, 장애 조치 동작.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 설정을 포함한 전체 구성 스키마.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 대시보드 및 API 문서.
  </Card>
</CardGroup>
