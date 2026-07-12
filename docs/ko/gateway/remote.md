---
read_when:
    - 원격 Gateway 설정 실행 또는 문제 해결
summary: Gateway WS, SSH 터널 및 테일넷을 사용한 원격 액세스
title: 원격 액세스
x-i18n:
    generated_at: "2026-07-12T00:47:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw은 호스트에서 하나의 Gateway(마스터)를 실행하고 모든 클라이언트를 여기에 연결합니다. Gateway는 세션, 인증 프로필, 채널, 상태를 관리하며, 그 밖의 모든 것은 클라이언트입니다.

- **운영자**(사용자 또는 macOS 앱): Gateway에 접근할 수 있다면 직접 LAN/Tailnet WebSocket 연결이 가장 간단하며, SSH 터널링은 어디서나 사용할 수 있는 대체 수단입니다.
- **Node**(iOS/Android 및 기타 기기): Gateway **WebSocket**(LAN/Tailnet 또는 SSH 터널)에 연결합니다.

## 핵심 개념

Gateway WebSocket은 기본적으로 포트 `18789`(`gateway.port`)의 **local loopback**에 바인딩됩니다. 원격으로 사용하려면 Tailscale Serve 또는 신뢰할 수 있는 LAN/Tailnet 바인딩을 통해 노출하거나, SSH를 통해 local loopback 포트를 전달합니다.

## 토폴로지 옵션

| 구성                              | Gateway 실행 위치                                                                                          | 적합한 용도                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tailnet의 상시 실행 Gateway       | Tailscale 또는 SSH로 접근하는 상시 호스트(VPS 또는 홈 서버)                                                | 자주 절전 상태로 전환되지만 에이전트는 항상 실행되어야 하는 노트북. [exe.dev](/ko/install/exe-dev)(간편한 VM) 또는 [Hetzner](/ko/install/hetzner)(프로덕션 VPS)를 참조하세요. |
| 홈 데스크톱                       | 데스크톱. 노트북은 macOS 앱의 원격 모드(Settings → Connection → OpenClaw runs)를 통해 원격 연결             | 전원이 계속 켜져 있는 하드웨어에서 에이전트를 유지하는 경우. 실행 안내서: [macOS 원격 접근](/ko/platforms/mac/remote).                                               |
| 노트북                            | SSH 터널 또는 Tailscale Serve를 통해 안전하게 노출된 노트북(`gateway.bind: "loopback"` 유지)               | 단일 머신 구성. [Tailscale](/ko/gateway/tailscale) 및 [웹](/ko/web)을 참조하세요.                                                                                       |

상시 실행 및 노트북 구성에서는 `gateway.bind: "loopback"`을 유지하면서 제어 UI에는 **Tailscale Serve**를 사용하거나, `gateway.remote.transport: "direct"`와 함께 신뢰할 수 있는 LAN/Tailnet 바인딩을 사용하는 것이 좋습니다. SSH 터널은 모든 머신에서 작동하는 대체 수단입니다.

## 명령 흐름(각 작업의 실행 위치)

하나의 Gateway가 상태와 채널을 관리하고, Node는 주변 장치 역할을 합니다. 예시(Telegram 메시지를 Node 도구로 라우팅):

1. Telegram 메시지가 **Gateway**에 도착합니다.
2. Gateway가 **에이전트**를 실행하고, 에이전트는 Node 도구 호출 여부를 결정합니다.
3. Gateway가 Gateway WebSocket을 통해 **Node**를 호출합니다(`node.invoke` RPC).
4. Node가 결과를 반환하고 Gateway가 Telegram에 응답합니다.

Node는 Gateway 서비스를 실행하지 않습니다. 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 하나의 Gateway만 실행해야 합니다([여러 Gateway](/ko/gateway/multiple-gateways) 참조). macOS 앱의 "Node 모드"는 단지 Gateway WebSocket을 사용하는 Node 클라이언트입니다.

## SSH 터널(CLI + 도구)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

