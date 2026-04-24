---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-24T20:32:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b7b69a59c39d3abd5c70a1420e2f43da0470f66d283d76f069b0e77a5bf1551
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між плагінами та ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший плагін? Почніть із [Створення плагінів](/uk/plugins/building-plugins).
- Плагін каналу? Дивіться [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Плагін провайдера? Дивіться [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins).
- Плагін інструмента або хука життєвого циклу? Дивіться [Хуки плагінів](/uk/plugins/hooks).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої поверхні-парасольки та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте branded convenience seams для провайдерів або каналів (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни поєднують загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні для плагіна
  barrel-файли, або додати вузький загальний контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір helper seams для вбудованих плагінів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється в
згенерованій карті експортів. Вони існують лише для супроводу вбудованих плагінів і
не рекомендуються як шляхи імпорту для нових сторонніх плагінів.
</Warning>

## Довідник підшляхів

Plugin SDK доступний як набір вузьких підшляхів, згрупованих за областями (entry
плагіна, канал, провайдер, auth, runtime, capability, memory і зарезервовані
helper-модулі для вбудованих плагінів). Повний каталог — згрупований і з посиланнями — дивіться в
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів розміщено в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` із такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                     |
| ------------------------------------------------ | ----------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)           |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями         |
| `api.registerSpeechProvider(...)`                | Синтез мовлення / STT               |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двобічні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео        |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                 |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                    |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                     |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape        |
| `api.registerWebSearchProvider(...)`             | Вебпошук                            |

### Інструменти та команди

| Метод                          | Що він реєструє                             |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)        |

### Інфраструктура

| Метод                                          | Що він реєструє                       |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук події                             |
| `api.registerHttpRoute(params)`                 | HTTP-ендпоінт Gateway                 |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                     |
| `api.registerGatewayDiscoveryService(service)`  | Рекламування локального виявлення Gateway |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                        |
| `api.registerService(service)`                  | Фоновий сервіс                        |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware результатів інструментів harness |
| `api.registerEmbeddedExtensionFactory(factory)` | Застаріла фабрика розширень PI        |
| `api.registerMemoryPromptSupplement(builder)`   | Додатковий розділ промпта, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`   | Додатковий корпус пошуку/читання пам’яті |

<Note>
  Зарезервовані простори назв адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчу область дії для методу gateway. Для методів, що належать плагіну, віддавайте перевагу
  префіксам, специфічним для плагіна.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як harness
  передасть цей результат назад у модель. Це довірений, нейтральний щодо harness
  seam для асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового harness, наприклад `["pi", "codex-app-server"]`. Зовнішні плагіни
не можуть реєструвати це middleware; для роботи, якій не потрібен час обробки
результату інструмента до моделі, залишайте звичайні хуки плагінів OpenClaw.
</Accordion>

<Accordion title="Застарілі фабрики розширень Pi">
  `api.registerEmbeddedExtensionFactory(...)` є застарілим. Він залишається
  сумісним seam для вбудованих плагінів, яким усе ще потрібні прямі події
  embedded-runner Pi. Нові перетворення результатів інструментів натомість мають використовувати
  `api.registerAgentToolResultMiddleware(...)`.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дозволяє плагіну рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає сервіс
під час запуску Gateway, коли локальне виявлення ввімкнене, передає поточні
порти Gateway і несеκретні TXT-підказки, а під час завершення роботи Gateway
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

Плагіни виявлення Gateway не повинні розглядати рекламовані значення TXT як секрети або
автентифікацію. Виявлення — це підказка для маршрутизації; довірою як і раніше керують
автентифікація Gateway і pinning TLS.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для довідки root CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна залишалася ліниво завантажуваною у звичайному шляху root CLI,
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

Використовуйте лише `commands`, тільки якщо вам не потрібна лінива реєстрація root CLI.
Цей eager-сумісний шлях усе ще підтримується, але не встановлює
плейсхолдери на основі дескрипторів для лінивого завантаження під час парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дозволяє плагіну володіти конфігурацією за замовчуванням для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, таких як `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  стандартної конфігурації плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань для сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context engine (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб engine міг адаптувати доповнення до промпта. |
| `api.registerMemoryCapability(capability)` | Єдина можливість пам’яті                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу промпта пам’яті                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                  |

### Адаптери embedding для пам’яті

| Метод                                         | Що він реєструє                              |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для пам’яті для активного плагіна |

- `registerMemoryCapability` — це рекомендований API ексклюзивного плагіна пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб плагіни-супутники могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної структури
  конкретного плагіна пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі старими версіями API ексклюзивного плагіна пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному плагіну пам’яті реєструвати один
  або більше ідентифікаторів адаптерів embedding (наприклад `openai`, `gemini` або
  користувацький ідентифікатор, визначений плагіном).
- Користувацька конфігурація, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  ідентифікаторами адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить               |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови    |

Дивіться [Хуки плагінів](/uk/plugins/hooks), щоб переглянути приклади, поширені назви хуків і
семантику guard.

### Семантика рішень для хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як пропуск `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник перебирає на себе dispatch, обробники з нижчим пріоритетом і стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює це значення, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як пропуск `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідного thread/topic. `metadata` залишайте для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж повертатися до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор плагіна                                                                       |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний внутрішній знімок runtime, коли доступний)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для плагіна, із `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Логер з областю видимості (`debug`, `info`, `warn`, `error`)                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це легке вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня плагіна                                                    |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Легка точка входу лише для setup (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих плагінів, завантажених через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже працює. Якщо знімок runtime
ще не існує, вони повертаються до визначеного файлу конфігурації на диску.

Плагіни провайдерів можуть надавати вузький локальний для плагіна контрактний barrel, коли
допоміжний засіб навмисно є специфічним для провайдера і ще не належить до загального підшляху SDK.
Приклади вбудованих плагінів:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для заголовка бета-функцій Claude
  та допоміжних засобів потоків `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-об’єкти провайдера,
  допоміжні засоби моделей за замовчуванням і builder-об’єкти провайдерів realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder провайдера
  разом із допоміжними засобами onboarding/config.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох плагінів між собою.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору назв `api.runtime`.
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
  <Card title="Внутрішня будова плагінів" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
