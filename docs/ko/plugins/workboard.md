---
read_when:
    - Control UI에 칸반 스타일 작업 보드를 원합니다
    - 번들로 제공되는 Workboard Plugin을 활성화하거나 비활성화하고 있습니다
    - 외부 프로젝트 관리자 없이 계획된 에이전트 작업을 추적하려고 합니다
summary: 에이전트 소유 카드 및 세션 인계를 위한 선택적 대시보드 작업 보드
title: Workboard Plugin
x-i18n:
    generated_at: "2026-07-16T12:58:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 607c6db4a7c038aa12b7db8f881635683871675bc6ef31686cc8b05853fb0701
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard plugin은
[Control UI](/ko/web/control-ui)에 선택적으로 사용할 수 있는 칸반 스타일 보드를 추가합니다. 여기에는 에이전트 단위의 작업 카드, 에이전트 할당,
카드의 태스크, 실행 및 대시보드 세션으로 돌아가는 링크가 포함됩니다.

Workboard는 의도적으로 작게 설계되었습니다. 하나의
OpenClaw Gateway에서 로컬 운영 작업을 추적합니다. GitHub Issues, Linear, Jira 또는
기타 팀 프로젝트 관리 시스템을 대체하지 않습니다.

## 활성화

Workboard는 번들로 제공되지만 기본적으로 비활성화되어 있습니다.

1. Control UI에서 **Plugins**를 열거나, 구성된 Control UI 기본 경로를 기준으로 `/settings/plugins`을 사용하십시오.
   예를 들어 기본 경로가 `/openclaw`이면
   `/openclaw/settings/plugins`을 사용합니다.
2. **Workboard**를 찾아 **Enable**을 선택하십시오. Workboard는
   OpenClaw에 포함되어 있으므로 **Install** 작업이 필요하지 않습니다.
3. UI에서 재시작이 필요하다고 표시되면 Gateway를 재시작하십시오.

plugin 런타임이 로드되면 대시보드 탐색 메뉴에 Workboard 탭이 표시됩니다.
비활성화된 동안에는 탭이 탐색 메뉴에서 숨겨집니다. plugin이 비활성화되어 있거나
`plugins.allow`/`plugins.deny`에 의해 차단된 상태에서
`/workboard` 경로를 직접 열면 카드 데이터 대신 plugin을 사용할 수 없음 상태가
표시됩니다.

동일한 CLI 워크플로는 다음과 같습니다.

```bash
openclaw plugins enable workboard
openclaw gateway restart
openclaw dashboard
```

## 구성

Workboard에는 plugin별 구성이 없습니다. 표준
plugin 항목으로 활성화하거나 비활성화하십시오.

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

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## 카드 필드

| 필드        | 값                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `status`    | `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`                     |
| `priority`  | `low`, `normal`, `high`, `urgent`                                                                             |
| `labels`    | 자유 형식 문자열                                                                                              |
| `agentId`   | 선택적으로 할당된 에이전트                                                                                    |
| 연결된 참조 | 선택적 태스크, 실행, 세션 또는 소스 URL                                                                        |
| `execution` | 카드에서 시작된 Codex/Claude 실행의 선택적 메타데이터(엔진, 모드, 모델, 세션, 실행 ID, 상태) |

카드에는 시도, 댓글, 링크, 증명,
아티팩트, 자동화 설정, 첨부 파일, 워커 로그, 워커 프로토콜
상태, 클레임, 진단, 알림, 템플릿 ID, 보관 상태 및
오래된 세션 감지를 위한 간결한 메타데이터와 최근 이벤트 목록(`created`, `edited`,
`moved`, `linked`, `specified`, `decomposed`, `claimed`, `heartbeat`,
`execution_updated`, `attempt_started`, `attempt_updated`, `comment_added`,
`link_added`, `proof_added`, `artifact_added`, `attachment_added`,
`diagnostic`, `notification`, `dispatch`, `orchestration`,
`protocol_violation`, `archived`, `unarchived`, `stale`)도 포함됩니다. 이 메타데이터를 통해
운영자는 연결된 세션을 열지 않고도 카드가 보드에서 어떻게 이동했는지 확인할 수 있습니다.
이는 로컬 운영 컨텍스트이며 세션
트랜스크립트나 GitHub 이슈 기록을 대체하지 않습니다.

