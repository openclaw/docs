---
read_when:
    - 에이전트를 통해 백그라운드 또는 병렬 작업을 수행하려고 합니다
    - '`sessions_spawn` 또는 하위 에이전트 도구 정책을 변경하고 있습니다'
    - 스레드에 바인딩된 하위 에이전트 세션을 구현하거나 문제 해결 중입니다
sidebarTitle: Sub-agents
summary: 요청자 채팅에 결과를 다시 알려주는 격리된 백그라운드 에이전트 실행 생성하기
title: 하위 에이전트
x-i18n:
    generated_at: "2026-04-26T11:41:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7f2f1b8ae08026dd0f8c1b466bb7a8b044ae1d12c2ae61735dcf9f380179986
    source_path: tools/subagents.md
    workflow: 15
---

하위 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다.
이들은 자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며,
완료되면 **요청자 채팅**
채널에 결과를 다시 **알립니다**. 각 하위 에이전트 실행은
[백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

주요 목표:

- main 실행을 막지 않고 "조사 / 장기 작업 / 느린 도구" 작업을 병렬화
- 기본적으로 하위 에이전트를 격리 유지(세션 분리 + 선택적 샌드박싱)
- 도구 표면이 오용되기 어렵도록 유지: 하위 에이전트는 기본적으로 세션 도구를 받지 않음
- orchestration 패턴을 위한 구성 가능한 중첩 깊이 지원

<Note>
**비용 참고:** 기본적으로 각 하위 에이전트는 자체 컨텍스트와 토큰 사용량을 가집니다. 무겁거나 반복적인 작업에는 하위 에이전트에 더 저렴한 model을 설정하고,
main 에이전트는 더 높은 품질의 model에 두세요. `agents.defaults.subagents.model` 또는 에이전트별 재정의로 구성합니다. 자식이 실제로 요청자의 현재 transcript가 필요할 때는 해당 spawn 하나에 대해 에이전트가 `context: "fork"`를 요청할 수 있습니다.
</Note>

## 슬래시 명령

현재 세션의 하위 에이전트 실행을 검사하거나 제어하려면 `/subagents`를 사용하세요:

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
transcript 경로, cleanup)를 표시합니다. 제한되고 안전 필터가 적용된
recall 뷰에는 `sessions_history`를 사용하세요. 원시 전체 transcript가 필요하면 디스크의 transcript 경로를 검사하세요.

### 스레드 바인딩 제어

