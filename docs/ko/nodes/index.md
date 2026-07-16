---
read_when:
    - iOS/watchOS/Android Node를 Gateway에 페어링하기
    - 에이전트 컨텍스트에 Node 캔버스/카메라 사용하기
    - 새 Node 명령 또는 CLI 도우미 추가
summary: 'Node: 페어링, 기능, 권한 및 캔버스/카메라/화면/기기/알림/시스템용 CLI 도우미'
title: Node들
x-i18n:
    generated_at: "2026-07-16T12:42:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c2c1e9ad62866704941906db136546f7e81975f52c503c24ce829d0b13613bcc
    source_path: nodes/index.md
    workflow: 16
---

**node**는 `role: "node"`을 사용하여 Gateway에 연결하고 `node.invoke`을 통해 명령 표면(예: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`)을 노출하는 보조 장치(macOS/iOS/watchOS/Android/헤드리스)입니다. 대부분의 node는 운영자 포트에서 Gateway WebSocket을 사용합니다. 선택 사항인 직접 Apple Watch node는 watchOS가 일반 앱의 범용 저수준 네트워킹을 차단하므로 동일한 포트에서 서명된 HTTPS 폴링을 사용합니다. 프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol).

레거시 전송 방식: [브리지 프로토콜](/ko/gateway/bridge-protocol)(TCP JSONL, 현재 node에서는 기록 보존 목적으로만 제공).

macOS는 **node 모드**로도 실행할 수 있습니다. 메뉴 막대 앱은 하나의 node로 Gateway의
WS 서버에 연결합니다(따라서 이 Mac에서 `openclaw nodes …`이 작동합니다). 앱은
네이티브 Canvas, 카메라, 화면, 알림 및 컴퓨터 제어 명령을
`openclaw node run`에서 사용하는 것과 동일한 node-host 명령 표면에 추가합니다. 해당 Mac에서
두 번째 CLI node를 시작하지 마십시오. 앱이 일치하는 CLI node-host 런타임을
내부 워커로 실행하며 유일한 Gateway 연결 및 node ID로 유지됩니다.

Node는 Gateway가 아닌 **주변 장치**입니다. Node는 Gateway 서비스를 실행하지 않으며 채널 메시지(Telegram, WhatsApp 등)는 node가 아니라 Gateway에 도착합니다.

문제 해결 런북: [/nodes/troubleshooting](/ko/nodes/troubleshooting)

## 페어링 + 상태

Node는 **장치 페어링**을 사용합니다. Node는 연결 시 서명된 장치 ID를 제시하며, Gateway는 `role: node`에 대한 장치 페어링 요청을 생성합니다. 장치 CLI(또는 UI)를 통해 승인하십시오. 직접 Apple Watch 설정은 관리자가 발급한 수명이 짧은 node 전용 설정 코드를 사용하여 고정된 저위험 명령 표면을 승인합니다. 이후 기능 확장에는 여전히 일반 승인이 필요합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

대기 중인 페어링 요청은 장치의 마지막 재시도 후 5분이 지나면 만료됩니다. 계속 다시 연결하는 장치는 몇 분마다 새 프롬프트를 발급하는 대신 하나의 대기 중인 요청(및 `requestId`)을 활성 상태로 유지합니다. 전체 요청/승인 수명 주기는 [Node 페어링](/ko/gateway/pairing)을 참조하십시오. Node가 변경된 인증 세부 정보(역할/범위/공개 키)로 재시도하면 이전 대기 중인 요청은 대체되고 새 `requestId`이 생성됩니다. 클라이언트는 대체된 요청에 대한 `device.pair.resolved` 이벤트를 수신하며, 승인하기 전에 `openclaw devices list`을 다시 실행해야 합니다.

- `nodes status`은 장치 페어링 역할에 `node`이 포함된 경우 node를 **페어링됨**으로 표시합니다.
- 접근성 권한이 있는 연결된 네이티브 Mac은 병합된
  물리적 입력 활동을 보고할 수 있습니다. Gateway는 조건을 충족하는 가장 최근 Mac을
  `active`으로 표시하고, 에이전트에 안정적인 node ID 힌트를 제공하며, 지연된 대체 경로를 사용하기 전에
  node 연결 알림을 해당 Mac으로 라우팅합니다. 설정, 개인정보 보호, 타이밍 및
  문제 해결에 대해서는 [활성 컴퓨터 프레즌스](/ko/nodes/presence)를
  참조하십시오.
- 장치 페어링 레코드는 승인된 역할에 대한 영구 계약입니다. 토큰 교체는 해당 계약 내부에서만 이루어지며, 페어링 승인에서 부여하지 않은 역할로 페어링된 node를 업그레이드할 수 없습니다.
- `node.pair.*`(CLI: `openclaw nodes pending/approve/reject/remove/rename`)은 재연결 간에 node의 승인된 명령/기능 표면을 추적하는 별도의 Gateway 소유 node 페어링 저장소입니다. 이는 전송 인증을 **제어하지 않습니다**. 전송 인증은 장치 페어링에서 수행합니다.
- `openclaw nodes remove --node <id|name|ip>`은 node 페어링을 제거합니다. 장치 기반 node에서는 페어링된 장치 저장소에서 해당 장치의 `node` 역할을 취소하고 해당 장치의 node 역할 세션 연결을 해제합니다. 여러 역할을 가진 장치는 행을 유지하고 `node` 역할만 잃지만, node 전용 장치 행은 삭제됩니다. 또한 별도의 node 페어링 저장소에서 일치하는 항목을 모두 삭제합니다. `operator.pairing`은 다른 장치에서 운영자가 아닌 node 행을 제거할 수 있습니다. 여러 역할을 가진 장치에서 자체 node 역할을 취소하는 장치 토큰 호출자에게는 추가로 `operator.admin`이 필요합니다.
- 승인 범위는 대기 중인 요청에서 선언한 명령을 따릅니다.
  - 명령이 없는 요청: `operator.pairing`
  - 실행 이외의 node 명령: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## 버전 차이 및 업그레이드 순서

Gateway WebSocket은 N-1 프로토콜 범위에 속하는 인증된 node 클라이언트를 허용합니다.
따라서 현재 v4 Gateway는 연결에서
`role: "node"` 및 `client.mode: "node"`을 모두 선언하는 경우 v3 node를 허용합니다. 운영자 및 UI 세션은
여전히 현재 프로토콜을 사용해야 합니다.

단계적 플릿 업그레이드에서는 Gateway를 먼저 업그레이드한 다음 각 node를 업그레이드하십시오.
N-1 node는 업그레이드되는 동안에도 표시되고 관리할 수 있습니다. Gateway는
업그레이드 권장 사항과 함께 `legacy node protocol accepted`을 기록합니다. 페어링,
장치 인증, 명령 허용 목록 및 실행 승인은 계속 적용됩니다.
Plugin이 소유한 기능과 명령은 node가
현재 프로토콜로 업그레이드될 때까지 숨겨집니다. N-1보다 오래된 node는 다시
연결하기 전에 대역 외 업그레이드가 필요합니다.

직접 watchOS HTTPS 전송에는 현재 프로토콜 버전이 필요합니다. 직접 모드를 활성화하기 전에
Gateway와 함께 Watch 앱을 업데이트하십시오.

## 원격 node 호스트(system.run)

Gateway가 한 컴퓨터에서 실행되고 다른 컴퓨터에서 명령을 실행하려면 **node 호스트**를 사용하십시오. 모델은 계속 **Gateway**와 통신하며, `host=node`을 선택하면 Gateway가 `exec` 호출을 **node 호스트**로 전달합니다.

| 역할         | 책임                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway 호스트 | 메시지를 수신하고 모델을 실행하며 도구 호출을 라우팅합니다.            |
| Node 호스트    | node 컴퓨터에서 `system.run`/`system.which`을 실행합니다.        |
| 승인    | `~/.openclaw/exec-approvals.json`을 통해 node 호스트에서 적용됩니다. |

승인 참고 사항:

- 승인 기반 node 실행은 정확한 요청 컨텍스트에 바인딩됩니다. 실행 경로는 승인 전에 표준 `systemRunPlan`을 준비합니다. 승인되면 Gateway는 이후 호출자가 편집한 명령/cwd/세션 필드가 아니라 저장된 해당 계획을 전달하고, 실행 전에 작업 디렉터리를 다시 검증합니다.
- 직접 셸/런타임 파일 실행의 경우 OpenClaw는 구체적인 로컬 파일 피연산자 하나도 최선형으로 바인딩하며, 실행 전에 해당 파일이 변경되면 실행을 거부합니다.
- OpenClaw가 인터프리터/런타임 명령에서 정확히 하나의 구체적인 로컬 파일을 식별할 수 없는 경우, 전체 런타임 범위를 지원하는 것처럼 가장하지 않고 승인 기반 실행을 거부합니다. 더 광범위한 인터프리터 의미 체계에는 샌드박싱, 별도 호스트 또는 명시적으로 신뢰된 허용 목록/전체 워크플로를 사용하십시오.

### node 호스트 시작(포그라운드)

node 컴퓨터에서 다음을 실행합니다.

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run`은 `--context-path`(Gateway WS 컨텍스트 경로), `--tls`, `--tls-fingerprint <sha256>` 및 `--node-id`(레거시 클라이언트 인스턴스 ID 재정의, 페어링은 재설정되지 않음)도 허용합니다.

### SSH 터널을 통한 원격 Gateway(루프백 바인딩)

Gateway가 루프백(`gateway.bind=loopback`, 로컬 모드의 기본값)에 바인딩되면 원격 node 호스트는 직접 연결할 수 없습니다. SSH 터널을 생성하고 node 호스트가 터널의 로컬 끝점을 가리키도록 설정하십시오.

예시(node 호스트 -> Gateway 호스트):

```bash
# 터미널 A(계속 실행): 로컬 18790 -> Gateway 127.0.0.1:18789 전달
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 터미널 B: Gateway 토큰을 내보내고 터널을 통해 연결
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고:

- `openclaw node run`은 토큰 또는 비밀번호 인증을 지원합니다.
- 환경 변수가 우선됩니다: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- 구성 대체 값은 `gateway.auth.token` / `gateway.auth.password`입니다.
- 로컬 모드에서 node 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`을 무시합니다.
- 원격 모드에서는 원격 우선순위 규칙에 따라 `gateway.remote.token` / `gateway.remote.password`을 사용할 수 있습니다.
- 활성 로컬 `gateway.auth.*` SecretRef가 구성되어 있지만 확인되지 않으면 node-host 인증은 실패 시 차단됩니다.
- Node-host 인증 확인은 `OPENCLAW_GATEWAY_*` 환경 변수만 따릅니다.

### node 호스트 시작(서비스)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install`은 `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id`(레거시 클라이언트 인스턴스 ID 전용), `--runtime <node>`(기본값: node) 및 재설치를 위한 `--force`도 허용합니다. `node status`, `node stop` 및 `node uninstall`도 사용할 수 있습니다.

### 페어링 + 이름 지정

Gateway 호스트에서 다음을 실행합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node가 변경된 인증 세부 정보로 재시도하면 `openclaw devices list`을 다시 실행하고 현재 `requestId`을 승인하십시오.

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`의 `--display-name`(클라이언트 인스턴스 ID 및 Gateway 연결 메타데이터와 함께 공유 `node_host_config` SQLite 행에 유지됨).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`(Gateway 재정의).

### Node 호스팅 MCP 서버

Gateway가 아니라 node 컴퓨터의 `openclaw.json`에서 MCP 서버를
구성하십시오.

```json5
{
  nodeHost: {
    mcp: {
      servers: {
        localDocs: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", "/srv/docs"],
          toolFilter: {
            include: ["read_*", "search"],
          },
        },
        internalApi: {
          url: "https://mcp.internal.example/mcp",
          transport: "streamable-http",
          headers: {
            Authorization: "Bearer ${INTERNAL_MCP_TOKEN}",
          },
        },
      },
    },
  },
}
```

헤드리스 node 호스트는 이러한 서버를 시작하고 도구 목록을 생성한 후 연결되면
설명자를 게시합니다. 도구 호출은 `mcp.tools.call.v1`을 통해 해당 node로
돌아갑니다. Gateway에는 일치하는 MCP 구성이나 JS
Plugin이 필요하지 않습니다. OAuth MCP 서버는 이 node 호스팅 v1 경로에서 지원되지 않습니다.

현재 node 호스트는 MCP 서버가 구성되지 않은 경우에도
초기 페어링 중에 기본 제공 `mcp.tools.call.v1` 명령 계열을 선언합니다. 이전
OpenClaw 버전에서 페어링된 node는 node 호스트가 업데이트된 후 일회성 명령 표면 업그레이드를
요청할 수 있습니다. 승인된 명령 계열은 변경되지 않으므로 이후 서버를 추가, 제거 또는 필터링해도
다시 페어링할 필요가 없습니다. Node MCP 구성 변경 사항을 적용하려면
`openclaw node run` 또는 `openclaw node restart`을 다시 시작하십시오.
Node 호스트는 이 구성을 감시하지 않습니다.

Gateway 운영자는
`gateway.nodes.pluginTools.enabled: false`을 사용하여 node 호스팅 MCP 도구를 포함해 페어링된 node가 게시한 에이전트 표시 도구를 모두 무시할 수 있습니다.
`gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`과 같은 정확한 명령 거부 규칙도
실행을 차단합니다.

### Node 호스팅 Skills

Node 컴퓨터의 활성 OpenClaw Skills 디렉터리(기본값:
`~/.openclaw/skills`) 아래에 Skills를 설치하십시오. `OPENCLAW_HOME`, `OPENCLAW_STATE_DIR` 및
`OPENCLAW_CONFIG_PATH`은 해당 활성 프로필을 이동합니다. Skills에서는 `OPENCLAW_STATE_DIR`이
우선합니다. 그렇지 않으면 `skills/`은
`openclaw config file`에서 출력한 경로 옆에 있습니다. 헤드리스 node 호스트는 연결 후
유효한 `SKILL.md` 파일을 게시하며, Gateway는 해당 node의 연결이 유지되는 동안에만
이를 에이전트 Skills 스냅샷에 추가합니다. 추상 node 로케이터가 다른
프로토콜 필드를 추가하지 않고 하나의 항목에 매핑되도록 각 Skills 디렉터리 이름은 `name`
프런트매터 필드와 일치해야 합니다.

초기 Node 역할 페어링으로 Skills 게시가 승인됩니다. Skills를 추가, 제거 또는
변경해도 다시 페어링하거나 Gateway 구성을
변경할 필요가 없습니다. Node Skills 파일을 변경한 후에는
`openclaw node run` 또는 `openclaw node restart`을(를) 다시 시작하십시오. Node 호스트는 Skills 디렉터리를 감시하지 않습니다.

Node 호스팅 Skills 항목은 해당 Node를 식별하고 실행
위치를 포함합니다. Skills 파일, 상대 경로로 참조된 파일 및 바이너리는 해당
Node에 유지됩니다. 에이전트는 일반 `read` 도구를 사용하여
게시된 `node://.../SKILL.md` 위치를 읽습니다. `file_fetch`은(는) Node Skills 로케이터가 아니라 운영자가 승인한 절대 Node 경로를 허용합니다.
일반 읽기 도구가 없는 런타임은 대신 게시된
`node://.../skills/<name>` 디렉터리를 `workdir`(으)로 지정하여
`exec host=node node=<node-id>`을(를) 통해 `cat SKILL.md`을(를) 실행할 수 있습니다. 참조된 파일과 바이너리는
동일한 실행 대상과 작업 디렉터리를 사용합니다. Node 호스트는 해당 로케이터를
활성 OpenClaw 상태 디렉터리를 기준으로 해석하므로 상대 경로는
Gateway 컴퓨터가 아니라 Node에서 해석됩니다. 게시하는 Node에는 `system.run`이(가) 승인되어 있어야 하며
에이전트의 실행 정책에서 `host=node`을(를) 허용해야 합니다. 그렇지 않으면 해당 Skills는
그 에이전트의 스냅샷에 포함되지 않습니다.

게시를 중지하려면 Node에서 `nodeHost.skills.enabled: false`을(를) 설정하십시오. Gateway
운영자는 `gateway.nodes.skills.enabled: false`을(를) 사용하여 페어링된 모든 Node의 Skills를
무시할 수 있습니다.

### 헤드리스 ID 상태

헤드리스 Node는 세 개의 개별 상태 레코드를 유지합니다.

- `~/.openclaw/state/openclaw.sqlite` (`node_host_config`): 클라이언트 인스턴스 ID, 표시 이름 및 Gateway 연결 메타데이터입니다.
- `~/.openclaw/identity/device.json`: 서명된 기기 키 쌍과 여기에서 파생된 암호화 기기 ID입니다.
- `~/.openclaw/identity/device-auth.json`: 암호화 기기 ID와 역할을 키로 사용하는 페어링된 기기 인증 토큰입니다.

서명된 Node의 경우 Gateway는 페어링 및
Node 라우팅에 암호화 기기 ID를 사용합니다. 클라이언트 인스턴스 ID는 연결 메타데이터일 뿐입니다. 따라서
`--node-id`을(를) 변경하거나 사용 중단된 `node.json`을(를) 마이그레이션해도 페어링이 재설정되지 않습니다. 지원되는
해제 후 재페어링 절차와 업그레이드 참고 사항은
[ID 및 페어링 상태](/ko/cli/node#identity-and-pairing-state)를 참조하십시오.

### 명령어를 허용 목록에 추가

실행 승인은 **Node 호스트별로** 적용됩니다. Gateway에서 허용 목록 항목을 추가하십시오.

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

승인 정보는 Node 호스트의 `~/.openclaw/exec-approvals.json`에 저장됩니다.

### 실행 대상을 Node로 지정

기본값을 구성합니다(Gateway 구성).

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별로 구성합니다.

```text
/exec host=node security=allowlist node=<id-or-name>
```

설정한 후에는 `host=node`이(가) 포함된 모든 `exec` 호출이 Node 호스트에서 실행됩니다(Node 허용 목록/승인의 적용을 받음).

`host=auto`은(는) 자체적으로 Node를 암시적으로 선택하지 않지만, `auto`에서 명시적인 호출별 `host=node` 요청을 사용할 수 있습니다. 세션의 기본 실행 대상을 Node로 지정하려면 `tools.exec.host=node` 또는 `/exec host=node ...`을(를) 명시적으로 설정하십시오.

관련 항목:

- [Node 호스트 CLI](/ko/cli/node)
- [실행 도구](/ko/tools/exec)
- [실행 승인](/ko/tools/exec-approvals)

### 로컬 모델 추론

데스크톱 또는 서버 Node는 해당 Node에서 실행 중인 Ollama 서버의 채팅 지원 모델을 노출할 수 있습니다. 에이전트는 Ollama Plugin의 `node_inference` 도구를 사용하여 설치된 모델을 검색하고 제한된 프롬프트를 원격으로 실행합니다. Gateway에는 Ollama에 대한 직접 네트워크 액세스가 필요하지 않습니다. 설정, 모델 필터링 및 직접 검증 명령어는 [Ollama Node 로컬 추론](/ko/providers/ollama#node-local-inference)을 참조하십시오.

### Codex 세션 및 트랜스크립트

공식 `codex` Plugin은 헤드리스 Node 호스트 또는 네이티브 macOS Node에서
보관되지 않은 Codex 세션을 노출할 수 있습니다. 카탈로그 등록은 더 이상
`supervision.enabled`에 의존하지 않으며, 해당 옵션은 에이전트용 감독 도구를 제어합니다.
Provider 또는 하네스를 비활성화하지 않고 운영자 카탈로그 및 페어링된 Node 카탈로그 명령어를
비활성화하려면 Codex Plugin 구성에서 `sessionCatalog.enabled: false`을(를) 설정하십시오.
Plugin은 두 컴퓨터 모두에서 계속 활성 상태여야 하며, Node 설정은 로컬 동의로 유지됩니다.
Gateway에서만 활성화해서는 다른 컴퓨터의 Codex 상태를 읽을 수 없습니다.

Node는 버전이 지정된 읽기 전용
`codex.appServer.threads.list.v1` 및
`codex.appServer.thread.turns.list.v1` 명령어를 게시합니다. Codex CLI를 사용할 수 있는 네이티브 Node 호스트는
`codex.terminal.resume.v1`도 게시합니다. 이러한 명령어가 처음 표시되면 Node 페어링
업그레이드를 승인하십시오. Gateway는 일반 Plugin Node 정책을 통해 명령어를
호출하고 호스트별로 장애를 격리합니다.

페어링된 Node의 행은 일반 세션 사이드바에 **Codex** 그룹으로 표시됩니다.
기본적으로 행을 선택하면 일반 채팅 창이 열리고, 전체 항목 프로젝션을 사용하는 제한된 커서 기반 페이지 매김
`thread/turns/list` 호출을 통해 저장된 트랜스크립트를 읽습니다.
행 메뉴, 뷰어 헤더 또는 **Open Codex/Claude sessions in** 기본 설정을 사용하여 세션을 소유한 컴퓨터의 운영자 터미널에서 `codex resume <thread-id>`을(를) 시작하십시오. 페어링된 Node의 터미널 경로는 Codex Plugin이 소유하는 허용 목록 기반 PTY 릴레이이며, 임의의 Node 명령 실행이 아닙니다.

이 릴레이는 전체 OpenClaw 하네스의 계속 실행 및 보관 소유권 계약을 제공하지 않습니다. 따라서 원격 행에서는 **계속** 및 **보관**을 사용할 수 없습니다. Gateway 컴퓨터에서는 저장되어 있고 유휴 상태인
행에서 모델이 고정된 별도의 채팅 분기를 시작할 수 있습니다. 두 유형 모두
다른 Codex 클라이언트가 사용 중이지 않음을 운영자가 확인한 후에만 보관할 수 있습니다. 저장된
행의 실시간 활동 여부는 알 수 없습니다. 활성 행은 분기하거나 보관할 수 없습니다.

설정, 페이지 매김, 로컬 계속 실행 및 메타데이터 보안 경계는
[Codex 세션 감독](/ko/plugins/codex-supervision)을 참조하십시오.

### Claude 세션 및 트랜스크립트

번들 `anthropic` Plugin은 기본적으로 Gateway와 페어링된 Node에서 보관되지 않은 Claude CLI 및 Claude
Desktop 세션을 검색합니다. Anthropic 모델이나 Claude CLI 백엔드를
비활성화하지 않고 운영자 카탈로그 및 페어링된 Node 카탈로그 명령어를 비활성화하려면
`plugins.entries.anthropic.config.sessionCatalog.enabled: false`을(를) 설정하십시오.
Anthropic Plugin이 활성화되어 있고 `~/.claude/projects/`이(가) 존재하면 원격 macOS 앱 Node는
`anthropic.claude.sessions.list.v1` 및 `anthropic.claude.sessions.read.v1`을(를)
게시합니다. 이러한 명령어가 처음 표시되면 Node 페어링 업그레이드를 승인하십시오.

Claude CLI를 사용할 수 있는 네이티브 Node 호스트는
`anthropic.claude.terminal.resume.v1`도 게시합니다. 조건을 충족하는 CLI 및 Desktop 행은
소유 호스트의 운영자 터미널에서 `claude --resume <session-id>`을(를) 열 수 있습니다.
이는 네이티브 세션을 인계하는 동작입니다. OpenClaw 도입과 달리 먼저 Claude 세션을
분기하지 않습니다.

카탈로그는 유효한 Claude CLI 프로젝트 인덱스 레코드와 현재 `sdk-cli` JSONL 파일의 제한된
메타데이터 접두부를 결합합니다. Claude Desktop의 로컬
메타데이터는 Desktop 제목과 보관 상태를 제공합니다. 두 소스가 동일한 Claude Code 세션 ID를
참조하면 Desktop 메타데이터가 우선합니다. CLI에는 보관 플래그가 없으므로 CLI 전용 트랜스크립트는
계속 표시됩니다. 트랜스크립트 읽기는 불투명한 바이트 오프셋 커서와 제한된 역방향 파일 읽기를 사용하므로
대용량 세션을 선택하거나 이전 페이지를 로드해도 전체 JSONL 기록을 하나의
Gateway 응답으로 읽지 않습니다.

목록 및 읽기 명령어는 읽기 전용입니다. 이러한 명령어는 `operator.write`을(를) 보유한 인증된 운영자 연결에
일반 `sessions.catalog.list` 및
`sessions.catalog.read` 메서드를 통해서만 카탈로그 메타데이터와 트랜스크립트
콘텐츠를 노출합니다. Gateway 로컬 Claude CLI 행은 일반
채팅 작성기에서 도입할 수 있습니다. OpenClaw는 제한된 표시 기록을 가져오고,
첫 번째 턴에서 `--fork-session`을(를) 사용하여 재개하며, 원본 트랜스크립트는 그대로 둡니다.

헤드리스 Node 호스트는 동일한 계속 실행 흐름을 선택적으로 활성화할 수 있습니다.

```json5
{
  nodeHost: {
    agentRuns: {
      claude: { enabled: true },
    },
  },
}
```

Node는 이 Node 로컬 설정이 활성화되어 있고 해당 Node에서 `claude` 실행 파일을
확인할 수 있을 때만 `agent.cli.claude.run.v1`을(를) 게시합니다. Gateway에서는
이를 원격으로 활성화할 수 없습니다. 이 명령어에는 Node의 기존 실행
승인 정책도 적용됩니다. 세 가지 Claude 명령어가 모두 게시되고 Gateway의 Node 명령어 정책에서
허용되면 해당 Node의 Claude CLI
행을 계속 실행할 수 있습니다. OpenClaw는 제한된 기록을 가져오고,
도입된 세션을 해당 Node 및 카탈로그에 보고된 작업 디렉터리에 바인딩한 다음,
각 단발성 `claude -p` 턴을 그곳에서 실행합니다. 첫 번째 턴에서는 계속
`--fork-session`을(를) 사용하여 원본 트랜스크립트를 보존합니다.

Node에 배치된 턴은 Node의 Claude 기본값을 사용합니다. v1에서는
Gateway 루프백 MCP 구성 또는 Gateway Skills Plugin을 수신하지 않으며, Gateway 트랜스크립트에서
다시 시드할 수 없고 첨부 파일과 이미지를 거부합니다. Claude Desktop 행 및
실행 명령어를 게시하지 않는 Node는 보기 전용으로 유지됩니다. macOS 앱
Node는 아직 이 명령어를 게시하지 않으므로 해당 행은 보기 전용으로 유지됩니다.

Control UI 동작과 저장소 소스는
[Anthropic: 컴퓨터 간 Claude 세션](/ko/providers/anthropic#claude-sessions-across-computers)을
참조하십시오.

### OpenCode 및 Pi 세션

번들 OpenCode 및 ACPX Plugin도 Gateway와 페어링된 Node에서 읽기 전용 네이티브 세션
카탈로그를 검색합니다. `opencode`
CLI가 설치되어 있으면 Node는 `opencode.sessions.list.v1` / `opencode.sessions.read.v1`을(를) 게시하고,
Pi의 세션 디렉터리가 있으면 `acpx.pi.sessions.list.v1` / `acpx.pi.sessions.read.v1`을(를)
게시합니다. 새 명령어가 처음 표시되면 Node 페어링 업그레이드를 승인하십시오. 일치하는 CLI도 사용할 수 있으면 Node는
`opencode.terminal.resume.v1` 또는 `acpx.pi.terminal.resume.v1`을(를) 추가합니다. 그러면 기존 행
메뉴와 뷰어 헤더에서 `opencode --session <id>` 또는 `pi --session <id>`을(를) 사용하여 선택한 세션을 소유
터미널에서 다시 열 수 있습니다.

OpenCode는 공식 CLI JSON/내보내기 표면을 통해 읽습니다. Pi는 프로젝트 및 전역 `settings.json`
세션 디렉터리와 `PI_CODING_AGENT_DIR` 및
`PI_CODING_AGENT_SESSION_DIR` 재정의를 포함하여 문서화된 JSONL 세션 저장소를 읽습니다. 두 카탈로그 모두 기본적으로 활성화되어 있습니다.
Web UI의 **Config > Plugins**에서 비활성화하십시오.

터미널 재개는 저장된 세션 작업 디렉터리와 Codex 및 Claude와 동일한
허용 목록 기반 양방향 PTY 릴레이를 사용합니다. 임의의
Node 명령 실행을 노출하지 않습니다.

### 터미널 파일 업로드

Control UI에서는 열린 페어링 Node 터미널로 파일을 끌어다 놓을 수 있습니다. 네이티브 Node 호스트는 관리자 전용 `terminal.upload` 명령어를 게시합니다. 이 명령어가 처음 표시되면 페어링 업그레이드를 승인하십시오. 각 파일의 크기는 16 MiB로 제한되며 해당 Node의 비공개 임시 디렉터리에 준비되고, 실행되지 않은 채 셸에서 인용된 경로로 터미널에 반환됩니다.

경로 삽입은 PowerShell, `cmd.exe` 및 인식된 POSIX 셸(`sh`, Bash, Dash, Ash, Ksh, Zsh, Fish)을 지원하며 Windows의 Git Bash도 포함됩니다. 인용 규칙을 안전하게 추론할 수 없으므로 다른 셸 재정의는 거부됩니다. 네이티브 WSL 경로를 사용하려면 WSL 내부에서 Node 호스트를 실행하십시오. `%` 또는 `!`이(가) 포함된 `cmd.exe` 경로도 해당 셸이 큰따옴표 안에서도 이러한 문자를 확장하므로 거부됩니다.

## 명령어 호출

저수준(원시 RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke`은(는) `system.run` 및 `system.run.prepare`을(를) 차단합니다. 이러한 명령어는 `host=node`을(를) 사용하여 `exec` 도구를 통해서만 실행됩니다(위 내용 참조). 일반적인 "에이전트에 MEDIA 첨부 파일 제공" 워크플로(캔버스, 카메라, 화면, 위치, 아래 참조)를 위한 상위 수준 도우미가 제공됩니다.

장기 실행 스트리밍 Node 명령은 추가형 `node.invoke.progress`
이벤트를 사용합니다. 각 이벤트에는 호출 ID, 0부터 시작하는 시퀀스 번호 및
크기가 제한된 UTF-8 텍스트 청크가 포함되며, Gateway는 호출자에게 전달하기 전에
청크를 순서대로 정렬합니다. 기존 `node.invoke.result`은 단일 최종
응답으로 유지됩니다. 스트리밍 호출자는 첫 번째 진행 이벤트부터 시작되고
후속 진행 이벤트가 발생할 때마다 재설정되는 비활성 제한 시간을 설정할 수 있으며,
승인 및 실행 중에는 호출의 별도 하드 타임아웃이 계속 유지됩니다. 결과, 하드
타임아웃, 비활성 타임아웃 및 Node 연결 해제는 모두 보류 중인 스트림
상태를 삭제합니다. 호출자 취소 시 `node.invoke.cancel`이 발생하며, 이후 Node 호스트는
일치하는 프로세스 트리를 종료합니다. 기존 요청/응답 명령은 변경되지 않습니다.

## 명령 정책

Node 명령을 호출하려면 두 가지 게이트를 통과해야 합니다.

1. Node는 인증된 연결 메타데이터에 명령을 선언해야 합니다(`connect.commands`).
2. Gateway의 플랫폼 및 승인에서 파생된 허용 목록에 선언된 명령이 포함되어야 합니다.

플랫폼별 기본 허용 목록(Plugin 기본값 및 `allowCommands`/`denyCommands` 재정의 적용 전):

| 플랫폼 | 기본적으로 허용되는 명령                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify`(`system.run` 같은 Node 호스트 명령은 승인 게이트를 거칩니다. 아래를 참조하십시오.)                                                                                                                                                                                                                                  |

이 행들은 모든 Node 앱에서 구현되는 명령이 아니라 Gateway 정책의 상한을 설명합니다. 연결된 Node도 명령을 선언한 경우에만 해당 명령을 사용할 수 있습니다. 특히 현재 macOS 앱은 macOS 정책 행에 나열된 기기 및 개인 데이터 명령군을 선언하지 않습니다.

`canvas.*` 명령(`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`)은 iOS, Android, macOS, Windows, Linux 및 알 수 없는 플랫폼의 Plugin 기본값입니다. Linux Node는 데스크톱 앱의 로컬 Canvas 소켓이 있는 경우에만 이를 선언합니다. iOS에서는 모든 Canvas 명령이 포그라운드로 제한됩니다.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` 및 `talk.ptt.once`은 플랫폼 레이블과 관계없이 `talk` 기능을 알리거나 `talk.*` 명령을 선언하는 모든 Node에서 기본적으로 허용됩니다.

데스크톱 호스트 명령(macOS/Windows의 `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1` 및 `screen.snapshot`)은 위의 정적 플랫폼 기본값 표에 포함되지 않습니다. 운영자가 이러한 명령을 선언하는 페어링 요청을 승인하면 사용할 수 있게 되며, 이후 Node의 승인된 명령 집합에 포함되어 재연결 시에도 유지됩니다.

위험하거나 개인정보에 크게 관련된 명령은 Node가 선언하더라도 `gateway.nodes.allowCommands`을 통해 명시적으로 옵트인해야 합니다: `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `health.summary`, `sms.send`, `sms.search`. `gateway.nodes.denyCommands`은 항상 기본값과 추가 허용 목록 항목보다 우선합니다. iPhone 동의 게이트는 [HealthKit 요약](/platforms/ios-healthkit)을, 데스크톱 입력에 적용되는 추가 macOS, 도구 정책 및 활성화 게이트는 [컴퓨터 사용](/ko/nodes/computer-use)을 참조하십시오.

Plugin 소유 Node 명령은 Gateway Node 호출 정책을 추가할 수 있습니다. 이 정책은 허용 목록 검사 후 Node로 전달하기 전에 실행되므로 원시 `node.invoke`, CLI 도우미 및 전용 에이전트 도구에 동일한 Plugin 권한 경계가 적용됩니다. 위험한 Plugin Node 명령은 여전히 명시적으로 `gateway.nodes.allowCommands`에 옵트인해야 합니다.

Node가 선언된 명령 목록을 변경한 후에는 이전 기기 페어링을 거부하고 새 요청을 승인하여 Gateway가 업데이트된 명령 스냅샷을 저장하도록 하십시오.

## 구성(`openclaw.json`)

Node 관련 설정은 `gateway.nodes` 및 `tools.exec` 아래에 있습니다.

```json5
{
  gateway: {
    nodes: {
      // 신뢰할 수 있는 네트워크(CIDR 목록)에서 처음 이루어지는 Node 페어링을 자동 승인합니다.
      // 설정하지 않으면 비활성화됩니다. 요청된 범위가 없는 최초 role:node 요청에만
      // 적용되며 업그레이드는 자동 승인하지 않습니다.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
        // SSH로 검증된 자동 승인(기본값: 활성화). SSH를 통해 다시 읽은 기기 키가
        // 정확히 일치하면 최초 Node 페어링을 승인합니다.
        sshVerify: true,
      },
      // 페어링된 Node에서 게시한 에이전트 표시 Plugin 도구를 신뢰합니다(기본값: true).
      pluginTools: {
        enabled: true,
      },
      // 위험하거나 개인정보에 크게 관련된 Node 명령(camera.snap 등)에 옵트인합니다.
      allowCommands: ["camera.snap", "screen.record"],
      // 기본값 또는 allowCommands에 포함되어 있어도 정확히 일치하는 명령 이름을 차단합니다.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // 기본 exec 호스트: "node"는 모든 exec 호출을 페어링된 Node로 라우팅합니다.
      host: "node",
      // Node exec의 보안 모드: 승인되었거나 허용 목록에 있는 명령만 허용합니다.
      security: "allowlist",
      // exec를 특정 Node(ID 또는 이름)로 고정합니다. 모든 Node를 허용하려면 생략합니다.
      node: "build-node",
    },
  },
}
```

정확한 Node 명령 이름을 사용하십시오. `denyCommands`은 플랫폼 기본값 또는 `allowCommands` 항목에서 달리 허용하더라도 명령을 제거합니다. 페어링된 Node는 기본적으로 에이전트 표시 Plugin 도구 설명자를 게시할 수 있지만, 각 설명자의 명령은 여전히 Node의 승인된 명령 표면에 포함되어야 합니다. 이러한 설명자를 모두 무시하려면 `gateway.nodes.pluginTools.enabled: false`을 설정하십시오. Gateway Node 페어링 및 명령 정책 필드에 관한 자세한 내용은 [Gateway 구성 참조](/ko/gateway/configuration-reference#gateway)를 확인하십시오.

에이전트별 exec Node 재정의:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: { exec: { node: "build-node" } },
      },
    ],
  },
}
```

## 스크린샷(Canvas 스냅샷)

Node에서 Canvas(WebView)를 표시하고 있으면 `canvas.snapshot`은 `{ format, base64 }`을 반환합니다.

CLI 도우미(임시 파일에 쓰고 저장된 경로를 출력합니다):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 제어

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

참고:

- `canvas present`은 로컬 경로를 지원하는 Node에서 URL 또는 로컬 파일 경로(`--target`)를 허용하며, 위치 지정을 위한 선택적 `--x/--y/--width/--height`도 허용합니다. Linux Canvas는 HTTP(S) URL 또는 번들 A2UI 렌더러를 허용합니다.
- `canvas eval`는 인라인 JS(`--js`) 또는 위치 인수를 허용합니다.

### A2UI(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고:

- 모바일 및 Linux 데스크톱 Node는 작업이 가능한 렌더링을 위해 번들로 제공되는 앱 소유 A2UI 페이지를 사용합니다.
- A2UI v0.8 JSONL만 지원됩니다(v0.9/createSurface는 거부됩니다).
- iOS 및 Android는 원격 Gateway Canvas 페이지를 렌더링하지만, A2UI 버튼 작업은 번들로 제공되는 앱 소유 A2UI 페이지에서만 디스패치됩니다. Gateway에서 호스팅되는 HTTP/HTTPS A2UI 페이지는 해당 모바일 클라이언트에서 렌더링만 가능합니다.
- macOS는 앱에서 선택한 정확한 기능 범위 Gateway A2UI 페이지의 작업을 디스패치할 수 있습니다. 다른 HTTP/HTTPS 페이지는 렌더링만 가능합니다.
- Linux는 번들 A2UI 페이지에서만 작업을 디스패치합니다. 다른 HTTP/HTTPS 페이지는 렌더링만 가능하며, 데스크톱 앱이 없는 헤드리스 Linux Node는 Canvas를 알리지 않습니다.

## 사진 및 동영상(Node 카메라)

사진(`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 기본값: 전면 및 후면 모두(MEDIA 줄 2개)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

동영상 클립(`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고:

- `canvas.*` 및 `camera.*`을 사용하려면 Node가 **포그라운드에 있어야** 합니다(백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다).
- Node는 base64 페이로드를 관리 가능한 크기로 유지하기 위해 클립 길이를 제한합니다(정확한 플랫폼별 제한은 [카메라 캡처](/ko/nodes/camera)를 참조하십시오). 또한 `nodes` 에이전트 도구는 호출을 전달하기 전에 요청된 `durationMs`을 300000(5분)으로 제한하며, Node 자체에서는 더 엄격한 제한을 적용합니다.
- Android는 가능한 경우 `CAMERA`/`RECORD_AUDIO` 권한을 요청하며, 권한이 거부되면 `*_PERMISSION_REQUIRED` 오류가 발생합니다.

## 화면 녹화(Node)

지원되는 Node는 `screen.record`(mp4)을 노출합니다. 예:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고:

- `screen.record` 사용 가능 여부는 Node 플랫폼에 따라 달라집니다.
- `nodes` 에이전트 도구는 요청된 `durationMs`을 300000(5분)으로 제한합니다. Node는 반환되는 페이로드 크기를 제한하기 위해 더 엄격한 제한을 적용할 수 있습니다.
- `--no-audio`은 지원되는 플랫폼에서 마이크 캡처를 비활성화합니다.
- 여러 화면을 사용할 수 있는 경우 `--screen <index>`을 사용하여 디스플레이를 선택하십시오(0 = 기본 디스플레이).

## 위치(Node)

설정에서 위치가 활성화되어 있으면 Node가 `location.get`을 노출합니다.

CLI 도우미:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고:

- 위치는 **기본적으로 꺼져 있습니다**.
- "항상"은 시스템 권한이 필요하며, 백그라운드 가져오기는 최선형으로 수행됩니다.
- 응답에는 위도/경도, 정확도(미터), 타임스탬프가 포함됩니다.
- 전체 매개변수/응답 형식 및 오류 코드: [위치 명령](/ko/nodes/location-command).

## SMS(Android Node)

사용자가 **SMS** 권한을 부여하고 기기가 전화 통신을 지원하면 Android Node가 `sms.send` 및 `sms.search`을 노출할 수 있습니다. 두 명령 모두 기본적으로 위험 명령입니다. 호출하려면 Gateway 운영자가 해당 명령을 `gateway.nodes.allowCommands`에도 추가해야 합니다([명령 정책](#command-policy) 참조).

읽기 전용 SMS 검색을 사용하려면 `openclaw.json`에서 명시적으로 옵트인하십시오.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Node가 메시지를 보낼 수도 있어야 하는 경우에만 `sms.send`을 별도로 추가하십시오. Android 권한과 Gateway 명령 승인은 서로 독립적입니다. 휴대전화 권한을 부여해도 Gateway 정책은 변경되지 않습니다.

저수준 호출:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고:

- `READ_SMS`이 부여되기 전에 `sms.search`을 선언하여 호출 시 권한 진단을 반환하도록 할 수 있습니다. 메시지를 읽으려면 여전히 해당 Android 권한이 필요합니다.
- 전화 통신 기능이 없는 Wi-Fi 전용 기기는 `sms.send`을 알리지 않습니다.
- `requires explicit gateway.nodes.allowCommands opt-in` 오류는 휴대전화가 명령을 선언했지만 Gateway 운영자가 이를 승인하지 않았음을 의미합니다.

## 기기 및 개인 데이터 명령

iOS 및 Android Node는 기본적으로 여러 읽기 전용 데이터 명령을 알립니다([명령 정책](#command-policy) 표 참조). Android는 자체 앱 내 설정으로 제한되는 더 많은 명령 계열도 노출합니다.

사용 가능한 계열:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — Android 전용. `device.apps`은 Android Settings에서 Installed Apps 공유를 활성화해야 하며 기본적으로 런처에 표시되는 앱을 반환합니다.
- `notifications.list`, `notifications.actions` — Android 전용.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android(기본값은 읽기 전용). `contacts.add`은 위험하며 `gateway.nodes.allowCommands`이 필요합니다.
- `calendar.events` — iOS, Android(기본값은 읽기 전용). `calendar.add`은 위험하며 `gateway.nodes.allowCommands`이 필요합니다.
- `reminders.list` — iOS, Android(기본값은 읽기 전용). `reminders.add`은 위험하며 `gateway.nodes.allowCommands`이 필요합니다.
- `callLog.search` — Android 전용.
- `motion.activity`, `motion.pedometer` — iOS, Android. 사용 가능한 센서의 기능에 따라 제한됩니다.

호출 예시:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 시스템 명령(Node 호스트/mac Node)

macOS Node는 `system.run`, `system.which`, `system.notify`, `system.execApprovals.get/set`을 노출합니다. 헤드리스 Node 호스트는 `system.run.prepare`, `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예시:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

참고:

- `system.run`은 페이로드에 표준 출력/표준 오류/종료 코드를 반환합니다.
- 이제 셸 실행은 `host=node`을 사용하는 `exec` 도구를 통해 수행됩니다. `nodes`은 명시적인 Node 명령을 위한 직접 RPC 표면으로 유지됩니다.
- `nodes invoke`은 `system.run` 또는 `system.run.prepare`을 노출하지 않습니다. 이들은 exec 경로에서만 유지됩니다.
- exec 경로는 승인 전에 표준 `systemRunPlan`을 준비합니다. 승인이 부여되면 Gateway는 이후 호출자가 수정한 명령/cwd/세션 필드가 아니라 저장된 해당 계획을 전달합니다.
- `system.notify`은 macOS 앱의 알림 권한 상태를 따르며 `--priority <passive|active|timeSensitive>` 및 `--delivery <system|overlay|auto>`을 지원합니다.
- 인식되지 않는 Node의 `platform` / `deviceFamily` 메타데이터에는 `system.run` 및 `system.which`을 제외하는 보수적인 기본 허용 목록이 사용됩니다. 알 수 없는 플랫폼에서 해당 명령이 의도적으로 필요한 경우 `gateway.nodes.allowCommands`을 통해 명시적으로 추가하십시오.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- 셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 `--env` 값은 명시적인 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로 축소됩니다.
- 허용 목록 모드에서 항상 허용 결정이 내려지면 알려진 디스패치 래퍼(`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신 내부 실행 파일 경로를 저장합니다. 안전하게 래핑을 해제할 수 없으면 허용 목록 항목이 자동으로 저장되지 않습니다.
- 허용 목록 모드의 Windows Node 호스트에서는 `cmd.exe /c`을 통한 셸 래퍼 실행에 승인이 필요합니다(허용 목록 항목만으로는 래퍼 형식이 자동 허용되지 않습니다).
- Node 호스트는 `--env`의 `PATH` 재정의를 무시하며, 명령을 실행하기 전에 관리되는 대규모 인터프리터/셸 시작 변수 집합(예: `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`)을 제거합니다. 추가 PATH 항목이 필요한 경우 `--env`을 통해 `PATH`을 전달하는 대신 Node 호스트 서비스 환경을 구성하거나 표준 위치에 도구를 설치하십시오.
- macOS Node 모드에서 `system.run`은 macOS 앱의 exec 승인(Settings → Exec approvals)에 의해 제한됩니다. 요청/허용 목록/전체 모드는 헤드리스 Node 호스트와 동일하게 작동하며, 거부된 프롬프트는 `SYSTEM_RUN_DENIED`을 반환합니다.
- 헤드리스 Node 호스트에서 `system.run`은 exec 승인(`~/.openclaw/exec-approvals.json`)에 의해 제한됩니다. macOS의 경우 아래 [헤드리스 Node 호스트](#headless-node-host-cross-platform)에서 exec 호스트 라우팅 환경 변수를 참조하십시오.

## exec Node 바인딩

여러 Node를 사용할 수 있는 경우 exec를 특정 Node에 바인딩할 수 있습니다. 그러면 `exec host=node`의 기본 Node가 설정되며, 에이전트별로 재정의할 수 있습니다.

전역 기본값:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

에이전트별 재정의:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

모든 Node를 허용하려면 설정을 해제하십시오.

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 권한 맵

Node는 `node.list` / `node.describe`에 `permissions` 맵을 포함할 수 있습니다. 이 맵은 권한 이름(예: `screenRecording`, `accessibility`, `location`)을 키로 사용하고 불리언 값(`true` = 부여됨)을 갖습니다.

## 헤드리스 Node 호스트(크로스 플랫폼)

OpenClaw는 Gateway WebSocket에 연결하여 `system.run` / `system.which`을 노출하는 **헤드리스 Node 호스트**(UI 없음)를 실행할 수 있습니다. Linux/Windows에서 사용하거나 서버와 함께 최소한의 Node를 실행할 때 유용합니다.

시작:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고:

- 페어링은 여전히 필요합니다(Gateway에 기기 페어링 프롬프트가 표시됩니다).
- 클라이언트 인스턴스 메타데이터, 서명된 기기 ID, 페어링 인증은 별도의 파일을 사용합니다. [헤드리스 ID 상태](#headless-identity-state)를 참조하십시오.
- exec 승인은 `~/.openclaw/exec-approvals.json`을 통해 로컬에서 적용됩니다([exec 승인](/ko/tools/exec-approvals) 참조).
- macOS에서 헤드리스 Node 호스트는 기본적으로 `system.run`을 로컬에서 실행합니다. 컴패니언 앱 exec 호스트를 통해 `system.run`을 라우팅하려면 `OPENCLAW_NODE_EXEC_HOST=app`을 설정하십시오. 앱 호스트를 필수로 지정하고 사용할 수 없을 때 실패 후 종료하려면 `OPENCLAW_NODE_EXEC_FALLBACK=0`을 추가하십시오.
- Gateway WS가 TLS를 사용하는 경우 `--tls` / `--tls-fingerprint`을 추가하십시오.

## Mac Node 모드

- macOS 메뉴 막대 앱은 Node로서 Gateway WS 서버에 연결하므로 이 Mac에 대해 `openclaw nodes …`이 작동합니다.
- 원격 모드에서 앱은 Gateway 포트용 SSH 터널을 열고 `localhost`에 연결합니다.
