---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸려고 합니다
    - 음성 통화 Plugin을 구성하거나 개발하는 중입니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 전사가 필요합니다
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 발신 음성 통화를 걸고 수신 음성 통화를 받으며, 선택적으로 실시간 음성 및 스트리밍 전사를 사용할 수 있습니다
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-05-10T19:47:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94e3942b8330ebf2014f1899267f69f8a135859cfa1002ae390244a4f89883d6
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin을 통한 OpenClaw용 음성 통화입니다. 발신 알림,
다중 턴 대화, 전이중 실시간 음성, 스트리밍
전사, 허용 목록 정책이 적용된 수신 통화를 지원합니다.

**현재 제공자:** `twilio`(Programmable Voice + Media Streams),
`telnyx`(Call Control v2), `plivo`(Voice API + XML transfer + GetInput
speech), `mock`(개발/네트워크 없음).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부**에서 실행됩니다. 원격
Gateway를 사용하는 경우 Gateway를 실행하는 머신에 Plugin을 설치하고
구성한 다음, Gateway를 다시 시작하여 로드하세요.
</Note>

## 빠른 시작

<Steps>
  <Step title="Plugin 설치">
    <Tabs>
      <Tab title="npm에서">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="로컬 폴더에서(개발)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    현재 공식 릴리스 태그를 따르려면 기본 패키지를 사용하세요. 재현 가능한
    설치가 필요할 때만 정확한 버전을 고정하세요.

    이후 Plugin이 로드되도록 Gateway를 다시 시작하세요.

  </Step>
  <Step title="제공자 및 Webhook 구성">
    `plugins.entries.voice-call.config` 아래에 구성을 설정하세요(전체 형태는
    아래 [구성](#configuration) 참조). 최소한 `provider`, 제공자 자격 증명,
    `fromNumber`, 공개적으로 접근 가능한 Webhook URL이 필요합니다.
  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw voicecall setup
    ```

    기본 출력은 채팅 로그와 터미널에서 읽기 쉽습니다. Plugin 활성화,
    제공자 자격 증명, Webhook 노출, 그리고 하나의 오디오 모드(`streaming` 또는
    `realtime`)만 활성화되어 있는지 확인합니다. 스크립트에는
    `--json`을 사용하세요.

  </Step>
  <Step title="스모크 테스트">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 드라이런입니다. 짧은 발신 알림 통화를 실제로 걸려면
    `--yes`를 추가하세요.

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정은 **공개 Webhook URL**로 확인되어야 합니다.
`publicUrl`, 터널 URL, Tailscale URL 또는 serve 대체 경로가
loopback이나 사설 네트워크 공간으로 확인되면, 통신사 Webhook을 받을 수 없는
제공자를 시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`이지만 선택한 제공자에 자격 증명이 없으면,
Gateway 시작 로그는 누락된 키와 함께 설정 미완료 경고를 기록하고
런타임 시작을 건너뜁니다. 명령, RPC 호출, 에이전트 도구는 사용 시에도
정확히 누락된 제공자 구성을 반환합니다.

<Note>
음성 통화 자격 증명은 SecretRef를 허용합니다. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, `plugins.entries.voice-call.config.tts.providers.*.apiKey`는 표준 SecretRef 표면을 통해 해석됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하세요.
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
    - `mock`은 로컬 개발 제공자입니다(네트워크 호출 없음).
    - `skipSignatureVerification`이 true가 아니면 Telnyx에는 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 티어에서는 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)인 경우에만 잘못된 서명이 있는 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 티어 URL은 변경되거나 중간 페이지 동작이 추가될 수 있습니다. `publicUrl`이 달라지면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale 퍼널을 권장합니다.

  </Accordion>
  <Accordion title="스트리밍 연결 한도">
    - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`는 인증되지 않은 사전 시작 소켓의 총 수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`는 소스 IP당 인증되지 않은 사전 시작 소켓 수를 제한합니다.
    - `streaming.maxConnections`는 열린 미디어 스트림 소켓의 총 수를 제한합니다(대기 중 + 활성).

  </Accordion>
  <Accordion title="레거시 구성 마이그레이션">
    `provider: "log"`, `twilio.from` 또는 레거시
    `streaming.*` OpenAI 키를 사용하는 이전 구성은 `openclaw doctor --fix`로
    다시 작성됩니다. 런타임 대체 경로는 현재도 이전 음성 통화 키를 허용하지만,
    다시 작성하는 경로는 `openclaw doctor --fix`이며 호환성 심은
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
시작되어야 할 때, 예를 들어 접수, 예약, IVR 또는 같은 전화번호가
서로 다른 회의를 나타낼 수 있는 Google Meet 브리지 흐름에서는
`sessionScope: "per-call"`을 설정하세요.

## 실시간 음성 대화

`realtime`은 라이브 통화 오디오에 사용할 전이중 실시간 음성 제공자를
선택합니다. 오디오를 실시간 전사 제공자에게 전달하기만 하는
`streaming`과는 별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화당
하나의 오디오 모드를 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 음성 제공자를 사용합니다.
- 번들 실시간 음성 제공자: Google Gemini Live(`google`) 및 OpenAI(`openai`)이며, 각 제공자 Plugin이 등록합니다.
- 제공자가 소유한 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공유 `openclaw_agent_consult` 실시간 도구를 노출합니다. 발신자가 더 깊은 추론, 최신 정보 또는 일반 OpenClaw 도구를 요청할 때 실시간 모델이 이를 호출할 수 있습니다.
- `realtime.consultPolicy`는 실시간 모델이 언제 `openclaw_agent_consult`를 호출해야 하는지에 대한 지침을 선택적으로 추가합니다.
- `realtime.agentContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call은 제한된 에이전트 ID, 시스템 프롬프트 재정의, 선택된 워크스페이스 파일 캡슐을 세션 설정 시 실시간 제공자 지침에 주입합니다.
- `realtime.fastContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call은 먼저 상담 질문에 대해 색인된 메모리/세션 컨텍스트를 검색하고, 전체 상담 에이전트로 대체하기 전에 `realtime.fastContext.timeoutMs` 내에 해당 스니펫을 실시간 모델에 반환합니다. 단, `realtime.fastContext.fallbackToConsult`가 true인 경우에만 전체 상담 에이전트로 대체합니다.
- `realtime.provider`가 등록되지 않은 제공자를 가리키거나 등록된 실시간 음성 제공자가 전혀 없으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 실시간 미디어를 건너뜁니다.
- 상담 세션 키는 가능한 경우 저장된 통화 세션을 재사용한 다음, 구성된 `sessionScope`로 대체합니다(기본값은 `per-phone`, 격리된 통화의 경우 `per-call`).

### 도구 정책

`realtime.toolPolicy`는 상담 실행을 제어합니다.

| 정책             | 동작                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 상담 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다. |
| `owner`          | 상담 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 허용합니다.                                                   |
| `none`           | 상담 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 여전히 실시간 제공자에게 전달됩니다.                                      |

`realtime.consultPolicy`는 실시간 모델 지침만 제어합니다.

| 정책          | 지침                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | 기본 프롬프트를 유지하고 제공자가 상담 도구를 언제 호출할지 결정하게 합니다.                   |
| `substantive` | 간단한 대화 연결 표현은 직접 답하고, 사실, 메모리, 도구 또는 컨텍스트 전에는 상담합니다.       |
| `always`      | 모든 실질적인 답변 전에 상담합니다.                                                            |

### 에이전트 음성 컨텍스트

일반 턴에서 전체 에이전트 상담 왕복 비용을 지불하지 않고도 음성 브리지가
구성된 OpenClaw 에이전트처럼 들려야 할 때 `realtime.agentContext`를
활성화하세요. 컨텍스트 캡슐은 실시간 세션이 생성될 때 한 번 추가되므로
턴당 지연 시간을 추가하지 않습니다. `openclaw_agent_consult` 호출은
여전히 전체 OpenClaw 에이전트를 실행하며, 도구 작업, 최신 정보,
메모리 조회 또는 워크스페이스 상태에 사용해야 합니다.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### 실시간 제공자 예시

<Tabs>
  <Tab title="Google Gemini Live">
    기본값: API 키는 `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` 또는 `GOOGLE_GENERATIVE_AI_API_KEY`; 모델은
    `gemini-2.5-flash-native-audio-preview-12-2025`; 음성은 `Kore`입니다.
    더 길고 다시 연결 가능한 통화를 위해 `sessionResumption` 및
    `contextWindowCompression`은 기본적으로 켜져 있습니다. 전화 오디오에서
    더 빠른 턴 전환을 조정하려면 `silenceDurationMs`, `startSensitivity`,
    `endSensitivity`를 사용하세요.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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
[OpenAI 제공자](/ko/providers/openai)를 참조하세요.

## 스트리밍 전사

`streaming`은 라이브 통화 오디오에 사용할 실시간 전사 제공자를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 등록된 첫 번째 실시간 전사 제공자를 사용합니다.
- 번들 실시간 전사 제공자: Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)이며, 각 제공자 Plugin에서 등록합니다.
- 제공자가 소유한 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- Twilio가 수락된 스트림 `start` 메시지를 보낸 후, Voice Call은 스트림을 즉시 등록하고, 제공자가 연결되는 동안 수신 미디어를 전사 제공자를 통해 큐에 넣으며, 실시간 전사가 준비된 후에만 초기 인사말을 시작합니다.
- `streaming.provider`가 등록되지 않은 제공자를 가리키거나 등록된 제공자가 없으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 미디어 스트리밍을 건너뜁니다.

