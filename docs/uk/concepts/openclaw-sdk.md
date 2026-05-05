---
read_when:
    - Ви створюєте зовнішній застосунок, сценарій, інформаційну панель, завдання CI або розширення IDE, яке взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся із запусками агентів Gateway, сеансами, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний SDK застосунку OpenClaw для зовнішніх застосунків, скриптів, панелей моніторингу, завдань CI та розширень IDE
title: SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-05T16:52:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 34dd672711197e6070b4efdc082e019b2fc551ea88fc2de83a67b1367807931c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** — це публічний клієнтський API для застосунків поза процесом
OpenClaw. Використовуйте `@openclaw/sdk`, коли сценарій, панель керування, завдання CI, розширення IDE
або інший зовнішній застосунок хоче підключитися до Gateway, запускати виконання агентів,
транслювати події, чекати на результати, скасовувати роботу або переглядати ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` спілкується з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які працюють усередині OpenClaw і
  реєструють провайдерів, канали, інструменти, хуки або довірені середовища виконання.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Поверхня API             | Стан     | Що вона робить                                                                                 |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `OpenClaw`               | Готово   | Основна точка входу клієнта. Володіє транспортом, підключенням, запитами та подіями.            |
| `GatewayClientTransport` | Готово   | WebSocket-транспорт на основі клієнта Gateway.                                                  |
| `oc.agents`              | Готово   | Перелічує, створює, оновлює, видаляє та отримує дескриптори агентів.                            |
| `Agent.run()`            | Готово   | Запускає виконання Gateway `agent` і повертає `Run`.                                            |
| `oc.runs`                | Готово   | Створює, отримує, очікує, скасовує та транслює виконання.                                       |
| `Run.events()`           | Готово   | Транслює нормалізовані події для окремого виконання з повторним відтворенням для швидких виконань. |
| `Run.wait()`             | Готово   | Викликає `agent.wait` і повертає стабільний `RunResult`.                                        |
| `Run.cancel()`           | Готово   | Викликає `sessions.abort` за id виконання, із ключем сеансу, коли він доступний.                |
| `oc.sessions`            | Готово   | Створює, розв’язує, надсилає до, виправляє, ущільнює та отримує дескриптори сеансів.            |
| `Session.send()`         | Готово   | Викликає `sessions.send` і повертає `Run`.                                                       |
| `oc.models`              | Готово   | Викликає `models.list` і поточний RPC стану `models.authStatus`.                                |
| `oc.tools`               | Готово   | Перелічує, обмежує областю і викликає інструменти Gateway через конвеєр політик.                |
| `oc.artifacts`           | Готово   | Перелічує, отримує та завантажує артефакти транскриптів Gateway.                                |
| `oc.approvals`           | Готово   | Перелічує та розв’язує схвалення exec через RPC схвалень Gateway.                               |
| `oc.environments`        | Частково | Перелічує локальні для Gateway і вузлові кандидати середовищ; створення/видалення не підключені. |
| `oc.rawEvents()`         | Готово   | Надає необроблені події Gateway для розширених споживачів.                                      |
| `normalizeGatewayEvent()` | Готово  | Перетворює необроблені події Gateway на стабільну форму подій SDK.                              |

SDK також експортує основні типи, які використовують ці поверхні:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` і пов’язані
типи результатів.

## Підключення до Gateway

Створіть клієнт із явним URL Gateway або інжектуйте власний транспорт для
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

`new OpenClaw({ gateway: "ws://..." })` еквівалентний `url`. Опція
`gateway: "auto"` приймається конструктором, але автоматичне виявлення Gateway
ще не є окремою функцією SDK; передавайте `url`, коли застосунок ще не знає,
як виявити Gateway.

Для тестів передайте об’єкт, що реалізує `OpenClawTransport`:

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

Посилання на моделі з кваліфікацією провайдера, як-от `openai/gpt-5.5`, розділяються на перевизначення Gateway
`provider` і `model`. `timeoutMs` лишається в SDK у мілісекундах і
перетворюється на секунди таймауту Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Дедлайн очікування, що спливає,
поки виконання ще активне, повертає `status: "accepted"` замість удавання,
що саме виконання вичерпало час. Таймаути середовища виконання, перервані виконання та скасовані виконання
нормалізуються в `timed_out` або `cancelled`.

