---
read_when:
    - 답변에 텍스트 음성 변환 활성화하기
    - TTS 제공자, 폴백 체인 또는 페르소나 구성하기
    - /tts 명령 또는 지시문 사용하기
sidebarTitle: Text to speech (TTS)
summary: 발신 답변을 위한 텍스트 음성 변환 — 제공업체, 페르소나, 슬래시 명령어 및 채널별 출력
title: 텍스트 음성 변환
x-i18n:
    generated_at: "2026-07-12T15:52:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 908679a0386da75577a2445dfcafecc746d124ffe04816c6f2d6eb74af232edd
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw은 **14개 음성 제공자**를 통해 발신 응답을 오디오로 변환합니다.
Feishu, Matrix, Telegram, WhatsApp에서는 기본 음성 메시지로, 그 외의 모든 곳에서는 오디오
첨부 파일로 제공하며, 전화 통신과 Talk에는 PCM/Ulaw 스트림을 제공합니다.

TTS는 Talk의 `stt-tts` 모드에서 음성 출력을 담당합니다(`talk.speak`도 이와
동일한 합성 경로를 호출합니다). 제공자 기본 `realtime` Talk 세션은 대신 실시간
제공자 내부에서 음성을 합성하며, `transcription` 세션은 어시스턴트의 음성 응답을
합성하지 않습니다.

## 빠른 시작

