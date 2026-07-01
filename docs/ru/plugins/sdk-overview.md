---
read_when:
    - Вам нужно знать, из какого подпути SDK выполнять импорт
    - Вам нужна справка по всем методам регистрации в OpenClawPluginApi
    - Вы ищете конкретный экспорт SDK
sidebarTitle: Plugin SDK overview
summary: Схема импорта, справочник API регистрации и архитектура SDK
title: Обзор Plugin SDK
x-i18n:
    generated_at: "2026-07-01T18:17:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK плагинов — это типизированный контракт между плагинами и ядром. Эта страница является
справочником по **тому, что импортировать** и **тому, что можно регистрировать**.

<Note>
  Эта страница предназначена для авторов плагинов, использующих `openclaw/plugin-sdk/*` внутри
  OpenClaw. Для внешних приложений, скриптов, панелей мониторинга, задач CI и расширений IDE,
  которые хотят запускать агентов через Gateway, вместо этого используйте
  [интеграции Gateway для внешних приложений](/ru/gateway/external-apps).
</Note>

<Tip>
Ищете практическое руководство? Начните с [создания плагинов](/ru/plugins/building-plugins), используйте [канальные плагины](/ru/plugins/sdk-channel-plugins) для канальных плагинов, [плагины провайдеров](/ru/plugins/sdk-provider-plugins) для плагинов провайдеров, [плагины бэкендов CLI](/ru/plugins/cli-backend-plugins) для локальных AI-бэкендов CLI и [хуки плагинов](/ru/plugins/hooks) для плагинов хуков инструментов или жизненного цикла.
</Tip>

## Соглашение об импорте

Всегда импортируйте из конкретного подпути:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Каждый подпуть — это небольшой самодостаточный модуль. Это ускоряет запуск и
предотвращает проблемы с циклическими зависимостями. Для специфичных для каналов помощников входа/сборки
предпочитайте `openclaw/plugin-sdk/channel-core`; оставляйте `openclaw/plugin-sdk/core` для
более широкой зонтичной поверхности и общих помощников, таких как
`buildChannelConfigSchema`.

Для конфигурации канала публикуйте принадлежащую каналу JSON Schema через
`openclaw.plugin.json#channelConfigs`. Подпуть `plugin-sdk/channel-config-schema`
предназначен для общих примитивов схем и универсального сборщика. Встроенные
плагины OpenClaw используют `plugin-sdk/bundled-channel-config-schema` для сохраненных
схем встроенных каналов. Устаревшие совместимые экспорты остаются в
`plugin-sdk/channel-config-schema-legacy`; ни один подпуть схем встроенных каналов не является
шаблоном для новых плагинов.

