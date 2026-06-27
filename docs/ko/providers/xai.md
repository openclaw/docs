---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려는 경우
    - xAI 인증 또는 모델 ID를 구성하고 있습니다
summary: OpenClaw에서 xAI Grok 모델 사용하기
title: xAI
x-i18n:
    generated_at: "2026-06-27T18:05:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b89c1037f9800366c03bdd1313a8c4ff05e8675effa60ed1e2985d38f045aad4
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw는 Grok 모델용 번들 `xai` provider Plugin을 제공합니다. 대부분의
사용자에게 권장되는 경로는 자격이 되는 SuperGrok 또는 X Premium
구독으로 Grok OAuth를 사용하는 것입니다. OpenClaw는 로컬 우선 방식을 유지합니다. Gateway, config, routing,
tools는 사용자의 머신에서 실행되고, Grok 모델 요청은 xAI를 통해 인증되어
xAI의 API로 전송됩니다.

OAuth에는 xAI API 키가 필요하지 않으며, Grok Build
앱도 필요하지 않습니다. OpenClaw가 xAI의 공유 OAuth 클라이언트를 사용하므로
xAI가 동의 화면에 여전히 Grok Build를 표시할 수 있습니다.

## 설정 경로 선택

OpenClaw 설치 상태에 맞는 경로를 사용하세요.

<Steps>
  <Step title="새 OpenClaw 설치">
    새 로컬 Gateway를 설정하는 경우 daemon 설치와 함께 onboarding을 실행한 다음,
    모델/인증 단계에서 xAI/Grok OAuth 옵션을 선택하세요.

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS 또는 SSH 환경에서는 xAI OAuth를 직접 선택하세요. OpenClaw는 device-code
    검증을 사용하며 localhost callback이 필요하지 않습니다.

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    OAuth에는 xAI API 키가 필요하지 않습니다. OpenClaw에는 Grok
    Build 앱이 필요하지 않습니다. OpenClaw가 xAI의 공유 OAuth 클라이언트를
    사용하므로 xAI가 동의 앱을 여전히 Grok Build로 표시할 수 있습니다.

  </Step>
  <Step title="기존 OpenClaw 설치">
    OpenClaw가 이미 구성되어 있다면 xAI에만 로그인하세요. Grok을 연결하기 위해
    전체 onboarding을 다시 실행하거나 daemon을 다시 설치하지 마세요.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    로그인 후 Grok을 기본 모델로 만들려면 별도로 적용하세요.

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway, daemon, channel, workspace 또는 기타 설정 선택을 의도적으로
    변경하려는 경우에만 전체 onboarding을 다시 실행하세요.

  </Step>
  <Step title="API 키 경로">
    API 키 설정은 xAI Console 키와 키 기반 provider config가 필요한
    media surface에서 계속 작동합니다.

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

  </Step>
  <Step title="모델 선택">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4.3" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw는 번들 xAI 전송으로 xAI Responses API를 사용합니다.
`openclaw models auth login --provider xai --method oauth` 또는
`openclaw models auth login --provider xai --method api-key`의 동일한
credential은 일급 `web_search`, `x_search`, 원격 `code_execution`, xAI 이미지/비디오 생성에도 사용할 수 있습니다.
Speech 및 transcription은 현재 `XAI_API_KEY` 또는 provider config가 필요합니다.
Grok 기반 `web_search`는 xAI OAuth를 선호하며 `XAI_API_KEY` 또는
plugin web-search config로 fallback합니다.
xAI 키를 `plugins.entries.xai.config.webSearch.apiKey` 아래에 저장하면
번들 xAI 모델 provider도 해당 키를 fallback으로 재사용합니다.
`plugins.entries.xai.config.webSearch.baseUrl`을 설정하면 Grok `web_search`와
기본적으로 `x_search`를 운영자 xAI Responses proxy를 통해 routing합니다.
`code_execution` tuning은 `plugins.entries.xai.config.codeExecution` 아래에 있습니다.
</Note>

## OAuth 문제 해결

- SSH, Docker, VPS 또는 기타 원격 설정에서는
  `openclaw models auth login --provider xai --method oauth`를 사용하세요. xAI OAuth는
  localhost callback 대신 device-code 검증을 사용합니다.
