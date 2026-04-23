---
read_when:
    - 번들 Codex app-server 하네스를 사용하려고 합니다
    - Codex 모델 ref와 구성 예시가 필요합니다
    - Codex 전용 배포를 위해 Pi fallback을 비활성화하려고 합니다
summary: 번들 Codex app-server 하네스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex Harness
x-i18n:
    generated_at: "2026-04-23T14:05:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8172af40edb7d1f7388a606df1c8f776622ffd82b46245fb9fbd184fbf829356
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex Harness

번들 `codex` Plugin은 OpenClaw가 내장된 PI 하네스 대신
Codex app-server를 통해 임베디드 에이전트 턴을 실행할 수 있게 합니다.

모델 탐색, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행처럼
저수준 에이전트 세션을 Codex가 직접 관리하게 하려면 이것을 사용하세요.
OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구,
승인, 미디어 전송, 그리고 표시되는 transcript 미러를 소유합니다.

네이티브 Codex 턴도 공유 Plugin hook을 존중하므로 프롬프트 shim,
Compaction 인식 자동화, 도구 미들웨어, 수명 주기 옵저버가 PI 하네스와
일관되게 유지됩니다:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `tool_result`, `after_tool_call`
- `before_message_write`
- `agent_end`

번들 Plugin은 비동기 `tool_result` 미들웨어를 추가하기 위해
Codex app-server extension factory도 등록할 수 있습니다.

