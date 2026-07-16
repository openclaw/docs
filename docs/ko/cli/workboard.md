---
read_when:
    - 터미널에서 Workboard 카드를 확인하거나 생성하려고 합니다
    - CLI에서 Workboard 워커 실행을 디스패치하려고 합니다
    - Workboard CLI 또는 슬래시 명령 동작을 디버깅하고 있습니다
summary: '`openclaw workboard` 카드, 디스패치 및 워커 실행을 위한 CLI 참조 문서'
title: 워크보드 CLI
x-i18n:
    generated_at: "2026-07-16T12:28:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard`은(는) 번들로 제공되는 [Workboard Plugin](/ko/plugins/workboard)의 터미널 인터페이스입니다. 운영자는 이를 통해 카드를 나열하고, 카드를 생성하고, 카드 하나를 검사하고, 실행 중인 Gateway에 준비된 작업을 하위 에이전트 워커 실행으로 디스패치하도록 요청할 수 있습니다.

명령을 사용하기 전에 Plugin을 활성화하십시오.

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 사용법

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

이 명령은 대시보드 및 Workboard 에이전트 도구에서 사용하는 것과 동일한 Plugin 소유 SQLite 데이터베이스를 읽고 씁니다. 카드 ID는 UUID입니다. 카드 ID를 받는 명령은 명확하게 식별되는 ID 접두사도 받습니다(간결한 텍스트 출력에는 처음 8자가 표시됩니다).

유효한 `status` 값: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. 유효한 `priority` 값: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

텍스트 출력은 간결합니다.

```text
7f4a2c10  ready     high    default agent-a  오래된 워커 Heartbeat 수정
```

열은 ID 접두사, 상태, 우선순위, 보드 ID, 선택적 에이전트 ID, 제목 순입니다.

| 플래그                 | 용도                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 결과를 하나의 보드 네임스페이스로 제한          |
| `--status <status>`  | 결과를 하나의 Workboard 상태로 제한         |
| `--include-archived` | 간결한 텍스트 출력에 보관된 카드 포함 |
| `--json`             | 전체 카드 목록을 기계 판독용 JSON으로 출력      |

CLI가 `/workboard list`과(와) 일치하도록 간결한 텍스트 출력에서는 기본적으로 보관된 카드를 숨깁니다. 카드를 표시하려면 `--include-archived`을(를) 전달하십시오. 기존 자동화를 위해 JSON 출력은 보관된 카드를 포함한 전체 카드 목록을 항상 유지합니다.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 플래그                    | 용도                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | 초기 카드 메모                      |
| `--status <status>`     | 초기 상태, 기본값 `todo`          |
| `--priority <priority>` | 우선순위, 기본값 `normal`              |
| `--agent <id>`          | 카드를 에이전트 또는 소유자 ID에 할당 |
| `--board <id>`          | 카드를 보드 네임스페이스에 저장     |
| `--labels <items>`      | 쉼표로 구분된 레이블                  |
| `--json`                | 생성된 카드를 기계 판독용 JSON으로 출력  |

`create`은(는) Workboard SQLite 상태에 직접 씁니다. 카드는 Control UI의 Workboard 탭과 Workboard 도구에 즉시 표시됩니다.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

텍스트 출력에는 간결한 카드 줄과 메모가 표시됩니다. JSON 출력은 실행 메타데이터, 시도, 댓글, 링크, 증명 자료, 아티팩트, 워커 로그, 프로토콜 상태, 진단 및 자동화 메타데이터를 포함한 전체 카드 레코드를 반환합니다.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move`은(는) 대시보드에서 카드를 드래그할 때와 동일한 수동 운영자 경로를 사용하여 카드 상태를 변경합니다. 전체 카드 ID 또는 명확하게 식별되는 접두사를 받습니다. 활성 종속성 및 예약 보류는 계속 적용됩니다. 운영자는 에이전트 클레임 토큰 없이도 클레임된 카드를 이동할 수 있습니다. 클레임 토큰은 에이전트 도구 변경에만 한정되며 JSON 출력에서는 마스킹됩니다.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch`은(는) 먼저 실행 중인 Gateway RPC 메서드 `workboard.cards.dispatch`을(를) 호출합니다. 이 메서드는 대시보드 디스패치 작업과 동일한 하위 에이전트 런타임을 사용하므로, 준비된 카드는 연결된 세션 키를 갖는 작업 추적 워커 실행이 됩니다. `--max-starts`은(는) 추가 방식의 `workboard.cards.dispatchWithOptions` 메서드를 사용하므로, 이전 Gateway는 워커를 시작하기 전에 해당 옵션을 거부합니다. 플래그를 사용하기 전에 업그레이드한 후 Gateway를 다시 시작하십시오. 에이전트가 할당된 카드는 에이전트 범위 하위 에이전트 세션 키를 사용합니다. 할당되지 않은 카드는 범위가 없는 하위 에이전트 키를 유지하므로 Gateway에 구성된 기본 에이전트가 보존됩니다.

