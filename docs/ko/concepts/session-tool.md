---
read_when:
    - 에이전트가 어떤 세션 도구를 사용할 수 있는지 확인하려고 합니다
    - 세션 간 액세스 또는 하위 에이전트 생성을 구성하려는 경우
    - 생성된 하위 에이전트의 상태를 확인하려고 합니다
summary: 세션 간 상태 확인, 회상, 메시징 및 하위 에이전트 오케스트레이션을 위한 에이전트 도구
title: 세션 도구
x-i18n:
    generated_at: "2026-07-12T21:34:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb0827e2eff6e53d3e7ef6f7d7f0497d8b431fcb23cb4b54c5851229086423cc
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw은 에이전트가 여러 세션에 걸쳐 작업하고, 상태를 검사하며, 하위 에이전트를 오케스트레이션할 수 있는 도구를 제공합니다.

## 사용 가능한 도구

| 도구               | 기능                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 선택적 필터(종류, 레이블, 에이전트, 보관, 미리 보기)를 사용하여 세션을 나열합니다 |
| `sessions_history` | 특정 세션의 대화 기록을 읽습니다                                            |
| `sessions_send`    | 다른 세션에 메시지를 보내고 선택적으로 기다립니다                           |
| `sessions_spawn`   | 백그라운드 작업을 위해 격리된 하위 에이전트 세션을 생성합니다                |
| `sessions_yield`   | 현재 턴을 종료하고 후속 하위 에이전트 결과를 기다립니다                      |
| `subagents`        | 이 세션에서 생성된 하위 에이전트의 상태를 나열합니다                         |
| `session_status`   | `/status` 형식의 카드를 표시하고 선택적으로 세션별 모델 재정의를 설정합니다  |

