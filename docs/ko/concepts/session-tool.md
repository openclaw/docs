---
read_when:
    - 에이전트에 어떤 세션 도구가 있는지 이해하려고 합니다
    - 교차 세션 접근 또는 하위 에이전트 생성을 구성하려는 경우
    - 생성된 하위 에이전트 상태를 검사하려고 합니다
summary: 크로스 세션 상태, 회상, 메시징 및 하위 에이전트 오케스트레이션을 위한 에이전트 도구
title: 세션 도구
x-i18n:
    generated_at: "2026-07-04T20:28:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2f344642b8d234984719cc603b4ac8773314a0bffdb0ac7d5a7280e584c5f530
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw는 에이전트가 세션 전반에서 작업하고, 상태를 검사하며,
하위 에이전트를 오케스트레이션할 수 있는 도구를 제공합니다.

## 사용 가능한 도구

| 도구               | 기능                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 선택적 필터(kind, label, agent, archive, preview)로 세션 나열               |
| `sessions_history` | 특정 세션의 대화 기록 읽기                                                  |
| `sessions_send`    | 다른 세션으로 메시지를 보내고 선택적으로 대기                               |
| `sessions_spawn`   | 백그라운드 작업을 위한 격리된 하위 에이전트 세션 생성                       |
| `sessions_yield`   | 현재 턴을 끝내고 후속 하위 에이전트 결과 대기                               |
| `subagents`        | 이 세션에서 생성된 하위 에이전트 상태 나열                                  |
| `session_status`   | `/status` 스타일 카드를 표시하고 선택적으로 세션별 모델 오버라이드 설정     |

이 도구들은 여전히 활성 도구 프로필과 허용/거부 정책의 적용을 받습니다.
`tools.profile: "coding"`에는 `sessions_spawn`, `sessions_yield`,
`subagents`를 포함한 전체 세션 오케스트레이션 세트가 포함됩니다.
`tools.profile: "messaging"`에는 세션 간 메시징 도구
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`)가
포함되지만 하위 에이전트 생성은 포함되지 않습니다. 메시징 프로필을
유지하면서 네이티브 위임도 허용하려면 다음을 추가하세요.

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

그룹, 제공자, 샌드박스, 에이전트별 정책은 프로필 단계 이후에도 해당
도구들을 제거할 수 있습니다. 영향을 받는 세션에서 `/tools`를 사용해
실효 도구 목록을 검사하세요.

## 세션 나열 및 읽기

`sessions_list`는 키, agentId, 종류, 채널, 모델, 토큰 수, 타임스탬프와
함께 세션을 반환합니다. kind(`main`, `group`, `cron`, `hook`, `node`),
정확한 `label`, 정확한 `agentId`, 검색 텍스트 또는 최근성
(`activeMinutes`)으로 필터링할 수 있습니다. 활성 세션은 기본적으로
반환되며, 보관된 세션을 검사하려면 `archived: true`를 전달하세요.
행에는 고정 및 보관 상태가 포함됩니다. 메일함 방식의 분류가 필요할 때는
가시성 범위가 적용된 파생 제목, 마지막 메시지 미리보기 조각, 또는 각 행의
제한된 최근 메시지도 요청할 수 있습니다. 파생 제목과 미리보기는 호출자가
구성된 세션 도구 가시성 정책에 따라 이미 볼 수 있는 세션에 대해서만
생성되므로, 관련 없는 세션은 숨겨진 상태로 유지됩니다. 가시성이 제한된
경우 `sessions_list`는 실효 모드와 결과가 범위 제한될 수 있다는 경고를
보여주는 선택적 `visibility` 메타데이터를 반환합니다.

`sessions_history`는 특정 세션의 대화 기록을 가져옵니다. 기본적으로 도구
결과는 제외됩니다. 이를 보려면 `includeTools: true`를 전달하세요.
가장 최신의 제한된 꼬리 부분에는 `limit`를 사용하세요. 페이지네이션
메타데이터가 필요하면 `offset: 0`을 전달한 뒤, 반환된 `nextOffset` 값을
전달하여 원시 대화 기록 파일을 읽지 않고도 더 오래된 OpenClaw 대화 기록
창을 뒤로 넘겨 보세요. 명시적 오프셋 페이지는 외부 CLI 폴백 가져오기를
병합하지 않습니다. 병합된 표시 기록이 필요할 때는 기본 최신 꼬리 보기를
사용하세요.
반환되는 보기는 의도적으로 제한되고 안전 필터링됩니다.

- 어시스턴트 텍스트는 회상 전에 정규화됩니다.
  - thinking 태그가 제거됩니다
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록이 제거됩니다
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
    `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 같은
    일반 텍스트 도구 호출 XML 페이로드 블록이 제거되며, 깔끔하게 닫히지
    않은 잘린 페이로드도 포함됩니다
  - `[Tool Call: ...]`, `[Tool Result ...]`, `[Historical context ...]` 같은
    강등된 도구 호출/결과 스캐폴딩이 제거됩니다
  - `<|assistant|>` 같은 유출된 모델 제어 토큰, 기타 ASCII `<|...|>` 토큰,
    전각 `<｜...｜>` 변형이 제거됩니다
  - `<invoke ...>` / `</minimax:tool_call>` 같은 잘못된 MiniMax 도구 호출
    XML이 제거됩니다
