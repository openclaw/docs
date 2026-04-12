---
read_when:
    - 여러 LLM에 대해 하나의 API 키를 사용하고 싶습니다
    - OpenClaw에서 Kilo Gateway를 통해 모델을 실행하고 싶습니다
summary: OpenClaw에서 Kilo Gateway의 통합 API를 사용해 다양한 모델에 액세스하기
title: Kilocode
x-i18n:
    generated_at: "2026-04-12T23:31:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32946f2187f3933115341cbe81006718b10583abc4deea7440b5e56366025f4a
    source_path: providers/kilocode.md
    workflow: 15
---

# Kilo Gateway

Kilo Gateway는 단일 엔드포인트와 API 키 뒤에서 다양한 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로, 대부분의 OpenAI SDK는 base URL만 바꾸면 사용할 수 있습니다.

| Property | Value                              |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| Auth     | `KILOCODE_API_KEY`                 |
| API      | OpenAI 호환                        |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 시작하기

<Steps>
  <Step title="계정 만들기">
    [app.kilo.ai](https://app.kilo.ai)로 이동해 로그인하거나 계정을 만든 다음, API Keys로 이동해 새 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    또는 환경 변수를 직접 설정하세요.

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

기본 모델은 Kilo Gateway가 관리하는 provider 소유의 스마트 라우팅 모델인 `kilocode/kilo/auto`입니다.

<Note>
OpenClaw는 `kilocode/kilo/auto`를 안정적인 기본 ref로 취급하지만, 이 경로에 대한 작업별 업스트림 모델 매핑을 소스 근거와 함께 공개하지는 않습니다. `kilocode/kilo/auto` 뒤의 정확한 업스트림 라우팅은 OpenClaw에 하드코딩되어 있지 않고 Kilo Gateway가 관리합니다.
</Note>

## 사용 가능한 모델

OpenClaw는 시작 시 Kilo Gateway에서 사용 가능한 모델을 동적으로 검색합니다. 계정에서 사용할 수 있는 전체 모델 목록은 `/models kilocode`를 사용해 확인하세요.

Gateway에서 사용할 수 있는 모든 모델은 `kilocode/` 접두사와 함께 사용할 수 있습니다.

| Model ref                              | 참고                             |
| -------------------------------------- | -------------------------------- |
| `kilocode/kilo/auto`                   | 기본값 — 스마트 라우팅           |
| `kilocode/anthropic/claude-sonnet-4`   | Kilo를 통한 Anthropic            |
| `kilocode/openai/gpt-5.4`              | Kilo를 통한 OpenAI               |
| `kilocode/google/gemini-3-pro-preview` | Kilo를 통한 Google               |
| ...and many more                       | 전체 목록은 `/models kilocode` 사용 |

<Tip>
시작 시 OpenClaw는 `GET https://api.kilo.ai/api/gateway/models`를 쿼리하고, 검색된 모델을 정적 fallback 카탈로그보다 앞서 병합합니다. 번들 fallback에는 항상 `kilocode/kilo/auto` (`Kilo Auto`)가 포함되며, `input: ["text", "image"]`, `reasoning: true`, `contextWindow: 1000000`, `maxTokens: 128000`으로 설정됩니다.
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
    Kilo Gateway는 소스에서 OpenRouter 호환으로 문서화되어 있으므로, 기본 OpenAI 요청 형식이 아니라 프록시 스타일 OpenAI 호환 경로를 유지합니다.

    - Gemini 기반 Kilo ref는 프록시-Gemini 경로를 유지하므로, OpenClaw는 해당 경로에서 native Gemini 재생 검증이나 bootstrap 재작성 없이 Gemini thought-signature 정리를 계속 적용합니다.
    - Kilo Gateway는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.

  </Accordion>

  <Accordion title="스트림 래퍼와 reasoning">
    Kilo의 공유 스트림 래퍼는 provider app 헤더를 추가하고 지원되는 구체적 모델 ref에 대해 프록시 reasoning payload를 정규화합니다.

    <Warning>
    `kilocode/kilo/auto` 및 기타 프록시 reasoning 미지원 힌트는 reasoning 주입을 건너뜁니다. reasoning 지원이 필요하면 `kilocode/anthropic/claude-sonnet-4` 같은 구체적 모델 ref를 사용하세요.
    </Warning>

  </Accordion>

  <Accordion title="문제 해결">
    - 시작 시 모델 검색이 실패하면 OpenClaw는 `kilocode/kilo/auto`가 포함된 번들 정적 카탈로그로 fallback합니다.
    - API 키가 유효한지, 그리고 Kilo 계정에서 원하는 모델이 활성화되어 있는지 확인하세요.
    - Gateway가 데몬으로 실행되는 경우, 해당 프로세스에서 `KILOCODE_API_KEY`를 사용할 수 있어야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작을 선택합니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration" icon="gear">
    OpenClaw 전체 구성 참조입니다.
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 대시보드, API 키, 계정 관리입니다.
  </Card>
</CardGroup>
