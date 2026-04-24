---
read_when:
    - 번들된 Codex app-server 하니스를 사용하려고 합니다
    - Codex 모델 ref와 config 예제가 필요합니다
    - Codex 전용 배포를 위해 Pi fallback을 비활성화하려고 합니다
summary: 번들된 Codex app-server 하니스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex 하니스
x-i18n:
    generated_at: "2026-04-24T08:59:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: c02b1e6cbaaefee858db7ebd7e306261683278ed9375bca6fe74855ca84eabd8
    source_path: plugins/codex-harness.md
    workflow: 15
---

번들된 `codex` Plugin을 사용하면 OpenClaw가 내장된 PI harness 대신 Codex app-server를 통해 임베디드 에이전트 턴을 실행할 수 있습니다.

Codex가 저수준 에이전트 세션을 직접 관리하게 하려는 경우 이 방식을 사용하세요. 여기에는 모델 탐색, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행이 포함됩니다. OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구, 승인, 미디어 전달, 그리고 사용자에게 보이는 transcript 미러를 관리합니다.

네이티브 Codex 턴은 OpenClaw Plugin hook을 공개 호환성 레이어로 유지합니다. 이들은 Codex `hooks.json` 명령 hook이 아니라, 프로세스 내 OpenClaw hook입니다.

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `after_tool_call`
- 미러링된 transcript 레코드를 위한 `before_message_write`
- `agent_end`

번들된 Plugin은 비동기 `tool_result` 미들웨어를 추가하기 위한 Codex app-server extension factory도 등록할 수 있습니다. 이 미들웨어는 OpenClaw가 도구를 실행한 뒤, 그리고 결과가 Codex로 반환되기 전에 OpenClaw 동적 도구에 대해 실행됩니다. 이는 OpenClaw가 소유한 transcript의 tool-result 쓰기를 변환하는 공개 `tool_result_persist` Plugin hook과는 별개입니다.

