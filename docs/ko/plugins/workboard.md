---
read_when:
    - Control UI에서 칸반 스타일 작업 보드를 원합니다
    - 번들된 Workboard Plugin을 활성화하거나 비활성화하는 중입니다
    - 외부 프로젝트 관리자 없이 계획된 에이전트 작업을 추적하려는 경우
summary: '선택 사항인 대시보드 작업 보드: 에이전트 소유 카드 및 세션 인계'
title: Workboard Plugin
x-i18n:
    generated_at: "2026-06-27T17:59:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Plugin은 [Control UI](/ko/web/control-ui)에 선택적 Kanban 스타일 보드를 추가합니다. 에이전트 크기의 작업 카드를 수집하고, 에이전트에 할당하며, 연결된 백그라운드 작업, 실행, 대시보드 세션을 하나의 카드에서 추적하는 데 사용합니다.

Workboard는 의도적으로 작게 설계되었습니다. OpenClaw Gateway의 로컬 운영 작업을 추적하며, GitHub Issues, Linear, Jira 또는 기타 팀 프로젝트 관리 시스템을 대체하지 않습니다.

## 기본 상태

Workboard는 번들 Plugin이며, Plugin 구성에서 활성화하지 않는 한 기본적으로 비활성화되어 있습니다.

다음으로 활성화합니다.

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

그런 다음 대시보드를 엽니다.

```bash
openclaw dashboard
```

Workboard 탭이 대시보드 탐색에 표시됩니다. 탭은 보이지만 Plugin이 비활성화되어 있거나 `plugins.allow` / `plugins.deny`에 의해 차단된 경우, 뷰에는 로컬 카드 데이터 대신 Plugin을 사용할 수 없는 상태가 표시됩니다.

## 카드에 포함되는 내용

각 카드는 다음을 저장합니다.

