---
read_when:
    - 응답용 텍스트 음성 변환 활성화하기
    - TTS provider, 폴백 체인 또는 persona 구성하기
    - '`/tts` 명령어 또는 지시어 사용하기'
sidebarTitle: Text to speech (TTS)
summary: 아웃바운드 응답용 텍스트 음성 변환 — provider, persona, 슬래시 명령어, 채널별 출력
title: 텍스트 음성 변환
x-i18n:
    generated_at: "2026-04-26T11:41:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 199a84fde8f7fd380667a39c448ac8158e0aab071b77be41b87431d10d8b4219
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw는 **13개의 speech provider** 전반에서 아웃바운드 응답을 오디오로 변환할 수 있으며,
Feishu, Matrix, Telegram, WhatsApp에서는 네이티브 음성 메시지로,
그 외 모든 곳에서는 오디오 첨부로, 전화 및 Talk에는 PCM/Ulaw 스트림으로 전달합니다.

## 빠른 시작

<Steps>
  <Step title="provider 선택">
    OpenAI와 ElevenLabs가 가장 안정적인 호스팅 옵션입니다. Microsoft와
    Local CLI는 API 키 없이 작동합니다. 전체 목록은 [provider 매트릭스](#supported-providers)를
    참조하세요.
  </Step>
  <Step title="API 키 설정">
    provider에 맞는 env var를 export하세요(예: `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft와 Local CLI는 키가 필요 없습니다.
  </Step>
  <Step title="config에서 활성화">
    `messages.tts.auto: "always"`와 `messages.tts.provider`를 설정하세요:

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
  <Step title="채팅에서 시도">
    `/tts status`는 현재 상태를 표시합니다. `/tts audio Hello from OpenClaw`는
    일회성 오디오 응답을 전송합니다.
  </Step>
</Steps>

<Note>
자동 TTS는 기본적으로 **꺼져** 있습니다. `messages.tts.provider`가 설정되지 않으면,
OpenClaw는 레지스트리 자동 선택 순서에서 처음 구성된 provider를 선택합니다.
</Note>

## 지원되는 providers

| Provider | 인증 | 참고 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Azure Speech** | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (또는 `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`) | 네이티브 Ogg/Opus 음성 노트 출력 및 전화 지원 |
| **ElevenLabs** | `ELEVENLABS_API_KEY` 또는 `XI_API_KEY` | 음성 복제, 다국어, `seed`를 통한 결정론적 생성 |
| **Google Gemini** | `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY` | Gemini API TTS, `promptTemplate: "audio-profile-v1"`를 통한 persona 인식 |
| **Gradium** | `GRADIUM_API_KEY` | 음성 노트 및 전화 출력 |
| **Inworld** | `INWORLD_API_KEY` | 스트리밍 TTS API, 네이티브 Opus 음성 노트 및 PCM 전화 지원 |
| **Local CLI** | 없음 | 구성된 로컬 TTS 명령 실행 |
| **Microsoft** | 없음 | `node-edge-tts`를 통한 공개 Edge 신경망 TTS. Best-effort, SLA 없음 |
| **MiniMax** | `MINIMAX_API_KEY` (또는 Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) | T2A v2 API. 기본값은 `speech-2.8-hd` |
| **OpenAI** | `OPENAI_API_KEY` | 자동 요약에도 사용되며 persona `instructions` 지원 |
| **OpenRouter** | `OPENROUTER_API_KEY` (`models.providers.openrouter.apiKey` 재사용 가능) | 기본 모델 `hexgrad/kokoro-82m` |
| **Volcengine** | `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY` (레거시 AppID/token: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | BytePlus Seed Speech HTTP API |
| **Vydra** | `VYDRA_API_KEY` | 이미지, 비디오, 음성을 함께 제공하는 shared provider |
| **xAI** | `XAI_API_KEY` | xAI 배치 TTS. 네이티브 Opus 음성 노트는 **지원되지 않음** |
| **Xiaomi MiMo** | `XIAOMI_API_KEY` | Xiaomi chat completions를 통한 MiMo TTS |

여러 provider가 구성된 경우, 선택된 provider가 먼저 사용되고
다른 provider는 폴백 옵션이 됩니다. 자동 요약은 `summaryModel`(또는
`agents.defaults.model.primary`)을 사용하므로, 요약을 계속 활성화한 경우
해당 provider도 인증되어 있어야 합니다.

<Warning>
번들된 **Microsoft** provider는 `node-edge-tts`를 통해 Microsoft Edge의 온라인 neural TTS
서비스를 사용합니다. 공개된 SLA나 quota가 없는 공개 웹 서비스이므로
best-effort로 취급하세요. 레거시 provider id `edge`는
`microsoft`로 정규화되며 `openclaw doctor --fix`가 저장된
config를 다시 씁니다. 새 config에서는 항상 `microsoft`를 사용해야 합니다.
</Warning>

## 구성

TTS config는 `~/.openclaw/openclaw.json`의 `messages.tts` 아래에 있습니다. 프리셋을
선택하고 provider 블록을 조정하세요:

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
          // 선택 사항인 자연어 스타일 프롬프트:
          // audioProfile: "차분한 팟캐스트 진행자 톤으로 말하세요.",
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
  <Tab title="Microsoft (키 없음)">
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

### agent별 음성 재정의

하나의 agent가 다른 provider,
voice, model, persona 또는 자동 TTS 모드를 사용하도록 하려면 `agents.list[].tts`를 사용하세요. agent 블록은
`messages.tts` 위에 deep-merge되므로 provider 자격 증명은 전역 provider config에 둘 수 있습니다:

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

agent별 persona를 고정하려면 provider
config와 함께 `agents.list[].tts.persona`를 설정하세요 — 이 값은 해당 agent에 대해서만 전역 `messages.tts.persona`를 재정의합니다.

자동 응답, `/tts audio`, `/tts status`, 그리고
`tts` agent 도구의 우선순위는 다음과 같습니다:

1. `messages.tts`
2. 활성 `agents.list[].tts`
3. 채널이 `channels.<channel>.tts`를 지원하는 경우 채널 재정의
4. 채널이 `channels.<channel>.accounts.<id>.tts`를 전달하는 경우 계정 재정의
5. 이 호스트의 로컬 `/tts` 환경설정
6. [모델 재정의](#model-driven-directives)가 활성화된 경우 인라인 `[[tts:...]]` 지시어

채널 및 계정 재정의는 `messages.tts`와 동일한 형태를 사용하며
이전 레이어 위에 deep-merge되므로, 공통 provider 자격 증명은
`messages.tts`에 유지한 채 채널 또는 봇 계정에서는 voice, model, persona,
또는 auto 모드만 변경할 수 있습니다:

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

## Personas

**persona**는 provider 전반에 걸쳐 결정론적으로 적용할 수 있는
안정적인 음성 정체성입니다. 특정 provider를 우선하도록 설정할 수 있고, provider 중립적인 프롬프트
의도를 정의할 수 있으며, 음성, 모델, 프롬프트
템플릿, seed, 음성 설정에 대한 provider별 바인딩을 담을 수 있습니다.

### 최소 persona

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

### 전체 persona (provider 중립 프롬프트)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "건조하고 따뜻한 영국식 집사 내레이터.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "뛰어난 영국식 집사. 건조하고, 재치 있으며, 따뜻하고, 매력적이며, 감정 표현이 풍부하고, 결코 평범하지 않음.",
            scene: "늦은 밤의 조용한 서재. 신뢰하는 운영자를 위한 근접 마이크 내레이션.",
            sampleContext: "화자는 개인적인 기술 요청에 대해 간결한 자신감과 건조한 따뜻함으로 답하고 있습니다.",
            style: "세련되고, 절제되어 있으며, 가볍게 유머러스함.",
            accent: "영국 영어.",
            pacing: "짧은 극적인 멈춤이 있는 차분한 속도.",
            constraints: ["구성 값을 소리 내어 읽지 마세요.", "persona를 설명하지 마세요."],
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

### persona 해석

활성 persona는 결정론적으로 선택됩니다:

1. 설정된 경우 `/tts persona <id>` 로컬 환경설정
2. 설정된 경우 `messages.tts.persona`
3. persona 없음

provider 선택은 명시 우선 방식으로 실행됩니다:

1. 직접 재정의(CLI, gateway, Talk, 허용된 TTS 지시어)
2. `/tts provider <id>` 로컬 환경설정
3. 활성 persona의 `provider`
4. `messages.tts.provider`
5. 레지스트리 자동 선택

각 provider 시도에서 OpenClaw는 다음 순서로 구성을 병합합니다:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 신뢰된 요청 재정의
4. 허용된 모델 출력 TTS 지시어 재정의

### provider가 persona 프롬프트를 사용하는 방식

persona 프롬프트 필드(`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`)는 **provider 중립적**입니다. 각 provider가 이를 어떻게
사용할지는 provider가 결정합니다:

<AccordionGroup>
  <Accordion title="Google Gemini">
    유효한 Google provider config가 `promptTemplate: "audio-profile-v1"`
    또는 `personaPrompt`를 설정한 경우에만
    persona 프롬프트 필드를 Gemini TTS 프롬프트 구조로 래핑합니다.
    기존 `audioProfile` 및 `speakerName` 필드는
    여전히 Google 전용 프롬프트 텍스트로 앞에 추가됩니다. `[[tts:text]]` 블록 내부의
    `[whispers]` 또는 `[laughs]`와 같은 인라인 오디오 태그는
    Gemini transcript 내부에 그대로 보존됩니다. OpenClaw는 이 태그를 생성하지 않습니다.
  </Accordion>
  <Accordion title="OpenAI">
    명시적인 OpenAI `instructions`가 구성되지 않은 경우에만
    persona 프롬프트 필드를 요청 `instructions` 필드로 매핑합니다.
    명시적인 `instructions`가 항상 우선합니다.
  </Accordion>
  <Accordion title="기타 providers">
    `personas.<id>.providers.<provider>` 아래의
    provider별 persona 바인딩만 사용합니다. persona 프롬프트 필드는
    provider가 자체 persona-prompt 매핑을 구현하지 않는 한 무시됩니다.
  </Accordion>
</AccordionGroup>

### 폴백 정책

`fallbackPolicy`는 persona에
시도된 provider에 대한 **바인딩이 없을 때**의 동작을 제어합니다:

| 정책 | 동작 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona` | **기본값.** provider 중립 프롬프트 필드는 계속 사용 가능합니다. provider는 이를 사용할 수도 있고 무시할 수도 있습니다. |
| `provider-defaults` | 해당 시도에서는 프롬프트 준비에서 persona가 제외됩니다. provider는 중립 기본값을 사용하며 다른 provider로의 폴백은 계속됩니다. |
| `fail` | `reasonCode: "not_configured"` 및 `personaBinding: "missing"`과 함께 해당 provider 시도를 건너뜁니다. 폴백 provider는 계속 시도됩니다. |

전체 TTS 요청은 **시도된 모든** provider가 건너뛰어지거나
실패한 경우에만 실패합니다.

## 모델 기반 지시어

기본적으로 어시스턴트는 단일 응답에 대해
voice, model 또는 speed를 재정의하는 `[[tts:...]]` 지시어와,
오디오에만 나타나야 하는 표현적 신호를 위한 선택적
`[[tts:text]]...[[/tts:text]]` 블록을 출력할 **수 있습니다**:

```text
여기 있습니다.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](웃음) 그 노래를 한 번 더 읽어주세요.[[/tts:text]]
```

`messages.tts.auto`가 `"tagged"`이면, 오디오를 트리거하려면 **지시어가 필요합니다**.
스트리밍 블록 전송은 지시어가 인접한 블록에 나뉘어 있더라도,
채널이 보기 전에 표시 텍스트에서 지시어를 제거합니다.

`provider=...`는 `modelOverrides.allowProvider: true`가 아닌 한 무시됩니다. 응답이
`provider=...`를 선언하면, 그 지시어의 다른 키는 해당 provider에서만
파싱됩니다. 지원되지 않는 키는 제거되고 TTS
지시어 경고로 보고됩니다.

**사용 가능한 지시어 키:**

- `provider` (등록된 provider id, `allowProvider: true` 필요)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax 볼륨, 0–10)
- `pitch` (MiniMax 정수 pitch, −12 ~ 12, 소수 값은 버림)
- `emotion` (Volcengine emotion 태그)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**모델 재정의를 완전히 비활성화:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**다른 설정은 구성 가능하게 유지하면서 provider 전환 허용:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 슬래시 명령어

단일 명령 `/tts`를 사용합니다. Discord에서는 `/tts`가 Discord 내장 명령이므로
OpenClaw가 `/voice`도 등록합니다 — 텍스트 `/tts ...`는 계속 동작합니다.

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
명령에는 권한이 있는 발신자가 필요하며(allowlist/owner 규칙 적용),
`commands.text` 또는 네이티브 명령 등록이 활성화되어 있어야 합니다.
</Note>

동작 참고:

- `/tts on`은 로컬 TTS 환경설정을 `always`로 기록하고, `/tts off`는 `off`로 기록합니다.
- `/tts chat on|off|default`는 현재 채팅에 대한 세션 범위 자동 TTS 재정의를 기록합니다.
- `/tts persona <id>`는 로컬 persona 환경설정을 기록하고, `/tts persona off`는 이를 지웁니다.
- `/tts latest`는 현재 세션 transcript에서 가장 최근 어시스턴트 응답을 읽어 한 번 오디오로 전송합니다. 중복 음성 전송을 억제하기 위해 해당 응답의 해시만 세션 항목에 저장합니다.
- `/tts audio`는 일회성 오디오 응답을 생성합니다(TTS를 켜지 **않습니다**).
- `limit`과 `summary`는 메인 config가 아니라 **로컬 prefs**에 저장됩니다.
- `/tts status`에는 최근 시도에 대한 폴백 진단이 포함됩니다 — `Fallback: <primary> -> <used>`, `Attempts: ...`, 그리고 시도별 세부 정보(`provider:outcome(reasonCode) latency`)가 표시됩니다.
- TTS가 활성화되어 있으면 `/status`는 활성 TTS 모드와 구성된 provider, model, voice, 정리된 사용자 지정 엔드포인트 메타데이터를 표시합니다.

## 사용자별 환경설정

슬래시 명령은 로컬 재정의를 `prefsPath`에 기록합니다. 기본값은
`~/.openclaw/settings/tts.json`이며, `OPENCLAW_TTS_PREFS` env var
또는 `messages.tts.prefsPath`로 재정의할 수 있습니다.

| 저장 필드 | 효과 |
| ------------ | -------------------------------------------- |
| `auto` | 로컬 자동 TTS 재정의 (`always`, `off`, …) |
| `provider` | 로컬 기본 provider 재정의 |
| `persona` | 로컬 persona 재정의 |
| `maxLength` | 요약 임계값 (기본값 `1500`자) |
| `summarize` | 요약 토글 (기본값 `true`) |

이 값들은 해당 호스트에서 `messages.tts`와 활성
`agents.list[].tts` 블록으로부터 계산된 유효 config를 재정의합니다.

## 출력 형식 (고정)

TTS 음성 전송은 채널 기능에 따라 결정됩니다. 채널 plugins는
음성 스타일 TTS가 provider에 네이티브 `voice-note` 대상을 요청해야 하는지,
아니면 일반 `audio-file` 합성을 유지하면서 호환되는 출력에만 음성
전송 표시를 해야 하는지를 광고합니다.

- **음성 노트 지원 채널**: 음성 노트 응답은 Opus를 우선 사용합니다(ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`).
  - 48kHz / 64kbps는 음성 메시지에 적절한 절충안입니다.
- **Feishu / WhatsApp**: 음성 노트 응답이 MP3/WebM/WAV/M4A
  또는 다른 일반적인 오디오 파일로 생성되면, 채널 plugin이 전송 전에 `ffmpeg`로 이를 48kHz
  Ogg/Opus로 트랜스코딩하여 네이티브 음성 메시지로 보냅니다. WhatsApp은
  결과를 Baileys `audio` payload와 함께 `ptt: true` 및
  `audio/ogg; codecs=opus`로 전송합니다. 변환에 실패하면 Feishu는 원본
  파일을 첨부로 받습니다. WhatsApp은 호환되지 않는 PTT payload를 게시하는 대신
  전송이 실패합니다.
- **BlueBubbles**: provider 합성을 일반 audio-file 경로에서 유지합니다. MP3
  및 CAF 출력은 iMessage 음성 메모 전송용으로 표시됩니다.
- **기타 채널**: MP3(ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`).
  - 44.1kHz / 128kbps는 음성 명료도를 위한 기본 균형입니다.
- **MiniMax**: 일반 오디오 첨부에는 MP3(`speech-2.8-hd` 모델, 32kHz 샘플링 속도)를 사용합니다. 채널이 광고하는 음성 노트 대상의 경우, 채널이 트랜스코딩을 지원하면 OpenClaw가 전송 전에 `ffmpeg`로 MiniMax MP3를 48kHz Opus로 트랜스코딩합니다.
- **Xiaomi MiMo**: 기본적으로 MP3를 사용하며, 구성 시 WAV도 사용할 수 있습니다. 채널이 광고하는 음성 노트 대상의 경우, 채널이 트랜스코딩을 지원하면 OpenClaw가 전송 전에 `ffmpeg`로 Xiaomi 출력을 48kHz Opus로 트랜스코딩합니다.
- **Local CLI**: 구성된 `outputFormat`을 사용합니다. 음성 노트 대상은
  Ogg/Opus로 변환되고 전화 출력은 `ffmpeg`를 사용해 raw 16kHz mono PCM으로
  변환됩니다.
- **Google Gemini**: Gemini API TTS는 raw 24kHz PCM을 반환합니다. OpenClaw는 이를 오디오 첨부용으로 WAV로 래핑하고, 음성 노트 대상에는 48kHz Opus로 트랜스코딩하며, Talk/전화에는 PCM을 직접 반환합니다.
- **Gradium**: 오디오 첨부에는 WAV, 음성 노트 대상에는 Opus, 전화에는 8kHz의 `ulaw_8000`을 사용합니다.
- **Inworld**: 일반 오디오 첨부에는 MP3, 음성 노트 대상에는 네이티브 `OGG_OPUS`, Talk/전화에는 22050Hz의 raw `PCM`을 사용합니다.
- **xAI**: 기본적으로 MP3이며, `responseFormat`은 `mp3`, `wav`, `pcm`, `mulaw`, `alaw`일 수 있습니다. OpenClaw는 xAI의 배치 REST TTS 엔드포인트를 사용하며 완전한 오디오 첨부를 반환합니다. xAI의 스트리밍 TTS WebSocket은 이 provider 경로에서 사용되지 않습니다. 네이티브 Opus 음성 노트 형식은 이 경로에서 지원되지 않습니다.
- **Microsoft**: `microsoft.outputFormat`을 사용합니다(기본값 `audio-24khz-48kbitrate-mono-mp3`).
  - 번들된 전송 계층은 `outputFormat`을 허용하지만, 모든 형식을 서비스에서 사용할 수 있는 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech 출력 형식을 따릅니다(Ogg/WebM Opus 포함).
  - Telegram `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요.
  - 구성된 Microsoft 출력 형식이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 출력 형식은 채널별로 고정되어 있습니다(위 참조).

## 자동 TTS 동작

`messages.tts.auto`가 활성화되면 OpenClaw는 다음과 같이 동작합니다:

- 응답에 이미 미디어 또는 `MEDIA:` 지시어가 포함되어 있으면 TTS를 건너뜁니다.
- 매우 짧은 응답(10자 미만)은 건너뜁니다.
- 요약이 활성화되어 있으면 긴 응답을
  `summaryModel`(또는 `agents.defaults.model.primary`)을 사용해 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.
- `mode: "final"`에서는 텍스트 스트림이 완료된 후에도 스트리밍된 최종 응답에 대해 오디오 전용 TTS를 계속 전송합니다. 생성된 미디어는 일반 응답 첨부와 동일한 채널 미디어 정규화를 거칩니다.

응답이 `maxLength`를 초과하고 요약이 꺼져 있거나(또는
요약 모델에 대한 API 키가 없으면), 오디오는 건너뛰고 일반 텍스트 응답을 전송합니다.

```text
응답 -> TTS 활성화?
  아니요  -> 텍스트 전송
  예      -> 미디어 / MEDIA: / 짧은 응답?
              예   -> 텍스트 전송
              아니요 -> 길이 > 제한?
                         아니요 -> TTS -> 오디오 첨부
                         예    -> 요약 활성화?
                                   아니요 -> 텍스트 전송
                                   예    -> 요약 -> TTS -> 오디오 첨부
```

## 채널별 출력 형식

| 대상 | 형식 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 음성 노트 응답은 **Opus**를 우선 사용합니다(ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`). 48kHz / 64kbps는 명료도와 크기의 균형을 맞춥니다. |
| 기타 채널 | **MP3**(ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`). 44.1kHz / 128kbps는 음성을 위한 기본값입니다. |
| Talk / 전화 | provider 네이티브 **PCM**(Inworld 22050Hz, Google 24kHz) 또는 전화용 Gradium의 `ulaw_8000` |

provider별 참고 사항:

- **Feishu / WhatsApp 트랜스코딩:** 음성 노트 응답이 MP3/WebM/WAV/M4A로 도착하면, 채널 plugin이 `ffmpeg`로 이를 48kHz Ogg/Opus로 트랜스코딩합니다. WhatsApp은 이를 Baileys를 통해 `ptt: true` 및 `audio/ogg; codecs=opus`와 함께 전송합니다. 변환 실패 시: Feishu는 원본 파일을 첨부하는 방식으로 폴백하고, WhatsApp은 호환되지 않는 PTT payload를 게시하는 대신 전송이 실패합니다.
- **MiniMax / Xiaomi MiMo:** 기본값은 MP3(MiniMax `speech-2.8-hd`의 경우 32kHz)이며, 음성 노트 대상에는 `ffmpeg`를 통해 48kHz Opus로 트랜스코딩됩니다.
- **Local CLI:** 구성된 `outputFormat`을 사용합니다. 음성 노트 대상은 Ogg/Opus로, 전화 출력은 raw 16kHz mono PCM으로 변환됩니다.
- **Google Gemini:** raw 24kHz PCM을 반환합니다. OpenClaw는 첨부용으로 WAV로 래핑하고, 음성 노트 대상에는 48kHz Opus로 트랜스코딩하며, Talk/전화에는 PCM을 직접 반환합니다.
- **Inworld:** MP3 첨부, 네이티브 `OGG_OPUS` 음성 노트, Talk/전화용 raw `PCM` 22050Hz.
- **xAI:** 기본값은 MP3이며, `responseFormat`은 `mp3|wav|pcm|mulaw|alaw`일 수 있습니다. xAI의 배치 REST 엔드포인트를 사용하며 스트리밍 WebSocket TTS는 **사용하지 않습니다**. 네이티브 Opus 음성 노트 형식은 **지원되지 않습니다**.
- **Microsoft:** `microsoft.outputFormat`을 사용합니다(기본값 `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요. 구성된 Microsoft 형식이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI와 ElevenLabs 출력 형식은 위에 나열된 대로 채널별로 고정됩니다.

## 필드 참조

<AccordionGroup>
  <Accordion title="최상위 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      자동 TTS 모드입니다. `inbound`는 인바운드 음성 메시지 이후에만 오디오를 전송하고, `tagged`는 응답에 `[[tts:...]]` 지시어 또는 `[[tts:text]]` 블록이 포함된 경우에만 오디오를 전송합니다.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      레거시 토글입니다. `openclaw doctor --fix`가 이를 `auto`로 마이그레이션합니다.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"`은 최종 응답 외에 도구/블록 응답도 포함합니다.
    </ParamField>
    <ParamField path="provider" type="string">
      speech provider id입니다. 설정되지 않으면 OpenClaw는 레지스트리 자동 선택 순서에서 첫 번째로 구성된 provider를 사용합니다. 레거시 `provider: "edge"`는 `openclaw doctor --fix`에 의해 `"microsoft"`로 다시 작성됩니다.
    </ParamField>
    <ParamField path="persona" type="string">
      `personas`의 활성 persona id입니다. 소문자로 정규화됩니다.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      안정적인 음성 정체성입니다. 필드: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. [Personas](#personas)를 참조하세요.
    </ParamField>
    <ParamField path="summaryModel" type="string">
      자동 요약용 저비용 모델입니다. 기본값은 `agents.defaults.model.primary`입니다. `provider/model` 또는 구성된 모델 별칭을 허용합니다.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      모델이 TTS 지시어를 출력하도록 허용합니다. `enabled`의 기본값은 `true`, `allowProvider`의 기본값은 `false`입니다.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      speech provider id를 키로 사용하는 provider 소유 설정입니다. 레거시 직접 블록(`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`)은 `openclaw doctor --fix`에 의해 다시 작성됩니다. `messages.tts.providers.<id>`만 커밋하세요.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 입력 문자 수의 하드 상한입니다. 초과하면 `/tts audio`는 실패합니다.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      요청 타임아웃(밀리초)입니다.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      로컬 prefs JSON 경로(provider/limit/summary)를 재정의합니다. 기본값은 `~/.openclaw/settings/tts.json`입니다.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, 또는 `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Azure Speech 리전(예: `eastus`). env: `AZURE_SPEECH_REGION` 또는 `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">선택 사항인 Azure Speech 엔드포인트 재정의입니다(별칭 `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">Azure 음성 ShortName입니다. 기본값은 `en-US-JennyNeural`입니다.</ParamField>
    <ParamField path="lang" type="string">SSML 언어 코드입니다. 기본값은 `en-US`입니다.</ParamField>
    <ParamField path="outputFormat" type="string">표준 오디오용 Azure `X-Microsoft-OutputFormat`입니다. 기본값은 `audio-24khz-48kbitrate-mono-mp3`입니다.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">음성 노트 출력용 Azure `X-Microsoft-OutputFormat`입니다. 기본값은 `ogg-24khz-16bit-mono-opus`입니다.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">`ELEVENLABS_API_KEY` 또는 `XI_API_KEY`로 폴백합니다.</ParamField>
    <ParamField path="model" type="string">모델 id입니다(예: `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 음성 id입니다.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style`(각각 `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = 보통 속도).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>텍스트 정규화 모드입니다.</ParamField>
    <ParamField path="languageCode" type="string">2자리 ISO 639-1(예: `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">best-effort 결정성을 위한 정수 `0..4294967295`입니다.</ParamField>
    <ParamField path="baseUrl" type="string">ElevenLabs API base URL을 재정의합니다.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">`GEMINI_API_KEY` / `GOOGLE_API_KEY`로 폴백합니다. 생략하면 env 폴백 전에 TTS가 `models.providers.google.apiKey`를 재사용할 수 있습니다.</ParamField>
    <ParamField path="model" type="string">Gemini TTS 모델입니다. 기본값은 `gemini-3.1-flash-tts-preview`입니다.</ParamField>
    <ParamField path="voiceName" type="string">Gemini 사전 빌드 음성 이름입니다. 기본값은 `Kore`입니다. 별칭: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">발화 텍스트 앞에 추가되는 자연어 스타일 프롬프트입니다.</ParamField>
    <ParamField path="speakerName" type="string">프롬프트에서 이름 있는 화자를 사용할 때, 발화 텍스트 앞에 추가되는 선택 사항의 화자 레이블입니다.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>활성 persona 프롬프트 필드를 결정론적인 Gemini TTS 프롬프트 구조로 래핑하려면 `audio-profile-v1`로 설정하세요.</ParamField>
    <ParamField path="personaPrompt" type="string">템플릿의 Director's Notes 뒤에 추가되는 Google 전용 추가 persona 프롬프트 텍스트입니다.</ParamField>
    <ParamField path="baseUrl" type="string">`https://generativelanguage.googleapis.com`만 허용됩니다.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">기본값 Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값 `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">기본값 `inworld-tts-1.5-max`. 추가 지원: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">기본값 `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">샘플링 temperature `0..2`.</ParamField>
  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">CLI TTS용 로컬 실행 파일 또는 명령 문자열입니다.</ParamField>
    <ParamField path="args" type="string[]">명령 인수입니다. `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` 플레이스홀더를 지원합니다.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>예상 CLI 출력 형식입니다. 오디오 첨부의 기본값은 `mp3`입니다.</ParamField>
    <ParamField path="timeoutMs" type="number">명령 타임아웃(밀리초)입니다. 기본값은 `120000`입니다.</ParamField>
    <ParamField path="cwd" type="string">선택 사항인 명령 작업 디렉터리입니다.</ParamField>
    <ParamField path="env" type="Record<string, string>">선택 사항인 명령 환경 변수 재정의입니다.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (API 키 없음)">
    <ParamField path="enabled" type="boolean" default="true">Microsoft speech 사용을 허용합니다.</ParamField>
    <ParamField path="voice" type="string">Microsoft neural voice 이름입니다(예: `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">언어 코드입니다(예: `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 출력 형식입니다. 기본값은 `audio-24khz-48kbitrate-mono-mp3`입니다. 번들된 Edge 기반 전송은 모든 형식을 지원하지는 않습니다.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">퍼센트 문자열입니다(예: `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">오디오 파일과 함께 JSON 자막을 기록합니다.</ParamField>
    <ParamField path="proxy" type="string">Microsoft speech 요청용 프록시 URL입니다.</ParamField>
    <ParamField path="timeoutMs" type="number">요청 타임아웃 재정의(ms)입니다.</ParamField>
    <ParamField path="edge.*" type="object" deprecated>레거시 별칭입니다. 저장된 config를 `providers.microsoft`로 다시 쓰려면 `openclaw doctor --fix`를 실행하세요.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">`MINIMAX_API_KEY`로 폴백합니다. Token Plan 인증은 `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, 또는 `MINIMAX_CODING_API_KEY`를 통해 수행합니다.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.minimax.io`입니다. env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">기본값은 `speech-2.8-hd`입니다. env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">기본값은 `English_expressive_narrator`입니다. env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. 기본값은 `1.0`입니다.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. 기본값은 `1.0`입니다.</ParamField>
    <ParamField path="pitch" type="number">정수 `-12..12`. 기본값은 `0`입니다. 소수 값은 요청 전에 버려집니다.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">`OPENAI_API_KEY`로 폴백합니다.</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 모델 id입니다(예: `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">voice 이름입니다(예: `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">명시적인 OpenAI `instructions` 필드입니다. 설정되면 persona 프롬프트 필드는 **자동 매핑되지 않습니다**.</ParamField>
    <ParamField path="baseUrl" type="string">
      OpenAI TTS 엔드포인트를 재정의합니다. 해석 순서: config → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. 기본값이 아닌 값은 OpenAI 호환 TTS 엔드포인트로 처리되므로, 사용자 지정 모델 및 voice 이름이 허용됩니다.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">env: `OPENROUTER_API_KEY`. `models.providers.openrouter.apiKey`를 재사용할 수 있습니다.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://openrouter.ai/api/v1`입니다. 레거시 `https://openrouter.ai/v1`은 정규화됩니다.</ParamField>
    <ParamField path="model" type="string">기본값은 `hexgrad/kokoro-82m`입니다. 별칭: `modelId`.</ParamField>
    <ParamField path="voice" type="string">기본값은 `af_alloy`입니다. 별칭: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>기본값은 `mp3`입니다.</ParamField>
    <ParamField path="speed" type="number">provider 네이티브 speed 재정의입니다.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">env: `VOLCENGINE_TTS_API_KEY` 또는 `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">기본값은 `seed-tts-1.0`입니다. env: `VOLCENGINE_TTS_RESOURCE_ID`. 프로젝트에 TTS 2.0 entitlement가 있으면 `seed-tts-2.0`을 사용하세요.</ParamField>
    <ParamField path="appKey" type="string">App key 헤더입니다. 기본값은 `aGjiRDfUWi`입니다. env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Seed Speech TTS HTTP 엔드포인트를 재정의합니다. env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">voice 유형입니다. 기본값은 `en_female_anna_mars_bigtts`입니다. env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">provider 네이티브 speed 비율입니다.</ParamField>
    <ParamField path="emotion" type="string">provider 네이티브 emotion 태그입니다.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>레거시 Volcengine Speech Console 필드입니다. env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (기본값 `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.x.ai/v1`입니다. env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">기본값은 `eve`입니다. 라이브 voice: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">BCP-47 언어 코드 또는 `auto`입니다. 기본값은 `en`입니다.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>기본값은 `mp3`입니다.</ParamField>
    <ParamField path="speed" type="number">provider 네이티브 speed 재정의입니다.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">기본값은 `https://api.xiaomimimo.com/v1`입니다. env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">기본값은 `mimo-v2.5-tts`입니다. env: `XIAOMI_TTS_MODEL`. `mimo-v2-tts`도 지원합니다.</ParamField>
    <ParamField path="voice" type="string">기본값은 `mimo_default`입니다. env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>기본값은 `mp3`입니다. env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">선택 사항인 자연어 스타일 지시어입니다. 사용자 메시지로 전송되며 발화되지는 않습니다.</ParamField>
  </Accordion>
</AccordionGroup>

## Agent 도구

`tts` 도구는 텍스트를 음성으로 변환하고 응답 전송을 위한 오디오 첨부를 반환합니다. Feishu, Matrix, Telegram, WhatsApp에서는
오디오가 파일 첨부가 아니라 음성 메시지로 전송됩니다. Feishu와
WhatsApp은 `ffmpeg`를 사용할 수 있을 때 이 경로에서 Opus가 아닌 TTS 출력을
트랜스코딩할 수 있습니다.

WhatsApp은 오디오를 Baileys를 통해 PTT 음성 노트(`audio`와
`ptt: true`)로 전송하며, 클라이언트가 음성 노트의 캡션을 일관되게 렌더링하지 않기 때문에
보이는 텍스트는 PTT 오디오와 **별도로** 전송합니다.

이 도구는 선택 사항인 `channel` 및 `timeoutMs` 필드를 받습니다. `timeoutMs`는
호출별 provider 요청 타임아웃(밀리초)입니다.

## Gateway RPC

| 메서드 | 목적 |
| ----------------- | ---------------------------------------- |
| `tts.status` | 현재 TTS 상태와 마지막 시도를 읽습니다. |
| `tts.enable` | 로컬 자동 환경설정을 `always`로 설정합니다. |
| `tts.disable` | 로컬 자동 환경설정을 `off`로 설정합니다. |
| `tts.convert` | 일회성 텍스트 → 오디오 변환입니다. |
| `tts.setProvider` | 로컬 provider 환경설정을 설정합니다. |
| `tts.setPersona` | 로컬 persona 환경설정을 설정합니다. |
| `tts.providers` | 구성된 providers와 상태를 나열합니다. |

## 서비스 링크

- [OpenAI text-to-speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech provider](/ko/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ko/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/ko/providers/volcengine#text-to-speech)
- [Xiaomi MiMo speech synthesis](/ko/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI text to speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 관련 항목

- [미디어 개요](/ko/tools/media-overview)
- [음악 생성](/ko/tools/music-generation)
- [동영상 생성](/ko/tools/video-generation)
- [슬래시 명령어](/ko/tools/slash-commands)
- [Voice Call plugin](/ko/plugins/voice-call)
