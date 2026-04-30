---
read_when:
    - 여러 대규모 언어 모델에 사용할 단일 API 키가 필요합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려는 경우
    - 이미지 생성을 위해 OpenRouter를 사용하려고 합니다
    - 동영상 생성에 OpenRouter를 사용하려는 경우
summary: OpenClaw에서 여러 모델에 액세스하려면 OpenRouter의 통합 API를 사용하세요
title: OpenRouter
x-i18n:
    generated_at: "2026-04-30T06:48:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 47206ce7279eb8a38f71b5c40d34646ad01df2cac25860b629951f9cec73270f
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter는 단일 엔드포인트와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL을 바꾸는 것만으로 작동합니다.

## 시작하기

<Steps>
  <Step title="API 키 받기">
    [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 만듭니다.
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

OpenClaw는 이미지 요청을 `modalities: ["image", "text"]`와 함께 OpenRouter의 채팅 완성 이미지 API로 보냅니다. Gemini 이미지 모델은 지원되는 `aspectRatio` 및 `resolution` 힌트를 OpenRouter의 `image_config`를 통해 받습니다. 더 느린 OpenRouter 이미지 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하세요. 단, `image_generate` 도구의 호출별 `timeoutMs` 매개변수가 여전히 우선합니다.

## 비디오 생성

OpenRouter는 비동기 `/videos` API를 통해 `video_generate` 도구도 지원할 수 있습니다. `agents.defaults.videoGenerationModel` 아래에서 OpenRouter 비디오 모델을 사용하세요.

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

OpenClaw는 텍스트-비디오 및 이미지-비디오 작업을 OpenRouter에 제출하고, 반환된 `polling_url`을 폴링한 다음, 완료된 비디오를 OpenRouter의 `unsigned_urls` 또는 문서화된 작업 콘텐츠 엔드포인트에서 다운로드합니다. 참조 이미지는 기본적으로 첫 번째/마지막 프레임 이미지로 전송됩니다. `reference_image`로 태그된 이미지는 OpenRouter 입력 참조로 전송됩니다. 번들된 `google/veo-3.1-fast` 기본값은 현재 지원되는 4/6/8초 길이, `720P`/`1080P` 해상도, `16:9`/`9:16` 종횡비를 표시합니다. 업스트림 비디오 생성 API가 현재 텍스트 및 이미지 참조를 허용하므로 비디오-비디오는 OpenRouter에 등록되지 않습니다.

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

| 헤더                      | 값                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
OpenRouter 제공자를 다른 프록시 또는 기본 URL로 다시 지정하면 OpenClaw는 해당 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 주입하지 않습니다.
</Warning>

## 고급 설정

<AccordionGroup>
  <Accordion title="Anthropic 캐시 마커">
    검증된 OpenRouter 라우트에서 Anthropic 모델 참조는 OpenClaw가 시스템/개발자 프롬프트 블록에서 더 나은 프롬프트 캐시 재사용을 위해 사용하는 OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="사고 / 추론 주입">
    지원되는 비-`auto` 라우트에서 OpenClaw는 선택된 사고 수준을 OpenRouter 프록시 추론 페이로드에 매핑합니다. 지원되지 않는 모델 힌트와 `openrouter/auto`는 해당 추론 주입을 건너뜁니다. Hunter Alpha도 오래된 설정 모델 참조에 대해 프록시 추론을 건너뜁니다. OpenRouter가 해당 폐기된 라우트의 추론 필드에 최종 답변 텍스트를 반환할 수 있기 때문입니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 형성">
    OpenRouter는 여전히 프록시 스타일 OpenAI 호환 경로를 통해 실행되므로 `serviceTier`, Responses `store`, OpenAI 추론 호환 페이로드, 프롬프트 캐시 힌트와 같은 네이티브 OpenAI 전용 요청 형성은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 라우트">
    Gemini 기반 OpenRouter 참조는 프록시-Gemini 경로에 유지됩니다. OpenClaw는 그곳에서 Gemini 생각 서명 정리를 유지하지만, 네이티브 Gemini 재생 검증이나 부트스트랩 재작성을 활성화하지는 않습니다.
  </Accordion>

  <Accordion title="제공자 라우팅 메타데이터">
    모델 매개변수 아래에 OpenRouter 제공자 라우팅을 전달하면 OpenClaw는 공유 스트림 래퍼가 실행되기 전에 이를 OpenRouter 라우팅 메타데이터로 전달합니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="설정 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델, 제공자에 대한 전체 설정 참조입니다.
  </Card>
</CardGroup>
