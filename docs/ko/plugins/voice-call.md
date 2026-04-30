---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸고 싶습니다
    - 음성 통화 Plugin을 구성하거나 개발하고 있습니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 전사가 필요합니다
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 발신 음성 통화를 걸고 수신 음성 통화를 받으며, 선택적으로 실시간 음성과 스트리밍 전사를 지원합니다
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-04-30T06:45:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin을 통해 OpenClaw에 음성 통화를 제공합니다. 아웃바운드 알림,
다중 턴 대화, 전이중 실시간 음성, 스트리밍
전사, allowlist 정책을 사용한 인바운드 통화를 지원합니다.

**현재 공급자:** `twilio`(Programmable Voice + Media Streams),
`telnyx`(Call Control v2), `plivo`(Voice API + XML transfer + GetInput
speech), `mock`(개발용/네트워크 없음).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다. 원격 Gateway를
사용하는 경우, Gateway를 실행하는 머신에 Plugin을 설치하고 구성한 다음,
Gateway를 다시 시작해 로드하세요.
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

    npm이 OpenClaw 소유 패키지를 deprecated로 보고한다면, 해당 패키지 버전은
    더 오래된 외부 패키지 트레인에서 온 것입니다. 더 최신 npm 패키지가 게시될 때까지
    현재 패키징된 OpenClaw 빌드 또는 로컬 폴더 경로를 사용하세요.

    이후 Gateway를 다시 시작해 Plugin이 로드되도록 하세요.

  </Step>
  <Step title="공급자와 Webhook 구성">
    `plugins.entries.voice-call.config` 아래에 구성을 설정하세요(전체 구조는
    아래 [구성](#configuration)을 참조). 최소한 `provider`, 공급자 자격 증명,
    `fromNumber`, 공개적으로 접근 가능한 Webhook URL이 필요합니다.
  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw voicecall setup
    ```

    기본 출력은 채팅 로그와 터미널에서 읽기 쉽습니다. Plugin 활성화,
    공급자 자격 증명, Webhook 노출, 그리고 오디오 모드(`streaming` 또는
    `realtime`)가 하나만 활성 상태인지 확인합니다. 스크립트에는
    `--json`을 사용하세요.

  </Step>
  <Step title="스모크 테스트">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 드라이런입니다. 실제로 짧은 아웃바운드 알림 통화를
    걸려면 `--yes`를 추가하세요.

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정은 반드시 **공개 Webhook URL**로
해석되어야 합니다. `publicUrl`, 터널 URL, Tailscale URL 또는 serve 대체값이
loopback이나 사설 네트워크 공간으로 해석되면, 통신사 Webhook을 받을 수 없는
공급자를 시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`이지만 선택한 공급자에 자격 증명이 없으면,
Gateway 시작 시 누락된 키와 함께 설정 미완료 경고가 기록되고
런타임 시작을 건너뜁니다. 명령, RPC 호출, 에이전트 도구는 사용 시에도
누락된 공급자 구성을 정확히 반환합니다.

<Note>
음성 통화 자격 증명은 SecretRef를 허용합니다. `plugins.entries.voice-call.config.twilio.authToken` 및 `plugins.entries.voice-call.config.tts.providers.*.apiKey`는 표준 SecretRef 표면을 통해 해석됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하세요.
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
  <Accordion title="공급자 노출 및 보안 참고 사항">
    - Twilio, Telnyx, Plivo는 모두 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
    - `mock`은 로컬 개발 공급자입니다(네트워크 호출 없음).
    - `skipSignatureVerification`이 true가 아닌 한 Telnyx에는 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 티어에서는 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 강제됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)인 경우에만 잘못된 서명이 있는 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 티어 URL은 변경되거나 중간 안내 동작이 추가될 수 있습니다. `publicUrl`이 달라지면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 권장합니다.

  </Accordion>
  <Accordion title="스트리밍 연결 한도">
    - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 전송하지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`는 인증되지 않은 시작 전 소켓의 총수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증되지 않은 시작 전 소켓 수를 제한합니다.
    - `streaming.maxConnections`는 열려 있는 미디어 스트림 소켓의 총수(대기 중 + 활성)를 제한합니다.

  </Accordion>
  <Accordion title="레거시 구성 마이그레이션">
    `provider: "log"`, `twilio.from`, 또는 레거시
    `streaming.*` OpenAI 키를 사용하는 이전 구성은 `openclaw doctor --fix`로
    다시 작성됩니다. 런타임 대체 경로는 현재도 이전 voice-call 키를 허용하지만,
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

`realtime`은 실시간 통화 오디오를 위한 전이중 실시간 음성 공급자를 선택합니다.
이는 오디오를 실시간 전사 공급자로만 전달하는 `streaming`과는 별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화마다
오디오 모드를 하나 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 음성 공급자를 사용합니다.
- 번들된 실시간 음성 공급자: Google Gemini Live(`google`) 및 OpenAI(`openai`)이며, 각 공급자 Plugin이 등록합니다.
- 공급자 소유 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공유 `openclaw_agent_consult` 실시간 도구를 노출합니다. 호출자가 더 깊은 추론, 최신 정보 또는 일반 OpenClaw 도구를 요청하면 실시간 모델이 이를 호출할 수 있습니다.
- `realtime.provider`가 등록되지 않은 공급자를 가리키거나 실시간 음성 공급자가 전혀 등록되어 있지 않으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 실시간 미디어를 건너뜁니다.
- consult 세션 키는 가능하면 기존 음성 세션을 재사용한 다음, 후속 consult 호출이 통화 중 컨텍스트를 유지하도록 발신자/수신자 전화번호로 대체됩니다.

### 도구 정책

`realtime.toolPolicy`는 consult 실행을 제어합니다.

| 정책             | 동작                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다. |
| `owner`          | consult 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 허용합니다.                                                |
| `none`           | consult 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 여전히 실시간 공급자에 전달됩니다.                                     |

### 실시간 공급자 예시

<Tabs>
  <Tab title="Google Gemini Live">
    기본값: API 키는 `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` 또는 `GOOGLE_GENERATIVE_AI_API_KEY`에서 가져옵니다. 모델은
    `gemini-2.5-flash-native-audio-preview-12-2025`, 음성은 `Kore`입니다.

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

공급자별 실시간 음성 옵션은 [Google 공급자](/ko/providers/google) 및
[OpenAI 공급자](/ko/providers/openai)를 참조하세요.

## 스트리밍 전사

`streaming`은 실시간 통화 오디오를 위한 실시간 전사 공급자를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 전사 공급자를 사용합니다.
- 번들된 실시간 전사 공급자: Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)이며, 각 공급자 Plugin이 등록합니다.
- 공급자 소유 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- `streaming.provider`가 등록되지 않은 공급자를 가리키거나 등록된 공급자가 없으면, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 미디어 스트리밍을 건너뜁니다.

### 스트리밍 공급자 예시

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
    엔드포인트 `wss://api.x.ai/v1/stt`; 인코딩 `mulaw`; 샘플 속도 `8000`;
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

Voice Call은 통화에서 스트리밍 음성을 위해 핵심 `messages.tts` 구성을 사용합니다. Plugin 설정 아래에서 **동일한 형태**로 재정의할 수 있으며, 이 설정은 `messages.tts`와 깊은 병합됩니다.

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
**Microsoft speech는 음성 통화에서 무시됩니다.** 전화 오디오에는 PCM이 필요하지만, 현재 Microsoft 전송은 전화 PCM 출력을 노출하지 않습니다.
</Warning>

동작 참고 사항:

- Plugin 설정 안의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋되는 설정은 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio 미디어 스트리밍이 활성화되어 있으면 핵심 TTS가 사용됩니다. 그렇지 않으면 통화는 공급자 네이티브 음성으로 폴백됩니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 폴백하지 않습니다. 이 상태에서 전화 TTS를 사용할 수 없으면 두 재생 경로를 혼합하는 대신 재생 요청이 실패합니다.
- 전화 TTS가 보조 공급자로 폴백되면 Voice Call은 디버깅을 위해 공급자 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.
- Twilio 끼어들기 또는 스트림 해제가 대기 중인 TTS 큐를 지우면, 큐에 있던 재생 요청은 재생 완료를 기다리는 호출자를 멈춘 채 두지 않고 완료 상태로 정리됩니다.

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
`inboundPolicy: "allowlist"`는 낮은 보증 수준의 발신자 ID 검사입니다. Plugin은 공급자가 제공한 `From` 값을 정규화하고 `allowFrom`과 비교합니다. Webhook 검증은 공급자 전달과 페이로드 무결성을 인증하지만, PSTN/VoIP 발신자 번호 소유권을 **증명하지는 않습니다**. `allowFrom`은 강력한 발신자 신원이 아니라 발신자 ID 필터링으로 취급하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`, `responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 음성 출력 계약

자동 응답의 경우 Voice Call은 시스템 프롬프트에 엄격한 음성 출력 계약을 추가합니다.

```text
{"spoken":"..."}
```

Voice Call은 음성 텍스트를 방어적으로 추출합니다.

- 추론/오류 콘텐츠로 표시된 페이로드를 무시합니다.
- 직접 JSON, 펜스 처리된 JSON, 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 폴백하고 계획/메타 성격으로 보이는 도입 문단을 제거합니다.

이를 통해 음성 재생은 발신자에게 들려줄 텍스트에 집중되며, 계획 텍스트가 오디오로 유출되는 것을 방지합니다.

### 대화 시작 동작

발신 `conversation` 통화의 경우 첫 메시지 처리는 실시간 재생 상태와 연결됩니다.

- 끼어들기 큐 지우기와 자동 응답은 초기 인사말이 실제로 말해지는 동안에만 억제됩니다.
- 초기 재생이 실패하면 통화는 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 큐에 남습니다.
- Twilio 스트리밍의 초기 재생은 추가 지연 없이 스트림 연결 시 시작됩니다.
- 끼어들기는 활성 재생을 중단하고 아직 재생되지 않은 큐 대기 Twilio TTS 항목을 지웁니다. 지워진 항목은 건너뜀으로 resolve되므로 후속 응답 로직은 절대 재생되지 않을 오디오를 기다리지 않고 계속될 수 있습니다.
- Realtime 음성 대화는 realtime 스트림 자체의 시작 턴을 사용합니다. Voice Call은 해당 초기 메시지에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로 발신 `<Connect><Stream>` 세션은 계속 연결된 상태로 유지됩니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림의 연결이 해제되면 Voice Call은 통화를 자동 종료하기 전에 **2000 ms**를 기다립니다.

- 해당 시간 동안 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 이후에도 다시 등록되는 스트림이 없으면 멈춘 활성 통화를 방지하기 위해 통화가 종료됩니다.

## 오래된 통화 정리기

종료 Webhook을 받지 못하는 통화(예: 완료되지 않는 알림 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용하세요. 기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** 알림 스타일 흐름의 경우 `120`~`300`초.
- 일반 통화가 끝날 수 있도록 이 값을 **`maxDurationSeconds`보다 높게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

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

프록시나 터널이 Gateway 앞에 있을 때 Plugin은 서명 검증을 위해 공개 URL을 재구성합니다. 다음 옵션은 어떤 전달 헤더를 신뢰할지 제어합니다.

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

- Webhook **재생 공격 보호**는 Twilio와 Plivo에서 활성화됩니다. 재생된 유효 Webhook 요청은 승인되지만 부작용은 건너뜁니다.
- Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로, 오래되었거나 재생된 음성 콜백은 더 최신의 대기 중인 트랜스크립트 턴을 충족할 수 없습니다.
- 인증되지 않은 Webhook 요청은 공급자에 필요한 서명 헤더가 없으면 본문을 읽기 전에 거부됩니다.
- voice-call Webhook은 공유 사전 인증 본문 프로필(64 KB / 5초)과 서명 검증 전 IP별 진행 중 요청 상한을 사용합니다.

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

`latency`는 기본 voice-call 저장소 경로에서 `calls.jsonl`을 읽습니다. 다른 로그를 가리키려면 `--file <path>`를 사용하고, 분석을 마지막 N개 레코드(기본값 200)로 제한하려면 `--last <n>`을 사용하세요. 출력에는 턴 지연 시간과 듣기 대기 시간의 p50/p90/p99가 포함됩니다.

## 에이전트 도구

도구 이름: `voice_call`.

| 작업            | 인수                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

이 저장소는 `skills/voice-call/SKILL.md`에 일치하는 skill 문서를 함께 제공합니다.

## Gateway RPC

| 메서드               | 인수                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## 관련 항목

- [Talk mode](/ko/nodes/talk)
- [Text-to-speech](/ko/tools/tts)
- [Voice wake](/ko/nodes/voicewake)
