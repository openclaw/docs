---
read_when:
    - 원격 Gateway 설정 실행 또는 문제 해결
summary: Gateway WS, SSH 터널 및 tailnet을 사용한 원격 액세스
title: 원격 액세스
x-i18n:
    generated_at: "2026-06-27T17:31:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

이 저장소는 전용 호스트(데스크톱/서버)에서 단일 Gateway(마스터)를 계속 실행하고 클라이언트를 여기에 연결하여 원격 게이트웨이 접근을 지원합니다.

- **운영자(사용자 / macOS 앱)**의 경우: 게이트웨이에 접근할 수 있으면 직접 LAN/Tailnet 웹소켓이 가장 단순하며, SSH 터널링은 범용 대체 수단입니다.
- **노드(iOS/Android 및 향후 기기)**의 경우: 필요에 따라 LAN/tailnet 또는 SSH 터널을 사용해 Gateway **웹소켓**에 연결합니다.

## 핵심 아이디어

- Gateway 웹소켓은 일반적으로 구성된 포트(기본값 18789)의 **loopback**에 바인딩됩니다.
- 원격 사용을 위해 Tailscale Serve 또는 신뢰할 수 있는 LAN/Tailnet 바인딩을 통해 노출하거나, SSH로 loopback 포트를 포워딩합니다.

## 일반적인 VPN 및 tailnet 설정

**Gateway 호스트**를 에이전트가 존재하는 위치로 생각하세요. 이 호스트가 세션, 인증 프로필, 채널, 상태를 소유합니다. 노트북, 데스크톱, 노드가 이 호스트에 연결합니다.

### tailnet에서 항상 켜져 있는 Gateway

영구 호스트(VPS 또는 홈 서버)에서 Gateway를 실행하고 **Tailscale** 또는 SSH로 접근합니다.

- **최고의 UX:** `gateway.bind: "loopback"`을 유지하고 제어 UI에 **Tailscale Serve**를 사용합니다.
- **신뢰할 수 있는 LAN/Tailnet:** 게이트웨이를 프라이빗 인터페이스에 바인딩하고 `gateway.remote.transport: "direct"`로 직접 연결합니다.
- **대체 수단:** loopback을 유지하고 접근이 필요한 모든 머신에서 SSH 터널을 사용합니다.
- **예시:** [exe.dev](/ko/install/exe-dev)(간편 VM) 또는 [Hetzner](/ko/install/hetzner)(프로덕션 VPS).

노트북이 자주 절전 상태가 되지만 에이전트를 항상 켜 두고 싶을 때 이상적입니다.

### 홈 데스크톱에서 Gateway 실행

노트북은 **에이전트를 실행하지 않습니다**. 원격으로 연결합니다.

- macOS 앱의 원격 모드를 사용합니다(설정 → 일반 → OpenClaw 실행 위치).
- 게이트웨이에 LAN/Tailnet으로 접근할 수 있으면 앱이 직접 연결하고, SSH를 선택하면 SSH 터널을 열고 관리합니다.

운영 절차: [macOS 원격 접근](/ko/platforms/mac/remote).

### 노트북에서 Gateway 실행

Gateway는 로컬에 유지하되 안전하게 노출합니다.

- 다른 머신에서 노트북으로 SSH 터널을 연결하거나,
- Tailscale Serve로 제어 UI를 제공하고 Gateway는 loopback 전용으로 유지합니다.

가이드: [Tailscale](/ko/gateway/tailscale) 및 [웹 개요](/ko/web).

## 명령 흐름(어디에서 무엇이 실행되는가)

하나의 게이트웨이 서비스가 상태와 채널을 소유합니다. 노드는 주변 장치입니다.

흐름 예시(Telegram → 노드):

- Telegram 메시지가 **Gateway**에 도착합니다.
- Gateway가 **에이전트**를 실행하고 노드 도구를 호출할지 결정합니다.
- Gateway가 Gateway 웹소켓(`node.*` RPC)을 통해 **노드**를 호출합니다.
- 노드가 결과를 반환하고, Gateway가 Telegram으로 답장을 보냅니다.

참고:

- **노드는 게이트웨이 서비스를 실행하지 않습니다.** 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 하나의 게이트웨이만 실행해야 합니다([여러 게이트웨이](/ko/gateway/multiple-gateways) 참조).
- macOS 앱의 “노드 모드”는 Gateway 웹소켓을 사용하는 노드 클라이언트일 뿐입니다.

## SSH 터널(CLI + 도구)

원격 Gateway WS로 로컬 터널을 생성합니다.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

터널이 열려 있으면:

- `openclaw health` 및 `openclaw status --deep`가 이제 `ws://127.0.0.1:18789`를 통해 원격 게이트웨이에 접근합니다.
- 필요할 때 `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, `openclaw gateway call`도 `--url`로 포워딩된 URL을 대상으로 지정할 수 있습니다.

<Note>
`18789`를 구성된 `gateway.port`(또는 `--port` 또는 `OPENCLAW_GATEWAY_PORT`)로 바꾸세요.
</Note>

<Warning>
`--url`을 전달하면 CLI는 구성 또는 환경 자격 증명으로 대체하지 않습니다. `--token` 또는 `--password`를 명시적으로 포함하세요. 명시적 자격 증명이 없으면 오류입니다.
</Warning>

## CLI 원격 기본값

CLI 명령이 기본적으로 사용하도록 원격 대상을 유지할 수 있습니다.

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

게이트웨이가 loopback 전용이면 URL을 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 여세요.
macOS 앱의 SSH 터널 전송에서는 발견된 게이트웨이 호스트 이름이
`gateway.remote.sshTarget`에 속하며, `gateway.remote.url`은 로컬 터널 URL로 남습니다.
해당 포트가 다르면 `gateway.remote.remotePort`를 SSH 호스트의 게이트웨이 포트로 설정하세요.

신뢰할 수 있는 LAN 또는 Tailnet에서 이미 접근 가능한 게이트웨이의 경우 직접 모드를 사용합니다.

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## 자격 증명 우선순위

Gateway 자격 증명 해석은 호출/프로브/상태 경로와 Discord 실행 승인 모니터링 전반에서 하나의 공유 계약을 따릅니다. 노드 호스트는 하나의 로컬 모드 예외를 제외하고 동일한 기본 계약을 사용합니다(의도적으로 `gateway.remote.*`를 무시합니다).

- 명시적 자격 증명(`--token`, `--password` 또는 도구 `gatewayToken`)은 명시적 인증을 허용하는 호출 경로에서 항상 우선합니다.
- URL 재정의 안전성:
  - CLI URL 재정의(`--url`)는 암시적 구성/env 자격 증명을 절대 재사용하지 않습니다.
  - Env URL 재정의(`OPENCLAW_GATEWAY_URL`)는 env 자격 증명(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)만 사용할 수 있습니다.
- 로컬 모드 기본값:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`(원격 대체는 로컬 인증 토큰 입력이 설정되지 않은 경우에만 적용)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`(원격 대체는 로컬 인증 비밀번호 입력이 설정되지 않은 경우에만 적용)
- 원격 모드 기본값:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 노드 호스트 로컬 모드 예외: `gateway.remote.token` / `gateway.remote.password`는 무시됩니다.
- 원격 프로브/상태 토큰 검사는 기본적으로 엄격합니다. 원격 모드를 대상으로 할 때 `gateway.remote.token`만 사용합니다(로컬 토큰 대체 없음).
- Gateway env 재정의는 `OPENCLAW_GATEWAY_*`만 사용합니다.

## 채팅 UI 원격 접근

WebChat은 더 이상 별도의 HTTP 포트를 사용하지 않습니다. SwiftUI 채팅 UI는 Gateway 웹소켓에 직접 연결됩니다.

- SSH로 `18789`를 포워딩한 다음(위 참조), 클라이언트를 `ws://127.0.0.1:18789`에 연결합니다.
- LAN/Tailnet 직접 모드의 경우, 클라이언트를 구성된 프라이빗 `ws://` 또는 보안 `wss://` URL에 연결합니다.
- macOS에서는 선택한 전송을 자동으로 관리하는 앱의 원격 모드를 선호하세요.

## macOS 앱 원격 모드

macOS 메뉴 막대 앱은 동일한 설정을 처음부터 끝까지 구동할 수 있습니다(원격 상태 확인, WebChat, Voice Wake 포워딩).

운영 절차: [macOS 원격 접근](/ko/platforms/mac/remote).

