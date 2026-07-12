---
read_when:
    - 세션 라우팅과 격리를 이해하려고 합니다
    - 다중 사용자 설정을 위한 DM 범위를 구성하려는 경우
    - 일일 또는 유휴 세션 재설정을 디버깅하고 있습니다
summary: OpenClaw이 대화 세션을 관리하는 방식
title: 세션 관리
x-i18n:
    generated_at: "2026-07-12T15:12:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw는 모든 수신 메시지를 메시지가 온 위치(DM, 그룹 채팅, Cron 작업 등)에 따라 **세션**으로 라우팅합니다. 모든 세션 상태는 **Gateway**가 소유하며, UI 클라이언트는 Gateway에 세션 데이터를 쿼리합니다.

## 메시지 라우팅 방식

| 소스          | 동작                  |
| --------------- | ------------------------- |
| 다이렉트 메시지 | 기본적으로 세션 공유 |
| 그룹 채팅     | 그룹별로 격리        |
| 방/채널  | 방별로 격리         |
| Cron 작업       | 실행마다 새 세션     |
| Webhook        | 훅별로 격리         |

## DM 격리

기본적으로 모든 DM은 대화의 연속성을 위해 하나의 세션을 공유하며, 단일 사용자 설정에서는 문제가 없습니다.

<Warning>
여러 사람이 에이전트에게 메시지를 보낼 수 있다면 DM 격리를 활성화하십시오. 격리하지 않으면 모든 사용자가 동일한 대화 컨텍스트를 공유하므로 Alice의 비공개 메시지가 Bob에게 표시될 수 있습니다.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // 채널 + 발신자별로 격리
  },
}
```

`session.dmScope` 옵션:

| 값                      | 동작                                  |
| -------------------------- | ----------------------------------------- |
| `main` (기본값)           | 모든 DM이 하나의 세션을 공유                 |
| `per-peer`                 | 채널과 관계없이 발신자별로 격리        |
| `per-channel-peer`         | 채널 + 발신자별로 격리(권장) |
| `per-account-channel-peer` | 계정 + 채널 + 발신자별로 격리     |

<Tip>
같은 사람이 여러 채널을 통해 연락하는 경우, `session.identityLinks`를 사용하여 해당 ID를 하나의 정규 피어 ID에 매핑하면 동일한 세션을 공유할 수 있습니다.
</Tip>

### 연결된 채널 도킹

도킹 명령은 새 세션을 시작하지 않고 현재 다이렉트 채팅 세션의 응답 경로를 다른 연결된 채널로 이동합니다. 예제, 구성 및 문제 해결 방법은 [채널 도킹](/ko/concepts/channel-docking)을 참조하십시오.

`openclaw security audit`으로 설정을 확인하십시오.

## 세션 수명 주기

세션은 `session.reset`에 따라 만료될 때까지 재사용됩니다.

- **일일 재설정**(기본값 `mode: "daily"`) - Gateway 호스트에서 구성된 현지 시간(`session.reset.atHour`, 기본값 `4`, 0-23)에 새 세션을 시작합니다. 일일 유효성은 이후 메타데이터 쓰기가 아니라 현재 `sessionId`가 시작된 시점을 기준으로 합니다.
- **유휴 재설정**(`mode: "idle"`) - `session.reset.idleMinutes` 동안 활동이 없으면 새 세션을 시작합니다. 유휴 유효성은 마지막 실제 사용자/채널 상호작용을 기준으로 하므로 Heartbeat, Cron 및 exec 시스템 이벤트는 세션을 활성 상태로 유지하지 않습니다.
- **수동 재설정** - 채팅에 `/new` 또는 `/reset`을 입력합니다. `/new <model>`은 모델도 전환합니다.

일일 재설정과 유휴 재설정을 모두 구성하면 먼저 만료되는 설정이 적용됩니다. Heartbeat, Cron, exec 및 기타 시스템 이벤트 턴에서 세션 메타데이터를 쓸 수 있지만, 이러한 쓰기는 일일 또는 유휴 재설정의 유효 기간을 연장하지 않습니다. 재설정으로 세션이 교체되면 이전 세션의 대기 중인 시스템 이벤트 알림이 삭제되어 오래된 백그라운드 업데이트가 새 세션의 첫 번째 프롬프트 앞에 추가되지 않습니다.

공급자가 소유한 활성 CLI 세션이 있는 세션에는 암시적인 기본 일일 재설정이 적용되지 않습니다. 이러한 세션이 타이머에 따라 만료되어야 한다면 `/reset`을 사용하거나 `session.reset`을 명시적으로 구성하십시오.

채팅 유형별 또는 채널별로 기본값을 재정의할 수 있습니다.

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType`은 `direct`(레거시 별칭 `dm`), `group`, `thread`를 지원합니다.
최상위 레거시 `session.idleMinutes`도 `session.reset`/`resetByType` 블록이 설정되지 않은 경우 유휴 모드 기본값의 호환성 별칭으로 계속 작동합니다.

## 상태 저장 위치

- **런타임 세션 행:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **보관된 트랜스크립트 파일:** `~/.openclaw/agents/<agentId>/sessions/`
- **레거시 행 마이그레이션 소스:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

에이전트별 SQLite 데이터베이스의 세션 행은 다음과 같이 수명 주기 타임스탬프를 별도로 유지합니다.

