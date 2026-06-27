---
read_when:
    - 에이전트를 통해 백그라운드 작업이나 병렬 작업을 원합니다
    - sessions_spawn 또는 하위 에이전트 도구 정책을 변경하고 있습니다
    - 스레드에 바인딩된 하위 에이전트 세션을 구현하거나 문제를 해결하고 있습니다
sidebarTitle: Sub-agents
summary: 격리된 백그라운드 에이전트 실행을 생성하여 결과를 요청자 채팅으로 다시 알립니다
title: 하위 에이전트
x-i18n:
    generated_at: "2026-06-27T18:17:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf8b819b1bb478c5161a7493f6a806aefb8df252e6c3d9faeee94a66689a5f5f
    source_path: tools/subagents.md
    workflow: 16
---

하위 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다.
자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며,
완료되면 결과를 요청자 채팅 채널로 **알립니다**. 각 하위 에이전트 실행은
[백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

주요 목표:

- 기본 실행을 차단하지 않고 "조사 / 긴 작업 / 느린 도구" 작업을 병렬화합니다.
- 기본적으로 하위 에이전트를 격리합니다(세션 분리 + 선택적 샌드박싱).
- 도구 표면을 오용하기 어렵게 유지합니다. 하위 에이전트는 기본적으로 세션 도구를 받지 않습니다.
- 오케스트레이터 패턴을 위해 구성 가능한 중첩 깊이를 지원합니다.

<Note>
**비용 참고:** 각 하위 에이전트는 기본적으로 자체 컨텍스트와 토큰 사용량을
가집니다. 무겁거나 반복적인 작업의 경우 하위 에이전트에는 더 저렴한 모델을 설정하고
기본 에이전트는 더 높은 품질의 모델로 유지하세요. `agents.defaults.subagents.model`
또는 에이전트별 재정의를 통해 구성합니다. 자식이 요청자의 현재 대화 기록을
    실제로 필요로 할 때는 에이전트가 해당 생성에 대해 `context: "fork"`를 요청할 수
    있습니다. 스레드에 바인딩된 하위 에이전트 세션은 현재 대화를 후속 스레드로
    분기하므로 기본값이 `context: "fork"`입니다.
</Note>

## 슬래시 명령

**현재 세션**의 하위 에이전트 실행을 검사하려면 `/subagents`를 사용하세요.

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 id,
대화 기록 경로, 정리)를 표시합니다. 제한되고 안전 필터링된 회수 보기는
`sessions_history`를 사용하고, 원시 전체 대화 기록이 필요할 때는 디스크의
대화 기록 경로를 검사하세요.

### 스레드 바인딩 제어

