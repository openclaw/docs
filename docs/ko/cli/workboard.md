---
read_when:
    - 터미널에서 Workboard 카드를 확인하거나 만들려는 경우
    - CLI에서 Workboard 작업자 실행을 디스패치하려는 경우
    - Workboard CLI 또는 슬래시 명령 동작을 디버깅하고 있습니다
summary: '`openclaw workboard` 카드, 디스패치 및 워커 실행을 위한 CLI 참조 안내'
title: 워크보드 CLI
x-i18n:
    generated_at: "2026-07-12T00:39:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard`는 번들로 제공되는 [Workboard Plugin](/ko/plugins/workboard)의 터미널 인터페이스입니다. 운영자는 이 명령으로 카드를 나열하고, 카드를 생성하고, 개별 카드를 확인하며, 실행 중인 Gateway에 준비된 작업을 하위 에이전트 워커 실행으로 디스패치하도록 요청할 수 있습니다.

명령을 사용하기 전에 Plugin을 활성화하세요.

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## 사용법

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

이 명령은 대시보드와 Workboard 에이전트 도구에서 사용하는 동일한 Plugin 소유 SQLite 데이터베이스를 읽고 씁니다. 카드 ID는 UUID입니다. 카드 ID를 받는 명령에는 명확히 구분되는 ID 접두사도 사용할 수 있습니다(간결한 텍스트 출력에는 처음 8자가 표시됩니다).

유효한 `status` 값: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. 유효한 `priority` 값: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

텍스트 출력은 간결합니다.

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

열은 순서대로 ID 접두사, 상태, 우선순위, 보드 ID, 선택적 에이전트 ID, 제목입니다.

| 플래그               | 용도                                          |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | 결과를 하나의 보드 네임스페이스로 제한합니다 |
| `--status <status>`  | 결과를 하나의 Workboard 상태로 제한합니다    |
| `--include-archived` | 간결한 텍스트 출력에 보관된 카드를 포함합니다 |
| `--json`             | 전체 카드 목록을 기계 판독용 JSON으로 출력합니다 |

CLI가 `/workboard list`와 일치하도록 간결한 텍스트 출력에서는 기본적으로 보관된 카드를 숨깁니다. 표시하려면 `--include-archived`를 전달하세요. 기존 자동화를 위해 JSON 출력에는 보관된 카드를 포함한 전체 카드 목록이 항상 유지됩니다.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| 플래그                  | 용도                                      |
| ----------------------- | ----------------------------------------- |
| `--notes <text>`        | 초기 카드 메모                            |
| `--status <status>`     | 초기 상태, 기본값은 `todo`                |
| `--priority <priority>` | 우선순위, 기본값은 `normal`               |
| `--agent <id>`          | 카드를 에이전트 또는 소유자 ID에 할당합니다 |
| `--board <id>`          | 카드를 보드 네임스페이스에 저장합니다     |
| `--labels <items>`      | 쉼표로 구분된 레이블                      |
| `--json`                | 생성된 카드를 기계 판독용 JSON으로 출력합니다 |

`create`는 Workboard SQLite 상태에 직접 기록합니다. 카드는 Control UI의 Workboard 탭과 Workboard 도구에 즉시 표시됩니다.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

