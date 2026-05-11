---
read_when:
    - OpenClaw에서 Google Gemini 모델을 사용하려는 경우
    - API 키 또는 OAuth 인증 흐름이 필요합니다
summary: Google Gemini 설정 (API 키 + OAuth, 이미지 생성, 미디어 이해, TTS, 웹 검색)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-11T20:35:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 740ff99392d352e8c0f479af6002c52195b0c40e3ef688289d27dec583174847
    source_path: providers/google.md
    workflow: 16
---

Google Plugin은 Google AI Studio를 통해 Gemini 모델에 대한 접근을 제공하며,
이미지 생성, 미디어 이해(이미지/오디오/비디오), 텍스트 음성 변환, Gemini Grounding을 통한 웹 검색도 제공합니다.

- 제공자: `google`
- 인증: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- API: Google Gemini API
- Runtime 옵션: provider/model `agentRuntime.id: "google-gemini-cli"`는
  모델 참조를 `google/*`로 표준화된 상태로 유지하면서 Gemini CLI OAuth를 재사용합니다.

## 시작하기

선호하는 인증 방식을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키">
    **적합한 용도:** Google AI Studio를 통한 표준 Gemini API 접근.

    <Steps>
      <Step title="온보딩 실행">
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
    환경 변수 `GEMINI_API_KEY`와 `GOOGLE_API_KEY`는 모두 허용됩니다. 이미 구성한 것을 사용하세요.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **적합한 용도:** 별도의 API 키 대신 PKCE OAuth를 통해 기존 Gemini CLI 로그인을 재사용.

    <Warning>
    `google-gemini-cli` 제공자는 비공식 통합입니다. 일부 사용자는
    이런 방식으로 OAuth를 사용할 때 계정 제한이 발생한다고 보고합니다. 자신의 책임하에 사용하세요.
    </Warning>

    <Steps>
      <Step title="Gemini CLI 설치">
        로컬 `gemini` 명령은 `PATH`에서 사용할 수 있어야 합니다.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw는 일반적인 Windows/npm 레이아웃을 포함해 Homebrew 설치와 전역 npm 설치를 모두 지원합니다.
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
    - Runtime: `google-gemini-cli`
    - 별칭: `gemini-cli`

    Gemini 3.1 Pro의 Gemini API 모델 ID는 `gemini-3.1-pro-preview`입니다. OpenClaw는 편의 별칭으로 더 짧은 `google/gemini-3.1-pro`를 허용하며, 제공자 호출 전에 이를 정규화합니다.

    **환경 변수:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (또는 `GEMINI_CLI_*` 변형.)

    <Note>
    로그인 후 Gemini CLI OAuth 요청이 실패하면 Gateway 호스트에 `GOOGLE_CLOUD_PROJECT` 또는
    `GOOGLE_CLOUD_PROJECT_ID`를 설정한 뒤 다시 시도하세요.
    </Note>

    <Note>
    브라우저 흐름이 시작되기 전에 로그인이 실패하면 로컬 `gemini`
    명령이 설치되어 있고 `PATH`에 있는지 확인하세요.
    </Note>

    `google-gemini-cli/*` 모델 참조는 레거시 호환성 별칭입니다. 새
    설정에서는 로컬 Gemini CLI 실행을 원할 때 `google/*` 모델 참조와 `google-gemini-cli`
    Runtime을 사용해야 합니다.

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

## 웹 검색

번들된 `gemini` 웹 검색 제공자는 Gemini Google Search grounding을 사용합니다.
`plugins.entries.google.config.webSearch` 아래에 전용 검색 키를 구성하거나,
`GEMINI_API_KEY` 이후 `models.providers.google.apiKey`를 재사용하게 둘 수 있습니다.

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

자격 증명 우선순위는 전용 `webSearch.apiKey`, 그다음 `GEMINI_API_KEY`,
그다음 `models.providers.google.apiKey`입니다. `webSearch.baseUrl`은 선택 사항이며
운영자 프록시 또는 호환 Gemini API 엔드포인트를 위해 존재합니다. 생략하면
Gemini 웹 검색은 `models.providers.google.baseUrl`을 재사용합니다. 제공자별 도구 동작은
[Gemini 검색](/ko/tools/gemini-search)을 참조하세요.