- 제목 및 메모
- 상태: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked` 또는 `done`
- 우선순위: `low`, `normal`, `high` 또는 `urgent`
- 레이블
- 선택적 에이전트 ID
- 선택적으로 연결된 작업, 실행, 세션 또는 소스 URL
- 카드에서 시작된 Codex 또는 Claude 실행에 대한 선택적 실행 메타데이터
- 시도, 댓글, 링크, 증거, 아티팩트, 자동화, 첨부 파일, 워커 로그, 워커 프로토콜 상태, 클레임, 진단,
  알림, 템플릿, 아카이브 상태, 오래된 세션 감지를 위한 간결한 메타데이터
- 생성, 이동, 연결, 클레임, Heartbeat, 시도, 증거, 아티팩트, 진단, 알림, 디스패치, 아카이브, 오래됨,
  에이전트 업데이트 변경 같은 최근 카드 이벤트

카드는 Plugin의 Gateway 상태에 저장됩니다. 카드는 Gateway 상태 디렉터리에 로컬로 존재하며 해당 Gateway의 나머지 OpenClaw 상태와 함께 이동합니다.

Workboard는 카드별 간결한 메타데이터를 유지하므로 운영자는 연결된 세션을 열지 않고도 카드가 보드를 어떻게 이동했는지 확인할 수 있습니다. 이벤트, 시도 요약, 증거 스니펫, 관련 링크, 댓글, 아카이브 마커, 오래된 세션 마커는 의도적으로 로컬 메타데이터입니다. 이는 세션 트랜스크립트나 GitHub 이슈 기록을 대체하지 않습니다.

## 카드 실행 및 작업

연결되지 않은 카드는 카드에서 작업을 시작할 수 있습니다. 자율 시작은 Gateway의 작업 추적 에이전트 실행 경로를 사용한 다음, Workboard가 결과 작업, 실행 ID, 세션 키를 카드에 다시 연결합니다. 시작은 Gateway에 구성된 기본 에이전트와 모델을 사용합니다. Codex 및 Claude 작업은 선택적 명시 모델 선택입니다.

- Run Codex 또는 Run Claude는 작업 기반 에이전트 실행을 시작하고, 카드 프롬프트를 보내며, 카드를 `running`으로 표시합니다.
- Open Codex 또는 Open Claude는 카드 프롬프트를 보내거나 카드를 이동하지 않고 연결된 대시보드 세션을 생성하므로, 보드에 계속 연결된 상태에서 수동으로 작업할 수 있습니다.

실행 메타데이터는 선택한 엔진, 모드, 모델 참조, 세션 키, 실행 ID, 사용 가능한 경우 작업 ID, 수명 주기 상태를 카드에 저장합니다. Codex 실행은 `openai/gpt-5.5`를 사용하고, Claude 실행은 `anthropic/claude-sonnet-4-6`을 사용합니다.

연결된 각 실행은 동일한 카드 레코드에 시도 요약도 기록합니다. 시도 요약은 엔진, 모드, 모델, 실행 ID, 타임스탬프, 상태, 누적 실패 횟수를 유지하므로 반복 실패가 보드에 계속 표시됩니다.

대시보드는 Gateway 작업 원장에서 작업 상태를 새로 고치고, 작업 ID, 실행 ID 또는 연결된 세션 키로 작업을 카드에 다시 매칭합니다. 작업이 대기 중이거나 실행 중이면 카드 수명 주기는 활성 작업 상태를 표시합니다. 작업이 완료, 실패, 시간 초과 또는 취소되면 카드 수명 주기는 연결된 세션과 동일한 수명 주기 동기화를 사용해 review 또는 blocked 상태로 이동합니다.

## 에이전트 조정

Workboard는 보드 인식 워크플로를 위한 선택적 에이전트 도구도 노출합니다.

- `workboard_list`는 선택적 보드 필터와 함께 클레임 및 진단 상태가 포함된 간결한 카드 목록을 표시합니다.
- `workboard_read`는 메모, 시도, 댓글, 링크, 증거, 아티팩트, 상위 결과, 최근 담당자 작업, 활성 진단에서 구성된 제한된 워커 컨텍스트와 함께 하나의 카드를 반환합니다.
- `workboard_create`는 선택적 상위 항목, 테넌트, Skills, 보드, 워크스페이스 메타데이터, 멱등성 키, 런타임 제한, 재시도 예산을 포함해 카드를 생성합니다.
- `workboard_link`는 상위 카드를 하위 카드에 연결합니다. 하위 카드는 모든 상위 항목이 `done`에 도달할 때까지 `todo`에 머무르며, 이후 디스패치 승격이 이를 `ready`로 이동합니다.
- `workboard_claim`은 호출 에이전트가 카드를 클레임하고 backlog, todo 또는 ready 카드를 `running`으로 이동합니다.
- `workboard_heartbeat`는 긴 실행 중 클레임 Heartbeat를 새로 고칩니다.
- `workboard_release`는 완료, 일시 중지 또는 인계 후 클레임을 해제하며 카드를 다음 상태로 이동할 수 있습니다.
- `workboard_complete` 및 `workboard_block`은 최종 요약, 증거, 아티팩트, 생성된 카드 매니페스트, 차단 사유를 위한 구조화된 수명 주기 도구입니다. 생성된 카드 매니페스트는 완료된 카드에 다시 연결된 카드를 참조해야 하며, 이를 통해 요약에서 유령 하위 카드가 제외됩니다.
- `workboard_attachment_add`, `workboard_attachment_read`, `workboard_attachment_delete`는 작은 카드 첨부 파일을 Plugin SQLite 상태에 저장하고, 카드에 인덱싱하며, 워커 컨텍스트에 노출합니다.
- `workboard_worker_log` 및 `workboard_protocol_violation`은 워커 로그 줄을 기록하고, 자동화된 워커가 `workboard_complete` 또는 `workboard_block`을 호출하지 않고 중지되면 카드를 차단합니다.
- `workboard_board_create`, `workboard_board_archive`, `workboard_board_delete`는 표시 이름, 설명, 아카이브 상태, 기본 워크스페이스 같은 지속 보드 메타데이터를 관리합니다.
- `workboard_runs`는 카드에 저장된 지속 실행 시도 기록을 반환합니다.
- `workboard_specify`는 대략적인 triage 또는 backlog 카드를 명확해진 `todo` 카드로 전환하고, 사양 요약을 카드에 기록합니다.
- `workboard_decompose`는 상위 오케스트레이션 카드를 연결된 하위 카드로 펼치고, 보드 및 테넌트 메타데이터를 상속하며, 생성된 카드 매니페스트로 상위 카드를 완료할 수 있습니다.
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance`, `workboard_notify_unsubscribe`는 Plugin 상태의 알림 구독을 관리합니다. 이벤트 읽기는 재생에 안전하며, advance 도구는 내구성 있는 커서를 이동시켜 호출자가 완료, 실패 또는 오래된 카드 이벤트를 잃거나 중복으로 읽지 않고 재개할 수 있게 합니다.
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock`, `workboard_dispatch`를 통해 에이전트는 보드 네임스페이스를 검사하고, 큐 통계를 보고, 멈춘 작업을 복구하고, 인계 메모를 추가하고, 증거 또는 아티팩트 참조를 첨부하고, 차단된 작업을 `todo`로 되돌리며, 의존성 승격 또는 오래된 클레임 정리를 유도할 수 있습니다.

클레임된 카드는 호출자가 `workboard_claim`에서 반환된 클레임 토큰을 가지고 있지 않은 한 다른 에이전트의 에이전트 도구 변경을 거부합니다. 대시보드 운영자는 여전히 일반 Gateway RPC 표면을 사용하며 카드를 복구하거나 재할당할 수 있습니다.

Workboard는 OpenClaw 상태 디렉터리 아래 Plugin 소유 관계형 SQLite 데이터베이스에 내구성 있는 보드 데이터를 저장합니다. 보드, 카드, 레이블, 수명 주기 이벤트, 실행 시도, 댓글, 의존성 링크, 증거, 아티팩트 참조, 첨부 파일 메타데이터 및 Blob, 진단, 알림, 워커 로그, 프로토콜 상태, 구독은 Plugin 키-값 항목 대신 Workboard 테이블에 지속됩니다. 카드 내보내기는 여전히 첨부 파일 Blob 내용을 인라인하지 않고 보드 내러티브를 보존합니다.

`.28` 릴리스에서 Workboard를 사용한 설치는 `openclaw doctor --fix`를 실행해 배포된 레거시 Plugin 상태 네임스페이스(`workboard.cards`, `workboard.boards`, `workboard.notify`)를 관계형 데이터베이스로 마이그레이션할 수 있습니다. 레거시 `workboard.attachments` 네임스페이스가 있으면 doctor는 해당 첨부 파일 Blob도 마이그레이션합니다.

Workboard 진단은 로컬 카드 메타데이터에서 계산됩니다. 기본 제공 검사는 너무 오래 대기하는 할당된 카드, 최근 Heartbeat가 없는 실행 중 카드, 주의가 필요한 차단된 카드, 반복 실패, 증거 없는 완료 카드, 느슨한 세션 링크만 있는 실행 중 카드를 표시합니다.

디스패치는 의도적으로 Gateway 로컬입니다. 임의의 운영 체제 프로세스를 생성하지 않으며, 일반 OpenClaw 하위 에이전트 세션이 계속 실행을 소유합니다. 디스패치 작업은 의존성이 준비된 카드를 승격하고, ready 카드에 디스패치 메타데이터를 기록하고, 만료된 클레임 또는 시간 초과된 실행을 차단하고, 보드에 구성된 triage 카드를 오케스트레이션 후보로 표시한 다음, ready 카드의 작은 배치를 클레임하고 Gateway 하위 에이전트 런타임을 통해 워커 실행을 시작합니다. 할당된 카드는 `agent:<id>:subagent:workboard-*` 워커 세션 키를 사용하고, 할당되지 않은 카드는 범위가 지정되지 않은 `subagent:workboard-*` 키를 사용하므로 Gateway가 여전히 구성된 기본 에이전트를 확인합니다. 워커는 제한된 카드 컨텍스트와 함께 Workboard 도구를 통해 카드에 Heartbeat를 보내거나, 완료하거나, 차단하는 데 필요한 클레임 토큰을 받습니다.

### 디스패치 워커 선택

각 디스패치 패스는 기본적으로 최대 3개의 워커를 시작합니다. Ready 카드는 우선순위, 위치, 생성 시간순으로 정렬된 다음, 중복된 활성 소유권을 피하도록 필터링됩니다. 디스패치는 동일한 패스에서 특정 소유자 또는 에이전트에 대해 하나의 카드만 시작하며, 보드에 이미 running 또는 review 작업이 있는 소유자는 건너뜁니다.

아카이브된 카드, 활성 클레임이 있는 카드, `ready` 상태가 아닌 카드는 워커 시작 대상으로 선택되지 않습니다. 오래된 클레임, 의존성 승격 또는 시간 초과 정리가 적용되는 경우에는 여전히 디스패치의 데이터 측면에 영향을 받을 수 있습니다.

### 워커 프롬프트 및 수명 주기

워커 프롬프트에는 카드 제목, 제한된 메모 및 컨텍스트, 할당된 보드, Workboard 워커 프로토콜이 포함됩니다. 또한 클레임 소유자와 클레임 토큰이 포함되어 워커가 다른 행위자가 카드를 가져가지 않고 `workboard_heartbeat`, `workboard_complete` 또는 `workboard_block`을 호출할 수 있습니다.

워커가 성공적으로 시작되면 Workboard는 세션 키, 실행 ID, 엔진, 모드, 모델 레이블, 상태, 워커 로그를 카드에 저장합니다. 세션 키는 보드와 카드에 대해 결정적이므로, 반복 디스패치가 관련 없는 세션을 생성하는 대신 동일한 워커 레인으로 다시 라우팅됩니다.

카드가 클레임된 후 워커를 시작할 수 없으면 Workboard는 카드를 차단하고, 클레임을 지우고, 실행 시작 실패를 기록하며, 워커 로그 줄을 추가합니다. 해당 실패는 대시보드, CLI JSON, 에이전트 도구, 카드 진단에서 볼 수 있습니다.

### 디스패치 진입점

Ready 카드 워커 시작은 다음에서 발생할 수 있습니다.

- 대시보드 디스패치 작업
- `openclaw workboard dispatch`
- 명령을 지원하는 채널의 `/workboard dispatch`

세 진입점은 모두 Gateway를 사용할 수 있을 때 Gateway 하위 에이전트 런타임을 사용합니다. CLI에는 하나의 추가 운영자 폴백이 있습니다. Gateway가 오프라인이거나 Workboard 디스패치 메서드를 노출하지 않고 명시적 `--url` 또는 `--token` 대상이 제공되지 않은 경우, 로컬 SQLite 상태에 대해 데이터 전용 디스패치를 실행합니다. 이 폴백은 의존성을 승격하고, 오래된 클레임을 정리하고, 시간 초과된 실행을 차단할 수 있지만 워커를 시작할 수는 없습니다.

보드 메타데이터에는 `autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee`, `orchestratorProfile` 같은 오케스트레이션 설정이 포함될 수 있습니다. OpenClaw는 오케스트레이션 의도를 기록하고 워커 컨텍스트에 노출합니다. 실제 사양화 및 분해는 여전히 일반 Workboard 도구를 통해 수행됩니다.

## CLI 및 슬래시 명령

Plugin은 루트 CLI 명령을 등록합니다.

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch`는 실행 중인 Gateway를 호출하여 worker 시작이 대시보드와 동일한 하위 에이전트 런타임을 사용하게 합니다. Gateway를 사용할 수 없으면 데이터 전용 디스패치로 대체되어 dependency promotion, stale-claim cleanup, timeout blocking이 계속 실행될 수 있습니다. 인증, 권한, 검증 실패는 명령 오류로 계속 표시되며, 명시적 `--url` 또는 `--token` 대상의 실패도 마찬가지입니다.

