---
read_when:
    - प्रोटोकॉल स्कीमा या codegen अपडेट करना
summary: Gateway प्रोटोकॉल के लिए सत्य के एकल स्रोत के रूप में TypeBox स्कीमा
title: TypeBox
x-i18n:
    generated_at: "2026-06-28T23:03:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox एक TypeScript-first schema लाइब्रेरी है। हम इसका उपयोग **Gateway
WebSocket protocol** (handshake, request/response, server events) को परिभाषित करने के लिए करते हैं। वे schemas
**runtime validation**, **JSON Schema export**, और macOS app के लिए **Swift codegen** चलाते हैं। सत्य का एक स्रोत; बाकी सब generated है।

यदि आपको उच्च-स्तरीय protocol संदर्भ चाहिए, तो
[Gateway architecture](/hi/concepts/architecture) से शुरू करें।

## मानसिक मॉडल (30 सेकंड)

हर Gateway WS message इन तीन frames में से एक होता है:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

पहला frame **अनिवार्य रूप से** `connect` request होना चाहिए। उसके बाद, clients
methods (जैसे `health`, `send`, `chat.send`) call कर सकते हैं और events (जैसे
`presence`, `tick`, `agent`) subscribe कर सकते हैं।

Connection flow (न्यूनतम):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

सामान्य methods + events:

| श्रेणी     | उदाहरण                                                    | नोट्स                              |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` पहले होना चाहिए          |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects को `idempotencyKey` चाहिए |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat इन्हें उपयोग करता है       |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | session admin                      |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | wake + cron control                |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + node actions          |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

प्रामाणिक advertised **discovery** inventory
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`) में रहती है।

## Schemas कहां रहते हैं

- Source: `packages/gateway-protocol/src/schema.ts`
- Runtime validators (AJV): `packages/gateway-protocol/src/index.ts`
- Advertised feature/discovery registry: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- Generated JSON Schema: `dist/protocol.schema.json`
- Generated Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## मौजूदा pipeline

- `pnpm protocol:gen`
  - JSON Schema (draft-07) को `dist/protocol.schema.json` में लिखता है
- `pnpm protocol:gen:swift`
  - Swift gateway models generate करता है
- `pnpm protocol:check`
  - दोनों generators चलाता है और verify करता है कि output committed है

## Runtime पर schemas का उपयोग कैसे होता है

- **Server side**: हर inbound frame AJV से validate किया जाता है। handshake केवल
  वह `connect` request accept करता है जिसके params `ConnectParams` से match करते हैं।
- **Client side**: JS client event और response frames को उपयोग करने से पहले
  validate करता है।
- **Feature discovery**: Gateway `listGatewayMethods()` और
  `GATEWAY_EVENTS` से `hello-ok` में एक conservative `features.methods`
  और `features.events` list भेजता है।
- वह discovery list `coreGatewayHandlers` में मौजूद हर callable helper का generated dump
  नहीं है; कुछ helper RPCs `src/gateway/server-methods/*.ts` में implement होते हैं,
  बिना advertised feature list में enumerate हुए।

## Example frames

Connect (पहला message):

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

Hello-ok response:

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

## न्यूनतम client (Node.js)

सबसे छोटा उपयोगी flow: connect + health।

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

## Worked example: एक method end-to-end जोड़ें

Example: एक नया `system.echo` request जोड़ें जो `{ ok: true, text }` लौटाता है।

1. **Schema (सत्य का स्रोत)**

`packages/gateway-protocol/src/schema.ts` में जोड़ें:

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

दोनों को `ProtocolSchemas` में जोड़ें और types export करें:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

`packages/gateway-protocol/src/index.ts` में, एक AJV validator export करें:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Server behavior**

`src/gateway/server-methods/system.ts` में एक handler जोड़ें:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

इसे `src/gateway/server-methods.ts` में register करें (पहले से `systemHandlers` merge करता है),
फिर `src/gateway/server-methods-list.ts` में `listGatewayMethods` input में
`"system.echo"` जोड़ें।

यदि method operator या node clients द्वारा callable है, तो इसे
`src/gateway/method-scopes.ts` में भी classify करें ताकि scope enforcement और `hello-ok` feature
advertising aligned रहें।

4. **Regenerate**

```bash
pnpm protocol:check
```

5. **Tests + docs**

`src/gateway/server.*.test.ts` में एक server test जोड़ें और docs में method note करें।

## Swift codegen behavior

Swift generator emit करता है:

- `GatewayFrame` enum, जिसमें `req`, `res`, `event`, और `unknown` cases होते हैं
- Strongly typed payload structs/enums
- `ErrorCode` values, `GATEWAY_PROTOCOL_VERSION`, और `GATEWAY_MIN_PROTOCOL_VERSION`

Forward compatibility के लिए unknown frame types raw payloads के रूप में preserve किए जाते हैं।

## Versioning + compatibility

- `PROTOCOL_VERSION` `packages/gateway-protocol/src/version.ts` में रहता है।
- Clients `minProtocol` + `maxProtocol` भेजते हैं; server उन ranges को reject करता है जो
  उसके current protocol को include नहीं करते।
- Swift models older clients को break करने से बचाने के लिए unknown frame types रखते हैं।

## Schema patterns और conventions

- अधिकांश objects strict payloads के लिए `additionalProperties: false` उपयोग करते हैं।
- IDs और method/event names के लिए `NonEmptyString` default है।
- Top-level `GatewayFrame` `type` पर **discriminator** उपयोग करता है।
- Side effects वाले methods को आमतौर पर params में `idempotencyKey` चाहिए होता है
  (example: `send`, `poll`, `agent`, `chat.send`)।
- `agent` runtime-generated orchestration context के लिए optional `internalEvents` accept करता है
  (उदाहरण के लिए subagent/cron task completion handoff); इसे internal API surface मानें।

## Live schema JSON

Generated JSON Schema repo में `dist/protocol.schema.json` पर है। Published raw file आमतौर पर यहां उपलब्ध होती है:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## जब आप schemas बदलते हैं

1. TypeBox schemas update करें।
2. Method/event को `src/gateway/server-methods-list.ts` में register करें।
3. जब नए RPC को operator या node scope classification चाहिए हो, तो
   `src/gateway/method-scopes.ts` update करें।
4. `pnpm protocol:check` चलाएं।
5. Regenerated schema + Swift models commit करें।

## संबंधित

- [Rich output protocol](/hi/reference/rich-output-protocol)
- [RPC adapters](/hi/reference/rpc)
