---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸려고 합니다
    - voice-call Plugin을 구성하거나 개발 중입니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 전사가 필요합니다
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 발신 음성 통화를 걸고 수신 통화를 받으며, 선택적으로 실시간 음성과 스트리밍 전사를 사용할 수 있습니다
title: Voice call Plugin
x-i18n:
    generated_at: "2026-04-26T11:37:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

OpenClaw용 음성 통화 Plugin입니다. 발신 알림,
다중 턴 대화, 완전 양방향 실시간 음성, 스트리밍
전사, 허용 목록 정책이 있는 수신 통화를 지원합니다.

**현재 공급자:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (개발용/네트워크 없음).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부**에서 실행됩니다. 원격 Gateway를 사용하는 경우,
Gateway가 실행 중인 머신에 Plugin을 설치하고 구성한 다음,
Gateway를 다시 시작하여 Plugin을 로드하세요.
</Note>

## 빠른 시작

<Steps>
  <Step title="Plugin 설치">
    <Tabs>
      <Tab title="npm에서 설치(권장)">
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

    이후 Plugin이 로드되도록 Gateway를 다시 시작하세요.

  </Step>
  <Step title="공급자 및 Webhook 구성">
    `plugins.entries.voice-call.config` 아래에 구성을 설정하세요(전체 형식은
    아래 [구성](#configuration) 참조). 최소한 다음이 필요합니다:
    `provider`, 공급자 자격 증명, `fromNumber`, 그리고 공개적으로
    접근 가능한 Webhook URL.
  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw voicecall setup
    ```

    기본 출력은 채팅 로그와 터미널에서 읽기 쉽습니다. Plugin
    활성화, 공급자 자격 증명, Webhook 노출, 그리고 오디오 모드가
    하나만 활성화되었는지(`streaming` 또는 `realtime`)를 확인합니다.
    스크립트에서는 `--json`을 사용하세요.

  </Step>
  <Step title="스모크 테스트">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 드라이 런입니다. 실제로 짧은
    발신 알림 전화를 걸려면 `--yes`를 추가하세요:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정은 반드시 **공개 Webhook URL**로 확인되어야 합니다.
`publicUrl`, 터널 URL, Tailscale URL 또는 serve 대체 경로가
loopback 또는 사설 네트워크 공간으로 확인되면, 이동통신사 Webhook을
받을 수 없는 공급자를 시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`인데 선택한 공급자에 자격 증명이 없으면,
Gateway 시작 시 누락된 키와 함께 setup-incomplete 경고를 로그에 남기고
런타임 시작을 건너뜁니다. 명령, RPC 호출, 에이전트 도구는 사용 시
정확히 누락된 공급자 구성을 계속 반환합니다.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 또는 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // 또는 Twilio의 경우 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal의 Telnyx Webhook 공개 키
            // (Base64, TELNYX_PUBLIC_KEY로도 설정 가능)
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* 스트리밍 전사 참조 */ },
          realtime: { enabled: false /* 실시간 음성 참조 */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="공급자 노출 및 보안 참고">
    - Twilio, Telnyx, Plivo는 모두 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
    - `mock`은 로컬 개발 공급자입니다(네트워크 호출 없음).
    - Telnyx는 `skipSignatureVerification`이 true가 아닌 한 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 티어에서는 정확한 ngrok URL로 `publicUrl`을 설정하세요. 서명 검증은 항상 강제됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 loopback(ngrok 로컬 에이전트)일 때에만 잘못된 서명의 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 티어 URL은 변경되거나 중간 동작을 추가할 수 있습니다. `publicUrl`이 바뀌면 Twilio 서명이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 선호하세요.
  </Accordion>
  <Accordion title="스트리밍 연결 상한">
    - `streaming.preStartTimeoutMs`는 유효한 `start` 프레임을 보내지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`는 인증되지 않은 시작 전 소켓의 총 수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`는 소스 IP별 인증되지 않은 시작 전 소켓 수를 제한합니다.
    - `streaming.maxConnections`는 열려 있는 미디어 스트림 소켓의 총 수(대기 중 + 활성)를 제한합니다.
  </Accordion>
  <Accordion title="레거시 config 마이그레이션">
    `provider: "log"`, `twilio.from`, 또는 레거시
    `streaming.*` OpenAI 키를 사용하는 이전 구성은 `openclaw doctor --fix`로
    다시 작성됩니다. 런타임 대체 경로는 현재는 예전 voice-call 키를 계속 허용하지만,
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

## 실시간 음성 대화

`realtime`은 라이브 통화 오디오용 완전 양방향 실시간 음성 공급자를 선택합니다.
이것은 오디오를 실시간 전사 공급자에게 전달만 하는 `streaming`과는 별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화당
하나의 오디오 모드만 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio Media Streams에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 음성 공급자를 사용합니다.
- 번들 실시간 음성 공급자: Google Gemini Live (`google`)와 OpenAI (`openai`)이며, 공급자 Plugins에 의해 등록됩니다.
- 공급자 소유 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공용 `openclaw_agent_consult` 실시간 도구를 노출합니다. 발신자가 더 깊은 추론, 현재 정보 또는 일반 OpenClaw 도구를 요청할 때 실시간 모델이 이를 호출할 수 있습니다.
- `realtime.provider`가 등록되지 않은 공급자를 가리키거나 실시간 음성 공급자가 전혀 등록되지 않은 경우, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 실시간 미디어를 건너뜁니다.
- Consult 세션 키는 가능하면 기존 음성 세션을 재사용하고, 그렇지 않으면 발신자/수신자 전화번호로 대체되므로 후속 consult 호출이 통화 중에도 컨텍스트를 유지합니다.

### 도구 정책

`realtime.toolPolicy`는 consult 실행을 제어합니다.

| 정책             | 동작                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | consult 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`로 제한합니다. |
| `owner`          | consult 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 합니다.                                                   |
| `none`           | consult 도구를 노출하지 않습니다. 사용자 지정 `realtime.tools`는 여전히 실시간 공급자에 전달됩니다.                                    |

### 실시간 공급자 예시

<Tabs>
  <Tab title="Google Gemini Live">
    기본값: `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, 또는 `GOOGLE_GENERATIVE_AI_API_KEY`의 API 키, 모델
    `gemini-2.5-flash-native-audio-preview-12-2025`, 음성 `Kore`.

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

공급자별 실시간 음성 옵션은 [Google 공급자](/ko/providers/google)와
[OpenAI 공급자](/ko/providers/openai)를 참조하세요.

## 스트리밍 전사

`streaming`은 라이브 통화 오디오용 실시간 전사 공급자를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 처음 등록된 실시간 전사 공급자를 사용합니다.
- 번들 실시간 전사 공급자: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), xAI (`xai`)이며, 공급자 Plugins에 의해 등록됩니다.
- 공급자 소유 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- `streaming.provider`가 등록되지 않은 공급자를 가리키거나 아무 공급자도 등록되지 않은 경우, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 미디어 스트리밍을 건너뜁니다.

### 스트리밍 공급자 예시

<Tabs>
  <Tab title="OpenAI">
    기본값: API 키 `streaming.providers.openai.apiKey` 또는
    `OPENAI_API_KEY`, 모델 `gpt-4o-transcribe`, `silenceDurationMs: 800`,
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

  </Tab>
  <Tab title="xAI">
    기본값: API 키 `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`,
    엔드포인트 `wss://api.x.ai/v1/stt`, 인코딩 `mulaw`, 샘플 레이트 `8000`,
    `endpointingMs: 800`, `interimResults: true`.

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

  </Tab>
</Tabs>

## 통화용 TTS

Voice Call은 통화 중 스트리밍
음성에 core `messages.tts` 구성을 사용합니다. Plugin config 아래에서
**같은 형식**으로 이를 재정의할 수 있으며, `messages.tts`와 딥 머지됩니다.

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
**Microsoft 음성은 음성 통화에서 무시됩니다.** 전화 통신 오디오에는 PCM이 필요하지만,
현재 Microsoft 전송은 전화용 PCM 출력을 노출하지 않습니다.
</Warning>

동작 참고:

- Plugin config 내부의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`에 의해 수정됩니다. 커밋되는 config는 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio 미디어 스트리밍이 활성화되면 core TTS가 사용되며, 그렇지 않으면 통화는 공급자 기본 음성으로 대체됩니다.
- Twilio 미디어 스트림이 이미 활성 상태이면 Voice Call은 TwiML `<Say>`로 대체하지 않습니다. 해당 상태에서 전화용 TTS를 사용할 수 없으면 두 재생 경로를 섞는 대신 재생 요청이 실패합니다.
- 전화용 TTS가 보조 공급자로 대체되면 Voice Call은 디버깅을 위해 공급자 체인(`from`, `to`, `attempts`)과 함께 경고를 기록합니다.
- Twilio barge-in 또는 스트림 종료가 대기 중인 TTS 큐를 비우면, 큐에 있던 재생 요청은 발신자가 재생 완료를 기다리며 멈추지 않도록 정상적으로 종료됩니다.

### TTS 예시

<Tabs>
  <Tab title="core TTS만 사용">
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
  <Tab title="ElevenLabs로 재정의(통화 전용)">
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
  <Tab title="OpenAI 모델 재정의(딥 머지)">
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
`inboundPolicy: "allowlist"`는 신뢰 수준이 낮은 발신자 ID 필터입니다. 이
Plugin은 공급자가 제공한 `From` 값을 정규화한 뒤
`allowFrom`과 비교합니다. Webhook 검증은 공급자 전달과
페이로드 무결성을 인증하지만, PSTN/VoIP 발신 번호
소유권까지 증명하지는 않습니다. `allowFrom`은 강한 발신자
신원이 아니라 발신자 ID 필터링으로 취급하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`,
`responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 음성 출력 계약

자동 응답의 경우 Voice Call은 시스템 프롬프트에 엄격한 음성 출력 계약을 추가합니다.

```text
{"spoken":"..."}
```

Voice Call은 방어적으로 음성 텍스트를 추출합니다.

- reasoning/error 콘텐츠로 표시된 페이로드는 무시합니다.
- 직접 JSON, fenced JSON, 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 대체하고 계획/메타로 보이는 도입 문단은 제거합니다.

이렇게 하면 음성 재생이 발신자에게 들려줄 텍스트에 집중되고,
계획 텍스트가 오디오로 유출되는 것을 방지할 수 있습니다.

### 대화 시작 동작

발신 `conversation` 통화의 경우 첫 메시지 처리는 라이브
재생 상태와 연결됩니다.

- barge-in 큐 비우기와 자동 응답은 초기 인사말이 실제로 재생 중일 때만 억제됩니다.
- 초기 재생에 실패하면 통화는 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 대기 상태로 유지됩니다.
- Twilio 스트리밍의 초기 재생은 추가 지연 없이 스트림 연결 시 시작됩니다.
- Barge-in은 활성 재생을 중단하고 아직 재생되지 않은 대기 중 Twilio TTS 항목을 비웁니다. 비워진 항목은 건너뜀으로 처리되므로 후속 응답 로직은 절대 재생되지 않을 오디오를 기다리지 않고 계속 진행할 수 있습니다.
- 실시간 음성 대화는 실시간 스트림 자체의 시작 턴을 사용합니다. Voice Call은 해당 초기 메시지에 대해 레거시 `<Say>` TwiML 업데이트를 게시하지 않으므로, 발신 `<Connect><Stream>` 세션이 연결된 상태를 유지합니다.

### Twilio 스트림 연결 해제 유예

Twilio 미디어 스트림이 연결 해제되면 Voice Call은
통화를 자동 종료하기 전에 **2000 ms**를 기다립니다.

- 그 시간 안에 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 후에도 스트림이 다시 등록되지 않으면, 활성 통화가 멈춘 상태로 남지 않도록 통화를 종료합니다.

## 오래된 통화 정리기

최종 Webhook을 받지 못한 통화(예: 완료되지 않는 notify 모드 통화)를 종료하려면 `staleCallReaperSeconds`를 사용하세요. 기본값은 `0`(비활성화)입니다.

권장 범위:

- **프로덕션:** notify 스타일 흐름에는 `120`–`300`초
- 일반 통화가 끝날 수 있도록 이 값은 **`maxDurationSeconds`보다 크게** 유지하세요. 좋은 시작점은 `maxDurationSeconds + 30–60`초입니다.

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

프록시나 터널이 Gateway 앞에 있을 때, Plugin은
서명 검증을 위해 공개 URL을 재구성합니다. 이 옵션들은
어떤 전달 헤더를 신뢰할지 제어합니다.

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  전달 헤더의 허용 목록 호스트.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  허용 목록 없이 전달 헤더를 신뢰합니다.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  요청 원격 IP가 목록과 일치할 때만 전달 헤더를 신뢰합니다.
</ParamField>

추가 보호 기능:

- Twilio 및 Plivo에 대해 Webhook **재생 공격 방지**가 활성화됩니다. 재생된 유효 Webhook 요청은 승인되지만 부작용은 건너뜁니다.
- Twilio 대화 턴에는 `<Gather>` 콜백에 턴별 토큰이 포함되므로, 오래되었거나 재생된 음성 콜백이 새로운 대기 중 transcript 턴을 만족시킬 수 없습니다.
- 인증되지 않은 Webhook 요청은 공급자에 필요한 서명 헤더가 없으면 본문을 읽기 전에 거부됩니다.
- voice-call Webhook은 공유 pre-auth 본문 프로필(64 KB / 5초)과 서명 검증 전 IP별 동시 처리 상한을 사용합니다.

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
openclaw voicecall start --to "+15555550123"   # call의 별칭
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # 로그에서 턴 지연 시간 요약
openclaw voicecall expose --mode funnel
```

`latency`는 기본 voice-call 저장 경로의 `calls.jsonl`을 읽습니다.
다른 로그를 가리키려면 `--file <path>`를 사용하고, 마지막 N개 레코드만
분석하려면 `--last <n>`을 사용하세요(기본값 200). 출력에는 턴 지연 시간과
listen-wait 시간의 p50/p90/p99가 포함됩니다.

## 에이전트 도구

도구 이름: `voice_call`.

| 동작            | 인수                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

이 저장소는 `skills/voice-call/SKILL.md`에 일치하는 Skills 문서도 제공합니다.

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

- [Talk 모드](/ko/nodes/talk)
- [텍스트 음성 변환](/ko/tools/tts)
- [음성 웨이크](/ko/nodes/voicewake)
