---
read_when:
    - OpenClaw에서 GLM 모델을 사용하려는 경우
    - 모델 명명 규칙과 설정이 필요합니다
summary: GLM 모델 제품군 개요 및 OpenClaw에서 사용하는 방법
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T06:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM은 [Z.AI](https://z.ai) 플랫폼을 통해 사용할 수 있는 모델 패밀리(회사 아님)입니다. OpenClaw에서는 `zai/glm-5.1` 같은 참조를 사용해 번들 포함된 `zai` provider를 통해 GLM 모델에 접근합니다.

| 속성                | 값                                                                          |
| ------------------- | --------------------------------------------------------------------------- |
| Provider ID         | `zai`                                                                       |
| Plugin              | 번들 포함, `enabledByDefault: true`                                         |
| 인증 환경 변수      | `ZAI_API_KEY` 또는 `Z_AI_API_KEY`                                           |
| 온보딩 선택지       | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                 | OpenAI 호환                                                                 |
| 기본 base URL       | `https://api.z.ai/api/paas/v4`                                              |
| 권장 기본값         | `zai/glm-5.1`                                                               |
| 기본 이미지 모델    | `zai/glm-4.6v`                                                              |

## 시작하기

<Steps>
  <Step title="인증 경로를 선택하고 온보딩 실행">
    사용 중인 Z.AI 플랜과 지역에 맞는 온보딩 선택지를 고르세요. 일반 `zai-api-key` 선택지는 키 형태에서 일치하는 엔드포인트를 자동 감지합니다. 특정 Coding Plan 또는 일반 API 표면을 강제로 사용하려면 명시적 지역 선택지를 사용하세요.

    | 인증 선택지         | 가장 적합한 경우                                    |
    | ------------------- | --------------------------------------------------- |
    | `zai-api-key`       | 엔드포인트 자동 감지가 필요한 일반 API 키           |
    | `zai-coding-global` | Coding Plan 사용자(글로벌)                          |
    | `zai-coding-cn`     | Coding Plan 사용자(중국 지역)                       |
    | `zai-global`        | 일반 API(글로벌)                                    |
    | `zai-cn`            | 일반 API(중국 지역)                                 |

    <CodeGroup>

```bash Auto-detect
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash General API (global)
openclaw onboard --auth-choice zai-global
```

```bash General API (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="GLM을 기본 모델로 설정">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## 구성 예시

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
  `zai-api-key`를 사용하면 OpenClaw가 키 형태에서 일치하는 Z.AI 엔드포인트를 감지하고 올바른 base URL을 자동으로 적용할 수 있습니다. 특정 Coding Plan 또는 일반 API 표면을 고정하려면 명시적 지역 선택지를 사용하세요.
</Tip>

## 기본 제공 카탈로그

번들 포함된 `zai` provider는 13개의 GLM 모델 참조를 시드합니다. 별도로 표시되지 않은 한 모든 항목은 추론을 지원합니다. `glm-5v-turbo`와 `glm-4.6v`는 텍스트뿐 아니라 이미지 입력도 받습니다.

| 모델 참조            | 참고 사항                                          |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | 기본 모델. 추론, 텍스트 전용, 202k 컨텍스트.      |
| `zai/glm-5`          | 추론, 텍스트 전용, 202k 컨텍스트.                 |
| `zai/glm-5-turbo`    | 추론, 텍스트 전용, 202k 컨텍스트.                 |
| `zai/glm-5v-turbo`   | 추론, 텍스트 + 이미지, 202k 컨텍스트.             |
| `zai/glm-4.7`        | 추론, 텍스트 전용, 204k 컨텍스트.                 |
| `zai/glm-4.7-flash`  | 추론, 텍스트 전용, 200k 컨텍스트.                 |
| `zai/glm-4.7-flashx` | 추론, 텍스트 전용.                                |
| `zai/glm-4.6`        | 추론, 텍스트 전용.                                |
| `zai/glm-4.6v`       | 추론, 텍스트 + 이미지. 기본 이미지 모델.          |
| `zai/glm-4.5`        | 추론, 텍스트 전용.                                |
| `zai/glm-4.5-air`    | 추론, 텍스트 전용.                                |
| `zai/glm-4.5-flash`  | 추론, 텍스트 전용.                                |
| `zai/glm-4.5v`       | 추론, 텍스트 + 이미지.                            |

<Note>
  GLM 버전과 사용 가능 여부는 변경될 수 있습니다. 설치된 버전이 알고 있는 카탈로그 행을 보려면 `openclaw models list --provider zai`를 실행하고, 새로 추가되었거나 더 이상 권장되지 않는 모델은 Z.AI 문서를 확인하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="엔드포인트 자동 감지">
    `zai-api-key` 인증 선택지를 사용하면 OpenClaw가 키 형태를 검사해 올바른 Z.AI base URL을 결정합니다. 명시적 지역 선택지(`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`)는 자동 감지를 재정의하고 엔드포인트를 직접 고정합니다.
  </Accordion>

  <Accordion title="Provider 세부 정보">
    GLM 모델은 `zai` 런타임 provider에서 제공됩니다. 전체 provider 구성, 지역 엔드포인트, 추가 기능은 [Z.AI provider 페이지](/ko/providers/zai)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Z.AI provider" href="/ko/providers/zai" icon="server">
    전체 Z.AI provider 구성과 지역 엔드포인트입니다.
  </Card>
  <Card title="모델 provider" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택입니다.
  </Card>
  <Card title="사고 모드" href="/ko/tools/thinking" icon="brain">
    추론 가능한 GLM 패밀리를 위한 `/think` 수준입니다.
  </Card>
  <Card title="모델 FAQ" href="/ko/help/faq-models" icon="circle-question">
    인증 프로필, 모델 전환, "no profile" 오류 해결입니다.
  </Card>
</CardGroup>
