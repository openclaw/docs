---
read_when:
    - 응답에 text-to-speech 활성화
    - TTS provider 또는 제한 구성
    - '`/tts` 명령 사용'
summary: 발신 응답용 TTS (text-to-speech)
title: TTS (text-to-speech)
x-i18n:
    generated_at: "2026-04-25T18:23:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c56c42f201139a7277153a6a1409ef9a288264e0702d2940b74b08ece385718
    source_path: tools/tts.md
    workflow: 15
---

OpenClaw는 ElevenLabs, Google Gemini, Gradium, Local CLI, Microsoft, MiniMax, OpenAI, Vydra, xAI, Xiaomi MiMo를 사용해 발신 응답을 오디오로 변환할 수 있습니다.
OpenClaw가 오디오를 전송할 수 있는 곳이라면 어디서든 동작합니다.

## 지원되는 서비스

- **ElevenLabs** (기본 또는 fallback provider)
- **Google Gemini** (기본 또는 fallback provider, Gemini API TTS 사용)
- **Gradium** (기본 또는 fallback provider, 음성 메모 및 전화 출력 지원)
- **Local CLI** (기본 또는 fallback provider, 구성된 로컬 TTS 명령 실행)
- **Microsoft** (기본 또는 fallback provider, 현재 번들 구현은 `node-edge-tts` 사용)
- **MiniMax** (기본 또는 fallback provider, T2A v2 API 사용)
- **OpenAI** (기본 또는 fallback provider, 요약에도 사용)
- **Vydra** (기본 또는 fallback provider, 공용 이미지, 비디오, 음성 provider)
- **xAI** (기본 또는 fallback provider, xAI TTS API 사용)
- **Xiaomi MiMo** (기본 또는 fallback provider, Xiaomi chat completions를 통한 MiMo TTS 사용)

### Microsoft speech 참고

번들 Microsoft speech provider는 현재 `node-edge-tts` 라이브러리를 통해 Microsoft Edge의 온라인
신경망 TTS 서비스를 사용합니다. 이는 로컬이 아닌 호스팅 서비스이며,
Microsoft 엔드포인트를 사용하고 API 키가 필요하지 않습니다.
`node-edge-tts`는 speech 구성 옵션과 출력 형식을 노출하지만,
모든 옵션이 서비스에서 지원되는 것은 아닙니다. `edge`를 사용하는 레거시 구성과 directive 입력도
여전히 동작하며 `microsoft`로 정규화됩니다.

이 경로는 공개 웹 서비스이며 게시된 SLA나 할당량이 없으므로,
best-effort로 취급하세요. 보장된 한도와 지원이 필요하면 OpenAI
또는 ElevenLabs를 사용하세요.

## 선택적 키

OpenAI, ElevenLabs, Google Gemini, Gradium, MiniMax, Vydra, xAI, Xiaomi MiMo를 사용하려면:

