---
read_when:
    - Вам потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібен довідник для всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: SDK overview
summary: Import map, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-04-27T11:01:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 205c57492fd2c90c01a87bae34716d6abcf420c7bdc2f51bd3042e52a3872ec6
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Plugin SDK — це типізований контракт між плагінами та core. Ця сторінка —
довідник про **що імпортувати** і **що можна реєструвати**.

<Tip>
  Шукаєте натомість практичний посібник?

- Перший плагін? Почніть із [Створення плагінів](/uk/plugins/building-plugins).
- Плагін каналу? Див. [Плагіни каналів](/uk/plugins/sdk-channel-plugins).
- Плагін провайдера? Див. [Плагіни провайдерів](/uk/plugins/sdk-provider-plugins).
- Плагін інструмента або хука життєвого циклу? Див. [Хуки плагінів](/uk/plugins/hooks).
  </Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях — це невеликий самодостатній модуль. Це пришвидшує запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для каналу
хелперів entry/build віддавайте перевагу `openclaw/plugin-sdk/channel-core`;
`openclaw/plugin-sdk/core` залишайте для ширшої парасолькової поверхні та
спільних хелперів, таких як
`buildChannelConfigSchema`.

Для конфігурації каналу публікуйте JSON Schema, якою володіє канал, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів схем і узагальненого builder. Застарілі
експорти схем вбудованих каналів знаходяться в `plugin-sdk/channel-config-schema-legacy`
лише для сумісності зі вбудованими компонентами; це не шаблон для нових плагінів.

