---
read_when:
    - OpenClaw에서 Z.AI / GLM 모델을 사용하려는 경우
    - 간단한 ZAI_API_KEY 설정이 필요합니다
summary: OpenClaw에서 Z.AI(GLM 모델) 사용하기
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T15:42:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

  Z.AI는 **GLM** 모델용 API 플랫폼입니다. GLM용 REST API를 제공하며
  인증에 API 키를 사용합니다. Z.AI 콘솔에서 API 키를 생성하십시오.
  OpenClaw는 Z.AI API 키와 함께 `zai` 제공자를 사용합니다.

  | 속성     | 값                                           |
  | -------- | -------------------------------------------- |
  | 제공자   | `zai`                                        |
  | 패키지   | `@openclaw/zai-provider`                     |
  | 인증     | `ZAI_API_KEY` (레거시 별칭: `Z_AI_API_KEY`) |
  | API      | Z.AI Chat Completions (Bearer 인증)          |

  ## GLM 모델

  GLM은 별도의 제공자가 아니라 모델 제품군입니다. OpenClaw에서 GLM 모델은
  `zai/glm-5.2`와 같은 참조를 사용합니다. 제공자는 `zai`이고 모델 ID는 `glm-5.2`입니다.

  ## 시작하기

  먼저 제공자 Plugin을 설치하십시오.

  ```bash
  openclaw plugins install @openclaw/zai-provider
  ```

  <Tabs>
  <Tab title="엔드포인트 자동 감지">
    **권장 대상:** 대부분의 사용자. OpenClaw는 API 키를 사용하여 지원되는 Z.AI 엔드포인트를 확인하고 올바른 기본 URL을 자동으로 적용합니다.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="모델이 목록에 표시되는지 확인">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="명시적 리전 엔드포인트">
    **권장 대상:** 특정 Coding Plan 또는 일반 API 표면을 강제로 사용하려는 사용자.

    <Steps>
      <Step title="적절한 온보딩 옵션 선택">
        ```bash
        # Coding Plan Global(Coding Plan 사용자에게 권장)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN(중국 리전)
        openclaw onboard --auth-choice zai-coding-cn

        # 일반 API
        openclaw onboard --auth-choice zai-global

        # 일반 API CN(중국 리전)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="모델이 목록에 표시되는지 확인합니다">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### 엔드포인트

| 온보딩 선택         | 기본 URL                                       | 기본 모델     |
| ------------------- | ---------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                 | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`         | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`          | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4`  | `glm-5.2`     |

`zai-api-key`는 각 엔드포인트의 채팅 완성 API에 키를 대입해 요청을 수락하는지 확인하는 방식으로 이 네 가지 중 하나를 자동 감지합니다. 일반 엔드포인트(`zai-global`,
이어서 `zai-cn`)를 Coding Plan 엔드포인트(`zai-coding-global`, 이어서
`zai-coding-cn`)보다 먼저 확인하며, 요청을 수락하는 첫 번째 엔드포인트에서 중단합니다.
키가 양쪽 모두에서 작동하는 경우 Coding Plan 엔드포인트를 강제로 사용하려면 명시적으로 `--auth-choice`를
사용하십시오.

## 구성 예시

<Tip>
`zai-api-key`를 사용하면 OpenClaw가 키와 일치하는 Z.AI 엔드포인트를 감지하고
올바른 기본 URL을 자동으로 적용할 수 있습니다. 특정 Coding Plan 또는 일반 API
표면을 강제로 사용하려면 명시적인 리전 선택지를 사용하십시오.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2는 Coding Plan 엔드포인트를 사용합니다.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## 기본 제공 카탈로그

`zai` 제공자 Plugin은 Plugin 매니페스트에 카탈로그를 포함하여 제공하므로, 읽기 전용
목록에서 제공자 런타임을 로드하지 않고도 알려진 GLM 항목을 표시할 수 있습니다.

```bash
openclaw models list --all --provider zai
```

현재 매니페스트 기반 카탈로그에는 다음 항목이 포함되어 있습니다.

| 모델 참조              | 참고 사항                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Coding Plan 기본값, 1M 컨텍스트 |
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

