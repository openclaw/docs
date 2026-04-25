---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд SDK Plugin
x-i18n:
    generated_at: "2026-04-25T00:02:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac8b101bc7a7c78a88311dc196ba5cacb78c5fe708f0749e47bde6b6d7f1c9df
    source_path: plugins/sdk-overview.md
    workflow: 15
---

SDK Plugin — це типізований контракт між plugins і core. Ця сторінка —
довідник про **що імпортувати** і **що можна зареєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший Plugin? Почніть з [Building plugins](/uk/plugins/building-plugins).
- Plugin каналу? Див. [Channel plugins](/uk/plugins/sdk-channel-plugins).
- Plugin постачальника? Див. [Provider plugins](/uk/plugins/sdk-provider-plugins).
- Plugin інструмента або lifecycle hook? Див. [Plugin hooks](/uk/plugins/hooks).
  </Tip>

## Правило імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` залишайте для
ширшої umbrella-поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

<Warning>
  Не імпортуйте branded convenience seams постачальника або каналу (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонує загальні підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачі core мають або використовувати ці локальні для plugin
  barrel-файли, або додавати вузький загальний контракт SDK, коли потреба справді
  є міжканальною.

Невеликий набір допоміжних seams для вбудованих plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) усе ще з’являється в
згенерованій карті експорту. Вони існують лише для підтримки вбудованих plugins і
не рекомендуються як шляхи імпорту для нових сторонніх plugins.
</Warning>

## Довідник підшляхів