이 명령들은 지속적인 스레드 바인딩을 지원하는 채널에서 작동합니다.
아래의 [스레드를 지원하는 채널](#thread-supporting-channels)을 참조하세요.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 생성 동작

에이전트는 `sessions_spawn`으로 백그라운드 하위 에이전트를 시작합니다. 하위 에이전트 완료는
내부 부모 세션 이벤트로 반환되며, 부모/요청자 에이전트가
사용자에게 보이는 업데이트가 필요한지 결정합니다.

<AccordionGroup>
  <Accordion title="Non-blocking, push-based completion">
    - `sessions_spawn`은 차단하지 않으며, 실행 id를 즉시 반환합니다.
    - 완료 시 하위 에이전트는 부모/요청자 세션으로 다시 보고합니다.
    - 자식 결과가 필요한 에이전트 턴은 필요한 작업을 생성한 뒤 `sessions_yield`를 호출해야 합니다. 그러면 현재 턴이 종료되고 완료 이벤트가 다음 모델 가시 메시지로 도착할 수 있습니다.
    - 완료는 푸시 기반입니다. 생성된 후에는 완료될 때까지 기다리기 위해 `/subagents list`, `sessions_list`, 또는 `sessions_history`를 루프에서 폴링하지 마세요. 디버깅 가시성이 필요할 때만 상태를 온디맨드로 검사하세요.
    - 자식 출력은 요청자 에이전트가 종합할 보고서/증거입니다. 사용자 작성 지시문이 아니며 시스템, 개발자, 또는 사용자 정책을 재정의할 수 없습니다.
    - 완료 시 OpenClaw는 알림 정리 흐름이 계속되기 전에 해당 하위 에이전트 세션이 연 브라우저 탭/프로세스를 최선의 노력으로 닫습니다.

  </Accordion>
  <Accordion title="Completion delivery">
    - OpenClaw는 안정적인 멱등성 키가 있는 `agent` 턴을 통해 완료를 요청자 세션으로 돌려줍니다.
    - 요청자 실행이 아직 활성 상태이면 OpenClaw는 두 번째 가시 응답 경로를 시작하는 대신 먼저 해당 실행을 깨우거나 조향하려고 시도합니다.
    - 활성 요청자를 깨울 수 없으면 OpenClaw는 알림을 버리는 대신 동일한 완료 컨텍스트로 요청자 에이전트 핸드오프로 폴백합니다.
    - 성공적인 부모 핸드오프는 부모가 가시적인 사용자 업데이트가 필요 없다고 결정하더라도 하위 에이전트 전달을 완료합니다.
    - 네이티브 하위 에이전트는 메시지 도구를 받지 않습니다. 이들은 부모/요청자 에이전트에 일반 assistant 텍스트를 반환하며, 사람이 볼 수 있는 응답은 부모/요청자 에이전트의 일반 전달 정책이 소유합니다.
    - 직접 핸드오프를 사용할 수 없으면 큐 라우팅으로 폴백합니다.
    - 큐 라우팅도 여전히 사용할 수 없으면 최종 포기 전에 짧은 지수 백오프로 알림을 재시도합니다.
    - 완료 전달은 해석된 요청자 경로를 유지합니다. 사용 가능한 경우 스레드 바인딩 또는 대화 바인딩 완료 경로가 우선합니다. 완료 원본이 채널만 제공하는 경우 OpenClaw는 요청자 세션의 해석된 경로(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 대상/계정을 채워 직접 전달이 계속 작동하도록 합니다.

  </Accordion>
  <Accordion title="Completion handoff metadata">
    요청자 세션으로의 완료 핸드오프는 런타임이 생성한
    내부 컨텍스트(사용자가 작성한 텍스트가 아님)이며 다음을 포함합니다.

    - `Result` — 자식의 최신 가시 `assistant` 응답 텍스트입니다. Tool/toolResult 출력은 자식 결과로 승격되지 않습니다. 터미널 실패 실행은 캡처된 응답 텍스트를 재사용하지 않습니다.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - 간결한 런타임/토큰 통계.
    - 원래 작업이 완료되었는지 결정하기 전에 결과를 검증하라고 요청자 에이전트에 지시하는 검토 지시문.
    - 자식 결과에 추가 조치가 남아 있을 때 작업을 계속하거나 후속 조치를 기록하라고 요청자 에이전트에 알려주는 후속 안내.
    - 더 이상 조치가 없는 경로를 위한 최종 업데이트 지시문. 원시 내부 메타데이터를 전달하지 않고 일반 assistant 음성으로 작성됩니다.

  </Accordion>
  <Accordion title="Modes and ACP runtime">
    - `--model` 및 `--thinking`은 해당 특정 실행의 기본값을 재정의합니다.
    - 완료 후 세부 정보와 출력을 검사하려면 `info`/`log`를 사용하세요.
    - 지속적인 스레드 바인딩 세션에는 `thread: true` 및 `mode: "session"`과 함께 `sessions_spawn`을 사용하세요.
    - 요청자 채널이 스레드 바인딩을 지원하지 않으면 불가능한 스레드 바인딩 조합을 재시도하는 대신 `mode: "run"`을 사용하세요.
    - ACP 하네스 세션(Claude Code, Gemini CLI, OpenCode, 또는 명시적 Codex ACP/acpx)의 경우 도구가 해당 런타임을 광고할 때 `runtime: "acp"`와 함께 `sessions_spawn`을 사용하세요. 완료 또는 에이전트 간 루프를 디버깅할 때는 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참조하세요. `codex` Plugin이 활성화된 경우, 사용자가 ACP/acpx를 명시적으로 요청하지 않는 한 Codex 채팅/스레드 제어는 ACP보다 `/codex ...`를 선호해야 합니다.
    - OpenClaw는 ACP가 활성화되고, 요청자가 샌드박스 처리되지 않았으며, `acpx` 같은 백엔드 Plugin이 로드될 때까지 `runtime: "acp"`를 숨깁니다. `runtime: "acp"`는 외부 ACP 하네스 id 또는 `runtime.type="acp"`가 있는 `agents.list[]` 항목을 기대합니다. `agents_list`의 일반 OpenClaw 구성 에이전트에는 기본 하위 에이전트 런타임을 사용하세요.

  </Accordion>
</AccordionGroup>

## 컨텍스트 모드

네이티브 하위 에이전트는 호출자가 현재 대화 기록을 포크하도록 명시적으로 요청하지 않는 한
격리된 상태로 시작합니다.

| 모드       | 사용 시점                                                                                                                         | 동작                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 새로운 조사, 독립적인 구현, 느린 도구 작업, 또는 작업 텍스트로 요약 지시할 수 있는 모든 작업                           | 깨끗한 자식 대화 기록을 생성합니다. 이것이 기본값이며 토큰 사용량을 낮게 유지합니다.  |
| `fork`     | 현재 대화, 이전 도구 결과, 또는 요청자 대화 기록에 이미 있는 미묘한 지시문에 의존하는 작업 | 자식이 시작되기 전에 요청자 대화 기록을 자식 세션으로 분기합니다. |

`fork`는 아껴서 사용하세요. 이는 컨텍스트에 민감한 위임을 위한 것이며,
명확한 작업 프롬프트 작성의 대체물이 아닙니다.

## 도구: `sessions_spawn`

전역 `subagent` 레인에서 `deliver: false`로 하위 에이전트 실행을 시작한 다음,
알림 단계를 실행하고 알림 응답을 요청자 채팅 채널에 게시합니다.

사용 가능 여부는 호출자의 유효 도구 정책에 따라 달라집니다. `coding` 및
`full` 프로필은 기본적으로 `sessions_spawn`을 노출합니다. `messaging` 프로필은
그렇지 않습니다. 작업을 위임해야 하는 에이전트에는
`tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`를 추가하거나 `tools.profile: "coding"`을 사용하세요.
채널/그룹, 제공자, 샌드박스, 에이전트별 허용/거부 정책은
프로필 단계 이후에도 여전히 도구를 제거할 수 있습니다. 유효 도구 목록을 확인하려면
동일한 세션에서 `/tools`를 사용하세요.

**기본값:**

- **모델:** `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않으면 네이티브 하위 에이전트는 호출자를 상속합니다. ACP 런타임 생성은 구성된 하위 에이전트 모델이 있으면 동일한 모델을 사용하고, 그렇지 않으면 ACP 하네스가 자체 기본값을 유지합니다. 명시적 `sessions_spawn.model`은 여전히 우선합니다.
- **Thinking:** `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않으면 네이티브 하위 에이전트는 호출자를 상속합니다. ACP 런타임 생성은 선택한 모델에 대해 `agents.defaults.models["provider/model"].params.thinking`도 적용합니다. 명시적 `sessions_spawn.thinking`은 여전히 우선합니다.
- **실행 시간 제한:** OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 사용하고, 그렇지 않으면 `0`(시간 제한 없음)으로 폴백합니다. `sessions_spawn`은 호출별 시간 제한 재정의를 허용하지 않습니다.
- **작업 전달:** 네이티브 하위 에이전트는 첫 번째 가시 `[Subagent Task]` 메시지에서 위임된 작업을 받습니다. 하위 에이전트 시스템 프롬프트는 런타임 규칙과 라우팅 컨텍스트를 담으며, 작업의 숨겨진 중복본을 담지 않습니다.

허용된 네이티브 하위 에이전트 생성은 도구 결과에 해석된 자식 모델 메타데이터를 포함합니다.
`resolvedModel`에는 적용된 모델 참조가 포함되고,
`resolvedProvider`에는 참조에 제공자 접두사가 있을 때 해당 접두사가 포함됩니다.

### 위임 프롬프트 모드

`agents.defaults.subagents.delegationMode`는 프롬프트 안내만 제어합니다. 도구 정책을 변경하거나 위임을 강제하지 않습니다.

- `suggest`(기본값): 더 크거나 느린 작업에 하위 에이전트를 사용하라는 표준 프롬프트 권장을 유지합니다.
- `prefer`: 직접 응답보다 더 복잡한 작업은 `sessions_spawn`을 통해 위임하고 기본 에이전트가 응답성을 유지하도록 지시합니다.

에이전트별 재정의는 `agents.list[].subagents.delegationMode`를 사용합니다.

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### 도구 매개변수

<ParamField path="task" type="string" required>
  하위 에이전트의 작업 설명입니다.
</ParamField>
<ParamField path="taskName" type="string">
  이후 상태 출력에서 특정 자식을 식별하기 위한 선택적이고 안정적인 핸들입니다. `[a-z][a-z0-9_-]{0,63}`와 일치해야 하며 `last` 또는 `all` 같은 예약 대상일 수 없습니다.
</ParamField>
<ParamField path="label" type="string">
  선택 사항인 사람이 읽을 수 있는 레이블입니다.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents`에서 허용하는 경우 다른 구성된 에이전트 id 아래에서 생성합니다.
</ParamField>
<ParamField path="cwd" type="string">
  자식 실행을 위한 선택적 작업 디렉터리입니다. 네이티브 하위 에이전트는 여전히 대상 에이전트 워크스페이스에서 부트스트랩 파일을 로드합니다. `cwd`는 런타임 도구와 CLI 하니스가 위임된 작업을 수행하는 위치만 변경합니다.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp`는 외부 ACP 하니스(`claude`, `droid`, `gemini`, `opencode` 또는 명시적으로 요청된 Codex ACP/acpx)와 `runtime.type`이 `acp`인 `agents.list[]` 항목에만 사용됩니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 전용입니다. `runtime: "acp"`일 때 기존 ACP 하니스 세션을 재개합니다. 네이티브 하위 에이전트 생성에서는 무시됩니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 전용입니다. `runtime: "acp"`일 때 ACP 실행 출력을 부모 세션으로 스트리밍합니다. 네이티브 하위 에이전트 생성에서는 생략합니다.
</ParamField>
<ParamField path="model" type="string">
  하위 에이전트 모델을 재정의합니다. 잘못된 값은 건너뛰며, 하위 에이전트는 도구 결과에 경고를 포함하고 기본 모델에서 실행됩니다.
</ParamField>
<ParamField path="thinking" type="string">
  하위 에이전트 실행의 사고 수준을 재정의합니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true`이면 이 하위 에이전트 세션에 채널 스레드 바인딩을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true`이고 `mode`가 생략되면 기본값은 `session`이 됩니다. `mode: "session"`에는 `thread: true`가 필요합니다.
  요청자 채널에서 스레드 바인딩을 사용할 수 없으면 대신 `mode: "run"`을 사용합니다.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`는 알림 직후 보관합니다(이름 변경을 통해 트랜스크립트는 계속 유지).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`는 대상 자식 런타임이 샌드박스 처리되어 있지 않으면 생성을 거부합니다.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`는 요청자의 현재 트랜스크립트를 자식 세션으로 분기합니다. 네이티브 하위 에이전트 전용입니다. 스레드 바인딩 생성은 기본값이 `fork`이고, 비스레드 생성은 기본값이 `isolated`입니다.
</ParamField>

<Warning>
`sessions_spawn`은 채널 전달 매개변수(`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`)를 허용하지 **않습니다**. 네이티브 하위 에이전트는
최신 어시스턴트 턴을 요청자에게 다시 보고합니다. 외부 전달은
부모/요청자 에이전트에 남아 있습니다.
</Warning>

### 작업 이름 및 대상 지정

`taskName`은 세션 키가 아니라 오케스트레이션을 위해 모델에 노출되는 핸들입니다.
코디네이터가 나중에 해당 자식을 검사해야 할 수 있을 때 `review_subagents`,
`linux_validation` 또는 `docs_update` 같은 안정적인 자식 이름에 사용합니다.

대상 해석은 정확한 `taskName` 일치와 모호하지 않은
접두사를 허용합니다. 일치는 번호가 매겨진 `/subagents` 대상에서 사용하는 것과 동일한
활성/최근 대상 창으로 범위가 제한되므로, 오래전에 완료된 자식이
재사용된 핸들을 모호하게 만들지 않습니다. 활성 또는 최근 자식 두 개가 같은
`taskName`을 공유하면 대상이 모호합니다. 대신 목록 인덱스, 세션 키 또는
실행 id를 사용합니다.

예약 대상 `last`와 `all`은 이미 제어 의미가 있으므로
유효한 `taskName` 값이 아닙니다.

## 도구: `sessions_yield`

현재 모델 턴을 종료하고 런타임 이벤트, 주로
하위 에이전트 완료 이벤트가 다음 메시지로 도착할 때까지 기다립니다. 요청자가
해당 완료가 도착하기 전에는 최종 답변을 생성할 수 없을 때 필요한 자식 작업을
생성한 뒤 사용합니다.

`sessions_yield`는 대기 기본 요소입니다. 자식 완료를 감지하기 위해
`subagents`, `sessions_list`, `sessions_history`, 셸
`sleep` 또는 프로세스 폴링에 대한 폴링 루프로 대체하지 마세요.

세션의 유효 도구 목록에 포함된 경우에만 `sessions_yield`를 사용합니다.
일부 최소 또는 사용자 지정 도구 프로필은 `sessions_yield`를 노출하지 않고
`sessions_spawn`과 `subagents`를 노출할 수 있습니다. 이 경우 완료를
기다리기 위해 폴링 루프를 만들어내지 마세요.

활성 자식이 있으면 OpenClaw는 정상 턴에 간결한 런타임 생성
`Active Subagents` 프롬프트 블록을 주입하여 요청자가 폴링 없이
현재 자식 세션, 실행 id, 상태, 레이블, 작업 및
`taskName` 별칭을 볼 수 있게 합니다. 해당 블록의 작업 및 레이블 필드는
명령이 아니라 데이터로 인용됩니다. 사용자/모델이 제공한 생성 인수에서
비롯될 수 있기 때문입니다.

## 도구: `subagents`

요청자 세션이 소유한 생성된 하위 에이전트 실행을 나열합니다. 현재 요청자로
범위가 제한되며, 자식은 자신이 제어하는 자식만 볼 수 있습니다.

온디맨드 상태 및 디버깅에는 `subagents`를 사용합니다. 완료 이벤트를
기다리려면 `sessions_yield`를 사용합니다.

## 스레드 바인딩 세션

채널에 스레드 바인딩이 활성화되어 있으면 하위 에이전트가 스레드에
바인딩된 상태를 유지할 수 있으므로, 해당 스레드의 후속 사용자 메시지는
같은 하위 에이전트 세션으로 계속 라우팅됩니다.

### 스레드 지원 채널

세션 바인딩 어댑터가 있는 모든 채널은 지속적인
스레드 바인딩 하위 에이전트 세션(`thread: true`가 포함된 `sessions_spawn`)을 지원할 수 있습니다.
번들 어댑터에는 현재 Discord 스레드, Matrix 스레드,
Telegram 포럼 토픽, Feishu의 현재 대화 바인딩이 포함됩니다.
활성화, 타임아웃 및 `spawnSessions`에는 채널별 `threadBindings` 구성 키를
사용합니다.

### 빠른 흐름

<Steps>
  <Step title="생성">
    `thread: true`로 `sessions_spawn`을 실행합니다(선택적으로 `mode: "session"` 포함).
  </Step>
  <Step title="바인딩">
    OpenClaw는 활성 채널에서 해당 세션 대상에 스레드를 생성하거나 바인딩합니다.
  </Step>
  <Step title="후속 메시지 라우팅">
    해당 스레드의 답장 및 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
  </Step>
  <Step title="타임아웃 검사">
    비활성 자동 포커스 해제를 검사/업데이트하려면 `/session idle`을 사용하고
    하드 상한을 제어하려면 `/session max-age`를 사용합니다.
  </Step>
  <Step title="분리">
    수동으로 분리하려면 `/unfocus`를 사용합니다.
  </Step>
</Steps>

### 수동 제어

| 명령               | 효과                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 현재 스레드(또는 새로 만든 스레드)를 하위 에이전트/세션 대상에 바인딩 |
| `/unfocus`         | 현재 바인딩된 스레드의 바인딩 제거                                    |
| `/agents`          | 활성 실행 및 바인딩 상태(`thread:<id>` 또는 `unbound`) 나열           |
| `/session idle`    | 유휴 자동 포커스 해제 검사/업데이트(포커스된 바인딩 스레드만 해당)    |
| `/session max-age` | 하드 상한 검사/업데이트(포커스된 바인딩 스레드만 해당)                |

### 구성 스위치

- **전역 기본값:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **채널 재정의 및 생성 자동 바인딩 키**는 어댑터별로 다릅니다. 위의 [스레드 지원 채널](#thread-supporting-channels)을 참조하세요.

현재 어댑터 세부 정보는 [구성 참조](/ko/gateway/configuration-reference) 및
[슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

### 허용 목록

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  명시적 `agentId`를 통해 대상으로 지정할 수 있는 구성된 에이전트 id 목록입니다(`["*"]`는 구성된 모든 대상을 허용). 기본값: 요청자 에이전트만. 목록을 설정하면서 요청자가 `agentId`로 자기 자신을 생성할 수 있게 하려면 목록에 요청자 id를 포함합니다.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 사용하는 기본 구성 대상 에이전트 허용 목록입니다.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제). 에이전트별 재정의: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` 알림 전달 시도에 대한 호출별 타임아웃입니다. 값은 양의 정수 밀리초이며 플랫폼에 안전한 타이머 최댓값으로 제한됩니다. 일시적 재시도 때문에 총 알림 대기 시간이 구성된 타임아웃 하나보다 길어질 수 있습니다.
</ParamField>

요청자 세션이 샌드박스 처리되어 있으면 `sessions_spawn`은
샌드박스 없이 실행될 대상을 거부합니다.

### 검색

현재 `sessions_spawn`에 허용된 에이전트 id를 보려면 `agents_list`를 사용합니다.
응답에는 나열된 각 에이전트의 유효 모델과 임베드된 런타임 메타데이터가
포함되어 호출자가 OpenClaw, Codex app-server 및 기타 구성된 네이티브 런타임을
구분할 수 있습니다.

`allowAgents` 항목은 `agents.list[]`의 구성된 에이전트 id를 가리켜야 합니다.
`["*"]`는 구성된 모든 대상 에이전트와 요청자를 의미합니다. 에이전트 구성이
삭제되었지만 그 id가 `allowAgents`에 남아 있으면 `sessions_spawn`은 해당 id를
거부하고 `agents_list`는 이를 생략합니다. 오래된 허용 목록 항목을 정리하려면
`openclaw doctor --fix`를 실행하거나, 기본값을 상속하면서 대상이 계속 생성 가능해야 하는 경우
최소한의 `agents.list[]` 항목을 추가합니다.

### 자동 보관

- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 이후 자동으로 보관됩니다(기본값 `60`).
- 보관은 `sessions.delete`를 사용하며 트랜스크립트 이름을 `*.deleted.<timestamp>`로 변경합니다(같은 폴더).
- `cleanup: "delete"`는 알림 직후 보관합니다(이름 변경을 통해 트랜스크립트는 계속 유지).
- 자동 보관은 최선형입니다. Gateway가 다시 시작되면 대기 중인 타이머가 사라집니다.
- 구성된 실행 타임아웃은 자동 보관을 수행하지 **않습니다**. 실행만 중지합니다. 세션은 자동 보관될 때까지 유지됩니다.
- 자동 보관은 깊이 1 및 깊이 2 세션에 동일하게 적용됩니다.
- 브라우저 정리는 보관 정리와 별개입니다. 추적되는 브라우저 탭/프로세스는 트랜스크립트/세션 레코드가 유지되더라도 실행이 끝날 때 최선형으로 닫힙니다.

## 중첩 하위 에이전트

기본적으로 하위 에이전트는 자체 하위 에이전트를 생성할 수 없습니다
(`maxSpawnDepth: 1`). 한 단계 중첩을 활성화하려면 `maxSpawnDepth: 2`를 설정합니다.
즉 **오케스트레이터 패턴**입니다: 메인 → 오케스트레이터 하위 에이전트 →
작업자 하위-하위 에이전트.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 하위 에이전트가 자식을 생성하도록 허용(기본값: 1)
        maxChildrenPerAgent: 5, // 에이전트 세션당 최대 활성 자식 수(기본값: 5)
        maxConcurrent: 8, // 전역 동시 실행 레인 상한(기본값: 8)
        runTimeoutSeconds: 900, // sessions_spawn의 기본 타임아웃(0 = 타임아웃 없음)
        announceTimeoutMs: 120000, // 호출별 Gateway 알림 타임아웃
      },
    },
  },
}
```

### 깊이 수준

| 깊이 | 세션 키 형태                                | 역할                                          | 생성 가능 여부               |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 메인 에이전트                                 | 항상                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | 하위 에이전트(깊이 2가 허용되면 오케스트레이터) | `maxSpawnDepth >= 2`인 경우에만 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 하위-하위 에이전트(리프 작업자)               | 불가                         |

### 알림 체인

결과는 체인을 따라 위로 흐릅니다.

1. 깊이 2 워커가 완료됨 → 부모(깊이 1 오케스트레이터)에게 알립니다.
2. 깊이 1 오케스트레이터가 알림을 받고 결과를 종합한 뒤 완료됨 → 메인에 알립니다.
3. 메인 에이전트가 알림을 받고 사용자에게 전달합니다.

각 수준은 직접 자식의 알림만 봅니다.

<Note>
**운영 지침:** `sessions_list`, `sessions_history`, `/subagents list` 또는 `exec` sleep 명령을 중심으로 폴링 루프를 만들지 말고, 자식 작업을 한 번 시작한 뒤 완료 이벤트를 기다리세요.
`sessions_list`와 `/subagents list`는 자식 세션 관계를
진행 중인 작업에 집중하게 합니다. 진행 중인 자식은 계속 연결된 상태로 남고, 종료된 자식은 짧은 최근 창 동안 표시되며, 오래된 저장소 전용 자식 링크는
신선도 창이 지난 뒤 무시됩니다. 이렇게 하면 재시작 후 오래된 `spawnedBy` /
`parentSessionKey` 메타데이터가 유령 자식을 되살리는 것을 방지합니다. 이미 최종 답변을 보낸 뒤 자식 완료 이벤트가 도착하면, 올바른 후속 응답은 정확한 무음 토큰
`NO_REPLY` / `no_reply`입니다.
</Note>

### 깊이별 도구 정책

- 역할과 제어 범위는 생성 시점에 세션 메타데이터에 기록됩니다. 이렇게 하면 평면적이거나 복원된 세션 키가 실수로 오케스트레이터 권한을 다시 얻지 않습니다.
- **깊이 1(오케스트레이터, `maxSpawnDepth >= 2`일 때):** 자식을 생성하고 상태를 검사할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 다른 세션/시스템 도구는 계속 거부됩니다.
- **깊이 1(리프, `maxSpawnDepth == 1`일 때):** 세션 도구 없음(현재 기본 동작).
- **깊이 2(리프 워커):** 세션 도구 없음 — `sessions_spawn`은 깊이 2에서 항상 거부됩니다. 더 이상 자식을 생성할 수 없습니다.

### 에이전트별 생성 제한

각 에이전트 세션(모든 깊이)은 동시에 최대 `maxChildrenPerAgent`
(기본값 `5`)개의 활성 자식을 가질 수 있습니다. 이를 통해 단일 오케스트레이터에서 무제한으로 확산되는 것을 방지합니다.

### 연쇄 중지

깊이 1 오케스트레이터를 중지하면 모든 깊이 2 자식도 자동으로 중지됩니다.

- 메인 채팅의 `/stop`은 모든 깊이 1 에이전트를 중지하고 그들의 깊이 2 자식까지 연쇄적으로 중지합니다.

## 인증

하위 에이전트 인증은 세션 유형이 아니라 **에이전트 id**로 확인됩니다.

- 하위 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **폴백**으로 병합됩니다. 충돌 시 에이전트 프로필이 메인 프로필보다 우선합니다.

병합은 추가 방식이므로 메인 프로필은 항상 폴백으로 사용할 수 있습니다. 에이전트별로 완전히 격리된 인증은 아직 지원되지 않습니다.

## 알림

하위 에이전트는 알림 단계로 보고합니다.

- 알림 단계는 요청자 세션이 아니라 하위 에이전트 세션 안에서 실행됩니다.
- 하위 에이전트가 정확히 `ANNOUNCE_SKIP`으로 응답하면 아무것도 게시되지 않습니다.
- 최신 어시스턴트 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply`이면, 이전에 보이는 진행 상황이 있었더라도 알림 출력이 억제됩니다.

