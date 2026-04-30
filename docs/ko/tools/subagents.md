---
read_when:
    - 에이전트를 통해 백그라운드 또는 병렬 작업을 수행하려는 경우
    - sessions_spawn 또는 하위 에이전트 도구 정책을 변경하고 있습니다
    - 스레드에 바인딩된 하위 에이전트 세션을 구현하거나 문제를 해결하고 있습니다
sidebarTitle: Sub-agents
summary: 격리된 백그라운드 에이전트 실행을 생성하고 결과를 요청자 채팅으로 다시 알립니다
title: 하위 에이전트
x-i18n:
    generated_at: "2026-04-30T16:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c46d2c6d9ddac23653dcbfaf20df0ff5be9619035a1b115a3b49fd48fd8280
    source_path: tools/subagents.md
    workflow: 16
---

하위 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다.
각자의 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며,
완료되면 요청자 채팅 채널로 결과를 **알립니다**.
각 하위 에이전트 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

주요 목표:

- 기본 실행을 차단하지 않고 "조사 / 긴 작업 / 느린 도구" 작업을 병렬화합니다.
- 기본적으로 하위 에이전트를 격리합니다(세션 분리 + 선택적 샌드박싱).
- 도구 표면을 오용하기 어렵게 유지합니다. 하위 에이전트는 기본적으로 세션 도구를 받지 않습니다.
- 오케스트레이터 패턴을 위한 구성 가능한 중첩 깊이를 지원합니다.

<Note>
**비용 참고:** 각 하위 에이전트는 기본적으로 자체 컨텍스트와 토큰 사용량을 가집니다. 무겁거나 반복적인 작업의 경우 하위 에이전트에는 더 저렴한 모델을 설정하고, 기본 에이전트는 더 높은 품질의 모델로 유지하세요. `agents.defaults.subagents.model` 또는 에이전트별 재정의로 구성합니다. 자식이 요청자의 현재 transcript가 실제로 필요할 때는 해당 생성 한 번에 대해 에이전트가 `context: "fork"`를 요청할 수 있습니다.
</Note>

## Slash 명령

**현재 세션**의 하위 에이전트 실행을 검사하거나 제어하려면 `/subagents`를 사용하세요.

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 id, transcript 경로, 정리)를 표시합니다. 제한된 안전 필터링 회상 보기는 `sessions_history`를 사용하세요. 원시 전체 transcript가 필요할 때는 디스크의 transcript 경로를 검사하세요.

### 스레드 바인딩 제어

