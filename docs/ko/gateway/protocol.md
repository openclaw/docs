---
read_when:
    - Gateway WS 클라이언트 구현 또는 업데이트하기
    - 프로토콜 불일치 또는 연결 실패 디버깅하기
    - 프로토콜 스키마/모델 다시 생성하기
summary: 'Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리'
title: Gateway 프로토콜
x-i18n:
    generated_at: "2026-04-25T06:02:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Gateway WS 프로토콜은 OpenClaw의 **단일 제어 평면 + Node 전송 계층**입니다.
모든 클라이언트(CLI, 웹 UI, macOS 앱, iOS/Android Node, 헤드리스
Node)는 WebSocket을 통해 연결하고, 핸드셰이크 시점에 자신의 **role** + **scope**를
선언합니다.

## 전송

- WebSocket, JSON payload를 담는 텍스트 프레임.
- 첫 번째 프레임은 반드시 `connect` 요청이어야 합니다.
- 연결 전 프레임은 64 KiB로 제한됩니다. 성공적인 핸드셰이크 후에는 클라이언트가
  `hello-ok.policy.maxPayload` 및
  `hello-ok.policy.maxBufferedBytes` 한도를 따라야 합니다. 진단이 활성화된 경우,
  크기가 큰 인바운드 프레임과 느린 아웃바운드 버퍼는 gateway가 영향을 받은 프레임을 닫거나
  드롭하기 전에 `payload.large` 이벤트를 발생시킵니다. 이 이벤트는 크기, 한도, 표면,
  안전한 이유 코드를 유지합니다. 메시지 본문, 첨부 파일 내용, 원시 프레임 본문,
  토큰, 쿠키, 비밀 값은 유지하지 않습니다.

## 핸드셰이크(connect)

Gateway → Client (연결 전 챌린지):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

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

Gateway → Client:

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot`, `policy`는 모두 스키마에서
필수입니다(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl`은 선택 사항입니다. `auth`는
가능한 경우 협상된 role/scopes를 보고하며, gateway가 발급한 경우 `deviceToken`도
포함합니다.

device token이 발급되지 않은 경우에도 `hello-ok.auth`는 협상된
권한을 보고할 수 있습니다:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

device token이 발급되면 `hello-ok`에는 다음도 포함됩니다:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

신뢰된 bootstrap handoff 중에는 `hello-ok.auth`에 `deviceTokens` 아래로
추가적인 제한된 role 항목이 포함될 수도 있습니다:

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

내장된 node/operator bootstrap 흐름에서는 기본 node token이 계속
`scopes: []`로 유지되고, 전달된 operator token은 bootstrap
operator 허용 목록(`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`)으로 계속 제한됩니다. bootstrap scope 검사는
계속 role 접두사 기반입니다. operator 항목은 operator 요청만 충족하며, operator가 아닌
role은 여전히 자신의 role 접두사 아래 scope가 필요합니다.

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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

부작용이 있는 method는 **멱등성 키**가 필요합니다(스키마 참고).

## Roles + scopes

### Roles

- `operator` = 제어 평면 클라이언트(CLI/UI/자동화).
- `node` = capability 호스트(camera/screen/canvas/system.run).

### Scopes (operator)

