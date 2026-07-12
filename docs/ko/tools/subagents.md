---
read_when:
    - 에이전트를 통한 백그라운드 또는 병렬 작업을 원합니다
    - sessions_spawn 또는 하위 에이전트 도구 정책을 변경하고 있습니다.
    - 스레드에 연결된 하위 에이전트 세션을 구현하거나 문제를 해결하고 있습니다
sidebarTitle: Sub-agents
summary: 요청자 채팅에 결과를 다시 알리는 격리된 백그라운드 에이전트 실행을 생성합니다
title: 하위 에이전트
x-i18n:
    generated_at: "2026-07-12T15:51:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d2293993ad99e2797f5cfbe13e964487f3bd0fa0a3114e78d25ce5862768b9ca
    source_path: tools/subagents.md
    workflow: 16
---

하위 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다.
각각 자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며,
완료되면 요청자 채팅 채널에 결과를 **알립니다**.
모든 하위 에이전트 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

목표:

- 기본 실행을 차단하지 않고 조사, 장기 작업, 느린 도구 작업을 병렬화합니다.
- 하위 에이전트를 기본적으로 격리합니다(세션 분리, 선택적 샌드박싱).
- 도구 표면을 오용하기 어렵게 유지합니다. 하위 에이전트에는 기본적으로 세션 또는 메시지 도구가 제공되지 **않습니다**.
- 오케스트레이터 패턴을 위한 구성 가능한 중첩 깊이를 지원합니다.

<Note>
**비용 참고:** 기본적으로 각 하위 에이전트에는 자체 컨텍스트와 토큰 사용량이
있습니다. 무겁거나 반복적인 작업의 경우
`agents.defaults.subagents.model` 또는 에이전트별 재정의를 통해 하위 에이전트에는
더 저렴한 모델을 설정하고 기본 에이전트에는 더 품질이 높은 모델을
유지하십시오. 자식 에이전트에 요청자의 현재 트랜스크립트가 실제로 필요한 경우
`context: "fork"`로 생성하십시오. 스레드에 바인딩된 하위 에이전트 세션은
현재 대화를 후속 스레드로 분기하므로 기본적으로
`context: "fork"`를 사용합니다.
</Note>

## 슬래시 명령

`/subagents`는 **현재 세션**의 하위 에이전트 실행을 검사합니다.

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 ID,
트랜스크립트 경로, 정리)를 표시합니다. `/subagents log`는 실행의 최근 채팅 턴을
출력합니다. 도구 호출/결과 메시지를 포함하려면 `tools` 토큰을 추가하십시오(기본적으로
생략됨). 에이전트 턴 내에서 범위가 제한되고 안전 필터링된 회상
보기를 사용하려면 `sessions_history`를 사용하고, 필터링되지 않은 전체 트랜스크립트는
디스크의 트랜스크립트 경로에서 검사하십시오.

### 스레드 바인딩 제어