### 스트리밍 제공자 예시

<Tabs>
  <Tab title="OpenAI">
    기본값: API 키는 `streaming.providers.openai.apiKey` 또는
    `OPENAI_API_KEY`; 모델은 `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`입니다.

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
    기본값: API 키는 `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`;
    엔드포인트는 `wss://api.x.ai/v1/stt`; 인코딩은 `mulaw`; 샘플 레이트는 `8000`;
    `endpointingMs: 800`; `interimResults: true`입니다.

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

Voice Call은 통화의 스트리밍 음성에 코어 `messages.tts` 구성을 사용합니다.
Plugin 구성 아래에서 **동일한 구조**로 재정의할 수 있으며,
이는 `messages.tts`와 깊게 병합됩니다.

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
**Microsoft 음성은 음성 통화에서 무시됩니다.** 전화 오디오에는 PCM이 필요하며,
현재 Microsoft 전송은 전화용 PCM 출력을 노출하지 않습니다.
</Warning>

동작 참고 사항:

- Plugin 구성 안의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋된 구성은 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio 미디어 스트리밍이 활성화된 경우 코어 TTS가 사용되며, 그렇지 않으면 통화는 제공자 네이티브 음성으로 대체됩니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 대체하지 않습니다. 해당 상태에서 전화용 TTS를 사용할 수 없으면, 두 재생 경로를 섞는 대신 재생 요청이 실패합니다.
- 전화용 TTS가 보조 제공자로 대체되면, Voice Call은 디버깅을 위해 제공자 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.
- Twilio 끼어들기 또는 스트림 해제가 대기 중인 TTS 큐를 비우면, 큐에 있던 재생 요청은 발신자가 재생 완료를 기다리며 멈춰 있는 대신 완료 처리됩니다.

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

