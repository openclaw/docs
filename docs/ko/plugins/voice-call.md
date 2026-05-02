---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸려고 합니다
    - voice-call Plugin을 구성하거나 개발하고 있습니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 전사가 필요합니다
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 발신 음성 통화를 걸고 수신 음성 통화를 받으며, 선택적으로 실시간 음성과 스트리밍 전사를 사용할 수 있습니다
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-05-02T21:10:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw용 음성 통화를 Plugin을 통해 제공합니다. 아웃바운드 알림,
다중 턴 대화, 전이중 실시간 음성, 스트리밍
전사, allowlist 정책을 적용한 인바운드 통화를 지원합니다.

**현재 제공자:** `twilio`(Programmable Voice + Media Streams),
`telnyx`(Call Control v2), `plivo`(Voice API + XML transfer + GetInput
speech), `mock`(개발용/네트워크 없음).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다. 원격
Gateway를 사용하는 경우, Gateway를 실행하는 머신에 Plugin을 설치하고
구성한 다음 Gateway를 다시 시작해 로드하세요.
</Note>

## 빠른 시작

<Steps>
  <Step title="Plugin 설치">
    <Tabs>
      <Tab title="npm에서 설치">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="로컬 폴더에서 설치(개발)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    npm이 OpenClaw 소유 패키지를 deprecated로 보고하는 경우, 해당 패키지 버전은
    이전 외부 패키지 배포 계열에서 나온 것입니다. 최신 npm 패키지가 게시될 때까지
    현재 패키징된 OpenClaw 빌드 또는 로컬 폴더 경로를 사용하세요.

    이후 Plugin이 로드되도록 Gateway를 다시 시작하세요.

  </Step>
  <Step title="제공자 및 Webhook 구성">
    `plugins.entries.voice-call.config` 아래에 구성을 설정하세요. 전체 구조는
    아래 [구성](#configuration)을 참고하세요. 최소한
    `provider`, 제공자 자격 증명, `fromNumber`, 공개적으로 접근 가능한
    Webhook URL이 필요합니다.
  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw voicecall setup
    ```

    기본 출력은 채팅 로그와 터미널에서 읽기 쉽습니다. Plugin 활성화,
    제공자 자격 증명, Webhook 노출, 그리고 하나의 오디오 모드(`streaming`
    또는 `realtime`)만 활성화되어 있는지 확인합니다. 스크립트에는
    `--json`을 사용하세요.

  </Step>
  <Step title="스모크 테스트">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 드라이 런입니다. 실제로 짧은 아웃바운드 알림 통화를
    걸려면 `--yes`를 추가하세요.

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정은 **공개 Webhook URL**로 확인되어야 합니다.
`publicUrl`, 터널 URL, Tailscale URL, 또는 serve fallback이 loopback이나
사설 네트워크 공간으로 확인되면, 통신사 Webhook을 받을 수 없는 제공자를
시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`이지만 선택한 제공자의 자격 증명이 누락된 경우,
Gateway 시작 로그에는 누락된 키와 함께 설정 미완료 경고가 기록되고
런타임 시작은 건너뜁니다. 명령, RPC 호출, 에이전트 도구는 사용 시에도
누락된 제공자 구성을 정확히 반환합니다.

<Note>
Voice Call 자격 증명은 SecretRef를 허용합니다. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, `plugins.entries.voice-call.config.tts.providers.*.apiKey`는 표준 SecretRef 표면을 통해 확인됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참고하세요.
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="제공자 노출 및 보안 참고 사항">
    - Twilio, Telnyx, Plivo는 모두 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
    - `mock`은 로컬 개발용 제공자입니다(네트워크 호출 없음).
    - `skipSignatureVerification`이 true가 아니라면 Telnyx에는 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 티어에서는 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 적용됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)일 때에만 유효하지 않은 서명의 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 티어 URL은 변경되거나 중간 페이지 동작을 추가할 수 있습니다. `publicUrl`이 달라지면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인 또는 Tailscale funnel을 권장합니다.

  </Accordion>
  <Accordion title="스트리밍 연결 한도">
    - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`는 인증되지 않은 전체 사전 시작 소켓 수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증되지 않은 사전 시작 소켓 수를 제한합니다.
    - `streaming.maxConnections`는 열린 전체 미디어 스트림 소켓 수(대기 중 + 활성)를 제한합니다.

  </Accordion>
  <Accordion title="레거시 구성 마이그레이션">
    `provider: "log"`, `twilio.from`, 또는 레거시 `streaming.*`
    OpenAI 키를 사용하는 이전 구성은 `openclaw doctor --fix`로 다시 작성됩니다.
    런타임 fallback은 현재로서는 이전 voice-call 키를 계속 허용하지만,
    재작성 경로는 `openclaw doctor --fix`이며 호환성 shim은
    임시입니다.

    자동 마이그레이션되는 스트리밍 키:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 세션 범위

기본적으로 Voice Call은 `sessionScope: "per-phone"`을 사용하므로 같은 발신자의
반복 통화는 대화 메모리를 유지합니다. 각 통신사 통화가 새 컨텍스트로
시작되어야 하는 경우, 예를 들어 접수, 예약, IVR, 또는 같은 전화번호가
서로 다른 회의를 나타낼 수 있는 Google Meet 브리지 플로에서는
`sessionScope: "per-call"`을 설정하세요.

## 실시간 음성 대화

`realtime`은 라이브 통화 오디오에 사용할 전이중 실시간 음성 제공자를
선택합니다. 오디오를 실시간 전사 제공자에게만 전달하는 `streaming`과는
별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화당
하나의 오디오 모드를 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 음성 제공자를 사용합니다.
- 번들 실시간 음성 제공자: Google Gemini Live(`google`) 및 OpenAI(`openai`)이며, 각 제공자 Plugin에서 등록됩니다.
- 제공자 소유 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공유 `openclaw_agent_consult` 실시간 도구를 노출합니다. 발신자가 더 깊은 추론, 최신 정보, 또는 일반 OpenClaw 도구를 요청할 때 실시간 모델이 이를 호출할 수 있습니다.
- `realtime.fastContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call은 먼저 consult 질문에 대해 인덱싱된 메모리/세션 컨텍스트를 검색하고, `realtime.fastContext.timeoutMs` 내에 해당 스니펫을 실시간 모델에 반환한 뒤, `realtime.fastContext.fallbackToConsult`가 true인 경우에만 전체 consult 에이전트로 fallback합니다.
- `realtime.provider`가 등록되지 않은 제공자를 가리키거나 실시간 음성 제공자가 전혀 등록되어 있지 않으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 실시간 미디어를 건너뜁니다.
- consult 세션 키는 사용 가능한 경우 저장된 통화 세션을 재사용한 다음, 구성된 `sessionScope`(`per-phone`이 기본값, 격리된 통화의 경우 `per-call`)로 fallback합니다.

