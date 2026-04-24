---
read_when:
    - 원격 Gateway 설정 실행 또는 문제 해결
summary: SSH 터널(Gateway WS) 및 tailnet을 사용한 원격 액세스
title: 원격 액세스
x-i18n:
    generated_at: "2026-04-24T08:57:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 66eebbe3762134f29f982201d7e79a789624b96042bd931e07d9855710d64bfe
    source_path: gateway/remote.md
    workflow: 15
---

# 원격 액세스(SSH, 터널, tailnet)

이 리포지토리는 전용 호스트(데스크톱/서버)에서 단일 Gateway(마스터)를 계속 실행하고 클라이언트를 여기에 연결하는 방식으로 “SSH를 통한 원격”을 지원합니다.

- **운영자용(사용자 / macOS 앱)**: SSH 터널링이 범용적인 대체 수단입니다.
- **Node용(iOS/Android 및 향후 디바이스)**: Gateway **WebSocket**에 연결합니다(LAN/tailnet 또는 필요 시 SSH 터널 사용).

## 핵심 개념

- Gateway WebSocket은 구성된 포트(기본값: 18789)에서 **loopback**에 바인딩됩니다.
- 원격으로 사용할 때는 이 loopback 포트를 SSH로 포워딩합니다(또는 tailnet/VPN을 사용해 터널 사용을 줄일 수 있습니다).

## 일반적인 VPN/tailnet 설정(agent가 실행되는 위치)

**Gateway 호스트**를 “agent가 실행되는 위치”로 생각하면 됩니다. 이 호스트가 세션, 인증 프로필, 채널, 상태를 소유합니다.
노트북/데스크톱(그리고 Node)은 이 호스트에 연결합니다.

### 1) tailnet에 항상 켜져 있는 Gateway(VPS 또는 홈 서버)

지속적으로 실행되는 호스트에서 Gateway를 실행하고 **Tailscale** 또는 SSH를 통해 접근합니다.

- **가장 좋은 UX:** `gateway.bind: "loopback"`을 유지하고 Control UI에는 **Tailscale Serve**를 사용합니다.
- **대체 수단:** loopback을 유지하고 액세스가 필요한 머신에서 SSH 터널을 사용합니다.
- **예시:** [exe.dev](/ko/install/exe-dev)(간단한 VM) 또는 [Hetzner](/ko/install/hetzner)(운영용 VPS).

노트북이 자주 절전 모드로 들어가지만 agent는 항상 켜 두고 싶을 때 이상적입니다.

### 2) 홈 데스크톱에서 Gateway를 실행하고, 노트북은 원격 제어만 수행

노트북은 agent를 실행하지 않습니다. 원격으로 연결만 합니다:

- macOS 앱의 **Remote over SSH** 모드를 사용합니다(Settings → General → “OpenClaw runs”).
- 앱이 터널을 열고 관리하므로 WebChat + 상태 점검이 “그냥 작동”합니다.

운영 가이드: [macOS 원격 액세스](/ko/platforms/mac/remote)

### 3) 노트북에서 Gateway를 실행하고, 다른 머신에서 원격 액세스

Gateway는 로컬에 두되 안전하게 노출합니다:

- 다른 머신에서 노트북으로 SSH 터널을 사용하거나,
- Tailscale Serve로 Control UI를 제공하고 Gateway는 loopback 전용으로 유지합니다.

가이드: [Tailscale](/ko/gateway/tailscale) 및 [Web 개요](/ko/web)

## 명령 흐름(무엇이 어디서 실행되는지)

하나의 gateway 서비스가 상태 + 채널을 소유합니다. Node는 주변 장치입니다.

흐름 예시(Telegram → Node):

- Telegram 메시지가 **Gateway**에 도착합니다.
- Gateway가 **agent**를 실행하고 Node 도구를 호출할지 결정합니다.
- Gateway가 Gateway WebSocket(`node.*` RPC)을 통해 **Node**를 호출합니다.
- Node가 결과를 반환하면 Gateway가 Telegram으로 다시 응답합니다.

참고:

- **Node는 gateway 서비스를 실행하지 않습니다.** 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 하나의 gateway만 실행해야 합니다([Multiple gateways](/ko/gateway/multiple-gateways) 참고).
- macOS 앱의 “node mode”는 Gateway WebSocket을 통한 Node 클라이언트일 뿐입니다.

## SSH 터널(CLI + 도구)

원격 Gateway WS로 로컬 터널을 생성합니다:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

터널이 활성화된 상태에서는:

- `openclaw health` 및 `openclaw status --deep`가 이제 `ws://127.0.0.1:18789`를 통해 원격 gateway에 도달합니다.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, `openclaw gateway call`도 필요 시 `--url`로 포워딩된 URL을 대상으로 지정할 수 있습니다.

참고: `18789`는 구성된 `gateway.port`(또는 `--port`/`OPENCLAW_GATEWAY_PORT`)로 바꾸세요.
참고: `--url`을 전달하면 CLI는 구성이나 환경의 자격 증명으로 대체하지 않습니다.
`--token` 또는 `--password`를 명시적으로 포함하세요. 명시적 자격 증명이 없으면 오류입니다.

## CLI 원격 기본값

원격 대상을 저장해 두면 CLI 명령이 기본적으로 이를 사용하도록 할 수 있습니다:

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

gateway가 loopback 전용일 때는 URL을 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 엽니다.

## 자격 증명 우선순위

Gateway 자격 증명 확인은 call/probe/status 경로와 Discord 실행 승인 모니터링 전반에서 하나의 공통 계약을 따릅니다. Node-host는 동일한 기본 계약을 사용하지만 local mode 예외가 하나 있습니다(`gateway.remote.*`를 의도적으로 무시함):

