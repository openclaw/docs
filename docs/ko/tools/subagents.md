---
read_when:
    - 에이전트를 통해 백그라운드/병렬 작업을 수행하려는 경우
    - '`sessions_spawn` 또는 하위 에이전트 도구 정책을 변경하는 경우'
    - 스레드에 바인딩된 하위 에이전트 세션을 구현하거나 문제를 해결하는 경우
summary: '하위 에이전트: 결과를 요청자 채팅에 다시 알리는 격리된 에이전트 실행 생성하기'
title: 하위 에이전트
x-i18n:
    generated_at: "2026-04-25T18:23:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70195000c4326baba38a9a096dc8d6db178f754f345ad05d122902ee1216ab1c
    source_path: tools/subagents.md
    workflow: 15
---

하위 에이전트는 기존 에이전트 실행에서 생성되는 백그라운드 에이전트 실행입니다. 이들은 자체 세션(`agent:<agentId>:subagent:<uuid>`)에서 실행되며, 완료되면 결과를 요청자 채팅 채널에 다시 **알립니다**. 각 하위 에이전트 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.

## 슬래시 명령

현재 세션의 하위 에이전트 실행을 확인하거나 제어하려면 `/subagents`를 사용하세요.

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

스레드 바인딩 제어:

이 명령들은 영구 스레드 바인딩을 지원하는 채널에서 작동합니다. 아래의 **스레드 지원 채널**을 참고하세요.

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info`는 실행 메타데이터(상태, 타임스탬프, 세션 ID, 기록 경로, 정리)를 표시합니다.
제한되고 안전 필터링된 회상 뷰에는 `sessions_history`를 사용하고,
원시 전체 기록이 필요할 때는 디스크의 기록 경로를 확인하세요.

### 생성 동작

`/subagents spawn`은 내부 릴레이가 아니라 사용자 명령으로 백그라운드 하위 에이전트를 시작하며, 실행이 끝나면 요청자 채팅에 최종 완료 업데이트를 한 번 보냅니다.

- 생성 명령은 논블로킹입니다. 즉시 실행 ID를 반환합니다.
- 완료 시 하위 에이전트는 요청자 채팅 채널에 요약/결과 메시지를 다시 알립니다.
- 완료 전달은 푸시 기반입니다. 생성한 후에는 완료를 기다리기 위해
  `/subagents list`, `sessions_list`, `sessions_history`를 루프로 폴링하지 마세요.
  상태 확인은 디버깅이나 개입이 필요할 때만 수행하세요.
- 완료 시 OpenClaw는 알림 정리 흐름이 계속되기 전에 해당 하위 에이전트 세션이 연
  추적된 브라우저 탭/프로세스를 가능한 범위 내에서 닫습니다.
- 수동 생성의 경우 전달은 복원력을 가집니다.
  - OpenClaw는 먼저 안정적인 멱등성 키로 직접 `agent` 전달을 시도합니다.
  - 직접 전달이 실패하면 대기열 라우팅으로 대체합니다.
  - 대기열 라우팅도 사용할 수 없으면 최종 포기 전에 짧은 지수 백오프로 알림을 재시도합니다.
- 완료 전달은 해석된 요청자 라우트를 유지합니다.
  - 가능한 경우 스레드 바인딩 또는 대화 바인딩 완료 라우트가 우선합니다
  - 완료 출처가 채널만 제공하는 경우, 직접 전달이 계속 작동하도록 OpenClaw는 요청자 세션의 해석된 라우트(`lastChannel` / `lastTo` / `lastAccountId`)에서 누락된 target/account를 채웁니다
- 요청자 세션으로의 완료 핸드오프는 런타임에서 생성된 내부 컨텍스트(사용자 작성 텍스트 아님)이며, 다음을 포함합니다.
  - `Result`(가장 최근의 표시 가능한 `assistant` 답변 텍스트, 없으면 정제된 최신 tool/toolResult 텍스트. 최종 실패 실행은 캡처된 답변 텍스트를 재사용하지 않음)
  - `Status`(`completed successfully` / `failed` / `timed out` / `unknown`)
  - 간략한 런타임/토큰 통계
  - 요청자 에이전트에게 원시 내부 메타데이터를 전달하지 말고 일반 assistant 음성으로 다시 작성하라고 지시하는 전달 지침
- `--model`과 `--thinking`은 해당 특정 실행의 기본값을 재정의합니다.
- 완료 후 세부 정보와 출력을 확인하려면 `info`/`log`를 사용하세요.
- `/subagents spawn`은 일회성 모드(`mode: "run"`)입니다. 영구적인 스레드 바인딩 세션에는 `thread: true`와 `mode: "session"`으로 `sessions_spawn`을 사용하세요.
- ACP 하니스 세션(Codex, Claude Code, Gemini CLI)에는 `runtime: "acp"`로 `sessions_spawn`을 사용하고, 특히 완료나 에이전트 간 루프를 디버깅할 때는 [ACP Agents](/ko/tools/acp-agents), 특히 [ACP 전달 모델](/ko/tools/acp-agents#delivery-model)을 참고하세요.

주요 목표:

- 메인 실행을 막지 않고 "조사 / 장기 작업 / 느린 도구" 작업을 병렬화하기
- 기본적으로 하위 에이전트를 격리된 상태로 유지하기(세션 분리 + 선택적 샌드박싱)
- 도구 surface가 오용되기 어렵도록 유지하기: 하위 에이전트는 기본적으로 세션 도구를 받지 않습니다.
- 오케스트레이터 패턴을 위한 구성 가능한 중첩 깊이 지원

비용 참고: 각 하위 에이전트는 기본적으로 자체 컨텍스트와 토큰 사용량을 가집니다. 무겁거나
반복적인 작업의 경우 하위 에이전트에는 더 저렴한 모델을 설정하고, 메인 에이전트는 더
품질이 높은 모델로 유지하세요. 이는 `agents.defaults.subagents.model` 또는 에이전트별
재정의를 통해 구성할 수 있습니다. 자식이 실제로 요청자의 현재 기록을 필요로 할 때는, 해당 생성에서만
`context: "fork"`를 요청할 수 있습니다.

## 컨텍스트 모드

기본 하위 에이전트는 호출자가 현재 기록을 포크해 달라고 명시적으로 요청하지 않는 한
격리된 상태로 시작합니다.

| 모드       | 사용 시점                                                                                                                             | 동작                                                                              |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `isolated` | 새로운 조사, 독립적인 구현, 느린 도구 작업, 또는 작업 텍스트로 브리핑할 수 있는 모든 경우                                             | 깨끗한 자식 기록을 만듭니다. 이것이 기본값이며 토큰 사용량도 더 낮게 유지합니다. |
| `fork`     | 현재 대화, 이전 도구 결과, 또는 요청자 기록에 이미 있는 미묘한 지시에 의존하는 작업                                                   | 자식이 시작되기 전에 요청자 기록을 자식 세션으로 분기합니다.                     |

`fork`는 신중하게 사용하세요. 이는 컨텍스트에 민감한 위임용이지,
명확한 작업 프롬프트를 작성하는 것을 대체하는 용도가 아닙니다.

## 도구

`sessions_spawn`을 사용하세요.

- 하위 에이전트 실행 시작(`deliver: false`, 전역 lane: `subagent`)
- 그런 다음 알림 단계를 실행하고 알림 답변을 요청자 채팅 채널에 게시
- 기본 모델: `agents.defaults.subagents.model`(또는 에이전트별 `agents.list[].subagents.model`)을 설정하지 않으면 호출자를 상속합니다. 명시적인 `sessions_spawn.model`이 있으면 그것이 우선합니다.
- 기본 thinking: `agents.defaults.subagents.thinking`(또는 에이전트별 `agents.list[].subagents.thinking`)을 설정하지 않으면 호출자를 상속합니다. 명시적인 `sessions_spawn.thinking`이 있으면 그것이 우선합니다.
- 기본 실행 제한 시간: `sessions_spawn.runTimeoutSeconds`가 생략되면, 설정된 경우 OpenClaw는 `agents.defaults.subagents.runTimeoutSeconds`를 사용하고, 그렇지 않으면 `0`(제한 없음)으로 대체합니다.

도구 매개변수:

- `task`(필수)
- `label?`(선택 사항)
- `agentId?`(선택 사항, 허용된 경우 다른 에이전트 ID 아래에서 생성)
- `model?`(선택 사항, 하위 에이전트 모델 재정의. 잘못된 값은 건너뛰고, 도구 결과에 경고를 남긴 채 하위 에이전트는 기본 모델로 실행됨)
- `thinking?`(선택 사항, 하위 에이전트 실행의 thinking 수준 재정의)
- `runTimeoutSeconds?`(설정된 경우 `agents.defaults.subagents.runTimeoutSeconds`를 기본값으로 사용하고, 그렇지 않으면 `0`; 설정하면 하위 에이전트 실행은 N초 후 중단됨)
- `thread?`(기본값 `false`; `true`면 이 하위 에이전트 세션에 채널 스레드 바인딩 요청)
- `mode?`(`run|session`)
  - 기본값은 `run`
  - `thread: true`이고 `mode`가 생략되면 기본값은 `session`
  - `mode: "session"`은 `thread: true`가 필요
- `cleanup?`(`delete|keep`, 기본값 `keep`)
- `sandbox?`(`inherit|require`, 기본값 `inherit`; `require`는 대상 자식 런타임이 샌드박싱되지 않았으면 생성을 거부)
- `context?`(`isolated|fork`, 기본값 `isolated`; 기본 하위 에이전트에만 적용)
  - `isolated`는 깨끗한 자식 기록을 만들며 기본값입니다.
  - `fork`는 요청자의 현재 기록을 자식 세션으로 분기하여 자식이 동일한 대화 컨텍스트로 시작하도록 합니다.
  - 자식이 현재 기록을 필요로 할 때만 `fork`를 사용하세요. 범위가 제한된 작업에는 `context`를 생략하세요.
- `sessions_spawn`은 채널 전달 매개변수(`target`, `channel`, `to`, `threadId`, `replyTo`, `transport`)를 받지 않습니다. 전달에는 생성된 실행에서 `message`/`sessions_send`를 사용하세요.

## 스레드 바인딩 세션

채널에서 스레드 바인딩이 활성화되면, 하위 에이전트는 스레드에 바인딩된 상태를 유지할 수 있으므로 해당 스레드의 후속 사용자 메시지는 계속 같은 하위 에이전트 세션으로 라우팅됩니다.

### 스레드를 지원하는 채널

- Discord(현재 지원되는 유일한 채널): 영구적인 스레드 바인딩 하위 에이전트 세션(`thread: true`로 `sessions_spawn`), 수동 스레드 제어(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`), 그리고 어댑터 키 `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`, `channels.discord.threadBindings.spawnSubagentSessions`를 지원합니다.

