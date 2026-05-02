---
read_when:
    - 에이전트에 어떤 세션 도구가 있는지 이해하고 싶습니다
    - 교차 세션 액세스 또는 하위 에이전트 생성을 구성하려는 경우
    - 생성된 하위 에이전트의 상태를 검사하거나 제어하려는 경우
summary: 세션 간 상태, 회상, 메시징 및 하위 에이전트 오케스트레이션을 위한 에이전트 도구
title: 세션 도구
x-i18n:
    generated_at: "2026-05-02T20:49:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb8a3ab7fd1036ccd97940fc9824684d7b27ded0136f6a69416eb144bbfc64be
    source_path: concepts/session-tool.md
    workflow: 16
---

OpenClaw는 에이전트가 세션을 넘나들며 작업하고, 상태를 검사하며,
하위 에이전트를 오케스트레이션할 수 있는 도구를 제공합니다.

## 사용 가능한 도구

| 도구               | 기능                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `sessions_list`    | 선택적 필터(kind, label, agent, recency, preview)로 세션 나열               |
| `sessions_history` | 특정 세션의 대화 기록 읽기                                                  |
| `sessions_send`    | 다른 세션에 메시지를 보내고 선택적으로 대기                                 |
| `sessions_spawn`   | 백그라운드 작업을 위한 격리된 하위 에이전트 세션 생성                       |
| `sessions_yield`   | 현재 턴을 종료하고 후속 하위 에이전트 결과 대기                             |
| `subagents`        | 이 세션에서 생성된 하위 에이전트 나열, 조정 또는 종료                       |
| `session_status`   | `/status` 스타일 카드를 표시하고 선택적으로 세션별 모델 재정의 설정         |

이러한 도구에도 활성 도구 프로필과 허용/거부 정책이 계속 적용됩니다.
`tools.profile: "coding"`에는 `sessions_spawn`, `sessions_yield`,
`subagents`를 포함한 전체 세션 오케스트레이션 세트가 포함됩니다.
`tools.profile: "messaging"`에는 교차 세션 메시징 도구
(`sessions_list`, `sessions_history`, `sessions_send`, `session_status`)가
포함되지만 하위 에이전트 생성은 포함되지 않습니다. 메시징 프로필을 유지하면서도
네이티브 위임을 허용하려면 다음을 추가하세요.

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

그룹, provider, 샌드박스, 에이전트별 정책은 프로필 단계 이후에도 해당 도구를
제거할 수 있습니다. 영향을 받는 세션에서 `/tools`를 사용해 실제 도구 목록을
검사하세요.

## 세션 나열 및 읽기

`sessions_list`는 key, agentId, kind, channel, model, 토큰 수, 타임스탬프를
포함한 세션을 반환합니다. kind(`main`, `group`, `cron`, `hook`, `node`),
정확한 `label`, 정확한 `agentId`, 검색 텍스트 또는 최근성(`activeMinutes`)으로
필터링할 수 있습니다. 메일함 스타일의 분류가 필요할 때는 각 행에 대해
가시성 범위의 파생 제목, 마지막 메시지 미리보기 스니펫 또는 제한된 최근 메시지도
요청할 수 있습니다. 파생 제목과 미리보기는 구성된 세션 도구 가시성 정책에 따라
호출자가 이미 볼 수 있는 세션에 대해서만 생성되므로, 관련 없는 세션은 계속
숨겨집니다.

`sessions_history`는 특정 세션의 대화 기록을 가져옵니다.
기본적으로 도구 결과는 제외됩니다. 보려면 `includeTools: true`를 전달하세요.
반환되는 뷰는 의도적으로 제한되고 안전 필터링됩니다.

