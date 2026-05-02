---
read_when:
    - 자동 응답 실행 또는 동시성 변경
    - /queue 모드 또는 메시지 라우팅 동작 설명
summary: 자동 응답 큐 모드, 기본값 및 세션별 재정의
title: 명령 대기열
x-i18n:
    generated_at: "2026-05-02T20:48:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: c59ea6802d8bf526f4005db3b1baa87d96a23d561c916f91520e8e641fbaf74f
    source_path: concepts/queue.md
    workflow: 16
---

인바운드 자동 응답 실행(모든 채널)을 작은 프로세스 내 큐를 통해 직렬화하여 여러 에이전트 실행이 충돌하지 않도록 하면서, 세션 간에는 안전한 병렬 처리를 계속 허용합니다.

## 이유

- 자동 응답 실행은 비용이 클 수 있으며(LLM 호출), 여러 인바운드 메시지가 짧은 간격으로 도착하면 충돌할 수 있습니다.
- 직렬화하면 공유 리소스(세션 파일, 로그, CLI stdin)를 두고 경쟁하는 일을 피하고 업스트림 속도 제한 가능성을 줄일 수 있습니다.

## 작동 방식

- 레인 인식 FIFO 큐는 설정 가능한 동시성 한도에 따라 각 레인을 비웁니다(설정되지 않은 레인의 기본값은 1, main 기본값은 4, subagent 기본값은 8).
- `runEmbeddedPiAgent`는 **세션 키**(레인 `session:<key>`)별로 큐에 넣어 세션당 활성 실행이 하나만 있도록 보장합니다.
- 그런 다음 각 세션 실행은 **전역 레인**(기본값 `main`)에 큐잉되어 전체 병렬성이 `agents.defaults.maxConcurrent`로 제한됩니다.
- 자세한 로깅이 활성화된 경우, 큐에 들어간 실행은 시작 전 대기 시간이 약 2초를 넘으면 짧은 알림을 내보냅니다.
- 입력 표시기는 큐에 넣는 즉시 계속 실행되므로(채널에서 지원하는 경우) 순서를 기다리는 동안에도 사용자 경험은 변하지 않습니다.

## 기본값

