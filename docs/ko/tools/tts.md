---
read_when:
    - 응답에 text-to-speech 활성화하기
    - TTS provider 또는 제한 구성하기
    - '`/tts` 명령 사용하기'
summary: 아웃바운드 응답용 text-to-speech (TTS)
title: Text-to-speech
x-i18n:
    generated_at: "2026-04-25T06:13:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42faea3996a8a1e88ee09f597808b054fd86fc0935e7f5f781386d2e85da7508
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw는 ElevenLabs, Google Gemini, Gradium, Microsoft, MiniMax, OpenAI, Vydra 또는 xAI를 사용해 아웃바운드 응답을 오디오로 변환할 수 있습니다.
OpenClaw가 오디오를 보낼 수 있는 곳이라면 어디서나 동작합니다.

## 지원되는 서비스

- **ElevenLabs** (기본 또는 fallback provider)
- **Google Gemini** (기본 또는 fallback provider; Gemini API TTS 사용)
- **Gradium** (기본 또는 fallback provider; 음성 메모 및 전화 출력 지원)
- **Microsoft** (기본 또는 fallback provider; 현재 번들 구현은 `node-edge-tts` 사용)
- **MiniMax** (기본 또는 fallback provider; T2A v2 API 사용)
- **OpenAI** (기본 또는 fallback provider; 요약에도 사용)
- **Vydra** (기본 또는 fallback provider; 공유 이미지, 비디오, 음성 provider)
- **xAI** (기본 또는 fallback provider; xAI TTS API 사용)

### Microsoft 음성 참고

번들된 Microsoft 음성 provider는 현재 Microsoft Edge의 온라인
neural TTS 서비스를 `node-edge-tts` 라이브러리를 통해 사용합니다. 이는 호스팅된 서비스이며(로컬 아님),
Microsoft 엔드포인트를 사용하고 API key가 필요하지 않습니다.
`node-edge-tts`는 음성 구성 옵션과 출력 형식을 노출하지만,
모든 옵션이 서비스에서 지원되는 것은 아닙니다. `edge`를 사용하는 레거시 config 및 directive 입력도
여전히 동작하며 `microsoft`로 정규화됩니다.

이 경로는 공개 웹 서비스이며 공개된 SLA 또는 quota가 없으므로,
best-effort로 취급하세요. 보장된 제한과 지원이 필요하다면 OpenAI
또는 ElevenLabs를 사용하세요.

## 선택적 키

OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra 또는 xAI를 사용하려면:

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `GEMINI_API_KEY` (또는 `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`

Microsoft 음성은 API key가 **필요하지 않습니다**.

여러 provider가 구성된 경우, 선택된 provider가 먼저 사용되고 나머지는 fallback 옵션이 됩니다.
자동 요약은 구성된 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용하므로,
요약을 활성화하면 해당 provider도 인증되어 있어야 합니다.

## 서비스 링크

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ko/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 기본적으로 활성화되어 있나요?

아니요. 자동 TTS는 기본적으로 **꺼져 있습니다**. config에서
`messages.tts.auto`로 또는 로컬에서 `/tts on`으로 활성화하세요.

`messages.tts.provider`가 설정되지 않으면 OpenClaw는
registry 자동 선택 순서에서 첫 번째로 구성된 음성 provider를 선택합니다.

## 구성

TTS 구성은 `openclaw.json`의 `messages.tts` 아래에 있습니다.
전체 schema는 [Gateway configuration](/ko/gateway/configuration)에 있습니다.

### 최소 구성(활성화 + provider)

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

### OpenAI 기본 + ElevenLabs fallback

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft 기본(API key 없음)

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
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### MiniMax 기본

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
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

### Google Gemini 기본

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "gemini_api_key",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
        },
      },
    },
  },
}
```

Google Gemini TTS는 Gemini API key 경로를 사용합니다. Gemini API로 제한된 Google Cloud Console API key도
여기에서 유효하며, 번들된 Google 이미지 생성 provider가
사용하는 것과 같은 스타일의 key입니다. 해석 순서는
`messages.tts.providers.google.apiKey` -> `models.providers.google.apiKey` ->
`GEMINI_API_KEY` -> `GOOGLE_API_KEY`입니다.

### xAI 기본

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "xai_api_key",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
          speed: 1.0,
        },
      },
    },
  },
}
```

