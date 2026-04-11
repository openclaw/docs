---
read_when:
    - 번들된 Codex app-server 하네스를 사용하려고 합니다
    - Codex 모델 참조와 구성 예시가 필요합니다
    - Codex 전용 배포를 위해 PI fallback을 비활성화하려고 합니다
summary: 번들된 Codex app-server 하네스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex 하네스
x-i18n:
    generated_at: "2026-04-11T02:46:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60e1dcf4f1a00c63c3ef31d72feac44bce255421c032c58fa4fd67295b3daf23
    source_path: plugins/codex-harness.md
    workflow: 15
---

# Codex 하네스

번들된 `codex` plugin을 사용하면 OpenClaw가 내장된 PI 하네스 대신
Codex app-server를 통해 임베디드 에이전트 턴을 실행할 수 있습니다.

이는 Codex가 저수준 에이전트 세션을 직접 관리하도록 하려는 경우에 사용합니다:
모델 검색, 네이티브 스레드 재개, 네이티브 compaction, app-server 실행.
OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구,
승인, 미디어 전달, 그리고 사용자에게 보이는 transcript 미러를 관리합니다.

이 하네스는 기본적으로 꺼져 있습니다. `codex` plugin이 활성화되어 있고 확인된 모델이 `codex/*` 모델일 때만 선택되며, 또는 `embeddedHarness.runtime: "codex"`나 `OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제한 경우에 선택됩니다.
`codex/*`를 전혀 구성하지 않으면 기존의 PI, OpenAI, Anthropic, Gemini, 로컬,
및 custom-provider 실행은 현재 동작을 그대로 유지합니다.

## 올바른 모델 접두사 선택하기

OpenClaw는 OpenAI 접근과 Codex 형태 접근에 대해 별도의 경로를 제공합니다:

| 모델 참조 | 런타임 경로 | 사용 시점 |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`       | OpenClaw/PI 배선을 통한 OpenAI provider 경로 | `OPENAI_API_KEY`로 직접 OpenAI Platform API에 접근하려는 경우 |
| `openai-codex/gpt-5.4` | PI를 통한 OpenAI Codex OAuth provider 경로 | Codex app-server 하네스 없이 ChatGPT/Codex OAuth를 사용하려는 경우 |
| `codex/gpt-5.4`        | 번들된 Codex provider + Codex 하네스 | 임베디드 에이전트 턴에 네이티브 Codex app-server 실행을 사용하려는 경우 |

Codex 하네스는 `codex/*` 모델 참조만 처리합니다. 기존 `openai/*`,
`openai-codex/*`, Anthropic, Gemini, xAI, 로컬, custom provider 참조는
기존의 일반 경로를 유지합니다.

## 요구 사항

- 번들된 `codex` plugin을 사용할 수 있는 OpenClaw.
- Codex app-server `0.118.0` 이상.
- app-server 프로세스에서 사용할 수 있는 Codex 인증.

plugin은 더 오래되었거나 버전이 없는 app-server 핸드셰이크를 차단합니다. 이를 통해
OpenClaw가 테스트된 프로토콜 표면 위에서 동작하도록 보장합니다.

라이브 및 Docker 스모크 테스트에서는 인증이 보통 `OPENAI_API_KEY`에서 오며, 선택적으로
`~/.codex/auth.json` 및 `~/.codex/config.toml` 같은 Codex CLI 파일도 사용할 수 있습니다.
로컬 Codex app-server가 사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 구성

`codex/gpt-5.4`를 사용하고, 번들된 plugin을 활성화하고, `codex` 하네스를 강제합니다:

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

구성에서 `plugins.allow`를 사용한다면 거기에 `codex`도 포함하세요:

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

`agents.defaults.model` 또는 에이전트 모델을 `codex/<model>`로 설정하면
번들된 `codex` plugin도 자동으로 활성화됩니다. 명시적인 plugin 항목은
공유 구성에서 여전히 유용한데, 배포 의도를 명확하게 드러내기 때문입니다.

## 다른 모델을 대체하지 않고 Codex 추가하기

`codex/*` 모델에는 Codex를, 그 외에는 PI를 사용하려면 `runtime: "auto"`를 유지하세요:

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

이 구성에서는:

- `/model codex` 또는 `/model codex/gpt-5.4`는 Codex app-server 하네스를 사용합니다.
- `/model gpt` 또는 `/model openai/gpt-5.4`는 OpenAI provider 경로를 사용합니다.
- `/model opus`는 Anthropic provider 경로를 사용합니다.
- Codex가 아닌 모델이 선택되면 PI가 호환성 하네스로 계속 사용됩니다.

## Codex 전용 배포

모든 임베디드 에이전트 턴이 Codex 하네스를 사용한다는 것을 보장해야 한다면
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

환경 변수 override:

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

fallback이 비활성화되면, `codex` plugin이 비활성화되어 있거나,
요청한 모델이 `codex/*` 참조가 아니거나, app-server가 너무 오래되었거나,
app-server를 시작할 수 없는 경우 OpenClaw는 조기에 실패합니다.

## 에이전트별 Codex

기본 에이전트는 일반적인 자동 선택을 유지하면서 특정 에이전트 하나만 Codex 전용으로 만들 수 있습니다:

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
OpenClaw 세션을 만들고, Codex 하네스는 필요에 따라 자체 sidecar app-server
스레드를 생성하거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션 바인딩을 지웁니다.

## 모델 검색

기본적으로 Codex plugin은 app-server에 사용 가능한 모델을 요청합니다. 검색에
실패하거나 시간이 초과되면 번들된 fallback 카탈로그를 사용합니다:

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

`plugins.entries.codex.config.discovery` 아래에서 검색을 조정할 수 있습니다:

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

시작 시 Codex 탐색을 피하고 fallback 카탈로그에만 고정하려면 검색을 비활성화하세요:

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

기본적으로 plugin은 다음과 같이 로컬에서 Codex를 시작합니다:

```bash
codex app-server --listen stdio://
```

이 기본값을 유지하면서 Codex 네이티브 정책만 조정할 수 있습니다:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| 필드 | 기본값 | 의미 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 실행하고, `"websocket"`은 `url`에 연결합니다. |
| `command`           | `"codex"`                                | stdio 전송용 실행 파일. |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인자. |
| `url`               | unset                                    | WebSocket app-server URL. |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer 토큰. |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더. |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 호출의 타임아웃. |
| `approvalPolicy`    | `"never"`                                | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책. |
| `sandbox`           | `"workspace-write"`                      | 스레드 시작/재개에 전송되는 네이티브 Codex 샌드박스 모드. |
| `approvalsReviewer` | `"user"`                                 | Codex guardian이 네이티브 승인을 검토하게 하려면 `"guardian_subagent"`를 사용합니다. |
| `serviceTier`       | unset                                    | 선택적 Codex 서비스 티어, 예: `"priority"`. |

이전 환경 변수도 대응하는 구성 필드가 설정되지 않은 경우
로컬 테스트용 fallback으로 계속 작동합니다:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

반복 가능한 배포에는 구성이 권장됩니다.

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

PI fallback을 비활성화한 Codex 전용 하네스 검증:

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
기존 Codex 스레드에 연결되어 있으면, 다음 턴은 현재 선택된
`codex/*` 모델, provider, 승인 정책, 샌드박스, 서비스 티어를
다시 app-server로 전송합니다. `codex/gpt-5.4`에서 `codex/gpt-5.2`로 전환하면
스레드 바인딩은 유지되지만 Codex에 새로 선택한 모델로 계속 진행하라고 요청합니다.

## Codex 명령

번들된 plugin은 `/codex`를 승인된 슬래시 명령으로 등록합니다. 이는
일반적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 동작합니다.

일반적인 형식:

- `/codex status`는 실시간 app-server 연결 상태, 모델, 계정, rate limit, MCP 서버, Skills를 표시합니다.
- `/codex models`는 실시간 Codex app-server 모델 목록을 보여줍니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 스레드를 compact하라고 요청합니다.
- `/codex review`는 연결된 스레드에 대한 Codex 네이티브 review를 시작합니다.
- `/codex account`는 계정 및 rate-limit 상태를 표시합니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 하네스가 일반 턴에 사용하는 것과 동일한 sidecar 바인딩 파일을 기록합니다.
다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw `codex/*` 모델을 app-server에 전달하며, 확장된 기록을 계속 활성화한 상태로 유지합니다.

명령어 표면을 사용하려면 Codex app-server `0.118.0` 이상이 필요합니다. 향후 버전 또는 사용자 지정 app-server가 해당 JSON-RPC 메서드를 노출하지 않는 경우, 개별
제어 메서드는 `unsupported by this Codex app-server`로 보고됩니다.

## 도구, 미디어 및 compaction

Codex 하네스는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 구성하고 하네스에서 동적 도구 결과를 받습니다.
텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은
계속 일반적인 OpenClaw 전달 경로를 통해 처리됩니다.

선택된 모델이 Codex 하네스를 사용할 때 네이티브 스레드 compaction은
Codex app-server에 위임됩니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`,
그리고 향후 모델 또는 하네스 전환을 위해 transcript 미러를 유지합니다. 이
미러에는 사용자 프롬프트, 최종 assistant 텍스트, 그리고 app-server가 이를 내보낼 경우
가벼운 Codex reasoning 또는 plan 레코드가 포함됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어
이해는 계속 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`,
`messages.tts` 같은 해당 provider/model 설정을 사용합니다.

## 문제 해결

**`/model`에 Codex가 나타나지 않음:** `plugins.entries.codex.enabled`를 활성화하고,
`codex/*` 모델 참조를 설정하거나, `plugins.allow`가 `codex`를 제외하고 있는지 확인하세요.

**OpenClaw가 PI로 fallback함:** 테스트 중에는 `embeddedHarness.fallback: "none"` 또는
`OPENCLAW_AGENT_HARNESS_FALLBACK=none`을 설정하세요.

**app-server가 거부됨:** app-server 핸드셰이크가 버전 `0.118.0` 이상을
보고하도록 Codex를 업그레이드하세요.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나
검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`,
그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** 이는 예상된 동작입니다. Codex 하네스는
`codex/*` 모델 참조만 처리합니다.

## 관련 항목

- [Agent Harness Plugins](/ko/plugins/sdk-agent-harness)
- [Model Providers](/ko/concepts/model-providers)
- [Configuration Reference](/ko/gateway/configuration-reference)
- [Testing](/ko/help/testing#live-codex-app-server-harness-smoke)