터널이 연결되면 `openclaw health`와 `openclaw status --deep`이 `ws://127.0.0.1:18789`를 통해 원격 Gateway에 접근합니다. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe`, `openclaw gateway call`도 `--url`을 통해 전달된 URL을 대상으로 지정할 수 있습니다.

<Note>
`18789`를 구성한 `gateway.port`(또는 `--port` / `OPENCLAW_GATEWAY_PORT`)로 바꾸세요.
</Note>

<Warning>
`--url`은 구성이나 환경의 자격 증명을 절대 대체 수단으로 사용하지 않습니다. `--token` 또는 `--password`를 명시적으로 전달하세요. 전달하지 않으면 클라이언트가 자격 증명을 전송하지 않으며, 대상 Gateway가 인증을 요구할 경우 연결에 실패합니다.
</Warning>

## CLI 원격 기본값

CLI 명령에서 기본적으로 사용하도록 원격 대상을 영구 저장합니다.

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

Gateway가 local loopback 전용이면 URL을 `ws://127.0.0.1:18789`로 유지하고 먼저 SSH 터널을 여세요. macOS 앱의 SSH 터널 전송 방식에서는 검색된 Gateway 호스트 이름을 `gateway.remote.sshTarget`(`user@host` 또는 `user@host:port`)에 지정하며, `gateway.remote.url`은 로컬 터널 URL로 유지합니다. 원격 포트가 로컬 포트와 다르면 `gateway.remote.remotePort`를 설정하세요.

호스트 키 검증은 기본적으로 엄격합니다(`gateway.remote.sshHostKeyPolicy: "strict"`). 대신 현재 적용되는 OpenSSH 구성에 위임하려면 `"openssh"`로 설정하세요. 활성화하기 전에 사용자 및 시스템 SSH 설정을 검토하세요.

신뢰할 수 있는 LAN 또는 Tailnet에서 이미 접근 가능한 Gateway에는 직접 모드를 사용하세요.

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

Gateway 자격 증명 확인은 호출/프로브/상태 경로와 Discord 실행 승인 모니터링 전반에서 하나의 공통 계약을 따릅니다. Node 호스트도 하나의 로컬 모드 예외(`gateway.remote.*` 무시)를 제외하면 동일한 계약을 사용합니다.

- 명시적 인증을 허용하는 호출 경로에서는 명시적으로 지정한 자격 증명(`--token`, `--password` 또는 도구의 `gatewayToken`)이 항상 우선합니다.
- URL 재정의 안전성:
  - CLI `--url`은 암시적인 구성/환경 자격 증명을 절대 재사용하지 않습니다.
  - 환경 변수 `OPENCLAW_GATEWAY_URL`은 환경 자격 증명(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)만 사용할 수 있습니다.
- 로컬 모드 기본값:
  - 토큰: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`(로컬 토큰이 설정되지 않은 경우에만 원격 값을 대체 수단으로 사용)
  - 비밀번호: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`(로컬 비밀번호가 설정되지 않은 경우에만 원격 값을 대체 수단으로 사용)
- 원격 모드 기본값:
  - 토큰: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - 비밀번호: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Node 호스트 로컬 모드 예외: `gateway.remote.token` / `gateway.remote.password`는 무시됩니다.
- 원격 프로브/상태 토큰 검사는 기본적으로 엄격합니다. 원격 모드를 대상으로 할 때 `gateway.remote.token`만 사용하며 로컬 토큰을 대체 수단으로 사용하지 않습니다.
- Gateway 환경 변수 재정의에는 `OPENCLAW_GATEWAY_*`만 사용됩니다.

## 채팅 UI 원격 접근

WebChat에는 별도의 HTTP 포트가 없습니다. SwiftUI 채팅 UI는 Gateway WebSocket에 직접 연결됩니다.

- SSH를 통해 `18789`를 전달한 다음(위 내용 참조) 클라이언트를 `ws://127.0.0.1:18789`에 연결하세요.
- LAN/Tailnet 직접 모드에서는 클라이언트를 구성된 비공개 `ws://` 또는 보안 `wss://` URL에 연결하세요.
- macOS에서는 앱의 원격 모드가 선택한 전송 방식을 자동으로 관리합니다.

## macOS 앱 원격 모드

macOS 메뉴 막대 앱은 원격 상태 확인, WebChat, Voice Wake 전달을 포함한 동일한 구성을 처음부터 끝까지 처리합니다. 실행 안내서: [macOS 원격 접근](/ko/platforms/mac/remote).

## 보안 규칙(원격/VPN)

바인딩이 반드시 필요하다고 확신하지 않는 한 Gateway를 **local loopback 전용**으로 유지하세요.

