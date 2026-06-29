---
read_when:
    - Обновление схем протокола или codegen
summary: Схемы TypeBox как единый источник истины для протокола Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-06-28T22:53:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2f3da11e9dcf3250fd77e0c43f4ed918551a536d93fa71bce95eaf3d7539f6d
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — ориентированная на TypeScript библиотека схем. Мы используем ее для определения **протокола WebSocket Gateway** (рукопожатие, запрос/ответ, серверные события). Эти схемы обеспечивают **валидацию во время выполнения**, **экспорт JSON Schema** и **генерацию кода Swift** для приложения macOS. Один источник истины; все остальное генерируется.

Если вам нужен более высокоуровневый контекст протокола, начните с
[архитектуры Gateway](/ru/concepts/architecture).

## Ментальная модель (30 секунд)

Каждое сообщение Gateway WS является одним из трех кадров:

- **Запрос**: `{ type: "req", id, method, params }`
- **Ответ**: `{ type: "res", id, ok, payload | error }`
- **Событие**: `{ type: "event", event, payload, seq?, stateVersion? }`

Первый кадр **обязательно** должен быть запросом `connect`. После этого клиенты могут вызывать
методы (например, `health`, `send`, `chat.send`) и подписываться на события (например,
`presence`, `tick`, `agent`).

Поток подключения (минимальный):

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

Распространенные методы и события:

| Категория  | Примеры                                                    | Примечания                         |
| ---------- | ---------------------------------------------------------- | ---------------------------------- |
| Ядро       | `connect`, `health`, `status`                              | `connect` должен быть первым       |
| Сообщения  | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | побочные эффекты требуют `idempotencyKey` |
| Чат        | `chat.history`, `chat.send`, `chat.abort`                  | WebChat использует их              |
| Сессии     | `sessions.list`, `sessions.patch`, `sessions.delete`       | администрирование сессий           |
| Автоматизация | `wake`, `cron.list`, `cron.run`, `cron.runs`            | управление wake и cron             |
| Узлы       | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS и действия узлов        |
| События    | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | отправка с сервера                 |

Авторитетный объявляемый инвентарь **обнаружения** находится в
`src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Где находятся схемы

- Исходный файл: `packages/gateway-protocol/src/schema.ts`
- Валидаторы времени выполнения (AJV): `packages/gateway-protocol/src/index.ts`
- Объявляемый реестр функций/обнаружения: `src/gateway/server-methods-list.ts`
- Рукопожатие сервера и диспетчеризация методов: `src/gateway/server.impl.ts`
- Клиент Node: `src/gateway/client.ts`
- Сгенерированная JSON Schema: `dist/protocol.schema.json`
- Сгенерированные модели Swift: `apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

## Текущий конвейер

- `pnpm protocol:gen`
  - записывает JSON Schema (draft-07) в `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - генерирует модели Gateway для Swift
- `pnpm protocol:check`
  - запускает оба генератора и проверяет, что результат закоммичен

## Как схемы используются во время выполнения

- **На стороне сервера**: каждый входящий кадр валидируется с помощью AJV. Рукопожатие принимает только
  запрос `connect`, параметры которого соответствуют `ConnectParams`.
- **На стороне клиента**: JS-клиент валидирует кадры событий и ответов перед
  их использованием.
- **Обнаружение функций**: Gateway отправляет консервативные списки `features.methods`
  и `features.events` в `hello-ok` из `listGatewayMethods()` и
  `GATEWAY_EVENTS`.
- Этот список обнаружения не является сгенерированным дампом всех вызываемых вспомогательных функций в
  `coreGatewayHandlers`; некоторые вспомогательные RPC реализованы в
  `src/gateway/server-methods/*.ts` без перечисления в объявляемом
  списке функций.

## Примеры кадров

Подключение (первое сообщение):

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

Ответ hello-ok:

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

Запрос и ответ:

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

Событие:

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

## Минимальный клиент (Node.js)

Минимальный полезный поток: подключение и health.

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

## Рабочий пример: добавить метод от начала до конца

Пример: добавьте новый запрос `system.echo`, который возвращает `{ ok: true, text }`.

1. **Схема (источник истины)**

Добавьте в `packages/gateway-protocol/src/schema.ts`:

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

Добавьте оба в `ProtocolSchemas` и экспортируйте типы:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Валидация**

В `packages/gateway-protocol/src/index.ts` экспортируйте валидатор AJV:

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **Поведение сервера**

Добавьте обработчик в `src/gateway/server-methods/system.ts`:

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

Зарегистрируйте его в `src/gateway/server-methods.ts` (уже объединяет `systemHandlers`),
затем добавьте `"system.echo"` во входные данные `listGatewayMethods` в
`src/gateway/server-methods-list.ts`.

Если метод может вызываться оператором или клиентами узлов, также классифицируйте его в
`src/gateway/method-scopes.ts`, чтобы применение областей и объявление функций
`hello-ok` оставались согласованными.

4. **Повторная генерация**

```bash
pnpm protocol:check
```

5. **Тесты и документация**

Добавьте серверный тест в `src/gateway/server.*.test.ts` и упомяните метод в документации.

## Поведение генерации кода Swift

Генератор Swift создает:

- enum `GatewayFrame` с вариантами `req`, `res`, `event` и `unknown`
- строго типизированные структуры/enum полезной нагрузки
- значения `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` и `GATEWAY_MIN_PROTOCOL_VERSION`

Неизвестные типы кадров сохраняются как необработанные полезные нагрузки для прямой совместимости.

## Версионирование и совместимость

- `PROTOCOL_VERSION` находится в `packages/gateway-protocol/src/version.ts`.
- Клиенты отправляют `minProtocol` и `maxProtocol`; сервер отклоняет диапазоны, которые
  не включают его текущий протокол.
- Модели Swift сохраняют неизвестные типы кадров, чтобы не ломать старые клиенты.

## Шаблоны и соглашения схем

- Большинство объектов используют `additionalProperties: false` для строгих полезных нагрузок.
- `NonEmptyString` используется по умолчанию для ID и имен методов/событий.
- Верхнеуровневый `GatewayFrame` использует **дискриминатор** по `type`.
- Методы с побочными эффектами обычно требуют `idempotencyKey` в параметрах
  (пример: `send`, `poll`, `agent`, `chat.send`).
- `agent` принимает необязательные `internalEvents` для сгенерированного во время выполнения контекста оркестрации
  (например, передача завершения задачи субагента/cron); рассматривайте это как внутреннюю поверхность API.

## Актуальная JSON-схема

Сгенерированная JSON Schema находится в репозитории по пути `dist/protocol.schema.json`. Опубликованный
raw-файл обычно доступен по адресу:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## Когда вы меняете схемы

1. Обновите схемы TypeBox.
2. Зарегистрируйте метод/событие в `src/gateway/server-methods-list.ts`.
3. Обновите `src/gateway/method-scopes.ts`, когда новому RPC нужна классификация области оператора или
   узла.
4. Запустите `pnpm protocol:check`.
5. Закоммитьте сгенерированную схему и модели Swift.

## Связанные материалы

- [Протокол расширенного вывода](/ru/reference/rich-output-protocol)
- [Адаптеры RPC](/ru/reference/rpc)
