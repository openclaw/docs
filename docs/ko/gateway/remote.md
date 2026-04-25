---
read_when:
    - 원격 gateway 설정 실행 또는 문제 해결
summary: SSH 터널(Gateway WS) 및 tailnet을 사용한 원격 액세스
title: 원격 액세스
x-i18n:
    generated_at: "2026-04-25T06:02:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

이 저장소는 전용 호스트(데스크톱/서버)에서 단일 Gateway(마스터)를 실행하고 클라이언트를 여기에 연결하는 “SSH를 통한 원격” 방식을 지원합니다.

- **운영자(사용자 / macOS 앱)**의 경우: SSH 터널링이 범용 fallback입니다.
- **Node(iOS/Android 및 향후 기기)**의 경우: 필요에 따라 LAN/tailnet 또는 SSH 터널을 사용해 Gateway **WebSocket**에 연결합니다.

## 핵심 개념

- Gateway WebSocket은 구성된 포트(기본값 18789)에서 **loopback**에 바인딩됩니다.
- 원격 사용 시 이 loopback 포트를 SSH로 포워딩합니다(또는 tailnet/VPN을 사용해 터널 의존도를 줄일 수 있습니다).

## 일반적인 VPN/tailnet 설정(에이전트가 있는 위치)

**Gateway 호스트**를 “에이전트가 사는 곳”이라고 생각하세요. 이 호스트가 세션, auth profile, 채널, state를 소유합니다.
사용자의 laptop/desktop(및 Node)은 이 호스트에 연결합니다.

### 1) tailnet 안의 항상 켜져 있는 Gateway(VPS 또는 홈 서버)

지속 실행되는 호스트에서 Gateway를 실행하고 **Tailscale** 또는 SSH로 접근합니다.

- **가장 좋은 UX:** `gateway.bind: "loopback"`을 유지하고 Control UI에는 **Tailscale Serve**를 사용
- **fallback:** loopback을 유지하고 액세스가 필요한 모든 머신에서 SSH 터널 사용
- **예시:** [exe.dev](/ko/install/exe-dev) (간단한 VM) 또는 [Hetzner](/ko/install/hetzner) (프로덕션 VPS)

이 방식은 laptop이 자주 절전 상태에 들어가더라도 에이전트를 항상 켜 두고 싶을 때 이상적입니다.

### 2) 홈 데스크톱이 Gateway를 실행하고, laptop은 원격 제어만 수행

laptop은 에이전트를 실행하지 않습니다. 대신 원격으로 연결합니다:

- macOS 앱의 **Remote over SSH** 모드를 사용하세요(설정 → 일반 → “OpenClaw runs”).
- 앱이 터널을 열고 관리하므로 WebChat + 상태 점검이 “그냥 동작”합니다.

운영 가이드: [macOS remote access](/ko/platforms/mac/remote).

### 3) laptop이 Gateway를 실행하고, 다른 머신에서 원격 액세스

Gateway는 로컬에 유지하되 안전하게 노출합니다:

- 다른 머신에서 laptop으로 SSH 터널 연결, 또는
- Tailscale Serve로 Control UI를 노출하고 Gateway는 loopback 전용으로 유지

가이드: [Tailscale](/ko/gateway/tailscale) 및 [Web overview](/ko/web).

## 명령 흐름(무엇이 어디서 실행되는가)

하나의 gateway 서비스가 state + 채널을 소유합니다. Node는 주변 장치입니다.

흐름 예시(Telegram → node):

- Telegram 메시지가 **Gateway**에 도착합니다.
- Gateway가 **에이전트**를 실행하고 node 도구를 호출할지 결정합니다.
- Gateway가 Gateway WebSocket(`node.*` RPC)을 통해 **node**를 호출합니다.
- node가 결과를 반환하면 Gateway가 Telegram으로 다시 응답합니다.

참고:

- **Node는 gateway 서비스를 실행하지 않습니다.** 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 하나의 gateway만 실행해야 합니다([Multiple gateways](/ko/gateway/multiple-gateways) 참조).
- macOS 앱의 “node mode”는 Gateway WebSocket 위에서 동작하는 node 클라이언트일 뿐입니다.

## SSH 터널(CLI + 도구)

원격 Gateway WS로 로컬 터널을 생성합니다:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

터널이 올라온 상태에서:

