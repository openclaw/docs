---
read_when:
    - macOS 앱 기능 구현하기
    - macOS에서 Gateway 수명 주기 또는 Node 브리징 변경하기
summary: OpenClaw macOS 컴패니언 앱(메뉴 막대 + Gateway 브로커)
title: macOS 앱
x-i18n:
    generated_at: "2026-04-18T05:51:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: d637df2f73ced110223c48ea3c934045d782e150a46495f434cf924a6a00baf0
    source_path: platforms/macos.md
    workflow: 15
---

# OpenClaw macOS 컴패니언(메뉴 막대 + Gateway 브로커)

macOS 앱은 OpenClaw의 **메뉴 막대 컴패니언**입니다. 이 앱은 권한을 관리하고,
로컬에서 Gateway를 관리/연결하며(launchd 또는 수동), 에이전트에 macOS
기능을 node로 노출합니다.

## 수행 기능

- 메뉴 막대에 기본 알림과 상태를 표시합니다.
- TCC 프롬프트(알림, 손쉬운 사용, 화면 기록, 마이크,
  음성 인식, 자동화/AppleScript)를 관리합니다.
- Gateway를 실행하거나 연결합니다(로컬 또는 원격).
- macOS 전용 도구(Canvas, Camera, Screen Recording, `system.run`)를 노출합니다.
- **remote** 모드에서는 로컬 node 호스트 서비스를 시작하고(launchd), **local** 모드에서는 중지합니다.
- 선택적으로 UI 자동화를 위해 **PeekabooBridge**를 호스팅합니다.
- 요청 시 npm, pnpm 또는 bun을 통해 전역 CLI(`openclaw`)를 설치합니다(앱은 npm, 그다음 pnpm, 그다음 bun을 선호하며, Node는 계속 권장되는 Gateway 런타임입니다).

## local 모드와 remote 모드

- **Local**(기본값): 앱은 실행 중인 로컬 Gateway가 있으면 여기에 연결하고,
  없으면 `openclaw gateway install`을 통해 launchd 서비스를 활성화합니다.
- **Remote**: 앱은 SSH/Tailscale을 통해 Gateway에 연결하며 로컬 프로세스를
  시작하지 않습니다.
  앱은 원격 Gateway가 이 Mac에 도달할 수 있도록 로컬 **node host service**를 시작합니다.
  앱은 Gateway를 자식 프로세스로 생성하지 않습니다.
  이제 Gateway 검색은 원시 tailnet IP보다 Tailscale MagicDNS 이름을 우선하므로,
  tailnet IP가 바뀌어도 Mac 앱이 더 안정적으로 복구됩니다.

## launchd 제어

앱은 `ai.openclaw.gateway`라는 레이블의 사용자별 LaunchAgent를 관리합니다
(`--profile`/`OPENCLAW_PROFILE` 사용 시 `ai.openclaw.<profile>`; 기존 `com.openclaw.*`도 계속 언로드됨).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

이름 있는 프로필을 실행 중이면 레이블을 `ai.openclaw.<profile>`로 바꾸세요.

LaunchAgent가 설치되어 있지 않으면 앱에서 활성화하거나
`openclaw gateway install`을 실행하세요.

## Node 기능(mac)

macOS 앱은 자신을 node로 표시합니다. 일반적인 명령:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

이 node는 에이전트가 무엇이 허용되는지 판단할 수 있도록 `permissions` 맵을 보고합니다.

Node 서비스 + 앱 IPC:

- 헤드리스 node 호스트 서비스가 실행 중이면(remote 모드), Gateway WS에 node로 연결됩니다.
- `system.run`은 로컬 Unix 소켓을 통해 macOS 앱(UI/TCC 컨텍스트)에서 실행되며, 프롬프트와 출력은 앱 내부에 유지됩니다.

