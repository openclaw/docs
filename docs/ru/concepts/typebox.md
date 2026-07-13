---
read_when:
    - Обновление схем протокола или кодогенерации
summary: Схемы TypeBox как единый источник истины для протокола Gateway
title: TypeBox
x-i18n:
    generated_at: "2026-07-13T18:06:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 24490edf0d73e918f834e9dd53d09ba0e5183b2bc126ee981a94f8099e76283b
    source_path: concepts/typebox.md
    workflow: 16
---

TypeBox — это библиотека схем, ориентированная на TypeScript. OpenClaw использует её для определения **протокола Gateway WebSocket** (рукопожатие, запросы и ответы, события сервера). Эти схемы служат основой для **проверки во время выполнения** (AJV), **экспорта JSON Schema** и **генерации кода Swift** для приложения macOS. Единый источник истины; всё остальное генерируется.

Общее описание протокола см. в разделе [Архитектура Gateway](/ru/concepts/architecture).

## Ментальная модель (30 секунд)

Каждое сообщение Gateway WS представляет собой один из трёх типов фреймов:

- **Запрос**: `{ type: "req", id, method, params }`
- **Ответ**: `{ type: "res", id, ok, payload | error }`
- **Событие**: `{ type: "event", event, payload, seq?, stateVersion? }`

Первым фреймом **обязательно** должен быть запрос `connect`. После этого клиенты вызывают методы (например, `health`, `send`, `chat.send`) и подписываются на события (например, `presence`, `tick`, `agent`).

Минимальная последовательность подключения:

```text
Клиент                   Gateway
  |---- запрос:connect ----->|
  |<---- ответ:hello-ok ------|
  |<---- событие:tick --------|
  |---- запрос:health ------->|
  |<---- ответ:health --------|
```

Распространённые методы и события:

| Категория     | Примеры                                                    | Примечания                                                    |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Ядро          | `connect`, `health`, `status`                              | `connect` должен быть первым                                  |
| Обмен сообщениями | `send`, `agent`, `agent.wait`, `system-event`, `logs.tail` | методы с побочными эффектами требуют `idempotencyKey` |
| Чат           | `chat.history`, `chat.send`, `chat.abort`                  | WebChat использует эти методы                                 |
| Сеансы        | `sessions.list`, `sessions.patch`, `sessions.delete`       | администрирование сеансов                                     |
| Автоматизация | `wake`, `cron.list`, `cron.run`, `cron.runs`               | управление пробуждением и Cron                                |
| Узлы          | `node.list`, `node.invoke`, `node.pair.*`                  | Gateway WS и действия узлов                                   |
| События       | `tick`, `presence`, `agent`, `chat`, `health`, `shutdown`  | отправка с сервера                                            |

Авторитетный публикуемый список возможностей **обнаружения** находится в `src/gateway/server-methods-list.ts` (`listGatewayMethods`, `GATEWAY_EVENTS`).

## Где находятся схемы

- Исходный модуль экспорта: `packages/gateway-protocol/src/schema.ts` повторно экспортирует предметные модули из `packages/gateway-protocol/src/schema/*.ts` (`frames.ts` для конвертов верхнего уровня и рукопожатия, `agent.ts`, `sessions.ts`, `cron.ts` и т. д. для каждой функциональной области). `protocol-schemas.ts` — центральный реестр `ProtocolSchemas`, сопоставляющий имена схем с их определениями TypeBox.
- Валидаторы времени выполнения (AJV): `packages/gateway-protocol/src/index.ts`
- Публикуемый реестр возможностей и обнаружения: `src/gateway/server-methods-list.ts`
- Рукопожатие сервера и диспетчеризация методов: `src/gateway/server.impl.ts`
- Клиент узла: `src/gateway/client.ts`
- Сгенерированная JSON Schema: `dist/protocol.schema.json` (результат сборки, не фиксируется в репозитории)
- Сгенерированные модели Swift: `apps/shared/OpenClawKit/Sources/OpenClawProtocol/GatewayModels.swift`

## Текущий конвейер

- `pnpm protocol:gen` записывает JSON Schema (draft-07) в `dist/protocol.schema.json`.
- `pnpm protocol:gen:swift` генерирует модели Gateway для Swift.
- `pnpm protocol:check` запускает оба генератора и проверяет, что результат Swift зафиксирован в репозитории (результат JSON Schema является игнорируемым Git артефактом сборки).

## Как схемы используются во время выполнения

