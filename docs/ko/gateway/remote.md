---
read_when:
    - 원격 Gateway 설정 실행 또는 문제 해결
summary: SSH 터널(Gateway WS)과 테일넷을 사용한 원격 액세스
title: 원격 액세스
x-i18n:
    generated_at: "2026-05-06T06:27:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

이 리포지토리는 전용 호스트(데스크톱/서버)에서 단일 Gateway(마스터)를 계속 실행하고 클라이언트를 여기에 연결하는 방식으로 "SSH를 통한 원격"을 지원합니다.

- **운영자(사용자 / macOS 앱)**: SSH 터널링이 범용 폴백입니다.
- **Node(iOS/Android 및 향후 기기)**: 필요에 따라 Gateway **WebSocket**(LAN/tailnet 또는 SSH 터널)에 연결합니다.

## 핵심 아이디어

- Gateway WebSocket은 구성된 포트(기본값 18789)의 **loopback**에 바인딩됩니다.
- 원격 사용 시 해당 loopback 포트를 SSH로 포워딩합니다(또는 tailnet/VPN을 사용해 터널링을 줄입니다).

## 일반적인 VPN 및 tailnet 설정

**Gateway 호스트**는 에이전트가 존재하는 곳이라고 생각하면 됩니다. 이 호스트가 세션, 인증 프로필, 채널, 상태를 소유합니다. 노트북, 데스크톱, Node는 이 호스트에 연결합니다.

### tailnet에서 항상 켜져 있는 Gateway

영구 호스트(VPS 또는 홈 서버)에서 Gateway를 실행하고 **Tailscale** 또는 SSH로 접근합니다.

- **최적의 UX:** `gateway.bind: "loopback"`을 유지하고 Control UI에는 **Tailscale Serve**를 사용합니다.
- **폴백:** loopback을 유지하고 접근이 필요한 모든 머신에서 SSH 터널을 사용합니다.
- **예시:** [exe.dev](/ko/install/exe-dev)(간편한 VM) 또는 [Hetzner](/ko/install/hetzner)(프로덕션 VPS).

노트북이 자주 절전 상태가 되지만 에이전트를 항상 켜 두고 싶을 때 적합합니다.

### 홈 데스크톱에서 Gateway 실행

노트북은 에이전트를 실행하지 않습니다. 원격으로 연결합니다.

- macOS 앱의 **SSH를 통한 원격** 모드를 사용합니다(설정 → 일반 → OpenClaw 실행).
- 앱이 터널을 열고 관리하므로 WebChat과 상태 확인이 그대로 작동합니다.

런북: [macOS 원격 액세스](/ko/platforms/mac/remote).

### 노트북에서 Gateway 실행

Gateway는 로컬에 유지하되 안전하게 노출합니다.

- 다른 머신에서 노트북으로 SSH 터널을 연결하거나,
- Control UI를 Tailscale Serve로 제공하고 Gateway는 loopback 전용으로 유지합니다.

가이드: [Tailscale](/ko/gateway/tailscale) 및 [웹 개요](/ko/web).

## 명령 흐름(무엇이 어디에서 실행되는지)

하나의 Gateway 서비스가 상태와 채널을 소유합니다. Node는 주변 장치입니다.

흐름 예시(Telegram → Node):

- Telegram 메시지가 **Gateway**에 도착합니다.
- Gateway가 **에이전트**를 실행하고 Node 도구를 호출할지 결정합니다.
- Gateway가 Gateway WebSocket(`node.*` RPC)을 통해 **Node**를 호출합니다.
- Node가 결과를 반환하고, Gateway가 Telegram으로 응답을 다시 보냅니다.

참고:

- **Node는 Gateway 서비스를 실행하지 않습니다.** 격리된 프로필을 의도적으로 실행하는 경우가 아니라면 호스트당 하나의 Gateway만 실행해야 합니다([여러 Gateway](/ko/gateway/multiple-gateways) 참조).
- macOS 앱의 "Node 모드"는 Gateway WebSocket을 통한 Node 클라이언트일 뿐입니다.

## SSH 터널(CLI + 도구)

원격 Gateway WS로 로컬 터널을 만듭니다.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

터널이 올라오면:

- `openclaw health`와 `openclaw status --deep`는 이제 `ws://127.0.0.1:18789`를 통해 원격 Gateway에 도달합니다.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, `openclaw gateway call`도 필요할 때 `--url`로 포워딩된 URL을 대상으로 지정할 수 있습니다.

<Note>
`18789`를 구성된 `gateway.port`(또는 `--port` 또는 `OPENCLAW_GATEWAY_PORT`)로 바꾸세요.
</Note>

<Warning>
`--url`을 전달하면 CLI는 구성 또는 환경 자격 증명으로 폴백하지 않습니다. `--token` 또는 `--password`를 명시적으로 포함하세요. 명시적 자격 증명이 없으면 오류입니다.
</Warning>

## CLI 원격 기본값

CLI 명령이 기본적으로 사용하도록 원격 대상을 저장할 수 있습니다.

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

Gateway가 loopback 전용이면 URL을 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 여세요.
macOS 앱의 SSH 터널 전송에서는 발견된 Gateway 호스트 이름이
`gateway.remote.sshTarget`에 들어가며, `gateway.remote.url`은 로컬 터널 URL로 유지됩니다.

## 자격 증명 우선순위

Gateway 자격 증명 해석은 call/probe/status 경로와 Discord exec-approval 모니터링 전반에서 하나의 공유 계약을 따릅니다. Node-host도 동일한 기본 계약을 사용하되 로컬 모드 예외가 하나 있습니다(의도적으로 `gateway.remote.*`를 무시합니다).

