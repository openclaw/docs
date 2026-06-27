---
read_when:
    - OpenClaw에서 Z.AI / GLM 모델을 사용하려는 경우
    - 간단한 ZAI_API_KEY 설정이 필요합니다
summary: OpenClaw에서 Z.AI(GLM 모델) 사용
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:05:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI는 **GLM** 모델을 위한 API 플랫폼입니다. GLM용 REST API를 제공하며
인증에는 API 키를 사용합니다. Z.AI 콘솔에서 API 키를 생성하세요.
OpenClaw는 Z.AI API 키와 함께 `zai` 제공자를 사용합니다.

| 속성 | 값                                        |
| -------- | -------------------------------------------- |
| 제공자 | `zai`                                        |
| 패키지  | `@openclaw/zai-provider`                     |
| 인증     | `ZAI_API_KEY` (레거시 별칭: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (Bearer 인증)          |

## GLM 모델

GLM은 별도의 제공자가 아니라 모델 제품군입니다. OpenClaw에서 GLM 모델은
`zai/glm-5.2` 같은 참조를 사용합니다. 제공자는 `zai`, 모델 ID는 `glm-5.2`입니다.

## 시작하기

먼저 제공자 Plugin을 설치합니다.

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **가장 적합한 대상:** 대부분의 사용자. OpenClaw는 API 키로 지원되는 Z.AI 엔드포인트를 탐색하고 올바른 기본 URL을 자동으로 적용합니다.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
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
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 구성 예시

<Tip>
`zai-api-key`를 사용하면 OpenClaw가 키에서 일치하는 Z.AI 엔드포인트를 감지하고
올바른 기본 URL을 자동으로 적용할 수 있습니다. 특정 Coding Plan 또는 일반 API 표면을
강제로 지정하려면 명시적 지역 선택지를 사용하세요.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 기본 제공 카탈로그

`zai` 제공자 Plugin은 Plugin 매니페스트에 카탈로그를 포함하므로, 읽기 전용
목록 표시는 제공자 런타임을 로드하지 않고도 알려진 GLM 행을 표시할 수 있습니다.

```bash
openclaw models list --all --provider zai
```

매니페스트 기반 카탈로그에는 현재 다음이 포함됩니다.

| 모델 참조            | 참고                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 기본값; 1M 컨텍스트 |
| `zai/glm-5.1`        | 일반 API 기본값             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
GLM 모델은 `zai/<model>` 형식으로 사용할 수 있습니다(예: `zai/glm-5`).
</Tip>

<Tip>
GLM-5.2는 `off`, `low`, `high`, `max` 사고 수준을 지원합니다. OpenClaw는
`low`와 `high`를 Z.AI의 높은 추론 노력으로, `max`를 최대 노력으로 매핑합니다.
</Tip>

<Note>
Coding Plan 설정은 기본적으로 `zai/glm-5.2`를 사용하며, 일반 API 설정은
`zai/glm-5.1`을 유지합니다. 엔드포인트 자동 감지는 선택된 플랜이 GLM-5.2를
노출하지 않을 때 `glm-5.1` 또는 `glm-4.7`로 대체됩니다. GLM 버전과 사용 가능 여부는
변경될 수 있습니다. 설치된 버전에 알려진 카탈로그를 보려면
`openclaw models list --all --provider zai`를 실행하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    알 수 없는 `glm-5*` ID도 현재 GLM-5 제품군 형태와 일치할 때
    `glm-4.7` 템플릿에서 제공자 소유 메타데이터를 합성하여 제공자 경로에서
    앞으로 해석됩니다.
  </Accordion>

  <Accordion title="Tool-call streaming">
    Z.AI 도구 호출 스트리밍에는 기본적으로 `tool_stream`이 활성화됩니다. 비활성화하려면:

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
    OpenClaw는 보이는 텍스트 전에 `reasoning_content`에 출력 예산을 쓰는 응답을
    피하기 위해 `thinking: { type: "disabled" }`를 보냅니다.

    보존된 사고는 선택 사항입니다. Z.AI는 전체 이전
    `reasoning_content`를 다시 재생해야 하며, 이로 인해 프롬프트 토큰이 증가하기 때문입니다.
    모델별로 활성화하세요.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    활성화되어 있고 사고가 켜져 있으면 OpenClaw는
    `thinking: { type: "enabled", clear_thinking: false }`를 보내고 동일한
    OpenAI 호환 대화 기록에 대해 이전 `reasoning_content`를 다시 재생합니다.

    고급 사용자는 여전히 `params.extra_body.thinking`으로 정확한 제공자 페이로드를
    재정의할 수 있습니다.

  </Accordion>

  <Accordion title="Image understanding">
    Z.AI Plugin은 이미지 이해를 등록합니다.

    | 속성      | 값       |
    | ------------- | ----------- |
    | 모델         | `glm-4.6v`  |

    이미지 이해는 구성된 Z.AI 인증에서 자동으로 해석되므로
    추가 구성이 필요하지 않습니다.

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI는 API 키와 함께 Bearer 인증을 사용합니다.
    - `zai-api-key` 온보딩 선택지는 키로 지원되는 엔드포인트를 탐색하여 일치하는 Z.AI 엔드포인트를 자동 감지합니다.
    - 특정 API 표면을 강제로 지정하려면 명시적 지역 선택지(`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)를 사용하세요.
    - 레거시 환경 변수 `Z_AI_API_KEY`는 여전히 허용됩니다. 시작 시 `ZAI_API_KEY`가 설정되어 있지 않으면 OpenClaw가 이를 `ZAI_API_KEY`로 복사합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="Configuration reference" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 및 모델 설정을 포함한 전체 OpenClaw 구성 스키마.
  </Card>
</CardGroup>