전달은 요청자 깊이에 따라 달라집니다.

- 최상위 요청자 세션은 외부 전달(`deliver=true`)을 사용한 후속 `agent` 호출을 사용합니다.
- 중첩된 요청자 하위 에이전트 세션은 내부 후속 주입(`deliver=false`)을 받으므로 오케스트레이터가 세션 안에서 자식 결과를 종합할 수 있습니다.
- 중첩된 요청자 하위 에이전트 세션이 사라진 경우, OpenClaw는 가능하면 해당 세션의 요청자로 폴백합니다.

최상위 요청자 세션의 경우, 완료 모드 직접 전달은 먼저 바인딩된 대화/스레드 라우트와 hook 오버라이드를 확인한 다음, 누락된 channel-target 필드를 요청자 세션에 저장된 라우트로 채웁니다.
이를 통해 완료 원본이 채널만 식별하더라도 완료가 올바른 채팅/주제에 유지됩니다.

중첩 완료 발견 항목을 만들 때 자식 완료 집계는 현재 요청자 실행으로 범위가 제한되어, 이전 실행의 오래된 자식 출력이 현재 알림으로 새어 들어가지 않습니다. 알림 응답은 채널 어댑터에서 사용할 수 있는 경우 스레드/주제 라우팅을 보존합니다.

