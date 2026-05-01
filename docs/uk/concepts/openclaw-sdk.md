---
read_when:
    - Ви створюєте зовнішній застосунок, скрипт, панель моніторингу, завдання CI або розширення IDE, яке взаємодіє з OpenClaw
    - Ви обираєте між App SDK і Plugin SDK
    - Ви інтегруєтеся із запусками агентів Gateway, сеансами, подіями, схваленнями, моделями або інструментами
sidebarTitle: App SDK
summary: Публічний SDK OpenClaw App для зовнішніх застосунків, скриптів, дашбордів, завдань CI та розширень IDE
title: SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-01T08:21:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK** — це публічний клієнтський API для застосунків поза
процесом OpenClaw. Використовуйте `@openclaw/sdk`, коли скрипт, dashboard, завдання CI, IDE
extension або інший зовнішній застосунок хоче підключитися до Gateway, запускати
запуски агентів, транслювати події, чекати результатів, скасовувати роботу або переглядати
ресурси Gateway.

<Note>
  App SDK відрізняється від [Plugin SDK](/uk/plugins/sdk-overview).
  `@openclaw/sdk` взаємодіє з Gateway ззовні OpenClaw.
  `openclaw/plugin-sdk/*` призначений лише для plugins, які виконуються всередині OpenClaw і
  реєструють провайдерів, канали, інструменти, hooks або довірені runtime.
</Note>

## Що постачається сьогодні

`@openclaw/sdk` постачається з:

| Поверхня                  | Статус | Що вона робить                                                            |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | Готово | Основна точка входу клієнта. Керує transport, з’єднанням, запитами та подіями. |
| `GatewayClientTransport`  | Готово | WebSocket transport на основі клієнта Gateway.                             |
| `oc.agents`               | Готово | Перелічує, створює, оновлює, видаляє та отримує дескриптори агентів.       |
| `Agent.run()`             | Готово | Запускає запуск Gateway `agent` і повертає `Run`.                          |
| `oc.runs`                 | Готово | Створює, отримує, очікує, скасовує та транслює запуски.                    |
| `Run.events()`            | Готово | Транслює нормалізовані події окремого запуску з replay для швидких запусків. |
| `Run.wait()`              | Готово | Викликає `agent.wait` і повертає стабільний `RunResult`.                   |
| `Run.cancel()`            | Готово | Викликає `sessions.abort` за id запуску, із ключем сеансу, коли він доступний. |
| `oc.sessions`             | Готово | Створює, розв’язує, надсилає в, патчить, стискає та отримує дескриптори сеансів. |
| `Session.send()`          | Готово | Викликає `sessions.send` і повертає `Run`.                                 |
| `oc.models`               | Готово | Викликає `models.list` і поточний status RPC `models.authStatus`.          |
| `oc.tools`                | Готово | Перелічує, обмежує scope та викликає інструменти Gateway через policy pipeline. |
| `oc.artifacts`            | Готово | Перелічує, отримує та завантажує артефакти transcript Gateway.             |
| `oc.approvals`            | Готово | Перелічує та розв’язує exec approvals через approval RPCs Gateway.         |
| `oc.rawEvents()`          | Готово | Надає raw події Gateway для досвідчених споживачів.                        |
| `normalizeGatewayEvent()` | Готово | Перетворює raw події Gateway на стабільну форму подій SDK.                 |

