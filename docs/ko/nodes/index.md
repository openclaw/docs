---
read_when:
    - iOS/Android node를 Gateway에 페어링하기
    - 에이전트 컨텍스트를 위해 node canvas/camera 사용하기
    - 새 node 명령 또는 CLI helper 추가하기
summary: 'Node: pairing, capability, 권한, 그리고 canvas/camera/screen/device/notifications/system용 CLI helper'
title: Node
x-i18n:
    generated_at: "2026-04-26T11:33:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 611678b91b0e54910fded6f7d25bf4b5ef03e0a4e1da6d72f5ccf30d18054d3d
    source_path: nodes/index.md
    workflow: 15
---

**node**는 Gateway **WebSocket**(operator와 동일한 포트)에 `role: "node"`로 연결되고 `node.invoke`를 통해 명령 표면(예: `canvas.*`, `camera.*`, `device.*`, `notifications.*`, `system.*`)을 노출하는 동반 디바이스(macOS/iOS/Android/headless)입니다. 프로토콜 세부 사항: [Gateway 프로토콜](/ko/gateway/protocol).

레거시 전송: [Bridge 프로토콜](/ko/gateway/bridge-protocol) (TCP JSONL;
현재 node에 대해서는 역사적 용도만 있음).

macOS도 **node 모드**로 실행할 수 있습니다. 메뉴바 앱이 Gateway의
WS 서버에 연결하고 로컬 canvas/camera 명령을 node로 노출하므로
`openclaw nodes …`가 이 Mac을 대상으로 작동합니다. 원격 Gateway 모드에서는 브라우저
자동화는 네이티브 앱 node가 아니라 CLI node 호스트(`openclaw node run` 또는
설치된 node 서비스)가 처리합니다.

참고:

- node는 **주변 장치**이지 Gateway가 아닙니다. Gateway 서비스를 실행하지 않습니다.
- Telegram/WhatsApp 등의 메시지는 node가 아니라 **Gateway**에 도착합니다.
- 문제 해결 런북: [/nodes/troubleshooting](/ko/nodes/troubleshooting)

## 페어링 + 상태

**WS node는 device pairing을 사용합니다.** node는 `connect` 중에 device identity를 제시하며, Gateway는 `role: node`에 대한 device pairing 요청을 생성합니다. devices CLI(또는 UI)로 승인하세요.

빠른 CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

node가 변경된 인증 세부 정보(role/scopes/public key)로 재시도하면,
이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다. 승인 전에
`openclaw devices list`를 다시 실행하세요.

참고:

- `nodes status`는 해당 device pairing role에 `node`가 포함되면 node를 **paired**로 표시합니다.
- device pairing 레코드는 지속적인 승인 role 계약입니다. token
  교체는 이 계약 내부에서만 이루어지며, pairing 승인이 한 번도 부여하지 않은
  다른 role로 페어링된 node를 업그레이드할 수 없습니다.
- `node.pair.*`(CLI: `openclaw nodes pending/approve/reject/rename`)는 별도의 Gateway 소유
  node pairing 저장소입니다. 이는 WS `connect` 핸드셰이크를 제어하지 **않습니다**.
- 승인 scope는 대기 요청의 선언된 명령을 따릅니다:
  - 명령 없는 요청: `operator.pairing`
  - exec가 아닌 node 명령: `operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`: `operator.pairing` + `operator.admin`

## 원격 node 호스트(`system.run`)

Gateway가 한 머신에서 실행되고 다른 머신에서 명령을
실행하려면 **node 호스트**를 사용하세요. 모델은 여전히 **Gateway**와 통신하며, `host=node`가 선택되면 Gateway가 `exec` 호출을 **node 호스트**로 전달합니다.

### 무엇이 어디서 실행되는가

- **Gateway 호스트**: 메시지를 수신하고, 모델을 실행하고, 도구 호출을 라우팅합니다.
- **Node 호스트**: node 머신에서 `system.run`/`system.which`를 실행합니다.
- **승인**: node 호스트의 `~/.openclaw/exec-approvals.json`을 통해 강제됩니다.

승인 참고:

