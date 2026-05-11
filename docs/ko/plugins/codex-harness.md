---
read_when:
    - 번들로 제공되는 Codex app-server 하네스를 사용하려는 경우
    - Codex harness 구성 예제가 필요합니다
    - Codex 전용 배포가 PI로 폴백하는 대신 실패하도록 하려는 경우
summary: 번들된 Codex 앱 서버 하네스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex 하네스
x-i18n:
    generated_at: "2026-05-11T20:33:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37546661dc80d8ce680c379ca2a49919b08ac24a748dc15d1478c1421e81c632
    source_path: plugins/codex-harness.md
    workflow: 16
---

번들로 제공되는 `codex` plugin을 사용하면 OpenClaw가 기본 제공 PI 하네스 대신 Codex app-server를 통해 내장 OpenAI 에이전트 턴을 실행할 수 있습니다.

저수준 에이전트 세션을 Codex가 소유하게 하려는 경우 Codex 하네스를 사용하세요. 여기에는 네이티브 스레드 재개, 네이티브 도구 계속 실행, 네이티브 Compaction, app-server 실행이 포함됩니다. OpenClaw는 여전히 채팅 채널, 세션 파일, 모델 선택, OpenClaw 동적 도구, 승인, 미디어 전달, 표시되는 트랜스크립트 미러를 소유합니다.

일반적인 설정은 `openai/gpt-5.5` 같은 표준 OpenAI 모델 참조를 사용합니다. `openai-codex/gpt-*` 모델 참조를 구성하지 마세요. OpenAI 에이전트 인증 순서는 `auth.order.openai` 아래에 두세요. 기존 설치를 위해 오래된 `openai-codex:*` 프로필과 `auth.order.openai-codex` 항목은 계속 지원됩니다.

OpenClaw는 Codex 네이티브 코드 모드와 코드 모드 전용이 활성화된 상태로 Codex app-server 스레드를 시작합니다. 이렇게 하면 지연/검색 가능한 OpenClaw 동적 도구가 Codex 위에 PI 스타일 도구 검색 래퍼를 추가하는 대신 Codex 자체 코드 실행 및 도구 검색 표면 안에 유지됩니다.

더 넓은 모델/제공자/런타임 분리에 대해서는 [에이전트 런타임](/ko/concepts/agent-runtimes)부터 시작하세요. 간단히 말하면 `openai/gpt-5.5`는 모델 참조이고, `codex`는 런타임이며, Telegram, Discord, Slack 또는 다른 채널은 커뮤니케이션 표면으로 유지됩니다.

## 요구 사항

- 번들 `codex` plugin을 사용할 수 있는 OpenClaw.
- 구성에서 `plugins.allow`를 사용하는 경우 `codex`를 포함하세요.
- Codex app-server `0.125.0` 이상. 번들 plugin은 기본적으로 호환되는 Codex app-server 바이너리를 관리하므로, `PATH`의 로컬 `codex` 명령은 일반 하네스 시작에 영향을 주지 않습니다.
- `openclaw models auth login --provider openai-codex`, 에이전트의 Codex 홈에 있는 app-server 계정, 또는 명시적인 Codex API 키 인증 프로필을 통해 사용할 수 있는 Codex 인증.

