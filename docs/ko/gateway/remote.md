---
read_when:
    - 원격 Gateway 설정 실행 또는 문제 해결하기
summary: SSH 터널(Gateway WS) 및 tailnet을 사용한 원격 액세스
title: 원격 액세스
x-i18n:
    generated_at: "2026-04-26T11:30:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

이 repo는 전용 호스트(데스크톱/서버)에서 단일 Gateway(마스터)를 계속 실행하고 클라이언트를 여기에 연결하는 방식으로 “SSH를 통한 원격”을 지원합니다.

- **운영자(사용자 / macOS 앱)**용: SSH 터널링이 범용 폴백입니다.
- **node(iOS/Android 및 향후 디바이스)**용: 필요에 따라 LAN/tailnet 또는 SSH 터널을 통해 Gateway **WebSocket**에 연결합니다.

## 핵심 개념

- Gateway WebSocket은 구성된 포트(기본값 18789)의 **loopback**에 바인드됩니다.
- 원격 사용 시 이 loopback 포트를 SSH로 포워딩합니다(또는 tailnet/VPN을 사용해 터널 의존성을 줄입니다).

## 일반적인 VPN/tailnet 설정(에이전트가 있는 위치)

**Gateway 호스트**를 “에이전트가 있는 곳”이라고 생각하세요. 이 호스트가 세션, auth profile, 채널, 상태를 소유합니다.
노트북/데스크톱(및 node)은 이 호스트에 연결합니다.

### 1) tailnet에서 항상 켜져 있는 Gateway(VPS 또는 홈 서버)

지속적으로 실행되는 호스트에서 Gateway를 실행하고 **Tailscale** 또는 SSH로 접근합니다.

- **최상의 UX:** `gateway.bind: "loopback"`를 유지하고 Control UI에는 **Tailscale Serve**를 사용합니다.
- **폴백:** loopback을 유지하고 액세스가 필요한 모든 머신에서 SSH 터널을 엽니다.
- **예시:** [exe.dev](/ko/install/exe-dev)(쉬운 VM) 또는 [Hetzner](/ko/install/hetzner)(프로덕션 VPS).

이는 노트북이 자주 절전 상태에 들어가지만 에이전트는 항상 켜져 있기를 원할 때 이상적입니다.

### 2) 집 데스크톱에서 Gateway 실행, 노트북은 원격 제어

노트북은 에이전트를 실행하지 **않습니다**. 대신 원격으로 연결합니다:

- macOS 앱의 **Remote over SSH** 모드를 사용합니다(Settings → General → “OpenClaw runs”).
- 앱이 터널을 열고 관리하므로 WebChat + health checks가 “그냥 작동”합니다.

실행 가이드: [macOS 원격 액세스](/ko/platforms/mac/remote).

### 3) 노트북에서 Gateway 실행, 다른 머신에서 원격 액세스

Gateway는 로컬에 두되 안전하게 노출합니다:

- 다른 머신에서 노트북으로 SSH 터널을 연결하거나
- Tailscale Serve로 Control UI를 제공하고 Gateway는 loopback 전용으로 유지합니다.

가이드: [Tailscale](/ko/gateway/tailscale) 및 [웹 개요](/ko/web).

## 명령 흐름(무엇이 어디서 실행되는가)

하나의 gateway 서비스가 상태 + 채널을 소유합니다. node는 주변 장치입니다.

흐름 예시(Telegram → node):

- Telegram 메시지가 **Gateway**에 도착합니다.
- Gateway가 **에이전트**를 실행하고 node 도구를 호출할지 결정합니다.
- Gateway가 Gateway WebSocket(`node.*` RPC)을 통해 **node**를 호출합니다.
- node가 결과를 반환하면 Gateway가 Telegram으로 다시 응답합니다.

참고:

- **node는 gateway 서비스를 실행하지 않습니다.** 의도적으로 격리된 profile을 실행하는 경우가 아니라면 호스트당 하나의 gateway만 실행해야 합니다([다중 Gateway](/ko/gateway/multiple-gateways) 참조).
- macOS 앱의 “node mode”는 Gateway WebSocket을 통한 node 클라이언트일 뿐입니다.

## SSH 터널(CLI + 도구)

원격 Gateway WS로 로컬 터널 생성:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

터널이 올라오면:

- `openclaw health`와 `openclaw status --deep`는 이제 `ws://127.0.0.1:18789`를 통해 원격 gateway에 도달합니다.
- 필요 시 `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, `openclaw gateway call`도 `--url`로 포워딩된 URL을 대상으로 지정할 수 있습니다.

참고: `18789`는 구성된 `gateway.port`(또는 `--port`/`OPENCLAW_GATEWAY_PORT`)로 바꾸세요.
참고: `--url`을 전달하면 CLI는 config나 환경 자격 증명으로 폴백하지 않습니다.
`--token` 또는 `--password`를 명시적으로 포함하세요. 명시적 자격 증명이 없으면 오류입니다.

## CLI 원격 기본값

CLI 명령이 기본적으로 사용할 원격 대상을 저장할 수 있습니다:

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

gateway가 loopback 전용일 때는 URL을 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 여세요.
macOS 앱의 SSH 터널 전송에서는 검색된 gateway 호스트 이름을
`gateway.remote.sshTarget`에 두고, `gateway.remote.url`은 로컬 터널 URL로 유지합니다.

## 자격 증명 우선순위

Gateway 자격 증명 확인은 call/probe/status 경로와 Discord exec-approval 모니터링 전반에서 하나의 공통 계약을 따릅니다. Node-host는 동일한 기본 계약을 사용하지만 로컬 모드에 예외가 하나 있습니다(`gateway.remote.*`를 의도적으로 무시함):

- 명시적 자격 증명(`--token`, `--password`, 또는 도구 `gatewayToken`)은 명시적 인증을 허용하는 호출 경로에서 항상 우선합니다.
- URL 재정의 안전 규칙:
  - CLI URL 재정의(`--url`)는 암시적인 config/env 자격 증명을 절대 재사용하지 않습니다.
  - env URL 재정의(`OPENCLAW_GATEWAY_URL`)는 env 자격 증명만 사용할 수 있습니다(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- 로컬 모드 기본값:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (원격 폴백은 로컬 auth token 입력이 설정되지 않았을 때만 적용)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (원격 폴백은 로컬 auth password 입력이 설정되지 않았을 때만 적용)
- 원격 모드 기본값:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node-host 로컬 모드 예외: `gateway.remote.token` / `gateway.remote.password`는 무시됩니다.
- 원격 probe/status token 검사는 기본적으로 엄격합니다. 원격 모드를 대상으로 할 때는 `gateway.remote.token`만 사용하며(로컬 token 폴백 없음).
- Gateway env 재정의는 `OPENCLAW_GATEWAY_*`만 사용합니다.

## SSH를 통한 채팅 UI

WebChat은 더 이상 별도의 HTTP 포트를 사용하지 않습니다. SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결합니다.

- SSH로 `18789`를 포워딩한 다음(위 참조), 클라이언트를 `ws://127.0.0.1:18789`에 연결하세요.
- macOS에서는 터널을 자동으로 관리하는 앱의 “Remote over SSH” 모드를 사용하는 것이 좋습니다.

## macOS 앱 "Remote over SSH"

macOS 메뉴 막대 앱은 동일한 설정을 처음부터 끝까지 처리할 수 있습니다(원격 상태 점검, WebChat, Voice Wake 포워딩).

실행 가이드: [macOS 원격 액세스](/ko/platforms/mac/remote).

## 보안 규칙(원격/VPN)

짧게 말하면: **정말 바인드가 필요한 경우가 아니면 Gateway는 loopback 전용으로 유지하세요.**

- **Loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다(공개 노출 없음).
- 기본적으로 평문 `ws://`는 loopback 전용입니다. 신뢰할 수 있는 사설 네트워크에서는 클라이언트 프로세스에
  `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정해 비상용으로 사용할 수 있습니다. `openclaw.json`에 해당하는 설정은 없으며, WebSocket 연결을 만드는 클라이언트의 프로세스 환경이어야 합니다.
- **Non-loopback 바인드**(`lan`/`tailnet`/`custom`, 또는 loopback을 사용할 수 없을 때의 `auto`)는 gateway 인증을 사용해야 합니다: token, password, 또는 `gateway.auth.mode: "trusted-proxy"`가 있는 identity-aware reverse proxy.
- `gateway.remote.token` / `.password`는 클라이언트 자격 증명 소스입니다. 이들만으로 서버 인증을 구성하지는 **않습니다**.
- 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않았을 때만 `gateway.remote.*`를 폴백으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면, 확인은 fail closed로 실패합니다(원격 폴백으로 가려지지 않음).
- `wss://`를 사용할 때 `gateway.remote.tlsFingerprint`는 원격 TLS 인증서를 pinning합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 identity
  헤더를 통해 Control UI/WebSocket 트래픽을 인증할 수 있습니다. HTTP API 엔드포인트는 이 Tailscale 헤더 인증을 사용하지 않고 대신 gateway의 일반 HTTP
  인증 모드를 따릅니다. 이 tokenless 흐름은 gateway 호스트가 신뢰된다고 가정합니다. 어디서나 공유 시크릿 인증을 원한다면 이를 `false`로 설정하세요.
- **Trusted-proxy** 인증은 non-loopback identity-aware proxy 설정 전용입니다.
  동일 호스트의 loopback reverse proxy는 `gateway.auth.mode: "trusted-proxy"` 조건을 충족하지 않습니다.
- 브라우저 제어는 운영자 액세스처럼 취급하세요: tailnet 전용 + 신중한 node pairing.

자세한 내용: [보안](/ko/gateway/security).

### macOS: LaunchAgent를 통한 영구 SSH 터널

원격 gateway에 연결하는 macOS 클라이언트의 경우, 가장 쉬운 영구 설정은 SSH `LocalForward` config 항목과 재부팅/충돌 후에도 터널을 유지하는 LaunchAgent를 함께 사용하는 것입니다.

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

#### 3단계: Gateway token 구성

재시작 후에도 유지되도록 config에 token을 저장하세요:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### 4단계: LaunchAgent 생성

이를 `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`로 저장하세요:

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

| Config 항목 | 동작 |
| --- | --- |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 포워딩 |
| `ssh -N` | 원격 명령 실행 없이 SSH 연결(포트 포워딩 전용) |
| `KeepAlive` | 터널이 충돌하면 자동으로 재시작 |
| `RunAtLoad` | 로그인 시 LaunchAgent가 로드되면 터널 시작 |

## 관련

- [Tailscale](/ko/gateway/tailscale)
- [Authentication](/ko/gateway/authentication)
- [원격 Gateway 설정](/ko/gateway/remote-gateway-readme)