`/workboard` 슬래시 명령은 동일한 간결한 운영자 경로를 지원합니다:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`, 그리고
`/workboard dispatch`. list와 show는 승인된 명령 발신자를 위한 읽기 작업입니다. create와 dispatch는 채팅 화면에서 소유자 상태이거나 `operator.write` 또는 `operator.admin`이 있는 Gateway 클라이언트가 필요합니다.

명령 플래그, JSON 출력, Gateway 대체 동작, 모호하지 않은 ID 접두사 처리, 디스패치 선택 규칙, 문제 해결은 [Workboard CLI](/ko/cli/workboard)를 참조하세요.

## 세션 수명 주기 동기화

카드는 기존 대시보드 세션이나 카드에서 작업을 시작할 때 생성된 세션에 연결할 수 있습니다. 연결된 카드는 세션 수명 주기를 인라인으로 표시합니다:
실행 중, 오래됨, 연결된 유휴, 완료, 실패 또는 누락.

연결된 세션이 누락된 경우, 카드는 컨텍스트를 위해 연결 상태를 유지하며 새 대시보드 세션에서 작업을 다시 시작할 수 있도록 시작 컨트롤도 계속 제공합니다.
활성 연결 세션이 최근 활동 보고를 중단하면 Workboard는 카드를 오래됨으로 표시하고, 수명 주기가 이를 해제할 때까지 해당 표시를 카드 메타데이터로 저장합니다.

세션 탭에서 Workboard에 추가를 사용해 기존 대시보드 세션을 캡처할 수도 있습니다. 카드는 해당 세션에 연결되고, 세션 레이블 또는 최근 사용자 프롬프트를 제목으로 사용하며, 채팅 기록을 사용할 수 있을 때 최근 사용자 프롬프트와 최신 assistant 응답으로 노트를 채웁니다.

카드가 아직 활성 작업 상태에 있는 동안 Workboard는 연결된 세션을 따라갑니다:

- 활성 연결 세션 -> `running`
- 완료된 연결 세션 -> `review`
- 실패, 강제 종료, 시간 초과 또는 중단된 연결 세션 -> `blocked`

수동 검토 상태가 우선합니다. 카드를 `review`, `blocked` 또는 `done`으로 이동하면, Workboard는 해당 카드를 `todo` 또는 `running`으로 다시 이동할 때까지 자동 이동을 중지합니다.

## 대시보드 워크플로

1. Control UI에서 Workboard 탭을 엽니다.
2. 제목, 노트, 우선순위, 레이블, 선택적 agent, 선택적 연결 세션으로 카드를 만듭니다.
3. 또는 세션을 열고 기존 세션에 대해 Workboard에 추가를 선택합니다.
4. 카드를 열 사이로 드래그하거나 카드의 간결한 상태 컨트롤에 포커스한 뒤 메뉴 또는 ArrowLeft/ArrowRight를 사용합니다.
5. 카드에서 작업을 시작해 대시보드 세션을 만들거나 재사용합니다.
6. agent가 작업하는 동안 카드에서 연결된 세션을 엽니다.
7. 수명 주기 동기화가 실행 중인 작업을 review 또는 blocked로 이동하게 한 다음, 승인되면 카드를 수동으로 done으로 이동합니다.

카드를 시작하면 일반 Gateway 세션이 사용됩니다. Workboard Plugin은 카드 메타데이터와 링크만 저장합니다. 대화 transcript, 모델 선택, 실행 수명 주기는 일반 세션 시스템이 계속 소유합니다.

실시간 연결 카드에서 중지를 사용해 활성 세션 실행을 중단합니다. Workboard는 해당 카드를 `blocked`로 표시하여 후속 조치를 위해 계속 보이게 합니다.

새 카드는 버그 수정, 문서, 릴리스, PR 검토 또는 Plugin 작업용 Workboard 템플릿에서 시작할 수 있습니다. 템플릿은 제목, 노트, 레이블, 우선순위를 미리 채우며, 선택한 템플릿 ID는 카드 메타데이터로 저장됩니다.

## 권한

Plugin은 `workboard.*` 네임스페이스 아래에 Gateway RPC 메서드를 등록합니다:

- `workboard.cards.list`에는 `operator.read`가 필요합니다.
- `workboard.cards.export`에는 `operator.read`가 필요합니다.
- `workboard.cards.diagnostics`에는 `operator.read`가 필요합니다.
- `workboard.cards.diagnostics.refresh`에는 `operator.write`가 필요합니다.
- attachment list/get 및 notification event 읽기에는 `operator.read`가 필요합니다.
- notification cursor advancement에는 `operator.write`가 필요합니다.
- create, update, move, delete, comment, link, dependency link, proof, artifact,
  attachment add/delete, worker log, protocol violation, claim, heartbeat,
  release, complete, block, unblock, dispatch, bulk, archive 메서드에는
  `operator.write`가 필요합니다.

읽기 전용 operator 접근으로 연결된 브라우저는 보드를 검사할 수 있지만 카드를 변경할 수는 없습니다.

## 구성

현재 Workboard에는 Plugin별 구성이 없습니다. 표준 Plugin 항목으로 활성화하거나 비활성화하세요:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

다음으로 다시 비활성화합니다:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## 문제 해결

### 탭에 Workboard를 사용할 수 없다고 표시됨

Plugin 정책을 확인하세요:

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow`가 구성되어 있으면 해당 허용 목록에 `workboard`를 추가하세요. `plugins.deny`에 `workboard`가 포함되어 있으면 Plugin을 활성화하기 전에 제거하세요.

