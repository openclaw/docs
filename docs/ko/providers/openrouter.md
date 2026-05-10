---
read_when:
    - 여러 LLM에 사용할 단일 API 키를 원합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려는 경우
    - 이미지 생성을 위해 OpenRouter를 사용하려는 경우
    - 동영상 생성에 OpenRouter를 사용하려는 경우
summary: OpenClaw에서 OpenRouter의 통합 API를 사용하여 다양한 모델에 액세스하세요
title: OpenRouter
x-i18n:
    generated_at: "2026-05-10T19:49:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5016c522cb2239dadebbfe63459d0e00f43b3dc76aa49cd5b4acfd542b31be71
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter는 단일 endpoint와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI 호환이므로 대부분의 OpenAI SDK는 기본 URL을 전환하는 방식으로 작동합니다.

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 만드세요.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(선택 사항) 특정 모델로 전환">
    온보딩 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택하세요.

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
모델 참조는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한 provider와 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

번들 fallback 예시:

| 모델 참조                         | 참고                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 자동 라우팅       |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI를 통한 Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI를 통한 Kimi K2.5  |

## 이미지 생성

OpenRouter는 `image_generate` 도구도 지원할 수 있습니다. `agents.defaults.imageGenerationModel` 아래에 OpenRouter 이미지 모델을 사용하세요.

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

OpenClaw는 `modalities: ["image", "text"]`와 함께 이미지 요청을 OpenRouter의 채팅 completions 이미지 API로 보냅니다. Gemini 이미지 모델은 OpenRouter의 `image_config`를 통해 지원되는 `aspectRatio` 및 `resolution` 힌트를 받습니다. 더 느린 OpenRouter 이미지 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하세요. `image_generate` 도구의 호출별 `timeoutMs` 매개변수가 여전히 우선합니다.

## 비디오 생성

OpenRouter는 비동기 `/videos` API를 통해 `video_generate` 도구도 지원할 수 있습니다. `agents.defaults.videoGenerationModel` 아래에 OpenRouter 비디오 모델을 사용하세요.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw는 텍스트-비디오 및 이미지-비디오 작업을 OpenRouter에 제출하고, 반환된 `polling_url`을 폴링하며, OpenRouter의 `unsigned_urls` 또는 문서화된 작업 콘텐츠 endpoint에서 완료된 비디오를 다운로드합니다. 참조 이미지는 기본적으로 첫/마지막 프레임 이미지로 전송되며, `reference_image` 태그가 붙은 이미지는 OpenRouter 입력 참조로 전송됩니다. 번들된 `google/veo-3.1-fast` 기본값은 현재 지원되는 4/6/8초 길이, `720P`/`1080P` 해상도, `16:9`/`9:16` aspect ratios를 알립니다. 업스트림 비디오 생성 API가 현재 텍스트와 이미지 참조를 허용하므로 비디오-비디오는 OpenRouter에 등록되어 있지 않습니다.

## Text-to-speech

OpenRouter는 OpenAI 호환 `/audio/speech` endpoint를 통해 TTS provider로도 사용할 수 있습니다.

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

`messages.tts.providers.openrouter.apiKey`가 생략되면 TTS는 `models.providers.openrouter.apiKey`, 그다음 `OPENROUTER_API_KEY`를 재사용합니다.

## 인증 및 헤더

OpenRouter는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서 OpenClaw는 OpenRouter의 문서화된 앱 attribution 헤더도 추가합니다.

| 헤더                      | 값                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter provider를 다른 proxy 또는 기본 URL로 다시 지정하면 OpenClaw는 이러한 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 주입하지 **않습니다**.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="응답 캐싱">
    OpenRouter 응답 캐싱은 opt-in입니다. OpenRouter 모델별로 모델 매개변수에서 활성화하세요.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw는 `X-OpenRouter-Cache: true`를 보내고, 구성된 경우 `X-OpenRouter-Cache-TTL`도 보냅니다. `responseCacheClear: true`는 현재 요청에 대해 새로 고침을 강제하고 대체 응답을 저장합니다. Snake_case 별칭(`response_cache`, `response_cache_ttl_seconds`, `response_cache_clear`)도 허용됩니다.

    이는 provider prompt caching 및 OpenRouter의 Anthropic `cache_control` 마커와 별개입니다. 사용자 지정 proxy 기본 URL이 아니라 검증된 `openrouter.ai` 경로에만 적용됩니다.

  </Accordion>

  <Accordion title="Anthropic 캐시 마커">
    검증된 OpenRouter 경로에서 Anthropic 모델 참조는 OpenClaw가 시스템/개발자 프롬프트 블록에서 더 나은 prompt-cache 재사용을 위해 사용하는 OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Anthropic reasoning prefill">
    검증된 OpenRouter 경로에서 reasoning이 활성화된 Anthropic 모델 참조는 요청이 OpenRouter에 도달하기 전에 끝부분의 assistant prefill 턴을 제거하여, reasoning 대화가 사용자 턴으로 끝나야 한다는 Anthropic 요구 사항과 일치시킵니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 비-`auto` 경로에서 OpenClaw는 선택된 thinking 수준을 OpenRouter proxy reasoning payload에 매핑합니다. 지원되지 않는 모델 힌트와 `openrouter/auto`는 해당 reasoning 주입을 건너뜁니다. Hunter Alpha도 오래된 구성 모델 참조에 대해 proxy reasoning을 건너뜁니다. OpenRouter가 해당 retired 경로에서 reasoning 필드에 최종 답변 텍스트를 반환할 수 있기 때문입니다.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning replay">
    검증된 OpenRouter 경로에서 `openrouter/deepseek/deepseek-v4-flash` 및 `openrouter/deepseek/deepseek-v4-pro`는 replay된 assistant 턴의 누락된 `reasoning_content`를 채워 thinking/tool 대화가 DeepSeek V4의 필수 후속 형태를 유지하도록 합니다. OpenClaw는 이러한 경로에 OpenRouter가 지원하는 `reasoning_effort` 값을 보냅니다. `xhigh`가 알림된 최고 수준이며, 오래된 `max` override는 `xhigh`로 매핑됩니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 shaping">
    OpenRouter는 여전히 proxy 스타일의 OpenAI 호환 경로를 통해 실행되므로 `serviceTier`, Responses `store`, OpenAI reasoning-compat payload, prompt-cache 힌트와 같은 네이티브 OpenAI 전용 요청 shaping은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter 참조는 proxy-Gemini 경로에 남아 있습니다. OpenClaw는 거기서 Gemini thought-signature 정리를 유지하지만, 네이티브 Gemini replay 검증 또는 bootstrap 재작성을 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Provider 라우팅 메타데이터">
    모델 매개변수 아래에 OpenRouter provider 라우팅을 전달하면 OpenClaw는 공유 스트림 wrapper가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, failover 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    agent, 모델, provider에 대한 전체 구성 참조.
  </Card>
</CardGroup>