인증 우선순위, 환경 격리, 사용자 지정 app-server 명령, 모델 검색 및 모든 구성 필드는 [Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 확인하세요.

## 빠른 시작

OpenClaw에서 Codex를 사용하려는 대부분의 사용자는 이 경로를 원합니다. ChatGPT/Codex 구독으로 로그인하고, 번들 `codex` plugin을 활성화한 다음, 표준 `openai/gpt-*` 모델 참조를 사용하세요.

Codex OAuth로 로그인합니다.

```bash
openclaw models auth login --provider openai-codex
```

번들 `codex` plugin을 활성화하고 OpenAI 에이전트 모델을 선택합니다.

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
    },
  },
}
```

구성에서 `plugins.allow`를 사용하는 경우 거기에도 `codex`를 추가하세요.

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

plugin 구성을 변경한 후 Gateway를 다시 시작하세요. 기존 채팅에 이미 세션이 있는 경우, 런타임 변경을 테스트하기 전에 `/new` 또는 `/reset`을 사용하여 다음 턴이 현재 구성에서 하네스를 해석하도록 하세요.

## 구성

빠른 시작 구성은 최소한으로 동작하는 Codex 하네스 구성입니다. Codex 하네스 옵션은 OpenClaw 구성에서 설정하고, CLI는 Codex 인증에만 사용하세요.

| 필요 사항                                   | 설정                                                                              | 위치                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 하네스 활성화                     | `plugins.entries.codex.enabled: true`                                            | OpenClaw 구성                    |
| 허용 목록에 있는 plugin 설치 유지     | `plugins.allow`에 `codex` 포함                                               | OpenClaw 구성                    |
| OpenAI 에이전트 턴을 Codex로 라우팅 | `openai/gpt-*`로 설정한 `agents.defaults.model` 또는 `agents.list[].model`               | OpenClaw 에이전트 구성              |
| Codex OAuth로 로그인               | `openclaw models auth login --provider openai-codex`                             | CLI 인증 프로필                   |
| Codex 실행을 위한 API 키 백업 추가      | `auth.order.openai`에서 구독 인증 뒤에 나열된 `openai:*` API 키 프로필 | CLI 인증 프로필 + OpenClaw 구성 |
| Codex를 사용할 수 없을 때 닫힌 상태로 실패  | 제공자 또는 모델 `agentRuntime.id: "codex"`                                     | OpenClaw 모델/제공자 구성     |
| 직접 OpenAI API 트래픽 사용          | 일반 OpenAI 인증이 있는 제공자 또는 모델 `agentRuntime.id: "pi"`                | OpenClaw 모델/제공자 구성     |
| app-server 동작 조정               | `plugins.entries.codex.config.appServer.*`                                       | Codex plugin 구성                |
| 네이티브 Codex plugin 앱 활성화        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex plugin 구성                |
| Codex Computer Use 활성화              | `plugins.entries.codex.config.computerUse.*`                                     | Codex plugin 구성                |

Codex 기반 OpenAI 에이전트 턴에는 `openai/gpt-*` 모델 참조를 사용하세요. 구독 우선/API 키 백업 순서에는 `auth.order.openai`를 선호하세요. 기존 `openai-codex:*` 인증 프로필과 `auth.order.openai-codex`는 계속 유효하지만, 새 `openai-codex/gpt-*` 모델 참조를 작성하지 마세요.

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

이 형태에서는 두 프로필 모두 `openai/gpt-*` 에이전트 턴에 대해 여전히 Codex를 통해 실행됩니다. API 키는 인증 대체 수단일 뿐이며, PI나 일반 OpenAI Responses로 전환하라는 요청이 아닙니다.

이 페이지의 나머지 부분에서는 사용자가 선택해야 하는 일반적인 변형을 다룹니다. 배포 형태, 닫힌 상태 실패 라우팅, 보호자 승인 정책, 네이티브 Codex plugin, Computer Use입니다. 전체 옵션 목록, 기본값, 열거형, 검색, 환경 격리, 시간 제한 및 app-server 전송 필드는 [Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 확인하세요.

## Codex 런타임 확인

Codex를 기대하는 채팅에서 `/status`를 사용하세요. Codex 기반 OpenAI 에이전트 턴은 다음을 표시합니다.

```text
Runtime: OpenAI Codex
```

그런 다음 Codex app-server 상태를 확인하세요.

```text
/codex status
/codex models
```

`/codex status`는 app-server 연결, 계정, 속도 제한, MCP 서버, Skills를 보고합니다. `/codex models`는 하네스와 계정에 대한 실시간 Codex app-server 카탈로그를 나열합니다. `/status`가 예상과 다르면 [문제 해결](#troubleshooting)을 확인하세요.

## 라우팅 및 모델 선택

제공자 참조와 런타임 정책을 분리해서 유지하세요.

- Codex를 통한 OpenAI 에이전트 턴에는 `openai/gpt-*`를 사용하세요.
- 구성에서 `openai-codex/gpt-*`를 사용하지 마세요. `openclaw doctor --fix`를 실행하여 레거시 참조와 오래된 세션 라우트 고정을 복구하세요.
- `agentRuntime.id: "codex"`는 일반 OpenAI 자동 모드에서는 선택 사항이지만, Codex를 사용할 수 없을 때 배포가 닫힌 상태로 실패해야 하는 경우 유용합니다.
- `agentRuntime.id: "pi"`는 의도적인 경우 제공자 또는 모델을 직접 PI 동작으로 전환합니다.
- `/codex ...`는 채팅에서 네이티브 Codex app-server 대화를 제어합니다.
- ACP/acpx는 별도의 외부 하네스 경로입니다. 사용자가 ACP/acpx 또는 외부 하네스 어댑터를 요청할 때만 사용하세요.

일반적인 명령 라우팅:

| 사용자 의도                     | 사용                                     |
| ------------------------------- | --------------------------------------- |
| 현재 채팅 연결         | `/codex bind [--cwd <path>]`            |
| 기존 Codex 스레드 재개 | `/codex resume <thread-id>`             |
| Codex 스레드 나열 또는 필터링    | `/codex threads [filter]`               |
| Codex 피드백만 전송        | `/codex diagnostics [note]`             |
| ACP/acpx 작업 시작          | `/codex`가 아닌 ACP/acpx 세션 명령 |

| 사용 사례                                             | 구성                                                        | 확인                                  | 참고                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 네이티브 Codex 런타임을 사용하는 ChatGPT/Codex 구독 | `openai/gpt-*`와 활성화된 `codex` plugin                       | `/status`가 `Runtime: OpenAI Codex` 표시 | 권장 경로                   |
| Codex를 사용할 수 없을 때 닫힌 상태로 실패                  | 제공자 또는 모델 `agentRuntime.id: "codex"`                     | PI 대체 대신 턴 실패       | Codex 전용 배포에 사용     |
| PI를 통한 직접 OpenAI API 키 트래픽             | 제공자 또는 모델 `agentRuntime.id: "pi"` 및 일반 OpenAI 인증 | `/status`가 PI 런타임 표시              | PI가 의도된 경우에만 사용    |
| 레거시 구성                                        | `openai-codex/gpt-*`                                             | `openclaw doctor --fix`가 이를 다시 작성     | 이 방식으로 새 구성을 작성하지 마세요   |
| ACP/acpx Codex 어댑터                               | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP 작업/세션 상태                 | 네이티브 Codex 하네스와 별개 |

`agents.defaults.imageModel`도 동일한 접두사 분리를 따릅니다. 일반 OpenAI 경로에는 `openai/gpt-*`를 사용하고, 이미지 이해가 제한된 Codex app-server 턴을 통해 실행되어야 하는 경우에만 `codex/gpt-*`를 사용하세요. `openai-codex/gpt-*`를 사용하지 마세요. doctor는 해당 레거시 접두사를 `openai/gpt-*`로 다시 작성합니다.

## 배포 패턴

### 기본 Codex 배포

모든 OpenAI 에이전트 턴이 기본적으로 Codex를 사용해야 하는 경우 빠른 시작 구성을 사용하세요.

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
    },
  },
}
```