- 명시적 자격 증명(`--token`, `--password`, 또는 도구의 `gatewayToken`)은 명시적 인증을 허용하는 call 경로에서 항상 우선합니다.
- URL 재정의 안전성:
  - CLI URL 재정의(`--url`)는 암시적 config/env 자격 증명을 절대 재사용하지 않습니다.
  - env URL 재정의(`OPENCLAW_GATEWAY_URL`)는 env 자격 증명(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)만 사용할 수 있습니다.
- local mode 기본값:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (원격 대체는 로컬 인증 토큰 입력이 설정되지 않은 경우에만 적용)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (원격 대체는 로컬 인증 비밀번호 입력이 설정되지 않은 경우에만 적용)
- remote mode 기본값:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local mode 예외: `gateway.remote.token` / `gateway.remote.password`는 무시됩니다.
- 원격 probe/status token 확인은 기본적으로 엄격합니다. remote mode를 대상으로 할 때는 `gateway.remote.token`만 사용합니다(로컬 토큰 대체 없음).
- Gateway env 재정의는 `OPENCLAW_GATEWAY_*`만 사용합니다.

## SSH를 통한 Chat UI

WebChat은 더 이상 별도의 HTTP 포트를 사용하지 않습니다. SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결됩니다.

- `18789`를 SSH로 포워딩한 다음(위 참조), 클라이언트를 `ws://127.0.0.1:18789`에 연결합니다.
- macOS에서는 터널을 자동으로 관리하는 앱의 “Remote over SSH” 모드를 사용하는 것이 좋습니다.

## macOS 앱 "Remote over SSH"

macOS 메뉴 막대 앱은 동일한 구성을 처음부터 끝까지 처리할 수 있습니다(원격 상태 점검, WebChat, Voice Wake 포워딩).

운영 가이드: [macOS 원격 액세스](/ko/platforms/mac/remote)

## 보안 규칙(원격/VPN)

짧게 말하면: 정말 bind가 필요하다고 확신하지 않는 한 **Gateway는 loopback 전용으로 유지**하세요.

- **Loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다(공개 노출 없음).
- 기본적으로 평문 `ws://`는 loopback 전용입니다. 신뢰할 수 있는 사설 네트워크의 경우,
  비상 수단으로 클라이언트 프로세스에서
  `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요.
  `openclaw.json`에 해당하는 설정은 없으며, WebSocket 연결을 수행하는
  클라이언트 프로세스 환경에 반드시 설정해야 합니다.
- **비-loopback bind**(`lan`/`tailnet`/`custom`, 또는 loopback을 사용할 수 없을 때의 `auto`)는 반드시 gateway 인증을 사용해야 합니다: token, password 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 identity-aware reverse proxy.
- `gateway.remote.token` / `.password`는 클라이언트 자격 증명 소스입니다. 이것만으로 서버 인증이 구성되지는 않습니다.
- 로컬 call 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체값으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해결되지 않으면, 확인은 닫힌 상태로 실패합니다(원격 대체로 가려지지 않음).
- `gateway.remote.tlsFingerprint`는 `wss://` 사용 시 원격 TLS 인증서를 pinning합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때
  identity 헤더를 통해 Control UI/WebSocket 트래픽을 인증할 수 있습니다.
  HTTP API 엔드포인트는 이 Tailscale 헤더 인증을 사용하지 않으며,
  대신 gateway의 일반 HTTP 인증 모드를 따릅니다. 이 token 없는 흐름은
  gateway 호스트가 신뢰된다는 가정을 전제로 합니다. 어디서나 공유 secret
  인증을 원하면 이를 `false`로 설정하세요.
- **Trusted-proxy** 인증은 비-loopback identity-aware proxy 구성에만 해당합니다.
  동일 호스트의 loopback reverse proxy는 `gateway.auth.mode: "trusted-proxy"` 조건을 충족하지 않습니다.
- 브라우저 제어는 운영자 액세스처럼 취급하세요: tailnet 전용 + 의도적인 Node 페어링.

자세한 내용: [Security](/ko/gateway/security)

### macOS: LaunchAgent를 사용한 영구 SSH 터널

원격 gateway에 연결하는 macOS 클라이언트의 경우, 가장 쉬운 영구 구성은 SSH `LocalForward` config 항목과 LaunchAgent를 함께 사용해 재부팅과 충돌 이후에도 터널을 유지하는 방식입니다.

#### 1단계: SSH config 추가

`~/.ssh/config`를 편집합니다:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>`와 `<REMOTE_USER>`를 실제 값으로 바꾸세요.

#### 2단계: SSH 키 복사(1회)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3단계: gateway token 구성

재시작 후에도 유지되도록 token을 config에 저장합니다:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4단계: LaunchAgent 생성

다음 내용을 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`로 저장합니다:

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

터널은 로그인 시 자동으로 시작되고, 충돌 시 재시작되며, 포워딩된 포트를 계속 유지합니다.

참고: 이전 설정의 `com.openclaw.ssh-tunnel` LaunchAgent가 남아 있다면 언로드한 뒤 삭제하세요.

#### 문제 해결

터널 실행 여부 확인:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

터널 재시작:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

터널 중지:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 구성 항목 | 역할 |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 포워딩 |
| `ssh -N` | 원격 명령 실행 없이 SSH만 수행(포트 포워딩 전용) |
| `KeepAlive` | 터널이 충돌하면 자동으로 재시작 |
| `RunAtLoad` | 로그인 시 LaunchAgent가 로드되면 터널 시작 |

## 관련 문서

- [Tailscale](/ko/gateway/tailscale)
- [Authentication](/ko/gateway/authentication)
- [Remote gateway setup](/ko/gateway/remote-gateway-readme)
