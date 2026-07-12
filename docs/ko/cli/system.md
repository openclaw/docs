---
read_when:
    - Cron 작업을 생성하지 않고 시스템 이벤트를 대기열에 추가하려는 경우
    - Heartbeat을 활성화하거나 비활성화해야 합니다
    - 시스템 프레즌스 항목을 검사하려는 경우
summary: '`openclaw system` CLI 참조(시스템 이벤트, Heartbeat, 프레즌스)'
title: 시스템
x-i18n:
    generated_at: "2026-07-12T00:39:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaca206d8b463fd33f9e3cb21382bbf36469e9daa2706d8a9e2c7fab14b76e7a
    source_path: cli/system.md
    workflow: 16
---

# `openclaw system`

Gateway용 시스템 수준 도우미: 시스템 이벤트를 대기열에 추가하고 Heartbeat를 제어하며 현재 접속 상태를 확인합니다.

모든 `system` 하위 명령은 Gateway RPC를 사용하며 공통 클라이언트 플래그를 지원합니다.

| 플래그            | 기본값                               | 설명                                                                                                                                                                                                 |
| ----------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--url <url>`     | 구성된 경우 `gateway.remote.url`     | Gateway WebSocket URL입니다.                                                                                                                                                                         |
| `--token <token>` | 없음                                 | Gateway 토큰입니다(필요한 경우).                                                                                                                                                                     |
| `--timeout <ms>`  | `30000`                              | RPC 제한 시간(밀리초)입니다.                                                                                                                                                                         |
| `--expect-final`  | 꺼짐                                 | 최종 응답을 기다립니다(에이전트).                                                                                                                                                                    |
| `--json`          | 꺼짐                                 | JSON을 출력합니다. `heartbeat last/enable/disable`과 `system presence`는 이 플래그와 관계없이 항상 원시 RPC JSON 페이로드를 출력하며, `system event`는 이 플래그를 사용하여 JSON과 일반 `ok` 줄 사이를 전환합니다. |

## 일반 명령

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

기본적으로 **main** 세션의 대기열에 시스템 이벤트를 추가합니다. 다음 Heartbeat는 이를 프롬프트에 `System:` 줄로 삽입합니다. Heartbeat를 즉시 트리거하려면 `--mode now`를 사용하고, 다음 예약 틱까지 기다리려면 `next-heartbeat`(기본값)를 사용합니다.

비동기 작업의 완료를 해당 작업을 시작한 채널로 다시 전달하는 경우처럼 특정 세션을 대상으로 하려면 `--session-key`를 전달합니다.

<Note>
**`--session-key` 사용 시 타이밍 예외:** `--session-key`가 제공되면 `--mode next-heartbeat`는 다음 예약 틱을 기다리는 대신 대상 세션을 즉시 깨웁니다. 대상 깨우기는 Heartbeat 의도 `immediate`를 사용하므로, 그렇지 않으면 `event` 의도의 깨우기를 연기하여 사실상 누락시킬 수 있는 실행기의 아직 실행 시점이 아니라는 게이트를 우회합니다. 지연 전달을 원한다면 `--session-key`를 생략하여 이벤트가 main 세션에 도착한 뒤 다음 정기 Heartbeat를 통해 전달되도록 하십시오.
</Note>

플래그:

- `--text <text>`: 필수 시스템 이벤트 텍스트입니다.
- `--mode <mode>`: `now` 또는 `next-heartbeat`(기본값)입니다.
- `--session-key <sessionKey>`: 선택 사항이며, 에이전트의 main 세션 대신 특정 에이전트 세션을 대상으로 합니다. 확인된 에이전트에 속하지 않는 키는 해당 에이전트의 main 세션으로 대체됩니다.

## `system heartbeat last|enable|disable`

- `last`: 마지막 Heartbeat 이벤트를 표시합니다.
- `enable`: Heartbeat를 다시 켭니다(비활성화된 경우 사용).
- `disable`: Heartbeat를 일시 중지합니다.

## `system presence`

Gateway가 인식하는 현재 시스템 접속 상태 항목(Node, 인스턴스 및 이와 유사한 상태 줄)을 나열합니다.

## 참고

- 현재 구성에서 접근할 수 있는 실행 중인 Gateway가 필요합니다(로컬 또는 원격).
- 시스템 이벤트는 일시적이며 재시작 후에도 유지되지 않습니다.

## 관련 문서

- [CLI 참조](/ko/cli)
