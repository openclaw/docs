---
read_when:
    - 노드 클라이언트 빌드 또는 디버깅(iOS/Android/macOS 노드 모드)
    - 페어링 또는 브리지 인증 실패 조사하기
    - Gateway가 노출하는 노드 표면 감사하기
summary: '이전 브리지 프로토콜(레거시 노드): TCP JSONL, 페어링, 범위 지정 RPC'
title: 브리지 프로토콜
x-i18n:
    generated_at: "2026-06-27T17:27:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 브리지는 **제거되었습니다**. 현재 OpenClaw 빌드는 브리지 리스너를 포함하지 않으며 `bridge.*` 구성 키는 더 이상 스키마에 없습니다. 이 페이지는 기록 참고용으로만 유지됩니다. 모든 노드/운영자 클라이언트에는 [Gateway 프로토콜](/ko/gateway/protocol)을 사용하세요.
</Warning>

## 존재했던 이유

- **보안 경계**: 브리지는 전체 Gateway API 표면 대신 작은 허용 목록을 노출합니다.
- **페어링 + 노드 ID**: 노드 허용은 Gateway가 소유하며 노드별 토큰에 연결됩니다.
- **디스커버리 UX**: 노드는 LAN에서 Bonjour를 통해 Gateway를 찾거나 tailnet을 통해 직접 연결할 수 있습니다.
- **Loopback WS**: 전체 WS 제어 평면은 SSH로 터널링하지 않는 한 로컬에 유지됩니다.

## 전송

- TCP, 한 줄에 JSON 객체 하나(JSONL).
- 선택적 TLS(`bridge.tls.enabled`가 true일 때).
- 기록상 기본 리스너 포트는 `18790`이었습니다(현재 빌드는 TCP 브리지를 시작하지 않습니다).

TLS가 활성화되면 디스커버리 TXT 레코드에는 비밀이 아닌 힌트로 `bridgeTls=1`과 `bridgeTlsSha256`이 포함됩니다. Bonjour/mDNS TXT 레코드는 인증되지 않습니다. 클라이언트는 명시적인 사용자 의도나 다른 대역 외 검증 없이 광고된 지문을 권위 있는 핀으로 취급해서는 안 됩니다.

## 핸드셰이크 + 페어링

1. 클라이언트가 노드 메타데이터 + 토큰(이미 페어링된 경우)과 함께 `hello`를 보냅니다.
2. 페어링되지 않은 경우 Gateway가 `error`(`NOT_PAIRED`/`UNAUTHORIZED`)로 응답합니다.
3. 클라이언트가 `pair-request`를 보냅니다.
4. Gateway가 승인을 기다린 다음 `pair-ok`와 `hello-ok`를 보냅니다.

기록상 `hello-ok`는 `serverName`을 반환했습니다. 이제 호스팅된 Plugin 표면은 `pluginSurfaceUrls`를 통해 광고됩니다. Canvas/A2UI는 `pluginSurfaceUrls.canvas`를 사용하며, 사용 중단된 `canvasHostUrl` 별칭은 리팩터링된 프로토콜의 일부가 아닙니다.

## 프레임

클라이언트 → Gateway:

- `req` / `res`: 범위가 지정된 Gateway RPC(chat, sessions, config, health, voicewake, skills.bins)
- `event`: 노드 신호(음성 전사, 에이전트 요청, 채팅 구독, exec 수명 주기)

Gateway → 클라이언트:

- `invoke` / `invoke-res`: 노드 명령(`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: 구독한 세션의 채팅 업데이트
- `ping` / `pong`: keepalive

레거시 허용 목록 적용은 `src/gateway/server-bridge.ts`에 있었습니다(제거됨).

## Exec 수명 주기 이벤트

노드는 완료된 `system.run` 활동을 표시하기 위해 `exec.finished` 이벤트를 내보낼 수 있습니다.
이 이벤트는 Gateway에서 시스템 이벤트에 매핑됩니다. (레거시 노드는 여전히 `exec.started`를 내보낼 수 있습니다.)
노드는 거부된 `system.run` 시도에 대해 `exec.denied`를 내보낼 수 있습니다. Gateway는
이 이벤트를 최종 거부로 받아들이며 시스템 이벤트를 큐에 넣거나 에이전트 작업을 깨우지 않습니다.

페이로드 필드(명시된 경우를 제외하고 모두 선택 사항):

- `sessionKey`(필수): 이벤트 상관관계 및 `exec.finished`의 경우 시스템 이벤트 전달을 위한 에이전트 세션입니다.
- `runId`: 그룹화를 위한 고유 exec ID입니다.
- `command`: 원시 또는 형식화된 명령 문자열입니다.
- `exitCode`, `timedOut`, `success`, `output`: 완료 세부 정보입니다(완료된 경우에만).
- `reason`: 거부 이유입니다(거부된 경우에만).

## 기록상 tailnet 사용

- 브리지를 tailnet IP에 바인딩: `~/.openclaw/openclaw.json`의 `bridge.bind: "tailnet"`(기록용만 해당, `bridge.*`는 더 이상 유효하지 않음).
- 클라이언트는 MagicDNS 이름 또는 tailnet IP를 통해 연결합니다.
- Bonjour는 네트워크를 **넘어가지 않습니다**. 필요한 경우 수동 호스트/포트 또는 광역 DNS-SD를 사용하세요.

## 버전 관리

브리지는 **암시적 v1**이었습니다(최소/최대 협상 없음). 이 섹션은 기록 참고용일 뿐입니다. 현재 노드/운영자 클라이언트는 WebSocket [Gateway 프로토콜](/ko/gateway/protocol)을 사용합니다.

## 관련 항목

- [Gateway 프로토콜](/ko/gateway/protocol)
- [노드](/ko/nodes)