### 도구 정책

`realtime.toolPolicy`는 consult 실행을 제어합니다.

| 정책             | 동작                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다. |
| `owner`          | consult 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 허용합니다.                                                 |
| `none`           | consult 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 여전히 실시간 제공자에게 전달됩니다.                                    |

### 실시간 제공자 예시

<Tabs>
  <Tab title="Google Gemini Live">
    기본값: `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, 또는 `GOOGLE_GENERATIVE_AI_API_KEY`의 API 키; 모델
    `gemini-2.5-flash-native-audio-preview-12-2025`; 음성 `Kore`.

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

  </Tab>
  <Tab title="OpenAI">
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
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

제공자별 실시간 음성 옵션은 [Google 제공자](/ko/providers/google) 및
[OpenAI 제공자](/ko/providers/openai)를 참고하세요.

## 스트리밍 전사

`streaming`은 라이브 통화 오디오에 사용할 실시간 전사 제공자를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 전사 제공자를 사용합니다.
- 번들 실시간 전사 제공자: Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)이며, 각각의 제공자 Plugin이 등록합니다.
- 제공자 소유 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- Twilio가 수락된 스트림 `start` 메시지를 보낸 후, Voice Call은 스트림을 즉시 등록하고 제공자가 연결되는 동안 인바운드 미디어를 전사 제공자에 큐잉하며, 실시간 전사가 준비된 뒤에만 초기 인사를 시작합니다.
- `streaming.provider`가 등록되지 않은 제공자를 가리키거나 등록된 제공자가 없으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 미디어 스트리밍을 건너뜁니다.

### 스트리밍 제공자 예시

<Tabs>
  <Tab title="OpenAI">
    기본값: API 키 `streaming.providers.openai.apiKey` 또는
    `OPENAI_API_KEY`; 모델 `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
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

  </Tab>
  <Tab title="xAI">
    기본값: API 키 `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`;
    엔드포인트 `wss://api.x.ai/v1/stt`; 인코딩 `mulaw`; 샘플 레이트 `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
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

  </Tab>
</Tabs>

## 통화용 TTS

Voice Call은 통화의 스트리밍 음성에 코어 `messages.tts` 구성을 사용합니다. Plugin 구성 아래에서 **동일한 형태**로 이를 재정의할 수 있으며, `messages.tts`와 깊은 병합됩니다.

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

<Warning>
**Microsoft speech는 음성 통화에서 무시됩니다.** 전화 오디오에는 PCM이 필요합니다.
현재 Microsoft 전송은 전화 PCM 출력을 노출하지 않습니다.
</Warning>

동작 참고 사항:

- Plugin 구성 안의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋되는 구성은 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio 미디어 스트리밍이 활성화된 경우 코어 TTS가 사용됩니다. 그렇지 않으면 통화는 제공자 네이티브 음성으로 폴백됩니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 폴백하지 않습니다. 해당 상태에서 전화 TTS를 사용할 수 없으면, 두 재생 경로를 섞는 대신 재생 요청이 실패합니다.
- 전화 TTS가 보조 제공자로 폴백되면, Voice Call은 디버깅을 위해 제공자 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.
- Twilio barge-in 또는 스트림 해제가 대기 중인 TTS 큐를 비우면, 큐에 있던 재생 요청은 재생 완료를 기다리는 발신자를 멈춘 채 두는 대신 완료 상태로 정리됩니다.

### TTS 예시

<Tabs>
  <Tab title="코어 TTS만">
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
  </Tab>
  <Tab title="ElevenLabs로 재정의(통화만)">
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
  </Tab>
  <Tab title="OpenAI 모델 재정의(깊은 병합)">
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
  </Tab>
</Tabs>

## 인바운드 통화

인바운드 정책의 기본값은 `disabled`입니다. 인바운드 통화를 활성화하려면 다음을 설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"`는 보증 수준이 낮은 발신자 ID 필터입니다. 이
Plugin은 제공자가 제공한 `From` 값을 정규화하고 이를 `allowFrom`과 비교합니다.
Webhook 검증은 제공자의 전달과 페이로드 무결성을 인증하지만,
PSTN/VoIP 발신 번호 소유권을 **증명하지는 않습니다**. `allowFrom`은
강력한 발신자 신원이 아니라 발신자 ID 필터링으로 취급하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`,
`responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 번호별 라우팅