<Warning>
  Не импортируйте удобные поверхности с брендингом провайдера или канала (например
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Встроенные плагины составляют универсальные подпути SDK внутри собственных баррелей `api.ts` /
  `runtime-api.ts`; потребители ядра должны либо использовать эти локальные для плагина
  баррели, либо добавлять узкий универсальный контракт SDK, когда потребность действительно
  является межканальной.

Небольшой набор вспомогательных поверхностей встроенных плагинов все еще появляется в сгенерированной карте экспортов,
когда у них есть отслеживаемое использование владельцем. Они существуют только для обслуживания встроенных плагинов
и не рекомендуются как пути импорта для новых сторонних
плагинов.

`openclaw/plugin-sdk/discord` и `openclaw/plugin-sdk/telegram-account` также
сохранены как устаревшие фасады совместимости для отслеживаемого использования владельцем. Не
копируйте эти пути импорта в новые плагины; вместо этого используйте внедренные runtime-помощники и
универсальные подпути SDK каналов.
</Warning>

## Справочник подпутей

SDK плагинов предоставляется как набор узких подпутей, сгруппированных по областям (вход
плагина, канал, провайдер, аутентификация, runtime, capability, память и зарезервированные
помощники встроенных плагинов). Полный каталог — сгруппированный и со ссылками — см. в
[подпутях SDK плагинов](/ru/plugins/sdk-subpaths).

Инвентарь точек входа компилятора находится в
`scripts/lib/plugin-sdk-entrypoints.json`; экспорты пакета генерируются из
публичного подмножества после вычитания локальных для репозитория тестовых/внутренних подпутей, перечисленных в
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Запустите
`pnpm plugin-sdk:surface`, чтобы проверить количество публичных экспортов. Устаревшие публичные
подпути, которые достаточно стары и не используются production-кодом встроенных расширений,
отслеживаются в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; широкие
устаревшие баррели реэкспорта отслеживаются в
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API регистрации

Callback `register(api)` получает объект `OpenClawPluginApi` со следующими
методами:

### Регистрация capability

| Метод                                            | Что он регистрирует                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстовый инференс (LLM)               |
| `api.registerAgentHarness(...)`                  | Экспериментальный низкоуровневый исполнитель агента |
| `api.registerCliBackend(...)`                    | Локальный CLI-бэкенд инференса         |
| `api.registerChannel(...)`                       | Канал сообщений                        |
| `api.registerEmbeddingProvider(...)`             | Переиспользуемый провайдер векторных эмбеддингов |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Потоковая транскрипция в реальном времени |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексные голосовые сеансы в реальном времени |
| `api.registerMediaUnderstandingProvider(...)`    | Анализ изображений/аудио/видео         |
| `api.registerImageGenerationProvider(...)`       | Генерация изображений                  |
| `api.registerMusicGenerationProvider(...)`       | Генерация музыки                       |
| `api.registerVideoGenerationProvider(...)`       | Генерация видео                        |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | Веб-поиск                              |

Провайдеры эмбеддингов, зарегистрированные через `api.registerEmbeddingProvider(...)`, также должны
быть перечислены в `contracts.embeddingProviders` в манифесте плагина. Это
универсальная поверхность эмбеддингов для переиспользуемой генерации векторов. Поиск по памяти
может использовать эту универсальную поверхность провайдера. Более старая
поверхность `api.registerMemoryEmbeddingProvider(...)` и
`contracts.memoryEmbeddingProviders` является устаревшей совместимостью, пока
существующие специфичные для памяти провайдеры мигрируют.

Специфичные для памяти провайдеры, которые все еще предоставляют runtime `batchEmbed(...)`, остаются на
существующем контракте пакетной обработки по файлам, если их runtime явно не задает
`sourceWideBatchEmbed: true`. Это явное включение позволяет хосту памяти отправлять фрагменты из
нескольких измененных файлов памяти и включенных источников в одном вызове `batchEmbed(...)`
в пределах лимитов пакета хоста. Адаптеры пакетной обработки, загружающие JSONL-файлы запросов, должны
разделять задания провайдера до достижения лимита размера загрузки, а также лимита
количества запросов. Провайдер должен возвращать один эмбеддинг на каждый входной фрагмент в том же порядке, что и
`batch.chunks`; опускайте флаг, когда провайдер ожидает локальные для файла пакеты или
не может сохранять порядок входных данных в более крупном задании по всему источнику.

### Инструменты и команды

Используйте [`defineToolPlugin`](/ru/plugins/tool-plugins) для простых плагинов только с инструментами
с фиксированными именами инструментов. Используйте `api.registerTool(...)` напрямую для смешанных плагинов
или полностью динамической регистрации инструментов.

| Метод                           | Что он регистрирует                         |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Инструмент агента (обязательный или `{ optional: true }`) |
| `api.registerCommand(def)`      | Пользовательская команда (обходит LLM)      |

Команды плагина могут задавать `agentPromptGuidance`, когда агенту нужна краткая
принадлежащая команде подсказка маршрутизации. Держите этот текст о самой команде; не добавляйте
специфичную для провайдера или плагина политику в сборщики промптов ядра.

Записи подсказок могут быть устаревшими строками, которые применяются к каждой поверхности промпта, или
структурированными записями:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Структурированные `surfaces` могут включать `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` или `subagent`. `pi_main` остается устаревшим псевдонимом
для `openclaw_main`. Опускайте `surfaces` для намеренной подсказки на всех поверхностях. Не
передавайте пустой массив `surfaces`; он отклоняется, чтобы случайная потеря области действия не
становилась глобальным текстом промпта.

Инструкции разработчика нативного app-server Codex строже, чем другие поверхности промпта:
только подсказки, явно ограниченные `codex_app_server`, продвигаются в
эту дорожку с более высоким приоритетом. Устаревшие строковые подсказки и неограниченные структурированные
подсказки остаются доступными для поверхностей промпта не-Codex ради совместимости.

### Инфраструктура

| Метод                                          | Что он регистрирует                     |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук события                             |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                       |
| `api.registerGatewayDiscoveryService(service)` | Локальный объявитель обнаружения Gateway |
| `api.registerCli(registrar, opts?)`            | Подкоманда CLI                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI функции Node в `openclaw nodes`     |
| `api.registerService(service)`                 | Фоновый сервис                          |
| `api.registerInteractiveHandler(registration)` | Интерактивный обработчик                |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результата инструмента |
| `api.registerMemoryPromptSupplement(builder)`  | Добавочная секция промпта рядом с памятью |
| `api.registerMemoryCorpusSupplement(adapter)`  | Добавочный корпус поиска/чтения памяти  |

### Хостовые хуки для workflow-плагинов

Хостовые хуки — это поверхности SDK для плагинов, которым нужно участвовать в жизненном
цикле хоста, а не только добавлять провайдера, канал или инструмент. Это
универсальные контракты; режим планирования может использовать их, но также могут и workflow согласований,
шлюзы политик workspace, фоновые мониторы, мастера настройки и UI-сопутствующие
плагины.

| Метод                                                                                | Контракт, которым он владеет                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Состояние сессии, принадлежащее плагину, совместимое с JSON и проецируемое через сессии Gateway                                                           |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Устойчивый контекст с семантикой exactly-once, внедряемый в следующий ход агента для одной сессии                                                         |
| `api.registerTrustedToolPolicy(...)`                                                 | Доверенная политика инструмента перед плагином, ограниченная манифестом, которая может блокировать или переписывать параметры инструмента                  |
| `api.registerToolMetadata(...)`                                                      | Отображаемые метаданные каталога инструментов без изменения реализации инструмента                                                                         |
| `api.registerCommand(...)`                                                           | Команды плагина с областью действия; результаты команд могут задавать `continueAgent: true` или `suppressReply: true`; нативные команды Discord поддерживают `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Дескрипторы вкладов Control UI для поверхностей сессии, инструмента, запуска или настроек                                                                 |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Обратные вызовы очистки для ресурсов среды выполнения, принадлежащих плагину, в путях сброса, удаления и перезагрузки                                     |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Санитизированные подписки на события для состояния рабочего процесса и мониторов                                                                           |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Черновое состояние плагина для каждого запуска, очищаемое при терминальном жизненном цикле запуска                                                        |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Метаданные очистки для заданий планировщика, принадлежащих плагину; не планирует работу и не создает записи задач                                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Доставка файловых вложений через хост только для встроенных компонентов в активный прямой исходящий маршрут сессии                                        |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Запланированные ходы сессии на базе Cron только для встроенных компонентов плюс очистка по тегам                                                          |
| `api.session.controls.registerSessionAction(...)`                                    | Типизированные действия сессии, которые клиенты могут отправлять через Gateway                                                                             |

Используйте сгруппированные пространства имен для нового кода плагинов:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Эквивалентные плоские методы остаются доступными как устаревшие совместимые
псевдонимы для существующих плагинов. Не добавляйте новый код плагинов, который
напрямую вызывает `api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` или
`api.unscheduleSessionTurnsByTag`.

`scheduleSessionTurn(...)` — это удобная обертка уровня сессии над планировщиком
Cron в Gateway. Cron владеет временем выполнения и создает фоновую запись задачи,
когда выполняется ход; Plugin SDK только ограничивает целевую сессию, имена,
принадлежащие плагину, и очистку. Используйте `api.runtime.tasks.managedFlows`
внутри запланированного хода, когда самой работе требуется устойчивое
многошаговое состояние TaskFlow.

Контракты намеренно разделяют полномочия:

- Внешние плагины могут владеть расширениями сессий, дескрипторами UI, командами, метаданными
  инструментов, внедрениями в следующий ход и обычными хуками.
- Доверенные политики инструментов выполняются до обычных хуков `before_tool_call` и являются
  доверенными со стороны хоста. Встроенные политики выполняются первыми; политики установленных
  плагинов требуют явного включения плюс их локальных идентификаторов в
  `contracts.trustedToolPolicies` и затем выполняются в порядке загрузки плагинов. Идентификаторы
  политик ограничены регистрирующим плагином.
- Владение зарезервированными командами доступно только встроенным компонентам. Внешним плагинам
  следует использовать собственные имена команд или псевдонимы.
- `allowPromptInjection=false` отключает хуки, изменяющие промпт, включая
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля промпта из устаревшего `before_agent_start` и
  `enqueueNextTurnInjection`.

Примеры потребителей, не относящихся к Plan:

| Архетип плагина               | Используемые хуки                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Рабочий процесс подтверждения | Расширение сессии, продолжение команды, внедрение в следующий ход, дескриптор UI                                                       |
| Шлюз политики бюджета/рабочей области | Доверенная политика инструмента, метаданные инструмента, проекция сессии                                                              |
| Фоновый монитор жизненного цикла | Очистка жизненного цикла среды выполнения, подписка на события агента, владение заданиями планировщика сессии/очистка, вклад heartbeat в промпт, дескриптор UI |
| Мастер настройки или онбординга | Расширение сессии, команды с областью действия, дескриптор Control UI                                                                  |

<Note>
  Зарезервированные пространства имен администрирования ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) всегда остаются `operator.admin`, даже если плагин пытается назначить
  более узкую область метода Gateway. Предпочитайте префиксы, специфичные для плагина,
  для методов, принадлежащих плагину.
</Note>

<Accordion title="Когда использовать middleware результатов инструментов">
  Встроенные плагины и явно включенные установленные плагины с соответствующими
  контрактами манифеста могут использовать `api.registerAgentToolResultMiddleware(...)`, когда
  им нужно переписать результат инструмента после выполнения и до того, как среда выполнения
  вернет этот результат в модель. Это доверенный, нейтральный к среде выполнения
  стык для асинхронных редукторов вывода, таких как tokenjuice.

Плагины должны объявлять `contracts.agentToolResultMiddleware` для каждой целевой
среды выполнения, например `["openclaw", "codex"]`. Установленные плагины без этого
контракта или без явного включения не могут регистрировать этот middleware; оставляйте
обычные хуки плагинов OpenClaw для работы, которой не требуется момент обработки
результата инструмента перед моделью. Старый путь регистрации фабрики расширений,
работавший только для встроенного раннера, удален.
</Accordion>

### Регистрация обнаружения Gateway

`api.registerGatewayDiscoveryService(...)` позволяет плагину объявлять активный
Gateway в локальном транспорте обнаружения, например mDNS/Bonjour. OpenClaw вызывает
сервис во время запуска Gateway, когда локальное обнаружение включено, передает
текущие порты Gateway и несекретные TXT-данные подсказок, а также вызывает возвращенный
обработчик `stop` при завершении работы Gateway.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Плагины обнаружения Gateway не должны считать объявленные TXT-значения секретами или
аутентификацией. Обнаружение — это подсказка маршрутизации; доверие по-прежнему
принадлежит аутентификации Gateway и закреплению TLS.

### Метаданные регистрации CLI

`api.registerCli(registrar, opts?)` принимает два вида метаданных команд:

- `commands`: явные имена команд, принадлежащие регистратору
- `descriptors`: дескрипторы команд времени разбора, используемые для справки CLI,
  маршрутизации и ленивой регистрации CLI плагина
- `parentPath`: необязательный путь родительской команды для вложенных групп команд, например
  `["nodes"]`

Для функций парных узлов предпочитайте
`api.registerNodeCliFeature(registrar, opts?)`. Это небольшая обертка вокруг
`api.registerCli(..., { parentPath: ["nodes"] })`, которая делает команды вроде
`openclaw nodes canvas` явными функциями узлов, принадлежащими плагину.

Если вы хотите, чтобы команда плагина оставалась лениво загружаемой в обычном корневом пути CLI,
предоставьте `descriptors`, которые покрывают каждый корень команды верхнего уровня,
экспортируемый этим регистратором.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Вложенные команды получают разрешенную родительскую команду как `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Используйте `commands` отдельно только тогда, когда вам не нужна ленивая регистрация
корневого CLI. Этот энергичный путь совместимости остается поддерживаемым, но он не устанавливает
заполнители на основе дескрипторов для ленивой загрузки во время разбора.

### Регистрация backend CLI

`api.registerCliBackend(...)` позволяет плагину владеть конфигурацией по умолчанию для локального
AI CLI backend, такого как `claude-cli` или `my-cli`.

- Backend `id` становится префиксом провайдера в ссылках на модели вроде `my-cli/gpt-5`.
- Backend `config` использует ту же форму, что и `agents.defaults.cliBackends.<id>`.
- Пользовательская конфигурация по-прежнему имеет приоритет. OpenClaw объединяет `agents.defaults.cliBackends.<id>` поверх
  значения по умолчанию плагина перед запуском CLI.
- Используйте `normalizeConfig`, когда backend требует переписывания совместимости после объединения
  (например, нормализации старых форм флагов).
- Используйте `resolveExecutionArgs` для переписывания argv в области запроса, относящегося к
  диалекту CLI, например для сопоставления уровней размышления OpenClaw с нативным флагом effort.
  Хук получает `ctx.executionMode`; используйте `"side-question"`, чтобы добавить
  нативные для backend флаги изоляции для эфемерных вызовов `/btw`. Если эти флаги
  надежно отключают нативные инструменты для CLI, который в остальном всегда включен, также объявите
  `sideQuestionToolMode: "disabled"`.

Полное руководство по авторингу см. в
[плагинах backend CLI](/ru/plugins/cli-backend-plugins).

### Эксклюзивные слоты

| Метод                                      | Что он регистрирует                                                                                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Контекстный движок (один активен в каждый момент). Callback-и жизненного цикла получают `runtimeSettings`, когда хост может предоставить диагностику модели/провайдера/режима; старые строгие движки повторяются без этого ключа. |
| `api.registerMemoryCapability(capability)` | Унифицированная возможность памяти                                                                                                                                                                                                |
| `api.registerMemoryPromptSection(builder)` | Построитель раздела промпта памяти                                                                                                                                                                                                |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плана сброса памяти                                                                                                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime памяти                                                                                                                                                                                                            |

### Устаревшие адаптеры эмбеддингов памяти

| Метод                                          | Что он регистрирует                                   |
| ---------------------------------------------- | ----------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер эмбеддингов памяти для активного плагина      |

- `registerMemoryCapability` — предпочтительный эксклюзивный API для плагинов памяти.
- `registerMemoryCapability` также может предоставлять `publicArtifacts.listArtifacts(...)`,
  чтобы сопутствующие плагины могли потреблять экспортированные артефакты памяти через
  `openclaw/plugin-sdk/memory-host-core`, а не обращаться к приватной структуре конкретного
  плагина памяти.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` и
  `registerMemoryRuntime` — эксклюзивные API плагинов памяти, совместимые с legacy.
- `MemoryFlushPlan.model` может закрепить ход сброса за точной ссылкой `provider/model`,
  например `ollama/qwen3:8b`, без наследования активной цепочки fallback.
- `registerMemoryEmbeddingProvider` устарел. Новые провайдеры эмбеддингов
  должны использовать `api.registerEmbeddingProvider(...)` и
  `contracts.embeddingProviders`.
- Существующие провайдеры, специфичные для памяти, продолжают работать в течение окна
  миграции, но инспекция плагинов сообщает об этом как о долге совместимости для
  невстроенных плагинов.

### События и жизненный цикл

| Метод                                        | Что он делает                         |
| -------------------------------------------- | ------------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типизированный хук жизненного цикла   |
| `api.onConversationBindingResolved(handler)` | Callback привязки разговора           |

См. [хуки плагинов](/ru/plugins/hooks) для примеров, распространенных имен хуков и семантики
guard.

### Семантика решений хуков

`before_install` — это хук жизненного цикла runtime плагина, а не поверхность политики
установки оператора. Используйте `security.installPolicy`, когда решение allow/block должно
охватывать пути установки или обновления через CLI и Gateway.

- `before_tool_call`: возврат `{ block: true }` является терминальным. Как только любой обработчик устанавливает его, обработчики с более низким приоритетом пропускаются.
- `before_tool_call`: возврат `{ block: false }` трактуется как отсутствие решения (то же, что и пропуск `block`), а не как переопределение.
- `before_install`: возврат `{ block: true }` является терминальным. Как только любой обработчик устанавливает его, обработчики с более низким приоритетом пропускаются.
- `before_install`: возврат `{ block: false }` трактуется как отсутствие решения (то же, что и пропуск `block`), а не как переопределение.
- `reply_dispatch`: возврат `{ handled: true, ... }` является терминальным. Как только любой обработчик забирает dispatch, обработчики с более низким приоритетом и стандартный путь dispatch модели пропускаются.
- `message_sending`: возврат `{ cancel: true }` является терминальным. Как только любой обработчик устанавливает его, обработчики с более низким приоритетом пропускаются.
- `message_sending`: возврат `{ cancel: false }` трактуется как отсутствие решения (то же, что и пропуск `cancel`), а не как переопределение.
- `message_received`: используйте типизированное поле `threadId`, когда нужна маршрутизация входящих thread/topic. Оставляйте `metadata` для дополнительных данных, специфичных для канала.
- `message_sending`: используйте типизированные поля маршрутизации `replyToId` / `threadId` перед fallback к специфичным для канала `metadata`.
- `gateway_start`: используйте `ctx.config`, `ctx.workspaceDir` и `ctx.getCron?.()` для состояния запуска, принадлежащего gateway, вместо зависимости от внутренних хуков `gateway:startup`.
- `cron_changed`: наблюдайте изменения жизненного цикла cron, принадлежащего gateway. Используйте `event.job?.state?.nextRunAtMs` и `ctx.getCron?.()` при синхронизации внешних планировщиков пробуждения и оставляйте OpenClaw источником истины для проверок срока выполнения и исполнения.

### Поля объекта API

| Поле                     | Тип                       | Описание                                                                                              |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | id плагина                                                                                            |
| `api.name`               | `string`                  | Отображаемое имя                                                                                      |
| `api.version`            | `string?`                 | Версия плагина (необязательно)                                                                        |
| `api.description`        | `string?`                 | Описание плагина (необязательно)                                                                      |
| `api.source`             | `string`                  | Путь к исходному коду плагина                                                                         |
| `api.rootDir`            | `string?`                 | Корневой каталог плагина (необязательно)                                                              |
| `api.config`             | `OpenClawConfig`          | Текущий снимок конфигурации (активный runtime-снимок в памяти, когда доступен)                        |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфигурация, специфичная для плагина, из `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Runtime-хелперы](/ru/plugins/sdk-runtime)                                                               |
| `api.logger`             | `PluginLogger`            | Логгер с областью (`debug`, `info`, `warn`, `error`)                                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Текущий режим загрузки; `"setup-runtime"` — легкое окно запуска/настройки перед полной точкой входа   |
| `api.resolvePath(input)` | `(string) => string`      | Разрешить путь относительно корня плагина                                                             |

