---
read_when:
    - Ви впроваджуєте запропонований публічний SDK застосунку OpenClaw
    - Вам потрібен чернетковий контракт простору імен, події, результату, артефакту, затвердження або безпеки для SDK застосунку
    - Ви порівнюєте ресурси протоколу Gateway з високорівневою обгорткою OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Еталонний дизайн для публічного OpenClaw App SDK API, таксономії подій, артефактів, затверджень і структури пакета
title: Проєктування API SDK застосунків OpenClaw
x-i18n:
    generated_at: "2026-04-30T00:49:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ця сторінка є докладним проєктом довідника API для публічного
[OpenClaw App SDK](/uk/concepts/openclaw-sdk). Вона навмисно відокремлена від
[Plugin SDK](/uk/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` — це зовнішній пакет застосунку/клієнта для взаємодії з
  Gateway. `openclaw/plugin-sdk/*` — це внутрішньопроцесний контракт для створення Plugin.
  Не імпортуйте підшляхи Plugin SDK із застосунків, яким потрібно лише запускати агентів.
</Note>

Публічний SDK застосунку має бути побудований у два шари:

1. Низькорівневий згенерований клієнт Gateway.
2. Високорівнева ергономічна обгортка з об’єктами `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` і `Environment`.

## Проєкт простору імен

Низькорівневі простори імен мають точно відповідати ресурсам Gateway:

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
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Високорівневі обгортки мають повертати об’єкти, які роблять поширені потоки зручними:

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

Публічний SDK має надавати версійовані, відтворювані, нормалізовані події.

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

`id` — це курсор відтворення. Споживачі мають мати змогу повторно підключитися з
`events({ after: id })` і отримати пропущені події, якщо це дозволяє утримання.

Рекомендовані сімейства нормалізованих подій:

| Подія                 | Значення                                                    |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Запуск прийнято.                                            |
| `run.queued`          | Запуск очікує смуги сеансу, середовища виконання або оточення. |
| `run.started`         | Середовище виконання почало виконання.                      |
| `run.completed`       | Запуск успішно завершено.                                   |
| `run.failed`          | Запуск завершився з помилкою.                               |
| `run.cancelled`       | Запуск скасовано.                                           |
| `run.timed_out`       | Запуск перевищив свій тайм-аут.                             |
| `assistant.delta`     | Дельта тексту асистента.                                    |
| `assistant.message`   | Повне повідомлення асистента або заміна.                    |
| `thinking.delta`      | Дельта міркування або плану, коли політика дозволяє показ.  |
| `tool.call.started`   | Виклик інструмента розпочато.                               |
| `tool.call.delta`     | Виклик інструмента передав прогрес або частковий результат. |
| `tool.call.completed` | Виклик інструмента успішно повернув результат.              |
| `tool.call.failed`    | Виклик інструмента завершився невдало.                      |
| `approval.requested`  | Запуск або інструмент потребує схвалення.                   |
| `approval.resolved`   | Схвалення надано, відхилено, прострочено або скасовано.     |
| `question.requested`  | Середовище виконання запитує ввід у користувача або хост-застосунку. |
| `question.answered`   | Хост-застосунок надав відповідь.                            |
| `artifact.created`    | Доступний новий артефакт.                                   |
| `artifact.updated`    | Наявний артефакт змінено.                                   |
| `session.created`     | Сеанс створено.                                             |
| `session.updated`     | Метадані сеансу змінено.                                    |
| `session.compacted`   | Відбулася Compaction сеансу.                                |
| `task.updated`        | Стан фонового завдання змінено.                             |
| `git.branch`          | Середовище виконання виявило або змінило стан гілки.        |
| `git.diff`            | Середовище виконання створило або змінило diff.             |
| `git.pr`              | Середовище виконання відкрило, оновило або пов’язало pull request. |

Власні корисні навантаження середовища виконання мають бути доступні через `raw`, але застосунки не повинні
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

Результат має бути простим і стабільним. Значення часових міток зберігають форму Gateway,
тому поточні запуски на основі життєвого циклу зазвичай повідомляють числа мілісекунд епохи,
тоді як адаптери все ще можуть показувати рядки ISO. Багатий UI, траси інструментів і
власні деталі середовища виконання належать до подій та артефактів.

`accepted` — це нетермінальний результат очікування: він означає, що крайній термін очікування Gateway
минув до того, як запуск створив завершення життєвого циклу або помилку. Його не можна трактувати як
`timed_out`; `timed_out` зарезервовано для запуску, який перевищив власний тайм-аут
середовища виконання.

## Схвалення та запитання

Схвалення мають бути першокласними, оскільки агенти коду постійно перетинають межі безпеки.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Події схвалення мають містити:

- ідентифікатор схвалення
- ідентифікатор запуску та ідентифікатор сеансу
- тип запиту
- зведення запитаної дії
- назву інструмента або дію середовища
- рівень ризику
- доступні рішення
- строк дії
- чи можна повторно використати рішення

Запитання відокремлені від схвалень. Запитання просить у користувача або хост-застосунку
інформацію. Схвалення просить дозвіл виконати дію.

## Модель ToolSpace

Застосункам потрібно розуміти поверхню інструментів без імпорту внутрішніх частин Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK має надавати:

- нормалізовані метадані інструмента
- джерело: OpenClaw, MCP, Plugin, канал, середовище виконання або застосунок
- зведення схеми
- політику схвалення
- сумісність із середовищем виконання
- чи є інструмент прихованим, лише для читання, здатним до запису або здатним працювати з хостом

Виклик інструмента через SDK має бути явним і обмеженим за областю. Більшість застосунків мають
запускати агентів, а не напряму викликати довільні інструменти.

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
- пакети патчів
- diff VCS
- знімки екрана та медіавиводи
- журнали та пакети трас
- посилання на pull request
- траєкторії середовища виконання
- знімки робочого простору керованого середовища

Доступ до артефактів має підтримувати редагування чутливих даних, утримання та URL-адреси для завантаження без
припущення, що кожен артефакт є звичайним локальним файлом.

## Модель безпеки

SDK застосунку має явно описувати повноваження.

Рекомендовані області токенів:

| Область             | Дозволяє                                             |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | Перелічувати та переглядати агентів.                 |
| `agent.run`         | Запускати виконання.                                 |
| `session.read`      | Читати метадані та повідомлення сеансу.              |
| `session.write`     | Створювати, надсилати до, форкати, compact і переривати сеанси. |
| `task.read`         | Читати стан фонового завдання.                       |
| `task.write`        | Скасовувати або змінювати політику сповіщень завдань. |
| `approval.respond`  | Схвалювати або відхиляти запити.                     |
| `tools.invoke`      | Напряму викликати відкриті інструменти.              |
| `artifacts.read`    | Перелічувати та завантажувати артефакти.             |
| `environment.write` | Створювати або знищувати керовані середовища.        |
| `admin`             | Адміністративні операції.                            |

Типові значення:

- без пересилання секретів за замовчуванням
- без необмеженого наскрізного передавання змінних середовища
- посилання на секрети замість значень секретів
- явна політика пісочниці та мережі
- явне утримання віддаленого середовища
- схвалення для виконання на хості, якщо політика не доводить протилежне
- сирі події середовища виконання редагуються до того, як залишають Gateway, якщо викликач не має
  сильнішої діагностичної області

## Постачальник керованого середовища

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

Перша реалізація не обов’язково має бути розміщеним SaaS. Вона може бути націлена на
наявні хости Node, ефемерні робочі простори, runner-и у стилі CI або середовища у стилі Testbox.
Важливий контракт такий:

1. підготувати робочий простір
2. прив’язати безпечне середовище та секрети
3. запустити виконання
4. транслювати події
5. зібрати артефакти
6. очистити або утримати відповідно до політики

Коли це стане стабільним, розміщений хмарний сервіс зможе реалізувати той самий контракт
постачальника.

## Структура пакетів

Рекомендовані пакети:

| Пакет                   | Призначення                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `@openclaw/sdk`         | Публічний високорівневий SDK і згенерований низькорівневий клієнт Gateway. |
| `@openclaw/sdk-react`   | Необов’язкові React-хуки для панелей керування та розробників застосунків. |
| `@openclaw/sdk-testing` | Тестові помічники та фальшивий сервер Gateway для інтеграцій застосунків. |

У репозиторії вже є `openclaw/plugin-sdk/*` для Plugin. Тримайте цей простір імен
окремо, щоб не плутати авторів Plugin із розробниками застосунків.

## Стратегія згенерованого клієнта

Низькорівневий клієнт має генеруватися з версійованих схем протоколу Gateway, а потім обгортатися написаними вручну зручними класами.

Шари:

1. Схеми Gateway як джерело істини.
2. Згенерований низькорівневий TypeScript-клієнт.
3. Валідатори часу виконання для зовнішніх вхідних даних і корисного навантаження подій.
4. Високорівневі обгортки `OpenClaw`, `Agent`, `Session`, `Run`, `Task` і `Artifact`.
5. Приклади рецептів і інтеграційні тести.

Переваги:

- розбіжність протоколу помітна
- тести можуть порівнювати згенеровані методи з експортами Gateway
- SDK застосунку залишається незалежним від внутрішніх деталей Plugin SDK
- низькорівневі споживачі все ще мають повний доступ до протоколу
- високорівневі споживачі отримують невеликий продуктовий API

## Пов’язана документація

- [SDK застосунку OpenClaw](/uk/concepts/openclaw-sdk)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