- `sessionStartedAt`: 현재 `sessionId`가 시작된 시점이며, 일일 재설정에 사용됩니다.
- `lastInteractionAt`: 유휴 수명을 연장하는 마지막 사용자/채널 상호작용 시점입니다.
- `updatedAt`: 저장소 행이 마지막으로 변경된 시점입니다. 목록 표시 및 정리에는 유용하지만, 일일/유휴 재설정의 최신 여부를 판단하는 기준으로 사용할 수는 없습니다.

이전 설치에서 마이그레이션하는 동안 Gateway 시작 및 `openclaw doctor
--fix`는 레거시 `sessions.json` 행과 활성 트랜스크립트 JSONL 기록을 SQLite로 자동 가져옵니다. `sessionStartedAt`이 없는 행은 가능한 경우 레거시 트랜스크립트 JSONL 세션 헤더에서 값을 확인합니다. 이전 행에 `lastInteractionAt`도 없으면 유휴 최신 여부는 이후의 부기 쓰기가 아니라 해당 세션 시작 시간으로 대체됩니다. 명시적인 검사 또는 검증 증거가 필요하면 `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`와 [Doctor 마이그레이션
절차](/ko/cli/doctor#session-sqlite-migration)를 사용하십시오.

## 세션 유지 관리

OpenClaw는 `session.maintenance`를 통해 시간 경과에 따라 세션 저장소의 크기를 제한하며, 기본값은 다음과 같습니다.

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce"는 정리를 적용하고, "warn"은 보고만 합니다
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

프로덕션 규모의 `maxEntries` 제한에서 Gateway 런타임 쓰기는 작은 상한 버퍼를 사용하고 일괄 처리로 설정된 한도까지 다시 정리합니다.
세션 저장소 읽기는 Gateway 시작 중 항목을 정리하거나 제한하지 않으므로, 시작 및 격리된 Cron 세션은 전체 저장소 정리 비용을 부담하지 않습니다.
`openclaw sessions cleanup --enforce`는 한도를 즉시 적용합니다.

Gateway 모델 실행 프로브 세션은 기본적으로 수명이 짧습니다. `agent:*:explicit:model-run-<uuid>`와 일치하는 행에는 고정 `24h` 보존 기간이 적용되지만, 정리는 압력이 있을 때만 수행됩니다. 즉, 세션 항목 유지 관리/한도 압력에 도달한 경우에만 오래된 프로브 행을 제거하며, 더 광범위한 오래된 항목 기간 기준 및 항목 한도보다 먼저 실행됩니다. 일반 direct, group, thread, Cron, 훅, Heartbeat, ACP 및 하위 에이전트 세션에는 이 24h 보존 기간이 적용되지 않습니다.

유지 관리는 그룹 세션 및 스레드 범위 채팅 세션을 포함한 영구 외부 대화 포인터를 보존하면서도, 합성 Cron, 훅, Heartbeat, ACP 및 하위 에이전트 항목은 시간이 지나면 만료될 수 있도록 합니다.

이전에 DM 격리를 사용한 후 `session.dmScope`를 `main`으로 되돌린 경우,
`openclaw sessions cleanup --dry-run --fix-dm-scope`를 사용하여 오래된 피어 키 기반 DM 행을 미리 확인하십시오. 동일한 플래그를 적용하면 이러한 이전 direct-DM 행을 폐기하고 해당 트랜스크립트는 삭제된 보관 자료로 유지합니다.

`openclaw sessions cleanup --dry-run`을 사용하여 모든 유지 관리 실행을 미리 확인할 수 있습니다.

## 세션 검사

| 명령                       | 표시 내용                                         |
| -------------------------- | ------------------------------------------------- |
| `openclaw status`          | 세션 저장소 경로 및 최근 활동                     |
| `openclaw sessions --json` | 모든 세션 (`--active <minutes>`로 필터링)         |
| 채팅의 `/status`           | 컨텍스트 사용량, 모델 및 토글                     |
| `/context list`            | 시스템 프롬프트에 포함된 내용                     |

## 추가 자료

- [세션 검색](/concepts/session-search) - 과거 트랜스크립트 전체에서 전문 검색으로 내용을 회상합니다
- [세션 정리](/ko/concepts/session-pruning) - 도구 결과를 줄입니다
- [Compaction](/ko/concepts/compaction) - 긴 대화를 요약합니다
- [세션 도구](/ko/concepts/session-tool) - 세션 간 작업을 위한 에이전트 도구입니다
- [세션 관리 심층 분석](/ko/reference/session-management-compaction) -
  저장소 스키마, 트랜스크립트, 전송 정책, 출처 메타데이터 및 고급 구성
- [다중 에이전트](/ko/concepts/multi-agent) - 에이전트 간 라우팅 및 세션 격리
- [백그라운드 작업](/ko/automation/tasks) - 분리된 작업이 세션 참조가 포함된 작업 레코드를 생성하는 방식
- [채널 라우팅](/ko/channels/channel-routing) - 수신 메시지가 세션으로 라우팅되는 방식

## 관련 항목

- [세션 정리](/ko/concepts/session-pruning)
- [세션 도구](/ko/concepts/session-tool)
- [명령 대기열](/ko/concepts/queue)
