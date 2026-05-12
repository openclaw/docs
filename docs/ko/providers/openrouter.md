---
read_when:
    - 여러 LLM에 사용할 하나의 API 키를 원합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려는 경우
    - 이미지 생성에 OpenRouter를 사용하려는 경우
    - 동영상 생성에 OpenRouter를 사용하려는 경우
summary: OpenClaw에서 OpenRouter의 통합 API를 사용하여 다양한 모델에 액세스하세요
title: OpenRouter
x-i18n:
    generated_at: "2026-05-12T08:46:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dbf2b5a69636eb18471dd7d1dcf05ee30da931e2e3b5c9ae5d44a20d3e46f78
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter는 단일 엔드포인트와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL을 전환하는 방식으로 작동합니다.

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(선택 사항) 특정 모델로 전환">
    온보딩의 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택하세요.

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 설정 예시

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
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI를 통한 Kimi K2.5  |

## 이미지 생성

OpenRouter는 `image_generate` 도구도 지원할 수 있습니다. `agents.defaults.imageGenerationModel` 아래에서 OpenRouter 이미지 모델을 사용하세요.

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

OpenClaw는 `modalities: ["image", "text"]`를 사용하여 이미지 요청을 OpenRouter의 채팅 completions 이미지 API로 보냅니다. Gemini 이미지 모델은 OpenRouter의 `image_config`를 통해 지원되는 `aspectRatio` 및 `resolution` 힌트를 받습니다. 속도가 느린 OpenRouter 이미지 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하세요. `image_generate` 도구의 호출별 `timeoutMs` 매개변수가 여전히 우선합니다.

## 동영상 생성

OpenRouter는 비동기 `/videos` API를 통해 `video_generate` 도구도 지원할 수 있습니다. `agents.defaults.videoGenerationModel` 아래에서 OpenRouter 동영상 모델을 사용하세요.

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

OpenClaw는 텍스트-동영상 및 이미지-동영상 작업을 OpenRouter에 제출하고, 반환된 `polling_url`을 폴링한 뒤, OpenRouter의 `unsigned_urls` 또는 문서화된 작업 콘텐츠 엔드포인트에서 완료된 동영상을 다운로드합니다. 참조 이미지는 기본적으로 첫/마지막 프레임 이미지로 전송되며, `reference_image`로 태그가 지정된 이미지는 OpenRouter 입력 참조로 전송됩니다. 번들된 `google/veo-3.1-fast` 기본값은 현재 지원되는 4/6/8초 길이, `720P`/`1080P` 해상도, `16:9`/`9:16` 화면비를 알립니다. 업스트림 동영상 생성 API가 현재 텍스트와 이미지 참조를 허용하므로, 동영상-동영상은 OpenRouter에 등록되어 있지 않습니다.

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

## 음성 텍스트 변환(인바운드 오디오)

OpenRouter는 STT 엔드포인트(`/audio/transcriptions`)를 사용하여 공유 `tools.media.audio` 경로를 통해 인바운드 음성/오디오 첨부 파일을 전사할 수 있습니다. 이는 인바운드 음성/오디오를 미디어 이해 사전 검사로 전달하는 모든 채널 Plugin에 적용됩니다.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "openrouter", model: "openai/whisper-large-v3-turbo" }],
      },
    },
  },
}
```

OpenClaw는 OpenRouter STT 요청을 multipart OpenAI 양식 업로드가 아니라, `input_audio` 아래에 base64 오디오가 포함된 JSON(OpenRouter STT 계약)으로 보냅니다.

## 인증 및 헤더

OpenRouter는 내부적으로 API 키와 함께 Bearer 토큰을 사용합니다.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서 OpenClaw는 OpenRouter에 문서화된 앱 귀속 헤더도 추가합니다.

| 헤더                      | 값                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter 제공자를 다른 프록시나 기본 URL로 다시 지정하면, OpenClaw는 해당 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 주입하지 **않습니다**.
</Warning>

## 고급 설정

<AccordionGroup>
  <Accordion title="응답 캐싱">
    OpenRouter 응답 캐싱은 옵트인입니다. 모델 매개변수로 OpenRouter 모델별로 활성화하세요.

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

    OpenClaw는 `X-OpenRouter-Cache: true`를 보내며, 설정된 경우 `X-OpenRouter-Cache-TTL`도 보냅니다. `responseCacheClear: true`는 현재 요청에 대해 새로고침을 강제하고 대체 응답을 저장합니다. Snake_case 별칭(`response_cache`, `response_cache_ttl_seconds`, `response_cache_clear`)도 허용됩니다.

    이는 제공자 프롬프트 캐싱 및 OpenRouter의 Anthropic `cache_control` 마커와 별개입니다. 사용자 지정 프록시 기본 URL이 아니라 검증된 `openrouter.ai` 경로에만 적용됩니다.

  </Accordion>

  <Accordion title="Anthropic 캐시 마커">
    검증된 OpenRouter 경로에서 Anthropic 모델 참조는 시스템/개발자 프롬프트 블록에서 더 나은 프롬프트 캐시 재사용을 위해 OpenClaw가 사용하는 OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Anthropic reasoning 프리필">
    검증된 OpenRouter 경로에서 reasoning이 활성화된 Anthropic 모델 참조는 요청이 OpenRouter에 도달하기 전에 뒤따르는 어시스턴트 프리필 턴을 제거하여, reasoning 대화가 사용자 턴으로 끝나야 한다는 Anthropic의 요구사항과 맞춥니다.
  </Accordion>

  <Accordion title="Thinking / reasoning 주입">
    지원되는 비-`auto` 경로에서 OpenClaw는 선택된 thinking 수준을 OpenRouter 프록시 reasoning 페이로드에 매핑합니다. 지원되지 않는 모델 힌트와 `openrouter/auto`는 해당 reasoning 주입을 건너뜁니다. Hunter Alpha도 오래된 설정 모델 참조에 대해 프록시 reasoning을 건너뜁니다. 해당 사용 중단된 경로에서는 OpenRouter가 reasoning 필드에 최종 답변 텍스트를 반환할 수 있기 때문입니다.
  </Accordion>

  <Accordion title="DeepSeek V4 reasoning 재생">
    검증된 OpenRouter 경로에서 `openrouter/deepseek/deepseek-v4-flash`와 `openrouter/deepseek/deepseek-v4-pro`는 재생된 어시스턴트 턴에서 누락된 `reasoning_content`를 채워 thinking/도구 대화가 DeepSeek V4에 필요한 후속 형태를 유지하도록 합니다. OpenClaw는 이러한 경로에 OpenRouter가 지원하는 `reasoning_effort` 값을 보냅니다. `xhigh`는 공지된 가장 높은 수준이며, 오래된 `max` 오버라이드는 `xhigh`로 매핑됩니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 형태 지정">
    OpenRouter는 여전히 프록시 스타일의 OpenAI 호환 경로를 거치므로, `serviceTier`, Responses `store`, OpenAI reasoning 호환 페이로드, 프롬프트 캐시 힌트 같은 네이티브 OpenAI 전용 요청 형태 지정은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter 참조는 프록시-Gemini 경로에 유지됩니다. OpenClaw는 그곳에서 Gemini thought-signature 정리를 유지하지만, 네이티브 Gemini 재생 검증이나 부트스트랩 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="제공자 라우팅 메타데이터">
    모델 매개변수 아래에 OpenRouter 제공자 라우팅을 전달하면, OpenClaw는 공유 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 제공자에 대한 전체 설정 참조입니다.
  </Card>
</CardGroup>
