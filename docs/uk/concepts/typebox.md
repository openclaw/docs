---
read_when:
    - Оновлення схем протоколу або генерації коду
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-05-07T13:15:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95baccfdfa6f77ba57f6ac8502d502084289a84cfd03a450dd1e9422931706dd
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — це schema-бібліотека з пріоритетом TypeScript. Ми використовуємо її для визначення **Gateway
WebSocket protocol** (рукостискання, запит/відповідь, серверні події). Ці схеми
керують **runtime validation**, **експортом JSON Schema** і **Swift codegen** для
застосунку macOS. Одне джерело істини; усе інше генерується.

Якщо вам потрібен контекст протоколу вищого рівня, почніть із
[архітектури Gateway](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне повідомлення Gateway WS є одним із трьох фреймів:

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

Поширені методи + події:

| Категорія  | Приклади                                                   | Примітки                          |
| ---------- | ---------------------------------------------------------- | --------------------------------- |
| Ядро       | `connect`, `health`, `status`                              | `connect` має бути першим         |
| Повідомлення | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | побічні ефекти потребують `idempotencyKey` |
| Чат        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat використовує їх           |
| Сеанси     | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сеансів           |
| Автоматизація | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування wake + cron             |
| Вузли      | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS + дії вузлів           |
| Події      | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | push-відправлення сервером        |

Авторитетний рекламований інвентар **discovery** міститься в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де розташовані схеми

- Джерело: `src/gateway/protocol/schema.ts`
- Runtime validators (AJV): `src/gateway/protocol/index.ts`
- Рекламований реєстр функцій/discovery: `src/gateway/server-methods-list.ts`
- Рукостискання сервера + диспетчеризація методів: `src/gateway/server.impl.ts`
- Node-клієнт: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json`
- Згенеровані Swift-моделі: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний pipeline

- `pnpm protocol:gen`
  - записує JSON Schema (draft-07) у `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерує Swift-моделі Gateway
- `pnpm protocol:check`
  - запускає обидва генератори й перевіряє, що результат закомічено

## Як схеми використовуються під час виконання

- **На боці сервера**: кожен вхідний фрейм валідується через AJV. Рукостискання приймає лише
  запит `connect`, параметри якого відповідають `ConnectParams`.
- **На боці клієнта**: JS-клієнт валідує фрейми подій і відповідей перед
  використанням.
- **Feature discovery**: Gateway надсилає консервативний список `features.methods`
  і `features.events` у `hello-ok` з `listGatewayMethods()` та
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
    "minProtocol": 4,
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

Додайте обидві схеми до `ProtocolSchemas` і експортуйте типи:

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

Зареєструйте його в `src/gateway/server-methods.ts` (він уже об’єднує `systemHandlers`),
потім додайте `"system.echo"` до вхідних даних `listGatewayMethods` у
`src/gateway/server-methods-list.ts`.

Якщо метод може викликатися клієнтами оператора або вузла, також класифікуйте його в
`src/gateway/method-scopes.ts`, щоб застосування scope і рекламування функцій у `hello-ok`
лишалися узгодженими.

4. **Повторне генерування**

```bash
pnpm protocol:check
```

5. **Тести + документація**

Додайте серверний тест у `src/gateway/server.*.test.ts` і згадайте метод у документації.

## Поведінка Swift codegen

Генератор Swift створює:

- enum `GatewayFrame` з cases `req`, `res`, `event` і `unknown`
- строго типізовані structs/enums для payload
- значення `ErrorCode` і `GATEWAY_PROTOCOL_VERSION`

Невідомі типи фреймів зберігаються як raw payloads для прямої сумісності.

## Версіонування + сумісність

- `PROTOCOL_VERSION` міститься в `src/gateway/protocol/version.ts`.
- Клієнти надсилають `minProtocol` + `maxProtocol`; сервер відхиляє невідповідності.
- Swift-моделі зберігають невідомі типи фреймів, щоб не ламати старіші клієнти.

## Шаблони схем і конвенції

- Більшість об’єктів використовують `additionalProperties: false` для строгих payloads.
- `NonEmptyString` є типовим значенням для ID і назв методів/подій.
- Верхньорівневий `GatewayFrame` використовує **discriminator** на `type`.
- Методи з побічними ефектами зазвичай потребують `idempotencyKey` у params
  (приклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає необов’язкові `internalEvents` для згенерованого під час виконання контексту оркестрації
  (наприклад, передавання завершення subagent/cron task); розглядайте це як внутрішню поверхню API.

## Live schema JSON

Згенерована JSON Schema міститься в репозиторії за шляхом `dist/protocol.schema.json`. Опублікований
raw-файл зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть схеми TypeBox.
2. Зареєструйте метод/подію в `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, коли новому RPC потрібна класифікація scope для оператора або
   вузла.
4. Запустіть `pnpm protocol:check`.
5. Закомітьте згенеровану схему + Swift-моделі.

## Пов’язане

- [Протокол rich output](/uk/reference/rich-output-protocol)
- [RPC-адаптери](/uk/reference/rpc)