- `ELEVENLABS_API_KEY` (또는 `XI_API_KEY`)
- `GEMINI_API_KEY` (또는 `GOOGLE_API_KEY`)
- `GRADIUM_API_KEY`
- `MINIMAX_API_KEY`; MiniMax TTS는 다음을 통한 Token Plan 인증도 허용합니다:
  `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, 또는
  `MINIMAX_CODING_API_KEY`
- `OPENAI_API_KEY`
- `VYDRA_API_KEY`
- `XAI_API_KEY`
- `XIAOMI_API_KEY`

Local CLI와 Microsoft speech는 API 키가 **필요하지 않습니다**.

여러 provider가 구성된 경우 선택된 provider가 먼저 사용되고 나머지는 fallback 옵션이 됩니다.
자동 요약은 구성된 `summaryModel`(또는 `agents.defaults.model.primary`)을 사용하므로,
요약을 활성화했다면 해당 provider도 인증되어 있어야 합니다.

## 서비스 링크

- [OpenAI Text-to-Speech guide](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Audio API reference](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs Authentication](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/ko/providers/gradium)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Xiaomi MiMo speech synthesis](/ko/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft Speech output formats](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI Text to Speech](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 기본적으로 활성화되어 있나요?

아니요. 자동 TTS는 기본적으로 **꺼져 있습니다**. 구성에서
`messages.tts.auto`로 활성화하거나 로컬에서 `/tts on`으로 활성화하세요.

`messages.tts.provider`가 설정되지 않은 경우 OpenClaw는
레지스트리 자동 선택 순서에서 첫 번째로 구성된 speech provider를 선택합니다.

## 구성

TTS 구성은 `openclaw.json`의 `messages.tts` 아래에 있습니다.
전체 스키마는 [Gateway configuration](/ko/gateway/configuration)에 있습니다.

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

### Microsoft 기본(API 키 없음)

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

MiniMax TTS 인증 해석 순서는 `messages.tts.providers.minimax.apiKey`, 그다음
저장된 `minimax-portal` OAuth/token profile, 그다음 Token Plan 환경 키
(`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
`MINIMAX_CODING_API_KEY`), 마지막으로 `MINIMAX_API_KEY`입니다. 명시적인 TTS
`baseUrl`이 설정되지 않은 경우 OpenClaw는 Token Plan speech에
구성된 `minimax-portal` OAuth 호스트를 재사용할 수 있습니다.

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

Google Gemini TTS는 Gemini API 키 경로를 사용합니다. Gemini API로 제한된
Google Cloud Console API 키를 여기서 사용할 수 있으며, 번들된 Google 이미지 생성 provider가
사용하는 것과 같은 유형의 키입니다. 해석 순서는
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

xAI TTS는 번들 Grok 모델 provider와 동일한 `XAI_API_KEY` 경로를 사용합니다.
해석 순서는 `messages.tts.providers.xai.apiKey` -> `XAI_API_KEY`입니다.
현재 사용 가능한 voice는 `ara`, `eve`, `leo`, `rex`, `sal`, `una`이며, 기본값은 `eve`입니다.
`language`는 BCP-47 태그 또는 `auto`를 받을 수 있습니다.

### Xiaomi MiMo 기본

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          baseUrl: "https://api.xiaomimimo.com/v1",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Xiaomi MiMo TTS는 번들 Xiaomi 모델
provider와 동일한 `XIAOMI_API_KEY` 경로를 사용합니다. speech provider id는 `xiaomi`이며,
`mimo`도 alias로 허용됩니다.
대상 텍스트는 Xiaomi의 TTS
계약에 맞게 assistant 메시지로 전송됩니다. 선택적 `style`은 사용자 지시로 전송되며 음성으로 읽히지 않습니다.

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

OpenRouter TTS는 번들
OpenRouter 모델 provider와 동일한 `OPENROUTER_API_KEY` 경로를 사용합니다. 해석 순서는
`messages.tts.providers.openrouter.apiKey` ->
`models.providers.openrouter.apiKey` -> `OPENROUTER_API_KEY`입니다.

### Local CLI 기본

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

Local CLI TTS는 gateway 호스트에서 구성된 명령을 실행합니다. `{{Text}}`,
`{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` placeholder는
`args`에서 확장되며, `{{Text}}` placeholder가 없으면 OpenClaw가
읽을 텍스트를 stdin에 기록합니다. `outputFormat`은 `mp3`, `opus`, `wav`를 받을 수 있습니다.
음성 메모 대상은 Ogg/Opus로 트랜스코딩되고 전화 출력은 `ffmpeg`를 사용해
원시 16 kHz 모노 PCM으로 트랜스코딩됩니다. 레거시 provider alias
`cli`도 여전히 동작하지만, 새 구성에서는 `tts-local-cli`를 사용해야 합니다.

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

### Microsoft speech 비활성화

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

### 사용자 지정 제한 + prefs 경로

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

### 수신 음성 메시지 뒤에만 오디오로 응답

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 긴 응답에 대한 자동 요약 비활성화

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

그다음 다음을 실행하세요:

```
/tts summary off
```

### 필드 참고

