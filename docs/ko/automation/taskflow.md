---
read_when:
    - 작업 흐름이 백그라운드 작업과 어떤 관련이 있는지 이해하고자 합니다.
    - 릴리스 노트나 문서에서 TaskFlow 또는 OpenClaw 작업 흐름을 접하게 됩니다.
    - 내구성 있는 작업 흐름 상태를 검사하거나 관리하려고 합니다.
summary: 백그라운드 작업 위의 작업 흐름 오케스트레이션 계층
title: 작업 흐름
x-i18n:
    generated_at: "2026-04-25T05:56:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: de94ed672e492c7dac066e1a63f5600abecfea63828a92acca1b8caa041c5212
    source_path: automation/taskflow.md
    workflow: 15
---

TaskFlow는 [백그라운드 작업](/ko/automation/tasks) 위에 위치하는 작업 흐름 오케스트레이션 기반 계층입니다. 개별 작업은 분리된 작업의 단위로 유지되는 반면, TaskFlow는 자체 상태, 리비전 추적, 동기화 의미 체계를 갖춘 내구성 있는 다단계 작업 흐름을 관리합니다.

## TaskFlow를 사용해야 하는 경우

작업이 여러 순차적 단계 또는 분기 단계에 걸쳐 있고 gateway 재시작 전반에서 내구성 있는 진행 상황 추적이 필요할 때는 TaskFlow를 사용하세요. 단일 백그라운드 작업에는 일반 [task](/ko/automation/tasks)로 충분합니다.

| 시나리오                              | 사용                  |
| ------------------------------------- | -------------------- |
| 단일 백그라운드 작업                 | 일반 task            |
| 다단계 파이프라인 (A 다음 B 다음 C) | TaskFlow (관리형)    |
| 외부에서 생성된 작업 관찰            | TaskFlow (미러형)    |
| 일회성 리마인더                      | Cron 작업            |

## 신뢰할 수 있는 예약 작업 흐름 패턴

시장 정보 브리핑과 같은 반복 작업 흐름의 경우, 일정, 오케스트레이션, 신뢰성 검사를 별도의 계층으로 취급하세요.

1. 타이밍에는 [Scheduled Tasks](/ko/automation/cron-jobs)를 사용하세요.
2. 작업 흐름이 이전 컨텍스트를 기반으로 구축되어야 한다면 영구적인 cron 세션을 사용하세요.
3. 결정적 단계, 승인 게이트, 재개 토큰에는 [Lobster](/ko/tools/lobster)를 사용하세요.
4. 자식 작업, 대기, 재시도, gateway 재시작 전반에 걸친 다단계 실행 추적에는 TaskFlow를 사용하세요.

예시 cron 형태:

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

반복 작업 흐름에 의도적인 이력, 이전 실행 요약, 또는 지속적인 컨텍스트가 필요할 때는 `isolated` 대신 `session:<id>`를 사용하세요. 각 실행이 새로 시작되어야 하고 필요한 모든 상태가 작업 흐름에 명시적으로 포함되어야 할 때는 `isolated`를 사용하세요.

작업 흐름 내부에서는 LLM 요약 단계 전에 신뢰성 검사를 배치하세요.

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

권장되는 preflight 검사:

- 브라우저 가용성과 프로필 선택(예: 관리형 상태를 위한 `openclaw`, 로그인된 Chrome 세션이 필요할 때의 `user`). [Browser](/ko/tools/browser)를 참고하세요.
- 각 소스에 대한 API 자격 증명 및 할당량.
- 필요한 엔드포인트에 대한 네트워크 도달 가능성.
- 에이전트에 `lobster`, `browser`, `llm-task`와 같은 필요한 도구가 활성화되어 있는지.
- preflight 실패를 확인할 수 있도록 cron의 실패 대상이 구성되어 있는지. [Scheduled Tasks](/ko/automation/cron-jobs#delivery-and-output)를 참고하세요.

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

요약 전에 작업 흐름이 오래된 항목을 거부하거나 오래된 것으로 표시하도록 하세요. LLM 단계에는 구조화된 JSON만 전달해야 하며, 출력에서 `sourceUrl`, `retrievedAt`, `asOf`를 유지하도록 요청해야 합니다. 작업 흐름 내에서 스키마로 검증된 모델 단계가 필요하다면 [LLM Task](/ko/tools/llm-task)를 사용하세요.

재사용 가능한 팀 또는 커뮤니티 작업 흐름의 경우, CLI, `.lobster` 파일, 그리고 모든 설정 메모를 skill 또는 plugin으로 패키징하고 [ClawHub](/ko/tools/clawhub)를 통해 게시하세요. plugin API에 필요한 일반 기능이 없다면, 작업 흐름별 가드레일은 해당 패키지에 유지하세요.

## 동기화 모드

### 관리형 모드

TaskFlow가 수명 주기를 처음부터 끝까지 소유합니다. 작업 흐름 단계로서 작업을 생성하고, 완료될 때까지 구동하며, 작업 흐름 상태를 자동으로 진행시킵니다.

예시: (1) 데이터를 수집하고, (2) 보고서를 생성하며, (3) 전달하는 주간 보고서 작업 흐름. TaskFlow는 각 단계를 백그라운드 작업으로 생성하고, 완료를 기다린 다음, 다음 단계로 이동합니다.

```
Flow: weekly-report
  Step 1: gather-data     → 작업 생성됨 → 성공
  Step 2: generate-report → 작업 생성됨 → 성공
  Step 3: deliver         → 작업 생성됨 → 실행 중
```

### 미러형 모드

TaskFlow는 외부에서 생성된 작업을 관찰하고 작업 생성의 소유권을 갖지 않은 채 작업 흐름 상태를 동기화 상태로 유지합니다. 이는 작업이 cron 작업, CLI 명령, 또는 다른 소스에서 시작되고, 그 진행 상황을 하나의 작업 흐름으로 통합해 보고 싶을 때 유용합니다.

예시: 함께 "아침 운영" 루틴을 구성하는 세 개의 독립적인 cron 작업. 미러형 작업 흐름은 언제 어떻게 실행되는지를 제어하지 않고 이들의 전체 진행 상황을 추적합니다.

## 내구성 있는 상태와 리비전 추적

각 작업 흐름은 자체 상태를 유지하고 리비전을 추적하므로 진행 상황이 gateway 재시작 후에도 유지됩니다. 리비전 추적은 여러 소스가 동시에 동일한 작업 흐름을 진행시키려 할 때 충돌 감지를 가능하게 합니다.

## 취소 동작

`openclaw tasks flow cancel`은 작업 흐름에 고정형 취소 의도를 설정합니다. 작업 흐름 내의 활성 작업은 취소되며, 새 단계는 시작되지 않습니다. 이 취소 의도는 재시작 후에도 유지되므로, 모든 자식 작업이 종료되기 전에 gateway가 재시작되더라도 취소된 작업 흐름은 계속 취소된 상태로 유지됩니다.

## CLI 명령

```bash
# 활성 및 최근 작업 흐름 목록 표시
openclaw tasks flow list

# 특정 작업 흐름의 세부 정보 표시
openclaw tasks flow show <lookup>

# 실행 중인 작업 흐름과 해당 활성 작업 취소
openclaw tasks flow cancel <lookup>
```

| 명령                           | 설명                                        |
| --------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`        | 상태와 동기화 모드가 포함된 추적 중인 작업 흐름 표시 |
| `openclaw tasks flow show <id>`   | 작업 흐름 id 또는 lookup 키로 작업 흐름 하나 검사    |
| `openclaw tasks flow cancel <id>` | 실행 중인 작업 흐름과 해당 활성 작업 취소           |

## 작업 흐름과 작업의 관계

작업 흐름은 작업을 대체하지 않고 조정합니다. 하나의 작업 흐름은 수명 주기 동안 여러 백그라운드 작업을 구동할 수 있습니다. 개별 작업 레코드는 `openclaw tasks`로 검사하고, 오케스트레이션 작업 흐름은 `openclaw tasks flow`로 검사하세요.

## 관련 항목

- [Background Tasks](/ko/automation/tasks) — 작업 흐름이 조정하는 분리된 작업 원장
- [CLI: tasks](/ko/cli/tasks) — `openclaw tasks flow`용 CLI 명령 참조
- [Automation Overview](/ko/automation) — 모든 자동화 메커니즘을 한눈에 보기
- [Cron Jobs](/ko/automation/cron-jobs) — 작업 흐름에 연결될 수 있는 예약 작업
