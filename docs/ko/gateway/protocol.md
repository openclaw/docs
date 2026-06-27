---
read_when:
    - Gateway WS 클라이언트 구현 또는 업데이트
    - 프로토콜 불일치 또는 연결 실패 디버깅
    - 프로토콜 스키마/모델 재생성
summary: 'Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리'
title: Gateway 프로토콜
x-i18n:
    generated_at: "2026-06-27T17:31:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 프로토콜은 OpenClaw의 **단일 제어 플레인 + 노드 전송 계층**입니다. 모든 클라이언트(CLI, 웹 UI, macOS 앱, iOS/Android 노드, 헤드리스 노드)는 WebSocket으로 연결하고 핸드셰이크 시점에 자신의 **역할** + **범위**를 선언합니다.

## 전송

- WebSocket, JSON 페이로드가 있는 텍스트 프레임.
- 첫 프레임은 **반드시** `connect` 요청이어야 합니다.
- 연결 전 프레임은 64 KiB로 제한됩니다. 핸드셰이크가 성공한 뒤에는 클라이언트가 `hello-ok.policy.maxPayload` 및 `hello-ok.policy.maxBufferedBytes` 제한을 따라야 합니다. 진단이 활성화된 경우, Gateway가 영향을 받은 프레임을 닫거나 삭제하기 전에 크기가 초과된 인바운드 프레임과 느린 아웃바운드 버퍼가 `payload.large` 이벤트를 내보냅니다. 이 이벤트는 크기, 제한, 표면, 안전한 이유 코드를 유지합니다. 메시지 본문, 첨부 파일 내용, 원시 프레임 본문, 토큰, 쿠키 또는 비밀 값은 유지하지 않습니다.

## 핸드셰이크(connect)

Gateway → 클라이언트(연결 전 챌린지):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

클라이언트 → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

Gateway → 클라이언트:

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

Gateway가 아직 시작 사이드카를 마무리하는 중이면 `connect` 요청은 `details.reason`이 `"startup-sidecars"`로 설정되고 `retryAfterMs`가 포함된 재시도 가능한 `UNAVAILABLE` 오류를 반환할 수 있습니다. 클라이언트는 이를 최종 핸드셰이크 실패로 표시하는 대신 전체 연결 예산 안에서 해당 응답을 재시도해야 합니다.

`server`, `features`, `snapshot`, `policy`는 모두 스키마(`packages/gateway-protocol/src/schema/frames.ts`)에서 필수입니다. `auth`도 필수이며 협상된 역할/범위를 보고합니다. `pluginSurfaceUrls`는 선택 사항이며 `canvas` 같은 Plugin 표면 이름을 범위가 지정된 호스팅 URL에 매핑합니다.

범위가 지정된 Plugin 표면 URL은 만료될 수 있습니다. 노드는 `{ "surface": "canvas" }`와 함께 `node.pluginSurface.refresh`를 호출해 `pluginSurfaceUrls`에서 새 항목을 받을 수 있습니다. 실험적 Canvas Plugin 리팩터는 더 이상 사용되지 않는 `canvasHostUrl`, `canvasCapability` 또는 `node.canvas.capability.refresh` 호환 경로를 지원하지 않습니다. 현재 네이티브 클라이언트와 Gateway는 Plugin 표면을 사용해야 합니다.

디바이스 토큰이 발급되지 않으면 `hello-ok.auth`는 토큰 필드 없이 협상된 권한을 보고합니다.

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

신뢰할 수 있는 동일 프로세스 백엔드 클라이언트(`client.id: "gateway-client"`, `client.mode: "backend"`)는 공유 Gateway 토큰/비밀번호로 인증할 때 직접 루프백 연결에서 `device`를 생략할 수 있습니다. 이 경로는 내부 제어 플레인 RPC용으로 예약되어 있으며, 오래된 CLI/디바이스 페어링 기준선이 하위 에이전트 세션 업데이트 같은 로컬 백엔드 작업을 차단하지 않게 합니다. 원격 클라이언트, 브라우저 출처 클라이언트, 노드 클라이언트, 명시적 디바이스 토큰/디바이스 ID 클라이언트는 여전히 일반 페어링 및 범위 업그레이드 검사를 사용합니다.

디바이스 토큰이 발급되면 `hello-ok`에는 다음도 포함됩니다.

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

기본 제공 QR/설정 코드 부트스트랩은 새로운 모바일 인계 경로입니다. 성공적인 기준선 설정 코드 연결은 기본 노드 토큰과 제한된 운영자 토큰 하나를 반환합니다.

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

운영자 인계는 QR 온보딩이 `operator.admin` 또는 `operator.pairing`을 부여하지 않고 모바일 운영자 루프를 시작할 수 있도록 의도적으로 제한됩니다. 네이티브 클라이언트가 부트스트랩 이후 필요한 Talk 구성을 읽을 수 있도록 `operator.talk.secrets`는 포함합니다. 더 넓은 관리자 및 페어링 범위에는 별도의 승인된 운영자 페어링 또는 토큰 흐름이 필요합니다. 클라이언트는 연결이 `wss://` 또는 루프백/로컬 페어링 같은 신뢰할 수 있는 전송에서 부트스트랩 인증을 사용한 경우에만 `hello-ok.auth.deviceTokens`를 유지해야 합니다.

### 노드 예시

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
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

## 프레이밍

- **요청**: `{type:"req", id, method, params}`
- **응답**: `{type:"res", id, ok, payload|error}`
- **이벤트**: `{type:"event", event, payload, seq?, stateVersion?}`

부수 효과가 있는 메서드에는 **멱등성 키**가 필요합니다(스키마 참조).

## 역할 + 범위

전체 운영자 범위 모델, 승인 시점 검사, 공유 비밀 의미 체계는 [운영자 범위](/ko/gateway/operator-scopes)를 참조하세요.

### 역할

- `operator` = 제어 플레인 클라이언트(CLI/UI/자동화).
- `node` = 기능 호스트(camera/screen/canvas/system.run).

### 범위(운영자)

일반적인 범위:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`가 있는 `talk.config`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.

Plugin이 등록한 Gateway RPC 메서드는 자체 운영자 범위를 요청할 수 있지만, 예약된 코어 관리자 접두사(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 항상 `operator.admin`으로 해석됩니다.

메서드 범위는 첫 번째 게이트일 뿐입니다. `chat.send`를 통해 도달하는 일부 슬래시 명령은 그 위에 더 엄격한 명령 수준 검사를 적용합니다. 예를 들어 영구적인 `/config set` 및 `/config unset` 쓰기에는 `operator.admin`이 필요합니다.

`node.pair.approve`에는 기본 메서드 범위에 더해 추가 승인 시점 범위 검사도 있습니다.

- 명령이 없는 요청: `operator.pairing`
- exec가 아닌 노드 명령이 있는 요청: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` 또는 `system.which`를 포함하는 요청: `operator.pairing` + `operator.admin`

### 기능/명령/권한(노드)

노드는 연결 시점에 기능 주장을 선언합니다.

- `caps`: `camera`, `canvas`, `screen`, `location`, `voice`, `talk` 같은 상위 수준 기능 범주.
- `commands`: 호출용 명령 허용 목록.
- `permissions`: 세분화된 토글(예: `screen.record`, `camera.capture`).

Gateway는 이를 **주장**으로 취급하고 서버 측 허용 목록을 적용합니다.

## 프레즌스