plugin과 Control UI는 하나의 Workboard 카드 계약을 사용합니다. 따라서 대시보드를 새로 고쳐도
카드의 더 작은 UI 전용 복사본으로 투영하는 대신 워크스페이스 출처 및 권한, 클레임 상태, 진단
작업, 알림 시퀀스 번호가 유지됩니다. 알 수 없는 진단 종류, 진단 심각도 및
알림 종류는 두 표면에서 모두 지원될 때까지 무시되며, 다른 유효한 상태로
다시 작성되지 않습니다.

열려 있는 대시보드는 `plugin.workboard.changed` 무효화 이벤트에 따라 업데이트됩니다. 각
이벤트에는 저장소 epoch와 revision만 포함되며, 이후 UI는 일반 `operator.read` RPC를 통해 정규
카드를 다시 읽습니다. 여러 revision은 하나의 후속 읽기로 병합됩니다.
Workboard는 카드를 드래그하거나 편집하거나 쓰는 동안 해당 읽기를 연기한 다음,
로컬 상호작용이 끝나면 재개합니다. 다시 연결할 때는 항상 정규 데이터를 다시 로드합니다. 정기적인 전체 카드
폴링은 없으며, 수동 복구를 위한 **Refresh**는 계속 사용할 수 있습니다.

보드가 둘 이상이면 도구 모음에 현재 표시된 카드뿐만 아니라
영구 저장된 보드 메타데이터를 기반으로 하는 **Board** 필터가 포함됩니다. 따라서 비어 있거나
보관된 보드도 계속 선택할 수 있습니다. 명시적인
보드 ID가 없는 카드는 정규 `default` 보드에 속합니다. 선택한 보드는
`?board=` 쿼리 매개변수에 저장되므로 필터링된 Workboard URL을 북마크하거나
공유할 수 있습니다. **All boards**를 선택하면 해당 매개변수가 제거됩니다.