- `auto`: 자동 TTS 모드(`off`, `always`, `inbound`, `tagged`).
  - `inbound`는 수신 음성 메시지 뒤에만 오디오를 전송합니다.
  - `tagged`는 응답에 `[[tts:key=value]]` directive 또는 `[[tts:text]]...[[/tts:text]]` 블록이 포함될 때만 오디오를 전송합니다.
- `enabled`: 레거시 토글입니다(`doctor`가 이를 `auto`로 마이그레이션함).
- `mode`: `"final"`(기본값) 또는 `"all"`(도구/블록 응답 포함).
- `provider`: `"elevenlabs"`, `"google"`, `"gradium"`, `"microsoft"`, `"minimax"`, `"openai"`, `"vydra"`, `"xai"`, `"xiaomi"` 같은 speech provider id입니다(fallback은 자동).
- `provider`가 **설정되지 않으면**, OpenClaw는 레지스트리 자동 선택 순서에서 첫 번째로 구성된 speech provider를 사용합니다.
- 레거시 `provider: "edge"` 구성은 `openclaw doctor --fix`로 복구되며
  `provider: "microsoft"`로 다시 기록됩니다.
- `summaryModel`: 자동 요약용 선택적 저비용 모델입니다. 기본값은 `agents.defaults.model.primary`.
  - `provider/model` 또는 구성된 모델 alias를 받을 수 있습니다.
- `modelOverrides`: 모델이 TTS directive를 내보낼 수 있도록 허용합니다(기본적으로 활성화).
  - `allowProvider`의 기본값은 `false`입니다(provider 전환은 옵트인).
- `providers.<id>`: speech provider id를 키로 하는 provider 소유 설정.
- 레거시 직접 provider 블록(`messages.tts.openai`, `messages.tts.elevenlabs`, `messages.tts.microsoft`, `messages.tts.edge`)은 `openclaw doctor --fix`로 복구됩니다. 커밋되는 구성은 `messages.tts.providers.<id>`를 사용해야 합니다.
- 레거시 `messages.tts.providers.edge`도 `openclaw doctor --fix`로 복구됩니다. 커밋되는 구성은 `messages.tts.providers.microsoft`를 사용해야 합니다.
- `maxTextLength`: TTS 입력의 하드 상한(문자 수)입니다. 이를 초과하면 `/tts audio`가 실패합니다.
- `timeoutMs`: 요청 타임아웃(ms).
- `prefsPath`: 로컬 prefs JSON 경로(provider/limit/summary)를 재정의합니다.
- `apiKey` 값은 env var로 fallback됩니다(`ELEVENLABS_API_KEY`/`XI_API_KEY`, `GEMINI_API_KEY`/`GOOGLE_API_KEY`, `GRADIUM_API_KEY`, `MINIMAX_API_KEY`, `OPENAI_API_KEY`, `VYDRA_API_KEY`, `XAI_API_KEY`, `XIAOMI_API_KEY`).
- `providers.elevenlabs.baseUrl`: ElevenLabs API base URL을 재정의합니다.
- `providers.openai.baseUrl`: OpenAI TTS 엔드포인트를 재정의합니다.
  - 해석 순서: `messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 기본값이 아닌 값은 OpenAI 호환 TTS 엔드포인트로 처리되므로 사용자 지정 모델 및 음성 이름이 허용됩니다.
- `providers.elevenlabs.voiceSettings`:
  - `stability`, `similarityBoost`, `style`: `0..1`
  - `useSpeakerBoost`: `true|false`
  - `speed`: `0.5..2.0` (1.0 = 보통)
- `providers.elevenlabs.applyTextNormalization`: `auto|on|off`
- `providers.elevenlabs.languageCode`: 2글자 ISO 639-1 (예: `en`, `de`)
- `providers.elevenlabs.seed`: 정수 `0..4294967295` (best-effort 결정성)
- `providers.minimax.baseUrl`: MiniMax API base URL 재정의(기본값 `https://api.minimax.io`, env: `MINIMAX_API_HOST`).
- `providers.minimax.model`: TTS 모델(기본값 `speech-2.8-hd`, env: `MINIMAX_TTS_MODEL`).
- `providers.minimax.voiceId`: 음성 식별자(기본값 `English_expressive_narrator`, env: `MINIMAX_TTS_VOICE_ID`).
- `providers.minimax.speed`: 재생 속도 `0.5..2.0`(기본값 1.0).
- `providers.minimax.vol`: 볼륨 `(0, 10]`(기본값 1.0, 0보다 커야 함).
- `providers.minimax.pitch`: 정수 음높이 이동 `-12..12`(기본값 0). MiniMax T2A API는 정수가 아닌 pitch 값을 거부하므로 소수 값은 호출 전에 잘립니다.
- `providers.tts-local-cli.command`: CLI TTS용 로컬 실행 파일 또는 명령 문자열.
- `providers.tts-local-cli.args`: 명령 인수이며 `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}` placeholder를 지원합니다.
- `providers.tts-local-cli.outputFormat`: 예상 CLI 출력 형식(`mp3`, `opus`, `wav`; 오디오 첨부 파일의 기본값은 `mp3`).
- `providers.tts-local-cli.timeoutMs`: 밀리초 단위 명령 타임아웃(기본값 `120000`).
- `providers.tts-local-cli.cwd`: 선택적 명령 작업 디렉터리.
- `providers.tts-local-cli.env`: 선택적 문자열 환경 변수 재정의.
- `providers.google.model`: Gemini TTS 모델(기본값 `gemini-3.1-flash-tts-preview`).
- `providers.google.voiceName`: Gemini 사전 정의 음성 이름(기본값 `Kore`; `voice`도 허용됨).
- `providers.google.audioProfile`: 읽을 텍스트 앞에 추가되는 자연어 스타일 프롬프트.
- `providers.google.speakerName`: TTS 프롬프트가 이름 있는 화자를 사용할 때 읽을 텍스트 앞에 추가되는 선택적 화자 라벨.
- `providers.google.baseUrl`: Gemini API base URL을 재정의합니다. `https://generativelanguage.googleapis.com`만 허용됩니다.
  - `messages.tts.providers.google.apiKey`가 생략되면 TTS는 env fallback 전에 `models.providers.google.apiKey`를 재사용할 수 있습니다.
