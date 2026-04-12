---
read_when:
    - 여러 LLM에 하나의 API 키를 사용하려고 합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 합니다
summary: OpenClaw에서 OpenRouter의 통합 API를 사용해 다양한 모델에 접근하기
title: OpenRouter
x-i18n:
    generated_at: "2026-04-12T23:32:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9083c30b9e9846a9d4ef071c350576d4c3083475f4108871eabbef0b9bb9a368
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter는 단일 엔드포인트와 API 키 뒤에서 요청을 많은 모델로 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 base URL만 바꾸면 동작합니다.

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 생성하세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(선택 사항) 특정 모델로 전환">
    온보딩의 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택할 수 있습니다:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 구성 예시

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 모델 참조

<Note>
모델 참조는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한 provider와 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참고하세요.
</Note>

## 인증 및 헤더

OpenRouter는 내부적으로 API 키를 사용한 Bearer 토큰을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서는 OpenClaw가 OpenRouter 문서에 있는 앱 귀속 헤더도 추가합니다:

| 헤더 | 값 |
| ------------------------- | --------------------- |
| `HTTP-Referer` | `https://openclaw.ai` |
| `X-OpenRouter-Title` | `OpenClaw` |
| `X-OpenRouter-Categories` | `cli-agent` |

<Warning>
OpenRouter provider를 다른 프록시나 base URL로 다시 지정하면 OpenClaw는 이러한 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 주입하지 않습니다.
</Warning>

## 고급 참고 사항

<AccordionGroup>
  <Accordion title="Anthropic 캐시 마커">
    확인된 OpenRouter 경로에서는 Anthropic 모델 참조가 OpenClaw가 system/developer 프롬프트 블록에서 더 나은 프롬프트 캐시 재사용을 위해 사용하는 OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Thinking / 추론 주입">
    지원되는 non-`auto` 경로에서 OpenClaw는 선택한 thinking 수준을 OpenRouter 프록시 추론 페이로드로 매핑합니다. 지원되지 않는 모델 힌트와 `openrouter/auto`는 이 추론 주입을 건너뜁니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 셰이핑">
    OpenRouter는 여전히 프록시 스타일 OpenAI 호환 경로를 사용하므로, `serviceTier`, Responses `store`, OpenAI 추론 호환 페이로드, 프롬프트 캐시 힌트 같은 기본 OpenAI 전용 요청 셰이핑은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter 참조는 프록시-Gemini 경로에 그대로 남습니다. OpenClaw는 그곳에서 Gemini thought-signature 정리를 유지하지만, 기본 Gemini 재생 검증이나 부트스트랩 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Provider 라우팅 메타데이터">
    모델 params 아래에 OpenRouter provider 라우팅을 전달하면 OpenClaw는 공유 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    agent, 모델, provider를 위한 전체 구성 참조.
  </Card>
</CardGroup>
