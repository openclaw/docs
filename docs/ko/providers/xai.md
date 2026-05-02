---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려고 합니다
    - xAI 인증 또는 모델 ID를 구성하는 경우
summary: OpenClaw에서 xAI Grok 모델 사용
title: xAI
x-i18n:
    generated_at: "2026-05-02T21:12:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f36b597fd5c47b61724080deb0d545bca024aca17744fc8aa6a0eb4872d12d2
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw는 Grok 모델용 번들 `xai` 제공자 Plugin을 제공합니다.

## 시작하기

<Steps>
  <Step title="API 키 만들기">
    [xAI 콘솔](https://console.x.ai/)에서 API 키를 만듭니다.
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
xAI 키를 `plugins.entries.xai.config.webSearch.apiKey` 아래에 저장하면,
번들 xAI 모델 제공자도 그 키를 폴백으로 재사용합니다.
Grok `web_search`와 기본적으로 `x_search`를 운영자 xAI Responses 프록시를 통해 라우팅하려면
`plugins.entries.xai.config.webSearch.baseUrl`을 설정합니다.
`code_execution` 조정은 `plugins.entries.xai.config.codeExecution` 아래에 있습니다.
</Note>

## 기본 제공 카탈로그

OpenClaw에는 다음 xAI 모델 패밀리가 기본으로 포함되어 있습니다.

| 패밀리         | 모델 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4.3       | `grok-4.3`                                                               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

또한 이 Plugin은 동일한 API 형태를 따르는 최신 `grok-4*` 및
`grok-code-fast*` ID를 전달 해석합니다.

<Tip>
`grok-4.3`, `grok-4-fast`, `grok-4-1-fast` 및 `grok-4.20-beta-*`
변형은 번들 카탈로그의 현재 이미지 지원 Grok 참조입니다.
</Tip>

## OpenClaw 기능 범위

번들 Plugin은 xAI의 현재 공개 API 표면을 OpenClaw의 공유
제공자 및 도구 계약에 매핑합니다. 공유 계약에 맞지 않는 기능
(예: 스트리밍 TTS 및 실시간 음성)은 노출되지 않습니다. 아래 표를
참조하세요.

| xAI 기능                    | OpenClaw 표면                              | 상태                                                            |
| -------------------------- | ----------------------------------------- | --------------------------------------------------------------- |
| 채팅 / Responses           | `xai/<model>` 모델 제공자                  | 예                                                              |
| 서버 측 웹 검색             | `web_search` 제공자 `grok`                | 예                                                              |
| 서버 측 X 검색              | `x_search` 도구                            | 예                                                              |
| 서버 측 코드 실행           | `code_execution` 도구                      | 예                                                              |
| 이미지                     | `image_generate`                          | 예                                                              |
| 비디오                     | `video_generate`                          | 예                                                              |
| 배치 텍스트 음성 변환       | `messages.tts.provider: "xai"` / `tts`    | 예                                                              |
| 스트리밍 TTS               | —                                         | 노출되지 않음; OpenClaw의 TTS 계약은 완전한 오디오 버퍼를 반환함 |
| 배치 음성 텍스트 변환       | `tools.media.audio` / 미디어 이해          | 예                                                              |
| 스트리밍 음성 텍스트 변환   | Voice Call `streaming.provider: "xai"`    | 예                                                              |
| 실시간 음성                | —                                         | 아직 노출되지 않음; 다른 세션/WebSocket 계약                    |
| 파일 / 배치                | 일반 모델 API 호환성만                    | 일급 OpenClaw 도구가 아님                                       |

<Note>
OpenClaw는 미디어 생성, 음성, 배치 전사에는 xAI의 REST 이미지/비디오/TTS/STT API를,
실시간 음성 통화 전사에는 xAI의 스트리밍 STT WebSocket을,
모델, 검색, 코드 실행 도구에는 Responses API를 사용합니다. 실시간
음성 세션처럼 다른 OpenClaw 계약이 필요한 기능은 숨겨진 Plugin 동작이 아니라
상위 제공 기능으로 여기 문서화되어 있습니다.
</Note>

### 빠른 모드 매핑

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`는
네이티브 xAI 요청을 다음과 같이 다시 작성합니다.

| 소스 모델      | 빠른 모드 대상     |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 레거시 호환성 별칭

레거시 별칭은 여전히 표준 번들 ID로 정규화됩니다.

| 레거시 별칭               | 표준 ID                               |
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

  <Accordion title="비디오 생성">
    번들 `xai` Plugin은 공유 `video_generate` 도구를 통해 비디오 생성을 등록합니다.

    - 기본 비디오 모델: `xai/grok-imagine-video`
    - 모드: 텍스트-비디오, 이미지-비디오, 참조 이미지 생성, 원격
      비디오 편집, 원격 비디오 확장
    - 종횡비: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`
    - 해상도: `480P`, `720P`
    - 길이: 생성/이미지-비디오의 경우 1-15초, `reference_image` 역할을
      사용할 때 1-10초, 확장의 경우 2-10초
    - 참조 이미지 생성: 제공된 모든 이미지에 대해 `imageRoles`를
      `reference_image`로 설정합니다. xAI는 이러한 이미지를 최대 7개까지 허용합니다.

    <Warning>
    로컬 비디오 버퍼는 허용되지 않습니다. 비디오 편집/확장 입력에는 원격
    `http(s)` URL을 사용하세요. OpenClaw가 xAI용 데이터 URL로 인코딩할 수 있으므로
    이미지-비디오는 로컬 이미지 버퍼를 허용합니다.
    </Warning>

    xAI를 기본 비디오 제공자로 사용하려면 다음을 설정합니다.

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
    공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을
    참조하세요.
    </Note>

  </Accordion>

  <Accordion title="이미지 생성">
    번들 `xai` Plugin은 공유 `image_generate` 도구를 통해 이미지 생성을 등록합니다.

    - 기본 이미지 모델: `xai/grok-imagine-image`
    - 추가 모델: `xai/grok-imagine-image-pro`
    - 모드: 텍스트-이미지 및 참조 이미지 편집
    - 참조 입력: `image` 하나 또는 최대 다섯 개의 `images`
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
    xAI는 `quality`, `mask`, `user` 및 `1:2`, `2:1`, `9:20`,
    `20:9` 같은 추가 네이티브 비율도 문서화합니다. OpenClaw는 현재 공유
    교차 제공자 이미지 제어만 전달하며, 지원되지 않는 네이티브 전용 조절값은
    의도적으로 `image_generate`를 통해 노출하지 않습니다.
    </Note>

  </Accordion>

  <Accordion title="텍스트 음성 변환">
    번들 `xai` Plugin은 공유 `tts` 제공자 표면을 통해 텍스트 음성 변환을 등록합니다.

    - 음성: `eve`, `ara`, `rex`, `sal`, `leo`, `una`
    - 기본 음성: `eve`
    - 형식: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 언어: BCP-47 코드 또는 `auto`
    - 속도: 제공자 네이티브 속도 재정의
    - 네이티브 Opus 음성 메모 형식은 지원되지 않음

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
    OpenClaw는 xAI의 배치 `/v1/tts` 엔드포인트를 사용합니다. xAI는 WebSocket을 통한
    스트리밍 TTS도 제공하지만, OpenClaw 음성 제공자 계약은 현재
    답장 전달 전에 완전한 오디오 버퍼를 기대합니다.
    </Note>

  </Accordion>

  <Accordion title="음성 텍스트 변환">
    번들 `xai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해
    배치 음성 텍스트 변환을 등록합니다.

    - 기본 모델: `grok-stt`
    - 엔드포인트: xAI REST `/v1/stt`
    - 입력 경로: multipart 오디오 파일 업로드
    - Discord 음성 채널 세그먼트 및 채널 오디오 첨부 파일을 포함하여
      인바운드 오디오 전사가 `tools.media.audio`를 사용하는 모든 위치에서 OpenClaw가 지원

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

    언어는 공유 오디오 미디어 구성이나 호출별 전사 요청을 통해 제공할 수 있습니다.
    프롬프트 힌트는 공유 OpenClaw 표면에서 허용되지만, xAI REST STT 통합은
    현재 공개 xAI 엔드포인트에 깔끔하게 매핑되는 파일, 모델, 언어만 전달합니다.

  </Accordion>

  <Accordion title="스트리밍 음성 텍스트 변환">
    번들 `xai` Plugin은 실시간 음성 통화 오디오용 실시간 전사 제공자도 등록합니다.

    - 엔드포인트: xAI WebSocket `wss://api.x.ai/v1/stt`
    - 기본 인코딩: `mulaw`
    - 기본 샘플링 레이트: `8000`
    - 기본 엔드포인팅: `800ms`
    - 중간 전사: 기본적으로 활성화됨

    Voice Call의 Twilio 미디어 스트림은 G.711 µ-law 오디오 프레임을 보내므로,
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

    Provider 소유 구성은
    `plugins.entries.voice-call.config.streaming.providers.xai` 아래에 있습니다. 지원되는
    키는 `apiKey`, `baseUrl`, `sampleRate`, `encoding`(`pcm`, `mulaw` 또는
    `alaw`), `interimResults`, `endpointingMs`, `language`입니다.

    <Note>
    이 스트리밍 Provider는 Voice Call의 실시간 전사 경로용입니다.
    Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 배치
    `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="x_search 구성">
    번들 xAI Plugin은 Grok을 통해 X(이전 Twitter) 콘텐츠를 검색하기 위한
    OpenClaw 도구로 `x_search`를 노출합니다.

    구성 경로: `plugins.entries.xai.config.xSearch`

    | 키                 | 유형    | 기본값             | 설명                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | x_search를 활성화하거나 비활성화     |
    | `model`            | string  | `grok-4-1-fast`    | x_search 요청에 사용되는 모델        |
    | `baseUrl`          | string  | —                  | xAI Responses 기본 URL 재정의        |
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
    번들 xAI Plugin은 xAI의 샌드박스 환경에서 원격 코드 실행을 위한
    OpenClaw 도구로 `code_execution`을 노출합니다.

    구성 경로: `plugins.entries.xai.config.codeExecution`

    | 키                | 유형    | 기본값                    | 설명                                 |
    | ----------------- | ------- | ------------------------- | ------------------------------------ |
    | `enabled`         | boolean | `true`(키가 있으면)       | 코드 실행을 활성화하거나 비활성화    |
    | `model`           | string  | `grok-4-1-fast`           | 코드 실행 요청에 사용되는 모델       |
    | `maxTurns`        | number  | —                         | 최대 대화 턴 수                      |
    | `timeoutSeconds`  | number  | —                         | 요청 제한 시간(초)                   |

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

  <Accordion title="알려진 제한 사항">
    - 현재 인증은 API 키만 지원합니다. OpenClaw에는 아직 xAI OAuth 또는 디바이스 코드 흐름이 없습니다.
    - `grok-4.20-multi-agent-experimental-beta-0304`는 표준 OpenClaw xAI 전송과 다른 업스트림 API 표면이 필요하므로 일반 xAI Provider 경로에서 지원되지 않습니다.
    - xAI Realtime 음성은 아직 OpenClaw Provider로 등록되지 않았습니다. 배치 STT 또는 스트리밍 전사와는 다른 양방향 음성 세션 계약이 필요합니다.
    - xAI 이미지 `quality`, 이미지 `mask`, 추가 네이티브 전용 종횡비는 공유 `image_generate` 도구에 해당하는 Provider 간 제어가 추가될 때까지 노출되지 않습니다.

  </Accordion>

  <Accordion title="고급 참고 사항">
    - OpenClaw는 공유 러너 경로에서 xAI 전용 도구 스키마 및 도구 호출 호환성 수정 사항을 자동으로 적용합니다.
    - 네이티브 xAI 요청의 기본값은 `tool_stream: true`입니다. 비활성화하려면 `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`로 설정하세요.
    - 번들 xAI 래퍼는 네이티브 xAI 요청을 보내기 전에 지원되지 않는 엄격한 도구 스키마 플래그와 reasoning 페이로드 키를 제거합니다.
    - `web_search`, `x_search`, `code_execution`은 OpenClaw 도구로 노출됩니다. OpenClaw는 모든 네이티브 도구를 모든 채팅 턴에 붙이는 대신 각 도구 요청 내부에서 필요한 특정 xAI 내장 기능을 활성화합니다.
    - Grok `web_search`는 `plugins.entries.xai.config.webSearch.baseUrl`을 읽습니다. `x_search`는 `plugins.entries.xai.config.xSearch.baseUrl`을 읽은 다음, Grok 웹 검색 기본 URL로 대체합니다.
    - `x_search`와 `code_execution`은 핵심 모델 런타임에 하드코딩된 것이 아니라 번들 xAI Plugin이 소유합니다.
    - `code_execution`은 원격 xAI 샌드박스 실행이며, 로컬 [`exec`](/ko/tools/exec)가 아닙니다.

  </Accordion>
</AccordionGroup>

## 라이브 테스트

xAI 미디어 경로는 단위 테스트와 선택형 라이브 제품군으로 다룹니다. 라이브
명령은 `XAI_API_KEY`를 탐지하기 전에 `~/.profile`을 포함한 로그인 셸에서
비밀 값을 로드합니다.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Provider별 라이브 파일은 일반 TTS, 전화 통화에 적합한 PCM TTS를 합성하고,
xAI 배치 STT를 통해 오디오를 전사하며, 동일한 PCM을 xAI 실시간 STT로
스트리밍하고, 텍스트-이미지 출력을 생성하며, 참조 이미지를 편집합니다. 공유
이미지 라이브 파일은 OpenClaw의 런타임 선택, 폴백, 정규화, 미디어 첨부 경로를
통해 동일한 xAI Provider를 검증합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 Provider 선택.
  </Card>
  <Card title="모든 Provider" href="/ko/providers/index" icon="grid-2">
    더 넓은 Provider 개요.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 수정 방법.
  </Card>
</CardGroup>
