---
read_when:
    - iOS/Android 노드를 Gateway에 페어링하기
    - 에이전트 컨텍스트에 노드 캔버스/카메라 사용하기
    - 새 노드 명령 또는 CLI 헬퍼 추가
summary: '노드: canvas/camera/screen/device/notifications/system을 위한 페어링, 기능, 권한 및 CLI 헬퍼'
title: Nodes
x-i18n:
    generated_at: "2026-07-03T09:28:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7096a2600063465ac0bfca359fa1551cb8ca2ab28b095e32a7893669448d36aa
    source_path: nodes/index.md
    workflow: 16
---

**노드**는 Gateway **WebSocket**(운영자와 같은 포트)에 `role: "node"`로 연결하고 `node.invoke`를 통해 명령 표면(예: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`)을 노출하는 동반 기기(macOS/iOS/Android/headless)입니다. 프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol).

레거시 전송: [브리지 프로토콜](/ko/gateway/bridge-protocol) (TCP JSONL;
현재 노드에서는 역사적 용도로만 사용).

macOS는 **노드 모드**로도 실행할 수 있습니다. 메뉴 막대 앱이 Gateway의
WS 서버에 연결하고 로컬 캔버스/카메라 명령을 노드로 노출합니다(따라서
`openclaw nodes …`가 이 Mac을 대상으로 작동합니다). 원격 Gateway 모드에서는 브라우저
자동화가 네이티브 앱 노드가 아니라 CLI 노드 호스트(`openclaw node run` 또는
설치된 노드 서비스)에서 처리됩니다.

참고:

- 노드는 Gateway가 아니라 **주변 장치**입니다. Gateway 서비스를 실행하지 않습니다.
- Telegram/WhatsApp 등의 메시지는 노드가 아니라 **Gateway**에 도착합니다.
- 문제 해결 런북: [/nodes/troubleshooting](/ko/nodes/troubleshooting)

## 페어링 + 상태

**WS 노드는 기기 페어링을 사용합니다.** 노드는 `connect` 중에 기기 ID를 제시하며, Gateway는
`role: node`에 대한 기기 페어링 요청을 생성합니다. 기기 CLI(또는 UI)로 승인하세요.

빠른 CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

노드가 변경된 인증 세부 정보(role/scopes/public key)로 재시도하면 이전
대기 중 요청은 대체되고 새 `requestId`가 생성됩니다. 승인하기 전에
`openclaw devices list`를 다시 실행하세요.

참고:

- `nodes status`는 기기 페어링 역할에 `node`가 포함되어 있으면 노드를 **페어링됨**으로 표시합니다.
- 기기 페어링 레코드는 내구성 있는 승인 역할 계약입니다. 토큰
  순환은 그 계약 안에 머무르며, 페어링 승인이 부여한 적 없는
  다른 역할로 페어링된 노드를 업그레이드할 수 없습니다.
- `node.pair.*`(CLI: `openclaw nodes pending/approve/reject/remove/rename`)는 별도의 Gateway 소유
  노드 페어링 저장소이며, WS `connect` 핸드셰이크를 게이트하지 **않습니다**.
- `openclaw nodes remove --node <id|name|ip>`는 노드 페어링을 제거합니다. 기기 기반 노드의 경우
  `devices/paired.json`에서 기기의 `node` 역할을 철회하고
  해당 기기의 노드 역할 세션 연결을 끊습니다. 혼합 역할 기기는
  행을 유지하고 `node` 역할만 잃으며, 노드 전용 기기 행은
  삭제됩니다. 또한 별도의 Gateway 소유 노드
  페어링 저장소에서 일치하는 항목도 지웁니다. `operator.pairing`은 비운영자 노드 행을 제거할 수 있으며,
  혼합 역할 기기에서 자체 노드 역할을 철회하는
  기기 토큰 호출자는 추가로 `operator.admin`이 필요합니다.
- 승인 범위는 대기 중 요청이 선언한 명령을 따릅니다.
  - 명령 없는 요청: `operator.pairing`
  - 비실행 노드 명령: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## 원격 노드 호스트(system.run)

Gateway가 한 머신에서 실행되고 다른 머신에서 명령을 실행하려면 **노드 호스트**를 사용하세요. 모델은 여전히 **Gateway**와 통신하며, Gateway는
`host=node`가 선택되면 `exec` 호출을 **노드 호스트**로 전달합니다.

### 어디에서 무엇이 실행되는가

- **Gateway 호스트**: 메시지를 받고, 모델을 실행하며, 도구 호출을 라우팅합니다.
- **노드 호스트**: 노드 머신에서 `system.run`/`system.which`를 실행합니다.
- **승인**: 노드 호스트에서 `~/.openclaw/exec-approvals.json`을 통해 강제됩니다.

승인 참고:

- 승인 기반 노드 실행은 정확한 요청 컨텍스트에 바인딩됩니다.
- 직접 셸/런타임 파일 실행의 경우 OpenClaw는 하나의 구체적인 로컬
  파일 피연산자도 최선으로 바인딩하고, 실행 전에 해당 파일이 변경되면 실행을 거부합니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면,
  전체 런타임 범위를 가장하는 대신 승인 기반 실행이 거부됩니다. 더 넓은 인터프리터 의미 체계에는 샌드박싱,
  별도 호스트, 또는 명시적으로 신뢰된 허용 목록/전체 워크플로를 사용하세요.

### 노드 호스트 시작(포그라운드)

노드 머신에서:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH 터널을 통한 원격 Gateway(local loopback 바인딩)

Gateway가 local loopback(`gateway.bind=loopback`, 로컬 모드의 기본값)에 바인딩되면
원격 노드 호스트는 직접 연결할 수 없습니다. SSH 터널을 만들고
노드 호스트가 터널의 로컬 끝을 가리키게 하세요.

예시(노드 호스트 -> Gateway 호스트):

```bash
# Terminal A (keep running): forward local 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# Terminal B: export the gateway token and connect through the tunnel
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고:

- `openclaw node run`은 토큰 또는 비밀번호 인증을 지원합니다.
- 환경 변수를 권장합니다: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- 구성 폴백은 `gateway.auth.token` / `gateway.auth.password`입니다.
- 로컬 모드에서 노드 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 무시합니다.
- 원격 모드에서는 원격 우선순위 규칙에 따라 `gateway.remote.token` / `gateway.remote.password`를 사용할 수 있습니다.
- 활성 로컬 `gateway.auth.*` SecretRefs가 구성되었지만 해석되지 않으면 노드 호스트 인증은 닫힌 상태로 실패합니다.
- 노드 호스트 인증 해석은 `OPENCLAW_GATEWAY_*` 환경 변수만 따릅니다.

### 노드 호스트 시작(서비스)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### 페어링 + 이름 지정

Gateway 호스트에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

노드가 변경된 인증 세부 정보로 재시도하면 `openclaw devices list`를 다시 실행하고
현재 `requestId`를 승인하세요.

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`의 `--display-name`(노드의 `~/.openclaw/node.json`에 유지됨).
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`(Gateway 재정의).

### 명령 허용 목록 지정

Exec 승인은 **노드 호스트별**입니다. Gateway에서 허용 목록 항목을 추가하세요.

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

승인은 노드 호스트의 `~/.openclaw/exec-approvals.json`에 있습니다.

### exec를 노드로 지정

기본값 구성(Gateway 구성):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별로:

```
/exec host=node security=allowlist node=<id-or-name>
```

설정되면 `host=node`가 있는 모든 `exec` 호출은 노드 호스트에서 실행됩니다(노드
허용 목록/승인의 적용을 받음).

`host=auto`는 자체적으로 노드를 암시적으로 선택하지 않지만, `auto`에서 명시적인 호출별 `host=node` 요청은 허용됩니다. 세션의 기본값으로 노드 exec를 사용하려면 `tools.exec.host=node` 또는 `/exec host=node ...`를 명시적으로 설정하세요.

관련:

- [노드 호스트 CLI](/ko/cli/node)
- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)