### 알림 컨텍스트

알림 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다.

| 필드           | 출처                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 출처           | `subagent` 또는 `cron`                                                                                        |
| 세션 ids       | 자식 세션 키/id                                                                                               |
| 유형           | 알림 유형 + 작업 레이블                                                                                       |
| 상태           | 런타임 결과에서 파생됨(`success`, `error`, `timeout` 또는 `unknown`) — 모델 텍스트에서 추론하지 **않음**      |
| 결과 콘텐츠   | 자식의 최신 표시 가능한 어시스턴트 텍스트                                                                     |
| 후속 조치      | 언제 응답하고 언제 침묵을 유지할지 설명하는 지침                                                              |

터미널 실패 실행은 캡처된 응답 텍스트를 재생하지 않고 실패 상태를 보고합니다. Tool/toolResult 출력은 자식 결과 텍스트로 승격되지 않습니다.

### 통계 줄

알림 페이로드는 끝에 통계 줄을 포함합니다(줄바꿈으로 감싸진 경우에도).

- 런타임(예: `runtime 5m12s`).
- 토큰 사용량(input/output/total).
- 모델 가격이 구성된 경우 예상 비용(`models.providers.*.models[].cost`).
- 메인 에이전트가 `sessions_history`로 기록을 가져오거나 디스크의 파일을 검사할 수 있도록 `sessionKey`, `sessionId`, transcript 경로.