하나의 Voice Call Plugin이 여러 전화번호의 통화를 받고 각 번호가 서로 다른 회선처럼 동작해야 할 때 `numbers`를 사용합니다. 예를 들어, 한 번호는 캐주얼한 개인 비서를 사용하고 다른 번호는 비즈니스 페르소나, 다른 응답 에이전트, 다른 TTS 음성을 사용할 수 있습니다.

라우트는 제공자가 제공한 다이얼된 `To` 번호에서 선택됩니다. 키는
E.164 번호여야 합니다. 통화가 도착하면 Voice Call은 일치하는 라우트를 한 번 해석하고,
일치한 라우트를 통화 레코드에 저장한 뒤, 인사, 클래식 자동 응답 경로,
실시간 상담 경로, TTS 재생에 해당 유효 구성을 재사용합니다. 일치하는 라우트가 없으면 전역 Voice Call 구성이 사용됩니다.
아웃바운드 통화는 `numbers`를 사용하지 않습니다. 통화를 시작할 때 아웃바운드 대상, 메시지, 세션을 명시적으로 전달하세요.

라우트 재정의는 현재 다음을 지원합니다.

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 라우트 값은 전역 Voice Call `tts` 구성 위에 깊은 병합되므로,
대개 제공자 음성만 재정의하면 됩니다.

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### 음성 출력 계약

