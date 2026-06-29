---
read_when:
    - Вы хотите понять, как OpenClaw собирает контекст модели
    - Вы переключаетесь между устаревшим движком и движком Plugin
    - Вы создаете Plugin движка контекста
sidebarTitle: Context engine
summary: 'Механизм контекста: подключаемая сборка контекста, Compaction и жизненный цикл субагента'
title: Механизм контекста
x-i18n:
    generated_at: "2026-06-28T22:49:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 124b6daf52f3d58f756352e2e169697541a8b6e67aecaa5a219bed15bda801cd
    source_path: concepts/context-engine.md
    workflow: 16
---

**Движок контекста** управляет тем, как OpenClaw формирует контекст модели для каждого запуска: какие сообщения включать, как суммаризировать более старую историю и как управлять контекстом на границах субагентов.

OpenClaw поставляется со встроенным движком `legacy` и использует его по умолчанию - большинству пользователей не нужно это менять. Устанавливайте и выбирайте Plugin-движок только если вам нужно другое поведение сборки, Compaction или межсессионного восстановления контекста.

## Быстрый старт

<Steps>
  <Step title="Проверьте, какой движок активен">
    ```bash
    openclaw doctor
    # or inspect config directly:
    cat ~/.openclaw/openclaw.json | jq '.plugins.slots.contextEngine'
    ```
  </Step>
  <Step title="Установите Plugin-движок">
    Plugins движков контекста устанавливаются так же, как и любой другой Plugin OpenClaw.

    <Tabs>
      <Tab title="Из npm">
        ```bash
        openclaw plugins install @martian-engineering/lossless-claw
        ```
      </Tab>
      <Tab title="Из локального пути">
        ```bash
        openclaw plugins install -l ./my-context-engine
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Включите и выберите движок">
    ```json5
    // openclaw.json
    {
      plugins: {
        slots: {
          contextEngine: "lossless-claw", // must match the plugin's registered engine id
        },
        entries: {
          "lossless-claw": {
            enabled: true,
            // Plugin-specific config goes here (see the plugin's docs)
          },
        },
      },
    }
    ```

    Перезапустите Gateway после установки и настройки.

  </Step>
  <Step title="Вернитесь к legacy (необязательно)">
    Задайте для `contextEngine` значение `"legacy"` (или полностью удалите ключ - `"legacy"` используется по умолчанию).
  </Step>
</Steps>

## Как это работает

Каждый раз, когда OpenClaw запускает запрос к модели, движок контекста участвует в четырех точках жизненного цикла:

<AccordionGroup>
  <Accordion title="1. Прием">
    Вызывается, когда в сессию добавляется новое сообщение. Движок может сохранить или проиндексировать сообщение в собственном хранилище данных.
  </Accordion>
  <Accordion title="2. Сборка">
    Вызывается перед каждым запуском модели. Движок возвращает упорядоченный набор сообщений (и необязательный `systemPromptAddition`), который помещается в бюджет токенов.
  </Accordion>
  <Accordion title="3. Compaction">
    Вызывается, когда окно контекста заполнено или когда пользователь выполняет `/compact`. Движок суммаризирует более старую историю, чтобы освободить место.
  </Accordion>
  <Accordion title="4. После хода">
    Вызывается после завершения запуска. Движок может сохранить состояние, запустить фоновую Compaction или обновить индексы.
  </Accordion>
</AccordionGroup>

Для поставляемого в комплекте не-ACP Codex-харнесса OpenClaw применяет тот же жизненный цикл, проецируя собранный контекст в инструкции разработчика Codex и запрос текущего хода. Codex по-прежнему сам управляет своей нативной историей треда и нативным компактором.

### Жизненный цикл субагента (необязательно)

OpenClaw вызывает два необязательных хука жизненного цикла субагента:

<ParamField path="prepareSubagentSpawn" type="method">
  Подготовьте общее состояние контекста перед запуском дочернего выполнения. Хук получает ключи родительской/дочерней сессии, `contextMode` (`isolated` или `fork`), доступные идентификаторы/файлы транскрипта и необязательный TTL. Если он возвращает дескриптор отката, OpenClaw вызывает его, когда создание субагента завершается ошибкой после успешной подготовки. Нативные создания субагентов, которые запрашивают `lightContext` и разрешаются в `contextMode="isolated"`, намеренно пропускают этот хук, чтобы дочерний запуск начинался с облегченного начального контекста без управляемого движком контекста состояния перед созданием.
</ParamField>
<ParamField path="onSubagentEnded" type="method">
  Очистите ресурсы, когда сессия субагента завершается или удаляется при очистке.
</ParamField>

### Добавление к системному промпту

Метод `assemble` может вернуть строку `systemPromptAddition`. OpenClaw добавляет ее в начало системного промпта для запуска. Это позволяет движкам внедрять динамические указания по восстановлению контекста, инструкции извлечения или контекстно-зависимые подсказки без необходимости в статических файлах рабочей области.

## Движок legacy

Встроенный движок `legacy` сохраняет исходное поведение OpenClaw:

- **Прием**: без операции (менеджер сессий напрямую обрабатывает сохранение сообщений).
- **Сборка**: сквозной режим (существующий конвейер sanitize → validate → limit в runtime обрабатывает сборку контекста).
- **Compaction**: делегирует встроенной суммаризирующей Compaction, которая создает единую сводку старых сообщений и сохраняет последние сообщения без изменений.
- **После хода**: без операции.

Движок legacy не регистрирует инструменты и не предоставляет `systemPromptAddition`.

Когда `plugins.slots.contextEngine` не задан (или задан как `"legacy"`), этот движок используется автоматически.

## Plugin-движки

Plugin может зарегистрировать движок контекста с помощью Plugin API:

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function register(api) {
  api.registerContextEngine("my-engine", (ctx) => ({
    info: {
      id: "my-engine",
      name: "My Context Engine",
      ownsCompaction: true,
    },

    async ingest({ sessionId, message, isHeartbeat }) {
      // Store the message in your data store
      return { ingested: true };
    },

    async assemble({ sessionId, messages, tokenBudget, availableTools, citationsMode }) {
      // Return messages that fit the budget
      return {
        messages: buildContext(messages, tokenBudget),
        estimatedTokens: countTokens(messages),
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },

    async compact({ sessionId, force }) {
      // Summarize older context
      return { ok: true, compacted: true };
    },
  }));
}
```