- **На стороне сервера**: каждый входящий фрейм проверяется с помощью AJV. Рукопожатие принимает только запрос `connect`, параметры которого соответствуют `ConnectParams`.
- **На стороне клиента**: клиент JS проверяет фреймы событий и ответов перед их использованием.
- **Обнаружение возможностей**: Gateway отправляет консервативные списки `features.methods` и `features.events` в `hello-ok`, используя `listGatewayMethods()` и `GATEWAY_EVENTS`.
- Этот список обнаружения не является автоматически сгенерированным перечнем всех вызываемых вспомогательных функций из `coreGatewayHandlers`; некоторые вспомогательные RPC реализованы в `src/gateway/server-methods/*.ts`, но не перечислены в публикуемом списке возможностей.

## Примеры фреймов

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
    "auth": { "role": "operator", "scopes": ["operator.read"] },
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

Минимальный полезный сценарий: подключение + проверка состояния.

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

## Практический пример: сквозное добавление метода

Пример: добавим новый запрос `system.echo`, возвращающий `{ ok: true, text }`.

1. **Схема (источник истины)**

Добавьте в `packages/gateway-protocol/src/schema/system.ts` (или в наиболее подходящий функциональный модуль):

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

Импортируйте обе схемы в `packages/gateway-protocol/src/schema/protocol-schemas.ts`, добавьте их в реестр `ProtocolSchemas` и экспортируйте производные типы:

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **Проверка**

Экспортируйте валидатор AJV в `packages/gateway-protocol/src/index.ts`:

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

Зарегистрируйте его в `src/gateway/server-methods.ts` (где уже объединяется `systemHandlers`), затем добавьте `"system.echo"` во входные данные `listGatewayMethods` в `src/gateway/server-methods-list.ts`.

Если метод могут вызывать клиенты оператора или узла, также классифицируйте его в `src/gateway/method-scopes.ts`, чтобы проверка областей доступа и публикация возможностей `hello-ok` оставались согласованными.

4. **Повторная генерация**

```bash
pnpm protocol:check
```

5. **Тесты и документация**

Добавьте серверный тест в `src/gateway/server.*.test.ts` и укажите метод в документации.

## Поведение генерации кода Swift

Генератор Swift создаёт:

- перечисление `GatewayFrame` с вариантами `req`, `res`, `event` и `unknown`
- строго типизированные структуры и перечисления полезной нагрузки
- значения `ErrorCode`, `GATEWAY_PROTOCOL_VERSION` и `GATEWAY_MIN_PROTOCOL_VERSION`

Неизвестные типы фреймов сохраняются в виде необработанной полезной нагрузки для прямой совместимости.

## Управление версиями и совместимость

- `PROTOCOL_VERSION` находится в `packages/gateway-protocol/src/version.ts` (текущее значение: `4`).
- Клиенты отправляют `minProtocol` и `maxProtocol`; сервер отклоняет диапазоны, не включающие текущую версию его протокола.
- Модели Swift сохраняют неизвестные типы фреймов, чтобы не нарушать работу старых клиентов.

## Шаблоны и соглашения схем

- Большинство объектов используют `additionalProperties: false` для строгих полезных нагрузок.
- `NonEmptyString` (`Type.String({ minLength: 1 })`) по умолчанию используется для идентификаторов и имён методов и событий.
- Верхнеуровневый `GatewayFrame` использует **дискриминатор** по `type`.
- Методы с побочными эффектами обычно требуют `idempotencyKey` в параметрах (например, `send`, `poll`, `agent`, `chat.send`).
- `agent` принимает необязательный `internalEvents` для создаваемого во время выполнения контекста оркестрации (например, передачи результата после завершения задачи субагента или Cron); считайте это внутренней поверхностью API.

## Актуальная JSON-схема

Сгенерированная JSON Schema является артефактом сборки и не фиксируется в репозитории. Опубликованный исходный файл обычно доступен по адресу:

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

## При изменении схем

1. Обновите схемы TypeBox в ответственном модуле `packages/gateway-protocol/src/schema/*.ts` и зарегистрируйте их в `protocol-schemas.ts`.
2. Зарегистрируйте метод или событие в `src/gateway/server-methods-list.ts`.
3. Обновите `src/gateway/method-scopes.ts`, если новому RPC требуется классификация области доступа оператора или узла.
4. Запустите `pnpm protocol:check`.
5. Зафиксируйте повторно сгенерированные модели Swift.

## Связанные разделы

- [Протокол форматированного вывода](/ru/reference/rich-output-protocol)
- [Адаптеры RPC](/ru/reference/rpc)
