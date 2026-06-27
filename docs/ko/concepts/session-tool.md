---
read_when:
    - 에이전트가 어떤 세션 도구를 가지고 있는지 이해하고 싶습니다
    - 교차 세션 액세스 또는 하위 에이전트 생성을 구성하려는 경우
    - 생성된 하위 에이전트 상태를 검사하려고 합니다
summary: 세션 간 상태, 회상, 메시징 및 하위 에이전트 오케스트레이션을 위한 에이전트 도구
title: 세션 도구
x-i18n:
    generated_at: "2026-06-27T17:25:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 382f5d63062a03c410e3f7cc88281a35bf428ff74a58144543e49b3cd4eb5c8b
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw는 에이전트가 세션 전반에서 작업하고, 상태를 검사하고,
하위 에이전트를 오케스트레이션할 수 있는 도구를 제공합니다.

## 사용 가능한 도구

| 도구               | 수행 작업                                                                    |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 선택적 필터(kind, label, agent, recency, preview)로 세션을 나열합니다        |
| `sessions_history` | 특정 세션의 transcript를 읽습니다                                            |
| `sessions_send`    | 다른 세션으로 메시지를 보내고 선택적으로 대기합니다                         |
| `sessions_spawn`   | 백그라운드 작업을 위한 격리된 하위 에이전트 세션을 생성합니다               |
| `sessions_yield`   | 현재 턴을 종료하고 후속 하위 에이전트 결과를 기다립니다                     |
| `subagents`        | 이 세션에서 생성된 하위 에이전트 상태를 나열합니다                          |
| `session_status`   | `/status` 스타일 카드를 표시하고 선택적으로 세션별 모델 override를 설정합니다 |

이 도구들은 여전히 활성 도구 프로필과 허용/거부 정책의 적용을 받습니다.
`tools.profile: "coding"`에는 `sessions_spawn`, `sessions_yield`, `subagents`를
포함한 전체 세션 오케스트레이션 세트가 포함됩니다.
`tools.profile: "messaging"`에는 세션 간 메시징 도구
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`)가
포함되지만 하위 에이전트 생성은 포함되지 않습니다. 메시징 프로필을 유지하면서
네이티브 위임도 허용하려면 다음을 추가하세요.

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

그룹, provider, sandbox, 에이전트별 정책은 프로필 단계 이후에도 해당 도구들을
제거할 수 있습니다. 영향을 받는 세션에서 `/tools`를 사용해 유효한 도구 목록을
확인하세요.

## 세션 나열 및 읽기

`sessions_list`는 key, agentId, kind, channel, model, 토큰 수, timestamp와 함께
세션을 반환합니다. kind(`main`, `group`, `cron`, `hook`, `node`), 정확한 `label`,
정확한 `agentId`, 검색 텍스트 또는 recency(`activeMinutes`)로 필터링합니다.
메일함 스타일 triage가 필요한 경우, 각 행에 대해 visibility 범위의 파생 제목,
마지막 메시지 preview snippet, 또는 제한된 최근 메시지도 요청할 수 있습니다.
파생 제목과 preview는 호출자가 구성된 세션 도구 visibility 정책에 따라 이미 볼 수
있는 세션에 대해서만 생성되므로, 관련 없는 세션은 숨겨진 상태로 유지됩니다.
visibility가 제한된 경우 `sessions_list`는 유효 모드와 결과가 범위 제한될 수
있다는 경고를 보여주는 선택적 `visibility` 메타데이터를 반환합니다.

`sessions_history`는 특정 세션의 대화 transcript를 가져옵니다.
기본적으로 도구 결과는 제외됩니다. 이를 보려면 `includeTools: true`를 전달하세요.
반환되는 view는 의도적으로 제한되어 있고 안전 필터가 적용됩니다.

- assistant 텍스트는 recall 전에 정규화됩니다.
  - thinking 태그가 제거됩니다
  - `<relevant-memories>` / `<relevant_memories>` scaffolding 블록이 제거됩니다
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
    `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 같은
    일반 텍스트 도구 호출 XML payload 블록이 제거되며, 깔끔하게 닫히지 않은
    잘린 payload도 포함됩니다
  - `[Tool Call: ...]`, `[Tool Result ...]`, `[Historical context ...]` 같은
    downgraded 도구 호출/결과 scaffolding이 제거됩니다
  - `<|assistant|>` 같은 유출된 모델 제어 토큰, 기타 ASCII
    `<|...|>` 토큰, 전각 `<｜...｜>` 변형이 제거됩니다
  - `<invoke ...>` / `</minimax:tool_call>` 같은 잘못된 MiniMax 도구 호출 XML이
    제거됩니다
