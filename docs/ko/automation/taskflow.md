---
read_when:
    - Task Flow가 백그라운드 작업과 어떤 관련이 있는지 이해하고 싶습니다
    - 릴리스 노트 또는 문서에서 Task Flow나 openclaw tasks flow를 발견합니다
    - 지속적인 흐름 상태를 검사하거나 관리하려고 합니다
summary: 백그라운드 작업 상위의 Task Flow 오케스트레이션 계층
title: 작업 흐름
x-i18n:
    generated_at: "2026-07-12T14:57:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow는 [백그라운드 작업](/ko/automation/tasks) 위에 있는 오케스트레이션 계층입니다. 플로는 자체 상태, JSON 상태 데이터, 리비전 카운터, 연결된 작업 레코드를 갖는 다단계 작업의 영구 레코드입니다. 플로는 Gateway가 다시 시작되어도 유지되며, 개별 작업은 계속 분리 실행 작업의 단위로 남습니다.

## Task Flow를 사용해야 하는 경우

| 시나리오                                  | 사용 방식                                         |
| ----------------------------------------- | ------------------------------------------- |
| 단일 백그라운드 작업                     | 일반 작업                                  |
| Plugin 코드로 구동되는 다단계 파이프라인 | Task Flow(관리형)                         |
| 분리 실행 ACP 또는 하위 에이전트 생성            | Task Flow(미러링형, 자동 생성) |
| 일회성 알림                         | Cron 작업                                    |

## 동기화 모드

### 관리형 모드

관리형 플로에는 컨트롤러가 있습니다. Plugin 코드는 목표와 필수 컨트롤러 ID를 지정하여 Plugin 런타임 Task Flow API를 통해 플로를 생성한 후 명시적으로 구동합니다.

- 각 단계는 플로 아래에서 생성된 백그라운드 작업으로 실행되며, 플로의 소유자 키와 요청자 출처가 하위 작업으로 전달됩니다.
- 컨트롤러는 플로를 `running`, `waiting`, 종료 상태 사이에서 전환하고, 임의의 JSON 단계 상태 데이터를 플로 레코드에 저장합니다.
- 모든 변경 작업은 플로의 예상 리비전을 전달합니다. 오래된 쓰기는 최신 상태를 덮어쓰는 대신 리비전 충돌로 거부됩니다.
- 취소가 요청되면 새 하위 작업이 거부되며, 활성 상태인 하위 작업이 없어지면 플로가 `cancelled`로 종료됩니다.

예: (1) 데이터를 수집하고, (2) 보고서를 생성하며, (3) 전달하는 주간 보고서 플로입니다. 단계마다 하나의 백그라운드 작업을 사용합니다.

```
플로: weekly-report
  1단계: gather-data     → 작업 생성됨 → 성공
  2단계: generate-report → 작업 생성됨 → 성공
  3단계: deliver         → 작업 생성됨 → 실행 중
```

### 미러링형 모드

분리 실행 ACP 또는 하위 에이전트 실행이 시작되면 OpenClaw는 미러링된 단일 작업 플로를 자동으로 생성합니다(전달 가능한 완료 결과가 있는 세션 범위 작업). 플로 레코드는 단일 기반 작업의 상태, 목표, 타이밍을 미러링하므로, 분리 실행 생성 작업에서 컨트롤러 없이도 상태 및 재시도 화면에 사용할 안정적인 플로 핸들을 얻을 수 있습니다. 미러링된 플로는 CLI에서 동기화 모드가 `task_mirrored`로 표시됩니다.

## 플로 상태

| 상태      | 의미                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| `queued`    | 생성되었지만 아직 진행되지 않음                                               |
| `running`   | 플로가 활발히 진행 중임                                               |
| `waiting`   | 관리형 플로가 대기 메타데이터(타이머, 외부 이벤트)에 따라 대기 중임            |
| `blocked`   | 단계가 사용 가능한 결과 없이 완료됨. `blockedTaskId`/요약에 해당 작업이 표시됨 |
| `succeeded` | 성공적으로 완료됨                                                     |
| `failed`    | 오류와 함께 완료됨                                                    |
| `cancelled` | 취소가 요청되었으며 모든 하위 작업이 종결됨                               |
| `lost`      | 플로가 신뢰할 수 있는 기반 상태를 잃음                                  |

## 영구 상태 및 리비전 추적

플로 레코드는 작업 레코드와 함께 공유 SQLite 상태 데이터베이스(`~/.openclaw/state/openclaw.sqlite`, `flow_runs` 테이블)에 영구 저장되므로 Gateway가 다시 시작되어도 진행 상황이 유지됩니다. 각 쓰기는 플로의 `revision`을 증가시킵니다. 오래된 예상 리비전을 전달한 동시 작성자는 충돌 응답을 받고 다시 읽어야 합니다. WAL 증가는 SQLite 자동 체크포인트와 주기적인 패시브 체크포인트로 제한되며, 종료 시에는 truncate 체크포인트가 실행됩니다. 이전 설치에서 사용한 레거시 `flows/registry.sqlite` 사이드카는 `openclaw doctor`가 가져옵니다.

## 취소 동작

