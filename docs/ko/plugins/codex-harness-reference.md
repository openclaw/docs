---
read_when:
    - 모든 Codex 하네스 구성 필드가 필요합니다
    - 앱 서버의 전송, 인증, 탐색 또는 시간 초과 동작을 변경하는 경우
    - Codex 하네스 시작, 모델 검색 또는 환경 격리를 디버깅하고 있습니다
summary: Codex 하네스의 구성, 인증, 검색 및 앱 서버 참조
title: Codex 하네스 참조
x-i18n:
    generated_at: "2026-05-10T19:41:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72767810c9448015a1ce7f35263dba576151b18c1f4a43ba531d45728241f095
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

이 참조 문서는 번들된 `codex` Plugin의 상세 구성을 다룹니다. 설정 및 라우팅 결정을 위해서는 [Codex 하네스](/ko/plugins/codex-harness)부터 시작하세요.

## Plugin 구성 표면

모든 Codex 하네스 설정은 `plugins.entries.codex.config` 아래에 있습니다.

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

지원되는 최상위 필드:

| 필드                       | 기본값                   | 의미                                                                                                                                     |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 활성화됨                 | Codex 앱 서버 `model/list`의 모델 검색 설정입니다.                                                                                       |
| `appServer`                | 관리형 stdio 앱 서버     | 전송, 명령, 인증, 승인, 샌드박스, 시간 초과 설정입니다.                                                                                 |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw 동적 도구를 초기 Codex 도구 컨텍스트에 직접 넣으려면 `"direct"`를 사용합니다.                                                   |
| `codexDynamicToolsExclude` | `[]`                     | Codex 앱 서버 턴에서 제외할 추가 OpenClaw 동적 도구 이름입니다.                                                                         |
| `codexPlugins`             | 비활성화됨               | 마이그레이션된 소스 설치 큐레이션 Plugin을 위한 네이티브 Codex Plugin/앱 지원입니다. [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)을 참조하세요. |
| `computerUse`              | 비활성화됨               | Codex Computer Use 설정입니다. [Codex Computer Use](/ko/plugins/codex-computer-use)를 참조하세요.                                           |

## 앱 서버 전송

기본적으로 OpenClaw는 번들된 Plugin과 함께 제공되는 관리형 Codex 바이너리를 시작합니다.

```bash
codex app-server --listen stdio://
```

이렇게 하면 앱 서버 버전이 로컬에 별도로 설치되어 있을 수 있는 Codex CLI가 아니라 번들된 `codex` Plugin에 묶입니다. 의도적으로 다른 실행 파일을 실행하려는 경우에만 `appServer.command`를 설정하세요.

이미 실행 중인 앱 서버에는 WebSocket 전송을 사용하세요.

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

지원되는 `appServer` 필드:

