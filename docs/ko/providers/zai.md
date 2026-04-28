---
read_when:
    - OpenClaw에서 Z.AI / GLM 모델을 사용하려고 합니다
    - 간단한 `ZAI_API_KEY` 설정이 필요합니다
summary: OpenClaw에서 Z.AI(GLM 모델) 사용하기
title: Z.AI
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:38:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI는 **GLM** 모델용 API 플랫폼입니다. REST API로 GLM을 제공하며
인증에는 API 키를 사용합니다. Z.AI 콘솔에서 API 키를 생성하세요. OpenClaw는 `zai` 공급자를
Z.AI API 키와 함께 사용합니다.

- 공급자: `zai`
- 인증: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer 인증)

## 시작하기

<Tabs>
  <Tab title="엔드포인트 자동 감지">
    **적합한 경우:** 대부분의 사용자. OpenClaw가 키에서 일치하는 Z.AI 엔드포인트를 감지하고 올바른 base URL을 자동으로 적용합니다.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="명시적 지역 엔드포인트">
    **적합한 경우:** 특정 Coding Plan 또는 일반 API 표면을 강제로 사용하려는 사용자.

    <Steps>
      <Step title="올바른 온보딩 선택">
        ```bash
        # Coding Plan Global (Coding Plan 사용자에게 권장)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (중국 지역)
        openclaw onboard --auth-choice zai-coding-cn

        # 일반 API
        openclaw onboard --auth-choice zai-global

        # 일반 API CN (중국 지역)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 내장 카탈로그

OpenClaw는 현재 번들 `zai` 공급자에 다음을 시드합니다.

| 모델 ref            | 참고          |
| ------------------- | ------------- |
| `zai/glm-5.1`       | 기본 모델     |
| `zai/glm-5`         |               |
| `zai/glm-5-turbo`   |               |
| `zai/glm-5v-turbo`  |               |
| `zai/glm-4.7`       |               |
| `zai/glm-4.7-flash` |               |
| `zai/glm-4.7-flashx`|               |
| `zai/glm-4.6`       |               |
| `zai/glm-4.6v`      |               |
| `zai/glm-4.5`       |               |
| `zai/glm-4.5-air`   |               |
| `zai/glm-4.5-flash` |               |
| `zai/glm-4.5v`      |               |

<Tip>
GLM 모델은 `zai/<model>` 형식으로 사용할 수 있습니다(예: `zai/glm-5`). 기본 번들 모델 ref는 `zai/glm-5.1`입니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="알 수 없는 GLM-5 모델의 전방 확인">
    알 수 없는 `glm-5*` ID도 현재 GLM-5 계열 형식과 일치하면
    `glm-4.7` 템플릿에서 공급자 소유 메타데이터를 합성하여 번들 공급자 경로에서
    전방 확인됩니다.
  </Accordion>

  <Accordion title="도구 호출 스트리밍">
    Z.AI 도구 호출 스트리밍에서는 `tool_stream`이 기본적으로 활성화됩니다. 비활성화하려면:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Thinking 및 보존된 thinking">
    Z.AI thinking은 OpenClaw의 `/think` 제어를 따릅니다. thinking이 꺼져 있으면,
    OpenClaw는 보이는 텍스트보다 먼저 `reasoning_content`에 출력 예산을
    사용하는 응답을 피하기 위해 `thinking: { type: "disabled" }`를 보냅니다.

    보존된 thinking은 Z.AI가 전체 과거
    `reasoning_content`를 다시 재생해야 하므로 프롬프트 토큰이 증가하기 때문에 opt-in입니다.
    모델별로 활성화하세요:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    활성화되고 thinking이 켜져 있으면 OpenClaw는
    `thinking: { type: "enabled", clear_thinking: false }`를 보내고 동일한 OpenAI 호환 transcript에 대해 이전
    `reasoning_content`를 다시 재생합니다.

    고급 사용자는 여전히
    `params.extra_body.thinking`으로 정확한 공급자 페이로드를 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="이미지 이해">
    번들 Z.AI Plugin은 이미지 이해를 등록합니다.

    | 속성          | 값          |
    | ------------- | ----------- |
    | 모델          | `glm-4.6v`  |

    이미지 이해는 구성된 Z.AI 인증에서 자동으로 확인되므로
    추가 구성이 필요하지 않습니다.

  </Accordion>

  <Accordion title="인증 세부 정보">
    - Z.AI는 API 키를 사용한 Bearer 인증을 사용합니다.
    - `zai-api-key` 온보딩 선택은 키 접두사에서 일치하는 Z.AI 엔드포인트를 자동 감지합니다.
    - 특정 API 표면을 강제로 사용하려면 명시적 지역 선택(`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)을 사용하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="GLM 모델 계열" href="/ko/providers/glm" icon="microchip">
    GLM용 모델 계열 개요입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 ref, 장애 조치 동작 선택 방법입니다.
  </Card>
</CardGroup>
