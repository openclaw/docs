---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려는 경우
    - xAI 인증 또는 모델 ID를 구성하는 경우
summary: OpenClaw에서 xAI Grok 모델 사용
title: xAI
x-i18n:
    generated_at: "2026-05-06T06:38:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0e682ba31829faeeb992818aa6a36ab4d18b79723009c5f37559c28160af499
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw는 Grok 모델용 번들 `xai` 제공자 Plugin을 제공합니다.

## 시작하기

<Steps>
  <Step title="API 키 생성">
    [xAI 콘솔](https://console.x.ai/)에서 API 키를 생성합니다.
  </Step>
  <Step title="API 키 설정">
    `XAI_API_KEY`를 설정하거나 다음을 실행합니다.

    ```bash
    openclaw onboard --auth-choice xai-api-key
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
OpenClaw는 번들 xAI 전송 방식으로 xAI Responses API를 사용합니다. 동일한
`XAI_API_KEY`는 Grok 기반 `web_search`, 일급 `x_search`,
원격 `code_execution`에도 사용할 수 있습니다.
xAI 키를 `plugins.entries.xai.config.webSearch.apiKey` 아래에 저장하면
번들 xAI 모델 제공자도 해당 키를 대체 키로 재사용합니다.
Grok `web_search`와 기본적으로 `x_search`를 운영자 xAI Responses 프록시를 통해
라우팅하려면 `plugins.entries.xai.config.webSearch.baseUrl`을 설정합니다.
`code_execution` 조정은 `plugins.entries.xai.config.codeExecution` 아래에 있습니다.
</Note>

## 내장 카탈로그

OpenClaw에는 기본적으로 다음 xAI 모델 제품군이 포함되어 있습니다.

| 제품군         | 모델 ID                                                                 |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin은 동일한 API 형태를 따르는 최신 `grok-4*` 및 `grok-code-fast*` ID도
전방 확인합니다.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` 및 `grok-4.20-beta-*`
변형은 번들 카탈로그의 현재 이미지 지원 Grok 참조입니다.
</Tip>

## OpenClaw 기능 범위

번들 Plugin은 xAI의 현재 공개 API 표면을 OpenClaw의 공유 제공자 및 도구 계약에
매핑합니다. 공유 계약에 맞지 않는 기능(예: 스트리밍 TTS 및 실시간 음성)은
노출되지 않습니다. 아래 표를 참조하세요.

| xAI 기능                   | OpenClaw 표면                             | 상태                                                                |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| 채팅 / Responses           | `xai/<model>` 모델 제공자                 | 예                                                                  |
| 서버 측 웹 검색            | `web_search` 제공자 `grok`                | 예                                                                  |
| 서버 측 X 검색             | `x_search` 도구                           | 예                                                                  |
| 서버 측 코드 실행          | `code_execution` 도구                     | 예                                                                  |
| 이미지                     | `image_generate`                          | 예                                                                  |
| 동영상                     | `video_generate`                          | 예                                                                  |
| 일괄 텍스트 음성 변환      | `messages.tts.provider: "xai"` / `tts`    | 예                                                                  |
| 스트리밍 TTS               | -                                         | 노출되지 않음; OpenClaw의 TTS 계약은 완전한 오디오 버퍼를 반환합니다 |
| 일괄 음성 텍스트 변환      | `tools.media.audio` / 미디어 이해         | 예                                                                  |
| 스트리밍 음성 텍스트 변환  | 음성 통화 `streaming.provider: "xai"`     | 예                                                                  |
| 실시간 음성                | -                                         | 아직 노출되지 않음; 다른 세션/WebSocket 계약                        |
| 파일 / 배치                | 일반 모델 API 호환성만                   | 일급 OpenClaw 도구가 아님                                           |

<Note>
OpenClaw는 미디어 생성, 음성 및 일괄 전사에 xAI의 REST 이미지/동영상/TTS/STT API를 사용하고,
라이브 음성 통화 전사에는 xAI의 스트리밍 STT WebSocket을 사용하며,
모델, 검색 및 코드 실행 도구에는 Responses API를 사용합니다. 실시간 음성 세션처럼
다른 OpenClaw 계약이 필요한 기능은 숨겨진 Plugin 동작이 아니라 업스트림 기능으로
여기에 문서화되어 있습니다.
</Note>

### 빠른 모드 매핑

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`는
네이티브 xAI 요청을 다음과 같이 다시 작성합니다.

| 원본 모델     | 빠른 모드 대상    |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 레거시 호환성 별칭

레거시 별칭은 여전히 표준 번들 ID로 정규화됩니다.

| 레거시 별칭               | 표준 ID                              |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 기능

<AccordionGroup>
  <Accordion title="웹 검색">
    번들 `grok` 웹 검색 제공자도 `XAI_API_KEY`를 사용합니다.

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="동영상 생성">
    번들 `xai` Plugin은 공유 `video_generate` 도구를 통해 동영상 생성을 등록합니다.

    - 기본 동영상 모델: `xai/grok-imagine-video`
    - 모드: 텍스트-동영상, 이미지-동영상, 참조 이미지 생성, 원격
      동영상 편집 및 원격 동영상 확장
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 해상도: `480P`, `720P`
    - 길이: 생성/이미지-동영상은 1~15초, `reference_image` 역할을
      사용할 때는 1~10초, 확장은 2~10초
    - 참조 이미지 생성: 제공된 모든 이미지에 대해 `imageRoles`를 `reference_image`로
      설정합니다. xAI는 이러한 이미지를 최대 7개까지 허용합니다.

    <Warning>
    로컬 동영상 버퍼는 허용되지 않습니다. 동영상 편집/확장 입력에는 원격
    `http(s)` URL을 사용하세요. OpenClaw가 해당 이미지를 xAI용 데이터 URL로
    인코딩할 수 있으므로 이미지-동영상은 로컬 이미지 버퍼를 허용합니다.
    </Warning>

    xAI를 기본 동영상 제공자로 사용하려면 다음을 설정합니다.

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
    공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은
    [동영상 생성](/ko/tools/video-generation)을 참조하세요.
    </Note>

  </Accordion>

  <Accordion title="이미지 생성">
    번들 `xai` Plugin은 공유 `image_generate` 도구를 통해 이미지 생성을 등록합니다.

    - 기본 이미지 모델: `xai/grok-imagine-image`
    - 추가 모델: `xai/grok-imagine-image-pro`
    - 모드: 텍스트-이미지 및 참조 이미지 편집
    - 참조 입력: 하나의 `image` 또는 최대 다섯 개의 `images`
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 해상도: `1K`, `2K`
    - 개수: 최대 4개 이미지

    OpenClaw는 생성된 미디어를 일반 채널 첨부 경로를 통해 저장하고 전달할 수 있도록
    xAI에 `b64_json` 이미지 응답을 요청합니다. 로컬 참조 이미지는 데이터 URL로
    변환되고, 원격 `http(s)` 참조는 그대로 전달됩니다.

    xAI를 기본 이미지 제공자로 사용하려면 다음을 설정합니다.

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
    xAI는 `quality`, `mask`, `user` 및 `1:2`, `2:1`, `9:20`, `20:9`와 같은
    추가 네이티브 비율도 문서화합니다. OpenClaw는 현재 공유 교차 제공자 이미지
    제어만 전달하며, 지원되지 않는 네이티브 전용 조정값은 의도적으로
    `image_generate`를 통해 노출하지 않습니다.
    </Note>

  </Accordion>

  <Accordion title="텍스트 음성 변환">
    번들 `xai` Plugin은 공유 `tts` 제공자 표면을 통해 텍스트 음성 변환을 등록합니다.

    - 음성: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - 기본 음성: `eve`
    - 형식: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 언어: BCP-47 코드 또는 `auto`
    - 속도: 제공자 네이티브 속도 재정의
    - 네이티브 Opus 음성 메모 형식은 지원되지 않습니다.

    xAI를 기본 TTS 제공자로 사용하려면 다음을 설정합니다.

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw는 xAI의 일괄 `/v1/tts` 엔드포인트를 사용합니다. xAI는 WebSocket을 통한
    스트리밍 TTS도 제공하지만, OpenClaw 음성 제공자 계약은 현재 응답 전달 전에
    완전한 오디오 버퍼를 기대합니다.
    </Note>

  </Accordion>

  <Accordion title="음성 텍스트 변환">
    번들 `xai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해
    일괄 음성 텍스트 변환을 등록합니다.

    - 기본 모델: `grok-stt`
    - 엔드포인트: xAI REST `/v1/stt`
    - 입력 경로: 멀티파트 오디오 파일 업로드
    - Discord 음성 채널 세그먼트 및 채널 오디오 첨부를 포함해
      인바운드 오디오 전사가 `tools.media.audio`를 사용하는 모든 곳에서
      OpenClaw가 지원합니다.

    인바운드 오디오 전사에 xAI를 강제로 사용하려면 다음을 설정합니다.

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
    현재 공개 xAI 엔드포인트에 깔끔하게 매핑되는 파일, 모델 및 언어만 전달합니다.

  </Accordion>

  <Accordion title="스트리밍 음성 텍스트 변환">
    번들 `xai` Plugin은 라이브 음성 통화 오디오용 실시간 전사 제공자도 등록합니다.

    - 엔드포인트: xAI WebSocket `wss://api.x.ai/v1/stt`
    - 기본 인코딩: `mulaw`
    - 기본 샘플 레이트: `8000`
    - 기본 엔드포인팅: `800ms`
    - 중간 전사: 기본적으로 활성화됨

    음성 통화의 Twilio 미디어 스트림은 G.711 µ-law 오디오 프레임을 보내므로,
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

    Provider 소유 config는
    `plugins.entries.voice-call.config.streaming.providers.xai` 아래에 있습니다. 지원되는
    key는 `apiKey`, `baseUrl`, `sampleRate`, `encoding`(`pcm`, `mulaw` 또는
    `alaw`), `interimResults`, `endpointingMs`, `language`입니다.

    <Note>
    이 streaming provider는 Voice Call의 실시간 transcription 경로용입니다.
    Discord 음성은 현재 짧은 segment를 녹음하고 대신 batch
    `tools.media.audio` transcription 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="x_search configuration">
    번들 xAI Plugin은 Grok을 통해 X(이전 Twitter) 콘텐츠를 검색하기 위한
    OpenClaw 도구로 `x_search`를 노출합니다.

    Config 경로: `plugins.entries.xai.config.xSearch`

    | Key                | Type    | Default            | Description                          |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | -                  | x_search 활성화 또는 비활성화           |
    | `model`            | string  | `grok-4-1-fast`    | x_search 요청에 사용되는 model     |
    | `baseUrl`          | string  | -                  | xAI Responses base URL override      |
    | `inlineCitations`  | boolean | -                  | 결과에 inline citation 포함  |
    | `maxTurns`         | number  | -                  | 최대 conversation turn           |
    | `timeoutSeconds`   | number  | -                  | 초 단위 request timeout           |
    | `cacheTtlMinutes`  | number  | -                  | 분 단위 cache time-to-live        |

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

  <Accordion title="Code execution configuration">
    번들 xAI Plugin은 xAI의 sandbox 환경에서 원격 code execution을 수행하기 위한
    OpenClaw 도구로 `code_execution`을 노출합니다.

    Config 경로: `plugins.entries.xai.config.codeExecution`

    | Key               | Type    | Default            | Description                              |
    | ----------------- | ------- | ------------------ | ---------------------------------------- |
    | `enabled`         | boolean | `true`(key가 사용 가능할 경우) | code execution 활성화 또는 비활성화  |
    | `model`           | string  | `grok-4-1-fast`    | code execution 요청에 사용되는 model   |
    | `maxTurns`        | number  | -                  | 최대 conversation turn               |
    | `timeoutSeconds`  | number  | -                  | 초 단위 request timeout               |

    <Note>
    이는 로컬 [`exec`](/ko/tools/exec)이 아니라 원격 xAI sandbox execution입니다.
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

  <Accordion title="Known limits">
    - Auth는 현재 API key만 지원합니다. OpenClaw에는 아직 xAI OAuth 또는 device-code flow가 없습니다.
    - `grok-4.20-multi-agent-experimental-beta-0304`는 표준 OpenClaw xAI transport와 다른 upstream API surface가 필요하므로 일반 xAI provider 경로에서는 지원되지 않습니다.
    - xAI Realtime 음성은 아직 OpenClaw provider로 등록되어 있지 않습니다. batch STT 또는 streaming transcription과는 다른 양방향 음성 session contract가 필요합니다.
    - xAI image `quality`, image `mask`, 추가 native 전용 aspect ratio는 공유 `image_generate` 도구에 해당 cross-provider control이 생기기 전까지 노출되지 않습니다.

  </Accordion>

  <Accordion title="Advanced notes">
    - OpenClaw는 공유 runner 경로에서 xAI 전용 tool-schema 및 tool-call compatibility fix를 자동으로 적용합니다.
    - Native xAI 요청은 기본적으로 `tool_stream: true`입니다. 비활성화하려면 `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로 설정하세요.
    - 번들 xAI wrapper는 native xAI 요청을 보내기 전에 지원되지 않는 strict tool-schema flag와 reasoning payload key를 제거합니다.
    - `web_search`, `x_search`, `code_execution`은 OpenClaw 도구로 노출됩니다. OpenClaw는 모든 chat turn에 모든 native tool을 연결하는 대신 각 tool 요청 안에서 필요한 특정 xAI built-in을 활성화합니다.
    - Grok `web_search`는 `plugins.entries.xai.config.webSearch.baseUrl`을 읽습니다. `x_search`는 `plugins.entries.xai.config.xSearch.baseUrl`을 읽은 다음 Grok web-search base URL로 fallback합니다.
    - `x_search`와 `code_execution`은 core model runtime에 hardcode되어 있지 않고 번들 xAI Plugin이 소유합니다.
    - `code_execution`은 로컬 [`exec`](/ko/tools/exec)이 아니라 원격 xAI sandbox execution입니다.

  </Accordion>
</AccordionGroup>

## Live testing

xAI media 경로는 unit test와 opt-in live suite로 cover됩니다. live
command는 `XAI_API_KEY`를 probe하기 전에 `~/.profile`을 포함한 login shell에서 secret을 load합니다.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Provider별 live file은 일반 TTS, 전화 통화에 적합한 PCM
TTS를 합성하고, xAI batch STT를 통해 audio를 transcript하며, 동일한 PCM을 xAI
realtime STT로 stream하고, text-to-image output을 generate하며, reference image를 edit합니다. 공유 image live file은 OpenClaw의
runtime selection, fallback, normalization, media attachment 경로를 통해 동일한 xAI provider를 verify합니다.

## Related

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    Provider, model ref, failover behavior 선택.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    공유 video tool parameter와 provider selection.
  </Card>
  <Card title="All providers" href="/ko/providers/index" icon="grid-2">
    더 넓은 provider overview.
  </Card>
  <Card title="Troubleshooting" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 issue와 fix.
  </Card>
</CardGroup>