- `openclaw health` 및 `openclaw status --deep`는 이제 `ws://127.0.0.1:18789`를 통해 원격 gateway에 도달합니다.
- 필요 시 `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, `openclaw gateway call`도 `--url`로 포워딩된 URL을 지정할 수 있습니다.

참고: `18789`는 구성된 `gateway.port`(또는 `--port`/`OPENCLAW_GATEWAY_PORT`)로 바꾸세요.
참고: `--url`을 전달하면 CLI는 config 또는 환경 credential로 fallback하지 않습니다.
`--token` 또는 `--password`를 명시적으로 포함하세요. 명시적 credential이 없으면 오류입니다.

## CLI 원격 기본값

원격 대상을 저장해 두면 CLI 명령이 이를 기본으로 사용하게 할 수 있습니다:

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

gateway가 loopback 전용이라면 URL은 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 여세요.

## credential 우선순위

Gateway credential 해석은 call/probe/status 경로와 Discord exec-approval 모니터링 전반에서 하나의 공통 계약을 따릅니다. Node-host는 동일한 기본 계약을 사용하지만 한 가지 local-mode 예외가 있습니다(`gateway.remote.*`를 의도적으로 무시함):

- 명시적 credential(`--token`, `--password`, 또는 도구의 `gatewayToken`)은 명시적 auth를 받는 call 경로에서 항상 우선합니다.
- URL 재정의 안전성:
  - CLI URL 재정의(`--url`)는 암시적 config/env credential을 절대 재사용하지 않습니다.
  - env URL 재정의(`OPENCLAW_GATEWAY_URL`)는 env credential만 사용할 수 있습니다(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- local mode 기본값:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (로컬 auth token 입력이 설정되지 않은 경우에만 remote fallback 적용)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (로컬 auth password 입력이 설정되지 않은 경우에만 remote fallback 적용)
- remote mode 기본값:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host local-mode 예외: `gateway.remote.token` / `gateway.remote.password`는 무시됩니다.
- remote probe/status token 검사는 기본적으로 엄격합니다: remote mode를 대상으로 할 때 `gateway.remote.token`만 사용합니다(로컬 token fallback 없음).
- Gateway env 재정의는 `OPENCLAW_GATEWAY_*`만 사용합니다.

## SSH를 통한 Chat UI

WebChat은 더 이상 별도의 HTTP 포트를 사용하지 않습니다. SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결됩니다.

- `18789`를 SSH로 포워딩한 후(위 참조), 클라이언트를 `ws://127.0.0.1:18789`에 연결하세요.
- macOS에서는 터널을 자동 관리하는 앱의 “Remote over SSH” 모드를 사용하는 것이 좋습니다.

## macOS 앱 "Remote over SSH"

macOS 메뉴 바 앱은 동일한 구성을 엔드투엔드로 구동할 수 있습니다(원격 상태 점검, WebChat, Voice Wake 포워딩 포함).

운영 가이드: [macOS remote access](/ko/platforms/mac/remote).

## 보안 규칙(원격/VPN)

짧게 말하면: 정말 바인드가 필요하다고 확신하지 않는 한 **Gateway를 loopback 전용으로 유지**하세요.

- **Loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다(공개 노출 없음).
- 기본적으로 평문 `ws://`는 loopback 전용입니다. 신뢰할 수 있는 사설 네트워크에서는
  비상 조치로 클라이언트 프로세스에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을
  설정하세요. `openclaw.json`에 해당하는 항목은 없으며, 이것은 WebSocket 연결을 만드는 클라이언트의
  프로세스 환경에 설정되어야 합니다.
- **non-loopback bind**(`lan`/`tailnet`/`custom`, 또는 loopback을 사용할 수 없을 때의 `auto`)는 gateway auth를 사용해야 합니다: token, password 또는 `gateway.auth.mode: "trusted-proxy"`를 사용하는 identity-aware reverse proxy.
- `gateway.remote.token` / `.password`는 클라이언트 credential 소스입니다. 이것만으로 서버 auth를 구성하지는 않습니다.
- local call 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, 해석은 닫힌 상태로 실패합니다(remote fallback이 이를 가리지 않음).
- `gateway.remote.tlsFingerprint`는 `wss://` 사용 시 원격 TLS 인증서를 고정합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 identity
  헤더를 통해 Control UI/WebSocket 트래픽을 인증할 수 있습니다. HTTP API 엔드포인트는 이 Tailscale 헤더 인증을 사용하지 않으며, 대신 gateway의 일반적인 HTTP 인증 모드를 따릅니다. 이 tokenless 흐름은 gateway 호스트가 신뢰된다는 가정을 전제로 합니다. 모든 곳에서 shared-secret auth를 원한다면 이를 `false`로 설정하세요.
- **Trusted-proxy** 인증은 non-loopback identity-aware proxy 설정 전용입니다.
  동일 호스트 loopback reverse proxy는 `gateway.auth.mode: "trusted-proxy"`를 충족하지 않습니다.
- browser control은 운영자 액세스처럼 취급하세요: tailnet 전용 + 신중한 node 페어링.

자세한 내용: [보안](/ko/gateway/security).

### macOS: LaunchAgent를 사용한 영구 SSH 터널

원격 gateway에 연결하는 macOS 클라이언트에서 가장 쉬운 영구 설정은 SSH `LocalForward` config 항목과 LaunchAgent를 사용해 재부팅 및 충돌 후에도 터널을 유지하는 방식입니다.

#### 1단계: SSH config 추가

`~/.ssh/config`를 편집하세요:

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

재시작 후에도 유지되도록 config에 token을 저장하세요:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4단계: LaunchAgent 생성

다음을 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`로 저장하세요:

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

터널은 로그인 시 자동 시작되고, 충돌 시 재시작되며, 포워딩된 포트를 계속 유지합니다.

참고: 이전 설정에서 남은 `com.openclaw.ssh-tunnel` LaunchAgent가 있다면 언로드하고 삭제하세요.

#### 문제 해결

터널이 실행 중인지 확인:

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

| Config 항목                           | 동작 설명                                                     |
| ------------------------------------- | ------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 포워딩합니다              |
| `ssh -N`                              | 원격 명령 실행 없이 SSH만 수행(포트 포워딩 전용)              |
| `KeepAlive`                           | 터널이 충돌하면 자동으로 재시작합니다                         |
| `RunAtLoad`                           | 로그인 시 LaunchAgent가 로드되면 터널을 시작합니다            |

## 관련 항목

- [Tailscale](/ko/gateway/tailscale)
- [Authentication](/ko/gateway/authentication)
- [Remote gateway setup](/ko/gateway/remote-gateway-readme)