- assistant 텍스트는 회수 전에 정규화됩니다.
  - thinking 태그가 제거됩니다
  - `<relevant-memories>` / `<relevant_memories>` 스캐폴딩 블록이 제거됩니다
  - `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
    `<function_calls>...</function_calls>` 같은 일반 텍스트 도구 호출 XML 페이로드 블록이 제거되며,
    정상적으로 닫히지 않은 잘린 페이로드도 포함됩니다
  - `[Tool Call: ...]`, `[Tool Result ...]`, `[Historical context ...]` 같은
    다운그레이드된 도구 호출/결과 스캐폴딩이 제거됩니다
  - `<|assistant|>` 같은 유출된 모델 제어 토큰, 기타 ASCII `<|...|>` 토큰,
    전각 `<｜...｜>` 변형이 제거됩니다
  - `<invoke ...>` / `</minimax:tool_call>` 같은 잘못된 MiniMax 도구 호출 XML이 제거됩니다
- 자격 증명/토큰처럼 보이는 텍스트는 반환되기 전에 마스킹됩니다
- 긴 텍스트 블록은 잘립니다
- 매우 큰 기록은 오래된 행을 삭제하거나 너무 큰 행을
  `[sessions_history omitted: message too large]`로 대체할 수 있습니다
- 도구는 `truncated`, `droppedMessages`, `contentTruncated`,
  `contentRedacted`, `bytes` 같은 요약 플래그를 보고합니다

두 도구 모두 **세션 키**(예: `"main"`) 또는 이전 목록 호출에서 받은
**세션 ID**를 받을 수 있습니다.

정확한 바이트 단위 대화 기록이 필요하다면 `sessions_history`를 원시 덤프로
취급하지 말고 디스크의 대화 기록 파일을 검사하세요.

## 교차 세션 메시지 보내기

`sessions_send`는 다른 세션에 메시지를 전달하고 선택적으로 응답을 기다립니다.

- **전송 후 잊기:** `timeoutSeconds: 0`을 설정하면 큐에 넣고 즉시 반환합니다.
- **응답 대기:** 제한 시간을 설정하고 응답을 인라인으로 받습니다.

Slack 또는 Discord 키가 `:thread:<id>`로 끝나는 것처럼 스레드 범위의 채팅
세션은 유효한 `sessions_send` 대상이 아닙니다. 도구 라우팅 메시지가 활성
사용자 대면 스레드 안에 나타나지 않도록, 에이전트 간 조정에는 상위 채널
세션 키를 사용하세요.

메시지와 A2A 후속 응답은 수신 프롬프트(`[Inter-session message ... isUser=false]`)와
대화 기록 출처에서 세션 간 데이터로 표시됩니다. 수신 에이전트는 이를 직접
최종 사용자가 작성한 지시가 아니라 도구 라우팅 데이터로 취급해야 합니다.

대상이 응답한 뒤 OpenClaw는 에이전트가 메시지를 번갈아 보내는 **응답 반환 루프**를
실행할 수 있습니다(최대 5턴). 대상 에이전트는 `REPLY_SKIP`으로 응답해 조기에
중지할 수 있습니다.

## 상태 및 오케스트레이션 헬퍼

`session_status`는 현재 세션 또는 표시 가능한 다른 세션을 위한 가벼운
`/status` 동등 도구입니다. 사용량, 시간, 모델/런타임 상태, 연결된 백그라운드
작업 컨텍스트가 있으면 이를 보고합니다. `/status`처럼 최신 대화 기록 사용량
항목에서 희소한 토큰/캐시 카운터를 백필할 수 있으며, `model=default`는
세션별 재정의를 지웁니다. 호출자의 현재 세션에는 `sessionKey="current"`를
사용하세요. `openclaw-tui` 같은 표시 가능한 클라이언트 label은 세션 키가
아닙니다.

`sessions_yield`는 기다리는 후속 이벤트가 다음 메시지로 올 수 있도록 의도적으로
현재 턴을 종료합니다. 하위 에이전트를 생성한 뒤 완료 결과가 폴링 루프를 만드는
대신 다음 메시지로 도착하기를 원할 때 사용하세요.

`subagents`는 이미 생성된 OpenClaw 하위 에이전트를 위한 제어 평면 헬퍼입니다.
다음을 지원합니다.

- `action: "list"`로 활성/최근 실행 검사
- `action: "steer"`로 실행 중인 자식에게 후속 지침 보내기
- `action: "kill"`로 한 자식 또는 `all` 중지

## 하위 에이전트 생성

`sessions_spawn`은 기본적으로 백그라운드 작업을 위한 격리된 세션을 생성합니다.
항상 논블로킹이며, `runId`와 `childSessionKey`를 즉시 반환합니다.

주요 옵션:

- `runtime: "subagent"`(기본값) 또는 외부 하네스 에이전트용 `"acp"`.
- 자식 세션을 위한 `model` 및 `thinking` 재정의.
- 생성을 채팅 스레드(Discord, Slack 등)에 바인딩하는 `thread: true`.
- 자식에 샌드박싱을 강제하는 `sandbox: "require"`.
- 자식에게 현재 요청자 대화 기록이 필요할 때 네이티브 하위 에이전트용
  `context: "fork"`를 사용하세요. 깨끗한 자식에는 생략하거나
  `context: "isolated"`를 사용하세요. 스레드 바인딩 네이티브 하위 에이전트는
  `threadBindings.defaultSpawnContext`가 달리 지정하지 않는 한 기본적으로
  `context: "fork"`를 사용합니다.

기본 leaf 하위 에이전트는 세션 도구를 받지 않습니다.
`maxSpawnDepth >= 2`이면 depth-1 오케스트레이터 하위 에이전트가 추가로
`sessions_spawn`, `subagents`, `sessions_list`, `sessions_history`를 받아
자신의 자식을 관리할 수 있습니다. leaf 실행은 여전히 재귀 오케스트레이션
도구를 받지 않습니다.

완료 후 announce 단계는 결과를 요청자의 채널에 게시합니다. 완료 전달은 가능한
경우 바인딩된 스레드/토픽 라우팅을 보존하며, 완료 출처가 채널만 식별하더라도
OpenClaw는 직접 전달을 위해 요청자 세션에 저장된 경로(`lastChannel` / `lastTo`)를
재사용할 수 있습니다.

ACP 관련 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 가시성

세션 도구는 에이전트가 볼 수 있는 범위를 제한하도록 범위가 지정됩니다.

| 수준    | 범위                                      |
| ------- | ----------------------------------------- |
| `self`  | 현재 세션만                               |
| `tree`  | 현재 세션 + 생성된 하위 에이전트          |
| `agent` | 이 에이전트의 모든 세션                   |
| `all`   | 모든 세션(구성된 경우 교차 에이전트 포함) |

기본값은 `tree`입니다. 샌드박스된 세션은 구성과 관계없이 `tree`로 제한됩니다.

## 추가 읽기

- [세션 관리](/ko/concepts/session) -- 라우팅, 수명 주기, 유지 관리
- [ACP 에이전트](/ko/tools/acp-agents) -- 외부 하네스 생성
- [멀티 에이전트](/ko/concepts/multi-agent) -- 멀티 에이전트 아키텍처
- [Gateway 구성](/ko/gateway/configuration) -- 세션 도구 구성 조정값

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [세션 정리](/ko/concepts/session-pruning)
