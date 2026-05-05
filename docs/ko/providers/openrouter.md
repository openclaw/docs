---
read_when:
    - 여러 LLM에 사용할 단일 API 키가 필요합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려는 경우
    - 이미지 생성에 OpenRouter를 사용하려는 경우
    - 비디오 생성에 OpenRouter를 사용하려고 합니다
summary: OpenClaw에서 OpenRouter의 통합 API를 사용하여 다양한 모델에 액세스하기
title: OpenRouter
x-i18n:
    generated_at: "2026-05-05T01:48:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2876669c6fcc958ac13c19930cd23977b8ec27ae57069d9231932cc13c75244
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter는 단일 엔드포인트와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL을 바꾸는 것만으로 작동합니다.

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
    온보딩은 기본적으로 `openrouter/auto`를 사용합니다. 나중에 구체적인 모델을 선택하세요.

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
모델 참조는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한 제공자와 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

번들된 폴백 예시:

| 모델 참조                         | 참고                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 자동 라우팅       |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI를 통한 Kimi K2.6  |

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

OpenClaw는 `modalities: ["image", "text"]`와 함께 OpenRouter의 채팅 완성 이미지 API로 이미지 요청을 보냅니다. Gemini 이미지 모델은 OpenRouter의 `image_config`를 통해 지원되는 `aspectRatio` 및 `resolution` 힌트를 받습니다. 더 느린 OpenRouter 이미지 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하세요. `image_generate` 도구의 호출별 `timeoutMs` 매개변수가 여전히 우선합니다.

## 동영상 생성

OpenRouter는 비동기 `/videos` API를 통해 `video_generate` 도구도 지원할 수 있습니다. `agents.defaults.videoGenerationModel` 아래에 OpenRouter 동영상 모델을 사용하세요.

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

OpenClaw는 텍스트-동영상 및 이미지-동영상 작업을 OpenRouter에 제출하고, 반환된 `polling_url`을 폴링한 뒤, OpenRouter의 `unsigned_urls` 또는 문서화된 작업 콘텐츠 엔드포인트에서 완료된 동영상을 다운로드합니다. 참조 이미지는 기본적으로 첫 번째/마지막 프레임 이미지로 전송되며, `reference_image`로 태그된 이미지는 OpenRouter 입력 참조로 전송됩니다. 번들된 `google/veo-3.1-fast` 기본값은 현재 지원되는 4/6/8초 길이, `720P`/`1080P` 해상도, `16:9`/`9:16` 종횡비를 알립니다. 업스트림 동영상 생성 API가 현재 텍스트와 이미지 참조를 받기 때문에 OpenRouter에는 동영상-동영상이 등록되어 있지 않습니다.

## 텍스트 음성 변환

OpenRouter는 OpenAI 호환 `/audio/speech` 엔드포인트를 통해 TTS 제공자로도 사용할 수 있습니다.

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

`messages.tts.providers.openrouter.apiKey`가 생략되면 TTS는 `models.providers.openrouter.apiKey`를 재사용한 다음 `OPENROUTER_API_KEY`를 사용합니다.

## 인증 및 헤더

OpenRouter는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서 OpenClaw는 OpenRouter의 문서화된 앱 귀속 헤더도 추가합니다.

| 헤더                      | 값                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter 제공자를 다른 프록시나 기본 URL로 다시 지정하면 OpenClaw는 해당 OpenRouter 전용 헤더 또는 Anthropic 캐시 마커를 주입하지 **않습니다**.
</Warning>

## 고급 구성

<AccordionGroup>
  <Accordion title="응답 캐싱">
    OpenRouter 응답 캐싱은 옵트인 방식입니다. 모델 매개변수로 OpenRouter 모델별로 활성화하세요.

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

    OpenClaw는 `X-OpenRouter-Cache: true`를 보내며, 구성된 경우 `X-OpenRouter-Cache-TTL`도 보냅니다. `responseCacheClear: true`는 현재 요청의 새로 고침을 강제하고 대체 응답을 저장합니다. Snake_case 별칭(`response_cache`, `response_cache_ttl_seconds`, `response_cache_clear`)도 허용됩니다.

    이는 제공자 프롬프트 캐싱 및 OpenRouter의 Anthropic `cache_control` 마커와 별개입니다. 사용자 지정 프록시 기본 URL이 아니라 검증된 `openrouter.ai` 라우트에만 적용됩니다.

  </Accordion>

  <Accordion title="Anthropic 캐시 마커">
    검증된 OpenRouter 라우트에서 Anthropic 모델 참조는 시스템/개발자 프롬프트 블록의 프롬프트 캐시 재사용을 개선하기 위해 OpenClaw가 사용하는 OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Anthropic reasoning 프리필">
    검증된 OpenRouter 라우트에서 reasoning이 활성화된 Anthropic 모델 참조는 요청이 OpenRouter에 도달하기 전에 뒤따르는 어시스턴트 프리필 턴을 제거하여, reasoning 대화가 사용자 턴으로 끝나야 한다는 Anthropic의 요구사항과 일치시킵니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 비-`auto` 라우트에서 OpenClaw는 선택한 thinking 수준을 OpenRouter 프록시 reasoning 페이로드에 매핑합니다. 지원되지 않는 모델 힌트와 `openrouter/auto`는 해당 reasoning 주입을 건너뜁니다. Hunter Alpha도 오래된 구성 모델 참조에 대해 프록시 reasoning을 건너뜁니다. OpenRouter가 해당 폐기된 라우트의 reasoning 필드에 최종 답변 텍스트를 반환할 수 있기 때문입니다.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning 재생">
    검증된 OpenRouter 라우트에서 `openrouter/deepseek/deepseek-v4-flash` 및 `openrouter/deepseek/deepseek-v4-pro`는 재생된 어시스턴트 턴에 누락된 `reasoning_content`를 채워 thinking/도구 대화가 DeepSeek V4의 필수 후속 형태를 유지하도록 합니다. OpenClaw는 이러한 라우트에 대해 OpenRouter가 지원하는 `reasoning_effort` 값을 보냅니다. `xhigh`가 공지된 가장 높은 수준이며, 오래된 `max` 오버라이드는 `xhigh`로 매핑됩니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 형성">
    OpenRouter는 여전히 프록시 스타일 OpenAI 호환 경로를 통해 실행되므로 `serviceTier`, Responses `store`, OpenAI reasoning 호환 페이로드, 프롬프트 캐시 힌트와 같은 네이티브 OpenAI 전용 요청 형성은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 라우트">
    Gemini 기반 OpenRouter 참조는 프록시-Gemini 경로에 유지됩니다. OpenClaw는 그곳에서 Gemini thought-signature 정리를 유지하지만, 네이티브 Gemini 재생 검증이나 부트스트랩 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="제공자 라우팅 메타데이터">
    모델 매개변수 아래에 OpenRouter 제공자 라우팅을 전달하면 OpenClaw는 공유 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 제공자의 전체 구성 참조입니다.
  </Card>
</CardGroup>
