---
read_when:
    - 여러 LLM에 하나의 API 키를 사용하려고 합니다
    - OpenClaw에서 OpenRouter를 통해 모델을 실행하려고 합니다
    - 이미지 생성에 OpenRouter를 사용하려고 합니다
    - OpenRouter를 사용하여 음악을 생성하려고 합니다
    - OpenRouter를 사용하여 동영상을 생성하려고 합니다
summary: OpenRouter의 통합 API를 사용하여 OpenClaw에서 다양한 모델에 액세스합니다.
title: OpenRouter
x-i18n:
    generated_at: "2026-07-12T15:37:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3047a4da1727db1463d77fcc566231b528e2c34cc64eccaa36827e2927cc60a7
    source_path: providers/openrouter.md
    workflow: 16
---

OpenRouter는 하나의 API와 하나의 키를 통해 여러 모델로 요청을 라우팅합니다.
OpenAI와 호환되므로 OpenClaw는 다른 프록시 제공자에 사용하는 것과 동일한
`openai-completions` 스타일 전송 방식을 통해 OpenRouter와 통신합니다.

## 시작하기

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth 온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openrouter-oauth
        ```

        OpenClaw는 OpenRouter의 브라우저 로그인 흐름(PKCE)을 열고, 코드를
        OpenRouter API 키로 교환한 다음 기본 OpenRouter 인증 프로필에 저장합니다.
        원격/헤드리스 호스트에서는 OpenClaw가 로그인 URL을 출력하고, 로그인 후
        리디렉션 URL을 붙여 넣으라고 요청합니다.
      </Step>
      <Step title="(선택 사항) 특정 모델로 전환">
        온보딩의 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택하십시오.

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
  <Tab title="API 키">
    <Steps>
      <Step title="API 키 발급">
        [openrouter.ai/keys](https://openrouter.ai/keys)에서 API 키를 생성하십시오.
      </Step>
      <Step title="API 키 온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openrouter-api-key
        ```
      </Step>
      <Step title="(선택 사항) 특정 모델로 전환">
        온보딩의 기본값은 `openrouter/auto`입니다. 나중에 구체적인 모델을 선택하십시오.

        ```bash
        openclaw models set openrouter/<provider>/<model>
        ```

      </Step>
    </Steps>

  </Tab>
</Tabs>

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
모델 참조는 `openrouter/<provider>/<model>` 패턴을 따릅니다. 사용 가능한 제공자와
모델의 전체 목록은 [/concepts/model-providers](/ko/concepts/model-providers)를 참조하십시오.
</Note>

실시간 카탈로그 탐색을 사용할 수 없을 때 사용하는 번들 대체 모델은 다음과 같습니다.

| 모델 참조                         | 참고                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 자동 라우팅       |
| `openrouter/moonshotai/kimi-k2.6` | MoonshotAI를 통한 Kimi K2.6  |
| `openrouter/moonshotai/kimi-k2.5` | MoonshotAI를 통한 Kimi K2.5  |

