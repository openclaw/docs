---
read_when:
    - 여러 LLM에 하나의 API 키를 사용하고 싶은 경우
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 합니다.
    - 이미지 생성을 위해 OpenRouter를 사용하려고 합니다
    - 음악 생성에 OpenRouter를 사용하려는 경우
    - 비디오 생성에 OpenRouter를 사용하려는 경우
summary: OpenClaw에서 OpenRouter의 통합 API를 사용하여 여러 모델에 액세스하세요
title: OpenRouter
x-i18n:
    generated_at: "2026-07-03T09:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca36f2a7afd35ea4d276f61ded28524aed7d15715b29eea9aaac0ac6e4abab40
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter는 단일 엔드포인트와 API 키 뒤에서 여러 모델로 요청을 라우팅하는 **통합 API**를 제공합니다. OpenAI와 호환되므로 대부분의 OpenAI SDK는 기본 URL만 바꾸면 작동합니다.

## 시작하기

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth 온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw는 OpenRouter의 브라우저 로그인 흐름을 열고, PKCE
        코드를 OpenRouter API 키로 교환한 뒤, 해당 키를 기본
        OpenRouter 인증 프로필에 저장합니다. 원격/헤드리스 호스트에서는 OpenClaw가
        로그인 URL을 출력하고, 로그인한 뒤 리디렉션 URL을 붙여 넣으라고 요청합니다.
      </Step>
      <Step title="(선택 사항) 특정 모델로 전환">
        온보딩 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택하세요.

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API 키">
    <Steps>
      <Step title="API 키 받기">
        [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 만드세요.
      </Step>
      <Step title="API 키 온보딩 실행">
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

  </Tab>
</Tabs>

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
모델 참조는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한
제공자와 모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하세요.
</Note>

번들된 폴백 예시:

| 모델 참조                         | 참고                        |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 자동 라우팅 |
| `openrouter/openrouter/fusion`    | OpenRouter Fusion 라우터     |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI를 통한 Kimi K2.6     |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI를 통한 Kimi K2.5     |

## 이미지 생성

OpenRouter는 `image_generate` 도구의 백엔드로도 사용할 수 있습니다. `agents.defaults.imageGenerationModel` 아래에 OpenRouter 이미지 모델을 사용하세요.

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

OpenClaw는 `modalities: ["image", "text"]`와 함께 이미지 요청을 OpenRouter의 채팅 완성 이미지 API로 보냅니다. Gemini 이미지 모델은 OpenRouter의 `image_config`를 통해 지원되는 `aspectRatio` 및 `resolution` 힌트를 받습니다. 느린 OpenRouter 이미지 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하세요. `image_generate` 도구의 호출별 `timeoutMs` 매개변수가 여전히 우선합니다.

## 비디오 생성

OpenRouter는 비동기 `/videos` API를 통해 `video_generate` 도구의 백엔드로도 사용할 수 있습니다. `agents.defaults.videoGenerationModel` 아래에 OpenRouter 비디오 모델을 사용하세요.

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

OpenClaw는 텍스트-비디오 및 이미지-비디오 작업을 OpenRouter에 제출하고,
반환된 `polling_url`을 폴링한 뒤, 완료된 비디오를
OpenRouter의 `unsigned_urls` 또는 문서화된 작업 콘텐츠 엔드포인트에서 다운로드합니다.
참조 이미지는 기본적으로 첫/마지막 프레임 이미지로 전송되며,
`reference_image`로 태그된 이미지는 OpenRouter 입력 참조로 전송됩니다. 번들된
`google/veo-3.1-fast` 기본값은 현재 지원되는 4/6/8초
길이, `720P`/`1080P` 해상도, `16:9`/`9:16` 종횡비를
표시합니다. 업스트림 비디오 생성 API가 현재 텍스트와 이미지 참조를 받기 때문에
비디오-비디오는 OpenRouter에 등록되어 있지 않습니다.

## 음악 생성

OpenRouter는 채팅 완성 오디오 출력을 통해 `music_generate` 도구의
백엔드로도 사용할 수 있습니다. `agents.defaults.musicGenerationModel` 아래에
OpenRouter 오디오 모델을 사용하세요.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "openrouter/google/lyria-3-pro-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

번들된 OpenRouter 음악 제공자는 기본값으로
`google/lyria-3-pro-preview`를 사용하며
`google/lyria-3-clip-preview`도 노출합니다. OpenClaw는 `modalities: ["text",
"audio"]`를 보내고, 스트리밍을 활성화하며, 스트리밍된 오디오 청크를 수집한 뒤,
채널 전달을 위한 생성 미디어로 결과를 저장합니다. 참조 이미지는 공유
`music_generate image=...` 매개변수를 통해 Lyria 모델에서 허용됩니다.

## 텍스트 음성 변환

OpenRouter는 OpenAI 호환
`/audio/speech` 엔드포인트를 통해 TTS 제공자로도 사용할 수 있습니다.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          speakerVoice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

`messages.tts.providers.openrouter.apiKey`가 생략되면 TTS는
`models.providers.openrouter.apiKey`를 재사용한 다음 `OPENROUTER_API_KEY`를 사용합니다.

## 음성 텍스트 변환(인바운드 오디오)

OpenRouter는 STT 엔드포인트(`/audio/transcriptions`)를 사용하여 공유
`tools.media.audio` 경로를 통해 인바운드 음성/오디오 첨부 파일을 전사할 수 있습니다.
이는 인바운드 음성/오디오를 미디어 이해 사전 점검으로 전달하는 모든 채널 Plugin에 적용됩니다.

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

OpenClaw는 OpenRouter STT 요청을 멀티파트 OpenAI 양식 업로드가 아니라,
`input_audio` 아래에 base64 오디오가 있는 JSON(OpenRouter STT 계약)으로 보냅니다.

## Fusion 라우터

하나의 OpenClaw 모델 참조가 여러 OpenRouter 모델에 병렬로 요청하고,
OpenRouter가 그 답변을 판단한 뒤, 일반 OpenRouter 제공자 엔드포인트를 통해
하나의 최종 응답을 반환하게 하려면 OpenRouter Fusion을 사용하세요. 업스트림 모델 슬러그가
`openrouter/fusion`이므로 OpenClaw 모델 참조에는
OpenClaw 제공자 접두사와 업스트림 OpenRouter 네임스페이스가 모두 포함됩니다.

```bash
openclaw models set openrouter/openrouter/fusion
```

모델의 `params.extraBody`를 통해 Fusion의 패널과 판단 모델을 설정하세요. 해당
필드는 OpenRouter 채팅 완성 요청 본문으로 전달됩니다. Fusion은
OpenRouter OAuth 온보딩 또는 API 키 온보딩 모두에서 작동합니다. OAuth를 사용하는 경우
아래 예시에서 `env.OPENROUTER_API_KEY` 줄을 생략하세요.

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/openrouter/fusion" },
      models: {
        "openrouter/openrouter/fusion": {
          params: {
            extraBody: {
              plugins: [
                {
                  id: "fusion",
                  analysis_models: [
                    "google/gemini-3.5-flash",
                    "moonshotai/kimi-k2.6",
                    "deepseek/deepseek-v4-pro",
                  ],
                  model: "google/gemini-3.5-flash",
                },
              ],
            },
          },
        },
      },
    },
  },
}
```

`analysis_models` 목록은 병렬 패널이고, Fusion
plugin 설정 안의 `model`은 판단 모델입니다. 정상적인 OpenClaw 에이전트/채팅 턴에서 Fusion을 강제로 사용하려고
최상위 `tool_choice`를 `"required"`로 설정하지 마세요.
OpenClaw 턴에는 OpenClaw 도구 정의가 포함될 수 있으며, 최상위 필수
도구 선택은 Fusion 라우터가 아니라 해당 도구 중 하나를 요구할 수 있습니다. 이
Fusion plugin 설정이 있으면 OpenClaw는 설정된 분석 모델과 판단 모델이 포함된
정제된 시스템 프롬프트 메모도 추가하여 에이전트가 현재 Fusion 패널에 관한 질문에
답할 수 있게 합니다. 다른 `extraBody`
필드는 프롬프트에 복사되지 않습니다.

Fusion은 설계상 더 느립니다. OpenRouter는 동일한 OpenClaw 프롬프트를
여러 분석 모델로 보낸 다음 최종 판단/합성 단계를 실행할 수 있으므로, 지연 시간은
일반적으로 단일 모델에 직접 요청하는 것보다 깁니다. Fusion은 지연 시간에 민감한 채팅의
기본값이 아니라, 신중하고 고품질인 답변이나 에스컬레이션 경로에 사용하세요.
더 빠른 응답을 위해서는 패널을 작게 유지하고 더 빠른 분석 및 판단 모델을 선택하세요.

설정된 참조를 일회성 로컬 모델 호출로 테스트하세요.

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "Reply with exactly: FUSION_OK" \
  --json
```

