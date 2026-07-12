---
read_when:
    - iOS/watchOS/Android Node를 Gateway에 페어링하기
    - 에이전트 컨텍스트에 Node 캔버스/카메라 사용하기
    - 새 Node 명령 또는 CLI 도우미 추가
summary: 'Node: 페어링, 기능, 권한 및 canvas/camera/screen/device/notifications/system용 CLI 도우미'
title: Node들
x-i18n:
    generated_at: "2026-07-12T15:25:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b59e34e93ec38c69d0cee274d2366eef22c6ff6619a8aea3c2d4a75721865b72
    source_path: nodes/index.md
    workflow: 16
---

**노드**는 `role: "node"`로 Gateway에 연결하고 `node.invoke`를 통해 명령 표면(예: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`)을 노출하는 보조 장치(macOS/iOS/watchOS/Android/헤드리스)입니다. 대부분의 노드는 운영자 포트에서 Gateway WebSocket을 사용합니다. 선택적인 직접 Apple Watch 노드는 watchOS가 일반 앱의 범용 저수준 네트워킹을 차단하므로 동일한 포트에서 서명된 HTTPS 폴링을 사용합니다. 프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol).

레거시 전송 방식: [브리지 프로토콜](/ko/gateway/bridge-protocol)(TCP JSONL, 현재 노드에는 기록 목적으로만 제공).

macOS는 **노드 모드**로도 실행할 수 있습니다. 메뉴 막대 앱이 Gateway의 WS 서버에 연결하고 로컬 캔버스/카메라 명령을 노드로 노출하므로 이 Mac을 대상으로 `openclaw nodes …`를 사용할 수 있습니다. 원격 Gateway 모드에서는 브라우저 자동화를 네이티브 앱 노드가 아닌 CLI 노드 호스트(`openclaw node run` 또는 설치된 노드 서비스)가 처리합니다.

노드는 Gateway가 아니라 **주변 장치**입니다. 노드는 Gateway 서비스를 실행하지 않으며 채널 메시지(Telegram, WhatsApp 등)는 노드가 아닌 Gateway에 도착합니다.

문제 해결 런북: [/nodes/troubleshooting](/ko/nodes/troubleshooting)

## 페어링 및 상태

노드는 **장치 페어링**을 사용합니다. 노드는 연결 중에 서명된 장치 ID를 제시하며, Gateway는 `role: node`에 대한 장치 페어링 요청을 생성합니다. 장치 CLI(또는 UI)를 통해 승인하십시오. 직접 Apple Watch 설정에서는 관리자가 발급한 수명이 짧은 노드 전용 설정 코드를 사용하여 고정된 저위험 명령 표면을 승인합니다. 이후 기능을 확장하려면 여전히 일반 승인이 필요합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

대기 중인 페어링 요청은 장치의 마지막 재시도 후 5분이 지나면 만료됩니다. 계속 재연결하는 장치는 몇 분마다 새 프롬프트를 발급하지 않고 하나의 대기 중인 요청(및 `requestId`)을 활성 상태로 유지합니다. 전체 요청/승인 수명 주기는 [노드 페어링](/ko/gateway/pairing)을 참조하십시오. 노드가 변경된 인증 세부 정보(역할/범위/공개 키)로 재시도하면 이전 대기 요청이 대체되고 새 `requestId`가 생성됩니다. 클라이언트는 대체된 요청에 대한 `device.pair.resolved` 이벤트를 수신하며, 승인하기 전에 `openclaw devices list`를 다시 실행해야 합니다.

- 장치 페어링 역할에 `node`가 포함된 경우 `nodes status`는 노드를 **페어링됨**으로 표시합니다.
- 손쉬운 사용 권한이 있는 연결된 네이티브 Mac은 병합된
  물리적 입력 활동을 보고할 수 있습니다. Gateway는 적격 Mac 중 가장 최근에
  활동한 Mac을 `active`로 표시하고, 에이전트에 안정적인 노드 ID 힌트를 제공하며,
  지연된 대체 경로를 사용하기 전에 노드 연결 알림을 해당 Mac으로 라우팅합니다.
  설정, 개인 정보 보호, 타이밍 및 문제 해결에 관한 내용은
  [활성 컴퓨터 존재 상태](/ko/nodes/presence)를 참조하십시오.
- 장치 페어링 레코드는 지속적으로 유지되는 승인된 역할 계약입니다. 토큰 순환은 해당 계약 안에서만 이루어지며, 페어링 승인에서 부여하지 않은 역할로 페어링된 노드를 승격할 수 없습니다.
- `node.pair.*`(CLI: `openclaw nodes pending/approve/reject/remove/rename`)는 재연결 간에 노드의 승인된 명령/기능 표면을 추적하는 별도의 Gateway 소유 노드 페어링 저장소입니다. 이는 전송 인증을 제어하지 **않습니다**. 전송 인증은 장치 페어링이 담당합니다.
- `openclaw nodes remove --node <id|name|ip>`는 노드 페어링을 제거합니다. 장치 기반 노드의 경우 페어링된 장치 저장소에서 장치의 `node` 역할을 취소하고 해당 장치의 노드 역할 세션 연결을 해제합니다. 역할이 혼합된 장치는 행을 유지하고 `node` 역할만 잃지만, 노드 전용 장치 행은 삭제됩니다. 또한 별도의 노드 페어링 저장소에서 일치하는 항목도 모두 제거합니다. `operator.pairing`은 다른 장치의 운영자 외 노드 행을 제거할 수 있습니다. 장치 토큰 호출자가 역할이 혼합된 장치에서 자신의 노드 역할을 취소하려면 추가로 `operator.admin`이 필요합니다.
- 승인 범위는 대기 중인 요청에 선언된 명령을 따릅니다.
  - 명령이 없는 요청: `operator.pairing`
  - 실행 이외의 노드 명령: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## 버전 차이 및 업그레이드 순서

Gateway WebSocket은 N-1 프로토콜 범위의 인증된 노드 클라이언트를 허용합니다.
따라서 현재 v4 Gateway는 연결에서 `role: "node"`와
`client.mode: "node"`를 모두 선언하면 v3 노드를 허용합니다. 운영자 및 UI 세션은
여전히 현재 프로토콜을 사용해야 합니다.

단계적 플릿 업그레이드에서는 Gateway를 먼저 업그레이드한 다음 각 노드를 업그레이드하십시오.
N-1 노드는 업그레이드 중에도 계속 표시되고 관리할 수 있습니다. Gateway는
업그레이드 권장 사항과 함께 `legacy node protocol accepted`를 기록합니다. 페어링,
장치 인증, 명령 허용 목록 및 실행 승인은 계속 적용됩니다.
Plugin 소유 기능과 명령은 노드가 현재 프로토콜로 업그레이드될 때까지 숨겨집니다.
N-1보다 오래된 노드는 다시 연결하기 전에 대역 외 방식으로 업그레이드해야 합니다.

직접 watchOS HTTPS 전송에는 현재 프로토콜 버전이 필요합니다. 직접 모드를 활성화하기 전에
Gateway와 함께 Watch 앱을 업데이트하십시오.

## 원격 노드 호스트(system.run)

Gateway는 한 머신에서 실행되지만 다른 머신에서 명령을 실행하려면 **노드 호스트**를 사용하십시오. 모델은 여전히 **Gateway**와 통신하며, `host=node`를 선택하면 Gateway가 `exec` 호출을 **노드 호스트**로 전달합니다.

| 역할         | 책임                                                   |
| ------------ | ---------------------------------------------------------------- |
| Gateway 호스트 | 메시지를 수신하고 모델을 실행하며 도구 호출을 라우팅합니다.            |
| 노드 호스트    | 노드 머신에서 `system.run`/`system.which`를 실행합니다.        |
| 승인          | 노드 호스트에서 `~/.openclaw/exec-approvals.json`을 통해 적용됩니다. |

승인 참고 사항:

- 승인 기반 노드 실행은 정확한 요청 컨텍스트에 바인딩됩니다. 실행 경로는 승인 전에 정규 `systemRunPlan`을 준비합니다. 승인이 이루어지면 Gateway는 이후 호출자가 수정한 명령/cwd/세션 필드가 아니라 저장된 계획을 전달하고, 실행 전에 작업 디렉터리를 다시 검증합니다.
- 직접 셸/런타임 파일 실행의 경우 OpenClaw는 구체적인 로컬 파일 피연산자 하나도 최선의 방식으로 바인딩하며, 실행 전에 해당 파일이 변경되면 실행을 거부합니다.
- OpenClaw가 인터프리터/런타임 명령에서 구체적인 로컬 파일 하나를 정확히 식별할 수 없으면 전체 런타임 범위를 지원하는 것처럼 처리하지 않고 승인 기반 실행을 거부합니다. 더 광범위한 인터프리터 의미 체계가 필요하면 샌드박싱, 별도의 호스트 또는 명시적인 신뢰할 수 있는 허용 목록/전체 워크플로를 사용하십시오.

### 노드 호스트 시작(포그라운드)

노드 머신에서 다음을 실행합니다.

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

`node run`은 `--context-path`(Gateway WS 컨텍스트 경로), `--tls`, `--tls-fingerprint <sha256>`, `--node-id`(레거시 클라이언트 인스턴스 ID 재정의, 페어링은 재설정하지 않음)도 허용합니다.

### SSH 터널을 통한 원격 Gateway(루프백 바인딩)

Gateway가 루프백에 바인딩된 경우(`gateway.bind=loopback`, 로컬 모드의 기본값) 원격 노드 호스트는 직접 연결할 수 없습니다. SSH 터널을 생성하고 노드 호스트가 터널의 로컬 종단을 가리키도록 하십시오.

예시(노드 호스트 -> Gateway 호스트):

```bash
# 터미널 A(계속 실행): 로컬 18790을 Gateway 127.0.0.1:18789로 전달
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 터미널 B: Gateway 토큰을 내보내고 터널을 통해 연결
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고:

- `openclaw node run`은 토큰 또는 비밀번호 인증을 지원합니다.
- 환경 변수가 권장됩니다: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- 구성 대체 경로는 `gateway.auth.token` / `gateway.auth.password`입니다.
- 로컬 모드에서 노드 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 무시합니다.
- 원격 모드에서 `gateway.remote.token` / `gateway.remote.password`는 원격 우선순위 규칙에 따라 사용할 수 있습니다.
- 활성 로컬 `gateway.auth.*` SecretRefs가 구성되어 있지만 확인되지 않으면 노드 호스트 인증은 실패 시 차단됩니다.
- 노드 호스트 인증 확인은 `OPENCLAW_GATEWAY_*` 환경 변수만 적용합니다.

### 노드 호스트 시작(서비스)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

`node install`은 `--context-path`, `--tls`, `--tls-fingerprint`, `--node-id`(레거시 클라이언트 인스턴스 ID 전용), `--runtime <node|bun>`(기본값: node), 재설치를 위한 `--force`도 허용합니다. `node status`, `node stop`, `node uninstall`도 사용할 수 있습니다.

### 페어링 및 이름 지정

Gateway 호스트에서 다음을 실행합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

노드가 변경된 인증 세부 정보로 재시도하면 `openclaw devices list`를 다시 실행하고 현재 `requestId`를 승인하십시오.

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`의 `--display-name`(노드에서 클라이언트 인스턴스 ID 및 Gateway 연결 메타데이터와 함께 `~/.openclaw/node.json`에 유지됨).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`(Gateway 재정의).

### 노드 호스팅 MCP 서버

Gateway가 아닌 노드 머신의 `openclaw.json`에서 MCP 서버를 구성하십시오.

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

헤드리스 노드 호스트는 이러한 서버를 시작하고, 해당 도구를 나열하며, 연결 후
설명자를 게시합니다. 도구 호출은 `mcp.tools.call.v1`을 통해 해당 노드로
돌아갑니다. Gateway에는 일치하는 MCP 구성이나 JS Plugin이 필요하지 않습니다.
이 노드 호스팅 v1 경로에서는 OAuth MCP 서버를 지원하지 않습니다.

현재 노드 호스트는 MCP 서버가 구성되지 않은 경우에도 초기 페어링 중에
내장 `mcp.tools.call.v1` 명령 계열을 선언합니다. 이전 OpenClaw 버전에서 페어링된
노드는 노드 호스트가 업데이트된 후 일회성 명령 표면 업그레이드를 요청할 수 있습니다.
그 이후 서버를 추가, 제거 또는 필터링해도 승인된 명령 계열이 변경되지 않으므로
다시 페어링할 필요가 없습니다. 노드 MCP 구성 변경 사항을 적용하려면
`openclaw node run` 또는 `openclaw node restart`를 다시 시작하십시오.
노드 호스트는 이 구성을 감시하지 않습니다.

Gateway 운영자는 `gateway.nodes.pluginTools.enabled: false`를 사용하여
노드 호스팅 MCP 도구를 포함해 페어링된 노드에서 게시한 모든 에이전트 표시 도구를
무시할 수 있습니다. `gateway.nodes.denyCommands: ["mcp.tools.call.v1"]`와 같은
정확한 명령 거부도 실행을 차단합니다.

### 노드 호스팅 Skills

노드 머신의 활성 OpenClaw Skills 디렉터리(기본값:
`~/.openclaw/skills`)에 Skills을 설치하십시오. `OPENCLAW_HOME`,
`OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`는 해당 활성 프로필을
이동합니다. Skills에서는 `OPENCLAW_STATE_DIR`이 우선합니다. 그렇지 않으면
`skills/`는 `openclaw config file`이 출력한 경로 옆에 있습니다.
헤드리스 노드 호스트는 연결된 후 유효한 `SKILL.md` 파일을 게시하며,
Gateway는 해당 노드가 연결된 동안에만 이 파일을 에이전트 Skills 스냅샷에 추가합니다.
추상 노드 로케이터가 다른 프로토콜 필드를 추가하지 않고 하나의 항목에 매핑되도록
각 Skills 디렉터리 이름은 frontmatter의 `name` 필드와 일치해야 합니다.

초기 노드 역할 페어링은 Skills 게시를 승인합니다. Skills을 추가, 제거 또는
변경해도 다른 페어링이나 Gateway 구성 변경이 필요하지 않습니다.
노드 Skills 파일을 변경한 후 `openclaw node run` 또는
`openclaw node restart`를 다시 시작하십시오. 노드 호스트는 Skills 디렉터리를
감시하지 않습니다.

Node에서 호스팅되는 skill 항목은 해당 Node를 식별하고 실행 위치를 포함합니다. Skill 파일, 상대 경로로 참조된 파일 및 바이너리는 해당 Node에 유지됩니다. 에이전트는 일반 `read` 도구를 사용하여 공지된 `node://.../SKILL.md` 위치를 읽습니다. `file_fetch`는 운영자가 승인한 절대 Node 경로를 허용하지만 Node skill 로케이터는 허용하지 않습니다. 일반 read 도구가 없는 런타임은 대신 공지된 `node://.../skills/<name>` 디렉터리를 `workdir`로 설정하고 `exec host=node node=<node-id>`를 통해 `cat SKILL.md`를 실행할 수 있습니다. 참조된 파일과 바이너리는 동일한 exec 대상과 workdir을 사용합니다. Node 호스트는 해당 로케이터를 활성 OpenClaw 상태 디렉터리를 기준으로 확인하므로 상대 경로는 Gateway 머신이 아닌 Node에서 확인됩니다. 게시하는 Node에는 승인된 `system.run`이 있어야 하며, 에이전트의 exec 정책에서 `host=node`를 허용해야 합니다. 그렇지 않으면 해당 skill은 에이전트의 스냅샷에서 제외됩니다.

게시를 중지하려면 Node에서 `nodeHost.skills.enabled: false`를 설정하십시오. Gateway 운영자는 `gateway.nodes.skills.enabled: false`를 사용하여 페어링된 모든 Node의 skill을 무시할 수 있습니다.

### 헤드리스 ID 상태

헤드리스 Node는 서로 분리된 다음 세 가지 상태 파일을 유지합니다.

- `~/.openclaw/node.json`: 레거시 클라이언트 인스턴스 ID(`nodeId`로 저장됨), 표시 이름 및 Gateway 연결 메타데이터입니다.
- `~/.openclaw/identity/device.json`: 서명된 기기 키 쌍과 여기서 파생된 암호화 기기 ID입니다.
- `~/.openclaw/identity/device-auth.json`: 암호화 기기 ID와 역할을 키로 사용하는 페어링된 기기 인증 토큰입니다.

서명된 Node의 경우 Gateway는 페어링 및 Node 라우팅에 암호화 기기 ID를 사용합니다. 클라이언트 인스턴스 ID는 연결 메타데이터일 뿐입니다. 따라서 `--node-id`를 변경하거나 `node.json`만 삭제해도 페어링은 초기화되지 않습니다. 지원되는 해제 후 재페어링 절차와 업그레이드 참고 사항은 [ID 및 페어링 상태](/ko/cli/node#identity-and-pairing-state)를 참조하십시오.

### 명령어를 허용 목록에 추가하기

Exec 승인은 **Node 호스트별로** 적용됩니다. Gateway에서 허용 목록 항목을 추가하십시오.

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

승인 정보는 Node 호스트의 `~/.openclaw/exec-approvals.json`에 저장됩니다.

### exec가 Node를 가리키도록 설정하기

기본값을 구성합니다(Gateway 구성).

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별로 설정합니다.

```text
/exec host=node security=allowlist node=<id-or-name>
```

설정이 완료되면 `host=node`를 사용하는 모든 `exec` 호출은 Node 호스트에서 실행됩니다(Node의 허용 목록 및 승인 적용 대상).

`host=auto`는 자체적으로 Node를 암시적으로 선택하지 않지만, `auto`에서도 호출별로 명시적인 `host=node` 요청을 사용할 수 있습니다. Node exec를 세션의 기본값으로 사용하려면 `tools.exec.host=node` 또는 `/exec host=node ...`를 명시적으로 설정하십시오.

관련 문서:

- [Node 호스트 CLI](/ko/cli/node)
- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)

### 로컬 모델 추론

데스크톱 또는 서버 Node는 해당 Node에서 실행 중인 Ollama 서버의 채팅 지원 모델을 노출할 수 있습니다. 에이전트는 Ollama Plugin의 `node_inference` 도구를 사용하여 설치된 모델을 검색하고 제한된 프롬프트를 원격으로 실행합니다. Gateway는 Ollama에 직접 네트워크로 접근할 필요가 없습니다. 설정, 모델 필터링 및 직접 검증 명령어는 [Ollama Node 로컬 추론](/ko/providers/ollama#node-local-inference)을 참조하십시오.

### Codex 세션 및 트랜스크립트

공식 `codex` Plugin은 헤드리스 Node 호스트 또는 네이티브 macOS Node에서 보관되지 않은 Codex 세션을 노출할 수 있습니다. 카탈로그 등록은 더 이상 `supervision.enabled`에 의존하지 않습니다. 이 옵션은 에이전트에 노출되는 감독 도구를 제어합니다. Plugin은 여전히 두 컴퓨터 모두에서 활성 상태여야 하며, Node 설정은 로컬 동의로 유지됩니다. Gateway에서만 활성화해서는 다른 컴퓨터의 Codex 상태를 읽을 수 없습니다.

Node는 버전이 지정된 읽기 전용 `codex.appServer.threads.list.v1` 및 `codex.appServer.thread.turns.list.v1` 명령어를 공지합니다. 이러한 명령어가 처음 나타나면 Node 페어링 업그레이드를 승인하십시오. Gateway는 일반적인 Plugin Node 정책을 통해 명령어를 호출하며 호스트별로 장애를 격리합니다.

페어링된 Node의 행은 일반 세션 사이드바에 **Codex** 그룹으로 표시됩니다. 행을 선택하면 일반 Chat 창이 열리고, 전체 항목 프로젝션을 사용하는 제한된 커서 페이지네이션 방식의 `thread/turns/list` 호출을 통해 저장된 트랜스크립트를 읽습니다. Node 호출 전송은 요청/응답만 지원하므로 Codex 하니스를 통해 네이티브 스레드를 계속하는 데 필요한 스트리밍 턴, 실시간 이벤트 또는 승인을 전달할 수 없습니다. 따라서 원격 행에서는 **계속**과 **보관**을 사용할 수 없습니다. Gateway 컴퓨터에서는 저장되어 있고 유휴 상태인 행에서 모델이 고정된 별도의 Chat 브랜치를 시작할 수 있습니다. 어느 행이든 다른 Codex 클라이언트에서 사용 중이지 않다는 사실을 운영자가 확인한 후에만 보관할 수 있습니다. 저장된 행의 실시간 활동 여부는 알 수 없습니다. 활성 행은 브랜치를 만들거나 보관할 수 없습니다.

설정, 페이지네이션, 로컬에서 계속하기 및 메타데이터 보안 경계는 [Codex 세션 감독](/plugins/codex-supervision)을 참조하십시오.

### Claude 세션 및 트랜스크립트

번들 `anthropic` Plugin은 Gateway 및 페어링된 Node에서 보관되지 않은 Claude CLI 및 Claude Desktop 세션을 검색합니다. Codex 감독과 달리 별도로 옵트인할 필요가 없습니다. Anthropic Plugin이 활성화되어 있고 `~/.claude/projects/`가 존재하면 원격 macOS 앱 Node가 `anthropic.claude.sessions.list.v1` 및 `anthropic.claude.sessions.read.v1`을 공지합니다. 이러한 명령어가 처음 나타나면 Node 페어링 업그레이드를 승인하십시오.

카탈로그는 유효한 Claude CLI 프로젝트 인덱스 레코드를 현재 `sdk-cli` JSONL 파일의 제한된 메타데이터 접두부와 결합합니다. Claude Desktop의 로컬 메타데이터는 Desktop 제목과 보관 상태를 제공합니다. 두 소스가 동일한 Claude Code 세션 ID를 참조하면 Desktop 메타데이터가 우선합니다. CLI에는 보관 플래그가 없으므로 CLI 전용 트랜스크립트는 계속 표시됩니다. 트랜스크립트 읽기는 불투명한 바이트 오프셋 커서와 제한된 역방향 파일 읽기를 사용하므로, 대규모 세션을 선택하거나 이전 페이지를 불러올 때 전체 JSONL 기록을 하나의 Gateway 응답으로 읽지 않습니다.

두 Node 명령어는 모두 읽기 전용입니다. 인증된 `operator.write` 운영자 연결에 대해 일반 `sessions.catalog.list` 및 `sessions.catalog.read` 메서드를 통해서만 카탈로그 메타데이터와 트랜스크립트 콘텐츠를 노출합니다. 페어링된 Node의 행은 보기 전용으로 유지됩니다. Gateway 로컬 Claude CLI 행은 일반 Chat 작성기에서 인계할 수 있습니다. OpenClaw는 제한된 범위의 표시 기록을 가져오고, 첫 번째 턴에서 `--fork-session`으로 재개하며, 원본 트랜스크립트는 변경하지 않습니다. Claude Desktop 행은 보기 전용으로 유지됩니다.

Control UI 동작과 저장소 소스는 [Anthropic: 여러 컴퓨터의 Claude 세션](/ko/providers/anthropic#claude-sessions-across-computers)을 참조하십시오.

## 명령어 호출하기

저수준(원시 RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

`nodes invoke`는 `system.run` 및 `system.run.prepare`를 차단합니다. 이러한 명령어는 `host=node`를 사용하는 `exec` 도구를 통해서만 실행됩니다(위 내용 참조). 일반적인 "에이전트에 MEDIA 첨부 파일 제공" 워크플로(캔버스, 카메라, 화면, 위치 등)를 위한 상위 수준 헬퍼가 제공됩니다.

## 명령어 정책

Node 명령어를 호출하려면 먼저 두 가지 게이트를 통과해야 합니다.

1. Node가 인증된 연결 메타데이터(`connect.commands`)에 해당 명령어를 선언해야 합니다.
2. Gateway에서 플랫폼 및 승인으로부터 파생된 허용 목록에 선언된 명령어가 포함되어야 합니다.

플랫폼별 기본 허용 목록(Plugin 기본값 및 `allowCommands`/`denyCommands` 재정의 적용 전):

| 플랫폼 | 기본적으로 허용되는 명령어                                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iOS      | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| watchOS  | `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                                                       |
| Android  | `camera.list`, `location.get`, `notifications.list`, `notifications.actions`, `system.notify`, `device.info`, `device.status`, `device.permissions`, `device.health`, `device.apps`, `contacts.search`, `calendar.events`, `callLog.search`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer` |
| macOS    | `camera.list`, `location.get`, `device.info`, `device.status`, `contacts.search`, `calendar.events`, `reminders.list`, `photos.latest`, `motion.activity`, `motion.pedometer`, `system.notify`                                                                                                                        |
| Windows  | `camera.list`, `location.get`, `device.info`, `device.status`, `system.notify`                                                                                                                                                                                                                                        |
| Linux    | `system.notify` (`system.run`과 같은 Node 호스트 명령어는 승인에 의해 제어됩니다. 아래를 참조하십시오.)                                                                                                                                                                                                                                  |

이 행들은 모든 Node 앱에서 구현된 명령어가 아니라 Gateway 정책의 상한을 설명합니다. 연결된 Node에서도 명령어를 선언한 경우에만 사용할 수 있습니다. 특히 현재 macOS 앱은 macOS 정책 행에 나열된 기기 및 개인 데이터 명령어 계열을 선언하지 않습니다.

`canvas.*` 명령어(`canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`)는 iOS, Android, macOS, Windows 및 알 수 없는 플랫폼(Linux 제외)에서 Plugin 기본값입니다. iOS에서는 모두 포그라운드로 제한됩니다.

`talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` 및 `talk.ptt.once`는 플랫폼 레이블과 관계없이 `talk` 기능을 공지하거나 `talk.*` 명령어를 선언하는 모든 Node에서 기본적으로 허용됩니다.

데스크톱 호스트 명령어(`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `mcp.tools.call.v1`, macOS/Windows의 `screen.snapshot`)는 위의 정적 플랫폼 기본값 표에 포함되지 않습니다. 운영자가 이러한 명령어를 선언하는 페어링 요청을 승인하면 사용할 수 있게 되며, 이후 Node의 승인된 명령어 집합을 통해 재연결 시에도 유지됩니다.

위험하거나 개인정보 보호에 큰 영향을 주는 명령어는 Node가 선언하더라도 여전히 `gateway.nodes.allowCommands`를 사용하여 명시적으로 옵트인해야 합니다. 해당 명령어는 `camera.snap`, `camera.clip`, `screen.record`, `computer.act`, `contacts.add`, `calendar.add`, `reminders.add`, `sms.send`, `sms.search`입니다. `gateway.nodes.denyCommands`는 항상 기본값과 추가 허용 목록 항목보다 우선합니다. 데스크톱 입력에 대한 추가 macOS, 도구 정책 및 활성화 게이트는 [컴퓨터 사용](/nodes/computer-use)을 참조하십시오.

Plugin이 소유하는 Node 명령은 Gateway Node 호출 정책을 추가할 수 있습니다. 이 정책은 허용 목록 검사 후 Node로 전달하기 전에 실행되므로, 원시 `node.invoke`, CLI 도우미, 전용 에이전트 도구가 동일한 Plugin 권한 경계를 공유합니다. 위험한 Plugin Node 명령은 여전히 명시적으로 `gateway.nodes.allowCommands`에 추가해야 합니다.

Node가 선언된 명령 목록을 변경한 후에는 기존 기기 페어링을 거부하고 새 요청을 승인하여 Gateway가 업데이트된 명령 스냅샷을 저장하도록 하십시오.

## 구성 (`openclaw.json`)

Node 관련 설정은 `gateway.nodes` 및 `tools.exec` 아래에 있습니다.

```json5
{
  gateway: {
    nodes: {
      // 신뢰할 수 있는 네트워크에서 최초 Node 페어링을 자동 승인합니다(CIDR 목록).
      // 설정하지 않으면 비활성화됩니다. 요청된 범위가 없는 최초 role:node 요청에만
      // 적용되며, 업그레이드는 자동 승인하지 않습니다.
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
      // 위험하거나 개인정보 접근이 많은 Node 명령(camera.snap 등)을 허용합니다.
      allowCommands: ["camera.snap", "screen.record"],
      // 기본값 또는 allowCommands에 포함되어 있더라도 정확히 일치하는 명령 이름을 차단합니다.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // 기본 exec 호스트: "node"는 모든 exec 호출을 페어링된 Node로 라우팅합니다.
      host: "node",
      // Node exec 보안 모드: 승인되었거나 허용 목록에 있는 명령만 허용합니다.
      security: "allowlist",
      // exec를 특정 Node(id 또는 이름)에 고정합니다. 모든 Node를 허용하려면 생략합니다.
      node: "build-node",
    },
  },
}
```

정확한 Node 명령 이름을 사용하십시오. 플랫폼 기본값이나 `allowCommands` 항목이 명령을 허용하더라도 `denyCommands`는 해당 명령을 제거합니다. 페어링된 Node는 기본적으로 에이전트 표시 Plugin 도구 설명자를 게시할 수 있지만, 각 설명자의 명령은 여전히 Node의 승인된 명령 표면에 포함되어야 합니다. 이러한 설명자를 모두 무시하려면 `gateway.nodes.pluginTools.enabled: false`로 설정하십시오. Gateway Node 페어링 및 명령 정책 필드에 대한 자세한 내용은 [Gateway 구성 참조](/ko/gateway/configuration-reference#gateway)를 참조하십시오.

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

Node가 Canvas(WebView)를 표시 중이면 `canvas.snapshot`은 `{ format, base64 }`를 반환합니다.

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

- `canvas present`는 URL 또는 로컬 파일 경로(`--target`)를 허용하며, 위치 지정을 위한 선택적 `--x/--y/--width/--height`도 지원합니다.
- `canvas eval`은 인라인 JS(`--js`) 또는 위치 인수를 허용합니다.

### A2UI(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고:

- 모바일 Node는 동작을 지원하는 렌더링을 위해 앱에 번들로 포함되고 앱이 소유하는 A2UI 페이지를 사용합니다.
- A2UI v0.8 JSONL만 지원됩니다(v0.9/createSurface는 거부됩니다).
- iOS 및 Android는 원격 Gateway Canvas 페이지를 렌더링하지만, A2UI 버튼 동작은 앱에 번들로 포함되고 앱이 소유하는 A2UI 페이지에서만 디스패치됩니다. Gateway가 호스팅하는 HTTP/HTTPS A2UI 페이지는 해당 모바일 클라이언트에서 렌더링만 가능합니다.
- macOS는 앱이 선택한 정확한 기능 범위의 Gateway A2UI 페이지에서 동작을 디스패치할 수 있습니다. 다른 HTTP/HTTPS 페이지는 계속 렌더링만 가능합니다.

## 사진 및 동영상(Node 카메라)

사진(`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 기본값: 전면과 후면 모두(2개의 MEDIA 줄)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
openclaw nodes camera snap --node <idOrNameOrIp> --device-id <id> --max-width 1200 --quality 0.9 --delay-ms 2000
```

동영상 클립(`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고:

- `canvas.*` 및 `camera.*`를 사용하려면 Node가 **포그라운드에 있어야** 합니다(백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다).
- Node는 base64 페이로드를 관리 가능한 크기로 유지하기 위해 클립 길이를 제한합니다(플랫폼별 정확한 제한은 [카메라 캡처](/ko/nodes/camera)를 참조하십시오). 또한 `nodes` 에이전트 도구는 호출을 전달하기 전에 요청된 `durationMs`를 300000(5분)으로 제한하며, Node 자체에서 더 엄격한 제한을 적용합니다.
- Android는 가능한 경우 `CAMERA`/`RECORD_AUDIO` 권한을 요청합니다. 권한이 거부되면 `*_PERMISSION_REQUIRED` 오류가 발생합니다.

## 화면 녹화(Node)

지원되는 Node는 `screen.record`(mp4)를 노출합니다. 예:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고:

- `screen.record`의 사용 가능 여부는 Node 플랫폼에 따라 달라집니다.
- `nodes` 에이전트 도구는 요청된 `durationMs`를 300000(5분)으로 제한하며, Node는 반환되는 페이로드의 크기를 제한하기 위해 더 엄격한 제한을 적용할 수 있습니다.
- `--no-audio`는 지원되는 플랫폼에서 마이크 캡처를 비활성화합니다.
- 여러 화면을 사용할 수 있는 경우 `--screen <index>`를 사용하여 디스플레이를 선택하십시오(0 = 기본 디스플레이).

## 위치(Node)

설정에서 위치 기능을 활성화하면 Node가 `location.get`을 노출합니다.

CLI 도우미:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고:

- 위치 기능은 **기본적으로 꺼져 있습니다**.
- "Always"에는 시스템 권한이 필요하며, 백그라운드 가져오기는 최선형으로 동작합니다.
- 응답에는 위도/경도, 정확도(미터), 타임스탬프가 포함됩니다.
- 전체 매개변수/응답 형태 및 오류 코드: [위치 명령](/ko/nodes/location-command).

## SMS(Android Node)

사용자가 **SMS** 권한을 부여하고 기기가 전화 통신을 지원하면 Android Node가 `sms.send` 및 `sms.search`를 노출할 수 있습니다. 두 명령 모두 기본적으로 위험한 명령입니다. 호출하려면 Gateway 운영자가 해당 명령을 `gateway.nodes.allowCommands`에도 추가해야 합니다([명령 정책](#command-policy) 참조).

읽기 전용 SMS 검색을 사용하려면 `openclaw.json`에서 명시적으로 활성화하십시오.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["sms.search"],
    },
  },
}
```

Node가 메시지를 보낼 수도 있어야 하는 경우에만 `sms.send`를 별도로 추가하십시오. Android 권한과 Gateway 명령 승인은 서로 독립적이며, 휴대전화 권한을 부여해도 Gateway 정책은 수정되지 않습니다.

저수준 호출:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고:

- 호출 시 권한 진단을 반환할 수 있도록 `READ_SMS`가 부여되기 전에 `sms.search`가 선언될 수 있습니다. 메시지를 읽으려면 여전히 해당 Android 권한이 필요합니다.
- 전화 통신 기능이 없는 Wi-Fi 전용 기기는 `sms.send`를 알리지 않습니다.
- `requires explicit gateway.nodes.allowCommands opt-in` 오류는 휴대전화가 명령을 선언했지만 Gateway 운영자가 승인하지 않았음을 의미합니다.

## 기기 및 개인 데이터 명령

iOS 및 Android Node는 기본적으로 여러 읽기 전용 데이터 명령을 알립니다([명령 정책](#command-policy) 표 참조). Android는 자체 앱 내 설정으로 제한되는 더 큰 명령 집합도 추가로 노출합니다.

사용 가능한 명령군:

- `device.status`, `device.info` — iOS, Android, Windows.
- `device.permissions`, `device.health`, `device.apps` — Android 전용입니다. `device.apps`를 사용하려면 Android Settings에서 Installed Apps 공유를 활성화해야 하며, 기본적으로 런처에 표시되는 앱을 반환합니다.
- `notifications.list`, `notifications.actions` — Android 전용입니다.
- `photos.latest` — iOS, Android.
- `contacts.search` — iOS, Android(읽기 전용 기본값). `contacts.add`는 위험하므로 `gateway.nodes.allowCommands`가 필요합니다.
- `calendar.events` — iOS, Android(읽기 전용 기본값). `calendar.add`는 위험하므로 `gateway.nodes.allowCommands`가 필요합니다.
- `reminders.list` — iOS, Android(읽기 전용 기본값). `reminders.add`는 위험하므로 `gateway.nodes.allowCommands`가 필요합니다.
- `callLog.search` — Android 전용입니다.
- `motion.activity`, `motion.pedometer` — iOS, Android. 사용 가능한 센서 기능에 따라 제한됩니다.

호출 예:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

## 시스템 명령(Node 호스트/mac Node)

macOS Node는 `system.run`, `system.which`, `system.notify`, `system.execApprovals.get/set`을 노출합니다. 헤드리스 Node 호스트는 `system.run.prepare`, `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"bins":["git"]}'
```

참고:

- `system.run`은 페이로드에 stdout/stderr/종료 코드를 반환합니다.
- 이제 셸 실행은 `host=node`를 사용하는 `exec` 도구를 통해 이루어지며, `nodes`는 명시적인 Node 명령을 위한 직접 RPC 표면으로 유지됩니다.
- `nodes invoke`는 `system.run` 또는 `system.run.prepare`를 노출하지 않으며, 이들은 exec 경로에서만 사용할 수 있습니다.
- exec 경로는 승인 전에 정규 `systemRunPlan`을 준비합니다. 승인이 부여되면 Gateway는 이후 호출자가 수정한 명령/cwd/세션 필드가 아니라 저장된 해당 계획을 전달합니다.
- `system.notify`는 macOS 앱의 알림 권한 상태를 따르며, `--priority <passive|active|timeSensitive>` 및 `--delivery <system|overlay|auto>`를 지원합니다.
- 인식되지 않는 Node `platform` / `deviceFamily` 메타데이터에는 `system.run` 및 `system.which`를 제외하는 보수적인 기본 허용 목록이 사용됩니다. 알 수 없는 플랫폼에서 해당 명령이 의도적으로 필요한 경우 `gateway.nodes.allowCommands`를 통해 명시적으로 추가하십시오.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- 셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 `--env` 값은 명시적인 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로 제한됩니다.
- 허용 목록 모드에서 항상 허용 결정이 내려지면 알려진 디스패치 래퍼(`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신 내부 실행 파일 경로를 영구 저장합니다. 안전하게 래핑을 해제할 수 없는 경우 허용 목록 항목이 자동으로 영구 저장되지 않습니다.
- 허용 목록 모드의 Windows Node 호스트에서 `cmd.exe /c`를 통한 셸 래퍼 실행은 승인이 필요합니다(허용 목록 항목만으로는 래퍼 형식이 자동 허용되지 않습니다).
- Node 호스트는 `--env`의 `PATH` 재정의를 무시하며 명령을 실행하기 전에 유지 관리되는 대규모 인터프리터/셸 시작 변수 집합(예: `NODE_OPTIONS`, `PYTHONPATH`, `BASH_ENV`, `DYLD_*`, `LD_*`)을 제거합니다. 추가 PATH 항목이 필요한 경우 `--env`를 통해 `PATH`를 전달하는 대신 Node 호스트 서비스 환경을 구성하거나 표준 위치에 도구를 설치하십시오.
- macOS Node 모드에서 `system.run`은 macOS 앱의 exec 승인(Settings → Exec approvals)에 의해 제어됩니다. 요청/허용 목록/전체 모드는 헤드리스 Node 호스트와 동일하게 동작하며, 거부된 프롬프트는 `SYSTEM_RUN_DENIED`를 반환합니다.
- 헤드리스 Node 호스트에서 `system.run`은 exec 승인(`~/.openclaw/exec-approvals.json`)에 의해 제어됩니다. 특히 macOS에서는 아래의 [헤드리스 Node 호스트](#headless-node-host-cross-platform)에 있는 exec 호스트 라우팅 환경 변수를 참조하십시오.

## Exec Node 바인딩

여러 Node를 사용할 수 있는 경우 exec를 특정 Node에 바인딩할 수 있습니다. 이렇게 하면 `exec host=node`의 기본 Node가 설정되며 에이전트별로 재정의할 수 있습니다.

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

Node는 `node.list` / `node.describe`에 `permissions` 맵을 포함할 수 있습니다. 이 맵은 권한 이름(예: `screenRecording`, `accessibility`, `location`)을 키로 사용하고 불리언 값(`true` = 허용됨)을 가집니다.

## 헤드리스 Node 호스트(크로스 플랫폼)

OpenClaw는 Gateway WebSocket에 연결하여 `system.run` / `system.which`를 노출하는 **헤드리스 Node 호스트**(UI 없음)를 실행할 수 있습니다. 이는 Linux/Windows에서 사용하거나 서버와 함께 최소한의 Node를 실행할 때 유용합니다.

시작 방법:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고:

- 페어링은 여전히 필요합니다(Gateway에 기기 페어링 프롬프트가 표시됩니다).
- 클라이언트 인스턴스 메타데이터, 서명된 기기 ID, 페어링 인증은 별도의 파일을 사용합니다. [헤드리스 ID 상태](#headless-identity-state)를 참조하십시오.
- Exec 승인은 `~/.openclaw/exec-approvals.json`을 통해 로컬에서 적용됩니다([Exec 승인](/ko/tools/exec-approvals) 참조).
- macOS에서 헤드리스 Node 호스트는 기본적으로 `system.run`을 로컬에서 실행합니다. `system.run`을 컴패니언 앱 exec 호스트를 통해 라우팅하려면 `OPENCLAW_NODE_EXEC_HOST=app`을 설정하십시오. 앱 호스트를 필수로 지정하고 사용할 수 없을 때 안전하게 실패하도록 하려면 `OPENCLAW_NODE_EXEC_FALLBACK=0`도 추가하십시오.
- Gateway WS가 TLS를 사용하는 경우 `--tls` / `--tls-fingerprint`를 추가하십시오.

## Mac Node 모드

- macOS 메뉴 막대 앱은 Node로서 Gateway WS 서버에 연결됩니다(따라서 이 Mac을 대상으로 `openclaw nodes …`가 작동합니다).
- 원격 모드에서 앱은 Gateway 포트용 SSH 터널을 열고 `localhost`에 연결합니다.