<Tip>
Gemini 3 모델은 `thinkingBudget` 대신 `thinkingLevel`을 사용합니다. OpenClaw는
기본/저지연 실행에서 비활성화된 `thinkingBudget` 값을 보내지 않도록
Gemini 3, Gemini 3.1, `gemini-*-latest` 별칭 추론 제어를 `thinkingLevel`에 매핑합니다.

`/think adaptive`는 고정된 OpenClaw 수준을 선택하는 대신 Google의 동적 사고 의미 체계를 유지합니다.
Gemini 3과 Gemini 3.1은 Google이 수준을 선택할 수 있도록 고정 `thinkingLevel`을 생략하며,
Gemini 2.5는 Google의 동적 센티널 `thinkingBudget: -1`을 보냅니다.

Gemma 4 모델(예: `gemma-4-26b-a4b-it`)은 사고 모드를 지원합니다. OpenClaw는
Gemma 4에 대해 `thinkingBudget`을 지원되는 Google `thinkingLevel`로 다시 작성합니다.
사고를 `off`로 설정하면 `MINIMAL`에 매핑하는 대신 사고 비활성화 상태를 유지합니다.
</Tip>

## 이미지 생성

번들된 `google` 이미지 생성 제공자의 기본값은
`google/gemini-3.1-flash-image-preview`입니다.

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
공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

## 비디오 생성

번들된 `google` Plugin은 공유 `video_generate` 도구를 통해 비디오 생성도 등록합니다.

- 기본 비디오 모델: `google/veo-3.1-fast-generate-preview`
- 모드: 텍스트-비디오, 이미지-비디오, 단일 비디오 참조 흐름
- `aspectRatio`(`16:9`, `9:16`)와 `resolution`(`720P`, `1080P`)을 지원합니다. Veo는 현재 오디오 출력을 지원하지 않습니다.
- 지원 기간: **4, 6 또는 8초**(다른 값은 허용되는 가장 가까운 값으로 맞춰짐)

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
공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## 음악 생성

번들된 `google` Plugin은 공유 `music_generate` 도구를 통해 음악 생성도 등록합니다.

- 기본 음악 모델: `google/lyria-3-clip-preview`
- `google/lyria-3-pro-preview`도 지원
- 프롬프트 제어: `lyrics` 및 `instrumental`
- 출력 형식: 기본값은 `mp3`, `google/lyria-3-pro-preview`에서는 `wav`도 지원
- 참조 입력: 최대 10개 이미지
- 세션 기반 실행은 `action: "status"`를 포함한 공유 작업/상태 흐름을 통해 분리됩니다.

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
공유 도구 매개변수, 제공자 선택, 장애 조치 동작은 [음악 생성](/ko/tools/music-generation)을 참조하세요.
</Note>

## 텍스트 음성 변환

번들된 `google` 음성 제공자는
`gemini-3.1-flash-tts-preview`와 함께 Gemini API TTS 경로를 사용합니다.