- `providers.gradium.baseUrl`: Gradium API base URL 재정의(기본값 `https://api.gradium.ai`).
- `providers.gradium.voiceId`: Gradium 음성 식별자(기본값 Emma, `YTpq7expH9539ERJ`).
- `providers.xai.apiKey`: xAI TTS API 키(env: `XAI_API_KEY`).
- `providers.xai.baseUrl`: xAI TTS base URL 재정의(기본값 `https://api.x.ai/v1`, env: `XAI_BASE_URL`).
- `providers.xai.voiceId`: xAI voice id(기본값 `eve`; 현재 사용 가능한 voice: `ara`, `eve`, `leo`, `rex`, `sal`, `una`).
- `providers.xai.language`: BCP-47 언어 코드 또는 `auto`(기본값 `en`).
- `providers.xai.responseFormat`: `mp3`, `wav`, `pcm`, `mulaw`, `alaw`(기본값 `mp3`).
- `providers.xai.speed`: provider 고유 속도 재정의.
- `providers.xiaomi.apiKey`: Xiaomi MiMo API 키(env: `XIAOMI_API_KEY`).
- `providers.xiaomi.baseUrl`: Xiaomi MiMo API base URL 재정의(기본값 `https://api.xiaomimimo.com/v1`, env: `XIAOMI_BASE_URL`).
- `providers.xiaomi.model`: TTS 모델(기본값 `mimo-v2.5-tts`, env: `XIAOMI_TTS_MODEL`; `mimo-v2-tts`도 지원).
- `providers.xiaomi.voice`: MiMo voice id(기본값 `mimo_default`, env: `XIAOMI_TTS_VOICE`).
- `providers.xiaomi.format`: `mp3` 또는 `wav`(기본값 `mp3`, env: `XIAOMI_TTS_FORMAT`).
- `providers.xiaomi.style`: 사용자 메시지로 전송되는 선택적 자연어 스타일 지시이며, 음성으로 읽히지 않습니다.
- `providers.openrouter.apiKey`: OpenRouter API 키(env: `OPENROUTER_API_KEY`; `models.providers.openrouter.apiKey`를 재사용 가능).
- `providers.openrouter.baseUrl`: OpenRouter TTS base URL 재정의(기본값 `https://openrouter.ai/api/v1`; 레거시 `https://openrouter.ai/v1`은 정규화됨).
- `providers.openrouter.model`: OpenRouter TTS 모델 id(기본값 `hexgrad/kokoro-82m`; `modelId`도 허용됨).
- `providers.openrouter.voice`: provider별 voice id(기본값 `af_alloy`; `voiceId`도 허용됨).
- `providers.openrouter.responseFormat`: `mp3` 또는 `pcm`(기본값 `mp3`).
- `providers.openrouter.speed`: provider 고유 속도 재정의.
- `providers.microsoft.enabled`: Microsoft speech 사용 허용(기본값 `true`, API 키 없음).
- `providers.microsoft.voice`: Microsoft 신경망 voice 이름(예: `en-US-MichelleNeural`).
- `providers.microsoft.lang`: 언어 코드(예: `en-US`).
- `providers.microsoft.outputFormat`: Microsoft 출력 형식(예: `audio-24khz-48kbitrate-mono-mp3`).
  - 유효한 값은 Microsoft Speech 출력 형식을 참조하세요. 모든 형식이 번들 Edge 기반 전송에서 지원되는 것은 아닙니다.
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`: 퍼센트 문자열(예: `+10%`, `-5%`).
- `providers.microsoft.saveSubtitles`: 오디오 파일과 함께 JSON 자막을 기록합니다.
- `providers.microsoft.proxy`: Microsoft speech 요청용 프록시 URL.
- `providers.microsoft.timeoutMs`: 요청 타임아웃 재정의(ms).
- `edge.*`: 동일한 Microsoft 설정의 레거시 alias입니다. 저장된 구성을 `providers.microsoft`로 다시 쓰려면
  `openclaw doctor --fix`를 실행하세요.

## 모델 기반 재정의(기본적으로 활성화)

기본적으로 모델은 단일 응답에 대해 TTS directive를 **내보낼 수 있습니다**.
`messages.tts.auto`가 `tagged`인 경우, 오디오를 트리거하려면 이러한 directive가 필요합니다.

이 기능이 활성화되면 모델은 단일 응답의 음성을 재정의하기 위해 `[[tts:...]]` directive를 내보낼 수 있으며,
추가로 `[[tts:text]]...[[/tts:text]]` 블록을 사용해 웃음, 노래 지시 등
오디오에만 나타나야 하는 표현 태그를 제공할 수 있습니다.

`provider=...` directive는 `modelOverrides.allowProvider: true`가 아닌 한 무시됩니다.

예시 응답 payload:

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

사용 가능한 directive 키(활성화된 경우):

- `provider` (등록된 speech provider id, 예: `openai`, `elevenlabs`, `google`, `gradium`, `minimax`, `microsoft`, `vydra`, `xai`, `xiaomi`; `allowProvider: true` 필요)
- `voice` (OpenAI, Gradium, Xiaomi voice), `voiceName` / `voice_name` / `google_voice` (Google voice), 또는 `voiceId` (ElevenLabs / Gradium / MiniMax / xAI)
- `model` (OpenAI TTS 모델, ElevenLabs 모델 id, MiniMax 모델, Xiaomi MiMo TTS 모델) 또는 `google_model` (Google TTS 모델)
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (MiniMax 볼륨, 0-10)
- `pitch` (MiniMax 정수 pitch, -12~12; 소수 값은 MiniMax 요청 전에 잘림)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

모든 모델 재정의를 비활성화하려면:

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

선택적 허용 목록(provider 전환을 활성화하면서 다른 노브는 계속 구성 가능하게 유지):

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

## 사용자별 기본 설정

슬래시 명령은 로컬 재정의를 `prefsPath`에 기록합니다(기본값:
`~/.openclaw/settings/tts.json`, `OPENCLAW_TTS_PREFS` 또는
`messages.tts.prefsPath`로 재정의 가능).

저장되는 필드:

- `enabled`
- `provider`
- `maxLength` (요약 임계값, 기본값 1500자)
- `summarize` (기본값 `true`)

이 값들은 해당 호스트의 `messages.tts.*`를 재정의합니다.

## 출력 형식(고정)

- **Feishu / Matrix / Telegram / WhatsApp**: 음성 메모 응답은 Opus를 우선 사용합니다(ElevenLabs의 `opus_48000_64`, OpenAI의 `opus`).
  - 48kHz / 64kbps는 음성 메시지에 적절한 절충안입니다.
- **Feishu**: 음성 메모 응답이 MP3/WAV/M4A 또는 그 외
  일반적인 오디오 파일 형식으로 생성되면, Feishu Plugin은 네이티브 `audio` 버블을 보내기 전에
  `ffmpeg`로 이를 48kHz Ogg/Opus로 트랜스코딩합니다. 변환에 실패하면 Feishu는
  원본 파일을 첨부 파일로 받습니다.
- **기타 채널**: MP3(ElevenLabs의 `mp3_44100_128`, OpenAI의 `mp3`).
  - 44.1kHz / 128kbps는 음성 명료성을 위한 기본 균형값입니다.
- **MiniMax**: 일반 오디오 첨부 파일에는 MP3(`speech-2.8-hd` 모델, 32kHz 샘플링 레이트)를 사용합니다. Feishu 및 Telegram 같은 음성 메모 대상의 경우 OpenClaw는 전달 전에 `ffmpeg`로 MiniMax MP3를 48kHz Opus로 트랜스코딩합니다.
- **Xiaomi MiMo**: 기본적으로 MP3를 사용하고, 구성 시 WAV도 사용할 수 있습니다. Feishu 및 Telegram 같은 음성 메모 대상의 경우 OpenClaw는 전달 전에 `ffmpeg`로 Xiaomi 출력을 48kHz Opus로 트랜스코딩합니다.
- **Local CLI**: 구성된 `outputFormat`을 사용합니다. 음성 메모 대상은
  Ogg/Opus로 변환되고 전화 출력은 `ffmpeg`로
  원시 16 kHz 모노 PCM으로 변환됩니다.
- **Google Gemini**: Gemini API TTS는 원시 24kHz PCM을 반환합니다. OpenClaw는 오디오 첨부 파일용으로 이를 WAV로 감싸고, Talk/전화용으로는 PCM을 직접 반환합니다. 이 경로는 네이티브 Opus 음성 메모 형식을 지원하지 않습니다.
- **Gradium**: 오디오 첨부 파일에는 WAV, 음성 메모 대상에는 Opus, 전화용에는 8 kHz의 `ulaw_8000`을 사용합니다.
- **xAI**: 기본적으로 MP3를 사용하며, `responseFormat`은 `mp3`, `wav`, `pcm`, `mulaw`, `alaw`가 될 수 있습니다. OpenClaw는 xAI의 배치 REST TTS 엔드포인트를 사용하고 완성된 오디오 첨부 파일을 반환합니다. xAI의 스트리밍 TTS WebSocket은 이 provider 경로에서 사용되지 않습니다. 이 경로는 네이티브 Opus 음성 메모 형식을 지원하지 않습니다.
- **Microsoft**: `microsoft.outputFormat`을 사용합니다(기본값 `audio-24khz-48kbitrate-mono-mp3`).
  - 번들 전송 경로는 `outputFormat`을 받을 수 있지만, 모든 형식이 서비스에서 제공되는 것은 아닙니다.
  - 출력 형식 값은 Microsoft Speech 출력 형식을 따릅니다(Ogg/WebM Opus 포함).
  - Telegram `sendVoice`는 OGG/MP3/M4A를 받을 수 있습니다. 보장된 Opus 음성 메시지가 필요하면 OpenAI/ElevenLabs를 사용하세요.
  - 구성된 Microsoft 출력 형식이 실패하면 OpenClaw는 MP3로 재시도합니다.

OpenAI/ElevenLabs 출력 형식은 채널별로 고정됩니다(위 참조).

## 자동 TTS 동작

활성화되면 OpenClaw는 다음과 같이 동작합니다:

- 응답에 이미 미디어 또는 `MEDIA:` directive가 있으면 TTS를 건너뜁니다.
- 매우 짧은 응답(< 10자)은 건너뜁니다.
- 활성화된 경우 긴 응답은 `agents.defaults.model.primary`(또는 `summaryModel`)를 사용해 요약합니다.
- 생성된 오디오를 응답에 첨부합니다.

응답이 `maxLength`를 초과하고 요약이 꺼져 있거나(또는
요약 모델용 API 키가 없는 경우), 오디오는
건너뛰고 일반 텍스트 응답을 전송합니다.

## 흐름도

```
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize (summaryModel or agents.defaults.model.primary)
                                      -> TTS -> attach audio