빠른 흐름:

1. `thread: true`(그리고 선택적으로 `mode: "session"`)와 함께 `sessions_spawn`으로 생성합니다.
2. OpenClaw가 활성 채널에서 해당 세션 대상에 스레드를 만들거나 바인딩합니다.
3. 해당 스레드의 답변과 후속 메시지는 바인딩된 세션으로 라우팅됩니다.
4. 비활동 자동 포커스 해제를 확인/업데이트하려면 `/session idle`을 사용하고, 강한 상한을 제어하려면 `/session max-age`를 사용하세요.
5. 수동으로 분리하려면 `/unfocus`를 사용하세요.

수동 제어:

- `/focus <target>`은 현재 스레드를 하위 에이전트/세션 대상에 바인딩합니다(또는 새로 만듭니다).
- `/unfocus`는 현재 바인딩된 스레드의 바인딩을 제거합니다.
- `/agents`는 활성 실행과 바인딩 상태(`thread:<id>` 또는 `unbound`)를 나열합니다.
- `/session idle`과 `/session max-age`는 포커스된 바인딩 스레드에서만 작동합니다.

구성 스위치:

- 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`
- 채널 재정의와 생성 자동 바인드 키는 어댑터별입니다. 위의 **스레드를 지원하는 채널**을 참고하세요.

현재 어댑터 세부 사항은 [구성 참조](/ko/gateway/configuration-reference) 및 [슬래시 명령](/ko/tools/slash-commands)을 참고하세요.

허용 목록:

- `agents.list[].subagents.allowAgents`: `agentId`를 통해 대상으로 지정할 수 있는 에이전트 ID 목록(`["*"]`는 아무 에이전트나 허용). 기본값: 요청자 에이전트만 허용.
- `agents.defaults.subagents.allowAgents`: 요청자 에이전트가 자체 `subagents.allowAgents`를 설정하지 않았을 때 사용하는 기본 대상 에이전트 허용 목록.
- 샌드박스 상속 가드: 요청자 세션이 샌드박싱되어 있으면, `sessions_spawn`은 샌드박싱 없이 실행될 대상을 거부합니다.
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`: `true`일 때 `agentId`를 생략한 `sessions_spawn` 호출을 차단합니다(명시적인 프로필 선택 강제). 기본값: false.