내부 메타데이터는 오케스트레이션 전용입니다. 사용자에게 보이는 응답은 일반적인 어시스턴트 어조로 다시 작성해야 합니다.

### `sessions_history`를 선호하는 이유

`sessions_history`는 더 안전한 오케스트레이션 경로입니다.

- 어시스턴트 회상이 먼저 정규화됩니다. thinking 태그가 제거되고, `<relevant-memories>` / `<relevant_memories>` 스캐폴딩이 제거되며, 일반 텍스트 도구 호출 XML 페이로드 블록(`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`)이 깔끔하게 닫히지 않은 잘린 페이로드를 포함해 제거됩니다. 다운그레이드된 도구 호출/결과 스캐폴딩과 과거 컨텍스트 마커가 제거되고, 유출된 모델 제어 토큰(`<|assistant|>`, 기타 ASCII `<|...|>`, 전각 `<｜...｜>`)이 제거되며, 잘못된 MiniMax 도구 호출 XML이 제거됩니다.
- 자격 증명/토큰처럼 보이는 텍스트가 수정됩니다.
- 긴 블록은 잘릴 수 있습니다.
- 매우 큰 기록은 오래된 행을 삭제하거나 지나치게 큰 행을 `[sessions_history omitted: message too large]`로 대체할 수 있습니다.
- 전체 바이트 단위 transcript가 필요할 때는 디스크상의 원시 transcript 검사가 폴백입니다.