- 승인 기반 node 실행은 정확한 요청 컨텍스트를 바인딩합니다.
- 직접 셸/런타임 파일 실행의 경우, OpenClaw는 최선형으로 하나의 구체적인 로컬
  파일 피연산자도 바인딩하며, 실행 전에 해당 파일이 변경되면 실행을 거부합니다.
- OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 구체적인 로컬 파일을 식별할 수 없으면,
  전체 런타임 범위를 지원하는 척하지 않고 승인 기반 실행을 거부합니다. 더 넓은 인터프리터 의미 체계가 필요하면 샌드박싱,
  별도 호스트, 또는 명시적인 신뢰 allowlist/전체 워크플로를 사용하세요.

### node 호스트 시작(포그라운드)

node 머신에서:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### SSH 터널을 통한 원격 Gateway(loopback 바인드)

Gateway가 loopback에 바인딩된 경우(`gateway.bind=loopback`, 로컬 모드 기본값),
원격 node 호스트는 직접 연결할 수 없습니다. SSH 터널을 만들고
node 호스트가 터널의 로컬 끝을 가리키도록 하세요.

예시(node 호스트 -> Gateway 호스트):

```bash
# 터미널 A(계속 실행): 로컬 18790 -> Gateway 127.0.0.1:18789 전달
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 터미널 B: Gateway token을 export하고 터널을 통해 연결
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

참고:

- `openclaw node run`은 token 또는 password 인증을 지원합니다.
- 환경 변수가 권장됩니다: `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`.
- 구성 fallback은 `gateway.auth.token` / `gateway.auth.password`입니다.
- 로컬 모드에서 node 호스트는 의도적으로 `gateway.remote.token` / `gateway.remote.password`를 무시합니다.
- 원격 모드에서는 `gateway.remote.token` / `gateway.remote.password`가 원격 우선순위 규칙에 따라 적용될 수 있습니다.
- 활성 로컬 `gateway.auth.*` SecretRef가 구성되어 있지만 해석되지 않으면 node 호스트 인증은 안전하게 실패합니다.
- node 호스트 인증 해석은 `OPENCLAW_GATEWAY_*` 환경 변수만 인정합니다.

### node 호스트 시작(서비스)

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

node가 변경된 인증 세부 정보로 재시도하면 `openclaw devices list`를 다시 실행하고 현재 `requestId`를 승인하세요.

이름 지정 옵션:

- `openclaw node run` / `openclaw node install`의 `--display-name`(node의 `~/.openclaw/node.json`에 유지됨)
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`(Gateway 재정의)

### 명령 allowlist 설정

Exec 승인은 **node 호스트별**입니다. Gateway에서 allowlist 항목을 추가하세요:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

승인은 node 호스트의 `~/.openclaw/exec-approvals.json`에 저장됩니다.

### exec를 node로 지정

기본값 구성(Gateway config):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

또는 세션별로:

```
/exec host=node security=allowlist node=<id-or-name>
```

설정되면 `host=node`가 있는 모든 `exec` 호출은 node 호스트에서 실행됩니다(node allowlist/승인 적용).

`host=auto`는 자체적으로 node를 암묵 선택하지 않지만, 호출별로 명시한 `host=node` 요청은 `auto`에서 허용됩니다. 세션의 기본 exec를 node로 만들려면 `tools.exec.host=node` 또는 `/exec host=node ...`를 명시적으로 설정하세요.

관련 항목:

- [Node 호스트 CLI](/ko/cli/node)
- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)

## 명령 호출

