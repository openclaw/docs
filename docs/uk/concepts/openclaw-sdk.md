---
read_when:
    - Ви створюєте зовнішній застосунок, скрипт, інформаційну панель, завдання CI або розширення IDE, що взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся із запусками агентів Gateway, сеансами, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний SDK застосунку OpenClaw для зовнішніх застосунків, скриптів, панелей моніторингу, завдань CI та розширень IDE
title: SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-04-30T01:03:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** — це публічний клієнтський API для застосунків поза процесом
OpenClaw. Використовуйте `@openclaw/sdk`, коли скрипт, панель керування, завдання CI, розширення IDE
або інший зовнішній застосунок має підключатися до Gateway, запускати виконання агентів,
транслювати події, чекати на результати, скасовувати роботу або перевіряти ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` взаємодіє з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які працюють усередині OpenClaw і
  реєструють провайдерів, канали, інструменти, хуки або довірені runtime-середовища.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Інтерфейс                | Стан     | Що він робить                                                               |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Готово   | Основна точка входу клієнта. Керує транспортом, підключенням, запитами та подіями. |
| `GatewayClientTransport`  | Готово   | WebSocket-транспорт на основі клієнта Gateway.                              |
| `oc.agents`               | Готово   | Перелічує, створює, оновлює, видаляє та отримує дескриптори агентів.        |
| `Agent.run()`             | Готово   | Запускає виконання Gateway `agent` і повертає `Run`.                         |
| `oc.runs`                 | Готово   | Створює, отримує, очікує, скасовує та транслює виконання.                    |
| `Run.events()`            | Готово   | Транслює нормалізовані події для окремого виконання з повторним відтворенням для швидких виконань. |
| `Run.wait()`              | Готово   | Викликає `agent.wait` і повертає стабільний `RunResult`.                     |
| `Run.cancel()`            | Готово   | Викликає `sessions.abort` за id виконання, із ключем сесії, коли він доступний. |
| `oc.sessions`             | Готово   | Створює, вирішує, надсилає до, виправляє, ущільнює та отримує дескриптори сесій. |
| `Session.send()`          | Готово   | Викликає `sessions.send` і повертає `Run`.                                   |
| `oc.models`               | Готово   | Викликає `models.list` і поточний статусний RPC `models.authStatus`.         |
| `oc.tools`                | Частково | Перелічує каталог інструментів і ефективні інструменти; прямий виклик інструментів не підключено. |
| `oc.approvals`            | Готово   | Перелічує та вирішує схвалення виконання через RPC схвалень Gateway.         |
| `oc.rawEvents()`          | Готово   | Надає необроблені події Gateway для просунутих споживачів.                   |
| `normalizeGatewayEvent()` | Готово   | Перетворює необроблені події Gateway у стабільну форму подій SDK.            |

SDK також експортує основні типи, які використовують ці інтерфейси:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` і пов’язані типи результатів.

## Підключення до Gateway

Створіть клієнт із явною URL-адресою Gateway або інжектуйте власний транспорт для
тестів і runtime-середовищ вбудованих застосунків.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` еквівалентний `url`. Параметр
`gateway: "auto"` приймається конструктором, але автоматичне виявлення Gateway
ще не є окремою функцією SDK; передавайте `url`, коли застосунок ще не знає,
як виявити Gateway.

Для тестів передайте об’єкт, який реалізує `OpenClawTransport`:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Запуск агента

Використовуйте `oc.agents.get(id)`, коли застосунку потрібен дескриптор агента, а потім викликайте
`agent.run()`.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

Посилання на моделі з указанням провайдера, як-от `openai/gpt-5.5`, розділяються на перевизначення Gateway
`provider` і `model`. `timeoutMs` залишається в мілісекундах у SDK і
перетворюється на секунди тайм-ауту Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Якщо дедлайн очікування спливає,
поки виконання все ще активне, повертається `status: "accepted"` замість удавання,
що саме виконання вичерпало час. Тайм-аути runtime-середовища, перервані виконання та скасовані виконання
нормалізуються в `timed_out` або `cancelled`.

## Створення та повторне використання сесій

Використовуйте сесії, коли застосунку потрібен сталий стан транскрипту.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` викликає `sessions.send` і повертає `Run`. Дескриптори сесій також
підтримують:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Трансляція подій