## 인증 및 헤더

OpenRouter는 내부적으로 API 키가 포함된 Bearer 토큰을 사용합니다. OpenRouter
OAuth는 OpenRouter API 키를 발급하는 PKCE 로그인 흐름이므로, OpenClaw는
결과를 수동 API 키 설정 경로에서 사용하는 동일한 `openrouter:default` API 키 인증 프로필로 저장합니다.

기존 설치에서 전체 온보딩을 다시 실행하지 않고 로그인하거나 저장된 OpenRouter 키를 교체하려면 다음을 사용하세요.

```bash
openclaw models auth login --provider openrouter --method oauth
```

OpenRouter에서 직접 만든 키를 붙여 넣으려면
`openclaw models auth login --provider openrouter --method api-key`를 사용하세요.

실제 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서 OpenClaw는
OpenRouter의 문서화된 앱 귀속 헤더도 추가합니다.

| 헤더                    | 값                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
OpenRouter 제공자를 다른 프록시 또는 기본 URL로 다시 지정하면 OpenClaw는
이러한 OpenRouter 전용 헤더나 Anthropic 캐시 마커를 삽입하지 **않습니다**.
</Warning>

## 고급 설정

<AccordionGroup>
  <Accordion title="응답 캐싱">
    OpenRouter 응답 캐싱은 옵트인입니다. OpenRouter 모델별로
    모델 매개변수를 사용하여 활성화하세요.

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

    OpenClaw는 `X-OpenRouter-Cache: true`를 보내며, 설정된 경우
    `X-OpenRouter-Cache-TTL`도 보냅니다. `responseCacheClear: true`는
    현재 요청에 대해 새로고침을 강제하고 대체 응답을 저장합니다. Snake_case 별칭
    (`response_cache`, `response_cache_ttl_seconds`, 및
    `response_cache_clear`)도 허용됩니다.

    이는 제공자 프롬프트 캐싱 및 OpenRouter의
    Anthropic `cache_control` 마커와 별개입니다. 사용자 지정 프록시 기본 URL이 아니라
    검증된 `openrouter.ai` 경로에만 적용됩니다.

  </Accordion>

  <Accordion title="Anthropic 캐시 마커">
    검증된 OpenRouter 경로에서 Anthropic 모델 참조는
    시스템/개발자 프롬프트 블록에서 더 나은 프롬프트 캐시 재사용을 위해 OpenClaw가 사용하는
    OpenRouter 전용 Anthropic `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Anthropic 추론 프리필">
    검증된 OpenRouter 경로에서는 추론이 활성화된 Anthropic 모델 참조가
    요청이 OpenRouter에 도달하기 전에 뒤쪽의 assistant 프리필 턴을 제거하여,
    추론 대화가 user 턴으로 끝나야 한다는 Anthropic의 요구 사항과 일치합니다.
  </Accordion>

  <Accordion title="사고 / 추론 주입">
    지원되는 비-`auto` 경로에서 OpenClaw는 선택된 사고 수준을
    OpenRouter 프록시 추론 페이로드에 매핑합니다. 지원되지 않는 모델 힌트와
    `openrouter/auto`는 해당 추론 주입을 건너뜁니다. Hunter Alpha도
    오래된 구성 모델 참조에 대해서는 프록시 추론을 건너뜁니다. OpenRouter가
    해당 폐기된 경로에서 최종 답변 텍스트를 추론 필드에 반환할 수 있기 때문입니다.
  </Accordion>

  <Accordion title="DeepSeek V4 추론 재생">
    검증된 OpenRouter 경로에서 `openrouter/deepseek/deepseek-v4-flash` 및
    `openrouter/deepseek/deepseek-v4-pro`는 재생된 assistant 턴에서 누락된
    `reasoning_content`를 채워 사고/도구 대화가 DeepSeek V4에 필요한 후속 형태를
    유지하도록 합니다. OpenClaw는 이러한 경로에 OpenRouter가 지원하는
    `reasoning.effort` 값을 보냅니다. 낮은 비-off 수준은 `high`에 매핑되고,
    오래된 `max` 오버라이드는 `xhigh`에 매핑됩니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 형성">
    OpenRouter는 여전히 프록시 스타일의 OpenAI 호환 경로를 통해 실행되므로,
    `serviceTier`, Responses `store`, OpenAI 추론 호환 페이로드, 프롬프트 캐시 힌트와 같은
    네이티브 OpenAI 전용 요청 형성은 전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter 참조는 프록시-Gemini 경로에 유지됩니다. OpenClaw는
    그곳에서 Gemini thought-signature 정리를 유지하지만, 네이티브 Gemini
    재생 검증이나 부트스트랩 재작성은 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Provider 라우팅 메타데이터">
    OpenRouter는 기본 Provider 라우팅을 위한 `provider` 요청 객체를 지원합니다.
    모든 OpenRouter 텍스트 모델 요청에 대한 기본 정책은
    `models.providers.openrouter.params.provider`로 구성하세요.

    ```json5
    {
      models: {
        providers: {
          openrouter: {
            params: {
              provider: {
                sort: "latency",
                require_parameters: true,
                data_collection: "deny",
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw는 해당 객체를 요청 `provider` 페이로드로 OpenRouter에 전달합니다.
    `sort`, `only`, `ignore`, `order`, `allow_fallbacks`, `require_parameters`,
    `data_collection`, `quantizations`, `max_price`, `preferred_max_latency`,
    `preferred_min_throughput`, `zdr`, `enforce_distillable_text`를 포함하여,
    OpenRouter 문서에 명시된 snake_case 필드를 사용하세요.

    모델별 params는 여전히 Provider 전체 라우팅 객체를 오버라이드합니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/anthropic/claude-sonnet-4-6": {
              params: {
                provider: {
                  order: ["anthropic"],
                  allow_fallbacks: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    이는 OpenRouter chat-completions 경로에만 적용됩니다. 직접 Anthropic,
    Google, OpenAI 또는 사용자 지정 Provider 경로는 OpenRouter 라우팅 params를 무시합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 참조 및 장애 조치 동작 선택.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    agent, 모델 및 Provider에 대한 전체 config 참조입니다.
  </Card>
</CardGroup>