## 수신 통화

인바운드 정책의 기본값은 `disabled`입니다. 인바운드 호출을 활성화하려면 다음을 설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"`는 보증 수준이 낮은 발신자 ID 검사입니다.
plugin은 공급자가 제공한 `From` 값을 정규화하고 이를 `allowFrom`과
비교합니다. Webhook 검증은 공급자 전달과 페이로드 무결성을 인증하지만,
PSTN/VoIP 발신자 번호 소유권을 증명하지는 **않습니다**. `allowFrom`은
강력한 발신자 신원이 아니라 발신자 ID 필터링으로 취급하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`,
`responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 번호별 라우팅

하나의 Voice Call plugin이 여러 전화번호의 호출을 수신하고 각 번호가
서로 다른 회선처럼 동작해야 할 때 `numbers`를 사용하세요. 예를 들어,
한 번호는 캐주얼한 개인 비서를 사용하고 다른 번호는 비즈니스
페르소나, 다른 응답 에이전트, 다른 TTS 음성을 사용할 수 있습니다.

라우트는 공급자가 제공한 다이얼된 `To` 번호에서 선택됩니다. 키는
E.164 번호여야 합니다. 호출이 도착하면 Voice Call은 일치하는 라우트를
한 번 해석하고, 일치한 라우트를 호출 레코드에 저장한 다음, greeting,
클래식 자동 응답 경로, 실시간 상담 경로, TTS 재생에 해당 유효 구성을
재사용합니다. 일치하는 라우트가 없으면 전역 Voice Call 구성이
사용됩니다. 발신 호출은 `numbers`를 사용하지 않습니다. 호출을 시작할
때 발신 대상, 메시지, 세션을 명시적으로 전달하세요.

