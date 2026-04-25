---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Карта імпорту, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-25T01:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між плагінами та ядром. Ця сторінка —
довідник про **що імпортувати** і **що можна зареєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший Plugin? Почніть із [Створення плагінів](/uk/plugins/building-plugins).
- Plugin каналу? Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Plugin провайдера? Див. [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins).
- Plugin інструмента або життєвого циклу? Див. [Хуки Plugin](/uk/plugins/hooks).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це забезпечує швидкий
запуск і запобігає проблемам із циклічними залежностями. Для специфічних для каналу
допоміжних засобів entry/build надавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої узагальненої поверхні та спільних допоміжних засобів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, що належить каналу, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і узагальненого збирача. Будь-які
експорти схем із назвами вбудованих каналів на цьому підшляху — це застарілі
експорти для сумісності, а не шаблон для нових плагінів.

<Warning>
  Не імпортуйте з брендових зручних seam для провайдерів або каналів (наприклад,
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни компонують узагальнені підшляхи SDK у власних barrel-файлах `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці локальні
  barrel-файли плагіна, або додати вузький узагальнений контракт SDK, коли потреба справді є
  міжканальною.

Невеликий набір допоміжних seam для вбудованих плагінів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` та подібні) досі присутній у
згенерованій карті експорту. Вони існують лише для супроводу вбудованих плагінів і
не рекомендовані як шляхи імпорту для нових сторонніх плагінів.
</Warning>

## Довідник підшляхів

Plugin SDK надається як набір вузьких підшляхів, згрупованих за областями (entry
плагіна, канал, провайдер, auth, runtime, capability, memory та зарезервовані
допоміжні засоби для вбудованих плагінів). Повний каталог — згрупований і з
посиланнями — див. у [Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capability

| Method                                           | Що реєструє                          |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Текстовий inference (LLM)            |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                    | Локальний backend inference для CLI  |
| `api.registerChannel(...)`                       | Канал повідомлень                    |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)` | Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`         | Двоспрямовані голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                      |
| `api.registerWebFetchProvider(...)`              | Провайдер web fetch / scrape         |
| `api.registerWebSearchProvider(...)`             | Вебпошук                             |

### Інструменти та команди

| Method                          | Що реєструє                                  |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)           |

### Інфраструктура

| Method                                         | Що реєструє                            |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Хук події                              |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | RPC-метод Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Рекламу локального сервісу виявлення Gateway |
| `api.registerCli(registrar, opts?)`            | Підкоманду CLI                         |
| `api.registerService(service)`                 | Фоновий сервіс                         |
| `api.registerInteractiveHandler(registration)` | Інтерактивний обробник                 |
| `api.registerAgentToolResultMiddleware(...)`   | Middleware результату інструмента runtime |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий розділ prompt, суміжний із memory |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий корпус пошуку/читання memory |