이 명령들은 영구 스레드 바인딩을 지원하는 채널에서 동작합니다.
아래 [스레드 지원 채널](#thread-supporting-channels)을 참조하세요.

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### spawn 동작

`/subagents spawn`은 백그라운드 하위 에이전트를 사용자 명령으로 시작하며(내부 relay가 아님),
실행이 끝나면 요청자 채팅으로 최종 완료 업데이트 하나를 전송합니다.

<AccordionGroup>
  <Accordion title="비차단, 푸시 기반 완료">
    - spawn 명령은 비차단입니다. 즉시 run id를 반환합니다.
    - 완료 시 하위 에이전트는 요청자 채팅 채널에 요약/결과 메시지를 다시 알립니다.
    - 완료는 푸시 기반입니다. 한번 생성되면 완료를 기다리기 위해 `/subagents list`, `sessions_list`, `sessions_history`를 루프로 폴링하지 마세요. 디버깅이나 개입을 위해 필요할 때만 상태를 확인하세요.
    - 완료 시 OpenClaw는 announce cleanup 흐름이 계속되기 전에 해당 하위 에이전트 세션이 연 추적된 브라우저 탭/프로세스를 best-effort 방식으로 닫습니다.

  </Accordion>
  <Accordion title="수동 spawn 전달 복원력">
    - OpenClaw는 먼저 안정적인 idempotency key를 사용해 직접 `agent` 전달을 시도합니다.
    - 직접 전달이 실패하면 큐 라우팅으로 폴백합니다.
    - 큐 라우팅도 사용할 수 없으면 최종 포기 전까지 짧은 지수 백오프로 announce를 재시도합니다.
    - 완료 전달은 확인된 요청자 경로를 유지합니다. 가능한 경우 스레드 바인딩 또는 대화 바인딩 완료 경로가 우선하며, 완료 원점이 채널만 제공하는 경우 OpenClaw는 요청자 세션의 확인된 경로(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 대상/계정을 채워 직접 전달이 계속 가능하게 합니다.

  </Accordion>
  <Accordion title="완료 handoff 메타데이터">
    요청자 세션으로의 완료 handoff는 런타임에서 생성되는
    내부 컨텍스트(사용자가 작성한 텍스트가 아님)이며 다음을 포함합니다:

    - `Result` — 최신 표시 가능한 `assistant` 응답 텍스트, 없으면 정제된 최신 tool/toolResult 텍스트. 최종 실패한 실행은 캡처된 응답 텍스트를 재사용하지 않습니다.
    - `Status` — `completed successfully` / `failed` / `timed out` / `unknown`.
    - 간결한 런타임/token 통계.
    - 요청자 에이전트에게 원시 내부 메타데이터를 전달하지 말고 일반 assistant 음성으로 다시 쓰라고 지시하는 전달 지침.

  </Accordion>
  <Accordion title="모드와 ACP 런타임">
    - `--model`과 `--thinking`은 해당 실행에 대해서만 기본값을 재정의합니다.
    - 완료 후 세부 정보와 출력을 검사하려면 `info`/`log`를 사용하세요.
    - `/subagents spawn`은 일회성 모드(`mode: "run"`)입니다. 영구적인 스레드 바인딩 세션에는 `thread: true`와 `mode: "session"`을 사용한 `sessions_spawn`을 사용하세요.
    - ACP harness 세션(Claude Code, Gemini CLI, OpenCode, 또는 명시적 Codex ACP/acpx)의 경우 도구가 해당 런타임을 광고하면 `runtime: "acp"`와 함께 `sessions_spawn`을 사용하세요. 완료 또는 에이전트 간 루프를 디버깅할 때는 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참조하세요. `codex` Plugin이 활성화된 경우 Codex 채팅/스레드 제어는 사용자가 ACP/acpx를 명시적으로 요청하지 않는 한 ACP보다 `/codex ...`를 우선해야 합니다.
    - ACP가 활성화되고, 요청자가 샌드박스되지 않았으며, `acpx` 같은 백엔드 Plugin이 로드되기 전까지 OpenClaw는 `runtime: "acp"`를 숨깁니다. `runtime: "acp"`는 외부 ACP harness id 또는 `runtime.type="acp"`인 `agents.list[]` 항목을 기대합니다. `agents_list`의 일반 OpenClaw config 에이전트에는 기본 하위 에이전트 런타임을 사용하세요.

  </Accordion>
</AccordionGroup>

## 컨텍스트 모드

네이티브 하위 에이전트는 호출자가 현재 transcript를 fork하라고 명시적으로 요청하지 않는 한 격리된 상태로 시작합니다.

| 모드 | 언제 사용할지 | 동작 |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 새로운 조사, 독립적인 구현, 느린 도구 작업, 또는 작업 텍스트로 브리핑할 수 있는 모든 것 | 깨끗한 자식 transcript를 생성합니다. 이것이 기본값이며 토큰 사용량을 더 낮게 유지합니다. |
| `fork` | 현재 대화, 이전 도구 결과, 또는 요청자 transcript에 이미 있는 미묘한 지침에 의존하는 작업 | 자식이 시작되기 전에 요청자 transcript를 자식 세션으로 분기합니다. |

`fork`는 신중하게 사용하세요. 이는 컨텍스트에 민감한 위임을 위한 것이지,
명확한 작업 프롬프트 작성을 대체하는 것이 아닙니다.

## 도구: `sessions_spawn`

전역 `subagent` lane에서 `deliver: false`로 하위 에이전트 실행을 시작한 뒤,
announce 단계를 실행하고 해당 announce 응답을 요청자
채팅 채널에 게시합니다.

**기본값:**

- **Model:** `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않으면 호출자를 상속합니다. 명시적인 `sessions_spawn.model`이 있으면 여전히 그것이 우선합니다.
- **Thinking:** `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않으면 호출자를 상속합니다. 명시적인 `sessions_spawn.thinking`이 있으면 여전히 그것이 우선합니다.
- **실행 타임아웃:** `sessions_spawn.runTimeoutSeconds`가 생략되면 OpenClaw는 설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 사용하고, 그렇지 않으면 `0`(타임아웃 없음)으로 폴백합니다.

### 도구 매개변수

<ParamField path="task" type="string" required>
  하위 에이전트를 위한 작업 설명입니다.
</ParamField>
<ParamField path="label" type="string">
  선택적 사람이 읽을 수 있는 레이블.
</ParamField>
<ParamField path="agentId" type="string">
  `subagents.allowAgents`에서 허용된 경우 다른 에이전트 id 아래에서 생성합니다.
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp`는 외부 ACP harness(`claude`, `droid`, `gemini`, `opencode`, 또는 명시적으로 요청된 Codex ACP/acpx) 및 `runtime.type`이 `acp`인 `agents.list[]` 항목에만 사용합니다.
</ParamField>
<ParamField path="model" type="string">
  하위 에이전트 model 재정의. 잘못된 값은 건너뛰고, 도구 결과에 경고를 남긴 채 기본 model로 하위 에이전트를 실행합니다.
</ParamField>
<ParamField path="thinking" type="string">
  하위 에이전트 실행의 thinking 수준 재정의.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`가 기본값이고, 그렇지 않으면 `0`입니다. 설정되면 N초 후 하위 에이전트 실행이 중단됩니다.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  `true`이면 이 하위 에이전트 세션에 대해 채널 스레드 바인딩을 요청합니다.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `thread: true`이고 `mode`가 생략되면 기본값은 `session`이 됩니다. `mode: "session"`은 `thread: true`가 필요합니다.
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"`는 announce 직후 즉시 보관합니다(이름 변경을 통해 transcript는 여전히 유지).
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require`는 대상 자식 런타임이 샌드박스되지 않은 경우 spawn을 거부합니다.
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork`는 요청자의 현재 transcript를 자식 세션으로 분기합니다. 네이티브 하위 에이전트 전용입니다. 자식이 현재 transcript가 필요할 때만 `fork`를 사용하세요.
</ParamField>

<Warning>
`sessions_spawn`은 채널 전달 매개변수(`target`,
`channel`, `to`, `threadId`, `replyTo`, `transport`)를 받지 **않습니다**. 전달에는
생성된 실행 내부에서 `message`/`sessions_send`를 사용하세요.
</Warning>

## 스레드 바인딩 세션

채널에 스레드 바인딩이 활성화되어 있으면 하위 에이전트는
스레드에 바인딩된 상태로 유지될 수 있으므로, 해당 스레드의 후속 사용자 메시지가 계속 같은 하위 에이전트 세션으로 라우팅됩니다.

### 스레드 지원 채널

현재 지원되는 채널은 **Discord**뿐입니다. Discord는
영구적인 스레드 바인딩 하위 에이전트 세션(`thread: true`를 사용한 `sessions_spawn`), 수동 스레드 제어(`-/focus`, `/unfocus`, `/agents`,
`/session idle`, `/session max-age`), 그리고 어댑터 키
`channels.discord.threadBindings.enabled`,
`channels.discord.threadBindings.idleHours`,
`channels.discord.threadBindings.maxAgeHours`,
`channels.discord.threadBindings.spawnSubagentSessions`
를 지원합니다.

### 빠른 흐름

<Steps>
  <Step title="spawn">
    `thread: true`(선택적으로 `mode: "session"`도 함께)를 사용한 `sessions_spawn`.
  </Step>
  <Step title="바인드">
    OpenClaw는 활성 채널에서 해당 세션 대상을 위한 스레드를 생성하거나 바인드합니다.
  </Step>
  <Step title="후속 메시지 라우팅">
    해당 스레드의 응답과 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
  </Step>
  <Step title="타임아웃 확인">
    비활성 자동 unfocus를 확인/업데이트하려면 `/session idle`을,
    하드 상한을 제어하려면 `/session max-age`를 사용하세요.
  </Step>
  <Step title="분리">
    수동으로 분리하려면 `/unfocus`를 사용하세요.
  </Step>
</Steps>

### 수동 제어

| 명령 | 효과 |
| ------------------ | --------------------------------------------------------------------- |
| `/focus <target>` | 현재 스레드(또는 새 스레드 생성)를 하위 에이전트/세션 대상에 바인드 |
| `/unfocus` | 현재 바인딩된 스레드의 바인딩 제거 |
| `/agents` | 활성 실행과 바인딩 상태 나열(`thread:<id>` 또는 `unbound`) |
| `/session idle` | idle 자동 unfocus 확인/업데이트(포커스된 바인딩 스레드만) |
| `/session max-age` | 하드 상한 확인/업데이트(포커스된 바인딩 스레드만) |

### config 스위치

- **전역 기본값:** `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
- **채널 재정의 및 spawn 자동 바인드 키**는 어댑터별입니다. 자세한 내용은 위의 [스레드 지원 채널](#thread-supporting-channels)을 참조하세요.

현재 어댑터 세부 정보는 [Configuration reference](/ko/gateway/configuration-reference) 및
[Slash commands](/ko/tools/slash-commands)를 참조하세요.

### allowlist

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  `agentId`를 통해 대상으로 지정할 수 있는 에이전트 id 목록입니다(`["*"]`는 아무거나 허용). 기본값: 요청자 에이전트만.
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 사용하는 기본 대상 에이전트 allowlist입니다.
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  `agentId`가 생략된 `sessions_spawn` 호출을 차단합니다(명시적 profile 선택 강제). 에이전트별 재정의: `agents.list[].subagents.requireAgentId`.
</ParamField>

요청자 세션이 샌드박스된 상태이면 `sessions_spawn`은
샌드박스 없이 실행될 대상을 거부합니다.

### 검색

`sessions_spawn`에 대해 현재 허용된 에이전트 id를 보려면 `agents_list`를 사용하세요. 응답에는 나열된 각 에이전트의 유효한 model과 내장 런타임 메타데이터가 포함되므로 호출자는 PI, Codex
app-server, 기타 구성된 네이티브 런타임을 구분할 수 있습니다.

### 자동 보관

- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes`(기본값 `60`) 후 자동으로 보관됩니다.
- 보관은 `sessions.delete`를 사용하며 transcript를 `*.deleted.<timestamp>`로 이름 변경합니다(같은 폴더).
- `cleanup: "delete"`는 announce 직후 즉시 보관합니다(이름 변경을 통해 transcript는 여전히 유지).
- 자동 보관은 best-effort입니다. gateway가 재시작되면 보류 중인 타이머는 유실됩니다.
- `runTimeoutSeconds`는 자동 보관을 하지 않습니다. 실행만 중지합니다. 세션은 자동 보관까지 남아 있습니다.
- 자동 보관은 depth-1과 depth-2 세션에 동일하게 적용됩니다.
- 브라우저 cleanup은 보관 cleanup과 별개입니다. transcript/세션 레코드를 유지하더라도 실행이 끝나면 추적된 브라우저 탭/프로세스를 best-effort 방식으로 닫습니다.

## 중첩된 하위 에이전트

기본적으로 하위 에이전트는 자기 자신의 하위 에이전트를 생성할 수 없습니다
(`maxSpawnDepth: 1`). 중첩을 한 단계 허용하려면 `maxSpawnDepth: 2`로 설정하세요 — **orchestrator pattern**: main → orchestrator 하위 에이전트 →
worker 하위-하위 에이전트.

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 하위 에이전트가 자식을 생성할 수 있도록 허용(기본값: 1)
        maxChildrenPerAgent: 5, // 에이전트 세션당 최대 활성 자식 수(기본값: 5)
        maxConcurrent: 8, // 전역 동시성 lane 상한(기본값: 8)
        runTimeoutSeconds: 900, // 생략 시 sessions_spawn의 기본 타임아웃(0 = 타임아웃 없음)
      },
    },
  },
}
```

### 깊이 수준

| 깊이 | 세션 키 형태 | 역할 | 생성 가능 여부 |
| ----- | -------------------------------------------- | --------------------------------------------- | ---------------------------- |
| 0 | `agent:<id>:main` | main 에이전트 | 항상 가능 |
| 1 | `agent:<id>:subagent:<uuid>` | 하위 에이전트(depth 2 허용 시 orchestrator) | `maxSpawnDepth >= 2`일 때만 |
| 2 | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 하위-하위 에이전트(leaf worker) | 절대 불가 |

### announce 체인

결과는 체인을 따라 위로 흐릅니다:

1. depth-2 worker 완료 → 부모(depth-1 orchestrator)에게 announce
2. depth-1 orchestrator가 announce를 받고 결과를 합성한 뒤 완료 → main에 announce
3. main 에이전트가 announce를 받고 사용자에게 전달

각 수준은 자신의 직접 자식에게서 온 announce만 볼 수 있습니다.

<Note>
**운영 지침:** 자식 작업은 한 번 시작한 뒤 완료
이벤트를 기다리세요. `sessions_list`,
`sessions_history`, `/subagents list`, `exec` sleep 명령을 중심으로 폴링 루프를 만들지 마세요.
`sessions_list`와 `/subagents list`는 자식 세션 관계를
라이브 작업에 집중되게 유지합니다. 살아 있는 자식은 계속 연결 상태로 남고, 종료된 자식은 짧은 최근 창 동안 보이며, 오래된 저장소 전용 자식 링크는 freshness 창 이후 무시됩니다. 이렇게 하면 오래된 `spawnedBy` /
`parentSessionKey` 메타데이터가 재시작 후 유령 자식을 되살리는 것을 방지합니다. 이미 최종 답변을 보낸 뒤 자식 완료 이벤트가 도착했다면, 올바른 후속 응답은 정확한 silent token
`NO_REPLY` / `no_reply`입니다.
</Note>

### 깊이별 도구 정책

- 역할과 제어 범위는 spawn 시점에 세션 메타데이터에 기록됩니다. 이렇게 하면 평면 또는 복원된 세션 키가 실수로 다시 orchestrator 권한을 얻는 것을 방지할 수 있습니다.
- **Depth 1 (`maxSpawnDepth >= 2`인 orchestrator):** 자식을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다. 다른 세션/시스템 도구는 계속 거부됩니다.
- **Depth 1 (`maxSpawnDepth == 1`인 leaf):** 세션 도구 없음(현재 기본 동작).
- **Depth 2 (leaf worker):** 세션 도구 없음 — `sessions_spawn`은 depth 2에서 항상 거부됩니다. 더 이상의 자식 생성 불가.

### 에이전트별 생성 제한

어떤 깊이의 에이전트 세션이든 한 번에 최대 `maxChildrenPerAgent`
(기본값 `5`)개의 활성 자식만 가질 수 있습니다. 이렇게 하면 단일 orchestrator에서 통제 불가능한 fan-out을 방지할 수 있습니다.

### 연쇄 중지

depth-1 orchestrator를 중지하면 모든 depth-2
자식도 자동으로 중지됩니다:

- main 채팅의 `/stop`은 모든 depth-1 에이전트를 중지하고 그들의 depth-2 자식까지 연쇄 중지합니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식까지 연쇄 중지합니다.
- `/subagents kill all`은 요청자의 모든 하위 에이전트를 중지하고 연쇄 중지합니다.

## 인증

하위 에이전트 인증은 세션 유형이 아니라 **에이전트 id**로 확인됩니다:

- 하위 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- main 에이전트의 인증 프로필은 **폴백**으로 병합되며, 충돌 시 에이전트 프로필이 main 프로필을 재정의합니다.

병합은 additive 방식이므로 main 프로필은 항상
폴백으로 사용할 수 있습니다. 에이전트별 완전한 인증 격리는 아직 지원되지 않습니다.

## announce

하위 에이전트는 announce 단계를 통해 다시 보고합니다:

- announce 단계는 요청자 세션이 아니라 하위 에이전트 세션 내부에서 실행됩니다.
- 하위 에이전트가 정확히 `ANNOUNCE_SKIP`로 응답하면 아무것도 게시되지 않습니다.
- 최신 assistant 텍스트가 정확한 silent token `NO_REPLY` / `no_reply`인 경우, 이전에 표시 가능한 진행 내용이 있었더라도 announce 출력은 억제됩니다.

전달은 요청자 깊이에 따라 달라집니다:

- 최상위 요청자 세션은 외부 전달(`deliver=true`)이 있는 후속 `agent` 호출을 사용합니다.
- 중첩된 요청자 하위 에이전트 세션은 내부 후속 주입(`deliver=false`)을 받으므로 orchestrator가 세션 내에서 자식 결과를 합성할 수 있습니다.
- 중첩된 요청자 하위 에이전트 세션이 사라졌다면, 가능할 경우 OpenClaw는 해당 세션의 요청자로 폴백합니다.

최상위 요청자 세션의 경우 완료 모드 직접 전달은 먼저 바인딩된 대화/스레드 경로와 hook 재정의를 확인한 뒤,
누락된 채널 대상 필드를 요청자 세션에 저장된 경로로부터 채웁니다.
이렇게 하면 완료 원점이 채널만 식별하더라도 완료가 올바른 채팅/토픽에 유지됩니다.

중첩된 완료 결과를 만들 때 자식 완료 집계는 현재 요청자 실행에만 범위가 지정되므로, 오래된 이전 실행의 자식 출력이 현재 announce에 섞여 들어가지 않습니다. announce 응답은 채널 어댑터에서 가능할 경우 스레드/토픽 라우팅을 유지합니다.

### announce 컨텍스트

announce 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다:

| 필드 | 출처 |
| -------------- | ------------------------------------------------------------------------------------------------------------- |
| Source | `subagent` 또는 `cron` |
| Session ids | 자식 세션 키/id |
| Type | announce 유형 + 작업 레이블 |
| Status | 모델 텍스트가 아니라 런타임 결과로부터 확인됨(`success`, `error`, `timeout`, 또는 `unknown`) |
| Result content | 최신 표시 가능한 assistant 텍스트, 없으면 정제된 최신 tool/toolResult 텍스트 |
| Follow-up | 언제 응답하고 언제 조용히 있을지를 설명하는 지침 |

최종 실패한 실행은 캡처된
응답 텍스트를 재생하지 않고 실패 상태를 보고합니다. 타임아웃 시 자식이 도구 호출까지만 진행했다면, announce는 원시 도구 출력을 재생하는 대신 해당 기록을 짧은 부분 진행 요약으로 축약할 수 있습니다.

### 통계 줄

announce payload에는 끝에 통계 줄이 포함됩니다(래핑된 경우에도 포함):

- 런타임(예: `runtime 5m12s`)
- token 사용량(input/output/total)
- model 가격이 구성된 경우 예상 비용(`models.providers.*.models[].cost`)
- main 에이전트가 `sessions_history`를 통해 기록을 가져오거나 디스크 파일을 검사할 수 있도록 하는 `sessionKey`, `sessionId`, transcript 경로

내부 메타데이터는 orchestration용이며, 사용자 대상 응답은 정상 assistant 음성으로 다시 써야 합니다.

### 왜 `sessions_history`를 선호하나요

`sessions_history`가 더 안전한 orchestration 경로입니다:

- assistant recall이 먼저 정규화됩니다: thinking 태그 제거, `<relevant-memories>` / `<relevant_memories>` scaffolding 제거, 일반 텍스트 tool-call XML payload 블록(``<tool_call>``, `<function_call>`, `<tool_calls>`, `<function_calls>`) 제거, 깔끔하게 닫히지 않은 잘린 payload도 포함, 낮춰진 tool-call/result scaffolding 및 historical-context 마커 제거, 유출된 model 제어 토큰(``<|assistant|>``, 다른 ASCII `<|...|>`, 전각 `<｜...｜>`) 제거, 잘못된 MiniMax tool-call XML 제거.
- 자격 증명/token처럼 보이는 텍스트는 비공개 처리됩니다.
- 긴 블록은 잘릴 수 있습니다.
- 매우 큰 기록은 오래된 행을 제거하거나 oversized 행을 `[sessions_history omitted: message too large]`로 대체할 수 있습니다.
- 원시 디스크 transcript 검사는 바이트 단위 전체 transcript가 필요할 때의 폴백입니다.

## 도구 정책

하위 에이전트는 먼저 부모 또는 대상 에이전트와 동일한 프로필 및 도구 정책 파이프라인을 사용합니다. 그 후 OpenClaw가 하위 에이전트 제한 레이어를 적용합니다.

제한적인 `tools.profile`이 없으면 하위 에이전트는 세션 도구와
시스템 도구를 제외한 **모든 도구**를 받습니다:

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

여기서도 `sessions_history`는 제한되고 정제된 recall 뷰로 유지되며
원시 transcript 덤프가 아닙니다.

`maxSpawnDepth >= 2`일 때 depth-1 orchestrator 하위 에이전트는
자식을 관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`,
`sessions_history`를 받습니다.

