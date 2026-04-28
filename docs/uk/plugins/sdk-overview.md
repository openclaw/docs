---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник усіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-28T12:00:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c3bd7ae2ca2fbf351442bfd073450b72368e1ab833dbbdccfbe569db5346ce9
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK плагінів є типізованим контрактом між плагінами та ядром. Ця сторінка є
довідником про **що імпортувати** та **що можна реєструвати**.

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення плагінів](/uk/plugins/building-plugins), використовуйте [Плагіни каналів](/uk/plugins/sdk-channel-plugins) для плагінів каналів, [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins) для плагінів провайдерів і [Хуки Plugin](/uk/plugins/hooks) для плагінів інструментів або хуків життєвого циклу.
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях є невеликим самодостатнім модулем. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу помічників входу/збирання
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої загальної поверхні та спільних помічників, як-от
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, якою володіє канал, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і універсального збирача. Вбудовані
плагіни OpenClaw використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем вбудованих каналів. Застарілі експорти сумісності залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден із підшляхів вбудованих схем не є
шаблоном для нових плагінів.

<Warning>
  Не імпортуйте провайдеро- або канально-брендовані зручні шви (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують універсальні підшляхи SDK усередині власних барелів `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні для плагіна
  барели, або додати вузький універсальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір допоміжних швів для вбудованих плагінів усе ще з’являється в згенерованій мапі експортів,
коли для них відстежено використання власником. Вони існують лише для супроводу вбудованих плагінів
і не рекомендовані як шляхи імпорту для нових сторонніх
плагінів.
</Warning>

## Довідник підшляхів

SDK плагінів експонується як набір вузьких підшляхів, згрупованих за областями (вхід
плагіна, канал, провайдер, автентифікація, runtime, можливість, пам’ять і зарезервовані
помічники вбудованих плагінів). Повний каталог — згрупований і з посиланнями — див.
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                            | Що він реєструє                      |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Текстове виведення (LLM)             |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний CLI-бекенд виведення       |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями          |
| `api.registerSpeechProvider(...)`                | Text-to-speech / STT-синтез          |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Провайдер веб-отримання / скрейпінгу |
| `api.registerWebSearchProvider(...)`             | Вебпошук                             |

### Інструменти та команди

| Метод                          | Що він реєструє                              |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)            |

Команди плагінів можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка,
керована командою підказка маршрутизації. Тримайте цей текст про саму команду; не додавайте
політику, специфічну для провайдера або плагіна, до збирачів промптів ядра.

### Інфраструктура

| Метод                                          | Що він реєструє                        |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                              |
| `api.registerHttpRoute(params)`                | HTTP-ендпойнт Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Локальний рекламодавець виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманда CLI                         |
| `api.registerService(service)`                 | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime middleware результатів інструментів |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий суміжний із пам’яттю розділ промпта |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання пам’яті |

### Хостові хуки для плагінів workflow

Хостові хуки — це шви SDK для плагінів, яким потрібно брати участь у життєвому циклі хоста,
а не лише додавати провайдера, канал або інструмент. Це
універсальні контракти; Plan Mode може їх використовувати, але так само можуть workflow затвердження,
гейти політик робочого простору, фонові монітори, майстри налаштування та супровідні UI-плагіни.

| Метод                                                                    | Контракт, яким він володіє                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Стан сесії, яким володіє плагін і який сумісний із JSON, проєктований через сесії Gateway |
| `api.enqueueNextTurnInjection(...)`                                      | Стійкий контекст exactly-once, вставлений у наступний хід агента для однієї сесії |
| `api.registerTrustedToolPolicy(...)`                                     | Вбудована/довірена політика інструментів до плагінів, що може блокувати або переписувати параметри інструмента |
| `api.registerToolMetadata(...)`                                          | Метадані відображення каталогу інструментів без зміни реалізації інструмента |
| `api.registerCommand(...)`                                               | Обмежені за областю команди плагіна; результати команди можуть задавати `continueAgent: true` |
| `api.registerControlUiDescriptor(...)`                                   | Дескриптори внесків Control UI для поверхонь сесії, інструмента, запуску або налаштувань |
| `api.registerRuntimeLifecycle(...)`                                      | Колбеки очищення для runtime-ресурсів, якими володіє плагін, на шляхах reset/delete/reload |
| `api.registerAgentEventSubscription(...)`                                | Санітизовані підписки на події для стану workflow і моніторів |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Чернетковий стан плагіна на один запуск, очищений у кінцевому життєвому циклі запуску |
| `api.registerSessionSchedulerJob(...)`                                   | Записи завдань планувальника сесій, якими володіє плагін, із детермінованим очищенням |

Контракти навмисно розділяють повноваження:

- Зовнішні плагіни можуть володіти розширеннями сесій, UI-дескрипторами, командами, метаданими інструментів, ін’єкціями наступного ходу та звичайними хуками.
- Довірені політики інструментів виконуються перед звичайними хуками `before_tool_call` і є лише вбудованими, бо беруть участь у політиці безпеки хоста.
- Зарезервоване володіння командами є лише вбудованим. Зовнішні плагіни мають використовувати
  власні назви команд або псевдоніми.
- `allowPromptInjection=false` вимикає хуки, що змінюють промпт, зокрема
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  поля промпта зі спадкового `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади споживачів, що не належать до Plan:

| Архетип плагіна              | Використані хуки                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow затвердження        | Розширення сесії, продовження команди, ін’єкція наступного ходу, UI-дескриптор                                                        |
| Гейт політики бюджету/робочого простору | Довірена політика інструментів, метадані інструментів, проєкція сесії                                                                 |
| Фоновий монітор життєвого циклу | Очищення життєвого циклу runtime, підписка на події агента, володіння/очищення планувальника сесій, внесок до промпта Heartbeat, UI-дескриптор |
| Майстер налаштування або онбордингу | Розширення сесії, обмежені за областю команди, дескриптор Control UI                                                                  |

<Note>
  Зарезервовані простори імен адміністратора ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчу область методу gateway. Віддавайте перевагу специфічним для плагіна префіксам для
  методів, якими володіє плагін.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання й до того, як runtime
  передасть цей результат назад у модель. Це довірений runtime-нейтральний
  шов для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; залишайте звичайні хуки плагінів OpenClaw для роботи,
яка не потребує таймінгу результатів інструментів перед моделлю. Старий лише Pi-вбудований
шлях реєстрації фабрики розширення було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає змогу плагіну рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення ввімкнено, передає
поточні порти Gateway і несекретні дані підказок TXT, а також викликає повернений
обробник `stop` під час вимкнення Gateway.

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

Плагіни виявлення Gateway не повинні трактувати рекламовані значення TXT як секрети або
автентифікацію. Виявлення є підказкою маршрутизації; довірою все ще володіють
автентифікація Gateway і TLS pinning.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд часу парсингу, що використовуються для кореневої довідки CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда Plugin залишалася lazy-loaded у звичайному кореневому шляху CLI,
надайте `descriptors`, які охоплюють кожен кореневий top-level command, що його відкриває цей
реєстратор.

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

Використовуйте лише `commands` тільки тоді, коли вам не потрібна lazy root CLI registration.
Цей eager compatibility path залишається підтримуваним, але він не встановлює
descriptor-backed placeholders для lazy loading під час parsing.

### Реєстрація бекенду CLI

`api.registerCliBackend(...)` дає змогу Plugin володіти типовою конфігурацією для локального
AI CLI backend, такого як `codex-cli`.

- Backend `id` стає provider prefix у model refs на кшталт `codex-cli/gpt-5`.
- Backend `config` використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  типового значення Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує compatibility rewrites після merge
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                             |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (один активний одночасно). Callback `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                              |
| `api.registerMemoryPromptSection(builder)` | Builder секції prompt пам’яті                                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану flush пам’яті                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Runtime adapter пам’яті                                                                                                                                     |

### Адаптери embedding пам’яті

| Метод                                          | Що він реєструє                                  |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного Plugin |

- `registerMemoryCapability` є пріоритетним ексклюзивним API для memory-plugin.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супровідні plugins могли споживати експортовані artifacts пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватної структури конкретного
  memory plugin.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` є legacy-compatible ексклюзивними API для memory-plugin.
- `MemoryFlushPlan.model` може прив’язати flush turn до точного посилання `provider/model`,
  такого як `ollama/qwen3:8b`, без успадкування активного fallback chain.
- `registerMemoryEmbeddingProvider` дає активному memory plugin змогу зареєструвати один
  або більше id адаптерів embedding (наприклад, `openai`, `gemini` або custom
  plugin-defined id).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, resolve проти цих зареєстрованих
  id адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                    |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook       |
| `api.onConversationBindingResolved(handler)` | Callback прив’язки розмови       |

Див. [хуки Plugin](/uk/plugins/hooks) для прикладів, поширених назв hook і семантики guard.

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є terminal. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як omission `block`), а не як override.
- `before_install`: повернення `{ block: true }` є terminal. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як omission `block`), а не як override.
- `reply_dispatch`: повернення `{ handled: true, ... }` є terminal. Щойно будь-який handler claims dispatch, handlers із нижчим пріоритетом і default model dispatch path пропускаються.
- `message_sending`: повернення `{ cancel: true }` є terminal. Щойно будь-який handler встановлює його, handlers із нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як omission `cancel`), а не як override.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного thread/topic. Залишайте `metadata` для channel-specific extras.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId` перед fallback до channel-specific `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для startup state, яким володіє Gateway, замість покладання на внутрішні hooks `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу cron, яким володіє Gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх wake schedulers, і залишайте OpenClaw джерелом істини для due checks та виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                              |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                         |
| `api.name`               | `string`                  | Відображувана назва                                                                               |
| `api.version`            | `string?`                 | Версія Plugin (опційно)                                                                           |
| `api.description`        | `string?`                 | Опис Plugin (опційно)                                                                             |
| `api.source`             | `string`                  | Шлях джерела Plugin                                                                               |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (опційно)                                                                |
| `api.config`             | `OpenClawConfig`          | Поточний snapshot конфігурації (активний in-memory runtime snapshot, коли доступний)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для Plugin, з `plugins.entries.<id>.config`                              |
| `api.runtime`            | `PluginRuntime`           | [Runtime helpers](/uk/plugins/sdk-runtime)                                                           |
| `api.logger`             | `PluginLogger`            | Scoped logger (`debug`, `info`, `warn`, `error`)                                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` є lightweight pre-full-entry startup/setup window |
| `api.resolvePath(input)` | `(string) => string`      | Resolve path відносно кореня Plugin                                                               |

