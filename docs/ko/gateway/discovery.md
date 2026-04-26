---
read_when:
    - Bonjour 검색/광고 구현 또는 변경하기
    - 원격 연결 모드(direct vs SSH) 조정하기
    - 원격 Node용 검색 + 페어링 설계하기
summary: gateway를 찾기 위한 Node 검색 및 전송(Bonjour, Tailscale, SSH)
title: 검색 및 전송
x-i18n:
    generated_at: "2026-04-26T11:28:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 615be0f501470772c257beb8e798c522c108b09081a603f44218404277fdf269
    source_path: gateway/discovery.md
    workflow: 15
---

# 검색 및 전송

OpenClaw에는 표면적으로는 비슷해 보이지만 실제로는 서로 다른 두 가지 문제가 있습니다.

1. **운영자 원격 제어**: 다른 곳에서 실행 중인 gateway를 macOS 메뉴 막대 앱이 제어하는 경우
2. **Node 페어링**: iOS/Android(및 향후 Node)가 gateway를 찾아 안전하게 페어링하는 경우

설계 목표는 모든 네트워크 검색/광고를 **Node Gateway**(`openclaw gateway`)에 유지하고, 클라이언트(mac 앱, iOS)는 소비자 역할만 하도록 하는 것입니다.

## 용어

- **Gateway**: 상태(세션, 페어링, Node 레지스트리)를 소유하고 채널을 실행하는 단일 장기 실행 gateway 프로세스입니다. 대부분의 설정은 호스트당 하나를 사용하지만, 격리된 멀티 gateway 설정도 가능합니다.
- **Gateway WS(제어 평면)**: 기본적으로 `127.0.0.1:18789`에 있는 WebSocket 엔드포인트이며, `gateway.bind`를 통해 LAN/tailnet에 바인드할 수 있습니다.
- **직접 WS 전송**: LAN/tailnet을 향한 Gateway WS 엔드포인트(SSH 없음).
- **SSH 전송(폴백)**: `127.0.0.1:18789`를 SSH로 포워딩해 수행하는 원격 제어입니다.
- **레거시 TCP bridge(제거됨)**: 이전 Node 전송 방식입니다([Bridge protocol](/ko/gateway/bridge-protocol) 참조). 더 이상 검색용으로 광고되지 않으며 현재 빌드에도 포함되지 않습니다.

프로토콜 상세:

- [Gateway protocol](/ko/gateway/protocol)
- [Bridge protocol(레거시)](/ko/gateway/bridge-protocol)

## "direct"와 SSH를 모두 유지하는 이유

- **직접 WS**는 동일 네트워크 및 tailnet 내에서 최고의 UX를 제공합니다.
  - Bonjour를 통한 LAN 자동 검색
  - gateway가 소유하는 페어링 토큰 + ACL
  - 셸 액세스가 필요 없음. 프로토콜 표면을 더 작고 감사 가능하게 유지할 수 있음
- **SSH**는 여전히 범용적인 폴백입니다.
  - SSH 액세스만 있으면 어디서나 동작(서로 무관한 네트워크 간에도 가능)
  - 멀티캐스트/mDNS 문제를 견딤
  - SSH 외에 새로운 인바운드 포트를 요구하지 않음

## 검색 입력(클라이언트가 gateway 위치를 알아내는 방법)

### 1) Bonjour / DNS-SD 검색

멀티캐스트 Bonjour는 best-effort이며 네트워크를 넘지 못합니다. OpenClaw는 구성된 광역 DNS-SD 도메인을 통해서도 동일한 gateway 비콘을 검색할 수 있으므로, 검색 범위는 다음을 포함할 수 있습니다.

- 같은 LAN의 `local.`
- 네트워크 간 검색을 위한 구성된 unicast DNS-SD 도메인

대상 방향:

- **gateway**가 WS 엔드포인트를 Bonjour로 광고합니다.
- 클라이언트는 이를 검색해 “gateway 선택” 목록을 보여주고, 선택한 엔드포인트를 저장합니다.

문제 해결 및 비콘 세부사항: [Bonjour](/ko/gateway/bonjour).

#### 서비스 비콘 세부사항

- 서비스 유형:
  - `_openclaw-gw._tcp` (gateway 전송 비콘)
- TXT 키(비밀 아님):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>` (운영자가 구성한 표시 이름)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789` (Gateway WS + HTTP)
  - `gatewayTls=1` (TLS가 활성화된 경우에만)
  - `gatewayTlsSha256=<sha256>` (TLS가 활성화되어 있고 fingerprint를 사용할 수 있는 경우에만)
  - `canvasPort=<port>` (canvas 호스트 포트. 현재 canvas 호스트가 활성화된 경우 `gatewayPort`와 동일)
  - `tailnetDns=<magicdns>` (선택적 힌트. Tailscale 사용 가능 시 자동 감지)
  - `sshPort=<port>` (mDNS full 모드에서만. 광역 DNS-SD에서는 생략될 수 있으며, 이 경우 SSH 기본값은 `22`)
  - `cliPath=<path>` (mDNS full 모드에서만. 광역 DNS-SD에서도 원격 설치 힌트로 계속 기록됨)