## 보안 규칙(원격/VPN)

짧게 말하면: 바인딩이 반드시 필요하다고 확신하지 않는 한 **Gateway를 loopback 전용으로 유지하세요**.

- **Loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다(공개 노출 없음).
- 평문 `ws://`는 loopback, LAN, link-local, `.local`, `.ts.net`, Tailscale CGNAT 호스트에 허용됩니다. 공개 원격 호스트는 `wss://`를 사용해야 합니다.
- **Non-loopback 바인딩**(`lan`/`tailnet`/`custom`, 또는 loopback을 사용할 수 없을 때의 `auto`)은 토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 있는 ID 인식 리버스 프록시 같은 게이트웨이 인증을 사용해야 합니다.
- `gateway.remote.token` / `.password`는 클라이언트 자격 증명 소스입니다. 이것만으로는 서버 인증을 구성하지 않습니다.
- 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, 해석은 실패 폐쇄됩니다(원격 대체로 가려지지 않음).
- `gateway.remote.tlsFingerprint`는 macOS 직접 모드를 포함하여 `wss://` 사용 시 원격 TLS 인증서를 고정합니다. 구성된 핀이나 이전에 저장된 핀이 없으면, macOS는 정상적인 시스템 신뢰 검사를 통과한 뒤 첫 사용 인증서만 고정합니다. macOS가 이미 신뢰하지 않는 자체 서명 또는 프라이빗 CA 게이트웨이에는 명시적 지문 또는 SSH를 통한 원격이 필요합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 ID
  헤더를 통해 제어 UI/웹소켓 트래픽을 인증할 수 있습니다. HTTP API 엔드포인트는 해당
  Tailscale 헤더 인증을 사용하지 않고, 대신 게이트웨이의 일반 HTTP
  인증 모드를 따릅니다. 이 토큰 없는 흐름은 게이트웨이 호스트가 신뢰된다고 가정합니다. 모든 곳에서
  공유 비밀 인증을 원하면 `false`로 설정하세요.
- **Trusted-proxy** 인증은 기본적으로 non-loopback ID 인식 프록시 설정을 기대합니다.
  동일 호스트 loopback 리버스 프록시는 명시적인 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
- 브라우저 제어를 운영자 접근처럼 취급하세요: tailnet 전용 + 의도적인 노드 페어링.

심층 설명: [보안](/ko/gateway/security).

### macOS: LaunchAgent를 통한 영구 SSH 터널

원격 게이트웨이에 연결하는 macOS 클라이언트의 경우, 가장 쉬운 영구 설정은 SSH `LocalForward` 구성 항목과 LaunchAgent를 사용해 재부팅 및 충돌 후에도 터널을 유지하는 것입니다.

#### 1단계: SSH 구성 추가

`~/.ssh/config`를 편집합니다.

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>` 및 `<REMOTE_USER>`를 사용자 값으로 바꾸세요.

#### 2단계: SSH 키 복사(일회성)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3단계: 게이트웨이 토큰 구성

재시작 후에도 유지되도록 토큰을 구성에 저장합니다.

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4단계: LaunchAgent 생성

다음을 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`로 저장합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### 5단계: LaunchAgent 로드

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

터널은 로그인 시 자동으로 시작되고, 충돌 시 재시작되며, 포워딩된 포트를 계속 활성 상태로 유지합니다.

<Note>
이전 설정에서 남은 `com.openclaw.ssh-tunnel` LaunchAgent가 있으면 언로드하고 삭제하세요.
</Note>

#### 문제 해결

터널이 실행 중인지 확인합니다.

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

터널을 재시작합니다.

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

터널을 중지합니다.

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 구성 항목                             | 수행 작업                                                 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 포워딩합니다               |
| `ssh -N`                             | 원격 명령을 실행하지 않는 SSH입니다(포트 포워딩 전용) |
| `KeepAlive`                          | 터널이 충돌하면 자동으로 재시작합니다              |
| `RunAtLoad`                          | 로그인 시 LaunchAgent가 로드될 때 터널을 시작합니다        |

## 관련 항목

- [Tailscale](/ko/gateway/tailscale)
- [인증](/ko/gateway/authentication)
- [원격 게이트웨이 설정](/ko/gateway/remote-gateway-readme)