- 로그인은 성공했지만 Grok이 기본 모델이 아니라면
  `openclaw models set xai/grok-4.3`를 실행하세요.
- 저장된 xAI auth profile을 검사하려면 다음을 실행하세요.

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- 어떤 계정이 OAuth API token을 받을 수 있는지는 xAI가 결정합니다. 계정이
  자격 요건을 충족하지 않는다면 API 키 경로를 시도하거나 xAI 쪽의 구독을 확인하세요.

<Tip>
SSH, Docker 또는 VPS에서 로그인할 때는 `xai-oauth`를 사용하세요. OpenClaw는
xAI URL과 짧은 code를 출력합니다. 원격 process가 완료된 token 교환을 위해
xAI를 polling하는 동안 아무 로컬 browser에서나 로그인을 완료하세요.
</Tip>

## 내장 catalog

OpenClaw는 최신 xAI chat 모델을 기본 포함하며, model picker에서 최신순으로
정렬됩니다.

| Family         | 모델 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok Build 0.1 | `grok-build-0.1`                                                         |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |

Plugin은 기존 config를 위해 이전 Grok 3, Grok 4, Grok 4 Fast, Grok 4.1
Fast, Grok Code slug를 계속 forward-resolve합니다. 공식 Grok Code Fast alias는
`grok-build-0.1`로 normalize됩니다. OpenClaw는 선택 가능한 catalog에 더 이상
다른 retired upstream slug를 표시하지 않습니다.

<Tip>
Grok 4.20 beta alias가 명시적으로 필요한 경우가 아니라면 일반 chat에는
`grok-4.3`을, build/coding 중심 workload에는 `grok-build-0.1`을 사용하세요.
</Tip>

## OpenClaw 기능 지원 범위

번들 Plugin은 xAI의 현재 공개 API surface를 OpenClaw의 공유
provider 및 tool contract에 매핑합니다. 공유 contract에 맞지 않는 기능
(예: streaming TTS 및 realtime voice)은 노출되지 않습니다. 아래 표를 참고하세요.

| xAI 기능                   | OpenClaw surface                          | 상태                                                                 |
| -------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| Chat / Responses           | `xai/<model>` model provider              | 예                                                                   |
| Server-side web search     | `web_search` provider `grok`              | 예                                                                   |
| Server-side X search       | `x_search` tool                           | 예                                                                   |
| Server-side code execution | `code_execution` tool                     | 예                                                                   |
| Images                     | `image_generate`                          | 예                                                                   |
| Videos                     | `video_generate`                          | 예                                                                   |
| Batch text-to-speech       | `messages.tts.provider: "xai"` / `tts`    | 예                                                                   |
| Streaming TTS              | -                                         | 노출되지 않음. OpenClaw의 TTS contract는 완전한 audio buffer를 반환합니다 |
| Batch speech-to-text       | `tools.media.audio` / media understanding | 예                                                                   |
| Streaming speech-to-text   | Voice Call `streaming.provider: "xai"`    | 예                                                                   |
| Realtime voice             | -                                         | 아직 노출되지 않음. 다른 session/WebSocket contract                  |
| Files / batches            | Generic model API compatibility only      | 일급 OpenClaw tool이 아님                                            |

<Note>
OpenClaw는 media generation, speech, batch transcription에 xAI의 REST image/video/TTS/STT API를,
live voice-call transcription에 xAI의 streaming STT WebSocket을,
model, search, code-execution tool에 Responses API를 사용합니다. Realtime voice session처럼
다른 OpenClaw contract가 필요한 기능은 숨겨진 plugin 동작이 아니라 upstream 기능으로
여기에 문서화되어 있습니다.
</Note>