- 기본 음성: `Kore`
- 인증: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`
- 출력: 일반 TTS 첨부 파일은 WAV, 음성 메모 대상은 Opus, Talk/전화 통신은 PCM
- 음성 메모 출력: Google PCM은 WAV로 래핑되고 `ffmpeg`를 사용해 48 kHz Opus로 트랜스코딩됩니다.

Google의 배치 Gemini TTS 경로는 완료된 `generateContent` 응답에서 생성된 오디오를 반환합니다.
가장 낮은 지연 시간의 음성 대화에는 배치 TTS 대신 Gemini Live API가 지원하는
Google 실시간 음성 제공자를 사용하세요.

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
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS는 스타일 제어에 자연어 프롬프트를 사용합니다. 발화 텍스트 앞에
재사용 가능한 스타일 프롬프트를 추가하려면 `audioProfile`을 설정하세요. 프롬프트 텍스트가
이름이 지정된 화자를 참조할 때는 `speakerName`을 설정하세요.

Gemini API TTS는 텍스트 안의 `[whispers]` 또는 `[laughs]` 같은 표현형 대괄호 오디오 태그도 허용합니다.
태그를 TTS로 보내면서도 표시되는 채팅 답변에는 나타나지 않게 하려면
`[[tts:text]]...[[/tts:text]]` 블록 안에 넣으세요.

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Gemini API로 제한된 Google Cloud Console API 키는 이 제공자에 유효합니다.
이는 별도의 Cloud Text-to-Speech API 경로가 아닙니다.
</Note>

## 실시간 음성

번들된 `google` Plugin은 Voice Call 및 Google Meet 같은 백엔드 오디오 브리지를 위해
Gemini Live API가 지원하는 실시간 음성 제공자를 등록합니다.

| 설정                  | 구성 경로                                                           | 기본값                                                                                |
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
| 세션 재개             | `...google.sessionResumption`                                       | `true`                                                                                |
| 컨텍스트 압축         | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 키                | `...google.apiKey`                                                  | `models.providers.google.apiKey`, `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`로 대체됩니다 |

Voice Call 실시간 구성 예:

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
OpenClaw는 전화/Meet 브리지 오디오를 Gemini의 PCM Live API 스트림에 맞게 조정하고
도구 호출은 공유 실시간 음성 계약 위에 유지합니다. 샘플링 변경이 필요하지 않다면
`temperature`를 설정하지 않은 상태로 두세요. Google Live가 `temperature: 0`일 때
오디오 없이 transcript를 반환할 수 있으므로 OpenClaw는 양수가 아닌 값을 생략합니다.
Gemini API transcription은 `languageCodes` 없이 활성화됩니다. 현재 Google
SDK는 이 API 경로에서 언어 코드 힌트를 거부합니다.
</Note>

<Note>
Control UI Talk는 제한된 일회용 토큰으로 Google Live 브라우저 세션을 지원합니다.
백엔드 전용 실시간 음성 provider도 일반 Gateway relay transport를 통해 실행할 수 있으며,
이 방식은 provider 자격 증명을 Gateway에 보관합니다.
</Note>

maintainer live verification의 경우
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`를 실행하세요.
이 smoke는 OpenAI 백엔드/WebRTC 경로도 포함합니다. Google 단계는 Control UI Talk에서 사용하는 것과 동일한
제한된 Live API 토큰 형태를 발급하고, 브라우저
WebSocket 엔드포인트를 열고, 초기 setup payload를 전송한 뒤
`setupComplete`를 기다립니다.

## 고급 구성

<AccordionGroup>
  <Accordion title="직접 Gemini 캐시 재사용">
    직접 Gemini API 실행(`api: "google-generative-ai"`)의 경우 OpenClaw는
    구성된 `cachedContent` 핸들을 Gemini 요청으로 전달합니다.

    - 모델별 또는 전역 params를
      `cachedContent` 또는 레거시 `cached_content` 중 하나로 구성합니다
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
    `google-gemini-cli` OAuth provider를 사용할 때 OpenClaw는
    CLI JSON 출력을 다음과 같이 정규화합니다.

    - 응답 텍스트는 CLI JSON `response` 필드에서 가져옵니다.
    - CLI가 `usage`를 비워 두면 사용량은 `stats`로 대체됩니다.
    - `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
    - `stats.input`이 없으면 OpenClaw는
      `stats.input_tokens - stats.cached`에서 입력 토큰을 도출합니다.

  </Accordion>

  <Accordion title="환경 및 daemon 설정">
    Gateway가 daemon(launchd/systemd)으로 실행되는 경우 `GEMINI_API_KEY`가
    해당 프로세스에서 사용할 수 있는지 확인하세요. 예를 들어 `~/.openclaw/.env`에 두거나
    `env.shellEnv`를 통해 제공할 수 있습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수와 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 provider 선택.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    공유 음악 도구 매개변수와 provider 선택.
  </Card>
</CardGroup>