<Warning>
  Не імпортуйте branded convenience seams для провайдерів або каналів (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані плагіни композують узагальнені підшляхи SDK усередині власних barrel-файлів
  `api.ts` / `runtime-api.ts`; споживачі core мають або використовувати ці локальні
  barrel-файли плагіна, або додавати вузький узагальнений контракт SDK, коли потреба
  справді є міжканальною.

Невеликий набір helper seams вбудованих плагінів (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` тощо) усе ще присутній у
згенерованій мапі експортів. Вони існують лише для підтримки вбудованих плагінів і
не рекомендуються як шляхи імпорту для нових сторонніх плагінів.
</Warning>

## Довідник підшляхів

Plugin SDK доступний як набір вузьких підшляхів, згрупованих за областями (entry
плагіна, канал, провайдер, auth, runtime, capability, memory і зарезервовані
хелпери вбудованих плагінів). Повний каталог — згрупований і з посиланнями — див. у
[Підшляхи Plugin SDK](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Колбек `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація можливостей

| Метод                                           | Що реєструє                          |
| ----------------------------------------------- | ------------------------------------ |
| `api.registerProvider(...)`                     | Текстове inferencing (LLM)           |
| `api.registerAgentHarness(...)`                 | Експериментальний низькорівневий виконавець агента |
| `api.registerCliBackend(...)`                   | Локальний backend inferencing CLI    |
| `api.registerChannel(...)`                      | Канал повідомлень                    |
| `api.registerSpeechProvider(...)`               | Синтез text-to-speech / STT          |
| `api.registerRealtimeTranscriptionProvider(...)`| Потокова транскрипція в реальному часі |
| `api.registerRealtimeVoiceProvider(...)`        | Двобічні голосові сесії в реальному часі |
| `api.registerMediaUnderstandingProvider(...)`   | Аналіз зображень/аудіо/відео         |
| `api.registerImageGenerationProvider(...)`      | Генерація зображень                  |
| `api.registerMusicGenerationProvider(...)`      | Генерація музики                     |
| `api.registerVideoGenerationProvider(...)`      | Генерація відео                      |
| `api.registerWebFetchProvider(...)`             | Провайдер web fetch / scrape         |
| `api.registerWebSearchProvider(...)`            | Вебпошук                             |

### Інструменти та команди

| Метод                          | Що реєструє                                  |
| ------------------------------ | -------------------------------------------- |
| `api.registerTool(tool, opts?)`| Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`     | Власна команда (обходить LLM)                |

Команди плагіна можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка
підказка маршрутизації, якою володіє команда. Тримайте цей текст про саму команду;
не додавайте специфічну для провайдера або плагіна політику до builder-ів промптів core.

### Інфраструктура

| Метод                                         | Що реєструє                           |
| --------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`    | Хук події                             |
| `api.registerHttpRoute(params)`               | HTTP-ендпойнт Gateway                 |
| `api.registerGatewayMethod(name, handler)`    | RPC-метод Gateway                     |
| `api.registerGatewayDiscoveryService(service)`| Локальний advertiser виявлення Gateway |
| `api.registerCli(registrar, opts?)`           | Підкоманда CLI                        |
| `api.registerService(service)`                | Фонова служба                         |
| `api.registerInteractiveHandler(registration)`| Інтерактивний handler                 |
| `api.registerAgentToolResultMiddleware(...)`  | Middleware результату інструмента під час виконання |
| `api.registerMemoryPromptSupplement(builder)` | Адитивна секція промпту поруч із пам’яттю |
| `api.registerMemoryCorpusSupplement(adapter)` | Адитивний корпус пошуку/читання пам’яті |

<Note>
  Зарезервовані адміністраторські простори імен core (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо плагін намагається призначити
  вужчий scope методу Gateway. Для методів, якими володіє плагін, віддавайте перевагу
  префіксам, специфічним для плагіна.
</Note>

<Accordion title="Коли використовувати middleware результату інструмента">
  Вбудовані плагіни можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат інструмента після виконання і до того, як runtime
  поверне цей результат назад у модель. Це надійний runtime-neutral seam для
  асинхронних reducer-ів виходу, таких як tokenjuice.

Вбудовані плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового runtime, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це middleware; для роботи, якій не потрібен таймінг
результату інструмента до моделі, використовуйте звичайні хуки плагінів OpenClaw. Старий
шлях реєстрації factory вбудованих extension лише для Pi було видалено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає змогу плагіну рекламувати активний
Gateway через локальний транспорт виявлення, такий як mDNS/Bonjour. OpenClaw викликає службу
під час запуску Gateway, коли локальне виявлення ввімкнене, передає поточні
порти Gateway і не секретні TXT-підказки, а також викликає повернений
handler `stop` під час вимкнення Gateway.

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
автентифікацію. Виявлення — це підказка маршрутизації; довірою й далі керують auth Gateway і pinning TLS.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих верхнього рівня:

- `commands`: явні корені команд, якими володіє registrar
- `descriptors`: дескриптори команд на етапі парсингу, що використовуються для довідки кореневого CLI,
  маршрутизації та лінивої реєстрації CLI плагіна

Якщо ви хочете, щоб команда плагіна лишалася ліниво завантажуваною в нормальному шляху кореневого CLI,
надайте `descriptors`, що покривають кожен корінь команди верхнього рівня, який відкриває цей
registrar.

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

Використовуйте `commands` окремо лише тоді, коли вам не потрібна лінива реєстрація кореневого CLI.
Цей eager-сумісний шлях усе ще підтримується, але він не встановлює
плейсхолдери на основі дескрипторів для лінивого завантаження на етапі парсингу.

### Реєстрація backend CLI

`api.registerCliBackend(...)` дає змогу плагіну володіти конфігурацією за замовчуванням для локального
AI backend CLI, такого як `codex-cli`.

- `id` backend стає префіксом провайдера в посиланнях на моделі, наприклад `codex-cli/gpt-5`.
- `config` backend використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw зливає `agents.defaults.cliBackends.<id>` поверх
  значень плагіна за замовчуванням перед запуском CLI.
- Використовуйте `normalizeConfig`, коли backend потребує переписування для сумісності після злиття
  (наприклад нормалізації старих форм прапорців).

### Ексклюзивні слоти

| Метод                                     | Що реєструє                                                                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`  | Контекстний рушій (одночасно активний лише один). Колбек `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати адитивні промпти. |
| `api.registerMemoryCapability(capability)`| Єдину можливість пам’яті                                                                                                                          |
| `api.registerMemoryPromptSection(builder)`| Builder секції промпту пам’яті                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`   | Resolver плану скидання пам’яті                                                                                                                   |
| `api.registerMemoryRuntime(runtime)`      | Адаптер runtime пам’яті                                                                                                                           |

### Адаптери embedding пам’яті

| Метод                                         | Що реєструє                                  |
| ---------------------------------------------- | -------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryCapability` — рекомендований API ексклюзивного плагіна пам’яті.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супровідні плагіни могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core` замість проникнення в приватну розкладку
  конкретного плагіна пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — застаріло-сумісні API ексклюзивного плагіна пам’яті.
- `registerMemoryEmbeddingProvider` дає змогу активному плагіну пам’яті зареєструвати один
  або кілька ідентифікаторів адаптерів embedding (наприклад `openai`, `gemini` або
  власний ідентифікатор, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, визначається відносно цих зареєстрованих
  ідентифікаторів адаптерів.

### Події та життєвий цикл

| Метод                                       | Що робить                    |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`          | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)`| Колбек прив’язки розмови     |

Див. [Хуки плагінів](/uk/plugins/hooks), щоб переглянути приклади, поширені назви хуків і
семантику guard.

### Семантика рішень у хуках

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и нижчого пріоритету пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и нижчого пріоритету пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який handler бере dispatch на себе, handler-и нижчого пріоритету та стандартний шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який handler встановлює це значення, handler-и нижчого пріоритету пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли вам потрібна маршрутизація вхідного thread/topic. `metadata` залишайте для специфічних для каналу доповнень.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічного для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє Gateway, замість покладання на внутрішні хуки `gateway:startup`.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                           |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор плагіна                                                                          |
| `api.name`               | `string`                  | Назва для відображення                                                                         |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                                 |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                   |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                        |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                      |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок runtime у пам’яті, коли доступний)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для плагіна конфігурація з `plugins.entries.<id>.config`                            |
| `api.runtime`            | `PluginRuntime`           | [Хелпери runtime](/uk/plugins/sdk-runtime)                                                        |
| `api.logger`             | `PluginLogger`            | Логер з областю видимості (`debug`, `info`, `warn`, `error`)                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування до повного entry |
| `api.resolvePath(input)` | `(string) => string`      | Визначення шляху відносно кореня плагіна                                                       |

## Угода щодо внутрішніх модулів

Усередині вашого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Публічні експорти для зовнішніх споживачів
  runtime-api.ts    # Лише внутрішні експорти runtime
  index.ts          # Точка входу плагіна
  setup-entry.ts    # Полегшена точка входу лише для налаштування (необов’язково)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Для внутрішніх імпортів використовуйте `./api.ts` або
  `./runtime-api.ts`. Шлях SDK — лише зовнішній контракт.
</Warning>

Публічні поверхні вбудованих плагінів, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` та подібні публічні entry-файли), надають перевагу
активному знімку конфігурації runtime, коли OpenClaw уже працює. Якщо знімок runtime
ще не існує, вони переходять у резервний режим до визначеного файла конфігурації на диску.

Плагіни провайдерів можуть відкривати вузький локальний контрактний barrel плагіна, коли
helper навмисно є специфічним для провайдера і ще не належить до узагальненого підшляху SDK.
Приклади вбудованих плагінів:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для helper-ів
  beta-header Claude і `service_tier` stream.
- **`@openclaw/openai-provider`**: `api.ts` експортує builder-и провайдера,
  helper-и моделей за замовчуванням і builder-и провайдерів realtime.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує builder провайдера
  разом із helper-ами онбордингу/конфігурації.

<Warning>
  Production-код extension також має уникати імпортів `openclaw/plugin-sdk/<other-plugin>`.
  Якщо helper справді є спільним, підвищте його до нейтрального підшляху SDK,
  такого як `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливість, замість жорсткого зв’язування двох плагінів.
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Точки входу" icon="door-open" href="/uk/plugins/sdk-entrypoints">
    Параметри `definePluginEntry` і `defineChannelPluginEntry`.
  </Card>
  <Card title="Хелпери runtime" icon="gears" href="/uk/plugins/sdk-runtime">
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
  <Card title="Внутрішня будова плагінів" icon="diagram-project" href="/uk/plugins/architecture">
    Поглиблена архітектура та модель можливостей.
  </Card>
</CardGroup>
