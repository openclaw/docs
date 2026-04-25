---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려는 경우
    - xAI 인증 또는 모델 ID를 구성하는 경우
summary: OpenClaw에서 xAI Grok 모델 사용하기
title: xAI
x-i18n:
    generated_at: "2026-04-25T18:22:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 420f60d5e80964b926e50cf74cf414d11de1c30d3a4aa8917f1861e0d56ef5b9
    source_path: providers/xai.md
    workflow: 15
---

OpenClaw에는 Grok 모델용 번들 `xai` provider Plugin이 포함되어 있습니다.

## 시작하기

<Steps>
  <Step title="API 키 만들기">
    [xAI console](https://console.x.ai/)에서 API 키를 만드세요.
  </Step>
  <Step title="API 키 설정하기">
    `XAI_API_KEY`를 설정하거나, 다음을 실행하세요.

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="모델 선택하기">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw는 번들된 xAI 전송으로 xAI Responses API를 사용합니다. 같은
`XAI_API_KEY`는 Grok 기반 `web_search`, 기본 제공 `x_search`,
그리고 원격 `code_execution`에도 사용할 수 있습니다.
`plugins.entries.xai.config.webSearch.apiKey` 아래에 xAI 키를 저장하면,
번들된 xAI 모델 provider도 대체값으로 그 키를 재사용합니다.
`code_execution` 조정은 `plugins.entries.xai.config.codeExecution` 아래에 있습니다.
</Note>

## 기본 제공 카탈로그

OpenClaw에는 다음 xAI 모델 패밀리가 기본 포함되어 있습니다.

| 패밀리        | 모델 ID                                                                   |
| ------------- | -------------------------------------------------------------------------- |
| Grok 3        | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`                 |
| Grok 4        | `grok-4`, `grok-4-0709`                                                    |
| Grok 4 Fast   | `grok-4-fast`, `grok-4-fast-non-reasoning`                                 |
| Grok 4.1 Fast | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                             |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code     | `grok-code-fast-1`                                                         |

이 Plugin은 동일한 API 형태를 따르는 더 새로운 `grok-4*` 및 `grok-code-fast*` ID도
포워드 해석합니다.

<Tip>
`grok-4-fast`, `grok-4-1-fast`, 그리고 `grok-4.20-beta-*` 변형은
현재 번들 카탈로그에서 이미지 기능을 지원하는 Grok 참조입니다.
</Tip>

## OpenClaw 기능 지원 범위

번들된 Plugin은 xAI의 현재 공개 API surface를 OpenClaw의 공통
provider 및 도구 계약에 매핑합니다. 공통 계약에 맞지 않는 기능은
(예: 스트리밍 TTS 및 실시간 음성) 노출되지 않습니다. 자세한 내용은 아래
표를 참고하세요.

| xAI 기능                   | OpenClaw surface                        | 상태                                                                  |
| -------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| 채팅 / Responses           | `xai/<model>` 모델 provider             | 예                                                                    |
| 서버 측 웹 검색            | `web_search` provider `grok`            | 예                                                                    |
| 서버 측 X 검색             | `x_search` 도구                         | 예                                                                    |
| 서버 측 코드 실행          | `code_execution` 도구                   | 예                                                                    |
| 이미지                     | `image_generate`                        | 예                                                                    |
| 비디오                     | `video_generate`                        | 예                                                                    |
| 일괄 텍스트 음성 변환      | `messages.tts.provider: "xai"` / `tts`  | 예                                                                    |
| 스트리밍 TTS               | —                                       | 노출되지 않음. OpenClaw의 TTS 계약은 완전한 오디오 버퍼를 반환함     |
| 일괄 음성 텍스트 변환      | `tools.media.audio` / 미디어 이해       | 예                                                                    |
| 스트리밍 음성 텍스트 변환  | Voice Call `streaming.provider: "xai"`  | 예                                                                    |
| 실시간 음성                | —                                       | 아직 노출되지 않음. 다른 세션/WebSocket 계약 필요                    |
| 파일 / 배치                | 일반 모델 API 호환성만                  | OpenClaw의 기본 제공 도구는 아님                                     |

<Note>
OpenClaw는 미디어 생성,
음성, 일괄 전사를 위해 xAI의 REST 이미지/비디오/TTS/STT API를 사용하고, 라이브
음성 통화 전사를 위해 xAI의 스트리밍 STT WebSocket을 사용하며, 모델, 검색,
코드 실행 도구를 위해 Responses API를 사용합니다. 실시간 음성 세션처럼
다른 OpenClaw 계약이 필요한 기능은 숨겨진 Plugin 동작이 아니라
업스트림 기능으로 여기 문서화됩니다.
</Note>

### Fast 모드 매핑

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`는
기본 xAI 요청을 다음과 같이 다시 씁니다.

| 소스 모델     | Fast 모드 대상    |
| ------------- | ----------------- |
| `grok-3`      | `grok-3-fast`     |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`     |
| `grok-4-0709` | `grok-4-fast`     |

### 레거시 호환성 별칭

레거시 별칭은 여전히 기준이 되는 번들 ID로 정규화됩니다.

| 레거시 별칭                | 기준 ID                               |
| -------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`    | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning`  | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`      | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning`  | `grok-4.20-beta-latest-non-reasoning` |

## 기능

<AccordionGroup>
  <Accordion title="웹 검색">
    번들된 `grok` 웹 검색 provider도 `XAI_API_KEY`를 사용합니다.

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="비디오 생성">
    번들된 `xai` Plugin은 공통 `video_generate` 도구를 통해
    비디오 생성을 등록합니다.

    - 기본 비디오 모델: `xai/grok-imagine-video`
    - 모드: text-to-video, image-to-video, reference-image generation, 원격
      비디오 편집, 원격 비디오 확장
    - 화면비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 해상도: `480P`, `720P`
    - 길이: 생성/image-to-video는 1-15초, `reference_image` 역할을
      사용할 때는 1-10초, 확장은 2-10초
    - 참조 이미지 생성: 제공된 모든 이미지에 대해 `imageRoles`를 `reference_image`로 설정하세요.
      xAI는 이러한 이미지를 최대 7개까지 허용합니다

    <Warning>
    로컬 비디오 버퍼는 허용되지 않습니다. 비디오 편집/확장 입력에는
    원격 `http(s)` URL을 사용하세요. image-to-video는 OpenClaw가
    이를 xAI용 data URL로 인코딩할 수 있으므로 로컬 이미지 버퍼를 허용합니다.
    </Warning>

    xAI를 기본 비디오 provider로 사용하려면:

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
    공통 도구 매개변수,
    provider 선택, failover 동작은 [비디오 생성](/ko/tools/video-generation)을 참고하세요.
    </Note>

  </Accordion>

  <Accordion title="이미지 생성">
    번들된 `xai` Plugin은 공통 `image_generate` 도구를 통해
    이미지 생성을 등록합니다.

    - 기본 이미지 모델: `xai/grok-imagine-image`
    - 추가 모델: `xai/grok-imagine-image-pro`
    - 모드: text-to-image 및 reference-image edit
    - 참조 입력: `image` 하나 또는 최대 다섯 개의 `images`
    - 화면비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - 해상도: `1K`, `2K`
    - 개수: 최대 4개 이미지

    OpenClaw는 생성된 미디어를
    일반 채널 첨부 경로를 통해 저장하고 전달할 수 있도록 xAI에 `b64_json` 이미지 응답을 요청합니다. 로컬
    참조 이미지는 data URL로 변환되며, 원격 `http(s)` 참조는
    그대로 전달됩니다.

    xAI를 기본 이미지 provider로 사용하려면:

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
    xAI는 `quality`, `mask`, `user`, 그리고 `1:2`, `2:1`, `9:20`, `20:9` 같은
    추가 기본 화면비도 문서화합니다. OpenClaw는 현재
    공통 교차 provider 이미지 제어만 전달합니다. 지원되지 않는 기본 전용 조절 항목은
    의도적으로 `image_generate`를 통해 노출되지 않습니다.
    </Note>

  </Accordion>

  <Accordion title="텍스트 음성 변환">
    번들된 `xai` Plugin은 공통 `tts`
    provider surface를 통해 텍스트 음성 변환을 등록합니다.

    - 음성: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - 기본 음성: `eve`
    - 형식: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 언어: BCP-47 코드 또는 `auto`
    - 속도: provider 기본 속도 재정의
    - 기본 Opus 음성 메모 형식은 지원되지 않음

    xAI를 기본 TTS provider로 사용하려면:

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
    스트리밍 TTS도 제공하지만, OpenClaw 음성 provider 계약은 현재
    답변 전달 전에 완전한 오디오 버퍼를 기대합니다.
    </Note>

  </Accordion>

  <Accordion title="음성 텍스트 변환">
    번들된 `xai` Plugin은 OpenClaw의
    미디어 이해 전사 surface를 통해 일괄 음성 텍스트 변환을 등록합니다.

    - 기본 모델: `grok-stt`
    - 엔드포인트: xAI REST `/v1/stt`
    - 입력 경로: multipart 오디오 파일 업로드
    - OpenClaw에서 `tools.media.audio`를 사용하는 모든 수신 오디오 전사에 지원되며,
      여기에는 Discord 음성 채널 세그먼트와
      채널 오디오 첨부파일이 포함됩니다

    수신 오디오 전사에 xAI를 강제로 사용하려면:

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

    언어는 공통 오디오 미디어 구성이나 호출별
    전사 요청을 통해 제공할 수 있습니다. 프롬프트 힌트는 공통 OpenClaw
    surface에서 허용되지만, xAI REST STT 통합은 현재 공개 xAI 엔드포인트에
    깔끔하게 매핑되는 file, model, language만 전달합니다.

  </Accordion>

  <Accordion title="스트리밍 음성 텍스트 변환">
    번들된 `xai` Plugin은 라이브 음성 통화 오디오를 위한
    실시간 전사 provider도 등록합니다.

    - 엔드포인트: xAI WebSocket `wss://api.x.ai/v1/stt`
    - 기본 인코딩: `mulaw`
    - 기본 샘플 속도: `8000`
    - 기본 endpointing: `800ms`
    - 중간 전사: 기본적으로 활성화됨

    Voice Call의 Twilio 미디어 스트림은 G.711 µ-law 오디오 프레임을 보내므로,
    xAI provider는 트랜스코딩 없이 해당 프레임을 직접 전달할 수 있습니다.

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

    provider 소유 구성은
    `plugins.entries.voice-call.config.streaming.providers.xai` 아래에 있습니다. 지원되는
    키는 `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw`, 또는
    `alaw`), `interimResults`, `endpointingMs`, `language`입니다.

    <Note>
    이 스트리밍 provider는 Voice Call의 실시간 전사 경로용입니다.
    현재 Discord 음성은 짧은 세그먼트를 기록하고 대신 일괄
    `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="x_search 구성">
    번들된 xAI Plugin은 `x_search`를 Grok을 통해
    X(구 Twitter) 콘텐츠를 검색하는 OpenClaw 도구로 노출합니다.

    구성 경로: `plugins.entries.xai.config.xSearch`

    | 키                 | 유형    | 기본값             | 설명                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_search 활성화 또는 비활성화        |
    | `model`            | string  | `grok-4-1-fast`    | x_search 요청에 사용하는 모델        |
    | `inlineCitations`  | boolean | —                  | 결과에 인라인 인용 포함              |
    | `maxTurns`         | number  | —                  | 최대 대화 턴 수                      |
    | `timeoutSeconds`   | number  | —                  | 요청 제한 시간(초)                   |
    | `cacheTtlMinutes`  | number  | —                  | 캐시 TTL(분)                         |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
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
    번들된 xAI Plugin은 `code_execution`을 xAI의 샌드박스 환경에서
    원격 코드 실행을 수행하는 OpenClaw 도구로 노출합니다.

    구성 경로: `plugins.entries.xai.config.codeExecution`

    | 키                | 유형    | 기본값                     | 설명                                 |
    | ----------------- | ------- | -------------------------- | ------------------------------------ |
    | `enabled`         | boolean | `true` (키 사용 가능 시)   | 코드 실행 활성화 또는 비활성화       |
    | `model`           | string  | `grok-4-1-fast`            | 코드 실행 요청에 사용하는 모델       |
    | `maxTurns`        | number  | —                          | 최대 대화 턴 수                      |
    | `timeoutSeconds`  | number  | —                          | 요청 제한 시간(초)                   |

    <Note>
    이는 로컬 [`exec`](/ko/tools/exec)가 아니라 원격 xAI 샌드박스 실행입니다.
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

  <Accordion title="알려진 제한 사항">
    - 현재 인증은 API 키만 지원합니다. 아직 OpenClaw에는 xAI OAuth 또는 device-code 흐름이 없습니다.
    - `grok-4.20-multi-agent-experimental-beta-0304`는 일반 xAI provider 경로에서 지원되지 않습니다.
      표준 OpenClaw xAI 전송과는 다른 업스트림 API
      surface가 필요하기 때문입니다.
    - xAI Realtime voice는 아직 OpenClaw provider로 등록되지 않았습니다.
      일괄 STT나 스트리밍 전사와는 다른 양방향 음성 세션 계약이 필요합니다.
    - xAI 이미지 `quality`, 이미지 `mask`, 그리고 추가 기본 전용 화면비는
      공통 `image_generate` 도구에 해당하는
      교차 provider 제어가 추가되기 전까지 노출되지 않습니다.
  </Accordion>

  <Accordion title="고급 참고 사항">
    - OpenClaw는 공통 runner 경로에서 xAI 전용 도구 스키마 및 도구 호출 호환성 수정을
      자동으로 적용합니다.
    - 기본 xAI 요청은 기본적으로 `tool_stream: true`입니다.
      이를 비활성화하려면
      `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로 설정하세요.
    - 번들된 xAI 래퍼는 기본 xAI 요청을 보내기 전에
      지원되지 않는 엄격한 도구 스키마 플래그와 추론 페이로드 키를 제거합니다.
    - `web_search`, `x_search`, `code_execution`은 OpenClaw
      도구로 노출됩니다. OpenClaw는 모든 채팅 턴에 모든 기본 제공 도구를 붙이는 대신, 각 도구
      요청 안에서 필요한 특정 xAI 내장 기능만 활성화합니다.
    - `x_search`와 `code_execution`은 코어 모델 런타임에 하드코딩된 것이 아니라
      번들된 xAI Plugin이 소유합니다.
    - `code_execution`은 원격 xAI 샌드박스 실행이며, 로컬
      [`exec`](/ko/tools/exec)가 아닙니다.
  </Accordion>
</AccordionGroup>

## 라이브 테스트

xAI 미디어 경로는 단위 테스트와 옵트인 라이브 스위트로 검증됩니다. 라이브
명령은 `XAI_API_KEY`를 확인하기 전에
`~/.profile`을 포함한 로그인 셸에서 비밀을 로드합니다.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

provider 전용 라이브 파일은 일반 TTS, 전화 친화적 PCM
TTS를 합성하고, xAI 일괄 STT를 통해 오디오를 전사하고, 동일한 PCM을 xAI
실시간 STT로 스트리밍하며, text-to-image 출력을 생성하고, 참조 이미지를 편집합니다. 공통
이미지 라이브 파일은 OpenClaw의
런타임 선택, failover, 정규화, 미디어 첨부 경로를 통해 동일한 xAI provider를 검증합니다.

## 관련

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, failover 동작 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수와 provider 선택.
  </Card>
  <Card title="모든 provider" href="/ko/providers/index" icon="grid-2">
    더 넓은 provider 개요.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