- credential/token처럼 보이는 텍스트는 반환되기 전에 redact됩니다
- 긴 텍스트 블록은 잘립니다
- 매우 큰 history는 오래된 행을 drop하거나 과도하게 큰 행을
  `[sessions_history omitted: message too large]`로 대체할 수 있습니다
- 도구는 `truncated`, `droppedMessages`, `contentTruncated`,
  `contentRedacted`, `bytes` 같은 summary flag를 보고합니다

두 도구 모두 **세션 key**(`"main"` 같은 값) 또는 이전 list 호출의 **세션 ID**를
받습니다.

정확히 byte-for-byte로 일치하는 transcript가 필요하면 `sessions_history`를 원시
dump로 취급하지 말고 디스크의 transcript 파일을 검사하세요.

## 세션 간 메시지 보내기

`sessions_send`는 메시지를 다른 세션으로 전달하고 선택적으로 응답을 기다립니다.

- **보내고 잊기:** `timeoutSeconds: 0`을 설정해 enqueue 후 즉시 반환합니다.
- **응답 대기:** timeout을 설정하고 응답을 inline으로 받습니다.

Slack 또는 Discord key가 `:thread:<id>`로 끝나는 경우처럼 thread 범위의 chat
세션은 유효한 `sessions_send` 대상이 아닙니다. 도구로 라우팅된 메시지가 활성
인간 대상 thread 안에 나타나지 않도록, 에이전트 간 조정에는 상위 channel 세션
key를 사용하세요.

메시지와 A2A follow-up reply는 수신 prompt(`[Inter-session message ... isUser=false]`)와
transcript provenance에서 세션 간 데이터로 표시됩니다. 수신 에이전트는 이를
직접 최종 사용자가 작성한 instruction이 아니라 도구로 라우팅된 데이터로
취급해야 합니다.

대상이 응답한 뒤 OpenClaw는 에이전트들이 번갈아 메시지를 보내는 **reply-back loop**를
실행할 수 있습니다(`session.agentToAgent.maxPingPongTurns`까지, 범위 0-20, 기본값 5).
대상 에이전트는 일찍 중단하려면 `REPLY_SKIP`으로 응답할 수 있습니다.

## 상태 및 오케스트레이션 helper

`session_status`는 현재 또는 다른 visible 세션을 위한 경량 `/status` 등가 도구입니다.
사용량, 시간, 모델/runtime 상태, 연결된 백그라운드 작업 context가 있으면 이를
보고합니다. `/status`와 마찬가지로 최신 transcript 사용량 entry에서 sparse한
토큰/cache counter를 backfill할 수 있으며, `model=default`는 세션별 override를
clear합니다. 호출자의 현재 세션에는 `sessionKey="current"`를 사용하세요.
`openclaw-tui` 같은 visible client label은 세션 key가 아닙니다.

route 메타데이터를 사용할 수 있으면 `session_status`에는 visible
`Route context` JSON 블록과 일치하는 구조화된 `details` 필드도 포함됩니다.
이 필드들은 세션 key와 현재 live run을 처리 중인 route를 구분합니다.

- `origin`은 세션이 생성된 위치이거나, 오래된 상태에 저장된 origin 메타데이터가
  없을 때 deliverable 세션-key prefix에서 추론한 provider입니다.
