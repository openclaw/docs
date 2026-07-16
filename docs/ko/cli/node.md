---
read_when:
    - 헤드리스 Node 호스트 실행하기
    - system.run을 위한 macOS 외 Node 페어링
summary: '`openclaw node`(헤드리스 Node 호스트)용 CLI 참조 문서'
title: Node
x-i18n:
    generated_at: "2026-07-16T12:29:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d17b96b8829bef4202ff220d9b20e04c183702f997f669120cb16aa7191235b6
    source_path: cli/node.md
    workflow: 16
---

# `openclaw node`

Gateway WebSocket에 연결하고 이 머신에서
`system.run` / `system.which`를 노출하는 **헤드리스 Node 호스트**를 실행합니다.

macOS에서는 메뉴 막대 앱이 이미 이 Node 호스트 런타임을 자체
Node 연결에 내장하고 네이티브 Mac 기능을 추가합니다. 앱 없이 헤드리스 Node를
의도적으로 사용하려는 경우에만 Mac에서 `openclaw node run`을 사용하십시오. 둘 다
실행하면 동일한 머신에 두 개의 Node ID가 생성됩니다.

## Node 호스트를 사용하는 이유

전체 macOS 컴패니언 앱을 설치하지 않고 네트워크의 **다른 머신에서 명령을 실행**하도록
에이전트를 구성하려면 Node 호스트를 사용하십시오.

일반적인 사용 사례:

- 원격 Linux/Windows 머신(빌드 서버, 랩 머신, NAS)에서 명령을 실행합니다.
- Gateway에서는 exec를 **샌드박스 내에서** 유지하면서 승인된 실행을 다른 호스트에 위임합니다.
- 자동화 또는 CI Node를 위한 경량 헤드리스 실행 대상을 제공합니다.

실행은 계속해서 Node 호스트의 **exec 승인**과 에이전트별 허용 목록으로
보호되므로 명령 액세스 범위를 제한하고 명시적으로 유지할 수 있습니다.

`openclaw node run`은 연결 후 Plugin 또는 MCP 기반 도구를 게시할 수 있습니다.
Gateway는 기본적으로 페어링된 Node의 설명자를 신뢰하지만, 각 설명자의 명령은
Node의 승인된 명령 표면에 속해야 합니다. 에이전트는 수락된 각 설명자를 일반
Plugin 도구로 인식하지만, 실행은 계속 `node.invoke`을 통과하므로 Node 연결을
끊으면 새로운 에이전트 실행에서 해당 도구가 제거됩니다. Gateway 운영자는
`gateway.nodes.pluginTools.enabled: false`을 사용하여 게시를 비활성화할 수 있습니다.

