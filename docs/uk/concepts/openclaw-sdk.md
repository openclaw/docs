---
read_when:
    - Ви створюєте зовнішній застосунок, скрипт, панель моніторингу, завдання CI або розширення IDE, що взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся з виконаннями агентів Gateway, сеансами, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний OpenClaw App SDK для зовнішніх застосунків, скриптів, панелей моніторингу, завдань CI та розширень IDE
title: SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-01T00:39:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: e531e985ca82026b230b03f8df5ab908d66e2b608e09c46af2ec060b9def0c24
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

The **OpenClaw App SDK** — це публічний клієнтський API для застосунків поза процесом
OpenClaw. Використовуйте `@openclaw/sdk`, коли скрипт, панель керування, завдання CI, розширення IDE
або інший зовнішній застосунок хоче підключитися до Gateway, запускати виконання агентів,
транслювати події, чекати на результати, скасовувати роботу або перевіряти ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` взаємодіє з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які працюють усередині OpenClaw і
  реєструють провайдери, канали, інструменти, хуки або довірені середовища виконання.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Поверхня                  | Статус  | Що вона робить                                                               |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Готово  | Головна точка входу клієнта. Керує транспортом, підключенням, запитами та подіями. |
| `GatewayClientTransport`  | Готово  | WebSocket-транспорт на базі клієнта Gateway.                                 |
| `oc.agents`               | Готово  | Перелічує, створює, оновлює, видаляє та отримує дескриптори агентів.         |
| `Agent.run()`             | Готово  | Запускає виконання Gateway `agent` і повертає `Run`.                         |
| `oc.runs`                 | Готово  | Створює, отримує, очікує, скасовує та транслює виконання.                    |
| `Run.events()`            | Готово  | Транслює нормалізовані події окремого виконання з повтором для швидких виконань. |
| `Run.wait()`              | Готово  | Викликає `agent.wait` і повертає стабільний `RunResult`.                     |
| `Run.cancel()`            | Готово  | Викликає `sessions.abort` за id виконання, із ключем сесії, коли він доступний. |
| `oc.sessions`             | Готово  | Створює, розв’язує, надсилає до, патчить, стискає та отримує дескриптори сесій. |
| `Session.send()`          | Готово  | Викликає `sessions.send` і повертає `Run`.                                   |
| `oc.models`               | Готово  | Викликає `models.list` і поточний статусний RPC `models.authStatus`.         |
| `oc.tools`                | Частково | Перелічує каталог інструментів і ефективні інструменти; прямий виклик інструментів не підключено. |
| `oc.artifacts`            | Готово  | Перелічує, отримує та завантажує артефакти транскриптів Gateway.             |
| `oc.approvals`            | Готово  | Перелічує та розв’язує схвалення exec через RPC схвалень Gateway.            |
| `oc.rawEvents()`          | Готово  | Надає сирі події Gateway для просунутих споживачів.                          |
| `normalizeGatewayEvent()` | Готово  | Перетворює сирі події Gateway на стабільну форму події SDK.                  |

SDK також експортує основні типи, які використовують ці поверхні:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` і пов’язані
типи результатів.

## Підключення до Gateway

Створіть клієнт із явною URL-адресою Gateway або інжектуйте власний транспорт для
тестів і вбудованих середовищ виконання застосунків.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` еквівалентний `url`. Опцію
`gateway: "auto"` приймає конструктор, але автоматичне виявлення Gateway
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

Посилання на моделі з кваліфікацією провайдера, як-от `openai/gpt-5.5`, розділяються на Gateway
перевизначення `provider` і `model`. `timeoutMs` залишається в мілісекундах у SDK і
перетворюється на секунди тайм-ауту Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Дедлайн очікування, який спливає,
поки виконання ще активне, повертає `status: "accepted"` замість того, щоб удавати,
ніби саме виконання вичерпало час. Тайм-аути середовища виконання, перервані виконання та скасовані виконання
нормалізуються в `timed_out` або `cancelled`.

## Створення та повторне використання сесій

Використовуйте сесії, коли застосунку потрібен тривалий стан транскрипту.

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

| Тип події             | Вихідна подія Gateway                       |
| --------------------- | ------------------------------------------- |
| `run.started`         | Початок життєвого циклу `agent`             |
| `run.completed`       | Кінець життєвого циклу `agent`              |
| `run.failed`          | Помилка життєвого циклу `agent`             |
| `run.cancelled`       | Кінець перерваного/скасованого життєвого циклу |
| `run.timed_out`       | Кінець життєвого циклу через тайм-аут       |
| `assistant.delta`     | Потокова дельта асистента                   |
| `assistant.message`   | Повідомлення асистента                      |
| `thinking.delta`      | Потік міркувань або плану                   |
| `tool.call.started`   | Початок інструмента/елемента/команди        |
| `tool.call.delta`     | Оновлення інструмента/елемента/команди      |
| `tool.call.completed` | Завершення інструмента/елемента/команди     |
| `tool.call.failed`    | Помилка інструмента/елемента/команди або заблокований статус |
| `approval.requested`  | Запит на схвалення exec або Plugin          |
| `approval.resolved`   | Розв’язання схвалення exec або Plugin       |
| `session.created`     | Створення `sessions.changed`                |
| `session.updated`     | Оновлення `sessions.changed`                |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Події оновлення завдання                    |
| `artifact.updated`    | Події потоку патчів                         |
| `raw`                 | Будь-яка подія, яка ще не має стабільного зіставлення SDK |

`Run.events()` фільтрує події до одного id виконання та повторює вже побачені події для
швидких виконань. Це означає, що задокументований потік безпечний:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Для потоків на рівні всього застосунку використовуйте `oc.events()`. Для сирих кадрів Gateway використовуйте
`oc.rawEvents()`.

## Моделі, інструменти, артефакти та схвалення

Допоміжні функції моделей відповідають поточним методам Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Допоміжні функції інструментів надають каталог Gateway і подання ефективних інструментів:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Допоміжні функції артефактів надають проєкцію артефактів Gateway для контексту сесії, виконання або
завдання. Кожен виклик вимагає одну явну область `sessionKey`, `runId` або
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

Допоміжні функції схвалень використовують RPC схвалень exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Явно непідтримуване сьогодні

SDK містить назви для продуктової моделі, яку ми хочемо, але він не вдає мовчки,
ніби RPC Gateway існують. Зараз ці виклики кидають явні помилки непідтримуваності:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Поля окремого виконання `workspace`, `runtime`, `environment` і `approvals` типізовані
як майбутня форма, але поточний Gateway не підтримує ці перевизначення в
RPC `agent`. Якщо викликачі передають їх, SDK кидає помилку перед надсиланням виконання,
щоб робота випадково не виконалася з типовою поведінкою workspace, runtime,
environment або approval.

## App SDK проти Plugin SDK

Використовуйте App SDK, коли код живе поза OpenClaw:

- Node-скрипти, які запускають або спостерігають виконання агентів
- завдання CI, які викликають Gateway
- панелі керування та адміністративні панелі
- розширення IDE
- зовнішні мости, яким не потрібно ставати channel plugins
- інтеграційні тести з фейковими або реальними транспортами Gateway

Використовуйте Plugin SDK, коли код працює всередині OpenClaw:

- provider plugins
- channel plugins
- хуки інструментів або життєвого циклу
- agent harness plugins
- довірені допоміжні засоби середовища виконання

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати з
задокументованих підшляхів `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язані документи

- [Дизайн API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Сесії](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
