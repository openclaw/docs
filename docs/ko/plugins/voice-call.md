---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸고 싶습니다
    - 음성 통화 플러그인을 구성하거나 개발하고 있습니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 전사가 필요함
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 발신 음성 통화를 걸고 수신 음성 통화를 받으며, 선택적으로 실시간 음성 및 스트리밍 전사를 사용할 수 있습니다
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-06-27T17:58:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
    source_path: plugins/voice-call.md
    workflow: 16
---

OpenClaw용 음성 통화를 Plugin으로 제공합니다. 아웃바운드 알림,
다중 턴 대화, 전이중 실시간 음성, 스트리밍
전사, 허용 목록 정책이 적용된 인바운드 통화를 지원합니다.

**현재 제공자:** `twilio`(Programmable Voice + Media Streams),
`telnyx`(Call Control v2), `plivo`(Voice API + XML transfer + GetInput
speech), `mock`(개발/네트워크 없음).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다. 원격
Gateway를 사용하는 경우, Gateway를 실행하는 머신에 Plugin을 설치하고
구성한 뒤 Gateway를 다시 시작하여 로드하세요.
</Note>

## 빠른 시작

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    현재 공식 릴리스 태그를 따르려면 버전 없는 패키지를 사용하세요. 재현 가능한
    설치가 필요할 때만 정확한 버전을 고정하세요.

    이후 Plugin이 로드되도록 Gateway를 다시 시작하세요.

  </Step>
  <Step title="Configure provider and webhook">
    `plugins.entries.voice-call.config` 아래에 설정을 지정하세요(전체 형태는
    아래 [구성](#configuration)을 참고). 최소한 `provider`, 제공자 자격 증명,
    `fromNumber`, 공개적으로 접근 가능한 Webhook URL이 필요합니다.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    기본 출력은 채팅 로그와 터미널에서 읽기 좋게 표시됩니다. Plugin 활성화,
    제공자 자격 증명, Webhook 노출, 그리고 하나의 오디오 모드(`streaming` 또는
    `realtime`)만 활성화되어 있는지 확인합니다. 스크립트에는 `--json`을
    사용하세요.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 드라이런입니다. 짧은 아웃바운드 알림 통화를 실제로
    걸려면 `--yes`를 추가하세요.

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정은 반드시 **공개 Webhook URL**로 해석되어야 합니다.
`publicUrl`, 터널 URL, Tailscale URL 또는 serve 폴백이 루프백이나
사설 네트워크 공간으로 해석되면, 통신사 Webhook을 받을 수 없는 제공자를
시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`이지만 선택한 제공자의 자격 증명이 누락된 경우,
Gateway 시작 로그는 누락된 키와 함께 설정 미완료 경고를 기록하고
런타임 시작을 건너뜁니다. 명령, RPC 호출, 에이전트 도구는 사용 시에도
누락된 제공자 구성을 정확히 반환합니다.

<Note>
Voice Call 자격 증명은 SecretRef를 허용합니다. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, `plugins.entries.voice-call.config.tts.providers.*.apiKey`는 표준 SecretRef 표면을 통해 해석됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참고하세요.
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
                  openai: { speakerVoice: "alloy" },
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx, Plivo는 모두 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
    - `mock`은 로컬 개발 제공자입니다(네트워크 호출 없음).
    - Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 티어에서는 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 적용됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 루프백(ngrok 로컬 에이전트)인 경우에만 유효하지 않은 서명의 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 티어 URL은 변경되거나 중간 페이지 동작이 추가될 수 있습니다. `publicUrl`이 달라지면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 권장합니다.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`는 인증되지 않은 시작 전 소켓의 총수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증되지 않은 시작 전 소켓을 제한합니다.
    - `streaming.maxConnections`는 열린 미디어 스트림 소켓의 총수(대기 + 활성)를 제한합니다.

  </Accordion>
  <Accordion title="Legacy config migrations">
    `provider: "log"`, `twilio.from` 또는 기존
    `streaming.*` OpenAI 키를 사용하는 오래된 구성은 `openclaw doctor --fix`로 다시 작성됩니다.
    런타임 폴백은 당분간 기존 voice-call 키를 계속 허용하지만,
    다시 작성 경로는 `openclaw doctor --fix`이며 호환성 shim은
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
반복 통화는 대화 메모리를 유지합니다. 각 통신사 통화가 새 컨텍스트로 시작해야 하는 경우,
예를 들어 접수, 예약, IVR 또는 같은 전화번호가 서로 다른 회의를 나타낼 수 있는
Google Meet 브리지 흐름에서는 `sessionScope: "per-call"`을 설정하세요.

Voice Call은 생성된 세션 키를 구성된 에이전트 네임스페이스
(`agent:<agentId>:voice:*`) 아래에 저장하므로, 다시 시작 후 Gateway 세션 키
정규화가 이루어져도 통화 메모리가 유지됩니다. 명시적인 원시 통합 키도 같은
에이전트 네임스페이스를 사용합니다. 정규 `agent:<configuredAgentId>:*` 키는 해당 소유자를 유지하며,
그 주요 별칭은 core `session.mainKey`와 전역 범위를 따릅니다. 외부 또는
잘못된 형식의 `agent:*` 입력은 구성된 에이전트 아래의 불투명 키로 범위가 지정되며,
`global`과 `unknown`은 전역 센티널로 유지됩니다. Gateway 시작 시 기본 또는
`{agentId}` 템플릿 저장소에서 경로가 하나의 소유자를 증명하는 오래된 원시 키를 승격합니다.
고정된 사용자 지정 저장소에서는 모호한 레거시 행이 소유자를 선택할 만큼 충분한 정보를
담고 있지 않으므로 그대로 둡니다. 새 통화는 정규 에이전트 범위 히스토리를 사용합니다.

## 실시간 음성 대화

`realtime`은 실시간 통화 오디오를 위한 전이중 실시간 음성 제공자를 선택합니다.
이는 오디오를 실시간 전사 제공자에게 전달하기만 하는 `streaming`과 별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화당
하나의 오디오 모드를 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 첫 번째로 등록된 실시간 음성 제공자를 사용합니다.
- 번들 실시간 음성 제공자: Google Gemini Live(`google`)와 OpenAI(`openai`)이며, 각 제공자 Plugin이 등록합니다.
- 제공자 소유 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공유 `openclaw_agent_consult` 실시간 도구를 노출합니다. 발신자가 더 깊은 추론, 현재 정보 또는 일반 OpenClaw 도구를 요청할 때 실시간 모델이 이를 호출할 수 있습니다.
- `realtime.consultPolicy`는 실시간 모델이 언제 `openclaw_agent_consult`를 호출해야 하는지에 대한 지침을 선택적으로 추가합니다.
- `realtime.agentContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call은 세션 설정 시 제한된 에이전트 ID와 선택된 워크스페이스 파일 캡슐을 실시간 제공자 지침에 주입합니다.
- `realtime.fastContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call은 먼저 consult 질문에 대해 인덱싱된 메모리/세션 컨텍스트를 검색하고, `realtime.fastContext.timeoutMs` 내에 해당 스니펫을 실시간 모델에 반환한 뒤 `realtime.fastContext.fallbackToConsult`가 true인 경우에만 전체 consult 에이전트로 폴백합니다.
- `realtime.provider`가 등록되지 않은 제공자를 가리키거나 등록된 실시간 음성 제공자가 전혀 없는 경우, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 실시간 미디어를 건너뜁니다.
- Consult 세션 키는 사용 가능한 경우 저장된 통화 세션을 재사용한 뒤, 구성된 `sessionScope`(`per-phone`이 기본값, 격리된 통화에는 `per-call`)로 폴백합니다.

### 도구 정책

`realtime.toolPolicy`는 consult 실행을 제어합니다.

| 정책             | 동작                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다. |
| `owner`          | consult 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 합니다.                                                     |
| `none`           | consult 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 계속 실시간 제공자에 전달됩니다.                                      |

`realtime.consultPolicy`는 실시간 모델 지침만 제어합니다.

| 정책          | 지침                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------- |
| `auto`        | 기본 프롬프트를 유지하고 제공자가 consult 도구를 언제 호출할지 결정하게 합니다.                  |
| `substantive` | 간단한 대화 연결 표현은 직접 답하고, 사실, 메모리, 도구 또는 컨텍스트 전에는 consult를 수행합니다. |
| `always`      | 모든 실질적인 답변 전에 consult를 수행합니다.                                                     |

### 에이전트 음성 컨텍스트

`realtime.agentContext`는 일반 턴에서 전체 에이전트 consult 왕복 비용을 치르지 않고도 음성 브리지가
구성된 OpenClaw 에이전트처럼 들려야 할 때 활성화하세요. 컨텍스트 캡슐은 realtime 세션이
생성될 때 한 번 추가되므로 턴별 지연 시간이 늘어나지 않습니다.
`openclaw_agent_consult` 호출은 여전히 전체 OpenClaw 에이전트를 실행하며,
도구 작업, 최신 정보, 메모리 조회, 또는 워크스페이스 상태에 사용해야 합니다.

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

### Realtime provider 예시

<Tabs>
  <Tab title="Google Gemini Live">
    기본값: `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, 또는 `GOOGLE_GENERATIVE_AI_API_KEY`의 API 키; 모델
    `gemini-2.5-flash-native-audio-preview-12-2025`; 음성 `Kore`.
    더 길고 재연결 가능한 통화를 위해 `sessionResumption`과
    `contextWindowCompression`은 기본적으로 켜져 있습니다. 전화 음성에서 더 빠른 턴 처리를
    조정하려면 `silenceDurationMs`, `startSensitivity`, `endSensitivity`를 사용하세요.

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
                    speakerVoice: "Kore",
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

provider별 realtime 음성 옵션은 [Google provider](/ko/providers/google) 및
[OpenAI provider](/ko/providers/openai)를 참조하세요.

## Streaming 전사

`streaming`은 실시간 통화 오디오용 realtime 전사 provider를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 realtime 전사 provider를 사용합니다.
- 번들 realtime 전사 provider: Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)이며, 각 provider Plugin이 등록합니다.
- provider 소유 원시 config는 `streaming.providers.<providerId>` 아래에 있습니다.
- Twilio가 수락된 스트림 `start` 메시지를 보낸 뒤, Voice Call은 스트림을 즉시 등록하고, provider가 연결되는 동안 전사 provider를 통해 수신 media를 큐에 넣으며, realtime 전사가 준비된 후에만 초기 인사를 시작합니다.
- `streaming.provider`가 등록되지 않은 provider를 가리키거나 등록된 provider가 없으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 로그에 남기고 media streaming을 건너뜁니다.

### Streaming provider 예시

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
    endpoint `wss://api.x.ai/v1/stt`; encoding `mulaw`; sample rate `8000`;
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

Voice Call은 통화에서 streaming 음성에 코어 `messages.tts` 구성을 사용합니다.
Plugin config 아래에서 **동일한 구조**로 재정의할 수 있으며, 이는 `messages.tts`와
deep-merge됩니다.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft speech는 음성 통화에서 무시됩니다.** 전화 음성에는 PCM이 필요합니다.
현재 Microsoft transport는 전화용 PCM 출력을 노출하지 않습니다.
</Warning>

동작 참고 사항:

- Plugin config 안의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋된 config는 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio media streaming이 활성화되어 있으면 코어 TTS가 사용됩니다. 그렇지 않으면 통화는 provider-native 음성으로 fallback됩니다.
- Twilio media stream이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 fallback하지 않습니다. 해당 상태에서 전화 TTS를 사용할 수 없으면, 두 playback 경로를 섞는 대신 playback 요청이 실패합니다.
- 전화 TTS가 보조 provider로 fallback되면, Voice Call은 디버깅을 위해 provider chain(`from`, `to`, `attempts`)과 함께 경고를 로그에 남깁니다.
- Twilio barge-in 또는 stream teardown이 대기 중인 TTS 큐를 지우면, queued playback 요청은 playback 완료를 기다리는 호출자를 멈춰 두지 않고 settle됩니다.

### TTS 예시

<Tabs>
  <Tab title="Core TTS only">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Override to ElevenLabs (calls only)">
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="OpenAI model override (deep-merge)">
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"`는 낮은 보증 수준의 발신자 ID 스크린입니다.
Plugin은 provider가 제공한 `From` 값을 정규화하고 이를 `allowFrom`과 비교합니다.
Webhook 검증은 provider 전달과 payload 무결성을 인증하지만,
PSTN/VoIP 발신자 번호 소유권을 **증명하지는 않습니다**. `allowFrom`은 강력한 발신자
신원이 아니라 발신자 ID 필터링으로 취급하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`,
`responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 번호별 라우팅

하나의 Voice Call Plugin이 여러 전화번호의 통화를 받고 각 번호가 서로 다른 회선처럼 동작해야 할 때
`numbers`를 사용하세요. 예를 들어 한 번호는 캐주얼한 개인 비서를 사용하고, 다른 번호는 비즈니스
페르소나, 다른 응답 에이전트, 다른 TTS 음성을 사용할 수 있습니다.

라우트는 provider가 제공한 착신 `To` 번호에서 선택됩니다. 키는 E.164 번호여야 합니다.
통화가 도착하면 Voice Call은 일치하는 라우트를 한 번 resolve하고, 일치한 라우트를 call record에
저장한 뒤, 해당 effective config를 greeting, classic auto-response path, realtime consult path,
TTS playback에 재사용합니다. 일치하는 라우트가 없으면 전역 Voice Call config가 사용됩니다.
아웃바운드 통화는 `numbers`를 사용하지 않습니다. 통화를 시작할 때 outbound target, message,
session을 명시적으로 전달하세요.

Route override는 현재 다음을 지원합니다.

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` route 값은 전역 Voice Call `tts` config 위에 deep-merge되므로, 보통 provider 음성만
재정의하면 됩니다.

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### 음성 출력 계약

자동 응답의 경우 Voice Call은 엄격한 음성 출력 계약을 system prompt에 추가합니다.

```text
{"spoken":"..."}
```

Voice Call은 방어적으로 speech text를 추출합니다.

- reasoning/error content로 표시된 payload를 무시합니다.
- 직접 JSON, fenced JSON, 또는 inline `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 fallback하고, 계획/메타로 보이는 앞부분 단락을 제거합니다.

이렇게 하면 spoken playback이 발신자에게 들려줄 텍스트에 집중되고,
계획 텍스트가 오디오로 유출되는 일을 방지할 수 있습니다.

### 대화 시작 동작

아웃바운드 `conversation` 통화에서 첫 메시지 처리는 live playback 상태와 연결됩니다.

- Barge-in queue clear와 auto-response는 initial greeting이 실제로 재생 중일 때만 억제됩니다.
- initial playback이 실패하면 통화는 `listening`으로 돌아가고 initial message는 재시도를 위해 큐에 남습니다.
- Twilio streaming의 initial playback은 stream connect 시 추가 지연 없이 시작됩니다.
- Barge-in은 active playback을 중단하고 queued-but-not-yet-playing Twilio TTS 항목을 지웁니다. 지워진 항목은 skipped로 resolve되므로, 후속 응답 로직은 절대 재생되지 않을 오디오를 기다리지 않고 계속될 수 있습니다.
- Realtime 음성 대화는 realtime stream 자체의 opening turn을 사용합니다. Voice Call은 해당 initial message에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로, outbound `<Connect><Stream>` 세션은 계속 연결된 상태를 유지합니다.

### Twilio stream disconnect grace

Twilio 미디어 스트림 연결이 끊기면 Voice Call은 통화를 자동 종료하기 전에 **2000 ms**를 기다립니다.

- 해당 시간 안에 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 후에도 스트림이 다시 등록되지 않으면 활성 통화가 멈춘 상태로 남지 않도록 통화를 종료합니다.

## 오래된 통화 리퍼

`staleCallReaperSeconds`를 사용해 터미널 Webhook을 받지 못하는 통화(예: 완료되지 않는 알림 모드 통화)를 종료합니다. 기본값은 `0`(비활성화)입니다.

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

프록시나 터널이 Gateway 앞에 있을 때 Plugin은 서명 검증을 위해 공개 URL을 재구성합니다. 다음 옵션은 신뢰할 전달 헤더를 제어합니다.

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

- Webhook **재생 보호**는 Twilio와 Plivo에 대해 활성화됩니다. 재생된 유효한 Webhook 요청은 확인 응답되지만 부수 효과는 건너뜁니다.
- Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로, 오래되었거나 재생된 음성 콜백이 더 최신의 대기 중인 transcript 턴을 충족할 수 없습니다.
- 인증되지 않은 Webhook 요청은 공급자의 필수 서명 헤더가 없을 때 본문 읽기 전에 거부됩니다.
- voice-call Webhook은 공유 사전 인증 본문 프로필(64 KB / 5초)과 서명 검증 전 IP별 진행 중 요청 상한을 사용합니다.

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

Gateway가 이미 실행 중이면 운영용 `voicecall` 명령은 Gateway가 소유한 voice-call 런타임에 위임되어 CLI가 두 번째 Webhook 서버를 바인딩하지 않습니다. 도달 가능한 Gateway가 없으면 명령은 독립 실행형 CLI 런타임으로 폴백합니다.

`latency`는 기본 voice-call 저장소 경로에서 `calls.jsonl`을 읽습니다. 다른 로그를 지정하려면 `--file <path>`를 사용하고, 분석을 마지막 N개 레코드(기본값 200)로 제한하려면 `--last <n>`을 사용하세요. 출력에는 턴 지연 시간과 listen-wait 시간의 p50/p90/p99가 포함됩니다.

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

voice-call Plugin은 일치하는 에이전트 skill을 함께 제공합니다.

## Gateway RPC

| 메서드               | 인수                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence`는 `mode: "conversation"`과 함께 사용할 때만 유효합니다. 알림 모드 통화에서 연결 후 숫자가 필요하면 통화가 존재한 뒤 `voicecall.dtmf`를 사용해야 합니다.

## 문제 해결

### 설정에서 Webhook 노출 실패

Gateway를 실행하는 동일한 환경에서 설정을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, `plivo`의 경우 `webhook-exposure`가 녹색이어야 합니다. 구성된 `publicUrl`이 로컬 또는 사설 네트워크 공간을 가리키면 통신사가 해당 주소로 콜백할 수 없기 때문에 여전히 실패합니다. `publicUrl`로 `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8`을 사용하지 마세요.

Twilio 알림 모드 발신 통화는 create-call 요청에서 초기 `<Say>` TwiML을 직접 보내므로 첫 음성 메시지는 Twilio가 Webhook TwiML을 가져오는 것에 의존하지 않습니다. 상태 콜백, 대화 통화, 연결 전 DTMF, 실시간 스트림, 연결 후 통화 제어에는 여전히 공개 Webhook이 필요합니다.

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

구성을 변경한 후 Gateway를 다시 시작하거나 다시 로드한 다음 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 `--yes`를 전달하지 않는 한 드라이 런입니다.

### 공급자 자격 증명 실패

선택된 공급자와 필수 자격 증명 필드를 확인하세요.

- Twilio: `twilio.accountSid`, `twilio.authToken`, `fromNumber` 또는 `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, `fromNumber`.

자격 증명은 Gateway 호스트에 있어야 합니다. 로컬 셸 프로필을 편집해도 Gateway가 다시 시작되거나 환경을 다시 로드하기 전까지는 이미 실행 중인 Gateway에 영향을 주지 않습니다.

### 통화는 시작되지만 공급자 Webhook이 도착하지 않음

공급자 콘솔이 정확한 공개 Webhook URL을 가리키는지 확인하세요.

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
- Gateway가 시작된 후 터널 URL이 변경되었습니다.
- 프록시가 요청을 전달하지만 host/proto 헤더를 제거하거나 다시 씁니다.
- 방화벽 또는 DNS가 공개 호스트 이름을 Gateway가 아닌 다른 곳으로 라우팅합니다.
- Voice Call Plugin이 활성화되지 않은 상태로 Gateway가 다시 시작되었습니다.

역방향 프록시나 터널이 Gateway 앞에 있으면 `webhookSecurity.allowedHosts`를 공개 호스트 이름으로 설정하거나, 알려진 프록시 주소에는 `webhookSecurity.trustedProxyIPs`를 사용하세요. 프록시 경계가 사용자의 제어 아래 있을 때만 `webhookSecurity.trustForwardingHeaders`를 사용하세요.

### 서명 검증 실패

공급자 서명은 OpenClaw가 들어오는 요청에서 재구성한 공개 URL을 기준으로 확인됩니다. 서명이 실패하면:

- 공급자 Webhook URL이 스킴, 호스트, 경로를 포함해 `publicUrl`과 정확히 일치하는지 확인하세요.
- ngrok 무료 티어 URL의 경우 터널 호스트 이름이 변경되면 `publicUrl`을 업데이트하세요.
- 프록시가 원래 host 및 proto 헤더를 보존하는지 확인하거나 `webhookSecurity.allowedHosts`를 구성하세요.
- 로컬 테스트 외부에서는 `skipSignatureVerification`을 활성화하지 마세요.

### Google Meet Twilio 참가 실패

Google Meet은 Twilio 다이얼인 참가에 이 Plugin을 사용합니다. 먼저 Voice Call을 확인하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

그런 다음 Google Meet 전송을 명시적으로 확인하세요.

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call은 녹색이지만 Meet 참가자가 참여하지 않는 경우 Meet 다이얼인 번호, PIN, `--dtmf-sequence`를 확인하세요. 전화 통화는 정상이어도 회의가 잘못된 DTMF 시퀀스를 거부하거나 무시할 수 있습니다.

Google Meet은 연결 전 DTMF 시퀀스와 함께 `voicecall.start`를 통해 Twilio 전화 구간을 시작합니다. PIN에서 파생된 시퀀스에는 Google Meet Plugin의 `voiceCall.dtmfDelayMs`가 선행 Twilio 대기 숫자로 포함됩니다. Meet 다이얼인 프롬프트가 늦게 도착할 수 있으므로 기본값은 12초입니다. 그런 다음 Voice Call은 소개 인사말이 요청되기 전에 실시간 처리로 다시 리디렉션합니다.

실시간 단계 추적에는 `openclaw logs --follow`를 사용하세요. 정상적인 Twilio Meet 참가는 다음 순서로 로그를 남깁니다.

- Google Meet이 Twilio 참가를 Voice Call에 위임합니다.
- Voice Call이 연결 전 DTMF TwiML을 저장합니다.
- Twilio 초기 TwiML이 실시간 처리 전에 소비되고 제공됩니다.
- Voice Call이 Twilio 통화용 실시간 TwiML을 제공합니다.
- Google Meet이 DTMF 후 지연 뒤 `voicecall.speak`로 소개 음성을 요청합니다.

`openclaw voicecall tail`은 여전히 영속화된 통화 레코드를 표시합니다. 통화 상태와 transcript에는 유용하지만 모든 Webhook/실시간 전환이 거기에 나타나지는 않습니다.

### 실시간 통화에 음성이 없음

오디오 모드가 하나만 활성화되어 있는지 확인하세요. `realtime.enabled`와 `streaming.enabled`는 둘 다 true일 수 없습니다.

실시간 Twilio 통화의 경우 다음도 확인하세요.

- 실시간 공급자 Plugin이 로드되고 등록되어 있습니다.
- `realtime.provider`가 설정되지 않았거나 등록된 공급자 이름입니다.
- 공급자 API 키를 Gateway 프로세스에서 사용할 수 있습니다.
- `openclaw logs --follow`에 실시간 TwiML 제공, 실시간 브리지 시작, 초기 인사말 큐 추가가 표시됩니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [텍스트 음성 변환](/ko/tools/tts)
- [음성 깨우기](/ko/nodes/voicewake)
