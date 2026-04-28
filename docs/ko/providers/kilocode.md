---
read_when:
    - 여러 LLM에 대해 하나의 API 키를 원하는 경우
    - OpenClaw에서 Kilo Gateway를 통해 모델을 실행하려는 경우
summary: Kilo Gateway의 통합 API를 사용해 OpenClaw에서 여러 모델에 액세스하기
title: Kilocode
x-i18n:
    generated_at: "2026-04-24T06:31:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa3c29e7b39b1dfb049444c7ef2759555bb3f94479622d58fa2aa8fd6389d01f
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway는 단일
엔드포인트와 API 키 뒤에서 많은 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로, 대부분의 OpenAI SDK는 base URL만 바꾸면 동작합니다.

| 속성     | 값                                 |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| 인증     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 호환                        |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 시작하기

<Steps>
  <Step title="계정 만들기">
    [app.kilo.ai](https://app.kilo.ai)로 이동해 로그인하거나 계정을 만든 다음, API Keys로 이동하여 새 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    또는 환경 변수를 직접 설정:

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

## 기본 모델

기본 모델은 Kilo Gateway가 관리하는 provider 소유 smart-routing
모델인 `kilocode/kilo/auto`입니다.

<Note>
OpenClaw는 `kilocode/kilo/auto`를 안정적인 기본 ref로 취급하지만, 이 경로에 대한 작업-대-업스트림-모델 매핑을 소스 기반으로 공개하지는 않습니다. `kilocode/kilo/auto` 뒤의 정확한 업스트림 라우팅은 OpenClaw에 하드코딩된 것이 아니라 Kilo Gateway가 소유합니다.
</Note>

## 내장 카탈로그

OpenClaw는 시작 시 Kilo Gateway에서 사용 가능한 모델을 동적으로 확인합니다.
계정에서 사용할 수 있는 전체 모델 목록은 `/models kilocode`를 사용해 확인하세요.

gateway에서 사용 가능한 모든 모델은 `kilocode/` 접두사로 사용할 수 있습니다.

| 모델 ref                               | 참고                                |
| -------------------------------------- | ----------------------------------- |
| `kilocode/kilo/auto`                   | 기본값 — 스마트 라우팅              |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo를 통한 Anthropic               |
| `kilocode/openai/gpt-5.5`              | Kilo를 통한 OpenAI                  |
| `kilocode/google/gemini-3-pro-preview` | Kilo를 통한 Google                  |
| ...그 외 다수                          | 전체 목록은 `/models kilocode` 사용 |

<Tip>
시작 시 OpenClaw는 `GET https://api.kilo.ai/api/gateway/models`를 조회하고,
정적 fallback 카탈로그보다 앞서 발견된 모델을 병합합니다. 번들 fallback은 항상
`input: ["text", "image"]`,
`reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`을 가진
`kilocode/kilo/auto` (`Kilo Auto`)를 포함합니다.
</Tip>

## Config 예시

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

<AccordionGroup>
  <Accordion title="전송 및 호환성">
    Kilo Gateway는 소스에서 OpenRouter 호환으로 문서화되어 있으므로,
    native OpenAI 요청 형태가 아니라 프록시 스타일 OpenAI 호환 경로에 남아 있습니다.

    - Gemini 기반 Kilo ref는 프록시-Gemini 경로에 남아 있으므로, OpenClaw는
      native Gemini replay 검증이나 bootstrap 재작성은 활성화하지 않으면서
      해당 경로의 Gemini thought-signature 정리를 유지합니다.
    - Kilo Gateway는 내부적으로 API 키와 함께 Bearer token을 사용합니다.

  </Accordion>

  <Accordion title="Stream wrapper 및 reasoning">
    Kilo의 공용 stream wrapper는 provider 앱 헤더를 추가하고,
    지원되는 구체적 모델 ref에 대해 프록시 reasoning payload를 정규화합니다.

    <Warning>
    `kilocode/kilo/auto`와 다른 proxy-reasoning-unsupported 힌트는 reasoning
    주입을 건너뜁니다. reasoning 지원이 필요하면
    `kilocode/anthropic/claude-sonnet-4` 같은 구체적 모델 ref를 사용하세요.
    </Warning>

  </Accordion>

  <Accordion title="문제 해결">
    - 시작 시 모델 검색에 실패하면, OpenClaw는 `kilocode/kilo/auto`를 포함한 번들 정적 카탈로그로 대체합니다.
    - API 키가 유효하고 Kilo 계정에서 원하는 모델이 활성화되어 있는지 확인하세요.
    - Gateway가 데몬으로 실행될 때는 `KILOCODE_API_KEY`가 해당 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`).

  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, failover 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 대시보드, API 키, 계정 관리.
  </Card>
</CardGroup>
