---
read_when:
    - 여러 LLM에 하나의 API 키를 사용하려는 경우
    - OpenClaw에서 Kilo Gateway를 통해 모델을 실행하려고 합니다
summary: Kilo Gateway의 통합 API를 사용하여 OpenClaw에서 다양한 모델에 액세스하세요
title: Kilo Gateway
x-i18n:
    generated_at: "2026-07-12T01:07:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2108e1bb5b2430f42bf9e798da1d5e40448f05d396ab1710a0d6708961960756
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway는 단일 OpenAI 호환 엔드포인트와 API 키를 통해 여러 모델로 요청을 라우팅합니다.

| 속성     | 값                                 |
| -------- | ---------------------------------- |
| 제공자   | `kilocode`                         |
| 인증     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 호환                        |
| 기본 URL | `https://api.kilo.ai/api/gateway/` |

## Plugin 설치

```bash
openclaw plugins install @openclaw/kilocode-provider
openclaw gateway restart
```

## 설정

<Steps>
  <Step title="계정 만들기">
    [app.kilo.ai](https://app.kilo.ai)로 이동하여 로그인하거나 계정을 만든 다음 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    또는 환경 변수를 직접 설정합니다.

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 기본 모델 및 카탈로그

기본 모델은 제공자가 관리하는 스마트 라우팅 모델인 `kilocode/kilo/auto`입니다. OpenClaw는 이 모델의
작업별 업스트림 모델 매핑을 공개하지 않으며, `kilo/auto` 내부의 라우팅은 Kilo Gateway가 관리합니다.

시작 시 OpenClaw는 `GET https://api.kilo.ai/api/gateway/models`를 조회하고 검색된 모델을
정적 대체 카탈로그보다 우선하여 병합합니다. 정적 대체 카탈로그에는 `kilocode/kilo/auto` (`Kilo Auto`,
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`)만 포함됩니다.

Gateway의 모든 모델은 `kilocode/<upstream-id>` 형식으로 지정할 수 있습니다(예:
`kilocode/anthropic/claude-sonnet-4`, `kilocode/openai/gpt-5.5`). 검색된 전체 목록을 확인하려면
`/models kilocode` 또는 `openclaw models list --provider kilocode`를 실행합니다.

## 구성 예시

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## 동작 참고 사항

<AccordionGroup>
  <Accordion title="전송 및 호환성">
    Kilo Gateway는 OpenRouter와 호환되므로 네이티브 OpenAI 요청 형식 대신 프록시 방식의
    OpenAI 호환 요청 경로를 사용합니다(`store` 없음, OpenAI 추론 노력 수준 페이로드 없음).

    - Gemini 기반 Kilo 참조는 프록시 Gemini 경로를 계속 사용합니다. OpenClaw는 이 경로에서 Gemini 사고
      서명을 정리하지만 네이티브 Gemini 재실행 검증 또는 부트스트랩 재작성은 활성화하지 않습니다.
    - 요청은 API 키로 생성한 Bearer 토큰을 사용합니다.

  </Accordion>

  <Accordion title="스트림 래퍼 및 추론">
    Kilo 스트림 래퍼는 `X-KILOCODE-FEATURE` 요청 헤더를 추가하고(기본값 `openclaw`,
    `KILOCODE_FEATURE` 환경 변수로 재정의 가능), 이를 지원하는 모델의 추론 노력 수준 페이로드를
    정규화합니다.

    <Warning>
    `kilocode/kilo/auto` 및 `x-ai/*` 참조에는 추론 노력 수준이 삽입되지 않습니다. 추론 지원이
    필요한 경우 `kilocode/anthropic/claude-sonnet-4`와 같은 구체적인 모델 참조를 사용하세요.
    </Warning>

  </Accordion>

  <Accordion title="문제 해결">
    - 시작 시 모델 검색에 실패하면 OpenClaw는 `kilocode/kilo/auto`가 포함된 정적 카탈로그를 대신 사용합니다.
    - API 키가 유효하며 Kilo 계정에서 원하는 모델이 활성화되어 있는지 확인하세요.
    - Gateway가 데몬으로 실행되는 경우 해당 프로세스에서 `KILOCODE_API_KEY`를 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv` 사용).

  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조입니다.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 대시보드, API 키 및 계정 관리입니다.
  </Card>
</CardGroup>
