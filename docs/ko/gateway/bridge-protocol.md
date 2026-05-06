---
read_when:
    - node 클라이언트 빌드 또는 디버깅(iOS/Android/macOS node 모드)
    - 페어링 또는 브리지 인증 실패 조사하기
    - Gateway가 노출하는 Node 표면 감사
summary: '과거 bridge protocol(레거시 Node): TCP JSONL, 페어링, 범위 지정 RPC'
title: 브리지 프로토콜
x-i18n:
    generated_at: "2026-05-06T17:55:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 브리지는 **제거되었습니다**. 현재 OpenClaw 빌드는 브리지 리스너를 제공하지 않으며 `bridge.*` 구성 키는 더 이상 스키마에 없습니다. 이 페이지는 역사적 참고용으로만 유지됩니다. 모든 노드/운영자 클라이언트에는 [Gateway 프로토콜](/ko/gateway/protocol)을 사용하세요.
</Warning>

## 존재했던 이유

- **보안 경계**: 브리지는 전체 Gateway API 표면 대신 작은 허용 목록을 노출합니다.
- **페어링 + 노드 ID**: 노드 승인은 Gateway가 소유하며 노드별 토큰에 연결됩니다.
- **검색 UX**: 노드는 LAN에서 Bonjour를 통해 Gateway를 검색하거나 tailnet을 통해 직접 연결할 수 있습니다.
- **루프백 WS**: 전체 WS 제어 평면은 SSH를 통해 터널링하지 않는 한 로컬에 유지됩니다.

## 전송

- TCP, 한 줄에 JSON 객체 하나(JSONL).
- 선택적 TLS(`bridge.tls.enabled`가 true일 때).
- 역사적 기본 리스너 포트는 `18790`이었습니다(현재 빌드는 TCP 브리지를 시작하지 않음).

TLS가 활성화되면 검색 TXT 레코드에 비밀이 아닌 힌트로 `bridgeTls=1`과 `bridgeTlsSha256`이 포함됩니다. Bonjour/mDNS TXT 레코드는 인증되지 않습니다. 클라이언트는 명시적인 사용자 의도나 다른 대역 외 검증 없이 광고된 지문을 신뢰할 수 있는 핀으로 취급해서는 안 됩니다.

## 핸드셰이크 + 페어링

1. 클라이언트가 노드 메타데이터 + 토큰(이미 페어링된 경우)을 포함해 `hello`를 보냅니다.
2. 페어링되지 않은 경우 Gateway가 `error`(`NOT_PAIRED`/`UNAUTHORIZED`)로 응답합니다.
3. 클라이언트가 `pair-request`를 보냅니다.
4. Gateway가 승인을 기다린 다음 `pair-ok`와 `hello-ok`를 보냅니다.

역사적으로 `hello-ok`는 `serverName`을 반환했으며 `canvasHostUrl`을 포함할 수 있었습니다.

## 프레임

클라이언트 → Gateway:

- `req` / `res`: 범위가 지정된 Gateway RPC(chat, sessions, config, health, voicewake, skills.bins)
- `event`: 노드 신호(음성 전사, 에이전트 요청, 채팅 구독, exec 수명 주기)

Gateway → 클라이언트:

- `invoke` / `invoke-res`: 노드 명령(`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: 구독된 세션의 채팅 업데이트
- `ping` / `pong`: keepalive

레거시 허용 목록 강제 적용은 `src/gateway/server-bridge.ts`에 있었습니다(제거됨).

## Exec 수명 주기 이벤트

노드는 system.run 활동을 표시하기 위해 `exec.finished` 또는 `exec.denied` 이벤트를 내보낼 수 있습니다.
이 이벤트는 Gateway에서 시스템 이벤트로 매핑됩니다. (레거시 노드는 여전히 `exec.started`를 내보낼 수 있습니다.)

페이로드 필드(별도 표시가 없으면 모두 선택 사항):

- `sessionKey`(필수): 시스템 이벤트를 받을 에이전트 세션.
- `runId`: 그룹화를 위한 고유 exec ID.
- `command`: 원시 또는 형식화된 명령 문자열.
- `exitCode`, `timedOut`, `success`, `output`: 완료 세부 정보(완료된 경우만).
- `reason`: 거부 이유(거부된 경우만).

## 역사적 tailnet 사용

- 브리지를 tailnet IP에 바인딩: `~/.openclaw/openclaw.json`에서
  `bridge.bind: "tailnet"`(역사적 용도만 해당, `bridge.*`는 더 이상 유효하지 않음).
- 클라이언트는 MagicDNS 이름 또는 tailnet IP를 통해 연결합니다.
- Bonjour는 네트워크를 넘지 **않습니다**. 필요한 경우 수동 호스트/포트 또는 광역 DNS-SD를 사용하세요.

## 버전 관리

브리지는 **암시적 v1**이었습니다(최소/최대 협상 없음). 이 섹션은 역사적 참고용일 뿐입니다. 현재 노드/운영자 클라이언트는 WebSocket [Gateway 프로토콜](/ko/gateway/protocol)을 사용합니다.

## 관련 항목

- [Gateway 프로토콜](/ko/gateway/protocol)
- [노드](/ko/nodes)
