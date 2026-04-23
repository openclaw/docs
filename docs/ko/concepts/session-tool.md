---
read_when:
    - 에이전트가 어떤 세션 도구를 가지고 있는지 이해하려고 합니다
    - 교차 세션 액세스 또는 하위 에이전트 생성을 구성하려고 합니다
    - 생성된 하위 에이전트의 상태를 확인하거나 제어하려고 합니다
summary: 교차 세션 상태, 회상, 메시징 및 하위 에이전트 오케스트레이션을 위한 에이전트 도구
title: 세션 도구
x-i18n:
    generated_at: "2026-04-23T14:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cd8b545429726d0880e6086ba7190497861bf3f3e1e88d53cb38ef9e5e4468c6
    source_path: concepts/session-tool.md
    workflow: 15
---

# 세션 도구

OpenClaw는 에이전트가 세션 간 작업을 수행하고, 상태를 확인하며,
하위 에이전트를 오케스트레이션할 수 있도록 도구를 제공합니다.

## 사용 가능한 도구

| Tool               | 기능                                                                      |
| ------------------ | ------------------------------------------------------------------------- |
| `sessions_list`    | 선택적 필터(kind, label, agent, recency, preview)를 사용해 세션 나열      |
| `sessions_history` | 특정 세션의 대화 기록 읽기                                                |
| `sessions_send`    | 다른 세션에 메시지를 보내고 선택적으로 대기                               |
| `sessions_spawn`   | 백그라운드 작업을 위한 격리된 하위 에이전트 세션 생성                     |
| `sessions_yield`   | 현재 턴을 종료하고 후속 하위 에이전트 결과를 대기                         |
| `subagents`        | 이 세션에서 생성된 하위 에이전트를 나열, 제어 또는 종료                   |
| `session_status`   | `/status` 스타일 카드를 표시하고 선택적으로 세션별 모델 재정의를 설정     |

## 세션 나열 및 읽기

`sessions_list`는 세션의 key, agentId, kind, channel, model,
토큰 수, 타임스탬프와 함께 세션을 반환합니다. kind(`main`, `group`, `cron`, `hook`,
`node`), 정확한 `label`, 정확한 `agentId`, 검색 텍스트 또는 최근성
(`activeMinutes`)으로 필터링할 수 있습니다. 메일함 스타일 분류가 필요할 때는
가시성 범위가 지정된 파생 제목, 마지막 메시지 미리보기 스니펫, 또는
각 행의 제한된 최근 메시지를 요청할 수도 있습니다. 파생 제목과 미리보기는
구성된 세션 도구 가시성 정책에 따라 호출자가 이미 볼 수 있는 세션에 대해서만
생성되므로, 관련 없는 세션은 숨겨진 상태로 유지됩니다.

`sessions_history`는 특정 세션의 대화 기록을 가져옵니다.
기본적으로 도구 결과는 제외됩니다. 보려면 `includeTools: true`를 전달하세요.
반환되는 보기는 의도적으로 제한되고 안전 필터링됩니다:

- 회상 전에 assistant 텍스트가 정규화됩니다:
  - thinking 태그가 제거됩니다
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록이 제거됩니다
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, 및
    `<function_calls>...</function_calls>` 같은 일반 텍스트 도구 호출 XML 페이로드 블록이 제거되며,
    정상적으로 닫히지 않은 잘린 페이로드도 포함됩니다
  - `[Tool Call: ...]`,
    `[Tool Result ...]`, 및 `[Historical context ...]` 같은
    다운그레이드된 도구 호출/결과 스캐폴딩이 제거됩니다
  - `<|assistant|>`, 기타 ASCII
    `<|...|>` 토큰, 전체 폭 `<｜...｜>` 변형 같은
    모델 제어 토큰 누출이 제거됩니다
  - `<invoke ...>` /
    `</minimax:tool_call>` 같은 잘못된 MiniMax 도구 호출 XML이 제거됩니다
- 자격 증명/토큰과 유사한 텍스트는 반환 전에 마스킹됩니다
- 긴 텍스트 블록은 잘립니다
- 매우 큰 기록은 오래된 행이 삭제되거나, 너무 큰 행이
  `[sessions_history omitted: message too large]`로 대체될 수 있습니다
- 도구는 `truncated`, `droppedMessages`,
  `contentTruncated`, `contentRedacted`, `bytes` 같은 요약 플래그를 보고합니다

두 도구 모두 **세션 key**(예: `"main"`) 또는
이전 목록 호출의 **세션 ID**를 받을 수 있습니다.

