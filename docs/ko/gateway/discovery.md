---
read_when:
    - Bonjour 탐색/광고 구현 또는 변경
    - 원격 연결 모드 조정(직접 연결 대 SSH)
    - 원격 Node를 위한 Node 검색 + 페어링 설계
summary: Gateway를 찾기 위한 Node 검색 및 전송 방식(Bonjour, Tailscale, SSH)
title: 탐색 및 전송 방식
x-i18n:
    generated_at: "2026-04-30T06:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c396e6e07808e2571c6d7f539922b94443adbf39339027e6e962596c6f13deaa
    source_path: gateway/discovery.md
    workflow: 16
---

# 검색 및 전송 방식

OpenClaw에는 겉보기에는 비슷해 보이는 두 가지 별개의 문제가 있습니다.

1. **운영자 원격 제어**: 다른 곳에서 실행 중인 Gateway를 제어하는 macOS 메뉴 막대 앱입니다.
2. **Node 페어링**: iOS/Android(및 향후 노드)가 Gateway를 찾고 안전하게 페어링합니다.

설계 목표는 모든 네트워크 검색/광고를 **Node Gateway**(`openclaw gateway`)에 유지하고 클라이언트(mac 앱, iOS)는 소비자로 유지하는 것입니다.

## 용어

- **Gateway**: 상태(세션, 페어링, 노드 레지스트리)를 소유하고 채널을 실행하는 단일 장기 실행 Gateway 프로세스입니다. 대부분의 설정은 호스트당 하나를 사용하며, 격리된 다중 Gateway 설정도 가능합니다.
- **Gateway WS(제어 평면)**: 기본적으로 `127.0.0.1:18789`의 WebSocket 엔드포인트입니다. `gateway.bind`를 통해 LAN/tailnet에 바인딩할 수 있습니다.
- **직접 WS 전송**: LAN/tailnet을 향한 Gateway WS 엔드포인트입니다(SSH 없음).
- **SSH 전송(대체 수단)**: SSH를 통해 `127.0.0.1:18789`를 포워딩하는 원격 제어입니다.
- **레거시 TCP 브리지(제거됨)**: 이전 노드 전송 방식입니다(
  [Bridge protocol](/ko/gateway/bridge-protocol) 참조). 더 이상 검색용으로 광고되지 않으며
  현재 빌드의 일부도 아닙니다.

프로토콜 세부 정보:

- [Gateway protocol](/ko/gateway/protocol)
- [Bridge protocol(레거시)](/ko/gateway/bridge-protocol)

## "직접"과 SSH를 모두 유지하는 이유

- **직접 WS**는 동일 네트워크 및 tailnet 내에서 가장 좋은 UX입니다.
  - Bonjour를 통한 LAN 자동 검색
  - Gateway가 소유하는 페어링 토큰 + ACL
  - 셸 액세스가 필요하지 않으며, 프로토콜 표면을 좁고 감사 가능하게 유지할 수 있음
- **SSH**는 보편적인 대체 수단으로 남습니다.
  - SSH 액세스가 있는 곳이라면 어디서든 작동함(서로 관련 없는 네트워크 간에도)
  - 멀티캐스트/mDNS 문제를 견딤
  - SSH 외에 새 인바운드 포트가 필요하지 않음

## 검색 입력(클라이언트가 Gateway 위치를 알아내는 방식)

### 1) Bonjour / DNS-SD 검색

멀티캐스트 Bonjour는 최선 노력 방식이며 네트워크를 넘지 않습니다. OpenClaw는 구성된 광역 DNS-SD 도메인을 통해
동일한 Gateway 비컨도 탐색할 수 있으므로, 검색 범위는 다음을 포함할 수 있습니다.

- 동일 LAN의 `local.`
- 네트워크 간 검색을 위한 구성된 유니캐스트 DNS-SD 도메인

목표 방향:

- **Gateway**는 Bonjour를 통해 WS 엔드포인트를 광고합니다.
- 클라이언트는 탐색 후 “Gateway 선택” 목록을 표시하고, 선택한 엔드포인트를 저장합니다.

문제 해결 및 비컨 세부 정보: [Bonjour](/ko/gateway/bonjour).

#### 서비스 비컨 세부 정보

- 서비스 유형:
  - `_openclaw-gw._tcp`(Gateway 전송 비컨)
- TXT 키(비밀 아님):
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<friendly name>`(운영자가 구성한 표시 이름)
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`(Gateway WS + HTTP)
  - `gatewayTls=1`(TLS가 활성화된 경우에만)
  - `gatewayTlsSha256=<sha256>`(TLS가 활성화되어 있고 지문을 사용할 수 있는 경우에만)
  - `canvasPort=<port>`(캔버스 호스트 포트. 현재 캔버스 호스트가 활성화된 경우 `gatewayPort`와 동일)
  - `tailnetDns=<magicdns>`(선택적 힌트. Tailscale을 사용할 수 있으면 자동 감지됨)
  - `sshPort=<port>`(mDNS 전체 모드에서만. 광역 DNS-SD에서는 생략될 수 있으며, 이 경우 SSH 기본값은 `22`로 유지됨)
  - `cliPath=<path>`(mDNS 전체 모드에서만. 광역 DNS-SD도 원격 설치 힌트로 기록함)

보안 참고 사항:

- Bonjour/mDNS TXT 레코드는 **인증되지 않습니다**. 클라이언트는 TXT 값을 UX 힌트로만 취급해야 합니다.
- 라우팅(호스트/포트)은 TXT가 제공한 `lanHost`, `tailnetDns`, 또는 `gatewayPort`보다 **확인된 서비스 엔드포인트**(SRV + A/AAAA)를 우선해야 합니다.
- TLS 핀 고정은 광고된 `gatewayTlsSha256`이 이전에 저장된 핀을 재정의하도록 허용해서는 안 됩니다.
- iOS/Android 노드는 선택한 경로가 보안/TLS 기반일 때 최초 핀을 저장하기 전에 명시적인 “이 지문 신뢰” 확인(대역 외 검증)을 요구해야 합니다.

비활성화/재정의:

- `OPENCLAW_DISABLE_BONJOUR=1`은 광고를 비활성화합니다.
- `OPENCLAW_DISABLE_BONJOUR`가 설정되지 않은 경우, Bonjour는 일반 호스트에서 광고하고
  감지된 컨테이너 내부에서는 자동으로 비활성화됩니다. 호스트, macvlan,
  또는 다른 mDNS 가능 네트워크에서만 `0`을 사용하고, 강제로 비활성화하려면 `1`을 사용하세요.
- `~/.openclaw/openclaw.json`의 `gateway.bind`는 Gateway 바인드 모드를 제어합니다.
- `OPENCLAW_SSH_PORT`는 `sshPort`가 방출될 때 광고되는 SSH 포트를 재정의합니다.
- `OPENCLAW_TAILNET_DNS`는 `tailnetDns` 힌트(MagicDNS)를 게시합니다.
- `OPENCLAW_CLI_PATH`는 광고되는 CLI 경로를 재정의합니다.

### 2) Tailnet(네트워크 간)

London/Vienna 스타일 설정에서는 Bonjour가 도움이 되지 않습니다. 권장되는 “직접” 대상은 다음입니다.

- Tailscale MagicDNS 이름(선호) 또는 안정적인 tailnet IP.

Gateway가 Tailscale에서 실행 중임을 감지할 수 있으면, 클라이언트(광역 비컨 포함)를 위한 선택적 힌트로 `tailnetDns`를 게시합니다.

macOS 앱은 이제 Gateway 검색에서 원시 Tailscale IP보다 MagicDNS 이름을 우선합니다. MagicDNS 이름은 현재 IP로 자동 확인되므로, tailnet IP가 변경될 때(예: 노드 재시작 또는 CGNAT 재할당 후) 안정성이 향상됩니다.

모바일 노드 페어링의 경우, 검색 힌트는 tailnet/공개 경로의 전송 보안을 완화하지 않습니다.

- iOS/Android는 여전히 보안이 적용된 최초 tailnet/공개 연결 경로(`wss://` 또는 Tailscale Serve/Funnel)를 요구합니다.
- 검색된 원시 tailnet IP는 라우팅 힌트이지, 평문 원격 `ws://` 사용 권한이 아닙니다.
- 프라이빗 LAN 직접 연결 `ws://`는 계속 지원됩니다.
- 모바일 노드에 가장 간단한 Tailscale 경로를 원한다면, 검색과 설정 코드가 모두 동일한 보안 MagicDNS 엔드포인트로 확인되도록 Tailscale Serve를 사용하세요.

### 3) 수동 / SSH 대상

직접 경로가 없거나 직접 경로가 비활성화된 경우, 클라이언트는 루프백 Gateway 포트를 포워딩하여 항상 SSH로 연결할 수 있습니다.

[Remote access](/ko/gateway/remote)를 참조하세요.

## 전송 선택(클라이언트 정책)

권장 클라이언트 동작:

1. 페어링된 직접 엔드포인트가 구성되어 있고 도달 가능하면 사용합니다.
2. 그렇지 않고 검색에서 `local.` 또는 구성된 광역 도메인의 Gateway를 찾으면, 한 번 탭하는 “이 Gateway 사용” 선택지를 제공하고 이를 직접 엔드포인트로 저장합니다.
3. 그렇지 않고 tailnet DNS/IP가 구성되어 있으면 직접 연결을 시도합니다.
   tailnet/공개 경로의 모바일 노드에서 직접 연결이란 평문 원격 `ws://`가 아니라 보안 엔드포인트를 의미합니다.
4. 그렇지 않으면 SSH로 대체합니다.

## 페어링 + 인증(직접 전송)

Gateway는 노드/클라이언트 승인에 대한 단일 진실 공급원입니다.

- 페어링 요청은 Gateway에서 생성/승인/거부됩니다([Gateway pairing](/ko/gateway/pairing) 참조).
- Gateway는 다음을 강제합니다.
  - 인증(토큰 / 키페어)
  - 범위/ACL(Gateway는 모든 메서드에 대한 원시 프록시가 아님)
  - 속도 제한

## 구성 요소별 책임

- **Gateway**: 검색 비컨을 광고하고, 페어링 결정을 소유하며, WS 엔드포인트를 호스팅합니다.
- **macOS 앱**: Gateway 선택을 돕고, 페어링 프롬프트를 표시하며, SSH는 대체 수단으로만 사용합니다.
- **iOS/Android 노드**: 편의 기능으로 Bonjour를 탐색하고 페어링된 Gateway WS에 연결합니다.

## 관련 항목

- [Remote access](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)
- [Bonjour 검색](/ko/gateway/bonjour)