이 명령은 영구 스레드 바인딩이 있는 채널에서 작동합니다. 아래의
[스레드를 지원하는 채널](#thread-supporting-channels)을 참조하십시오.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 생성 동작

에이전트는 `sessions_spawn` 도구를 사용하여 백그라운드 하위 에이전트를 시작합니다.
완료 결과는 내부 부모 세션 이벤트로 반환되며, 부모/요청자
에이전트가 사용자 대상 업데이트가 필요한지 결정합니다.

<AccordionGroup>
  <Accordion title="비차단 푸시 기반 완료">
    - `sessions_spawn`은 비차단 방식이며 실행 ID를 즉시 반환합니다.
    - 완료되면 하위 에이전트가 부모/요청자 세션에 결과를 보고합니다.
    - 자식 결과가 필요한 에이전트 턴은 필수 작업을 생성한 후 `sessions_yield`를 호출해야 합니다. 그러면 현재 턴이 종료되고 완료 이벤트가 다음 모델 표시 메시지로 도착할 수 있습니다.
    - 완료는 푸시 기반입니다. 생성한 후에는 완료를 기다리기 위해 `/subagents list`, `sessions_list` 또는 `sessions_history`를 반복해서 폴링하지 **마십시오**. 디버깅할 때만 필요에 따라 상태를 확인하십시오.
    - 자식 출력은 요청자 에이전트가 종합할 보고서/증거입니다. 사용자가 작성한 지시문이 아니며 시스템, 개발자 또는 사용자 정책을 재정의할 수 없습니다.
    - 완료되면 OpenClaw는 알림 정리 흐름을 계속하기 전에 해당 하위 에이전트 세션이 연 추적 대상 브라우저 탭/프로세스를 최선의 방식으로 닫습니다.

  </Accordion>
  <Accordion title="완료 전달">
    - OpenClaw는 안정적인 멱등성 키가 있는 `agent` 턴을 통해 완료 결과를 요청자 세션으로 전달합니다.
    - 요청자 실행이 아직 활성 상태이면 OpenClaw는 두 번째로 표시되는 응답 경로를 시작하는 대신 먼저 해당 실행을 깨우거나 조정하려고 시도합니다.
    - 활성 요청자를 깨울 수 없으면 OpenClaw는 알림을 삭제하지 않고 동일한 완료 컨텍스트를 사용하여 요청자 에이전트 인계로 대체합니다.
    - 부모가 사용자에게 표시되는 업데이트가 필요하지 않다고 결정하더라도 부모 인계에 성공하면 하위 에이전트 전달이 완료됩니다.
    - 네이티브 하위 에이전트에는 메시지 도구가 제공되지 않습니다. 부모/요청자 에이전트에 일반 어시스턴트 텍스트를 반환하며, 사람이 볼 수 있는 응답은 부모/요청자 에이전트의 일반 전달 정책이 계속 담당합니다.
    - 직접 인계를 사용할 수 없으면 전달은 큐 라우팅으로 대체되고, 그다음 최종 포기 전에 짧은 지수 백오프 방식으로 알림을 재시도합니다.
    - 전달은 확인된 요청자 경로를 유지합니다. 스레드 바인딩 또는 대화 바인딩 완료 경로를 사용할 수 있으면 해당 경로가 우선합니다. 완료 출처가 채널만 제공하는 경우 OpenClaw는 요청자 세션의 확인된 경로(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 대상/계정을 채워 직접 전달이 계속 작동하도록 합니다.

  </Accordion>
  <Accordion title="완료 인계 메타데이터">
    요청자 세션으로 전달되는 완료 인계는 런타임에서 생성된
    내부 컨텍스트(사용자가 작성한 텍스트가 아님)이며 다음을 포함합니다.

    - `Result` — 자식의 최신 표시 가능 `assistant` 응답 텍스트입니다. tool/toolResult 출력은 자식 결과로 승격되지 않습니다. 최종적으로 실패한 실행은 캡처된 응답 텍스트를 재사용하지 않습니다.
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`.
    - 간결한 런타임/토큰 통계.
    - 원래 작업의 완료 여부를 결정하기 전에 요청자 에이전트가 결과를 검증하도록 지시하는 검토 안내.
    - 자식 결과에 추가 작업이 남아 있을 때 요청자 에이전트가 작업을 계속하거나 후속 작업을 기록하도록 지시하는 후속 안내.
    - 추가 작업이 없는 경로를 위한 최종 업데이트 지시로, 원시 내부 메타데이터를 전달하지 않고 일반적인 어시스턴트 문체로 작성됩니다.

  </Accordion>
  <Accordion title="모드와 ACP 런타임">
    - `--model`과 `--thinking`은 해당 특정 실행의 기본값을 재정의합니다.
    - 완료 후 세부 정보와 출력을 검사하려면 `info`/`log`를 사용하십시오.
    - 영구 스레드 바인딩 세션의 경우 `thread: true` 및 `mode: "session"`과 함께 `sessions_spawn`을 사용하십시오.
    - 요청자 채널이 스레드 바인딩을 지원하지 않으면 불가능한 스레드 바인딩 조합을 재시도하지 말고 `mode: "run"`을 사용하십시오.
    - ACP 하네스 세션(Claude Code, Gemini CLI, OpenCode 또는 명시적인 Codex ACP/acpx)의 경우 도구가 해당 런타임을 제공하면 `runtime: "acp"`와 함께 `sessions_spawn`을 사용하십시오. 완료 또는 에이전트 간 루프를 디버깅할 때는 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참조하십시오. `codex` Plugin이 활성화된 경우 사용자가 ACP/acpx를 명시적으로 요청하지 않는 한 Codex 채팅/스레드 제어에서는 ACP보다 `/codex ...`를 우선해야 합니다.
    - OpenClaw는 ACP가 활성화되고 요청자가 샌드박스 처리되지 않았으며 `acpx`와 같은 백엔드 Plugin이 로드될 때까지 `runtime: "acp"`를 숨깁니다. `runtime: "acp"`에는 외부 ACP 하네스 ID 또는 `runtime.type="acp"`인 `agents.list[]` 항목이 필요합니다. `agents_list`의 일반 OpenClaw 구성 에이전트에는 기본 하위 에이전트 런타임을 사용하십시오.

  </Accordion>
</AccordionGroup>

## 컨텍스트 모드

네이티브 하위 에이전트는 호출자가 현재 트랜스크립트의 포크를 명시적으로 요청하지 않는 한
격리된 상태로 시작합니다.

| 모드       | 사용 시점                                                                                                                         | 동작                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 새로운 조사, 독립적 구현, 느린 도구 작업 또는 작업 텍스트로 간략히 설명할 수 있는 모든 작업                           | 깨끗한 자식 트랜스크립트를 생성합니다. 기본값이며 토큰 사용량을 낮게 유지합니다.  |
| `fork`     | 현재 대화, 이전 도구 결과 또는 요청자 트랜스크립트에 이미 있는 미묘한 지침에 의존하는 작업 | 자식이 시작되기 전에 요청자 트랜스크립트를 자식 세션으로 분기합니다. |

`fork`는 제한적으로 사용하십시오. 이는 컨텍스트에 민감한 위임을 위한 것이며,
명확한 작업 프롬프트 작성을 대체하지 않습니다.

## 도구: `sessions_spawn`

전역 `subagent` 레인에서 `deliver: false`로 하위 에이전트 실행을 시작한 다음,
알림 단계를 실행하고 알림 응답을 요청자
채팅 채널에 게시합니다.

사용 가능 여부는 호출자의 유효 도구 정책에 따라 달라집니다. 기본 제공
`coding` 프로필에는 `sessions_spawn`이 포함되지만 `messaging`과 `minimal`에는
포함되지 않습니다. `full`은 모든 도구를 허용합니다. 더 제한적인 프로필을 사용하지만
작업을 위임해야 하는 에이전트에는 `tools.alsoAllow: ["sessions_spawn",
"sessions_yield", "subagents"]`를 추가하거나 `tools.profile: "coding"`을
사용하십시오.
채널/그룹, 제공자, 샌드박스 및 에이전트별 허용/거부 정책은
프로필 단계 후에도 도구를 제거할 수 있습니다. 유효 도구 목록을 확인하려면 동일한
세션에서 `/tools`를 사용하십시오.

**기본값:**

- **모델:** `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않으면 네이티브 하위 에이전트는 호출자의 모델을 상속합니다. ACP 런타임 생성은 구성된 하위 에이전트 모델이 있으면 동일한 모델을 사용하고, 그렇지 않으면 ACP 하네스가 자체 기본값을 유지합니다. 명시적인 `sessions_spawn.model`이 항상 우선합니다.
- **추론:** `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않으면 네이티브 하위 에이전트는 호출자의 설정을 상속합니다. ACP 런타임 생성에도 선택한 모델의 `agents.defaults.models["provider/model"].params.thinking`이 적용됩니다. 명시적인 `sessions_spawn.thinking`이 항상 우선합니다.
- **실행 시간 제한:** `agents.defaults.subagents.runTimeoutSeconds`가 설정되어 있으면 OpenClaw가 이를 사용하고, 그렇지 않으면 `0`(시간 제한 없음)으로 대체합니다. `sessions_spawn`은 호출별 시간 제한 재정의를 허용하지 않습니다.
- **작업 전달:** 네이티브 하위 에이전트는 첫 번째 표시 가능 `[Subagent Task]` 메시지에서 위임된 작업을 받습니다. 하위 에이전트 시스템 프롬프트에는 런타임 규칙과 라우팅 컨텍스트가 포함되며, 숨겨진 작업 사본은 포함되지 않습니다.

허용된 네이티브 하위 에이전트 생성은 도구 결과에 확인된 자식 모델 메타데이터를
포함합니다. `resolvedModel`에는 적용된 모델 참조가 포함되고,
참조에 제공자 접두사가 있는 경우 `resolvedProvider`에는 해당 제공자 접두사가 포함됩니다.

### 위임 프롬프트 모드

`agents.defaults.subagents.delegationMode`는 프롬프트 안내만 제어하며, 도구 정책을 변경하거나 위임을 강제하지 않습니다.

- `suggest`(기본값): 더 크거나 느린 작업에 하위 에이전트를 사용하도록 권장하는 표준 프롬프트 안내를 유지합니다.
- `prefer`: 기본 에이전트가 신속하게 응답을 유지하고 직접 응답보다 복잡한 모든 작업을 `sessions_spawn`을 통해 위임하도록 지시합니다.

에이전트별 재정의: `agents.list[].subagents.delegationMode`.

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
  이후 상태 출력에서 특정 하위 항목을 식별하기 위한 선택적이고 안정적인 핸들입니다. `[a-z][a-z0-9_-]{0,63}`과 일치해야 하며 `last` 또는 `all` 같은 예약 대상을 사용할 수 없습니다.
</ParamField>
<ParamField path="label" type="string">
  사람이 읽을 수 있는 선택적 레이블입니다.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents`에서 허용하는 경우 구성된 다른 에이전트 ID 아래에서 생성합니다.
</ParamField>
<ParamField path="cwd" type="string">
  하위 실행의 선택적 작업 디렉터리입니다. 네이티브 하위 에이전트는 여전히 대상 에이전트 워크스페이스에서 부트스트랩 파일을 로드하며, `cwd`는 런타임 도구와 CLI 하네스가 위임된 작업을 수행하는 위치만 변경합니다.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp`는 외부 ACP 하네스(`claude`, `droid`, `gemini`, `opencode` 또는 명시적으로 요청된 Codex ACP/acpx)와 `runtime.type`이 `acp`인 `agents.list[]` 항목에만 사용합니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 전용입니다. `runtime: "acp"`일 때 기존 ACP 하네스 세션을 재개하며, 네이티브 하위 에이전트 생성에서는 무시됩니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 전용입니다. `runtime: "acp"`일 때 ACP 실행 출력을 상위 세션으로 스트리밍하며, 네이티브 하위 에이전트 생성에서는 생략합니다.
</ParamField>
<ParamField path="model" type="string">
  하위 에이전트 모델을 재정의합니다. 유효하지 않은 값은 건너뛰며, 하위 에이전트는 도구 결과에 경고를 표시하고 기본 모델로 실행됩니다.
</ParamField>
<ParamField path="thinking" type="string">
  하위 에이전트 실행의 사고 수준을 재정의합니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true`이면 이 하위 에이전트 세션에 채널 스레드 바인딩을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true`이고 `mode`를 생략하면 기본값이 `session`으로 변경됩니다. `mode: "session"`에는 `thread: true`가 필요합니다.
  요청자 채널에서 스레드 바인딩을 사용할 수 없으면 대신 `mode: "run"`을 사용하십시오.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`는 알림 직후 세션을 보관 처리합니다(이름 변경을 통해 트랜스크립트는 계속 보존합니다).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`는 대상 하위 런타임이 샌드박스에서 실행되지 않으면 생성을 거부합니다.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`는 요청자의 현재 트랜스크립트를 하위 세션으로 분기합니다. 네이티브 하위 에이전트 전용입니다. 스레드에 바인딩된 생성은 기본적으로 `fork`를 사용하고, 스레드가 아닌 생성은 기본적으로 `isolated`를 사용합니다.
</ParamField>

<Warning>
`sessions_spawn`은 채널 전송 매개변수(`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`)를 **허용하지 않습니다**. 네이티브 하위 에이전트는
최신 어시스턴트 턴을 요청자에게 다시 보고하며, 외부 전송은
상위/요청자 에이전트가 계속 담당합니다.
</Warning>

### 작업 이름 및 대상 지정

`taskName`은 오케스트레이션을 위한 모델 대상 핸들이며 세션 키가 아닙니다.
코디네이터가 나중에 해당 하위 항목을 검사해야 할 수 있는 경우 `review_subagents`,
`linux_validation` 또는 `docs_update`와 같은 안정적인 하위 이름에 사용하십시오.

대상 해석은 정확히 일치하는 `taskName` 및 모호하지 않은
접두사를 허용합니다. 일치는 번호가 지정된 `/subagents` 대상이 사용하는 것과 동일한
활성/최근 대상 기간으로 제한되므로, 오래전에 완료된 하위 항목 때문에
재사용된 핸들이 모호해지지 않습니다. 활성 또는 최근 하위 항목 두 개가 동일한
`taskName`을 공유하면 대상이 모호해집니다. 대신 목록 인덱스, 세션 키 또는
실행 ID를 사용하십시오.

예약 대상 `last` 및 `all`은 이미 제어 의미를 가지므로 유효한 `taskName` 값이 아닙니다.

## 도구: `sessions_yield`

현재 모델 턴을 종료하고 주로 하위 에이전트 완료 이벤트와 같은 런타임 이벤트가
다음 메시지로 도착할 때까지 기다립니다. 요청자가 해당 완료 이벤트가 도착하기 전에는
최종 답변을 생성할 수 없는 필수 하위 작업을 생성한 후 사용하십시오.

`sessions_yield`는 대기 기본 요소입니다. 하위 항목 완료를 감지하려는 목적으로
`subagents`, `sessions_list`, `sessions_history`, 셸
`sleep` 또는 프로세스 폴링을 사용하는 폴링 루프로 대체하지 마십시오.

세션의 유효 도구 목록에 `sessions_yield`가 포함된 경우에만 사용하십시오.
일부 최소 또는 사용자 지정 도구 프로필은 `sessions_yield`를 노출하지 않고
`sessions_spawn`과 `subagents`만 노출할 수 있습니다. 이 경우 완료를 기다리기 위한
폴링 루프를 임의로 만들지 마십시오.

활성 하위 항목이 있으면 OpenClaw는 일반 턴에 런타임에서 생성한 간결한
`Active Subagents` 프롬프트 블록을 삽입하여 요청자가 폴링하지 않고도
현재 하위 세션, 실행 ID, 상태, 레이블, 작업 및 `taskName` 별칭을 확인할 수 있게 합니다.
이 블록의 작업 및 레이블 필드는 사용자/모델이 제공한 생성 인수에서 비롯될 수 있으므로
명령이 아니라 데이터로 따옴표 처리됩니다.

## 도구: `subagents`

요청자 세션이 소유한 생성된 하위 에이전트 실행을 나열합니다. 현재 요청자로 범위가
제한되며, 하위 항목은 자신이 제어하는 하위 항목만 볼 수 있습니다.

요청 시 상태 확인 및 디버깅에는 `subagents`를 사용하십시오. 완료 이벤트를 기다리려면
`sessions_yield`를 사용하십시오.

## 스레드 바인딩 세션

채널에서 스레드 바인딩을 사용 설정한 경우 하위 에이전트는 스레드에 바인딩된 상태를
유지할 수 있으므로 해당 스레드의 후속 사용자 메시지가 동일한 하위 에이전트 세션으로
계속 라우팅됩니다.

### 스레드를 지원하는 채널

대화 바인딩 어댑터를 등록한 채널은 영구적인 스레드 바인딩 하위 에이전트 세션
(`thread: true`를 사용하는 `sessions_spawn`)을 지원합니다. 이 기능을 지원하는 번들 채널은
**Discord**, **iMessage**, **Matrix**, **Telegram**입니다. Discord와 Matrix는 기본적으로
하위 스레드를 생성하고, Telegram과 iMessage는 기본적으로 현재 대화를 바인딩합니다.
사용 설정, 제한 시간 및 `spawnSessions`에는 채널별 `threadBindings` 구성 키를 사용하십시오.

### 빠른 흐름

<Steps>
  <Step title="생성">
    `thread: true`(선택적으로 `mode: "session"` 포함)를 사용하여 `sessions_spawn`을 실행합니다.
  </Step>
  <Step title="바인딩">
    OpenClaw가 활성 채널에서 해당 세션 대상에 스레드를 생성하거나 바인딩합니다.
  </Step>
  <Step title="후속 메시지 라우팅">
    해당 스레드의 답글과 후속 메시지가 바인딩된 세션으로 라우팅됩니다.
  </Step>
  <Step title="제한 시간 검사">
    `/session idle`을 사용하여 비활성 자동 포커스 해제를 검사/업데이트하고
    `/session max-age`를 사용하여 최대 한도를 제어합니다.
  </Step>
  <Step title="분리">
    `/unfocus`를 사용하여 수동으로 분리합니다.
  </Step>
</Steps>

### 수동 제어

| 명령               | 효과                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `/focus <target>`  | 현재 스레드를 하위 에이전트/세션 대상에 바인딩합니다(또는 스레드를 생성합니다).           |
| `/unfocus`         | 현재 바인딩된 스레드의 바인딩을 제거합니다.                                               |
| `/agents`          | 활성 실행 및 바인딩 상태(`binding:<id>`, `unbound` 또는 `bindings unavailable`)를 나열합니다. |
| `/session idle`    | 유휴 자동 포커스 해제를 검사/업데이트합니다(포커스된 바인딩 스레드만 해당).               |
| `/session max-age` | 최대 한도를 검사/업데이트합니다(포커스된 바인딩 스레드만 해당).                           |

### 구성 스위치

- **전역 기본값:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **채널 재정의 및 생성 자동 바인딩 키**는 어댑터별로 다릅니다. 위의 [스레드를 지원하는 채널](#thread-supporting-channels)을 참조하십시오.

현재 어댑터 세부 정보는 [구성 참조](/ko/gateway/configuration-reference) 및
[슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

### 허용 목록

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  명시적 `agentId`를 통해 대상으로 지정할 수 있는 구성된 에이전트 ID 목록입니다(`["*"]`는 구성된 모든 대상을 허용합니다). 기본값은 요청자 에이전트만입니다. 목록을 설정하고 요청자가 `agentId`를 사용하여 자신을 생성할 수 있게 하려면 목록에 요청자 ID를 포함하십시오.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않은 경우 사용하는 기본 구성 대상 에이전트 허용 목록입니다.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택을 강제합니다). 에이전트별 재정의: `agents.list[].subagents.requireAgentId`.
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` 알림 전송 시도에 대한 호출별 제한 시간입니다. 값은 양의 정수 밀리초이며 플랫폼에서 안전한 타이머 최댓값으로 제한됩니다. 일시적 재시도로 인해 총 알림 대기 시간이 구성된 제한 시간 한 번보다 길어질 수 있습니다.
</ParamField>

요청자 세션이 샌드박스에서 실행 중이면 `sessions_spawn`은 샌드박스 없이
실행되는 대상을 거부합니다.

### 검색

현재 `sessions_spawn`에 허용된 에이전트 ID를 확인하려면 `agents_list`를 사용하십시오.
응답에는 나열된 각 에이전트의 유효 모델과 내장 런타임 메타데이터가 포함되므로
호출자가 OpenClaw, Codex 앱 서버 및 기타 구성된 네이티브 런타임을 구분할 수 있습니다.

`allowAgents` 항목은 `agents.list[]`에 구성된 에이전트 ID를 가리켜야 합니다.
`["*"]`는 구성된 모든 대상 에이전트와 요청자를 의미합니다. 에이전트 구성이
삭제되었지만 해당 ID가 `allowAgents`에 남아 있으면 `sessions_spawn`은 해당 ID를
거부하고 `agents_list`는 이를 생략합니다. 오래된 허용 목록 항목을 정리하려면
`openclaw doctor --fix`를 실행하십시오. 대상이 기본값을 상속하면서 계속 생성 가능해야
하는 경우 최소한의 `agents.list[]` 항목을 추가하십시오.

### 자동 보관

- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 후에 자동으로 보관 처리됩니다(기본값 `60`).
- 보관은 `sessions.delete`를 사용하며 트랜스크립트 이름을 `*.deleted.<timestamp>`로 변경합니다(동일한 폴더).
- `cleanup: "delete"`는 알림 직후 보관 처리합니다(이름 변경을 통해 트랜스크립트는 계속 보존합니다).
- 자동 보관은 최선형 처리입니다. Gateway가 다시 시작되면 대기 중인 타이머가 손실됩니다.
- 구성된 실행 제한 시간은 자동 보관을 수행하지 **않습니다**. 실행만 중지하며, 세션은 자동 보관될 때까지 유지됩니다.
- 자동 보관은 깊이 1 및 깊이 2 세션에 동일하게 적용됩니다.
- 브라우저 정리는 보관 정리와 별개입니다. 트랜스크립트/세션 레코드가 유지되더라도 실행이 완료되면 추적 중인 브라우저 탭/프로세스를 최선형으로 닫습니다.

## 중첩된 하위 에이전트

기본적으로 하위 에이전트는 자체 하위 에이전트를 생성할 수 없습니다
(`maxSpawnDepth: 1`). 한 단계의 중첩을 사용 설정하려면 `maxSpawnDepth: 2`로 설정하십시오.
이를 **오케스트레이터 패턴**이라고 합니다. 기본 → 오케스트레이터 하위 에이전트 →
작업자 하위-하위 에이전트입니다.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 하위 에이전트가 하위 항목을 생성하도록 허용합니다(기본값: 1, 범위 1-5).
        maxChildrenPerAgent: 5, // 에이전트 세션당 최대 활성 하위 항목 수입니다(기본값: 5, 범위 1-20).
        maxConcurrent: 8, // 전역 동시 실행 레인 한도입니다(기본값: 8).
        runTimeoutSeconds: 900, // sessions_spawn의 기본 제한 시간입니다(0 = 제한 시간 없음).
        announceTimeoutMs: 120000, // 호출별 Gateway 알림 제한 시간입니다.
      },
    },
  },
}
```

### 깊이 수준

| 깊이 | 세션 키 형식                                  | 역할                                                | 생성 가능 여부                  |
| ----- | -------------------------------------------- | --------------------------------------------------- | -------------------------------- |
| 0     | `agent:<id>:main`                            | 메인 에이전트                                       | 항상                             |
| 1     | `agent:<id>:subagent:<uuid>`                 | 하위 에이전트(깊이 2가 허용되면 오케스트레이터)     | `maxSpawnDepth >= 2`인 경우에만 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 하위-하위 에이전트(리프 워커)                       | 불가능                           |

### 알림 체인

결과는 체인을 따라 상위로 전달됩니다.

1. 깊이 2 워커가 완료되면 → 부모(깊이 1 오케스트레이터)에게 알립니다.
2. 깊이 1 오케스트레이터가 알림을 수신하고 결과를 종합한 후 완료되면 → 메인에 알립니다.
3. 메인 에이전트가 알림을 수신하고 사용자에게 전달합니다.

각 수준에서는 직계 자식의 알림만 확인할 수 있습니다.

<Note>
**운영 지침:** 자식 작업은 한 번만 시작하고 완료 이벤트를 기다리십시오.
`sessions_list`, `sessions_history`, `/subagents list` 또는 `exec` 절전 명령을
중심으로 폴링 루프를 구성하지 마십시오. `sessions_list`와 `/subagents list`는
자식 세션 관계가 진행 중인 작업에 집중되도록 유지합니다. 활성 자식은 연결된
상태를 유지하고, 종료된 자식은 최근의 짧은 기간 동안 표시되며, 저장소에만 남은
오래된 자식 링크는 최신 상태 유지 기간이 지나면 무시됩니다. 이렇게 하면 재시작
후 오래된 `spawnedBy` / `parentSessionKey` 메타데이터가 유령 자식을 되살리는 것을
방지합니다. 최종 답변을 이미 보낸 후 자식 완료 이벤트가 도착하면 정확한 무응답
토큰 `NO_REPLY` / `no_reply`로 후속 처리해야 합니다.
</Note>

### 깊이별 도구 정책

- 역할과 제어 범위는 생성 시 세션 메타데이터에 기록됩니다. 이를 통해 평면화되거나 복원된 세션 키가 실수로 오케스트레이터 권한을 다시 얻지 못하게 합니다.
- **깊이 1(오케스트레이터, `maxSpawnDepth >= 2`인 경우):** 자식을 생성하고 상태를 확인할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 그 밖의 세션/시스템 도구는 계속 거부됩니다.
- **깊이 1(리프, `maxSpawnDepth == 1`인 경우):** 세션 도구가 없습니다(현재 기본 동작).
- **깊이 2(리프 워커):** 세션 도구가 없습니다. 깊이 2에서는 `sessions_spawn`이 항상 거부됩니다. 자식을 더 생성할 수 없습니다.

### 에이전트별 생성 제한

각 에이전트 세션은 깊이에 관계없이 한 번에 최대 `maxChildrenPerAgent`
(기본값 `5`)개의 활성 자식을 가질 수 있습니다. 이를 통해 단일
오케스트레이터에서 무제한으로 분기되는 것을 방지합니다.

### 연쇄 중지

깊이 1 오케스트레이터를 중지하면 해당 오케스트레이터의 모든 깊이 2
자식이 자동으로 중지됩니다.

- 메인 채팅의 `/stop`은 모든 깊이 1 에이전트를 중지하고 해당 에이전트의 깊이 2 자식까지 연쇄적으로 중지합니다.

## 인증

하위 에이전트 인증은 세션 유형이 아니라 **에이전트 ID**를 기준으로 확인됩니다.

- 하위 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **폴백**으로 병합됩니다. 충돌하는 경우 에이전트 프로필이 메인 프로필보다 우선합니다.

병합은 추가 방식이므로 메인 프로필은 항상 폴백으로 사용할 수
있습니다. 에이전트별로 완전히 격리된 인증은 아직 지원되지 않습니다.

## 알림

하위 에이전트는 알림 단계를 통해 결과를 보고합니다.

- 알림 단계는 요청자 세션이 아닌 하위 에이전트 세션 내에서 실행됩니다.
- 하위 에이전트가 정확히 `ANNOUNCE_SKIP`으로 응답하면 아무것도 게시되지 않습니다.
- 최신 어시스턴트 텍스트가 정확한 무응답 토큰 `NO_REPLY` / `no_reply`이면 이전에 표시된 진행 상황이 있더라도 알림 출력이 억제됩니다.

전달 방식은 요청자의 깊이에 따라 달라집니다.

- 최상위 요청자 세션에서는 외부 전달(`deliver=true`)을 사용하는 후속 `agent` 호출을 사용합니다.
- 중첩된 요청자 하위 에이전트 세션은 내부 후속 주입(`deliver=false`)을 수신하므로 오케스트레이터가 세션 내에서 자식 결과를 종합할 수 있습니다.
- 중첩된 요청자 하위 에이전트 세션이 사라진 경우 OpenClaw는 가능하면 해당 세션의 요청자로 폴백합니다.

최상위 요청자 세션의 경우 완료 모드 직접 전달은 먼저 바인딩된
대화/스레드 경로와 훅 재정의를 확인한 다음, 요청자 세션에 저장된 경로에서
누락된 채널 대상 필드를 채웁니다. 따라서 완료 출처가 채널만 식별하더라도
완료 결과가 올바른 채팅/토픽에 유지됩니다.

중첩된 완료 결과를 구성할 때 자식 완료 집계 범위는 현재 요청자 실행으로
제한되므로, 이전 실행의 오래된 자식 출력이 현재 알림에 유입되지 않습니다.
알림 응답은 채널 어댑터에서 사용할 수 있는 경우 스레드/토픽 라우팅을
유지합니다.

### 알림 컨텍스트

알림 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다.

| 필드           | 출처                                                                                                            |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| 출처           | `subagent` 또는 `cron`                                                                                          |
| 세션 ID        | 자식 세션 키/ID                                                                                                |
| 유형           | 알림 유형 + 작업 레이블                                                                                        |
| 상태           | 런타임 결과에서 파생됨(`ok`, `error`, `timeout` 또는 `unknown`). 모델 텍스트에서 **추론하지 않음**             |
| 결과 내용      | 자식의 최신 표시 가능 어시스턴트 텍스트                                                                        |
| 후속 처리      | 응답해야 하는 경우와 응답하지 않아야 하는 경우를 설명하는 지침                                                 |

실패로 종료된 실행은 캡처된 응답 텍스트를 재생하지 않고 실패 상태를
보고합니다. 도구/도구 결과 출력은 자식 결과 텍스트로 승격되지 않습니다.

### 통계 줄

알림 페이로드는 래핑된 경우에도 끝에 통계 줄을 포함합니다.

- 런타임(예: `runtime 5m12s`).
- 토큰 사용량(입력/출력/합계).
- 모델 가격이 구성된 경우의 예상 비용(`models.providers.*.models[].cost`).
- 메인 에이전트가 `sessions_history`를 통해 기록을 가져오거나 디스크의 파일을 검사할 수 있도록 `sessionKey`, `sessionId`, 대화 기록 경로가 포함됩니다.

내부 메타데이터는 오케스트레이션 전용입니다. 사용자 대상 응답은
일반적인 어시스턴트 어조로 다시 작성해야 합니다.

### `sessions_history`를 선호하는 이유

`sessions_history`는 에이전트 턴 내에서 자식의 대화 기록을 읽는 더 안전한
오케스트레이션 경로입니다.

- 범용 로그 삭제가 비활성화되어 있더라도 자격 증명/토큰과 유사한 텍스트를 삭제합니다.
- 긴 텍스트 블록을 블록당 4000자로 잘라내고 사고 서명, 추론 재생 페이로드, 인라인 이미지 데이터를 제거합니다.
- 80 KB 응답 상한을 적용하며, 지나치게 큰 행은 `[sessions_history omitted: message too large]`로 대체됩니다.
- 이전 대화 기록 창을 역방향으로 페이지 이동하려면 `nextOffset`이 있는 경우 이를 사용하십시오.
- `sessions_history`는 메시지 텍스트에서 추론 태그, `<relevant-memories>` 스캐폴딩 또는 도구 호출 XML을 제거하지 **않습니다**. 삭제되고 크기가 제한될 뿐, 원시 대화 기록 형식에 가까운 구조화된 콘텐츠 블록을 반환합니다. `/subagents log`는 구조화된 블록이 아닌 일반 채팅 줄을 렌더링하므로 더 강력한 산문 정리 도구를 적용합니다(추론 태그, 메모리 스캐폴딩, 도구 호출 XML 제거).
- 완전한 바이트 단위 대화 기록이 필요한 경우 디스크의 원시 대화 기록을 검사하는 것이 폴백입니다.

## 도구 정책

하위 에이전트에는 먼저 부모 또는 대상 에이전트와 동일한 프로필 및 도구 정책
파이프라인이 적용됩니다. 그 이후 OpenClaw가 하위 에이전트 제한 계층을
적용합니다.

하위 에이전트는 깊이나 역할에 관계없이 항상 `gateway`, `agents_list`,
`session_status`, `cron`을 사용할 수 없습니다. 이러한 도구는 시스템 수준/
대화형 도구이거나 메인 에이전트가 조정해야 하는 도구입니다. 리프 하위
에이전트(기본 깊이 1 동작 및 항상 깊이 2)는 추가로 `subagents`,
`sessions_list`, `sessions_history`, `sessions_spawn`을 사용할 수 없습니다.
하위 에이전트는 `message` 도구를 절대 받지 않습니다. 이 도구는 이 거부
목록으로 필터링되는 것이 아니라 생성 시 비활성화됩니다. 또한 `sessions_send`는
계속 거부되므로 하위 에이전트는 알림 체인을 통해서만 통신합니다.

여기에서도 `sessions_history`는 범위가 제한되고 정리된 조회 보기로 유지되며
원시 대화 기록 덤프가 아닙니다.

`maxSpawnDepth >= 2`인 경우 깊이 1 오케스트레이터 하위 에이전트는 자식을
관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`,
`sessions_history`를 받습니다.

### 구성을 통한 재정의

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
        // 거부가 우선합니다
        deny: ["gateway", "cron"],
        // allow가 설정되면 허용 전용 목록이 됩니다(거부는 여전히 우선합니다)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow`는 최종 허용 전용 필터입니다. 이미 확인된 도구
집합을 좁힐 수 있지만 `tools.profile`에서 제거된 도구를 **다시 추가**할 수는
없습니다. 예를 들어 `tools.profile: "coding"`에는 `web_search`/`web_fetch`가
포함되지만 `browser` 도구는 포함되지 않습니다. 코딩 프로필 하위 에이전트가
브라우저 자동화를 사용하도록 하려면 프로필 단계에서 browser를 추가하십시오.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

하나의 에이전트만 브라우저 자동화를 사용해야 하는 경우 에이전트별
`agents.list[].tools.alsoAllow: ["browser"]`를 사용하십시오.

## 동시성

하위 에이전트는 전용 인프로세스 큐 레인을 사용합니다.

- **레인 이름:** `subagent`
- **동시성:** `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 활성 상태 및 복구

OpenClaw는 `endedAt`이 없다는 사실을 하위 에이전트가 여전히 활성 상태라는
영구적인 증거로 취급하지 않습니다. 오래된 실행 기간(2시간 또는 구성된 실행
시간 제한에 짧은 유예 기간을 더한 값 중 더 긴 값)보다 오래된 미종료 실행은
`/subagents list`, 상태 요약, 하위 완료 게이팅 및 세션별 동시성 검사에서
활성/대기 상태로 집계되지 않습니다.

Gateway 재시작 후 자식 세션에 `abortedLastRun: true`가 표시되어 있지 않은 한
오래된 미종료 복원 실행은 정리됩니다. 재시작으로 중단된 실행은 하위 에이전트
고아 복구 흐름을 위해 등록된 상태로 유지됩니다. 오래된 실행은 재개 없이
마무리되고, 최신 자식 세션은 중단 표시가 지워지기 전에 합성 재개 메시지를
받습니다.

자동 재시작 복구는 자식 세션별로 제한됩니다. 동일한 하위 에이전트 자식이
빠른 재고착 기간 내에 고아 복구 대상으로 반복해서 수락되면 OpenClaw는 해당
세션에 복구 툼스톤을 영구 저장하고 이후 재시작 시 자동 재개를 중지합니다.
작업 레코드를 조정하려면 `openclaw tasks maintenance --apply`를 실행하고,
툼스톤 처리된 세션의 오래된 중단 복구 플래그를 지우려면
`openclaw doctor --fix`를 실행하십시오.

<Note>
하위 에이전트 생성이 Gateway `PAIRING_REQUIRED` / `scope-upgrade` 오류로
실패하면 페어링 상태를 편집하기 전에 RPC 호출자를 확인하십시오. 내부
`sessions_spawn` 조정은 호출자가 이미 gateway 요청 컨텍스트 내에서 실행
중이면 프로세스 내에서 디스패치되므로 루프백 WebSocket을 열지 않으며 CLI의
페어링된 기기 범위 기준에 의존하지 않습니다. gateway 프로세스 외부의 호출자는
직접 루프백 공유 토큰/비밀번호 인증을 통해 `client.id: "gateway-client"` 및
`client.mode: "backend"`를 사용하는 WebSocket 폴백을 계속 사용합니다. 원격
호출자, 명시적 `deviceIdentity`, 명시적 기기 토큰 경로 및 브라우저/node
클라이언트는 범위 업그레이드를 위해 여전히 일반적인 기기 승인이 필요합니다.
</Note>

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고 해당 세션에서 생성된 모든 활성 하위 에이전트 실행이 중지되며, 중첩된 자식까지 연쇄적으로 중지됩니다.

## 제한 사항

- 하위 에이전트 알림은 **최선 노력 방식**입니다. Gateway가 다시 시작되면 대기 중인 "announce back" 작업이 손실됩니다.
- 하위 에이전트도 여전히 동일한 Gateway 프로세스 리소스를 공유하므로, `maxConcurrent`를 안전장치로 사용하십시오.
- `sessions_spawn`은 항상 비차단 방식입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트에는 `AGENTS.md`와 `TOOLS.md`만 주입됩니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`는 주입되지 않음). Codex 네이티브 하위 에이전트도 동일한 경계를 따릅니다. `TOOLS.md`는 상속된 Codex 스레드 지침에 유지되며, 부모 전용 페르소나, ID 및 사용자 파일은 자식이 이를 복제하지 않도록 턴 범위의 협업 지침으로 주입됩니다.
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1-5). 대부분의 사용 사례에는 깊이 2를 권장합니다.
- `maxChildrenPerAgent`는 세션당 활성 자식 수를 제한합니다(기본값 `5`, 범위 `1-20`).

## 관련 항목

- [세션 도구 및 상태 변경](/ko/concepts/session-tool)
- [ACP 에이전트](/ko/tools/acp-agents)
- [에이전트 전송](/ko/tools/agent-send)
- [백그라운드 작업](/ko/automation/tasks)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
