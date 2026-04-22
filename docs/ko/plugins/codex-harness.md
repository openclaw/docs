---
read_when:
    - 번들된 Codex 앱-서버 하니스를 사용하려고 합니다.
    - Codex 모델 참조와 구성 예제가 필요합니다.
    - Codex 전용 배포를 위해 Pi 폴백을 비활성화하려고 합니다.
summary: 번들된 Codex 앱-서버 하니스를 통해 OpenClaw 임베디드 에이전트 턴을 실행합니다
title: Codex 하니스
x-i18n:
    generated_at: "2026-04-22T06:00:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d45dbd39a7d8ebb3a39d8dca3a5125c07b7168d1658ca07b85792645fb98613c
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 하니스

번들된 `codex` Plugin을 사용하면 OpenClaw가 내장된 PI 하니스 대신
Codex 앱-서버를 통해 임베디드 에이전트 턴을 실행할 수 있습니다.

이는 Codex가 저수준 에이전트 세션, 즉 모델 검색, 네이티브 스레드 재개,
네이티브 Compaction, 앱-서버 실행을 담당하도록 하려는 경우에 사용합니다.
OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구, 승인,
미디어 전달, 그리고 사용자에게 보이는 트랜스크립트 미러를 담당합니다.

하니스는 기본적으로 꺼져 있습니다. `codex` Plugin이 활성화되어 있고
해결된 모델이 `codex/*` 모델일 때만 선택되며, 또는
`embeddedHarness.runtime: "codex"`나 `OPENCLAW_AGENT_RUNTIME=codex`를
명시적으로 강제한 경우에 선택됩니다.
`codex/*`를 전혀 구성하지 않으면, 기존 PI, OpenAI, Anthropic, Gemini, local,
custom-provider 실행은 현재 동작을 그대로 유지합니다.

## 올바른 모델 접두사 선택

OpenClaw는 OpenAI 접근과 Codex 형태 접근에 대해 별도의 경로를 가집니다.

| 모델 참조              | 런타임 경로                               | 사용 시점                                                               |
| ---------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenClaw/PI 플로우를 통한 OpenAI provider | `OPENAI_API_KEY`로 OpenAI Platform API에 직접 접근하려는 경우입니다.    |
| `openai-codex/gpt-5.4` | PI를 통한 OpenAI Codex OAuth provider     | Codex 앱-서버 하니스 없이 ChatGPT/Codex OAuth를 사용하려는 경우입니다.  |
| `codex/gpt-5.4`        | 번들된 Codex provider 및 Codex 하니스     | 임베디드 에이전트 턴에 네이티브 Codex 앱-서버 실행을 사용하려는 경우입니다. |

