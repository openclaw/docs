---
read_when:
    - Ви проєктуєте або реалізуєте публічний SDK застосунку OpenClaw
    - Ви порівнюєте API агентів OpenClaw із Cursor, Claude Agent SDK, OpenAI Agents, Google ADK, OpenCode, Codex або ACP
    - Потрібно вирішити, чи належить можливість до публічного App SDK, Plugin SDK, протоколу Gateway, бекенду ACP або шару керованого середовища
sidebarTitle: App SDK
summary: Дизайн публічного SDK застосунків OpenClaw для зовнішніх застосунків, скриптів, панелей моніторингу, завдань CI та розширень IDE
title: SDK застосунків OpenClaw
x-i18n:
    generated_at: "2026-04-30T00:49:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 227d3baf3aaf54bf35288214b051e2e284280165e1283d476594feda26d56bb9
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

Ця сторінка є проєктною пропозицією для публічного **OpenClaw App SDK**. Вона
відокремлена від наявного [Plugin SDK](/uk/plugins/sdk-overview).

<Note>
  Використовуйте `@openclaw/sdk`, коли зовнішній застосунок, скрипт, dashboard, CI job або IDE
  extension хоче запускати агентів OpenClaw і спостерігати за ними через Gateway. Використовуйте
  `openclaw/plugin-sdk/*` лише під час написання Plugin, який працює всередині OpenClaw.
</Note>

Plugin SDK призначений для коду, який працює всередині OpenClaw і розширює providers,
channels, tools, hooks і trusted runtimes. App SDK має бути призначений для
зовнішніх застосунків, скриптів, dashboards, CI jobs, IDE extensions і
систем автоматизації, які хочуть запускати агентів OpenClaw і спостерігати за ними через стабільний
публічний API.

## Статус

Чернетка архітектури.

Цей документ фіксує напрям дизайну на основі порівняльного огляду цих
agent SDK і runtime surfaces:

| Проєкт             | Корисний висновок                                                                                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor SDK cookbook | Найкращий високорівневий продуктовий API: `Agent`, `Run`, локальні та хмарні runtimes, streaming, cancellation, model discovery, repositories, artifacts і cloud pull request flows.    |
| Claude Agent SDK    | Потужний двоспрямований session client, підтримка interrupt і steer, permission modes, hooks, custom tools, session stores і resumable transcripts.                        |
| OpenAI Agents SDK   | Сильні концепції workflow: handoffs, guardrails, human approvals, tracing, run state, streaming result objects і resume after interruptions.                             |
| Google ADK          | Потужна внутрішня архітектура: runner, session service, memory service, artifact service, credential service, plugins, event actions і long running tool confirmations.  |
| OpenCode            | Сильна форма client/server: generated API client, REST plus SSE, sessions, workspaces, worktrees, permissions, questions, files, VCS, PTY, tools, agents, skills і MCP. |
| Codex               | Сильна межа локального runtime: approvals, sandboxing, network policy, локальні та віддалені exec servers, structured protocol events і thread aware app-server sessions.     |
| ACP і acpx        | Сильний шар сумісності для зовнішніх coding harnesses із named sessions, prompt queues, cooperative cancellation і runtime adapters.                            |

Рекомендація полягає в тому, щоб побудувати публічний facade у стилі Cursor-simple поверх
згенерованого Gateway client у стилі OpenCode, зберігаючи концепції Claude, OpenAI Agents,
ADK, Codex і ACP як внутрішні дизайнерські орієнтири там, де вони доречні.

## Цілі

- Дати розробникам застосунків мінімальний високорівневий API для запуску агентів OpenClaw.
- Зберегти local-first OpenClaw як runtime за замовчуванням.
- Зробити хмарні або managed environments додатковим environment provider, а не
  іншим agent API.
- Зберегти наявні межі OpenClaw: Gateway володіє публічним protocol, plugin
  SDK володіє in-process extensions, ACP володіє interop із external harness.
- Підтримувати `stream`, `wait`, `cancel`, `resume`, `fork`, artifacts, approvals,
  і background tasks як першокласні операції.
- Надавати стабільні нормалізовані events, зберігаючи runtime-native raw events для
  просунутих споживачів.
- Зробити SDK permissions, secret forwarding, approvals, sandboxing і remote
  environments явними.
- Зберегти публічний контракт достатньо малим, щоб його можна було документувати, тестувати, версіонувати та
  генерувати.

## Нецілі

- Не відкривати `openclaw/plugin-sdk/*` як app SDK.
- Не робити ACP єдиною runtime model.
- Не вимагати cloud service до того, як SDK стане корисним.
- Не клонувати API Cursor, Claude, OpenAI, ADK, OpenCode, Codex або ACP
  дослівно.
