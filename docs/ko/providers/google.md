---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려고 합니다
    - API 키 또는 OAuth 인증 흐름이 필요합니다.
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google(Gemini)
x-i18n:
    generated_at: "2026-07-16T12:59:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fe8a58044bea7ce2598da94787334af2bb4a2ff58872c62115697fa0079daf0a
    source_path: providers/google.md
    workflow: 16
---

Google Plugin은 Google AI Studio를 통해 Gemini 모델에 액세스할 수 있게 하며, 이미지 생성, 미디어 이해(이미지/오디오/동영상), 텍스트 음성 변환, Gemini Grounding을 통한 웹 검색도 제공합니다.

- 제공자: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 런타임 옵션: `agentRuntime.id: "google-gemini-cli"`은 모델 참조를 표준 `google/*` 형식으로 유지하면서 Gemini CLI OAuth를 재사용합니다.

## 시작하기

원하는 인증 방법을 선택하고 설정 단계를 따르십시오.

<Tabs>
  <Tab title="API 키">
    **적합한 용도:** Google AI Studio를 통한 표준 Gemini API 액세스입니다.

    <Steps>
      <Step title="API 키 받기">
        [Google AI Studio](https://aistudio.google.com/apikey)에서 무료 키를 생성하십시오.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        또는 키를 직접 전달하십시오.

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    `GEMINI_API_KEY` 및 `GOOGLE_API_KEY`이 모두 허용됩니다. 이미 구성된 것을 사용하십시오.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **적합한 용도:** 별도의 API 키를 사용하는 대신 Gemini CLI OAuth를 통해 Google 계정으로 로그인하는 경우입니다.

    <Warning>
    `google-gemini-cli` 제공자는 비공식 통합입니다. 일부 사용자는
    이 방식으로 OAuth를 사용할 때 계정 제한이 발생한다고 보고합니다. 사용에 따른 책임은 사용자에게 있습니다.
    </Warning>

    <Steps>
      <Step title="Gemini CLI 설치">
        로컬 `gemini` 명령을 `PATH`에서 사용할 수 있어야 합니다.

        ```bash
        # Homebrew
        brew install gemini-cli

        # 또는 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw는 일반적인 Windows/npm 레이아웃을 포함하여 Homebrew 설치와
        전역 npm 설치를 모두 지원합니다.
      </Step>
      <Step title="OAuth로 로그인">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 기본 모델: `google/gemini-3.1-pro-preview`
    - 런타임: `google-gemini-cli`
    - 별칭: `gemini-cli`

    Gemini 3.1 Pro의 Gemini API 모델 ID는 `gemini-3.1-pro-preview`입니다. OpenClaw는 편의를 위한 별칭으로 더 짧은 `google/gemini-3.1-pro`을 허용하며, 제공자 호출 전에 이를 정규화합니다.

    **환경 변수:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`을 설정하고 다시 시도하십시오.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인에 실패하면 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 포함되어 있는지 확인하십시오.
    </Note>

    온보딩 자동 감지는 기존 Gemini CLI 로그인을 표시하지만 Gemini CLI에는 도구를 사용하지 않는
    검사 기능이 없으므로 이를 자동으로 테스트하지 않습니다. 계속하려면 Gemini CLI
    OAuth 또는 Gemini API 키를 선택하십시오.

    `google-gemini-cli/*` 모델 참조는 레거시 호환성 별칭입니다. 로컬 Gemini CLI 실행을 사용하려는
    새 구성은 `google/*` 모델 참조와 `google-gemini-cli`
    런타임을 함께 사용해야 합니다.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview`은 2026-03-09에 지원 종료되었습니다. 대신 `google/gemini-3.1-pro-preview`을 사용하십시오. Gemini API 키 설정(`openclaw onboard --auth-choice gemini-api-key` 또는 `openclaw models auth login --provider google`)을 다시 실행하면 오래된 기본 모델 구성이 현재 모델로 다시 작성됩니다.
</Note>

## 기능

| 기능                   | 지원 여부                      |
| ---------------------- | ----------------------------- |
| 채팅 완성              | 예                            |
| 이미지 생성            | 예                            |
| 음악 생성              | 예                            |
| 텍스트 음성 변환       | 예                            |
| 실시간 음성            | 예(Google Live API)           |
| 이미지 이해            | 예                            |
| 오디오 전사            | 예                            |
| 동영상 이해            | 예                            |
| 웹 검색(Grounding)     | 예                            |
| 사고/추론              | 예(Gemini 2.5+ / Gemini 3+)   |
| Gemma 4 모델           | 예                            |

## 웹 검색

번들 `gemini` 웹 검색 제공자는 Gemini Google Search Grounding을 사용합니다.
`plugins.entries.google.config.webSearch` 아래에 전용 검색 키를 구성하거나,
`GEMINI_API_KEY` 이후 `models.providers.google.apiKey`을 재사용하도록 설정하십시오.

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // GEMINI_API_KEY 또는 models.providers.google.apiKey가 설정된 경우 선택 사항
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // models.providers.google.baseUrl로 대체됨
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

자격 증명 우선순위는 전용 `webSearch.apiKey`, `GEMINI_API_KEY`,
`models.providers.google.apiKey` 순입니다. `webSearch.baseUrl`은 선택 사항이며
운영자 프록시 또는 호환되는 Gemini API 엔드포인트를 위해 존재합니다. 생략하면
Gemini 웹 검색은 `models.providers.google.baseUrl`을 재사용합니다. 제공자별 도구 동작은
[Gemini 검색](/ko/tools/gemini-search)을 참조하십시오.

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw는
Gemini 3, Gemini 3.1 및 `gemini-*-latest` 별칭의 추론 제어를
`thinkingLevel`에 매핑하여 기본/저지연 실행 시 비활성화된
`thinkingBudget` 값을 전송하지 않도록 합니다.

`/think adaptive`은 고정된 OpenClaw 수준을 선택하는 대신 Google의 동적 사고 의미 체계를 유지합니다.
Gemini 3 및 Gemini 3.1은 Google이 수준을 선택할 수 있도록 고정된
`thinkingLevel`을 생략하며, Gemini 2.5는 Google의 동적 센티널
`thinkingBudget: -1`을 전송합니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 사고 모드를 지원합니다. OpenClaw는
Gemma 4에서 `thinkingBudget`을 지원되는 Google `thinkingLevel`로 다시 작성합니다.
사고를 `off`으로 설정하면 `MINIMAL`에 매핑하는 대신
사고 비활성화 상태를 유지합니다.

Gemini 2.5 Pro는 사고 모드에서만 작동하며 명시적인
`thinkingBudget: 0`을 거부합니다. OpenClaw는 Gemini 2.5 Pro 요청에서 이 값을
전송하지 않고 제거합니다.
</Tip>

## 이미지 생성

번들 `google` 이미지 생성 제공자는 기본적으로
`google/gemini-3.1-flash-image-preview`을 사용합니다.

- 추가 지원: `google/gemini-3-pro-image-preview`
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 입력 이미지 최대 5개
- 기하학 제어: `size`, `aspectRatio` 및 `resolution`

Google을 기본 이미지 제공자로 사용하려면 다음과 같이 설정하십시오.

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하십시오.
</Note>

## 동영상 생성

번들 `google` Plugin은 공유 `video_generate` 도구를 통해
동영상 생성도 등록합니다.

- 기본 동영상 모델: `google/veo-3.1-fast-generate-preview`
- 모드: 텍스트-동영상, 이미지-동영상 및 단일 동영상 참조 흐름
- `aspectRatio`(`16:9`, `9:16`) 및 `resolution`(`720P`, `1080P`) 지원. 현재 Veo는 오디오 출력을 지원하지 않습니다.
- 지원되는 길이: **4초, 6초 또는 8초**(다른 값은 허용되는 가장 가까운 값으로 조정됨)

Google을 기본 동영상 제공자로 사용하려면 다음과 같이 설정하십시오.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [동영상 생성](/ko/tools/video-generation)을 참조하십시오.
</Note>

## 음악 생성

번들 `google` Plugin은 공유 `music_generate` 도구를 통해
음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- 추가 지원: `google/lyria-3-pro-preview`
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본값은 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 이미지 최대 10개
- 세션 기반 실행은 `action: "status"`을 포함한 공유 작업/상태 흐름을 통해 분리됩니다.

Google을 기본 음악 제공자로 사용하려면 다음과 같이 설정하십시오.

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [음악 생성](/ko/tools/music-generation)을 참조하십시오.
</Note>

## 텍스트 음성 변환

번들 `google` 음성 제공자는 `gemini-3.1-flash-tts-preview`과 함께
Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부 파일은 WAV, 음성 메모 대상은 Opus, Talk/전화 통신은 PCM
- 음성 메모 출력: Google PCM은 WAV로 래핑된 후 `ffmpeg`을 사용하여 48 kHz Opus로 트랜스코딩됩니다.

Google의 일괄 Gemini TTS 경로는 완료된 `generateContent` 응답에서
생성된 오디오를 반환합니다. 지연 시간이 가장 짧은 음성 대화가 필요하면 일괄
TTS 대신 Gemini Live API 기반의 Google 실시간 음성 제공자를 사용하십시오.

Google을 기본 TTS 제공자로 사용하려면 다음과 같이 설정하십시오.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "차분한 어조로 전문적으로 말하십시오.",
        },
      },
    },
  },
}
```

Gemini API TTS는 스타일 제어에 자연어 프롬프트를 사용합니다.
말할 텍스트 앞에 재사용 가능한 스타일 프롬프트를 추가하려면 `audioProfile`을 설정하십시오.
프롬프트 텍스트에서 이름이 지정된 화자를 참조하는 경우 `speakerName`을 설정하십시오.

Gemini API TTS는 텍스트에서 `[whispers]` 또는 `[laughs]` 같은
표현력 있는 대괄호 오디오 태그도 허용합니다. 태그를 TTS로 전송하면서 표시되는 채팅 답변에서는
숨기려면 `[[tts:text]]...[[/tts:text]]` 블록 안에 넣으십시오.

```text
깔끔한 답변 텍스트입니다.

[[tts:text]][whispers] 말로 전달되는 버전입니다.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이 제공자에 사용할 수 있습니다.
이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 실시간 음성

번들 `google` Plugin은 Voice Call 및 Google Meet 같은 백엔드 오디오 브리지를 위해
Gemini Live API 기반의 실시간 음성 제공자를 등록합니다.

| 설정                  | 구성 경로                                                           | 기본값                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 모델                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-3.1-flash-live-preview`                                                       |
| 음성                  | `...google.voice`                                                   | `Kore`                                                                                |
| 온도                  | `...google.temperature`                                             | (설정되지 않음)                                                                       |
| VAD 시작 민감도       | `...google.startSensitivity`                                        | (설정되지 않음)                                                                       |
| VAD 종료 민감도       | `...google.endSensitivity`                                          | (설정되지 않음)                                                                       |
| 무음 지속 시간        | `...google.silenceDurationMs`                                       | (설정되지 않음)                                                                       |
| 활동 처리             | `...google.activityHandling`                                        | Google 기본값, `start-of-activity-interrupts`                                        |
| 턴 범위               | `...google.turnCoverage`                                            | Google 기본값, `audio-activity-and-all-video`                                        |
| 자동 VAD 비활성화     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 세션 재개             | `...google.sessionResumption`                                       | `true`                                                                                |
| 컨텍스트 압축         | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 키                | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`을 대체 값으로 사용합니다 |

Voice Call 실시간 구성 예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API는 WebSocket을 통해 양방향 오디오와 함수 호출을 사용합니다.
OpenClaw는 전화 통신/Meet 브리지 오디오를 Gemini의 PCM Live API 스트림에 맞게 조정하고
공유 실시간 음성 계약에서 도구 호출을 유지합니다. 샘플링을 변경해야 하는 경우가 아니면
`temperature`을 설정하지 마십시오. Google Live가 `temperature: 0`에 대해 오디오 없이
트랜스크립트를 반환할 수 있으므로 OpenClaw는 양수가 아닌 값을 생략합니다.
Gemini API 트랜스크립션은 `languageCodes` 없이 활성화됩니다. 현재 Google
SDK는 이 API 경로에서 언어 코드 힌트를 거부합니다.
</Note>

<Note>
Gemini 3.1 Live는 실시간 입력을 통해 대화형 텍스트를 받아들이고
순차적 함수 호출을 사용합니다. OpenClaw는 이 모델에서 이전 `NON_BLOCKING`, 함수
응답 예약 및 감정 대화 필드를 생략합니다. `thinkingLevel`을 사용하는 것이 좋습니다.
구성된 양수 `thinkingBudget` 값은 가장 가까운 지원 수준에 매핑되며,
`-1`은 Google 기본값을 그대로 유지합니다. [Gemini Live 기능 비교](https://ai.google.dev/gemini-api/docs/live-api/capabilities)를 참조하십시오.
</Note>

<Note>
Control UI Talk는 제한된 일회용 토큰을 사용하는 Google Live 브라우저 세션을 지원합니다.
백엔드 전용 실시간 음성 제공자도 일반 Gateway 릴레이 전송을 통해 실행할 수 있으며,
이 경우 제공자 자격 증명은 Gateway에 유지됩니다.
</Note>

관리자 실시간 검증을 수행하려면
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`을 실행하십시오.
이 스모크 테스트는 OpenAI 백엔드/WebRTC 경로도 다룹니다. Google 구간에서는 Control UI Talk가
사용하는 것과 동일한 형태의 제한된 Live API 토큰을 발급하고, 브라우저
WebSocket 엔드포인트를 열고, 초기 설정 페이로드를 전송한 후
`setupComplete`을 기다립니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="Gemini 캐시 직접 재사용">
    Gemini API 직접 실행(`api: "google-generative-ai"`)의 경우 OpenClaw는
    구성된 `cachedContent` 핸들을 Gemini 요청에 전달합니다.

    - 모델별 또는 전역 매개변수는
      `cachedContent` 또는 레거시 `cached_content` 중 하나로 구성하십시오.
    - 더 구체적인 범위의 매개변수(전역보다 모델 수준)가 항상 우선합니다.
      같은 범위에서 두 키가 모두 설정된 경우 `cached_content`이 우선합니다.
      예기치 않은 결과를 방지하려면 범위마다 하나의 키만 사용하십시오.
    - 값 예시: `cachedContents/prebuilt-context`
    - Gemini 캐시 적중 사용량은 업스트림 `cachedContentTokenCount`에서
      OpenClaw `cacheRead`으로 정규화됩니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI 사용 참고 사항">
    `google-gemini-cli` OAuth 제공자를 사용할 때 OpenClaw는 기본적으로 Gemini
    CLI `stream-json` 출력을 사용하고 최종 `stats` 페이로드에서 사용량을
    정규화합니다. 레거시 `--output-format json` 재정의는 계속 JSON 파서를 사용합니다.

    - 스트리밍된 응답 텍스트는 어시스턴트 `message` 이벤트에서 가져옵니다.
    - 레거시 JSON 출력의 경우 응답 텍스트는 CLI JSON `response` 필드에서 가져옵니다.
    - CLI가 `usage`을 비워 두면 사용량은 `stats`을 대체 값으로 사용합니다.
    - `stats.cached`은 OpenClaw `cacheRead`으로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw는
      `stats.input_tokens - stats.cached`에서 입력 토큰을 도출합니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 해당 프로세스에서
    `GEMINI_API_KEY`을 사용할 수 있는지 확인하십시오(예: `~/.openclaw/.env` 또는
    `env.shellEnv`을 통해).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 매개변수 및 제공자 선택입니다.
  </Card>
</CardGroup>