Codex 하니스는 `codex/*` 모델 참조만 처리합니다. 기존 `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, custom provider 참조는
기존의 일반 경로를 유지합니다.

## 요구 사항

- 번들된 `codex` Plugin을 사용할 수 있는 OpenClaw.
- Codex 앱-서버 `0.118.0` 이상.
- 앱-서버 프로세스에서 사용할 수 있는 Codex 인증.

이 Plugin은 버전이 없거나 더 오래된 앱-서버 핸드셰이크를 차단합니다.
이를 통해 OpenClaw가 검증된 프로토콜 표면에서만 동작하도록 유지합니다.

라이브 및 Docker 스모크 테스트에서는 인증이 일반적으로 `OPENAI_API_KEY`와
선택적 Codex CLI 파일(예: `~/.codex/auth.json`,
`~/.codex/config.toml`)에서 제공됩니다. 로컬 Codex 앱-서버가 사용하는 것과
같은 인증 자료를 사용하세요.

## 최소 구성

`codex/gpt-5.4`를 사용하고, 번들된 Plugin을 활성화하고, `codex` 하니스를
강제합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

구성에서 `plugins.allow`를 사용한다면, 거기에도 `codex`를 포함하세요.

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

`agents.defaults.model` 또는 에이전트 모델을 `codex/<model>`로 설정해도
번들된 `codex` Plugin이 자동으로 활성화됩니다. 그래도 명시적인 Plugin 항목은
공유 구성에서 배포 의도를 분명히 드러내므로 여전히 유용합니다.

## 다른 모델을 대체하지 않고 Codex 추가

`codex/*` 모델에는 Codex를 사용하고, 나머지에는 PI를 사용하려면
`runtime: "auto"`를 유지하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

이 구성에서는 다음과 같습니다.

- `/model codex` 또는 `/model codex/gpt-5.4`는 Codex 앱-서버 하니스를 사용합니다.
- `/model gpt` 또는 `/model openai/gpt-5.4`는 OpenAI provider 경로를 사용합니다.
- `/model opus`는 Anthropic provider 경로를 사용합니다.
- Codex가 아닌 모델이 선택되면, PI가 호환성 하니스로 유지됩니다.

## Codex 전용 배포

모든 임베디드 에이전트 턴이 Codex 하니스를 사용한다는 점을 증명해야 한다면
PI 폴백을 비활성화하세요.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

환경 변수 재정의:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

폴백이 비활성화되면, Codex Plugin이 비활성화되어 있거나,
요청된 모델이 `codex/*` 참조가 아니거나, 앱-서버가 너무 오래되었거나,
앱-서버를 시작할 수 없는 경우 OpenClaw는 초기에 실패합니다.

## 에이전트별 Codex

기본 에이전트는 일반적인 자동 선택을 유지하면서, 특정 에이전트 하나만
Codex 전용으로 만들 수 있습니다.

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

일반적인 세션 명령으로 에이전트와 모델을 전환하세요. `/new`는 새로운
OpenClaw 세션을 만들고, Codex 하니스는 필요에 따라 해당 사이드카 앱-서버
스레드를 생성하거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션
바인딩을 지웁니다.

## 모델 검색

기본적으로 Codex Plugin은 앱-서버에 사용 가능한 모델을 요청합니다.
검색이 실패하거나 시간 초과되면, 번들된 폴백 카탈로그를 사용합니다.

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

`plugins.entries.codex.config.discovery` 아래에서 검색 동작을 조정할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

시작 시 Codex 탐지를 피하고 폴백 카탈로그만 사용하려면 검색을 비활성화하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 앱-서버 연결 및 정책

기본적으로 Plugin은 다음과 같이 로컬에서 Codex를 시작합니다.

```bash
codex app-server --listen stdio://
```

기본적으로 OpenClaw는 Codex에 네이티브 승인을 요청하도록 지시합니다.
예를 들어 정책을 더 엄격하게 하고 검토를 guardian으로 라우팅하는 등,
이 정책을 추가로 조정할 수 있습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "untrusted",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

이미 실행 중인 앱-서버에는 WebSocket 전송을 사용하세요.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

지원되는 `appServer` 필드:

| 필드                | 기본값                                   | 의미                                                                     |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 시작하고, `"websocket"`은 `url`에 연결합니다.       |
| `command`           | `"codex"`                                | stdio 전송용 실행 파일입니다.                                            |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인수입니다.                                                 |
| `url`               | unset                                    | WebSocket 앱-서버 URL입니다.                                             |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer 토큰입니다.                                      |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다.                                               |
| `requestTimeoutMs`  | `60000`                                  | 앱-서버 제어 플레인 호출의 시간 초과입니다.                              |
| `approvalPolicy`    | `"on-request"`                           | 스레드 시작/재개/턴 시 전송되는 네이티브 Codex 승인 정책입니다.          |
| `sandbox`           | `"workspace-write"`                      | 스레드 시작/재개 시 전송되는 네이티브 Codex 샌드박스 모드입니다.         |
| `approvalsReviewer` | `"user"`                                 | Codex guardian이 네이티브 승인을 검토하도록 하려면 `"guardian_subagent"`를 사용합니다. |
| `serviceTier`       | unset                                    | 선택적 Codex 서비스 등급입니다. 예: `"priority"`.                        |

이전 환경 변수도, 일치하는 구성 필드가 설정되지 않은 경우 로컬 테스트용 폴백으로
계속 사용할 수 있습니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

반복 가능한 배포를 위해서는 구성을 사용하는 것이 좋습니다.

## 일반적인 레시피

기본 stdio 전송을 사용하는 로컬 Codex:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

PI 폴백을 비활성화한 Codex 전용 하니스 검증:

```json5
{
  embeddedHarness: {
    fallback: "none",
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

guardian이 검토하는 Codex 승인:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

명시적 헤더를 사용하는 원격 앱-서버:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이 기존 Codex 스레드에
연결되어 있을 때, 다음 턴은 현재 선택된 `codex/*` 모델, provider, 승인 정책,
sandbox, service tier를 다시 앱-서버로 보냅니다.
`codex/gpt-5.4`에서 `codex/gpt-5.2`로 전환하면 스레드 바인딩은 유지되지만,
Codex에는 새로 선택된 모델로 계속 진행하도록 요청합니다.

## Codex 명령

번들된 Plugin은 `/codex`를 승인된 슬래시 명령으로 등록합니다.
이는 일반적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 동작합니다.

일반적인 형식:

- `/codex status`는 실시간 앱-서버 연결 상태, 모델, 계정, rate limit, MCP 서버, Skills를 표시합니다.
- `/codex models`는 실시간 Codex 앱-서버 모델 목록을 표시합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 연결된 스레드에 대해 Codex 앱-서버에 Compaction을 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 검토를 시작합니다.
- `/codex account`는 계정 및 rate-limit 상태를 표시합니다.
- `/codex mcp`는 Codex 앱-서버 MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex 앱-서버 Skills를 나열합니다.

`/codex resume`는 하니스가 일반 턴에 사용하는 것과 동일한 사이드카 바인딩 파일을
씁니다. 다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된
OpenClaw `codex/*` 모델을 앱-서버에 전달하며, 확장된 기록을 계속 활성화된
상태로 유지합니다.

이 명령 표면은 Codex 앱-서버 `0.118.0` 이상이 필요합니다. 향후 버전 또는
커스텀 앱-서버가 해당 JSON-RPC 메서드를 노출하지 않는 경우, 개별 제어 메서드는
`unsupported by this Codex app-server`로 보고됩니다.

## 도구, 미디어, Compaction

Codex 하니스는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 만들고 하니스로부터 동적 도구 결과를 받습니다.
텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속해서 일반적인
OpenClaw 전달 경로를 통해 처리됩니다.

선택된 모델이 Codex 하니스를 사용하는 경우, 네이티브 스레드 Compaction은
Codex 앱-서버에 위임됩니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`,
그리고 향후 모델 또는 하니스 전환을 위해 트랜스크립트 미러를 유지합니다.
이 미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, 그리고 앱-서버가 이를
내보낼 때 경량 Codex 추론 또는 계획 기록이 포함됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS,
미디어 이해는 계속해서 `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel`, `messages.tts` 같은 해당 provider/모델
설정을 사용합니다.

## 문제 해결

**`/model`에 Codex가 표시되지 않음:** `plugins.entries.codex.enabled`를
활성화하고, `codex/*` 모델 참조를 설정하거나, `plugins.allow`에서 `codex`가
제외되어 있는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** Codex 하니스가 실행을 처리하지 않으면,
OpenClaw는 호환성 백엔드로 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을
강제하려면 `embeddedHarness.runtime: "codex"`를 설정하고, 일치하는 Plugin
하니스가 없을 때 실패하게 하려면 `embeddedHarness.fallback: "none"`을
설정하세요. Codex 앱-서버가 선택되면, 해당 실패는 추가 폴백 구성 없이 직접
표면화됩니다.

**앱-서버가 거부됨:** 앱-서버 핸드셰이크가 버전 `0.118.0` 이상을 보고하도록
Codex를 업그레이드하세요.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를
낮추거나 검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`, 그리고 원격
앱-서버가 동일한 Codex 앱-서버 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 이는 예상된 동작입니다. Codex 하니스는
`codex/*` 모델 참조만 처리합니다.

## 관련 항목

- [에이전트 하니스 Plugin](/ko/plugins/sdk-agent-harness)
- [모델 provider](/ko/concepts/model-providers)
- [구성 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing#live-codex-app-server-harness-smoke)