탐색:

- 현재 `sessions_spawn`에 허용된 에이전트 ID를 보려면 `agents_list`를 사용하세요.

자동 보관:

- 하위 에이전트 세션은 `agents.defaults.subagents.archiveAfterMinutes` 후 자동으로 보관됩니다(기본값: 60).
- 보관은 `sessions.delete`를 사용하며 기록 파일 이름을 `*.deleted.<timestamp>`로 바꿉니다(같은 폴더).
- `cleanup: "delete"`는 알림 직후 즉시 보관합니다(그래도 기록은 이름 변경으로 유지됨).
- 자동 보관은 best-effort 방식이며, gateway가 재시작되면 대기 중 타이머는 손실됩니다.
- `runTimeoutSeconds`는 자동 보관을 하지 않습니다. 실행만 중지합니다. 세션은 자동 보관 시점까지 유지됩니다.
- 자동 보관은 깊이 1과 깊이 2 세션에 동일하게 적용됩니다.
- 브라우저 정리는 보관 정리와 별개입니다. 기록/세션 레코드를 유지하더라도 실행이 끝나면 추적된 브라우저 탭/프로세스를 가능한 범위 내에서 닫습니다.

## 중첩 하위 에이전트

기본적으로 하위 에이전트는 자신의 하위 에이전트를 생성할 수 없습니다(`maxSpawnDepth: 1`). `maxSpawnDepth: 2`를 설정하면 한 단계의 중첩을 활성화할 수 있으며, 이 경우 **오케스트레이터 패턴**이 허용됩니다: 메인 → 오케스트레이터 하위 에이전트 → 작업자 하위-하위 에이전트.

