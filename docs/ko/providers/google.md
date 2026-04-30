---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려는 경우
    - API 키 또는 OAuth 인증 흐름이 필요합니다
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T06:46:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Google Plugin은 Google AI Studio를 통해 Gemini 모델에 대한 액세스를 제공하며,
Gemini Grounding을 통한 이미지 생성, 미디어 이해(이미지/오디오/비디오), 텍스트 음성 변환, 웹 검색도 제공합니다.

- 제공자: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 런타임 옵션: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  Gemini CLI OAuth를 재사용하면서 모델 참조는 `google/*`로 정규화된 상태를 유지합니다.

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API key">
    **적합한 경우:** Google AI Studio를 통한 표준 Gemini API 액세스.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        또는 키를 직접 전달합니다.

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`는 모두 허용됩니다. 이미 구성해 둔 것을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **적합한 경우:** 별도의 API 키 대신 PKCE OAuth를 통해 기존 Gemini CLI 로그인을 재사용.

    <Warning>
    `google-gemini-cli` 제공자는 비공식 통합입니다. 일부 사용자는
    이 방식으로 OAuth를 사용할 때 계정 제한이 발생한다고 보고합니다. 본인 책임하에 사용하세요.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
        로컬 `gemini` 명령을 `PATH`에서 사용할 수 있어야 합니다.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw는 일반적인 Windows/npm 레이아웃을 포함하여 Homebrew 설치와 전역 npm 설치를 모두 지원합니다.
      </Step>
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 기본 모델: `google/gemini-3.1-pro-preview`
    - 런타임: `google-gemini-cli`
    - 별칭: `gemini-cli`

    Gemini 3.1 Pro의 Gemini API 모델 ID는 `gemini-3.1-pro-preview`입니다. OpenClaw는 편의 별칭으로 더 짧은 `google/gemini-3.1-pro`를 허용하고, 제공자 호출 전에 이를 정규화합니다.

    **환경 변수:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (또는 `GEMINI_CLI_*` 변형.)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`를 설정하고 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패하면 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    `google-gemini-cli/*` 모델 참조는 레거시 호환성 별칭입니다. 새
    구성에서는 로컬 Gemini CLI 실행을 원할 때 `google/*` 모델 참조와 `google-gemini-cli`
    런타임을 함께 사용해야 합니다.

  </Tab>
</Tabs>

## 기능

| 기능                   | 지원                          |
| ---------------------- | ----------------------------- |
| 채팅 완성              | 예                            |
| 이미지 생성            | 예                            |
| 음악 생성              | 예                            |
| 텍스트 음성 변환       | 예                            |
| 실시간 음성            | 예(Google Live API)           |
| 이미지 이해            | 예                            |
| 오디오 전사            | 예                            |
| 비디오 이해            | 예                            |
| 웹 검색(Grounding)     | 예                            |
| 사고/추론              | 예(Gemini 2.5+ / Gemini 3+)   |
| Gemma 4 모델           | 예                            |

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw는
Gemini 3, Gemini 3.1, `gemini-*-latest` 별칭의 추론 제어를
`thinkingLevel`에 매핑하여 기본/저지연 실행에서 비활성화된
`thinkingBudget` 값을 보내지 않도록 합니다.

`/think adaptive`는 고정 OpenClaw 수준을 선택하는 대신 Google의 동적 사고 의미론을 유지합니다. Gemini 3 및 Gemini 3.1은 Google이 수준을 선택할 수 있도록 고정 `thinkingLevel`을 생략하며, Gemini 2.5는 Google의 동적 센티널
`thinkingBudget: -1`을 보냅니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 사고 모드를 지원합니다. OpenClaw는
Gemma 4용 `thinkingBudget`을 지원되는 Google `thinkingLevel`로 다시 작성합니다.
사고를 `off`로 설정하면 `MINIMAL`에 매핑하는 대신 사고 비활성화가 유지됩니다.
</Tip>

## 이미지 생성

번들로 제공되는 `google` 이미지 생성 제공자의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

- `google/gemini-3-pro-image-preview`도 지원
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 최대 5개 입력 이미지
- 기하 제어: `size`, `aspectRatio`, `resolution`

Google을 기본 이미지 제공자로 사용하려면 다음을 설정하세요.

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
공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

## 비디오 생성

번들로 제공되는 `google` Plugin은 공유
`video_generate` 도구를 통한 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: 텍스트-비디오, 이미지-비디오, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 길이 제한: **4~8초**

Google을 기본 비디오 제공자로 사용하려면 다음을 설정하세요.

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
공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## 음악 생성

번들로 제공되는 `google` Plugin은 공유
`music_generate` 도구를 통한 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본값은 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 최대 10개 이미지
- 세션 기반 실행은 `action: "status"`를 포함하여 공유 작업/상태 흐름을 통해 분리됩니다.