```

## 슬래시 명령 사용법

명령은 `/tts` 하나뿐입니다.
활성화 상세는 [Slash commands](/ko/tools/slash-commands)를 참조하세요.

Discord 참고: `/tts`는 Discord 내장 명령이므로, OpenClaw는
거기서 네이티브 명령으로 `/voice`를 등록합니다. 텍스트 `/tts ...`는 여전히 동작합니다.

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

- 명령에는 승인된 발신자가 필요합니다(허용 목록/owner 규칙은 계속 적용됨).
- `commands.text` 또는 네이티브 명령 등록이 활성화되어 있어야 합니다.
- 구성 `messages.tts.auto`는 `off|always|inbound|tagged`를 받을 수 있습니다.
- `/tts on`은 로컬 TTS 기본 설정을 `always`로 기록하고, `/tts off`는 이를 `off`로 기록합니다.
- 기본값으로 `inbound` 또는 `tagged`가 필요하면 구성을 사용하세요.
- `limit`과 `summary`는 메인 구성이 아니라 로컬 prefs에 저장됩니다.
- `/tts audio`는 일회성 오디오 응답을 생성합니다(TTS를 켜지 않음).
- `/tts status`에는 최신 시도에 대한 fallback 가시성이 포함됩니다:
  - 성공 fallback: `Fallback: <primary> -> <used>` + `Attempts: ...`
  - 실패: `Error: ...` + `Attempts: ...`
  - 상세 진단: `Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 및 ElevenLabs API 실패에는 이제 파싱된 provider 오류 상세와 요청 id(provider가 반환한 경우)가 포함되며, 이는 TTS 오류/로그에 노출됩니다.

## 에이전트 도구

`tts` 도구는 텍스트를 음성으로 변환하고
응답 전달용 오디오 첨부 파일을 반환합니다. 채널이 Feishu, Matrix, Telegram, WhatsApp인 경우
오디오는 파일 첨부가 아니라 음성 메시지로 전달됩니다.
Feishu는 `ffmpeg`가
사용 가능하면 이 경로에서 Opus가 아닌 TTS 출력을 트랜스코딩할 수 있습니다.
WhatsApp은 클라이언트가 음성 메모 캡션을 일관되게 렌더링하지 않기 때문에
보이는 텍스트를 PTT 음성 메모 오디오와 별도로 전송합니다.
선택적 `channel` 및 `timeoutMs` 필드를 받을 수 있으며, `timeoutMs`는
호출별 provider 요청 타임아웃(밀리초)입니다.

## Gateway RPC

Gateway 메서드:

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`

## 관련 문서

- [미디어 개요](/ko/tools/media-overview)
- [음악 생성](/ko/tools/music-generation)
- [비디오 생성](/ko/tools/video-generation)
