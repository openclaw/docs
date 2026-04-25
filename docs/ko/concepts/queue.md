---
read_when:
    - 자동 응답 실행 또는 동시성을 변경하기
summary: 인바운드 자동 응답 실행을 직렬화하는 명령 큐 설계
title: 명령 큐
x-i18n:
    generated_at: "2026-04-25T05:59:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c027be3e9a67f91a49c5d4d69fa8191d3e7651265a152c4723b10062b339f2a
    source_path: concepts/queue.md
    workflow: 15
---

여러 인바운드 메시지가 가까운 시점에 도착하더라도 여러 에이전트 실행이 충돌하지 않도록, 모든 채널의 인바운드 자동 응답 실행을 작은 프로세스 내 큐를 통해 직렬화하면서도 세션 간 안전한 병렬성은 허용합니다.

## 이유

- 자동 응답 실행은 비용이 클 수 있으며(LLM 호출), 여러 인바운드 메시지가 짧은 간격으로 도착하면 충돌할 수 있습니다.
- 직렬화는 공유 리소스(세션 파일, 로그, CLI stdin) 경쟁을 피하고 상위 시스템의 속도 제한 가능성을 줄여줍니다.

## 작동 방식

- lane 인식 FIFO 큐가 각 lane을 구성 가능한 동시성 상한으로 비웁니다(구성되지 않은 lane의 기본값은 1, main 기본값은 4, subagent 기본값은 8).
- `runEmbeddedPiAgent`는 **세션 키**(lane `session:<key>`) 기준으로 큐에 넣어 세션당 활성 실행이 하나만 존재하도록 보장합니다.
- 그런 다음 각 세션 실행은 **전역 lane**(`main`이 기본값)에도 큐잉되어 전체 병렬성이 `agents.defaults.maxConcurrent`로 제한됩니다.
- 상세 로깅이 활성화되어 있으면, 큐에 들어간 실행은 시작 전 약 2초 이상 대기한 경우 짧은 알림을 내보냅니다.
- 입력 중 표시기는 큐에 들어가는 즉시 계속 작동하므로(채널이 지원하는 경우), 순서를 기다리는 동안에도 사용자 경험은 변하지 않습니다.

## 큐 모드(채널별)

인바운드 메시지는 현재 실행을 조정하거나, 후속 턴을 기다리거나, 둘 다 할 수 있습니다.

- `steer`: 현재 실행에 즉시 주입합니다(다음 도구 경계 이후 보류 중인 도구 호출을 취소). 스트리밍 중이 아니면 `followup`으로 대체됩니다.
- `followup`: 현재 실행이 끝난 뒤 다음 에이전트 턴을 위해 큐에 넣습니다.
- `collect`: 큐에 있는 모든 메시지를 **하나의** 후속 턴으로 합칩니다(기본값). 메시지가 서로 다른 채널/스레드를 대상으로 하면 라우팅을 보존하기 위해 개별적으로 비워집니다.
- `steer-backlog` (또는 `steer+backlog`): 지금 조정하면서 **동시에** 후속 턴을 위해 메시지를 보존합니다.
- `interrupt` (레거시): 해당 세션의 활성 실행을 중단한 뒤 최신 메시지를 실행합니다.
- `queue` (레거시 별칭): `steer`와 동일합니다.

steer-backlog는 조정된 실행 뒤에 후속 응답이 추가로 올 수 있다는 뜻이므로,
스트리밍 표면에서는 중복처럼 보일 수 있습니다. 인바운드 메시지당
응답 하나만 원한다면 `collect`/`steer`를 권장합니다.
독립 실행 명령어로 `/queue collect`를 보내거나(세션별), `messages.queue.byChannel.discord: "collect"`를 설정하세요.

기본값(구성에서 설정되지 않은 경우):

- 모든 표면 → `collect`

전역 또는 채널별로 `messages.queue`를 통해 구성하세요.

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 큐 옵션

옵션은 `followup`, `collect`, `steer-backlog`에 적용되며(`steer`가 `followup`으로 대체될 때도 적용됨):

- `debounceMs`: 후속 턴을 시작하기 전에 잠잠해질 때까지 대기합니다(“계속, 계속” 방지).
- `cap`: 세션당 최대 큐 메시지 수.
- `drop`: 오버플로 정책 (`old`, `new`, `summarize`).

summarize는 드롭된 메시지의 짧은 글머리표 목록을 유지하고 이를 합성 후속 프롬프트로 주입합니다.
기본값: `debounceMs: 1000`, `cap: 20`, `drop: summarize`.

## 세션별 재정의

- 독립 실행 명령어로 `/queue <mode>`를 보내 현재 세션의 모드를 저장할 수 있습니다.
- 옵션을 조합할 수 있습니다: `/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 또는 `/queue reset`은 세션 재정의를 지웁니다.

## 범위 및 보장

- Gateway 답장 파이프라인을 사용하는 모든 인바운드 채널의 자동 응답 에이전트 실행에 적용됩니다(WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat 등).
- 기본 lane(`main`)은 인바운드 + 메인 Heartbeat에 대해 프로세스 전체에서 공유됩니다. 여러 세션을 병렬로 허용하려면 `agents.defaults.maxConcurrent`를 설정하세요.
- 추가 lane(`cron`, `subagent` 등)이 존재할 수 있으므로, 백그라운드 작업이 인바운드 답장을 막지 않고 병렬로 실행될 수 있습니다. 이러한 분리된 실행은 [background tasks](/ko/automation/tasks)로 추적됩니다.
- 세션별 lane은 주어진 세션을 한 번에 하나의 에이전트 실행만 건드리도록 보장합니다.
- 외부 의존성이나 백그라운드 워커 스레드가 없습니다. 순수 TypeScript + promises만 사용합니다.

## 문제 해결

- 명령어가 멈춘 것처럼 보이면 상세 로그를 활성화하고 “queued for …ms” 줄을 찾아 큐가 실제로 비워지고 있는지 확인하세요.
- 큐 깊이가 필요하면 상세 로그를 활성화하고 큐 타이밍 줄을 확인하세요.

## 관련 항목

- [Session management](/ko/concepts/session)
- [Retry policy](/ko/concepts/retry)
