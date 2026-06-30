---
read_when:
    - 번들로 제공되는 Codex 앱 서버 하네스를 사용하려는 경우
    - Codex 하네스 구성 예시가 필요합니다
    - Codex 전용 배포가 OpenClaw로 폴백하는 대신 실패하도록 하려고 합니다
summary: 번들로 제공되는 Codex app-server 하네스를 통해 OpenClaw 임베디드 에이전트 턴 실행
title: Codex 하네스
x-i18n:
    generated_at: "2026-06-30T13:55:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

번들된 `codex` Plugin을 사용하면 OpenClaw가 내장 OpenClaw 하네스 대신
Codex app-server를 통해 임베디드 OpenAI 에이전트 턴을 실행할 수 있습니다.

저수준 에이전트 세션을 Codex가 소유하게 하려면 Codex 하네스를 사용하세요:
네이티브 스레드 재개, 네이티브 도구 이어가기, 네이티브 Compaction,
app-server 실행이 포함됩니다. OpenClaw는 여전히 채팅 채널, 세션 파일, 모델
선택, OpenClaw 동적 도구, 승인, 미디어 전달, 표시되는 트랜스크립트 미러를
소유합니다.

일반 설정은 `openai/gpt-5.5` 같은 표준 OpenAI 모델 참조를 사용합니다.
레거시 Codex GPT 참조를 구성하지 마세요. OpenAI 에이전트 인증 순서는
`auth.order.openai` 아래에 두세요. 이전 레거시 Codex 인증 프로필 ID와
레거시 Codex 인증 순서 항목은 `openclaw doctor --fix`로 복구되는
레거시 상태입니다.

활성 OpenClaw 샌드박스가 없으면 OpenClaw는 코드 모드 전용을 기본적으로
꺼 둔 상태에서 Codex 네이티브 코드 모드를 활성화하여 Codex app-server
스레드를 시작합니다. 이렇게 하면 Codex 네이티브 워크스페이스와 코드 기능을
사용할 수 있으면서도 OpenClaw 동적 도구는 app-server `item/tool/call`
브리지를 통해 계속 작동합니다. 활성 OpenClaw 샌드박싱과 제한된 도구 정책은
실험적 샌드박스 exec-server 경로를 선택하지 않는 한 네이티브 코드 모드를
완전히 비활성화합니다.

이 Codex 네이티브 기능은 다른 `exec` 입력 형태를 사용하는 일반 OpenClaw
실행용 옵트인 QuickJS-WASI 런타임인
[OpenClaw 코드 모드](/ko/reference/code-mode)와는 별개입니다.

더 넓은 모델/Provider/런타임 분리는
[에이전트 런타임](/ko/concepts/agent-runtimes)에서 시작하세요. 짧게 말하면:
`openai/gpt-5.5`는 모델 참조이고, `codex`는 런타임이며, Telegram,
Discord, Slack 또는 다른 채널은 통신 표면으로 남습니다.

## 요구 사항

- 번들된 `codex` Plugin을 사용할 수 있는 OpenClaw.
- 구성에서 `plugins.allow`를 사용하는 경우 `codex`를 포함하세요.
- Codex app-server `0.125.0` 이상. 번들된 Plugin은 기본적으로 호환되는
  Codex app-server 바이너리를 관리하므로 `PATH`의 로컬 `codex` 명령은
  일반 하네스 시작에 영향을 주지 않습니다.
- `openclaw models auth login --provider openai`를 통한 Codex 인증,
  에이전트의 Codex 홈에 있는 app-server 계정, 또는 명시적 Codex API-key
  인증 프로필.

인증 우선순위, 환경 격리, 사용자 지정 app-server 명령, 모델 검색 및 모든
구성 필드는 [Codex 하네스 참조](/ko/plugins/codex-harness-reference)를
참조하세요.

## 빠른 시작

OpenClaw에서 Codex를 원하는 대부분의 사용자는 이 경로를 원합니다:
ChatGPT/Codex 구독으로 로그인하고, 번들된 `codex` Plugin을 활성화한 다음,
표준 `openai/gpt-*` 모델 참조를 사용하세요.

Codex OAuth로 로그인합니다:

```bash
openclaw models auth login --provider openai
```

번들된 `codex` Plugin을 활성화하고 OpenAI 에이전트 모델을 선택합니다:

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

구성에서 `plugins.allow`를 사용하는 경우 거기에도 `codex`를 추가하세요:

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

Plugin 구성을 변경한 뒤에는 Gateway를 다시 시작하세요. 기존 채팅에 이미
세션이 있다면 런타임 변경을 테스트하기 전에 `/new` 또는 `/reset`을 사용해
다음 턴이 현재 구성에서 하네스를 해석하도록 하세요.

## 구성

빠른 시작 구성은 최소 실행 가능한 Codex 하네스 구성입니다. OpenClaw 구성에서
Codex 하네스 옵션을 설정하고, CLI는 Codex 인증에만 사용하세요:

| 필요 사항                              | 설정                                                                             | 위치                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 하네스 활성화                          | `plugins.entries.codex.enabled: true`                                            | OpenClaw 구성                      |
| 허용 목록에 있는 Plugin 설치 유지      | `plugins.allow`에 `codex` 포함                                                   | OpenClaw 구성                      |
| OpenAI 에이전트 턴을 Codex로 라우팅    | `agents.defaults.model` 또는 `agents.list[].model`을 `openai/gpt-*`로 설정       | OpenClaw 에이전트 구성             |
| ChatGPT/Codex OAuth로 로그인           | `openclaw models auth login --provider openai`                                   | CLI 인증 프로필                    |
| Codex 실행용 API-key 백업 추가         | `auth.order.openai`에서 구독 인증 뒤에 나열된 `openai:*` API-key 프로필          | CLI 인증 프로필 + OpenClaw 구성    |
| Codex를 사용할 수 없을 때 fail closed  | Provider 또는 모델 `agentRuntime.id: "codex"`                                    | OpenClaw 모델/Provider 구성        |
| 직접 OpenAI API 트래픽 사용            | 일반 OpenAI 인증과 함께 Provider 또는 모델 `agentRuntime.id: "openclaw"`         | OpenClaw 모델/Provider 구성        |
| app-server 동작 조정                   | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 구성                  |
| 네이티브 Codex Plugin 앱 활성화        | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 구성                  |
| Codex Computer Use 활성화              | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 구성                  |

