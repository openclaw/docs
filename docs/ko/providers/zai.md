---
read_when:
    - OpenClaw에서 Z.AI / GLM 모델을 사용하려는 경우
    - 간단한 ZAI_API_KEY 설정이 필요합니다
summary: OpenClaw에서 Z.AI(GLM 모델) 사용
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T06:49:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI는 **GLM** 모델용 API 플랫폼입니다. GLM용 REST API를 제공하며 인증에는 API 키를 사용합니다. Z.AI 콘솔에서 API 키를 생성하세요. OpenClaw는 Z.AI API 키와 함께 `zai` 제공자를 사용합니다.

- 제공자: `zai`
- 인증: `ZAI_API_KEY`
- API: Z.AI Chat Completions(Bearer 인증)

## 시작하기

<Tabs>
  <Tab title="Auto-detect endpoint">
    **가장 적합한 대상:** 대부분의 사용자. OpenClaw는 키에서 일치하는 Z.AI 엔드포인트를 감지하고 올바른 기본 URL을 자동으로 적용합니다.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **가장 적합한 대상:** 특정 Coding Plan 또는 일반 API 표면을 강제로 지정하려는 사용자.

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 내장 카탈로그

OpenClaw는 현재 번들된 `zai` 제공자에 다음을 시드합니다.

| 모델 참조            | 참고          |
| -------------------- | ------------- |
| `zai/glm-5.1`        | 기본 모델 |
| `zai/glm-5`          |               |
| `zai/glm-5-turbo`    |               |
| `zai/glm-5v-turbo`   |               |
| `zai/glm-4.7`        |               |
| `zai/glm-4.7-flash`  |               |
| `zai/glm-4.7-flashx` |               |
| `zai/glm-4.6`        |               |
| `zai/glm-4.6v`       |               |
| `zai/glm-4.5`        |               |
| `zai/glm-4.5-air`    |               |
| `zai/glm-4.5-flash`  |               |
| `zai/glm-4.5v`       |               |

<Tip>
GLM 모델은 `zai/<model>` 형식으로 사용할 수 있습니다(예: `zai/glm-5`). 기본 번들 모델 참조는 `zai/glm-5.1`입니다.
</Tip>

## 고급 구성

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    알 수 없는 `glm-5*` ID도, ID가 현재 GLM-5 제품군 형태와 일치하면
    `glm-4.7` 템플릿에서 제공자 소유 메타데이터를 합성하여 번들 제공자 경로에서 계속 순방향 해석됩니다.
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI 도구 호출 스트리밍에는 기본적으로 `tool_stream`이 활성화되어 있습니다. 비활성화하려면:

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

  <Accordion title="Thinking and preserved thinking">
    Z.AI 사고는 OpenClaw의 `/think` 제어를 따릅니다. 사고가 꺼져 있으면
    OpenClaw는 보이는 텍스트 전에 출력 예산이 `reasoning_content`에 사용되는 응답을 피하기 위해
    `thinking: { type: "disabled" }`를 보냅니다.

    보존된 사고는 Z.AI가 전체 기록의 `reasoning_content`를 다시 재생하도록 요구하여 프롬프트 토큰이 늘어나므로 선택 사항입니다. 모델별로 활성화하세요.

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

    활성화되어 있고 사고가 켜져 있으면 OpenClaw는
    `thinking: { type: "enabled", clear_thinking: false }`를 보내고 동일한 OpenAI 호환 트랜스크립트에 대해 이전
    `reasoning_content`를 재생합니다.

    고급 사용자는 여전히 `params.extra_body.thinking`으로 정확한 제공자 페이로드를 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="Image understanding">
    번들된 Z.AI Plugin은 이미지 이해를 등록합니다.

    | 속성          | 값          |
    | ------------- | ----------- |
    | 모델          | `glm-4.6v`  |

    이미지 이해는 구성된 Z.AI 인증에서 자동으로 해석되며, 추가 구성이 필요하지 않습니다.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI는 API 키로 Bearer 인증을 사용합니다.
    - `zai-api-key` 온보딩 선택지는 키 접두사에서 일치하는 Z.AI 엔드포인트를 자동 감지합니다.
    - 특정 API 표면을 강제로 지정하려면 명시적 지역 선택지(`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)를 사용하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="GLM model family" href="/ko/providers/glm" icon="microchip">
    GLM 모델 제품군 개요입니다.
  </Card>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
</CardGroup>
