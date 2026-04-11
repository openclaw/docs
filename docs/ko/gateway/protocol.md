---
read_when:
    - 게이트웨이 WS 클라이언트 구현 또는 업데이트하기
    - 프로토콜 불일치 또는 연결 실패 디버깅하기
    - 프로토콜 스키마/모델 다시 생성하기
summary: 'Gateway WebSocket 프로토콜: 핸드셰이크, 프레임, 버전 관리'
title: Gateway 프로토콜
x-i18n:
    generated_at: "2026-04-11T02:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway 프로토콜 (WebSocket)

Gateway WS 프로토콜은 OpenClaw를 위한 **단일 제어 플레인 + 노드 전송 계층**입니다. 모든 클라이언트(CLI, 웹 UI, macOS 앱, iOS/Android 노드, 헤드리스 노드)는 WebSocket을 통해 연결하고 핸드셰이크 시점에 자신의 **역할**과 **범위**를 선언합니다.

## 전송 계층

- WebSocket, JSON 페이로드를 사용하는 텍스트 프레임
- 첫 번째 프레임은 반드시 `connect` 요청이어야 합니다.

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

디바이스 토큰이 발급되면 `hello-ok`에는 다음도 포함됩니다:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

신뢰된 부트스트랩 핸드오프 중에는 `hello-ok.auth`에 `deviceTokens` 내 추가적인 범위 제한 역할 항목이 포함될 수도 있습니다:

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

내장된 node/operator 부트스트랩 흐름에서는 기본 노드 토큰이 `scopes: []`로 유지되고, 핸드오프된 모든 operator 토큰은 부트스트랩 operator 허용 목록(`operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`)으로 제한됩니다. 부트스트랩 범위 검사는 계속해서 역할 접두사 기반으로 유지됩니다. operator 항목은 operator 요청만 충족하며, operator가 아닌 역할은 여전히 자신의 역할 접두사 아래 범위가 필요합니다.

### 노드 예시

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

부수 효과가 있는 메서드는 **멱등성 키**가 필요합니다(스키마 참조).

## 역할 + 범위

### 역할

- `operator` = 제어 플레인 클라이언트(CLI/UI/자동화)
- `node` = 기능 호스트(camera/screen/canvas/system.run)

### 범위(operator)

일반적인 범위:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`includeSecrets: true`가 있는 `talk.config`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.