## 도구 정책

하위 에이전트는 먼저 부모 또는 대상 에이전트와 동일한 프로필 및 도구 정책 파이프라인을 사용합니다. 그 후 OpenClaw가 하위 에이전트 제한 계층을 적용합니다.

제한적인 `tools.profile`이 없으면 하위 에이전트는 **메시지 도구, 세션 도구, 시스템 도구를 제외한 모든 도구**를 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`
- `message`

여기서도 `sessions_history`는 제한되고 정제된 회상 보기입니다. 원시 transcript 덤프가 아닙니다.

`maxSpawnDepth >= 2`이면 깊이 1 오케스트레이터 하위 에이전트는 자식을 관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다.

### 구성으로 오버라이드

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // deny wins
        deny: ["gateway", "cron"],
        // if allow is set, it becomes allow-only (deny still wins)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow`는 최종 allow-only 필터입니다. 이미 확인된 도구 집합을 좁힐 수는 있지만, `tools.profile`로 제거된 도구를 **다시 추가할 수는 없습니다**. 예를 들어 `tools.profile: "coding"`은 `web_search`/`web_fetch`를 포함하지만 `browser` 도구는 포함하지 않습니다. coding-profile 하위 에이전트가 브라우저 자동화를 사용하게 하려면 프로필 단계에서 browser를 추가하세요.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