디스패치 루프는 다음을 수행합니다.

1. 종속성이 준비된 하위 카드를 `ready`(으)로 승격합니다.
2. 만료된 클레임 또는 시간 초과된 워커 실행을 차단합니다.
3. 준비된 카드에 디스패치 메타데이터를 기록합니다.
4. 클레임되지 않은 준비된 카드의 소규모 배치를 선택합니다.
5. 선택된 각 카드를 디스패처 또는 할당된 에이전트용으로 클레임합니다.
6. 제한된 카드 컨텍스트 및 카드 클레임 토큰을 사용하여 하위 에이전트 워커 실행을 시작합니다.
7. Gateway 작업 원장에 보고된 경우 워커 실행 ID, 세션 키, 작업 연결 정보와 함께 실행 상태 및 워커 로그를 카드에 저장합니다.

선택은 보수적으로 이루어집니다. 한 번의 디스패치는 기본적으로 최대 3개의 워커를 시작하고, 보관되었거나 이미 클레임된 카드를 건너뛰며, 한 번의 패스에서 소유자 또는 에이전트당 하나의 카드만 시작합니다. 이미 실행 중이거나 검토 중인 활성 작업의 소유자가 있는 카드는 이후 디스패치로 남겨 둡니다. 패스당 한도를 변경하려면 양의 정수와 함께 `--max-starts <count>`을(를) 전달하십시오. 소유자당 카드 하나 규칙은 계속 적용되므로 실제 시작 수는 더 적을 수 있습니다.

카드가 클레임된 후 워커 시작에 실패하면 Workboard는 해당 카드를 차단하고 클레임을 해제하며, 카드 실행 및 워커 로그 메타데이터에 실패를 기록합니다. 따라서 시작 실패가 카드를 대기열로 조용히 되돌리지 않고 계속 표시됩니다.

명시적인 Gateway 대상이 지정되지 않았으며 로컬 Gateway를 사용할 수 없거나 아직 Workboard 디스패치 메서드를 노출하지 않는 경우, CLI는 로컬 Workboard 상태를 대상으로 하는 데이터 전용 디스패치로 대체합니다. 데이터 전용 디스패치는 종속성을 승격하고, 오래된 클레임을 정리하고, 시간 초과된 실행을 차단할 수 있지만 워커를 시작하지는 않습니다. 인증, 권한 및 유효성 검사 실패와 명시적인 `--url` 또는 `--token` 대상에 대한 실패는 대체 동작을 실행하지 않고 직접 보고됩니다.

텍스트 출력은 워커 시작을 보고합니다.

```text
디스패치 완료: 시작됨=2 실패=0
```

대체 출력은 명확하게 표시됩니다.

```text
Gateway를 사용할 수 없음; 데이터 디스패치만 수행: 승격됨=1 차단됨=0
```

JSON 출력에는 디스패치 결과가 포함됩니다. Gateway 기반 디스패치에는 `started` 및 `startFailures`이(가) 포함될 수 있으며, 데이터 전용 대체 동작에는 `gatewayUnavailable: true`이(가) 포함됩니다. 클레임 토큰은 카드 JSON 출력에서 마스킹됩니다.

대시보드에서는 동일한 디스패치 결과가 짧은 요약으로 표시되므로, 운영자는 카드 세부 정보를 열지 않고도 시작, 승격, 차단, 재클레임 또는 실패한 카드 수를 확인할 수 있습니다.

