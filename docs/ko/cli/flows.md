---
read_when:
    - 이전 문서나 릴리스 노트에서 `openclaw flows`을(를) 볼 수 있습니다
    - 빠르게 확인할 수 있는 TaskFlow 검사 참고 자료가 필요합니다
summary: '리디렉션: 플로 명령은 `openclaw tasks flow` 아래에 있습니다.'
title: 플로우(리디렉션)
x-i18n:
    generated_at: "2026-07-12T00:37:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05d27154190d6087649612d81ce15f0cbc9459aa89ab22211582c18f4fc2943c
    source_path: cli/flows.md
    workflow: 16
---

# `openclaw tasks flow`

최상위 `openclaw flows` 명령은 없습니다. 영구 TaskFlow 검사는 `openclaw tasks flow` 아래에 있습니다.

## 하위 명령

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 하위 명령 | 설명                   | 인수 / 옵션                                                                                  |
| ---------- | ---------------------- | -------------------------------------------------------------------------------------------- |
| `list`     | 추적 중인 TaskFlow를 나열합니다. | `--json` 기계 판독 가능 출력; `--status <name>` 필터(아래 상태 값 참조).                      |
| `show`     | 하나의 TaskFlow를 표시합니다.    | `<lookup>` 흐름 ID 또는 소유자 키; `--json` 기계 판독 가능 출력.                              |
| `cancel`   | 실행 중인 TaskFlow를 취소합니다. | `<lookup>` 흐름 ID 또는 소유자 키.                                                            |

`<lookup>`에는 흐름 ID(`list` / `show`에서 반환됨) 또는 흐름의 소유자 키(소유 하위 시스템이 흐름을 추적하는 데 사용하는 안정적인 식별자)를 사용할 수 있습니다.

### 상태 필터 값

`list`의 `--status`에는 `queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost` 중 하나를 사용할 수 있습니다.

## 예시

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

TaskFlow 개념과 작성 방법은 [TaskFlow](/ko/automation/taskflow)를 참조하세요. 상위 `tasks` 명령은 [tasks CLI 참조](/ko/cli/tasks)를 참조하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [자동화](/ko/automation)
- [TaskFlow](/ko/automation/taskflow)
