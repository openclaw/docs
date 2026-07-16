---
read_when:
    - OpenClaw에서 Grok 모델을 사용하려고 합니다
    - xAI 인증 또는 모델 ID를 구성하고 있습니다
summary: OpenClaw에서 xAI Grok 모델을 사용합니다
title: xAI
x-i18n:
    generated_at: "2026-07-16T13:01:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c78617876f18fbb51bd3c8485f764a5b456b6d746476142bb0c5ecdb3decfb3a
    source_path: providers/xai.md
    workflow: 16
---

OpenClaw에는 Grok 모델용 `xai` provider plugin이 번들로 제공됩니다.
권장 방식은 자격을 갖춘 SuperGrok 또는 X Premium 구독으로 Grok OAuth를 사용하는 것입니다.
Gateway, 구성, 라우팅, 도구는 로컬에 유지되며, Grok 요청만
xAI의 API로 전송됩니다.

OAuth에는 xAI API 키나 Grok Build 앱이 필요하지 않습니다. OpenClaw가 xAI의 공유
OAuth 클라이언트를 사용하므로 xAI가 동의 화면에 Grok Build를
표시할 수는 있습니다.

## 설정

<Steps>
  <Step title="새 설치">
    데몬 설치와 함께 온보딩을 실행한 다음, 모델/인증 단계에서 xAI/Grok OAuth를
    선택하십시오.

    ```bash
    openclaw onboard --install-daemon
    ```

    VPS 또는 SSH 환경에서는 xAI OAuth를 직접 선택하십시오. 기기 코드
    검증을 사용하므로 localhost 콜백이 필요하지 않습니다.

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

  </Step>
  <Step title="기존 설치">
    xAI에만 로그인하십시오. Grok을 연결하기 위해 전체 온보딩을 다시 실행하지 마십시오.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Grok을 기본 모델로 별도로 적용하십시오.

    ```bash
    openclaw models set xai/grok-4.3
    ```

    Gateway, 데몬, 채널, 작업 공간 또는 기타 설정 항목을 의도적으로 변경하려는
    경우에만 전체 온보딩을 다시 실행하십시오.

  </Step>
  <Step title="API 키 방식">
    xAI Console 키 및 키 기반 provider 구성이 필요한 미디어 기능에서도
    API 키 설정을 계속 사용할 수 있습니다.

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
OpenClaw는 번들 xAI 전송 방식으로 xAI Responses API를 사용합니다.
`openclaw models auth login --provider xai --method oauth` 또는
`--method api-key`의 동일한 자격 증명은 `web_search`(provider ID `grok`), `x_search`,
`code_execution`, 음성/전사 및 xAI 이미지/동영상 생성에도 사용됩니다.
`plugins.entries.xai.config.webSearch.apiKey`에 xAI 키를 저장하면
번들 xAI 모델 provider도 이를 대체 수단으로 재사용합니다.
</Note>

## OAuth 문제 해결

- SSH, Docker, VPS 또는 기타 원격 설정에서는
  `openclaw models auth login --provider xai --method oauth`을 사용하십시오. localhost 콜백이 아니라
  기기 코드 검증을 사용합니다.
- 로그인에 성공했지만 Grok이 기본 모델이 아닌 경우
  `openclaw models set xai/grok-4.3`을 실행하십시오.
- 저장된 xAI 인증 프로필을 확인하십시오.

  ```bash
  openclaw models auth list --provider xai
  openclaw models status
  ```

- OAuth API 토큰을 받을 수 있는 계정은 xAI가 결정합니다. 계정이
  자격을 충족하지 않으면 API 키 방식을 사용하거나 xAI 측에서 구독을 확인하십시오.

<Tip>
SSH, Docker 또는 VPS에서 로그인할 때는 `xai-oauth`을 사용하십시오. OpenClaw가
URL과 짧은 코드를 출력합니다. 원격 프로세스가 완료된 토큰 교환을 위해
xAI를 폴링하는 동안 로컬 브라우저에서 로그인을 완료하십시오.
</Tip>

## 기본 제공 카탈로그