Google을 기본 음악 제공자로 사용하려면 다음을 설정하세요.

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
공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [음악 생성](/ko/tools/music-generation)을 참조하세요.
</Note>

## 텍스트 음성 변환

번들로 제공되는 `google` 음성 제공자는
`gemini-3.1-flash-tts-preview`와 함께 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부 파일은 WAV, 음성 메모 대상은 Opus, Talk/전화 통신은 PCM
- 음성 메모 출력: Google PCM은 WAV로 래핑되고 `ffmpeg`를 사용해 48 kHz Opus로 트랜스코딩됩니다.

Google을 기본 TTS 제공자로 사용하려면 다음을 설정하세요.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS는 스타일 제어에 자연어 프롬프팅을 사용합니다. 말할 텍스트 앞에 재사용 가능한 스타일 프롬프트를 붙이려면
`audioProfile`을 설정하세요. 프롬프트 텍스트가 이름이 있는 화자를 참조할 때는
`speakerName`을 설정하세요.

Gemini API TTS는 텍스트 안의 표현용 대괄호 오디오 태그도 허용합니다.
예를 들어 `[whispers]` 또는 `[laughs]`가 있습니다. 태그를 보이는 채팅 답장에는 포함하지 않으면서
TTS로 보내려면 `[[tts:text]]...[[/tts:text]]`
블록 안에 넣으세요.

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이
제공자에 유효합니다. 이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 실시간 음성

번들로 제공되는 `google` Plugin은 Voice Call 및 Google Meet 같은 백엔드 오디오 브리지용
Gemini Live API를 기반으로 하는 실시간 음성 제공자를 등록합니다.

| 설정                  | 구성 경로                                                          | 기본값                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 모델                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 음성                  | `...google.voice`                                                   | `Kore`                                                                                |
| 온도                  | `...google.temperature`                                             | (설정되지 않음)                                                                       |
| VAD 시작 민감도       | `...google.startSensitivity`                                        | (설정되지 않음)                                                                       |
| VAD 종료 민감도       | `...google.endSensitivity`                                          | (설정되지 않음)                                                                       |
| 무음 지속 시간        | `...google.silenceDurationMs`                                       | (설정되지 않음)                                                                       |
| 활동 처리             | `...google.activityHandling`                                        | Google 기본값, `start-of-activity-interrupts`                                         |
| 턴 범위               | `...google.turnCoverage`                                            | Google 기본값, `only-activity`                                                        |
| 자동 VAD 비활성화     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| API 키                | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`로 대체       |

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
도구 호출을 공유 실시간 음성 계약에 유지합니다. 샘플링 변경이 필요한 경우가 아니면 `temperature`를
설정하지 마세요. Google Live는 `temperature: 0`에서 오디오 없이 대본을 반환할 수 있으므로
OpenClaw는 양수가 아닌 값을 생략합니다.
Gemini API 전사는 `languageCodes` 없이 활성화됩니다. 현재 Google
SDK는 이 API 경로에서 언어 코드 힌트를 거부합니다.
</Note>

<Note>
Control UI Talk는 제한된 일회용 토큰으로 Google Live 브라우저 세션을 지원합니다.
백엔드 전용 실시간 음성 제공자도 일반 Gateway 릴레이 전송을 통해 실행할 수 있으며,
이 방식은 제공자 자격 증명을 Gateway에 보관합니다.
</Note>

유지관리자 라이브 검증을 위해 다음을 실행하세요.
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Google 구간은 Control UI Talk에서 사용하는 것과 동일한 제한된 Live API 토큰 형태를 발급하고,
브라우저 WebSocket 엔드포인트를 열고, 초기 설정 페이로드를 전송한 뒤,
`setupComplete`를 기다립니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우 OpenClaw는
    구성된 `cachedContent` 핸들을 Gemini 요청으로 전달합니다.

    - 모델별 또는 전역 params를
      `cachedContent` 또는 레거시 `cached_content`로 구성
    - 둘 다 있으면 `cachedContent`가 우선합니다
    - 예시 값: `cachedContents/prebuilt-context`
    - Gemini 캐시 적중 사용량은 업스트림 `cachedContentTokenCount`에서
      OpenClaw `cacheRead`로 정규화됩니다

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

  <Accordion title="Gemini CLI JSON 사용 참고 사항">
    `google-gemini-cli` OAuth 제공자를 사용할 때 OpenClaw는
    CLI JSON 출력을 다음과 같이 정규화합니다.

    - 응답 텍스트는 CLI JSON `response` 필드에서 옵니다.
    - CLI가 `usage`를 비워 두면 사용량은 `stats`로 대체됩니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw는 입력 토큰을
      `stats.input_tokens - stats.cached`에서 파생합니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `GEMINI_API_KEY`가
    해당 프로세스에서 사용할 수 있는지 확인하세요. 예를 들어 `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해 제공할 수 있습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수와 제공자 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 매개변수와 제공자 선택.
  </Card>
</CardGroup>