## Соглашение о внутренних модулях

Внутри своего плагина используйте локальные barrel-файлы для внутренних импортов:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Никогда не импортируйте собственный плагин через `openclaw/plugin-sdk/<your-plugin>`
  из production-кода. Направляйте внутренние импорты через `./api.ts` или
  `./runtime-api.ts`. Путь SDK — только внешний контракт.
</Warning>

Публичные поверхности встроенных плагинов, загружаемых через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` и похожие публичные файлы входа), предпочитают
активный runtime-снимок конфигурации, когда OpenClaw уже запущен. Если runtime-снимка
еще нет, они используют fallback к разрешенному файлу конфигурации на диске.
Facade-ы упакованных встроенных плагинов должны загружаться через plugin facade loaders
OpenClaw; прямые импорты из `dist/extensions/...` обходят манифест
и проверки runtime sidecar, которые упакованные установки используют для кода, принадлежащего плагину.

Плагины провайдеров могут предоставлять узкий локальный для плагина contract barrel, когда
хелпер намеренно специфичен для провайдера и пока не относится к общему подпути SDK.
Встроенные примеры:

- **Anthropic**: публичная граница `api.ts` / `contract-api.ts` для Claude
  beta-header и stream-хелперов `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` экспортирует построители провайдера,
  хелперы default-model и построители realtime-провайдера.
- **`@openclaw/openrouter-provider`**: `api.ts` экспортирует построитель провайдера
  плюс хелперы onboarding/конфигурации.

<Warning>
  Production-коду расширений также следует избегать импортов `openclaw/plugin-sdk/<other-plugin>`.
  Если хелпер действительно общий, продвиньте его в нейтральный подпуть SDK,
  например `openclaw/plugin-sdk/speech`, `.../provider-model-shared` или другую
  поверхность, ориентированную на возможность, вместо связывания двух плагинов друг с другом.
</Warning>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/ru/plugins/sdk-entrypoints">
    Параметры `definePluginEntry` и `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/ru/plugins/sdk-runtime">
    Полная справка по namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/ru/plugins/sdk-setup">
    Упаковка, манифесты и схемы конфигурации.
  </Card>
  <Card title="Testing" icon="vial" href="/ru/plugins/sdk-testing">
    Тестовые утилиты и правила lint.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/ru/plugins/sdk-migration">
    Миграция с устаревших поверхностей.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/ru/plugins/architecture">
    Глубокая архитектура и модель возможностей.
  </Card>
</CardGroup>