라우트 재정의는 현재 다음을 지원합니다.

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 라우트 값은 전역 Voice Call `tts` 구성 위에 딥 머지되므로, 보통은
공급자 음성만 재정의하면 됩니다.

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

자동 응답의 경우 Voice Call은 엄격한 음성 출력 계약을 시스템 프롬프트에
추가합니다.

```text
{"spoken":"..."}
```

Voice Call은 방어적으로 음성 텍스트를 추출합니다.

- reasoning/error 콘텐츠로 표시된 페이로드를 무시합니다.
- 직접 JSON, fenced JSON 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 폴백하고 계획/메타 성격으로 보이는 도입 문단을 제거합니다.

이렇게 하면 음성 재생이 발신자에게 전달되는 텍스트에 집중되고 계획
텍스트가 오디오로 누출되는 것을 방지할 수 있습니다.

### 대화 시작 동작

발신 `conversation` 호출의 경우 첫 메시지 처리는 라이브 재생 상태와
연결됩니다.

- 끼어들기 큐 비우기와 자동 응답은 초기 greeting이 실제로 말해지는 동안에만 억제됩니다.
- 초기 재생이 실패하면 호출은 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 큐에 남습니다.
- Twilio 스트리밍의 초기 재생은 추가 지연 없이 스트림 연결 시 시작됩니다.
- 끼어들기는 활성 재생을 중단하고 아직 재생되지 않은 큐의 Twilio TTS 항목을 지웁니다. 지워진 항목은 건너뜀으로 resolve되므로, 후속 응답 로직은 절대 재생되지 않을 오디오를 기다리지 않고 계속 진행할 수 있습니다.
- 실시간 음성 대화는 실시간 스트림 자체의 시작 턴을 사용합니다. Voice Call은 해당 초기 메시지에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로, 발신 `<Connect><Stream>` 세션은 연결된 상태로 유지됩니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림 연결이 해제되면 Voice Call은 호출을 자동 종료하기
전에 **2000 ms**를 기다립니다.

- 해당 기간 동안 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 이후에도 스트림이 다시 등록되지 않으면, 활성 호출이 멈춘 상태로 남지 않도록 호출이 종료됩니다.

## 오래된 호출 정리기

터미널 Webhook을 받지 못하는 호출(예: 완료되지 않는 notify-mode 호출)을
종료하려면 `staleCallReaperSeconds`를 사용하세요. 기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** 알림 스타일 플로우에는 `120`~`300`초.
- 일반 호출이 완료될 수 있도록 이 값을 **`maxDurationSeconds`보다 높게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

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

프록시나 터널이 Gateway 앞에 있는 경우, Plugin은 서명 검증을 위해
공개 URL을 재구성합니다. 이 옵션들은 신뢰할 전달 헤더를 제어합니다.

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  전달 헤더의 호스트 허용 목록입니다.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  허용 목록 없이 전달 헤더를 신뢰합니다.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  요청 원격 IP가 목록과 일치하는 경우에만 전달 헤더를 신뢰합니다.
</ParamField>

