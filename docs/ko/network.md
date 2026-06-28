---
read_when:
    - 네트워크 아키텍처 및 보안 개요가 필요합니다
    - 로컬 액세스와 테일넷 액세스 또는 페어링 문제를 디버깅하고 있습니다.
    - 네트워킹 문서의 정식 목록이 필요합니다
summary: '네트워크 허브: Gateway 접점, 페어링, 검색 및 보안'
title: 네트워크
x-i18n:
    generated_at: "2026-05-06T06:31:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
    postprocess_version: locale-links-v1
---

이 허브는 OpenClaw가 localhost, LAN, tailnet 전반에서 장치를 연결, 페어링, 보호하는 방식에 대한 핵심 문서로 연결됩니다.

## 핵심 모델

대부분의 작업은 채널 연결과 WebSocket 제어 플레인을 소유하는 단일 장기 실행 프로세스인 Gateway(`openclaw gateway`)를 통해 흐릅니다.

- **먼저 루프백**: Gateway WS의 기본값은 `ws://127.0.0.1:18789`입니다.
  루프백이 아닌 바인딩에는 유효한 Gateway 인증 경로가 필요합니다. 공유 시크릿
  토큰/비밀번호 인증 또는 올바르게 구성된 루프백이 아닌
  `trusted-proxy` 배포가 필요합니다.
- **호스트당 하나의 Gateway**를 권장합니다. 격리가 필요하면 격리된 프로필과 포트로 여러 Gateway를 실행하세요([여러 Gateway](/ko/gateway/multiple-gateways)).
- **Canvas 호스트**는 Gateway와 같은 포트에서 제공되며(`__/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), 루프백을 넘어 바인딩될 때 Gateway 인증으로 보호됩니다.
- **원격 액세스**는 일반적으로 SSH 터널 또는 Tailscale VPN입니다([원격 액세스](/ko/gateway/remote)).

핵심 참고 자료:

- [Gateway 아키텍처](/ko/concepts/architecture)
- [Gateway 프로토콜](/ko/gateway/protocol)
- [Gateway 런북](/ko/gateway)
- [웹 표면 + 바인딩 모드](/ko/web)

## 페어링 + ID

- [페어링 개요(DM + 노드)](/ko/channels/pairing)
- [Gateway 소유 노드 페어링](/ko/gateway/pairing)
- [장치 CLI(페어링 + 토큰 순환)](/ko/cli/devices)
- [페어링 CLI(DM 승인)](/ko/cli/pairing)

로컬 신뢰:

- 직접 local loopback 연결은 같은 호스트 UX를 매끄럽게 유지하기 위해
  페어링을 자동 승인할 수 있습니다.
- OpenClaw에는 신뢰할 수 있는 공유 시크릿 헬퍼 흐름을 위한 좁은
  백엔드/컨테이너 로컬 자체 연결 경로도 있습니다.
- 같은 호스트 tailnet 바인딩을 포함한 Tailnet 및 LAN 클라이언트는 여전히
  명시적인 페어링 승인이 필요합니다.

## 검색 + 전송

- [검색 및 전송](/ko/gateway/discovery)
- [Bonjour / mDNS](/ko/gateway/bonjour)
- [원격 액세스(SSH)](/ko/gateway/remote)
- [Tailscale](/ko/gateway/tailscale)

## 노드 + 전송

- [노드 개요](/ko/nodes)
- [브리지 프로토콜(레거시 노드, 이력)](/ko/gateway/bridge-protocol)
- [노드 런북: iOS](/ko/platforms/ios)
- [노드 런북: Android](/ko/platforms/android)

## 보안

- [보안 개요](/ko/gateway/security)
- [Gateway 구성 참고 자료](/ko/gateway/configuration)
- [문제 해결](/ko/gateway/troubleshooting)
- [Doctor](/ko/gateway/doctor)

## 관련

- [Gateway 런북](/ko/gateway)
- [원격 액세스](/ko/gateway/remote)
