---
read_when:
    - OpenClaw와 함께 Chutes를 사용하려는 경우
    - OAuth 또는 API 키 설정 경로가 필요합니다
    - 기본 모델, 별칭 또는 탐색 동작이 필요한 경우
summary: Chutes 설정(OAuth 또는 API 키, 모델 검색, 별칭)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:00:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai)는 OpenAI 호환 API를 통해 오픈 소스 모델 카탈로그를 제공합니다. OpenClaw는 `chutes` 공급자에 대해 브라우저 OAuth와 직접 API 키 인증을 모두 지원합니다.

| 속성 | 값                         |
| -------- | ---------------------------- |
| 공급자 | `chutes`                     |
| API      | OpenAI 호환            |
| 기본 URL | `https://llm.chutes.ai/v1`   |
| 인증     | OAuth 또는 API 키(아래 참조) |

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## 시작하기

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth 온보딩 흐름 실행">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw는 브라우저 흐름을 로컬에서 시작하거나, 원격/헤드리스 호스트에서는 URL + 리디렉션 붙여넣기 흐름을 표시합니다. OAuth 토큰은 OpenClaw 인증 프로필을 통해 자동으로 갱신됩니다.
      </Step>
      <Step title="기본 모델 확인">
        온보딩 후 기본 모델은 `chutes/zai-org/GLM-4.7-TEE`로 설정되고 Chutes 정적 카탈로그가 등록됩니다.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 키">
    <Steps>
      <Step title="API 키 받기">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)에서 키를 생성합니다.
      </Step>
      <Step title="API 키 온보딩 흐름 실행">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="기본 모델 확인">
        온보딩 후 기본 모델은 `chutes/zai-org/GLM-4.7-TEE`로 설정되고 Chutes 정적 카탈로그가 등록됩니다.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
두 인증 경로 모두 Chutes 정적 카탈로그를 등록하고 기본 모델을 `chutes/zai-org/GLM-4.7-TEE`로 설정합니다. 런타임 환경 변수: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`.
</Note>

## 검색 동작

Chutes 인증을 사용할 수 있으면 OpenClaw는 해당 자격 증명으로 Chutes 카탈로그를 조회하고 검색된 모델을 사용합니다. 검색에 실패하면 OpenClaw는 정적 카탈로그로 대체하여 온보딩과 시작이 계속 작동하도록 합니다.

## 기본 별칭

OpenClaw는 Chutes 정적 카탈로그에 대해 세 가지 편의 별칭을 등록합니다.

| 별칭           | 대상 모델                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 내장 스타터 카탈로그

정적 대체 카탈로그에는 현재 Chutes 참조가 포함됩니다.

| 모델 참조                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## 구성 예시

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
    선택적 환경 변수로 OAuth 흐름을 사용자 지정할 수 있습니다.

    | 변수 | 목적 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | 사용자 지정 OAuth 클라이언트 ID |
    | `CHUTES_CLIENT_SECRET` | 사용자 지정 OAuth 클라이언트 시크릿 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 사용자 지정 리디렉션 URI |
    | `CHUTES_OAUTH_SCOPES` | 사용자 지정 OAuth 범위 |

    리디렉션 앱 요구 사항과 도움말은 [Chutes OAuth 문서](https://chutes.ai/docs/sign-in-with-chutes/overview)를 참조하세요.

  </Accordion>

  <Accordion title="참고">
    - API 키와 OAuth 검색은 모두 동일한 `chutes` 공급자 ID를 사용합니다.
    - Chutes 모델은 `chutes/<model-id>`로 등록됩니다.
    - 시작 시 검색에 실패하면 정적 카탈로그가 자동으로 사용됩니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자 규칙, 모델 참조, 장애 조치 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    공급자 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 대시보드 및 API 문서입니다.
  </Card>
  <Card title="Chutes API 키" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API 키를 생성하고 관리합니다.
  </Card>
</CardGroup>
