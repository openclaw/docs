---
read_when:
    - 프로토콜 스키마 또는 코드 생성 업데이트
summary: Gateway 프로토콜의 단일 진실 공급원인 TypeBox 스키마
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T00:43:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox는 TypeScript 우선 스키마 라이브러리입니다. OpenClaw는 이를 사용하여 **Gateway 웹소켓 프로토콜**(핸드셰이크, 요청/응답, 서버 이벤트)을 정의합니다. 이러한 스키마는 **런타임 검증**(AJV), **JSON Schema 내보내기**, macOS 앱용 **Swift 코드 생성**을 구동합니다. 단일 진실 공급원이며, 나머지는 모두 여기에서 생성됩니다.

상위 수준의 프로토콜 맥락은 [Gateway 아키텍처](/ko/concepts/architecture)부터 살펴보세요.

## 개념 모델(30초)

모든 Gateway WS 메시지는 다음 세 프레임 중 하나입니다.

- **요청**: `{ type: "req", id, method, params }`
- **응답**: `{ type: "res", id, ok, payload | error }`
- **이벤트**: `{ type: "event", event, payload, seq?, stateVersion? }`

첫 번째 프레임은 **반드시** `connect` 요청이어야 합니다. 이후 클라이언트는 메서드(예: `health`, `send`, `chat.send`)를 호출하고 이벤트(예: `presence`, `tick`, `agent`)를 구독합니다.

연결 흐름(최소 구성):

```text
클라이언트                Gateway
  |---- 요청:connect ------->|
  |<---- 응답:hello-ok -------|
  |<---- 이벤트:tick ---------|
  |---- 요청:health -------->|
  |<---- 응답:health ---------|
```

일반적인 메서드와 이벤트:

| 범주       | 예시                                                       | 참고                                           |
| ---------- | ---------------------------------------------------------- | ---------------------------------------------- |
| 핵심       | `connect`, `health`, `status`                              | `connect`가 첫 번째여야 함                     |
| 메시징     | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | 부작용이 있는 메서드에는 `idempotencyKey` 필요 |
| 채팅       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat에서 사용                               |
| 세션       | `sessions.list`, `sessions.patch`, `sessions.delete`       | 세션 관리                                      |
| 자동화     | `wake`, `cron.list`, `cron.run`, `cron.runs`               | 깨우기 및 Cron 제어                            |
| Node       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS 및 Node 작업                        |
| 이벤트     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | 서버 푸시                                      |

공식적으로 공시되는 **탐색** 목록은 `src/gateway/server-methods-list.ts`의 `listGatewayMethods`, `GATEWAY_EVENTS`에 있습니다.

## 스키마 위치

- 소스 배럴: `packages/gateway-protocol/src/schema.ts`는 `packages/gateway-protocol/src/schema/*.ts` 아래의 도메인 모듈을 다시 내보냅니다(최상위 엔벌로프와 핸드셰이크는 `frames.ts`, 기능 영역별로 `agent.ts`, `sessions.ts`, `cron.ts` 등). `protocol-schemas.ts`는 스키마 이름을 해당 TypeBox 정의에 매핑하는 중앙 `ProtocolSchemas` 레지스트리입니다.
- 런타임 검증기(AJV): `packages/gateway-protocol/src/index.ts`
- 공시되는 기능/탐색 레지스트리: `src/gateway/server-methods-list.ts`
- 서버 핸드셰이크 및 메서드 디스패치: `src/gateway/server.impl.ts`
- Node 클라이언트: `src/gateway/client.ts`
- 생성된 JSON Schema: `dist/protocol.schema.json`(빌드 출력이며 커밋하지 않음)
- 생성된 Swift 모델: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## 현재 파이프라인

- `pnpm protocol:gen`은 JSON Schema(draft-07)를 `dist/protocol.schema.json`에 작성합니다.
- `pnpm protocol:gen:swift`는 Swift Gateway 모델을 생성합니다.
- `pnpm protocol:check`는 두 생성기를 모두 실행하고 Swift 출력이 커밋되었는지 확인합니다(JSON Schema 출력은 Git에서 무시되는 빌드 산출물입니다).

## 런타임에서 스키마가 사용되는 방식

- **서버 측**: 모든 수신 프레임을 AJV로 검증합니다. 핸드셰이크는 매개변수가 `ConnectParams`와 일치하는 `connect` 요청만 허용합니다.
- **클라이언트 측**: JS 클라이언트는 이벤트 및 응답 프레임을 사용하기 전에 검증합니다.
- **기능 탐색**: Gateway는 `listGatewayMethods()`와 `GATEWAY_EVENTS`에서 가져온 보수적인 `features.methods` 및 `features.events` 목록을 `hello-ok`에 포함해 전송합니다.
- 이 탐색 목록은 `coreGatewayHandlers`에 있는 모든 호출 가능 도우미를 자동 생성하여 나열한 것이 아닙니다. 일부 도우미 RPC는 공시되는 기능 목록에 열거되지 않은 채 `src/gateway/server-methods/*.ts`에 구현되어 있습니다.