### 혼합 제공자 배포

이 형태는 Claude를 기본 에이전트로 유지하고 이름이 지정된 Codex 에이전트를 추가합니다.

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

이 구성을 사용하면 `main` 에이전트는 일반 제공자 경로를 사용하고 `codex` 에이전트는 Codex app-server를 사용합니다.

### 닫힌 상태 실패 Codex 배포

OpenAI 에이전트 턴의 경우, 번들 plugin을 사용할 수 있으면 `openai/gpt-*`가 이미 Codex로 해석됩니다. 명시적인 닫힌 상태 실패 규칙을 작성하려는 경우 명시적 런타임 정책을 추가하세요.

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

Codex가 강제되면 Codex plugin이 비활성화되어 있거나, app-server가 너무 오래되었거나, app-server를 시작할 수 없는 경우 OpenClaw가 조기에 실패합니다.

## App-server 정책

기본적으로 plugin은 stdio 전송을 사용하여 OpenClaw가 관리하는 Codex 바이너리를 로컬에서 시작합니다. 의도적으로 다른 실행 파일을 실행하려는 경우에만 `appServer.command`를 설정하세요. app-server가 이미 다른 곳에서 실행 중인 경우에만 WebSocket 전송을 사용하세요.

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

로컬 stdio app-server 세션은 기본적으로 신뢰할 수 있는 로컬 운영자 자세를 사용합니다:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, 및
`sandbox: "danger-full-access"`. 로컬 Codex 요구 사항이 이러한
암묵적 YOLO 자세를 허용하지 않는 경우, OpenClaw는 대신 허용된 guardian 권한을 선택합니다.
세션에 OpenClaw 샌드박스가 활성화되어 있으면, OpenClaw는 Codex
`danger-full-access`를 Codex `workspace-write`로 좁혀 네이티브 Codex 코드 모드 턴이
샌드박스 처리된 워크스페이스 내부에 머물도록 합니다.

