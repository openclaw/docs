---
read_when:
    - TaskFlow가 백그라운드 작업과 어떤 관련이 있는지 이해하려고 합니다
    - 릴리스 노트 또는 문서에서 TaskFlow 또는 openclaw tasks flow를 접하게 됩니다
    - 지속성 플로우 상태를 검사하거나 관리하려는 경우
summary: 백그라운드 작업 상위의 작업 흐름 오케스트레이션 계층
title: 작업 흐름
x-i18n:
    generated_at: "2026-07-02T08:09:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow는 [백그라운드 작업](/ko/automation/tasks) 위에 위치하는 흐름 오케스트레이션 기반입니다. 개별 작업은 분리된 작업 단위로 유지하면서, 자체 상태, 리비전 추적, 동기화 의미 체계를 갖춘 내구성 있는 다단계 흐름을 관리합니다.

## Task Flow를 사용할 때

작업이 여러 순차 또는 분기 단계에 걸쳐 있고 Gateway 재시작 후에도 내구성 있는 진행 상황 추적이 필요할 때 Task Flow를 사용하세요. 단일 백그라운드 작업에는 일반 [작업](/ko/automation/tasks)으로 충분합니다.

| 시나리오                              | 사용                  |
| ------------------------------------- | -------------------- |
| 단일 백그라운드 작업                  | 일반 작업            |
| 다단계 파이프라인(A 다음 B 다음 C)    | Task Flow(관리됨)    |
| 외부에서 생성된 작업 관찰             | Task Flow(미러링됨)  |
| 일회성 알림                           | Cron 작업            |

## 신뢰할 수 있는 예약 워크플로 패턴

시장 인텔리전스 브리핑과 같은 반복 워크플로의 경우 일정, 오케스트레이션, 신뢰성 검사를 별도 계층으로 다루세요.

1. 타이밍에는 [Scheduled Tasks](/ko/automation/cron-jobs)를 사용합니다.
2. 워크플로가 이전 컨텍스트를 기반으로 이어져야 할 때는 영구 cron 세션을 사용합니다.
3. 결정적 단계, 승인 게이트, 재개 토큰에는 [Lobster](/ko/tools/lobster)를 사용합니다.
4. 하위 작업, 대기, 재시도, Gateway 재시작 전반에서 다단계 실행을 추적하려면 Task Flow를 사용합니다.

cron 형태 예시:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

반복 워크플로에 의도적인 이력, 이전 실행 요약, 또는 상시 컨텍스트가 필요하면 `isolated` 대신 `session:<id>`를 사용하세요. 각 실행이 새로 시작되어야 하고 필요한 모든 상태가 워크플로에 명시되어 있다면 `isolated`를 사용하세요.

워크플로 내부에서는 LLM 요약 단계 전에 신뢰성 검사를 배치하세요.

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

권장 사전 점검:

- 브라우저 사용 가능 여부와 프로필 선택. 예를 들어 관리되는 상태에는 `openclaw`, 로그인된 Chrome 세션이 필요할 때는 `user`를 사용합니다. [Browser](/ko/tools/browser)를 참조하세요.
- 각 소스의 API 자격 증명 및 할당량.
- 필요한 엔드포인트에 대한 네트워크 도달성.
- 에이전트에 필요한 도구 활성화 여부. 예: `lobster`, `browser`, `llm-task`.
- 사전 점검 실패가 표시되도록 cron의 실패 대상이 구성되어 있는지 여부. [Scheduled Tasks](/ko/automation/cron-jobs#delivery-and-output)를 참조하세요.

수집된 모든 항목에 권장되는 데이터 출처 필드:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

요약 전에 워크플로가 오래된 항목을 거부하거나 표시하도록 하세요. LLM 단계에는 구조화된 JSON만 전달해야 하며, 출력에서 `sourceUrl`, `retrievedAt`, `asOf`를 보존하도록 요청해야 합니다. 워크플로 안에서 스키마 검증된 모델 단계가 필요할 때는 [LLM Task](/ko/tools/llm-task)를 사용하세요.

팀 또는 커뮤니티에서 재사용 가능한 워크플로의 경우 CLI, `.lobster` 파일, 설정 참고 사항을 Skills 또는 Plugin으로 패키징하고 [ClawHub](/clawhub)를 통해 게시하세요. Plugin API에 필요한 범용 기능이 없는 경우가 아니라면 워크플로별 가드레일은 해당 패키지 안에 유지하세요.

## 동기화 모드

### 관리 모드

Task Flow가 수명 주기 전체를 소유합니다. 흐름 단계로 작업을 생성하고, 완료까지 진행하며, 흐름 상태를 자동으로 전진시킵니다.

예: (1) 데이터를 수집하고, (2) 보고서를 생성하고, (3) 전달하는 주간 보고서 흐름. Task Flow는 각 단계를 백그라운드 작업으로 생성하고 완료를 기다린 다음 다음 단계로 이동합니다.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 미러링 모드

Task Flow는 외부에서 생성된 작업을 관찰하고, 작업 생성의 소유권을 갖지 않은 채 흐름 상태를 동기화합니다. cron 작업, CLI 명령 또는 기타 소스에서 작업이 시작되고 그 진행 상황을 흐름으로 통합해 보고 싶을 때 유용합니다.

예: 함께 "morning ops" 루틴을 구성하는 세 개의 독립적인 cron 작업. 미러링된 흐름은 언제 또는 어떻게 실행되는지를 제어하지 않고 전체 진행 상황을 추적합니다.

## 내구성 있는 상태 및 리비전 추적

각 흐름은 자체 상태를 유지하고 리비전을 추적하므로 Gateway 재시작 후에도 진행 상황이 보존됩니다. 리비전 추적을 통해 여러 소스가 동일한 흐름을 동시에 전진시키려 할 때 충돌을 감지할 수 있습니다.
흐름 레지스트리는 주기적 체크포인트와 종료 시 체크포인트를 포함해 제한된 write-ahead-log 유지 관리를 갖춘 SQLite를 사용하므로, 장시간 실행되는 Gateway가 제한 없이 `registry.sqlite-wal` 사이드카 파일을 보존하지 않습니다.

## 취소 동작

`openclaw tasks flow cancel`은 흐름에 고정 취소 의도를 설정합니다. 흐름 내 활성 작업은 취소되고, 새 단계는 시작되지 않습니다. 취소 의도는 재시작 후에도 유지되므로 모든 하위 작업이 종료되기 전에 Gateway가 재시작되더라도 취소된 흐름은 취소된 상태로 유지됩니다.

## CLI 명령

```bash
# 활성 및 최근 흐름 나열
openclaw tasks flow list

# 특정 흐름의 세부 정보 표시
openclaw tasks flow show <lookup>

# 실행 중인 흐름과 해당 활성 작업 취소
openclaw tasks flow cancel <lookup>
```

| 명령                              | 설명                                          |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | 상태 및 동기화 모드와 함께 추적된 흐름 표시  |
| `openclaw tasks flow show <id>`   | 흐름 id 또는 lookup 키로 하나의 흐름 검사    |
| `openclaw tasks flow cancel <id>` | 실행 중인 흐름과 해당 활성 작업 취소         |

## 흐름과 작업의 관계

흐름은 작업을 대체하지 않고 조정합니다. 하나의 흐름은 수명 동안 여러 백그라운드 작업을 구동할 수 있습니다. 개별 작업 레코드를 검사하려면 `openclaw tasks`를 사용하고, 오케스트레이션하는 흐름을 검사하려면 `openclaw tasks flow`를 사용하세요.

## 관련 항목

- [Background Tasks](/ko/automation/tasks) — 흐름이 조정하는 분리된 작업 원장
- [CLI: tasks](/ko/cli/tasks) — `openclaw tasks flow`에 대한 CLI 명령 참조
- [Automation Overview](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [Cron Jobs](/ko/automation/cron-jobs) — 흐름에 공급될 수 있는 예약 작업
