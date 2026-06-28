---
read_when:
    - Mac 메뉴 UI 또는 상태 로직 조정
summary: 메뉴 막대 상태 로직과 사용자에게 표시되는 내용
title: 메뉴 막대
x-i18n:
    generated_at: "2026-05-06T06:33:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c569ced20b2f6a639d52d373cc8b55a42d7c015a0b234d5154ce67ac03c2eaf6
    source_path: platforms/mac/menu-bar.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 표시되는 내용

- 메뉴 막대 아이콘과 메뉴의 첫 번째 상태 행에 현재 에이전트 작업 상태를 표시합니다.
- 작업이 활성 상태인 동안에는 상태 상태가 숨겨지며, 모든 세션이 유휴 상태가 되면 다시 나타납니다.
- 루트 "컨텍스트" 하위 메뉴에는 최근 세션이 포함되며, 루트 메뉴에서 직접 펼치지 않습니다.
- 루트 메뉴의 "노드" 블록은 클라이언트/프레즌스 항목이 아니라 **디바이스**만 나열합니다(`node.list`를 통한 페어링된 노드).
- 제공자 사용량 스냅샷을 사용할 수 있으면 컨텍스트 아래에 루트 "사용량" 섹션이 표시되고, 사용할 수 있는 경우 사용 비용 세부 정보가 이어집니다.

## 상태 모델

- 세션: 이벤트는 페이로드의 `sessionKey`와 함께 `runId`(실행별)를 포함해 도착합니다. "메인" 세션은 키 `main`입니다. 없으면 가장 최근에 업데이트된 세션으로 대체합니다.
- 우선순위: 메인이 항상 우선합니다. 메인이 활성 상태이면 해당 상태가 즉시 표시됩니다. 메인이 유휴 상태이면 가장 최근에 활성화된 비메인 세션이 표시됩니다. 활동 중간에 오락가락 전환하지 않으며, 현재 세션이 유휴 상태가 되거나 메인이 활성 상태가 될 때만 전환합니다.
- 활동 종류:
  - `job`: 상위 수준 명령 실행(`state: started|streaming|done|error`).
  - `tool`: `toolName` 및 `meta/args`가 포함된 `phase: start|result`.

## IconState 열거형(Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`(디버그 재정의)

### ActivityKind → 글리프

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 기본값 → 🛠️

### 시각적 매핑

- `idle`: 일반 크리터.
- `workingMain`: 글리프가 있는 배지, 전체 틴트, 다리 "작업 중" 애니메이션.
- `workingOther`: 글리프가 있는 배지, 흐린 틴트, 급히 움직임 없음.
- `overridden`: 활동과 관계없이 선택한 글리프/틴트를 사용합니다.

## 컨텍스트 하위 메뉴

- 루트 메뉴는 세션 수/상태가 포함된 하나의 "컨텍스트" 행을 표시하고 하위 메뉴를 엽니다.
- 컨텍스트 하위 메뉴 헤더는 최근 24시간 동안의 활성 세션 수를 표시합니다.
- 각 세션 행은 토큰 막대, 나이, 미리보기, 사고/상세 표시, 재설정, 압축, 삭제 작업을 유지합니다.
- 로딩, 연결 해제, 세션 로드 오류 메시지는 컨텍스트 하위 메뉴 안에 표시됩니다.
- 제공자 사용량 및 사용 비용 세부 정보는 컨텍스트 아래 루트 수준에 유지되어 하위 메뉴를 열지 않고도 한눈에 확인할 수 있습니다.

## 상태 행 텍스트(메뉴)

- 작업이 활성 상태일 때: `<Session role> · <activity label>`
  - 예: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- 유휴 상태일 때: 상태 요약으로 대체됩니다.

## 이벤트 수집

- 소스: 컨트롤 채널 `agent` 이벤트(`ControlChannel.handleAgentEvent`).
- 파싱된 필드:
  - 시작/중지용 `data.state`가 포함된 `stream: "job"`.
  - `data.phase`, `name`, 선택적 `meta`/`args`가 포함된 `stream: "tool"`.
- 레이블:
  - `exec`: `args.command`의 첫 번째 줄.
  - `read`/`write`: 축약된 경로.
  - `edit`: 경로와 `meta`/diff 개수에서 추론한 변경 종류.
  - 대체값: 도구 이름.

## 디버그 재정의

- 설정 ▸ 디버그 ▸ "아이콘 재정의" 선택기:
  - `System (auto)`(기본값)
  - `Working: main`(도구 종류별)
  - `Working: other`(도구 종류별)
  - `Idle`
- `@AppStorage("iconOverride")`를 통해 저장되며, `IconState.overridden`으로 매핑됩니다.

## 테스트 체크리스트

- 메인 세션 작업 트리거: 아이콘이 즉시 전환되고 상태 행에 메인 레이블이 표시되는지 확인합니다.
- 메인이 유휴 상태일 때 비메인 세션 작업 트리거: 아이콘/상태가 비메인을 표시하며, 완료될 때까지 안정적으로 유지됩니다.
- 다른 세션이 활성 상태일 때 메인 시작: 아이콘이 즉시 메인으로 전환됩니다.
- 빠른 도구 연속 발생: 배지가 깜박이지 않는지 확인합니다(도구 결과에 TTL 유예 적용).
- 모든 세션이 유휴 상태가 되면 상태 행이 다시 나타납니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [메뉴 막대 아이콘](/ko/platforms/mac/icon)