- `system-presence`는 디바이스 ID를 키로 하는 항목을 반환합니다.
- 프레즌스 항목에는 `deviceId`, `roles`, `scopes`가 포함되므로 UI는 동일한 디바이스가 **운영자**와 **노드**로 모두 연결되어도 디바이스당 단일 행을 표시할 수 있습니다.
- `node.list`에는 선택적 `lastSeenAtMs` 및 `lastSeenReason` 필드가 포함됩니다. 연결된 노드는 현재 연결 시간을 `lastSeenAtMs`로, 이유를 `connect`로 보고합니다. 페어링된 노드는 신뢰할 수 있는 노드 이벤트가 페어링 메타데이터를 업데이트할 때 지속적인 백그라운드 프레즌스도 보고할 수 있습니다.

### 노드 백그라운드 생존 이벤트

노드는 페어링된 노드가 연결된 것으로 표시하지 않고 백그라운드 깨우기 중 살아 있었음을 기록하기 위해 `event: "node.presence.alive"`와 함께 `node.event`를 호출할 수 있습니다.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger`는 닫힌 열거형입니다: `background`, `silent_push`, `bg_app_refresh`, `significant_location`, `manual` 또는 `connect`. 알 수 없는 트리거 문자열은 지속하기 전에 Gateway가 `background`로 정규화합니다. 이 이벤트는 인증된 노드 디바이스 세션에 대해서만 지속됩니다. 디바이스가 없거나 페어링되지 않은 세션은 `handled: false`를 반환합니다.

성공한 Gateway는 구조화된 결과를 반환합니다.

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

이전 Gateway는 `node.event`에 대해 여전히 `{ "ok": true }`를 반환할 수 있습니다. 클라이언트는 이를 지속적인 프레즌스 저장이 아니라 확인된 RPC로 처리해야 합니다.

## 브로드캐스트 이벤트 범위 지정

서버에서 푸시하는 WebSocket 브로드캐스트 이벤트는 범위로 게이트되어, 페어링 범위 세션이나 노드 전용 세션이 세션 콘텐츠를 수동으로 수신하지 않도록 합니다.

- **채팅, 에이전트, 도구 결과 프레임**(스트리밍된 `agent` 이벤트 및 도구 호출 결과 포함)에는 최소 `operator.read`가 필요합니다. `operator.read`가 없는 세션은 이러한 프레임을 완전히 건너뜁니다.
- **Plugin 정의 `plugin.*` 브로드캐스트**는 Plugin이 등록한 방식에 따라 `operator.write` 또는 `operator.admin`으로 게이트됩니다.
- **상태 및 전송 이벤트**(`heartbeat`, `presence`, `tick`, 연결/연결 해제 수명 주기 등)는 모든 인증된 세션이 전송 상태를 관찰할 수 있도록 제한 없이 유지됩니다.
- **알 수 없는 브로드캐스트 이벤트 패밀리**는 등록된 핸들러가 명시적으로 완화하지 않는 한 기본적으로 범위로 게이트됩니다(닫힌 실패).

각 클라이언트 연결은 자체 클라이언트별 시퀀스 번호를 유지하므로, 서로 다른 클라이언트가 이벤트 스트림에서 범위로 필터링된 서로 다른 하위 집합을 보더라도 브로드캐스트는 해당 소켓에서 단조 순서를 보존합니다.

## 일반 RPC 메서드 패밀리

공개 WS 표면은 위의 핸드셰이크/인증 예시보다 더 넓습니다. 이는 생성된 덤프가 아닙니다. `hello-ok.features.methods`는 `src/gateway/server-methods-list.ts`와 로드된 Plugin/채널 메서드 내보내기에서 빌드된 보수적인 발견 목록입니다. 이를 `src/gateway/server-methods/*.ts`의 전체 열거가 아니라 기능 발견으로 취급하세요.

  <AccordionGroup>
  <Accordion title="시스템 및 ID">
    - `health`는 캐시된 또는 새로 프로브한 Gateway 상태 스냅샷을 반환합니다.
    - `diagnostics.stability`는 최근의 제한된 진단 안정성 기록기를 반환합니다. 이벤트 이름, 개수, 바이트 크기, 메모리 판독값, 큐/세션 상태, 채널/Plugin 이름, 세션 ID 같은 운영 메타데이터를 보관합니다. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청 또는 응답 본문, 토큰, 쿠키, 비밀 값은 보관하지 않습니다. 운영자 읽기 범위가 필요합니다.
    - `status`는 `/status` 스타일의 Gateway 요약을 반환합니다. 민감한 필드는 관리자 범위 운영자 클라이언트에만 포함됩니다.
    - `gateway.identity.get`은 릴레이 및 페어링 흐름에서 사용하는 Gateway 디바이스 ID를 반환합니다.
    - `system-presence`는 연결된 운영자/Node 디바이스의 현재 프레즌스 스냅샷을 반환합니다.
    - `system-event`는 시스템 이벤트를 추가하고 프레즌스 컨텍스트를 업데이트/브로드캐스트할 수 있습니다.
    - `last-heartbeat`는 최신 영구 저장 Heartbeat 이벤트를 반환합니다.
    - `set-heartbeats`는 Gateway에서 Heartbeat 처리를 전환합니다.

  </Accordion>

  <Accordion title="모델 및 사용량">
    - `models.list`는 런타임에서 허용된 모델 카탈로그를 반환합니다. 선택기 크기의 구성된 모델에는 `{ "view": "configured" }`를 전달하세요(`agents.defaults.models`가 먼저, 그다음 `models.providers.*.models`). 전체 카탈로그에는 `{ "view": "all" }`을 전달하세요.
    - `usage.status`는 공급자 사용량 창/남은 할당량 요약을 반환합니다.
    - `usage.cost`는 날짜 범위의 집계 비용 사용량 요약을 반환합니다.
      단일 에이전트에는 `agentId`를 전달하거나, 구성된 에이전트를 집계하려면 `agentScope: "all"`을 전달하세요.
    - `doctor.memory.status`는 활성 기본 에이전트 워크스페이스의 벡터 메모리 / 캐시된 임베딩 준비 상태를 반환합니다. 호출자가 명시적으로 라이브 임베딩 공급자 ping을 원할 때만 `{ "probe": true }` 또는 `{ "deep": true }`를 전달하세요. Dreaming 인식 클라이언트는 선택한 에이전트 워크스페이스로 Dreaming 저장소 통계를 범위 지정하기 위해 `{ "agentId": "agent-id" }`도 전달할 수 있습니다. `agentId`를 생략하면 기본 에이전트 폴백을 유지하고 구성된 Dreaming 워크스페이스를 집계합니다.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts`, `doctor.memory.dedupeDreamDiary`는 선택된 에이전트 Dreaming 보기/동작을 위한 선택적 `{ "agentId": "agent-id" }` 매개변수를 받습니다. `agentId`가 생략되면 구성된 기본 에이전트 워크스페이스에서 동작합니다.
    - `doctor.memory.remHarness`는 원격 제어 플레인 클라이언트를 위한 제한된 읽기 전용 REM 하네스 미리보기를 반환합니다. 워크스페이스 경로, 메모리 스니펫, 렌더링된 근거 기반 마크다운, 심층 승격 후보를 포함할 수 있으므로 호출자에게 `operator.read`가 필요합니다.
    - `sessions.usage`는 세션별 사용량 요약을 반환합니다. 단일
      에이전트에는 `agentId`를 전달하거나, 구성된 에이전트를 함께 나열하려면 `agentScope: "all"`을 전달하세요.
    - `sessions.usage.timeseries`는 한 세션의 시계열 사용량을 반환합니다.
    - `sessions.usage.logs`는 한 세션의 사용량 로그 항목을 반환합니다.

  </Accordion>

  <Accordion title="채널 및 로그인 헬퍼">
    - `channels.status`는 내장 + 번들 채널/Plugin 상태 요약을 반환합니다.
    - `channels.logout`은 채널이 로그아웃을 지원하는 특정 채널/계정에서 로그아웃합니다.
    - `web.login.start`는 현재 QR 지원 웹 채널 공급자의 QR/웹 로그인 흐름을 시작합니다.
    - `web.login.wait`는 해당 QR/웹 로그인 흐름이 완료될 때까지 기다리고 성공 시 채널을 시작합니다.
    - `push.test`는 등록된 iOS Node에 테스트 APNs 푸시를 보냅니다.
    - `voicewake.get`은 저장된 깨우기 단어 트리거를 반환합니다.
    - `voicewake.set`은 깨우기 단어 트리거를 업데이트하고 변경 사항을 브로드캐스트합니다.

  </Accordion>

  <Accordion title="메시징 및 로그">
    - `send`는 채팅 러너 외부에서 채널/계정/스레드 대상 전송을 위한 직접 아웃바운드 전달 RPC입니다.
    - `logs.tail`은 커서/제한 및 최대 바이트 제어가 적용된 구성된 Gateway 파일 로그 tail을 반환합니다.

  </Accordion>

  <Accordion title="Talk 및 TTS">
    - `talk.catalog`는 음성, 스트리밍 전사, 실시간 음성을 위한 읽기 전용 Talk 공급자 카탈로그를 반환합니다. 공급자 ID, 레이블, 구성 상태, 노출된 모델/음성 ID, 표준 모드, 전송 방식, 브레인 전략, 실시간 오디오/기능 플래그를 포함하며 공급자 비밀을 반환하거나 전역 구성을 변경하지 않습니다.
    - `talk.config`는 유효한 Talk 구성 페이로드를 반환합니다. `includeSecrets`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.
    - `talk.session.create`는 `realtime/gateway-relay`, `transcription/gateway-relay`, 또는 `stt-tts/managed-room`용 Gateway 소유 Talk 세션을 생성합니다. `stt-tts/managed-room`의 경우, `sessionKey`를 전달하는 `operator.write` 호출자는 범위가 지정된 세션 키 가시성을 위해 `spawnedBy`도 전달해야 합니다. 범위가 지정되지 않은 `sessionKey` 생성과 `brain: "direct-tools"`에는 `operator.admin`이 필요합니다.
    - `talk.session.join`은 관리형 방 세션 토큰을 검증하고, 필요에 따라 `session.ready` 또는 `session.replaced` 이벤트를 내보내며, 평문 토큰이나 저장된 토큰 해시 없이 방/세션 메타데이터와 최근 Talk 이벤트를 반환합니다.
    - `talk.session.appendAudio`는 Gateway 소유 실시간 릴레이 및 전사 세션에 base64 PCM 입력 오디오를 추가합니다.
    - `talk.session.startTurn`, `talk.session.endTurn`, `talk.session.cancelTurn`은 상태가 지워지기 전에 오래된 턴을 거부하면서 관리형 방 턴 수명주기를 구동합니다.
    - `talk.session.cancelOutput`은 주로 Gateway 릴레이 세션에서 VAD 게이트 방식의 끼어들기를 위해 어시스턴트 오디오 출력을 중지합니다.
    - `talk.session.submitToolResult`는 Gateway 소유 실시간 릴레이 세션에서 내보낸 공급자 도구 호출을 완료합니다. 최종 결과가 뒤따를 예정인 중간 도구 출력에는 `options: { willContinue: true }`를 전달하거나, 도구 결과가 다른 실시간 어시스턴트 응답을 시작하지 않고 공급자 호출을 충족해야 할 때는 `options: { suppressResponse: true }`를 전달하세요.
    - `talk.session.steer`는 활성 실행 음성 제어를 Gateway 소유 에이전트 기반 Talk 세션으로 보냅니다. `{ sessionId, text, mode? }`를 받으며, 여기서 `mode`는 `status`, `steer`, `cancel`, 또는 `followup`입니다. 생략된 모드는 발화 텍스트에서 분류됩니다.
    - `talk.session.close`는 Gateway 소유 릴레이, 전사 또는 관리형 방 세션을 닫고 종료 Talk 이벤트를 내보냅니다.
    - `talk.mode`는 WebChat/Control UI 클라이언트를 위한 현재 Talk 모드 상태를 설정/브로드캐스트합니다.
    - `talk.client.create`는 Gateway가 구성, 자격 증명, 지침, 도구 정책을 소유하는 동안 `webrtc` 또는 `provider-websocket`을 사용해 클라이언트 소유 실시간 공급자 세션을 생성합니다.
    - `talk.client.toolCall`은 클라이언트 소유 실시간 전송이 공급자 도구 호출을 Gateway 정책으로 전달할 수 있게 합니다. 첫 번째 지원 도구는 `openclaw_agent_consult`입니다. 클라이언트는 실행 ID를 받고 공급자별 도구 결과를 제출하기 전에 일반 채팅 수명주기 이벤트를 기다립니다.
    - `talk.client.steer`는 클라이언트 소유 실시간 전송을 위한 활성 실행 음성 제어를 보냅니다. Gateway는 `sessionKey`에서 활성 임베디드 실행을 확인하고, 조향을 조용히 버리는 대신 구조화된 수락/거부 결과를 반환합니다.
    - `talk.event`는 실시간, 전사, STT/TTS, 관리형 방, 전화, 회의 어댑터를 위한 단일 Talk 이벤트 채널입니다.
    - `talk.speak`는 활성 Talk 음성 공급자를 통해 음성을 합성합니다.
    - `tts.status`는 TTS 활성화 상태, 활성 공급자, 폴백 공급자, 공급자 구성 상태를 반환합니다.
    - `tts.providers`는 표시 가능한 TTS 공급자 인벤토리를 반환합니다.
    - `tts.enable` 및 `tts.disable`은 TTS 기본 설정 상태를 전환합니다.
    - `tts.setProvider`는 선호 TTS 공급자를 업데이트합니다.
    - `tts.convert`는 일회성 텍스트 음성 변환을 실행합니다.

  </Accordion>

  <Accordion title="비밀, 구성, 업데이트 및 마법사">
    - `secrets.reload`는 활성 SecretRefs를 다시 해석하고 전체 성공 시에만 런타임 비밀 상태를 교체합니다.
    - `secrets.resolve`는 특정 명령/대상 집합에 대한 명령 대상 비밀 할당을 해석합니다.
    - `config.get`은 현재 구성 스냅샷과 해시를 반환합니다.
    - `config.set`은 검증된 구성 페이로드를 씁니다.
    - `config.patch`는 부분 구성 업데이트를 병합합니다. 파괴적인 배열
      교체에는 영향을 받는 경로가 `replacePaths`에 필요합니다. 배열 항목 아래의 중첩 배열은 `agents.list[].skills` 같은 `[]` 경로를 사용합니다.
    - `config.apply`는 전체 구성 페이로드를 검증하고 교체합니다.
    - `config.schema`는 Control UI 및 CLI 도구에서 사용하는 라이브 구성 스키마 페이로드를 반환합니다. 여기에는 스키마, `uiHints`, 버전, 생성 메타데이터가 포함되며, 런타임이 로드할 수 있을 때 Plugin + 채널 스키마 메타데이터도 포함됩니다. 스키마에는 일치하는 필드 문서가 있을 때 UI에서 사용하는 동일한 레이블과 도움말 텍스트에서 파생된 필드 `title` / `description` 메타데이터가 포함되며, 중첩 객체, 와일드카드, 배열 항목, `anyOf` / `oneOf` / `allOf` 컴포지션 브랜치도 포함됩니다.
    - `config.schema.lookup`은 하나의 구성 경로에 대해 경로 범위 조회 페이로드를 반환합니다. 정규화된 경로, 얕은 스키마 노드, 일치한 힌트 + `hintPath`, 선택적 `reloadKind`, UI/CLI 드릴다운을 위한 즉시 하위 요약을 포함합니다. `reloadKind`는 `restart`, `hot`, 또는 `none` 중 하나이며 요청된 경로에 대한 Gateway 구성 다시 로드 플래너를 반영합니다. 조회 스키마 노드는 사용자 대상 문서와 일반 검증 필드(`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, 숫자/문자열/배열/객체 경계, 그리고 `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` 같은 플래그)를 유지합니다. 하위 요약은 `key`, 정규화된 `path`, `type`, `required`, `hasChildren`, 선택적 `reloadKind`, 그리고 일치한 `hint` / `hintPath`를 노출합니다.
    - `update.run`은 Gateway 업데이트 흐름을 실행하고 업데이트 자체가 성공한 경우에만 재시작을 예약합니다. 세션이 있는 호출자는 `continuationMessage`를 포함해 재시작 연속 큐를 통해 시작 시 후속 에이전트 턴 하나가 재개되도록 할 수 있습니다. 제어 플레인의 패키지 관리자 업데이트와 감독되는 git 체크아웃 업데이트는 라이브 Gateway 내부에서 패키지 트리를 교체하거나 체크아웃/빌드 출력을 변경하는 대신 분리된 관리형 서비스 핸드오프를 사용합니다. 시작된 핸드오프는 `result.reason: "managed-service-handoff-started"` 및 `handoff.status: "started"`와 함께 `ok: true`를 반환합니다. 사용할 수 없거나 실패한 핸드오프는 `managed-service-handoff-unavailable` 또는 `managed-service-handoff-failed`와 함께 `ok: false`를 반환하며, 수동 셸 업데이트가 필요할 때는 `handoff.command`도 반환합니다. 사용할 수 없는 핸드오프는 OpenClaw에 안전한 감독자 경계나 지속적인 서비스 ID가 없음을 의미합니다. 예를 들어 systemd의 `OPENCLAW_SYSTEMD_UNIT`이 이에 해당합니다. 시작된 핸드오프 중에는 재시작 센티널이 잠시 `stats.reason: "restart-health-pending"`를 보고할 수 있습니다. CLI가 재시작된 Gateway를 확인하고 최종 `ok` 센티널을 쓸 때까지 연속 처리는 지연됩니다.
    - `update.status`는 사용 가능할 때 재시작 후 실행 중인 버전을 포함해 최신 업데이트 재시작 센티널을 새로 고치고 반환합니다.
    - `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel`은 WS RPC를 통해 온보딩 마법사를 노출합니다.

  </Accordion>

  <Accordion title="에이전트 및 작업 공간 헬퍼">
    - `agents.list`는 유효 모델과 런타임 메타데이터를 포함해 구성된 에이전트 항목을 반환합니다.
    - `agents.create`, `agents.update`, `agents.delete`는 에이전트 레코드와 작업 공간 연결을 관리합니다.
    - `agents.files.list`, `agents.files.get`, `agents.files.set`은 에이전트에 노출되는 부트스트랩 작업 공간 파일을 관리합니다.
    - `tasks.list`, `tasks.get`, `tasks.cancel`은 SDK 및 운영자 클라이언트에 Gateway 작업 원장을 노출합니다.
    - `artifacts.list`, `artifacts.get`, `artifacts.download`는 명시적 `sessionKey`, `runId` 또는 `taskId` 범위에 대해 transcript에서 파생된 아티팩트 요약과 다운로드를 노출합니다. 실행 및 작업 쿼리는 소유 세션을 서버 측에서 확인하고 출처가 일치하는 transcript 미디어만 반환합니다. 안전하지 않거나 로컬 URL 소스는 서버 측에서 가져오는 대신 지원되지 않는 다운로드를 반환합니다.
    - `environments.list`와 `environments.status`는 SDK 클라이언트에 읽기 전용 Gateway 로컬 및 Node 환경 검색을 노출합니다.
    - `agent.identity.get`은 에이전트 또는 세션의 유효 어시스턴트 ID를 반환합니다.
    - `agent.wait`는 실행이 완료될 때까지 기다리고, 사용할 수 있으면 터미널 스냅샷을 반환합니다.

  </Accordion>

  <Accordion title="세션 제어">
    - `sessions.list`는 에이전트 런타임 백엔드가 구성된 경우 각 행의 `agentRuntime` 메타데이터를 포함해 현재 세션 인덱스를 반환합니다.
    - `sessions.subscribe`와 `sessions.unsubscribe`는 현재 WS 클라이언트의 세션 변경 이벤트 구독을 전환합니다.
    - `sessions.messages.subscribe`와 `sessions.messages.unsubscribe`는 한 세션의 transcript/메시지 이벤트 구독을 전환합니다.
    - `sessions.preview`는 특정 세션 키에 대해 제한된 transcript 미리 보기를 반환합니다.
    - `sessions.describe`는 정확한 세션 키에 대한 Gateway 세션 행 하나를 반환합니다.
    - `sessions.resolve`는 세션 대상을 해석하거나 정규화합니다.
    - `sessions.create`는 새 세션 항목을 생성합니다.
    - `sessions.send`는 기존 세션으로 메시지를 보냅니다.
    - `sessions.steer`는 활성 세션에 대한 interrupt-and-steer 변형입니다.
    - `sessions.abort`는 세션의 활성 작업을 중단합니다. 호출자는 `key`와 선택적 `runId`를 함께 전달하거나, Gateway가 세션으로 해석할 수 있는 활성 실행에 대해 `runId`만 전달할 수 있습니다.
    - `sessions.patch`는 세션 메타데이터/재정의를 업데이트하고 해석된 정규 모델과 유효 `agentRuntime`을 보고합니다.
    - `sessions.reset`, `sessions.delete`, `sessions.compact`는 세션 유지 관리를 수행합니다.
    - `sessions.get`은 저장된 전체 세션 행을 반환합니다.
    - 채팅 실행은 여전히 `chat.history`, `chat.send`, `chat.abort`, `chat.inject`를 사용합니다. `chat.history`는 UI 클라이언트용으로 표시 정규화됩니다. 인라인 지시문 태그는 보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰은 제거되며, 정확한 `NO_REPLY` / `no_reply` 같은 순수 무음 토큰 어시스턴트 행은 생략되고, 너무 큰 행은 플레이스홀더로 대체될 수 있습니다.
    - `chat.message.get`은 단일 표시 transcript 항목을 위한 추가형 제한 전체 메시지 리더입니다. 클라이언트는 `sessionKey`, 세션 선택이 에이전트 범위인 경우 선택적 `agentId`, 그리고 이전에 `chat.history`를 통해 노출된 transcript `messageId`를 전달하며, 저장된 항목이 아직 사용 가능하고 너무 크지 않은 경우 Gateway는 경량 히스토리 잘림 한도 없이 동일한 표시 정규화 프로젝션을 반환합니다.
    - `chat.send`는 자동 컷오프 전에 시작된 모델 호출에 빠른 모드를 사용한 뒤, 이후 재시도, fallback, 도구 결과 또는 continuation 호출은 빠른 모드 없이 시작하도록 단일 턴 `fastMode: "auto"`를 허용합니다. 컷오프 기본값은 60초이며 `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds`로 모델별로 구성할 수 있습니다. `chat.send` 호출자는 해당 요청의 컷오프를 재정의하기 위해 단일 턴 `fastAutoOnSeconds`를 전달할 수 있습니다.

  </Accordion>

  <Accordion title="기기 페어링 및 기기 토큰">
    - `device.pair.list`는 대기 중이거나 승인된 페어링 기기를 반환합니다.
    - `device.pair.approve`, `device.pair.reject`, `device.pair.remove`는 기기 페어링 레코드를 관리합니다.
    - `device.token.rotate`는 승인된 역할 및 호출자 범위 한도 내에서 페어링된 기기 토큰을 순환합니다.
    - `device.token.revoke`는 승인된 역할 및 호출자 범위 한도 내에서 페어링된 기기 토큰을 취소합니다.

  </Accordion>

  <Accordion title="Node 페어링, 호출 및 대기 작업">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.pair.verify`는 Node 페어링 및 부트스트랩 검증을 다룹니다.
    - `node.list`와 `node.describe`는 알려진/연결된 Node 상태를 반환합니다.
    - `node.rename`은 페어링된 Node 레이블을 업데이트합니다.
    - `node.invoke`는 명령을 연결된 Node로 전달합니다.
    - `node.invoke.result`는 invoke 요청의 결과를 반환합니다.
    - `node.event`는 Node에서 발생한 이벤트를 gateway로 다시 전달합니다.
    - `node.pending.pull`과 `node.pending.ack`는 연결된 Node 큐 API입니다.
    - `node.pending.enqueue`와 `node.pending.drain`은 오프라인/연결 해제된 Node의 내구성 있는 대기 작업을 관리합니다.

  </Accordion>

  <Accordion title="승인 계열">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve`는 일회성 exec 승인 요청과 대기 중인 승인 조회/재생을 다룹니다.
    - `exec.approval.waitDecision`은 대기 중인 exec 승인 하나를 기다리고 최종 결정(또는 시간 초과 시 `null`)을 반환합니다.
    - `exec.approvals.get`과 `exec.approvals.set`은 gateway exec 승인 정책 스냅샷을 관리합니다.
    - `exec.approvals.node.get`과 `exec.approvals.node.set`은 Node relay 명령을 통해 Node 로컬 exec 승인 정책을 관리합니다.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve`는 Plugin 정의 승인 흐름을 다룹니다.

  </Accordion>

  <Accordion title="자동화, Skills 및 도구">
    - 자동화: `wake`는 즉시 또는 다음 Heartbeat 깨우기 텍스트 삽입을 예약합니다. `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs`는 예약된 작업을 관리합니다.
    - `cron.run`은 수동 실행을 위한 enqueue 스타일 RPC로 유지됩니다. 완료 의미 체계가 필요한 클라이언트는 반환된 `runId`를 읽고 `cron.runs`를 폴링해야 합니다.
    - `cron.runs`는 선택적 비어 있지 않은 `runId` 필터를 허용하므로, 클라이언트가 같은 작업의 다른 히스토리 항목과 경쟁하지 않고 큐에 들어간 수동 실행 하나를 따라갈 수 있습니다.
    - Skills 및 도구: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### 일반 이벤트 계열

- `chat`: `chat.inject` 및 기타 transcript 전용 채팅 이벤트 같은 UI 채팅 업데이트입니다. 프로토콜 v4에서 델타 페이로드는 `deltaText`를 전달하고, `message`는 누적 어시스턴트 스냅샷으로 유지됩니다. 접두사가 아닌 대체는 `replace=true`를 설정하고 `deltaText`를 대체 텍스트로 사용합니다.
- `session.message`, `session.operation`, `session.tool`: 구독된 세션의 transcript, 진행 중인 세션 작업 및 이벤트 스트림 업데이트입니다.
- `sessions.changed`: 세션 인덱스 또는 메타데이터가 변경되었습니다.
- `presence`: 시스템 presence 스냅샷 업데이트입니다.
- `tick`: 주기적 keepalive / liveness 이벤트입니다.
- `health`: gateway 상태 스냅샷 업데이트입니다.
- `heartbeat`: Heartbeat 이벤트 스트림 업데이트입니다.
- `cron`: Cron 실행/작업 변경 이벤트입니다.
- `shutdown`: gateway 종료 알림입니다.
- `node.pair.requested` / `node.pair.resolved`: Node 페어링 수명 주기입니다.
- `node.invoke.request`: Node invoke 요청 브로드캐스트입니다.
- `device.pair.requested` / `device.pair.resolved`: 페어링된 기기 수명 주기입니다.
- `voicewake.changed`: wake-word 트리거 구성이 변경되었습니다.
- `exec.approval.requested` / `exec.approval.resolved`: exec 승인 수명 주기입니다.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 승인 수명 주기입니다.

### Node 헬퍼 메서드

- Node는 자동 허용 확인을 위해 현재 skill 실행 파일 목록을 가져오도록 `skills.bins`를 호출할 수 있습니다.

### 작업 원장 RPC

운영자 클라이언트는 작업 원장 RPC를 통해 Gateway 백그라운드 작업 레코드를 검사하고 취소할 수 있습니다. 이러한 메서드는 원시 런타임 상태가 아니라 정리된 작업 요약을 반환합니다.

- `tasks.list`에는 `operator.read`가 필요합니다.
  - 매개변수: 선택적 `status`(`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` 또는 `"timed_out"`) 또는 이러한 상태의 배열, 선택적 `agentId`, 선택적 `sessionKey`, `1`부터 `500`까지의 선택적 `limit`, 선택적 문자열 `cursor`.
  - 결과: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get`에는 `operator.read`가 필요합니다.
  - 매개변수: `{ "taskId": string }`.
  - 결과: `{ "task": TaskSummary }`.
  - 누락된 작업 ID는 Gateway not-found 오류 형태를 반환합니다.
- `tasks.cancel`에는 `operator.write`가 필요합니다.
  - 매개변수: `{ "taskId": string, "reason"?: string }`.
  - 결과:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found`는 원장에 일치하는 작업이 있었는지 보고합니다. `cancelled`는 런타임이 취소를 수락했거나 기록했는지 보고합니다.

`TaskSummary`에는 `id`, `status`와 함께 `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, 타임스탬프, 진행률, 터미널 요약 및 정리된 오류 텍스트 같은 선택적 메타데이터가 포함됩니다. `agentId`는 작업을 실행하는 에이전트를 식별하며, `sessionKey`와 `ownerKey`는 요청자 및 제어 컨텍스트를 보존합니다.

### 운영자 헬퍼 메서드

- 운영자는 에이전트의 런타임 명령 인벤토리를 가져오기 위해 `commands.list`(`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항입니다. 기본 에이전트 작업 영역을 읽으려면 생략하세요.
  - `scope`는 기본 `name`이 대상으로 삼는 표면을 제어합니다.
    - `text`는 앞의 `/` 없이 기본 텍스트 명령 토큰을 반환합니다.
    - `native`와 기본 `both` 경로는 사용 가능한 경우 제공자 인식 네이티브 이름을 반환합니다.
  - `textAliases`는 `/model` 및 `/m` 같은 정확한 슬래시 별칭을 전달합니다.
  - `nativeName`은 존재하는 경우 제공자 인식 네이티브 명령 이름을 전달합니다.
  - `provider`는 선택 사항이며 네이티브 이름 지정과 네이티브 Plugin 명령 사용 가능 여부에만 영향을 줍니다.
  - `includeArgs=false`는 응답에서 직렬화된 인수 메타데이터를 생략합니다.
- 운영자는 에이전트의 런타임 도구 카탈로그를 가져오기 위해 `tools.catalog`(`operator.read`)를 호출할 수 있습니다. 응답에는 그룹화된 도구와 출처 메타데이터가 포함됩니다.
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"`일 때 Plugin 소유자
  - `optional`: Plugin 도구가 선택 사항인지 여부
- 운영자는 세션의 런타임 적용 도구 인벤토리를 가져오기 위해 `tools.effective`(`operator.read`)를 호출할 수 있습니다.
  - `sessionKey`는 필수입니다.
  - Gateway는 호출자가 제공한 인증 또는 전달 컨텍스트를 받는 대신 세션에서 신뢰할 수 있는 런타임 컨텍스트를 서버 측에서 도출합니다.
  - 응답은 활성 인벤토리의 세션 범위 서버 도출 프로젝션이며, 코어, Plugin, 채널, 이미 발견된 MCP 서버 도구를 포함합니다.
  - `tools.effective`는 MCP에 대해 읽기 전용입니다. 웜 세션 MCP 카탈로그를 최종 도구 정책을 통해 프로젝션할 수는 있지만, MCP 런타임을 생성하거나, 전송에 연결하거나, `tools/list`를 발행하지는 않습니다. 일치하는 웜 카탈로그가 없으면 응답에 `mcp-not-yet-connected`, `mcp-not-yet-listed`, 또는 `mcp-stale-catalog` 같은 알림이 포함될 수 있습니다.
  - 적용 도구 항목은 `source="core"`, `source="plugin"`, `source="channel"`, 또는 `source="mcp"`를 사용합니다.
- 운영자는 `/tools/invoke`와 동일한 Gateway 정책 경로를 통해 사용 가능한 도구 하나를 호출하기 위해 `tools.invoke`(`operator.write`)를 호출할 수 있습니다.
  - `name`은 필수입니다. `args`, `sessionKey`, `agentId`, `confirm`, `idempotencyKey`는 선택 사항입니다.
  - `sessionKey`와 `agentId`가 모두 있으면, 해석된 세션 에이전트가 `agentId`와 일치해야 합니다.
  - `cron`, `gateway`, `nodes` 같은 소유자 전용 코어 래퍼는 `tools.invoke` 메서드 자체가 `operator.write`이더라도 소유자/관리자 ID(`operator.admin`)가 필요합니다.
  - 응답은 `ok`, `toolName`, 선택적 `output`, 타입이 지정된 `error` 필드를 포함하는 SDK 대상 엔벨로프입니다. 승인 또는 정책 거부는 Gateway 도구 정책 파이프라인을 우회하지 않고 페이로드에서 `ok:false`를 반환합니다.
- 운영자는 에이전트의 표시 가능한 skill 인벤토리를 가져오기 위해 `skills.status`(`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항입니다. 기본 에이전트 작업 영역을 읽으려면 생략하세요.
  - 응답에는 원시 비밀 값을 노출하지 않는 적격성, 누락된 요구 사항, 구성 검사, 정리된 설치 옵션이 포함됩니다.
- 운영자는 ClawHub 발견 메타데이터를 위해 `skills.search` 및 `skills.detail`(`operator.read`)을 호출할 수 있습니다.
- 운영자는 설치 전에 비공개 skill 아카이브를 스테이징하기 위해 `skills.upload.begin`, `skills.upload.chunk`, `skills.upload.commit`(`operator.admin`)을 호출할 수 있습니다. 이는 신뢰할 수 있는 클라이언트를 위한 별도의 관리자 업로드 경로이며, 일반 ClawHub skill 설치 흐름이 아니고 `skills.install.allowUploadedArchives`가 활성화되지 않는 한 기본적으로 비활성화됩니다.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`는 해당 slug와 force 값에 바인딩된 업로드를 생성합니다.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })`는 정확히 디코딩된 오프셋에 바이트를 추가합니다.
  - `skills.upload.commit({ uploadId, sha256? })`는 최종 크기와 SHA-256을 검증합니다. 커밋은 업로드만 최종화하며, skill을 설치하지는 않습니다.
  - 업로드된 skill 아카이브는 `SKILL.md` 루트를 포함하는 zip 아카이브입니다. 아카이브의 내부 디렉터리 이름은 설치 대상을 절대 선택하지 않습니다.
- 운영자는 세 가지 모드로 `skills.install`(`operator.admin`)을 호출할 수 있습니다.
  - ClawHub 모드: `{ source: "clawhub", slug, version?, force? }`는 기본 에이전트 작업 영역 `skills/` 디렉터리에 skill 폴더를 설치합니다.
  - 업로드 모드: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`는 커밋된 업로드를 기본 에이전트 작업 영역 `skills/<slug>` 디렉터리에 설치합니다. slug와 force 값은 원래 `skills.upload.begin` 요청과 일치해야 합니다. 이 모드는 `skills.install.allowUploadedArchives`가 활성화되지 않으면 거부됩니다. 이 설정은 ClawHub 설치에 영향을 주지 않습니다.
  - Gateway 설치 관리자 모드: `{ name, installId, timeoutMs? }`는 Gateway 호스트에서 선언된 `metadata.openclaw.install` 작업을 실행합니다. 이전 클라이언트는 여전히 `dangerouslyForceUnsafeInstall`을 보낼 수 있습니다. 이 필드는 더 이상 사용되지 않으며, 프로토콜 호환성을 위해서만 허용되고 무시됩니다. 운영자 소유 설치 결정에는 `security.installPolicy`를 사용하세요.
- 운영자는 두 가지 모드로 `skills.update`(`operator.admin`)를 호출할 수 있습니다.
  - ClawHub 모드는 기본 에이전트 작업 영역에서 추적 중인 slug 하나 또는 추적 중인 모든 ClawHub 설치를 업데이트합니다.
  - 구성 모드는 `enabled`, `apiKey`, `env` 같은 `skills.entries.<skillKey>` 값을 패치합니다.

### `models.list` 보기

`models.list`는 선택적 `view` 매개변수를 받습니다.

- 생략 또는 `"default"`: 현재 런타임 동작입니다. `agents.defaults.models`가 구성된 경우 응답은 `provider/*` 항목에 대해 동적으로 발견된 모델을 포함한 허용된 카탈로그입니다. 그렇지 않으면 응답은 전체 Gateway 카탈로그입니다.
- `"configured"`: 선택기에 맞춘 동작입니다. `agents.defaults.models`가 구성된 경우 `provider/*` 항목에 대한 제공자 범위 발견을 포함해 여전히 우선합니다. 허용 목록이 없으면 응답은 명시적 `models.providers.*.models` 항목을 사용하고, 구성된 모델 행이 없을 때만 전체 카탈로그로 폴백합니다.
- `"all"`: `agents.defaults.models`를 우회하는 전체 Gateway 카탈로그입니다. 일반 모델 선택기가 아니라 진단 및 발견 UI에 사용하세요.

## Exec 승인

- exec 요청에 승인이 필요하면 Gateway는 `exec.approval.requested`를 브로드캐스트합니다.
- 운영자 클라이언트는 `exec.approval.resolve`를 호출하여 해결합니다(`operator.approvals` 범위 필요).
- `host=node`의 경우 `exec.approval.request`는 `systemRunPlan`(정식 `argv`/`cwd`/`rawCommand`/세션 메타데이터)을 포함해야 합니다. `systemRunPlan`이 없는 요청은 거부됩니다.
- 승인 후 전달된 `node.invoke system.run` 호출은 해당 정식 `systemRunPlan`을 권위 있는 명령/cwd/세션 컨텍스트로 재사용합니다.
- 호출자가 prepare와 최종 승인된 `system.run` 전달 사이에 `command`, `rawCommand`, `cwd`, `agentId`, 또는 `sessionKey`를 변경하면, Gateway는 변경된 페이로드를 신뢰하지 않고 실행을 거부합니다.

## 에이전트 전달 폴백

- `agent` 요청은 아웃바운드 전달을 요청하기 위해 `deliver=true`를 포함할 수 있습니다.
- `bestEffortDeliver=false`는 엄격한 동작을 유지합니다. 해석되지 않았거나 내부 전용인 전달 대상은 `INVALID_REQUEST`를 반환합니다.
- `bestEffortDeliver=true`는 외부로 전달 가능한 경로를 해석할 수 없을 때 세션 전용 실행으로 폴백할 수 있게 합니다. 예를 들어 내부/webchat 세션 또는 모호한 다중 채널 구성이 이에 해당합니다.
- 최종 `agent` 결과는 전달이 요청된 경우 `result.deliveryStatus`를 포함할 수 있으며, [`openclaw agent --json --deliver`](/ko/cli/agent#json-delivery-status)에 문서화된 동일한 `sent`, `suppressed`, `partial_failed`, `failed` 상태를 사용합니다.

## 버전 관리

- `PROTOCOL_VERSION`은 `packages/gateway-protocol/src/version.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 보냅니다. 서버는 현재 프로토콜을 포함하지 않는 범위를 거부합니다. 현재 클라이언트와 서버는 프로토콜 v4가 필요합니다.
- 스키마와 모델은 TypeBox 정의에서 생성됩니다.
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 클라이언트 상수

`src/gateway/client.ts`의 참조 클라이언트는 다음 기본값을 사용합니다. 값은 프로토콜 v4 전반에서 안정적이며, 서드 파티 클라이언트의 예상 기준선입니다.

| 상수                                      | 기본값                                                | 소스                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| 요청 시간 제한(RPC당)                    | `30_000` ms                                           | `src/gateway/client.ts`(`requestTimeoutMs`)                                                |
| 사전 인증 / 연결 챌린지 시간 제한        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`(config/env가 쌍을 이루는 서버/클라이언트 예산을 늘릴 수 있음) |
| 초기 재연결 백오프                        | `1_000` ms                                            | `src/gateway/client.ts`(`backoffMs`)                                                       |
| 최대 재연결 백오프                        | `30_000` ms                                           | `src/gateway/client.ts`(`scheduleReconnect`)                                               |
| device-token 종료 후 빠른 재시도 클램프   | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 전 강제 중지 유예           | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 기본 시간 제한            | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 기본 tick 간격(`hello-ok` 전)             | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick 시간 제한 종료                       | 침묵이 `tickIntervalMs * 2`를 초과하면 코드 `4000`    | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`(25 MB)                             | `src/gateway/server-constants.ts`                                                          |

서버는 `hello-ok`에서 유효한 `policy.tickIntervalMs`, `policy.maxPayload`, `policy.maxBufferedBytes`를 알립니다. 클라이언트는 핸드셰이크 전 기본값보다 이 값을 따라야 합니다.

## 인증

- 공유 비밀 Gateway 인증은 구성된 인증 모드에 따라 `connect.params.auth.token` 또는
  `connect.params.auth.password`를 사용합니다.
- Tailscale Serve(`gateway.auth.allowTailscale: true`) 또는 local loopback이 아닌
  `gateway.auth.mode: "trusted-proxy"` 같은 ID 포함 모드는
  `connect.params.auth.*` 대신 요청 헤더에서 연결 인증 검사를 충족합니다.
- 비공개 인그레스 `gateway.auth.mode: "none"`은 공유 비밀 연결 인증을
  완전히 건너뜁니다. 이 모드를 공개/신뢰할 수 없는 인그레스에 노출하지 마세요.
- 페어링 후 Gateway는 연결 역할 + 범위로 제한된 **디바이스 토큰**을 발급합니다.
  이 토큰은 `hello-ok.auth.deviceToken`에 반환되며, 클라이언트는 이후 연결을 위해
  이를 저장해야 합니다.
- 클라이언트는 성공적으로 연결한 후 기본 `hello-ok.auth.deviceToken`을 저장해야 합니다.
- 해당 **저장된** 디바이스 토큰으로 다시 연결할 때는 그 토큰에 대해 저장된
  승인된 범위 집합도 재사용해야 합니다. 이렇게 하면 이미 허용된 읽기/프로브/상태 접근을
  보존하고, 재연결이 더 좁은 암묵적 관리자 전용 범위로 조용히 축소되는 것을 방지합니다.
- 클라이언트 측 연결 인증 조립(`src/gateway/client.ts`의 `selectConnectAuth`):
  - `auth.password`는 독립적이며 설정된 경우 항상 전달됩니다.
  - `auth.token`은 우선순위에 따라 채워집니다. 명시적 공유 토큰이 먼저이고,
    그다음 명시적 `deviceToken`, 그다음 저장된 디바이스별 토큰(`deviceId` + `role` 기준)입니다.
  - `auth.bootstrapToken`은 위 항목 중 어느 것도 `auth.token`으로 해석되지 않은 경우에만 전송됩니다.
    공유 토큰이나 해석된 디바이스 토큰이 있으면 전송되지 않습니다.
  - 일회성 `AUTH_TOKEN_MISMATCH` 재시도에서 저장된 디바이스 토큰을 자동 승격하는 동작은
    **신뢰할 수 있는 엔드포인트에만** 제한됩니다. 즉 loopback이거나,
    고정된 `tlsFingerprint`가 있는 `wss://`입니다. 고정이 없는 공개 `wss://`는 해당되지 않습니다.
- 내장 설정 코드 부트스트랩은 기본 Node `hello-ok.auth.deviceToken`과 함께
  신뢰할 수 있는 모바일 핸드오프를 위한 제한된 운영자 토큰을
  `hello-ok.auth.deviceTokens`에 반환합니다. 운영자 토큰에는 네이티브 Talk 구성 읽기를 위한
  `operator.talk.secrets`가 포함되며, `operator.admin` 및 `operator.pairing`은 제외됩니다.
- 비기준선 설정 코드 부트스트랩이 승인을 기다리는 동안 `PAIRING_REQUIRED`
  세부 정보에는 `recommendedNextStep: "wait_then_retry"`, `retryable: true`,
  `pauseReconnect: false`가 포함됩니다. 클라이언트는 요청이 승인되거나 토큰이 무효화될 때까지
  동일한 부트스트랩 토큰으로 계속 재연결해야 합니다.
- 연결이 `wss://` 또는 loopback/local 페어링 같은 신뢰할 수 있는 전송에서
  부트스트랩 인증을 사용한 경우에만 `hello-ok.auth.deviceTokens`를 저장하세요.
- 클라이언트가 **명시적** `deviceToken` 또는 명시적 `scopes`를 제공하면,
  해당 호출자가 요청한 범위 집합이 계속 권위 있는 값입니다. 캐시된 범위는 클라이언트가
  저장된 디바이스별 토큰을 재사용할 때만 재사용됩니다.
- 디바이스 토큰은 `device.token.rotate` 및 `device.token.revoke`를 통해
  교체/폐기할 수 있습니다(`operator.pairing` 범위 필요). Node 또는 기타 비운영자 역할을
  교체하거나 폐기하려면 `operator.admin`도 필요합니다.
- `device.token.rotate`는 교체 메타데이터를 반환합니다. 동일한 디바이스 토큰으로 이미 인증된
  동일 디바이스 호출에 대해서만 대체 전달자 토큰을 에코하므로, 토큰 전용 클라이언트는
  재연결 전에 대체 토큰을 저장할 수 있습니다. 공유/관리자 교체는 전달자 토큰을 에코하지 않습니다.
- 토큰 발급, 교체, 폐기는 해당 디바이스의 페어링 항목에 기록된 승인된 역할 집합으로
  제한됩니다. 토큰 변경은 페어링 승인이 허용하지 않은 디바이스 역할로 확장하거나
  이를 대상으로 지정할 수 없습니다.
- 페어링된 디바이스 토큰 세션의 경우, 호출자에게 `operator.admin`도 없는 한
  디바이스 관리는 자기 범위로 제한됩니다. 관리자가 아닌 호출자는 **자신의** 디바이스 항목에 대한
  운영자 토큰만 관리할 수 있습니다. Node 및 기타 비운영자 토큰 관리는 호출자 자신의 디바이스라도
  관리자 전용입니다.
- `device.token.rotate` 및 `device.token.revoke`는 대상 운영자 토큰 범위 집합도
  호출자의 현재 세션 범위와 대조해 확인합니다. 관리자가 아닌 호출자는 자신이 이미 보유한 것보다
  더 넓은 운영자 토큰을 교체하거나 폐기할 수 없습니다.
- 인증 실패에는 `error.details.code`와 복구 힌트가 포함됩니다.
  - `error.details.canRetryWithDeviceToken`(불리언)
  - `error.details.recommendedNextStep`(`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH`에 대한 클라이언트 동작:
  - 신뢰할 수 있는 클라이언트는 캐시된 디바이스별 토큰으로 제한된 재시도를 한 번 시도할 수 있습니다.
  - 해당 재시도가 실패하면 클라이언트는 자동 재연결 루프를 중지하고 운영자 조치 안내를 표시해야 합니다.
- `AUTH_SCOPE_MISMATCH`는 디바이스 토큰이 인식되었지만 요청된 역할/범위를
  포함하지 않는다는 뜻입니다. 클라이언트는 이를 잘못된 토큰으로 표시하지 말고,
  운영자에게 다시 페어링하거나 더 좁거나 넓은 범위 계약을 승인하라고 안내해야 합니다.

## 디바이스 ID + 페어링

- Node는 키 쌍 지문에서 파생된 안정적인 디바이스 ID(`device.id`)를 포함해야 합니다.
- Gateway는 디바이스 + 역할별로 토큰을 발급합니다.
- local 자동 승인이 활성화되지 않은 한 새 디바이스 ID에는 페어링 승인이 필요합니다.
- 페어링 자동 승인은 직접 local loopback 연결을 중심으로 합니다.
- OpenClaw에는 신뢰할 수 있는 공유 비밀 헬퍼 흐름을 위한 좁은 백엔드/컨테이너 local 자기 연결 경로도 있습니다.
- 동일 호스트 tailnet 또는 LAN 연결은 여전히 페어링에서 원격으로 처리되며 승인이 필요합니다.
- WS 클라이언트는 일반적으로 `connect` 중에 `device` ID를 포함합니다(운영자 + Node).
  디바이스가 없는 운영자 예외는 명시적 신뢰 경로뿐입니다.
  - localhost 전용 비보안 HTTP 호환성을 위한 `gateway.controlUi.allowInsecureAuth=true`.
  - 성공적인 `gateway.auth.mode: "trusted-proxy"` 운영자 Control UI 인증.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`(비상용, 심각한 보안 저하).
  - 예약된 내부 헬퍼 경로에서 직접 loopback `gateway-client` 백엔드 RPC.
- 디바이스 ID를 생략하면 범위에 영향이 있습니다. 명시적 신뢰 경로를 통해 디바이스 없는 운영자
  연결이 허용되더라도, 해당 경로에 명명된 범위 보존 예외가 없는 한 OpenClaw는
  자체 선언 범위를 여전히 빈 집합으로 지웁니다. 그러면 범위로 제한된 메서드는
  `missing scope`로 실패합니다.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`는 Control UI 비상용
  범위 보존 경로입니다. 임의의 사용자 지정 백엔드 또는 CLI 형태 WebSocket 클라이언트에
  범위를 부여하지 않습니다.
- 예약된 직접 loopback `gateway-client` 백엔드 헬퍼 경로는 내부 local 제어 평면 RPC에 대해서만
  범위를 보존합니다. 사용자 지정 백엔드 ID는 이 예외를 받지 않습니다.
- 모든 연결은 서버가 제공한 `connect.challenge` nonce에 서명해야 합니다.

### 디바이스 인증 마이그레이션 진단

아직 챌린지 이전 서명 동작을 사용하는 레거시 클라이언트의 경우, 이제 `connect`는
안정적인 `error.details.reason`과 함께 `error.details.code` 아래에
`DEVICE_AUTH_*` 세부 코드를 반환합니다.

일반적인 마이그레이션 실패:

| 메시지                     | details.code                     | details.reason           | 의미                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 클라이언트가 `device.nonce`를 생략했습니다(또는 빈 값을 보냈습니다). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 클라이언트가 오래되었거나 잘못된 nonce로 서명했습니다. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 서명 페이로드가 v2 페이로드와 일치하지 않습니다. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 서명된 타임스탬프가 허용된 편차를 벗어났습니다. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`가 공개 키 지문과 일치하지 않습니다. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 공개 키 형식/정규화에 실패했습니다. |

마이그레이션 대상:

- 항상 `connect.challenge`를 기다립니다.
- 서버 nonce를 포함하는 v2 페이로드에 서명합니다.
- 동일한 nonce를 `connect.params.device.nonce`에 보냅니다.
- 권장 서명 페이로드는 `v3`이며, 이는 디바이스/클라이언트/역할/범위/토큰/nonce 필드에 더해
  `platform` 및 `deviceFamily`도 바인딩합니다.
- 레거시 `v2` 서명은 호환성을 위해 계속 허용되지만, 페어링된 디바이스
  메타데이터 고정은 재연결 시에도 명령 정책을 계속 제어합니다.

## TLS + 고정

- WS 연결에는 TLS가 지원됩니다.
- 클라이언트는 선택적으로 Gateway 인증서 지문을 고정할 수 있습니다(`gateway.tls`
  구성과 `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참조).

## 범위

이 프로토콜은 **전체 Gateway API**(상태, 채널, 모델, 채팅,
에이전트, 세션, Node, 승인 등)를 노출합니다. 정확한 표면은
`packages/gateway-protocol/src/schema.ts`의 TypeBox 스키마로 정의됩니다.

## 관련

- [브리지 프로토콜](/ko/gateway/bridge-protocol)
- [Gateway 런북](/ko/gateway)