<Note>
Coding Plan 설정의 기본값은 `zai/glm-5.2`이며, 일반 API 설정은
`zai/glm-5.1`을 유지합니다. Coding Plan 엔드포인트에서 키/플랜이 GLM-5.2를 제공하지 않으면 자동 감지가
`glm-5.1`, 그다음 `glm-4.7`로 대체됩니다. GLM
버전과 가용성은 변경될 수 있습니다. 설치된 버전에 알려진 카탈로그를 확인하려면
`openclaw models list --all --provider zai`를 실행하십시오.
</Note>

## 추론 수준

<Tabs>
  <Tab title="GLM-5.2">
    전체 범위는 `off`, `low`, `high`, `max`입니다(기본값 `off`). OpenClaw는
    요청 페이로드의 `reasoning_effort`를 통해 `low`와 `high`를 Z.AI의 `high` 추론 노력으로,
    `max`를 Z.AI의 `max` 노력으로 매핑합니다.
  </Tab>
  <Tab title="기타 GLM 모델">
    이진 토글만 지원합니다. `off`와 `low`(선택기에는 `on`으로 표시)이며, 기본값은
    `off`입니다. 추론을 `off`로 설정하면 `thinking: { type: "disabled" }`를 전송합니다.
    그 외 수준에서는 요청 페이로드를 변경하지 않습니다(Z.AI 자체의 기본
    추론 동작이 적용됩니다).
  </Tab>
</Tabs>

추론을 `off`로 설정하면 표시되는 텍스트보다 먼저 `reasoning_content`에
출력 예산을 소모하는 응답을 방지할 수 있습니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="알 수 없는 GLM-5 모델의 순방향 확인">
    알 수 없는 `glm-5*` ID도 현재 GLM-5 제품군 형식과 일치하면
    `glm-4.7` 템플릿에서 제공자 소유 메타데이터를 합성하여 제공자 경로에서
    계속 순방향 확인됩니다.
  </Accordion>

  <Accordion title="도구 호출 스트리밍">
    Z.AI 도구 호출 스트리밍에는 기본적으로 `tool_stream`이 활성화됩니다. 비활성화하려면 다음과 같이 설정하십시오.

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

  <Accordion title="보존된 추론">
    Z.AI는 전체 과거 `reasoning_content`를 재생해야 하므로 프롬프트 토큰이 증가합니다.
    따라서 보존된 추론은 선택적으로 활성화해야 합니다. 모델별로 활성화하십시오.

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

    활성화되어 있고 추론이 켜져 있으면 OpenClaw는
    `thinking: { type: "enabled", clear_thinking: false }`를 전송하고 동일한
    OpenAI 호환 트랜스크립트의 이전 `reasoning_content`를 재생합니다. 스네이크 케이스
    `preserve_thinking` 매개변수 키도 별칭으로 사용할 수 있습니다.

    고급 사용자는 `params.extra_body.thinking`으로 정확한 제공자 페이로드를
    계속 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="이미지 이해">
    Z.AI Plugin은 이미지 이해 기능을 등록합니다.

    | 속성      | 값       |
    | ------------- | ----------- |
    | 모델         | `glm-4.6v`  |

    이미지 이해 기능은 구성된 Z.AI 인증에서 자동으로 확인되므로
    추가 구성이 필요하지 않습니다.

  </Accordion>

  <Accordion title="인증 세부 정보">
    - Z.AI는 API 키와 함께 Bearer 인증을 사용합니다.
    - `zai-api-key` 온보딩 선택지는 해당 키로 지원되는 엔드포인트를 탐색하여 일치하는 Z.AI 엔드포인트를 자동 감지합니다.
    - 특정 API 표면을 강제로 사용하려면 명시적 리전 선택지(`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)를 사용하십시오.
    - 기존 환경 변수 `Z_AI_API_KEY`도 계속 허용됩니다. 시작 시 `ZAI_API_KEY`가 설정되지 않은 경우 OpenClaw가 해당 값을 `ZAI_API_KEY`로 복사합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 및 모델 설정을 포함한 전체 OpenClaw 구성 스키마입니다.
  </Card>
</CardGroup>
