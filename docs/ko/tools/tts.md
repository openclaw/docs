---
read_when:
    - 답장에 텍스트 음성 변환 활성화하기
    - TTS 제공자, 폴백 체인 또는 페르소나 구성
    - /tts 명령 또는 지시문 사용
sidebarTitle: Text to speech (TTS)
summary: 발신 답장을 위한 텍스트 음성 변환 — 제공자, 페르소나, 슬래시 명령 및 채널별 출력
title: 텍스트 음성 변환
x-i18n:
    generated_at: "2026-04-30T06:55:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec58d19fbca0ff0cd9828f32c150123cad22f053a6b4281ed40ec3d1fa41d1b2
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw는 **14개의 음성 제공자**를 통해 아웃바운드 응답을 오디오로 변환하고, Feishu, Matrix, Telegram, WhatsApp에서는 네이티브 음성 메시지를, 그 외 모든 곳에서는 오디오 첨부 파일을, 전화 통신과 Talk에는 PCM/Ulaw 스트림을 전달할 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="제공자 선택">
    OpenAI와 ElevenLabs는 가장 안정적인 호스팅 옵션입니다. Microsoft와
    Local CLI는 API 키 없이 작동합니다. 전체 목록은 [제공자 매트릭스](#supported-providers)를
    참조하세요.
  </Step>
  <Step title="API 키 설정">
    제공자의 env var를 내보내세요(예: `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft와 Local CLI에는 키가 필요하지 않습니다.
  </Step>
  <Step title="구성에서 활성화">
    `messages.tts.auto: "always"`와 `messages.tts.provider`를 설정하세요.

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="채팅에서 사용해 보기">
    `/tts status`는 현재 상태를 표시합니다. `/tts audio Hello from OpenClaw`는
    일회성 오디오 응답을 보냅니다.
  </Step>
</Steps>

<Note>
자동 TTS는 기본적으로 **꺼져** 있습니다. `messages.tts.provider`가 설정되지 않은 경우,
OpenClaw는 레지스트리 자동 선택 순서에서 구성된 첫 번째 제공자를 선택합니다.
</Note>

## 지원되는 제공자

| 제공자            | 인증                                                                                                             | 참고                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (`AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`도 가능)          | 네이티브 Ogg/Opus 음성 노트 출력 및 전화 통신.                          |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 호환 TTS. 기본값은 `hexgrad/Kokoro-82M`입니다.                   |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 또는 `XI_API_KEY`                                                                            | 음성 복제, 다국어, `seed`를 통한 결정적 동작.                           |
| **Google Gemini** | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                                                                            | Gemini API TTS; `promptTemplate: "audio-profile-v1"`를 통한 페르소나 인식. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 음성 노트 및 전화 통신 출력.                                            |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 스트리밍 TTS API. 네이티브 Opus 음성 노트 및 PCM 전화 통신.             |
| **Local CLI**     | 없음                                                                                                             | 구성된 로컬 TTS 명령을 실행합니다.                                      |
| **Microsoft**     | 없음                                                                                                             | `node-edge-tts`를 통한 공개 Edge neural TTS. 최선 노력 방식이며 SLA는 없습니다. |
| **MiniMax**       | `MINIMAX_API_KEY` (또는 Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | T2A v2 API. 기본값은 `speech-2.8-hd`입니다.                             |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 자동 요약에도 사용되며 페르소나 `instructions`를 지원합니다.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` 재사용 가능)                                            | 기본 모델은 `hexgrad/kokoro-82m`입니다.                                 |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY` (레거시 AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API.                                          |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 이미지, 비디오, 음성 공유 제공자.                                       |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 배치 TTS. 네이티브 Opus 음성 노트는 지원되지 **않습니다**.          |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi 채팅 완성을 통한 MiMo TTS.                                       |

여러 제공자가 구성된 경우 선택된 제공자가 먼저 사용되고, 나머지는 대체 옵션이 됩니다. 자동 요약은 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용하므로, 요약을 활성화한 상태로 유지하려면 해당 제공자도 인증되어 있어야 합니다.

<Warning>
번들로 제공되는 **Microsoft** 공급자는 `node-edge-tts`를 통해 Microsoft Edge의 온라인 신경망 TTS
서비스를 사용합니다. 이는 게시된 SLA나 할당량이 없는 공개 웹 서비스이므로
최선 노력 방식으로 취급하세요. 레거시 공급자 id `edge`는
`microsoft`로 정규화되며 `openclaw doctor --fix`는 저장된
구성을 다시 씁니다. 새 구성은 항상 `microsoft`를 사용해야 합니다.
</Warning>

## 구성

TTS 구성은 `~/.openclaw/openclaw.json`의 `messages.tts` 아래에 있습니다. 프리셋을
선택하고 공급자 블록을 조정하세요.

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### 에이전트별 음성 재정의

한 에이전트가 다른 공급자, 음성, 모델, 페르소나 또는 auto-TTS 모드로 말해야 할 때는
`agents.list[].tts`를 사용하세요. 에이전트 블록은 `messages.tts` 위에 깊은 병합되므로
공급자 자격 증명은 전역 공급자 구성에 둘 수 있습니다.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

에이전트별 페르소나를 고정하려면 공급자 구성과 함께 `agents.list[].tts.persona`를 설정하세요.
이는 해당 에이전트에 대해서만 전역 `messages.tts.persona`를 재정의합니다.

자동 응답, `/tts audio`, `/tts status`, 그리고 `tts` 에이전트 도구의
우선순위는 다음과 같습니다.

1. `messages.tts`
2. 활성 `agents.list[].tts`
3. 채널이 `channels.<channel>.tts`를 지원할 때의 채널 재정의
4. 채널이 `channels.<channel>.accounts.<id>.tts`를 전달할 때의 계정 재정의
5. 이 호스트의 로컬 `/tts` 환경설정
6. [모델 기반 지시문](#model-driven-directives)이 활성화된 경우 인라인 `[[tts:...]]` 지시문

채널 및 계정 재정의는 `messages.tts`와 같은 형태를 사용하며
이전 계층 위에 딥 머지되므로, 공유 제공자 자격 증명은
`messages.tts`에 그대로 두고 채널 또는 bot 계정은 음성, 모델, 페르소나,
또는 자동 모드만 변경할 수 있습니다.

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## 페르소나

**페르소나**는 여러 제공자에 걸쳐 결정적으로 적용할 수 있는 안정적인 음성 정체성입니다.
하나의 제공자를 선호하도록 설정하고, 제공자 중립적인 프롬프트 의도를 정의하며,
음성, 모델, 프롬프트 템플릿, 시드, 음성 설정에 대한 제공자별 바인딩을 포함할 수 있습니다.

### 최소 페르소나

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### 전체 페르소나(제공자 중립 프롬프트)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### 페르소나 해석

활성 페르소나는 결정적으로 선택됩니다.

1. 설정된 경우 `/tts persona <id>` 로컬 기본 설정.
2. 설정된 경우 `messages.tts.persona`.
3. 페르소나 없음.

제공자 선택은 명시적 설정 우선으로 실행됩니다.

1. 직접 재정의(CLI, Gateway, Talk, 허용된 TTS 지시문).
2. `/tts provider <id>` 로컬 기본 설정.
3. 활성 페르소나의 `provider`.
4. `messages.tts.provider`.
5. 레지스트리 자동 선택.

각 제공자 시도마다 OpenClaw는 다음 순서로 구성을 병합합니다.

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 신뢰된 요청 재정의
4. 허용된 모델 출력 TTS 지시문 재정의

### 제공자가 페르소나 프롬프트를 사용하는 방식

페르소나 프롬프트 필드(`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`)는 **제공자 중립**입니다. 각 제공자는 이를 사용하는 방식을
직접 결정합니다.

<AccordionGroup>
  <Accordion title="Google Gemini">
    유효한 Google 제공자 구성이 `promptTemplate: "audio-profile-v1"`
    또는 `personaPrompt`를 설정한 경우에만 페르소나 프롬프트 필드를 Gemini TTS 프롬프트 구조로 감쌉니다.
    이전 `audioProfile` 및 `speakerName` 필드는 여전히 Google 전용 프롬프트 텍스트로
    앞에 추가됩니다. `[[tts:text]]` 블록 안의 `[whispers]` 또는 `[laughs]` 같은
    인라인 오디오 태그는 Gemini transcript 안에 보존됩니다. OpenClaw는 이러한 태그를 생성하지 않습니다.
  </Accordion>
  <Accordion title="OpenAI">
    명시적인 OpenAI `instructions`가 구성되지 않은 경우에만 페르소나 프롬프트 필드를
    요청 `instructions` 필드에 매핑합니다. 명시적인 `instructions`가 항상 우선합니다.
  </Accordion>
  <Accordion title="Other providers">
    `personas.<id>.providers.<provider>` 아래의 제공자별 페르소나 바인딩만 사용합니다.
    제공자가 자체 페르소나 프롬프트 매핑을 구현하지 않는 한 페르소나 프롬프트 필드는 무시됩니다.
  </Accordion>
</AccordionGroup>

### 폴백 정책

`fallbackPolicy`는 페르소나에 시도한 제공자에 대한 **바인딩이 없을 때**의 동작을 제어합니다.

| 정책                | 동작                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **기본값.** 제공자 중립 프롬프트 필드는 계속 사용할 수 있으며, 제공자는 이를 사용하거나 무시할 수 있습니다.                                      |
| `provider-defaults` | 해당 시도의 프롬프트 준비에서 페르소나가 생략됩니다. 다른 제공자로의 폴백은 계속되는 동안, 해당 제공자는 중립 기본값을 사용합니다.              |
| `fail`              | `reasonCode: "not_configured"` 및 `personaBinding: "missing"`으로 해당 제공자 시도를 건너뜁니다. 폴백 제공자는 계속 시도됩니다.                 |

전체 TTS 요청은 시도한 **모든** 제공자를 건너뛰거나 실패한 경우에만 실패합니다.

## 모델 기반 지시문

기본적으로 assistant는 단일 답변에 대해 음성, 모델 또는 속도를 재정의하는
`[[tts:...]]` 지시문과, 오디오에만 나타나야 하는 표현 큐를 위한 선택적
`[[tts:text]]...[[/tts:text]]` 블록을 출력할 **수 있습니다**.

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

`messages.tts.auto`가 `"tagged"`이면 오디오를 트리거하려면 **지시문이 필요합니다**.
스트리밍 블록 전달은 인접한 블록에 걸쳐 분할된 경우에도 채널이 보기 전에 표시 텍스트에서 지시문을 제거합니다.

`modelOverrides.allowProvider: true`가 아니면 `provider=...`는 무시됩니다.
답변이 `provider=...`를 선언하면 해당 지시문의 다른 키는 해당 제공자만 파싱합니다.
지원되지 않는 키는 제거되고 TTS 지시문 경고로 보고됩니다.

**사용 가능한 지시문 키:**

- `provider`(등록된 제공자 ID, `allowProvider: true` 필요)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`(MiniMax 볼륨, 0-10)
- `pitch`(MiniMax 정수 pitch, -12~12, 소수 값은 잘림)
- `emotion`(Volcengine emotion tag)
- `applyTextNormalization`(`auto|on|off`)
- `languageCode`(ISO 639-1)
- `seed`

**모델 재정의를 완전히 비활성화:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**다른 조정값은 구성 가능하게 유지하면서 제공자 전환 허용:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 슬래시 명령

단일 명령은 `/tts`입니다. Discord에서는 `/tts`가 내장 Discord 명령이기 때문에
OpenClaw가 `/voice`도 등록합니다. 텍스트 `/tts ...`는 계속 작동합니다.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
명령에는 권한이 있는 발신자(allowlist/owner 규칙 적용)가 필요하며,
`commands.text` 또는 네이티브 명령 등록이 활성화되어 있어야 합니다.
</Note>

동작 참고 사항:

- `/tts on`은 로컬 TTS 기본 설정을 `always`로 기록하고, `/tts off`는 `off`로 기록합니다.
- `/tts chat on|off|default`는 현재 채팅에 대한 세션 범위 자동 TTS 재정의를 기록합니다.
- `/tts persona <id>`는 로컬 페르소나 기본 설정을 기록하고, `/tts persona off`는 이를 지웁니다.
- `/tts latest`는 현재 세션 transcript에서 최신 assistant 답변을 읽고 한 번 오디오로 전송합니다. 중복 음성 전송을 억제하기 위해 해당 답변의 해시만 세션 항목에 저장합니다.
- `/tts audio`는 일회성 오디오 답변을 생성합니다(TTS를 켜지는 **않습니다**).
- `limit` 및 `summary`는 기본 구성 파일이 아니라 **로컬 기본 설정**에 저장됩니다.
- `/tts status`에는 최신 시도에 대한 폴백 진단이 포함됩니다. `Fallback: <primary> -> <used>`, `Attempts: ...`, 그리고 시도별 세부 정보(`provider:outcome(reasonCode) latency`)입니다.
- `/status`는 TTS가 활성화된 경우 활성 TTS 모드와 구성된 제공자, 모델, 음성, 그리고 삭제 처리된 사용자 지정 엔드포인트 메타데이터를 표시합니다.

## 사용자별 기본 설정

슬래시 명령은 로컬 재정의를 `prefsPath`에 기록합니다. 기본값은
`~/.openclaw/settings/tts.json`입니다. `OPENCLAW_TTS_PREFS` 환경 변수
또는 `messages.tts.prefsPath`로 재정의할 수 있습니다.

| 저장된 필드 | 효과                                      |
| ------------ | ----------------------------------------- |
| `auto`       | 로컬 자동 TTS 재정의(`always`, `off`, …) |
| `provider`   | 로컬 기본 제공자 재정의                   |
| `persona`    | 로컬 페르소나 재정의                      |
| `maxLength`  | 요약 임계값(기본값 `1500`자)              |
| `summarize`  | 요약 토글(기본값 `true`)                  |

이 값들은 `messages.tts`와 해당 호스트의 활성
`agents.list[].tts` 블록에서 나온 유효 구성을 재정의합니다.

## 출력 형식(고정)

TTS 음성 전달은 채널 기능에 따라 결정됩니다. 채널 Plugin은
음성 스타일 TTS가 제공자에게 네이티브 `voice-note` 대상을 요청해야 하는지,
또는 일반 `audio-file` 합성을 유지하고 호환되는 출력만 음성 전달용으로 표시해야 하는지 알립니다.

- **음성 메모 지원 채널**: 음성 메모 답장은 Opus(ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`)를 우선 사용합니다.
  - 48kHz / 64kbps는 음성 메시지에 적합한 절충값입니다.
- **Feishu / WhatsApp**: 음성 메모 답장이 MP3/WebM/WAV/M4A
  또는 다른 오디오 파일로 보이는 형식으로 생성되면, 채널 Plugin은 네이티브 음성 메시지를 보내기 전에 `ffmpeg`로 48kHz
  Ogg/Opus로 트랜스코딩합니다. WhatsApp은 Baileys `audio` 페이로드를 통해
  `ptt: true` 및 `audio/ogg; codecs=opus`와 함께 결과를 보냅니다. 변환에 실패하면 Feishu는 원본
  파일을 첨부 파일로 받습니다. WhatsApp 전송은 호환되지 않는
  PTT 페이로드를 게시하는 대신 실패합니다.
- **BlueBubbles**: 프로바이더 합성을 일반 오디오 파일 경로에 유지합니다. MP3
  및 CAF 출력은 iMessage 음성 메모 전달용으로 표시됩니다.
- **기타 채널**: MP3(ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`).
  - 44.1kHz / 128kbps는 음성 명료도에 대한 기본 균형값입니다.
- **MiniMax**: 일반 오디오 첨부 파일에는 MP3(`speech-2.8-hd` 모델, 32kHz 샘플 레이트)를 사용합니다. 채널이 알린 음성 메모 대상의 경우, 채널이 트랜스코딩을 알리면 OpenClaw는 전달 전에 `ffmpeg`로 MiniMax MP3를 48kHz Opus로 트랜스코딩합니다.
- **Xiaomi MiMo**: 기본적으로 MP3를 사용하거나, 구성된 경우 WAV를 사용합니다. 채널이 알린 음성 메모 대상의 경우, 채널이 트랜스코딩을 알리면 OpenClaw는 전달 전에 `ffmpeg`로 Xiaomi 출력을 48kHz Opus로 트랜스코딩합니다.
- **로컬 CLI**: 구성된 `outputFormat`을 사용합니다. 음성 메모 대상은
  Ogg/Opus로 변환되고, 전화 출력은 `ffmpeg`로 원시 16 kHz 모노 PCM으로
  변환됩니다.
- **Google Gemini**: Gemini API TTS는 원시 24kHz PCM을 반환합니다. OpenClaw는 오디오 첨부 파일용으로 이를 WAV로 래핑하고, 음성 메모 대상용으로 48kHz Opus로 트랜스코딩하며, Talk/전화용으로는 PCM을 직접 반환합니다.
- **Gradium**: 오디오 첨부 파일에는 WAV, 음성 메모 대상에는 Opus, 전화에는 8 kHz의 `ulaw_8000`을 사용합니다.
- **Inworld**: 일반 오디오 첨부 파일에는 MP3, 음성 메모 대상에는 네이티브 `OGG_OPUS`, Talk/전화에는 22050 Hz의 원시 `PCM`을 사용합니다.
- **xAI**: 기본적으로 MP3를 사용합니다. `responseFormat`은 `mp3`, `wav`, `pcm`, `mulaw` 또는 `alaw`일 수 있습니다. OpenClaw는 xAI의 배치 REST TTS 엔드포인트를 사용하고 완전한 오디오 첨부 파일을 반환합니다. xAI의 스트리밍 TTS WebSocket은 이 프로바이더 경로에서 사용되지 않습니다. 네이티브 Opus 음성 메모 형식은 이 경로에서 지원되지 않습니다.
- **Microsoft**: `microsoft.outputFormat`을 사용합니다(기본값 `audio-24khz-48kbitrate-mono-mp3`).
  - 번들된 전송은 `outputFormat`을 받지만, 서비스에서 모든 형식을 사용할 수 있는 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech 출력 형식(Ogg/WebM Opus 포함)을 따릅니다.
  - Telegram `sendVoice`는 OGG/MP3/M4A를 받습니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요.
  - 구성된 Microsoft 출력 형식이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 출력 형식은 채널별로 고정되어 있습니다(위 참조).

## Auto-TTS 동작

`messages.tts.auto`가 활성화되면 OpenClaw는 다음을 수행합니다.

- 답장에 이미 미디어나 `MEDIA:` 지시문이 포함되어 있으면 TTS를 건너뜁니다.
- 매우 짧은 답장(10자 미만)을 건너뜁니다.
- 요약이 활성화된 경우 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용하여
  긴 답장을 요약합니다.
- 생성된 오디오를 답장에 첨부합니다.
- `mode: "final"`에서는 텍스트 스트림이 완료된 후에도 스트리밍된 최종 답장에 대해
  오디오 전용 TTS를 보냅니다. 생성된 미디어는 일반 답장 첨부 파일과 동일한
  채널 미디어 정규화를 거칩니다.

답장이 `maxLength`를 초과하고 요약이 꺼져 있거나
요약 모델용 API 키가 없으면, 오디오는 건너뛰고 일반 텍스트 답장이 전송됩니다.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## 채널별 출력 형식

  | 대상                                  | 형식                                                                                                                                 |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
  | Feishu / Matrix / Telegram / WhatsApp | 음성 메모 답장은 **Opus**(ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`)를 선호합니다. 48 kHz / 64 kbps는 명료도와 크기의 균형을 맞춥니다. |
  | 기타 채널                             | **MP3**(ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`). 44.1 kHz / 128 kbps가 음성의 기본값입니다.                                      |
  | Talk / 전화                           | 제공자 네이티브 **PCM**(Inworld 22050 Hz, Google 24 kHz), 또는 전화용 Gradium의 `ulaw_8000`.                                          |

  제공자별 참고 사항:

  - **Feishu / WhatsApp 트랜스코딩:** 음성 메모 답장이 MP3/WebM/WAV/M4A로 도착하면, 채널 Plugin이 `ffmpeg`로 48 kHz Ogg/Opus로 트랜스코딩합니다. WhatsApp은 Baileys를 통해 `ptt: true` 및 `audio/ogg; codecs=opus`로 전송합니다. 변환이 실패하면 Feishu는 원본 파일 첨부로 폴백하고, WhatsApp은 호환되지 않는 PTT 페이로드를 게시하는 대신 전송에 실패합니다.
  - **MiniMax / Xiaomi MiMo:** 기본 MP3(MiniMax `speech-2.8-hd`의 경우 32 kHz)이며, 음성 메모 대상에는 `ffmpeg`를 통해 48 kHz Opus로 트랜스코딩됩니다.
  - **로컬 CLI:** 구성된 `outputFormat`을 사용합니다. 음성 메모 대상은 Ogg/Opus로 변환되고 전화 출력은 원시 16 kHz 모노 PCM으로 변환됩니다.
  - **Google Gemini:** 원시 24 kHz PCM을 반환합니다. OpenClaw는 첨부 파일용으로 WAV로 래핑하고, 음성 메모 대상용으로 48 kHz Opus로 트랜스코딩하며, Talk/전화용으로 PCM을 직접 반환합니다.
  - **Inworld:** MP3 첨부 파일, 네이티브 `OGG_OPUS` 음성 메모, Talk/전화용 원시 `PCM` 22050 Hz입니다.
  - **xAI:** 기본값은 MP3이며, `responseFormat`은 `mp3|wav|pcm|mulaw|alaw`일 수 있습니다. xAI의 배치 REST 엔드포인트를 사용합니다. 스트리밍 WebSocket TTS는 사용하지 **않습니다**. 네이티브 Opus 음성 메모 형식은 지원되지 **않습니다**.
  - **Microsoft:** `microsoft.outputFormat`(기본값 `audio-24khz-48kbitrate-mono-mp3`)을 사용합니다. Telegram `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요. 구성된 Microsoft 형식이 실패하면 OpenClaw는 MP3로 다시 시도합니다.

  OpenAI 및 ElevenLabs 출력 형식은 위에 나열된 대로 채널별로 고정됩니다.

  ## 필드 참조

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      자동 TTS 모드입니다. `inbound`는 인바운드 음성 메시지 뒤에만 오디오를 전송합니다. `tagged`는 답장에 `[[tts:...]]` 지시문 또는 `[[tts:text]]` 블록이 포함된 경우에만 오디오를 전송합니다.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      레거시 토글입니다. `openclaw doctor --fix`가 이를 `auto`로 마이그레이션합니다.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"`은 최종 답장에 더해 도구/블록 답장을 포함합니다.
    </ParamField>
    <ParamField path="provider" type="string">
      음성 제공자 ID입니다. 설정되지 않은 경우 OpenClaw는 레지스트리 자동 선택 순서에서 처음 구성된 제공자를 사용합니다. 레거시 `provider: "edge"`는 `openclaw doctor --fix`에 의해 `"microsoft"`로 다시 작성됩니다.
    </ParamField>
    <ParamField path="persona" type="string">
      `personas`의 활성 페르소나 ID입니다. 소문자로 정규화됩니다.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      안정적인 음성 정체성입니다. 필드: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. [페르소나](#personas)를 참고하세요.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      자동 요약용 저비용 모델입니다. 기본값은 `agents.defaults.model.primary`입니다. `provider/model` 또는 구성된 모델 별칭을 허용합니다.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      모델이 TTS 지시문을 내보내도록 허용합니다. `enabled`의 기본값은 `true`이고, `allowProvider`의 기본값은 `false`입니다.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      음성 제공자 ID로 키가 지정된 제공자 소유 설정입니다. 레거시 직접 블록(`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`)은 `openclaw doctor --fix`에 의해 다시 작성됩니다. `messages.tts.providers.<id>`만 커밋하세요.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 입력 문자 수의 하드 제한입니다. 초과하면 `/tts audio`가 실패합니다.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      요청 제한 시간(밀리초)입니다.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      로컬 기본 설정 JSON 경로(제공자/제한/요약)를 재정의합니다. 기본값은 `~/.openclaw/settings/tts.json`입니다.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">환경 변수: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` 또는 `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech 지역(예: `eastus`). 환경 변수: `AZURE_SPEECH_REGION` 또는 `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">선택적 Azure Speech 엔드포인트 재정의(별칭 `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure 음성 ShortName입니다. 기본값은 `en-US-JennyNeural`입니다.</ParamField>
    <ParamField path="lang" type="string">SSML 언어 코드입니다. 기본값은 `en-US`입니다.</ParamField>
    <ParamField path="outputFormat" type="string">표준 오디오용 Azure `X-Microsoft-OutputFormat`입니다. 기본값은 `audio-24khz-48kbitrate-mono-mp3`입니다.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">음성 메모 출력용 Azure `X-Microsoft-OutputFormat`입니다. 기본값은 `ogg-24khz-16bit-mono-opus`입니다.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` 또는 `XI_API_KEY`로 폴백합니다.</ParamField>
    <ParamField path="model" type="string">모델 ID(예: `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 음성 ID입니다.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style`(각각 `0..1`), `useSpeakerBoost`(`true|false`), `speed`(`0.5..2.0`, `1.0` = 보통).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>텍스트 정규화 모드입니다.</ParamField>
    <ParamField path="languageCode" type="string">2글자 ISO 639-1(예: `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">최선형 결정성을 위한 정수 `0..4294967295`입니다.</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API 기본 URL을 재정의합니다.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY`로 폴백합니다. 생략하면 TTS는 환경 변수 폴백 전에 `models.providers.google.apiKey`를 재사용할 수 있습니다.</ParamField>
    <ParamField path="model" type="string">Gemini TTS 모델입니다. 기본값은 `gemini-3.1-flash-tts-preview`입니다.</ParamField>
    <ParamField path="voiceName" type="string">Gemini 사전 빌드 음성 이름입니다. 기본값은 `Kore`입니다. 별칭: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">발화 텍스트 앞에 추가되는 자연어 스타일 프롬프트입니다.</ParamField>
    <ParamField path="speakerName" type="string">프롬프트가 명명된 화자를 사용할 때 발화 텍스트 앞에 추가되는 선택적 화자 레이블입니다.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>활성 페르소나 프롬프트 필드를 결정적 Gemini TTS 프롬프트 구조로 래핑하려면 `audio-profile-v1`로 설정합니다.</ParamField>
    <ParamField path="personaPrompt" type="string">템플릿의 Director's Notes에 추가되는 Google 전용 추가 페르소나 프롬프트 텍스트입니다.</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com`만 허용됩니다.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">환경 변수: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">기본값 Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">환경 변수: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">기본값 `inworld-tts-1.5-max`. 추가 항목: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">기본값 `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">샘플링 온도 `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS용 로컬 실행 파일 또는 명령 문자열.</ParamField>
    <ParamField path="args" type="string[]">명령 인수. `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` 플레이스홀더를 지원합니다.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>예상 CLI 출력 형식. 오디오 첨부 파일의 기본값은 `mp3`.</ParamField>
    <ParamField path="timeoutMs" type="number">명령 시간 제한(밀리초). 기본값 `120000`.</ParamField>
    <ParamField path="cwd" type="string">선택적 명령 작업 디렉터리.</ParamField>
    <ParamField path="env" type="Record<string, string>">명령에 대한 선택적 환경 재정의.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft 음성 사용을 허용합니다.</ParamField>
    <ParamField path="voice" type="string">Microsoft 신경망 음성 이름(예: `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">언어 코드(예: `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 출력 형식. 기본값 `audio-24khz-48kbitrate-mono-mp3`. 번들된 Edge 기반 전송에서 모든 형식을 지원하지는 않습니다.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">백분율 문자열(예: `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">오디오 파일과 함께 JSON 자막을 작성합니다.</ParamField>
    <ParamField path="proxy" type="string">Microsoft 음성 요청용 프록시 URL.</ParamField>
    <ParamField path="timeoutMs" type="number">요청 시간 제한 재정의(ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>레거시 별칭. `openclaw doctor --fix`를 실행하여 저장된 구성을 `providers.microsoft`로 다시 작성하세요.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY`로 대체됩니다. `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` 또는 `MINIMAX_CODING_API_KEY`를 통한 Token Plan 인증.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.minimax.io`. 환경 변수: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">기본값 `speech-2.8-hd`. 환경 변수: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">기본값 `English_expressive_narrator`. 환경 변수: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. 기본값 `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. 기본값 `1.0`.</ParamField>
    <ParamField path="pitch" type="number">정수 `-12..12`. 기본값 `0`. 소수 값은 요청 전에 잘립니다.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY`로 대체됩니다.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 모델 ID(예: `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">음성 이름(예: `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">명시적 OpenAI `instructions` 필드. 설정하면 페르소나 프롬프트 필드가 자동 매핑되지 **않습니다**.</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS 엔드포인트를 재정의합니다. 해석 순서: 구성 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. 기본값이 아닌 값은 OpenAI 호환 TTS 엔드포인트로 처리되므로 사용자 지정 모델 및 음성 이름이 허용됩니다.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">환경 변수: `OPENROUTER_API_KEY`. `models.providers.openrouter.apiKey`를 재사용할 수 있습니다.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://openrouter.ai/api/v1`. 레거시 `https://openrouter.ai/v1`은 정규화됩니다.</ParamField>
    <ParamField path="model" type="string">기본값 `hexgrad/kokoro-82m`. 별칭: `modelId`.</ParamField>
    <ParamField path="voice" type="string">기본값 `af_alloy`. 별칭: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>기본값 `mp3`.</ParamField>
    <ParamField path="speed" type="number">제공자 기본 속도 재정의.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">환경 변수: `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">기본값 `seed-tts-1.0`. 환경 변수: `VOLCENGINE_TTS_RESOURCE_ID`. 프로젝트에 TTS 2.0 권한이 있을 때는 `seed-tts-2.0`을 사용하세요.</ParamField>
    <ParamField path="appKey" type="string">앱 키 헤더. 기본값 `aGjiRDfUWi`. 환경 변수: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP 엔드포인트를 재정의합니다. 환경 변수: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">음성 유형. 기본값 `en_female_anna_mars_bigtts`. 환경 변수: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">제공자 기본 속도 비율.</ParamField>
    <ParamField path="emotion" type="string">제공자 기본 감정 태그.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>레거시 Volcengine Speech Console 필드. 환경 변수: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER`(기본값 `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">환경 변수: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.x.ai/v1`. 환경 변수: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">기본값 `eve`. 라이브 음성: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">BCP-47 언어 코드 또는 `auto`. 기본값 `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>기본값 `mp3`.</ParamField>
    <ParamField path="speed" type="number">제공자 기본 속도 재정의.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">환경 변수: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.xiaomimimo.com/v1`. 환경 변수: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">기본값 `mimo-v2.5-tts`. 환경 변수: `XIAOMI_TTS_MODEL`. `mimo-v2-tts`도 지원합니다.</ParamField>
    <ParamField path="voice" type="string">기본값 `mimo_default`. 환경 변수: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>기본값 `mp3`. 환경 변수: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">사용자 메시지로 전송되는 선택적 자연어 스타일 지시문이며, 음성으로 읽히지 않습니다.</ParamField>
  </Accordion>
</AccordionGroup>

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고 답장 전달을 위한 오디오 첨부 파일을 반환합니다. Feishu, Matrix, Telegram, WhatsApp에서는 오디오가 파일 첨부가 아니라 음성 메시지로 전달됩니다. 이 경로에서 `ffmpeg`를 사용할 수 있으면 Feishu와 WhatsApp은 Opus가 아닌 TTS 출력을 트랜스코딩할 수 있습니다.

WhatsApp은 Baileys를 통해 오디오를 PTT 음성 노트(`ptt: true`가 포함된 `audio`)로 전송하며, 클라이언트가 음성 노트의 캡션을 일관되게 렌더링하지 않기 때문에 표시되는 텍스트는 PTT 오디오와 **별도로** 전송합니다.

이 도구는 선택적 `channel` 및 `timeoutMs` 필드를 받습니다. `timeoutMs`는 호출별 제공자 요청 시간 제한(밀리초)입니다.

## Gateway RPC

| 메서드            | 목적                                  |
| ----------------- | ---------------------------------------- |
| `tts.status`      | 현재 TTS 상태와 마지막 시도를 읽습니다. |
| `tts.enable`      | 로컬 자동 기본 설정을 `always`로 설정합니다.   |
| `tts.disable`     | 로컬 자동 기본 설정을 `off`로 설정합니다.      |
| `tts.convert`     | 일회성 텍스트 → 오디오 변환.                    |
| `tts.setProvider` | 로컬 제공자 기본 설정을 지정합니다.           |
| `tts.setPersona`  | 로컬 페르소나 기본 설정을 지정합니다.            |
| `tts.providers`   | 구성된 제공자와 상태를 나열합니다.    |

## 서비스 링크

- [OpenAI 텍스트 음성 변환 가이드](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI 오디오 API 참조](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 텍스트 음성 변환](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech 제공자](/ko/providers/azure-speech)
- [ElevenLabs 텍스트 음성 변환](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 인증](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ko/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/ko/providers/volcengine#text-to-speech)
- [Xiaomi MiMo 음성 합성](/ko/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech 출력 형식](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI 텍스트 음성 변환](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 관련 항목

- [미디어 개요](/ko/tools/media-overview)
- [음악 생성](/ko/tools/music-generation)
- [동영상 생성](/ko/tools/video-generation)
- [슬래시 명령](/ko/tools/slash-commands)
- [음성 통화 Plugin](/ko/plugins/voice-call)