<Note>
  Зарезервовані простори імен адміністрування ядра (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо Plugin намагається призначити
  вужчу область методу Gateway. Для методів, що належать Plugin,
  надавайте перевагу префіксам, специфічним для Plugin.
</Note>

<Accordion title="Коли використовувати middleware результату інструмента">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання та до того, як runtime
  поверне цей результат назад у модель. Це довірений нейтральний до runtime seam для
  асинхронних редукторів виводу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; для роботи, якій не потрібен таймінг результату інструмента
до моделі, використовуйте звичайні хуки Plugin OpenClaw. Старий шлях реєстрації вбудованої
фабрики розширення лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає Plugin змогу рекламувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає сервіс
під час запуску Gateway, коли локальне виявлення ввімкнене, передає поточні
порти Gateway і несекретні дані-підказки TXT та викликає повернений обробник
`stop` під час зупинки Gateway.

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
автентифікацію. Виявлення — це підказка для маршрутизації; довірою, автентифікацією Gateway та pinning TLS
і далі керують відповідні механізми.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два типи метаданих верхнього рівня:

- `commands`: явні корені команд, що належать реєстратору
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI Plugin

Якщо ви хочете, щоб команда Plugin залишалася ліниво завантажуваною в звичайному шляху кореневого CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, що відкривається цим
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
        description: "Керує обліковими записами Matrix, верифікацією, пристроями та станом профілю",
        hasSubcommands: true,
      },
    ],
  },
);
```

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-шлях сумісності й далі підтримується, але він не встановлює
placeholder-и на основі дескрипторів для лінивого завантаження на етапі парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає Plugin змогу володіти типовою конфігурацією локального
backend CLI для AI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, як-от `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  типового значення Plugin перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписувань сумісності після злиття
  (наприклад, нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Method                                     | Що реєструє                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Механізм контексту (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб механізм міг адаптувати додавання до prompt. |
| `api.registerMemoryCapability(capability)` | Уніфіковану capability memory                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Конструктор розділу prompt для memory                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Резолвер плану скидання memory                                                                                                                      |
| `api.registerMemoryRuntime(runtime)`       | Адаптер runtime для memory                                                                                                                          |

### Адаптери embedding для memory

| Method                                         | Що реєструє                                   |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding для memory для активного Plugin |

- `registerMemoryCapability` — це бажаний API ексклюзивного Plugin для memory.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супровідні плагіни могли споживати експортовані артефакти memory через
  `openclaw/plugin-sdk/memory-host-core` замість доступу до приватної структури
  конкретного плагіна memory.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — це сумісні зі спадщиною API ексклюзивних плагінів memory.
- `registerMemoryEmbeddingProvider` дає активному плагіну memory змогу реєструвати один
  або більше ідентифікаторів адаптерів embedding (наприклад, `openai`, `gemini` або
  користувацький ідентифікатор, визначений Plugin).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, резолвиться відносно цих зареєстрованих
  ідентифікаторів адаптерів.

### Події та життєвий цикл

| Method                                       | Що робить                    |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Колбек прив’язки розмови     |

Приклади, поширені назви хуків і семантику guard див. у [Хуки Plugin](/uk/plugins/hooks).

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` розглядається як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник бере на себе dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` розглядається як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного потоку/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, що належить Gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Field                    | Type                      | Опис                                                                                         |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор Plugin                                                                         |
| `api.name`               | `string`                  | Відображувана назва                                                                          |
| `api.version`            | `string?`                 | Версія Plugin (необов’язково)                                                                |
| `api.description`        | `string?`                 | Опис Plugin (необов’язково)                                                                  |
| `api.source`             | `string`                  | Шлях до джерела Plugin                                                                       |
| `api.rootDir`            | `string?`                 | Кореневий каталог Plugin (необов’язково)                                                     |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, якщо доступний)            |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для Plugin конфігурація з `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Допоміжні засоби runtime](/uk/plugins/sdk-runtime)                                             |
| `api.logger`             | `PluginLogger`            | Обмежений logger (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Резолвити шлях відносно кореня Plugin                                                        |

## Угода щодо внутрішніх модулів

Усередині вашого Plugin використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Експорти runtime лише для внутрішнього використання
  index.ts          # Точка входу Plugin
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний Plugin через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — це лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих плагінів, завантажувані через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже запущено. Якщо знімок runtime
ще не існує, вони повертаються до резолвленого файлу конфігурації на диску.

Плагіни провайдерів можуть відкривати вузький локальний barrel контракту Plugin, коли
допоміжний засіб навмисно є специфічним для провайдера і ще не належить до узагальненого підшляху SDK.
Приклади вбудованих плагінів:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для
  допоміжних засобів потоку Claude beta-header і `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и провайдера,
  допоміжні засоби типових моделей і builder-и провайдерів realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder провайдера
  разом із допоміжними засобами onboarding/config.

<Warning>
  Production-код розширень також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо допоміжний засіб справді є спільним, підніміть його до нейтрального підшляху SDK,
  наприклад `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на capability, замість того щоб зв’язувати два Plugin між собою.
</Warning>

## Пов’язано

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
  <Card title="Внутрішня будова Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель capability.
  </Card>
</CardGroup>
