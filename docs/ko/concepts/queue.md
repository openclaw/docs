---
read_when:
    - 자동 응답 실행 또는 동시성 변경
    - /queue 모드 또는 메시지 조정 동작 설명
summary: 자동 응답 대기열 모드, 기본값, 세션별 재정의
title: 명령 대기열
x-i18n:
    generated_at: "2026-06-27T17:25:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

인바운드 자동 응답 실행(모든 채널)을 작은 인프로세스 큐를 통해 직렬화하여 여러 에이전트 실행이 충돌하지 않도록 하면서, 세션 간 안전한 병렬 처리는 계속 허용합니다.

## 이유

- 자동 응답 실행은 비용이 클 수 있으며(LLM 호출), 여러 인바운드 메시지가 가까운 시간에 도착하면 충돌할 수 있습니다.
- 직렬화하면 공유 리소스(세션 파일, 로그, CLI stdin)를 두고 경쟁하는 일을 피하고, 업스트림 속도 제한에 걸릴 가능성을 줄입니다.

## 작동 방식

- 레인 인식 FIFO 큐가 구성 가능한 동시성 한도에 따라 각 레인을 비웁니다(구성되지 않은 레인은 기본 1, main은 기본 4, subagent는 기본 8).
- `runEmbeddedAgent`는 **세션 키**(레인 `session:<key>`)별로 큐에 넣어 세션당 활성 실행이 하나만 있도록 보장합니다.
- 그런 다음 각 세션 실행은 **전역 레인**(기본값은 `main`)에 큐잉되어 전체 병렬 처리가 `agents.defaults.maxConcurrent`로 제한됩니다.
- 상세 로깅이 활성화되면, 큐에 들어간 실행이 시작 전 약 2초 넘게 기다린 경우 짧은 알림을 내보냅니다.
- 입력 중 표시기는 (채널에서 지원하는 경우) 큐에 넣는 즉시 계속 동작하므로, 순서를 기다리는 동안에도 사용자 경험은 달라지지 않습니다.

## 기본값

설정하지 않으면 모든 인바운드 채널 표면은 다음을 사용합니다.

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

동일 턴 조향이 기본값입니다. 실행 중간에 프롬프트가 도착하면, 해당 실행이 조향을 받을 수 있을 때 활성 런타임에 주입되므로 두 번째 세션 실행은 시작되지 않습니다. 활성 실행이 조향을 받을 수 없으면 OpenClaw는 프롬프트를 시작하기 전에 활성 실행이 끝날 때까지 기다립니다.

## 큐 모드

`/queue`는 세션에 이미 활성 실행이 있을 때 일반 인바운드 메시지가 어떻게 동작할지 제어합니다.

- `steer`: 메시지를 활성 런타임에 주입합니다. OpenClaw는 다음 LLM 호출 전에 **현재 어시스턴트 턴이 도구 호출 실행을 마친 뒤** 대기 중인 모든 조향 메시지를 전달합니다. Codex app-server는 배치된 `turn/steer` 하나를 받습니다. 실행이 활발히 스트리밍 중이 아니거나 조향을 사용할 수 없으면, OpenClaw는 활성 실행이 끝날 때까지 기다린 뒤 프롬프트를 시작합니다.
- `followup`: 조향하지 않습니다. 현재 실행이 끝난 뒤 나중의 에이전트 턴을 위해 각 메시지를 큐에 넣습니다.
- `collect`: 조향하지 않습니다. 대기 시간이 지난 뒤 큐에 쌓인 메시지를 **단일** 후속 턴으로 병합합니다. 메시지가 서로 다른 채널/스레드를 대상으로 하면 라우팅을 보존하기 위해 개별적으로 비웁니다.
- `interrupt`: 해당 세션의 활성 실행을 중단한 다음 최신 메시지를 실행합니다.

런타임별 타이밍과 종속성 동작은 [조향 큐](/ko/concepts/queue-steering)를 참고하세요. 명시적인 `/steer <message>` 명령은 [조향](/ko/tools/steer)을 참고하세요.

`messages.queue`를 통해 전역 또는 채널별로 구성합니다.

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 큐 옵션

옵션은 큐에 들어간 전달에 적용됩니다. `debounceMs`는 `steer` 모드에서 Codex 조향 대기 시간도 설정합니다.

- `debounceMs`: 큐에 들어간 후속 메시지 또는 수집 배치를 비우기 전의 대기 시간입니다. Codex `steer` 모드에서는 배치된 `turn/steer`를 보내기 전의 대기 시간입니다. 단독 숫자는 밀리초이며, `/queue` 옵션에서는 단위 `ms`, `s`, `m`, `h`, `d`를 사용할 수 있습니다.
- `cap`: 세션당 큐에 넣을 수 있는 최대 메시지 수입니다. `1` 미만의 값은 무시됩니다.
- `drop: "summarize"`: 기본값입니다. 필요에 따라 가장 오래된 큐 항목을 버리고, 압축 요약을 유지한 뒤 이를 합성 후속 프롬프트로 주입합니다.
- `drop: "old"`: 필요에 따라 가장 오래된 큐 항목을 버리되, 요약은 보존하지 않습니다.
- `drop: "new"`: 큐가 이미 가득 찬 경우 최신 메시지를 거부합니다.

