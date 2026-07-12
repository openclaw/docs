---
read_when:
    - Gateway WS 클라이언트 구현 또는 업데이트
    - 프로토콜 불일치 또는 연결 실패 디버깅
    - 프로토콜 스키마/모델 재생성
summary: 'Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리'
title: Gateway 프로토콜
x-i18n:
    generated_at: "2026-07-12T15:20:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 프로토콜은 OpenClaw의 단일 제어 영역이자 Node 전송 계층입니다.
운영자 및 Node 클라이언트(CLI, 웹 UI, macOS 앱, iOS/Android Node,
헤드리스 Node)는 WebSocket을 통해 연결되며 핸드셰이크 시점에 **역할**과 **범위**를
선언합니다.

## 전송 및 프레이밍

- WebSocket, 텍스트 프레임, JSON 페이로드를 사용합니다.
- 첫 번째 프레임은 **반드시** `connect` 요청이어야 합니다.
- 연결 전 프레임은 64 KiB(`MAX_PREAUTH_PAYLOAD_BYTES`)로 제한됩니다. 핸드셰이크
  이후에는 `hello-ok.policy.maxPayload` 및
  `hello-ok.policy.maxBufferedBytes`를 따릅니다. 진단이 활성화된 경우 크기가
  지나치게 큰 인바운드 프레임과 느린 아웃바운드 버퍼는 Gateway가 프레임을 닫거나
  폐기하기 전에 `payload.large` 이벤트를 발생시킵니다. 이러한 이벤트에는 `surface`,
  바이트 크기, 제한 및 안전한 사유 코드가 포함되지만 메시지 본문, 첨부 파일 내용,
  원시 프레임 바이트, 토큰, 쿠키 또는 비밀은 절대 포함되지 않습니다.

프레임 형식:

- 요청: `{type:"req", id, method, params}`
- 응답: `{type:"res", id, ok, payload|error}`
- 이벤트: `{type:"event", event, payload, seq?, stateVersion?}`

부수 효과를 발생시키는 메서드에는 멱등성 키가 필요합니다(스키마 참조).

## 핸드셰이크

Gateway는 연결 전 챌린지를 전송합니다.

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

클라이언트는 `connect`로 응답합니다.

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway는 `hello-ok`로 응답합니다.

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot`, `policy`, `auth`는 모두
`HelloOkSchema`(`packages/gateway-protocol/src/schema/frames.ts`)에서 필수입니다. `auth`는
기기 토큰이 발급되지 않은 경우에도 협상된 역할/범위를 보고합니다(위 형식 참조).
`pluginSurfaceUrls`는 선택 사항이며 Plugin 표면 이름(예:
`canvas`)을 범위가 지정된 호스팅 URL에 매핑합니다. 만료될 수 있으므로 Node는 새 항목을
얻기 위해 `{ "surface": "canvas" }`와 함께 `node.pluginSurface.refresh`를 호출합니다.
지원 중단된 `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
경로는 지원되지 않습니다. Plugin 표면을 사용하십시오.

Gateway가 아직 시작 사이드카를 마무리하는 동안에는 `connect`가
`details.reason: "startup-sidecars"` 및 `retryAfterMs`와 함께 재시도 가능한
`UNAVAILABLE` 오류를 반환할 수 있습니다. 이를 최종 핸드셰이크 실패로 처리하지 말고
연결 예산 내에서 재시도하십시오.

기기 토큰이 발급되면 `hello-ok.auth`에 해당 토큰이 추가됩니다.

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

내장 QR/설정 코드 부트스트랩은 모바일 인계 경로입니다. 기본 설정 코드 연결이
성공하면 기본 Node 토큰과 제한된 운영자 토큰 하나가 반환됩니다.

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

이 운영자 인계는 의도적으로 제한되어 있습니다. Talk 구성 읽기를 위한
`operator.talk.secrets`를 포함하여 모바일 운영자 루프와 네이티브 설정을 시작하기에는
충분하지만 페어링 변경 범위와 `operator.admin`은 제공하지 않습니다. 더 광범위한
페어링/관리자 액세스에는 별도로 승인된 페어링 또는 토큰 흐름이 필요합니다.
부트스트랩 인증이 신뢰할 수 있는 전송(`wss://` 또는 루프백/로컬 페어링)을 통해
실행된 경우에만 `hello-ok.auth.deviceTokens`를 영구 저장하십시오.

신뢰할 수 있는 동일 프로세스 백엔드 클라이언트(`client.id: "gateway-client"`,
`client.mode: "backend"`)는 공유 Gateway 토큰/비밀번호로 인증하는 경우 직접 루프백
연결에서 `device`를 생략할 수 있습니다. 이 경로는 내부 제어 영역 RPC(예: 하위
에이전트 세션 업데이트) 전용이며 오래된 CLI/기기 페어링 기준선이 로컬 백엔드 작업을
차단하지 않도록 합니다. 원격, 브라우저 출처, Node 및 명시적 기기 토큰/기기 ID
클라이언트는 계속 일반 페어링 및 범위 업그레이드 검사를 거칩니다.

### 작업자 역할 및 폐쇄형 프로토콜

클라우드 작업자는 Gateway가 소유하고 호스트 키가 고정된 SSH 터널을 통해 전용
루프백 인그레스를 사용합니다. 이 인그레스는 작업자 ID만 허용하며 일반 인증, Node
이벤트, 운영자 RPC 또는 Plugin 메서드를 절대 디스패치하지 않습니다. 엄격한
`connect`는 환경, 번들 해시, 소유자 에포크, RPC 세트 버전, 만료 및 하나의 nullable
세션에 바인딩된 저장 시 해시된 단기 자격 증명을 검증하며, 현재 버전과 기능 세트를
별도로 검사합니다. 성공하면 최소한의 `worker-hello-ok`를 반환합니다. 기능 협상은
일반 프로토콜 버전과 독립적입니다. 프레임은 64 KiB 미만으로 유지됩니다. 폐쇄형
허용 목록에는 `worker.heartbeat`, `worker.transcript.commit`,
`worker.live-event`가 포함됩니다. 트랜스크립트 커밋은 소유자 에포크 펜싱,
Gateway 소유 세션 바인딩, 기본 리프 비교 후 교체 및 내구성 있는 시퀀스 재실행을
사용합니다. Gateway는 일반 세션 작성기를 통해 트랜스크립트 항목 및 상위 ID를
생성합니다. 각 RPC에서 소유권과 만료를 다시 검사합니다.

### 클라이언트 기능

운영자 클라이언트는 `connect.params.caps`에서 선택적 기능을 알릴 수 있습니다.

- `tool-events`: 구조화된 도구 수명 주기 이벤트를 수락합니다.
- `inline-widgets`: 호스팅된 인라인 위젯 도구 결과를 렌더링할 수 있습니다.

클라이언트 기능은 권한 부여가 아니라 연결된 클라이언트를 설명합니다. 에이전트 도구는
필수 기능을 선언할 수 있으며, Gateway는 모든 요구 사항이 요청을 시작한 클라이언트의
`caps`에 나타나지 않으면 해당 도구를 제외합니다. 채널에서 시작된 실행에는 Gateway
클라이언트 기능이 없으므로 도구 정책에서 명시적으로 허용하더라도 기능으로 제한된
도구를 사용할 수 없습니다.

### Node 연결 예시

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 4,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Node는 연결 시 기능 클레임을 선언합니다.

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice`, `talk`과 같은
  상위 수준 범주입니다.
- `commands`: 호출을 위한 명령 허용 목록입니다.
- `permissions`: 세부 토글입니다(예: `screen.record`, `camera.capture`).

Gateway는 이를 클레임으로 취급하고 서버 측 허용 목록을 적용합니다.

## 역할 및 범위

전체 운영자 범위 모델, 승인 시점 검사 및 공유 비밀 의미 체계는
[운영자 범위](/ko/gateway/operator-scopes)를 참조하십시오.

역할:

- `operator`: 제어 영역 클라이언트(CLI/UI/자동화)입니다.
- `node`: 기능 호스트(camera/screen/canvas/system.run)입니다.
- `worker`: 전용 폐쇄형 작업자 프로토콜의 클라우드 실행 호스트입니다.

운영자 범위(`src/gateway/operator-scopes.ts`)의 전체 폐쇄형 집합:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`가 포함된 `talk.config`에는 `operator.talk.secrets`(또는
`operator.admin`)가 필요합니다. 비밀이 포함된 경우
`talk.resolved.config.apiKey`에서 활성 Talk 제공자 자격 증명을 읽으십시오.
`talk.providers.<id>.apiKey`는 소스 형식을 유지하며 SecretRef 객체 또는 마스킹된
문자열일 수 있습니다.

Plugin이 등록한 Gateway RPC 메서드는 자체 운영자 범위를 요청할 수 있지만, 다음
예약된 코어 접두사는 항상 `operator.admin`으로 확인됩니다
(`src/shared/gateway-method-policy.ts`): `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

메서드 범위는 첫 번째 게이트일 뿐입니다. `chat.send`를 통해 접근하는 일부 슬래시
명령에는 더 엄격한 명령 수준 검사가 적용됩니다. 영구적인 `/config set` 및
`/config unset` 쓰기에는 이미 더 낮은 운영자 범위를 보유한 Gateway 클라이언트라도
`operator.admin`이 필요합니다.

`node.pair.approve`에는 보류 중인 요청이 선언한 `commands`를 기반으로 기본 메서드
범위(`operator.pairing`) 외에 승인 시점 범위 검사가 추가로 적용됩니다
(`src/infra/node-pairing-authz.ts`).

| 선언된 명령                                                   | 필수 범위                              |
| -------------------------------------------------------------- | ------------------------------------- |
| 없음                                                           | `operator.pairing`                    |
| 비실행 명령                                                    | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare` 또는 `system.which` 포함 | `operator.pairing` + `operator.admin` |

### Caps/commands/permissions(Node)

