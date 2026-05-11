---
read_when:
    - Cron 작업을 만들지 않고 시스템 이벤트를 큐에 추가하려는 경우
    - Heartbeat를 활성화하거나 비활성화해야 합니다
    - 시스템 현재 상태 항목을 검사하려는 경우
summary: '`openclaw system`에 대한 CLI 참조(시스템 이벤트, Heartbeat, 프레즌스)'
title: 시스템
x-i18n:
    generated_at: "2026-05-11T20:27:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2810fb064ea4afeac24ca0d71419913a664bbec0721cabdb09196075914f4864
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway용 시스템 수준 헬퍼: 시스템 이벤트를 대기열에 추가하고, Heartbeat를 제어하며,
presence를 봅니다.

모든 `system` 하위 명령은 Gateway RPC를 사용하며 공유 클라이언트 플래그를 받습니다.

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 일반 명령

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

기본적으로 **기본** 세션에 시스템 이벤트를 대기열에 추가합니다. 다음 Heartbeat가
프롬프트에 `System:` 줄로 이를 삽입합니다. Heartbeat를 즉시 트리거하려면
`--mode now`를 사용하세요. `next-heartbeat`는 다음 예약된 틱까지 기다립니다.

특정 세션을 대상으로 지정하려면 `--session-key`를 전달하세요. 예를 들어
비동기 작업 완료를 시작한 채널로 다시 전달할 때 사용할 수 있습니다.

> **`--session-key` 사용 시 타이밍 예외:** `--session-key`가 제공되면
> `--mode next-heartbeat`는 다음 예약된 틱을 기다리는 대신 즉시 대상 지정 깨우기로
> 축소됩니다. 대상 지정 깨우기는 Heartbeat 의도 `immediate`를 사용하므로, 그렇지 않으면
> `event` 의도 깨우기를 지연하고 사실상 드롭할 러너의 not-due 게이트를 우회합니다.
> 지연 전달을 원하면 `--session-key`를 생략하여 이벤트가 기본 세션에 도착하고
> 다음 정규 Heartbeat에 실리도록 하세요.

플래그:

- `--text <text>`: 필수 시스템 이벤트 텍스트입니다.
- `--mode <mode>`: `now` 또는 `next-heartbeat`(기본값)입니다.
- `--session-key <sessionKey>`: 선택 사항입니다. 에이전트의 기본 세션 대신 특정 에이전트 세션을
  대상으로 지정합니다. 해석된 에이전트에 속하지 않는 키는 에이전트의 기본 세션으로 폴백됩니다.
- `--json`: 기계가 읽을 수 있는 출력입니다.
- `--url`, `--token`, `--timeout`, `--expect-final`: 공유 Gateway RPC 플래그입니다.

## `system heartbeat last|enable|disable`

Heartbeat 제어:

- `last`: 마지막 Heartbeat 이벤트를 표시합니다.
- `enable`: Heartbeat를 다시 켭니다(비활성화된 경우 사용).
- `disable`: Heartbeat를 일시 중지합니다.

플래그:

- `--json`: 기계가 읽을 수 있는 출력입니다.
- `--url`, `--token`, `--timeout`, `--expect-final`: 공유 Gateway RPC 플래그입니다.

## `system presence`

Gateway가 알고 있는 현재 시스템 presence 항목을 나열합니다(노드,
인스턴스 및 유사한 상태 줄).

플래그:

- `--json`: 기계가 읽을 수 있는 출력입니다.
- `--url`, `--token`, `--timeout`, `--expect-final`: 공유 Gateway RPC 플래그입니다.

## 참고

- 현재 설정(로컬 또는 원격)으로 도달할 수 있는 실행 중인 Gateway가 필요합니다.
- 시스템 이벤트는 임시적이며 재시작 후 유지되지 않습니다.

## 관련

- [CLI 참조](/ko/cli)
