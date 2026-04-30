---
read_when:
    - OpenClaw로 작업을 자동화하는 방법 결정하기
    - Heartbeat, Cron, 약속, 훅, 상시 지시 중에서 선택하기
    - 적절한 자동화 진입점 찾기
summary: '자동화 메커니즘 개요: 작업, Cron, 훅, 상시 지시, 작업 흐름'
title: 자동화 및 작업
x-i18n:
    generated_at: "2026-04-30T06:16:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw는 작업, 예약된 작업, 추론된 약속, 이벤트 훅, 상시 지시를 통해 백그라운드에서 일을 실행합니다. 이 페이지는 적절한 메커니즘을 선택하고 이들이 함께 동작하는 방식을 이해하는 데 도움을 줍니다.

## 빠른 결정 가이드

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| 사용 사례                               | 권장 항목               | 이유                                             |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| 오전 9시 정각에 일일 보고서 보내기      | 예약 작업(Cron)        | 정확한 타이밍, 격리된 실행                       |
| 20분 후에 알림                          | 예약 작업(Cron)        | 정확한 타이밍의 일회성 실행(`--at`)              |
| 주간 심층 분석 실행                     | 예약 작업(Cron)        | 독립형 작업, 다른 모델 사용 가능                 |
| 30분마다 받은 편지함 확인               | Heartbeat              | 다른 확인 작업과 일괄 처리, 컨텍스트 인식        |
| 예정된 이벤트를 위해 캘린더 모니터링    | Heartbeat              | 주기적 인식에 자연스럽게 적합                    |
| 언급된 인터뷰 후 확인                   | 추론된 약속            | 메모리와 유사한 후속 확인, 정확한 알림 요청 없음 |
| 사용자 컨텍스트 후 부드러운 안부 확인   | 추론된 약속            | 동일한 에이전트와 채널로 범위 지정               |
| 하위 에이전트 또는 ACP 실행 상태 검사   | 백그라운드 작업        | 작업 원장이 모든 분리된 작업을 추적              |
| 무엇이 언제 실행되었는지 감사           | 백그라운드 작업        | `openclaw tasks list` 및 `openclaw tasks audit`  |
| 다단계 조사 후 요약                     | 작업 흐름              | 리비전 추적을 포함한 내구성 있는 오케스트레이션  |
| 세션 재설정 시 스크립트 실행            | 훅                     | 이벤트 기반, 수명 주기 이벤트에서 실행           |
| 모든 도구 호출에서 코드 실행            | Plugin 훅              | 프로세스 내 훅이 도구 호출을 가로챌 수 있음      |
| 응답 전에 항상 규정 준수 확인           | 상시 지시              | 모든 세션에 자동으로 주입됨                      |

### 예약 작업(Cron)과 Heartbeat 비교

| 차원          | 예약 작업(Cron)                    | Heartbeat                              |
| ------------- | ----------------------------------- | -------------------------------------- |
| 타이밍        | 정확함(cron 표현식, 일회성)         | 대략적(기본값 30분마다)                |
| 세션 컨텍스트 | 새 컨텍스트(격리됨) 또는 공유됨     | 전체 메인 세션 컨텍스트                |
| 작업 기록     | 항상 생성됨                         | 생성되지 않음                          |
| 전달          | 채널, Webhook 또는 무음             | 메인 세션 내 인라인                    |
| 적합한 용도   | 보고서, 알림, 백그라운드 작업       | 받은 편지함 확인, 캘린더, 알림         |

정확한 타이밍이나 격리된 실행이 필요할 때 예약 작업(Cron)을 사용하세요. 작업이 전체 세션 컨텍스트의 이점을 얻고 대략적인 타이밍으로 충분할 때 Heartbeat를 사용하세요.

## 핵심 개념

### 예약 작업(cron)

Cron은 정확한 타이밍을 위한 Gateway의 내장 스케줄러입니다. 작업을 유지하고, 적절한 시점에 에이전트를 깨우며, 출력을 채팅 채널이나 Webhook 엔드포인트로 전달할 수 있습니다. 일회성 알림, 반복 표현식, 인바운드 Webhook 트리거를 지원합니다.

[예약 작업](/ko/automation/cron-jobs)을 참조하세요.

### 작업

백그라운드 작업 원장은 ACP 실행, 하위 에이전트 생성, 격리된 cron 실행, CLI 작업 등 모든 분리된 작업을 추적합니다. 작업은 스케줄러가 아니라 기록입니다. 이를 검사하려면 `openclaw tasks list`와 `openclaw tasks audit`를 사용하세요.

[백그라운드 작업](/ko/automation/tasks)을 참조하세요.

### 추론된 약속