Node는 연결 시 기능 클레임을 선언합니다.

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice`, `talk`과 같은
  상위 수준 기능 범주입니다.
- `commands`: 호출을 위한 명령 허용 목록입니다.
- `permissions`: 세부 토글입니다(예: `screen.record`, `camera.capture`).

Gateway는 이를 **클레임**으로 취급하고 서버 측 허용 목록을 적용합니다.
연결된 Node는 연결 또는 재연결에 성공한 후 `node.pluginTools.update`를 사용하여
선택적으로 에이전트에 노출되는 Plugin 또는 MCP 도구 설명자를 게시할 수 있습니다.
헤드리스 Node 호스트는 선언적 MCP 인벤토리 변경 사항을 적용하기 위해 다시
시작됩니다. 이 업데이트 메서드는 유일한 게시 경로이며 Plugin 도구 설명자는
`connect` 매개변수에서 허용되지 않습니다. 각 설명자는 제공자에 안전한 도구
`name`을 사용하고 Node의 현재 명령 허용 목록에 있는 `command`를 지정해야 합니다.
Gateway는 페어링된 Node의 설명자 메타데이터를 신뢰하고, 승인된 명령 표면 외부의
설명자를 필터링하고, Node 연결이 끊어지면 이를 제거하며, 운영자가 다른 Node의
카탈로그를 변경하려는 시도를 거부합니다. Node가 게시한 설명자를 무시하려면
`gateway.nodes.pluginTools.enabled: false`로 설정하십시오.

연결된 Node 호스트는 `node.skills.update`를 사용하여 완전한 Skills 대체 카탈로그를
게시합니다. 이 Node 역할 메서드는 유일한 Node Skills 게시 경로이며 Skills는
`connect` 매개변수에서 허용되지 않습니다. 각 설명자에는 안전한 이름, 설명 및
크기가 제한된 `SKILL.md` 콘텐츠가 포함됩니다. Gateway는 일반 Skills 로더로 해당
콘텐츠를 구문 분석하고 Node가 연결된 동안 이를 에이전트 Skills 스냅샷에 포함하며
연결이 끊어지면 제거합니다. Node가 게시한 Skills를 무시하려면
`gateway.nodes.skills.enabled: false`로 설정하십시오.

## 프레즌스

- `system-presence`는 `deviceId`, `roles`, `scopes`를 포함하여 기기 ID를 키로
  사용하는 항목을 반환하므로 UI는 기기가 운영자와 Node로 모두 연결된 경우에도
  기기당 하나의 행을 표시할 수 있습니다.
- `node.list`에는 선택적 `lastSeenAtMs` 및 `lastSeenReason`이 포함됩니다. 연결된
  Node는 `connect` 사유와 함께 현재 연결 시간을 보고하며, 페어링된 Node는 신뢰할
  수 있는 Node 이벤트를 통해 지속성 있는 백그라운드 프레즌스도 보고할 수 있습니다.

네이티브 macOS Node는 입력 유휴 시간이 제한된 인증된 `node.presence.activity` 이벤트도 전송할 수 있습니다. Gateway는 자체 시계를 기준으로 활동 타임스탬프를 산출하고, `node.list`와 `node.describe`를 통해 가장 최근에 연결된 Mac을 노출하며, 읽기 범위 클라이언트에 `node.presence` 업데이트를 브로드캐스트합니다. 선택, 개인정보 보호, 모델 컨텍스트 및 알림 라우팅 동작은 [활성 컴퓨터 프레즌스](/nodes/presence)를 참조하십시오.

### Node 백그라운드 활성 이벤트

Node는 백그라운드 깨우기 중 페어링된 Node가 활성 상태였음을 연결 상태로 표시하지 않고 기록하기 위해 `event: "node.presence.alive"`와 함께 `node.event`를 호출합니다.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger`는 `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual`, `connect`로 구성된 폐쇄형 열거형입니다. 알 수 없는 값은 `background`로 정규화됩니다(`src/shared/node-presence.ts`). 이 이벤트는 인증된 Node 기기 세션에 대해서만 영구 저장됩니다. 기기가 없거나 페어링되지 않은 세션은 `handled: false`를 반환합니다.

성공한 Gateway는 구조화된 결과를 반환합니다.

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

이전 Gateway는 `node.event`에 대해 `{ "ok": true }`만 반환할 수 있습니다. 이를 지속성 있는 프레즌스 영구 저장이 아니라 승인된 RPC로 처리하십시오.

## 브로드캐스트 이벤트 범위 지정

서버가 푸시하는 브로드캐스트 이벤트에는 범위 제한이 적용되므로, 페어링 범위 또는 Node 전용 세션이 세션 콘텐츠를 수동적으로 수신하지 않습니다(`src/gateway/server-broadcast.ts`).

- 채팅, 에이전트 및 도구 결과 프레임(스트리밍되는 `agent` 이벤트, 도구 결과 이벤트)에는 최소한 `operator.read`가 필요합니다. 이 권한이 없는 세션은 이러한 프레임을 완전히 건너뜁니다.
- Plugin이 정의한 `plugin.*` 브로드캐스트는 기본적으로 `operator.write` 또는 `operator.admin`으로 제한됩니다. `plugin.approval.requested` / `plugin.approval.resolved` 같은 명시적 항목에는 대신 `operator.approvals`가 사용됩니다.
- 상태/전송 이벤트(`heartbeat`, `presence`, `tick`, 연결/연결 해제 수명 주기)는 제한 없이 유지되므로 모든 인증된 세션에서 전송 상태를 관찰할 수 있습니다.
- 등록된 핸들러가 명시적으로 제한을 완화하지 않는 한, 알 수 없는 브로드캐스트 이벤트 계열에는 기본적으로 범위 제한이 적용됩니다(실패 시 차단).

각 클라이언트 연결은 자체적인 클라이언트별 시퀀스 번호를 유지합니다. 따라서 서로 다른 클라이언트가 이벤트 스트림에서 범위에 따라 필터링된 서로 다른 하위 집합을 보더라도 해당 소켓에서 브로드캐스트 순서는 단조롭게 유지됩니다.

## RPC 메서드 계열

