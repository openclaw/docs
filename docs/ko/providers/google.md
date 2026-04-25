---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려고 합니다.
    - API key 또는 OAuth 인증 흐름이 필요합니다.
summary: Google Gemini 설정(API key + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-25T06:09:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: de0d6563d1c7a25fe26aa7ce255b1d3ed80e950b7761039e6d0a76f23a14e6f3
    source_path: providers/google.md
    workflow: 15
---

Google Plugin은 Google AI Studio를 통한 Gemini 모델 접근과 함께
이미지 생성, 미디어 이해(이미지/오디오/비디오), text-to-speech, 그리고
Gemini Grounding을 통한 웹 검색을 제공합니다.

- Provider: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- 런타임 옵션: `agents.defaults.embeddedHarness.runtime: "google-gemini-cli"`는
  Gemini CLI OAuth를 재사용하면서 모델 ref를 `google/*` 형태로 유지합니다.

## 시작하기

원하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API key">
    **적합한 경우:** Google AI Studio를 통한 일반적인 Gemini API 접근.

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        또는 key를 직접 전달합니다:

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
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY` 둘 다 허용됩니다. 이미 구성해 둔 것을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **적합한 경우:** 별도 API key 대신 PKCE OAuth를 통해 기존 Gemini CLI 로그인을 재사용하려는 경우.

    <Warning>
    `google-gemini-cli` provider는 비공식 통합입니다. 일부 사용자는
    이런 방식의 OAuth 사용 시 계정 제한을 보고합니다. 위험을 감수하고 사용하세요.
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

    (또는 `GEMINI_CLI_*` 변형.)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`를 설정한 뒤 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패한다면, 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    `google-gemini-cli/*` 모델 ref는 레거시 호환성 별칭입니다. 새
    config는 로컬 Gemini CLI 실행을 원할 때
    `google-gemini-cli` 런타임과 함께 `google/*` 모델 ref를 사용해야 합니다.

  </Tab>
</Tabs>

## 기능

| Capability             | 지원 여부                      |
| ---------------------- | ------------------------------ |
| 채팅 completions       | 예                             |
| 이미지 생성            | 예                             |
| 음악 생성              | 예                             |
| Text-to-speech         | 예                             |
| Realtime voice         | 예 (Google Live API)           |
| 이미지 이해            | 예                             |
| 오디오 전사            | 예                             |
| 비디오 이해            | 예                             |
| 웹 검색 (Grounding)    | 예                             |
| thinking/reasoning     | 예 (Gemini 2.5+ / Gemini 3+)   |
| Gemma 4 모델           | 예                             |

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw는
Gemini 3, Gemini 3.1, 그리고 `gemini-*-latest` 별칭의 reasoning 제어를
`thinkingLevel`로 매핑하여 기본/저지연 실행에서 비활성화된
`thinkingBudget` 값이 전송되지 않도록 합니다.

`/think adaptive`는 고정 OpenClaw 레벨을 선택하는 대신 Google의 동적 thinking 의미론을 유지합니다.
Gemini 3와 Gemini 3.1은 Google이 수준을 선택할 수 있도록 고정 `thinkingLevel`을 생략하고,
Gemini 2.5는 Google의 동적 sentinel
`thinkingBudget: -1`을 보냅니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 thinking 모드를 지원합니다. OpenClaw는
Gemma 4에 대해 `thinkingBudget`을 지원되는 Google `thinkingLevel`로 재작성합니다.
thinking을 `off`로 설정하면 `MINIMAL`로 매핑하지 않고 비활성화 상태를 유지합니다.
</Tip>

## 이미지 생성

번들된 `google` 이미지 생성 provider의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

- `google/gemini-3-pro-image-preview`도 지원
- 생성: 요청당 최대 4개 이미지
- 편집 모드: 활성화됨, 최대 입력 이미지 5개
- 기하 제어: `size`, `aspectRatio`, `resolution`

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
공유 도구 파라미터, provider 선택, failover 동작은 [Image Generation](/ko/tools/image-generation)을 참조하세요.
</Note>

## 비디오 생성

번들된 `google` Plugin은 공유
`video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: text-to-video, image-to-video, 단일 비디오 참조 흐름
- `aspectRatio`, `resolution`, `audio` 지원
- 현재 길이 제한: **4초에서 8초**

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
공유 도구 파라미터, provider 선택, failover 동작은 [Video Generation](/ko/tools/video-generation)을 참조하세요.
</Note>

## 음악 생성

번들된 `google` Plugin은 공유
`music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본 `mp3`, 그리고 `google/lyria-3-pro-preview`에서는 `wav`
- 참조 입력: 최대 이미지 10개
- 세션 기반 실행은 `action: "status"`를 포함한 공유 task/status 흐름을 통해 분리됨

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
공유 도구 파라미터, provider 선택, failover 동작은 [Music Generation](/ko/tools/music-generation)을 참조하세요.
</Note>

## Text-to-speech

번들된 `google` 음성 provider는
`gemini-3.1-flash-tts-preview`를 사용하는 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부 파일에는 WAV, Talk/전화용에는 PCM
- 네이티브 음성 메모 출력: API가 Opus가 아니라 PCM을 반환하므로 이 Gemini API 경로에서는 지원되지 않음

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS는 스타일 제어에 자연어 프롬프팅을 사용합니다.
`audioProfile`을 설정하면 말해질 텍스트 앞에 재사용 가능한 스타일 프롬프트를 붙입니다.
프롬프트 텍스트가 이름 있는 화자를 언급할 때는 `speakerName`을 설정하세요.

Gemini API TTS는 `[whispers]` 또는 `[laughs]` 같은 표현형 대괄호 오디오 태그도 텍스트에서 허용합니다.
태그는 보이는 채팅 응답에는 넣지 않고 TTS에만 보내려면
`[[tts:text]]...[[/tts:text]]` 블록 안에 넣으세요.

```text
여기에는 깔끔한 응답 텍스트가 옵니다.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API key는 이
provider에 유효합니다. 이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## Realtime voice

번들된 `google` Plugin은 Voice Call 및 Google Meet 같은 백엔드 오디오 브리지를 위해
Gemini Live API 기반의 realtime 음성 provider를 등록합니다.

| Setting               | Config path                                                         | 기본값                                                                                |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 모델                  | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 음성                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperature           | `...google.temperature`                                             | (설정 안 됨)                                                                          |
| VAD 시작 민감도       | `...google.startSensitivity`                                        | (설정 안 됨)                                                                          |
| VAD 종료 민감도       | `...google.endSensitivity`                                          | (설정 안 됨)                                                                          |
| 무음 지속 시간        | `...google.silenceDurationMs`                                       | (설정 안 됨)                                                                          |
| API key               | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY`, 또는 `GOOGLE_API_KEY`로 fallback |

Voice Call realtime config 예시:

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
OpenClaw는 전화/Meet 브리지 오디오를 Gemini의 PCM Live API 스트림에 맞게 조정하고
도구 호출은 공유 realtime 음성 계약에 유지합니다. 샘플링 변경이 필요하지 않다면 `temperature`는
설정하지 않은 상태로 두세요. Google Live는 `temperature: 0`일 때 오디오 없이 전사만 반환할 수 있으므로
OpenClaw는 0 이하 값을 생략합니다.
Gemini API 전사는 `languageCodes` 없이 활성화되며, 현재 Google SDK는 이 API 경로에서 언어 코드 힌트를 거부합니다.
</Note>

<Note>
Control UI Talk 브라우저 세션은 여전히
브라우저 WebRTC 세션 구현을 가진 realtime 음성 provider가 필요합니다. 현재 이 경로는 OpenAI Realtime이며,
Google provider는 백엔드 realtime 브리지를 위한 것입니다.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우, OpenClaw는
    구성된 `cachedContent` 핸들을 Gemini 요청으로 전달합니다.

    - `cachedContent` 또는 레거시 `cached_content`를 사용해
      모델별 또는 전역 파라미터를 구성합니다
    - 둘 다 있으면 `cachedContent`가 우선합니다
    - 예시 값: `cachedContents/prebuilt-context`
    - Gemini 캐시 적중 사용량은 upstream `cachedContentTokenCount`에서
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

  <Accordion title="Gemini CLI JSON 사용 참고">
    `google-gemini-cli` OAuth provider를 사용할 때, OpenClaw는
    CLI JSON 출력을 다음과 같이 정규화합니다.

    - 응답 텍스트는 CLI JSON의 `response` 필드에서 가져옵니다.
    - CLI가 `usage`를 비워둘 경우 사용량은 `stats`로 fallback합니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면, OpenClaw는
      `stats.input_tokens - stats.cached`에서 입력 토큰을 계산합니다.

  </Accordion>

  <Accordion title="환경 및 daemon 설정">
    Gateway가 daemon(launchd/systemd)으로 실행된다면, `GEMINI_API_KEY`가
    해당 프로세스에서 사용 가능하도록 하세요(예: `~/.openclaw/.env` 또는
    `env.shellEnv`를 통해).
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="Image generation" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 파라미터 및 provider 선택.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 파라미터 및 provider 선택.
  </Card>
  <Card title="Music generation" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 파라미터 및 provider 선택.
  </Card>
</CardGroup>
