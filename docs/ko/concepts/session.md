---
read_when:
    - 세션 라우팅과 격리를 이해하려는 경우
    - 다중 사용자 설정을 위해 DM 범위를 구성하려는 경우
    - 일일 또는 유휴 세션 재설정을 디버깅하고 있습니다
summary: OpenClaw가 대화 세션을 관리하는 방식
title: 세션 관리
x-i18n:
    generated_at: "2026-05-07T13:15:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4e5ec741a33262ce5c42caf021ad81892e89b3315db31ac7b141d5a13e8b22a2
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw는 대화를 **세션**으로 구성합니다. 각 메시지는 어디에서 왔는지에 따라
세션으로 라우팅됩니다. 예: DM, 그룹 채팅, Cron 작업 등.

## 메시지가 라우팅되는 방식

| 소스          | 동작                  |
| --------------- | ------------------------- |
| 다이렉트 메시지 | 기본적으로 공유 세션 |
| 그룹 채팅     | 그룹별로 격리        |
| 방/채널  | 방별로 격리         |
| Cron 작업       | 실행할 때마다 새 세션     |
| Webhook        | Hook별로 격리         |

## DM 격리

기본적으로 모든 DM은 연속성을 위해 하나의 세션을 공유합니다. 이는
단일 사용자 설정에는 적합합니다.

<Warning>
여러 사람이 에이전트에 메시지를 보낼 수 있다면 DM 격리를 활성화하세요. 활성화하지 않으면 모든
사용자가 같은 대화 컨텍스트를 공유하게 됩니다. Alice의 비공개 메시지가
Bob에게 보일 수 있습니다.
</Warning>

**수정 방법:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

다른 옵션:

- `main`(기본값) -- 모든 DM이 하나의 세션을 공유합니다.
- `per-peer` -- 보낸 사람별로 격리합니다(채널 전체).
- `per-channel-peer` -- 채널 + 보낸 사람별로 격리합니다(권장).
- `per-account-channel-peer` -- 계정 + 채널 + 보낸 사람별로 격리합니다.

<Tip>
같은 사람이 여러 채널에서 연락하는 경우
`session.identityLinks`를 사용해 해당 신원을 연결하면 하나의 세션을 공유할 수 있습니다.
</Tip>

### 연결된 채널 Dock

Dock 명령을 사용하면 사용자가 새 세션을 시작하지 않고 현재 다이렉트 채팅 세션의 답장 경로를
다른 연결된 채널로 이동할 수 있습니다.
예시, 구성, 문제 해결은 [채널 도킹](/ko/concepts/channel-docking)을 참조하세요.

`openclaw security audit`로 설정을 확인하세요.

## 세션 수명 주기

세션은 만료될 때까지 재사용됩니다.

- **일일 재설정**(기본값) -- Gateway 호스트의 로컬 시간 기준 오전 4:00에
  새 세션을 시작합니다. 일일 최신성은 현재 `sessionId`가 시작된 시점을 기준으로 하며,
  이후의 메타데이터 쓰기를 기준으로 하지 않습니다.
- **유휴 재설정**(선택 사항) -- 비활성 상태가 일정 기간 지속되면 새 세션을 시작합니다.
  `session.reset.idleMinutes`를 설정하세요. 유휴 최신성은 마지막 실제
  사용자/채널 상호작용을 기준으로 하므로 Heartbeat, Cron, exec 시스템 이벤트는
  세션을 계속 활성 상태로 유지하지 않습니다.
- **수동 재설정** -- 채팅에서 `/new` 또는 `/reset`을 입력합니다. `/new <model>`은
  모델도 전환합니다.

일일 재설정과 유휴 재설정이 모두 구성된 경우, 먼저 만료되는 쪽이 적용됩니다.
Heartbeat, Cron, exec 및 기타 시스템 이벤트 턴은 세션 메타데이터를 쓸 수 있지만,
이러한 쓰기는 일일 또는 유휴 재설정 최신성을 연장하지 않습니다. 재설정으로
세션이 넘어가면 오래된 백그라운드 업데이트가 새 세션의 첫 프롬프트 앞에 추가되지 않도록
이전 세션의 대기 중인 시스템 이벤트 알림은 폐기됩니다.

