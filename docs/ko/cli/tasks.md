---
read_when:
    - 백그라운드 작업 기록을 검사, 감사 또는 취소하려고 합니다.
    - '`openclaw tasks flow` 아래의 TaskFlow 명령을 문서화하고 있습니다.'
summary: '`openclaw tasks`에 대한 CLI 참조(백그라운드 작업 원장 및 TaskFlow 상태)'
title: '`openclaw tasks`'
x-i18n:
    generated_at: "2026-04-26T11:26:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e61fb0b67a2bdd932b29543199fb219890f256260a66881c8e7ffeb9fadee33
    source_path: cli/tasks.md
    workflow: 15
---

내구성 있는 백그라운드 작업과 TaskFlow 상태를 검사합니다. 하위 명령 없이
`openclaw tasks`를 실행하면 `openclaw tasks list`와 같습니다.

수명 주기와 전달 모델은 [백그라운드 작업](/ko/automation/tasks)을 참조하세요.

## 사용법

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## 루트 옵션

- `--json`: JSON 출력.
- `--runtime <name>`: 종류별 필터링: `subagent`, `acp`, `cron`, 또는 `cli`.
- `--status <name>`: 상태별 필터링: `queued`, `running`, `succeeded`, `failed`, `timed_out`, `cancelled`, 또는 `lost`.

## 하위 명령

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

추적된 백그라운드 작업을 최신순으로 나열합니다.

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

작업 ID, 실행 ID 또는 세션 키로 단일 작업을 표시합니다.

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

실행 중인 작업의 알림 정책을 변경합니다.

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

실행 중인 백그라운드 작업을 취소합니다.

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

오래되었거나, 손실되었거나, 전달에 실패했거나, 그 외 일관되지 않은 작업 및 TaskFlow 기록을 표시합니다. `cleanupAfter`까지 유지되는 손실 작업은 경고이며, 만료되었거나 스탬프가 없는 손실 작업은 오류입니다.

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

작업 및 TaskFlow 조정, cleanup 스탬프 처리, 정리 제거를 미리 보거나 적용합니다.
Cron 작업의 경우, 조정은 오래된 활성 작업을 `lost`로 표시하기 전에 지속된 실행 로그/작업 상태를 사용하므로, 메모리 내 Gateway 런타임 상태가 사라졌다는 이유만으로 완료된 Cron 실행이 거짓 audit 오류가 되지 않습니다. 오프라인 CLI audit은 Gateway의 프로세스 로컬 Cron 활성 작업 집합에 대한 권위 있는 정보가 아닙니다.

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

작업 원장 아래의 내구성 있는 TaskFlow 상태를 검사하거나 취소합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [백그라운드 작업](/ko/automation/tasks)