- Не виставляти необмежені payloads подій `any` як єдиний публічний контракт.
- Не обіцяти sandbox або network isolation для external harness, якщо
  вибране середовище не може реально це забезпечити.
- Не змушувати авторів plugin залежати від об’єктів app SDK всередині runtime
  code plugin.

## Поточна відповідність OpenClaw

OpenClaw уже має більшість основи:

| Наявна surface                                    | Що вона дає                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [Agent loop](/uk/concepts/agent-loop)                  | Життєвий цикл запуску `agent` і `agent.wait`, streaming, timeout і session serialization.                                     |
| [Agent runtimes](/uk/concepts/agent-runtimes)          | Розділення provider, model, runtime і channel.                                                                          |
| [ACP agents](/uk/tools/acp-agents)                     | Sessions зовнішнього harness для Claude Code, Cursor, Gemini CLI, OpenCode, explicit Codex ACP і подібних інструментів.            |
| [Background tasks](/uk/automation/tasks)               | Відокремлений ledger активності для ACP, subagents, Cron, CLI operations і async media jobs.                                   |
| [Sub-agents](/uk/tools/subagents)                      | Ізольовані фонові agent runs, optional forked context, доставка назад у requester sessions.                              |
| [Agent harness plugins](/uk/plugins/sdk-agent-harness) | Реєстрація trusted native runtime для embedded harnesses, таких як Codex.                                                  |
| Gateway protocol schemas                            | Поточні типізовані визначення method і event для agent params, sessions, subscriptions, aborts, Compaction і checkpoints. |

Прогалина не в agent execution. Прогалина — у стабільному, зручному публічному facade над
цими компонентами.

## Основна модель

App SDK має використовувати невеликий набір стійких іменників.

| Іменник          | Значення                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `OpenClaw`    | Точка входу клієнта. Володіє Gateway discovery, auth, low-level client access і namespace factories.                        |
| `Agent`       | Налаштований actor. Містить agent id, default model, default runtime, default tool policy і app-facing helpers.           |
| `Session`     | Стійкий transcript, routing, workspace, context і runtime binding.                                                      |
| `Run`         | Один надісланий turn або task. Streams events, waits for result, cancels і exposes artifacts.                              |
| `Task`        | Detached або background activity ledger entry. Охоплює subagents, ACP spawns, Cron jobs, CLI runs і async jobs.           |
| `Artifact`    | Files, patches, diffs, media, logs, trajectories, pull requests, screenshots і generated bundles.                       |
| `Environment` | Де виконується run: local Gateway, local workspace, node host, ACP harness, managed runner або майбутній cloud workspace. |
| `ToolSpace`   | Ефективна tool surface: OpenClaw tools, MCP servers, channel tools, app tools, approval rules і tool metadata.      |
| `Approval`    | Рішення людини або політики, запитане run, tool, environment або harness.                                                |

Ці іменники добре мапляться на наявні концепції OpenClaw, але не розкривають
implementation-specific names, такі як внутрішні механізми PI runner, реєстрація plugin harness
або деталі ACP adapter.

## Форма продукту

Високорівневий SDK має відчуватися так:

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({ gateway: "auto" });
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
});

for await (const event of run.events()) {
  if (event.type === "assistant.delta") {
    process.stdout.write(event.text);
  }
}

const result = await run.wait();
console.log(result.status);
```

Той самий застосунок має мати змогу використовувати durable session:

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

Поточна примітка щодо реалізації: `@openclaw/sdk` починається з Gateway-backed
surface, яка існує сьогодні. Provider-qualified model refs, такі як
`openai/gpt-5.5`, розділяються на Gateway `provider` і `model` overrides.
Per-run вибори `workspace`, `runtime`, `environment` і `approvals` усе ще є
дизайнерськими цілями; клієнт кидає помилку, коли callers задають їх, щоб requests не
виконувалися мовчки з defaults. Task, artifact, environment і generic tool
invocation helpers також scaffolded як майбутня форма API і кидають явні
unsupported errors, доки для них не існує Gateway RPCs.

І той самий API має мати змогу використовувати зовнішній ACP harness:

```typescript
const run = await oc.runs.create({
  input: "Deep review this repository and return only high-risk findings.",
  workspace: { cwd: process.cwd() },
  runtime: { type: "acp", harness: "claude" },
  mode: "task",
});
```

Managed environments не мають змінювати top-level API:

```typescript
const run = await agent.run({
  input: "Run the full changed gate and summarize failures.",
  workspace: { repo: "openclaw/openclaw", ref: "main" },
  runtime: {
    type: "managed",
    provider: "testbox",
    timeoutMinutes: 90,
  },
});
```

## Вибір runtime

App SDK має надавати вибір runtime як normalized union:

```typescript
type RuntimeSelection =
  | "auto"
  | { type: "embedded"; id: "pi" | "codex" | string }
  | { type: "cli"; id: "claude-cli" | string }
  | { type: "acp"; harness: "claude" | "cursor" | "gemini" | "opencode" | string }
  | { type: "managed"; provider: "local" | "node" | "testbox" | "cloud" | string };
