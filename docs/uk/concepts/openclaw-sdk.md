---
read_when:
    - Ви створюєте зовнішній застосунок, скрипт, інформаційну панель, завдання CI або розширення IDE, що взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся із запусками агентів Gateway, сеансами, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний OpenClaw App SDK для зовнішніх застосунків, скриптів, інформаційних панелей, завдань CI та розширень IDE
title: SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-11T20:33:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc339e9f29dd1297353d85827dbac207311a9633e1ab6cc47dace80a72259356
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** — це публічний клієнтський API для застосунків поза процесом
OpenClaw. Використовуйте `@openclaw/sdk`, коли сценарій, панель керування, завдання CI, розширення IDE
або інший зовнішній застосунок хоче під’єднатися до Gateway, запускати виконання агентів,
транслювати події, чекати на результати, скасовувати роботу або переглядати ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` взаємодіє з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які працюють усередині OpenClaw і
  реєструють провайдерів, канали, інструменти, hooks або довірені середовища виконання.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Інтерфейс                | Стан      | Що він робить                                                                    |
| ------------------------ | --------- | -------------------------------------------------------------------------------- |
| `OpenClaw`               | Готово    | Основна точка входу клієнта. Керує транспортом, з’єднанням, запитами та подіями. |
| `GatewayClientTransport` | Готово    | WebSocket-транспорт на базі клієнта Gateway.                                     |
| `oc.agents`              | Готово    | Перелічує, створює, оновлює, видаляє та отримує handles агентів.                 |
| `Agent.run()`            | Готово    | Запускає виконання Gateway `agent` і повертає `Run`.                             |
| `oc.runs`                | Готово    | Створює, отримує, очікує, скасовує та транслює виконання.                        |
| `Run.events()`           | Готово    | Транслює нормалізовані події для окремого виконання з повтором для швидких виконань. |
| `Run.wait()`             | Готово    | Викликає `agent.wait` і повертає стабільний `RunResult`.                         |
| `Run.cancel()`           | Готово    | Викликає `sessions.abort` за id виконання, з ключем сесії, коли він доступний.   |
| `oc.sessions`            | Готово    | Створює, розв’язує, надсилає до, патчить, стискає та отримує handles сесій.      |
| `Session.send()`         | Готово    | Викликає `sessions.send` і повертає `Run`.                                       |
| `oc.tasks`               | Готово    | Перелічує, читає та скасовує записи журналу завдань Gateway.                     |
| `oc.models`              | Готово    | Викликає `models.list` і поточний статусний RPC `models.authStatus`.             |
| `oc.tools`               | Готово    | Перелічує, задає scopes і викликає інструменти Gateway через конвеєр політик.    |
| `oc.artifacts`           | Готово    | Перелічує, отримує та завантажує артефакти транскриптів Gateway.                 |
| `oc.approvals`           | Готово    | Перелічує та розв’язує схвалення exec через RPC схвалень Gateway.                |
| `oc.environments`        | Частково  | Перелічує локальні для Gateway та вузлові кандидати середовищ; create/delete ще не під’єднані. |
| `oc.rawEvents()`         | Готово    | Надає сирі події Gateway для просунутих споживачів.                              |
| `normalizeGatewayEvent()` | Готово   | Перетворює сирі події Gateway на стабільну форму подій SDK.                      |

SDK також експортує основні типи, які використовують ці інтерфейси:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`,
`TaskSummary`, `TaskStatus`, `TasksListParams`, `TasksListResult`,
`TasksGetResult`, `TasksCancelResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` і пов’язані
типи результатів.

## Під’єднання до Gateway

Створіть клієнт із явною URL-адресою Gateway або інжектуйте власний транспорт для
тестів і вбудованих середовищ виконання застосунків.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` еквівалентний `url`. Опцію
`gateway: "auto"` конструктор приймає, але автоматичне виявлення Gateway
ще не є окремою можливістю SDK; передавайте `url`, коли застосунок ще не
знає, як виявити Gateway.

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

Використовуйте `oc.agents.get(id)`, коли застосунку потрібен handle агента, а потім викличте
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

Посилання на моделі з указанням провайдера, як-от `openai/gpt-5.5`, розділяються на Gateway
override-и `provider` і `model`. `timeoutMs` у SDK залишається в мілісекундах і
перетворюється на секунди тайм-ауту Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Дедлайн очікування, який спливає,
поки виконання ще активне, повертає `status: "accepted"`, а не вдає,
що саме виконання вичерпало час. Тайм-аути середовища виконання, перервані виконання та скасовані виконання
нормалізуються до `timed_out` або `cancelled`.

## Створення та повторне використання сесій

Використовуйте сесії, коли застосунку потрібен довговічний стан транскрипту.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` викликає `sessions.send` і повертає `Run`. Handles сесій також
підтримують:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Трансляція подій

