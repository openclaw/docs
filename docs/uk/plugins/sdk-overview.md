---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:51:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin є типізованим контрактом між Plugin і ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна реєструвати**.

<Note>
  Ця сторінка призначена для авторів Plugin, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, скриптів, панелей моніторингу, завдань CI та розширень IDE,
  які хочуть запускати агентів через Gateway, використовуйте
  [OpenClaw App SDK](/uk/concepts/openclaw-sdk) і пакет `@openclaw/sdk`
  натомість.
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення Plugin](/uk/plugins/building-plugins), використовуйте [Канальні Plugin](/uk/plugins/sdk-channel-plugins) для канальних Plugin, [Provider Plugin](/uk/plugins/sdk-provider-plugins) для Provider Plugin, [Backend Plugin CLI](/uk/plugins/cli-backend-plugins) для локальних AI CLI backend, і [хуки Plugin](/uk/plugins/hooks) для Plugin хуків інструментів або життєвого циклу.
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях є невеликим, самодостатнім модулем. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналів помічників entry/build
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої узагальненої поверхні та спільних помічників, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схеми та загального builder. Вбудовані Plugin OpenClaw
використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються на
`plugin-sdk/channel-config-schema-legacy`; жоден підшлях вбудованих схем не є
шаблоном для нових Plugin.

