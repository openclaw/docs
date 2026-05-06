---
read_when:
    - 여러 LLM에 사용할 단일 API 키가 필요합니다
    - OpenClaw에서 Kilo Gateway를 통해 모델을 실행하려는 경우
summary: Kilo Gateway의 통합 API로 OpenClaw에서 다양한 모델에 액세스하기
title: Kilo Gateway
x-i18n:
    generated_at: "2026-05-06T17:59:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6105f5aafa0a36de2b140909e8dd21234aa8284259367a49c67d7040eaa0a93c
    source_path: providers/kilocode.md
    workflow: 16
---

Kilo Gateway는 단일 엔드포인트와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 기본 URL만 변경하면 작동합니다.

| 속성 | 값                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 호환                  |
| 기본 URL | `https://api.kilo.ai/api/gateway/` |

## 시작하기

<Steps>
  <Step title="계정 만들기">
    [app.kilo.ai](https://app.kilo.ai)로 이동해 로그인하거나 계정을 만든 다음, API Keys로 이동하여 새 키를 생성합니다.
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

## 기본 모델

기본 모델은 Kilo Gateway가 관리하는 공급자 소유 스마트 라우팅
모델인 `kilocode/kilo/auto`입니다.

<Note>
OpenClaw는 `kilocode/kilo/auto`를 안정적인 기본 참조로 취급하지만, 해당 경로에 대한
소스 기반 작업-업스트림 모델 매핑을 게시하지 않습니다. `kilocode/kilo/auto` 뒤의 정확한
업스트림 라우팅은 OpenClaw에 하드코딩되어 있지 않고 Kilo Gateway가 소유합니다.
</Note>

## 내장 카탈로그

OpenClaw는 시작 시 Kilo Gateway에서 사용 가능한 모델을 동적으로 검색합니다. 계정에서 사용 가능한 전체 모델 목록을 보려면
`/models kilocode`를 사용하세요.

Gateway에서 사용 가능한 모든 모델은 `kilocode/` 접두사와 함께 사용할 수 있습니다.

| 모델 참조                              | 참고                              |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | 기본값 — 스마트 라우팅            |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo를 통한 Anthropic                 |
| `kilocode/openai/gpt-5.5`              | Kilo를 통한 OpenAI                    |
| `kilocode/google/gemini-3-pro-preview` | Kilo를 통한 Google                    |
| ...그리고 더 많은 모델                       | 전체 목록은 `/models kilocode` 사용 |

<Tip>
시작 시 OpenClaw는 `GET https://api.kilo.ai/api/gateway/models`를 쿼리하고
검색된 모델을 정적 폴백 카탈로그보다 앞에 병합합니다. 번들된 폴백에는 항상
`input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`을 포함하는
`kilocode/kilo/auto`(`Kilo Auto`)가 포함됩니다.
</Tip>

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

<AccordionGroup>
  <Accordion title="전송 및 호환성">
    Kilo Gateway는 소스에서 OpenRouter 호환으로 문서화되어 있으므로 네이티브 OpenAI 요청 형태가 아니라
    프록시 스타일의 OpenAI 호환 경로에 유지됩니다.

    - Gemini 기반 Kilo 참조는 프록시 Gemini 경로에 유지되므로 OpenClaw는
      네이티브 Gemini 재생 검증이나 부트스트랩 재작성을 활성화하지 않고도
      그곳에서 Gemini 사고 서명 정리를 유지합니다.
    - Kilo Gateway는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.

  </Accordion>

  <Accordion title="스트림 래퍼 및 추론">
    Kilo의 공유 스트림 래퍼는 공급자 앱 헤더를 추가하고 지원되는 구체적인 모델 참조에 대해
    프록시 추론 페이로드를 정규화합니다.

    <Warning>
    `kilocode/kilo/auto` 및 다른 프록시 추론 미지원 힌트는 추론
    주입을 건너뜁니다. 추론 지원이 필요하면
    `kilocode/anthropic/claude-sonnet-4` 같은 구체적인 모델 참조를 사용하세요.
    </Warning>

  </Accordion>

  <Accordion title="문제 해결">
    - 시작 시 모델 검색에 실패하면 OpenClaw는 `kilocode/kilo/auto`가 포함된 번들 정적 카탈로그로 폴백합니다.
    - API 키가 유효하고 Kilo 계정에서 원하는 모델이 활성화되어 있는지 확인하세요.
    - Gateway가 데몬으로 실행되는 경우 해당 프로세스에서 `KILOCODE_API_KEY`를 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    전체 OpenClaw 구성 참조.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 대시보드, API 키, 계정 관리.
  </Card>
</CardGroup>