이 명령은 지속적 스레드 바인딩을 지원하는 채널에서 작동합니다.
아래 [스레드 지원 채널](#thread-supporting-channels)을 참고하세요.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 생성 동작

`/subagents spawn`은 내부 릴레이가 아닌 사용자 명령으로 백그라운드 하위 에이전트를 시작하고, 실행이 완료되면 요청자 채팅으로 최종 완료 업데이트 하나를 보냅니다.

<AccordionGroup>
  <Accordion title="비차단, 푸시 기반 완료">
    - 생성 명령은 비차단입니다. 즉시 실행 id를 반환합니다.
    - 완료 시 하위 에이전트는 요청자 채팅 채널로 요약/결과 메시지를 알립니다.
    - 완료는 푸시 기반입니다. 생성한 뒤에는 완료를 기다리기 위해 `/subagents list`, `sessions_list`, 또는 `sessions_history`를 루프에서 폴링하지 마세요. 디버깅이나 개입을 위해 필요할 때만 상태를 검사하세요.
    - 완료 시 OpenClaw는 알림 정리 흐름이 계속되기 전에 해당 하위 에이전트 세션이 연 추적된 브라우저 탭/프로세스를 최선의 노력으로 닫습니다.

  </Accordion>
  <Accordion title="수동 생성 전달 복원력">
    - OpenClaw는 안정적인 멱등성 키로 직접 `agent` 전달을 먼저 시도합니다.
    - 직접 전달이 실패하면 큐 라우팅으로 폴백합니다.
    - 큐 라우팅도 아직 사용할 수 없으면 최종 포기 전에 짧은 지수 백오프로 알림을 재시도합니다.
    - 완료 전달은 해석된 요청자 경로를 유지합니다. 스레드 바인딩 또는 대화 바인딩 완료 경로가 사용 가능하면 우선하며, 완료 출처가 채널만 제공하는 경우 OpenClaw는 요청자 세션의 해석된 경로(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 대상/계정을 채워 직접 전달이 계속 작동하도록 합니다.

  </Accordion>
  <Accordion title="완료 인계 메타데이터">
    요청자 세션으로의 완료 인계는 런타임에서 생성된 내부 컨텍스트(사용자가 작성한 텍스트가 아님)이며 다음을 포함합니다.

    - `Result` — 최신으로 표시된 `assistant` 응답 텍스트, 없으면 정리된 최신 tool/toolResult 텍스트. 터미널 실패 실행은 캡처된 응답 텍스트를 재사용하지 않습니다.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - 간결한 런타임/토큰 통계.
    - 요청자 에이전트가 원시 내부 메타데이터를 전달하지 않고 일반 assistant 음성으로 다시 작성하도록 지시하는 전달 지침.

  </Accordion>
  <Accordion title="모드와 ACP 런타임">
    - `--model`과 `--thinking`은 해당 특정 실행의 기본값을 재정의합니다.
    - 완료 후 세부 정보와 출력을 검사하려면 `info`/`log`를 사용하세요.
    - `/subagents spawn`은 일회성 모드(`mode: "run"`)입니다. 지속적 스레드 바인딩 세션의 경우 `thread: true` 및 `mode: "session"`으로 `sessions_spawn`을 사용하세요.
    - ACP 하네스 세션(Claude Code, Gemini CLI, OpenCode, 또는 명시적 Codex ACP/acpx)의 경우 도구가 해당 런타임을 광고할 때 `runtime: "acp"`로 `sessions_spawn`을 사용하세요. 완료 또는 에이전트 간 루프를 디버깅할 때는 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참고하세요. `codex` Plugin이 활성화된 경우, 사용자가 ACP/acpx를 명시적으로 요청하지 않는 한 Codex 채팅/스레드 제어는 ACP보다 `/codex ...`를 선호해야 합니다.
    - OpenClaw는 ACP가 활성화되고, 요청자가 샌드박스 처리되지 않았으며, `acpx` 같은 백엔드 Plugin이 로드될 때까지 `runtime: "acp"`를 숨깁니다. `runtime: "acp"`는 외부 ACP 하네스 id 또는 `runtime.type="acp"`가 있는 `agents.list[]` 항목을 기대합니다. `agents_list`의 일반 OpenClaw 구성 에이전트에는 기본 하위 에이전트 런타임을 사용하세요.

  </Accordion>
</AccordionGroup>

## 컨텍스트 모드

네이티브 하위 에이전트는 호출자가 현재 transcript의 포크를 명시적으로 요청하지 않는 한 격리된 상태로 시작합니다.

| 모드       | 사용 시점                                                                                                                         | 동작                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 새로운 조사, 독립 구현, 느린 도구 작업, 또는 작업 텍스트로 브리핑할 수 있는 모든 것                           | 깨끗한 자식 transcript를 만듭니다. 이것이 기본값이며 토큰 사용량을 낮게 유지합니다.  |
| `fork`     | 현재 대화, 이전 도구 결과, 또는 요청자 transcript에 이미 있는 미묘한 지침에 의존하는 작업 | 자식이 시작되기 전에 요청자 transcript를 자식 세션으로 분기합니다. |

`fork`는 아껴서 사용하세요. 이는 컨텍스트에 민감한 위임을 위한 것이며, 명확한 작업 프롬프트 작성을 대체하지 않습니다.

## 도구: `sessions_spawn`

전역 `subagent` 레인에서 `deliver: false`로 하위 에이전트 실행을 시작한 다음, 알림 단계를 실행하고 알림 응답을 요청자 채팅 채널에 게시합니다.

가용성은 호출자의 유효 도구 정책에 따라 달라집니다. `coding` 및 `full` 프로필은 기본적으로 `sessions_spawn`을 노출합니다. `messaging` 프로필은 그렇지 않습니다. 작업을 위임해야 하는 에이전트에는 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]`를 추가하거나 `tools.profile: "coding"`을 사용하세요. 채널/그룹, 공급자, 샌드박스, 에이전트별 허용/거부 정책은 프로필 단계 이후에도 도구를 제거할 수 있습니다. 유효 도구 목록을 확인하려면 같은 세션에서 `/tools`를 사용하세요.

**기본값:**

- **모델:** `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않는 한 호출자를 상속합니다. 명시적 `sessions_spawn.model`이 여전히 우선합니다.
- **Thinking:** `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않는 한 호출자를 상속합니다. 명시적 `sessions_spawn.thinking`이 여전히 우선합니다.
- **실행 제한 시간:** `sessions_spawn.runTimeoutSeconds`가 생략되면 OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 사용합니다. 그렇지 않으면 `0`(제한 시간 없음)으로 폴백합니다.

### 도구 매개변수

<ParamField path="task" type="string" required>
  하위 에이전트의 작업 설명입니다.
</ParamField>
<ParamField path="label" type="string">
  선택적 사람이 읽을 수 있는 레이블입니다.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents`에서 허용하는 경우 다른 에이전트 id 아래에 생성합니다.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp`는 외부 ACP 하네스(`claude`, `droid`, `gemini`, `opencode`, 또는 명시적으로 요청된 Codex ACP/acpx)와 `runtime.type`이 `acp`인 `agents.list[]` 항목에만 사용됩니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 전용. `runtime: "acp"`일 때 기존 ACP 하네스 세션을 재개합니다. 네이티브 하위 에이전트 생성에는 무시됩니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 전용. `runtime: "acp"`일 때 ACP 실행 출력을 부모 세션으로 스트리밍합니다. 네이티브 하위 에이전트 생성에서는 생략하세요.
</ParamField>
<ParamField path="model" type="string">
  하위 에이전트 모델을 재정의합니다. 유효하지 않은 값은 건너뛰며, 하위 에이전트는 도구 결과에 경고를 남기고 기본 모델에서 실행됩니다.
</ParamField>
<ParamField path="thinking" type="string">
  하위 에이전트 실행의 thinking 수준을 재정의합니다.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  설정된 경우 기본값은 `agents.defaults.subagents.runTimeoutSeconds`이며, 그렇지 않으면 `0`입니다. 설정하면 하위 에이전트 실행이 N초 후 중단됩니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true`이면 이 하위 에이전트 세션에 채널 스레드 바인딩을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true`이고 `mode`가 생략되면 기본값은 `session`이 됩니다. `mode: "session"`에는 `thread: true`가 필요합니다.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`는 알림 직후 보관합니다(이름 변경을 통해 transcript는 계속 유지).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`는 대상 자식 런타임이 샌드박스 처리되지 않은 경우 생성을 거부합니다.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`는 요청자의 현재 transcript를 자식 세션으로 분기합니다. 네이티브 하위 에이전트 전용입니다. 자식에 현재 transcript가 필요한 경우에만 `fork`를 사용하세요.
</ParamField>

<Warning>
`sessions_spawn`은 채널 전달 매개변수(`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`)를 받지 않습니다. 전달에는 생성된 실행에서 `message`/`sessions_send`를 사용하세요.
</Warning>

## 스레드 바인딩 세션

채널에 스레드 바인딩이 활성화되어 있으면 하위 에이전트는 스레드에 바인딩된 상태로 유지될 수 있으므로, 해당 스레드의 후속 사용자 메시지가 같은 하위 에이전트 세션으로 계속 라우팅됩니다.

### 스레드 지원 채널

**Discord**는 현재 유일하게 지원되는 채널입니다. 지속적 스레드 바인딩 하위 에이전트 세션(`thread: true`로 `sessions_spawn`), 수동 스레드 제어(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), 그리고 어댑터 키 `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions`를 지원합니다.

### 빠른 흐름

<Steps>
  <Step title="생성">
    `thread: true`(그리고 선택적으로 `mode: "session"`)로 `sessions_spawn`.
  </Step>
  <Step title="바인딩">
    OpenClaw는 활성 채널에서 해당 세션 대상으로 스레드를 만들거나 바인딩합니다.
  </Step>
  <Step title="후속 메시지 라우팅">
    해당 스레드의 응답과 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
  </Step>
  <Step title="제한 시간 검사">
    비활성 자동 unfocus를 검사/업데이트하려면 `/session idle`을 사용하고,
    하드 캡을 제어하려면 `/session max-age`를 사용하세요.
  </Step>
  <Step title="분리">
    수동으로 분리하려면 `/unfocus`를 사용하세요.
  </Step>
</Steps>

### 수동 제어

| 명령               | 효과                                                                  |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>`  | 현재 스레드(또는 새로 생성한 스레드)를 sub-agent/세션 대상에 바인딩 |
| `/unfocus`         | 현재 바인딩된 스레드의 바인딩 제거                                   |
| `/agents`          | 활성 실행과 바인딩 상태(`thread:<id>` 또는 `unbound`) 나열            |
| `/session idle`    | 유휴 자동 언포커스 확인/업데이트(포커스된 바인딩 스레드만 해당)       |
| `/session max-age` | 하드 제한 확인/업데이트(포커스된 바인딩 스레드만 해당)                |

### 구성 스위치

- **전역 기본값:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **채널 재정의 및 생성 시 자동 바인딩 키**는 어댑터별로 다릅니다. 위의 [스레드를 지원하는 채널](#thread-supporting-channels)을 참조하세요.

현재 어댑터 세부 정보는 [구성 참조](/ko/gateway/configuration-reference) 및
[슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

### 허용 목록

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  명시적 `agentId`를 통해 대상으로 지정할 수 있는 agent ID 목록입니다(`["*"]`는 모두 허용). 기본값: 요청자 agent만 해당합니다. 목록을 설정하면서도 요청자가 `agentId`로 자기 자신을 생성할 수 있게 하려면 요청자 ID를 목록에 포함하세요.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  요청자 agent가 자체 `subagents.allowAgents`를 설정하지 않을 때 사용되는 기본 대상 agent 허용 목록입니다.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택 강제). agent별 재정의: `agents.list[].subagents.requireAgentId`.
</ParamField>

요청자 세션이 샌드박스 처리된 경우, `sessions_spawn`은
샌드박스 없이 실행될 대상을 거부합니다.

### 탐색

`sessions_spawn`에 현재 허용된 agent ID를 확인하려면 `agents_list`를 사용하세요.
응답에는 나열된 각 agent의 유효 모델과 내장 런타임 메타데이터가 포함되어,
호출자가 PI, Codex app-server 및 기타 구성된 네이티브 런타임을 구분할 수 있습니다.

### 자동 아카이브

- Sub-agent 세션은 `agents.defaults.subagents.archiveAfterMinutes` 이후 자동으로 아카이브됩니다(기본값 `60`).
- 아카이브는 `sessions.delete`를 사용하며 transcript 이름을 `*.deleted.<timestamp>`로 변경합니다(같은 폴더).
- `cleanup: "delete"`는 공지 직후 즉시 아카이브합니다(transcript는 이름 변경으로 계속 보존).
- 자동 아카이브는 최선형 작업입니다. Gateway가 다시 시작되면 대기 중인 타이머는 손실됩니다.
- `runTimeoutSeconds`는 자동 아카이브를 수행하지 않습니다. 실행만 중지합니다. 세션은 자동 아카이브 전까지 남아 있습니다.
- 자동 아카이브는 depth-1 및 depth-2 세션에 동일하게 적용됩니다.
- 브라우저 정리는 아카이브 정리와 별개입니다. 추적 중인 브라우저 탭/프로세스는 transcript/세션 레코드가 유지되더라도 실행이 끝나면 최선형으로 닫힙니다.

## 중첩된 sub-agent

기본적으로 sub-agent는 자체 sub-agent를 생성할 수 없습니다
(`maxSpawnDepth: 1`). 한 단계의 중첩을 활성화하려면 `maxSpawnDepth: 2`를 설정하세요. 즉 **오케스트레이터 패턴**입니다: main → orchestrator sub-agent →
worker sub-sub-agents.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // allow sub-agents to spawn children (default: 1)
        maxChildrenPerAgent: 5, // max active children per agent session (default: 5)
        maxConcurrent: 8, // global concurrency lane cap (default: 8)
        runTimeoutSeconds: 900, // default timeout for sessions_spawn when omitted (0 = no timeout)
      },
    },
  },
}
```

### 깊이 수준

| 깊이 | 세션 키 형태                                  | 역할                                           | 생성 가능 여부                |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0     | `agent:<id>:main`                            | 메인 agent                                    | 항상                         |
| 1     | `agent:<id>:subagent:<uuid>`                 | Sub-agent(depth 2가 허용되면 orchestrator)    | `maxSpawnDepth >= 2`인 경우만 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | Sub-sub-agent(leaf worker)                    | 절대 불가                    |

### 공지 체인

결과는 체인을 따라 위로 전달됩니다.

1. Depth-2 worker가 완료됨 → 부모(depth-1 orchestrator)에게 공지합니다.
2. Depth-1 orchestrator가 공지를 받고 결과를 종합한 뒤 완료됨 → main에 공지합니다.
3. Main agent가 공지를 받고 사용자에게 전달합니다.

각 수준은 자신의 직접 자식이 보낸 공지만 볼 수 있습니다.

<Note>
**운영 지침:** `sessions_list`,
`sessions_history`, `/subagents list` 또는 `exec` sleep 명령을 중심으로 폴링 루프를 만들지 말고, 자식 작업을 한 번 시작한 다음 완료 이벤트를 기다리세요.
`sessions_list` 및 `/subagents list`는 자식 세션 관계를
라이브 작업 중심으로 유지합니다. 라이브 자식은 계속 연결되어 있고, 종료된 자식은 짧은 최근 창 동안 표시되며, 오래된 저장소 전용 자식 링크는 freshness 창이 지난 뒤 무시됩니다. 이렇게 하면 재시작 후 오래된 `spawnedBy` /
`parentSessionKey` 메타데이터가 유령 자식을 되살리는 일을 방지합니다. 이미 최종 답변을 보낸 뒤 자식 완료 이벤트가 도착하면 올바른 후속 응답은 정확한 무응답 토큰
`NO_REPLY` / `no_reply`입니다.
</Note>

### 깊이별 도구 정책

- 역할과 제어 범위는 생성 시 세션 메타데이터에 기록됩니다. 이를 통해 평면화되었거나 복원된 세션 키가 실수로 orchestrator 권한을 다시 얻지 않게 합니다.
- **Depth 1(orchestrator, `maxSpawnDepth >= 2`인 경우):** 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 다른 세션/시스템 도구는 계속 거부됩니다.
- **Depth 1(leaf, `maxSpawnDepth == 1`인 경우):** 세션 도구가 없습니다(현재 기본 동작).
- **Depth 2(leaf worker):** 세션 도구가 없습니다. `sessions_spawn`은 depth 2에서 항상 거부됩니다. 더 이상 자식을 생성할 수 없습니다.

### agent별 생성 제한

각 agent 세션(어느 깊이든)은 동시에 최대 `maxChildrenPerAgent`
(기본값 `5`)개의 활성 자식을 가질 수 있습니다. 이는 단일 orchestrator에서 무제한 fan-out이 발생하는 것을 방지합니다.

### 연쇄 중지

Depth-1 orchestrator를 중지하면 모든 depth-2 자식도 자동으로 중지됩니다.

- 메인 채팅의 `/stop`은 모든 depth-1 agent를 중지하고 그들의 depth-2 자식까지 연쇄 중지합니다.
- `/subagents kill <id>`는 특정 sub-agent를 중지하고 그 자식까지 연쇄 중지합니다.
- `/subagents kill all`은 요청자의 모든 sub-agent를 중지하고 연쇄 중지합니다.

## 인증

Sub-agent 인증은 세션 유형이 아니라 **agent ID**로 해석됩니다.

- Sub-agent 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 agent의 `agentDir`에서 로드됩니다.
- 메인 agent의 인증 프로필은 **fallback**으로 병합됩니다. 충돌 시 agent 프로필이 메인 프로필보다 우선합니다.

병합은 추가 방식이므로, 메인 프로필은 항상 fallback으로 사용할 수 있습니다.
agent별 완전 격리 인증은 아직 지원되지 않습니다.

## 공지

Sub-agent는 공지 단계를 통해 보고합니다.

- 공지 단계는 요청자 세션이 아니라 sub-agent 세션 내부에서 실행됩니다.
- Sub-agent가 정확히 `ANNOUNCE_SKIP`으로 응답하면 아무것도 게시되지 않습니다.
- 최신 assistant 텍스트가 정확한 무응답 토큰 `NO_REPLY` / `no_reply`이면, 이전에 보이는 진행 상황이 있었더라도 공지 출력은 억제됩니다.

전달 방식은 요청자 깊이에 따라 달라집니다.

- 최상위 요청자 세션은 외부 전달(`deliver=true`)이 있는 후속 `agent` 호출을 사용합니다.
- 중첩된 요청자 subagent 세션은 내부 후속 주입(`deliver=false`)을 받아 orchestrator가 세션 안에서 자식 결과를 종합할 수 있습니다.
- 중첩된 요청자 subagent 세션이 사라진 경우, OpenClaw는 가능하면 해당 세션의 요청자로 fallback합니다.

최상위 요청자 세션의 경우, completion-mode 직접 전달은 먼저 바인딩된 대화/스레드 경로와 hook 재정의를 해석한 다음, 누락된 채널 대상 필드를 요청자 세션에 저장된 경로로 채웁니다.
이를 통해 completion 출처가 채널만 식별하더라도 completion이 올바른 채팅/토픽에 유지됩니다.

중첩된 completion findings를 만들 때 자식 completion 집계는 현재 요청자 실행으로 범위가 지정되어, 오래된 이전 실행의 자식 출력이 현재 공지로 새어 들어가지 않도록 합니다. 공지 응답은 채널 어댑터에서 사용할 수 있는 경우 스레드/토픽 라우팅을 보존합니다.

### 공지 컨텍스트

공지 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다.

| 필드          | 출처                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| 출처           | `subagent` 또는 `cron`                                                                                        |
| 세션 ID        | 자식 세션 키/ID                                                                                               |
| 유형           | 공지 유형 + 작업 레이블                                                                                       |
| 상태           | 런타임 결과에서 파생(`success`, `error`, `timeout` 또는 `unknown`) — 모델 텍스트에서 추론하지 **않음** |
| 결과 내용      | 최신 표시 assistant 텍스트, 없으면 정리된 최신 tool/toolResult 텍스트                                        |
| 후속 조치      | 응답할 때와 침묵을 유지할 때를 설명하는 지침                                                                  |

종료된 실패 실행은 캡처된 응답 텍스트를 재생하지 않고 실패 상태를 보고합니다. 타임아웃 시 자식이 도구 호출까지만 진행했다면, 공지는 원시 도구 출력을 재생하는 대신 해당 기록을 짧은 부분 진행 요약으로 축약할 수 있습니다.

### 통계 줄

공지 페이로드는 끝에 통계 줄을 포함합니다(줄바꿈되어 감싸진 경우에도).

- 런타임(예: `runtime 5m12s`).
- 토큰 사용량(input/output/total).
- 모델 가격이 구성된 경우 추정 비용(`models.providers.*.models[].cost`).
- 메인 agent가 `sessions_history`를 통해 기록을 가져오거나 디스크의 파일을 검사할 수 있도록 `sessionKey`, `sessionId` 및 transcript 경로.

내부 메타데이터는 오케스트레이션 전용입니다. 사용자-facing 응답은 일반 assistant 음성으로 다시 작성해야 합니다.

### `sessions_history`를 선호하는 이유

`sessions_history`는 더 안전한 오케스트레이션 경로입니다.

- Assistant recall이 먼저 정규화됩니다. thinking 태그 제거, `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 제거, 일반 텍스트 tool-call XML 페이로드 블록(`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) 제거(깔끔하게 닫히지 않은 잘린 페이로드 포함), 다운그레이드된 tool-call/result 스캐폴딩 및 historical-context 마커 제거, 유출된 모델 제어 토큰(`<|assistant|>`, 기타 ASCII `<|...|>`, 전각 `<｜...｜>`) 제거, 잘못된 형식의 MiniMax tool-call XML 제거.
- credential/token처럼 보이는 텍스트가 redact됩니다.
- 긴 블록은 잘릴 수 있습니다.
- 매우 큰 기록은 오래된 행을 제거하거나 너무 큰 행을 `[sessions_history omitted: message too large]`로 대체할 수 있습니다.
- 원시 온디스크 transcript 검사는 완전한 바이트 단위 transcript가 필요할 때의 fallback입니다.