## 슬래시 명령 동등성

명령을 지원하는 채널에서는 이에 대응하는 슬래시 명령을 사용할 수 있습니다.

```text
/workboard list
/workboard show 7f4a2c10
/workboard create 오래된 워커 Heartbeat 수정
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

슬래시 명령 디스패치도 Gateway 하위 에이전트 런타임을 사용하므로 대시보드 및 CLI Gateway 경로와 동일한 클레임, 워커 시작 및 실패 동작을 따릅니다.

`/workboard list` 및 `/workboard show`은(는) 권한이 있는 명령 발신자를 위한 읽기 명령입니다. `/workboard create`, `/workboard move` 및 `/workboard dispatch`은(는) 보드 상태를 변경하며, 채팅 인터페이스에서는 소유자 상태가 필요하고 Gateway 클라이언트에서는 `operator.write` 또는 `operator.admin`이(가) 필요합니다.

## 권한

CLI 디스패치 경로는 일반적으로 Gateway `operator.write` 및 `operator.read` 범위를 요청합니다. 워크스페이스에 바인딩된 카드는 정확히 구성된 에이전트 워크스페이스에서 직접 실행됩니다. worktree 요청은 호스트가 저장소 제어 코드를 구체화하도록 허용하지 않고 해당 디렉터리로 범위가 제한됩니다. 선택된 워커에는 해당 워크스페이스에 대한 쓰기 가능한 비공유 Docker 샌드박스 액세스 권한, 요청된 마운트 및 정책과 일치하는 활성 컨테이너 해시가 있어야 하며, 호스트 탈출 기능이 없어야 합니다. `--admin`을(를) 전달하면 `operator.admin`을(를) 명시적으로 요청하고, 다른 호스트 체크아웃을 허용하며, 일반적인 관리형 worktree 설정을 사용합니다. 해당 범위가 클라이언트에 승인되지 않은 경우 연결이 실패합니다. 읽기 전용 Gateway 토큰은 읽기 메서드를 통해 Workboard 데이터를 검사할 수 있지만 카드를 생성하거나 워커를 디스패치할 수는 없습니다. Workboard 변경 권한이 있는 호출자의 수동 카드 이동에는 워크스페이스 제한이 그 외의 영향을 주지 않습니다.

로컬 `list`, `create`, `show` 및 `move` 명령은 현재 프로필에서 사용하는 로컬 OpenClaw 상태 디렉터리에 작용합니다. 다른 상태 루트가 필요한 경우 최상위 `openclaw` 명령에 `--dev` 또는 `--profile <name>`을(를) 사용하십시오.

## 문제 해결

### 카드가 표시되지 않음

동일한 프로필 및 상태 루트에서 Plugin이 활성화되어 있는지 확인하십시오.

```bash
openclaw plugins inspect workboard --runtime --json
```

대시보드에는 카드가 표시되지만 CLI에는 표시되지 않는 경우 두 명령이 동일한 `--dev` 또는 `--profile` 설정을 사용하는지 확인하십시오.

### 디스패치가 데이터 전용이라고 표시됨

Gateway를 시작하거나 다시 시작하십시오.

```bash
openclaw gateway restart
openclaw gateway status --deep
```

그런 다음 `openclaw workboard dispatch`을(를) 다시 시도하십시오. 데이터 전용 대체 동작은 로컬 상태 정리에 유용하지만, 워커 실행에는 활성 Gateway가 필요합니다.

### 디스패치가 아무것도 시작하지 않음

활성 클레임이 없는 `ready` 카드가 하나 이상 있는지 확인하십시오.

```bash
openclaw workboard list --status ready
```

동일한 소유자에게 이미 실행 중이거나 검토 중인 작업이 있는 경우에도 카드를 건너뛸 수 있습니다. 완료된 작업을 `done`(으)로 이동하고, Workboard 도구를 통해 오래된 클레임을 해제하거나, 활성 워커가 완료된 후 디스패치를 다시 실행하십시오.

## 관련 문서

- [Workboard Plugin](/ko/plugins/workboard)
- [CLI 참조](/ko/cli)
- [슬래시 명령](/ko/tools/slash-commands)
- [Control UI](/ko/web/control-ui)
