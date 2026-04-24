---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-24T17:33:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a70b8241344da739b738d1cd6b4754f013212c752d6ca4d9f052d68f0ce8c30
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка є
довідником щодо **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший plugin? Почніть із [Створення plugins](/uk/plugins/building-plugins).
- Channel plugin? Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).
- Provider plugin? Див. [Provider plugins](/uk/plugins/sdk-provider-plugins).
- Tool або plugin із хуком життєвого циклу? Див. [Хуки plugin](/uk/plugins/hooks).
  </Tip>

## Правило імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core`
залишайте для ширшої поверхні umbrella та спільних допоміжних засобів, як-от
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте branded convenience seams для provider або channel (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонують загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні для plugin
  barrel-файли, або додати вузький загальний контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір допоміжних seams для вбудованих plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще присутній у
згенерованій карті export. Вони існують лише для супроводу вбудованих plugins і
не рекомендовані як шляхи імпорту для нових сторонніх plugins.
</Warning>

## Довідник підшляхів

Plugin SDK надається як набір вузьких підшляхів, згрупованих за областями (entry
plugin, channel, provider, auth, runtime, capability, memory і зарезервовані
допоміжні засоби для вбудованих plugins). Повний каталог — згрупований і з
посиланнями — див. у [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Method                                           | Що реєструє                           |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Виведення тексту (LLM)                |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend виведення CLI       |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями           |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео          |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                   |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                      |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                       |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape          |
| `api.registerWebSearchProvider(...)`             | Вебпошук                              |

### Tools і команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Власна команда (оминає LLM)                  |

### Інфраструктура

| Method                                          | Що реєструє                            |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук події                              |
| `api.registerHttpRoute(params)`                 | HTTP-ендпоінт Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)`  | Рекламування локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                         |
| `api.registerService(service)`                  | Фонова служба                          |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                 |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика розширень вбудованого runner для Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Додатковий розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`   | Додатковий корпус пошуку/читання memory |

<Note>
  Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область для gateway method. Для методів, що належать plugin, віддавайте перевагу
  префіксам, специфічним для plugin.
</Note>

<Accordion title="Коли використовувати registerEmbeddedExtensionFactory">
  Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потребує Pi-native
  таймінгу подій під час вбудованих запусків OpenClaw — наприклад, для асинхронних
  переписувань `tool_result`, які мають відбутися до того, як буде надіслано фінальне повідомлення
  з результатом інструмента.

Наразі це seam для вбудованих plugins: лише вбудовані plugins можуть реєструвати його,
і вони мають оголосити `contracts.embeddedExtensionFactories: ["pi"]` у
`openclaw.plugin.json`. Для всього, що не потребує цього низькорівневого seam,
залишайте звичайні хуки plugin OpenClaw.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає змогу plugin рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає службу
під час запуску Gateway, коли локальне виявлення ввімкнено, передає поточні
порти Gateway і не секретні дані-підказки TXT, а також викликає повернутий
обробник `stop` під час зупинки Gateway.

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

Plugins виявлення Gateway не повинні розглядати рекламовані значення TXT як секрети або
автентифікацію. Виявлення — це підказка для маршрутизації; довірою, як і раніше, керують
автентифікація Gateway і TLS pinning.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє реєстратор
- `descriptors`: дескриптори команд на етапі парсингу, які використовуються для довідки root CLI,
  маршрутизації та відкладеної реєстрації plugin CLI

Якщо ви хочете, щоб команда plugin залишалася з відкладеним завантаженням у звичайному root CLI path,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що надається
цим реєстратором.

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
        description: "Керуйте обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, тільки якщо вам не потрібна відкладена реєстрація root CLI.
Цей eager-сумісний шлях залишається підтримуваним, але він не встановлює
заповнювачі на основі descriptor для відкладеного завантаження на етапі парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає змогу plugin володіти конфігурацією за замовчуванням для локального
backend CLI AI, такого як `codex-cli`.

- `id` backend стає префіксом provider у посиланнях на моделі, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значення plugin за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань для сумісності після об’єднання
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг налаштувати доповнення до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість memory                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt для memory                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану flush для memory                                                                                                                     |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                          |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                 |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного plugin |

- `registerMemoryCapability` — рекомендований API ексклюзивного plugin для memory.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супутні plugins могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної
  структури конкретного plugin для memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні з застарілими версіями API ексклюзивних plugins для memory.
- `registerMemoryEmbeddingProvider` дає змогу активному plugin для memory реєструвати один
  або кілька ідентифікаторів adapter embedding (наприклад, `openai`, `gemini` або
  власний ідентифікатор, визначений plugin).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  ідентифікаторами adapter.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

Див. [Хуки plugin](/uk/plugins/hooks) для прикладів, поширених імен хуків і
семантики guard.

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як і пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як і пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для extras, специфічних для channel.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для channel `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість того щоб покладатися на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin                                                                        |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                      |
| `api.rootDir`            | `string?`                 | Коренева директорія plugin (необов’язково)                                                  |
| `api.config`             | `OpenClawConfig`          | Поточний знімок config (активний знімок runtime у пам’яті, коли доступний)                 |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для plugin config із `plugins.entries.<id>.config`                               |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Обчислити шлях відносно кореня plugin                                                       |

## Правило внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні exports для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні exports runtime
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для setup (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, що завантажуються через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному знімку config runtime, коли OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до обчисленого файлу config на диску.

Plugins provider можуть надавати вузький локальний barrel контракту plugin, коли
допоміжний засіб навмисно є специфічним для provider і ще не належить до загального підшляху SDK.
Приклади вбудованих:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і допоміжних засобів потоків `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и provider,
  допоміжні засоби для моделей за замовчуванням і builder-и realtime provider.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder provider
  разом із допоміжними засобами onboarding/config.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на capability, замість зв’язування двох plugins між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору імен `api.runtime`.
  </Card>
  <Card title="Налаштування і config" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми config.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня будова plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель capability.
  </Card>
</CardGroup>