### 활성화 방법

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 하위 에이전트가 자식을 생성하도록 허용(기본값: 1)
        maxChildrenPerAgent: 5, // 에이전트 세션당 최대 활성 자식 수(기본값: 5)
        maxConcurrent: 8, // 전역 동시성 lane 상한(기본값: 8)
        runTimeoutSeconds: 900, // 생략 시 sessions_spawn의 기본 제한 시간(0 = 제한 없음)
      },
    },
  },
}
```

### 깊이 수준

| 깊이 | 세션 키 형태                                | 역할                                          | 생성 가능 여부                |
| ---- | ------------------------------------------- | --------------------------------------------- | ----------------------------- |
| 0    | `agent:<id>:main`                           | 메인 에이전트                                 | 항상 가능                     |
| 1    | `agent:<id>:subagent:<uuid>`                | 하위 에이전트(`maxSpawnDepth >= 2`이면 오케스트레이터) | `maxSpawnDepth >= 2`일 때만 가능 |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 하위-하위 에이전트(리프 작업자)               | 절대 불가                     |

### 알림 체인

결과는 체인을 따라 위로 전달됩니다.

1. 깊이 2 작업자가 완료 → 부모(깊이 1 오케스트레이터)에게 알림
2. 깊이 1 오케스트레이터가 알림을 수신하고 결과를 종합한 뒤 완료 → 메인에 알림
3. 메인 에이전트가 알림을 수신하고 사용자에게 전달

각 수준은 자신의 직계 자식에게서 오는 알림만 봅니다.

운영 지침:

- 자식 작업은 한 번 시작한 뒤 완료 이벤트를 기다리세요. `sessions_list`, `sessions_history`, `/subagents list`, 또는
  `exec` sleep 명령을 중심으로 폴링 루프를 만들지 마세요.
- `sessions_list`와 `/subagents list`는 자식 세션 관계를 현재 진행 중인 작업에 집중시킵니다.
  실행 중인 자식은 계속 연결된 상태로 유지되고, 종료된 자식은 짧은 최근 창 동안 보이며,
  저장소에만 남아 있는 오래된 자식 링크는 신선도 창이 지나면 무시됩니다. 이렇게 하면 재시작 후
  오래된 `spawnedBy` / `parentSessionKey` 메타데이터 때문에 유령 자식이 다시 살아나는 일을 막습니다.
- 최종 답변을 이미 보낸 뒤 자식 완료 이벤트가 도착했다면,
  올바른 후속 응답은 정확한 무음 토큰 `NO_REPLY` / `no_reply`입니다.

### 깊이별 도구 정책

- 역할과 제어 범위는 생성 시점에 세션 메타데이터에 기록됩니다. 이렇게 하면 평평하거나 복원된 세션 키가 실수로 오케스트레이터 권한을 다시 얻는 일을 막을 수 있습니다.
- **깊이 1(오케스트레이터, `maxSpawnDepth >= 2`일 때)**: `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받아 자신의 자식을 관리할 수 있습니다. 다른 세션/시스템 도구는 계속 거부됩니다.
- **깊이 1(리프, `maxSpawnDepth == 1`일 때)**: 세션 도구 없음(현재 기본 동작)
- **깊이 2(리프 작업자)**: 세션 도구 없음 — 깊이 2에서는 `sessions_spawn`이 항상 거부됩니다. 더 이상의 자식을 생성할 수 없습니다.