## Внутрішня домовленість щодо модулів

У межах вашого Plugin використовуйте local barrel files для внутрішніх imports:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Ніколи не імпортуйте власний Plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production code. Спрямовуйте внутрішні imports через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім contract.
</Warning>

Facade-loaded bundled plugin public surfaces (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні public entry files) надають перевагу
активному runtime config snapshot, коли OpenClaw уже запущений. Якщо runtime
snapshot ще не існує, вони fallback до resolved config file на диску.
Packaged bundled plugin facades слід завантажувати через facade loaders OpenClaw SDK;
прямі imports з `dist/extensions/...` обходять staged runtime dependency mirrors,
які packaged installs використовують для plugin-owned dependencies.

Provider plugins можуть відкривати вузький plugin-local contract barrel, коли
helper навмисно provider-specific і ще не належить до generic SDK
subpath. Bundled examples:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і stream helpers `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує provider builders,
  default-model helpers і realtime provider builders.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує provider builder
  плюс onboarding/config helpers.

<Warning>
  Production code розширення також має уникати imports `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді спільний, підвищте його до нейтрального SDK subpath,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  capability-oriented surface замість coupling двох plugins разом.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник namespace `api.runtime`.
  </Card>
  <Card title="Налаштування та конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Packaging, manifests і config schemas.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Test utilities і lint rules.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція з deprecated surfaces.
  </Card>
  <Card title="Внутрішня архітектура Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та capability model.
  </Card>
</CardGroup>