SDK Plugin доступний як набір вузьких підшляхів, згрупованих за областями (plugin
entry, channel, provider, auth, runtime, capability, memory і зарезервовані
допоміжні засоби для вбудованих plugins). Повний каталог — згрупований і з посиланнями — див. у
[Plugin SDK subpaths](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Зворотний виклик `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що він реєструє                     |
| ----------------------------------------------- | ----------------------------------- |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)           |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний бекенд inference CLI      |
| `api.registerChannel(...)`                       | Канал обміну повідомленнями         |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні голосові сеанси в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео        |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                 |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                    |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                     |
| `api.registerWebFetchProvider(...)`              | Постачальник web fetch / scrape     |
| `api.registerWebSearchProvider(...)`             | Вебпошук                            |

### Інструменти й команди

| Метод                          | Що він реєструє                               |
| ------------------------------ | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (обходить LLM)          |

### Інфраструктура

| Метод                                          | Що він реєструє                       |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Event hook                            |
| `api.registerHttpRoute(params)`                 | HTTP-кінцева точка Gateway            |
| `api.registerGatewayMethod(name, handler)`      | RPC-метод Gateway                     |
| `api.registerGatewayDiscoveryService(service)`  | Локальний сервіс анонсування виявлення Gateway |
| `api.registerCli(registrar, opts?)`             | Підкоманда CLI                        |
| `api.registerService(service)`                  | Фоновий сервіс                        |
| `api.registerInteractiveHandler(registration)`  | Інтерактивний обробник                |
| `api.registerAgentToolResultMiddleware(...)`    | Middleware результатів інструментів під час виконання |
| `api.registerEmbeddedExtensionFactory(factory)` | Застаріла фабрика розширень PI        |
| `api.registerMemoryPromptSupplement(builder)`   | Адитивний розділ prompt, суміжний із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)`   | Адитивний корпус пошуку/читання пам’яті |

<Note>
  Зарезервовані простори назв адміністратора core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  вужчу область для методу gateway. Віддавайте перевагу специфічним для plugin префіксам для
  методів, що належать plugin.
</Note>

<Accordion title="Коли використовувати middleware результатів інструментів">
  Вбудовані plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  поверне цей результат назад у модель. Це довірений, нейтральний до runtime seam для
  асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані plugins мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні plugins
не можуть реєструвати це middleware; для роботи, якій не потрібен момент
до подачі результату інструмента в модель, використовуйте звичайні Plugin hooks OpenClaw.
</Accordion>

<Accordion title="Застарілі фабрики розширень Pi">
  `api.registerEmbeddedExtensionFactory(...)` є застарілим. Він залишається
  сумісним seam для вбудованих plugins, яким усе ще потрібні прямі події
  embedded-runner Pi. Нові трансформації результатів інструментів мають
  натомість використовувати `api.registerAgentToolResultMiddleware(...)`.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає Plugin змогу анонсувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає цей
сервіс під час запуску Gateway, коли локальне виявлення ввімкнене, передає
поточні порти Gateway і не секретні TXT-підказки, а потім викликає повернений
обробник `stop` під час завершення роботи Gateway.

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

Plugins виявлення Gateway не повинні вважати опубліковані значення TXT секретами або
автентифікацією. Виявлення — це підказка маршрутизації; довірою, auth Gateway і pinning TLS
усе ще керують окремі механізми.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі розбору, які використовуються для кореневої допомоги CLI,
  маршрутизації та лінивої реєстрації CLI Plugin

Якщо ви хочете, щоб команда Plugin залишалася ліниво завантажуваною у звичайному
кореневому шляху CLI, надайте `descriptors`, що покривають кожен корінь команди верхнього рівня,
який відкриває цей реєстратор.

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

Використовуйте лише `commands`, якщо вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-сумісний шлях залишається підтримуваним, але він не встановлює
placeholder-елементи на основі descriptors для лінивого завантаження на етапі розбору.

### Реєстрація CLI-бекенду

`api.registerCliBackend(...)` дає Plugin змогу володіти типовою конфігурацією локального
AI CLI-бекенду, такого як `codex-cli`.

- `id` бекенду стає префіксом постачальника в посиланнях на моделі, наприклад `codex-cli/gpt-5`.
- `config` бекенду використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. Перед запуском CLI OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  значень Plugin за замовчуванням.
- Використовуйте `normalizeConfig`, якщо бекенду потрібні переписування сумісності після об’єднання
  (наприклад, нормалізація старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що він реєструє                                                                                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати додавання до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану можливість пам’яті                                                                                                                               |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt для пам’яті                                                                                                                       |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання пам’яті                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для пам’яті                                                                                                                                  |

### Адаптери вбудовування пам’яті

| Метод                                         | Що він реєструє                              |
| --------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер вбудовування пам’яті для активного Plugin |

- `registerMemoryCapability` — це рекомендований API ексклюзивного Plugin для пам’яті.
- `registerMemoryCapability` також може надавати `publicArtifacts.listArtifacts(...)`,
  щоб супутні plugins могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість звернення до приватного
  макета конкретного Plugin пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні із застарілими версіями API ексклюзивного Plugin для пам’яті.
- `registerMemoryEmbeddingProvider` дає активному Plugin пам’яті змогу реєструвати один
  або кілька id адаптерів вбудовування (наприклад `openai`, `gemini` або власний id, визначений plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, зіставляється з цими зареєстрованими
  id адаптерів.

### Події та життєвий цикл

| Метод                                       | Що він робить                |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований lifecycle hook   |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

Приклади, поширені назви hooks і семантику guard див. у [Plugin hooks](/uk/plugins/hooks).

### Семантика рішень hook

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` вважається відсутністю рішення (так само, як якщо не вказувати `block`), а не перевизначенням.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` вважається відсутністю рішення (так само, як якщо не вказувати `block`), а не перевизначенням.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере dispatch на себе, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` вважається відсутністю рішення (так само, як якщо не вказувати `cancel`), а не перевизначенням.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідних thread/topic. `metadata` залишайте для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId` перед тим, як переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить gateway, замість покладання на внутрішні hooks `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Id Plugin                                                                                    |
| `api.name`               | `string`                  | Відображувана назва                                                                          |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                  |
| `api.source`             | `string`                  | Шлях до вихідного коду Plugin                                                                |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                     |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний)            |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для Plugin конфігурація з `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                             |
| `api.logger`             | `PluginLogger`            | Logger з областю видимості (`debug`, `info`, `warn`, `error`)                                |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язання шляху відносно кореня plugin                                                     |

## Угода щодо внутрішніх модулів

Усередині вашого plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу Plugin
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний plugin через `openclaw/plugin-sdk/<your-plugin>`
  у production-коді. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих plugins, завантажуваних через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), віддають перевагу
активному знімку конфігурації runtime, якщо OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до розв’язаного файлу конфігурації на диску.

Plugins постачальників можуть відкривати вузький barrel локального контракту plugin, коли
допоміжний засіб навмисно є специфічним для постачальника й поки не належить до
загального підшляху SDK. Приклади вбудованих plugins:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для допоміжних засобів
  beta-header Claude і потоку `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує конструктори постачальника,
  допоміжні засоби для типових моделей і конструктори постачальників realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує конструктор постачальника
  плюс допоміжні засоби onboarding/config.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, підніміть його до нейтрального підшляху SDK,
  наприклад `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість жорсткого зв’язування двох plugins.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Допоміжні засоби runtime" icon="gears" href="/uk/plugins/sdk-runtime">
    Повний довідник простору назв `api.runtime`.
  </Card>
  <Card title="Налаштування і конфігурація" icon="sliders" href="/uk/plugins/sdk-setup">
    Пакування, маніфести та схеми конфігурації.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Утиліти тестування та правила lint.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція із застарілих поверхонь.
  </Card>
  <Card title="Внутрішня будова Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