SDK також експортує базові типи, які використовують ці поверхні:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` і пов’язані
типи результатів.

## Підключення до Gateway

Створіть клієнт із явним URL Gateway або інжектуйте власний transport для
тестів і runtime вбудованих застосунків.

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

Посилання на моделі з указанням провайдера, як-от `openai/gpt-5.5`, розділяються на Gateway
override для `provider` і `model`. `timeoutMs` лишається в SDK у мілісекундах і
перетворюється на секунди timeout Gateway для RPC `agent`.

`run.wait()` використовує RPC Gateway `agent.wait`. Deadline очікування, який спливає,
поки запуск ще активний, повертає `status: "accepted"` замість того, щоб удавати,
ніби сам запуск вичерпав час. Runtime timeouts, перервані запуски та скасовані запуски
нормалізуються в `timed_out` або `cancelled`.

## Створення та повторне використання сеансів

Використовуйте сеанси, коли застосунку потрібен стійкий стан transcript.

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

SDK нормалізує raw події Gateway у стабільний envelope `OpenClawEvent`:

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

| Тип події             | Подія Gateway-джерела                       |
| --------------------- | ------------------------------------------- |
| `run.started`         | Початок lifecycle `agent`                   |
| `run.completed`       | Завершення lifecycle `agent`                |
| `run.failed`          | Помилка lifecycle `agent`                   |
| `run.cancelled`       | Завершення перерваного/скасованого lifecycle |
| `run.timed_out`       | Завершення lifecycle через timeout          |
| `assistant.delta`     | Streaming delta асистента                   |
| `assistant.message`   | Повідомлення асистента                      |
| `thinking.delta`      | Потік мислення або плану                    |
| `tool.call.started`   | Початок інструмента/item/команди            |
| `tool.call.delta`     | Оновлення інструмента/item/команди          |
| `tool.call.completed` | Завершення інструмента/item/команди         |
| `tool.call.failed`    | Збій інструмента/item/команди або заблокований статус |
| `approval.requested`  | Запит exec або plugin approval              |
| `approval.resolved`   | Розв’язання exec або plugin approval        |
| `session.created`     | Створення `sessions.changed`                |
| `session.updated`     | Оновлення `sessions.changed`                |
| `session.compacted`   | Compaction `sessions.changed`               |
| `task.updated`        | Події оновлення завдання                    |
| `artifact.updated`    | Події patch stream                          |
| `raw`                 | Будь-яка подія, яка ще не має стабільного SDK mapping |

`Run.events()` фільтрує події до одного id запуску та відтворює вже побачені події для
швидких запусків. Це означає, що документований потік безпечний:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Для потоків усього застосунку використовуйте `oc.events()`. Для raw frames Gateway використовуйте
`oc.rawEvents()`.

## Моделі, інструменти, артефакти та approvals

Допоміжні функції моделей відображаються на поточні методи Gateway:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Допоміжні функції інструментів надають каталог Gateway, effective tool view і прямий
виклик інструментів Gateway. `oc.tools.invoke()` повертає типізований envelope замість
викидання помилки для policy або approval refusals.

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

Допоміжні функції артефактів надають projection артефактів Gateway для контексту сеансу, запуску або
завдання. Кожен виклик вимагає одного явного scope `sessionKey`, `runId` або
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

Допоміжні функції approvals використовують exec approval RPCs:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Явно не підтримується сьогодні

SDK включає назви для моделі продукту, якої ми прагнемо, але він не вдає мовчки,
що RPCs Gateway існують. Ці виклики наразі викидають явні помилки про
непідтримуваність:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Поля окремого запуску `workspace`, `runtime`, `environment` і `approvals` типізовані
як майбутня форма, але поточний Gateway не підтримує ці overrides в
RPC `agent`. Якщо викликачі передають їх, SDK викидає помилку до надсилання запуску,
щоб робота випадково не виконалася з типовою поведінкою workspace, runtime,
environment або approval.

## App SDK проти Plugin SDK

Використовуйте App SDK, коли код живе поза OpenClaw:

- Node scripts, які запускають або спостерігають запуски агентів
- Завдання CI, які викликають Gateway
- dashboards і панелі адміністрування
- IDE extensions
- зовнішні bridges, яким не потрібно ставати channel plugins
- інтеграційні тести з fake або real transports Gateway

Використовуйте Plugin SDK, коли код виконується всередині OpenClaw:

- provider plugins
- channel plugins
- hooks інструментів або lifecycle
- plugins agent harness
- довірені runtime helpers

Код App SDK має імпортувати з `@openclaw/sdk`. Код Plugin має імпортувати з
документованих subpaths `openclaw/plugin-sdk/*`. Не змішуйте ці два контракти.

## Пов’язані документи

- [Дизайн API OpenClaw App SDK](/uk/reference/openclaw-sdk-api-design)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Runtime агентів](/uk/concepts/agent-runtimes)
- [Сеанси](/uk/concepts/session)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
