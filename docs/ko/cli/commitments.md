---
read_when:
    - 추론된 후속 약속을 검토하려고 합니다
    - 보류 중인 체크인을 해제하려는 경우
    - Heartbeat가 전달할 수 있는 내용을 감사하고 있습니다
summary: '`openclaw commitments`에 대한 CLI 참조(추론된 후속 작업 검사 및 해제)'
title: '`openclaw commitments`'
x-i18n:
    generated_at: "2026-04-30T06:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37d5e5dca25cf649a5069360aa4e41fcc33d042dea99f643b98c07189c58f21c
    source_path: cli/commitments.md
    workflow: 16
---

후속 추론 약속을 나열하고 관리합니다.

약속은 대화 맥락에서 생성되는, 사용자가 동의한 단기 후속 메모리입니다.
개념 안내서는 [추론된 약속](/ko/concepts/commitments)을 참조하세요.

하위 명령 없이 `openclaw commitments`를 실행하면 대기 중인 약속이 나열됩니다.

## 사용법

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 옵션

- `--all`: 대기 중인 약속만이 아니라 모든 상태를 표시합니다.
- `--agent <id>`: 하나의 에이전트 ID로 필터링합니다.
- `--status <status>`: 상태별로 필터링합니다. 값: `pending`, `sent`,
  `dismissed`, `snoozed` 또는 `expired`.
- `--json`: 기계가 읽을 수 있는 JSON을 출력합니다.

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

일시 중지된 약속 찾기:

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

텍스트 출력에는 다음이 포함됩니다.

- 약속 ID
- 상태
- 종류
- 가장 이른 기한
- 범위
- 제안된 확인 메시지

JSON 출력에는 약속 저장소 경로와 저장된 전체 레코드도 포함됩니다.

## 관련 항목

- [추론된 약속](/ko/concepts/commitments)
- [메모리 개요](/ko/concepts/memory)
- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