텍스트 출력에는 간결한 카드 행과 메모가 표시됩니다. JSON 출력은 실행 메타데이터, 시도 기록, 댓글, 링크, 증명, 아티팩트, 워커 로그, 프로토콜 상태, 진단 및 자동화 메타데이터를 포함한 전체 카드 레코드를 반환합니다.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch`는 먼저 실행 중인 Gateway의 RPC 메서드 `workboard.cards.dispatch`를 호출합니다. 이 메서드는 대시보드의 디스패치 동작과 동일한 하위 에이전트 런타임을 사용하므로, 준비된 카드는 연결된 세션 키가 있는 작업 추적 워커 실행으로 전환됩니다. 에이전트가 할당된 카드는 에이전트 범위의 하위 에이전트 세션 키를 사용합니다. 할당되지 않은 카드는 범위가 지정되지 않은 하위 에이전트 키를 유지하므로 Gateway에 구성된 기본 에이전트가 보존됩니다.

디스패치 루프는 다음을 수행합니다.

1. 종속성이 준비된 하위 카드를 `ready`로 승격합니다.
2. 만료된 클레임 또는 시간 초과된 워커 실행을 차단합니다.
3. 준비된 카드에 디스패치 메타데이터를 기록합니다.
4. 클레임되지 않은 준비된 카드 중 소규모 배치를 선택합니다.
5. 선택한 각 카드를 디스패처 또는 할당된 에이전트가 클레임합니다.
6. 제한된 카드 컨텍스트와 카드 클레임 토큰을 사용하여 하위 에이전트 워커 실행을 시작합니다.
7. 워커 실행 ID, 세션 키, Gateway 작업 원장에 보고된 경우 작업 연결 정보, 실행 상태 및 워커 로그를 카드에 저장합니다.

선택은 보수적으로 이루어집니다. 기본적으로 한 번의 디스패치는 최대 3개의 워커를 시작하고, 보관되었거나 이미 클레임된 카드는 건너뛰며, 한 번의 처리 과정에서 소유자 또는 에이전트당 카드 하나만 시작합니다. 이미 실행 중이거나 검토 중인 활성 작업을 보유한 소유자의 카드는 이후 디스패치를 위해 남겨 둡니다.

카드를 클레임한 후 워커 시작에 실패하면 Workboard는 해당 카드를 차단하고 클레임을 해제하며 카드 실행 및 워커 로그 메타데이터에 실패를 기록합니다. 따라서 시작 실패를 카드를 대기열에 조용히 되돌리는 대신 확인할 수 있습니다.

명시적인 Gateway 대상이 지정되지 않았고 로컬 Gateway를 사용할 수 없거나 아직 Workboard 디스패치 메서드를 제공하지 않으면, CLI는 로컬 Workboard 상태를 대상으로 하는 데이터 전용 디스패치로 대체합니다. 데이터 전용 디스패치도 종속성을 승격하고 오래된 클레임을 정리하며 시간 초과된 실행을 차단할 수 있지만 워커를 시작하지는 않습니다. 인증, 권한, 검증 실패와 명시적인 `--url` 또는 `--token` 대상에 대한 실패는 대체 동작을 실행하지 않고 직접 보고됩니다.

텍스트 출력에는 워커 시작 결과가 표시됩니다.

```text
dispatch complete: started=2 failures=0
```

대체 출력은 명확하게 표시됩니다.

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

JSON 출력에는 디스패치 결과가 포함됩니다. Gateway 기반 디스패치에는 `started`와 `startFailures`가 포함될 수 있으며, 데이터 전용 대체 결과에는 `gatewayUnavailable: true`가 포함됩니다. 카드 JSON 출력에서는 클레임 토큰이 마스킹됩니다.

대시보드에서도 동일한 디스패치 결과가 간단한 요약으로 표시되므로 운영자는 카드 세부 정보를 열지 않고도 시작, 승격, 차단, 재클레임 또는 실패한 카드 수를 확인할 수 있습니다.

## 슬래시 명령 동등성

명령을 지원하는 채널에서는 다음과 같이 대응하는 슬래시 명령을 사용할 수 있습니다.

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

슬래시 명령 디스패치도 Gateway 하위 에이전트 런타임을 사용하므로 대시보드 및 CLI Gateway 경로와 동일한 클레임, 워커 시작 및 실패 동작을 따릅니다.

`/workboard list`와 `/workboard show`는 권한이 있는 명령 발신자를 위한 읽기 명령입니다. `/workboard create`와 `/workboard dispatch`는 보드 상태를 변경하므로 채팅 인터페이스에서는 소유자 상태가 필요하며, Gateway 클라이언트에서는 `operator.write` 또는 `operator.admin`이 필요합니다.

## 권한

CLI 디스패치 경로는 `operator.read` 및 `operator.write` 범위로 Gateway RPC를 호출합니다. 읽기 전용 Gateway 토큰은 읽기 메서드를 통해 Workboard 데이터를 확인할 수 있지만, 카드를 생성하거나 워커를 디스패치할 수는 없습니다.

로컬 `list`, `create`, `show` 명령은 현재 프로필이 사용하는 로컬 OpenClaw 상태 디렉터리에서 작동합니다. 다른 상태 루트가 필요하면 최상위 `openclaw` 명령에 `--dev` 또는 `--profile <name>`을 사용하세요.

## 문제 해결

### 카드가 표시되지 않음

동일한 프로필 및 상태 루트에서 Plugin이 활성화되어 있는지 확인하세요.

```bash
openclaw plugins inspect workboard --runtime --json
```

대시보드에는 카드가 표시되지만 CLI에는 표시되지 않으면 두 명령이 동일한 `--dev` 또는 `--profile` 설정을 사용하는지 확인하세요.

### 디스패치에 데이터 전용이라고 표시됨

Gateway를 시작하거나 다시 시작하세요.

```bash
openclaw gateway restart
openclaw gateway status --deep
```

그런 다음 `openclaw workboard dispatch`를 다시 시도하세요. 데이터 전용 대체 동작은 로컬 상태 정리에 유용하지만, 워커를 실행하려면 활성 Gateway가 필요합니다.

### 디스패치가 아무것도 시작하지 않음

활성 클레임이 없는 `ready` 카드가 하나 이상 있는지 확인하세요.

```bash
openclaw workboard list --status ready
```

같은 소유자에게 이미 실행 중이거나 검토 중인 작업이 있는 경우에도 카드를 건너뛸 수 있습니다. 완료된 작업을 `done`으로 이동하고 Workboard 도구를 통해 오래된 클레임을 해제하거나, 활성 워커가 완료된 후 디스패치를 다시 실행하세요.

## 관련 문서

- [Workboard Plugin](/ko/plugins/workboard)
- [CLI 참조](/ko/cli)
- [슬래시 명령](/ko/tools/slash-commands)
- [Control UI](/ko/web/control-ui)
