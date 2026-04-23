---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник з API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-23T23:27:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7090e13508382a68988f3d345bf12d6f3822c499e01a3affb1fa7a277b22f276
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між plugins і ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший plugin? Почніть із [Створення plugins](/uk/plugins/building-plugins).
- Channel plugin? Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).
- Provider plugin? Див. [Provider plugins](/uk/plugins/sdk-provider-plugins).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої узагальненої поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте branded convenience seams для provider або channel (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонують загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачам ядра слід або використовувати ці локальні для plugin
  barrel-файли, або додати вузький загальний контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір допоміжних seams для вбудованих plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється в
згенерованій карті експортів. Вони існують лише для підтримки вбудованих plugins і
не рекомендовані як шляхи імпорту для нових сторонніх plugins.
</Warning>

## Довідник підшляхів

Plugin SDK надається як набір вузьких підшляхів, згрупованих за областями (plugin
entry, channel, provider, auth, runtime, capability, memory і зарезервовані
допоміжні засоби для вбудованих plugins). Повний каталог — згрупований і з посиланнями — див. у
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                        |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)              |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI    |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями            |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                        |
| `api.registerWebFetchProvider(...)`              | Provider для отримання / скрапінгу вебданих |
| `api.registerWebSearchProvider(...)`             | Вебпошук                               |

### Інструменти та команди

| Метод                          | Що він реєструє                              |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)           |

### Інфраструктура

| Метод                                          | Що він реєструє                          |
| ----------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Хук події                                |
| `api.registerHttpRoute(params)`                 | HTTP-ендпоінт Gateway                    |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                        |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                           |
| `api.registerService(service)`                  | Фоновий сервіс                           |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Фабрика extension для вбудованого runner у Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус пошуку/читання пам’яті  |

<Note>
  Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчу область для методу Gateway. Для методів, що належать plugin, віддавайте перевагу префіксам, специфічним для plugin.
</Note>

<Accordion title="Коли використовувати registerEmbeddedExtensionFactory">
  Використовуйте `api.registerEmbeddedExtensionFactory(...)`, коли plugin потребує Pi-native
  синхронізації подій під час вбудованих запусків OpenClaw — наприклад, для асинхронних переписувань `tool_result`,
  які мають відбутися до того, як буде надіслано фінальне повідомлення з результатом інструмента.

Сьогодні це seam для вбудованих plugins: лише вбудовані plugins можуть реєструвати такий,
і вони мають оголосити `contracts.embeddedExtensionFactories: ["pi"]` у
  `openclaw.plugin.json`. Для всього, що не потребує цього низькорівневого seam, використовуйте звичайні хуки plugin OpenClaw.
</Accordion>

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі розбору, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI plugin

Якщо ви хочете, щоб команда plugin залишалася ліниво завантажуваною в звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, доступний через цей
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
        description: "Керування обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте лише `commands`, тільки якщо вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-сумісний шлях залишається підтримуваним, але він не встановлює
плейсхолдери на основі descriptor для лінивого завантаження на етапі розбору.

### Реєстрація backend для CLI

`api.registerCliBackend(...)` дає змогу plugin володіти типовою конфігурацією для локального
backend AI CLI, такого як `codex-cli`.

- `id` backend стає префіксом provider у посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує сумісних переписувань після об’єднання
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Механізм контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб механізм міг налаштовувати додавання до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість пам’яті                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt для пам’яті                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver плану скидання пам’яті                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime пам’яті                                                                                                                                   |

### Адаптери embedding для пам’яті

| Метод                                         | Що він реєструє                           |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для пам’яті для активного plugin |

- `registerMemoryCapability` — це пріоритетний API ексклюзивного plugin пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супутні plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватної структури
  конкретного plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це legacy-сумісні API ексклюзивного plugin пам’яті.
- `registerMemoryEmbeddingProvider` дозволяє активному plugin пам’яті реєструвати один
  або кілька id адаптерів embedding (наприклад, `openai`, `gemini` або кастомний id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить              |
| -------------------------------------------- | -------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови   |

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере на себе dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для extras, специфічних для channel.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до `metadata`, специфічних для channel.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор plugin                                                                        |
| `api.name`               | `string`                  | Відображувана назва                                                                         |
| `api.version`            | `string?`                 | Версія plugin (необов’язково)                                                               |
| `api.description`        | `string?`                 | Опис plugin (необов’язково)                                                                 |
| `api.source`             | `string`                  | Шлях до джерела plugin                                                                      |
| `api.rootDir`            | `string?`                 | Кореневий каталог plugin (необов’язково)                                                    |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний внутрішній знімок runtime, коли доступний)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Конфігурація, специфічна для plugin, з `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                            |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                               |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначити шлях відносно кореня plugin                                                       |

## Внутрішня угода щодо модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу plugin
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), надають перевагу
активному знімку конфігурації runtime, якщо OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до визначеного файлу конфігурації на диску.

Plugins provider можуть надавати вузький локальний для plugin barrel контракту, коли
певний допоміжний засіб навмисно є специфічним для provider і ще не належить до загального підшляху SDK.
Приклади вбудованих:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і допоміжних засобів потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и provider,
  допоміжні засоби для типових моделей і builder-и provider для realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder provider
  разом із допоміжними засобами для onboarding/конфігурації.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, перенесіть його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість жорсткого зв’язування двох plugins між собою.
</Warning>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Опції `definePluginEntry` і `defineChannelPluginEntry`.
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
  <Card title="Внутрішня будова plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