다이어그램(SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## 실행 승인(`system.run`)

`system.run`은 macOS 앱의 **Exec approvals**(설정 → Exec approvals)로 제어됩니다.
보안 + 확인 + 허용 목록은 Mac의 다음 위치에 로컬로 저장됩니다.

```
~/.openclaw/exec-approvals.json
```

예시:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

참고:

- `allowlist` 항목은 해석된 바이너리 경로에 대한 glob 패턴입니다.
- 셸 제어 또는 확장 문법(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`)을 포함하는 원시 셸 명령 텍스트는 허용 목록 미일치로 처리되며 명시적 승인(또는 셸 바이너리 허용 목록 등록)이 필요합니다.
- 프롬프트에서 “Always Allow”를 선택하면 해당 명령이 허용 목록에 추가됩니다.
- `system.run` 환경 변수 재정의는 필터링되며(`PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4` 제거), 그 후 앱의 환경과 병합됩니다.
- 셸 래퍼(`bash|sh|zsh ... -c/-lc`)의 경우 요청 범위 환경 변수 재정의는 작은 명시적 허용 목록(`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`)으로 축소됩니다.
- 허용 목록 모드에서 항상 허용 결정 시, 알려진 디스패치 래퍼(`env`, `nice`, `nohup`, `stdbuf`, `timeout`)는 래퍼 경로 대신 내부 실행 파일 경로를 유지합니다. 안전하게 언래핑할 수 없으면 허용 목록 항목이 자동으로 저장되지 않습니다.

## 딥 링크

앱은 로컬 작업을 위해 `openclaw://` URL 스킴을 등록합니다.

### `openclaw://agent`

Gateway `agent` 요청을 트리거합니다.
__OC_I18N_900004__
쿼리 매개변수:

- `message`(필수)
- `sessionKey`(선택 사항)
- `thinking`(선택 사항)
- `deliver` / `to` / `channel`(선택 사항)
- `timeoutSeconds`(선택 사항)
- `key`(선택 사항, 무인 모드 키)

안전:

- `key`가 없으면 앱이 확인을 요청합니다.
- `key`가 없으면 앱은 확인 프롬프트에 짧은 메시지 제한을 적용하고 `deliver` / `to` / `channel`을 무시합니다.
- 유효한 `key`가 있으면 실행은 무인으로 진행됩니다(개인 자동화용).

## 온보딩 흐름(일반적)

1. **OpenClaw.app**을 설치하고 실행합니다.
2. 권한 체크리스트(TCC 프롬프트)를 완료합니다.
3. **Local** 모드가 활성 상태이고 Gateway가 실행 중인지 확인합니다.
4. 터미널 접근이 필요하면 CLI를 설치합니다.

## 상태 디렉터리 위치(macOS)

OpenClaw 상태 디렉터리를 iCloud 또는 다른 클라우드 동기화 폴더에 두지 마세요.
동기화 기반 경로는 지연 시간을 추가할 수 있고 때때로 세션 및 자격 증명에 대해
파일 잠금/동기화 경쟁 상태를 유발할 수 있습니다.

다음과 같은 로컬 비동기화 상태 경로를 권장합니다.
__OC_I18N_900005__
`openclaw doctor`가 다음 위치 아래의 상태를 감지하면:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

경고를 표시하고 로컬 경로로 다시 이동할 것을 권장합니다.

## 빌드 및 개발 워크플로(native)

- `cd apps/macos && swift build`
- `swift run OpenClaw`(또는 Xcode)
- 앱 패키징: `scripts/package-mac-app.sh`

## Gateway 연결 디버그(macOS CLI)

앱을 실행하지 않고도 macOS 앱이 사용하는 것과 동일한 Gateway WebSocket 핸드셰이크 및 검색
로직을 디버그 CLI로 실행할 수 있습니다.
__OC_I18N_900006__
연결 옵션:

- `--url <ws://host:port>`: config 재정의
- `--mode <local|remote>`: config에서 해석(기본값: config 또는 local)
- `--probe`: 새 상태 프로브 강제 실행
- `--timeout <ms>`: 요청 제한 시간(기본값: `15000`)
- `--json`: diff 비교를 위한 구조화된 출력

검색 옵션:

- `--include-local`: “local”로 필터링될 Gateway도 포함
- `--timeout <ms>`: 전체 검색 시간 창(기본값: `2000`)
- `--json`: diff 비교를 위한 구조화된 출력

팁: `openclaw gateway discover --json`과 비교하여
macOS 앱의 검색 파이프라인(`local.` 및 구성된 광역 도메인, 광역 및 Tailscale Serve 폴백 포함)이
Node CLI의 `dns-sd` 기반 검색과 다른지 확인하세요.

## 원격 연결 배선(SSH 터널)

macOS 앱이 **Remote** 모드로 실행될 때, 로컬 UI
구성 요소가 원격 Gateway와 localhost에 있는 것처럼 통신할 수 있도록 SSH 터널을 엽니다.

### 제어 터널(Gateway WebSocket 포트)

- **용도:** 상태 확인, 상태 표시, Web Chat, config 및 기타 컨트롤 플레인 호출.
- **로컬 포트:** Gateway 포트(기본값 `18789`), 항상 고정됨.
- **원격 포트:** 원격 호스트의 동일한 Gateway 포트.
- **동작:** 임의의 로컬 포트를 사용하지 않으며, 앱은 기존의 정상 터널을 재사용하거나 필요 시 다시 시작합니다.
- **SSH 형태:** `ssh -N -L <local>:127.0.0.1:<remote>`와 BatchMode +
  ExitOnForwardFailure + keepalive 옵션 사용.
- **IP 보고:** SSH 터널은 loopback을 사용하므로 gateway는 node
  IP를 `127.0.0.1`로 보게 됩니다. 실제 클라이언트 IP가 표시되길 원하면 **Direct (ws/wss)** 전송을 사용하세요([macOS remote access](/ko/platforms/mac/remote) 참고).

설정 단계는 [macOS remote access](/ko/platforms/mac/remote)를 참고하세요. 프로토콜
세부 정보는 [Gateway protocol](/ko/gateway/protocol)을 참고하세요.

## 관련 문서

- [Gateway runbook](/ko/gateway)
- [Gateway (macOS)](/ko/platforms/mac/bundled-gateway)
- [macOS permissions](/ko/platforms/mac/permissions)
- [Canvas](/ko/platforms/mac/canvas)