기본값: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## 조향과 스트리밍

채널 스트리밍이 `partial` 또는 `block`이면, 활성 실행이 런타임 경계에 도달하는 동안 조향이 여러 개의 짧은 표시 응답처럼 보일 수 있습니다.

- `partial`: 미리보기가 일찍 확정된 뒤, 조향이 수락되면 새 미리보기가 시작될 수 있습니다.
- `block`: 초안 크기의 블록도 같은 순차적 표시를 만들 수 있습니다.
- 스트리밍이 없으면, 런타임이 동일 턴 조향을 받을 수 없을 때 조향은 활성 실행 이후의 후속 실행으로 대체됩니다.

`steer`는 실행 중인 도구를 중단하지 않습니다. 최신 메시지가 현재 실행을 중단해야 할 때는 `/queue interrupt`를 사용하세요.

## 우선순위

모드 선택 시 OpenClaw는 다음 순서로 해석합니다.

1. 인라인 또는 저장된 세션별 `/queue` 재정의.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. 기본 `steer`.

옵션의 경우 인라인 또는 저장된 `/queue` 옵션이 구성보다 우선합니다. 그다음 채널별 디바운스(`messages.queue.debounceMsByChannel`), Plugin 디바운스 기본값, 전역 `messages.queue` 옵션, 내장 기본값이 적용됩니다. `cap`과 `drop`은 전역/세션 옵션이며, 채널별 구성 키가 아닙니다.

## 세션별 재정의

- 현재 세션의 큐 모드를 저장하려면 `/queue <steer|followup|collect|interrupt>`를 독립 명령으로 보냅니다.
- 옵션은 조합할 수 있습니다: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 또는 `/queue reset`은 세션 재정의를 지웁니다.

## 범위와 보장

- Gateway 응답 파이프라인을 사용하는 모든 인바운드 채널(WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat 등)의 자동 응답 에이전트 실행에 적용됩니다.
- 기본 레인(`main`)은 인바운드 + main Heartbeat에 대해 프로세스 전체 범위입니다. 여러 세션을 병렬로 허용하려면 `agents.defaults.maxConcurrent`를 설정하세요.
- 추가 레인(예: `cron`, `cron-nested`, `nested`, `subagent`)이 존재할 수 있으므로, 백그라운드 작업은 인바운드 응답을 막지 않고 병렬로 실행될 수 있습니다. 격리된 Cron 에이전트 턴은 내부 에이전트 실행이 `cron-nested`를 사용하는 동안 `cron` 슬롯을 보유합니다. 둘 다 `cron.maxConcurrentRuns`를 사용합니다. 공유 non-Cron `nested` 흐름은 자체 레인 동작을 유지합니다. 이러한 분리된 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.
- 세션별 레인은 지정된 세션을 한 번에 하나의 에이전트 실행만 건드리도록 보장합니다.
- 외부 종속성이나 백그라운드 워커 스레드가 없습니다. 순수 TypeScript + 프로미스입니다.

## 문제 해결

- 명령이 멈춘 것처럼 보이면 상세 로그를 활성화하고 "queued for ...ms" 줄을 찾아 큐가 비워지고 있는지 확인하세요.
- 큐 깊이가 필요하면 상세 로그를 활성화하고 큐 타이밍 줄을 확인하세요.
- 턴을 수락한 뒤 진행 상황 내보내기를 멈춘 Codex app-server 실행은 Codex 어댑터가 중단하므로, 활성 세션 레인은 외부 실행 시간 제한을 기다리는 대신 해제될 수 있습니다.
- 진단이 활성화되면, 관찰된 응답, 도구, 상태, 블록 또는 ACP 진행 없이 `diagnostics.stuckSessionWarnMs`를 지나 `processing` 상태로 남아 있는 세션은 현재 활동별로 분류됩니다. 활성 작업은 `session.long_running`으로 기록됩니다. 소유자가 있는 무응답 모델 호출도 `diagnostics.stuckSessionAbortMs`까지는 `session.long_running`에 남아, 느리거나 스트리밍하지 않는 공급자가 너무 일찍 정지로 보고되지 않도록 합니다. 최근 진행이 없는 활성 작업은 `session.stalled`로 기록됩니다. 소유자가 있는 모델 호출은 중단 임계값 시점 또는 이후에 `session.stalled`로 전환되며, 소유자가 없는 오래된 모델/도구 활동은 장기 실행으로 숨겨지지 않습니다. `session.stuck`은 오래된 세션 부기 중 복구 가능한 경우에만 예약되어 있으며, 여기에는 소유자가 없는 오래된 모델/도구 활동이 있는 유휴 큐 세션이 포함됩니다. 그리고 이 경로만 영향을 받은 세션 레인을 해제해 큐에 있는 작업이 비워지게 할 수 있습니다. 반복되는 `session.stuck` 진단은 세션이 변경되지 않는 동안 백오프됩니다.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [조향 큐](/ko/concepts/queue-steering)
- [조향](/ko/tools/steer)
- [재시도 정책](/ko/concepts/retry)