## 도구 정책

Sub-agent는 먼저 부모 또는 대상 agent와 동일한 프로필 및 도구 정책 파이프라인을 사용합니다. 그 후 OpenClaw가 sub-agent 제한 계층을 적용합니다.

제한적인 `tools.profile`이 없으면, sub-agent는 **세션 도구와 시스템 도구를 제외한 모든 도구**를 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

여기서도 `sessions_history`는 제한되고 정리된 recall 뷰입니다. 원시 transcript 덤프가 아닙니다.

`maxSpawnDepth >= 2`인 경우, depth-1 orchestrator sub-agent는 자식을 관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`,
`sessions_history`를 받습니다.

### 구성으로 재정의

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

`tools.subagents.tools.allow`는 최종 허용 전용 필터입니다. 이미 확인된 도구 집합을 좁힐 수는 있지만, `tools.profile`에 의해 제거된 도구를 **다시 추가**할 수는 없습니다. 예를 들어 `tools.profile: "coding"`은 `web_search`/`web_fetch`를 포함하지만 `browser` 도구는 포함하지 않습니다. coding 프로필 하위 에이전트가 browser 자동화를 사용하도록 하려면 프로필 단계에서 browser를 추가하세요.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

하나의 에이전트에만 browser 자동화를 제공해야 하는 경우 에이전트별 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.

## 동시성

하위 에이전트는 전용 인프로세스 큐 레인을 사용합니다.

- **레인 이름:** `subagent`
- **동시성:** `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 활성 상태 및 복구