보안 참고:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT 값을 UX 힌트로만 취급해야 합니다.
- 라우팅(호스트/포트)은 TXT가 제공한 `lanHost`, `tailnetDns`, `gatewayPort`보다 **해석된 서비스 엔드포인트**(SRV + A/AAAA)를 우선해야 합니다.
- TLS pinning은 광고된 `gatewayTlsSha256`가 이전에 저장된 pin을 덮어쓰도록 절대 허용해서는 안 됩니다.
- iOS/Android Node는 선택한 경로가 보안/TLS 기반일 때, 처음 보는 pin을 저장하기 전에 반드시 명시적인 “이 fingerprint를 신뢰” 확인(대역 외 검증)을 요구해야 합니다.

비활성화/override:

- `OPENCLAW_DISABLE_BONJOUR=1`은 광고를 비활성화합니다.
- Docker Compose는 브리지 네트워크가 보통
  mDNS 멀티캐스트를 안정적으로 전달하지 못하므로 기본적으로 `OPENCLAW_DISABLE_BONJOUR=1`을 사용합니다. 호스트, macvlan
  또는 다른 mDNS 지원 네트워크에서만 `0`을 사용하세요.
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 `sshPort`가 출력될 때 광고되는 SSH 포트를 override합니다.
- `OPENCLAW_TAILNET_DNS`는 `tailnetDns` 힌트(MagicDNS)를 게시합니다.
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 override합니다.

### 2) Tailnet(네트워크 간)

London/Vienna 스타일 설정에서는 Bonjour가 도움이 되지 않습니다. 이 경우 권장되는 "직접" 대상은 다음과 같습니다.

- Tailscale MagicDNS 이름(권장) 또는 안정적인 tailnet IP

gateway가 Tailscale 환경에서 실행 중임을 감지할 수 있으면, 클라이언트용(광역 비콘 포함) 선택적 힌트로 `tailnetDns`를 게시합니다.

macOS 앱은 이제 gateway 검색 시 raw Tailscale IP보다 MagicDNS 이름을 우선합니다. 이렇게 하면 tailnet IP가 바뀌는 경우(예: Node 재시작 또는 CGNAT 재할당 후)에도 MagicDNS 이름이 현재 IP로 자동 해석되므로 신뢰성이 향상됩니다.

모바일 Node 페어링에서는 검색 힌트가 tailnet/공개 경로의 전송 보안을 완화하지 않습니다.

- iOS/Android는 여전히 안전한 첫 연결 경로(`wss://` 또는 Tailscale Serve/Funnel)를 요구합니다.
- 검색된 raw tailnet IP는 라우팅 힌트일 뿐이며, 평문 원격 `ws://` 사용 권한을 뜻하지 않습니다.
- 사설 LAN 직접 연결 `ws://`는 계속 지원됩니다.
- 모바일 Node에서 가장 단순한 Tailscale 경로를 원한다면, 검색과 설정 코드가 동일한 안전한 MagicDNS 엔드포인트로 해석되도록 Tailscale Serve를 사용하세요.

### 3) 수동 / SSH 대상

직접 경로가 없거나(또는 direct가 비활성화된 경우), 클라이언트는 언제나 loopback gateway 포트를 SSH로 포워딩하여 연결할 수 있습니다.

자세한 내용은 [원격 액세스](/ko/gateway/remote)를 참조하세요.

## 전송 선택(클라이언트 정책)

권장 클라이언트 동작:

1. 페어링된 직접 엔드포인트가 구성되어 있고 도달 가능하면 이를 사용합니다.
2. 그렇지 않고 검색이 `local.` 또는 구성된 광역 도메인에서 gateway를 찾으면, 한 번 탭으로 “이 gateway 사용” 선택지를 제공하고 이를 직접 엔드포인트로 저장합니다.
3. 그렇지 않고 tailnet DNS/IP가 구성되어 있으면 direct를 시도합니다.
   모바일 Node의 tailnet/공개 경로에서 direct는 평문 원격 `ws://`가 아니라 안전한 엔드포인트를 의미합니다.
4. 그렇지 않으면 SSH로 폴백합니다.

## 페어링 + 인증(직접 전송)

gateway는 Node/클라이언트 허용의 단일 진실 공급원입니다.

- 페어링 요청은 gateway에서 생성/승인/거부됩니다([Gateway pairing](/ko/gateway/pairing) 참조).
- gateway는 다음을 강제합니다.
  - 인증(토큰 / keypair)
  - 범위/ACL(gateway는 모든 메서드에 대한 원시 프록시가 아님)
  - rate limit

## 구성 요소별 책임

- **Gateway**: 검색 비콘을 광고하고, 페어링 결정을 소유하며, WS 엔드포인트를 호스팅합니다.
- **macOS 앱**: gateway 선택을 돕고, 페어링 프롬프트를 표시하며, SSH는 폴백으로만 사용합니다.
- **iOS/Android Node**: 편의 기능으로 Bonjour를 검색하고, 페어링된 Gateway WS에 연결합니다.

## 관련 항목

- [원격 액세스](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)
- [Bonjour 검색](/ko/gateway/bonjour)
