---
read_when:
    - 에이전트를 통한 백그라운드 또는 병렬 작업을 원합니다
    - sessions_spawn 또는 하위 에이전트 도구 정책을 변경하는 중입니다
    - 스레드에 바인딩된 하위 에이전트 세션을 구현하거나 문제를 해결하고 있습니다
sidebarTitle: Sub-agents
summary: 결과를 요청자 채팅으로 다시 알리는 격리된 백그라운드 에이전트 실행을 시작합니다
title: 하위 에이전트
x-i18n:
    generated_at: "2026-04-30T06:55:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84386ea706873cf9f2ea03261f916c8fb01304999f2d9fa86e037e734a62bf7e
    source_path: tools/subagents.md
    workflow: 16
---

하위 에이전트는 기존 에이전트 실행에서 생성된 백그라운드 에이전트 실행입니다.
각자의 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며,
완료되면 결과를 요청자 채팅 채널로 **알립니다**.
각 하위 에이전트 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

주요 목표:

- 기본 실행을 차단하지 않고 "조사 / 긴 작업 / 느린 도구" 작업을 병렬화합니다.
- 기본적으로 하위 에이전트를 격리합니다(세션 분리 + 선택적 샌드박싱).
- 도구 표면을 오용하기 어렵게 유지합니다. 하위 에이전트는 기본적으로 세션 도구를 받지 않습니다.
- 오케스트레이터 패턴을 위한 구성 가능한 중첩 깊이를 지원합니다.

<Note>
**비용 참고:** 기본적으로 각 하위 에이전트는 자체 컨텍스트와 토큰 사용량을 가집니다.
무겁거나 반복적인 작업에는 하위 에이전트에 더 저렴한 모델을 설정하고,
기본 에이전트는 더 높은 품질의 모델로 유지하세요. `agents.defaults.subagents.model` 또는
에이전트별 재정의를 통해 구성합니다. 자식이 요청자의 현재 transcript를 실제로 필요로 하는 경우,
에이전트는 해당 spawn 한 번에 `context: "fork"`를 요청할 수 있습니다.
</Note>

## 슬래시 명령

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

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 id,
transcript 경로, 정리)를 표시합니다. 제한되고 안전 필터링된 회상 보기는
`sessions_history`를 사용하세요. 원시 전체 transcript가 필요하면 디스크의 transcript 경로를 검사하세요.

### 스레드 바인딩 제어

