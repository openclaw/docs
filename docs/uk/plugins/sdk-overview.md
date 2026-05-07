---
read_when:
    - Потрібно знати, з якого підшляху SDK імпортувати
    - Вам потрібна довідка щодо всіх методів реєстрації в OpenClawPluginApi
    - Ви шукаєте конкретний експорт SDK
sidebarTitle: Plugin SDK overview
summary: Карта імпортів, довідник API реєстрації та архітектура SDK
title: Огляд Plugin SDK
x-i18n:
    generated_at: "2026-05-07T15:11:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

SDK Plugin є типізованим контрактом між plugins і ядром. Ця сторінка є
довідником щодо **того, що імпортувати** і **що можна реєструвати**.

<Note>
  Ця сторінка призначена для авторів plugins, які використовують `openclaw/plugin-sdk/*` всередині
  OpenClaw. Для зовнішніх застосунків, scripts, dashboards, завдань CI та розширень IDE,
  які хочуть запускати агентів через Gateway, натомість використовуйте
  [OpenClaw App SDK](/uk/concepts/openclaw-sdk) і пакет `@openclaw/sdk`.
</Note>

<Tip>
Шукаєте натомість практичний посібник? Почніть із [Створення plugins](/uk/plugins/building-plugins), використовуйте [Channel plugins](/uk/plugins/sdk-channel-plugins) для channel plugins, [Provider plugins](/uk/plugins/sdk-provider-plugins) для provider plugins, [CLI backend plugins](/uk/plugins/cli-backend-plugins) для локальних AI CLI бекендів і [Plugin hooks](/uk/plugins/hooks) для plugins інструментальних або життєвого циклу hooks.
</Tip>

## Угода щодо імпорту

Завжди імпортуйте з конкретного підшляху:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Кожен підшлях є невеликим самодостатнім модулем. Це зберігає швидкий запуск і
запобігає проблемам із циклічними залежностями. Для специфічних для channel помічників entry/build
віддавайте перевагу `openclaw/plugin-sdk/channel-core`; залишайте `openclaw/plugin-sdk/core` для
ширшої парасолькової поверхні та спільних помічників, таких як
`buildChannelConfigSchema`.

Для конфігурації channel публікуйте JSON Schema, якою володіє channel, через
`openclaw.plugin.json#channelConfigs`. Підшлях `plugin-sdk/channel-config-schema`
призначений для спільних примітивів schema і загального builder. Вбудовані plugins OpenClaw
використовують `plugin-sdk/bundled-channel-config-schema` для збережених
схем bundled-channel. Застарілі compatibility exports залишаються в
`plugin-sdk/channel-config-schema-legacy`; жоден підшлях bundled schema не є
шаблоном для нових plugins.