SDK нормалізує необроблені події Gateway у стабільну оболонку `OpenClawEvent`:

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

Поширені типи подій:

| Тип події             | Вихідна подія Gateway                       |
| --------------------- | ------------------------------------------- |
| `run.started`         | Початок життєвого циклу `agent`             |
| `run.completed`       | Завершення життєвого циклу `agent`          |
| `run.failed`          | Помилка життєвого циклу `agent`             |
| `run.cancelled`       | Завершення життєвого циклу після переривання/скасування |
| `run.timed_out`       | Завершення життєвого циклу через тайм-аут   |
| `assistant.delta`     | Потокова дельта асистента                   |
| `assistant.message`   | Повідомлення асистента                      |
| `thinking.delta`      | Потік міркування або плану                  |
| `tool.call.started`   | Початок інструмента/елемента/команди        |
| `tool.call.delta`     | Оновлення інструмента/елемента/команди      |
| `tool.call.completed` | Завершення інструмента/елемента/команди     |
| `tool.call.failed`    | Збій інструмента/елемента/команди або заблокований статус |
| `approval.requested`  | Запит на схвалення виконання або Plugin     |
| `approval.resolved`   | Рішення щодо схвалення виконання або Plugin |
| `session.created`     | Створення `sessions.changed`                |
| `session.updated`     | Оновлення `sessions.changed`                |
| `session.compacted`   | Ущільнення `sessions.changed`               |
| `task.updated`        | Події оновлення завдань                     |
| `artifact.updated`    | Події потоку патчів                         |
| `raw`                 | Будь-яка подія, що ще не має стабільного зіставлення SDK |

`Run.events()` фільтрує події до одного id виконання та повторно відтворює вже побачені події для
швидких виконань. Це означає, що задокументований потік безпечний:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Для потоків на рівні всього застосунку використовуйте `oc.events()`. Для необроблених кадрів Gateway використовуйте
`oc.rawEvents()`.

## Моделі, інструменти та схвалення

Допоміжні методи моделей зіставляються з поточними методами Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Допоміжні методи інструментів надають каталог Gateway і представлення ефективних інструментів:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Допоміжні методи схвалень використовують RPC схвалень виконання:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Явно не підтримується сьогодні

SDK містить назви для моделі продукту, яку ми хочемо, але не вдає непомітно,
що RPC Gateway існують. Наразі ці виклики викидають явні помилки непідтримуваності:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Поля `workspace`, `runtime`, `environment` і `approvals` для окремого виконання типізовані
як майбутня форма, але поточний Gateway не підтримує ці перевизначення в
RPC `agent`. Якщо викликачі передають їх, SDK викидає помилку до надсилання виконання,
щоб робота випадково не виконалася зі стандартною поведінкою workspace, runtime-середовища,
environment або схвалень.

## App SDK і Plugin SDK

Використовуйте App SDK, коли код працює поза OpenClaw:

- Node-скрипти, які запускають або спостерігають за виконаннями агентів
- завдання CI, які викликають Gateway
- панелі керування та адміністративні панелі
- розширення IDE
- зовнішні мости, яким не потрібно ставати канальними plugins
- інтеграційні тести з фіктивними або реальними транспортами Gateway

Використовуйте Plugin SDK, коли код працює всередині OpenClaw:

- plugins провайдерів
- канальні plugins
- інструментальні або життєво-циклові хуки
- plugins обв’язки агентів
- довірені допоміжні засоби runtime-середовища

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати з
задокументованих підшляхів `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язані документи

- [Дизайн API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Runtime-середовища агентів](/uk/concepts/agent-runtimes)
- [Сесії](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