### 로컬 모델 추론

데스크톱 또는 서버 노드는 해당 노드에서 실행 중인 Ollama 서버의 채팅 가능 모델을 노출할 수 있습니다.
에이전트는 Ollama Plugin의 `node_inference` 도구를 사용해
설치된 모델을 검색하고 제한된 프롬프트를 원격으로 실행합니다. Gateway는
Ollama에 직접 네트워크로 접근할 필요가 없습니다. 설정, 모델 필터링, 직접 검증 명령은 [Ollama 노드 로컬 추론](/ko/providers/ollama#node-local-inference)을
참조하세요.

## 명령 호출

저수준(원시 RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

일반적인 “에이전트에 MEDIA 첨부 파일 제공” 워크플로에는 더 높은 수준의 헬퍼가 있습니다.

## 명령 정책

노드 명령은 호출되기 전에 두 게이트를 통과해야 합니다.

1. 노드는 WebSocket `connect.commands` 목록에서 명령을 선언해야 합니다.
2. Gateway의 플랫폼 정책은 선언된 명령을 허용해야 합니다.

Windows 및 macOS 동반 노드는 기본적으로 `canvas.*`, `camera.list`, `location.get`, `screen.snapshot` 같은
안전한 선언 명령을 허용합니다.
`talk` 기능을 광고하거나 `talk.*` 명령을 선언하는 신뢰된 노드는
플랫폼 레이블과 무관하게 선언된 푸시 투 토크 명령(`talk.ptt.start`, `talk.ptt.stop`,
`talk.ptt.cancel`, `talk.ptt.once`)도 기본적으로 허용합니다.
`camera.snap`, `camera.clip`, `screen.record` 같은 위험하거나 개인정보 영향이 큰 명령은 여전히
`gateway.nodes.allowCommands`로 명시적으로 옵트인해야 합니다. `gateway.nodes.denyCommands`는 항상
기본값과 추가 허용 목록 항목보다 우선합니다.

Plugin 소유 노드 명령은 Gateway 노드 호출 정책을 추가할 수 있습니다. 해당 정책은
허용 목록 확인 후, 노드로 전달하기 전에 실행되므로 원시
`node.invoke`, CLI 헬퍼, 전용 에이전트 도구가 동일한 Plugin
권한 경계를 공유합니다. 위험한 Plugin 노드 명령은 여전히 명시적인
`gateway.nodes.allowCommands` 옵트인이 필요합니다.

노드가 선언한 명령 목록을 변경한 후에는 이전 기기 페어링을 거부하고
새 요청을 승인하여 Gateway가 업데이트된 명령 스냅샷을 저장하게 하세요.

## 구성(`openclaw.json`)

노드 관련 설정은 `gateway.nodes` 및 `tools.exec` 아래에 있습니다.

```json5
{
  gateway: {
    nodes: {
      // Auto-approve first-time node pairing from trusted networks (CIDR list).
      // Disabled when unset. Only applies to first-time role:node requests
      // with no requested scopes; does not auto-approve upgrades.
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
      // Opt into dangerous/privacy-heavy node commands (camera.snap, etc.).
      allowCommands: ["camera.snap", "screen.record"],
      // Block exact command names even if defaults or allowCommands include them.
      denyCommands: ["camera.clip"],
    },
  },
  tools: {
    exec: {
      // Default exec host: "node" routes all exec calls to a paired node.
      host: "node",
      // Security mode for node exec: allow only approved/allowlisted commands.
      security: "allowlist",
      // Pin exec to a specific node (id or name). Omit to allow any node.
      node: "build-node",
    },
  },
}
```

정확한 노드 명령 이름을 사용하세요. `denyCommands`는 플랫폼 기본값이나
`allowCommands` 항목이 달리 허용하더라도 명령을 제거합니다. Gateway 노드 페어링 및 명령 정책 필드 세부 정보는
[Gateway 구성 참조](/ko/gateway/configuration-reference#gateway-field-details)를
참조하세요.

에이전트별 exec 노드 재정의:

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

## 스크린샷(캔버스 스냅샷)

노드가 Canvas(WebView)를 표시하고 있으면 `canvas.snapshot`은 `{ format, base64 }`를 반환합니다.

CLI 헬퍼(임시 파일에 쓰고 저장된 경로를 출력):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 컨트롤

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

참고:

- `canvas present`는 URL 또는 로컬 파일 경로(`--target`)와 위치 지정을 위한 선택적 `--x/--y/--width/--height`를 받습니다.
- `canvas eval`은 인라인 JS(`--js`) 또는 위치 인수를 받습니다.

### A2UI(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고:

- 모바일 Node는 작업 가능한 렌더링을 위해 번들된 앱 소유 A2UI 페이지를 사용합니다.
- A2UI v0.8 JSONL만 지원됩니다(v0.9/createSurface는 거부됨).
- iOS와 Android는 원격 Gateway Canvas 페이지를 렌더링하지만, A2UI 버튼 작업은 번들된 앱 소유 A2UI 페이지에서만 디스패치됩니다. Gateway 호스팅 HTTP/HTTPS A2UI 페이지는 해당 모바일 클라이언트에서 렌더링 전용입니다.

## 사진 + 동영상(Node 카메라)

사진(`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # default: both facings (2 MEDIA lines)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

동영상 클립(`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고:

- `canvas.*` 및 `camera.*`를 사용하려면 Node가 **포그라운드 상태**여야 합니다(백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환).
- 클립 길이는 과도하게 큰 base64 페이로드를 피하기 위해 제한됩니다(현재 `<= 60s`).
- Android는 가능하면 `CAMERA`/`RECORD_AUDIO` 권한을 요청합니다. 권한이 거부되면 `*_PERMISSION_REQUIRED`로 실패합니다.

## 화면 녹화(Node)

지원되는 Node는 `screen.record`(mp4)를 노출합니다. 예:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고:

- `screen.record` 사용 가능 여부는 Node 플랫폼에 따라 달라집니다.
- 화면 녹화는 `<= 60s`로 제한됩니다.
- `--no-audio`는 지원되는 플랫폼에서 마이크 캡처를 비활성화합니다.
- 여러 화면을 사용할 수 있는 경우 `--screen <index>`를 사용해 디스플레이를 선택합니다.

## 위치(Node)

설정에서 위치가 활성화된 경우 Node는 `location.get`을 노출합니다.

CLI 헬퍼:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고:

- 위치는 **기본적으로 꺼져 있습니다**.
- "항상"은 시스템 권한이 필요합니다. 백그라운드 가져오기는 최선형으로 수행됩니다.
- 응답에는 위도/경도, 정확도(미터), 타임스탬프가 포함됩니다.

## SMS(Android Node)

사용자가 **SMS** 권한을 부여하고 기기가 전화 기능을 지원하면 Android Node는 `sms.send`를 노출할 수 있습니다.

저수준 호출:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고:

- 기능이 광고되기 전에 Android 기기에서 권한 요청을 수락해야 합니다.
- 전화 기능이 없는 Wi-Fi 전용 기기는 `sms.send`를 광고하지 않습니다.

## Android 기기 + 개인 데이터 명령

해당 기능이 활성화되면 Android Node는 추가 명령 패밀리를 광고할 수 있습니다.

사용 가능한 패밀리:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- Android 설정에서 설치된 앱 공유가 활성화된 경우 `device.apps`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

호출 예:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command device.apps --params '{"limit":10}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

참고:

- `device.apps`는 옵트인 방식이며 기본적으로 런처에 표시되는 앱을 반환합니다.
- 모션 명령은 사용 가능한 센서에 따라 기능 게이트가 적용됩니다.

## 시스템 명령(Node 호스트 / Mac Node)

macOS Node는 `system.run`, `system.notify`, `system.execApprovals.get/set`을 노출합니다.
헤드리스 Node 호스트는 `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

참고:

- `system.run`은 페이로드에 stdout/stderr/종료 코드를 반환합니다.
- Shell 실행은 이제 `host=node`와 함께 `exec` 도구를 거칩니다. `nodes`는 명시적인 Node 명령을 위한 직접 RPC 표면으로 남습니다.
- `nodes invoke`는 `system.run` 또는 `system.run.prepare`를 노출하지 않습니다. 이들은 exec 경로에만 유지됩니다.
- exec 경로는 승인 전에 표준 `systemRunPlan`을 준비합니다. 승인이
  부여되면 Gateway는 나중에 호출자가 수정한 command/cwd/session 필드가 아니라
  저장된 해당 계획을 전달합니다.
- `system.notify`는 macOS 앱의 알림 권한 상태를 따릅니다.
- 인식되지 않는 Node `platform` / `deviceFamily` 메타데이터는 `system.run` 및 `system.which`를 제외하는 보수적인 기본 허용 목록을 사용합니다. 알 수 없는 플랫폼에서 해당 명령이 의도적으로 필요하면 `gateway.nodes.allowCommands`를 통해 명시적으로 추가하세요.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- Shell 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 `--env` 값은 명시적 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로 축소됩니다.
- 허용 목록 모드의 항상 허용 결정에서는 알려진 디스패치 래퍼(`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`)가 래퍼 경로 대신 내부 실행 파일 경로를 유지합니다. 안전하게 래핑을 해제할 수 없으면 허용 목록 항목이 자동으로 유지되지 않습니다.
- 허용 목록 모드의 Windows Node 호스트에서는 `cmd.exe /c`를 통한 Shell 래퍼 실행에 승인이 필요합니다(허용 목록 항목만으로는 래퍼 형식이 자동 허용되지 않음).
- `system.notify`는 `--priority <passive|active|timeSensitive>` 및 `--delivery <system|overlay|auto>`를 지원합니다.
- Node 호스트는 `PATH` 재정의를 무시하고 위험한 시작/쉘 키(`DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`)를 제거합니다. 추가 PATH 항목이 필요하면 `--env`를 통해 `PATH`를 전달하는 대신 Node 호스트 서비스 환경을 구성하거나 표준 위치에 도구를 설치하세요.
- macOS Node 모드에서 `system.run`은 macOS 앱의 exec 승인으로 게이트됩니다(설정 → Exec 승인).
  요청/허용 목록/전체는 헤드리스 Node 호스트와 동일하게 동작합니다. 거부된 프롬프트는 `SYSTEM_RUN_DENIED`를 반환합니다.
- 헤드리스 Node 호스트에서 `system.run`은 exec 승인(`~/.openclaw/exec-approvals.json`)으로 게이트됩니다.

## Exec Node 바인딩

여러 Node를 사용할 수 있는 경우 exec를 특정 Node에 바인딩할 수 있습니다.
이는 `exec host=node`의 기본 Node를 설정합니다(에이전트별로 재정의 가능).

전역 기본값:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

에이전트별 재정의:

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

아무 Node나 허용하도록 해제:

```bash
openclaw config unset tools.exec.node
openclaw config unset 'agents.list[0].tools.exec.node'
```

## 권한 맵

Node는 `node.list` / `node.describe`에 `permissions` 맵을 포함할 수 있으며, 권한 이름(예: `screenRecording`, `accessibility`)을 키로 하고 boolean 값(`true` = 부여됨)을 사용합니다.

## 헤드리스 Node 호스트(크로스 플랫폼)

OpenClaw는 Gateway WebSocket에 연결하고 `system.run` / `system.which`를 노출하는
**헤드리스 Node 호스트**(UI 없음)를 실행할 수 있습니다. 이는 Linux/Windows에서 또는
서버와 함께 최소 Node를 실행할 때 유용합니다.

시작:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고:

- 페어링은 여전히 필요합니다(Gateway에 기기 페어링 프롬프트가 표시됨).
- Node 호스트는 Node ID, 토큰, 표시 이름, Gateway 연결 정보를 `~/.openclaw/node.json`에 저장합니다.
- Exec 승인은 `~/.openclaw/exec-approvals.json`을 통해 로컬에서 적용됩니다
  ([Exec 승인](/ko/tools/exec-approvals) 참조).
- macOS에서 헤드리스 Node 호스트는 기본적으로 `system.run`을 로컬에서 실행합니다.
  `OPENCLAW_NODE_EXEC_HOST=app`을 설정하면 `system.run`을 동반 앱 exec 호스트를 통해 라우팅합니다.
  `OPENCLAW_NODE_EXEC_FALLBACK=0`을 추가하면 앱 호스트를 필수로 요구하고 사용할 수 없을 때 닫힌 실패로 처리합니다.
- Gateway WS가 TLS를 사용하는 경우 `--tls` / `--tls-fingerprint`를 추가하세요.

## Mac Node 모드

- macOS 메뉴 막대 앱은 Node로 Gateway WS 서버에 연결합니다(따라서 이 Mac을 대상으로 `openclaw nodes …`가 작동함).
- 원격 모드에서는 앱이 Gateway 포트에 대한 SSH 터널을 열고 `localhost`에 연결합니다.