OpenClaw는 `endedAt`이 없다는 것을 하위 에이전트가 아직 살아 있다는 영구적인 증거로 취급하지 않습니다. 오래된 실행 기간보다 오래된 종료되지 않은 실행은 `/subagents list`, 상태 요약, 하위 항목 완료 게이팅, 세션별 동시성 검사에서 활성/대기 중으로 계산되지 않습니다.

Gateway 재시작 후에는 자식 세션이 `abortedLastRun: true`로 표시되어 있지 않은 한, 오래되어 종료되지 않은 복원 실행이 정리됩니다. 재시작으로 중단된 해당 자식 세션은 하위 에이전트 고아 복구 흐름을 통해 계속 복구할 수 있으며, 이 흐름은 중단 마커를 지우기 전에 합성 재개 메시지를 보냅니다.

자동 재시작 복구는 자식 세션별로 제한됩니다. 같은 하위 에이전트 자식이 빠른 재쐐기 기간 안에 반복적으로 고아 복구 대상으로 수락되면, OpenClaw는 해당 세션에 복구 tombstone을 유지하고 이후 재시작에서 자동 재개를 중지합니다. 작업 레코드를 조정하려면 `openclaw tasks maintenance --apply`를 실행하거나, tombstoned 세션의 오래된 중단 복구 플래그를 지우려면 `openclaw doctor --fix`를 실행하세요.

