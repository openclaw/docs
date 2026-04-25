---
read_when:
    - OpenClaw에서 아웃바운드 음성 통화를 걸려고 합니다.
    - voice-call plugin을 구성하거나 개발하고 있습니다.
summary: 'Voice Call plugin: Twilio/Telnyx/Plivo를 통한 아웃바운드 + 인바운드 통화(plugin 설치 + config + CLI)'
title: Voice call plugin
x-i18n:
    generated_at: "2026-04-25T06:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw용 음성 통화 plugin입니다. plugin을 통해 아웃바운드 알림과
인바운드 정책이 있는 다중 턴 대화를 지원합니다.

현재 provider:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + XML transfer + GetInput speech)
- `mock` (개발용/네트워크 없음)

빠른 개념 정리:

- plugin 설치
- Gateway 재시작
- `plugins.entries.voice-call.config` 아래에서 구성
- `openclaw voicecall ...` 또는 `voice_call` 도구 사용

## 실행 위치(local vs remote)

Voice Call plugin은 **Gateway 프로세스 내부에서** 실행됩니다.

원격 Gateway를 사용하는 경우, **Gateway가 실행 중인 머신**에 plugin을 설치/구성한 뒤, plugin을 로드하도록 Gateway를 재시작하세요.

## 설치

### 옵션 A: npm에서 설치(권장)

```bash
openclaw plugins install @openclaw/voice-call
```

이후 Gateway를 재시작하세요.

### 옵션 B: 로컬 폴더에서 설치(개발용, 복사 없음)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

이후 Gateway를 재시작하세요.

## 구성

`plugins.entries.voice-call.config` 아래에 config를 설정하세요.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 또는 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // 또는 Twilio용 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx Mission Control Portal의 Telnyx Webhook 공개 키
            // (Base64 문자열; TELNYX_PUBLIC_KEY로도 설정 가능)
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook 서버
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook 보안(터널/프록시에 권장)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 공개 노출(하나 선택)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 선택 사항; 설정하지 않으면 첫 번째 등록된 realtime transcription provider
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY가 설정되어 있으면 선택 사항
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },

          realtime: {
            enabled: false,
            provider: "google", // 선택 사항; 설정하지 않으면 첫 번째 등록된 realtime voice provider
            toolPolicy: "safe-read-only",
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

실제 provider로 테스트하기 전에 설정을 확인하세요.

```bash
openclaw voicecall setup
```

기본 출력은 채팅 로그와 터미널 세션에서 읽기 쉽게 표시됩니다. 이 명령은
plugin이 활성화되어 있는지, provider와 자격 증명이 존재하는지, Webhook
노출이 구성되었는지, 오디오 모드가 하나만 활성화되어 있는지를 확인합니다. 스크립트에서는
`openclaw voicecall setup --json`을 사용하세요.

Twilio, Telnyx, Plivo의 경우 setup은 공개 Webhook URL로 확인되어야 합니다. 구성된
`publicUrl`, 터널 URL, Tailscale URL 또는 serve fallback이
loopback 또는 비공개 네트워크 공간으로 확인되면, 실제 carrier Webhook을 받을 수 없는
provider를 시작하는 대신 setup이 실패합니다.

예상치 못한 동작 없는 스모크 테스트를 하려면 다음을 실행하세요.

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

두 번째 명령도 여전히 dry run입니다. 짧은 아웃바운드
notify 통화를 걸려면 `--yes`를 추가하세요.

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

참고:

- Twilio/Telnyx는 **공개적으로 도달 가능한** Webhook URL이 필요합니다.
- Plivo는 **공개적으로 도달 가능한** Webhook URL이 필요합니다.
- `mock`은 로컬 개발용 provider입니다(네트워크 호출 없음).
- 오래된 config가 여전히 `provider: "log"`, `twilio.from`, 또는 레거시 `streaming.*` OpenAI 키를 사용한다면 `openclaw doctor --fix`를 실행해 다시 작성하세요.
- Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
- `skipSignatureVerification`은 로컬 테스트 전용입니다.
- ngrok 무료 tier를 사용한다면 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)일 때만 잘못된 서명을 가진 Twilio Webhook을 허용합니다. 로컬 개발에만 사용하세요.
- ngrok 무료 tier URL은 바뀌거나 interstitial 동작이 추가될 수 있습니다. `publicUrl`이 바뀌면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인 또는 Tailscale funnel을 권장합니다.
- `realtime.enabled`는 전체 음성 대 음성 대화를 시작합니다. `streaming.enabled`와 함께 활성화하지 마세요.
- 스트리밍 보안 기본값:
  - `streaming.preStartTimeoutMs`는 유효한 `start` frame을 보내지 않는 소켓을 닫습니다.