<Warning>
  Не імпортуйте provider- або channel-брендовані зручні seams (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані Plugin компонують загальні підшляхи SDK всередині власних barrels `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для Plugin
  barrels, або додавати вузький загальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір helper seams вбудованих Plugin досі з'являється у згенерованій мапі експортів,
коли вони мають відстежене використання власником. Вони існують лише для
супроводу вбудованих Plugin і не рекомендовані як шляхи імпорту для нових сторонніх
Plugin.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі фасади сумісності для відстеженого використання власником. Не
копіюйте ці шляхи імпорту в нові Plugin; натомість використовуйте інжектовані runtime helpers і
загальні підшляхи SDK каналів.
</Warning>

## Довідник підшляхів

SDK Plugin надається як набір вузьких підшляхів, згрупованих за областями (entry Plugin,
канал, provider, auth, runtime, capability, memory і зарезервовані
помічники вбудованих Plugin). Повний каталог, згрупований і з посиланнями, дивіться в
[Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).

Інвентар compiler entrypoint розміщений у
`scripts/lib/plugin-sdk-entrypoints.json`; package exports генеруються з
публічної підмножини після віднімання локальних для репозиторію test/internal підшляхів, перелічених у
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Виконайте
`pnpm plugin-sdk:surface`, щоб перевірити кількість публічних експортів. Застарілі публічні
підшляхи, які достатньо старі й не використовуються production-кодом вбудованих extensions, 
відстежуються в `scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; широкі
застарілі barrels повторного експорту відстежуються в
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json`.

## API реєстрації

Callback `register(api)` отримує об'єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Метод                                            | Що він реєструє                        |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий executor агента |
| `api.registerCliBackend(...)`                    | Локальний backend CLI inference        |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями            |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT synthesis         |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                        |
| `api.registerWebFetchProvider(...)`              | Provider web fetch / scrape            |
| `api.registerWebSearchProvider(...)`             | Вебпошук                               |

### Інструменти та команди

| Метод                           | Що він реєструє                              |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов'язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)         |

Команди Plugin можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка,
належна команді підказка маршрутизації. Тримайте цей текст про саму команду; не додавайте
provider- або plugin-specific політику до builder prompt ядра.

### Інфраструктура

| Метод                                          | Що він реєструє                        |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                             |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC method Gateway                     |
| `api.registerGatewayDiscoveryService(service)` | Локальний advertiser виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                         |
| `api.registerNodeCliFeature(registrar, opts?)` | Node feature CLI під `openclaw nodes`  |
| `api.registerService(service)`                 | Фоновий service                        |
| `api.registerInteractiveHandler(registration)` | Інтерактивний handler                  |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Additive memory-adjacent prompt section |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additive memory search/read corpus     |

### Host hooks для workflow Plugin

Host hooks є SDK seams для Plugin, яким потрібно брати участь у життєвому циклі host,
а не лише додавати provider, канал або інструмент. Це
загальні контракти; Plan Mode може їх використовувати, але так само можуть approval workflows,
workspace policy gates, background monitors, setup wizards і UI companion
Plugin.

| Метод                                                                                | Контракт, яким він володіє                                                                                                      |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Належний Plugin, JSON-сумісний стан сесії, спроєктований через сесії Gateway                                                    |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Стійкий контекст exactly-once, інжектований у наступний хід агента для однієї сесії                                             |
| `api.registerTrustedToolPolicy(...)`                                                 | Bundled/trusted pre-plugin політика інструментів, яка може блокувати або переписувати params інструментів                      |
| `api.registerToolMetadata(...)`                                                      | Метадані відображення каталогу інструментів без зміни реалізації інструмента                                                   |
| `api.registerCommand(...)`                                                           | Scoped команди Plugin; результати команд можуть задавати `continueAgent: true`; native команди Discord підтримують `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Дескриптори внеску Control UI для поверхонь session, tool, run або settings                                                    |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Cleanup callbacks для runtime ресурсів, що належать Plugin, на шляхах reset/delete/reload                                      |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Sanitized event subscriptions для workflow state і monitors                                                                     |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Per-run plugin scratch state, очищений на terminal run lifecycle                                                                |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Cleanup metadata для scheduler jobs, що належать Plugin; не планує роботу і не створює task records                            |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Bundled-only host-mediated доставка file attachment до active direct-outbound session route                                     |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Bundled-only Cron-backed scheduled session turns плюс tag-based cleanup                                                        |
| `api.session.controls.registerSessionAction(...)`                                    | Типізовані session actions, які клієнти можуть dispatch через Gateway                                                          |

Використовуйте згруповані namespaces для нового коду Plugin:

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

Еквівалентні flat methods залишаються доступними як застарілі aliases сумісності
для наявних Plugin. Не додавайте новий код Plugin, який викликає
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` або
`api.unscheduleSessionTurnsByTag` напряму.

`scheduleSessionTurn(...)` — це зручна сесійна обгортка над планувальником
Gateway Cron. Cron відповідає за таймінг і створює запис фонової задачі, коли
запускається хід; Plugin SDK лише обмежує цільову сесію, назви, що належать
plugin, і очищення. Використовуйте `api.runtime.tasks.managedFlows` усередині
запланованого ходу, коли сама робота потребує довготривалого багатоетапного
стану TaskFlow.

Контракти навмисно розділяють повноваження:

- Зовнішні plugins можуть володіти розширеннями сесій, дескрипторами UI, командами, метаданими інструментів, ін’єкціями наступного ходу та звичайними хуками.
- Довірені політики інструментів виконуються перед звичайними хуками `before_tool_call` і доступні лише в комплекті, бо вони беруть участь у політиці безпеки хоста.
- Володіння зарезервованими командами доступне лише в комплекті. Зовнішні plugins мають використовувати власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють промпт, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля промпта зі спадкового `before_agent_start` та
  `enqueueNextTurnInjection`.

Приклади споживачів поза Plan:

| Архетип plugin              | Використані хуки                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Робочий процес затвердження            | Розширення сесії, продовження команди, ін’єкція наступного ходу, дескриптор UI                                                            |
| Шлюз політики бюджету/робочого простору | Довірена політика інструментів, метадані інструментів, проєкція сесії                                                                                 |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесії, внесок Heartbeat у промпт, дескриптор UI |
| Майстер налаштування або онбордингу   | Розширення сесії, команди з обмеженою областю дії, дескриптор Control UI                                                                              |

<Note>
  Зарезервовані основні простори назв адміністрування (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область методу gateway. Надавайте перевагу префіксам, специфічним для plugin, для
  методів, що належать plugin.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Plugins, що постачаються в комплекті, можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання й до того, як runtime
  передасть цей результат назад у модель. Це довірена нейтральна до runtime
  межа для асинхронних редукторів виводу, таких як tokenjuice.

Plugins, що постачаються в комплекті, мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні plugins
не можуть реєструвати це middleware; залишайте звичайні хуки OpenClaw plugin для роботи,
яка не потребує таймінгу результату інструмента перед моделлю. Старий шлях реєстрації вбудованої
фабрики розширень лише для Pi видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає plugin змогу оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення ввімкнено, передає
поточні порти Gateway і несекретні дані підказок TXT, а під час завершення роботи Gateway
викликає повернений обробник `stop`.

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

Plugins виявлення Gateway не повинні вважати оголошені значення TXT секретами або
автентифікацією. Виявлення — це підказка маршрутизації; автентифікація Gateway і закріплення TLS усе ще
відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих команд:

- `commands`: явні назви команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі розбору, які використовуються для довідки CLI,
  маршрутизації та лінивої реєстрації CLI plugin
- `parentPath`: необов’язковий шлях батьківської команди для вкладених груп команд, наприклад
  `["nodes"]`

Для функцій парних вузлів надавайте перевагу
`api.registerNodeCliFeature(registrar, opts?)`. Це невелика обгортка навколо
`api.registerCli(..., { parentPath: ["nodes"] })`, яка робить команди на кшталт
`openclaw nodes canvas` явними функціями вузлів, що належать plugin.

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною у звичайному кореневому шляху CLI,
надайте `descriptors`, які покривають кожен корінь команди верхнього рівня, відкритий цим
реєстратором.

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

Вкладені команди отримують розв’язану батьківську команду як `program`:

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

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей шлях сумісності з негайним завантаженням залишається підтримуваним, але він не встановлює
заповнювачі на основі дескрипторів для лінивого завантаження на етапі розбору.

### Реєстрація бекенда CLI

`api.registerCliBackend(...)` дає plugin змогу володіти типовою конфігурацією для локального
бекенда AI CLI, такого як `codex-cli`.

- `id` бекенда стає префіксом провайдера в посиланнях на моделі на кшталт `codex-cli/gpt-5`.
- `config` бекенда використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типових значень plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні переписування сумісності після об’єднання
  (наприклад, нормалізація старих форм прапорців).
- Використовуйте `resolveExecutionArgs` для переписувань argv в області запиту, які належать
  діалекту CLI, наприклад зіставлення рівнів мислення OpenClaw із нативним прапорцем зусилля.

Повний посібник зі створення див.
[plugins бекенда CLI](/uk/plugins/cli-backend-plugins).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний один). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати доповнення до промпта. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу промпта пам’яті                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Розв’язувач плану скидання пам’яті                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                    |

### Адаптери embedding пам’яті

| Метод                                         | Що він реєструє                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного plugin |

- `registerMemoryCapability` — бажаний ексклюзивний API plugin пам’яті.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супутні plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної структури конкретного
  plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі спадком ексклюзивні API plugin пам’яті.
- `MemoryFlushPlan.model` може прив’язати хід скидання до точного посилання
  `provider/model`, такого як `ollama/qwen3:8b`, без успадкування активного ланцюга
  fallback.
- `registerMemoryEmbeddingProvider` дає активному plugin пам’яті змогу зареєструвати один
  або більше id адаптерів embedding (наприклад `openai`, `gemini` або користувацький
  id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу          |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки розмови |

Див. [Хуки Plugin](/uk/plugins/hooks) для прикладів, поширених назв хуків і семантики
запобіжників.

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного потоку/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічних для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу Cron, що належать gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження, і залишайте OpenClaw джерелом істини для перевірок строку виконання та виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                                  |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор Plugin                                                                                  |
| `api.name`               | `string`                  | Відображуване ім’я                                                                                    |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                         |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                           |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                                |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                              |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний runtime-знімок у пам’яті, коли доступний)                     |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для Plugin, з `plugins.entries.<id>.config`                                  |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Логер із визначеною областю (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — легке стартове/налаштувальне вікно перед повним входом |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня Plugin                                                                |

## Угода щодо внутрішніх модулів

Усередині свого Plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Ніколи не імпортуйте власний Plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні вбудованого Plugin, завантажені через фасад (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні вхідні файли), надають перевагу
активному runtime-знімку конфігурації, коли OpenClaw уже запущено. Якщо runtime-знімка
ще немає, вони повертаються до розв’язаного файлу конфігурації на диску.
Пакетовані фасади вбудованого Plugin слід завантажувати через фасадні завантажувачі Plugin
OpenClaw; прямі імпорти з `dist/extensions/...` оминають маніфест
і перевірки runtime-sidecar, які пакетовані встановлення використовують для коду, що належить Plugin.

Provider-плагіни можуть надавати вузький локальний для Plugin контрактний barrel, коли
допоміжний засіб навмисно є специфічним для provider і ще не належить до універсального
підшляху SDK. Вбудовані приклади:

- **Anthropic**: публічна межа `api.ts` / `contract-api.ts` для Claude
  beta-header і stream-допоміжних засобів `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и provider,
  допоміжні засоби для моделей за замовчуванням і builder-и realtime-provider.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder provider
  разом із допоміжними засобами onboarding/config.

<Warning>
  Production-коду Plugin також слід уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді спільний, підніміть його до нейтрального підшляху SDK,
  наприклад `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на capability, замість зв’язування двох Plugin між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору імен `api.runtime`.
  </Card>
  <Card title="Налаштування та конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня архітектура Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель capability.
  </Card>
</CardGroup>
