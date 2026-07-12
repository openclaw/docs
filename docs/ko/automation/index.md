---
doc-schema-version: 1
read_when:
    - OpenClaw으로 작업을 자동화하는 방법 결정하기
    - Heartbeat, Cron, 약속, 훅, 상시 명령 중 선택하기
    - 적합한 자동화 진입점 찾기
summary: '자동화 메커니즘 개요: 작업, Cron, 훅, 상시 명령 및 TaskFlow'
title: 자동화
x-i18n:
    generated_at: "2026-07-12T00:33:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 210f2a33012e854e48aa145c665e16e7ffe861c91a2566507e81d809bb2b955c
    source_path: automation/index.md
    workflow: 16
---

OpenClaw은 작업, 예약 작업, 추론된 약속, 이벤트 훅, 상시 지침을 통해 백그라운드에서 작업을 실행합니다. 이 페이지를 사용하여 적절한 메커니즘을 선택하세요.

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

| 사용 사례                                      | 권장 메커니즘          | 이유                                               |
| ---------------------------------------------- | ---------------------- | -------------------------------------------------- |
| 매일 오전 9시 정각에 보고서 보내기             | 예약 작업(Cron)        | 정확한 실행 시각, 격리된 실행                     |
| 20분 후에 알림 받기                            | 예약 작업(Cron)        | 정확한 시각의 일회성 실행(`--at`)                 |
| 매주 심층 분석 실행                            | 예약 작업(Cron)        | 독립 실행 작업이며 다른 모델을 사용할 수 있음     |
| 30분마다 받은 편지함 확인                      | Heartbeat              | 다른 확인 작업과 일괄 처리하며 컨텍스트를 인식함  |
| 예정된 이벤트가 있는지 캘린더 모니터링         | Heartbeat              | 주기적인 상황 인식에 자연스럽게 적합함            |
| 언급된 면접 이후 안부 확인                     | 추론된 약속            | 정확한 알림 요청이 없는 메모리형 후속 확인        |
| 사용자 컨텍스트에 따라 세심하게 안부 확인      | 추론된 약속            | 동일한 에이전트와 채널로 범위가 한정됨            |
| 하위 에이전트 또는 ACP 실행 상태 검사          | 백그라운드 작업        | 작업 원장에서 모든 분리 실행 작업을 추적함        |
| 무엇이 언제 실행되었는지 감사                  | 백그라운드 작업        | `openclaw tasks list` 및 `openclaw tasks audit`   |
| 여러 단계의 조사 후 요약                       | 작업 흐름              | 리비전 추적을 지원하는 지속형 오케스트레이션      |
| 세션 재설정 시 스크립트 실행                   | 훅                     | 이벤트 기반으로 수명 주기 이벤트에서 실행됨      |
| 모든 도구 호출에서 코드 실행                   | Plugin 훅              | 프로세스 내 훅이 도구 호출을 가로챌 수 있음       |
| 응답 전에 항상 규정 준수 확인                  | 상시 지침              | 모든 세션에 자동으로 주입됨                       |

### 예약 작업(Cron)과 Heartbeat 비교

| 항목          | 예약 작업(Cron)                       | Heartbeat                                  |
| ------------- | ------------------------------------- | ------------------------------------------ |
| 실행 시각     | 정확함(Cron 표현식, 일회성 실행)      | 근사치(기본값은 30분마다)                  |
| 세션 컨텍스트 | 새 컨텍스트(격리됨) 또는 공유됨       | 기본 세션의 전체 컨텍스트                  |
| 작업 기록     | 항상 생성됨                           | 생성되지 않음                              |
| 전달 방식     | 채널, Webhook 또는 전달 안 함         | 기본 세션 내에서 인라인으로 전달           |
| 적합한 용도   | 보고서, 알림, 백그라운드 작업         | 받은 편지함 확인, 캘린더, 알림             |

정확한 실행 시각이나 격리된 실행이 필요하면 예약 작업(Cron)을 사용하세요. 전체 세션 컨텍스트를 활용하는 것이 유리하고 대략적인 실행 시각으로 충분하다면 Heartbeat를 사용하세요.

## 핵심 개념

### 예약 작업(Cron)

Cron은 정확한 실행 시각을 위한 Gateway 내장 스케줄러입니다. 작업을 영구 저장하고 적절한 시각에 에이전트를 깨우며, 채팅 채널이나 Webhook 엔드포인트로 출력을 전달할 수 있습니다. 일회성 알림, 반복 표현식, 인바운드 Webhook 트리거를 지원합니다.

[예약 작업](/ko/automation/cron-jobs)을 참조하세요.

### 작업

백그라운드 작업 원장은 ACP 실행, 하위 에이전트 생성, 격리된 Cron 실행, CLI 작업 등 모든 분리 실행 작업을 추적합니다. 작업은 기록이지 스케줄러가 아닙니다. `openclaw tasks list`와 `openclaw tasks audit`를 사용하여 작업을 검사하세요.