추가 보호 기능:

- Twilio와 Plivo에 대해 Webhook **재생 보호**가 활성화됩니다. 재생된 유효한 Webhook 요청은 승인되지만 부수 효과는 건너뜁니다.
- Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로, 오래되었거나 재생된 음성 콜백은 더 새로운 대기 중인 트랜스크립트 턴을 충족할 수 없습니다.
- 인증되지 않은 Webhook 요청은 제공자의 필수 서명 헤더가 없으면 본문을 읽기 전에 거부됩니다.
- voice-call Webhook은 공유 사전 인증 본문 프로필(64KB / 5초)과 서명 검증 전 IP별 진행 중 요청 제한을 사용합니다.

안정적인 공개 호스트 예시:

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

Gateway가 이미 실행 중이면 운영용 `voicecall` 명령은
Gateway가 소유한 voice-call 런타임에 위임되므로 CLI가 두 번째
Webhook 서버를 바인딩하지 않습니다. 도달 가능한 Gateway가 없으면
명령은 독립 실행형 CLI 런타임으로 폴백합니다.

`latency`는 기본 voice-call 저장소 경로에서 `calls.jsonl`을 읽습니다.
다른 로그를 지정하려면 `--file <path>`를 사용하고, 분석을 마지막 N개
레코드(기본값 200개)로 제한하려면 `--last <n>`을 사용하세요. 출력에는
턴 지연 시간과 듣기 대기 시간의 p50/p90/p99가 포함됩니다.

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

이 저장소는 `skills/voice-call/SKILL.md`에 일치하는 Skill 문서를 제공합니다.

## Gateway RPC

| 메서드               | 인수                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence`는 `mode: "conversation"`에서만 유효합니다. 알림 모드 호출은
연결 후 숫자가 필요하면 호출이 존재한 뒤 `voicecall.dtmf`를 사용해야 합니다.

## 문제 해결

### 설정이 Webhook 노출에 실패함

Gateway를 실행하는 동일한 환경에서 설정을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, `plivo`의 경우 `webhook-exposure`가 녹색이어야 합니다.
구성된 `publicUrl`도 로컬 또는 사설 네트워크 공간을 가리키면 통신사가
해당 주소로 콜백할 수 없으므로 실패합니다. `publicUrl`로 `localhost`,
`127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8`을 사용하지 마세요.

Twilio 알림 모드 아웃바운드 호출은 초기 `<Say>` TwiML을 호출 생성 요청에
직접 보내므로, 처음 재생되는 메시지는 Twilio가 Webhook TwiML을 가져오는
것에 의존하지 않습니다. 상태 콜백, 대화 호출, 연결 전 DTMF, 실시간 스트림,
연결 후 호출 제어에는 여전히 공개 Webhook이 필요합니다.

하나의 공개 노출 경로를 사용하세요.

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

구성을 변경한 뒤 Gateway를 다시 시작하거나 다시 로드한 다음 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 `--yes`를 전달하지 않으면 드라이런입니다.

### 제공자 자격 증명 실패

선택한 제공자와 필요한 자격 증명 필드를 확인하세요.

- Twilio: `twilio.accountSid`, `twilio.authToken`, `fromNumber` 또는
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`,
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, `fromNumber`.

자격 증명은 Gateway 호스트에 있어야 합니다. 로컬 셸 프로필을 편집해도
이미 실행 중인 Gateway에는 다시 시작하거나 환경을 다시 로드하기 전까지
영향을 주지 않습니다.

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
- 프록시가 요청을 전달하지만 host/proto 헤더를 제거하거나 다시 씁니다.
- 방화벽 또는 DNS가 공개 호스트 이름을 Gateway가 아닌 다른 곳으로 라우팅합니다.
- Voice Call Plugin이 활성화되지 않은 상태로 Gateway가 다시 시작되었습니다.