카드는 plugin 자체의 Gateway 상태에 저장되며 해당 Gateway의 나머지
OpenClaw 상태와 함께 이동합니다([저장소](#storage) 참조).

## 카드에서 작업 시작

연결되지 않은 카드에서 직접 작업을 시작할 수 있습니다.

- **Run Codex** / **Run Claude**는 명시적인 엔진으로 태스크 추적 에이전트 실행을 시작하고,
  카드 프롬프트를 전송한 후 카드를 `running`으로 표시합니다. Codex
  실행은 `openai/gpt-5.6-sol`을 사용하고 Claude 실행은 `anthropic/claude-sonnet-4-6`을 사용합니다.
- **Open Codex** / **Open Claude**는 카드 프롬프트를 전송하거나
  카드를 이동하지 않고 연결된 대시보드 세션을 생성하여, 보드에 계속
  연결된 수동 작업을 수행할 수 있게 합니다.

자동 시작은 Gateway의 태스크 추적 에이전트 실행 경로를 사용합니다(Codex/Claude를 명시적으로 선택하지 않으면 기본 에이전트
및 모델 사용). 이후 Workboard는 생성된 태스크, 실행 ID 및 세션 키를
카드에 다시 연결합니다. 연결된 각 실행에는 시도 요약(엔진, 모드, 모델, 실행 ID,
타임스탬프, 상태, 누적 실패 횟수)도 기록되므로 반복되는 실패를 계속 확인할 수 있습니다.

대시보드는 Gateway 태스크 원장에서 태스크 상태를 새로 고치며,
태스크 ID, 실행 ID 또는 연결된 세션 키를 기준으로 태스크를 카드와 일치시킵니다. 대기 중이거나 실행 중인
태스크는 카드의 수명 주기를 활성 상태로 유지합니다. 완료, 실패, 시간 초과 또는
취소된 태스크는 연결된 세션과 동일한 동기화
규칙에 따라 카드를 `review` 또는 `blocked` 쪽으로 이동합니다([세션 수명 주기 동기화](#session-lifecycle-sync) 참조).

## 에이전트 도구

| 도구                                                                                                                                             | 용도                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `workboard_list`                                                                                                                                 | 클레임/진단 상태가 포함된 간결한 카드를 나열합니다. 선택적으로 보드 필터를 사용할 수 있습니다.                                                                                                                    |
| `workboard_read`                                                                                                                                 | 카드 하나와 제한된 작업자 컨텍스트(메모, 시도, 댓글, 링크, 증명, 아티팩트, 상위 결과, 최근 담당자 작업, 활성 진단)를 반환합니다.                               |
| `workboard_create`                                                                                                                               | 선택적 상위 카드, 테넌트, Skills, 보드, 작업 공간 메타데이터, 멱등성 키, 런타임 제한, 재시도 예산을 사용하여 카드를 생성합니다.                                                             |
| `workboard_link`                                                                                                                                 | 상위 카드를 하위 카드에 연결합니다. 모든 상위 카드가 `done`에 도달할 때까지 하위 카드는 `todo` 상태로 유지되며, 이후 디스패치 승격으로 `ready`로 이동합니다.                                                     |
| `workboard_claim`                                                                                                                                | 호출 에이전트가 카드를 클레임합니다. `backlog`/`todo`/`ready`을 `running`로 이동합니다.                                                                                                        |
| `workboard_heartbeat`                                                                                                                            | 장시간 실행 중에 클레임 Heartbeat를 갱신합니다.                                                                                                                                          |
| `workboard_release`                                                                                                                              | 완료, 일시 중지 또는 인계 후 클레임을 해제합니다. 카드를 다음 상태로 이동할 수도 있습니다.                                                                                                |
| `workboard_complete` / `workboard_block`                                                                                                         | 최종 요약, 증명, 아티팩트, 생성된 카드 매니페스트(완료된 카드로 다시 연결된 카드를 참조해야 함) 또는 차단 사유를 위한 구조화된 수명 주기 도구입니다.                 |
| `workboard_attachment_add` / `workboard_attachment_read` / `workboard_attachment_delete`                                                         | 작은 카드 첨부 파일을 Plugin SQLite 상태에 저장하고, 카드에 인덱싱하며, 작업자 컨텍스트에 노출합니다.                                                                                         |
| `workboard_worker_log` / `workboard_protocol_violation`                                                                                          | 작업자 로그 행을 기록하고, 자동화된 작업자가 `workboard_complete`/`workboard_block`을 호출하지 않고 중지되면 카드를 차단합니다.                                                           |
| `workboard_board_create` / `workboard_board_archive` / `workboard_board_delete`                                                                  | 영구 보드 메타데이터(표시 이름, 설명, 보관 상태, 기본 작업 공간)를 관리합니다.                                                                                            |
| `workboard_runs`                                                                                                                                 | 카드의 영구 실행 시도 기록을 반환합니다.                                                                                                                                      |
| `workboard_specify`                                                                                                                              | 대략적인 분류/백로그 카드를 명확하게 정리된 `todo` 카드로 전환하고, 명세 요약을 카드에 기록합니다.                                                                                      |
| `workboard_decompose`                                                                                                                            | 상위 오케스트레이션 카드를 연결된 하위 카드로 분할하며 보드/테넌트 메타데이터를 상속합니다. 생성된 카드 매니페스트와 함께 상위 카드를 완료할 수 있습니다.                                             |
| `workboard_notify_subscribe` / `workboard_notify_list` / `workboard_notify_events` / `workboard_notify_advance` / `workboard_notify_unsubscribe` | 알림 구독을 관리합니다. 이벤트 읽기는 재실행에 안전하며, `advance`은 영구 커서를 이동하여 호출자가 완료/실패/부실 카드 이벤트를 누락하거나 중복으로 읽지 않고 재개할 수 있도록 합니다. |
| `workboard_boards` / `workboard_stats`                                                                                                           | 보드 네임스페이스와 대기열 통계를 검사합니다.                                                                                                                                                 |
| `workboard_promote` / `workboard_reassign` / `workboard_reclaim`                                                                                 | 정체된 작업을 복구하거나 인계합니다.                                                                                                                                                           |
| `workboard_comment` / `workboard_proof`                                                                                                          | 인계 메모를 추가하거나 증명/아티팩트 참조를 첨부합니다.                                                                                                                                    |
| `workboard_unblock`                                                                                                                              | 차단된 작업을 `todo`로 되돌립니다.                                                                                                                                                         |
| `workboard_move`                                                                                                                                 | 카드를 다른 상태로 이동합니다. 클레임된 카드는 호출자의 에이전트 클레임 범위가 필요합니다.                                                                                                      |
| `workboard_dispatch`                                                                                                                             | 작업자를 시작하지 않고 종속성 승격 또는 부실 클레임 정리를 촉진합니다. 작업자 시작에는 Gateway 또는 슬래시 명령 디스패치를 사용합니다.                                                        |

클레임된 카드는 호출자가 `workboard_claim`에서 반환된 클레임 토큰을
보유하지 않는 한 다른 에이전트의 에이전트 도구 변경을 거부합니다. 에이전트
도구 또는 Gateway RPC 호출에서 반환되는 모든 카드는 `metadata.claim.token`을
`[redacted]`로 숨깁니다(토큰 자체는 `workboard_claim`에서만 최상위
수준으로 한 번 반환됨). 따라서 대시보드 운영자와 다른 에이전트는 사용 가능한
토큰을 전혀 보지 않고도 클레임 상태를 검사할 수 있습니다. 복구는 토큰이
필요하지 않은 `workboard_promote`/`workboard_reassign`/`workboard_reclaim`을
통해 수행됩니다.

## 디스패치

디스패치는 Gateway 로컬에서 수행되며 임의의 OS 프로세스를 생성하지 않습니다.
일반 OpenClaw 하위 에이전트 세션이 계속 실행을 담당합니다. 한 번의 디스패치 패스는
다음을 수행합니다.

1. 종속성이 준비된 카드를 승격합니다.
2. 준비된 카드에 디스패치 메타데이터를 기록합니다.
3. 만료된 클레임 또는 시간 초과된 실행을 차단합니다.
4. 보드에 구성된 분류 카드를 오케스트레이션 후보로 표시합니다.
5. 준비된 카드의 소규모 배치를 클레임하고 Gateway 하위 에이전트
   런타임을 통해 작업자 실행을 시작합니다.

작업자는 제한된 카드 컨텍스트와 Workboard 도구를 통해 Heartbeat를 보내고
카드를 완료하거나 차단하는 데 필요한 클레임 토큰을 받습니다.

작업 공간 경로는 호출자의 기존 파일 시스템 권한을 따릅니다. `operator.write`이
있는 Gateway 클라이언트는 구성된 에이전트 작업 공간을 사용할 수 있으며,
`operator.admin` 클라이언트는 다른 호스트 체크아웃을 사용할 수 있습니다.
샌드박스형 에이전트 도구는 해당 샌드박스의 작업 공간 접근 권한을 사용하고,
샌드박스가 적용되지 않은 작업 공간 전용 도구는 구성된 작업 공간 루트를
사용합니다. Workboard는 작업 공간이 할당될 때 해당 권한을 기록하고 디스패치 시
현재 호출자의 권한과 다시 교차 적용하므로, 영구 저장된 카드가 이후 호출자의
접근 권한을 확장할 수 없습니다. 명시적인 호스트 작업 공간은 있지만 기록된
권한이 없는 이전 카드는 전체 호스트 디스패치 전에 해당 작업 공간을 다시
저장해야 합니다. 호스트 경로가 없는 카드는 처음 디스패치될 때 현재 호출자의
권한을 채택합니다.

작업 공간 바인딩 디스패치는 저장소 루트가 대상 에이전트 작업 공간과 정확히
일치하는 경우에만 디렉터리 또는 Git 체크아웃을 허용합니다. worktree 요청은
해당 디렉터리로 범위가 좁혀지고 디렉터리 작업 공간으로 영구 저장되므로,
호스트는 체크아웃을 구체화하거나 저장소 설정 코드를 실행하지 않습니다. 대상
작업자는 권한 상승 실행, 영구 저장된 호스트/Node 실행 재정의 또는 분류되지 않은
Plugin 및 MCP 도구 없이, 해당 작업 공간 전용의 쓰기 가능한 비공유 Docker
샌드박스를 사용해야 합니다. Workboard는 `workboard_*` 접두사를 신뢰하는
대신 등록된 도구를 열거하며, 실행 중인 Docker 컨테이너의 실제 마운트/구성
해시가 오래된 경우 디스패치를 거부합니다. 디스패치는 제한이 더 약한 작업자를
시작하는 대신 호환되지 않는 대상 정책을 보고합니다. 전체 호스트 디스패치는
다른 로컬 체크아웃을 대상으로 지정할 수 있으며 일반적인 관리형 worktree
설정을 유지합니다.

작업 공간 권한은 별도의 카드 수명 주기 권한 모델을 만들지 않습니다. Workboard
카드를 변경할 수 있는 호출자는 모든 표면에서 동일한 상태들을 거쳐 카드를
수동으로 이동할 수 있습니다. 읽기 전용 작업 공간 접근은 쓰기가 필요한 작업자
디스패치만 방지합니다.

### 작업자 선택

각 패스는 기본적으로 **최대 3명의 작업자**를 시작합니다. 준비된 카드는 우선순위,
위치, 생성 시간순으로 정렬됩니다. 한 패스에서는 소유자/에이전트마다 카드 하나만
시작하며, 보드에서 이미 실행 중이거나 검토 중인 작업이 있는 소유자는 건너뜁니다.
보관된 카드, 활성 클레임이 있는 카드 및 `ready` 상태가 아닌 카드는
작업자 시작 대상으로 절대 선택되지 않습니다(단, 디스패치의 데이터 측면인 부실
클레임 정리, 종속성 승격, 시간 초과 정리의 영향을 받을 수는 있습니다).

세션 키는 보드/카드별로 결정론적이므로, 반복된 디스패치는 관련 없는 세션을
생성하는 대신 동일한 작업자 레인으로 다시 라우팅됩니다.

- 할당된 카드: `agent:<agentId>:subagent:workboard-<boardId>-<cardId>`
- 할당되지 않은 카드: `subagent:workboard-<boardId>-<cardId>`(Gateway가
  구성된 기본 에이전트를 결정함)

카드가 클레임된 후 작업자를 시작할 수 없는 경우 Workboard는 카드를 차단하고,
클레임을 해제하며, 실행 시작 실패를 기록하고, 작업자 로그 행을 추가합니다.
이 로그는 대시보드, CLI JSON, 에이전트 도구 및 카드 진단에서 확인할 수 있습니다.

### 진입점

- 대시보드 디스패치 작업
- `openclaw workboard dispatch`
- 명령을 지원하는 채널의 `/workboard dispatch`

Gateway를 사용할 수 있으면 세 가지 모두 Gateway 하위 에이전트 런타임을 사용합니다. CLI에는 하나의 운영자 폴백이 있습니다. Gateway 호출이 연결/사용 불가 오류(또는 이전 Gateway의 `unknown method` 오류)로 실패하고, 명시적인 `--url`/`--token` 대상이 없으며, 구성된 원격 Gateway(`OPENCLAW_GATEWAY_URL` 또는 `gateway.mode: remote`)도 적용되지 않으면 CLI는 로컬 SQLite 상태를 대상으로 데이터 전용 디스패치를 실행합니다. 이 디스패치는 종속성을 승격하고, 오래된 클레임을 정리하며, 시간 초과된 실행을 차단할 수 있지만 워커를 시작할 수는 없습니다. 연결 가능한 Gateway에서 발생한 인증, 권한 및 유효성 검사 실패는 사용 불가로 처리되지 않고 명령 오류로 표시되며, 명시적인 `--url`/`--token` 대상이 지정된 경우의 모든 Gateway 실패도 마찬가지입니다.

보드 메타데이터는 `autoDecompose`, `autoDecomposePerDispatch`, `defaultAssignee`, `orchestratorProfile`을 설정할 수 있습니다. OpenClaw는 이 의도를 기록하고 워커 컨텍스트에 노출합니다. 실제 사양 작성/분해는 계속 일반 Workboard 도구를 통해 실행됩니다.

## CLI 및 슬래시 명령

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id> [--json]
openclaw workboard move <card-id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--json]
```

`list` 텍스트 출력은 기본적으로 보관된 카드를 숨깁니다(`--include-archived`으로 재정의). `--json`은 기존 스크립트에서 사용하는 전체 카드 계약에 맞춰 항상 보관된 카드를 포함합니다. `show` 및 `move`은 모호하지 않은 ID 접두사를 허용합니다. `list`, `create`, `show`, `move`은 항상 로컬 Plugin 상태를 직접 읽고 씁니다. 위에서 설명한 폴백과 함께 실행 중인 Gateway를 호출하는 것은 `dispatch`뿐입니다.

전체 플래그, JSON 출력, Gateway 폴백 동작, ID 접두사 처리, 디스패치 선택 규칙 및 문제 해결에 대해서는 [Workboard CLI](/ko/cli/workboard)를 참조하십시오.

`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`, `/workboard move <card-id> --status <status>`, `/workboard dispatch`은 CLI와 동일하게 동작합니다. 목록 및 표시는 권한이 있는 모든 명령 발신자가 사용할 수 있는 읽기 작업입니다. 생성, 이동 및 디스패치에는 채팅 화면에서 소유자 상태이거나 `operator.write`/`operator.admin` 권한이 있는 Gateway 클라이언트가 필요합니다. 운영자의 수동 이동에는 대시보드 끌어서 놓기와 동일한 클레임 재정의 동작이 적용됩니다. 해당 워크트리 접근에도 위에서 설명한 것과 동일한 워크스페이스 경계가 적용됩니다.

## 세션 수명 주기 동기화

카드는 기존 대시보드 세션이나 카드에서 작업을 시작할 때 생성되는 세션에 연결할 수 있습니다. 연결된 카드는 실행 중, 오래됨, 연결된 유휴 상태, 완료, 실패 또는 누락 등의 세션 수명 주기를 인라인으로 표시합니다. Sessions 탭에서 **Add to Workboard**를 사용하여 기존 세션을 가져올 수도 있습니다. 카드는 해당 세션에 연결되고, 세션 레이블이나 최근 사용자 프롬프트를 제목으로 사용하며, 가능한 경우 최근 사용자 프롬프트와 최신 어시스턴트 응답으로 노트를 초기화합니다.

연결된 세션이 누락되어도 컨텍스트를 위해 카드의 연결은 유지되며, 새 세션에서 다시 시작할 수 있는 시작 컨트롤도 계속 제공됩니다. 활성 상태인 연결된 세션이 최근 활동을 보고하지 않으면 Workboard는 카드에 `stale` 표시를 하고 수명 주기가 이를 해제할 때까지 메타데이터로 저장합니다.

카드가 활성 작업 상태인 동안 Workboard는 연결된 세션을 따릅니다.

| 연결된 세션 상태                       | 카드 상태 |
| ------------------------------------- | --------- |
| 활성                                  | `running`   |
| 완료                                  | `review`    |
| 실패, 종료, 시간 초과 또는 중단       | `blocked`   |

**수동 검토 상태가 우선합니다.** 카드를 `review`, `blocked` 또는 `done`으로 이동하면 다시 `todo` 또는 `running`으로 이동할 때까지 해당 카드의 자동 동기화가 중지됩니다.

카드를 시작할 때 일반 Gateway 세션을 사용하며, Workboard는 카드 메타데이터와 연결 정보만 저장합니다. 대화 기록, 모델 선택 및 실행 수명 주기는 일반 세션 시스템에서 계속 관리합니다. 실행 중인 연결된 카드에서 **Stop**을 사용하여 활성 실행을 중단하십시오. Workboard는 후속 조치를 위해 해당 카드가 계속 표시되도록 `blocked` 표시를 합니다.

새 카드는 Workboard 템플릿(`bugfix`, `docs`, `release`, `pr_review`, `plugin`)에서 시작할 수 있습니다. 템플릿은 제목, 노트, 레이블 및 우선순위를 미리 채우며, 템플릿 ID는 카드 메타데이터로 저장됩니다.

## 대시보드 워크플로

1. Control UI에서 Workboard 탭을 엽니다.
2. 제목, 노트, 우선순위, 레이블, 선택적 에이전트 및 선택적 연결 세션이 포함된 카드를 생성합니다. 또는 Sessions를 열고 기존 세션에 대해 **Add to Workboard**를 선택합니다.
3. 카드를 열 사이로 끌거나, 간결한 상태 컨트롤에 포커스를 맞춘 후 메뉴 또는 ArrowLeft/ArrowRight를 사용합니다. 끄는 동안 원본 카드가 흐려지고 놓을 수 있는 열에 윤곽선이 표시됩니다.
4. 카드에서 작업을 시작하여 대시보드 세션을 생성하거나 재사용합니다.
5. 에이전트가 작업하는 동안 카드에서 연결된 세션을 엽니다.
6. 수명 주기 동기화가 실행 중인 작업을 `review`/`blocked`으로 이동하도록 한 다음, 승인되면 카드를 수동으로 `done`으로 이동합니다.

## 진단

진단은 로컬 카드 메타데이터에서 계산됩니다. 기본 제공 검사는 다음을 표시합니다.

| 종류                        | 조건                                                                           |
| --------------------------- | ------------------------------------------------------------------------------ |
| `stranded_ready`            | 할당된 `todo`/`backlog`/`ready` 카드가 1시간 넘게 업데이트되지 않았습니다.             |
| `running_without_heartbeat` | `running` 카드에 20분 넘게 클레임 Heartbeat 또는 실행 업데이트가 없습니다. |
| `blocked_too_long`          | `blocked` 카드가 24시간 넘게 업데이트되지 않았습니다.                                   |
| `repeated_failures`         | 카드에서 추적된 실패 횟수가 2회 이상입니다.                                |
| `missing_proof`             | `done` 카드에 증명, 아티팩트 또는 첨부 파일이 없습니다.                          |
| `orphaned_session`          | `running` 카드에 `sessionKey`이 있지만 `execution` 메타데이터가 없습니다.                |

## 권한

Gateway RPC 메서드는 `workboard.*` 아래에 있습니다.

| 범위             | 메서드                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`  | `cards.list`, `cards.export`, `cards.diagnostics`, 첨부 파일 목록/가져오기, 알림 이벤트 읽기, `boards.list`, `cards.stats`, `cards.runs`                                                                                                                                                                                                                                       |
| `operator.write` | `cards.diagnostics.refresh`, 생성/업데이트/이동/삭제/댓글/연결/종속성 연결/증명/아티팩트, 첨부 파일 추가/삭제, 워커 로그, 프로토콜 위반, 클레임/Heartbeat/해제/승격/재할당/회수/완료/차단/차단 해제, `cards.dispatch`, `cards.bulk`, 보관, `boards.upsert`/`archive`/`delete`, `cards.specify`/`decompose`, 알림 구독/삭제/진행 |

어떤 RPC 메서드에도 `operator.admin`이 필요하지 않습니다. 읽기 전용 운영자 접근으로 연결된 브라우저는 보드를 확인할 수 있지만 카드를 변경할 수는 없습니다. 관리자 범위는 허용되는 Workboard 호스트 경로를 확장하지만 사용 가능한 메서드는 변경하지 않습니다.

## 저장소

Workboard는 OpenClaw 상태 디렉터리 아래의 Plugin 소유 관계형 SQLite 데이터베이스에 영구 데이터를 저장합니다. 보드, 카드, 레이블, 수명 주기 이벤트, 실행 시도, 댓글, 종속성 연결, 증명, 아티팩트 참조, 첨부 파일 메타데이터 및 Blob, 진단, 알림, 워커 로그, 프로토콜 상태와 구독은 모두 Workboard 테이블에 저장됩니다(Plugin 키-값 항목에는 저장되지 않음). 카드 내보내기는 첨부 파일 Blob 콘텐츠를 인라인으로 포함하지 않고 보드의 작업 흐름을 보존합니다.

`.28` 릴리스에서 Workboard를 사용한 설치 환경은 `openclaw doctor --fix`을 실행하여 출시된 기존 Plugin 상태 네임스페이스(`workboard.cards`, `workboard.boards`, `workboard.notify` 및 존재하는 경우 `workboard.attachments`)를 관계형 데이터베이스로 마이그레이션할 수 있습니다.

## 문제 해결

**탭에 Workboard를 사용할 수 없다고 표시됨**

```bash
openclaw plugins inspect workboard --runtime --json
```

`plugins.allow`이 구성되어 있으면 여기에 `workboard`을 추가합니다. `plugins.deny`에 `workboard`이 포함되어 있으면 Plugin을 활성화하기 전에 제거합니다.

**카드가 저장되지 않음**

브라우저 연결에 `operator.write` 접근 권한이 있는지 확인합니다. 읽기 전용 운영자 세션은 카드를 나열할 수 있지만 생성, 편집, 이동 또는 삭제할 수는 없습니다.

**카드를 시작해도 예상한 세션이 열리지 않음**

카드의 에이전트 ID와 연결된 세션을 확인한 다음 Sessions 또는 Chat을 열어 실제 실행 상태를 확인합니다.

**디스패치가 워커를 시작하지 않음**

활성 클레임이 없는 `ready` 카드가 하나 이상 있는지 확인합니다.

```bash
openclaw workboard list --status ready
```

CLI가 데이터 전용 디스패치를 보고하면 Gateway를 시작하거나 다시 시작한 후 재시도하십시오. 데이터 전용 디스패치는 로컬 보드 상태를 업데이트하지만 하위 에이전트 워커 실행을 시작할 수 없습니다. 동일한 소유자 또는 에이전트의 다른 카드가 이미 실행 중이거나 검토를 기다리는 경우에도 카드를 건너뛸 수 있습니다. 동일한 소유자에 대해 추가로 디스패치하기 전에 해당 활성 작업을 완료, 차단 또는 해제하십시오.

## 관련 항목

- [Control UI](/ko/web/control-ui)
- [Workboard CLI](/ko/cli/workboard)
- [Plugins](/ko/tools/plugin)
- [Plugin 관리](/ko/plugins/manage-plugins)
- [세션](/ko/concepts/session)
