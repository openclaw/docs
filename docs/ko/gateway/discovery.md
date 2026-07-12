---
read_when:
    - Bonjour 검색/광고 구현 또는 변경
    - 원격 연결 모드 조정(직접 연결과 SSH)
    - 원격 Node의 검색 및 페어링 설계
summary: Gateway 검색을 위한 Node 검색 및 전송 방식(Bonjour, Tailscale, SSH)
title: 검색 및 전송 방식
x-i18n:
    generated_at: "2026-07-12T15:14:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3a3f1a6a1212ab0bc7021e77c88de059edcb8e09eff90d3e1e59451b9b20876b
    source_path: gateway/discovery.md
    workflow: 16
---

OpenClaw에는 서로 관련되어 있지만 구별되는 두 가지 검색 문제가 있습니다.

1. **운영자 원격 제어**: macOS 메뉴 막대 앱이 다른 곳에서 실행 중인 Gateway를 제어합니다.
2. **Node 페어링**: iOS/Android(및 향후 Node)가 Gateway를 찾아 안전하게 페어링합니다.

모든 네트워크 검색/광고는 **Node Gateway**
(`openclaw gateway`)에서 처리하며, 클라이언트(mac 앱, iOS)는 이를 사용하기만 합니다.

## 용어

- **Gateway**: 상태(세션, 페어링, Node 레지스트리)를 소유하고 채널을 실행하는 하나의 장기 실행 프로세스입니다. 대부분의 설정에서는 호스트당 하나를 사용하지만,
  격리된 다중 Gateway 설정도 가능합니다.
- **Gateway WS(제어 영역)**: 기본적으로 `127.0.0.1:18789`에 있는 WebSocket 엔드포인트입니다.
  `gateway.bind`를 통해 LAN/tailnet에 바인딩합니다.
- **직접 WS 전송**: LAN/tailnet에서 접근할 수 있는 Gateway WS 엔드포인트입니다(SSH 없음).
- **SSH 전송(대체 수단)**: SSH를 통해 `127.0.0.1:18789`를
  포워딩하여 원격 제어합니다.
- **레거시 TCP 브리지(제거됨)**: 이전 Node 전송 방식입니다(
  [브리지 프로토콜](/ko/gateway/bridge-protocol) 참조). 검색을 위해 더 이상 광고되지 않으며
  현재 빌드에도 포함되지 않습니다.

프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol),
[브리지 프로토콜(레거시)](/ko/gateway/bridge-protocol).

## 직접 연결과 SSH가 모두 존재하는 이유

- **직접 WS**는 동일한 네트워크와 tailnet 내에서 최상의 사용자 경험을 제공합니다. Bonjour를 통한 LAN
  자동 검색, Gateway가 소유하는 페어링 토큰 및 ACL을 지원하며
  셸 액세스가 필요하지 않습니다.
- **SSH**는 범용 대체 수단입니다. SSH 액세스 권한만 있으면 서로 관련 없는 네트워크 사이에서도
  어디서나 작동하고, 멀티캐스트/mDNS 문제의 영향을 받지 않으며, SSH 외에 새로운
  인바운드 포트가 필요하지 않습니다.

## 검색 입력

### 1) Bonjour / DNS-SD

멀티캐스트 Bonjour는 최선형 방식이며 네트워크를 넘어가지 않습니다. OpenClaw는 구성된 광역 DNS-SD
도메인을 통해 동일한 Gateway 비콘을 탐색하는 기능도 지원하므로, 검색 범위에 같은 LAN의 `local.`과 네트워크 간 검색용으로 구성된
유니캐스트 DNS-SD 도메인을 모두 포함할 수 있습니다.

번들 `bonjour` Plugin이 활성화된 경우 **Gateway**는 Bonjour를 통해 WS 엔드포인트를 광고합니다. 클라이언트는 이를 탐색하여 "Gateway 선택" 목록을 표시한 후
선택한 엔드포인트를 저장합니다.

문제 해결 및 비콘 세부 정보: [Bonjour](/ko/gateway/bonjour).