- 자격 증명/토큰과 유사한 텍스트는 반환되기 전에 수정됩니다
- 긴 텍스트 블록은 잘립니다
- 매우 큰 기록은 더 오래된 행을 삭제하거나 너무 큰 행을
  `[sessions_history omitted: message too large]`로 대체할 수 있습니다
- 도구는 `truncated`, `droppedMessages`, `contentTruncated`,
  `contentRedacted`, `bytes`, 페이지네이션 메타데이터 같은 요약 플래그를
  보고합니다

두 도구 모두 **세션 키**(예: `"main"`) 또는 이전 목록 호출에서 얻은
**세션 ID**를 받을 수 있습니다.

정확히 바이트 단위까지 동일한 대화 기록이 필요하다면 `sessions_history`를
원시 덤프로 취급하지 말고 디스크의 대화 기록 파일을 검사하세요.

## 세션 간 메시지 보내기

`sessions_send`는 다른 세션에 메시지를 전달하고 선택적으로 응답을
기다립니다.

- **보내고 잊기:** `timeoutSeconds: 0`을 설정하여 큐에 넣고 즉시
  반환합니다.
- **응답 대기:** 제한 시간을 설정하고 응답을 인라인으로 받습니다.

Slack 또는 Discord 키가 `:thread:<id>`로 끝나는 경우처럼 스레드 범위의
채팅 세션은 유효한 `sessions_send` 대상이 아닙니다. 도구 라우팅 메시지가
활성 인간 대상 스레드 안에 나타나지 않도록 에이전트 간 조정에는 상위 채널
세션 키를 사용하세요.

메시지와 A2A 후속 응답은 수신 프롬프트
(`[Inter-session message ... isUser=false]`)와 대화 기록 출처에서 세션 간
데이터로 표시됩니다. 수신 에이전트는 이를 직접 최종 사용자가 작성한
지시가 아니라 도구 라우팅 데이터로 취급해야 합니다.

대상이 응답한 후 OpenClaw는 에이전트가 번갈아 메시지를 주고받는
**응답 반환 루프**를 실행할 수 있습니다(`session.agentToAgent.maxPingPongTurns`까지,
범위 0-20, 기본값 5). 대상 에이전트는 일찍 중지하려면 `REPLY_SKIP`으로
응답할 수 있습니다.

## 상태 및 오케스트레이션 헬퍼

`session_status`는 현재 세션 또는 다른 표시 가능한 세션을 위한 경량
`/status` 동등 도구입니다. 사용량, 시간, 모델/런타임 상태, 존재하는 경우
연결된 백그라운드 작업 컨텍스트를 보고합니다. `/status`처럼 최신 대화
기록 사용량 항목에서 희소한 토큰/캐시 카운터를 보충할 수 있으며,
`model=default`는 세션별 오버라이드를 지웁니다. 호출자의 현재 세션에는
`sessionKey="current"`를 사용하세요. `openclaw-tui` 같은 표시되는 클라이언트
레이블은 세션 키가 아닙니다.

라우트 메타데이터를 사용할 수 있으면 `session_status`에는 표시되는
`Route context` JSON 블록과 일치하는 구조화된 `details` 필드도 포함됩니다.
이 필드들은 현재 라이브 실행을 처리 중인 라우트와 세션 키를 구분합니다.

