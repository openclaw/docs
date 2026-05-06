---
read_when:
    - Оновлення схем протоколу або кодогенерації
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T01:09:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: d96322ee66bbca2405f1cd3f9027be2bdddc40075d663c24714b0d3149744253
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — це schema library з орієнтацією на TypeScript. Ми використовуємо її для визначення **Gateway
WebSocket protocol** (handshake, request/response, server events). Ці схеми
забезпечують **runtime validation**, **JSON Schema export** і **Swift codegen** для
macOS app. Одне джерело істини; усе інше генерується.

Якщо вам потрібен контекст протоколу вищого рівня, почніть із
[Gateway architecture](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне Gateway WS-повідомлення є одним із трьох frames:

- **Request**: `{ type: "req", id, method, params }`
- **Response**: `{ type: "res", id, ok, payload | error }`
- **Event**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший frame **обов’язково** має бути `connect` request. Після цього clients можуть викликати
methods (наприклад, `health`, `send`, `chat.send`) і підписуватися на events (наприклад,
`presence`, `tick`, `agent`).

Потік підключення (мінімальний):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Поширені methods + events:

| Категорія | Приклади                                                   | Примітки                           |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Core       | `connect`, `health`, `status`                              | `connect` має бути першим          |
| Messaging  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects потребують `idempotencyKey` |
| Chat       | `chat.history`, `chat.send`, `chat.abort`                  | WebChat використовує їх            |
| Sessions   | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування sessions           |
| Automation | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування wake + cron              |
| Nodes      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії node              |
| Events     | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

Авторитетний оголошений інвентар **discovery** розміщено в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де розміщені схеми

- Джерело: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- Оголошений реєстр feature/discovery: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний pipeline

- `pnpm protocol:gen`
  - записує JSON Schema (draft‑07) у `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує Swift gateway models
- `pnpm protocol:check`
  - запускає обидва генератори й перевіряє, що output закомічено

## Як схеми використовуються під час runtime

- **Server side**: кожен вхідний frame перевіряється через AJV. Handshake приймає лише
  `connect` request, params якого відповідають `ConnectParams`.
- **Client side**: JS client перевіряє event і response frames перед
  використанням.
- **Feature discovery**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` з `listGatewayMethods()` і
  `GATEWAY_EVENTS`.
- Цей discovery list не є згенерованим дампом кожного callable helper у
  `coreGatewayHandlers`; деякі helper RPC реалізовано в
  `src/gateway/server-methods/*.ts` без переліку в оголошеному
  feature list.

## Приклади frames

Connect (перше повідомлення):

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

## Мінімальний client (Node.js)

Найменший корисний flow: connect + health.

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

## Робочий приклад: додати method від початку до кінця

Приклад: додайте новий `system.echo` request, який повертає `{ ok: true, text }`.

1. **Schema (джерело істини)**

Додайте до `src/gateway/protocol/schema.ts`:

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

Додайте обидва до `ProtocolSchemas` і експортуйте types:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Validation**

У `src/gateway/protocol/index.ts` експортуйте AJV validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Server behavior**

Додайте handler у `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Зареєструйте його в `src/gateway/server-methods.ts` (уже об’єднує `systemHandlers`),
потім додайте `"system.echo"` до input `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо method може викликатися operator або node clients, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб scope enforcement і оголошення features у `hello-ok`
залишалися узгодженими.

4. **Regenerate**

```bash
pnpm protocol:check
```

5. **Tests + docs**

Додайте server test у `src/gateway/server.*.test.ts` і зазначте method у docs.

## Поведінка Swift codegen

Swift generator виводить:

- `GatewayFrame` enum з cases `req`, `res`, `event` і `unknown`
- строго типізовані payload structs/enums
- значення `ErrorCode` і `GATEWAY_PROTOCOL_VERSION`

Невідомі frame types зберігаються як raw payloads для forward compatibility.

## Versioning + compatibility

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/schema.ts`.
- Clients надсилають `minProtocol` + `maxProtocol`; server відхиляє mismatches.
- Swift models зберігають невідомі frame types, щоб не ламати старіші clients.

## Schema patterns and conventions

- Більшість objects використовують `additionalProperties: false` для strict payloads.
- `NonEmptyString` є default для IDs і method/event names.
- Top-level `GatewayFrame` використовує **discriminator** на `type`.
- Methods із side effects зазвичай потребують `idempotencyKey` у params
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає опційні `internalEvents` для runtime-generated orchestration context
  (наприклад, handoff завершення subagent/cron task); вважайте це internal API surface.

## Live schema JSON

Згенерована JSON Schema є в repo за шляхом `dist/protocol.schema.json`. Опублікований
raw file зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте schemas

1. Оновіть TypeBox schemas.
2. Зареєструйте method/event у `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новому RPC потрібна класифікація operator або
   node scope.
4. Запустіть `pnpm protocol:check`.
5. Закомітьте regenerated schema + Swift models.

## Пов’язане

- [Rich output protocol](/uk/reference/rich-output-protocol)
- [RPC adapters](/uk/reference/rpc)
