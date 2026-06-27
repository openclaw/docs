---
read_when:
    - 세션 라우팅과 격리를 이해하려는 경우
    - 다중 사용자 설정을 위한 DM 범위를 구성하려는 경우
    - 유휴 세션 또는 일일 재설정을 디버깅하는 중
summary: OpenClaw가 대화 세션을 관리하는 방식
title: 세션 관리
x-i18n:
    generated_at: "2026-06-27T17:25:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw는 대화를 **세션**으로 구성합니다. 각 메시지는 DM, 그룹 채팅, cron 작업 등 메시지가 온 위치에 따라 세션으로 라우팅됩니다.

## 메시지 라우팅 방식

| 소스            | 동작                  |
| --------------- | --------------------- |
| 다이렉트 메시지 | 기본적으로 공유 세션  |
| 그룹 채팅       | 그룹별로 격리         |
| 방/채널         | 방별로 격리           |
| Cron 작업       | 실행마다 새 세션      |
| Webhook         | 훅별로 격리           |

## DM 격리

기본적으로 모든 DM은 연속성을 위해 하나의 세션을 공유합니다. 단일 사용자 설정에는 이 방식이 적합합니다.

<Warning>
여러 사람이 에이전트에 메시지를 보낼 수 있다면 DM 격리를 활성화하세요. 활성화하지 않으면 모든 사용자가 같은 대화 컨텍스트를 공유합니다. 즉, Alice의 비공개 메시지가 Bob에게 보일 수 있습니다.
</Warning>

**해결 방법:**

```json5
{
  session: {
    dmScope: "per-channel-peer", // channel + sender 기준으로 격리
  },
}
```

기타 옵션:

- `main`(기본값) -- 모든 DM이 하나의 세션을 공유합니다.
- `per-peer` -- sender 기준으로 격리합니다(채널 간).
- `per-channel-peer` -- channel + sender 기준으로 격리합니다(권장).
- `per-account-channel-peer` -- account + channel + sender 기준으로 격리합니다.

<Tip>
같은 사람이 여러 채널에서 연락하는 경우 `session.identityLinks`를 사용해 해당 ID들을 연결하면 하나의 세션을 공유할 수 있습니다.
</Tip>

### 연결된 채널 도킹

도킹 명령을 사용하면 사용자가 새 세션을 시작하지 않고 현재 다이렉트 채팅 세션의 응답 경로를 다른 연결된 채널로 이동할 수 있습니다. 예제, 설정, 문제 해결은 [채널 도킹](/ko/concepts/channel-docking)을 참조하세요.

`openclaw security audit`로 설정을 확인하세요.

## 세션 수명 주기

세션은 만료될 때까지 재사용됩니다.

- **일일 재설정**(기본값) -- Gateway 호스트의 현지 시간 오전 4:00에 새 세션을 시작합니다. 일일 최신성은 현재 `sessionId`가 시작된 시점을 기준으로 하며, 이후 메타데이터 쓰기를 기준으로 하지 않습니다.
- **유휴 재설정**(선택 사항) -- 일정 시간 동안 활동이 없으면 새 세션을 시작합니다. `session.reset.idleMinutes`를 설정하세요. 유휴 최신성은 마지막 실제 사용자/채널 상호작용을 기준으로 하므로 Heartbeat, Cron, exec 시스템 이벤트는 세션을 계속 유지하지 않습니다.
- **수동 재설정** -- 채팅에서 `/new` 또는 `/reset`을 입력합니다. `/new <model>`은 모델도 전환합니다.

일일 재설정과 유휴 재설정이 모두 설정된 경우 먼저 만료되는 쪽이 적용됩니다. Heartbeat, Cron, exec 및 기타 시스템 이벤트 턴은 세션 메타데이터를 쓸 수 있지만, 이러한 쓰기는 일일 또는 유휴 재설정 최신성을 연장하지 않습니다. 재설정으로 세션이 전환되면 이전 세션의 대기 중인 시스템 이벤트 알림은 삭제되어 오래된 백그라운드 업데이트가 새 세션의 첫 프롬프트 앞에 붙지 않습니다.

활성 provider 소유 CLI 세션이 있는 세션은 암시적 일일 기본값으로 끊기지 않습니다. 해당 세션이 타이머에 따라 만료되어야 하는 경우 `/reset`을 사용하거나 `session.reset`을 명시적으로 설정하세요.

## 상태가 저장되는 위치

모든 세션 상태는 **Gateway**가 소유합니다. UI 클라이언트는 Gateway에 세션 데이터를 쿼리합니다.