Фабрика `ctx` включает необязательные значения `config`, `agentDir` и `workspaceDir`, чтобы Plugins могли инициализировать состояние для агента или рабочей области до запуска первого хука жизненного цикла.

Затем включите его в конфигурации:

```json5
{
  plugins: {
    slots: {
      contextEngine: "my-engine",
    },
    entries: {
      "my-engine": {
        enabled: true,
      },
    },
  },
}
```

### Интерфейс ContextEngine

Обязательные члены:

| Член               | Тип      | Назначение                                             |
| ------------------ | -------- | ------------------------------------------------------ |
| `info`             | Свойство | Идентификатор движка, имя, версия и владеет ли он Compaction |
| `ingest(params)`   | Метод    | Сохранить одно сообщение                               |
| `assemble(params)` | Метод    | Собрать контекст для запуска модели (возвращает `AssembleResult`) |
| `compact(params)`  | Метод    | Суммаризировать/сократить контекст                     |

`assemble` возвращает `AssembleResult` с:

<ParamField path="messages" type="Message[]" required>
  Упорядоченные сообщения для отправки модели.
</ParamField>
<ParamField path="estimatedTokens" type="number" required>
  Оценка движком общего числа токенов в собранном контексте. OpenClaw использует ее для решений о пороге Compaction и диагностических отчетов.
</ParamField>
<ParamField path="systemPromptAddition" type="string">
  Добавляется в начало системного промпта.
</ParamField>
<ParamField path="promptAuthority" type='"assembled" | "preassembly_may_overflow"'>
  Управляет тем, какую оценку токенов runner использует для предварительных проверок переполнения. По умолчанию используется `"assembled"`, что означает проверку только оценки собранного промпта - это подходит для движков, которые возвращают оконный, самодостаточный контекст. Устанавливайте `"preassembly_may_overflow"` только когда собранное представление может скрывать риск переполнения в базовом транскрипте; тогда runner берет максимум из собранной оценки и оценки истории сессии до сборки (без оконного ограничения), когда решает, нужно ли заранее выполнить Compaction. В любом случае модель видит именно те сообщения, которые вы возвращаете, - `promptAuthority` влияет только на предварительную проверку.
</ParamField>

`compact` возвращает `CompactResult`. Когда Compaction ротирует активный транскрипт, `result.sessionId` и `result.sessionFile` идентифицируют следующую сессию, которую должен использовать следующий повтор или ход.

Необязательные члены:

| Член                           | Тип   | Назначение                                                                                                    |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------- |
| `bootstrap(params)`            | Метод | Инициализировать состояние движка для сессии. Вызывается один раз, когда движок впервые видит сессию (например, импорт истории). |
| `ingestBatch(params)`          | Метод | Принять завершенный ход пакетом. Вызывается после завершения запуска, со всеми сообщениями из этого хода сразу. |
| `afterTurn(params)`            | Метод | Работа жизненного цикла после запуска (сохранить состояние, запустить фоновую Compaction).                    |
| `prepareSubagentSpawn(params)` | Метод | Настроить общее состояние для дочерней сессии до ее запуска.                                                  |
| `onSubagentEnded(params)`      | Метод | Очистить ресурсы после завершения субагента.                                                                  |
| `dispose()`                    | Метод | Освободить ресурсы. Вызывается при завершении работы Gateway или перезагрузке Plugin - не для каждой сессии.  |

### Настройки runtime

Хуки жизненного цикла, которые выполняются внутри OpenClaw, получают необязательный объект `runtimeSettings`. Это версионированная, доступная только для чтения внутренняя поверхность API producer/consumer: OpenClaw создает ее для выбранного движка контекста, а движок контекста потребляет ее внутри хуков жизненного цикла. Она не отображается напрямую пользователям и не создает отдельную поверхность отчетности.

- `schemaVersion`: сейчас `1`
- `runtime`: хост OpenClaw, режим runtime (`normal`, `fallback` или `degraded`) и необязательные идентификаторы харнесса/runtime
- `contextEngineSelection`: идентификатор выбранного движка контекста и источник выбора
- `executionHost`: идентификатор хоста и метка поверхности, вызывающей хук
- `model`: запрошенная модель, разрешенная модель, провайдер и необязательное семейство моделей
- `limits`: бюджет токенов промпта и максимальное число выходных токенов, если известно
- `diagnostics`: закрытые коды причин fallback и degraded, если известны

Поля, которые могут быть неизвестны, представлены как `null`; поля-дискриминаторы, такие как режим runtime и источник выбора, остаются не-nullable. Старые движки остаются совместимыми: если строгий устаревший движок отклоняет `runtimeSettings` как неизвестное свойство, OpenClaw повторяет вызов жизненного цикла без него, а не помещает движок в карантин.

### Требования к хосту

Движки контекста могут объявлять требования к возможностям хоста в `info.hostRequirements`. OpenClaw проверяет эти требования перед запуском операции и закрыто завершает ее с понятной ошибкой, когда выбранный runtime не может им соответствовать.

Для запусков агента объявляйте `assemble-before-prompt`, когда движок должен управлять фактическим промптом модели через `assemble()`:

```ts
info: {
  id: "my-context-engine",
  name: "My Context Engine",
  hostRequirements: {
    "agent-run": {
      requiredCapabilities: ["assemble-before-prompt"],
      unsupportedMessage:
        "Use the native Codex or OpenClaw embedded runtime, or select the legacy context engine.",
    },
  },
}
```

Нативные запуски агента Codex и встроенного агента OpenClaw удовлетворяют `assemble-before-prompt`. Универсальные CLI-бэкенды - нет, поэтому движки, которым это требуется, отклоняются до запуска CLI-процесса.

### Изоляция сбоев

OpenClaw изолирует выбранный Plugin-движок от основного пути ответа. Если движок не legacy отсутствует, не проходит проверку контракта, выбрасывает исключение при создании фабрики или выбрасывает исключение из метода жизненного цикла, OpenClaw помещает этот движок в карантин для текущего процесса Gateway и понижает работу движка контекста до встроенного движка `legacy`. Ошибка записывается в журнал вместе с неудачной операцией, чтобы оператор мог исправить, обновить или отключить Plugin без того, чтобы агент перестал отвечать.

Ошибки требований хоста отличаются: когда движок объявляет, что среда выполнения
не имеет необходимой возможности, OpenClaw завершает выполнение с отказом до запуска прогона. Это
защищает движки, которые повредили бы состояние при запуске в неподдерживаемом хосте.

### ownsCompaction

`ownsCompaction` управляет тем, остается ли встроенная в среду выполнения OpenClaw автоматическая Compaction внутри попытки включенной для прогона:

<AccordionGroup>
  <Accordion title="ownsCompaction: true">
    Движок владеет поведением Compaction. OpenClaw отключает встроенную в среду выполнения OpenClaw автоматическую Compaction для этого прогона, а реализация `compact()` в движке отвечает за `/compact`, восстановительную Compaction при переполнении и любую упреждающую Compaction, которую он хочет выполнить в `afterTurn()`. OpenClaw все еще может запускать предохранитель переполнения перед prompt; когда он прогнозирует, что полный transcript переполнится, путь восстановления вызывает `compact()` активного движка перед отправкой еще одного prompt.
  </Accordion>
  <Accordion title="ownsCompaction: false or unset">
    Встроенная в среду выполнения OpenClaw автоматическая Compaction все еще может выполняться во время выполнения prompt, но метод `compact()` активного движка все равно вызывается для `/compact` и восстановления при переполнении.
  </Accordion>