설정되지 않은 경우, 모든 인바운드 채널 표면은 다음을 사용합니다.

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer`는 활성 모델 턴의 응답성을 유지하면서 두 번째 세션 실행을 시작하지 않기 때문에 기본값입니다. 다음 모델 경계 전에 도착한 모든 조향 메시지를 비웁니다. 현재 실행이 조향을 받을 수 없는 경우 OpenClaw는 후속 큐 항목으로 폴백합니다.

## 큐 모드

인바운드 메시지는 현재 실행을 조향하거나, 후속 턴을 기다리거나, 둘 다 수행할 수 있습니다.

- `steer`: 조향 메시지를 활성 런타임에 큐잉합니다. Pi는 다음 LLM 호출 전에 **현재 어시스턴트 턴이 도구 호출 실행을 마친 뒤** 모든 대기 중인 조향 메시지를 전달합니다. Codex 앱 서버는 배치된 `turn/steer` 하나를 받습니다. 실행이 활성 스트리밍 중이 아니거나 조향을 사용할 수 없는 경우 OpenClaw는 후속 큐 항목으로 폴백합니다.
- `queue`(레거시): 기존의 한 번에 하나씩 처리하는 조향입니다. Pi는 각 모델 경계에서 큐잉된 조향 메시지 하나를 전달합니다. Codex 앱 서버는 별도의 `turn/steer` 요청을 받습니다. 이전의 직렬화된 동작이 필요한 경우가 아니라면 `steer`를 권장합니다.
- `followup`: 현재 실행이 끝난 뒤 나중의 에이전트 턴을 위해 각 메시지를 큐에 넣습니다.
- `collect`: 조용한 기간 이후 큐잉된 메시지를 **단일** 후속 턴으로 병합합니다. 메시지가 서로 다른 채널/스레드를 대상으로 하는 경우 라우팅을 보존하기 위해 개별적으로 비워집니다.
- `steer-backlog`(`steer+backlog`라고도 함): 지금 조향하고 **동시에** 같은 메시지를 후속 턴용으로 보존합니다.
- `interrupt`(레거시): 해당 세션의 활성 실행을 중단한 다음 최신 메시지를 실행합니다.

Steer-backlog를 사용하면 조향된 실행 이후 후속 응답을 받을 수 있으므로 스트리밍 표면에서는 중복처럼 보일 수 있습니다. 인바운드 메시지당 하나의 응답을 원한다면 `collect`/`steer`를 권장합니다.

런타임별 타이밍 및 의존성 동작은 [조향 큐](/ko/concepts/queue-steering)를 참조하세요.

`messages.queue`를 통해 전역 또는 채널별로 설정합니다.

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

옵션은 `followup`, `collect`, `steer-backlog`에 적용됩니다(그리고 조향이 후속으로 폴백하는 경우 `steer` 또는 레거시 `queue`에도 적용됩니다).

- `debounceMs`: 큐잉된 후속 항목을 비우기 전 조용한 기간입니다. 단위 없는 숫자는 밀리초이며, `/queue` 옵션은 `ms`, `s`, `m`, `h`, `d` 단위를 허용합니다.
- `cap`: 세션당 큐잉 가능한 최대 메시지 수입니다. `1`보다 작은 값은 무시됩니다.
- `drop: "summarize"`: 기본값입니다. 필요에 따라 가장 오래된 큐 항목을 버리고, 압축된 요약을 보관한 뒤 합성 후속 프롬프트로 주입합니다.
- `drop: "old"`: 필요에 따라 가장 오래된 큐 항목을 버리며, 요약은 보존하지 않습니다.
- `drop: "new"`: 큐가 이미 가득 찬 경우 최신 메시지를 거부합니다.

기본값: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## 우선순위

모드 선택 시 OpenClaw는 다음 순서로 해석합니다.

1. 인라인 또는 저장된 세션별 `/queue` 재정의.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. 기본값 `steer`.

옵션의 경우 인라인 또는 저장된 `/queue` 옵션이 설정보다 우선합니다. 그런 다음 채널별 디바운스(`messages.queue.debounceMsByChannel`), Plugin 디바운스 기본값, 전역 `messages.queue` 옵션, 내장 기본값이 적용됩니다. `cap`과 `drop`은 전역/세션 옵션이며 채널별 설정 키가 아닙니다.

## 세션별 재정의

- 현재 세션의 모드를 저장하려면 `/queue <mode>`를 독립 실행 명령으로 보냅니다.
- 옵션은 조합할 수 있습니다: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 또는 `/queue reset`은 세션 재정의를 지웁니다.

## 범위와 보장

- Gateway 응답 파이프라인을 사용하는 모든 인바운드 채널의 자동 응답 에이전트 실행에 적용됩니다(WhatsApp 웹, Telegram, Slack, Discord, Signal, iMessage, 웹챗 등).
- 기본 레인(`main`)은 인바운드 + main Heartbeat에 대해 프로세스 전체에 적용됩니다. 여러 세션을 병렬로 허용하려면 `agents.defaults.maxConcurrent`를 설정하세요.
- 추가 레인이 존재할 수 있으므로(예: `cron`, `cron-nested`, `nested`, `subagent`) 백그라운드 작업은 인바운드 응답을 차단하지 않고 병렬로 실행될 수 있습니다. 격리된 cron 에이전트 턴은 내부 에이전트 실행이 `cron-nested`를 사용하는 동안 `cron` 슬롯을 보유합니다. 둘 다 `cron.maxConcurrentRuns`를 사용합니다. 공유 비 cron `nested` 흐름은 자체 레인 동작을 유지합니다. 이러한 분리된 실행은 [백그라운드 작업](/ko/automation/tasks)으로 추적됩니다.
- 세션별 레인은 특정 세션을 한 번에 하나의 에이전트 실행만 건드리도록 보장합니다.
- 외부 의존성이나 백그라운드 워커 스레드가 없습니다. 순수 TypeScript + promise만 사용합니다.

## 문제 해결

- 명령이 멈춘 것처럼 보이면 자세한 로그를 활성화하고 “queued for …ms” 줄을 찾아 큐가 비워지고 있는지 확인하세요.
- 큐 깊이가 필요하면 자세한 로그를 활성화하고 큐 타이밍 줄을 확인하세요.
- 턴을 수락한 뒤 진행 상황 내보내기를 중단하는 Codex 앱 서버 실행은 Codex 어댑터에 의해 중단되므로, 활성 세션 레인이 외부 실행 제한 시간을 기다리지 않고 해제될 수 있습니다.
- 진단이 활성화된 경우 `diagnostics.stuckSessionWarnMs`가 지난 뒤에도 관찰된 응답, 도구, 상태, 블록 또는 ACP 진행이 없는 상태로 `processing`에 남아 있는 세션은 현재 활동별로 분류됩니다. 활성 작업은 `session.long_running`으로 기록됩니다. 최근 진행이 없는 활성 작업은 `session.stalled`로 기록됩니다. `session.stuck`은 활성 작업이 없는 오래된 세션 장부 처리에만 예약되며, 해당 경로만 영향을 받은 세션 레인을 해제해 큐잉된 작업이 비워지도록 할 수 있습니다. 반복되는 `session.stuck` 진단은 세션이 변경되지 않은 동안 백오프됩니다.

## 관련 항목

- [세션 관리](/ko/concepts/session)
- [조향 큐](/ko/concepts/queue-steering)
- [재시도 정책](/ko/concepts/retry)