자동 응답의 경우, Voice Call은 시스템 프롬프트에 엄격한 음성 출력 계약을 덧붙입니다.

```text
{"spoken":"..."}
```

Voice Call은 방어적으로 음성 텍스트를 추출합니다.

- reasoning/error 콘텐츠로 표시된 페이로드를 무시합니다.
- 직접 JSON, fenced JSON, 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 폴백하고, 계획/메타 성격으로 보이는 도입 문단을 제거합니다.

이렇게 하면 음성 재생이 발신자에게 보여 줄 텍스트에 집중되고,
계획 텍스트가 오디오로 유출되는 일을 방지할 수 있습니다.

### 대화 시작 동작

아웃바운드 `conversation` 통화의 경우, 첫 메시지 처리는 실시간 재생 상태와 연결됩니다.

- barge-in 큐 비우기와 자동 응답은 초기 인사가 실제로 말해지는 동안에만 억제됩니다.
- 초기 재생이 실패하면 통화는 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 큐에 남습니다.
- Twilio 스트리밍의 초기 재생은 추가 지연 없이 스트림 연결 시 시작됩니다.
- barge-in은 활성 재생을 중단하고 아직 재생되지 않은 큐의 Twilio TTS 항목을 비웁니다. 비워진 항목은 건너뜀으로 resolve되므로, 후속 응답 로직은 결코 재생되지 않을 오디오를 기다리지 않고 계속 진행할 수 있습니다.
- 실시간 음성 대화는 실시간 스트림 자체의 첫 턴을 사용합니다. Voice Call은 해당 초기 메시지에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로, 아웃바운드 `<Connect><Stream>` 세션은 연결된 상태로 유지됩니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림 연결이 끊기면, Voice Call은 통화를 자동 종료하기 전에 **2000 ms**를 기다립니다.

- 해당 시간 안에 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 후에도 스트림이 다시 등록되지 않으면, 활성 통화가 멈춰 남지 않도록 통화를 종료합니다.

## 오래된 통화 reaper