### 에이전트별 생성 한도

각 에이전트 세션(모든 깊이)은 동시에 최대 `maxChildrenPerAgent`(기본값: 5)개의 활성 자식을 가질 수 있습니다. 이렇게 하면 단일 오케스트레이터에서 제어되지 않는 fan-out을 막을 수 있습니다.

### 연쇄 중지

깊이 1 오케스트레이터를 중지하면 모든 깊이 2 자식도 자동으로 중지됩니다.

- 메인 채팅의 `/stop`은 모든 깊이 1 에이전트를 중지하고 그 깊이 2 자식까지 연쇄 중지합니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식까지 연쇄 중지합니다.
- `/subagents kill all`은 요청자의 모든 하위 에이전트를 중지하고 연쇄 중지합니다.

## 인증

하위 에이전트 인증은 세션 유형이 아니라 **에이전트 ID**로 해석됩니다.

- 하위 에이전트 세션 키는 `agent:<agentId>:subagent:<uuid>`입니다.
- 인증 저장소는 해당 에이전트의 `agentDir`에서 로드됩니다.
- 메인 에이전트의 인증 프로필은 **대체값**으로 병합되며, 충돌 시 에이전트 프로필이 메인 프로필보다 우선합니다.

참고: 이 병합은 추가적이므로 메인 프로필은 항상 대체값으로 사용 가능합니다. 에이전트별 완전 격리 인증은 아직 지원되지 않습니다.

## 알림

하위 에이전트는 알림 단계를 통해 다시 보고합니다.

