---
read_when:
    - Ви створюєте зовнішній застосунок, скрипт, панель керування, завдання CI або розширення IDE, яке взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся із запусками агентів Gateway, сеансами, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний OpenClaw App SDK для зовнішніх застосунків, скриптів, панелей моніторингу, завдань CI та розширень IDE
title: SDK для застосунків OpenClaw
x-i18n:
    generated_at: "2026-05-06T04:53:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** — це публічний клієнтський API для застосунків поза процесом
OpenClaw. Використовуйте `@openclaw/sdk`, коли скрипт, панель керування, завдання CI, розширення IDE
або інший зовнішній застосунок хоче підключитися до Gateway, запускати виконання агентів,
транслювати події, чекати результатів, скасовувати роботу або переглядати ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` взаємодіє з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які працюють усередині OpenClaw і
  реєструють провайдерів, канали, інструменти, hooks або довірені середовища виконання.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Поверхня                  | Стан    | Що вона робить                                                                  |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | Готово  | Основна точка входу клієнта. Керує транспортом, підключенням, запитами та подіями. |
| `GatewayClientTransport`  | Готово  | WebSocket-транспорт на базі клієнта Gateway.                                     |
| `oc.agents`               | Готово  | Перелічує, створює, оновлює, видаляє й отримує handles агентів.                  |
| `Agent.run()`             | Готово  | Запускає виконання Gateway `agent` і повертає `Run`.                             |
| `oc.runs`                 | Готово  | Створює, отримує, очікує, скасовує й транслює виконання.                         |
| `Run.events()`            | Готово  | Транслює нормалізовані події окремого виконання з повтором для швидких виконань.  |
| `Run.wait()`              | Готово  | Викликає `agent.wait` і повертає стабільний `RunResult`.                         |
| `Run.cancel()`            | Готово  | Викликає `sessions.abort` за id виконання, із ключем сесії, коли він доступний.   |
| `oc.sessions`             | Готово  | Створює, розв’язує, надсилає до, виправляє, ущільнює й отримує handles сесій.    |
| `Session.send()`          | Готово  | Викликає `sessions.send` і повертає `Run`.                                       |
| `oc.models`               | Готово  | Викликає `models.list` і поточний статусний RPC `models.authStatus`.             |
| `oc.tools`                | Готово  | Перелічує, визначає області й викликає інструменти Gateway через policy pipeline. |
| `oc.artifacts`            | Готово  | Перелічує, отримує й завантажує артефакти транскриптів Gateway.                  |
| `oc.approvals`            | Готово  | Перелічує й розв’язує exec-схвалення через RPC схвалень Gateway.                 |
| `oc.environments`         | Частково | Перелічує локальні для Gateway і Node-кандидати середовищ; create/delete не підключені. |
| `oc.rawEvents()`          | Готово  | Надає сирі події Gateway для просунутих споживачів.                              |
| `normalizeGatewayEvent()` | Готово  | Перетворює сирі події Gateway на стабільну форму події SDK.                      |

SDK також експортує основні типи, які використовують ці поверхні:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` і пов’язані
типи результатів.

## Підключення до Gateway

Створіть клієнт із явною URL-адресою Gateway або впровадьте власний транспорт для
тестів і вбудованих середовищ виконання застосунку.

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

Використовуйте `oc.agents.get(id)`, коли застосунку потрібен handle агента, а потім викликайте
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
`provider` і `model`. `timeoutMs` залишається мілісекундами в SDK і
перетворюється на секунди тайм-ауту Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Дедлайн очікування, який спливає,
поки виконання ще активне, повертає `status: "accepted"` замість удаваного
тайм-ауту самого виконання. Тайм-аути середовища виконання, перервані виконання та скасовані виконання
нормалізуються в `timed_out` або `cancelled`.

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

SDK нормалізує сирі події Gateway у стабільний конверт `OpenClawEvent`:

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
| `run.cancelled`       | Завершення перерваного/скасованого життєвого циклу |
| `run.timed_out`       | Завершення життєвого циклу через тайм-аут   |
| `assistant.delta`     | Потокова дельта асистента                   |
| `assistant.message`   | Повідомлення асистента                      |
| `thinking.delta`      | Потік міркувань або плану                   |
| `tool.call.started`   | Початок інструмента/елемента/команди        |
| `tool.call.delta`     | Оновлення інструмента/елемента/команди      |
| `tool.call.completed` | Завершення інструмента/елемента/команди     |
| `tool.call.failed`    | Помилка інструмента/елемента/команди або заблокований статус |
| `approval.requested`  | Запит схвалення exec або Plugin             |
| `approval.resolved`   | Розв’язання схвалення exec або Plugin       |
| `session.created`     | Створення `sessions.changed`                |
| `session.updated`     | Оновлення `sessions.changed`                |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Події оновлення завдання                    |
| `artifact.updated`    | Події потоку patch                          |
| `raw`                 | Будь-яка подія без стабільного зіставлення SDK наразі |

`Run.events()` фільтрує події за одним id виконання та повторює вже побачені події для
швидких виконань. Це означає, що задокументований потік безпечний:

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

Допоміжні засоби моделей зіставляються з поточними методами Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Допоміжні засоби інструментів надають каталог Gateway, ефективний перегляд інструментів і прямий
виклик інструмента Gateway. `oc.tools.invoke()` повертає типізований конверт замість
викидання помилки для відмов policy або схвалення.

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

Допоміжні засоби артефактів надають проєкцію артефактів Gateway для контексту сесії, виконання або
завдання. Кожен виклик потребує однієї явної області `sessionKey`, `runId` або
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

Допоміжні засоби схвалень використовують RPC exec-схвалень:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Допоміжні засоби середовищ надають виявлення лише для читання локальних для Gateway і Node середовищ:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Явно не підтримується сьогодні

SDK містить назви для моделі продукту, яку ми хочемо, але не вдає мовчки,
ніби RPC Gateway існують. Наразі ці виклики викидають явні помилки
непідтримуваності:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Поля окремого виконання `workspace`, `runtime`, `environment` і `approvals` типізовані
як майбутня форма, але поточний Gateway не підтримує ці перевизначення в
RPC `agent`. Якщо викликачі передають їх, SDK викидає помилку перед надсиланням виконання,
щоб робота випадково не виконалася з типовими workspace, runtime,
environment або поведінкою схвалень.

## App SDK проти Plugin SDK

Використовуйте App SDK, коли код існує поза OpenClaw:

- Node-скрипти, які запускають або спостерігають за виконаннями агентів
- завдання CI, які викликають Gateway
- панелі керування та адміністративні панелі
- розширення IDE
- зовнішні мости, яким не потрібно ставати channel plugins
- інтеграційні тести з підробленими або реальними транспортами Gateway

Використовуйте Plugin SDK, коли код працює всередині OpenClaw:

- provider plugins
- channel plugins
- hooks інструментів або життєвого циклу
- plugins обв’язки агентів
- довірені допоміжні засоби середовища виконання

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати з
задокументованих підшляхів `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язане

- [Дизайн API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Сесії](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