```

Правила:

- `auto` дотримується правил вибору runtime OpenClaw.
- `embedded` націлюється на trusted in-process harnesses, зареєстровані через plugin
  SDK, такі як `pi` або `codex`.
- `cli` націлюється на OpenClaw-owned CLI backend execution там, де вона доступна.
- `acp` націлюється на зовнішні harnesses через ACP/acpx.
- `managed` націлюється на environment provider і все ще може запускати embedded,
  CLI або ACP runtime всередині цього environment.

Об’єкт вибору runtime має бути описовим. Він не має бути місцем,
де ховаються secret handling, sandbox policy або workspace provisioning.

## Модель environment

Environment — це execution substrate. Він має бути явним, оскільки локальні
CLI runs, external harnesses, node hosts і cloud workspaces мають різні
властивості безпеки та життєвого циклу.

```typescript
type EnvironmentSelection =
  | { type: "local"; cwd?: string }
  | { type: "gateway"; url?: string; cwd?: string }
  | { type: "node"; nodeId: string; cwd?: string }
  | { type: "managed"; provider: string; repo?: string; ref?: string }
  | { type: "ephemeral"; provider: string; repo?: string; ref?: string };
```

Environment володіє:

- підготовкою checkout або workspace
- доступом до процесів і файлів
- забезпеченням sandbox і network
- environment variables і secret references
- logs, traces і artifacts
- cleanup і retention
- availability runtime

Це розділення робить managed agents природним розширенням SDK. Managed
agent — це звичайний run у managed environment, а не окреме продуктове відгалуження.

Детальні контракти namespace, event, result, approval, artifact, security, package,
і environment provider містяться в
[OpenClaw App SDK API design](/uk/reference/openclaw-sdk-api-design).

## План cookbook

SDK має постачатися з кулінарною книгою, а не лише з довідковою документацією.

Рекомендовані приклади:

| Приклад                      | Показує                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Швидкий старт                   | Створення клієнта, запуск агента, потокове виведення, очікування результату.                                 |
| CLI кодувального агента             | Локальний робочий простір, вибір моделі, скасування, схвалення, JSON-вивід.                         |
| Панель агента              | Сесії, запуски, фонові завдання, артефакти, відтворення подій, фільтри статусу.                   |
| Конструктор застосунків                  | Агент редагує робочий простір, поки поруч працює сервер попереднього перегляду.                               |
| Рецензент pull request        | Запуск для посилання репозиторію, збирання коментарів до diff і артефактів.                           |
| Консоль схвалень             | Підписка на схвалення та відповіді на них з UI.                                            |
| Запускач ACP harness           | Запуск Claude Code, Cursor, Gemini CLI або OpenCode через ACP за допомогою того самого API `Run`.       |
| Постачальник керованого середовища | Мінімальний постачальник, який готує робочий простір, транслює події, зберігає артефакти та очищує ресурси.  |
| Міст Slack або Discord      | Зовнішній застосунок отримує події та публікує зведення прогресу, не стаючи Plugin каналу. |
| Багатоагентне дослідження         | Породження паралельних запусків, збирання артефактів і синтез фінального звіту.                       |

Приклади кулінарної книги мають спершу використовувати високорівневий API. Приклади низькорівневого згенерованого
клієнта належать до розширеного розділу.

## Поетапна реалізація

### Фаза 0: RFC і словник

- Узгодити публічні іменники та назви.
- Визначити назви пакетів.
- Визначити першу таксономію подій.
- Позначити поточний Plugin SDK у документації як навмисно окремий.

### Фаза 1: Низькорівневий згенерований клієнт

- Згенерувати TypeScript-клієнт зі схем протоколу Gateway.
- Спершу покрити `agent`, `agent.wait`, сесії, підписки, переривання та завдання.
- Додати smoke-тести, які перевіряють, що згенеровані методи відповідають назвам методів Gateway і
  формам схем.
- Опублікувати як експериментальний або внутрішній пакет.

### Фаза 2: Високорівневий API запуску

- Додати `OpenClaw`, `Agent`, `Session` і `Run`.
- Підтримати `run.events()`, `run.wait()` і `run.cancel()`.
- Підтримати виявлення локального Gateway і явні URL Gateway.
- Підтримати довговічні сесії та надсилання в сесію.

### Фаза 3: Нормалізована проєкція подій

- Додати на боці Gateway нормалізовану проєкцію подій поруч з наявними сирими подіями.
- Зберегти сирі події середовища виконання там, де це дозволяє політика.
- Додати курсори відтворення та поведінку повторного підключення.
- Відобразити події PI, Codex, ACP і завдань у стабільну таксономію.

### Фаза 4: Артефакти та схвалення

- Додати перелік і завантаження артефактів.
- Додати помічники підписки на схвалення та відповіді.
- Додати помічники підписки на запитання та відповіді.
- Додати консоль схвалень до кулінарної книги.

### Фаза 5: Постачальники середовищ

- Запровадити контракти постачальників локального, вузлового та керованого середовища.
- Почати з середовища, яке вже існує операційно.
- Додати підготовку робочого простору, журнали, артефакти, тайм-аут, очищення та зберігання.

### Фаза 6: Робочі процеси в хмарному стилі

- Додати запуски, орієнтовані на репозиторій і гілку.
- Додати артефакти pull request.
- Додати дошки запусків, згруповані за репозиторієм, гілкою, статусом і виконавцем.
- Додати довготривалі керовані сесії та політику зберігання.

## Дизайн-рішення для наслідування

Скопіювати ці ідеї:

- З Cursor: `Agent` плюс `Run`, симетрія локального та хмарного режимів, виявлення моделей,
  артефакти й onboarding через кулінарну книгу.
- З Claude Agent SDK: двонапрямні клієнти, переривання, дозволи, hooks,
  користувацькі інструменти, сховища сесій і семантика відновлення.
- З OpenAI Agents: передавання керування, захисні обмеження, відновлення після людського схвалення, трасування та
  структуровані об’єкти потокового результату.
- З Google ADK: сервіси за runner, дії подій, пам’ять, артефакти,
  сервіси облікових даних і перехоплення Plugin навколо життєвого циклу запуску.
- З OpenCode: згенерований клієнт протоколу, REST плюс SSE, сесії,
  робочі простори, запитання, дозволи, файли, VCS, PTY, MCP, агенти та Skills.
- З Codex: явні пісочниця, схвалення, мережа, локальне та віддалене виконання, а також
  межі потоків app-server.
- З ACP і acpx: сумісність зовнішніх harness на основі адаптерів і іменовані
  черги prompt.

## Дизайн-рішення, яких слід уникати

Уникайте цих пасток:

- Публічний SDK, який є лише тонким вивантаженням внутрішніх деталей Gateway.
- Публічний SDK, який імпортує підшляхи Plugin SDK.
- Публічний SDK, де події — це лише `stream` плюс `data`.
- API з пріоритетом хмари, через який локальний OpenClaw відчувається як застарілий режим.
- Вибір середовища виконання, прихований у префіксах ідентифікаторів моделей.
- Передавання секретів, приховане в мапах середовища.
- ACP-специфічні параметри на верхньому рівні кожного запуску.
- Прапорці пісочниці, які неможливо забезпечити вибраним середовищем виконання.
- Один об’єкт SDK, який одночасно намагається бути provider Plugin, channel Plugin, клієнтом застосунку
  і керованим runner.

## Відкриті питання

- Чи має початковий пакет жити в цьому репозиторії чи в окремому репозиторії SDK?
- Чи слід публікувати згенерований низькорівневий клієнт публічно до стабілізації
  високорівневої обгортки?
- Який перший підтримуваний механізм автентифікації застосунку: локальний токен, admin-токен,
  OAuth device flow чи підписана реєстрація застосунку?
- Скільки історії повідомлень сесії SDK має відкривати за замовчуванням?
- Чи мають керовані середовища налаштовуватися лише в конфігурації Gateway, чи виклики SDK
  можуть запитувати їх напряму зі scoped tokens?
- Які правила зберігання застосовуються до артефактів, згенерованих локальними запусками?
- Які payload подій потребують редагування перед доставленням у застосунок?
- Чи має `Run` покривати звичайні ходи чату й відокремлені завдання, чи відокремлена
  фонова робота завжди має повертати обгортку `Task` з вкладеним `Run`?

## Пов’язані документи

- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агента](/uk/concepts/agent-runtimes)
- [Сесія](/uk/concepts/session)
- [Субагенти](/uk/tools/subagents)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Agent harness plugins](/uk/plugins/sdk-agent-harness)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