- 알림 단계는 요청자 세션이 아니라 하위 에이전트 세션 내부에서 실행됩니다.
- 하위 에이전트가 정확히 `ANNOUNCE_SKIP`로 응답하면 아무것도 게시되지 않습니다.
- 최신 assistant 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply`이면,
  이전에 표시 가능한 진행 상황이 있었더라도 알림 출력은 억제됩니다.
- 그 외에는 전달이 요청자 깊이에 따라 달라집니다.
  - 최상위 요청자 세션은 외부 전달이 있는 후속 `agent` 호출을 사용합니다(`deliver=true`)
  - 중첩된 요청자 하위 에이전트 세션은 오케스트레이터가 세션 내에서 자식 결과를 종합할 수 있도록 내부 후속 주입을 받습니다(`deliver=false`)
  - 중첩된 요청자 하위 에이전트 세션이 사라졌다면, 가능할 경우 OpenClaw는 해당 세션의 요청자로 대체 전달합니다
- 최상위 요청자 세션의 경우, 완료 모드 직접 전달은 먼저 바인딩된 대화/스레드 라우트와 훅 재정의를 해석한 다음, 요청자 세션에 저장된 라우트에서 누락된 채널 대상 필드를 채웁니다. 이렇게 하면 완료 출처가 채널만 식별하더라도 올바른 채팅/토픽에 완료가 유지됩니다.
- 중첩 완료 결과를 만들 때 자식 완료 집계는 현재 요청자 실행 범위로 제한되므로, 이전 실행의 오래된 자식 출력이 현재 알림에 새어 들어가지 않습니다.
- 알림 답변은 채널 어댑터에서 가능할 경우 스레드/토픽 라우팅을 유지합니다.
- 알림 컨텍스트는 안정적인 내부 이벤트 블록으로 정규화됩니다.
  - 소스(`subagent` 또는 `cron`)
  - 자식 세션 키/ID
  - 알림 유형 + 작업 레이블
  - 런타임 결과(`success`, `error`, `timeout`, `unknown`)에서 파생된 상태 줄
  - 최신 표시 가능한 assistant 텍스트에서 선택된 결과 내용, 없으면 정제된 최신 tool/toolResult 텍스트. 최종 실패 실행은 캡처된 답변 텍스트를 다시 재생하지 않고 실패 상태를 보고
  - 언제 답변하고 언제 조용히 있어야 하는지 설명하는 후속 지침
- `Status`는 모델 출력에서 추론되지 않습니다. 런타임 결과 신호에서 가져옵니다.
- 시간 초과 시 자식이 도구 호출까지만 진행했다면, 알림은 원시 도구 출력을 다시 재생하는 대신 그 이력을 짧은 부분 진행 요약으로 축약할 수 있습니다.

알림 페이로드에는 끝에 통계 줄이 포함됩니다(랩핑된 경우에도 동일).

- 런타임(예: `runtime 5m12s`)
- 토큰 사용량(input/output/total)
- 모델 가격이 구성된 경우 추정 비용(`models.providers.*.models[].cost`)
- `sessionKey`, `sessionId`, 기록 경로(메인 에이전트가 `sessions_history`로 기록을 가져오거나 디스크 파일을 검사할 수 있도록)
- 내부 메타데이터는 오케스트레이션 전용입니다. 사용자 대상 답변은 일반 assistant 음성으로 다시 작성해야 합니다.

`sessions_history`는 더 안전한 오케스트레이션 경로입니다.

- assistant 회상은 먼저 정규화됩니다.
  - thinking 태그 제거
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록 제거
  - `<tool_call>...</tool_call>`,
    `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
    `<function_calls>...</function_calls>` 같은 일반 텍스트 도구 호출 XML 페이로드 블록 제거
    (깔끔하게 닫히지 않은 잘린 페이로드 포함)
  - 강등된 도구 호출/결과 스캐폴딩과 과거 컨텍스트 마커 제거
  - `<|assistant|>` 같은 누출된 모델 제어 토큰, 기타 ASCII
    `<|...|>` 토큰, 전각 `<｜...｜>` 변형 제거
  - 잘못된 MiniMax 도구 호출 XML 제거
- 자격 증명/토큰 유사 텍스트는 마스킹됨
- 긴 블록은 잘릴 수 있음
- 매우 큰 기록은 오래된 행을 제거하거나, 지나치게 큰 행을
  `[sessions_history omitted: message too large]`로 대체할 수 있음
- 바이트 단위로 완전한 기록이 필요하면 원시 디스크 기록 검사가 대체 수단입니다

## 도구 정책(하위 에이전트 도구)