#### 서비스 비콘 세부 정보

- 서비스 유형: `_openclaw-gw._tcp`(Gateway 전송 비콘).
- TXT 키(비밀 정보 아님):

  | 키                          | 참고                                                                                                                                                             |
  | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `role=gateway`              | 항상 존재합니다.                                                                                                                                                 |
  | `transport=gateway`         | 항상 존재합니다.                                                                                                                                                 |
  | `displayName=<name>`        | 운영자가 구성한 표시 이름입니다.                                                                                                                                 |
  | `lanHost=<hostname>.local`  | LAN mDNS 광고자 전용이며 광역 DNS-SD에서는 기록하지 않습니다.                                                                                                    |
  | `gatewayPort=18789`         | Gateway WS + HTTP 포트입니다.                                                                                                                                    |
  | `gatewayTls=1`              | TLS가 활성화된 경우에만 존재합니다.                                                                                                                              |
  | `gatewayTlsSha256=<sha256>` | TLS가 활성화되고 지문을 사용할 수 있는 경우에만 존재합니다.                                                                                                      |
  | `tailnetDns=<magicdns>`     | 선택적 힌트이며 Tailscale을 사용할 수 있으면 자동으로 감지합니다.                                                                                                |
  | `sshPort=<port>`            | `discovery.mdns.mode="full"`인 경우에만 존재합니다. 기본 `"minimal"` 모드에서는 LAN 광고자와 광역 DNS-SD 모두에서 생략됩니다(SSH 기본값은 `22`).                  |
  | `cliPath=<path>`            | `sshPort`와 동일하게 `discovery.mdns.mode="full"` 조건이 적용되며, CLI 경로에 대한 원격 설치 힌트입니다.                                                          |

  향후 캔버스 호스트 포트를 위해 Plugin 검색 계약에 `canvasPort` TXT 키가 정의되어 있지만,
  현재 값을 설정하는 코드 경로가 없으므로 현재는 절대 방출되지 않습니다.

보안 참고 사항:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT
  값을 사용자 경험을 위한 힌트로만 취급해야 합니다.
- 라우팅(호스트/포트)은 TXT에서 제공한 `lanHost`, `tailnetDns` 또는 `gatewayPort`보다
  **확인된 서비스 엔드포인트**(SRV + A/AAAA)를 우선해야 합니다.
- TLS 고정 시 광고된 `gatewayTlsSha256`이 이전에 저장된 고정값을 재정의하도록 해서는 안 됩니다.
- 선택한 경로가 보안/TLS 기반인 경우 iOS/Android Node는 최초 고정값을 저장하기 전에
  명시적인 "이 지문 신뢰" 확인(대역 외 검증)을 요구해야 합니다.

활성화, 비활성화 및 재정의:

- `openclaw plugins enable bonjour`는 LAN 멀티캐스트 광고를 활성화합니다.
- `openclaw.json`의 `discovery.mdns.mode`는 mDNS 브로드캐스트를 제어합니다.
  `"minimal"`(기본값), `"full"`(LAN 비콘과 모든 광역 DNS-SD 영역에 `cliPath`/`sshPort`를
  추가) 또는 `"off"`(mDNS 비활성화)를 사용할 수 있습니다.
- `OPENCLAW_DISABLE_BONJOUR=1`은 광고를 강제로 비활성화하며, `discovery.mdns.mode="off"`도
  독립적으로 광고를 비활성화합니다. `OPENCLAW_DISABLE_BONJOUR=0`은 컨테이너(Docker, containerd, Kubernetes, LXC)가
  감지되었을 때 Plugin이 자동으로 비활성화되는 동작을 재정의하는 명시적 옵트인입니다. 단,
  `discovery.mdns.mode="off"`는 재정의하지 않습니다. 번들 `bonjour` Plugin은
  macOS 호스트에서 자동으로 시작되고(`enabledByDefaultOnPlatforms: ["darwin"]`)
  감지된 컨테이너 내부에서는 자동으로 비활성화됩니다. Linux, Windows 및 기타 컨테이너화된
  배포에서는 명시적으로 `plugins enable bonjour`를 실행해야 합니다.
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인딩 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 광고되는 SSH 포트를 재정의합니다(`discovery.mdns.mode="full"`인 경우에만
  적용됩니다).