[백그라운드 작업](/ko/automation/tasks)을 참조하세요.

### 추론된 약속

약속은 사용자가 선택하여 활성화하는 단기 후속 확인 메모리입니다. OpenClaw은 일반적인 대화에서 약속을 추론하고 동일한 에이전트와 채널로 범위를 한정하며, 예정된 안부 확인을 Heartbeat를 통해 전달합니다. 사용자가 정확한 시각을 지정하여 요청한 알림은 여전히 Cron으로 처리해야 합니다.

[추론된 약속](/ko/concepts/commitments)을 참조하세요.

### 작업 흐름

작업 흐름은 백그라운드 작업 상위에 있는 흐름 오케스트레이션 기반입니다. 관리형 및 미러형 동기화 모드와 리비전 추적을 지원하는 지속형 다단계 흐름을 관리하며, `openclaw tasks flow list|show|cancel`을 사용하여 검사할 수 있습니다.

[작업 흐름](/ko/automation/taskflow)을 참조하세요.

### 상시 지침

상시 지침은 정의된 프로그램에 대해 에이전트에 영구적인 운영 권한을 부여합니다. 상시 지침은 작업 공간 파일(일반적으로 `AGENTS.md`)에 있으며 모든 세션에 주입됩니다. 시간 기반 적용이 필요하면 Cron과 함께 사용하세요.

[상시 지침](/ko/automation/standing-orders)을 참조하세요.

### 훅

내부 훅은 에이전트 수명 주기 이벤트(`/new`, `/reset`, `/stop`), 세션 Compaction, Gateway 시작, 메시지 흐름에 의해 트리거되는 이벤트 기반 스크립트입니다. 훅 디렉터리에서 검색되며 `openclaw hooks`로 관리됩니다. 프로세스 내에서 도구 호출을 가로채려면 [Plugin 훅](/ko/plugins/hooks)을 사용하세요.

[훅](/ko/automation/hooks)을 참조하세요.

### Heartbeat

Heartbeat는 주기적으로 실행되는 기본 세션 턴입니다(기본값은 30분마다). 받은 편지함, 캘린더, 알림 등의 여러 확인 작업을 전체 세션 컨텍스트가 포함된 하나의 에이전트 턴에서 일괄 처리합니다. Heartbeat 턴은 작업 기록을 생성하지 않으며 일일/유휴 세션 재설정의 최신 상태 기간을 연장하지 않습니다. 간단한 체크리스트에는 `HEARTBEAT.md`를 사용하고, Heartbeat 자체에서 기한이 된 주기적 확인만 실행하려면 `tasks:` 블록을 사용하세요. 빈 Heartbeat 파일은 `empty-heartbeat-file`로 건너뛰며, 기한이 된 작업만 실행하는 모드는 `no-tasks-due`로 건너뜁니다. Cron 작업이 실행 중이거나 대기열에 있으면 Heartbeat는 연기되며, `heartbeat.skipWhenBusy`를 사용하면 동일한 에이전트의 세션 키 기반 하위 에이전트 또는 중첩 레인이 실행 중일 때도 해당 에이전트의 Heartbeat를 연기할 수 있습니다.

[Heartbeat](/ko/gateway/heartbeat)를 참조하세요.

## 함께 작동하는 방식

- **Cron**은 정확한 일정(일일 보고서, 주간 검토)과 일회성 알림을 처리합니다. 모든 Cron 실행은 작업 기록을 생성합니다.
- **Heartbeat**는 30분마다 한 번의 일괄 처리 턴에서 정기적인 모니터링(받은 편지함, 캘린더, 알림)을 처리합니다.
- **훅**은 사용자 지정 스크립트로 특정 이벤트(세션 재설정, Compaction, 메시지 흐름)에 반응합니다. Plugin 훅은 도구 호출을 처리합니다.
- **상시 지침**은 에이전트에 지속적인 컨텍스트와 권한 경계를 제공합니다.
- **작업 흐름**은 개별 작업 상위에서 다단계 흐름을 조정합니다.
- **작업**은 모든 분리 실행 작업을 자동으로 추적하여 검사하고 감사할 수 있게 합니다.

## 관련 문서

- [예약 작업](/ko/automation/cron-jobs) — 정확한 일정 관리 및 일회성 알림
- [추론된 약속](/ko/concepts/commitments) — 메모리형 후속 안부 확인
- [백그라운드 작업](/ko/automation/tasks) — 모든 분리 실행 작업을 위한 작업 원장
- [작업 흐름](/ko/automation/taskflow) — 지속형 다단계 흐름 오케스트레이션
- [훅](/ko/automation/hooks) — 이벤트 기반 수명 주기 스크립트
- [Plugin 훅](/ko/plugins/hooks) — 프로세스 내 도구, 프롬프트, 메시지 및 수명 주기 훅
- [상시 지침](/ko/automation/standing-orders) — 지속적인 에이전트 지침
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 기본 세션 턴
- [구성 참조](/ko/gateway/configuration-reference) — 모든 구성 키
