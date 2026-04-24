---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려고 합니다
    - API 키 또는 OAuth 인증 흐름이 필요합니다
summary: Google Gemini 설정(API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T09:00:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e66c9dd637e26976659d04b9b7e2452e6881945dab6011970f9e1c5e4a9a685
    source_path: providers/google.md
    workflow: 15
---

Google Plugin은 Google AI Studio를 통해 Gemini 모델에 접근할 수 있게 해 주며,
이미지 생성, 미디어 이해(이미지/오디오/비디오), 텍스트 음성 변환, 그리고
Gemini Grounding을 통한 웹 검색도 제공합니다.

- Provider: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 대체 provider: `google-gemini-cli` (OAuth)

## 시작하기

선호하는 인증 방법을 선택한 뒤 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키">
    **가장 적합한 경우:** Google AI Studio를 통한 일반적인 Gemini API 접근.

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
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`는 모두 허용됩니다. 이미 구성되어 있는 것을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **가장 적합한 경우:** 별도의 API 키 대신 기존 Gemini CLI 로그인(PKCE OAuth)을 재사용할 때.

    <Warning>
    `google-gemini-cli` provider는 비공식 통합입니다. 일부 사용자는
    이런 방식의 OAuth 사용 시 계정 제한을 보고했습니다. 사용에 따른 책임은 사용자에게 있습니다.
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
        일반적인 Windows/npm 레이아웃도 포함됩니다.
      </Step>
      <Step title="OAuth로 로그인">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - 기본 모델: `google-gemini-cli/gemini-3-flash-preview`
    - 별칭: `gemini-cli`

    **환경 변수:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (`GEMINI_CLI_*` 변형도 가능)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`를 설정한 뒤 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패한다면 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    OAuth 전용 `google-gemini-cli` provider는 별도의 텍스트 추론
    표면입니다. 이미지 생성, 미디어 이해, Gemini Grounding은 계속
    `google` provider id에 남아 있습니다.

  </Tab>
</Tabs>

## 기능

| 기능                   | 지원 여부                     |
| ---------------------- | ----------------------------- |
| 채팅 completions       | 예                            |
| 이미지 생성            | 예                            |
| 음악 생성              | 예                            |
| 텍스트 음성 변환       | 예                            |
| 실시간 음성            | 예 (Google Live API)          |
| 이미지 이해            | 예                            |
| 오디오 전사            | 예                            |
| 비디오 이해            | 예                            |
| 웹 검색 (Grounding)    | 예                            |
| Thinking/reasoning     | 예 (Gemini 2.5+ / Gemini 3+)  |
| Gemma 4 모델           | 예                            |

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw는
Gemini 3, Gemini 3.1, `gemini-*-latest` 별칭의 reasoning 제어를
`thinkingLevel`로 매핑하므로 기본/저지연 실행에서 비활성화된
`thinkingBudget` 값이 전송되지 않습니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 thinking 모드를 지원합니다. OpenClaw는
Gemma 4에 대해 `thinkingBudget`을 지원되는 Google `thinkingLevel`로
다시 작성합니다. thinking을 `off`로 설정하면 `MINIMAL`로 매핑되지 않고
thinking 비활성화 상태가 유지됩니다.
</Tip>

## 이미지 생성

번들 `google` 이미지 생성 provider의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

- `google/gemini-3-pro-image-preview`도 지원
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 입력 이미지 최대 5개
- Geometry 제어: `size`, `aspectRatio`, `resolution`

Google을 기본 이미지 provider로 사용하려면:

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
공통 도구 매개변수, provider 선택, failover 동작은 [Image Generation](/ko/tools/image-generation)을 참고하세요.
</Note>

## 비디오 생성

번들 `google` Plugin은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: 텍스트-투-비디오, 이미지-투-비디오, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 duration 제한: **4~8초**

Google을 기본 비디오 provider로 사용하려면:

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
공통 도구 매개변수, provider 선택, failover 동작은 [Video Generation](/ko/tools/video-generation)을 참고하세요.
</Note>

## 음악 생성

번들 `google` Plugin은 공유
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics`, `instrumental`
- 출력 형식: 기본 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 최대 10개 이미지
- 세션 기반 실행은 `action: "status"`를 포함한 공용 task/status 흐름을 통해 분리 실행됨

Google을 기본 음악 provider로 사용하려면:

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
공통 도구 매개변수, provider 선택, failover 동작은 [Music Generation](/ko/tools/music-generation)을 참고하세요.
</Note>

## 텍스트 음성 변환

번들 `google` 음성 provider는
`gemini-3.1-flash-tts-preview`를 사용하는 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부에는 WAV, Talk/telephony에는 PCM
- 네이티브 음성 노트 출력: 이 Gemini API 경로에서는 API가 Opus가 아니라 PCM을 반환하므로 지원되지 않음

Google을 기본 TTS provider로 사용하려면:

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
        },
      },
    },
  },
}
```

Gemini API TTS는 텍스트 안에서 `[whispers]`, `[laughs]` 같은
표현용 대괄호 오디오 태그를 허용합니다. 태그를 표시되는 채팅 응답에서는 숨기고
TTS로만 보내려면 `[[tts:text]]...[[/tts:text]]` 블록 안에 넣으세요.

```text
여기에는 깔끔한 응답 텍스트가 있습니다.

[[tts:text]][whispers] 여기에 음성 버전이 있습니다.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이
provider에 유효합니다. 이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 실시간 음성

번들 `google` Plugin은 Voice Call 및 Google Meet 같은 백엔드 오디오 브리지용으로
Gemini Live API 기반 실시간 음성 provider를 등록합니다.

| 설정                  | 구성 경로                                                         | 기본값                                                                                |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 모델                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 음성                  | `...google.voice`                                                 | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                           | (설정 안 됨)                                                                          |
| VAD 시작 민감도       | `...google.startSensitivity`                                      | (설정 안 됨)                                                                          |
| VAD 종료 민감도       | `...google.endSensitivity`                                        | (설정 안 됨)                                                                          |
| 무음 지속 시간        | `...google.silenceDurationMs`                                     | (설정 안 됨)                                                                          |
| API 키                | `...google.apiKey`                                                | `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`로 fallback |

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
Google Live API는 WebSocket을 통한 양방향 오디오와 함수 호출을 사용합니다.
OpenClaw는 telephony/Meet 브리지 오디오를 Gemini의 PCM Live API 스트림에 맞게 조정하고,
도구 호출은 공용 실시간 음성 계약에 유지합니다. 샘플링 변경이 꼭 필요하지 않다면
`temperature`는 설정하지 마세요. Google Live는 `temperature: 0`에서
오디오 없이 transcript만 반환할 수 있으므로 OpenClaw는 0 이하 값을 생략합니다.
Gemini API 전사는 `languageCodes` 없이 활성화됩니다. 현재 Google
SDK는 이 API 경로에서 언어 코드 힌트를 거부합니다.
</Note>

<Note>
Control UI Talk 브라우저 세션은 여전히 브라우저 WebRTC 세션 구현이 있는
실시간 음성 provider가 필요합니다. 현재 그 경로는 OpenAI Realtime이며,
Google provider는 백엔드 실시간 브리지용입니다.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우 OpenClaw는
    구성된 `cachedContent` 핸들을 Gemini 요청에 그대로 전달합니다.

    - 모델별 또는 전역 매개변수에 `cachedContent` 또는 레거시 `cached_content`를
      사용할 수 있습니다
    - 둘 다 있으면 `cachedContent`가 우선합니다
    - 예시 값: `cachedContents/prebuilt-context`
    - Gemini cache-hit 사용량은 업스트림 `cachedContentTokenCount`에서
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
    `google-gemini-cli` OAuth provider를 사용할 때 OpenClaw는
    CLI JSON 출력을 다음과 같이 정규화합니다.

    - 응답 텍스트는 CLI JSON `response` 필드에서 가져옵니다.
    - CLI가 `usage`를 비워 두면 사용량은 `stats`로 fallback됩니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw는
      `stats.input_tokens - stats.cached`에서 입력 토큰을 도출합니다.

  </Accordion>

  <Accordion title="환경 및 데몬 설정">
    Gateway가 데몬(launchd/systemd)으로 실행된다면 `GEMINI_API_KEY`가
    해당 프로세스에서 사용 가능하도록 하세요(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택하기
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공용 이미지 도구 매개변수와 provider 선택
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공용 비디오 도구 매개변수와 provider 선택
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공용 음악 도구 매개변수와 provider 선택
  </Card>
</CardGroup>
