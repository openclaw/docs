---
read_when:
    - OpenClaw에서 Chutes를 사용하려는 경우
    - OAuth 또는 API 키 설정 경로가 필요한 경우
    - 기본 모델, 별칭 또는 discovery 동작을 알고 싶은 경우
summary: Chutes 설정(OAuth 또는 API 키, 모델 검색, 별칭)
title: Chutes
x-i18n:
    generated_at: "2026-04-24T06:29:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai)는 OpenAI 호환 API를 통해 오픈 소스 모델 카탈로그를 제공합니다. OpenClaw는 번들 `chutes` provider에 대해 브라우저 OAuth와 직접 API 키 인증을 모두 지원합니다.

| 속성 | 값 |
| -------- | ---------------------------- |
| Provider | `chutes` |
| API | OpenAI 호환 |
| Base URL | `https://llm.chutes.ai/v1` |
| 인증 | OAuth 또는 API 키(아래 참조) |

## 시작하기

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth 온보딩 흐름 실행">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw는 로컬에서는 브라우저 흐름을 시작하고, 원격/헤드리스 호스트에서는 URL + 리디렉션 붙여넣기
        흐름을 표시합니다. OAuth 토큰은 OpenClaw auth
        profile을 통해 자동으로 갱신됩니다.
      </Step>
      <Step title="기본 모델 확인">
        온보딩 후 기본 모델은
        `chutes/zai-org/GLM-4.7-TEE`로 설정되고, 번들 Chutes 카탈로그가
        등록됩니다.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 키">
    <Steps>
      <Step title="API 키 받기">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)에서
        키를 생성하세요.
      </Step>
      <Step title="API 키 온보딩 흐름 실행">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="기본 모델 확인">
        온보딩 후 기본 모델은
        `chutes/zai-org/GLM-4.7-TEE`로 설정되고, 번들 Chutes 카탈로그가
        등록됩니다.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
두 인증 경로 모두 번들 Chutes 카탈로그를 등록하고 기본 모델을
`chutes/zai-org/GLM-4.7-TEE`로 설정합니다. 런타임 환경 변수: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## discovery 동작

Chutes 인증을 사용할 수 있으면 OpenClaw는 해당
자격 증명으로 Chutes 카탈로그를 조회하고, 발견된 모델을 사용합니다. discovery가 실패하면 OpenClaw는
번들 정적 카탈로그로 대체하여 온보딩과 시작이 계속 동작하게 합니다.

## 기본 별칭

OpenClaw는 번들 Chutes 카탈로그에 대해 세 가지 편의 별칭을 등록합니다.

| 별칭 | 대상 모델 |
| --------------- | ----------------------------------------------------- |
| `chutes-fast` | `chutes/zai-org/GLM-4.7-FP8` |
| `chutes-pro` | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 내장 시작용 카탈로그

번들 대체 카탈로그에는 현재 Chutes ref가 포함됩니다.

| 모델 ref |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE` |
| `chutes/zai-org/GLM-5-TEE` |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE` |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE` |
| `chutes/openai/gpt-oss-120b-TEE` |

## 설정 예시

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth 재정의">
    선택적 환경 변수를 사용해 OAuth 흐름을 사용자 지정할 수 있습니다.

    | 변수 | 용도 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | 사용자 지정 OAuth 클라이언트 ID |
    | `CHUTES_CLIENT_SECRET` | 사용자 지정 OAuth 클라이언트 secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | 사용자 지정 redirect URI |
    | `CHUTES_OAUTH_SCOPES` | 사용자 지정 OAuth scopes |

    redirect 앱 요구 사항과 도움말은 [Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview)를
    참조하세요.

  </Accordion>

  <Accordion title="참고">
    - API 키와 OAuth discovery는 모두 동일한 `chutes` provider id를 사용합니다.
    - Chutes 모델은 `chutes/<model-id>` 형식으로 등록됩니다.
    - 시작 시 discovery가 실패하면 번들 정적 카탈로그가 자동으로 사용됩니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider 규칙, 모델 ref, 장애 조치 동작
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider 설정을 포함한 전체 설정 스키마
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 대시보드 및 API 문서
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API 키 생성 및 관리
  </Card>
</CardGroup>