Codex가 뒷받침하는 OpenAI 에이전트 턴에는 `openai/gpt-*` 모델 참조를
사용하세요. 구독 우선/API-key 백업 순서에는 `auth.order.openai`를
선호하세요. 기존 레거시 Codex 인증 프로필 ID와 레거시 Codex 인증 순서는
doctor 전용 레거시 상태입니다. 새 레거시 Codex GPT 참조를 작성하지 마세요.

Codex가 뒷받침하는 에이전트에 `compaction.model` 또는
`compaction.provider`를 설정하지 마세요. Codex는 네이티브 app-server
스레드 상태를 통해 Compaction을 수행하므로 OpenClaw는 런타임에서 이러한
로컬 요약기 오버라이드를 무시하고, 에이전트가 Codex를 사용할 때
`openclaw doctor --fix`가 이를 제거합니다.

Lossless는 Codex 턴 주변의 조립, 수집, 유지보수를 위한 컨텍스트 엔진으로
계속 지원됩니다. `agents.defaults.compaction.provider`가 아니라
`plugins.slots.contextEngine: "lossless-claw"` 및
`plugins.entries.lossless-claw.config.summaryModel`을 통해 구성하세요.
Codex가 활성 런타임일 때 `openclaw doctor --fix`는 이전
`compaction.provider: "lossless-claw"` 형태를 Lossless 컨텍스트 엔진
슬롯으로 마이그레이션하지만, 네이티브 Codex가 여전히 Compaction을
소유합니다.

네이티브 Codex app-server 하네스는 사전 프롬프트 조립이 필요한 컨텍스트
엔진을 지원합니다. `codex-cli`를 포함한 일반 CLI 백엔드는 해당 호스트
기능을 제공하지 않습니다.

Codex가 뒷받침하는 에이전트에서 `/compact`는 바인딩된 스레드에서 네이티브
Codex app-server Compaction을 시작합니다. OpenClaw는 완료를 기다리지 않고,
OpenClaw 타임아웃을 적용하지 않으며, 공유 app-server를 다시 시작하지 않고,
컨텍스트 엔진이나 공개 OpenAI 요약기로 폴백하지 않습니다. 네이티브 Codex
스레드 바인딩이 없거나 오래된 경우 명령은 fail closed되어, 운영자가
Compaction 백엔드를 조용히 전환하는 대신 실제 런타임 경계를 볼 수 있습니다.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

이 형태에서 두 프로필 모두 `openai/gpt-*` 에이전트 턴에 대해 여전히
Codex를 통해 실행됩니다. API 키는 인증 폴백일 뿐이며, OpenClaw 또는 일반
OpenAI Responses로 전환하라는 요청이 아닙니다.