저수준(raw RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

에이전트에 MEDIA 첨부를 제공하는 일반적인 워크플로에는 더 상위 수준의 helper가 있습니다.

## 스크린샷(canvas 스냅샷)

node가 Canvas(WebView)를 표시 중이면 `canvas.snapshot`은 `{ format, base64 }`를 반환합니다.

CLI helper(임시 파일에 기록하고 `MEDIA:<path>` 출력):

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

- `canvas present`는 URL 또는 로컬 파일 경로(`--target`)를 받을 수 있으며, 위치 지정을 위해 선택적으로 `--x/--y/--width/--height`를 받을 수 있습니다.
- `canvas eval`은 인라인 JS(`--js`) 또는 위치 인수를 받습니다.

### A2UI(Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

참고:

- A2UI v0.8 JSONL만 지원됩니다(v0.9/createSurface는 거부됨).

## 사진 + 비디오(node camera)

사진(`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 기본값: 양쪽 facing(2개 MEDIA 줄)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

비디오 클립(`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

참고:

- `canvas.*` 및 `camera.*`에는 node가 **foreground** 상태여야 합니다(백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE` 반환).
- 클립 길이는 너무 큰 base64 페이로드를 피하기 위해 제한됩니다(현재 `<= 60s`).
- Android는 가능하면 `CAMERA`/`RECORD_AUDIO` 권한을 요청하며, 거부된 권한은 `*_PERMISSION_REQUIRED`로 실패합니다.

## 화면 녹화(node)

지원되는 node는 `screen.record`(mp4)를 노출합니다. 예시:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

참고:

- `screen.record` 사용 가능 여부는 node 플랫폼에 따라 다릅니다.
- 화면 녹화는 `<= 60s`로 제한됩니다.
- `--no-audio`는 지원되는 플랫폼에서 마이크 캡처를 비활성화합니다.
- 화면이 여러 개인 경우 `--screen <index>`로 디스플레이를 선택하세요.

## 위치(node)

node는 설정에서 위치가 활성화된 경우 `location.get`을 노출합니다.

CLI helper:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

참고:

- 위치는 기본적으로 **꺼져 있습니다**.
- “Always”는 시스템 권한이 필요하며, 백그라운드 가져오기는 best-effort입니다.
- 응답에는 위도/경도, 정확도(미터), 타임스탬프가 포함됩니다.

## SMS(Android node)

Android node는 사용자가 **SMS** 권한을 부여하고 디바이스가 전화 기능을 지원하는 경우 `sms.send`를 노출할 수 있습니다.

저수준 invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

참고:

- capability가 광고되기 전에 Android 디바이스에서 권한 프롬프트를 수락해야 합니다.
- 전화 기능이 없는 Wi‑Fi 전용 디바이스는 `sms.send`를 광고하지 않습니다.

## Android device + 개인 데이터 명령

Android node는 해당 capability가 활성화되면 추가 명령 계열을 광고할 수 있습니다.

사용 가능한 계열:

- `device.status`, `device.info`, `device.permissions`, `device.health`
- `notifications.list`, `notifications.actions`
- `photos.latest`
- `contacts.search`, `contacts.add`
- `calendar.events`, `calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`, `motion.pedometer`

예시 invoke:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

참고:

- 모션 명령은 사용 가능한 센서에 따라 capability 게이트가 적용됩니다.

## 시스템 명령(node 호스트 / mac node)

macOS node는 `system.run`, `system.notify`, `system.execApprovals.get/set`을 노출합니다.
headless node 호스트는 `system.run`, `system.which`, `system.execApprovals.get/set`을 노출합니다.

예시:

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

참고:

- `system.run`은 payload에 stdout/stderr/종료 코드를 반환합니다.
- 셸 실행은 이제 `host=node`와 함께 `exec` 도구를 통해 이루어집니다. `nodes`는 명시적인 node 명령을 위한 direct-RPC 표면으로 유지됩니다.
- `nodes invoke`는 `system.run` 또는 `system.run.prepare`를 노출하지 않습니다. 이들은 `exec` 경로에서만 유지됩니다.
- `exec` 경로는 승인 전에 정규 `systemRunPlan`을 준비합니다. 승인이 부여되면 Gateway는 이후 호출자가 편집한 command/cwd/session 필드가 아니라 저장된 해당 계획을 전달합니다.
- `system.notify`는 macOS 앱의 알림 권한 상태를 존중합니다.
- 인식할 수 없는 node `platform` / `deviceFamily` 메타데이터에는 `system.run`과 `system.which`를 제외하는 보수적인 기본 allowlist가 사용됩니다. 알 수 없는 플랫폼에 대해 의도적으로 이러한 명령이 필요하면 `gateway.nodes.allowCommands`를 통해 명시적으로 추가하세요.
- `system.run`은 `--cwd`, `--env KEY=VAL`, `--command-timeout`, `--needs-screen-recording`을 지원합니다.
- 셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 `--env` 값은 명시적 allowlist(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)로 축소됩니다.
- allowlist 모드에서 always 허용 결정을 내릴 때, 알려진 dispatch 래퍼(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로가 아니라 내부 실행 파일 경로를 유지합니다. 안전하게 unwrap할 수 없으면 allowlist 항목은 자동으로 유지되지 않습니다.
- Windows node 호스트의 allowlist 모드에서는 `cmd.exe /c`를 통한 셸 래퍼 실행에 승인이 필요합니다(allowlist 항목만으로는 해당 래퍼 형식을 자동 허용하지 않음).
- `system.notify`는 `--priority <passive|active|timeSensitive>` 및 `--delivery <system|overlay|auto>`를 지원합니다.
- node 호스트는 `PATH` 재정의를 무시하고 위험한 startup/shell 키(`DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`)를 제거합니다. 추가 PATH 항목이 필요하면 `--env`로 `PATH`를 전달하는 대신 node 호스트 서비스 환경을 구성하거나(또는 표준 위치에 도구를 설치하거나) 하세요.
- macOS node 모드에서 `system.run`은 macOS 앱의 exec 승인(Settings → Exec approvals)으로 게이트됩니다.
  ask/allowlist/full은 headless node 호스트와 동일하게 동작하며, 거부된 프롬프트는 `SYSTEM_RUN_DENIED`를 반환합니다.
- headless node 호스트에서 `system.run`은 exec 승인(`~/.openclaw/exec-approvals.json`)으로 게이트됩니다.

## Exec node 바인딩

여러 node를 사용할 수 있을 때 exec를 특정 node에 바인딩할 수 있습니다.
이렇게 하면 `exec host=node`의 기본 node가 설정되며(에이전트별로 재정의 가능) 사용됩니다.

전역 기본값:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

에이전트별 재정의:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

어떤 node든 허용하려면 설정 해제:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 권한 맵

node는 `node.list` / `node.describe`에 권한 이름(예: `screenRecording`, `accessibility`)을 키로 하고 boolean 값(`true` = 부여됨)을 값으로 하는 `permissions` 맵을 포함할 수 있습니다.

## headless node 호스트(크로스 플랫폼)

OpenClaw는 Gateway
WebSocket에 연결하고 `system.run` / `system.which`를 노출하는 **headless node 호스트**(UI 없음)를 실행할 수 있습니다. 이는 Linux/Windows에서 또는 서버와 함께 최소 node를 실행할 때 유용합니다.

시작 방법:

```bash
openclaw node run --host <gateway-host> --port 18789
```

참고:

- 여전히 pairing이 필요합니다(Gateway에 device pairing 프롬프트가 표시됨).
- node 호스트는 node ID, token, 표시 이름, Gateway 연결 정보를 `~/.openclaw/node.json`에 저장합니다.
- exec 승인은 `~/.openclaw/exec-approvals.json`을 통해 로컬에서 강제됩니다
  ([Exec 승인](/ko/tools/exec-approvals) 참조).
- macOS에서 headless node 호스트는 기본적으로 `system.run`을 로컬에서 실행합니다. `system.run`을 companion 앱 exec 호스트를 통해 라우팅하려면
  `OPENCLAW_NODE_EXEC_HOST=app`을 설정하세요. 앱 호스트가 필요하며 없으면 안전하게 실패하도록 하려면
  `OPENCLAW_NODE_EXEC_FALLBACK=0`도 추가하세요.
- Gateway WS가 TLS를 사용할 경우 `--tls` / `--tls-fingerprint`를 추가하세요.

## Mac node 모드

- macOS 메뉴바 앱은 Gateway WS 서버에 node로 연결됩니다(따라서 `openclaw nodes …`가 이 Mac에 대해 작동함).
- 원격 모드에서는 앱이 Gateway 포트에 대한 SSH 터널을 열고 `localhost`에 연결합니다.
