---
read_when:
    - Оновлення схем протоколу або генерації коду
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-06T05:09:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e188ec0fefcbaf01c8b575a1898eafbbcf309d3032930aa0c09c2d9a63b93e5
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — це орієнтована на TypeScript бібліотека схем. Ми використовуємо її для визначення **протоколу WebSocket Gateway** (рукостискання, запит/відповідь, серверні події). Ці схеми забезпечують **валідацію під час виконання**, **експорт JSON Schema** і **генерацію коду Swift** для застосунку macOS. Єдине джерело істини; усе інше генерується.

Якщо вам потрібен високорівневий контекст протоколу, почніть із
[архітектури Gateway](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне повідомлення Gateway WS є одним із трьох кадрів:

- **Запит**: `{ type: "req", id, method, params }`
- **Відповідь**: `{ type: "res", id, ok, payload | error }`
- **Подія**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший кадр **обов’язково** має бути запитом `connect`. Після цього клієнти можуть викликати
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

| Категорія  | Приклади                                                   | Примітки                          |
| ---------- | ---------------------------------------------------------- | --------------------------------- |
| Ядро       | `connect`, `health`, `status`                              | `connect` має бути першим         |
| Обмін повідомленнями | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | побічні ефекти потребують `idempotencyKey` |
| Чат        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat використовує їх           |
| Сеанси     | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сеансів           |
| Автоматизація | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування wake + cron             |
| Вузли      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії вузлів           |
| Події      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | серверне надсилання               |

Авторитетний рекламований інвентар **виявлення** міститься в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де розташовані схеми

- Джерело: `src/gateway/protocol/schema.ts`
- Валідатори під час виконання (AJV): `src/gateway/protocol/index.ts`
- Рекламований реєстр функцій/виявлення: `src/gateway/server-methods-list.ts`
- Серверне рукостискання + диспетчеризація методів: `src/gateway/server.impl.ts`
- Клієнт Node: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані моделі Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний конвеєр

- `pnpm protocol:gen`
  - записує JSON Schema (draft-07) у `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує моделі Gateway для Swift
- `pnpm protocol:check`
  - запускає обидва генератори та перевіряє, що результат закомічено

## Як схеми використовуються під час виконання

- **На боці сервера**: кожен вхідний кадр валідується через AJV. Рукостискання приймає лише
  запит `connect`, параметри якого відповідають `ConnectParams`.
- **На боці клієнта**: JS-клієнт валідує кадри подій і відповідей перед
  використанням.
- **Виявлення функцій**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` з `listGatewayMethods()` та
  `GATEWAY_EVENTS`.
- Цей список виявлення не є згенерованим дампом кожного допоміжного виклику в
  `coreGatewayHandlers`; деякі допоміжні RPC реалізовані в
  `src/gateway/server-methods/*.ts` без перелічення в рекламованому
  списку функцій.

## Приклади кадрів

Підключення (перше повідомлення):

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

Відповідь hello-ok:

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

Найменший корисний потік: підключення + health.

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

## Опрацьований приклад: додати метод від початку до кінця

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

У `src/gateway/protocol/index.ts` експортуйте валідатор AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Поведінка сервера**

Додайте обробник у `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Зареєструйте його в `src/gateway/server-methods.ts` (він уже об’єднує `systemHandlers`),
а потім додайте `"system.echo"` до входу `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо метод може викликатися клієнтами оператора або вузла, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб примусове застосування областей і рекламування функцій
`hello-ok` залишалися узгодженими.

4. **Повторна генерація**

```bash
pnpm protocol:check
```

5. **Тести + документація**

Додайте серверний тест у `src/gateway/server.*.test.ts` і зазначте метод у документації.

## Поведінка генерації коду Swift

Генератор Swift створює:

- enum `GatewayFrame` з випадками `req`, `res`, `event` і `unknown`
- строго типізовані структури/enum для payload
- значення `ErrorCode` і `GATEWAY_PROTOCOL_VERSION`

Невідомі типи кадрів зберігаються як raw payload для прямої сумісності.

## Версійність + сумісність

- `PROTOCOL_VERSION` розташований у `src/gateway/protocol/schema.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Моделі Swift зберігають невідомі типи кадрів, щоб не ламати старіші клієнти.

## Шаблони та домовленості схем

- Більшість об’єктів використовують `additionalProperties: false` для строгих payload.
- `NonEmptyString` є типовим значенням для ідентифікаторів і назв методів/подій.
- Верхньорівневий `GatewayFrame` використовує **дискримінатор** на `type`.
- Методи з побічними ефектами зазвичай потребують `idempotencyKey` у параметрах
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає необов’язкові `internalEvents` для згенерованого під час виконання контексту оркестрації
  (наприклад, передача після завершення задачі subagent/cron); вважайте це внутрішньою поверхнею API.

## Жива JSON схеми

Згенерована JSON Schema розташована в репозиторії за адресою `dist/protocol.schema.json`. Опублікований
raw-файл зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть схеми TypeBox.
2. Зареєструйте метод/подію в `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новому RPC потрібна класифікація області оператора або
   вузла.
4. Запустіть `pnpm protocol:check`.
5. Закомітьте повторно згенеровану схему + моделі Swift.

## Пов’язане

- [Протокол насиченого виводу](/uk/reference/rich-output-protocol)
- [Адаптери RPC](/uk/reference/rpc)