<Steps>
  <Step title="제공자 선택">
    OpenAI와 ElevenLabs는 가장 안정적인 호스팅 옵션입니다. Microsoft와
    로컬 CLI는 API 키 없이 작동합니다. 전체 목록은 [제공자 매트릭스](#supported-providers)를
    참조하십시오.
  </Step>
  <Step title="API 키 설정">
    사용 중인 제공자의 환경 변수를 내보내십시오(예: `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft와 로컬 CLI에는 키가 필요하지 않습니다.
  </Step>
  <Step title="구성에서 활성화">
    `messages.tts.auto: "always"`와 `messages.tts.provider`를 설정하십시오.

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
    `/tts status`는 현재 상태를 표시합니다. `/tts audio Hello from OpenClaw`은
    일회성 오디오 응답을 전송합니다.
  </Step>
</Steps>

<Note>
자동 TTS는 기본적으로 **꺼져 있습니다**. `messages.tts.provider`가 설정되지 않은 경우
OpenClaw은 레지스트리 자동 선택 순서에서 처음으로 구성된 제공자를 선택합니다.
기본 제공되는 `tts` 에이전트 도구는 명시적인 의도가 있을 때만 작동합니다. 사용자가
오디오를 요청하거나 `/tts`를 사용하거나 자동 TTS/지시문 음성을 활성화하지 않는 한
일반 채팅은 텍스트로 유지됩니다.
</Note>

## 지원되는 제공자

| 제공자            | 인증                                                                                                             | 참고                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (`AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`도 지원)         | 기본 Ogg/Opus 음성 메모 출력 및 전화 통신을 지원합니다.                                               |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | OpenAI 호환 TTS입니다. 기본값은 `hexgrad/Kokoro-82M`입니다.                                           |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 또는 `XI_API_KEY`                                                                           | 음성 복제, 다국어, `seed`를 통한 결정론적 출력을 지원하며 Discord 음성 재생에는 스트리밍됩니다.         |
| **Google Gemini** | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`                                                                           | Gemini API 배치 TTS이며 `promptTemplate: "audio-profile-v1"`을 통해 페르소나를 인식합니다.             |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 음성 메모 및 전화 통신 출력을 지원합니다.                                                             |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 스트리밍 TTS API입니다. 기본 Opus 음성 메모와 PCM 전화 통신을 지원합니다.                              |
| **로컬 CLI**      | 없음                                                                                                             | 구성된 로컬 TTS 명령을 실행합니다.                                                                    |
| **Microsoft**     | 없음                                                                                                             | `node-edge-tts`를 통한 공개 Edge 신경망 TTS입니다. 최선형 서비스이며 SLA가 없습니다.                    |
| **MiniMax**       | `MINIMAX_API_KEY` (또는 토큰 플랜: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)     | T2A v2 API입니다. 기본값은 `speech-2.8-hd`입니다.                                                     |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 자동 요약에도 사용되며 페르소나 `instructions`를 지원합니다.                                          |
| **OpenRouter**    | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey`를 재사용할 수 있음)                                    | 기본 모델은 `hexgrad/kokoro-82m`입니다.                                                               |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY` (레거시 AppID/토큰: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API입니다.                                                                  |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 이미지, 동영상, 음성을 공유하는 제공자입니다.                                                         |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 배치 TTS입니다. 기본 Opus 음성 메모는 **지원되지 않습니다**.                                      |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | Xiaomi 채팅 완성을 통한 MiMo TTS입니다.                                                               |

여러 제공자가 구성된 경우 선택한 제공자가 먼저 사용되고 나머지는 대체 옵션으로
사용됩니다. 자동 요약은 `summaryModel`(또는 `agents.defaults.model.primary`)을
사용하므로 요약을 활성화한 상태로 유지하려면 해당 제공자도 인증되어야 합니다.

<Warning>
기본 제공되는 **Microsoft** 제공자는 `node-edge-tts`를 통해 Microsoft Edge의 온라인
신경망 TTS 서비스를 사용합니다. 공개된 SLA나 할당량이 없는 공개 웹 서비스이므로
최선형 서비스로 취급하십시오. 레거시 제공자 ID `edge`는 `microsoft`로 정규화되며
`openclaw doctor --fix`는 저장된 구성을 다시 작성합니다. 새 구성에서는 항상
`microsoft`를 사용해야 합니다.
</Warning>

## 구성

TTS 구성은 `~/.openclaw/openclaw.json`의 `messages.tts` 아래에 있습니다. 프리셋을
선택하고 제공자 블록을 조정하십시오. 아래에 표시된 `speakerVoice`/`speakerVoiceId`
필드는 표준 필드입니다. 각 제공자 자체의 `voice`/`voiceId`/
`voiceName` 필드 이름도 레거시 별칭으로 계속 작동합니다.

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
          // 선택 사항인 자연어 스타일 프롬프트:
          // audioProfile: "차분한 팟캐스트 진행자 어조로 말합니다.",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="로컬 CLI">
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
  <Tab title="Microsoft(키 불필요)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Xiaomi `mimo-v2.5-tts-voicedesign`의 경우 `speakerVoice`를 생략하고 `style`을
음성 디자인 프롬프트로 설정하십시오. OpenClaw은 해당 프롬프트를 TTS `user` 메시지로
전송하며 voicedesign 모델에는 `audio.voice`를 전송하지 않습니다.

### 에이전트별 음성 재정의

에이전트 하나가 다른 제공자, 음성, 모델, 페르소나 또는 자동 TTS 모드로 말해야 할 때는 `agents.list[].tts`를 사용하십시오. 에이전트 블록은 `messages.tts` 위에 깊은 병합되므로 제공자 자격 증명은 전역 제공자 구성에 유지할 수 있습니다.

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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

에이전트별 페르소나를 고정하려면 제공자 구성과 함께 `agents.list[].tts.persona`를 설정하십시오. 이 값은 해당 에이전트에 대해서만 전역 `messages.tts.persona`를 재정의합니다.

자동 응답, `/tts audio`, `/tts status`, `tts` 에이전트 도구의 우선순위는 다음과 같습니다.

1. `messages.tts`
2. 활성 `agents.list[].tts`
3. 채널이 `channels.<channel>.tts`를 지원하는 경우 채널 재정의
4. 채널이 `channels.<channel>.accounts.<id>.tts`를 전달하는 경우 계정 재정의
5. 이 호스트의 로컬 `/tts` 환경설정
6. [모델 재정의](#model-driven-directives)가 활성화된 경우 인라인 `[[tts:...]]` 지시문

채널 및 계정 재정의는 `messages.tts`와 동일한 형태를 사용하며 이전 계층 위에 깊은 병합됩니다. 따라서 공유 제공자 자격 증명은 `messages.tts`에 유지하면서 채널이나 봇 계정에서 화자 음성, 모델, 페르소나 또는 자동 모드만 변경할 수 있습니다.

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
              openai: { speakerVoice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## 페르소나

**페르소나**는 여러 제공자에 걸쳐 결정론적으로 적용할 수 있는 일관된 음성 정체성입니다. 특정 제공자를 선호하고, 제공자 중립적인 프롬프트 의도를 정의하며, 음성, 모델, 프롬프트 템플릿, 시드 및 음성 설정에 대한 제공자별 바인딩을 포함할 수 있습니다.

### 최소 페르소나

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "내레이터",
          provider: "elevenlabs",
          providers: {
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

### 전체 페르소나(제공자 중립적 프롬프트)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "알프레드",
          description: "건조하면서도 따뜻한 영국인 집사 내레이터.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "명석한 영국인 집사입니다. 건조한 유머와 재치, 따뜻함과 매력을 갖추고 감정을 풍부하게 표현하며, 절대 판에 박히지 않습니다.",
            scene: "조용한 심야의 서재입니다. 신뢰받는 운영자를 위한 근접 마이크 내레이션입니다.",
            sampleContext: "화자가 간결한 자신감과 건조한 따뜻함으로 비공개 기술 요청에 답하고 있습니다.",
            style: "세련되고 절제되어 있으며 살짝 재미있어합니다.",
            accent: "영국 영어.",
            pacing: "차분하게 진행하며 짧고 극적인 쉼을 둡니다.",
            constraints: ["구성 값을 소리 내어 읽지 마십시오.", "페르소나를 설명하지 마십시오."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

### 페르소나 결정

활성 페르소나는 결정론적으로 선택됩니다.

1. 설정된 경우 `/tts persona <id>` 로컬 환경설정.
2. 설정된 경우 `messages.tts.persona`.
3. 페르소나 없음.

제공자 선택은 명시적 설정을 우선하여 실행됩니다.

1. 직접 재정의(CLI, Gateway, Talk, 허용된 TTS 지시문).
2. `/tts provider <id>` 로컬 환경설정.
3. 활성 페르소나의 `provider`.
4. `messages.tts.provider`.
5. 레지스트리 자동 선택.

OpenClaw는 각 제공자 시도마다 다음 순서로 구성을 병합합니다.

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 신뢰할 수 있는 요청 재정의
4. 허용된 모델 생성 TTS 지시문 재정의

### 제공자가 페르소나 프롬프트를 사용하는 방식

페르소나 프롬프트 필드(`profile`, `scene`, `sampleContext`, `style`, `accent`, `pacing`, `constraints`)는 **제공자 중립적**입니다. 각 제공자가 이를 사용하는 방식을 결정합니다.

<AccordionGroup>
  <Accordion title="Google Gemini">
    유효한 Google 제공자 구성에 `promptTemplate: "audio-profile-v1"` 또는 `personaPrompt`가 설정된 경우에만 페르소나 프롬프트 필드를 Gemini TTS 프롬프트 구조로 래핑합니다. 이전 `audioProfile` 및 `speakerName` 필드는 계속 Google 전용 프롬프트 텍스트 앞에 추가됩니다. `[[tts:text]]` 블록 안의 `[whispers]` 또는 `[laughs]` 같은 인라인 오디오 태그는 Gemini 트랜스크립트 안에 그대로 유지됩니다. OpenClaw는 이러한 태그를 생성하지 않습니다.
  </Accordion>
  <Accordion title="OpenAI">
    명시적인 OpenAI `instructions`가 구성되지 않은 경우에만 페르소나 프롬프트 필드를 요청의 `instructions` 필드에 매핑합니다. 명시적인 `instructions`가 항상 우선합니다.
  </Accordion>
  <Accordion title="기타 제공자">
    `personas.<id>.providers.<provider>` 아래의 제공자별 페르소나 바인딩만 사용합니다. 제공자가 자체 페르소나 프롬프트 매핑을 구현하지 않는 한 페르소나 프롬프트 필드는 무시됩니다.
  </Accordion>
</AccordionGroup>

### 폴백 정책

`fallbackPolicy`는 시도한 제공자에 대한 바인딩이 페르소나에 **없는 경우**의 동작을 제어합니다.

| 정책                | 동작                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **기본값입니다.** 제공자 중립적 프롬프트 필드는 계속 사용할 수 있으며, 제공자는 이를 사용하거나 무시할 수 있습니다.                                               |
| `provider-defaults` | 해당 시도의 프롬프트 준비에서 페르소나를 제외합니다. 다른 제공자로의 폴백은 계속 진행되며, 해당 제공자는 중립적인 기본값을 사용합니다.                              |
| `fail`              | `reasonCode: "not_configured"` 및 `personaBinding: "missing"`으로 해당 제공자 시도를 건너뜁니다. 폴백 제공자는 계속 시도합니다.                                    |

시도한 **모든** 제공자를 건너뛰거나 모든 시도가 실패한 경우에만 전체 TTS 요청이 실패합니다.

Talk 세션의 제공자 선택 범위는 세션으로 제한됩니다. Talk 클라이언트는 `talk.catalog`에서 제공자 ID, 모델 ID, 음성 ID 및 로캘을 선택하여 Talk 세션 또는 핸드오프 요청을 통해 전달해야 합니다. 음성 세션을 열 때 `messages.tts` 또는 전역 Talk 제공자 기본값을 변경해서는 안 됩니다.

## 모델 기반 지시문

기본적으로 어시스턴트는 단일 응답의 음성, 모델 또는 속도를 재정의하는 `[[tts:...]]` 지시문과, 오디오에만 나타나야 하는 표현 단서를 위한 선택적 `[[tts:text]]...[[/tts:text]]` 블록을 내보낼 **수 있습니다**.

```text
여기 있습니다.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](웃으며) 노래를 한 번 더 읽어 주세요.[[/tts:text]]
```

`messages.tts.auto`가 `"tagged"`이면 오디오를 트리거하려면 **지시문이 필요합니다**. 스트리밍 블록 전달은 지시문이 인접 블록에 걸쳐 나뉘어 있더라도 채널에 전달되기 전에 표시되는 텍스트에서 지시문을 제거합니다.

`modelOverrides.allowProvider: true`가 아니면 `provider=...`는 무시됩니다. 응답에서 `provider=...`를 선언하면 해당 지시문의 다른 키는 그 제공자만 파싱합니다. 지원되지 않는 키는 제거되고 TTS 지시문 경고로 보고됩니다.

**사용 가능한 지시문 키:**

- `provider`(등록된 제공자 ID, `allowProvider: true` 필요)
- `speakerVoice` / `speakerVoiceId`(레거시 별칭: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume`(MiniMax 볼륨, `(0, 10]`)
- `pitch`(MiniMax 정수 피치, −12~12, 소수 값은 버림)
- `emotion`(Volcengine 감정 태그)
- `applyTextNormalization`(`auto|on|off`)
- `languageCode`(ISO 639-1)
- `seed`

**모델 재정의를 완전히 비활성화하기:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**다른 설정을 구성할 수 있도록 유지하면서 제공자 전환 허용하기:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 슬래시 명령어

단일 명령어는 `/tts`입니다. `/tts`는 Discord 기본 제공 명령어이므로 OpenClaw는 Discord에서 `/voice`도 등록합니다. 텍스트 `/tts ...`도 계속 작동합니다.

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
명령어를 사용하려면 승인된 발신자여야 하며(허용 목록/소유자 규칙 적용), `commands.text` 또는 네이티브 명령어 등록이 활성화되어 있어야 합니다.
</Note>

동작 참고 사항:

- `/tts on`은 로컬 TTS 환경설정을 `always`로 기록하고, `/tts off`는 `off`로 기록합니다.
- `/tts chat on|off|default`는 현재 채팅에 대해 세션 범위의 자동 TTS 재정의를 기록합니다.
- `/tts persona <id>`는 로컬 페르소나 환경설정을 기록하고, `/tts persona off`는 이를 지웁니다.
- `/tts latest`는 현재 세션 트랜스크립트에서 최신 어시스턴트 응답을 읽어 오디오로 한 번 전송합니다. 중복 음성 전송을 방지하기 위해 세션 항목에는 해당 응답의 해시만 저장합니다.
- `/tts audio`는 일회성 오디오 응답을 생성하며 TTS를 켜거나 끄지 **않습니다**.
- `/tts limit <chars>`는 **100–4096**을 허용합니다(4096은 Telegram 캡션/메시지 최대치). 이 범위를 벗어난 값은 거부됩니다.
- `limit` 및 `summary`는 기본 구성 파일이 아니라 **로컬 환경설정**에 저장됩니다.
- `/tts status`에는 최근 시도의 폴백 진단 정보인 `Fallback: <primary> -> <used>`, `Attempts: ...` 및 시도별 세부 정보(`provider:outcome(reasonCode) latency`)가 포함됩니다.
- `/status`는 TTS가 활성화된 경우 활성 TTS 모드와 함께 구성된 제공자, 모델, 음성 및 정제된 사용자 지정 엔드포인트 메타데이터를 표시합니다.

## 사용자별 환경설정

슬래시 명령어는 로컬 재정의를 `prefsPath`에 기록합니다. 기본값은 `~/.openclaw/settings/tts.json`입니다. `OPENCLAW_TTS_PREFS` 환경 변수 또는 `messages.tts.prefsPath`로 재정의할 수 있습니다.

| 저장 필드    | 효과                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------ |
| `auto`       | 로컬 자동 TTS 재정의(`always`, `off`, …)                                                   |
| `provider`   | 로컬 기본 제공자 재정의                                                                    |
| `persona`    | 로컬 페르소나 재정의                                                                        |
| `maxLength`  | 요약/잘림 임계값(기본값 `1500`자, `/tts limit` 범위 100–4096)                              |
| `summarize`  | 요약 토글(기본값 `true`)                                                                    |

이 값은 해당 호스트에서 `messages.tts`와 활성 `agents.list[].tts` 블록으로 구성된 유효 구성을 재정의합니다.

## 출력 형식

TTS 음성 전달은 채널 기능에 따라 결정됩니다. 채널 Plugin은
음성 스타일 TTS가 제공자에 네이티브 `voice-note` 대상을 요청해야 하는지,
아니면 일반 `audio-file` 합성을 유지해야 하는지와 채널이 전송 전에
비네이티브 출력을 트랜스코딩하는지를 알립니다.

| 대상                                  | 형식                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 음성 메시지 응답에는 **Opus**(ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`)를 우선 사용합니다. 48 kHz / 64 kbps는 선명도와 크기 간의 균형을 제공합니다. |
| 기타 채널                             | **MP3**(ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`). 44.1 kHz / 128 kbps는 음성의 기본 균형 설정입니다.                              |
| Talk / 전화 통신                      | 제공자 네이티브 **PCM**(Inworld 22050 Hz, Google 24 kHz) 또는 전화 통신용 Gradium의 `ulaw_8000`입니다.                                 |

제공자별 참고 사항:

- **Feishu / WhatsApp 트랜스코딩:** 음성 메시지 응답이 MP3/WebM/WAV/M4A 또는 다른 오디오 파일로 추정되는 형식으로 전달되면, 채널 Plugin은 네이티브 음성 메시지를 보내기 전에 `ffmpeg`(`libopus`, 64 kbps)를 사용해 이를 48 kHz Ogg/Opus로 트랜스코딩합니다. WhatsApp은 `ptt: true` 및 `audio/ogg; codecs=opus`가 설정된 Baileys `audio` 페이로드를 통해 결과를 전송합니다. 트랜스코딩 실패 시 Feishu는 오류를 포착하고 원본 파일을 일반 첨부 파일로 보내는 방식으로 대체합니다. WhatsApp에는 대체 동작이 없으므로 호환되지 않는 PTT 페이로드를 게시하는 대신 전송 자체가 실패합니다.
- **MiniMax:** 일반 오디오 첨부 파일에는 MP3(`speech-2.8-hd` 모델, 32 kHz 샘플 레이트)를 사용하며, 채널이 알린 음성 메시지 대상에는 `ffmpeg`를 사용해 48 kHz Opus로 트랜스코딩합니다.
- **Xiaomi MiMo:** 기본적으로 MP3를 사용하며, 구성된 경우 WAV를 사용합니다. 채널이 알린 음성 메시지 대상에는 `ffmpeg`를 사용해 48 kHz Opus로 트랜스코딩합니다.
- **로컬 CLI:** 구성된 `outputFormat`을 사용합니다. 음성 메시지 대상은 Ogg/Opus로 변환하고, 전화 통신 출력은 `ffmpeg`를 사용해 원시 16 kHz 모노 PCM으로 변환합니다.
- **Google Gemini:** 원시 24 kHz PCM을 반환합니다. OpenClaw는 오디오 첨부 파일의 경우 이를 WAV로 래핑하고, 음성 메시지 대상의 경우 48 kHz Opus로 트랜스코딩하며, Talk/전화 통신의 경우 PCM을 직접 반환합니다.
- **Gradium:** 오디오 첨부 파일에는 WAV, 음성 메시지 대상에는 Opus, 전화 통신에는 8 kHz의 `ulaw_8000`을 사용합니다.
- **Inworld:** 일반 오디오 첨부 파일에는 MP3, 음성 메시지 대상에는 네이티브 `OGG_OPUS`, Talk/전화 통신에는 22050 Hz의 원시 `PCM`을 사용합니다.
- **xAI:** 기본적으로 MP3를 사용하며, `responseFormat`은 `mp3`, `wav`, `pcm`, `mulaw` 또는 `alaw`일 수 있습니다. xAI의 일괄 REST TTS 엔드포인트를 사용하고 완전한 오디오 첨부 파일을 반환합니다. 이 제공자 경로에서는 xAI의 스트리밍 TTS WebSocket을 사용하지 않습니다. 네이티브 Opus 음성 메시지 형식은 지원되지 않습니다.
- **Microsoft:** `microsoft.outputFormat`(기본값 `audio-24khz-48kbitrate-mono-mp3`)을 사용합니다.
  - 번들 전송 계층은 `outputFormat`을 받지만, 서비스에서 모든 형식을 사용할 수 있는 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech 출력 형식(Ogg/WebM Opus 포함)을 따릅니다.
  - Telegram `sendVoice`는 OGG/MP3/M4A를 지원합니다. Opus 음성 메시지를 보장해야 한다면 OpenAI/ElevenLabs를 사용하십시오.
  - 구성된 Microsoft 출력 형식이 실패하면 OpenClaw는 MP3로 다시 시도합니다.
  - 명시적인 음성 재정의가 설정되지 않고 기본 영어 음성을 사용하는 경우, 응답 텍스트에서 CJK 문자가 지배적이면 OpenClaw는 중국어 신경망 음성(`zh-CN-XiaoxiaoNeural`, `zh-CN` 로캘)으로 자동 전환합니다.

OpenAI 및 ElevenLabs 출력 형식은 위에 나열된 대로 채널별로 고정됩니다.

## 자동 TTS 동작

`messages.tts.auto`가 활성화되면 OpenClaw는 다음과 같이 동작합니다.

- 응답에 구조화된 미디어가 이미 포함되어 있으면 TTS를 건너뜁니다.
- 매우 짧은 응답(10자 미만)을 건너뜁니다.
- 요약이 활성화된 경우 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용해
  긴 응답을 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.
- `mode: "final"`에서는 텍스트 스트림이 완료된 후 스트리밍된 최종 응답에
  오디오 전용 TTS를 계속 전송합니다. 생성된 미디어에는 일반 응답 첨부 파일과
  동일한 채널 미디어 정규화가 적용됩니다.

응답이 `maxLength`를 초과해도 OpenClaw는 오디오를 완전히 건너뛰지 않습니다.

- **요약 켜짐**(기본값)이고 요약 모델을 사용할 수 있는 경우: 텍스트를
  대략 `maxLength`자로 요약한 다음 요약문을 합성합니다.
- **요약 꺼짐**, 요약 실패 또는 요약 모델에 사용할 수 있는 API 키가 없는 경우:
  텍스트를 `maxLength`자로 잘라낸 다음 잘린 텍스트를 합성합니다.

```text
응답 -> TTS가 활성화되었습니까?
  아니요 -> 텍스트 전송
  예     -> 미디어가 있거나 짧습니까?
              예     -> 텍스트 전송
              아니요 -> 길이가 제한을 초과합니까?
                           아니요 -> TTS -> 오디오 첨부
                           예     -> 요약이 활성화되어 있고 사용 가능합니까?
                                      아니요 -> 잘라내기 -> TTS -> 오디오 첨부
                                      예     -> 요약 -> TTS -> 오디오 첨부
```

## 필드 참조

<AccordionGroup>
  <Accordion title="최상위 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      자동 TTS 모드입니다. `inbound`는 수신 음성 메시지 이후에만 오디오를 전송하며, `tagged`는 응답에 `[[tts:...]]` 지시문 또는 `[[tts:text]]` 블록이 포함된 경우에만 오디오를 전송합니다.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      레거시 토글입니다. `openclaw doctor --fix`는 이를 `auto`로 마이그레이션합니다.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"`은 최종 응답뿐 아니라 도구/블록 응답도 포함합니다.
    </ParamField>
    <ParamField path="provider" type="string">
      음성 제공자 ID입니다. 설정하지 않으면 OpenClaw는 레지스트리 자동 선택 순서에서 처음으로 구성된 제공자를 사용합니다. 레거시 `provider: "edge"`는 `openclaw doctor --fix`에 의해 `"microsoft"`로 다시 작성됩니다.
    </ParamField>
    <ParamField path="persona" type="string">
      `personas`의 활성 페르소나 ID입니다. 소문자로 정규화됩니다.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      일관된 음성 정체성입니다. 필드: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. [페르소나](#personas)를 참조하십시오.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      자동 요약용 저비용 모델이며, 기본값은 `agents.defaults.model.primary`입니다. `provider/model` 또는 구성된 모델 별칭을 허용합니다.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      모델이 TTS 지시문을 출력하도록 허용합니다. `enabled`의 기본값은 `true`이며, `allowProvider`의 기본값은 `false`입니다.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      음성 제공자 ID를 키로 사용하는 제공자 소유 설정입니다. 레거시 직접 블록(`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`)은 `openclaw doctor --fix`에 의해 다시 작성됩니다. `messages.tts.providers.<id>`만 커밋하십시오.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      TTS 입력 문자 수의 하드 제한입니다. 초과하면 `/tts audio`, `tts.convert` 및 `tts.speak`가 실패합니다.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      밀리초 단위의 요청 시간 제한입니다. 호출별 `timeoutMs`(에이전트 도구, Gateway)가 설정된 경우 이를 우선하며, 그렇지 않으면 명시적으로 구성된 `messages.tts.timeoutMs`가 Plugin이 작성한 제공자 기본값보다 우선합니다.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      로컬 환경설정 JSON 경로(제공자/제한/요약)를 재정의합니다. 기본값은 `~/.openclaw/settings/tts.json`입니다.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">환경 변수: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` 또는 `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech 리전(예: `eastus`)입니다. 환경 변수: `AZURE_SPEECH_REGION` 또는 `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">선택적 Azure Speech 엔드포인트 재정의입니다(별칭 `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">Azure 음성 ShortName입니다. 기본값은 `en-US-JennyNeural`입니다. 레거시 별칭: `voice`.</ParamField>
    <ParamField path="lang" type="string">SSML 언어 코드입니다. 기본값은 `en-US`입니다.</ParamField>
    <ParamField path="outputFormat" type="string">표준 오디오용 Azure `X-Microsoft-OutputFormat`입니다. 기본값은 `audio-24khz-48kbitrate-mono-mp3`입니다.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">음성 메시지 출력용 Azure `X-Microsoft-OutputFormat`입니다. 기본값은 `ogg-24khz-16bit-mono-opus`입니다.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` 또는 `XI_API_KEY`를 대체 값으로 사용합니다.</ParamField>
    <ParamField path="model" type="string">모델 ID입니다. 기본값은 `eleven_multilingual_v2`입니다. 레거시 ID `eleven_turbo_v2_5`/`eleven_turbo_v2`는 각각 일치하는 `flash` 모델로 정규화됩니다.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ElevenLabs 음성 ID입니다. 기본값은 `pMsXgVXv3BLzUgSXRplE`입니다. 레거시 별칭: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style`(각각 `0..1`, 기본값 `0.5`/`0.75`/`0`), `useSpeakerBoost`(`true|false`, 기본값 `true`), `speed`(`0.5..2.0`, 기본값 `1.0`)입니다.
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>텍스트 정규화 모드입니다.</ParamField>
    <ParamField path="languageCode" type="string">2자리 ISO 639-1 코드(예: `en`, `de`)입니다.</ParamField>
    <ParamField path="seed" type="number">최선형 결정성을 위한 정수 `0..4294967295`입니다.</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API 기본 URL을 재정의합니다.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY`를 대체 값으로 사용합니다. 생략하면 TTS는 환경 변수 대체 값을 사용하기 전에 `models.providers.google.apiKey`를 재사용할 수 있습니다.</ParamField>
    <ParamField path="model" type="string">Gemini TTS 모델입니다. 기본값은 `gemini-3.1-flash-tts-preview`입니다.</ParamField>
    <ParamField path="speakerVoice" type="string">Gemini 사전 구성 음성 이름입니다. 기본값은 `Kore`입니다. 레거시 별칭: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">발화 텍스트 앞에 추가되는 자연어 스타일 프롬프트입니다.</ParamField>
    <ParamField path="speakerName" type="string">프롬프트에서 이름이 지정된 화자를 사용하는 경우 발화 텍스트 앞에 추가되는 선택적 화자 레이블입니다.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>활성 페르소나 프롬프트 필드를 결정적 Gemini TTS 프롬프트 구조로 래핑하려면 `audio-profile-v1`로 설정하십시오.</ParamField>
    <ParamField path="personaPrompt" type="string">템플릿의 Director's Notes에 추가되는 Google 전용 추가 페르소나 프롬프트 텍스트입니다.</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com`만 허용됩니다.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">환경 변수: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">`api.gradium.ai`의 HTTPS Gradium API URL입니다. 기본값은 `https://api.gradium.ai`입니다.</ParamField>
    <ParamField path="speakerVoiceId" type="string">기본값은 Emma(`YTpq7expH9539ERJ`)입니다. 레거시 별칭: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld 기본 제공자

    <ParamField path="apiKey" type="string">환경 변수: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.inworld.ai`입니다.</ParamField>
    <ParamField path="modelId" type="string">기본값은 `inworld-tts-1.5-max`입니다. 다음도 지원합니다: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">기본값은 `Sarah`입니다. 레거시 별칭: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">샘플링 온도는 `0..2`이며 0은 제외됩니다.</ParamField>

  </Accordion>

  <Accordion title="로컬 CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS에 사용할 로컬 실행 파일 또는 명령 문자열입니다.</ParamField>
    <ParamField path="args" type="string[]">명령 인수입니다. `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` 자리표시자를 지원합니다.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>예상되는 CLI 출력 형식입니다. 오디오 첨부 파일의 기본값은 `mp3`입니다.</ParamField>
    <ParamField path="timeoutMs" type="number">명령 제한 시간(밀리초)입니다. 기본값은 `120000`입니다.</ParamField>
    <ParamField path="cwd" type="string">선택적 명령 작업 디렉터리입니다.</ParamField>
    <ParamField path="env" type="Record<string, string>">명령에 적용할 선택적 환경 변수 재정의입니다.</ParamField>

    명령의 표준 출력과 생성 또는 변환된 오디오는 50 MiB로 제한됩니다. 진단용 표준 오류는 1 MiB로 제한됩니다. 어느 한도든 초과하면 OpenClaw가 명령을 종료하고 합성을 실패 처리합니다.

  </Accordion>

  <Accordion title="Microsoft(API 키 불필요)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft 음성 사용을 허용합니다.</ParamField>
    <ParamField path="speakerVoice" type="string">Microsoft 신경망 음성 이름입니다(예: `en-US-MichelleNeural`). 레거시 별칭: `voice`. 기본 영어 음성이 적용 중이고 응답 텍스트에서 CJK 문자가 대부분을 차지하면 OpenClaw가 자동으로 `zh-CN-XiaoxiaoNeural`로 전환합니다.</ParamField>
    <ParamField path="lang" type="string">언어 코드입니다(예: `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 출력 형식입니다. 기본값은 `audio-24khz-48kbitrate-mono-mp3`입니다. 번들로 제공되는 Edge 기반 전송 계층에서는 일부 형식이 지원되지 않습니다.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">백분율 문자열입니다(예: `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">오디오 파일과 함께 JSON 자막을 기록합니다.</ParamField>
    <ParamField path="proxy" type="string">Microsoft 음성 요청에 사용할 프록시 URL입니다.</ParamField>
    <ParamField path="timeoutMs" type="number">요청 제한 시간 재정의 값(ms)입니다.</ParamField>
    <ParamField path="edge.*" type="object" deprecated>레거시 별칭입니다. `openclaw doctor --fix`를 실행하여 저장된 구성을 `providers.microsoft`로 다시 작성하십시오.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">설정되지 않은 경우 `MINIMAX_API_KEY`를 사용합니다. Token Plan 인증에는 `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` 또는 `MINIMAX_CODING_API_KEY`를 사용합니다.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.minimax.io`입니다. 환경 변수: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">기본값은 `speech-2.8-hd`입니다. 환경 변수: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">기본값은 `English_expressive_narrator`입니다. 환경 변수: `MINIMAX_TTS_VOICE_ID`. 레거시 별칭: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. 기본값은 `1.0`입니다.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. 기본값은 `1.0`입니다.</ParamField>
    <ParamField path="pitch" type="number">정수 `-12..12`. 기본값은 `0`입니다. 소수 값은 요청 전에 버림 처리됩니다.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">설정되지 않은 경우 `OPENAI_API_KEY`를 사용합니다.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 모델 ID입니다. 기본값은 `gpt-4o-mini-tts`입니다.</ParamField>
    <ParamField path="speakerVoice" type="string">음성 이름입니다(예: `alloy`, `cedar`). 기본값은 `coral`입니다. 레거시 별칭: `voice`.</ParamField>
    <ParamField path="instructions" type="string">명시적인 OpenAI `instructions` 필드입니다. 설정하면 페르소나 프롬프트 필드가 자동으로 매핑되지 **않습니다**.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">생성된 OpenAI TTS 필드 다음에 `/audio/speech` 요청 본문으로 병합되는 추가 JSON 필드입니다. `lang`과 같은 공급자별 키가 필요한 Kokoro 등의 OpenAI 호환 엔드포인트에 사용하십시오. 안전하지 않은 프로토타입 키는 무시됩니다.</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS 엔드포인트를 재정의합니다. 확인 순서: 구성 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. 기본값이 아닌 값은 OpenAI 호환 TTS 엔드포인트로 취급되므로 사용자 지정 모델 및 음성 이름이 허용되며, `speed`에 대한 `0.25..4.0` 범위 검사가 적용되지 않습니다.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">환경 변수: `OPENROUTER_API_KEY`. `models.providers.openrouter.apiKey`를 재사용할 수 있습니다.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://openrouter.ai/api/v1`입니다. 레거시 `https://openrouter.ai/v1`은 정규화됩니다.</ParamField>
    <ParamField path="model" type="string">기본값은 `hexgrad/kokoro-82m`입니다. 별칭: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">기본값은 `af_alloy`입니다. 레거시 별칭: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>기본값은 `mp3`입니다.</ParamField>
    <ParamField path="speed" type="number">공급자 네이티브 속도 재정의 값입니다.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">환경 변수: `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">기본값은 `seed-tts-1.0`입니다. 환경 변수: `VOLCENGINE_TTS_RESOURCE_ID`. 프로젝트에 TTS 2.0 사용 권한이 있으면 `seed-tts-2.0`을 사용하십시오.</ParamField>
    <ParamField path="appKey" type="string">앱 키 헤더입니다. 기본값은 `aGjiRDfUWi`입니다. 환경 변수: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP 엔드포인트를 재정의합니다. 환경 변수: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">음성 유형입니다. 기본값은 `en_female_anna_mars_bigtts`입니다. 환경 변수: `VOLCENGINE_TTS_VOICE`. 레거시 별칭: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">공급자 네이티브 속도 비율이며 범위는 `0.2..3`입니다.</ParamField>
    <ParamField path="emotion" type="string">공급자 네이티브 감정 태그입니다.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>레거시 Volcengine Speech Console 필드입니다. 환경 변수: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER`(기본값 `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">환경 변수: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.x.ai/v1`입니다. 환경 변수: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">기본값은 `eve`입니다. 인증된 경우 `openclaw infer tts voices --provider xai`가 현재 기본 제공 카탈로그를 가져옵니다. 인증되지 않은 경우에는 오프라인 대체 항목인 `ara`, `eve`, `leo`, `rex`, `sal`을 나열합니다. 계정의 사용자 지정 음성 ID는 기본 제공 목록에 없더라도 전달됩니다. 레거시 별칭: `voiceId`.</ParamField>
    <ParamField path="language" type="string">BCP-47 언어 코드 또는 `auto`입니다. 기본값은 `en`입니다.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>기본값은 `mp3`입니다.</ParamField>
    <ParamField path="speed" type="number">공급자 네이티브 속도 재정의 값이며 범위는 `0.7..1.5`입니다.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">환경 변수: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.xiaomimimo.com/v1`입니다. 환경 변수: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">기본값은 `mimo-v2.5-tts`입니다. 환경 변수: `XIAOMI_TTS_MODEL`. `mimo-v2-tts` 및 `mimo-v2.5-tts-voicedesign`도 지원합니다.</ParamField>
    <ParamField path="speakerVoice" type="string">사전 설정 음성 모델의 기본값은 `mimo_default`입니다. 환경 변수: `XIAOMI_TTS_VOICE`. 레거시 별칭: `voice`. `mimo-v2.5-tts-voicedesign`에는 전송되지 않습니다.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>기본값은 `mp3`입니다. 환경 변수: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">사용자 메시지로 전송되는 선택적 자연어 스타일 지시문이며 음성으로 읽히지 않습니다. `mimo-v2.5-tts-voicedesign`에서는 음성 디자인 프롬프트로 사용되며, 생략하면 OpenClaw가 기본값을 제공합니다.</ParamField>
  </Accordion>
</AccordionGroup>

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고 응답 전달용 오디오 첨부 파일을 반환합니다.
Feishu, Matrix, Telegram 및 WhatsApp에서는 오디오가 파일 첨부가 아닌
음성 메시지로 전달됩니다. 이 경로에서 `ffmpeg`를 사용할 수 있으면 Feishu와
WhatsApp은 Opus가 아닌 TTS 출력을 트랜스코딩할 수 있습니다.

WhatsApp은 Baileys를 통해 오디오를 PTT 음성 메모(`ptt: true`가 설정된 `audio`)로
전송하며, 클라이언트가 음성 메모의 캡션을 일관되게 렌더링하지 않으므로
표시되는 텍스트를 PTT 오디오와 **별도로** 전송합니다.

이 도구는 선택적 `channel` 및 `timeoutMs` 필드를 허용합니다. `timeoutMs`는
호출별 공급자 요청 제한 시간(밀리초)입니다. 호출별 값은
`messages.tts.timeoutMs`를 재정의하며, 구성된 TTS 제한 시간은 Plugin이 작성한
모든 공급자 기본값을 재정의합니다.

## Gateway RPC

| 메서드            | 용도                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | 현재 TTS 상태와 마지막 시도를 확인합니다.     |
| `tts.enable`      | 로컬 자동 환경설정을 `always`로 설정합니다.       |
| `tts.disable`     | 로컬 자동 환경설정을 `off`로 설정합니다.          |
| `tts.convert`     | 일회성 텍스트 → 오디오 변환입니다.                        |
| `tts.setProvider` | 로컬 공급자 환경설정을 설정합니다.               |
| `tts.personas`    | 구성된 페르소나와 활성 페르소나를 나열합니다. |
| `tts.setPersona`  | 로컬 페르소나 환경설정을 설정합니다.                |
| `tts.providers`   | 구성된 공급자와 상태를 나열합니다.        |

## 서비스 링크

- [OpenAI 텍스트 음성 변환 가이드](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API 참조](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 텍스트 음성 변환](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech 공급자](/ko/providers/azure-speech)
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