샌드박스 이탈이나 추가 권한 전에 Codex 네이티브 자동 검토를 원할 때 guardian 모드를 사용하세요:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

guardian 모드는 Codex app-server 승인으로 확장되며, 로컬 요구 사항이 해당 값을 허용할 때 보통
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, 및
`sandbox: "workspace-write"`가 됩니다.

모든 app-server 필드, 인증 순서, 환경 격리, 검색 및
타임아웃 동작은 [Codex harness reference](/ko/plugins/codex-harness-reference)를 참조하세요.

## 명령 및 진단

번들 Plugin은 OpenClaw 텍스트 명령을 지원하는 모든 채널에
`/codex`를 슬래시 명령으로 등록합니다.

일반적인 형식:

- `/codex status`는 app-server 연결, 모델, 계정, 사용량 제한,
  MCP 서버 및 Skills를 확인합니다.
- `/codex models`는 라이브 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex app-server 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을
  기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex app-server에 연결된 스레드의 Compaction을 요청합니다.
- `/codex review`는 연결된 스레드에 대한 Codex 네이티브 검토를 시작합니다.
- `/codex diagnostics [note]`는 연결된 스레드에 대해
  Codex 피드백을 보내기 전에 확인을 요청합니다.
- `/codex account`는 계정 및 사용량 제한 상태를 표시합니다.
- `/codex mcp`는 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex app-server Skills를 나열합니다.

대부분의 지원 보고서는 버그가 발생한 대화에서 `/diagnostics [note]`로 시작하세요.
이 명령은 하나의 Gateway 진단 보고서를 생성하고, Codex
harness 세션의 경우 관련 Codex 피드백 번들을 보내도록 승인을 요청합니다.
개인정보 보호 모델과 그룹 채팅 동작은 [Diagnostics export](/ko/gateway/diagnostics)를 참조하세요.

전체 Gateway 진단 번들 없이 현재 연결된 스레드에 대한 Codex
피드백 업로드만 특별히 원할 때만 `/codex diagnostics [note]`를 사용하세요.

### 로컬에서 Codex 스레드 검사

문제가 있는 Codex 실행을 검사하는 가장 빠른 방법은 네이티브 Codex
스레드를 직접 여는 것인 경우가 많습니다:

```bash
codex resume <thread-id>
```

완료된 `/diagnostics` 응답, `/codex binding` 또는
`/codex threads [filter]`에서 스레드 ID를 가져오세요.