### 카드가 저장되지 않음

브라우저 연결에 `operator.write` 접근 권한이 있는지 확인하세요. 읽기 전용 operator 세션은 카드를 나열할 수 있지만 만들기, 편집, 이동 또는 삭제는 할 수 없습니다.

### 카드를 시작해도 예상한 세션이 열리지 않음

Workboard는 일반 대시보드 세션에 대한 링크를 만듭니다. 카드의 agent ID와 연결된 세션을 확인한 다음, 세션 또는 채팅 보기를 열어 실제 실행 상태를 검사하세요.

### 디스패치가 worker를 시작하지 않음

활성 claim이 없는 `ready` 카드가 하나 이상 있는지 확인하세요:

```bash
openclaw workboard list --status ready
```

CLI가 데이터 전용 디스패치를 보고하면 Gateway를 시작하거나 다시 시작한 뒤 재시도하세요.
데이터 전용 디스패치는 로컬 보드 상태를 업데이트하지만 하위 에이전트 worker 실행을 시작할 수는 없습니다.

같은 소유자 또는 agent의 다른 카드가 이미 실행 중이거나 검토를 기다리는 경우에도 카드를 건너뛸 수 있습니다. 같은 소유자에 대한 추가 작업을 디스패치하기 전에 해당 활성 작업을 완료, 차단 또는 해제하세요.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [Workboard CLI](/ko/cli/workboard)
- [Plugin](/ko/tools/plugin)
- [Plugin 관리](/ko/plugins/manage-plugins)
- [세션](/ko/concepts/session)
