---
read_when:
    - Mac 메뉴 UI 또는 상태 로직 조정
summary: 메뉴 막대 상태 로직 및 사용자에게 표시되는 내용
title: 메뉴 막대
x-i18n:
    generated_at: "2026-05-02T20:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 340b86a2e222fb1fe7fda4f0f0434127af1393a64348ea033ea284ba52866beb
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

# 메뉴 막대 상태 로직

## 표시되는 내용

- 메뉴 막대 아이콘과 메뉴의 첫 번째 상태 행에 현재 에이전트 작업 상태를 표시합니다.
- 작업이 활성 상태인 동안에는 상태 점검 상태가 숨겨지며, 모든 세션이 유휴 상태가 되면 다시 표시됩니다.
- 루트 “컨텍스트” 하위 메뉴는 최근 세션을 루트 메뉴에서 직접 펼치지 않고 그 안에 포함합니다.
- 루트 메뉴의 “Nodes” 블록은 클라이언트/프레즌스 항목이 아니라 **장치**만 나열합니다(`node.list`를 통한 페어링된 노드).
- 공급자 사용량 스냅샷을 사용할 수 있으면 컨텍스트 아래에 루트 “사용량” 섹션이 나타나며, 사용할 수 있는 경우 사용량 비용 세부 정보가 이어집니다.

## 상태 모델

- 세션: 이벤트는 `runId`(실행별)와 페이로드의 `sessionKey`를 함께 포함해 도착합니다. “메인” 세션은 키 `main`입니다. 없으면 가장 최근에 업데이트된 세션으로 폴백합니다.
- 우선순위: 메인이 항상 우선합니다. 메인이 활성 상태이면 그 상태가 즉시 표시됩니다. 메인이 유휴 상태이면 가장 최근에 활성 상태였던 비메인 세션이 표시됩니다. 활동 중간에 이리저리 전환하지 않으며, 현재 세션이 유휴 상태가 되거나 메인이 활성 상태가 될 때만 전환합니다.
- 활동 종류:
  - `job`: 상위 수준 명령 실행(`state: started|streaming|done|error`).
  - `tool`: `toolName` 및 `meta/args`가 포함된 `phase: start|result`.

## IconState 열거형(Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)`(디버그 오버라이드)

### ActivityKind → 글리프

- `exec` → 💻
- `read` → 📄
- `write` → ✍️
- `edit` → 📝
- `attach` → 📎
- 기본값 → 🛠️

### 시각적 매핑

- `idle`: 일반 크리터.
- `workingMain`: 글리프가 있는 배지, 전체 색조, 다리 “작업 중” 애니메이션.
- `workingOther`: 글리프가 있는 배지, 낮은 색조, 빠른 이동 없음.
- `overridden`: 활동과 관계없이 선택한 글리프/색조를 사용합니다.

## 컨텍스트 하위 메뉴

- 루트 메뉴는 세션 수/상태가 포함된 하나의 “컨텍스트” 행을 표시하고 하위 메뉴를 엽니다.
- 컨텍스트 하위 메뉴 헤더는 지난 24시간 동안의 활성 세션 수를 표시합니다.
- 각 세션 행은 토큰 막대, 경과 시간, 미리보기, 생각 중/상세 표시, 재설정, 압축, 삭제 작업을 유지합니다.
- 로딩, 연결 끊김, 세션 로드 오류 메시지는 컨텍스트 하위 메뉴 안에 표시됩니다.
- 공급자 사용량 및 사용량 비용 세부 정보는 컨텍스트 아래의 루트 수준에 유지되어 하위 메뉴를 열지 않아도 한눈에 볼 수 있습니다.

## 상태 행 텍스트(메뉴)

- 작업이 활성 상태인 동안: `<Session role> · <activity label>`
  - 예: `Main · exec: pnpm test`, `Other · read: apps/macos/Sources/OpenClaw/AppState.swift`.
- 유휴 상태일 때: 상태 점검 요약으로 폴백합니다.

## 이벤트 수집

- 소스: 제어 채널 `agent` 이벤트(`ControlChannel.handleAgentEvent`).
- 파싱되는 필드:
  - 시작/중지를 위한 `data.state`가 포함된 `stream: "job"`.
  - `data.phase`, `name`, 선택적 `meta`/`args`가 포함된 `stream: "tool"`.
- 레이블:
  - `exec`: `args.command`의 첫 번째 줄.
  - `read`/`write`: 축약된 경로.
  - `edit`: 경로와 `meta`/diff 개수에서 추론한 변경 종류.
  - 폴백: 도구 이름.

## 디버그 오버라이드

- 설정 ▸ 디버그 ▸ “아이콘 오버라이드” 선택기:
  - `System (auto)`(기본값)
  - `Working: main`(도구 종류별)
  - `Working: other`(도구 종류별)
  - `Idle`
- `@AppStorage("iconOverride")`를 통해 저장되며, `IconState.overridden`으로 매핑됩니다.

## 테스트 체크리스트

- 메인 세션 작업을 트리거: 아이콘이 즉시 전환되고 상태 행에 메인 레이블이 표시되는지 확인합니다.
- 메인이 유휴 상태일 때 비메인 세션 작업을 트리거: 아이콘/상태가 비메인을 표시하며, 완료될 때까지 안정적으로 유지됩니다.
- 다른 세션이 활성 상태일 때 메인을 시작: 아이콘이 즉시 메인으로 전환됩니다.
- 빠른 도구 버스트: 배지가 깜박이지 않는지 확인합니다(도구 결과에 대한 TTL 유예).
- 모든 세션이 유휴 상태가 되면 상태 점검 행이 다시 나타납니다.

## 관련

- [macOS 앱](/ko/platforms/macos)
- [메뉴 막대 아이콘](/ko/platforms/mac/icon)