| 필드                          | 기본값                                                   | 의미                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                                | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                                                                                                              |
| `command`                     | 관리형 Codex 바이너리                                    | stdio 전송용 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 않은 상태로 두세요.                                                                                                       |
| `args`                        | `["app-server", "--listen", "stdio://"]`                 | stdio 전송용 인수입니다.                                                                                                                                                                       |
| `url`                         | 설정되지 않음                                            | WebSocket 앱 서버 URL입니다.                                                                                                                                                                   |
| `authToken`                   | 설정되지 않음                                            | WebSocket 전송용 Bearer 토큰입니다.                                                                                                                                                            |
| `headers`                     | `{}`                                                     | 추가 WebSocket 헤더입니다.                                                                                                                                                                     |
| `clearEnv`                    | `[]`                                                     | OpenClaw가 상속 환경을 구성한 뒤 생성된 stdio 앱 서버 프로세스에서 제거할 추가 환경 변수 이름입니다.                                                                                        |
| `requestTimeoutMs`            | `60000`                                                  | 앱 서버 컨트롤 플레인 호출의 시간 초과입니다.                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs` | `60000`                                                  | OpenClaw가 `turn/completed`를 기다리는 동안 턴 범위 앱 서버 요청 후의 조용한 대기 구간입니다.                                                                                                |
| `mode`                        | 로컬 Codex 요구 사항이 YOLO를 허용하지 않는 경우를 제외하면 `"yolo"` | YOLO 또는 guardian 검토 실행을 위한 프리셋입니다.                                                                                                                                              |
| `approvalPolicy`              | `"never"` 또는 허용된 guardian 승인 정책                 | 스레드 시작, 재개, 턴에 전송되는 네이티브 Codex 승인 정책입니다.                                                                                                                              |
| `sandbox`                     | `"danger-full-access"` 또는 허용된 guardian 샌드박스     | 스레드 시작 및 재개에 전송되는 네이티브 Codex 샌드박스 모드입니다.                                                                                                                            |
| `approvalsReviewer`           | `"user"` 또는 허용된 guardian 검토자                     | 허용되는 경우 Codex가 네이티브 승인 프롬프트를 검토하도록 하려면 `"auto_review"`를 사용합니다.                                                                                                |
| `defaultWorkspaceDir`         | 현재 프로세스 디렉터리                                   | `--cwd`가 생략되었을 때 `/codex bind`가 사용하는 작업 영역입니다.                                                                                                                             |
| `serviceTier`                 | 설정되지 않음                                            | 선택적 Codex 앱 서버 서비스 티어입니다. `"priority"`는 빠른 모드 라우팅을 활성화하고, `"flex"`는 flex 처리를 요청하며, `null`은 재정의를 지웁니다. 레거시 `"fast"`는 `"priority"`로 허용됩니다. |

Plugin은 오래되었거나 버전이 없는 앱 서버 핸드셰이크를 차단합니다. Codex 앱 서버는 안정 버전 `0.125.0` 이상을 보고해야 합니다.

## 승인 및 샌드박스 모드

로컬 stdio 앱 서버 세션은 기본적으로 YOLO 모드를 사용합니다. `approvalPolicy: "never"`, `approvalsReviewer: "user"`, `sandbox: "danger-full-access"`입니다. 이 신뢰된 로컬 운영자 자세는 응답할 사람이 없는 네이티브 승인 프롬프트 없이 무인 OpenClaw 턴과 Heartbeat가 진행되도록 합니다.

Codex의 로컬 시스템 요구 사항 파일이 암시적 YOLO 승인, 검토자 또는 샌드박스 값을 허용하지 않으면, OpenClaw는 암시적 기본값을 대신 guardian으로 취급하고 허용된 guardian 권한을 선택합니다. 같은 요구 사항 파일의 호스트 이름 일치 `[[remote_sandbox_config]]` 항목은 샌드박스 기본값 결정에 반영됩니다.

Codex guardian 검토 승인을 사용하려면 `appServer.mode: "guardian"`을 설정하세요.

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

`guardian` 프리셋은 해당 값이 허용될 때 `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"`, `sandbox: "workspace-write"`로 확장됩니다. 개별 정책 필드는 `mode`를 재정의합니다. 이전 `guardian_subagent` 검토자 값은 여전히 호환성 별칭으로 허용되지만, 새 구성에서는 `auto_review`를 사용해야 합니다.

## 인증 및 환경 격리

인증은 다음 순서로 선택됩니다.