이 하네스는 기본적으로 꺼져 있습니다. `codex` Plugin이 활성화되어 있고
해결된 모델이 `codex/*` 모델일 때, 또는 `embeddedHarness.runtime: "codex"`나
`OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제할 때만 선택됩니다.
`codex/*`를 전혀 구성하지 않으면 기존의 PI, OpenAI, Anthropic, Gemini, local,
custom-provider 실행은 현재 동작을 유지합니다.

## 올바른 모델 접두사 선택

OpenClaw에는 OpenAI 액세스와 Codex 형태 액세스에 대해 별도의 경로가 있습니다:

| Model ref              | 런타임 경로                                 | 사용 시점                                                                |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `openai/gpt-5.4`       | OpenClaw/PI 플로우를 통한 OpenAI provider   | `OPENAI_API_KEY`로 직접 OpenAI Platform API에 액세스하려는 경우          |
| `openai-codex/gpt-5.4` | PI를 통한 OpenAI Codex OAuth provider       | Codex app-server 하네스 없이 ChatGPT/Codex OAuth를 사용하려는 경우       |
| `codex/gpt-5.4`        | 번들 Codex provider + Codex 하네스          | 임베디드 에이전트 턴에 네이티브 Codex app-server 실행을 사용하려는 경우  |

Codex Harness는 `codex/*` 모델 ref만 처리합니다. 기존 `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, local, custom provider ref는
기존의 일반 경로를 유지합니다.

## 요구 사항

- 번들 `codex` Plugin을 사용할 수 있는 OpenClaw.
- Codex app-server `0.118.0` 이상.
- app-server 프로세스에서 사용할 수 있는 Codex 인증.

이 Plugin은 더 오래되었거나 버전이 없는 app-server 핸드셰이크를 차단합니다. 이렇게 하면
OpenClaw가 테스트된 프로토콜 표면에서만 동작하도록 유지됩니다.

라이브 및 Docker 스모크 테스트에서는 인증이 일반적으로 `OPENAI_API_KEY`,
그리고 선택적으로 `~/.codex/auth.json` 및
`~/.codex/config.toml` 같은 Codex CLI 파일에서 제공됩니다. 로컬 Codex app-server에서
사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 구성

`codex/gpt-5.4`를 사용하고, 번들 Plugin을 활성화하고, `codex` 하네스를 강제합니다:

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

구성에서 `plugins.allow`를 사용하는 경우 여기에 `codex`도 포함하세요:

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

`agents.defaults.model` 또는 개별 에이전트 모델을 `codex/<model>`로 설정하면
번들 `codex` Plugin도 자동으로 활성화됩니다. 명시적인 Plugin 항목은
공유 구성에서 여전히 유용한데, 배포 의도를 분명히 보여주기 때문입니다.

## 다른 모델을 대체하지 않고 Codex 추가

`codex/*` 모델에는 Codex를, 그 외 모든 것에는 PI를 사용하려면
`runtime: "auto"`를 유지하세요:

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

이 형태에서는:

- `/model codex` 또는 `/model codex/gpt-5.4`는 Codex app-server 하네스를 사용합니다.
- `/model gpt` 또는 `/model openai/gpt-5.4`는 OpenAI provider 경로를 사용합니다.
- `/model opus`는 Anthropic provider 경로를 사용합니다.
- Codex가 아닌 모델이 선택되면 PI가 호환성 하네스로 유지됩니다.

## Codex 전용 배포

모든 임베디드 에이전트 턴이 Codex Harness를 사용함을 보장해야 한다면
PI fallback을 비활성화하세요:

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

fallback이 비활성화되면 Codex Plugin이 비활성화되어 있거나,
요청한 모델이 `codex/*` ref가 아니거나, app-server가 너무 오래되었거나,
app-server를 시작할 수 없는 경우 OpenClaw는 초기에 실패합니다.

## 에이전트별 Codex

하나의 에이전트만 Codex 전용으로 만들고 기본 에이전트는
일반 auto-selection을 유지할 수 있습니다:

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

일반 세션 명령으로 에이전트와 모델을 전환하세요. `/new`는 새
OpenClaw 세션을 만들고 Codex Harness는 필요에 따라 sidecar app-server
스레드를 생성하거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션 바인딩을 지웁니다.

## 모델 탐색

기본적으로 Codex Plugin은 app-server에 사용 가능한 모델을 요청합니다. 탐색이
실패하거나 시간 초과되면 번들 fallback catalog를 사용합니다:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

`plugins.entries.codex.config.discovery` 아래에서 탐색을 조정할 수 있습니다:

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

시작 시 Codex 탐색을 피하고 fallback catalog만 사용하게 하려면
탐색을 비활성화하세요:

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

## App-server 연결 및 정책

기본적으로 Plugin은 다음 명령으로 로컬에서 Codex를 시작합니다:

```bash
codex app-server --listen stdio://
```

기본적으로 OpenClaw는 로컬 Codex Harness 세션을 YOLO 모드로 시작합니다:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, 그리고
`sandbox: "danger-full-access"`. 이는 자율 Heartbeat에 사용되는
신뢰된 로컬 운영자 자세입니다. Codex는
아무도 응답하지 않는 네이티브 승인 프롬프트에서 멈추지 않고 shell 및 network 도구를 사용할 수 있습니다.

Codex guardian 검토 승인에 참여하려면 `appServer.mode:
"guardian"`을 설정하세요:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian 모드는 다음으로 확장됩니다:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

Guardian은 네이티브 Codex 승인 검토자입니다. Codex가 샌드박스를 벗어나거나,
워크스페이스 밖에 쓰기를 하거나, network access 같은 권한을 추가하려고 하면,
Codex는 해당 승인 요청을 사람 프롬프트 대신 검토자 하위 에이전트로 전달합니다.
검토자는 컨텍스트를 수집하고 Codex의 위험 프레임워크를 적용한 다음,
해당 요청을 승인하거나 거부합니다. Guardian은 YOLO 모드보다 더 많은
가드레일이 필요하지만, 무인 에이전트와 Heartbeat가 여전히 진행되어야 할 때 유용합니다.

Docker 라이브 하네스에는
`OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`일 때 Guardian probe가 포함됩니다. 이 probe는
Guardian 모드로 Codex Harness를 시작하고, 무해한 권한 상승 shell 명령이 승인되는지 검증하며,
신뢰되지 않은 외부 대상에 가짜 시크릿을 업로드하는 요청이 거부되어
에이전트가 명시적 승인을 다시 요청하는지 검증합니다.

고급 배포에서는 개별 정책 필드가 여전히 `mode`보다 우선하므로,
이 프리셋과 명시적 선택을 함께 조합할 수 있습니다.

이미 실행 중인 app-server에는 WebSocket 전송을 사용하세요:

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

| Field               | 기본값                                  | 의미                                                                                                   |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                               | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                     |
| `command`           | `"codex"`                               | stdio 전송용 실행 파일.                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인자.                                                                                    |
| `url`               | unset                                   | WebSocket app-server URL.                                                                              |
| `authToken`         | unset                                   | WebSocket 전송용 Bearer 토큰.                                                                          |
| `headers`           | `{}`                                    | 추가 WebSocket 헤더.                                                                                   |
| `requestTimeoutMs`  | `60000`                                 | app-server control-plane 호출용 타임아웃.                                                              |
| `mode`              | `"yolo"`                                | YOLO 또는 guardian-reviewed 실행용 프리셋.                                                             |
| `approvalPolicy`    | `"never"`                               | 스레드 시작/재개/턴에 전달되는 네이티브 Codex 승인 정책.                                               |
| `sandbox`           | `"danger-full-access"`                  | 스레드 시작/재개에 전달되는 네이티브 Codex 샌드박스 모드.                                              |
| `approvalsReviewer` | `"user"`                                | Codex Guardian이 프롬프트를 검토하게 하려면 `"guardian_subagent"`를 사용하세요.                       |
| `serviceTier`       | unset                                   | 선택적 Codex app-server 서비스 계층: `"fast"`, `"flex"`, 또는 `null`. 잘못된 레거시 값은 무시됩니다. |

이전 환경 변수도 일치하는 config 필드가 설정되지 않았을 때
로컬 테스트용 fallback으로 계속 동작합니다:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`를 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`를 사용하세요. 반복 가능한 배포에서는
config를 권장합니다. 이렇게 하면 Plugin 동작이 나머지 Codex Harness 설정과 함께
동일한 검토된 파일에 유지됩니다.

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

PI fallback을 비활성화한 Codex 전용 Harness 검증:

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

Guardian 검토 Codex 승인:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
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

명시적 헤더를 사용하는 원격 app-server:

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

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이
기존 Codex 스레드에 연결되어 있을 때 다음 턴은 현재 선택된
`codex/*` 모델, provider, 승인 정책, 샌드박스, 서비스 계층을
다시 app-server로 보냅니다. `codex/gpt-5.4`에서 `codex/gpt-5.2`로 전환하면
스레드 바인딩은 유지되지만, 새로 선택한 모델로 계속 진행하도록 Codex에 요청합니다.

## Codex 명령

번들 Plugin은 `/codex`를 승인된 슬래시 명령으로 등록합니다. 이 명령은
일반적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 동작합니다.

일반적인 형태:

- `/codex status`는 실시간 app-server 연결 상태, 모델, 계정, rate limit, MCP 서버, Skills를 표시합니다.
- `/codex models`는 실시간 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 연결된 스레드를 compact하도록 Codex app-server에 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 검토를 시작합니다.
- `/codex account`는 계정 및 rate-limit 상태를 표시합니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 Harness가 일반 턴에 사용하는 것과 동일한 sidecar 바인딩 파일을 기록합니다.
다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw
`codex/*` 모델을 app-server에 전달하며, 확장 기록을 활성화된 상태로 유지합니다.

이 명령 표면은 Codex app-server `0.118.0` 이상이 필요합니다. 향후 또는 사용자 지정 app-server가
해당 JSON-RPC 메서드를 노출하지 않는 경우 개별 제어 메서드는
`unsupported by this Codex app-server`로 보고됩니다.

## 도구, 미디어 및 Compaction

Codex Harness는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 빌드하고 하네스에서 동적 도구 결과를 받습니다.
텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은
계속 일반 OpenClaw 전송 경로를 통해 전달됩니다.

Codex가 `_meta.codex_approval_kind`를
`"mcp_tool_call"`로 표시할 때 Codex MCP 도구 승인 요청은 OpenClaw의 Plugin
승인 흐름을 통해 라우팅됩니다. 다른 요청 및 자유 형식 입력 요청은 여전히
fail-closed됩니다.

선택된 모델이 Codex Harness를 사용할 때 네이티브 스레드 Compaction은
Codex app-server에 위임됩니다. OpenClaw는 채널 기록,
검색, `/new`, `/reset`, 그리고 향후 모델 또는 하네스 전환을 위해 transcript 미러를 유지합니다.
이 미러에는 app-server가 이를 방출할 때 사용자 프롬프트, 최종 assistant 텍스트,
그리고 가벼운 Codex 추론 또는 계획 기록이 포함됩니다. 현재 OpenClaw는
네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는
Compaction 요약이나 Compaction 후 Codex가 어떤 항목을 유지했는지에 대한
감사 가능한 목록은 노출하지 않습니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어
이해는 계속 `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel`, `messages.tts` 같은 해당 provider/모델 설정을 사용합니다.

## 문제 해결

**`/model`에 Codex가 나타나지 않음:** `plugins.entries.codex.enabled`를 활성화하고,
`codex/*` 모델 ref를 설정하거나, `plugins.allow`가 `codex`를 제외하고 있는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** Codex Harness가 실행을 처리하지 않으면
OpenClaw는 PI를 호환성 백엔드로 사용할 수 있습니다. 테스트 중에 Codex 선택을 강제하려면
`embeddedHarness.runtime: "codex"`를 설정하거나,
일치하는 Plugin Harness가 없을 때 실패하게 하려면 `embeddedHarness.fallback: "none"`을 설정하세요.
Codex app-server가 선택되면 그 실패는 추가 fallback config 없이
직접 드러납니다.

**app-server가 거부됨:** app-server 핸드셰이크가
버전 `0.118.0` 이상을 보고하도록 Codex를 업그레이드하세요.

**모델 탐색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나
탐색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`,
그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 정상입니다. Codex Harness는
`codex/*` 모델 ref만 처리합니다.

## 관련 문서

- [에이전트 Harness Plugin](/ko/plugins/sdk-agent-harness)
- [모델 Provider](/ko/concepts/model-providers)
- [구성 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing#live-codex-app-server-harness-smoke)