### config를 통한 재정의
__OC_I18N_900003__
`tools.subagents.tools.allow`는 최종 allow-only 필터입니다. 이미 확인된 도구 세트를 더 좁힐 수는 있지만, `tools.profile`이 제거한 도구를 **다시 추가할 수는 없습니다**. 예를 들어 `tools.profile: "coding"`에는
`web_search`/`web_fetch`는 포함되지만 `browser` 도구는 포함되지 않습니다.
coding 프로필 하위 에이전트가 브라우저 자동화를 사용하게 하려면 프로필 단계에서 browser를 추가하세요:
__OC_I18N_900004__
하나의 에이전트만 브라우저 자동화를 가져야 한다면 에이전트별 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.

## 동시성

하위 에이전트는 전용 in-process 큐 lane을 사용합니다:

- **Lane 이름:** `subagent`
- **동시성:** `agents.defaults.subagents.maxConcurrent` (기본값 `8`)

## 활성 상태 및 복구

OpenClaw는 `endedAt`의 부재를
하위 에이전트가 여전히 살아 있다는 영구적인 증거로 취급하지 않습니다. stale-run 창보다 오래된 미종료 실행은 `/subagents list`, 상태 요약,
descendant 완료 게이팅, 세션별 동시성 검사에서 더 이상 활성/보류 중으로 계산되지 않습니다.

