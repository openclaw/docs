---
read_when:
    - Ви реалізуєте запропонований публічний SDK застосунку OpenClaw
    - Вам потрібен чорновий контракт простору імен, події, результату, артефакту, схвалення або безпеки для SDK застосунку
    - Ви порівнюєте ресурси протоколу Gateway з високорівневою обгорткою OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Еталонний дизайн публічного API OpenClaw App SDK, таксономії подій, артефактів, схвалень і структури пакета
title: Проєктування API SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-05T14:04:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: ca2d98914ab83c1752211489f9966ee62da13f7435781356548c0646f5739195
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ця сторінка є детальним дизайном довідника API для публічного
[OpenClaw App SDK](/uk/concepts/openclaw-sdk). Її навмисно відокремлено від
[Plugin SDK](/uk/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` — це зовнішній пакет застосунку/клієнта для взаємодії з
  Gateway. `openclaw/plugin-sdk/*` — це контракт створення Plugin у процесі.
  Не імпортуйте підшляхи Plugin SDK із застосунків, яким потрібно лише запускати агентів.
</Note>

Публічний SDK для застосунків слід будувати у два шари:

1. Низькорівневий згенерований клієнт Gateway.
2. Високорівнева ергономічна обгортка з об’єктами `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` та `Environment`.

## Дизайн просторів імен

Низькорівневі простори імен мають близько відповідати ресурсам Gateway:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Високорівневі обгортки мають повертати об’єкти, які роблять поширені сценарії зручними:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Контракт подій

Публічний SDK має надавати версійовані, відтворювані та нормалізовані події.

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
  raw?: unknown;
};
```

`id` є курсором відтворення. Споживачі повинні мати змогу повторно підключатися через
`events({ after: id })` і отримувати пропущені події, коли це дозволяє утримання.

Рекомендовані сімейства нормалізованих подій:

| Подія                 | Значення                                                    |
| --------------------- | ---------------------------------------------------------- |
| `run.created`         | Запуск прийнято.                                           |
| `run.queued`          | Запуск очікує на смугу сесії, runtime або середовище.      |
| `run.started`         | Runtime почав виконання.                                   |
| `run.completed`       | Запуск успішно завершився.                                 |
| `run.failed`          | Запуск завершився з помилкою.                              |
| `run.cancelled`       | Запуск було скасовано.                                     |
| `run.timed_out`       | Запуск перевищив свій час очікування.                      |
| `assistant.delta`     | Дельта тексту асистента.                                   |
| `assistant.message`   | Повне повідомлення асистента або заміна.                   |
| `thinking.delta`      | Дельта міркування або плану, коли політика дозволяє показ. |
| `tool.call.started`   | Виклик інструмента розпочався.                             |
| `tool.call.delta`     | Виклик інструмента транслював прогрес або частковий вивід. |
| `tool.call.completed` | Виклик інструмента успішно повернув результат.             |
| `tool.call.failed`    | Виклик інструмента не вдався.                              |
| `approval.requested`  | Запуск або інструмент потребує схвалення.                  |
| `approval.resolved`   | Схвалення було надано, відхилено, прострочено або скасовано. |
| `question.requested`  | Runtime просить у користувача або застосунку-хоста введення. |
| `question.answered`   | Застосунок-хост надав відповідь.                           |
| `artifact.created`    | Доступний новий артефакт.                                  |
| `artifact.updated`    | Наявний артефакт змінився.                                 |
| `session.created`     | Сесію створено.                                            |
| `session.updated`     | Метадані сесії змінено.                                    |
| `session.compacted`   | Відбулася Compaction сесії.                                |
| `task.updated`        | Стан фонового завдання змінився.                           |
| `git.branch`          | Runtime спостеріг або змінив стан гілки.                   |
| `git.diff`            | Runtime створив або змінив diff.                           |
| `git.pr`              | Runtime відкрив, оновив або пов’язав pull request.         |

Нативні payload runtime мають бути доступні через `raw`, але застосунки не повинні
парсити `raw` для звичайного UI.

## Контракт результату

`Run.wait()` має повертати стабільну оболонку результату:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Результат має бути простим і стабільним. Значення часових міток зберігають форму
Gateway, тому поточні запуски, підкріплені життєвим циклом, зазвичай повідомляють
числа епохи в мілісекундах, тоді як адаптери все ще можуть показувати ISO-рядки.
Насичений UI, трасування інструментів і нативні деталі runtime належать до подій та артефактів.

`accepted` — це нетермінальний результат очікування: він означає, що дедлайн очікування
Gateway минув до того, як запуск створив завершення/помилку життєвого циклу. Його не можна
трактувати як `timed_out`; `timed_out` зарезервовано для запуску, який перевищив власний
час очікування runtime.

## Схвалення та запитання

Схвалення мають бути об’єктами першого класу, тому що агенти для кодування постійно
перетинають межі безпеки.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Події схвалення мають містити:

- id схвалення
- id запуску та id сесії
- тип запиту
- короткий опис запитаної дії
- назву інструмента або дію середовища
- рівень ризику
- доступні рішення
- закінчення строку дії
- чи можна повторно використати рішення

Запитання відокремлені від схвалень. Запитання просить у користувача або застосунку-хоста
інформацію. Схвалення просить дозвіл виконати дію.

## Модель ToolSpace

Застосункам потрібно розуміти поверхню інструментів без імпортування внутрішніх деталей plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK має надавати:

- нормалізовані метадані інструментів
- джерело: OpenClaw, MCP, plugin, channel, runtime або app
- зведення схеми
- політику схвалення
- сумісність runtime
- чи є інструмент прихованим, тільки для читання, здатним до запису або здатним працювати з хостом

Виклик інструментів через SDK має бути явним і обмеженим за областю. Більшість застосунків
мають запускати агентів, а не напряму викликати довільні інструменти.

## Модель артефактів

Артефакти мають охоплювати більше, ніж файли.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Поширені приклади:

- редагування файлів і згенеровані файли
- пакети patch
- diff VCS
- знімки екрана та медіавиводи
- журнали та пакети трасування
- посилання на pull request
- траєкторії runtime
- знімки робочих просторів керованих середовищ

Доступ до артефактів має підтримувати редагування чутливих даних, утримання та URL для завантаження
без припущення, що кожен артефакт є звичайним локальним файлом.

## Модель безпеки

SDK для застосунків має явно визначати повноваження.

Рекомендовані області дії токенів:

| Область             | Дозволяє                                             |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | Перелічувати та переглядати агентів.                 |
| `agent.run`         | Починати запуски.                                    |
| `session.read`      | Читати метадані та повідомлення сесії.               |
| `session.write`     | Створювати сесії, надсилати до них, форкати, ущільнювати та переривати їх. |
| `task.read`         | Читати стан фонового завдання.                       |
| `task.write`        | Скасовувати або змінювати політику сповіщень завдання. |
| `approval.respond`  | Схвалювати або відхиляти запити.                     |
| `tools.invoke`      | Напряму викликати відкриті інструменти.              |
| `artifacts.read`    | Перелічувати та завантажувати артефакти.             |
| `environment.write` | Створювати або знищувати керовані середовища.        |
| `admin`             | Адміністративні операції.                            |

Типові значення:

- без пересилання секретів за замовчуванням
- без необмеженого передавання змінних середовища
- посилання на секрети замість значень секретів
- явна політика sandbox і мережі
- явне утримання віддаленого середовища
- схвалення для виконання на хості, якщо політика не доводить інше
- raw-події runtime редагуються перед виходом із Gateway, якщо викликач не має
  сильнішої діагностичної області дії

## Постачальник керованих середовищ

Керовані агенти мають бути реалізовані як постачальники середовищ.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

Перша реалізація не обов’язково має бути hosted SaaS. Вона може націлюватися на
наявні Node-хости, ефемерні робочі простори, CI-подібні runner-и або середовища
на кшталт Testbox. Важливий контракт такий:

1. підготувати робочий простір
2. прив’язати безпечне середовище та секрети
3. почати запуск
4. транслювати події
5. зібрати артефакти
6. очистити або утримати згідно з політикою

Коли це стане стабільним, hosted cloud service зможе реалізувати той самий
контракт постачальника.

## Структура пакетів

Рекомендовані пакети:

| Пакет                   | Призначення                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Публічний високорівневий SDK і згенерований низькорівневий клієнт Gateway. |
| `@openclaw/sdk-react`   | Необов’язкові React hooks для дашбордів і розробників застосунків. |
| `@openclaw/sdk-testing` | Тестові помічники та фальшивий сервер Gateway для інтеграцій застосунків. |

У репозиторії вже є `openclaw/plugin-sdk/*` для plugins. Тримайте цей простір імен
окремо, щоб не плутати авторів plugin із розробниками застосунків.

## Стратегія згенерованого клієнта

Низькорівневий клієнт має генеруватися з версійованих схем протоколу Gateway,
а потім обгортатися рукописними ергономічними класами.

Шарування:

1. Джерело істини для схеми Gateway.
2. Згенерований низькорівневий клієнт TypeScript.
3. Валідатори часу виконання для зовнішніх вхідних даних і корисних навантажень подій.
4. Високорівневі обгортки `OpenClaw`, `Agent`, `Session`, `Run`, `Task` і `Artifact`.
5. Приклади з cookbook та інтеграційні тести.

Переваги:

- розбіжності протоколу помітні
- тести можуть порівнювати згенеровані методи з експортами Gateway
- App SDK залишається незалежним від внутрішніх деталей Plugin SDK
- низькорівневі споживачі все одно мають повний доступ до протоколу
- високорівневі споживачі отримують невеликий продуктовий API

## Пов’язана документація

- [OpenClaw App SDK](/uk/concepts/openclaw-sdk)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