- `origin`은 세션이 생성된 위치이거나, 오래된 상태에 저장된 origin
  메타데이터가 없을 때 전달 가능한 세션 키 접두사에서 추론된 제공자입니다.
- `active`는 현재 라이브 실행 라우트입니다. 지금 처리 중인 라이브 또는
  현재 세션에 대해서만 보고됩니다.
- `deliveryContext`는 세션에 저장된 지속 전달 라우트이며, OpenClaw는 활성
  표면이 달라져도 이후 전달에 이를 재사용할 수 있습니다.

`sessions_yield`는 의도적으로 현재 턴을 끝내어 다음 메시지가 기다리던 후속
이벤트가 될 수 있게 합니다. 폴링 루프를 만들지 않고 완료 결과가 다음
메시지로 도착하길 원할 때, 하위 에이전트를 생성한 후 사용하세요.

`subagents`는 이미 생성된 OpenClaw 하위 에이전트를 위한 가시성 헬퍼입니다.
활성/최근 실행을 검사하기 위해 `action: "list"`를 지원합니다.

## 하위 에이전트 생성

`sessions_spawn`은 기본적으로 백그라운드 작업을 위한 격리된 세션을
생성합니다. 항상 비차단 방식입니다. 즉시 `runId`와 `childSessionKey`를
반환합니다. 네이티브 하위 에이전트 실행은 자식 세션의 첫 번째 표시
`[Subagent Task]` 메시지에서 위임된 작업을 받으며, 시스템 프롬프트에는
하위 에이전트 런타임 규칙과 라우팅 컨텍스트만 포함됩니다.

주요 옵션:

- `runtime: "subagent"`(기본값) 또는 외부 하네스 에이전트용 `"acp"`.
- 자식 세션의 `model` 및 `thinking` 오버라이드.
- 생성을 채팅 스레드(Discord, Slack 등)에 바인딩하는 `thread: true`.
- 자식에 샌드박싱을 강제하는 `sandbox: "require"`.
- 자식에 현재 요청자 대화 기록이 필요할 때 네이티브 하위 에이전트용
  `context: "fork"`를 사용하세요. 깨끗한 자식을 원하면 생략하거나
  `context: "isolated"`를 사용하세요. 스레드 바인딩 네이티브 하위 에이전트는
  `threadBindings.defaultSpawnContext`가 달리 지정하지 않는 한 기본적으로
  `context: "fork"`를 사용합니다.

기본 리프 하위 에이전트는 세션 도구를 받지 않습니다. `maxSpawnDepth >= 2`일
때 depth-1 오케스트레이터 하위 에이전트는 자신의 자식을 관리할 수 있도록
추가로 `sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를
받습니다. 리프 실행은 여전히 재귀 오케스트레이션 도구를 받지 않습니다.

완료 후에는 알림 단계가 요청자의 채널에 결과를 게시합니다. 완료 전달은
사용 가능한 경우 바인딩된 스레드/토픽 라우팅을 보존하며, 완료 origin이
채널만 식별하더라도 OpenClaw는 직접 전달을 위해 요청자 세션에 저장된
라우트(`lastChannel` / `lastTo`)를 계속 재사용할 수 있습니다.

ACP 관련 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 가시성

세션 도구는 에이전트가 볼 수 있는 범위를 제한하도록 스코프가 지정됩니다.

| 수준    | 범위                                     |
| ------- | ---------------------------------------- |
| `self`  | 현재 세션만                              |
| `tree`  | 현재 세션 + 생성된 하위 에이전트         |
| `agent` | 이 에이전트의 모든 세션                  |
| `all`   | 모든 세션(구성된 경우 에이전트 간 포함)  |

기본값은 `tree`입니다. 샌드박스 처리된 세션은 구성과 관계없이 `tree`로
제한됩니다.

## 추가 자료

- [세션 관리](/ko/concepts/session) -- 라우팅, 수명 주기, 유지 관리
- [ACP 에이전트](/ko/tools/acp-agents) -- 외부 하네스 생성
- [다중 에이전트](/ko/concepts/multi-agent) -- 다중 에이전트 아키텍처
- [Gateway 구성](/ko/gateway/configuration) -- 세션 도구 구성 조정 항목

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 정리](/ko/concepts/session-pruning)
