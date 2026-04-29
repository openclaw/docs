---
read_when:
    - Ви реалізуєте запропонований публічний SDK застосунку OpenClaw
    - Вам потрібен чернетковий простір імен, подія, результат, артефакт, затвердження або контракт безпеки для SDK застосунку
    - Ви порівнюєте ресурси протоколу Gateway з високорівневою обгорткою OpenClaw SDK
summary: Еталонний дизайн запропонованого публічного API SDK застосунку OpenClaw, таксономії подій, артефактів, схвалень і структури пакета
title: Дизайн API OpenClaw SDK
x-i18n:
    generated_at: "2026-04-29T23:55:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4dd0123581f4ba8332b6af9c673467092082a16488a61b5cbeac1b33e9a5dd1
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Ця сторінка є докладним проєктом довідника API для запропонованого публічного
[OpenClaw SDK](/uk/concepts/openclaw-sdk). Вона навмисно відокремлена від
[plugin SDK](/uk/plugins/sdk-overview).

Публічний SDK застосунку має бути побудований у двох шарах:

1. Низькорівневий згенерований клієнт Gateway.
2. Високорівнева ергономічна обгортка з обʼєктами `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` та `Environment`.

## Проєктування простору імен

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

Високорівневі обгортки мають повертати обʼєкти, які роблять типові потоки зручними:

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

`id` є курсором відтворення. Споживачі мають мати змогу повторно підключитися через
`events({ after: id })` і отримати пропущені події, якщо це дозволяє термін зберігання.

Рекомендовані нормалізовані сімейства подій:

| Подія                 | Значення                                                   |
| --------------------- | ---------------------------------------------------------- |
| `run.created`         | Запуск прийнято.                                           |
| `run.queued`          | Запуск очікує на лінію сесії, runtime або середовище.      |
| `run.started`         | Runtime почав виконання.                                   |
| `run.completed`       | Запуск успішно завершився.                                 |
| `run.failed`          | Запуск завершився з помилкою.                              |
| `run.cancelled`       | Запуск було скасовано.                                     |
| `run.timed_out`       | Запуск перевищив свій тайм-аут.                            |
| `assistant.delta`     | Дельта тексту асистента.                                   |
| `assistant.message`   | Повне повідомлення асистента або заміна.                   |
| `thinking.delta`      | Дельта міркування або плану, коли політика дозволяє показ. |
| `tool.call.started`   | Виклик інструмента розпочався.                             |
| `tool.call.delta`     | Виклик інструмента передав прогрес або частковий вивід.    |
| `tool.call.completed` | Виклик інструмента успішно повернув результат.             |
| `tool.call.failed`    | Виклик інструмента завершився помилкою.                    |
| `approval.requested`  | Запуск або інструмент потребує схвалення.                  |
| `approval.resolved`   | Схвалення надано, відхилено, прострочено або скасовано.    |
| `question.requested`  | Runtime просить користувача або застосунок-хост надати дані. |
| `question.answered`   | Застосунок-хост надав відповідь.                           |
| `artifact.created`    | Доступний новий артефакт.                                  |
| `artifact.updated`    | Наявний артефакт змінено.                                  |
| `session.created`     | Сесію створено.                                            |
| `session.updated`     | Метадані сесії змінено.                                    |
| `session.compacted`   | Відбулася Compaction сесії.                                |
| `task.updated`        | Стан фонової задачі змінено.                               |
| `git.branch`          | Runtime спостеріг або змінив стан гілки.                   |
| `git.diff`            | Runtime створив або змінив diff.                           |
| `git.pr`              | Runtime відкрив, оновив або повʼязав pull request.         |

Нативні для runtime корисні навантаження мають бути доступні через `raw`, але застосунки не повинні
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
тому поточні запуски на основі життєвого циклу зазвичай повідомляють числа мілісекунд епохи,
тоді як адаптери все ще можуть повертати ISO-рядки. Багатий UI, трасування інструментів і
нативні для runtime деталі належать до подій та артефактів.

`accepted` є нетермінальним результатом очікування: це означає, що дедлайн очікування Gateway
минув до того, як запуск створив завершення життєвого циклу або помилку. Його не можна трактувати як
`timed_out`; `timed_out` зарезервовано для запуску, який перевищив власний тайм-аут runtime.

## Схвалення та запитання

Схвалення мають бути сутностями першого класу, тому що агенти кодування постійно перетинають межі безпеки.

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

Запитання відокремлені від схвалень. Запитання просить у користувача або застосунку-хоста інформацію. Схвалення просить дозволу виконати дію.

## Модель ToolSpace

Застосункам потрібно розуміти поверхню інструментів без імпорту внутрішніх частин Plugin.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK має надавати:

- нормалізовані метадані інструментів
- джерело: OpenClaw, MCP, Plugin, канал, runtime або застосунок
- підсумок схеми
- політику схвалення
- сумісність із runtime
- чи інструмент прихований, readonly, здатний до запису або здатний до хост-дій

Виклик інструментів через SDK має бути явним і обмеженим за областю. Більшість застосунків мають запускати агентів, а не викликати довільні інструменти напряму.

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
- diff VCS
- знімки екрана та медіавиводи
- журнали та пакети трасування
- посилання на pull request
- траєкторії runtime
- знімки робочих просторів керованих середовищ

Доступ до артефактів має підтримувати редагування чутливих даних, зберігання та URL для завантаження без
припущення, що кожен артефакт є звичайним локальним файлом.

## Модель безпеки

SDK застосунку має явно визначати повноваження.

Рекомендовані області токена:

| Область             | Дозволяє                                             |
| ------------------- | ---------------------------------------------------- |
| `agent.read`        | Перелічувати й переглядати агентів.                  |
| `agent.run`         | Запускати запуски.                                   |
| `session.read`      | Читати метадані та повідомлення сесій.               |
| `session.write`     | Створювати, надсилати до, форкати, compact і переривати сесії. |
| `task.read`         | Читати стан фонових задач.                           |
| `task.write`        | Скасовувати або змінювати політику сповіщень задач.  |
| `approval.respond`  | Схвалювати або відхиляти запити.                     |
| `tools.invoke`      | Викликати відкриті інструменти напряму.              |
| `artifacts.read`    | Перелічувати й завантажувати артефакти.              |
| `environment.write` | Створювати або знищувати керовані середовища.        |
| `admin`             | Адміністративні операції.                            |

Типові значення:

- без пересилання секретів за замовчуванням
- без необмеженого пропускання змінних середовища
- посилання на секрети замість значень секретів
- явна політика sandbox і мережі
- явне зберігання віддаленого середовища
- схвалення для виконання на хості, якщо політика не доводить інше
- необроблені події runtime редагуються для вилучення чутливих даних перед виходом із Gateway, якщо викликач не має
  сильнішої діагностичної області

## Провайдер керованого середовища

Керовані агенти мають реалізовуватися як провайдери середовищ.

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

Перша реалізація не обовʼязково має бути hosted SaaS. Вона може націлюватися на
наявні хости node, ефемерні робочі простори, runners у стилі CI або середовища
у стилі Testbox. Важливий контракт такий:

1. підготувати робочий простір
2. привʼязати безпечне середовище й секрети
3. запустити запуск
4. транслювати події
5. зібрати артефакти
6. очистити або зберегти згідно з політикою

Коли це стабілізується, hosted cloud service зможе реалізувати той самий контракт провайдера.

## Структура пакунків

Рекомендовані пакунки:

| Пакунок                 | Призначення                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Публічний високорівневий SDK і згенерований низькорівневий клієнт Gateway. |
| `@openclaw/sdk-react`   | Опціональні хуки React для dashboards і розробників застосунків. |
| `@openclaw/sdk-testing` | Тестові помічники та фальшивий сервер Gateway для інтеграцій застосунків. |

У репозиторії вже є `openclaw/plugin-sdk/*` для plugins. Тримайте цей простір імен
окремо, щоб не плутати авторів Plugin із розробниками застосунків.

## Стратегія згенерованого клієнта

Низькорівневий клієнт має генеруватися з версійованих схем протоколу Gateway,
а потім обгортатися рукописними ергономічними класами.

Шарування:

1. Джерело істини для схеми Gateway.
2. Згенерований низькорівневий клієнт TypeScript.
3. Валідатори часу виконання для зовнішніх вхідних даних і даних подій.
4. Високорівневі обгортки `OpenClaw`, `Agent`, `Session`, `Run`, `Task` і `Artifact`
   .
5. Практичні приклади та інтеграційні тести.

Переваги:

- дрейф протоколу помітний
- тести можуть порівнювати згенеровані методи з експортами Gateway
- SDK застосунку залишається незалежним від внутрішніх компонентів SDK Plugin
- низькорівневі споживачі все ще мають повний доступ до протоколу
- високорівневі споживачі отримують невеликий продуктовий API

## Пов’язані документи

- [Дизайн SDK OpenClaw](/uk/concepts/openclaw-sdk)
- [Довідник RPC Gateway](/uk/reference/rpc)
- [Цикл агента](/uk/concepts/agent-loop)
- [Середовища виконання агентів](/uk/concepts/agent-runtimes)
- [Фонові завдання](/uk/automation/tasks)
- [Агенти ACP](/uk/tools/acp-agents)
- [Огляд SDK Plugin](/uk/plugins/sdk-overview)