`openclaw tasks flow cancel`은 플로에 지속되는 취소 의도를 설정하고, 활성 하위 작업을 취소하며, 새 관리형 하위 작업을 거부합니다. 활성 상태인 하위 작업이 없어지면 플로는 즉시 `cancelled`로 종료됩니다. 하위 작업의 종결에 시간이 더 걸리면 유지 관리 스윕을 통해 종료됩니다. 이 의도는 영구 저장되므로 모든 하위 작업이 종료되기 전에 Gateway가 다시 시작되더라도 취소된 플로는 취소 상태를 유지합니다.

## CLI 명령

```bash
# 활성 플로와 최근 플로 나열
openclaw tasks flow list [--status <status>] [--json]

# 특정 플로의 세부 정보 표시
openclaw tasks flow show <lookup> [--json]

# 실행 중인 플로와 활성 작업 취소
openclaw tasks flow cancel <lookup>
```

| 명령                           | 설명                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| `openclaw tasks flow list`        | 동기화 모드, 상태, 리비전, 컨트롤러, 작업 수가 포함된 추적 대상 플로 |
| `openclaw tasks flow show <id>`   | 플로 ID 또는 소유자 키로 연결된 작업을 포함한 플로 하나를 검사        |
| `openclaw tasks flow cancel <id>` | 실행 중인 플로와 활성 작업을 취소                              |

`openclaw tasks audit`에서도 플로를 검사하여 오래되거나 손상된 플로를 찾으며, `openclaw tasks maintenance`는 멈춘 취소 작업을 종료하고 7일이 지난 종료 플로를 정리합니다.

## 신뢰할 수 있는 예약 워크플로 패턴

시장 정보 브리핑과 같은 반복 워크플로에서는 일정, 오케스트레이션, 신뢰성 검사를 별도 계층으로 취급하십시오.

1. 타이밍에는 [예약 작업](/ko/automation/cron-jobs)을 사용하십시오.
2. 워크플로가 이전 컨텍스트를 기반으로 실행되어야 하는 경우 영구 Cron 세션을 사용하십시오.
3. 결정론적 단계, 승인 게이트, 재개 토큰에는 [Lobster](/ko/tools/lobster)를 사용하십시오.
4. 하위 작업, 대기, 재시도, Gateway 재시작에 걸친 다단계 실행을 추적하려면 Task Flow를 사용하십시오.

Cron 구성 예시:

```bash
openclaw cron add \
  --name "시장 정보 브리핑" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "market-intel Lobster 워크플로를 실행하십시오. 요약하기 전에 소스의 최신 여부를 확인하십시오." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

반복 워크플로에 의도적으로 유지되는 기록, 이전 실행 요약 또는 상시 컨텍스트가 필요한 경우 `isolated` 대신 `--session session:<id>`를 사용하십시오. 각 실행이 새로운 상태에서 시작되어야 하고 필요한 모든 상태가 워크플로에 명시된 경우 `isolated`를 사용하십시오.

워크플로 내부에서는 LLM 요약 단계 전에 신뢰성 검사를 배치하십시오.

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

권장 사전 검사:

- 브라우저 가용성과 프로필 선택을 확인하십시오. 예를 들어 관리형 상태에는 `openclaw`를 사용하고, 로그인된 Chrome 세션이 필요한 경우에는 `user`를 사용합니다. [브라우저](/ko/tools/browser)를 참조하십시오.
- 각 소스의 API 자격 증명과 할당량을 확인하십시오.
- 필수 엔드포인트의 네트워크 연결 가능성을 확인하십시오.
- `lobster`, `browser`, `llm-task` 등 에이전트에 필요한 도구가 활성화되어 있는지 확인하십시오.
- 사전 검사 실패가 표시되도록 Cron의 실패 대상을 구성하십시오. [예약 작업](/ko/automation/cron-jobs#delivery-and-output)을 참조하십시오.

수집된 모든 항목에 권장되는 데이터 출처 필드:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "보고서 예시",
  "content": "..."
}
```

요약 전에 워크플로가 오래된 항목을 거부하거나 오래된 것으로 표시하도록 하십시오. LLM 단계에는 구조화된 JSON만 전달해야 하며, 출력에서 `sourceUrl`, `retrievedAt`, `asOf`를 유지하도록 요청해야 합니다. 워크플로 내부에 스키마로 검증되는 모델 단계가 필요한 경우 [LLM 작업](/ko/tools/llm-task)을 사용하십시오.

재사용 가능한 팀 또는 커뮤니티 워크플로의 경우 CLI, `.lobster` 파일, 설정 참고 사항을 기술 또는 Plugin으로 패키징하여 [ClawHub](/clawhub)를 통해 게시하십시오. Plugin API에 필요한 일반 기능이 없는 경우가 아니라면 워크플로별 가드레일을 해당 패키지에 유지하십시오.

## 플로와 작업의 관계

플로는 작업을 대체하지 않고 조정합니다. 하나의 플로는 수명 주기 동안 여러 백그라운드 작업을 구동할 수 있습니다. 개별 작업 레코드를 검사하려면 `openclaw tasks`를 사용하고, 이를 오케스트레이션하는 플로를 검사하려면 `openclaw tasks flow`를 사용하십시오.

## 관련 문서

- [백그라운드 작업](/ko/automation/tasks) - 플로가 조정하는 분리 실행 작업 원장
- [CLI: 작업](/ko/cli/tasks) - `openclaw tasks flow`의 CLI 명령 참조
- [자동화 개요](/ko/automation) - 모든 자동화 메커니즘을 한눈에 확인
- [Cron 작업](/ko/automation/cron-jobs) - 플로에 입력될 수 있는 예약 작업
