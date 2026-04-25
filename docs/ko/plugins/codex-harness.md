---
read_when:
    - 번들된 Codex app-server harness를 사용하려고 합니다
    - Codex harness config 예시가 필요합니다
    - PI로 대체되지 않고 실패하도록 Codex 전용 배포를 구성하려고 합니다
summary: 번들된 Codex app-server harness를 통해 OpenClaw 내장 에이전트 턴 실행하기
title: Codex harness
x-i18n:
    generated_at: "2026-04-25T06:05:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

번들된 `codex` Plugin을 사용하면 OpenClaw는 내장 에이전트 턴을 기본 제공 PI harness 대신 Codex app-server를 통해 실행할 수 있습니다.

이 기능은 낮은 수준의 에이전트 세션(모델 검색, 네이티브 스레드 재개, 네이티브 Compaction, app-server 실행)을 Codex가 직접 관리하게 하려는 경우에 사용합니다. OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, 도구, 승인, 미디어 전달, 그리고 사용자에게 보이는 transcript 미러를 관리합니다.

방향을 잡고 싶다면 먼저 [Agent runtimes](/ko/concepts/agent-runtimes)부터 보세요. 짧게 말하면:
`openai/gpt-5.5`는 모델 ref이고, `codex`는 runtime이며, Telegram,
Discord, Slack 또는 다른 채널은 여전히 통신 표면입니다.

네이티브 Codex 턴은 공개 호환성 계층으로 OpenClaw Plugin 훅을 계속 유지합니다.
이것들은 Codex `hooks.json` 명령 훅이 아니라 프로세스 내 OpenClaw 훅입니다:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- 미러된 transcript 레코드를 위한 `before_message_write`
- `agent_end`

Plugin은 또한 OpenClaw가 도구를 실행한 뒤, 그 결과가 Codex에 반환되기 전에 OpenClaw 동적 도구 결과를 다시 쓸 수 있는 runtime 중립 도구 결과 미들웨어를 등록할 수 있습니다. 이는 OpenClaw가 소유한 transcript 도구 결과 쓰기를 변환하는 공개 `tool_result_persist` Plugin 훅과는 별개입니다.

Plugin 훅 시맨틱 자체는 [Plugin hooks](/ko/plugins/hooks)
및 [Plugin guard behavior](/ko/tools/plugin)를 참고하세요.

이 harness는 기본적으로 꺼져 있습니다. 새 config에서는 OpenAI 모델 ref를 `openai/gpt-*` 형식의 정규 형태로 유지하고, 네이티브 app-server 실행을 원할 때는 `embeddedHarness.runtime: "codex"` 또는 `OPENCLAW_AGENT_RUNTIME=codex`를 명시적으로 강제해야 합니다. 레거시 `codex/*` 모델 ref는 호환성을 위해 여전히 harness를 자동 선택하지만, runtime 기반 레거시 프로바이더 접두사는 일반 모델/프로바이더 선택지로 표시되지 않습니다.

## 올바른 모델 접두사 선택

OpenAI 계열 경로는 접두사별로 다릅니다. PI를 통한 Codex OAuth를 원하면 `openai-codex/*`를 사용하고, 직접 OpenAI API 액세스를 원하거나 네이티브 Codex app-server harness를 강제하는 경우에는 `openai/*`를 사용하세요:

| 모델 ref                                              | runtime 경로                                 | 사용 시점                                                                  |
| ----------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                      | OpenClaw/PI 경유 OpenAI 프로바이더 경로      | `OPENAI_API_KEY`로 현재 직접 OpenAI Platform API 액세스를 원할 때         |
| `openai-codex/gpt-5.5`                                | OpenClaw/PI 경유 OpenAI Codex OAuth          | 기본 PI 러너로 ChatGPT/Codex 구독 인증을 원할 때                          |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness                     | 내장 에이전트 턴에 네이티브 Codex app-server 실행을 원할 때               |

현재 GPT-5.5는 OpenClaw에서 구독/OAuth 전용입니다. PI OAuth에는
`openai-codex/gpt-5.5`를 사용하고, Codex app-server harness에는 `openai/gpt-5.5`와 Codex
app-server harness를 함께 사용하세요. OpenAI가 GPT-5.5를 공개 API에서 활성화하면
`openai/gpt-5.5`에 대한 직접 API 키 액세스도 지원됩니다.

