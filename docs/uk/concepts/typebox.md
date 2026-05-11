---
read_when:
    - Оновлення схем протоколу або генерації коду
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-11T20:34:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: ecc9a69ac6d4ac101a4a6f34e44acfbe952dce0f90d178d4f8559191fb92c3b4
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — це schema-бібліотека, орієнтована на TypeScript. Ми використовуємо її для визначення **WebSocket-протоколу Gateway** (рукостискання, запит/відповідь, серверні події). Ці схеми керують **runtime-валідацією**, **експортом JSON Schema** і **генерацією коду Swift** для застосунку macOS. Одне джерело істини; усе інше генерується.

Якщо вам потрібен високорівневий контекст протоколу, почніть з
[архітектури Gateway](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне WS-повідомлення Gateway є одним із трьох фреймів:

- **Запит**: `{ type: "req", id, method, params }`
- **Відповідь**: `{ type: "res", id, ok, payload | error }`
- **Подія**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший фрейм **обов’язково** має бути запитом `connect`. Після цього клієнти можуть викликати
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

Поширені методи й події:

| Категорія  | Приклади                                                   | Примітки                          |
| ---------- | ---------------------------------------------------------- | --------------------------------- |
| Ядро       | `connect`, `health`, `status`                              | `connect` має бути першим         |
| Обмін повідомленнями | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | побічні ефекти потребують `idempotencyKey` |
| Чат        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat використовує їх           |
| Сеанси     | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сеансів           |
| Автоматизація | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування wake + cron             |
| Вузли      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії вузлів           |
| Події      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | server push                       |

Авторитетний рекламований інвентар **discovery** міститься в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де містяться схеми

- Джерело: `src/gateway/protocol/schema.ts`
- Runtime-валідатори (AJV): `src/gateway/protocol/index.ts`
- Рекламований реєстр функцій/discovery: `src/gateway/server-methods-list.ts`
- Серверне рукостискання + диспетчеризація методів: `src/gateway/server.impl.ts`
- Клієнт Node: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані моделі Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний pipeline

- `pnpm protocol:gen`
  - записує JSON Schema (draft-07) у `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує моделі Gateway для Swift
- `pnpm protocol:check`
  - запускає обидва генератори й перевіряє, що результат закомічено

## Як схеми використовуються під час виконання

- **На боці сервера**: кожен вхідний фрейм валідується через AJV. Рукостискання приймає лише
  запит `connect`, params якого відповідають `ConnectParams`.
- **На боці клієнта**: JS-клієнт валідує фрейми подій і відповідей перед
  використанням.
- **Feature discovery**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` з `listGatewayMethods()` і
  `GATEWAY_EVENTS`.
- Цей список discovery не є згенерованим дампом кожного callable helper у
  `coreGatewayHandlers`; деякі допоміжні RPC реалізовані в
  `src/gateway/server-methods/*.ts` без переліку в рекламованому
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

Відповідь hello-ok:

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

## Практичний приклад: додати метод end-to-end

Приклад: додати новий запит `system.echo`, який повертає `{ ok: true, text }`.

1. **Схема (джерело істини)**

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

У `src/gateway/protocol/index.ts` експортуйте AJV-валідатор:

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

Зареєструйте його в `src/gateway/server-methods.ts` (уже об’єднує `systemHandlers`),
потім додайте `"system.echo"` до вхідних даних `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо метод може викликатися клієнтами оператора або вузла, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб примусове застосування scope і рекламування функцій
у `hello-ok` залишалися узгодженими.

4. **Регенерація**

```bash
pnpm protocol:check
```

5. **Тести + документація**

Додайте серверний тест у `src/gateway/server.*.test.ts` і згадайте метод у документації.

## Поведінка генерації коду Swift

Генератор Swift створює:

- enum `GatewayFrame` з cases `req`, `res`, `event` і `unknown`
- строго типізовані structs/enums для payload
- значення `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` і `GATEWAY_MIN_PROTOCOL_VERSION`

Невідомі типи фреймів зберігаються як raw payloads для forward compatibility.

## Версіонування + сумісність

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє діапазони, які
  не містять його поточного протоколу.
- Моделі Swift зберігають невідомі типи фреймів, щоб не ламати старіші клієнти.

## Патерни та домовленості схем

- Більшість об’єктів використовують `additionalProperties: false` для строгих payload.
- `NonEmptyString` є типовим варіантом для ID та назв методів/подій.
- Верхньорівневий `GatewayFrame` використовує **discriminator** на `type`.
- Методи з побічними ефектами зазвичай потребують `idempotencyKey` у params
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає опційний `internalEvents` для runtime-згенерованого контексту оркестрації
  (наприклад, передавання завершення завдання subagent/cron); розглядайте це як внутрішню API-поверхню.

## Live JSON схеми

Згенерована JSON Schema є в репозиторії за адресою `dist/protocol.schema.json`. Опублікований
raw-файл зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть схеми TypeBox.
2. Зареєструйте метод/подію в `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новий RPC потребує класифікації scope оператора або
   вузла.
4. Запустіть `pnpm protocol:check`.
5. Закомітьте регенеровану схему + моделі Swift.

## Пов’язане

- [Протокол rich output](/uk/reference/rich-output-protocol)
- [Адаптери RPC](/uk/reference/rpc)
