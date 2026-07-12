---
read_when:
    - OpenClaw에서 발신 음성 통화를 걸려고 합니다
    - 음성 통화 Plugin을 구성하거나 개발하고 있습니다
    - 전화 통신에서 실시간 음성 또는 스트리밍 음성 변환이 필요합니다
sidebarTitle: Voice call
summary: Twilio, Telnyx 또는 Plivo를 통해 음성 통화를 발신 및 수신하고, 선택적으로 실시간 음성과 스트리밍 음성 변환을 사용할 수 있습니다.
title: 음성 통화 Plugin
x-i18n:
    generated_at: "2026-07-12T01:05:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Plugin을 통해 OpenClaw에서 음성 통화를 사용할 수 있습니다. 발신 알림, 다중 턴
대화, 전이중 실시간 음성, 스트리밍 전사, 허용 목록 정책이 적용된
수신 통화를 지원합니다.

**제공자:** `mock`(개발용, 네트워크 없음), `plivo`(Voice API + XML 전달 +
GetInput 음성), `telnyx`(Call Control v2), `twilio`(Programmable Voice +
Media Streams).

<Note>
Voice Call Plugin은 **Gateway 프로세스 내부에서** 실행됩니다. 원격
Gateway를 사용하는 경우 Gateway를 실행하는 시스템에 Plugin을 설치하고
구성한 다음, Plugin을 로드하도록 Gateway를 다시 시작하세요.
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
      <Tab title="로컬 폴더에서 설치(개발용)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    현재 릴리스 태그를 따르려면 버전 없는 패키지 이름을 사용하세요. 재현 가능한
    설치가 필요한 경우에만 정확한 버전을 고정하세요. 이후 Plugin이 로드되도록
    Gateway를 다시 시작하세요.

  </Step>
  <Step title="제공자 및 Webhook 구성">
    `plugins.entries.voice-call.config` 아래에 구성을 설정하세요(아래
    [구성](#configuration) 참조). 최소한 `provider`, 제공자
    자격 증명, `fromNumber`, 공개적으로 접근 가능한 Webhook URL이 필요합니다.
  </Step>
  <Step title="설정 확인">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Plugin 활성화 여부, 제공자 자격 증명, Webhook 공개 상태, 그리고
    하나의 오디오 모드(`streaming` 또는 `realtime`)만 활성화되어 있는지 확인합니다.

  </Step>
  <Step title="스모크 테스트">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    둘 다 기본적으로 모의 실행입니다. 짧은 발신 알림 통화를 실제로 걸려면
    `--yes`를 추가하세요.

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Twilio, Telnyx, Plivo의 경우 설정 결과가 **공개 Webhook URL**이어야 합니다.
`publicUrl`, 터널 URL, Tailscale URL 또는 serve 대체 경로가
local loopback이나 사설 네트워크 공간으로 해석되면, 통신사 Webhook을
수신할 수 없는 제공자를 시작하는 대신 설정이 실패합니다.
</Warning>

## 구성

`enabled: true`이지만 선택한 제공자의 자격 증명이 누락된 경우, Gateway
시작 로그에 누락된 키와 함께 설정 미완료 경고가 기록되고
런타임 시작을 건너뜁니다. 명령, RPC 호출, 에이전트 도구를 사용하면
여전히 누락된 정확한 구성 항목이 반환됩니다.

<Note>
음성 통화 자격 증명은 SecretRef를 지원합니다. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey`, `plugins.entries.voice-call.config.tts.providers.*.apiKey`는 표준 SecretRef 표면을 통해 해석됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하세요.
</Note>

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
            // region: "ie1", // 선택 사항: us1 | ie1 | au1, 기본값은 us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Mission Control Portal의 Telnyx Webhook 공개 키
            // (Base64, TELNYX_PUBLIC_KEY를 통해 설정할 수도 있음).
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
          realtime: { enabled: false /* 실시간 음성 대화 참조 */ },
        },
      },
    },
  },
}
```

### 구성 참조

위에 표시되지 않은 `plugins.entries.voice-call.config`의 최상위 키:

| 키                              | 기본값       | 참고                                                                                   |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | 전체 켜기/끄기 스위치입니다.                                                           |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. [수신 통화](#inbound-calls)를 참조하세요. |
| `allowFrom`                     | `[]`         | `inboundPolicy: "allowlist"`에 사용할 E.164 허용 목록입니다.                           |
| `maxDurationSeconds`            | `300`        | 응답 상태와 관계없이 적용되는 통화별 최대 시간 제한입니다.                            |
| `staleCallReaperSeconds`        | `120`        | [오래된 통화 정리기](#stale-call-reaper)를 참조하세요. `0`이면 비활성화됩니다.         |
| `silenceTimeoutMs`              | `800`        | 기존(비실시간) 흐름에서 발화 종료를 감지하는 무음 시간입니다.                          |
| `transcriptTimeoutMs`           | `180000`     | 턴을 포기하기 전까지 발신자 전사를 기다리는 최대 시간입니다.                          |
| `ringTimeoutMs`                 | `30000`      | 발신 통화의 벨 울림 제한 시간입니다.                                                   |
| `maxConcurrentCalls`            | `1`          | 이 제한을 초과하는 발신 통화는 거부됩니다.                                             |
| `outbound.notifyHangupDelaySec` | `3`          | 알림 모드에서 TTS 후 자동으로 통화를 종료하기까지 기다리는 시간(초)입니다.             |
| `skipSignatureVerification`     | `false`      | 로컬 테스트 전용이며, 프로덕션에서는 절대 활성화하지 마세요.                           |
| `store`                         | 설정되지 않음 | 기본 `~/.openclaw/voice-calls` 통화 로그 경로를 재정의합니다.                          |
| `agentId`                       | `"main"`     | 응답 생성 및 세션 저장에 사용하는 에이전트입니다.                                      |
| `responseModel`                 | 설정되지 않음 | 기존(비실시간) 응답의 기본 모델을 재정의합니다.                                        |
| `responseSystemPrompt`          | 자동 생성    | 기존 응답에 사용할 사용자 지정 시스템 프롬프트입니다.                                 |
| `responseTimeoutMs`             | `30000`      | 기존 응답 생성의 제한 시간(ms)입니다.                                                  |

Twilio는 기본적으로 US1 REST 엔드포인트를 사용합니다. 지원되는 미국 외
리전에서 통화를 처리하려면 `twilio.region`을 `ie1` 또는 `au1`로 설정하고
해당 리전의 자격 증명을 사용하세요.
[Twilio의 미국 외 REST API 가이드](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region)를 참조하세요.

<AccordionGroup>
  <Accordion title="제공자 공개 및 보안 참고 사항">
    - Twilio, Telnyx, Plivo는 모두 **공개적으로 접근 가능한** Webhook URL이 필요합니다.
    - `mock`은 로컬 개발용 제공자입니다(네트워크 호출 없음).
    - `skipSignatureVerification`이 true가 아니라면 Telnyx에는 `telnyx.publicKey`(또는 `TELNYX_PUBLIC_KEY`)가 필요합니다.
    - `skipSignatureVerification`은 로컬 테스트 전용입니다.
    - ngrok 무료 요금제에서는 `publicUrl`을 정확한 ngrok URL로 설정하세요. 서명 검증은 항상 적용됩니다.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true`는 `tunnel.provider="ngrok"`이고 `serve.bind`가 local loopback(ngrok 로컬 에이전트)인 경우에만 잘못된 서명이 있는 Twilio Webhook을 허용합니다. 로컬 개발 전용입니다.
    - Ngrok 무료 요금제 URL은 변경되거나 중간 안내 동작이 추가될 수 있습니다. `publicUrl`이 달라지면 Twilio 서명 검증이 실패합니다. 프로덕션에서는 안정적인 도메인이나 Tailscale funnel을 권장합니다.

  </Accordion>
  <Accordion title="스트리밍 연결 제한">
    - `streaming.preStartTimeoutMs`(기본값 `5000`)는 유효한 `start` 프레임을 전송하지 않는 소켓을 닫습니다.
    - `streaming.maxPendingConnections`(기본값 `32`)는 인증되지 않은 시작 전 소켓의 총수를 제한합니다.
    - `streaming.maxPendingConnectionsPerIp`(기본값 `4`)는 소스 IP별 인증되지 않은 시작 전 소켓 수를 제한합니다.
    - `streaming.maxConnections`(기본값 `128`)는 열려 있는 모든 미디어 스트림 소켓(대기 중 + 활성)의 수를 제한합니다.

  </Accordion>
  <Accordion title="레거시 구성 마이그레이션">
    구성 구문 분석 과정에서 다음 레거시 키를 자동으로 정규화하고
    대체 경로를 명시하는 경고를 기록합니다. 이 호환 계층은 향후
    릴리스(`2026.6.0`)에서 제거되므로, 커밋된 구성을 표준 형태로
    다시 작성하려면 `openclaw doctor --fix`를 실행하세요.

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt`는 제거되었습니다(이제 실시간 컨텍스트는 생성된 에이전트 프롬프트를 사용함).

  </Accordion>
</AccordionGroup>

## 세션 범위

기본적으로 Voice Call은 `sessionScope: "per-phone"`을 사용하므로 동일한
발신자가 반복해서 통화하면 대화 메모리가 유지됩니다. 각 통신사 통화를
새 컨텍스트로 시작해야 하는 경우 `sessionScope: "per-call"`을 설정하세요.
예를 들어 동일한 전화번호가 서로 다른 회의를 나타낼 수 있는 안내 데스크,
예약, IVR 또는 Google Meet 브리지 흐름에 적합합니다.

Voice Call은 구성된 에이전트 네임스페이스
(`agent:<agentId>:voice:*`) 아래에 생성된 세션 키를 저장합니다. 명시적인
원시 통합 키도 동일한 네임스페이스로 해석됩니다. 표준
`agent:<configuredAgentId>:*` 키는 해당 소유자를 유지하고 코어의
`session.mainKey`/전역 범위 별칭을 따릅니다. 외부 또는 잘못된 형식의
`agent:*` 입력은 구성된 에이전트 아래의 불투명 키로 범위가 지정됩니다.
`global`과 `unknown`은 전역 센티널로 유지됩니다.

## 실시간 음성 대화

`realtime`은 실시간 통화 오디오에 사용할 전이중 실시간 음성 제공자를
선택합니다. 오디오를 실시간 전사 제공자에게 전달하기만 하는
`streaming`과는 별개입니다.

<Warning>
`realtime.enabled`는 `streaming.enabled`와 함께 사용할 수 없습니다. 통화당
하나의 오디오 모드만 선택하세요.
</Warning>

현재 런타임 동작:

- `realtime.enabled`는 Twilio 및 Telnyx에서 지원됩니다.
- `realtime.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 등록된 첫 번째 실시간 음성 제공자를 사용합니다.
- 번들 실시간 음성 제공자: Google Gemini Live(`google`)와 OpenAI(`openai`)이며, 각각의 제공자 Plugin에서 등록합니다.
- 제공자가 소유하는 원시 구성은 `realtime.providers.<providerId>` 아래에 있습니다.
- Voice Call은 기본적으로 공유 실시간 도구인 `openclaw_agent_consult`를 제공합니다. 호출자가 더 심층적인 추론, 최신 정보 또는 일반 OpenClaw 도구를 요청하면 실시간 모델이 이 도구를 호출할 수 있습니다.
- `realtime.consultPolicy`는 실시간 모델이 `openclaw_agent_consult`를 호출해야 하는 시점에 관한 지침을 선택적으로 추가합니다.
- `realtime.agentContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call이 세션 설정 시 제한된 에이전트 정체성 및 선택된 작업 공간 파일 캡슐을 실시간 제공자 지침에 삽입합니다.
- `realtime.fastContext.enabled`는 기본적으로 꺼져 있습니다. 활성화하면 Voice Call은 먼저 상담 질문에 대해 인덱싱된 메모리/세션 컨텍스트를 검색하고, `realtime.fastContext.timeoutMs` 이내에 해당 발췌문을 실시간 모델에 반환합니다. 이후 `realtime.fastContext.fallbackToConsult`가 true인 경우에만 전체 상담 에이전트로 대체합니다.
- `realtime.provider`가 등록되지 않은 제공자를 가리키거나 실시간 음성 제공자가 전혀 등록되지 않은 경우, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 실시간 미디어를 건너뜁니다.
- `realtime.enabled`가 true이면 `inboundPolicy`가 `"disabled"`여서는 안 됩니다. `validateProviderConfig`는 이 조합을 거부합니다.
- 상담 세션 키는 사용 가능한 경우 저장된 통화 세션을 재사용하고, 그렇지 않으면 구성된 `sessionScope`(기본값은 `per-phone`, 격리된 통화에는 `per-call`)로 대체합니다.

### 도구 정책

`realtime.toolPolicy`는 상담 실행을 제어합니다.

| 정책             | 동작                                                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 상담 도구를 제공하고 일반 에이전트가 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`만 사용하도록 제한합니다. |
| `owner`          | 상담 도구를 제공하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 허용합니다.                                                       |
| `none`           | 상담 도구를 제공하지 않습니다. 사용자 지정 `realtime.tools`는 계속 실시간 제공자에 전달됩니다.                                              |

`realtime.consultPolicy`는 실시간 모델 지침만 제어합니다.

| 정책          | 지침                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| `auto`        | 기본 프롬프트를 유지하고 상담 도구 호출 시점을 제공자가 결정하도록 합니다.                               |
| `substantive` | 간단한 대화 연결 표현은 직접 답변하고 사실, 메모리, 도구 또는 컨텍스트가 필요하기 전에 상담합니다.       |
| `always`      | 실질적인 모든 답변 전에 상담합니다.                                                                      |

### 에이전트 음성 컨텍스트

일반적인 대화 차례마다 전체 에이전트 상담 왕복 비용을 들이지 않고 음성 브리지가
구성된 OpenClaw 에이전트처럼 들리게 하려면 `realtime.agentContext`를
활성화하세요. 컨텍스트 캡슐은 실시간 세션이 생성될 때 한 번만 추가되므로
대화 차례별 지연 시간은 늘어나지 않습니다. `openclaw_agent_consult` 호출은
여전히 전체 OpenClaw 에이전트를 실행하며 도구 작업, 최신 정보, 메모리 조회
또는 작업 공간 상태가 필요할 때 사용해야 합니다.

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

### 실시간 제공자 예시

<Tabs>
  <Tab title="Google Gemini Live">
    기본값: API 키는 `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    또는 `GOOGLE_API_KEY`에서 가져옵니다. 모델은 `gemini-3.1-flash-live-preview`,
    음성은 `Kore`입니다. 더 길고 재연결 가능한 통화를 위해
    `sessionResumption`과 `contextWindowCompression`은 기본적으로 활성화됩니다.
    전화 통신 오디오에서 더 빠른 대화 전환을 조정하려면 `silenceDurationMs`,
    `startSensitivity`, `endSensitivity`를 사용하세요.

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
                    model: "gemini-3.1-flash-live-preview",
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

제공자별 실시간 음성 옵션은 [Google 제공자](/ko/providers/google) 및
[OpenAI 제공자](/ko/providers/openai)를 참조하세요.

## 스트리밍 전사

`streaming`은 실시간 통화 오디오에 사용할 실시간 전사 제공자를 선택합니다.

현재 런타임 동작:

- `streaming.provider`는 선택 사항입니다. 설정하지 않으면 Voice Call은 등록된 첫 번째 실시간 전사 제공자를 사용합니다.
- 번들 실시간 전사 제공자: Deepgram(`deepgram`), ElevenLabs(`elevenlabs`), Mistral(`mistral`), OpenAI(`openai`), xAI(`xai`)이며, 각각의 제공자 Plugin에서 등록합니다.
- 제공자가 소유하는 원시 구성은 `streaming.providers.<providerId>` 아래에 있습니다.
- Twilio가 수락된 스트림 `start` 메시지를 전송하면 Voice Call은 즉시 스트림을 등록하고, 제공자가 연결되는 동안 수신 미디어를 전사 제공자의 대기열에 추가하며, 실시간 전사가 준비된 후에만 첫 인사말을 시작합니다.
- `streaming.provider`가 등록되지 않은 제공자를 가리키거나 등록된 제공자가 없는 경우, Voice Call은 전체 Plugin을 실패시키는 대신 경고를 기록하고 미디어 스트리밍을 건너뜁니다.

### 스트리밍 제공자 예시

<Tabs>
  <Tab title="OpenAI">
    기본값: API 키는 `streaming.providers.openai.apiKey` 또는
    `OPENAI_API_KEY`, 모델은 `gpt-4o-transcribe`, `silenceDurationMs: 800`,
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
    기본값: API 키는 `streaming.providers.xai.apiKey` 또는 `XAI_API_KEY`이며,
    둘 다 설정되지 않은 경우 xAI OAuth 인증 프로필로 대체합니다. 엔드포인트는
    `wss://api.x.ai/v1/stt`, 인코딩은 `mulaw`, 샘플링 속도는 `8000`,
    `endpointingMs: 800`, `interimResults: true`입니다.

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

Voice Call은 통화에서 음성을 스트리밍하기 위해 핵심 `messages.tts` 구성을
사용합니다. Plugin 구성 아래에서 **동일한 구조**로 재정의할 수 있으며,
`messages.tts`와 심층 병합됩니다.

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
**Microsoft 음성은 음성 통화에서 무시됩니다.** 전화 통신 합성에는
전화 통신 대상 출력을 구현하는 제공자가 필요합니다. Microsoft 음성
제공자는 이를 구현하지 않으므로 통화에서는 건너뛰고 대체 체인의 다른
제공자를 대신 시도합니다.
</Warning>

동작 참고 사항:

- Plugin 구성 내부의 레거시 `tts.<provider>` 키(`openai`, `elevenlabs`, `microsoft`, `edge`)는 `openclaw doctor --fix`로 복구됩니다. 커밋된 구성에서는 `tts.providers.<provider>`를 사용해야 합니다.
- Twilio 미디어 스트리밍이 활성화되면 핵심 TTS가 사용됩니다. 그렇지 않으면 통화는 제공자 네이티브 음성으로 대체됩니다.
- Twilio 미디어 스트림이 이미 활성화된 경우 Voice Call은 TwiML `<Say>`로 대체하지 않습니다. 해당 상태에서 전화 통신 TTS를 사용할 수 없으면 두 재생 경로를 혼합하는 대신 재생 요청이 실패합니다.
- 전화 통신 TTS가 보조 제공자로 대체되면 Voice Call은 디버깅을 위해 제공자 체인(`from`, `to`, `attempts`)이 포함된 경고를 기록합니다.
- Twilio 끼어들기 또는 스트림 종료로 보류 중인 TTS 대기열이 지워지면, 대기 중인 재생 요청은 재생 완료를 기다리는 호출자를 무기한 대기시키지 않고 완료 상태로 전환됩니다.

### TTS 예시

<Tabs>
  <Tab title="핵심 TTS만 사용">
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
  <Tab title="OpenAI 모델 재정의(심층 병합)">
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

## 수신 통화

수신 정책의 기본값은 `disabled`입니다. 수신 통화를 활성화하려면 다음과 같이 설정하세요.

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"`는 신뢰도가 낮은 발신자 ID 검사입니다. Plugin은
공급자가 제공한 `From` 값을 정규화한 후 `allowFrom`과 비교합니다.
Webhook 검증은 공급자의 전송과 페이로드 무결성을 인증하지만,
PSTN/VoIP 발신 번호의 소유권을 증명하지는 **않습니다**.
`allowFrom`은 강력한 발신자 신원 확인이 아니라 발신자 ID 필터링으로 간주하세요.
</Warning>

자동 응답은 에이전트 시스템을 사용합니다. `responseModel`,
`responseSystemPrompt`, `responseTimeoutMs`로 조정하세요.

### 번호별 라우팅

하나의 Voice Call Plugin이 여러 전화번호의 전화를 수신하고 각 번호가 서로 다른 회선처럼
동작해야 할 때 `numbers`를 사용하세요. 예를 들어 한 번호에서는 친근한 개인 비서를
사용하고, 다른 번호에서는 비즈니스 페르소나, 별도의 응답 에이전트, 다른 TTS 음성을
사용할 수 있습니다.

경로는 공급자가 제공한 수신 번호 `To`를 기준으로 선택됩니다. 키는 E.164 번호여야
합니다. 전화가 수신되면 Voice Call은 일치하는 경로를 한 번 확인하여 통화 레코드에
저장하고, 인사말, 기존 자동 응답 경로, 실시간 상담 경로, TTS 재생에 해당 유효 구성을
재사용합니다. 일치하는 경로가 없으면 전역 Voice Call 구성을 사용합니다. 발신 통화는
`numbers`를 사용하지 않습니다. 통화를 시작할 때 발신 대상, 메시지, 세션을 명시적으로
전달하세요.

현재 경로 재정의에서 지원하는 항목은 다음과 같습니다.

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

경로의 `tts` 값은 전역 Voice Call `tts` 구성 위에 깊은 병합되므로 일반적으로 공급자
음성만 재정의하면 됩니다.

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

자동 응답의 경우 Voice Call은 `{"spoken":"..."}` JSON 응답을 요구하는 엄격한 음성 출력
계약을 시스템 프롬프트에 추가합니다. Voice Call은 다음과 같이 음성 텍스트를 방어적으로
추출합니다.

- 추론/오류 콘텐츠로 표시된 페이로드를 무시합니다.
- 직접 JSON, 펜스로 감싼 JSON 또는 인라인 `"spoken"` 키를 파싱합니다.
- 일반 텍스트로 대체하고 계획/메타 내용으로 보이는 도입부 문단을 제거합니다.

이렇게 하면 음성 재생이 발신자에게 전달할 텍스트에 집중되고 계획 텍스트가 오디오로
유출되는 것을 방지할 수 있습니다.

### 대화 시작 동작

발신 `conversation` 통화의 첫 메시지 처리는 실시간 재생 상태에 연동됩니다.

- 초기 인사말이 실제로 재생 중일 때만 끼어들기 대기열 비우기와 자동 응답이 억제됩니다.
- 초기 재생이 실패하면 통화는 `listening`으로 돌아가고 초기 메시지는 재시도를 위해 대기열에 남습니다.
- Twilio 스트리밍의 초기 재생은 스트림 연결 시 추가 지연 없이 시작됩니다.
- 끼어들기는 활성 재생을 중단하고 대기열에 있지만 아직 재생되지 않은 Twilio TTS 항목을 비웁니다. 제거된 항목은 건너뜀으로 완료되므로 후속 응답 로직은 재생되지 않을 오디오를 기다리지 않고 계속할 수 있습니다.
- 실시간 음성 대화는 실시간 스트림 자체의 첫 발화를 사용합니다. Voice Call은 해당 초기 메시지에 대해 기존 `<Say>` TwiML 업데이트를 게시하지 **않으므로**, 발신 `<Connect><Stream>` 세션의 연결이 유지됩니다.

### Twilio 스트림 연결 해제 유예 시간

Twilio 미디어 스트림의 연결이 끊어지면 Voice Call은 통화를 자동 종료하기 전에
**2000ms** 동안 기다립니다.

- 해당 시간 안에 스트림이 다시 연결되면 자동 종료가 취소됩니다.
- 유예 기간 후에도 스트림이 다시 등록되지 않으면 활성 통화가 멈춘 상태로 남지 않도록 통화를 종료합니다.

## 오래된 통화 정리기

응답되지 않고 실제 대화 상태에도 도달하지 않는 통화를 종료하려면
`staleCallReaperSeconds`(기본값 **120**)를 사용하세요. 예를 들어 공급자가 종료 Webhook을
전송하지 않는 알림 모드 통화에 사용할 수 있습니다. 비활성화하려면 `0`으로 설정하세요.

정리기는 30초마다 실행되며 `answeredAt` 타임스탬프가 없고, 종료 상태 또는 실제
(`speaking`/`listening`) 상태가 아닌 통화만 종료합니다. 따라서 응답된 대화는 이 타이머로
절대 정리되지 않습니다. 너무 오래 지속되는 응답 통화는 별도 제한인
`maxDurationSeconds`(기본값 300)가 종료합니다.

통신사가 벨 울림/응답 Webhook을 늦게 전송할 수 있는 알림 방식 흐름에서는 느리지만
정상적인 통화가 조기에 정리되지 않도록 `staleCallReaperSeconds`를 기본값보다 높이세요.
프로덕션 환경에서는 `120`~`300`초가 적절한 범위입니다.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhook 보안

프록시나 터널이 Gateway 앞에 있으면 Plugin은 서명 검증에 사용할 공개 URL을
재구성합니다. 다음 옵션은 신뢰할 전달 헤더를 제어합니다.

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  전달 헤더에서 허용할 호스트 목록입니다.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  허용 목록 없이 전달 헤더를 신뢰합니다.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  요청의 원격 IP가 목록과 일치할 때만 전달 헤더를 신뢰합니다.
</ParamField>

추가 보호 기능:

- Twilio, Telnyx, Plivo에서는 Webhook **재전송 공격 방지**가 활성화됩니다. 재전송된 유효한 Webhook 요청은 수신 확인되지만 부수 효과는 실행하지 않습니다.
- Twilio 대화 턴은 `<Gather>` 콜백에 턴별 토큰을 포함하므로 오래되거나 재전송된 음성 콜백이 더 새로운 대기 중 전사 턴을 충족할 수 없습니다.
- 공급자가 요구하는 서명 헤더가 없으면 인증되지 않은 Webhook 요청은 본문을 읽기 전에 거부됩니다.
- voice-call Webhook은 서명 검증 전에 공유 사전 인증 본문 읽기 프로필(최대 본문 64KB, 읽기 제한 시간 5초)과 키별 처리 중 제한(기본적으로 키당 동시 요청 8개)을 사용합니다.

안정적인 공개 호스트를 사용하는 예:

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

Gateway가 이미 실행 중이면 운영용 `voicecall` 명령은 Gateway가 소유한 voice-call
런타임에 위임하므로 CLI가 두 번째 Webhook 서버를 바인딩하지 않습니다. 연결 가능한
Gateway가 없으면 명령은 독립 실행형 CLI 런타임으로 대체됩니다.

`latency`는 기본 voice-call 저장 경로에서 `calls.jsonl`을 읽습니다. 다른 로그를
지정하려면 `--file <path>`를 사용하고, 분석을 마지막 N개 레코드(기본값 200)로
제한하려면 `--last <n>`을 사용하세요. 출력에는 턴 지연 시간과 수신 대기 시간의
최솟값/최댓값/평균값, p50, p95가 포함됩니다.

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

voice-call Plugin에는 이에 대응하는 에이전트 Skills가 함께 제공됩니다.

## Gateway RPC

| 메서드                      | 인수                                                             | 참고                                                                      |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | `to`가 생략되면 `toNumber` 구성을 대신 사용합니다.                        |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | `initiate`와 동일하지만 연결 전 `dtmfSequence`도 허용합니다.              |
| `voicecall.continue`        | `callId`, `message`                                              | 턴이 완료될 때까지 차단하고 전사 내용을 반환합니다.                       |
| `voicecall.continue.start`  | `callId`, `message`                                              | 비동기 변형으로 `operationId`를 즉시 반환합니다.                          |
| `voicecall.continue.result` | `operationId`                                                    | 대기 중인 `voicecall.continue.start` 작업의 결과를 폴링합니다.            |
| `voicecall.speak`           | `callId`, `message`                                              | 기다리지 않고 말하며, `realtime.enabled`일 때 실시간 브리지를 사용합니다. |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                           |
| `voicecall.end`             | `callId`                                                         |                                                                           |
| `voicecall.status`          | `callId?`                                                        | 모든 활성 통화를 나열하려면 `callId`를 생략합니다.                        |

`dtmfSequence`는 `mode: "conversation"`에서만 유효합니다. 알림 모드 통화에서 연결 후
숫자 입력이 필요하면 통화가 생성된 후 `voicecall.dtmf`를 사용해야 합니다.

## 문제 해결

### 설정 중 Webhook 공개 실패

Gateway를 실행하는 환경과 동일한 환경에서 설정을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

`twilio`, `telnyx`, `plivo`에서는 `webhook-exposure`가 정상이어야 합니다.
구성된 `publicUrl`이 로컬 또는 사설 네트워크 공간을 가리키면 통신사가 해당 주소로
콜백할 수 없으므로 여전히 실패합니다. `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`,
`172.16.x`~`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` 또는 기타
통신사급 NAT 범위를 `publicUrl`로 사용하지 마세요.

Twilio 알림 모드 발신 통화는 초기 `<Say>` TwiML을 통화 생성 요청에 직접 전송하므로
첫 음성 메시지는 Twilio의 Webhook TwiML 가져오기에 의존하지 않습니다. 상태 콜백,
대화 통화, 연결 전 DTMF, 실시간 스트림, 연결 후 통화 제어에는 여전히 공개 Webhook이
필요합니다.

다음 중 하나의 공개 경로를 사용하세요.

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

구성을 변경한 후 Gateway를 다시 시작하거나 다시 로드하고 다음을 실행하세요.

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`--yes`를 전달하지 않으면 `voicecall smoke`는 모의 실행입니다.

### 공급자 자격 증명 실패

선택한 공급자와 필수 자격 증명 필드를 확인하세요.

- Twilio: `twilio.accountSid`, `twilio.authToken`, `fromNumber` 또는
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey`,
  `fromNumber` 또는 `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID`,
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken`, `fromNumber` 또는
  `PLIVO_AUTH_ID`, `PLIVO_AUTH_TOKEN`.

자격 증명은 Gateway 호스트에 있어야 합니다. 로컬 셸 프로필을 편집해도
Gateway를 다시 시작하거나 환경을 다시 로드하기 전까지는 이미 실행 중인
Gateway에 영향을 주지 않습니다.

### 통화는 시작되지만 제공업체 Webhook이 도착하지 않음

제공업체 콘솔이 정확한 공개 Webhook URL을 가리키는지 확인합니다.

```text
https://voice.example.com/voice/webhook
```

그런 다음 런타임 상태를 점검합니다.

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

일반적인 원인:

- `publicUrl`이 `serve.path`와 다른 경로를 가리킵니다.
- Gateway가 시작된 후 터널 URL이 변경되었습니다.
- 프록시가 요청을 전달하지만 호스트 또는 프로토콜 헤더를 제거하거나 다시 작성합니다.
- 방화벽 또는 DNS가 공개 호스트 이름을 Gateway가 아닌 다른 위치로 라우팅합니다.
- Voice Call Plugin을 활성화하지 않은 상태로 Gateway를 다시 시작했습니다.

Gateway 앞에 리버스 프록시 또는 터널이 있는 경우
`webhookSecurity.allowedHosts`를 공개 호스트 이름으로 설정하거나, 알려진
프록시 주소에 `webhookSecurity.trustedProxyIPs`를 사용합니다. 프록시 경계를
직접 제어하는 경우에만 `webhookSecurity.trustForwardingHeaders`를 사용합니다.

### 서명 검증 실패

제공업체 서명은 OpenClaw가 수신 요청으로부터 재구성한 공개 URL을 기준으로
검사됩니다. 서명 검증에 실패하는 경우:

- 제공업체 Webhook URL이 스킴, 호스트, 경로를 포함하여 `publicUrl`과 정확히 일치하는지 확인합니다.
- ngrok 무료 등급 URL의 경우 터널 호스트 이름이 변경되면 `publicUrl`을 업데이트합니다.
- 프록시가 원래 호스트 및 프로토콜 헤더를 보존하는지 확인하거나 `webhookSecurity.allowedHosts`를 구성합니다.
- 로컬 테스트 외에는 `skipSignatureVerification`을 활성화하지 마십시오.

### Google Meet Twilio 참여 실패

Google Meet는 Twilio 전화 접속 참여에 이 Plugin을 사용합니다. 먼저 Voice
Call을 확인합니다.

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

그런 다음 Google Meet 전송 방식을 명시적으로 확인합니다.

```bash
openclaw googlemeet setup --transport twilio
```

Voice Call은 정상이나 Meet 참가자가 참여하지 않는 경우 Meet 전화 접속 번호,
PIN, `--dtmf-sequence`를 확인합니다. 전화 통화는 정상이어도 잘못된 DTMF
시퀀스를 회의에서 거부하거나 무시할 수 있습니다.

Google Meet는 연결 전 DTMF 시퀀스를 사용하여 `voicecall.start`를 통해 Twilio
전화 구간을 시작합니다. Meet 전화 접속 안내가 늦게 나올 수 있으므로 PIN에서
파생된 시퀀스에는 Google Meet Plugin의 `voiceCall.dtmfDelayMs`(기본값
**12000 ms**)가 앞부분의 Twilio 대기 숫자로 포함됩니다. 그런 다음 Voice
Call은 도입 인사를 요청하기 전에 실시간 처리로 다시 리디렉션합니다.

실시간 단계 추적에는 `openclaw logs --follow`를 사용합니다. 정상적인 Twilio
Meet 참여에서는 다음 순서로 로그가 기록됩니다.

- Google Meet가 Twilio 참여를 Voice Call에 위임합니다.
- Voice Call이 연결 전 DTMF TwiML을 저장합니다.
- 실시간 처리 전에 Twilio 초기 TwiML이 사용되고 제공됩니다.
- Voice Call이 Twilio 통화에 실시간 TwiML을 제공합니다.
- Google Meet가 DTMF 이후 지연 시간이 지난 후 `voicecall.speak`로 도입 음성을 요청합니다.

`openclaw voicecall tail`에는 여전히 저장된 통화 레코드가 표시됩니다. 통화
상태와 대화 내용에는 유용하지만, 모든 Webhook 또는 실시간 전환이 여기에
표시되지는 않습니다.

### 실시간 통화에 음성이 없음

하나의 오디오 모드만 활성화되어 있는지 확인합니다. `realtime.enabled`와
`streaming.enabled`를 동시에 `true`로 설정할 수 없습니다.

실시간 Twilio/Telnyx 통화의 경우 다음 사항도 확인합니다.

- 실시간 제공업체 Plugin이 로드되고 등록되어 있습니다.
- `realtime.provider`가 설정되어 있지 않거나 등록된 제공업체를 지정합니다.
- 제공업체 API 키를 Gateway 프로세스에서 사용할 수 있습니다.
- `openclaw logs --follow`에 실시간 TwiML 제공, 실시간 브리지 시작, 초기 인사말 대기가 표시됩니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [텍스트 음성 변환](/ko/tools/tts)
- [음성 깨우기](/ko/nodes/voicewake)
