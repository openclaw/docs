---
read_when:
    - OpenClaw에서 Chutes를 사용하려는 경우
    - OAuth 또는 API 키 설정 경로가 필요합니다
    - 기본 모델, 별칭 또는 검색 동작을 원하는 경우
summary: Chutes 설정(OAuth 또는 API 키, 모델 검색, 별칭)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T01:06:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai)는 OpenAI 호환 API를 통해 오픈 소스 모델 카탈로그를 제공합니다. OpenClaw는 브라우저 OAuth와 API 키 인증을 모두 지원합니다.

| 속성             | 값                                                      |
| ---------------- | ------------------------------------------------------- |
| 제공자           | `chutes`                                                |
| Plugin           | 공식 외부 패키지(`@openclaw/chutes-provider`)           |
| API              | OpenAI 호환                                             |
| 기본 URL         | `https://llm.chutes.ai/v1`                              |
| 인증             | OAuth 또는 API 키(아래 참조)                            |
| 런타임 환경 변수 | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN`은 이미 발급받은 OAuth 액세스 토큰을 직접 제공합니다(예: CI에서 사용). 이 경우 아래의 대화형 브라우저 흐름을 건너뜁니다.

## Plugin 설치

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## 시작하기

두 경로 모두 기본 모델을 `chutes/zai-org/GLM-4.7-TEE`로 설정하고 Chutes 카탈로그를 등록합니다.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth 온보딩 흐름 실행">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw는 로컬에서 브라우저 흐름을 시작하거나 원격/헤드리스 호스트에서 URL과 리디렉션 주소 붙여넣기 흐름을 표시합니다. OAuth 토큰은 OpenClaw 인증 프로필을 통해 자동으로 갱신됩니다.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API 키">
    <Steps>
      <Step title="API 키 발급">
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)에서 키를 생성합니다.
      </Step>
      <Step title="API 키 온보딩 흐름 실행">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## 탐색 동작

Chutes 인증을 사용할 수 있으면 OpenClaw는 해당 자격 증명으로 `GET /v1/models`를 요청하고 탐색된 모델을 사용하며, 자격 증명별로 5분간 캐시합니다. 만료되었거나 권한이 없는 키(HTTP 401)의 경우 OpenClaw는 자격 증명 없이 한 번 재시도합니다. 탐색 결과가 여전히 비어 있거나, 실패하거나, 그 밖의 2xx가 아닌 상태를 반환하면 번들로 제공되는 정적 카탈로그로 대체합니다(API 키 및 OAuth 탐색 모두 동일한 경로를 사용합니다). 시작 시 탐색에 실패하면 정적 카탈로그가 자동으로 사용됩니다.

## 기본 별칭

OpenClaw는 Chutes 카탈로그에 편의를 위한 별칭 세 개를 등록합니다.

| 별칭            | 대상 모델                                             |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## 기본 제공 시작용 카탈로그

번들 대체 카탈로그에는 47개 모델이 있습니다. 다음은 현재 참조의 대표적인 예입니다.

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

전체 목록을 보려면 `openclaw models list --all --provider chutes`를 실행하세요.

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
    선택적 환경 변수를 사용하여 OAuth 흐름을 맞춤 설정할 수 있습니다.

    | 변수 | 용도 |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth 클라이언트 ID(설정하지 않으면 입력 요청) |
    | `CHUTES_CLIENT_SECRET` | OAuth 클라이언트 시크릿 |
    | `CHUTES_OAUTH_REDIRECT_URI` | 리디렉션 URI(기본값 `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | 공백으로 구분된 범위(기본값 `openid profile chutes:invoke`) |

    리디렉션 앱 요구 사항과 도움말은 [Chutes OAuth 문서](https://chutes.ai/docs/sign-in-with-chutes/overview)를 참조하세요.

  </Accordion>

  <Accordion title="참고">
    - Chutes 모델은 `chutes/<model-id>` 형식으로 등록됩니다.
    - Chutes는 스트리밍 중 토큰 사용량을 보고하지 않습니다(`supportsUsageInStreaming: false`). 스트림이 완료되면 사용량 합계는 계속 표시됩니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자 규칙, 모델 참조 및 장애 조치 동작입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes 대시보드 및 API 문서입니다.
  </Card>
  <Card title="Chutes API 키" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API 키를 생성하고 관리합니다.
  </Card>
</CardGroup>
