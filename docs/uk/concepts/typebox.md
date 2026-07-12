---
read_when:
    - Оновлення схем протоколу або кодогенерації
summary: Схеми TypeBox як єдине джерело істини для протоколу Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-12T13:11:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — це бібліотека схем, орієнтована насамперед на TypeScript. OpenClaw використовує її для визначення **протоколу WebSocket Gateway** (рукостискання, запити/відповіді, події сервера). Ці схеми забезпечують **перевірку під час виконання** (AJV), **експорт JSON Schema** та **генерування коду Swift** для застосунку macOS. Єдине джерело істини; усе інше генерується.

Щоб ознайомитися з високорівневим контекстом протоколу, почніть з [архітектури Gateway](/uk/concepts/architecture).

## Ментальна модель (30 секунд)

Кожне повідомлення WS Gateway є одним із трьох типів фреймів:

- **Запит**: `{ type: "req", id, method, params }`
- **Відповідь**: `{ type: "res", id, ok, payload | error }`
- **Подія**: `{ type: "event", event, payload, seq?, stateVersion? }`

Перший фрейм **обов’язково** має бути запитом `connect`. Після цього клієнти викликають методи (наприклад, `health`, `send`, `chat.send`) і підписуються на події (наприклад, `presence`, `tick`, `agent`).

Мінімальний потік підключення:

```text
Клієнт                   Gateway
  |---- запит:connect ------>|
  |<---- відповідь:hello-ok --|
  |<---- подія:tick ----------|
  |---- запит:health -------->|
  |<---- відповідь:health ----|
```

Поширені методи та події:

| Категорія   | Приклади                                                   | Примітки                                          |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------- |
| Ядро        | `connect`, `health`, `status`                              | `connect` має бути першим                         |
| Повідомлення | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | методам із побічними ефектами потрібен `idempotencyKey` |
| Чат         | `chat.history`, `chat.send`, `chat.abort`                  | WebChat використовує ці методи                    |
| Сеанси      | `sessions.list`, `sessions.patch`, `sessions.delete`       | адміністрування сеансів                           |
| Автоматизація | `wake`, `cron.list`, `cron.run`, `cron.runs`               | керування пробудженням і Cron                     |
| Вузли       | `node.list`, `node.invoke`, `node.pair.*`                  | WS Gateway і дії вузлів                           |
| Події       | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | надсилання із сервера                             |