- **local loopback + SSH/Tailscale Serve**가 가장 안전한 기본값입니다(공개 노출 없음).
- 평문 `ws://`는 local loopback, 비공개/LAN(RFC 1918), 링크 로컬, CGNAT, `.local`, `.ts.net` 호스트에서 허용됩니다. 공개 원격 호스트는 `wss://`를 사용해야 합니다.
- **local loopback이 아닌 바인딩**(`lan`/`tailnet`/`custom` 또는 local loopback을 사용할 수 없을 때의 `auto`)은 토큰, 비밀번호 또는 `gateway.auth.mode: "trusted-proxy"`가 적용된 ID 인식 역방향 프록시를 통한 Gateway 인증을 사용해야 합니다.
- `gateway.remote.token` / `.password`는 클라이언트 자격 증명의 소스이며, 그 자체로 서버 인증을 구성하지는 않습니다.
- 로컬 호출 경로에서는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체 수단으로 사용할 수 있습니다.
- `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되어 있지만 확인되지 않으면, 확인 과정은 닫힌 상태로 실패합니다(원격 대체 수단으로 오류를 숨기지 않음).
- `gateway.remote.tlsFingerprint`는 macOS 직접 모드를 포함하여 `wss://`의 원격 TLS 인증서를 고정합니다. 저장된 고정값이 없으면 macOS는 정상적인 시스템 신뢰 검증을 통과한 뒤 최초 사용 시에만 인증서를 고정합니다. 자체 서명 또는 비공개 CA를 사용하는 Gateway에는 명시적인 지문이나 SSH를 통한 원격 연결이 필요합니다.
- **Tailscale Serve**는 `gateway.auth.allowTailscale: true`일 때 ID 헤더를 통해 제어 UI/WebSocket 트래픽을 인증할 수 있습니다. HTTP API 엔드포인트는 이 헤더 인증을 사용하지 않으며 대신 Gateway의 일반 HTTP 인증 모드를 따릅니다. 이 토큰 없는 흐름은 Gateway 호스트를 신뢰한다고 가정합니다. 모든 곳에서 공유 비밀 인증을 사용하려면 `false`로 설정하세요.
- **신뢰할 수 있는 프록시** 인증은 기본적으로 local loopback이 아닌 ID 인식 프록시를 요구합니다. 동일 호스트의 local loopback 역방향 프록시를 사용하려면 `gateway.auth.trustedProxy.allowLoopback = true`를 명시적으로 설정해야 합니다.
- 브라우저 제어를 운영자 접근과 동일하게 취급하세요. Tailnet 전용으로 제한하고 의도적으로 Node를 페어링해야 합니다.

자세한 내용: [보안](/ko/gateway/security).

### macOS: LaunchAgent를 통한 영구 SSH 터널

macOS 클라이언트에서는 SSH `LocalForward` 구성 항목과 재부팅 및 비정상 종료 후에도 터널을 유지하는 LaunchAgent를 함께 사용하는 것이 가장 간편한 영구 구성입니다.

#### 1단계: SSH 구성 추가

`~/.ssh/config`를 편집하세요.

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

`<REMOTE_IP>`와 `<REMOTE_USER>`를 자신의 값으로 바꾸세요.

#### 2단계: SSH 키 복사(한 번만 수행)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### 3단계: Gateway 토큰 구성

```bash
openclaw config set gateway.remote.token "<your-token>"
```

원격 Gateway가 비밀번호 인증을 사용한다면 대신 `gateway.remote.password`를 사용하세요. `OPENCLAW_GATEWAY_TOKEN`도 셸 수준 재정의로 계속 사용할 수 있지만, 지속적인 원격 클라이언트 구성에는 `gateway.remote.token` / `gateway.remote.password`를 사용합니다.

#### 4단계: LaunchAgent 생성

`~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`로 저장하세요.

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

터널은 로그인 시 자동으로 시작되고, 비정상 종료 시 다시 시작되며, 전달된 포트를 계속 활성 상태로 유지합니다.

<Note>
이전 구성에서 남은 `com.openclaw.ssh-tunnel` LaunchAgent가 있다면 언로드한 후 삭제하세요.
</Note>

#### 문제 해결

```bash
# 터널이 실행 중인지 확인
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# 터널 다시 시작
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# 터널 중지
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| 구성 항목                            | 기능                                                   |
| ------------------------------------ | ------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | 로컬 포트 18789를 원격 포트 18789로 전달               |
| `ssh -N`                             | 원격 명령을 실행하지 않는 SSH(포트 전달만 수행)        |
| `KeepAlive`                          | 터널이 비정상 종료되면 자동으로 다시 시작              |
| `RunAtLoad`                          | 로그인 시 LaunchAgent가 로드될 때 터널 시작            |

## 관련 항목

- [Tailscale](/ko/gateway/tailscale)
- [인증](/ko/gateway/authentication)
- [원격 Gateway 구성](/ko/gateway/remote-gateway-readme)