선언적 MCP 도구의 경우 Node 머신의 `openclaw.json`에 있는
`nodeHost.mcp.servers` 아래에 일반적인 MCP 서버 형식을 추가한 다음 Node 호스트를
다시 시작하십시오. Node는 승인이 필요한 `mcp.tools.call.v1` 명령 패밀리를
선언하고 연결 후 나열된 도구를 게시합니다. 이후 서버 목록을 변경해도 다시
페어링할 필요가 없습니다. [Node 호스팅 MCP 서버](/ko/nodes#node-hosted-mcp-servers)를
참조하십시오.

## 브라우저 프록시(구성 불필요)

Node에서 `browser.enabled`이 비활성화되어 있지 않으면 Node 호스트가 자동으로
브라우저 프록시를 알립니다. 이를 통해 추가 구성 없이 에이전트가 해당 Node에서
브라우저 자동화를 사용할 수 있습니다.

기본적으로 프록시는 Node의 일반 브라우저 프로필 표면을 노출합니다.
`nodeHost.browserProxy.allowProfiles`을 설정하면 프록시가 제한적으로 변경됩니다.
허용 목록에 없는 프로필 대상 지정은 거부되고 영구 프로필 생성/삭제 경로는
프록시를 통해 차단됩니다.

필요한 경우 Node에서 비활성화하십시오.

```json5
{
  nodeHost: {
    browserProxy: {
      enabled: false,
    },
  },
}
```

## 실행(포그라운드)

```bash
openclaw node run --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--context-path <path>`: Gateway WebSocket 컨텍스트 경로(예: `/openclaw-gw`). WebSocket URL에 추가됩니다.
- `--tls`: Gateway 연결에 TLS를 사용합니다.
- `--no-tls`: 로컬 Gateway 구성에서 TLS가 활성화되어 있어도 평문 Gateway 연결을 강제합니다.
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: 공유 SQLite 상태에 저장된 클라이언트 인스턴스 ID를 재정의합니다(페어링은 초기화하지 않음).
- `--display-name <name>`: Node 표시 이름을 재정의합니다.

## Node 호스트의 Gateway 인증

`openclaw node run` 및 `openclaw node install`은 구성/환경에서 Gateway 인증을 확인합니다(Node 명령에는 `--token`/`--password` 플래그가 없음).

- `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`을 먼저 확인합니다.
- 그런 다음 로컬 구성으로 대체합니다: `gateway.auth.token` / `gateway.auth.password`.
- 로컬 모드에서 Node 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`을 상속하지 않습니다.
- `gateway.auth.token` / `gateway.auth.password`이 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면 Node 인증 확인이 실패 시 차단됩니다(원격 대체가 실패를 숨기지 않음).
- `gateway.mode=remote`에서는 원격 클라이언트 필드(`gateway.remote.token` / `gateway.remote.password`)도 원격 우선순위 규칙에 따라 사용할 수 있습니다.
- Node 호스트 인증 확인에서는 `OPENCLAW_GATEWAY_*` 환경 변수만 적용됩니다.

평문 `ws://` Gateway에 연결하는 Node의 경우 루프백, 사설 IP
리터럴, `.local`, Tailnet `*.ts.net` 호스트가 허용됩니다. 그 밖의
신뢰할 수 있는 사설 DNS 이름에는 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하십시오. 이 설정이
없으면 Node 시작이 실패 시 차단되고 `wss://`, SSH 터널 또는 Tailscale을
사용하라는 메시지가 표시됩니다. 이는 프로세스 환경을 통한 명시적 동의이며
`openclaw.json` 구성 키가 아닙니다.
설치 명령 환경에 `openclaw node install`이 있으면 감독되는 Node 서비스에 이를
영구 저장합니다.

## 서비스(백그라운드)

헤드리스 Node 호스트를 사용자 서비스로 설치합니다(macOS에서는 launchd, Linux에서는
systemd, Windows에서는 Windows Task Scheduler).

```bash
openclaw node install --host <gateway-host> --port 18789
```

옵션:

- `--host <host>`: Gateway WebSocket 호스트(기본값: `127.0.0.1`)
- `--port <port>`: Gateway WebSocket 포트(기본값: `18789`)
- `--context-path <path>`: Gateway WebSocket 컨텍스트 경로(예: `/openclaw-gw`). WebSocket URL에 추가됩니다.
- `--tls`: Gateway 연결에 TLS를 사용합니다.
- `--tls-fingerprint <sha256>`: 예상 TLS 인증서 지문(sha256)
- `--node-id <id>`: 공유 SQLite 상태에 저장된 클라이언트 인스턴스 ID를 재정의합니다(페어링은 초기화하지 않음).
- `--display-name <name>`: Node 표시 이름을 재정의합니다.
- `--runtime <runtime>`: 서비스 런타임(`node`)
- `--force`: 이미 설치된 경우 다시 설치하거나 덮어씁니다.

서비스 관리:

```bash
openclaw node status
openclaw node start
openclaw node stop
openclaw node restart
openclaw node uninstall
```

포그라운드 Node 호스트(서비스 없음)에는 `openclaw node run`을 사용하십시오.

서비스 명령은 머신 판독 가능 출력을 위한 `--json`을 지원합니다.

Node 호스트는 Gateway 재시작과 네트워크 연결 종료를 프로세스 내에서 다시
시도합니다. Gateway가 토큰/비밀번호/부트스트랩 인증의 최종 일시 중지를
보고하면 Node 호스트는 종료 세부 정보를 기록하고 0이 아닌 코드로 종료하여
launchd/systemd/Task Scheduler가 새로운 구성과 자격 증명으로 다시 시작할 수
있게 합니다. 페어링이 필요한 일시 중지는 대기 중인 요청을 승인할 수 있도록
포그라운드 흐름에 유지됩니다.

## 페어링

첫 연결 시 Gateway에 대기 중인 기기 페어링 요청(`role: node`)이 생성됩니다.

Gateway 호스트가 비대화형으로 Node 호스트에 SSH로 연결할 수 있으면(동일한 사용자,
신뢰할 수 있는 호스트 키) 대기 중인 요청이 자동으로 승인됩니다. Gateway가 SSH를
통해 Node 호스트에서 `openclaw node identity --json`을 실행하고 기기 키가 정확히 일치할 때
승인합니다. 이는 기본적으로 활성화되어 있습니다. 요구 사항과 비활성화 방법
(`gateway.nodes.pairing.sshVerify: false`)은
[SSH로 검증된 기기 자동 승인](/ko/gateway/pairing#ssh-verified-device-auto-approval-default)을
참조하십시오.

그렇지 않으면 다음을 통해 수동으로 승인하십시오.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 검증하는 로컬 Node ID를 확인합니다.

```bash
openclaw node identity --json
```

`identity/device.json`의 기기 ID와 공개 키를 출력하며 ID 파일을 생성하거나
수정하지 않습니다.

엄격하게 제어되는 Node 네트워크에서는 Gateway 운영자가 신뢰할 수 있는 CIDR의
최초 Node 페어링을 자동 승인하도록 명시적으로 동의할 수 있습니다.

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

기본적으로 비활성화되어 있습니다(`autoApproveCidrs`이 설정되지 않음). Gateway가
신뢰하는 클라이언트 IP에서 요청된 범위 없이 새로 이루어지는
`role: node` 페어링에만 적용됩니다. 운영자/브라우저 클라이언트, Control UI,
WebChat 및 역할, 범위, 메타데이터 또는 공개 키 업그레이드는 계속 수동 승인이
필요합니다.

Node가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면 이전
대기 요청이 대체되고 새 `requestId`이 생성됩니다. 승인하기 전에
`openclaw devices list`을 다시 실행하십시오.

### ID 및 페어링 상태

헤드리스 Node는 클라이언트 인스턴스 ID를 Gateway가 페어링 및 라우팅에 사용하는
서명된 기기 ID와 분리합니다. 이 상태는 OpenClaw 상태 디렉터리(기본값:
`~/.openclaw`, 설정된 경우 `$OPENCLAW_STATE_DIR`)에 있습니다.

| 상태                                         | 용도                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `state/openclaw.sqlite` (`node_host_config`) | 클라이언트 인스턴스 ID, 표시 이름 및 Gateway 연결 메타데이터입니다. 클라이언트는 이 ID를 `instanceId`으로 전송합니다.            |
| `identity/device.json`                       | 서명된 Ed25519 키 쌍과 파생된 기기 ID입니다. 서명된 연결에서는 이 기기 ID가 라우팅되는 Node ID이자 페어링 ID입니다.                 |
| `identity/device-auth.json`                  | 암호화 기기 ID와 역할을 키로 사용하는 페어링된 기기 토큰입니다.                                                                  |

`--node-id`은 공유 SQLite 상태의 클라이언트 인스턴스 ID만 변경합니다.
암호화 기기 ID를 변경하거나 페어링 인증을 지우지 않습니다. `openclaw doctor --fix`을
사용하여 폐기된 `node.json`을 마이그레이션하는 경우에도 페어링이 초기화되지
않습니다. Node를 해지하고 다시 페어링하려면 다음을 수행하십시오.

1. Gateway에서 `openclaw nodes remove --node <id|name|ip>`을 실행합니다.
2. Node에서 `openclaw node restart`을 사용하여 설치된 서비스를 다시 시작하거나
   포그라운드 `openclaw node run` 명령을 중지한 후 다시 실행합니다. 그러면
   기기 페어링 흐름이 시작됩니다. `openclaw devices list`에 요청이 표시되지 않고
   Node가 `AUTH_DEVICE_TOKEN_MISMATCH`을 보고하면 한 번 더 다시 시작하거나 실행하십시오.
   거부된 시도에서 이제 해지된 로컬 토큰이 삭제되며 다음 시도에서 페어링을
   요청할 수 있습니다.
3. Gateway에서 `openclaw devices list`을 실행한 다음
   `openclaw devices approve <deviceRequestId>`을 실행합니다.
4. Node를 다시 시작하거나 실행합니다. 페어링을 위해 일시 중지된 클라이언트는
   승인 후 자동으로 재개되지 않습니다. 이 재연결로 별도의 명령 표면 요청이
   생성됩니다.
5. Gateway에서 `openclaw nodes pending`을 실행한 다음
   `openclaw nodes approve <nodeRequestId>`을 실행합니다.

두 요청 ID는 서로 다릅니다. 적용 가능한 신뢰 CIDR 정책은 최초 기기 페어링
단계를 자동 승인할 수 있지만, 명령 표면 승인은 별도의 검사로 유지됩니다.

이전 OpenClaw 릴리스는 Node 호스트 상태를 `node.json`에 저장했으며
폐기된 `token` 필드가 남아 있을 수 있습니다. Node 호스트를 중지하고
`openclaw doctor --fix`을 한 번 실행하십시오. Doctor는 지원되는 ID 및 연결 필드를
SQLite로 가져오고, 사용하지 않는 토큰 필드를 폐기하며, 행을 검증한 후 폐기된
파일을 제거합니다. 파일이나 중단된 Doctor 클레임이 남아 있는 동안 일반 Node
명령은 이 복구 안내와 함께 실패 시 차단됩니다. `identity/` 아래의 두
파일을 모두 비공개로 유지하십시오. 이 파일에는 기기 키 쌍과 인증 토큰이
포함되어 있습니다.

## Exec 승인

`system.run`은 로컬 exec 승인으로 제한됩니다.

- `$OPENCLAW_STATE_DIR/exec-approvals.json` 또는
  변수가 설정되지 않은 경우 `~/.openclaw/exec-approvals.json`
- [Exec 승인](/ko/tools/exec-approvals)
- `openclaw approvals --node <id|name|ip>`(Gateway에서 편집)

승인된 비동기 Node exec의 경우 OpenClaw는 메시지를 표시하기 전에 표준
`systemRunPlan`을 준비합니다. 이후 승인된 `system.run` 전달은 저장된
계획을 재사용하므로, 승인 요청 생성 후 명령/cwd/세션 필드를 수정하면 Node가
실행할 내용을 변경하는 대신 해당 수정이 거부됩니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [Node](/ko/nodes)