모델 선택기에서 선택할 수 있는 ID입니다. 기존 구성을 위해 plugin은 이전 Grok 3,
Grok 4, Grok 4 Fast, Grok 4.1 Fast 및 Grok Code ID도 계속 해석합니다.
[레거시 호환성 및 이동형 별칭](#legacy-compatibility-and-moving-aliases)을 참조하십시오.

| 제품군         | 모델 ID                                                    |
| -------------- | ------------------------------------------------------------ |
| Grok 4.5       | `grok-4.5` (별칭: `grok-4.5-latest`, `grok-build-latest`) |
| Grok Build 0.1 | `grok-build-0.1`                                             |
| Grok 4.3       | `grok-4.3` (별칭: `grok-4.3-latest`, `grok-latest`)       |
| Grok 4.20      | `grok-4.20-0309-reasoning`, `grok-4.20-0309-non-reasoning`   |

<Tip>
사용 가능한 경우 일반 채팅, 코딩 및 에이전트 작업에는 `grok-4.5`을 사용하십시오.
Grok 4.3은 지역 안전 기본 설정으로 유지되며, `grok-build-0.1`과 날짜가 지정된
두 Grok 4.20 변형도 계속 선택할 수 있습니다.
</Tip>

## 기능 지원 범위

번들 plugin은 지원되는 xAI API를 OpenClaw의 공유 provider 및
도구 계약에 매핑합니다. 공유 계약에 맞지 않는 기능은
아래 또는 알려진 제한 사항에 나열되어 있습니다.

| xAI 기능                    | OpenClaw 기능 영역                       | 상태                                                 |
| -------------------------- | --------------------------------------- | ---------------------------------------------------- |
| 채팅 / Responses           | `xai/<model>` 모델 provider            | 지원                                                 |
| 서버 측 웹 검색            | `web_search` provider `grok`            | 지원                                                 |
| 서버 측 X 검색             | `x_search` 도구                         | 지원                                                 |
| 서버 측 코드 실행          | `code_execution` 도구                   | 지원                                                 |
| 이미지                     | `image_generate`                        | 지원                                                 |
| 동영상                     | `video_generate`                        | 지원                                                 |
| 일괄 텍스트 음성 변환      | `messages.tts.provider: "xai"` / `tts`  | 지원                                                 |
| 스트리밍 TTS               | `textToSpeechStream`                    | `wss://api.x.ai/v1/tts`을 통해 지원(실시간 음성 아님) |
| 일괄 음성 텍스트 변환      | `tools.media.audio` 미디어 이해 | 지원                                                 |
| 스트리밍 음성 텍스트 변환  | Voice Call `streaming.provider: "xai"`  | 지원                                                 |
| 실시간 음성                | Talk `talk.realtime.provider: "xai"`    | 지원, 네이티브 Talk Node에는 Gateway 릴레이 사용    |
| 파일 / 배치                | 일반 모델 API 호환성만 제공              | OpenClaw의 일급 도구가 아님                          |

<Note>
OpenClaw는 미디어 생성 및 일괄 전사에 xAI의 REST 이미지/동영상/TTS/STT API를,
실시간 음성 통화 전사에 xAI의 스트리밍 STT WebSocket을,
Talk 실시간 세션에 xAI의 Grok Voice Agent WebSocket을,
채팅, 검색 및 코드 실행 도구에 Responses API를 사용합니다.
</Note>

### 레거시 고속 모드 호환성

`/fast on` 또는 `agents.defaults.models["xai/<model>"].params.fastMode: true`은
이전 xAI 구성을 계속 다음과 같이 다시 작성합니다. 이러한 대상 ID는
호환성을 위해서만 유지됩니다. 새 구성에는 현재 선택 가능한 모델을
사용하십시오.

| 소스 모델     | 고속 모드 대상      |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 레거시 호환성 및 이동형 별칭

이전 별칭은 다음과 같이 정규화됩니다.

| 레거시 별칭                                                   | 정규화된 ID      |
| ------------------------------------------------------------- | ---------------- |
| `grok-code-fast-1`, `grok-code-fast`, `grok-code-fast-1-0825` | `grok-build-0.1` |

날짜가 지정된 0309 ID가 선택 가능한 카탈로그 항목입니다. OpenClaw는 그 밖의
모든 현재 Grok 4.20 별칭을 그대로 전송하여 xAI가 안정, 최신,
베타, 실험 및 날짜 지정 별칭의 의미를 계속 제어하도록 합니다. 전역 `grok-latest` 별칭도
그대로 보존됩니다.

xAI는 다음의 정확한 ID를 폐기했습니다. OpenClaw는 출시된 구성을 위해 이를 숨겨진 호환성
행으로 유지하며, 현재 리디렉션 대상의 제한 및 가격을 적용합니다.

| 폐기된 ID                                                            | 현재 동작                        |
| -------------------------------------------------------------------- | -------------------------------- |
| `grok-4-1-fast-reasoning`, `grok-4-fast-reasoning`, `grok-4-0709`    | `low` 추론을 사용하는 Grok 4.3    |
| `grok-4-1-fast-non-reasoning`, `grok-4-fast-non-reasoning`, `grok-3` | 추론이 비활성화된 Grok 4.3       |
| `grok-code-fast-1`                                                   | Grok Build 0.1                   |
| `grok-imagine-image-pro`                                             | Grok Imagine 이미지 품질         |

`openclaw doctor --fix`은 저장된 xAI 서버 도구 기본값과
폐기된 품질 이미지 슬러그를 업데이트하고, 오래된 생성 카탈로그 행을 제거하며,
활성 4.20 행의 오래된 컨텍스트 메타데이터를 복구합니다. 활성 4.20
`beta-latest` 별칭을 날짜가 지정된 스냅샷에 고정하지는 않습니다.

## 기능

<Warning>
  `x_search` 및 `code_execution`은 xAI 서버에서 실행됩니다. xAI는 도구 호출
  1,000회당 $5와 모델의 입력 및 출력 토큰 비용을 청구합니다. 각 도구의
  `enabled` 설정을 생략하면 OpenClaw는 활성 xAI 모델에만 해당 도구를 노출합니다.
  알려진 비 xAI 모델 provider를 사용하려면 도구별 `enabled: true`를 명시해야 하며,
  provider가 누락되거나 해석되지 않으면 안전하게 실패합니다. xAI 인증은 항상 필요하며,
  `enabled: false`은 모든 provider에서 해당 도구를 비활성화합니다.
</Warning>

<AccordionGroup>
  <Accordion title="웹 검색">
    번들 `grok` 웹 검색 provider는 xAI OAuth를 우선 사용한 후,
    `XAI_API_KEY` 또는 plugin 웹 검색 키를 대체 수단으로 사용합니다.

    ```bash
    openclaw models auth login --provider xai --method oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="동영상 생성">
    번들 `xai` plugin은 공유
    `video_generate` 도구를 통해 동영상 생성을 등록합니다.

    - 기본 모델: `xai/grok-imagine-video`
    - 추가 모델: `xai/grok-imagine-video-1.5`
    - 클래식 모드: 텍스트-동영상, 이미지-동영상, 참조 이미지 생성,
      원격 동영상 편집 및 원격 동영상 확장
    - Video 1.5 모드: 정확히 하나의 첫 프레임 이미지를 사용하는 이미지-동영상만 지원
    - 화면 비율: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`;
      생략하면 클래식 및 Video 1.5 이미지-동영상은 소스 이미지 비율을
      상속합니다.
    - 해상도: 클래식 `480P`/`720P`; Video 1.5는 `1080P`도 지원하며, 모든
      생성 모드의 기본값은 `480P`입니다.
    - 길이: 생성/이미지-동영상은 1-15초, 클래식 `reference_image` 역할을
      사용할 때는 1-10초, 클래식 확장은 2-10초
    - 참조 이미지 생성: 제공하는 모든 이미지에 대해 `imageRoles`을
      `reference_image`으로 설정하십시오. xAI는 이러한 이미지를 최대 7개까지 허용합니다.
    - 동영상 편집/확장은 입력 동영상의 화면 비율과 해상도를 상속하며,
      이러한 작업에는 기하 구조 재정의를 사용할 수 없습니다.
    - 기본 작업 제한 시간: `video_generate.timeoutMs`
      또는 `agents.defaults.videoGenerationModel.timeoutMs`이 설정되지 않은 경우 600초

    <Warning>
    로컬 동영상 버퍼는 허용되지 않습니다. 동영상 편집/확장 입력에는 원격
    `http(s)` URL을 사용하십시오. 이미지-동영상은 OpenClaw가 로컬 이미지를
    xAI용 데이터 URL로 인코딩하므로 로컬 이미지 버퍼를 허용합니다.
    </Warning>

    Video 1.5는 xAI의 `grok-imagine-video-1.5-preview` 및
    `grok-imagine-video-1.5-2026-05-30` 식별자도 인식합니다. OpenClaw는
    선택한 식별자를 변경하지 않고 전달하지만 동일한 이미지 전용 검증을 적용합니다.

    xAI를 기본 동영상 provider로 사용하려면 다음과 같이 설정하십시오.

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
    공유 도구 매개변수, provider 선택 및 장애 조치 동작은
    [동영상 생성](/ko/tools/video-generation)을 참조하십시오.
    </Note>

  </Accordion>

  <Accordion title="이미지 생성">
    번들 `xai` plugin은 공유
    `image_generate` 도구를 통해 이미지 생성을 등록합니다.

    - 기본 이미지 모델: `xai/grok-imagine-image`
    - 추가 모델: `xai/grok-imagine-image-quality`
    - 모드: 텍스트-이미지 생성 및 참조 이미지 편집
    - 참조 입력: `image` 1개 또는 `images` 최대 3개
    - 가로세로 비율: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - 해상도: `1K`, `2K`
    - 개수: 최대 4개 이미지
    - 기본 작업 제한 시간: `image_generate.timeoutMs`
      또는 `agents.defaults.imageGenerationModel.timeoutMs`이 설정되지 않은 경우 600초

    OpenClaw는 생성된 미디어를 일반 채널 첨부 파일 경로를 통해 저장하고
    전달할 수 있도록 xAI에 `b64_json` 이미지 응답을 요청합니다. 로컬
    참조 이미지는 데이터 URL로 변환되며, 원격 `http(s)` 참조는
    변경 없이 전달됩니다.

    xAI를 기본 이미지 제공자로 사용하려면 다음과 같이 설정하십시오.

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
    xAI는 `quality`, `mask`, `user` 및 `auto` 가로세로 비율도 문서화합니다.
    현재 OpenClaw는 제공자 간에 공통으로 지원되는 이미지 제어만 전달하며,
    이러한 xAI 전용 설정은 `image_generate`을 통해 노출되지 않습니다.
    </Note>

  </Accordion>

  <Accordion title="텍스트 음성 변환">
    번들로 제공되는 `xai` Plugin은 공유 `tts`
    제공자 인터페이스를 통해 텍스트 음성 변환을 등록합니다.

    - 음성: xAI에서 인증을 거쳐 가져오는 실시간 카탈로그이며, 다음 명령으로 나열할 수 있습니다.
      `openclaw infer tts voices --provider xai`
    - 오프라인 대체 음성: `ara`, `eve`, `leo`, `rex`, `sal`
    - 기본 음성: `eve`
    - 계정의 사용자 지정 음성 ID는 기본 제공 카탈로그 응답에
      없더라도 전달됩니다.
    - 형식: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`
    - 언어: BCP-47 코드 또는 `auto`
    - 속도: 제공자 네이티브 속도 재정의
    - 네이티브 Opus 음성 메시지 형식은 지원되지 않습니다.

    xAI를 기본 TTS 제공자로 사용하려면 다음과 같이 설정하십시오.

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
    OpenClaw는 버퍼링된 합성에 xAI의 배치 `/v1/tts` 엔드포인트를 사용하고,
    인증된 `/v1/tts/voices` 카탈로그 검색과 스트리밍 합성에 네이티브
    `wss://api.x.ai/v1/tts`을 사용합니다. 스트리밍은 네이티브 `api.x.ai`
    호스트로 제한되므로 사용자 지정 `baseUrl` 값은 이 경로에서 거부됩니다.
    기존 언어, 음성, 코덱 및 속도 제어를 사용하며, 샘플 레이트와 비트 레이트에는
    xAI 기본값이 적용됩니다. 오디오 파일 합성은 구성된 모든 코덱을 따릅니다.
    xAI의 원시 코덱에는 코덱/레이트 메타데이터가 포함되지 않으므로 음성 메시지
    대상은 스트리밍 및 버퍼링된 대체 처리에 MP3를 사용합니다. 스트림은
    `text.delta`를 보낸 다음
    `text.done`을 보내고, `audio.delta`, `audio.done` 또는 `error`을 수신하며,
    각 오디오 청크마다 갱신되는 유휴 `timeoutMs`을 적용합니다. 이는 실시간
    음성 세션과 별개입니다. xAI의 [스트리밍 TTS API](https://docs.x.ai/developers/rest-api-reference/inference/voice) 계약을 참조하십시오.
    </Note>

  </Accordion>

  <Accordion title="음성 텍스트 변환">
    번들로 제공되는 `xai` Plugin은 OpenClaw의 미디어 이해
    전사 인터페이스를 통해 배치 음성 텍스트 변환을 등록합니다.

    - 엔드포인트: xAI REST `/v1/stt`
    - 입력 경로: 멀티파트 오디오 파일 업로드
    - 모델 선택: xAI가 내부적으로 전사 모델을 선택하며,
      엔드포인트에는 모델 선택기가 없습니다.
    - Discord 음성 채널 세그먼트와 채널 오디오 첨부 파일을 포함하여
      수신 오디오 전사가 `tools.media.audio`을 읽는 모든 곳에서 사용됩니다.

    수신 오디오 전사에 xAI를 강제로 사용하려면 다음과 같이 설정하십시오.

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
              },
            ],
          },
        },
      },
    }
    ```

    언어는 공유 오디오 미디어 구성 또는 호출별 전사 요청을 통해 지정할 수
    있습니다. 공유 OpenClaw 인터페이스는 프롬프트 힌트를 허용하지만, 현재 공개
    xAI 엔드포인트에 매핑되는 항목은 파일과 언어뿐이므로 xAI REST STT 통합은
    이 두 항목만 전달합니다.

  </Accordion>

  <Accordion title="스트리밍 음성 텍스트 변환">
    번들로 제공되는 `xai` Plugin은 실시간 음성 통화 오디오를 위한
    실시간 전사 제공자도 등록합니다.

    - 엔드포인트: xAI WebSocket `wss://api.x.ai/v1/stt`
    - 기본 인코딩: `mulaw`
    - 기본 샘플 레이트: `8000`
    - 기본 발화 종료 감지: `800ms`
    - 중간 전사: 기본적으로 활성화됨

    Voice Call의 Twilio 미디어 스트림은 G.711 mu-law 오디오 프레임을 전송하므로,
    xAI 제공자는 트랜스코딩 없이 해당 프레임을 직접 전달합니다.

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

    제공자가 소유하는 구성은
    `plugins.entries.voice-call.config.streaming.providers.xai` 아래에 있습니다. 지원되는
    키는 `apiKey`, `baseUrl`, `sampleRate`, `encoding` (`pcm`, `mulaw` 또는
    `alaw`), `interimResults`, `endpointingMs` 및 `language`입니다.

    <Note>
    이 스트리밍 제공자는 Voice Call의 실시간 전사 경로용입니다.
    Discord 음성은 짧은 세그먼트를 녹음하고 대신 배치
    `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="실시간 음성(Talk)">
    번들로 제공되는 `xai` Plugin은 공유 `registerRealtimeVoiceProvider` 계약을 통해
    Talk 모드용 Grok Voice Agent 실시간 세션을 등록합니다.

    - 엔드포인트: `wss://api.x.ai/v1/realtime?model=<voice-model>`
    - 기본 모델: `grok-voice-latest`
    - 기본 음성: `eve`
    - 전송 방식: `gateway-relay` (iOS, Android 및 Control UI 릴레이 경로)
    - 오디오: PCM16 24 kHz 또는 G.711 µ-law 8 kHz
    - 끼어들기: xAI 서버 VAD가 응답을 중단하며, OpenClaw는 대기 중인 재생을
      비우고 재생되지 않은 제공자 기록을 잘라냅니다.

    Gateway에서 Talk를 구성하십시오.

    ```json5
    {
      talk: {
        realtime: {
          provider: "xai",
          mode: "realtime",
          transport: "gateway-relay",
          brain: "agent-consult",
          providers: {
            xai: {
              model: "grok-voice-latest",
              voice: "eve",
              // 제공자 측 세션 재생을 허용할 수 있는 경우에만 활성화하십시오.
              sessionResumption: false,
            },
          },
        },
      },
      env: { XAI_API_KEY: "xai-..." },
    }
    ```

    Voice Call 또는 공유 실시간 선택기가 동일한 제공자 맵을 재사용하는 경우,
    제공자가 소유하는 구성은 `plugins.entries.voice-call.config.realtime.providers.xai`에서도
    확인됩니다. 지원되는 키는
    `apiKey`, `baseUrl`, `model`, `voice`, `vadThreshold`, `silenceDurationMs`,
    `prefixPaddingMs`, `reasoningEffort` 및 `sessionResumption`입니다.
    `reasoningEffort`은 xAI Voice Agent API에 맞게 `high` 또는 `none`만 허용합니다.

    xAI의 서버 VAD는 항상 응답을 생성하고 오디오 중단을 처리합니다.
    `consultRouting: "provider-direct"`을 사용하십시오. 강제 전사 라우팅 및
    입력 오디오 중단 비활성화는 xAI Voice Agent 프로토콜에서 지원되지 않습니다.

    <Note>
    xAI OAuth 또는 `XAI_API_KEY`으로 실시간 음성을 인증할 수 있습니다. 브라우저가
    소유하는 WebRTC는 아직 이 제공자 인터페이스에 포함되지 않습니다. 네이티브 Node
    또는 Control UI 릴레이 경로에서 gateway-relay Talk를 사용하십시오.
    </Note>

    <Note>
    `sessionResumption`의 기본값은 `false`입니다. `true`로 설정하면 OpenClaw는
    재연결 후 동일한 대화를 재개할 수 있을 만큼의 세션 상태를 유지하도록 xAI에
    요청한 다음, 반환된 대화 ID로 다시 연결합니다. 제공자 측 재생/보존을 허용할 수
    없다면 비활성화된 상태로 두십시오. 그러면 중단된 소켓은 조용히 새 대화를 시작하지
    않고 안전하게 실패합니다.
    </Note>

  </Accordion>

  <Accordion title="x_search 구성">
    번들로 제공되는 xAI Plugin은 Grok을 통해 X(이전의 Twitter) 콘텐츠를 검색하기 위한
    OpenClaw 도구로 `x_search`을 노출합니다.

    구성 경로: `plugins.entries.xai.config.xSearch`

    | 키                | 유형    | 기본값                    | 설명                                             |
    | ----------------- | ------- | ------------------------- | ------------------------------------------------ |
    | `enabled`         | 불리언  | xAI 모델에서는 자동       | 비활성화하거나 알려진 비 xAI 제공자에 사용 설정 |
    | `model`           | 문자열  | `grok-4.3`                | x_search 요청에 사용하는 모델                   |
    | `baseUrl`         | 문자열  | -                         | xAI Responses 기본 URL 재정의                    |
    | `inlineCitations` | 불리언  | -                         | 결과에 인라인 인용 포함                          |
    | `maxTurns`        | 숫자    | -                         | 최대 대화 턴 수                                  |
    | `timeoutSeconds`  | 숫자    | `30`                      | 요청 제한 시간(초)                              |
    | `cacheTtlMinutes` | 숫자    | `15`                      | 캐시 유지 시간(분)                              |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4.3",
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
    번들로 제공되는 xAI Plugin은 xAI의 샌드박스 환경에서 원격 코드를 실행하기 위한
    OpenClaw 도구로 `code_execution`을 노출합니다.

    구성 경로: `plugins.entries.xai.config.codeExecution`

    | 키               | 유형    | 기본값                   | 설명                                             |
    | ---------------- | ------- | ------------------------ | ------------------------------------------------ |
    | `enabled`        | 불리언  | xAI 모델에서는 자동      | 비활성화하거나 알려진 비 xAI 제공자에 사용 설정 |
    | `model`          | 문자열  | `grok-4.3`               | 코드 실행 요청에 사용하는 모델                  |
    | `maxTurns`       | 숫자    | -                        | 최대 대화 턴 수                                  |
    | `timeoutSeconds` | 숫자    | `30`                     | 요청 제한 시간(초)                              |

    <Note>
    이는 로컬 [`exec`](/ko/tools/exec)이 아니라 원격 xAI 샌드박스 실행입니다.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4.3",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="알려진 제한 사항">
    - xAI 인증에는 API 키, 환경 변수, 플러그인 구성
      폴백 또는 적격 xAI 계정의 OAuth를 사용할 수 있습니다. OAuth는 localhost 콜백 없이
      기기 코드 검증을 사용합니다. OAuth API 토큰을 받을 수 있는 계정은
      xAI가 결정하며, OpenClaw에는 Grok Build 앱이 필요하지 않더라도
      동의 페이지에 Grok Build가 표시될 수 있습니다.
    - OpenClaw는 현재 xAI 다중 에이전트 모델 제품군을 제공하지 않습니다. xAI는
      Responses API를 통해 이러한 모델을 제공하지만, 해당 모델은 OpenClaw의 공유 에이전트 루프에서 사용하는
      클라이언트 측 도구 또는 사용자 지정 도구를 허용하지 않습니다.
      [xAI 다중 에이전트 제한 사항](https://docs.x.ai/developers/model-capabilities/text/multi-agent#limitations)을
      참조하십시오.
    - 현재 xAI 실시간 음성은 게이트웨이 릴레이 Talk 전송만 제공합니다.
      브라우저가 소유하는 제공자 WebSocket 세션은 아직 Control UI에
      연결되지 않았습니다.
    - xAI 이미지 `quality`, 이미지 `mask` 및 추가 네이티브 전용 종횡비는
      공유 `image_generate` 도구에 상응하는 제공자 간 제어 기능이 마련될 때까지
      제공되지 않습니다.
  </Accordion>

  <Accordion title="고급 참고 사항">
    - OpenClaw는 공유 러너 경로에서 xAI 전용 도구 스키마 및 도구 호출 호환성
      수정 사항을 자동으로 적용합니다.
    - 네이티브 xAI 요청은 기본적으로 `tool_stream: true`합니다. 비활성화하려면
      `agents.defaults.models["xai/<model>"].params.tool_stream`을 `false`(으)로
      설정하십시오.
    - 번들 xAI 래퍼는 네이티브 xAI 요청을 보내기 전에 지원되지 않는 contains-count 스키마 경계와
      지원되지 않는 추론 *노력 수준* 페이로드 키를 제거합니다.
      Grok 4.5는 낮음, 중간, 높음 노력 수준을 지원합니다(기본값: 높음).
      Grok 4.3은 없음, 낮음, 중간, 높음 노력 수준을 지원합니다(기본값: 낮음).
      추론을 지원하는 다른 xAI 모델은 구성 가능한 노력 수준 제어 기능을 제공하지 않지만,
      후속 턴에서 이전에 암호화된 추론을 재생할 수 있도록
      여전히 `include: ["reasoning.encrypted_content"]`을 요청합니다.
    - `web_search`, `x_search` 및 `code_execution`은 OpenClaw
      도구로 제공됩니다. OpenClaw는 모든 채팅 턴에 모든 네이티브 도구를 연결하는 대신,
      각 도구에 필요한 특정 xAI 내장 기능만 해당 도구의 요청에
      연결합니다.
    - Grok `web_search`은 `plugins.entries.xai.config.webSearch.baseUrl`을 읽습니다.
      `x_search`은 `plugins.entries.xai.config.xSearch.baseUrl`을 읽은 다음,
      Grok 웹 검색 기본 URL로 폴백합니다.
    - `x_search` 및 `code_execution`은 핵심 모델 런타임에 하드코딩되지 않고
      번들 xAI 플러그인이 소유합니다.
    - `code_execution`은 로컬
      [`exec`](/ko/tools/exec)이 아니라 원격 xAI 샌드박스 실행입니다.
  </Accordion>
</AccordionGroup>

## 라이브 테스트

xAI 미디어 경로에는 단위 테스트와 선택형 라이브 제품군이 적용됩니다. 라이브 프로브를 실행하기 전에
프로세스 환경에서 `XAI_API_KEY`을 내보내십시오.

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "classic Grok Imagine"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_XAI_VIDEO=1 pnpm test:live -- extensions/xai/xai.live.test.ts -t "Grok Imagine Video 1.5"
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/x-search.live.test.ts
OPENCLAW_LIVE_GATEWAY_MODELS="xai/grok-4.5,xai/grok-build-0.1,xai/grok-4.3,xai/grok-4.20-0309-reasoning,xai/grok-4.20-0309-non-reasoning" OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0 OPENCLAW_LIVE_GATEWAY_SMOKE=0 pnpm test:live -- src/gateway/gateway-models.profiles.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

제공자별 라이브 파일은 일반 TTS와 전화 통신에 적합한 PCM TTS를 합성하고,
xAI 배치 STT를 통해 오디오를 전사하며, 동일한 PCM을 xAI 실시간 STT를 통해
스트리밍하고, 텍스트-이미지 출력을 생성하며, 참조 이미지를 편집합니다.
공유 이미지 라이브 파일은 OpenClaw의 런타임 선택, 폴백, 정규화 및
미디어 첨부 경로를 통해 동일한 xAI 제공자를 검증합니다. 선택형 Video 1.5 사례는
1080P로 생성된 첫 프레임 이미지 하나를 제출하고 완료된 동영상 다운로드를
검증합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="모든 제공자" href="/ko/providers/index" icon="grid-2">
    더 광범위한 제공자 개요입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법입니다.
  </Card>
</CardGroup>