하위 에이전트는 먼저 부모 또는 대상
에이전트와 동일한 프로필 및 도구 정책 파이프라인을 사용합니다. 그 후 OpenClaw가 하위 에이전트 제한 계층을 적용합니다.

제한적인 `tools.profile`이 없으면, 하위 에이전트는 **세션
도구**와 시스템 도구를 제외한 **모든 도구**를 받습니다.

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

여기서도 `sessions_history`는 제한되고 정제된 회상 뷰이며,
원시 기록 덤프가 아닙니다.

`maxSpawnDepth >= 2`이면 깊이 1 오케스트레이터 하위 에이전트는 자식을 관리할 수 있도록 추가로 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받습니다.

구성을 통해 재정의:

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
        // deny가 우선
        deny: ["gateway", "cron"],
        // allow가 설정되면 allow-only가 됨(deny가 여전히 우선)
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

`tools.subagents.tools.allow`는 최종 allow-only 필터입니다. 이미
해석된 도구 집합을 더 좁힐 수는 있지만,
`tools.profile`이 제거한 도구를 다시 추가할 수는 없습니다. 예를 들어
`tools.profile: "coding"`은
`web_search`/`web_fetch`를 포함하지만 `browser` 도구는 포함하지 않습니다. coding-profile
하위 에이전트가 브라우저 자동화를 사용하게 하려면 프로필 단계에서 browser를 추가하세요.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

하나의 에이전트에만 브라우저 자동화를 주려면
에이전트별 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하세요.

## 동시성

하위 에이전트는 전용 인프로세스 대기열 lane을 사용합니다.

- lane 이름: `subagent`
- 동시성: `agents.defaults.subagents.maxConcurrent`(기본값 `8`)

## 생존성 및 복구

OpenClaw는 `endedAt`의 부재를 하위 에이전트가
여전히 살아 있다는 영구적인 증거로 취급하지 않습니다. 종료되지 않은 실행이라도 오래된 실행 창보다 오래되면
`/subagents list`, 상태 요약, 자손 완료
게이팅, 세션별 동시성 검사에서 더 이상 활성/보류로 계산되지 않습니다.

gateway 재시작 후, 오래된 미종료 복원 실행은
자식 세션에 `abortedLastRun: true`가 표시되어 있지 않으면 정리됩니다. 이렇게 재시작 중 중단된 자식
세션은 하위 에이전트 orphan 복구 흐름을 통해 복구 가능하며, 이 흐름은
중단 표시를 지우기 전에 합성 재개 메시지를 보냅니다.

## 중지

- 요청자 채팅에서 `/stop`을 보내면 요청자 세션이 중단되고, 여기서 생성된 활성 하위 에이전트 실행도 중지되며, 중첩 자식까지 연쇄 중지됩니다.
- `/subagents kill <id>`는 특정 하위 에이전트를 중지하고 그 자식까지 연쇄 중지합니다.

## 제한 사항

- 하위 에이전트 알림은 **best-effort**입니다. gateway가 재시작되면 보류 중인 "다시 알리기" 작업은 손실됩니다.
- 하위 에이전트도 여전히 같은 gateway 프로세스 자원을 공유하므로, `maxConcurrent`를 안전장치로 취급하세요.
- `sessions_spawn`은 항상 논블로킹입니다. 즉시 `{ status: "accepted", runId, childSessionKey }`를 반환합니다.
- 하위 에이전트 컨텍스트에는 `AGENTS.md` + `TOOLS.md`만 주입됩니다(`SOUL.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`는 없음).
- 최대 중첩 깊이는 5입니다(`maxSpawnDepth` 범위: 1–5). 대부분의 사용 사례에는 깊이 2를 권장합니다.
- `maxChildrenPerAgent`는 세션당 활성 자식 수를 제한합니다(기본값: 5, 범위: 1–20).

## 관련

- [ACP agents](/ko/tools/acp-agents)
- [다중 에이전트 샌드박스 도구](/ko/tools/multi-agent-sandbox-tools)
- [에이전트 전송](/ko/tools/agent-send)
