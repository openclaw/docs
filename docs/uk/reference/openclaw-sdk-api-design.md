---
read_when:
    - Ви реалізуєте запропонований публічний SDK застосунку OpenClaw
    - Вам потрібен чернетковий контракт простору імен, події, результату, артефакту, затвердження або безпеки для SDK застосунку
    - Ви порівнюєте ресурси протоколу Gateway із високорівневою обгорткою OpenClaw App SDK
sidebarTitle: App SDK API design
summary: Референсний дизайн для публічного API OpenClaw App SDK, таксономії подій, артефактів, схвалень і структури пакета
title: Проєктування API SDK застосунку OpenClaw
x-i18n:
    generated_at: "2026-05-06T05:01:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ця сторінка є детальним проєктом довідника API для публічного
[OpenClaw App SDK](/uk/concepts/openclaw-sdk). Вона навмисно відокремлена від
[Plugin SDK](/uk/plugins/sdk-overview).

<Note>
  `@openclaw/sdk` — це зовнішній пакет застосунку/клієнта для взаємодії з
  Gateway. `openclaw/plugin-sdk/*` — це внутрішньопроцесний контракт для створення Plugin.
  Не імпортуйте підшляхи Plugin SDK із застосунків, яким потрібно лише запускати агентів.
</Note>

Публічний SDK застосунків має бути побудований у два шари:

1. Низькорівневий згенерований клієнт Gateway.
2. Високорівнева ергономічна обгортка з об'єктами `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` та `Environment`.

## Дизайн просторів імен

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

Високорівневі обгортки мають повертати об'єкти, які роблять типові сценарії зручними:

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

Публічний SDK має надавати версійовані, відтворювані й нормалізовані події.

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

`id` — це курсор відтворення. Споживачі мають мати змогу повторно підключатися через
`events({ after: id })` і отримувати пропущені події, коли це дозволяє термін зберігання.

Рекомендовані сімейства нормалізованих подій:

| Подія                 | Значення                                                     |
| --------------------- | ------------------------------------------------------------ |
| `run.created`         | Запуск прийнято.                                             |
| `run.queued`          | Запуск очікує смугу сесії, середовище виконання або середовище. |
| `run.started`         | Середовище виконання почало виконання.                       |
| `run.completed`       | Запуск успішно завершено.                                    |
| `run.failed`          | Запуск завершився помилкою.                                  |
| `run.cancelled`       | Запуск було скасовано.                                       |
| `run.timed_out`       | Запуск перевищив свій ліміт часу.                            |
| `assistant.delta`     | Дельта тексту асистента.                                     |
| `assistant.message`   | Повне повідомлення асистента або заміна.                     |
| `thinking.delta`      | Дельта міркування або плану, коли політика дозволяє розкриття. |
| `tool.call.started`   | Виклик інструмента почався.                                  |
| `tool.call.delta`     | Виклик інструмента передав прогрес або частковий результат.  |
| `tool.call.completed` | Виклик інструмента успішно повернув результат.               |
| `tool.call.failed`    | Виклик інструмента завершився невдало.                       |
| `approval.requested`  | Запуск або інструмент потребує схвалення.                    |
| `approval.resolved`   | Схвалення було надано, відхилено, прострочено або скасовано. |
| `question.requested`  | Середовище виконання просить введення від користувача або хост-застосунку. |
| `question.answered`   | Хост-застосунок надав відповідь.                             |
| `artifact.created`    | Доступний новий артефакт.                                    |
| `artifact.updated`    | Наявний артефакт змінено.                                    |
| `session.created`     | Сесію створено.                                              |
| `session.updated`     | Метадані сесії змінено.                                      |
| `session.compacted`   | Відбулася Compaction сесії.                                  |
| `task.updated`        | Стан фонового завдання змінено.                              |
| `git.branch`          | Середовище виконання спостерігло або змінило стан гілки.     |
| `git.diff`            | Середовище виконання створило або змінило diff.              |
| `git.pr`              | Середовище виконання відкрило, оновило або зв'язало pull request. |

Нативні для середовища виконання корисні навантаження мають бути доступні через `raw`, але застосунки не повинні
розбирати `raw` для звичайного UI.

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
тому поточні запуски, підтримані життєвим циклом, зазвичай повідомляють числа мілісекунд епохи,
тоді як адаптери все ще можуть повертати рядки ISO. Багатий UI, трасування інструментів і
нативні для середовища виконання деталі належать подіям і артефактам.

`accepted` — це нетермінальний результат очікування: він означає, що крайній термін очікування Gateway
минув до того, як запуск створив завершення життєвого циклу або помилку. Його не можна трактувати як
`timed_out`; `timed_out` зарезервовано для запуску, що перевищив власний ліміт часу виконання.

## Схвалення та запитання

Схвалення мають бути першокласними, бо агенти для кодування постійно перетинають межі безпеки.

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
- підсумок запитуваної дії
- назву інструмента або дію середовища
- рівень ризику
- доступні рішення
- строк дії
- чи можна повторно використати рішення

