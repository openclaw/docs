---
read_when:
    - Synthetic을 모델 제공자로 사용하려고 합니다
    - Synthetic API 키 또는 기본 URL 설정이 필요합니다
summary: OpenClaw에서 Synthetic의 Anthropic 호환 API 사용하기
title: Synthetic
x-i18n:
    generated_at: "2026-07-12T15:41:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new)는 Anthropic 호환 엔드포인트를 제공합니다.
OpenClaw은 이를 `synthetic` 프로바이더로 번들하며 Anthropic
Messages API를 사용합니다.

| 속성     | 값                                    |
| -------- | ------------------------------------- |
| 프로바이더 | `synthetic`                           |
| 인증     | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| 기본 URL | `https://api.synthetic.new/anthropic` |

## 시작하기

<Steps>
  <Step title="API 키 받기">
    Synthetic 계정에서 `SYNTHETIC_API_KEY`를 받거나, 온보딩 중에
    입력하라는 메시지가 표시되도록 합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="기본 모델 확인">
    온보딩은 기본 모델을 다음으로 설정합니다.
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw의 Anthropic 클라이언트는 기본 URL에 `/v1`을 자동으로 추가하므로
`https://api.synthetic.new/anthropic`을 사용하십시오(`/anthropic/v1`이 아님). Synthetic이
기본 URL을 변경하는 경우 `models.providers.synthetic.baseUrl`을 재정의하십시오.
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

## 기본 제공 카탈로그

모든 Synthetic 모델은 비용이 `0`입니다(입력/출력/캐시).

| 모델 ID                                                | 컨텍스트 창 | 최대 토큰 | 추론 | 입력          |
| ------------------------------------------------------ | ----------- | --------- | ---- | ------------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000     | 65,536    | 아니요 | 텍스트        |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000     | 8,192     | 예   | 텍스트        |
| `hf:zai-org/GLM-4.7`                                   | 198,000     | 128,000   | 아니요 | 텍스트        |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000     | 8,192     | 아니요 | 텍스트        |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000     | 8,192     | 아니요 | 텍스트        |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000     | 8,192     | 아니요 | 텍스트        |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000     | 8,192     | 예   | 텍스트 + 이미지 |
| `hf:openai/gpt-oss-120b`                               | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000     | 8,192     | 아니요 | 텍스트        |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000     | 8,192     | 아니요 | 텍스트        |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000     | 8,192     | 아니요 | 텍스트 + 이미지 |
| `hf:zai-org/GLM-4.5`                                   | 128,000     | 128,000   | 아니요 | 텍스트        |
| `hf:zai-org/GLM-4.6`                                   | 198,000     | 128,000   | 아니요 | 텍스트        |
| `hf:zai-org/GLM-5`                                     | 256,000     | 128,000   | 예   | 텍스트 + 이미지 |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000     | 8,192     | 아니요 | 텍스트        |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000     | 8,192     | 예   | 텍스트        |

<Tip>
모델 참조는 `synthetic/<modelId>` 형식을 사용합니다. 계정에서 사용할 수 있는
모든 모델을 확인하려면 `openclaw models list --provider synthetic`을 사용하십시오.
</Tip>

<AccordionGroup>
  <Accordion title="모델 허용 목록">
    모델 허용 목록(`agents.defaults.models`)을 활성화하는 경우 사용할
    모든 Synthetic 모델을 추가하십시오. 허용 목록에 없는 모델은 에이전트에서
    숨겨집니다.
  </Accordion>

  <Accordion title="기본 URL 재정의">
    Synthetic이 API 엔드포인트를 변경하는 경우 기본 URL을 재정의하십시오.

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

    OpenClaw은 여전히 `/v1`을 자동으로 추가합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 프로바이더" href="/ko/concepts/model-providers" icon="layers">
    프로바이더 규칙, 모델 참조 및 장애 조치 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    프로바이더 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 대시보드 및 API 문서입니다.
  </Card>
</CardGroup>