<Warning>
  Не імпортуйте provider- або channel-брендовані зручні seams (наприклад
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Вбудовані plugins компонують загальні підшляхи SDK всередині власних barrels `api.ts` /
  `runtime-api.ts`; споживачі ядра мають або використовувати ці plugin-local
  barrels, або додавати вузький загальний контракт SDK, коли потреба справді є
  cross-channel.

Невеликий набір helper seams bundled-plugin досі з’являється у згенерованій export
map, коли вони мають відстежене використання власниками. Вони існують лише для
супроводу bundled-plugin і не рекомендовані як шляхи імпорту для нових сторонніх
plugins.

`openclaw/plugin-sdk/discord` і `openclaw/plugin-sdk/telegram-account` також
збережені як застарілі compatibility facades для відстеженого використання власниками. Не
копіюйте ці шляхи імпорту в нові plugins; натомість використовуйте ін’єктовані runtime helpers і
загальні підшляхи channel SDK.
</Warning>

## Довідник підшляхів

SDK Plugin відкритий як набір вузьких підшляхів, згрупованих за областями (plugin
entry, channel, provider, auth, runtime, capability, memory і зарезервовані
helper-и bundled-plugin). Повний каталог — згрупований і з посиланнями — див.
[Підшляхи SDK Plugin](/uk/plugins/sdk-subpaths).

Згенерований список із понад 200 підшляхів міститься в `scripts/lib/plugin-sdk-entrypoints.json`.

## API реєстрації

Callback `register(api)` отримує об’єкт `OpenClawPluginApi` з такими
методами:

### Реєстрація capabilities

| Метод                                            | Що він реєструє                        |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Текстовий інференс (LLM)               |
| `api.registerAgentHarness(...)`                  | Експериментальний низькорівневий executor агента |
| `api.registerCliBackend(...)`                    | Локальний CLI backend інференсу        |
| `api.registerChannel(...)`                       | Messaging channel                      |
| `api.registerSpeechProvider(...)`                | Синтез text-to-speech / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming realtime transcription       |
| `api.registerRealtimeVoiceProvider(...)`         | Дуплексні realtime voice sessions      |
| `api.registerMediaUnderstandingProvider(...)`    | Аналіз зображень/аудіо/відео           |
| `api.registerImageGenerationProvider(...)`       | Генерація зображень                    |
| `api.registerMusicGenerationProvider(...)`       | Генерація музики                       |
| `api.registerVideoGenerationProvider(...)`       | Генерація відео                        |
| `api.registerWebFetchProvider(...)`              | Web fetch / scrape provider            |
| `api.registerWebSearchProvider(...)`             | Web search                             |

### Інструменти та команди

| Метод                           | Що він реєструє                              |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Інструмент агента (обов’язковий або `{ optional: true }`) |
| `api.registerCommand(def)`      | Користувацька команда (оминає LLM)           |

Команди Plugin можуть задавати `agentPromptGuidance`, коли агенту потрібна коротка,
належна команді підказка для маршрутизації. Тримайте цей текст про саму команду; не додавайте
provider- або plugin-specific policy до core prompt builders.

### Інфраструктура

| Метод                                          | Що він реєструє                         |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event hook                              |
| `api.registerHttpRoute(params)`                | HTTP endpoint Gateway                   |
| `api.registerGatewayMethod(name, handler)`     | RPC method Gateway                      |
| `api.registerGatewayDiscoveryService(service)` | Локальний Gateway discovery advertiser  |
| `api.registerCli(registrar, opts?)`            | CLI subcommand                          |
| `api.registerNodeCliFeature(registrar, opts?)` | CLI функції Node під `openclaw nodes`   |
| `api.registerService(service)`                 | Background service                      |
| `api.registerInteractiveHandler(registration)` | Interactive handler                     |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime tool-result middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Додатковий memory-adjacent prompt section |
| `api.registerMemoryCorpusSupplement(adapter)`  | Додатковий memory search/read corpus    |

### Host hooks для workflow plugins

Host hooks — це seams SDK для plugins, яким потрібно брати участь у життєвому
циклі host, а не лише додавати provider, channel або tool. Це
загальні контракти; Plan Mode може їх використовувати, але так само можуть workflows затвердження,
workspace policy gates, background monitors, setup wizards і UI companion
plugins.

| Метод                                                                    | Контракт, яким він володіє                                                                                                       |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-owned, JSON-compatible session state, проєктований через Gateway sessions                                                  |
| `api.enqueueNextTurnInjection(...)`                                      | Durable exactly-once context, ін’єктований у наступний хід агента для однієї session                                             |
| `api.registerTrustedToolPolicy(...)`                                     | Bundled/trusted pre-plugin tool policy, що може блокувати або переписувати params tool                                           |
| `api.registerToolMetadata(...)`                                          | Метадані відображення tool catalog без зміни реалізації tool                                                                      |
| `api.registerCommand(...)`                                               | Scoped plugin commands; результати команд можуть задавати `continueAgent: true`; native commands Discord підтримують `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control UI contribution descriptors для поверхонь session, tool, run або settings                                                |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup callbacks для plugin-owned runtime resources на шляхах reset/delete/reload                                               |
| `api.registerAgentEventSubscription(...)`                                | Sanitized event subscriptions для workflow state і monitors                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Per-run plugin scratch state, очищуваний під час terminal run lifecycle                                                          |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-owned session scheduler job records із deterministic cleanup                                                               |

Контракти навмисно розділяють повноваження:

- Зовнішні plugins можуть володіти session extensions, UI descriptors, commands, tool
  metadata, next-turn injections і звичайними hooks.
- Trusted tool policies виконуються перед звичайними hooks `before_tool_call` і є
  bundled-only, бо беруть участь у host safety policy.
- Reserved command ownership є bundled-only. Зовнішні plugins мають використовувати власні
  назви команд або aliases.
- `allowPromptInjection=false` вимикає prompt-mutating hooks, включно з
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  полями prompt зі застарілого `before_agent_start` і
  `enqueueNextTurnInjection`.

Приклади non-Plan споживачів:

| Архетип Plugin              | Використані hooks                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow затвердження       | Session extension, command continuation, next-turn injection, UI descriptor                                                           |
| Budget/workspace policy gate | Trusted tool policy, tool metadata, session projection                                                                                |
| Background lifecycle monitor | Runtime lifecycle cleanup, agent event subscription, session scheduler ownership/cleanup, heartbeat prompt contribution, UI descriptor |
| Setup або onboarding wizard | Session extension, scoped commands, Control UI descriptor                                                                             |

<Note>
  Зарезервовані core admin namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) завжди залишаються `operator.admin`, навіть якщо plugin намагається призначити
  вужчий gateway method scope. Віддавайте перевагу plugin-specific prefixes для
  plugin-owned methods.
</Note>

<Accordion title="Коли використовувати tool-result middleware">
  Bundled plugins можуть використовувати `api.registerAgentToolResultMiddleware(...)`, коли
  їм потрібно переписати результат tool після виконання й до того, як runtime
  передасть цей результат назад у модель. Це trusted runtime-neutral
  seam для async output reducers, таких як tokenjuice.

Пакетні плагіни мають оголошувати `contracts.agentToolResultMiddleware` для кожного
цільового середовища виконання, наприклад `["pi", "codex"]`. Зовнішні плагіни
не можуть реєструвати це проміжне ПЗ; залишайте звичайні хуки плагінів OpenClaw для роботи,
яка не потребує передмодельного таймінгу результатів інструментів. Старий шлях реєстрації
вбудованої фабрики розширень лише для Pi було вилучено.
</Accordion>

### Реєстрація виявлення Gateway

`api.registerGatewayDiscoveryService(...)` дає плагіну змогу оголошувати активний
Gateway у локальному транспорті виявлення, такому як mDNS/Bonjour. OpenClaw викликає
сервіс під час запуску Gateway, коли локальне виявлення ввімкнене, передає
поточні порти Gateway і несекретні TXT-підказки, а під час вимкнення Gateway викликає
повернений обробник `stop`.

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

Плагіни виявлення Gateway не повинні вважати оголошені TXT-значення секретами або
автентифікацією. Виявлення — це підказка маршрутизації; автентифікація Gateway і прив’язка TLS усе ще
відповідають за довіру.

### Метадані реєстрації CLI

`api.registerCli(registrar, opts?)` приймає два види метаданих команд:

- `commands`: явні імена команд, якими володіє реєстратор
- `descriptors`: дескриптори команд під час розбору, що використовуються для довідки CLI,
  маршрутизації та ледачої реєстрації CLI плагіна
- `parentPath`: необов’язковий шлях батьківської команди для вкладених груп команд, наприклад
  `["nodes"]`

Для функцій парних вузлів віддавайте перевагу
`api.registerNodeCliFeature(registrar, opts?)`. Це невелика обгортка навколо
`api.registerCli(..., { parentPath: ["nodes"] })`, яка робить такі команди, як
`openclaw nodes canvas`, явними функціями вузлів, якими володіє плагін.

Якщо потрібно, щоб команда плагіна залишалася ледаче завантажуваною у звичайному кореневому шляху CLI,
надайте `descriptors`, які охоплюють кожен корінь команди верхнього рівня, відкритий цим
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

Використовуйте лише `commands`, тільки якщо вам не потрібна ледача коренева реєстрація CLI.
Цей шлях охочої сумісності й надалі підтримується, але він не встановлює
заповнювачі на основі дескрипторів для ледачого завантаження під час розбору.

### Реєстрація бекенда CLI

`api.registerCliBackend(...)` дає плагіну змогу володіти типовою конфігурацією для локального
бекенда AI CLI, такого як `codex-cli`.

- `id` бекенда стає префіксом провайдера в посиланнях на моделі на кшталт `codex-cli/gpt-5`.
- `config` бекенда використовує ту саму форму, що й `agents.defaults.cliBackends.<id>`.
- Конфігурація користувача все одно має пріоритет. OpenClaw об’єднує `agents.defaults.cliBackends.<id>` поверх
  типового значення плагіна перед запуском CLI.
- Використовуйте `normalizeConfig`, коли бекенду потрібні сумісні переписування після об’єднання
  (наприклад, нормалізація старих форм прапорців).
- Використовуйте `resolveExecutionArgs` для переписувань argv у межах запиту, що належать до
  діалекту CLI, наприклад відображення рівнів мислення OpenClaw у нативний прапорець effort.

Повний посібник з авторства див. у
[плагінах бекенда CLI](/uk/plugins/cli-backend-plugins).

### Ексклюзивні слоти

| Метод                                      | Що він реєструє                                                                                                                                           |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Рушій контексту (одночасно активний лише один). Зворотний виклик `assemble()` отримує `availableTools` і `citationsMode`, щоб рушій міг адаптувати додавання до промпта. |
| `api.registerMemoryCapability(capability)` | Уніфікована можливість пам’яті                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Побудовник секції промпта пам’яті                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Розв’язувач плану скидання пам’яті                                                                                                                        |
| `api.registerMemoryRuntime(runtime)`       | Адаптер середовища виконання пам’яті                                                                                                                      |

### Адаптери embedding пам’яті

| Метод                                          | Що він реєструє                                  |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Адаптер embedding пам’яті для активного плагіна |

- `registerMemoryCapability` — рекомендований ексклюзивний API плагіна пам’яті.
- `registerMemoryCapability` також може відкривати `publicArtifacts.listArtifacts(...)`,
  щоб супутні плагіни могли споживати експортовані артефакти пам’яті через
  `openclaw/plugin-sdk/memory-host-core`, а не звертатися до приватної структури конкретного
  плагіна пам’яті.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` і
  `registerMemoryRuntime` — ексклюзивні API плагіна пам’яті зі збереженням сумісності зі спадщиною.
- `MemoryFlushPlan.model` може прив’язати хід скидання до точного посилання `provider/model`,
  такого як `ollama/qwen3:8b`, без успадкування активного ланцюжка fallback.
- `registerMemoryEmbeddingProvider` дає активному плагіну пам’яті змогу зареєструвати один
  або кілька ідентифікаторів адаптерів embedding (наприклад `openai`, `gemini` або власний
  ідентифікатор, визначений плагіном).
- Конфігурація користувача, така як `agents.defaults.memorySearch.provider` і
  `agents.defaults.memorySearch.fallback`, розв’язується відносно цих зареєстрованих
  ідентифікаторів адаптерів.

### Події та життєвий цикл

| Метод                                        | Що він робить                  |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Типізований хук життєвого циклу |
| `api.onConversationBindingResolved(handler)` | Зворотний виклик прив’язки розмови |

Приклади, поширені імена хуків і семантику запобіжників див. у [хуках Plugin](/uk/plugins/hooks).

### Семантика рішень хуків

- `before_tool_call`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_tool_call`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `before_install`: повернення `{ block: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `before_install`: повернення `{ block: false }` трактується як відсутність рішення (так само, як пропуск `block`), а не як перевизначення.
- `reply_dispatch`: повернення `{ handled: true, ... }` є термінальним. Щойно будь-який обробник заявляє dispatch, обробники з нижчим пріоритетом і типовий шлях dispatch моделі пропускаються.
- `message_sending`: повернення `{ cancel: true }` є термінальним. Щойно будь-який обробник встановлює його, обробники з нижчим пріоритетом пропускаються.
- `message_sending`: повернення `{ cancel: false }` трактується як відсутність рішення (так само, як пропуск `cancel`), а не як перевизначення.
- `message_received`: використовуйте типізоване поле `threadId`, коли потрібна маршрутизація вхідного потоку/теми. Залишайте `metadata` для специфічних для каналу додаткових даних.
- `message_sending`: використовуйте типізовані поля маршрутизації `replyToId` / `threadId`, перш ніж переходити до специфічних для каналу `metadata`.
- `gateway_start`: використовуйте `ctx.config`, `ctx.workspaceDir` і `ctx.getCron?.()` для стану запуску, яким володіє Gateway, замість покладання на внутрішні хуки `gateway:startup`.
- `cron_changed`: спостерігайте за змінами життєвого циклу cron, яким володіє gateway. Використовуйте `event.job?.state?.nextRunAtMs` і `ctx.getCron?.()` під час синхронізації зовнішніх планувальників пробудження та залишайте OpenClaw джерелом істини для перевірок строку виконання й виконання.

### Поля об’єкта API

| Поле                     | Тип                       | Опис                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Ідентифікатор плагіна                                                                       |
| `api.name`               | `string`                  | Відображуване ім’я                                                                          |
| `api.version`            | `string?`                 | Версія плагіна (необов’язково)                                                              |
| `api.description`        | `string?`                 | Опис плагіна (необов’язково)                                                                |
| `api.source`             | `string`                  | Шлях до джерела плагіна                                                                     |
| `api.rootDir`            | `string?`                 | Кореневий каталог плагіна (необов’язково)                                                   |
| `api.config`             | `OpenClawConfig`          | Поточний знімок конфігурації (активний знімок середовища виконання в пам’яті, коли доступний) |
| `api.pluginConfig`       | `Record<string, unknown>` | Специфічна для плагіна конфігурація з `plugins.entries.<id>.config`                         |
| `api.runtime`            | `PluginRuntime`           | [Помічники середовища виконання](/uk/plugins/sdk-runtime)                                      |
| `api.logger`             | `PluginLogger`            | Обмежений за областю logger (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`   | `PluginRegistrationMode`  | Поточний режим завантаження; `"setup-runtime"` — це полегшене вікно запуску/налаштування перед повним entry |
| `api.resolvePath(input)` | `(string) => string`      | Розв’язати шлях відносно кореня плагіна                                                     |

## Угода щодо внутрішніх модулів

У межах свого плагіна використовуйте локальні barrel-файли для внутрішніх імпортів:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Ніколи не імпортуйте власний плагін через `openclaw/plugin-sdk/<your-plugin>`
  з production-коду. Спрямовуйте внутрішні імпорти через `./api.ts` або
  `./runtime-api.ts`. Шлях SDK є лише зовнішнім контрактом.
</Warning>

Публічні поверхні пакетних плагінів, завантажені через facade (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` і подібні публічні entry-файли), віддають перевагу
активному знімку конфігурації середовища виконання, коли OpenClaw уже запущено. Якщо знімка середовища виконання
ще немає, вони повертаються до розв’язаної конфігурації на диску.
Facade пакетних плагінів слід завантажувати через завантажувачі facade плагінів OpenClaw;
прямі імпорти з `dist/extensions/...` обходять маніфест
і перевірки sidecar середовища виконання, які пакетні інсталяції використовують для коду, яким володіє плагін.

Provider plugins можуть надавати вузький локальний для Plugin barrel контракту, коли
helper навмисно є специфічним для provider і ще не належить до узагальненого
підшляху SDK. Вбудовані приклади:

- **Anthropic**: публічний seam `api.ts` / `contract-api.ts` для Claude
  beta-header і stream helpers `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` експортує provider builders,
  default-model helpers і realtime provider builders.
- **`@openclaw/openrouter-provider`**: `api.ts` експортує provider builder
  разом із onboarding/config helpers.

<Warning>
  Production code extension також має уникати імпортів
  `openclaw/plugin-sdk/<other-plugin>`. Якщо helper справді спільний, перенесіть його до нейтрального підшляху SDK,
  як-от `openclaw/plugin-sdk/speech`, `.../provider-model-shared` або іншої
  поверхні, орієнтованої на можливості, замість зв’язування двох plugins між собою.
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
    Пакування, маніфести та config schemas.
  </Card>
  <Card title="Тестування" icon="vial" href="/uk/plugins/sdk-testing">
    Test utilities і lint rules.
  </Card>
  <Card title="Міграція SDK" icon="arrows-turn-right" href="/uk/plugins/sdk-migration">
    Міграція з deprecated surfaces.
  </Card>
  <Card title="Внутрішні механізми Plugin" icon="diagram-project" href="/uk/plugins/architecture">
    Глибока архітектура та модель можливостей.
  </Card>
</CardGroup>