<Note>
하위 에이전트 생성이 Gateway `PAIRING_REQUIRED` / `scope-upgrade`로 실패하면, 페어링 상태를 편집하기 전에 RPC 호출자를 확인하세요. 내부 `sessions_spawn` 조정은 직접 loopback 공유 토큰/비밀번호 인증을 통해 `client.id: "gateway-client"` 및 `client.mode: "backend"`로 연결해야 합니다. 이 경로는 CLI의 페어링된 기기 범위 기준에 의존하지 않습니다. 원격 호출자, 명시적 `deviceIdentity`, 명시적 기기 토큰 경로, browser/node 클라이언트는 범위 업그레이드에 여전히 일반적인 기기 승인이 필요합니다.
</Note>

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고 해당 세션에서 생성된 활성 하위 에이전트 실행이 중지되며, 중첩된 자식까지 연쇄적으로 적용됩니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식까지 연쇄적으로 적용합니다.

## 제한 사항

- 하위 에이전트 알림은 **최선 노력** 방식입니다. Gateway가 재시작되면 대기 중인 "announce back" 작업은 손실됩니다.
- 하위 에이전트는 여전히 동일한 Gateway 프로세스 리소스를 공유합니다. `maxConcurrent`를 안전 장치로 취급하세요.
- `sessions_spawn`은 항상 논블로킹입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트는 `AGENTS.md` + `TOOLS.md`만 주입합니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`는 제외).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1~5). 대부분의 사용 사례에는 깊이 2를 권장합니다.
- `maxChildrenPerAgent`는 세션당 활성 자식 수를 제한합니다(기본값 `5`, 범위 `1~20`).

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents)
- [에이전트 보내기](/ko/tools/agent-send)
- [백그라운드 작업](/ko/automation/tasks)
- [멀티 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