- `streaming.maxPendingConnections`는 인증되지 않은 pre-start 소켓의 총 수를 제한합니다.
- `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증되지 않은 pre-start 소켓 수를 제한합니다.
- `streaming.maxConnections`는 열린 미디어 스트림 소켓의 총 수(pending + active)를 제한합니다.
- 런타임 fallback은 현재도 تلك 오래된 voice-call 키를 받아들이지만, 다시 작성 경로는 `openclaw doctor --fix`이며 호환 shim은 임시입니다.

## Realtime 음성 대화

`realtime`은 실시간 통화 오디오용 완전 양방향 realtime voice provider를 선택합니다.
이는 오디오를 realtime
transcription provider로만 전달하는 `streaming`과는 별개입니다.

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 첫 번째
  등록된 realtime voice provider를 사용합니다.
- 번들 realtime voice provider에는 Google Gemini Live (`google`)와
  OpenAI (`openai`)가 있으며, 각 provider plugin이 등록합니다.
- provider 소유 원시 config는 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공용 `openclaw_agent_consult` realtime 도구를 노출합니다. realtime 모델은 발신자가 더 깊은 추론, 현재 정보, 또는 일반 OpenClaw 도구를 요청할 때 이를 호출할 수 있습니다.
- `realtime.toolPolicy`는 consult 실행을 제어합니다:
  - `safe-read-only`: consult 도구를 노출하고 일반 에이전트를
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`로 제한합니다.
  - `owner`: consult 도구를 노출하고 일반 에이전트가 정상 에이전트 도구 정책을 사용하도록 합니다.
  - `none`: consult 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 여전히 realtime provider로 전달됩니다.
- Consult 세션 키는 가능하면 기존 음성 세션을 재사용하고, 그렇지 않으면 발신자/수신자 전화번호로 fallback하므로 후속 consult 호출이 통화 중 컨텍스트를 유지합니다.
- `realtime.provider`가 등록되지 않은 provider를 가리키거나 등록된 realtime
  voice provider가 전혀 없으면, Voice Call은 전체 plugin을 실패시키는 대신 경고를 기록하고 realtime 미디어를 건너뜁니다.

Google Gemini Live realtime 기본값:

- API 키: `realtime.providers.google.apiKey`, `GEMINI_API_KEY`, 또는
  `GOOGLE_GENERATIVE_AI_API_KEY`
- 모델: `gemini-2.5-flash-native-audio-preview-12-2025`
- 음성: `Kore`

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
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

대신 OpenAI 사용:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

provider별 realtime voice 옵션은 [Google provider](/ko/providers/google) 및 [OpenAI provider](/ko/providers/openai)를 참고하세요.

## 스트리밍 전사

`streaming`은 실시간 통화 오디오용 realtime transcription provider를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 첫 번째
  등록된 realtime transcription provider를 사용합니다.
- 번들 realtime transcription provider에는 Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), xAI
  (`xai`)가 있으며, 각 provider plugin이 등록합니다.