약속은 옵트인 방식의 단기 후속 메모리입니다. OpenClaw는 일반 대화에서 이를 추론하고, 동일한 에이전트와 채널로 범위를 지정하며, Heartbeat를 통해 기한이 된 확인을 전달합니다. 사용자가 정확히 요청한 알림은 여전히 cron에 속합니다.

[추론된 약속](/ko/concepts/commitments)을 참조하세요.

### 작업 흐름

작업 흐름은 백그라운드 작업 위의 흐름 오케스트레이션 기반입니다. 관리형 및 미러링 동기화 모드, 리비전 추적, 검사를 위한 `openclaw tasks flow list|show|cancel`을 통해 내구성 있는 다단계 흐름을 관리합니다.

[작업 흐름](/ko/automation/taskflow)을 참조하세요.

### 상시 지시

상시 지시는 정의된 프로그램에 대해 에이전트에 영구 운영 권한을 부여합니다. 이는 작업 영역 파일(일반적으로 `AGENTS.md`)에 있으며 모든 세션에 주입됩니다. 시간 기반 강제 적용에는 cron과 함께 사용하세요.

[상시 지시](/ko/automation/standing-orders)를 참조하세요.

### 훅

내부 훅은 에이전트 수명 주기 이벤트(`/new`, `/reset`, `/stop`), 세션 Compaction, Gateway 시작, 메시지 흐름에 의해 트리거되는 이벤트 기반 스크립트입니다. 디렉터리에서 자동으로 발견되며 `openclaw hooks`로 관리할 수 있습니다. 프로세스 내 도구 호출 가로채기에는 [Plugin 훅](/ko/plugins/hooks)을 사용하세요.

[훅](/ko/automation/hooks)을 참조하세요.

### Heartbeat

Heartbeat는 주기적인 메인 세션 턴입니다(기본값 30분마다). 받은 편지함, 캘린더, 알림 등 여러 확인 작업을 전체 세션 컨텍스트가 있는 하나의 에이전트 턴으로 일괄 처리합니다. Heartbeat 턴은 작업 기록을 생성하지 않으며 일일/유휴 세션 재설정 최신성을 연장하지 않습니다. 작은 체크리스트에는 `HEARTBEAT.md`를 사용하거나, Heartbeat 자체 안에서 기한이 된 항목만 주기적으로 확인하려면 `tasks:` 블록을 사용하세요. 빈 Heartbeat 파일은 `empty-heartbeat-file`로 건너뛰며, 기한 항목 전용 작업 모드는 `no-tasks-due`로 건너뜁니다. cron 작업이 활성 상태이거나 대기 중이면 Heartbeat는 지연되며, `heartbeat.skipWhenBusy`는 하위 에이전트나 중첩 레인이 사용 중일 때도 이를 지연할 수 있습니다.

[Heartbeat](/ko/gateway/heartbeat)를 참조하세요.

## 함께 동작하는 방식

- **Cron**은 정확한 일정(일일 보고서, 주간 검토)과 일회성 알림을 처리합니다. 모든 cron 실행은 작업 기록을 생성합니다.
- **Heartbeat**는 30분마다 하나의 일괄 턴에서 받은 편지함, 캘린더, 알림 같은 정기 모니터링을 처리합니다.
- **훅**은 세션 재설정, Compaction, 메시지 흐름 같은 특정 이벤트에 사용자 지정 스크립트로 반응합니다. Plugin 훅은 도구 호출을 처리합니다.
- **상시 지시**는 에이전트에 지속적인 컨텍스트와 권한 경계를 제공합니다.
- **작업 흐름**은 개별 작업 위에서 다단계 흐름을 조정합니다.
- **작업**은 모든 분리된 일을 자동으로 추적하여 검사하고 감사할 수 있게 합니다.

## 관련 항목

- [예약 작업](/ko/automation/cron-jobs) — 정확한 예약과 일회성 알림
- [추론된 약속](/ko/concepts/commitments) — 메모리와 유사한 후속 확인
- [백그라운드 작업](/ko/automation/tasks) — 모든 분리된 작업을 위한 작업 원장
- [작업 흐름](/ko/automation/taskflow) — 내구성 있는 다단계 흐름 오케스트레이션
- [훅](/ko/automation/hooks) — 이벤트 기반 수명 주기 스크립트
- [Plugin 훅](/ko/plugins/hooks) — 프로세스 내 도구, 프롬프트, 메시지, 수명 주기 훅
- [상시 지시](/ko/automation/standing-orders) — 지속적인 에이전트 지시
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 메인 세션 턴
- [구성 참조](/ko/gateway/configuration-reference) — 모든 구성 키