[퓨전 라우터](#fusion-router)를 참조하십시오. `openrouter/openrouter/fusion`을 포함한
그 밖의 모든 `openrouter/<provider>/<model>` 참조는 OpenRouter의 실시간 모델
카탈로그를 기준으로 동적으로 확인됩니다.

## 이미지 생성

OpenRouter를 `image_generate` 도구의 백엔드로 사용할 수 있습니다.
`agents.defaults.imageGenerationModel`에서 OpenRouter 이미지 모델을 설정하십시오.

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

OpenClaw는 `modalities: ["image", "text"]`를 사용하여 OpenRouter의 채팅 완성 이미지
API로 이미지 요청을 전송합니다. Gemini 이미지 모델에는 OpenRouter의 `image_config`를
통해 `aspectRatio` 및 `resolution` 힌트도 전달되지만, 다른 이미지 모델에는 전달되지
않습니다. 속도가 느린 모델에는 `agents.defaults.imageGenerationModel.timeoutMs`를
사용하십시오. `image_generate` 도구의 호출별 `timeoutMs`가 설정되어 있으면 해당 값이
우선합니다.

## 동영상 생성

OpenRouter를 비동기 `/videos` API를 통해 `video_generate` 도구의 백엔드로 사용할 수
있습니다. `agents.defaults.videoGenerationModel`에서 OpenRouter 동영상 모델을
설정하십시오.

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

OpenClaw는 텍스트-동영상 및 이미지-동영상 작업을 제출하고, 반환된 `polling_url`을
폴링한 다음 OpenRouter의 `unsigned_urls` 또는 작업 콘텐츠 엔드포인트에서 완성된
동영상을 다운로드합니다. 참조 이미지는 기본적으로 첫 프레임/마지막 프레임 이미지로
사용되며, `reference_image` 태그가 지정된 이미지는 대신 입력 참조로 전송됩니다.
번들 `google/veo-3.1-fast` 기본값은 4/6/8초 길이, `720P`/`1080P` 해상도 및
`16:9`/`9:16` 화면비를 지원합니다. 동영상-동영상 변환은 지원되지 않습니다.
업스트림 API는 텍스트 및 이미지 참조만 허용합니다.

## 음악 생성

OpenRouter를 채팅 완성 오디오 출력을 통해 `music_generate` 도구의 백엔드로 사용할
수 있습니다. `agents.defaults.musicGenerationModel`에서 OpenRouter 오디오 모델을
설정하십시오.

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

번들 OpenRouter 음악 제공자의 기본값은 `google/lyria-3-pro-preview`이며,
`google/lyria-3-clip-preview`도 제공합니다. OpenClaw는 `modalities:
["text", "audio"]`를 전송하고, 응답을 스트리밍하며, 오디오 청크를 수집한 다음
채널 전송을 위한 생성 미디어로 결과를 저장합니다. Lyria 모델은 공유
`music_generate image=...` 매개변수를 통해 하나의 참조 이미지를 허용합니다.
스트리밍 오디오, 트랜스크립트 보존 및 파생된 SSE 이벤트 엔벌로프에는
`agents.defaults.mediaMaxMb` 제한이 적용됩니다(기본 오디오 상한은 16 MB입니다).

## 텍스트 음성 변환

OpenRouter는 OpenAI 호환 `/audio/speech` 엔드포인트를 통해 TTS 제공자 역할을 할 수 있습니다.

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

`messages.tts.providers.openrouter.apiKey`를 생략하면 TTS는 `models.providers.openrouter.apiKey`, 그다음 `OPENROUTER_API_KEY`로 대체됩니다.

## 음성-텍스트 변환(수신 오디오)

OpenRouter는 STT 엔드포인트(`/audio/transcriptions`)를 사용하여 공유 `tools.media.audio` 경로를 통해 수신 음성/오디오 첨부 파일을 전사할 수 있습니다. 이는 수신 음성/오디오를 미디어 이해 사전 검사로 전달하는 모든 채널 Plugin에 적용됩니다.

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

OpenClaw는 OpenRouter의 STT 계약에 따라 `input_audio` 아래에 base64 오디오를 포함한 JSON으로 OpenRouter STT 요청을 전송하며, multipart OpenAI 양식 업로드로 전송하지 않습니다.

## Fusion 라우터

OpenRouter Fusion은 하나의 OpenClaw 모델 참조를 여러 OpenRouter 모델에 병렬로 전송하고, OpenRouter가 해당 응답을 판정하도록 한 다음, 일반 OpenRouter 엔드포인트를 통해 하나의 최종 응답을 반환합니다. 업스트림 모델 슬러그는 `openrouter/fusion`이므로 OpenClaw 모델 참조에는 OpenClaw 제공자 접두사와 업스트림 OpenRouter 네임스페이스가 모두 포함됩니다.

```bash
openclaw models set openrouter/openrouter/fusion
```

모델의 `params.extraBody`를 통해 Fusion의 패널과 판정 모델을 구성하십시오. 해당 필드는 OpenRouter 채팅 완성 요청 본문으로 직접 전달됩니다. Fusion은 OAuth 또는 API 키 온보딩 모두에서 작동합니다. OAuth를 사용하는 경우 아래의 `env.OPENROUTER_API_KEY` 줄을 생략하십시오.

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

`analysis_models`는 병렬 패널이며, Fusion Plugin 구성 내부의 `model`은 판정 모델입니다. Fusion을 강제로 사용하려는 목적으로 일반 에이전트/채팅 턴에서 최상위 `tool_choice`를 `"required"`로 설정하지 마십시오. OpenClaw 턴에는 자체 도구 정의가 포함될 수 있으며, 최상위 필수 도구 선택이 Fusion 라우터 대신 이러한 도구 중 하나를 선택할 수 있습니다. 이 Fusion Plugin 구성이 있으면 OpenClaw는 구성된 분석 모델과 판정 모델을 나열하는 정제된 시스템 프롬프트 메모를 추가하므로, 에이전트는 자체 Fusion 패널에 관한 질문에 답변할 수 있습니다. 다른 `extraBody` 필드는 프롬프트에 복사되지 않습니다.

Fusion은 설계상 더 느립니다. OpenRouter가 프롬프트를 여러 분석 모델에 분산한 다음 판정/종합 단계를 실행하므로, 지연 시간은 단일 모델에 직접 요청할 때보다 길어집니다. 지연 시간에 민감한 기본값이 아니라 신중한 고품질 답변이나 에스컬레이션 경로에 사용하십시오. 더 빠른 응답을 위해 패널을 작게 유지하고 더 빠른 분석/판정 모델을 선택하십시오.

구성된 참조를 일회성 로컬 호출로 테스트하십시오.

```bash
openclaw infer model run --local \
  --model openrouter/openrouter/fusion \
  --prompt "정확히 다음과 같이 응답하십시오: FUSION_OK" \
  --json
```

## 인증 및 헤더

OpenRouter는 API 키의 Bearer 토큰을 사용합니다. OpenRouter OAuth는 OpenRouter API 키를 발급하는 PKCE 로그인 흐름이므로, OpenClaw는 수동 API 키 설정에 사용되는 것과 동일한 `openrouter:default` API 키 인증 프로필에 결과를 저장합니다.

전체 온보딩을 다시 실행하지 않고 기존 설치에서 로그인하거나 저장된 키를 교체하려면 다음을 실행하십시오.

```bash
openclaw models auth login --provider openrouter --method oauth
openclaw models auth login --provider openrouter --method api-key
```

검증된 OpenRouter 요청(`https://openrouter.ai/api/v1`)에서 OpenClaw는 OpenRouter에 문서화된 다음 앱 출처 표시 헤더를 추가합니다.

| 헤더                      | 값                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

  <Warning>
  OpenRouter 공급자를 다른 프록시나 기본 URL로 변경하면 OpenClaw는
  해당 OpenRouter 전용 헤더 또는 Anthropic 캐시 마커를 삽입하지 **않습니다**.
  </Warning>

  ## 고급 구성

  <AccordionGroup>
  <Accordion title="응답 캐싱">
    OpenRouter 응답 캐싱은 선택적으로 활성화해야 합니다. 모델별로 활성화하십시오.

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

    OpenClaw는 `X-OpenRouter-Cache: true`를 전송하며, 구성된 경우
    `X-OpenRouter-Cache-TTL`도 전송합니다. `responseCacheClear: true`는 현재
    요청을 강제로 새로 고치고 대체 응답을 저장합니다. 스네이크 케이스
    별칭(`response_cache`, `response_cache_ttl_seconds`,
    `response_cache_clear`)도 허용되며, `Seconds` 접미사가 없는
    `responseCacheTtl` / `response_cache_ttl`도 허용됩니다.

    이는 공급자의 프롬프트 캐싱 및 OpenRouter의 Anthropic
    `cache_control` 마커와 별개입니다. 사용자 지정 프록시 기본 URL이 아닌,
    검증된 `openrouter.ai` 경로에만 적용됩니다.

  </Accordion>

  <Accordion title="Anthropic 캐시 마커">
    검증된 OpenRouter 경로에서 Anthropic 모델 참조는 시스템/개발자 프롬프트
    블록의 프롬프트 캐시 재사용률을 높이기 위해 OpenRouter의 Anthropic
    `cache_control` 마커를 유지합니다.
  </Accordion>

  <Accordion title="Anthropic 추론 프리필">
    검증된 OpenRouter 경로에서는 추론이 활성화된 Anthropic 모델 참조가
    요청이 OpenRouter에 도달하기 전에 마지막 어시스턴트 프리필 턴을
    제거하여, 추론 대화가 사용자 턴으로 끝나야 한다는 Anthropic의
    요구 사항을 충족합니다.
  </Accordion>

  <Accordion title="사고 / 추론 주입">
    지원되는 비-`auto` 경로에서 OpenClaw는 선택한 사고 수준을
    OpenRouter 프록시 추론 페이로드에 매핑합니다. `openrouter/auto`와
    지원되지 않는 모델 힌트에는 이 주입을 적용하지 않습니다. 오래된
    `openrouter/hunter-alpha` 참조에도 적용하지 않습니다. 폐기된 해당
    경로에서는 OpenRouter가 추론 필드에 최종 답변 텍스트를 반환할 수
    있기 때문입니다.
  </Accordion>

  <Accordion title="DeepSeek V4 추론 재생">
    검증된 OpenRouter 경로에서 `openrouter/deepseek/deepseek-v4-flash`와
    `openrouter/deepseek/deepseek-v4-pro`는 재생된 어시스턴트 턴에 누락된
    `reasoning_content`를 채워, 사고/도구 대화를 DeepSeek V4에서 요구하는
    후속 형식으로 유지합니다. OpenClaw는 이러한 경로에 OpenRouter가 지원하는
    `reasoning.effort` 값을 전송합니다. `xhigh`/`max`는 `xhigh`로 매핑되고,
    꺼짐이 아닌 그 밖의 모든 수준은 `high`로 매핑됩니다.
  </Accordion>

  <Accordion title="OpenAI 전용 요청 형식 조정">
    OpenRouter는 프록시 방식의 OpenAI 호환 경로를 통해 실행되므로,
    `serviceTier`, Responses `store`, OpenAI 추론 호환 페이로드,
    프롬프트 캐시 힌트와 같은 네이티브 OpenAI 전용 요청 형식 조정은
    전달되지 않습니다.
  </Accordion>

  <Accordion title="Gemini 기반 경로">
    Gemini 기반 OpenRouter 참조는 프록시-Gemini 경로를 유지합니다.
    OpenClaw는 해당 경로에서 Gemini 사고 서명 정리를 유지하지만,
    네이티브 Gemini 재생 검증이나 부트스트랩 재작성을 활성화하지는 않습니다.
  </Accordion>

  <Accordion title="제공자 라우팅 메타데이터">
    OpenRouter는 기반 제공자 라우팅을 위한 `provider` 요청 객체를 지원합니다.
    `models.providers.openrouter.params.provider`를 사용하여 모든 OpenRouter
    텍스트 모델 요청의 기본 정책을 구성하십시오.

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

    OpenClaw는 해당 객체를 요청의 `provider` 페이로드로 OpenRouter에
    전달합니다. `sort`, `only`, `ignore`, `order`, `allow_fallbacks`,
    `require_parameters`, `data_collection`, `quantizations`, `max_price`,
    `preferred_max_latency`, `preferred_min_throughput`, `zdr`,
    `enforce_distillable_text`를 비롯하여 OpenRouter 문서에 명시된
    snake_case 필드를 사용하십시오.

    모델별 매개변수는 제공자 전체 라우팅 객체보다 우선합니다.

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

    이는 OpenRouter 채팅 완성 경로에만 적용됩니다. Anthropic, Google,
    OpenAI 또는 사용자 지정 제공자의 직접 경로는 OpenRouter 라우팅
    매개변수를 무시합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    에이전트, 모델 및 제공자의 전체 구성 참조입니다.
  </Card>
</CardGroup>