활성 provider 소유 CLI 세션이 있는 세션은 암시적 일일 기본값으로 끊기지 않습니다.
해당 세션이 타이머에 따라 만료되어야 한다면 `/reset`을 사용하거나 `session.reset`을 명시적으로 구성하세요.

## 상태가 저장되는 위치

모든 세션 상태는 **Gateway**가 소유합니다. UI 클라이언트는 Gateway에
세션 데이터를 질의합니다.

- **저장소:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **전사:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json`은 별도의 수명 주기 타임스탬프를 유지합니다.

- `sessionStartedAt`: 현재 `sessionId`가 시작된 시점입니다. 일일 재설정은 이를 사용합니다.
- `lastInteractionAt`: 유휴 수명을 연장하는 마지막 사용자/채널 상호작용입니다.
- `updatedAt`: 마지막 저장소 행 변경 시점입니다. 목록 표시와 정리에 유용하지만
  일일/유휴 재설정 최신성의 권위 있는 기준은 아닙니다.

`sessionStartedAt`이 없는 이전 행은 가능한 경우 전사 JSONL
세션 헤더에서 확인합니다. 이전 행에 `lastInteractionAt`도 없으면
유휴 최신성은 이후의 장부 기록 쓰기가 아니라 해당 세션 시작 시점으로 대체됩니다.

## 세션 유지 관리

OpenClaw는 시간이 지나도 세션 저장소가 자동으로 제한되도록 합니다. 기본적으로
`warn` 모드로 실행됩니다(정리될 항목을 보고). 자동 정리를 위해 `session.maintenance.mode`를
`"enforce"`로 설정하세요.

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

프로덕션 규모의 `maxEntries` 제한의 경우, Gateway 런타임 쓰기는 작은 high-water 버퍼를 사용하고 배치 단위로 구성된 상한까지 다시 정리합니다. 세션 저장소 읽기는 Gateway 시작 중에 항목을 정리하거나 제한하지 않습니다. 이렇게 하면 시작할 때마다 또는 격리된 Cron 세션마다 전체 저장소 정리가 실행되는 일을 피할 수 있습니다. `openclaw sessions cleanup --enforce`는 상한을 즉시 적용합니다.

유지 관리는 그룹 세션과 스레드 범위 채팅 세션을 포함해 내구성 있는 외부 대화 포인터를 보존하면서도,
합성 Cron, Hook, Heartbeat, ACP 및 하위 에이전트 항목은 오래되면 제거될 수 있게 합니다.

이전에 다이렉트 메시지 격리를 사용하다가 나중에 `session.dmScope`를 `main`으로 되돌린 경우,
`openclaw sessions cleanup --dry-run --fix-dm-scope`로 오래된 peer 키 기반 DM 행을 미리 확인하세요.
같은 플래그를 적용하면 해당 이전 다이렉트 DM 행을 폐기하고 그 전사는 삭제된
아카이브로 유지합니다.

`openclaw sessions cleanup --dry-run`으로 미리 확인하세요.

## 세션 검사

- `openclaw status` -- 세션 저장소 경로와 최근 활동.
- `openclaw sessions --json` -- 모든 세션(`--active <minutes>`로 필터링).
- 채팅의 `/status` -- 컨텍스트 사용량, 모델, 토글.
- `/context list` -- 시스템 프롬프트에 포함된 내용.

## 더 읽을거리

- [세션 가지치기](/ko/concepts/session-pruning) -- 도구 결과 다듬기
- [Compaction](/ko/concepts/compaction) -- 긴 대화 요약
- [세션 도구](/ko/concepts/session-tool) -- 세션 간 작업을 위한 에이전트 도구
- [세션 관리 심층 분석](/ko/reference/session-management-compaction) --
  저장소 스키마, 전사, 전송 정책, 출처 메타데이터, 고급 구성
- [멀티 에이전트](/ko/concepts/multi-agent) — 에이전트 간 라우팅과 세션 격리
- [백그라운드 작업](/ko/automation/tasks) — 분리된 작업이 세션 참조가 포함된 작업 레코드를 만드는 방식
- [채널 라우팅](/ko/channels/channel-routing) — 인바운드 메시지가 세션으로 라우팅되는 방식

## 관련 항목

- [세션 가지치기](/ko/concepts/session-pruning)
- [세션 도구](/ko/concepts/session-tool)
- [명령 큐](/ko/concepts/queue)
