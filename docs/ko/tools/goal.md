---
doc-schema-version: 1
read_when:
    - 긴 세션 내내 OpenClaw가 하나의 목표를 계속 표시하도록 하려는 경우
    - 세션 목표를 일시 중지, 재개, 차단, 완료 또는 지워야 합니다
    - get_goal, create_goal, update_goal 도구를 이해하려고 합니다
    - TUI에서 목표가 어떻게 표시되는지 확인하려는 경우
summary: '세션 목표: 지속되는 세션별 목표, /goal 제어, 모델 목표 도구, 토큰 예산, TUI 상태'
title: 목표
x-i18n:
    generated_at: "2026-06-27T18:14:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# 목표

**목표**는 현재 OpenClaw 세션에 연결된 지속적인 목적 하나입니다.
이는 장기 작업을 위해 에이전트와 운영자에게 공유 대상을 제공하지만,
그 대상을 백그라운드 작업, 알림, Cron 작업 또는 상시 지시로 바꾸지는
않습니다.

목표는 세션 상태입니다. 세션 키와 함께 이동하고, 프로세스 재시작 후에도
유지되며, `/goal`에 표시되고, 목표 도구를 통해 모델에서 사용할 수 있으며,
활성 세션에 목표가 있을 때 TUI 푸터에 나타납니다.

## 빠른 시작

목표 설정:

```text
/goal start get CI green for PR 87469 and push the fix
```

확인:

```text
/goal
```

작업이 의도적으로 대기 중일 때 일시 중지:

```text
/goal pause waiting for CI
```

다시 시작:

```text
/goal resume
```

완료로 표시:

```text
/goal complete pushed and verified
```

지우기:

```text
/goal clear
```

## 목표의 용도

여러 턴에 걸쳐 계속 표시되어야 하는 구체적인 결과가 세션에 있을 때 목표를
사용하세요.

- PR 마무리: 수정, 검증, 자동 리뷰, 푸시, PR 열기 또는 업데이트.
- 디버그 실행: 버그 재현, 소유 표면 식별, 패치, 수정 증명.
- 문서 작업: 관련 문서 읽기, 새 페이지 작성, 교차 링크 추가, 문서 빌드 검증.
- 유지보수 작업: 현재 상태 점검, 범위가 제한된 변경 수행, 적절한 검사 실행,
  변경 사항 보고.

목표는 작업 큐가 아닙니다. 작업을 분리해서 실행하거나, 일정에 따라 반복하거나,
관리되는 하위 작업으로 확장하거나, 정책으로 지속해야 할 때는
[TaskFlow](/ko/automation/taskflow), [작업](/ko/automation/tasks),
[Cron 작업](/ko/automation/cron-jobs) 또는
[상시 지시](/ko/automation/standing-orders)를 사용하세요.

## 명령 참조

인수 없이 `/goal`을 실행하면 현재 목표 요약이 출력됩니다.

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

명령:

- `/goal` 또는 `/goal status`는 현재 목표를 표시합니다.
- `/goal start <objective>`는 현재 세션에 새 목표를 만듭니다.
- `/goal set <objective>` 및 `/goal create <objective>`는 `start`의 별칭입니다.
- `/goal pause [note]`는 활성 목표를 일시 중지합니다.
- `/goal resume [note]`는 일시 중지됨, 차단됨, 사용량 제한됨 또는
  예산 제한됨 상태의 목표를 다시 시작합니다.
- `/goal complete [note]`는 목표를 달성됨으로 표시합니다.
- `/goal done [note]`는 `complete`의 별칭입니다.
- `/goal block [note]`는 목표를 차단됨으로 표시합니다.
- `/goal blocked [note]`는 `block`의 별칭입니다.
- `/goal clear`는 세션에서 목표를 제거합니다.

한 세션에는 한 번에 하나의 목표만 존재할 수 있습니다. 현재 목표를 지우기 전까지
두 번째 목표를 시작하면 실패합니다.

## 상태

목표는 작은 상태 집합을 사용합니다.

- `active`: 세션이 목표를 추구하고 있습니다.
- `paused`: 운영자가 목표를 일시 중지했습니다. `/goal resume`을 실행하면 다시
  활성 상태가 됩니다.
- `blocked`: 에이전트 또는 운영자가 실제 차단 요소를 보고했습니다.
  새 정보나 상태를 사용할 수 있을 때 `/goal resume`을 실행하면 다시 활성 상태가
  됩니다.
- `budget_limited`: 구성된 토큰 예산에 도달했습니다. `/goal resume`을 실행하면
  동일한 목적에서 다시 추구를 시작합니다.
- `usage_limited`: 사용량 제한 중지 상태를 위해 예약되어 있습니다.
  허용되면 `/goal resume`을 실행해 다시 추구를 시작합니다.
- `complete`: 목표가 달성되었습니다. 완료된 목표는 종료 상태입니다.
  다른 목표를 시작하기 전에 `/goal clear`를 사용하세요.

`/new`와 `/reset`은 의도적으로 새 세션 컨텍스트를 시작하므로 현재 세션 목표를
지웁니다.