- `active`는 현재 live-run route입니다. 지금 처리 중인 live 또는 current 세션에
  대해서만 보고됩니다.
- `deliveryContext`는 세션에 저장된 지속 delivery route이며, active surface가
  달라진 경우에도 OpenClaw가 나중 delivery에 재사용할 수 있습니다.

`sessions_yield`는 다음 메시지가 기다리던 follow-up event가 될 수 있도록 의도적으로
현재 턴을 종료합니다. polling loop를 구성하는 대신 완료 결과가 다음 메시지로
도착하기를 원할 때 하위 에이전트를 생성한 뒤 사용하세요.

`subagents`는 이미 생성된 OpenClaw 하위 에이전트를 위한 visibility helper입니다.
활성/최근 run을 검사하기 위해 `action: "list"`를 지원합니다.

## 하위 에이전트 생성

`sessions_spawn`은 기본적으로 백그라운드 작업을 위한 격리된 세션을 생성합니다.
항상 non-blocking이며 `runId`와 `childSessionKey`를 즉시 반환합니다. 네이티브
하위 에이전트 run은 child session의 첫 visible `[Subagent Task]` 메시지에서
위임된 작업을 받고, system prompt에는 하위 에이전트 runtime rule과 routing
context만 전달됩니다.

주요 옵션:

- `runtime: "subagent"`(기본값) 또는 외부 harness agent용 `"acp"`.
- child session을 위한 `model` 및 `thinking` override.
- chat thread(Discord, Slack 등)에 spawn을 bind하려면 `thread: true`.
- child에 sandboxing을 강제하려면 `sandbox: "require"`.
- child에 현재 requester transcript가 필요한 경우 네이티브 하위 에이전트에는
  `context: "fork"`를 사용하세요. 깨끗한 child에는 이를 생략하거나
  `context: "isolated"`를 사용하세요. thread-bound 네이티브 하위 에이전트는
  `threadBindings.defaultSpawnContext`가 달리 지정하지 않는 한 기본값이
  `context: "fork"`입니다.

기본 leaf 하위 에이전트는 세션 도구를 받지 않습니다.
`maxSpawnDepth >= 2`이면 depth-1 orchestrator 하위 에이전트가 추가로
`sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받아
자신의 child를 관리할 수 있습니다. Leaf run은 여전히 recursive 오케스트레이션
도구를 받지 않습니다.

완료 후 announce 단계가 requester의 channel에 결과를 post합니다. 완료 delivery는
사용 가능한 경우 bind된 thread/topic routing을 보존하며, 완료 origin이 channel만
식별하는 경우에도 OpenClaw는 direct delivery를 위해 requester 세션의 저장된
route(`lastChannel` / `lastTo`)를 재사용할 수 있습니다.

ACP별 동작은 [ACP Agents](/ko/tools/acp-agents)를 참고하세요.

## Visibility

세션 도구는 에이전트가 볼 수 있는 범위를 제한하도록 scoped됩니다.

| 수준    | 범위                                     |
| ------- | ---------------------------------------- |
| `self`  | 현재 세션만                              |
| `tree`  | 현재 세션 + 생성된 하위 에이전트         |
| `agent` | 이 에이전트의 모든 세션                  |
| `all`   | 모든 세션(구성된 경우 에이전트 간 포함)  |

기본값은 `tree`입니다. Sandboxed 세션은 config와 관계없이 `tree`로 clamp됩니다.

## 추가 자료

- [Session Management](/ko/concepts/session) -- routing, lifecycle, maintenance
- [ACP Agents](/ko/tools/acp-agents) -- 외부 harness 생성
- [Multi-agent](/ko/concepts/multi-agent) -- multi-agent architecture
- [Gateway Configuration](/ko/gateway/configuration) -- 세션 도구 config knob

## 관련 항목

- [Session management](/ko/concepts/session)
- [Session pruning](/ko/concepts/session-pruning)