gateway 재시작 후에는 자식 세션이 `abortedLastRun: true`로 표시되지 않은 한
오래된 미종료 복원 실행은 정리됩니다. 이렇게 재시작으로 중단된 자식 세션은
하위 에이전트 orphan 복구 흐름을 통해 복구할 수 있으며,
이 흐름은 `aborted` 마커를 지우기 전에 합성된 resume 메시지를 보냅니다.

<Note>
하위 에이전트 spawn이 Gateway `PAIRING_REQUIRED` /
`scope-upgrade`로 실패하면 pairing 상태를 편집하기 전에 RPC 호출자를 확인하세요.
내부 `sessions_spawn` orchestration은
직접 loopback 공유 token/password 인증을 통해
`client.id: "gateway-client"`와 `client.mode: "backend"`로 연결되어야 합니다.
이 경로는 CLI의 paired-device scope 기준선에 의존하지 않습니다.
원격 호출자, 명시적
`deviceIdentity`, 명시적 device-token 경로, 브라우저/node 클라이언트는
scope 업그레이드를 위해 여전히 일반 디바이스 승인이 필요합니다.
</Note>

## 중지

- 요청자 채팅에 `/stop`을 보내면 요청자 세션이 중단되고, 그 세션에서 생성된 활성 하위 에이전트 실행도 모두 중지되며, 중첩된 자식까지 연쇄 중지됩니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식까지 연쇄 중지합니다.

## 제한 사항

- 하위 에이전트 announce는 **best-effort**입니다. gateway가 재시작되면 보류 중인 "다시 announce" 작업은 유실됩니다.
- 하위 에이전트는 여전히 같은 gateway 프로세스 리소스를 공유하므로 `maxConcurrent`는 안전 밸브로 취급하세요.
- `sessions_spawn`은 항상 비차단입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트에는 `AGENTS.md` + `TOOLS.md`만 주입됩니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`는 없음).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 depth 2를 권장합니다.
- `maxChildrenPerAgent`는 세션당 활성 자식 수를 제한합니다(기본값 `5`, 범위 `1–20`).

## 관련

- [ACP agents](/ko/tools/acp-agents)
- [Agent send](/ko/tools/agent-send)
- [백그라운드 작업](/ko/automation/tasks)
- [다중 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