레거시 `codex/gpt-*` ref는 여전히 호환성 별칭으로 허용됩니다. Doctor 호환성 마이그레이션은 레거시 기본 runtime ref를 정규 모델 ref로 다시 쓰고 runtime 정책을 별도로 기록합니다. 반면 fallback 전용 레거시 ref는 runtime이 전체 에이전트 컨테이너에 대해 구성되므로 변경하지 않습니다. 새 PI Codex OAuth config는 `openai-codex/gpt-*`를 사용해야 하며, 새 네이티브
app-server harness config는 `openai/gpt-*`와
`embeddedHarness.runtime: "codex"`를 함께 사용해야 합니다.

`agents.defaults.imageModel`도 같은 접두사 분리를 따릅니다. 이미지 이해가 OpenAI
Codex OAuth 프로바이더 경로를 통해 실행되어야 한다면 `openai-codex/gpt-*`를 사용하세요. 이미지 이해가 제한된 Codex app-server 턴을 통해 실행되어야 한다면 `codex/gpt-*`를 사용하세요. Codex app-server 모델은 이미지 입력 지원을 광고해야 하며, 텍스트 전용 Codex 모델은 미디어 턴이 시작되기 전에 실패합니다.

현재 세션의 실제 harness를 확인하려면 `/status`를 사용하세요. 선택 결과가 예상과 다르다면 `agents/harness` 서브시스템의 디버그 로깅을 활성화하고 gateway의 구조화된 `agent harness selected` 레코드를 확인하세요. 여기에 선택된 harness id, 선택 이유, runtime/fallback 정책, 그리고 `auto` 모드일 경우 각 Plugin 후보의 지원 결과가 포함됩니다.

Harness 선택은 실시간 세션 제어가 아닙니다. 내장 턴이 실행되면 OpenClaw는 해당 세션에 선택된 harness id를 기록하고 같은 세션 id의 이후 턴에서도 이를 계속 사용합니다. 이후 세션에 다른 harness를 사용하려면 `embeddedHarness` config 또는 `OPENCLAW_AGENT_RUNTIME`을 변경하세요. 기존 대화를 PI와 Codex 사이에서 전환하려면 `/new` 또는 `/reset`으로 새 세션을 시작하세요. 이렇게 해야 하나의 transcript를 호환되지 않는 두 네이티브 세션 시스템으로 재생하지 않게 됩니다.

Harness 핀이 도입되기 전에 생성된 레거시 세션은 transcript 기록이 있으면 PI에 고정된 것으로 처리됩니다. config를 변경한 뒤 해당 대화를 Codex로 전환하려면 `/new` 또는 `/reset`을 사용하세요.

`/status`는 실제 모델 runtime을 표시합니다. 기본 PI harness는
`Runtime: OpenClaw Pi Default`로 나타나고, Codex app-server harness는
`Runtime: OpenAI Codex`로 나타납니다.

## 요구 사항

- 번들된 `codex` Plugin을 사용할 수 있는 OpenClaw
- Codex app-server `0.118.0` 이상
- app-server 프로세스에서 사용할 수 있는 Codex 인증

이 Plugin은 더 오래된 app-server 핸드셰이크 또는 버전이 없는 핸드셰이크를 차단합니다. 이렇게 해서 OpenClaw가 검증된 프로토콜 표면에서만 동작하도록 합니다.

실시간 및 Docker 스모크 테스트에서는 보통 `OPENAI_API_KEY`에서 인증을 가져오며,
선택적으로 `~/.codex/auth.json` 및
`~/.codex/config.toml` 같은 Codex CLI 파일도 사용할 수 있습니다. 로컬 Codex app-server에서 사용하는 것과 동일한 인증 자료를 사용하세요.

## 최소 config