- provider 소유 원시 config는 `streaming.providers.<providerId>` 아래에 있습니다.
- `streaming.provider`가 등록되지 않은 provider를 가리키거나 등록된 realtime
  transcription provider가 전혀 없으면, Voice Call은 경고를 기록하고
  전체 plugin을 실패시키는 대신 미디어 스트리밍을 건너뜁니다.

OpenAI 스트리밍 전사 기본값:

- API 키: `streaming.providers.openai.apiKey` 또는 `OPENAI_API_KEY`
- 모델: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

xAI 스트리밍 전사 기본값:

- API 키: `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`
- 엔드포인트: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // OPENAI_API_KEY가 설정되어 있으면 선택 사항
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

대신 xAI 사용:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // XAI_API_KEY가 설정되어 있으면 선택 사항
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

레거시 키는 여전히 `openclaw doctor --fix`에 의해 자동 마이그레이션됩니다.

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 오래된 통화 정리기

터미널 Webhook을 받지 못하는 통화(예: 완료되지 않는 notify 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용하세요. 기본값은 `0`입니다
(비활성화).

권장 범위:

- **프로덕션:** notify 스타일 흐름에는 `120`–`300`초
- 정상 통화가
  끝날 수 있도록 이 값은 **`maxDurationSeconds`보다 크게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 보안

프록시 또는 터널이 Gateway 앞에 있을 때 plugin은
서명 검증을 위해 공개 URL을 재구성합니다. 이 옵션들은 어떤 전달 헤더를 신뢰할지 제어합니다.

`webhookSecurity.allowedHosts`는 전달 헤더의 호스트 allowlist를 설정합니다.

`webhookSecurity.trustForwardingHeaders`는 allowlist 없이 전달 헤더를 신뢰합니다.

`webhookSecurity.trustedProxyIPs`는 요청
원격 IP가 목록과 일치할 때만 전달 헤더를 신뢰합니다.

Webhook 재생 방지는 Twilio와 Plivo에서 활성화되어 있습니다. 재생된 유효 Webhook
요청은 인정되지만 부수 효과는 건너뜁니다.

Twilio 대화 턴은 `<Gather>` callback에 턴별 token을 포함하므로,
오래되었거나 재생된 음성 callback은 새롭게 대기 중인 transcript 턴을 만족시킬 수 없습니다.

인증되지 않은 Webhook 요청은
provider에 필요한 서명 헤더가 없을 때 body를 읽기 전에 거부됩니다.

voice-call Webhook은 공유 pre-auth body 프로필(64 KB / 5초)과
서명 검증 전에 적용되는 IP별 in-flight 제한을 사용합니다.

안정적인 공개 호스트를 사용하는 예시:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 통화용 TTS

Voice Call은 통화에서 음성을 스트리밍하기 위해
core `messages.tts` 구성을 사용합니다. plugin config 아래에서
**같은 형식으로** 이를 재정의할 수 있으며, `messages.tts`와 deep-merge됩니다.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

참고:

- plugin config 내부의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋되는 config는 `tts.providers.<provider>`를 사용해야 합니다.
- **Microsoft speech는 음성 통화에서 무시됩니다**(전화 오디오에는 PCM이 필요하지만 현재 Microsoft 전송은 전화용 PCM 출력을 노출하지 않음).
- Twilio 미디어 스트리밍이 활성화되면 core TTS가 사용되며, 그렇지 않으면 통화는 provider 네이티브 음성으로 fallback합니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 fallback하지 않습니다. 이 상태에서 telephony TTS를 사용할 수 없으면 두 재생 경로를 섞는 대신 재생 요청이 실패합니다.
- telephony TTS가 보조 provider로 fallback할 때, Voice Call은 디버깅을 위해 provider 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.
- Twilio barge-in 또는 스트림 종료가 대기 중인 TTS 큐를 비우면, 대기 중이던
  재생 요청은 완료 처리되므로 재생 완료를 기다리는 발신자가
  멈춰 있지 않게 됩니다.

### 추가 예시

core TTS만 사용(재정의 없음):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

통화에 대해서만 ElevenLabs로 재정의(core 기본값은 다른 곳에서 유지):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

통화에 대해서만 OpenAI 모델 재정의(deep-merge 예시):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## 인바운드 통화

인바운드 정책의 기본값은 `disabled`입니다. 인바운드 통화를 활성화하려면 다음을 설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"`는 낮은 신뢰도의 발신자 번호 확인입니다. plugin은
provider가 제공한 `From` 값을 정규화하고 이를 `allowFrom`과 비교합니다.
Webhook 검증은 provider 전달과 payload 무결성을 인증하지만,
PSTN/VoIP 발신 번호 소유권까지 증명하지는 않습니다. `allowFrom`은
강한 발신자 ID가 아니라 발신자 번호 필터링으로 취급하세요.

자동 응답은 에이전트 시스템을 사용합니다. 다음 설정으로 조정하세요.

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 음성 출력 계약

자동 응답의 경우 Voice Call은 system prompt에 엄격한 음성 출력 계약을 추가합니다.

- `{"spoken":"..."}`

그런 다음 Voice Call은 음성 텍스트를 방어적으로 추출합니다.

- reasoning/error 콘텐츠로 표시된 payload는 무시합니다.
- 직접 JSON, fenced JSON, 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 fallback하고 계획/메타로 보이는 앞부분 문단은 제거합니다.

이렇게 하면 음성 재생이 발신자에게 들려줄 텍스트에 집중되고 계획 텍스트가 오디오로 유출되는 것을 방지할 수 있습니다.

### 대화 시작 동작

아웃바운드 `conversation` 통화에서 첫 메시지 처리는 실제 재생 상태와 연결됩니다.

- barge-in 큐 비우기와 자동 응답은 초기 인사말이 실제로 재생 중일 때만 억제됩니다.
- 초기 재생이 실패하면 통화는 `listening` 상태로 돌아가고 초기 메시지는 재시도를 위해 대기열에 남아 있습니다.
- Twilio 스트리밍의 초기 재생은 추가 지연 없이 stream connect 시 시작됩니다.
- Barge-in은 활성 재생을 중단하고 아직 재생되지 않은 대기 중 Twilio
  TTS 항목을 비웁니다. 비워진 항목은 건너뜀으로 완료 처리되므로, 후속 응답 로직이
  결코 재생되지 않을 오디오를 기다리지 않고 계속 진행할 수 있습니다.
- Realtime 음성 대화는 realtime 스트림 자체의 opening turn을 사용합니다. Voice Call은 해당 초기 메시지에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로, 아웃바운드 `<Connect><Stream>` 세션이 계속 연결된 상태로 유지됩니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림이 연결 해제되면, Voice Call은 통화를 자동 종료하기 전에 `2000ms` 대기합니다.

- 이 시간 안에 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 이후에도 스트림이 다시 등록되지 않으면, 정지된 활성 통화를 방지하기 위해 통화가 종료됩니다.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call의 alias
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 로그에서 턴 지연 시간 요약
openclaw voicecall expose --mode funnel
```

`latency`는 기본 voice-call 저장 경로의 `calls.jsonl`을 읽습니다.
다른 로그를 가리키려면 `--file <path>`를 사용하고, 분석을
마지막 N개 레코드로 제한하려면 `--last <n>`을 사용하세요(기본값 200).
출력에는 턴
지연 시간과 listen-wait 시간의 p50/p90/p99가 포함됩니다.

## 에이전트 도구

도구 이름: `voice_call`

작업:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

이 repo는 `skills/voice-call/SKILL.md`에 일치하는 skill 문서도 제공합니다.

## Gateway RPC

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## 관련

- [Text-to-speech](/ko/tools/tts)
- [Talk mode](/ko/nodes/talk)
- [Voice wake](/ko/nodes/voicewake)
