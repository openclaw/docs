---
read_when:
    - Gateway WS 클라이언트 구현 또는 업데이트
    - 프로토콜 불일치 또는 연결 실패 디버깅
    - 프로토콜 스키마/모델 재생성 중
summary: 'Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리'
title: Gateway 프로토콜
x-i18n:
    generated_at: "2026-04-30T06:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d922e9b4b778c333873e551498b905461f30f944e809555b45669ae2f5c404
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway WS 프로토콜은 OpenClaw의 **단일 제어 플레인 + Node 전송 계층**입니다.
모든 클라이언트(CLI, 웹 UI, macOS 앱, iOS/Android Node, 헤드리스 Node)는
WebSocket을 통해 연결하고 핸드셰이크 시점에 **role** + **scope**를 선언합니다.

## 전송

- WebSocket, JSON 페이로드가 있는 텍스트 프레임.
- 첫 번째 프레임은 **반드시** `connect` 요청이어야 합니다.
- 연결 전 프레임은 64 KiB로 제한됩니다. 핸드셰이크가 성공한 뒤에는 클라이언트가
  `hello-ok.policy.maxPayload` 및
  `hello-ok.policy.maxBufferedBytes` 제한을 따라야 합니다. 진단이 활성화된 경우,
  크기가 초과된 수신 프레임과 느린 송신 버퍼는 gateway가 해당 프레임을 닫거나 버리기 전에
  `payload.large` 이벤트를 내보냅니다. 이 이벤트는
  크기, 제한, 표면, 안전한 사유 코드를 보존합니다. 메시지
  본문, 첨부 파일 내용, 원시 프레임 본문, 토큰, 쿠키 또는 비밀 값은 보존하지 않습니다.

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
    "maxProtocol": 3,
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
    "protocol": 3,
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

Gateway가 아직 시작 사이드카를 마무리하는 동안에는 `connect` 요청이
`details.reason`이 `"startup-sidecars"`로 설정되고 `retryAfterMs`가 포함된
재시도 가능한 `UNAVAILABLE` 오류를 반환할 수 있습니다. 클라이언트는 해당 응답을
최종 핸드셰이크 실패로 표시하는 대신 전체 연결 예산 내에서 재시도해야 합니다.

`server`, `features`, `snapshot`, `policy`는 모두 스키마
(`src/gateway/protocol/schema/frames.ts`)에서 필수입니다. `auth`도 필수이며
협상된 role/scopes를 보고합니다. `canvasHostUrl`은 선택 사항입니다.

기기 토큰이 발급되지 않으면 `hello-ok.auth`는 토큰 필드 없이 협상된
권한을 보고합니다.

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

신뢰할 수 있는 동일 프로세스 백엔드 클라이언트(`client.id: "gateway-client"`,
`client.mode: "backend"`)는 공유 gateway 토큰/비밀번호로 인증하는 직접 루프백 연결에서
`device`를 생략할 수 있습니다. 이 경로는 내부 제어 플레인 RPC용으로 예약되어 있으며,
오래된 CLI/기기 페어링 기준선이 서브에이전트 세션 업데이트 같은 로컬 백엔드 작업을
차단하지 않도록 합니다. 원격 클라이언트, 브라우저 출처 클라이언트, Node 클라이언트,
명시적 기기 토큰/기기 ID 클라이언트는 계속 일반 페어링 및 scope 업그레이드 검사를 사용합니다.

기기 토큰이 발급되면 `hello-ok`에는 다음도 포함됩니다.

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

신뢰할 수 있는 부트스트랩 인계 중에는 `hello-ok.auth`에 `deviceTokens`의
추가 제한된 role 항목도 포함될 수 있습니다.

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

