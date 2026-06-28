---
read_when:
    - 이전 문서나 릴리스 노트에서 `openclaw flows`을(를) 발견합니다
    - 빠른 TaskFlow 점검 참고 자료가 필요합니다
summary: '리디렉션: flow 명령은 `openclaw tasks flow` 아래에 있습니다'
title: 플로우(리디렉션)
x-i18n:
    generated_at: "2026-05-10T19:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: b41e8a911cfbba32f3a1af059df34f73443ea7649bce46a5926cdf26c8399c12
    source_path: cli/flows.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw tasks flow`

최상위 `openclaw flows` 명령은 없습니다. 영속적 TaskFlow 검사는 `openclaw tasks flow` 아래에 있습니다.

## 하위 명령

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 하위 명령 | 설명                       | 인수 / 옵션                                                                            |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 추적 중인 TaskFlow를 나열합니다. | `--json` 기계 판독 가능 출력; `--status <name>` 필터(아래 상태 값 참조).              |
| `show`     | 하나의 TaskFlow를 표시합니다. | `<lookup>` flow ID 또는 소유자 키; `--json` 기계 판독 가능 출력.                      |
| `cancel`   | 실행 중인 TaskFlow를 취소합니다. | `<lookup>` flow ID 또는 소유자 키.                                                     |

`<lookup>`은 flow ID(`list` / `show`에서 반환됨) 또는 flow의 소유자 키(flow를 추적하기 위해 소유 하위 시스템이 사용하는 안정적인 식별자)를 허용합니다.

### 상태 필터 값

`list`의 `--status`는 다음 중 하나를 허용합니다.

`queued`, `running`, `waiting`, `blocked`, `succeeded`, `failed`, `cancelled`, `lost`

## 예시

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

전체 TaskFlow 개념 및 작성 방법은 [TaskFlow](/ko/automation/taskflow)를 참조하세요. 상위 `tasks` 명령은 [tasks CLI 참조](/ko/cli/tasks)를 참조하세요.

## 관련 항목

- [CLI 참조](/ko/cli)
- [자동화](/ko/automation)
- [TaskFlow](/ko/automation/taskflow)