Запитання відокремлені від схвалень. Запитання просить у користувача або хост-застосунку
інформацію. Схвалення просить дозвіл виконати дію.

## Модель ToolSpace

Застосункам потрібно розуміти поверхню інструментів без імпорту внутрішніх деталей Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK має надавати:

- нормалізовані метадані інструментів
- джерело: OpenClaw, MCP, Plugin, канал, середовище виконання або застосунок
- підсумок схеми
- політику схвалення
- сумісність із середовищем виконання
- чи є інструмент прихованим, доступним лише для читання, здатним до запису або здатним працювати з хостом

Виклик інструментів через SDK має бути явним і обмеженим областю. Більшість застосунків мають
запускати агентів, а не викликати довільні інструменти напряму.

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

Типові приклади:

- редагування файлів і згенеровані файли
- пакети patch
- diff системи керування версіями
- знімки екрана та медіавиводи
- журнали й пакети трасування
- посилання на pull request
- траєкторії середовища виконання
- знімки робочих просторів керованих середовищ

Доступ до артефактів має підтримувати редагування, зберігання та URL для завантаження без
припущення, що кожен артефакт є звичайним локальним файлом.

## Модель безпеки

SDK застосунків має бути явним щодо повноважень.

Рекомендовані області токенів:

| Область             | Дозволяє                                             |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | Перелічувати та інспектувати агентів.                |
| `agent.run`         | Запускати запуски.                                   |
| `session.read`      | Читати метадані й повідомлення сесій.                |
| `session.write`     | Створювати, надсилати в, форкати, ущільнювати та переривати сесії. |
| `task.read`         | Читати стан фонового завдання.                       |
| `task.write`        | Скасовувати або змінювати політику сповіщень завдання. |
| `approval.respond`  | Схвалювати або відхиляти запити.                     |
| `tools.invoke`      | Напряму викликати відкриті інструменти.              |
| `artifacts.read`    | Перелічувати та завантажувати артефакти.             |
| `environment.write` | Створювати або знищувати керовані середовища.        |
| `admin`             | Адміністративні операції.                            |

Типові налаштування:

- без передавання секретів за замовчуванням
- без необмеженого наскрізного передавання змінних середовища
- посилання на секрети замість значень секретів
- явна політика sandbox і мережі
- явне зберігання віддаленого середовища
- схвалення для виконання на хості, якщо політика не доводить інше
- сирі події середовища виконання редагуються до виходу з Gateway, якщо викликач не має
  сильнішої діагностичної області

## Постачальник керованого середовища

Керовані агенти мають бути реалізовані як постачальники середовища.

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

Перша реалізація не обов'язково має бути хостинговим SaaS. Вона може орієнтуватися на
наявні Node-хости, ефемерні робочі простори, ранери у стилі CI або середовища у стилі
Testbox. Важливий контракт такий:

1. підготувати робочий простір
2. прив'язати безпечне середовище та секрети
3. почати запуск
4. транслювати події
5. зібрати артефакти
6. очистити або зберегти згідно з політикою

Коли це стане стабільним, хостинговий хмарний сервіс зможе реалізувати той самий
контракт постачальника.

## Структура пакетів

Рекомендовані пакети:

| Пакет                   | Призначення                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `@openclaw/sdk`         | Публічний високорівневий SDK і згенерований низькорівневий клієнт Gateway. |
| `@openclaw/sdk-react`   | Необов'язкові React-хуки для панелей керування та розробників застосунків. |
| `@openclaw/sdk-testing` | Тестові помічники та фальшивий сервер Gateway для інтеграцій застосунків. |

У репозиторії вже є `openclaw/plugin-sdk/*` для Plugin. Тримайте цей простір імен
окремо, щоб не плутати авторів Plugin із розробниками застосунків.

## Стратегія згенерованого клієнта

Низькорівневий клієнт має генеруватися з версійованих схем протоколу Gateway,
а потім обгортатися рукописними ергономічними класами.

Шарування:

1. Джерело істини для схеми Gateway.
2. Згенерований низькорівневий клієнт TypeScript.
3. Валідатори часу виконання для зовнішніх вхідних даних і корисних навантажень подій.
4. Високорівневі обгортки `OpenClaw`, `Agent`, `Session`, `Run`, `Task` і `Artifact`.
5. Приклади-рецепти та інтеграційні тести.

Переваги:

- розходження протоколу помітні
- тести можуть порівнювати згенеровані методи з експортами Gateway
- SDK застосунків залишається незалежним від внутрішніх компонентів Plugin SDK
- низькорівневі споживачі все ще мають повний доступ до протоколу
- високорівневі споживачі отримують невеликий продуктовий API

## Пов’язане

- [SDK застосунків OpenClaw](/uk/concepts/openclaw-sdk)
- [Довідник Gateway RPC](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд Plugin SDK](/uk/plugins/sdk-overview)