1. 에이전트의 명시적 OpenClaw Codex 인증 프로필.
2. 해당 에이전트의 Codex 홈에 있는 앱 서버의 기존 계정.
3. 로컬 stdio 앱 서버 실행에 한해서, 앱 서버 계정이 없고 OpenAI 인증이 여전히 필요한 경우 `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 스타일 Codex 인증 프로필을 발견하면, 생성된 Codex 자식 프로세스에서 `CODEX_API_KEY`와 `OPENAI_API_KEY`를 제거합니다. 이렇게 하면 Gateway 수준 API 키를 임베딩 또는 직접 OpenAI 모델에 계속 사용할 수 있으면서, 네이티브 Codex 앱 서버 턴이 실수로 API를 통해 과금되는 것을 방지합니다.

명시적 Codex API 키 프로필과 로컬 stdio 환경 키 폴백은 상속된 자식 프로세스 환경 대신 앱 서버 로그인을 사용합니다. WebSocket 앱 서버 연결은 Gateway 환경 API 키 폴백을 받지 않습니다. 명시적 인증 프로필이나 원격 앱 서버의 자체 계정을 사용하세요.

stdio 앱 서버 실행은 기본적으로 OpenClaw의 프로세스 환경을 상속하지만, OpenClaw가 Codex 앱 서버 계정 브리지를 소유하며 `CODEX_HOME`과 `HOME`을 모두 해당 에이전트의 OpenClaw 상태 아래에 있는 에이전트별 디렉터리로 설정합니다. Codex의 자체 Skills 로더는 `$CODEX_HOME/skills`와 `$HOME/.agents/skills`를 읽으므로, 로컬 앱 서버 실행에서는 두 값이 모두 격리됩니다. 이를 통해 Codex 네이티브 Skills, Plugin, 구성, 계정, 스레드 상태가 운영자의 개인 Codex CLI 홈에서 새어 들어오지 않고 OpenClaw 에이전트 범위에 유지됩니다.

OpenClaw Plugin과 OpenClaw Skill 스냅샷은 여전히 OpenClaw 자체 Plugin 레지스트리와 Skill 로더를 통해 흐릅니다. 개인 Codex CLI 자산은 그렇지 않습니다. OpenClaw 에이전트의 일부가 되어야 하는 유용한 Codex CLI Skills 또는 Plugin이 있다면 명시적으로 인벤토리를 작성하세요.

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

`appServer.clearEnv`는 생성된 Codex 앱 서버 자식 프로세스에만 영향을 줍니다. `CODEX_HOME`과 `HOME`은 로컬 실행에서 OpenClaw의 에이전트별 Codex 격리를 위해 계속 예약됩니다.

## 동적 도구

Codex 동적 도구는 기본적으로 `searchable` 로딩을 사용합니다. OpenClaw는 Codex 네이티브 작업 영역 작업과 중복되는 동적 도구를 노출하지 않습니다.

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

OpenClaw의 나머지 통합 도구(예: 메시징, 세션, 미디어, cron,
브라우저, 노드, Gateway, `heartbeat_respond`, `web_search`)는
`openclaw` 네임스페이스 아래의 Codex 도구 검색을 통해 사용할 수 있습니다.
이렇게 하면 초기 모델 컨텍스트가 더 작게 유지됩니다. `sessions_yield`와
메시지 도구 전용 소스 응답은 턴 제어 계약이므로 직접 유지됩니다.

지연된 동적 도구를 검색할 수 없는 사용자 지정 Codex 앱 서버에 연결하거나
전체 도구 페이로드를 디버깅할 때만 `codexDynamicToolsLoading: "direct"`를
설정하세요.

## 타임아웃

OpenClaw가 소유한 동적 도구 호출은 `appServer.requestTimeoutMs`와
독립적으로 제한됩니다. 각 Codex `item/tool/call` 요청은 다음 순서로
처음 사용할 수 있는 타임아웃을 사용합니다.

- 양수인 호출별 `timeoutMs` 인수.
- `image_generate`의 경우 `agents.defaults.imageGenerationModel.timeoutMs`.
- 미디어 이해용 `image` 도구의 경우 `tools.media.image.timeoutSeconds`를
  밀리초로 변환한 값 또는 60초 미디어 기본값.
- 30초 동적 도구 기본값.

동적 도구 예산은 600000ms로 제한됩니다. 타임아웃 시 OpenClaw는 지원되는
경우 도구 신호를 중단하고 실패한 동적 도구 응답을 Codex에 반환하여,
세션을 `processing` 상태로 남겨 두지 않고 턴을 계속할 수 있게 합니다.

OpenClaw가 Codex 턴 범위 앱 서버 요청에 응답한 뒤에도, 하네스는 Codex가
네이티브 턴을 `turn/completed`로 완료하기를 기대합니다. 해당 응답 이후
`appServer.turnCompletionIdleTimeoutMs` 동안 앱 서버가 조용하면, OpenClaw는
최선의 방식으로 Codex 턴을 인터럽트하고, 진단용 타임아웃을 기록하며,
OpenClaw 세션 레인을 해제하여 후속 채팅 메시지가 오래된 네이티브 턴 뒤에
대기하지 않도록 합니다.

같은 턴에 대한 비종료 알림(예: `rawResponseItem/completed`)이 있으면,
Codex가 턴이 아직 살아 있음을 증명한 것이므로 이 짧은 감시 타이머는
해제됩니다. 더 긴 종료 감시 타이머는 실제로 멈춘 턴을 계속 보호합니다.
타임아웃 진단에는 마지막 앱 서버 알림 메서드가 포함되며, 원시 어시스턴트
응답 항목의 경우 항목 유형, 역할, id, 제한된 어시스턴트 텍스트 미리보기가
포함됩니다.

## 모델 검색

기본적으로 Codex Plugin은 앱 서버에 사용 가능한 모델을 요청합니다. 모델
가용성은 Codex 앱 서버가 소유하므로, OpenClaw가 번들된 `@openai/codex`
버전을 업그레이드하거나 배포에서 `appServer.command`가 다른 Codex
바이너리를 가리키면 목록이 바뀔 수 있습니다. 가용성은 계정 범위일 수도
있습니다. 실행 중인 Gateway에서 `/codex models`를 사용하면 해당 하네스와
계정의 실시간 카탈로그를 볼 수 있습니다.

검색이 실패하거나 타임아웃되면 OpenClaw는 다음에 대해 번들된 대체
카탈로그를 사용합니다.

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

현재 번들된 하네스는 `@openai/codex` `0.130.0`입니다. 해당 번들 앱 서버에
대한 `model/list` 프로브는 다음을 반환했습니다.

| 모델 id               | 기본값 | 숨김 | 입력 모달리티 | 추론 노력                 |
| --------------------- | ------ | ---- | ------------- | ------------------------- |
| `gpt-5.5`             | 예     | 아니요 | 텍스트, 이미지 | 낮음, 중간, 높음, 매우 높음 |
| `gpt-5.4`             | 아니요 | 아니요 | 텍스트, 이미지 | 낮음, 중간, 높음, 매우 높음 |
| `gpt-5.4-mini`        | 아니요 | 아니요 | 텍스트, 이미지 | 낮음, 중간, 높음, 매우 높음 |
| `gpt-5.3-codex`       | 아니요 | 아니요 | 텍스트, 이미지 | 낮음, 중간, 높음, 매우 높음 |
| `gpt-5.3-codex-spark` | 아니요 | 아니요 | 텍스트          | 낮음, 중간, 높음, 매우 높음 |
| `gpt-5.2`             | 아니요 | 아니요 | 텍스트, 이미지 | 낮음, 중간, 높음, 매우 높음 |

숨겨진 모델은 내부 또는 특수 흐름을 위해 앱 서버 카탈로그에서 반환될 수
있지만, 일반적인 모델 선택기 선택지는 아닙니다.

`plugins.entries.codex.config.discovery` 아래에서 검색을 조정하세요.

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

시작 시 Codex를 프로브하지 않고 대체 카탈로그만 사용하려면 검색을
비활성화하세요.

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

## 워크스페이스 부트스트랩 파일

Codex는 네이티브 프로젝트 문서 검색을 통해 `AGENTS.md`를 자체적으로
처리합니다. OpenClaw는 합성 Codex 프로젝트 문서 파일을 작성하거나, 페르소나
파일에 대한 Codex 대체 파일명에 의존하지 않습니다. Codex 대체는
`AGENTS.md`가 없을 때만 적용되기 때문입니다.

OpenClaw 워크스페이스 일관성을 위해 Codex 하네스는 `SOUL.md`, `TOOLS.md`,
`IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`를
포함한 다른 부트스트랩 파일이 있으면 이를 확인하고, `thread/start`와
`thread/resume`의 Codex 개발자 지침을 통해 전달합니다. 이렇게 하면
`AGENTS.md`를 복제하지 않고도 워크스페이스 페르소나와 프로필 컨텍스트가
네이티브 Codex 동작 형성 레인에 표시됩니다.

## 환경 재정의

환경 재정의는 로컬 테스트에 계속 사용할 수 있습니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN`은 `appServer.command`가 설정되지 않았을 때
관리형 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을
사용하세요. 반복 가능한 배포에는 구성이 선호됩니다. Plugin 동작을 나머지
Codex 하네스 설정과 같은 검토된 파일에 유지하기 때문입니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Codex Computer Use](/ko/plugins/codex-computer-use)
- [OpenAI 제공자](/ko/providers/openai)
- [구성 참조](/ko/gateway/configuration-reference)