이 페이지의 나머지는 사용자가 선택해야 하는 일반적인 변형을 다룹니다:
배포 형태, fail-closed 라우팅, 보호자 승인 정책, 네이티브 Codex Plugin,
Computer Use. 전체 옵션 목록, 기본값, 열거형, 검색, 환경 격리, 타임아웃,
app-server 전송 필드는
[Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하세요.

## Codex 런타임 확인

Codex를 예상하는 채팅에서 `/status`를 사용하세요. Codex가 뒷받침하는
OpenAI 에이전트 턴은 다음을 표시합니다:

```text
Runtime: OpenAI Codex
```

그런 다음 Codex app-server 상태를 확인하세요:

```text
/codex status
/codex models
```

`/codex status`는 app-server 연결, 계정, 속도 제한, MCP 서버 및 Skills를
보고합니다. `/codex models`는 하네스와 계정에 대한 실시간 Codex app-server
카탈로그를 나열합니다. `/status`가 예상과 다르면
[문제 해결](#troubleshooting)을 참조하세요.

## 라우팅 및 모델 선택

Provider 참조와 런타임 정책을 분리해 유지하세요:

- Codex를 통한 OpenAI 에이전트 턴에는 `openai/gpt-*`를 사용하세요.
- 구성에서 레거시 Codex GPT 참조를 사용하지 마세요. `openclaw doctor --fix`를
  실행해 레거시 참조와 오래된 세션 라우트 핀을 복구하세요.
- `agentRuntime.id: "codex"`는 일반 OpenAI 자동 모드에서는 선택 사항이지만,
  Codex를 사용할 수 없을 때 배포가 fail closed되어야 하는 경우 유용합니다.
- `agentRuntime.id: "openclaw"`는 의도적인 경우 Provider 또는 모델을
  OpenClaw 임베디드 런타임으로 옵트인합니다.
- `/codex ...`는 채팅에서 네이티브 Codex app-server 대화를 제어합니다.
- ACP/acpx는 별도의 외부 하네스 경로입니다. 사용자가 ACP/acpx 또는 외부
  하네스 어댑터를 요청할 때만 사용하세요.

일반적인 명령 라우팅:

| 사용자 의도                                           | 사용                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 현재 채팅 연결                                        | `/codex bind [--cwd <path>]`                                                                          |
| 기존 Codex 스레드 재개                                | `/codex resume <thread-id>`                                                                           |
| Codex 스레드 나열 또는 필터링                         | `/codex threads [filter]`                                                                             |
| 네이티브 Codex Plugin 나열                            | `/codex plugins list`                                                                                 |
| 구성된 네이티브 Codex Plugin 활성화 또는 비활성화     | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 페어링된 노드의 기존 Codex CLI 세션 연결              | `/codex sessions --host <node> [filter]`, 그다음 `/codex resume <session-id> --host <node> --bind here` |
| Codex 피드백만 보내기                                 | `/codex diagnostics [note]`                                                                           |
| ACP/acpx 작업 시작                                    | `/codex`가 아니라 ACP/acpx 세션 명령                                                                  |

| 사용 사례 | 구성 | 확인 | 참고 |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| 네이티브 Codex 런타임을 사용하는 ChatGPT/Codex 구독 | `codex` Plugin이 활성화된 `openai/gpt-*` | `/status`에 `Runtime: OpenAI Codex` 표시 | 권장 경로 |
| Codex를 사용할 수 없으면 실패 후 종료 | 제공자 또는 모델 `agentRuntime.id: "codex"` | 임베디드 대체 경로 대신 턴 실패 | Codex 전용 배포에 사용 |
| 직접 OpenAI API 키 트래픽을 OpenClaw를 통해 라우팅 | 제공자 또는 모델 `agentRuntime.id: "openclaw"` 및 일반 OpenAI 인증 | `/status`에 OpenClaw 런타임 표시 | OpenClaw 사용이 의도된 경우에만 사용 |
| 레거시 구성 | 레거시 Codex GPT 참조 | `openclaw doctor --fix`가 다시 작성 | 새 구성은 이 방식으로 작성하지 않음 |
| ACP/acpx Codex 어댑터 | ACP `sessions_spawn({ runtime: "acp" })` | ACP 작업/세션 상태 | 네이티브 Codex 하네스와 별개 |

`agents.defaults.imageModel`도 동일한 접두사 분리를 따릅니다. 일반 OpenAI 경로에는 `openai/gpt-*`를 사용하고, 이미지 이해가 제한된 Codex 앱 서버 턴을 통해 실행되어야 하는 경우에만 `codex/gpt-*`를 사용하세요. 레거시 Codex GPT 참조를 사용하지 마세요. doctor는 해당 레거시 접두사를 `openai/gpt-*`로 다시 작성합니다.

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

이 구성에서는 `main` 에이전트가 일반 제공자 경로를 사용하고, `codex` 에이전트가 Codex 앱 서버를 사용합니다.

### 실패 후 종료 Codex 배포

OpenAI 에이전트 턴의 경우, 번들 Plugin을 사용할 수 있으면 `openai/gpt-*`는 이미 Codex로 해석됩니다. 명시적인 실패 후 종료 규칙을 작성하려면 런타임 정책을 추가하세요.

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

Codex가 강제된 상태에서 Codex Plugin이 비활성화되어 있거나, 앱 서버가 너무 오래되었거나, 앱 서버를 시작할 수 없으면 OpenClaw는 일찍 실패합니다.

## 앱 서버 정책

기본적으로 Plugin은 OpenClaw가 관리하는 Codex 바이너리를 stdio 전송으로 로컬에서 시작합니다. 의도적으로 다른 실행 파일을 실행하려는 경우에만 `appServer.command`를 설정하세요. 앱 서버가 이미 다른 위치에서 실행 중인 경우에만 WebSocket 전송을 사용하세요.

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

로컬 stdio 앱 서버 세션은 신뢰된 로컬 운영자 자세를 기본값으로 사용합니다. 즉 `approvalPolicy: "never"`, `approvalsReviewer: "user"`, `sandbox: "danger-full-access"`입니다. 로컬 Codex 요구 사항이 해당 암묵적 YOLO 자세를 허용하지 않으면 OpenClaw는 대신 허용된 보호자 권한을 선택합니다. 세션에 OpenClaw 샌드박스가 활성화된 경우, OpenClaw는 Codex 호스트 측 샌드박싱에 의존하는 대신 해당 턴에서 Codex 네이티브 코드 모드, 사용자 MCP 서버, 앱 기반 Plugin 실행을 비활성화합니다. 일반 exec/process 도구를 사용할 수 있으면 셸 접근은 `sandbox_exec` 및 `sandbox_process` 같은 OpenClaw 샌드박스 기반 동적 도구를 통해 노출됩니다.

샌드박스 이탈 또는 추가 권한 전에 Codex 네이티브 자동 리뷰를 원하면 정규화된 OpenClaw exec 모드를 사용하세요.

```json5
{
  tools: {
    exec: {
      mode: "auto",
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

Codex 앱 서버 세션에서 OpenClaw는 `tools.exec.mode: "auto"`를 Codex Guardian 검토 승인으로 매핑하며, 로컬 요구 사항이 해당 값을 허용하는 경우 일반적으로 `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, `sandbox: "workspace-write"`를 사용합니다. `tools.exec.mode: "auto"`에서 OpenClaw는 레거시의 안전하지 않은 Codex `approvalPolicy: "never"` 또는 `sandbox: "danger-full-access"` 오버라이드를 보존하지 않습니다. 의도적으로 승인 없는 Codex 자세를 사용하려면 `tools.exec.mode: "full"`을 사용하세요. 레거시 `plugins.entries.codex.config.appServer.mode: "guardian"` 프리셋은 여전히 작동하지만, `tools.exec.mode: "auto"`가 정규화된 OpenClaw 표면입니다.

호스트 exec 승인 및 ACPX 권한과의 모드 수준 비교는 [권한 모드](/ko/tools/permission-modes)를 참조하세요.

모든 앱 서버 필드, 인증 순서, 환경 격리, 검색, 시간 제한 동작은 [Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하세요.

## 명령 및 진단

번들 Plugin은 OpenClaw 텍스트 명령을 지원하는 모든 채널에서 `/codex`를 슬래시 명령으로 등록합니다.

네이티브 실행 및 제어에는 소유자 또는 `operator.admin` Gateway 클라이언트가 필요합니다. 여기에는 스레드 바인딩 또는 재개, 턴 전송 또는 중지, 모델, 빠른 모드, 권한 상태 변경, 압축 또는 리뷰, 바인딩 분리가 포함됩니다. 다른 승인된 발신자는 읽기 전용 상태, 도움말, 계정, 모델, 스레드, MCP 서버, skill, 바인딩 검사 명령을 유지합니다.

일반적인 형식:

- `/codex status`는 앱 서버 연결성, 모델, 계정, 속도 제한, MCP 서버, skills를 확인합니다.
- `/codex models`는 라이브 Codex 앱 서버 모델을 나열합니다.
- `/codex threads [filter]`는 최근 Codex 앱 서버 스레드를 나열합니다.
- `/codex resume <thread-id>`는 현재 OpenClaw 세션을 기존 Codex 스레드에 연결합니다.
- `/codex compact`는 Codex 앱 서버에 연결된 스레드를 압축하도록 요청합니다.
- `/codex review`는 연결된 스레드에 대해 Codex 네이티브 리뷰를 시작합니다.
- `/codex diagnostics [note]`는 연결된 스레드에 대한 Codex 피드백을 보내기 전에 확인을 요청합니다.
- `/codex account`는 계정 및 속도 제한 상태를 표시합니다.
- `/codex mcp`는 Codex 앱 서버 MCP 서버 상태를 나열합니다.
- `/codex skills`는 Codex 앱 서버 skills를 나열합니다.

대부분의 지원 보고서는 버그가 발생한 대화에서 `/diagnostics [note]`로 시작하세요. 이 명령은 하나의 Gateway 진단 보고서를 만들고, Codex 하네스 세션의 경우 관련 Codex 피드백 번들을 보내기 위한 승인을 요청합니다. 개인정보 보호 모델 및 그룹 채팅 동작은 [진단 내보내기](/ko/gateway/diagnostics)를 참조하세요.

전체 Gateway 진단 번들 없이 현재 연결된 스레드에 대한 Codex 피드백 업로드만 특별히 원하는 경우에만 `/codex diagnostics [note]`를 사용하세요.

### 로컬에서 Codex 스레드 검사

문제가 있는 Codex 실행을 검사하는 가장 빠른 방법은 종종 네이티브 Codex 스레드를 직접 여는 것입니다.

```bash
codex resume <thread-id>
```

완료된 `/diagnostics` 응답, `/codex binding`, 또는 `/codex threads [filter]`에서 스레드 ID를 가져오세요.

업로드 메커니즘과 런타임 수준 진단 경계는 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#codex-feedback-upload)을 참조하세요.

인증은 다음 순서로 선택됩니다.

1. 에이전트의 정렬된 OpenAI 인증 프로필, 가급적 `auth.order.openai` 아래의 프로필. 이전 레거시 Codex 인증 프로필 ID와 레거시 Codex 인증 순서를 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.
2. 해당 에이전트의 Codex 홈에 있는 앱 서버의 기존 계정.
3. 로컬 stdio 앱 서버 시작에만 해당하며, 앱 서버 계정이 없고 OpenAI 인증이 여전히 필요한 경우 `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 스타일 Codex 인증 프로필을 발견하면 생성된 Codex 자식 프로세스에서 `CODEX_API_KEY`와 `OPENAI_API_KEY`를 제거합니다. 이렇게 하면 임베딩 또는 직접 OpenAI 모델에는 Gateway 수준 API 키를 사용할 수 있으면서, 네이티브 Codex 앱 서버 턴이 실수로 API를 통해 과금되지 않습니다. 명시적 Codex API 키 프로필과 로컬 stdio 환경 키 대체 경로는 상속된 자식 프로세스 환경 대신 앱 서버 로그인을 사용합니다. WebSocket 앱 서버 연결은 Gateway 환경 API 키 대체 경로를 받지 않습니다. 명시적 인증 프로필 또는 원격 앱 서버 자체 계정을 사용하세요.
네이티브 Codex Plugin이 구성되면 OpenClaw는 Plugin 소유 앱을 Codex 스레드에 노출하기 전에 연결된 앱 서버를 통해 해당 Plugin을 설치하거나 새로 고칩니다. `app/list`는 앱 ID, 접근 가능 여부, 메타데이터의 신뢰 원본으로 유지되지만, OpenClaw는 스레드별 활성화 결정을 소유합니다. 정책이 나열된 접근 가능한 앱을 허용하면, `app/list`가 현재 해당 앱을 비활성화된 것으로 보고하더라도 OpenClaw는 `thread/start.config.apps[appId].enabled = true`를 보냅니다. 이 경로는 알 수 없는 ID에 대한 앱 설치를 만들어내지 않습니다. OpenClaw는 `plugin/install`로 마켓플레이스 Plugin만 활성화한 다음 인벤토리를 새로 고칩니다.

구독 프로필이 Codex 사용량 제한에 도달하면, Codex가 재설정 시간을 보고하는 경우 OpenClaw는 해당 시간을 기록하고 동일한 Codex 실행에 대해 다음 정렬된 인증 프로필을 시도합니다. 재설정 시간이 지나면 선택된 `openai/gpt-*` 모델 또는 Codex 런타임을 변경하지 않고 구독 프로필이 다시 사용 가능해집니다.

로컬 stdio 앱 서버 시작의 경우, OpenClaw는 `CODEX_HOME`을 에이전트별 디렉터리로 설정하여 Codex 구성, 인증/계정 파일, Plugin 캐시/데이터, 네이티브 스레드 상태가 기본적으로 운영자의 개인 `~/.codex`를 읽거나 쓰지 않도록 합니다. OpenClaw는 일반 프로세스 `HOME`을 보존합니다. Codex가 실행하는 하위 프로세스는 여전히 사용자 홈 구성과 토큰을 찾을 수 있으며, Codex는 공유 `$HOME/.agents/skills` 및 `$HOME/.agents/plugins/marketplace.json` 항목을 발견할 수 있습니다.

배포에 추가 환경 격리가 필요한 경우 해당 변수를 `appServer.clearEnv`에 추가하세요.

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

`appServer.clearEnv`는 생성된 Codex 앱 서버 자식 프로세스에만 영향을 줍니다. OpenClaw는 로컬 시작 정규화 중 이 목록에서 `CODEX_HOME`과 `HOME`을 제거합니다. `CODEX_HOME`은 에이전트별로 유지되고, `HOME`은 상속된 상태로 유지되어 하위 프로세스가 일반 사용자 홈 상태를 사용할 수 있습니다.

Codex 동적 도구는 기본적으로 `searchable` 로딩을 사용합니다. OpenClaw는
Codex 네이티브 워크스페이스 작업을 중복하는 동적 도구(`read`, `write`,
`edit`, `apply_patch`, `exec`, `process`, `update_plan`)를 노출하지 않습니다.
메시징, 미디어, Cron, 브라우저, 노드, Gateway, `heartbeat_respond` 같은 대부분의
나머지 OpenClaw 통합 도구는 `openclaw` 네임스페이스 아래의 Codex 도구 검색을
통해 사용할 수 있어 초기 모델 컨텍스트를 더 작게 유지합니다. 검색이 활성화되어 있고
관리형 공급자가 선택되지 않은 경우, 웹 검색은 기본적으로 Codex의 호스팅
`web_search` 도구를 사용합니다. 네이티브 호스팅 검색과 OpenClaw의 관리형
`web_search` 동적 도구는 상호 배타적이므로 관리형 검색이 네이티브 도메인 제한을
우회할 수 없습니다. OpenClaw는 호스팅 검색을 사용할 수 없거나, 명시적으로
비활성화되었거나, 선택된 관리형 공급자로 대체된 경우 관리형 도구를 사용합니다.
OpenClaw는 Codex의 독립 실행형 `web.run` 확장을 비활성화된 상태로 유지합니다.
프로덕션 앱 서버 트래픽이 사용자 정의 `web` 네임스페이스를 거부하기 때문입니다.
`tools.web.search.enabled: false`는 두 경로를 모두 비활성화하며, 도구가 비활성화된
LLM 전용 실행도 마찬가지입니다. Codex는 `"cached"`를 선호 설정으로 취급하고,
제한 없는 앱 서버 턴에서는 이를 라이브 외부 액세스로 해석합니다. 네이티브
`allowedDomains`가 설정되어 있으면 자동 관리형 폴백은 실패 시 차단되어 허용 목록을
우회할 수 없습니다. 지속적인 유효 검색 정책 변경은 다음 턴 전에 바인딩된 Codex
스레드를 교체합니다. 일시적인 턴별 제한은 임시 제한 스레드를 사용하고, 이후 재개를
위해 기존 바인딩을 보존합니다. `sessions_yield` 및 메시지 도구 전용 소스 응답은
직접 방식으로 유지됩니다. 이는 턴 제어 계약이기 때문입니다. `sessions_spawn`은
검색 가능 상태로 유지되어 Codex의 네이티브 `spawn_agent`가 기본 Codex 하위 에이전트
표면으로 남으며, 명시적인 OpenClaw 또는 ACP 위임은 여전히 `openclaw` 동적 도구
네임스페이스를 통해 사용할 수 있습니다. Heartbeat 협업 지침은 도구가 아직 로드되지
않은 경우 Heartbeat 턴을 종료하기 전에 `heartbeat_respond`를 검색하라고 Codex에
알립니다.

지연된 동적 도구를 검색할 수 없는 사용자 지정 Codex 앱 서버에 연결하거나 전체 도구
페이로드를 디버깅할 때만 `codexDynamicToolsLoading: "direct"`를 설정하세요.

지원되는 최상위 Codex Plugin 필드:

| 필드                       | 기본값         | 의미                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 동적 도구를 초기 Codex 도구 컨텍스트에 직접 넣으려면 `"direct"`를 사용합니다. |
| `codexDynamicToolsExclude` | `[]`           | Codex 앱 서버 턴에서 생략할 추가 OpenClaw 동적 도구 이름입니다.                         |
| `codexPlugins`             | 비활성화       | 마이그레이션된 소스 설치형 엄선 Plugin을 위한 네이티브 Codex Plugin/앱 지원입니다.      |

지원되는 `appServer` 필드:

| 필드                                          | 기본값                                                 | 의미                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                                                                                                                                                                                                                                                                                                            |
| `command`                                     | 관리형 Codex 바이너리                                  | stdio 전송용 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 않은 채로 두고, 명시적으로 재정의할 때만 설정하세요.                                                                                                                                                                                                                                                                     |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 전송용 인수입니다.                                                                                                                                                                                                                                                                                                                                                                     |
| `url`                                         | 설정되지 않음                                          | WebSocket app-server URL입니다.                                                                                                                                                                                                                                                                                                                                                              |
| `authToken`                                   | 설정되지 않음                                          | WebSocket 전송용 Bearer 토큰입니다. 리터럴 문자열 또는 `${CODEX_APP_SERVER_TOKEN}` 같은 SecretInput을 허용합니다.                                                                                                                                                                                                                                                                             |
| `headers`                                     | `{}`                                                   | 추가 WebSocket 헤더입니다. 헤더 값은 리터럴 문자열 또는 SecretInput 값을 허용합니다. 예: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                     |
| `clearEnv`                                    | `[]`                                                   | OpenClaw가 상속된 환경을 빌드한 뒤 생성된 stdio app-server 프로세스에서 제거되는 추가 환경 변수 이름입니다. OpenClaw는 로컬 실행을 위해 에이전트별 `CODEX_HOME`과 상속된 `HOME`을 유지합니다.                                                                                                                                                                                               |
| `codeModeOnly`                                | `false`                                                | Codex의 코드 모드 전용 도구 표면을 사용하도록 선택합니다. OpenClaw 동적 도구는 Codex에 계속 등록되어 중첩된 `tools.*` 호출이 app-server `item/tool/call` 브리지를 통해 반환됩니다.                                                                                                                                                                                                            |
| `remoteWorkspaceRoot`                         | 설정되지 않음                                          | 원격 Codex app-server 워크스페이스 루트입니다. 설정하면 OpenClaw는 해석된 OpenClaw 워크스페이스에서 로컬 워크스페이스 루트를 추론하고, 이 원격 루트 아래의 현재 cwd 접미사를 보존하며, 최종 app-server cwd만 Codex로 보냅니다. cwd가 해석된 OpenClaw 워크스페이스 루트 밖에 있으면 OpenClaw는 gateway 로컬 경로를 원격 app-server로 보내는 대신 실패로 닫습니다. |
| `requestTimeoutMs`                            | `60000`                                                | app-server 제어 플레인 호출의 제한 시간입니다.                                                                                                                                                                                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex가 턴을 수락한 뒤 또는 OpenClaw가 `turn/completed`를 기다리는 동안 턴 범위 app-server 요청이 있은 뒤의 조용한 대기 구간입니다.                                                                                                                                                                                                                                                          |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw가 `turn/completed`를 기다리는 동안 도구 핸드오프, 네이티브 도구 완료, 도구 이후 원시 어시스턴트 진행, 원시 추론 완료 또는 추론 진행 이후에 사용되는 완료 유휴 및 진행 가드입니다. 도구 이후 합성이 최종 어시스턴트 릴리스 예산보다 합법적으로 더 오래 조용히 유지될 수 있는 신뢰할 수 있거나 무거운 워크로드에 사용하세요.                                |
| `mode`                                        | 로컬 Codex 요구 사항이 YOLO를 허용하지 않는 경우를 제외하고 `"yolo"` | YOLO 또는 guardian 검토 실행용 프리셋입니다. `danger-full-access`, `never` 승인 또는 `user` 검토자를 생략한 로컬 stdio 요구 사항은 암시적 기본값을 guardian으로 만듭니다.                                                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` 또는 허용된 guardian 승인 정책               | 스레드 시작/재개/턴으로 전송되는 네이티브 Codex 승인 정책입니다. guardian 기본값은 허용되는 경우 `"on-request"`를 선호합니다.                                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` 또는 허용된 guardian 샌드박스   | 스레드 시작/재개로 전송되는 네이티브 Codex 샌드박스 모드입니다. guardian 기본값은 허용되는 경우 `"workspace-write"`를 선호하고, 그렇지 않으면 `"read-only"`를 선호합니다. OpenClaw 샌드박스가 활성 상태이면 `danger-full-access` 턴은 OpenClaw 샌드박스 이그레스 설정에서 파생된 네트워크 액세스와 함께 Codex `workspace-write`를 사용합니다.                 |
| `approvalsReviewer`                           | `"user"` 또는 허용된 guardian 검토자                   | 허용되는 경우 Codex가 네이티브 승인 프롬프트를 검토하게 하려면 `"auto_review"`를 사용하고, 그렇지 않으면 `guardian_subagent` 또는 `user`를 사용합니다. `guardian_subagent`는 레거시 별칭으로 남아 있습니다.                                                                                                                                                                                    |
| `serviceTier`                                 | 설정되지 않음                                          | 선택적 Codex app-server 서비스 티어입니다. `"priority"`는 fast-mode 라우팅을 활성화하고, `"flex"`는 flex 처리를 요청하며, `null`은 재정의를 지우고, 레거시 `"fast"`는 `"priority"`로 허용됩니다.                                                                                                                                                                                              |
| `networkProxy`                                | 비활성화됨                                             | app-server 명령에 대해 Codex 권한 프로필 네트워킹을 사용하도록 선택합니다. OpenClaw는 `sandbox`를 보내는 대신 선택한 `permissions.<profile>.network` 구성을 정의하고 `default_permissions`로 선택합니다.                                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | 활성 OpenClaw 샌드박스 안에서 네이티브 Codex 실행을 실행할 수 있도록 OpenClaw 샌드박스 기반 Codex 환경을 Codex app-server 0.132.0 이상에 등록하는 미리 보기 옵트인입니다.                                                                                                                                                                                                                    |

`appServer.networkProxy`는 Codex 샌드박스 계약을 변경하기 때문에 명시적입니다.
활성화하면 OpenClaw는 생성된 권한 프로필이 Codex 관리형 네트워킹을 시작할 수 있도록
Codex 스레드 구성에서 `features.network_proxy.enabled`와 `default_permissions`도 설정합니다.
기본적으로 OpenClaw는 프로필 본문에서 충돌에 강한 `openclaw-network-<fingerprint>`
프로필 이름을 생성합니다. 안정적인 로컬 이름이 필요할 때만 `profileName`을 사용하세요.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

일반 app-server 런타임이 `danger-full-access`인 경우
`networkProxy`를 활성화하면 생성된 권한 프로필에 워크스페이스 스타일 파일 시스템 액세스를 사용합니다.
Codex 관리형 네트워크 적용은 샌드박스 네트워킹이므로
전체 액세스 프로필은 아웃바운드 트래픽을 보호하지 못합니다.
도메인 항목은 `allow` 또는 `deny`를 사용하고, Unix 소켓 항목은 Codex의
`allow` 또는 `none` 값을 사용합니다.

OpenClaw 소유 동적 도구 호출은 `appServer.requestTimeoutMs`와 독립적으로 제한됩니다. Codex `item/tool/call` 요청은 기본적으로 90초 OpenClaw watchdog을 사용합니다. 양수인 호출별 `timeoutMs` 인수는 해당 특정 도구 예산을 늘리거나 줄입니다. `image_generate` 도구는 도구 호출이 자체 제한 시간을 제공하지 않으면 `agents.defaults.imageGenerationModel.timeoutMs`를 사용하고, 그렇지 않으면 120초 이미지 생성 기본값을 사용합니다. 미디어 이해 `image` 도구는 `tools.media.image.timeoutSeconds` 또는 60초 미디어 기본값을 사용합니다. 이미지 이해의 경우 이 제한 시간은 요청 자체에 적용되며, 앞선 준비 작업으로 줄어들지 않습니다. 동적 도구 예산은 600000 ms로 상한이 설정됩니다. 제한 시간이 초과되면 OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한 동적 도구 응답을 Codex에 반환하여 세션을 `processing`에 남겨 두지 않고 턴을 계속할 수 있게 합니다. 이 watchdog은 외부 동적 `item/tool/call` 예산입니다. 제공자별 요청 제한 시간은 해당 호출 내부에서 실행되며 자체 제한 시간 의미 체계를 유지합니다.

Codex가 턴을 수락한 뒤, 그리고 OpenClaw가 턴 범위 app-server 요청에 응답한 뒤, 하네스는 Codex가 현재 턴 진행을 만들고 결국 네이티브 턴을 `turn/completed`로 완료하기를 기대합니다. app-server가 `appServer.turnCompletionIdleTimeoutMs` 동안 조용해지면 OpenClaw는 최선 노력으로 Codex 턴을 중단하고, 진단 제한 시간 초과를 기록하며, 후속 채팅 메시지가 오래된 네이티브 턴 뒤에 대기하지 않도록 OpenClaw 세션 레인을 해제합니다. 동일한 턴에 대한 대부분의 비터미널 알림은 Codex가 턴이 아직 살아 있음을 증명했기 때문에 이 짧은 watchdog을 해제합니다. 도구 인계는 더 긴 도구 이후 유휴 예산을 사용합니다. OpenClaw가 `item/tool/call` 응답을 반환한 뒤, `commandExecution` 같은 네이티브 도구 항목이 완료된 뒤, 원시 `custom_tool_call_output` 완료 뒤, 그리고 도구 이후 원시 어시스턴트 진행, 원시 추론 완료 또는 추론 진행 뒤입니다. 가드는 구성된 경우 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`를 사용하고, 그렇지 않으면 기본값으로 5분을 사용합니다. 동일한 도구 이후 예산은 Codex가 다음 현재 턴 이벤트를 내보내기 전의 조용한 합성 구간에 대한 진행 watchdog도 연장합니다. 속도 제한 업데이트 같은 전역 app-server 알림은 턴 유휴 진행을 재설정하지 않습니다. 추론 완료, 해설 `agentMessage` 완료, 그리고 도구 이전 원시 추론 또는 어시스턴트 진행 뒤에는 자동 최종 응답이 이어질 수 있으므로 세션 레인을 즉시 해제하는 대신 진행 이후 응답 가드를 사용합니다. 최종/비해설 완료 `agentMessage` 항목과 도구 이전 원시 어시스턴트 완료만 어시스턴트 출력 해제를 준비합니다. 이후 Codex가 `turn/completed` 없이 조용해지면 OpenClaw는 최선 노력으로 네이티브 턴을 중단하고 세션 레인을 해제합니다. 어시스턴트, 도구, 활성 항목 또는 부작용 증거가 없는 턴 완료 유휴 제한 시간 초과를 포함한 재생 안전 stdio app-server 실패는 새 app-server 시도에서 한 번 재시도됩니다. 안전하지 않은 제한 시간 초과는 여전히 멈춘 app-server 클라이언트를 폐기하고 OpenClaw 세션 레인을 해제합니다. 또한 자동으로 재생되는 대신 오래된 네이티브 스레드 바인딩을 지웁니다. 완료 감시 제한 시간 초과는 Codex 전용 제한 시간 텍스트를 표시합니다. 재생 안전 사례는 응답이 불완전할 수 있다고 말하고, 안전하지 않은 사례는 재시도하기 전에 현재 상태를 확인하라고 사용자에게 알립니다. 공개 제한 시간 진단에는 마지막 app-server 알림 메서드, 원시 어시스턴트 응답 항목 id/type/role, 활성 요청/항목 수, 준비된 감시 상태 같은 구조적 필드가 포함됩니다. 마지막 알림이 원시 어시스턴트 응답 항목이면 제한된 어시스턴트 텍스트 미리보기도 포함합니다. 원시 프롬프트나 도구 콘텐츠는 포함하지 않습니다.

환경 재정의는 로컬 테스트에 계속 사용할 수 있습니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`은 `appServer.command`가 설정되지 않은 경우 관리형 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신 `plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나, 일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요. 반복 가능한 배포에는 구성이 권장됩니다. 나머지 Codex 하네스 설정과 동일한 검토된 파일에 Plugin 동작을 유지하기 때문입니다.

## 네이티브 Codex Plugin

네이티브 Codex Plugin 지원은 OpenClaw 하네스 턴과 동일한 Codex 스레드에서 Codex app-server 자체의 앱 및 Plugin 기능을 사용합니다. OpenClaw는 Codex Plugin을 합성 `codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다.

`codexPlugins`는 네이티브 Codex 하네스를 선택한 세션에만 영향을 줍니다. 내장 하네스 실행, 일반 OpenAI 제공자 실행, ACP 대화 바인딩 또는 다른 하네스에는 영향을 주지 않습니다.

최소 마이그레이션된 구성:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
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

스레드 앱 구성은 OpenClaw가 Codex 하네스 세션을 설정하거나 오래된 Codex 스레드 바인딩을 교체할 때 계산됩니다. 매 턴마다 다시 계산되지 않습니다. `codexPlugins`를 변경한 뒤에는 `/new`, `/reset`을 사용하거나 gateway를 다시 시작하여 향후 Codex 하네스 세션이 업데이트된 앱 집합으로 시작되게 하세요.

마이그레이션 적격성, 앱 인벤토리, 파괴적 작업 정책, elicitations 및 네이티브 Plugin 진단은 [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)을 참조하세요.

OpenAI 쪽 앱 및 Plugin 액세스는 로그인한 Codex 계정과, Business 및 Enterprise/Edu 워크스페이스의 경우 워크스페이스 앱 제어에 의해 제어됩니다. OpenAI의 계정 및 워크스페이스 제어 개요는 [ChatGPT 플랜으로 Codex 사용하기](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)를 참조하세요.

## Computer Use

Computer Use는 자체 설정 가이드에서 다룹니다.
[Codex Computer Use](/ko/plugins/codex-computer-use).

짧게 말하면, OpenClaw는 데스크톱 제어 앱을 벤더링하거나 데스크톱 작업을 직접 실행하지 않습니다. Codex app-server를 준비하고 `computer-use` MCP 서버를 사용할 수 있는지 확인한 다음, Codex 모드 턴 중 네이티브 MCP 도구 호출은 Codex가 소유하도록 합니다.

## 런타임 경계

Codex 하네스는 저수준 임베디드 에이전트 실행기만 변경합니다.

- OpenClaw 동적 도구가 지원됩니다. Codex는 OpenClaw에 해당 도구 실행을 요청하므로 OpenClaw는 실행 경로에 남아 있습니다.
- Codex 네이티브 셸, 패치, MCP 및 네이티브 앱 도구는 Codex가 소유합니다. OpenClaw는 지원되는 릴레이를 통해 선택된 네이티브 이벤트를 관찰하거나 차단할 수 있지만, 네이티브 도구 인수를 다시 작성하지 않습니다.
- Codex는 네이티브 Compaction을 소유합니다. OpenClaw는 채널 기록, 검색, `/new`, `/reset`, 그리고 향후 모델 또는 하네스 전환을 위해 트랜스크립트 미러를 유지하지만, Codex Compaction을 OpenClaw 또는 컨텍스트 엔진 요약기로 대체하지 않습니다.
- 미디어 생성, 미디어 이해, TTS, 승인, 메시징 도구 출력은 일치하는 OpenClaw 제공자/모델 설정을 계속 거칩니다.
- `tool_result_persist`는 OpenClaw 소유 트랜스크립트 도구 결과에 적용되며, Codex 네이티브 도구 결과 레코드에는 적용되지 않습니다.

훅 레이어, 지원되는 V1 표면, 네이티브 권한 처리, 큐 조정, Codex 피드백 업로드 메커니즘 및 Compaction 세부 정보는 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)을 참조하세요.

## 문제 해결

**Codex가 일반 `/model` 제공자로 표시되지 않음:** 새 구성에서는 예상된 동작입니다. `openai/gpt-*` 모델을 선택하고, `plugins.entries.codex.enabled`를 활성화한 뒤, `plugins.allow`가 `codex`를 제외하는지 확인하세요.

**OpenClaw가 Codex 대신 내장 하네스를 사용함:** 모델 참조가 공식 OpenAI 제공자의 `openai/gpt-*`인지, Codex Plugin이 설치 및 활성화되어 있는지 확인하세요. 테스트 중 엄격한 증명이 필요하면 제공자 또는 모델 `agentRuntime.id: "codex"`를 설정하세요. 강제 Codex 런타임은 OpenClaw로 폴백하는 대신 실패합니다.

**OpenAI Codex 런타임이 API 키 경로로 폴백함:** 모델, 런타임, 선택된 제공자 및 실패를 보여 주는 수정된 gateway 발췌를 수집하세요. 영향을 받은 협업자에게 OpenClaw 호스트에서 이 읽기 전용 명령을 실행하도록 요청하세요.

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

유용한 발췌에는 보통 `openai/gpt-5.5` 또는 `openai/gpt-5.4`, `Runtime: OpenAI Codex`, `agentRuntime.id` 또는 `harnessRuntime`, `candidateProvider: "openai"`, 그리고 `401`, `Incorrect API key` 또는 `No API key` 결과가 포함됩니다. 수정된 실행은 일반 OpenAI API 키 실패 대신 OpenAI OAuth 경로를 보여야 합니다.

**레거시 Codex 모델 참조 구성이 남아 있음:** `openclaw doctor --fix`를 실행하세요. Doctor는 레거시 모델 참조를 `openai/*`로 다시 작성하고, 오래된 세션 및 전체 에이전트 런타임 핀을 제거하며, 기존 인증 프로필 재정의를 보존합니다.

**app-server가 거부됨:** Codex app-server `0.125.0` 이상을 사용하세요. `0.125.0-alpha.2` 또는 `0.125.0+custom` 같은 동일 버전 프리릴리스 또는 빌드 접미사 버전은 거부됩니다. OpenClaw가 안정 `0.125.0` 프로토콜 하한을 테스트하기 때문입니다.

**`/codex status`가 연결할 수 없음:** 번들 `codex` Plugin이 활성화되어 있는지, 허용 목록이 구성된 경우 `plugins.allow`에 해당 Plugin이 포함되어 있는지, 그리고 사용자 지정 `appServer.command`, `url`, `authToken` 또는 헤더가 유효한지 확인하세요.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs`를 낮추거나 검색을 비활성화하세요. [Codex 하네스 참조](/ko/plugins/codex-harness-reference#model-discovery)를 참조하세요.

**WebSocket 전송이 즉시 실패함:** `appServer.url`, `authToken`, 헤더, 그리고 원격 app-server가 동일한 Codex app-server 프로토콜 버전을 말하는지 확인하세요.

**네이티브 셸 또는 패치 도구가 `Native hook relay unavailable`로 차단됨:** Codex 스레드가 OpenClaw에 더 이상 등록되어 있지 않은 네이티브 훅 릴레이 id를 여전히 사용하려고 하고 있습니다. 이는 네이티브 Codex 훅 전송 문제이며, ACP 백엔드, 제공자, GitHub 또는 셸 명령 실패가 아닙니다. 영향을 받은 채팅에서 `/new` 또는 `/reset`으로 새 세션을 시작한 뒤 무해한 명령을 다시 시도하세요. 한 번은 작동하지만 다음 네이티브 도구 호출이 다시 실패하면 `/new`를 임시 해결책으로만 취급하세요. 오래된 스레드가 삭제되고 네이티브 훅 등록이 다시 생성되도록 Codex app-server 또는 OpenClaw Gateway를 다시 시작한 뒤 프롬프트를 새 세션에 복사하세요.

**비 Codex 모델이 내장 하네스를 사용함:** 제공자 또는 모델 런타임 정책이 다른 하네스로 라우팅하지 않는 한 예상된 동작입니다. 일반 비 OpenAI 제공자 참조는 `auto` 모드에서 정상 제공자 경로에 남아 있습니다.

**Computer Use가 설치되어 있지만 도구가 실행되지 않음:** 새 세션에서
`/codex computer-use status`를 확인하세요. 도구가
`Native hook relay unavailable`을 보고하면 위의 네이티브 훅 릴레이 복구를 사용하세요. 자세한 내용은
[Codex Computer Use](/ko/plugins/codex-computer-use#troubleshooting)를 참조하세요.

## 관련

- [Codex 하니스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하니스 런타임](/ko/plugins/codex-harness-runtime)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Codex Computer Use](/ko/plugins/codex-computer-use)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [모델 제공자](/ko/concepts/model-providers)
- [OpenAI 제공자](/ko/providers/openai)
- [OpenAI Codex 도움말](https://help.openai.com/en/collections/14937394-codex)
- [에이전트 하니스 Plugin](/ko/plugins/sdk-agent-harness)
- [Plugin 훅](/ko/plugins/hooks)
- [진단 내보내기](/ko/gateway/diagnostics)
- [상태](/ko/cli/status)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