내장 Node/operator 부트스트랩 흐름의 경우 기본 Node 토큰은
`scopes: []`로 유지되며, 인계된 operator 토큰은 부트스트랩
operator 허용 목록(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`)으로 계속 제한됩니다. 부트스트랩 scope 검사는
role 접두사를 유지합니다. operator 항목은 operator 요청만 충족하며, operator가 아닌
role은 여전히 자체 role 접두사 아래의 scope가 필요합니다.

### Node 예시

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

## Role + scope

### Role

- `operator` = 제어 플레인 클라이언트(CLI/UI/자동화).
- `node` = 기능 호스트(camera/screen/canvas/system.run).

### Scope(operator)

일반적인 scope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`가 있는 `talk.config`에는 `operator.talk.secrets`
(또는 `operator.admin`)가 필요합니다.

Plugin 등록 gateway RPC 메서드는 자체 operator scope를 요청할 수 있지만,
예약된 핵심 관리자 접두사(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 항상 `operator.admin`으로 해석됩니다.

메서드 scope는 첫 번째 게이트일 뿐입니다. `chat.send`를 통해 도달하는 일부 슬래시 명령은
그 위에 더 엄격한 명령 수준 검사를 적용합니다. 예를 들어, 영구적인
`/config set` 및 `/config unset` 쓰기에는 `operator.admin`이 필요합니다.

`node.pair.approve`에는 기본 메서드 scope 위에 승인 시점 scope 검사가
추가로 있습니다.

- 명령이 없는 요청: `operator.pairing`
- exec가 아닌 Node 명령이 있는 요청: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` 또는 `system.which`가 포함된 요청:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions(Node)

Node는 연결 시점에 기능 클레임을 선언합니다.

- `caps`: 상위 수준 기능 범주.
- `commands`: 호출용 명령 허용 목록.
- `permissions`: 세분화된 토글(예: `screen.record`, `camera.capture`).

Gateway는 이를 **클레임**으로 취급하고 서버 측 허용 목록을 강제합니다.

## Presence

- `system-presence`는 기기 ID를 키로 하는 항목을 반환합니다.
- Presence 항목에는 `deviceId`, `roles`, `scopes`가 포함되어 UI가 동일 기기가
  **operator**와 **node** 둘 다로 연결된 경우에도 기기당 단일 행을 표시할 수 있습니다.
- `node.list`에는 선택적 `lastSeenAtMs` 및 `lastSeenReason` 필드가 포함됩니다. 연결된 Node는
  현재 연결 시간을 `lastSeenAtMs`로, 사유를 `connect`로 보고합니다. 페어링된 Node는 신뢰할 수 있는 Node 이벤트가
  페어링 메타데이터를 업데이트할 때 지속적인 백그라운드 presence도 보고할 수 있습니다.

### Node 백그라운드 alive 이벤트

Node는 페어링된 Node가 백그라운드 wake 중 살아 있었음을 연결된 것으로 표시하지 않고 기록하기 위해
`event: "node.presence.alive"`로 `node.event`를 호출할 수 있습니다.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger`는 닫힌 enum입니다: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` 또는 `connect`. 알 수 없는 trigger 문자열은 지속화 전에
gateway에서 `background`로 정규화됩니다. 이 이벤트는 인증된 Node
기기 세션에 대해서만 지속됩니다. 기기가 없거나 페어링되지 않은 세션은 `handled: false`를 반환합니다.

성공한 gateway는 구조화된 결과를 반환합니다.

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

이전 gateway는 `node.event`에 대해 여전히 `{ "ok": true }`를 반환할 수 있습니다. 클라이언트는 이를
지속적인 presence 저장이 아니라 승인된 RPC로 취급해야 합니다.

## 브로드캐스트 이벤트 scope 지정

서버가 푸시하는 WebSocket 브로드캐스트 이벤트는 scope로 게이트되어 페어링 scope만 있는 세션이나 Node 전용 세션이 세션 콘텐츠를 수동으로 받지 않도록 합니다.

- **채팅, 에이전트, 도구 결과 프레임**(스트리밍된 `agent` 이벤트 및 도구 호출 결과 포함)에는 최소 `operator.read`가 필요합니다. `operator.read`가 없는 세션은 이러한 프레임을 완전히 건너뜁니다.
- **Plugin 정의 `plugin.*` 브로드캐스트**는 Plugin이 등록한 방식에 따라 `operator.write` 또는 `operator.admin`으로 게이트됩니다.
- **상태 및 전송 이벤트**(`heartbeat`, `presence`, `tick`, 연결/연결 해제 수명 주기 등)는 모든 인증된 세션에서 전송 상태를 관찰할 수 있도록 제한되지 않은 상태로 유지됩니다.
- **알 수 없는 브로드캐스트 이벤트 계열**은 등록된 핸들러가 명시적으로 완화하지 않는 한 기본적으로 scope로 게이트됩니다(fail-closed).

각 클라이언트 연결은 자체 클라이언트별 시퀀스 번호를 유지하므로, 서로 다른 클라이언트가 이벤트 스트림의 서로 다른 scope 필터링된 하위 집합을 보더라도 브로드캐스트는 해당 소켓에서 단조 증가 순서를 보존합니다.

## 일반 RPC 메서드 계열

공개 WS 표면은 위의 핸드셰이크/auth 예시보다 더 넓습니다. 이는
생성된 덤프가 아닙니다. `hello-ok.features.methods`는
`src/gateway/server-methods-list.ts`와 로드된
Plugin/channel 메서드 export를 기반으로 만든 보수적인 발견 목록입니다. 이를
`src/gateway/server-methods/*.ts`의 전체 열거가 아니라 기능 발견으로 취급하세요.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health`는 캐시된 또는 새로 프로브한 gateway 상태 스냅샷을 반환합니다.
    - `diagnostics.stability`는 최근의 제한된 진단 안정성 레코더를 반환합니다. 이벤트 이름, 개수, 바이트 크기, 메모리 판독값, 큐/세션 상태, channel/Plugin 이름, 세션 ID 같은 운영 메타데이터를 보존합니다. 채팅 텍스트, webhook 본문, 도구 출력, 원시 요청 또는 응답 본문, 토큰, 쿠키, 비밀 값은 보존하지 않습니다. Operator 읽기 scope가 필요합니다.
    - `status`는 `/status` 스타일 gateway 요약을 반환합니다. 민감한 필드는 관리자 scope가 있는 operator 클라이언트에만 포함됩니다.
    - `gateway.identity.get`은 relay 및 페어링 흐름에서 사용하는 gateway 기기 ID를 반환합니다.
    - `system-presence`는 연결된 operator/Node 기기의 현재 presence 스냅샷을 반환합니다.
    - `system-event`는 시스템 이벤트를 추가하고 presence 컨텍스트를 업데이트/브로드캐스트할 수 있습니다.
    - `last-heartbeat`는 최신 지속 저장된 Heartbeat 이벤트를 반환합니다.
    - `set-heartbeats`는 gateway에서 Heartbeat 처리를 전환합니다.

  </Accordion>

  <Accordion title="모델 및 사용량">
    - `models.list`는 런타임에서 허용되는 모델 카탈로그를 반환합니다. 선택기 크기의 구성된 모델(`agents.defaults.models`가 먼저, 그다음 `models.providers.*.models`)에는 `{ "view": "configured" }`를 전달하고, 전체 카탈로그에는 `{ "view": "all" }`을 전달합니다.
    - `usage.status`는 제공자 사용량 창/남은 할당량 요약을 반환합니다.
    - `usage.cost`는 날짜 범위에 대한 집계된 비용 사용량 요약을 반환합니다.
    - `doctor.memory.status`는 활성 기본 에이전트 워크스페이스의 벡터 메모리 / 캐시된 임베딩 준비 상태를 반환합니다. 호출자가 명시적으로 실시간 임베딩 제공자 핑을 원하는 경우에만 `{ "probe": true }` 또는 `{ "deep": true }`를 전달합니다.
    - `doctor.memory.remHarness`는 원격 제어 플레인 클라이언트를 위한 제한된 읽기 전용 REM 하네스 미리보기를 반환합니다. 워크스페이스 경로, 메모리 스니펫, 렌더링된 근거 기반 마크다운, 심층 승격 후보를 포함할 수 있으므로 호출자에게는 `operator.read`가 필요합니다.
    - `sessions.usage`는 세션별 사용량 요약을 반환합니다.
    - `sessions.usage.timeseries`는 한 세션의 시계열 사용량을 반환합니다.
    - `sessions.usage.logs`는 한 세션의 사용량 로그 항목을 반환합니다.

  </Accordion>

  <Accordion title="채널 및 로그인 헬퍼">
    - `channels.status`는 내장 + 번들 채널/Plugin 상태 요약을 반환합니다.
    - `channels.logout`은 채널이 로그아웃을 지원하는 경우 특정 채널/계정에서 로그아웃합니다.
    - `web.login.start`는 현재 QR 지원 웹 채널 제공자의 QR/웹 로그인 흐름을 시작합니다.
    - `web.login.wait`는 해당 QR/웹 로그인 흐름이 완료될 때까지 기다리고 성공 시 채널을 시작합니다.
    - `push.test`는 등록된 iOS Node로 테스트 APNs 푸시를 보냅니다.
    - `voicewake.get`은 저장된 깨우기 단어 트리거를 반환합니다.
    - `voicewake.set`은 깨우기 단어 트리거를 업데이트하고 변경 사항을 브로드캐스트합니다.

  </Accordion>

  <Accordion title="메시징 및 로그">
    - `send`는 채팅 러너 외부에서 채널/계정/스레드 대상으로 보내는 직접 아웃바운드 전달 RPC입니다.
    - `logs.tail`은 커서/제한 및 최대 바이트 제어가 포함된 구성된 Gateway 파일 로그 꼬리를 반환합니다.

  </Accordion>

  <Accordion title="대화 및 TTS">
    - `talk.config`는 유효한 대화 구성 페이로드를 반환합니다. `includeSecrets`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.
    - `talk.mode`는 WebChat/Control UI 클라이언트의 현재 대화 모드 상태를 설정/브로드캐스트합니다.
    - `talk.speak`는 활성 대화 음성 제공자를 통해 음성을 합성합니다.
    - `tts.status`는 TTS 활성화 상태, 활성 제공자, 대체 제공자, 제공자 구성 상태를 반환합니다.
    - `tts.providers`는 표시 가능한 TTS 제공자 인벤토리를 반환합니다.
    - `tts.enable` 및 `tts.disable`은 TTS 기본 설정 상태를 전환합니다.
    - `tts.setProvider`는 선호 TTS 제공자를 업데이트합니다.
    - `tts.convert`는 일회성 텍스트 음성 변환을 실행합니다.

  </Accordion>

  <Accordion title="시크릿, 구성, 업데이트 및 마법사">
    - `secrets.reload`는 활성 SecretRef를 다시 해석하고 전체 성공 시에만 런타임 시크릿 상태를 교체합니다.
    - `secrets.resolve`는 특정 명령/대상 집합에 대한 명령 대상 시크릿 할당을 해석합니다.
    - `config.get`은 현재 구성 스냅샷과 해시를 반환합니다.
    - `config.set`은 검증된 구성 페이로드를 씁니다.
    - `config.patch`는 부분 구성 업데이트를 병합합니다.
    - `config.apply`는 전체 구성 페이로드를 검증하고 교체합니다.
    - `config.schema`는 Control UI 및 CLI 도구에서 사용하는 실시간 구성 스키마 페이로드를 반환합니다. 여기에는 스키마, `uiHints`, 버전, 생성 메타데이터가 포함되며, 런타임이 로드할 수 있는 경우 Plugin + 채널 스키마 메타데이터도 포함됩니다. 이 스키마에는 UI에서 사용하는 동일한 레이블과 도움말 텍스트에서 파생된 필드 `title` / `description` 메타데이터가 포함되며, 일치하는 필드 문서가 있을 때 중첩 객체, 와일드카드, 배열 항목, `anyOf` / `oneOf` / `allOf` 조합 분기도 포함됩니다.
    - `config.schema.lookup`은 하나의 구성 경로에 대해 경로 범위 조회 페이로드를 반환합니다. 정규화된 경로, 얕은 스키마 노드, 일치한 힌트 + `hintPath`, UI/CLI 드릴다운을 위한 즉시 하위 요약이 포함됩니다. 조회 스키마 노드는 사용자 대상 문서와 일반 검증 필드(`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, 숫자/문자열/배열/객체 경계, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` 같은 플래그)를 유지합니다. 하위 요약은 `key`, 정규화된 `path`, `type`, `required`, `hasChildren`, 그리고 일치한 `hint` / `hintPath`를 노출합니다.
    - `update.run`은 Gateway 업데이트 흐름을 실행하고 업데이트 자체가 성공한 경우에만 재시작을 예약합니다.
    - `update.status`는 사용 가능한 경우 재시작 후 실행 중인 버전을 포함하여, 최신 캐시된 업데이트 재시작 센티널을 반환합니다.
    - `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel`은 WS RPC를 통해 온보딩 마법사를 노출합니다.

  </Accordion>

  <Accordion title="에이전트 및 워크스페이스 헬퍼">
    - `agents.list`는 유효 모델과 런타임 메타데이터를 포함하여 구성된 에이전트 항목을 반환합니다.
    - `agents.create`, `agents.update`, `agents.delete`는 에이전트 레코드와 워크스페이스 연결을 관리합니다.
    - `agents.files.list`, `agents.files.get`, `agents.files.set`은 에이전트에 노출된 부트스트랩 워크스페이스 파일을 관리합니다.
    - `agent.identity.get`은 에이전트 또는 세션의 유효한 어시스턴트 ID를 반환합니다.
    - `agent.wait`는 실행이 끝날 때까지 기다리고 사용 가능한 경우 터미널 스냅샷을 반환합니다.

  </Accordion>

  <Accordion title="세션 제어">
    - `sessions.list`는 현재 세션 인덱스를 반환하며, 에이전트 런타임 백엔드가 구성된 경우 행별 `agentRuntime` 메타데이터를 포함합니다.
    - `sessions.subscribe` 및 `sessions.unsubscribe`는 현재 WS 클라이언트에 대한 세션 변경 이벤트 구독을 전환합니다.
    - `sessions.messages.subscribe` 및 `sessions.messages.unsubscribe`는 한 세션에 대한 기록/메시지 이벤트 구독을 전환합니다.
    - `sessions.preview`는 특정 세션 키에 대한 제한된 기록 미리보기를 반환합니다.
    - `sessions.resolve`는 세션 대상을 해석하거나 정준화합니다.
    - `sessions.create`는 새 세션 항목을 생성합니다.
    - `sessions.send`는 기존 세션으로 메시지를 보냅니다.
    - `sessions.steer`는 활성 세션에 대한 중단 후 조향 변형입니다.
    - `sessions.abort`는 세션의 활성 작업을 중단합니다. 호출자는 `key`와 선택적 `runId`를 전달하거나, Gateway가 세션으로 해석할 수 있는 활성 실행에 대해 `runId`만 전달할 수 있습니다.
    - `sessions.patch`는 세션 메타데이터/오버라이드를 업데이트하고 해석된 정준 모델과 유효 `agentRuntime`을 보고합니다.
    - `sessions.reset`, `sessions.delete`, `sessions.compact`는 세션 유지 관리를 수행합니다.
    - `sessions.get`은 저장된 전체 세션 행을 반환합니다.
    - 채팅 실행은 여전히 `chat.history`, `chat.send`, `chat.abort`, `chat.inject`를 사용합니다. `chat.history`는 UI 클라이언트를 위해 표시 정규화됩니다. 인라인 지시문 태그는 보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰이 제거되며, 정확한 `NO_REPLY` / `no_reply` 같은 순수 무음 토큰 어시스턴트 행은 생략되고, 너무 큰 행은 자리표시자로 대체될 수 있습니다.

  </Accordion>

  <Accordion title="기기 페어링 및 기기 토큰">
    - `device.pair.list`는 대기 중 및 승인된 페어링 기기를 반환합니다.
    - `device.pair.approve`, `device.pair.reject`, `device.pair.remove`는 기기 페어링 레코드를 관리합니다.
    - `device.token.rotate`는 승인된 역할 및 호출자 범위 경계 내에서 페어링된 기기 토큰을 회전합니다.
    - `device.token.revoke`는 승인된 역할 및 호출자 범위 경계 내에서 페어링된 기기 토큰을 취소합니다.

  </Accordion>

  <Accordion title="Node 페어링, 호출 및 대기 작업">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.pair.verify`는 Node 페어링과 부트스트랩 검증을 다룹니다.
    - `node.list` 및 `node.describe`는 알려진/연결된 Node 상태를 반환합니다.
    - `node.rename`은 페어링된 Node 레이블을 업데이트합니다.
    - `node.invoke`는 명령을 연결된 Node로 전달합니다.
    - `node.invoke.result`는 호출 요청에 대한 결과를 반환합니다.
    - `node.event`는 Node에서 발생한 이벤트를 Gateway로 다시 전달합니다.
    - `node.canvas.capability.refresh`는 범위 지정된 캔버스 기능 토큰을 새로 고칩니다.
    - `node.pending.pull` 및 `node.pending.ack`는 연결된 Node 큐 API입니다.
    - `node.pending.enqueue` 및 `node.pending.drain`은 오프라인/연결 해제된 Node의 내구성 있는 대기 작업을 관리합니다.

  </Accordion>

  <Accordion title="승인 계열">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve`는 일회성 exec 승인 요청과 대기 중 승인 조회/재실행을 다룹니다.
    - `exec.approval.waitDecision`은 대기 중인 하나의 exec 승인 결정을 기다리고 최종 결정(또는 시간 초과 시 `null`)을 반환합니다.
    - `exec.approvals.get` 및 `exec.approvals.set`은 Gateway exec 승인 정책 스냅샷을 관리합니다.
    - `exec.approvals.node.get` 및 `exec.approvals.node.set`은 Node 릴레이 명령을 통해 Node 로컬 exec 승인 정책을 관리합니다.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve`는 Plugin 정의 승인 흐름을 다룹니다.

  </Accordion>

  <Accordion title="자동화, Skills 및 도구">
    - 자동화: `wake`는 즉시 또는 다음 Heartbeat 깨우기 텍스트 삽입을 예약합니다. `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs`는 예약된 작업을 관리합니다.
    - Skills 및 도구: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### 일반 이벤트 계열

- `chat`: `chat.inject` 같은 UI 채팅 업데이트 및 기타 기록 전용 채팅
  이벤트입니다.
- `session.message` 및 `session.tool`: 구독된 세션의 기록/이벤트 스트림
  업데이트입니다.
- `sessions.changed`: 세션 인덱스 또는 메타데이터가 변경되었습니다.
- `presence`: 시스템 현재 상태 스냅샷 업데이트입니다.
- `tick`: 주기적인 keepalive / 활성 상태 이벤트입니다.
- `health`: Gateway 상태 스냅샷 업데이트입니다.
- `heartbeat`: Heartbeat 이벤트 스트림 업데이트입니다.
- `cron`: Cron 실행/작업 변경 이벤트입니다.
- `shutdown`: Gateway 종료 알림입니다.
- `node.pair.requested` / `node.pair.resolved`: Node 페어링 수명 주기입니다.
- `node.invoke.request`: Node 호출 요청 브로드캐스트입니다.
- `device.pair.requested` / `device.pair.resolved`: 페어링된 기기 수명 주기입니다.
- `voicewake.changed`: 깨우기 단어 트리거 구성이 변경되었습니다.
- `exec.approval.requested` / `exec.approval.resolved`: exec 승인
  수명 주기입니다.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin 승인
  수명 주기입니다.

### Node 헬퍼 메서드

- Node는 자동 허용 검사를 위한 현재 스킬 실행 파일 목록을 가져오기 위해
  `skills.bins`를 호출할 수 있습니다.

### 운영자 헬퍼 메서드

- 운영자는 `commands.list`(`operator.read`)를 호출하여 에이전트의 런타임
  명령 인벤토리를 가져올 수 있습니다.
  - `agentId`는 선택 사항입니다. 기본 에이전트 워크스페이스를 읽으려면 생략하세요.
  - `scope`는 기본 `name`이 대상으로 삼는 표면을 제어합니다.
    - `text`는 앞의 `/` 없이 기본 텍스트 명령 토큰을 반환합니다.
    - `native`와 기본값인 `both` 경로는 사용 가능한 경우 제공자 인식 네이티브 이름을 반환합니다.
  - `textAliases`는 `/model` 및 `/m` 같은 정확한 슬래시 별칭을 담습니다.
  - `nativeName`은 존재하는 경우 제공자 인식 네이티브 명령 이름을 담습니다.
  - `provider`는 선택 사항이며 네이티브 이름 지정과 네이티브 Plugin
    명령 사용 가능 여부에만 영향을 줍니다.
  - `includeArgs=false`는 응답에서 직렬화된 인수 메타데이터를 생략합니다.
- 운영자는 `tools.catalog`(`operator.read`)를 호출하여 에이전트의 런타임 도구 카탈로그를 가져올 수 있습니다. 응답에는 그룹화된 도구와 출처 메타데이터가 포함됩니다.
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"`일 때 Plugin 소유자
  - `optional`: Plugin 도구가 선택 사항인지 여부
- 운영자는 `tools.effective`(`operator.read`)를 호출하여 세션에 대해 런타임에서 유효한 도구
  인벤토리를 가져올 수 있습니다.
  - `sessionKey`는 필수입니다.
  - Gateway는 호출자가 제공한 인증 또는 전달 컨텍스트를 수락하는 대신 세션에서 서버 측의 신뢰할 수 있는 런타임 컨텍스트를 도출합니다.
  - 응답은 세션 범위로 제한되며, 코어, Plugin, 채널 도구를 포함해 활성 대화가 지금 사용할 수 있는 항목을 반영합니다.
- 운영자는 `skills.status`(`operator.read`)를 호출하여 에이전트에 표시되는
  Skill 인벤토리를 가져올 수 있습니다.
  - `agentId`는 선택 사항입니다. 기본 에이전트 워크스페이스를 읽으려면 생략하세요.
  - 응답에는 원시 비밀 값을 노출하지 않고 적격성, 누락된 요구 사항, 구성 검사,
    정리된 설치 옵션이 포함됩니다.
- 운영자는 ClawHub 발견 메타데이터를 위해 `skills.search`와 `skills.detail`(`operator.read`)을 호출할 수 있습니다.
- 운영자는 두 가지 모드로 `skills.install`(`operator.admin`)을 호출할 수 있습니다.
  - ClawHub 모드: `{ source: "clawhub", slug, version?, force? }`는
    기본 에이전트 워크스페이스의 `skills/` 디렉터리에 Skill 폴더를 설치합니다.
  - Gateway 설치 관리자 모드: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`는
    Gateway 호스트에서 선언된 `metadata.openclaw.install` 동작을 실행합니다.
- 운영자는 두 가지 모드로 `skills.update`(`operator.admin`)를 호출할 수 있습니다.
  - ClawHub 모드는 기본 에이전트 워크스페이스에서 추적 중인 슬러그 하나 또는 추적 중인 모든 ClawHub 설치를 업데이트합니다.
  - 구성 모드는 `enabled`, `apiKey`, `env` 같은 `skills.entries.<skillKey>` 값을 패치합니다.

### `models.list` 보기

`models.list`는 선택적 `view` 매개변수를 받습니다.

- 생략 또는 `"default"`: 현재 런타임 동작입니다. `agents.defaults.models`가 구성되어 있으면 응답은 허용된 카탈로그입니다. 그렇지 않으면 응답은 전체 Gateway 카탈로그입니다.
- `"configured"`: 선택기에 맞춘 동작입니다. `agents.defaults.models`가 구성되어 있으면 여전히 우선합니다. 그렇지 않으면 응답은 명시적 `models.providers.*.models` 항목을 사용하며, 구성된 모델 행이 없을 때만 전체 카탈로그로 대체됩니다.
- `"all"`: 전체 Gateway 카탈로그이며 `agents.defaults.models`를 우회합니다. 일반 모델 선택기가 아니라 진단 및 발견 UI에 사용하세요.

## 실행 승인

- 실행 요청에 승인이 필요하면 Gateway가 `exec.approval.requested`를 브로드캐스트합니다.
- 운영자 클라이언트는 `exec.approval.resolve`를 호출하여 해결합니다(`operator.approvals` 범위 필요).
- `host=node`의 경우 `exec.approval.request`에는 `systemRunPlan`(표준 `argv`/`cwd`/`rawCommand`/세션 메타데이터)이 포함되어야 합니다. `systemRunPlan`이 없는 요청은 거부됩니다.
- 승인 후 전달된 `node.invoke system.run` 호출은 해당 표준
  `systemRunPlan`을 권위 있는 명령/cwd/세션 컨텍스트로 재사용합니다.
- 호출자가 준비와 최종 승인된 `system.run` 전달 사이에 `command`, `rawCommand`, `cwd`, `agentId` 또는
  `sessionKey`를 변경하면, Gateway는 변경된 페이로드를 신뢰하는 대신 실행을 거부합니다.

## 에이전트 전달 폴백

- `agent` 요청에는 아웃바운드 전달을 요청하기 위해 `deliver=true`를 포함할 수 있습니다.
- `bestEffortDeliver=false`는 엄격한 동작을 유지합니다. 해석되지 않았거나 내부 전용인 전달 대상은 `INVALID_REQUEST`를 반환합니다.
- `bestEffortDeliver=true`는 외부로 전달 가능한 경로를 해석할 수 없을 때 세션 전용 실행으로 폴백할 수 있게 합니다(예: 내부/웹챗 세션 또는 모호한 다중 채널 구성).

## 버전 관리

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema/protocol-schemas.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 보내며, 서버는 불일치를 거부합니다.
- 스키마와 모델은 TypeBox 정의에서 생성됩니다.
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 클라이언트 상수

`src/gateway/client.ts`의 참조 클라이언트는 다음 기본값을 사용합니다. 값은
프로토콜 v3 전체에서 안정적이며 서드파티 클라이언트에 기대되는 기준선입니다.

| 상수                                      | 기본값                                                | 소스                                                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| 요청 제한 시간(RPC당)                    | `30_000` ms                                           | `src/gateway/client.ts`(`requestTimeoutMs`)                                                |
| 사전 인증 / 연결 챌린지 제한 시간        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts`(구성/env로 짝을 이루는 서버/클라이언트 예산을 늘릴 수 있음) |
| 초기 재연결 백오프                       | `1_000` ms                                            | `src/gateway/client.ts`(`backoffMs`)                                                       |
| 최대 재연결 백오프                       | `30_000` ms                                           | `src/gateway/client.ts`(`scheduleReconnect`)                                               |
| 디바이스 토큰 종료 후 빠른 재시도 제한   | `250` ms                                              | `src/gateway/client.ts`                                                                    |
| `terminate()` 전 강제 중지 유예           | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| `stopAndWait()` 기본 제한 시간            | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| 기본 틱 간격(`hello-ok` 이전)             | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| 틱 제한 시간 종료                        | 침묵이 `tickIntervalMs * 2`를 초과하면 코드 `4000`    | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024`(25 MB)                             | `src/gateway/server-constants.ts`                                                          |

서버는 유효한 `policy.tickIntervalMs`, `policy.maxPayload`,
`policy.maxBufferedBytes`를 `hello-ok`에서 알립니다. 클라이언트는 핸드셰이크 전 기본값보다
이 값을 따라야 합니다.

## 인증

- 공유 비밀 Gateway 인증은 구성된 인증 모드에 따라 `connect.params.auth.token` 또는
  `connect.params.auth.password`를 사용합니다.
- Tailscale Serve(`gateway.auth.allowTailscale: true`) 또는 local loopback이 아닌
  `gateway.auth.mode: "trusted-proxy"` 같은 ID 포함 모드는
  `connect.params.auth.*` 대신 요청 헤더에서 연결 인증 검사를 충족합니다.
- 비공개 인그레스 `gateway.auth.mode: "none"`은 공유 비밀 연결 인증을
  완전히 건너뜁니다. 이 모드를 공개/신뢰할 수 없는 인그레스에 노출하지 마세요.
- 페어링 후 Gateway는 연결 역할 + 범위에 제한된 **디바이스 토큰**을 발급합니다.
  이는 `hello-ok.auth.deviceToken`에 반환되며 클라이언트가 이후 연결을 위해
  유지해야 합니다.
- 클라이언트는 성공적인 연결 후 기본 `hello-ok.auth.deviceToken`을 유지해야 합니다.
- 해당 **저장된** 디바이스 토큰으로 재연결할 때는 그 토큰에 대해 저장된
  승인된 범위 집합도 재사용해야 합니다. 이렇게 하면 이미 부여된 읽기/프로브/상태 접근 권한이
  보존되고, 재연결이 더 좁은 암시적 관리자 전용 범위로 조용히 축소되는 일을 피할 수 있습니다.
- 클라이언트 측 연결 인증 조립(`src/gateway/client.ts`의 `selectConnectAuth`):
  - `auth.password`는 독립적이며 설정된 경우 항상 전달됩니다.
  - `auth.token`은 우선순위에 따라 채워집니다. 먼저 명시적 공유 토큰,
    그다음 명시적 `deviceToken`, 그다음 저장된 디바이스별 토큰(`deviceId` + `role`로 키 지정)입니다.
  - `auth.bootstrapToken`은 위 항목 중 어느 것도 `auth.token`으로 해석되지 않았을 때만 전송됩니다. 공유 토큰 또는 해석된 디바이스 토큰은 이를 억제합니다.
  - 단발성 `AUTH_TOKEN_MISMATCH` 재시도에서 저장된 디바이스 토큰의 자동 승격은 **신뢰할 수 있는 엔드포인트에서만** 허용됩니다.
    local loopback 또는 고정된 `tlsFingerprint`가 있는 `wss://`입니다. 고정이 없는 공개 `wss://`는 해당하지 않습니다.
- 추가 `hello-ok.auth.deviceTokens` 항목은 부트스트랩 인계 토큰입니다.
  연결이 `wss://` 또는 loopback/local 페어링 같은 신뢰할 수 있는 전송에서 부트스트랩 인증을 사용한 경우에만 이를 유지하세요.
- 클라이언트가 **명시적** `deviceToken` 또는 명시적 `scopes`를 제공하면,
  해당 호출자가 요청한 범위 집합이 계속 권위 있습니다. 캐시된 범위는 클라이언트가 저장된 디바이스별 토큰을 재사용할 때만
  재사용됩니다.
- 디바이스 토큰은 `device.token.rotate` 및
  `device.token.revoke`를 통해 회전/폐기할 수 있습니다(`operator.pairing` 범위 필요).
- `device.token.rotate`는 회전 메타데이터를 반환합니다. 동일 디바이스 호출이 이미
  해당 디바이스 토큰으로 인증된 경우에만 대체 bearer 토큰을 그대로 반환하므로,
  토큰 전용 클라이언트는 재연결 전에 대체 토큰을 유지할 수 있습니다. 공유/관리자 회전은 bearer 토큰을 그대로 반환하지 않습니다.
- 토큰 발급, 회전, 폐기는 해당 디바이스의 페어링 항목에 기록된 승인된 역할 집합으로 제한됩니다.
  토큰 변경은 페어링 승인이 부여하지 않은 디바이스 역할로 확장하거나 이를 대상으로 삼을 수 없습니다.
- 페어링된 디바이스 토큰 세션의 경우, 호출자에게 `operator.admin`도 있지 않다면 디바이스 관리는 자기 범위로 제한됩니다. 관리자가 아닌 호출자는
  자신의 **고유** 디바이스 항목만 제거/폐기/회전할 수 있습니다.
- `device.token.rotate`와 `device.token.revoke`는 대상 운영자
  토큰 범위 집합도 호출자의 현재 세션 범위와 대조해 확인합니다. 관리자가 아닌 호출자는 이미 보유한 것보다 더 넓은 운영자 토큰을
  회전하거나 폐기할 수 없습니다.
- 인증 실패에는 `error.details.code`와 복구 힌트가 포함됩니다.
  - `error.details.canRetryWithDeviceToken`(boolean)
  - `error.details.recommendedNextStep`(`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH`에 대한 클라이언트 동작:
  - 신뢰할 수 있는 클라이언트는 캐시된 디바이스별 토큰으로 제한된 재시도 1회를 시도할 수 있습니다.
  - 해당 재시도가 실패하면 클라이언트는 자동 재연결 루프를 중지하고 운영자 조치 안내를 표시해야 합니다.

## 디바이스 ID + 페어링

- Node에는 키 쌍 지문에서 파생된 안정적인 장치 ID(`device.id`)가 포함되어야 합니다.
- Gateway는 장치 + 역할별로 토큰을 발급합니다.
- local 자동 승인이 활성화되어 있지 않은 한 새 장치 ID에는 페어링 승인이 필요합니다.
- 페어링 자동 승인은 직접 local loopback 연결을 중심으로 합니다.
- OpenClaw에는 신뢰할 수 있는 공유 비밀 헬퍼 흐름을 위한 좁은 백엔드/컨테이너-local 자체 연결 경로도 있습니다.
- 동일 호스트 tailnet 또는 LAN 연결도 페어링에서는 여전히 원격으로 취급되며 승인이 필요합니다.
- WS 클라이언트는 일반적으로 `connect` 중에 `device` ID를 포함합니다(운영자 + Node). 장치 없는 운영자 예외는 명시적 신뢰 경로뿐입니다.
  - localhost 전용 안전하지 않은 HTTP 호환성을 위한 `gateway.controlUi.allowInsecureAuth=true`.
  - 성공한 `gateway.auth.mode: "trusted-proxy"` 운영자 Control UI 인증.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`(비상용, 심각한 보안 다운그레이드).
  - 공유 Gateway 토큰/비밀번호로 인증된 직접 loopback `gateway-client` 백엔드 RPC.
- 모든 연결은 서버가 제공한 `connect.challenge` nonce에 서명해야 합니다.

### 장치 인증 마이그레이션 진단

아직 챌린지 이전 서명 동작을 사용하는 레거시 클라이언트의 경우, 이제 `connect`는 안정적인 `error.details.reason`과 함께 `error.details.code` 아래에 `DEVICE_AUTH_*` 상세 코드를 반환합니다.

일반적인 마이그레이션 실패:

| 메시지                     | details.code                     | details.reason           | 의미                                            |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 클라이언트가 `device.nonce`를 생략했습니다(또는 빈 값을 보냈습니다).     |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 클라이언트가 오래되었거나 잘못된 nonce로 서명했습니다.            |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 서명 페이로드가 v2 페이로드와 일치하지 않습니다.       |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 서명된 타임스탬프가 허용된 오차 범위를 벗어났습니다.          |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`가 공개 키 지문과 일치하지 않습니다. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 공개 키 형식/정규화에 실패했습니다.         |

마이그레이션 대상:

- 항상 `connect.challenge`를 기다립니다.
- 서버 nonce가 포함된 v2 페이로드에 서명합니다.
- 동일한 nonce를 `connect.params.device.nonce`에 보냅니다.
- 권장 서명 페이로드는 `v3`이며, 장치/클라이언트/역할/범위/토큰/nonce 필드에 더해 `platform` 및 `deviceFamily`를 바인딩합니다.
- 호환성을 위해 레거시 `v2` 서명은 계속 허용되지만, 페어링된 장치 메타데이터 고정은 재연결 시에도 명령 정책을 계속 제어합니다.

## TLS + 고정

- TLS는 WS 연결에 지원됩니다.
- 클라이언트는 선택적으로 Gateway 인증서 지문을 고정할 수 있습니다(`gateway.tls` 구성과 `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참조).

## 범위

이 프로토콜은 **전체 Gateway API**(상태, 채널, 모델, 채팅, 에이전트, 세션, Node, 승인 등)를 노출합니다. 정확한 표면은 `src/gateway/protocol/schema.ts`의 TypeBox 스키마로 정의됩니다.

## 관련 항목

- [브리지 프로토콜](/ko/gateway/bridge-protocol)
- [Gateway 런북](/ko/gateway)
