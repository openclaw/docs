---
read_when:
    - 이전 Node 클라이언트 코드 또는 보관된 페어링 로그 조사하기
    - 레거시 Node 인터페이스에서 이전에 노출하던 항목 감사하기
summary: '과거 브리지 프로토콜(레거시 노드): TCP JSONL, 페어링, 범위가 지정된 RPC'
title: 브리지 프로토콜
x-i18n:
    generated_at: "2026-07-12T15:11:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
TCP 브리지는 **제거되었습니다**. 현재 OpenClaw 빌드에는 브리지 리스너가 포함되지 않으며, `bridge.*` 구성 키도 더 이상 스키마에 없습니다. 이 페이지는 과거 참조용으로만 제공됩니다. 모든 노드/운영자 클라이언트에는 [Gateway 프로토콜](/ko/gateway/protocol)을 사용하십시오.
</Warning>

## 존재했던 이유

- **보안 경계**: 전체 Gateway API 표면 대신 소규모 허용 목록을 노출했습니다.
- **페어링 + 노드 ID**: 노드 수락은 Gateway에서 관리했으며 노드별 토큰에 연결되었습니다.
- **검색 UX**: 노드는 LAN에서 Bonjour를 통해 Gateway를 검색하거나 tailnet을 통해 직접 연결할 수 있었습니다.
- **루프백 WS**: SSH를 통해 터널링하지 않는 한 전체 WS 제어 영역은 로컬에 유지되었습니다.

## 전송

- TCP, 줄마다 하나의 JSON 객체(JSONL).
- 선택적 TLS(`bridge.tls.enabled: true`).
- 기본 리스너 포트는 `18790`이었습니다.

TLS가 활성화된 경우 검색 TXT 레코드에는 비밀이 아닌 힌트로 `bridgeTls=1`과 `bridgeTlsSha256`이 포함되었습니다. Bonjour/mDNS TXT 레코드는 인증되지 않으므로, 클라이언트는 별도의 대역 외 검증 없이 공지된 지문을 신뢰할 수 있는 핀으로 취급할 수 없었습니다.

## 핸드셰이크 및 페어링

1. 클라이언트가 노드 메타데이터와 토큰(이미 페어링된 경우)을 포함한 `hello`를 전송합니다.
2. 페어링되지 않은 경우 Gateway가 `error`(`NOT_PAIRED` / `UNAUTHORIZED`)로 응답합니다.
3. 클라이언트가 `pair-request`를 전송합니다.
4. Gateway가 승인을 기다린 다음 `pair-ok`와 `hello-ok`를 전송합니다.

`hello-ok`는 이전에 `serverName`을 반환했습니다. 이제 호스팅되는 Plugin 표면은 현재 Gateway 프로토콜의 `pluginSurfaceUrls`를 통해 공지됩니다(Canvas/A2UI는 `pluginSurfaceUrls.canvas`를 사용합니다).

## 프레임

클라이언트에서 Gateway로:

- `req` / `res`: 범위가 제한된 Gateway RPC(채팅, 세션, 구성, 상태, 음성 깨우기, skills.bins).
- `event`: 노드 신호(음성 기록, 에이전트 요청, 채팅 구독, 실행 수명 주기).

Gateway에서 클라이언트로:

- `invoke` / `invoke-res`: 노드 명령(`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: 구독한 세션의 채팅 업데이트.
- `ping` / `pong`: 연결 유지.

허용 목록 적용은 `src/gateway/server-bridge.ts`에서 처리되었습니다(제거됨).

## 실행 수명 주기 이벤트

노드는 완료된 `system.run` 활동을 표시하기 위해 `exec.finished`를 내보냈으며, Gateway는 이를 시스템 이벤트에 매핑했습니다(레거시 노드는 `exec.started`도 내보낼 수 있었습니다). `exec.denied`는 거부된 `system.run` 시도를 시스템 이벤트를 대기열에 추가하거나 에이전트 작업을 깨우지 않고 최종 거부 상태로 표시했습니다.

페이로드 필드(별도 표기가 없으면 모두 선택 사항):

| 필드                             | 참고                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | 필수. 이벤트 상관관계 지정 및 `exec.finished`의 경우 시스템 이벤트 전송에 사용되는 에이전트 세션입니다. |
| `runId`                          | 그룹화를 위한 고유 실행 ID입니다.                                                                 |
| `command`                        | 원시 또는 형식이 지정된 명령 문자열입니다.                                                        |
| `exitCode`, `timedOut`, `output` | 완료 세부 정보입니다(완료된 경우에만 해당).                                                       |
| `reason`                         | 거부 사유입니다(거부된 경우에만 해당).                                                            |

## 과거 tailnet 사용법

- `~/.openclaw/openclaw.json`에서 `bridge.bind: "tailnet"`으로 설정하여 브리지를 tailnet IP에 바인딩했습니다(과거에만 해당하며, `bridge.*`는 더 이상 유효한 구성이 아닙니다).
- 클라이언트는 MagicDNS 이름 또는 tailnet IP를 통해 연결했습니다.
- Bonjour는 네트워크 간에 작동하지 않으므로, 그렇지 않은 경우 광역 DNS-SD 또는 수동 호스트/포트가 필요했습니다.

## 버전 관리

브리지는 최소/최대 협상 없이 암시적 v1을 사용했습니다. 현재 노드/운영자 클라이언트는 프로토콜 버전 범위를 협상하는 WebSocket [Gateway 프로토콜](/ko/gateway/protocol)을 사용합니다.

## 관련 항목

- [Gateway 프로토콜](/ko/gateway/protocol)
- [노드](/ko/nodes)
