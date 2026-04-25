---
read_when:
    - Node 클라이언트(iOS/Android/macOS node mode) 빌드 또는 디버깅하기
    - 페어링 또는 브리지 인증 실패 조사하기
    - Gateway가 노출하는 Node 표면 감사하기
summary: '레거시 브리지 프로토콜(legacy nodes): TCP JSONL, 페어링, 범위 지정 RPC'
title: 브리지 프로토콜
x-i18n:
    generated_at: "2026-04-25T06:00:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 15
---

<Warning>
TCP 브리지는 **제거되었습니다**. 현재 OpenClaw 빌드에는 브리지 리스너가 포함되지 않으며 `bridge.*` 구성 키도 더 이상 스키마에 존재하지 않습니다. 이 페이지는 역사적 참고용으로만 유지됩니다. 모든 node/operator 클라이언트에는 [Gateway Protocol](/ko/gateway/protocol)을 사용하세요.
</Warning>

## 존재했던 이유

- **보안 경계**: 브리지는 전체 gateway API 표면 대신 작은 허용 목록만 노출합니다.
- **페어링 + node ID**: node 승인 절차는 gateway가 소유하며 node별 토큰에 연결됩니다.
- **탐색 UX**: node는 LAN에서 Bonjour를 통해 gateway를 탐색하거나 tailnet을 통해 직접 연결할 수 있습니다.
- **루프백 WS**: 전체 WS 제어 평면은 SSH를 통해 터널링하지 않는 한 로컬에 유지됩니다.

## 전송

- TCP, 줄마다 하나의 JSON 객체(JSONL).
- 선택적 TLS (`bridge.tls.enabled`가 true일 때).
- 과거 기본 리스너 포트는 `18790`이었습니다(현재 빌드는 TCP 브리지를 시작하지 않음).

TLS가 활성화되면 탐색 TXT 레코드에는 `bridgeTls=1`과
비밀이 아닌 힌트로 `bridgeTlsSha256`이 포함되었습니다. Bonjour/mDNS TXT 레코드는
인증되지 않으므로, 클라이언트는 명시적인 사용자 의도나 다른 대역 외 검증 없이
광고된 fingerprint를 권위 있는 pin으로 취급해서는 안 됩니다.

## 핸드셰이크 + 페어링

1. 클라이언트가 node 메타데이터 + 토큰(이미 페어링된 경우)을 포함한 `hello`를 보냅니다.
2. 페어링되지 않은 경우 gateway는 `error`(`NOT_PAIRED`/`UNAUTHORIZED`)로 응답합니다.
3. 클라이언트가 `pair-request`를 보냅니다.
4. Gateway는 승인을 기다린 후 `pair-ok`와 `hello-ok`를 보냅니다.

과거에는 `hello-ok`가 `serverName`을 반환했고
`canvasHostUrl`을 포함할 수도 있었습니다.

## 프레임

클라이언트 → Gateway:

- `req` / `res`: 범위 지정 gateway RPC (`chat`, `sessions`, `config`, `health`, `voicewake`, `skills.bins`)
- `event`: node 신호(음성 transcript, agent 요청, chat 구독, exec 수명 주기)

Gateway → 클라이언트:

- `invoke` / `invoke-res`: node 명령어 (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: 구독된 세션의 chat 업데이트
- `ping` / `pong`: keepalive

레거시 허용 목록 강제 적용은 `src/gateway/server-bridge.ts`에 있었습니다(현재 제거됨).

## Exec 수명 주기 이벤트

Node는 `exec.finished` 또는 `exec.denied` 이벤트를 내보내 system.run 활동을 표시할 수 있습니다.
이들은 gateway에서 시스템 이벤트로 매핑됩니다. (레거시 node는 여전히 `exec.started`를 내보낼 수 있습니다.)

페이로드 필드(명시되지 않은 경우 모두 선택 사항):

- `sessionKey` (필수): 시스템 이벤트를 받을 agent 세션.
- `runId`: 그룹화를 위한 고유 exec ID.
- `command`: 원시 또는 포맷된 명령어 문자열.
- `exitCode`, `timedOut`, `success`, `output`: 완료 세부 정보(finished만 해당).
- `reason`: 거부 사유(denied만 해당).

## 과거 tailnet 사용 방식

- 브리지를 tailnet IP에 바인딩: `~/.openclaw/openclaw.json`에서 `bridge.bind: "tailnet"` 설정(역사적 정보 전용이며, `bridge.*`는 더 이상 유효하지 않음).
- 클라이언트는 MagicDNS 이름 또는 tailnet IP로 연결했습니다.
- Bonjour는 **네트워크를 넘지 않으므로**, 필요 시 수동 host/port 또는 광역 DNS‑SD를 사용해야 합니다.

## 버전 관리

브리지는 **암묵적 v1**이었습니다(최소/최대 협상 없음). 이 섹션은
역사적 참고용일 뿐이며, 현재 node/operator 클라이언트는 WebSocket
[Gateway Protocol](/ko/gateway/protocol)을 사용합니다.

## 관련 항목

- [Gateway protocol](/ko/gateway/protocol)
- [Nodes](/ko/nodes)