## 토큰 예산

목표에는 선택적인 양수 토큰 예산을 둘 수 있습니다. 예산은 목표와 함께 저장되며,
생성 시점의 세션 새 토큰 수를 기준으로 측정됩니다. 목표가 시작될 때 현재 세션에
오래되었거나 알 수 없는 토큰 사용량만 있으면 OpenClaw는 다음 새 세션 토큰
스냅샷을 기다린 뒤 이를 기준선으로 사용하므로, 목표가 존재하기 전에 소비된
토큰은 목표에 부과되지 않습니다.

토큰 사용량이 예산에 도달하면 목표는 `budget_limited`로 변경됩니다. 이 동작은
목표를 삭제하거나 목적을 지우지 않습니다. 목표가 다시 시작되거나 지워질 때까지
더 이상 적극적으로 추구되지 않음을 운영자와 에이전트에게 알려줍니다.

토큰 예산은 세션 목표 보호 장치이지 과금 한도가 아닙니다. 공급자 할당량,
비용 보고, 컨텍스트 창 동작은 계속 일반 OpenClaw 사용량 및 모델 제어를
사용합니다.

## 모델 도구

OpenClaw는 에이전트 하네스에 세 가지 핵심 목표 도구를 노출합니다.

- `get_goal`: 상태, 목적, 토큰 사용량, 토큰 예산을 포함해 현재 세션 목표를 읽습니다.
- `create_goal`: 사용자, 시스템 또는 개발자 지시가 명시적으로 요청한 경우에만
  목표를 만듭니다. 세션에 이미 목표가 있으면 실패합니다.
- `update_goal`: 목표를 `complete` 또는 `blocked`로 표시합니다.

모델은 목표를 조용히 일시 중지, 다시 시작, 지우기 또는 교체할 수 없습니다.
이들은 `/goal` 및 재설정 명령을 통한 운영자/세션 제어입니다. 이를 통해
에이전트가 조용히 대상을 옮기지 못하게 하면서도, 달성 또는 실제 차단 요소를
보고할 수 있는 깔끔한 경로를 유지합니다.

`update_goal` 도구는 목적이 실제로 달성된 경우에만 목표를 `complete`로 표시해야
합니다. 동일한 차단 조건이 반복되었고, 새 사용자 입력이나 외부 상태 변경 없이는
에이전트가 의미 있는 진전을 만들 수 없을 때만 목표를 `blocked`로 표시해야 합니다.

## TUI

TUI는 에이전트, 세션, 모델, 실행 제어, 토큰 수 옆의 푸터에 활성 세션의 목표를
계속 표시합니다.

푸터 예:

- 토큰 예산이 있는 활성 목표의 경우 `Pursuing goal (12k/50k)`.
- 일시 중지된 목표의 경우 `Goal paused (/goal resume)`.
- 차단된 목표의 경우 `Goal blocked (/goal resume)`.
- 사용량 제한 목표의 경우 `Goal hit usage limits (/goal resume)`.
- 예산 제한 목표의 경우 `Goal unmet (50k/50k)`.
- 완료된 목표의 경우 `Goal achieved (42k)`.

푸터는 의도적으로 간결합니다. 전체 목적, 참고, 토큰 예산, 사용 가능한 명령은
`/goal`을 사용하세요.

## 채널 동작

`/goal` 명령은 TUI와 텍스트 명령을 허용하는 채팅 표면을 포함해, 명령을 사용할 수
있는 OpenClaw 세션에서 작동합니다. 목표 상태는 전송 수단이 아니라 세션 키에
연결됩니다. 두 표면이 같은 세션을 사용하면 같은 목표를 봅니다.

목표 상태는 전달 지시가 아닙니다. 채널을 통해 답장을 강제하거나, 큐 동작을
변경하거나, 도구를 승인하거나, 작업을 예약하지 않습니다.

## 문제 해결

`Goal error: goal already exists`는 세션에 이미 목표가 있다는 뜻입니다. `/goal`로
확인하고, 완료되었다면 `/goal complete`를 사용하거나, 다른 목적을 시작하기 전에
`/goal clear`를 사용하세요.

`Goal error: goal not found`는 세션에 아직 목표가 없다는 뜻입니다.
`/goal start <objective>`로 목표를 시작하세요.

`Goal error: goal is already complete`는 목표가 종료 상태라는 뜻입니다.
다른 목적을 시작하거나 다시 시작하기 전에 지우세요.

토큰 사용량이 `0`처럼 보이거나 오래된 값으로 보인다면, 활성 세션에 아직 새 토큰
스냅샷이 없을 수 있습니다. OpenClaw가 세션 사용량과 대화 기록에서 파생된 합계를
기록하면 사용량이 새로 고쳐집니다.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [TUI](/ko/web/tui)
- [세션 도구](/ko/concepts/session-tool)
- [Compaction](/ko/concepts/compaction)
- [TaskFlow](/ko/automation/taskflow)
- [상시 지시](/ko/automation/standing-orders)