`hello-ok.features.methods`는 `src/gateway/server-methods-list.ts`와 로드된 Plugin/채널 메서드 내보내기를 기반으로 작성되는 보수적인 검색 목록입니다. 모든 메서드를 생성하여 덤프한 목록이 아니며, 일부 메서드(예: `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)는 실제 호출 가능한 메서드임에도 의도적으로 검색 대상에서 제외됩니다. 이를 `src/gateway/server-methods/*.ts`의 전체 열거가 아니라 기능 검색 수단으로 취급하십시오.

<AccordionGroup>
  <Accordion title="시스템 및 ID">
    - `health`는 캐시되었거나 새로 검사한 Gateway 상태 스냅샷을 반환합니다.
    - `diagnostics.stability`는 이벤트 이름, 개수, 바이트 크기, 메모리 측정값, 대기열/세션 상태, 채널/Plugin 이름 및 세션 ID가 포함된 최근의 제한된 진단 안정성 기록을 반환합니다. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청/응답 본문, 토큰, 쿠키 또는 비밀은 포함되지 않습니다. `operator.read`가 필요합니다.
    - `status`는 `/status` 형식의 Gateway 요약을 반환합니다. 민감한 필드는 관리자 범위 운영자 클라이언트에만 제공됩니다.
    - `gateway.identity.get`은 릴레이 및 페어링 흐름에서 사용하는 Gateway 기기 ID를 반환합니다.
    - `system-presence`는 연결된 운영자/Node 기기의 현재 프레즌스 스냅샷을 반환합니다.
    - `system-event`는 시스템 이벤트를 추가하며 프레즌스 컨텍스트를 업데이트하거나 브로드캐스트할 수 있습니다.
    - `last-heartbeat`는 최근에 영구 저장된 Heartbeat 이벤트를 반환합니다.
    - `set-heartbeats`는 Gateway에서 Heartbeat 처리를 전환합니다.
    - `gateway.suspend.prepare`는 추적 중인 Gateway 작업이 유휴 상태일 때만 짧은 협력적 일시 중단 임대를 생성합니다. `gateway.suspend.status`는 해당 임대를 확인하고, `gateway.suspend.resume`은 재개 후 또는 호스트 작업이 중단된 후 이를 해제합니다.

  </Accordion>

  <Accordion title="모델 및 사용량">
    - `models.list`는 런타임에서 허용된 모델 카탈로그를 반환합니다. 아래의 "`models.list` 보기"를 참조하십시오.
    - `usage.status`는 제공자 사용량 기간/잔여 할당량 요약을 반환합니다.
    - `usage.cost`는 날짜 범위에 대해 집계된 비용 사용량 요약을 반환합니다. 에이전트 하나에는 `agentId`를 전달하고, 구성된 에이전트를 집계하려면 `agentScope: "all"`을 전달하십시오.
    - `doctor.memory.status`는 활성 기본 에이전트 워크스페이스의 벡터 메모리/캐시된 임베딩 준비 상태를 반환합니다. 명시적으로 실시간 임베딩 제공자에 ping을 보낼 때만 `{ "probe": true }` 또는 `{ "deep": true }`를 전달하십시오. Dreaming 저장소 통계를 에이전트 워크스페이스 하나로 제한하려면 `{ "agentId": "agent-id" }`를 전달하십시오. 생략하면 구성된 Dreaming 워크스페이스를 집계합니다.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, `doctor.memory.dedupeDreamDiary`는 선택적 `{ "agentId": "agent-id" }`를 허용합니다. 생략하면 구성된 기본 에이전트 워크스페이스에서 작동합니다.
    - `doctor.memory.remHarness`는 원격 제어 플레인 클라이언트용으로 제한된 읽기 전용 REM 하네스 미리 보기를 반환하며, 여기에는 워크스페이스 경로, 메모리 스니펫, 렌더링된 근거 기반 Markdown 및 심층 승격 후보가 포함됩니다. `operator.read`가 필요합니다.
    - `sessions.usage`는 세션별 사용량 요약을 반환합니다. 에이전트 하나에는 `agentId`를 전달하고, 구성된 에이전트를 함께 나열하려면 `agentScope: "all"`을 전달하십시오.
      두 사용량 메서드 모두 DST를 인식하는 달력 날짜 경계 및 버킷에 대해 IANA `timeZone`과 함께 `mode: "specific"`을 허용합니다. 이전 클라이언트와 Gateway 런타임이 요청된 시간대를 인식하지 못하는 경우를 위한 대체 수단으로 `utcOffset`도 계속 지원됩니다.
    - `sessions.usage.timeseries`는 세션 하나의 시계열 사용량을 반환합니다.
    - `sessions.usage.logs`는 세션 하나의 사용량 로그 항목을 반환합니다.

  </Accordion>

  <Accordion title="채널 및 로그인 도우미">
    - `channels.status`는 내장 및 번들 채널/Plugin 상태 요약을 반환합니다.
    - `channels.logout`은 채널이 지원하는 경우 특정 채널/계정에서 로그아웃합니다.
    - `web.login.start`는 현재 QR 지원 웹 채널 제공자의 QR/웹 로그인 흐름을 시작합니다.
    - `web.login.wait`는 해당 흐름이 완료되기를 기다리고, 성공하면 채널을 시작합니다.
    - `push.test`는 등록된 iOS Node에 테스트 APNs 푸시를 전송합니다.
    - `voicewake.get`은 저장된 깨우기 단어 트리거를 반환합니다.
    - `voicewake.set`은 깨우기 단어 트리거를 업데이트하고 변경 사항을 브로드캐스트합니다.

  </Accordion>

  <Accordion title="Plugin 관리">
    - `plugins.list`(`operator.read`)는 설치된 Plugin 인벤토리, 로컬에서 선별한 공식 추천 항목, 진단 정보 및 현재 설치 모드에서 변경이 허용되는지를 반환합니다.
    - `plugins.search`(`operator.read`)는 설치 가능한 ClawHub 코드 Plugin 및 번들 Plugin 계열을 검색합니다. 비어 있지 않은 `query`와 선택적 `limit`(1~100)을 전달하십시오.
    - `plugins.install`(`operator.admin`)은 `{ source: "official", pluginId }`를 사용하여 공식 카탈로그 항목을 설치하거나 `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`를 사용하여 ClawHub 패키지를 설치합니다. ClawHub 설치는 Gateway 신뢰, 무결성 및 설치 정책 검사를 유지합니다. 설치가 성공하면 Gateway를 다시 시작해야 합니다.
    - `plugins.setEnabled`(`operator.admin`)는 `{ pluginId, enabled }`를 사용하여 설치된 Plugin 하나의 활성화 정책을 변경합니다. 응답에는 업데이트된 카탈로그 항목, 다시 시작 메타데이터 및 슬롯 선택 경고가 포함됩니다.
    - `plugins.uninstall`(`operator.admin`)은 `{ pluginId }`를 사용하여 외부에 설치된 Plugin 하나의 구성 참조, 설치 기록 및 관리 파일을 제거합니다. 번들 Plugin은 제거할 수 없고 비활성화만 할 수 있습니다. 응답에는 제거 작업이 나열되며 항상 Gateway를 다시 시작해야 합니다.

  </Accordion>

  <Accordion title="메시징 및 로그">
    - `send`는 채팅 실행기 외부에서 채널/계정/스레드 대상으로 직접 발신 전달을 수행하는 RPC입니다.
    - `logs.tail`은 커서/제한 및 최대 바이트 제어와 함께 구성된 Gateway 파일 로그의 마지막 부분을 반환합니다.

  </Accordion>

  <Accordion title="운영자 터미널">
    - `terminal.open`은 명시적인 `agentId` 또는 기본 에이전트에 대해 호스트 PTY를 시작하고, 확인된 에이전트, 작업 디렉터리, 셸 및 제한 상태를 반환합니다.
    - `terminal.input`, `terminal.resize`, `terminal.close`는 호출한 연결이 소유한 세션에서만 작동합니다.
    - `terminal.data` 및 `terminal.exit` 이벤트는 세션을 소유한 연결로만 스트리밍됩니다.
    - 연결이 끊어진 세션은 종료되지 않고 분리됩니다. 최근 출력이 제한된 서버 측 버퍼에 누적되는 동안 `gateway.terminal.detachedSessionTimeoutSeconds`(기본값 300, `0`은 연결 해제 시 종료 동작 복원) 동안 다시 연결할 수 있습니다.
    - `terminal.list`는 연결 가능한 세션을 반환합니다. `terminal.attach`는 활성 또는 분리된 세션을 호출한 연결에 다시 바인딩하고 재생 버퍼를 반환합니다(tmux 방식의 인계 — 이전 활성 소유자는 사유가 `detached`인 `terminal.exit`를 수신합니다). `terminal.text`는 연결하지 않고 버퍼를 일반 텍스트로 읽습니다.
    - 모든 터미널 메서드에는 `operator.admin`이 필요하며, `gateway.terminal.enabled`를 명시적으로 true로 설정해야 합니다. 완전히 샌드박스 처리된 에이전트는 거부되며, 에이전트 정책이 변경되면 분리된 PTY를 포함하여 기존 및 진행 중인 PTY가 종료됩니다.

  </Accordion>

  <Accordion title="Talk 및 TTS">
    - `talk.catalog`는 음성, 스트리밍 전사 및 실시간 음성을 위한 읽기 전용 Talk 제공자 카탈로그를 반환합니다. 여기에는 표준 제공자 ID, 레지스트리 별칭, 레이블, 구성 상태, 선택적인 그룹 수준 `ready` 결과, 노출된 모델/음성 ID, 표준 모드, 전송 방식, 브레인 전략 및 실시간 오디오/기능 플래그가 포함되며, 제공자 시크릿을 반환하거나 전역 구성을 변경하지 않습니다. 현재 Gateway는 런타임 제공자 선택을 적용한 후 `ready`를 설정합니다. 이전 Gateway에서 이 값이 없으면 검증되지 않은 것으로 간주하십시오.
    - `talk.config`는 유효한 Talk 구성 페이로드를 반환합니다. `includeSecrets`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.
    - `talk.session.create`는 `realtime/gateway-relay`, `transcription/gateway-relay` 또는 `stt-tts/managed-room`을 위한 Gateway 소유 Talk 세션을 생성합니다. `stt-tts/managed-room`에서 `sessionKey`를 전달하는 `operator.write` 호출자는 범위가 지정된 세션 키 가시성을 위해 `spawnedBy`도 전달해야 합니다. 범위가 지정되지 않은 `sessionKey` 생성과 `brain: "direct-tools"`에는 `operator.admin`이 필요합니다.
    - `talk.session.join`은 관리형 룸 세션 토큰을 검증하고 필요에 따라 `session.ready` 또는 `session.replaced`를 내보내며, 평문 토큰이나 해당 해시는 절대 반환하지 않고 룸/세션 메타데이터와 최근 Talk 이벤트를 반환합니다.
    - `talk.session.appendAudio`는 Gateway 소유 실시간 릴레이 및 전사 세션에 base64 PCM 입력 오디오를 추가합니다.
    - `talk.session.startTurn`, `talk.session.endTurn` 및 `talk.session.cancelTurn`은 상태를 지우기 전에 오래된 턴을 거부하면서 관리형 룸 턴 수명 주기를 구동합니다.
    - `talk.session.cancelOutput`은 주로 Gateway 릴레이 세션에서 VAD로 제어되는 끼어들기를 위해 어시스턴트 오디오 출력을 중지합니다.
    - `talk.session.submitToolResult`는 Gateway 소유 실시간 릴레이 세션에서 제공자가 내보낸 도구 호출을 완료합니다. 요청은 제공자 브리지가 노출하는 모든 비동기 완료 신호를 기다립니다. 제출이 실패하면 연결된 실행이 활성 상태로 유지되며 성공적인 도구 결과 이벤트를 내보내지 않습니다. 중간 도구 출력에는 `options: { willContinue: true }`를 전달하고, 제공자 브리지가 억제 지원을 알리며 결과가 또 다른 응답을 시작하지 않아야 할 때는 `options: { suppressResponse: true }`를 전달하십시오.
    - `talk.session.steer`는 Gateway 소유의 에이전트 기반 Talk 세션에 활성 실행 음성 제어를 전송합니다. 형식은 `{ sessionId, text, mode? }`이며, `mode`는 `status`, `steer`, `cancel` 또는 `followup`입니다. 모드를 생략하면 발화 텍스트를 기준으로 분류됩니다.
    - `talk.session.close`는 Gateway 소유 릴레이, 전사 또는 관리형 룸 세션을 닫고 종료 Talk 이벤트를 내보냅니다.
    - `talk.mode`는 WebChat/Control UI 클라이언트의 현재 Talk 모드 상태를 설정하고 브로드캐스트합니다.
    - `talk.client.create`는 Gateway가 구성, 자격 증명, 지침 및 도구 정책을 소유하는 동안 `webrtc` 또는 `provider-websocket`을 사용하여 클라이언트 소유 실시간 제공자 세션을 생성합니다.
    - `talk.client.toolCall`을 사용하면 클라이언트 소유 실시간 전송 계층이 제공자 도구 호출을 Gateway 정책으로 전달할 수 있습니다. 최초로 지원되는 도구는 `openclaw_agent_consult`입니다. 클라이언트는 실행 ID를 받고 정상적인 채팅 수명 주기 이벤트를 기다린 후 제공자별 도구 결과를 제출합니다.
    - `talk.client.steer`는 클라이언트 소유 실시간 전송 계층의 활성 실행 음성 제어를 전송합니다. Gateway는 `sessionKey`에서 활성 임베디드 실행을 확인하고 조정 요청을 아무 알림 없이 폐기하는 대신 구조화된 수락/거부 결과를 반환합니다.
    - `talk.event`는 실시간, 전사, STT/TTS, 관리형 룸, 전화 통신 및 회의 어댑터를 위한 단일 Talk 이벤트 채널입니다.
    - `talk.speak`는 활성 Talk 음성 제공자를 통해 음성을 합성합니다.
    - `tts.status`는 TTS 활성화 상태, 활성 제공자, 대체 제공자 및 제공자 구성 상태를 반환합니다.
    - `tts.providers`는 표시되는 TTS 제공자 목록을 반환합니다.
    - `tts.enable` 및 `tts.disable`은 TTS 환경설정 상태를 전환합니다.
    - `tts.setProvider`는 선호하는 TTS 제공자를 업데이트합니다.
    - `tts.convert`는 일회성 텍스트 음성 변환을 실행합니다.
    - `tts.speak`(`operator.write`)는 구성된 일반 TTS 제공자 체인을 사용하여 비어 있지 않은 `text`를 렌더링하고, 하나의 전체 클립을 `audioBase64`로 인라인 반환하며, `provider`와 선택적인 `outputFormat`, `mimeType` 및 `fileExtension` 메타데이터도 함께 반환합니다. `tts.convert`와 달리 Gateway 로컬 경로를 반환하지 않으며, `talk.speak`와 달리 Talk 제공자가 필요하지 않습니다. `messages.tts.maxTextLength`를 초과하는 텍스트는 `INVALID_REQUEST`를 반환하고, 합성 실패는 `UNAVAILABLE`을 반환합니다.

  </Accordion>

  <Accordion title="시크릿, 구성, 업데이트 및 마법사">
    - `secrets.reload`는 활성 SecretRef를 다시 확인하고 완전히 성공한 경우에만 런타임 시크릿 상태를 교체합니다.
    - `secrets.resolve`는 특정 명령/대상 집합에 대한 명령 대상 시크릿 할당을 확인합니다.
    - `config.get`은 현재 구성 스냅샷과 해시를 반환합니다.
    - `config.set`은 검증된 구성 페이로드를 기록합니다.
    - `config.patch`는 부분 구성 업데이트를 병합합니다. 파괴적인 배열 교체를 수행하려면 영향을 받는 경로가 `replacePaths`에 있어야 합니다. 배열 항목 아래의 중첩 배열은 `agents.list[].skills`와 같은 `[]` 경로를 사용합니다.
    - `config.apply`는 전체 구성 페이로드를 검증하고 교체합니다.
    - `config.schema`는 Control UI 및 CLI 도구에서 사용하는 실시간 구성 스키마 페이로드를 반환합니다. 여기에는 스키마, `uiHints`, 버전, 생성 메타데이터, 그리고 로드할 수 있는 경우 Plugin 및 채널 스키마 메타데이터가 포함됩니다. 일치하는 필드 문서가 존재하는 경우 중첩 객체, 와일드카드, 배열 항목 및 `anyOf` / `oneOf` / `allOf` 구성 분기를 포함하여 UI와 동일한 레이블/도움말 텍스트의 `title` / `description` 메타데이터도 포함됩니다.
    - `config.schema.lookup`은 하나의 구성 경로에 대해 경로 범위가 지정된 조회 페이로드를 반환합니다. 여기에는 정규화된 경로, 얕은 스키마 노드, 일치하는 힌트와 `hintPath`, 선택적 `reloadKind`, UI/CLI 상세 탐색을 위한 직계 하위 항목 요약이 포함됩니다. `reloadKind`는 `restart`, `hot` 또는 `none`(`src/config/schema.ts`) 중 하나이며 요청된 경로에 대한 Gateway 구성 다시 로드 플래너와 동일하게 동작합니다. 조회 스키마 노드는 사용자용 문서와 일반적인 검증 필드(`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, 숫자/문자열/배열/객체 범위, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`)를 유지합니다. 하위 항목 요약은 `key`, 정규화된 `path`, `type`, `required`, `hasChildren`, 선택적 `reloadKind`, 그리고 일치하는 `hint` / `hintPath`를 노출합니다.
    - `update.run`은 Gateway 업데이트 흐름을 실행하며 업데이트가 성공한 경우에만 재시작을 예약합니다. 세션이 있는 호출자는 `continuationMessage`를 포함하여 시작 시 재시작 연속 처리 큐를 통해 후속 에이전트 턴 하나를 재개할 수 있습니다. 제어 영역에서 실행하는 패키지 관리자 업데이트와 감독되는 git 체크아웃 업데이트는 라이브 Gateway 내부에서 패키지 트리를 교체하거나 체크아웃/빌드 출력을 변경하는 대신 분리된 관리형 서비스 핸드오프를 사용합니다. 시작된 핸드오프는 `result.reason: "managed-service-handoff-started"` 및 `handoff.status: "started"`와 함께 `ok: true`를 반환합니다. 사용할 수 없거나 실패한 핸드오프는 `managed-service-handoff-unavailable` 또는 `managed-service-handoff-failed`와 함께 `ok: false`를 반환하며, 수동 셸 업데이트가 필요한 경우 `handoff.command`도 반환합니다. 사용할 수 없음은 OpenClaw에 systemd의 `OPENCLAW_SYSTEMD_UNIT`과 같은 안전한 감독자 경계 또는 지속적인 서비스 ID가 없음을 의미합니다. 핸드오프가 시작되는 동안 재시작 센티널이 잠시 `stats.reason: "restart-health-pending"`을 보고할 수 있습니다. CLI가 재시작된 Gateway를 검증하고 최종 `ok` 센티널을 기록할 때까지 연속 처리는 지연됩니다.
    - `update.status`는 최신 업데이트 재시작 센티널을 새로 고쳐 반환하며, 가능한 경우 재시작 후 실행 중인 버전도 포함합니다.
    - `wizard.start`, `wizard.next`, `wizard.status` 및 `wizard.cancel`은 WS RPC를 통해 온보딩 마법사를 노출합니다.

  </Accordion>

  <Accordion title="에이전트 및 워크스페이스 도우미">
    - `agents.list`는 유효한 모델 및 런타임 메타데이터를 포함하여 구성된 에이전트 항목을 반환합니다.
    - `agents.create`, `agents.update` 및 `agents.delete`는 에이전트 레코드와 워크스페이스 연결을 관리합니다.
    - `agents.files.list`, `agents.files.get` 및 `agents.files.set`은 에이전트에 노출되는 부트스트랩 워크스페이스 파일을 관리합니다.
    - `audit.activity.list`는 버전이 지정된 메타데이터 전용 활동 원장을 반환합니다. `audit.list`는 호환성이 보장되는 실행/도구 RPC로 유지됩니다.
    - `agents.workspace.list` 및 `agents.workspace.get`(`operator.read`)은 [운영자 범위](/ko/gateway/operator-scopes)에 설명된 신뢰할 수 있는 운영자 도메인의 클라이언트가 에이전트의 워크스페이스 디렉터리를 읽기 전용으로 페이지를 나누어 탐색할 수 있도록 합니다. 요청은 워크스페이스 상대 경로만 허용합니다. 읽기는 실제 경로로 확인된 워크스페이스 루트 내부로 제한되고(심볼릭 링크 및 하드 링크를 통한 이탈은 거부됨), 크기 제한이 적용되며, UTF-8 텍스트와 일반적인 이미지 유형(base64)으로 한정됩니다. 응답은 호스트 워크스페이스 경로를 노출하지 않습니다. 이 네임스페이스에는 쓰기 작업이 없습니다.
    - `tasks.list`, `tasks.get` 및 `tasks.cancel`은 SDK 및 운영자 클라이언트에 Gateway 작업 원장을 노출합니다. 아래의 [작업 원장 RPC](#task-ledger-rpcs)를 참조하십시오.
    - `artifacts.list`, `artifacts.get` 및 `artifacts.download`는 명시적인 `sessionKey`, `runId` 또는 `taskId` 범위에 대해 트랜스크립트에서 파생된 아티팩트 요약과 다운로드를 노출합니다. 실행 및 작업 쿼리는 서버 측에서 소유 세션을 확인하며 출처가 일치하는 트랜스크립트 미디어만 반환합니다. 안전하지 않거나 로컬인 URL 소스는 서버 측에서 가져오는 대신 지원되지 않는 다운로드를 반환합니다.
    - `environments.list` 및 `environments.status`는 Gateway 로컬 및 Node 환경 검색을 유지합니다. 구성된 클라우드 워커와 이전 프로필이 남긴 지속 레코드는 `providerId`, 선택적 `leaseId`, `state`, `ageMs`, 선택적 `idleMs` 및 `attachedSessionIds`가 포함된 `worker` 메타데이터를 추가합니다. 워커 수명 주기 상태는 `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` 및 `orphaned`입니다.
    - `environments.create`(`{ profileId, idempotencyKey }`)는 구성된 Plugin 제공자 프로필에서 워커를 프로비저닝합니다. 동일한 키로 재시도하면 지속 작업을 재사용합니다. `environments.destroy`(`{ environmentId }`)는 지속 워커 환경의 멱등적 해제를 요청합니다. 둘 다 `operator.admin`이 필요하고 제어 영역 쓰기 작업이며, 상태 응답에서 사용하는 것과 동일한 환경 요약 형식을 반환합니다.
    - `agent.identity.get`은 에이전트 또는 세션의 유효한 어시스턴트 ID를 반환합니다.
    - `agent.wait`는 실행이 완료될 때까지 기다리고, 가능한 경우 종료 스냅샷을 반환합니다.

  </Accordion>

  <Accordion title="세션 제어">
    - `sessions.list`는 현재 세션 인덱스를 반환하며, 에이전트 런타임 백엔드가 구성된 경우 행별 `agentRuntime` 메타데이터도 포함합니다.
    - `sessions.subscribe`와 `sessions.unsubscribe`는 현재 WS 클라이언트의 세션 변경 이벤트 구독을 전환합니다.
    - `sessions.messages.subscribe`와 `sessions.messages.unsubscribe`는 한 세션의 트랜스크립트/메시지 이벤트 구독을 전환합니다. `includeApprovals: true`를 전달하면 영구 저장된 대상에 해당 세션이 정확히 포함되고 검토자 바인딩이 구독 클라이언트를 승인하는 승인에 대해 정제된 `session.approval` 수명 주기 이벤트도 수신합니다. 그러면 구독 응답에는 크기가 제한된 대기 중 `approvalReplay`가 포함되며, `truncated`가 false일 때 이를 신뢰할 수 있는 기준으로 간주합니다. 이 옵트인은 구독 호출별로 적용되며 지속되지 않습니다. `includeApprovals: true` 없이 동일한 세션을 다시 구독하면 기존 승인 구독이 제거됩니다. 일반적인 세션 읽기 권한 외에도 이 옵트인에는 `operator.admin` 또는 페어링된 기기의 `operator.approvals`가 필요합니다.
    - `sessions.preview`는 특정 세션 키에 대해 크기가 제한된 트랜스크립트 미리 보기를 반환합니다.
    - `sessions.describe`는 정확한 세션 키에 해당하는 하나의 Gateway 세션 행을 반환합니다.
    - `sessions.resolve`는 세션 대상을 확인하거나 정규화합니다.
    - `sessions.create`는 새 세션 항목을 생성합니다. `worktree: true`는 관리형 worktree를 프로비저닝합니다. 선택적 `worktreeBaseRef`/`worktreeName`은 기준 ref와 브랜치 이름을 선택하며, `execNode`(`operator.admin`)는 세션 실행을 Node 호스트에 바인딩합니다. 생성된 worktree는 결과에 그대로 반환되고 세션 행에 영구 저장됩니다(`worktree: { id, branch, repoRoot }`). 항목은 생성되었지만 중첩된 초기 `chat.send`가 거부된 경우, 성공 결과에 `runStarted: false`와 `runError`가 포함됩니다. 클라이언트는 프롬프트를 보존하고 반환된 세션 키로 다시 시도할 수 있습니다.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, `sessions.groups.delete`는 Gateway가 소유하는 사용자 지정 세션 그룹 카탈로그(이름 + 표시 순서)를 관리합니다. 멤버십은 각 세션의 `category` 필드에 유지되며, 이름 변경과 삭제는 서버 측에서 멤버 세션을 업데이트합니다.
    - `sessions.send`는 기존 세션에 메시지를 전송합니다.
    - `sessions.steer`는 활성 세션을 중단하고 방향을 조정하는 변형입니다.
    - `sessions.abort`는 세션의 활성 작업을 중단합니다. `key`와 선택적 `runId`를 전달하거나, Gateway가 세션으로 확인할 수 있는 활성 실행의 경우 `runId`만 전달합니다.
    - `sessions.patch`는 세션 메타데이터/재정의를 업데이트하고 확인된 정규 모델과 유효한 `agentRuntime`을 보고합니다.
    - `sessions.reset`, `sessions.delete`, `sessions.compact`는 세션 유지 관리를 수행합니다.
    - `sessions.get`은 저장된 전체 세션 행을 반환합니다.
    - 채팅 실행에서는 계속 `chat.history`, `chat.send`, `chat.abort`, `chat.inject`를 사용합니다. `chat.history`는 UI 클라이언트용으로 표시 정규화됩니다. 즉, 표시되는 텍스트에서 인라인 지시문 태그를 제거하고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록)와 유출된 ASCII/전각 모델 제어 토큰을 제거하며, 완전히 무응답 토큰으로만 구성된 어시스턴트 행(정확히 `NO_REPLY` / `no_reply`)을 생략하고, 크기가 지나치게 큰 행은 자리표시자로 대체할 수 있습니다.
    - `chat.message.get`은 표시되는 단일 트랜스크립트 항목의 전체 메시지를 크기 제한 내에서 읽는 추가형 리더입니다. `sessionKey`, 세션 선택이 에이전트 범위로 제한되는 경우 선택적 `agentId`, 그리고 이전에 `chat.history`를 통해 노출된 트랜스크립트 `messageId`를 전달합니다. 저장된 항목을 여전히 사용할 수 있고 크기가 지나치게 크지 않으면 Gateway는 경량 기록 잘림 제한 없이 동일하게 표시 정규화된 프로젝션을 반환합니다.
    - `chat.toolTitles`는 Control UI에 렌더링되는 도구 호출의 짧은 목적 제목을 반환합니다(일괄 처리, 크기가 제한된 입력으로 최대 24개 항목). 이 기능은 `gateway.controlUi.toolTitles`를 통해 옵트인합니다(기본값은 꺼짐). 비활성화된 Gateway는 모델을 호출하지 않고 `{ titles: {}, disabled: true }`로 응답하므로 클라이언트가 요청을 중지합니다. 활성화된 경우 제목은 표준 유틸리티 모델 라우팅을 사용합니다. 명시적으로 구성된 `utilityModel`(모든 유틸리티 작업과 마찬가지로 크기가 제한된 작업 콘텐츠를 선택한 제공자에게 전송할 수 있는 운영자 결정)을 사용하며, 없으면 암묵적으로 새로운 외부 전송 대상이 생기지 않도록 세션 제공자가 선언한 소형 모델 기본값을 사용합니다. 빈 `utilityModel`은 제목을 완전히 비활성화합니다. 제목은 기본 모델로 절대 폴백하지 않습니다. 결과는 도구 이름 + 입력을 키로 하여 에이전트별 상태 데이터베이스에 캐시되므로 반복 조회 시 동일한 호출에 다시 요금이 부과되지 않습니다.
    - `chat.send`는 자동 제한 시점 전에 시작된 모델 호출에 빠른 모드를 사용한 다음, 이후의 재시도, 폴백, 도구 결과 또는 연속 호출을 빠른 모드 없이 시작하도록 단일 턴 `fastMode: "auto"`를 허용합니다. 제한 시점의 기본값은 60초(`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`)이며 모델별로 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`를 사용해 구성할 수 있습니다. `chat.send` 호출자는 단일 턴 `fastAutoOnSeconds`를 전달하여 해당 요청의 제한 시점을 재정의할 수 있습니다.

  </Accordion>

  <Accordion title="기기 페어링 및 기기 토큰">
    - `device.pair.list`는 대기 중이거나 승인된 페어링 기기를 반환합니다.
    - `device.pair.setupCode`는 모바일 설정 코드를 생성하며, 기본적으로 PNG QR 데이터 URL도 생성합니다. `operator.admin`이 필요하며 의도적으로 공개 디스커버리에서 제외됩니다. 결과에는 `setupCode`, 선택적 `qrDataUrl`, `gatewayUrl`, 비밀이 아닌 `auth` 레이블 및 `urlSource`가 포함됩니다.
    - `device.pair.approve`, `device.pair.reject`, `device.pair.remove`는 기기 페어링 레코드를 관리합니다.
    - `device.pair.rename`은 클라이언트가 보고한 표시 이름보다 우선하며 기기 복구 또는 재승인 후에도 유지되는 운영자 레이블(`{ deviceId, label }`)을 할당합니다.
    - `device.token.rotate`는 승인된 역할 및 호출자 범위 제한 내에서 페어링된 기기 토큰을 교체합니다.
    - `device.token.revoke`는 승인된 역할 및 호출자 범위 제한 내에서 페어링된 기기 토큰을 폐기합니다.

    설정 코드에는 수명이 짧은 부트스트랩 자격 증명이 포함됩니다. 클라이언트는
    페어링 흐름 이후에 이를 기록하거나 영구 저장해서는 안 됩니다.

  </Accordion>

  <Accordion title="Node 페어링, 호출 및 대기 중인 작업">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`는 Node 기능 승인을 다룹니다. `node.pair.request`와 `node.pair.verify`는 독립형 Node 페어링 저장소와 함께 2026.7에서 제거되었습니다. 대기 중인 요청은 Node 연결 중 Gateway가 생성합니다.
    - `node.list`와 `node.describe`는 알려진/연결된 Node 상태를 반환합니다.
    - `node.rename`은 페어링된 Node 레이블을 업데이트합니다.
    - `node.invoke`는 연결된 Node로 명령을 전달합니다.
    - `node.invoke.result`는 호출 요청의 결과를 반환합니다.
    - `mcp.tools.call.v1`은 구성된 Node 로컬 MCP 도구를 호출하는 헤드리스 Node 호스트 명령입니다. `node.invoke`를 통해 전달되며, Node가 해당 명령을 선언해야 하고, 계속해서 페어링 승인과 `gateway.nodes.denyCommands`의 적용을 받습니다.
    - `node.event`는 Node에서 발생한 이벤트를 Gateway로 다시 전달합니다.
    - `node.pluginTools.update`는 연결된 Node의 에이전트 표시용 Plugin/MCP 도구 설명자를 대체하는 유일한 게시 경로입니다. `connect` 매개변수는 이를 전달하지 않습니다.
    - `node.pending.pull`과 `node.pending.ack`은 연결된 Node의 큐 API입니다.
    - `node.pending.enqueue`와 `node.pending.drain`은 오프라인/연결 해제된 Node의 지속성 있는 대기 작업을 관리합니다.

  </Accordion>

  <Accordion title="승인 계열">
    - `approval.get`과 `approval.resolve`는 종류와 무관한 지속성 승인 메서드입니다(범위 `operator.approvals`). `approval.get`은 안정적인 `urlPath`가 포함된 정제된 대기 중 또는 보존된 종료 프로젝션을 반환합니다. `approval.resolve`는 정규 승인 ID, 명시적 `kind`, 결정을 받아 최초 응답 우선 해결을 적용하고 항상 기록된 정규 결과를 반환합니다.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve`는 일회성 실행 승인 요청과 대기 중인 승인 조회/재생을 다룹니다. 동일한 지속성 승인 레지스트리 위에 있는 프로토콜 경계 어댑터입니다.
    - `exec.approval.waitDecision`은 대기 중인 실행 승인 하나를 기다리고 최종 결정(시간 초과 시 `null`)을 반환합니다.
    - `exec.approvals.get`과 `exec.approvals.set`은 Gateway 실행 승인 정책 스냅샷을 관리합니다.
    - `exec.approvals.node.get`과 `exec.approvals.node.set`은 Node 릴레이 명령을 통해 Node 로컬 실행 승인 정책을 관리합니다.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve`는 Plugin이 정의한 승인 흐름을 다룹니다.

  </Accordion>

  <Accordion title="자동화, Skills 및 도구">
    - 자동화: `wake`는 즉시 또는 다음 Heartbeat에 깨우기 텍스트를 주입하도록 예약합니다. `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs`는 예약된 작업을 관리합니다.
    - `cron.run`은 수동 실행을 위한 큐 등록 방식 RPC로 유지됩니다. 완료 의미 체계가 필요한 클라이언트는 반환된 `runId`를 읽고 `cron.runs`를 폴링해야 합니다.
    - `cron.runs`는 선택적인 비어 있지 않은 `runId` 필터를 허용하므로 클라이언트가 동일 작업의 다른 기록 항목과 경합하지 않고 큐에 등록된 수동 실행 하나를 추적할 수 있습니다.
    - Skills 및 도구: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. 아래의 [운영자 도우미 메서드](#operator-helper-methods)를 참조하십시오.

  </Accordion>
</AccordionGroup>

### 공통 이벤트 계열

- `chat`: `chat.inject` 및 기타 트랜스크립트 전용 채팅
  이벤트와 같은 UI 채팅 업데이트입니다. 프로토콜 v4에서 델타 페이로드는 `deltaText`를 전달하며,
  `message`는 누적 어시스턴트 스냅샷으로 유지됩니다. 접두사가 아닌 교체는
  `replace=true`를 설정하고 `deltaText`를 교체 텍스트로 사용합니다.
- `session.message`, `session.operation`, `session.tool`: 구독한 세션의 트랜스크립트, 진행 중인
  세션 작업 및 이벤트 스트림 업데이트입니다.
- `session.approval`: 명시적으로 옵트인한 정확한 세션 구독자를 위한 정제된 대기 중 및 종료
  승인 정보입니다. 하위 승인은 영구 저장된 상위 대상 범위를 사용하며, 이벤트는 트랜스크립트를 변경하거나 에이전트를 깨우지 않습니다.
- `sessions.changed`: 세션 인덱스 또는 메타데이터가 변경되었습니다.
- `presence`: 시스템 프레즌스 스냅샷 업데이트입니다.
- `tick`: 주기적인 연결 유지/활성 상태 이벤트입니다.
- `health`: Gateway 상태 스냅샷 업데이트입니다.
- `heartbeat`: Heartbeat 이벤트 스트림 업데이트입니다.
- `cron`: Cron 실행/작업 변경 이벤트입니다.
- `shutdown`: Gateway 종료 알림입니다.
- `node.pair.requested` / `node.pair.resolved`: Node 페어링 수명 주기입니다.
- `node.invoke.request`: Node 호출 요청 브로드캐스트입니다.
- `device.pair.requested` / `device.pair.resolved`: 페어링된 기기 수명 주기입니다.
- `voicewake.changed`: 깨우기 단어 트리거 구성이 변경되었습니다.
- `exec.approval.requested` / `exec.approval.resolved`: 실행 승인
  수명 주기입니다.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 승인
  수명 주기입니다.

### Node 도우미 메서드

Node는 자동 허용 검사에 사용할 현재 스킬 실행 파일 목록을 가져오기 위해 `skills.bins`를 호출할 수
있습니다.

## 감사 원장 RPC

`audit.activity.list`는 운영자 클라이언트에 에이전트 실행, 도구 작업 및 옵트인 메시지 수명 주기 메타데이터를
안정적인 최신순 보기로 제공합니다. `operator.read`가 필요합니다. 쿼리는 30일보다 오래된 레코드를 제외하며, 공유
SQLite 원장은 최대 100,000개 레코드로 제한됩니다. 만료된 행은
Gateway 시작, 매시간 유지 관리 및 이후 쓰기 중에 삭제됩니다. 데이터 모델과 개인정보 보호 의미 체계는
[감사 기록](/gateway/audit)을 참조하십시오.

- 매개변수: 선택 사항인 정확한 `agentId`, `sessionKey` 또는 `runId`; 선택 사항인 `kind`
  (`"agent_run"`, `"tool_action"` 또는 `"message"`); 선택 사항인 `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` 또는 `"unknown"`); 선택 사항인 메시지 `direction` (`"inbound"` 또는
  `"outbound"`)과 정확한 `channel`; 선택 사항인 양 끝값을 포함하는 `after` / `before`
  Unix 밀리초 범위; `1`부터 `500`까지의 선택 사항인 `limit`; 그리고 이전 페이지의
  선택 사항인 문자열 `cursor`.
- 결과: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

명명된 V1 결과 유니온에는 에이전트 실행, 도구 작업, 인바운드 메시지,
아웃바운드 메시지에 대한 별도의 스키마가 있습니다. `eventType` 판별자는 각각
`agent_run`, `tool_action`, `inbound_message` 또는 `outbound_message`이며, `kind`와
메시지 `direction`은 필터링 및 표시에 계속 사용할 수 있습니다. 모든 이벤트에는
정수 `schemaVersion: 1`이 있습니다. 메시지 ID 참조는 정확한
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>` 형식을 사용하며, 채널 발신자 행위자
ID도 동일한 형식을 사용합니다.

모든 변형에는 `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor`, `redaction`이
필수입니다. 변형별 필드는 다음과 같습니다.

| `eventType`        | 필수 필드                                                         | 선택 필드                                                                                                                       |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, ID 참조, `reasonCode`, `errorCode`                                              |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, ID 참조, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode`              |

메시지의 폐쇄형 열거형은 다음과 같습니다.

- `conversationKind`: `direct`, `group`, `channel` 또는 `unknown`.
- 인바운드 `outcome`: `completed`, `skipped` 또는 `failed`; 선택 사항인
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` 또는 `acp_dispatch_aborted`.
- 아웃바운드 `outcome`: `sent`, `suppressed`, `failed` 또는 `unknown`; 선택 사항인
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  또는 `no_visible_payload`. 플랫폼 ID를 반환하지 않는 어댑터는
  외부 부수 효과가 없었다고 입증할 수 없으므로 `unknown`입니다.
- `deliveryKind`: `text`, `media` 또는 `other`; `failureStage`:
  `platform_send`, `queue` 또는 `unknown`.

종료 필드는 서로 연관되어 있으며, 각각 독립적으로 선택 사항이 아닙니다.

| 변형             | 종료 매핑                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 에이전트 실행    | `started`에는 `errorCode`가 없습니다. 성공 이외의 각 완료 상태에는 해당하는 `run_*` 코드가 필요합니다.                                                             |
| 도구 작업        | `started`와 성공 상태에는 `errorCode`가 없습니다. 그 외의 각 완료 상태에는 해당하는 `tool_*` 코드가 필요합니다.                                                    |
| 인바운드 메시지  | 성공 = `completed`; 차단 = `skipped`; 실패 = `failed`와 `message_processing_failed`. `reasonCode`가 있는 경우 해당 종료 계열에 속해야 합니다.                     |
| 아웃바운드 메시지 | 성공 = `sent`; 차단 = `suppressed`와 `reasonCode`; 실패 = `failed`와 `errorCode` 및 `failureStage`; 알 수 없음 = `unknown`과 `failureStage`.                       |

각 활동 이벤트에는 안정적인 이벤트 ID, 단조 증가하는 원장 시퀀스,
소스 이벤트 시퀀스, 타임스탬프, 행위자, 작업, 상태, 정수
`schemaVersion: 1`, `redaction: "metadata_only"`가 포함됩니다. 실행 및 도구 레코드에는
에이전트와 실행 출처가 필요하며 세션 출처가 포함될 수 있습니다. 메시지
레코드에는 에이전트 및 실행 ID가 포함될 수 있지만, 의도적으로
`sessionKey` 또는 `sessionId`는 포함되지 않습니다. 따라서 `sessionKey` 쿼리 필터는
실행 및 도구 행에만 적용됩니다. 도구 이벤트에는 도구 호출 ID와 도구 이름이 포함될 수 있습니다.

메시지 레코드는 `message.inbound.processed` 또는
`message.outbound.finished`를 사용하며 방향, 채널, 대화 종류,
정규화된 결과와 선택 사항인 전달 종류, 실패 단계, 지속 시간,
결과 수, 사유 코드, 설치별 로컬 키가 적용된
계정/대화/메시지/대상 가명을 추가합니다. 이러한 가명은
상관관계를 파악하는 데 도움이 되지만 익명화는 아닙니다. 상태 데이터베이스에는 해당 키가
포함되지만 RPC 및 CLI 내보내기에는 포함되지 않습니다. 원장에는 프롬프트, 메시지
본문, 도구 인수, 도구 결과, 명령 출력 또는 원시 오류 텍스트를 저장하지 않습니다.
실행/도구 `sessionKey` 값은 원시 상관관계 메타데이터로 유지되며
플랫폼 계정 또는 상대 ID를 포함할 수 있습니다. 메시지 레코드에서는 세션 키를 생략합니다.

인바운드 행에서 `durationMs`는 코어 디스패치부터 터미널 상태까지의 시간을 측정하고,
`resultCount`는 확정된 대기열 내 도구, 블록 및 응답 페이로드 수를 계산합니다.
아웃바운드 행에서 `durationMs`는 전달 소유권 획득부터 승인 응답,
데드 레터 또는 조정까지의 시간(대기열 대기 시간 포함)을 나타내며, `resultCount`는
식별된 실제 플랫폼 전송 수를 계산합니다. `deliveryKind`가 있는 경우
훅 및 렌더링 이후의 실제 페이로드를 설명하며, 억제되었거나
충돌로 인해 상태가 모호한 행에서는 생략됩니다.

현재 메시지 적용 범위에는 코어 중복/터미널 결과를 포함하여 코어
디스패치에 도달한 수락된 인바운드 메시지가 포함됩니다. 아웃바운드 적용 범위에서는
공유 영구 전달에 도달한 원래의 논리적 응답 페이로드마다 하나의 터미널 행을
기록하며, 청크 분할과 어댑터 팬아웃은 `resultCount`에 집계됩니다. 대기열에 있는
재시도 가능 전송이나 모호한 전송은 승인 응답, 데드 레터 또는 조정 후에만 기록됩니다.
이러한 공유 경계를 우회하는 Plugin 로컬 경로와 직접 전송 경로는 아직
적용되지 않습니다. 제한된 작업자 대기열은 최선형 방식이며 실패하거나 포화되면
레코드를 누락할 수 있으므로, 이 기능은 무손실 규정 준수 아카이브가
아닙니다.

기록은 기본적으로 활성화되며
[`audit.enabled`](/ko/gateway/configuration-reference#audit)로 제어됩니다. 메시지 기록은
`audit.messages`로 별도로 제어되며 기본값은 `"off"`입니다. 기록이
비활성화되어도 `audit.activity.list`는 이전에 기록된 레코드가 만료될
때까지 계속 제공합니다.

배포된 `audit.list` 요청, 결과 및 `AuditEvent` 스키마는
변경되지 않았으며 에이전트 실행과 도구 작업 레코드만 반환합니다. 새로운 운영자
클라이언트는 Gateway가 이를 알릴 때 `audit.activity.list`를 호출해야 합니다. 이전
Gateway는 읽기 범위 요청에 대해 `unknown method: audit.activity.list`를 보고하거나,
배포된 버전에서는 메서드 조회보다 권한 부여가 먼저 수행되었기 때문에 `missing scope:
operator.admin`을 보고할 수 있습니다. 후자의 경우 해당 메서드가 알려지지 않았을 때만
메서드가 없는 것으로 처리하십시오. 그런 다음 필터에 메시지 종류, 방향 또는 채널
지원이 필요하지 않은 경우에만 클라이언트가 `audit.list`를 재시도할 수 있습니다.

텍스트 쿼리와 제한된 JSON 내보내기에는 [`openclaw audit`](/cli/audit)을 사용하십시오.

## 작업 원장 RPC

운영자 클라이언트는 작업 원장 RPC
(`packages/gateway-protocol/src/schema/tasks.ts`)를 통해 Gateway 백그라운드 작업 레코드를
검사하고 취소합니다. 이 RPC는 원시 런타임 상태가 아닌 정제된 작업 요약을 반환합니다.

- `tasks.list`에는 `operator.read`가 필요합니다.
  - 매개변수: 선택적 `status`(`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` 또는 `"timed_out"`) 또는 이러한 상태의 배열,
    선택적 `agentId`, 선택적 `sessionKey`, `1`부터
    `500`까지의 선택적 `limit`, 선택적 문자열 `cursor`.
  - 결과: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`에는 `operator.read`가 필요합니다.
  - 매개변수: `{ "taskId": string }`.
  - 결과: `{ "task": TaskSummary }`.
  - 존재하지 않는 작업 ID는 Gateway의 찾을 수 없음 오류 형식으로 반환됩니다.
- `tasks.cancel`에는 `operator.write`가 필요합니다.
  - 매개변수: `{ "taskId": string, "reason"?: string }`.
  - 결과: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`는 원장에 일치하는 작업이 있었는지를 나타냅니다. `cancelled`는
    런타임이 취소를 수락했거나 기록했는지를 나타냅니다.

`TaskSummary`에는 `id`, `status`와 선택적 메타데이터인 `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, 타임스탬프, 진행률,
터미널 요약 및 정제된 오류 텍스트가 포함됩니다. `agentId`는 작업을
실행하는 에이전트를 식별하며, `sessionKey`와 `ownerKey`는 요청자 및 제어
컨텍스트를 보존합니다.

## 운영자 도우미 메서드

- `commands.list` (`operator.read`)는 에이전트의 런타임 명령 인벤토리를 가져옵니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 작업 공간을 읽습니다.
  - `scope`는 기본 `name`이 대상으로 하는 표면을 제어합니다. `text`는 선행 `/`가 없는 기본 텍스트 명령 토큰을 반환하고, `native`와 기본값인 `both` 경로는 사용 가능한 경우 제공자 인식 네이티브 이름을 반환합니다.
  - `textAliases`는 `/model` 및 `/m` 같은 정확한 슬래시 별칭을 전달합니다.
  - `nativeName`은 존재하는 경우 제공자 인식 네이티브 명령 이름을 전달합니다.
  - `provider`는 선택 사항이며 네이티브 명명과 네이티브 Plugin 명령의 가용성에만 영향을 줍니다.
  - `includeArgs=false`는 응답에서 직렬화된 인수 메타데이터를 생략합니다.
- `tools.catalog` (`operator.read`)는 에이전트의 런타임 도구 카탈로그를 가져옵니다. 응답에는 그룹화된 도구와 출처 메타데이터가 포함됩니다.
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"`일 때의 Plugin 소유자
  - `optional`: Plugin 도구가 선택 사항인지 여부
- `tools.effective` (`operator.read`)는 세션에 런타임상 유효한 도구 인벤토리를 가져옵니다.
  - `sessionKey`는 필수입니다.
  - Gateway는 호출자가 제공한 인증 또는 전달 컨텍스트를 수락하는 대신 서버 측 세션에서 신뢰할 수 있는 런타임 컨텍스트를 도출합니다.
  - 응답은 코어, Plugin, 채널 및 이미 검색된 MCP 서버 도구를 포함하는 활성 인벤토리의 세션 범위 서버 파생 프로젝션입니다.
  - `tools.effective`는 MCP에 대해 읽기 전용입니다. 준비된 세션 MCP 카탈로그를 최종 도구 정책을 통해 프로젝션할 수 있지만, MCP 런타임을 생성하거나 전송 계층에 연결하거나 `tools/list`를 실행하지는 않습니다. 일치하는 준비된 카탈로그가 없으면 응답에 `mcp-not-yet-connected`, `mcp-not-yet-listed` 또는 `mcp-stale-catalog` 같은 알림이 포함될 수 있습니다.
  - 유효한 도구 항목은 `source="core"`, `source="plugin"`, `source="channel"` 또는 `source="mcp"`를 사용합니다.
- `tools.invoke` (`operator.write`)는 `/tools/invoke`와 동일한 Gateway 정책 경로를 통해 사용 가능한 도구 하나를 호출합니다.
  - `name`은 필수입니다. `args`, `sessionKey`, `agentId`, `confirm` 및 `idempotencyKey`는 선택 사항입니다.
  - `sessionKey`와 `agentId`가 모두 있으면 확인된 세션 에이전트가 `agentId`와 일치해야 합니다.
  - `cron`, `gateway`, `nodes` 같은 소유자 전용 코어 래퍼는 `tools.invoke` 자체가 `operator.write`이더라도 소유자/관리자 ID(`operator.admin`)가 필요합니다.
  - 응답은 `ok`, `toolName`, 선택적 `output`, 형식화된 `error` 필드가 있는 SDK용 봉투입니다. 승인 또는 정책 거부는 Gateway 도구 정책 파이프라인을 우회하는 대신 페이로드에서 `ok:false`를 반환합니다.
- `skills.status` (`operator.read`)는 에이전트에 표시되는 Skills 인벤토리를 가져옵니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 작업 공간을 읽습니다.
  - 응답에는 원시 비밀 값을 노출하지 않고 적격 여부, 충족되지 않은 요구 사항, 구성 검사 및 정제된 설치 옵션이 포함됩니다.
- `skills.search`와 `skills.detail` (`operator.read`)은 ClawHub 검색 메타데이터를 반환합니다.
- `skills.upload.begin`, `skills.upload.chunk` 및 `skills.upload.commit` (`operator.admin`)은 비공개 Skills 아카이브를 설치하기 전에 스테이징합니다. 이는 신뢰할 수 있는 클라이언트를 위한 별도의 관리자 업로드 경로이며 일반적인 ClawHub Skills 설치 흐름이 아닙니다. `skills.install.allowUploadedArchives`가 활성화되어 있지 않으면 기본적으로 비활성화됩니다.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`는 해당 슬러그와 강제 적용 값에 바인딩된 업로드를 생성합니다.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`는 정확히 디코딩된 오프셋에 바이트를 추가합니다.
  - `skills.upload.commit({ uploadId, sha256? })`는 최종 크기와 SHA-256을 검증합니다. 커밋은 업로드만 완료하며 Skills를 설치하지는 않습니다.
  - 업로드된 Skills 아카이브는 루트에 `SKILL.md`가 포함된 zip 아카이브입니다. 아카이브의 내부 디렉터리 이름은 설치 대상을 선택하는 데 사용되지 않습니다.
- `skills.install` (`operator.admin`)에는 세 가지 모드가 있습니다.
  - ClawHub 모드: `{ source: "clawhub", slug, version?, force? }`는 Skills 폴더를 기본 에이전트 작업 공간의 `skills/` 디렉터리에 설치합니다.
  - 업로드 모드: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`는 커밋된 업로드를 기본 에이전트 작업 공간의 `skills/<slug>` 디렉터리에 설치합니다. 슬러그와 강제 적용 값은 원래 `skills.upload.begin` 요청과 일치해야 합니다. `skills.install.allowUploadedArchives`가 활성화되어 있지 않으면 거부되며, 이 설정은 ClawHub 설치에 영향을 주지 않습니다.
  - Gateway 설치 프로그램 모드: `{ name, installId, timeoutMs? }`는 Gateway 호스트에서 선언된 `metadata.openclaw.install` 작업을 실행합니다. 이전 클라이언트는 여전히 `dangerouslyForceUnsafeInstall`을 보낼 수 있습니다. 이 필드는 더 이상 사용되지 않으며 프로토콜 호환성을 위해서만 허용되고 무시됩니다. 운영자 소유 설치 결정에는 `security.installPolicy`를 사용하십시오.
- `skills.update` (`operator.admin`)에는 두 가지 모드가 있습니다.
  - ClawHub 모드는 기본 에이전트 작업 공간에서 추적되는 슬러그 하나 또는 추적되는 모든 ClawHub 설치를 업데이트합니다.
  - 구성 모드는 `enabled`, `apiKey`, `env` 같은 `skills.entries.<skillKey>` 값을 패치합니다.

### `models.list` 뷰

`models.list`는 선택적 `view` 매개변수를 허용합니다
(`src/agents/model-catalog-visibility.ts`).

- 생략하거나 `"default"`인 경우: `agents.defaults.models`가 구성되어 있으면 응답은 `provider/*` 항목에 대해 동적으로 검색된 모델을 포함한 허용된 카탈로그입니다. 그렇지 않으면 응답은 전체 Gateway 카탈로그입니다.
- `"configured"`: 선택기 크기에 맞춘 동작입니다. `agents.defaults.models`가 구성되어 있으면 `provider/*` 항목의 제공자 범위 검색을 포함하여 여전히 우선 적용됩니다. 허용 목록이 없으면 응답은 명시적인 `models.providers.<provider>.models` 항목을 사용하며, 구성된 모델 행이 없을 때만 전체 카탈로그로 대체합니다.
- `"provider-config"`: 선택기 허용 목록과 독립적인, 소스에서 작성된 `models.providers.*.models` 인벤토리입니다. 행에는 공개 모델 기능과 경로 인식 가용성이 포함되지만 제공자 엔드포인트, 인증 자료 및 런타임 요청 구성은 생략됩니다.
- `"all"`: `agents.defaults.models`를 우회하는 전체 Gateway 카탈로그입니다. 일반 모델 선택기가 아닌 진단/검색 UI에 사용하십시오.

## 실행 승인

- 실행 요청에 승인이 필요하면 Gateway는 `exec.approval.requested`를 브로드캐스트합니다.
- 운영자 클라이언트는 `exec.approval.resolve`를 호출하여 처리합니다(`operator.approvals` 필요).
- `host=node`인 경우 `exec.approval.request`에는 `systemRunPlan`(정규 `argv`/`cwd`/`rawCommand`/세션 메타데이터)이 포함되어야 합니다. `systemRunPlan`이 없는 요청은 거부됩니다.
- 승인 후 전달되는 `node.invoke system.run` 호출은 해당 정규 `systemRunPlan`을 권위 있는 명령/cwd/세션 컨텍스트로 재사용합니다.
- 호출자가 준비 단계와 최종 승인된 `system.run` 전달 사이에 `command`, `rawCommand`, `cwd`, `agentId` 또는 `sessionKey`를 변경하면 Gateway는 변경된 페이로드를 신뢰하지 않고 실행을 거부합니다.

## 에이전트 전달 대체 동작

- `agent` 요청에는 아웃바운드 전달을 요청하기 위해 `deliver=true`를 포함할 수 있습니다.
- `bestEffortDeliver=false`(기본값)는 엄격한 동작을 유지합니다. 확인할 수 없거나 내부 전용인 전달 대상은 `INVALID_REQUEST`를 반환합니다.
- `bestEffortDeliver=true`는 외부로 전달 가능한 경로를 확인할 수 없을 때(예: 내부/웹 채팅 세션 또는 모호한 다중 채널 구성) 세션 전용 실행으로 대체할 수 있게 합니다.
- 전달이 요청된 경우 최종 `agent` 결과에는 [`openclaw agent --json --deliver`](/ko/cli/agent#json-delivery-status)에 문서화된 것과 동일한 `sent`, `suppressed`, `partial_failed`, `failed` 상태를 사용하는 `result.deliveryStatus`가 포함될 수 있습니다.

## 버전 관리

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`, `MIN_NODE_PROTOCOL_VERSION` 및 `MIN_PROBE_PROTOCOL_VERSION`은 `packages/gateway-protocol/src/version.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 전송합니다. 운영자 및 UI 클라이언트는 해당 범위에 현재 프로토콜을 포함해야 하며, 현재 클라이언트와 서버는 프로토콜 v4를 실행합니다.
- `role: "node"`와 `client.mode: "node"`를 모두 갖춘 인증된 클라이언트는 N-1 Node 프로토콜(현재 v3)을 사용할 수 있습니다. 경량 재시작 프로브도 동일한 N-1 범위를 사용합니다. 기기 인증, 페어링, 범위, 명령 정책 및 실행 승인은 이 호환성 범위의 영향을 받지 않습니다. Plugin 소유 Node 기능과 명령은 호스팅된 표면이 N-1 계약의 일부가 아니므로 Node가 현재 프로토콜로 업그레이드될 때까지 제공되지 않습니다.
- 스키마와 모델은 TypeBox 정의에서 생성됩니다.
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 클라이언트 상수

참조 클라이언트 구현은 `packages/gateway-client/src/`에 있습니다
(OpenClaw는 얇은 `src/gateway/client.ts` 퍼사드를 통해 이를 래핑합니다). 이러한 기본값은 프로토콜 v4 전체에서 안정적이며 타사 클라이언트에 기대되는 기준입니다.

| 상수                                      | 기본값                                                | 소스                                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| 요청 시간 초과(RPC당)                     | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| 사전 인증/연결 챌린지 시간 초과           | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (`OPENCLAW_HANDSHAKE_TIMEOUT_MS` 환경 변수로 연동된 서버/클라이언트 허용 시간을 늘릴 수 있음) |
| 초기 재연결 백오프                        | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| 최대 재연결 백오프                        | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| 장치 토큰으로 인한 종료 후 빠른 재시도 제한 | `250` ms                                            | `packages/gateway-client/src/client.ts`                                                                                   |
| `terminate()` 전 강제 중지 유예 시간      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| `stopAndWait()` 기본 시간 초과            | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| 기본 틱 간격(`hello-ok` 이전)             | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| 틱 시간 초과 시 종료                      | 무응답 시간이 `tickIntervalMs * 2`를 초과하면 코드 `4000` | `packages/gateway-client/src/client.ts`                                                                                |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

서버는 `hello-ok`에서 유효한 `policy.tickIntervalMs`,
`policy.maxPayload`, `policy.maxBufferedBytes`를 알립니다. 클라이언트는
핸드셰이크 전 기본값 대신 해당 값을 따라야 합니다.

모든 대기 중인 요청에 기한이 있는 경우 참조 클라이언트는 유한 요청이
구성된 기한을 직접 관리하도록 합니다. 유한한 `timeoutMs`가 없는
`expectFinal` 요청, `timeoutMs: null`인 요청, 또는 유한 요청과
무제한 요청이 혼합된 경우에는 틱 감시기가 계속 활성화됩니다. 수신 이벤트와
응답이 틱 시간 초과 임계값을 넘도록 없는 상태가 계속되면 클라이언트는
코드 `4000`으로 소켓을 닫고, 대기 중인 모든 요청을 거부한 후 재연결합니다.
재연결 후 거부된 요청을 다시 실행하지 않습니다.

## 인증

- 공유 비밀 Gateway 인증은 구성된
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`)에 따라
  `connect.params.auth.token` 또는 `connect.params.auth.password`를 사용합니다.
- Tailscale Serve(`gateway.auth.allowTailscale: true`) 또는 루프백이 아닌
  `gateway.auth.mode: "trusted-proxy"` 같은 신원 포함 모드는
  `connect.params.auth.*` 대신 요청 헤더를 통해 연결 인증 검사를 충족합니다.
- 비공개 인그레스의 `gateway.auth.mode: "none"`은 공유 비밀 연결 인증을
  완전히 건너뜁니다. 이 모드를 공개 또는 신뢰할 수 없는 인그레스에 노출하지 마십시오.
- 페어링 후 Gateway는 연결 역할 및 범위로 한정된 장치 토큰을 발급하며,
  이는 `hello-ok.auth.deviceToken`으로 반환됩니다. 클라이언트는
  연결에 성공할 때마다 이를 영구 저장해야 합니다.
- 저장된 장치 토큰으로 재연결할 때는 해당 토큰에 대해 저장된
  승인된 범위 집합도 재사용해야 합니다. 이렇게 하면 이미 부여된
  읽기/프로브/상태 접근 권한이 유지되고, 재연결 시 범위가 더 좁은
  암시적 관리자 전용 범위로 조용히 축소되는 것을 방지합니다.
- 클라이언트 측 연결 인증 구성(`packages/gateway-client/src/client.ts`의
  `selectConnectAuth`):
  - `auth.password`는 독립적이며, 설정된 경우 항상 전달됩니다.
  - `auth.token`은 다음 우선순위로 설정됩니다. 먼저 명시적 공유 토큰,
    그다음 명시적 `deviceToken`, 마지막으로 장치별로 저장된 토큰
    (`deviceId` + `role`을 키로 사용)입니다.
  - `auth.bootstrapToken`은 위 항목 중 어느 것으로도 `auth.token`이
    결정되지 않은 경우에만 전송됩니다. 공유 토큰 또는 결정된 장치 토큰이
    있으면 전송되지 않습니다.
  - 일회성 `AUTH_TOKEN_MISMATCH` 재시도에서 저장된 장치 토큰을 자동으로
    승격하는 기능은 신뢰할 수 있는 엔드포인트로만 제한됩니다. 즉, 루프백 또는
    고정된 `tlsFingerprint`를 사용하는 `wss://`입니다. 인증서 고정이 없는
    공개 `wss://`는 해당하지 않습니다.
- 내장 설정 코드 부트스트랩은 신뢰할 수 있는 모바일 전달을 위해 기본 Node의
  `hello-ok.auth.deviceToken`과 범위가 제한된 운영자 토큰을
  `hello-ok.auth.deviceTokens`로 반환합니다. 운영자 토큰에는 네이티브 Talk
  구성 읽기를 위한 `operator.talk.secrets`가 포함되지만, 페어링 변경 범위와
  `operator.admin`은 제외됩니다.
- 기준이 아닌 설정 코드 부트스트랩이 승인을 기다리는 동안
  `PAIRING_REQUIRED` 세부 정보에는 `recommendedNextStep: "wait_then_retry"`,
  `retryable: true`, `pauseReconnect: false`가 포함됩니다. 요청이 승인되거나
  토큰이 유효하지 않게 될 때까지 동일한 부트스트랩 토큰으로 계속 재연결하십시오.
- `hello-ok.auth.deviceTokens`는 연결에서 `wss://` 또는 루프백/로컬 페어링 같은
  신뢰할 수 있는 전송을 통해 부트스트랩 인증을 사용한 경우에만 영구 저장하십시오.
- 클라이언트가 명시적 `deviceToken` 또는 명시적 `scopes`를 제공하면
  호출자가 요청한 해당 범위 집합이 계속 우선합니다. 캐시된 범위는
  클라이언트가 저장된 장치별 토큰을 재사용할 때만 재사용됩니다.
- 장치 토큰은 `device.token.rotate`와 `device.token.revoke`를 통해
  교체하거나 취소할 수 있습니다(`operator.pairing` 필요). Node 또는 기타
  비운영자 역할을 교체하거나 취소하려면 `operator.admin`도 필요합니다.
- `device.token.rotate`는 교체 메타데이터를 반환합니다. 해당 장치 토큰으로
  이미 인증된 동일 장치의 호출에만 대체 전달자 토큰을 함께 반환하므로,
  토큰 전용 클라이언트는 재연결 전에 대체 토큰을 영구 저장할 수 있습니다.
  공유 토큰 또는 관리자 권한으로 수행한 교체에서는 전달자 토큰을 반환하지 않습니다.
- 토큰 발급, 교체 및 취소는 해당 장치의 페어링 항목에 기록된 승인된 역할 집합으로
  계속 제한됩니다. 토큰 변경으로 페어링 승인에서 부여한 적이 없는 장치 역할로
  확장하거나 해당 역할을 대상으로 지정할 수 없습니다.
- 페어링된 장치 토큰 세션에서는 호출자에게 `operator.admin`도 있는 경우를 제외하고
  장치 관리 범위가 자기 자신으로 제한됩니다. 관리자가 아닌 호출자는 자신의 장치
  항목에 있는 운영자 토큰만 관리할 수 있습니다. 호출자 자신의 장치에 대해서도
  Node 및 기타 비운영자 토큰 관리는 관리자만 수행할 수 있습니다.
- `device.token.rotate`와 `device.token.revoke`는 대상 운영자 토큰의 범위 집합을
  호출자의 현재 세션 범위와 대조하여 검사합니다. 관리자가 아닌 호출자는
  자신이 이미 보유한 범위보다 더 넓은 운영자 토큰을 교체하거나 취소할 수 없습니다.
- 인증 실패에는 `error.details.code`와 복구 힌트가 포함됩니다.
  - `error.details.canRetryWithDeviceToken`(불리언)
  - `error.details.recommendedNextStep`: `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration` 중 하나
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- `AUTH_TOKEN_MISMATCH`에 대한 클라이언트 동작:
  - 신뢰할 수 있는 클라이언트는 캐시된 장치별 토큰으로 제한된 재시도를 한 번
    수행할 수 있습니다.
  - 이 재시도가 실패하면 자동 재연결 루프를 중지하고 운영자가 수행해야 할 작업에
    대한 지침을 표시합니다.
- `AUTH_SCOPE_MISMATCH`는 장치 토큰은 인식되었지만 요청된 역할/범위를
  포함하지 않는다는 의미입니다. 이를 잘못된 토큰으로 표시하지 마십시오.
  운영자에게 다시 페어링하거나 더 좁거나 넓은 범위 계약을 승인하도록 안내하십시오.

## 장치 신원 및 페어링

- Node는 키 쌍 지문에서 파생된 안정적인 장치 신원(`device.id`)을 포함해야 합니다.
- Gateway는 장치 및 역할별로 토큰을 발급합니다.
- 로컬 자동 승인이 활성화되지 않은 경우 새 장치 ID에는 페어링 승인이 필요합니다.
- 페어링 자동 승인은 직접 로컬 루프백 연결을 중심으로 합니다.
- OpenClaw에는 신뢰할 수 있는 공유 비밀 도우미 흐름을 위한 제한적인
  백엔드/컨테이너 로컬 자체 연결 경로도 있습니다.
- 동일 호스트의 테일넷 또는 LAN 연결도 페어링 시에는 원격으로 취급되며
  승인이 필요합니다.
- WS 클라이언트는 일반적으로 `connect` 중에 `device` 신원(운영자 + Node)을
  포함합니다. 장치 신원이 없는 운영자에게 허용되는 유일한 예외는 다음과 같은
  명시적 신뢰 경로입니다.
  - localhost 전용의 안전하지 않은 HTTP 호환성을 위한
    `gateway.controlUi.allowInsecureAuth=true`.
  - 성공한 `gateway.auth.mode: "trusted-proxy"` 운영자 Control UI 인증.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`(비상용이며 보안이
    심각하게 약화됨).
  - 예약된 내부 도우미 경로에서 직접 루프백으로 실행되는 `gateway-client`
    백엔드 RPC.
- 장치 신원을 생략하면 범위에 영향이 있습니다. 명시적 신뢰 경로를 통해
  장치 신원이 없는 운영자 연결이 허용되더라도, 해당 경로에 명시된 범위 보존
  예외가 없으면 OpenClaw는 여전히 자체 선언된 범위를 빈 집합으로 초기화합니다.
  그러면 범위로 제한되는 메서드는 `missing scope` 오류로 실패합니다.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`는 Control UI의
  비상용 범위 보존 경로입니다. 임의의 사용자 지정 백엔드나 CLI 형태의
  WebSocket 클라이언트에는 범위를 부여하지 않습니다.
- 예약된 직접 루프백 `gateway-client` 백엔드 도우미 경로는 내부 로컬
  제어 영역 RPC에 대해서만 범위를 보존합니다. 사용자 지정 백엔드 ID에는
  이 예외가 적용되지 않습니다.
- 모든 연결은 서버에서 제공한 `connect.challenge` nonce에 서명해야 합니다.

### 장치 인증 마이그레이션 진단

챌린지 이전 서명 동작을 여전히 사용하는 레거시 클라이언트의 경우 `connect`는
안정적인 `error.details.reason`과 함께 `error.details.code` 아래에
`DEVICE_AUTH_*` 세부 코드를 반환합니다.

일반적인 마이그레이션 실패:

| 메시지                      | details.code                     | details.reason           | 의미                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 클라이언트가 `device.nonce`를 생략했거나 빈 값으로 전송했습니다. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 클라이언트가 오래되었거나 잘못된 nonce로 서명했습니다. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 서명 페이로드가 v2 페이로드와 일치하지 않습니다. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 서명된 타임스탬프가 허용된 시간 오차 범위를 벗어났습니다. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`가 공개 키 지문과 일치하지 않습니다. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 공개 키 형식 또는 정규화에 실패했습니다. |

마이그레이션 대상:

- 항상 `connect.challenge`를 기다리십시오.
- 서버 nonce가 포함된 v2 페이로드에 서명하십시오.
- 동일한 nonce를 `connect.params.device.nonce`로 전송하십시오.
- 권장되는 서명 페이로드는 `v3`입니다
  (`packages/gateway-client/src/device-auth.ts`의 `buildDeviceAuthPayloadV3`).
  이 페이로드는 device/client/role/scopes/token/nonce 필드뿐만 아니라
  `platform`과 `deviceFamily`도 바인딩합니다.
- 호환성을 위해 레거시 `v2` 서명도 계속 허용되지만, 다시 연결할 때의
  명령 정책은 여전히 페어링된 기기 메타데이터 고정에 의해 제어됩니다.

## TLS 및 고정

- WS 연결에서 TLS를 지원합니다(`gateway.tls` 구성).
- 클라이언트는 선택적으로 `gateway.remote.tlsFingerprint` 또는 CLI
  `--tls-fingerprint`를 통해 Gateway 인증서 지문을 고정할 수 있습니다.

## 범위

이 프로토콜은 상태, 채널, 모델, 채팅, 에이전트, 세션, 노드, 승인 등을
포함한 전체 Gateway API를 노출합니다. 정확한 표면은
`packages/gateway-protocol/src/schema.ts`에서 다시 내보내는 TypeBox 스키마로 정의됩니다.

## 관련 항목

- [브리지 프로토콜](/ko/gateway/bridge-protocol)
- [Gateway 런북](/ko/gateway)