xAI TTS는 번들된 Grok 모델 provider와 동일한 `XAI_API_KEY` 경로를 사용합니다.
해석 순서는 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`입니다.
현재 라이브 음성은 `ara`, `eve`, `leo`, `rex`, `sal`, `una`이며, 기본값은 `eve`입니다.
`language`는 BCP-47 태그 또는 `auto`를 받습니다.

### OpenRouter 기본

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "openrouter_api_key",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

OpenRouter TTS는 번들된
OpenRouter 모델 provider와 동일한 `OPENROUTER_API_KEY` 경로를 사용합니다. 해석 순서는
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`입니다.

### Gradium 기본

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "gradium_api_key",
          baseUrl: "https://api.gradium.ai",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```

### Microsoft 음성 비활성화

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### 커스텀 제한 + prefs 경로

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 인바운드 음성 메시지 이후에만 오디오로 응답

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 긴 응답의 자동 요약 비활성화

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

그런 다음 다음을 실행하세요:

```
/tts summary off
```

### 필드 참고

- `auto`: 자동 TTS 모드 (`off`, `always`, `inbound`, `tagged`).
  - `inbound`는 인바운드 음성 메시지 이후에만 오디오를 전송합니다.
  - `tagged`는 응답에 `[[tts:key=value]]` 지시어 또는 `[[tts:text]]...[[/tts:text]]` 블록이 포함될 때만 오디오를 전송합니다.
- `enabled`: 레거시 토글 (`doctor`가 이를 `auto`로 마이그레이션함).
- `mode`: `"final"`(기본값) 또는 `"all"`(tool/block 응답 포함).
- `provider`: `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"` 같은 음성 provider id (fallback은 자동).
- `provider`가 **설정되지 않으면**, OpenClaw는 registry 자동 선택 순서에서 첫 번째로 구성된 음성 provider를 사용합니다.
- 레거시 `provider: "edge"` config는 `openclaw doctor --fix`로 복구되어
  `provider: "microsoft"`로 다시 작성됩니다.
- `summaryModel`: 자동 요약용 선택적 저비용 모델; 기본값은 `agents.defaults.model.primary`.
  - `provider/model` 또는 구성된 모델 별칭을 받을 수 있습니다.
- `modelOverrides`: 모델이 TTS 지시어를 내보내도록 허용(기본값은 켜짐).
  - `allowProvider` 기본값은 `false`입니다(provider 전환은 옵트인).