이 harness는 기본적으로 꺼져 있습니다. 새 config에서는 OpenAI 모델 ref를 `openai/gpt-*` 형태의 canonical 값으로 유지하고, 네이티브 app-server 실행이 필요할 때 `embeddedHarness.runtime: "codex"` 또는 `OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제해야 합니다. 레거시 `codex/*` 모델 ref는 호환성을 위해 여전히 harness를 자동 선택합니다.

## 올바른 모델 prefix 선택

OpenAI 계열 경로는 prefix에 따라 달라집니다. PI를 통한 Codex OAuth를 원하면 `openai-codex/*`를 사용하고, 직접 OpenAI API 접근 또는 네이티브 Codex app-server harness를 강제하려면 `openai/*`를 사용하세요.

| Model ref                                             | 런타임 경로                                  | 사용 시점 |
| ----------------------------------------------------- | -------------------------------------------- | --------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI 경로를 통한 OpenAI provider      | `OPENAI_API_KEY`로 현재 직접 OpenAI Platform API 접근을 원할 때 |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI를 통한 OpenAI Codex OAuth        | 기본 PI runner와 함께 ChatGPT/Codex 구독 인증을 원할 때 |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                     | 임베디드 에이전트 턴에 네이티브 Codex app-server 실행을 원할 때 |

GPT-5.5는 현재 OpenClaw에서 구독/OAuth 전용입니다. PI OAuth에는 `openai-codex/gpt-5.5`를 사용하고, Codex app-server harness에는 `openai/gpt-5.5`를 사용하세요. `openai/gpt-5.5`에 대한 직접 API 키 접근은 OpenAI가 공개 API에서 GPT-5.5를 활성화하면 지원됩니다.

레거시 `codex/gpt-*` ref는 호환성 별칭으로 계속 허용됩니다. 새 PI Codex OAuth config는 `openai-codex/gpt-*`를 사용해야 하고, 새 네이티브 app-server harness config는 `openai/gpt-*`와 `embeddedHarness.runtime: "codex"`를 함께 사용해야 합니다.

`agents.defaults.imageModel`도 동일한 prefix 분리를 따릅니다. 이미지 이해를 OpenAI Codex OAuth provider 경로로 실행하려면 `openai-codex/gpt-*`를 사용하세요. 제한된 Codex app-server 턴을 통해 이미지 이해를 실행하려면 `codex/gpt-*`를 사용하세요. Codex app-server 모델은 이미지 입력 지원을 광고해야 하며, 텍스트 전용 Codex 모델은 미디어 턴이 시작되기 전에 실패합니다.

현재 세션의 실제 harness를 확인하려면 `/status`를 사용하세요. 선택 결과가 예상과 다르다면 `agents/harness` 서브시스템의 디버그 로깅을 활성화하고 gateway의 구조화된 `agent harness selected` 레코드를 확인하세요. 여기에는 선택된 harness id, 선택 이유, runtime/fallback 정책, 그리고 `auto` 모드에서는 각 Plugin 후보의 지원 결과가 포함됩니다.

Harness 선택은 라이브 세션 제어 기능이 아닙니다. 임베디드 턴이 실행되면 OpenClaw는 해당 세션에 선택된 harness id를 기록하고, 같은 세션 id의 이후 턴에서도 계속 이를 사용합니다. 향후 세션에서 다른 harness를 사용하려면 `embeddedHarness` config 또는 `OPENCLAW_AGENT_RUNTIME`를 변경하세요. 기존 대화를 PI와 Codex 사이에서 전환하려면 `/new` 또는 `/reset`으로 새 세션을 시작해야 합니다. 이렇게 하면 하나의 transcript를 호환되지 않는 두 네이티브 세션 시스템으로 재생하는 일을 피할 수 있습니다.

Harness pin이 도입되기 전에 만들어진 레거시 세션은 transcript 기록이 있으면 PI에 고정된 것으로 취급됩니다. config를 변경한 뒤 해당 대화를 Codex로 전환하려면 `/new` 또는 `/reset`을 사용하세요.

`/status`는 `Fast` 옆에 실제 비-PI harness를 표시합니다. 예: `Fast · codex`. 기본 PI harness는 `Runner: pi (embedded)`로 유지되며 별도 harness 배지를 추가하지 않습니다.

## 요구 사항

- 번들된 `codex` Plugin을 사용할 수 있는 OpenClaw
- Codex app-server `0.118.0` 이상
- app-server 프로세스가 사용할 수 있는 Codex 인증

이 Plugin은 버전이 없거나 너무 오래된 app-server 핸드셰이크를 차단합니다. 이는 OpenClaw가 검증된 프로토콜 표면만 사용하도록 하기 위함입니다.

라이브 및 Docker smoke 테스트에서 인증은 일반적으로 `OPENAI_API_KEY`와 선택적 Codex CLI 파일(예: `~/.codex/auth.json`, `~/.codex/config.toml`)에서 제공됩니다. 로컬 Codex app-server가 사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 config

`openai/gpt-5.5`를 사용하고, 번들된 Plugin을 활성화하며, `codex` harness를 강제합니다.

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
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

config에서 `plugins.allow`를 사용한다면 여기에 `codex`도 포함하세요.

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

`agents.defaults.model` 또는 에이전트 모델을 `codex/<model>`로 설정하는 레거시 config는 여전히 번들된 `codex` Plugin을 자동 활성화합니다. 새 config는 위의 명시적 `embeddedHarness` 항목과 함께 `openai/<model>`을 사용하는 것이 좋습니다.

## 다른 모델을 유지하면서 Codex 추가

레거시 `codex/*` ref는 Codex를 선택하고 나머지는 모두 PI를 사용하게 하려면 `runtime: "auto"`를 유지하세요. 새 config에서는 harness를 사용해야 하는 에이전트에 `runtime: "codex"`를 명시적으로 설정하는 것이 좋습니다.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["openai/gpt-5.5", "anthropic/claude-opus-4-6"],
      },
      models: {
        "openai/gpt-5.5": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "codex",
        fallback: "pi",
      },
    },
  },
}
```

이 구성에서는 다음과 같습니다.

- `/model gpt` 또는 `/model openai/gpt-5.5`는 이 config에서 Codex app-server harness를 사용합니다.
- `/model opus`는 Anthropic provider 경로를 사용합니다.
- Codex가 아닌 모델이 선택되면 PI가 호환성 harness로 유지됩니다.

## Codex 전용 배포

모든 임베디드 에이전트 턴이 Codex harness를 사용함을 보장해야 한다면 PI fallback을 비활성화하세요.

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

fallback이 비활성화되면 Codex Plugin이 꺼져 있거나, app-server가 너무 오래되었거나, app-server를 시작할 수 없는 경우 OpenClaw는 초기에 실패합니다.

## 에이전트별 Codex

기본 에이전트는 일반 auto-selection을 유지하면서, 특정 에이전트 하나만 Codex 전용으로 설정할 수 있습니다.

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
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

에이전트와 모델을 전환할 때는 일반 세션 명령을 사용하세요. `/new`는 새 OpenClaw 세션을 만들고, Codex harness는 필요에 따라 sidecar app-server thread를 만들거나 재개합니다. `/reset`은 해당 thread에 대한 OpenClaw 세션 바인딩을 지우고, 다음 턴에서 현재 config를 기준으로 harness를 다시 해석하게 합니다.

## 모델 탐색

기본적으로 Codex Plugin은 app-server에 사용 가능한 모델을 요청합니다. 탐색이 실패하거나 시간 초과되면 다음에 대한 번들된 fallback catalog를 사용합니다.

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

`plugins.entries.codex.config.discovery`에서 탐색을 조정할 수 있습니다.

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

시작 시 Codex probing을 피하고 fallback catalog만 사용하려면 탐색을 비활성화하세요.

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

기본적으로 Plugin은 다음 명령으로 로컬에서 Codex를 시작합니다.

```bash
codex app-server --listen stdio://
```

기본적으로 OpenClaw는 로컬 Codex harness 세션을 YOLO 모드로 시작합니다.  
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, `sandbox: "danger-full-access"`입니다. 이는 자율 Heartbeat에 사용되는 신뢰된 로컬 운영자 태세입니다. Codex는 응답할 사람이 없는 네이티브 승인 프롬프트에서 멈추지 않고 shell 및 network 도구를 사용할 수 있습니다.

Codex guardian 검토 승인 방식을 사용하려면 `appServer.mode: "guardian"`을 설정하세요.

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

Guardian은 네이티브 Codex 승인 검토자입니다. Codex가 sandbox를 벗어나거나, workspace 밖에 쓰거나, network access 같은 권한 추가를 요청하면, 해당 승인 요청은 사람 프롬프트 대신 reviewer subagent로 전달됩니다. reviewer는 Codex의 위험 프레임워크를 적용해 해당 요청을 승인하거나 거부합니다. YOLO 모드보다 더 많은 가드레일이 필요하지만 무인 에이전트가 계속 진행할 수 있어야 한다면 Guardian을 사용하세요.

`guardian` 프리셋은 `approvalPolicy: "on-request"`, `approvalsReviewer: "guardian_subagent"`, `sandbox: "workspace-write"`로 확장됩니다. 개별 정책 필드는 여전히 `mode`를 override하므로, 고급 배포에서는 프리셋과 명시적 선택을 함께 사용할 수 있습니다.

이미 실행 중인 app-server에 연결하려면 WebSocket 전송을 사용하세요.

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

| 필드                | 기본값                                   | 의미                                                                                                      |
| ------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 실행하고, `"websocket"`은 `url`에 연결합니다.                                        |
| `command`           | `"codex"`                                | stdio 전송에 사용할 실행 파일입니다.                                                                      |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송에 사용할 인수입니다.                                                                           |
| `url`               | unset                                    | WebSocket app-server URL입니다.                                                                           |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer 토큰입니다.                                                                       |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다.                                                                                |
| `requestTimeoutMs`  | `60000`                                  | app-server control-plane 호출의 시간 제한입니다.                                                          |
| `mode`              | `"yolo"`                                 | YOLO 또는 guardian 검토 실행을 위한 프리셋입니다.                                                         |
| `approvalPolicy`    | `"never"`                                | 스레드 시작/재개/턴에 전달되는 네이티브 Codex 승인 정책입니다.                                            |
| `sandbox`           | `"danger-full-access"`                   | 스레드 시작/재개에 전달되는 네이티브 Codex sandbox 모드입니다.                                            |
| `approvalsReviewer` | `"user"`                                 | Codex Guardian이 프롬프트를 검토하도록 하려면 `"guardian_subagent"`를 사용합니다.                        |
| `serviceTier`       | unset                                    | 선택적 Codex app-server 서비스 등급: `"fast"`, `"flex"`, 또는 `null`. 유효하지 않은 레거시 값은 무시됩니다. |

이전 환경 변수도 대응하는 config 필드가 설정되지 않은 경우 로컬 테스트용 fallback으로 계속 동작합니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신  
`plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나, 일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요. 반복 가능한 배포에는 config가 더 적합합니다. Codex harness 설정의 나머지와 함께 같은 검토된 파일에 Plugin 동작을 유지할 수 있기 때문입니다.

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

PI fallback이 비활성화된 Codex 전용 harness 검증:

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

Guardian 검토형 Codex 승인:

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

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이 기존 Codex 스레드에 연결되어 있으면, 다음 턴에서 현재 선택된 OpenAI 모델, provider, 승인 정책, sandbox, 서비스 등급을 app-server에 다시 전송합니다. `openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환하면 스레드 바인딩은 유지되지만, Codex에는 새로 선택된 모델로 계속 진행하라고 요청합니다.

## Codex 명령

번들된 Plugin은 `/codex`를 승인된 슬래시 명령으로 등록합니다. 이 명령은 범용이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 동작합니다.

일반적인 형태:

- `/codex status`는 실시간 app-server 연결 상태, 모델, 계정, rate limit, MCP 서버, Skills를 표시합니다.
- `/codex models`는 실시간 Codex app-server 모델 목록을 표시합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 스레드의 Compaction을 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 review를 시작합니다.
- `/codex account`는 계정 및 rate-limit 상태를 표시합니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 harness가 일반 턴에 사용하는 것과 동일한 sidecar 바인딩 파일을 기록합니다. 다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw 모델을 app-server에 전달하며, 확장 히스토리를 계속 활성화한 상태로 유지합니다.

이 명령 표면은 Codex app-server `0.118.0` 이상이 필요합니다. 미래 버전 또는 사용자 지정 app-server가 특정 JSON-RPC 메서드를 노출하지 않으면, 개별 제어 메서드는 `unsupported by this Codex app-server`로 보고됩니다.

## Hook 경계

Codex harness에는 세 가지 hook 레이어가 있습니다.

| 레이어                                | 소유자                    | 목적                                                                 |
| ------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| OpenClaw Plugin hook                  | OpenClaw                  | PI와 Codex harness 전반에서의 제품/Plugin 호환성                    |
| Codex app-server extension 미들웨어   | OpenClaw 번들 Plugin      | OpenClaw 동적 도구 주변의 턴별 adapter 동작                         |
| Codex 네이티브 hook                   | Codex                     | Codex config의 저수준 Codex 라이프사이클 및 네이티브 도구 정책      |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex `hooks.json` 파일을 사용하지 않습니다. Codex 네이티브 hook은 shell 정책, 네이티브 tool result 검토, 중지 처리, 네이티브 Compaction/모델 라이프사이클 같은 Codex 소유 작업에는 유용하지만, OpenClaw Plugin API는 아닙니다.

OpenClaw 동적 도구의 경우, Codex가 호출을 요청한 뒤 OpenClaw가 도구를 실행하므로 OpenClaw는 자신이 소유한 Plugin 및 미들웨어 동작을 harness adapter 안에서 실행합니다. Codex 네이티브 도구의 경우, 정식 tool record는 Codex가 소유합니다. OpenClaw는 일부 이벤트를 미러링할 수는 있지만, Codex가 해당 작업을 app-server나 네이티브 hook callback을 통해 노출하지 않는 한 네이티브 Codex 스레드를 다시 쓸 수는 없습니다.

더 새로운 Codex app-server 빌드가 네이티브 Compaction 및 모델 라이프사이클 hook 이벤트를 노출하게 되면, OpenClaw는 해당 프로토콜 지원을 버전 게이트로 제어하고 의미가 정직한 범위에서 기존 OpenClaw hook 계약에 그 이벤트를 매핑해야 합니다. 그전까지 OpenClaw의 `before_compaction`, `after_compaction`, `llm_input`, `llm_output` 이벤트는 adapter 수준의 관찰값일 뿐이며, Codex 내부 요청이나 Compaction payload를 바이트 단위로 포착한 것은 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` app-server 알림은 trajectory와 디버깅을 위해 `codex_app_server.hook` agent 이벤트로 투영됩니다. 이들은 OpenClaw Plugin hook을 호출하지 않습니다.

## 도구, 미디어, Compaction

Codex harness는 저수준 임베디드 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 구성하고 harness로부터 동적 도구 결과를 받습니다. 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속 일반적인 OpenClaw 전달 경로를 통해 처리됩니다.

Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시하면 Codex MCP 도구 승인 유도는 OpenClaw의 Plugin 승인 흐름을 통해 라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시 전송되며, 다음 대기 중인 후속 메시지는 추가 컨텍스트로 조정되는 대신 해당 네이티브 서버 요청에 응답합니다. 다른 MCP 유도 요청은 계속 폐쇄 기본값으로 실패합니다.

선택된 모델이 Codex harness를 사용하면 네이티브 스레드 Compaction은 Codex app-server에 위임됩니다. OpenClaw는 채널 히스토리, 검색, `/new`, `/reset`, 그리고 향후 모델 또는 harness 전환을 위해 transcript 미러를 유지합니다. 이 미러에는 사용자 프롬프트, 최종 assistant 텍스트, 그리고 app-server가 이를 방출할 때의 가벼운 Codex reasoning 또는 계획 레코드가 포함됩니다. 현재 OpenClaw는 네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는 Compaction 요약이나, Compaction 후 Codex가 어떤 항목을 유지했는지에 대한 감사 가능한 목록은 노출하지 않습니다.

Codex가 정식 네이티브 스레드를 소유하므로 `tool_result_persist`는 현재 Codex 네이티브 tool result 레코드를 다시 쓰지 않습니다. 이는 OpenClaw가 OpenClaw 소유 세션 transcript의 tool result를 기록할 때만 적용됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어 이해는 계속 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은 해당 provider/model 설정을 사용합니다.

## 문제 해결

**`/model`에 Codex가 나타나지 않음:** `plugins.entries.codex.enabled`를 활성화하고, `embeddedHarness.runtime: "codex"`가 설정된 `openai/gpt-*` 모델(또는 레거시 `codex/*` ref)을 선택했는지 확인하세요. 그리고 `plugins.allow`가 `codex`를 제외하고 있지 않은지도 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** 실행을 주장하는 Codex harness가 없으면 OpenClaw는 호환성 백엔드로 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을 강제하려면 `embeddedHarness.runtime: "codex"`를 설정하고, 일치하는 Plugin harness가 없을 때 실패하게 하려면 `embeddedHarness.fallback: "none"`을 설정하세요. Codex app-server가 한 번 선택되면, 그 실패는 추가 fallback config 없이 직접 노출됩니다.

**app-server가 거부됨:** app-server 핸드셰이크가 버전 `0.118.0` 이상을 보고하도록 Codex를 업그레이드하세요.

**모델 탐색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나 탐색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`, 그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**Codex가 아닌 모델이 PI를 사용함:** `embeddedHarness.runtime: "codex"`를 강제했거나(또는 레거시 `codex/*` ref를 선택했거나) 하지 않았다면 이는 정상입니다. 일반 `openai/gpt-*` 및 다른 provider ref는 계속 해당 provider의 일반 경로를 사용합니다.

## 관련 항목

- [에이전트 Harness Plugin](/ko/plugins/sdk-agent-harness)
- [모델 Provider](/ko/concepts/model-providers)
- [설정 참조](/ko/gateway/configuration-reference)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
