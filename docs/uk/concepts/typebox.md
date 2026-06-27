---
read_when:
    - Оновлення схем протоколу або генерації коду
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-06-27T17:29:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — це schema-бібліотека, орієнтована на TypeScript. Ми використовуємо її для визначення **Gateway
WebSocket protocol** (handshake, request/response, server events). Ці схеми
керують **runtime validation**, **JSON Schema export** і **Swift codegen** для
macOS app. Одне джерело істини; усе інше генерується.

Якщо вам потрібен контекст протоколу вищого рівня, почніть із
[архітектури Gateway](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне повідомлення Gateway WS є одним із трьох фреймів:

- **Запит**: `{ type: "req", id, method, params }`
- **Відповідь**: `{ type: "res", id, ok, payload | error }`
- **Подія**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший фрейм **обов'язково** має бути запитом `connect`. Після цього клієнти можуть викликати
методи (наприклад, `health`, `send`, `chat.send`) і підписуватися на події (наприклад,
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

Поширені методи + події:

| Категорія | Приклади                                                   | Примітки                           |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Ядро       | `connect`, `health`, `status`                              | `connect` має бути першим          |
| Повідомлення | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | side-effects потребують `idempotencyKey` |
| Чат        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat використовує їх            |
| Сесії      | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сесій              |
| Автоматизація | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування wake + cron              |
| Вузли      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії вузлів            |
| Події      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                        |

Авторитетний рекламований інвентар **discovery** міститься в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де містяться схеми

- Джерело: `packages/gateway-protocol/src/schema.ts`
- Runtime validators (AJV): `packages/gateway-protocol/src/index.ts`
- Реєстр рекламованих функцій/discovery: `src/gateway/server-methods-list.ts`
- Server handshake + method dispatch: `src/gateway/server.impl.ts`
- Node client: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані Swift models: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний pipeline

- `pnpm protocol:gen`
  - записує JSON Schema (draft-07) у `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує Swift gateway models
- `pnpm protocol:check`
  - запускає обидва генератори й перевіряє, що output закомічено

## Як схеми використовуються під час виконання

- **На боці сервера**: кожен вхідний фрейм перевіряється через AJV. Handshake приймає лише
  запит `connect`, params якого відповідають `ConnectParams`.
- **На боці клієнта**: JS client перевіряє фрейми подій і відповідей перед
  їх використанням.
- **Feature discovery**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` з `listGatewayMethods()` і
  `GATEWAY_EVENTS`.
- Цей список discovery не є згенерованим дампом кожного callable helper у
  `coreGatewayHandlers`; деякі helper RPC реалізовано в
  `src/gateway/server-methods/*.ts` без перелічення в рекламованому
  списку функцій.

## Приклади фреймів

Connect (перше повідомлення):

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

Відповідь Hello-ok:

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

Запит + відповідь:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Подія:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Мінімальний клієнт (Node.js)

Найменший корисний потік: connect + health.

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

## Робочий приклад: додати метод від початку до кінця

Приклад: додайте новий запит `system.echo`, який повертає `{ ok: true, text }`.

1. **Схема (джерело істини)**

Додайте до `packages/gateway-protocol/src/schema.ts`:

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

Додайте обидві до `ProtocolSchemas` і експортуйте типи:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Валідація**

У `packages/gateway-protocol/src/index.ts` експортуйте AJV validator:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Поведінка сервера**

Додайте handler у `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Зареєструйте його в `src/gateway/server-methods.ts` (він уже об'єднує `systemHandlers`),
потім додайте `"system.echo"` до input `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо метод може викликатися клієнтами operator або node, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб scope enforcement і рекламування функцій `hello-ok`
залишалися узгодженими.

4. **Перегенеруйте**

```bash
pnpm protocol:check
```

5. **Тести + документація**

Додайте server test у `src/gateway/server.*.test.ts` і зазначте метод у документації.

## Поведінка Swift codegen

Swift generator створює:

- enum `GatewayFrame` з cases `req`, `res`, `event` і `unknown`
- Суворо типізовані payload structs/enums
- Значення `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` і `GATEWAY_MIN_PROTOCOL_VERSION`

Невідомі типи фреймів зберігаються як raw payloads для forward compatibility.

## Версіонування + сумісність

- `PROTOCOL_VERSION` міститься в `packages/gateway-protocol/src/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє діапазони, які
  не включають його поточний протокол.
- Swift models зберігають невідомі типи фреймів, щоб не ламати старіші клієнти.

## Патерни й домовленості схем

- Більшість об'єктів використовують `additionalProperties: false` для strict payloads.
- `NonEmptyString` є типовим значенням для IDs і назв method/event.
- Верхньорівневий `GatewayFrame` використовує **discriminator** на `type`.
- Методи з side effects зазвичай потребують `idempotencyKey` у params
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає необов'язкові `internalEvents` для згенерованого під час виконання orchestration context
  (наприклад, subagent/cron task completion handoff); розглядайте це як внутрішню API surface.

## Live schema JSON

Згенерована JSON Schema міститься в репозиторії за адресою `dist/protocol.schema.json`. Опублікований
raw file зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть TypeBox schemas.
2. Зареєструйте method/event у `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новий RPC потребує класифікації scope для operator або
   node.
4. Запустіть `pnpm protocol:check`.
5. Закомітьте перегенеровану schema + Swift models.

## Пов'язане

- [Протокол rich output](/uk/reference/rich-output-protocol)
- [RPC adapters](/uk/reference/rpc)