- **저장소:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **트랜스크립트:** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json`은 별도의 수명 주기 타임스탬프를 유지합니다.

- `sessionStartedAt`: 현재 `sessionId`가 시작된 시점이며, 일일 재설정이 이를 사용합니다.
- `lastInteractionAt`: 유휴 수명을 연장하는 마지막 사용자/채널 상호작용입니다.
- `updatedAt`: 마지막 저장소 행 변경 시점입니다. 목록 표시와 정리에 유용하지만 일일/유휴 재설정 최신성의 기준은 아닙니다.

`sessionStartedAt`이 없는 이전 행은 가능한 경우 트랜스크립트 JSONL 세션 헤더에서 해석됩니다. 이전 행에 `lastInteractionAt`도 없는 경우 유휴 최신성은 이후의 장부 기록 쓰기가 아니라 해당 세션 시작 시간으로 대체됩니다.

## 세션 유지 관리

OpenClaw는 시간이 지나도 세션 저장소 크기가 자동으로 제한되도록 관리합니다. 기본적으로 `enforce` 모드로 실행되며 유지 관리 중 정리를 적용합니다. 저장소/파일을 변경하지 않고 정리될 항목만 보고하려면 `session.maintenance.mode`를 `"warn"`으로 설정하세요.

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

프로덕션 규모의 `maxEntries` 제한에서는 Gateway 런타임 쓰기가 작은 high-water 버퍼를 사용하고, 배치 단위로 설정된 한도까지 다시 정리합니다. 세션 저장소 읽기는 Gateway 시작 중 항목을 정리하거나 제한하지 않습니다. 이렇게 하면 시작할 때마다 또는 격리된 Cron 세션마다 전체 저장소 정리를 실행하지 않아도 됩니다. `openclaw sessions cleanup --enforce`는 한도를 즉시 적용합니다.

Gateway 모델 실행 프로브 세션은 기본적으로 수명이 짧습니다. `agent:*:explicit:model-run-<uuid>`와 같은 엄격한 명시적 키와 일치하는 행은 고정 `24h` 보존을 사용하지만, 정리는 압력 기반입니다. 즉, 세션 항목 유지 관리/한도 압력에 도달했을 때만 오래된 프로브 행을 제거합니다. 모델 실행 정리가 실행되면 더 넓은 오래된 항목 나이 기준 및 항목 한도보다 먼저 실행됩니다. 일반 다이렉트, 그룹, 스레드, Cron, 훅, Heartbeat, ACP 및 하위 에이전트 세션은 이 24h 보존을 상속하지 않습니다.

유지 관리는 그룹 세션과 스레드 범위 채팅 세션을 포함한 지속 가능한 외부 대화 포인터를 보존하면서도 합성 Cron, 훅, Heartbeat, ACP 및 하위 에이전트 항목은 오래되어 제거될 수 있게 합니다.

이전에 다이렉트 메시지 격리를 사용하다가 나중에 `session.dmScope`를 `main`으로 되돌린 경우 `openclaw sessions cleanup --dry-run --fix-dm-scope`로 오래된 peer 키 기반 DM 행을 미리 확인하세요. 같은 플래그를 적용하면 이러한 이전 다이렉트 DM 행을 폐기하고 해당 트랜스크립트를 삭제된 아카이브로 유지합니다.

`openclaw sessions cleanup --dry-run`으로 미리 확인하세요.

## 세션 검사

- `openclaw status` -- 세션 저장소 경로와 최근 활동입니다.
- `openclaw sessions --json` -- 모든 세션입니다(`--active <minutes>`로 필터링).
- 채팅의 `/status` -- 컨텍스트 사용량, 모델, 토글입니다.
- `/context list` -- 시스템 프롬프트에 들어 있는 내용입니다.

## 추가 읽기

- [세션 정리](/ko/concepts/session-pruning) -- 도구 결과 다듬기
- [Compaction](/ko/concepts/compaction) -- 긴 대화 요약
- [세션 도구](/ko/concepts/session-tool) -- 세션 간 작업을 위한 에이전트 도구
- [세션 관리 심층 분석](/ko/reference/session-management-compaction) --
  저장소 스키마, 트랜스크립트, 전송 정책, 원본 메타데이터 및 고급 설정
- [멀티 에이전트](/ko/concepts/multi-agent) — 에이전트 간 라우팅 및 세션 격리
- [백그라운드 작업](/ko/automation/tasks) — 분리된 작업이 세션 참조가 포함된 작업 레코드를 만드는 방식
- [채널 라우팅](/ko/channels/channel-routing) — 인바운드 메시지가 세션으로 라우팅되는 방식

## 관련 항목

- [세션 정리](/ko/concepts/session-pruning)
- [세션 도구](/ko/concepts/session-tool)
- [명령 큐](/ko/concepts/queue)