## Створення та повторне використання сеансів

Використовуйте сеанси, коли застосунку потрібен довговічний стан транскрипту.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` викликає `sessions.send` і повертає `Run`. Дескриптори сеансів також
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

Поширені типи подій включають:

| Тип події             | Вихідна подія Gateway                         |
| --------------------- | --------------------------------------------- |
| `run.started`         | Початок життєвого циклу `agent`               |
| `run.completed`       | Завершення життєвого циклу `agent`            |
| `run.failed`          | Помилка життєвого циклу `agent`               |
| `run.cancelled`       | Завершення перерваного/скасованого життєвого циклу |
| `run.timed_out`       | Завершення життєвого циклу через таймаут      |
| `assistant.delta`     | Потокова дельта асистента                     |
| `assistant.message`   | Повідомлення асистента                        |
| `thinking.delta`      | Потік мислення або плану                      |
| `tool.call.started`   | Початок інструмента/елемента/команди          |
| `tool.call.delta`     | Оновлення інструмента/елемента/команди        |
| `tool.call.completed` | Завершення інструмента/елемента/команди       |
| `tool.call.failed`    | Помилка інструмента/елемента/команди або заблокований стан |
| `approval.requested`  | Запит схвалення exec або plugin               |
| `approval.resolved`   | Розв’язання схвалення exec або plugin          |
| `session.created`     | Створення `sessions.changed`                  |
| `session.updated`     | Оновлення `sessions.changed`                  |
| `session.compacted`   | Ущільнення `sessions.changed`                 |
| `task.updated`        | Події оновлення завдання                      |
| `artifact.updated`    | Події потоку патчів                           |
| `raw`                 | Будь-яка подія без стабільного зіставлення SDK |

`Run.events()` фільтрує події до одного id виконання та повторно відтворює вже бачені події для
швидких виконань. Це означає, що задокументований потік безпечний:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Для потоків усього застосунку використовуйте `oc.events()`. Для необроблених кадрів Gateway використовуйте
`oc.rawEvents()`.

## Моделі, інструменти, артефакти та схвалення

Допоміжні функції моделей зіставляються з поточними методами Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Допоміжні функції інструментів надають доступ до каталогу Gateway, ефективного представлення інструментів і прямого
виклику інструментів Gateway. `oc.tools.invoke()` повертає типізовану оболонку замість
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

Допоміжні функції артефактів надають проєкцію артефактів Gateway для контексту сеансу, виконання або
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

Допоміжні функції схвалень використовують RPC схвалень exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Допоміжні функції середовищ надають доступ до локального для Gateway і вузлового виявлення лише для читання:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Явно не підтримується сьогодні

SDK містить назви для продуктової моделі, яку ми хочемо, але він не вдає мовчки,
що RPC Gateway існують. Ці виклики наразі викидають явні помилки непідтримуваності:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Поля для окремого виконання `workspace`, `runtime`, `environment` і `approvals` типізовані
як майбутня форма, але поточний Gateway не підтримує ці перевизначення в
RPC `agent`. Якщо викликачі передають їх, SDK викидає помилку до надсилання виконання,
щоб робота випадково не виконалася зі стандартною поведінкою робочої області, середовища виконання,
середовища або схвалення.

## App SDK проти Plugin SDK

Використовуйте App SDK, коли код живе поза OpenClaw:

- сценарії Node, які запускають або спостерігають за виконаннями агентів
- завдання CI, які викликають Gateway
- панелі керування та адміністративні панелі
- розширення IDE
- зовнішні мости, яким не потрібно ставати channel plugins
- інтеграційні тести з фальшивими або реальними транспортами Gateway

Використовуйте Plugin SDK, коли код працює всередині OpenClaw:

- provider plugins
- channel plugins
- хуки інструментів або життєвого циклу
- plugins для агентського стенда
- довірені допоміжні засоби середовища виконання

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати з
задокументованих підшляхів `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язані документи

- [Дизайн API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Сеанси](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
