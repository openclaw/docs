---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려고 합니다
    - API 키 또는 OAuth 인증 흐름이 필요합니다
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-26T11:37:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 312c7a5bc433831d98d1d47c42c5cac6a4cd8d4948ddbf16f1ae11aaec7a0339
    source_path: providers/google.md
    workflow: 15
---

Google Plugin은 Google AI Studio를 통해 Gemini 모델에 대한 액세스를 제공하며, 추가로
이미지 생성, 미디어 이해(이미지/오디오/비디오), 텍스트 음성 변환, 그리고
Gemini Grounding을 통한 웹 검색도 지원합니다.

- 제공자: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 런타임 옵션: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  를 사용하면 Gemini CLI OAuth를 재사용하면서 모델 참조는 `google/*` 형식으로 유지됩니다.

## 시작하기

원하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키">
    **권장 대상:** Google AI Studio를 통한 일반적인 Gemini API 액세스.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        또는 키를 직접 전달합니다:

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
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`는 모두 사용할 수 있습니다. 이미 구성해 둔 것을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **권장 대상:** 별도의 API 키 대신 기존 Gemini CLI 로그인과 PKCE OAuth를 재사용하려는 경우.

    <Warning>
    `google-gemini-cli` 제공자는 비공식 통합입니다. 일부 사용자는
    이 방식의 OAuth 사용 시 계정 제한을 보고했습니다. 사용에 따른 위험은 본인이 감수하세요.
    </Warning>

    <Steps>
      <Step title="Gemini CLI 설치">
        로컬 `gemini` 명령이 `PATH`에서 사용 가능해야 합니다.

        ```bash
        # Homebrew
        brew install gemini-cli

        # 또는 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw는 Homebrew 설치와 전역 npm 설치를 모두 지원하며,
        일반적인 Windows/npm 레이아웃도 포함합니다.
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

    **환경 변수:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (`GEMINI_CLI_*` 변형도 사용할 수 있습니다.)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 게이트웨이 호스트에 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`를 설정한 뒤 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패하면 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    `google-gemini-cli/*` 모델 참조는 레거시 호환성 별칭입니다. 새
    구성에서는 로컬 Gemini CLI 실행이 필요할 때 `google/*` 모델 참조와
    `google-gemini-cli` 런타임을 함께 사용해야 합니다.

  </Tab>
</Tabs>

## 기능

| 기능                   | 지원 여부                     |
| ---------------------- | ----------------------------- |
| 채팅 완성              | 예                            |
| 이미지 생성            | 예                            |
| 음악 생성              | 예                            |
| 텍스트 음성 변환       | 예                            |
| 실시간 음성            | 예 (Google Live API)          |
| 이미지 이해            | 예                            |
| 오디오 전사            | 예                            |
| 비디오 이해            | 예                            |
| 웹 검색 (Grounding)    | 예                            |
| Thinking/추론          | 예 (Gemini 2.5+ / Gemini 3+) |
| Gemma 4 모델           | 예                            |

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw는
Gemini 3, Gemini 3.1, 그리고 `gemini-*-latest` 별칭의 추론 제어를
`thinkingLevel`에 매핑하여 기본/저지연 실행에서 비활성화된
`thinkingBudget` 값이 전송되지 않도록 합니다.

`/think adaptive`는 고정된 OpenClaw 수준을 선택하는 대신 Google의 동적 thinking 의미 체계를 유지합니다.
Gemini 3 및 Gemini 3.1은 고정 `thinkingLevel`을 생략하여
Google이 수준을 선택하게 하며, Gemini 2.5는 Google의 동적 sentinel 값
`thinkingBudget: -1`을 전송합니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 thinking 모드를 지원합니다. OpenClaw는
`thinkingBudget`을 Gemma 4에서 지원되는 Google `thinkingLevel`로 다시 작성합니다.
thinking을 `off`로 설정하면 `MINIMAL`에 매핑하지 않고 thinking 비활성화 상태를 유지합니다.
</Tip>

## 이미지 생성

번들된 `google` 이미지 생성 제공자는 기본값으로
`google/gemini-3.1-flash-image-preview`를 사용합니다.

- `google/gemini-3-pro-image-preview`도 지원
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 입력 이미지 최대 5개
- 기하 제어: `size`, `aspectRatio`, `resolution`

Google을 기본 이미지 제공자로 사용하려면:

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
공통 도구 매개변수, 제공자 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

## 비디오 생성

번들된 `google` Plugin은 공용
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: 텍스트-비디오, 이미지-비디오, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 길이 제한: **4초에서 8초**

Google을 기본 비디오 제공자로 사용하려면:

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
공통 도구 매개변수, 제공자 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## 음악 생성

번들된 `google` Plugin은 공용
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본값은 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 최대 10개 이미지
- 세션 기반 실행은 `action: "status"`를 포함한 공용 작업/상태 흐름을 통해 분리됨

Google을 기본 음악 제공자로 사용하려면:

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
공통 도구 매개변수, 제공자 선택, 장애 조치 동작은 [음악 생성](/ko/tools/music-generation)을 참조하세요.
</Note>

## 텍스트 음성 변환

번들된 `google` 음성 제공자는
`gemini-3.1-flash-tts-preview`와 함께 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부에는 WAV, 음성 노트 대상에는 Opus, Talk/전화 통신에는 PCM
- 음성 노트 출력: Google PCM은 WAV로 래핑된 뒤 `ffmpeg`로 48kHz Opus로 트랜스코딩됨

Google을 기본 TTS 제공자로 사용하려면:

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
          audioProfile: "차분한 톤으로 전문적으로 말하세요.",
        },
      },
    },
  },
}
```

Gemini API TTS는 스타일 제어를 위해 자연어 프롬프팅을 사용합니다.
`audioProfile`을 설정하면 말할 텍스트 앞에 재사용 가능한 스타일 프롬프트를 추가합니다.
프롬프트 텍스트가 이름 있는 화자를 참조하는 경우 `speakerName`을 설정하세요.

Gemini API TTS는 텍스트 안에서 `[whispers]` 또는 `[laughs]`와 같은
표현용 대괄호 오디오 태그도 허용합니다. 태그를 TTS에는 전달하면서
표시되는 채팅 응답에서는 숨기려면 `[[tts:text]]...[[/tts:text]]`
블록 안에 넣으세요:

```text
여기에 깔끔한 응답 텍스트가 있습니다.

[[tts:text]][whispers] 여기에 음성으로 말할 버전이 있습니다.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이
제공자에서 유효합니다. 이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 실시간 음성

번들된 `google` Plugin은
Voice Call 및 Google Meet 같은 백엔드 오디오 브리지를 위해 Gemini Live API를 기반으로 하는 실시간 음성 제공자를 등록합니다.

| 설정                  | 구성 경로                                                           | 기본값                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 모델                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 음성                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (설정 안 됨)                                                                          |
| VAD 시작 민감도       | `...google.startSensitivity`                                        | (설정 안 됨)                                                                          |
| VAD 종료 민감도       | `...google.endSensitivity`                                          | (설정 안 됨)                                                                          |
| 무음 지속 시간        | `...google.silenceDurationMs`                                       | (설정 안 됨)                                                                          |
| API 키                | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`로 대체됨   |

예시 Voice Call 실시간 구성:

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
OpenClaw는 전화/Meet 브리지 오디오를 Gemini의 PCM Live API 스트림에 맞게 조정하고
도구 호출은 공용 실시간 음성 계약 위에서 유지합니다. 샘플링 변경이 필요하지 않다면
`temperature`는 설정하지 마세요. OpenClaw는 0 이하 값을 생략하는데,
Google Live는 `temperature: 0`에서 오디오 없이 전사만 반환할 수 있기 때문입니다.
Gemini API 전사는 `languageCodes` 없이 활성화되며, 현재 Google
SDK는 이 API 경로에서 언어 코드 힌트를 거부합니다.
</Note>

<Note>
Control UI Talk 브라우저 세션은 여전히 브라우저 WebRTC 세션 구현이 있는
실시간 음성 제공자가 필요합니다. 현재 이 경로는 OpenAI Realtime이며,
Google 제공자는 백엔드 실시간 브리지용입니다.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우 OpenClaw는
    구성된 `cachedContent` 핸들을 Gemini 요청으로 전달합니다.

    - 다음 중 하나를 사용해 모델별 또는 전역 매개변수를 구성합니다.
      `cachedContent` 또는 레거시 `cached_content`
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
    CLI JSON 출력을 다음과 같이 정규화합니다:

    - 응답 텍스트는 CLI JSON `response` 필드에서 가져옵니다.
    - CLI가 `usage`를 비워 둘 경우 사용량은 `stats`로 대체됩니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw는
      `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `GEMINI_API_KEY`를
    해당 프로세스에서 사용할 수 있게 해야 합니다(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 제공자 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 제공자 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공통 음악 도구 매개변수 및 제공자 선택.
  </Card>
</CardGroup>