</AccordionGroup>

<Warning>
`ownsCompaction: false` **не** означает, что OpenClaw автоматически откатывается к пути Compaction устаревшего движка.
</Warning>

Это означает, что есть два допустимых шаблона Plugin:

<Tabs>
  <Tab title="Owning mode">
    Реализуйте собственный алгоритм Compaction и задайте `ownsCompaction: true`.
  </Tab>
  <Tab title="Delegating mode">
    Задайте `ownsCompaction: false` и сделайте так, чтобы `compact()` вызывал `delegateCompactionToRuntime(...)` из `openclaw/plugin-sdk/core` для использования встроенного поведения Compaction OpenClaw.
  </Tab>
</Tabs>

Пустой `compact()` небезопасен для активного движка без владения, потому что он отключает обычный путь `/compact` и восстановительной Compaction при переполнении для этого слота движка.

## Справочник по конфигурации

```json5
{
  plugins: {
    slots: {
      // Select the active context engine. Default: "legacy".
      // Set to a plugin id to use a plugin engine.
      contextEngine: "legacy",
    },
  },
}
```

<Note>
Слот является эксклюзивным во время выполнения - для заданного прогона или операции Compaction разрешается только один зарегистрированный контекстный движок. Другие включенные Plugin с `kind: "context-engine"` все еще могут загружаться и выполнять свой код регистрации; `plugins.slots.contextEngine` только выбирает, какой зарегистрированный идентификатор движка OpenClaw разрешает, когда ему нужен контекстный движок.
</Note>

<Note>
**Удаление Plugin:** когда вы удаляете Plugin, который сейчас выбран как `plugins.slots.contextEngine`, OpenClaw сбрасывает слот обратно к значению по умолчанию (`legacy`). Такое же поведение сброса применяется к `plugins.slots.memory`. Ручное редактирование конфигурации не требуется.
</Note>

## Связь с Compaction и памятью

<AccordionGroup>
  <Accordion title="Compaction">
    Compaction — одна из обязанностей контекстного движка. Устаревший движок делегирует встроенному в OpenClaw суммированию. Движки Plugin могут реализовать любую стратегию Compaction (сводки DAG, векторный поиск и т. д.).
  </Accordion>
  <Accordion title="Memory plugins">
    Plugin памяти (`plugins.slots.memory`) отделены от контекстных движков. Plugin памяти предоставляют поиск/извлечение; контекстные движки управляют тем, что видит модель. Они могут работать вместе - контекстный движок может использовать данные Plugin памяти во время сборки. Движкам Plugin, которым нужен активный путь memory prompt, следует предпочитать `buildMemorySystemPromptAddition(...)` из `openclaw/plugin-sdk/core`, который преобразует активные разделы memory prompt в готовый для добавления в начало `systemPromptAddition`. Если движку нужен более низкоуровневый контроль, он все еще может получать сырые строки из `openclaw/plugin-sdk/memory-host-core` через `buildActiveMemoryPromptSection(...)`.
  </Accordion>
  <Accordion title="Session pruning">
    Обрезка старых результатов инструментов в памяти все равно выполняется независимо от того, какой контекстный движок активен.
  </Accordion>
</AccordionGroup>

## Советы

- Используйте `openclaw doctor`, чтобы проверить, что ваш движок загружается корректно.
- При переключении движков существующие сессии продолжают работу со своей текущей историей. Новый движок берет на себя будущие прогоны.
- Ошибки движка записываются в журнал, а выбранный движок Plugin помещается в карантин для текущего процесса Gateway. OpenClaw откатывается к `legacy` для пользовательских turns, чтобы ответы могли продолжаться, но вам все равно следует исправить, обновить, отключить или удалить неисправный Plugin.
- Для разработки используйте `openclaw plugins install -l ./my-engine`, чтобы связать локальный каталог Plugin без копирования.

## Связанные материалы

- [Compaction](/ru/concepts/compaction) - суммирование длинных бесед
- [Контекст](/ru/concepts/context) - как строится контекст для agent turns
- [Архитектура Plugin](/ru/plugins/architecture) - регистрация Plugin контекстного движка
- [Манифест Plugin](/ru/plugins/manifest) - поля манифеста Plugin
- [Plugins](/ru/tools/plugin) - обзор Plugin