일반적인 scope:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config`에서 `includeSecrets: true`를 사용하려면 `operator.talk.secrets`
(또는 `operator.admin`)가 필요합니다.

Plugin이 등록한 gateway RPC method는 자체 operator scope를 요청할 수 있지만,
예약된 코어 admin 접두사(`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`)는 항상 `operator.admin`으로 해석됩니다.

Method scope는 첫 번째 게이트일 뿐입니다. `chat.send`를 통해 도달하는 일부
슬래시 명령은 그 위에 더 엄격한 명령 수준 검사를 적용합니다. 예를 들어 영구적인
`/config set` 및 `/config unset` 쓰기에는 `operator.admin`이 필요합니다.

`node.pair.approve`도 기본 method scope 위에 추가 승인 시점 scope 검사가
있습니다:

- 명령 없는 요청: `operator.pairing`
- exec가 아닌 node 명령이 있는 요청: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, `system.which`가 포함된 요청:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Node는 연결 시점에 capability claim을 선언합니다:

- `caps`: 상위 수준 capability 범주.
- `commands`: invoke용 명령 허용 목록.
- `permissions`: 세부 토글(예: `screen.record`, `camera.capture`).

Gateway는 이를 **claim**으로 취급하며 서버 측 허용 목록을 적용합니다.

## Presence

- `system-presence`는 장치 ID를 키로 하는 항목을 반환합니다.
- Presence 항목에는 `deviceId`, `roles`, `scopes`가 포함되어 UI가
  장치가 **operator**와 **node**로 모두 연결되더라도 장치당 한 줄만 표시할 수 있습니다.

## 브로드캐스트 이벤트 scope 적용

서버가 푸시하는 WebSocket 브로드캐스트 이벤트는 scope 게이트가 적용되므로 pairing 범위 세션이나 node 전용 세션이 세션 콘텐츠를 수동적으로 받지 않습니다.

- **채팅, 에이전트, 도구 결과 프레임**(스트리밍된 `agent` 이벤트와 도구 호출 결과 포함)은 최소 `operator.read`가 필요합니다. `operator.read`가 없는 세션은 이 프레임을 완전히 건너뜁니다.
- **Plugin 정의 `plugin.*` 브로드캐스트**는 Plugin이 등록한 방식에 따라 `operator.write` 또는 `operator.admin`에 게이트됩니다.
- **상태 및 전송 이벤트**(`heartbeat`, `presence`, `tick`, connect/disconnect 수명 주기 등)는 모든 인증된 세션에서 전송 상태를 관찰할 수 있도록 제한 없이 유지됩니다.
- **알 수 없는 브로드캐스트 이벤트 패밀리**는 등록된 핸들러가 명시적으로 이를 완화하지 않는 한 기본적으로 scope 게이트가 적용됩니다(실패 시 차단).

각 클라이언트 연결은 자체 클라이언트별 시퀀스 번호를 유지하므로, 서로 다른 클라이언트가 이벤트 스트림의 서로 다른 scope 필터링 부분집합을 보더라도 해당 소켓에서는 브로드캐스트의 단조 순서가 보존됩니다.

## 일반적인 RPC method 패밀리

공개 WS 표면은 위의 핸드셰이크/인증 예시보다 더 넓습니다. 이는
생성된 덤프가 아닙니다. `hello-ok.features.methods`는
`src/gateway/server-methods-list.ts`와 로드된
Plugin/채널 method export에서 빌드된 보수적인 탐색 목록입니다. 이를 전체
`src/gateway/server-methods/*.ts` 열거가 아니라 기능 탐색으로 취급하세요.

<AccordionGroup>
  <Accordion title="시스템 및 ID">
    - `health`는 캐시된 또는 새로 프로브한 gateway 상태 스냅샷을 반환합니다.
    - `diagnostics.stability`는 최근의 제한된 진단 안정성 기록기를 반환합니다. 이는 이벤트 이름, 개수, 바이트 크기, 메모리 판독값, 큐/세션 상태, 채널/Plugin 이름, 세션 ID 같은 운영 메타데이터를 유지합니다. 채팅 텍스트, Webhook 본문, 도구 출력, 원시 요청 또는 응답 본문, 토큰, 쿠키, 비밀 값은 유지하지 않습니다. operator read scope가 필요합니다.
    - `status`는 `/status` 스타일의 gateway 요약을 반환합니다. 민감한 필드는 admin scope의 operator 클라이언트에만 포함됩니다.
    - `gateway.identity.get`은 relay 및 pairing 흐름에서 사용하는 gateway 장치 ID를 반환합니다.
    - `system-presence`는 연결된 operator/node 장치의 현재 presence 스냅샷을 반환합니다.
    - `system-event`는 시스템 이벤트를 추가하고 presence 컨텍스트를 업데이트/브로드캐스트할 수 있습니다.
    - `last-heartbeat`는 가장 최근에 저장된 Heartbeat 이벤트를 반환합니다.
    - `set-heartbeats`는 gateway의 Heartbeat 처리를 토글합니다.
  </Accordion>

  <Accordion title="모델 및 사용량">
    - `models.list`는 런타임에서 허용된 모델 카탈로그를 반환합니다.
    - `usage.status`는 provider 사용량 창/남은 할당량 요약을 반환합니다.
    - `usage.cost`는 날짜 범위에 대한 집계된 비용 사용량 요약을 반환합니다.
    - `doctor.memory.status`는 활성 기본 에이전트 워크스페이스의 벡터 메모리 / 임베딩 준비 상태를 반환합니다.
    - `sessions.usage`는 세션별 사용량 요약을 반환합니다.
    - `sessions.usage.timeseries`는 한 세션의 시계열 사용량을 반환합니다.
    - `sessions.usage.logs`는 한 세션의 사용량 로그 항목을 반환합니다.
  </Accordion>

  <Accordion title="채널 및 로그인 헬퍼">
    - `channels.status`는 내장 + 번들 채널/Plugin 상태 요약을 반환합니다.
    - `channels.logout`은 해당 채널이 로그아웃을 지원하는 경우 특정 채널/계정을 로그아웃합니다.
    - `web.login.start`는 현재 QR 지원 웹 채널 provider에 대한 QR/웹 로그인 흐름을 시작합니다.
    - `web.login.wait`는 해당 QR/웹 로그인 흐름이 완료되기를 기다리고 성공 시 채널을 시작합니다.
    - `push.test`는 등록된 iOS Node에 테스트 APNs 푸시를 보냅니다.
    - `voicewake.get`은 저장된 wake-word 트리거를 반환합니다.
    - `voicewake.set`은 wake-word 트리거를 업데이트하고 변경 사항을 브로드캐스트합니다.
  </Accordion>

  <Accordion title="메시징 및 로그">
    - `send`는 채팅 러너 외부에서 채널/계정/스레드 대상 전송을 위한 직접 아웃바운드 전달 RPC입니다.
    - `logs.tail`은 cursor/limit 및 최대 바이트 제어와 함께 구성된 gateway 파일 로그 tail을 반환합니다.
  </Accordion>

  <Accordion title="Talk 및 TTS">
    - `talk.config`는 유효한 Talk config payload를 반환합니다. `includeSecrets`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.
    - `talk.mode`는 WebChat/Control UI 클라이언트의 현재 Talk mode 상태를 설정/브로드캐스트합니다.
    - `talk.speak`는 활성 Talk speech provider를 통해 음성을 합성합니다.
    - `tts.status`는 TTS 활성화 상태, 활성 provider, 폴백 provider, provider config 상태를 반환합니다.
    - `tts.providers`는 표시 가능한 TTS provider 인벤토리를 반환합니다.
    - `tts.enable` 및 `tts.disable`은 TTS 기본 설정 상태를 토글합니다.
    - `tts.setProvider`는 선호 TTS provider를 업데이트합니다.
    - `tts.convert`는 일회성 텍스트 음성 변환을 실행합니다.
  </Accordion>

  <Accordion title="시크릿, config, 업데이트 및 마법사">
    - `secrets.reload`는 활성 SecretRef를 다시 확인하고 전체 성공 시에만 런타임 시크릿 상태를 교체합니다.
    - `secrets.resolve`는 특정 명령/대상 집합에 대한 명령 대상 시크릿 할당을 확인합니다.
    - `config.get`은 현재 config 스냅샷과 해시를 반환합니다.
    - `config.set`은 검증된 config 페이로드를 씁니다.
    - `config.patch`는 부분 config 업데이트를 병합합니다.
    - `config.apply`는 전체 config 페이로드를 검증하고 교체합니다.
    - `config.schema`는 Control UI와 CLI 도구에서 사용하는 실시간 config 스키마 페이로드를 반환합니다: 스키마, `uiHints`, 버전, 생성 메타데이터이며, 런타임에서 로드할 수 있는 경우 plugin + channel 스키마 메타데이터도 포함합니다. 스키마에는 중첩 객체, 와일드카드, 배열 항목, `anyOf` / `oneOf` / `allOf` 구성 분기에 대해 일치하는 필드 문서가 존재할 때 UI에서 사용하는 동일한 라벨과 도움말 텍스트에서 파생된 필드 `title` / `description` 메타데이터가 포함됩니다.
    - `config.schema.lookup`는 하나의 config 경로에 대한 경로 범위 조회 페이로드를 반환합니다: 정규화된 경로, 얕은 스키마 노드, 일치한 힌트 + `hintPath`, 그리고 UI/CLI 드릴다운을 위한 즉시 하위 항목 요약입니다. 조회 스키마 노드는 사용자 대상 문서와 공통 검증 필드(`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, 숫자/문자열/배열/객체 제한, 그리고 `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` 같은 플래그)를 유지합니다. 하위 항목 요약은 `key`, 정규화된 `path`, `type`, `required`, `hasChildren`, 그리고 일치한 `hint` / `hintPath`를 제공합니다.
    - `update.run`은 Gateway 업데이트 흐름을 실행하고 업데이트 자체가 성공한 경우에만 재시작을 예약합니다.
    - `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel`은 WS RPC를 통해 온보딩 마법사를 노출합니다.
  </Accordion>

  <Accordion title="에이전트 및 작업 공간 도우미">
    - `agents.list`는 구성된 에이전트 항목을 반환합니다.
    - `agents.create`, `agents.update`, `agents.delete`는 에이전트 레코드와 작업 공간 연결을 관리합니다.
    - `agents.files.list`, `agents.files.get`, `agents.files.set`은 에이전트에 노출되는 부트스트랩 작업 공간 파일을 관리합니다.
    - `agent.identity.get`은 에이전트 또는 세션에 대한 유효한 어시스턴트 ID를 반환합니다.
    - `agent.wait`는 실행이 끝날 때까지 기다리며 가능할 때 최종 스냅샷을 반환합니다.
  </Accordion>

  <Accordion title="세션 제어">
    - `sessions.list`는 현재 세션 인덱스를 반환합니다.
    - `sessions.subscribe`와 `sessions.unsubscribe`는 현재 WS 클라이언트에 대한 세션 변경 이벤트 구독을 전환합니다.
    - `sessions.messages.subscribe`와 `sessions.messages.unsubscribe`는 하나의 세션에 대한 전사/메시지 이벤트 구독을 전환합니다.
    - `sessions.preview`는 특정 세션 키에 대한 범위 제한 전사 미리보기를 반환합니다.
    - `sessions.resolve`는 세션 대상을 확인하거나 정규화합니다.
    - `sessions.create`는 새 세션 항목을 생성합니다.
    - `sessions.send`는 기존 세션으로 메시지를 보냅니다.
    - `sessions.steer`는 활성 세션에 대한 인터럽트 후 조정 변형입니다.
    - `sessions.abort`는 세션의 활성 작업을 중단합니다.
    - `sessions.patch`는 세션 메타데이터/재정의를 업데이트합니다.
    - `sessions.reset`, `sessions.delete`, `sessions.compact`는 세션 유지 관리를 수행합니다.
    - `sessions.get`은 전체 저장된 세션 행을 반환합니다.
    - 채팅 실행은 계속 `chat.history`, `chat.send`, `chat.abort`, `chat.inject`를 사용합니다. `chat.history`는 UI 클라이언트를 위해 표시 정규화됩니다. 즉, 인라인 지시문 태그는 보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`\<tool_call>...\</tool_call>`, `\<function_call>...\</function_call>`, `\<tool_calls>...\</tool_calls>`, `\<function_calls>...\</function_calls>`, 잘린 도구 호출 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰은 제거되며, 정확히 `NO_REPLY` / `no_reply`인 순수 무음 토큰 어시스턴트 행은 생략되고, 지나치게 큰 행은 플레이스홀더로 대체될 수 있습니다.
  </Accordion>

  <Accordion title="장치 페어링 및 장치 토큰">
    - `device.pair.list`는 대기 중 및 승인된 페어링 장치를 반환합니다.
    - `device.pair.approve`, `device.pair.reject`, `device.pair.remove`는 장치 페어링 레코드를 관리합니다.
    - `device.token.rotate`는 승인된 역할 및 범위 한도 내에서 페어링된 장치 토큰을 교체합니다.
    - `device.token.revoke`는 페어링된 장치 토큰을 폐기합니다.
  </Accordion>

  <Accordion title="Node 페어링, 호출 및 대기 작업">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.verify`는 Node 페어링 및 부트스트랩 검증을 다룹니다.
    - `node.list`와 `node.describe`는 알려진/연결된 Node 상태를 반환합니다.
    - `node.rename`은 페어링된 Node 라벨을 업데이트합니다.
    - `node.invoke`는 연결된 Node로 명령을 전달합니다.
    - `node.invoke.result`는 invoke 요청에 대한 결과를 반환합니다.
    - `node.event`는 Node에서 발생한 이벤트를 Gateway로 다시 전달합니다.
    - `node.canvas.capability.refresh`는 범위가 지정된 canvas capability 토큰을 새로 고칩니다.
    - `node.pending.pull`과 `node.pending.ack`는 연결된 Node 큐 API입니다.
    - `node.pending.enqueue`와 `node.pending.drain`은 오프라인/연결 해제된 Node를 위한 영속 대기 작업을 관리합니다.
  </Accordion>

  <Accordion title="승인 계열">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve`는 일회성 exec 승인 요청과 대기 중 승인 조회/재생을 다룹니다.
    - `exec.approval.waitDecision`은 하나의 대기 중 exec 승인을 기다리고 최종 결정(또는 시간 초과 시 `null`)을 반환합니다.
    - `exec.approvals.get`과 `exec.approvals.set`은 Gateway exec 승인 정책 스냅샷을 관리합니다.
    - `exec.approvals.node.get`과 `exec.approvals.node.set`은 Node 릴레이 명령을 통해 Node 로컬 exec 승인 정책을 관리합니다.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve`는 plugin 정의 승인 흐름을 다룹니다.
  </Accordion>

  <Accordion title="자동화, Skills 및 도구">
    - 자동화: `wake`는 즉시 또는 다음 Heartbeat에서 wake 텍스트 삽입을 예약합니다. `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs`는 예약된 작업을 관리합니다.
    - Skills 및 도구: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### 공통 이벤트 계열

- `chat`: `chat.inject` 및 기타 전사 전용 채팅 이벤트와 같은 UI 채팅 업데이트.
- `session.message` 및 `session.tool`: 구독된 세션에 대한 전사/이벤트 스트림 업데이트.
- `sessions.changed`: 세션 인덱스 또는 메타데이터가 변경되었습니다.
- `presence`: 시스템 존재 상태 스냅샷 업데이트.
- `tick`: 주기적 keepalive / 활성 상태 이벤트.
- `health`: Gateway 상태 스냅샷 업데이트.
- `heartbeat`: Heartbeat 이벤트 스트림 업데이트.
- `cron`: Cron 실행/작업 변경 이벤트.
- `shutdown`: Gateway 종료 알림.
- `node.pair.requested` / `node.pair.resolved`: Node 페어링 수명 주기.
- `node.invoke.request`: Node invoke 요청 브로드캐스트.
- `device.pair.requested` / `device.pair.resolved`: 페어링 장치 수명 주기.
- `voicewake.changed`: 웨이크 워드 트리거 config가 변경되었습니다.
- `exec.approval.requested` / `exec.approval.resolved`: exec 승인 수명 주기.
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 승인 수명 주기.

### Node 도우미 메서드

- Nodes는 자동 허용 검사에 사용할 현재 skill 실행 파일 목록을 가져오기 위해 `skills.bins`를 호출할 수 있습니다.

### 운영자 도우미 메서드

- 운영자는 에이전트의 런타임 명령 인벤토리를 가져오기 위해 `commands.list` (`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 작업 공간을 읽습니다.
  - `scope`는 기본 `name`이 어느 표면을 대상으로 하는지 제어합니다:
    - `text`는 앞의 `/`를 제외한 기본 텍스트 명령 토큰을 반환합니다.
    - `native` 및 기본 `both` 경로는 사용 가능한 경우 provider 인식 네이티브 이름을 반환합니다.
  - `textAliases`는 `/model` 및 `/m` 같은 정확한 슬래시 별칭을 포함합니다.
  - `nativeName`은 존재할 경우 provider 인식 네이티브 명령 이름을 포함합니다.
  - `provider`는 선택 사항이며 네이티브 이름 지정과 네이티브 plugin 명령 가용성에만 영향을 줍니다.
  - `includeArgs=false`는 응답에서 직렬화된 인수 메타데이터를 생략합니다.
- 운영자는 에이전트의 런타임 도구 카탈로그를 가져오기 위해 `tools.catalog` (`operator.read`)를 호출할 수 있습니다. 응답에는 그룹화된 도구와 출처 메타데이터가 포함됩니다:
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"`일 때 plugin 소유자
  - `optional`: plugin 도구가 선택 사항인지 여부
- 운영자는 세션의 런타임 유효 도구 인벤토리를 가져오기 위해 `tools.effective` (`operator.read`)를 호출할 수 있습니다.
  - `sessionKey`는 필수입니다.
  - Gateway는 호출자가 제공한 인증 또는 전달 컨텍스트를 수용하는 대신 세션에서 신뢰할 수 있는 런타임 컨텍스트를 서버 측에서 파생합니다.
  - 응답은 세션 범위이며, core, plugin, channel 도구를 포함해 현재 활성 대화에서 지금 사용할 수 있는 내용을 반영합니다.
- 운영자는 에이전트의 표시 가능한 skill 인벤토리를 가져오기 위해 `skills.status` (`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 작업 공간을 읽습니다.
  - 응답에는 원시 시크릿 값을 노출하지 않으면서 자격 요건, 누락된 요구 사항, config 검사, 정제된 설치 옵션이 포함됩니다.
- 운영자는 ClawHub 검색 메타데이터를 위해 `skills.search`와 `skills.detail` (`operator.read`)를 호출할 수 있습니다.
- 운영자는 `skills.install` (`operator.admin`)을 두 가지 모드로 호출할 수 있습니다:
  - ClawHub 모드: `{ source: "clawhub", slug, version?, force? }`는 기본 에이전트 작업 공간 `skills/` 디렉터리에 skill 폴더를 설치합니다.
  - Gateway 설치 프로그램 모드: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`는 Gateway 호스트에서 선언된 `metadata.openclaw.install` 작업을 실행합니다.
- 운영자는 `skills.update` (`operator.admin`)를 두 가지 모드로 호출할 수 있습니다:
  - ClawHub 모드는 기본 에이전트 작업 공간에서 추적된 하나의 slug 또는 모든 추적된 ClawHub 설치를 업데이트합니다.
  - Config 모드는 `enabled`, `apiKey`, `env` 같은 `skills.entries.<skillKey>` 값을 패치합니다.

## Exec 승인

- exec 요청에 승인이 필요하면 Gateway는 `exec.approval.requested`를 브로드캐스트합니다.
- 운영자 클라이언트는 `exec.approval.resolve`를 호출하여 해결합니다(`operator.approvals` 범위 필요).
- `host=node`의 경우 `exec.approval.request`에는 `systemRunPlan`(정규 `argv`/`cwd`/`rawCommand`/세션 메타데이터)이 포함되어야 합니다. `systemRunPlan`이 없는 요청은 거부됩니다.
- 승인 후 전달되는 `node.invoke system.run` 호출은 해당 정규 `systemRunPlan`을 권한 있는 명령/cwd/세션 컨텍스트로 재사용합니다.
- 호출자가 준비 단계와 최종 승인된 `system.run` 전달 사이에서 `command`, `rawCommand`, `cwd`, `agentId`, `sessionKey`를 변경하면 Gateway는 변경된 페이로드를 신뢰하는 대신 실행을 거부합니다.

## 에이전트 전달 폴백

- `agent` 요청은 아웃바운드 전달을 요청하기 위해 `deliver=true`를 포함할 수 있습니다.
- `bestEffortDeliver=false`는 엄격한 동작을 유지합니다. 확인되지 않았거나 내부 전용 전달 대상은 `INVALID_REQUEST`를 반환합니다.
- `bestEffortDeliver=true`는 외부 전달 가능한 경로를 확인할 수 없을 때(예: internal/webchat 세션 또는 모호한 다중 channel config) 세션 전용 실행으로 폴백할 수 있게 합니다.

## 버전 관리

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema/protocol-schemas.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 보내며, 서버는 불일치를 거부합니다.
- 스키마 + 모델은 TypeBox 정의에서 생성됩니다:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### 클라이언트 상수

`src/gateway/client.ts`의 참조 클라이언트는 다음 기본값을 사용합니다. 값은 프로토콜 v3 전반에서 안정적이며 서드파티 클라이언트에 대해 예상되는 기준선입니다.

| 상수                                      | 기본값                                                | 소스                                                       |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| 요청 시간 초과(각 RPC별)                  | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| 사전 인증 / connect-challenge 시간 초과   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (clamp `250`–`10_000`) |
| 초기 재연결 백오프                        | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| 최대 재연결 백오프                        | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| device-token 종료 후 빠른 재시도 clamp    | `250` ms                                              | `src/gateway/client.ts`                                    |
| `terminate()` 전 강제 중지 유예 시간      | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| `stopAndWait()` 기본 시간 초과            | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| 기본 tick 간격 (`hello-ok` 이전)          | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| tick 시간 초과 종료                       | 무음이 `tickIntervalMs * 2`를 초과하면 코드 `4000`    | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

서버는 `hello-ok`에서 유효한 `policy.tickIntervalMs`, `policy.maxPayload`,
및 `policy.maxBufferedBytes`를 알립니다. 클라이언트는 사전 핸드셰이크 기본값보다
이 값을 따라야 합니다.

## 인증

- 공유 시크릿 Gateway 인증은 구성된 인증 모드에 따라 `connect.params.auth.token` 또는
  `connect.params.auth.password`를 사용합니다.
- Tailscale Serve
  (`gateway.auth.allowTailscale: true`) 또는 non-loopback
  `gateway.auth.mode: "trusted-proxy"` 같은 ID 기반 모드는
  `connect.params.auth.*` 대신 요청 헤더에서 connect 인증 검사를 충족합니다.
- 프라이빗 인그레스 `gateway.auth.mode: "none"`은 공유 시크릿 connect 인증을
  완전히 건너뜁니다. 이 모드를 공개/비신뢰 인그레스에 노출하지 마세요.
- 페어링 후 Gateway는 연결 역할 + 범위로 제한된 **device token**을 발급합니다.
  이 값은 `hello-ok.auth.deviceToken`에 반환되며, 클라이언트는 이후 연결을 위해
  이를 저장해야 합니다.
- 클라이언트는 연결이 성공할 때마다 기본 `hello-ok.auth.deviceToken`을 저장해야 합니다.
- 해당 **저장된** device token으로 재연결할 때는 그 토큰에 대해 저장된 승인 범위
  집합도 함께 재사용해야 합니다. 이렇게 하면 이미 부여된 읽기/프로브/상태 접근이
  유지되고, 재연결이 더 좁은 암묵적 admin 전용 범위로 조용히 축소되는 것을 방지할 수 있습니다.
- 클라이언트 측 connect 인증 조합(`src/gateway/client.ts`의 `selectConnectAuth`):
  - `auth.password`는 독립적이며 설정된 경우 항상 전달됩니다.
  - `auth.token`은 우선순위 순서대로 채워집니다. 먼저 명시적 공유 토큰, 그다음 명시적 `deviceToken`,
    그다음 저장된 장치별 토큰(`deviceId` + `role` 기준)입니다.
  - `auth.bootstrapToken`은 위 항목들 중 어느 것도 `auth.token`을 확인하지 못한 경우에만 전송됩니다.
    공유 토큰 또는 확인된 모든 device token은 이를 억제합니다.
  - 저장된 device token의 일회성 `AUTH_TOKEN_MISMATCH` 재시도 자동 승격은
    **신뢰된 엔드포인트에서만** 허용됩니다. 즉, loopback 또는 고정된 `tlsFingerprint`가 있는 `wss://`입니다.
    핀 고정이 없는 공개 `wss://`는 해당되지 않습니다.
- 추가 `hello-ok.auth.deviceTokens` 항목은 bootstrap handoff 토큰입니다.
  `wss://` 또는 loopback/local pairing 같은 신뢰된 전송에서 bootstrap 인증을 사용해 연결한 경우에만 저장하세요.
- 클라이언트가 **명시적** `deviceToken` 또는 명시적 `scopes`를 제공한 경우,
  그 호출자가 요청한 범위 집합이 계속 우선합니다. 캐시된 범위는 클라이언트가 저장된 장치별 토큰을
  재사용할 때만 재사용됩니다.
- device token은 `device.token.rotate` 및 `device.token.revoke`로 교체/폐기할 수 있습니다
  (`operator.pairing` 범위 필요).
- 토큰 발급/교체는 해당 장치의 페어링 항목에 기록된 승인된 역할 집합 범위 내로 제한됩니다.
  토큰 교체로는 페어링 승인이 한 번도 부여하지 않은 역할로 장치를 확장할 수 없습니다.
- 페어링된 장치 토큰 세션의 경우, 호출자에게 `operator.admin`도 없는 한 장치 관리는 자체 범위로 제한됩니다.
  admin이 아닌 호출자는 자신의 **해당 장치 항목만** 제거/폐기/교체할 수 있습니다.
- `device.token.rotate`는 요청된 운영자 범위 집합도 호출자의 현재 세션 범위와 대조해 검사합니다.
  admin이 아닌 호출자는 현재 보유한 범위보다 더 넓은 운영자 범위 집합으로 토큰을 교체할 수 없습니다.
- 인증 실패에는 `error.details.code`와 함께 복구 힌트가 포함됩니다:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH`에 대한 클라이언트 동작:
  - 신뢰된 클라이언트는 캐시된 장치별 토큰으로 제한된 1회 재시도를 시도할 수 있습니다.
  - 해당 재시도가 실패하면 클라이언트는 자동 재연결 루프를 중단하고 운영자 조치 안내를 표시해야 합니다.

## 장치 ID + 페어링

- Nodes는 키쌍 지문에서 파생된 안정적인 장치 ID(`device.id`)를 포함해야 합니다.
- Gateways는 장치 + 역할별로 토큰을 발급합니다.
- 로컬 자동 승인이 활성화되지 않은 한 새 장치 ID에는 페어링 승인이 필요합니다.
- 페어링 자동 승인은 직접 local loopback 연결을 중심으로 동작합니다.
- OpenClaw에는 신뢰된 공유 시크릿 헬퍼 흐름을 위한 제한적인 백엔드/컨테이너 로컬 self-connect 경로도 있습니다.
- 동일 호스트 tailnet 또는 LAN 연결도 여전히 페어링 관점에서는 원격으로 처리되며 승인이 필요합니다.
- 모든 WS 클라이언트는 `connect` 중에 `device` ID를 포함해야 합니다(operator + node).
  Control UI는 다음 모드에서만 이를 생략할 수 있습니다:
  - localhost 전용 비보안 HTTP 호환성을 위한 `gateway.controlUi.allowInsecureAuth=true`
  - 성공적인 `gateway.auth.mode: "trusted-proxy"` 운영자 Control UI 인증
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (비상 수단, 심각한 보안 저하)
- 모든 연결은 서버가 제공한 `connect.challenge` nonce에 서명해야 합니다.

### 장치 인증 마이그레이션 진단

여전히 pre-challenge 서명 동작을 사용하는 레거시 클라이언트의 경우, 이제 `connect`는
안정적인 `error.details.reason`과 함께 `error.details.code` 아래에
`DEVICE_AUTH_*` 상세 코드를 반환합니다.

일반적인 마이그레이션 실패:

| 메시지                      | details.code                     | details.reason           | 의미                                               |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | 클라이언트가 `device.nonce`를 생략했거나 빈 값으로 보냈습니다. |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | 클라이언트가 오래되었거나 잘못된 nonce로 서명했습니다. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | 서명 페이로드가 v2 페이로드와 일치하지 않습니다. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | 서명된 타임스탬프가 허용된 시간 오차 범위를 벗어났습니다. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id`가 공개 키 지문과 일치하지 않습니다. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | 공개 키 형식/정규화에 실패했습니다. |

마이그레이션 목표:

- 항상 `connect.challenge`를 기다립니다.
- 서버 nonce를 포함한 v2 페이로드에 서명합니다.
- 동일한 nonce를 `connect.params.device.nonce`로 보냅니다.
- 권장 서명 페이로드는 `v3`이며, 장치/클라이언트/역할/범위/토큰/nonce 필드에 더해
  `platform`과 `deviceFamily`를 바인딩합니다.
- 레거시 `v2` 서명도 호환성을 위해 계속 허용되지만, 페어링된 장치 메타데이터 고정은
  재연결 시에도 여전히 명령 정책을 제어합니다.

## TLS + 핀 고정

- WS 연결에 대해 TLS가 지원됩니다.
- 클라이언트는 선택적으로 Gateway 인증서 지문을 핀 고정할 수 있습니다(`gateway.tls`
  config 및 `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참조).

## 범위

이 프로토콜은 **전체 Gateway API**(상태, channels, 모델, 채팅,
agent, 세션, nodes, 승인 등)를 노출합니다. 정확한 표면은
`src/gateway/protocol/schema.ts`의 TypeBox 스키마에 정의되어 있습니다.

## 관련

- [브리지 프로토콜](/ko/gateway/bridge-protocol)
- [Gateway 운영 가이드](/ko/gateway)