하나의 에이전트만 브라우저 자동화를 받아야 하는 경우 에이전트별 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.

## 동시성

하위 에이전트는 전용 인프로세스 큐 레인을 사용합니다.

- **레인 이름:** `subagent`
- **동시성:** `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 활성 상태 및 복구

OpenClaw는 `endedAt`이 없다는 것을 하위 에이전트가 아직 살아 있다는 영구적인 증거로 취급하지 않습니다. 오래된 실행 창보다 오래된 종료되지 않은 실행은 `/subagents list`, 상태 요약, 하위 완료 게이팅, 세션별 동시성 검사에서 active/pending으로 계산되지 않습니다.

Gateway 재시작 후, 오래된 종료되지 않은 복원 실행은 해당 자식 세션이 `abortedLastRun: true`로 표시되어 있지 않으면 정리됩니다. 이러한 restart-aborted 자식 세션은 하위 에이전트 고아 복구 흐름을 통해 복구 가능하며, 이 흐름은 중단 마커를 지우기 전에 합성 재개 메시지를 보냅니다.

자동 재시작 복구는 자식 세션별로 제한됩니다. 같은 하위 에이전트 자식이 rapid re-wedge 창 안에서 반복적으로 고아 복구 대상으로 수락되면, OpenClaw는 해당 세션에 복구 tombstone을 영속화하고 이후 재시작 시 자동 재개를 중지합니다. 작업 레코드를 조정하려면
`openclaw tasks maintenance --apply`를 실행하거나, tombstoned 세션의 오래된 aborted 복구 플래그를 지우려면
`openclaw doctor --fix`를 실행하세요.

<Note>
하위 에이전트 생성이 Gateway `PAIRING_REQUIRED` /
`scope-upgrade`로 실패하면 pairing 상태를 편집하기 전에 RPC 호출자를 확인하세요.
내부 `sessions_spawn` 조정은 호출자가 이미 gateway 요청 컨텍스트 안에서 실행 중이면 프로세스 내에서 디스패치되므로 loopback WebSocket을 열거나 CLI의 paired-device scope 기준선에 의존하지 않습니다. Gateway 프로세스 밖의 호출자는 direct loopback shared-token/password auth를 통해 `client.id: "gateway-client"` 및 `client.mode: "backend"`로 WebSocket 폴백을 계속 사용합니다. 원격 호출자, 명시적 `deviceIdentity`, 명시적 device-token 경로, browser/node 클라이언트는 scope 업그레이드에 대해 여전히 일반적인 기기 승인이 필요합니다.
</Note>

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고, 해당 세션에서 생성된 모든 활성 하위 에이전트 실행이 중지되며, 중첩 자식까지 연쇄적으로 중지됩니다.

## 제한 사항

- 하위 에이전트 알림은 **최선 노력** 방식입니다. Gateway가 재시작되면 대기 중인 "announce back" 작업은 손실됩니다.
- 하위 에이전트는 여전히 같은 gateway 프로세스 리소스를 공유합니다. `maxConcurrent`를 안전 밸브로 취급하세요.
- `sessions_spawn`은 항상 비차단 방식입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트는 `AGENTS.md`와 `TOOLS.md`만 주입합니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md` 또는 `BOOTSTRAP.md` 없음). Codex 네이티브 하위 에이전트도 동일한 경계를 따릅니다. `TOOLS.md`는 상속된 Codex 스레드 지침에 남고, 부모 전용 persona, identity, user 파일은 턴 범위 협업 지침으로 주입되어 자식이 이를 복제하지 않습니다.
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 깊이 2가 권장됩니다.
- `maxChildrenPerAgent`는 세션별 활성 자식 수를 제한합니다(기본값 `5`, 범위 `1–20`).

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents)
- [에이전트 전송](/ko/tools/agent-send)
- [백그라운드 작업](/ko/automation/tasks)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