### 고속 모드 매핑

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`는
native xAI 요청을 다음과 같이 rewrite합니다.

| 원본 모델     | 고속 모드 대상      |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### Legacy compatibility alias

Legacy alias는 여전히 canonical 번들 ID로 normalize됩니다.

| Legacy alias              | Canonical id                          |
| ------------------------- | ------------------------------------- |
| `grok-code-fast-1`        | `grok-build-0.1`                      |
| `grok-code-fast`          | `grok-build-0.1`                      |
| `grok-code-fast-1-0825`   | `grok-build-0.1`                      |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 기능

<AccordionGroup>
  <Accordion title="Web search">
    번들 `grok` web-search provider는 xAI OAuth를 선호한 다음,
    `XAI_API_KEY` 또는 plugin web-search 키로 fallback합니다.

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Video generation">
    번들 `xai` Plugin은 공유 `video_generate` tool을 통해 video generation을 등록합니다.

    - 기본 video 모델: `xai/grok-imagine-video`
    - 모드: text-to-video, image-to-video, reference-image generation, 원격
      video edit, 원격 video extension
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - Resolution: `480P`, `720P`
    - Duration: generation/image-to-video의 경우 1-15초, `reference_image` role을
      사용할 때는 1-10초, extension의 경우 2-10초
    - Reference-image generation: 제공된 모든 image에 대해 `imageRoles`를
      `reference_image`로 설정하세요. xAI는 이러한 image를 최대 7개까지 허용합니다.
    - 기본 operation timeout: `video_generate.timeoutMs` 또는
      `agents.defaults.videoGenerationModel.timeoutMs`가 설정되지 않은 경우 600초

    <Warning>
    로컬 video buffer는 허용되지 않습니다. video edit/extend 입력에는 원격 `http(s)` URL을
    사용하세요. OpenClaw가 이를 xAI용 data URL로 encode할 수 있으므로
    image-to-video는 로컬 image buffer를 허용합니다.
    </Warning>

    xAI를 기본 video provider로 사용하려면:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    공유 tool parameter, provider selection, failover behavior는
    [Video Generation](/ko/tools/video-generation)을 참고하세요.
    </Note>

  </Accordion>

  <Accordion title="Image generation">
    번들 `xai` Plugin은 공유 `image_generate` tool을 통해 image generation을 등록합니다.

    - 기본 image 모델: `xai/grok-imagine-image`
    - 추가 모델: `xai/grok-imagine-image-quality`
    - 모드: text-to-image 및 reference-image edit
    - Reference input: 하나의 `image` 또는 최대 다섯 개의 `images`
    - Aspect ratio: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Resolution: `1K`, `2K`
    - Count: 최대 4개 image
    - 기본 operation timeout: `image_generate.timeoutMs` 또는
      `agents.defaults.imageGenerationModel.timeoutMs`가 설정되지 않은 경우 600초

    OpenClaw는 생성된 media가 일반 channel attachment 경로를 통해 저장되고
    전달될 수 있도록 xAI에 `b64_json` image response를 요청합니다. 로컬
    reference image는 data URL로 변환되며, 원격 `http(s)` reference는
    그대로 전달됩니다.

    xAI를 기본 image provider로 사용하려면:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI는 `quality`, `mask`, `user`와 `1:2`, `2:1`, `9:20`, `20:9` 같은
    추가 네이티브 비율도 문서화합니다. OpenClaw는 현재 공유되는
    교차 제공자 이미지 제어만 전달합니다. 지원되지 않는 네이티브 전용
    조정 항목은 의도적으로 `image_generate`를 통해 노출하지 않습니다.
    </Note>

  </Accordion>

  <Accordion title="텍스트 음성 변환">
    번들된 `xai` Plugin은 공유 `tts` 제공자 표면을 통해 텍스트 음성 변환을 등록합니다.

    - 음성: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - 기본 음성: `eve`
    - 형식: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 언어: BCP-47 코드 또는 `auto`
    - 속도: 제공자 네이티브 속도 재정의
    - 네이티브 Opus 음성 메모 형식은 지원되지 않음

    xAI를 기본 TTS 제공자로 사용하려면:

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              speakerVoiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw는 xAI의 배치 `/v1/tts` 엔드포인트를 사용합니다. xAI는 WebSocket을 통한
    스트리밍 TTS도 제공하지만, OpenClaw 음성 제공자 계약은 현재 답장 전달 전에
    완전한 오디오 버퍼를 기대합니다.
    </Note>

  </Accordion>

  <Accordion title="음성 텍스트 변환">
    번들된 `xai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해 배치
    음성 텍스트 변환을 등록합니다.

    - 기본 모델: `grok-stt`
    - 엔드포인트: xAI REST `/v1/stt`
    - 입력 경로: multipart 오디오 파일 업로드
    - `tools.media.audio`를 사용하는 인바운드 오디오 전사 어디에서나
      OpenClaw가 지원하며, Discord 음성 채널 세그먼트와 채널 오디오 첨부 파일을 포함합니다.

    인바운드 오디오 전사에 xAI를 강제로 사용하려면:

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    언어는 공유 오디오 미디어 구성 또는 호출별 전사 요청을 통해 제공할 수 있습니다.
    프롬프트 힌트는 공유 OpenClaw 표면에서 허용되지만, xAI REST STT 통합은
    현재 공개 xAI 엔드포인트에 깔끔하게 매핑되는 파일, 모델, 언어만 전달합니다.

  </Accordion>

  <Accordion title="스트리밍 음성 텍스트 변환">
    번들된 `xai` Plugin은 실시간 음성 통화 오디오를 위한 실시간 전사 제공자도 등록합니다.

    - 엔드포인트: xAI WebSocket `wss://api.x.ai/v1/stt`
    - 기본 인코딩: `mulaw`
    - 기본 샘플 레이트: `8000`
    - 기본 엔드포인팅: `800ms`
    - 중간 전사문: 기본적으로 활성화됨

    Voice Call의 Twilio 미디어 스트림은 G.711 µ-law 오디오 프레임을 전송하므로,
    xAI 제공자는 트랜스코딩 없이 해당 프레임을 직접 전달할 수 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    제공자 소유 구성은
    `plugins.entries.voice-call.config.streaming.providers.xai` 아래에 있습니다. 지원되는
    키는 `apiKey`, `baseUrl`, `sampleRate`, `encoding`(`pcm`, `mulaw` 또는
    `alaw`), `interimResults`, `endpointingMs`, `language`입니다.

    <Note>
    이 스트리밍 제공자는 Voice Call의 실시간 전사 경로용입니다.
    Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 배치
    `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="x_search 구성">
    번들된 xAI Plugin은 Grok을 통해 X(이전 Twitter) 콘텐츠를 검색하기 위한
    OpenClaw 도구로 `x_search`를 노출합니다.

    구성 경로: `plugins.entries.xai.config.xSearch`

    | 키                 | 유형    | 기본값             | 설명                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search 활성화 또는 비활성화        |
    | `model`            | string  | `grok-4-1-fast`    | x_search 요청에 사용되는 모델        |
    | `baseUrl`          | string  | -                  | xAI Responses 기본 URL 재정의        |
    | `inlineCitations`  | boolean | -                  | 결과에 인라인 인용 포함              |
    | `maxTurns`         | number  | -                  | 최대 대화 턴 수                      |
    | `timeoutSeconds`   | number  | -                  | 요청 제한 시간(초)                   |
    | `cacheTtlMinutes`  | number  | -                  | 캐시 유효 기간(분)                   |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                baseUrl: "https://api.x.ai/v1",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="코드 실행 구성">
    번들된 xAI Plugin은 xAI의 샌드박스 환경에서 원격 코드 실행을 위한
    OpenClaw 도구로 `code_execution`을 노출합니다.

    구성 경로: `plugins.entries.xai.config.codeExecution`

    | 키                | 유형    | 기본값                  | 설명                                 |
    | ----------------- | ------- | ----------------------- | ------------------------------------ |
    | `enabled`         | boolean | `true`(키가 사용 가능한 경우) | 코드 실행 활성화 또는 비활성화 |
    | `model`           | string  | `grok-4-1-fast`         | 코드 실행 요청에 사용되는 모델       |
    | `maxTurns`        | number  | -                       | 최대 대화 턴 수                      |
    | `timeoutSeconds`  | number  | -                       | 요청 제한 시간(초)                   |

    <Note>
    이는 원격 xAI 샌드박스 실행이며, 로컬 [`exec`](/ko/tools/exec)가 아닙니다.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="알려진 제한">
    - xAI 인증은 API 키, 환경 변수, Plugin 구성 폴백 또는 적격 xAI 계정의 OAuth를
      사용할 수 있습니다. OAuth는 localhost 콜백 없이 디바이스 코드 검증을 사용합니다.
      어떤 계정이 OAuth API 토큰을 받을 수 있는지는 xAI가 결정하며, OpenClaw가
      Grok Build 앱을 필요로 하지 않더라도 동의 페이지에 Grok Build가 표시될 수 있습니다.
    - OpenClaw는 현재 xAI 멀티 에이전트 모델 제품군을 노출하지 않습니다. xAI는
      Responses API를 통해 이러한 모델을 제공하지만, OpenClaw의 공유 에이전트 루프가
      사용하는 클라이언트 측 도구나 사용자 지정 도구를 허용하지 않습니다. 자세한 내용은
      [xAI 멀티 에이전트 제한](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)을 참조하세요.
    - xAI Realtime 음성은 아직 OpenClaw 제공자로 등록되지 않았습니다. 배치 STT 또는
      스트리밍 전사와는 다른 양방향 음성 세션 계약이 필요합니다.
    - xAI 이미지 `quality`, 이미지 `mask`, 추가 네이티브 전용 종횡비는
      공유 `image_generate` 도구에 해당 교차 제공자 제어가 생길 때까지 노출되지 않습니다.
  </Accordion>

  <Accordion title="고급 참고 사항">
    - OpenClaw는 공유 러너 경로에서 xAI 전용 도구 스키마 및 도구 호출 호환성 수정을
      자동으로 적용합니다.
    - 네이티브 xAI 요청은 기본적으로 `tool_stream: true`입니다. 비활성화하려면
      `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로 설정하세요.
    - 번들된 xAI 래퍼는 네이티브 xAI 요청을 보내기 전에 지원되지 않는 엄격한 도구 스키마 플래그와
      reasoning *effort* 페이로드 키를 제거합니다. `grok-4.3` / `grok-4.3-*`만
      구성 가능한 reasoning effort를 명시합니다. 다른 모든 추론 가능 xAI 모델은 후속 턴에서
      이전 암호화된 추론을 재생할 수 있도록 여전히
      `include: ["reasoning.encrypted_content"]`를 요청합니다.
    - `web_search`, `x_search`, `code_execution`은 OpenClaw 도구로 노출됩니다.
      OpenClaw는 모든 네이티브 도구를 모든 채팅 턴에 연결하는 대신, 각 도구 요청 안에서
      필요한 특정 xAI 내장 기능을 활성화합니다.
    - Grok `web_search`는 `plugins.entries.xai.config.webSearch.baseUrl`을 읽습니다.
      `x_search`는 `plugins.entries.xai.config.xSearch.baseUrl`을 읽은 뒤
      Grok 웹 검색 기본 URL로 폴백합니다.
    - `x_search`와 `code_execution`은 코어 모델 런타임에 하드코딩되지 않고
      번들된 xAI Plugin이 소유합니다.
    - `code_execution`은 원격 xAI 샌드박스 실행이며, 로컬
      [`exec`](/ko/tools/exec)가 아닙니다.
  </Accordion>
</AccordionGroup>

## 라이브 테스트

xAI 미디어 경로는 단위 테스트와 옵트인 라이브 제품군으로 다룹니다. 라이브 프로브를
실행하기 전에 프로세스 환경에서 `XAI_API_KEY`를 내보내세요.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

제공자별 라이브 파일은 일반 TTS, 전화 통화에 적합한 PCM TTS를 합성하고,
xAI 배치 STT를 통해 오디오를 전사하며, 동일한 PCM을 xAI 실시간 STT로 스트리밍하고,
텍스트-이미지 출력을 생성하며, 참조 이미지를 편집합니다. 공유 이미지 라이브 파일은
OpenClaw의 런타임 선택, 폴백, 정규화, 미디어 첨부 파일 경로를 통해 동일한 xAI 제공자를 검증합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="모든 제공자" href="/ko/providers/index" icon="grid-2">
    더 광범위한 제공자 개요.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 수정 방법.
  </Card>
</CardGroup>