- `providers.<id>`: 음성 provider id를 키로 하는 provider 소유 설정.
- 레거시 직접 provider 블록(`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`)은 `openclaw doctor --fix`로 복구되며, 저장되는 config는 `messages.tts.providers.<id>`를 사용해야 합니다.
- 레거시 `messages.tts.providers.edge`도 `openclaw doctor --fix`로 복구되며, 저장되는 config는 `messages.tts.providers.microsoft`를 사용해야 합니다.
- `maxTextLength`: TTS 입력의 하드 제한(문자 수). 초과하면 `/tts audio`가 실패합니다.
- `timeoutMs`: 요청 timeout(ms).
- `prefsPath`: 로컬 prefs JSON 경로 override(provider/limit/summary).
- `apiKey` 값은 env var로 fallback됩니다(`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL override.
- `providers.openai.baseUrl`: OpenAI TTS 엔드포인트 override.
  - 해석 순서: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 기본값이 아닌 값은 OpenAI 호환 TTS 엔드포인트로 취급되므로 커스텀 모델과 음성 이름을 사용할 수 있습니다.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = 기본)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2자리 ISO 639-1 (예: `en`, `de`)
- `providers.elevenlabs.seed`: 정수 `0..4294967295` (best-effort 결정성)
- `providers.minimax.baseUrl`: MiniMax API base URL override (기본값 `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS 모델 (기본값 `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: 음성 식별자 (기본값 `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: 재생 속도 `0.5..2.0` (기본값 1.0).
- `providers.minimax.vol`: 볼륨 `(0, 10]` (기본값 1.0; 0보다 커야 함).
- `providers.minimax.pitch`: 정수 피치 이동 `-12..12` (기본값 0). MiniMax T2A API가 정수가 아닌 피치 값을 거부하므로, 소수 값은 MiniMax T2A 호출 전에 잘립니다.
- `providers.google.model`: Gemini TTS 모델 (기본값 `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Gemini 사전 정의 음성 이름 (기본값 `Kore`; `voice`도 허용됨).
- `providers.google.audioProfile`: 말해질 텍스트 앞에 붙는 자연어 스타일 프롬프트.
- `providers.google.speakerName`: TTS 프롬프트가 이름 있는 화자를 사용할 때 말해질 텍스트 앞에 붙는 선택적 화자 레이블.
- `providers.google.baseUrl`: Gemini API base URL override. `https://generativelanguage.googleapis.com`만 허용됩니다.
  - `messages.tts.providers.google.apiKey`가 생략되면, TTS는 env fallback 전에 `models.providers.google.apiKey`를 재사용할 수 있습니다.
- `providers.gradium.baseUrl`: Gradium API base URL override (기본값 `https://api.gradium.ai`).
- `providers.gradium.voiceId`: Gradium 음성 식별자 (기본값 Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: xAI TTS API key (env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: xAI TTS base URL override (기본값 `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI 음성 id (기본값 `eve`; 현재 라이브 음성: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47 언어 코드 또는 `auto` (기본값 `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, 또는 `alaw` (기본값 `mp3`).
- `providers.xai.speed`: provider 네이티브 속도 override.
- `providers.openrouter.apiKey`: OpenRouter API key (env: `OPENROUTER_API_KEY`; `models.providers.openrouter.apiKey`도 재사용 가능).
- `providers.openrouter.baseUrl`: OpenRouter TTS base URL override (기본값 `https://openrouter.ai/api/v1`; 레거시 `https://openrouter.ai/v1`는 정규화됨).
- `providers.openrouter.model`: OpenRouter TTS 모델 id (기본값 `hexgrad/kokoro-82m`; `modelId`도 허용됨).
- `providers.openrouter.voice`: provider 전용 음성 id (기본값 `af_alloy`; `voiceId`도 허용됨).
- `providers.openrouter.responseFormat`: `mp3` 또는 `pcm` (기본값 `mp3`).
- `providers.openrouter.speed`: provider 네이티브 속도 override.
- `providers.microsoft.enabled`: Microsoft 음성 사용 허용 (기본값 `true`; API key 없음).
- `providers.microsoft.voice`: Microsoft neural 음성 이름 (예: `en-US-MichelleNeural`).
- `providers.microsoft.lang`: 언어 코드 (예: `en-US`).
- `providers.microsoft.outputFormat`: Microsoft 출력 형식 (예: `audio-24khz-48kbitrate-mono-mp3`).
  - 유효한 값은 Microsoft Speech output formats를 참조하세요. 번들된 Edge 기반 전송에서 모든 형식이 지원되는 것은 아닙니다.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: 퍼센트 문자열 (예: `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: 오디오 파일과 함께 JSON 자막 작성.
- `providers.microsoft.proxy`: Microsoft 음성 요청용 proxy URL.
- `providers.microsoft.timeoutMs`: 요청 timeout override (ms).
- `edge.*`: 동일한 Microsoft 설정의 레거시 별칭. 저장된 config를 `providers.microsoft`로 다시 작성하려면
  `openclaw doctor --fix`를 실행하세요.

## 모델 기반 override (기본적으로 켜짐)

기본적으로 모델은 단일 응답에 대해 TTS 지시어를 **낼 수 있습니다**.
`messages.tts.auto`가 `tagged`일 때는 오디오를 트리거하려면 이 지시어가 필요합니다.

활성화되면 모델은 단일 응답의 음성을 override하기 위해 `[[tts:...]]` 지시어를 낼 수 있으며,
오디오에만 나타나야 하는 표현 태그(웃음, 노래 힌트 등)를
제공하기 위한 선택적 `[[tts:text]]...[[/tts:text]]` 블록도 사용할 수 있습니다.

`provider=...` 지시어는 `modelOverrides.allowProvider: true`가 아니면 무시됩니다.

응답 payload 예시:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

사용 가능한 지시어 키(활성화된 경우):

- `provider` (등록된 음성 provider id, 예: `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, 또는 `xai`; `allowProvider: true` 필요)
- `voice` (OpenAI 또는 Gradium 음성), `voiceName` / `voice_name` / `google_voice` (Google 음성), 또는 `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (OpenAI TTS 모델, ElevenLabs 모델 id, 또는 MiniMax 모델) 또는 `google_model` (Google TTS 모델)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax 볼륨, 0-10)
- `pitch` (MiniMax 정수 피치, -12에서 12; 소수 값은 MiniMax 요청 전에 잘림)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

모든 모델 override 비활성화:

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

선택적 allowlist(provider 전환을 허용하면서 다른 제어 항목은 계속 구성 가능하게 유지):

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## 사용자별 환경설정

슬래시 명령은 로컬 override를 `prefsPath`에 기록합니다(기본값:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` 또는
`messages.tts.prefsPath`로 override 가능).

저장되는 필드:

- `enabled`
- `provider`
- `maxLength` (요약 임계값; 기본값 1500자)
- `summarize` (기본값 `true`)

이 값들은 해당 호스트에서 `messages.tts.*`를 override합니다.

## 출력 형식 (고정)

- **Feishu / Matrix / Telegram / WhatsApp**: Opus 음성 메시지 (ElevenLabs는 `opus_48000_64`, OpenAI는 `opus`).
  - 48kHz / 64kbps는 음성 메시지에 적절한 절충안입니다.
- **기타 채널**: MP3 (ElevenLabs는 `mp3_44100_128`, OpenAI는 `mp3`).
  - 44.1kHz / 128kbps는 음성 명료도를 위한 기본 균형값입니다.
- **MiniMax**: 일반 오디오 첨부 파일에는 MP3 (`speech-2.8-hd` 모델, 32kHz 샘플 레이트). Feishu 및 Telegram 같은 음성 메모 대상의 경우, OpenClaw는 전달 전에 `ffmpeg`로 MiniMax MP3를 48kHz Opus로 트랜스코딩합니다.
- **Google Gemini**: Gemini API TTS는 raw 24kHz PCM을 반환합니다. OpenClaw는 이를 오디오 첨부용으로는 WAV로 감싸고, Talk/전화용으로는 PCM을 직접 반환합니다. 네이티브 Opus 음성 메모 형식은 이 경로에서 지원되지 않습니다.
- **Gradium**: 오디오 첨부에는 WAV, 음성 메모 대상에는 Opus, 전화용에는 8 kHz의 `ulaw_8000`.
- **xAI**: 기본적으로 MP3이며, `responseFormat`은 `mp3`, `wav`, `pcm`, `mulaw`, `alaw`가 될 수 있습니다. OpenClaw는 xAI의 배치 REST TTS 엔드포인트를 사용하고 완성된 오디오 첨부 파일을 반환합니다. xAI의 스트리밍 TTS WebSocket은 이 provider 경로에서 사용되지 않습니다. 네이티브 Opus 음성 메모 형식은 이 경로에서 지원되지 않습니다.
- **Microsoft**: `microsoft.outputFormat`을 사용합니다(기본값 `audio-24khz-48kbitrate-mono-mp3`).
  - 번들된 전송은 `outputFormat`을 받지만, 모든 형식이 서비스에서 사용 가능한 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech output formats를 따릅니다(Ogg/WebM Opus 포함).
  - Telegram `sendVoice`는 OGG/MP3/M4A를 허용합니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요.
  - 구성된 Microsoft 출력 형식이 실패하면, OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 출력 형식은 채널별로 고정됩니다(위 참조).

## 자동 TTS 동작

활성화되면 OpenClaw는 다음과 같이 동작합니다.

- 응답에 이미 미디어 또는 `MEDIA:` 지시어가 포함되어 있으면 TTS를 건너뜁니다.
- 매우 짧은 응답(< 10자)은 건너뜁니다.
- 활성화된 경우 긴 응답은 `agents.defaults.model.primary`(또는 `summaryModel`)를 사용해 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.

응답이 `maxLength`를 초과하고 요약이 꺼져 있거나(또는 요약 모델용 API key가 없으면),
오디오는 건너뛰고 일반 텍스트 응답이 전송됩니다.

## 흐름도

```
응답 -> TTS 활성화?
  아니오  -> 텍스트 전송
  예      -> 미디어 / MEDIA: / 짧은 응답인가?
              예   -> 텍스트 전송
              아니오 -> 길이가 제한 초과?
                         아니오 -> TTS -> 오디오 첨부
                         예     -> 요약 활성화?
                                    아니오 -> 텍스트 전송
                                    예     -> 요약(summaryModel 또는 agents.defaults.model.primary)
                                               -> TTS -> 오디오 첨부
```

## 슬래시 명령 사용법

명령은 하나뿐입니다: `/tts`.
활성화 세부 정보는 [Slash commands](/ko/tools/slash-commands)를 참조하세요.

Discord 참고: `/tts`는 Discord 내장 명령이므로, OpenClaw는
그곳에서 네이티브 명령으로 `/voice`를 등록합니다. 텍스트 `/tts ...`는 여전히 동작합니다.

```
/tts off
/tts on
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

참고:

- 명령은 승인된 발신자가 필요합니다(allowlist/owner 규칙은 계속 적용됨).
- `commands.text` 또는 네이티브 명령 등록이 활성화되어 있어야 합니다.
- config `messages.tts.auto`는 `off|always|inbound|tagged`를 받습니다.
- `/tts on`은 로컬 TTS 환경설정을 `always`로 기록하고, `/tts off`는 `off`로 기록합니다.
- `inbound` 또는 `tagged` 기본값이 필요하면 config를 사용하세요.
- `limit`와 `summary`는 메인 config가 아니라 로컬 prefs에 저장됩니다.
- `/tts audio`는 일회성 오디오 응답을 생성합니다(TTS를 켜지 않음).
- `/tts status`는 최신 시도에 대한 fallback 가시성을 포함합니다:
  - 성공한 fallback: `Fallback: <primary> -> <used>` 및 `Attempts: ...`
  - 실패: `Error: ...` 및 `Attempts: ...`
  - 자세한 진단: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 및 ElevenLabs API 실패에는 이제 파싱된 provider 오류 세부 정보와 요청 id(provider가 반환한 경우)가 포함되며, 이는 TTS 오류/로그에 표시됩니다.

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고
응답 전달용 오디오 첨부 파일을 반환합니다. 채널이 Feishu, Matrix, Telegram 또는 WhatsApp인 경우,
오디오는 파일 첨부가 아니라 음성 메시지로 전달됩니다.
선택적 `channel` 및 `timeoutMs` 필드를 받습니다. `timeoutMs`는
호출별 provider 요청 timeout(밀리초)입니다.

## Gateway RPC

Gateway 메서드:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 관련 항목

- [Media overview](/ko/tools/media-overview)
- [Music generation](/ko/tools/music-generation)
- [Video generation](/ko/tools/video-generation)
