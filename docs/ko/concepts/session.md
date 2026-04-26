---
read_when:
    - 세션 라우팅과 격리를 이해하려고 합니다
    - 다중 사용자 설정을 위해 DM 범위를 구성하려고 합니다
    - 일일 또는 유휴 세션 재설정을 디버그하고 있습니다
summary: OpenClaw가 대화 세션을 관리하는 방식
title: 세션 관리
x-i18n:
    generated_at: "2026-04-26T11:27:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw는 대화를 **세션**으로 구성합니다. 각 메시지는 DM, 그룹 채팅, Cron 작업 등 메시지가 어디에서 왔는지에 따라 세션으로 라우팅됩니다.

## 메시지 라우팅 방식

| 소스            | 동작                      |
| --------------- | ------------------------- |
| 다이렉트 메시지 | 기본적으로 공유 세션      |
| 그룹 채팅       | 그룹별로 격리             |
| 룸/채널         | 룸별로 격리               |
| Cron 작업       | 실행마다 새 세션          |
| Webhook         | 훅별로 격리               |

## DM 격리

기본적으로 모든 DM은 연속성을 위해 하나의 세션을 공유합니다. 이는 단일 사용자 설정에는 적합합니다.

<Warning>
여러 사람이 에이전트에 메시지를 보낼 수 있다면 DM 격리를 활성화하세요. 그렇지 않으면 모든 사용자가 동일한 대화 컨텍스트를 공유하게 되어 Alice의 개인 메시지가 Bob에게 보이게 됩니다.
</Warning>

**해결 방법:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // 채널 + 발신자별로 격리
  },
}
```

다른 옵션:

- `main` (기본값) -- 모든 DM이 하나의 세션 공유
- `per-peer` -- 발신자별로 격리(채널 간)
- `per-channel-peer` -- 채널 + 발신자별로 격리(권장)
- `per-account-channel-peer` -- 계정 + 채널 + 발신자별로 격리

<Tip>
같은 사람이 여러 채널에서 연락하는 경우 `session.identityLinks`를 사용해 신원을 연결하면 하나의 세션을 공유할 수 있습니다.
</Tip>

`openclaw security audit`로 설정을 확인하세요.

## 세션 수명 주기

세션은 만료될 때까지 재사용됩니다.

- **일일 재설정** (기본값) -- Gateway 호스트의 현지 시간 기준 오전 4:00에 새 세션 시작. 일일 새로움 기준은 이후 메타데이터 쓰기가 아니라 현재 `sessionId`가 시작된 시점입니다.
- **유휴 재설정** (선택 사항) -- 일정 기간 활동이 없으면 새 세션 시작. `session.reset.idleMinutes`를 설정하세요. 유휴 새로움 기준은 마지막 실제 사용자/채널 상호작용이므로 Heartbeat, Cron, exec 시스템 이벤트는 세션을 살아 있게 유지하지 않습니다.
- **수동 재설정** -- 채팅에서 `/new` 또는 `/reset` 입력. `/new <model>`은 모델도 전환합니다.

일일 재설정과 유휴 재설정이 모두 구성된 경우 먼저 만료되는 쪽이 우선합니다.
Heartbeat, Cron, exec 및 기타 시스템 이벤트 턴은 세션 메타데이터를 쓸 수 있지만, 그러한 쓰기는 일일 또는 유휴 재설정의 새로움 기준을 연장하지 않습니다. 재설정이 세션을 교체하면 이전 세션에 대해 대기 중이던 시스템 이벤트 알림은 삭제되므로 오래된 백그라운드 업데이트가 새 세션의 첫 번째 프롬프트 앞에 붙지 않습니다.

활성 공급자 소유 CLI 세션이 있는 세션은 암시적 일일 기본값에 의해 끊기지 않습니다. 이러한 세션도 타이머에 따라 만료되어야 한다면 `/reset`을 사용하거나 `session.reset`을 명시적으로 구성하세요.

## 상태 저장 위치

모든 세션 상태는 **Gateway**가 소유합니다. UI 클라이언트는 세션 데이터를 얻기 위해 Gateway를 조회합니다.

- **저장소:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcript:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json`은 별도의 수명 주기 타임스탬프를 유지합니다.

- `sessionStartedAt`: 현재 `sessionId`가 시작된 시점. 일일 재설정에서 사용
- `lastInteractionAt`: 유휴 수명을 연장하는 마지막 사용자/채널 상호작용
- `updatedAt`: 저장소 행의 마지막 변경 시점. 목록화 및 정리에 유용하지만 일일/유휴 재설정 새로움 기준의 권위 있는 값은 아님

`sessionStartedAt`이 없는 오래된 행은 가능한 경우 transcript JSONL 세션 헤더에서 확인됩니다. 오래된 행에 `lastInteractionAt`도 없으면, 유휴 새로움은 이후 bookkeeping 쓰기가 아니라 해당 세션 시작 시점으로 대체됩니다.

## 세션 유지 관리

OpenClaw는 시간이 지나면서 자동으로 세션 저장소 크기를 제한합니다. 기본적으로는 `warn` 모드로 실행되며(정리될 항목만 보고), 자동 정리를 원하면 `session.maintenance.mode`를 `"enforce"`로 설정하세요.

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

`openclaw sessions cleanup --dry-run`으로 미리 보기할 수 있습니다.

## 세션 검사

- `openclaw status` -- 세션 저장소 경로와 최근 활동
- `openclaw sessions --json` -- 모든 세션(`--active <minutes>`로 필터링)
- 채팅에서 `/status` -- 컨텍스트 사용량, 모델 및 토글
- `/context list` -- 시스템 프롬프트에 포함된 항목

## 추가 읽을거리

- [세션 정리](/ko/concepts/session-pruning) -- 도구 결과 다듬기
- [Compaction](/ko/concepts/compaction) -- 긴 대화 요약
- [세션 도구](/ko/concepts/session-tool) -- 세션 간 작업을 위한 에이전트 도구
- [세션 관리 심화](/ko/reference/session-management-compaction) --
  저장소 스키마, transcript, 전송 정책, origin 메타데이터 및 고급 구성
- [멀티 에이전트](/ko/concepts/multi-agent) — 에이전트 간 라우팅 및 세션 격리
- [백그라운드 작업](/ko/automation/tasks) — 분리된 작업이 세션 참조가 있는 작업 레코드를 만드는 방식
- [채널 라우팅](/ko/channels/channel-routing) — 수신 메시지가 세션으로 라우팅되는 방식

## 관련 항목

- [세션 정리](/ko/concepts/session-pruning)
- [세션 도구](/ko/concepts/session-tool)
- [명령 대기열](/ko/concepts/queue)