이러한 도구에도 활성 도구 프로필과 허용/거부 정책이 적용됩니다. `tools.profile: "coding"`에는 `sessions_spawn`, `sessions_yield`, `subagents`를 비롯한 전체 세션 오케스트레이션 도구 모음이 포함됩니다. `tools.profile: "messaging"`에는 세션 간 메시징 도구(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`)가 포함되지만 하위 에이전트 생성 기능은 포함되지 않습니다. 메시징 프로필을 유지하면서 네이티브 위임도 허용하려면 다음을 추가하십시오.

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

그룹, 제공자, 샌드박스 및 에이전트별 정책은 프로필 단계 이후에도 이러한 도구를 제거할 수 있습니다. 영향을 받는 세션에서 `/tools`를 사용하여 실제 도구 목록을 검사하십시오.

## 세션 나열 및 읽기

`sessions_list`는 키, agentId, 종류, 채널, 모델, 토큰 수 및 타임스탬프와 함께 세션을 반환합니다. `kinds`(배열, 허용되는 값: `main`, `group`, `cron`, `hook`, `node`, `other`), 정확한 `label`, 정확한 `agentId`, `search` 텍스트 또는 최근 활동 시간(`activeMinutes`)으로 필터링하십시오. 기본적으로 활성 세션이 반환됩니다. 대신 보관된 세션을 검사하려면 `archived: true`를 전달하십시오. 행에는 `pinned` 및 `archived` 상태가 포함됩니다. 메일함 방식의 분류가 필요할 때는 `includeDerivedTitles`, `includeLastMessage` 또는 `messageLimit`(최대 20)을 설정하십시오. 각 행에서 가시성 범위에 맞게 파생된 제목, 마지막 메시지의 미리 보기 스니펫 또는 제한된 최근 메시지를 확인할 수 있습니다. 파생 제목과 미리 보기는 호출자가 구성된 세션 도구 가시성 정책에 따라 이미 볼 수 있는 세션에 대해서만 생성되므로 관련 없는 세션은 숨겨진 상태로 유지됩니다. 가시성이 제한된 경우 `sessions_list`는 실제 모드와 결과가 범위에 의해 제한될 수 있다는 경고를 보여 주는 선택적 `visibility` 메타데이터를 반환합니다.

`sessions_history`는 특정 세션의 대화 기록을 가져옵니다. 기본적으로 도구 결과는 제외됩니다. 이를 보려면 `includeTools: true`를 전달하십시오. 제한된 최신 구간에는 `limit`을 사용하십시오. 페이지네이션 메타데이터가 필요한 경우 `offset: 0`을 전달한 다음, 반환된 `nextOffset` 값을 전달하여 원시 대화 기록 파일을 읽지 않고도 이전 OpenClaw 대화 기록 구간을 역방향으로 탐색하십시오. 명시적 오프셋 페이지는 외부 CLI 폴백 가져오기를 병합하지 않습니다. 병합된 표시 기록이 필요하면 기본 최신 구간 보기(`offset` 없음)를 사용하십시오.

반환되는 보기는 의도적으로 범위가 제한되며 안전 필터링이 적용됩니다.

- 어시스턴트 텍스트는 다시 불러오기 전에 정규화됩니다.
  - 사고 태그가 제거됩니다
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록이 제거됩니다
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 같은 일반 텍스트 도구 호출 XML 페이로드 블록이 제거되며, 정상적으로 닫히지 않은 잘린 페이로드도 포함됩니다
  - `[Tool Call: ...]`, `[Tool Result ...]`, `[Historical context ...]` 같은 다운그레이드된 도구 호출/결과 스캐폴딩이 제거됩니다
  - `<|assistant|>`, 기타 ASCII `<|...|>` 토큰 및 전각 `<｜...｜>` 변형 같은 유출된 모델 제어 토큰이 제거됩니다
  - `<invoke ...>` / `</minimax:tool_call>` 같은 잘못된 MiniMax 도구 호출 XML이 제거됩니다
- 자격 증명/토큰과 유사한 텍스트는 반환되기 전에 마스킹됩니다
- 긴 텍스트 블록은 잘립니다
- 매우 큰 기록에서는 이전 행이 삭제되거나 크기가 지나치게 큰 행이 `[sessions_history omitted: message too large]`로 대체될 수 있습니다
- 도구는 `truncated`, `droppedMessages`, `contentTruncated`, `contentRedacted`, `bytes` 같은 요약 플래그와 페이지네이션 메타데이터를 보고합니다

두 도구 모두 **세션 키**(예: `"main"`) 또는 이전 목록 호출에서 얻은 **세션 ID**를 받습니다.

정확한 원시 대화 기록이 필요한 경우 `sessions_history`를 필터링되지 않은 덤프로 취급하지 말고, 범위가 지정된 SQLite 대화 기록 행을 검사하십시오.

## 세션 간 메시지 보내기

`sessions_send`는 다른 세션에 메시지를 전달하고 선택적으로 응답을 기다립니다.

- **전송 후 대기하지 않음:** `timeoutSeconds: 0`을 설정하여 대기열에 넣고 즉시 반환합니다.
- **응답 대기:** 제한 시간을 설정하고 응답을 인라인으로 받습니다.

키가 `:thread:<id>`로 끝나는 스레드 범위 채팅 세션은 유효한 `sessions_send` 대상이 아닙니다. 도구를 통해 라우팅된 메시지가 활성 사용자 대상 스레드 내부에 나타나지 않도록 에이전트 간 조정에는 상위 채널 세션 키를 사용하십시오.

메시지와 A2A 후속 응답은 수신 프롬프트(`[Inter-session message ... isUser=false]`)와 대화 기록 출처에서 세션 간 데이터로 표시됩니다. 수신 에이전트는 이를 최종 사용자가 직접 작성한 지침이 아니라 도구를 통해 라우팅된 데이터로 취급해야 합니다.

대상이 응답한 후 OpenClaw은 에이전트가 메시지를 번갈아 보내는 **응답 반환 루프**를 실행할 수 있습니다(`session.agentToAgent.maxPingPongTurns`까지, 범위 0-20, 기본값 5). 대상 에이전트는 `REPLY_SKIP`으로 응답하여 조기에 중단할 수 있습니다.

`watch: true`를 전달하면 발신자를 대상의 상태 변경 감시자로도 등록합니다. 이후 다른 행위자가 대상에 직접 사용자 메시지를 보내거나 목표를 변경하면 발신자는 `session_status`의 `changesSince`를 가리키는 시스템 알림을 받습니다. 등록은 성공적으로 디스패치된 후 이루어지며, 실제로 메시지를 받은 세션을 대상으로 하고, 해당 세션의 현재 상태 버전에서 시작하므로 이후 변경만 알림을 생성합니다. 등록에 성공하면 결과에 `watched: true`가 보고됩니다. 자세한 내용은 [세션 상태 인식](/concepts/session-state)을 참조하십시오.

## 상태 및 오케스트레이션 도우미

`session_status`는 현재 세션이나 볼 수 있는 다른 세션을 위한 경량 `/status` 동등 도구입니다. 사용량, 시간, 모델/런타임 상태 및 연결된 백그라운드 작업 컨텍스트가 있는 경우 이를 보고합니다. `/status`와 마찬가지로 최신 대화 기록 사용량 항목에서 희소한 토큰/캐시 카운터를 보충할 수 있으며, `model=default`는 세션별 재정의를 해제합니다. 호출자의 현재 세션에는 `sessionKey="current"`를 사용하십시오. `openclaw-tui` 같은 표시용 클라이언트 레이블은 세션 키가 아닙니다.

경로 메타데이터를 사용할 수 있는 경우 `session_status`에는 표시 가능한 `Route context` JSON 블록과 이에 대응하는 구조화된 `details` 필드도 포함됩니다. 이러한 필드는 세션 키와 현재 실시간 실행을 처리하는 경로를 구분합니다.

- `origin`은 세션이 생성된 위치이며, 오래된 상태에 저장된 출처 메타데이터가 없는 경우 전달 가능한 세션 키 접두사에서 추론한 제공자입니다.
- `active`는 현재 실시간 실행 경로입니다. 현재 처리 중인 실시간 세션 또는 현재 세션에 대해서만 보고됩니다.
- `deliveryContext`는 세션에 저장된 지속성 전달 경로이며, 활성 표면이 달라도 OpenClaw이 이후 전달에 재사용할 수 있습니다.

## 세션 상태 변경

OpenClaw은 중요한 세션 상태 변경(감시 중인 세션으로 전달된 직접 사용자 메시지, 하위 실행 결과, 목표 변경, Compaction)의 지속성 신호 로그를 유지합니다. `sessions_list` 행과 `session_status`는 세션의 `stateVersion`을 노출하며, `session_status`는 `changesSince: <version>`을 받아 해당 버전 이후의 형식화된 이벤트를 반환합니다. 요청된 버전이 보존된 기록보다 오래된 경우 정확한 `historyGap` 신호를 제공합니다. 감시자(자동으로 등록되는 생성 상위 세션, `sessions_send watch: true`로 명시적으로 등록된 세션)는 다른 행위자가 감시 중인 세션을 변경할 때 병합된 오래된 상태 알림 하나를 받습니다.

이벤트 종류, 감시자 등록, 스팸 방지 알림 프로토콜, 조정 흐름 및 현재 제한을 포함한 전체 모델은 [세션 상태 인식](/concepts/session-state)을 참조하십시오.

`sessions_yield`는 의도적으로 현재 턴을 종료하여 다음 메시지가 기다리던 후속 이벤트가 되도록 합니다. 하위 에이전트를 생성한 후 폴링 루프를 구성하는 대신 완료 결과를 다음 메시지로 받고 싶을 때 사용하십시오.

`subagents`는 이미 생성된 OpenClaw 하위 에이전트를 위한 가시성 도우미입니다. 활성/최근 실행을 검사하는 `action: "list"`를 지원합니다.

## 하위 에이전트 생성

`sessions_spawn`은 기본적으로 백그라운드 작업을 위한 격리된 세션을 생성합니다. 항상 비차단 방식이며 `runId`와 `childSessionKey`를 즉시 반환합니다. 네이티브 하위 에이전트 실행은 하위 세션에서 처음 표시되는 `[Subagent Task]` 메시지를 통해 위임된 작업을 받으며, 시스템 프롬프트에는 하위 에이전트 런타임 규칙과 라우팅 컨텍스트만 포함됩니다.

주요 옵션:

- 외부 하네스 에이전트에는 `runtime: "subagent"`(기본값) 또는 `"acp"`를 사용합니다.
- 하위 세션을 위한 `model` 및 `thinking` 재정의.
- 생성을 채팅 스레드(Discord, Slack 등)에 바인딩하려면 `thread: true`를 사용합니다.
- 하위 세션에서 샌드박싱을 강제하려면 `sandbox: "require"`를 사용합니다.
- 하위 세션에 현재 요청자의 대화 기록이 필요한 경우 네이티브 하위 에이전트에 `context: "fork"`를 사용하고, 깨끗한 하위 세션에는 이를 생략하거나 `context: "isolated"`를 사용합니다. `context: "fork"`는 `runtime: "subagent"`에서만 유효합니다. 스레드에 바인딩된 네이티브 하위 에이전트는 `threadBindings.defaultSpawnContext`에서 다르게 지정하지 않는 한 기본적으로 `context: "fork"`를 사용합니다.

기본 리프 하위 에이전트에는 세션 도구가 제공되지 않습니다. `maxSpawnDepth >= 2`인 경우 깊이 1의 오케스트레이터 하위 에이전트에는 자체 하위 세션을 관리할 수 있도록 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`가 추가로 제공됩니다. 리프 실행에는 여전히 재귀적 오케스트레이션 도구가 제공되지 않습니다.

완료 후 알림 단계에서 요청자의 채널로 결과를 게시합니다. 가능한 경우 완료 전달은 바인딩된 스레드/주제 라우팅을 유지하며, 완료 출처가 채널만 식별하는 경우에도 OpenClaw은 직접 전달을 위해 요청자 세션에 저장된 경로(`lastChannel` / `lastTo`)를 재사용할 수 있습니다.

ACP 관련 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하십시오.

## 가시성

세션 도구에는 에이전트가 볼 수 있는 범위를 제한하도록 범위가 지정됩니다.

| 수준    | 범위                                      |
| ------- | ----------------------------------------- |
| `self`  | 현재 세션만                               |
| `tree`  | 현재 세션 + 생성된 하위 에이전트          |
| `agent` | 이 에이전트의 모든 세션                   |
| `all`   | 모든 세션(구성된 경우 에이전트 간 포함)   |

기본값은 `tree`입니다. 샌드박스 세션은 구성과 관계없이 `tree`로 제한됩니다.

## 추가 자료

- [세션 관리](/ko/concepts/session): 라우팅, 수명 주기, 유지 관리
- [하위 에이전트](/ko/tools/subagents): 하위 세션 수명 주기 및 전달
- [ACP 에이전트](/ko/tools/acp-agents): 외부 하네스 생성
- [멀티 에이전트](/ko/concepts/multi-agent): 멀티 에이전트 아키텍처
- [Gateway 구성](/ko/gateway/configuration): 세션 도구 구성 옵션

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 정리](/ko/concepts/session-pruning)