이 명령은 지속 스레드 바인딩을 지원하는 채널에서 작동합니다.
아래의 [스레드 지원 채널](#thread-supporting-channels)을 참조하세요.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### Spawn 동작

`/subagents spawn`은 백그라운드 하위 에이전트를 사용자 명령(내부 릴레이가 아님)으로 시작하고,
실행이 완료되면 요청자 채팅으로 최종 완료 업데이트 하나를 보냅니다.

<AccordionGroup>
  <Accordion title="차단하지 않는 푸시 기반 완료">
    - spawn 명령은 차단하지 않으며, 즉시 실행 id를 반환합니다.
    - 완료 시 하위 에이전트는 요약/결과 메시지를 요청자 채팅 채널로 알립니다.
    - 완료는 푸시 기반입니다. spawn된 뒤에는 완료를 기다리기 위해 `/subagents list`, `sessions_list`, 또는 `sessions_history`를 루프로 폴링하지 마세요. 상태는 디버깅이나 개입이 필요할 때만 확인하세요.
    - 완료 시 OpenClaw는 알림 정리 흐름을 계속하기 전에 해당 하위 에이전트 세션이 연 추적된 브라우저 탭/프로세스를 최선의 노력으로 닫습니다.

  </Accordion>
  <Accordion title="수동 spawn 전달 복원력">
    - OpenClaw는 안정적인 멱등성 키로 먼저 직접 `agent` 전달을 시도합니다.
    - 직접 전달이 실패하면 큐 라우팅으로 폴백합니다.
    - 큐 라우팅도 아직 사용할 수 없으면 최종 포기 전에 짧은 지수 백오프로 알림을 재시도합니다.
    - 완료 전달은 해석된 요청자 경로를 유지합니다. 스레드 바인딩 또는 대화 바인딩 완료 경로가 사용 가능하면 우선합니다. 완료 원본이 채널만 제공하는 경우, OpenClaw는 요청자 세션의 해석된 경로(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 target/account를 채워 직접 전달이 계속 작동하게 합니다.

  </Accordion>
  <Accordion title="완료 인계 메타데이터">
    요청자 세션으로의 완료 인계는 런타임에서 생성된 내부 컨텍스트(사용자가 작성한 텍스트 아님)이며 다음을 포함합니다.

    - `Result` — 최신 표시 `assistant` 응답 텍스트. 없으면 정리된 최신 tool/toolResult 텍스트입니다. 터미널 실패 실행은 캡처된 응답 텍스트를 재사용하지 않습니다.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - 간결한 런타임/토큰 통계.
    - 요청자 에이전트에게 원시 내부 메타데이터를 전달하지 말고 일반 assistant 음성으로 다시 작성하라고 지시하는 전달 지침.

  </Accordion>
  <Accordion title="모드와 ACP 런타임">
    - `--model`과 `--thinking`은 해당 특정 실행의 기본값을 재정의합니다.
    - 완료 후 세부 정보와 출력을 검사하려면 `info`/`log`를 사용하세요.
    - `/subagents spawn`은 일회성 모드(`mode: "run"`)입니다. 지속 스레드 바인딩 세션에는 `thread: true` 및 `mode: "session"`과 함께 `sessions_spawn`을 사용하세요.
    - ACP harness 세션(Claude Code, Gemini CLI, OpenCode, 또는 명시적 Codex ACP/acpx)의 경우, 도구가 해당 런타임을 광고할 때 `runtime: "acp"`와 함께 `sessions_spawn`을 사용하세요. 완료 또는 에이전트 간 루프를 디버깅할 때는 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참조하세요. `codex` Plugin이 활성화된 경우, 사용자가 명시적으로 ACP/acpx를 요청하지 않는 한 Codex 채팅/스레드 제어는 ACP보다 `/codex ...`를 선호해야 합니다.
    - OpenClaw는 ACP가 활성화되고, 요청자가 샌드박싱되지 않았으며, `acpx` 같은 백엔드 Plugin이 로드될 때까지 `runtime: "acp"`를 숨깁니다. `runtime: "acp"`는 외부 ACP harness id 또는 `runtime.type="acp"`가 있는 `agents.list[]` 항목을 기대합니다. `agents_list`의 일반 OpenClaw 구성 에이전트에는 기본 하위 에이전트 런타임을 사용하세요.

  </Accordion>
</AccordionGroup>

## 컨텍스트 모드

네이티브 하위 에이전트는 호출자가 현재 transcript를 fork하도록 명시적으로 요청하지 않는 한 격리된 상태로 시작합니다.

| 모드       | 사용 시점                                                                                                                         | 동작                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 새로운 조사, 독립 구현, 느린 도구 작업, 또는 작업 텍스트로 요약 설명할 수 있는 모든 것                           | 깨끗한 자식 transcript를 생성합니다. 이것이 기본값이며 토큰 사용량을 낮게 유지합니다.  |
| `fork`     | 현재 대화, 이전 도구 결과, 또는 요청자 transcript에 이미 있는 섬세한 지침에 의존하는 작업 | 자식이 시작되기 전에 요청자 transcript를 자식 세션으로 분기합니다. |

`fork`는 아껴서 사용하세요. 이는 컨텍스트에 민감한 위임을 위한 것이지,
명확한 작업 프롬프트 작성의 대체물이 아닙니다.

## 도구: `sessions_spawn`

전역 `subagent` 레인에서 `deliver: false`로 하위 에이전트 실행을 시작한 다음,
알림 단계를 실행하고 알림 응답을 요청자 채팅 채널에 게시합니다.

사용 가능 여부는 호출자의 유효 도구 정책에 따라 달라집니다. `coding` 및
`full` 프로필은 기본적으로 `sessions_spawn`을 노출합니다. `messaging` 프로필은
노출하지 않습니다. 작업을 위임해야 하는 에이전트에는 `tools.alsoAllow: ["sessions_spawn", "sessions_yield",
"subagents"]`를 추가하거나 `tools.profile: "coding"`을 사용하세요.
채널/그룹, 제공자, 샌드박스, 에이전트별 허용/거부 정책은 프로필 단계 이후에도
도구를 제거할 수 있습니다. 동일 세션에서 `/tools`를 사용해 유효 도구 목록을 확인하세요.

**기본값:**

- **모델:** `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않으면 호출자를 상속합니다. 명시적 `sessions_spawn.model`이 여전히 우선합니다.
- **Thinking:** `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않으면 호출자를 상속합니다. 명시적 `sessions_spawn.thinking`이 여전히 우선합니다.
- **실행 타임아웃:** `sessions_spawn.runTimeoutSeconds`가 생략되면, OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 사용합니다. 그렇지 않으면 `0`(타임아웃 없음)으로 폴백합니다.

### 도구 매개변수

<ParamField path="task" type="string" required>
  하위 에이전트의 작업 설명입니다.
</ParamField>
<ParamField path="label" type="string">
  선택적 사람이 읽기 쉬운 레이블입니다.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents`에서 허용할 때 다른 에이전트 id 아래에서 spawn합니다.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp`는 외부 ACP harness(`claude`, `droid`, `gemini`, `opencode`, 또는 명시적으로 요청된 Codex ACP/acpx) 및 `runtime.type`이 `acp`인 `agents.list[]` 항목에만 사용합니다.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  ACP 전용입니다. `runtime: "acp"`일 때 기존 ACP harness 세션을 재개합니다. 네이티브 하위 에이전트 spawn에서는 무시됩니다.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  ACP 전용입니다. `runtime: "acp"`일 때 ACP 실행 출력을 부모 세션으로 스트리밍합니다. 네이티브 하위 에이전트 spawn에서는 생략하세요.
</ParamField>
<ParamField path="model" type="string">
  하위 에이전트 모델을 재정의합니다. 잘못된 값은 건너뛰며, 하위 에이전트는 도구 결과에 경고를 남기고 기본 모델로 실행됩니다.
</ParamField>
<ParamField path="thinking" type="string">
  하위 에이전트 실행의 thinking 수준을 재정의합니다.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  설정된 경우 기본값은 `agents.defaults.subagents.runTimeoutSeconds`이고, 그렇지 않으면 `0`입니다. 설정되면 하위 에이전트 실행은 N초 후 중단됩니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true`이면 이 하위 에이전트 세션에 채널 스레드 바인딩을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true`이고 `mode`가 생략되면 기본값은 `session`이 됩니다. `mode: "session"`은 `thread: true`가 필요합니다.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`는 알림 직후 보관합니다(transcript는 이름 변경을 통해 계속 유지).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`는 대상 자식 런타임이 샌드박싱되지 않은 경우 spawn을 거부합니다.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`는 요청자의 현재 transcript를 자식 세션으로 분기합니다. 네이티브 하위 에이전트 전용입니다. 자식이 현재 transcript를 필요로 할 때만 `fork`를 사용하세요.
</ParamField>

<Warning>
`sessions_spawn`은 채널 전달 매개변수(`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`)를 허용하지 않습니다. 전달에는 spawn된 실행에서
`message`/`sessions_send`를 사용하세요.
</Warning>

## 스레드 바인딩 세션

채널에 스레드 바인딩이 활성화된 경우, 하위 에이전트는 스레드에 바인딩된 상태를 유지할 수 있어
해당 스레드의 후속 사용자 메시지가 같은 하위 에이전트 세션으로 계속 라우팅됩니다.

### 스레드 지원 채널

**Discord**는 현재 유일하게 지원되는 채널입니다. 지속 스레드 바인딩 하위 에이전트 세션(`thread: true`와 함께 `sessions_spawn`),
수동 스레드 제어(`/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`) 및 어댑터 키
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`, 그리고
`channels.discord.threadBindings.spawnSubagentSessions`를 지원합니다.

### 빠른 흐름

<Steps>
  <Step title="Spawn">
    `thread: true`(그리고 선택적으로 `mode: "session"`)와 함께 `sessions_spawn`을 실행합니다.
  </Step>
  <Step title="바인딩">
    OpenClaw는 활성 채널에서 해당 세션 대상으로 스레드를 생성하거나 바인딩합니다.
  </Step>
  <Step title="후속 메시지 라우팅">
    해당 스레드의 응답과 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
  </Step>
  <Step title="타임아웃 검사">
    비활성 자동 unfocus를 검사/업데이트하려면 `/session idle`을 사용하고,
    하드 캡을 제어하려면 `/session max-age`를 사용하세요.
  </Step>
  <Step title="분리">
    수동으로 분리하려면 `/unfocus`를 사용하세요.
  </Step>
</Steps>

### 수동 제어

| 명령               | 효과                                                                   |
| ------------------ | ---------------------------------------------------------------------- |
| `/focus <target>`  | 현재 스레드를 하위 에이전트/세션 대상에 바인딩하거나 새로 만듭니다     |
| `/unfocus`         | 현재 바인딩된 스레드의 바인딩을 제거합니다                             |
| `/agents`          | 활성 실행과 바인딩 상태(`thread:<id>` 또는 `unbound`)를 나열합니다      |
| `/session idle`    | 유휴 자동 언포커스를 확인/업데이트합니다(포커스된 바인딩 스레드만 해당) |
| `/session max-age` | 하드 캡을 확인/업데이트합니다(포커스된 바인딩 스레드만 해당)            |

### 구성 스위치

- **전역 기본값:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **채널 오버라이드 및 스폰 자동 바인딩 키**는 어댑터별로 다릅니다. 위의 [스레드를 지원하는 채널](#thread-supporting-channels)을 참조하세요.

현재 어댑터 세부 정보는 [구성 참조](/ko/gateway/configuration-reference)와
[슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

### 허용 목록

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  명시적 `agentId`를 통해 대상으로 지정할 수 있는 에이전트 ID 목록입니다(`["*"]`는 모두 허용). 기본값: 요청자 에이전트만. 목록을 설정한 뒤에도 요청자가 `agentId`로 자신을 스폰할 수 있게 하려면 요청자 ID를 목록에 포함하세요.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 사용되는 기본 대상 에이전트 허용 목록입니다.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적 프로필 선택을 강제). 에이전트별 오버라이드: `agents.list[].subagents.requireAgentId`.
</ParamField>

요청자 세션이 샌드박스 처리된 경우, `sessions_spawn`은 샌드박스 없이 실행될 대상을 거부합니다.

### 검색

`sessions_spawn`에 현재 허용된 에이전트 ID를 확인하려면 `agents_list`를 사용하세요. 응답에는 나열된 각 에이전트의 유효
모델과 포함된 런타임 메타데이터가 포함되어 호출자가 PI, Codex
앱 서버, 기타 구성된 네이티브 런타임을 구분할 수 있습니다.

### 자동 보관

- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 이후 자동으로 보관됩니다(기본값 `60`).
- 보관은 `sessions.delete`를 사용하고 transcript 이름을 `*.deleted.<timestamp>`로 변경합니다(동일 폴더).
- `cleanup: "delete"`는 알림 직후 즉시 보관합니다(이름 변경을 통해 transcript는 계속 유지).
- 자동 보관은 최선의 노력 방식입니다. Gateway가 다시 시작되면 보류 중인 타이머는 손실됩니다.
- `runTimeoutSeconds`는 자동 보관을 수행하지 않으며, 실행만 중지합니다. 세션은 자동 보관 전까지 남아 있습니다.
- 자동 보관은 depth-1 및 depth-2 세션에 동일하게 적용됩니다.
- 브라우저 정리는 보관 정리와 별개입니다. 추적된 브라우저 탭/프로세스는 transcript/세션 레코드가 유지되더라도 실행이 끝나면 최선의 노력 방식으로 닫힙니다.

## 중첩 하위 에이전트

기본적으로 하위 에이전트는 자체 하위 에이전트를 스폰할 수 없습니다
(`maxSpawnDepth: 1`). 한 단계의 중첩을 활성화하려면 `maxSpawnDepth: 2`를 설정하세요. 이는 **오케스트레이터 패턴**입니다: 메인 → 오케스트레이터 하위 에이전트 →
작업자 하위-하위 에이전트.

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

### Depth 수준

| Depth | 세션 키 형태                                  | 역할                                           | 스폰 가능 여부                |
| ----- | --------------------------------------------- | ---------------------------------------------- | ----------------------------- |
| 0     | `agent:<id>:main`                             | 메인 에이전트                                  | 항상                          |
| 1     | `agent:<id>:subagent:<uuid>`                  | 하위 에이전트(depth 2가 허용되면 오케스트레이터) | `maxSpawnDepth >= 2`인 경우만 |
| 2     | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | 하위-하위 에이전트(리프 작업자)                | 절대 불가                     |

### 알림 체인

결과는 체인을 따라 위로 전달됩니다.

1. Depth-2 작업자가 완료 → 부모(depth-1 오케스트레이터)에 알림.
2. Depth-1 오케스트레이터가 알림을 수신하고, 결과를 종합한 뒤 완료 → 메인에 알림.
3. 메인 에이전트가 알림을 수신하고 사용자에게 전달.

각 수준은 직접 자식의 알림만 볼 수 있습니다.

<Note>
**운영 지침:** `sessions_list`,
`sessions_history`, `/subagents list`, 또는 `exec` sleep 명령을 중심으로 폴링 루프를 만들기보다 자식 작업을 한 번 시작하고 완료
이벤트를 기다리세요.
`sessions_list`와 `/subagents list`는 자식 세션 관계를
라이브 작업에 집중시킵니다. 라이브 자식은 계속 연결된 상태로 남고, 종료된 자식은 짧은 최근 창 동안 표시되며, 오래된 저장소 전용 자식 링크는
신선도 창이 지난 뒤 무시됩니다. 이렇게 하면 재시작 후 오래된 `spawnedBy` /
`parentSessionKey` 메타데이터가 유령 자식을 되살리는 것을 방지할 수 있습니다. 이미
최종 답변을 보낸 뒤 자식 완료 이벤트가 도착하면 올바른 후속 응답은 정확한 무음 토큰
`NO_REPLY` / `no_reply`입니다.
</Note>

### Depth별 도구 정책

- 역할과 제어 범위는 스폰 시점에 세션 메타데이터에 기록됩니다. 이를 통해 플랫하거나 복원된 세션 키가 실수로 오케스트레이터 권한을 다시 얻지 않도록 합니다.
- **Depth 1(오케스트레이터, `maxSpawnDepth >= 2`인 경우):** 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 다른 세션/시스템 도구는 계속 거부됩니다.
- **Depth 1(리프, `maxSpawnDepth == 1`인 경우):** 세션 도구 없음(현재 기본 동작).
- **Depth 2(리프 작업자):** 세션 도구 없음. `sessions_spawn`은 depth 2에서 항상 거부됩니다. 더 이상의 자식을 스폰할 수 없습니다.

### 에이전트별 스폰 제한

각 에이전트 세션(모든 depth)은 동시에 최대 `maxChildrenPerAgent`
(기본값 `5`)개의 활성 자식을 가질 수 있습니다. 이는 단일 오케스트레이터에서 발생하는 제어 불능 팬아웃을 방지합니다.

### 연쇄 중지

depth-1 오케스트레이터를 중지하면 모든 depth-2 자식도 자동으로 중지됩니다.

- 메인 채팅의 `/stop`은 모든 depth-1 에이전트를 중지하고 해당 depth-2 자식까지 연쇄 중지합니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 해당 자식까지 연쇄 중지합니다.
- `/subagents kill all`은 요청자의 모든 하위 에이전트를 중지하고 연쇄 중지합니다.

## 인증

하위 에이전트 인증은 세션 유형이 아니라 **에이전트 ID**로 결정됩니다.

- 하위 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **fallback**으로 병합되며, 충돌 시 에이전트 프로필이 메인 프로필보다 우선합니다.

병합은 추가 방식이므로 메인 프로필은 항상 fallback으로 사용할 수 있습니다. 에이전트별 완전 격리 인증은 아직 지원되지 않습니다.

## 알림

하위 에이전트는 알림 단계를 통해 보고합니다.

- 알림 단계는 요청자 세션이 아니라 하위 에이전트 세션 내부에서 실행됩니다.
- 하위 에이전트가 정확히 `ANNOUNCE_SKIP`으로 응답하면 아무것도 게시되지 않습니다.
- 최신 어시스턴트 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply`이면 이전에 표시된 진행 상황이 있었더라도 알림 출력이 억제됩니다.

전달은 요청자 depth에 따라 달라집니다.

- 최상위 요청자 세션은 외부 전달(`deliver=true`)이 포함된 후속 `agent` 호출을 사용합니다.
- 중첩 요청자 하위 에이전트 세션은 내부 후속 주입(`deliver=false`)을 수신하므로 오케스트레이터가 세션 내에서 자식 결과를 종합할 수 있습니다.
- 중첩 요청자 하위 에이전트 세션이 사라진 경우, 가능하면 OpenClaw는 해당 세션의 요청자로 fallback합니다.

최상위 요청자 세션의 경우 완료 모드 직접 전달은 먼저 바인딩된 대화/스레드 경로와 훅 오버라이드를 확인한 다음, 요청자 세션의 저장된 경로에서 누락된 채널 대상 필드를 채웁니다.
이렇게 하면 완료 원본이 채널만 식별하더라도 올바른 채팅/주제로 완료가 유지됩니다.

중첩 완료 결과를 만들 때 자식 완료 집계는 현재 요청자 실행으로 범위가 제한되어, 이전 실행의 오래된 자식 출력이 현재 알림으로 누출되는 것을 방지합니다. 알림 응답은 채널 어댑터에서 사용 가능한 경우 스레드/주제 라우팅을 보존합니다.

### 알림 컨텍스트

알림 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다.

| 필드        | 출처                                                                                                        |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| 소스        | `subagent` 또는 `cron`                                                                                      |
| 세션 ID     | 자식 세션 키/ID                                                                                             |
| 유형        | 알림 유형 + 작업 레이블                                                                                     |
| 상태        | 런타임 결과(`success`, `error`, `timeout`, 또는 `unknown`)에서 파생됨. 모델 텍스트에서 추론하지 **않음** |
| 결과 내용   | 최신 표시 가능 어시스턴트 텍스트, 없으면 정리된 최신 도구/toolResult 텍스트                              |
| 후속 조치   | 언제 응답하고 언제 침묵을 유지할지 설명하는 지침                                                           |

터미널 실패 실행은 캡처된 응답 텍스트를 다시 재생하지 않고 실패 상태를 보고합니다. 시간 초과 시 자식이 도구 호출까지만 진행한 경우, 알림은 원시 도구 출력을 다시 재생하는 대신 해당 기록을 짧은 부분 진행 요약으로 축약할 수 있습니다.

### 통계 줄

알림 payload에는 끝에 통계 줄이 포함됩니다(래핑된 경우에도).

- 런타임(예: `runtime 5m12s`).
- 토큰 사용량(입력/출력/합계).
- 모델 가격이 구성된 경우 예상 비용(`models.providers.*.models[].cost`).
- 메인 에이전트가 `sessions_history`를 통해 기록을 가져오거나 디스크의 파일을 검사할 수 있도록 `sessionKey`, `sessionId`, transcript 경로.

내부 메타데이터는 오케스트레이션 전용입니다. 사용자 대상 응답은 일반 어시스턴트 어조로 다시 작성해야 합니다.

### `sessions_history`를 선호하는 이유

`sessions_history`는 더 안전한 오케스트레이션 경로입니다.

- 어시스턴트 recall이 먼저 정규화됩니다. thinking 태그 제거, `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 제거, 일반 텍스트 도구 호출 XML payload 블록(`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`) 제거(깔끔하게 닫히지 않은 잘린 payload 포함), 다운그레이드된 도구 호출/결과 스캐폴딩 및 기록 컨텍스트 마커 제거, 누출된 모델 제어 토큰(`<|assistant|>`, 기타 ASCII `<|...|>`, 전각 `<｜...｜>`) 제거, 잘못 구성된 MiniMax 도구 호출 XML 제거.
- 자격 증명/토큰처럼 보이는 텍스트가 마스킹됩니다.
- 긴 블록은 잘릴 수 있습니다.
- 매우 큰 기록은 오래된 행을 제거하거나 지나치게 큰 행을 `[sessions_history omitted: message too large]`로 대체할 수 있습니다.
- 전체 byte-for-byte transcript가 필요할 때는 디스크의 원시 transcript 검사가 fallback입니다.

## 도구 정책

하위 에이전트는 먼저 부모 또는 대상 에이전트와 동일한 프로필 및 도구 정책 파이프라인을 사용합니다. 그다음 OpenClaw가 하위 에이전트 제한 계층을 적용합니다.

제한적인 `tools.profile`이 없으면 하위 에이전트는 세션 도구와 시스템 도구를 제외한 **모든 도구**를 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

여기에서도 `sessions_history`는 제한되고 정리된 recall 뷰로 유지되며, 원시 transcript 덤프가 아닙니다.

`maxSpawnDepth >= 2`인 경우 depth-1 오케스트레이터 하위 에이전트는 자식을 관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다.

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

`tools.subagents.tools.allow`는 최종 allow-only 필터입니다. 이미 확인된 도구 집합을 좁힐 수는 있지만, `tools.profile`에서 제거된 도구를 **다시 추가할 수는** 없습니다. 예를 들어 `tools.profile: "coding"`은 `web_search`/`web_fetch`를 포함하지만 `browser` 도구는 포함하지 않습니다. coding-profile 하위 에이전트가 브라우저 자동화를 사용하게 하려면 profile 단계에서 browser를 추가하세요.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

하나의 에이전트에만 브라우저 자동화를 제공해야 하는 경우 에이전트별 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.

## 동시성

하위 에이전트는 전용 인프로세스 큐 레인을 사용합니다.

- **레인 이름:** `subagent`
- **동시성:** `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 활성 상태 및 복구

OpenClaw는 `endedAt`이 없다는 사실을 하위 에이전트가 아직 살아 있다는 영구적인 증거로 취급하지 않습니다. stale-run 기간보다 오래된 종료되지 않은 실행은 `/subagents list`, 상태 요약, 하위 항목 완료 게이트, 세션별 동시성 검사에서 활성/대기 중으로 계산되지 않습니다.

Gateway 재시작 후에는 하위 세션이 `abortedLastRun: true`로 표시되어 있지 않은 한, 복원된 오래된 종료되지 않은 실행이 정리됩니다. 이렇게 재시작으로 중단된 하위 세션은 하위 에이전트 고아 복구 흐름을 통해 복구할 수 있으며, 이 흐름은 중단 표시를 지우기 전에 합성 resume 메시지를 보냅니다.

<Note>
하위 에이전트 생성이 Gateway `PAIRING_REQUIRED` / `scope-upgrade`로 실패하면 페어링 상태를 편집하기 전에 RPC 호출자를 확인하세요. 내부 `sessions_spawn` 조정은 직접 loopback 공유 토큰/비밀번호 인증을 통해 `client.id: "gateway-client"` 및 `client.mode: "backend"`로 연결해야 합니다. 해당 경로는 CLI의 페어링된 디바이스 scope 기준선에 의존하지 않습니다. 원격 호출자, 명시적 `deviceIdentity`, 명시적 디바이스 토큰 경로, 브라우저/node 클라이언트에는 여전히 scope 업그레이드에 대한 일반 디바이스 승인이 필요합니다.
</Note>

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고 해당 세션에서 생성된 활성 하위 에이전트 실행이 중지되며, 중첩된 하위 항목으로 전파됩니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 해당 하위 항목으로 전파됩니다.

## 제한 사항

- 하위 에이전트 공지는 **최선의 노력**으로 수행됩니다. Gateway가 재시작되면 대기 중인 "announce back" 작업은 손실됩니다.
- 하위 에이전트는 여전히 같은 gateway 프로세스 리소스를 공유합니다. `maxConcurrent`를 안전 밸브로 취급하세요.
- `sessions_spawn`은 항상 비차단입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트는 `AGENTS.md` + `TOOLS.md`만 주입합니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` 없음).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 깊이 2가 권장됩니다.
- `maxChildrenPerAgent`는 세션당 활성 하위 항목 수를 제한합니다(기본값 `5`, 범위 `1–20`).

## 관련 항목

- [ACP 에이전트](/ko/tools/acp-agents)
- [에이전트 전송](/ko/tools/agent-send)
- [백그라운드 작업](/ko/automation/tasks)
- [다중 에이전트 sandbox 도구](/ko/tools/multi-agent-sandbox-tools)