SDK нормалізує сирі події Gateway у стабільну оболонку `OpenClawEvent`:

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

Поширені типи подій включають:

| Тип події             | Вихідна подія Gateway                         |
| --------------------- | --------------------------------------------- |
| `run.started`         | Початок життєвого циклу `agent`               |
| `run.completed`       | Завершення життєвого циклу `agent`            |
| `run.failed`          | Помилка життєвого циклу `agent`               |
| `run.cancelled`       | Завершення життєвого циклу після переривання/скасування |
| `run.timed_out`       | Завершення життєвого циклу через тайм-аут     |
| `assistant.delta`     | Streaming delta асистента                     |
| `assistant.message`   | Повідомлення асистента                        |
| `thinking.delta`      | Thinking або потік плану                      |
| `tool.call.started`   | Початок інструмента/елемента/команди          |
| `tool.call.delta`     | Оновлення інструмента/елемента/команди        |
| `tool.call.completed` | Завершення інструмента/елемента/команди       |
| `tool.call.failed`    | Збій інструмента/елемента/команди або заблокований статус |
| `approval.requested`  | Запит схвалення exec або plugin               |
| `approval.resolved`   | Розв’язання схвалення exec або plugin         |
| `session.created`     | Створення `sessions.changed`                  |
| `session.updated`     | Оновлення `sessions.changed`                  |
| `session.compacted`   | Compaction `sessions.changed`                 |
| `task.updated`        | Події оновлення завдання                      |
| `artifact.updated`    | Події потоку patch                            |
| `raw`                 | Будь-яка подія, що ще не має стабільного відображення SDK |

`Run.events()` фільтрує події до одного id виконання та повторює вже побачені події для
швидких виконань. Це означає, що документований потік безпечний:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Для потоків у межах усього застосунку використовуйте `oc.events()`. Для сирих кадрів Gateway використовуйте
`oc.rawEvents()`.

## Моделі, інструменти, артефакти та схвалення

Помічники моделей відображаються на поточні методи Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Помічники інструментів відкривають каталог Gateway, ефективний вигляд інструментів і прямий
виклик інструмента Gateway. `oc.tools.invoke()` повертає типізовану оболонку замість
викидання винятку для відмов політики або схвалення.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Помічники артефактів відкривають проєкцію артефактів Gateway для контексту сесії, виконання або
завдання. Кожен виклик потребує одного явного scope `sessionKey`, `runId` або
`taskId`:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Помічники схвалень використовують RPC схвалень exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Помічники завдань використовують довговічний журнал завдань, який також лежить в основі `openclaw tasks`:

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

Помічники середовищ надають доступ до read-only виявлення локальних для Gateway та вузлових середовищ:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Явно не підтримується сьогодні

SDK містить назви для моделі продукту, якої ми прагнемо, але не мовчки
вдає, що RPC Gateway існують. Ці виклики зараз викидають явні помилки
про непідтримуваність:

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Поля для окремого виконання `workspace`, `runtime`, `environment` і `approvals` типізовані
як майбутня форма, але поточний Gateway не підтримує ці override-и в
RPC `agent`. Якщо викликачі передають їх, SDK викидає помилку до надсилання виконання,
щоб робота випадково не виконалася з типовою поведінкою workspace, runtime,
environment або approval.

## App SDK проти Plugin SDK

Використовуйте App SDK, коли код живе поза OpenClaw:

- сценарії Node, які запускають або спостерігають виконання агентів
- завдання CI, які викликають Gateway
- панелі керування та адміністративні панелі
- розширення IDE
- зовнішні мости, яким не потрібно ставати channel plugins
- інтеграційні тести з фейковими або справжніми транспортами Gateway

Використовуйте Plugin SDK, коли код працює всередині OpenClaw:

- provider plugins
- channel plugins
- hooks інструментів або життєвого циклу
- plugins агентного harness
- довірені runtime-помічники

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати з
документованих підшляхів `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язане

- [Проєктування API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Сеанси](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