리버스 프록시나 터널이 Gateway 앞에 있는 경우
`webhookSecurity.allowedHosts`를 공개 호스트 이름으로 설정하거나, 알려진 프록시
주소에 대해 `webhookSecurity.trustedProxyIPs`를 사용하세요.
`webhookSecurity.trustForwardingHeaders`는 프록시 경계가 사용자의 통제하에 있을 때만
사용하세요.

### 서명 검증 실패

제공자 서명은 OpenClaw가 들어오는 요청에서 재구성한 공개 URL을 기준으로
확인됩니다. 서명이 실패하면:

- 제공자 Webhook URL이 스킴, 호스트, 경로를 포함해 `publicUrl`과 정확히 일치하는지 확인하세요.
- ngrok 무료 계층 URL의 경우 터널 호스트 이름이 바뀌면 `publicUrl`을 업데이트하세요.
- 프록시가 원래 host 및 proto 헤더를 보존하는지 확인하거나
  `webhookSecurity.allowedHosts`를 구성하세요.
- 로컬 테스트 외에는 `skipSignatureVerification`을 활성화하지 마세요.

### Google Meet Twilio 참가 실패

Google Meet은 Twilio 전화 접속 참가에 이 Plugin을 사용합니다. 먼저 Voice Call을 확인하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

그런 다음 Google Meet 전송을 명시적으로 확인하세요.

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call은 정상인데 Meet 참가자가 참가하지 않는다면 Meet 전화 접속 번호, PIN,
`--dtmf-sequence`를 확인하세요. 전화 통화는 정상일 수 있지만 회의가 잘못된 DTMF
시퀀스를 거부하거나 무시할 수 있습니다.

Google Meet은 연결 전 DTMF 시퀀스와 함께 `voicecall.start`를 통해 Twilio 전화
구간을 시작합니다. PIN에서 파생된 시퀀스에는 Google Meet Plugin의
`voiceCall.dtmfDelayMs`가 선행 Twilio 대기 숫자로 포함됩니다. 기본값은 Meet 전화
접속 프롬프트가 늦게 도착할 수 있기 때문에 12초입니다. 그러면 Voice Call은
소개 인사말이 요청되기 전에 실시간 처리로 다시 리디렉션합니다.

실시간 단계 추적에는 `openclaw logs --follow`를 사용하세요. 정상적인 Twilio Meet
참가는 다음 순서로 로그를 남깁니다.

- Google Meet이 Twilio 참가를 Voice Call에 위임합니다.
- Voice Call이 연결 전 DTMF TwiML을 저장합니다.
- Twilio 초기 TwiML이 실시간 처리 전에 소비되고 제공됩니다.
- Voice Call이 Twilio 호출에 대한 실시간 TwiML을 제공합니다.
- Google Meet이 DTMF 후 지연 뒤 `voicecall.speak`로 소개 음성을 요청합니다.

`openclaw voicecall tail`은 여전히 유지된 호출 레코드를 보여줍니다. 호출 상태와
트랜스크립트에는 유용하지만 모든 Webhook/실시간 전환이 거기에 나타나는 것은
아닙니다.

### 실시간 호출에 음성이 없음

하나의 오디오 모드만 활성화되어 있는지 확인하세요. `realtime.enabled`와
`streaming.enabled`는 둘 다 true일 수 없습니다.

실시간 Twilio 호출의 경우 다음도 확인하세요.

- 실시간 제공자 Plugin이 로드되고 등록되어 있습니다.
- `realtime.provider`가 설정되지 않았거나 등록된 제공자의 이름입니다.
- 제공자 API 키를 Gateway 프로세스에서 사용할 수 있습니다.
- `openclaw logs --follow`에 실시간 TwiML이 제공되고, 실시간 브리지가
  시작되며, 초기 인사말이 대기열에 추가된 것으로 표시됩니다.

## 관련

- [대화 모드](/ko/nodes/talk)
- [텍스트 음성 변환](/ko/tools/tts)
- [음성 깨우기](/ko/nodes/voicewake)