- 명시적 자격 증명(`--token`, `--password`, 또는 도구 `gatewayToken`)은 명시적 인증을 받는 호출 경로에서 항상 우선합니다.
- URL 오버라이드 안전성:
  - CLI URL 오버라이드(`--url`)는 암시적 config/env 자격 증명을 절대 재사용하지 않습니다.
  - Env URL 오버라이드(`OPENCLAW_GATEWAY_URL`)는 env 자격 증명(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)만 사용할 수 있습니다.
- 로컬 모드 기본값:
  - 토큰: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`(로컬 인증 토큰 입력이 설정되지 않은 경우에만 원격 폴백 적용)
  - 비밀번호: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`(로컬 인증 비밀번호 입력이 설정되지 않은 경우에만 원격 폴백 적용)
- 원격 모드 기본값:
  - 토큰: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - 비밀번호: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 로컬 모드 예외: `gateway.remote.token` / `gateway.remote.password`는 무시됩니다.
- 원격 probe/status 토큰 검사는 기본적으로 엄격합니다. 원격 모드를 대상으로 할 때 `gateway.remote.token`만 사용합니다(로컬 토큰 폴백 없음).
- Gateway env 오버라이드는 `OPENCLAW_GATEWAY_*`만 사용합니다.

## SSH를 통한 채팅 UI

WebChat은 더 이상 별도의 HTTP 포트를 사용하지 않습니다. SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결합니다.

- SSH를 통해 `18789`를 포워딩한 다음(위 참조), 클라이언트를 `ws://127.0.0.1:18789`에 연결합니다.
- macOS에서는 터널을 자동으로 관리하는 앱의 "SSH를 통한 원격" 모드를 권장합니다.

## macOS 앱 SSH를 통한 원격

macOS 메뉴 막대 앱은 동일한 설정을 엔드투엔드로 구동할 수 있습니다(원격 상태 확인, WebChat, Voice Wake 포워딩).

런북: [macOS 원격 액세스](/ko/platforms/mac/remote).

## 보안 규칙(원격/VPN)

짧게 말하면: 바인딩이 반드시 필요하다고 확신하지 않는 한 **Gateway는 loopback 전용으로 유지**하세요.

- **Loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다(공개 노출 없음).
- 평문 `ws://`는 기본적으로 loopback 전용입니다. 신뢰할 수 있는 사설 네트워크에서는
  비상 조치로 클라이언트 프로세스에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요.
  이에 해당하는 `openclaw.json` 설정은 없습니다. WebSocket 연결을 만드는 클라이언트의 프로세스
  환경이어야 합니다.
- **비-loopback 바인딩**(`lan`/`tailnet`/`custom`, 또는 loopback을 사용할 수 없을 때의 `auto`)은 Gateway 인증을 사용해야 합니다. 토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 있는 identity-aware 리버스 프록시를 사용하세요.
- `gateway.remote.token` / `.password`는 클라이언트 자격 증명 소스입니다. 이것만으로 서버 인증을 구성하지는 않습니다.
- 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 폴백으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, 해석은 안전하게 실패합니다(원격 폴백으로 가려지지 않음).
- `gateway.remote.tlsFingerprint`는 `wss://` 사용 시 원격 TLS 인증서를 고정합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 identity
  헤더를 통해 Control UI/WebSocket 트래픽을 인증할 수 있습니다. HTTP API 엔드포인트는
  해당 Tailscale 헤더 인증을 사용하지 않고 Gateway의 일반 HTTP
  인증 모드를 따릅니다. 이 토큰 없는 흐름은 Gateway 호스트를 신뢰한다고 가정합니다.
  모든 곳에서 공유 비밀 인증을 원하면 `false`로 설정하세요.
- **Trusted-proxy** 인증은 기본적으로 비-loopback identity-aware 프록시 설정을 기대합니다.
  동일 호스트 loopback 리버스 프록시에는 명시적인 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
- 브라우저 제어는 운영자 액세스처럼 취급하세요. tailnet 전용 + 의도적인 Node 페어링을 사용합니다.

심층 설명: [보안](/ko/gateway/security).

### macOS: LaunchAgent를 통한 영구 SSH 터널

원격 Gateway에 연결하는 macOS 클라이언트의 경우, 가장 쉬운 영구 설정은 SSH `LocalForward` config 항목과 LaunchAgent를 사용해 재부팅 및 충돌 후에도 터널을 유지하는 것입니다.

#### 1단계: SSH config 추가

`~/.ssh/config`를 편집합니다.

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>`와 `<REMOTE_USER>`를 사용자 값으로 바꾸세요.

#### 2단계: SSH 키 복사(1회)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3단계: Gateway 토큰 구성

재시작 후에도 유지되도록 토큰을 config에 저장합니다.

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4단계: LaunchAgent 만들기

이를 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`로 저장합니다.

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
이전 설정에서 남은 `com.openclaw.ssh-tunnel` LaunchAgent가 있다면 언로드하고 삭제하세요.
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

| Config 항목                          | 수행하는 작업                                                |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 포워딩                  |
| `ssh -N`                             | 원격 명령을 실행하지 않는 SSH(포트 포워딩 전용)              |
| `KeepAlive`                          | 터널이 충돌하면 자동으로 재시작                              |
| `RunAtLoad`                          | 로그인 시 LaunchAgent가 로드될 때 터널 시작                  |

## 관련 항목

- [Tailscale](/ko/gateway/tailscale)
- [인증](/ko/gateway/authentication)
- [원격 Gateway 설정](/ko/gateway/remote-gateway-readme)