정확히 바이트 단위로 동일한 대화 기록이 필요하다면,
`sessions_history`를 원시 덤프로 취급하지 말고 디스크의 transcript 파일을 직접 확인하세요.

## 세션 간 메시지 보내기

`sessions_send`는 다른 세션에 메시지를 전달하고 선택적으로 응답을 기다립니다:

- **fire-and-forget:** `timeoutSeconds: 0`으로 설정하면 큐에 넣고
  즉시 반환합니다.
- **응답 대기:** 타임아웃을 설정하면 응답을 인라인으로 받습니다.

대상이 응답한 후, OpenClaw는 에이전트가
메시지를 번갈아 주고받는 **reply-back loop**를 실행할 수 있습니다(최대 5턴).
대상 에이전트는 `REPLY_SKIP`으로 일찍 중단할 수 있습니다.

## 상태 및 오케스트레이션 헬퍼

`session_status`는 현재 세션 또는 다른 가시 세션에 대한
가벼운 `/status` 동등 도구입니다. 사용량, 시간, 모델/런타임 상태,
그리고 있는 경우 연결된 백그라운드 작업 컨텍스트를 보고합니다. `/status`와 마찬가지로,
최신 transcript usage 항목에서 희소한 토큰/캐시 카운터를 보완할 수 있으며,
`model=default`는 세션별 재정의를 지웁니다.

`sessions_yield`는 의도적으로 현재 턴을 종료하여 다음 메시지가
기다리는 후속 이벤트가 되도록 합니다. 하위 에이전트를 생성한 후,
완료 결과가 폴링 루프를 만드는 대신 다음 메시지로 도착하게 하려면 사용하세요.

`subagents`는 이미 생성된 OpenClaw
하위 에이전트용 control-plane 헬퍼입니다. 지원 항목:

- `action: "list"`로 활성/최근 실행 검사
- `action: "steer"`로 실행 중인 자식에 후속 지침 전송
- `action: "kill"`로 하나의 자식 또는 `all` 중지

## 하위 에이전트 생성

`sessions_spawn`은 백그라운드 작업을 위한 격리된 세션을 생성합니다. 항상
논블로킹이며, `runId`와 `childSessionKey`를 즉시 반환합니다.

주요 옵션:

- `runtime: "subagent"`(기본값) 또는 외부 하네스 에이전트용 `"acp"`.
- 자식 세션용 `model` 및 `thinking` 재정의.
- `thread: true`로 채팅 스레드(Discord, Slack 등)에 생성 바인딩.
- `sandbox: "require"`로 자식에 샌드박싱 강제.

기본 리프 하위 에이전트는 세션 도구를 받지 않습니다.
`maxSpawnDepth >= 2`인 경우, depth-1 오케스트레이터 하위 에이전트는 추가로
`sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받아
자체 자식을 관리할 수 있습니다. 리프 실행은 여전히 재귀적
오케스트레이션 도구를 받지 않습니다.

완료 후에는 announce 단계가 결과를 요청자의 채널에 게시합니다.
완료 전달은 가능한 경우 바인딩된 스레드/토픽 라우팅을 보존하며,
완료 원본이 채널만 식별하더라도 OpenClaw는 직접 전달을 위해
요청자 세션의 저장된 경로(`lastChannel` / `lastTo`)를 계속 재사용할 수 있습니다.

ACP 전용 동작은 [ACP Agents](/ko/tools/acp-agents)를 참조하세요.

## 가시성

세션 도구는 에이전트가 볼 수 있는 범위를 제한하도록 범위가 지정됩니다:

| Level   | 범위                                    |
| ------- | --------------------------------------- |
| `self`  | 현재 세션만                             |
| `tree`  | 현재 세션 + 생성된 하위 에이전트        |
| `agent` | 이 에이전트의 모든 세션                 |
| `all`   | 모든 세션(구성된 경우 에이전트 간 포함) |

기본값은 `tree`입니다. 샌드박스 세션은
config와 관계없이 `tree`로 고정됩니다.

## 추가 읽을거리

- [세션 관리](/ko/concepts/session) -- 라우팅, 수명 주기, 유지 관리
- [ACP Agents](/ko/tools/acp-agents) -- 외부 하네스 생성
- [멀티 에이전트](/ko/concepts/multi-agent) -- 멀티 에이전트 아키텍처
- [Gateway 구성](/ko/gateway/configuration) -- 세션 도구 config 노브
