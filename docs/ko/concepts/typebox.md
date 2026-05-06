---
read_when:
    - 프로토콜 스키마 또는 코드 생성 업데이트
summary: Gateway 프로토콜의 단일 진실 공급원인 TypeBox 스키마
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T06:23:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox는 TypeScript 우선 schema library입니다. 이를 사용해 **Gateway
WebSocket protocol**(handshake, request/response, server events)을 정의합니다. 이러한 schema는 macOS app을 위한 **runtime validation**, **JSON Schema export**, **Swift codegen**을 구동합니다. 하나의 source of truth이며, 나머지는 모두 생성됩니다.

더 높은 수준의 protocol context를 원한다면
[Gateway architecture](/ko/concepts/architecture)에서 시작하세요.

## Mental model(30초)

모든 Gateway WS 메시지는 다음 세 가지 frame 중 하나입니다.

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

첫 번째 frame은 **반드시** `connect` request여야 합니다. 그 이후에는 client가
method(예: `health`, `send`, `chat.send`)를 호출하고 event(예:
`presence`, `tick`, `agent`)를 구독할 수 있습니다.

Connection flow(최소):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

일반적인 method + event:

| Category   | Examples                                                   | Notes                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect`가 먼저 와야 함           |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effect에는 `idempotencyKey` 필요 |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat이 이를 사용함              |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | session admin                      |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + cron control                |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + node actions          |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

권위 있는 advertised **discovery** inventory는
`src/gateway/server-methods-list.ts`(`listGatewayMethods`, `GATEWAY_EVENTS`)에 있습니다.

## Schema 위치

- Source: `src/gateway/protocol/schema.ts`
- Runtime validators(AJV): `src/gateway/protocol/index.ts`
- Advertised feature/discovery registry: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- Generated JSON Schema: `dist/protocol.schema.json`
- Generated Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## 현재 pipeline

- `pnpm protocol:gen`
  - JSON Schema(draft-07)를 `dist/protocol.schema.json`에 씁니다
- `pnpm protocol:gen:swift`
  - Swift gateway model을 생성합니다
- `pnpm protocol:check`
  - 두 generator를 모두 실행하고 output이 commit되었는지 확인합니다

## Runtime에서 schema가 사용되는 방식

- **Server side**: 모든 inbound frame은 AJV로 validate됩니다. handshake는 params가 `ConnectParams`와 일치하는 `connect` request만 허용합니다.
- **Client side**: JS client는 사용하기 전에 event와 response frame을 validate합니다.
- **Feature discovery**: Gateway는 `listGatewayMethods()`와 `GATEWAY_EVENTS`에서 가져온 보수적인 `features.methods` 및 `features.events` list를 `hello-ok`에 담아 보냅니다.
- 이 discovery list는 `coreGatewayHandlers`의 모든 callable helper를 generated dump한 것이 아닙니다. 일부 helper RPC는 advertised feature list에 열거되지 않고 `src/gateway/server-methods/*.ts`에 구현되어 있습니다.

## Example frame

Connect(첫 번째 메시지):

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
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

Hello-ok response:

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Request + response:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Event:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Minimal client(Node.js)

가장 작은 유용한 flow: connect + health.

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
        minProtocol: 3,
        maxProtocol: 3,
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

## Worked example: method를 end-to-end로 추가하기

예: `{ ok: true, text }`를 반환하는 새 `system.echo` request를 추가합니다.

1. **Schema(source of truth)**

`src/gateway/protocol/schema.ts`에 추가합니다.

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

둘 다 `ProtocolSchemas`에 추가하고 type을 export합니다.

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

`src/gateway/protocol/index.ts`에서 AJV validator를 export합니다.

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Server behavior**

`src/gateway/server-methods/system.ts`에 handler를 추가합니다.

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

`src/gateway/server-methods.ts`에 등록한 다음(`systemHandlers`는 이미 merge됨),
`src/gateway/server-methods-list.ts`의 `listGatewayMethods` input에 `"system.echo"`를 추가합니다.

이 method를 operator 또는 node client가 호출할 수 있다면 scope enforcement와 `hello-ok` feature advertising이 정렬된 상태를 유지하도록 `src/gateway/method-scopes.ts`에서도 분류하세요.

4. **Regenerate**

```bash
pnpm protocol:check
```

5. **Tests + docs**

`src/gateway/server.*.test.ts`에 server test를 추가하고 docs에 method를 기록하세요.

## Swift codegen behavior

Swift generator는 다음을 emit합니다.

- `req`, `res`, `event`, `unknown` case가 있는 `GatewayFrame` enum
- 강하게 typed된 payload struct/enum
- `ErrorCode` value와 `GATEWAY_PROTOCOL_VERSION`

Forward compatibility를 위해 알 수 없는 frame type은 raw payload로 보존됩니다.

## Versioning + compatibility

- `PROTOCOL_VERSION`은 `src/gateway/protocol/schema.ts`에 있습니다.
- Client는 `minProtocol` + `maxProtocol`을 보내며, server는 mismatch를 거부합니다.
- Swift model은 older client가 깨지지 않도록 알 수 없는 frame type을 유지합니다.

## Schema pattern과 convention

- 대부분의 object는 strict payload를 위해 `additionalProperties: false`를 사용합니다.
- `NonEmptyString`은 ID와 method/event name의 기본값입니다.
- 최상위 `GatewayFrame`은 `type`에 **discriminator**를 사용합니다.
- side effect가 있는 method는 보통 params에 `idempotencyKey`가 필요합니다
  (예: `send`, `poll`, `agent`, `chat.send`).
- `agent`는 runtime-generated orchestration context를 위한 선택적 `internalEvents`를 허용합니다
  (예: subagent/cron task completion handoff). 이를 internal API surface로 취급하세요.

## Live schema JSON

Generated JSON Schema는 repo의 `dist/protocol.schema.json`에 있습니다. Published raw file은 일반적으로 다음 위치에서 사용할 수 있습니다.

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Schema를 변경할 때

1. TypeBox schema를 update합니다.
2. `src/gateway/server-methods-list.ts`에 method/event를 register합니다.
3. 새 RPC에 operator 또는 node scope classification이 필요하면 `src/gateway/method-scopes.ts`를 update합니다.
4. `pnpm protocol:check`를 실행합니다.
5. Regenerated schema + Swift model을 commit합니다.

## Related

- [Rich output protocol](/ko/reference/rich-output-protocol)
- [RPC adapters](/ko/reference/rpc)