업로드 방식과 런타임 수준 진단 경계는
[Codex harness runtime](/ko/plugins/codex-harness-runtime#codex-feedback-upload)을 참조하세요.

인증은 다음 순서로 선택됩니다:

1. 에이전트의 정렬된 OpenAI 인증 프로필, 가급적
   `auth.order.openai` 아래의 프로필. 기존 `openai-codex:*` 프로필 ID는 계속 유효합니다.
2. 해당 에이전트의 Codex home에 있는 app-server의 기존 계정.
3. 로컬 stdio app-server 실행에 한해, app-server 계정이 없고 OpenAI 인증이
   여전히 필요할 때 `CODEX_API_KEY`, 그다음
   `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 스타일 Codex 인증 프로필을 감지하면, 생성된 Codex 자식 프로세스에서
`CODEX_API_KEY` 및 `OPENAI_API_KEY`를 제거합니다. 이렇게 하면 Gateway 수준 API 키를 임베딩이나 직접 OpenAI 모델에 사용할 수 있으면서도
네이티브 Codex app-server 턴이 실수로 API를 통해 과금되지 않도록 합니다.
명시적 Codex API 키 프로필과 로컬 stdio env-key 폴백은 상속된 자식 프로세스 환경 대신 app-server
로그인을 사용합니다. WebSocket app-server 연결은 Gateway env API 키 폴백을 받지 않습니다.
명시적 인증 프로필이나 원격 app-server 자체 계정을 사용하세요.

구독 프로필이 Codex 사용량 제한에 걸리면, OpenClaw는 Codex가 재설정 시간을 보고하는 경우 이를 기록하고
같은 Codex 실행에 대해 다음 정렬된 인증 프로필을 시도합니다. 재설정 시간이 지나면 선택된
`openai/gpt-*` 모델이나 Codex 런타임을 변경하지 않아도 구독 프로필이 다시 사용 가능해집니다.

배포에 추가 환경 격리가 필요하면 해당 변수를
`appServer.clearEnv`에 추가하세요:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv`는 생성된 Codex app-server 자식 프로세스에만 영향을 줍니다.

Codex 동적 도구는 기본적으로 `searchable` 로딩을 사용합니다. OpenClaw는
Codex 네이티브 워크스페이스 작업과 중복되는 동적 도구를 노출하지 않습니다: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, 및 `update_plan`. 메시징, 세션, 미디어, Cron, 브라우저, 노드,
Gateway, `heartbeat_respond`, `web_search` 같은 나머지 OpenClaw
통합 도구는 `openclaw` 네임스페이스 아래 Codex 도구 검색을 통해 사용할 수 있어 초기 모델 컨텍스트를
더 작게 유지합니다.
`sessions_yield`와 메시지 도구 전용 소스 응답은 턴 제어 계약이므로 직접 유지됩니다. Heartbeat 협업 지침은 도구가
아직 로드되지 않았을 때 Heartbeat 턴을 끝내기 전에 Codex가 `heartbeat_respond`를 검색하도록 안내합니다.

지연된 동적 도구를 검색할 수 없는 사용자 지정 Codex
app-server에 연결하거나 전체 도구 페이로드를 디버깅할 때만 `codexDynamicToolsLoading: "direct"`를 설정하세요.

지원되는 최상위 Codex Plugin 필드:

| 필드                      | 기본값        | 의미                                                                                  |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 동적 도구를 초기 Codex 도구 컨텍스트에 직접 넣으려면 `"direct"`를 사용합니다. |
| `codexDynamicToolsExclude` | `[]`           | Codex app-server 턴에서 제외할 추가 OpenClaw 동적 도구 이름입니다.              |
| `codexPlugins`             | 비활성화       | 마이그레이션된 소스 설치 curated Plugin에 대한 네이티브 Codex Plugin/앱 지원입니다.           |

지원되는 `appServer` 필드:

| 필드                         | 기본값                                                | 의미                                                                                                                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                                                                                                                                                                |
| `command`                     | 관리형 Codex 바이너리                                   | stdio 전송용 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 않은 상태로 두고, 명시적 재정의에만 설정하세요.                                                                                                                            |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 전송용 인수입니다.                                                                                                                                                                                                          |
| `url`                         | 설정되지 않음                                                  | WebSocket app-server URL입니다.                                                                                                                                                                                                               |
| `authToken`                   | 설정되지 않음                                                  | WebSocket 전송용 Bearer 토큰입니다.                                                                                                                                                                                                   |
| `headers`                     | `{}`                                                   | 추가 WebSocket 헤더입니다.                                                                                                                                                                                                                |
| `clearEnv`                    | `[]`                                                   | OpenClaw가 상속 환경을 구성한 뒤 생성된 stdio app-server 프로세스에서 제거되는 추가 환경 변수 이름입니다. `CODEX_HOME` 및 `HOME`은 로컬 실행에서 OpenClaw의 에이전트별 Codex 격리를 위해 예약되어 있습니다.    |
| `requestTimeoutMs`            | `60000`                                                | app-server 제어 플레인 호출의 타임아웃입니다.                                                                                                                                                                                             |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | OpenClaw가 `turn/completed`를 기다리는 동안 턴 범위 Codex app-server 요청 후의 조용한 대기 시간입니다. 느린 도구 후 처리 또는 상태 전용 합성 단계에는 이 값을 높이세요.                                                                     |
| `mode`                        | 로컬 Codex 요구 사항이 YOLO를 허용하지 않는 경우를 제외하고 `"yolo"` | YOLO 또는 guardian 검토 실행을 위한 프리셋입니다. `danger-full-access`, `never` 승인 또는 `user` 검토자를 생략하는 로컬 stdio 요구 사항은 암묵적 기본값을 guardian으로 만듭니다.                                                   |
| `approvalPolicy`              | `"never"` 또는 허용된 guardian 승인 정책       | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책입니다. guardian 기본값은 허용될 때 `"on-request"`를 선호합니다.                                                                                                                    |
| `sandbox`                     | `"danger-full-access"` 또는 허용된 guardian 샌드박스  | 스레드 시작/재개에 전송되는 네이티브 Codex 샌드박스 모드입니다. guardian 기본값은 허용될 때 `"workspace-write"`를 선호하고, 그렇지 않으면 `"read-only"`를 사용합니다. OpenClaw 샌드박스가 활성화된 경우 `danger-full-access`는 `"workspace-write"`로 좁혀집니다. |
| `approvalsReviewer`           | `"user"` 또는 허용된 guardian 검토자               | 허용되는 경우 Codex가 네이티브 승인 프롬프트를 검토하도록 하려면 `"auto_review"`를 사용하고, 그렇지 않으면 `guardian_subagent` 또는 `user`를 사용합니다. `guardian_subagent`는 레거시 별칭으로 남아 있습니다.                                                                      |
| `serviceTier`                 | 설정되지 않음                                                  | 선택적 Codex app-server 서비스 티어입니다. `"priority"`는 빠른 모드 라우팅을 활성화하고, `"flex"`는 flex 처리를 요청하며, `null`은 재정의를 지우고, 레거시 `"fast"`는 `"priority"`로 허용됩니다.                                         |

OpenClaw 소유 동적 도구 호출은 `appServer.requestTimeoutMs`와 독립적으로 제한됩니다. Codex `item/tool/call` 요청은 기본적으로 30초 OpenClaw watchdog을 사용합니다. 양수인 호출별 `timeoutMs` 인수는 해당 특정 도구 예산을 늘리거나 줄입니다. `image_generate` 도구는 도구 호출이 자체 timeout을 제공하지 않을 때 `agents.defaults.imageGenerationModel.timeoutMs`도 사용하며, 미디어 이해 `image` 도구는 `tools.media.image.timeoutSeconds` 또는 60초 미디어 기본값을 사용합니다. 동적 도구 예산은 600000 ms로 제한됩니다. timeout 시 OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한 동적 도구 응답을 Codex에 반환하여 세션을 `processing` 상태로 남겨 두지 않고 턴을 계속할 수 있게 합니다.

OpenClaw가 Codex 턴 범위 app-server 요청에 응답한 뒤, harness는 Codex가 `turn/completed`로 네이티브 턴을 완료하기를 기대합니다. 해당 응답 이후 app-server가 `appServer.turnCompletionIdleTimeoutMs` 동안 조용하면, OpenClaw는 최선의 노력으로 Codex 턴을 중단하고, 진단 timeout을 기록하며, OpenClaw 세션 lane을 해제하여 후속 채팅 메시지가 오래된 네이티브 턴 뒤에 대기하지 않도록 합니다. `rawResponseItem/completed`를 포함해 같은 턴에 대한 모든 비종결 notification은 Codex가 턴이 아직 살아 있음을 증명했기 때문에 이 짧은 watchdog을 해제합니다. 더 긴 종결 watchdog은 실제로 멈춘 턴을 계속 보호합니다. Timeout 진단에는 마지막 app-server notification 메서드와, 원시 assistant 응답 항목의 경우 항목 유형, 역할, id, 제한된 assistant 텍스트 미리보기가 포함됩니다.

로컬 테스트를 위한 환경 override는 계속 사용할 수 있습니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`은 `appServer.command`가 설정되지 않은 경우 관리형 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신 `plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나, 일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요. 반복 가능한 배포에는 config가 선호됩니다. Codex harness 설정의 나머지 부분과 같은 검토된 파일에 Plugin 동작을 유지하기 때문입니다.

## 네이티브 Codex Plugin

네이티브 Codex Plugin 지원은 OpenClaw harness 턴과 같은 Codex thread에서 Codex app-server 자체의 app 및 Plugin 기능을 사용합니다. OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다.

`codexPlugins`는 네이티브 Codex harness를 선택하는 세션에만 영향을 줍니다. PI 실행, 일반 OpenAI provider 실행, ACP conversation 바인딩 또는 다른 harness에는 영향을 주지 않습니다.

최소 마이그레이션 config:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

Thread app config는 OpenClaw가 Codex harness 세션을 설정하거나 오래된 Codex thread 바인딩을 교체할 때 계산됩니다. 매 턴마다 다시 계산되지는 않습니다. `codexPlugins`를 변경한 뒤에는 `/new`, `/reset`을 사용하거나 gateway를 재시작하여 이후 Codex harness 세션이 업데이트된 app 집합으로 시작하게 하세요.

마이그레이션 적격성, app inventory, destructive action policy, elicitations, 네이티브 Plugin 진단은 [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)을 참조하세요.

## Computer Use

Computer Use는 자체 설정 가이드에서 다룹니다.
[Codex Computer Use](/ko/plugins/codex-computer-use).

요약하면, OpenClaw는 desktop-control app을 vendoring하거나 desktop 작업을 직접 실행하지 않습니다. OpenClaw는 Codex app-server를 준비하고, `computer-use` MCP 서버를 사용할 수 있는지 확인한 다음, Codex-mode 턴 동안 Codex가 네이티브 MCP 도구 호출을 소유하도록 합니다.

## 런타임 경계

Codex harness는 저수준 embedded agent executor만 변경합니다.

- OpenClaw 동적 도구가 지원됩니다. Codex가 OpenClaw에 해당 도구 실행을 요청하므로 OpenClaw는 실행 경로에 남아 있습니다.
- Codex 네이티브 shell, patch, MCP, 네이티브 app 도구는 Codex가 소유합니다. OpenClaw는 지원되는 relay를 통해 선택된 네이티브 이벤트를 관찰하거나 차단할 수 있지만, 네이티브 도구 인수를 다시 쓰지는 않습니다.
- Codex는 네이티브 Compaction을 소유합니다. OpenClaw는 channel 기록, search, `/new`, `/reset`, 향후 model 또는 harness 전환을 위해 transcript mirror를 유지합니다.
- 미디어 생성, 미디어 이해, TTS, approvals, messaging-tool 출력은 계속 일치하는 OpenClaw provider/model 설정을 통해 처리됩니다.
- `tool_result_persist`는 OpenClaw 소유 transcript 도구 결과에 적용되며, Codex 네이티브 도구 결과 레코드에는 적용되지 않습니다.

hook layer, 지원되는 V1 surface, 네이티브 permission 처리, queue steering, Codex feedback upload 메커니즘, Compaction 세부 정보는 [Codex harness 런타임](/ko/plugins/codex-harness-runtime)을 참조하세요.

## 문제 해결

**Codex가 일반 `/model` provider로 표시되지 않음:** 새 config에서는 예상된 동작입니다. `openai/gpt-*` model을 선택하고, `plugins.entries.codex.enabled`를 활성화한 뒤, `plugins.allow`가 `codex`를 제외하는지 확인하세요.

**OpenClaw가 Codex 대신 PI를 사용함:** model ref가 공식 OpenAI provider의 `openai/gpt-*`인지, Codex Plugin이 설치 및 활성화되어 있는지 확인하세요. 테스트 중 엄격한 증명이 필요하면 provider 또는 model `agentRuntime.id: "codex"`를 설정하세요. 강제된 Codex 런타임은 PI로 fallback하는 대신 실패합니다.

**레거시 `openai-codex/*` config가 남아 있음:** `openclaw doctor --fix`를 실행하세요. Doctor는 레거시 model ref를 `openai/*`로 다시 쓰고, 오래된 session 및 whole-agent 런타임 pin을 제거하며, 기존 auth-profile override를 보존합니다.

**app-server가 거부됨:** Codex app-server `0.125.0` 이상을 사용하세요. `0.125.0-alpha.2` 또는 `0.125.0+custom` 같은 같은 버전의 prerelease 또는 build suffix 버전은 거부됩니다. OpenClaw가 안정 `0.125.0` protocol floor를 테스트하기 때문입니다.

**`/codex status`가 연결할 수 없음:** 번들 `codex` Plugin이 활성화되어 있는지, allowlist가 구성된 경우 `plugins.allow`에 포함되어 있는지, 그리고 custom `appServer.command`, `url`, `authToken` 또는 header가 유효한지 확인하세요.

**Model discovery가 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나 discovery를 비활성화하세요. [Codex harness reference](/ko/plugins/codex-harness-reference#model-discovery)를 참조하세요.

**WebSocket transport가 즉시 실패함:** `appServer.url`, `authToken`, header를 확인하고, 원격 app-server가 같은 Codex app-server protocol 버전을 사용하는지 확인하세요.

**Codex가 아닌 model이 PI를 사용함:** provider 또는 model 런타임 policy가 다른 harness로 라우팅하지 않는 한 예상된 동작입니다. 일반 non-OpenAI provider ref는 `auto` mode에서 정상 provider 경로를 유지합니다.

**Computer Use가 설치되었지만 도구가 실행되지 않음:** 새 세션에서 `/codex computer-use status`를 확인하세요. 도구가 `Native hook relay unavailable`을 보고하면 `/new` 또는 `/reset`을 사용하세요. 문제가 지속되면 gateway를 재시작하여 오래된 네이티브 hook registration을 지우세요. [Codex Computer Use](/ko/plugins/codex-computer-use#troubleshooting)를 참조하세요.

## 관련 항목

- [Codex harness reference](/ko/plugins/codex-harness-reference)
- [Codex harness 런타임](/ko/plugins/codex-harness-runtime)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Codex Computer Use](/ko/plugins/codex-computer-use)
- [Agent 런타임](/ko/concepts/agent-runtimes)
- [Model provider](/ko/concepts/model-providers)
- [OpenAI provider](/ko/providers/openai)
- [Agent harness Plugin](/ko/plugins/sdk-agent-harness)
- [Plugin hook](/ko/plugins/hooks)
- [진단 export](/ko/gateway/diagnostics)
- [Status](/ko/cli/status)
- [Testing](/ko/help/testing-live#live-codex-app-server-harness-smoke)
