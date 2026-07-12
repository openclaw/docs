---
read_when:
    - 추론된 후속 조치 약속을 검토하려는 경우
    - 보류 중인 체크인을 해제하려는 경우
    - Heartbeat가 무엇을 전달할 수 있는지 감사하고 있습니다
summary: '`openclaw commitments`에 대한 CLI 참조(추론된 후속 작업 검사 및 해제)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-07-12T00:40:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4323273a5d73975532f4728dc5e40c5d59e0c6d2e31a538f96bf3451e3fdf4d9
    source_path: cli/commitments.md
    workflow: 16
---

추론된 후속 조치 약속을 나열하고 관리합니다.

약속은 명시적으로 활성화해야 하며(`commitments.enabled`), 대화 맥락에서 생성되어 Heartbeat를 통해 전달되는 단기 후속 조치 메모리입니다. 개념 안내와 설정은 [추론된 약속](/ko/concepts/commitments)을 참조하세요.

하위 명령 없이 실행하면 `openclaw commitments`는 대기 중인 약속을 나열합니다.

## 사용법

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 옵션

- `--all`: 대기 중인 약속만 표시하지 않고 모든 상태를 표시합니다.
- `--agent <id>`: 하나의 에이전트 ID로 필터링합니다.
- `--status <status>`: 상태로 필터링합니다. 값은 `pending`, `sent`, `dismissed`, `snoozed` 또는 `expired`입니다. 알 수 없는 값을 지정하면 오류와 함께 종료됩니다.
- `--json`: 기계 판독 가능한 JSON을 출력합니다.

`dismiss`는 지정된 약속 ID를 `dismissed`로 표시하여 Heartbeat가 해당 약속을 전달하지 않도록 합니다.

## 예시

대기 중인 약속 나열:

```bash
openclaw commitments
```

저장된 모든 약속 나열:

```bash
openclaw commitments --all
```

하나의 에이전트로 필터링:

```bash
openclaw commitments --agent main
```

다시 알림으로 설정된 약속 찾기:

```bash
openclaw commitments --status snoozed
```

하나 이상의 약속 해제:

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

JSON으로 내보내기:

```bash
openclaw commitments --all --json
```

## 출력

텍스트 출력에는 약속 수, 저장소 경로, 활성 필터 및 약속별 행 하나가 표시됩니다.

- 약속 ID
- 상태
- 종류(`event_check_in`, `deadline_check`, `care_check_in` 또는 `open_loop`)
- 가장 빠른 예정 시간
- 범위(에이전트/채널/대상)
- 제안된 확인 메시지

JSON 출력에는 개수, 활성 상태 및 에이전트 필터, 약속 저장소 경로와 저장된 전체 레코드가 포함됩니다.

## 관련 문서

- [추론된 약속](/ko/concepts/commitments)
- [메모리 개요](/ko/concepts/memory)
- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