- `OPENCLAW_TAILNET_DNS`는 `tailnetDns` 힌트(MagicDNS)를 게시합니다.
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 재정의합니다.

### 2) Tailnet(네트워크 간)

서로 다른 물리적 네트워크에 있는 Gateway에는 Bonjour가 도움이 되지 않습니다.
권장되는 직접 대상은 Tailscale MagicDNS 이름(권장) 또는 안정적인 tailnet IP입니다.

Gateway가 Tailscale에서 실행 중임을 감지하면 클라이언트를 위한 선택적 힌트로
`tailnetDns`를 게시합니다(광역 비콘 포함).
macOS 앱은 Gateway 검색 시 원시 Tailscale IP보다 MagicDNS 이름을 우선합니다. MagicDNS는 현재 IP를 자동으로 확인하므로
tailnet IP가 변경되어도(Node 재시작,
CGNAT 재할당) 안정적으로 작동합니다.

모바일 Node 페어링의 경우 검색 힌트는 tailnet/공개 경로의 전송 보안을 절대 완화하지 않습니다.

- iOS/Android는 여전히 안전한 최초 tailnet/공개 연결 경로
  (`wss://` 또는 Tailscale Serve/Funnel)를 요구합니다.
- 검색된 원시 tailnet IP는 라우팅 힌트일 뿐, 평문 원격 `ws://` 사용 권한이 아닙니다.
- 비공개 LAN 직접 연결 `ws://`는 계속 지원됩니다.
- 모바일 Node에서 가장 간단한 Tailscale 경로를 사용하려면 Tailscale Serve를 사용하여
  검색과 설정이 모두 동일한 보안 MagicDNS 엔드포인트로 확인되게 하십시오.

### 3) 수동 / SSH 대상

직접 경로가 없거나 직접 연결이 비활성화된 경우에도 클라이언트는 루프백 Gateway 포트를 포워딩하여
항상 SSH를 통해 연결할 수 있습니다.
[원격 액세스](/ko/gateway/remote)를 참조하십시오.

## 전송 선택(클라이언트 정책)

1. 페어링된 직접 엔드포인트가 구성되어 있고 연결할 수 있으면 이를 사용합니다.
2. 그렇지 않고 검색을 통해 `local.` 또는 구성된 광역 도메인에서 Gateway를 찾으면, 원탭 "이 Gateway 사용" 선택지를 제공하고 이를
   직접 엔드포인트로 저장합니다.
3. 그렇지 않고 tailnet DNS/IP가 구성되어 있으면 직접 연결을 시도합니다. tailnet/공개 경로의 모바일 Node에서
   직접 연결은 평문 원격 `ws://`가 아니라 보안 엔드포인트를 의미합니다.
4. 그렇지 않으면 SSH를 대체 수단으로 사용합니다.

## 페어링 및 인증(직접 전송)

Gateway는 Node/클라이언트 허용 여부의 단일 진실 공급원입니다.

- 페어링 요청은 Gateway에서 생성/승인/거부됩니다(
  [Gateway 페어링](/ko/gateway/pairing) 참조).
- Gateway는 인증(토큰/키 쌍), 범위/ACL(모든 메서드에 대한 원시
  프록시가 아님) 및 속도 제한을 적용합니다.

## 구성 요소별 책임

- **Gateway**: 검색 비콘을 광고하고, 페어링 결정을 소유하며,
  WS 엔드포인트를 호스팅합니다.
- **macOS 앱**: Gateway 선택을 지원하고, 페어링 프롬프트를 표시하며, SSH는
  대체 수단으로만 사용합니다.
- **iOS/Android Node**: 편의를 위해 Bonjour를 탐색하고,
  페어링된 Gateway WS에 연결합니다.

## 관련 문서

- [원격 액세스](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)
- [Bonjour 검색](/ko/gateway/bonjour)