Авторитетний рекламований перелік **виявлення можливостей** міститься в `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Де розташовані схеми

- Вихідний barrel-файл: `packages/gateway-protocol/src/schema.ts` повторно експортує доменні модулі з `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` для конвертів верхнього рівня та рукостискання, `agent.ts`, `sessions.ts`, `cron.ts` тощо — відповідно до функціональної області). `protocol-schemas.ts` — центральний реєстр `ProtocolSchemas`, який зіставляє назви схем з їхніми визначеннями TypeBox.
- Валідатори часу виконання (AJV): `packages/gateway-protocol/src/index.ts`
- Рекламований реєстр функцій/виявлення можливостей: `src/gateway/server-methods-list.ts`
- Серверне рукостискання та диспетчеризація методів: `src/gateway/server.impl.ts`
- Клієнт вузла: `src/gateway/client.ts`
- Згенерована JSON Schema: `dist/protocol.schema.json` (результат збирання, не додається до репозиторію)
- Згенеровані моделі Swift: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Поточний конвеєр

- `pnpm protocol:gen` записує JSON Schema (draft-07) у `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` генерує моделі Gateway для Swift.
- `pnpm protocol:check` запускає обидва генератори й перевіряє, що результат для Swift додано до репозиторію (результат JSON Schema є ігнорованим Git артефактом збирання).

## Як схеми використовуються під час виконання

- **На стороні сервера**: кожен вхідний фрейм перевіряється за допомогою AJV. Рукостискання приймає лише запит `connect`, параметри якого відповідають `ConnectParams`.
- **На стороні клієнта**: клієнт JS перевіряє фрейми подій і відповідей перед їх використанням.
- **Виявлення можливостей**: Gateway надсилає консервативні списки `features.methods` і `features.events` у `hello-ok`, отримані з `listGatewayMethods()` і `GATEWAY_EVENTS`.
- Цей список виявлення можливостей не є згенерованим переліком усіх доступних для виклику допоміжних функцій у `coreGatewayHandlers`; деякі допоміжні RPC реалізовано в `src/gateway/server-methods/*.ts`, але їх не перелічено в рекламованому списку функцій.

## Приклади фреймів

Підключення (перше повідомлення):

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

Запит і відповідь:

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

Найменший корисний потік: підключення + перевірка стану.

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

## Практичний приклад: наскрізне додавання методу

Приклад: додайте новий запит `system.echo`, який повертає `{ ok: true, text }`.

1. **Схема (джерело істини)**

Додайте до `packages/gateway-protocol/src/schema/system.ts` (або найближчого відповідного функціонального модуля):

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

Імпортуйте обидві схеми до `packages/gateway-protocol/src/schema/protocol-schemas.ts`, додайте їх до реєстру `ProtocolSchemas` і експортуйте похідні типи:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Перевірка**

У `packages/gateway-protocol/src/index.ts` експортуйте валідатор AJV:

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

Зареєструйте його в `src/gateway/server-methods.ts` (цей файл уже об’єднує `systemHandlers`), а потім додайте `"system.echo"` до вхідного списку `listGatewayMethods` у `src/gateway/server-methods-list.ts`.

Якщо метод можуть викликати клієнти оператора або вузла, також класифікуйте його в `src/gateway/method-scopes.ts`, щоб застосування областей доступу й рекламування функцій у `hello-ok` залишалися узгодженими.

4. **Повторне генерування**

```bash
pnpm protocol:check
```

5. **Тести та документація**

Додайте серверний тест у `src/gateway/server.*.test.ts` і зазначте метод у документації.

## Поведінка генерування коду Swift

Генератор Swift створює:

- перелік `GatewayFrame` з варіантами `req`, `res`, `event` і `unknown`
- строго типізовані структури/переліки корисного навантаження
- значення `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` і `GATEWAY_MIN_PROTOCOL_VERSION`

Невідомі типи фреймів зберігаються як необроблені корисні навантаження для прямої сумісності.

## Версіонування та сумісність

- `PROTOCOL_VERSION` міститься в `packages/gateway-protocol/src/version.ts` (поточне значення: `4`).
- Клієнти надсилають `minProtocol` і `maxProtocol`; сервер відхиляє діапазони, які не містять його поточної версії протоколу.
- Моделі Swift зберігають невідомі типи фреймів, щоб не порушувати роботу старіших клієнтів.

## Шаблони та угоди схем

- Більшість об’єктів використовують `additionalProperties: false` для строгих корисних навантажень.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) використовується типово для ідентифікаторів і назв методів/подій.
- `GatewayFrame` верхнього рівня використовує **дискримінатор** за полем `type`.
- Методи з побічними ефектами зазвичай вимагають `idempotencyKey` у параметрах (наприклад: `send`, `poll`, `agent`, `chat.send`).
- `agent` приймає необов’язковий параметр `internalEvents` для згенерованого під час виконання контексту оркестрації (наприклад, передавання результату завершення завдання субагента/Cron); вважайте це внутрішньою поверхнею API.

## Актуальна JSON-схема

Згенерована JSON Schema є артефактом збирання й не додається до репозиторію. Опублікований необроблений файл зазвичай доступний за адресою:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Коли ви змінюєте схеми

1. Оновіть схеми TypeBox у відповідному модулі `packages/gateway-protocol/src/schema/*.ts` і зареєструйте їх у `protocol-schemas.ts`.
2. Зареєструйте метод/подію в `src/gateway/server-methods-list.ts`.
3. Оновіть `src/gateway/method-scopes.ts`, якщо новому RPC потрібна класифікація області доступу оператора або вузла.
4. Виконайте `pnpm protocol:check`.
5. Додайте повторно згенеровані моделі Swift до коміту.

## Пов’язане

- [Протокол розширеного виведення](/uk/reference/rich-output-protocol)
- [Адаптери RPC](/uk/reference/rpc)
