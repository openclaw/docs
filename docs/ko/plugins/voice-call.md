---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸려고 합니다
    - voice-call Plugin을 구성하거나 개발 중입니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 전사가 필요합니다
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 발신 음성 통화를 걸고 수신 음성 통화를 받으며, 선택적으로 실시간 음성과 스트리밍 전사를 사용할 수 있습니다
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-05-01T06:26:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea655c1fab7a92056a8469018e9719e015c6492d96419dc3a6757efd90c14508
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin을 통해 OpenClaw에서 음성 통화를 사용할 수 있습니다. 아웃바운드 알림,
다중 턴 대화, 전이중 실시간 음성, 스트리밍
전사, 허용 목록 정책을 사용하는 인바운드 통화를 지원합니다.

**현재 제공자:** `twilio`(Programmable Voice + Media Streams),
`telnyx`(Call Control v2), `plivo`(Voice API + XML transfer + GetInput
speech), `mock`(개발/네트워크 없음).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다. 원격
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
      <Tab title="로컬 폴더에서(dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    npm이 OpenClaw 소유 패키지를 지원 중단됨으로 보고하는 경우, 해당 패키지 버전은
    이전 외부 패키지 트레인에서 온 것입니다. 최신 npm 패키지가 게시될 때까지
    현재 패키징된 OpenClaw 빌드 또는 로컬 폴더 경로를 사용하세요.

    이후 Gateway를 다시 시작하여 Plugin을 로드하세요.

  </Step>
  <Step title="제공자 및 Webhook 구성">
    `plugins.entries.voice-call.config` 아래에 구성을 설정합니다(전체 형식은 아래
    [구성](#configuration)을 참조). 최소한 `provider`, 제공자 자격 증명,
    `fromNumber`, 그리고 공개적으로 접근 가능한 Webhook URL이 필요합니다.
  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw voicecall setup
    ```

    기본 출력은 채팅 로그와 터미널에서 읽기 쉽습니다. Plugin 활성화,
    제공자 자격 증명, Webhook 노출, 그리고 하나의 오디오 모드(`streaming` 또는 `realtime`)만
    활성화되어 있는지 확인합니다. 스크립트에서는 `--json`을 사용하세요.

  </Step>
  <Step title="스모크 테스트">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 드라이 런입니다. 짧은 아웃바운드 알림 통화를 실제로 걸려면
    `--yes`를 추가하세요.

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정은 **공개 Webhook URL**로 확인되어야 합니다.
`publicUrl`, 터널 URL, Tailscale URL, 또는 serve 폴백이
루프백이나 사설 네트워크 공간으로 확인되면, 통신사 Webhook을 수신할 수 없는
제공자를 시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`이지만 선택한 제공자에 자격 증명이 없으면,
Gateway 시작 시 누락된 키와 함께 설정 미완료 경고를 로그에 남기고
런타임 시작을 건너뜁니다. 명령, RPC 호출, 에이전트 도구는 사용 시에도
누락된 제공자 구성을 정확히 반환합니다.

<Note>
음성 통화 자격 증명은 SecretRef를 허용합니다. `plugins.entries.voice-call.config.twilio.authToken` 및 `plugins.entries.voice-call.config.tts.providers.*.apiKey`는 표준 SecretRef 표면을 통해 확인됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하세요.
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
    - Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 티어에서는 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 루프백(ngrok 로컬 에이전트)일 때만 유효하지 않은 서명의 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 티어 URL은 변경되거나 중간 페이지 동작을 추가할 수 있습니다. `publicUrl`이 달라지면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인 또는 Tailscale funnel을 선호하세요.

  </Accordion>
  <Accordion title="스트리밍 연결 제한">
    - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`는 인증되지 않은 시작 전 소켓의 총수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증되지 않은 시작 전 소켓을 제한합니다.
    - `streaming.maxConnections`는 열린 미디어 스트림 소켓(대기 중 + 활성)의 총수를 제한합니다.

  </Accordion>
  <Accordion title="레거시 구성 마이그레이션">
    `provider: "log"`, `twilio.from`, 또는 레거시 `streaming.*` OpenAI 키를 사용하는
    이전 구성은 `openclaw doctor --fix`로 다시 작성됩니다.
    런타임 폴백은 현재 이전 voice-call 키도 계속 허용하지만,
    재작성 경로는 `openclaw doctor --fix`이고 호환성 shim은
    임시입니다.

    자동 마이그레이션되는 스트리밍 키:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## 실시간 음성 대화

`realtime`은 실시간 통화 오디오용 전이중 실시간 음성 제공자를 선택합니다.
이는 오디오를 실시간 전사 제공자에게만 전달하는 `streaming`과는 별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화마다
오디오 모드를 하나만 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 음성 제공자를 사용합니다.
- 번들 실시간 음성 제공자: Google Gemini Live(`google`) 및 OpenAI(`openai`)이며, 각 제공자 Plugin이 등록합니다.
- 제공자 소유 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공유 `openclaw_agent_consult` 실시간 도구를 노출합니다. 발신자가 더 깊은 추론, 최신 정보, 또는 일반 OpenClaw 도구를 요청하면 실시간 모델이 이를 호출할 수 있습니다.
- `realtime.provider`가 등록되지 않은 제공자를 가리키거나 실시간 음성 제공자가 전혀 등록되어 있지 않으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 로그에 남기고 실시간 미디어를 건너뜁니다.
- 상담 세션 키는 사용 가능한 경우 기존 음성 세션을 재사용한 뒤, 후속 상담 호출이 통화 중 컨텍스트를 유지하도록 발신자/수신자 전화번호로 폴백합니다.

### 도구 정책

`realtime.toolPolicy`는 상담 실행을 제어합니다.

| 정책             | 동작                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 상담 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다. |
| `owner`          | 상담 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 허용합니다.                                                    |
| `none`           | 상담 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 여전히 실시간 제공자에 전달됩니다.                                         |

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
[OpenAI 제공자](/ko/providers/openai)를 참조하세요.

## 스트리밍 전사

`streaming`은 실시간 통화 오디오용 실시간 전사 제공자를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 전사 제공자를 사용합니다.
- 번들 실시간 전사 제공자: Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)이며, 각 제공자 Plugin이 등록합니다.
- 제공자 소유 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- Twilio가 수락된 스트림 `start` 메시지를 보낸 후, Voice Call은 즉시 스트림을 등록하고, 제공자가 연결되는 동안 인바운드 미디어를 전사 제공자에 큐잉하며, 실시간 전사가 준비된 뒤에만 초기 인사를 시작합니다.
- `streaming.provider`가 등록되지 않은 제공자를 가리키거나 등록된 제공자가 없으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 로그에 남기고 미디어 스트리밍을 건너뜁니다.

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

Voice Call은 통화에서 스트리밍 음성에 핵심 `messages.tts` 구성을 사용합니다. Plugin 구성 아래에서 **동일한 형태**로 재정의할 수 있으며, 이는 `messages.tts`와 심층 병합됩니다.

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
**Microsoft 음성은 음성 통화에서 무시됩니다.** 전화 음성에는 PCM이 필요하지만, 현재 Microsoft 전송 계층은 전화용 PCM 출력을 노출하지 않습니다.
</Warning>

동작 참고 사항:

- Plugin 구성 내부의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋된 구성은 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio 미디어 스트리밍이 활성화된 경우 핵심 TTS가 사용됩니다. 그렇지 않으면 통화가 공급자 네이티브 음성으로 대체됩니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 대체하지 않습니다. 해당 상태에서 전화 TTS를 사용할 수 없으면 두 재생 경로를 섞는 대신 재생 요청이 실패합니다.
- 전화 TTS가 보조 공급자로 대체되면 Voice Call은 디버깅을 위해 공급자 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.
- Twilio 바지인 또는 스트림 해제가 대기 중인 TTS 큐를 지우면, 대기 중인 재생 요청은 통화자가 재생 완료를 기다리며 멈추지 않도록 정상적으로 완료됩니다.

### TTS 예시

<Tabs>
  <Tab title="Core TTS only">
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

수신 정책의 기본값은 `disabled`입니다. 수신 통화를 활성화하려면 다음을 설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"`는 신뢰도가 낮은 발신자 ID 필터입니다. Plugin은 공급자가 제공한 `From` 값을 정규화하고 이를 `allowFrom`과 비교합니다. Webhook 검증은 공급자 전송과 페이로드 무결성을 인증하지만, PSTN/VoIP 발신자 번호 소유권을 **증명하지는 않습니다**. `allowFrom`은 강력한 발신자 신원이 아니라 발신자 ID 필터링으로 취급하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`, `responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 음성 출력 계약

자동 응답의 경우 Voice Call은 시스템 프롬프트에 엄격한 음성 출력 계약을 추가합니다.

```text
{"spoken":"..."}
```

Voice Call은 방어적으로 음성 텍스트를 추출합니다.

- 추론/오류 콘텐츠로 표시된 페이로드를 무시합니다.
- 직접 JSON, fenced JSON 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 대체하고 계획/메타 도입부로 보이는 단락을 제거합니다.

이렇게 하면 음성 재생이 통화자에게 보여야 하는 텍스트에 집중되고, 계획 텍스트가 오디오로 유출되는 일을 방지할 수 있습니다.

### 대화 시작 동작

발신 `conversation` 통화의 경우 첫 메시지 처리는 실시간 재생 상태와 연결됩니다.

- 바지인 큐 비우기와 자동 응답은 최초 인사말이 실제로 말해지는 동안에만 억제됩니다.
- 최초 재생이 실패하면 통화는 `listening`으로 돌아가고 최초 메시지는 재시도를 위해 큐에 남습니다.
- Twilio 스트리밍의 최초 재생은 스트림 연결 시 추가 지연 없이 시작됩니다.
- 바지인은 활성 재생을 중단하고 아직 재생 중이 아닌 대기 Twilio TTS 항목을 지웁니다. 지워진 항목은 건너뜀으로 resolve되므로, 후속 응답 로직은 절대 재생되지 않을 오디오를 기다리지 않고 계속될 수 있습니다.
- 실시간 음성 대화는 실시간 스트림 자체의 시작 턴을 사용합니다. Voice Call은 해당 최초 메시지에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로, 발신 `<Connect><Stream>` 세션은 계속 연결된 상태로 유지됩니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림 연결이 끊기면 Voice Call은 통화를 자동 종료하기 전에 **2000 ms**를 기다립니다.

- 해당 시간 동안 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 후에도 스트림이 다시 등록되지 않으면 멈춘 활성 통화를 방지하기 위해 통화가 종료됩니다.

## 오래된 통화 정리기

종료 Webhook을 받지 못하는 통화(예: 완료되지 않는 알림 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용하세요. 기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** 알림 스타일 흐름에는 `120`~`300`초.
- 정상 통화가 끝날 수 있도록 이 값을 **`maxDurationSeconds`보다 높게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

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

프록시 또는 터널이 Gateway 앞에 있을 때, Plugin은 서명 검증을 위해 공개 URL을 재구성합니다. 다음 옵션은 신뢰할 전달 헤더를 제어합니다.

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

- Webhook **재생 공격 방지**는 Twilio와 Plivo에 대해 활성화되어 있습니다. 재생된 유효한 Webhook 요청은 확인 응답을 받지만 부작용은 건너뜁니다.
- Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로, 오래되거나 재생된 음성 콜백은 더 최신의 대기 중인 트랜스크립트 턴을 만족시킬 수 없습니다.
- 인증되지 않은 Webhook 요청은 공급자에 필요한 서명 헤더가 없을 경우 본문을 읽기 전에 거부됩니다.
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

Gateway가 이미 실행 중이면 운영용 `voicecall` 명령은 Gateway 소유 voice-call 런타임에 위임되어 CLI가 두 번째 Webhook 서버를 바인딩하지 않게 합니다. 도달 가능한 Gateway가 없으면 명령은 독립 실행형 CLI 런타임으로 대체됩니다.

`latency`는 기본 voice-call 저장소 경로에서 `calls.jsonl`을 읽습니다. 다른 로그를 지정하려면 `--file <path>`를 사용하고, 분석을 마지막 N개 레코드(기본값 200)로 제한하려면 `--last <n>`를 사용하세요. 출력에는 턴 지연 시간과 청취 대기 시간의 p50/p90/p99가 포함됩니다.

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

이 저장소는 `skills/voice-call/SKILL.md`에 일치하는 skill 문서를 제공합니다.

## Gateway RPC

| 메서드              | 인수                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence`는 `mode: "conversation"`에서만 유효합니다. 알림 모드 통화에서 연결 후 숫자가 필요하다면, 통화가 생성된 후 `voicecall.dtmf`를 사용해야 합니다.

## 문제 해결

### 설정에서 Webhook 노출 실패

Gateway를 실행하는 동일한 환경에서 설정을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, `plivo`의 경우 `webhook-exposure`가 녹색이어야 합니다. 구성된 `publicUrl`이 로컬 또는 사설 네트워크 공간을 가리키면, 통신사가 해당 주소로 다시 호출할 수 없으므로 여전히 실패합니다. `publicUrl`로 `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` 또는 `fd00::/8`을 사용하지 마세요.

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

구성을 변경한 후 Gateway를 다시 시작하거나 다시 로드한 다음 다음을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 `--yes`를 전달하지 않으면 드라이 런입니다.

### 제공자 자격 증명 실패

선택한 제공자와 필수 자격 증명 필드를 확인하세요.

- Twilio: `twilio.accountSid`, `twilio.authToken`, `fromNumber` 또는
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`, 그리고
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken`, 그리고 `fromNumber`.

자격 증명은 Gateway 호스트에 있어야 합니다. 로컬 셸 프로필을 편집해도
이미 실행 중인 Gateway가 다시 시작되거나 환경을 다시 로드하기 전까지는
영향을 주지 않습니다.

### 통화는 시작되지만 제공자 Webhook이 도착하지 않음

제공자 콘솔이 정확한 공개 Webhook URL을 가리키는지 확인하세요.

```text
https://voice.example.com/voice/webhook
```

그런 다음 런타임 상태를 점검하세요.

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
```

일반적인 원인:

- `publicUrl`이 `serve.path`와 다른 경로를 가리킵니다.
- Gateway가 시작된 후 터널 URL이 변경되었습니다.
- 프록시가 요청을 전달하지만 host/proto 헤더를 제거하거나 다시 씁니다.
- 방화벽 또는 DNS가 공개 호스트 이름을 Gateway가 아닌 다른 곳으로 라우팅합니다.
- Voice Call Plugin이 활성화되지 않은 상태로 Gateway가 다시 시작되었습니다.

Gateway 앞에 리버스 프록시나 터널이 있는 경우
`webhookSecurity.allowedHosts`를 공개 호스트 이름으로 설정하거나, 알려진
프록시 주소에는 `webhookSecurity.trustedProxyIPs`를 사용하세요.
`webhookSecurity.trustForwardingHeaders`는 프록시 경계를 직접 제어할 수
있을 때만 사용하세요.

### 서명 확인 실패

제공자 서명은 OpenClaw가 들어오는 요청에서 재구성한 공개 URL을 기준으로
확인됩니다. 서명이 실패하는 경우:

- 제공자 Webhook URL이 스킴, 호스트, 경로를 포함해 `publicUrl`과 정확히 일치하는지 확인하세요.
- ngrok 무료 티어 URL의 경우 터널 호스트 이름이 변경되면 `publicUrl`을 업데이트하세요.
- 프록시가 원래 host 및 proto 헤더를 보존하는지 확인하거나 `webhookSecurity.allowedHosts`를 구성하세요.
- 로컬 테스트 외부에서는 `skipSignatureVerification`을 활성화하지 마세요.

### Google Meet Twilio 참여 실패

Google Meet은 Twilio 전화 접속 참여에 이 Plugin을 사용합니다. 먼저 Voice Call을 확인하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

그런 다음 Google Meet 전송을 명시적으로 확인하세요.

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call은 정상인데 Meet 참가자가 참여하지 않는 경우 Meet 전화 접속
번호, PIN, `--dtmf-sequence`를 확인하세요. 전화 통화는 정상일 수 있지만
잘못된 DTMF 시퀀스는 회의에서 거부되거나 무시될 수 있습니다.

Google Meet은 Meet DTMF 시퀀스와 소개 문구를 `voicecall.start`에
전달합니다. Twilio 통화의 경우 Voice Call은 먼저 DTMF TwiML을 제공하고,
다시 Webhook으로 리디렉션한 다음 실시간 미디어 스트림을 열어 저장된
소개가 전화 참가자가 회의에 참여한 후 생성되도록 합니다.

### 실시간 통화에 음성이 없음

오디오 모드가 하나만 활성화되어 있는지 확인하세요. `realtime.enabled`와
`streaming.enabled`를 동시에 true로 설정할 수 없습니다.

실시간 Twilio 통화의 경우 다음도 확인하세요.

- 실시간 제공자 Plugin이 로드되고 등록되어 있습니다.
- `realtime.provider`가 설정되지 않았거나 등록된 제공자 이름을 지정합니다.
- 제공자 API 키를 Gateway 프로세스에서 사용할 수 있습니다.
- `openclaw voicecall tail`에 초기 인사말 전에 미디어 스트림 수락 및 실시간 제공자 준비 상태가 표시됩니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [텍스트 음성 변환](/ko/tools/tts)
- [음성 깨우기](/ko/nodes/voicewake)