plugin 등록 Gateway RPC 메서드는 자체 operator 범위를 요구할 수 있지만, 예약된 핵심 관리자 접두사(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 항상 `operator.admin`으로 해석됩니다.

메서드 범위는 첫 번째 게이트일 뿐입니다. `chat.send`를 통해 도달하는 일부 슬래시 명령은 그 위에 더 엄격한 명령 수준 검사를 적용합니다. 예를 들어 영구적인 `/config set` 및 `/config unset` 쓰기 작업에는 `operator.admin`이 필요합니다.

`node.pair.approve`도 기본 메서드 범위 외에 추가적인 승인 시점 범위 검사가 있습니다:

- 명령 없는 요청: `operator.pairing`
- exec가 아닌 노드 명령이 포함된 요청: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare`, 또는 `system.which`가 포함된 요청:
  `operator.pairing` + `operator.admin`

### caps/commands/permissions(node)

노드는 연결 시 기능 클레임을 선언합니다:

- `caps`: 상위 수준 기능 카테고리
- `commands`: invoke용 명령 허용 목록
- `permissions`: 세부 토글(예: `screen.record`, `camera.capture`)

Gateway는 이를 **클레임**으로 취급하고 서버 측 허용 목록을 적용합니다.

## 프레즌스

- `system-presence`는 디바이스 정체성을 키로 하는 항목을 반환합니다.
- 프레즌스 항목에는 `deviceId`, `roles`, `scopes`가 포함되므로 UI는 디바이스가 **operator**와 **node**로 모두 연결되어 있더라도 디바이스당 한 행만 표시할 수 있습니다.

## 일반적인 RPC 메서드 계열

이 페이지는 생성된 전체 덤프가 아니지만, 공개 WS 표면은 위의 핸드셰이크/인증 예시보다 더 넓습니다. 현재 Gateway가 노출하는 주요 메서드 계열은 다음과 같습니다.

`hello-ok.features.methods`는 `src/gateway/server-methods-list.ts`와 로드된 plugin/channel 메서드 export를 바탕으로 구성된 보수적인 디스커버리 목록입니다. 이를 기능 디스커버리로 취급하고, `src/gateway/server-methods/*.ts`에 구현된 모든 호출 가능한 헬퍼의 생성된 덤프로 취급하지 마세요.

### 시스템 및 정체성

- `health`는 캐시된 또는 새로 프로브된 Gateway 상태 스냅샷을 반환합니다.
- `status`는 `/status` 스타일의 Gateway 요약을 반환합니다. 민감한 필드는 관리자 범위가 있는 operator 클라이언트에게만 포함됩니다.
- `gateway.identity.get`은 릴레이 및 페어링 흐름에 사용되는 Gateway 디바이스 정체성을 반환합니다.
- `system-presence`는 연결된 operator/node 디바이스의 현재 프레즌스 스냅샷을 반환합니다.
- `system-event`는 시스템 이벤트를 추가하고 프레즌스 컨텍스트를 업데이트/브로드캐스트할 수 있습니다.
- `last-heartbeat`는 가장 최근에 저장된 heartbeat 이벤트를 반환합니다.
- `set-heartbeats`는 Gateway에서 heartbeat 처리를 전환합니다.

### 모델 및 사용량

- `models.list`는 런타임에서 허용된 모델 카탈로그를 반환합니다.
- `usage.status`는 provider 사용량 윈도우/잔여 할당량 요약을 반환합니다.
- `usage.cost`는 날짜 범위에 대한 집계된 비용 사용량 요약을 반환합니다.
- `doctor.memory.status`는 활성 기본 에이전트 워크스페이스의 벡터 메모리/임베딩 준비 상태를 반환합니다.
- `sessions.usage`는 세션별 사용량 요약을 반환합니다.
- `sessions.usage.timeseries`는 하나의 세션에 대한 시계열 사용량을 반환합니다.
- `sessions.usage.logs`는 하나의 세션에 대한 사용량 로그 항목을 반환합니다.

### 채널 및 로그인 헬퍼

- `channels.status`는 내장 + 번들 채널/plugin 상태 요약을 반환합니다.
- `channels.logout`은 해당 채널이 로그아웃을 지원하는 경우 특정 채널/계정에서 로그아웃합니다.
- `web.login.start`는 현재 QR 지원 웹 채널 provider에 대한 QR/웹 로그인 흐름을 시작합니다.
- `web.login.wait`는 해당 QR/웹 로그인 흐름이 완료될 때까지 기다리고 성공 시 채널을 시작합니다.
- `push.test`는 등록된 iOS 노드에 테스트 APNs 푸시를 전송합니다.
- `voicewake.get`은 저장된 웨이크 워드 트리거를 반환합니다.
- `voicewake.set`은 웨이크 워드 트리거를 업데이트하고 변경 사항을 브로드캐스트합니다.

### 메시징 및 로그

- `send`는 채팅 러너 외부에서 채널/계정/스레드 대상 전송을 위한 직접 아웃바운드 전달 RPC입니다.
- `logs.tail`은 커서/제한 및 최대 바이트 제어와 함께 구성된 Gateway 파일 로그 tail을 반환합니다.

### Talk 및 TTS

- `talk.config`는 유효한 Talk 설정 페이로드를 반환합니다. `includeSecrets`에는 `operator.talk.secrets`(또는 `operator.admin`)가 필요합니다.
- `talk.mode`는 WebChat/Control UI 클라이언트를 위한 현재 Talk 모드 상태를 설정/브로드캐스트합니다.
- `talk.speak`는 활성 Talk 음성 provider를 통해 음성을 합성합니다.
- `tts.status`는 TTS 활성화 상태, 활성 provider, 폴백 provider, provider 설정 상태를 반환합니다.
- `tts.providers`는 표시 가능한 TTS provider 인벤토리를 반환합니다.
- `tts.enable` 및 `tts.disable`은 TTS 기본 설정 상태를 전환합니다.
- `tts.setProvider`는 선호 TTS provider를 업데이트합니다.
- `tts.convert`는 일회성 텍스트-음성 변환을 실행합니다.

### 시크릿, 설정, 업데이트, 그리고 wizard

- `secrets.reload`는 활성 SecretRef를 다시 해석하고 전체 성공 시에만 런타임 시크릿 상태를 교체합니다.
- `secrets.resolve`는 특정 명령/대상 집합에 대한 명령 대상 시크릿 할당을 해석합니다.
- `config.get`은 현재 설정 스냅샷과 해시를 반환합니다.
- `config.set`은 검증된 설정 페이로드를 기록합니다.
- `config.patch`는 부분 설정 업데이트를 병합합니다.
- `config.apply`는 전체 설정 페이로드를 검증하고 교체합니다.
- `config.schema`는 Control UI와 CLI 도구에서 사용하는 라이브 설정 스키마 페이로드를 반환합니다: 스키마, `uiHints`, 버전, 생성 메타데이터, 그리고 런타임이 로드할 수 있는 경우 plugin + channel 스키마 메타데이터를 포함합니다. 스키마에는 중첩 객체, 와일드카드, 배열 항목, 그리고 일치하는 필드 문서가 존재하는 경우 `anyOf` / `oneOf` / `allOf` 구성 분기까지 포함해, UI가 사용하는 동일한 레이블 및 도움말 텍스트에서 파생된 필드 `title` / `description` 메타데이터가 포함됩니다.
- `config.schema.lookup`은 하나의 설정 경로에 대한 경로 범위 조회 페이로드를 반환합니다: 정규화된 경로, 얕은 스키마 노드, 일치한 힌트 + `hintPath`, 그리고 UI/CLI 드릴다운을 위한 즉시 하위 항목 요약입니다.
  - 조회 스키마 노드는 사용자 대상 문서와 일반적인 검증 필드를 유지합니다:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    숫자/문자열/배열/객체 경계, 그리고 `additionalProperties`, `deprecated`, `readOnly`, `writeOnly` 같은 불리언 플래그
  - 하위 항목 요약은 `key`, 정규화된 `path`, `type`, `required`,
    `hasChildren`, 그리고 일치한 `hint` / `hintPath`를 노출합니다.
- `update.run`은 Gateway 업데이트 흐름을 실행하고 업데이트 자체가 성공한 경우에만 재시작을 예약합니다.
- `wizard.start`, `wizard.next`, `wizard.status`, `wizard.cancel`은 WS RPC를 통해 온보딩 wizard를 노출합니다.

### 기존 주요 계열

#### 에이전트 및 워크스페이스 헬퍼

- `agents.list`는 구성된 에이전트 항목을 반환합니다.
- `agents.create`, `agents.update`, `agents.delete`는 에이전트 레코드와 워크스페이스 연결을 관리합니다.
- `agents.files.list`, `agents.files.get`, `agents.files.set`은 에이전트에 대해 노출되는 부트스트랩 워크스페이스 파일을 관리합니다.
- `agent.identity.get`은 에이전트 또는 세션에 대한 유효한 어시스턴트 정체성을 반환합니다.
- `agent.wait`는 실행이 끝날 때까지 기다리고, 가능하면 종료 스냅샷을 반환합니다.

#### 세션 제어

- `sessions.list`는 현재 세션 인덱스를 반환합니다.
- `sessions.subscribe`와 `sessions.unsubscribe`는 현재 WS 클라이언트에 대한 세션 변경 이벤트 구독을 전환합니다.
- `sessions.messages.subscribe`와 `sessions.messages.unsubscribe`는 하나의 세션에 대한 대화 내용/메시지 이벤트 구독을 전환합니다.
- `sessions.preview`는 특정 세션 키에 대해 범위가 제한된 대화 내용 미리보기를 반환합니다.
- `sessions.resolve`는 세션 대상을 해석하거나 정규화합니다.
- `sessions.create`는 새 세션 항목을 생성합니다.
- `sessions.send`는 기존 세션에 메시지를 보냅니다.
- `sessions.steer`는 활성 세션을 위한 인터럽트 후 조정 변형입니다.
- `sessions.abort`는 세션의 활성 작업을 중단합니다.
- `sessions.patch`는 세션 메타데이터/재정의를 업데이트합니다.
- `sessions.reset`, `sessions.delete`, `sessions.compact`는 세션 유지 관리 작업을 수행합니다.
- `sessions.get`은 전체 저장된 세션 행을 반환합니다.
- 채팅 실행은 여전히 `chat.history`, `chat.send`, `chat.abort`, `chat.inject`를 사용합니다.
- `chat.history`는 UI 클라이언트를 위해 표시 기준으로 정규화됩니다. 인라인 directive 태그는 보이는 텍스트에서 제거되고, 일반 텍스트 tool-call XML 페이로드(`"<tool_call>...</tool_call>"`, `"<function_call>...</function_call>"`, `"<tool_calls>...</tool_calls>"`, `"<function_calls>...</function_calls>"`, 그리고 잘린 tool-call 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰은 제거되며, 정확히 `NO_REPLY` / `no_reply`인 순수 silent-token assistant 행은 생략되고, 과도하게 큰 행은 플레이스홀더로 대체될 수 있습니다.

#### 디바이스 페어링 및 디바이스 토큰

- `device.pair.list`는 대기 중 및 승인된 페어링 디바이스를 반환합니다.
- `device.pair.approve`, `device.pair.reject`, `device.pair.remove`는 디바이스 페어링 레코드를 관리합니다.
- `device.token.rotate`는 승인된 역할 및 범위 한도 내에서 페어링된 디바이스 토큰을 교체합니다.
- `device.token.revoke`는 페어링된 디바이스 토큰을 폐기합니다.

#### 노드 페어링, invoke, 대기 중 작업

- `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.verify`는 노드 페어링과 부트스트랩 검증을 다룹니다.
- `node.list`와 `node.describe`는 알려진/연결된 노드 상태를 반환합니다.
- `node.rename`은 페어링된 노드 레이블을 업데이트합니다.
- `node.invoke`는 연결된 노드로 명령을 전달합니다.
- `node.invoke.result`는 invoke 요청의 결과를 반환합니다.
- `node.event`는 노드 발생 이벤트를 다시 게이트웨이로 전달합니다.
- `node.canvas.capability.refresh`는 범위가 지정된 canvas capability 토큰을 새로 고칩니다.
- `node.pending.pull`과 `node.pending.ack`는 연결된 노드 큐 API입니다.
- `node.pending.enqueue`와 `node.pending.drain`은 오프라인/연결 해제된 노드를 위한 지속형 대기 작업을 관리합니다.

#### 승인 계열

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list`, `exec.approval.resolve`는 일회성 exec 승인 요청과 대기 중 승인 조회/재실행을 다룹니다.
- `exec.approval.waitDecision`은 하나의 대기 중 exec 승인을 기다리고 최종 결정(또는 타임아웃 시 `null`)을 반환합니다.
- `exec.approvals.get`과 `exec.approvals.set`은 게이트웨이 exec 승인 정책 스냅샷을 관리합니다.
- `exec.approvals.node.get`과 `exec.approvals.node.set`은 노드 릴레이 명령을 통해 노드 로컬 exec 승인 정책을 관리합니다.
- `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision`, `plugin.approval.resolve`는 plugin 정의 승인 흐름을 다룹니다.

#### 기타 주요 계열

- 자동화:
  - `wake`는 즉시 또는 다음 heartbeat에 wake 텍스트 주입을 예약합니다
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs`
- Skills/tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### 일반적인 이벤트 계열

- `chat`: `chat.inject` 및 기타 대화 내용 전용 채팅 이벤트 같은 UI 채팅 업데이트
- `session.message`와 `session.tool`: 구독된 세션에 대한 대화 내용/이벤트 스트림 업데이트
- `sessions.changed`: 세션 인덱스 또는 메타데이터가 변경됨
- `presence`: 시스템 프레즌스 스냅샷 업데이트
- `tick`: 주기적인 keepalive / liveness 이벤트
- `health`: 게이트웨이 상태 스냅샷 업데이트
- `heartbeat`: heartbeat 이벤트 스트림 업데이트
- `cron`: cron 실행/작업 변경 이벤트
- `shutdown`: 게이트웨이 종료 알림
- `node.pair.requested` / `node.pair.resolved`: 노드 페어링 수명 주기
- `node.invoke.request`: 노드 invoke 요청 브로드캐스트
- `device.pair.requested` / `device.pair.resolved`: 페어링 디바이스 수명 주기
- `voicewake.changed`: 웨이크 워드 트리거 설정이 변경됨
- `exec.approval.requested` / `exec.approval.resolved`: exec 승인 수명 주기
- `plugin.approval.requested` / `plugin.approval.resolved`: plugin 승인 수명 주기

### 노드 헬퍼 메서드

- 노드는 자동 허용 검사에 사용할 현재 skill 실행 파일 목록을 가져오기 위해 `skills.bins`를 호출할 수 있습니다.

### operator 헬퍼 메서드

- operator는 에이전트의 런타임 명령 인벤토리를 가져오기 위해 `commands.list`(`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 워크스페이스를 읽습니다.
  - `scope`는 기본 `name`이 어떤 표면을 대상으로 하는지 제어합니다:
    - `text`는 앞의 `/`가 없는 기본 텍스트 명령 토큰을 반환합니다
    - `native`와 기본값인 `both` 경로는 가능할 때 provider 인식 native 이름을 반환합니다
  - `textAliases`는 `/model` 및 `/m` 같은 정확한 슬래시 별칭을 담습니다.
  - `nativeName`은 존재할 경우 provider 인식 native 명령 이름을 담습니다.
  - `provider`는 선택 사항이며 native 이름 지정과 native plugin 명령 가용성에만 영향을 줍니다.
  - `includeArgs=false`는 응답에서 직렬화된 인자 메타데이터를 제외합니다.
- operator는 에이전트의 런타임 tool 카탈로그를 가져오기 위해 `tools.catalog`(`operator.read`)를 호출할 수 있습니다. 응답에는 그룹화된 tool과 출처 메타데이터가 포함됩니다:
  - `source`: `core` 또는 `plugin`
  - `pluginId`: `source="plugin"`일 때 plugin 소유자
  - `optional`: plugin tool이 선택 사항인지 여부
- operator는 세션의 런타임 유효 tool 인벤토리를 가져오기 위해 `tools.effective`(`operator.read`)를 호출할 수 있습니다.
  - `sessionKey`는 필수입니다.
  - 게이트웨이는 호출자가 제공한 인증 또는 전달 컨텍스트를 받지 않고 세션으로부터 신뢰된 런타임 컨텍스트를 서버 측에서 도출합니다.
  - 응답은 세션 범위이며, core, plugin, channel tool을 포함해 현재 활성 대화가 지금 사용할 수 있는 내용을 반영합니다.
- operator는 에이전트의 표시 가능한 skill 인벤토리를 가져오기 위해 `skills.status`(`operator.read`)를 호출할 수 있습니다.
  - `agentId`는 선택 사항이며, 생략하면 기본 에이전트 워크스페이스를 읽습니다.
  - 응답에는 원시 시크릿 값을 노출하지 않고 적격성, 누락된 요구 사항, 설정 검사, 정리된 설치 옵션이 포함됩니다.
- operator는 ClawHub 디스커버리 메타데이터를 위해 `skills.search`와 `skills.detail`(`operator.read`)를 호출할 수 있습니다.
- operator는 두 가지 모드로 `skills.install`(`operator.admin`)을 호출할 수 있습니다:
  - ClawHub 모드: `{ source: "clawhub", slug, version?, force? }`는 기본 에이전트 워크스페이스 `skills/` 디렉터리에 skill 폴더를 설치합니다.
  - 게이트웨이 설치 프로그램 모드: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`는 게이트웨이 호스트에서 선언된 `metadata.openclaw.install` 작업을 실행합니다.
- operator는 두 가지 모드로 `skills.update`(`operator.admin`)를 호출할 수 있습니다:
  - ClawHub 모드는 추적된 slug 하나 또는 기본 에이전트 워크스페이스의 모든 추적된 ClawHub 설치를 업데이트합니다.
  - 설정 모드는 `enabled`, `apiKey`, `env` 같은 `skills.entries.<skillKey>` 값을 패치합니다.

## Exec 승인

- exec 요청에 승인이 필요하면, 게이트웨이는 `exec.approval.requested`를 브로드캐스트합니다.
- operator 클라이언트는 `exec.approval.resolve`를 호출해 이를 처리합니다(`operator.approvals` 범위 필요).
- `host=node`인 경우 `exec.approval.request`에는 `systemRunPlan`(정규화된 `argv`/`cwd`/`rawCommand`/세션 메타데이터)이 포함되어야 합니다. `systemRunPlan`이 없는 요청은 거부됩니다.
- 승인 후 전달되는 `node.invoke system.run` 호출은 해당 정규 `systemRunPlan`을 권위 있는 명령/cwd/세션 컨텍스트로 재사용합니다.
- 호출자가 prepare와 최종 승인된 `system.run` 전달 사이에서 `command`, `rawCommand`, `cwd`, `agentId`, `sessionKey`를 변경하면, 게이트웨이는 변경된 페이로드를 신뢰하는 대신 실행을 거부합니다.

## 에이전트 전달 폴백

- `agent` 요청에는 아웃바운드 전달을 요청하기 위해 `deliver=true`를 포함할 수 있습니다.
- `bestEffortDeliver=false`는 엄격한 동작을 유지합니다. 해결되지 않거나 내부 전용 전달 대상은 `INVALID_REQUEST`를 반환합니다.
- `bestEffortDeliver=true`는 외부로 전달 가능한 경로를 해석할 수 없을 때(예: internal/webchat 세션 또는 모호한 다중 채널 설정) 세션 전용 실행으로의 폴백을 허용합니다.

## 버전 관리

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema.ts`에 있습니다.
- 클라이언트는 `minProtocol` + `maxProtocol`을 전송하며, 서버는 불일치를 거부합니다.
- 스키마 + 모델은 TypeBox 정의에서 생성됩니다:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## 인증

- 공유 시크릿 게이트웨이 인증은 구성된 인증 모드에 따라 `connect.params.auth.token` 또는 `connect.params.auth.password`를 사용합니다.
- Tailscale Serve(`gateway.auth.allowTailscale: true`) 또는 루프백이 아닌 `gateway.auth.mode: "trusted-proxy"` 같은 identity 포함 모드는 `connect.params.auth.*` 대신 요청 헤더에서 연결 인증 검사를 충족합니다.
- 비공개 인그레스 `gateway.auth.mode: "none"`은 공유 시크릿 연결 인증을 완전히 건너뜁니다. 해당 모드를 공개/신뢰할 수 없는 인그레스에 노출하지 마세요.
- 페어링 후 Gateway는 연결 역할 + 범위로 범위가 제한된 **디바이스 토큰**을 발급합니다. 이 토큰은 `hello-ok.auth.deviceToken`으로 반환되며, 클라이언트는 이후 연결을 위해 이를 저장해야 합니다.
- 클라이언트는 성공적으로 연결한 후 기본 `hello-ok.auth.deviceToken`을 저장해야 합니다.
- 저장된 디바이스 토큰으로 다시 연결할 때는 그 토큰에 대해 저장된 승인 범위 집합도 함께 재사용해야 합니다. 이렇게 하면 이미 부여된 읽기/프로브/상태 액세스를 유지하고, 재연결이 더 좁은 암묵적 관리자 전용 범위로 조용히 축소되는 일을 방지할 수 있습니다.
- 일반적인 연결 인증 우선순위는 명시적 공유 토큰/비밀번호 우선, 그다음 명시적 `deviceToken`, 그다음 저장된 디바이스별 토큰, 마지막으로 부트스트랩 토큰입니다.
- 추가 `hello-ok.auth.deviceTokens` 항목은 부트스트랩 핸드오프 토큰입니다. `wss://` 또는 루프백/로컬 페어링 같은 신뢰된 전송 계층에서 부트스트랩 인증을 사용해 연결한 경우에만 이를 저장하세요.
- 클라이언트가 명시적 `deviceToken` 또는 명시적 `scopes`를 제공하면, 호출자가 요청한 그 범위 집합이 계속 권위 있는 값으로 유지됩니다. 캐시된 범위는 클라이언트가 저장된 디바이스별 토큰을 재사용하는 경우에만 재사용됩니다.
- 디바이스 토큰은 `device.token.rotate`와 `device.token.revoke`를 통해 교체/폐기할 수 있습니다(`operator.pairing` 범위 필요).
- 토큰 발급/교체는 해당 디바이스의 페어링 항목에 기록된 승인 역할 집합 범위 내로 제한됩니다. 토큰을 교체해도 페어링 승인에서 한 번도 허용하지 않은 역할로 디바이스를 확장할 수는 없습니다.
- 페어링된 디바이스 토큰 세션에서, 호출자에게 `operator.admin`도 있지 않은 한 디바이스 관리는 자체 범위로 제한됩니다. 관리자가 아닌 호출자는 **자신의** 디바이스 항목만 제거/폐기/교체할 수 있습니다.
- `device.token.rotate`는 요청된 operator 범위 집합을 호출자의 현재 세션 범위와도 비교합니다. 관리자가 아닌 호출자는 현재 자신이 가진 것보다 더 넓은 operator 범위 집합으로 토큰을 교체할 수 없습니다.
- 인증 실패에는 `error.details.code`와 함께 복구 힌트가 포함됩니다:
  - `error.details.canRetryWithDeviceToken` (불리언)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- `AUTH_TOKEN_MISMATCH`에 대한 클라이언트 동작:
  - 신뢰된 클라이언트는 캐시된 디바이스별 토큰으로 한 번의 제한된 재시도를 시도할 수 있습니다.
  - 그 재시도가 실패하면, 클라이언트는 자동 재연결 루프를 중단하고 운영자 조치 안내를 표시해야 합니다.

## 디바이스 정체성 + 페어링

- 노드는 키 쌍 지문에서 파생된 안정적인 디바이스 정체성(`device.id`)을 포함해야 합니다.
- 게이트웨이는 디바이스 + 역할별로 토큰을 발급합니다.
- 로컬 자동 승인이 활성화되어 있지 않다면, 새 디바이스 ID에는 페어링 승인이 필요합니다.
- 페어링 자동 승인은 직접적인 local loopback 연결을 중심으로 동작합니다.
- OpenClaw에는 신뢰된 공유 시크릿 헬퍼 흐름을 위한, 범위가 좁은 백엔드/컨테이너 로컬 self-connect 경로도 있습니다.
- 동일 호스트의 tailnet 또는 LAN 연결은 여전히 페어링 관점에서 원격으로 취급되며 승인이 필요합니다.
- 모든 WS 클라이언트는 `connect` 중에 `device` 정체성을 포함해야 합니다(operator + node).
  Control UI는 다음 모드에서만 이를 생략할 수 있습니다:
  - localhost 전용 비보안 HTTP 호환성을 위한 `gateway.controlUi.allowInsecureAuth=true`
  - 성공적인 `gateway.auth.mode: "trusted-proxy"` operator Control UI 인증
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (비상용, 심각한 보안 저하)
- 모든 연결은 서버가 제공한 `connect.challenge` nonce에 서명해야 합니다.

### 디바이스 인증 마이그레이션 진단

여전히 사전 챌린지 서명 동작을 사용하는 레거시 클라이언트를 위해, 이제 `connect`는 `error.details.reason`과 함께 안정적인 `error.details.code` 아래 `DEVICE_AUTH_*` 상세 코드를 반환합니다.

일반적인 마이그레이션 실패:

| 메시지 | details.code | details.reason | 의미 |
| ------ | ------------ | -------------- | ---- |
| `device nonce required` | `DEVICE_AUTH_NONCE_REQUIRED` | `device-nonce-missing` | 클라이언트가 `device.nonce`를 생략했거나 빈 값을 보냈습니다. |
| `device nonce mismatch` | `DEVICE_AUTH_NONCE_MISMATCH` | `device-nonce-mismatch` | 클라이언트가 오래되었거나 잘못된 nonce로 서명했습니다. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID` | `device-signature` | 서명 페이로드가 v2 페이로드와 일치하지 않습니다. |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED` | `device-signature-stale` | 서명된 타임스탬프가 허용된 시간 오차 범위를 벗어났습니다. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch` | `device.id`가 공개 키 지문과 일치하지 않습니다. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key` | 공개 키 형식 또는 정규화에 실패했습니다. |

마이그레이션 목표:

- 항상 `connect.challenge`를 기다리세요.
- 서버 nonce가 포함된 v2 페이로드에 서명하세요.
- 동일한 nonce를 `connect.params.device.nonce`에 보내세요.
- 권장 서명 페이로드는 `v3`이며, 이는 device/client/role/scopes/token/nonce 필드에 더해 `platform`과 `deviceFamily`를 바인딩합니다.
- 레거시 `v2` 서명은 호환성을 위해 계속 허용되지만, 페어링된 디바이스 메타데이터 고정은 재연결 시에도 계속 명령 정책을 제어합니다.

## TLS + 핀 고정

- WS 연결에 TLS를 지원합니다.
- 클라이언트는 선택적으로 게이트웨이 인증서 지문을 핀 고정할 수 있습니다(`gateway.tls` 설정과 `gateway.remote.tlsFingerprint` 또는 CLI `--tls-fingerprint` 참조).

## 범위

이 프로토콜은 **전체 게이트웨이 API**(status, channels, models, chat, agent, sessions, nodes, approvals 등)를 노출합니다. 정확한 표면은 `src/gateway/protocol/schema.ts`의 TypeBox 스키마로 정의됩니다.
