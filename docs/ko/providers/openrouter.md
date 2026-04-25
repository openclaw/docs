---
read_when:
    - 여러 LLM에 대해 하나의 API 키를 사용하고 싶습니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 합니다
    - OpenRouter를 이미지 생성에 사용하려고 합니다
summary: OpenClaw에서 OpenRouter의 통합 API를 사용해 다양한 모델에 액세스하기
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T06:09:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter는 **통합 API**를 제공하여 하나의 엔드포인트와 API 키 뒤에서 많은 모델로 요청을 라우팅합니다. OpenAI 호환이므로, 대부분의 OpenAI SDK는 base URL만 바꾸면 그대로 동작합니다.

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
    온보딩 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택할 수 있습니다:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## config 예시

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
모델 ref는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한
공급자와 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참고하세요.
</Note>

번들 대체 예시:

| 모델 ref                            | 참고                           |
| ----------------------------------- | ------------------------------ |
| `openrouter/auto`                   | OpenRouter 자동 라우팅         |
| `openrouter/moonshotai/kimi-k2.6`   | MoonshotAI를 통한 Kimi K2.6    |
| `openrouter/openrouter/healer-alpha` | OpenRouter Healer Alpha 경로  |
| `openrouter/openrouter/hunter-alpha` | OpenRouter Hunter Alpha 경로  |

## 이미지 생성

OpenRouter는 `image_generate` 도구의 백엔드로도 사용할 수 있습니다. `agents.defaults.imageGenerationModel` 아래에 OpenRouter 이미지 모델을 사용하세요:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw는 이미지 요청을 `modalities: ["image", "text"]`와 함께 OpenRouter의 chat completions 이미지 API로 보냅니다. Gemini 이미지 모델은 지원되는 `aspectRatio` 및 `resolution` 힌트를 OpenRouter의 `image_config`를 통해 전달받습니다.

## 텍스트 음성 변환

OpenRouter는 OpenAI 호환 `/audio/speech` 엔드포인트를 통해 TTS 공급자로도 사용할 수 있습니다.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey`가 생략되면, TTS는
`models.providers.openrouter.apiKey`를 재사용하고, 그다음 `OPENROUTER_API_KEY`를 사용합니다.

## 인증 및 헤더

OpenRouter는 내부적으로 API 키를 사용한 Bearer 토큰을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서는 OpenClaw가
OpenRouter 문서에 나오는 앱 attribution 헤더도 추가합니다:

| 헤더                      | 값                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter 공급자를 다른 프록시 또는 base URL로 재지정하면, OpenClaw는
그 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 주입하지 **않습니다**.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="Anthropic 캐시 마커">
    확인된 OpenRouter 경로에서는 Anthropic 모델 ref가
    OpenClaw가 시스템/개발자 프롬프트 블록의 프롬프트 캐시 재사용을 향상시키기 위해 사용하는
    OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 non-`auto` 경로에서는 OpenClaw가 선택한 thinking 수준을
    OpenRouter 프록시 reasoning payload로 매핑합니다. 지원되지 않는 모델 힌트와
    `openrouter/auto`는 이 reasoning 주입을 건너뜁니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 형태 조정">
    OpenRouter는 여전히 프록시 스타일 OpenAI 호환 경로를 통해 실행되므로,
    `serviceTier`, Responses `store`,
    OpenAI reasoning 호환 payload, 프롬프트 캐시 힌트 같은 OpenAI 전용 요청 형태 조정은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter ref는 프록시-Gemini 경로에 머뭅니다. OpenClaw는
    여기서 Gemini thought-signature 정리를 유지하지만, 네이티브 Gemini
    replay 검증이나 bootstrap 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="공급자 라우팅 메타데이터">
    모델 매개변수 아래에 OpenRouter 공급자 라우팅을 전달하면, OpenClaw는
    공통 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 ref, 대체 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 공급자에 대한 전체 config 참조.
  </Card>
</CardGroup>