`openai/gpt-5.5`를 사용하고, 번들된 Plugin을 활성화하고, `codex` harness를 강제합니다:

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
      },
    },
  },
}
```

config에서 `plugins.allow`를 사용한다면 여기에 `codex`도 포함하세요:

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

`agents.defaults.model` 또는 에이전트 모델을
`codex/<model>`로 설정한 레거시 config는 여전히 번들된 `codex` Plugin을 자동 활성화합니다. 새 config는 위와 같이 `openai/<model>`과 명시적 `embeddedHarness` 항목을 사용하는 방식을 권장합니다.

## 다른 모델과 함께 Codex 추가

같은 에이전트가 Codex와 비-Codex 프로바이더 모델 사이를 자유롭게 전환해야 한다면 전역으로 `runtime: "codex"`를 설정하지 마세요. 강제된 runtime은 해당 에이전트 또는 세션의 모든 내장 턴에 적용됩니다. 그 상태에서 Anthropic 모델을 선택하면 OpenClaw는 여전히 Codex harness를 시도하고, 조용히 PI로 라우팅하지 않고 실패-폐쇄 방식으로 종료합니다.

대신 다음 형태 중 하나를 사용하세요:

- `embeddedHarness.runtime: "codex"`를 가진 전용 에이전트에 Codex를 둡니다.
- 기본 에이전트는 `runtime: "auto"`와 PI fallback으로 유지해 일반적인 혼합
  프로바이더 사용을 지원합니다.
- 레거시 `codex/*` ref는 호환성을 위해서만 사용하세요. 새 config는
  `openai/*`와 명시적 Codex runtime 정책을 사용하는 것이 좋습니다.

예를 들어, 다음은 기본 에이전트를 일반 자동 선택에 두고
별도의 Codex 에이전트를 추가하는 형태입니다:

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
        },
      },
    ],
  },
}
```

이 형태에서는:

- 기본 `main` 에이전트가 일반 프로바이더 경로와 PI 호환 fallback을 사용합니다.
- `codex` 에이전트는 Codex app-server harness를 사용합니다.
- `codex` 에이전트에서 Codex가 없거나 지원되지 않으면, 조용히 PI를 사용하지 않고 해당 턴이 실패합니다.

## Codex 전용 배포

모든 내장 에이전트 턴이 반드시 Codex를 사용해야 함을 보장해야 한다면 Codex harness를 강제하세요. 명시적 Plugin runtime은 기본적으로 PI fallback이 없으므로,
`fallback: "none"`은 선택 사항이지만 문서화 목적상 유용할 수 있습니다:

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
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Codex가 강제되면 OpenClaw는 Codex Plugin이 비활성화되어 있거나, app-server가 너무 오래되었거나, app-server를 시작할 수 없는 경우 초기에 실패합니다. 누락된 harness 선택을 의도적으로 PI가 처리하게 하려는 경우에만
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi`를 설정하세요.

## 에이전트별 Codex

기본 에이전트는 일반 자동 선택을 유지하면서, 하나의 에이전트만 Codex 전용으로 만들 수 있습니다:

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

일반 세션 명령으로 에이전트와 모델을 전환하세요. `/new`는 새
OpenClaw 세션을 만들고, Codex harness는 필요에 따라 해당 sidecar app-server
스레드를 생성하거나 재개합니다. `/reset`은 해당 스레드에 대한 OpenClaw 세션 바인딩을 지우고 다음 턴이 현재 config에서 harness를 다시 확인하도록 합니다.

## 모델 검색

기본적으로 Codex Plugin은 사용 가능한 모델을 app-server에 요청합니다. 검색이 실패하거나 시간 초과되면 다음에 대한 번들 fallback 카탈로그를 사용합니다:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

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

시작 시 Codex probe를 피하고 fallback 카탈로그에만 고정하려면 검색을 비활성화하세요:

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

기본적으로 OpenClaw는 로컬 Codex harness 세션을 YOLO 모드로 시작합니다:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, 그리고
`sandbox: "danger-full-access"`. 이것은 자율 Heartbeat에 사용되는 신뢰된 로컬 운영자 자세입니다. 즉, 응답할 사람이 없는 네이티브 승인 프롬프트에서 멈추지 않고 Codex가 셸과 네트워크 도구를 사용할 수 있습니다.

Codex Guardian 검토 승인을 사용하려면 `appServer.mode:
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

Guardian 모드는 Codex의 네이티브 자동 검토 승인 경로를 사용합니다. Codex가 sandbox를 벗어나거나, workspace 밖에 쓰거나, 네트워크 액세스 같은 권한을 추가하려고 하면 Codex는 해당 승인 요청을 사람 프롬프트가 아니라 네이티브 reviewer로 보냅니다. reviewer는 Codex의 위험 프레임워크를 적용해 해당 요청을 승인하거나 거부합니다. YOLO 모드보다 더 많은 가드레일이 필요하지만, 무인 에이전트가 계속 진행할 수 있어야 한다면 Guardian을 사용하세요.

`guardian` 프리셋은 `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, `sandbox: "workspace-write"`로 확장됩니다.
개별 정책 필드는 여전히 `mode`를 재정의하므로, 고급 배포에서는
프리셋과 명시적 선택을 혼합할 수 있습니다. 예전 `guardian_subagent` reviewer 값도
호환성 별칭으로 여전히 허용되지만, 새 config에서는
`auto_review`를 사용해야 합니다.

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

| 필드                | 기본값                                   | 의미                                                                                                             |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"`는 Codex를 시작하고, `"websocket"`은 `url`에 연결합니다.                                                |
| `command`           | `"codex"`                                | stdio 전송용 실행 파일입니다.                                                                                     |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 전송용 인수입니다.                                                                                          |
| `url`               | unset                                    | WebSocket app-server URL입니다.                                                                                   |
| `authToken`         | unset                                    | WebSocket 전송용 Bearer 토큰입니다.                                                                               |
| `headers`           | `{}`                                     | 추가 WebSocket 헤더입니다.                                                                                        |
| `requestTimeoutMs`  | `60000`                                  | app-server 제어 평면 호출의 타임아웃입니다.                                                                       |
| `mode`              | `"yolo"`                                 | YOLO 또는 Guardian 검토 실행용 프리셋입니다.                                                                      |
| `approvalPolicy`    | `"never"`                                | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책입니다.                                                    |
| `sandbox`           | `"danger-full-access"`                   | 스레드 시작/재개에 전송되는 네이티브 Codex sandbox 모드입니다.                                                    |
| `approvalsReviewer` | `"user"`                                 | Codex가 네이티브 승인 프롬프트를 검토하게 하려면 `"auto_review"`를 사용하세요. `guardian_subagent`는 레거시 별칭으로 유지됩니다. |
| `serviceTier`       | unset                                    | 선택적 Codex app-server 서비스 티어: `"fast"`, `"flex"` 또는 `null`. 잘못된 레거시 값은 무시됩니다.              |

이전 환경 변수도 일치하는 config 필드가 설정되지 않은 경우
로컬 테스트용 대체값으로 계속 동작합니다:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다.
대신 `plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`를 사용하세요. 반복 가능한 배포에서는 config를 권장합니다. 나머지 Codex harness 설정과 같은 검토된 파일 안에 Plugin 동작을 함께 유지할 수 있기 때문입니다.

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

Codex 전용 harness 검증:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
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
            approvalsReviewer: "auto_review",
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

모델 전환은 계속 OpenClaw가 제어합니다. OpenClaw 세션이 기존 Codex 스레드에 연결되어 있으면, 다음 턴은 현재 선택된
OpenAI 모델, 프로바이더, 승인 정책, sandbox, 서비스 티어를 다시
app-server로 보냅니다. `openai/gpt-5.5`에서 `openai/gpt-5.2`로 전환해도
스레드 바인딩은 유지되지만, Codex에는 새로 선택된 모델로 계속 진행하라고 요청합니다.

## Codex 명령어

번들된 Plugin은 권한이 있는 슬래시 명령어로 `/codex`를 등록합니다. 이것은 일반적이며 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 동작합니다.

일반적인 형식:

- `/codex status`는 실시간 app-server 연결 상태, 모델, 계정, rate limit, MCP 서버, Skills를 보여줍니다.
- `/codex models`는 실시간 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 스레드의 Compaction을 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 검토를 시작합니다.
- `/codex account`는 계정 및 rate-limit 상태를 보여줍니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

`/codex resume`는 harness가 일반 턴에 사용하는 것과 같은 sidecar 바인딩 파일을 기록합니다. 다음 메시지에서 OpenClaw는 해당 Codex 스레드를 재개하고, 현재 선택된 OpenClaw 모델을 app-server에 전달하며, 확장된 기록을 계속 활성화합니다.

이 명령 표면에는 Codex app-server `0.118.0` 이상이 필요합니다. 향후 또는 사용자 지정 app-server가 해당 JSON-RPC 메서드를 노출하지 않으면, 개별 제어 메서드는 `unsupported by this Codex app-server`로 보고됩니다.

## 훅 경계

Codex harness에는 세 가지 훅 계층이 있습니다:

| 계층                                  | 소유자                   | 목적                                                                |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| OpenClaw Plugin 훅                    | OpenClaw                 | PI 및 Codex harness 전반의 제품/Plugin 호환성                      |
| Codex app-server 확장 미들웨어        | OpenClaw 번들 Plugin     | OpenClaw 동적 도구 주변의 턴별 어댑터 동작                         |
| Codex 네이티브 훅                     | Codex                    | Codex config의 저수준 Codex 수명 주기 및 네이티브 도구 정책        |

OpenClaw는 OpenClaw Plugin 동작을 라우팅하기 위해 프로젝트 또는 전역 Codex `hooks.json` 파일을 사용하지 않습니다. 지원되는 네이티브 도구 및 권한 브리지의 경우, OpenClaw는 `PreToolUse`, `PostToolUse`, `PermissionRequest`를 위한 스레드별 Codex config를 주입합니다. `SessionStart`,
`UserPromptSubmit`, `Stop` 같은 다른 Codex 훅은 계속 Codex 수준 제어이며, v1 계약에서는 OpenClaw Plugin 훅으로 노출되지 않습니다.

OpenClaw 동적 도구의 경우, Codex가 호출을 요청한 뒤 OpenClaw가 도구를 실행하므로, OpenClaw는 harness 어댑터에서 자신이 소유한 Plugin 및 미들웨어 동작을 실행합니다. Codex 네이티브 도구의 경우, 정식 도구 기록은 Codex가 소유합니다. OpenClaw는 선택된 이벤트를 미러링할 수는 있지만, Codex가 app-server 또는 네이티브 훅 콜백을 통해 해당 작업을 노출하지 않는 한 네이티브 Codex 스레드를 다시 쓸 수는 없습니다.

Compaction 및 LLM 수명 주기 투영은 네이티브 Codex 훅 명령이 아니라 Codex app-server
알림과 OpenClaw 어댑터 상태에서 나옵니다.
OpenClaw의 `before_compaction`, `after_compaction`, `llm_input`,
`llm_output` 이벤트는 어댑터 수준 관찰이며, Codex 내부 요청 또는 Compaction 페이로드의 바이트 단위 캡처가 아닙니다.

Codex 네이티브 `hook/started` 및 `hook/completed` app-server 알림은 경로 추적과 디버깅을 위해 `codex_app_server.hook` 에이전트 이벤트로 투영됩니다.
이들은 OpenClaw Plugin 훅을 호출하지 않습니다.

## V1 지원 계약

Codex 모드는 단지 다른 모델 호출을 아래에 둔 PI가 아닙니다. Codex가
네이티브 모델 루프의 더 많은 부분을 소유하고, OpenClaw는 그 경계 주변에서 Plugin 및 세션 표면을 조정합니다.

Codex runtime v1에서 지원되는 항목:

| 표면                                    | 지원 상태                                | 이유                                                                                                                                       |
| --------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Codex를 통한 OpenAI 모델 루프           | 지원됨                                   | Codex app-server가 OpenAI 턴, 네이티브 스레드 재개, 네이티브 도구 연속성을 소유합니다.                                                    |
| OpenClaw 채널 라우팅 및 전달            | 지원됨                                   | Telegram, Discord, Slack, WhatsApp, iMessage 및 기타 채널은 모델 runtime 밖에 남아 있습니다.                                              |
| OpenClaw 동적 도구                      | 지원됨                                   | Codex가 OpenClaw에 이러한 도구 실행을 요청하므로, OpenClaw는 계속 실행 경로에 남아 있습니다.                                              |
| 프롬프트 및 컨텍스트 Plugin             | 지원됨                                   | OpenClaw는 스레드를 시작하거나 재개하기 전에 프롬프트 오버레이를 구성하고 컨텍스트를 Codex 턴에 투영합니다.                              |
| 컨텍스트 엔진 수명 주기                 | 지원됨                                   | Assemble, ingest 또는 after-turn 유지 관리, 그리고 컨텍스트 엔진 Compaction 조정이 Codex 턴에 대해 실행됩니다.                           |
| 동적 도구 훅                            | 지원됨                                   | `before_tool_call`, `after_tool_call`, 도구 결과 미들웨어가 OpenClaw 소유 동적 도구 주변에서 실행됩니다.                                 |
| 수명 주기 훅                            | 어댑터 관찰로 지원됨                     | `llm_input`, `llm_output`, `agent_end`, `before_compaction`, `after_compaction`은 정직한 Codex 모드 페이로드로 실행됩니다.              |
| 네이티브 셸 및 패치 차단 또는 관찰      | 네이티브 훅 릴레이를 통해 지원됨         | Codex `PreToolUse` 및 `PostToolUse`는 커밋된 네이티브 도구 표면에 대해 릴레이됩니다. 차단은 지원되지만 인수 재작성은 지원되지 않습니다. |
| 네이티브 권한 정책                      | 네이티브 훅 릴레이를 통해 지원됨         | runtime이 노출하는 경우 Codex `PermissionRequest`를 OpenClaw 정책을 통해 라우팅할 수 있습니다.                                           |
| App-server 경로 캡처                    | 지원됨                                   | OpenClaw는 app-server에 보낸 요청과 app-server에서 받은 알림을 기록합니다.                                                                |

Codex runtime v1에서 지원되지 않는 항목:

| 표면                                                | V1 경계                                                                                                                                         | 향후 경로                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 네이티브 도구 인수 변경                            | Codex 네이티브 pre-tool 훅은 차단할 수 있지만, OpenClaw는 Codex 네이티브 도구 인수를 다시 쓰지 않습니다.                                        | 대체 도구 입력을 위한 Codex 훅/스키마 지원이 필요합니다.                                                   |
| 편집 가능한 Codex 네이티브 transcript 기록         | 정식 네이티브 스레드 기록은 Codex가 소유합니다. OpenClaw는 미러를 소유하고 미래 컨텍스트를 투영할 수는 있지만, 지원되지 않는 내부를 변경해서는 안 됩니다. | 네이티브 스레드 수술이 필요하다면 명시적인 Codex app-server API를 추가합니다.                              |
| Codex 네이티브 도구 레코드에 대한 `tool_result_persist` | 이 훅은 Codex 네이티브 도구 레코드가 아니라 OpenClaw가 소유한 transcript 쓰기를 변환합니다.                                                     | 변환된 레코드를 미러링할 수는 있지만, 정식 재작성에는 Codex 지원이 필요합니다.                             |
| 풍부한 네이티브 Compaction 메타데이터              | OpenClaw는 Compaction 시작과 완료를 관찰하지만, 안정적인 유지/삭제 목록, 토큰 델타, 요약 페이로드는 받지 않습니다.                            | 더 풍부한 Codex Compaction 이벤트가 필요합니다.                                                            |
| Compaction 개입                                     | 현재 OpenClaw Compaction 훅은 Codex 모드에서 알림 수준입니다.                                                                                   | Plugin이 네이티브 Compaction을 거부하거나 다시 쓰려면 Codex pre/post Compaction 훅을 추가합니다.         |
| 중지 또는 최종 답변 게이팅                         | Codex에는 네이티브 stop 훅이 있지만, OpenClaw는 최종 답변 게이팅을 v1 Plugin 계약으로 노출하지 않습니다.                                        | 루프 및 타임아웃 보호 장치가 있는 미래의 옵트인 프리미티브입니다.                                          |
| 커밋된 v1 표면으로서의 네이티브 MCP 훅 동등성      | 릴레이는 일반적이지만, OpenClaw는 네이티브 MCP pre/post 훅 동작을 end-to-end로 버전 게이트하고 테스트하지 않았습니다.                          | 지원되는 app-server 프로토콜 하한이 해당 페이로드를 포함하게 되면 OpenClaw MCP 릴레이 테스트와 문서를 추가합니다. |
| 바이트 단위 모델 API 요청 캡처                     | OpenClaw는 app-server 요청과 알림을 캡처할 수 있지만, Codex 코어가 최종 OpenAI API 요청을 내부적으로 구성합니다.                               | Codex 모델 요청 추적 이벤트 또는 디버그 API가 필요합니다.                                                  |

## 도구, 미디어 및 Compaction

Codex harness는 저수준 내장 에이전트 실행기만 변경합니다.

OpenClaw는 여전히 도구 목록을 구성하고 harness에서 동적 도구 결과를 받습니다. 텍스트, 이미지, 비디오, 음악, TTS, 승인, 메시징 도구 출력은 계속 일반 OpenClaw 전달 경로를 통과합니다.

네이티브 훅 릴레이는 의도적으로 일반적으로 설계되어 있지만, v1 지원 계약은 OpenClaw가 테스트하는 Codex 네이티브 도구 및 권한 경로로 제한됩니다. 런타임 계약에 이름이 올라오기 전까지는 미래의 모든 Codex 훅 이벤트가 OpenClaw Plugin 표면이라고 가정하지 마세요.

Codex가 `_meta.codex_approval_kind`를
`"mcp_tool_call"`로 표시할 때, Codex MCP 도구 승인 요청은 OpenClaw의 Plugin 승인 흐름을 통해 라우팅됩니다. Codex `request_user_input` 프롬프트는 원래 채팅으로 다시 전송되며, 다음 대기 중인 후속 메시지는 추가 컨텍스트로 조정되지 않고 해당 네이티브 서버 요청에 응답합니다. 다른 MCP 요청은 계속 실패-폐쇄 방식으로 처리됩니다.

선택된 모델이 Codex harness를 사용할 때, 네이티브 스레드 Compaction은
Codex app-server에 위임됩니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`,
그리고 미래의 모델 또는 harness 전환을 위해 transcript 미러를 유지합니다. 이
미러에는 사용자 프롬프트, 최종 어시스턴트 텍스트, 그리고 app-server가 이를 내보낼 때의 가벼운 Codex reasoning 또는 계획 레코드가 포함됩니다. 현재 OpenClaw는 네이티브 Compaction 시작 및 완료 신호만 기록합니다. 아직 사람이 읽을 수 있는 Compaction 요약이나, Compaction 후 Codex가 어떤 항목을 유지했는지에 대한 감사 가능한 목록은 노출하지 않습니다.

정식 네이티브 스레드는 Codex가 소유하므로, `tool_result_persist`는 현재
Codex 네이티브 도구 결과 레코드를 다시 쓰지 않습니다. 이 훅은 OpenClaw가 OpenClaw 소유 세션 transcript 도구 결과를 기록할 때만 적용됩니다.

미디어 생성에는 PI가 필요하지 않습니다. 이미지, 비디오, 음악, PDF, TTS, 미디어
이해는 계속 `agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel`, `messages.tts` 같은 일치하는 프로바이더/모델 설정을 사용합니다.

## 문제 해결

**Codex가 일반 `/model` 프로바이더로 나타나지 않음:** 새 config에서는 정상 동작입니다. `embeddedHarness.runtime: "codex"`(또는 레거시 `codex/*` ref)와 함께 `openai/gpt-*` 모델을 선택하고, `plugins.entries.codex.enabled`를 활성화하고, `plugins.allow`가 `codex`를 제외하고 있지 않은지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** `runtime: "auto"`는 어떤 Codex harness도 실행을 담당하지 않을 때 여전히 호환성 백엔드로 PI를 사용할 수 있습니다. 테스트 중 Codex 선택을 강제하려면 `embeddedHarness.runtime: "codex"`를 설정하세요. 강제된 Codex runtime은 이제 `embeddedHarness.fallback: "pi"`를 명시적으로 설정하지 않는 한 PI로 대체되지 않고 실패합니다. Codex app-server가 선택되면 해당 실패는 추가 대체 config 없이 직접 노출됩니다.

**app-server가 거부됨:** app-server 핸드셰이크가
버전 `0.118.0` 이상을 보고하도록 Codex를 업그레이드하세요.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나
검색을 비활성화하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`,
그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 사용하는지 확인하세요.

**비-Codex 모델이 PI를 사용함:** 해당 에이전트에 대해
`embeddedHarness.runtime: "codex"`를 강제했거나 레거시
`codex/*` ref를 선택한 것이 아니라면 이는 정상입니다. 일반 `openai/gpt-*` 및 다른 프로바이더 ref는 `auto` 모드에서 원래 프로바이더 경로를 유지합니다. `runtime: "codex"`를 강제하면 해당 에이전트의 모든 내장 턴은 Codex가 지원하는 OpenAI 모델이어야 합니다.

## 관련 항목

- [에이전트 harness Plugins](/ko/plugins/sdk-agent-harness)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [모델 프로바이더](/ko/concepts/model-providers)
- [OpenAI 프로바이더](/ko/providers/openai)
- [상태](/ko/cli/status)
- [Plugin hooks](/ko/plugins/hooks)
- [구성 참조](/ko/gateway/configuration-reference)
- [Testing](/ko/help/testing-live#live-codex-app-server-harness-smoke)