## 프레임 예시

연결(첫 번째 메시지):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok 응답:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

요청 및 응답:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

이벤트:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## 최소 클라이언트(Node.js)

유용한 최소 흐름: 연결 + 상태 확인.

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 4,
        maxProtocol: 4,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

## 전체 과정 예시: 메서드 추가

예시: `{ ok: true, text }`를 반환하는 새로운 `system.echo` 요청을 추가합니다.

1. **스키마(진실 공급원)**

`packages/gateway-protocol/src/schema/system.ts` 또는 가장 가까운 기능 모듈에 추가합니다.

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

두 항목을 `packages/gateway-protocol/src/schema/protocol-schemas.ts`로 가져와 `ProtocolSchemas` 레지스트리에 추가하고 파생된 타입을 내보냅니다.

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **검증**

`packages/gateway-protocol/src/index.ts`에서 AJV 검증기를 내보냅니다.

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **서버 동작**

`src/gateway/server-methods/system.ts`에 핸들러를 추가합니다.

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

`src/gateway/server-methods.ts`에 등록하고(이미 `systemHandlers`를 병합함), `src/gateway/server-methods-list.ts`의 `listGatewayMethods` 입력에 `"system.echo"`를 추가합니다.

운영자 또는 Node 클라이언트가 이 메서드를 호출할 수 있다면 범위 적용과 `hello-ok` 기능 공시가 일치하도록 `src/gateway/method-scopes.ts`에서도 이를 분류합니다.

4. **재생성**

```bash
pnpm protocol:check
```

5. **테스트 및 문서**

`src/gateway/server.*.test.ts`에 서버 테스트를 추가하고 문서에 해당 메서드를 기록합니다.

## Swift 코드 생성 동작

Swift 생성기는 다음을 출력합니다.

- `req`, `res`, `event`, `unknown` 케이스가 있는 `GatewayFrame` 열거형
- 강력한 타입이 적용된 페이로드 구조체/열거형
- `ErrorCode` 값, `GATEWAY_PROTOCOL_VERSION`, `GATEWAY_MIN_PROTOCOL_VERSION`

전방 호환성을 위해 알 수 없는 프레임 유형은 원시 페이로드로 보존됩니다.

## 버전 관리 및 호환성

- `PROTOCOL_VERSION`은 `packages/gateway-protocol/src/version.ts`에 있습니다(현재 값: `4`).
- 클라이언트는 `minProtocol`과 `maxProtocol`을 전송하며, 서버는 현재 프로토콜을 포함하지 않는 범위를 거부합니다.
- Swift 모델은 이전 클라이언트가 중단되지 않도록 알 수 없는 프레임 유형을 유지합니다.

## 스키마 패턴 및 규칙

- 대부분의 객체는 엄격한 페이로드를 위해 `additionalProperties: false`를 사용합니다.
- `NonEmptyString`(`Type.String({ minLength: 1 })`)은 ID와 메서드/이벤트 이름의 기본값입니다.
- 최상위 `GatewayFrame`은 `type`에 **판별자**를 사용합니다.
- 부작용이 있는 메서드는 일반적으로 매개변수에 `idempotencyKey`가 필요합니다(예: `send`, `poll`, `agent`, `chat.send`).
- `agent`는 런타임에서 생성된 오케스트레이션 맥락(예: 하위 에이전트/Cron 작업 완료 인계)을 위한 선택적 `internalEvents`를 허용합니다. 이를 내부 API 표면으로 취급하세요.

## 라이브 스키마 JSON

생성된 JSON Schema는 빌드 산출물이며 저장소에 커밋되지 않습니다. 게시된 원시 파일은 일반적으로 다음 위치에서 사용할 수 있습니다.

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## 스키마를 변경할 때

1. 해당 기능을 소유한 `packages/gateway-protocol/src/schema/*.ts` 모듈의 TypeBox 스키마를 업데이트하고 `protocol-schemas.ts`에 등록합니다.
2. `src/gateway/server-methods-list.ts`에 메서드/이벤트를 등록합니다.
3. 새 RPC에 운영자 또는 Node 범위 분류가 필요한 경우 `src/gateway/method-scopes.ts`를 업데이트합니다.
4. `pnpm protocol:check`를 실행합니다.
5. 재생성된 Swift 모델을 커밋합니다.

## 관련 항목

- [리치 출력 프로토콜](/ko/reference/rich-output-protocol)
- [RPC 어댑터](/ko/reference/rpc)
