---
read_when:
    - Ви створюєте зовнішній застосунок, скрипт, панель керування, завдання CI або розширення IDE, що взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся із запусками агентів Gateway, сесіями, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний SDK застосунку OpenClaw для зовнішніх застосунків, скриптів, інформаційних панелей, завдань CI та розширень IDE
title: SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-05T14:04:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a902a05e730bbcf762558da798009518161fb68ca7f9ec0ce4314238c6fc5cad
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** — це публічний клієнтський API для застосунків поза процесом
OpenClaw. Використовуйте `@openclaw/sdk`, коли скрипт, панель керування, CI-завдання, розширення IDE
або інший зовнішній застосунок хоче підключитися до Gateway, запускати
запуски агентів, транслювати події, чекати на результати, скасовувати роботу або переглядати
ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` взаємодіє з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які виконуються всередині OpenClaw і
  реєструють провайдерів, канали, інструменти, хуки або довірені середовища виконання.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Інтерфейс                | Стан     | Що він робить                                                                     |
| ------------------------ | -------- | --------------------------------------------------------------------------------- |
| `OpenClaw`               | Готово   | Головна точка входу клієнта. Керує транспортом, з’єднанням, запитами та подіями.  |
| `GatewayClientTransport` | Готово   | WebSocket-транспорт на основі клієнта Gateway.                                    |
| `oc.agents`              | Готово   | Перелічує, створює, оновлює, видаляє та отримує дескриптори агентів.              |
| `Agent.run()`            | Готово   | Запускає Gateway-запуск `agent` і повертає `Run`.                                 |
| `oc.runs`                | Готово   | Створює, отримує, очікує, скасовує та транслює запуски.                           |
| `Run.events()`           | Готово   | Транслює нормалізовані події для окремого запуску з повтором для швидких запусків. |
| `Run.wait()`             | Готово   | Викликає `agent.wait` і повертає стабільний `RunResult`.                          |
| `Run.cancel()`           | Готово   | Викликає `sessions.abort` за id запуску, із ключем сеансу, коли він доступний.     |
| `oc.sessions`            | Готово   | Створює, розв’язує, надсилає до, патчить, compact та отримує дескриптори сеансів. |
| `Session.send()`         | Готово   | Викликає `sessions.send` і повертає `Run`.                                        |
| `oc.models`              | Готово   | Викликає `models.list` і поточний статусний RPC `models.authStatus`.              |
| `oc.tools`               | Готово   | Перелічує, визначає області та викликає інструменти Gateway через політичний конвеєр. |
| `oc.artifacts`           | Готово   | Перелічує, отримує та завантажує артефакти транскриптів Gateway.                  |
| `oc.approvals`           | Готово   | Перелічує та розв’язує exec-схвалення через RPC схвалень Gateway.                 |
| `oc.environments`        | Частково | Перелічує Gateway-локальні та node-кандидати середовищ; create/delete не підключені. |
| `oc.rawEvents()`         | Готово   | Відкриває сирі події Gateway для розширених споживачів.                           |
| `normalizeGatewayEvent()` | Готово  | Перетворює сирі події Gateway на стабільну форму подій SDK.                       |

SDK також експортує базові типи, які використовують ці інтерфейси:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` і пов’язані
типи результатів.

## Підключення до Gateway

Створіть клієнт із явною URL-адресою Gateway або передайте власний транспорт для
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

`new OpenClaw({ gateway: "ws://..." })` еквівалентний `url`. Опція
`gateway: "auto"` приймається конструктором, але автоматичне виявлення Gateway
ще не є окремою функцією SDK; передавайте `url`, коли застосунок ще не знає,
як виявляти Gateway.

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

Посилання на моделі з указаним провайдером, як-от `openai/gpt-5.5`, розділяються на Gateway
перевизначення `provider` і `model`. `timeoutMs` лишається в SDK у мілісекундах і
перетворюється на секунди тайм-ауту Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Дедлайн очікування, що спливає,
поки запуск усе ще активний, повертає `status: "accepted"` замість того, щоб удавати,
ніби сам запуск вичерпав час. Тайм-аути середовища виконання, перервані запуски та скасовані запуски
нормалізуються в `timed_out` або `cancelled`.

## Створення та повторне використання сеансів

Використовуйте сеанси, коли застосунку потрібен стійкий стан транскрипта.

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
| `tool.call.failed`    | Збій інструмента/елемента/команди або заблокований стан |
| `approval.requested`  | Запит схвалення exec або plugin             |
| `approval.resolved`   | Розв’язання схвалення exec або plugin       |
| `session.created`     | Створення `sessions.changed`                |
| `session.updated`     | Оновлення `sessions.changed`                |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Події оновлення завдання                    |
| `artifact.updated`    | Події потоку патчів                         |
| `raw`                 | Будь-яка подія, яка ще не має стабільного зіставлення SDK |

`Run.events()` фільтрує події до одного id запуску та повторює вже побачені події для
швидких запусків. Це означає, що задокументований потік безпечний:

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

Помічники моделей зіставляються з поточними методами Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Помічники інструментів відкривають каталог Gateway, ефективне представлення інструментів і прямий
виклик інструментів Gateway. `oc.tools.invoke()` повертає типізовану оболонку замість
викидання помилки для відмов політики або схвалення.

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

Помічники артефактів відкривають проєкцію артефактів Gateway для контексту сеансу, запуску або
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

Помічники схвалень використовують RPC схвалень exec:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Помічники середовищ відкривають доступне лише для читання Gateway-локальне та node-виявлення:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Явно не підтримується сьогодні

SDK містить імена для моделі продукту, яку ми хочемо, але він не вдає мовчки,
ніби RPC Gateway існують. Ці виклики наразі викидають явні помилки непідтримуваності:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Поля `workspace`, `runtime`, `environment` і `approvals` для окремого запуску типізовані
як майбутня форма, але поточний Gateway не підтримує ці перевизначення в
RPC `agent`. Якщо виклики передають їх, SDK викидає помилку до надсилання запуску,
щоб робота випадково не виконалася зі стандартною поведінкою робочої області, середовища виконання,
середовища або схвалення.

## App SDK проти Plugin SDK

Використовуйте App SDK, коли код живе поза OpenClaw:

- Node-скрипти, які запускають або спостерігають за запусками агентів
- CI-завдання, які викликають Gateway
- панелі керування та адміністративні панелі
- розширення IDE
- зовнішні мости, яким не потрібно ставати каналовими plugins
- інтеграційні тести з фальшивими або реальними транспортами Gateway

Використовуйте Plugin SDK, коли код виконується всередині OpenClaw:

- plugins провайдерів
- каналові plugins
- інструментальні або життєво-циклові хуки
- plugins обв’язки агента
- довірені помічники середовища виконання

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати із
задокументованих підшляхів `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язана документація

- [Дизайн API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Сеанси](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [ACP-агенти](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
