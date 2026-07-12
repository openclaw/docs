---
read_when:
    - Mac 메뉴 UI 또는 상태 로직 조정하기
summary: 메뉴 막대 상태 로직 및 사용자에게 표시되는 정보
title: 메뉴 막대
x-i18n:
    generated_at: "2026-07-12T15:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 480a85f383a6495c0e45850a322c0c67c4cc35e21d2d29b4bd86f42fdbf9430a
    source_path: platforms/mac/menu-bar.md
    workflow: 16
---

## 표시되는 내용

- 현재 에이전트의 작업 상태는 메뉴 막대 아이콘과 메뉴의 첫 번째 상태 행에 표시됩니다.
- 작업이 진행 중인 동안에는 상태 점검 정보가 숨겨지며, 모든 세션이 유휴 상태가 되면 다시 표시됩니다.
- 루트의 "컨텍스트" 항목은 최근 세션을 루트 메뉴에 펼치는 대신 하위 메뉴로 엽니다.
- 루트 메뉴의 "노드" 블록에는 클라이언트/프레즌스 항목이 아닌 페어링된 **기기**만 (`node.list`에서 가져와) 표시됩니다.
- 제공자 사용량 스냅샷을 사용할 수 있으면 루트의 "컨텍스트" 아래에 "사용량" 섹션이 나타나며, 비용 세부 정보를 사용할 수 있으면 그 뒤에 표시됩니다.

## 상태 모델

- 소스: `WorkActivityStore` (`apps/macos/Sources/OpenClaw/WorkActivityStore.swift`).
- 이벤트는 `runId`가 포함된 `ControlAgentEvent`로 도착합니다. 핸들러 (`ControlChannel.routeWorkActivity`)는 이벤트 페이로드에서 `sessionKey`를 읽고, 없으면 기본값으로 `"main"`을 사용합니다.
- 우선순위: 메인 세션(기본적으로 `sessionKey == "main"`)이 항상 우선합니다. 메인 세션이 활성 상태이면 해당 상태가 즉시 표시됩니다. 메인 세션이 유휴 상태이면 가장 최근에 활성화된 비메인 세션이 대신 표시됩니다. 저장소는 활동 도중에는 전환하지 않으며, 현재 세션이 유휴 상태가 되거나 메인 세션이 활성화될 때만 전환합니다.
- 활동 종류:
  - `job`: 상위 수준 명령 실행 (`state: started|streaming|done|error|...`).
  - `tool`: `name` 및 선택적 `meta`/`args`가 포함된 `phase: start|result`.

## IconState 열거형 (Swift)

- `idle`
- `workingMain(ActivityKind)`
- `workingOther(ActivityKind)`
- `overridden(ActivityKind)` (디버그 재정의)

### ActivityKind -> 배지 기호

`ActivityKind`는 `ToolKind` (`bash`, `read`, `write`, `edit`, `attach`, `other`) 또는 단독 `job`을 래핑합니다. 각각은 크리터 아이콘 위에 그려지는 SF Symbol 배지 (`IconState.badgeSymbolName`)에 매핑됩니다.

| 종류            | 기호                               |
| --------------- | ---------------------------------- |
| `bash`          | `chevron.left.slash.chevron.right` |
| `read`          | `doc`                              |
| `write`         | `pencil`                           |
| `edit`          | `pencil.tip`                       |
| `attach`        | `paperclip`                        |
| `other` / `job` | `gearshape.fill`                   |

### 시각적 매핑

- `idle`: 일반 크리터이며 배지가 없습니다.
- `workingMain`: 기호가 있는 배지, 전체 틴트 (`.primary` 강조도), 다리의 "작업 중" 애니메이션을 사용합니다.
- `workingOther`: 기호가 있는 배지, 약한 틴트 (`.secondary` 강조도)를 사용하며 빠르게 움직이는 애니메이션은 없습니다.
- `overridden`: 실제 활동과 관계없이 선택한 기호/틴트를 사용합니다.

## 컨텍스트 하위 메뉴

- 루트 메뉴에는 세션 수/상태가 표시된 하나의 "컨텍스트" 행이 있으며, 이 행에서 하위 메뉴(`MenuSessionsInjector`)가 열립니다.
- 하위 메뉴 헤더에는 지난 24시간 동안의 활성 세션 수가 표시됩니다.
- 각 세션 행은 토큰 표시줄, 경과 시간, 미리보기, 사고/상세 출력 전환, 재설정, 압축 및 삭제 동작을 그대로 유지합니다.
- 로딩 중, 연결 끊김 및 세션 로드 오류 메시지는 컨텍스트 하위 메뉴 안에 표시됩니다.
- 사용량 및 비용 섹션은 컨텍스트 아래의 루트 수준에 유지되므로 하위 메뉴를 열지 않고도 한눈에 확인할 수 있습니다.

## 상태 행 텍스트(메뉴)

- 작업이 진행 중일 때: `<Session role> · <activity label>`(`MenuContentView`에서는 `"\(roleLabel) · \(activity.label)"`)이며, 역할 레이블은 `Main` 또는 `Other`입니다.
- 유휴 상태일 때: 상태 요약으로 대체됩니다.

## 이벤트 수집

- 소스: `ControlChannel.routeWorkActivity(from:)`에서 라우팅되는 제어 채널 `agent` 이벤트입니다.
- 파싱되는 필드:
  - 시작/중지 상태를 나타내는 `data.state`가 포함된 `stream: "job"`입니다.
  - `data.phase`, `data.name` 및 선택적 `data.meta`/`data.args`가 포함된 `stream: "tool"`입니다.
- 도구 레이블은 `ToolDisplayRegistry.resolve(name:args:meta:)`에서 가져오며, 이름을 확인할 수 없으면 원시 도구 이름을 대신 사용합니다.

## 디버그 재정의

- Settings > Debug > "Icon override" 선택기:
  - `System (auto)`(기본값)
  - `Working: main` / `Working: other`(도구 종류별: bash, read, write, edit, other)
  - `Idle`
- `UserDefaults` 키 `openclaw.iconOverride`에 저장되며 `IconState.overridden`에 매핑됩니다.

## 테스트 체크리스트

- 기본 세션 작업을 트리거합니다. 아이콘이 즉시 전환되고 상태 행에 기본 세션 레이블이 표시됩니다.
- 기본 세션이 유휴 상태일 때 기본 세션이 아닌 세션 작업을 트리거합니다. 아이콘과 상태에 기본 세션이 아닌 세션이 표시되며, 작업이 완료될 때까지 안정적으로 유지됩니다.
- 다른 세션이 활성 상태일 때 기본 세션을 시작합니다. 아이콘이 즉시 기본 세션으로 전환됩니다.
- 빠른 도구 연속 실행 시 배지가 깜박이지 않습니다(완료된 도구를 지우기 전 2초 유예 시간, `WorkActivityStore.toolResultGrace`).
- 모든 세션이 유휴 상태가 되면 상태 확인 행이 다시 나타납니다.

## 관련 항목

- [macOS 앱](/ko/platforms/macos)
- [메뉴 막대 아이콘](/ko/platforms/mac/icon)
