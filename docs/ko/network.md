---
read_when:
    - 네트워크 아키텍처 및 보안 개요가 필요합니다.
    - 로컬 액세스와 tailnet 액세스 또는 페어링을 디버깅하고 있습니다
    - 네트워킹 문서의 표준 목록이 필요합니다
summary: '네트워크 허브: Gateway 인터페이스, 페어링, 검색 및 보안'
title: 네트워크
x-i18n:
    generated_at: "2026-07-12T15:23:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

이 허브에서는 OpenClaw가 localhost, LAN 및 tailnet 전반에서 장치를 연결하고 페어링하며 보호하는 방법에 관한 핵심 문서로 연결됩니다.

## 핵심 모델

대부분의 작업은 채널 연결과 WebSocket 제어 영역을 담당하는 단일 장기 실행 프로세스인 Gateway(`openclaw gateway`)를 통해 이루어집니다.

- **루프백 우선**: Gateway WS의 기본값은 `ws://127.0.0.1:18789`입니다.
  유효한 Gateway 인증 경로가 없으면 비루프백 바인딩은 시작되지 않습니다.
  공유 비밀 토큰/비밀번호 인증 또는 올바르게 구성된 비루프백
  `trusted-proxy` 배포가 필요합니다.
- **호스트당 하나의 Gateway**를 권장합니다. 격리가 필요한 경우 격리된 프로필과 포트를 사용하여 여러 Gateway를 실행하십시오([여러 Gateway](/ko/gateway/multiple-gateways)).
- **Canvas 호스트**는 Gateway와 동일한 포트에서 제공되며(`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), 루프백 외부에 바인딩된 경우 Gateway 인증으로 보호됩니다.
- **원격 액세스**에는 일반적으로 SSH 터널 또는 Tailscale VPN을 사용합니다([원격 액세스](/ko/gateway/remote)).

주요 참고 자료:

- [Gateway 아키텍처](/ko/concepts/architecture)
- [Gateway 프로토콜](/ko/gateway/protocol)
- [Gateway 운영 가이드](/ko/gateway)
- [웹 인터페이스 및 바인딩 모드](/ko/web)

## 페어링 및 ID

- [페어링 개요(DM 및 Node)](/ko/channels/pairing)
- [Gateway가 관리하는 Node 페어링](/ko/gateway/pairing)
- [장치 CLI(페어링 및 토큰 교체)](/ko/cli/devices)
- [페어링 CLI(DM 승인)](/ko/cli/pairing)

로컬 신뢰:

- 전달된 헤더나 프록시 헤더가 없는 직접 로컬 루프백 연결은 동일 호스트에서 원활한 사용자 경험을 제공하기 위해 페어링이 자동 승인될 수 있습니다.
- OpenClaw에는 신뢰할 수 있는 공유 비밀 도우미 흐름을 위한 제한적인 백엔드/컨테이너 로컬 자체 연결 경로도 있습니다.
- 동일 호스트의 tailnet 바인딩을 포함한 tailnet 및 LAN 클라이언트에는 여전히 명시적인 페어링 승인이 필요합니다.

## 검색 및 전송 방식

- [검색 및 전송 방식](/ko/gateway/discovery)
- [Bonjour / mDNS](/ko/gateway/bonjour)
- [원격 액세스(SSH)](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)

## Node 및 전송 방식

- [Node 개요](/ko/nodes)
- [브리지 프로토콜(레거시 Node, 과거 기록)](/ko/gateway/bridge-protocol)
- [Node 운영 가이드: iOS](/ko/platforms/ios)
- [Node 운영 가이드: Android](/ko/platforms/android)

## 보안

- [보안 개요](/ko/gateway/security)
- [Gateway 구성 참고 자료](/ko/gateway/configuration)
- [문제 해결](/ko/gateway/troubleshooting)
- [Doctor](/ko/gateway/doctor)

## 관련 문서

- [Gateway 운영 가이드](/ko/gateway)
- [원격 액세스](/ko/gateway/remote)
