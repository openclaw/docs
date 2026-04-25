---
read_when:
    - 여러 LLM에 대해 단일 API 키를 원함
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 함
    - 이미지 생성을 위해 OpenRouter를 사용하려고 함
summary: OpenClaw에서 많은 모델에 액세스하기 위해 OpenRouter의 통합 API 사용
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T18:21:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5396b0a022746cf3dfc90fa2d0974ffe9798af1ac790e93d13398a9e622eceff
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter는 단일
엔드포인트와 API 키 뒤에서 많은 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로, 대부분의 OpenAI SDK는 base URL만 바꿔서 사용할 수 있습니다.

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

## Config 예시

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

## Model ref

<Note>
Model ref는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한
provider 및 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

번들된 대체 예시:

| Model ref                            | 참고                          |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | OpenRouter 자동 라우팅        |
| `openrouter/moonshotai/kimi-k2.6`    | MoonshotAI를 통한 Kimi K2.6   |
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
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw는 이미지 요청을 `modalities: ["image", "text"]`와 함께 OpenRouter의 chat completions 이미지 API로 보냅니다. Gemini 이미지 모델은 지원되는 `aspectRatio` 및 `resolution` 힌트를 OpenRouter의 `image_config`를 통해 받습니다. 더 느린 OpenRouter 이미지 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하세요. `image_generate` 도구의 호출별 `timeoutMs` 파라미터가 여전히 우선합니다.

## 텍스트 음성 변환

OpenRouter는 OpenAI 호환
`/audio/speech` 엔드포인트를 통해 TTS provider로도 사용할 수 있습니다.

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
`models.providers.openrouter.apiKey`, 그다음 `OPENROUTER_API_KEY`를 재사용합니다.

## 인증 및 헤더

OpenRouter는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서는 OpenClaw가
OpenRouter 문서화된 앱 attribution 헤더도 추가합니다:

| 헤더                      | 값                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter provider를 다른 proxy 또는 base URL로 다시 지정하면, OpenClaw는
이러한 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 주입하지 **않습니다**.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="Anthropic 캐시 마커">
    확인된 OpenRouter 경로에서 Anthropic model ref는 OpenClaw가
    system/developer prompt 블록에서 더 나은 prompt-cache 재사용을 위해 사용하는
    OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 non-`auto` 경로에서 OpenClaw는 선택된 thinking 수준을
    OpenRouter proxy reasoning payload로 매핑합니다. 지원되지 않는 모델 힌트와
    `openrouter/auto`는 해당 reasoning 주입을 건너뜁니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 셰이핑">
    OpenRouter는 여전히 proxy 스타일 OpenAI 호환 경로를 통해 실행되므로,
    `serviceTier`, Responses `store`,
    OpenAI reasoning 호환 payload 및 prompt-cache 힌트 같은 기본 OpenAI 전용 요청 셰이핑은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter ref는 proxy-Gemini 경로에 그대로 머뭅니다. OpenClaw는
    그 경로에서 Gemini thought-signature 정리를 유지하지만, 기본 Gemini
    재생 검증이나 bootstrap 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Provider 라우팅 메타데이터">
    model params 아래에 OpenRouter provider 라우팅을 전달하면, OpenClaw는
    공유 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref 및 장애 조치 동작 선택입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    agents, 모델 및 provider에 대한 전체 config 참조입니다.
  </Card>
</CardGroup>