종료 Webhook을 받지 못한 통화(예: 완료되지 않는 알림 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용합니다. 기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** 알림 스타일 흐름에는 `120`-`300`초.
- 정상 통화가 끝날 수 있도록 이 값을 **`maxDurationSeconds`보다 높게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30-60`초입니다.

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

프록시나 터널이 Gateway 앞에 있을 때, 이 Plugin은 서명 검증을 위해 공개 URL을 재구성합니다. 다음 옵션은 어떤 전달 헤더를 신뢰할지 제어합니다.

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  전달 헤더의 호스트 허용 목록입니다.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  허용 목록 없이 전달 헤더를 신뢰합니다.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  요청 원격 IP가 목록과 일치할 때만 전달 헤더를 신뢰합니다.
</ParamField>

추가 보호:

- Webhook **재생 공격 방지**는 Twilio와 Plivo에 대해 활성화되어 있습니다. 재생된 유효 Webhook 요청은 확인 응답되지만 부수 효과는 건너뜁니다.
- Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로, 오래되었거나 재생된 음성 콜백이 더 새로운 대기 중인 전사 턴을 충족할 수 없습니다.
- 인증되지 않은 Webhook 요청은 제공자가 요구하는 서명 헤더가 없을 때 본문을 읽기 전에 거부됩니다.
- voice-call Webhook은 공유 사전 인증 본문 프로필(64 KB / 5초)과 함께 서명 검증 전에 IP별 진행 중 요청 상한을 사용합니다.

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Gateway가 이미 실행 중이면, 운영용 `voicecall` 명령은 CLI가 두 번째
Webhook 서버를 바인딩하지 않도록 Gateway 소유 voice-call 런타임에 위임됩니다.
도달 가능한 Gateway가 없으면, 명령은 독립 실행형 CLI 런타임으로 폴백됩니다.

`latency`는 기본 음성 통화 저장 경로에서 `calls.jsonl`을 읽습니다.
다른 로그를 지정하려면 `--file <path>`를 사용하고, 분석을 마지막 N개 레코드(기본값 200개)로 제한하려면 `--last <n>`을 사용하세요. 출력에는 턴 지연 시간과 듣기 대기 시간의 p50/p90/p99가 포함됩니다.

## 에이전트 도구

도구 이름: `voice_call`.

| 작업            | 인수                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

이 저장소에는 `skills/voice-call/SKILL.md`에 일치하는 Skills 문서가 포함되어 있습니다.

## Gateway RPC

| 메서드             | 인수                                       |
| ------------------ | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence`는 `mode: "conversation"`과 함께 사용할 때만 유효합니다. 알림 모드 호출에서 연결 후 숫자가 필요하면 호출이 생성된 뒤 `voicecall.dtmf`를 사용해야 합니다.

## 문제 해결

### 설정에서 Webhook 노출에 실패함

Gateway를 실행하는 동일한 환경에서 설정을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, `plivo`의 경우 `webhook-exposure`가 녹색이어야 합니다. 구성된 `publicUrl`이 로컬 또는 사설 네트워크 공간을 가리키면 통신사가 해당 주소로 다시 호출할 수 없기 때문에 여전히 실패합니다. `publicUrl`로 `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, 또는 `fd00::/8`을 사용하지 마세요.

Twilio 알림 모드 아웃바운드 호출은 초기 `<Say>` TwiML을 호출 생성 요청에 직접 보내므로, 첫 음성 메시지는 Twilio가 Webhook TwiML을 가져오는 것에 의존하지 않습니다. 상태 콜백, 대화 호출, 연결 전 DTMF, 실시간 스트림, 연결 후 호출 제어에는 여전히 공개 Webhook이 필요합니다.

공개 노출 경로 하나를 사용하세요.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

구성을 변경한 후 Gateway를 재시작하거나 다시 로드한 다음 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 `--yes`를 전달하지 않는 한 드라이 런입니다.

### 제공자 자격 증명이 실패함

선택한 제공자와 필요한 자격 증명 필드를 확인하세요.

- Twilio: `twilio.accountSid`, `twilio.authToken`, `fromNumber`, 또는 `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, `fromNumber`.

자격 증명은 Gateway 호스트에 있어야 합니다. 로컬 셸 프로필을 편집해도 Gateway가 재시작되거나 환경을 다시 로드하기 전까지는 이미 실행 중인 Gateway에 영향을 주지 않습니다.

### 호출은 시작되지만 제공자 Webhook이 도착하지 않음

제공자 콘솔이 정확한 공개 Webhook URL을 가리키는지 확인하세요.

```text
https://voice.example.com/voice/webhook
```

그런 다음 런타임 상태를 검사하세요.

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

일반적인 원인:

- `publicUrl`이 `serve.path`와 다른 경로를 가리킵니다.
- Gateway가 시작된 뒤 터널 URL이 변경되었습니다.
- 프록시가 요청을 전달하지만 host/proto 헤더를 제거하거나 다시 작성합니다.
- 방화벽 또는 DNS가 공개 호스트 이름을 Gateway가 아닌 다른 위치로 라우팅합니다.
- 음성 통화 Plugin이 활성화되지 않은 상태로 Gateway가 재시작되었습니다.

Gateway 앞에 역방향 프록시 또는 터널이 있는 경우 `webhookSecurity.allowedHosts`를 공개 호스트 이름으로 설정하거나, 알려진 프록시 주소에 `webhookSecurity.trustedProxyIPs`를 사용하세요. `webhookSecurity.trustForwardingHeaders`는 프록시 경계가 사용자의 제어 아래 있을 때만 사용하세요.

### 서명 검증 실패

제공자 서명은 OpenClaw가 들어오는 요청에서 재구성한 공개 URL을 기준으로 확인됩니다. 서명이 실패하면:

- 제공자 Webhook URL이 스킴, 호스트, 경로를 포함해 `publicUrl`과 정확히 일치하는지 확인하세요.
- ngrok 무료 티어 URL의 경우 터널 호스트 이름이 변경되면 `publicUrl`을 업데이트하세요.
- 프록시가 원래 host 및 proto 헤더를 보존하는지 확인하거나 `webhookSecurity.allowedHosts`를 구성하세요.
- 로컬 테스트 외부에서는 `skipSignatureVerification`을 활성화하지 마세요.

### Google Meet Twilio 참여 실패

Google Meet은 Twilio 전화 접속 참여에 이 Plugin을 사용합니다. 먼저 음성 통화를 확인하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

그런 다음 Google Meet 전송 방식을 명시적으로 확인하세요.

```bash
openclaw googlemeet setup --transport twilio
```

음성 통화는 정상인데 Meet 참가자가 참여하지 않으면 Meet 전화 접속 번호, PIN, `--dtmf-sequence`를 확인하세요. 전화 통화는 정상이어도 회의가 잘못된 DTMF 시퀀스를 거부하거나 무시할 수 있습니다.

Google Meet은 Meet DTMF 시퀀스와 인트로 텍스트를 `voicecall.start`에 전달합니다. Twilio 호출의 경우 음성 통화는 DTMF TwiML을 먼저 제공하고, Webhook으로 다시 리디렉션한 다음, 저장된 인트로가 전화 참가자가 회의에 참여한 뒤 생성되도록 실시간 미디어 스트림을 엽니다.

라이브 단계 추적에는 `openclaw logs --follow`를 사용하세요. 정상적인 Twilio Meet 참여는 다음 순서로 로그를 남깁니다.

- Google Meet이 Twilio 참여를 음성 통화에 위임합니다.
- 음성 통화가 연결 전 DTMF TwiML을 저장합니다.
- Twilio 초기 TwiML이 실시간 처리 전에 소비되고 제공됩니다.
- 음성 통화가 Twilio 호출용 실시간 TwiML을 제공합니다.
- 실시간 브리지가 초기 인사말을 대기열에 넣은 상태로 시작됩니다.

`openclaw voicecall tail`은 계속 영구 저장된 호출 레코드를 표시합니다. 호출 상태와 전사에는 유용하지만, 모든 Webhook/실시간 전환이 여기에 나타나는 것은 아닙니다.

### 실시간 호출에 음성이 없음

오디오 모드가 하나만 활성화되어 있는지 확인하세요. `realtime.enabled`와 `streaming.enabled`는 둘 다 true일 수 없습니다.

실시간 Twilio 호출의 경우 다음도 확인하세요.

- 실시간 제공자 Plugin이 로드되고 등록되어 있습니다.
- `realtime.provider`가 설정되지 않았거나 등록된 제공자를 지정합니다.
- 제공자 API 키를 Gateway 프로세스에서 사용할 수 있습니다.
- `openclaw logs --follow`에 실시간 TwiML 제공, 실시간 브리지 시작, 초기 인사말 대기열 추가가 표시됩니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [텍스트 음성 변환](/ko/tools/tts)
- [음성 깨우기](/ko/nodes/voicewake)
